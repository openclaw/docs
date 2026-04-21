---
read_when:
    - Chcesz wykonywać pracę w tle/równolegle za pomocą agenta
    - Zmieniasz zasady `sessions_spawn` lub narzędzia podagenta
    - Implementujesz lub rozwiązujesz problemy z sesjami podagentów powiązanymi z wątkiem
summary: 'Podagenci: uruchamianie izolowanych przebiegów agentów, które ogłaszają wyniki z powrotem na czacie żądającego'
title: Podagenci
x-i18n:
    generated_at: "2026-04-21T19:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# Podagenci

Podagenci to uruchamiane w tle przebiegi agentów tworzone z istniejącego przebiegu agenta. Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i po zakończeniu **ogłaszają** swój wynik z powrotem na kanale czatu żądającego. Każdy przebieg podagenta jest śledzony jako [zadanie w tle](/pl/automation/tasks).

## Polecenie ukośnikowe

Użyj `/subagents`, aby sprawdzić lub kontrolować przebiegi podagentów dla **bieżącej sesji**:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Elementy sterujące powiązaniem z wątkiem:

Te polecenia działają na kanałach, które obsługują trwałe powiązania z wątkami. Zobacz **Kanały obsługujące wątki** poniżej.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` pokazuje metadane przebiegu (stan, znaczniki czasu, identyfikator sesji, ścieżkę transkryptu, czyszczenie).
Użyj `sessions_history`, aby uzyskać ograniczony widok historii z filtrowaniem bezpieczeństwa; sprawdź
ścieżkę transkryptu na dysku, gdy potrzebujesz surowego pełnego transkryptu.

### Zachowanie uruchamiania

`/subagents spawn` uruchamia podagenta w tle jako polecenie użytkownika, a nie wewnętrzne przekazanie, i wysyła jedną końcową aktualizację ukończenia z powrotem na czat żądającego, gdy przebieg się zakończy.

- Polecenie uruchamiania nie blokuje; natychmiast zwraca identyfikator przebiegu.
- Po zakończeniu podagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem na kanale czatu żądającego.
- Dostarczenie ukończenia odbywa się w trybie push. Po uruchomieniu nie wykonuj zapętlonego odpytywania `/subagents list`,
  `sessions_list` ani `sessions_history` tylko po to, aby czekać na zakończenie;
  sprawdzaj stan wyłącznie na żądanie do debugowania lub interwencji.
- Po zakończeniu OpenClaw w miarę możliwości zamyka śledzone karty/pr procesy przeglądarki otwarte przez sesję tego podagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.
- Dla ręcznych uruchomień dostarczanie jest odporne:
  - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
  - Jeśli bezpośrednie dostarczenie się nie powiedzie, przechodzi do routingu przez kolejkę.
  - Jeśli routing przez kolejkę nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym wycofaniem przed ostateczną rezygnacją.
- Dostarczenie ukończenia zachowuje rozwiązaną trasę żądającego:
  - trasy ukończenia powiązane z wątkiem lub rozmową mają pierwszeństwo, gdy są dostępne
  - jeśli źródło ukończenia udostępnia tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało
- Przekazanie ukończenia do sesji żądającego to wewnętrzny kontekst generowany w czasie działania (nie tekst napisany przez użytkownika) i obejmuje:
  - `Result` (ostatni widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony ostatni tekst `tool`/`toolResult`; zakończone niepowodzeniem przebiegi terminalne nie używają ponownie przechwyconego tekstu odpowiedzi)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - zwięzłe statystyki środowiska wykonawczego/tokenów
  - instrukcję dostarczenia mówiącą agentowi żądającemu, aby przepisał to zwykłym głosem asystenta (a nie przekazywał surowych wewnętrznych metadanych)
- `--model` i `--thinking` zastępują ustawienia domyślne dla tego konkretnego przebiegu.
- Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po zakończeniu.
- `/subagents spawn` działa w trybie jednorazowym (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
- W przypadku sesji uprzęży ACP (Codex, Claude Code, Gemini CLI) użyj `sessions_spawn` z `runtime: "acp"` i zobacz [Agenci ACP](/pl/tools/acp-agents).

Główne cele:

- Równoleglenie pracy typu „research / długie zadanie / wolne narzędzie” bez blokowania głównego przebiegu.
- Domyślna izolacja podagentów (rozdzielenie sesji + opcjonalny sandbox).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: podagenci domyślnie **nie** dostają narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestracji.

Uwaga o kosztach: każdy podagent ma **własny** kontekst i własne zużycie tokenów. W przypadku ciężkich lub powtarzalnych
zadań ustaw tańszy model dla podagentów, a głównego agenta pozostaw na modelu wyższej jakości.
Możesz to skonfigurować przez `agents.defaults.subagents.model` lub nadpisania dla konkretnego agenta.

## Narzędzie

Użyj `sessions_spawn`:

- Uruchamia przebieg podagenta (`deliver: false`, globalna ścieżka: `subagent`)
- Następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia na kanale czatu żądającego
- Model domyślny: dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla konkretnego agenta); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- Domyślny poziom myślenia: dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla konkretnego agenta); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- Domyślny limit czasu przebiegu: jeśli pominięto `sessions_spawn.runTimeoutSeconds`, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, jeśli jest ustawione; w przeciwnym razie wraca do `0` (bez limitu czasu).

Parametry narzędzia:

- `task` (wymagane)
- `label?` (opcjonalne)
- `agentId?` (opcjonalne; uruchom pod innym identyfikatorem agenta, jeśli jest to dozwolone)
- `model?` (opcjonalne; zastępuje model podagenta; nieprawidłowe wartości są pomijane, a podagent uruchamia się na modelu domyślnym z ostrzeżeniem w wyniku narzędzia)
- `thinking?` (opcjonalne; zastępuje poziom myślenia dla przebiegu podagenta)
- `runTimeoutSeconds?` (domyślnie `agents.defaults.subagents.runTimeoutSeconds`, jeśli ustawione, w przeciwnym razie `0`; gdy ustawione, przebieg podagenta jest przerywany po N sekundach)
- `thread?` (domyślnie `false`; gdy `true`, żąda powiązania z wątkiem kanału dla sesji tego podagenta)
- `mode?` (`run|session`)
  - domyślnie jest `run`
  - jeśli `thread: true` i pominięto `mode`, domyślną wartością staje się `session`
  - `mode: "session"` wymaga `thread: true`
- `cleanup?` (`delete|keep`, domyślnie `keep`)
- `sandbox?` (`inherit|require`, domyślnie `inherit`; `require` odrzuca uruchomienie, jeśli docelowe środowisko potomne nie jest sandboxowane)
- `sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj `message`/`sessions_send` z uruchomionego przebiegu.

