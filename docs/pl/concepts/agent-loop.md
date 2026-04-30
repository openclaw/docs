---
read_when:
    - Potrzebujesz dokładnego omówienia krok po kroku pętli agenta lub zdarzeń cyklu życia
    - Zmieniasz kolejkowanie sesji, zapisy transkryptu albo zachowanie blokady zapisu sesji
summary: Cykl życia pętli agenta, strumienie i semantyka oczekiwania
title: Pętla agenta
x-i18n:
    generated_at: "2026-04-30T09:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Pętla agentowa to pełne „rzeczywiste” uruchomienie agenta: przyjęcie danych wejściowych → złożenie kontekstu → inferencja modelu →
wykonanie narzędzi → strumieniowanie odpowiedzi → utrwalenie. To autorytatywna ścieżka, która zamienia wiadomość
w działania i końcową odpowiedź, jednocześnie utrzymując spójny stan sesji.

W OpenClaw pętla to pojedyncze, serializowane uruchomienie na sesję, które emituje zdarzenia cyklu życia i strumienia,
gdy model myśli, wywołuje narzędzia i strumieniuje dane wyjściowe. Ten dokument wyjaśnia, jak ta autentyczna pętla jest
połączona od końca do końca.

## Punkty wejścia

- RPC Gateway: `agent` i `agent.wait`.
- CLI: polecenie `agent`.

## Jak to działa (wysoki poziom)

1. RPC `agent` waliduje parametry, rozwiązuje sesję (sessionKey/sessionId), utrwala metadane sesji i natychmiast zwraca `{ runId, acceptedAt }`.
2. `agentCommand` uruchamia agenta:
   - rozwiązuje model oraz domyślne ustawienia myślenia/verbose/trace
   - wczytuje migawkę Skills
   - wywołuje `runEmbeddedPiAgent` (środowisko uruchomieniowe pi-agent-core)
   - emituje **koniec/błąd cyklu życia**, jeśli osadzona pętla go nie wyemituje
3. `runEmbeddedPiAgent`:
   - serializuje uruchomienia przez kolejki na sesję i globalne
   - rozwiązuje model oraz profil uwierzytelniania i buduje sesję Pi
   - subskrybuje zdarzenia Pi i strumieniuje delty asystenta/narzędzi
   - wymusza limit czasu -> przerywa uruchomienie po jego przekroczeniu
   - zwraca payloady oraz metadane użycia
4. `subscribeEmbeddedPiSession` łączy zdarzenia pi-agent-core ze strumieniem `agent` OpenClaw:
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
- Zapisy transkrypcji są także chronione przez blokadę zapisu sesji na pliku sesji. Blokada jest
  świadoma procesu i oparta na pliku, więc wychwytuje zapisujących, którzy omijają kolejkę w procesie lub pochodzą
  z innego procesu.
- Blokady zapisu sesji domyślnie nie są reentrantne. Jeśli helper celowo zagnieżdża pozyskanie
  tej samej blokady, zachowując jednego logicznego zapisującego, musi jawnie się na to zdecydować przez
  `allowReentrant: true`.

## Przygotowanie sesji + obszaru roboczego

- Obszar roboczy jest rozwiązywany i tworzony; uruchomienia w piaskownicy mogą przekierować do katalogu głównego obszaru roboczego piaskownicy.
- Skills są wczytywane (lub ponownie używane z migawki) i wstrzykiwane do env oraz promptu.
- Pliki bootstrap/kontekstowe są rozwiązywane i wstrzykiwane do raportu promptu systemowego.
- Pozyskiwana jest blokada zapisu sesji; `SessionManager` jest otwierany i przygotowywany przed strumieniowaniem. Każda
  późniejsza ścieżka przepisywania transkrypcji, Compaction lub obcinania musi uzyskać tę samą blokadę przed otwarciem lub
  modyfikacją pliku transkrypcji.

## Składanie promptu + prompt systemowy

- Prompt systemowy jest budowany z bazowego promptu OpenClaw, promptu Skills, kontekstu bootstrap i nadpisań na uruchomienie.
- Limity specyficzne dla modelu i tokeny rezerwowe Compaction są wymuszane.
- Zobacz [Prompt systemowy](/pl/concepts/system-prompt), aby sprawdzić, co widzi model.

