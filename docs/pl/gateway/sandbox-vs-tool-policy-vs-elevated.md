---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Dlaczego narzędzie jest blokowane: środowisko uruchomieniowe piaskownicy, zasady zezwalania/blokowania narzędzi oraz bramki podwyższonego wykonywania poleceń'
title: Piaskownica a polityka narzędzi a podwyższone uprawnienia
x-i18n:
    generated_at: "2026-05-10T19:37:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw ma trzy powiązane (ale różne) mechanizmy kontroli:

1. **Piaskownica** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decyduje, **gdzie uruchamiane są narzędzia** (backend piaskownicy albo host).
2. **Zasady narzędzi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decydują, **które narzędzia są dostępne/dozwolone**.
3. **Tryb podwyższony** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) to **wyłącznie dla `exec` awaryjne wyjście** umożliwiające uruchamianie poza piaskownicą, gdy pracujesz w piaskownicy (domyślnie `gateway`, albo `node`, gdy cel `exec` jest skonfigurowany jako `node`).

## Szybkie debugowanie

Użyj inspektora, aby zobaczyć, co OpenClaw _faktycznie_ robi:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Wypisuje:

- efektywny tryb/zakres piaskownicy i dostęp do obszaru roboczego
- czy sesja jest obecnie w piaskownicy (główna kontra niegłówna)
- efektywne zezwolenia/blokady narzędzi piaskownicy (oraz czy pochodzą z agenta, konfiguracji globalnej czy wartości domyślnych)
- bramki trybu podwyższonego i ścieżki kluczy naprawczych

## Piaskownica: gdzie uruchamiane są narzędzia

Piaskownica jest kontrolowana przez `agents.defaults.sandbox.mode`:

- `"off"`: wszystko uruchamia się na hoście.
- `"non-main"`: tylko sesje niegłówne są uruchamiane w piaskownicy (częsta „niespodzianka” w grupach/kanałach).
- `"all"`: wszystko jest uruchamiane w piaskownicy.

Zobacz [Piaskownica](/pl/gateway/sandboxing), aby poznać pełną macierz (zakres, montowania obszaru roboczego, obrazy).

### Montowania bind (szybka kontrola bezpieczeństwa)

- `docker.binds` _przebija_ system plików piaskownicy: wszystko, co zamontujesz, jest widoczne w kontenerze z ustawionym trybem (`:ro` albo `:rw`).
- Domyślnie używany jest tryb odczyt-zapis, jeśli pominiesz tryb; dla źródeł/sekretów preferuj `:ro`.
- `scope: "shared"` ignoruje montowania per agent (stosowane są tylko montowania globalne).
- OpenClaw sprawdza źródła montowań bind dwukrotnie: najpierw na znormalizowanej ścieżce źródłowej, a potem ponownie po rozwiązaniu przez najgłębszego istniejącego przodka. Ucieczki przez dowiązania symboliczne w katalogach nadrzędnych nie omijają kontroli zablokowanych ścieżek ani dozwolonych katalogów głównych.
- Nieistniejące ścieżki końcowe nadal są bezpiecznie sprawdzane. Jeśli `/workspace/alias-out/new-file` rozwiązuje się przez nadrzędne dowiązanie symboliczne do zablokowanej ścieżki albo poza skonfigurowane dozwolone katalogi główne, montowanie bind zostaje odrzucone.
- Montowanie `/var/run/docker.sock` w praktyce przekazuje piaskownicy kontrolę nad hostem; rób to tylko świadomie.
- Dostęp do obszaru roboczego (`workspaceAccess: "ro"`/`"rw"`) jest niezależny od trybów montowania bind.

## Zasady narzędzi: które narzędzia istnieją/są wywoływalne

Znaczenie mają dwie warstwy:

- **Profil narzędzi**: `tools.profile` i `agents.list[].tools.profile` (bazowa lista dozwolonych)
- **Profil narzędzi dostawcy**: `tools.byProvider[provider].profile` i `agents.list[].tools.byProvider[provider].profile`
- **Globalne/per agent zasady narzędzi**: `tools.allow`/`tools.deny` i `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Zasady narzędzi dostawcy**: `tools.byProvider[provider].allow/deny` i `agents.list[].tools.byProvider[provider].allow/deny`
- **Zasady narzędzi piaskownicy** (obowiązują tylko w piaskownicy): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` i `agents.list[].tools.sandbox.tools.*`

