---
read_when:
    - Potrzebna jest praca w tle lub równoległa za pośrednictwem agenta
    - Zmieniasz zasady narzędzia `sessions_spawn` lub subagenta
    - Implementowanie lub rozwiązywanie problemów z sesjami subagentów powiązanymi z wątkami
sidebarTitle: Sub-agents
summary: Uruchamiaj odizolowane procesy agentów w tle, które przekazują wyniki z powrotem do czatu osoby zgłaszającej żądanie
title: Podagenci
x-i18n:
    generated_at: "2026-07-16T19:11:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

Subagenci to uruchomienia agentów w tle, tworzone z poziomu istniejącego uruchomienia agenta.
Każdy z nich działa we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu **ogłasza** swój wynik na kanale czatu zleceniodawcy.
Każde uruchomienie subagenta jest śledzone jako [zadanie w tle](/pl/automation/tasks).

Cele:

- Równoległe wykonywanie badań, długich zadań i powolnych operacji narzędziowych bez blokowania głównego uruchomienia.
- Domyślne izolowanie subagentów (oddzielne sesje, opcjonalne piaskownice).
- Utrzymanie zestawu narzędzi odpornego na niewłaściwe użycie: subagenci domyślnie **nie** otrzymują narzędzi sesji ani wiadomości.
- Obsługa konfigurowalnej głębokości zagnieżdżenia dla wzorców orkiestratora.

<Note>
**Uwaga dotycząca kosztów:** każdy subagent ma domyślnie własny kontekst
i własne zużycie tokenów. W przypadku wymagających lub powtarzalnych zadań należy ustawić tańszy model dla subagentów,
a dla głównego agenta zachować model wyższej jakości za pomocą
`agents.defaults.subagents.model` lub nadpisań dla poszczególnych agentów. Gdy agent podrzędny
rzeczywiście potrzebuje bieżącego zapisu rozmowy zleceniodawcy, należy utworzyć go z
`context: "fork"`. Sesje subagentów powiązane z wątkiem domyślnie używają
`context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do
wątku kontynuacji.
</Note>

## Polecenie ukośnikowe

`/subagents` sprawdza uruchomienia subagentów dla **bieżącej sesji**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` wyświetla metadane uruchomienia (stan, znaczniki czasu, identyfikator sesji,
ścieżkę zapisu rozmowy, czyszczenie). `/subagents log` wyświetla ostatnie tury czatu dla
uruchomienia; należy dodać token `tools`, aby uwzględnić komunikaty wywołań narzędzi i ich wyników (domyślnie
pomijane). W ramach tury agenta należy użyć `sessions_history`, aby uzyskać ograniczony, filtrowany pod kątem bezpieczeństwa
widok przywołanych informacji, albo sprawdzić ścieżkę zapisu rozmowy na dysku, aby uzyskać
pełny nieprzetworzony zapis.

W interfejsie Control UI sesje nadrzędne z ostatnimi uruchomieniami podrzędnymi mają rozwijany
wiersz na pasku bocznym. Zagnieżdżone wiersze pokazują stan i czas działania agentów podrzędnych, a wybranie jednego z nich
otwiera jego czat z zachowaniem hierarchii nadrzędnej.

### Sterowanie powiązaniem z wątkiem

Te polecenia działają na kanałach z trwałymi powiązaniami z wątkami. Zobacz
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
Zakończenia są zwracane jako wewnętrzne zdarzenia sesji nadrzędnej; agent nadrzędny/zleceniodawca
decyduje, czy potrzebna jest aktualizacja widoczna dla użytkownika.

