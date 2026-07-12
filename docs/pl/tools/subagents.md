---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pośrednictwem agenta
    - Zmieniasz zasady narzędzia sessions_spawn lub podagenta
    - Implementujesz lub rozwiązujesz problemy z sesjami podagentów powiązanymi z wątkami
sidebarTitle: Sub-agents
summary: Uruchamiaj odizolowane zadania agenta w tle, które ogłaszają wyniki na czacie osoby zgłaszającej żądanie
title: Podagenci
x-i18n:
    generated_at: "2026-07-12T15:44:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

Subagenci to działające w tle uruchomienia agentów, tworzone z poziomu istniejącego uruchomienia agenta.
Każdy z nich działa we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i po
zakończeniu **ogłasza** swój wynik z powrotem w kanale czatu zleceniodawcy.
Każde uruchomienie subagenta jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Cele:

- Równoległe wykonywanie badań, długotrwałych zadań i powolnych operacji narzędziowych bez blokowania głównego uruchomienia.
- Domyślne izolowanie subagentów (oddzielne sesje, opcjonalna piaskownica).
- Utrzymanie zestawu narzędzi trudnego do niewłaściwego użycia: subagenci domyślnie **nie** otrzymują narzędzi sesji ani wiadomości.
- Obsługa konfigurowalnej głębokości zagnieżdżenia na potrzeby wzorców orkiestracji.

<Note>
**Uwaga dotycząca kosztów:** każdy subagent ma domyślnie własny kontekst
i własne zużycie tokenów. W przypadku wymagających lub powtarzalnych zadań ustaw
tańszy model dla subagentów, a dla głównego agenta zachowaj model wyższej jakości
za pomocą `agents.defaults.subagents.model` lub nadpisań dla poszczególnych agentów.
Gdy agent podrzędny rzeczywiście potrzebuje bieżącego transkryptu zleceniodawcy,
utwórz go z opcją `context: "fork"`. Sesje subagentów powiązane z wątkiem
domyślnie używają `context: "fork"`, ponieważ tworzą odgałęzienie bieżącej
konwersacji w wątku kontynuacyjnym.
</Note>

## Polecenie z ukośnikiem

