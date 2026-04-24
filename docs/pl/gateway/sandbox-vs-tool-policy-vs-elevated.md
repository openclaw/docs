---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Dlaczego narzędzie jest zablokowane: środowisko wykonawcze sandboxa, polityka allow/deny narzędzi i bramki podwyższonego exec'
title: Sandbox vs polityka narzędzi vs podwyższone uprawnienia
x-i18n:
    generated_at: "2026-04-24T09:11:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw ma trzy powiązane (ale różne) mechanizmy kontroli:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decyduje **gdzie uruchamiane są narzędzia** (backend sandboxa vs host).
2. **Polityka narzędzi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decyduje **które narzędzia są dostępne/dozwolone**.
3. **Podwyższone uprawnienia** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) to **furtka tylko dla exec**, która pozwala uruchamiać poza sandboxem, gdy działasz w sandboxie (`gateway` domyślnie albo `node`, gdy cel exec jest skonfigurowany jako `node`).

## Szybkie debugowanie

Użyj inspektora, aby zobaczyć, co OpenClaw _naprawdę_ robi:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Wypisuje on:

- efektywny tryb/zakres/dostęp do obszaru roboczego sandboxa
- czy sesja jest obecnie uruchomiona w sandboxie (main vs non-main)
- efektywną allow/deny politykę narzędzi sandboxa (oraz czy pochodzi z agenta/globalnej/domyslnej konfiguracji)
- bramki podwyższonych uprawnień i ścieżki kluczy konfiguracji do naprawy

## Sandbox: gdzie uruchamiane są narzędzia

Sandboxing jest kontrolowany przez `agents.defaults.sandbox.mode`:

- `"off"`: wszystko działa na hoście.
- `"non-main"`: tylko sesje niebędące main są uruchamiane w sandboxie (częsta „niespodzianka” dla grup/kanałów).
- `"all"`: wszystko jest uruchamiane w sandboxie.

Zobacz [Sandboxing](/pl/gateway/sandboxing), aby poznać pełną macierz (zakres, montowania obszaru roboczego, obrazy).

### Montowania bind (szybka kontrola bezpieczeństwa)

- `docker.binds` _przebija_ system plików sandboxa: wszystko, co zamontujesz, jest widoczne wewnątrz kontenera z ustawionym trybem (`:ro` lub `:rw`).
- Domyślnie tryb to odczyt-zapis, jeśli go pominiesz; dla źródeł/sekretów preferuj `:ro`.
- `scope: "shared"` ignoruje montowania per agent (stosowane są tylko montowania globalne).
- OpenClaw waliduje źródła bindów dwukrotnie: najpierw na znormalizowanej ścieżce źródłowej, a potem ponownie po rozwiązaniu przez najgłębszego istniejącego przodka. Ucieczki przez nadrzędny link symboliczny nie omijają kontroli zablokowanych ścieżek ani dozwolonych katalogów głównych.
- Nieistniejące ścieżki końcowe również są sprawdzane bezpiecznie. Jeśli `/workspace/alias-out/new-file` rozwiązuje się przez rodzica będącego linkiem symbolicznym do zablokowanej ścieżki lub poza skonfigurowanymi dozwolonymi katalogami głównymi, bind zostaje odrzucony.
- Powiązanie `/var/run/docker.sock` w praktyce przekazuje sandboxowi kontrolę nad hostem; rób to tylko świadomie.
- Dostęp do obszaru roboczego (`workspaceAccess: "ro"`/`"rw"`) jest niezależny od trybów bindów.

## Polityka narzędzi: które narzędzia istnieją/mogą być wywołane

Znaczenie mają dwie warstwy:

- **Profil narzędzi**: `tools.profile` i `agents.list[].tools.profile` (bazowa allowlista)
- **Profil narzędzi dostawcy**: `tools.byProvider[provider].profile` i `agents.list[].tools.byProvider[provider].profile`
- **Globalna/per-agent polityka narzędzi**: `tools.allow`/`tools.deny` i `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Polityka narzędzi dostawcy**: `tools.byProvider[provider].allow/deny` i `agents.list[].tools.byProvider[provider].allow/deny`
- **Polityka narzędzi sandboxa** (dotyczy tylko pracy w sandboxie): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` i `agents.list[].tools.sandbox.tools.*`

Zasady praktyczne:

- `deny` zawsze wygrywa.
- Jeśli `allow` nie jest puste, wszystko inne jest traktowane jako zablokowane.
- Polityka narzędzi to twarde zatrzymanie: `/exec` nie może nadpisać zablokowanego narzędzia `exec`.
- `/exec` zmienia tylko domyślne ustawienia sesji dla autoryzowanych nadawców; nie przyznaje dostępu do narzędzi.
  Klucze narzędzi dostawcy akceptują `provider` (np. `google-antigravity`) albo `provider/model` (np. `openai/gpt-5.4`).

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` jest akceptowane
  jako alias dla `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: wszystkie wbudowane narzędzia OpenClaw (bez Pluginów dostawców)

## Podwyższone uprawnienia: exec-only „uruchom na hoście”

Podwyższone uprawnienia **nie** przyznają dodatkowych narzędzi; wpływają tylko na `exec`.

- Jeśli działasz w sandboxie, `/elevated on` (albo `exec` z `elevated: true`) uruchamia poza sandboxem (zatwierdzenia nadal mogą mieć zastosowanie).
- Użyj `/elevated full`, aby pominąć zatwierdzenia exec dla sesji.
- Jeśli już działasz bezpośrednio, podwyższone uprawnienia są w praktyce no-op (nadal objętym bramkami).
- Podwyższone uprawnienia **nie** są ograniczone do Skill i **nie** nadpisują allow/deny narzędzi.
- Podwyższone uprawnienia nie przyznają dowolnych nadpisań między hostami z `host=auto`; podążają za normalnymi regułami celu exec i zachowują `node` tylko wtedy, gdy skonfigurowany/czasu sesji cel już ma wartość `node`.
- `/exec` jest oddzielone od podwyższonych uprawnień. Dopasowuje tylko domyślne ustawienia exec per sesja dla autoryzowanych nadawców.

Bramki:

- Włączenie: `tools.elevated.enabled` (i opcjonalnie `agents.list[].tools.elevated.enabled`)
- Allowlisty nadawców: `tools.elevated.allowFrom.<provider>` (i opcjonalnie `agents.list[].tools.elevated.allowFrom.<provider>`)

Zobacz [Tryb podwyższony](/pl/tools/elevated).

## Typowe poprawki „więzienia sandboxa”

### „Narzędzie X zablokowane przez politykę narzędzi sandboxa”

Klucze naprawcze (wybierz jeden):

- Wyłącz sandbox: `agents.defaults.sandbox.mode=off` (albo per agent `agents.list[].sandbox.mode=off`)
- Zezwól na narzędzie wewnątrz sandboxa:
  - usuń je z `tools.sandbox.tools.deny` (albo per agent `agents.list[].tools.sandbox.tools.deny`)
  - albo dodaj je do `tools.sandbox.tools.allow` (albo do allow per agent)

### „Myślałem, że to main, dlaczego jest uruchomione w sandboxie?”

W trybie `"non-main"` klucze grup/kanałów _nie_ są main. Użyj klucza sesji main (pokazanego przez `sandbox explain`) albo przełącz tryb na `"off"`.

## Powiązane

- [Sandboxing](/pl/gateway/sandboxing) -- pełna dokumentacja sandboxa (tryby, zakresy, backendy, obrazy)
- [Sandbox i narzędzia Multi-Agent](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent i priorytety
- [Tryb podwyższony](/pl/tools/elevated)
