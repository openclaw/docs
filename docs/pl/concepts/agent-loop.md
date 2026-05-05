---
read_when:
    - Potrzebujesz dokładnego omówienia krok po kroku pętli agenta lub zdarzeń cyklu życia
    - Zmieniasz kolejkowanie sesji, operacje zapisu transkryptu lub zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-05-05T06:16:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agentowa to pełne „rzeczywiste” uruchomienie agenta: przyjęcie → składanie kontekstu → wnioskowanie modelu →
wykonanie narzędzi → strumieniowe odpowiedzi → utrwalenie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, zachowując spójny stan sesji.

W OpenClaw pętla jest pojedynczym, zserializowanym uruchomieniem na sesję, które emituje zdarzenia cyklu życia i strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje dane wyjściowe. Ten dokument wyjaśnia, jak ta autentyczna pętla jest
połączona od początku do końca.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (ogólnie)

1. RPC `agent` waliduje parametry, rozwiązuje sesję (sessionKey/sessionId), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje model oraz domyślne wartości myślenia/trybu szczegółowego/śledzenia
   - ładuje migawkę Skills
   - wywołuje `runEmbeddedPiAgent` (środowisko uruchomieniowe pi-agent-core)
   - emituje **koniec/błąd cyklu życia**, jeśli osadzona pętla ich nie wyemituje
3. `runEmbeddedPiAgent`:
   - serializuje uruchomienia przez kolejki per sesja i globalne
   - rozwiązuje model oraz profil uwierzytelniania i buduje sesję pi
   - subskrybuje zdarzenia pi i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa uruchomienie po jego przekroczeniu
   - dla tur serwera aplikacji Codex przerywa zaakceptowaną turę, która przestaje generować postęp serwera aplikacji przed zdarzeniem terminalnym
   - zwraca payloady i metadane użycia
4. `subscribeEmbeddedPiSession` mostkuje zdarzenia pi-agent-core do strumienia `agent` OpenClaw:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **koniec/błąd cyklu życia** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie i współbieżność

- Uruchomienia są serializowane per klucz sesji (ścieżka sesji) i opcjonalnie przez ścieżkę globalną.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały wiadomości mogą wybierać tryby kolejki (zbieranie/sterowanie/kontynuacja), które zasilają ten system ścieżek.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkrypcji są też chronione przez blokadę zapisu sesji na pliku sesji. Blokada jest
  świadoma procesu i oparta na pliku, więc wykrywa zapisujących, którzy omijają kolejkę w procesie albo pochodzą
  z innego procesu. Zapisujący transkrypcję sesji czekają do `session.writeLock.acquireTimeoutMs`
  przed zgłoszeniem sesji jako zajętej; wartość domyślna to `60000` ms.
- Blokady zapisu sesji domyślnie nie są reentrantne. Jeśli helper celowo zagnieżdża przejęcie
  tej samej blokady, zachowując jednego logicznego zapisującego, musi jawnie włączyć to przez
  `allowReentrant: true`.

## Przygotowanie sesji i obszaru roboczego

- Obszar roboczy jest rozwiązywany i tworzony; uruchomienia w piaskownicy mogą zostać przekierowane do głównego katalogu obszaru roboczego piaskownicy.
- Skills są ładowane (albo ponownie używane z migawki) i wstrzykiwane do środowiska oraz promptu.
- Pliki bootstrap/kontekstu są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Blokada zapisu sesji jest przejmowana; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkrypcji, Compaction albo obcinania musi przejąć tę samą blokadę przed otwarciem lub
  modyfikacją pliku transkrypcji.

## Składanie promptu i prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań per uruchomienie.
- Limity specyficzne dla modelu oraz tokeny rezerwy Compaction są wymuszane.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty haków (gdzie można przechwycić)

OpenClaw ma dwa systemy haków:

- **Haki wewnętrzne** (haki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Haki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzi i potoku Gateway.

### Haki wewnętrzne (haki Gateway)

- **`agent:bootstrap`**: uruchamia się podczas budowania plików bootstrap, zanim prompt systemowy zostanie sfinalizowany.
  Użyj tego, aby dodać/usunąć pliki kontekstu bootstrap.
- **Haki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokument o hakach).

