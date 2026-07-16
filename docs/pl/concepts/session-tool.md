---
read_when:
    - Chcesz zrozumieć, jakie narzędzia sesji ma agent
    - Chcesz skonfigurować dostęp między sesjami lub uruchamianie podagentów
    - Chcesz sprawdzić stan uruchomionego podagenta
summary: Narzędzia agenta do obsługi statusu między sesjami, przywoływania informacji, komunikacji i koordynacji podagentów
title: Narzędzia sesji
x-i18n:
    generated_at: "2026-07-16T18:33:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw udostępnia agentom narzędzia do pracy między sesjami, sprawdzania stanu i koordynowania podagentów.

## Dostępne narzędzia

| Narzędzie          | Działanie                                                                    |
| ------------------ | ---------------------------------------------------------------------------- |
| `sessions_list`    | Wyświetla sesje z opcjonalnymi filtrami (rodzaj, etykieta, agent, archiwum, podgląd) |
| `sessions_history` | Odczytuje transkrypcję określonej sesji                                      |
| `sessions_send`    | Wysyła wiadomość do innej sesji i opcjonalnie oczekuje                       |
| `sessions_spawn`   | Uruchamia izolowaną sesję podagenta do pracy w tle                            |
| `sessions_yield`   | Kończy bieżącą turę i oczekuje na kolejne wyniki podagentów                   |
| `subagents`        | Wyświetla stan podagentów uruchomionych w tej sesji                           |
| `session_status`   | Wyświetla kartę w stylu `/status` i opcjonalnie ustawia nadpisanie modelu dla sesji |

Narzędzia te nadal podlegają aktywnemu profilowi narzędzi oraz zasadom zezwalania i blokowania. `tools.profile: "coding"` obejmuje pełny zestaw koordynowania sesji, w tym `sessions_spawn`, `sessions_yield` i `subagents`. `tools.profile: "messaging"` obejmuje narzędzia do komunikacji między sesjami (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), ale nie pozwala uruchamiać podagentów. Aby zachować profil komunikacyjny i jednocześnie zezwolić na natywne delegowanie, należy dodać:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Zasady grupy, dostawcy, piaskownicy i poszczególnych agentów nadal mogą usuwać te narzędzia po zastosowaniu profilu. Aby sprawdzić obowiązującą listę narzędzi, należy użyć `/tools` w odpowiedniej sesji.

## Wyświetlanie i odczytywanie sesji

`sessions_list` zwraca sesje wraz z ich kluczem, agentId, rodzajem, kanałem, modelem, liczbą tokenów i znacznikami czasu. Można filtrować według `kinds` (tablica; akceptowane wartości: `main`, `group`, `cron`, `hook`, `node`, `other`), dokładnego `label`, dokładnego `agentId`, tekstu `search` lub czasu od ostatniej aktywności (`activeMinutes`). Domyślnie zwracane są aktywne sesje; aby zamiast nich sprawdzić zarchiwizowane sesje, należy przekazać `archived: true`. Wiersze zawierają stan `pinned` i `archived`. Gdy potrzebna jest selekcja podobna do skrzynki odbiorczej, należy ustawić `includeDerivedTitles`, `includeLastMessage` lub `messageLimit` (maksymalnie 20): tytuł pochodny ograniczony zakresem widoczności, fragment podglądu ostatniej wiadomości albo ograniczony zestaw ostatnich wiadomości w każdym wierszu. Tytuły pochodne i podglądy są generowane wyłącznie dla sesji, które wywołujący może już zobaczyć zgodnie ze skonfigurowaną zasadą widoczności narzędzi sesji, dlatego niepowiązane sesje pozostają ukryte. Gdy widoczność jest ograniczona, `sessions_list` zwraca opcjonalne metadane `visibility` przedstawiające obowiązujący tryb oraz ostrzeżenie, że zakres wyników może być ograniczony.

`sessions_history` pobiera transkrypcję rozmowy dla określonej sesji. Domyślnie wyniki narzędzi są wykluczone; aby je wyświetlić, należy przekazać `includeTools: true`. Aby uzyskać najnowszy ograniczony fragment końcowy, należy użyć `limit`. Gdy potrzebne są metadane paginacji, należy przekazać `offset: 0`, a następnie używać zwróconych wartości `nextOffset`, aby stronicować wstecz przez starsze okna transkrypcji OpenClaw bez odczytywania surowych plików transkrypcji. Strony z jawnym przesunięciem nie scalają zewnętrznych importów awaryjnych CLI; gdy potrzebna jest scalona historia wyświetlania, należy użyć domyślnego widoku najnowszego fragmentu końcowego (bez `offset`).

Zwracany widok jest celowo ograniczony i filtrowany pod kątem bezpieczeństwa:

- tekst asystenta jest normalizowany przed przywołaniem:
  - tagi rozumowania są usuwane
  - bloki szkieletowe `<relevant-memories>` / `<relevant_memories>` są usuwane
  - bloki ładunku XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i `<function_calls>...</function_calls>`, są usuwane, w tym obcięte ładunki, które nie zostały poprawnie zamknięte
  - zdegradowane elementy szkieletowe wywołań narzędzi i ich wyników, takie jak `[Tool Call: ...]`, `[Tool Result ...]` i `[Historical context ...]`, są usuwane
  - ujawnione tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII `<|...|>` oraz pełnoszerokie warianty `<｜...｜>`, są usuwane
  - nieprawidłowo sformatowany kod XML wywołań narzędzi MiniMax, taki jak `<invoke ...>` / `</minimax:tool_call>`, jest usuwany
- tekst przypominający dane uwierzytelniające lub tokeny jest redagowany przed zwróceniem
- długie bloki tekstu są obcinane
- w bardzo obszernych historiach starsze wiersze mogą zostać pominięte, a zbyt duży wiersz może zostać zastąpiony przez `[sessions_history omitted: message too large]`
- narzędzie zgłasza flagi podsumowania, takie jak `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes`, oraz metadane paginacji

Oba narzędzia przyjmują **klucz sesji** (na przykład `"main"`) albo **identyfikator sesji** z poprzedniego wywołania listy.

Jeśli potrzebna jest dokładna surowa transkrypcja, należy sprawdzić wiersze transkrypcji SQLite o odpowiednim zakresie zamiast traktować `sessions_history` jako niefiltrowany zrzut.

## Wysyłanie wiadomości między sesjami

`sessions_send` dostarcza wiadomość do innej sesji i opcjonalnie oczekuje na odpowiedź:

- **Wyślij i nie oczekuj:** należy ustawić `timeoutSeconds: 0`, aby dodać wiadomość do kolejki i natychmiast zwrócić sterowanie.
- **Oczekiwanie na odpowiedź:** należy ustawić limit czasu, aby otrzymać odpowiedź bezpośrednio w wyniku.

Sesje czatu ograniczone do wątku, na przykład klucze kończące się na `:thread:<id>`, nie są prawidłowymi celami `sessions_send`. Do koordynacji między agentami należy używać klucza nadrzędnej sesji kanału, aby wiadomości kierowane przez narzędzia nie pojawiały się w aktywnym wątku widocznym dla użytkownika.

Wiadomości i kolejne odpowiedzi A2A są oznaczane jako dane między sesjami w monicie odbierającym (`[Inter-session message ... isUser=false]`) oraz w pochodzeniu transkrypcji. Agent odbierający powinien traktować je jako dane kierowane przez narzędzie, a nie jako instrukcje napisane bezpośrednio przez użytkownika końcowego.

Gdy cel odpowie, OpenClaw może uruchomić **pętlę odpowiedzi zwrotnych**, w której agenci wymieniają się wiadomościami (do `session.agentToAgent.maxPingPongTurns`, zakres 0–20, domyślnie 5). Agent docelowy może odpowiedzieć `REPLY_SKIP`, aby zakończyć wcześniej.

Należy przekazać `watch: true`, aby dodatkowo zarejestrować nadawcę jako obserwatora zmian stanu celu: gdy później inny uczestnik wyśle do celu bezpośrednią wiadomość od człowieka lub zmieni jego cel, nadawca otrzyma powiadomienie systemowe wskazujące `session_status` `changesSince`. Rejestracja następuje po pomyślnym wysłaniu, dotyczy sesji, która faktycznie otrzymała wiadomość, i rozpoczyna się od jej bieżącej wersji stanu, dlatego powiadomienia wywołują tylko późniejsze zmiany. Wynik zgłasza `watched: true`, gdy rejestracja się powiedzie. Zobacz [Świadomość stanu sesji](/concepts/session-state).

## Pomocnicze narzędzia stanu i koordynacji

`session_status` jest lekkim narzędziem równoważnym `/status` dla bieżącej lub innej widocznej sesji. Zgłasza użycie, czas, stan modelu i środowiska wykonawczego oraz — jeśli występuje — kontekst powiązanego zadania w tle. Podobnie jak `/status`, może uzupełniać niepełne liczniki tokenów i pamięci podręcznej na podstawie najnowszego wpisu użycia w transkrypcji, a `model=default` usuwa nadpisanie dla sesji. Dla bieżącej sesji wywołującego należy użyć `sessionKey="current"`; widoczne etykiety klienta, takie jak `openclaw-tui`, nie są kluczami sesji.

Gdy dostępne są metadane routingu, `session_status` zawiera również widoczny blok JSON `Route context` oraz odpowiadające mu ustrukturyzowane pola `details`. Pola te odróżniają klucz sesji od trasy, która obecnie obsługuje aktywne wykonanie:

- `origin` określa miejsce utworzenia sesji albo dostawcę wywnioskowanego z prefiksu klucza sesji umożliwiającej dostarczenie, gdy starszy stan nie zawiera zapisanych metadanych pochodzenia.
- `active` to bieżąca trasa aktywnego wykonania. Jest zgłaszana wyłącznie dla aktywnej lub bieżącej sesji, która jest obecnie obsługiwana.
- `deliveryContext` to utrwalona trasa dostarczania zapisana w sesji, której OpenClaw może ponownie użyć do późniejszego dostarczania, nawet gdy aktywny interfejs jest inny.

