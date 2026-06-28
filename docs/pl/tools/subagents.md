---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pomocą agenta
    - Zmieniasz sessions_spawn lub politykę narzędzi podagentów
    - Wdrażasz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane uruchomienia agenta w tle, które ogłaszają wyniki z powrotem na czacie osoby zgłaszającej żądanie
title: Podagenci
x-i18n:
    generated_at: "2026-06-28T00:13:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Podagenci to działające w tle uruchomienia agentów tworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i
po zakończeniu **ogłaszają** swój wynik z powrotem w kanale czatu
żądającego. Każde uruchomienie podagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoległe wykonywanie pracy typu „badanie / długie zadanie / powolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja podagentów (separacja sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: podagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy podagent ma domyślnie własny kontekst i użycie
tokenów. W przypadku ciężkich lub powtarzalnych zadań ustaw tańszy model dla podagentów
i pozostaw głównego agenta na modelu wyższej jakości. Skonfiguruj przez
`agents.defaults.subagents.model` lub nadpisania dla poszczególnych agentów. Gdy dziecko
    rzeczywiście potrzebuje bieżącego transkryptu żądającego, agent może zażądać
    `context: "fork"` dla tego jednego utworzenia. Sesje podagentów powiązane z wątkiem domyślnie używają
    `context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do
    wątku kontynuacji.
</Note>

## Polecenie ukośnikowe

Użyj `/subagents`, aby sprawdzić uruchomienia podagentów dla **bieżącej sesji**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` pokazuje metadane uruchomienia (status, znaczniki czasu, id sesji,
ścieżkę transkryptu, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przywołania; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego pełnego transkryptu.

### Kontrolki powiązania wątków

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

Agenci uruchamiają podagentów w tle za pomocą `sessions_spawn`. Zakończenia podagentów
wracają jako wewnętrzne zdarzenia sesji nadrzędnej; agent nadrzędny/żądający decyduje,
czy potrzebna jest aktualizacja widoczna dla użytkownika.

<AccordionGroup>
  <Accordion title="Niebblokujące zakończenie oparte na push">
    - `sessions_spawn` jest nieblokujące; natychmiast zwraca id uruchomienia.
    - Po zakończeniu podagent zgłasza się z powrotem do sesji nadrzędnej/żądającej.
    - Tury agenta, które potrzebują wyników dziecka, powinny wywołać `sessions_yield` po utworzeniu wymaganej pracy. Kończy to bieżącą turę i pozwala zdarzeniom zakończenia dotrzeć jako następna wiadomość widoczna dla modelu.
    - Zakończenie jest oparte na push. Po utworzeniu **nie** odpytuj `/subagents list`, `sessions_list` ani `sessions_history` w pętli tylko po to, aby czekać na zakończenie; sprawdzaj status tylko na żądanie w celu widoczności debugowania.
    - Dane wyjściowe dziecka są raportem/dowodem dla agenta żądającego do syntezy. Nie są tekstem instrukcji autorstwa użytkownika i nie mogą nadpisywać zasad systemowych, deweloperskich ani użytkownika.
    - Po zakończeniu OpenClaw w trybie najlepszej próby zamyka śledzone karty przeglądarki/procesy otwarte przez tę sesję podagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Dostarczenie zakończenia">
    - OpenClaw przekazuje zakończenia z powrotem do sesji żądającej przez turę `agent` ze stabilnym kluczem idempotencji.
    - Jeśli uruchomienie żądającego jest nadal aktywne, OpenClaw najpierw próbuje obudzić/ukierunkować to uruchomienie zamiast rozpoczynać drugą widoczną ścieżkę odpowiedzi.
    - Jeśli aktywnego żądającego nie można obudzić, OpenClaw przełącza się na przekazanie do agenta żądającego z tym samym kontekstem zakończenia zamiast porzucać ogłoszenie.
    - Udane przekazanie do rodzica kończy dostarczanie podagenta nawet wtedy, gdy rodzic zdecyduje, że nie jest potrzebna widoczna aktualizacja dla użytkownika.
    - Natywni podagenci nie otrzymują narzędzia wiadomości. Zwracają zwykły tekst asystenta do agenta nadrzędnego/żądającego; odpowiedzi widoczne dla człowieka są własnością normalnej polityki dostarczania agenta nadrzędnego/żądającego.
    - Jeśli nie można użyć bezpośredniego przekazania, następuje przełączenie awaryjne na routing kolejki.
    - Jeśli routing kolejki nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostateczną rezygnacją.
    - Dostarczenie zakończenia zachowuje rozwiązaną trasę żądającego: trasy zakończeń powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło zakończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczanie nadal działało.

  </Accordion>
  <Accordion title="Metadane przekazania zakończenia">
    Przekazanie zakończenia do sesji żądającej to wygenerowany przez runtime
    wewnętrzny kontekst (nie tekst autorstwa użytkownika) i obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant` od dziecka. Dane wyjściowe tool/toolResult nie są promowane do wyników dziecka. Terminalne nieudane uruchomienia nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Kompaktowe statystyki runtime/tokenów.
    - Instrukcję przeglądu mówiącą agentowi żądającemu, aby zweryfikował wynik przed podjęciem decyzji, czy pierwotne zadanie jest wykonane.
    - Wskazówki dotyczące kontynuacji mówiące agentowi żądającemu, aby kontynuował zadanie lub zapisał kontynuację, gdy wynik dziecka pozostawia więcej działań.
    - Instrukcję końcowej aktualizacji dla ścieżki bez dalszych działań, napisaną normalnym głosem asystenta bez przekazywania surowych wewnętrznych metadanych.

  </Accordion>
  <Accordion title="Tryby i runtime ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po zakończeniu.
    - W przypadku trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - Jeśli kanał żądającego nie obsługuje powiązań wątków, użyj `mode: "run"` zamiast ponawiać niemożliwe kombinacje powiązane z wątkiem.
    - W przypadku sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode lub jawne Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza ten runtime. Zobacz [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania zakończeń lub pętli agent-do-agenta. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie prosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"` do czasu włączenia ACP, gdy żądający nie jest w sandboxie, a Plugin backendu, taki jak `acpx`, jest załadowany. `runtime: "acp"` oczekuje zewnętrznego id uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; użyj domyślnego runtime podagenta dla normalnych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni podagenci zaczynają w izolacji, chyba że wywołujący jawnie poprosi o rozgałęzienie
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badania, niezależna implementacja, powolna praca narzędzia lub cokolwiek, co można opisać w tekście zadania                           | Tworzy czysty transkrypt dziecka. Jest to ustawienie domyślne i utrzymuje niższe użycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub niuansowych instrukcji już obecnych w transkrypcie żądającego | Rozgałęzia transkrypt żądającego do sesji dziecka przed startem dziecka. |

Używaj `fork` oszczędnie. Służy do delegowania zależnego od kontekstu, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia podagenta z `deliver: false` na globalnym pasie `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale
czatu żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
nie udostępnia; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, którzy powinni delegować
pracę. Polityki allow/deny kanału/grupy, dostawcy, sandboxu i poszczególnych agentów mogą
nadal usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** natywni podagenci dziedziczą po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla poszczególnych agentów). Tworzenia runtime ACP używają tego samego skonfigurowanego modelu podagenta, gdy jest obecny; w przeciwnym razie uprząż ACP zachowuje własną wartość domyślną. Jawne `sessions_spawn.model` nadal wygrywa.
- **Thinking:** natywni podagenci dziedziczą po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla poszczególnych agentów). Tworzenia runtime ACP stosują również `agents.defaults.models["provider/model"].params.thinking` dla wybranego modelu. Jawne `sessions_spawn.thinking` nadal wygrywa.
- **Limit czasu uruchomienia:** OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie przełącza się na `0` (brak limitu czasu). `sessions_spawn` nie akceptuje nadpisań limitu czasu dla pojedynczego wywołania.
- **Dostarczanie zadania:** natywni podagenci otrzymują delegowane zadanie w swojej pierwszej widocznej wiadomości `[Subagent Task]`. Prompt systemowy podagenta przenosi reguły runtime i kontekst routingu, a nie ukryty duplikat zadania.

Zaakceptowane natywne utworzenia podagentów zawierają rozwiązaną metadane modelu dziecka w
wyniku narzędzia: `resolvedModel` zawiera zastosowany ref modelu, a
`resolvedProvider` zawiera prefiks dostawcy, gdy ref go ma.

### Tryb promptu delegowania

`agents.defaults.subagents.delegationMode` kontroluje tylko wskazówki promptu; nie zmienia polityki narzędzi ani nie wymusza delegowania.

- `suggest` (domyślnie): zachowaj standardową sugestię promptu, aby używać podagentów do większej lub wolniejszej pracy.
- `prefer`: powiedz głównemu agentowi, aby pozostawał responsywny i delegował wszystko bardziej złożone niż bezpośrednia odpowiedź przez `sessions_spawn`.

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
  Opcjonalny stabilny uchwyt do identyfikowania konkretnego procesu potomnego w późniejszym wyjściu statusu. Musi pasować do `[a-z][a-z0-9_-]{0,63}` i nie może być zarezerwowanym celem, takim jak `last` lub `all`.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Uruchom w ramach innego skonfigurowanego identyfikatora agenta, gdy pozwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Opcjonalny katalog roboczy zadania dla uruchomienia potomnego. Natywne podagenty nadal ładują pliki rozruchowe z obszaru roboczego agenta docelowego; `cwd` zmienia tylko miejsce, w którym narzędzia wykonawcze i uprzęże CLI wykonują delegowaną pracę.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone tylko dla zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie żądanych Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane przy uruchamianiu natywnych podagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje wyjście uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń przy uruchamianiu natywnych podagentów.
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
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypcję przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca uruchomienie, chyba że docelowe środowisko wykonawcze procesu potomnego jest w piaskownicy.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżącą transkrypcję żądającego do sesji potomnej. Tylko natywne podagenty. Uruchomienia powiązane z wątkiem domyślnie używają `fork`; uruchomienia bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** przyjmuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Natywne podagenty zgłaszają
swój najnowszy zwrot asystenta z powrotem do żądającego; zewnętrzne dostarczanie pozostaje przy
agencie nadrzędnym/żądającym.
</Warning>

### Nazwy zadań i kierowanie

`taskName` to uchwyt widoczny dla modelu do orkiestracji, a nie klucz sesji.
Używaj go dla stabilnych nazw procesów potomnych, takich jak `review_subagents`,
`linux_validation` lub `docs_update`, gdy koordynator może potrzebować później sprawdzić
ten proces potomny.

Rozpoznawanie celu akceptuje dokładne dopasowania `taskName` oraz jednoznaczne
prefiksy. Dopasowanie jest ograniczone do tego samego aktywnego/ostatniego okna celu używanego
przez numerowane cele `/subagents`, więc nieaktualny ukończony proces potomny nie sprawia,
że ponownie użyty uchwyt staje się niejednoznaczny. Jeśli dwa aktywne lub ostatnie procesy potomne współdzielą ten sam
`taskName`, cel jest niejednoznaczny; użyj zamiast tego indeksu listy, klucza sesji lub
identyfikatora uruchomienia.

Zarezerwowane cele `last` i `all` nie są prawidłowymi wartościami `taskName`,
ponieważ mają już znaczenie sterujące.

## Narzędzie: `sessions_yield`

Kończy bieżący zwrot modelu i czeka, aż zdarzenia środowiska wykonawczego, przede wszystkim
zdarzenia ukończenia podagentów, dotrą jako następna wiadomość. Użyj go po
uruchomieniu wymaganej pracy potomnej, gdy żądający nie może przygotować ostatecznej
odpowiedzi, dopóki te ukończenia nie nadejdą.

`sessions_yield` jest prymitywem oczekiwania. Nie zastępuj go pętlami
odpytywania po `subagents`, `sessions_list`, `sessions_history`, powłokowym
`sleep` ani odpytywaniem procesów tylko po to, aby wykryć ukończenie procesu potomnego.

Używaj `sessions_yield` tylko wtedy, gdy efektywna lista narzędzi sesji go zawiera.
Niektóre minimalne lub niestandardowe profile narzędzi mogą udostępniać `sessions_spawn` i
`subagents` bez udostępniania `sessions_yield`; w takim przypadku nie wymyślaj
pętli odpytywania tylko po to, aby czekać na ukończenie.

Gdy istnieją aktywne procesy potomne, OpenClaw wstrzykuje kompaktowy, wygenerowany przez środowisko wykonawcze
blok promptu `Active Subagents` do zwykłych zwrotów, aby żądający mógł zobaczyć
bieżące sesje potomne, identyfikatory uruchomień, statusy, etykiety, zadania i
aliasy `taskName` bez odpytywania. Pola zadania i etykiety w tym
bloku są cytowane jako dane, a nie instrukcje, ponieważ mogą pochodzić
z argumentów uruchomienia dostarczonych przez użytkownika/model.

## Narzędzie: `subagents`

Wyświetla uruchomione przebiegi podagentów należące do sesji żądającego. Jest ograniczone
do bieżącego żądającego; proces potomny widzi tylko własne kontrolowane procesy potomne.

Używaj `subagents` do statusu na żądanie i debugowania. Używaj `sessions_yield`, aby
czekać na zdarzenia ukończenia.

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, podagent może pozostać powiązany
z wątkiem, dzięki czemu kolejne wiadomości użytkownika w tym wątku nadal trafiają do
tej samej sesji podagenta.

### Kanały obsługujące wątki

Dowolny kanał z adapterem powiązań sesji może obsługiwać trwałe
sesje podagentów powiązane z wątkiem (`sessions_spawn` z `thread: true`).
Dołączone adaptery obecnie obejmują wątki Discord, wątki Matrix,
tematy forum Telegram oraz powiązania bieżącej konwersacji dla Feishu.
Użyj kluczy konfiguracji `threadBindings` dla poszczególnych kanałów do włączania,
limitów czasu i `spawnSessions`.

### Szybki przepływ

<Steps>
  <Step title="Spawn">
    `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw tworzy lub wiąże wątek z tym celem sesji w aktywnym kanale.
  </Step>
  <Step title="Route follow-ups">
    Odpowiedzi i kolejne wiadomości w tym wątku trafiają do powiązanej sesji.
  </Step>
  <Step title="Inspect timeouts">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne usuwanie fokusu po bezczynności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Detach">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Sterowanie ręczne

| Polecenie          | Efekt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz nowy) z celem podagenta/sesji        |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                       |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne usuwanie fokusu po bezczynności (tylko powiązane wątki z fokusem) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko powiązane wątki z fokusem)    |

