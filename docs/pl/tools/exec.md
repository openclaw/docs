---
read_when:
    - Korzystanie z narzędzia exec lub jego modyfikowanie
    - Debugowanie zachowania stdin lub TTY
summary: Użycie narzędzia exec, tryby stdin i obsługa TTY
title: Narzędzie Exec
x-i18n:
    generated_at: "2026-05-11T20:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

Uruchamiaj polecenia powłoki w przestrzeni roboczej. `exec` to mutująca powierzchnia powłoki: polecenia mogą tworzyć, edytować lub usuwać pliki wszędzie tam, gdzie pozwala na to wybrany host albo system plików piaskownicy. Wyłączenie narzędzi systemu plików OpenClaw, takich jak `write`, `edit` czy `apply_patch`, nie sprawia, że `exec` staje się tylko do odczytu.

Obsługuje wykonywanie na pierwszym planie i w tle przez `process`. Jeśli `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
Sesje w tle są ograniczone do danego agenta; `process` widzi tylko sesje tego samego agenta.

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
Automatycznie przenieś polecenie do tła po tym opóźnieniu (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Natychmiast przenieś polecenie do tła zamiast czekać na `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Nadpisz skonfigurowany limit czasu exec dla tego wywołania. Ustaw `timeout: 0` tylko wtedy, gdy polecenie ma działać bez limitu czasu procesu exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Uruchom w pseudoterminalu, gdy jest dostępny. Używaj dla CLI wymagających TTY, agentów kodujących i terminalowych interfejsów użytkownika.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Miejsce wykonania. `auto` jest rozwiązywane do `sandbox`, gdy aktywne jest środowisko wykonawcze piaskownicy, a w przeciwnym razie do `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignorowane dla zwykłych wywołań narzędzi. Zabezpieczenia `gateway` / `node` są kontrolowane przez
`tools.exec.security` i `~/.openclaw/exec-approvals.json`; tryb podwyższony może
wymusić `security=full` tylko wtedy, gdy operator jawnie przyzna podwyższony dostęp.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Zachowanie monitu o zatwierdzenie dla wykonywania `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Identyfikator/nazwa Node, gdy `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Zażądaj trybu podwyższonego — wyjścia z piaskownicy na skonfigurowaną ścieżkę hosta. `security=full` jest wymuszane tylko wtedy, gdy tryb podwyższony rozwiązuje się do `full`.
</ParamField>

Uwagi:

- `host` domyślnie ma wartość `auto`: piaskownica, gdy środowisko wykonawcze piaskownicy jest aktywne dla sesji, w przeciwnym razie Gateway.
- `host` akceptuje tylko `auto`, `sandbox`, `gateway` lub `node`. Nie jest selektorem nazwy hosta; wartości podobne do nazw hostów są odrzucane przed uruchomieniem polecenia.
- `auto` to domyślna strategia routingu, a nie symbol wieloznaczny. `host=node` dla pojedynczego wywołania jest dozwolone z `auto`; `host=gateway` dla pojedynczego wywołania jest dozwolone tylko wtedy, gdy żadne środowisko wykonawcze piaskownicy nie jest aktywne.
- Bez dodatkowej konfiguracji `host=auto` nadal „po prostu działa”: brak piaskownicy oznacza rozwiązanie do `gateway`; aktywna piaskownica oznacza pozostanie w piaskownicy.
- `elevated` wychodzi z piaskownicy na skonfigurowaną ścieżkę hosta: domyślnie `gateway` albo `node`, gdy `tools.exec.host=node` (lub domyślna wartość sesji to `host=node`). Jest dostępne tylko wtedy, gdy podwyższony dostęp jest włączony dla bieżącej sesji/dostawcy.
- Zatwierdzenia `gateway`/`node` są kontrolowane przez `~/.openclaw/exec-approvals.json`.
- `node` wymaga sparowanego Node (aplikacji towarzyszącej lub bezgłowego hosta Node).
- Jeśli dostępnych jest wiele Node, ustaw `exec.node` lub `tools.exec.node`, aby wybrać jeden.
- `exec host=node` to jedyna ścieżka wykonywania powłoki dla Node; starszy wrapper `nodes.run` został usunięty.
- `timeout` dotyczy wykonywania na pierwszym planie, w tle, `yieldMs`, Gateway, piaskownicy i Node `system.run`. Jeśli zostanie pominięte, OpenClaw używa `tools.exec.timeoutSec`; jawne `timeout: 0` wyłącza limit czasu procesu exec dla tego wywołania.
- Na hostach innych niż Windows exec używa `SHELL`, gdy jest ustawione; jeśli `SHELL` to `fish`, preferuje `bash` (lub `sh`)
  z `PATH`, aby uniknąć skryptów niezgodnych z fish, a następnie wraca do `SHELL`, jeśli żadne z nich nie istnieje.
- Na hostach Windows exec preferuje wykrywanie PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, następnie PATH),
  a potem wraca do Windows PowerShell 5.1.
- Wykonywanie na hoście (`gateway`/`node`) odrzuca `env.PATH` i nadpisania loadera (`LD_*`/`DYLD_*`), aby
  zapobiec przejęciu binariów lub wstrzykniętemu kodowi.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym wykonywania PTY i piaskownicy), aby reguły powłoki/profilu mogły wykryć kontekst narzędzia exec.
- `openclaw channels login` jest blokowane w `exec`, ponieważ jest interaktywnym przepływem uwierzytelniania kanału; uruchom je w terminalu na hoście Gateway albo użyj natywnego dla kanału narzędzia logowania z czatu, jeśli istnieje.
- Ważne: piaskownica jest **domyślnie wyłączona**. Jeśli piaskownica jest wyłączona, niejawne `host=auto`
  rozwiązuje się do `gateway`. Jawne `host=sandbox` nadal kończy się zamkniętym błędem, zamiast po cichu
  uruchamiać się na hoście Gateway. Włącz piaskownicę albo użyj `host=gateway` z zatwierdzeniami.
- Wstępne kontrole skryptów (dla typowych błędów składni powłoki Python/Node) sprawdzają tylko pliki wewnątrz
  efektywnej granicy `workdir`. Jeśli ścieżka skryptu rozwiązuje się poza `workdir`, kontrola wstępna jest pomijana dla
  tego pliku.
- W przypadku długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wznowieniu po zakończeniu, gdy jest włączone i polecenie emituje wyjście lub kończy się niepowodzeniem.
  Używaj `process` do logów, statusu, wejścia lub interwencji; nie emuluj
  harmonogramowania pętlami sleep, pętlami timeout ani wielokrotnym odpytywaniem.
- W przypadku pracy, która ma wydarzyć się później lub zgodnie z harmonogramem, użyj cron zamiast
  wzorców sleep/delay w `exec`.

## Konfiguracja

- `tools.exec.notifyOnExit` (domyślnie: true): gdy ma wartość true, przeniesione do tła sesje exec dodają zdarzenie systemowe do kolejki i żądają Heartbeat przy wyjściu.
- `tools.exec.approvalRunningNoticeMs` (domyślnie: 10000): wyemituj pojedyncze powiadomienie „uruchomione”, gdy exec chronione zatwierdzeniem działa dłużej niż ta wartość (0 wyłącza).
- `tools.exec.timeoutSec` (domyślnie: 1800): domyślny limit czasu exec dla pojedynczego polecenia w sekundach. `timeout` dla pojedynczego wywołania go nadpisuje; `timeout: 0` dla pojedynczego wywołania wyłącza limit czasu procesu exec.
- `tools.exec.host` (domyślnie: `auto`; rozwiązuje się do `sandbox`, gdy środowisko wykonawcze piaskownicy jest aktywne, w przeciwnym razie do `gateway`)
- `tools.exec.security` (domyślnie: `deny` dla piaskownicy, `full` dla Gateway + Node, gdy nieustawione)
- `tools.exec.ask` (domyślnie: `off`)
- Host exec bez zatwierdzeń jest domyślny dla Gateway + Node. Jeśli chcesz zachowanie z zatwierdzeniami/listą dozwolonych, zaostrz zarówno `tools.exec.*`, jak i hostowe `~/.openclaw/exec-approvals.json`; zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals#yolo-mode-no-approval).
- YOLO wynika z domyślnych zasad hosta (`security=full`, `ask=off`), a nie z `host=auto`. Jeśli chcesz wymusić routing Gateway lub Node, ustaw `tools.exec.host` albo użyj `/exec host=...`.
- W trybie `security=full` plus `ask=off` host exec bezpośrednio przestrzega skonfigurowanych zasad; nie ma dodatkowego heurystycznego prefiltra zaciemniania poleceń ani warstwy odrzucania wstępnej kontroli skryptów.
- `tools.exec.node` (domyślnie: nieustawione)
- `tools.exec.strictInlineEval` (domyślnie: false): gdy ma wartość true, formularze inline eval interpreterów, takie jak `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` i `osascript -e`, zawsze wymagają jawnego zatwierdzenia. `allow-always` może nadal utrwalać nieszkodliwe wywołania interpreterów/skryptów, ale formularze inline-eval nadal pytają za każdym razem.
- `tools.exec.commandHighlighting` (domyślnie: false): gdy ma wartość true, monity o zatwierdzenie mogą podświetlać wyprowadzone przez parser zakresy poleceń w tekście polecenia. Ustaw na `true` globalnie lub dla pojedynczego agenta, aby włączyć podświetlanie tekstu polecenia bez zmieniania zasad zatwierdzania exec.
- `tools.exec.pathPrepend`: lista katalogów do dodania na początku `PATH` dla uruchomień exec (tylko Gateway + piaskownica).
- `tools.exec.safeBins`: bezpieczne binaria tylko dla stdin, które mogą działać bez jawnych wpisów na liście dozwolonych. Szczegóły zachowania znajdziesz w [Bezpieczne binaria](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: dodatkowe jawne katalogi zaufane dla kontroli ścieżek `safeBins`. Wpisy `PATH` nigdy nie są automatycznie zaufane. Wbudowane wartości domyślne to `/bin` i `/usr/bin`.
- `tools.exec.safeBinProfiles`: opcjonalne niestandardowe zasady argv dla każdego bezpiecznego binarium (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: scala `PATH` twojej powłoki logowania ze środowiskiem exec. Nadpisania `env.PATH` są
  odrzucane dla wykonywania na hoście. Sam daemon nadal działa z minimalnym `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: uruchamia `sh -lc` (powłokę logowania) wewnątrz kontenera, więc `/etc/profile` może zresetować `PATH`.
  OpenClaw dodaje `env.PATH` na początku po wczytaniu profilu przez wewnętrzną zmienną środowiskową (bez interpolacji powłoki);
  `tools.exec.pathPrepend` też ma tu zastosowanie.