`/subagents` sprawdza uruchomienia subagentów dla **bieżącej sesji**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` wyświetla metadane uruchomienia (stan, znaczniki czasu,
identyfikator sesji, ścieżkę transkryptu, czyszczenie). `/subagents log` wyświetla
ostatnie tury czatu danego uruchomienia; dodaj token `tools`, aby uwzględnić
wiadomości wywołań narzędzi i ich wyników (domyślnie pomijane). Użyj
`sessions_history`, aby z poziomu tury agenta uzyskać ograniczony i filtrowany
pod kątem bezpieczeństwa widok historii, albo sprawdź ścieżkę transkryptu na dysku,
aby uzyskać pełny, nieprzetworzony transkrypt.

### Sterowanie powiązaniem z wątkiem

Te polecenia działają w kanałach z trwałymi powiązaniami z wątkami. Zobacz
[Kanały obsługujące wątki](#thread-supporting-channels) poniżej.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Zachowanie podczas tworzenia

Agenci uruchamiają subagentów w tle za pomocą narzędzia `sessions_spawn`.
Zakończenia są zwracane jako wewnętrzne zdarzenia sesji nadrzędnej; agent
nadrzędny lub zleceniodawca decyduje, czy potrzebna jest aktualizacja widoczna
dla użytkownika.

<AccordionGroup>
  <Accordion title="Nieblokujące zakończenie oparte na wypychaniu">
    - `sessions_spawn` jest nieblokujące; natychmiast zwraca identyfikator uruchomienia.
    - Po zakończeniu subagent przesyła raport z powrotem do sesji nadrzędnej lub sesji zleceniodawcy.
    - Tury agenta, które potrzebują wyników agentów podrzędnych, powinny po utworzeniu wymaganych zadań wywołać `sessions_yield`. Kończy to bieżącą turę i pozwala, aby zdarzenie zakończenia dotarło jako następna wiadomość widoczna dla modelu.
    - Zakończenie jest oparte na wypychaniu. Po utworzeniu zadania **nie** odpytuj w pętli `/subagents list`, `sessions_list` ani `sessions_history` wyłącznie po to, aby czekać na jego zakończenie; sprawdzaj stan na żądanie tylko podczas debugowania.
    - Wynik agenta podrzędnego jest raportem lub materiałem dowodowym, który agent zleceniodawcy ma podsumować. Nie jest tekstem instrukcji napisanym przez użytkownika i nie może zastąpić zasad systemowych, deweloperskich ani użytkownika.
    - Po zakończeniu OpenClaw w miarę możliwości zamyka śledzone karty przeglądarki i procesy otwarte przez sesję danego subagenta, zanim będzie kontynuowany proces czyszczenia związany z ogłoszeniem.

  </Accordion>
  <Accordion title="Dostarczanie zakończenia">
    - OpenClaw przekazuje zakończenia z powrotem do sesji zleceniodawcy przez turę `agent` ze stabilnym kluczem idempotencji.
    - Jeśli uruchomienie zleceniodawcy jest nadal aktywne, OpenClaw najpierw próbuje je wznowić lub pokierować nim, zamiast rozpoczynać drugą ścieżkę widocznej odpowiedzi.
    - Jeśli aktywnego zleceniodawcy nie można wznowić, OpenClaw przechodzi na przekazanie do agenta zleceniodawcy z tym samym kontekstem zakończenia, zamiast odrzucać ogłoszenie.
    - Udane przekazanie do agenta nadrzędnego kończy dostarczanie wyniku subagenta, nawet jeśli agent nadrzędny uzna, że widoczna aktualizacja dla użytkownika nie jest potrzebna.
    - Natywni subagenci nie otrzymują narzędzia wiadomości. Zwracają zwykły tekst asystenta do agenta nadrzędnego lub agenta zleceniodawcy; odpowiedzi widoczne dla ludzi pozostają pod kontrolą standardowych zasad dostarczania agenta nadrzędnego lub agenta zleceniodawcy.
    - Jeśli nie można użyć bezpośredniego przekazania, dostarczanie przechodzi na trasowanie przez kolejkę, a następnie na krótką ponowną próbę ogłoszenia z wykładniczo rosnącym opóźnieniem przed ostateczną rezygnacją.
    - Dostarczanie zachowuje rozpoznaną trasę zleceniodawcy: trasy zakończenia powiązane z wątkiem lub konwersacją mają pierwszeństwo, gdy są dostępne. Jeśli źródło zakończenia udostępnia tylko kanał, OpenClaw uzupełnia brakujący cel lub konto na podstawie rozpoznanej trasy sesji zleceniodawcy (`lastChannel` / `lastTo` / `lastAccountId`), dzięki czemu bezpośrednie dostarczanie nadal działa.

  </Accordion>
  <Accordion title="Metadane przekazania zakończenia">
    Przekazanie zakończenia do sesji zleceniodawcy jest generowanym podczas działania
    kontekstem wewnętrznym (a nie tekstem napisanym przez użytkownika) i zawiera:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant` od agenta podrzędnego. Dane wyjściowe `tool`/`toolResult` nie są przenoszone do wyników agenta podrzędnego. Uruchomienia zakończone niepowodzeniem nie wykorzystują ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Zwięzłe statystyki środowiska uruchomieniowego i tokenów.
    - Instrukcję przeglądu nakazującą agentowi zleceniodawcy zweryfikowanie wyniku przed podjęciem decyzji, czy pierwotne zadanie zostało ukończone.
    - Wskazówki dotyczące dalszych działań, nakazujące agentowi zleceniodawcy kontynuowanie zadania lub zapisanie działania uzupełniającego, jeśli wynik agenta podrzędnego wymaga dalszej pracy.
    - Instrukcję końcowej aktualizacji dla ścieżki niewymagającej dalszych działań, napisaną standardowym głosem asystenta bez przekazywania nieprzetworzonych metadanych wewnętrznych.

  </Accordion>
  <Accordion title="Tryby i środowisko uruchomieniowe ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla danego uruchomienia.
    - Użyj `info`/`log`, aby po zakończeniu sprawdzić szczegóły i dane wyjściowe.
    - W przypadku trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z opcjami `thread: true` i `mode: "session"`.
    - Jeśli kanał zleceniodawcy nie obsługuje powiązań z wątkami, użyj `mode: "run"` zamiast ponawiać niemożliwą kombinację powiązaną z wątkiem.
    - W przypadku sesji środowiska ACP (Claude Code, Gemini CLI, OpenCode lub jawnie wskazane Codex ACP/acpx) użyj `sessions_spawn` z opcją `runtime: "acp"`, gdy narzędzie deklaruje obsługę tego środowiska. Podczas debugowania zakończeń lub pętli między agentami zobacz [Model dostarczania ACP](/pl/tools/acp-agents#delivery-model). Gdy Plugin `codex` jest włączony, sterowanie czatem i wątkami Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"`, dopóki ACP nie zostanie włączone, zleceniodawca nie będzie działać w piaskownicy i nie zostanie załadowany Plugin zaplecza, taki jak `acpx`. `runtime: "acp"` oczekuje identyfikatora zewnętrznego środowiska ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; dla zwykłych agentów konfiguracji OpenClaw z `agents_list` używaj domyślnego środowiska uruchomieniowego subagentów.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni subagenci rozpoczynają pracę w izolacji, chyba że wywołujący jawnie
zażąda utworzenia odgałęzienia bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nowe badania, niezależna implementacja, powolne operacje narzędziowe lub wszystko, co można jasno opisać w treści zadania              | Tworzy czysty transkrypt agenta podrzędnego. Jest to tryb domyślny, który ogranicza zużycie tokenów. |
| `fork`     | Praca zależna od bieżącej konwersacji, wcześniejszych wyników narzędzi lub szczegółowych instrukcji obecnych już w transkrypcie zleceniodawcy | Przed uruchomieniem agenta podrzędnego tworzy odgałęzienie transkryptu zleceniodawcy w jego sesji. |

Używaj `fork` oszczędnie. Służy do delegowania zadań zależnych od kontekstu,
a nie jako zamiennik jasno napisanego opisu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia subagenta z opcją `deliver: false` w globalnej ścieżce `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale
czatu zleceniodawcy.

Dostępność zależy od efektywnych zasad narzędzi wywołującego. Wbudowany profil
`coding` zawiera `sessions_spawn`; profile `messaging` i `minimal` go nie
zawierają. Profil `full` zezwala na każde narzędzie. Dodaj
`tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` albo użyj
`tools.profile: "coding"` w przypadku agentów z węższym profilem, które nadal
powinny móc delegować pracę. Zasady zezwoleń i zakazów dotyczące kanału lub grupy,
dostawcy, piaskownicy i poszczególnych agentów mogą nadal usunąć narzędzie po
etapie profilu. Użyj `/tools` w tej samej sesji, aby potwierdzić efektywną listę
narzędzi.

**Wartości domyślne:**

- **Model:** natywni subagenci dziedziczą model wywołującego, chyba że ustawisz `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla poszczególnych agentów). Uruchomienia środowiska ACP używają tego samego skonfigurowanego modelu subagenta, jeśli jest dostępny; w przeciwnym razie środowisko ACP zachowuje własną wartość domyślną. Jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- **Rozumowanie:** natywni subagenci dziedziczą ustawienie wywołującego, chyba że ustawisz `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla poszczególnych agentów). Uruchomienia środowiska ACP stosują również `agents.defaults.models["provider/model"].params.thinking` dla wybranego modelu. Jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- **Limit czasu uruchomienia:** OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, jeśli ustawiono tę wartość; w przeciwnym razie stosuje `0` (brak limitu czasu). `sessions_spawn` nie przyjmuje nadpisań limitu czasu dla pojedynczego wywołania.
- **Dostarczanie zadania:** natywni subagenci otrzymują delegowane zadanie w swojej pierwszej widocznej wiadomości `[Subagent Task]`. Monit systemowy subagenta zawiera zasady środowiska uruchomieniowego i kontekst trasowania, a nie ukryty duplikat zadania.

Zaakceptowane uruchomienia natywnych subagentów zawierają w wyniku narzędzia
rozpoznane metadane modelu agenta podrzędnego: `resolvedModel` zawiera zastosowane
odwołanie do modelu, a `resolvedProvider` zawiera prefiks dostawcy, jeśli
odwołanie go zawiera.

### Tryb monitu delegowania

`agents.defaults.subagents.delegationMode` steruje wyłącznie wskazówkami w monicie; nie zmienia zasad narzędzi ani nie wymusza delegowania.

- `suggest` (domyślnie): zachowuje standardową sugestię w monicie, aby używać subagentów do większych lub wolniejszych zadań.
- `prefer`: nakazuje głównemu agentowi zachowanie responsywności i delegowanie za pomocą `sessions_spawn` wszystkiego, co jest bardziej złożone niż bezpośrednia odpowiedź.

Nadpisanie dla poszczególnych agentów: `agents.list[].subagents.delegationMode`.

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
  Opcjonalny stabilny identyfikator służący do rozpoznawania konkretnego procesu potomnego w późniejszych danych wyjściowych o stanie. Musi być zgodny z wyrażeniem `[a-z][a-z0-9_-]{0,63}` i nie może być zarezerwowanym celem, takim jak `last` lub `all`.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Uruchamia proces pod innym identyfikatorem skonfigurowanego agenta, jeśli zezwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Opcjonalny katalog roboczy zadania dla procesu potomnego. Natywni subagenci nadal wczytują pliki inicjalizacyjne z obszaru roboczego agenta docelowego; `cwd` zmienia tylko miejsce, w którym narzędzia środowiska wykonawczego i mechanizmy CLI realizują delegowaną pracę.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone wyłącznie dla zewnętrznych mechanizmów ACP (`claude`, `droid`, `gemini`, `opencode` lub jawnie zażądanego Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` ma wartość `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję mechanizmu ACP, gdy `runtime: "acp"`; ignorowane przy uruchamianiu natywnych subagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Przesyła strumieniowo dane wyjściowe wykonania ACP do sesji nadrzędnej, gdy `runtime: "acp"`; należy pominąć przy uruchamianiu natywnych subagentów.
</ParamField>
<ParamField path="model" type="string">
  Zastępuje model subagenta. Nieprawidłowe wartości są pomijane, a subagent działa z użyciem modelu domyślnego; wynik narzędzia zawiera ostrzeżenie.
</ParamField>
<ParamField path="thinking" type="string">
  Zastępuje poziom rozumowania dla wykonania subagenta.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania tej sesji subagenta z wątkiem kanału.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true`, a `mode` pominięto, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
  Jeśli powiązanie z wątkiem jest niedostępne dla kanału zgłaszającego żądanie, zamiast tego użyj `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje sesję natychmiast po ogłoszeniu (transkrypcja nadal jest zachowywana przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca uruchomienie, jeśli docelowe środowisko wykonawcze procesu potomnego nie jest izolowane.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżącą transkrypcję zgłaszającego żądanie do sesji potomnej. Dotyczy tylko natywnych subagentów. Uruchomienia powiązane z wątkiem domyślnie używają `fork`; uruchomienia niepowiązane z wątkiem domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** przyjmuje parametrów dostarczania do kanału (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Natywni subagenci przekazują
zgłaszającemu żądanie swoją najnowszą turę asystenta; dostarczanie zewnętrzne pozostaje
po stronie agenta nadrzędnego/agenta zgłaszającego żądanie.
</Warning>

### Nazwy zadań i wskazywanie celów

`taskName` jest identyfikatorem udostępnianym modelowi na potrzeby orkiestracji, a nie kluczem sesji.
Używaj go do nadawania procesom potomnym stabilnych nazw, takich jak `review_subagents`,
`linux_validation` lub `docs_update`, gdy koordynator może później potrzebować sprawdzić
dany proces potomny.

Rozpoznawanie celu akceptuje dokładne dopasowania `taskName` oraz jednoznaczne
prefiksy. Dopasowywanie jest ograniczone do tego samego okna aktywnych/ostatnich celów,
którego używają numerowane cele `/subagents`, dlatego nieaktualny, zakończony proces potomny nie powoduje,
że ponownie użyty identyfikator staje się niejednoznaczny. Jeśli dwa aktywne lub ostatnie procesy potomne mają ten sam
`taskName`, cel jest niejednoznaczny; zamiast tego użyj indeksu listy, klucza sesji lub
identyfikatora wykonania.

Zarezerwowane cele `last` i `all` nie są prawidłowymi wartościami `taskName`,
ponieważ mają już znaczenie sterujące.

## Narzędzie: `sessions_yield`

Kończy bieżącą turę modelu i oczekuje na zdarzenia środowiska wykonawczego, przede wszystkim
zdarzenia ukończenia pracy subagentów, które nadejdą jako następna wiadomość. Użyj go po
uruchomieniu wymaganej pracy potomnej, gdy zgłaszający żądanie nie może przygotować ostatecznej
odpowiedzi przed nadejściem informacji o jej ukończeniu.

`sessions_yield` jest podstawowym mechanizmem oczekiwania. Nie zastępuj go pętlami
odpytywania `subagents`, `sessions_list`, `sessions_history`, poleceniem powłoki
`sleep` ani odpytywaniem procesów wyłącznie w celu wykrycia ukończenia pracy procesu potomnego.

Używaj `sessions_yield` tylko wtedy, gdy efektywna lista narzędzi sesji je zawiera.
Niektóre minimalne lub niestandardowe profile narzędzi mogą udostępniać `sessions_spawn` i
`subagents` bez udostępniania `sessions_yield`; w takim przypadku nie twórz
pętli odpytywania wyłącznie po to, aby czekać na ukończenie.

Gdy istnieją aktywne procesy potomne, OpenClaw wstawia do zwykłych tur zwarty, wygenerowany
przez środowisko wykonawcze blok podpowiedzi `Active Subagents`, aby zgłaszający żądanie mógł zobaczyć
bieżące sesje potomne, identyfikatory wykonań, stany, etykiety, zadania i
aliasy `taskName` bez odpytywania. Pola zadania i etykiety w tym
bloku są ujmowane w cudzysłów jako dane, a nie instrukcje, ponieważ mogą pochodzić
z argumentów uruchomienia dostarczonych przez użytkownika lub model.

## Narzędzie: `subagents`

Wyświetla wykonania uruchomionych subagentów należące do sesji zgłaszającej żądanie. Zakres jest
ograniczony do bieżącego zgłaszającego żądanie; proces potomny widzi tylko własne kontrolowane procesy potomne.

Używaj `subagents` do sprawdzania stanu na żądanie i debugowania. Używaj `sessions_yield`, aby
oczekiwać na zdarzenia ukończenia.

## Sesje powiązane z wątkiem

Gdy powiązania z wątkami są włączone dla kanału, subagent może pozostać powiązany
z wątkiem, dzięki czemu kolejne wiadomości użytkownika w tym wątku są nadal kierowane do
tej samej sesji subagenta.

### Kanały obsługujące wątki

Kanał obsługuje trwałe sesje subagentów powiązane z wątkiem
(`sessions_spawn` z `thread: true`), gdy rejestruje adapter powiązania
konwersacji. Wbudowane kanały z taką obsługą to: **Discord**,
**iMessage**, **Matrix** i **Telegram**. Discord i Matrix domyślnie
tworzą wątek potomny; Telegram i iMessage domyślnie wiążą
bieżącą konwersację. Użyj właściwych dla kanału kluczy konfiguracji `threadBindings`
do włączania, ustawiania limitów czasu i `spawnSessions`.

### Szybki przebieg

<Steps>
  <Step title="Uruchomienie">
    `sessions_spawn` z `thread: true` (oraz opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Powiązanie">
    OpenClaw tworzy wątek lub wiąże go z celem tej sesji w aktywnym kanale.
  </Step>
  <Step title="Kierowanie kolejnych wiadomości">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdzanie limitów czasu">
    Użyj `/session idle`, aby sprawdzić lub zaktualizować automatyczne anulowanie aktywnego wskazania po okresie bezczynności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłączenie">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Sterowanie ręczne

| Polecenie          | Efekt                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Wiąże bieżący wątek (lub tworzy nowy) z celem subagenta/sesji                            |
| `/unfocus`         | Usuwa powiązanie bieżącego powiązanego wątku                                              |
| `/agents`          | Wyświetla aktywne wykonania i stan powiązania (`binding:<id>`, `unbound` lub `bindings unavailable`) |
| `/session idle`    | Sprawdza/aktualizuje automatyczne anulowanie aktywnego wskazania po bezczynności (tylko wskazane powiązane wątki) |
| `/session max-age` | Sprawdza/aktualizuje twardy limit (tylko wskazane powiązane wątki)                        |

### Przełączniki konfiguracji

- **Globalne ustawienie domyślne:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisania kanału i klucze automatycznego wiązania przy uruchamianiu** są zależne od adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Bieżące szczegóły adapterów znajdziesz w sekcjach [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia z ukośnikiem](/pl/tools/slash-commands).

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów skonfigurowanych agentów, które można wskazać przez jawne `agentId` (`["*"]` zezwala na dowolny skonfigurowany cel). Domyślnie: tylko agent zgłaszający żądanie. Jeśli ustawisz listę i nadal chcesz, aby zgłaszający żądanie uruchamiał siebie przez `agentId`, uwzględnij na liście identyfikator zgłaszającego żądanie.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych skonfigurowanych agentów docelowych, używana, gdy agent zgłaszający żądanie nie ustawi własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Limit czasu dla każdej próby dostarczenia ogłoszenia `agent` przez Gateway. Wartości są dodatnimi całkowitymi liczbami milisekund i są ograniczane do bezpiecznego dla platformy maksymalnego czasu licznika. Przejściowe ponowienia mogą sprawić, że całkowite oczekiwanie na ogłoszenie potrwa dłużej niż jeden skonfigurowany limit czasu.
</ParamField>

Jeśli sesja zgłaszająca żądanie jest izolowana, `sessions_spawn` odrzuca cele,
które działałyby bez izolacji.

### Wykrywanie

Użyj `agents_list`, aby sprawdzić, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska wykonawczego, dzięki czemu wywołujący mogą rozróżnić OpenClaw, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska wykonawcze.

Wpisy `allowAgents` muszą wskazywać identyfikatory skonfigurowanych agentów w `agents.list[]`.
`["*"]` oznacza dowolnego skonfigurowanego agenta docelowego oraz zgłaszającego żądanie. Jeśli konfiguracja agenta
zostanie usunięta, ale jego identyfikator pozostanie w `allowAgents`, `sessions_spawn` odrzuci ten identyfikator,
a `agents_list` go pominie. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne
wpisy listy dozwolonych, albo dodaj minimalny wpis `agents.list[]`, gdy cel powinien
pozostać dostępny do uruchamiania i dziedziczyć ustawienia domyślne.

### Automatyczna archiwizacja

- Sesje subagentów są automatycznie archiwizowane po czasie określonym przez `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkrypcji na `*.deleted.<timestamp>` (w tym samym folderze).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (transkrypcja nadal jest zachowywana przez zmianę nazwy).
- Automatyczna archiwizacja działa na zasadzie najlepszych starań; oczekujące liczniki są tracone po ponownym uruchomieniu Gateway.
- Skonfigurowane limity czasu wykonania **nie** powodują automatycznej archiwizacji; jedynie zatrzymują wykonanie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy w równym stopniu sesji na głębokości 1 i 2.
- Czyszczenie przeglądarki jest niezależne od czyszczenia archiwum: śledzone karty i procesy przeglądarki są zamykane na zasadzie najlepszych starań po zakończeniu wykonania, nawet jeśli transkrypcja lub rekord sesji zostają zachowane.

