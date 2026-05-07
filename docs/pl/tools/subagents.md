---
read_when:
    - Chcesz wykonywać pracę w tle lub równolegle za pomocą agenta
    - Zmieniasz zasady narzędzia sessions_spawn lub narzędzia podagentów
    - Implementujesz lub rozwiązujesz problemy z sesjami subagentów powiązanymi z wątkiem
sidebarTitle: Sub-agents
summary: Uruchamiaj izolowane przebiegi agentów w tle, które przekazują wyniki z powrotem na czat zlecającego
title: Podagenci
x-i18n:
    generated_at: "2026-05-07T13:26:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Subagenci to uruchomienia agentów w tle wywoływane z istniejącego uruchomienia agenta.
Działają we własnej sesji (`agent:<agentId>:subagent:<uuid>`) i
po zakończeniu **ogłaszają** swój wynik z powrotem w kanale czatu
zlecającego. Każde uruchomienie subagenta jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

Główne cele:

- Równoległe wykonywanie pracy typu „badanie / długie zadanie / powolne narzędzie” bez blokowania głównego uruchomienia.
- Domyślna izolacja subagentów (oddzielenie sesji + opcjonalny sandboxing).
- Utrzymanie powierzchni narzędzi trudnej do niewłaściwego użycia: subagenci domyślnie **nie** otrzymują narzędzi sesji.
- Obsługa konfigurowalnej głębokości zagnieżdżania dla wzorców orkiestratora.

<Note>
**Uwaga o kosztach:** każdy subagent domyślnie ma własny kontekst
i własne zużycie tokenów. W przypadku ciężkich lub powtarzalnych zadań ustaw
tańszy model dla subagentów, a głównego agenta pozostaw na modelu wyższej
jakości. Skonfiguruj to przez `agents.defaults.subagents.model` albo nadpisania
dla konkretnego agenta. Gdy proces potomny naprawdę potrzebuje bieżącego
transkryptu zlecającego, agent może zażądać `context: "fork"` dla tego jednego
wywołania. Sesje subagentów powiązane z wątkiem domyślnie używają
`context: "fork"`, ponieważ rozgałęziają bieżącą rozmowę do wątku
uzupełniającego.
</Note>

## Polecenie slash

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

Użyj najwyższego poziomu [`/steer <message>`](/pl/tools/steer), aby sterować aktywnym uruchomieniem bieżącej sesji zlecającego. Użyj `/subagents steer <id|#> <message>`, gdy celem jest uruchomienie potomne.

`/subagents info` pokazuje metadane uruchomienia (status, znaczniki czasu, identyfikator sesji,
ścieżka transkryptu, czyszczenie). Użyj `sessions_history`, aby uzyskać ograniczony,
filtrowany pod kątem bezpieczeństwa widok przywoływania; sprawdź ścieżkę transkryptu na dysku, gdy
potrzebujesz surowego pełnego transkryptu.

### Kontrolki wiązania wątków

