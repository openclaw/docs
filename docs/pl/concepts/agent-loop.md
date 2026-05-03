---
read_when:
    - Potrzebujesz dokładnego przewodnika po pętli agenta lub zdarzeniach cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisy transkryptu lub zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-05-03T21:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agenta to pełne, „rzeczywiste” uruchomienie agenta: przyjęcie danych → składanie kontekstu → wnioskowanie modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalenie. Jest to autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, utrzymując przy tym spójny stan sesji.

W OpenClaw pętla jest pojedynczym, serializowanym uruchomieniem na sesję, które emituje zdarzenia cyklu życia i strumienia,
gdy model rozumuje, wywołuje narzędzia i strumieniuje wynik. Ten dokument wyjaśnia, jak ta autentyczna pętla
jest połączona od początku do końca.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (ogólnie)

1. RPC `agent` waliduje parametry, rozwiązuje sesję (sessionKey/sessionId), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje model oraz domyślne wartości thinking/verbose/trace
   - ładuje migawkę Skills
   - wywołuje `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emituje **koniec/błąd cyklu życia**, jeśli osadzona pętla nie wyemituje takiego zdarzenia
3. `runEmbeddedPiAgent`:
   - serializuje uruchomienia przez kolejki per sesja + globalne
   - rozwiązuje model + profil uwierzytelniania i buduje sesję pi
   - subskrybuje zdarzenia pi i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa uruchomienie po jego przekroczeniu
   - dla tur serwera aplikacji Codex przerywa zaakceptowaną turę, która przestaje generować postęp serwera aplikacji przed zdarzeniem terminalnym
   - zwraca ładunki + metadane użycia
4. `subscribeEmbeddedPiSession` mostkuje zdarzenia pi-agent-core do strumienia OpenClaw `agent`:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **koniec/błąd cyklu życia** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie + współbieżność

- Uruchomienia są serializowane według klucza sesji (pas sesji) i opcjonalnie przez pas globalny.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały wiadomości mogą wybierać tryby kolejki (collect/steer/followup), które zasilają ten system pasów.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkrypcji są także chronione przez blokadę zapisu sesji na pliku sesji. Blokada jest
  świadoma procesu i oparta na pliku, więc wykrywa zapisujących, którzy omijają kolejkę w procesie lub pochodzą
  z innego procesu. Procesy zapisujące transkrypcję sesji czekają do `session.writeLock.acquireTimeoutMs`,
  zanim zgłoszą sesję jako zajętą; wartość domyślna to `60000` ms.
- Blokady zapisu sesji domyślnie nie są reentrant. Jeśli helper celowo zagnieżdża pozyskanie
  tej samej blokady, zachowując jednego logicznego zapisującego, musi jawnie włączyć tę opcję przez
  `allowReentrant: true`.

## Przygotowanie sesji + przestrzeni roboczej

- Przestrzeń robocza jest rozwiązywana i tworzona; uruchomienia w piaskownicy mogą zostać przekierowane do głównego katalogu przestrzeni roboczej piaskownicy.
- Skills są ładowane (lub ponownie używane z migawki) i wstrzykiwane do środowiska oraz promptu.
- Pliki bootstrap/kontekstu są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Pozyskiwana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkrypcji, Compaction lub przycinania musi pobrać tę samą blokadę przed otwarciem lub
  modyfikacją pliku transkrypcji.

## Składanie promptu + prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań dla danego uruchomienia.
- Egzekwowane są limity specyficzne dla modelu i tokeny rezerwy Compaction.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty hooków (gdzie możesz przechwytywać)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzi i potoku Gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: działa podczas budowania plików bootstrap, zanim prompt systemowy zostanie sfinalizowany.
  Użyj tego, aby dodać/usunąć pliki kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokumentację hooków).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta + Gateway)

Działają one wewnątrz pętli agenta lub potoku Gateway:

- **`before_model_resolve`**: działa przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązaniem modelu.
- **`before_prompt_build`**: działa po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext` przed wysłaniem promptu. Użyj `prependContext` dla dynamicznego tekstu na turę, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znaleźć się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hook zgodności, który może działać w dowolnej fazie; preferuj jawne hooki powyżej.
- **`before_agent_reply`**: działa po akcjach inline i przed wywołaniem LLM, pozwalając Plugin przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdź końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwuj lub adnotuj cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytuj parametry/wyniki narzędzi.
- **`before_install`**: sprawdź wbudowane wyniki skanowania i opcjonalnie zablokuj instalacje Skills lub Plugin.
- **`tool_result_persist`**: synchronicznie przekształć wyniki narzędzi, zanim zostaną zapisane do należącej do OpenClaw transkrypcji sesji.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących + wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia Gateway.

