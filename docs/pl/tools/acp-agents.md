---
read_when:
    - Uruchamianie środowisk programistycznych przez ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją w kanałach komunikatorów
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, podłączeniem Plugin lub dostarczaniem ukończeń
    - Obsługa poleceń /acp z czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne środowiska kodowania (Claude Code, Cursor, Gemini CLI, jawny Codex ACP, OpenClaw ACP, OpenCode) przez backend ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-30T10:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
pozwalają OpenClaw uruchamiać zewnętrzne środowiska kodowania (na przykład Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI i inne
obsługiwane środowiska ACPX) przez backendowy Plugin ACP.

Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

<Note>
**ACP to ścieżka zewnętrznego środowiska, a nie domyślna ścieżka Codex.** Natywny
Plugin serwera aplikacji Codex odpowiada za kontrolki `/codex ...` oraz
osadzone środowisko wykonawcze `agentRuntime.id: "codex"`; ACP odpowiada za
kontrolki `/acp ...` oraz sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code połączył się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                         | Użyj tego                            | Uwagi                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać lub kontrolować Codex w bieżącej konwersacji                                            | `/codex bind`, `/codex threads`      | Natywna ścieżka serwera aplikacji Codex, gdy Plugin `codex` jest włączony; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/tryb szybki/uprawnienia, zatrzymanie i kontrolki sterowania. ACP jest jawną ścieżką awaryjną |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inne zewnętrzne środowisko _przez_ OpenClaw | Ta strona                            | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska wykonawczego                                                                            |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta                      | [`openclaw acp`](/pl/cli/acp)           | Tryb mostu. IDE/klient komunikuje się przez ACP z OpenClaw po stdio/WebSocket                                                                                                                            |
| Ponownie użyć lokalnego AI CLI jako tekstowego modelu awaryjnego                                 | [Backendy CLI](/pl/gateway/cli-backends) | To nie jest ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak środowiska wykonawczego                                                                                                                |

## Czy to działa od razu po instalacji?

Zazwyczaj tak. Świeże instalacje dostarczają włączony domyślnie dołączony Plugin środowiska wykonawczego `acpx`
z przypiętym lokalnie do Pluginu binarium `acpx`, które OpenClaw wykrywa
i samonaprawia przy uruchomieniu. Uruchom `/acp doctor`, aby sprawdzić gotowość.

OpenClaw informuje agentów o uruchamianiu ACP tylko wtedy, gdy ACP jest **rzeczywiście
użyteczne**: ACP musi być włączone, wysyłanie zadań nie może być wyłączone, bieżąca
sesja nie może być zablokowana przez piaskownicę, a backend środowiska wykonawczego musi być
załadowany. Jeśli te warunki nie są spełnione, Skills Pluginu ACP i wskazówki
`sessions_spawn` dotyczące ACP pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Typowe problemy przy pierwszym uruchomieniu">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny spis Pluginów i **musi** zawierać `acpx`; w przeciwnym razie dołączona wartość domyślna jest celowo blokowana, a `/acp doctor` zgłasza brakujący wpis na liście dozwolonych.
    - Dołączony adapter Codex ACP jest przygotowywany z Pluginem `acpx` i uruchamiany lokalnie, gdy to możliwe.
    - Inne adaptery docelowych środowisk mogą nadal być pobierane na żądanie za pomocą `npx` przy pierwszym użyciu.
    - Uwierzytelnienie dostawcy nadal musi istnieć na hoście dla tego środowiska.
    - Jeśli host nie ma npm ani dostępu do sieci, pierwsze pobrania adapterów nie powiodą się, dopóki pamięci podręczne nie zostaną wstępnie rozgrzane lub adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska wykonawczego">
    ACP uruchamia rzeczywisty proces zewnętrznego środowiska. OpenClaw odpowiada za routing,
    stan zadań w tle, dostarczanie, powiązania i zasady; środowisko
    odpowiada za logowanie do dostawcy, katalog modeli, zachowanie systemu plików i
    natywne narzędzia.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony i sprawny backend.
    - Identyfikator docelowy jest dozwolony przez `acp.allowedAgents`, gdy ta lista dozwolonych jest ustawiona.
    - Polecenie środowiska może uruchomić się na hoście Gateway.
    - Uwierzytelnienie dostawcy jest dostępne dla tego środowiska (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego środowiska — identyfikatory modeli nie są przenośne między środowiskami.
    - Żądany `cwd` istnieje i jest dostępny albo pomiń `cwd` i pozwól backendowi użyć wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów o uprawnienia, więc uruchomienia kodowania intensywnie zapisujące/wykonujące polecenia zwykle potrzebują profilu uprawnień ACPX, który może działać bezobsługowo.

  </Accordion>
</AccordionGroup>

Narzędzia Pluginów OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie udostępniane
środowiskom ACP. Włącz jawne mosty MCP w
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup) tylko wtedy, gdy środowisko
ma bezpośrednio wywoływać te narzędzia.

