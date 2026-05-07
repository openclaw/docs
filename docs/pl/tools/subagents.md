---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pośrednictwem agenta
    - Zmieniasz `sessions_spawn` lub zasady narzędzi subagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agentów w tle, które przekazują wyniki z powrotem na czat osoby zgłaszającej
title: Podagenci
x-i18n:
    generated_at: "2026-05-07T01:55:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

Subagenci to uruchomienia agentów w tle, tworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem na kanale czatu
żądającego. Każde uruchomienie subagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Informacje o modelu bezpieczeństwa stojącym za delegowaniem znajdziesz w
[Granicach wielu agentów i subagentów](/pl/gateway/security#multi-agent-and-sub-agent-boundaries).
Subagenci są użytecznymi jednostkami izolacji i przepływu pracy, ale nie są wrogą
granicą autoryzacji wielodzierżawnej w ramach jednego współdzielonego Gateway.

Główne cele:

- Równoleglenie pracy typu „badanie / długie zadanie / wolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja subagentów (separacja sesji + opcjonalne sandboxowanie).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: subagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżania dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy subagent ma domyślnie własny kontekst i zużycie tokenów.
W przypadku ciężkich lub powtarzalnych zadań ustaw tańszy model dla subagentów
i pozostaw głównego agenta na modelu wyższej jakości. Skonfiguruj przez
`agents.defaults.subagents.model` lub nadpisania dla poszczególnych agentów. Gdy proces potomny
    rzeczywiście potrzebuje bieżącej transkrypcji żądającego, agent może zażądać
    `context: "fork"` przy tym jednym uruchomieniu. Sesje subagentów powiązane z wątkiem domyślnie używają
    `context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do
    wątku kontynuacji.
</Note>

## Polecenie ukośnikowe

Użyj `/subagents`, aby sprawdzać lub kontrolować uruchomienia subagentów dla **bieżącej
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

Użyj najwyższego poziomu [`/steer <message>`](/pl/tools/steer), aby sterować aktywnym uruchomieniem bieżącej sesji żądającego. Użyj `/subagents steer <id|#> <message>`, gdy celem jest uruchomienie potomne.

`/subagents info` pokazuje metadane uruchomienia (status, znaczniki czasu, identyfikator sesji,
ścieżkę transkrypcji, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przywołania; sprawdź ścieżkę transkrypcji na dysku, gdy
potrzebujesz surowej pełnej transkrypcji.

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

### Zachowanie uruchamiania

`/subagents spawn` uruchamia subagenta w tle jako polecenie użytkownika (nie jako
wewnętrzne przekazanie) i wysyła jedną końcową aktualizację o ukończeniu z powrotem do
czatu żądającego po zakończeniu uruchomienia.

<AccordionGroup>
  <Accordion title="Nieblokujące ukończenie oparte na wypychaniu">
    - Polecenie uruchomienia jest nieblokujące; natychmiast zwraca identyfikator uruchomienia.
    - Po ukończeniu subagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem na kanale czatu żądającego.
    - Ukończenie jest oparte na wypychaniu. Po uruchomieniu **nie** odpytuj `/subagents list`, `sessions_list` ani `sessions_history` w pętli tylko po to, aby czekać na zakończenie; sprawdzaj status tylko na żądanie w celu debugowania lub interwencji.
    - Po ukończeniu OpenClaw w miarę możliwości zamyka śledzone karty przeglądarki/procesy otwarte przez tę sesję subagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Odporność dostarczania ręcznego uruchomienia">
    - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
    - Jeśli tura ukończenia agenta żądającego zawiedzie, nie wygeneruje widocznego wyjścia albo zwróci oczywiście niekompletny prefiks przechwyconego wyniku procesu potomnego, OpenClaw przełącza się na bezpośrednie dostarczenie ukończenia z przechwyconego wyniku procesu potomnego.
    - Jeśli nie można użyć bezpośredniego dostarczania, następuje przełączenie awaryjne na trasowanie przez kolejkę.
    - Jeśli trasowanie przez kolejkę nadal nie jest dostępne, ogłoszenie jest ponawiane z krótkim wykładniczym wycofaniem przed ostatecznym poddaniem się.
    - Dostarczanie ukończenia zachowuje rozwiązaną trasę żądającego: trasy ukończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło ukończenia dostarcza tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczanie nadal działało.

  </Accordion>
  <Accordion title="Metadane przekazania ukończenia">
    Przekazanie ukończenia do sesji żądającego to generowany w czasie wykonywania
    wewnętrzny kontekst (nie tekst autorstwa użytkownika), który obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult. Końcowe nieudane uruchomienia nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Zwięzłe statystyki czasu wykonywania/tokenów.
    - Instrukcję dostarczenia nakazującą agentowi żądającemu przepisać odpowiedź normalnym głosem asystenta (nie przekazywać surowych metadanych wewnętrznych).

  </Accordion>
  <Accordion title="Tryby i środowisko wykonawcze ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i wyjście po ukończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). W przypadku trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - W przypadku sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode lub jawne Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza to środowisko wykonawcze. Zobacz [Model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń lub pętli agent-agent. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"`, dopóki ACP nie jest włączone, żądający nie jest sandboxowany, a backendowy Plugin taki jak `acpx` nie jest załadowany. `runtime: "acp"` oczekuje zewnętrznego identyfikatora uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; używaj domyślnego środowiska wykonawczego subagentów dla normalnych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni subagenci startują w izolacji, chyba że wywołujący jawnie poprosi o rozgałęzienie
bieżącej transkrypcji.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badanie, niezależna implementacja, wolna praca narzędziowa albo cokolwiek, co można opisać w tekście zadania                    | Tworzy czystą transkrypcję procesu potomnego. To ustawienie domyślne i utrzymuje niższe zużycie tokenów. |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub niuansów instrukcji już obecnych w transkrypcji żądającego      | Rozgałęzia transkrypcję żądającego do sesji potomnej przed startem procesu potomnego. |

Używaj `fork` oszczędnie. Służy do delegowania wrażliwego na kontekst, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia subagenta z `deliver: false` na globalnej ścieżce `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia na kanale czatu
żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
tego nie robi; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, które powinny delegować
pracę. Polityki kanału/grupy, dostawcy, sandboxu oraz allow/deny dla poszczególnych agentów mogą
nadal usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla poszczególnych agentów); jawne `sessions_spawn.model` nadal wygrywa.
- **Thinking:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla poszczególnych agentów); jawne `sessions_spawn.thinking` nadal wygrywa.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` jest pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (bez limitu czasu).

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla subagenta.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Uruchom pod innym identyfikatorem agenta, gdy pozwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone tylko dla zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie żądane Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane dla natywnych uruchomień subagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje wyjście uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń dla natywnych uruchomień subagentów.
</ParamField>
<ParamField path="model" type="string">
  Nadpisuje model subagenta. Nieprawidłowe wartości są pomijane, a subagent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisuje poziom thinking dla uruchomienia subagenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione, w przeciwnym razie `0`. Po ustawieniu uruchomienie subagenta jest przerywane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda wiązania wątku kanału dla tej sesji subagenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i `mode` pominięto, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypcję przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca uruchomienie, chyba że docelowe środowisko wykonawcze procesu potomnego jest sandboxowane.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżącą transkrypcję żądającego do sesji potomnej. Tylko natywni subagenci. Uruchomienia powiązane z wątkiem domyślnie używają `fork`; uruchomienia bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z uruchomionego procesu.
</Warning>

## Sesje powiązane z wątkiem

Gdy wiązania wątków są włączone dla kanału, subagent może pozostać powiązany
z wątkiem, aby kolejne wiadomości użytkownika w tym wątku nadal były trasowane do
tej samej sesji subagenta.

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
  <Step title="Spawn">
    `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw tworzy albo wiąże wątek z docelową sesją w aktywnym kanale.
  </Step>
  <Step title="Route follow-ups">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Inspect timeouts">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne cofnięcie fokusu po bezczynności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Detach">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Ręczne sterowanie

