---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Dlaczego narzędzie jest zablokowane: środowisko uruchomieniowe piaskownicy, zasady zezwalania na narzędzia i ich blokowania oraz mechanizmy kontroli wykonywania z podwyższonymi uprawnieniami'
title: Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień
x-i18n:
    generated_at: "2026-07-12T15:11:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw ma trzy powiązane, ale różne mechanizmy sterowania:

1. **Piaskownica** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) określa, **gdzie uruchamiane są narzędzia** (backend piaskownicy lub host).
2. **Zasady narzędzi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) określają, **które narzędzia są dostępne/dozwolone**.
3. **Tryb podwyższonych uprawnień** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) to **wyjście awaryjne wyłącznie dla `exec`**, umożliwiające uruchamianie poza piaskownicą, gdy sesja działa w piaskownicy (domyślnie `gateway` lub `node`, gdy cel wykonywania skonfigurowano jako `node`).

## Szybkie debugowanie

Użyj inspektora, aby sprawdzić, co OpenClaw _faktycznie_ robi:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Wyświetla on:

- efektywny tryb i zakres piaskownicy oraz dostęp do obszaru roboczego
- informację, czy bieżąca sesja działa w piaskownicy (główna lub inna niż główna)
- efektywne zezwolenia i blokady narzędzi w piaskownicy (oraz informację, czy pochodzą z ustawień agenta, globalnych czy domyślnych)
- warunki trybu podwyższonych uprawnień i ścieżki kluczy wymagających poprawy

## Piaskownica: gdzie uruchamiane są narzędzia

Działaniem piaskownicy steruje `agents.defaults.sandbox.mode`:

- `"off"`: wszystko działa na hoście.
- `"non-main"`: tylko sesje inne niż główna działają w piaskownicy (częste „zaskoczenie” w przypadku grup/kanałów).
- `"all"`: wszystko działa w piaskownicy.

`agents.defaults.sandbox.workspaceAccess` określa, co piaskownica może zobaczyć: `"none"`, `"ro"` lub `"rw"`.

Pełną macierz (zakres, montowania obszaru roboczego, obrazy) zawiera sekcja [Piaskownica](/pl/gateway/sandboxing).

### Montowania wiązane (szybka kontrola bezpieczeństwa)

- `docker.binds` _przebija_ system plików piaskownicy: wszystko, co zamontujesz, jest widoczne wewnątrz kontenera w ustawionym trybie (`:ro` lub `:rw`).
- Jeśli pominiesz tryb, domyślnie obowiązuje odczyt i zapis; w przypadku kodu źródłowego/danych poufnych preferuj `:ro`.
- `scope: "shared"` ignoruje montowania poszczególnych agentów (obowiązują tylko montowania globalne).
- OpenClaw dwukrotnie sprawdza źródła montowań: najpierw znormalizowaną ścieżkę źródłową, a następnie ponownie po jej rozwiązaniu przez najgłębszy istniejący katalog nadrzędny. Ucieczki przez dowiązania symboliczne katalogów nadrzędnych nie omijają kontroli zablokowanych ścieżek ani dozwolonych katalogów głównych.
- Nieistniejące ścieżki końcowe również są bezpiecznie sprawdzane. Jeśli `/workspace/alias-out/new-file` przez nadrzędne dowiązanie symboliczne wskazuje zablokowaną ścieżkę lub lokalizację poza skonfigurowanymi dozwolonymi katalogami głównymi, montowanie zostaje odrzucone.
- Powiązanie `/var/run/docker.sock` faktycznie przekazuje piaskownicy kontrolę nad hostem; rób to wyłącznie świadomie.
- Dostęp do obszaru roboczego (`workspaceAccess`) jest niezależny od trybów montowania.

## Zasady narzędzi: które narzędzia istnieją i można wywoływać

Znaczenie mają następujące warstwy:

- **Profil narzędzi**: `tools.profile` i `agents.list[].tools.profile` (bazowa lista dozwolonych narzędzi)
- **Profil narzędzi dostawcy**: `tools.byProvider[provider].profile` i `agents.list[].tools.byProvider[provider].profile`
- **Globalne/indywidualne zasady narzędzi agenta**: `tools.allow`/`tools.deny` i `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Zasady narzędzi dostawcy**: `tools.byProvider[provider].allow/deny` i `agents.list[].tools.byProvider[provider].allow/deny`
- **Zasady narzędzi piaskownicy** (obowiązują tylko podczas pracy w piaskownicy): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` i `agents.list[].tools.sandbox.tools.*`

Praktyczne reguły:

- `deny` zawsze ma pierwszeństwo.
- Jeśli `allow` nie jest puste, wszystko inne jest traktowane jako zablokowane.
- Zasady narzędzi są bezwzględną blokadą: `/exec` nie może zastąpić odmowy dostępu do narzędzia `exec`.
- Zasady narzędzi filtrują ich dostępność według nazw; nie sprawdzają skutków ubocznych wewnątrz `exec`. Jeśli `exec` jest dozwolone, zablokowanie `write`, `edit` lub `apply_patch` nie powoduje, że polecenia powłoki stają się tylko do odczytu.
- `/exec` zmienia wyłącznie domyślne ustawienia sesji dla autoryzowanych nadawców; nie przyznaje dostępu do narzędzi.
- Klucze narzędzi dostawcy akceptują zarówno `provider` (np. `google-antigravity`), jak i `provider/model` (np. `openai/gpt-5.4`).
- Gdy etap zasad narzędzi usuwa narzędzia lub zasady narzędzi piaskownicy blokują wywołanie, dzienniki Gateway zawierają wpisy audytowe `agents/tool-policy`. Użyj `openclaw logs`, aby zobaczyć etykietę reguły, klucz konfiguracji i nazwy narzędzi, których dotyczy wpis.

