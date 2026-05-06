---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Dlaczego narzędzie jest zablokowane: środowisko wykonawcze piaskownicy, zasady zezwalania/blokowania narzędzi i bramki podwyższonego wykonywania poleceń'
title: Piaskownica a zasady dotyczące narzędzi a podwyższone uprawnienia
x-i18n:
    generated_at: "2026-05-06T09:14:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw ma trzy powiązane (ale różne) mechanizmy kontroli:

1. **Piaskownica** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decyduje, **gdzie uruchamiane są narzędzia** (backend piaskownicy albo host).
2. **Polityka narzędzi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decyduje, **które narzędzia są dostępne/dozwolone**.
3. **Podniesione uprawnienia** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) to **wyjście awaryjne tylko dla `exec`**, pozwalające uruchamiać poza piaskownicą, gdy działasz w piaskownicy (domyślnie `gateway`, albo `node`, gdy cel `exec` jest skonfigurowany jako `node`).

## Szybkie debugowanie

Użyj inspektora, aby zobaczyć, co OpenClaw _faktycznie_ robi:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Wypisuje:

- efektywny tryb/zakres piaskownicy i dostęp do przestrzeni roboczej
- czy sesja jest obecnie w piaskownicy (main kontra non-main)
- efektywne zezwolenia/odmowy narzędzi w piaskownicy (oraz czy pochodzą od agenta/globalnie/z domyślnych ustawień)
- bramki podniesionych uprawnień i ścieżki kluczy naprawczych

## Piaskownica: gdzie uruchamiane są narzędzia

Piaskownica jest kontrolowana przez `agents.defaults.sandbox.mode`:

- `"off"`: wszystko działa na hoście.
- `"non-main"`: tylko sesje inne niż main są uruchamiane w piaskownicy (częsta „niespodzianka” dla grup/kanałów).
- `"all"`: wszystko jest uruchamiane w piaskownicy.

Zobacz [Izolacja w piaskownicy](/pl/gateway/sandboxing), aby poznać pełną macierz (zakres, montowania przestrzeni roboczej, obrazy).

### Montowania bind (szybka kontrola bezpieczeństwa)

- `docker.binds` _przebija_ system plików piaskownicy: cokolwiek zamontujesz, będzie widoczne wewnątrz kontenera w ustawionym przez Ciebie trybie (`:ro` albo `:rw`).
- Domyślnie używany jest tryb odczytu i zapisu, jeśli pominiesz tryb; preferuj `:ro` dla źródeł/sekretów.
- `scope: "shared"` ignoruje montowania bind przypisane do agentów (obowiązują tylko montowania globalne).
- OpenClaw waliduje źródła montowań bind dwukrotnie: najpierw na znormalizowanej ścieżce źródłowej, a potem ponownie po rozwiązaniu przez najgłębszego istniejącego przodka. Ucieczki przez symlink w katalogu nadrzędnym nie omijają kontroli zablokowanych ścieżek ani dozwolonych katalogów głównych.
- Nieistniejące ścieżki końcowe nadal są bezpiecznie sprawdzane. Jeśli `/workspace/alias-out/new-file` rozwiązuje się przez zlinkowany symbolicznie katalog nadrzędny do zablokowanej ścieżki albo poza skonfigurowane dozwolone katalogi główne, montowanie bind zostanie odrzucone.
- Zamontowanie `/var/run/docker.sock` w praktyce przekazuje piaskownicy kontrolę nad hostem; rób to tylko świadomie.
- Dostęp do przestrzeni roboczej (`workspaceAccess: "ro"`/`"rw"`) jest niezależny od trybów montowań bind.

## Polityka narzędzi: które narzędzia istnieją i mogą być wywoływane

Znaczenie mają dwie warstwy:

- **Profil narzędzi**: `tools.profile` i `agents.list[].tools.profile` (bazowa lista dozwolonych)
- **Profil narzędzi dostawcy**: `tools.byProvider[provider].profile` i `agents.list[].tools.byProvider[provider].profile`
- **Globalna/powiązana z agentem polityka narzędzi**: `tools.allow`/`tools.deny` i `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Polityka narzędzi dostawcy**: `tools.byProvider[provider].allow/deny` i `agents.list[].tools.byProvider[provider].allow/deny`
- **Polityka narzędzi piaskownicy** (obowiązuje tylko w piaskownicy): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` i `agents.list[].tools.sandbox.tools.*`

Praktyczne reguły:

- `deny` zawsze wygrywa.
- Jeśli `allow` nie jest puste, wszystko inne jest traktowane jako zablokowane.
- Polityka narzędzi jest twardą blokadą: `/exec` nie może nadpisać odmowy dla narzędzia `exec`.
- `/exec` zmienia tylko domyślne ustawienia sesji dla autoryzowanych nadawców; nie przyznaje dostępu do narzędzi.
  Klucze narzędzi dostawcy akceptują albo `provider` (np. `google-antigravity`), albo `provider/model` (np. `openai/gpt-5.4`).

### Grupy narzędzi (skróty)

Polityki narzędzi (globalne, agenta, piaskownicy) obsługują wpisy `group:*`, które rozwijają się do wielu narzędzi:

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

## Podniesione uprawnienia: „uruchom na hoście” tylko dla `exec`

Podniesione uprawnienia **nie** przyznają dodatkowych narzędzi; wpływają tylko na `exec`.

- Jeśli działasz w piaskownicy, `/elevated on` (albo `exec` z `elevated: true`) uruchamia poza piaskownicą (zatwierdzenia nadal mogą obowiązywać).
- Użyj `/elevated full`, aby pominąć zatwierdzenia `exec` dla sesji.
- Jeśli już działasz bezpośrednio, podniesione uprawnienia w praktyce niczego nie zmieniają (nadal podlegają bramkom).
- Podniesione uprawnienia **nie** są ograniczone do Skills i **nie** nadpisują `allow`/`deny` narzędzi.
- Podniesione uprawnienia nie przyznają dowolnych nadpisań między hostami z `host=auto`; podążają za normalnymi regułami celu `exec` i zachowują `node` tylko wtedy, gdy skonfigurowany/sesyjny cel już jest `node`.
- `/exec` jest niezależne od podniesionych uprawnień. Dostosowuje tylko domyślne ustawienia `exec` na poziomie sesji dla autoryzowanych nadawców.

Bramki:

- Włączenie: `tools.elevated.enabled` (i opcjonalnie `agents.list[].tools.elevated.enabled`)
- Listy dozwolonych nadawców: `tools.elevated.allowFrom.<provider>` (i opcjonalnie `agents.list[].tools.elevated.allowFrom.<provider>`)

Zobacz [Tryb podniesionych uprawnień](/pl/tools/elevated).

## Typowe naprawy „więzienia piaskownicy”

### „Narzędzie X zablokowane przez politykę narzędzi piaskownicy”

Klucze naprawcze (wybierz jeden):

- Wyłącz piaskownicę: `agents.defaults.sandbox.mode=off` (albo dla konkretnego agenta `agents.list[].sandbox.mode=off`)
- Zezwól na narzędzie wewnątrz piaskownicy:
  - usuń je z `tools.sandbox.tools.deny` (albo dla konkretnego agenta z `agents.list[].tools.sandbox.tools.deny`)
  - albo dodaj je do `tools.sandbox.tools.allow` (albo do listy dozwolonych dla konkretnego agenta)

### „Myślałem, że to main, dlaczego działa w piaskownicy?”

W trybie `"non-main"` klucze grup/kanałów _nie_ są main. Użyj klucza sesji main (pokazanego przez `sandbox explain`) albo przełącz tryb na `"off"`.

## Powiązane

- [Izolacja w piaskownicy](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy (tryby, zakresy, backendy, obrazy)
- [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- nadpisania dla agentów i kolejność priorytetów
- [Tryb podniesionych uprawnień](/pl/tools/elevated)
