---
read_when:
    - Potrzebujesz dokładnego przewodnika po pętli agenta lub zdarzeniach cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisy transkrypcji lub zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-05-02T09:47:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agentowa to pełne „rzeczywiste” uruchomienie agenta: przyjęcie → składanie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalanie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, jednocześnie utrzymując spójny stan sesji.

W OpenClaw pętla to pojedyncze, zserializowane uruchomienie na sesję, które emituje zdarzenia cyklu życia i strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje wynik. Ten dokument wyjaśnia, jak ta autentyczna pętla jest
połączona od początku do końca.

## Punkty wejścia

- RPC Gateway: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (ogólnie)

1. RPC `agent` weryfikuje parametry, rozwiązuje sesję (sessionKey/sessionId), zapisuje metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje model + domyślne ustawienia myślenia/trybu szczegółowego/śledzenia
   - ładuje migawkę Skills
   - wywołuje `runEmbeddedPiAgent` (runtime pi-agent-core)
   - emituje **koniec/błąd cyklu życia**, jeśli osadzona pętla go nie wyemituje
3. `runEmbeddedPiAgent`:
   - serializuje uruchomienia przez kolejki na sesję + globalne
   - rozwiązuje model + profil uwierzytelniania i buduje sesję Pi
   - subskrybuje zdarzenia Pi i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa uruchomienie po jego przekroczeniu
   - dla tur serwera aplikacji Codex przerywa zaakceptowaną turę, która przestaje generować postęp serwera aplikacji przed zdarzeniem terminalnym
   - zwraca ładunki + metadane użycia
4. `subscribeEmbeddedPiSession` łączy zdarzenia pi-agent-core ze strumieniem OpenClaw `agent`:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **koniec/błąd cyklu życia** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie + współbieżność

- Uruchomienia są serializowane według klucza sesji (ścieżka sesji) i opcjonalnie przez ścieżkę globalną.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały wiadomości mogą wybierać tryby kolejki (collect/steer/followup), które zasilają ten system ścieżek.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkrypcji są też chronione blokadą zapisu sesji na pliku sesji. Blokada jest
  świadoma procesu i oparta na pliku, więc wykrywa procesy zapisujące, które omijają kolejkę wewnątrzprocesową albo pochodzą
  z innego procesu.
- Blokady zapisu sesji domyślnie nie są reentrantowe. Jeśli helper celowo zagnieżdża pozyskanie
  tej samej blokady, zachowując jednego logicznego zapisującego, musi jawnie wyrazić zgodę przez
  `allowReentrant: true`.

## Przygotowanie sesji + obszaru roboczego

- Obszar roboczy jest rozwiązywany i tworzony; uruchomienia w piaskownicy mogą zostać przekierowane do katalogu głównego obszaru roboczego piaskownicy.
- Skills są ładowane (albo ponownie używane z migawki) i wstrzykiwane do środowiska oraz promptu.
- Pliki bootstrap/kontekstu są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Pozyskiwana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkrypcji, Compaction lub przycinania musi pozyskać tę samą blokadę przed otwarciem albo
  mutacją pliku transkrypcji.

## Składanie promptu + prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań dla uruchomienia.
- Wymuszane są limity specyficzne dla modelu i tokeny rezerwy Compaction.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby dowiedzieć się, co widzi model.

## Punkty hooków (gdzie można przechwytywać)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzia i potoku Gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: uruchamia się podczas budowania plików bootstrap, zanim prompt systemowy zostanie sfinalizowany.
  Użyj tego, aby dodać/usunąć pliki kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokument Hooki).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta + Gateway)

Działają one wewnątrz pętli agenta lub potoku Gateway:

- **`before_model_resolve`**: uruchamia się przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązywaniem modelu.
- **`before_prompt_build`**: uruchamia się po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext` przed wysłaniem promptu. Użyj `prependContext` dla dynamicznego tekstu na turę, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znajdować się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hook zgodności, który może działać w dowolnej fazie; preferuj powyższe jawne hooki.
- **`before_agent_reply`**: uruchamia się po działaniach inline i przed wywołaniem LLM, pozwalając Plugin przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwuje lub adnotuje cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytuje parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wbudowane wyniki skanowania i opcjonalnie blokuje instalacje Skills lub Plugin.
- **`tool_result_persist`**: synchronicznie przekształca wyniki narzędzi, zanim zostaną zapisane w transkrypcji sesji należącej do OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących + wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia Gateway.

Reguły decyzji hooków dla zabezpieczeń wyjścia/narzędzi:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest operacją bez efektu i nie usuwa wcześniejszego anulowania.

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby poznać API hooków i szczegóły rejestracji.

Harnessy mogą adaptować te hooki inaczej. Harness serwera aplikacji Codex zachowuje
hooki Plugin OpenClaw jako kontrakt zgodności dla udokumentowanych powierzchni lustrzanych,
podczas gdy natywne hooki Codex pozostają osobnym, niższopoziomowym mechanizmem Codex.

## Strumieniowanie + odpowiedzi częściowe

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie bloków może emitować odpowiedzi częściowe albo przy `text_end`, albo przy `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień albo jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać porcjowanie i zachowanie odpowiedzi blokowych.