Zobacz [Haki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Haki Plugin (cykl życia agenta i Gateway)

Działają one wewnątrz pętli agenta albo potoku Gateway:

- **`before_model_resolve`**: uruchamia się przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązaniem modelu.
- **`before_prompt_build`**: uruchamia się po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` albo `appendSystemContext` przed przesłaniem promptu. Użyj `prependContext` do dynamicznego tekstu per tura, a pól kontekstu systemowego do stabilnych wskazówek, które powinny znajdować się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hak kompatybilności, który może uruchamiać się w dowolnej fazie; preferuj jawne haki powyżej.
- **`before_agent_reply`**: uruchamia się po akcjach wbudowanych i przed wywołaniem LLM, pozwalając pluginowi przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwują albo adnotują cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytują parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wbudowane ustalenia skanowania i opcjonalnie blokuje instalacje Skills albo pluginów.
- **`tool_result_persist`**: synchronicznie transformuje wyniki narzędzi, zanim zostaną zapisane do transkrypcji sesji należącej do OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: haki wiadomości przychodzących i wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia Gateway.

Reguły decyzji haków dla osłon wychodzących/narzędzi:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest operacją no-op i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest operacją no-op i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest operacją no-op i nie usuwa wcześniejszego anulowania.

Zobacz [Haki Plugin](/pl/plugins/hooks), aby poznać API haków i szczegóły rejestracji.

Harnessy mogą adaptować te haki inaczej. Harness serwera aplikacji Codex zachowuje
haki pluginów OpenClaw jako kontrakt kompatybilności dla udokumentowanych lustrzanych
powierzchni, podczas gdy natywne haki Codex pozostają osobnym, niższopoziomowym mechanizmem Codex.

## Strumieniowanie i odpowiedzi częściowe

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie bloków może emitować odpowiedzi częściowe albo przy `text_end`, albo przy `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień albo jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać zachowanie porcjowania i odpowiedzi blokowych.

## Wykonywanie narzędzi i narzędzia wiadomości

- Zdarzenia start/update/end narzędzia są emitowane w strumieniu `tool`.
- Wyniki narzędzi są sanityzowane pod kątem rozmiaru i payloadów obrazów przed logowaniem/emitowaniem.
- Wysłania narzędzi wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie i tłumienie odpowiedzi

- Końcowe payloady są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - wbudowanych podsumowań narzędzi (gdy tryb szczegółowy + dozwolone)
  - tekstu błędu asystenta, gdy model zwraca błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  payloadów.
- Duplikaty narzędzi wiadomości są usuwane z końcowej listy payloadów.
- Jeśli nie pozostają żadne renderowalne payloady, a narzędzie zwróciło błąd, emitowana jest zastępcza odpowiedź błędu narzędzia
  (chyba że narzędzie wiadomości już wysłało odpowiedź widoczną dla użytkownika).

## Compaction i ponowienia

- Automatyczne Compaction emituje zdarzenia strumienia `compaction` i może wyzwolić ponowienie.
- Przy ponowieniu bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyjścia.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanału czatu

- Delty asystenta są buforowane w wiadomościach czatu `delta`.
- Czatowe `final` jest emitowane przy **końcu/błędzie cyklu życia**.

## Limity czasu

- Domyślne `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje.
- Środowisko uruchomieniowe agenta: domyślne `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane w timerze przerwania `runEmbeddedPiAgent`.
- Środowisko uruchomieniowe Cron: izolowane `timeoutSeconds` tury agenta należy do Cron. Harmonogram uruchamia ten timer, gdy wykonanie się zaczyna, przerywa bazowe uruchomienie w skonfigurowanym terminie, a potem uruchamia ograniczone czyszczenie przed zapisaniem limitu czasu, aby nieaktualna sesja podrzędna nie mogła zablokować ścieżki.
- Diagnostyka żywotności sesji: przy włączonej diagnostyce `diagnostics.stuckSessionWarnMs` klasyfikuje długie sesje `processing`, które nie mają zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP. Aktywne osadzone uruchomienia, wywołania modeli i wywołania narzędzi raportują jako `session.long_running`; aktywna praca bez niedawnego postępu raportuje jako `session.stalled`; `session.stuck` jest zarezerwowane dla nieaktualnej ewidencji sesji bez aktywnej pracy. Nieaktualna ewidencja sesji natychmiast zwalnia dotkniętą ścieżkę sesji; zawieszone osadzone uruchomienia są przerywane z drenażem dopiero po `diagnostics.stuckSessionAbortMs` (domyślnie: co najmniej 10 minut i 5x próg ostrzeżenia), aby praca w kolejce mogła zostać wznowiona bez odcinania jedynie wolnych uruchomień. Odzyskiwanie emituje ustrukturyzowane wyniki requested/completed, a stan diagnostyczny jest oznaczany jako bezczynny tylko wtedy, gdy ta sama generacja przetwarzania jest nadal bieżąca. Powtarzające się diagnostyki `session.stuck` stosują backoff, dopóki sesja pozostaje niezmieniona.
- Limit bezczynności modelu: OpenClaw przerywa żądanie modelu, gdy żadne fragmenty odpowiedzi nie nadejdą przed końcem okna bezczynności. `models.providers.<id>.timeoutSeconds` wydłuża ten watchdog bezczynności dla wolnych lokalnych/samodzielnie hostowanych dostawców; w przeciwnym razie OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, domyślnie ograniczone do 120 s. Uruchomienia wyzwalane przez Cron bez jawnego limitu czasu modelu albo agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu Cron.
- Limit czasu żądania HTTP dostawcy: `models.providers.<id>.timeoutSeconds` dotyczy pobrań HTTP modelu tego dostawcy, w tym połączenia, nagłówków, treści, limitu czasu żądania SDK, całkowitej obsługi przerwania chronionego fetch oraz watchdog bezczynności strumienia modelu. Użyj tego dla wolnych lokalnych/samodzielnie hostowanych dostawców, takich jak Ollama, zanim zwiększysz limit czasu całego środowiska uruchomieniowego agenta.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway albo limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Haki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak podsumowywane są długie rozmowy
- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Myślenie](/pl/tools/thinking) — konfiguracja poziomu myślenia/rozumowania
