---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pośrednictwem agenta
    - Zmieniasz politykę narzędzia sessions_spawn lub narzędzia podagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agenta w tle, które ogłaszają wyniki z powrotem w czacie osoby żądającej.
title: Podagenci
x-i18n:
    generated_at: "2026-06-27T18:31:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

Podagenci to przebiegi agentów w tle uruchamiane z istniejącego przebiegu agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem w kanale czatu
żądającego. Każdy przebieg podagenta jest śledzony jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoleglenie pracy typu „badania / długie zadanie / wolne narzędzie” bez blokowania głównego przebiegu.
- Domyślna izolacja podagentów (oddzielenie sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do błędnego użycia: podagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy podagent ma domyślnie własny kontekst
i własne użycie tokenów. W przypadku ciężkich lub powtarzalnych zadań ustaw
tańszy model dla podagentów, a głównego agenta pozostaw na modelu wyższej jakości. Skonfiguruj to przez
`agents.defaults.subagents.model` lub nadpisania dla poszczególnych agentów. Gdy proces potomny
    rzeczywiście potrzebuje bieżącego transkryptu żądającego, agent może zażądać
    `context: "fork"` przy tym jednym uruchomieniu. Sesje podagentów powiązane z wątkiem domyślnie
    używają `context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do
    wątku dalszych działań.
</Note>

## Polecenie slash

Użyj `/subagents`, aby sprawdzić przebiegi podagentów dla **bieżącej sesji**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` pokazuje metadane przebiegu (status, znaczniki czasu, id sesji,
ścieżkę transkryptu, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przypomnienia; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego, pełnego transkryptu.

### Kontrolki powiązania wątku

Te polecenia działają w kanałach, które obsługują trwałe powiązania wątków.
Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) poniżej.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Zachowanie uruchamiania

Agenci uruchamiają podagentów w tle za pomocą `sessions_spawn`. Zakończenia podagentów
wracają jako wewnętrzne zdarzenia sesji nadrzędnej; agent nadrzędny/żądający decyduje,
czy potrzebna jest aktualizacja widoczna dla użytkownika.

<AccordionGroup>
  <Accordion title="Nieblokujące zakończenie oparte na wypychaniu">
    - `sessions_spawn` jest nieblokujące; natychmiast zwraca id przebiegu.
    - Po zakończeniu podagent zgłasza się z powrotem do sesji nadrzędnej/żądającej.
    - Tury agenta, które potrzebują wyników procesu potomnego, powinny wywołać `sessions_yield` po uruchomieniu wymaganej pracy. Kończy to bieżącą turę i pozwala zdarzeniom zakończenia pojawić się jako następny komunikat widoczny dla modelu.
    - Zakończenie jest oparte na wypychaniu. Po uruchomieniu **nie** odpytuj w pętli `/subagents list`, `sessions_list` ani `sessions_history` tylko po to, aby poczekać na zakończenie; sprawdzaj status tylko na żądanie w celu widoczności podczas debugowania.
    - Dane wyjściowe procesu potomnego są raportem/dowodem dla agenta żądającego do zsyntetyzowania. Nie są tekstem instrukcji napisanym przez użytkownika i nie mogą nadpisać zasad systemowych, deweloperskich ani użytkownika.
    - Po zakończeniu OpenClaw w trybie best-effort zamyka śledzone karty/procesy przeglądarki otwarte przez tę sesję podagenta, zanim będzie kontynuowany przepływ czyszczenia ogłoszenia.

  </Accordion>
  <Accordion title="Dostarczanie zakończenia">
    - OpenClaw przekazuje zakończenia z powrotem do sesji żądającej przez turę `agent` ze stabilnym kluczem idempotencji.
    - Jeśli przebieg żądający jest nadal aktywny, OpenClaw najpierw próbuje wybudzić/ukierunkować ten przebieg zamiast uruchamiać drugą widoczną ścieżkę odpowiedzi.
    - Jeśli aktywnego żądającego nie można wybudzić, OpenClaw wraca do przekazania do agenta żądającego z tym samym kontekstem zakończenia zamiast porzucać ogłoszenie.
    - Udane przekazanie nadrzędne kończy dostarczanie podagenta nawet wtedy, gdy agent nadrzędny zdecyduje, że widoczna aktualizacja dla użytkownika nie jest potrzebna.
    - Natywni podagenci nie otrzymują narzędzia wiadomości. Zwracają zwykły tekst asystenta do agenta nadrzędnego/żądającego; odpowiedzi widoczne dla człowieka są własnością normalnej polityki dostarczania agenta nadrzędnego/żądającego.
    - Jeśli nie można użyć bezpośredniego przekazania, następuje powrót do routingu kolejki.
    - Jeśli routing kolejki nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostatecznym poddaniem się.
    - Dostarczanie zakończenia zachowuje rozwiązaną trasę żądającego: trasy zakończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło zakończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), więc bezpośrednie dostarczanie nadal działa.

  </Accordion>
  <Accordion title="Metadane przekazania zakończenia">
    Przekazanie zakończenia do sesji żądającej jest wygenerowanym przez runtime
    kontekstem wewnętrznym (nie tekstem napisanym przez użytkownika) i obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant` z procesu potomnego. Dane wyjściowe narzędzia/toolResult nie są promowane do wyników procesu potomnego. Końcowe przebiegi zakończone niepowodzeniem nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompaktowe statystyki runtime/tokenów.
    - Instrukcję przeglądu mówiącą agentowi żądającemu, aby zweryfikował wynik przed decyzją, czy pierwotne zadanie jest zakończone.
    - Wskazówki dalszych działań mówiące agentowi żądającemu, aby kontynuował zadanie lub zapisał dalsze działanie, gdy wynik procesu potomnego pozostawia więcej pracy.
    - Instrukcję końcowej aktualizacji dla ścieżki bez dalszych działań, napisaną normalnym głosem asystenta bez przekazywania surowych metadanych wewnętrznych.

  </Accordion>
  <Accordion title="Tryby i runtime ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego przebiegu.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po zakończeniu.
    - W przypadku trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - Jeśli kanał żądającego nie obsługuje powiązań wątku, użyj `mode: "run"` zamiast ponawiać niemożliwe kombinacje powiązane z wątkiem.
    - W przypadku sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode lub jawne Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza ten runtime. Zobacz [Model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania zakończeń lub pętli agent-agent. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"` do czasu, gdy ACP jest włączone, żądający nie jest w sandboxie, a Plugin backendowy, taki jak `acpx`, jest załadowany. `runtime: "acp"` oczekuje zewnętrznego id uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; dla zwykłych agentów konfiguracji OpenClaw z `agents_list` użyj domyślnego runtime podagenta.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni podagenci startują w izolacji, chyba że wywołujący jawnie poprosi o rozwidlenie
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badania, niezależna implementacja, wolna praca narzędzia lub cokolwiek, co można streścić w tekście zadania                           | Tworzy czysty transkrypt procesu potomnego. To ustawienie domyślne i utrzymuje niższe użycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub zniuansowanych instrukcji już obecnych w transkrypcie żądającego | Rozgałęzia transkrypt żądającego do sesji procesu potomnego przed startem procesu potomnego. |