## Obsługiwane cele środowisk

Z dołączonym backendem `acpx` używaj tych identyfikatorów środowisk jako celów `/acp spawn <id>`
lub `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator środowiska | Typowy backend                               | Uwagi                                                                                       |
| ------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `claude`                 | Adapter Claude Code ACP                       | Wymaga uwierzytelnienia Claude Code na hoście.                                               |
| `codex`                  | Adapter Codex ACP                             | Jawna ścieżka awaryjna ACP tylko wtedy, gdy natywne `/codex` jest niedostępne lub zażądano ACP. |
| `copilot`                | Adapter GitHub Copilot ACP                    | Wymaga uwierzytelnienia Copilot CLI/środowiska wykonawczego.                                 |
| `cursor`                 | Cursor CLI ACP (`cursor-agent acp`)           | Nadpisz polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP.          |
| `droid`                  | Factory Droid CLI                             | Wymaga uwierzytelnienia Factory/Droid lub `FACTORY_API_KEY` w środowisku środowiska.         |
| `gemini`                 | Adapter Gemini CLI ACP                        | Wymaga uwierzytelnienia Gemini CLI lub konfiguracji klucza API.                              |
| `iflow`                  | iFlow CLI                                     | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                         |
| `kilocode`               | Kilo Code CLI                                 | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                         |
| `kimi`                   | Kimi/Moonshot CLI                             | Wymaga uwierzytelnienia Kimi/Moonshot na hoście.                                             |
| `kiro`                   | Kiro CLI                                      | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                         |
| `opencode`               | Adapter OpenCode ACP                          | Wymaga uwierzytelnienia OpenCode CLI/dostawcy.                                               |
| `openclaw`               | Most OpenClaw Gateway przez `openclaw acp`    | Pozwala środowisku obsługującemu ACP komunikować się z powrotem z sesją OpenClaw Gateway.    |
| `pi`                     | Pi/osadzone środowisko wykonawcze OpenClaw    | Używane do eksperymentów ze środowiskami natywnymi dla OpenClaw.                             |
| `qwen`                   | Qwen Code / Qwen CLI                          | Wymaga uwierzytelnienia zgodnego z Qwen na hoście.                                           |

Niestandardowe aliasy agentów acpx można konfigurować w samym acpx, ale zasady OpenClaw
nadal sprawdzają `acp.allowedAgents` oraz każde mapowanie
`agents.list[].runtime.acp.agent` przed wysłaniem.

## Runbook operatora

Szybki przepływ `/acp` z czatu:

<Steps>
  <Step title="Uruchomienie">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` lub jawne
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Praca">
    Kontynuuj w powiązanej konwersacji lub wątku (albo jawnie wskaż klucz sesji).
  </Step>
  <Step title="Sprawdzenie stanu">
    `/acp status`
  </Step>
  <Step title="Dostrajanie">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Sterowanie">
    Bez zastępowania kontekstu: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Zatrzymanie">
    `/acp cancel` (bieżąca tura) lub `/acp close` (sesja + powiązania).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Szczegóły cyklu życia">
    - Uruchomienie tworzy lub wznawia sesję środowiska wykonawczego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy uruchomienie jest własnością rodzica.
    - Sesje ACP będące własnością rodzica są traktowane jako praca w tle nawet wtedy, gdy sesja środowiska wykonawczego jest trwała; ukończenie i dostarczanie między powierzchniami przechodzą przez powiadamiacz zadania nadrzędnego, zamiast działać jak zwykła sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka zakończone lub osierocone jednorazowe sesje ACP będące własnością rodzica. Trwałe sesje ACP są zachowywane, dopóki istnieje aktywne powiązanie konwersacji; przestarzałe trwałe sesje bez aktywnego powiązania są zamykane, aby nie mogły zostać po cichu wznowione po zakończeniu zadania właściciela lub usunięciu jego rekordu zadania.
    - Powiązane wiadomości uzupełniające trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, odfokusowane, zresetowane lub nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako zwykły tekst promptu do powiązanego środowiska ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Środowisko może nadal zachować własną historię upstream, jeśli obsługuje wznawianie.
    - Bezczynni pracownicy środowiska wykonawczego kwalifikują się do czyszczenia po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Reguły routingu natywnego Codex">
    Wyzwalacze w języku naturalnym, które powinny kierować do **natywnego Pluginu Codex**,
    gdy jest on włączony:

    - "Powiąż ten kanał Discord z Codex."
    - "Dołącz ten czat do wątku Codex `<id>`."
    - "Pokaż wątki Codex, a następnie powiąż ten."

    Natywne powiązanie konwersacji Codex jest domyślną ścieżką kontroli czatu.
    Dynamiczne narzędzia OpenClaw nadal wykonują się przez OpenClaw, podczas gdy
    narzędzia natywne dla Codex, takie jak shell/apply-patch, wykonują się wewnątrz Codex.
    Dla zdarzeń narzędzi natywnych dla Codex OpenClaw wstrzykuje natywny
    przekaźnik hooków dla każdej tury, aby hooki Pluginów mogły blokować `before_tool_call`, obserwować
    `after_tool_call` i kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie Pluginy mogą zażądać jeszcze jednego
    przebiegu modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów narzędzi natywnych dla Codex
    ani nie przepisuje rekordów wątków Codex. Używaj jawnego ACP tylko
    wtedy, gdy potrzebujesz modelu środowiska wykonawczego/sesji ACP. Granica obsługi osadzonego Codex
    jest udokumentowana w
    [kontrakcie obsługi środowiska Codex v1](/pl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Ściągawka wyboru modelu / dostawcy / środowiska uruchomieniowego">
    - `openai-codex/*` — trasa PI Codex OAuth/subskrypcji.
    - `openai/*` plus `agentRuntime.id: "codex"` — natywne wbudowane środowisko uruchomieniowe Codex serwera aplikacji.
    - `/codex ...` — natywne sterowanie konwersacją Codex.
    - `/acp ...` lub `runtime: "acp"` — jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze routingu ACP w języku naturalnym">
    Wyzwalacze, które powinny kierować do środowiska uruchomieniowego ACP:

    - „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik.”
    - „Użyj Gemini CLI do tego zadania w wątku, a następnie utrzymuj dalsze odpowiedzi w tym samym wątku.”
    - „Uruchom Codex przez ACP w wątku w tle.”

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje harness `agentId`,
    wiąże z bieżącą konwersacją lub wątkiem, gdy jest to obsługiwane, i
    kieruje dalsze odpowiedzi do tej sesji aż do zamknięcia/wygaśnięcia. Codex
    podąża tą ścieżką tylko wtedy, gdy ACP/acpx jest jawne albo natywny Plugin
    Codex jest niedostępny dla żądanej operacji.

    Dla `sessions_spawn` wartość `runtime: "acp"` jest ogłaszana tylko wtedy, gdy ACP
    jest włączone, żądający nie działa w piaskownicy, a backend środowiska uruchomieniowego
    ACP jest załadowany. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    wysyłanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych
    wywołań `sessions_spawn({ runtime: "acp" })`. Celuje w identyfikatory harness ACP, takie jak `codex`,
    `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
    identyfikatora agenta konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
    jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
    w przeciwnym razie użyj domyślnego środowiska uruchomieniowego podagenta. Gdy agent OpenClaw
    jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
    `runtime.acp.agent` jako bazowego identyfikatora harness.

  </Accordion>
</AccordionGroup>

## ACP a podagenci

Użyj ACP, gdy chcesz zewnętrzne środowisko uruchomieniowe harness. Użyj **natywnego
serwera aplikacji Codex** do wiązania/sterowania konwersacją Codex, gdy Plugin `codex`
jest włączony. Użyj **podagentów**, gdy chcesz natywne dla OpenClaw
delegowane uruchomienia.

| Obszar           | Sesja ACP                              | Uruchomienie podagenta              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko uruchomieniowe | Plugin backendu ACP (na przykład acpx) | Natywne środowisko uruchomieniowe podagentów OpenClaw |
| Klucz sesji    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko uruchomieniowe) |

Zobacz także [Podagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda tak:

1. Płaszczyzna sterowania sesją ACP OpenClaw.
2. Dołączony Plugin środowiska uruchomieniowego `acpx`.
3. Adapter Claude ACP.
4. Mechanizmy środowiska uruchomieniowego/sesji po stronie Claude.

ACP Claude to **sesja harness** z kontrolkami ACP, wznawianiem sesji,
śledzeniem zadań w tle oraz opcjonalnym wiązaniem konwersacji/wątku.

Backendy CLI to oddzielne lokalne awaryjne środowiska uruchomieniowe tylko tekstowe — zobacz
[Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada brzmi:

- **Chcesz `/acp spawn`, sesji możliwych do związania, kontroli środowiska uruchomieniowego lub trwałej pracy harness?** Użyj ACP.
- **Chcesz prostego lokalnego awaryjnego trybu tekstowego przez surowe CLI?** Użyj backendów CLI.

## Związane sesje

### Model mentalny

- **Powierzchnia czatu** — miejsce, w którym ludzie kontynuują rozmowę (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** — trwały stan środowiska uruchomieniowego Codex/Claude/Gemini, do którego kieruje OpenClaw.
- **Wątek/temat podrzędny** — opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`.
- **Obszar roboczy środowiska uruchomieniowego** — lokalizacja systemu plików (`cwd`, checkout repozytorium, obszar roboczy backendu), w której działa harness. Niezależna od powierzchni czatu.

### Wiązania bieżącej konwersacji

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do
uruchomionej sesji ACP — bez wątku podrzędnego, ta sama powierzchnia czatu. OpenClaw nadal
zarządza transportem, autoryzacją, bezpieczeństwem i dostarczaniem. Kolejne wiadomości w tej
konwersacji trafiają do tej samej sesji; `/new` i `/reset` resetują
sesję w miejscu; `/acp close` usuwa wiązanie.

Przykłady:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reguły wiązania i wyłączność">
    - `--bind here` i `--thread ...` wzajemnie się wykluczają.
    - `--bind here` działa tylko na kanałach, które ogłaszają wiązanie bieżącej konwersacji; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Wiązania utrzymują się po restartach Gateway.
    - W Discord `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć wątek podrzędny dla `--thread auto|here` — nie dla `--bind here`.
    - Jeśli uruchamiasz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **agenta docelowego**. Brakujące odziedziczone ścieżki (`ENOENT`/`ENOTDIR`) cofają się do domyślnej wartości backendu; inne błędy dostępu (np. `EACCES`) pojawiają się jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w związanych konwersacjach — polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst dalszej odpowiedzi trafia do związanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje związane z wątkiem">
    Gdy wiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Kolejne wiadomości w tym wątku trafiają do związanej sesji ACP.
    - Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
    - Unfocus/zamknięcie/archiwizacja/limit bezczynności albo wygaśnięcie maksymalnego wieku usuwa wiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` to polecenia Gateway, a nie prompty do harness ACP.

    Wymagane flagi funkcji dla ACP związanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne wysyłanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Włączona flaga uruchamiania wątku ACP adaptera kanału (specyficzna dla adaptera):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Obsługa wiązania wątku jest specyficzna dla adaptera. Jeśli aktywny adapter
    kanału nie obsługuje wiązań wątków, OpenClaw zwraca jasny
    komunikat o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału, który udostępnia funkcję wiązania sesji/wątku.
    - Bieżąca wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy DM).
    - Kanały Plugin mogą dodać obsługę przez ten sam interfejs wiązania.

  </Accordion>