### Przełączniki konfiguracji

- **Domyślna wartość globalna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego wiązania uruchomień** są specyficzne dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia ukośnikowe](/pl/tools/slash-commands), aby uzyskać bieżące szczegóły adapterów.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista skonfigurowanych identyfikatorów agentów, które mogą być celem przez jawne `agentId` (`["*"]` pozwala na dowolny skonfigurowany cel). Domyślnie: tylko agent żądający. Jeśli ustawisz listę i nadal chcesz, aby żądający uruchamiał siebie z `agentId`, uwzględnij identyfikator żądającego na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych skonfigurowanych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuj wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Limit czasu na wywołanie dla prób dostarczenia ogłoszenia `agent` przez gateway. Wartości są dodatnimi całkowitymi milisekundami i są ograniczane do bezpiecznego dla platformy maksimum timera. Przejściowe ponowienia mogą sprawić, że łączny czas oczekiwania na ogłoszenie będzie dłuższy niż jeden skonfigurowany limit czasu.
</ParamField>

Jeśli sesja żądającego działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby poza piaskownicą.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska wykonawczego, aby wywołujący mogli odróżnić OpenClaw, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska wykonawcze.

Wpisy `allowAgents` muszą wskazywać skonfigurowane identyfikatory agentów w `agents.list[]`.
`["*"]` oznacza dowolnego skonfigurowanego agenta docelowego oraz żądającego. Jeśli konfiguracja agenta
zostanie usunięta, ale jego identyfikator pozostanie w `allowAgents`, `sessions_spawn` odrzuca ten identyfikator,
a `agents_list` go pomija. Uruchom `openclaw doctor --fix`, aby wyczyścić nieaktualne
wpisy listy dozwolonych, albo dodaj minimalny wpis `agents.list[]`, gdy cel powinien
pozostać możliwy do uruchomienia, dziedzicząc wartości domyślne.

