---
read_when:
    - Chcesz wykonywać pracę w tle lub równoległą za pomocą agenta
    - Zmieniasz politykę narzędzia sessions_spawn lub narzędzia subagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agentów w tle, które przekazują wyniki z powrotem na czat osoby zgłaszającej
title: Podagenci
x-i18n:
    generated_at: "2026-05-10T19:59:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b4a78b83fda42931ed2a4795e2db611121a30378de149c0478e989029123382
    source_path: tools/subagents.md
    workflow: 16
---

Podagenci to uruchomienia agentów w tle, tworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem w kanale czatu
żądającego. Każde uruchomienie podagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoleglenie pracy typu „badanie / długie zadanie / powolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja podagentów (separacja sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do błędnego użycia: podagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy podagent ma domyślnie własny kontekst i zużycie tokenów.
W przypadku ciężkich lub powtarzalnych zadań ustaw tańszy model dla podagentów
i pozostaw głównego agenta na modelu wyższej jakości. Skonfiguruj to przez
`agents.defaults.subagents.model` albo nadpisania dla poszczególnych agentów. Gdy dziecko
    rzeczywiście potrzebuje bieżącego transkryptu żądającego, agent może zażądać
    `context: "fork"` przy tym jednym utworzeniu. Sesje podagentów powiązane z wątkiem domyślnie
    używają `context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do
    wątku kontynuacji.
</Note>

## Polecenie ukośnika

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

Użyj polecenia najwyższego poziomu [`/steer <message>`](/pl/tools/steer), aby sterować aktywnym uruchomieniem bieżącej sesji żądającego. Użyj `/subagents steer <id|#> <message>`, gdy celem jest uruchomienie podrzędne.

`/subagents info` pokazuje metadane uruchomienia (stan, znaczniki czasu, identyfikator sesji,
ścieżkę transkryptu, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przypomnienia; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego pełnego transkryptu.

### Elementy sterowania powiązaniem wątku

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

`/subagents spawn` uruchamia podagenta w tle jako polecenie użytkownika (nie
wewnętrzny przekaźnik) i wysyła jedną końcową aktualizację ukończenia z powrotem do
czatu żądającego po zakończeniu uruchomienia.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Polecenie tworzenia nie blokuje; natychmiast zwraca identyfikator uruchomienia.
    - Po ukończeniu podagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem w kanale czatu żądającego.
    - Tury agenta, które potrzebują wyników dzieci, powinny wywołać `sessions_yield` po utworzeniu wymaganej pracy. Kończy to bieżącą turę i pozwala zdarzeniom ukończenia dotrzeć jako następna wiadomość widoczna dla modelu.
    - Ukończenie działa przez wypychanie. Po utworzeniu **nie** odpytuj `/subagents list`, `sessions_list` ani `sessions_history` w pętli tylko po to, by czekać na zakończenie; sprawdzaj stan tylko na żądanie w celu debugowania lub interwencji.
    - Dane wyjściowe dziecka są raportem/dowodem dla agenta żądającego do zsyntetyzowania. Nie są tekstem instrukcji autorstwa użytkownika i nie mogą nadpisać zasad systemowych, deweloperskich ani użytkownika.
    - Po ukończeniu OpenClaw dokłada starań, aby zamknąć śledzone karty/procesy przeglądarki otwarte przez tę sesję podagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw przekazuje ukończenia z powrotem do sesji żądającego przez turę `agent` ze stabilnym kluczem idempotencji.
    - Jeśli uruchomienie żądającego jest nadal aktywne, OpenClaw najpierw próbuje obudzić/sterować tym uruchomieniem zamiast rozpoczynać drugą widoczną ścieżkę odpowiedzi.
    - Jeśli przekazanie ukończenia do agenta żądającego nie powiedzie się lub nie wytworzy widocznych danych wyjściowych, OpenClaw traktuje dostarczenie jako nieudane i wraca do routingu kolejki/ponowienia. Nie wysyła surowego wyniku dziecka bezpośrednio do zewnętrznego czatu.
    - Jeśli nie można użyć bezpośredniego przekazania, następuje powrót do routingu kolejki.
    - Jeśli routing kolejki nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostateczną rezygnacją.
    - Dostarczanie ukończenia zachowuje rozwiązaną trasę żądającego: trasy ukończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło ukończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), dzięki czemu bezpośrednie dostarczenie nadal działa.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Przekazanie ukończenia do sesji żądającego jest generowanym przez środowisko wykonawcze
    kontekstem wewnętrznym (nie tekstem autorstwa użytkownika) i obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/wyniku narzędzia. Końcowe nieudane uruchomienia nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Zwięzłe statystyki środowiska wykonawczego/tokenów.
    - Instrukcję dostarczenia nakazującą agentowi żądającemu przepisać treść normalnym głosem asystenta (nie przekazywać surowych metadanych wewnętrznych).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po ukończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - Dla sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode albo jawne Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza to środowisko wykonawcze. Zobacz [Model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń lub pętli agent-agent. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"` do czasu włączenia ACP, gdy żądający nie jest w sandboxie i załadowany jest Plugin zaplecza taki jak `acpx`. `runtime: "acp"` oczekuje zewnętrznego identyfikatora uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; użyj domyślnego środowiska wykonawczego podagenta dla zwykłych agentów konfiguracyjnych OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni podagenci startują w izolacji, chyba że wywołujący jawnie poprosi o rozwidlenie
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badanie, niezależna implementacja, powolna praca narzędzia albo cokolwiek, co można opisać w tekście zadania                           | Tworzy czysty transkrypt dziecka. To ustawienie domyślne i utrzymuje niższe zużycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub niuansowych instrukcji już obecnych w transkrypcie żądającego | Rozgałęzia transkrypt żądającego do sesji dziecka, zanim dziecko wystartuje. |

Używaj `fork` oszczędnie. Służy do delegowania zależnego od kontekstu, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia podagenta z `deliver: false` na globalnym pasie `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale czatu
żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
tego nie robi; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, które powinny delegować
pracę. Polityki kanału/grupy, dostawcy, sandboxa oraz zezwalania/odmawiania dla poszczególnych agentów
nadal mogą usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (albo `agents.list[].subagents.model` dla poszczególnych agentów); jawne `sessions_spawn.model` nadal wygrywa.
- **Myślenie:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (albo `agents.list[].subagents.thinking` dla poszczególnych agentów); jawne `sessions_spawn.thinking` nadal wygrywa.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` zostanie pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (brak limitu czasu).

### Tryb promptu delegowania

`agents.defaults.subagents.delegationMode` steruje wyłącznie wskazówkami promptu; nie zmienia polityki narzędzi ani nie wymusza delegowania.

- `suggest` (domyślne): zachowaj standardową zachętę promptu do używania podagentów przy większej lub wolniejszej pracy.
- `prefer`: powiedz głównemu agentowi, aby pozostał responsywny i delegował przez `sessions_spawn` wszystko bardziej złożone niż bezpośrednia odpowiedź.

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
  Opis zadania dla podagenta.
</ParamField>
<ParamField path="taskName" type="string">
  Opcjonalny stabilny uchwyt do późniejszego kierowania przez `subagents`. Musi pasować do `[a-z][a-z0-9_]{0,63}` i nie może być zarezerwowanym celem, takim jak `last` lub `all`. Preferuj go, gdy koordynator może potrzebować pokierować, zabić lub zidentyfikować określone dziecko po utworzeniu kilku dzieci.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Utwórz pod innym identyfikatorem agenta, gdy zezwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone tylko dla zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` lub jawnie zażądanych Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane przy natywnym tworzeniu podagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje wyjście uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń przy natywnym tworzeniu podagentów.
</ParamField>
<ParamField path="model" type="string">
  Nadpisuje model podagenta. Nieprawidłowe wartości są pomijane, a podagent działa na domyślnym modelu z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisuje poziom myślenia dla uruchomienia podagenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie przyjmuje `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione, w przeciwnym razie `0`. Gdy ustawione, uruchomienie podagenta jest przerywane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania wątku kanału dla tej sesji podagenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i `mode` pominięto, domyślną wartością staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca utworzenie, chyba że docelowe środowisko uruchomieniowe dziecka działa w sandboxie.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżący transkrypt żądającego do sesji dziecka. Tylko natywne podagenty. Utworzenia powiązane z wątkiem domyślnie używają `fork`; utworzenia bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z utworzonego uruchomienia.
</Warning>

### Nazwy zadań i kierowanie

`taskName` to uchwyt widoczny dla modelu do orkiestracji, a nie klucz sesji.
Używaj go dla stabilnych nazw dzieci, takich jak `review_subagents`,
`linux_validation` lub `docs_update`, gdy koordynator może potrzebować pokierować
tym dzieckiem lub zabić je później.

Rozpoznawanie celu akceptuje dokładne dopasowania `taskName` i jednoznaczne
prefiksy. Dopasowanie jest ograniczone do tego samego aktywnego/ostatniego okna
celu, którego używają numerowane cele `/subagents`, więc przestarzałe ukończone
dziecko nie powoduje niejednoznaczności ponownie użytego uchwytu. Jeśli dwoje
aktywnych lub ostatnich dzieci współdzieli ten sam `taskName`, cel jest
niejednoznaczny; zamiast tego użyj indeksu listy, klucza sesji lub identyfikatora
uruchomienia.

Zarezerwowane cele `last` i `all` nie są prawidłowymi wartościami `taskName`,
ponieważ mają już znaczenie sterujące.

## Narzędzie: `sessions_yield`

Kończy bieżącą turę modelu i czeka, aż zdarzenia środowiska uruchomieniowego,
głównie zdarzenia ukończenia podagentów, dotrą jako następna wiadomość. Użyj go
po utworzeniu wymaganego zadania dziecka, gdy żądający nie może przygotować
ostatecznej odpowiedzi, dopóki te ukończenia nie nadejdą.

`sessions_yield` jest prymitywem oczekiwania. Nie zastępuj go pętlami odpytywania
po `subagents`, `sessions_list`, `sessions_history`, powłokowym `sleep` ani
odpytywaniem procesów tylko po to, aby wykryć ukończenie dziecka.

Używaj `sessions_yield` tylko wtedy, gdy efektywna lista narzędzi sesji je
zawiera. Niektóre minimalne lub niestandardowe profile narzędzi mogą udostępniać
`sessions_spawn` i `subagents` bez udostępniania `sessions_yield`; w takim
przypadku nie wymyślaj pętli odpytywania tylko po to, aby czekać na ukończenie.

Gdy istnieją aktywne dzieci, OpenClaw wstrzykuje zwarty, wygenerowany przez
środowisko uruchomieniowe blok promptu `Active Subagents` do zwykłych tur, aby
żądający mógł zobaczyć bieżące sesje dzieci, identyfikatory uruchomień, statusy,
etykiety, zadania i aliasy `taskName` bez odpytywania. Pola zadania i etykiety w
tym bloku są cytowane jako dane, nie instrukcje, ponieważ mogą pochodzić z
argumentów utworzenia dostarczonych przez użytkownika/model.

## Narzędzie: `subagents`

Wyświetla, kieruje lub zabija uruchomienia utworzonych podagentów należące do
sesji żądającego. Jest ograniczone do bieżącego żądającego; dziecko może
widzieć/kontrolować tylko własne kontrolowane dzieci.

Użyj `subagents` do statusu na żądanie, debugowania, kierowania lub zabijania.
Użyj `sessions_yield`, aby czekać na zdarzenia ukończenia.

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, podagent może pozostać powiązany
z wątkiem, aby kolejne wiadomości użytkownika w tym wątku nadal były kierowane
do tej samej sesji podagenta.

### Kanały obsługujące wątki

**Discord** jest obecnie jedynym obsługiwanym kanałem. Obsługuje trwałe sesje
podagentów powiązane z wątkami (`sessions_spawn` z `thread: true`), ręczne
elementy sterowania wątkami (`/focus`, `/unfocus`, `/agents`, `/session idle`,
`/session max-age`) oraz klucze adaptera
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
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odogniskowanie z powodu braku aktywności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłącz">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Ręczne elementy sterowania

| Polecenie          | Efekt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz nowy) z celem podagenta/sesji        |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                       |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne odogniskowanie przy bezczynności (tylko skupione powiązane wątki) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko skupione powiązane wątki)     |