<AccordionGroup>
  <Accordion title="Nieblokujące zakończenie oparte na wypychaniu">
    - `sessions_spawn` jest nieblokujące; natychmiast zwraca identyfikator uruchomienia.
    - Po zakończeniu subagent przesyła raport do sesji nadrzędnej/zleceniodawcy.
    - Tury agenta, które potrzebują wyników agenta podrzędnego, powinny wywołać `sessions_yield` po utworzeniu wymaganej pracy. Kończy to bieżącą turę i pozwala, aby zdarzenie zakończenia dotarło jako następna wiadomość widoczna dla modelu.
    - Zakończenie jest oparte na wypychaniu. Po utworzeniu **nie** należy odpytywać w pętli `/subagents list`, `sessions_list` ani `sessions_history` wyłącznie w celu oczekiwania na zakończenie; stan należy sprawdzać na żądanie tylko podczas debugowania.
    - Wynik agenta podrzędnego jest raportem/materiałem dowodowym do syntezy przez agenta zleceniodawcę. Nie jest tekstem instrukcji pochodzącym od użytkownika i nie może zastępować zasad systemowych, deweloperskich ani użytkownika.
    - Po zakończeniu OpenClaw w miarę możliwości zamyka śledzone karty przeglądarki i procesy otwarte przez sesję tego subagenta, zanim proces czyszczenia po ogłoszeniu będzie kontynuowany.

  </Accordion>
  <Accordion title="Dostarczanie zakończenia">
    - OpenClaw przekazuje zakończenia z powrotem do sesji zleceniodawcy za pośrednictwem tury `agent` ze stabilnym kluczem idempotencji.
    - Jeśli uruchomienie zleceniodawcy jest nadal aktywne, OpenClaw najpierw próbuje je wznowić/przekierować zamiast uruchamiać drugą widoczną ścieżkę odpowiedzi.
    - Jeśli aktywnego zleceniodawcy nie można wznowić, OpenClaw przechodzi do przekazania agentowi zleceniodawcy z tym samym kontekstem zakończenia zamiast porzucać ogłoszenie.
    - Pomyślne przekazanie do agenta nadrzędnego kończy dostarczanie wyniku subagenta, nawet jeśli agent nadrzędny uzna, że widoczna aktualizacja dla użytkownika nie jest potrzebna.
    - Natywni subagenci nie otrzymują narzędzia wiadomości. Zwracają zwykły tekst asystenta agentowi nadrzędnemu/zleceniodawcy; odpowiedzi widoczne dla ludzi pozostają objęte standardowymi zasadami dostarczania agenta nadrzędnego/zleceniodawcy.
    - Jeśli nie można użyć bezpośredniego przekazania, dostarczanie przechodzi na trasowanie przez kolejkę, a następnie na krótką ponowną próbę ogłoszenia z wykładniczym zwiększaniem opóźnienia przed ostateczną rezygnacją.
    - Dostarczanie zachowuje ustaloną trasę zleceniodawcy: trasy zakończenia powiązane z wątkiem lub rozmową mają pierwszeństwo, gdy są dostępne. Jeśli źródło zakończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto na podstawie ustalonej trasy sesji zleceniodawcy (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało.

  </Accordion>
  <Accordion title="Metadane przekazania zakończenia">
    Przekazanie zakończenia do sesji zleceniodawcy jest generowanym w czasie działania
    kontekstem wewnętrznym (nie tekstem pochodzącym od użytkownika) i obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant` od agenta podrzędnego. Dane wyjściowe tool/toolResult nie są przenoszone do wyników agenta podrzędnego. Zakończone niepowodzeniem uruchomienia terminalowe nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Zwięzłe statystyki czasu działania/tokenów.
    - Instrukcję weryfikacji informującą agenta zleceniodawcę, aby sprawdził wynik przed podjęciem decyzji, czy pierwotne zadanie zostało ukończone.
    - Wskazówki dotyczące dalszych działań informujące agenta zleceniodawcę, aby kontynuował zadanie lub zarejestrował dalsze działanie, gdy wynik agenta podrzędnego wymaga kolejnych czynności.
    - Instrukcję końcowej aktualizacji dla ścieżki niewymagającej dalszych działań, napisaną zwykłym głosem asystenta bez przekazywania nieprzetworzonych metadanych wewnętrznych.

  </Accordion>
  <Accordion title="Tryby i środowisko uruchomieniowe ACP">
    - `--model` i `--thinking` zastępują wartości domyślne dla tego konkretnego uruchomienia.
    - Należy użyć `info`/`log`, aby po zakończeniu sprawdzić szczegóły i dane wyjściowe.
    - W przypadku trwałych sesji powiązanych z wątkiem należy użyć `sessions_spawn` z `thread: true` i `mode: "session"`.
    - Jeśli kanał zleceniodawcy nie obsługuje powiązań z wątkami, należy użyć `mode: "run"` zamiast ponawiać niemożliwą kombinację powiązaną z wątkiem.
    - W przypadku sesji środowiska ACP (Claude Code, Gemini CLI, OpenCode lub jawnie wskazanego Codex ACP/acpx) należy użyć `sessions_spawn` z `runtime: "acp"`, gdy narzędzie udostępnia to środowisko uruchomieniowe. Podczas debugowania zakończeń lub pętli między agentami zobacz [Model dostarczania ACP](/pl/tools/acp-agents#delivery-model). Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik wyraźnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"`, dopóki ACP nie zostanie włączone, zleceniodawca nie będzie poza piaskownicą i nie zostanie załadowany Plugin zaplecza, taki jak `acpx`. `runtime: "acp"` oczekuje zewnętrznego identyfikatora środowiska ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; dla zwykłych agentów konfiguracyjnych OpenClaw z `agents_list` należy używać domyślnego środowiska subagentów.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni subagenci rozpoczynają pracę w izolacji, chyba że wywołujący wyraźnie zażąda rozwidlenia
bieżącego zapisu rozmowy.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nowe badania, niezależna implementacja, powolna praca narzędziowa lub wszystko, co można opisać w tekście zadania                           | Tworzy czysty zapis rozmowy agenta podrzędnego. Jest to ustawienie domyślne i ogranicza zużycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub szczegółowych instrukcji już obecnych w zapisie rozmowy zleceniodawcy | Przed uruchomieniem agenta podrzędnego rozgałęzia zapis rozmowy zleceniodawcy do jego sesji. |

Należy oszczędnie używać `fork`. Służy do delegowania zależnego od kontekstu, a nie jako
zamiennik jasno napisanego polecenia zadania.

## Narzędzie: `sessions_spawn`

Uruchamia subagenta z `deliver: false` w globalnym kanale `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź z ogłoszeniem na kanale
czatu zleceniodawcy.

Dostępność zależy od efektywnych zasad narzędzi wywołującego. Wbudowany
profil `coding` obejmuje `sessions_spawn`; `messaging` i `minimal` go
nie obejmują. `full` zezwala na każde narzędzie. Należy dodać `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` albo użyć `tools.profile: "coding"` w przypadku
agentów o bardziej ograniczonym profilu, które nadal powinny delegować pracę.
Zasady zezwalania/odmawiania dla kanału/grupy, dostawcy, piaskownicy i poszczególnych agentów mogą
nadal usunąć narzędzie po etapie profilu. Aby potwierdzić efektywną listę narzędzi, należy użyć `/tools` z tej samej
sesji.

**Wartości domyślne:**

- **Model:** natywni subagenci dziedziczą ustawienie wywołującego, chyba że ustawiono `agents.defaults.subagents.model` (lub `agents.list[].subagents.model` dla konkretnego agenta). Uruchomienia środowiska ACP używają tego samego skonfigurowanego modelu subagenta, jeśli jest dostępny; w przeciwnym razie środowisko ACP zachowuje własne ustawienie domyślne. Jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- **Rozumowanie:** natywni subagenci dziedziczą ustawienie wywołującego, chyba że ustawiono `agents.defaults.subagents.thinking` (lub `agents.list[].subagents.thinking` dla konkretnego agenta). Uruchomienia środowiska ACP również stosują `agents.defaults.models["provider/model"].params.thinking` dla wybranego modelu. Jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- **Limit czasu uruchomienia:** OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie używa `0` (bez limitu czasu). `sessions_spawn` nie przyjmuje nadpisań limitu czasu dla poszczególnych wywołań.
- **Dostarczanie zadania:** natywni subagenci otrzymują delegowane zadanie w swojej pierwszej widocznej wiadomości `[Subagent Task]`. Monit systemowy subagenta zawiera reguły środowiska uruchomieniowego i kontekst trasowania, a nie ukryty duplikat zadania.

Zaakceptowane uruchomienia natywnych subagentów obejmują metadane rozpoznanego modelu agenta podrzędnego
w wyniku narzędzia: `resolvedModel` zawiera zastosowane odwołanie do modelu, a
`resolvedProvider` zawiera prefiks dostawcy, jeśli odwołanie go zawiera.

### Tryb monitu delegowania

`agents.defaults.subagents.delegationMode` steruje wyłącznie wskazówkami monitu; nie zmienia zasad narzędzi ani nie wymusza delegowania.

- `suggest` (domyślnie): zachowuje standardową sugestię monitu, aby używać subagentów do większych lub wolniejszych zadań.
- `prefer`: informuje głównego agenta, aby zachował responsywność i delegował za pośrednictwem `sessions_spawn` wszystko, co jest bardziej złożone niż bezpośrednia odpowiedź.

Nadpisanie dla konkretnego agenta: `agents.list[].subagents.delegationMode`.

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
  Opcjonalny stabilny identyfikator umożliwiający rozpoznanie konkretnego procesu podrzędnego w późniejszych danych wyjściowych stanu. Musi pasować do `[a-z][a-z0-9_-]{0,63}` i nie może być zarezerwowanym celem, takim jak `last` lub `all`.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Uruchamia w ramach innego skonfigurowanego identyfikatora agenta, jeśli zezwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Opcjonalny katalog roboczy zadania dla procesu podrzędnego. Natywni subagenci nadal wczytują pliki inicjalizacyjne z przestrzeni roboczej agenta docelowego; `cwd` zmienia tylko miejsce, w którym narzędzia środowiska wykonawczego i mechanizmy CLI wykonują oddelegowaną pracę.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone wyłącznie dla zewnętrznych mechanizmów ACP (`claude`, `droid`, `gemini`, `opencode` lub jawnie zażądanego Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` ma wartość `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję mechanizmu ACP, gdy `runtime: "acp"`; ignorowane w przypadku uruchomień natywnych subagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Przesyła strumieniowo dane wyjściowe uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; należy pominąć w przypadku uruchomień natywnych subagentów.
</ParamField>
<ParamField path="model" type="string">
  Zastępuje model subagenta. Nieprawidłowe wartości są pomijane, a subagent działa na modelu domyślnym, z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Zastępuje poziom rozumowania dla uruchomienia subagenta.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania tej sesji subagenta z wątkiem kanału.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i pominięto `mode`, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
  Jeśli powiązanie z wątkiem jest niedostępne dla kanału żądającego, należy zamiast tego użyć `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje sesję natychmiast po ogłoszeniu (transkrypcja nadal jest zachowywana przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca uruchomienie, jeśli docelowe środowisko wykonawcze procesu podrzędnego nie działa w piaskownicy.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżącą transkrypcję żądającego do sesji podrzędnej. Dotyczy tylko natywnych subagentów. Uruchomienia powiązane z wątkiem domyślnie używają `fork`; uruchomienia niepowiązane z wątkiem domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** przyjmuje parametrów dostarczania do kanału (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Natywni subagenci przekazują
swoją najnowszą turę asystenta z powrotem do żądającego; za dostarczanie zewnętrzne nadal odpowiada
agent nadrzędny/żądający.
</Warning>

### Nazwy zadań i wskazywanie celów

`taskName` jest identyfikatorem przeznaczonym dla modelu na potrzeby orkiestracji, a nie kluczem sesji.
Należy go używać do stabilnych nazw procesów podrzędnych, takich jak `review_subagents`,
`linux_validation` lub `docs_update`, gdy koordynator może później potrzebować sprawdzić
ten proces podrzędny.

Rozpoznawanie celu akceptuje dokładne dopasowania `taskName` oraz jednoznaczne
prefiksy. Dopasowywanie jest ograniczone do tego samego okna aktywnych/ostatnich celów, którego
używają numerowane cele `/subagents`, dlatego nieaktualny zakończony proces podrzędny nie powoduje,
że ponownie użyty identyfikator staje się niejednoznaczny. Jeśli dwa aktywne lub ostatnie procesy podrzędne współdzielą ten sam
`taskName`, cel jest niejednoznaczny; należy zamiast tego użyć indeksu listy, klucza sesji lub
identyfikatora uruchomienia.

Zarezerwowane cele `last` i `all` nie są prawidłowymi wartościami `taskName`,
ponieważ mają już znaczenie sterujące.

## Narzędzie: `sessions_yield`

Kończy bieżącą turę modelu i oczekuje, aż zdarzenia środowiska wykonawczego, przede wszystkim
zdarzenia ukończenia pracy subagentów, nadejdą jako następna wiadomość. Należy go użyć po
uruchomieniu wymaganej pracy podrzędnej, gdy żądający nie może przygotować ostatecznej
odpowiedzi, dopóki ta praca nie zostanie ukończona.

`sessions_yield` jest podstawowym mechanizmem oczekiwania. Nie należy zastępować go pętlami
odpytywania wykorzystującymi `subagents`, `sessions_list`, `sessions_history`, powłokę
`sleep` ani odpytywanie procesów wyłącznie w celu wykrycia ukończenia pracy procesu podrzędnego.

Należy używać `sessions_yield` tylko wtedy, gdy efektywna lista narzędzi sesji je zawiera.
Niektóre minimalne lub niestandardowe profile narzędzi mogą udostępniać `sessions_spawn` i
`subagents` bez udostępniania `sessions_yield`; w takim przypadku nie należy tworzyć
pętli odpytywania tylko po to, aby czekać na ukończenie.

Gdy istnieją aktywne procesy podrzędne, OpenClaw wstrzykuje do zwykłych tur zwarty, generowany przez środowisko wykonawcze
blok komunikatu `Active Subagents`, aby żądający mógł zobaczyć
bieżące sesje podrzędne, identyfikatory uruchomień, stany, etykiety, zadania i
aliasy `taskName` bez odpytywania. Pola zadania i etykiety w tym
bloku są cytowane jako dane, a nie instrukcje, ponieważ mogą pochodzić
z argumentów uruchomienia dostarczonych przez użytkownika lub model.

## Narzędzie: `subagents`

Wyświetla uruchomienia subagentów należące do sesji żądającego. Zakres jest ograniczony
do bieżącego żądającego; proces podrzędny może zobaczyć tylko własne kontrolowane procesy podrzędne.

Należy używać `subagents` do sprawdzania stanu na żądanie i debugowania. Do
oczekiwania na zdarzenia ukończenia należy używać `sessions_yield`.

## Sesje powiązane z wątkami

Gdy dla kanału włączone są powiązania z wątkami, subagent może pozostać powiązany
z wątkiem, dzięki czemu kolejne wiadomości użytkownika w tym wątku są nadal kierowane do
tej samej sesji subagenta.

### Kanały obsługujące wątki

Kanał obsługuje trwałe sesje subagentów powiązane z wątkami
(`sessions_spawn` z `thread: true`), gdy rejestruje adapter powiązania
konwersacji. Wbudowane kanały z taką obsługą: **Discord**,
**iMessage**, **Matrix** i **Telegram**. Discord i Matrix domyślnie
tworzą wątek podrzędny; Telegram i iMessage domyślnie wiążą
bieżącą konwersację. Do włączania, limitów czasu i `spawnSessions`
należy używać kluczy konfiguracji `threadBindings` właściwych dla danego kanału.

### Szybki przebieg

<Steps>
  <Step title="Uruchomienie">
    `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Powiązanie">
    OpenClaw tworzy lub wiąże wątek z celem tej sesji w aktywnym kanale.
  </Step>
  <Step title="Kierowanie kolejnych wiadomości">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdzanie limitów czasu">
    Należy używać `/session idle` do sprawdzania/aktualizowania automatycznego usuwania aktywności po okresie bezczynności oraz
    `/session max-age` do sterowania limitem bezwzględnym.
  </Step>
  <Step title="Odłączenie">
    Do ręcznego odłączenia należy użyć `/unfocus`.
  </Step>
</Steps>

### Sterowanie ręczne

| Polecenie            | Efekt                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Wiąże bieżący wątek (lub tworzy nowy) z celem subagenta/sesji                     |
| `/unfocus`         | Usuwa powiązanie bieżącego powiązanego wątku                                           |
| `/agents`          | Wyświetla aktywne uruchomienia i stan powiązania (`binding:<id>`, `unbound` lub `bindings unavailable`) |
| `/session idle`    | Sprawdza/aktualizuje automatyczne usuwanie aktywności po bezczynności (tylko aktywne powiązane wątki)                             |
| `/session max-age` | Sprawdza/aktualizuje limit bezwzględny (tylko aktywne powiązane wątki)                                      |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Klucze zastępowania ustawień kanału i automatycznego wiązania przy uruchomieniu** są właściwe dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Aktualne szczegóły adapterów zawierają [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia z ukośnikiem](/pl/tools/slash-commands).

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów skonfigurowanych agentów, które można wskazać za pomocą jawnego `agentId` (`["*"]` zezwala na dowolny skonfigurowany cel). Domyślnie: tylko agent żądający. Jeśli ustawiono listę, a żądający nadal ma móc uruchamiać samego siebie za pomocą `agentId`, należy uwzględnić identyfikator żądającego na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych skonfigurowanych agentów docelowych używana, gdy agent żądający nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuje wywołania `sessions_spawn`, w których pominięto `agentId` (wymusza jawny wybór profilu). Ustawienie zastępcze dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Limit czasu poszczególnych prób dostarczenia ogłoszenia `agent` przez Gateway. Wartości są dodatnimi liczbami całkowitymi wyrażonymi w milisekundach i są ograniczane do maksymalnej wartości czasomierza bezpiecznej dla platformy. Ponawianie prób po błędach przejściowych może sprawić, że łączny czas oczekiwania na ogłoszenie przekroczy jeden skonfigurowany limit czasu.
</ParamField>

Jeśli sesja żądającego działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby poza piaskownicą.

### Wykrywanie

Należy użyć `agents_list`, aby sprawdzić, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska wykonawczego, dzięki czemu wywołujący mogą rozróżnić OpenClaw, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska wykonawcze.

Wpisy `allowAgents` muszą wskazywać skonfigurowane identyfikatory agentów w `agents.list[]`.
`["*"]` oznacza dowolnego skonfigurowanego agenta docelowego oraz żądającego. Jeśli konfiguracja agenta
zostanie usunięta, ale jego identyfikator pozostanie w `allowAgents`, `sessions_spawn` odrzuci ten identyfikator,
a `agents_list` go pominie. Należy uruchomić `openclaw doctor --fix`, aby usunąć nieaktualne
wpisy listy dozwolonych, lub dodać minimalny wpis `agents.list[]`, jeśli cel powinien
pozostać możliwy do uruchomienia i dziedziczyć wartości domyślne.

### Automatyczna archiwizacja

- Sesje subagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkrypcji na `*.deleted.<timestamp>` (w tym samym folderze).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (transkrypcja nadal jest zachowywana przez zmianę nazwy).
- Automatyczna archiwizacja odbywa się w miarę możliwości; oczekujące czasomierze są tracone po ponownym uruchomieniu Gateway.
- Skonfigurowane limity czasu uruchomienia **nie** powodują automatycznej archiwizacji; jedynie zatrzymują uruchomienie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy w równym stopniu sesji poziomu 1 i poziomu 2.
- Czyszczenie przeglądarki jest niezależne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są w miarę możliwości zamykane po zakończeniu uruchomienia, nawet jeśli transkrypcja lub rekord sesji zostają zachowane.

## Zagnieżdżeni subagenci

Domyślnie subagenci nie mogą uruchamiać własnych subagentów
(`maxSpawnDepth: 1`). Ustawienie `maxSpawnDepth: 2` umożliwia jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny agent → subagent orkiestrator →
podrzędni subagenci wykonawczy.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // zezwala subagentom na uruchamianie procesów podrzędnych (domyślnie: 1, zakres 1-5)
        maxChildrenPerAgent: 5, // maksymalna liczba aktywnych procesów podrzędnych na sesję agenta (domyślnie: 5, zakres 1-20)
        maxConcurrent: 8, // globalny limit równoległości (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny limit czasu dla sessions_spawn (0 = bez limitu czasu)
        announceTimeoutMs: 120000, // limit czasu poszczególnych ogłoszeń Gateway
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Format klucza sesji                          | Rola                                          | Może uruchamiać?              |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agent główny                                  | Zawsze                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy dozwolona jest głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Pod-podagent (pracownik końcowy)              | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki przepływają z powrotem w górę łańcucha:

1. Pracownik głębokości 2 kończy pracę → ogłasza wynik swojemu rodzicowi (orkiestratorowi głębokości 1).
2. Orkiestrator głębokości 1 otrzymuje ogłoszenie, syntetyzuje wyniki, kończy pracę → ogłasza wynik agentowi głównemu.
3. Agent główny otrzymuje ogłoszenie i przekazuje je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówka operacyjna:** pracę podrzędną należy uruchomić raz i czekać na zdarzenia
ukończenia, zamiast tworzyć pętle odpytywania wokół poleceń uśpienia `sessions_list`,
`sessions_history`, `/subagents list` lub `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji podrzędnych
skoncentrowane na aktywnej pracy — aktywne dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótki okres ostatniej aktywności, a nieaktualne łącza dzieci istniejące tylko w magazynie są
ignorowane po upływie ich okresu świeżości. Zapobiega to ponownemu przywracaniu widmowych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po
ponownym uruchomieniu. Jeśli zdarzenie ukończenia dziecka nadejdzie po wysłaniu
odpowiedzi końcowej, prawidłową reakcją jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Zasady narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji podczas uruchamiania. Dzięki temu płaskie lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby móc uruchamiać dzieci i sprawdzać ich stan. Pozostałe narzędzia sesji/systemowe pozostają niedozwolone.
- **Głębokość 1 (pracownik końcowy, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (bieżące zachowanie domyślne).
- **Głębokość 2 (pracownik końcowy):** brak narzędzi sesji — `sessions_spawn` jest zawsze niedozwolone na głębokości 2. Nie można uruchamiać kolejnych dzieci.

### Limit uruchamiania na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z jednego orkiestratora.

### Zatrzymanie kaskadowe

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
głębokości 2:

- `/stop` na głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich dzieci głębokości 2.

## Uwierzytelnianie

Uwierzytelnianie podagentów jest rozstrzygane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji podagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest wczytywany z `agentDir` tego agenta.
- Profile uwierzytelniania agenta głównego są scalane jako **rozwiązanie rezerwowe**; w przypadku konfliktów profile agenta mają pierwszeństwo przed profilami głównymi.

Scalanie jest addytywne, dlatego profile główne są zawsze dostępne jako
rozwiązania rezerwowe. W pełni odizolowane uwierzytelnianie dla poszczególnych agentów nie jest jeszcze obsługiwane.

## Ogłaszanie

Podagenci przekazują wyniki za pomocą etapu ogłaszania:

- Etap ogłaszania działa wewnątrz sesji podagenta (nie w sesji żądającego).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wynik ogłoszenia zostaje pominięty, nawet jeśli wcześniej istniał widoczny postęp.

Sposób dostarczenia zależy od głębokości żądającego:

- Sesje żądające najwyższego poziomu używają kolejnego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje podagenta żądającego otrzymują wewnętrzne wstrzyknięcie uzupełniające (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w ramach sesji.
- Jeśli zagnieżdżona sesja podagenta żądającego już nie istnieje, OpenClaw używa w miarę możliwości żądającego tej sesji jako rozwiązania rezerwowego.

W przypadku sesji żądających najwyższego poziomu bezpośrednie dostarczenie w trybie ukończenia najpierw
rozpoznaje powiązaną trasę konwersacji/wątku i nadpisanie przez hook, a następnie uzupełnia
brakujące pola kanału i celu na podstawie zapisanej trasy sesji żądającego.
Dzięki temu ukończenia trafiają do właściwego czatu/tematu, nawet jeśli źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci podczas tworzenia zagnieżdżonych ustaleń dotyczących ukończenia jest ograniczona
do bieżącego przebiegu żądającego, co zapobiega przenikaniu nieaktualnych wyników dzieci
z poprzednich przebiegów do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują
trasowanie wątku/tematu, gdy jest ono dostępne w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` lub `cron`                                                                                     |
| Identyfikatory sesji | Klucz/identyfikator sesji dziecka                                                                    |
| Typ            | Typ ogłoszenia + etykieta zadania                                                                        |
| Stan           | Wyprowadzony z wyniku środowiska uruchomieniowego (`ok`, `error`, `timeout` lub `unknown`) — **nie** wywnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta od dziecka                                                             |
| Dalsze działanie | Instrukcja określająca, kiedy odpowiedzieć, a kiedy zachować ciszę                                     |

Zakończone niepowodzeniem przebiegi zgłaszają stan niepowodzenia bez ponownego odtwarzania przechwyconego
tekstu odpowiedzi. Wyniki tool/toolResult nie są przenoszone do tekstu wyniku dziecka.

### Wiersz statystyk

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet po opakowaniu):

- Czas działania (np. `runtime 5m12s`).
- Zużycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modelu (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` oraz ścieżka transkrypcji, aby agent główny mógł pobrać historię za pomocą `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone wyłącznie do orkiestracji; odpowiedzi dla użytkownika
należy przepisać zwykłym głosem asystenta.

### Dlaczego warto preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji do odczytu transkrypcji dziecka
w ramach tury agenta:

- Redaguje tekst przypominający dane uwierzytelniające lub tokeny, nawet gdy ogólne redagowanie dzienników jest wyłączone.
- Skraca długie bloki tekstu (4000 znaków na blok) oraz usuwa sygnatury myślenia, ładunki odtwarzania rozumowania i dane obrazów osadzone w treści.
- Wymusza limit odpowiedzi 80 KB; zbyt duże wiersze są zastępowane przez `[sessions_history omitted: message too large]`.
- Gdy występuje `nextOffset`, należy go użyć do stronicowania wstecz przez starsze okna transkrypcji.
- `sessions_history` **nie** usuwa znaczników rozumowania, szkieletu `<relevant-memories>` ani XML wywołań narzędzi z tekstu wiadomości — zwraca ustrukturyzowane bloki treści zbliżone do surowego formatu transkrypcji, jedynie zredagowane i ograniczone rozmiarem. `/subagents log` stosuje silniejszy mechanizm oczyszczania prozy (usuwa znaczniki rozumowania, szkielet pamięci i XML wywołań narzędzi), ponieważ renderuje zwykłe wiersze czatu zamiast ustrukturyzowanych bloków.
- Bezpośrednia inspekcja transkrypcji na dysku jest rozwiązaniem rezerwowym, gdy potrzebna jest pełna transkrypcja bajt po bajcie.

## Zasady narzędzi

Podagenci najpierw używają tego samego profilu i potoku zasad narzędzi co agent nadrzędny lub
docelowy. Następnie OpenClaw stosuje warstwę ograniczeń podagentów.

Podagenci zawsze tracą `gateway`, `agents_list`, `session_status` i
`cron`, niezależnie od głębokości lub roli (narzędzia systemowe/interaktywne albo
narzędzia, które powinien koordynować agent główny). Podagenci końcowi (domyślne zachowanie na głębokości 1
i zawsze na głębokości 2) dodatkowo tracą `subagents`,
`sessions_list`, `sessions_history` i `sessions_spawn`. Podagenci nigdy
nie otrzymują narzędzia `message` — jest ono wyłączane w momencie uruchamiania, a nie filtrowane przez
tę listę odmów — a `sessions_send` pozostaje niedozwolone, dzięki czemu podagenci
komunikują się wyłącznie za pośrednictwem łańcucha ogłoszeń.

`sessions_history` również pozostaje tutaj ograniczonym, oczyszczonym widokiem przywoływania —
nie jest surowym zrzutem transkrypcji.

Gdy `maxSpawnDepth >= 2`, podagenci-orkiestratorzy głębokości 1 dodatkowo
otrzymują `sessions_spawn`, `subagents`, `sessions_list` i
`sessions_history`, aby mogli zarządzać swoimi dziećmi.

### Nadpisywanie za pomocą konfiguracji

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
        // odmowa ma pierwszeństwo
        deny: ["gateway", "cron"],
        // jeśli ustawiono allow, lista staje się wyłączną listą dozwolonych elementów (odmowa nadal ma pierwszeństwo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` jest końcowym filtrem opartym wyłącznie na liście dozwolonych elementów. Może zawęzić
już rozstrzygnięty zestaw narzędzi, ale nie może **przywrócić** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby umożliwić
podagentom z profilem programistycznym korzystanie z automatyzacji przeglądarki, należy dodać przeglądarkę na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Należy użyć ustawienia `agents.list[].tools.alsoAllow: ["browser"]` dla konkretnego agenta, gdy tylko jeden
agent powinien otrzymać automatyzację przeglądarki.

## Współbieżność

Podagenci używają dedykowanej kolejki wewnątrz procesu:

- **Nazwa kolejki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie uznaje braku `endedAt` za trwały dowód, że
podagent nadal działa. Niezakończone przebiegi starsze niż okno nieaktualnego przebiegu
(2 godziny albo skonfigurowany limit czasu przebiegu powiększony o krótki okres karencji,
zależnie od tego, która wartość jest większa) przestają być liczone jako aktywne/oczekujące w `/subagents list`,
podsumowaniach stanu, blokowaniu ukończenia potomków i kontrolach
współbieżności poszczególnych sesji.

Po ponownym uruchomieniu gatewaya nieaktualne, niezakończone i przywrócone przebiegi są usuwane, chyba że
ich sesja podrzędna jest oznaczona jako `abortedLastRun: true`. Przebiegi przerwane przez ponowne uruchomienie
pozostają zarejestrowane na potrzeby procesu odzyskiwania osieroconych podagentów: nieaktualne
przebiegi są finalizowane bez wznowienia, natomiast świeże sesje podrzędne otrzymują
syntetyczny komunikat wznowienia przed usunięciem znacznika przerwania.

Automatyczne odzyskiwanie po ponownym uruchomieniu jest ograniczone dla każdej sesji podrzędnej. Jeśli ten sam
podagent podrzędny jest wielokrotnie przyjmowany do odzyskiwania osieroconego stanu w
oknie szybkiego ponownego zakleszczenia, OpenClaw zapisuje nagrobek odzyskiwania w tej
sesji i przestaje automatycznie wznawiać ją przy kolejnych ponownych uruchomieniach. Należy uruchomić
`openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo
`openclaw doctor --fix`, aby usunąć nieaktualne flagi przerwanego odzyskiwania w
sesjach oznaczonych nagrobkiem.

<Note>
Jeśli uruchomienie subagenta nie powiedzie się z błędem Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, przed edycją stanu parowania należy sprawdzić wywołującego RPC.
Wewnętrzna koordynacja `sessions_spawn` wykonuje wysyłanie w ramach procesu, gdy
wywołujący działa już w kontekście żądania Gateway, dlatego nie otwiera zwrotnego
połączenia WebSocket ani nie zależy od bazowego zakresu sparowanego urządzenia CLI.
Wywołujący spoza procesu Gateway nadal używają awaryjnego połączenia WebSocket
jako `client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie uwierzytelnianie
zwrotne za pomocą współdzielonego tokenu/hasła. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokenu urządzenia oraz klienci przeglądarkowi/Node
nadal wymagają zwykłego zatwierdzenia urządzenia w celu rozszerzenia zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa jego sesję i zatrzymuje wszystkie aktywne uruchomienia subagentów utworzone z tej sesji, propagując zatrzymanie na zagnieżdżone procesy potomne.

## Ograniczenia

- Powiadamianie przez subagenta odbywa się na zasadzie **najlepszych starań**. Jeśli Gateway zostanie uruchomiony ponownie, oczekujące zadania „powiadom z powrotem” zostaną utracone.
- Subagenci nadal współdzielą zasoby tego samego procesu Gateway; `maxConcurrent` należy traktować jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst subagenta wstrzykuje wyłącznie `AGENTS.md` i `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`). Natywni subagenci Codex podlegają tej samej granicy: `TOOLS.md` pozostaje w odziedziczonych instrukcjach wątku Codex, natomiast pliki persony, tożsamości i użytkownika przeznaczone tylko dla rodzica są wstrzykiwane jako instrukcje współpracy ograniczone do danej tury, aby procesy potomne ich nie klonowały.
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1-5). Dla większości zastosowań zalecana jest głębokość 2.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych procesów potomnych na sesję (domyślnie `5`, zakres `1-20`).

## Powiązane

- [Narzędzia sesji i zmiany stanu](/pl/concepts/session-tool)
- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie przez agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy dla wielu agentów](/pl/tools/multi-agent-sandbox-tools)
