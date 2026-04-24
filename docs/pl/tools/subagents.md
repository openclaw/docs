---
read_when:
    - Chcesz wykonywać pracę w tle/równolegle przez agenta
    - Zmieniasz politykę narzędzia sessions_spawn lub subagenta
    - Implementujesz lub diagnozujesz sesje subagenta powiązane z wątkiem
summary: 'Subagenci: uruchamianie izolowanych przebiegów agenta, które ogłaszają wyniki z powrotem na czacie żądającym'
title: Subagenci
x-i18n:
    generated_at: "2026-04-24T09:38:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

Subagenci to uruchamiane w tle przebiegi agenta tworzone z istniejącego przebiegu agenta. Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i po zakończeniu **ogłaszają** swój wynik z powrotem na kanale czatu żądającego. Każdy przebieg subagenta jest śledzony jako [zadanie w tle](/pl/automation/tasks).

## Polecenie ukośnikowe

Użyj `/subagents`, aby sprawdzić lub kontrolować przebiegi subagentów dla **bieżącej sesji**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Sterowanie powiązaniem z wątkiem:

Te polecenia działają na kanałach obsługujących trwałe powiązania z wątkiem. Zobacz **Kanały obsługujące wątki** poniżej.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` pokazuje metadane przebiegu (status, znaczniki czasu, identyfikator sesji, ścieżkę transkryptu, czyszczenie).
Użyj `sessions_history`, aby uzyskać ograniczony, filtrowany pod kątem bezpieczeństwa widok historii; sprawdzaj
ścieżkę transkryptu na dysku, gdy potrzebujesz surowego pełnego transkryptu.

### Zachowanie spawn

`/subagents spawn` uruchamia subagenta w tle jako polecenie użytkownika, a nie jako wewnętrzny przekaźnik, i wysyła jedną końcową aktualizację o zakończeniu z powrotem na czat żądającego, gdy przebieg się zakończy.

- Polecenie spawn nie blokuje; natychmiast zwraca identyfikator przebiegu.
- Po zakończeniu subagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem na kanale czatu żądającego.
- Dostarczanie po zakończeniu jest oparte na push. Po uruchomieniu nie odpytyj w pętli `/subagents list`,
  `sessions_list` ani `sessions_history` tylko po to, aby czekać na
  zakończenie; sprawdzaj status tylko na żądanie do debugowania lub interwencji.
- Po zakończeniu OpenClaw metodą best-effort zamyka śledzone karty/procesy przeglądarki otwarte przez tę sesję subagenta, zanim będzie kontynuowany przepływ czyszczenia po ogłoszeniu.
- Dla ręcznych uruchomień dostarczanie jest odporne:
  - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` przy użyciu stabilnego klucza idempotencji.
  - Jeśli bezpośrednie dostarczenie się nie powiedzie, przełącza się na routing przez kolejkę.
  - Jeśli routing przez kolejkę nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym backoffem przed ostateczną rezygnacją.
- Dostarczanie po zakończeniu zachowuje rozwiązaną trasę żądającego:
  - trasy zakończenia powiązane z wątkiem lub rozmową mają pierwszeństwo, gdy są dostępne
  - jeśli źródło zakończenia podaje tylko kanał, OpenClaw uzupełnia brakujący target/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało
- Przekazanie informacji o zakończeniu do sesji żądającego to wewnętrzny kontekst wygenerowany w czasie działania (a nie tekst utworzony przez użytkownika) i obejmuje:
  - `Result` (najnowszy widoczny tekst odpowiedzi `assistant`, a w przeciwnym razie oczyszczony najnowszy tekst `tool`/`toolResult`; zakończone błędem przebiegi terminalowe nie używają ponownie przechwyconego tekstu odpowiedzi)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - zwarte statystyki środowiska uruchomieniowego/tokenów
  - instrukcję dostarczania mówiącą agentowi żądającemu, aby przepisał treść normalnym głosem asystenta (a nie przekazywał surowych wewnętrznych metadanych)
