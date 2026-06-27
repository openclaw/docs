---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Dlaczego narzędzie jest blokowane: środowisko uruchomieniowe piaskownicy, zasady zezwalania na narzędzia i ich blokowania oraz bramki podwyższonego wykonywania poleceń'
title: Sandbox kontra zasady narzędzi kontra podwyższone uprawnienia
x-i18n:
    generated_at: "2026-06-27T17:36:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw ma trzy powiązane (ale różne) mechanizmy sterowania:

1. **Piaskownica** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decyduje, **gdzie działają narzędzia** (backend piaskownicy albo host).
2. **Zasady narzędzi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decydują, **które narzędzia są dostępne/dozwolone**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) to **wyjście awaryjne tylko dla `exec`**, pozwalające działać poza piaskownicą, gdy sesja jest w piaskownicy (domyślnie `gateway`, albo `node`, gdy cel `exec` jest skonfigurowany jako `node`).

## Szybkie debugowanie

Użyj inspektora, aby zobaczyć, co OpenClaw _faktycznie_ robi:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Wypisuje on:

- efektywny tryb/zakres piaskownicy oraz dostęp do workspace
- czy sesja jest obecnie w piaskownicy (main kontra non-main)
- efektywne zezwolenia/blokady narzędzi piaskownicy (i czy pochodzą z agenta/globalnych ustawień/domyślnych ustawień)
- bramki Elevated oraz ścieżki kluczy do naprawy

## Piaskownica: gdzie działają narzędzia

Piaskownica jest kontrolowana przez `agents.defaults.sandbox.mode`:

- `"off"`: wszystko działa na hoście.
- `"non-main"`: tylko sesje non-main są w piaskownicy (częsta „niespodzianka” dla grup/kanałów).
- `"all"`: wszystko jest w piaskownicy.

Zobacz [Piaskownica](/pl/gateway/sandboxing), aby poznać pełną macierz (zakres, montowania workspace, obrazy).

### Montowania bind (szybka kontrola bezpieczeństwa)

- `docker.binds` _przebija_ system plików piaskownicy: wszystko, co zamontujesz, jest widoczne w kontenerze z ustawionym trybem (`:ro` albo `:rw`).
- Domyślnie używany jest tryb odczytu i zapisu, jeśli pominiesz tryb; preferuj `:ro` dla źródeł/sekretów.
- `scope: "shared"` ignoruje montowania bind przypisane do agentów (stosowane są tylko montowania globalne).
- OpenClaw sprawdza poprawność źródeł montowań bind dwa razy: najpierw na znormalizowanej ścieżce źródłowej, potem ponownie po rozwiązaniu przez najgłębszego istniejącego przodka. Ucieczki przez dowiązania symboliczne w katalogach nadrzędnych nie omijają kontroli zablokowanych ścieżek ani dozwolonych katalogów głównych.
- Nieistniejące ścieżki końcowe nadal są sprawdzane bezpiecznie. Jeśli `/workspace/alias-out/new-file` rozwiązuje się przez katalog nadrzędny będący dowiązaniem symbolicznym do zablokowanej ścieżki lub poza skonfigurowane dozwolone katalogi główne, montowanie bind zostanie odrzucone.
- Zamontowanie `/var/run/docker.sock` w praktyce przekazuje piaskownicy kontrolę nad hostem; rób to tylko świadomie.
- Dostęp do workspace (`workspaceAccess: "ro"`/`"rw"`) jest niezależny od trybów montowań bind.

## Zasady narzędzi: które narzędzia istnieją i można je wywołać

Znaczenie mają dwie warstwy:

- **Profil narzędzi**: `tools.profile` i `agents.list[].tools.profile` (bazowa lista dozwolonych)
- **Profil narzędzi providera**: `tools.byProvider[provider].profile` i `agents.list[].tools.byProvider[provider].profile`
- **Globalne/per-agent zasady narzędzi**: `tools.allow`/`tools.deny` i `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Zasady narzędzi providera**: `tools.byProvider[provider].allow/deny` i `agents.list[].tools.byProvider[provider].allow/deny`
- **Zasady narzędzi piaskownicy** (obowiązują tylko w piaskownicy): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` i `agents.list[].tools.sandbox.tools.*`

Zasady praktyczne:

- `deny` zawsze wygrywa.
- Jeśli `allow` nie jest puste, wszystko inne jest traktowane jako zablokowane.
- Zasady narzędzi są twardą blokadą: `/exec` nie może nadpisać odmowy dla narzędzia `exec`.
- Zasady narzędzi filtrują dostępność narzędzi według nazwy; nie sprawdzają skutków ubocznych wewnątrz `exec`. Jeśli `exec` jest dozwolone, zablokowanie `write`, `edit` albo `apply_patch` nie sprawia, że polecenia powłoki stają się tylko do odczytu.
- `/exec` zmienia tylko domyślne ustawienia sesji dla uprawnionych nadawców; nie przyznaje dostępu do narzędzi.
  Klucze narzędzi providera akceptują zarówno `provider` (np. `google-antigravity`), jak i `provider/model` (np. `openai/gpt-5.4`).