### Automatyczna archiwizacja

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkrypcji na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypcję przez zmianę nazwy).
- Automatyczna archiwizacja działa na zasadzie best-effort; oczekujące timery przepadają, jeśli gateway zostanie ponownie uruchomiony.
- Skonfigurowane limity czasu uruchomienia **nie** archiwizują automatycznie; tylko zatrzymują uruchomienie. Sesja pozostaje do automatycznej archiwizacji.
- Automatyczna archiwizacja stosuje się jednakowo do sesji głębokości 1 i głębokości 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane na zasadzie best-effort po zakończeniu uruchomienia, nawet jeśli zapis transkrypcji/sesji zostaje zachowany.

## Zagnieżdżone podagenty

Domyślnie podagenty nie mogą uruchamiać własnych podagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → podagent orkiestrator →
pod-podagenty robocze.

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
| 0         | `agent:<id>:main`                            | Agent główny                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Pod-podagent (pracownik liściowy)             | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki przepływają z powrotem w górę łańcucha:

1. Worker głębokości 2 kończy pracę → ogłasza to swojemu rodzicowi (orkiestratorowi głębokości 1).
2. Orkiestrator głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki, kończy pracę → ogłasza to do głównego agenta.
3. Główny agent odbiera ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę dzieci raz i czekaj na zdarzenia
ukończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń usypiania `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skupione na pracy na żywo — aktywne dzieci pozostają podpięte, zakończone dzieci
pozostają widoczne przez krótkie ostatnie okno, a przestarzałe linki dzieci
istniejące tylko w magazynie są ignorowane po upływie ich okna świeżości. Zapobiega to wskrzeszaniu widmowych dzieci po
ponownym uruchomieniu przez stare metadane `spawnedBy` /
`parentSessionKey`. Jeśli zdarzenie ukończenia dziecka dotrze po tym, jak wysłano już
odpowiedź końcową, poprawnym dalszym działaniem jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Polityka narzędzi według głębokości

- Rola i zakres sterowania są zapisywane w metadanych sesji w momencie spawnowania. Dzięki temu płaskie lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł spawnować dzieci i sprawdzać ich status. Inne narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (obecne zachowanie domyślne).
- **Głębokość 2 (worker liściowy):** brak narzędzi sesji — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może spawnować dalszych dzieci.

### Limit spawnowania na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z pojedynczego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
głębokości 2:

- `/stop` na głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo zatrzymuje ich dzieci głębokości 2.

## Uwierzytelnianie

Uwierzytelnianie subagenta jest rozwiązywane według **identyfikatora agenta**, a nie według typu sesji:

- Klucz sesji subagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **fallback**; profile agenta zastępują profile główne w przypadku konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
fallbacki. W pełni izolowane uwierzytelnianie na agenta nie jest jeszcze obsługiwane.

## Ogłaszanie

Subagenci raportują z powrotem przez krok ogłaszania:

- Krok ogłaszania działa wewnątrz sesji subagenta (nie w sesji żądającej).
- Jeśli subagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wyjście ogłoszenia jest tłumione nawet wtedy, gdy wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości żądającego:

- Sesje żądające najwyższego poziomu używają kolejnego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje subagentów żądających otrzymują wewnętrzne wstrzyknięcie dalszego wywołania (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja subagenta żądającego zniknęła, OpenClaw wraca do żądającego tej sesji, gdy jest dostępny.

Dla sesji żądających najwyższego poziomu bezpośrednie dostarczenie w trybie ukończenia najpierw
rozwiązuje dowolną powiązaną trasę rozmowy/wątku i nadpisanie hooka, a następnie uzupełnia
brakujące pola kanału-docelu z zapisanej trasy sesji żądającej.
Dzięki temu ukończenia pozostają na właściwym czacie/temacie nawet wtedy, gdy źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci jest ograniczona do bieżącego uruchomienia żądającego podczas
budowania zagnieżdżonych ustaleń ukończenia, co zapobiega przeciekaniu
wyjść dzieci z poprzednich uruchomień do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują
trasowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.

### Kontekst ogłaszania

Kontekst ogłaszania jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` lub `cron`                                                                                         |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                |
| Typ            | Typ ogłoszenia + etykieta zadania                                                                             |
| Status         | Wyprowadzony z wyniku runtime (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta od dziecka                                                                 |
| Dalsze działanie | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho                                           |

Zakończone niepowodzeniem uruchomienia terminalne raportują status niepowodzenia bez odtwarzania przechwyconego
tekstu odpowiedzi. Wyjście tool/toolResult nie jest promowane do tekstu wyniku dziecka.

### Wiersz statystyk

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet gdy są zawijane):

