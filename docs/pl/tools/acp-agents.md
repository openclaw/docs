---
read_when:
    - Uruchamianie środowisk kodowania za pośrednictwem ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją w kanałach komunikacyjnych
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, podłączaniem pluginu lub dostarczaniem uzupełnień
    - Obsługa poleceń /acp z poziomu czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne środowiska kodowania (Claude Code, Cursor, Gemini CLI, jawny Codex ACP, OpenClaw ACP, OpenCode) przez backend ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-05-02T10:03:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
pozwalają OpenClaw uruchamiać zewnętrzne harnessy programistyczne (na przykład Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI i inne
obsługiwane harnessy ACPX) przez backendowy Plugin ACP.

Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

<Note>
**ACP to ścieżka zewnętrznego harnessu, a nie domyślna ścieżka Codex.** Natywny
Plugin serwera aplikacji Codex obsługuje kontrolki `/codex ...` i wbudowane
środowisko wykonawcze `agentRuntime.id: "codex"`; ACP obsługuje
kontrolki `/acp ...` i sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi rozmowami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                         | Użyj                                  | Uwagi                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać Codex z bieżącą rozmową lub nim sterować                                               | `/codex bind`, `/codex threads`       | Natywna ścieżka serwera aplikacji Codex, gdy Plugin `codex` jest włączony; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/tryb szybki/uprawnienia, zatrzymanie i sterowanie. ACP jest jawnym rozwiązaniem awaryjnym |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona                             | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska wykonawczego                                                              |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta                     | [`openclaw acp`](/pl/cli/acp)            | Tryb mostu. IDE/klient komunikuje się przez ACP z OpenClaw przez stdio/WebSocket                                                                                                             |
| Ponownie użyć lokalnego CLI AI jako tekstowego modelu awaryjnego                                | [Backendy CLI](/pl/gateway/cli-backends) | Nie ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak środowiska wykonawczego harnessu                                                                                                  |

## Czy to działa od razu?

Tak, po zainstalowaniu oficjalnego Plugin środowiska wykonawczego ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kopie źródłowe mogą używać lokalnego Plugin obszaru roboczego `extensions/acpx` po
`pnpm install`. Uruchom `/acp doctor`, aby wykonać kontrolę gotowości.

OpenClaw uczy agentów o uruchamianiu ACP tylko wtedy, gdy ACP jest **naprawdę
używalne**: ACP musi być włączone, wysyłanie nie może być wyłączone, bieżąca
sesja nie może być zablokowana przez sandbox, a backend środowiska wykonawczego musi być
załadowany. Jeśli te warunki nie są spełnione, Skills Plugin ACP i
wskazówki ACP dla `sessions_spawn` pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Pułapki pierwszego uruchomienia">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny inwentarz Plugin i **musi** zawierać `acpx`; w przeciwnym razie zainstalowany backend ACP jest celowo blokowany, a `/acp doctor` zgłasza brakujący wpis na liście dozwolonych.
    - Adapter Codex ACP jest dostarczany wraz z Plugin `acpx` i uruchamiany lokalnie, gdy to możliwe.
    - Inne adaptery docelowych harnessów mogą nadal być pobierane na żądanie przez `npx` przy pierwszym użyciu.
    - Uwierzytelnienie dostawcy dla tego harnessu nadal musi istnieć na hoście.
    - Jeśli host nie ma npm ani dostępu do sieci, pobieranie adapterów przy pierwszym uruchomieniu kończy się niepowodzeniem, dopóki pamięci podręczne nie zostaną wstępnie rozgrzane albo adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska wykonawczego">
    ACP uruchamia rzeczywisty proces zewnętrznego harnessu. OpenClaw odpowiada za routing,
    stan zadań w tle, dostarczanie, powiązania i politykę; harness
    odpowiada za logowanie do dostawcy, katalog modeli, zachowanie systemu plików i
    narzędzia natywne.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony, zdrowy backend.
    - Identyfikator docelowy jest dozwolony przez `acp.allowedAgents`, gdy ta lista dozwolonych jest ustawiona.
    - Polecenie harnessu może uruchomić się na hoście Gateway.
    - Uwierzytelnienie dostawcy jest obecne dla tego harnessu (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego harnessu — identyfikatory modeli nie są przenośne między harnessami.
    - Żądane `cwd` istnieje i jest dostępne albo pomiń `cwd` i pozwól backendowi użyć wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów o uprawnienia, więc przebiegi programistyczne intensywnie korzystające z zapisu/wykonywania zwykle potrzebują profilu uprawnień ACPX, który może działać bezobsługowo.

  </Accordion>
</AccordionGroup>

Narzędzia Plugin OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie
udostępniane harnessom ACP. Włącz jawne mosty MCP w
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup) tylko wtedy, gdy harness
powinien wywoływać te narzędzia bezpośrednio.

