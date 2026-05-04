---
read_when:
    - Chcesz wykonywać pracę w tle lub równoległą za pośrednictwem agenta
    - Zmieniasz zasady dotyczące sessions_spawn lub narzędzia subagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami podagentów przypisanymi do wątku
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agentów w tle, które ogłaszają wyniki z powrotem na czacie osoby zgłaszającej.
title: Podagenci
x-i18n:
    generated_at: "2026-05-04T07:06:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

Subagenci to uruchomienia agentów w tle, utworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem na kanale czatu
żądającego. Każde uruchomienie subagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoległe wykonywanie prac typu „badanie / długie zadanie / wolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja subagentów (separacja sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: subagenci domyślnie **nie** dostają narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżania dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy subagent domyślnie ma własny kontekst i użycie tokenów.
Dla ciężkich lub powtarzalnych zadań ustaw tańszy model dla subagentów
i pozostaw głównego agenta na modelu wyższej jakości. Skonfiguruj przez
`agents.defaults.subagents.model` albo nadpisania dla poszczególnych agentów. Gdy dziecko
    rzeczywiście potrzebuje bieżącej transkrypcji żądającego, agent może zażądać
    `context: "fork"` przy tym jednym utworzeniu. Sesje subagentów powiązane z wątkiem domyślnie używają
    `context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do
    wątku kontynuacji.
</Note>

## Polecenie slash

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

Użyj polecenia najwyższego poziomu [`/steer <message>`](/pl/tools/steer), aby sterować aktywnym uruchomieniem bieżącej sesji żądającego. Użyj `/subagents steer <id|#> <message>`, gdy celem jest uruchomienie potomne.

`/subagents info` pokazuje metadane uruchomienia (status, znaczniki czasu, identyfikator sesji,
ścieżkę transkrypcji, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przywołania; sprawdź ścieżkę transkrypcji na dysku, gdy
potrzebujesz surowej pełnej transkrypcji.

### Kontrolki powiązania z wątkiem

Te polecenia działają na kanałach obsługujących trwałe powiązania z wątkami.
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
wewnętrzne przekazanie) i wysyła jedną końcową aktualizację ukończenia z powrotem na
czat żądającego, gdy uruchomienie się zakończy.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Polecenie tworzenia nie blokuje; natychmiast zwraca identyfikator uruchomienia.
    - Po ukończeniu subagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem na kanale czatu żądającego.
    - Ukończenie jest oparte na wypychaniu. Po utworzeniu **nie** odpytuj `/subagents list`, `sessions_list` ani `sessions_history` w pętli tylko po to, aby czekać na zakończenie; sprawdzaj status tylko na żądanie przy debugowaniu lub interwencji.
    - Po ukończeniu OpenClaw w miarę możliwości zamyka śledzone karty przeglądarki/procesy otwarte przez tę sesję subagenta, zanim będzie kontynuowany przepływ czyszczenia ogłoszenia.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
    - Jeśli tura ukończenia agenta żądającego nie powiedzie się, nie wygeneruje widocznego wyjścia albo zwróci oczywiście niepełny prefiks przechwyconego wyniku dziecka, OpenClaw wraca do bezpośredniego dostarczenia ukończenia z przechwyconego wyniku dziecka.
    - Jeśli nie można użyć bezpośredniego dostarczenia, wraca do routingu przez kolejkę.
    - Jeśli routing przez kolejkę nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostatecznym zrezygnowaniem.
    - Dostarczanie ukończenia zachowuje rozwiązaną trasę żądającego: trasy ukończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło ukończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji żądającego (`lastChannel` / `lastTo` / `lastAccountId`), aby bezpośrednie dostarczenie nadal działało.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Przekazanie ukończenia do sesji żądającego to generowany w czasie działania
    kontekst wewnętrzny (nie tekst napisany przez użytkownika) i obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult. Końcowe nieudane uruchomienia nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompaktowe statystyki czasu działania/tokenów.
    - Instrukcję dostarczenia mówiącą agentowi żądającemu, aby przepisał treść normalnym głosem asystenta (zamiast przekazywać surowe metadane wewnętrzne).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i wyjście po ukończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). Dla trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - Dla sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode albo jawne Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie reklamuje ten runtime. Zobacz [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń albo pętli agent-do-agenta. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie prosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"` do czasu, aż ACP zostanie włączone, żądający nie jest w sandboxie, a Plugin backendu taki jak `acpx` jest załadowany. `runtime: "acp"` oczekuje identyfikatora zewnętrznej uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; użyj domyślnego runtime subagenta dla zwykłych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni subagenci startują w izolacji, chyba że wywołujący jawnie poprosi o rozgałęzienie
bieżącej transkrypcji.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badanie, niezależna implementacja, wolna praca narzędzia albo cokolwiek, co można opisać w treści zadania                           | Tworzy czystą transkrypcję dziecka. To ustawienie domyślne i utrzymuje niższe użycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi albo niuansów instrukcji już obecnych w transkrypcji żądającego | Rozgałęzia transkrypcję żądającego do sesji dziecka przed startem dziecka. |

Używaj `fork` oszczędnie. Służy do delegowania zależnego od kontekstu, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia subagenta z `deliver: false` na globalnym pasie `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia na kanale czatu
żądającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
tego nie robi; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, którzy powinni delegować
pracę. Polityki kanału/grupy, dostawcy, sandboxu oraz zezwalania/odmawiania dla poszczególnych agentów nadal mogą
usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (albo `agents.list[].subagents.model` dla poszczególnych agentów); jawne `sessions_spawn.model` nadal wygrywa.
- **Thinking:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (albo `agents.list[].subagents.thinking` dla poszczególnych agentów); jawne `sessions_spawn.thinking` nadal wygrywa.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` zostanie pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (bez limitu czasu).

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla subagenta.
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
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane dla natywnych utworzeń subagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje wyjście uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń dla natywnych utworzeń subagentów.
</ParamField>
<ParamField path="model" type="string">
  Nadpisuje model subagenta. Nieprawidłowe wartości są pomijane, a subagent działa na domyślnym modelu z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisuje poziom thinking dla uruchomienia subagenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione, w przeciwnym razie `0`. Gdy ustawione, uruchomienie subagenta zostaje przerwane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania tej sesji subagenta z wątkiem kanału.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i `mode` pominięto, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypcję przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca utworzenie, chyba że docelowy runtime dziecka jest w sandboxie.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżącą transkrypcję żądającego do sesji dziecka. Tylko natywni subagenci. Utworzenia powiązane z wątkiem domyślnie używają `fork`; utworzenia bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałem (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z utworzonego uruchomienia.
</Warning>

## Sesje powiązane z wątkiem

Gdy powiązania z wątkiem są włączone dla kanału, subagent może pozostać powiązany
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
`channels.discord.threadBindings.spawnSessions`.

### Szybki przepływ

<Steps>
  <Step title="Utworzenie">
    `sessions_spawn` z `thread: true` (oraz opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Powiązanie">
    OpenClaw tworzy lub wiąże wątek z tym celem sesji w aktywnym kanale.
  </Step>
  <Step title="Kierowanie kontynuacji">
    Odpowiedzi i wiadomości kontynuacyjne w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdzenie limitów czasu">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odłączanie fokusu po bezczynności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłączenie">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Sterowanie ręczne

| Polecenie          | Efekt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz nowy) z celem podagenta/sesji        |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                       |
| `/agents`          | Wyświetl aktywne przebiegi i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne odłączanie fokusu po bezczynności (tylko powiązane wątki z fokusem) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko powiązane wątki z fokusem)    |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego powiązania przy tworzeniu** są specyficzne dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia z ukośnikiem](/pl/tools/slash-commands), aby uzyskać bieżące szczegóły adaptera.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, które mogą być celem przez jawne `agentId` (`["*"]` zezwala na dowolny). Domyślnie: tylko agent wywołujący. Jeśli ustawisz listę i nadal chcesz, aby agent wywołujący tworzył samego siebie z `agentId`, uwzględnij identyfikator agenta wywołującego na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana, gdy agent wywołujący nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuj wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie dla agenta: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jeśli sesja wywołująca jest objęta piaskownicą, `sessions_spawn` odrzuca cele,
które działałyby bez piaskownicy.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska wykonawczego, aby wywołujący mogli odróżnić PI, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska wykonawcze.