- Logi Gateway zawierają wpisy audytowe `agents/tool-policy`, gdy krok zasad narzędzi usuwa narzędzia albo zasady narzędzi piaskownicy blokują wywołanie. Użyj `openclaw logs`, aby zobaczyć etykietę reguły, klucz konfiguracji i nazwy narzędzi, których to dotyczy.

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
  W przypadku agentów tylko do odczytu zablokuj `group:runtime` oraz narzędzia modyfikujące system plików, chyba że zasady systemu plików piaskownicy albo osobna granica hosta wymuszają ograniczenie tylko do odczytu.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: wszystkie wbudowane narzędzia OpenClaw (bez pluginów providerów)
- `group:plugins`: wszystkie załadowane narzędzia należące do pluginów, w tym skonfigurowane serwery MCP udostępniane przez `bundle-mcp`

W przypadku serwerów MCP w piaskownicy zasady narzędzi piaskownicy są drugą bramką zezwoleń. Jeśli `mcp.servers` jest skonfigurowane, ale tury w piaskownicy pokazują tylko narzędzia wbudowane, dodaj `bundle-mcp`, `group:plugins` albo nazwę/glob narzędzia MCP z prefiksem serwera, na przykład `outlook__send_mail` albo `outlook__*`, do `tools.sandbox.tools.alsoAllow`, następnie zrestartuj/przeładuj Gateway i ponownie przechwyć listę narzędzi. Globy serwera używają bezpiecznego dla providera prefiksu serwera MCP: znaki inne niż `[A-Za-z0-9_-]` stają się `-`, nazwy, które nie zaczynają się od litery, dostają prefiks `mcp-`, a długie lub zduplikowane prefiksy mogą zostać ucięte albo otrzymać sufiks.

`openclaw doctor` obecnie sprawdza ten kształt dla serwerów zarządzanych przez OpenClaw w `mcp.servers`. Serwery MCP ładowane z manifestów wbudowanych pluginów albo z pliku Claude `.mcp.json` używają tej samej bramki piaskownicy, ale ta diagnostyka jeszcze nie wylicza tych źródeł; użyj tych samych wpisów listy dozwolonych, jeśli ich narzędzia znikają w turach w piaskownicy.

## Elevated: „uruchom na hoście” tylko dla `exec`

Elevated **nie** przyznaje dodatkowych narzędzi; wpływa tylko na `exec`.

- Jeśli sesja jest w piaskownicy, `/elevated on` (albo `exec` z `elevated: true`) działa poza piaskownicą (zatwierdzenia nadal mogą obowiązywać).
- Użyj `/elevated full`, aby pominąć zatwierdzenia `exec` dla sesji.
- Jeśli już działasz bezpośrednio, Elevated jest w praktyce operacją bez efektu (nadal podlega bramkom).
- Elevated **nie** jest ograniczone do Skills i **nie** nadpisuje zezwoleń/blokad narzędzi.
- Elevated nie przyznaje dowolnych nadpisań między hostami z `host=auto`; podąża za normalnymi regułami celu `exec` i zachowuje `node` tylko wtedy, gdy skonfigurowany/sesyjny cel już jest `node`.
- `/exec` jest osobne od Elevated. Dostosowuje tylko per-sesyjne domyślne ustawienia `exec` dla uprawnionych nadawców.

Bramki:

- Włączenie: `tools.elevated.enabled` (oraz opcjonalnie `agents.list[].tools.elevated.enabled`)
- Listy dozwolonych nadawców: `tools.elevated.allowFrom.<provider>` (oraz opcjonalnie `agents.list[].tools.elevated.allowFrom.<provider>`)

Zobacz [Tryb Elevated](/pl/tools/elevated).

## Typowe poprawki „uwięzienia w piaskownicy”

### „Narzędzie X zablokowane przez zasady narzędzi piaskownicy”

Klucze naprawcze (wybierz jeden):

- Wyłącz piaskownicę: `agents.defaults.sandbox.mode=off` (albo per-agent `agents.list[].sandbox.mode=off`)
- Zezwól na narzędzie wewnątrz piaskownicy:
  - usuń je z `tools.sandbox.tools.deny` (albo per-agent `agents.list[].tools.sandbox.tools.deny`)
  - albo dodaj je do `tools.sandbox.tools.allow` (albo listy dozwolonych per-agent)
- Sprawdź `openclaw logs` pod kątem wpisu `agents/tool-policy`. Rejestruje on tryb piaskownicy oraz to, czy narzędzie zablokowała reguła `allow` czy `deny`.

### „Myślałem, że to main; dlaczego jest w piaskownicy?”

W trybie `"non-main"` klucze grup/kanałów _nie_ są main. Użyj klucza sesji main (pokazanego przez `sandbox explain`) albo przełącz tryb na `"off"`.

## Powiązane

- [Piaskownica](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy (tryby, zakresy, backendy, obrazy)
- [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per-agent i kolejność pierwszeństwa
- [Tryb Elevated](/pl/tools/elevated)