Używaj `fork` oszczędnie. Jest przeznaczony do delegowania wrażliwego na kontekst, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia przebieg podagenta z `deliver: false` na globalnym pasie `subagent`,
następnie uruchamia krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale czatu
żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
tego nie robi; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, które powinny delegować
pracę. Polityki kanału/grupy, dostawcy, sandboxa oraz allow/deny dla poszczególnych agentów mogą
nadal usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** natywni podagenci dziedziczą wywołującego, chyba że ustawisz `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla poszczególnych agentów). Uruchomienia runtime ACP używają tego samego skonfigurowanego modelu podagenta, gdy jest obecny; w przeciwnym razie uprząż ACP zachowuje własne ustawienie domyślne. Jawne `sessions_spawn.model` nadal wygrywa.
- **Thinking:** natywni podagenci dziedziczą wywołującego, chyba że ustawisz `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla poszczególnych agentów). Uruchomienia runtime ACP stosują również `agents.defaults.models["provider/model"].params.thinking` dla wybranego modelu. Jawne `sessions_spawn.thinking` nadal wygrywa.
- **Limit czasu przebiegu:** OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (brak limitu czasu). `sessions_spawn` nie akceptuje nadpisań limitu czasu dla pojedynczego wywołania.
- **Dostarczanie zadania:** natywni podagenci otrzymują delegowane zadanie w swojej pierwszej widocznej wiadomości `[Subagent Task]`. Prompt systemowy podagenta przenosi reguły runtime i kontekst routingu, a nie ukryty duplikat zadania.