## Sesje powiązane z wątkiem

Gdy powiązania z wątkami są włączone dla kanału, podagent może pozostać powiązany z wątkiem, tak aby kolejne wiadomości użytkownika w tym wątku nadal trafiały do tej samej sesji podagenta.

### Kanały obsługujące wątki

- Discord (obecnie jedyny obsługiwany kanał): obsługuje trwałe sesje podagentów powiązane z wątkami (`sessions_spawn` z `thread: true`), ręczne sterowanie wątkami (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) oraz klucze adaptera `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` i `channels.discord.threadBindings.spawnSubagentSessions`.

Szybki przepływ:

1. Uruchom za pomocą `sessions_spawn`, używając `thread: true` (i opcjonalnie `mode: "session"`).
2. OpenClaw tworzy wątek lub wiąże go z celem tej sesji w aktywnym kanale.
3. Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
4. Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odpinanie po bezczynności, oraz `/session max-age`, aby sterować twardym limitem.
5. Użyj `/unfocus`, aby odłączyć ręcznie.

Sterowanie ręczne:

- `/focus <target>` wiąże bieżący wątek (lub tworzy nowy) z celem podagenta/sesji.
- `/unfocus` usuwa powiązanie dla bieżącego powiązanego wątku.
- `/agents` wyświetla aktywne przebiegi i stan powiązania (`thread:<id>` lub `unbound`).
- `/session idle` i `/session max-age` działają tylko dla skupionych powiązanych wątków.

