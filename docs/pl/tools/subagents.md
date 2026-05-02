---
read_when:
    - Chcesz wykonywać pracę w tle lub pracę równoległą za pomocą agenta
    - Zmieniasz zasady dotyczące sessions_spawn lub narzędzia podagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agentów w tle, które przekazują wyniki z powrotem na czat osoby zgłaszającej żądanie
title: Podagenci
x-i18n:
    generated_at: "2026-05-02T10:05:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

Podagenci to uruchomienia agentów w tle tworzone z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i,
po zakończeniu, **ogłaszają** swój wynik z powrotem w kanale czatu
zleceniodawcy. Każde uruchomienie podagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoległe wykonywanie pracy typu „badanie / długie zadanie / wolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja podagentów (separacja sesji + opcjonalne piaskownice).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: podagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżania dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy podagent ma domyślnie własny kontekst i własne użycie tokenów. W przypadku ciężkich lub powtarzalnych zadań ustaw tańszy model dla podagentów i pozostaw głównego agenta na modelu wyższej jakości. Skonfiguruj to przez `agents.defaults.subagents.model` albo nadpisania dla poszczególnych agentów. Gdy dziecko naprawdę potrzebuje bieżącego transkryptu zleceniodawcy, agent może zażądać `context: "fork"` dla tego jednego utworzenia. Sesje podagentów powiązane z wątkiem domyślnie używają `context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do wątku uzupełniającego.
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

`/subagents info` pokazuje metadane uruchomienia (status, znaczniki czasu, identyfikator sesji,
ścieżkę transkryptu, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przypominania; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego pełnego transkryptu.

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

`/subagents spawn` uruchamia podagenta w tle jako polecenie użytkownika (nie jako
wewnętrzny przekaźnik) i wysyła jedną końcową aktualizację ukończenia z powrotem do
czatu zleceniodawcy po zakończeniu uruchomienia.

<AccordionGroup>
  <Accordion title="Nieblokujące ukończenie oparte na wypychaniu">
    - Polecenie tworzenia jest nieblokujące; natychmiast zwraca identyfikator uruchomienia.
    - Po ukończeniu podagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem w kanale czatu zleceniodawcy.
    - Ukończenie jest oparte na wypychaniu. Po utworzeniu nie odpytuj w pętli `/subagents list`, `sessions_list` ani `sessions_history` tylko po to, aby czekać na zakończenie; sprawdzaj status tylko na żądanie przy debugowaniu lub interwencji.
    - Po ukończeniu OpenClaw w miarę możliwości zamyka śledzone karty przeglądarki/procesy otwarte przez tę sesję podagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Odporność dostarczania przy ręcznym tworzeniu">
    - OpenClaw najpierw próbuje bezpośredniego dostarczenia `agent` ze stabilnym kluczem idempotencji.
    - Jeśli bezpośrednie dostarczenie się nie powiedzie, przechodzi na trasowanie przez kolejkę.
    - Jeśli trasowanie przez kolejkę nadal nie jest dostępne, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostateczną rezygnacją.
    - Dostarczenie ukończenia zachowuje rozwiązaną trasę zleceniodawcy: trasy ukończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło ukończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto z rozwiązanej trasy sesji zleceniodawcy (`lastChannel` / `lastTo` / `lastAccountId`), dzięki czemu bezpośrednie dostarczenie nadal działa.

  </Accordion>
  <Accordion title="Metadane przekazania ukończenia">
    Przekazanie ukończenia do sesji zleceniodawcy to wygenerowany w czasie działania
    wewnętrzny kontekst (nie tekst autorstwa użytkownika) i zawiera:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst tool/toolResult. Końcowo nieudane uruchomienia nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Zwięzłe statystyki czasu działania/tokenów.
    - Instrukcję dostarczenia mówiącą agentowi zleceniodawcy, aby przepisał odpowiedź normalnym głosem asystenta (a nie przekazywał surowych wewnętrznych metadanych).

  </Accordion>
  <Accordion title="Tryby i środowisko uruchomieniowe ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po ukończeniu.
    - `/subagents spawn` to tryb jednorazowy (`mode: "run"`). W przypadku trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - W przypadku sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode albo jawny Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza to środowisko uruchomieniowe. Zobacz [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń lub pętli agent-do-agenta. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"`, dopóki ACP nie jest włączone, zleceniodawca nie działa w piaskownicy, a Plugin backendowy taki jak `acpx` nie jest załadowany. `runtime: "acp"` oczekuje zewnętrznego identyfikatora uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; używaj domyślnego środowiska uruchomieniowego podagentów dla zwykłych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni podagenci zaczynają w izolacji, chyba że wywołujący jawnie poprosi o rozwidlenie
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badanie, niezależna implementacja, wolna praca narzędzia albo cokolwiek, co można opisać w tekście zadania                           | Tworzy czysty transkrypt dziecka. Jest to ustawienie domyślne i zmniejsza użycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi albo niuansowych instrukcji już obecnych w transkrypcie zleceniodawcy | Rozgałęzia transkrypt zleceniodawcy do sesji dziecka przed startem dziecka. |