</AccordionGroup>

## Trwałe wiązania kanałów

Dla nieulotnych przepływów pracy skonfiguruj trwałe wiązania ACP we
wpisach najwyższego poziomu `bindings[]`.

### Model wiązania

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe wiązanie konwersacji ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje konwersację docelową. Kształty zależne od kanału:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych wiązań grup.
- **DM/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` dla stabilnych wiązań grup.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Identyfikator agenta właścicielskiego OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Opcjonalne nadpisanie ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Opcjonalna etykieta widoczna dla operatora.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Opcjonalny katalog roboczy środowiska uruchomieniowego.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Opcjonalne nadpisanie backendu.
</ParamField>

### Domyślne wartości środowiska uruchomieniowego dla agenta

Użyj `agents.list[].runtime`, aby jednorazowo zdefiniować domyślne wartości ACP dla agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harness, np. `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Pierwszeństwo nadpisywania dla związanych sesji ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Globalne domyślne wartości ACP (np. `acp.backend`)

### Przykład

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Zachowanie

- OpenClaw upewnia się, że skonfigurowana sesja ACP istnieje przed użyciem.
- Wiadomości w tym kanale lub temacie trafiają do skonfigurowanej sesji ACP.
- W związanych konwersacjach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe wiązania środowiska uruchomieniowego (na przykład utworzone przez przepływy ustawiania fokusu wątku) nadal obowiązują tam, gdzie występują.
- Przy uruchomieniach ACP między agentami bez jawnego `cwd` OpenClaw dziedziczy obszar roboczy agenta docelowego z konfiguracji agenta.
- Brakujące odziedziczone ścieżki obszaru roboczego cofają się do domyślnego cwd backendu; niebrakujące błędy dostępu pojawiają się jako błędy uruchomienia.

