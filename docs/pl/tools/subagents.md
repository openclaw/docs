---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle przez agenta.
    - Zmieniasz zasady narzędzia `sessions_spawn` lub zasady dotyczące pod-agentów.
    - Implementujesz lub rozwiązujesz problemy z sesjami pod-agentów powiązanymi z wątkami.
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane działania agentów w tle, które ogłaszają wyniki z powrotem na czacie zgłaszającego.
title: Pod-agenci
x-i18n:
    generated_at: "2026-04-26T11:43:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

Pod-agenci to działania agentów w tle uruchamiane z istniejącego działania agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem na kanale czatu
zgłaszającego. Każde działanie pod-agenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoległe wykonywanie pracy typu „research / długie zadanie / wolne narzędzie” bez blokowania głównego działania.
- Domyślna izolacja pod-agentów (separacja sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: pod-agenci **nie** otrzymują domyślnie narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżania dla wzorców orkiestratora.

<Note>
**Uwaga dotycząca kosztów:** każdy pod-agent ma domyślnie własny kontekst i własne użycie tokenów.
W przypadku ciężkich lub powtarzalnych zadań ustaw tańszy model dla pod-agentów
i pozostaw głównego agenta na modelu wyższej jakości. Skonfiguruj to przez
`agents.defaults.subagents.model` lub nadpisania dla konkretnego agenta. Gdy dziecko
rzeczywiście potrzebuje bieżącego transkryptu zgłaszającego, agent może zażądać
`context: "fork"` tylko dla tego jednego uruchomienia.
</Note>

## Polecenie slash

Użyj `/subagents`, aby sprawdzić lub sterować działaniami pod-agentów dla **bieżącej
sesji**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` pokazuje metadane działania (status, znaczniki czasu, identyfikator sesji,
ścieżkę transkryptu, cleanup). Użyj `sessions_history`, aby uzyskać ograniczony,
przefiltrowany pod kątem bezpieczeństwa widok przywołania; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego pełnego transkryptu.

### Kontrolki powiązania wątku

Te polecenia działają na kanałach obsługujących trwałe powiązania wątków.
Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) poniżej.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Zachowanie uruchamiania

`/subagents spawn` uruchamia pod-agenta w tle jako polecenie użytkownika (a nie
wewnętrzny relay) i wysyła jedną końcową aktualizację zakończenia z powrotem do
czatu zgłaszającego po zakończeniu działania.

<AccordionGroup>
  <Accordion title="Nieblokujące zakończenie oparte na push">
    - Polecenie uruchomienia nie blokuje; natychmiast zwraca identyfikator działania.
    - Po zakończeniu pod-agent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem na kanale czatu zgłaszającego.
    - Zakończenie jest oparte na push. Po uruchomieniu **nie** odpytywaj w pętli `/subagents list`, `sessions_list` ani `sessions_history` tylko po to, by czekać na zakończenie; sprawdzaj stan tylko na żądanie w celach debugowania lub interwencji.
    - Po zakończeniu OpenClaw podejmuje najlepszą możliwą próbę zamknięcia śledzonych kart przeglądarki/procesów otwartych przez tę sesję pod-agenta, zanim przepływ cleanup ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Odporność dostarczania przy ręcznym uruchomieniu">
    - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` przy użyciu stabilnego klucza idempotencji.
    - Jeśli bezpośrednie dostarczenie się nie powiedzie, przełącza się na routing przez kolejkę.
    - Jeśli routing przez kolejkę nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym backoffem przed ostatecznym poddaniem.
    - Dostarczenie zakończenia zachowuje rozstrzygniętą trasę zgłaszającego: trasy zakończenia powiązane z wątkiem lub konwersacją mają pierwszeństwo, gdy są dostępne; jeśli źródło zakończenia podaje tylko kanał, OpenClaw uzupełnia brakujący target/konto z rozstrzygniętej trasy sesji zgłaszającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało.

  </Accordion>
  <Accordion title="Metadane przekazania zakończenia">
    Przekazanie zakończenia do sesji zgłaszającego to wewnętrzny kontekst
    generowany w czasie działania (a nie tekst utworzony przez użytkownika) i obejmuje:

    - `Result` — ostatni widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst `tool`/`toolResult`. Końcowe nieudane działania nie wykorzystują ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Zwarte statystyki działania/tokenów.
    - Instrukcję dostarczenia mówiącą agentowi zgłaszającego, aby przepisał odpowiedź zwykłym głosem asystenta (a nie przekazywał surowych metadanych wewnętrznych).

  </Accordion>
  <Accordion title="Tryby i środowisko wykonawcze ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego działania.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i wyjście po zakończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). W przypadku trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - W przypadku sesji harness ACP (Claude Code, Gemini CLI, OpenCode lub jawny Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza to środowisko wykonawcze. Zobacz [Model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania zakończeń lub pętli agent-do-agenta. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik wyraźnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"` do czasu włączenia ACP, gdy zgłaszający nie jest sandboxowany i gdy załadowany jest Plugin backendu taki jak `acpx`. `runtime: "acp"` oczekuje zewnętrznego identyfikatora harness ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; dla zwykłych agentów konfiguracyjnych OpenClaw z `agents_list` użyj domyślnego środowiska wykonawczego pod-agenta.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni pod-agenci uruchamiają się w izolacji, chyba że wywołujący jawnie zażąda rozwidlenia
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                          | Zachowanie                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Nowe badania, niezależna implementacja, praca z wolnym narzędziem lub cokolwiek, co można krótko opisać w tekście zadania              | Tworzy czysty transkrypt potomny. To ustawienie domyślne i pozwala ograniczyć użycie tokenów. |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub zniuansowanych instrukcji już obecnych w transkrypcie zgłaszającego | Rozwidlą transkrypt zgłaszającego do sesji potomnej przed jej uruchomieniem. |

Używaj `fork` oszczędnie. Służy do delegowania zależnego od kontekstu, a nie
jako zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia działanie pod-agenta z `deliver: false` na globalnym pasie `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia na kanale
czatu zgłaszającego.

**Ustawienia domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla konkretnego agenta); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- **Thinking:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla konkretnego agenta); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- **Limit czasu działania:** jeśli `sessions_spawn.runTimeoutSeconds` zostanie pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (brak limitu czasu).

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla pod-agenta.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Uruchomienie pod innym identyfikatorem agenta, gdy zezwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest tylko dla zewnętrznych harnessów ACP (`claude`, `droid`, `gemini`, `opencode` lub jawnie zażądanego Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="model" type="string">
  Nadpisanie modelu pod-agenta. Nieprawidłowe wartości są pomijane, a pod-agent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisanie poziomu thinking dla działania pod-agenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie `agents.defaults.subagents.runTimeoutSeconds`, jeśli jest ustawione, w przeciwnym razie `0`. Po ustawieniu działanie pod-agenta jest przerywane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania wątku kanału dla tej sesji pod-agenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true`, a `mode` pominięto, domyślną wartością staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca uruchomienie, jeśli docelowe potomne środowisko wykonawcze nie jest sandboxowane.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozwidla bieżący transkrypt zgłaszającego do sesji potomnej. Tylko dla natywnych pod-agentów. Używaj `fork` tylko wtedy, gdy dziecko potrzebuje bieżącego transkryptu.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanału (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z uruchomionego działania.
</Warning>

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, pod-agent może pozostać powiązany
z wątkiem, tak aby kolejne wiadomości użytkownika w tym wątku nadal były kierowane do
tej samej sesji pod-agenta.

### Kanały obsługujące wątki

**Discord** jest obecnie jedynym obsługiwanym kanałem. Obsługuje
trwałe sesje pod-agentów powiązane z wątkiem (`sessions_spawn` z
`thread: true`), ręczne kontrolki wątków (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) oraz klucze adaptera
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` oraz
`channels.discord.threadBindings.spawnSubagentSessions`.

### Szybki przepływ

<Steps>
  <Step title="Uruchom">
    `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Powiąż">
    OpenClaw tworzy lub wiąże wątek z docelową sesją w aktywnym kanale.
  </Step>
  <Step title="Kieruj kolejne wiadomości">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdź limity czasu">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odwiązywanie po bezczynności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłącz">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Ręczne kontrolki

| Polecenie          | Efekt                                                               |
| ------------------ | ------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz go) z docelowym pod-agentem/sesją  |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                     |
| `/agents`          | Wyświetl aktywne działania i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne odwiązywanie po bezczynności (tylko skupione powiązane wątki) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko skupione powiązane wątki)   |

### Przełączniki konfiguracji

- **Domyślna wartość globalna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego powiązania przy uruchamianiu** są zależne od adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference) oraz
[Polecenia slash](/pl/tools/slash-commands), aby poznać bieżące szczegóły adapterów.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, które mogą być wskazywane przez `agentId` (`["*"]` zezwala na dowolny). Domyślnie: tylko agent zgłaszający.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana wtedy, gdy agent zgłaszający nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla konkretnego agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jeśli sesja zgłaszającego jest sandboxowana, `sessions_spawn` odrzuca cele,
które działałyby bez sandboxa.

### Odkrywanie

Użyj `agents_list`, aby sprawdzić, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera skuteczny model każdego wymienionego agenta
oraz metadane osadzonego środowiska wykonawczego, dzięki czemu wywołujący mogą odróżnić Pi, Codex
app-server i inne skonfigurowane natywne środowiska wykonawcze.

### Automatyczna archiwizacja

- Sesje pod-agentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczna archiwizacja jest typu best-effort; oczekujące timery są tracone po ponownym uruchomieniu gateway.
- `runTimeoutSeconds` **nie** powoduje automatycznej archiwizacji; zatrzymuje tylko działanie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja działa tak samo dla sesji głębokości 1 i głębokości 2.
- Cleanup przeglądarki jest oddzielny od cleanup archiwizacji: śledzone karty przeglądarki/procesy są zamykane w trybie best-effort po zakończeniu działania, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżeni pod-agenci

Domyślnie pod-agenci nie mogą uruchamiać własnych pod-agentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → pod-agent orkiestrator →
pod-pod-agenci roboczy.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // zezwól pod-agentom na uruchamianie dzieci (domyślnie: 1)
        maxChildrenPerAgent: 5, // maks. liczba aktywnych dzieci na sesję agenta (domyślnie: 5)
        maxConcurrent: 8, // globalny limit współbieżności pasa (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny limit czasu dla sessions_spawn, gdy pominięto (0 = brak limitu czasu)
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Kształt klucza sesji                           | Rola                                          | Może uruchamiać?             |
| --------- | ---------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                              | Główny agent                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                   | Pod-agent (orkiestrator, gdy dozwolona jest głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>`   | Pod-pod-agent (robotnik liściowy)             | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki wracają w górę łańcucha:

1. Robotnik głębokości 2 kończy → ogłasza do swojego rodzica (orkiestratora głębokości 1).
2. Orkiestrator głębokości 1 otrzymuje ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do głównego.
3. Główny agent otrzymuje ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę dziecka raz i czekaj na zdarzenia
zakończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` albo poleceń usypiania `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skoncentrowane na pracy na żywo — żywe dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótki ostatni okres, a nieaktualne łącza dzieci zapisane tylko w store są
ignorowane po upływie okna świeżości. Zapobiega to wskrzeszaniu fałszywych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po restarcie.
Jeśli zdarzenie zakończenia dziecka nadejdzie po tym, jak już wysłałeś
ostateczną odpowiedź, prawidłowym działaniem następczym jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Zasady narzędzi według głębokości

- Zakres roli i sterowania jest zapisywany w metadanych sesji podczas uruchamiania. Dzięki temu płaskie lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby móc zarządzać swoimi dziećmi. Pozostałe narzędzia sesji/systemowe pozostają zablokowane.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (obecne zachowanie domyślne).
- **Głębokość 2 (robotnik liściowy):** brak narzędzi sesji — `sessions_spawn` jest zawsze odrzucane na głębokości 2. Nie może uruchamiać dalszych dzieci.

### Limit uruchomień na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie co najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
przez pojedynczego orkiestratora.

### Zatrzymanie kaskadowe

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
głębokości 2:

- `/stop` na głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego pod-agenta i kaskadowo jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich pod-agentów dla zgłaszającego i wykonuje zatrzymanie kaskadowe.

## Uwierzytelnianie

Uwierzytelnianie pod-agenta jest rozstrzygane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji pod-agenta to `agent:<agentId>:subagent:<uuid>`.
- Store uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **fallback**; profile agenta mają pierwszeństwo nad profilami głównego agenta w razie konfliktów.

Scalanie ma charakter addytywny, więc profile głównego agenta są zawsze dostępne jako
fallbacki. W pełni izolowane uwierzytelnianie per agent nie jest jeszcze obsługiwane.

## Ogłoszenie

Pod-agenci raportują z powrotem przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji pod-agenta (a nie sesji zgłaszającego).
- Jeśli pod-agent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta to dokładny cichy token `NO_REPLY` / `no_reply`, wynik ogłoszenia jest tłumiony, nawet jeśli wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości zgłaszającego:

- Sesje zgłaszającego najwyższego poziomu używają następczego wywołania `agent` z zewnętrznym dostarczeniem (`deliver=true`).
- Zagnieżdżone sesje pod-agentów zgłaszającego otrzymują wewnętrzne wstrzyknięcie następcze (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w obrębie sesji.
- Jeśli zagnieżdżona sesja pod-agenta zgłaszającego zniknie, OpenClaw przełącza się na zgłaszającego tej sesji, gdy to możliwe.

W przypadku sesji zgłaszającego najwyższego poziomu dostarczenie bezpośrednie w trybie zakończenia
najpierw rozstrzyga dowolną powiązaną trasę konwersacji/wątku i nadpisanie hooka, a następnie uzupełnia
brakujące pola celu kanału z zapisanej trasy sesji zgłaszającego.
Dzięki temu zakończenia trafiają na właściwy czat/temat nawet wtedy, gdy źródło zakończenia
identyfikuje tylko kanał.

Agregacja zakończeń dzieci jest ograniczona do bieżącego działania zgłaszającego podczas
budowania zagnieżdżonych ustaleń zakończenia, co zapobiega wyciekowi starych wyników dzieci z poprzednich działań
do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują routing wątku/tematu, gdy jest dostępny w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` lub `cron`                                                                                       |
| Session ids    | Klucz/id sesji dziecka                                                                                      |
| Type           | Typ ogłoszenia + etykieta zadania                                                                           |
| Status         | Wyprowadzany z wyniku środowiska wykonawczego (`success`, `error`, `timeout` lub `unknown`) — **nie** wywnioskowany z tekstu modelu |
| Result content | Ostatni widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst `tool`/`toolResult`      |
| Follow-up      | Instrukcja opisująca, kiedy odpowiadać, a kiedy pozostać cicho                                              |

Końcowe nieudane działania zgłaszają status niepowodzenia bez odtwarzania przechwyconego
tekstu odpowiedzi. W przypadku limitu czasu, jeśli dziecko zdążyło przejść tylko przez wywołania narzędzi,
ogłoszenie może zwinąć tę historię do krótkiego podsumowania częściowego postępu
zamiast odtwarzać surowe wyjście narzędzia.

### Wiersz statystyk

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet po opakowaniu):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżkę transkryptu, aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone wyłącznie do orkiestracji; odpowiedzi
dla użytkownika powinny zostać przepisane zwykłym głosem asystenta.

### Dlaczego warto preferować `sessions_history`

`sessions_history` to bezpieczniejsza ścieżka orkiestracji:

- Przywołanie asystenta jest najpierw normalizowane: usuwane są tagi thinking; usuwane jest rusztowanie `<relevant-memories>` / `<relevant_memories>`; usuwane są bloki ładunku XML zwykłego tekstu wywołań narzędzi (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), w tym ucięte ładunki, które nigdy nie zamknęły się poprawnie; usuwane jest zdegradowane rusztowanie wywołań/wyników narzędzi i znaczniki kontekstu historycznego; usuwane są wyciekające tokeny sterowania modelem (`<|assistant|>`, inne ASCII `<|...|>`, pełnoszerokie `<｜...｜>`); usuwany jest niepoprawny XML wywołań narzędzi MiniMax.
- Tekst podobny do danych uwierzytelniających/tokenów jest redagowany.
- Długie bloki mogą być obcinane.
- Bardzo duże historie mogą usuwać starsze wiersze albo zastępować nadmiernie duży wiersz komunikatem `[sessions_history omitted: message too large]`.
- Sprawdzenie surowego transkryptu na dysku jest rozwiązaniem awaryjnym, gdy potrzebujesz pełnego transkryptu bajt po bajcie.

## Zasady narzędzi

Pod-agenci używają najpierw tego samego profilu i potoku zasad narzędzi co agent nadrzędny lub
docelowy. Następnie OpenClaw stosuje warstwę ograniczeń pod-agentów.

Przy braku restrykcyjnego `tools.profile` pod-agenci otrzymują **wszystkie narzędzia z wyjątkiem
narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`seessions_history` pozostaje również tutaj ograniczonym, oczyszczonym widokiem przywołania —
nie jest to surowy zrzut transkryptu.

Gdy `maxSpawnDepth >= 2`, pod-agenci orkiestratora głębokości 1 dodatkowo
otrzymują `sessions_spawn`, `subagents`, `sessions_list` i
`sessions_history`, aby mogli zarządzać swoimi dziećmi.

### Nadpisanie przez konfigurację

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

`tools.subagents.tools.allow` jest końcowym filtrem wyłącznie dozwolonych. Może zawężać
już rozstrzygnięty zestaw narzędzi, ale nie może **przywrócić** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` zawiera
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby
pod-agenci z profilem coding mogli używać automatyzacji przeglądarki, dodaj browser na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj per-agent `agents.list[].tools.alsoAllow: ["browser"]`, gdy tylko jeden
agent powinien otrzymać automatyzację przeglądarki.

## Współbieżność

Pod-agenci używają dedykowanego pasa kolejki w procesie:

- **Nazwa pasa:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że
pod-agent nadal działa. Niezakończone działania starsze niż okno nieaktualnych działań
przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu,
bramkowaniu zakończeń potomków i kontrolach współbieżności per sesja.

Po ponownym uruchomieniu gateway nieaktualne niezakończone przywrócone działania są usuwane, chyba że
ich sesja potomna ma ustawione `abortedLastRun: true`. Takie
sesje potomne przerwane po restarcie pozostają możliwe do odzyskania przez przepływ odzyskiwania sierot pod-agentów, który wysyła syntetyczną wiadomość wznowienia przed
wyczyszczeniem znacznika przerwania.

<Note>
Jeśli uruchomienie pod-agenta kończy się błędem Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, sprawdź wywołującego RPC przed edytowaniem stanu parowania.
Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako
`client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie
uwierzytelnianie local loopback współdzielonym tokenem/hasłem; ta ścieżka nie zależy od
bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokenów urządzenia oraz klienci przeglądarki/node
nadal wymagają zwykłego zatwierdzenia urządzenia dla rozszerzeń zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` na czacie zgłaszającego przerywa sesję zgłaszającego i zatrzymuje wszystkie aktywne działania pod-agentów uruchomione z niej, kaskadowo także dla zagnieżdżonych dzieci.
- `/subagents kill <id>` zatrzymuje konkretnego pod-agenta i kaskadowo jego dzieci.

## Ograniczenia

- Ogłoszenie pod-agenta działa w trybie **best-effort**. Jeśli gateway zostanie ponownie uruchomiony, oczekująca praca „ogłoś z powrotem” zostanie utracona.
- Pod-agenci nadal współdzielą zasoby tego samego procesu gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst pod-agenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia to 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana w większości zastosowań.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia sandbox wielu agentów](/pl/tools/multi-agent-sandbox-tools)
