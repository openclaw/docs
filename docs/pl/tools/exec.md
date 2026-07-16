---
read_when:
    - Używanie lub modyfikowanie narzędzia exec
    - Debugowanie działania stdin lub TTY
summary: Korzystanie z narzędzia exec, tryby stdin i obsługa TTY
title: Narzędzie Exec
x-i18n:
    generated_at: "2026-07-16T19:10:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Uruchamiaj polecenia powłoki w obszarze roboczym. `exec` jest modyfikującym interfejsem powłoki: polecenia mogą tworzyć, edytować lub usuwać pliki wszędzie tam, gdzie zezwala na to system plików wybranego hosta lub piaskownicy. Wyłączenie narzędzi systemu plików OpenClaw, takich jak `write`, `edit` lub `apply_patch`, nie sprawia, że `exec` staje się tylko do odczytu.

Obsługuje wykonywanie na pierwszym planie i w tle za pośrednictwem `process`. Jeśli `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`. Sesje działające w tle są ograniczone do poszczególnych agentów; `process` widzi tylko sesje tego samego agenta.

## Parametry

<ParamField path="command" type="string" required>
Polecenie powłoki do uruchomienia.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Katalog roboczy polecenia.
</ParamField>

<ParamField path="env" type="object">
Nadpisania zmiennych środowiskowych w postaci klucz/wartość, scalane z odziedziczonym środowiskiem.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Automatyczne przeniesienie polecenia do tła po tym opóźnieniu (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Natychmiastowe przeniesienie polecenia do tła zamiast oczekiwania na `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Nadpisuje skonfigurowany limit czasu wykonywania dla tego wywołania, w sekundach. Dotyczy wykonywania na pierwszym planie, w tle, przez `yieldMs`, Gateway, piaskownicę oraz `system.run` Node. `timeout: 0` wyłącza limit czasu procesu wykonywania dla tego wywołania.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Uruchamia w pseudoterminalu, gdy jest dostępny. Należy używać w przypadku interfejsów CLI wymagających TTY, agentów programistycznych i terminalowych interfejsów użytkownika.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Miejsce wykonywania. `auto` jest rozwiązywane jako `sandbox`, gdy środowisko uruchomieniowe piaskownicy jest aktywne, a w przeciwnym razie jako `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignorowane w przypadku zwykłych wywołań narzędzi. Zabezpieczenia `gateway`/`node` są kontrolowane przez `tools.exec.security` i plik zatwierdzeń hosta; tryb podwyższonych uprawnień może wymusić `security=full` tylko wtedy, gdy operator jawnie przyzna dostęp z podwyższonymi uprawnieniami.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Podstawowy tryb pytania pochodzi z `tools.exec.ask` i zatwierdzeń hosta. W przypadku wywołań modelu pochodzących z kanału wartość `ask` dla pojedynczego wywołania jest ignorowana, gdy obowiązującym trybem pytania hosta jest `off`; w przeciwnym razie może jedynie zaostrzyć tryb. Zaufani wewnętrzni klienci/API, którzy tworzą narzędzia wykonywania z jawną wartością `ask`, pozostają bez zmian.
</ParamField>

<ParamField path="node" type="string">
Identyfikator/nazwa Node, gdy `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Żąda trybu podwyższonych uprawnień: opuszcza piaskownicę i przechodzi do skonfigurowanej ścieżki hosta. `security=full` jest wymuszane tylko wtedy, gdy tryb podwyższonych uprawnień zostanie rozwiązany jako `full`.
</ParamField>

Uwagi:

- `host` akceptuje wyłącznie `auto`, `sandbox`, `gateway` lub `node`. Nie jest to selektor nazwy hosta; wartości przypominające nazwy hostów są odrzucane przed uruchomieniem polecenia.
- Wartość `host=node` dla pojedynczego wywołania jest dozwolona z `auto`; wartość `host=gateway` dla pojedynczego wywołania jest dozwolona tylko wtedy, gdy żadne środowisko uruchomieniowe piaskownicy nie jest aktywne.
- Bez dodatkowej konfiguracji `host=auto` nadal „po prostu działa”: brak piaskownicy oznacza rozwiązanie jako `gateway`; aktywna piaskownica oznacza pozostanie w piaskownicy.
- `elevated` opuszcza piaskownicę i przechodzi do skonfigurowanej ścieżki hosta: domyślnie `gateway` albo `node`, gdy `tools.exec.host=node` (lub domyślną wartością sesji jest `host=node`). Jest dostępne tylko wtedy, gdy dla bieżącej sesji/dostawcy włączono dostęp z podwyższonymi uprawnieniami.
- Zatwierdzenia `gateway`/`node` są kontrolowane przez plik zatwierdzeń hosta.
- `node` wymaga sparowanego Node (aplikacji towarzyszącej lub bezinterfejsowego hosta Node). Jeśli dostępnych jest wiele Node, należy ustawić `exec.node` lub `tools.exec.node`, aby wybrać jeden z nich.
- `exec host=node` jest jedyną ścieżką wykonywania poleceń powłoki dla Node; starsza otoczka `nodes.run` została usunięta.
- Na hostach innych niż Windows narzędzie wykonywania używa `SHELL`, jeśli je ustawiono; jeśli `SHELL` ma wartość `fish`, preferuje `bash` (lub `sh`) z `PATH`, aby uniknąć konstrukcji bash niezgodnych z fish, a następnie, jeśli żaden z nich nie istnieje, używa `SHELL`.
- Na hostach Windows narzędzie wykonywania preferuje wykrytą instalację PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, a następnie PATH), po czym używa Windows PowerShell 5.1.
- Na hostach Gateway innych niż Windows polecenia wykonywane przez bash i zsh używają migawki startowej. OpenClaw przechwytuje możliwe do załadowania aliasy/funkcje oraz niewielki, bezpieczny zestaw zmiennych środowiskowych z plików startowych powłoki do `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, a następnie ładuje tę migawkę przed każdym poleceniem wykonywania. Zmienne wyglądające na poufne są wykluczane; wykonywanie w piaskownicy i przez Node nie używa tej migawki. Aby wyłączyć tę ścieżkę migawki, należy ustawić `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` w środowisku procesu Gateway.
- Wykonywanie na hoście (`gateway`/`node`) odrzuca `env.PATH` oraz nadpisania modułu ładującego (`LD_*`/`DYLD_*`), aby zapobiec podmianie plików binarnych lub wstrzyknięciu kodu.
- OpenClaw ustawia `OPENCLAW_SHELL=exec` w środowisku uruchamianego polecenia (w tym podczas wykonywania w PTY i piaskownicy), aby reguły powłoki/profilu mogły wykryć kontekst narzędzia wykonywania.
- W przypadku uruchomień pochodzących z kanału OpenClaw udostępnia również w `OPENCLAW_CHANNEL_CONTEXT` ograniczony ładunek JSON z tożsamością nadawcy/czatu, jeśli kanał dostarczył te identyfikatory.
- `exec` nie może uruchamiać poleceń powłoki `openclaw channels login` ani `/approve`: `openclaw channels login` jest interaktywnym przepływem uwierzytelniania kanału, a `/approve` musi przechodzić przez procedurę obsługi polecenia zatwierdzania, a nie przez powłokę. Logowanie do kanału należy uruchomić w terminalu na hoście Gateway albo użyć narzędzia agenta do logowania właściwego dla danego kanału, jeśli takie istnieje (na przykład `whatsapp_login`).
- Ważne: piaskownica jest **domyślnie wyłączona**. Jeśli piaskownica jest wyłączona, niejawne `host=auto` jest rozwiązywane jako `gateway`. Jawne `host=sandbox` nadal bezpiecznie kończy się niepowodzeniem zamiast po cichu uruchamiać polecenie na hoście Gateway. Należy włączyć piaskownicę lub użyć `host=gateway` z zatwierdzeniami.
- Kontrole wstępne skryptów (wykrywające typowe błędy składni powłoki w skryptach Python/Node) sprawdzają wyłącznie pliki znajdujące się w obowiązującej granicy `workdir`. Jeśli ścieżka skryptu prowadzi poza `workdir`, kontrola wstępna tego pliku jest pomijana. Kontrola wstępna jest także całkowicie pomijana, gdy `host=gateway`, a obowiązującą zasadą jest `security=full` z `ask=off`.
- W przypadku długotrwałej pracy rozpoczynanej teraz należy uruchomić ją raz i polegać na automatycznym wznowieniu po zakończeniu, gdy jest ono włączone, a polecenie generuje dane wyjściowe lub kończy się niepowodzeniem. Do dzienników, stanu, danych wejściowych lub interwencji należy używać `process`; nie należy imitować harmonogramowania za pomocą pętli uśpienia, pętli limitu czasu ani wielokrotnego odpytywania.
- W przypadku pracy, która ma zostać wykonana później lub zgodnie z harmonogramem, należy używać Cron zamiast wzorców uśpienia/opóźnienia `exec`.

## Konfiguracja

| Klucz                               | Wartość domyślna                                       | Uwagi                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Domyślny limit czasu wykonywania każdego polecenia w sekundach. Ustawienie `timeout` dla danego wywołania zastępuje tę wartość; ustawienie `timeout: 0` dla danego wywołania wyłącza limit czasu procesu wykonawczego. |
| `tools.exec.host`                    | `auto`                                                 | Przyjmuje wartość `sandbox`, gdy środowisko uruchomieniowe piaskownicy jest aktywne, a w przeciwnym razie `gateway`.                    |
| `tools.exec.security`                | `deny` dla piaskownicy, `full` dla Gateway/Node, gdy nie ustawiono |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | nie ustawiono                                          | Znormalizowane ustawienie zasad. Zobacz [Tryby](#modes) poniżej. Nie można łączyć z `tools.exec.security`/`tools.exec.ask`.                              |
| `tools.exec.reviewer.model`          | skonfigurowany główny model agenta                     | Opcjonalne zastąpienie dostawcy/modelu na potrzeby przeglądu `mode=auto`.                                                                          |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Limit czasu każdego etapu przygotowania i ukończenia pracy modelu przeglądającego przed przekazaniem decyzji człowiekowi.                               |
| `tools.exec.node`                    | nie ustawiono                                          |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Gdy wartość wynosi true, sesje wykonywania działające w tle po zakończeniu dodają zdarzenie systemowe do kolejki i żądają Heartbeat.                    |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Emituje pojedyncze powiadomienie „w toku”, gdy wykonanie wymagające zatwierdzenia trwa dłużej niż podany czas (`0` wyłącza tę funkcję).    |
| `tools.exec.strictInlineEval`        | `false`                                                | Zobacz [Ewaluacja wbudowana](#inline-eval-strictinlineeval).                                                                                             |
| `tools.exec.commandHighlighting`     | `false`                                                | Gdy wartość wynosi true, monity o zatwierdzenie mogą wyróżniać w tekście polecenia fragmenty poleceń wyprowadzone przez parser. Ustawienie globalne lub dla danego agenta; nie zmienia zasad zatwierdzania. |
| `tools.exec.pathPrepend`             | nie ustawiono                                          | Lista katalogów dodawanych na początku zmiennej `PATH` podczas wykonywania poleceń (tylko Gateway i piaskownica).                            |
| `tools.exec.safeBins`                | nie ustawiono                                          | Bezpieczne programy binarne korzystające wyłącznie ze standardowego wejścia, które mogą działać bez jawnych wpisów na liście dozwolonych. Zobacz [Bezpieczne programy binarne](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only). |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Dodatkowe jawnie wskazane katalogi zaufane podczas sprawdzania ścieżek przez `safeBins`. Wpisy `PATH` nigdy nie są automatycznie uznawane za zaufane. |
| `tools.exec.safeBinProfiles`         | nie ustawiono                                          | Opcjonalne niestandardowe zasady argv dla każdego bezpiecznego programu binarnego (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`). |

Domyślnie wykonywanie na hoście przez Gateway i Node nie wymaga zatwierdzenia (`security=full`, `ask=off`) — wynika to z domyślnych zasad hosta, a nie z `host=auto`. Aby wymagać zatwierdzeń lub stosować listę dozwolonych, należy zaostrzyć zarówno `tools.exec.*`, jak i ustawienia w pliku zatwierdzeń hosta; zobacz [Zatwierdzanie wykonywania](/pl/tools/exec-approvals#yolo-mode-no-approval). Aby wymusić kierowanie przez Gateway lub Node niezależnie od stanu piaskownicy, ustaw `tools.exec.host` albo użyj `/exec host=...`.

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

### Tryby

`tools.exec.mode` jest znormalizowanym ustawieniem zasad. Jego ustawienie wyznacza wartości `security`/`ask` i nie można go łączyć z jawnymi ustawieniami `tools.exec.security`/`tools.exec.ask`.

| Tryb        | security    | ask       | Zachowanie                                                                                                                    |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Wykonywanie jest odrzucane.                                                                                                   |
| `allowlist` | `allowlist` | `off`     | Uruchamiane są tylko polecenia z listy dozwolonych lub bezpieczne programy binarne; żadne inne nie wywołują pytania.           |
| `ask`       | `allowlist` | `on-miss` | Dopasowania do listy dozwolonych są uruchamiane bezpośrednio; wszystkie pozostałe wymagają decyzji człowieka.                  |
| `auto`      | `allowlist` | `on-miss` | Dopasowania do listy dozwolonych lub bezpiecznych programów binarnych są uruchamiane bezpośrednio; wszystkie pozostałe trafiają najpierw do natywnego automatycznego recenzenta OpenClaw, a następnie, w razie potrzeby, do człowieka. |
| `full`      | `full`      | `off`     | Brak mechanizmu zatwierdzania.                                                                                                |

`ask`/`ask=always` nadal za każdym razem wymaga decyzji człowieka, niezależnie od trybu.

Zatwierdzenie przez automatycznego recenzenta jest jednorazowe. W Gateway OpenClaw przekazuje recenzentowi rozpoznaną ścieżkę pliku wykonywalnego i przypina wykonanie do tej samej ścieżki. Polecenia, których nie można sprowadzić do jednego możliwego do wyegzekwowania planu wykonania — takie jak heredoc, rozwinięcia powłoki lub nieobsługiwane cytowanie w programie opakowującym — wymagają zatwierdzenia przez człowieka, nawet jeśli model w przeciwnym razie by na nie zezwolił.

Zatwierdzenia poleceń serwera aplikacji Codex, które nie zostały już rozstrzygnięte przez jawne zasady środowiska uruchomieniowego lub zasady natywne, są kierowane do człowieka. OpenClaw nie uruchamia dla tych żądań skonfigurowanego recenzenta wykonywania, ponieważ Codex nie udostępnia możliwego do wyegzekwowania rozpoznanego pliku wykonywalnego, który pozwalałby powiązać decyzję recenzenta z poleceniem uruchamianym przez Codex.

### Ewaluacja wbudowana (`strictInlineEval`)

Gdy `tools.exec.strictInlineEval` ma wartość `true`, wbudowane formy ewaluacji interpretera wymagają decyzji recenzenta lub jawnego zatwierdzenia: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` oraz podobne formy w innych obsługiwanych interpreterach i nośnikach poleceń (`awk`, `find -exec`, `make`, `sed`, `xargs` i inne). W trybie `mode=auto` standardowa ścieżka zatwierdzania wykonywania może pozwolić natywnemu automatycznemu recenzentowi zatwierdzić jednorazowe polecenie o wyraźnie niskim ryzyku; bezpośrednie wywołania `system.run` na hoście Node nadal wymagają jawnego zatwierdzenia, ponieważ nie mogą przekazać polecenia do ścieżki zatwierdzania przez człowieka. Jeśli recenzent zażąda decyzji, żądanie trafia do człowieka. `allow-always` może nadal trwale zapisywać nieszkodliwe wywołania interpretera lub skryptu, ale formy ewaluacji wbudowanej nie stają się trwałymi regułami zezwalającymi.

### Obsługa PATH

- `host=gateway`: scala zmienną `PATH` powłoki logowania ze środowiskiem wykonywania. Zastąpienia `env.PATH` są odrzucane podczas wykonywania na hoście. Sam demon nadal działa z minimalną zmienną `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Aby konfiguracja powłoki użytkownika (taka jak `~/.zshenv` lub `/etc/zshenv`) nie zastępowała ścieżek priorytetowych podczas uruchamiania, wpisy `tools.exec.pathPrepend` są bezpiecznie dodawane na początku końcowej zmiennej `PATH` wewnątrz polecenia powłoki bezpośrednio przed wykonaniem.
- `host=sandbox`: uruchamia `sh -lc` (powłokę logowania) wewnątrz kontenera, dlatego `/etc/profile` może zresetować `PATH`. OpenClaw dodaje `env.PATH` na początku po wczytaniu profilu za pośrednictwem wewnętrznej zmiennej środowiskowej (bez interpolacji powłoki); `tools.exec.pathPrepend` ma zastosowanie również tutaj.
- `host=node`: do Node wysyłane są tylko przekazane, niezablokowane zastąpienia zmiennych środowiskowych. Zastąpienia `env.PATH` są odrzucane podczas wykonywania na hoście i ignorowane przez hosty Node. Jeśli na Node potrzebne są dodatkowe wpisy PATH, należy skonfigurować środowisko usługi hosta Node (systemd/launchd) lub zainstalować narzędzia w standardowych lokalizacjach.

Powiązanie Node z poszczególnymi agentami (należy użyć indeksu agenta z listy w konfiguracji):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Interfejs Control UI: strona **Urządzenia** zawiera niewielki panel „Powiązanie Node wykonywania” służący do konfigurowania tych samych ustawień.

## Zastąpienia sesji (`/exec`)

Użyj `/exec`, aby ustawić wartości domyślne **dla danej sesji** dla `host`, `security`, `ask` i `node`. Wyślij `/exec` bez argumentów, aby wyświetlić bieżące wartości.

Przykład:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` jest uwzględniane tylko w przypadku **autoryzowanych nadawców** (listy dozwolonych kanałów/parowanie oraz `commands.useAccessGroups`). Aktualizuje tylko **stan sesji** i nie zapisuje konfiguracji. Autoryzowani zewnętrzni nadawcy kanałów mogą ustawiać te wartości domyślne sesji. Wewnętrzni klienci Gateway/czatu internetowego potrzebują `operator.admin`, aby je utrwalić.

Aby całkowicie wyłączyć wykonywanie, należy zablokować je w zasadach narzędzi (`tools.deny: ["exec"]` lub ustawieniach danego agenta). Zatwierdzenia hosta nadal obowiązują, chyba że jawnie ustawi się `security=full` i `ask=off`.

## Zatwierdzanie wykonywania (aplikacja towarzysząca / host Node)

Agenci działający w piaskownicy mogą wymagać zatwierdzenia każdego żądania przed uruchomieniem `exec` na Gateway lub hoście Node. Zobacz [Zatwierdzanie wykonywania](/pl/tools/exec-approvals), aby poznać zasady, listę dozwolonych i przebieg w interfejsie użytkownika.

Gdy wymagane jest zatwierdzenie przez człowieka, przepływy hosta Node i nienatywne przepływy Gateway natychmiast zwracają `status: "approval-pending"` oraz identyfikator zatwierdzenia. Natywny czat i przepływy Gateway w interfejsie WWW mogą zamiast tego oczekiwać w miejscu i zwrócić końcowy wynik polecenia po zatwierdzeniu. Wynik `approval-pending` oznacza, że polecenie nie zostało uruchomione, dlatego ostrzeżenia o przejściu awaryjnym do wykonywania pierwszoplanowego pojawiają się tylko wtedy, gdy zatwierdzone polecenie rzeczywiście działa w miejscu. Zatwierdzone wykonania asynchroniczne emitują zdarzenia systemowe postępu i ukończenia polecenia (`Exec running` / `Exec finished`); odrzucone zatwierdzenia lub zatwierdzenia, których limit czasu upłynął, są stanami końcowymi i nie wybudzają sesji agenta zdarzeniem systemowym o odrzuceniu.

W kanałach z natywnymi kartami/przyciskami zatwierdzania agent powinien najpierw korzystać z tego natywnego interfejsu i dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wyraźnie wskazuje, że zatwierdzanie na czacie jest niedostępne lub zatwierdzenie ręczne jest jedyną możliwością.

## Lista dozwolonych + bezpieczne pliki binarne

Ręczne wymuszanie listy dozwolonych dopasowuje globy rozpoznanych ścieżek plików binarnych oraz globy samych nazw poleceń. Same nazwy pasują wyłącznie do poleceń wywoływanych przez PATH, więc `rg` może pasować do `/opt/homebrew/bin/rg`, gdy poleceniem jest `rg`, ale nie do `./rg` ani `/tmp/rg`.

Gdy `security=allowlist`, polecenia powłoki są automatycznie dozwolone tylko wtedy, gdy każdy segment potoku znajduje się na liście dozwolonych lub jest bezpiecznym plikiem binarnym. Łączenie (`;`, `&&`, `||`) i przekierowania są odrzucane w trybie listy dozwolonych, chyba że każdy segment najwyższego poziomu spełnia wymagania listy dozwolonych (w tym bezpiecznych plików binarnych). Przekierowania nadal nie są obsługiwane. Trwałe zaufanie `allow-always` nie omija tej reguły: polecenie połączone nadal wymaga dopasowania każdego segmentu najwyższego poziomu.

`autoAllowSkills` jest osobną ścieżką ułatwiającą zatwierdzanie wykonania, a nie odpowiednikiem ręcznych wpisów ścieżek na liście dozwolonych. Aby zachować ścisłe, jawne zaufanie, należy pozostawić `autoAllowSkills` wyłączone.

Oba mechanizmy służą do różnych zadań:

- `tools.exec.safeBins`: małe filtry strumieniowe przyjmujące dane wyłącznie przez stdin.
- `tools.exec.safeBinTrustedDirs`: dodatkowe, jawnie zaufane katalogi zawierające ścieżki bezpiecznych plików wykonywalnych.
- `tools.exec.safeBinProfiles`: jawna polityka argv dla niestandardowych bezpiecznych plików binarnych.
- lista dozwolonych: jawne zaufanie do ścieżek plików wykonywalnych.

Nie należy traktować `safeBins` jako ogólnej listy dozwolonych ani dodawać plików binarnych interpreterów/środowisk uruchomieniowych (na przykład `python3`, `node`, `ruby`, `bash`). Jeśli są potrzebne, należy użyć jawnych wpisów na liście dozwolonych i pozostawić włączone monity o zatwierdzenie.

`openclaw security audit` ostrzega, gdy wpisy interpreterów/środowisk uruchomieniowych `safeBins` nie mają jawnych profili, a `openclaw doctor --fix` może utworzyć szkielet brakujących niestandardowych wpisów `safeBinProfiles`. `openclaw security audit` i `openclaw doctor` ostrzegają również, gdy jawnie ponownie dodaje się pliki binarne o szerokim zakresie działania, takie jak `jq`, do `safeBins` (`jq` może odczytywać dane środowiskowe i ładować kod jq z modułów lub plików startowych, dlatego zamiast tego lepiej używać jawnych wpisów na liście dozwolonych albo uruchomień wymagających zatwierdzenia). `jq` jest odrzucany jako bezpieczny plik binarny, nawet jeśli został jawnie wymieniony. Jeśli interpretery zostaną jawnie dodane do listy dozwolonych, należy włączyć `tools.exec.strictInlineEval`, aby formy bezpośredniego wykonywania kodu nadal wymagały zatwierdzenia przez recenzenta lub jawnego zatwierdzenia.

Pełne informacje o zasadach i przykłady zawierają strony [Zatwierdzanie wykonania](/pl/tools/exec-approvals-advanced#safe-bins-stdin-only) oraz [Bezpieczne pliki binarne a lista dozwolonych](/pl/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Przykłady

Na pierwszym planie:

```json
{ "tool": "exec", "command": "ls -la" }
```

W tle + odpytywanie:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Odpytywanie służy do sprawdzania stanu na żądanie, a nie do tworzenia pętli oczekiwania. Jeśli automatyczne wybudzanie po zakończeniu jest włączone, polecenie może wybudzić sesję, gdy wygeneruje dane wyjściowe lub zakończy się niepowodzeniem.

Wysyłanie klawiszy (w stylu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Przesłanie (wysłanie tylko CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklejanie (domyślnie w trybie bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` jest podnarzędziem `exec` służącym do ustrukturyzowanej edycji wielu plików. Jest domyślnie włączone i dostępne dla każdego dostawcy modeli; `allowModels` może ograniczyć jego dostępność. Konfiguracji należy używać tylko wtedy, gdy narzędzie ma zostać wyłączone lub ograniczone do określonych modeli:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Uwagi:

- Polityka narzędzi nadal obowiązuje; `allow: ["write"]` niejawnie zezwala na `apply_patch`.
- `deny: ["write"]` nie blokuje `apply_patch`; należy jawnie zablokować `apply_patch` lub użyć `deny: ["group:fs"]`, jeśli zapisywanie poprawek również ma być zablokowane.
- Konfiguracja znajduje się w sekcji `tools.exec.applyPatch`.
- Wartość domyślna `tools.exec.applyPatch.enabled` to `true`; aby wyłączyć narzędzie, należy ustawić ją na `false`.
- Wartość domyślna `tools.exec.applyPatch.workspaceOnly` to `true` (ograniczenie do przestrzeni roboczej). Należy ustawić ją na `false` tylko wtedy, gdy `apply_patch` ma celowo zapisywać/usuwać dane poza katalogiem przestrzeni roboczej.
- `tools.exec.applyPatch.allowModels` jest opcjonalną listą dozwolonych identyfikatorów modeli (surowych, takich jak `gpt-5.4`, lub pełnych, takich jak `openai/gpt-5.4`). Gdy jest ustawiona, narzędzie otrzymują tylko pasujące modele; gdy nie jest ustawiona, otrzymują je wszystkie modele.

## Powiązane

- [Zatwierdzanie wykonania](/pl/tools/exec-approvals) — mechanizmy zatwierdzania poleceń powłoki
- [Piaskownica](/pl/gateway/sandboxing) — uruchamianie poleceń w środowiskach izolowanych
- [Proces w tle](/pl/gateway/background-process) — długotrwałe wykonywanie i narzędzie procesu
- [Bezpieczeństwo](/pl/gateway/security) — polityka narzędzi i podwyższony poziom dostępu