## Uruchamianie sesji ACP

Dwa sposoby uruchomienia sesji ACP:

<Tabs>
  <Tab title="Z sessions_spawn">
    Użyj `runtime: "acp"`, aby uruchomić sesję ACP z tury agenta lub
    wywołania narzędzia.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` domyślnie ma wartość `subagent`, więc ustaw `runtime: "acp"` jawnie
    dla sesji ACP. Jeśli `agentId` zostanie pominięte, OpenClaw użyje
    `acp.defaultAgent`, gdy jest skonfigurowane. `mode: "session"` wymaga
    `thread: true`, aby utrzymać trwałą powiązaną konwersację.
    </Note>

  </Tab>
  <Tab title="Z polecenia /acp">
    Użyj `/acp spawn`, aby uzyskać jawną kontrolę operatora z czatu.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Kluczowe flagi:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Zobacz [Polecenia z ukośnikiem](/pl/tools/slash-commands).

  </Tab>
</Tabs>

### Parametry `sessions_spawn`

<ParamField path="task" type="string" required>
  Początkowy prompt wysyłany do sesji ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Musi mieć wartość `"acp"` dla sesji ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Identyfikator docelowego harnessu ACP. Wraca do `acp.defaultAgent`, jeśli jest ustawione.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Żąda przepływu wiązania wątku tam, gdzie jest obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` jest jednorazowe; `"session"` jest trwałe. Jeśli `thread: true`, a
  `mode` zostanie pominięte, OpenClaw może domyślnie wybrać zachowanie trwałe zgodnie ze
  ścieżką runtime. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy runtime (sprawdzany przez politykę backendu/runtime).
  Jeśli zostanie pominięty, spawn ACP dziedziczy obszar roboczy agenta docelowego,
  gdy jest skonfigurowany; brakujące odziedziczone ścieżki wracają do wartości
  domyślnych backendu, natomiast rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza
  historię konwersacji przez `session/load`. Wymaga `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` strumieniuje początkowe podsumowania postępu uruchomienia ACP z powrotem do
  sesji żądającej jako zdarzenia systemowe. Akceptowane odpowiedzi obejmują
  `streamLogPath` wskazujące na dziennik JSONL o zakresie sesji
  (`<sessionId>.acp-stream.jsonl`), który możesz śledzić, aby zobaczyć pełną historię przekazywania.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Przerywa turę podrzędną ACP po N sekundach. `0` utrzymuje turę na
  ścieżce Gateway bez limitu czasu. Ta sama wartość jest stosowana do uruchomienia Gateway
  i runtime ACP, aby zablokowane lub wyczerpane kwotą harnessy nie
  zajmowały ścieżki agenta nadrzędnego bezterminowo.
