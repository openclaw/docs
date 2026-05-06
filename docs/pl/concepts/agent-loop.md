---
read_when:
    - Potrzebujesz dokładnego opisu krok po kroku pętli agenta lub zdarzeń cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisy transkrypcji lub zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-05-06T09:06:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agentowa to pełne „rzeczywiste” uruchomienie agenta: przyjęcie → składanie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalanie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, zachowując spójny stan sesji.

W OpenClaw pętla to pojedyncze, zserializowane uruchomienie na sesję, które emituje zdarzenia cyklu życia i strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje wynik. Ten dokument wyjaśnia, jak ta autentyczna pętla
jest połączona od początku do końca.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (ogólnie)

1. RPC `agent` waliduje parametry, rozwiązuje sesję (sessionKey/sessionId), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje model oraz domyślne wartości thinking/verbose/trace
   - ładuje snapshot Skills
   - wywołuje `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emituje **koniec/błąd cyklu życia**, jeśli osadzona pętla nie wyemituje takiego zdarzenia
3. `runEmbeddedPiAgent`:
   - serializuje uruchomienia przez kolejki na sesję i kolejki globalne
   - rozwiązuje model oraz profil uwierzytelniania i buduje sesję pi
   - subskrybuje zdarzenia pi i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa uruchomienie, jeśli zostanie przekroczony
   - dla tur serwera aplikacji Codex przerywa zaakceptowaną turę, która przestaje wytwarzać postęp serwera aplikacji przed zdarzeniem terminalnym
   - zwraca payloady i metadane użycia
4. `subscribeEmbeddedPiSession` mostkuje zdarzenia pi-agent-core do strumienia `agent` OpenClaw:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **koniec/błąd cyklu życia** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie i współbieżność

- Uruchomienia są serializowane według klucza sesji (pas sesji) i opcjonalnie przez pas globalny.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały wiadomości mogą wybierać tryby kolejki (collect/steer/followup), które zasilają ten system pasów.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkryptu są także chronione przez blokadę zapisu sesji na pliku sesji. Blokada jest
  świadoma procesu i oparta na pliku, więc wykrywa zapisujących, którzy omijają kolejkę w procesie albo pochodzą
  z innego procesu. Procesy zapisujące transkrypt sesji czekają do `session.writeLock.acquireTimeoutMs`
  przed zgłoszeniem sesji jako zajętej; domyślnie jest to `60000` ms.
- Blokady zapisu sesji domyślnie nie są reentrantne. Jeśli helper celowo zagnieżdża pozyskanie
  tej samej blokady, zachowując jednego logicznego zapisującego, musi jawnie włączyć to przez
  `allowReentrant: true`.

## Przygotowanie sesji i obszaru roboczego

- Obszar roboczy jest rozwiązywany i tworzony; uruchomienia w sandboxie mogą przekierować do katalogu głównego obszaru roboczego sandboxa.
- Skills są ładowane (albo ponownie używane ze snapshota) i wstrzykiwane do środowiska oraz promptu.
- Pliki bootstrap/kontekstu są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Pozyskiwana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkryptu, Compaction lub obcinania musi pobrać tę samą blokadę przed otwarciem albo
  modyfikacją pliku transkryptu.

## Składanie promptu i prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań dla danego uruchomienia.
- Limity specyficzne dla modelu i tokeny rezerwowe Compaction są wymuszane.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty hooków (gdzie można przechwycić)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń w cyklu życia agenta/narzędzia i potoku gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: działa podczas budowania plików bootstrap, zanim prompt systemowy zostanie sfinalizowany.
  Użyj tego, aby dodać/usunąć pliki kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokument o hookach).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta i gateway)

Działają one wewnątrz pętli agenta albo potoku gateway:

- **`before_model_resolve`**: działa przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązaniem modelu.
- **`before_prompt_build`**: działa po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` albo `appendSystemContext` przed przesłaniem promptu. Użyj `prependContext` dla dynamicznego tekstu na turę oraz pól kontekstu systemowego dla stabilnych wskazówek, które powinny znaleźć się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hook zgodności, który może działać w dowolnej fazie; preferuj jawne hooki powyżej.
- **`before_agent_reply`**: działa po akcjach inline i przed wywołaniem LLM, pozwalając pluginowi przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwuje lub adnotuje cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytuje parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wbudowane wyniki skanowania i opcjonalnie blokuje instalacje skill lub plugin.
- **`tool_result_persist`**: synchronicznie przekształca wyniki narzędzi, zanim zostaną zapisane do transkryptu sesji należącego do OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących i wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia gateway.

Reguły decyzji hooków dla osłon wychodzących/narzędzi:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest no-op i nie czyści wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest no-op i nie czyści wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest no-op i nie czyści wcześniejszego anulowania.

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby poznać API hooków i szczegóły rejestracji.

