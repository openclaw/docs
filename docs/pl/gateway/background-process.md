---
read_when:
    - Dodawanie lub modyfikowanie zachowania exec w tle
    - Debugowanie długotrwałych zadań exec
summary: Wykonywanie exec w tle i zarządzanie procesami
title: Narzędzie exec i process w tle
x-i18n:
    generated_at: "2026-04-24T09:08:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# Exec w tle + narzędzie process

OpenClaw uruchamia polecenia powłoki przez narzędzie `exec` i przechowuje długotrwałe zadania w pamięci. Narzędzie `process` zarządza tymi sesjami działającymi w tle.

## Narzędzie exec

Kluczowe parametry:

- `command` (wymagane)
- `yieldMs` (domyślnie 10000): automatyczne przeniesienie do tła po tym opóźnieniu
- `background` (bool): natychmiastowe uruchomienie w tle
- `timeout` (sekundy, domyślnie 1800): zabicie procesu po upływie tego limitu czasu
- `elevated` (bool): uruchomienie poza sandboxem, jeśli tryb podwyższony jest włączony/dozwolony (`gateway` domyślnie lub `node`, gdy celem exec jest `node`)
- Potrzebujesz prawdziwego TTY? Ustaw `pty: true`.
- `workdir`, `env`

Zachowanie:

- Uruchomienia na pierwszym planie zwracają dane wyjściowe bezpośrednio.
- Po przeniesieniu do tła (jawnie lub przez limit czasu) narzędzie zwraca `status: "running"` + `sessionId` i krótki końcowy fragment.
- Dane wyjściowe są przechowywane w pamięci, dopóki sesja nie zostanie odpytana lub wyczyszczona.
- Jeśli narzędzie `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
- Uruchomione polecenia exec otrzymują `OPENCLAW_SHELL=exec` na potrzeby zależnych od kontekstu reguł powłoki/profilu.
- W przypadku długotrwałej pracy, która ma zacząć się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone i polecenie generuje dane wyjściowe lub kończy się błędem.
- Jeśli automatyczne wybudzenie po zakończeniu jest niedostępne albo potrzebujesz potwierdzenia
  cichego sukcesu dla polecenia, które zakończyło się poprawnie bez danych wyjściowych, użyj `process`,
  aby potwierdzić zakończenie.
- Nie emuluj przypomnień ani opóźnionych działań następczych za pomocą pętli `sleep` lub powtarzanego
  odpytywania; do przyszłych zadań używaj Cron.

## Mostkowanie procesów potomnych

Podczas uruchamiania długotrwałych procesów potomnych poza narzędziami exec/process (na przykład przy ponownych uruchomieniach CLI lub pomocnikach gateway), dołącz pomocniczy most procesu potomnego, aby sygnały zakończenia były przekazywane, a nasłuchiwacze odłączane przy wyjściu/błędzie. Pozwala to uniknąć osieroconych procesów w systemd i utrzymuje spójne zachowanie wyłączania na różnych platformach.

Nadpisania środowiskowe:

- `PI_BASH_YIELD_MS`: domyślny yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limit danych wyjściowych w pamięci (znaki)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limit oczekujących `stdout`/`stderr` na strumień (znaki)
- `PI_BASH_JOB_TTL_MS`: TTL zakończonych sesji (ms, ograniczone do 1 min–3 h)

Konfiguracja (zalecana):

- `tools.exec.backgroundMs` (domyślnie 10000)
- `tools.exec.timeoutSec` (domyślnie 1800)
- `tools.exec.cleanupMs` (domyślnie 1800000)
- `tools.exec.notifyOnExit` (domyślnie true): umieszcza zdarzenie systemowe w kolejce + żąda Heartbeat, gdy exec działający w tle zakończy się.
- `tools.exec.notifyOnExitEmptySuccess` (domyślnie false): gdy ma wartość true, umieszcza też zdarzenia zakończenia dla pomyślnych uruchomień w tle, które nie wygenerowały danych wyjściowych.

## Narzędzie process

Akcje:

- `list`: sesje uruchomione + zakończone
- `poll`: pobranie nowych danych wyjściowych dla sesji (raportuje też status zakończenia)
- `log`: odczyt zagregowanych danych wyjściowych (obsługuje `offset` + `limit`)
- `write`: wysłanie `stdin` (`data`, opcjonalnie `eof`)
- `send-keys`: wysłanie jawnych tokenów klawiszy lub bajtów do sesji opartej na PTY
- `submit`: wysłanie Enter / carriage return do sesji opartej na PTY
- `paste`: wysłanie dosłownego tekstu, opcjonalnie opakowanego w tryb bracketed paste
- `kill`: zakończenie sesji działającej w tle
- `clear`: usunięcie zakończonej sesji z pamięci
- `remove`: zabicie, jeśli działa, lub wyczyszczenie, jeśli jest zakończona

Uwagi:

- Tylko sesje działające w tle są wyświetlane/przechowywane w pamięci.
- Sesje są tracone po ponownym uruchomieniu procesu (brak trwałości na dysku).
- Logi sesji są zapisywane do historii czatu tylko wtedy, gdy uruchomisz `process poll/log` i wynik narzędzia zostanie zapisany.
- `process` ma zakres per agent; widzi tylko sesje uruchomione przez tego agenta.
- Używaj `poll` / `log` do sprawdzania statusu, logów, potwierdzania cichego sukcesu lub
  potwierdzania zakończenia, gdy automatyczne wybudzenie po zakończeniu jest niedostępne.
- Używaj `write` / `send-keys` / `submit` / `paste` / `kill`, gdy potrzebujesz danych wejściowych
  lub interwencji.
- `process list` zawiera wyprowadzone `name` (czasownik polecenia + cel) do szybkiego przeglądania.
- `process log` używa opartych na liniach `offset`/`limit`.
- Gdy pominięto zarówno `offset`, jak i `limit`, zwraca ostatnie 200 linii i zawiera wskazówkę stronicowania.
- Gdy podano `offset`, a pominięto `limit`, zwraca dane od `offset` do końca (bez ograniczenia do 200).
- Odpytywanie służy do doraźnego sprawdzania statusu, a nie do planowania pętli oczekiwania. Jeśli praca
  ma zostać wykonana później, użyj Cron.

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

Wyślij bieżący wiersz:

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
