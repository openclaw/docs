---
read_when:
    - Chcesz pracy w tle/równoległej przez agenta
    - Zmieniasz `sessions_spawn` lub politykę narzędzi subagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
summary: 'Subagenci: uruchamianie izolowanych przebiegów agentów, które ogłaszają wyniki z powrotem na czacie żądającym'
title: Subagenci
x-i18n:
    generated_at: "2026-04-05T14:10:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# Subagenci

Subagenci to przebiegi agentów w tle uruchamiane z istniejącego przebiegu agenta. Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i po zakończeniu **ogłaszają** swój wynik z powrotem na kanał czatu żądającego. Każdy przebieg subagenta jest śledzony jako [zadanie w tle](/pl/automation/tasks).

## Polecenie slash

Użyj `/subagents`, aby sprawdzać lub sterować przebiegami subagentów dla **bieżącej sesji**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Sterowanie powiązaniami z wątkiem:

Te polecenia działają na kanałach obsługujących trwałe powiązania z wątkami. Zobacz **Kanały obsługujące wątki** poniżej.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` pokazuje metadane przebiegu (status, znaczniki czasu, identyfikator sesji, ścieżkę transkryptu, cleanup).
Użyj `sessions_history` do ograniczonego widoku przypominania filtrowanego pod kątem bezpieczeństwa; sprawdź
ścieżkę transkryptu na dysku, gdy potrzebujesz surowego pełnego transkryptu.

### Zachowanie spawn

`/subagents spawn` uruchamia subagenta w tle jako polecenie użytkownika, a nie wewnętrzny relay, i wysyła jedną końcową aktualizację o ukończeniu z powrotem na czat żądającego po zakończeniu przebiegu.

- Polecenie spawn jest nieblokujące; natychmiast zwraca identyfikator przebiegu.
- Po ukończeniu subagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem na kanał czatu żądającego.
- Dostarczenie ukończenia jest oparte na push. Po uruchomieniu nie należy odpytywać w pętli `/subagents list`,
  `sessions_list` ani `sessions_history` tylko po to, by czekać na zakończenie; sprawdzaj status wyłącznie na żądanie do debugowania lub interwencji.
- Po ukończeniu OpenClaw w trybie best-effort zamyka śledzone karty/procesy przeglądarki otwarte przez tę sesję subagenta, zanim przepływ cleanup ogłoszenia będzie kontynuowany.
- Dla ręcznych spawn dostarczanie jest odporne:
  - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
  - Jeśli bezpośrednie dostarczenie zawiedzie, wraca do routingu kolejki.
  - Jeśli routing kolejki nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym backoffem przed ostatecznym poddaniem się.
- Dostarczanie ukończenia zachowuje rozwiązaną trasę żądającego:
  - trasy ukończenia powiązane z wątkiem lub konwersacją wygrywają, gdy są dostępne
  - jeśli źródło ukończenia dostarcza tylko kanał, OpenClaw uzupełnia brakujący target/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało
- Przekazanie ukończenia do sesji żądającego jest generowanym w runtime wewnętrznym kontekstem (a nie tekstem tworzonym przez użytkownika) i zawiera:
  - `Result` (najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst `tool`/`toolResult`)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - zwarte statystyki runtime/tokenów
  - instrukcję dostarczenia mówiącą agentowi żądającemu, aby przepisał wynik normalnym głosem asystenta (a nie przekazywał surowych wewnętrznych metadanych)
- `--model` i `--thinking` nadpisują ustawienia domyślne tylko dla tego konkretnego przebiegu.
- Użyj `info`/`log`, aby sprawdzić szczegóły i output po ukończeniu.
- `/subagents spawn` to tryb jednorazowy (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
- Dla sesji harness ACP (Codex, Claude Code, Gemini CLI) użyj `sessions_spawn` z `runtime: "acp"` i zobacz [Agenci ACP](/tools/acp-agents).

Główne cele:

- Zrównoleglić pracę typu „research / długie zadanie / wolne narzędzie” bez blokowania głównego przebiegu.
- Domyślnie utrzymywać izolację subagentów (separacja sesji + opcjonalny sandboxing).
- Utrzymać powierzchnię narzędzi trudną do niewłaściwego użycia: subagenci **nie** dostają domyślnie narzędzi sesji.
- Obsługiwać konfigurowalną głębokość zagnieżdżenia dla wzorców orkiestratorów.

Uwaga o kosztach: każdy subagent ma **własny** kontekst i własne zużycie tokenów. Dla ciężkich lub powtarzalnych
zadań ustaw tańszy model dla subagentów i pozostaw głównego agenta na modelu wyższej jakości.
Można to skonfigurować przez `agents.defaults.subagents.model` albo nadpisania per agent.

## Narzędzie

Użyj `sessions_spawn`:

- Uruchamia przebieg subagenta (`deliver: false`, globalna kolejka: `subagent`)
- Następnie uruchamia krok announce i publikuje odpowiedź announce na kanale czatu żądającego
- Model domyślny: dziedziczy z wywołującego, chyba że ustawisz `agents.defaults.subagents.model` (albo per-agent `agents.list[].subagents.model`); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- Thinking domyślnie: dziedziczy z wywołującego, chyba że ustawisz `agents.defaults.subagents.thinking` (albo per-agent `agents.list[].subagents.thinking`); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- Domyślny timeout przebiegu: jeśli `sessions_spawn.runTimeoutSeconds` jest pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, jeśli ustawione; w przeciwnym razie wraca do `0` (brak timeoutu).

Parametry narzędzia:

- `task` (wymagane)
- `label?` (opcjonalne)
- `agentId?` (opcjonalne; uruchamia pod innym identyfikatorem agenta, jeśli dozwolone)
- `model?` (opcjonalne; nadpisuje model subagenta; nieprawidłowe wartości są pomijane, a subagent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia)
- `thinking?` (opcjonalne; nadpisuje poziom thinking dla przebiegu subagenta)
- `runTimeoutSeconds?` (domyślnie `agents.defaults.subagents.runTimeoutSeconds`, jeśli ustawione, w przeciwnym razie `0`; jeśli ustawione, przebieg subagenta jest przerywany po N sekundach)
- `thread?` (domyślnie `false`; gdy `true`, żąda powiązania sesji subagenta z wątkiem kanału)
- `mode?` (`run|session`)
  - domyślnie `run`
  - jeśli `thread: true` i `mode` pominięto, wartością domyślną staje się `session`
  - `mode: "session"` wymaga `thread: true`
- `cleanup?` (`delete|keep`, domyślnie `keep`)
- `sandbox?` (`inherit|require`, domyślnie `inherit`; `require` odrzuca spawn, jeśli docelowy runtime potomny nie jest sandboxowany)
- `sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj `message`/`sessions_send` z uruchomionego przebiegu.

