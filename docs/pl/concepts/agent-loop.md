---
read_when:
    - Potrzebujesz dokładnego omówienia pętli agenta lub zdarzeń cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisy transkrypcji lub zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-06-27T17:24:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agentowa to pełne „rzeczywiste” uruchomienie agenta: przyjęcie → składanie kontekstu → inferencja modelu →
wykonanie narzędzi → odpowiedzi strumieniowe → utrwalenie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, zachowując spójny stan sesji.

W OpenClaw pętla jest pojedynczym, serializowanym uruchomieniem na sesję, które emituje zdarzenia cyklu życia i strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje wynik. Ten dokument wyjaśnia, jak ta autentyczna pętla jest
połączona od początku do końca.

## Punkty wejścia

- RPC Gateway: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (ogólnie)

1. RPC `agent` weryfikuje parametry, rozwiązuje sesję (sessionKey/sessionId), utrwala metadane sesji, natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje model + domyślne wartości myślenia/szczegółowości/śladu
   - ładuje migawkę Skills
   - wywołuje `runEmbeddedAgent` (środowisko uruchomieniowe agenta OpenClaw)
   - emituje **zakończenie/błąd cyklu życia**, jeśli osadzona pętla sama tego nie emituje
3. `runEmbeddedAgent`:
   - serializuje uruchomienia przez kolejki na sesję + globalne kolejki
   - rozwiązuje model + profil uwierzytelniania i buduje sesję OpenClaw
   - subskrybuje zdarzenia środowiska uruchomieniowego i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa uruchomienie po jego przekroczeniu
   - dla tur serwera aplikacji Codex przerywa zaakceptowaną turę, która przestaje generować postęp serwera aplikacji przed zdarzeniem końcowym
   - zwraca ładunki + metadane użycia
4. `subscribeEmbeddedAgentSession` mostkuje zdarzenia środowiska uruchomieniowego agenta do strumienia `agent` OpenClaw:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **zakończenie/błąd cyklu życia** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie + współbieżność

- Uruchomienia są serializowane według klucza sesji (tor sesji) i opcjonalnie przez tor globalny.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały wiadomości mogą wybierać tryby kolejki (sterowanie/kontynuacja/zbieranie/przerwanie), które zasilają ten system torów.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkrypcji są również chronione przez blokadę zapisu sesji na pliku sesji. Blokada jest
  świadoma procesów i oparta na plikach, więc wykrywa zapisujących, którzy omijają kolejkę w procesie lub pochodzą
  z innego procesu. Procesy zapisujące transkrypcję sesji czekają maksymalnie `session.writeLock.acquireTimeoutMs`
  przed zgłoszeniem sesji jako zajętej; wartość domyślna to `60000` ms.
- Blokady zapisu sesji domyślnie nie są reentrantne. Jeśli helper celowo zagnieżdża pozyskanie
  tej samej blokady przy zachowaniu jednego logicznego zapisującego, musi jawnie się na to zdecydować przez
  `allowReentrant: true`.

## Przygotowanie sesji + przestrzeni roboczej

- Przestrzeń robocza jest rozwiązywana i tworzona; uruchomienia w piaskownicy mogą przekierować do katalogu głównego przestrzeni roboczej piaskownicy.
- Skills są ładowane (albo ponownie używane z migawki) i wstrzykiwane do środowiska oraz promptu.
- Pliki bootstrap/kontekstowe są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Pozyskiwana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkrypcji, Compaction lub obcinania musi pozyskać tę samą blokadę przed otwarciem lub
  modyfikacją pliku transkrypcji.

## Składanie promptu + prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań dla danego uruchomienia.
- Wymuszane są limity specyficzne dla modelu oraz tokeny rezerwy Compaction.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby dowiedzieć się, co widzi model.

## Punkty zaczepienia (gdzie można przechwytywać)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzi i potoku Gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: działa podczas budowania plików bootstrap, zanim prompt systemowy zostanie sfinalizowany.
  Użyj tego, aby dodać/usunąć pliki kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokument Hooki).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta + gateway)

Działają one wewnątrz pętli agenta lub potoku gateway:

- **`before_model_resolve`**: działa przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązaniem modelu.
- **`before_prompt_build`**: działa po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext` przed wysłaniem promptu. Użyj `prependContext` dla dynamicznego tekstu na turę oraz pól kontekstu systemowego dla stabilnych wskazówek, które powinny znajdować się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hook zgodności, który może działać w dowolnej fazie; preferuj powyższe jawne hooki.
- **`before_agent_reply`**: działa po akcjach inline i przed wywołaniem LLM, pozwalając Plugin przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwuje lub adnotuje cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytuje parametry/wyniki narzędzi.
- **`before_install`**: sprawdza przygotowany materiał instalacyjny skill lub Plugin po wykonaniu zasad instalacji operatora, gdy hooki Plugin są załadowane w bieżącym procesie OpenClaw.
- **`tool_result_persist`**: synchronicznie transformuje wyniki narzędzi, zanim zostaną zapisane do należącej do OpenClaw transkrypcji sesji.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących + wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia gateway.

Reguły decyzji hooków dla zabezpieczeń wychodzących/narzędzi:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- Użyj `security.installPolicy`, a nie `before_install`, do należących do operatora decyzji zezwalania/blokowania instalacji, które muszą obejmować ścieżki instalacji i aktualizacji CLI.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest operacją bez efektu i nie usuwa wcześniejszego anulowania.

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby poznać API hooków i szczegóły rejestracji.

Uprzęże mogą adaptować te hooki inaczej. Uprząż serwera aplikacji Codex zachowuje
hooki Plugin OpenClaw jako kontrakt zgodności dla udokumentowanych powierzchni lustrzanych,
podczas gdy natywne hooki Codex pozostają osobnym, niższopoziomowym mechanizmem Codex.

## Strumieniowanie + częściowe odpowiedzi

- Delty asystenta są strumieniowane ze środowiska uruchomieniowego agenta i emitowane jako zdarzenia `assistant`.
- Strumieniowanie bloków może emitować częściowe odpowiedzi na `text_end` albo `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień albo jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać zachowanie porcjowania i odpowiedzi blokowych.

## Wykonanie narzędzi + narzędzia wiadomości

- Zdarzenia start/update/end narzędzi są emitowane w strumieniu `tool`.
- Wyniki narzędzi są oczyszczane pod kątem rozmiaru i ładunków obrazów przed logowaniem/emitowaniem.
- Wysyłki narzędzi wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie odpowiedzi + tłumienie

- Końcowe ładunki są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - podsumowań narzędzi inline (gdy szczegółowość + zezwolenie)
  - tekstu błędu asystenta, gdy model zgłasza błąd