Te polecenia działają w kanałach obsługujących trwałe wiązania wątków.
Zobacz [Kanały obsługujące wątki](#thread-supporting-channels) poniżej.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Zachowanie wywołania

`/subagents spawn` uruchamia subagenta w tle jako polecenie użytkownika (nie
wewnętrzne przekazanie) i wysyła jedną końcową aktualizację ukończenia z powrotem do
czatu zlecającego, gdy uruchomienie się zakończy.

<AccordionGroup>
  <Accordion title="Nieblokujące ukończenie oparte na wypychaniu">
    - Polecenie wywołania jest nieblokujące; natychmiast zwraca identyfikator uruchomienia.
    - Po ukończeniu subagent ogłasza wiadomość z podsumowaniem/wynikiem z powrotem w kanale czatu zlecającego.
    - Ukończenie jest oparte na wypychaniu. Po wywołaniu **nie** odpytuj `/subagents list`, `sessions_list` ani `sessions_history` w pętli tylko po to, aby poczekać na zakończenie; sprawdzaj status wyłącznie na żądanie, na potrzeby debugowania lub interwencji.
    - Po ukończeniu OpenClaw w trybie best-effort zamyka śledzone karty przeglądarki/procesy otwarte przez tę sesję subagenta, zanim przepływ czyszczenia ogłoszenia będzie kontynuowany.

  </Accordion>
  <Accordion title="Odporność dostarczania przy ręcznym wywołaniu">
    - OpenClaw przekazuje ukończenia z powrotem do sesji zlecającego przez turę `agent` ze stabilnym kluczem idempotencji.
    - Jeśli uruchomienie zlecającego nadal jest aktywne, OpenClaw najpierw próbuje wybudzić/sterować tym uruchomieniem zamiast rozpoczynać drugą widoczną ścieżkę odpowiedzi.
    - Jeśli przekazanie ukończenia do agenta zlecającego nie powiedzie się albo nie wytworzy widocznych danych wyjściowych, OpenClaw traktuje dostarczenie jako nieudane i przechodzi do routingu kolejki/ponownej próby. Nie wysyła surowego wyniku procesu potomnego bezpośrednio do zewnętrznego czatu.
    - Jeśli bezpośrednie przekazanie nie może zostać użyte, następuje przejście do routingu kolejki.
    - Jeśli routing kolejki nadal nie jest dostępny, ogłoszenie jest ponawiane z krótkim wykładniczym opóźnieniem przed ostatecznym zaniechaniem.
    - Dostarczenie ukończenia zachowuje ustaloną trasę zlecającego: trasy ukończenia powiązane z wątkiem lub rozmową wygrywają, gdy są dostępne; jeśli źródło ukończenia podaje tylko kanał, OpenClaw uzupełnia brakujący cel/konto z ustalonej trasy sesji zlecającego (`lastChannel` / `lastTo` / `lastAccountId`), dzięki czemu bezpośrednie dostarczanie nadal działa.

  </Accordion>
  <Accordion title="Metadane przekazania ukończenia">
    Przekazanie ukończenia do sesji zlecającego to generowany w czasie wykonywania
    wewnętrzny kontekst (nie tekst napisany przez użytkownika), który obejmuje:

    - `Result` — najnowszy widoczny tekst odpowiedzi `assistant`, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult. Końcowo nieudane uruchomienia nie używają ponownie przechwyconego tekstu odpowiedzi.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Kompaktowe statystyki środowiska uruchomieniowego/tokenów.
    - Instrukcję dostarczenia, która mówi agentowi zlecającemu, aby przeredagował treść normalnym głosem asystenta (zamiast przekazywać surowe metadane wewnętrzne).

  </Accordion>
  <Accordion title="Tryby i środowisko uruchomieniowe ACP">
    - `--model` i `--thinking` nadpisują wartości domyślne dla tego konkretnego uruchomienia.
    - Użyj `info`/`log`, aby sprawdzić szczegóły i dane wyjściowe po ukończeniu.
    - `/subagents spawn` działa w trybie jednorazowym (`mode: "run"`). W przypadku trwałych sesji powiązanych z wątkiem użyj `sessions_spawn` z `thread: true` i `mode: "session"`.
    - W przypadku sesji uprzęży ACP (Claude Code, Gemini CLI, OpenCode albo jawne Codex ACP/acpx) użyj `sessions_spawn` z `runtime: "acp"`, gdy narzędzie ogłasza to środowisko uruchomieniowe. Zobacz [model dostarczania ACP](/pl/tools/acp-agents#delivery-model) podczas debugowania ukończeń lub pętli agent-agent. Gdy Plugin `codex` jest włączony, sterowanie czatem/wątkiem Codex powinno preferować `/codex ...` zamiast ACP, chyba że użytkownik jawnie poprosi o ACP/acpx.
    - OpenClaw ukrywa `runtime: "acp"` do czasu włączenia ACP, gdy zlecający nie jest w sandboxie i gdy załadowany jest Plugin backendu taki jak `acpx`. `runtime: "acp"` oczekuje zewnętrznego identyfikatora uprzęży ACP albo wpisu `agents.list[]` z `runtime.type="acp"`; użyj domyślnego środowiska uruchomieniowego subagenta dla zwykłych agentów konfiguracji OpenClaw z `agents_list`.

  </Accordion>
</AccordionGroup>

## Tryby kontekstu

Natywni subagenci startują odizolowani, chyba że wywołujący jawnie poprosi o rozwidlenie
bieżącego transkryptu.

| Tryb       | Kiedy go używać                                                                                                                         | Zachowanie                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Świeże badanie, niezależna implementacja, powolna praca narzędzia albo cokolwiek, co można opisać w tekście zadania                           | Tworzy czysty transkrypt potomny. To wartość domyślna i obniża zużycie tokenów.  |
| `fork`     | Praca zależna od bieżącej rozmowy, wcześniejszych wyników narzędzi lub zniuansowanych instrukcji obecnych już w transkrypcie zlecającego | Rozgałęzia transkrypt zlecającego do sesji potomnej przed uruchomieniem procesu potomnego. |

Używaj `fork` oszczędnie. Służy do delegowania wrażliwego na kontekst, a nie jako
zamiennik napisania jasnego promptu zadania.

## Narzędzie: `sessions_spawn`

Uruchamia subagenta z `deliver: false` w globalnej ścieżce `subagent`,
następnie wykonuje krok ogłoszenia i publikuje odpowiedź ogłoszenia w kanale
czatu zlecającego.

Dostępność zależy od efektywnej polityki narzędzi wywołującego. Profile `coding` i
`full` domyślnie udostępniają `sessions_spawn`. Profil `messaging`
nie udostępnia go; dodaj `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` albo użyj `tools.profile: "coding"` dla agentów, którzy powinni delegować
pracę. Polityki kanału/grupy, dostawcy, sandboxu oraz zezwalania/odmawiania dla konkretnego agenta nadal mogą
usunąć narzędzie po etapie profilu. Użyj `/tools` z tej samej
sesji, aby potwierdzić efektywną listę narzędzi.

**Wartości domyślne:**

- **Model:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.model` (albo `agents.list[].subagents.model` dla konkretnego agenta); jawne `sessions_spawn.model` nadal ma pierwszeństwo.
- **Thinking:** dziedziczy po wywołującym, chyba że ustawisz `agents.defaults.subagents.thinking` (albo `agents.list[].subagents.thinking` dla konkretnego agenta); jawne `sessions_spawn.thinking` nadal ma pierwszeństwo.
- **Limit czasu uruchomienia:** jeśli `sessions_spawn.runTimeoutSeconds` zostanie pominięte, OpenClaw używa `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione; w przeciwnym razie wraca do `0` (bez limitu czasu).

### Parametry narzędzia

<ParamField path="task" type="string" required>
  Opis zadania dla subagenta.
</ParamField>
<ParamField path="label" type="string">
  Opcjonalna etykieta czytelna dla człowieka.
</ParamField>
<ParamField path="agentId" type="string">
  Wywołaj pod innym identyfikatorem agenta, gdy pozwala na to `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` służy wyłącznie do zewnętrznych uprzęży ACP (`claude`, `droid`, `gemini`, `opencode` albo jawnie zażądane Codex ACP/acpx) oraz wpisów `agents.list[]`, których `runtime.type` to `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tylko ACP. Wznawia istniejącą sesję uprzęży ACP, gdy `runtime: "acp"`; ignorowane dla natywnych wywołań subagentów.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Tylko ACP. Strumieniuje dane wyjściowe uruchomienia ACP do sesji nadrzędnej, gdy `runtime: "acp"`; pomiń dla natywnych wywołań subagentów.
</ParamField>
<ParamField path="model" type="string">
  Nadpisuje model subagenta. Nieprawidłowe wartości są pomijane, a subagent działa na modelu domyślnym z ostrzeżeniem w wyniku narzędzia.
</ParamField>
<ParamField path="thinking" type="string">
  Nadpisuje poziom myślenia dla uruchomienia subagenta.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Domyślnie `agents.defaults.subagents.runTimeoutSeconds`, gdy jest ustawione, w przeciwnym razie `0`. Gdy jest ustawione, uruchomienie subagenta zostaje przerwane po N sekundach.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Gdy `true`, żąda powiązania wątku kanału dla tej sesji subagenta.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Jeśli `thread: true`, a `mode` pominięto, wartością domyślną staje się `session`. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` odrzuca wywołanie, chyba że docelowe środowisko uruchomieniowe procesu potomnego działa w sandboxie.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rozgałęzia bieżący transkrypt zlecającego do sesji potomnej. Tylko natywni subagenci. Wywołania powiązane z wątkiem domyślnie używają `fork`; wywołania bez wątku domyślnie używają `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **nie** akceptuje parametrów dostarczania kanałowego (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Do dostarczania użyj
`message`/`sessions_send` z wywołanego uruchomienia.
</Warning>

## Sesje powiązane z wątkiem

Gdy wiązania wątków są włączone dla kanału, subagent może pozostać powiązany
z wątkiem, tak aby kolejne wiadomości użytkownika w tym wątku nadal były kierowane do
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
  <Step title="Uruchom">
    `sessions_spawn` z `thread: true` (i opcjonalnie `mode: "session"`).
  </Step>
  <Step title="Powiąż">
    OpenClaw tworzy lub wiąże wątek z tym celem sesji w aktywnym kanale.
  </Step>
  <Step title="Przekieruj kontynuacje">
    Odpowiedzi i kolejne wiadomości w tym wątku są kierowane do powiązanej sesji.
  </Step>
  <Step title="Sprawdź limity czasu">
    Użyj `/session idle`, aby sprawdzić/zaktualizować automatyczne cofnięcie fokusu po braku aktywności, oraz
    `/session max-age`, aby kontrolować twardy limit.
  </Step>
  <Step title="Odłącz">
    Użyj `/unfocus`, aby odłączyć ręcznie.
  </Step>
</Steps>

### Sterowanie ręczne

| Polecenie          | Efekt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Powiąż bieżący wątek (lub utwórz go) z celem subagenta/sesji          |
| `/unfocus`         | Usuń powiązanie dla bieżącego powiązanego wątku                       |
| `/agents`          | Wyświetl aktywne uruchomienia i stan powiązania (`thread:<id>` lub `unbound`) |
| `/session idle`    | Sprawdź/zaktualizuj automatyczne cofnięcie fokusu po bezczynności (tylko powiązane wątki z fokusem) |
| `/session max-age` | Sprawdź/zaktualizuj twardy limit (tylko powiązane wątki z fokusem)    |

### Przełączniki konfiguracji

- **Globalna wartość domyślna:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Nadpisanie kanału i klucze automatycznego powiązania przy uruchomieniu** są specyficzne dla adaptera. Zobacz [kanały obsługujące wątki](#thread-supporting-channels) powyżej.

Zobacz [referencję konfiguracji](/pl/gateway/configuration-reference) i
[polecenia z ukośnikiem](/pl/tools/slash-commands), aby uzyskać bieżące szczegóły adaptera.

### Lista dozwolonych

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lista identyfikatorów agentów, które mogą być celem przez jawne `agentId` (`["*"]` zezwala na dowolny). Domyślnie: tylko agent wysyłający żądanie. Jeśli ustawisz listę i nadal chcesz, aby agent wysyłający żądanie uruchamiał sam siebie z `agentId`, uwzględnij jego identyfikator na liście.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Domyślna lista dozwolonych agentów docelowych używana, gdy agent wysyłający żądanie nie ustawia własnego `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokuj wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu). Nadpisanie per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Jeśli sesja wysyłająca żądanie działa w piaskownicy, `sessions_spawn` odrzuca cele,
które działałyby bez piaskownicy.

### Wykrywanie

Użyj `agents_list`, aby zobaczyć, które identyfikatory agentów są obecnie dozwolone dla
`sessions_spawn`. Odpowiedź zawiera efektywny model każdego wymienionego agenta
oraz osadzone metadane środowiska uruchomieniowego, dzięki czemu wywołujący mogą odróżnić PI, serwer aplikacji Codex
i inne skonfigurowane natywne środowiska uruchomieniowe.

### Automatyczna archiwizacja

- Sesje subagentów są automatycznie archiwizowane po `agents.defaults.subagents.archiveAfterMinutes` (domyślnie `60`).
- Archiwizacja używa `sessions.delete` i zmienia nazwę transkryptu na `*.deleted.<timestamp>` (ten sam folder).
- `cleanup: "delete"` archiwizuje natychmiast po ogłoszeniu (nadal zachowuje transkrypt przez zmianę nazwy).
- Automatyczna archiwizacja działa na zasadzie najlepszej próby; oczekujące liczniki czasu zostają utracone, jeśli Gateway zostanie uruchomiony ponownie.
- `runTimeoutSeconds` **nie** archiwizuje automatycznie; tylko zatrzymuje uruchomienie. Sesja pozostaje do czasu automatycznej archiwizacji.
- Automatyczna archiwizacja dotyczy tak samo sesji głębokości 1 i głębokości 2.
- Czyszczenie przeglądarki jest oddzielne od czyszczenia archiwum: śledzone karty/procesy przeglądarki są zamykane na zasadzie najlepszej próby po zakończeniu uruchomienia, nawet jeśli rekord transkryptu/sesji zostaje zachowany.

## Zagnieżdżeni subagenci

Domyślnie subagenci nie mogą uruchamiać własnych subagentów
(`maxSpawnDepth: 1`). Ustaw `maxSpawnDepth: 2`, aby włączyć jeden poziom
zagnieżdżenia — **wzorzec orkiestratora**: główny → subagent orkiestrator →
roboczy sub-subagenci.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // zezwól subagentom na uruchamianie dzieci (domyślnie: 1)
        maxChildrenPerAgent: 5, // maks. aktywnych dzieci na sesję agenta (domyślnie: 5)
        maxConcurrent: 8, // globalny limit torów współbieżności (domyślnie: 8)
        runTimeoutSeconds: 900, // domyślny limit czasu dla sessions_spawn, gdy pominięty (0 = brak limitu czasu)
      },
    },
  },
}
```

### Poziomy głębokości

| Głębokość | Kształt klucza sesji                         | Rola                                          | Może uruchamiać?             |
| --------- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0         | `agent:<id>:main`                            | Agent główny                                  | Zawsze                       |
| 1         | `agent:<id>:subagent:<uuid>`                 | Subagent (orkiestrator, gdy dozwolona głębokość 2) | Tylko jeśli `maxSpawnDepth >= 2` |
| 2         | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagent (pracownik liść)                 | Nigdy                        |

### Łańcuch ogłoszeń

Wyniki płyną z powrotem w górę łańcucha:

1. Pracownik głębokości 2 kończy → ogłasza do swojego rodzica (orkiestratora głębokości 1).
2. Orkiestrator głębokości 1 odbiera ogłoszenie, syntetyzuje wyniki, kończy → ogłasza do głównego.
3. Agent główny odbiera ogłoszenie i dostarcza je użytkownikowi.

Każdy poziom widzi tylko ogłoszenia od swoich bezpośrednich dzieci.

<Note>
**Wskazówki operacyjne:** uruchamiaj pracę dzieci raz i czekaj na zdarzenia
ukończenia zamiast budować pętle odpytywania wokół `sessions_list`,
`sessions_history`, `/subagents list` lub poleceń uśpienia `exec`.
`sessions_list` i `/subagents list` utrzymują relacje sesji dzieci
skupione na pracy na żywo — żywe dzieci pozostają dołączone, zakończone dzieci pozostają
widoczne przez krótkie ostatnie okno, a przestarzałe łącza dzieci istniejące tylko w magazynie są
ignorowane po upływie ich okna świeżości. Zapobiega to wskrzeszaniu pozornych dzieci przez stare metadane `spawnedBy` /
`parentSessionKey` po ponownym uruchomieniu. Jeśli zdarzenie ukończenia dziecka dotrze po wysłaniu przez Ciebie
ostatecznej odpowiedzi, właściwą kontynuacją jest dokładny cichy token
`NO_REPLY` / `no_reply`.
</Note>

### Polityka narzędzi według głębokości

- Rola i zakres kontroli są zapisywane w metadanych sesji w momencie uruchomienia. Dzięki temu płaskie lub przywrócone klucze sesji nie odzyskują przypadkowo uprawnień orkiestratora.
- **Głębokość 1 (orkiestrator, gdy `maxSpawnDepth >= 2`):** otrzymuje `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, aby móc zarządzać swoimi dziećmi. Inne narzędzia sesji/systemowe pozostają zabronione.
- **Głębokość 1 (liść, gdy `maxSpawnDepth == 1`):** brak narzędzi sesji (bieżące zachowanie domyślne).
- **Głębokość 2 (pracownik liść):** brak narzędzi sesji — `sessions_spawn` jest zawsze zabronione na głębokości 2. Nie może uruchamiać kolejnych dzieci.