### Przełączniki konfiguracji

- **Domyślne globalne:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego powiązania przy tworzeniu** są specyficzne dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Informacje o konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia slash](/pl/tools/slash-commands), aby uzyskać bieżące szczegóły adaptera.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, które mogą być celem przez jawne `agentId` (`["*"]` zezwala na dowolny). Domyślnie: tylko agent żądający. Jeśli ustawisz listę i nadal chcesz, aby żądający tworzył siebie za pomocą `agentId`, uwzględnij identyfikator żądającego na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jeśli sesja żądającego działa w sandboxie, `sessions_spawn` odrzuca cele,
które działałyby poza sandboxem.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie
dozwolone dla `sessions_spawn`. Odpowiedź zawiera efektywny model każdego
wymienionego agenta i osadzone metadane środowiska uruchomieniowego, aby
wywołujący mogli odróżnić PI, serwer aplikacji Codex i inne skonfigurowane
natywne środowiska uruchomieniowe.

### Automatyczna archiwizacja

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczna archiwizacja działa na zasadzie best-effort; oczekujące timery zostają utracone, jeśli gateway zostanie uruchomiony ponownie.
- `runTimeoutSeconds` **nie** archiwizuje automatycznie; tylko zatrzymuje uruchomienie. Sesja pozostaje do automatycznej archiwizacji.
- Automatyczna archiwizacja stosuje się tak samo do sesji głębokości 1 i głębokości 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane na zasadzie best-effort po zakończeniu uruchomienia, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżone podagenty