- `host=node`: tylko nieblokowane nadpisania środowiska, które przekażesz, są wysyłane do Node. Nadpisania `env.PATH` są
  odrzucane dla wykonywania na hoście i ignorowane przez hosty Node. Jeśli potrzebujesz dodatkowych wpisów PATH na Node,
  skonfiguruj środowisko usługi hosta Node (systemd/launchd) albo zainstaluj narzędzia w standardowych lokalizacjach.

Powiązanie Node dla pojedynczego agenta (użyj indeksu listy agentów w konfiguracji):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interfejs sterowania: karta Nodes zawiera mały panel „Powiązanie Node exec” dla tych samych ustawień.

## Nadpisania sesji (`/exec`)

Użyj `/exec`, aby ustawić domyślne wartości **dla pojedynczej sesji** dla `host`, `security`, `ask` i `node`.
Wyślij `/exec` bez argumentów, aby wyświetlić bieżące wartości.

Przykład:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Model autoryzacji

`/exec` jest respektowane tylko dla **autoryzowanych nadawców** (listy dozwolonych kanałów/parowanie plus `commands.useAccessGroups`).
Aktualizuje **tylko stan sesji** i nie zapisuje konfiguracji. Aby trwale wyłączyć exec, zablokuj je przez zasady narzędzi
(`tools.deny: ["exec"]` albo dla pojedynczego agenta). Zatwierdzenia hosta nadal mają zastosowanie, chyba że jawnie ustawisz
`security=full` i `ask=off`.