### Limit uruchomień per agent

Każda sesja agenta (na dowolnej głębokości) może mieć jednocześnie najwyżej `maxChildrenPerAgent`
(domyślnie `5`) aktywnych dzieci. Zapobiega to niekontrolowanemu rozgałęzianiu
z pojedynczego orkiestratora.

### Kaskadowe zatrzymanie

Zatrzymanie orkiestratora głębokości 1 automatycznie zatrzymuje wszystkie jego dzieci głębokości 2:

- `/stop` w czacie głównym zatrzymuje wszystkich agentów głębokości 1 i kaskadowo ich dzieci głębokości 2.
- `/subagents kill <id>` zatrzymuje konkretnego subagenta i kaskadowo jego dzieci.
- `/subagents kill all` zatrzymuje wszystkich subagentów dla wysyłającego żądanie i kaskadowo zatrzymuje ich dzieci.

## Uwierzytelnianie

Uwierzytelnianie subagenta jest rozwiązywane według **identyfikatora agenta**, a nie według typu sesji:

- Klucz sesji subagenta to `agent:<agentId>:subagent:<uuid>`.
- Magazyn uwierzytelniania jest ładowany z `agentDir` tego agenta.
- Profile uwierzytelniania agenta głównego są scalane jako **rezerwowe**; profile agenta zastępują profile główne w przypadku konfliktów.