| Polecenie          | Efekt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (albo utwórz go) z docelowym sub-agentem/sesją   |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                       |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` albo `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne cofnięcie fokusu po bezczynności (tylko wątki powiązane z fokusem) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko wątki powiązane z fokusem)    |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego wiązania przy tworzeniu** zależą od adaptera. Zobacz [kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [odniesienie konfiguracji](/pl/gateway/configuration-reference) i
[polecenia slash](/pl/tools/slash-commands), aby poznać bieżące szczegóły adapterów.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, które mogą być celem przez jawne `agentId` (`["*"]` pozwala na dowolny). Domyślnie: tylko agent żądający. Jeśli ustawisz listę i nadal chcesz, aby żądający uruchamiał siebie z `agentId`, uwzględnij identyfikator żądającego na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuj wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jeśli sesja żądającego działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby poza piaskownicą.

### Wykrywanie

Użyj `agents_list`, aby sprawdzić, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska uruchomieniowego, aby wywołujący mogli odróżnić Pi, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska uruchomieniowe.

### Automatyczna archiwizacja

- Sesje sub-agentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczna archiwizacja działa na zasadzie najlepszych starań; oczekujące timery przepadają, jeśli gateway zostanie zrestartowany.
- `runTimeoutSeconds` **nie** archiwizuje automatycznie; tylko zatrzymuje uruchomienie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja ma zastosowanie zarówno do sesji poziomu głębokości 1, jak i 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane na zasadzie najlepszych starań po zakończeniu uruchomienia, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżone sub-agenty

Domyślnie sub-agenty nie mogą uruchamiać własnych sub-agentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżania — **wzorzec orkiestratora**: główny → sub-agent orkiestrator →
robocze sub-sub-agenty.

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

| Głębokość | Kształt klucza sesji                          | Rola                                          | Może uruchamiać?             |
| --------- | --------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                             | Główny agent                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                  | Sub-agent (orkiestrator, gdy dozwolona jest głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Sub-sub-agent (pracownik liściowy)            | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki przepływają w górę łańcucha:

1. Pracownik głębokości 2 kończy → ogłasza do swojego rodzica (orkiestratora głębokości 1).
2. Orkiestrator głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do głównego.
3. Główny agent odbiera ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** rozpocznij pracę dziecka raz i czekaj na zdarzenia
zakończenia, zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` albo poleceń uśpienia `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji potomnych
skupione na pracy na żywo — aktywne dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótkie ostatnie okno, a nieświeże łącza dzieci istniejące tylko w magazynie są
ignorowane po upływie ich okna świeżości. Zapobiega to wskrzeszaniu widmowych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po restarcie. Jeśli zdarzenie zakończenia dziecka nadejdzie po wysłaniu
końcowej odpowiedzi, poprawną reakcją jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Zasady narzędzi według głębokości

- Rola i zakres sterowania są zapisywane w metadanych sesji w momencie tworzenia. Dzięki temu płaskie albo przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (bieżące zachowanie domyślne).
- **Głębokość 2 (pracownik liściowy):** brak narzędzi sesji — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może uruchamiać dalszych dzieci.

### Limit tworzenia na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z pojedynczego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo zatrzymuje ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego sub-agenta i kaskadowo zatrzymuje jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich sub-agentów żądającego i uruchamia kaskadę.

## Uwierzytelnianie

Uwierzytelnianie sub-agenta jest rozstrzygane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji sub-agenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **awaryjne**; profile agenta nadpisują profile główne w razie konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
awaryjne. W pełni izolowane uwierzytelnianie na agenta nie jest jeszcze obsługiwane.

## Ogłoszenie

Sub-agenty zgłaszają się z powrotem przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji sub-agenta (nie sesji żądającego).
- Jeśli sub-agent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, dane wyjściowe ogłoszenia są tłumione, nawet jeśli wcześniej istniał widoczny postęp.

Dostarczanie zależy od głębokości żądającego:

- Sesje żądających najwyższego poziomu używają kolejnego wywołania `agent` z dostarczaniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje subagentów żądających otrzymują wewnętrzne wstrzyknięcie follow-up (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja subagenta żądającego zniknęła, OpenClaw wraca do żądającego tej sesji, gdy jest dostępny.

W przypadku sesji żądających najwyższego poziomu bezpośrednie dostarczanie w trybie zakończenia najpierw
rozwiązuje każdą powiązaną trasę rozmowy/wątku i nadpisanie hooka, a następnie wypełnia
brakujące pola celu kanału z zapisanej trasy sesji żądającego.
Dzięki temu zakończenia trafiają do właściwego czatu/tematu, nawet gdy źródło zakończenia
identyfikuje tylko kanał.

Agregacja zakończeń dzieci jest ograniczona do bieżącego uruchomienia żądającego podczas
budowania zagnieżdżonych ustaleń zakończenia, co zapobiega przeciekaniu nieświeżych danych wyjściowych dzieci
z poprzedniego uruchomienia do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują
trasowanie wątków/tematów, gdy jest dostępne w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` albo `cron`                                                                                        |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                 |
| Typ            | Typ ogłoszenia + etykieta zadania                                                                             |
| Status         | Wyprowadzony z wyniku środowiska uruchomieniowego (`success`, `error`, `timeout` albo `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult       |
| Follow-up      | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho                                              |

Końcowe nieudane uruchomienia zgłaszają status niepowodzenia bez odtwarzania przechwyconego
tekstu odpowiedzi. Przy przekroczeniu czasu, jeśli dziecko zdążyło tylko wykonać wywołania narzędzi, ogłoszenie
może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast
odtwarzać surowe dane wyjściowe narzędzi.

### Wiersz statystyk

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet gdy są zawijane):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modelu (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkryptu, aby główny agent mógł pobrać historię przez `sessions_history` albo sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone wyłącznie do orkiestracji; odpowiedzi widoczne dla użytkownika
powinny zostać przepisane normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` to bezpieczniejsza ścieżka orkiestracji:

- Przywołanie asystenta jest najpierw normalizowane: tagi myślenia usuwane; rusztowanie `<relevant-memories>` / `<relevant_memories>` usuwane; bloki ładunków XML wywołań narzędzi w zwykłym tekście (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) usuwane, w tym ucięte ładunki, które nigdy nie zamykają się poprawnie; zdegradowane rusztowanie wywołań/wyników narzędzi oraz znaczniki kontekstu historycznego usuwane; wyciekłe tokeny sterujące modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnej szerokości `<｜...｜>`) usuwane; wadliwy XML wywołań narzędzi MiniMax usuwany.
- Tekst przypominający poświadczenia/tokeny jest redagowany.
- Długie bloki mogą zostać skrócone.
- Bardzo duże historie mogą odrzucać starsze wiersze albo zastępować zbyt duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkryptu na dysku jest opcją awaryjną, gdy potrzebujesz pełnego transkryptu bajt w bajt.

## Zasady narzędzi

Podagenci najpierw używają tego samego profilu i potoku zasad narzędzi co agent nadrzędny lub docelowy. Następnie OpenClaw stosuje warstwę ograniczeń podagentów.

Bez restrykcyjnego `tools.profile` podagenci otrzymują **wszystkie narzędzia oprócz narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` również tutaj pozostaje ograniczonym, oczyszczonym widokiem przypominania — nie jest surowym zrzutem transkrypcji.

Gdy `maxSpawnDepth >= 2`, podagenci-orkiestratorzy na głębokości 1 dodatkowo otrzymują `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogli zarządzać swoimi dziećmi.

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

`tools.subagents.tools.allow` jest końcowym filtrem tylko zezwalającym. Może zawęzić już rozwiązany zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje `web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby pozwolić podagentom z profilem coding używać automatyzacji przeglądarki, dodaj browser na etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj `agents.list[].tools.alsoAllow: ["browser"]` dla konkretnego agenta, gdy tylko jeden agent powinien otrzymać automatyzację przeglądarki.

## Współbieżność

Podagenci używają dedykowanej kolejki lane w procesie:

- **Nazwa lane:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że podagent nadal działa. Niezakończone uruchomienia starsze niż okno nieaktualnego uruchomienia przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu, bramkowaniu ukończenia potomków i kontrolach współbieżności dla sesji.

Po restarcie Gateway nieaktualne niezakończone odtworzone uruchomienia są usuwane, chyba że ich sesja dziecka jest oznaczona jako `abortedLastRun: true`. Te przerwane przez restart sesje dzieci pozostają możliwe do odzyskania przez przepływ odzyskiwania osieroconych podagentów, który wysyła syntetyczną wiadomość wznowienia przed wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone dla każdej sesji dziecka. Jeśli to samo dziecko podagenta jest wielokrotnie akceptowane do odzyskiwania osieroconego w krótkim oknie ponownego zakleszczenia, OpenClaw zapisuje tombstone odzyskiwania w tej sesji i przestaje automatycznie wznawiać ją przy późniejszych restartach. Uruchom `openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo `openclaw doctor --fix`, aby wyczyścić nieaktualne flagi przerwanego odzyskiwania w sesjach z tombstone.

<Note>
Jeśli tworzenie podagenta kończy się niepowodzeniem z Gateway `PAIRING_REQUIRED` / `scope-upgrade`, sprawdź wywołującego RPC przed edycją stanu parowania. Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako `client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie uwierzytelnianie współdzielonym tokenem/hasłem przez local loopback; ta ścieżka nie zależy od bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne `deviceIdentity`, jawne ścieżki tokenu urządzenia oraz klienci przeglądarkowi/node nadal potrzebują normalnego zatwierdzenia urządzenia dla podniesień zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia podagentów utworzone z niej, kaskadowo obejmując zagnieżdżone dzieci.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo obejmuje jego dzieci.

## Ograniczenia

- Ogłoszenie podagenta działa **w trybie najlepszych starań**. Jeśli Gateway zostanie zrestartowany, oczekująca praca „announce back” zostanie utracona.
- Podagenci nadal współdzielą te same zasoby procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst podagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana w większości przypadków użycia.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [agenci ACP](/pl/tools/acp-agents)
- [wysyłanie agenta](/pl/tools/agent-send)
- [zadania w tle](/pl/automation/tasks)
- [narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
