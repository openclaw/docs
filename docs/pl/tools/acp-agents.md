---
read_when:
    - Uruchamianie środowisk kodowania za pośrednictwem ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją w kanałach wiadomości
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, podłączeniem Plugin lub dostarczaniem uzupełnień
    - Obsługa poleceń /acp z czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne środowiska kodowania (Claude Code, Cursor, Gemini CLI, jawny Codex ACP, OpenClaw ACP, OpenCode) za pośrednictwem backendu ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-05-07T13:26:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
pozwalają OpenClaw uruchamiać zewnętrzne środowiska programistyczne (na przykład Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI i inne
obsługiwane środowiska ACPX) przez backendowy plugin ACP.

Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

<Note>
**ACP to ścieżka zewnętrznego środowiska, a nie domyślna ścieżka Codex.** Natywny
plugin serwera aplikacji Codex obsługuje kontrolki `/codex ...` oraz
wbudowane środowisko uruchomieniowe `agentRuntime.id: "codex"`; ACP obsługuje
kontrolki `/acp ...` i sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code połączyły się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                         | Użyj                                  | Uwagi                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać lub kontrolować Codex w bieżącej konwersacji                                           | `/codex bind`, `/codex threads`       | Natywna ścieżka serwera aplikacji Codex, gdy plugin `codex` jest włączony; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/fast/permissions, stop i kontrolki sterowania. ACP jest jawnym rozwiązaniem awaryjnym |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inne zewnętrzne środowisko _przez_ OpenClaw | Ta strona                             | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska uruchomieniowego                                                           |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta                     | [`openclaw acp`](/pl/cli/acp)            | Tryb mostu. IDE/klient komunikuje się przez ACP z OpenClaw przez stdio/WebSocket                                                                                                             |
| Ponownie użyć lokalnego AI CLI jako tekstowego modelu awaryjnego                                | [Backendy CLI](/pl/gateway/cli-backends) | Nie ACP. Bez narzędzi OpenClaw, bez kontrolek ACP, bez środowiska uruchomieniowego środowiska                                                                                               |

## Czy działa od razu?

Tak, po zainstalowaniu oficjalnego pluginu środowiska uruchomieniowego ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kopie źródłowe mogą używać lokalnego pluginu workspace `extensions/acpx` po
`pnpm install`. Uruchom `/acp doctor`, aby sprawdzić gotowość.

