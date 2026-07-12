---
read_when:
    - Dodawanie lub modyfikowanie działania wykonywania w tle
    - Debugowanie długotrwałych zadań exec
summary: Wykonywanie poleceń w tle i zarządzanie procesami
title: Wykonywanie w tle i narzędzie procesów
x-i18n:
    generated_at: "2026-07-12T15:06:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b540455797df71dcdb18b0caa5f5088e81ef8823e0ec79364bebad8e6f060f12
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw uruchamia polecenia powłoki za pomocą narzędzia `exec` i przechowuje długotrwałe zadania w pamięci. Narzędzie `process` zarządza tymi sesjami działającymi w tle.

## Narzędzie exec

Parametry:

| Parametr     | Opis                                                                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`    | Wymagany. Polecenie powłoki do uruchomienia.                                                                                                                                                                     |
| `workdir`    | Katalog roboczy; pomiń, aby użyć domyślnego bieżącego katalogu roboczego.                                                                                                                                         |
| `env`        | Dodatkowe zmienne środowiskowe dla polecenia.                                                                                                                                                                    |
| `yieldMs`    | Liczba milisekund oczekiwania przed przeniesieniem do tła (domyślnie 10000).                                                                                                                                      |
| `background` | Natychmiast uruchamia w tle.                                                                                                                                                                                      |
| `timeout`    | Limit czasu w sekundach (domyślnie `tools.exec.timeoutSec`); po jego upływie proces jest kończony. Ustaw `timeout: 0`, aby wyłączyć limit czasu procesu exec dla tego wywołania.                                    |
| `pty`        | Uruchamia w pseudoterminalu, jeśli jest dostępny (CLI wymagające TTY, agenci programistyczni).                                                                                                                     |
| `elevated`   | Uruchamia poza piaskownicą, jeśli tryb podwyższonych uprawnień jest włączony/dozwolony (domyślnie `gateway` lub `node`, gdy celem exec jest `node`).                                                               |
| `host`       | Cel exec: `auto`, `sandbox`, `gateway` lub `node`.                                                                                                                                                                |
| `node`       | Identyfikator/nazwa Node, używane z `host: "node"`.                                                                                                                                                              |

Działanie:

- Uruchomienia pierwszoplanowe zwracają dane wyjściowe bezpośrednio.
- Po przeniesieniu do tła (jawnie lub wskutek upływu czasu `yieldMs`) narzędzie zwraca `status: "running"` + `sessionId` oraz krótki końcowy fragment danych wyjściowych.
- Uruchomienia w tle i z `yieldMs` dziedziczą `tools.exec.timeoutSec`, chyba że wywołanie przekazuje jawny parametr `timeout`.
- Dane wyjściowe pozostają w pamięci do czasu sprawdzenia lub wyczyszczenia sesji.
- Jeśli narzędzie `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
- Uruchomione polecenia exec otrzymują `OPENCLAW_SHELL=exec` na potrzeby reguł powłoki/profilu uwzględniających kontekst.
- W przypadku długotrwałego zadania rozpoczynanego teraz: uruchom je raz i polegaj na automatycznym powiadomieniu o ukończeniu (jeśli jest włączone), gdy polecenie wygeneruje dane wyjściowe lub zakończy się niepowodzeniem.
- Jeśli automatyczne powiadomienie o ukończeniu jest niedostępne albo potrzebujesz potwierdzenia cichego powodzenia polecenia, które kończy się bez danych wyjściowych, sprawdź stan za pomocą `process`.
- Nie imituj przypomnień ani opóźnionych działań za pomocą pętli `sleep` lub wielokrotnego sprawdzania — do przyszłych zadań użyj cron.

### Nadpisywanie za pomocą zmiennych środowiskowych

| Zmienna                                  | Działanie                                                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | Domyślny czas oczekiwania przed przeniesieniem do tła (ms). Domyślnie 10000, ograniczony do zakresu 10–120000.                                 |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | Limit danych wyjściowych w pamięci (znaki).                                                                                                   |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | Limit oczekujących danych stdout/stderr na strumień (znaki).                                                                                  |
| `OPENCLAW_BASH_JOB_TTL_MS`               | TTL zakończonych sesji (ms), ograniczony do zakresu od 1 min do 3 godz.                                                                        |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | Próg bezczynności danych wyjściowych, po którym zapisywalne sesje w tle są oznaczane jako prawdopodobnie oczekujące na dane wejściowe. Domyślnie 15000. |

### Konfiguracja (preferowana zamiast nadpisywania zmiennymi środowiskowymi)

| Klucz                                  | Wartość domyślna | Działanie                                                                                                           |
| -------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000            | To samo co `OPENCLAW_BASH_YIELD_MS`.                                                                                |
| `tools.exec.timeoutSec`               | 1800             | Domyślny limit czasu dla pojedynczego wywołania.                                                                    |
| `tools.exec.cleanupMs`                | 1800000          | To samo co `OPENCLAW_BASH_JOB_TTL_MS`.                                                                              |
| `tools.exec.notifyOnExit`             | true             | Dodaje zdarzenie systemowe do kolejki i żąda Heartbeat, gdy wykonywanie exec w tle się zakończy.                    |
| `tools.exec.notifyOnExitEmptySuccess` | false            | Dodaje również zdarzenia ukończenia dla zakończonych powodzeniem uruchomień w tle, które nie wygenerowały danych wyjściowych. |

