---
read_when:
    - Dodawanie lub modyfikowanie zachowania wykonywania poleceń w tle
    - Debugowanie długotrwałych zadań exec
summary: Wykonywanie exec w tle i zarządzanie procesami
title: Narzędzie do wykonywania poleceń w tle i zarządzania procesami
x-i18n:
    generated_at: "2026-04-30T09:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Wykonywanie w tle + narzędzie process

OpenClaw uruchamia polecenia powłoki przez narzędzie `exec` i przechowuje długotrwałe zadania w pamięci. Narzędzie `process` zarządza tymi sesjami w tle.

## Narzędzie exec

Kluczowe parametry:

- `command` (wymagane)
- `yieldMs` (domyślnie 10000): automatyczne przeniesienie w tło po tym opóźnieniu
- `background` (bool): natychmiastowe przeniesienie w tło
- `timeout` (sekundy, domyślnie `tools.exec.timeoutSec`): zabija proces po tym limicie czasu; ustaw `timeout: 0` tylko po to, aby wyłączyć limit czasu procesu exec dla tego wywołania
- `elevated` (bool): uruchamia poza piaskownicą, jeśli tryb podwyższony jest włączony/dozwolony (domyślnie `gateway`, albo `node`, gdy celem exec jest `node`)
- Potrzebujesz prawdziwego TTY? Ustaw `pty: true`.
- `workdir`, `env`

Zachowanie:

- Uruchomienia pierwszoplanowe zwracają wynik bezpośrednio.
- Po przeniesieniu w tło (jawnie lub przez limit czasu) narzędzie zwraca `status: "running"` + `sessionId` oraz krótki ogon wyjścia.
- Uruchomienia w tle i z `yieldMs` dziedziczą `tools.exec.timeoutSec`, chyba że wywołanie podaje jawny `timeout`.
- Wyjście jest przechowywane w pamięci, dopóki sesja nie zostanie odpytywana albo wyczyszczona.
- Jeśli narzędzie `process` jest niedozwolone, `exec` działa synchronicznie i ignoruje `yieldMs`/`background`.
- Uruchomione polecenia exec otrzymują `OPENCLAW_SHELL=exec` na potrzeby reguł powłoki/profilu świadomych kontekstu.
- Dla długotrwałej pracy, która zaczyna się teraz, uruchom ją raz i polegaj na automatycznym
  wybudzeniu po zakończeniu, gdy jest włączone i polecenie emituje wyjście albo kończy się niepowodzeniem.
- Jeśli automatyczne wybudzenie po zakończeniu jest niedostępne albo potrzebujesz potwierdzenia
  cichego sukcesu dla polecenia, które zakończyło się poprawnie bez wyjścia, użyj `process`,
  aby potwierdzić zakończenie.
- Nie emuluj przypomnień ani opóźnionych kontynuacji za pomocą pętli `sleep` ani powtarzanego
  odpytywania; używaj cron do przyszłej pracy.

## Mostkowanie procesów potomnych

Podczas uruchamiania długotrwałych procesów potomnych poza narzędziami exec/process (na przykład ponowne uruchomienia CLI albo pomocniki Gateway), dołącz pomocnik mostka procesów potomnych, aby sygnały zakończenia były przekazywane dalej, a listenery odłączane przy wyjściu/błędzie. Zapobiega to osieroconym procesom w systemd i utrzymuje spójne zachowanie zamykania na różnych platformach.

Nadpisania środowiska:

- `PI_BASH_YIELD_MS`: domyślne opóźnienie yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: limit wyjścia w pamięci (znaki)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: limit oczekującego stdout/stderr na strumień (znaki)
- `PI_BASH_JOB_TTL_MS`: TTL dla zakończonych sesji (ms, ograniczone do 1m–3h)

Konfiguracja (preferowana):

- `tools.exec.backgroundMs` (domyślnie 10000)
- `tools.exec.timeoutSec` (domyślnie 1800)
- `tools.exec.cleanupMs` (domyślnie 1800000)
- `tools.exec.notifyOnExit` (domyślnie true): kolejkowanie zdarzenia systemowego + żądanie Heartbeat, gdy exec przeniesiony w tło kończy działanie.
- `tools.exec.notifyOnExitEmptySuccess` (domyślnie false): gdy true, kolejkuje także zdarzenia zakończenia dla pomyślnych uruchomień w tle, które nie wygenerowały wyjścia.

## Narzędzie process

Akcje:

- `list`: uruchomione + zakończone sesje
- `poll`: pobiera nowe wyjście dla sesji (raportuje też status zakończenia)
- `log`: odczytuje zagregowane wyjście (obsługuje `offset` + `limit`)
- `write`: wysyła stdin (`data`, opcjonalnie `eof`)
- `send-keys`: wysyła jawne tokeny klawiszy albo bajty do sesji opartej na PTY
- `submit`: wysyła Enter / powrót karetki do sesji opartej na PTY
- `paste`: wysyła tekst literalny, opcjonalnie opakowany w tryb wklejania z nawiasami
- `kill`: kończy sesję w tle
- `clear`: usuwa zakończoną sesję z pamięci
- `remove`: zabija, jeśli działa, w przeciwnym razie czyści, jeśli jest zakończona

Uwagi:

- Tylko sesje przeniesione w tło są listowane/utrwalane w pamięci.
- Sesje są tracone po restarcie procesu (brak trwałości na dysku).
- Logi sesji są zapisywane w historii czatu tylko wtedy, gdy uruchomisz `process poll/log`, a wynik narzędzia zostanie zapisany.
- `process` jest zakresowane per agent; widzi tylko sesje uruchomione przez tego agenta.
- Używaj `poll` / `log` do statusu, logów, potwierdzenia cichego sukcesu albo
  potwierdzenia zakończenia, gdy automatyczne wybudzenie po zakończeniu jest niedostępne.
- Używaj `write` / `send-keys` / `submit` / `paste` / `kill`, gdy potrzebujesz wejścia
  albo interwencji.
- `process list` zawiera wyprowadzoną wartość `name` (czasownik polecenia + cel) do szybkiego przeglądania.
- `process log` używa opartego na liniach `offset`/`limit`.
- Gdy pominięto zarówno `offset`, jak i `limit`, zwraca ostatnie 200 linii i dołącza wskazówkę stronicowania.
- Gdy podano `offset`, a pominięto `limit`, zwraca od `offset` do końca (bez ograniczenia do 200).
- Odpytywanie służy do statusu na żądanie, nie do planowania pętli oczekiwania. Jeśli praca ma
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

Wklej tekst literalny:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Powiązane

- [Narzędzie exec](/pl/tools/exec)
- [Zatwierdzenia exec](/pl/tools/exec-approvals)