## Sesje powiązane z wątkiem

Gdy powiązania z wątkami są włączone dla kanału, subagent może pozostać powiązany z wątkiem, dzięki czemu kolejne wiadomości użytkownika w tym wątku nadal są kierowane do tej samej sesji subagenta.

### Kanały obsługujące wątki

- Discord (obecnie jedyny obsługiwany kanał): obsługuje trwałe sesje subagentów powiązane z wątkiem (`sessions_spawn` z `thread: true`), ręczne sterowanie wątkami (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) oraz klucze adaptera `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` i `channels.discord.threadBindings.spawnSubagentSessions`.

Szybki przepływ:

1. Uruchom spawn przez `sessions_spawn`, używając `thread: true` (i opcjonalnie `mode: "session"`).
2. OpenClaw tworzy lub wiąże wątek z tym celem sesji w aktywnym kanale.
3. Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
4. Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne rozwiązywanie fokusu po bezczynności, oraz `/session max-age`, aby sterować twardym limitem.
5. Użyj `/unfocus`, aby odłączyć ręcznie.

Sterowanie ręczne:

- `/focus <target>` wiąże bieżący wątek (lub tworzy go) z celem subagenta/sesji.
- `/unfocus` usuwa powiązanie dla bieżącego powiązanego wątku.
- `/agents` wyświetla aktywne przebiegi i stan powiązania (`thread:<id>` lub `unbound`).
- `/session idle` i `/session max-age` działają tylko dla sfokusowanych powiązanych wątków.

Przełączniki config:

- Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Nadpisania kanału i klucze automatycznego wiązania przy spawn są specyficzne dla adaptera. Zobacz **Kanały obsługujące wątki** powyżej.

Szczegóły bieżących adapterów znajdziesz w [Referencja konfiguracji](/gateway/configuration-reference) i [Polecenia slash](/tools/slash-commands).

Allowlista:

- `agents.list[].subagents.allowAgents`: lista identyfikatorów agentów, które mogą być celem przez `agentId` (`["*"]`, aby zezwolić na dowolny). Domyślnie: tylko agent żądający.
- `agents.defaults.subagents.allowAgents`: domyślna allowlista docelowych agentów używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
- Ochrona dziedziczenia sandboxa: jeśli sesja żądającego jest sandboxowana, `sessions_spawn` odrzuca cele, które działałyby bez sandboxa.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: gdy `true`, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Domyślnie: false.

Discovery:

- Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla `sessions_spawn`.

