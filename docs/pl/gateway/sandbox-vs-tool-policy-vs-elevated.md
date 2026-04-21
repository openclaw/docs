---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Dlaczego narzędzie jest blokowane: runtime sandbox, polityka dozwalania/blokowania narzędzi oraz bramki exec z podniesionymi uprawnieniami'
title: Sandbox vs polityka narzędzi vs podniesione uprawnienia
x-i18n:
    generated_at: "2026-04-21T09:54:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs polityka narzędzi vs podniesione uprawnienia

OpenClaw ma trzy powiązane (ale różne) mechanizmy kontroli:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decyduje **gdzie uruchamiane są narzędzia** (backend sandbox vs host).
2. **Polityka narzędzi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decyduje **które narzędzia są dostępne/dozwolone**.
3. **Podniesione uprawnienia** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) to **mechanizm ucieczki tylko dla exec**, pozwalający uruchamiać poza sandboxem, gdy działasz w sandboxie (`gateway` domyślnie albo `node`, gdy cel exec jest skonfigurowany jako `node`).

## Szybkie debugowanie

Użyj inspektora, aby zobaczyć, co OpenClaw _naprawdę_ robi:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Wyświetla on:

- efektywny tryb/zakres sandbox i dostęp do workspace
- czy sesja jest obecnie w sandboxie (main vs non-main)
- efektywną politykę allow/deny narzędzi sandboxa (oraz skąd pochodzi: agent/global/default)
- bramki podniesionych uprawnień i ścieżki kluczy do naprawy

## Sandbox: gdzie uruchamiane są narzędzia

Sandboxing jest kontrolowany przez `agents.defaults.sandbox.mode`:

- `"off"`: wszystko działa na hoście.
- `"non-main"`: tylko sesje non-main są objęte sandboxem (częste „zaskoczenie” dla grup/kanałów).
- `"all"`: wszystko jest w sandboxie.

Pełną macierz znajdziesz w [Sandboxing](/pl/gateway/sandboxing) (zakres, montowania workspace, obrazy).

### Bind mounts (szybka kontrola bezpieczeństwa)

- `docker.binds` _przebija_ system plików sandboxa: wszystko, co zamontujesz, jest widoczne wewnątrz kontenera z ustawionym trybem (`:ro` lub `:rw`).
- Domyślnie jest to odczyt-zapis, jeśli pominiesz tryb; dla źródeł/sekretów preferuj `:ro`.
- `scope: "shared"` ignoruje bindy per agent (obowiązują tylko bindy globalne).
- OpenClaw sprawdza źródła bindów dwa razy: najpierw na znormalizowanej ścieżce źródłowej, a potem ponownie po rozwiązaniu przez najgłębszego istniejącego przodka. Ucieczki przez rodzica będącego symlinkiem nie omijają kontroli zablokowanych ścieżek ani dozwolonych katalogów głównych.
- Nieistniejące ścieżki końcowe też są bezpiecznie sprawdzane. Jeśli `/workspace/alias-out/new-file` rozwiązuje się przez rodzica będącego symlinkiem do zablokowanej ścieżki albo poza skonfigurowanymi dozwolonymi katalogami głównymi, bind zostanie odrzucony.
- Zamontowanie `/var/run/docker.sock` w praktyce oddaje kontrolę nad hostem sandboxowi; rób to tylko celowo.
- Dostęp do workspace (`workspaceAccess: "ro"`/`"rw"`) jest niezależny od trybów bindów.

## Polityka narzędzi: które narzędzia istnieją/mogą być wywoływane

Istotne są dwie warstwy:

- **Profil narzędzi**: `tools.profile` i `agents.list[].tools.profile` (bazowa lista dozwolonych)
- **Profil narzędzi providera**: `tools.byProvider[provider].profile` i `agents.list[].tools.byProvider[provider].profile`
- **Globalna/per-agent polityka narzędzi**: `tools.allow`/`tools.deny` i `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Polityka narzędzi providera**: `tools.byProvider[provider].allow/deny` i `agents.list[].tools.byProvider[provider].allow/deny`
- **Polityka narzędzi sandboxa** (stosowana tylko w sandboxie): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` i `agents.list[].tools.sandbox.tools.*`

Praktyczne zasady:

- `deny` zawsze wygrywa.
- Jeśli `allow` nie jest puste, wszystko inne jest traktowane jako zablokowane.
- Polityka narzędzi to twarda blokada: `/exec` nie może nadpisać zablokowanego narzędzia `exec`.
- `/exec` zmienia tylko domyślne ustawienia sesji dla autoryzowanych nadawców; nie nadaje dostępu do narzędzi.
  Klucze narzędzi providera akceptują albo `provider` (np. `google-antigravity`), albo `provider/model` (np. `openai/gpt-5.4`).

### Grupy narzędzi (skróty)

Polityki narzędzi (globalne, per agent, sandbox) obsługują wpisy `group:*`, które rozwijają się do wielu narzędzi:

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
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: wszystkie wbudowane narzędzia OpenClaw (z wyłączeniem pluginów providerów)

## Podniesione uprawnienia: tylko dla exec „uruchom na hoście”

Podniesione uprawnienia **nie** nadają dodatkowych narzędzi; wpływają tylko na `exec`.

- Jeśli działasz w sandboxie, `/elevated on` (albo `exec` z `elevated: true`) uruchamia poza sandboxem (zatwierdzenia nadal mogą obowiązywać).
- Użyj `/elevated full`, aby pominąć zatwierdzenia exec dla sesji.
- Jeśli już działasz bezpośrednio, podniesione uprawnienia są w praktyce no-opem (nadal objętym bramkami).
- Podniesione uprawnienia **nie** są ograniczane do Skills i **nie** nadpisują `allow/deny` dla narzędzi.
- Podniesione uprawnienia nie dają arbitralnych nadpisań między hostami z `host=auto`; stosują normalne reguły celu exec i zachowują `node` tylko wtedy, gdy skonfigurowany/docelowy cel sesji już jest `node`.
- `/exec` jest oddzielne od podniesionych uprawnień. Dostosowuje tylko domyślne ustawienia exec per sesja dla autoryzowanych nadawców.

Bramki:

- Włączenie: `tools.elevated.enabled` (i opcjonalnie `agents.list[].tools.elevated.enabled`)
- Listy dozwolonych nadawców: `tools.elevated.allowFrom.<provider>` (i opcjonalnie `agents.list[].tools.elevated.allowFrom.<provider>`)

Zobacz [Tryb podniesionych uprawnień](/pl/tools/elevated).

## Typowe poprawki „więzienia sandboxa”

### „Narzędzie X zablokowane przez politykę narzędzi sandboxa”

Klucze naprawcze (wybierz jeden):

- Wyłącz sandbox: `agents.defaults.sandbox.mode=off` (albo per agent `agents.list[].sandbox.mode=off`)
- Zezwól na narzędzie w sandboxie:
  - usuń je z `tools.sandbox.tools.deny` (albo per agent `agents.list[].tools.sandbox.tools.deny`)
  - albo dodaj do `tools.sandbox.tools.allow` (albo do listy allow per agent)

### „Myślałem, że to main, dlaczego jest w sandboxie?”

W trybie `"non-main"` klucze grup/kanałów _nie_ są main. Użyj klucza sesji main (pokazanego przez `sandbox explain`) albo zmień tryb na `"off"`.

## Zobacz także

- [Sandboxing](/pl/gateway/sandboxing) -- pełne odniesienie do sandboxa (tryby, zakresy, backendy, obrazy)
- [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent i priorytety
- [Tryb podniesionych uprawnień](/pl/tools/elevated)