Zaakceptowane natywne uruchomienia podagentów zawierają rozwiązane metadane modelu procesu potomnego w
wyniku narzędzia: `resolvedModel` zawiera zastosowane odwołanie do modelu, a
`resolvedProvider` zawiera prefiks dostawcy, gdy odwołanie go ma.

### Tryb promptu delegowania

`agents.defaults.subagents.delegationMode` kontroluje tylko wskazówki promptu; nie zmienia polityki narzędzi ani nie wymusza delegowania.

- `suggest` (domyślnie): zachowaj standardową sugestię promptu, aby używać podagentów do większej lub wolniejszej pracy.
- `prefer`: powiedz głównemu agentowi, aby pozostał responsywny i delegował wszystko bardziej złożone niż bezpośrednia odpowiedź przez `sessions_spawn`.

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
  Opcjonalny stabilny identyfikator do wskazywania konkretnego elementu podrzędnego w późniejszych danych statusu. Musi pasować do `[a-z][a-z0-9_-]{0,63}` i nie może być zarezerwowanym celem, takim jak `last` lub `all`.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Uruchom pod innym skonfigurowanym identyfikatorem agenta, gdy pozwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Opcjonalny katalog roboczy zadania dla uruchomienia podrzędnego. Natywne podagenty nadal wczytują pliki rozruchowe z przestrzeni roboczej agenta docelowego; `cwd` zmienia tylko miejsce, w którym narzędzia runtime i uprzęże CLI wykonują delegowaną pracę.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` służy wyłącznie do zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie żądanego Codex ACP/acpx) oraz do wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane przy uruchamianiu natywnych podagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje dane wyjściowe uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń przy uruchamianiu natywnych podagentów.
</ParamField>
<ParamField path="model" type="string">
  Nadpisuje model podagenta. Nieprawidłowe wartości są pomijane, a podagent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisuje poziom myślenia dla uruchomienia podagenta.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania wątku kanału dla tej sesji podagenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i pominięto `mode`, domyślną wartością staje się `session`. `mode: "session"` wymaga `thread: true`.
  Jeśli powiązanie wątku jest niedostępne dla kanału żądającego, użyj zamiast tego `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca uruchomienie, chyba że docelowy podrzędny runtime działa w piaskownicy.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżący transkrypt żądającego do sesji podrzędnej. Tylko natywne podagenty. Uruchomienia powiązane z wątkiem domyślnie używają `fork`; uruchomienia bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Natywne podagenty zgłaszają
swoją najnowszą turę asystenta z powrotem do żądającego; zewnętrzne dostarczanie pozostaje przy
agencie nadrzędnym/żądającym.
</Warning>

### Nazwy zadań i kierowanie

`taskName` to uchwyt widoczny dla modelu na potrzeby orkiestracji, a nie klucz sesji.
Używaj go dla stabilnych nazw elementów podrzędnych, takich jak `review_subagents`,
`linux_validation` lub `docs_update`, gdy koordynator może później potrzebować sprawdzić
ten element podrzędny.