## Punkty hooków (gdzie możesz przechwytywać)

OpenClaw ma dwa systemy hooków:

- **Hooki wewnętrzne** (hooki Gateway): skrypty sterowane zdarzeniami dla poleceń i zdarzeń cyklu życia.
- **Hooki Plugin**: punkty rozszerzeń wewnątrz cyklu życia agenta/narzędzia i potoku Gateway.

### Hooki wewnętrzne (hooki Gateway)

- **`agent:bootstrap`**: działa podczas budowania plików bootstrap, zanim prompt systemowy zostanie sfinalizowany.
  Użyj tego, aby dodać/usunąć pliki kontekstu bootstrap.
- **Hooki poleceń**: `/new`, `/reset`, `/stop` i inne zdarzenia poleceń (zobacz dokument o Hookach).

Zobacz [Hooki](/pl/automation/hooks), aby poznać konfigurację i przykłady.

### Hooki Plugin (cykl życia agenta + Gateway)

Działają wewnątrz pętli agenta lub potoku Gateway:

- **`before_model_resolve`**: działa przed sesją (bez `messages`), aby deterministycznie nadpisać dostawcę/model przed rozwiązaniem modelu.
- **`before_prompt_build`**: działa po wczytaniu sesji (z `messages`), aby wstrzyknąć `prependContext`, `systemPrompt`, `prependSystemContext` lub `appendSystemContext` przed wysłaniem promptu. Użyj `prependContext` dla dynamicznego tekstu na turę, a pól kontekstu systemowego dla stabilnych wskazówek, które powinny znajdować się w przestrzeni promptu systemowego.
- **`before_agent_start`**: starszy hook kompatybilności, który może działać w dowolnej fazie; preferuj jawne hooki powyżej.
- **`before_agent_reply`**: działa po działaniach inline i przed wywołaniem LLM, pozwalając Plugin przejąć turę i zwrócić syntetyczną odpowiedź albo całkowicie wyciszyć turę.
- **`agent_end`**: sprawdza końcową listę wiadomości i metadane uruchomienia po zakończeniu.
- **`before_compaction` / `after_compaction`**: obserwuje lub adnotuje cykle Compaction.
- **`before_tool_call` / `after_tool_call`**: przechwytuje parametry/wyniki narzędzi.
- **`before_install`**: sprawdza wbudowane wyniki skanowania i opcjonalnie blokuje instalacje Skills lub Plugin.
- **`tool_result_persist`**: synchronicznie przekształca wyniki narzędzi, zanim zostaną zapisane w transkrypcji sesji należącej do OpenClaw.
- **`message_received` / `message_sending` / `message_sent`**: hooki wiadomości przychodzących i wychodzących.
- **`session_start` / `session_end`**: granice cyklu życia sesji.
- **`gateway_start` / `gateway_stop`**: zdarzenia cyklu życia Gateway.

Reguły decyzyjne hooków dla strażników wychodzących/narzędzi:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` nic nie robi i nie usuwa wcześniejszej blokady.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` nic nie robi i nie usuwa wcześniejszego anulowania.

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby poznać API hooków i szczegóły rejestracji.

Harnessy mogą różnie adaptować te hooki. Harness serwera aplikacji Codex zachowuje
hooki Plugin OpenClaw jako kontrakt kompatybilności dla udokumentowanych powierzchni lustrzanych,
podczas gdy natywne hooki Codex pozostają oddzielnym, niższopoziomowym mechanizmem Codex.

## Strumieniowanie + częściowe odpowiedzi

- Delty asystenta są strumieniowane z pi-agent-core i emitowane jako zdarzenia `assistant`.
- Strumieniowanie bloków może emitować częściowe odpowiedzi na `text_end` albo `message_end`.
- Strumieniowanie rozumowania może być emitowane jako oddzielny strumień albo jako odpowiedzi blokowe.
- Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać zachowanie fragmentowania i odpowiedzi blokowych.

## Wykonywanie narzędzi + narzędzia komunikacji

- Zdarzenia start/update/end narzędzi są emitowane w strumieniu `tool`.
- Wyniki narzędzi są oczyszczane pod kątem rozmiaru i payloadów obrazów przed logowaniem/emitowaniem.
- Wysyłki narzędzi komunikacji są śledzone, aby tłumić zduplikowane potwierdzenia asystenta.