### Automatyczna archiwizacja

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkrypcji na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po zgłoszeniu (nadal zachowuje transkrypcję przez zmianę nazwy).
- Automatyczna archiwizacja działa w trybie best-effort; oczekujące timery są tracone, jeśli Gateway zostanie uruchomiony ponownie.
- `runTimeoutSeconds` **nie** archiwizuje automatycznie; tylko zatrzymuje przebieg. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy tak samo sesji głębokości 1 i głębokości 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane w trybie best-effort po zakończeniu przebiegu, nawet jeśli rekord transkrypcji/sesji zostaje zachowany.

## Zagnieżdżone podagenty

Domyślnie podagenci nie mogą tworzyć własnych podagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → podagent orkiestrator →
podagenci-pracownicy drugiego poziomu.

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

| Głębokość | Kształt klucza sesji                        | Rola                                          | Może tworzyć?                |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Agent główny                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy głębokość 2 jest dozwolona) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Podagent drugiego poziomu (pracownik końcowy) | Nigdy                        |

### Łańcuch zgłoszeń

Wyniki przepływają z powrotem w górę łańcucha:

1. Pracownik głębokości 2 kończy → zgłasza do swojego rodzica (orkiestratora głębokości 1).
2. Orkiestrator głębokości 1 odbiera zgłoszenie, syntetyzuje wyniki, kończy → zgłasza do głównego.
3. Agent główny odbiera zgłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko zgłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę dzieci raz i czekaj na zdarzenia
ukończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń uśpienia `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skupione na pracy na żywo — aktywne dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótkie ostatnie okno, a nieaktualne linki dzieci istniejące tylko w magazynie są
ignorowane po upływie ich okna świeżości. Zapobiega to wskrzeszaniu przez stare metadane `spawnedBy` /
`parentSessionKey` widmowych dzieci po
ponownym uruchomieniu. Jeśli zdarzenie ukończenia dziecka nadejdzie po wysłaniu
ostatecznej odpowiedzi, poprawną kontynuacją jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Zasady narzędzi według głębokości

- Rola i zakres sterowania są zapisywane w metadanych sesji w momencie tworzenia. Dzięki temu płaskie lub odtworzone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemowe pozostają odrzucone.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (bieżące zachowanie domyślne).
- **Głębokość 2 (pracownik końcowy):** brak narzędzi sesji — `sessions_spawn` jest zawsze odrzucane na głębokości 2. Nie może tworzyć kolejnych dzieci.

### Limit tworzenia na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z jednego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo zatrzymuje ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo zatrzymuje jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich podagentów dla wywołującego i wykonuje kaskadę.

## Uwierzytelnianie

Uwierzytelnianie podagenta jest rozwiązywane według **identyfikatora agenta**, a nie według typu sesji:

- Klucz sesji podagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania agenta głównego są scalane jako **fallback**; profile agenta zastępują profile główne w przypadku konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
fallbacki. W pełni izolowane uwierzytelnianie dla każdego agenta nie jest jeszcze obsługiwane.

## Zgłoszenie

Podagenci raportują z powrotem przez krok zgłoszenia:

- Krok zgłoszenia działa wewnątrz sesji podagenta (nie w sesji wywołującej).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wynik zgłoszenia jest tłumiony nawet wtedy, gdy wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości wywołującego:

- Sesje wywołujące najwyższego poziomu używają kontynuacyjnego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje podagentów wywołujących otrzymują wewnętrzne wstrzyknięcie kontynuacji (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja podagenta wywołującego zniknęła, OpenClaw wraca do wywołującego tej sesji, gdy jest dostępny.

Dla sesji wywołujących najwyższego poziomu bezpośrednie dostarczanie w trybie ukończenia najpierw
rozwiązuje dowolną powiązaną trasę rozmowy/wątku i nadpisanie haka, a następnie wypełnia
brakujące pola celu kanału z zapisanej trasy sesji wywołującej.
Dzięki temu ukończenia trafiają do właściwego czatu/tematu nawet wtedy, gdy źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci jest zawężona do bieżącego przebiegu wywołującego podczas
budowania zagnieżdżonych ustaleń ukończenia, co zapobiega wyciekowi nieaktualnych wyników dzieci z wcześniejszych przebiegów
do bieżącego zgłoszenia. Odpowiedzi zgłoszeń zachowują
trasowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.

### Kontekst zgłoszenia

Kontekst zgłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` lub `cron`                                                                                         |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                  |
| Typ            | Typ zgłoszenia + etykieta zadania                                                                             |
| Status         | Pochodzi z wyniku środowiska wykonawczego (`success`, `error`, `timeout` lub `unknown`) — **nie** jest wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult       |
| Kontynuacja    | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy zachować ciszę                                              |

