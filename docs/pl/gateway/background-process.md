---
read_when:
    - Dodawanie lub modyfikowanie działania wykonywania w tle
    - Debugowanie długotrwałych zadań exec
summary: Wykonywanie exec w tle i zarządzanie procesami
title: Narzędzie do wykonywania poleceń w tle i obsługi procesów
x-i18n:
    generated_at: "2026-06-27T17:31:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw uruchamia polecenia powłoki przez narzędzie `exec` i przechowuje długotrwałe zadania w pamięci. Narzędzie `process` zarządza tymi sesjami w tle.

## narzędzie exec

Kluczowe parametry:

- `command` (wymagane)
- `yieldMs` (domyślnie 10000): automatyczne przeniesienie do tła po tym opóźnieniu
- `background` (bool): natychmiastowe przeniesienie do tła
- `timeout` (sekundy, domyślnie `tools.exec.timeoutSec`): zabija proces po tym limicie czasu; ustaw `timeout: 0` tylko po to, aby wyłączyć limit czasu procesu exec dla tego wywołania
- `elevated` (bool): uruchamia poza piaskownicą, jeśli tryb podwyższonych uprawnień jest włączony/dozwolony (domyślnie `gateway`, albo `node`, gdy cel exec to `node`)
- Potrzebujesz prawdziwego TTY? Ustaw `pty: true`.
- `workdir`, `env`

Zachowanie:

- Uruchomienia na pierwszym planie zwracają wyjście bezpośrednio.
- Po przeniesieniu do tła (jawnie lub po limicie czasu) narzędzie zwraca `status: "running"` + `sessionId` oraz krótki ogon wyjścia.
- Uruchomienia w tle i z `yieldMs` dziedziczą `tools.exec.timeoutSec`, chyba że wywołanie podaje jawny `timeout`.
- Wyjście jest przechowywane w pamięci, dopóki sesja nie zostanie odpytana lub wyczyszczona.
- Jeśli narzędzie `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
- Uruchomione polecenia exec otrzymują `OPENCLAW_SHELL=exec` na potrzeby reguł powłoki/profilu świadomych kontekstu.
- W przypadku długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone, a polecenie emituje wyjście lub kończy się niepowodzeniem.
- Jeśli automatyczne wybudzenie po zakończeniu jest niedostępne albo potrzebujesz potwierdzenia
  cichego sukcesu dla polecenia, które zakończyło się poprawnie bez wyjścia, użyj `process`,
  aby potwierdzić zakończenie.
- Nie emuluj przypomnień ani opóźnionych kontynuacji pętlami `sleep` lub powtarzanym
  odpytywaniem; do przyszłej pracy użyj cron.

## Mostkowanie procesów potomnych

Podczas uruchamiania długotrwałych procesów potomnych poza narzędziami exec/process (na przykład ponowne uruchomienia CLI lub pomocniki gateway) podłącz pomocnik mostka procesu potomnego, aby sygnały zakończenia były przekazywane dalej, a listenery odłączane przy wyjściu/błędzie. Zapobiega to osieroconym procesom w systemd i utrzymuje spójne zachowanie zamykania na różnych platformach.

Nadpisania środowiska:

- `OPENCLAW_BASH_YIELD_MS`: domyślne yield (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: limit wyjścia w pamięci (znaki)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limit oczekującego stdout/stderr na strumień (znaki)
- `OPENCLAW_BASH_JOB_TTL_MS`: TTL dla zakończonych sesji (ms, ograniczone do 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: próg bezczynności wyjścia, po którym zapisywalne sesje w tle są oznaczane jako prawdopodobnie czekające na wejście (domyślnie 15000 ms)

Konfiguracja (preferowana):

- `tools.exec.backgroundMs` (domyślnie 10000)
- `tools.exec.timeoutSec` (domyślnie 1800)
- `tools.exec.cleanupMs` (domyślnie 1800000)
- `tools.exec.notifyOnExit` (domyślnie true): dodaje zdarzenie systemowe do kolejki + żąda heartbeat, gdy exec uruchomiony w tle kończy działanie.
- `tools.exec.notifyOnExitEmptySuccess` (domyślnie false): gdy true, dodaje też zdarzenia zakończenia dla udanych uruchomień w tle, które nie wygenerowały wyjścia.

## narzędzie process

Akcje:

- `list`: uruchomione + zakończone sesje
- `poll`: pobiera nowe wyjście sesji (zgłasza też status zakończenia)
- `log`: odczytuje zagregowane wyjście i pokazuje wskazówki odzyskiwania wejścia (obsługuje `offset` + `limit`)
- `write`: wysyła stdin (`data`, opcjonalnie `eof`)
- `send-keys`: wysyła jawne tokeny klawiszy lub bajty do sesji opartej na PTY
- `submit`: wysyła Enter / powrót karetki do sesji opartej na PTY
- `paste`: wysyła tekst dosłowny, opcjonalnie opakowany w tryb bracketed paste
- `kill`: kończy sesję w tle
- `clear`: usuwa zakończoną sesję z pamięci
- `remove`: zabija, jeśli działa, w przeciwnym razie czyści, jeśli jest zakończona

Uwagi:

- Tylko sesje przeniesione do tła są listowane/utrwalane w pamięci.
- Sesje są tracone po restarcie procesu (brak utrwalania na dysku).
- Logi sesji są zapisywane w historii czatu tylko wtedy, gdy uruchomisz `process poll/log`, a wynik narzędzia zostanie zarejestrowany.
- `process` jest ograniczony do danego agenta; widzi tylko sesje uruchomione przez tego agenta.
- Użyj `poll` / `log` do statusu, logów, potwierdzenia cichego sukcesu lub
  potwierdzenia zakończenia, gdy automatyczne wybudzenie po zakończeniu jest niedostępne.
- Użyj `log` przed odzyskiwaniem interaktywnego CLI, aby bieżący transkrypt,
  stan stdin i wskazówka oczekiwania na wejście były widoczne razem.
- Użyj `write` / `send-keys` / `submit` / `paste` / `kill`, gdy potrzebujesz wejścia
  lub interwencji.
- `process list` zawiera wyprowadzoną `name` (czasownik polecenia + cel) do szybkiego przeglądania.
- `process list`, `poll` i `log` zgłaszają `waitingForInput` tylko wtedy,
  gdy sesja nadal ma zapisywalne stdin i była bezczynna dłużej niż próg
  oczekiwania na wejście.
- `process log` używa liniowych `offset`/`limit`.
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

Sprawdź sesję interaktywną przed wysłaniem wejścia:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
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

Wklej tekst dosłowny:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Powiązane

- [Narzędzie Exec](/pl/tools/exec)
- [Zatwierdzenia Exec](/pl/tools/exec-approvals)