## Zagnieżdżeni subagenci

Domyślnie subagenci nie mogą uruchamiać własnych subagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny agent → subagent orkiestrator →
sub-subagenci wykonawczy.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // zezwól subagentom na uruchamianie procesów potomnych (domyślnie: 1, zakres 1-5)
        maxChildrenPerAgent: 5, // maksymalna liczba aktywnych procesów potomnych na sesję agenta (domyślnie: 5, zakres 1-20)
        maxConcurrent: 8, // globalny limit równoczesności (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny limit czasu dla sessions_spawn (0 = brak limitu czasu)
        announceTimeoutMs: 120000, // limit czasu ogłoszenia Gateway dla każdego wywołania
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Format klucza sesji                          | Rola                                               | Czy może uruchamiać?             |
| --------- | -------------------------------------------- | -------------------------------------------------- | -------------------------------- |
| 0         | `agent:<id>:main`                            | Agent główny                                       | Zawsze                           |
| 1         | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Podpodagent (wykonawca końcowy)                    | Nigdy                            |

### Łańcuch ogłoszeń

Wyniki przepływają w górę łańcucha:

1. Wykonawca na głębokości 2 kończy pracę → ogłasza wynik swojemu rodzicowi (orkiestratorowi na głębokości 1).
2. Orkiestrator na głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki i kończy pracę → ogłasza wynik agentowi głównemu.
3. Agent główny odbiera ogłoszenie i przekazuje wynik użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówka operacyjna:** uruchamiaj pracę dziecka raz i czekaj na zdarzenia
zakończenia, zamiast tworzyć pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń uśpienia `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji podrzędnych
skupione na aktywnej pracy — aktywne dzieci pozostają dołączone, zakończone
dzieci pozostają widoczne przez krótki okres ostatniej aktywności, a nieaktualne
łącza dzieci istniejące wyłącznie w magazynie są ignorowane po upływie okresu
świeżości. Zapobiega to ponownemu pojawianiu się widmowych dzieci na podstawie
starych metadanych `spawnedBy` / `parentSessionKey` po ponownym uruchomieniu.
Jeśli zdarzenie zakończenia dziecka nadejdzie po wysłaniu ostatecznej odpowiedzi,
właściwą reakcją jest dokładnie cichy token `NO_REPLY` / `no_reply`.
</Note>

### Zasady narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji podczas uruchamiania. Dzięki temu spłaszczone lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby móc uruchamiać dzieci i sprawdzać ich stan. Pozostałe narzędzia sesji/systemowe pozostają niedostępne.
- **Głębokość 1 (wykonawca końcowy, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (obecne zachowanie domyślne).
- **Głębokość 2 (wykonawca końcowy):** brak narzędzi sesji — `sessions_spawn` jest zawsze niedostępne na głębokości 2. Nie może uruchamiać kolejnych dzieci.

### Limit uruchamiania dla agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej
`maxChildrenPerAgent` (domyślnie `5`) aktywnych dzieci. Zapobiega to
niekontrolowanemu rozgałęzianiu pracy przez jednego orkiestratora.

### Kaskadowe zatrzymywanie

Zatrzymanie orkiestratora na głębokości 1 automatycznie zatrzymuje wszystkie
jego dzieci na głębokości 2:

- `/stop` na głównym czacie zatrzymuje wszystkie agenty na głębokości 1 i kaskadowo ich dzieci na głębokości 2.

## Uwierzytelnianie

Uwierzytelnianie podagenta jest rozstrzygane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji podagenta ma postać `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania agenta głównego są scalane jako **mechanizm rezerwowy**; w razie konfliktów profile agenta zastępują profile główne.