Reguły decyzji hooków dla zabezpieczeń wyjściowych/narzędzi:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` to no-op i nie czyści wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` to no-op i nie czyści wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` to no-op i nie czyści wcześniejszego anulowania.

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby poznać API hooków i szczegóły rejestracji.

Harnessy mogą adaptować te hooki inaczej. Harness serwera aplikacji Codex utrzymuje
hooki OpenClaw Plugin jako kontrakt zgodności dla udokumentowanych powierzchni lustrzanych,
podczas gdy natywne hooki Codex pozostają oddzielnym mechanizmem niższego poziomu Codex.

## Strumieniowanie + odpowiedzi częściowe

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie blokowe może emitować częściowe odpowiedzi przy `text_end` albo `message_end`.
- Strumieniowanie rozumowania może być emitowane jako oddzielny strumień albo jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać zachowanie dzielenia na fragmenty i odpowiedzi blokowych.

## Wykonanie narzędzi + narzędzia wiadomości

- Zdarzenia start/update/end narzędzi są emitowane w strumieniu `tool`.
- Wyniki narzędzi są sanityzowane pod kątem rozmiaru i ładunków obrazów przed logowaniem/emitowaniem.
- Wysyłki narzędzi wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie + tłumienie odpowiedzi

- Końcowe ładunki są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - podsumowań narzędzi inline (gdy verbose + dozwolone)
  - tekstu błędu asystenta, gdy model zwraca błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  ładunków.
- Duplikaty narzędzi wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostaną żadne możliwe do wyrenderowania ładunki, a narzędzie zwróciło błąd, emitowana jest zapasowa odpowiedź błędu narzędzia
  (chyba że narzędzie wiadomości już wysłało odpowiedź widoczną dla użytkownika).

## Compaction + ponowienia

- Automatyczna Compaction emituje zdarzenia strumienia `compaction` i może wyzwolić ponowienie.
- Przy ponowieniu bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyjścia.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (i awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanału czatu

- Delty asystenta są buforowane do wiadomości czatu `delta`.
- `final` czatu jest emitowane przy **końcu/błędzie cyklu życia**.

## Limity czasu

- Wartość domyślna `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje.
- Runtime agenta: wartość domyślna `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); egzekwowane w timerze przerwania `runEmbeddedPiAgent`.
- Runtime Cron: izolowane `timeoutSeconds` tury agenta jest własnością cron. Scheduler uruchamia ten timer, gdy zaczyna się wykonanie, przerywa bazowe uruchomienie w skonfigurowanym terminie, a potem wykonuje ograniczone czyszczenie przed zapisaniem limitu czasu, aby przestarzała sesja podrzędna nie mogła utrzymać zablokowanego pasa.
- Diagnostyka żywotności sesji: przy włączonej diagnostyce `diagnostics.stuckSessionWarnMs` klasyfikuje długie sesje `processing`, które nie mają zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP. Aktywne osadzone uruchomienia, wywołania modelu i wywołania narzędzi zgłaszają się jako `session.long_running`; aktywna praca bez niedawnego postępu zgłasza się jako `session.stalled`; `session.stuck` jest zarezerwowane dla przestarzałej ewidencji sesji bez aktywnej pracy. Przestarzała ewidencja sesji natychmiast zwalnia dotknięty pas sesji; zablokowane osadzone uruchomienia są przerywane i opróżniane dopiero po wydłużonym oknie bez postępu (co najmniej 10 minut i 5x próg ostrzeżenia), aby praca w kolejce mogła zostać wznowiona bez odcinania jedynie wolnych uruchomień. Powtarzane diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje niezmieniona.
- Limit bezczynności modelu: OpenClaw przerywa żądanie modelu, gdy przed upływem okna bezczynności nie nadejdą żadne fragmenty odpowiedzi. `models.providers.<id>.timeoutSeconds` wydłuża ten watchdog bezczynności dla wolnych dostawców lokalnych/samodzielnie hostowanych; w przeciwnym razie OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, domyślnie z limitem 120 s. Uruchomienia wyzwalane przez Cron bez jawnego limitu czasu modelu lub agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu cron.
- Limit czasu żądania HTTP dostawcy: `models.providers.<id>.timeoutSeconds` ma zastosowanie do pobrań HTTP modelu tego dostawcy, w tym połączenia, nagłówków, treści, limitu czasu żądania SDK, całkowitej obsługi przerwania guarded-fetch i watchdog bezczynności strumienia modelu. Użyj tego dla wolnych dostawców lokalnych/samodzielnie hostowanych, takich jak Ollama, zanim podniesiesz limit czasu runtime całego agenta.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway lub limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak podsumowywane są długie rozmowy
- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Thinking](/pl/tools/thinking) — konfiguracja poziomu thinking/reasoning
