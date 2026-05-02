---
read_when:
    - Potrzebujesz dokładnego przewodnika po pętli agenta lub zdarzeniach cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisy transkrypcji lub zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-05-02T20:43:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agentowa to pełne „rzeczywiste” uruchomienie agenta: przyjęcie danych → składanie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalanie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, utrzymując spójny stan sesji.

W OpenClaw pętla jest pojedynczym, serializowanym uruchomieniem na sesję, które emituje zdarzenia cyklu życia i strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje wynik. Ten dokument wyjaśnia, jak ta autentyczna pętla jest
połączona od początku do końca.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (ogólny opis)

1. RPC `agent` weryfikuje parametry, rozwiązuje sesję (sessionKey/sessionId), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje domyślne ustawienia modelu + thinking/verbose/trace
   - ładuje migawkę Skills
   - wywołuje `runEmbeddedPiAgent` (środowisko uruchomieniowe pi-agent-core)
   - emituje **koniec/błąd cyklu życia**, jeśli osadzona pętla tego nie wyemituje
3. `runEmbeddedPiAgent`:
   - serializuje uruchomienia przez kolejki per sesja + globalne
   - rozwiązuje model + profil uwierzytelniania i buduje sesję pi
   - subskrybuje zdarzenia pi i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa uruchomienie po jego przekroczeniu
   - dla tur serwera aplikacji Codex przerywa zaakceptowaną turę, która przestaje generować postęp serwera aplikacji przed zdarzeniem terminalnym
   - zwraca payloady + metadane użycia
4. `subscribeEmbeddedPiSession` pomostuje zdarzenia pi-agent-core do strumienia OpenClaw `agent`:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **koniec/błąd cyklu życia** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie + współbieżność

- Uruchomienia są serializowane według klucza sesji (pas sesji) i opcjonalnie przez pas globalny.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały komunikacji mogą wybierać tryby kolejek (collect/steer/followup), które zasilają ten system pasów.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkryptu są również chronione przez blokadę zapisu sesji na pliku sesji. Blokada jest
  świadoma procesów i oparta na pliku, więc wykrywa zapisujących, którzy omijają kolejkę wewnątrz procesu albo pochodzą
  z innego procesu. Procesy zapisujące transkrypt sesji czekają do `session.writeLock.acquireTimeoutMs`
  przed zgłoszeniem, że sesja jest zajęta; wartość domyślna to `60000` ms.
- Blokady zapisu sesji domyślnie nie są reentrantne. Jeśli helper celowo zagnieżdża przejęcie
  tej samej blokady przy zachowaniu jednego logicznego zapisującego, musi jawnie włączyć tę opcję za pomocą
  `allowReentrant: true`.

## Przygotowanie sesji + przestrzeni roboczej

- Przestrzeń robocza jest rozwiązywana i tworzona; uruchomienia w sandboxie mogą przekierować do głównego katalogu przestrzeni roboczej sandboxa.
- Skills są ładowane (albo ponownie używane z migawki) i wstrzykiwane do środowiska oraz promptu.
- Pliki bootstrap/kontekstu są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Przejmowana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkryptu, Compaction albo obcinania musi przejąć tę samą blokadę przed otwarciem lub
  modyfikacją pliku transkryptu.

## Składanie promptu + prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań per uruchomienie.
- Wymuszane są limity specyficzne dla modelu oraz tokeny rezerwy Compaction.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby dowiedzieć się, co widzi model.

## Punkty hooków (gdzie można przechwytywać)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzi i potoku Gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: uruchamia się podczas budowania plików bootstrap, zanim prompt systemowy zostanie sfinalizowany.
  Użyj tego do dodawania/usuwania plików kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokument Hooki).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta + Gateway)

Działają one wewnątrz pętli agenta albo potoku Gateway:

- **`before_model_resolve`**: działa przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązaniem modelu.
- **`before_prompt_build`**: działa po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` albo `appendSystemContext` przed przesłaniem promptu. Używaj `prependContext` dla dynamicznego tekstu per tura, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znajdować się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hook zgodności, który może działać w dowolnej fazie; preferuj jawne hooki powyżej.
- **`before_agent_reply`**: działa po akcjach inline i przed wywołaniem LLM, pozwalając pluginowi przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwuje albo adnotuje cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytuje parametry/wyniki narzędzia.
- **`before_install`**: sprawdza wbudowane wyniki skanowania i opcjonalnie blokuje instalacje Skills albo pluginów.
- **`tool_result_persist`**: synchronicznie przekształca wyniki narzędzi przed zapisaniem ich do należącego do OpenClaw transkryptu sesji.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących + wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia Gateway.

Reguły decyzji hooków dla strażników wychodzących/narzędzi:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest operacją bez efektu i nie usuwa wcześniejszego anulowania.

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby poznać API hooków i szczegóły rejestracji.

Harnessy mogą adaptować te hooki inaczej. Harness serwera aplikacji Codex zachowuje
hooki Plugin OpenClaw jako kontrakt zgodności dla udokumentowanych powierzchni lustrzanych,
podczas gdy natywne hooki Codex pozostają osobnym mechanizmem Codex niższego poziomu.

## Strumieniowanie + częściowe odpowiedzi

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie bloków może emitować częściowe odpowiedzi albo przy `text_end`, albo przy `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień albo jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać zachowanie chunkowania i odpowiedzi blokowych.

