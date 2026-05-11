---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pomocą agenta
    - Zmieniasz zasady narzędzia sessions_spawn lub podagenta
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów przypisanymi do wątków
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agentów w tle, które publikują wyniki z powrotem na czacie osoby zgłaszającej
title: Podagenci
x-i18n:
    generated_at: "2026-05-11T20:40:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Subagenci to uruchomienia agentów w tle, tworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem w kanale czatu
żądającego. Każde uruchomienie subagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoleglenie pracy typu „badanie / długie zadanie / wolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja subagentów (oddzielenie sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do błędnego użycia: subagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy subagent ma domyślnie własny kontekst
i własne użycie tokenów. W przypadku ciężkich lub powtarzalnych zadań ustaw
tańszy model dla subagentów, a głównego agenta pozostaw na modelu wyższej
jakości. Skonfiguruj to przez `agents.defaults.subagents.model` lub
nadpisania dla poszczególnych agentów. Gdy proces potomny rzeczywiście
    potrzebuje bieżącego transkryptu żądającego, agent może zażądać
    `context: "fork"` dla tego jednego uruchomienia. Sesje subagentów powiązane
    z wątkiem domyślnie używają `context: "fork"`, ponieważ rozgałęziają bieżącą
    rozmowę do wątku kontynuacji.
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

Użyj [`/steer <message>`](/pl/tools/steer) najwyższego poziomu, aby sterować aktywnym uruchomieniem bieżącej sesji żądającego. Użyj `/subagents steer <id|#> <message>`, gdy celem jest uruchomienie potomne.

`/subagents info` pokazuje metadane uruchomienia (status, znaczniki czasu, identyfikator sesji,
ścieżkę transkryptu, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przypomnienia; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego pełnego transkryptu.

### Kontrolki wiązania wątku

Te polecenia działają na kanałach obsługujących trwałe wiązania wątków.
Zobacz [kanały obsługujące wątki](#thread-supporting-channels) poniżej.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Zachowanie tworzenia

`/subagents spawn` uruchamia subagenta w tle jako polecenie użytkownika (nie jako
wewnętrzne przekazanie) i wysyła jedną końcową aktualizację o ukończeniu z powrotem do
czatu żądającego po zakończeniu uruchomienia.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Polecenie tworzenia nie blokuje; natychmiast zwraca identyfikator uruchomienia.
    - Po ukończeniu subagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem w kanale czatu żądającego.
    - Tury agenta, które potrzebują wyników procesów potomnych, powinny wywołać `sessions_yield` po utworzeniu wymaganej pracy. Kończy to bieżącą turę i pozwala zdarzeniom ukończenia dotrzeć jako następna wiadomość widoczna dla modelu.
    - Ukończenie działa w trybie push. Po utworzeniu uruchomienia **nie** odpytuj w pętli `/subagents list`, `sessions_list` ani `sessions_history` tylko po to, aby czekać na zakończenie; sprawdzaj status tylko na żądanie, do debugowania lub interwencji.
    - Dane wyjściowe procesu potomnego są raportem/dowodem dla agenta żądającego do syntezy. Nie są tekstem instrukcji napisanym przez użytkownika i nie mogą nadpisać polityki systemowej, deweloperskiej ani użytkownika.
    - Po ukończeniu OpenClaw w miarę możliwości zamyka śledzone karty/procesy przeglądarki otwarte przez tę sesję subagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw przekazuje ukończenia z powrotem do sesji żądającego przez turę `agent` ze stabilnym kluczem idempotencji.
    - Jeśli uruchomienie żądającego nadal jest aktywne, OpenClaw najpierw próbuje wybudzić/sterować tym uruchomieniem zamiast zaczynać drugą widoczną ścieżkę odpowiedzi.
    - Jeśli przekazanie ukończenia do agenta żądającego nie powiedzie się albo nie wygeneruje widocznych danych wyjściowych, OpenClaw traktuje dostarczenie jako nieudane i wraca do routingu kolejki/ponawiania. Nie wysyła surowego wyniku procesu potomnego bezpośrednio do zewnętrznego czatu.
    - Jeśli nie można użyć bezpośredniego przekazania, następuje powrót do routingu kolejki.
    - Jeśli routing kolejki nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostatecznym porzuceniem.
    - Dostarczanie ukończenia zachowuje rozwiązaną trasę żądającego: trasy ukończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło ukończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Przekazanie ukończenia do sesji żądającego to wygenerowany w czasie działania
    kontekst wewnętrzny (nie tekst napisany przez użytkownika) i obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult. Końcowe nieudane uruchomienia nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Zwięzłe statystyki czasu działania/tokenów.
    - Instrukcję dostarczenia nakazującą agentowi żądającemu przepisać odpowiedź normalnym głosem asystenta (nie przekazywać surowych metadanych wewnętrznych).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po ukończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - Dla sesji harness ACP (Claude Code, Gemini CLI, OpenCode albo jawny Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie deklaruje ten runtime. Zobacz [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń lub pętli agent-agent. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"` do czasu włączenia ACP, braku sandboxingu żądającego i załadowania backendowego Pluginu, takiego jak `acpx`. `runtime: "acp"` oczekuje zewnętrznego identyfikatora harness ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; używaj domyślnego runtime subagenta dla zwykłych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni subagenci startują w izolacji, chyba że wywołujący jawnie poprosi o rozgałęzienie
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badanie, niezależna implementacja, wolna praca narzędzia lub cokolwiek, co można opisać w tekście zadania                           | Tworzy czysty transkrypt potomny. To ustawienie domyślne i utrzymuje niższe użycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub niuansowanych instrukcji już obecnych w transkrypcie żądającego | Rozgałęzia transkrypt żądającego do sesji potomnej przed startem procesu potomnego. |

Używaj `fork` oszczędnie. Służy do delegowania zależnego od kontekstu, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia subagenta z `deliver: false` na globalnym torze `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale
czatu żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
tego nie robi; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, które powinny delegować
pracę. Polityki kanału/grupy, providera, sandboxingu oraz zezwalania/odmawiania dla poszczególnych agentów mogą
nadal usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** dziedziczy wywołującego, chyba że ustawisz `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla poszczególnych agentów); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- **Thinking:** dziedziczy wywołującego, chyba że ustawisz `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla poszczególnych agentów); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` zostanie pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (bez limitu czasu).

### Tryb promptu delegowania

`agents.defaults.subagents.delegationMode` kontroluje wyłącznie wskazówki promptu; nie zmienia polityki narzędzi ani nie wymusza delegowania.

- `suggest` (domyślnie): zachowuje standardową podpowiedź, aby używać subagentów do większej lub wolniejszej pracy.
- `prefer`: nakazuje głównemu agentowi pozostać responsywnym i delegować przez `sessions_spawn` wszystko, co jest bardziej złożone niż bezpośrednia odpowiedź.

Nadpisania dla poszczególnych agentów używają `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla subagenta.
</ParamField>
<ParamField path="taskName" type="string">
  Opcjonalny stabilny uchwyt do późniejszego kierowania przez `subagents`. Musi pasować do `[a-z][a-z0-9_]{0,63}` i nie może być zarezerwowanym celem, takim jak `last` lub `all`. Preferuj go, gdy koordynator może potrzebować sterować, zakończyć lub zidentyfikować konkretne dziecko po utworzeniu kilku dzieci.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Utwórz pod innym identyfikatorem agenta, gdy pozwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone tylko dla zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie żądanych Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane dla natywnego tworzenia subagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje wyjście uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń dla natywnego tworzenia subagentów.
</ParamField>
<ParamField path="model" type="string">
  Nadpisz model subagenta. Nieprawidłowe wartości są pomijane, a subagent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisz poziom rozumowania dla uruchomienia subagenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione, w przeciwnym razie `0`. Gdy jest ustawione, uruchomienie subagenta zostaje przerwane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania wątku kanału dla tej sesji subagenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i pominięto `mode`, domyślną wartością staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca utworzenie, chyba że docelowe środowisko uruchomieniowe dziecka działa w piaskownicy.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżący transkrypt żądającego do sesji dziecka. Tylko natywne subagenty. Utworzenia powiązane z wątkiem domyślnie używają `fork`; utworzenia bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z utworzonego uruchomienia.
</Warning>

### Nazwy zadań i kierowanie

`taskName` to uchwyt widoczny dla modelu do orkiestracji, a nie klucz sesji.
Używaj go do stabilnych nazw dzieci, takich jak `review_subagents`,
`linux_validation` lub `docs_update`, gdy koordynator może później potrzebować sterować
tym dzieckiem albo je zakończyć.

Rozwiązywanie celów akceptuje dokładne dopasowania `taskName` oraz jednoznaczne
prefiksy. Dopasowywanie jest ograniczone do tego samego aktywnego/niedawnego okna celów,
którego używają numerowane cele `/subagents`, więc nieaktualne ukończone dziecko nie sprawia,
że ponownie użyty uchwyt staje się niejednoznaczny. Jeśli dwoje aktywnych lub niedawnych dzieci ma ten sam
`taskName`, cel jest niejednoznaczny; zamiast tego użyj indeksu listy, klucza sesji lub
identyfikatora uruchomienia.

Zarezerwowane cele `last` i `all` nie są prawidłowymi wartościami `taskName`,
ponieważ mają już znaczenie sterujące.

## Narzędzie: `sessions_yield`

Kończy bieżącą turę modelu i czeka na zdarzenia środowiska uruchomieniowego, głównie
zdarzenia ukończenia subagentów, które mają nadejść jako następna wiadomość. Użyj go po
utworzeniu wymaganej pracy dziecka, gdy żądający nie może przygotować końcowej
odpowiedzi do czasu nadejścia tych ukończeń.

`sessions_yield` jest prymitywem oczekiwania. Nie zastępuj go pętlami odpytywania
przez `subagents`, `sessions_list`, `sessions_history`, powłokowe
`sleep` ani odpytywaniem procesów tylko po to, aby wykryć ukończenie dziecka.

Używaj `sessions_yield` tylko wtedy, gdy efektywna lista narzędzi sesji je obejmuje.
Niektóre minimalne lub niestandardowe profile narzędzi mogą udostępniać `sessions_spawn` i
`subagents` bez udostępniania `sessions_yield`; w takim przypadku nie wymyślaj
pętli odpytywania tylko po to, aby czekać na ukończenie.

Gdy istnieją aktywne dzieci, OpenClaw wstrzykuje kompaktowy, wygenerowany przez środowisko uruchomieniowe
blok podpowiedzi `Active Subagents` do normalnych tur, aby żądający mógł widzieć
bieżące sesje dzieci, identyfikatory uruchomień, statusy, etykiety, zadania i
aliasy `taskName` bez odpytywania. Pola zadania i etykiety w tym
bloku są cytowane jako dane, a nie instrukcje, ponieważ mogą pochodzić
z podanych przez użytkownika/model argumentów tworzenia.

## Narzędzie: `subagents`

Wyświetla, steruje lub kończy utworzone uruchomienia subagentów należące do sesji
żądającego. Jest ograniczone do bieżącego żądającego; dziecko może
widzieć/kontrolować tylko własne kontrolowane dzieci.

Używaj `subagents` do statusu na żądanie, debugowania, sterowania lub kończenia.
Używaj `sessions_yield`, aby czekać na zdarzenia ukończenia.

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, subagent może pozostać powiązany
z wątkiem, aby kolejne wiadomości użytkownika w tym wątku nadal były kierowane do
tej samej sesji subagenta.

### Kanały obsługujące wątki

**Discord** jest obecnie jedynym obsługiwanym kanałem. Obsługuje
trwałe sesje subagentów powiązane z wątkami (`sessions_spawn` z
`thread: true`), ręczne sterowanie wątkami (`/focus`, `/unfocus`, `/agents`,
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
    OpenClaw tworzy lub wiąże wątek z tym celem sesji w aktywnym kanale.
  </Step>
  <Step title="Route follow-ups">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Inspect timeouts">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odfokusowanie przy braku aktywności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Detach">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Ręczne sterowanie

| Polecenie          | Efekt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz nowy) z celem subagenta/sesji        |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                       |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne odfokusowanie przy bezczynności (tylko zafokusowane powiązane wątki) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko zafokusowane powiązane wątki) |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego wiązania przy tworzeniu** są specyficzne dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia slash](/pl/tools/slash-commands), aby poznać bieżące szczegóły adaptera.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, do których można kierować przez jawne `agentId` (`["*"]` pozwala na dowolny). Domyślnie: tylko agent żądający. Jeśli ustawisz listę i nadal chcesz, aby żądający tworzył samego siebie z `agentId`, uwzględnij identyfikator żądającego na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuj wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Limit czasu na wywołanie dla prób dostarczenia ogłoszenia `agent` przez Gateway. Wartości są dodatnimi całkowitymi milisekundami i są ograniczane do bezpiecznego dla platformy maksimum licznika czasu. Przejściowe ponowienia mogą sprawić, że łączny czas oczekiwania na ogłoszenie będzie dłuższy niż jeden skonfigurowany limit czasu.
</ParamField>

Jeśli sesja żądającego działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby bez piaskownicy.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska uruchomieniowego, aby wywołujący mogli odróżnić PI, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska uruchomieniowe.

### Automatyczne archiwizowanie

- Sesje subagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczne archiwizowanie działa na zasadzie best effort; oczekujące liczniki czasu zostają utracone, jeśli Gateway zostanie ponownie uruchomiony.
- `runTimeoutSeconds` **nie** archiwizuje automatycznie; tylko zatrzymuje uruchomienie. Sesja pozostaje do czasu automatycznego zarchiwizowania.
- Automatyczne archiwizowanie stosuje się tak samo do sesji głębokości 1 i głębokości 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane na zasadzie best effort po zakończeniu uruchomienia, nawet jeśli transkrypt/rekord sesji zostaje zachowany.

## Zagnieżdżone subagenty

Domyślnie subagenty nie mogą tworzyć własnych subagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → subagent orkiestrator →
sub-subagenty wykonawcze.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Kształt klucza sesji                         | Rola                                          | Może tworzyć?                |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Główny agent                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Subagent (orkiestrator, gdy głębokość 2 jest dozwolona) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagent (pracownik liść)                 | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki przepływają z powrotem w górę łańcucha:

1. Pracownik głębokości 2 kończy → ogłasza do swojego rodzica (orkiestratora głębokości 1).
2. Orkiestrator głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do głównego.
3. Główny agent odbiera ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę podrzędną raz i czekaj na zdarzenia ukończenia zamiast budować pętle odpytywania wokół `sessions_list`, `sessions_history`, `/subagents list` lub poleceń uśpienia `exec`. `sessions_list` i `/subagents list` utrzymują relacje sesji podrzędnych skupione na pracy na żywo — aktywne sesje podrzędne pozostają dołączone, zakończone sesje podrzędne pozostają widoczne przez krótki ostatni okres, a nieaktualne linki podrzędne istniejące tylko w magazynie są ignorowane po upływie ich okna świeżości. Zapobiega to wskrzeszaniu widmowych sesji podrzędnych po restarcie przez stare metadane `spawnedBy` / `parentSessionKey`. Jeśli zdarzenie ukończenia sesji podrzędnej nadejdzie po wysłaniu przez Ciebie odpowiedzi końcowej, właściwą odpowiedzią uzupełniającą jest dokładny cichy token `NO_REPLY` / `no_reply`.
</Note>

### Polityka narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie uruchomienia. Dzięki temu płaskie lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi sesjami podrzędnymi. Inne narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (obecne zachowanie domyślne).
- **Głębokość 2 (pracownik-liść):** brak narzędzi sesji — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może uruchamiać kolejnych sesji podrzędnych.

### Limit uruchomień na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent` (domyślnie `5`) aktywnych sesji podrzędnych. Zapobiega to niekontrolowanemu rozgałęzianiu z pojedynczego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora na głębokości 1 automatycznie zatrzymuje wszystkie jego sesje podrzędne na głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów na głębokości 1 i kaskadowo zatrzymuje ich sesje podrzędne na głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i kaskadowo zatrzymuje jego sesje podrzędne.
- `/subagents kill all` zatrzymuje wszystkich subagentów dla żądającego i uruchamia kaskadę.

## Uwierzytelnianie

Uwierzytelnianie subagenta jest rozstrzygane według **identyfikatora agenta**, a nie według typu sesji:

- Klucz sesji subagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **fallback**; profile agenta zastępują główne profile w razie konfliktów.

Scalanie jest addytywne, więc główne profile są zawsze dostępne jako fallbacki. W pełni izolowane uwierzytelnianie per agent nie jest jeszcze obsługiwane.

## Ogłaszanie

Subagenci raportują wyniki za pomocą kroku ogłaszania:

- Krok ogłaszania działa wewnątrz sesji subagenta (nie w sesji żądającego).
- Jeśli subagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wynik ogłoszenia jest tłumiony nawet wtedy, gdy wcześniej istniał widoczny postęp.

Dostarczanie zależy od głębokości żądającego:

- Sesje żądającego najwyższego poziomu używają uzupełniającego wywołania `agent` z dostarczaniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje subagenta żądającego otrzymują wewnętrzne wstrzyknięcie uzupełniające (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki sesji podrzędnych w ramach sesji.
- Jeśli zagnieżdżona sesja subagenta żądającego zniknęła, OpenClaw wraca do żądającego tej sesji, gdy jest dostępny.

Dla sesji żądającego najwyższego poziomu bezpośrednie dostarczanie w trybie ukończenia najpierw rozstrzyga dowolną powiązaną trasę konwersacji/wątku oraz nadpisanie hooka, a następnie uzupełnia brakujące pola kanału i celu z zapisanej trasy sesji żądającego. Dzięki temu ukończenia trafiają do właściwego czatu/tematu nawet wtedy, gdy źródło ukończenia identyfikuje tylko kanał.

Agregacja ukończeń sesji podrzędnych jest ograniczona do bieżącego uruchomienia żądającego podczas budowania zagnieżdżonych ustaleń ukończenia, co zapobiega wyciekowi wyników sesji podrzędnych z wcześniejszych uruchomień do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują trasowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Źródło         | `subagent` lub `cron`                                                                                              |
| Identyfikatory sesji | Klucz/id sesji podrzędnej                                                                                   |
| Typ            | Typ ogłoszenia + etykieta zadania                                                                                  |
| Status         | Wyprowadzony z wyniku runtime (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult            |
| Uzupełnienie   | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy zachować ciszę                                                   |

Końcowe nieudane uruchomienia raportują status niepowodzenia bez odtwarzania przechwyconego tekstu odpowiedzi. Przy timeout, jeśli sesja podrzędna zdołała wykonać tylko wywołania narzędzi, ogłoszenie może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast odtwarzać surowe wyjście narzędzia.

### Wiersz statystyk

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet po zawinięciu):

- Runtime (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano cennik modelu (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` oraz ścieżka transkryptu, aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone tylko do orkiestracji; odpowiedzi widoczne dla użytkownika należy przepisać normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- Pamięć asystenta jest najpierw normalizowana: tagi myślenia są usuwane; szkielety `<relevant-memories>` / `<relevant_memories>` są usuwane; bloki ładunku XML wywołań narzędzi w postaci zwykłego tekstu (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) są usuwane, w tym ucięte ładunki, które nigdy nie zamykają się poprawnie; obniżone szkielety wywołań/wyników narzędzi i znaczniki kontekstu historycznego są usuwane; wyciekłe tokeny sterujące modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnoszerokie `<｜...｜>`) są usuwane; zniekształcone XML wywołań narzędzi MiniMax są usuwane.
- Tekst przypominający poświadczenia/tokeny jest redagowany.
- Długie bloki mogą być obcinane.
- Bardzo duże historie mogą odrzucać starsze wiersze lub zastępować zbyt duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkryptu na dysku jest fallbackiem, gdy potrzebujesz pełnego transkryptu bajt po bajcie.

## Polityka narzędzi

Subagenci najpierw używają tego samego profilu i potoku polityki narzędzi co rodzic lub docelowy agent. Następnie OpenClaw stosuje warstwę ograniczeń subagenta.

Bez restrykcyjnego `tools.profile` subagenci otrzymują **wszystkie narzędzia z wyjątkiem narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` pozostaje również tutaj ograniczonym, oczyszczonym widokiem przypominania — nie jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, subagenci-orkiestratorzy na głębokości 1 dodatkowo otrzymują `sessions_spawn`, `subagents`, `sessions_list` i `sessions_history`, aby mogli zarządzać swoimi sesjami podrzędnymi.

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

`tools.subagents.tools.allow` jest końcowym filtrem typu allow-only. Może zawęzić już rozstrzygnięty zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje `web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby pozwolić subagentom profilu coding używać automatyzacji przeglądarki, dodaj browser na etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj per-agent `agents.list[].tools.alsoAllow: ["browser"]`, gdy tylko jeden agent ma otrzymać automatyzację przeglądarki.

## Współbieżność

Subagenci używają dedykowanej kolejki w procesie:

- **Nazwa ścieżki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że subagent nadal działa. Niezakończone uruchomienia starsze niż okno nieaktualnych uruchomień przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu, bramkowaniu ukończeń potomnych i kontrolach współbieżności per sesja.

Po restarcie Gateway nieaktualne, przywrócone, niezakończone uruchomienia są usuwane, chyba że ich sesja podrzędna jest oznaczona jako `abortedLastRun: true`. Te sesje podrzędne przerwane przez restart pozostają możliwe do odzyskania przez przepływ odzyskiwania osieroconych subagentów, który wysyła syntetyczny komunikat wznowienia przed wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone per sesja podrzędna. Jeśli ta sama sesja podrzędna subagenta jest wielokrotnie akceptowana do odzyskiwania osierocenia w oknie szybkiego ponownego zakleszczenia, OpenClaw zapisuje w tej sesji nagrobek odzyskiwania i przestaje automatycznie ją wznawiać przy późniejszych restartach. Uruchom `openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo `openclaw doctor --fix`, aby wyczyścić nieaktualne flagi przerwanego odzyskiwania w sesjach z nagrobkiem.

<Note>
Jeśli uruchomienie subagenta nie powiedzie się z Gateway `PAIRING_REQUIRED` / `scope-upgrade`, sprawdź wywołującego RPC przed edycją stanu parowania. Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako `client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie uwierzytelnianie wspólnym tokenem/hasłem przez loopback; ta ścieżka nie zależy od bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne `deviceIdentity`, jawne ścieżki tokenu urządzenia oraz klienci przeglądarka/node nadal wymagają normalnego zatwierdzenia urządzenia dla podniesień zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` w czacie żądającego przerywa sesję żądającego i zatrzymuje wszelkie aktywne uruchomienia subagentów utworzone z niej, kaskadowo obejmując zagnieżdżone sesje podrzędne.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i kaskadowo zatrzymuje jego sesje podrzędne.

## Ograniczenia

- Ogłoszenie subagenta działa na zasadzie **best-effort**. Jeśli Gateway zostanie zrestartowany, oczekująca praca „ogłoś z powrotem” zostanie utracona.
- Subagenci nadal współdzielą zasoby tego samego procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst subagenta wstrzykuje tylko `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` i `USER.md` (bez `MEMORY.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana dla większości przypadków użycia.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych sesji podrzędnych per sesja (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
