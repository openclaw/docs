---
read_when:
    - Potrzebujesz dokładnego omówienia pętli agenta lub zdarzeń cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisy transkryptu lub zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-04-24T09:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Pętla agenta (OpenClaw)

Pętla agentowa to pełny „rzeczywisty” przebieg agenta: przyjęcie → złożenie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalenie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, jednocześnie utrzymując spójny stan sesji.

W OpenClaw pętla to pojedynczy, serializowany przebieg na sesję, który emituje zdarzenia cyklu życia i strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje wynik. Ten dokument wyjaśnia, jak ta autentyczna pętla jest
połączona end-to-end.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (wysoki poziom)

1. RPC `agent` waliduje parametry, rozwiązuje sesję (`sessionKey`/`sessionId`), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje domyślne wartości modelu + thinking/verbose/trace
   - ładuje snapshot Skills
   - wywołuje `runEmbeddedPiAgent` (środowisko wykonawcze pi-agent-core)
   - emituje **lifecycle end/error**, jeśli osadzona pętla tego nie wyemituje
3. `runEmbeddedPiAgent`:
   - serializuje przebiegi przez kolejki per sesja + globalne
   - rozwiązuje model + profil uwierzytelniania i buduje sesję Pi
   - subskrybuje zdarzenia Pi i strumieniuje delty assistant/tool
   - wymusza timeout -> przerywa przebieg po jego przekroczeniu
   - zwraca ładunki + metadane użycia
4. `subscribeEmbeddedPiSession` mostkuje zdarzenia pi-agent-core do strumienia OpenClaw `agent`:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **lifecycle end/error** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie + współbieżność

- Przebiegi są serializowane per klucz sesji (pas sesji), a opcjonalnie także przez pas globalny.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały wiadomości mogą wybierać tryby kolejkowania (collect/steer/followup), które zasilają ten system pasów.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkryptu są również chronione przez blokadę zapisu sesji na pliku sesji. Blokada jest
  świadoma procesu i oparta na pliku, więc wychwytuje zapisujących, którzy omijają kolejkę w procesie lub pochodzą
  z innego procesu.
- Blokady zapisu sesji są domyślnie niereentrantne. Jeśli pomocnik celowo zagnieżdża przejęcie
  tej samej blokady przy zachowaniu jednego logicznego zapisującego, musi jawnie włączyć to przez
  `allowReentrant: true`.

## Przygotowanie sesji + obszaru roboczego

- Obszar roboczy jest rozwiązywany i tworzony; przebiegi w sandboxie mogą przekierowywać do katalogu głównego obszaru roboczego sandboxa.
- Skills są ładowane (lub używane ponownie ze snapshotu) i wstrzykiwane do env oraz promptu.
- Pliki bootstrap/kontekstu są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Przejmowana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkryptu, Compaction lub obcinania musi przejąć tę samą blokadę przed otwarciem lub
  modyfikacją pliku transkryptu.

## Składanie promptu + prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań per przebieg.
- Wymuszane są limity specyficzne dla modelu i tokeny rezerwy dla Compaction.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty Hooków (gdzie można przechwycić)

OpenClaw ma dwa systemy Hooków:

- **Wewnętrzne Hooki** (Hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Pluginów**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzi i potoku gateway.

### Wewnętrzne Hooki (Hooki Gateway)

- **`agent:bootstrap`**: uruchamia się podczas budowania plików bootstrap przed finalizacją promptu systemowego.
  Użyj tego do dodawania/usuwania plików kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokumentację Hooków).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Pluginów (cykl życia agenta + gateway)

Są uruchamiane wewnątrz pętli agenta lub potoku gateway:

- **`before_model_resolve`**: uruchamia się przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązywaniem modelu.
- **`before_prompt_build`**: uruchamia się po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext` przed wysłaniem promptu. Używaj `prependContext` dla dynamicznego tekstu per tura, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znaleźć się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy Hook zgodności, który może uruchomić się w dowolnej fazie; preferuj jawne Hooki powyżej.
- **`before_agent_reply`**: uruchamia się po akcjach inline i przed wywołaniem LLM, umożliwiając Pluginowi przejęcie tury i zwrócenie syntetycznej odpowiedzi albo całkowite wyciszenie tury.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane przebiegu po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwują lub adnotują cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytują parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wbudowane wyniki skanowania i może opcjonalnie zablokować instalację Skill lub Pluginów.
- **`tool_result_persist`**: synchronicznie transformuje wyniki narzędzi przed zapisaniem ich do należącego do OpenClaw transkryptu sesji.
- **`message_received` / `message_sending` / `message_sent`**: Hooki wiadomości przychodzących + wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia gateway.

Reguły decyzji Hooków dla strażników wychodzących/narzędzi:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` nic nie robi i nie czyści wcześniejszego anulowania.

Zobacz [Hooki Pluginów](/pl/plugins/architecture-internals#provider-runtime-hooks), aby poznać API Hooków i szczegóły rejestracji.

Harnessy mogą adaptować te Hooki inaczej. Harness app-server Codex zachowuje
Hooki Pluginów OpenClaw jako kontrakt zgodności dla udokumentowanych powierzchni
lustrzanych, podczas gdy natywne Hooki Codex pozostają oddzielnym, niższego poziomu mechanizmem Codex.

## Strumieniowanie + częściowe odpowiedzi

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie blokowe może emitować częściowe odpowiedzi na `text_end` lub `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień lub jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać zachowanie chunkingu i odpowiedzi blokowych.

## Wykonanie narzędzi + narzędzia wiadomości

- Zdarzenia start/update/end narzędzi są emitowane w strumieniu `tool`.
- Wyniki narzędzi są sanityzowane pod kątem rozmiaru i ładunków obrazów przed logowaniem/emisją.
- Wysłania przez narzędzia wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie odpowiedzi + tłumienie

- Końcowe ładunki są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - podsumowań narzędzi inline (gdy verbose + dozwolone)
  - tekstu błędu asystenta, gdy model zgłasza błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  ładunków.
- Duplikaty z narzędzi wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostaną żadne renderowalne ładunki, a narzędzie zgłosiło błąd, emitowana jest zapasowa odpowiedź błędu narzędzia
  (chyba że narzędzie wiadomości wysłało już widoczną dla użytkownika odpowiedź).

## Compaction + ponowienia

- Automatyczna Compaction emituje zdarzenia strumienia `compaction` i może wywołać ponowienie.
- Przy ponowieniu bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyniku.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanałów czatu

- Delty asystenta są buforowane w wiadomości czatu `delta`.
- Czat `final` jest emitowany przy **lifecycle end/error**.

## Timeouty

- Domyślnie `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` to nadpisuje.
- Środowisko wykonawcze agenta: domyślnie `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane przez timer przerwania w `runEmbeddedPiAgent`.
- Timeout bezczynności LLM: `agents.defaults.llm.idleTimeoutSeconds` przerywa żądanie modelu, gdy przed upływem okna bezczynności nie nadejdą żadne chunki odpowiedzi. Ustaw to jawnie dla wolnych modeli lokalnych lub dostawców rozumowania/wywołań narzędzi; ustaw na 0, aby wyłączyć. Jeśli nie jest ustawione, OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, w przeciwnym razie 120 s. Przebiegi wyzwalane przez Cron bez jawnego timeoutu LLM lub agenta wyłączają watchdog bezczynności i polegają na zewnętrznym timeoutcie Cron.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Timeout agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway lub timeout RPC
- Timeout `agent.wait` (dotyczy tylko oczekiwania, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak długie rozmowy są podsumowywane
- [Zatwierdzenia exec](/pl/tools/exec-approvals) — bramki zatwierdzeń dla poleceń powłoki
- [Thinking](/pl/tools/thinking) — konfiguracja poziomu thinking/rozumowania