Scalanie ma charakter addytywny, więc profile główne są zawsze dostępne
jako rezerwowe. W pełni odizolowane uwierzytelnianie dla każdego agenta
nie jest jeszcze obsługiwane.

## Ogłaszanie

Podagenty raportują wyniki przez etap ogłoszenia:

- Etap ogłoszenia działa wewnątrz sesji podagenta (nie w sesji zlecającej).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnie cichym tokenem `NO_REPLY` / `no_reply`, wynik ogłoszenia zostanie pominięty, nawet jeśli wcześniej pojawiły się widoczne informacje o postępie.

Sposób dostarczenia zależy od głębokości zlecającego:

- Sesje zlecające najwyższego poziomu używają kolejnego wywołania `agent` z dostarczaniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje podagentów zlecających otrzymują wewnętrzne wstrzyknięcie kolejnego komunikatu (`deliver=false`), aby orkiestrator mógł zsyntetyzować wyniki dzieci w ramach sesji.
- Jeśli zagnieżdżona sesja podagenta zlecającego już nie istnieje, OpenClaw w miarę możliwości powraca do zlecającego tej sesji.

W przypadku sesji zlecających najwyższego poziomu bezpośrednie dostarczanie
w trybie zakończenia najpierw rozstrzyga wszelkie powiązane trasy
konwersacji/wątku i nadpisania przez hook, a następnie uzupełnia brakujące
pola kanału i celu na podstawie zapisanej trasy sesji zlecającej.
Dzięki temu zakończenia trafiają do właściwego czatu/tematu, nawet gdy
źródło zakończenia identyfikuje tylko kanał.