Praktyczne reguły:

- `deny` zawsze wygrywa.
- Jeśli `allow` nie jest puste, wszystko inne jest traktowane jako zablokowane.
- Zasady narzędzi są twardą blokadą: `/exec` nie może nadpisać odmowy dla narzędzia `exec`.
- Zasady narzędzi filtrują dostępność narzędzi według nazwy; nie sprawdzają skutków ubocznych wewnątrz `exec`. Jeśli `exec` jest dozwolone, odmowa dla `write`, `edit` albo `apply_patch` nie sprawia, że polecenia powłoki stają się tylko do odczytu.
- `/exec` zmienia tylko domyślne ustawienia sesji dla autoryzowanych nadawców; nie przyznaje dostępu do narzędzi.
  Klucze narzędzi dostawcy akceptują `provider` (np. `google-antigravity`) albo `provider/model` (np. `openai/gpt-5.4`).

### Grupy narzędzi (skróty)

Zasady narzędzi (globalne, agenta, piaskownicy) obsługują wpisy `group:*`, które rozwijają się do wielu narzędzi:

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` jest akceptowane jako
  alias dla `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  W przypadku agentów tylko do odczytu odmawiaj `group:runtime` oraz narzędzi mutujących system plików, chyba że zasady systemu plików piaskownicy albo osobna granica hosta wymuszają ograniczenie tylko do odczytu.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: wszystkie wbudowane narzędzia OpenClaw (z wyłączeniem pluginów dostawców)

## Tryb podwyższony: wyłącznie dla `exec` „uruchom na hoście”

Tryb podwyższony **nie** przyznaje dodatkowych narzędzi; wpływa tylko na `exec`.

- Jeśli jesteś w piaskownicy, `/elevated on` (albo `exec` z `elevated: true`) uruchamia poza piaskownicą (zatwierdzenia nadal mogą obowiązywać).
- Użyj `/elevated full`, aby pominąć zatwierdzenia `exec` dla sesji.
- Jeśli już uruchamiasz bezpośrednio, tryb podwyższony jest w praktyce operacją bez efektu (nadal ograniczoną bramkami).
- Tryb podwyższony **nie** jest ograniczony do Skills i **nie** nadpisuje zezwoleń/odmów narzędzi.
- Tryb podwyższony nie przyznaje dowolnych nadpisań między hostami z `host=auto`; stosuje normalne reguły celu `exec` i zachowuje `node` tylko wtedy, gdy skonfigurowany/sesyjny cel to już `node`.
- `/exec` jest oddzielne od trybu podwyższonego. Dostosowuje tylko domyślne ustawienia `exec` dla sesji dla autoryzowanych nadawców.

Bramki:

- Włączenie: `tools.elevated.enabled` (i opcjonalnie `agents.list[].tools.elevated.enabled`)
- Listy dozwolonych nadawców: `tools.elevated.allowFrom.<provider>` (i opcjonalnie `agents.list[].tools.elevated.allowFrom.<provider>`)

Zobacz [Tryb podwyższony](/pl/tools/elevated).

## Typowe poprawki „więzienia piaskownicy”

### „Narzędzie X zablokowane przez zasady narzędzi piaskownicy”

Klucze naprawcze (wybierz jeden):

- Wyłącz piaskownicę: `agents.defaults.sandbox.mode=off` (albo per agent `agents.list[].sandbox.mode=off`)
- Zezwól na narzędzie wewnątrz piaskownicy:
  - usuń je z `tools.sandbox.tools.deny` (albo per agent `agents.list[].tools.sandbox.tools.deny`)
  - albo dodaj je do `tools.sandbox.tools.allow` (albo do zezwoleń per agent)

### „Myślałem, że to sesja główna, dlaczego jest w piaskownicy?”

W trybie `"non-main"` klucze grup/kanałów _nie_ są główne. Użyj klucza sesji głównej (pokazanego przez `sandbox explain`) albo przełącz tryb na `"off"`.

## Powiązane

- [Piaskownica](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy (tryby, zakresy, backendy, obrazy)
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent i kolejność pierwszeństwa
- [Tryb podwyższony](/pl/tools/elevated)
