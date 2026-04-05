---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Dlaczego narzędzie jest zablokowane: środowisko sandbox, polityka dozwalania/blokowania narzędzi i bramki podwyższonego `exec`'
title: Sandbox vs Tool Policy vs Elevated
x-i18n:
    generated_at: "2026-04-05T13:54:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs Tool Policy vs Elevated

OpenClaw ma trzy powiązane (ale różne) mechanizmy kontroli:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decyduje **gdzie uruchamiane są narzędzia** (Docker vs host).
2. **Polityka narzędzi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decyduje **które narzędzia są dostępne/dozwolone**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) to **wyłącznie dla `exec` furtka obejścia**, aby uruchamiać poza sandboxem, gdy działasz w sandboxie (`gateway` domyślnie lub `node`, gdy cel exec jest skonfigurowany jako `node`).

## Szybkie debugowanie

Użyj inspectora, aby zobaczyć, co OpenClaw _faktycznie_ robi:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Wypisuje on:

- skuteczny tryb/zakres/dostęp do obszaru roboczego sandboxa
- czy sesja jest obecnie uruchomiona w sandboxie (main vs non-main)
- skuteczne allow/deny narzędzi sandboxa (oraz czy pochodzi z agenta/global/default)
- bramki elevated i ścieżki kluczy naprawczych

## Sandbox: gdzie uruchamiane są narzędzia

Sandboxing jest kontrolowany przez `agents.defaults.sandbox.mode`:

- `"off"`: wszystko działa na hoście.
- `"non-main"`: tylko sesje inne niż main są uruchamiane w sandboxie (częsta „niespodzianka” dla grup/kanałów).
- `"all"`: wszystko jest uruchamiane w sandboxie.

Zobacz [Sandboxing](/gateway/sandboxing), aby poznać pełną macierz (zakres, montowania obszaru roboczego, obrazy).

### Bind mounts (szybka kontrola bezpieczeństwa)

- `docker.binds` _przebija_ system plików sandboxa: wszystko, co zamontujesz, będzie widoczne wewnątrz kontenera z ustawionym trybem (`:ro` lub `:rw`).
- Domyślnie używany jest tryb odczyt-zapis, jeśli pominiesz tryb; dla źródeł/sekretów preferuj `:ro`.
- `scope: "shared"` ignoruje bindy per agent (stosowane są tylko bindy globalne).
- OpenClaw weryfikuje źródła bindów dwa razy: najpierw na znormalizowanej ścieżce źródłowej, a potem ponownie po rozwiązaniu przez najgłębszego istniejącego przodka. Ucieczki przez rodzica będącego symlinkiem nie omijają kontroli ścieżek zablokowanych ani dozwolonych katalogów głównych.
- Nieistniejące ścieżki liści również są sprawdzane bezpiecznie. Jeśli `/workspace/alias-out/new-file` rozwiązuje się przez rodzica będącego symlinkiem do zablokowanej ścieżki lub poza skonfigurowane dozwolone katalogi główne, bind zostanie odrzucony.
- Podpięcie `/var/run/docker.sock` skutecznie oddaje kontrolę nad hostem sandboxowi; rób to tylko świadomie.
- Dostęp do obszaru roboczego (`workspaceAccess: "ro"`/`"rw"`) jest niezależny od trybów bindów.

## Polityka narzędzi: które narzędzia istnieją/można wywołać

Znaczenie mają dwie warstwy:

- **Profil narzędzi**: `tools.profile` i `agents.list[].tools.profile` (bazowa allowlista)
- **Profil narzędzi dostawcy**: `tools.byProvider[provider].profile` i `agents.list[].tools.byProvider[provider].profile`
- **Globalna/per-agent polityka narzędzi**: `tools.allow`/`tools.deny` i `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Polityka narzędzi dostawcy**: `tools.byProvider[provider].allow/deny` i `agents.list[].tools.byProvider[provider].allow/deny`
- **Polityka narzędzi sandboxa** (stosowana tylko w sandboxie): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` i `agents.list[].tools.sandbox.tools.*`

Praktyczne zasady:

- `deny` zawsze wygrywa.
- Jeśli `allow` nie jest puste, wszystko inne jest traktowane jako zablokowane.
- Polityka narzędzi to twarda blokada: `/exec` nie może nadpisać zablokowanego narzędzia `exec`.
- `/exec` zmienia tylko domyślne ustawienia sesji dla autoryzowanych nadawców; nie przyznaje dostępu do narzędzi.
  Klucze narzędzi dostawców akceptują `provider` (np. `google-antigravity`) albo `provider/model` (np. `openai/gpt-5.4`).

### Grupy narzędzi (skróty)

Polityki narzędzi (globalne, agenta, sandboxa) obsługują wpisy `group:*`, które rozwijają się do wielu narzędzi:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Dostępne grupy:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` jest akceptowany jako
  alias dla `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `tts`
- `group:openclaw`: wszystkie wbudowane narzędzia OpenClaw (bez pluginów dostawców)

## Elevated: tylko dla `exec` „uruchom na hoście”

Elevated **nie** przyznaje dodatkowych narzędzi; wpływa tylko na `exec`.

- Jeśli działasz w sandboxie, `/elevated on` (lub `exec` z `elevated: true`) uruchamia poza sandboxem (nadal mogą obowiązywać zgody).
- Użyj `/elevated full`, aby pominąć zgody exec dla sesji.
- Jeśli już działasz bezpośrednio, elevated jest w praktyce no-opem (nadal objętym bramkami).
- Elevated **nie** jest ograniczone do Skills i **nie** nadpisuje allow/deny narzędzi.
- Elevated nie przyznaje arbitralnych nadpisań między hostami z `host=auto`; stosuje zwykłe reguły celu exec i zachowuje `node` tylko wtedy, gdy skonfigurowany/czasowy cel sesji to już `node`.
- `/exec` jest oddzielne od elevated. Zmienia tylko domyślne ustawienia exec per sesja dla autoryzowanych nadawców.

Bramki:

- Włączenie: `tools.elevated.enabled` (oraz opcjonalnie `agents.list[].tools.elevated.enabled`)
- Allowlisty nadawców: `tools.elevated.allowFrom.<provider>` (oraz opcjonalnie `agents.list[].tools.elevated.allowFrom.<provider>`)

Zobacz [Elevated Mode](/tools/elevated).

## Typowe poprawki dla „więzienia sandboxa”

### „Narzędzie X zablokowane przez politykę narzędzi sandboxa”

Klucze naprawcze (wybierz jeden):

- Wyłącz sandbox: `agents.defaults.sandbox.mode=off` (lub per agent `agents.list[].sandbox.mode=off`)
- Zezwól na narzędzie wewnątrz sandboxa:
  - usuń je z `tools.sandbox.tools.deny` (lub per agent `agents.list[].tools.sandbox.tools.deny`)
  - albo dodaj je do `tools.sandbox.tools.allow` (lub allow per agent)

### „Myślałem, że to main, dlaczego jest w sandboxie?”

W trybie `"non-main"` klucze grup/kanałów _nie_ są main. Użyj klucza sesji main (pokazywanego przez `sandbox explain`) albo przełącz tryb na `"off"`.

## Zobacz też

- [Sandboxing](/gateway/sandboxing) -- pełna dokumentacja sandboxa (tryby, zakresy, backendy, obrazy)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- nadpisania per agent i priorytety
- [Elevated Mode](/tools/elevated)
