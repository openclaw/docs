---
read_when:
    - Dodawanie lub modyfikowanie zachowania wykonywania w tle
    - Debugowanie długotrwałych zadań exec
summary: Wykonywanie exec w tle i zarządzanie procesami
title: Narzędzie do wykonywania w tle i obsługi procesów
x-i18n:
    generated_at: "2026-05-10T19:34:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95fb986cf0c07ef3d054189ce2838b441ae24f07703f8edc1ddb8aca3a58b300
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw uruchamia polecenia powłoki przez narzędzie `exec` i przechowuje długotrwałe zadania w pamięci. Narzędzie `process` zarządza tymi sesjami w tle.

## Narzędzie exec

Kluczowe parametry:

- `command` (wymagane)
- `yieldMs` (domyślnie 10000): automatyczne przeniesienie do tła po tym opóźnieniu
- `background` (bool): natychmiastowe przeniesienie do tła
- `timeout` (sekundy, domyślnie `tools.exec.timeoutSec`): zabicie procesu po tym czasie oczekiwania; ustaw `timeout: 0` tylko po to, aby wyłączyć limit czasu procesu exec dla tego wywołania
- `elevated` (bool): uruchomienie poza piaskownicą, jeśli tryb podwyższony jest włączony/dozwolony (domyślnie `gateway` albo `node`, gdy celem exec jest `node`)
- Potrzebujesz prawdziwego TTY? Ustaw `pty: true`.
- `workdir`, `env`

Zachowanie:

- Uruchomienia na pierwszym planie zwracają dane wyjściowe bezpośrednio.
- Po przeniesieniu do tła (jawnym lub przez limit czasu) narzędzie zwraca `status: "running"` + `sessionId` oraz krótki ogon danych wyjściowych.
- Uruchomienia w tle i z `yieldMs` dziedziczą `tools.exec.timeoutSec`, chyba że wywołanie podaje jawny `timeout`.
- Dane wyjściowe są przechowywane w pamięci do czasu odpytywania lub wyczyszczenia sesji.
- Jeśli narzędzie `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
- Uruchomione polecenia exec otrzymują `OPENCLAW_SHELL=exec` na potrzeby reguł powłoki/profilu świadomych kontekstu.
- W przypadku długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po ukończeniu, gdy jest włączone, a polecenie emituje dane wyjściowe lub kończy się niepowodzeniem.
- Jeśli automatyczne wybudzenie po ukończeniu jest niedostępne albo potrzebujesz
  potwierdzenia cichego sukcesu dla polecenia, które zakończyło się poprawnie bez danych wyjściowych, użyj `process`,
  aby potwierdzić ukończenie.
- Nie emuluj przypomnień ani opóźnionych działań następczych pętlami `sleep` ani powtarzanym
  odpytywaniem; do przyszłej pracy użyj cron.

## Mostkowanie procesów potomnych

Podczas uruchamiania długotrwałych procesów potomnych poza narzędziami exec/process (na przykład ponowne uruchomienia CLI lub pomocnicy Gateway) dołącz pomocnika mostka procesu potomnego, aby sygnały zakończenia były przekazywane dalej, a nasłuchiwacze odłączane przy wyjściu/błędzie. Zapobiega to osieroconym procesom w systemd i utrzymuje spójne zachowanie zamykania na różnych platformach.

Nadpisania środowiska:

- `PI_BASH_YIELD_MS`: domyślne opóźnienie yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limit danych wyjściowych w pamięci (znaki)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limit oczekujących stdout/stderr na strumień (znaki)
- `PI_BASH_JOB_TTL_MS`: TTL dla zakończonych sesji (ms, ograniczony do 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: próg bezczynności danych wyjściowych, zanim zapisywalne sesje w tle zostaną oznaczone jako prawdopodobnie czekające na dane wejściowe (domyślnie 15000 ms)

Konfiguracja (preferowana):

- `tools.exec.backgroundMs` (domyślnie 10000)
- `tools.exec.timeoutSec` (domyślnie 1800)
- `tools.exec.cleanupMs` (domyślnie 1800000)
- `tools.exec.notifyOnExit` (domyślnie true): kolejkowanie zdarzenia systemowego + żądanie Heartbeat, gdy exec przeniesiony do tła kończy działanie.
- `tools.exec.notifyOnExitEmptySuccess` (domyślnie false): gdy true, kolejkuje także zdarzenia ukończenia dla udanych uruchomień w tle, które nie wygenerowały danych wyjściowych.

## Narzędzie process

Akcje:

- `list`: uruchomione + zakończone sesje
- `poll`: opróżnienie nowych danych wyjściowych dla sesji (zgłasza także status wyjścia)
- `log`: odczyt zagregowanych danych wyjściowych i pokazanie wskazówek odzyskiwania danych wejściowych (obsługuje `offset` + `limit`)
- `write`: wysłanie stdin (`data`, opcjonalnie `eof`)
- `send-keys`: wysłanie jawnych tokenów klawiszy lub bajtów do sesji opartej na PTY
- `submit`: wysłanie Enter / powrotu karetki do sesji opartej na PTY
- `paste`: wysłanie dosłownego tekstu, opcjonalnie opakowanego w tryb wklejania bracketed paste
- `kill`: zakończenie sesji w tle
- `clear`: usunięcie zakończonej sesji z pamięci
- `remove`: zabicie, jeśli działa; w przeciwnym razie wyczyszczenie, jeśli jest zakończona

Uwagi:

- Tylko sesje przeniesione do tła są listowane/utrwalane w pamięci.
- Sesje przepadają po ponownym uruchomieniu procesu (brak utrwalania na dysku).
- Logi sesji są zapisywane w historii czatu tylko wtedy, gdy uruchomisz `process poll/log`, a wynik narzędzia zostanie zarejestrowany.
- `process` ma zakres na agenta; widzi tylko sesje rozpoczęte przez tego agenta.
- Użyj `poll` / `log` do sprawdzenia statusu, logów, potwierdzenia cichego sukcesu lub
  potwierdzenia ukończenia, gdy automatyczne wybudzenie po ukończeniu jest niedostępne.
- Użyj `log` przed odzyskiwaniem interaktywnego CLI, aby bieżący zapis,
  stan stdin i wskazówka oczekiwania na dane wejściowe były widoczne razem.
- Użyj `write` / `send-keys` / `submit` / `paste` / `kill`, gdy potrzebujesz danych wejściowych
  lub interwencji.
- `process list` zawiera wyprowadzoną `name` (czasownik polecenia + cel) do szybkiego przeglądania.
- `process list`, `poll` i `log` zgłaszają `waitingForInput` tylko wtedy,
  gdy sesja nadal ma zapisywalne stdin i była bezczynna dłużej niż próg
  oczekiwania na dane wejściowe.
- `process log` używa liniowych `offset`/`limit`.
- Gdy pominięto zarówno `offset`, jak i `limit`, zwraca ostatnie 200 wierszy i zawiera wskazówkę stronicowania.
- Gdy podano `offset`, a pominięto `limit`, zwraca od `offset` do końca (bez ograniczenia do 200).
- Odpytywanie służy do statusu na żądanie, a nie do planowania pętli oczekiwania. Jeśli praca ma
  wydarzyć się później, zamiast tego użyj cron.

## Przykłady

Uruchom długie zadanie i odpytaj później:

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

Wyślij stdin:

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

Wklej dosłowny tekst:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Powiązane

- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
