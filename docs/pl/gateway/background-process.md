---
read_when:
    - Dodawanie lub modyfikowanie zachowania `exec` w tle
    - Debugowanie długotrwałych zadań `exec`
summary: Wykonywanie `exec` w tle i zarządzanie procesami
title: Background Exec and Process Tool
x-i18n:
    generated_at: "2026-04-05T13:52:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Background Exec + Process Tool

OpenClaw uruchamia polecenia powłoki za pomocą narzędzia `exec` i przechowuje długotrwałe zadania w pamięci. Narzędzie `process` zarządza tymi sesjami w tle.

## Narzędzie exec

Kluczowe parametry:

- `command` (wymagane)
- `yieldMs` (domyślnie 10000): automatyczne przeniesienie do tła po tym opóźnieniu
- `background` (bool): natychmiastowe uruchomienie w tle
- `timeout` (sekundy, domyślnie 1800): zabija proces po upływie tego limitu czasu
- `elevated` (bool): uruchom poza sandboxem, jeśli tryb podwyższony jest włączony/dozwolony (`gateway` domyślnie lub `node`, gdy celem exec jest `node`)
- Potrzebujesz prawdziwego TTY? Ustaw `pty: true`.
- `workdir`, `env`

Zachowanie:

- Uruchomienia na pierwszym planie zwracają dane wyjściowe bezpośrednio.
- Po przeniesieniu do tła (jawnie lub po przekroczeniu czasu) narzędzie zwraca `status: "running"` + `sessionId` oraz krótki końcowy fragment logu.
- Dane wyjściowe są przechowywane w pamięci, dopóki sesja nie zostanie odpytana lub wyczyszczona.
- Jeśli narzędzie `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
- Uruchomione polecenia exec otrzymują `OPENCLAW_SHELL=exec` dla reguł powłoki/profili uwzględniających kontekst.
- W przypadku długotrwałej pracy, która ma rozpocząć się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, jeśli jest włączone i polecenie zwraca dane wyjściowe lub kończy się błędem.
- Jeśli automatyczne wybudzenie po zakończeniu jest niedostępne albo potrzebujesz cichego potwierdzenia powodzenia
  dla polecenia, które zakończyło się poprawnie bez danych wyjściowych, użyj `process`,
  aby potwierdzić zakończenie.
- Nie emuluj przypomnień ani opóźnionych działań następczych za pomocą pętli `sleep` lub wielokrotnego
  odpytywania; do przyszłych zadań używaj cron.

## Mostkowanie procesów podrzędnych

Podczas uruchamiania długotrwałych procesów podrzędnych poza narzędziami exec/process (na przykład ponownych uruchomień CLI lub helperów gateway) dołącz helper mostkowania procesów podrzędnych, aby sygnały zakończenia były przekazywane, a nasłuchiwacze odłączane przy wyjściu/błędzie. Pozwala to uniknąć osieroconych procesów w systemd i utrzymuje spójne zachowanie zamykania na różnych platformach.

Nadpisania środowiska:

- `PI_BASH_YIELD_MS`: domyślny yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limit danych wyjściowych w pamięci (znaki)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limit oczekującego stdout/stderr na strumień (znaki)
- `PI_BASH_JOB_TTL_MS`: TTL dla zakończonych sesji (ms, ograniczone do 1 min–3 h)

Konfiguracja (zalecana):

- `tools.exec.backgroundMs` (domyślnie 10000)
- `tools.exec.timeoutSec` (domyślnie 1800)
- `tools.exec.cleanupMs` (domyślnie 1800000)
- `tools.exec.notifyOnExit` (domyślnie true): dodaje zdarzenie systemowe do kolejki + żąda heartbeat, gdy `exec` w tle się zakończy.
- `tools.exec.notifyOnExitEmptySuccess` (domyślnie false): gdy ma wartość true, dodaje także zdarzenia zakończenia dla pomyślnych uruchomień w tle, które nie wygenerowały danych wyjściowych.

## Narzędzie process

Akcje:

- `list`: uruchomione + zakończone sesje
- `poll`: pobiera nowe dane wyjściowe dla sesji (zgłasza także status zakończenia)
- `log`: odczytuje zagregowane dane wyjściowe (obsługuje `offset` + `limit`)
- `write`: wysyła stdin (`data`, opcjonalnie `eof`)
- `send-keys`: wysyła jawne tokeny klawiszy lub bajty do sesji opartej na PTY
- `submit`: wysyła Enter / powrót karetki do sesji opartej na PTY
- `paste`: wysyła dosłowny tekst, opcjonalnie opakowany w tryb bracketed paste
- `kill`: kończy sesję w tle
- `clear`: usuwa zakończoną sesję z pamięci
- `remove`: zabija, jeśli działa, w przeciwnym razie czyści, jeśli została zakończona

Uwagi:

- Tylko sesje przeniesione do tła są wyświetlane/przechowywane w pamięci.
- Sesje są tracone po ponownym uruchomieniu procesu (brak trwałości na dysku).
- Logi sesji są zapisywane do historii czatu tylko wtedy, gdy uruchomisz `process poll/log`, a wynik narzędzia zostanie zarejestrowany.
- `process` jest ograniczone do agenta; widzi tylko sesje uruchomione przez tego agenta.
- Używaj `poll` / `log` do sprawdzania stanu, logów, cichego potwierdzenia powodzenia lub
  potwierdzenia zakończenia, gdy automatyczne wybudzenie po zakończeniu jest niedostępne.
- Używaj `write` / `send-keys` / `submit` / `paste` / `kill`, gdy potrzebujesz danych wejściowych
  lub interwencji.
- `process list` zawiera pochodne `name` (czasownik polecenia + cel) do szybkiego przeglądu.
- `process log` używa opartych na wierszach `offset`/`limit`.
- Gdy pominięto zarówno `offset`, jak i `limit`, zwraca ostatnie 200 wierszy i zawiera wskazówkę stronicowania.
- Gdy podano `offset`, a pominięto `limit`, zwraca dane od `offset` do końca (bez ograniczenia do 200).
- Odpytywanie służy do sprawdzania stanu na żądanie, a nie do planowania pętli oczekiwania. Jeśli zadanie ma
  zostać wykonane później, użyj cron.

## Przykłady

Uruchom długie zadanie i odpytaj później:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Uruchom od razu w tle:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Wyślij stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Wyślij klawisze PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Zatwierdź bieżący wiersz:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklej dosłowny tekst:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```