## Kształtowanie odpowiedzi + tłumienie

- Końcowe payloady są składane z:
  - tekstu asystenta (i opcjonalnego rozumowania)
  - podsumowań narzędzi inline (gdy verbose + dozwolone)
  - tekstu błędu asystenta, gdy model zgłasza błąd
- Dokładny cichy token `NO_REPLY` / `no_reply` jest filtrowany z wychodzących
  payloadów.
- Duplikaty narzędzi komunikacji są usuwane z końcowej listy payloadów.
- Jeśli nie pozostaną żadne renderowalne payloady, a narzędzie zwróciło błąd, emitowana jest zastępcza odpowiedź błędu narzędzia
  (chyba że narzędzie komunikacji już wysłało widoczną dla użytkownika odpowiedź).

## Compaction + ponowne próby

- Auto-Compaction emituje zdarzenia strumienia `compaction` i może wywołać ponowną próbę.
- Przy ponownej próbie bufory w pamięci i podsumowania narzędzi są resetowane, aby uniknąć zduplikowanych danych wyjściowych.
- Zobacz [Compaction](/pl/concepts/compaction), aby poznać potok Compaction.

## Strumienie zdarzeń (obecnie)

- `lifecycle`: emitowany przez `subscribeEmbeddedPiSession` (i awaryjnie przez `agentCommand`)
- `assistant`: strumieniowane delty z pi-agent-core
- `tool`: strumieniowane zdarzenia narzędzi z pi-agent-core

## Obsługa kanału czatu

- Delty asystenta są buforowane w wiadomościach czatu `delta`.
- Chat `final` jest emitowany przy **końcu/błędzie cyklu życia**.

## Limity czasu

- Domyślnie `agent.wait`: 30 s (tylko oczekiwanie). Parametr `timeoutMs` nadpisuje tę wartość.
- Środowisko uruchomieniowe agenta: domyślne `agents.defaults.timeoutSeconds` to 172800 s (48 godzin); wymuszane przez timer przerwania w `runEmbeddedPiAgent`.
- Środowisko uruchomieniowe Cron: izolowane `timeoutSeconds` tury agenta należy do cron. Harmonogram uruchamia ten timer, gdy wykonanie się zaczyna, przerywa bazowe uruchomienie w skonfigurowanym terminie, a następnie wykonuje ograniczone sprzątanie przed zapisaniem limitu czasu, aby nieaktualna sesja potomna nie mogła zablokować pasa.
- Odzyskiwanie zablokowanej sesji: przy włączonej diagnostyce `diagnostics.stuckSessionWarnMs` wykrywa długie sesje `processing`. Aktywne osadzone uruchomienia, aktywne operacje odpowiedzi i aktywne zadania pasa sesji domyślnie pozostają tylko ostrzeżeniami; jeśli diagnostyka nie pokazuje aktywnej pracy dla sesji, watchdog zwalnia dotknięty pas sesji, aby zakolejkowana praca startowa mogła się opróżnić.
- Limit bezczynności modelu: OpenClaw przerywa żądanie modelu, gdy przed upływem okna bezczynności nie przyjdą żadne fragmenty odpowiedzi. `models.providers.<id>.timeoutSeconds` wydłuża ten watchdog bezczynności dla wolnych lokalnych/samodzielnie hostowanych dostawców; w przeciwnym razie OpenClaw używa `agents.defaults.timeoutSeconds`, gdy jest skonfigurowane, domyślnie z limitem 120 s. Uruchomienia wyzwalane przez Cron bez jawnego limitu czasu modelu lub agenta wyłączają watchdog bezczynności i polegają na zewnętrznym limicie czasu cron.
- Limit czasu żądania HTTP dostawcy: `models.providers.<id>.timeoutSeconds` stosuje się do pobrań HTTP modelu tego dostawcy, w tym połączenia, nagłówków, treści, limitu czasu żądania SDK, całkowitej obsługi przerwania chronionego fetch oraz watchdog bezczynności strumienia modelu. Używaj tego dla wolnych lokalnych/samodzielnie hostowanych dostawców, takich jak Ollama, zanim zwiększysz limit czasu całego środowiska uruchomieniowego agenta.

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
- [Myślenie](/pl/tools/thinking) — konfiguracja poziomu myślenia/rozumowania
