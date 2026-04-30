---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pośrednictwem agenta
    - Zmieniasz sessions_spawn lub zasady narzędzia podagenta
    - Wdrażasz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj odizolowane przebiegi agentów w tle, które przekazują wyniki z powrotem na czat osoby zgłaszającej
title: Podagenci
x-i18n:
    generated_at: "2026-04-30T16:30:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

Subagenci to działające w tle uruchomienia agentów tworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem w kanale czatu
żądającego. Każde uruchomienie subagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoległe wykonywanie prac typu „badanie / długie zadanie / wolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja subagentów (oddzielenie sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: subagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestratora.

<Note>
**Uwaga dotycząca kosztów:** każdy subagent domyślnie ma własny kontekst i własne użycie tokenów. W przypadku ciężkich lub powtarzalnych zadań ustaw tańszy model dla subagentów, a głównego agenta pozostaw na modelu wyższej jakości. Skonfiguruj to przez `agents.defaults.subagents.model` lub nadpisania dla poszczególnych agentów. Gdy proces podrzędny rzeczywiście potrzebuje bieżącej transkrypcji żądającego, agent może zażądać `context: "fork"` przy tym jednym utworzeniu.
</Note>

## Polecenie ukośnikowe

Użyj `/subagents`, aby sprawdzić lub kontrolować uruchomienia subagentów dla **bieżącej
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
ścieżkę transkrypcji, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przypominania; sprawdź ścieżkę transkrypcji na dysku, gdy
potrzebujesz surowej pełnej transkrypcji.

### Kontrolki powiązania wątku

Te polecenia działają w kanałach obsługujących trwałe powiązania wątków.
Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) poniżej.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Zachowanie tworzenia

`/subagents spawn` uruchamia subagenta w tle jako polecenie użytkownika (nie jako
wewnętrzne przekazanie) i wysyła jedną końcową aktualizację o zakończeniu z powrotem do
czatu żądającego po zakończeniu uruchomienia.