- Czas runtime (np. `runtime 5m12s`).
- Zużycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modelu (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkryptu, aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone tylko do orkiestracji; odpowiedzi skierowane do użytkownika
należy przepisać normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- Przywoływanie asystenta jest najpierw normalizowane: tagi myślenia usunięte; szkielety `<relevant-memories>` / `<relevant_memories>` usunięte; bloki ładunków XML wywołań narzędzi w tekście jawnym (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) usunięte, w tym obcięte ładunki, które nigdy nie zamykają się czysto; zdegradowane szkielety wywołań/wyników narzędzi i markery kontekstu historycznego usunięte; ujawnione tokeny sterujące modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnej szerokości `<｜...｜>`) usunięte; zniekształcony XML wywołań narzędzi MiniMax usunięty.
- Tekst przypominający poświadczenia/tokeny jest redagowany.
- Długie bloki mogą być obcinane.
- Bardzo duże historie mogą usuwać starsze wiersze lub zastępować zbyt duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Użyj `nextOffset`, gdy jest obecny, aby stronicować wstecz przez starsze okna transkryptu.
- Surowa inspekcja transkryptu na dysku jest fallbackiem, gdy potrzebujesz pełnego transkryptu bajt w bajt.

## Polityka narzędzi

Subagenci najpierw używają tego samego profilu i potoku polityki narzędzi co agent nadrzędny lub
docelowy. Następnie OpenClaw stosuje warstwę ograniczeń subagenta.