Rozwiązywanie celów akceptuje dokładne dopasowania `taskName` oraz jednoznaczne
prefiksy. Dopasowanie jest ograniczone do tego samego aktywnego/ostatniego okna celów używanego
przez numerowane cele `/subagents`, więc nieaktualny ukończony element podrzędny nie powoduje,
że ponownie użyty uchwyt staje się niejednoznaczny. Jeśli dwa aktywne lub ostatnie elementy podrzędne mają ten sam
`taskName`, cel jest niejednoznaczny; użyj zamiast tego indeksu listy, klucza sesji lub
identyfikatora uruchomienia.

Zarezerwowane cele `last` i `all` nie są prawidłowymi wartościami `taskName`,
ponieważ mają już znaczenie sterujące.

## Narzędzie: `sessions_yield`

Kończy bieżącą turę modelu i czeka, aż zdarzenia runtime, przede wszystkim
zdarzenia ukończenia podagentów, nadejdą jako następna wiadomość. Użyj tego po
uruchomieniu wymaganej pracy podrzędnej, gdy żądający nie może przygotować końcowej
odpowiedzi, dopóki te ukończenia nie nadejdą.

`sessions_yield` jest prymitywem oczekiwania. Nie zastępuj go pętlami odpytywania
po `subagents`, `sessions_list`, `sessions_history`, powłoce
`sleep` ani odpytywaniu procesów tylko po to, by wykryć ukończenie elementu podrzędnego.

Używaj `sessions_yield` tylko wtedy, gdy efektywna lista narzędzi sesji je zawiera.
Niektóre minimalne lub niestandardowe profile narzędzi mogą udostępniać `sessions_spawn` i
`subagents` bez udostępniania `sessions_yield`; w takim przypadku nie wymyślaj
pętli odpytywania tylko po to, by czekać na ukończenie.

Gdy istnieją aktywne elementy podrzędne, OpenClaw wstrzykuje zwarty, wygenerowany przez runtime
blok promptu `Active Subagents` do zwykłych tur, aby żądający mógł widzieć
bieżące sesje podrzędne, identyfikatory uruchomień, statusy, etykiety, zadania i
aliasy `taskName` bez odpytywania. Pola zadania i etykiety w tym
bloku są cytowane jako dane, a nie instrukcje, ponieważ mogą pochodzić
z dostarczonych przez użytkownika/model argumentów uruchomienia.

## Narzędzie: `subagents`

Wyświetla uruchomione przebiegi podagentów należące do sesji żądającej. Zakres jest
ograniczony do bieżącego żądającego; element podrzędny może widzieć tylko własne kontrolowane elementy podrzędne.

Używaj `subagents` do statusu na żądanie i debugowania. Używaj `sessions_yield`, aby
czekać na zdarzenia ukończenia.

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, podagent może pozostać powiązany
z wątkiem, tak aby kolejne wiadomości użytkownika w tym wątku były nadal kierowane do
tej samej sesji podagenta.

### Kanały obsługujące wątki

Każdy kanał z adapterem powiązania sesji może obsługiwać trwałe
sesje podagentów powiązane z wątkiem (`sessions_spawn` z `thread: true`).
Dołączone adaptery obejmują obecnie wątki Discord, wątki Matrix,
tematy forum Telegram oraz powiązania bieżącej konwersacji dla Feishu.
Użyj kluczy konfiguracji `threadBindings` właściwych dla kanału, aby włączać funkcję,
limity czasu i `spawnSessions`.

### Szybki przepływ

