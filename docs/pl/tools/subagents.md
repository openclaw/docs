---
read_when:
    - Chcesz wykonywać pracę w tle/równolegle przez agenta
    - Zmieniasz `sessions_spawn` lub zasady narzędzia sub-agenta
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
summary: 'Sub-agenci: uruchamianie odizolowanych przebiegów agentów, które ogłaszają wyniki z powrotem na czacie żądającym'
title: Sub-agenci
x-i18n:
    generated_at: "2026-04-22T04:29:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Sub-agenci

Sub-agenci to przebiegi agentów w tle uruchamiane z istniejącego przebiegu agenta. Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i po zakończeniu **ogłaszają** swój wynik z powrotem na kanale czatu żądającego. Każdy przebieg sub-agenta jest śledzony jako [zadanie w tle](/pl/automation/tasks).

## Polecenie slash

Użyj `/subagents`, aby sprawdzać lub sterować przebiegami sub-agentów dla **bieżącej sesji**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Kontrolki powiązań wątków:

Te polecenia działają w kanałach obsługujących trwałe powiązania wątków. Zobacz **Kanały obsługujące wątki** poniżej.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` pokazuje metadane przebiegu (status, znaczniki czasu, id sesji, ścieżkę transkryptu, cleanup).
Użyj `sessions_history`, aby uzyskać ograniczony, filtrowany pod kątem bezpieczeństwa widok przypomnienia; sprawdzaj
ścieżkę transkryptu na dysku, gdy potrzebujesz surowego pełnego transkryptu.

### Zachowanie uruchamiania

`/subagents spawn` uruchamia sub-agenta w tle jako polecenie użytkownika, a nie wewnętrzny relay, i wysyła jedną końcową aktualizację ukończenia z powrotem na czat żądającego po zakończeniu przebiegu.

- Polecenie spawn jest nieblokujące; natychmiast zwraca identyfikator przebiegu.
- Po zakończeniu sub-agent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem na kanale czatu żądającego.
- Dostarczenie ukończenia jest oparte na push. Po uruchomieniu nie odpytywać w pętli `/subagents list`,
  `sessions_list` ani `sessions_history` tylko po to, aby czekać na
  zakończenie; sprawdzaj status tylko na żądanie, do debugowania lub interwencji.
- Po zakończeniu OpenClaw w trybie best-effort zamyka śledzone karty/przetwarzania przeglądarki otwarte przez tę sesję sub-agenta, zanim przepływ cleanup po ogłoszeniu będzie kontynuowany.
- Dla ręcznych uruchomień dostarczenie jest odporne:
  - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
  - Jeśli bezpośrednie dostarczenie się nie powiedzie, wraca zapasowo do routingu kolejki.
  - Jeśli routing kolejki nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym backoffem przed ostatecznym poddaniem.
- Dostarczenie ukończenia zachowuje rozstrzygniętą trasę żądającego:
  - trasy ukończenia powiązane z wątkiem lub konwersacją mają pierwszeństwo, gdy są dostępne
  - jeśli źródło ukończenia podaje tylko kanał, OpenClaw uzupełnia brakujący target/account z rozstrzygniętej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało
- Przekazanie ukończenia do sesji żądającego to wewnętrzny kontekst generowany w runtime (nie tekst napisany przez użytkownika) i zawiera:
  - `Result` (najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst `tool`/`toolResult`; przebiegi zakończone niepowodzeniem nie używają ponownie przechwyconego tekstu odpowiedzi)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompaktowe statystyki runtime/tokenów
  - instrukcję dostarczenia mówiącą agentowi żądającemu, aby przepisał wynik zwykłym głosem asystenta (a nie przekazywał surowych wewnętrznych metadanych)
- `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego przebiegu.
- Użyj `info`/`log`, aby sprawdzić szczegóły i wynik po zakończeniu.
- `/subagents spawn` działa w trybie jednorazowym (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
- Dla sesji harness ACP (Codex, Claude Code, Gemini CLI) użyj `sessions_spawn` z `runtime: "acp"` i zobacz [Agenci ACP](/pl/tools/acp-agents), szczególnie [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń lub pętli agent-agent.

Główne cele:

- Równoleglenie pracy typu „research / długie zadanie / wolne narzędzie” bez blokowania głównego przebiegu.
- Domyślna izolacja sub-agentów (separacja sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: sub-agenci **nie** otrzymują domyślnie narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestratora.

Uwaga kosztowa: każdy sub-agent ma **własny** kontekst i zużycie tokenów. Dla ciężkich lub powtarzalnych
zadań ustaw tańszy model dla sub-agentów i pozostaw głównego agenta na modelu wyższej jakości.
Możesz to skonfigurować przez `agents.defaults.subagents.model` albo nadpisania per agent.

## Narzędzie

Użyj `sessions_spawn`:

- Uruchamia przebieg sub-agenta (`deliver: false`, globalny lane: `subagent`)
- Następnie uruchamia krok ogłoszenia i publikuje odpowiedź ogłoszenia na kanale czatu żądającego
- Model domyślny: dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (lub per-agent `agents.list[].subagents.model`); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- Domyślny thinking: dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (lub per-agent `agents.list[].subagents.thinking`); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- Domyślny timeout przebiegu: jeśli pominięto `sessions_spawn.runTimeoutSeconds`, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (brak timeoutu).

Parametry narzędzia:

- `task` (wymagane)
- `label?` (opcjonalne)
- `agentId?` (opcjonalne; uruchomienie pod innym identyfikatorem agenta, jeśli dozwolone)
- `model?` (opcjonalne; nadpisuje model sub-agenta; nieprawidłowe wartości są pomijane, a sub-agent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia)
- `thinking?` (opcjonalne; nadpisuje poziom thinking dla przebiegu sub-agenta)
- `runTimeoutSeconds?` (domyślnie `agents.defaults.subagents.runTimeoutSeconds`, gdy ustawione, w przeciwnym razie `0`; po ustawieniu przebieg sub-agenta jest przerywany po N sekundach)
- `thread?` (domyślnie `false`; gdy `true`, żąda powiązania wątku kanału z tą sesją sub-agenta)
- `mode?` (`run|session`)
  - domyślnie jest `run`
  - jeśli `thread: true`, a `mode` pominięto, wartość domyślna staje się `session`
  - `mode: "session"` wymaga `thread: true`
- `cleanup?` (`delete|keep`, domyślnie `keep`)
- `sandbox?` (`inherit|require`, domyślnie `inherit`; `require` odrzuca uruchomienie, chyba że docelowy runtime potomny jest w sandboxie)
- `sessions_spawn` **nie** akceptuje parametrów dostarczania kanału (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania używaj `message`/`sessions_send` z uruchomionego przebiegu.

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, sub-agent może pozostać powiązany z wątkiem, tak aby kolejne wiadomości użytkownika w tym wątku nadal były kierowane do tej samej sesji sub-agenta.

### Kanały obsługujące wątki

- Discord (obecnie jedyny obsługiwany kanał): obsługuje trwałe sesje subagentów powiązane z wątkiem (`sessions_spawn` z `thread: true`), ręczne kontrolki wątku (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) oraz klucze adaptera `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` i `channels.discord.threadBindings.spawnSubagentSessions`.

Szybki przepływ:

1. Uruchom przez `sessions_spawn` z użyciem `thread: true` (i opcjonalnie `mode: "session"`).
2. OpenClaw tworzy wątek albo wiąże go z celem tej sesji w aktywnym kanale.
3. Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
4. Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odwiązywanie po bezczynności, a `/session max-age`, aby kontrolować twardy limit.
5. Użyj `/unfocus`, aby odłączyć ręcznie.

Kontrolki ręczne:

- `/focus <target>` wiąże bieżący wątek (lub tworzy go) z celem sub-agenta/sesji.
- `/unfocus` usuwa powiązanie dla bieżącego powiązanego wątku.
- `/agents` pokazuje aktywne przebiegi i stan powiązania (`thread:<id>` lub `unbound`).
- `/session idle` i `/session max-age` działają tylko dla powiązanych wątków w focusie.

Przełączniki config:

- Globalne wartości domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Nadpisania per kanał i klucze automatycznego powiązania przy uruchomieniu są specyficzne dla adaptera. Zobacz **Kanały obsługujące wątki** powyżej.

Zobacz [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference) i [Polecenia slash](/pl/tools/slash-commands), aby poznać bieżące szczegóły adapterów.

Lista dozwolonych:

- `agents.list[].subagents.allowAgents`: lista identyfikatorów agentów, które mogą być wskazywane przez `agentId` (`["*"]`, aby zezwolić na dowolny). Domyślnie: tylko agent żądający.
- `agents.defaults.subagents.allowAgents`: domyślna lista dozwolonych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
- Straż dziedziczenia sandboxa: jeśli sesja żądającego działa w sandboxie, `sessions_spawn` odrzuca cele, które działałyby bez sandboxa.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: gdy true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Domyślnie: false.

Wykrywanie:

- Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla `sessions_spawn`.

Automatyczne archiwizowanie:

- Sesje sub-agentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie: 60).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Autoarchiwizacja działa w trybie best-effort; oczekujące timery są tracone, jeśli gateway się zrestartuje.
- `runTimeoutSeconds` **nie** autoarchiwizuje; zatrzymuje tylko przebieg. Sesja pozostaje do czasu autoarchiwizacji.
- Autoarchiwizacja dotyczy jednakowo sesji głębokości 1 i 2.
- Czyszczenie przeglądarki jest oddzielne od cleanup archiwizacji: śledzone karty/procesy przeglądarki są zamykane w trybie best-effort po zakończeniu przebiegu, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżeni sub-agenci

Domyślnie sub-agenci nie mogą uruchamiać własnych sub-agentów (`maxSpawnDepth: 1`). Możesz włączyć jeden poziom zagnieżdżenia, ustawiając `maxSpawnDepth: 2`, co pozwala na **wzorzec orkiestratora**: główny → sub-agent orkiestrator → podrzędni sub-sub-agenci.

### Jak włączyć

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // pozwól sub-agentom uruchamiać potomków (domyślnie: 1)
        maxChildrenPerAgent: 5, // maks. liczba aktywnych potomków na sesję agenta (domyślnie: 5)
        maxConcurrent: 8, // globalny limit współbieżności lane (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny timeout dla sessions_spawn po pominięciu (0 = brak timeoutu)
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Kształt klucza sesji                         | Rola                                          | Może uruchamiać?              |
| ----- | -------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                            | Główny agent                                  | Zawsze                        |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (końcowy worker)                | Nigdy                         |

### Łańcuch ogłoszeń

Wyniki płyną z powrotem w górę łańcucha:

1. Worker głębokości 2 kończy → ogłasza do swojego rodzica (orkiestratora głębokości 1)
2. Orkiestrator głębokości 1 otrzymuje ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do głównego
3. Główny agent otrzymuje ogłoszenie i dostarcza je użytkownikowi

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich potomków.

Wskazówki operacyjne:

- Uruchamiaj pracę potomną raz i czekaj na zdarzenia ukończenia zamiast budować pętle
  odpytywania wokół `sessions_list`, `sessions_history`, `/subagents list` albo
  poleceń `exec sleep`.
- Jeśli zdarzenie ukończenia potomka przyjdzie po tym, jak już wysłano odpowiedź końcową,
  poprawną reakcją uzupełniającą jest dokładnie cichy token `NO_REPLY` / `no_reply`.

### Zasady narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie uruchomienia. Dzięki temu spłaszczone lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`)**: Otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi potomkami. Inne narzędzia sesji/systemowe pozostają zablokowane.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`)**: Brak narzędzi sesji (obecne domyślne zachowanie).
- **Głębokość 2 (worker liściowy)**: Brak narzędzi sesji — `sessions_spawn` jest zawsze blokowane na głębokości 2. Nie może uruchamiać kolejnych potomków.

### Limit uruchomień per agent

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie co najwyżej `maxChildrenPerAgent` (domyślnie: 5) aktywnych potomków. Zapobiega to niekontrolowanemu rozgałęzianiu przez pojedynczego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkich jego potomków głębokości 2:

- `/stop` na głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich potomków głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego sub-agenta i kaskadowo jego potomków.
- `/subagents kill all` zatrzymuje wszystkich sub-agentów dla żądającego i wykonuje zatrzymanie kaskadowe.

## Uwierzytelnianie

Auth sub-agentów jest rozstrzygane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji sub-agenta to `agent:<agentId>:subagent:<uuid>`.
- Store auth jest ładowany z `agentDir` tego agenta.
- Profile auth głównego agenta są dołączane jako **fallback**; profile agenta nadpisują profile główne przy konfliktach.

Uwaga: scalenie jest addytywne, więc profile główne są zawsze dostępne jako fallback. W pełni izolowane auth per agent nie jest jeszcze obsługiwane.

## Ogłoszenie

Sub-agenci raportują z powrotem przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji sub-agenta (nie sesji żądającego).
- Jeśli sub-agent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta to dokładny cichy token `NO_REPLY` / `no_reply`,
  wynik ogłoszenia jest tłumiony, nawet jeśli wcześniej istniał widoczny postęp.
- W przeciwnym razie dostarczenie zależy od głębokości żądającego:
  - sesje żądającego najwyższego poziomu używają kolejnego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`)
  - zagnieżdżone sesje subagenta żądającego otrzymują wewnętrzne wstrzyknięcie kolejnego kroku (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki potomków wewnątrz sesji
  - jeśli zagnieżdżona sesja subagenta żądającego już nie istnieje, OpenClaw wraca zapasowo do żądającego tej sesji, gdy to możliwe
- Dla sesji żądającego najwyższego poziomu bezpośrednie dostarczenie w trybie ukończenia najpierw rozstrzyga każdą powiązaną trasę konwersacji/wątku i nadpisanie hooka, a następnie uzupełnia brakujące pola channel-target ze zapisanej trasy sesji żądającego. Dzięki temu ukończenia trafiają na właściwy czat/temat, nawet gdy źródło ukończenia identyfikuje tylko kanał.
- Agregacja ukończeń potomków jest ograniczona do bieżącego przebiegu żądającego podczas budowania zagnieżdżonych wyników ukończenia, co zapobiega wyciekom przestarzałych wyników potomków z poprzednich przebiegów do bieżącego ogłoszenia.
- Odpowiedzi ogłoszeń zachowują routing wątków/tematów, gdy adaptery kanałów to obsługują.
- Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:
  - źródło (`subagent` lub `cron`)
  - klucz/id sesji potomnej
  - typ ogłoszenia + etykieta zadania
  - wiersz statusu pochodzący z wyniku runtime (`success`, `error`, `timeout` lub `unknown`)
  - treść wyniku wybrana z najnowszego widocznego tekstu asystenta, w przeciwnym razie oczyszczony najnowszy tekst `tool`/`toolResult`; przebiegi zakończone niepowodzeniem raportują status niepowodzenia bez odtwarzania przechwyconego tekstu odpowiedzi
  - instrukcja dalszego działania opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho
- `Status` nie jest wywnioskowany z wyniku modelu; pochodzi z sygnałów wyniku runtime.
- W przypadku timeoutu, jeśli przebieg potomny przeszedł tylko przez wywołania narzędzi, ogłoszenie może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowy wynik narzędzi.

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet po opakowaniu):

- Runtime (np. `runtime 5m12s`)
- Zużycie tokenów (input/output/total)
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` i ścieżkę transkryptu (aby główny agent mógł pobrać historię przez `sessions_history` albo sprawdzić plik na dysku)
- Wewnętrzne metadane są przeznaczone wyłącznie do orkiestracji; odpowiedzi dla użytkownika powinny być przepisywane zwykłym głosem asystenta.

`sessions_history` to bezpieczniejsza ścieżka orkiestracji:

- przypomnienie asystenta jest najpierw normalizowane:
  - tagi thinking są usuwane
  - bloki rusztowania `<relevant-memories>` / `<relevant_memories>` są usuwane
  - zwykłe tekstowe bloki XML ładunków wywołań narzędzi, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` i
    `<function_calls>...</function_calls>`, są usuwane, w tym obcięte
    ładunki, które nigdy nie zamykają się poprawnie
  - obniżone do tekstu rusztowanie wywołań/wyników narzędzi i znaczniki kontekstu historycznego są usuwane
  - wyciekłe tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz pełnoszerokie warianty `<｜...｜>`, są usuwane
  - uszkodzony XML wywołań narzędzi MiniMax jest usuwany
- tekst podobny do poświadczeń/tokenów jest redagowany
- długie bloki mogą być obcinane
- bardzo duże historie mogą odrzucać starsze wiersze albo zastępować zbyt duży wiersz przez
  `[sessions_history omitted: message too large]`
- sprawdzanie surowego transkryptu na dysku to fallback, gdy potrzebujesz pełnego transkryptu bajt po bajcie

## Zasady narzędzi (narzędzia sub-agenta)

Domyślnie sub-agenci otrzymują **wszystkie narzędzia poza narzędziami sesji** i narzędziami systemowymi:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` pozostaje tu również ograniczonym, oczyszczonym widokiem przypomnienia; nie jest
to surowy zrzut transkryptu.

Gdy `maxSpawnDepth >= 2`, sub-agenci-orkiestratorzy głębokości 1 dodatkowo otrzymują `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogli zarządzać swoimi potomkami.

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
        // jeśli ustawiono allow, staje się listą wyłącznie dozwolonych (deny nadal wygrywa)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Współbieżność

Sub-agenci używają dedykowanego lane kolejki w procesie:

- Nazwa lane: `subagent`
- Współbieżność: `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne przebiegi sub-agentów uruchomione z niej, kaskadowo także potomków zagnieżdżonych.
- `/subagents kill <id>` zatrzymuje konkretnego sub-agenta i kaskadowo jego potomków.

## Ograniczenia

- Ogłoszenie sub-agenta działa w trybie **best-effort**. Jeśli gateway się zrestartuje, oczekująca praca „ogłoszenia z powrotem” zostaje utracona.
- Sub-agenci nadal współdzielą zasoby tego samego procesu gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst sub-agenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia to 5 (`maxSpawnDepth` zakres: 1–5). Głębokość 2 jest zalecana dla większości zastosowań.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych potomków per sesja (domyślnie: 5, zakres: 1–20).