## Wykonywanie narzędzi + narzędzia komunikacji

- Zdarzenia start/update/end narzędzi są emitowane w strumieniu `tool`.
- Wyniki narzędzi są sanityzowane pod kątem rozmiaru i payloadów obrazów przed logowaniem/emitowaniem.
- Wysyłki narzędzi komunikacji są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie odpowiedzi + tłumienie

- Końcowe payloady są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - podsumowań narzędzi inline (gdy verbose + dozwolone)
  - tekstu błędu asystenta, gdy model zwraca błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  payloadów.
- Duplikaty narzędzi komunikacji są usuwane z końcowej listy payloadów.
- Jeśli nie pozostały żadne renderowalne payloady, a narzędzie zwróciło błąd, emitowana jest awaryjna odpowiedź błędu narzędzia
  (chyba że narzędzie komunikacji wysłało już odpowiedź widoczną dla użytkownika).

## Compaction + ponowienia

- Auto-Compaction emituje zdarzenia strumienia `compaction` i może wywołać ponowienie.
- Przy ponowieniu bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyjścia.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanału czatu

- Delty asystenta są buforowane do wiadomości czatu `delta`.
- `final` czatu jest emitowane przy **końcu/błędzie cyklu życia**.

## Limity czasu

- Domyślne `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje.
- Środowisko uruchomieniowe agenta: domyślne `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane przez timer przerwania w `runEmbeddedPiAgent`.
- Środowisko uruchomieniowe Cron: izolowane `timeoutSeconds` tury agenta należy do Cron. Scheduler uruchamia ten timer, gdy rozpoczyna się wykonanie, przerywa bazowe uruchomienie w skonfigurowanym terminie, a następnie wykonuje ograniczone sprzątanie przed zapisaniem limitu czasu, aby przestarzała sesja podrzędna nie mogła zablokować pasa.
- Diagnostyka żywotności sesji: przy włączonej diagnostyce `diagnostics.stuckSessionWarnMs` klasyfikuje długie sesje `processing`, które nie mają zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP. Aktywne osadzone uruchomienia, wywołania modelu i wywołania narzędzi są raportowane jako `session.long_running`; aktywna praca bez niedawnego postępu jest raportowana jako `session.stalled`; `session.stuck` jest zarezerwowane dla przestarzałej ewidencji sesji bez aktywnej pracy i tylko ta ścieżka zwalnia dotknięty pas sesji, aby zakolejkowana praca startowa mogła odpłynąć. Powtarzające się diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje niezmieniona.
- Limit bezczynności modelu: OpenClaw przerywa żądanie modelu, gdy przed upływem okna bezczynności nie nadejdą żadne chunki odpowiedzi. `models.providers.<id>.timeoutSeconds` wydłuża ten watchdog bezczynności dla wolnych lokalnych/samodzielnie hostowanych dostawców; w przeciwnym razie OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, domyślnie ograniczone do 120 s. Uruchomienia wyzwalane przez Cron bez jawnego limitu czasu modelu albo agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu Cron.
- Limit czasu żądania HTTP dostawcy: `models.providers.<id>.timeoutSeconds` dotyczy fetchy HTTP modelu tego dostawcy, w tym połączenia, nagłówków, body, limitu czasu żądania SDK, łącznej obsługi przerwania guarded-fetch i watchdoga bezczynności strumienia modelu. Używaj tego dla wolnych lokalnych/samodzielnie hostowanych dostawców, takich jak Ollama, zanim podniesiesz limit czasu całego środowiska uruchomieniowego agenta.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway albo limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak podsumowywane są długie rozmowy
- [Zatwierdzenia exec](/pl/tools/exec-approvals) — bramki zatwierdzeń dla poleceń powłoki
- [Thinking](/pl/tools/thinking) — konfiguracja poziomu thinking/rozumowania