## Obsługiwane cele harnessów

Z backendem `acpx` używaj tych identyfikatorów harnessów jako celów `/acp spawn <id>`
lub `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator harnessu | Typowy backend                                  | Uwagi                                                                               |
| ---------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`               | Adapter Claude Code ACP                         | Wymaga uwierzytelnienia Claude Code na hoście.                                      |
| `codex`                | Adapter Codex ACP                               | Tylko jawne rozwiązanie awaryjne ACP, gdy natywne `/codex` jest niedostępne lub zażądano ACP. |
| `copilot`              | Adapter GitHub Copilot ACP                      | Wymaga uwierzytelnienia Copilot CLI/środowiska wykonawczego.                        |
| `cursor`               | Cursor CLI ACP (`cursor-agent acp`)             | Nadpisz polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP. |
| `droid`                | Factory Droid CLI                               | Wymaga uwierzytelnienia Factory/Droid lub `FACTORY_API_KEY` w środowisku harnessu.  |
| `gemini`               | Adapter Gemini CLI ACP                          | Wymaga uwierzytelnienia Gemini CLI lub konfiguracji klucza API.                     |
| `iflow`                | iFlow CLI                                       | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `kilocode`             | Kilo Code CLI                                   | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `kimi`                 | Kimi/Moonshot CLI                               | Wymaga uwierzytelnienia Kimi/Moonshot na hoście.                                    |
| `kiro`                 | Kiro CLI                                        | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `opencode`             | Adapter OpenCode ACP                            | Wymaga uwierzytelnienia OpenCode CLI/dostawcy.                                      |
| `openclaw`             | Most OpenClaw Gateway przez `openclaw acp`      | Pozwala harnessowi świadomemu ACP komunikować się z powrotem z sesją OpenClaw Gateway. |
| `pi`                   | Pi/wbudowane środowisko wykonawcze OpenClaw     | Używane do eksperymentów z natywnymi harnessami OpenClaw.                           |
| `qwen`                 | Qwen Code / Qwen CLI                            | Wymaga uwierzytelnienia zgodnego z Qwen na hoście.                                  |

Niestandardowe aliasy agentów acpx można konfigurować w samym acpx, ale polityka OpenClaw
nadal sprawdza `acp.allowedAgents` i każde mapowanie
`agents.list[].runtime.acp.agent` przed wysłaniem.

## Runbook operatora

Szybki przepływ `/acp` z czatu:

<Steps>
  <Step title="Uruchom">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` albo jawne
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Pracuj">
    Kontynuuj w powiązanej rozmowie lub wątku (albo wskaż jawnie
    klucz sesji).
  </Step>
  <Step title="Sprawdź stan">
    `/acp status`
  </Step>
  <Step title="Dostosuj">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Pokieruj">
    Bez zastępowania kontekstu: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Zatrzymaj">
    `/acp cancel` (bieżąca tura) lub `/acp close` (sesja + powiązania).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Szczegóły cyklu życia">
    - Uruchomienie tworzy lub wznawia sesję środowiska wykonawczego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy przebieg jest własnością rodzica.
    - Sesje ACP będące własnością rodzica są traktowane jako praca w tle, nawet gdy sesja środowiska wykonawczego jest trwała; ukończenie i dostarczanie między powierzchniami przechodzą przez powiadamiacz zadania rodzica, zamiast zachowywać się jak zwykła sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka terminalne lub osierocone jednorazowe sesje ACP będące własnością rodzica. Trwałe sesje ACP są zachowywane, dopóki pozostaje aktywne powiązanie rozmowy; nieaktualne trwałe sesje bez aktywnego powiązania są zamykane, aby nie mogły zostać cicho wznowione po zakończeniu zadania właściciela lub zniknięciu jego rekordu zadania.
    - Powiązane wiadomości uzupełniające trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, usunięte z fokusu, zresetowane lub nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako zwykły tekst promptu do powiązanego harnessu ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Harness może nadal zachować własną historię upstream, jeśli obsługuje wznawianie.
    - Bezczynne workery środowiska wykonawczego kwalifikują się do czyszczenia po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Reguły routingu natywnego Codex">
    Wyzwalacze w języku naturalnym, które powinny kierować do **natywnego Plugin Codex**,
    gdy jest włączony:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Natywne powiązanie rozmowy Codex jest domyślną ścieżką sterowania czatem.
    Dynamiczne narzędzia OpenClaw nadal wykonują się przez OpenClaw, natomiast
    narzędzia natywne Codex, takie jak shell/apply-patch, wykonują się wewnątrz Codex.
    Dla zdarzeń narzędzi natywnych Codex OpenClaw wstrzykuje natywny przekaźnik hooków
    dla każdej tury, aby hooki Plugin mogły blokować `before_tool_call`, obserwować
    `after_tool_call` i kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie Plugin mogą zażądać jeszcze jednego
    przebiegu modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów narzędzi natywnych Codex
    ani nie przepisuje rekordów wątków Codex. Używaj jawnego ACP tylko wtedy,
    gdy chcesz model środowiska wykonawczego/sesji ACP. Granica obsługi wbudowanego Codex
    jest udokumentowana w
    [kontrakcie obsługi harnessu Codex v1](/pl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Ściągawka wyboru modelu / dostawcy / środowiska uruchomieniowego">
    - `openai-codex/*` — ścieżka OAuth/subskrypcji PI Codex.
    - `openai/*` plus `agentRuntime.id: "codex"` — natywne osadzone środowisko uruchomieniowe app-server Codex.
    - `/codex ...` — natywne sterowanie konwersacją Codex.
    - `/acp ...` lub `runtime: "acp"` — jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze języka naturalnego dla routingu ACP">
    Wyzwalacze, które powinny kierować do środowiska uruchomieniowego ACP:

    - "Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik."
    - "Użyj Gemini CLI do tego zadania w wątku, a następnie utrzymaj dalsze odpowiedzi w tym samym wątku."
    - "Uruchom Codex przez ACP w wątku w tle."

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje uprząż `agentId`,
    wiąże z bieżącą konwersacją lub wątkiem, gdy jest to obsługiwane, i
    kieruje dalsze odpowiedzi do tej sesji aż do zamknięcia/wygaśnięcia. Codex
    podąża tą ścieżką tylko wtedy, gdy ACP/acpx jest jawne albo natywny
    plugin Codex jest niedostępny dla żądanej operacji.

    Dla `sessions_spawn` `runtime: "acp"` jest ogłaszane tylko wtedy, gdy ACP
    jest włączone, żądający nie jest w piaskownicy, a backend środowiska
    uruchomieniowego ACP jest załadowany. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    wysyłanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych
    wywołań `sessions_spawn({ runtime: "acp" })`. Celuje w identyfikatory uprzęży ACP, takie jak `codex`,
    `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
    identyfikatora agenta konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
    jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
    w przeciwnym razie użyj domyślnego środowiska uruchomieniowego subagenta. Gdy agent OpenClaw
    jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
    `runtime.acp.agent` jako bazowego identyfikatora uprzęży.

  </Accordion>
</AccordionGroup>

## ACP a subagenci

Użyj ACP, gdy chcesz zewnętrznego środowiska uruchomieniowego uprzęży. Użyj **natywnego
app-server Codex** do wiązania/sterowania konwersacją Codex, gdy plugin `codex`
jest włączony. Użyj **subagentów**, gdy chcesz natywnych dla OpenClaw
delegowanych uruchomień.

| Obszar             | Sesja ACP                             | Uruchomienie subagenta              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko uruchomieniowe | Plugin backendu ACP (na przykład acpx) | Natywne środowisko uruchomieniowe subagenta OpenClaw |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko uruchomieniowe) |

Zobacz także [Subagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda tak:

1. Płaszczyzna sterowania sesją ACP OpenClaw.
2. Oficjalny plugin środowiska uruchomieniowego `@openclaw/acpx`.
3. Adapter Claude ACP.
4. Mechanizmy środowiska uruchomieniowego/sesji po stronie Claude.

ACP Claude to **sesja uprzęży** ze sterowaniem ACP, wznawianiem sesji,
śledzeniem zadań w tle i opcjonalnym wiązaniem konwersacji/wątku.

Backendy CLI są oddzielnymi lokalnymi awaryjnymi środowiskami uruchomieniowymi tylko tekstowymi — zobacz
[Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada brzmi:

- **Chcesz `/acp spawn`, wiązalne sesje, sterowanie środowiskiem uruchomieniowym albo trwałą pracę uprzęży?** Użyj ACP.
- **Chcesz prostego lokalnego tekstowego trybu awaryjnego przez surowe CLI?** Użyj backendów CLI.

## Powiązane sesje

### Model mentalny

- **Powierzchnia czatu** — miejsce, gdzie ludzie kontynuują rozmowę (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** — trwały stan środowiska uruchomieniowego Codex/Claude/Gemini, do którego kieruje OpenClaw.
- **Wątek/temat potomny** — opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`.
- **Obszar roboczy środowiska uruchomieniowego** — lokalizacja w systemie plików (`cwd`, checkout repozytorium, obszar roboczy backendu), gdzie działa uprząż. Niezależna od powierzchni czatu.

### Wiązania bieżącej konwersacji

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do
utworzonej sesji ACP — bez wątku potomnego, ta sama powierzchnia czatu. OpenClaw nadal
kontroluje transport, uwierzytelnianie, bezpieczeństwo i dostarczanie. Kolejne wiadomości w tej
konwersacji trafiają do tej samej sesji; `/new` i `/reset` resetują
sesję w miejscu; `/acp close` usuwa wiązanie.

Przykłady:

```text
/codex bind                                              # natywne wiązanie Codex, kieruj przyszłe wiadomości tutaj
/codex model gpt-5.4                                     # dostrój powiązany natywny wątek Codex
/codex stop                                              # steruj aktywną turą natywnego Codex
/acp spawn codex --bind here                             # jawny tryb awaryjny ACP dla Codex
/acp spawn codex --thread auto                           # może utworzyć wątek/temat potomny i powiązać go tam
/acp spawn codex --bind here --cwd /workspace/repo       # to samo wiązanie czatu, Codex działa w /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reguły wiązania i wyłączność">
    - `--bind here` i `--thread ...` wzajemnie się wykluczają.
    - `--bind here` działa tylko na kanałach, które ogłaszają wiązanie bieżącej konwersacji; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Wiązania są zachowywane po restartach Gateway.
    - Na Discord, `spawnSessions` bramkuje tworzenie wątku potomnego dla `--thread auto|here` — nie dla `--bind here`.
    - Jeśli uruchomisz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **agenta docelowego**. Brakujące odziedziczone ścieżki (`ENOENT`/`ENOTDIR`) wracają do domyślnego backendu; inne błędy dostępu (np. `EACCES`) są ujawniane jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w powiązanych konwersacjach — polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst dalszych wiadomości trafia do powiązanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje powiązane z wątkiem">
    Gdy wiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Kolejne wiadomości w tym wątku trafiają do powiązanej sesji ACP.
    - Wyjście ACP jest dostarczane z powrotem do tego samego wątku.
    - Usunięcie fokusu/zamknięcie/archiwizacja/limit bezczynności albo wygaśnięcie maksymalnego wieku usuwa wiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` to polecenia Gateway, a nie prompty do uprzęży ACP.

    Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne wysyłanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Tworzenie sesji wątków przez adapter kanału włączone (domyślnie: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Obsługa wiązania wątków zależy od adaptera. Jeśli aktywny adapter kanału
    nie obsługuje wiązań wątków, OpenClaw zwraca jasny
    komunikat o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału, który udostępnia możliwość wiązania sesji/wątku.
    - Bieżąca wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy DM).
    - Kanały pluginów mogą dodać obsługę przez ten sam interfejs wiązania.

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
  Identyfikuje konwersację docelową. Kształty według kanału:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych wiązań grupowych.
- **DM/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` dla stabilnych wiązań grupowych.

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
  Opcjonalny katalog roboczy środowiska uruchomieniowego.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Opcjonalne nadpisanie backendu.
</ParamField>

### Domyślne ustawienia środowiska uruchomieniowego na agenta

Użyj `agents.list[].runtime`, aby raz zdefiniować domyślne ustawienia ACP dla agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator uprzęży, np. `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Priorytet nadpisań dla powiązanych sesji ACP:**

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

- OpenClaw zapewnia, że skonfigurowana sesja ACP istnieje przed użyciem.
- Wiadomości w tym kanale lub temacie trafiają do skonfigurowanej sesji ACP.
- W powiązanych konwersacjach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe wiązania środowiska uruchomieniowego (na przykład utworzone przez przepływy fokusu wątku) nadal obowiązują tam, gdzie istnieją.
- Dla uruchomień ACP między agentami bez jawnego `cwd`, OpenClaw dziedziczy obszar roboczy agenta docelowego z konfiguracji agenta.
- Brakujące odziedziczone ścieżki obszaru roboczego wracają do domyślnego cwd backendu; niebrakujące błędy dostępu są ujawniane jako błędy uruchomienia.

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

    Zobacz [polecenia z ukośnikiem](/pl/tools/slash-commands).

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
  Żąda przepływu wiązania wątku tam, gdzie jest obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` jest jednorazowe; `"session"` jest trwałe. Jeśli `thread: true`, a
  `mode` zostanie pominięte, OpenClaw może domyślnie wybrać trwałe zachowanie zgodnie ze
  ścieżką runtime. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy runtime (walidowany przez politykę backendu/runtime).
  Jeśli zostanie pominięty, ACP spawn dziedziczy przestrzeń roboczą agenta docelowego,
  gdy jest skonfigurowana; brakujące odziedziczone ścieżki wracają do ustawień
  domyślnych backendu, natomiast rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora, używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza
  historię konwersacji przez `session/load`. Wymaga `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` strumieniuje początkowe podsumowania postępu uruchomienia ACP z powrotem do
  sesji żądającej jako zdarzenia systemowe. Akceptowane odpowiedzi obejmują
  `streamLogPath` wskazujące dziennik JSONL w zakresie sesji
  (`<sessionId>.acp-stream.jsonl`), który możesz śledzić, aby zobaczyć pełną historię przekazywania.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Przerywa turę potomną ACP po N sekundach. `0` utrzymuje turę na ścieżce
  Gateway bez limitu czasu. Ta sama wartość jest stosowana do uruchomienia Gateway
  i runtime ACP, aby zablokowane lub wyczerpane limitami środowiska nie zajmowały
  bezterminowo pasa agenta nadrzędnego.
</ParamField>
<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla potomnej sesji ACP. Uruchomienia Codex ACP
  normalizują referencje OpenClaw Codex, takie jak `openai-codex/gpt-5.4`, do konfiguracji
  startowej Codex ACP przed `session/new`; formy z ukośnikiem, takie jak
  `openai-codex/gpt-5.4/high`, ustawiają także wysiłek rozumowania Codex ACP.
  Inne środowiska muszą ogłaszać ACP `models` i obsługiwać
  `session/set_model`; w przeciwnym razie OpenClaw/acpx wyraźnie zgłosi błąd zamiast
  po cichu wracać do domyślnego agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny wysiłek myślenia/rozumowania. Dla Codex ACP `minimal` mapuje się na
  niski wysiłek, `low`/`medium`/`high`/`xhigh` mapują się bezpośrednio, a `off`
  pomija startowe nadpisanie wysiłku rozumowania.
</ParamField>

## Tryby wiązania i wątku spawn

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                               |
    | ------ | ------------------------------------------------------------------------ |
    | `here` | Powiąż bieżącą aktywną konwersację w miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz wiązania bieżącej konwersacji.                                 |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „uczyń ten kanał lub czat obsługiwanym przez Codex”.
    - `--bind here` nie tworzy wątku potomnego.
    - `--bind here` jest dostępne tylko na kanałach, które udostępniają obsługę wiązania bieżącej konwersacji.
    - `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                          |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek potomny, gdy jest obsługiwany. |
    | `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli w żadnym nie jesteś.                       |
    | `off`  | Brak wiązania. Sesja startuje bez powiązania.                                                       |

    Uwagi:

    - Na powierzchniach bez wiązania wątków domyślne zachowanie jest efektywnie `off`.
    - Spawn powiązany z wątkiem wymaga obsługi w polityce kanału:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Użyj `--bind here`, gdy chcesz przypiąć bieżącą konwersację bez tworzenia wątku potomnego.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą być interaktywnymi przestrzeniami roboczymi albo pracą w tle
należącą do rodzica. Ścieżka dostarczania zależy od tego kształtu.

<AccordionGroup>
  <Accordion title="Interaktywne sesje ACP">
    Interaktywne sesje są przeznaczone do kontynuowania rozmowy na widocznej
    powierzchni czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą konwersację z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwałe skonfigurowane `bindings[].type="acp"` kierują pasujące konwersacje do tej samej sesji ACP.

    Kolejne wiadomości w powiązanej konwersacji trafiają bezpośrednio do
    sesji ACP, a wynik ACP jest dostarczany z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do środowiska:

    - Normalne powiązane kontynuacje są wysyłane jako tekst promptu oraz załączniki tylko wtedy, gdy środowisko/backend je obsługuje.
    - Polecenia zarządzające `/acp` i lokalne polecenia Gateway są przechwytywane przed wysłaniem do ACP.
    - Zdarzenia ukończenia wygenerowane przez runtime są materializowane dla każdego celu. Agenci OpenClaw otrzymują wewnętrzną kopertę kontekstu runtime OpenClaw; zewnętrzne środowiska ACP otrzymują zwykły prompt z wynikiem potomnym i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych środowisk ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają tekstu wyzwalacza widocznego dla użytkownika albo zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają uporządkowane w OpenClaw tam, gdzie to możliwe, i nie są traktowane jako treść czatu autorstwa użytkownika.

  </Accordion>
  <Accordion title="Jednorazowe sesje ACP należące do rodzica">
    Jednorazowe sesje ACP uruchamiane przez innego agenta działają jako potomkowie
    w tle, podobnie jak subagenci:

    - Rodzic zleca pracę za pomocą `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Potomek działa we własnej sesji środowiska ACP.
    - Tury potomne działają na tym samym pasie tła, którego używają natywne uruchomienia subagentów, więc wolne środowisko ACP nie blokuje niepowiązanej pracy sesji głównej.
    - Raport ukończenia wraca przez ścieżkę ogłaszania ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia na zwykły prompt ACP przed wysłaniem go do zewnętrznego środowiska, więc środowiska nie widzą znaczników kontekstu runtime specyficznych dla OpenClaw.
    - Rodzic przepisuje wynik potomka normalnym głosem asystenta, gdy przydatna jest odpowiedź skierowana do użytkownika.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między rodzicem
    a potomkiem. Potomek ma już kanał ukończenia z powrotem do
    rodzica.

  </Accordion>
  <Accordion title="sessions_send i dostarczanie A2A">
    `sessions_send` może po uruchomieniu kierować wiadomość do innej sesji. Dla zwykłych
    sesji równorzędnych OpenClaw używa ścieżki kontynuacji agent-do-agenta (A2A)
    po wstrzyknięciu wiadomości:

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól żądającemu i celowi wymienić ograniczoną liczbę tur kontynuacji.
    - Poproś cel o utworzenie wiadomości ogłoszeniowej.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest rozwiązaniem awaryjnym dla wysyłek równorzędnych, w których nadawca potrzebuje
    widocznej kontynuacji. Pozostaje włączona, gdy niepowiązana sesja może
    widzieć i wysyłać wiadomości do celu ACP, na przykład przy szerokich
    ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija kontynuację A2A tylko wtedy, gdy żądający jest
    rodzicem własnego jednorazowego potomka ACP należącego do rodzica. W takim przypadku
    uruchomienie A2A na ścieżce ukończenia zadania może wybudzić rodzica z
    wynikiem potomka, przekazać odpowiedź rodzica z powrotem do potomka i
    utworzyć pętlę echa rodzic/potomek. Wynik `sessions_send` zgłasza
    `delivery.status="skipped"` dla tego przypadku własnego potomka, ponieważ
    ścieżka ukończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Wznów istniejącą sesję">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    zaczynać od nowa. Agent odtwarza historię konwersacji przez
    `session/load`, więc podejmuje pracę z pełnym kontekstem wcześniejszych zdarzeń.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe przypadki użycia:

    - Przekaż sesję Codex z laptopa na telefon — powiedz agentowi, aby podjął pracę tam, gdzie ją przerwano.
    - Kontynuuj sesję kodowania rozpoczętą interaktywnie w CLI, teraz bez interfejsu przez swojego agenta.
    - Podejmij pracę przerwaną przez restart Gateway lub limit bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślny runtime subagenta ignoruje to pole specyficzne dla ACP.
    - `streamTo` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślny runtime subagenta ignoruje to pole specyficzne dla ACP.
    - `resumeSessionId` to lokalny dla hosta identyfikator wznowienia ACP/środowiska, a nie klucz sesji kanału OpenClaw; OpenClaw nadal sprawdza politykę ACP spawn i politykę agenta docelowego przed wysłaniem, natomiast backend ACP lub środowisko odpowiada za autoryzację ładowania tego nadrzędnego identyfikatora.
    - `resumeSessionId` przywraca historię konwersacji nadrzędnego ACP; `thread` i `mode` nadal normalnie dotyczą nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, spawn zakończy się jasnym błędem — bez cichego powrotu do nowej sesji.

  </Accordion>
  <Accordion title="Test dymny po wdrożeniu">
    Po wdrożeniu Gateway uruchom sprawdzenie end-to-end na żywo zamiast
    ufać testom jednostkowym:

    1. Zweryfikuj wdrożoną wersję Gateway i commit na hoście docelowym.
    2. Otwórz tymczasową sesję mostka ACPX do żywego agenta.
    3. Poproś tego agenta o wywołanie `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` oraz zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywisty `childSessionKey` i brak błędu walidatora.
    5. Posprzątaj tymczasową sesję mostka.

    Utrzymuj bramkę na `mode: "run"` i pomiń `streamTo: "parent"` —
    powiązane z wątkiem `mode: "session"` oraz ścieżki przekazywania strumienia to osobne,
    bogatsze przebiegi integracyjne.

  </Accordion>
</AccordionGroup>

## Zgodność z sandboxem

Sesje ACP obecnie działają w runtime hosta, **nie** wewnątrz sandboxa
OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzny harness może odczytywać/zapisywać zgodnie z własnymi uprawnieniami CLI i wybranym `cwd`.
- Polityka piaskownicy OpenClaw **nie** obejmuje wykonywania harnessu ACP.
- OpenClaw nadal wymusza bramki funkcji ACP, dozwolonych agentów, własność sesji, powiązania kanałów i politykę dostarczania Gateway.
- Użyj `runtime: "subagent"` do natywnej pracy OpenClaw z wymuszaną piaskownicą.

</Warning>

Obecne ograniczenia:

- Jeśli sesja żądającego działa w piaskownicy, tworzenie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozpoznawanie celu sesji

Większość działań `/acp` przyjmuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozpoznawania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - próbuje klucza
   - następnie identyfikatora sesji w formacie UUID
   - następnie etykiety
2. Powiązanie bieżącego wątku (jeśli ta rozmowa/wątek jest powiązana z sesją ACP).
3. Awaryjnie bieżąca sesja żądającego.

Powiązania bieżącej rozmowy i powiązania wątków uczestniczą w
kroku 2.

Jeśli żaden cel nie zostanie rozpoznany, OpenClaw zwraca jasny błąd
(`Unable to resolve session target: ...`).

## Kontrolki ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje trwającą turę dla sesji docelowej.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązania celów wątku.              | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje runtime i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb runtime dla sesji docelowej.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Zapisuje ogólną opcję konfiguracji runtime.               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego runtime.            | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu runtime (w sekundach).                | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu runtime.                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji runtime sesji.                     | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                  | `/acp sessions`                                               |
| `/acp doctor`        | Kondycja backendu, możliwości, wykonalne poprawki.        | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączania.   | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje runtime oraz identyfikatory sesji
na poziomie runtime i backendu. Błędy nieobsługiwanych kontrolek są
wyświetlane jasno, gdy backend nie ma danej możliwości. `/acp sessions` odczytuje
magazyn dla bieżącej powiązanej sesji lub sesji żądającego; tokeny celu
(`session-key`, `session-id` lub `session-label`) są rozpoznawane przez
wykrywanie sesji gateway, w tym niestandardowe katalogi główne `session.store`
dla poszczególnych agentów.

### Mapowanie opcji runtime

`/acp` ma wygodne polecenia i ogólny setter. Równoważne
operacje:

| Polecenie                    | Mapuje na                            | Uwagi                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | klucz konfiguracji runtime `model`   | Dla Codex ACP OpenClaw normalizuje `openai-codex/<model>` do identyfikatora modelu adaptera i mapuje sufiksy rozumowania ze slashem, takie jak `openai-codex/gpt-5.4/high`, na `reasoning_effort`. |
| `/acp set thinking <level>`  | klucz konfiguracji runtime `thinking` | Dla Codex ACP OpenClaw wysyła odpowiednie `reasoning_effort`, gdy adapter je obsługuje.                                                                                        |
| `/acp permissions <profile>` | klucz konfiguracji runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | klucz konfiguracji runtime `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | nadpisanie cwd runtime               | Bezpośrednia aktualizacja.                                                                                                                                                     |
| `/acp set <key> <value>`     | ogólne                               | `key=cwd` używa ścieżki nadpisania cwd.                                                                                                                                       |
| `/acp reset-options`         | czyści wszystkie nadpisania runtime  | —                                                                                                                                                                              |

## Harness acpx, konfiguracja Plugin i uprawnienia

Konfigurację harnessu acpx (aliasy Claude Code / Codex / Gemini CLI),
mosty MCP plugin-tools i OpenClaw-tools oraz tryby uprawnień ACP
opisuje
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                                                               | Naprawa                                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Brak Plugin backendu, jest wyłączony albo zablokowany przez `plugins.allow`.                                           | Zainstaluj i włącz Plugin backendu, uwzględnij `acpx` w `plugins.allow`, gdy ta lista dozwolonych jest ustawiona, a następnie uruchom `/acp doctor`.                                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                                                         | Ustaw `acp.enabled=true`.                                                                                                                                                               |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatyczne przekazywanie ze zwykłych wiadomości wątku jest wyłączone.                                                | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne trasowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają.                                     |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na liście dozwolonych.                                                                          | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                                        |
| `/acp doctor` reports backend not ready right after startup                 | Brakuje Plugin backendu, jest wyłączony, zablokowany przez zasady zezwalania/odmawiania albo jego skonfigurowany plik wykonywalny jest niedostępny. | Zainstaluj/włącz Plugin backendu, ponownie uruchom `/acp doctor` i sprawdź błąd instalacji backendu albo zasad, jeśli nadal pozostaje w złym stanie.                                    |
| Harness command not found                                                   | CLI adaptera nie jest zainstalowany, brakuje zewnętrznego Plugin albo pierwsze pobranie `npx` nie powiodło się dla adaptera innego niż Codex. | Uruchom `/acp doctor`, zainstaluj/wstępnie rozgrzej adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx.                                                            |
| Model-not-found from the harness                                            | Identyfikator modelu jest prawidłowy dla innego dostawcy/harnessa, ale nie dla tego celu ACP.                         | Użyj modelu wymienionego przez ten harness, skonfiguruj model w harnessie albo pomiń nadpisanie.                                                                                        |
| Vendor auth error from the harness                                          | OpenClaw działa poprawnie, ale docelowy CLI/dostawca nie jest zalogowany.                                              | Zaloguj się albo podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                                              |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token klucza/identyfikatora/etykiety.                                                                    | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie.                                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej konwersacji, którą można powiązać.                                                    | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązania ACP z bieżącą konwersacją.                                                       | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | Użyto `--thread here` poza kontekstem wątku.                                                                           | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                                            |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                                           | Powiąż ponownie jako właściciel albo użyj innej konwersacji lub wątku.                                                                                                                  |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązywania wątków.                                                                         | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Środowisko uruchomieniowe ACP działa po stronie hosta; sesja żądająca jest sandboxowana.                              | Użyj `runtime="subagent"` z sandboxowanych sesji albo uruchom ACP spawn z sesji niesandboxowanej.                                                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla środowiska uruchomieniowego ACP.                                                      | Użyj `runtime="subagent"` dla wymaganego sandboxowania albo użyj ACP z `sandbox="inherit"` z sesji niesandboxowanej.                                                                     |
| `Cannot apply --model ... did not advertise model support`                  | Docelowy harness nie udostępnia ogólnego przełączania modeli ACP.                                                      | Użyj harnessa, który ogłasza ACP `models`/`session/set_model`, użyj referencji modeli Codex ACP albo skonfiguruj model bezpośrednio w harnessie, jeśli ma własną flagę startową.        |
| Missing ACP metadata for bound session                                      | Nieaktualne/usunięte metadane sesji ACP.                                                                               | Utwórz ponownie za pomocą `/acp spawn`, a następnie ponownie powiąż/ustaw fokus wątku.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapisy/exec w nieinteraktywnej sesji ACP.                                                     | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i zrestartuj gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration).           |
| ACP session fails early with little output                                  | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`.                                  | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Aby uzyskać pełne uprawnienia, ustaw `permissionMode=approve-all`; aby uzyskać łagodną degradację, ustaw `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Proces harnessa zakończył działanie, ale sesja ACP nie zgłosiła ukończenia.                                            | Monitoruj za pomocą `ps aux \| grep acpx`; ręcznie zakończ nieaktualne procesy.                                                                                                        |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Wewnętrzna koperta zdarzenia wyciekła przez granicę ACP.                                                               | Zaktualizuj OpenClaw i ponownie uruchom przepływ ukończenia; zewnętrzne harnessy powinny otrzymywać wyłącznie zwykłe prompty ukończenia.                                                |

## Powiązane

- [Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Backendy CLI](/pl/gateway/cli-backends)
- [Harness Codex](/pl/plugins/codex-harness)
- [Narzędzia sandboxa wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Sub-agenci](/pl/tools/subagents)