</ParamField>
<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla podrzędnej sesji ACP. Spawny ACP Codex
  normalizują referencje Codex OpenClaw, takie jak `openai-codex/gpt-5.4`, do konfiguracji
  startowej ACP Codex przed `session/new`; formy ukośnikowe, takie jak
  `openai-codex/gpt-5.4/high`, ustawiają także effort rozumowania ACP Codex.
  Inne harnessy muszą ogłaszać ACP `models` i obsługiwać
  `session/set_model`; w przeciwnym razie OpenClaw/acpx zawodzi jasno zamiast
  po cichu wracać do domyślnego agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny effort myślenia/rozumowania. Dla ACP Codex `minimal` mapuje się na
  niski effort, `low`/`medium`/`high`/`xhigh` mapują się bezpośrednio, a `off`
  pomija startowe nadpisanie reasoning-effort.
</ParamField>

## Tryby wiązania spawnu i wątku

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Powiąż bieżącą aktywną konwersację w miejscu; niepowodzenie, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz powiązania z bieżącą konwersacją.                          |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „uczyń ten kanał lub czat obsługiwanym przez Codex”.
    - `--bind here` nie tworzy wątku podrzędnego.
    - `--bind here` jest dostępne tylko na kanałach, które udostępniają obsługę wiązania bieżącej konwersacji.
    - `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek podrzędny, gdy jest obsługiwany. |
    | `here` | Wymagaj bieżącego aktywnego wątku; niepowodzenie, jeśli nie jesteś w żadnym.                                                  |
    | `off`  | Bez wiązania. Sesja uruchamia się jako niepowiązana.                                                                 |

    Uwagi:

    - Na powierzchniach bez wiązania wątków domyślne zachowanie jest w praktyce `off`.
    - Spawn powiązany z wątkiem wymaga obsługi w polityce kanału:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Użyj `--bind here`, gdy chcesz przypiąć bieżącą konwersację bez tworzenia wątku podrzędnego.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą być interaktywnymi obszarami roboczymi albo pracą w tle
należącą do rodzica. Ścieżka dostarczania zależy od tej postaci.

<AccordionGroup>
  <Accordion title="Interaktywne sesje ACP">
    Sesje interaktywne służą do kontynuowania rozmowy na widocznej
    powierzchni czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą konwersację z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwale skonfigurowane `bindings[].type="acp"` kierują pasujące konwersacje do tej samej sesji ACP.

    Wiadomości uzupełniające w powiązanej konwersacji trafiają bezpośrednio do
    sesji ACP, a wynik ACP jest dostarczany z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do harnessu:

    - Zwykłe powiązane wiadomości uzupełniające są wysyłane jako tekst promptu oraz załączniki tylko wtedy, gdy harness/backend je obsługuje.
    - Polecenia zarządzania `/acp` i lokalne polecenia Gateway są przechwytywane przed wysyłką do ACP.
    - Zdarzenia ukończenia generowane przez runtime są materializowane dla każdego celu. Agenty OpenClaw otrzymują wewnętrzną kopertę kontekstu runtime OpenClaw; zewnętrzne harnessy ACP otrzymują zwykły prompt z wynikiem dziecka i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych harnessów ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają widocznego dla użytkownika tekstu wyzwalacza lub zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają ustrukturyzowane w OpenClaw tam, gdzie to możliwe, i nie są traktowane jako treść czatu autorstwa użytkownika.

  </Accordion>
  <Accordion title="Jednorazowe sesje ACP należące do rodzica">
    Jednorazowe sesje ACP spawnowane przez uruchomienie innego agenta działają jako
    dzieci w tle, podobnie jak pod-agenty:

    - Rodzic prosi o pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Dziecko działa we własnej sesji harnessu ACP.
    - Tury dziecka działają na tej samej ścieżce w tle, której używają natywne spawny pod-agentów, więc wolny harness ACP nie blokuje niepowiązanej pracy sesji głównej.
    - Raport ukończenia wraca przez ścieżkę ogłaszania ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia na zwykły prompt ACP przed wysłaniem go do zewnętrznego harnessu, dzięki czemu harnessy nie widzą markerów kontekstu runtime dostępnych tylko dla OpenClaw.
    - Rodzic przepisuje wynik dziecka normalnym głosem asystenta, gdy przydatna jest odpowiedź widoczna dla użytkownika.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między rodzicem
    a dzieckiem. Dziecko ma już kanał ukończenia z powrotem do
    rodzica.

  </Accordion>
  <Accordion title="sessions_send i dostarczanie A2A">
    `sessions_send` może celować w inną sesję po spawnie. Dla zwykłych
    sesji równorzędnych OpenClaw używa ścieżki uzupełniającej agent-do-agenta (A2A)
    po wstrzyknięciu wiadomości:

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól żądającemu i celowi wymienić ograniczoną liczbę tur uzupełniających.
    - Poproś cel o wygenerowanie komunikatu ogłoszenia.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest fallbackiem dla wysyłek równorzędnych, w których nadawca potrzebuje
    widocznej odpowiedzi uzupełniającej. Pozostaje włączona, gdy niepowiązana sesja może
    zobaczyć cel ACP i wysłać do niego wiadomość, na przykład przy szerokich
    ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija uzupełnienie A2A tylko wtedy, gdy żądający jest
    rodzicem własnego jednorazowego dziecka ACP należącego do rodzica. W takim przypadku
    uruchomienie A2A na szczycie ukończenia zadania może obudzić rodzica z
    wynikiem dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i
    utworzyć pętlę echa rodzic/dziecko. Wynik `sessions_send` zgłasza
    `delivery.status="skipped"` dla tego przypadku własnego dziecka, ponieważ
    ścieżka ukończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Wznów istniejącą sesję">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    zaczynać od nowa. Agent odtwarza historię konwersacji przez
    `session/load`, więc wznawia z pełnym kontekstem tego, co było wcześniej.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe przypadki użycia:

    - Przekaż sesję Codex z laptopa na telefon — powiedz agentowi, aby kontynuował od miejsca, w którym skończyłeś.
    - Kontynuuj sesję kodowania rozpoczętą interaktywnie w CLI, teraz bez interfejsu przez swojego agenta.
    - Wznów pracę przerwaną przez restart gatewaya lub limit czasu bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślny runtime pod-agenta ignoruje to pole tylko dla ACP.
    - `streamTo` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślny runtime pod-agenta ignoruje to pole tylko dla ACP.
    - `resumeSessionId` to lokalny dla hosta identyfikator wznowienia ACP/harnessu, a nie klucz sesji kanału OpenClaw; OpenClaw nadal sprawdza politykę spawnu ACP i politykę agenta docelowego przed wysyłką, natomiast backend lub harness ACP odpowiada za autoryzację wczytania tego upstreamowego identyfikatora.
    - `resumeSessionId` przywraca upstreamową historię konwersacji ACP; `thread` i `mode` nadal stosują się normalnie do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, spawn kończy się jasnym błędem — bez cichego fallbacku do nowej sesji.

  </Accordion>
  <Accordion title="Smoke test po wdrożeniu">
    Po wdrożeniu gatewaya uruchom żywy test end-to-end zamiast
    ufać testom jednostkowym:

    1. Zweryfikuj wdrożoną wersję gatewaya i commit na hoście docelowym.
    2. Otwórz tymczasową sesję mostu ACPX do żywego agenta.
    3. Poproś tego agenta, aby wywołał `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` oraz zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywisty `childSessionKey` i brak błędu walidatora.
    5. Posprzątaj tymczasową sesję mostu.

    Utrzymaj bramkę na `mode: "run"` i pomiń `streamTo: "parent"` —
    `mode: "session"` powiązane z wątkiem oraz ścieżki przekazywania strumienia to osobne,
    bogatsze przebiegi integracyjne.

  </Accordion>
</AccordionGroup>

## Zgodność sandboxa

Sesje ACP obecnie działają na runtime hosta, **nie** wewnątrz
sandboxa OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzny harness może odczytywać/zapisywać zgodnie z własnymi uprawnieniami CLI i wybranym `cwd`.
- Zasady piaskownicy OpenClaw **nie** obejmują wykonania ACP harness.
- OpenClaw nadal egzekwuje bramki funkcji ACP, dozwolonych agentów, własność sesji, powiązania kanałów i zasady dostarczania Gateway.
- Użyj `runtime: "subagent"` do natywnej pracy OpenClaw egzekwowanej przez piaskownicę.

</Warning>

Obecne ograniczenia:

- Jeśli sesja zgłaszającego działa w piaskownicy, uruchamianie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozwiązywanie celu sesji

Większość akcji `/acp` przyjmuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozwiązywania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - próbuje klucza
   - następnie identyfikatora sesji w formacie UUID
   - następnie etykiety
2. Powiązanie bieżącego wątku (jeśli ta konwersacja/wątek jest powiązana z sesją ACP).
3. Fallback do bieżącej sesji zgłaszającego.

Powiązania bieżącej konwersacji i powiązania wątków uczestniczą w
kroku 2.

Jeśli nie uda się rozwiązać żadnego celu, OpenClaw zwraca czytelny błąd
(`Unable to resolve session target: ...`).

## Polecenia sterujące ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje trwającą turę dla sesji docelowej.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązania celów wątku.              | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje runtime i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb runtime dla sesji docelowej.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Ogólny zapis opcji konfiguracji runtime.                  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego runtime.            | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil zasad zatwierdzania.                       | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu runtime (w sekundach).                | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu runtime.                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji runtime sesji.                     | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                  | `/acp sessions`                                               |
| `/acp doctor`        | Stan backendu, możliwości, wykonalne poprawki.            | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączenia.   | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje runtime oraz identyfikatory sesji
na poziomie runtime i backendu. Błędy nieobsługiwanych poleceń sterujących są wyświetlane
czytelnie, gdy backend nie ma danej możliwości. `/acp sessions` odczytuje
magazyn dla bieżącej powiązanej sesji lub sesji zgłaszającego; tokeny celu
(`session-key`, `session-id` lub `session-label`) są rozwiązywane przez
odkrywanie sesji Gateway, w tym niestandardowe katalogi główne `session.store`
dla poszczególnych agentów.

### Mapowanie opcji runtime

`/acp` ma polecenia pomocnicze i ogólny setter. Równoważne
operacje:

| Polecenie                    | Mapuje na                            | Uwagi                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | klucz konfiguracji runtime `model`   | Dla Codex ACP OpenClaw normalizuje `openai-codex/<model>` do identyfikatora modelu adaptera i mapuje sufiksy reasoning po ukośniku, takie jak `openai-codex/gpt-5.4/high`, na `reasoning_effort`. |
| `/acp set thinking <level>`  | klucz konfiguracji runtime `thinking` | Dla Codex ACP OpenClaw wysyła odpowiednie `reasoning_effort`, jeśli adapter je obsługuje.                                                                                      |
| `/acp permissions <profile>` | klucz konfiguracji runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | klucz konfiguracji runtime `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | nadpisanie cwd runtime               | Bezpośrednia aktualizacja.                                                                                                                                                     |
| `/acp set <key> <value>`     | ogólne                               | `key=cwd` używa ścieżki nadpisania cwd.                                                                                                                                       |
| `/acp reset-options`         | czyści wszystkie nadpisania runtime  | —                                                                                                                                                                              |