## Wykonanie narzędzi + narzędzia wiadomości

- Zdarzenia start/update/end narzędzi są emitowane w strumieniu `tool`.
- Wyniki narzędzi są oczyszczane pod kątem rozmiaru i ładunków obrazów przed logowaniem/emitowaniem.
- Wysyłki narzędzi wiadomości są śledzone, aby wyciszać zduplikowane potwierdzenia asystenta.

## Kształtowanie + wyciszanie odpowiedzi

- Końcowe ładunki są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - podsumowań narzędzi inline (gdy tryb szczegółowy + dozwolone)
  - tekstu błędu asystenta, gdy model zgłasza błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  ładunków.
- Duplikaty narzędzi wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostają żadne renderowalne ładunki, a narzędzie zgłosiło błąd, emitowana jest zastępcza odpowiedź z błędem narzędzia
  (chyba że narzędzie wiadomości już wysłało odpowiedź widoczną dla użytkownika).

## Compaction + ponowne próby

- Automatyczna Compaction emituje zdarzenia strumienia `compaction` i może wywołać ponowną próbę.
- Przy ponownej próbie bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyniku.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanału czatu

- Delty asystenta są buforowane w wiadomościach czatu `delta`.
- `final` czatu jest emitowane przy **końcu/błędzie cyklu życia**.

## Limity czasu

- Domyślne `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje.
- Runtime agenta: domyślne `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane w timerze przerwania `runEmbeddedPiAgent`.
- Runtime Cron: odizolowany `timeoutSeconds` tury agenta należy do cron. Harmonogram uruchamia ten timer, gdy wykonanie się rozpoczyna, przerywa bazowe uruchomienie przy skonfigurowanym terminie, a następnie wykonuje ograniczone sprzątanie przed zapisaniem limitu czasu, aby nieaktualna sesja podrzędna nie mogła utrzymywać ścieżki w stanie zablokowania.
- Diagnostyka żywotności sesji: przy włączonej diagnostyce `diagnostics.stuckSessionWarnMs` klasyfikuje długie sesje `processing`, które nie mają zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP. Aktywne uruchomienia osadzone, wywołania modelu i wywołania narzędzi zgłaszają się jako `session.long_running`; aktywna praca bez ostatniego postępu zgłasza się jako `session.stalled`; `session.stuck` jest zarezerwowane dla nieaktualnego księgowania sesji bez aktywnej pracy i tylko ta ścieżka zwalnia dotkniętą ścieżkę sesji, aby zakolejkowana praca startowa mogła odpłynąć. Powtarzane diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje niezmieniona.
- Limit bezczynności modelu: OpenClaw przerywa żądanie modelu, gdy przed upływem okna bezczynności nie nadejdą żadne porcje odpowiedzi. `models.providers.<id>.timeoutSeconds` wydłuża ten watchdog bezczynności dla wolnych dostawców lokalnych/samohostowanych; w przeciwnym razie OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, domyślnie z limitem 120 s. Uruchomienia wyzwalane przez Cron bez jawnego limitu czasu modelu lub agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu Cron.
- Limit czasu żądania HTTP dostawcy: `models.providers.<id>.timeoutSeconds` dotyczy pobrań HTTP modelu tego dostawcy, w tym połączenia, nagłówków, treści, limitu czasu żądania SDK, całkowitej obsługi przerwania chronionego fetch oraz watchdog bezczynności strumienia modelu. Użyj tego dla wolnych dostawców lokalnych/samohostowanych, takich jak Ollama, zanim podniesiesz limit czasu całego runtime agenta.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway lub limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak długie rozmowy są podsumowywane
- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania poleceń powłoki
- [Myślenie](/pl/tools/thinking) — konfiguracja poziomu myślenia/rozumowania