Scalanie jest addytywne, więc profile główne są zawsze dostępne jako
rezerwowe. W pełni izolowane uwierzytelnianie per agent nie jest jeszcze obsługiwane.

## Ogłoszenie

Subagenci zgłaszają się z powrotem przez krok ogłoszenia:

- Krok ogłoszenia działa wewnątrz sesji subagenta (nie w sesji wysyłającej żądanie).
- Jeśli subagent odpowie dokładnie `ANNOUNCE_SKIP`, nic nie zostanie opublikowane.
- Jeśli najnowszy tekst asystenta jest dokładnym cichym tokenem `NO_REPLY` / `no_reply`, wyjście ogłoszenia jest tłumione nawet wtedy, gdy wcześniej istniał widoczny postęp.

Dostarczenie zależy od głębokości wysyłającego żądanie:

- Sesje wysyłające żądanie najwyższego poziomu używają kolejnego wywołania `agent` z dostarczeniem zewnętrznym (`deliver=true`).
- Zagnieżdżone sesje subagentów wysyłające żądanie otrzymują wewnętrzne wstrzyknięcie kontynuacji (`deliver=false`), aby orkiestrator mógł syntetyzować wyniki dzieci w sesji.
- Jeśli zagnieżdżona sesja subagenta wysyłająca żądanie zniknęła, OpenClaw przełącza się awaryjnie na wysyłającego żądanie tej sesji, gdy jest dostępny.