## Mostkowanie procesów potomnych

Podczas uruchamiania długotrwałych procesów potomnych poza narzędziami exec/process (ponowne uruchomienia CLI, procesy pomocnicze Gateway) dołącz funkcję pomocniczą mostka procesów potomnych, aby przekazywała sygnały zakończenia i odłączała procedury nasłuchujące po wyjściu/błędzie. Zapobiega to osieroconym procesom w systemd i zapewnia spójne zamykanie na różnych platformach.

## Narzędzie process

Działania:

| Działanie   | Efekt                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `list`      | Sesje uruchomione i zakończone.                                                                   |
| `poll`      | Pobiera nowe dane wyjściowe sesji (zgłasza również stan zakończenia).                              |
| `log`       | Odczytuje zagregowane dane wyjściowe i wskazówki odzyskiwania danych wejściowych. Obsługuje `offset` + `limit`. |
| `write`     | Wysyła dane na stdin (`data`, opcjonalnie `eof`).                                                  |
| `send-keys` | Wysyła jawne tokeny klawiszy lub bajty do sesji obsługiwanej przez PTY.                            |
| `submit`    | Wysyła Enter/powrót karetki do sesji obsługiwanej przez PTY.                                      |
| `paste`     | Wysyła tekst dosłowny, opcjonalnie opakowany w tryb wklejania nawiasowego.                         |
| `kill`      | Kończy sesję działającą w tle.                                                                    |
| `clear`     | Usuwa zakończoną sesję z pamięci.                                                                 |
| `remove`    | Kończy sesję, jeśli działa, lub czyści ją, jeśli jest zakończona.                                  |

Uwagi:

- Wyświetlane i przechowywane są tylko sesje działające w tle — wyłącznie w pamięci, nie na dysku. Sesje są tracone po ponownym uruchomieniu procesu.
- Aktywna sesja w tle blokuje kooperacyjne wstrzymanie hosta i bezpieczne ponowne uruchomienie Gateway, dopóki właściciel procesu nie potwierdzi jego faktycznego zakończenia.
- `process remove` może ukryć działającą sesję natychmiast po zażądaniu jej zakończenia; wstrzymanie i ponowne uruchomienie pozostają zablokowane do czasu potwierdzenia zakończenia.
- Dzienniki sesji są zapisywane w historii czatu tylko wtedy, gdy uruchomisz `process poll`/`log`, a wynik działania narzędzia zostanie zarejestrowany.
- Zakres `process` jest ograniczony do konkretnego agenta; widzi ono tylko sesje uruchomione przez tego agenta.
- Użyj `poll`/`log`, aby sprawdzić stan, dzienniki lub potwierdzić ukończenie, gdy automatyczne powiadomienie o ukończeniu jest niedostępne.
- Użyj `log` przed odzyskaniem interaktywnego CLI, aby bieżący zapis sesji, stan stdin i wskazówka oczekiwania na dane wejściowe były widoczne razem.
- Użyj `write`/`send-keys`/`submit`/`paste`/`kill`, gdy wymagane jest wprowadzenie danych lub interwencja.
- `process list` zawiera wyprowadzoną wartość `name` (czasownik polecenia + cel), która ułatwia szybkie przeglądanie.
- `process list`, `poll` i `log` zgłaszają `waitingForInput` tylko wtedy, gdy sesja nadal ma zapisywalne stdin i pozostaje bezczynna dłużej niż próg oczekiwania na dane wejściowe (domyślnie 15000 ms, `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`).
- `process log` używa opartego na wierszach `offset`/`limit`. Gdy oba parametry są pominięte, zwraca ostatnie 200 wierszy ze wskazówką dotyczącą stronicowania. Gdy ustawiono `offset`, ale nie `limit`, zwraca dane od `offset` do końca (bez ograniczenia do 200).
- Parametr `timeout` działania `poll` powoduje oczekiwanie przez maksymalnie podaną liczbę milisekund przed zwróceniem wyniku; wartości powyżej 30000 są ograniczane do 30000.
- Sprawdzanie służy do uzyskiwania stanu na żądanie, a nie do planowania pętli oczekiwania. Jeśli zadanie ma zostać wykonane później, użyj cron.

## Przykłady

Uruchom długie zadanie i sprawdź je później:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Sprawdź sesję interaktywną przed wysłaniem danych wejściowych:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

Uruchom natychmiast w tle:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Wyślij dane na stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Wyślij klawisze PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Prześlij bieżący wiersz:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklej tekst dosłowny:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Powiązane

- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzanie exec](/pl/tools/exec-approvals)