Przełączniki konfiguracji:

- Globalne ustawienia domyślne: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Nadpisanie kanału i klucze automatycznego wiązania przy uruchamianiu są specyficzne dla adaptera. Zobacz **Kanały obsługujące wątki** powyżej.

Zobacz [Configuration Reference](/pl/gateway/configuration-reference) i [Slash commands](/pl/tools/slash-commands), aby sprawdzić bieżące szczegóły adapterów.

Lista dozwolonych:

- `agents.list[].subagents.allowAgents`: lista identyfikatorów agentów, które mogą być wskazywane przez `agentId` (`["*"]`, aby zezwolić na dowolny). Domyślnie: tylko agent żądający.
- `agents.defaults.subagents.allowAgents`: domyślna lista dozwolonych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
- Ochrona dziedziczenia sandboxa: jeśli sesja żądającego jest sandboxowana, `sessions_spawn` odrzuca cele, które działałyby bez sandboxa.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: gdy ustawione na true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Domyślnie: false.

Odkrywanie:

- Użyj `agents_list`, aby sprawdzić, które identyfikatory agentów są obecnie dozwolone dla `sessions_spawn`.

Automatyczna archiwizacja:

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie: 60).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (w tym samym folderze).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (transkrypt jest nadal zachowany przez zmianę nazwy).
- Automatyczna archiwizacja działa w trybie best-effort; oczekujące timery są tracone, jeśli Gateway zostanie ponownie uruchomiony.
- `runTimeoutSeconds` **nie** powoduje automatycznej archiwizacji; tylko zatrzymuje przebieg. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy w równym stopniu sesji poziomu 1 i poziomu 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwizacji: śledzone karty/procesy przeglądarki są zamykane w trybie best-effort po zakończeniu przebiegu, nawet jeśli zapis transkryptu/sesji zostaje zachowany.

## Zagnieżdżeni podagenci

Domyślnie podagenci nie mogą uruchamiać własnych podagentów (`maxSpawnDepth: 1`). Możesz włączyć jeden poziom zagnieżdżenia, ustawiając `maxSpawnDepth: 2`, co pozwala na **wzorzec orkiestratora**: główny → podagent orkiestrator → pod-podagenci roboczy.

### Jak włączyć

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // pozwól podagentom uruchamiać potomków (domyślnie: 1)
        maxChildrenPerAgent: 5, // maks. liczba aktywnych potomków na sesję agenta (domyślnie: 5)
        maxConcurrent: 8, // globalny limit współbieżności ścieżki (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny limit czasu dla sessions_spawn, gdy pominięto (0 = bez limitu czasu)
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Kształt klucza sesji                         | Rola                                          | Może uruchamiać?             |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Główny agent                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Pod-podagent (liściowy worker)                | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki wracają w górę łańcucha:

1. Worker głębokości 2 kończy → ogłasza swojemu rodzicowi (orkiestratorowi głębokości 1)
2. Orkiestrator głębokości 1 otrzymuje ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do głównego
3. Główny agent otrzymuje ogłoszenie i dostarcza je użytkownikowi

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich potomków.

Wskazówki operacyjne:

- Uruchamiaj pracę potomną jeden raz i czekaj na zdarzenia ukończenia, zamiast budować pętle
  odpytywania wokół `sessions_list`, `sessions_history`, `/subagents list` lub
  poleceń `exec` z `sleep`.