Używaj `fork` oszczędnie. Służy do delegowania zależnego od kontekstu, a nie jako
zamiennik pisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia podagenta z `deliver: false` na globalnej ścieżce `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale
czatu zleceniodawcy.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
nie udostępnia go; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, które powinny delegować
pracę. Polityki kanału/grupy, dostawcy, piaskownicy i per-agent allow/deny mogą
nadal usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (albo `agents.list[].subagents.model` dla konkretnego agenta); jawne `sessions_spawn.model` nadal wygrywa.
- **Thinking:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (albo `agents.list[].subagents.thinking` dla konkretnego agenta); jawne `sessions_spawn.thinking` nadal wygrywa.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` jest pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (bez limitu czasu).

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla podagenta.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Utwórz pod innym identyfikatorem agenta, gdy zezwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` jest przeznaczone tylko dla zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie żądane Codex ACP/acpx) oraz dla wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane dla natywnych utworzeń podagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje dane wyjściowe uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń dla natywnych utworzeń podagentów.
</ParamField>
<ParamField path="model" type="string">
  Nadpisuje model podagenta. Nieprawidłowe wartości są pomijane, a podagent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisuje poziom thinking dla uruchomienia podagenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione, w przeciwnym razie `0`. Gdy ustawione, uruchomienie podagenta zostaje przerwane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania wątku kanału dla tej sesji podagenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true` i `mode` jest pominięte, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca tworzenie, chyba że docelowe środowisko uruchomieniowe dziecka działa w piaskownicy.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżący transkrypt zleceniodawcy do sesji dziecka. Tylko natywni podagenci. Utworzenia powiązane z wątkiem domyślnie używają `fork`; utworzenia bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** przyjmuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z utworzonego uruchomienia.
</Warning>

## Sesje powiązane z wątkiem

Gdy powiązania wątków są włączone dla kanału, podagent może pozostać powiązany
z wątkiem, dzięki czemu uzupełniające wiadomości użytkownika w tym wątku dalej trafiają do
tej samej sesji podagenta.

### Kanały obsługujące wątki

**Discord** jest obecnie jedynym obsługiwanym kanałem. Obsługuje
trwałe sesje podagentów powiązane z wątkiem (`sessions_spawn` z
`thread: true`), ręczne kontrolki wątku (`/focus`, `/unfocus`, `/agents`,
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
  <Step title="Trasuj kontynuacje">
    Odpowiedzi i wiadomości uzupełniające w tym wątku trafiają do powiązanej sesji.
  </Step>
  <Step title="Sprawdź limity czasu">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne odłączenie przy braku aktywności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłącz">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Ręczne kontrolki

| Polecenie          | Efekt                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz go) z celem podagenta/sesji                  |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                               |
| `/agents`          | Wypisz aktywne uruchomienia i stan powiązania (`thread:<id>` albo `unbound`)  |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne odfokusowanie po bezczynności (tylko fokusowane powiązane wątki) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit czasu (tylko fokusowane powiązane wątki)     |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego powiązania przy tworzeniu** są specyficzne dla adaptera. Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [Dokumentację konfiguracji](/pl/gateway/configuration-reference) i
[Polecenia ukośnikowe](/pl/tools/slash-commands), aby poznać bieżące szczegóły adaptera.

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

Jeśli sesja żądającego działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby poza piaskownicą.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny
model każdego wymienionego agenta oraz osadzone metadane środowiska uruchomieniowego, aby wywołujący mogli odróżnić PI, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska uruchomieniowe.

### Automatyczna archiwizacja