- Dokładny token ciszy `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  ładunków.
- Duplikaty narzędzi wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostają żadne renderowalne ładunki, a narzędzie zgłosiło błąd, emitowana jest zastępcza odpowiedź błędu narzędzia
  (chyba że narzędzie wiadomości już wysłało odpowiedź widoczną dla użytkownika).

## Compaction + ponowienia

- Automatyczna Compaction emituje zdarzenia strumienia `compaction` i może wyzwolić ponowienie.
- Przy ponowieniu bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyniku.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedAgentSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty ze środowiska uruchomieniowego agenta
- `tool`: strumieniowane zdarzenia narzędzi ze środowiska uruchomieniowego agenta

## Obsługa kanału czatu

- Delty asystenta są buforowane w wiadomościach czatu `delta`.
- `final` czatu jest emitowane przy **zakończeniu/błędzie cyklu życia**.

## Limity czasu

- Wartość domyślna `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje.
- Środowisko uruchomieniowe agenta: domyślne `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane przez licznik przerwania w `runEmbeddedAgent`.
- Środowisko uruchomieniowe Cron: izolowane `timeoutSeconds` tury agenta należy do cron. Harmonogram uruchamia ten licznik, gdy zaczyna się wykonanie, przerywa bazowe uruchomienie w skonfigurowanym terminie, a następnie wykonuje ograniczone czyszczenie przed zapisaniem limitu czasu, aby nieaktualna sesja podrzędna nie mogła zablokować toru.
- Diagnostyka żywotności sesji: przy włączonej diagnostyce `diagnostics.stuckSessionWarnMs` klasyfikuje długie sesje `processing`, które nie mają zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP. Aktywne osadzone uruchomienia, wywołania modelu i wywołania narzędzi są zgłaszane jako `session.long_running`; należące do właściciela ciche wywołania modelu również pozostają `session.long_running` do `diagnostics.stuckSessionAbortMs`, aby wolni lub niestrumieniujący dostawcy nie byli zgłaszani jako zablokowani zbyt wcześnie. Aktywna praca bez niedawnego postępu jest zgłaszana jako `session.stalled`; należące do właściciela wywołania modelu przełączają się na `session.stalled` przy progu przerwania lub po nim, a osierocona nieaktualna aktywność modelu/narzędzia nie jest ukrywana jako długo działająca. `session.stuck` jest zarezerwowane dla możliwego do odzyskania nieaktualnego prowadzenia księgowości sesji, w tym bezczynnych kolejkowanych sesji z nieaktualną osieroconą aktywnością modelu/narzędzia. Nieaktualne prowadzenie księgowości sesji zwalnia dotknięty tor sesji natychmiast po przejściu bramek odzyskiwania; zablokowane osadzone uruchomienia są przerywane i opróżniane dopiero po `diagnostics.stuckSessionAbortMs` (domyślnie: co najmniej 5 minut i 3x próg ostrzegania), aby praca w kolejce mogła zostać wznowiona bez ucinania jedynie wolnych uruchomień. Odzyskiwanie emituje ustrukturyzowane wyniki żądane/ukończone, a stan diagnostyczny jest oznaczany jako bezczynny tylko wtedy, gdy ta sama generacja przetwarzania nadal jest bieżąca. Powtarzające się diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje niezmieniona.
- Limit bezczynności modelu: OpenClaw przerywa żądanie modelu, gdy przed oknem bezczynności nie nadejdą żadne fragmenty odpowiedzi. `models.providers.<id>.timeoutSeconds` wydłuża ten strażnik bezczynności dla wolnych lokalnych/samohostowanych dostawców, ale nadal jest ograniczony przez niższe `agents.defaults.timeoutSeconds` lub limit czasu konkretnego uruchomienia, ponieważ kontrolują one całe uruchomienie agenta. W przeciwnym razie OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, domyślnie ograniczone do 120 s. Uruchamiane przez Cron uruchomienia modeli chmurowych bez jawnego limitu czasu modelu lub agenta używają tego samego domyślnego strażnika bezczynności; przy jawnym limicie czasu uruchomienia cron zastoje strumienia modelu chmurowego są ograniczone do 60 s, aby skonfigurowane fallbacki modelu mogły zadziałać przed zewnętrznym terminem cron. Uruchamiane przez Cron lokalne lub samohostowane uruchomienia modelu wyłączają niejawnego strażnika, chyba że skonfigurowano jawny limit czasu, a jawne limity czasu uruchomienia cron pozostają oknem bezczynności dla lokalnych/samohostowanych dostawców, więc wolni lokalni dostawcy powinni ustawić `models.providers.<id>.timeoutSeconds`.
- Limit czasu żądania HTTP dostawcy: `models.providers.<id>.timeoutSeconds` dotyczy pobrań HTTP modelu tego dostawcy, w tym połączenia, nagłówków, treści, limitu czasu żądania SDK, całkowitej obsługi przerwania chronionego pobierania oraz strażnika bezczynności strumienia modelu. Użyj tego dla wolnych lokalnych/samohostowanych dostawców, takich jak Ollama, zanim podniesiesz limit czasu całego środowiska uruchomieniowego agenta, i utrzymuj limit czasu agenta/środowiska uruchomieniowego co najmniej tak wysoki, gdy żądanie modelu musi działać dłużej.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway lub limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak podsumowywane są długie konwersacje
- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Myślenie](/pl/tools/thinking) — konfiguracja poziomu myślenia/rozumowania
