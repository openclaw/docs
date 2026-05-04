---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pośrednictwem agenta
    - Zmieniasz sessions_spawn lub zasady narzędzi subagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami podagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agentów w tle, które przekazują wyniki z powrotem na czacie osoby zgłaszającej
title: Podagenci
x-i18n:
    generated_at: "2026-05-04T02:27:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0df39e06b952def3eb0b296f36c7dc8c0b0a115785d865236a970c5d453fc37
    source_path: tools/subagents.md
    workflow: 16
---

Agenci podrzędni to działające w tle uruchomienia agentów utworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i
po zakończeniu **ogłaszają** swój wynik z powrotem na kanale czatu
żądającego. Każde uruchomienie agenta podrzędnego jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoległe wykonywanie pracy typu „badania / długie zadanie / wolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja agentów podrzędnych (oddzielenie sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: agenci podrzędni domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżania dla wzorców orkiestratorów.

<Note>
**Uwaga o kosztach:** każdy agent podrzędny domyślnie ma własny kontekst i zużycie tokenów. Przy ciężkich lub powtarzalnych zadaniach ustaw tańszy model dla agentów podrzędnych i pozostaw głównego agenta na modelu wyższej jakości. Skonfiguruj to przez `agents.defaults.subagents.model` albo nadpisania dla konkretnego agenta. Gdy dziecko
    rzeczywiście potrzebuje bieżącego transkryptu żądającego, agent może zażądać
    `context: "fork"` przy tym jednym utworzeniu. Sesje agentów podrzędnych powiązane z wątkiem domyślnie używają
    `context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do
    wątku kontynuacji.
</Note>

## Polecenie slash

Użyj `/subagents`, aby sprawdzać lub kontrolować uruchomienia agentów podrzędnych dla **bieżącej
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

Użyj najwyższego poziomu [`/steer <message>`](/pl/tools/steer), aby sterować aktywnym uruchomieniem bieżącej sesji żądającego. Użyj `/subagents steer <id|#> <message>`, gdy celem jest uruchomienie dziecka.

`/subagents info` pokazuje metadane uruchomienia (status, znaczniki czasu, identyfikator sesji,
ścieżkę transkryptu, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przypomnienia; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego pełnego transkryptu.

### Kontrolki wiązania wątków

Te polecenia działają na kanałach obsługujących trwałe wiązania wątków.
Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) poniżej.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Zachowanie tworzenia

`/subagents spawn` uruchamia agenta podrzędnego w tle jako polecenie użytkownika (nie jako
wewnętrzne przekazanie) i wysyła jedną końcową aktualizację o ukończeniu z powrotem do
czatu żądającego, gdy uruchomienie się zakończy.

<AccordionGroup>
  <Accordion title="Nieblokujące ukończenie oparte na wysyłaniu">
    - Polecenie tworzenia jest nieblokujące; natychmiast zwraca identyfikator uruchomienia.
    - Po ukończeniu agent podrzędny ogłasza komunikat z podsumowaniem/wynikiem z powrotem na kanale czatu żądającego.
    - Ukończenie jest oparte na wysyłaniu. Po utworzeniu **nie** odpytuj `/subagents list`, `sessions_list` ani `sessions_history` w pętli tylko po to, aby czekać na zakończenie; sprawdzaj status tylko na żądanie przy debugowaniu lub interwencji.
    - Po ukończeniu OpenClaw w miarę możliwości zamyka śledzone karty/procesy przeglądarki otwarte przez tę sesję agenta podrzędnego, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Odporność dostarczania ręcznie utworzonych uruchomień">
    - OpenClaw najpierw próbuje bezpośredniego dostarczania `agent` ze stabilnym kluczem idempotencji.
    - Jeśli bezpośrednie dostarczenie się nie powiedzie, przechodzi na trasowanie przez kolejkę.
    - Jeśli trasowanie przez kolejkę nadal nie jest dostępne, ogłoszenie jest ponawiane z krótkim wykładniczym wycofywaniem przed ostateczną rezygnacją.
    - Dostarczenie ukończenia zachowuje rozwiązaną trasę żądającego: trasy ukończenia powiązane z wątkiem lub rozmową mają pierwszeństwo, gdy są dostępne; jeśli źródło ukończenia dostarcza tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało.

  </Accordion>
  <Accordion title="Metadane przekazania ukończenia">
    Przekazanie ukończenia do sesji żądającego jest wygenerowanym w czasie wykonywania
    kontekstem wewnętrznym (nie tekstem napisanym przez użytkownika) i zawiera:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult. Końcowe nieudane uruchomienia nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompaktowe statystyki czasu wykonywania/tokenów.
    - Instrukcję dostarczenia mówiącą agentowi żądającego, aby przepisał treść normalnym głosem asystenta (nie przekazywał surowych metadanych wewnętrznych).

  </Accordion>
  <Accordion title="Tryby i środowisko uruchomieniowe ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po ukończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - Dla sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode albo jawnie Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie deklaruje to środowisko uruchomieniowe. Zobacz [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń lub pętli agent-agent. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie prosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"`, dopóki ACP nie jest włączone, żądający nie jest w sandboxie, a Plugin backendu taki jak `acpx` jest załadowany. `runtime: "acp"` oczekuje zewnętrznego identyfikatora uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; użyj domyślnego środowiska uruchomieniowego agenta podrzędnego dla zwykłych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni agenci podrzędni startują w izolacji, chyba że wywołujący jawnie poprosi o rozgałęzienie
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badania, niezależna implementacja, wolna praca narzędziowa albo wszystko, co można streścić w tekście zadania                           | Tworzy czysty transkrypt dziecka. To ustawienie domyślne i utrzymuje niższe zużycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub niuansów instrukcji już obecnych w transkrypcie żądającego | Rozgałęzia transkrypt żądającego do sesji dziecka przed startem dziecka. |

Używaj `fork` oszczędnie. Służy do delegowania zależnego od kontekstu, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia agenta podrzędnego z `deliver: false` na globalnej ścieżce `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia na kanale czatu
żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
nie udostępnia; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, którzy powinni delegować
pracę. Polityki kanału/grupy, dostawcy, sandboxa i zezwalania/odmawiania dla konkretnego agenta nadal mogą
usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (albo `agents.list[].subagents.model` dla konkretnego agenta); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- **Thinking:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (albo `agents.list[].subagents.thinking` dla konkretnego agenta); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` jest pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie przechodzi na `0` (brak limitu czasu).

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla agenta podrzędnego.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Utwórz pod innym identyfikatorem agenta, gdy zezwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest tylko dla zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie zażądane Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane przy natywnym tworzeniu agentów podrzędnych.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje dane wyjściowe uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń przy natywnym tworzeniu agentów podrzędnych.
</ParamField>
<ParamField path="model" type="string">
  Nadpisz model agenta podrzędnego. Nieprawidłowe wartości są pomijane, a agent podrzędny działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisz poziom myślenia dla uruchomienia agenta podrzędnego.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie `agents.defaults.subagents.runTimeoutSeconds`, gdy ustawione, w przeciwnym razie `0`. Gdy ustawione, uruchomienie agenta podrzędnego jest przerywane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda wiązania wątku kanału dla tej sesji agenta podrzędnego.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i `mode` pominięto, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca utworzenie, chyba że docelowe środowisko uruchomieniowe dziecka jest w sandboxie.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżący transkrypt żądającego do sesji dziecka. Tylko natywni agenci podrzędni. Utworzenia powiązane z wątkiem domyślnie używają `fork`; utworzenia bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z utworzonego uruchomienia.
</Warning>

## Sesje powiązane z wątkiem

Gdy wiązania wątków są włączone dla kanału, agent podrzędny może pozostać powiązany
z wątkiem, aby kolejne wiadomości użytkownika w tym wątku nadal były kierowane do
tej samej sesji agenta podrzędnego.

### Kanały obsługujące wątki

**Discord** jest obecnie jedynym obsługiwanym kanałem. Obsługuje
trwałe sesje subagentów powiązane z wątkiem (`sessions_spawn` z
`thread: true`), ręczne kontrolki wątków (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) oraz klucze adaptera
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` i
`channels.discord.threadBindings.spawnSessions`.

### Szybki przepływ

<Steps>
  <Step title="Utwórz">
    `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Powiąż">
    OpenClaw tworzy lub wiąże wątek z tym celem sesji w aktywnym kanale.
  </Step>
  <Step title="Kieruj kontynuacje">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdź limity czasu">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne cofnięcie fokusu przy braku aktywności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłącz">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Ręczne kontrolki

| Polecenie          | Efekt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz nowy) z celem subagenta/sesji        |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                       |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne usunięcie skupienia po bezczynności (tylko skupione powiązane wątki) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit czasu (tylko skupione powiązane wątki) |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego powiązania przy uruchomieniu** są specyficzne dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać aktualne szczegóły adapterów.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, które mogą być celem przez jawne `agentId` (`["*"]` zezwala na dowolny). Domyślnie: tylko agent zgłaszający żądanie. Jeśli ustawisz listę i nadal chcesz, aby zgłaszający mógł uruchamiać samego siebie z `agentId`, uwzględnij identyfikator zgłaszającego na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana, gdy agent zgłaszający żądanie nie ustawi własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuj wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jeśli sesja zgłaszającego działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby poza piaskownicą.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska uruchomieniowego, dzięki czemu wywołujący mogą odróżnić PI, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska uruchomieniowe.

### Automatyczna archiwizacja

- Sesje subagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczna archiwizacja działa w trybie najlepszych starań; oczekujące timery zostają utracone, jeśli Gateway zostanie uruchomiony ponownie.
- `runTimeoutSeconds` **nie** archiwizuje automatycznie; tylko zatrzymuje uruchomienie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy tak samo sesji na głębokości 1 i 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane w trybie najlepszych starań po zakończeniu uruchomienia, nawet jeśli transkrypt/rekord sesji zostaje zachowany.

## Zagnieżdżone subagenty

Domyślnie subagenty nie mogą uruchamiać własnych subagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → subagent orkiestrujący →
subsubagenci wykonawczy.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // zezwól subagentom na uruchamianie dzieci (domyślnie: 1)
        maxChildrenPerAgent: 5, // maks. aktywnych dzieci na sesję agenta (domyślnie: 5)
        maxConcurrent: 8, // globalny limit równoległych pasów (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny limit czasu dla sessions_spawn, gdy pominięty (0 = bez limitu czasu)
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Kształt klucza sesji                         | Rola                                          | Może uruchamiać?             |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Agent główny                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Subagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagent (wykonawca liść)                  | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki przepływają w górę łańcucha:

1. Wykonawca z głębokości 2 kończy → ogłasza wynik rodzicowi (orkiestratorowi z głębokości 1).
2. Orkiestrator z głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do głównego.
3. Agent główny odbiera ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wytyczne operacyjne:** uruchamiaj pracę dziecka raz i czekaj na zdarzenia
zakończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń `exec` z uśpieniem.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skupione na pracy na żywo — aktywne dzieci pozostają podłączone, zakończone dzieci pozostają
widoczne przez krótki ostatni okres, a przestarzałe linki dzieci istniejące tylko w magazynie są
ignorowane po upływie ich okna świeżości. Zapobiega to wskrzeszaniu widmowych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po ponownym uruchomieniu. Jeśli zdarzenie zakończenia dziecka nadejdzie po wysłaniu
ostatecznej odpowiedzi, poprawną odpowiedzią uzupełniającą jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Zasady narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie uruchomienia. Dzięki temu płaskie lub odtworzone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (obecne zachowanie domyślne).
- **Głębokość 2 (wykonawca liść):** brak narzędzi sesji — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może uruchamiać kolejnych dzieci.

### Limit uruchomień na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z jednego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora z głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
z głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów z głębokości 1 i kaskadowo zatrzymuje ich dzieci z głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i kaskadowo zatrzymuje jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich subagentów zgłaszającego i uruchamia kaskadę.

## Uwierzytelnianie

Uwierzytelnianie subagenta jest rozstrzygane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji subagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania agenta głównego są scalane jako **fallback**; profile agenta nadpisują profile główne w przypadku konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
fallbacki. W pełni izolowane uwierzytelnianie na agenta nie jest jeszcze obsługiwane.

## Ogłoszenie

Subagenty zgłaszają wyniki przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji subagenta (nie w sesji zgłaszającego).
- Jeśli subagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta to dokładny cichy token `NO_REPLY` / `no_reply`, wynik ogłoszenia jest tłumiony, nawet jeśli wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości zgłaszającego:

- Sesje zgłaszającego najwyższego poziomu używają uzupełniającego wywołania `agent` z dostarczaniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje subagenta zgłaszającego otrzymują wewnętrzne wstrzyknięcie uzupełniające (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja subagenta zgłaszającego zniknie, OpenClaw wraca do zgłaszającego tej sesji, gdy jest dostępny.

W przypadku sesji zgłaszającego najwyższego poziomu bezpośrednie dostarczanie w trybie ukończenia najpierw
rozwiązuje dowolną powiązaną trasę rozmowy/wątku i nadpisanie hooka, a następnie uzupełnia
brakujące pola celu kanału z zapisanej trasy sesji zgłaszającego.
Dzięki temu ukończenia trafiają na właściwy czat/temat nawet wtedy, gdy źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci jest ograniczona do bieżącego uruchomienia zgłaszającego podczas
tworzenia wyników zagnieżdżonych ukończeń, co zapobiega przeciekaniu przestarzałych wyników dzieci
z wcześniejszych uruchomień do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują
trasowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` lub `cron`                                                                                         |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                  |
| Typ            | Typ ogłoszenia + etykieta zadania                                                                             |
| Status         | Pochodny od wyniku środowiska uruchomieniowego (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult       |
| Dalsza odpowiedź | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho                                            |

Końcowe nieudane uruchomienia zgłaszają status niepowodzenia bez odtwarzania przechwyconego
tekstu odpowiedzi. Przy przekroczeniu limitu czasu, jeśli dziecko dotarło tylko do wywołań narzędzi, ogłoszenie
może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast
odtwarzać surowy wynik narzędzia.

### Wiersz statystyk

Ładunki ogłoszeń zawierają wiersz statystyk na końcu (nawet po zawinięciu):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkryptu, aby agent główny mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone tylko do orkiestracji; odpowiedzi skierowane do użytkownika
należy przepisać normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` to bezpieczniejsza ścieżka orkiestracji:

- Pamięć asystenta jest najpierw normalizowana: tagi myślenia usuwane; rusztowanie `<relevant-memories>` / `<relevant_memories>` usuwane; bloki ładunku XML wywołań narzędzi w zwykłym tekście (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) usuwane, w tym ucięte ładunki, które nigdy nie zamykają się poprawnie; zdegradowane rusztowanie wywołań/wyników narzędzi oraz znaczniki kontekstu historycznego usuwane; wyciekłe tokeny sterujące modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnoszerokościowe `<｜...｜>`) usuwane; niepoprawny XML wywołań narzędzi MiniMax usuwany.
- Tekst przypominający dane uwierzytelniające/tokeny jest redagowany.
- Długie bloki mogą zostać ucięte.
- Bardzo duże historie mogą usuwać starsze wiersze lub zastąpić nadmiernie duży wiersz komunikatem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkryptu na dysku jest fallbackiem, gdy potrzebujesz pełnego transkryptu bajt w bajt.

## Zasady narzędzi

Subagenty najpierw używają tego samego profilu i potoku zasad narzędzi co rodzic lub
agent docelowy. Następnie OpenClaw stosuje warstwę ograniczeń subagenta.

Bez restrykcyjnego `tools.profile` subagenty otrzymują **wszystkie narzędzia z wyjątkiem
narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` także tutaj pozostaje ograniczonym, oczyszczonym widokiem przypominania —
nie jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, subagenty orkiestrujące na głębokości 1 dodatkowo
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

`tools.subagents.tools.allow` to końcowy filtr typu allow-only. Może zawęzić
już rozstrzygnięty zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` zawiera
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby umożliwić
podagentom profilu coding używanie automatyzacji przeglądarki, dodaj browser na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj `agents.list[].tools.alsoAllow: ["browser"]` dla poszczególnego agenta, gdy tylko jeden
agent powinien otrzymać automatyzację przeglądarki.

## Współbieżność

Podagenci używają dedykowanej kolejki działającej w tym samym procesie:

- **Nazwa kolejki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że
podagent nadal działa. Niezakończone uruchomienia starsze niż okno przestarzałego uruchomienia
przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu,
bramkowaniu ukończenia potomków oraz sprawdzeniach współbieżności dla sesji.

Po ponownym uruchomieniu Gateway przestarzałe, niezakończone odtworzone uruchomienia są przycinane, chyba że
ich sesja podrzędna jest oznaczona jako `abortedLastRun: true`. Te
sesje podrzędne przerwane przez restart pozostają możliwe do odzyskania przez przepływ odzyskiwania osieroconego podagenta, który wysyła syntetyczną wiadomość wznowienia przed
wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone dla każdej sesji podrzędnej. Jeśli ten sam
podagent podrzędny jest wielokrotnie akceptowany do odzyskiwania osieroconego uruchomienia w obrębie
okna szybkiego ponownego zakleszczenia, OpenClaw utrwala na tej
sesji znacznik tombstone odzyskiwania i przestaje automatycznie wznawiać ją po późniejszych restartach. Uruchom
`openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo
`openclaw doctor --fix`, aby wyczyścić przestarzałe flagi przerwanego odzyskiwania w
sesjach oznaczonych tombstone.

<Note>
Jeśli uruchomienie podagenta nie powiedzie się z Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, sprawdź wywołującego RPC przed edytowaniem stanu parowania.
Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako
`client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie
uwierzytelnianie local loopback współdzielonym tokenem/hasłem; ta ścieżka nie zależy od
bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokenu urządzenia oraz klienci przeglądarkowi/node
nadal wymagają normalnego zatwierdzenia urządzenia dla podniesienia zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia podagentów wywołane z niej, kaskadowo obejmując zagnieżdżone dzieci.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo zatrzymuje jego dzieci.

## Ograniczenia

- Ogłaszanie podagenta działa na zasadzie **best-effort**. Jeśli gateway zostanie ponownie uruchomiony, oczekująca praca typu „announce back” zostanie utracona.
- Podagenci nadal współdzielą te same zasoby procesu gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst podagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia to 5 (zakres `maxSpawnDepth`: 1–5). Dla większości przypadków użycia zalecana jest głębokość 2.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie do agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