- Sesje podagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczna archiwizacja jest działaniem best-effort; oczekujące timery przepadają, jeśli Gateway zostanie uruchomiony ponownie.
- `runTimeoutSeconds` **nie** wykonuje automatycznej archiwizacji; tylko zatrzymuje uruchomienie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy tak samo sesji głębokości 1 i 2.
- Czyszczenie przeglądarki jest oddzielone od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane best-effort po zakończeniu uruchomienia, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżeni podagenci

Domyślnie podagenci nie mogą tworzyć własnych podagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → podagent-orkiestrator →
pod-podagenci workerzy.

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
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Główny agent                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Podagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Pod-podagent (końcowy worker)                 | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki przepływają z powrotem w górę łańcucha:

1. Worker głębokości 2 kończy pracę → ogłasza wynik swojemu rodzicowi (orkiestratorowi głębokości 1).
2. Orkiestrator głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki, kończy pracę → ogłasza wynik głównemu.
3. Główny agent odbiera ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę dziecka raz i czekaj na zdarzenia
ukończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń uśpienia `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skupione na pracy na żywo — aktywne dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótkie ostatnie okno, a nieaktualne linki dzieci istniejące tylko w magazynie są
ignorowane po upływie okna świeżości. Zapobiega to wskrzeszaniu widmowych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po
ponownym uruchomieniu. Jeśli zdarzenie ukończenia dziecka nadejdzie po tym, jak wysłano już
finalną odpowiedź, prawidłową kontynuacją jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Polityka narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie tworzenia. Dzięki temu płaskie lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby mógł zarządzać swoimi dziećmi. Inne narzędzia sesji/systemowe pozostają odrzucone.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (bieżące zachowanie domyślne).
- **Głębokość 2 (worker liścia):** brak narzędzi sesji — `sessions_spawn` jest zawsze odrzucane na głębokości 2. Nie może tworzyć kolejnych dzieci.

### Limit tworzenia na agenta

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozchodzeniu się pracy
z jednego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci
głębokości 2:

- `/stop` w głównym czacie zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego podagenta i kaskadowo jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich podagentów dla żądającego i uruchamia kaskadę.

## Uwierzytelnianie

Uwierzytelnianie podagenta jest rozwiązywane według **identyfikatora agenta**, a nie typu sesji:

- Klucz sesji podagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania głównego agenta są scalane jako **fallback**; profile agenta nadpisują profile główne w przypadku konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
fallbacki. W pełni izolowane uwierzytelnianie na agenta nie jest jeszcze obsługiwane.

## Ogłoszenie

Podagenci zgłaszają wyniki przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji podagenta (nie sesji żądającego).
- Jeśli podagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wynik ogłoszenia jest tłumiony, nawet jeśli wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości żądającego:

- Sesje żądającego najwyższego poziomu używają następczego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje podagentów żądających otrzymują wewnętrzne wstrzyknięcie następcze (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja podagenta żądającego zniknęła, OpenClaw wraca do żądającego tej sesji, gdy jest dostępny.

Dla sesji żądającego najwyższego poziomu bezpośrednie dostarczenie w trybie ukończenia najpierw
rozwiązuje każdą powiązaną trasę rozmowy/wątku i nadpisanie hooka, a następnie uzupełnia
brakujące pola celu kanału z zapisanej trasy sesji żądającego.
Dzięki temu ukończenia trafiają do właściwego czatu/tematu nawet wtedy, gdy źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci jest ograniczona do bieżącego uruchomienia żądającego podczas
budowania ustaleń zagnieżdżonego ukończenia, co zapobiega wyciekaniu wyników dzieci
z wcześniejszych uruchomień do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują
trasowanie wątku/tematu, gdy jest dostępne w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole           | Źródło                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Źródło         | `subagent` albo `cron`                                                                                        |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                  |
| Typ            | Typ ogłoszenia + etykieta zadania                                                                             |
| Status         | Wyprowadzony z wyniku środowiska uruchomieniowego (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku   | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult       |
| Kontynuacja    | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy pozostać cicho                                              |

Terminalnie nieudane uruchomienia zgłaszają status niepowodzenia bez odtwarzania przechwyconego
tekstu odpowiedzi. Przy przekroczeniu czasu, jeśli dziecko zdążyło tylko wykonać wywołania narzędzi, ogłoszenie
może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast
odtwarzać surowe wyjście narzędzi.

### Linia statystyk

Ładunki ogłoszeń zawierają na końcu linię statystyk (nawet po zawinięciu):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/łącznie).
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkryptu, aby główny agent mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Wewnętrzne metadane są przeznaczone wyłącznie do orkiestracji; odpowiedzi widoczne dla użytkownika
powinny zostać przepisane normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- Przywołanie asystenta jest najpierw normalizowane: znaczniki myślenia usuwane; szkielet `<relevant-memories>` / `<relevant_memories>` usuwany; bloki ładunku XML wywołań narzędzi w zwykłym tekście (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) usuwane, w tym ucięte ładunki, które nigdy nie zamykają się poprawnie; zdegradowany szkielet wywołania/wyniku narzędzia i znaczniki kontekstu historycznego usuwane; ujawnione tokeny kontroli modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnoszerokościowe `<｜...｜>`) usuwane; niepoprawny XML wywołań narzędzi MiniMax usuwany.
- Tekst przypominający poświadczenia/tokeny jest redagowany.
- Długie bloki mogą zostać ucięte.
- Bardzo duże historie mogą odrzucać starsze wiersze albo zastąpić zbyt duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkryptu na dysku jest fallbackiem, gdy potrzebujesz pełnego transkryptu bajt w bajt.

## Polityka narzędzi

Podagenci używają najpierw tego samego profilu i potoku polityki narzędzi co agent nadrzędny lub
docelowy. Następnie OpenClaw stosuje warstwę ograniczeń
podagenta.

Bez restrykcyjnego `tools.profile` podagenci otrzymują **wszystkie narzędzia oprócz
narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` również tutaj pozostaje ograniczonym, oczyszczonym widokiem przywołania — nie
jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, podagenci-orkiestratorzy głębokości 1 dodatkowo
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