- Jeśli zdarzenie ukończenia potomka nadejdzie po tym, jak wysłano już odpowiedź końcową,
  poprawną odpowiedzią uzupełniającą jest dokładnie cichy token `NO_REPLY` / `no_reply`.

### Zasady narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie uruchomienia. Dzięki temu spłaszczone lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Poziom 1 (orkiestrator, gdy `maxSpawnDepth >= 2`)**: Otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi potomkami. Inne narzędzia sesji/systemowe pozostają zablokowane.
- **Poziom 1 (liść, gdy `maxSpawnDepth == 1`)**: Brak narzędzi sesji (obecne domyślne zachowanie).
- **Poziom 2 (worker liściowy)**: Brak narzędzi sesji — `sessions_spawn` jest zawsze blokowane na poziomie 2. Nie może uruchamiać kolejnych potomków.

### Limit uruchomień na agenta

Każda sesja agenta (na dowolnym poziomie) może mieć jednocześnie najwyżej `maxChildrenPerAgent` (domyślnie: 5) aktywnych potomków. Zapobiega to niekontrolowanemu rozgałęzianiu z pojedynczego orkiestratora.

### Kaskadowe zatrzymywanie

Zatrzymanie orkiestratora poziomu 1 automatycznie zatrzymuje wszystkie jego potomki poziomu 2:

- `/stop` na głównym czacie zatrzymuje wszystkich agentów poziomu 1 i kaskadowo ich potomków poziomu 2.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo jego potomków.
- `/subagents kill all` zatrzymuje wszystkich podagentów dla żądającego i działa kaskadowo.

## Uwierzytelnianie

Uwierzytelnianie podagenta jest rozwiązywane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji podagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **fallback**; profile agenta mają pierwszeństwo w przypadku konfliktów.

Uwaga: scalanie jest addytywne, więc profile główne są zawsze dostępne jako fallbacki. W pełni izolowane uwierzytelnianie per agent nie jest jeszcze obsługiwane.

## Ogłoszenie

Podagenci raportują z powrotem przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji podagenta (nie sesji żądającego).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli ostatni tekst asystenta to dokładnie cichy token `NO_REPLY` / `no_reply`,
  dane wyjściowe ogłoszenia są tłumione, nawet jeśli wcześniej istniał widoczny postęp.
- W przeciwnym razie dostarczenie zależy od poziomu żądającego:
  - sesje żądającego najwyższego poziomu używają dalszego wywołania `agent` z zewnętrznym dostarczeniem (`deliver=true`)
  - zagnieżdżone sesje podagentów żądającego otrzymują wewnętrzne wstrzyknięcie dalszego przebiegu (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki potomków w ramach sesji
  - jeśli zagnieżdżona sesja podagenta żądającego już nie istnieje, OpenClaw wraca do żądającego tej sesji, gdy to możliwe
- Dla sesji żądającego najwyższego poziomu dostarczenie bezpośrednie w trybie ukończenia najpierw rozwiązuje każdą powiązaną trasę rozmowy/wątku i nadpisanie hooka, a następnie uzupełnia brakujące pola celu kanału z zapisanej trasy sesji żądającego. Dzięki temu ukończenia trafiają na właściwy czat/temat nawet wtedy, gdy źródło ukończenia identyfikuje tylko kanał.
- Agregacja ukończeń potomków jest ograniczona do bieżącego przebiegu żądającego podczas budowania zagnieżdżonych wyników ukończenia, co zapobiega przedostawaniu się nieaktualnych wyników potomków z poprzednich przebiegów do bieżącego ogłoszenia.
- Odpowiedzi ogłoszeń zachowują routowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.
- Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:
  - źródło (`subagent` lub `cron`)
  - klucz/id sesji potomka
  - typ ogłoszenia + etykieta zadania
  - wiersz stanu pochodzący z wyniku środowiska wykonawczego (`success`, `error`, `timeout` lub `unknown`)
  - treść wyniku wybrana z ostatniego widocznego tekstu asystenta, w przeciwnym razie oczyszczony ostatni tekst `tool`/`toolResult`; terminalne nieudane przebiegi raportują stan niepowodzenia bez odtwarzania przechwyconego tekstu odpowiedzi
  - instrukcję dalszego działania opisującą, kiedy odpowiedzieć, a kiedy pozostać cicho
- `Status` nie jest wnioskowany z danych wyjściowych modelu; pochodzi z sygnałów wyniku środowiska wykonawczego.
- Przy przekroczeniu limitu czasu, jeśli potomek zdążył tylko z wywołaniami narzędzi, ogłoszenie może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe dane wyjściowe narzędzi.

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet gdy są opakowane):