Bez restrykcyjnego `tools.profile` subagenci otrzymują **wszystkie narzędzia oprócz
narzędzia wiadomości, narzędzi sesji i narzędzi systemowych**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` pozostaje także tutaj ograniczonym, oczyszczonym widokiem przywołania — nie jest
surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, subagenci orkiestratorzy głębokości 1 dodatkowo
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

`tools.subagents.tools.allow` jest końcowym filtrem tylko-dopuszczającym. Może zawęzić
już rozwiązany zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby pozwolić
subagentom z profilem coding używać automatyzacji przeglądarki, dodaj browser na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj `agents.list[].tools.alsoAllow: ["browser"]` dla każdego agenta, gdy tylko jeden
agent powinien otrzymać automatyzację przeglądarki.

## Współbieżność

Subagenci używają dedykowanej kolejki wewnątrz procesu:

- **Nazwa toru:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że
subagent nadal działa. Niezakończone uruchomienia starsze niż okno przestarzałego uruchomienia
przestają liczyć się jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu,
bramkowaniu ukończeń potomków i kontrolach współbieżności na sesję.

Po ponownym uruchomieniu gatewaya przestarzałe, niezakończone przywrócone uruchomienia są przycinane, chyba że
ich sesja dziecka jest oznaczona `abortedLastRun: true`. Te
przerwane przez restart sesje dzieci pozostają odzyskiwalne przez przepływ odzyskiwania osieroconego subagenta,
który wysyła syntetyczną wiadomość wznowienia przed
wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone na sesję dziecka. Jeśli to samo
dziecko subagenta jest wielokrotnie akceptowane do odzyskiwania osierocenia wewnątrz
okna szybkiego ponownego zakleszczenia, OpenClaw utrwala nagrobek odzyskiwania w tej
sesji i przestaje automatycznie wznawiać ją przy późniejszych restartach. Uruchom
`openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, lub
`openclaw doctor --fix`, aby wyczyścić przestarzałe flagi przerwanego odzyskiwania w
sesjach z nagrobkiem.