Podczas tworzenia zagnieżdżonych wyników zakończenia agregacja zakończeń
dzieci jest ograniczona do bieżącego uruchomienia zlecającego, co zapobiega
przedostawaniu się wyników dzieci z wcześniejszych uruchomień do bieżącego
ogłoszenia. Odpowiedzi ogłoszeń zachowują trasowanie wątku/tematu, gdy jest
ono dostępne w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Źródło         | `subagent` lub `cron`                                                                                              |
| Identyfikatory sesji | Klucz/identyfikator sesji dziecka                                                                            |
| Typ            | Typ ogłoszenia + etykieta zadania                                                                                  |
| Stan           | Wyprowadzony z wyniku środowiska wykonawczego (`ok`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta od dziecka                                                                      |
| Dalsze działanie | Instrukcja określająca, kiedy odpowiedzieć, a kiedy zachować ciszę                                               |

Zakończone niepowodzeniem uruchomienia zgłaszają stan niepowodzenia bez
ponownego odtwarzania przechwyconego tekstu odpowiedzi. Dane wyjściowe
`tool`/`toolResult` nie są przenoszone do tekstu wyniku dziecka.

### Wiersz statystyk

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet po opakowaniu):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejściowych/wyjściowych/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżkę transkrypcji, aby agent główny mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone wyłącznie do orkiestracji; odpowiedzi
dla użytkownika należy przepisywać normalnym głosem asystenta.

