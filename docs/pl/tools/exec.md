---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia Exec, tryby stdin i obsługa TTY
title: Narzędzie Exec
x-i18n:
    generated_at: "2026-05-03T21:38:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

Uruchamia polecenia powłoki w obszarze roboczym. Obsługuje wykonywanie na pierwszym planie i w tle za pomocą `process`.
Jeśli `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje w tle są ograniczone do agenta; `process` widzi tylko sesje tego samego agenta.

## Parametry

<ParamField path="command" type="string" required>
Polecenie powłoki do uruchomienia.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Katalog roboczy dla polecenia.
</ParamField>

<ParamField path="env" type="object">
Nadpisania środowiska w postaci klucz/wartość scalane z dziedziczonym środowiskiem.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Automatycznie przenieś polecenie w tło po tym opóźnieniu (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Przenieś polecenie w tło natychmiast zamiast czekać na `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Nadpisz skonfigurowany limit czasu exec dla tego wywołania. Ustaw `timeout: 0` tylko wtedy, gdy polecenie ma działać bez limitu czasu procesu exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Uruchom w pseudoterminalu, gdy jest dostępny. Używaj dla CLI wymagających TTY, agentów kodujących i terminalowych interfejsów użytkownika.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Miejsce wykonania. `auto` rozwiązuje się do `sandbox`, gdy aktywne jest środowisko uruchomieniowe piaskownicy, w przeciwnym razie do `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Tryb wymuszania dla wykonywania `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Zachowanie monitu o zatwierdzenie dla wykonywania `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Identyfikator/nazwa Node, gdy `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Zażądaj trybu podwyższonego — wyjścia z piaskownicy na skonfigurowaną ścieżkę hosta. `security=full` jest wymuszane tylko wtedy, gdy elevated rozwiązuje się do `full`.
</ParamField>

Uwagi:

- `host` domyślnie ma wartość `auto`: piaskownica, gdy środowisko uruchomieniowe piaskownicy jest aktywne dla sesji, w przeciwnym razie Gateway.
- `host` przyjmuje tylko `auto`, `sandbox`, `gateway` lub `node`. Nie jest selektorem nazwy hosta; wartości przypominające nazwy hostów są odrzucane przed uruchomieniem polecenia.
- `auto` jest domyślną strategią trasowania, nie symbolem wieloznacznym. `host=node` na poziomie wywołania jest dozwolone z `auto`; `host=gateway` na poziomie wywołania jest dozwolone tylko wtedy, gdy żadne środowisko uruchomieniowe piaskownicy nie jest aktywne.
- Bez dodatkowej konfiguracji `host=auto` nadal „po prostu działa”: brak piaskownicy oznacza, że rozwiązuje się do `gateway`; aktywna piaskownica oznacza, że pozostaje w piaskownicy.
- `elevated` wychodzi z piaskownicy na skonfigurowaną ścieżkę hosta: domyślnie `gateway` albo `node`, gdy `tools.exec.host=node` (lub domyślna wartość sesji to `host=node`). Jest dostępne tylko wtedy, gdy dostęp podwyższony jest włączony dla bieżącej sesji/dostawcy.
- Zatwierdzeniami `gateway`/`node` steruje `~/.openclaw/exec-approvals.json`.
- `node` wymaga sparowanego Node (aplikacji towarzyszącej lub bezgłowego hosta Node).
- Jeśli dostępnych jest wiele Node, ustaw `exec.node` lub `tools.exec.node`, aby wybrać jeden.
- `exec host=node` jest jedyną ścieżką wykonywania powłoki dla Node; starszy wrapper `nodes.run` został usunięty.
- `timeout` dotyczy wykonywania na pierwszym planie, w tle, `yieldMs`, Gateway, piaskownicy oraz wykonywania `system.run` na Node. Jeśli zostanie pominięty, OpenClaw używa `tools.exec.timeoutSec`; jawne `timeout: 0` wyłącza limit czasu procesu exec dla tego wywołania.
- Na hostach innych niż Windows exec używa `SHELL`, gdy jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (lub `sh`)
  z `PATH`, aby uniknąć skryptów niezgodnych z fish, a następnie wraca do `SHELL`, jeśli żadne z nich nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, potem PATH),
  a następnie wraca do Windows PowerShell 5.1.