<AccordionGroup>
  <Accordion title="Nieblokujące zakończenie oparte na wypychaniu">
    - Polecenie tworzenia jest nieblokujące; natychmiast zwraca identyfikator uruchomienia.
    - Po zakończeniu subagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem w kanale czatu żądającego.
    - Zakończenie jest oparte na wypychaniu. Po utworzeniu **nie** odpytuj w pętli `/subagents list`, `sessions_list` ani `sessions_history` tylko po to, aby poczekać na zakończenie; sprawdzaj status tylko na żądanie podczas debugowania lub interwencji.
    - Po zakończeniu OpenClaw w miarę możliwości zamyka śledzone karty/procesy przeglądarki otwarte przez tę sesję subagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Odporność dostarczania przy ręcznym tworzeniu">
    - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
    - Jeśli bezpośrednie dostarczenie się nie powiedzie, używa zastępczo routingu przez kolejkę.
    - Jeśli routing przez kolejkę nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostateczną rezygnacją.
    - Dostarczenie zakończenia zachowuje rozstrzygniętą trasę żądającego: trasy zakończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło zakończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto na podstawie rozstrzygniętej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało.

  </Accordion>
  <Accordion title="Metadane przekazania zakończenia">
    Przekazanie zakończenia do sesji żądającego to generowany w czasie wykonywania
    kontekst wewnętrzny (nie tekst autorstwa użytkownika) i zawiera:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult. Zakończone niepowodzeniem uruchomienia terminalne nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Zwięzłe statystyki czasu wykonywania/tokenów.
    - Instrukcję dostarczenia informującą agenta żądającego, aby przepisał odpowiedź normalnym głosem asystenta (a nie przekazywał surowe metadane wewnętrzne).

  </Accordion>
  <Accordion title="Tryby i środowisko wykonawcze ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po zakończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). W przypadku trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - W przypadku sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode lub jawne Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza to środowisko wykonawcze. Zobacz [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania zakończeń lub pętli agent-agent. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie prosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"` do momentu, gdy ACP jest włączone, żądający nie działa w sandboxie, a backendowy Plugin, taki jak `acpx`, jest załadowany. `runtime: "acp"` oczekuje zewnętrznego identyfikatora uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; użyj domyślnego środowiska wykonawczego subagenta dla zwykłych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni subagenci uruchamiają się izolowani, chyba że wywołujący jawnie poprosi o rozgałęzienie
bieżącej transkrypcji.

| Tryb       | Kiedy go używać                                                                                                                        | Zachowanie                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badanie, niezależna implementacja, wolna praca narzędziowa lub wszystko, co można opisać w tekście zadania                      | Tworzy czystą transkrypcję podrzędną. To ustawienie domyślne i zmniejsza użycie tokenów. |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub niuansowanych instrukcji już obecnych w transkrypcji żądającego | Rozgałęzia transkrypcję żądającego do sesji podrzędnej przed startem procesu podrzędnego. |

Używaj `fork` oszczędnie. Służy do delegowania wrażliwego na kontekst, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia subagenta z `deliver: false` na globalnym torze `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale
czatu żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
nie udostępnia go; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, którzy powinni delegować
pracę. Polityki kanału/grupy, dostawcy, sandboxa oraz zezwalania/odmawiania dla poszczególnych agentów mogą
nadal usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla poszczególnych agentów); jawne `sessions_spawn.model` nadal wygrywa.
- **Thinking:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla poszczególnych agentów); jawne `sessions_spawn.thinking` nadal wygrywa.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` jest pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie używa wartości zastępczej `0` (bez limitu czasu).

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla subagenta.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna czytelna dla człowieka etykieta.
</ParamField>
<ParamField path="agentId" type="string">
  Utwórz pod innym identyfikatorem agenta, gdy zezwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone tylko dla zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie zażądanego Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` ma wartość `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane przy tworzeniu natywnych subagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje dane wyjściowe uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń przy tworzeniu natywnych subagentów.
</ParamField>
<ParamField path="model" type="string">
  Nadpisz model subagenta. Nieprawidłowe wartości są pomijane, a subagent działa na domyślnym modelu z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisz poziom Thinking dla uruchomienia subagenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione, w przeciwnym razie `0`. Gdy ustawione, uruchomienie subagenta jest przerywane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania wątku kanału dla tej sesji subagenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i `mode` pominięto, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypcję przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca tworzenie, chyba że docelowe środowisko wykonawcze procesu podrzędnego działa w sandboxie.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżącą transkrypcję żądającego do sesji podrzędnej. Tylko natywni subagenci. Używaj `fork` tylko wtedy, gdy proces podrzędny potrzebuje bieżącej transkrypcji.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałem (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z utworzonego uruchomienia.
</Warning>

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, subagent może pozostać powiązany
z wątkiem, aby kolejne wiadomości użytkownika w tym wątku nadal były kierowane do
tej samej sesji subagenta.

### Kanały obsługujące wątki

**Discord** jest obecnie jedynym obsługiwanym kanałem. Obsługuje
trwałe sesje subagentów powiązane z wątkiem (`sessions_spawn` z
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
    OpenClaw tworzy lub wiąże wątek z tym celem sesji w aktywnym kanale.
  </Step>
  <Step title="Kieruj dalsze wiadomości">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdź limity czasu">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne cofnięcie skupienia przy braku aktywności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłącz">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Ręczne kontrolki

| Polecenie          | Efekt                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz go) z docelowym podagentem/sesją      |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                        |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne odwiązanie po bezczynności (tylko skoncentrowane powiązane wątki) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit czasu (tylko skoncentrowane powiązane wątki) |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego powiązania przy uruchomieniu** zależą od adaptera. Zobacz powyżej [Kanały obsługujące wątki](#thread-supporting-channels).

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference) oraz
[Polecenia slash](/pl/tools/slash-commands), aby poznać bieżące szczegóły adapterów.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, do których można kierować przez jawne `agentId` (`["*"]` zezwala na dowolny). Domyślnie: tylko agent żądający. Jeśli ustawisz listę i nadal chcesz, aby agent żądający uruchamiał samego siebie z `agentId`, uwzględnij jego identyfikator na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuj wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jeśli sesja żądająca działa w sandboxie, `sessions_spawn` odrzuca cele,
które działałyby poza sandboxem.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska uruchomieniowego, dzięki czemu wywołujący mogą odróżnić PI, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska uruchomieniowe.

### Automatyczna archiwizacja

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po powiadomieniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczna archiwizacja działa na zasadzie najlepszej możliwej próby; oczekujące timery przepadają, jeśli Gateway zostanie zrestartowany.
- `runTimeoutSeconds` **nie** archiwizuje automatycznie; tylko zatrzymuje uruchomienie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy tak samo sesji na głębokości 1 i głębokości 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane na zasadzie najlepszej możliwej próby po zakończeniu uruchomienia, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżone podagenty

Domyślnie podagenty nie mogą uruchamiać własnych podagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → podagent orkiestrator →
podpodagenty robocze.

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

| Głębokość | Kształt klucza sesji                         | Rola                                          | Może uruchamiać?             |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Główny agent                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy dozwolona jest głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Podpodagent (pracownik liściowy)              | Nigdy                        |

### Łańcuch powiadomień

Wyniki przepływają z powrotem w górę łańcucha:

1. Pracownik na głębokości 2 kończy → powiadamia swojego rodzica (orkiestratora na głębokości 1).
2. Orkiestrator na głębokości 1 odbiera powiadomienie, syntetyzuje wyniki, kończy → powiadamia głównego agenta.
3. Główny agent odbiera powiadomienie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko powiadomienia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę dziecka raz i czekaj na zdarzenia
ukończenia, zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń uśpienia `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skoncentrowane na aktywnej pracy — aktywne dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótkie okno ostatniej aktywności, a nieaktualne linki dzieci istniejące tylko w magazynie są
ignorowane po ich oknie świeżości. Zapobiega to wskrzeszaniu pozornych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po restarcie. Jeśli zdarzenie ukończenia dziecka nadejdzie po tym, jak wysłano już
końcową odpowiedź, prawidłową odpowiedzią uzupełniającą jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Zasady narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie uruchomienia. Dzięki temu płaskie lub odtworzone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (bieżące zachowanie domyślne).
- **Głębokość 2 (pracownik liściowy):** brak narzędzi sesji — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może uruchamiać dalszych dzieci.