### Dlaczego warto preferować `sessions_history`

`sessions_history` jest bezpieczniejszym sposobem orkiestracji odczytu
transkrypcji dziecka w ramach tury agenta:

- Redaguje tekst przypominający dane uwierzytelniające lub tokeny, nawet gdy ogólne redagowanie dzienników jest wyłączone.
- Skraca długie bloki tekstu (4000 znaków na blok) oraz usuwa sygnatury myślenia, ładunki ponownego odtwarzania rozumowania i dane obrazów osadzonych.
- Wymusza limit odpowiedzi 80 KB; zbyt duże wiersze są zastępowane przez `[sessions_history omitted: message too large]`.
- Gdy występuje `nextOffset`, użyj go do stronicowania wstecz przez starsze okna transkrypcji.
- `sessions_history` **nie** usuwa znaczników rozumowania, struktury pomocniczej `<relevant-memories>` ani XML wywołań narzędzi z tekstu wiadomości — zwraca ustrukturyzowane bloki treści zbliżone do surowej postaci transkrypcji, jedynie z redakcją i ograniczeniem rozmiaru. `/subagents log` stosuje bardziej rozbudowane oczyszczanie prozy (usuwa znaczniki rozumowania, strukturę pomocniczą pamięci i XML wywołań narzędzi), ponieważ renderuje zwykłe wiersze czatu zamiast ustrukturyzowanych bloków.
- Bezpośrednie sprawdzenie transkrypcji na dysku jest rozwiązaniem rezerwowym, gdy potrzebujesz pełnej transkrypcji zgodnej bajt w bajt.