### Grupy narzędzi (skróty)

Zasady narzędzi (globalne, agenta i piaskownicy) obsługują wpisy `group:*`, które są rozwijane do wielu narzędzi:

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

| Grupa              | Narzędzia                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` jest akceptowane jako alias `exec`)                                                                             |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                    |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                              |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                      |
| `group:ui`         | `browser`, `canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                        |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                       |
| `group:openclaw`   | większość wbudowanych narzędzi OpenClaw (z wyłączeniem prymitywów systemu plików i środowiska wykonawczego `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, narzędzia `canvas` i pluginów dostawców) |
| `group:plugins`    | wszystkie załadowane narzędzia należące do pluginów, w tym skonfigurowane serwery MCP udostępniane przez `bundle-mcp`                                       |

W przypadku agentów tylko do odczytu zablokuj `group:runtime` oraz narzędzia modyfikujące system plików, chyba że ograniczenie tylko do odczytu jest wymuszane przez zasady systemu plików piaskownicy lub oddzielną granicę hosta.

W przypadku serwerów MCP działających w piaskownicy zasady narzędzi piaskownicy stanowią drugą bramę zezwoleń. Jeśli skonfigurowano `mcp.servers`, ale tury działające w piaskownicy pokazują tylko narzędzia wbudowane, dodaj `bundle-mcp`, `group:plugins` albo nazwę lub wzorzec globalny narzędzia MCP z prefiksem serwera, na przykład `outlook__send_mail` lub `outlook__*`, do `tools.sandbox.tools.alsoAllow`, a następnie uruchom ponownie/przeładuj Gateway i ponownie przechwyć listę narzędzi. Wzorce globalne serwerów używają bezpiecznego dla dostawcy prefiksu serwera MCP: znaki inne niż `[A-Za-z0-9_-]` są zastępowane znakiem `-`, nazwy, które nie zaczynają się literą, otrzymują prefiks `mcp-`, a długie lub zduplikowane prefiksy mogą zostać skrócone lub otrzymać przyrostek.

`openclaw doctor` sprawdza obecnie tę strukturę w przypadku serwerów zarządzanych przez OpenClaw w `mcp.servers`. Serwery MCP ładowane z manifestów dołączonych pluginów lub pliku `.mcp.json` Claude używają tej samej bramy piaskownicy, ale ta diagnostyka nie wylicza jeszcze tych źródeł; jeśli ich narzędzia znikają w turach działających w piaskownicy, użyj tych samych wpisów listy dozwolonych.

## Tryb podwyższonych uprawnień: „uruchamianie na hoście” tylko dla `exec`

Tryb podwyższonych uprawnień **nie** przyznaje dodatkowych narzędzi; wpływa wyłącznie na `exec`.

- Jeśli działasz w piaskownicy, `/elevated on` (lub `exec` z `elevated: true`) uruchamia operację poza piaskownicą (zatwierdzenia mogą nadal być wymagane).
- Użyj `/elevated full`, aby pominąć zatwierdzenia `exec` w tej sesji.
- Jeśli operacje są już uruchamiane bezpośrednio, tryb podwyższonych uprawnień praktycznie niczego nie zmienia (nadal podlega ograniczeniom).
- Tryb podwyższonych uprawnień **nie** jest ograniczony do Skills i **nie** zastępuje reguł zezwalania/blokowania narzędzi.
- Tryb podwyższonych uprawnień nie przyznaje dowolnych uprawnień do przełączania hostów przy `host=auto`; przestrzega zwykłych reguł celu wykonywania i zachowuje `node` tylko wtedy, gdy skonfigurowanym lub sesyjnym celem jest już `node`.
- `/exec` jest niezależne od trybu podwyższonych uprawnień. Dostosowuje wyłącznie sesyjne ustawienia domyślne `exec` dla autoryzowanych nadawców.

Warunki:

- Włączenie: `tools.elevated.enabled` (oraz opcjonalnie `agents.list[].tools.elevated.enabled`)
- Listy dozwolonych nadawców: `tools.elevated.allowFrom.<provider>` (oraz opcjonalnie `agents.list[].tools.elevated.allowFrom.<provider>`)

Zobacz [Tryb podwyższonych uprawnień](/pl/tools/elevated).

## Typowe rozwiązania problemów z „uwięzieniem w piaskownicy”

### „Narzędzie X zostało zablokowane przez zasady narzędzi piaskownicy”

Klucze do poprawy (wybierz jeden):

- Wyłącz piaskownicę: `agents.defaults.sandbox.mode=off` (lub dla wybranego agenta `agents.list[].sandbox.mode=off`)
- Zezwól na narzędzie w piaskownicy:
  - usuń je z `tools.sandbox.tools.deny` (lub dla wybranego agenta z `agents.list[].tools.sandbox.tools.deny`)
  - albo dodaj je do `tools.sandbox.tools.allow` (lub listy zezwoleń wybranego agenta)
- Sprawdź wpis `agents/tool-policy` za pomocą `openclaw logs`. Rejestruje on tryb piaskownicy oraz informację, czy narzędzie zablokowała reguła zezwalająca, czy blokująca.

### „To miała być sesja główna — dlaczego działa w piaskownicy?”

W trybie `"non-main"` klucze grup/kanałów _nie_ są główne. Użyj klucza sesji głównej (pokazanego przez `sandbox explain`) lub zmień tryb na `"off"`.

## Powiązane materiały

- [Piaskownica](/pl/gateway/sandboxing) -- pełna dokumentacja piaskownicy (tryby, zakresy, backendy, obrazy)
- [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools) -- ustawienia nadpisujące dla poszczególnych agentów i kolejność pierwszeństwa
- [Tryb podwyższonych uprawnień](/pl/tools/elevated)
