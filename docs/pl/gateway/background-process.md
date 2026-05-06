---
read_when:
    - Dodawanie lub modyfikowanie zachowania wykonywania w tle
    - Debugowanie długotrwałych zadań exec
summary: Wykonywanie exec w tle i zarządzanie procesami
title: Narzędzie do wykonywania w tle i obsługi procesów
x-i18n:
    generated_at: "2026-05-06T09:11:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw uruchamia polecenia powłoki przez narzędzie `exec` i przechowuje długotrwałe zadania w pamięci. Narzędzie `process` zarządza tymi sesjami w tle.

## Narzędzie exec

Kluczowe parametry:

- `command` (wymagany)
- `yieldMs` (domyślnie 10000): automatyczne przeniesienie do tła po tym opóźnieniu
- `background` (bool): natychmiast przenieś do tła
- `timeout` (sekundy, domyślnie `tools.exec.timeoutSec`): zakończ proces po tym limicie czasu; ustaw `timeout: 0` tylko po to, aby wyłączyć limit czasu procesu exec dla tego wywołania
- `elevated` (bool): uruchom poza piaskownicą, jeśli tryb podwyższony jest włączony/dozwolony (domyślnie `gateway`, albo `node`, gdy celem exec jest `node`)
- Potrzebujesz prawdziwego TTY? Ustaw `pty: true`.
- `workdir`, `env`

Zachowanie:

- Uruchomienia na pierwszym planie zwracają wynik bezpośrednio.
- Po przeniesieniu do tła (jawnie lub po przekroczeniu czasu) narzędzie zwraca `status: "running"` + `sessionId` oraz krótki końcowy fragment wyniku.
- Uruchomienia w tle i z `yieldMs` dziedziczą `tools.exec.timeoutSec`, chyba że wywołanie poda jawny `timeout`.
- Wynik jest przechowywany w pamięci do momentu odpytania lub wyczyszczenia sesji.
- Jeśli narzędzie `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
- Uruchomione polecenia exec otrzymują `OPENCLAW_SHELL=exec` dla reguł powłoki/profilu uwzględniających kontekst.
- W przypadku długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po ukończeniu, gdy jest włączone i polecenie generuje wynik lub kończy się błędem.
- Jeśli automatyczne wybudzenie po ukończeniu jest niedostępne albo potrzebujesz
  potwierdzenia cichego sukcesu dla polecenia, które zakończyło się poprawnie bez wyniku, użyj `process`,
  aby potwierdzić ukończenie.
- Nie emuluj przypomnień ani opóźnionych działań następczych za pomocą pętli `sleep` lub powtarzanego
  odpytywania; użyj cron do przyszłej pracy.

## Mostkowanie procesów potomnych

Podczas uruchamiania długotrwałych procesów potomnych poza narzędziami exec/process (na przykład ponownych uruchomień CLI lub pomocników Gateway), dołącz pomocnik mostka procesu potomnego, aby sygnały zakończenia były przekazywane, a nasłuchiwacze odłączani przy wyjściu/błędzie. Zapobiega to osieroconym procesom w systemd i utrzymuje spójne zachowanie zamykania na różnych platformach.

Nadpisania środowiska:

- `PI_BASH_YIELD_MS`: domyślne oczekiwanie (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limit wyniku w pamięci (znaki)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limit oczekujących stdout/stderr na strumień (znaki)
- `PI_BASH_JOB_TTL_MS`: TTL dla zakończonych sesji (ms, ograniczone do 1m–3h)

Konfiguracja (preferowana):

- `tools.exec.backgroundMs` (domyślnie 10000)
- `tools.exec.timeoutSec` (domyślnie 1800)
- `tools.exec.cleanupMs` (domyślnie 1800000)
- `tools.exec.notifyOnExit` (domyślnie true): dodaj zdarzenie systemowe do kolejki + zażądaj Heartbeat, gdy exec przeniesiony do tła zakończy działanie.
- `tools.exec.notifyOnExitEmptySuccess` (domyślnie false): gdy true, dodawaj także zdarzenia ukończenia dla udanych uruchomień w tle, które nie wygenerowały wyniku.

## Narzędzie process

Akcje:

- `list`: uruchomione + zakończone sesje
- `poll`: pobierz nowy wynik dla sesji (raportuje też status zakończenia)
- `log`: odczytaj zagregowany wynik (obsługuje `offset` + `limit`)
- `write`: wyślij stdin (`data`, opcjonalne `eof`)
- `send-keys`: wyślij jawne tokeny klawiszy lub bajty do sesji opartej na PTY
- `submit`: wyślij Enter / powrót karetki do sesji opartej na PTY
- `paste`: wyślij dosłowny tekst, opcjonalnie opakowany w tryb bracketed paste
- `kill`: zakończ sesję w tle
- `clear`: usuń zakończoną sesję z pamięci
- `remove`: zakończ, jeśli działa, w przeciwnym razie wyczyść, jeśli zakończona

Uwagi:

- Tylko sesje przeniesione do tła są wymieniane/utrwalane w pamięci.
- Sesje są tracone po restarcie procesu (brak trwałości na dysku).
- Logi sesji są zapisywane w historii czatu tylko wtedy, gdy uruchomisz `process poll/log`, a wynik narzędzia zostanie zarejestrowany.
- `process` ma zakres na agenta; widzi tylko sesje uruchomione przez tego agenta.
- Użyj `poll` / `log` do statusu, logów, potwierdzenia cichego sukcesu lub
  potwierdzenia ukończenia, gdy automatyczne wybudzenie po ukończeniu jest niedostępne.
- Użyj `write` / `send-keys` / `submit` / `paste` / `kill`, gdy potrzebujesz danych wejściowych
  lub interwencji.
- `process list` zawiera wyprowadzoną `name` (czasownik polecenia + cel) do szybkiego przeglądania.
- `process log` używa `offset`/`limit` opartych na liniach.
- Gdy pominięto zarówno `offset`, jak i `limit`, zwraca ostatnie 200 linii i zawiera wskazówkę stronicowania.
- Gdy podano `offset`, a pominięto `limit`, zwraca od `offset` do końca (bez ograniczenia do 200).
- Odpytywanie służy do statusu na żądanie, a nie do planowania pętli oczekiwania. Jeśli praca ma
  wydarzyć się później, użyj zamiast tego cron.

## Przykłady

Uruchom długie zadanie i odpytaj później:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Uruchom natychmiast w tle:

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

Prześlij bieżącą linię:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Wklej dosłowny tekst:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Powiązane

- [Narzędzie Exec](/pl/tools/exec)
- [Zatwierdzenia Exec](/pl/tools/exec-approvals)
