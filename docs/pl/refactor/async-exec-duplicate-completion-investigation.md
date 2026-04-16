---
x-i18n:
    generated_at: "2026-04-16T09:50:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95e56c5411204363676f002059c942201503e2359515d1a4b409882cc2e04920
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Dochodzenie w sprawie zduplikowanego zakończenia Async Exec

## Zakres

- Sesja: `agent:main:telegram:group:-1003774691294:topic:1`
- Objaw: to samo zakończenie async exec dla session/run `keen-nexus` zostało zapisane dwa razy w LCM jako tury użytkownika.
- Cel: ustalić, czy najbardziej prawdopodobne jest zduplikowane wstrzyknięcie do sesji, czy zwykła ponowna próba dostarczenia wychodzącej wiadomości.

## Wniosek

Najbardziej prawdopodobne jest **zduplikowane wstrzyknięcie do sesji**, a nie czysta ponowna próba dostarczenia wychodzącej wiadomości.

Najsilniejsza luka po stronie Gateway znajduje się w **ścieżce zakończenia exec na węźle**:

1. Zakończenie exec po stronie węzła emituje `exec.finished` z pełnym `runId`.
2. Gateway `server-node-events` przekształca to w zdarzenie systemowe i żąda heartbeat.
3. Uruchomienie heartbeat wstrzykuje opróżniony blok zdarzeń systemowych do promptu agenta.
4. Osadzony runner zapisuje ten prompt jako nową turę użytkownika w transkrypcji sesji.

Jeśli to samo `exec.finished` dotrze do Gateway dwa razy dla tego samego `runId` z dowolnego powodu (replay, duplikat po reconnect, ponowne wysłanie upstream, zduplikowany producent), OpenClaw obecnie **nie ma sprawdzenia idempotencji opartego na `runId`/`contextKey`** na tej ścieżce. Druga kopia stanie się drugą wiadomością użytkownika o tej samej treści.

## Dokładna ścieżka kodu

### 1. Producent: zdarzenie zakończenia exec na węźle

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emituje `node.event` ze zdarzeniem `exec.finished`.
  - Payload zawiera `sessionKey` i pełne `runId`.

### 2. Przyjęcie zdarzenia przez Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Obsługuje `exec.finished`.
  - Buduje tekst:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Umieszcza go w kolejce przez:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Natychmiast żąda wybudzenia:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Słabość deduplikacji zdarzeń systemowych

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` tłumi tylko **kolejne duplikaty tekstu**:
    - `if (entry.lastText === cleaned) return false`
  - Przechowuje `contextKey`, ale **nie** używa `contextKey` do idempotencji.
  - Po opróżnieniu kolejki tłumienie duplikatów się resetuje.

To oznacza, że ponownie odtworzone `exec.finished` z tym samym `runId` może zostać ponownie zaakceptowane później, mimo że kod już miał stabilnego kandydata do idempotencji (`exec:<runId>`).

### 4. Obsługa wybudzenia nie jest głównym źródłem duplikacji

- `src/infra/heartbeat-wake.ts:79-117`
  - Wybudzenia są koaleskowane według `(agentId, sessionKey)`.
  - Zduplikowane żądania wybudzenia dla tego samego celu zapadają się do jednego oczekującego wpisu wybudzenia.

To sprawia, że **same zduplikowane wybudzenia** są słabszym wyjaśnieniem niż zduplikowane przyjęcie zdarzenia.

### 5. Heartbeat zużywa zdarzenie i zamienia je na wejście promptu

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight podejmuje podgląd oczekujących zdarzeń systemowych i klasyfikuje uruchomienia exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` opróżnia kolejkę dla sesji.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Opróżniony blok zdarzeń systemowych jest dołączany na początku treści promptu agenta.

### 6. Punkt wstrzyknięcia do transkrypcji

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` wysyła pełny prompt do osadzonej sesji PI.
  - To jest punkt, w którym prompt pochodzący z zakończenia staje się zapisaną turą użytkownika.

Więc gdy to samo zdarzenie systemowe zostanie dwa razy odbudowane do promptu, zduplikowane wiadomości użytkownika w LCM są oczekiwane.

## Dlaczego zwykła ponowna próba dostarczenia wychodzącej wiadomości jest mniej prawdopodobna

W heartbeat runner istnieje rzeczywista ścieżka błędu wychodzącego:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Odpowiedź jest generowana najpierw.
  - Dostarczenie wychodzące następuje później przez `deliverOutboundPayloads(...)`.
  - Błąd zwraca `{ status: "failed" }`.

Jednak dla tego samego wpisu w kolejce zdarzeń systemowych samo to **nie wystarcza**, aby wyjaśnić zduplikowane tury użytkownika:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Kolejka zdarzeń systemowych jest już opróżniona przed dostarczeniem wychodzącym.

Więc samo ponowne wysłanie kanałowe nie odtworzyłoby tego samego zdarzenia w kolejce. Mogłoby wyjaśnić brak/niepowodzenie dostarczenia zewnętrznego, ale samo w sobie nie wyjaśnia drugiej identycznej wiadomości użytkownika w sesji.

## Wtórna, mniej pewna możliwość

W runnerze agenta istnieje pełna pętla ponawiania uruchomienia:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Niektóre błędy przejściowe mogą ponowić całe uruchomienie i ponownie wysłać ten sam `commandBody`.

To może zduplikować zapisaną turę użytkownika **w ramach tego samego wykonania odpowiedzi**, jeśli prompt został już dołączony przed wystąpieniem warunku ponowienia.

Oceniam to niżej niż zduplikowane przyjęcie `exec.finished`, ponieważ:

- obserwowana luka wynosiła około 51 sekund, co bardziej wygląda na drugie wybudzenie/turę niż na ponowienie w trakcie procesu;
- raport już wspomina o powtarzających się błędach wysyłki wiadomości, co bardziej wskazuje na osobną późniejszą turę niż na natychmiastowe ponowienie modelu/runtime.

## Hipoteza przyczyny źródłowej

Hipoteza o najwyższej pewności:

- Zakończenie `keen-nexus` przyszło przez **ścieżkę zdarzenia exec na węźle**.
- To samo `exec.finished` zostało dostarczone do `server-node-events` dwa razy.
- Gateway zaakceptował oba, ponieważ `enqueueSystemEvent(...)` nie deduplikuje według `contextKey` / `runId`.
- Każde zaakceptowane zdarzenie wywołało heartbeat i zostało wstrzyknięte jako tura użytkownika do transkrypcji PI.

## Proponowana mała, chirurgiczna poprawka

Jeśli ma zostać wprowadzona poprawka, najmniejsza wartościowa zmiana to:

- sprawić, by idempotencja exec/zdarzeń systemowych uwzględniała `contextKey` przez krótki horyzont, przynajmniej dla dokładnych powtórzeń `(sessionKey, contextKey, text)`;
- albo dodać deduplikację bezpośrednio w `server-node-events` dla `exec.finished`, opartą na `(sessionKey, runId, rodzaj zdarzenia)`.

To bezpośrednio zablokowałoby zduplikowane `exec.finished` z replay zanim staną się turami sesji.
