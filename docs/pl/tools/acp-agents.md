---
read_when:
    - Uruchamianie harnessów kodowania przez ACP
    - Konfigurowanie sesji ACP powiązanych z rozmową w kanałach komunikatorów
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, powiązaniem Plugin lub dostarczaniem uzupełnień
    - Obsługa poleceń /acp z czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne środowiska kodowania (Claude Code, Cursor, Gemini CLI, jawny Codex ACP, OpenClaw ACP, OpenCode) przez backend ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-05-10T19:56:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
pozwalają OpenClaw uruchamiać zewnętrzne harnessy kodowania (na przykład Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI i inne
obsługiwane harnessy ACPX) przez plugin backendu ACP.

Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

<Note>
**ACP to ścieżka zewnętrznego harnessu, a nie domyślna ścieżka Codex.** Natywny
plugin serwera aplikacji Codex obsługuje kontrolki `/codex ...` oraz domyślne
wbudowane środowisko uruchomieniowe `openai/gpt-*` dla tur agentów; ACP obsługuje
kontrolki `/acp ...` oraz sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                         | Użyj                                  | Uwagi                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać lub kontrolować Codex w bieżącej konwersacji                                           | `/codex bind`, `/codex threads`       | Natywna ścieżka serwera aplikacji Codex, gdy plugin `codex` jest włączony; obejmuje powiązane odpowiedzi na czacie, przekazywanie obrazów, model/szybkość/uprawnienia, zatrzymanie i sterowanie. ACP jest jawną ścieżką awaryjną |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona                             | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska uruchomieniowego                                                                  |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta                     | [`openclaw acp`](/pl/cli/acp)            | Tryb mostu. IDE/klient komunikuje się z OpenClaw przez ACP za pośrednictwem stdio/WebSocket                                                                                                           |
| Ponownie użyć lokalnego AI CLI jako tekstowego modelu awaryjnego                                | [Backendy CLI](/pl/gateway/cli-backends) | To nie ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak środowiska uruchomieniowego harnessu                                                                                                    |

## Czy to działa od razu?

Tak, po zainstalowaniu oficjalnego pluginu środowiska uruchomieniowego ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouty źródłowe mogą używać lokalnego pluginu workspace `extensions/acpx` po
`pnpm install`. Uruchom `/acp doctor`, aby sprawdzić gotowość.