### Limit uruchomień na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z pojedynczego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora na głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
na głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów na głębokości 1 i kaskadowo zatrzymuje ich dzieci na głębokości 2.
- `/subagents kill <id>` zatrzymuje określonego podagenta i kaskadowo zatrzymuje jego dzieci.
- `/subagents kill all` zatrzymuje wszystkie podagenty dla agenta żądającego i stosuje kaskadę.

## Uwierzytelnianie

Uwierzytelnianie podagenta jest rozwiązywane według **identyfikatora agenta**, a nie według typu sesji:

- Klucz sesji podagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **wartość zapasowa**; profile agenta zastępują profile główne w razie konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
wartości zapasowe. W pełni izolowane uwierzytelnianie dla każdego agenta nie jest jeszcze obsługiwane.

## Powiadomienie

Podagenty raportują z powrotem przez krok powiadomienia:

- Krok powiadomienia działa wewnątrz sesji podagenta (nie w sesji żądającej).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wyjście powiadomienia jest tłumione, nawet jeśli wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości agenta żądającego:

- Sesje żądające najwyższego poziomu używają uzupełniającego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje podagentów żądających otrzymują wewnętrzne wstrzyknięcie uzupełniające (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja podagenta żądającego zniknie, OpenClaw wraca do agenta żądającego tej sesji, gdy jest dostępny.

W przypadku sesji żądających najwyższego poziomu dostarczanie bezpośrednie w trybie ukończenia najpierw
rozwiązuje każdą powiązaną trasę konwersacji/wątku i nadpisanie hooka, a następnie uzupełnia
brakujące pola docelowe kanału z zapisanej trasy sesji żądającej.
Dzięki temu ukończenia trafiają do właściwego czatu/tematu nawet wtedy, gdy źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci jest ograniczona do bieżącego uruchomienia agenta żądającego podczas
budowania zagnieżdżonych wyników ukończenia, co zapobiega wyciekom wyjść dzieci
z nieaktualnych wcześniejszych uruchomień do bieżącego powiadomienia. Odpowiedzi powiadomień zachowują
trasowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.

### Kontekst powiadomienia

Kontekst powiadomienia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` lub `cron`                                                                                         |
| Identyfikatory sesji | Klucz/identyfikator sesji dziecka                                                                       |
| Typ            | Typ powiadomienia + etykieta zadania                                                                          |
| Status         | Pochodny od wyniku środowiska uruchomieniowego (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult       |
| Uzupełnienie   | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho                                             |

Końcowe nieudane uruchomienia raportują status niepowodzenia bez ponownego odtwarzania przechwyconego
tekstu odpowiedzi. Przy przekroczeniu limitu czasu, jeśli dziecko zdążyło wykonać tylko wywołania narzędzi, powiadomienie
może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast
odtwarzać surowe wyjście narzędzia.

### Wiersz statystyk

Ładunki powiadomień zawierają na końcu wiersz statystyk (nawet gdy są zawinięte):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modelu (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkryptu, aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone wyłącznie do orkiestracji; odpowiedzi
widoczne dla użytkownika powinny zostać przepisane normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- Przywołanie asystenta jest najpierw normalizowane: tagi myślenia są usuwane; szkielet `<relevant-memories>` / `<relevant_memories>` jest usuwany; zwykłotekstowe bloki ładunku XML wywołań narzędzi (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) są usuwane, w tym obcięte ładunki, które nigdy nie zamykają się poprawnie; zdegradowany szkielet wywołań/wyników narzędzi oraz znaczniki kontekstu historycznego są usuwane; wyciekłe tokeny sterujące modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnej szerokości `<｜...｜>`) są usuwane; niepoprawny XML wywołań narzędzi MiniMax jest usuwany.
- Tekst podobny do poświadczeń/tokenów jest redagowany.
- Długie bloki mogą być obcinane.
- Bardzo duże historie mogą odrzucać starsze wiersze lub zastępować zbyt duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkryptu na dysku jest rozwiązaniem zapasowym, gdy potrzebujesz pełnego transkryptu bajt po bajcie.

## Zasady narzędzi

Podagenty używają najpierw tego samego profilu i potoku zasad narzędzi co agent nadrzędny lub
docelowy. Następnie OpenClaw stosuje warstwę ograniczeń
podagenta.

Bez restrykcyjnego `tools.profile` podagenty otrzymują **wszystkie narzędzia oprócz
narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` również tutaj pozostaje ograniczonym, oczyszczonym widokiem przywołania —
nie jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, podagenty orkiestratorów na głębokości 1 dodatkowo
otrzymują `sessions_spawn`, `subagents`, `sessions_list` oraz
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

`tools.subagents.tools.allow` to końcowy filtr typu tylko zezwalaj. Może zawęzić
już rozstrzygnięty zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby pozwolić
subagentom z profilu kodowania używać automatyzacji przeglądarki, dodaj browser na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj `agents.list[].tools.alsoAllow: ["browser"]` dla konkretnego agenta, gdy tylko jeden
agent ma otrzymać automatyzację przeglądarki.

## Współbieżność

Subagenci używają dedykowanego toru kolejki w procesie:

- **Nazwa toru:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że
subagent nadal działa. Niezakończone uruchomienia starsze niż okno przedawnionego uruchomienia
przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach stanu,
bramkowaniu ukończenia potomków i sprawdzeniach współbieżności na sesję.

Po ponownym uruchomieniu Gateway przedawnione niezakończone odtworzone uruchomienia są przycinane, chyba że
ich sesja podrzędna jest oznaczona jako `abortedLastRun: true`. Te
sesje podrzędne przerwane przez restart pozostają odzyskiwalne przez przepływ
odzyskiwania osieroconych subagentów, który wysyła syntetyczną wiadomość wznowienia przed
wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone dla każdej sesji podrzędnej. Jeśli ten sam
subagent podrzędny jest wielokrotnie akceptowany do odzyskiwania osierocenia w obrębie
szybkiego okna ponownego zablokowania, OpenClaw zapisuje na tej
sesji nagrobek odzyskiwania i przestaje automatycznie wznawiać ją przy późniejszych restartach. Uruchom
`openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo
`openclaw doctor --fix`, aby wyczyścić przedawnione flagi przerwanego odzyskiwania w
sesjach z nagrobkiem.

<Note>
Jeśli utworzenie subagenta kończy się błędem Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, sprawdź wywołującego RPC przed edycją stanu parowania.
Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako
`client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie
uwierzytelnianie loopback współdzielonym tokenem/hasłem; ta ścieżka nie zależy od
bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokenu urządzenia oraz klienci przeglądarkowi/node
nadal wymagają normalnej zgody urządzenia na rozszerzenia zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` w czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia subagentów utworzone z niej, kaskadowo obejmując zagnieżdżone elementy podrzędne.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i kaskadowo obejmuje jego elementy podrzędne.

## Ograniczenia

- Ogłaszanie subagenta działa **w trybie najlepszych starań**. Jeśli Gateway zostanie ponownie uruchomiony, oczekująca praca typu „ogłoś z powrotem” zostanie utracona.
- Subagenci nadal współdzielą te same zasoby procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` zawsze działa nieblokująco: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst subagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Dla większości przypadków użycia zalecana jest głębokość 2.
- `maxChildrenPerAgent` ogranicza aktywne elementy podrzędne na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