- Wykonywanie na hoście (`gateway`/`node`) odrzuca `env.PATH` oraz nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiec przejęciu binariów lub wstrzyknięciu kodu.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym przy wykonywaniu PTY i w piaskownicy), aby reguły powłoki/profilu mogły wykryć kontekst narzędzia exec.
- `openclaw channels login` jest blokowane z `exec`, ponieważ jest interaktywnym przepływem uwierzytelniania kanału; uruchom je w terminalu na hoście Gateway albo użyj natywnego dla kanału narzędzia logowania z czatu, jeśli istnieje.
- Ważne: piaskownica jest **domyślnie wyłączona**. Jeśli piaskownica jest wyłączona, niejawne `host=auto`
  rozwiązuje się do `gateway`. Jawne `host=sandbox` nadal kończy się bezpiecznym błędem zamiast po cichu
  uruchamiać polecenie na hoście Gateway. Włącz piaskownicę albo użyj `host=gateway` z zatwierdzeniami.
- Kontrole wstępne skryptów (dla typowych błędów składni powłoki Python/Node) sprawdzają tylko pliki wewnątrz
  efektywnej granicy `workdir`. Jeśli ścieżka skryptu rozwiązuje się poza `workdir`, kontrola wstępna jest pomijana dla
  tego pliku.
- W przypadku długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone i polecenie emituje wyjście lub kończy się niepowodzeniem.
  Używaj `process` do logów, statusu, danych wejściowych lub interwencji; nie emuluj
  harmonogramowania pętlami sleep, pętlami timeout ani powtarzanym odpytywaniem.
- Do pracy, która powinna wydarzyć się później lub według harmonogramu, użyj Cron zamiast
  wzorców sleep/opóźnienia w `exec`.

## Konfiguracja

