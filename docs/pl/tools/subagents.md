---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pośrednictwem agenta
    - Zmieniasz sessions_spawn lub zasady użycia narzędzi podagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agentów w tle, które przekazują wyniki z powrotem na czat osoby zgłaszającej
title: Podagenci
x-i18n:
    generated_at: "2026-04-30T10:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

Podagenci to uruchomienia agenta w tle utworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem w kanale czatu
żądającego. Każde uruchomienie podagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoległe wykonywanie pracy typu „badanie / długie zadanie / wolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja podagentów (separacja sesji + opcjonalny sandboxing).
- Ograniczenie ryzyka błędnego użycia powierzchni narzędzi: podagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżania dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy podagent ma domyślnie własny kontekst i zużycie tokenów. W przypadku ciężkich lub powtarzalnych zadań ustaw tańszy model dla podagentów i pozostaw głównego agenta na modelu wyższej jakości. Skonfiguruj to przez `agents.defaults.subagents.model` albo nadpisania dla poszczególnych agentów. Gdy dziecko naprawdę potrzebuje bieżącego transkryptu żądającego, agent może zażądać `context: "fork"` przy tym jednym utworzeniu.
</Note>

## Polecenie slash

Użyj `/subagents`, aby sprawdzać lub kontrolować uruchomienia podagentów dla **bieżącej
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

`/subagents info` pokazuje metadane uruchomienia (status, znaczniki czasu, identyfikator sesji,
ścieżkę transkryptu, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przywołania; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego pełnego transkryptu.

### Kontrolki powiązania wątków

Te polecenia działają na kanałach obsługujących trwałe powiązania wątków.
Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) poniżej.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Zachowanie tworzenia

`/subagents spawn` uruchamia podagenta w tle jako polecenie użytkownika (nie jako
wewnętrzne przekazanie) i wysyła jedną końcową aktualizację ukończenia z powrotem do
czatu żądającego po zakończeniu uruchomienia.