## Zasady narzędzi

Podagenty najpierw używają tego samego profilu i potoku zasad narzędzi co
agent nadrzędny lub docelowy. Następnie OpenClaw nakłada warstwę ograniczeń
podagentów.

Podagenty zawsze tracą dostęp do `gateway`, `agents_list`, `session_status`
i `cron`, niezależnie od głębokości lub roli (są to narzędzia
systemowe/interaktywne albo narzędzia, które powinien koordynować agent
główny). Podagenty końcowe (domyślne zachowanie na głębokości 1 i zawsze
na głębokości 2) dodatkowo tracą dostęp do `subagents`, `sessions_list`,
`sessions_history` i `sessions_spawn`. Podagenty nigdy nie otrzymują
narzędzia `message` — jest ono wyłączane podczas uruchamiania, a nie
filtrowane przez tę listę zakazów — natomiast `sessions_send` pozostaje
niedostępne, aby podagenty komunikowały się wyłącznie przez łańcuch
ogłoszeń.

`sessions_history` również tutaj pozostaje ograniczonym i oczyszczonym
widokiem przywoływania — nie jest zrzutem surowej transkrypcji.

Gdy `maxSpawnDepth >= 2`, podagenty-orkiestratory na głębokości 1
dodatkowo otrzymują `sessions_spawn`, `subagents`, `sessions_list`
i `sessions_history`, aby mogły zarządzać swoimi dziećmi.

### Nadpisywanie przez konfigurację

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