Autoarchiwizacja:

- Sesje subagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie: 60).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po announce (transkrypt nadal zostaje zachowany przez zmianę nazwy).
- Autoarchiwizacja działa best-effort; oczekujące timery są tracone przy restarcie gateway.
- `runTimeoutSeconds` **nie** powoduje autoarchiwizacji; zatrzymuje tylko przebieg. Sesja pozostaje do autoarchiwizacji.
- Autoarchiwizacja działa tak samo dla sesji głębokości 1 i głębokości 2.
- Cleanup przeglądarki jest oddzielony od cleanupu archiwizacji: śledzone karty/procesy przeglądarki są zamykane best-effort po zakończeniu przebiegu, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżeni subagenci

Domyślnie subagenci nie mogą uruchamiać własnych subagentów (`maxSpawnDepth: 1`). Możesz włączyć jeden poziom zagnieżdżenia przez ustawienie `maxSpawnDepth: 2`, co pozwala na **wzorzec orkiestratora**: main → subagent-orkiestrator → workerzy-subsubagenci.

### Jak włączyć

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // pozwala subagentom uruchamiać dzieci (domyślnie: 1)
        maxChildrenPerAgent: 5, // maks. aktywnych dzieci na sesję agenta (domyślnie: 5)
        maxConcurrent: 8, // globalny limit współbieżności kolejki (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny timeout dla sessions_spawn, gdy pominięty (0 = brak timeoutu)
      },
    },
  },
}
```

### Poziomy głębokości

| Depth | Session key shape                            | Role                                          | Can spawn?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Główny agent                                    | Zawsze                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagent (pracownik-liść)                   | Nigdy                        |

### Łańcuch announce

Wyniki przepływają z powrotem w górę łańcucha:

1. Worker głębokości 2 kończy → ogłasza do rodzica (orkiestratora głębokości 1)
2. Orkiestrator głębokości 1 otrzymuje ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do main
3. Główny agent otrzymuje ogłoszenie i dostarcza je użytkownikowi

Każdy poziom widzi tylko ogłoszenia swoich bezpośrednich dzieci.

Wskazówki operacyjne:

- Uruchamiaj pracę dzieci raz i czekaj na zdarzenia ukończenia zamiast budować pętle odpytywania wokół `sessions_list`, `sessions_history`, `/subagents list` lub poleceń `exec` z `sleep`.
- Jeśli zdarzenie ukończenia dziecka nadejdzie po tym, jak wysłano już końcową odpowiedź, poprawnym kolejnym działaniem jest dokładny cichy token `NO_REPLY` / `no_reply`.

### Polityka narzędzi według głębokości

- Rola i zakres sterowania są zapisywane w metadanych sesji w momencie spawn. Zapobiega to przypadkowemu odzyskaniu uprawnień orkiestratora przez płaskie lub przywrócone klucze sesji.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`)**: dostaje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemu pozostają zablokowane.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`)**: brak narzędzi sesji (obecne domyślne zachowanie).
- **Głębokość 2 (worker-liść)**: brak narzędzi sesji — `sessions_spawn` jest zawsze blokowane na głębokości 2. Nie może uruchamiać dalszych dzieci.

### Limit spawn per agent

Każda sesja agenta (na dowolnej głębokości) może mieć maksymalnie `maxChildrenPerAgent` (domyślnie: 5) aktywnych dzieci jednocześnie. Zapobiega to niekontrolowanemu fan-out z pojedynczego orkiestratora.

### Cascade stop

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci głębokości 2:

- `/stop` na głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i kaskadowo jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich subagentów dla żądającego i działa kaskadowo.

## Uwierzytelnianie

Uwierzytelnianie subagenta jest rozwiązywane według **identyfikatora agenta**, a nie według typu sesji:

- Klucz sesji subagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn auth jest ładowany z `agentDir` tego agenta.
- Profile auth głównego agenta są scalane jako **fallback**; profile agenta mają pierwszeństwo nad profilami głównego agenta przy konfliktach.

Uwaga: scalanie jest addytywne, więc profile głównego agenta są zawsze dostępne jako fallbacki. W pełni izolowane uwierzytelnianie per agent nie jest jeszcze obsługiwane.

## Announce

Subagenci raportują z powrotem przez krok announce:

- Krok announce działa wewnątrz sesji subagenta (a nie sesji żądającego).
- Jeśli subagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta to dokładny cichy token `NO_REPLY` / `no_reply`,
  output announce jest tłumiony, nawet jeśli wcześniej istniał widoczny postęp.
- W przeciwnym razie dostarczenie zależy od głębokości żądającego:
  - sesje żądające najwyższego poziomu używają kolejnego wywołania `agent` z zewnętrznym dostarczeniem (`deliver=true`)
  - zagnieżdżone sesje żądające subagentów otrzymują wewnętrzne wstrzyknięcie follow-up (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci we własnej sesji
  - jeśli zagnieżdżona sesja żądająca subagenta już nie istnieje, OpenClaw wraca awaryjnie do żądającego tej sesji, gdy to możliwe
- Dla sesji żądających najwyższego poziomu bezpośrednie dostarczenie w trybie completion najpierw rozwiązuje powiązaną trasę konwersacji/wątku i nadpisanie hooka, a następnie uzupełnia brakujące pola channel-target z zapisanej trasy sesji żądającego. Dzięki temu ukończenia trafiają na właściwy czat/temat, nawet gdy źródło ukończenia identyfikuje tylko kanał.
- Agregacja ukończeń dzieci jest ograniczona do bieżącego przebiegu żądającego przy budowaniu zagnieżdżonych wyników ukończenia, co zapobiega wyciekaniu starych outputów dzieci z poprzednich przebiegów do bieżącego announce.
- Odpowiedzi announce zachowują routing wątku/tematu, gdy jest dostępny w adapterach kanałów.
- Kontekst announce jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:
  - źródło (`subagent` lub `cron`)
  - klucz/id sesji dziecka
  - typ announce + etykieta zadania
  - linia statusu wyprowadzona z wyniku runtime (`success`, `error`, `timeout` lub `unknown`)
  - treść wyniku wybrana z najnowszego widocznego tekstu asystenta, w przeciwnym razie oczyszczonego najnowszego tekstu `tool`/`toolResult`
  - instrukcja follow-up opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho
- `Status` nie jest wywnioskowywany z outputu modelu; pochodzi z sygnałów wyniku runtime.
- Przy timeout, jeśli dziecko przeszło tylko przez wywołania narzędzi, announce może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowy output narzędzi.

Payloady announce zawierają na końcu linię statystyk (nawet gdy są opakowane):

- Runtime (np. `runtime 5m12s`)
- Zużycie tokenów (input/output/total)
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` i ścieżkę transkryptu (aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku)
- Wewnętrzne metadane są przeznaczone wyłącznie do orkiestracji; odpowiedzi widoczne dla użytkownika powinny zostać przepisane normalnym głosem asystenta.

` sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- przypominanie asystenta jest najpierw normalizowane:
  - usuwane są tagi thinking
  - usuwane są bloki szkieletowe `<relevant-memories>` / `<relevant_memories>`
  - usuwane są bloki payloadów XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, w tym przycięte
    payloady, które nigdy nie zamknęły się poprawnie
  - usuwane są zdegradowane szkielety wywołań/wyników narzędzi i znaczniki kontekstu historycznego
  - usuwane są wyciekłe tokeny sterujące modelem, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz warianty full-width `<｜...｜>`
  - usuwany jest błędny XML wywołań narzędzi MiniMax
- tekst przypominający poświadczenia/tokeny jest redagowany
- długie bloki mogą być przycinane
- bardzo duże historie mogą usuwać starsze wiersze albo zastępować zbyt duży wiersz
  tekstem `[sessions_history omitted: message too large]`
- sprawdzanie surowego transkryptu na dysku jest fallbackiem, gdy potrzebujesz pełnego transkryptu byte-for-byte

## Polityka narzędzi (narzędzia subagenta)

Domyślnie subagenci dostają **wszystkie narzędzia poza narzędziami sesji** i narzędziami systemowymi:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

` sessions_history` pozostaje tutaj również ograniczonym, oczyszczonym widokiem przypominania; nie
jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, subagenci-orkiestratorzy głębokości 1 otrzymują dodatkowo `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogli zarządzać swoimi dziećmi.

Nadpisanie przez config:

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
        // jeśli ustawiono allow, staje się trybem tylko-allow (deny nadal wygrywa)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Współbieżność

Subagenci używają dedykowanej kolejki wewnątrz procesu:

- Nazwa kolejki: `subagent`
- Współbieżność: `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne przebiegi subagentów uruchomione z niej, działając kaskadowo na zagnieżdżone dzieci.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i działa kaskadowo na jego dzieci.

## Ograniczenia

- Announce subagenta działa **best-effort**. Jeśli gateway zostanie zrestartowany, oczekująca praca „announce back” zostanie utracona.
- Subagenci nadal współdzielą zasoby tego samego procesu gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst subagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia to 5 (`maxSpawnDepth` w zakresie: 1–5). Dla większości przypadków użycia zalecana jest głębokość 2.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci na sesję (domyślnie: 5, zakres: 1–20).