- `tools.exec.notifyOnExit` (domyślnie: true): gdy true, sesje exec przeniesione w tło dodają zdarzenie systemowe do kolejki i żądają Heartbeat przy zakończeniu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): emituj pojedyncze powiadomienie „running”, gdy exec wymagający zatwierdzenia działa dłużej niż ta wartość (0 wyłącza).
- `tools.exec.timeoutSec` (domyślnie: 1800): domyślny limit czasu exec na polecenie w sekundach. `timeout` na poziomie wywołania nadpisuje go; `timeout: 0` na poziomie wywołania wyłącza limit czasu procesu exec.
- `tools.exec.host` (domyślnie: `auto`; rozwiązuje się do `sandbox`, gdy środowisko uruchomieniowe piaskownicy jest aktywne, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla piaskownicy, `full` dla Gateway + Node, gdy nie ustawiono)
- `tools.exec.ask` (domyślnie: `off`)
- Exec na hoście bez zatwierdzeń jest domyślny dla Gateway + Node. Jeśli chcesz zachowania opartego na zatwierdzeniach/liście dozwolonych, zaostrz zarówno `tools.exec.*`, jak i hostowe `~/.openclaw/exec-approvals.json`; zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO wynika z domyślnych zasad hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić trasowanie przez Gateway lub Node, ustaw `tools.exec.host` albo użyj `/exec host=...`.
- W trybie `security=full` plus `ask=off` exec na hoście bezpośrednio stosuje skonfigurowaną zasadę; nie ma dodatkowej heurystycznej warstwy wstępnego filtrowania zaciemniania poleceń ani odrzucania kontroli wstępnej skryptów.
- `tools.exec.node` (domyślnie: nieustawione)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy true, formularze eval interpretera inline, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, zawsze wymagają jawnego zatwierdzenia. `allow-always` nadal może utrwalać łagodne wywołania interpretera/skryptu, ale formularze inline-eval nadal wyświetlają monit za każdym razem.
- `tools.exec.pathPrepend`: lista katalogów do dodania na początku `PATH` dla uruchomień exec (tylko Gateway + piaskownica).
- `tools.exec.safeBins`: bezpieczne binaria działające wyłącznie na stdin, które mogą działać bez jawnych wpisów listy dozwolonych. Szczegóły zachowania znajdziesz w [Bezpieczne binaria](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla kontroli ścieżek `safeBins`. Wpisy `PATH` nigdy nie są automatycznie zaufane. Wbudowane wartości domyślne to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalna niestandardowa zasada argv dla każdego bezpiecznego binarium (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Przykład:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Obsługa PATH

- `host=gateway`: scala `PATH` z powłoki logowania użytkownika ze środowiskiem exec. Nadpisania `env.PATH` są
  odrzucane dla wykonywania na hoście. Sam demon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: uruchamia `sh -lc` (powłokę logowania) wewnątrz kontenera, więc `/etc/profile` może zresetować `PATH`.
  OpenClaw dodaje `env.PATH` na początku po wczytaniu profilu przez wewnętrzną zmienną środowiskową (bez interpolacji powłoki);
  `tools.exec.pathPrepend` również ma tu zastosowanie.
- `host=node`: do Node wysyłane są tylko nieblokowane nadpisania środowiska, które przekażesz. Nadpisania `env.PATH` są
  odrzucane dla wykonywania na hoście i ignorowane przez hosty Node. Jeśli potrzebujesz dodatkowych wpisów PATH na Node,
  skonfiguruj środowisko usługi hosta Node (systemd/launchd) albo zainstaluj narzędzia w standardowych lokalizacjach.

Powiązanie Node z agentem (użyj indeksu listy agentów w konfiguracji):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: karta Nodes zawiera mały panel „Powiązanie Node exec” dla tych samych ustawień.

## Nadpisania sesji (`/exec`)

Użyj `/exec`, aby ustawić **domyślne wartości dla sesji** dla `host`, `security`, `ask` i `node`.
Wyślij `/exec` bez argumentów, aby pokazać bieżące wartości.

Przykład:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model autoryzacji

`/exec` jest honorowane tylko dla **autoryzowanych nadawców** (listy dozwolonych/parowanie kanału plus `commands.useAccessGroups`).
Aktualizuje **tylko stan sesji** i nie zapisuje konfiguracji. Aby trwale wyłączyć exec, odmów go przez
zasadę narzędzi (`tools.deny: ["exec"]` lub dla każdego agenta). Zatwierdzenia hosta nadal mają zastosowanie, chyba że jawnie ustawisz
`security=full` i `ask=off`.

## Zatwierdzenia exec (aplikacja towarzysząca / host Node)

Agenci w piaskownicy mogą wymagać zatwierdzenia każdego żądania przed uruchomieniem `exec` na hoście Gateway lub Node.
Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać zasadę, listę dozwolonych i przepływ UI.

Gdy zatwierdzenia są wymagane, narzędzie exec natychmiast zwraca
`status: "approval-pending"` i identyfikator zatwierdzenia. Po zatwierdzeniu (albo odmowie / przekroczeniu limitu czasu)
Gateway emituje zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli polecenie nadal
działa po `tools.exec.approvalRunningNoticeMs`, emitowane jest pojedyncze powiadomienie `Exec running`.
W kanałach z natywnymi kartami/przyciskami zatwierdzania agent powinien najpierw polegać na tym
natywnym UI i dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia
wyraźnie mówi, że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest
jedyną ścieżką.

## Lista dozwolonych + bezpieczne binaria

Ręczne wymuszanie listy dozwolonych dopasowuje globy rozpoznanych ścieżek binariów i gołe globy nazw poleceń. Gołe nazwy dopasowują tylko polecenia wywołane przez PATH, więc `rg` może dopasować
`/opt/homebrew/bin/rg`, gdy polecenie to `rg`, ale nie `./rg` ani `/tmp/rg`.
Gdy `security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment potoku
jest na liście dozwolonych lub jest bezpiecznym binarium. Łączenie (`;`, `&&`, `||`) i przekierowania
są odrzucane w trybie listy dozwolonych, chyba że każdy segment najwyższego poziomu spełnia
listę dozwolonych (w tym bezpieczne binaria). Przekierowania pozostają nieobsługiwane.
Trwałe zaufanie `allow-always` nie omija tej reguły: polecenie łączone nadal wymaga dopasowania każdego
segmentu najwyższego poziomu.

`autoAllowSkills` jest osobną wygodną ścieżką w zatwierdzeniach exec. To nie to samo co
ręczne wpisy listy dozwolonych ścieżek. Dla ścisłego jawnego zaufania pozostaw `autoAllowSkills` wyłączone.

Używaj tych dwóch elementów sterujących do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieniowe działające wyłącznie na stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych bezpiecznych binariów.
- `tools.exec.safeBinProfiles`: jawna zasada argv dla niestandardowych bezpiecznych binariów.
- lista dozwolonych: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jako ogólnej listy dozwolonych elementów i nie dodawaj binariów interpreterów/środowisk uruchomieniowych (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, użyj jawnych wpisów listy dozwolonych elementów i pozostaw włączone monity o zatwierdzenie.
`openclaw security audit` ostrzega, gdy wpisom interpreterów/środowisk uruchomieniowych w `safeBins` brakuje jawnych profili, a `openclaw doctor --fix` może wygenerować brakujące niestandardowe wpisy `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają także, gdy jawnie dodasz z powrotem do `safeBins` binaria o szerokim zachowaniu, takie jak `jq`.
Jeśli jawnie dodajesz interpretery do listy dozwolonych elementów, włącz `tools.exec.strictInlineEval`, aby formy ewaluacji kodu inline nadal wymagały świeżego zatwierdzenia.

Pełne szczegóły polityki i przykłady znajdziesz w [Zatwierdzeniach Exec](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only) oraz [Bezpieczne binaria a lista dozwolonych elementów](/pl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Przykłady

Pierwszy plan:

```json
{ "tool": "exec", "command": "ls -la" }
```

Tło + odpytywanie:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Odpytywanie służy do sprawdzania stanu na żądanie, a nie do pętli oczekiwania. Jeśli automatyczne wybudzanie po ukończeniu
jest włączone, polecenie może wybudzić sesję, gdy wyemituje dane wyjściowe lub zakończy się niepowodzeniem.

Wysyłanie klawiszy (w stylu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Prześlij (wyślij tylko CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklej (domyślnie w trybie bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` to podnarzędzie `exec` do ustrukturyzowanych edycji wielu plików.
Jest domyślnie włączone dla modeli OpenAI i OpenAI Codex. Użyj konfiguracji tylko
wtedy, gdy chcesz je wyłączyć lub ograniczyć do określonych modeli:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Uwagi:

- Dostępne tylko dla modeli OpenAI/OpenAI Codex.
- Polityka narzędzi nadal obowiązuje; `allow: ["write"]` niejawnie zezwala na `apply_patch`.
- `deny: ["write"]` nie blokuje `apply_patch`; jawnie zablokuj `apply_patch` albo użyj `deny: ["group:fs"]`, gdy zapisywanie łatek również ma być blokowane.
- Konfiguracja znajduje się w `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw ją na `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczone do obszaru roboczego). Ustaw ją na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usuwało poza katalogiem obszaru roboczego.

## Powiązane

- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach piaskownicy
- [Proces w tle](/pl/gateway/background-process) — długotrwałe exec i narzędzie process
- [Bezpieczeństwo](/pl/gateway/security) — polityka narzędzi i podwyższony dostęp