<Note>
Jeśli spawnowanie subagenta kończy się niepowodzeniem z Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, sprawdź wywołującego RPC przed edytowaniem stanu parowania.
Wewnętrzna koordynacja `sessions_spawn` wysyła w procesie, gdy
wywołujący działa już wewnątrz kontekstu żądania gatewaya, więc nie
otwiera WebSocketu local loopback ani nie zależy od bazowego zakresu sparowanego urządzenia CLI.
Wywołujący spoza procesu gatewaya nadal używają fallbacku WebSocket
jako `client.id: "gateway-client"` z `client.mode: "backend"`
przez bezpośrednie uwierzytelnianie direct loopback współdzielonym tokenem/hasłem. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokenu urządzenia oraz klienci browser/node
nadal wymagają normalnego zatwierdzenia urządzenia dla podniesień zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia subagentów z niej spawnowane, kaskadowo przechodząc na zagnieżdżone dzieci.

## Ograniczenia

- Ogłaszanie subagenta jest **best-effort**. Jeśli gateway zostanie ponownie uruchomiony, oczekująca praca „ogłoś z powrotem” zostanie utracona.
- Subagenci nadal współdzielą te same zasoby procesu gatewaya; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst subagenta wstrzykuje tylko `AGENTS.md` i `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`). Subagenci natywni dla Codex przestrzegają tej samej granicy: `TOOLS.md` pozostaje w odziedziczonych instrukcjach wątku Codex, podczas gdy pliki persony, tożsamości i użytkownika przeznaczone tylko dla rodzica są wstrzykiwane jako instrukcje współpracy ograniczone do tury, aby dzieci ich nie klonowały.
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana dla większości przypadków użycia.
- `maxChildrenPerAgent` ogranicza aktywne dzieci na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie do agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia sandboxa wieloagentowego](/pl/tools/multi-agent-sandbox-tools)
