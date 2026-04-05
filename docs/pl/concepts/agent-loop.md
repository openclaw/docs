---
read_when:
    - Potrzebujesz dokładnego omówienia pętli agenta lub zdarzeń cyklu życia
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-04-05T13:50:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Pętla agenta (OpenClaw)

Pętla agentowa to pełny „rzeczywisty” przebieg działania agenta: przyjęcie wejścia → złożenie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalenie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, jednocześnie utrzymując spójny stan sesji.

W OpenClaw pętla to pojedynczy, serializowany przebieg na sesję, który emituje zdarzenia cyklu życia i strumieni
podczas myślenia modelu, wywoływania narzędzi i strumieniowania danych wyjściowych. Ten dokument wyjaśnia, jak ta autentyczna pętla jest połączona od początku do końca.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (wysoki poziom)

1. RPC `agent` weryfikuje parametry, rozwiązuje sesję (sessionKey/sessionId), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje model + domyślne ustawienia thinking/verbose
   - ładuje migawkę Skills
   - wywołuje `runEmbeddedPiAgent` (środowisko uruchomieniowe pi-agent-core)
   - emituje **lifecycle end/error**, jeśli osadzona pętla tego nie wyemituje
3. `runEmbeddedPiAgent`:
   - serializuje przebiegi przez kolejki per sesja + globalne
   - rozwiązuje model + profil uwierzytelniania i buduje sesję pi
   - subskrybuje zdarzenia pi i strumieniuje delty assistant/tool
   - wymusza timeout -> przerywa przebieg po przekroczeniu
   - zwraca ładunki + metadane użycia
4. `subscribeEmbeddedPiSession` mostkuje zdarzenia pi-agent-core do strumienia OpenClaw `agent`:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **lifecycle end/error** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie + współbieżność

- Przebiegi są serializowane per klucz sesji (pas sesji) i opcjonalnie przez pas globalny.
- To zapobiega wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały wiadomości mogą wybierać tryby kolejkowania (collect/steer/followup), które zasilają ten system pasów.
  Zobacz [Command Queue](/concepts/queue).

## Przygotowanie sesji + workspace

- Workspace jest rozwiązywany i tworzony; przebiegi w sandboxie mogą zostać przekierowane do głównego katalogu workspace sandboxa.
- Skills są ładowane (lub ponownie używane z migawki) i wstrzykiwane do env oraz promptu.
- Pliki bootstrap/kontekstu są rozwiązywane i wstrzykiwane do raportu system prompt.
- Uzyskiwana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed rozpoczęciem strumieniowania.

## Składanie promptu + system prompt

- System prompt jest budowany z promptu bazowego OpenClaw, promptu Skills, kontekstu bootstrap oraz nadpisań dla danego przebiegu.
- Wymuszane są ograniczenia specyficzne dla modelu oraz tokeny rezerwowe dla kompaktowania.
- Zobacz [System prompt](/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty hooków (gdzie można przechwytywać)

OpenClaw ma dwa systemy hooków:

- **Wewnętrzne hooki** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki pluginów**: punkty rozszerzeń wewnątrz pętli agenta/narzędzi i potoku gateway.

### Wewnętrzne hooki (hooki Gateway)

- **`agent:bootstrap`**: uruchamia się podczas budowania plików bootstrap, zanim system prompt zostanie sfinalizowany.
  Użyj tego, aby dodawać/usuwać pliki kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokumentację Hooków).

Zobacz [Hooks](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki pluginów (cykl życia agenta + gateway)

Działają one wewnątrz pętli agenta lub potoku gateway:

- **`before_model_resolve`**: uruchamia się przed sesją (bez `messages`), aby deterministycznie nadpisać provider/model przed rozstrzygnięciem modelu.
- **`before_prompt_build`**: uruchamia się po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext` przed wysłaniem promptu. Używaj `prependContext` dla dynamicznego tekstu na turę, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znajdować się w przestrzeni system prompt.
- **`before_agent_start`**: przestarzały hook zgodności, który może uruchamiać się w obu fazach; preferuj powyższe jawne hooki.
- **`before_agent_reply`**: uruchamia się po działaniach inline i przed wywołaniem LLM, pozwalając pluginowi przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane przebiegu po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwują lub adnotują cykle kompaktowania.
- **`before_tool_call` / `after_tool_call`**: przechwytują parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wyniki skanowania wbudowanych elementów i opcjonalnie blokuje instalacje Skills lub pluginów.
- **`tool_result_persist`**: synchronicznie przekształca wyniki narzędzi, zanim zostaną zapisane do transkryptu sesji.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących i wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia gateway.

Zasady decyzji hooków dla ochrony wysyłania/narzędzi:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` nic nie robi i nie czyści wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` nic nie robi i nie czyści wcześniejszego anulowania.

Zobacz [Plugin hooks](/plugins/architecture#provider-runtime-hooks), aby poznać API hooków i szczegóły rejestracji.

## Strumieniowanie + odpowiedzi częściowe

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie bloków może emitować odpowiedzi częściowe przy `text_end` albo `message_end`.
- Strumieniowanie reasoning może być emitowane jako osobny strumień albo jako odpowiedzi blokowe.
- Zobacz [Streaming](/concepts/streaming), aby poznać zachowanie chunkingu i odpowiedzi blokowych.

## Wykonywanie narzędzi + narzędzia wiadomości

- Zdarzenia rozpoczęcia/aktualizacji/zakończenia narzędzia są emitowane w strumieniu `tool`.
- Wyniki narzędzi są oczyszczane pod kątem rozmiaru i ładunków obrazów przed logowaniem/emisją.
- Wysłania przez narzędzia wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie odpowiedzi + tłumienie

- Końcowe ładunki są składane z:
  - tekstu asystenta (oraz opcjonalnie reasoning)
  - podsumowań narzędzi inline (gdy verbose + dozwolone)
  - tekstu błędu asystenta, gdy model zwraca błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  ładunków.
- Duplikaty z narzędzi wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostaną żadne renderowalne ładunki, a narzędzie zwróciło błąd, emitowana jest awaryjna odpowiedź o błędzie narzędzia
  (chyba że narzędzie wiadomości wysłało już odpowiedź widoczną dla użytkownika).

## Kompaktowanie + ponowne próby

- Automatyczne kompaktowanie emituje zdarzenia strumienia `compaction` i może wywołać ponowną próbę.
- Przy ponownej próbie bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyjścia.
- Zobacz [Compaction](/concepts/compaction), aby poznać potok kompaktowania.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanałów czatu

- Delty asystenta są buforowane jako wiadomości czatu `delta`.
- `final` czatu jest emitowane przy **lifecycle end/error**.

## Limity czasu

- Domyślnie `agent.wait`: 30 s (tylko samo oczekiwanie). Parametr `timeoutMs` nadpisuje.
- Czas działania agenta: domyślnie `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane przez timer przerwania w `runEmbeddedPiAgent`.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Timeout agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway lub timeout RPC
- Timeout `agent.wait` (dotyczy tylko oczekiwania, nie zatrzymuje agenta)

## Powiązane

- [Tools](/tools) — dostępne narzędzia agenta
- [Hooks](/pl/automation/hooks) — skrypty sterowane zdarzeniami wywoływane przez zdarzenia cyklu życia agenta
- [Compaction](/concepts/compaction) — jak długie rozmowy są podsumowywane
- [Exec Approvals](/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Thinking](/tools/thinking) — konfiguracja poziomu thinking/reasoning