Harnessy mogą adaptować te hooki inaczej. Harness serwera aplikacji Codex zachowuje
hooki pluginów OpenClaw jako kontrakt zgodności dla udokumentowanych, odzwierciedlonych
powierzchni, podczas gdy natywne hooki Codex pozostają osobnym, niższego poziomu mechanizmem Codex.

## Strumieniowanie i częściowe odpowiedzi

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie bloków może emitować częściowe odpowiedzi na `text_end` albo `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień albo jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać zachowanie porcjowania i odpowiedzi blokowych.

## Wykonywanie narzędzi i narzędzia wiadomości

- Zdarzenia start/update/end narzędzia są emitowane w strumieniu `tool`.
- Wyniki narzędzi są sanityzowane pod kątem rozmiaru i payloadów obrazów przed logowaniem/emitowaniem.
- Wysyłki narzędzi wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie i tłumienie odpowiedzi

- Końcowe payloady są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - podsumowań narzędzi inline (gdy verbose + dozwolone)
  - tekstu błędu asystenta, gdy model zgłasza błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  payloadów.
- Duplikaty narzędzi wiadomości są usuwane z końcowej listy payloadów.
- Jeśli nie pozostają żadne renderowalne payloady i narzędzie zgłosiło błąd, emitowana jest zastępcza odpowiedź błędu narzędzia
  (chyba że narzędzie wiadomości już wysłało odpowiedź widoczną dla użytkownika).

## Compaction i ponowne próby

- Auto-Compaction emituje zdarzenia strumienia `compaction` i może wyzwolić ponowną próbę.
- Przy ponownej próbie bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć duplikacji wyniku.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanału czatu

- Delty asystenta są buforowane w wiadomościach czatu `delta`.
- Czat `final` jest emitowany przy **końcu/błędzie cyklu życia**.

## Limity czasu

- Domyślne `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje tę wartość.
- Runtime agenta: domyślne `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane przez timer przerwania w `runEmbeddedPiAgent`.
- Runtime Cron: izolowane agent-turn `timeoutSeconds` należy do cron. Scheduler uruchamia ten timer, gdy rozpoczyna się wykonanie, przerywa bazowe uruchomienie w skonfigurowanym terminie, a następnie wykonuje ograniczone sprzątanie przed zapisaniem limitu czasu, aby przestarzała sesja potomna nie mogła zablokować pasa.
- Diagnostyka żywotności sesji: przy włączonej diagnostyce `diagnostics.stuckSessionWarnMs` klasyfikuje długie sesje `processing`, które nie mają zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP. Aktywne osadzone uruchomienia, wywołania modelu i wywołania narzędzi są raportowane jako `session.long_running`; aktywna praca bez niedawnego postępu jest raportowana jako `session.stalled`; `session.stuck` jest zarezerwowane dla przestarzałej księgowości sesji bez aktywnej pracy. Przestarzała księgowość sesji natychmiast zwalnia dotknięty pas sesji; zatrzymane osadzone uruchomienia są przerywane i drenowane dopiero po `diagnostics.stuckSessionAbortMs` (domyślnie: co najmniej 10 minut i 5x próg ostrzeżenia), aby praca w kolejce mogła zostać wznowiona bez odcinania jedynie powolnych uruchomień. Odzyskiwanie emituje ustrukturyzowane wyniki requested/completed, a stan diagnostyczny jest oznaczany jako bezczynny tylko wtedy, gdy ta sama generacja przetwarzania nadal jest aktualna. Powtarzające się diagnostyki `session.stuck` stosują wycofanie, dopóki sesja pozostaje niezmieniona.
- Limit bezczynności modelu: OpenClaw przerywa żądanie modelu, gdy przed upływem okna bezczynności nie nadejdą żadne porcje odpowiedzi. `models.providers.<id>.timeoutSeconds` wydłuża ten watchdog bezczynności dla powolnych dostawców lokalnych/samodzielnie hostowanych; w przeciwnym razie OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, domyślnie ograniczone do 120 s. Uruchomienia wyzwalane przez Cron bez jawnego limitu czasu modelu lub agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu cron.
- Limit czasu żądania HTTP dostawcy: `models.providers.<id>.timeoutSeconds` dotyczy fetchy HTTP modelu tego dostawcy, w tym połączenia, nagłówków, treści, limitu czasu żądania SDK, całkowitej obsługi przerwania guarded-fetch oraz watchdoga bezczynności strumienia modelu. Używaj tego dla powolnych dostawców lokalnych/samodzielnie hostowanych, takich jak Ollama, zanim zwiększysz limit czasu runtime całego agenta.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway albo limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak podsumowywane są długie konwersacje
- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Thinking](/pl/tools/thinking) — konfiguracja poziomu thinking/reasoning