<Steps>
  <Step title="Uruchom">
    `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Powiąż">
    OpenClaw tworzy lub wiąże wątek z tym celem sesji w aktywnym kanale.
  </Step>
  <Step title="Kieruj kontynuacje">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdź limity czasu">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odłączenie po bezczynności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłącz">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Ręczne elementy sterujące

| Polecenie          | Efekt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz nowy) z celem podagenta/sesji        |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                       |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne odłączenie po bezczynności (tylko skupione powiązane wątki) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko skupione powiązane wątki)     |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Klucze nadpisania kanału i automatycznego wiązania przy uruchomieniu** są specyficzne dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Informacje o konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia ukośnikowe](/pl/tools/slash-commands), aby uzyskać aktualne szczegóły adapterów.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista skonfigurowanych identyfikatorów agentów, które mogą być celem przez jawne `agentId` (`["*"]` pozwala na dowolny skonfigurowany cel). Domyślnie: tylko agent żądający. Jeśli ustawisz listę i nadal chcesz, aby żądający uruchamiał samego siebie z `agentId`, uwzględnij identyfikator żądającego na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych skonfigurowanych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Limit czasu na wywołanie dla prób dostarczenia ogłoszenia `agent` przez Gateway. Wartości są dodatnimi całkowitymi milisekundami i są ograniczane do bezpiecznego dla platformy maksimum timera. Przejściowe ponowienia mogą sprawić, że łączny czas oczekiwania na ogłoszenie będzie dłuższy niż jeden skonfigurowany limit czasu.
</ParamField>

Jeśli sesja żądająca działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby poza piaskownicą.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane runtime, aby wywołujący mogli rozróżniać OpenClaw, Codex
app-server i inne skonfigurowane natywne runtime.

Wpisy `allowAgents` muszą wskazywać skonfigurowane identyfikatory agentów w `agents.list[]`.
`["*"]` oznacza dowolnego skonfigurowanego agenta docelowego oraz żądającego. Jeśli konfiguracja agenta
zostanie usunięta, ale jego identyfikator pozostanie w `allowAgents`, `sessions_spawn` odrzuca ten identyfikator,
a `agents_list` go pomija. Uruchom `openclaw doctor --fix`, aby wyczyścić nieaktualne
wpisy listy dozwolonych, albo dodaj minimalny wpis `agents.list[]`, gdy cel powinien
pozostać możliwy do uruchomienia przy dziedziczeniu wartości domyślnych.

### Automatyczne archiwizowanie

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczne archiwizowanie działa na zasadzie najlepszej próby; oczekujące timery są tracone, jeśli Gateway zostanie zrestartowany.
- Skonfigurowane limity czasu uruchomienia **nie** archiwizują automatycznie; tylko zatrzymują uruchomienie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczne archiwizowanie stosuje się tak samo do sesji głębokości 1 i głębokości 2.
- Czyszczenie przeglądarki jest niezależne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane na zasadzie najlepszej próby po zakończeniu uruchomienia, nawet jeśli transkrypt/rekord sesji zostaje zachowany.

## Zagnieżdżone podagenty

Domyślnie podagenty nie mogą uruchamiać własnych podagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → podagent orkiestratora →
podpodagenty robocze.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
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
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Podpodagent (pracownik liściowy)              | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki przepływają z powrotem w górę łańcucha:

1. Worker głębokości 2 kończy pracę → powiadamia swojego rodzica (orkiestrator głębokości 1).
2. Orkiestrator głębokości 1 otrzymuje powiadomienie, syntetyzuje wyniki, kończy pracę → powiadamia główną sesję.
3. Główny agent otrzymuje powiadomienie i przekazuje je użytkownikowi.

Każdy poziom widzi tylko powiadomienia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę dziecka raz i czekaj na zdarzenia
zakończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń uśpienia `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji potomnych
skupione na pracy na żywo — aktywne dzieci pozostają dołączone, zakończone dzieci
pozostają widoczne przez krótki ostatni przedział, a nieaktualne linki dzieci
istniejące tylko w magazynie są ignorowane po upływie ich okna świeżości.
Zapobiega to wskrzeszaniu widmowych dzieci po restarcie przez stare metadane
`spawnedBy` / `parentSessionKey`. Jeśli zdarzenie zakończenia dziecka dotrze po
wysłaniu przez Ciebie ostatecznej odpowiedzi, poprawną reakcją jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Zasady narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie tworzenia. Dzięki temu płaskie lub odtworzone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł tworzyć dzieci i sprawdzać ich status. Pozostałe narzędzia sesyjne/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesyjnych (obecne zachowanie domyślne).
- **Głębokość 2 (worker-liść):** brak narzędzi sesyjnych — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może tworzyć kolejnych dzieci.