## Zmiany stanu sesji

OpenClaw przechowuje trwały dziennik sygnałów istotnych zmian stanu sesji (bezpośrednich wiadomości od człowieka do obserwowanych sesji, wyników wykonań potomnych, zmian celów i Compaction). Wiersze `sessions_list` i `session_status` udostępniają `stateVersion` sesji, a `session_status` przyjmuje `changesSince: <version>`, aby zwrócić typowane zdarzenia po tej wersji, wraz z dokładnym sygnałem `historyGap`, gdy żądana wersja jest starsza niż zachowana historia. Obserwatorzy — automatycznie rodzice uruchamiający procesy potomne, jawnie `sessions_send watch: true` — otrzymują jedno zbiorcze powiadomienie o nieaktualnym stanie, gdy inny uczestnik zmieni obserwowaną sesję.

Pełny model — rodzaje zdarzeń, rejestrację obserwatorów, protokół powiadomień zapobiegający spamowi, przepływ uzgadniania i bieżące ograniczenia — opisano w sekcji [Świadomość stanu sesji](/concepts/session-state).

`sessions_yield` celowo kończy bieżącą turę, aby następna wiadomość mogła być oczekiwanym zdarzeniem uzupełniającym. Należy go użyć po uruchomieniu podagentów, gdy wyniki ukończenia mają nadejść jako następna wiadomość zamiast tworzenia pętli odpytywania.

`subagents` jest narzędziem pomocniczym widoczności dla już uruchomionych podagentów OpenClaw. Obsługuje `action: "list"` do sprawdzania aktywnych i ostatnich wykonań.

## Uruchamianie podagentów

`sessions_spawn` domyślnie tworzy izolowaną sesję dla zadania w tle. Operacja jest zawsze nieblokująca; natychmiast zwraca `runId` i `childSessionKey`. Natywne wykonania podagentów otrzymują delegowane zadanie w pierwszej widocznej wiadomości `[Subagent Task]` sesji potomnej, natomiast monit systemowy zawiera wyłącznie reguły środowiska wykonawczego podagenta i kontekst routingu.

Najważniejsze opcje:

- `runtime: "subagent"` (domyślnie) lub `"acp"` dla agentów zewnętrznego mechanizmu uruchamiania.
- nadpisania `model` i `thinking` dla sesji potomnej.
- `thread: true` wiążące uruchomienie z wątkiem czatu (Discord, Slack itp.).
- `sandbox: "require"` wymuszające piaskownicę dla procesu potomnego.
- `context: "fork"` dla natywnych podagentów, gdy proces potomny potrzebuje transkrypcji bieżącego wnioskodawcy; aby utworzyć czysty proces potomny, należy pominąć tę opcję lub użyć `context: "isolated"`. `context: "fork"` jest prawidłowe tylko z `runtime: "subagent"`. Natywne podagenty powiązane z wątkiem domyślnie używają `context: "fork"`, chyba że `threadBindings.defaultSpawnContext` stanowi inaczej.

Domyślne podagenty końcowe nie otrzymują narzędzi sesji. Gdy `maxSpawnDepth >= 2`, podagenty koordynujące na głębokości 1 otrzymują dodatkowo `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogły zarządzać własnymi procesami potomnymi. Wykonania końcowe nadal nie otrzymują narzędzi do rekurencyjnego koordynowania.

Po ukończeniu etap ogłoszenia publikuje wynik w kanale wnioskodawcy. Dostarczanie informacji o ukończeniu zachowuje powiązany routing wątku lub tematu, gdy jest dostępny, a jeśli pochodzenie ukończenia wskazuje tylko kanał, OpenClaw może nadal ponownie użyć zapisanej trasy sesji wnioskodawcy (`lastChannel` / `lastTo`) do bezpośredniego dostarczenia.

Zachowanie specyficzne dla ACP opisano w sekcji [Agenci ACP](/pl/tools/acp-agents).

## Widoczność

Zakres narzędzi sesji ogranicza dane widoczne dla agenta:

| Poziom  | Zakres                                   |
| ------- | ---------------------------------------- |
| `self`  | Tylko bieżąca sesja                      |
| `tree`  | Bieżąca sesja i uruchomione podagenty    |
| `agent` | Wszystkie sesje tego agenta              |
| `all`   | Wszystkie sesje (między agentami, jeśli skonfigurowano) |

Wartością domyślną jest `tree`. Sesje w piaskownicy są ograniczone do `tree` niezależnie od konfiguracji.

## Dalsza lektura

- [Zarządzanie sesjami](/pl/concepts/session): routing, cykl życia, utrzymanie
- [Podagenci](/pl/tools/subagents): cykl życia sesji podrzędnych i dostarczanie
- [Agenci ACP](/pl/tools/acp-agents): uruchamianie zewnętrznych środowisk wykonawczych
- [Wieloagentowość](/pl/concepts/multi-agent): architektura wieloagentowa
- [Konfiguracja Gateway](/pl/gateway/configuration): opcje konfiguracji narzędzia sesji

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