`tools.subagents.tools.allow` jest ostatecznym filtrem tylko zezwalającym. Może zawęzić
już rozstrzygnięty zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego
przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje
`web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby pozwolić
podagentom profilu kodowania używać automatyzacji przeglądarki, dodaj browser na
etapie profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Użyj `agents.list[].tools.alsoAllow: ["browser"]` dla pojedynczego agenta, gdy tylko jeden
agent powinien otrzymać automatyzację przeglądarki.

## Współbieżność

Podagenci używają dedykowanej kolejki w procesie:

- **Nazwa kolejki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że
podagent nadal działa. Niezakończone uruchomienia starsze niż okno przestarzałego uruchomienia
przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach statusu,
bramkowaniu ukończenia potomków i sprawdzeniach współbieżności dla sesji.

Po ponownym uruchomieniu Gateway przestarzałe niezakończone odtworzone uruchomienia są usuwane, chyba że
ich sesja podrzędna jest oznaczona jako `abortedLastRun: true`. Te
sesje podrzędne przerwane przez restart pozostają możliwe do odzyskania przez przepływ odzyskiwania osieroconych podagentów,
który wysyła syntetyczną wiadomość wznowienia przed
wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone dla każdej sesji podrzędnej. Jeśli ten sam
podagent podrzędny jest wielokrotnie akceptowany do odzyskiwania osieroconego w
szybkim oknie ponownego zakleszczenia, OpenClaw utrwala znacznik nagrobka odzyskiwania dla tej
sesji i przestaje automatycznie wznawiać ją przy późniejszych restartach. Uruchom
`openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo
`openclaw doctor --fix`, aby wyczyścić przestarzałe flagi odzyskiwania po przerwaniu w
sesjach z nagrobkiem.

<Note>
Jeśli utworzenie podagenta nie powiedzie się z Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, sprawdź wywołującego RPC przed edytowaniem stanu parowania.
Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako
`client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie
uwierzytelnianie loopback współdzielonym tokenem/hasłem; ta ścieżka nie zależy od
bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne
`deviceIdentity`, jawne ścieżki tokenów urządzeń oraz klienci przeglądarki/node
nadal wymagają normalnego zatwierdzenia urządzenia dla podniesień zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` w czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia podagentów z niej utworzone, kaskadowo obejmując zagnieżdżone dzieci.
- `/subagents kill <id>` zatrzymuje określonego podagenta i kaskadowo zatrzymuje jego dzieci.

## Ograniczenia

- Ogłaszanie podagenta działa na zasadzie **best-effort**. Jeśli Gateway zostanie uruchomiony ponownie, oczekujące zadanie „ogłoś z powrotem” zostanie utracone.
- Podagenci nadal współdzielą te same zasoby procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` zawsze jest nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst podagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana w większości przypadków użycia.
- `maxChildrenPerAgent` ogranicza liczbę aktywnych dzieci na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie przez agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
