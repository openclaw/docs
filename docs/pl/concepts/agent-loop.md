---
read_when:
    - Potrzebujesz dokładnego przewodnika po pętli agenta lub zdarzeniach cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisywanie transkrypcji lub działanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-04-30T18:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agentowa to pełny „rzeczywisty” przebieg agenta: przyjęcie danych wejściowych → złożenie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalenie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, utrzymując spójny stan sesji.

W OpenClaw pętla jest pojedynczym, serializowanym przebiegiem na sesję, który emituje zdarzenia cyklu życia i strumienia,
gdy model rozumuje, wywołuje narzędzia i strumieniuje wynik. Ten dokument wyjaśnia, jak ta autentyczna pętla jest
połączona od początku do końca.

## Punkty wejścia

- Gateway RPC: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (ogólnie)

1. RPC `agent` weryfikuje parametry, rozwiązuje sesję (`sessionKey`/`sessionId`), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje model oraz domyślne wartości myślenia/szczegółowości/śledzenia
   - ładuje migawkę Skills
   - wywołuje `runEmbeddedPiAgent` (środowisko uruchomieniowe `pi-agent-core`)
   - emituje **zakończenie/błąd cyklu życia**, jeśli osadzona pętla tego nie zrobi
3. `runEmbeddedPiAgent`:
   - serializuje przebiegi przez kolejki na sesję i kolejki globalne
   - rozwiązuje model oraz profil uwierzytelniania i buduje sesję pi
   - subskrybuje zdarzenia pi i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa przebieg po jego przekroczeniu
   - dla tur serwera aplikacji Codex przerywa zaakceptowaną turę, która przestaje generować postęp serwera aplikacji przed zdarzeniem końcowym
   - zwraca ładunki i metadane użycia
4. `subscribeEmbeddedPiSession` łączy zdarzenia `pi-agent-core` ze strumieniem `agent` OpenClaw:
   - zdarzenia narzędzi => `stream: "tool"`
   - delty asystenta => `stream: "assistant"`
   - zdarzenia cyklu życia => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` używa `waitForAgentRun`:
   - czeka na **zakończenie/błąd cyklu życia** dla `runId`
   - zwraca `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Kolejkowanie i współbieżność

- Przebiegi są serializowane według klucza sesji (ścieżka sesji) i opcjonalnie przez ścieżkę globalną.
- Zapobiega to wyścigom narzędzi/sesji i utrzymuje spójną historię sesji.
- Kanały komunikacji mogą wybierać tryby kolejkowania (zbieranie/sterowanie/kontynuacja), które zasilają ten system ścieżek.
  Zobacz [Kolejka poleceń](/pl/concepts/queue).
- Zapisy transkrypcji są także chronione blokadą zapisu sesji na pliku sesji. Blokada jest
  świadoma procesów i oparta na plikach, więc wychwytuje zapisujących, którzy omijają kolejkę w procesie albo pochodzą
  z innego procesu.
- Blokady zapisu sesji domyślnie nie są reentrantne. Jeśli pomocnik celowo zagnieżdża pozyskanie
  tej samej blokady, zachowując jednego logicznego zapisującego, musi jawnie się na to zdecydować za pomocą
  `allowReentrant: true`.

## Przygotowanie sesji i przestrzeni roboczej

- Przestrzeń robocza jest rozwiązywana i tworzona; przebiegi w piaskownicy mogą przekierować do katalogu głównego przestrzeni roboczej piaskownicy.
- Skills są ładowane (albo ponownie używane z migawki) i wstrzykiwane do środowiska oraz promptu.
- Pliki rozruchowe/kontekstowe są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Pozyskiwana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania, Compaction albo skracania transkrypcji musi pozyskać tę samą blokadę przed otwarciem albo
  modyfikacją pliku transkrypcji.

## Składanie promptu i prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu rozruchowego i nadpisań dla danego przebiegu.
- Wymuszane są limity specyficzne dla modelu oraz tokeny rezerwy Compaction.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty zaczepienia (gdzie można przechwycić)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzia i potoku gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: działa podczas budowania plików rozruchowych, zanim prompt systemowy zostanie sfinalizowany.
  Użyj tego, aby dodać/usunąć pliki kontekstu rozruchowego.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokumentację hooków).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta i gateway)

Działają wewnątrz pętli agenta albo potoku gateway:

- **`before_model_resolve`**: działa przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązaniem modelu.
- **`before_prompt_build`**: działa po załadowaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` albo `appendSystemContext` przed wysłaniem promptu. Użyj `prependContext` dla dynamicznego tekstu na turę, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znaleźć się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hook zgodności, który może działać w obu fazach; preferuj jawne hooki powyżej.
- **`before_agent_reply`**: działa po akcjach wbudowanych i przed wywołaniem LLM, pozwalając Plugin przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane przebiegu po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwuje albo adnotuje cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytuje parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wbudowane wyniki skanowania i opcjonalnie blokuje instalacje Skills albo Plugin.
- **`tool_result_persist`**: synchronicznie przekształca wyniki narzędzi przed zapisaniem ich do transkrypcji sesji należącej do OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących i wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia gateway.

Reguły decyzji hooków dla zabezpieczeń wychodzących/narzędzi:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest operacją bez efektu i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest operacją bez efektu i nie usuwa wcześniejszego anulowania.

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby poznać API hooków i szczegóły rejestracji.

Uprzęże mogą dostosowywać te hooki inaczej. Uprząż serwera aplikacji Codex zachowuje
hooki Plugin OpenClaw jako kontrakt zgodności dla udokumentowanych powierzchni lustrzanych,
podczas gdy natywne hooki Codex pozostają osobnym mechanizmem Codex niższego poziomu.

## Strumieniowanie i częściowe odpowiedzi

- Delty asystenta są strumieniowane z `pi-agent-core` i emitowane jako zdarzenia `assistant`.
- Strumieniowanie blokowe może emitować częściowe odpowiedzi przy `text_end` albo `message_end`.
- Strumieniowanie rozumowania może być emitowane jako osobny strumień albo jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać dzielenie na fragmenty i zachowanie odpowiedzi blokowych.

## Wykonywanie narzędzi i narzędzia wiadomości

- Zdarzenia rozpoczęcia/aktualizacji/zakończenia narzędzia są emitowane w strumieniu `tool`.
- Wyniki narzędzi są oczyszczane pod kątem rozmiaru i ładunków obrazów przed logowaniem/emitowaniem.
- Wysłania narzędzi wiadomości są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie i tłumienie odpowiedzi

- Końcowe ładunki są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - wbudowanych podsumowań narzędzi (gdy szczegółowość jest włączona i dozwolona)
  - tekstu błędu asystenta, gdy model zwraca błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  ładunków.
- Duplikaty narzędzi wiadomości są usuwane z końcowej listy ładunków.
- Jeśli nie pozostaną żadne renderowalne ładunki, a narzędzie zwróciło błąd, emitowana jest zastępcza odpowiedź błędu narzędzia
  (chyba że narzędzie wiadomości już wysłało odpowiedź widoczną dla użytkownika).

## Compaction i ponowne próby

- Automatyczna Compaction emituje zdarzenia strumienia `compaction` i może wywołać ponowną próbę.
- Przy ponownej próbie bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanego wyniku.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (oraz awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z `pi-agent-core`
- `tool`: strumieniowane zdarzenia narzędzi z `pi-agent-core`

## Obsługa kanałów czatu

- Delty asystenta są buforowane w wiadomościach czatu `delta`.
- `final` czatu jest emitowane przy **zakończeniu/błędzie cyklu życia**.

## Limity czasu

- Domyślne `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje tę wartość.
- Środowisko uruchomieniowe agenta: domyślne `agents.defaults.timeoutSeconds` wynosi 172800 s (48 godzin); wymuszane w timerze przerwania `runEmbeddedPiAgent`.
- Środowisko uruchomieniowe Cron: izolowany `timeoutSeconds` tury agenta jest własnością cron. Harmonogram uruchamia ten timer, gdy rozpoczyna się wykonanie, przerywa bazowy przebieg przy skonfigurowanym terminie, a następnie uruchamia ograniczone sprzątanie przed zapisaniem limitu czasu, aby przestarzała sesja podrzędna nie mogła zablokować ścieżki.
- Odzyskiwanie zablokowanej sesji: przy włączonej diagnostyce `diagnostics.stuckSessionWarnMs` wykrywa długo trwające sesje `processing`. Aktywne osadzone przebiegi, aktywne operacje odpowiedzi i aktywne zadania ścieżki sesji domyślnie pozostają tylko ostrzeżeniami; jeśli diagnostyka nie pokazuje aktywnej pracy dla sesji, watchdog zwalnia dotkniętą ścieżkę sesji, aby zakolejkowana praca startowa mogła się opróżnić.
- Limit bezczynności modelu: OpenClaw przerywa żądanie modelu, gdy przed upływem okna bezczynności nie nadejdą żadne fragmenty odpowiedzi. `models.providers.<id>.timeoutSeconds` wydłuża ten watchdog bezczynności dla wolnych lokalnych/samohostowanych dostawców; w przeciwnym razie OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, domyślnie ograniczone do 120 s. Przebiegi wyzwalane przez Cron bez jawnego limitu czasu modelu lub agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu cron.
- Limit czasu żądania HTTP dostawcy: `models.providers.<id>.timeoutSeconds` dotyczy żądań HTTP fetch modelu tego dostawcy, w tym połączenia, nagłówków, treści, limitu czasu żądania SDK, całkowitej obsługi przerwania chronionego fetch oraz watchdoga bezczynności strumienia modelu. Użyj tego dla wolnych lokalnych/samohostowanych dostawców, takich jak Ollama, zanim zwiększysz limit czasu całego środowiska uruchomieniowego agenta.

## Gdzie rzeczy mogą zakończyć się wcześniej

- Limit czasu agenta (przerwanie)
- AbortSignal (anulowanie)
- Rozłączenie Gateway albo limit czasu RPC
- Limit czasu `agent.wait` (tylko oczekiwanie, nie zatrzymuje agenta)

## Powiązane

- [Narzędzia](/pl/tools) — dostępne narzędzia agenta
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami wyzwalane przez zdarzenia cyklu życia agenta
- [Compaction](/pl/concepts/compaction) — jak podsumowywane są długie rozmowy
- [Zatwierdzenia Exec](/pl/tools/exec-approvals) — bramki zatwierdzania dla poleceń powłoki
- [Myślenie](/pl/tools/thinking) — konfiguracja poziomu myślenia/rozumowania