<AccordionGroup>
  <Accordion title="Nieblokujące ukończenie oparte na wypychaniu">
    - Polecenie tworzenia jest nieblokujące; natychmiast zwraca identyfikator uruchomienia.
    - Po ukończeniu podagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem w kanale czatu żądającego.
    - Ukończenie jest oparte na wypychaniu. Po utworzeniu **nie** odpytuj `/subagents list`, `sessions_list` ani `sessions_history` w pętli tylko po to, aby czekać na zakończenie; sprawdzaj status tylko na żądanie w celu debugowania lub interwencji.
    - Po ukończeniu OpenClaw w miarę możliwości zamyka śledzone karty przeglądarki/procesy otwarte przez tę sesję podagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Odporność dostarczania przy ręcznym tworzeniu">
    - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
    - Jeśli bezpośrednie dostarczenie się nie powiedzie, wraca do routingu przez kolejkę.
    - Jeśli routing przez kolejkę nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostateczną rezygnacją.
    - Dostarczanie ukończenia zachowuje rozwiązaną trasę żądającego: trasy ukończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło ukończenia udostępnia tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało.

  </Accordion>
  <Accordion title="Metadane przekazania ukończenia">
    Przekazanie ukończenia do sesji żądającego to generowany w czasie działania
    kontekst wewnętrzny (nie tekst napisany przez użytkownika) i obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst tool/toolResult. Zakończone niepowodzeniem uruchomienia terminalne nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompaktowe statystyki czasu działania/tokenów.
    - Instrukcję dostarczenia nakazującą agentowi żądającemu przepisać treść normalnym głosem asystenta (nie przekazywać surowych metadanych wewnętrznych).

  </Accordion>
  <Accordion title="Tryby i środowisko uruchomieniowe ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po ukończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - Dla sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode lub jawnie Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza to środowisko uruchomieniowe. Zobacz [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń lub pętli agent-do-agenta. Gdy Plugin `codex` jest włączony, kontrola czatu/wątku Codex powinna preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie prosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"`, dopóki ACP nie jest włączone, żądający nie działa w sandboxie, a Plugin backendowy, taki jak `acpx`, nie jest załadowany. `runtime: "acp"` oczekuje zewnętrznego identyfikatora uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; użyj domyślnego środowiska uruchomieniowego podagenta dla zwykłych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni podagenci startują odizolowani, chyba że wywołujący jawnie poprosi o rozwidlenie
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badanie, niezależna implementacja, wolna praca narzędziowa albo cokolwiek, co można opisać w treści zadania                    | Tworzy czysty transkrypt dziecka. To ustawienie domyślne i utrzymuje niższe zużycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub niuansowych instrukcji już obecnych w transkrypcie żądającego | Rozgałęzia transkrypt żądającego do sesji dziecka przed startem dziecka. |

Używaj `fork` oszczędnie. Służy do delegowania wrażliwego na kontekst, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia podagenta z `deliver: false` na globalnej ścieżce `subagent`,
następnie uruchamia krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale
czatu żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
nie; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, którzy powinni delegować
pracę. Polityki kanału/grupy, dostawcy, sandboxa oraz zezwalania/odmawiania dla poszczególnych agentów nadal mogą
usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (albo `agents.list[].subagents.model` dla poszczególnych agentów); jawne `sessions_spawn.model` nadal wygrywa.
- **Thinking:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (albo `agents.list[].subagents.thinking` dla poszczególnych agentów); jawne `sessions_spawn.thinking` nadal wygrywa.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` zostanie pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (bez limitu czasu).

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla podagenta.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Utwórz pod innym identyfikatorem agenta, gdy pozwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone tylko dla zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie żądanego Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane dla natywnych utworzeń podagenta.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje dane wyjściowe uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń dla natywnych utworzeń podagenta.
</ParamField>
<ParamField path="model" type="string">
  Nadpisz model podagenta. Nieprawidłowe wartości są pomijane, a podagent działa na domyślnym modelu z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisz poziom thinking dla uruchomienia podagenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie `agents.defaults.subagents.runTimeoutSeconds`, gdy ustawione, w przeciwnym razie `0`. Gdy ustawione, uruchomienie podagenta jest przerywane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania wątku kanału dla tej sesji podagenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i `mode` pominięto, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca utworzenie, chyba że docelowe środowisko uruchomieniowe dziecka działa w sandboxie.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżący transkrypt żądającego do sesji dziecka. Tylko natywni podagenci. Używaj `fork` tylko wtedy, gdy dziecko potrzebuje bieżącego transkryptu.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z utworzonego uruchomienia.
</Warning>

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, podagent może pozostać powiązany
z wątkiem, aby kolejne wiadomości użytkownika w tym wątku nadal były routowane do
tej samej sesji podagenta.

### Kanały obsługujące wątki

**Discord** jest obecnie jedynym obsługiwanym kanałem. Obsługuje
trwałe sesje podagentów powiązane z wątkiem (`sessions_spawn` z
`thread: true`), ręczne kontrolki wątku (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) oraz klucze adaptera
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` i
`channels.discord.threadBindings.spawnSubagentSessions`.

### Szybki przepływ

<Steps>
  <Step title="Utwórz">
    `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Powiąż">
    OpenClaw tworzy albo wiąże wątek z tym celem sesji w aktywnym kanale.
  </Step>
  <Step title="Routuj kontynuacje">
    Odpowiedzi i kolejne wiadomości w tym wątku są routowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdź limity czasu">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odłączenie focus przy braku aktywności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłącz">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Kontrolki ręczne

| Polecenie          | Efekt                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz go) z celem podagenta/sesji          |
| `/unfocus`         | Usuń powiązanie bieżącego powiązanego wątku                            |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne odfokusowanie bezczynności (tylko powiązane wątki w fokusie) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko powiązane wątki w fokusie)     |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego powiązania przy tworzeniu** są specyficzne dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) i
[Komendy ukośnikowe](/pl/tools/slash-commands), aby poznać aktualne szczegóły adapterów.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, które mogą być wskazywane przez jawne `agentId` (`["*"]` zezwala na dowolny). Domyślnie: tylko agent wysyłający żądanie. Jeśli ustawisz listę i nadal chcesz, aby agent wysyłający żądanie tworzył samego siebie z `agentId`, uwzględnij identyfikator agenta wysyłającego żądanie na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana, gdy agent wysyłający żądanie nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuj wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jeśli sesja agenta wysyłającego żądanie działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby bez piaskownicy.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska uruchomieniowego, aby wywołujący mogli odróżnić PI, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska uruchomieniowe.