OpenClaw uczy agentów o uruchamianiu ACP tylko wtedy, gdy ACP jest **rzeczywiście
użyteczne**: ACP musi być włączone, dispatch nie może być wyłączony, bieżąca
sesja nie może być zablokowana przez piaskownicę, a backend środowiska uruchomieniowego musi być
załadowany. Jeśli te warunki nie są spełnione, Skills pluginu ACP i wskazówki ACP dla
`sessions_spawn` pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Pułapki pierwszego uruchomienia">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny spis pluginów i **musi** zawierać `acpx`; w przeciwnym razie zainstalowany backend ACP jest celowo blokowany, a `/acp doctor` zgłasza brakujący wpis allowlist.
    - Adapter Codex ACP jest przygotowywany z pluginem `acpx` i uruchamiany lokalnie, gdy to możliwe.
    - Codex ACP działa z izolowanym `CODEX_HOME`; OpenClaw kopiuje tylko zaufane wpisy projektu z konfiguracji Codex hosta i ufa aktywnemu workspace, pozostawiając uwierzytelnianie, powiadomienia i hooki w konfiguracji hosta.
    - Inne adaptery docelowych środowisk nadal mogą być pobierane na żądanie przez `npx` przy pierwszym użyciu.
    - Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego środowiska.
    - Jeśli host nie ma npm ani dostępu do sieci, pobieranie adapterów przy pierwszym uruchomieniu kończy się niepowodzeniem, dopóki pamięci podręczne nie zostaną wstępnie rozgrzane albo adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska uruchomieniowego">
    ACP uruchamia rzeczywisty proces zewnętrznego środowiska. OpenClaw odpowiada za routing,
    stan zadań w tle, dostarczanie, powiązania i politykę; środowisko
    odpowiada za logowanie do dostawcy, katalog modeli, zachowanie systemu plików i
    narzędzia natywne.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony, sprawny backend.
    - Identyfikator celu jest dozwolony przez `acp.allowedAgents`, gdy ta allowlist jest ustawiona.
    - Polecenie środowiska może uruchomić się na hoście Gateway.
    - Uwierzytelnianie dostawcy jest obecne dla tego środowiska (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego środowiska - identyfikatorów modeli nie można przenosić między środowiskami.
    - Żądany `cwd` istnieje i jest dostępny albo pomiń `cwd` i pozwól backendowi użyć wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów o uprawnienia, więc przebiegi programistyczne intensywnie korzystające z zapisu/wykonywania zwykle potrzebują profilu uprawnień ACPX, który może działać bezobsługowo.

  </Accordion>
</AccordionGroup>

Narzędzia pluginów OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie udostępniane
środowiskom ACP. Włącz jawne mosty MCP w
[agenci ACP - konfiguracja](/pl/tools/acp-agents-setup) tylko wtedy, gdy środowisko
ma wywoływać te narzędzia bezpośrednio.

## Obsługiwane docelowe środowiska

Z backendem `acpx` używaj tych identyfikatorów środowisk jako celów `/acp spawn <id>`
lub `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator środowiska | Typowy backend                                | Uwagi                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Wymaga uwierzytelniania Claude Code na hoście.                                              |
| `codex`    | Adapter Codex ACP                              | Jawne rozwiązanie awaryjne ACP tylko wtedy, gdy natywne `/codex` jest niedostępne albo zażądano ACP. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Wymaga uwierzytelniania Copilot CLI/środowiska uruchomieniowego.                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Nadpisz polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP.    |
| `droid`    | Factory Droid CLI                              | Wymaga uwierzytelniania Factory/Droid albo `FACTORY_API_KEY` w środowisku środowiska.        |
| `gemini`   | Adapter Gemini CLI ACP                         | Wymaga uwierzytelniania Gemini CLI albo konfiguracji klucza API.                                          |
| `iflow`    | iFlow CLI                                      | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                 |
| `kilocode` | Kilo Code CLI                                  | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                 |
| `kimi`     | Kimi/Moonshot CLI                              | Wymaga uwierzytelniania Kimi/Moonshot na hoście.                                            |
| `kiro`     | Kiro CLI                                       | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                 |
| `opencode` | Adapter OpenCode ACP                           | Wymaga uwierzytelniania OpenCode CLI/dostawcy.                                                |
| `openclaw` | Most OpenClaw Gateway przez `openclaw acp` | Pozwala środowisku świadomemu ACP komunikować się z powrotem z sesją OpenClaw Gateway.                 |
| `pi`       | Pi/wbudowane środowisko uruchomieniowe OpenClaw                   | Używane do eksperymentów ze środowiskiem natywnym dla OpenClaw.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Wymaga uwierzytelniania zgodnego z Qwen na hoście.                                          |

Niestandardowe aliasy agentów acpx można konfigurować w samym acpx, ale polityka OpenClaw
nadal sprawdza `acp.allowedAgents` i każde mapowanie
`agents.list[].runtime.acp.agent` przed dispatch.

## Procedura operatora

Szybki przepływ `/acp` z czatu:

<Steps>
  <Step title="Uruchom">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` lub jawnie
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Pracuj">
    Kontynuuj w powiązanej konwersacji lub wątku (albo wskaż sesję
    jawnie kluczem).
  </Step>
  <Step title="Sprawdź stan">
    `/acp status`
  </Step>
  <Step title="Dostosuj">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Steruj">
    Bez zastępowania kontekstu: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Zatrzymaj">
    `/acp cancel` (bieżąca tura) albo `/acp close` (sesja + powiązania).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Szczegóły cyklu życia">
    - Uruchomienie tworzy albo wznawia sesję środowiska uruchomieniowego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy przebieg jest własnością elementu nadrzędnego.
    - Sesje ACP będące własnością elementu nadrzędnego są traktowane jako praca w tle nawet wtedy, gdy sesja środowiska uruchomieniowego jest trwała; ukończenie i dostarczanie między powierzchniami przechodzą przez notifier zadania nadrzędnego, zamiast działać jak zwykła sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka zakończone lub osierocone jednorazowe sesje ACP będące własnością elementu nadrzędnego. Trwałe sesje ACP są zachowywane, gdy pozostaje aktywne powiązanie konwersacji; przestarzałe trwałe sesje bez aktywnego powiązania są zamykane, aby nie mogły zostać po cichu wznowione po zakończeniu zadania właściciela albo zniknięciu jego rekordu zadania.
    - Powiązane wiadomości kontynuacyjne trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, odfokusowane, zresetowane albo nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako zwykły tekst promptu do powiązanego środowiska ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Środowisko może nadal zachować własną historię upstream, jeśli obsługuje wznawianie.
    - Plugin acpx czyści należące do OpenClaw drzewa procesów wrappera i adaptera po `close` oraz zbiera przestarzałe osierocone procesy ACPX należące do OpenClaw podczas uruchamiania Gateway.
    - Bezczynne workery środowiska uruchomieniowego kwalifikują się do czyszczenia po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Reguły natywnego routingu Codex">
    Wyzwalacze w języku naturalnym, które powinny kierować do **natywnego pluginu Codex**,
    gdy jest włączony:

    - „Powiąż ten kanał Discord z Codex.”
    - „Dołącz ten czat do wątku Codex `<id>`.”
    - „Pokaż wątki Codex, a potem powiąż ten.”

    Natywne powiązanie konwersacji Codex to domyślna ścieżka sterowania czatem.
    Dynamiczne narzędzia OpenClaw nadal wykonują się przez OpenClaw, podczas gdy
    narzędzia natywne dla Codex, takie jak shell/apply-patch, wykonują się w Codex.
    Dla zdarzeń narzędzi natywnych dla Codex OpenClaw wstrzykuje natywny
    przekaźnik hooków na turę, dzięki czemu hooki Plugin mogą blokować `before_tool_call`, obserwować
    `after_tool_call` i kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie pluginy mogą zażądać jeszcze jednego
    przebiegu modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów narzędzi natywnych dla Codex
    ani nie przepisuje rekordów wątków Codex. Używaj jawnego ACP tylko wtedy,
    gdy chcesz modelu środowiska wykonawczego/sesji ACP. Granica obsługi osadzonego
    Codex jest udokumentowana w
    [kontrakcie obsługi harnessa Codex v1](/pl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Ściągawka wyboru modelu / dostawcy / środowiska wykonawczego">
    - `openai-codex/*` - starsza ścieżka modelu Codex OAuth/subskrypcji naprawiana przez doctor.
    - `openai/*` - natywne środowisko wykonawcze serwera aplikacji Codex osadzone dla tur agenta OpenAI.
    - `/codex ...` - natywne sterowanie konwersacją Codex.
    - `/acp ...` lub `runtime: "acp"` - jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze języka naturalnego routingu ACP">
    Wyzwalacze, które powinny kierować do środowiska wykonawczego ACP:

    - "Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik."
    - "Użyj Gemini CLI do tego zadania w wątku, a potem utrzymaj dalsze odpowiedzi w tym samym wątku."
    - "Uruchom Codex przez ACP w wątku w tle."

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje `agentId` harnessa,
    wiąże z bieżącą konwersacją lub wątkiem, gdy jest to obsługiwane, i
    kieruje kolejne wiadomości do tej sesji aż do zamknięcia/wygaśnięcia. Codex podąża
    tą ścieżką tylko wtedy, gdy ACP/acpx jest jawne albo natywny plugin Codex
    jest niedostępny dla żądanej operacji.

    Dla `sessions_spawn`, `runtime: "acp"` jest ogłaszane tylko wtedy, gdy ACP
    jest włączone, żądający nie jest w sandboxie, a backend środowiska wykonawczego
    ACP jest załadowany. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    wysyłanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych wywołań
    `sessions_spawn({ runtime: "acp" })`. Celuje w identyfikatory harnessów ACP, takie jak `codex`,
    `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
    identyfikatora agenta konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
    jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
    w przeciwnym razie użyj domyślnego środowiska wykonawczego subagenta. Gdy agent OpenClaw
    jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
    `runtime.acp.agent` jako bazowego identyfikatora harnessa.

  </Accordion>
</AccordionGroup>

## ACP kontra subagenci

Używaj ACP, gdy chcesz zewnętrznego środowiska wykonawczego harnessa. Używaj **natywnego serwera aplikacji Codex**
do powiązania/sterowania konwersacją Codex, gdy plugin `codex`
jest włączony. Używaj **subagentów**, gdy chcesz natywnych dla OpenClaw
delegowanych uruchomień.

| Obszar              | Sesja ACP                              | Uruchomienie subagenta              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko wykonawcze | Plugin backendu ACP (na przykład acpx) | Natywne środowisko wykonawcze subagenta OpenClaw |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko wykonawcze) |

Zobacz także [Subagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda tak:

1. Płaszczyzna sterowania sesją ACP OpenClaw.
2. Oficjalny plugin środowiska wykonawczego `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Mechanizmy środowiska wykonawczego/sesji po stronie Claude.

ACP Claude to **sesja harnessa** z kontrolkami ACP, wznawianiem sesji,
śledzeniem zadań w tle oraz opcjonalnym powiązaniem konwersacji/wątku.

Backendy CLI są oddzielnymi tekstowymi lokalnymi zastępczymi środowiskami wykonawczymi - zobacz
[Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada brzmi:

- **Chcesz `/acp spawn`, wiązalnych sesji, kontrolek środowiska wykonawczego albo trwałej pracy harnessa?** Użyj ACP.
- **Chcesz prostego lokalnego tekstowego trybu awaryjnego przez surowe CLI?** Użyj backendów CLI.

## Powiązane sesje

### Model mentalny

- **Powierzchnia czatu** - miejsce, gdzie ludzie kontynuują rozmowę (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** - trwały stan środowiska wykonawczego Codex/Claude/Gemini, do którego OpenClaw kieruje wiadomości.
- **Wątek/temat potomny** - opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`.
- **Obszar roboczy środowiska wykonawczego** - lokalizacja w systemie plików (`cwd`, checkout repozytorium, obszar roboczy backendu), w której działa harness. Niezależna od powierzchni czatu.

### Powiązania z bieżącą konwersacją

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do
utworzonej sesji ACP - bez wątku potomnego, ta sama powierzchnia czatu. OpenClaw nadal
obsługuje transport, uwierzytelnianie, bezpieczeństwo i dostarczanie. Kolejne wiadomości w tej
konwersacji trafiają do tej samej sesji; `/new` i `/reset` resetują
sesję w miejscu; `/acp close` usuwa powiązanie.

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
  <Accordion title="Reguły powiązań i wyłączność">
    - `--bind here` i `--thread ...` wzajemnie się wykluczają.
    - `--bind here` działa tylko na kanałach, które deklarują powiązanie z bieżącą konwersacją; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Powiązania przetrwają ponowne uruchomienia gatewaya.
    - W Discord `spawnSessions` bramkuje tworzenie wątku potomnego dla `--thread auto|here` - nie dla `--bind here`.
    - Jeśli uruchamiasz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **agenta docelowego**. Brakujące dziedziczone ścieżki (`ENOENT`/`ENOTDIR`) wracają do domyślnego backendu; inne błędy dostępu (np. `EACCES`) są zgłaszane jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w powiązanych konwersacjach - polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst kolejnych wiadomości trafia do powiązanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje powiązane z wątkiem">
    Gdy powiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Kolejne wiadomości w tym wątku trafiają do powiązanej sesji ACP.
    - Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
    - Odłączenie fokusu/zamknięcie/archiwizacja/limit bezczynności albo wygaśnięcie maksymalnego wieku usuwa powiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` to polecenia Gateway, a nie prompty do harnessa ACP.

    Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne wysyłanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Włączone uruchamianie sesji wątków adaptera kanału (domyślnie: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Obsługa powiązań wątków zależy od adaptera. Jeśli aktywny adapter kanału
    nie obsługuje powiązań wątków, OpenClaw zwraca jasny komunikat
    o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału, który udostępnia funkcję powiązania sesji/wątku.
    - Obecna wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy DM).
    - Kanały Plugin mogą dodać obsługę przez ten sam interfejs powiązań.

  </Accordion>
</AccordionGroup>

## Trwałe powiązania kanałów

Dla nieulotnych przepływów pracy skonfiguruj trwałe powiązania ACP we
wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe powiązanie konwersacji ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje docelową konwersację. Kształty dla poszczególnych kanałów:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych powiązań grup.
- **DM/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` dla stabilnych powiązań grup.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Identyfikator agenta OpenClaw będącego właścicielem.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Opcjonalne nadpisanie ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Opcjonalna etykieta widoczna dla operatora.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Opcjonalny katalog roboczy środowiska wykonawczego.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Opcjonalne nadpisanie backendu.
</ParamField>

### Domyślne ustawienia środowiska wykonawczego na agenta

Użyj `agents.list[].runtime`, aby raz zdefiniować domyślne ustawienia ACP dla agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessa, np. `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Pierwszeństwo nadpisań dla powiązanych sesji ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Globalne domyślne ustawienia ACP (np. `acp.backend`)

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

- OpenClaw upewnia się przed użyciem, że skonfigurowana sesja ACP istnieje.
- Wiadomości w tym kanale lub temacie są kierowane do skonfigurowanej sesji ACP.
- W powiązanych rozmowach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe powiązania środowiska wykonawczego (na przykład utworzone przez przepływy skupienia wątku) nadal obowiązują tam, gdzie występują.
- W przypadku międzyagentowych uruchomień ACP bez jawnego `cwd` OpenClaw dziedziczy przestrzeń roboczą agenta docelowego z konfiguracji agenta.
- Brakujące odziedziczone ścieżki przestrzeni roboczej wracają do domyślnego cwd backendu; niebrakujące błędy dostępu są zgłaszane jako błędy uruchamiania.

## Uruchamianie sesji ACP

Dwa sposoby uruchomienia sesji ACP:

<Tabs>
  <Tab title="From sessions_spawn">
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
    `runtime` domyślnie ma wartość `subagent`, więc ustaw jawnie `runtime: "acp"`
    dla sesji ACP. Jeśli `agentId` zostanie pominięte, OpenClaw używa
    `acp.defaultAgent`, gdy jest skonfigurowane. `mode: "session"` wymaga
    `thread: true`, aby utrzymać trwałą powiązaną rozmowę.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Użyj `/acp spawn`, aby mieć jawną kontrolę operatora z poziomu czatu.

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

    Zobacz [polecenia slash](/pl/tools/slash-commands).

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
  Identyfikator docelowego środowiska ACP. Wraca do `acp.defaultAgent`, jeśli jest ustawione.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Żąda przepływu powiązania wątku tam, gdzie jest obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` jest jednorazowe; `"session"` jest trwałe. Jeśli `thread: true` i
  `mode` zostanie pominięte, OpenClaw może domyślnie użyć trwałego zachowania
  zgodnie ze ścieżką środowiska wykonawczego. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy środowiska wykonawczego (walidowany przez politykę
  backendu/środowiska wykonawczego). Jeśli zostanie pominięty, uruchomienie ACP
  dziedziczy przestrzeń roboczą agenta docelowego, gdy jest skonfigurowana;
  brakujące odziedziczone ścieżki wracają do domyślnych ustawień backendu,
  a rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora, używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza historię
  rozmowy przez `session/load`. Wymaga `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` strumieniuje podsumowania postępu początkowego uruchomienia ACP
  z powrotem do sesji żądającej jako zdarzenia systemowe. Akceptowane odpowiedzi
  obejmują `streamLogPath` wskazujące dziennik JSONL w zakresie sesji
  (`<sessionId>.acp-stream.jsonl`), który możesz śledzić, aby zobaczyć pełną
  historię przekazywania.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Przerywa turę podrzędną ACP po N sekundach. `0` utrzymuje turę na ścieżce
  Gateway bez limitu czasu. Ta sama wartość jest stosowana do uruchomienia Gateway
  i środowiska wykonawczego ACP, aby zatrzymane lub pozbawione limitu środowiska
  nie zajmowały pasa agenta nadrzędnego bez końca.
</ParamField>
<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla sesji podrzędnej ACP. Uruchomienia Codex ACP
  normalizują referencje OpenClaw Codex, takie jak `openai-codex/gpt-5.4`, do
  konfiguracji startowej Codex ACP przed `session/new`; formy slash, takie jak
  `openai-codex/gpt-5.4/high`, ustawiają także wysiłek rozumowania Codex ACP.
  Inne środowiska muszą ogłaszać ACP `models` i obsługiwać `session/set_model`;
  w przeciwnym razie OpenClaw/acpx kończy się jasnym błędem zamiast po cichu
  wracać do domyślnego agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny wysiłek myślenia/rozumowania. Dla Codex ACP `minimal` mapuje się na
  niski wysiłek, `low`/`medium`/`high`/`xhigh` mapują się bezpośrednio, a `off`
  pomija startowe nadpisanie wysiłku rozumowania.
</ParamField>

## Tryby powiązania uruchomienia i wątku

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                            |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Powiąż bieżącą aktywną rozmowę w miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz powiązania bieżącej rozmowy.                                |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „spraw, aby ten kanał lub czat był obsługiwany przez Codex”.
    - `--bind here` nie tworzy wątku podrzędnego.
    - `--bind here` jest dostępne tylko w kanałach, które udostępniają obsługę powiązania bieżącej rozmowy.
    - `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                         |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek podrzędny, gdy jest obsługiwany. |
    | `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli nie jesteś w wątku.                       |
    | `off`  | Brak powiązania. Sesja uruchamia się bez powiązania.                                               |

    Uwagi:

    - Na powierzchniach bez powiązań wątków domyślne zachowanie jest w praktyce `off`.
    - Uruchomienie powiązane z wątkiem wymaga obsługi w polityce kanału:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Użyj `--bind here`, gdy chcesz przypiąć bieżącą rozmowę bez tworzenia wątku podrzędnego.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą być interaktywnymi przestrzeniami roboczymi albo pracą w tle
należącą do rodzica. Ścieżka dostarczania zależy od tej formy.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sesje interaktywne mają kontynuować rozmowę na widocznej powierzchni
    czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą rozmowę z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwałe skonfigurowane `bindings[].type="acp"` kierują pasujące rozmowy do tej samej sesji ACP.

    Kolejne wiadomości w powiązanej rozmowie trafiają bezpośrednio do sesji
    ACP, a dane wyjściowe ACP są dostarczane z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do środowiska:

    - Zwykłe powiązane wiadomości uzupełniające są wysyłane jako tekst promptu oraz z załącznikami tylko wtedy, gdy środowisko/backend je obsługuje.
    - Polecenia zarządzania `/acp` i lokalne polecenia Gateway są przechwytywane przed wysłaniem do ACP.
    - Zdarzenia ukończenia wygenerowane przez środowisko wykonawcze są materializowane dla każdego celu. Agenci OpenClaw otrzymują wewnętrzną kopertę kontekstu środowiska wykonawczego OpenClaw; zewnętrzne środowiska ACP otrzymują zwykły prompt z wynikiem dziecka i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych środowisk ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają tekstu wyzwalacza widocznego dla użytkownika albo zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają w OpenClaw ustrukturyzowane, gdzie to możliwe, i nie są traktowane jako treść czatu napisana przez użytkownika.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Jednorazowe sesje ACP uruchamiane przez inny przebieg agenta są dziećmi
    w tle, podobnie jak podagenci:

    - Rodzic zleca pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Dziecko działa we własnej sesji środowiska ACP.
    - Tury dziecka działają na tym samym pasie tła, którego używają natywne uruchomienia podagentów, więc wolne środowisko ACP nie blokuje niepowiązanej pracy sesji głównej.
    - Raport ukończenia wraca przez ścieżkę ogłaszania ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia na zwykły prompt ACP przed wysłaniem go do zewnętrznego środowiska, aby środowiska nie widziały znaczników kontekstu środowiska wykonawczego dostępnych tylko w OpenClaw.
    - Rodzic przepisuje wynik dziecka zwykłym głosem asystenta, gdy odpowiedź widoczna dla użytkownika jest przydatna.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między rodzicem
    a dzieckiem. Dziecko ma już kanał ukończenia z powrotem do rodzica.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` może kierować wiadomość do innej sesji po uruchomieniu. Dla zwykłych
    sesji równorzędnych OpenClaw używa ścieżki wiadomości uzupełniającej agent-do-agenta
    (A2A) po wstrzyknięciu wiadomości:

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól żądającemu i celowi wymienić ograniczoną liczbę tur uzupełniających.
    - Poproś cel o wygenerowanie wiadomości ogłaszającej.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest ścieżką awaryjną dla wysyłek równorzędnych, w których
    nadawca potrzebuje widocznego uzupełnienia. Pozostaje włączona, gdy
    niepowiązana sesja może widzieć i wysyłać wiadomości do celu ACP, na przykład
    przy szerokich ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija wiadomość uzupełniającą A2A tylko wtedy, gdy żądający jest
    rodzicem własnego jednorazowego dziecka ACP należącego do rodzica. W takim
    przypadku uruchomienie A2A na ścieżce ukończenia zadania może obudzić rodzica
    z wynikiem dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i
    utworzyć pętlę echa rodzic/dziecko. Wynik `sessions_send` zgłasza
    `delivery.status="skipped"` dla tego przypadku własnego dziecka, ponieważ
    ścieżka ukończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Resume an existing session">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    zaczynać od nowa. Agent odtwarza historię rozmowy przez `session/load`,
    więc podejmuje pracę z pełnym kontekstem tego, co było wcześniej.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe zastosowania:

    - Przekaż sesję Codex z laptopa na telefon - powiedz agentowi, aby podjął pracę tam, gdzie została przerwana.
    - Kontynuuj sesję kodowania rozpoczętą interaktywnie w CLI, teraz bez interfejsu przez agenta.
    - Wznów pracę przerwaną przez restart Gateway lub limit bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślne środowisko wykonawcze podagenta ignoruje to pole dostępne tylko dla ACP.
    - `streamTo` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślne środowisko wykonawcze podagenta ignoruje to pole dostępne tylko dla ACP.
    - `resumeSessionId` to lokalny dla hosta identyfikator wznowienia ACP/środowiska, a nie klucz sesji kanału OpenClaw; OpenClaw nadal sprawdza politykę uruchamiania ACP i politykę agenta docelowego przed wysłaniem, a backend lub środowisko ACP odpowiada za autoryzację ładowania tego nadrzędnego identyfikatora.
    - `resumeSessionId` przywraca nadrzędną historię rozmowy ACP; `thread` i `mode` nadal stosują się normalnie do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się jasnym błędem - bez cichego przejścia do nowej sesji.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Po wdrożeniu Gateway uruchom aktywne sprawdzenie end-to-end zamiast
    ufać testom jednostkowym:

    1. Zweryfikuj wdrożoną wersję Gateway i commit na hoście docelowym.
    2. Otwórz tymczasową sesję mostka ACPX do działającego agenta.
    3. Poproś tego agenta o wywołanie `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` oraz zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywisty `childSessionKey` oraz brak błędu walidatora.
    5. Wyczyść tymczasową sesję mostka.

    Utrzymaj bramkę przy `mode: "run"` i pomiń `streamTo: "parent"` -
    powiązany z wątkiem `mode: "session"` oraz ścieżki przekazywania strumienia są osobnymi,
    bogatszymi przebiegami integracyjnymi.

  </Accordion>
</AccordionGroup>

## Zgodność z piaskownicą

Sesje ACP działają obecnie w środowisku uruchomieniowym hosta, **nie** wewnątrz
piaskownicy OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzna uprząż może odczytywać/zapisywać zgodnie z własnymi uprawnieniami CLI i wybranym `cwd`.
- Polityka piaskownicy OpenClaw **nie** obejmuje wykonywania uprzęży ACP.
- OpenClaw nadal wymusza bramki funkcji ACP, dozwolonych agentów, własność sesji, powiązania kanałów oraz politykę dostarczania Gateway.
- Użyj `runtime: "subagent"` dla natywnej pracy OpenClaw z wymuszaną piaskownicą.

</Warning>

Obecne ograniczenia:

- Jeśli sesja żądająca działa w piaskownicy, uruchomienia ACP są blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozpoznawanie docelowej sesji

Większość akcji `/acp` akceptuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozpoznawania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - próbuje klucza
   - następnie identyfikatora sesji w kształcie UUID
   - następnie etykiety
2. Bieżące powiązanie wątku (jeśli ta konwersacja/wątek jest powiązana z sesją ACP).
3. Zapasowa bieżąca sesja żądająca.

Powiązania bieżącej konwersacji i powiązania wątku uczestniczą w
kroku 2.

Jeśli żaden cel nie zostanie rozpoznany, OpenClaw zwraca jasny błąd
(`Unable to resolve session target: ...`).

## Elementy sterujące ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje trwającą turę dla sesji docelowej.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązanie celów wątku.              | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje środowiska uruchomieniowego i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb środowiska uruchomieniowego dla sesji docelowej. | `/acp set-mode plan`                                          |
| `/acp set`           | Zapis ogólnej opcji konfiguracji środowiska uruchomieniowego. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego środowiska uruchomieniowego. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu środowiska uruchomieniowego (sekundy). | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu środowiska uruchomieniowego.   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska uruchomieniowego sesji. | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                 | `/acp sessions`                                               |
| `/acp doctor`        | Kondycja backendu, możliwości, możliwe do wykonania poprawki. | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączania.  | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje środowiska uruchomieniowego oraz identyfikatory sesji na poziomie środowiska uruchomieniowego i
backendu. Błędy nieobsługiwanych elementów sterujących są jasno widoczne,
gdy backend nie ma danej możliwości. `/acp sessions` odczytuje
magazyn dla bieżącej powiązanej lub żądającej sesji; tokeny celu
(`session-key`, `session-id` lub `session-label`) są rozpoznawane przez
odkrywanie sesji Gateway, w tym niestandardowe katalogi główne `session.store`
dla poszczególnych agentów.

### Mapowanie opcji środowiska uruchomieniowego

`/acp` ma wygodne polecenia i ogólny setter. Operacje równoważne:

| Polecenie                   | Odpowiada                              | Uwagi                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | klucz konfiguracji środowiska uruchomieniowego `model` | Dla Codex ACP OpenClaw normalizuje `openai-codex/<model>` do identyfikatora modelu adaptera i mapuje sufiksy rozumowania po ukośniku, takie jak `openai-codex/gpt-5.4/high`, na `reasoning_effort`. |
| `/acp set thinking <level>`  | klucz konfiguracji środowiska uruchomieniowego `thinking` | Dla Codex ACP OpenClaw wysyła odpowiadające `reasoning_effort`, gdy adapter je obsługuje.                                                                                       |
| `/acp permissions <profile>` | klucz konfiguracji środowiska uruchomieniowego `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | klucz konfiguracji środowiska uruchomieniowego `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | nadpisanie cwd środowiska uruchomieniowego | Bezpośrednia aktualizacja.                                                                                                                                                     |
| `/acp set <key> <value>`     | ogólne                              | `key=cwd` używa ścieżki nadpisania cwd.                                                                                                                                        |
| `/acp reset-options`         | czyści wszystkie nadpisania środowiska uruchomieniowego | -                                                                                                                                                                              |

## Uprząż acpx, konfiguracja Plugin i uprawnienia

Konfigurację uprzęży acpx (aliasy Claude Code / Codex / Gemini CLI),
mostki MCP plugin-tools i OpenClaw-tools oraz tryby uprawnień ACP opisuje
[agenci ACP - konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                                                               | Naprawa                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Brak Pluginu backendu, jest wyłączony albo zablokowany przez `plugins.allow`.                                          | Zainstaluj i włącz Plugin backendu, uwzględnij `acpx` w `plugins.allow`, gdy ta lista dozwolonych jest ustawiona, a następnie uruchom `/acp doctor`.                     |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                                                         | Ustaw `acp.enabled=true`.                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatyczne wysyłanie ze zwykłych wiadomości wątku jest wyłączone.                                                    | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne trasowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają.                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na liście dozwolonych.                                                                          | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                         |
| `/acp doctor` reports backend not ready right after startup                 | Brak Pluginu backendu, jest wyłączony, zablokowany przez zasady allow/deny albo jego skonfigurowany plik wykonywalny jest niedostępny. | Zainstaluj/włącz Plugin backendu, ponownie uruchom `/acp doctor` i sprawdź błąd instalacji backendu lub zasad, jeśli nadal pozostaje w złym stanie.                      |
| Harness command not found                                                   | CLI adaptera nie jest zainstalowane, brakuje zewnętrznego Pluginu albo pierwsze pobranie `npx` nie powiodło się dla adaptera innego niż Codex. | Uruchom `/acp doctor`, zainstaluj/wstępnie rozgrzej adapter na hoście Gateway albo skonfiguruj jawnie polecenie agenta acpx.                                             |
| Model-not-found from the harness                                            | Identyfikator modelu jest poprawny dla innego dostawcy/harnessa, ale nie dla tego celu ACP.                           | Użyj modelu wymienionego przez ten harness, skonfiguruj model w harnessie albo pomiń nadpisanie.                                                                         |
| Vendor auth error from the harness                                          | OpenClaw działa poprawnie, ale docelowe CLI/dostawca nie jest zalogowane.                                              | Zaloguj się albo podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                               |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy klucz/identyfikator/token etykiety.                                                                      | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej rozmowy możliwej do powiązania.                                                       | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową.                                                           | Użyj `/acp spawn ... --thread ...`, gdy jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | Użyto `--thread here` poza kontekstem wątku.                                                                           | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                                           | Przepnij powiązanie jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązania wątku.                                                                            | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP działa po stronie hosta; sesja żądająca jest w piaskownicy.                                                | Użyj `runtime="subagent"` z sesji w piaskownicy albo uruchom ACP spawn z sesji poza piaskownicą.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla runtime ACP.                                                                          | Użyj `runtime="subagent"` dla wymaganego sandboxingu albo użyj ACP z `sandbox="inherit"` z sesji poza piaskownicą.                                                       |
| `Cannot apply --model ... did not advertise model support`                  | Docelowy harness nie udostępnia ogólnego przełączania modelu ACP.                                                      | Użyj harnessa, który deklaruje ACP `models`/`session/set_model`, użyj referencji modeli ACP Codex albo skonfiguruj model bezpośrednio w harnessie, jeśli ma własną flagę startową. |
| Missing ACP metadata for bound session                                      | Nieaktualne/usunięte metadane sesji ACP.                                                                               | Utwórz ponownie przez `/acp spawn`, a następnie ponownie powiąż/ustaw fokus wątku.                                                                                       |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapisy/wykonanie w nieinteraktywnej sesji ACP.                                                | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i zrestartuj gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`.                                  | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Aby uzyskać pełne uprawnienia, ustaw `permissionMode=approve-all`; aby uzyskać łagodną degradację, ustaw `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Proces harnessa zakończył się, ale sesja ACP nie zgłosiła ukończenia.                                                  | Zaktualizuj OpenClaw; obecne czyszczenie acpx usuwa przestarzałe procesy wrappera i adaptera należące do OpenClaw przy zamknięciu oraz starcie Gateway.                  |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Wewnętrzna koperta zdarzeń wyciekła przez granicę ACP.                                                                 | Zaktualizuj OpenClaw i ponownie uruchom przepływ ukończenia; zewnętrzne harnessy powinny otrzymywać wyłącznie zwykłe prompty ukończenia.                                 |

## Powiązane

- [Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Backendy CLI](/pl/gateway/cli-backends)
- [Harness Codex](/pl/plugins/codex-harness)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Podagenci](/pl/tools/subagents)