## acpx harness, konfiguracja Plugin i uprawnienia

Informacje o konfiguracji acpx harness (aliasy Claude Code / Codex / Gemini CLI),
mostkach MCP plugin-tools i OpenClaw-tools oraz trybach
uprawnień ACP znajdziesz w
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                                                                              | Naprawa                                                                                                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Brakuje Plugin backendu, jest wyłączony albo zablokowany przez `plugins.allow`.                                                      | Zainstaluj i włącz Plugin backendu, uwzględnij `acpx` w `plugins.allow`, gdy ta lista dozwolonych jest ustawiona, a następnie uruchom `/acp doctor`.                                             |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                                                                        | Ustaw `acp.enabled=true`.                                                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatyczne dispatchowanie ze zwykłych wiadomości wątku jest wyłączone.                                                             | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne kierowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają.                                               |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na liście dozwolonych.                                                                                        | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                                                  |
| `/acp doctor` reports backend not ready right after startup                 | Sonda zależności Plugin lub samonaprawa nadal działa.                                                                                | Poczekaj chwilę i uruchom ponownie `/acp doctor`; jeśli stan pozostanie nieprawidłowy, sprawdź błąd instalacji backendu oraz zasady zezwalania/odmawiania Plugin.                                |
| Harness command not found                                                   | CLI adaptera nie jest zainstalowane, brakuje zależności przygotowanego Plugin albo pierwsze pobranie `npx` nie powiodło się dla adaptera innego niż Codex. | Uruchom `/acp doctor`, napraw zależności Plugin, zainstaluj lub wstępnie rozgrzej adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx.                                        |
| Model-not-found from the harness                                            | Identyfikator modelu jest prawidłowy dla innego dostawcy/harnessa, ale nie dla tego celu ACP.                                        | Użyj modelu wymienionego przez ten harness, skonfiguruj model w harnessie albo pomiń nadpisanie.                                                                                                  |
| Vendor auth error from the harness                                          | OpenClaw działa prawidłowo, ale docelowe CLI/dostawca nie jest zalogowany.                                                           | Zaloguj się albo podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                                                        |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy klucz/id/token etykiety.                                                                                               | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie.                                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej rozmowy, którą można powiązać.                                                                      | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj spawnowania bez powiązania.                                                                                                      |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową.                                                                          | Użyj `/acp spawn ... --thread ...`, gdzie jest to obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                                                 |
| `--thread here requires running /acp spawn inside an active ... thread`     | Użyto `--thread here` poza kontekstem wątku.                                                                                         | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                                                         | Ponownie powiąż jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                                                |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązania wątku.                                                                                          | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                                                |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP działa po stronie hosta; sesja żądająca działa w piaskownicy.                                                            | Użyj `runtime="subagent"` z sesji w piaskownicy albo uruchom spawn ACP z sesji poza piaskownicą.                                                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla runtime ACP.                                                                                        | Użyj `runtime="subagent"` dla wymaganego uruchamiania w piaskownicy albo użyj ACP z `sandbox="inherit"` z sesji poza piaskownicą.                                                                 |
| `Cannot apply --model ... did not advertise model support`                  | Docelowy harness nie udostępnia ogólnego przełączania modeli ACP.                                                                    | Użyj harnessa, który deklaruje ACP `models`/`session/set_model`, użyj referencji modeli Codex ACP albo skonfiguruj model bezpośrednio w harnessie, jeśli ma własną flagę startową.                |
| Missing ACP metadata for bound session                                      | Nieaktualne/usunięte metadane sesji ACP.                                                                                             | Utwórz ponownie za pomocą `/acp spawn`, a następnie ponownie powiąż/ustaw fokus wątku.                                                                                                           |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapisy/exec w nieinteraktywnej sesji ACP.                                                                   | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i zrestartuj Gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration).                    |
| ACP session fails early with little output                                  | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`.                                                | Sprawdź logi Gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`.                     |
| ACP session stalls indefinitely after completing work                       | Proces harnessa zakończył się, ale sesja ACP nie zgłosiła ukończenia.                                                                | Monitoruj za pomocą `ps aux \| grep acpx`; ręcznie zabij nieaktualne procesy.                                                                                                                    |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Wewnętrzna koperta zdarzenia wyciekła przez granicę ACP.                                                                             | Zaktualizuj OpenClaw i uruchom ponownie przepływ ukończenia; zewnętrzne harnessy powinny otrzymywać wyłącznie zwykłe prompty ukończenia.                                                        |

## Powiązane

- [Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Backendy CLI](/pl/gateway/cli-backends)
- [Harness Codex](/pl/plugins/codex-harness)
- [Narzędzia piaskownicy wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Subagenci](/pl/tools/subagents)