OpenClaw uczy agentów o uruchamianiu ACP tylko wtedy, gdy ACP jest **rzeczywiście
używalne**: ACP musi być włączone, dispatch nie może być wyłączony, bieżąca
sesja nie może być zablokowana przez sandbox, a backend środowiska uruchomieniowego musi być
załadowany. Jeśli te warunki nie są spełnione, Skills pluginu ACP i wskazówki
ACP `sessions_spawn` pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Pułapki pierwszego uruchomienia">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny spis pluginów i **musi** zawierać `acpx`; w przeciwnym razie zainstalowany backend ACP jest celowo blokowany, a `/acp doctor` zgłasza brakujący wpis listy dozwolonych.
    - Adapter Codex ACP jest przygotowywany z pluginem `acpx` i uruchamiany lokalnie, gdy to możliwe.
    - Codex ACP działa z izolowanym `CODEX_HOME`; OpenClaw kopiuje tylko zaufane wpisy projektów z konfiguracji Codex hosta i ufa aktywnemu workspace, pozostawiając auth, powiadomienia i hooki w konfiguracji hosta.
    - Inne docelowe adaptery harnessów nadal mogą być pobierane na żądanie przez `npx` przy pierwszym użyciu.
    - Auth dostawcy nadal musi istnieć na hoście dla tego harnessu.
    - Jeśli host nie ma dostępu do npm lub sieci, pobrania adapterów przy pierwszym uruchomieniu nie powiodą się, dopóki cache nie zostaną wstępnie rozgrzane albo adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska uruchomieniowego">
    ACP uruchamia rzeczywisty zewnętrzny proces harnessu. OpenClaw odpowiada za routing,
    stan zadań w tle, dostarczanie, powiązania i politykę; harness
    odpowiada za logowanie do dostawcy, katalog modeli, zachowanie systemu plików i
    narzędzia natywne.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony i zdrowy backend.
    - Identyfikator docelowy jest dozwolony przez `acp.allowedAgents`, gdy ta lista dozwolonych jest ustawiona.
    - Polecenie harnessu może uruchomić się na hoście Gateway.
    - Auth dostawcy jest obecne dla tego harnessu (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego harnessu - identyfikatory modeli nie są przenośne między harnessami.
    - Żądany `cwd` istnieje i jest dostępny, albo pomiń `cwd` i pozwól backendowi użyć wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów uprawnień, więc uruchomienia kodowania intensywnie zapisujące/wykonujące zwykle potrzebują profilu uprawnień ACPX, który może działać bezobsługowo.

  </Accordion>
</AccordionGroup>

Narzędzia pluginów OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie
udostępniane harnessom ACP. Włącz jawne mosty MCP w
[Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup) tylko wtedy, gdy harness
powinien wywoływać te narzędzia bezpośrednio.

## Obsługiwane cele harnessów

Z backendem `acpx` używaj tych identyfikatorów harnessów jako celów
`/acp spawn <id>` lub `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator harnessu | Typowy backend                                | Uwagi                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Wymaga auth Claude Code na hoście.                                                  |
| `codex`    | Adapter Codex ACP                              | Jawna ścieżka awaryjna ACP tylko wtedy, gdy natywne `/codex` jest niedostępne lub zażądano ACP. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Wymaga auth Copilot CLI/środowiska uruchomieniowego.                                |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Nadpisz polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP. |
| `droid`    | Factory Droid CLI                              | Wymaga auth Factory/Droid albo `FACTORY_API_KEY` w środowisku harnessu.             |
| `gemini`   | Adapter Gemini CLI ACP                         | Wymaga auth Gemini CLI albo konfiguracji klucza API.                                |
| `iflow`    | iFlow CLI                                      | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `kilocode` | Kilo Code CLI                                  | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `kimi`     | Kimi/Moonshot CLI                              | Wymaga auth Kimi/Moonshot na hoście.                                                |
| `kiro`     | Kiro CLI                                       | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `opencode` | Adapter OpenCode ACP                           | Wymaga auth OpenCode CLI/dostawcy.                                                  |
| `openclaw` | Most OpenClaw Gateway przez `openclaw acp`     | Pozwala harnessowi świadomemu ACP komunikować się z powrotem z sesją OpenClaw Gateway. |
| `pi`       | Pi/wbudowane środowisko uruchomieniowe OpenClaw | Używane do eksperymentów z harnessami natywnymi dla OpenClaw.                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Wymaga auth zgodnego z Qwen na hoście.                                              |

Niestandardowe aliasy agentów acpx można skonfigurować w samym acpx, ale polityka OpenClaw
nadal sprawdza `acp.allowedAgents` oraz każde mapowanie
`agents.list[].runtime.acp.agent` przed dispatch.

## Runbook operatora

Szybki przepływ `/acp` z czatu:

<Steps>
  <Step title="Uruchom">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` albo jawne
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Pracuj">
    Kontynuuj w powiązanej konwersacji lub wątku (albo wskaż sesję
    kluczem wprost).
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
    - Uruchomienie tworzy lub wznawia sesję środowiska uruchomieniowego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy uruchomienie należy do rodzica.
    - Sesje ACP należące do rodzica są traktowane jako praca w tle nawet wtedy, gdy sesja środowiska uruchomieniowego jest trwała; ukończenie i dostarczanie między powierzchniami przechodzą przez powiadamiacz zadania rodzica zamiast działać jak zwykła sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka terminalne lub osierocone jednorazowe sesje ACP należące do rodzica. Trwałe sesje ACP są zachowywane, dopóki pozostaje aktywne powiązanie konwersacji; nieaktualne trwałe sesje bez aktywnego powiązania są zamykane, aby nie można było ich po cichu wznowić po zakończeniu zadania właściciela lub usunięciu jego rekordu zadania.
    - Powiązane wiadomości uzupełniające trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, odfokusowane, zresetowane lub nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako zwykły tekst promptu do powiązanego harnessu ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Harness może nadal zachowywać własną historię upstream, jeśli obsługuje wznawianie.
    - Plugin acpx sprząta należące do OpenClaw drzewa procesów wrappera i adaptera po `close` oraz zbiera nieaktualne osierocone procesy ACPX należące do OpenClaw podczas uruchamiania Gateway.
    - Bezczynne workery środowiska uruchomieniowego kwalifikują się do sprzątania po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Reguły natywnego routingu Codex">
    Wyzwalacze w języku naturalnym, które powinny być routowane do **natywnego pluginu Codex**,
    gdy jest włączony:

    - "Powiąż ten kanał Discord z Codex."
    - "Dołącz ten czat do wątku Codex `<id>`."
    - "Pokaż wątki Codex, a potem powiąż ten."

    Natywne powiązanie konwersacji Codex jest domyślną ścieżką sterowania czatem.
    Dynamiczne narzędzia OpenClaw nadal wykonują się przez OpenClaw, a
    narzędzia natywne dla Codex, takie jak shell/apply-patch, wykonują się wewnątrz Codex.
    W przypadku zdarzeń narzędzi natywnych dla Codex OpenClaw wstrzykuje natywny
    przekaźnik hooków dla każdej tury, aby hooki Plugin mogły blokować `before_tool_call`, obserwować
    `after_tool_call` oraz kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie Plugin mogą zażądać jeszcze jednego
    przebiegu modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów narzędzi natywnych dla Codex
    ani nie przepisuje rekordów wątku Codex. Używaj jawnego ACP tylko
    wtedy, gdy chcesz użyć modelu runtime/sesji ACP. Granica wsparcia
    osadzonego Codex jest udokumentowana w
    [kontrakcie wsparcia v1 uprzęży Codex](/pl/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Ściągawka wyboru modelu / dostawcy / runtime">
    - `openai-codex/*` - starsza ścieżka modelu Codex OAuth/subskrypcji naprawiana przez doctor.
    - `openai/*` - natywny osadzony runtime serwera aplikacji Codex dla tur agenta OpenAI.
    - `/codex ...` - natywne sterowanie konwersacją Codex.
    - `/acp ...` lub `runtime: "acp"` - jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze routingu ACP w języku naturalnym">
    Wyzwalacze, które powinny kierować do runtime ACP:

    - „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik.”
    - „Użyj Gemini CLI do tego zadania w wątku, a następnie zachowaj dalsze odpowiedzi w tym samym wątku.”
    - „Uruchom Codex przez ACP w wątku w tle.”

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje `agentId` uprzęży,
    wiąże się z bieżącą konwersacją lub wątkiem, gdy jest to obsługiwane, i
    kieruje dalsze odpowiedzi do tej sesji aż do zamknięcia/wygaśnięcia. Codex
    podąża tą ścieżką tylko wtedy, gdy ACP/acpx jest jawne albo natywny Plugin Codex
    jest niedostępny dla żądanej operacji.

    Dla `sessions_spawn`, `runtime: "acp"` jest ogłaszane tylko wtedy, gdy ACP
    jest włączone, żądający nie jest sandboxowany, a backend runtime ACP
    jest załadowany. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    wysyłanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych
    wywołań `sessions_spawn({ runtime: "acp" })`. Celuje w identyfikatory uprzęży ACP, takie jak `codex`,
    `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
    identyfikatora agenta konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
    jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
    w przeciwnym razie użyj domyślnego runtime podagenta. Gdy agent OpenClaw
    jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
    `runtime.acp.agent` jako bazowego identyfikatora uprzęży.

  </Accordion>
</AccordionGroup>

## ACP kontra podagenci

Używaj ACP, gdy chcesz użyć zewnętrznego runtime uprzęży. Używaj **natywnego
serwera aplikacji Codex** do powiązania/sterowania konwersacją Codex, gdy Plugin
`codex` jest włączony. Używaj **podagentów**, gdy chcesz uruchomień
delegowanych natywnie w OpenClaw.

| Obszar          | Sesja ACP                              | Uruchomienie podagenta              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backendu ACP (na przykład acpx) | Natywny runtime podagenta OpenClaw  |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślny runtime) |

Zobacz też [Podagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda następująco:

1. Płaszczyzna sterowania sesją ACP OpenClaw.
2. Oficjalny Plugin runtime `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Mechanizmy runtime/sesji po stronie Claude.

ACP Claude jest **sesją uprzęży** z kontrolkami ACP, wznawianiem sesji,
śledzeniem zadań w tle oraz opcjonalnym powiązaniem konwersacji/wątku.

Backendy CLI są osobnymi tekstowymi lokalnymi runtime awaryjnymi - zobacz
[Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada brzmi:

- **Chcesz `/acp spawn`, powiązywalne sesje, kontrolki runtime albo trwałą pracę uprzęży?** Użyj ACP.
- **Chcesz prostą lokalną tekstową ścieżkę awaryjną przez surowe CLI?** Użyj backendów CLI.

## Sesje powiązane

### Model mentalny

- **Powierzchnia czatu** - miejsce, w którym ludzie kontynuują rozmowę (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** - trwały stan runtime Codex/Claude/Gemini, do którego OpenClaw kieruje komunikację.
- **Wątek/temat podrzędny** - opcjonalna dodatkowa powierzchnia komunikacji tworzona tylko przez `--thread ...`.
- **Obszar roboczy runtime** - lokalizacja systemu plików (`cwd`, checkout repozytorium, obszar roboczy backendu), w której działa uprząż. Niezależna od powierzchni czatu.

### Powiązania bieżącej konwersacji

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do
uruchomionej sesji ACP - bez wątku podrzędnego, ta sama powierzchnia czatu. OpenClaw nadal
posiada transport, uwierzytelnianie, bezpieczeństwo i dostarczanie. Dalsze wiadomości w tej
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
    - `--bind here` działa tylko na kanałach, które ogłaszają powiązanie bieżącej konwersacji; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Powiązania utrzymują się po restartach Gateway.
    - W Discord `spawnSessions` bramkuje tworzenie wątku podrzędnego dla `--thread auto|here` - nie `--bind here`.
    - Jeśli uruchomisz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **agenta docelowego**. Brakujące odziedziczone ścieżki (`ENOENT`/`ENOTDIR`) przechodzą awaryjnie na domyślne ustawienie backendu; inne błędy dostępu (np. `EACCES`) pojawiają się jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w powiązanych konwersacjach - polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst dalszych odpowiedzi trafia do powiązanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje powiązane z wątkiem">
    Gdy powiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Dalsze wiadomości w tym wątku trafiają do powiązanej sesji ACP.
    - Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
    - Unfocus/zamknięcie/archiwizacja/limit bezczynności albo wygaśnięcie maksymalnego wieku usuwa powiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` są poleceniami Gateway, a nie promptami do uprzęży ACP.

    Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne wysyłanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Włączone uruchamianie sesji wątków adaptera kanału (domyślnie: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Obsługa powiązań wątków jest specyficzna dla adaptera. Jeśli aktywny adapter
    kanału nie obsługuje powiązań wątków, OpenClaw zwraca jasny
    komunikat o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału, który udostępnia możliwość powiązania sesji/wątku.
    - Bieżąca wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy DM).
    - Kanały Plugin mogą dodać obsługę przez ten sam interfejs powiązań.

  </Accordion>
</AccordionGroup>

## Trwałe powiązania kanałów

Dla nieefemerycznych przepływów pracy skonfiguruj trwałe powiązania ACP w
wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe powiązanie konwersacji ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje konwersację docelową. Kształty zależne od kanału:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kanał/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Preferuj stabilne identyfikatory Slack; powiązania kanałów dopasowują także odpowiedzi w wątkach tego kanału.
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` dla stabilnych powiązań grup.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Identyfikator właścicielskiego agenta OpenClaw.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Opcjonalne nadpisanie ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Opcjonalna etykieta widoczna dla operatora.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Opcjonalny katalog roboczy runtime.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Opcjonalne nadpisanie backendu.
</ParamField>

### Domyślne ustawienia runtime dla agenta

Użyj `agents.list[].runtime`, aby zdefiniować domyślne ustawienia ACP raz dla agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator uprzęży, np. `codex` albo `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Kolejność pierwszeństwa nadpisań dla powiązanych sesji ACP:**

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
- Wiadomości w tym kanale lub temacie są kierowane do skonfigurowanej sesji ACP.
- W powiązanych konwersacjach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe powiązania środowiska uruchomieniowego (na przykład utworzone przez przepływy skupienia wątku) nadal mają zastosowanie tam, gdzie są obecne.
- W przypadku uruchomień ACP między agentami bez jawnego `cwd`, OpenClaw dziedziczy obszar roboczy agenta docelowego z konfiguracji agenta.
- Brakujące odziedziczone ścieżki obszaru roboczego wracają do domyślnego cwd backendu; niebrakujące błędy dostępu są zgłaszane jako błędy uruchomienia.

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
    `runtime` domyślnie ma wartość `subagent`, więc ustaw jawnie `runtime: "acp"`
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

    Zobacz [Polecenia slash](/pl/tools/slash-commands).

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
  Żąda przepływu powiązania wątku tam, gdzie jest obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` jest jednorazowe; `"session"` jest trwałe. Jeśli `thread: true`, a
  `mode` zostanie pominięte, OpenClaw może domyślnie użyć trwałego zachowania zgodnie ze
  ścieżką środowiska uruchomieniowego. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy środowiska uruchomieniowego (walidowany przez politykę backendu/środowiska
  uruchomieniowego). Jeśli zostanie pominięty, uruchomienie ACP dziedziczy obszar roboczy agenta docelowego,
  gdy jest skonfigurowany; brakujące odziedziczone ścieżki wracają do domyślnych
  ustawień backendu, a rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora, używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent
  odtwarza historię konwersacji przez `session/load`. Wymaga
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` strumieniuje podsumowania postępu początkowego uruchomienia ACP z powrotem do
  sesji żądającej jako zdarzenia systemowe. Akceptowane odpowiedzi obejmują
  `streamLogPath` wskazujące na ograniczony do sesji dziennik JSONL
  (`<sessionId>.acp-stream.jsonl`), który możesz śledzić, aby zobaczyć pełną historię przekazywania.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Przerywa turę podrzędną ACP po N sekundach. `0` utrzymuje turę na
  ścieżce Gateway bez limitu czasu. Ta sama wartość jest stosowana do uruchomienia Gateway
  i środowiska uruchomieniowego ACP, aby zablokowane lub wyczerpane limitami harnessy nie
  zajmowały pasa agenta nadrzędnego bez końca.
</ParamField>
<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla sesji podrzędnej ACP. Uruchomienia Codex ACP
  normalizują referencje OpenClaw Codex, takie jak `openai-codex/gpt-5.4`, do konfiguracji
  startowej Codex ACP przed `session/new`; formy slash, takie jak
  `openai-codex/gpt-5.4/high`, ustawiają również wysiłek rozumowania Codex ACP.
  Inne harnessy muszą reklamować ACP `models` i obsługiwać
  `session/set_model`; w przeciwnym razie OpenClaw/acpx zgłosi jasny błąd zamiast
  po cichu wrócić do domyślnego agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny wysiłek myślenia/rozumowania. Dla Codex ACP `minimal` mapuje się na
  niski wysiłek, `low`/`medium`/`high`/`xhigh` mapują się bezpośrednio, a `off`
  pomija startowe nadpisanie wysiłku rozumowania.
</ParamField>

## Tryby powiązania i wątku przy uruchamianiu

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                            |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Powiąż bieżącą aktywną konwersację w miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz powiązania bieżącej konwersacji.                            |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „uczyń ten kanał lub czat opartym na Codex”.
    - `--bind here` nie tworzy wątku podrzędnego.
    - `--bind here` jest dostępne tylko w kanałach, które udostępniają obsługę powiązania bieżącej konwersacji.
    - `--bind` i `--thread` nie mogą być połączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                         |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek podrzędny, gdy jest obsługiwany. |
    | `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli nie jesteś w wątku.                       |
    | `off`  | Brak powiązania. Sesja uruchamia się bez powiązania.                                               |

    Uwagi:

    - Na powierzchniach bez powiązania wątków domyślne zachowanie jest w praktyce `off`.
    - Uruchomienie powiązane z wątkiem wymaga obsługi przez politykę kanału:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Użyj `--bind here`, gdy chcesz przypiąć bieżącą konwersację bez tworzenia wątku podrzędnego.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą być albo interaktywnymi obszarami roboczymi, albo pracą w tle
należącą do rodzica. Ścieżka dostarczania zależy od tej formy.

<AccordionGroup>
  <Accordion title="Interaktywne sesje ACP">
    Sesje interaktywne mają służyć do dalszej rozmowy na widocznej powierzchni
    czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą konwersację z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwale skonfigurowane `bindings[].type="acp"` kierują pasujące konwersacje do tej samej sesji ACP.

    Wiadomości uzupełniające w powiązanej konwersacji są kierowane bezpośrednio do
    sesji ACP, a dane wyjściowe ACP są dostarczane z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do harnessu:

    - Zwykłe powiązane kontynuacje są wysyłane jako tekst promptu oraz załączniki tylko wtedy, gdy harness/backend je obsługuje.
    - Polecenia zarządzania `/acp` i lokalne polecenia Gateway są przechwytywane przed wysłaniem do ACP.
    - Zdarzenia ukończenia wygenerowane przez środowisko uruchomieniowe są materializowane dla każdego celu. Agenci OpenClaw otrzymują wewnętrzną kopertę kontekstu środowiska uruchomieniowego OpenClaw; zewnętrzne harnessy ACP otrzymują zwykły prompt z wynikiem dziecka i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych harnessów ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają widocznego dla użytkownika tekstu wyzwalającego lub zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają w OpenClaw ustrukturyzowane tam, gdzie to możliwe, i nie są traktowane jako treść czatu autorstwa użytkownika.

  </Accordion>
  <Accordion title="Jednorazowe sesje ACP należące do rodzica">
    Jednorazowe sesje ACP uruchamiane przez inne uruchomienie agenta są dziećmi
    w tle, podobnie jak podagenci:

    - Rodzic prosi o pracę za pomocą `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Dziecko działa we własnej sesji harnessu ACP.
    - Tury dziecka działają na tym samym pasie tła, którego używają natywne uruchomienia podagentów, więc wolny harness ACP nie blokuje niepowiązanej pracy sesji głównej.
    - Raporty ukończenia wracają przez ścieżkę ogłaszania ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia na zwykły prompt ACP przed wysłaniem go do zewnętrznego harnessu, więc harnessy nie widzą znaczników kontekstu środowiska uruchomieniowego specyficznych dla OpenClaw.
    - Rodzic przepisuje wynik dziecka normalnym głosem asystenta, gdy przydatna jest odpowiedź widoczna dla użytkownika.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między rodzicem
    a dzieckiem. Dziecko ma już kanał ukończenia z powrotem do
    rodzica.

  </Accordion>
  <Accordion title="sessions_send i dostarczanie A2A">
    `sessions_send` może kierować do innej sesji po uruchomieniu. Dla zwykłych
    sesji równorzędnych OpenClaw używa ścieżki kontynuacji agent-do-agenta (A2A)
    po wstrzyknięciu wiadomości:

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól żądającemu i celowi wymienić ograniczoną liczbę tur kontynuacji.
    - Poproś cel o utworzenie wiadomości ogłoszeniowej.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest rozwiązaniem awaryjnym dla wysyłek równorzędnych, w których nadawca potrzebuje
    widocznej kontynuacji. Pozostaje włączona, gdy niepowiązana sesja może
    widzieć cel ACP i wysyłać do niego wiadomości, na przykład przy szerokich
    ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija kontynuację A2A tylko wtedy, gdy żądający jest
    rodzicem własnego jednorazowego dziecka ACP należącego do rodzica. W takim przypadku
    uruchomienie A2A na ścieżce ukończenia zadania może obudzić rodzica z
    wynikiem dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i
    utworzyć pętlę echa rodzic/dziecko. Wynik `sessions_send` zgłasza
    `delivery.status="skipped"` dla tego przypadku należącego dziecka, ponieważ
    ścieżka ukończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Wznawianie istniejącej sesji">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    zaczynać od nowa. Agent odtwarza historię konwersacji przez
    `session/load`, więc wraca z pełnym kontekstem tego, co było wcześniej.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe przypadki użycia:

    - Przekaż sesję Codex z laptopa na telefon - powiedz agentowi, aby kontynuował od miejsca, w którym przerwałeś.
    - Kontynuuj sesję kodowania rozpoczętą interaktywnie w CLI, teraz bez interfejsu przez agenta.
    - Wznów pracę przerwaną przez restart Gateway lub limit czasu bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślne środowisko uruchomieniowe podagenta ignoruje to pole wyłącznie dla ACP.
    - `streamTo` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślne środowisko uruchomieniowe podagenta ignoruje to pole wyłącznie dla ACP.
    - `resumeSessionId` to lokalny dla hosta identyfikator wznowienia ACP/harnessu, a nie klucz sesji kanału OpenClaw; OpenClaw nadal sprawdza politykę uruchomienia ACP i politykę agenta docelowego przed wysłaniem, podczas gdy backend ACP lub harness odpowiada za autoryzację ładowania tego identyfikatora upstream.
    - `resumeSessionId` przywraca historię konwersacji upstream ACP; `thread` i `mode` nadal normalnie dotyczą nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie zakończy się jasnym błędem - bez cichego powrotu do nowej sesji.

  </Accordion>
  <Accordion title="Test smoke po wdrożeniu">
    Po wdrożeniu gateway uruchom rzeczywisty kompleksowy test zamiast
    ufać testom jednostkowym:

    1. Zweryfikuj wdrożoną wersję Gateway i commit na hoście docelowym.
    2. Otwórz tymczasową sesję mostka ACPX do działającego agenta.
    3. Poproś tego agenta o wywołanie `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` oraz zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywisty `childSessionKey` oraz brak błędu walidatora.
    5. Wyczyść tymczasową sesję mostka.

    Pozostaw bramkę na `mode: "run"` i pomiń `streamTo: "parent"` -
    powiązane z wątkiem `mode: "session"` oraz ścieżki przekazywania strumienia są osobnymi,
    bogatszymi przebiegami integracyjnymi.

  </Accordion>
</AccordionGroup>

## Zgodność z piaskownicą

Sesje ACP działają obecnie w środowisku uruchomieniowym hosta, **nie** wewnątrz
piaskownicy OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzny harness może odczytywać/zapisywać zgodnie z własnymi uprawnieniami CLI i wybranym `cwd`.
- Polityka piaskownicy OpenClaw **nie** obejmuje wykonywania harness ACP.
- OpenClaw nadal wymusza bramki funkcji ACP, dozwolonych agentów, własność sesji, powiązania kanałów oraz politykę dostarczania Gateway.
- Użyj `runtime: "subagent"` dla natywnej pracy OpenClaw wymuszanej przez piaskownicę.

</Warning>

Obecne ograniczenia:

- Jeśli sesja żądająca działa w piaskownicy, tworzenie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozwiązywanie celu sesji

Większość działań `/acp` akceptuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozwiązywania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - próbuje klucza
   - następnie identyfikatora sesji w kształcie UUID
   - następnie etykiety
2. Bieżące powiązanie wątku (jeśli ta rozmowa/wątek jest powiązana z sesją ACP).
3. Zapasowa bieżąca sesja żądająca.

Powiązania bieżącej rozmowy i powiązania wątku uczestniczą w
kroku 2.

Jeśli nie uda się rozwiązać żadnego celu, OpenClaw zwraca jasny błąd
(`Unable to resolve session target: ...`).

## Kontrolki ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje wykonywaną turę dla sesji docelowej.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterowania do działającej sesji.        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązania celów wątku.              | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje środowiska uruchomieniowego, możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb środowiska uruchomieniowego dla sesji docelowej. | `/acp set-mode plan`                                          |
| `/acp set`           | Zapisuje ogólną opcję konfiguracji środowiska uruchomieniowego. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego środowiska uruchomieniowego. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu środowiska uruchomieniowego (sekundy). | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu środowiska uruchomieniowego.    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska uruchomieniowego sesji. | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                  | `/acp sessions`                                               |
| `/acp doctor`        | Stan backendu, możliwości, możliwe do wykonania poprawki. | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączenia.   | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje środowiska uruchomieniowego oraz identyfikatory sesji na poziomie środowiska uruchomieniowego i
backendu. Błędy nieobsługiwanych kontrolek są pokazywane
jasno, gdy backend nie ma danej możliwości. `/acp sessions` odczytuje
magazyn dla bieżącej powiązanej lub żądającej sesji; tokeny celu
(`session-key`, `session-id` lub `session-label`) są rozwiązywane przez
wykrywanie sesji Gateway, w tym niestandardowe katalogi główne `session.store`
dla poszczególnych agentów.

### Mapowanie opcji środowiska uruchomieniowego

`/acp` ma wygodne polecenia oraz ogólny setter. Równoważne
operacje:

| Polecenie                    | Mapuje na                            | Uwagi                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | klucz konfiguracji środowiska uruchomieniowego `model` | Dla Codex ACP OpenClaw normalizuje `openai-codex/<model>` do identyfikatora modelu adaptera i mapuje sufiksy rozumowania po ukośniku, takie jak `openai-codex/gpt-5.4/high`, na `reasoning_effort`.         |
| `/acp set thinking <level>`  | opcja kanoniczna `thinking`          | OpenClaw wysyła odpowiednik reklamowany przez backend, gdy jest dostępny, preferując `thinking`, następnie `effort`, `reasoning_effort` lub `thought_level`. Dla Codex ACP adapter mapuje wartości na `reasoning_effort`. |
| `/acp permissions <profile>` | opcja kanoniczna `permissionProfile` | OpenClaw wysyła odpowiednik reklamowany przez backend, gdy jest dostępny, taki jak `approval_policy`, `permission_profile`, `permissions` lub `permission_mode`.                                         |
| `/acp timeout <seconds>`     | opcja kanoniczna `timeoutSeconds`    | OpenClaw wysyła odpowiednik reklamowany przez backend, gdy jest dostępny, taki jak `timeout` lub `timeout_seconds`.                                                                                       |
| `/acp cwd <path>`            | nadpisanie cwd środowiska uruchomieniowego | Bezpośrednia aktualizacja.                                                                                                                                                                                 |
| `/acp set <key> <value>`     | ogólne                               | `key=cwd` używa ścieżki nadpisania cwd.                                                                                                                                                                    |
| `/acp reset-options`         | czyści wszystkie nadpisania środowiska uruchomieniowego | -                                                                                                                                                                                                          |

## Harness acpx, konfiguracja Plugin i uprawnienia

Informacje o konfiguracji harness acpx (aliasy Claude Code / Codex / Gemini CLI),
mostkach MCP plugin-tools i OpenClaw-tools oraz trybach
uprawnień ACP znajdziesz w
[Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw | Prawdopodobna przyczyna | Rozwiązanie |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` | Brak Pluginu backendu, jest wyłączony albo zablokowany przez `plugins.allow`. | Zainstaluj i włącz Plugin backendu, uwzględnij `acpx` w `plugins.allow`, gdy ta lista dozwolonych jest ustawiona, a następnie uruchom `/acp doctor`. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP jest globalnie wyłączone. | Ustaw `acp.enabled=true`. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Automatyczne wysyłanie ze zwykłych wiadomości wątku jest wyłączone. | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne kierowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają. |
| `ACP agent "<id>" is not allowed by policy` | Agent nie znajduje się na liście dozwolonych. | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`. |
| `/acp doctor` zgłasza, że backend nie jest gotowy tuż po uruchomieniu | Brakuje Pluginu backendu, jest wyłączony, zablokowany przez zasady allow/deny albo jego skonfigurowany plik wykonywalny jest niedostępny. | Zainstaluj/włącz Plugin backendu, uruchom ponownie `/acp doctor` i sprawdź błąd instalacji backendu lub zasad, jeśli nadal pozostaje w złym stanie. |
| Nie znaleziono polecenia harnessu | Adapter CLI nie jest zainstalowany, brakuje zewnętrznego Pluginu albo pierwsze pobranie przez `npx` nie powiodło się dla adaptera innego niż Codex. | Uruchom `/acp doctor`, zainstaluj/wstępnie rozgrzej adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx. |
| Komunikat model-not-found z harnessu | Identyfikator modelu jest prawidłowy dla innego dostawcy/harnessu, ale nie dla tego celu ACP. | Użyj modelu wymienionego przez ten harness, skonfiguruj model w harnessie albo pomiń nadpisanie. |
| Błąd uwierzytelniania dostawcy z harnessu | OpenClaw działa poprawnie, ale docelowy CLI/dostawca nie jest zalogowany. | Zaloguj się albo podaj wymagany klucz dostawcy w środowisku hosta Gateway. |
| `Unable to resolve session target: ...` | Nieprawidłowy token klucza/identyfikatora/etykiety. | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie. |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej rozmowy możliwej do powiązania. | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania. |
| `Conversation bindings are unavailable for <channel>.` | Adapter nie ma możliwości wiązania ACP z bieżącą rozmową. | Użyj `/acp spawn ... --thread ...`, gdy jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału. |
| `--thread here requires running /acp spawn inside an active ... thread` | Użyto `--thread here` poza kontekstem wątku. | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Inny użytkownik jest właścicielem aktywnego celu powiązania. | Powiąż ponownie jako właściciel albo użyj innej rozmowy lub wątku. |
| `Thread bindings are unavailable for <channel>.` | Adapter nie ma możliwości wiązania wątków. | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | Środowisko uruchomieniowe ACP działa po stronie hosta; sesja żądająca jest sandboxowana. | Użyj `runtime="subagent"` z sandboxowanych sesji albo uruchom ACP spawn z sesji niesandboxowanej. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | Zażądano `sandbox="require"` dla środowiska uruchomieniowego ACP. | Użyj `runtime="subagent"` dla wymaganego sandboxingu albo użyj ACP z `sandbox="inherit"` z sesji niesandboxowanej. |
| `Cannot apply --model ... did not advertise model support` | Docelowy harness nie udostępnia ogólnego przełączania modeli ACP. | Użyj harnessu, który ogłasza ACP `models`/`session/set_model`, użyj referencji modeli Codex ACP albo skonfiguruj model bezpośrednio w harnessie, jeśli ma własną flagę startową. |
| Brak metadanych ACP dla powiązanej sesji | Nieaktualne/usunięte metadane sesji ACP. | Utwórz ponownie za pomocą `/acp spawn`, a następnie ponownie powiąż/ustaw fokus wątku. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blokuje zapisy/exec w nieinteraktywnej sesji ACP. | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie Gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration). |
| Sesja ACP kończy się wcześnie z niewielką ilością danych wyjściowych | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi Gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bezterminowo po ukończeniu pracy | Proces harnessu zakończył działanie, ale sesja ACP nie zgłosiła ukończenia. | Zaktualizuj OpenClaw; bieżące czyszczenie acpx zbiera nieaktualne procesy opakowania i adaptera należące do OpenClaw przy zamknięciu oraz starcie Gateway. |
| Harness widzi `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` | Wewnętrzna koperta zdarzenia wyciekła przez granicę ACP. | Zaktualizuj OpenClaw i ponownie uruchom przepływ ukończenia; zewnętrzne harnessy powinny otrzymywać tylko zwykłe monity ukończenia. |

## Powiązane

- [Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie do agenta](/pl/tools/agent-send)
- [Backendy CLI](/pl/gateway/cli-backends)
- [Harness Codex](/pl/plugins/codex-harness)
- [Środowisko uruchomieniowe harnessu Codex](/pl/plugins/codex-harness-runtime)
- [Narzędzia sandboxu wieloagentowego](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Subagenci](/pl/tools/subagents)