## Zatwierdzenia exec (aplikacja towarzysząca / host Node)

Agenci w piaskownicy mogą wymagać zatwierdzenia każdego żądania, zanim `exec` uruchomi się na hoście Gateway lub Node.
Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać zasady, listę dozwolonych i przepływ w interfejsie użytkownika.

Gdy zatwierdzenia są wymagane, narzędzie exec natychmiast zwraca
`status: "approval-pending"` oraz identyfikator zatwierdzenia. Po zatwierdzeniu (albo odmowie / przekroczeniu czasu)
Gateway emituje zdarzenia systemowe (`Exec finished` / `Exec denied`). Jeśli polecenie nadal
działa po `tools.exec.approvalRunningNoticeMs`, emitowane jest pojedyncze powiadomienie `Exec running`.
W kanałach z natywnymi kartami/przyciskami zatwierdzeń agent powinien najpierw polegać na tym
natywnym interfejsie i dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia
jawnie mówi, że zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest
jedyną ścieżką.

## Lista dozwolonych + bezpieczne binaria

Ręczne egzekwowanie listy dozwolonych dopasowuje globy rozpoznanych ścieżek binarnych oraz globy samych nazw poleceń.
Same nazwy dopasowują tylko polecenia wywoływane przez PATH, więc `rg` może dopasować
`/opt/homebrew/bin/rg`, gdy polecenie to `rg`, ale nie `./rg` ani `/tmp/rg`.
Gdy `security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment potoku
znajduje się na liście dozwolonych albo jest bezpiecznym binarium. Łańcuchowanie (`;`, `&&`, `||`) i przekierowania
są odrzucane w trybie listy dozwolonych, chyba że każdy segment najwyższego poziomu spełnia
listę dozwolonych (w tym bezpieczne binaria). Przekierowania pozostają nieobsługiwane.
Trwałe zaufanie `allow-always` nie omija tej reguły: polecenie łańcuchowe nadal wymaga dopasowania każdego
segmentu najwyższego poziomu.

`autoAllowSkills` to osobna wygodna ścieżka w zatwierdzeniach exec. Nie jest tym samym co
ręczne wpisy listy dozwolonych ścieżek. Dla ścisłego jawnego zaufania pozostaw `autoAllowSkills` wyłączone.

Użyj tych dwóch kontrolek do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieniowe działające tylko na stdin.
- `tools.exec.safeBinTrustedDirs`: jawne dodatkowe zaufane katalogi dla ścieżek wykonywalnych safe-bin.
- `tools.exec.safeBinProfiles`: jawna polityka argv dla niestandardowych safe bins.
- lista dozwolonych: jawne zaufanie dla ścieżek wykonywalnych.

Nie traktuj `safeBins` jako ogólnej listy dozwolonych i nie dodawaj binariów interpreterów/środowisk uruchomieniowych (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli ich potrzebujesz, użyj jawnych wpisów listy dozwolonych i pozostaw włączone monity o zatwierdzenie.
`openclaw security audit` ostrzega, gdy wpisom interpreterów/środowisk uruchomieniowych w `safeBins` brakuje jawnych profili, a `openclaw doctor --fix` może utworzyć szkielet brakujących niestandardowych wpisów `safeBinProfiles`.
`openclaw security audit` i `openclaw doctor` ostrzegają również, gdy jawnie dodasz z powrotem do `safeBins` binaria o szerokim zachowaniu, takie jak `jq`.
Jeśli jawnie dodajesz interpretery do listy dozwolonych, włącz `tools.exec.strictInlineEval`, aby formy inline code-eval nadal wymagały nowego zatwierdzenia.

Pełne szczegóły polityki i przykłady znajdziesz w [Zatwierdzeniach exec](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only) oraz [Safe bins a lista dozwolonych](/pl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Przykłady

Pierwszoplanowo:

```json
{ "tool": "exec", "command": "ls -la" }
```

W tle + odpytywanie:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Odpytywanie służy do sprawdzania stanu na żądanie, a nie do pętli oczekiwania. Jeśli automatyczne wznowienie po zakończeniu
jest włączone, polecenie może wznowić sesję, gdy wygeneruje wyjście lub zakończy się niepowodzeniem.

Wyślij klawisze (w stylu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Prześlij (wyślij tylko CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklej (domyślnie w nawiasach):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` jest podnarzędziem `exec` do strukturalnych edycji wielu plików.
Jest domyślnie włączone dla modeli OpenAI i OpenAI Codex. Użyj konfiguracji tylko wtedy,
gdy chcesz je wyłączyć albo ograniczyć do konkretnych modeli:

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
- `deny: ["write"]` nie blokuje `apply_patch`; zablokuj `apply_patch` jawnie albo użyj `deny: ["group:fs"]`, gdy zapisy poprawek również mają być blokowane.
- Konfiguracja znajduje się pod `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` domyślnie ma wartość `true`; ustaw ją na `false`, aby wyłączyć narzędzie dla modeli OpenAI.
- `tools.exec.applyPatch.workspaceOnly` domyślnie ma wartość `true` (ograniczone do obszaru roboczego). Ustaw ją na `false` tylko wtedy, gdy celowo chcesz, aby `apply_patch` zapisywało/usuwało poza katalogiem obszaru roboczego.

## Powiązane

- [Zatwierdzenia exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Sandboxing](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach sandboxowych
- [Proces w tle](/pl/gateway/background-process) — długotrwałe narzędzie exec i process
- [Bezpieczeństwo](/pl/gateway/security) — polityka narzędzi i podwyższony dostęp