- Runtime (np. `runtime 5m12s`)
- Zużycie tokenów (wejście/wyjście/łącznie)
- Szacowany koszt, gdy skonfigurowano cennik modeli (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` i ścieżkę transkryptu (aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku)
- Wewnętrzne metadane są przeznaczone wyłącznie do orkiestracji; odpowiedzi skierowane do użytkownika powinny zostać przepisane zwykłym głosem asystenta.

` sessions_history` to bezpieczniejsza ścieżka orkiestracji:

- najpierw normalizowane jest odtwarzanie odpowiedzi asystenta:
  - usuwane są tagi myślenia
  - usuwane są bloki rusztowania `<relevant-memories>` / `<relevant_memories>`
  - usuwane są bloki ładunków XML wywołań narzędzi w zwykłym tekście, takie jak `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` oraz
    `<function_calls>...</function_calls>`, łącznie z uciętymi
    ładunkami, które nigdy nie zamykają się poprawnie
  - usuwane są zdegradowane rusztowania wywołań/wyników narzędzi oraz znaczniki kontekstu historycznego
  - usuwane są wyciekłe tokeny sterujące modelu, takie jak `<|assistant|>`, inne tokeny ASCII
    `<|...|>` oraz pełnoszerokie warianty `<｜...｜>`
  - usuwany jest niepoprawny XML wywołań narzędzi MiniMax
- tekst podobny do poświadczeń/tokenów jest redagowany
- długie bloki mogą zostać obcięte
- bardzo duże historie mogą pomijać starsze wiersze lub zastępować zbyt duży wiersz przez
  `[sessions_history omitted: message too large]`
- sprawdzanie surowego transkryptu na dysku jest rozwiązaniem awaryjnym, gdy potrzebujesz pełnego transkryptu bajt po bajcie

## Zasady narzędzi (narzędzia podagentów)

Domyślnie podagenci otrzymują **wszystkie narzędzia poza narzędziami sesji** i narzędziami systemowymi:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

` sessions_history` również tutaj pozostaje ograniczonym, oczyszczonym widokiem odtwarzania; nie jest
surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, podagenci-orkiestratorzy poziomu 1 dodatkowo otrzymują `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogli zarządzać swoimi potomkami.

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
        // jeśli ustawiono allow, staje się listą wyłącznie dozwolonych (deny nadal ma pierwszeństwo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Współbieżność

Podagenci używają dedykowanej ścieżki kolejki w procesie:

- Nazwa ścieżki: `subagent`
- Współbieżność: `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne przebiegi podagentów uruchomione z niej, kaskadowo także zagnieżdżone potomki.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo jego potomków.

## Ograniczenia

- Ogłoszenie podagenta działa w trybie **best-effort**. Jeśli Gateway zostanie ponownie uruchomiony, oczekująca praca „ogłoszenia z powrotem” zostanie utracona.
- Podagenci nadal współdzielą zasoby tego samego procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst podagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia to 5 (zakres `maxSpawnDepth`: 1–5). Poziom 2 jest zalecany dla większości zastosowań.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych potomków na sesję (domyślnie: 5, zakres: 1–20).