Domyślnie podagenty nie mogą tworzyć własnych podagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → podagent orkiestrator →
pod-podagenty pracownicy.

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
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agent główny                                  | Zawsze                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Pod-podagent (pracownik liść)                 | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki płyną z powrotem w górę łańcucha:

1. Pracownik głębokości 2 kończy → ogłasza do swojego rodzica (orkiestratora głębokości 1).
2. Orkiestrator głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do głównego.
3. Agent główny odbiera ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wytyczne operacyjne:** uruchamiaj pracę dziecka raz i czekaj na zdarzenia
ukończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń `exec` sleep.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skoncentrowane na pracy na żywo — aktywne dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótkie ostatnie okno, a przestarzałe linki dzieci istniejące tylko w magazynie są
ignorowane po ich oknie świeżości. Zapobiega to wskrzeszaniu widmowych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po ponownym uruchomieniu. Jeśli zdarzenie ukończenia dziecka nadejdzie po wysłaniu przez Ciebie
ostatecznej odpowiedzi, poprawną kontynuacją jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Polityka narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji podczas uruchamiania. Dzięki temu spłaszczone lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Pozostałe narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (obecne zachowanie domyślne).
- **Głębokość 2 (pracownik-liść):** brak narzędzi sesji — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może uruchamiać kolejnych dzieci.

