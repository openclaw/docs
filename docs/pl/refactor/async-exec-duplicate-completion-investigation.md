---
read_when:
    - Debugowanie powtarzających się zdarzeń zakończenia exec Node
    - Praca nad deduplikacją heartbeat/zdarzeń systemowych
summary: Notatki dochodzeniowe dotyczące duplikowanego wstrzykiwania asynchronicznego zakończenia exec
title: Dochodzenie dotyczące duplikowanego zakończenia asynchronicznego exec
x-i18n:
    generated_at: "2026-04-24T09:30:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Zakres

- Sesja: `agent:main:telegram:group:-1003774691294:topic:1`
- Objaw: to samo asynchroniczne zakończenie exec dla sesji/uruchomienia `keen-nexus` zostało zapisane dwa razy w LCM jako tury użytkownika.
- Cel: ustalić, czy najbardziej prawdopodobne jest duplikowane wstrzyknięcie do sesji, czy zwykłe ponowienie dostarczenia wychodzącego.

## Wniosek

Najprawdopodobniej jest to **duplikowane wstrzyknięcie do sesji**, a nie czyste ponowienie dostarczenia wychodzącego.

Najsilniejsza luka po stronie gateway znajduje się w **ścieżce zakończenia exec Node**:

1. Zakończenie exec po stronie Node emituje `exec.finished` z pełnym `runId`.
2. Gateway `server-node-events` konwertuje to na zdarzenie systemowe i żąda heartbeat.
3. Uruchomienie heartbeat wstrzykuje opróżniony blok zdarzeń systemowych do promptu agenta.
4. Embedded runner zapisuje ten prompt jako nową turę użytkownika w transkrypcie sesji.

Jeśli to samo `exec.finished` z jakiegokolwiek powodu (replay, duplikat po reconnect, resend upstream, zduplikowany producent) dotrze do gateway dwa razy dla tego samego `runId`, OpenClaw obecnie **nie ma sprawdzenia idempotencji kluczowanego przez `runId`/`contextKey`** na tej ścieżce. Druga kopia stanie się drugą wiadomością użytkownika o tej samej treści.

## Dokładna ścieżka kodu

### 1. Producent: zdarzenie zakończenia exec Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emituje `node.event` ze zdarzeniem `exec.finished`.
  - Ładunek zawiera `sessionKey` i pełne `runId`.

### 2. Przyjmowanie zdarzeń przez Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Obsługuje `exec.finished`.
  - Buduje tekst:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Kolejkuje go przez:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Natychmiast żąda wybudzenia:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Słabość deduplikacji zdarzeń systemowych

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` tłumi tylko **kolejne duplikaty tekstu**:
    - `if (entry.lastText === cleaned) return false`
  - Przechowuje `contextKey`, ale **nie** używa `contextKey` do idempotencji.
  - Po opróżnieniu tłumienie duplikatów się resetuje.

Oznacza to, że ponownie odtworzone `exec.finished` z tym samym `runId` może zostać ponownie zaakceptowane później, mimo że kod ma już stabilnego kandydata do idempotencji (`exec:<runId>`).

### 4. Obsługa wybudzeń nie jest głównym źródłem duplikacji

- `src/infra/heartbeat-wake.ts:79-117`
  - Wybudzenia są koaleskowane według `(agentId, sessionKey)`.
  - Zduplikowane żądania wybudzenia dla tego samego celu zapadają się do jednego oczekującego wpisu wybudzenia.

To sprawia, że **same duplikaty obsługi wybudzeń** są słabszym wyjaśnieniem niż duplikowane przyjęcie zdarzenia.

### 5. Heartbeat konsumuje zdarzenie i zamienia je na wejście promptu

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight zagląda do oczekujących zdarzeń systemowych i klasyfikuje uruchomienia exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` opróżnia kolejkę dla sesji.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Opróżniony blok zdarzeń systemowych jest dołączany na początku body promptu agenta.

### 6. Punkt wstrzyknięcia do transkryptu

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` wysyła pełny prompt do osadzonej sesji PI.
  - To jest punkt, w którym prompt pochodzący z zakończenia staje się zapisaną turą użytkownika.

Zatem gdy to samo zdarzenie systemowe zostanie dwa razy przebudowane do promptu, zduplikowane wiadomości użytkownika w LCM są oczekiwane.

## Dlaczego czyste ponowienie dostarczenia wychodzącego jest mniej prawdopodobne

W heartbeat runner istnieje rzeczywista ścieżka niepowodzenia wychodzącego:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Najpierw generowana jest odpowiedź.
  - Dostarczenie wychodzące następuje później przez `deliverOutboundPayloads(...)`.
  - Niepowodzenie zwraca tam `{ status: "failed" }`.

Jednak dla tego samego wpisu w kolejce zdarzeń systemowych samo to **nie wystarcza**, aby wyjaśnić zduplikowane tury użytkownika:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Kolejka zdarzeń systemowych jest już opróżniona przed dostarczeniem wychodzącym.

Zatem samo ponowienie wysyłki kanałowej nie odtworzy tego samego zakolejkowanego zdarzenia. Może wyjaśniać brakujące/nieudane dostarczenie zewnętrzne, ale samo z siebie nie wyjaśnia drugiej identycznej wiadomości użytkownika w sesji.

## Drugorzędna możliwość o niższej pewności

W runnerze agenta istnieje pełna pętla ponownych prób uruchomienia:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Niektóre przejściowe błędy mogą ponowić całe uruchomienie i ponownie wysłać ten sam `commandBody`.

To może zduplikować zapisany prompt użytkownika **w ramach tego samego wykonania odpowiedzi**, jeśli prompt został już dołączony przed wystąpieniem warunku ponownej próby.

Oceniam to niżej niż duplikowane przyjęcie `exec.finished`, ponieważ:

- zaobserwowana luka wynosiła około 51 sekund, co bardziej wygląda na drugie wybudzenie/turę niż na ponowną próbę w procesie;
- raport wspomina już o powtarzających się niepowodzeniach wysyłania wiadomości, co bardziej wskazuje na osobną późniejszą turę niż natychmiastową ponowną próbę modelu/runtime.

## Hipoteza przyczyny źródłowej

Hipoteza o najwyższej pewności:

- Zakończenie `keen-nexus` przeszło przez **ścieżkę zdarzeń exec Node**.
- To samo `exec.finished` zostało dostarczone do `server-node-events` dwa razy.
- Gateway zaakceptował obie kopie, ponieważ `enqueueSystemEvent(...)` nie deduplikuje według `contextKey` / `runId`.
- Każde zaakceptowane zdarzenie wywołało heartbeat i zostało wstrzyknięte jako tura użytkownika do transkryptu PI.

## Proponowana mała chirurgiczna poprawka

Jeśli potrzebna jest poprawka, najmniejszą zmianą o dużej wartości jest:

- sprawić, by idempotencja exec/zdarzeń systemowych honorowała `contextKey` przez krótki horyzont, przynajmniej dla dokładnych powtórzeń `(sessionKey, contextKey, text)`;
- albo dodać dedykowaną deduplikację w `server-node-events` dla `exec.finished` kluczowaną przez `(sessionKey, runId, kind event)`.

To bezpośrednio zablokowałoby powtórzone duplikaty `exec.finished`, zanim staną się turami sesji.

## Powiązane

- [Narzędzie Exec](/pl/tools/exec)
- [Zarządzanie sesją](/pl/concepts/session)