`tools.subagents.tools.allow` jest końcowym filtrem opartym wyłącznie na
liście dozwolonych narzędzi. Może zawęzić już rozstrzygnięty zestaw
narzędzi, ale nie może **przywrócić** narzędzia usuniętego przez
`tools.profile`. Na przykład `tools.profile: "coding"` obejmuje
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby umożliwić
podagentom z profilem programistycznym korzystanie z automatyzacji
przeglądarki, dodaj przeglądarkę na etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj ustawienia `agents.list[].tools.alsoAllow: ["browser"]` dla
konkretnego agenta, gdy tylko jeden agent powinien otrzymać automatyzację
przeglądarki.

## Współbieżność

Podagenty używają dedykowanego toru kolejki wewnątrz procesu:

- **Nazwa toru:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Aktywność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że podagent
nadal działa. Niezakończone uruchomienia starsze niż okno nieaktualnego
uruchomienia (2 godziny lub skonfigurowany limit czasu uruchomienia
powiększony o krótki okres tolerancji, zależnie od tego, który okres jest
dłuższy) przestają być liczone jako aktywne/oczekujące w `/subagents list`,
podsumowaniach stanu, blokowaniu zakończenia potomków i kontrolach
współbieżności dla sesji.

Po ponownym uruchomieniu Gateway nieaktualne, niezakończone i przywrócone
uruchomienia są usuwane, chyba że ich sesja podrzędna ma ustawienie
`abortedLastRun: true`. Uruchomienia przerwane przez ponowne uruchomienie
pozostają zarejestrowane dla przepływu odzyskiwania osieroconych podagentów:
nieaktualne uruchomienia są finalizowane bez wznowienia, natomiast świeże
sesje podrzędne otrzymują syntetyczny komunikat wznowienia przed
wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po ponownym uruchomieniu jest ograniczone dla
każdej sesji podrzędnej. Jeśli to samo dziecko podagenta zostanie wielokrotnie
przyjęte do odzyskiwania osieroconych zadań w krótkim oknie ponownego
zablokowania, OpenClaw utrwali dla tej sesji znacznik blokujący odzyskiwanie
i przestanie automatycznie wznawiać ją podczas kolejnych ponownych uruchomień.
Uruchom `openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania,
lub `openclaw doctor --fix`, aby wyczyścić nieaktualne znaczniki przerwanego
odzyskiwania w sesjach z takim znacznikiem blokującym.

<Note>
Jeśli uruchomienie podagenta nie powiedzie się z błędem Gateway
`PAIRING_REQUIRED` / `scope-upgrade`, przed edycją stanu parowania sprawdź
wywołującego RPC. Wewnętrzna koordynacja `sessions_spawn` jest
przekazywana wewnątrz procesu, gdy wywołujący działa już w kontekście
żądania Gateway, więc nie otwiera połączenia WebSocket przez local loopback
ani nie zależy od bazowego zakresu sparowanego urządzenia CLI. Wywołujący
spoza procesu Gateway nadal używają rezerwowego połączenia WebSocket jako
`client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie
uwierzytelnianie współdzielonym tokenem/hasłem przez local loopback.
Zdalni wywołujący, jawne `deviceIdentity`, jawne ścieżki tokenów urządzenia
oraz klienci przeglądarki/Node nadal wymagają zwykłego zatwierdzenia
urządzenia do rozszerzenia zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` na czacie zlecającego przerywa sesję zlecającego i zatrzymuje wszystkie aktywne uruchomienia podagentów rozpoczęte przez tę sesję, kaskadowo obejmując zagnieżdżone dzieci.

## Ograniczenia

- Ogłaszanie przez podagenta odbywa się na zasadzie **best-effort**. Jeśli Gateway zostanie ponownie uruchomiony, oczekujące zadania „announce back” zostaną utracone.
- Podagenty nadal współdzielą zasoby tego samego procesu Gateway; traktuj `maxConcurrent` jako mechanizm zabezpieczający.
- `sessions_spawn` zawsze działa nieblokująco: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Do kontekstu podagenta wstrzykiwane są tylko pliki `AGENTS.md` i `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`). Natywne podagenty Codex podlegają temu samemu ograniczeniu: `TOOLS.md` pozostaje w odziedziczonych instrukcjach wątku Codex, natomiast pliki persony, tożsamości i użytkownika przeznaczone wyłącznie dla rodzica są wstrzykiwane jako instrukcje współpracy o zakresie bieżącej tury, aby procesy potomne ich nie klonowały.
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). W większości zastosowań zalecana jest głębokość 2.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych procesów potomnych na sesję (wartość domyślna: `5`, zakres: `1–20`).

## Powiązane

- [Narzędzia sesji i zmiany stanu](/pl/concepts/session-tool)
- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie przez agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy dla wielu agentów](/pl/tools/multi-agent-sandbox-tools)