### Limit uruchomień na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z jednego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora na głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
na głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów na głębokości 1 i kaskadowo zatrzymuje ich dzieci na głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego agenta podrzędnego i kaskadowo zatrzymuje jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich agentów podrzędnych dla żądającego i wykonuje kaskadę.

## Uwierzytelnianie

Uwierzytelnianie agenta podrzędnego jest rozstrzygane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji agenta podrzędnego to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **fallback**; profile agenta zastępują profile główne w razie konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
fallback. W pełni izolowane uwierzytelnianie per agent nie jest jeszcze obsługiwane.

## Ogłaszanie

Agenci podrzędni raportują z powrotem przez krok ogłaszania:

- Krok ogłaszania działa wewnątrz sesji agenta podrzędnego (nie w sesji żądającego).
- Jeśli agent podrzędny odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wynik ogłoszenia jest wyciszony, nawet jeśli wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości żądającego:

- Sesje żądającego najwyższego poziomu używają kolejnego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje agenta podrzędnego żądającego otrzymują wewnętrzne wstrzyknięcie kolejnego kroku (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja agenta podrzędnego żądającego zniknęła, OpenClaw wraca do żądającego tej sesji, gdy jest dostępny.

W przypadku sesji żądającego najwyższego poziomu bezpośrednie dostarczenie w trybie ukończenia najpierw
rozstrzyga powiązaną trasę konwersacji/wątku i nadpisanie hooka, a następnie uzupełnia
brakujące pola kanału-docelowe z zapisanej trasy sesji żądającego.
Dzięki temu ukończenia trafiają do właściwego czatu/tematu nawet wtedy, gdy źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci jest ograniczona do bieżącego uruchomienia żądającego podczas
budowania zagnieżdżonych ustaleń ukończenia, co zapobiega wyciekaniu przestarzałych wyników dzieci
z poprzednich uruchomień do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują
trasowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` lub `cron`                                                                                            |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                   |
| Typ            | Typ ogłoszenia + etykieta zadania                                                                                |
| Status         | Wyprowadzony z wyniku środowiska uruchomieniowego (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst tool/toolResult                |
| Kolejny krok   | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy milczeć                                                        |

Końcowe nieudane uruchomienia zgłaszają status niepowodzenia bez ponownego odtwarzania przechwyconego
tekstu odpowiedzi. Przy przekroczeniu limitu czasu, jeśli dziecko doszło tylko do wywołań narzędzi, ogłoszenie
może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast
odtwarzać surowe dane wyjściowe narzędzi.

### Linia statystyk

Ładunki ogłoszeń zawierają na końcu linię statystyk (nawet gdy są zawinięte):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkryptu, aby główny agent mógł pobrać historię przez `sessions_history` albo sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone wyłącznie do orkiestracji; odpowiedzi widoczne dla użytkownika
powinny zostać przepisane normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` to bezpieczniejsza ścieżka orkiestracji:

- Pamięć asystenta jest najpierw normalizowana: tagi myślenia są usuwane; rusztowanie `<relevant-memories>` / `<relevant_memories>` jest usuwane; bloki ładunku XML wywołań narzędzi w zwykłym tekście (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) są usuwane, w tym obcięte ładunki, które nigdy nie zamykają się poprawnie; zdegradowane rusztowanie wywołań/wyników narzędzi i znaczniki kontekstu historycznego są usuwane; ujawnione tokeny sterujące modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnoszerokościowe `<｜...｜>`) są usuwane; wadliwy XML wywołań narzędzi MiniMax jest usuwany.
- Tekst przypominający poświadczenia/tokeny jest redagowany.
- Długie bloki mogą być obcinane.
- Bardzo duże historie mogą porzucać starsze wiersze albo zastępować zbyt duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkryptu na dysku jest fallbackiem, gdy potrzebny jest pełny transkrypt bajt po bajcie.