Końcowe nieudane przebiegi raportują status niepowodzenia bez odtwarzania przechwyconego
tekstu odpowiedzi. W przypadku przekroczenia limitu czasu, jeśli dziecko przeszło tylko przez wywołania narzędzi, zgłoszenie
może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast
odtwarzać surowy wynik narzędzia.

### Wiersz statystyk

Ładunki zgłoszeń zawierają na końcu wiersz statystyk (nawet po zawinięciu):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkrypcji, aby agent główny mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone tylko do orkiestracji; odpowiedzi skierowane do użytkownika
powinny zostać przepisane normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- Przywołanie asystenta jest najpierw normalizowane: tagi myślenia są usuwane; rusztowanie `<relevant-memories>` / `<relevant_memories>` jest usuwane; bloki ładunku XML wywołań narzędzi w zwykłym tekście (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) są usuwane, w tym obcięte ładunki, które nigdy nie zamykają się poprawnie; zdegradowane rusztowanie wywołań/wyników narzędzi oraz znaczniki kontekstu historycznego są usuwane; wyciekłe tokeny sterowania modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnej szerokości `<｜...｜>`) są usuwane; niepoprawny XML wywołań narzędzi MiniMax jest usuwany.
- Tekst przypominający dane uwierzytelniające/tokeny jest redagowany.
- Długie bloki mogą być obcinane.
- Bardzo duże historie mogą porzucać starsze wiersze lub zastępować zbyt duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkrypcji na dysku jest fallbackiem, gdy potrzebujesz pełnej transkrypcji bajt w bajt.