W przypadku sesji wysyłających żądanie najwyższego poziomu bezpośrednie dostarczanie w trybie ukończenia najpierw
rozwiązuje dowolną powiązaną trasę rozmowy/wątku i nadpisanie haka, a następnie uzupełnia
brakujące pola celu kanału z zapisanej trasy sesji wysyłającej żądanie.
Dzięki temu ukończenia pozostają we właściwym czacie/temacie nawet wtedy, gdy źródło ukończenia
identyfikuje tylko kanał.

Agregacja ukończeń dzieci jest ograniczona do bieżącego uruchomienia wysyłającego żądanie podczas
budowania zagnieżdżonych ustaleń ukończenia, co zapobiega wyciekaniu nieaktualnych wyjść dzieci
z wcześniejszych uruchomień do bieżącego ogłoszenia. Odpowiedzi ogłoszeń zachowują
routing wątku/tematu, gdy jest dostępny w adapterach kanałów.

### Kontekst ogłoszenia

Kontekst ogłoszenia jest normalizowany do stabilnego wewnętrznego bloku zdarzenia:

| Pole             | Źródło                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Źródło           | `subagent` lub `cron`                                                                                         |
| Identyfikatory sesji | Klucz/id sesji dziecka                                                                                   |
| Typ              | Typ ogłoszenia + etykieta zadania                                                                             |
| Status           | Wyprowadzony z wyniku środowiska uruchomieniowego (`success`, `error`, `timeout` lub `unknown`) — **nie** wnioskowany z tekstu modelu |
| Treść wyniku     | Najnowszy widoczny tekst asystenta, w przeciwnym razie oczyszczony najnowszy tekst narzędzia/toolResult       |
| Kontynuacja      | Instrukcja opisująca, kiedy odpowiedzieć, a kiedy zachować ciszę                                              |