### Automatyczna archiwizacja

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczna archiwizacja działa na zasadzie najlepszych starań; oczekujące timery przepadają, jeśli Gateway zostanie ponownie uruchomiony.
- `runTimeoutSeconds` **nie** archiwizuje automatycznie; tylko zatrzymuje uruchomienie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy jednakowo sesji głębokości 1 i głębokości 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane na zasadzie najlepszych starań po zakończeniu uruchomienia, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżone podagenty

Domyślnie podagenty nie mogą tworzyć własnych podagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → podagent orkiestrujący →
pod-podagenty robocze.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Kształt klucza sesji                         | Rola                                          | Może tworzyć?                |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Agent główny                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Pod-podagent (pracownik liściowy)             | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki przepływają z powrotem w górę łańcucha:

1. Pracownik głębokości 2 kończy → ogłasza do swojego rodzica (orkiestratora głębokości 1).
2. Orkiestrator głębokości 1 otrzymuje ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do agenta głównego.
3. Agent główny otrzymuje ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę dziecka raz i czekaj na zdarzenia
zakończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń usypiania `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skupione na pracy na żywo — aktywne dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótkie ostatnie okno, a nieaktualne linki dzieci istniejące tylko w magazynie są
ignorowane po upływie okna świeżości. Zapobiega to wskrzeszaniu widmowych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po ponownym uruchomieniu. Jeśli zdarzenie zakończenia dziecka dotrze po wysłaniu przez Ciebie
ostatecznej odpowiedzi, właściwą kontynuacją jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Polityka narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie tworzenia. Dzięki temu płaskie lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (bieżące zachowanie domyślne).
- **Głębokość 2 (pracownik liściowy):** brak narzędzi sesji — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może tworzyć kolejnych dzieci.

### Limit tworzenia dla agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z pojedynczego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo zatrzymuje ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo zatrzymuje jego dzieci.
- `/subagents kill all` zatrzymuje wszystkie podagenty dla agenta wysyłającego żądanie i uruchamia kaskadę.

## Uwierzytelnianie

Uwierzytelnianie podagenta jest rozwiązywane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji podagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **fallback**; profile agenta nadpisują profile główne przy konfliktach.

Scalanie jest addytywne, więc główne profile są zawsze dostępne jako
fallbacki. W pełni izolowane uwierzytelnianie dla każdego agenta nie jest jeszcze obsługiwane.

## Ogłoszenie

Podagenty raportują z powrotem przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji podagenta (nie sesji agenta wysyłającego żądanie).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wyjście ogłoszenia zostaje wyciszone, nawet jeśli wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości agenta wysyłającego żądanie:

- Sesje agenta wysyłającego żądanie najwyższego poziomu używają kontrolnego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje podagenta wysyłającego żądanie otrzymują wewnętrzne wstrzyknięcie kontynuacji (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja podagenta wysyłającego żądanie zniknie, OpenClaw wraca do agenta wysyłającego żądanie tej sesji, gdy jest dostępny.

W przypadku sesji agenta wysyłającego żądanie najwyższego poziomu bezpośrednie dostarczenie w trybie ukończenia najpierw
rozwiązuje dowolną powiązaną trasę rozmowy/wątku i nadpisanie haka, a następnie uzupełnia
brakujące pola celu kanału z zapisanej trasy sesji agenta wysyłającego żądanie.
Dzięki temu ukończenia trafiają do właściwego czatu/tematu, nawet gdy źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci jest zawężona do bieżącego uruchomienia agenta wysyłającego żądanie podczas
budowania zagnieżdżonych ustaleń ukończenia, co zapobiega wyciekaniu nieaktualnych wyjść dzieci
z poprzedniego uruchomienia do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują
trasowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole            | Źródło                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Źródło          | `subagent` lub `cron`                                                                                         |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                   |
| Typ             | Typ ogłoszenia + etykieta zadania                                                                             |
| Status          | Wyprowadzony z wyniku środowiska uruchomieniowego (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku    | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst tool/toolResult             |
| Kontynuacja     | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho                                              |

Końcowe nieudane uruchomienia raportują status niepowodzenia bez odtwarzania przechwyconego
tekstu odpowiedzi. Przy przekroczeniu limitu czasu, jeśli dziecko przeszło tylko przez wywołania narzędzi, ogłoszenie
może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast
odtwarzać surowe wyjście narzędzia.

### Wiersz statystyk

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet po zawinięciu):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkryptu, aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone tylko do orkiestracji; odpowiedzi skierowane do użytkownika
powinny zostać przepisane normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- Pamięć asystenta jest najpierw normalizowana: tagi myślenia usunięte; szkielet `<relevant-memories>` / `<relevant_memories>` usunięty; bloki ładunku XML wywołań narzędzi w postaci zwykłego tekstu (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) usunięte, w tym ucięte ładunki, które nigdy nie zamykają się poprawnie; zdegradowany szkielet wywołań/wyników narzędzi i znaczniki kontekstu historycznego usunięte; wyciekłe tokeny sterujące modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnej szerokości `<｜...｜>`) usunięte; niepoprawny XML wywołań narzędzi MiniMax usunięty.
- Tekst przypominający poświadczenia/tokeny jest redagowany.
- Długie bloki mogą zostać skrócone.
- Bardzo duże historie mogą porzucać starsze wiersze lub zastępować nadmiernie duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkryptu na dysku jest rozwiązaniem awaryjnym, gdy potrzebujesz pełnego transkryptu bajt w bajt.

## Polityka narzędzi

Podagenty używają najpierw tego samego profilu i potoku polityki narzędzi co agent nadrzędny lub
docelowy. Następnie OpenClaw stosuje warstwę ograniczeń podagenta.

Bez restrykcyjnego `tools.profile` podagenty otrzymują **wszystkie narzędzia z wyjątkiem
narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` również tutaj pozostaje ograniczonym, oczyszczonym widokiem pamięci —
nie jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, podagenty orkiestrujące głębokości 1 dodatkowo
otrzymują `sessions_spawn`, `subagents`, `sessions_list` i
`sessions_history`, aby mogły zarządzać swoimi dziećmi.

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` to końcowy filtr działający wyłącznie jako allow-only. Może zawęzić
już rozstrzygnięty zestaw narzędzi, ale nie może **przywrócić** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby umożliwić
podagentom profilu coding korzystanie z automatyzacji przeglądarki, dodaj browser na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj `agents.list[].tools.alsoAllow: ["browser"]` dla pojedynczego agenta, gdy tylko jeden
agent powinien otrzymać automatyzację przeglądarki.

## Współbieżność

Podagenci używają dedykowanej kolejki w procesie:

- **Nazwa kolejki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że
podagent nadal działa. Niezakończone uruchomienia starsze niż okno nieaktualnego uruchomienia
przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu,
bramkowaniu ukończenia potomków oraz kontrolach współbieżności dla sesji.

Po ponownym uruchomieniu Gateway nieaktualne, niezakończone, przywrócone uruchomienia są usuwane, chyba że
ich sesja potomna jest oznaczona jako `abortedLastRun: true`. Te
sesje potomne przerwane przez ponowne uruchomienie pozostają możliwe do odzyskania przez przepływ
odzyskiwania osieroconego podagenta, który wysyła syntetyczny komunikat wznowienia przed
wyczyszczeniem znacznika przerwania.

<Note>
Jeśli utworzenie podagenta kończy się niepowodzeniem z Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, sprawdź wywołującego RPC przed edycją stanu parowania.
Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako
`client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie
uwierzytelnianie local loopback z użyciem współdzielonego tokenu/hasła; ta ścieżka nie zależy od
bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokenów urządzeń oraz klienci browser/node
nadal wymagają normalnego zatwierdzenia urządzenia dla rozszerzeń zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia podagentów utworzone z niej, kaskadowo obejmując zagnieżdżone elementy potomne.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo zatrzymuje jego elementy potomne.

## Ograniczenia

- Ogłoszenie podagenta działa na zasadzie **best-effort**. Jeśli Gateway zostanie ponownie uruchomiony, oczekująca praca „announce back” zostanie utracona.
- Podagenci nadal współdzielą te same zasoby procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst podagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Dla większości przypadków użycia zalecana jest głębokość 2.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych elementów potomnych na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie do agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