- `--model` i `--thinking` nadpisują ustawienia domyślne dla tego konkretnego przebiegu.
- Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po zakończeniu.
- `/subagents spawn` działa w trybie jednorazowym (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
- Dla sesji harness ACP (Codex, Claude Code, Gemini CLI) użyj `sessions_spawn` z `runtime: "acp"` i zobacz [Agenci ACP](/pl/tools/acp-agents), szczególnie [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania zakończeń lub pętli agent-do-agenta.

Główne cele:

- Zrównoleglanie pracy typu „research / długie zadanie / wolne narzędzie” bez blokowania głównego przebiegu.
- Domyślna izolacja subagentów (separacja sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: subagenci **nie** otrzymują domyślnie narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestratora.

Uwaga o kosztach: każdy subagent domyślnie ma **własny** kontekst i własne zużycie tokenów. Dla ciężkich lub
powtarzalnych zadań ustaw tańszy model dla subagentów, a głównego agenta pozostaw na modelu
o wyższej jakości. Możesz to skonfigurować przez `agents.defaults.subagents.model` lub nadpisania per-agent.
Gdy dziecko rzeczywiście potrzebuje bieżącego transkryptu żądającego, agent może zażądać
`context: "fork"` przy tym jednym uruchomieniu.

## Narzędzie

Użyj `sessions_spawn`:

- Uruchamia przebieg subagenta (`deliver: false`, globalna ścieżka współbieżności: `subagent`)
- Następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłaszającą na kanale czatu żądającego
- Domyślny model: dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (lub per-agent `agents.list[].subagents.model`); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- Domyślny poziom myślenia: dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (lub per-agent `agents.list[].subagents.thinking`); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- Domyślny limit czasu przebiegu: jeśli pominięto `sessions_spawn.runTimeoutSeconds`, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, jeśli jest ustawione; w przeciwnym razie wraca do `0` (brak limitu czasu).

Parametry narzędzia:

- `task` (wymagane)
- `label?` (opcjonalne)
- `agentId?` (opcjonalne; uruchom pod innym identyfikatorem agenta, jeśli jest to dozwolone)
- `model?` (opcjonalne; nadpisuje model subagenta; nieprawidłowe wartości są pomijane, a subagent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia)
- `thinking?` (opcjonalne; nadpisuje poziom myślenia dla przebiegu subagenta)
- `runTimeoutSeconds?` (domyślnie `agents.defaults.subagents.runTimeoutSeconds`, jeśli ustawiono, w przeciwnym razie `0`; gdy ustawione, przebieg subagenta jest przerywany po N sekundach)
- `thread?` (domyślnie `false`; gdy `true`, żąda powiązania kanałowego z wątkiem dla tej sesji subagenta)
- `mode?` (`run|session`)
  - domyślnie `run`
  - jeśli `thread: true` i pominięto `mode`, domyślna wartość staje się `session`
  - `mode: "session"` wymaga `thread: true`
- `cleanup?` (`delete|keep`, domyślnie `keep`)
- `sandbox?` (`inherit|require`, domyślnie `inherit`; `require` odrzuca uruchomienie, chyba że docelowe środowisko uruchomieniowe dziecka jest w sandboxie)
- `context?` (`isolated|fork`, domyślnie `isolated`; tylko natywne subagenci)
  - `isolated` tworzy czysty transkrypt dziecka i jest wartością domyślną.
  - `fork` rozgałęzia bieżący transkrypt żądającego do sesji dziecka, dzięki czemu dziecko startuje z tym samym kontekstem rozmowy.
  - Używaj `fork` tylko wtedy, gdy dziecko potrzebuje bieżącego transkryptu. Dla pracy o ograniczonym zakresie pomiń `context`.
- `sessions_spawn` **nie** przyjmuje parametrów dostarczania kanałowego (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj `message`/`sessions_send` z uruchomionego przebiegu.

## Sesje powiązane z wątkiem

Gdy powiązania z wątkiem są włączone dla kanału, subagent może pozostać związany z wątkiem, aby kolejne wiadomości użytkownika w tym wątku nadal trafiały do tej samej sesji subagenta.

### Kanały obsługujące wątki

- Discord (obecnie jedyny obsługiwany kanał): obsługuje trwałe sesje subagentów powiązane z wątkiem (`sessions_spawn` z `thread: true`), ręczne sterowanie wątkiem (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) oraz klucze adaptera `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` i `channels.discord.threadBindings.spawnSubagentSessions`.

Szybki przebieg:

1. Uruchom przez `sessions_spawn` z użyciem `thread: true` (i opcjonalnie `mode: "session"`).
2. OpenClaw tworzy lub wiąże wątek z celem tej sesji w aktywnym kanale.
3. Odpowiedzi i kolejne wiadomości w tym wątku trafiają do powiązanej sesji.
4. Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odwiązywanie po bezczynności, oraz `/session max-age`, aby kontrolować twardy limit wieku.
5. Użyj `/unfocus`, aby odłączyć ręcznie.

Sterowanie ręczne:

- `/focus <target>` wiąże bieżący wątek (lub tworzy go) z celem subagenta/sesji.
- `/unfocus` usuwa powiązanie dla aktualnie powiązanego wątku.
- `/agents` wyświetla aktywne przebiegi i stan powiązania (`thread:<id>` lub `unbound`).
- `/session idle` i `/session max-age` działają tylko dla aktywnych powiązanych wątków.

Przełączniki konfiguracji:

- Globalne wartości domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Nadpisanie kanału i klucze automatycznego powiązania przy uruchomieniu są specyficzne dla adaptera. Zobacz **Kanały obsługujące wątki** powyżej.

Zobacz [Dokumentację referencyjną konfiguracji](/pl/gateway/configuration-reference) i [Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać bieżące szczegóły adapterów.

Allowlista:

- `agents.list[].subagents.allowAgents`: lista identyfikatorów agentów, które można wskazać przez `agentId` (`["*"]`, aby zezwolić na dowolny). Domyślnie: tylko agent żądający.
- `agents.defaults.subagents.allowAgents`: domyślna allowlista agentów docelowych używana, gdy agent żądający nie ustawi własnego `subagents.allowAgents`.
- Ochrona dziedziczenia sandboxa: jeśli sesja żądającego jest w sandboxie, `sessions_spawn` odrzuca cele, które działałyby bez sandboxa.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: gdy true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Domyślnie: false.

Wykrywanie:

- Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla `sessions_spawn`.

Autoarchiwizacja:

- Sesje subagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie: 60).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (w tym samym folderze).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (transkrypt nadal jest zachowywany przez zmianę nazwy).
- Autoarchiwizacja działa metodą best-effort; oczekujące timery są tracone, jeśli Gateway zostanie uruchomiony ponownie.
- `runTimeoutSeconds` **nie** autoarchiwizuje; tylko zatrzymuje przebieg. Sesja pozostaje do czasu autoarchiwizacji.
- Autoarchiwizacja stosuje się tak samo do sesji o głębokości 1 i 2.
- Czyszczenie przeglądarki jest oddzielone od czyszczenia archiwizacji: śledzone karty/procesy przeglądarki są zamykane metodą best-effort po zakończeniu przebiegu, nawet jeśli transkrypt/rekord sesji zostaje zachowany.

## Zagnieżdżeni subagenci

Domyślnie subagenci nie mogą uruchamiać własnych subagentów (`maxSpawnDepth: 1`). Możesz włączyć jeden poziom zagnieżdżenia, ustawiając `maxSpawnDepth: 2`, co pozwala na **wzorzec orkiestratora**: main → subagent-orkiestrator → sub-subagenci-workerzy.

### Jak włączyć

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // pozwala subagentom uruchamiać dzieci (domyślnie: 1)
        maxChildrenPerAgent: 5, // maks. liczba aktywnych dzieci na sesję agenta (domyślnie: 5)
        maxConcurrent: 8, // globalny limit współbieżności ścieżki (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny limit czasu dla sessions_spawn, gdy pominięto (0 = brak limitu czasu)
      },
    },
  },
}
```

### Poziomy głębokości

| Depth | Session key shape                            | Role                                          | Can spawn?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Główny agent                                  | Zawsze                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagent (orkiestrator, gdy dozwolona jest głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagent (worker-liść)                    | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki wracają w górę łańcucha:

1. Worker głębokości 2 kończy pracę → ogłasza wynik swojemu rodzicowi (orkiestratorowi głębokości 1)
2. Orkiestrator głębokości 1 otrzymuje ogłoszenie, syntetyzuje wyniki, kończy pracę → ogłasza wynik do main
3. Główny agent otrzymuje ogłoszenie i dostarcza je użytkownikowi

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

Wskazówki operacyjne:

- Uruchamiaj pracę dziecka raz i czekaj na zdarzenia zakończenia zamiast budować pętle odpytywania wokół
  `sessions_list`, `sessions_history`, `/subagents list` lub poleceń `exec` ze `sleep`.
- Jeśli zdarzenie zakończenia dziecka nadejdzie po tym, jak wysłałeś już końcową odpowiedź,
  poprawnym follow-upem jest dokładny cichy token `NO_REPLY` / `no_reply`.

### Polityka narzędzi według głębokości

- Rola i zakres sterowania są zapisywane w metadanych sesji w momencie uruchomienia. Dzięki temu spłaszczone lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`)**: otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`)**: brak narzędzi sesji (obecne zachowanie domyślne).
- **Głębokość 2 (worker-liść)**: brak narzędzi sesji — `sessions_spawn` jest zawsze odrzucane na głębokości 2. Nie może uruchamiać kolejnych dzieci.

### Limit uruchomień per-agent

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie maksymalnie `maxChildrenPerAgent` (domyślnie: 5) aktywnych dzieci. Zapobiega to niekontrolowanemu fan-outowi z jednego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci głębokości 2:

- `/stop` na głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i kaskadowo jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich subagentów dla żądającego i wykonuje zatrzymanie kaskadowe.

## Uwierzytelnianie

Uwierzytelnianie subagenta jest rozwiązywane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji subagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są dołączane jako **fallback**; profile agenta nadpisują profile główne przy konfliktach.

Uwaga: scalenie jest addytywne, więc profile główne są zawsze dostępne jako fallbacki. W pełni izolowane uwierzytelnianie per-agent nie jest jeszcze obsługiwane.

## Ogłoszenie

Subagenci raportują z powrotem przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji subagenta (a nie sesji żądającego).
- Jeśli subagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta to dokładny cichy token `NO_REPLY` / `no_reply`,
  dane wyjściowe ogłoszenia są tłumione, nawet jeśli wcześniej istniał widoczny postęp.
- W przeciwnym razie dostarczanie zależy od głębokości żądającego:
  - sesje żądającego najwyższego poziomu używają follow-upowego wywołania `agent` z zewnętrznym dostarczeniem (`deliver=true`)
  - zagnieżdżone sesje subagenta żądającego otrzymują wewnętrzne wstrzyknięcie follow-up (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w ramach sesji
  - jeśli zagnieżdżona sesja subagenta żądającego zniknęła, OpenClaw wraca do żądającego tej sesji, gdy to możliwe
- Dla sesji żądającego najwyższego poziomu bezpośrednie dostarczanie w trybie zakończenia najpierw rozwiązuje każdą powiązaną trasę rozmowy/wątku i nadpisanie hooka, a następnie uzupełnia brakujące pola kanału-targetu z zapisanej trasy sesji żądającego. Dzięki temu zakończenia trafiają na właściwy czat/temat nawet wtedy, gdy źródło zakończenia identyfikuje tylko kanał.
- Agregacja zakończeń dzieci jest ograniczona do bieżącego przebiegu żądającego podczas budowania zagnieżdżonych ustaleń zakończenia, co zapobiega przeciekaniu starych danych wyjściowych dzieci z poprzednich przebiegów do bieżącego ogłoszenia.
- Odpowiedzi ogłoszeń zachowują routing wątku/tematu, gdy jest dostępny w adapterach kanałów.
- Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzeń:
  - źródło (`subagent` lub `cron`)
  - klucz/id sesji dziecka
  - typ ogłoszenia + etykieta zadania
  - wiersz statusu wyprowadzony z wyniku środowiska uruchomieniowego (`success`, `error`, `timeout` lub `unknown`)
  - treść wyniku wybrana z najnowszego widocznego tekstu asystenta, a w przeciwnym razie z oczyszczonego najnowszego tekstu `tool`/`toolResult`; zakończone błędem przebiegi terminalowe zgłaszają status niepowodzenia bez odtwarzania przechwyconego tekstu odpowiedzi
  - instrukcja follow-upu opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho
- `Status` nie jest wywnioskowany z wyjścia modelu; pochodzi z sygnałów wyniku środowiska uruchomieniowego.
- Przy limicie czasu, jeśli dziecko zdążyło tylko przejść przez wywołania narzędzi, ogłoszenie może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe dane wyjściowe narzędzi.

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet gdy są opakowane):

- Środowisko uruchomieniowe (np. `runtime 5m12s`)
- Zużycie tokenów (wejściowe/wyjściowe/łączne)
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` i ścieżkę transkryptu (aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku)
- Wewnętrzne metadane są przeznaczone wyłącznie do orkiestracji; odpowiedzi widoczne dla użytkownika powinny zostać przepisane normalnym głosem asystenta.

` sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- historia asystenta jest najpierw normalizowana:
  - usuwane są tagi myślenia
  - usuwane są bloki szkieletowe `<relevant-memories>` / `<relevant_memories>`
  - usuwane są bloki ładunków XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, w tym obcięte ładunki,
    które nigdy nie zamykają się poprawnie
  - usuwane są zdegradowane szkielety wywołań/wyników narzędzi i znaczniki kontekstu historycznego
  - usuwane są wyciekłe tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz pełnoszerokie warianty `<｜...｜>`
  - usuwany jest nieprawidłowy XML wywołań narzędzi MiniMax
- tekst podobny do poświadczeń/tokenów jest redagowany
- długie bloki mogą zostać obcięte
- bardzo duże historie mogą odrzucać starsze wiersze lub zastępować zbyt duży wiersz przez
  `[sessions_history omitted: message too large]`
- kontrola surowego transkryptu na dysku jest fallbackiem, gdy potrzebujesz pełnego transkryptu bajt po bajcie

## Polityka narzędzi (narzędzia subagenta)

Domyślnie subagenci otrzymują **wszystkie narzędzia poza narzędziami sesji** i narzędziami systemowymi:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

` sessions_history` także tutaj pozostaje ograniczonym, oczyszczonym widokiem historii; nie jest
surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, subagenci-orkiestratorzy na głębokości 1 dodatkowo otrzymują `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogli zarządzać swoimi dziećmi.

Nadpisanie przez konfigurację:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny ma pierwszeństwo
        deny: ["gateway", "cron"],
        // jeśli ustawiono allow, staje się trybem tylko-allow (deny nadal ma pierwszeństwo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Współbieżność

Subagenci używają dedykowanej ścieżki kolejki w procesie:

- Nazwa ścieżki: `subagent`
- Współbieżność: `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne przebiegi subagentów uruchomione z niej, kaskadowo także zagnieżdżone dzieci.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i kaskadowo jego dzieci.

## Ograniczenia

- Ogłoszenie subagenta działa metodą **best-effort**. Jeśli Gateway zostanie uruchomiony ponownie, oczekująca praca „ogłoszenia z powrotem” zostanie utracona.
- Subagenci nadal współdzielą zasoby tego samego procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst subagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Dla większości zastosowań zalecana jest głębokość 2.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci na sesję (domyślnie: 5, zakres: 1–20).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Narzędzia sandboxa wieloagentowego](/pl/tools/multi-agent-sandbox-tools)
- [Agent send](/pl/tools/agent-send)