## Zasady narzędzi

Podagenci najpierw używają tego samego profilu i potoku zasad narzędzi co agent nadrzędny lub docelowy. Następnie OpenClaw stosuje warstwę ograniczeń podagentów.

Bez ograniczającego `tools.profile` podagenci otrzymują **wszystkie narzędzia oprócz narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` także tutaj pozostaje ograniczonym, oczyszczonym widokiem przywołania — nie jest surowym zrzutem transkryptu.

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
        // deny ma pierwszeństwo
        deny: ["gateway", "cron"],
        // jeśli ustawiono allow, staje się listą wyłącznie dozwolonych (deny nadal ma pierwszeństwo)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` to końcowy filtr wyłącznie dozwolonych narzędzi. Może zawęzić już rozstrzygnięty zestaw narzędzi, ale nie może **przywrócić** narzędzia usuniętego przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje `web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby pozwolić podagentom z profilem coding używać automatyzacji przeglądarki, dodaj browser na etapie profilu:

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

Podagenci używają dedykowanej kolejki w procesie:

- **Nazwa kolejki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że podagent nadal działa. Niezakończone uruchomienia starsze niż okno nieaktualnego uruchomienia przestają liczyć się jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu, bramkowaniu ukończenia potomków i kontrolach współbieżności na sesję.

Po ponownym uruchomieniu Gateway nieaktualne, niezakończone, odtworzone uruchomienia są usuwane, chyba że ich sesja potomna jest oznaczona jako `abortedLastRun: true`. Te przerwane przez restart sesje potomne pozostają możliwe do odzyskania przez przepływ odzyskiwania osieroconych podagentów, który wysyła syntetyczną wiadomość wznowienia przed wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone dla każdej sesji potomnej. Jeśli to samo dziecko podagenta jest wielokrotnie akceptowane do odzyskiwania osierocenia w oknie szybkiego ponownego zakleszczenia, OpenClaw zapisuje tombstone odzyskiwania w tej sesji i przestaje automatycznie wznawiać ją przy kolejnych restartach. Uruchom `openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, lub `openclaw doctor --fix`, aby wyczyścić nieaktualne flagi przerwanego odzyskiwania w sesjach z tombstone.

<Note>
Jeśli utworzenie podagenta kończy się niepowodzeniem z Gateway `PAIRING_REQUIRED` / `scope-upgrade`, sprawdź wywołującego RPC przed edycją stanu parowania. Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako `client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie uwierzytelnianie współdzielonym tokenem/hasłem przez local loopback; ta ścieżka nie zależy od bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne `deviceIdentity`, jawne ścieżki tokenów urządzeń oraz klienci browser/node nadal wymagają normalnego zatwierdzenia urządzenia dla rozszerzeń zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` na czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia podagentów utworzone z niej, kaskadowo obejmując zagnieżdżone dzieci.
- `/subagents kill <id>` zatrzymuje określonego podagenta i kaskadowo zatrzymuje jego dzieci.

## Ograniczenia

- Ogłaszanie podagenta działa na zasadzie **best-effort**. Jeśli Gateway uruchomi się ponownie, oczekująca praca „announce back” zostanie utracona.
- Podagenci nadal współdzielą te same zasoby procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst podagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana dla większości przypadków użycia.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