Końcowe nieudane uruchomienia zgłaszają status niepowodzenia bez ponownego odtwarzania przechwyconego
tekstu odpowiedzi. Po limicie czasu, jeśli dziecko przeszło tylko przez wywołania narzędzi, ogłoszenie
może zwinąć tę historię do krótkiego podsumowania częściowego postępu zamiast
odtwarzać surowe wyjście narzędzi.

### Wiersz statystyk

Ładunki ogłoszeń zawierają na końcu wiersz statystyk (nawet gdy są zawinięte):

- Czas działania (np. `runtime 5m12s`).
- Użycie tokenów (wejście/wyjście/razem).
- Szacowany koszt, gdy skonfigurowano ceny modeli (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` i ścieżka transkryptu, aby agent główny mógł pobrać historię przez `sessions_history` lub sprawdzić plik na dysku.

Metadane wewnętrzne są przeznaczone tylko do orkiestracji; odpowiedzi skierowane do użytkownika
powinny być przepisane normalnym głosem asystenta.

### Dlaczego preferować `sessions_history`

`sessions_history` jest bezpieczniejszą ścieżką orkiestracji:

- Przywołanie asystenta jest najpierw normalizowane: tagi myślenia usuwane; szkielety `<relevant-memories>` / `<relevant_memories>` usuwane; bloki ładunku XML wywołań narzędzi w zwykłym tekście (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) usuwane, w tym ucięte ładunki, które nigdy nie zamykają się poprawnie; obniżone szkielety wywołań/wyników narzędzi i znaczniki kontekstu historycznego usuwane; ujawnione tokeny sterujące modelu (`<|assistant|>`, inne ASCII `<|...|>`, pełnej szerokości `<｜...｜>`) usuwane; zniekształcony XML wywołań narzędzi MiniMax usuwany.
- Tekst przypominający poświadczenia/tokeny jest redagowany.
- Długie bloki mogą być skracane.
- Bardzo duże historie mogą usuwać starsze wiersze lub zastępować nadmiernie duży wiersz tekstem `[sessions_history omitted: message too large]`.
- Surowa inspekcja transkryptu na dysku jest rozwiązaniem awaryjnym, gdy potrzebujesz pełnego transkryptu bajt po bajcie.

## Polityka narzędzi

Subagenci najpierw używają tego samego profilu i potoku zasad narzędzi co agent nadrzędny lub docelowy. Następnie OpenClaw stosuje warstwę ograniczeń subagentów.

Bez restrykcyjnego `tools.profile` subagenci otrzymują **wszystkie narzędzia oprócz narzędzi sesji** i narzędzi systemowych:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` także tutaj pozostaje ograniczonym, oczyszczonym widokiem przywoływania — nie jest surowym zrzutem transkryptu.

Gdy `maxSpawnDepth >= 2`, subagenci-orkiestratorzy na głębokości 1 dodatkowo otrzymują `sessions_spawn`, `subagents`, `sessions_list` oraz `sessions_history`, aby mogli zarządzać swoimi dziećmi.

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

`tools.subagents.tools.allow` jest końcowym filtrem wyłącznie dopuszczającym. Może zawęzić już rozwiązany zestaw narzędzi, ale nie może **dodać z powrotem** narzędzia usuniętego przez `tools.profile`. Na przykład `tools.profile: "coding"` obejmuje `web_search`/`web_fetch`, ale nie narzędzie `browser`. Aby umożliwić subagentom z profilem coding używanie automatyzacji przeglądarki, dodaj browser na etapie profilu:

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

Subagenci używają dedykowanej, działającej w procesie kolejki:

- **Nazwa kolejki:** `subagent`
- **Współbieżność:** `agents.defaults.subagents.maxConcurrent` (domyślnie `8`)

## Żywotność i odzyskiwanie

OpenClaw nie traktuje braku `endedAt` jako trwałego dowodu, że subagent nadal działa. Niezakończone uruchomienia starsze niż okno przedawnionego uruchomienia przestają być liczone jako aktywne/oczekujące w `/subagents list`, podsumowaniach stanu, bramkowaniu zakończenia potomków oraz kontrolach współbieżności dla sesji.

Po ponownym uruchomieniu Gateway przedawnione, niezakończone przywrócone uruchomienia są przycinane, chyba że ich sesja podrzędna jest oznaczona jako `abortedLastRun: true`. Te sesje podrzędne przerwane przez restart pozostają możliwe do odzyskania przez przepływ odzyskiwania osieroconego subagenta, który wysyła syntetyczną wiadomość wznowienia przed wyczyszczeniem znacznika przerwania.

Automatyczne odzyskiwanie po restarcie jest ograniczone dla każdej sesji podrzędnej. Jeśli to samo dziecko subagenta jest wielokrotnie akceptowane do odzyskiwania osieroconego procesu w oknie szybkiego ponownego zakleszczenia, OpenClaw utrwala tombstone odzyskiwania w tej sesji i przestaje automatycznie wznawiać ją po późniejszych restartach. Uruchom `openclaw tasks maintenance --apply`, aby uzgodnić rekord zadania, albo `openclaw doctor --fix`, aby wyczyścić przedawnione flagi przerwanego odzyskiwania w sesjach z tombstone.

<Note>
Jeśli utworzenie subagenta nie powiedzie się z błędem Gateway `PAIRING_REQUIRED` / `scope-upgrade`, sprawdź wywołującego RPC przed edycją stanu parowania. Wewnętrzna koordynacja `sessions_spawn` powinna łączyć się jako `client.id: "gateway-client"` z `client.mode: "backend"` przez bezpośrednie uwierzytelnianie współdzielonym tokenem/hasłem po local loopback; ta ścieżka nie zależy od bazowego zakresu sparowanego urządzenia CLI. Zdalni wywołujący, jawne `deviceIdentity`, jawne ścieżki tokenów urządzeń oraz klienci przeglądarki/node nadal wymagają normalnego zatwierdzenia urządzenia dla podniesienia zakresu.
</Note>

## Zatrzymywanie

- Wysłanie `/stop` w czacie żądającego przerywa sesję żądającego i zatrzymuje wszystkie aktywne uruchomienia subagentów utworzone z niej, kaskadowo obejmując zagnieżdżone dzieci.
- `/subagents kill <id>` zatrzymuje określonego subagenta i kaskadowo zatrzymuje jego dzieci.

## Ograniczenia

- Ogłoszenie subagenta działa w trybie **best-effort**. Jeśli Gateway zostanie ponownie uruchomiony, oczekująca praca „ogłoś z powrotem” zostanie utracona.
- Subagenci nadal współdzielą zasoby tego samego procesu Gateway; traktuj `maxConcurrent` jako zawór bezpieczeństwa.
- `sessions_spawn` jest zawsze nieblokujące: natychmiast zwraca `{ status: "accepted", runId, childSessionKey }`.
- Kontekst subagenta wstrzykuje tylko `AGENTS.md` + `TOOLS.md` (bez `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ani `BOOTSTRAP.md`).
- Maksymalna głębokość zagnieżdżenia wynosi 5 (zakres `maxSpawnDepth`: 1–5). Głębokość 2 jest zalecana w większości przypadków użycia.
- `maxChildrenPerAgent` ogranicza aktywne dzieci na sesję (domyślnie `5`, zakres `1–20`).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents)
- [Wysyłanie do agenta](/pl/tools/agent-send)
- [Zadania w tle](/pl/automation/tasks)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