### Limit tworzenia na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej
`maxChildrenPerAgent` (domyślnie `5`) aktywnych dzieci. Zapobiega to
niekontrolowanemu rozgałęzieniu z pojedynczego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich dzieci głębokości 2.

## Uwierzytelnianie

Uwierzytelnianie podagentów jest rozwiązywane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji podagenta ma postać `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **fallback**; profile agenta zastępują profile główne w razie konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
fallback. W pełni izolowane uwierzytelnianie dla każdego agenta nie jest jeszcze obsługiwane.

## Powiadomienie

Podagenty raportują z powrotem przez krok powiadomienia:

- Krok powiadomienia działa wewnątrz sesji podagenta (nie w sesji żądającej).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wynik powiadomienia jest tłumiony, nawet jeśli wcześniej istniał widoczny postęp.

Dostarczanie zależy od głębokości żądającego:

- Sesje żądające najwyższego poziomu używają wywołania uzupełniającego `agent` z dostarczaniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje podagentów żądających otrzymują wewnętrzne wstrzyknięcie uzupełniające (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja podagenta żądającego zniknęła, OpenClaw wraca do żądającego tej sesji, gdy jest dostępny.

W przypadku sesji żądających najwyższego poziomu bezpośrednie dostarczanie w trybie zakończenia najpierw
rozwiązuje dowolną powiązaną trasę konwersacji/wątku i nadpisanie hooka, a następnie uzupełnia
brakujące pola celu kanału z zapisanej trasy sesji żądającej.
Dzięki temu zakończenia trafiają do właściwego czatu/tematu, nawet gdy źródło zakończenia
identyfikuje tylko kanał.

Agregacja zakończeń dzieci jest ograniczona do bieżącego przebiegu żądającego podczas
budowania zagnieżdżonych ustaleń zakończenia, co zapobiega wyciekaniu
wyników dzieci ze starych przebiegów do bieżącego powiadomienia. Odpowiedzi powiadomień zachowują
routing wątku/tematu, gdy jest dostępny w adapterach kanałów.

### Kontekst powiadomienia

Kontekst powiadomienia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` lub `cron`                                                                                                  |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                            |
| Typ            | Typ powiadomienia + etykieta zadania                                                                                   |
| Status         | Wyprowadzony z wyniku runtime (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta od dziecka                                                                          |
| Dalsze działanie | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho                                                     |

Końcowe nieudane przebiegi raportują status błędu bez odtwarzania przechwyconego
tekstu odpowiedzi. Wynik tool/toolResult nie jest promowany do tekstu wyniku dziecka.

### Wiersz statystyk

Ładunki powiadomień zawierają na końcu wiersz statystyk (nawet po opakowaniu):

- Czas runtime (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano cennik modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkrypcji, aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Wewnętrzne metadane są przeznaczone wyłącznie do orkiestracji; odpowiedzi widoczne dla użytkownika
powinny być przepisane normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- Przypominanie asystenta jest najpierw normalizowane: tagi myślenia są usuwane; rusztowanie `<relevant-memories>` / `<relevant_memories>` jest usuwane; bloki ładunków XML wywołań narzędzi w tekście zwykłym (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) są usuwane, w tym ucięte ładunki, które nigdy nie zamykają się poprawnie; zdegradowane rusztowanie wywołań/wyników narzędzi i znaczniki kontekstu historycznego są usuwane; wyciekłe tokeny kontrolne modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnoszerokościowe `<｜...｜>`) są usuwane; niepoprawny XML wywołań narzędzi MiniMax jest usuwany.
- Tekst przypominający poświadczenia/tokeny jest redagowany.
- Długie bloki mogą być skracane.
- Bardzo duże historie mogą usuwać starsze wiersze lub zastępować nadmiarowy wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkrypcji na dysku jest fallbackiem, gdy potrzebujesz pełnej transkrypcji bajt w bajt.

## Zasady narzędzi

Podagenty używają najpierw tego samego profilu i potoku zasad narzędzi co rodzic lub
agent docelowy. Następnie OpenClaw stosuje warstwę ograniczeń podagenta.

Bez restrykcyjnego `tools.profile` podagenty otrzymują **wszystkie narzędzia oprócz
narzędzia wiadomości, narzędzi sesyjnych i narzędzi systemowych**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` także tutaj pozostaje ograniczonym, oczyszczonym widokiem przypomnienia — nie jest
surowym zrzutem transkrypcji.

Gdy `maxSpawnDepth >= 2`, podagenty-orkiestratorzy głębokości 1 dodatkowo
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

`tools.subagents.tools.allow` jest końcowym filtrem tylko zezwalającym. Może zawęzić
już rozwiązany zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` zawiera
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby pozwolić
podagentom z profilem coding używać automatyzacji przeglądarki, dodaj browser na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj `agents.list[].tools.alsoAllow: ["browser"]` dla pojedynczego agenta,
który ma otrzymać automatyzację przeglądarki.

## Współbieżność

Podagenty używają dedykowanej kolejki w procesie:

- **Nazwa kolejki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że
podagent nadal działa. Niezakończone przebiegi starsze niż okno nieaktualnego przebiegu
przestają liczyć się jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu,
bramkowaniu zakończenia potomków i kontrolach współbieżności na sesję.

Po restarcie Gateway nieaktualne niezakończone odtworzone przebiegi są usuwane, chyba że
ich sesja dziecka jest oznaczona `abortedLastRun: true`. Te
przerwane przez restart sesje dzieci pozostają odzyskiwalne przez przepływ
odzyskiwania osieroconych podagentów, który wysyła syntetyczną wiadomość wznowienia przed
wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone dla każdej sesji dziecka. Jeśli to samo
dziecko podagenta jest wielokrotnie akceptowane do odzyskiwania osieroconego w
oknie szybkiego ponownego zakleszczenia, OpenClaw utrwala tombstone odzyskiwania w tej
sesji i przestaje automatycznie wznawiać ją po późniejszych restartach. Uruchom
`openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo
`openclaw doctor --fix`, aby wyczyścić nieaktualne flagi odzyskiwania przerwania w
sesjach z tombstone.

<Note>
Jeśli tworzenie podagenta kończy się błędem Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, sprawdź wywołującego RPC przed edycją stanu parowania.
Wewnętrzna koordynacja `sessions_spawn` wysyła w procesie, gdy
wywołujący działa już w kontekście żądania gateway, więc nie otwiera
loopback WebSocket ani nie zależy od bazowego zakresu sparowanego urządzenia CLI.
Wywołujący spoza procesu gateway nadal używają fallbacku WebSocket
jako `client.id: "gateway-client"` z `client.mode: "backend"`
przez bezpośrednie uwierzytelnianie loopback współdzielonym tokenem/hasłem. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokena urządzenia oraz klienci browser/node
nadal wymagają normalnego zatwierdzenia urządzenia dla rozszerzeń zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` w czacie żądającym przerywa sesję żądającą i zatrzymuje wszystkie aktywne przebiegi podagentów utworzone z niej, kaskadowo przechodząc do zagnieżdżonych dzieci.

## Ograniczenia

- Powiadomienie podagenta działa na zasadzie **best-effort**. Jeśli gateway zrestartuje się, oczekująca praca „powiadom z powrotem” zostanie utracona.
- Podagenty nadal współdzielą te same zasoby procesu gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst podagenta wstrzykuje tylko `AGENTS.md` i `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`). Natywne podagenty Codex przestrzegają tej samej granicy: `TOOLS.md` pozostaje w odziedziczonych instrukcjach wątku Codex, natomiast pliki persony, tożsamości i użytkownika przeznaczone tylko dla rodzica są wstrzykiwane jako instrukcje współpracy ograniczone do tury, aby dzieci ich nie klonowały.
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana w większości przypadków użycia.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia wieloagentowego sandboxa](/pl/tools/multi-agent-sandbox-tools)