## Zasady narzędzi

Agenci podrzędni używają najpierw tego samego profilu i potoku zasad narzędzi co agent nadrzędny lub
docelowy. Następnie OpenClaw stosuje warstwę ograniczeń dla agentów podrzędnych.

Bez restrykcyjnego `tools.profile` agenci podrzędni otrzymują **wszystkie narzędzia oprócz
narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` także tutaj pozostaje ograniczonym, oczyszczonym widokiem przywołania — nie
jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, agenci podrzędni-orkiestratorzy na głębokości 1 dodatkowo
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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` jest ostatecznym filtrem typu allow-only. Może zawęzić
już rozstrzygnięty zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby pozwolić
agentom podrzędnym z profilem coding używać automatyzacji przeglądarki, dodaj browser na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj `agents.list[].tools.alsoAllow: ["browser"]` per agent, gdy tylko jeden
agent powinien otrzymać automatyzację przeglądarki.

## Współbieżność

Agenci podrzędni używają dedykowanej kolejki wewnątrzprocesowej:

- **Nazwa kolejki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że
agent podrzędny wciąż działa. Niezakończone uruchomienia starsze niż okno nieaktualnego uruchomienia
przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu,
bramkowaniu ukończenia potomków i kontrolach współbieżności per sesja.

Po restarcie Gateway nieaktualne, niezakończone przywrócone uruchomienia są przycinane, chyba że
ich sesja dziecka jest oznaczona jako `abortedLastRun: true`. Te
dziecięce sesje przerwane restartem pozostają możliwe do odzyskania przez przepływ odzyskiwania osieroconych agentów podrzędnych, który wysyła syntetyczną wiadomość wznowienia przed
wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone per sesja dziecka. Jeśli to samo
dziecko agenta podrzędnego jest wielokrotnie akceptowane do odzyskiwania osieroconego stanu w
oknie szybkiego ponownego zaklinowania, OpenClaw utrwala tombstone odzyskiwania w tej
sesji i przestaje automatycznie ją wznawiać przy późniejszych restartach. Uruchom
`openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo
`openclaw doctor --fix`, aby wyczyścić nieaktualne flagi przerwanego odzyskiwania na
sesjach z tombstone.

<Note>
Jeśli uruchomienie agenta podrzędnego nie powiedzie się z Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, sprawdź wywołującego RPC przed edycją stanu parowania.
Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako
`client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie
uwierzytelnianie local loopback z tokenem/hasłem współdzielonym; ta ścieżka nie zależy od
bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokena urządzenia oraz klienci browser/node
nadal wymagają normalnego zatwierdzenia urządzenia dla podniesień zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` w czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia agentów podrzędnych utworzone z niej, kaskadowo przechodząc do zagnieżdżonych dzieci.
- `/subagents kill <id>` zatrzymuje konkretnego agenta podrzędnego i kaskadowo zatrzymuje jego dzieci.

## Ograniczenia

- Ogłaszanie agenta podrzędnego działa na zasadzie **best-effort**. Jeśli gateway zostanie zrestartowany, oczekująca praca „ogłoś z powrotem” zostanie utracona.
- Agenci podrzędni nadal współdzielą te same zasoby procesu gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst agenta podrzędnego wstrzykuje tylko `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` i `USER.md` (bez `MEMORY.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana dla większości przypadków użycia.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci per sesja (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie do agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
