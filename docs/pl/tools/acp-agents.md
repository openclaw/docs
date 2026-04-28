---
read_when:
    - Uruchamianie harnessów kodowania przez ACP
    - Konfigurowanie sesji ACP powiązanych z rozmową w kanałach komunikacyjnych
    - Powiązywanie rozmowy w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, podłączeniem pluginu lub dostarczaniem ukończeń
    - Obsługa poleceń /acp z czatu
sidebarTitle: ACP agents
summary: Uruchamianie zewnętrznych harnessów kodowania (Claude Code, Cursor, Gemini CLI, explicit Codex ACP, OpenClaw ACP, OpenCode) przez backend ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-04-26T11:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
pozwalają OpenClaw uruchamiać zewnętrzne harnessy kodowania (na przykład Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI i inne
obsługiwane harnessy ACPX) przez plugin backendu ACP.

Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

<Note>
**ACP to ścieżka zewnętrznych harnessów, a nie domyślna ścieżka Codex.**
Natywny plugin serwera aplikacji Codex obsługuje kontrolki `/codex ...` i
wbudowane środowisko uruchomieniowe `agentRuntime.id: "codex"`; ACP obsługuje
kontrolki `/acp ...` i sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi rozmowami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                       | Użyj tego                            | Uwagi                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać lub sterować Codex w bieżącej rozmowie                                               | `/codex bind`, `/codex threads`      | Natywna ścieżka serwera aplikacji Codex, gdy plugin `codex` jest włączony; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/fast/uprawnienia, zatrzymywanie i sterowanie. ACP to jawny fallback |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona                            | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska uruchomieniowego                                                            |
| Udostępnić sesję Gateway OpenClaw _jako_ serwer ACP dla edytora lub klienta                   | [`openclaw acp`](/pl/cli/acp)           | Tryb mostka. IDE/klient mówi ACP do OpenClaw przez stdio/WebSocket                                                                                                                             |
| Użyć lokalnego CLI AI jako tekstowego modelu awaryjnego                                       | [CLI Backends](/pl/gateway/cli-backends) | To nie jest ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak środowiska uruchomieniowego harnessu                                                                                        |

## Czy to działa od razu po instalacji?

Zwykle tak. Świeże instalacje dostarczają dołączony plugin środowiska uruchomieniowego `acpx`, włączony
domyślnie z przypiętym lokalnie dla pluginu binarnym `acpx`, który OpenClaw sprawdza
i samonaprawia przy uruchomieniu. Uruchom `/acp doctor`, aby sprawdzić gotowość.

OpenClaw uczy agentów uruchamiania ACP tylko wtedy, gdy ACP jest **rzeczywiście
używalne**: ACP musi być włączone, dyspozycja nie może być wyłączona, bieżąca
sesja nie może być zablokowana przez sandbox, a backend środowiska uruchomieniowego musi być
załadowany. Jeśli te warunki nie są spełnione, umiejętności pluginu ACP i
wskazówki ACP `sessions_spawn` pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Pułapki pierwszego uruchomienia">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny inwentarz pluginów i **musi** zawierać `acpx`; w przeciwnym razie dołączona wartość domyślna jest celowo blokowana, a `/acp doctor` zgłasza brakujący wpis na liście dozwolonych.
    - Docelowe adaptery harnessów (Codex, Claude itd.) mogą zostać pobrane na żądanie przez `npx` przy pierwszym użyciu.
    - Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego harnessu.
    - Jeśli host nie ma npm ani dostępu do sieci, pobieranie adapterów przy pierwszym uruchomieniu zakończy się niepowodzeniem, dopóki cache nie zostanie wcześniej rozgrzany lub adapter nie zostanie zainstalowany w inny sposób.
  </Accordion>
  <Accordion title="Wymagania środowiska uruchomieniowego">
    ACP uruchamia prawdziwy zewnętrzny proces harnessu. OpenClaw obsługuje trasowanie,
    stan zadań w tle, dostarczanie, powiązania i politykę; harness
    obsługuje logowanie dostawcy, katalog modeli, zachowanie systemu plików i
    natywne narzędzia.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony i zdrowy backend.
    - Identyfikator docelowy jest dozwolony przez `acp.allowedAgents`, gdy ustawiono tę listę dozwolonych.
    - Polecenie harnessu może się uruchomić na hoście Gateway.
    - Uwierzytelnianie dostawcy jest obecne dla tego harnessu (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego harnessu — identyfikatory modeli nie są przenośne między harnessami.
    - Żądane `cwd` istnieje i jest dostępne, albo pomiń `cwd` i pozwól backendowi użyć wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów o uprawnienia, więc przebiegi kodowania intensywnie używające zapisu/wykonywania zwykle wymagają profilu uprawnień ACPX, który może działać bez interakcji.

  </Accordion>
</AccordionGroup>

Narzędzia pluginów OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie udostępniane
harnessom ACP. Włącz jawne mostki MCP w
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup) tylko wtedy, gdy harness
powinien bezpośrednio wywoływać te narzędzia.

## Obsługiwane cele harnessów

Z dołączonym backendem `acpx` używaj tych identyfikatorów harnessów jako celów
`/acp spawn <id>` lub `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness id | Typowy backend                                | Uwagi                                                                                 |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                       | Wymaga uwierzytelnienia Claude Code na hoście.                                        |
| `codex`    | Adapter Codex ACP                             | Jawny fallback ACP tylko wtedy, gdy natywne `/codex` jest niedostępne lub zażądano ACP. |
| `copilot`  | Adapter GitHub Copilot ACP                    | Wymaga uwierzytelnienia Copilot CLI/runtime.                                          |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)           | Nadpisz polecenie acpx, jeśli instalacja lokalna udostępnia inny punkt wejścia ACP.   |
| `droid`    | Factory Droid CLI                             | Wymaga uwierzytelnienia Factory/Droid lub `FACTORY_API_KEY` w środowisku harnessu.     |
| `gemini`   | Adapter Gemini CLI ACP                        | Wymaga uwierzytelnienia Gemini CLI lub konfiguracji klucza API.                       |
| `iflow`    | iFlow CLI                                     | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.               |
| `kilocode` | Kilo Code CLI                                 | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.               |
| `kimi`     | Kimi/Moonshot CLI                             | Wymaga uwierzytelnienia Kimi/Moonshot na hoście.                                      |
| `kiro`     | Kiro CLI                                      | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.               |
| `opencode` | Adapter OpenCode ACP                          | Wymaga uwierzytelnienia OpenCode CLI/dostawcy.                                        |
| `openclaw` | Mostek Gateway OpenClaw przez `openclaw acp`  | Pozwala harnessowi obsługującemu ACP rozmawiać z powrotem z sesją Gateway OpenClaw.   |
| `pi`       | Pi/wbudowane środowisko uruchomieniowe OpenClaw | Używane do eksperymentów z natywnymi harnessami OpenClaw.                           |
| `qwen`     | Qwen Code / Qwen CLI                          | Wymaga zgodnego z Qwen uwierzytelnienia na hoście.                                    |

Niestandardowe aliasy agentów acpx można skonfigurować w samym acpx, ale polityka OpenClaw
nadal sprawdza `acp.allowedAgents` oraz wszelkie mapowania
`agents.list[].runtime.acp.agent` przed dyspozycją.

## Runbook operatora

Szybki przepływ `/acp` z czatu:

<Steps>
  <Step title="Uruchom">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` lub jawne
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Pracuj">
    Kontynuuj w powiązanej rozmowie lub wątku (albo wskaż
    jawnie klucz sesji).
  </Step>
  <Step title="Sprawdź stan">
    `/acp status`
  </Step>
  <Step title="Dostrój">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Steruj">
    Bez zastępowania kontekstu: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Zatrzymaj">
    `/acp cancel` (bieżąca tura) lub `/acp close` (sesja + powiązania).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Szczegóły cyklu życia">
    - Uruchomienie tworzy lub wznawia sesję środowiska uruchomieniowego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy przebieg jest własnością rodzica.
    - Powiązane wiadomości następcze trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, odfokusowane, zresetowane lub nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako zwykły tekst promptu do powiązanego harnessu ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Harness może nadal zachować własną historię upstream, jeśli obsługuje wznowienie.
    - Nieaktywne workery środowiska uruchomieniowego kwalifikują się do czyszczenia po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.
  </Accordion>
  <Accordion title="Natywne zasady trasowania Codex">
    Wyzwalacze w języku naturalnym, które powinny być kierowane do **natywnego pluginu Codex**, gdy jest włączony:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Natywne powiązanie rozmowy Codex to domyślna ścieżka sterowania czatem.
    Narzędzia dynamiczne OpenClaw nadal wykonują się przez OpenClaw, podczas gdy
    narzędzia natywne Codex, takie jak shell/apply-patch, wykonują się wewnątrz Codex.
    Dla zdarzeń narzędzi natywnych Codex OpenClaw wstrzykuje przekaźnik natywnych hooków per tura,
    aby hooki pluginów mogły blokować `before_tool_call`, obserwować
    `after_tool_call` i kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie pluginy mogą zażądać jeszcze jednego
    przebiegu modelu przed sfinalizowaniem odpowiedzi przez Codex. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów narzędzi natywnych Codex
    ani nie przepisuje rekordów wątków Codex. Używaj jawnego ACP tylko
    wtedy, gdy chcesz model sesji/środowiska uruchomieniowego ACP. Granica obsługi wbudowanego Codex
    jest udokumentowana w
    [Kontrakt obsługi harnessu Codex v1](/pl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Ściąga wyboru modelu / dostawcy / środowiska uruchomieniowego">
    - `openai-codex/*` — ścieżka OAuth/subskrypcji PI Codex.
    - `openai/*` plus `agentRuntime.id: "codex"` — natywne wbudowane środowisko uruchomieniowe serwera aplikacji Codex.
    - `/codex ...` — natywne sterowanie rozmową Codex.
    - `/acp ...` lub `runtime: "acp"` — jawne sterowanie ACP/acpx.
  </Accordion>
  <Accordion title="Wyzwalacze trasowania ACP w języku naturalnym">
    Wyzwalacze, które powinny być kierowane do środowiska uruchomieniowego ACP:

    - "Run this as a one-shot Claude Code ACP session and summarize the result."
    - "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
    - "Run Codex through ACP in a background thread."

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje `agentId` harnessu,
wiąże się z bieżącą rozmową lub wątkiem, gdy jest to obsługiwane, i
kieruje kolejne wiadomości do tej sesji aż do zamknięcia/wygaśnięcia. Codex
podąża tą ścieżką tylko wtedy, gdy ACP/acpx jest jawnie wybrane lub natywny plugin Codex
jest niedostępny dla żądanej operacji.

Dla `sessions_spawn` `runtime: "acp"` jest ogłaszane tylko wtedy, gdy ACP
jest włączone, żądający nie jest objęty sandboxem, a backend środowiska uruchomieniowego ACP
jest załadowany. Jest kierowane do identyfikatorów harnessów ACP, takich jak `codex`,
`claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
identyfikatora agenta konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
w przeciwnym razie użyj domyślnego środowiska uruchomieniowego sub-agenta. Gdy agent OpenClaw
jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
`runtime.acp.agent` jako bazowego identyfikatora harnessu.

  </Accordion>
</AccordionGroup>

## ACP a sub-agenci

Używaj ACP, gdy chcesz zewnętrznego środowiska uruchomieniowego harnessu. Używaj **natywnego serwera aplikacji Codex**
do wiązania/sterowania rozmową Codex, gdy plugin `codex`
jest włączony. Używaj **sub-agentów**, gdy chcesz natywnych dla OpenClaw
delegowanych przebiegów.

| Obszar        | Sesja ACP                             | Przebieg sub-agenta                |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko uruchomieniowe | Plugin backendu ACP (na przykład acpx) | Natywne środowisko uruchomieniowe sub-agentów OpenClaw |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                         | `/subagents ...`                   |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko uruchomieniowe) |

Zobacz też [Sub-agenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos jest następujący:

1. Płaszczyzna sterowania sesji ACP OpenClaw.
2. Dołączony plugin środowiska uruchomieniowego `acpx`.
3. Adapter Claude ACP.
4. Mechanizmy środowiska uruchomieniowego/sesji po stronie Claude.

ACP Claude to **sesja harnessu** z kontrolkami ACP, wznawianiem sesji,
śledzeniem zadań w tle i opcjonalnym wiązaniem rozmowy/wątku.

Backendy CLI to osobne tekstowe lokalne środowiska uruchomieniowe awaryjne — zobacz
[CLI Backends](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest taka:

- **Chcesz `/acp spawn`, sesji możliwych do związania, kontrolek środowiska uruchomieniowego lub trwałej pracy harnessu?** Użyj ACP.
- **Chcesz prostego lokalnego fallbacku tekstowego przez surowe CLI?** Użyj backendów CLI.

## Związane sesje

### Model mentalny

- **Powierzchnia czatu** — miejsce, gdzie ludzie dalej rozmawiają (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** — trwały stan środowiska uruchomieniowego Codex/Claude/Gemini, do którego kieruje OpenClaw.
- **Wątek/temat potomny** — opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`.
- **Obszar roboczy środowiska uruchomieniowego** — lokalizacja systemu plików (`cwd`, checkout repozytorium, obszar roboczy backendu), w której działa harness. Niezależna od powierzchni czatu.

### Wiązania z bieżącą rozmową

`/acp spawn <harness> --bind here` przypina bieżącą rozmowę do
uruchomionej sesji ACP — bez potomnego wątku, ta sama powierzchnia czatu. OpenClaw nadal
obsługuje transport, uwierzytelnianie, bezpieczeństwo i dostarczanie. Kolejne wiadomości w tej
rozmowie są kierowane do tej samej sesji; `/new` i `/reset` resetują
sesję w miejscu; `/acp close` usuwa powiązanie.

Przykłady:

```text
/codex bind                                              # natywne powiązanie Codex, kieruj tu przyszłe wiadomości
/codex model gpt-5.4                                     # dostrój związany natywny wątek Codex
/codex stop                                              # steruj aktywną turą natywnego Codex
/acp spawn codex --bind here                             # jawny fallback ACP dla Codex
/acp spawn codex --thread auto                           # może utworzyć potomny wątek/temat i tam związać
/acp spawn codex --bind here --cwd /workspace/repo       # to samo powiązanie czatu, Codex działa w /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reguły wiązania i wyłączność">
    - `--bind here` i `--thread ...` wzajemnie się wykluczają.
    - `--bind here` działa tylko na kanałach, które ogłaszają wiązanie z bieżącą rozmową; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Powiązania przetrwają restarty gateway.
    - Na Discord `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć potomny wątek dla `--thread auto|here` — nie dla `--bind here`.
    - Jeśli uruchomisz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **docelowego agenta**. Brakujące odziedziczone ścieżki (`ENOENT`/`ENOTDIR`) wracają do domyślnej wartości backendu; inne błędy dostępu (np. `EACCES`) są zwracane jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w związanych rozmowach — polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst kolejnych wiadomości trafia do związanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla tej powierzchni.
  </Accordion>
  <Accordion title="Sesje związane z wątkiem">
    Gdy wiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Kolejne wiadomości w tym wątku są kierowane do związanej sesji ACP.
    - Wyjście ACP jest dostarczane z powrotem do tego samego wątku.
    - Odfokusowanie/zamknięcie/archiwizacja/timeout bezczynności lub wygaśnięcie maksymalnego wieku usuwa powiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` to polecenia Gateway, a nie prompty dla harnessu ACP.

    Wymagane flagi funkcji dla ACP związanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać dyspozycję ACP).
    - Włączona flaga uruchamiania wątku ACP adaptera kanału (specyficzna dla adaptera):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Obsługa wiązania wątków zależy od adaptera. Jeśli aktywny adapter kanału
    nie obsługuje wiązań wątków, OpenClaw zwraca jasny
    komunikat o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Każdy adapter kanału, który udostępnia możliwość wiązania sesji/wątku.
    - Obecne wbudowane wsparcie: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy DM).
    - Kanały pluginów mogą dodawać obsługę przez ten sam interfejs wiązania.
  </Accordion>
</AccordionGroup>

## Trwałe powiązania kanałów

Dla nieefemerycznych przepływów pracy skonfiguruj trwałe powiązania ACP w
wpisach najwyższego poziomu `bindings[]`.

### Model wiązania

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe powiązanie rozmowy ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje docelową rozmowę. Kształty per kanał:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych powiązań grupowych.
- **DM/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` dla stabilnych powiązań grupowych.
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

### Domyślne ustawienia środowiska uruchomieniowego per agent

Użyj `agents.list[].runtime`, aby zdefiniować domyślne ustawienia ACP raz dla każdego agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessu, np. `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Priorytet nadpisań dla związanych sesji ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Globalne ustawienia domyślne ACP (np. `acp.backend`)

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

- OpenClaw zapewnia istnienie skonfigurowanej sesji ACP przed użyciem.
- Wiadomości w tym kanale lub temacie są kierowane do skonfigurowanej sesji ACP.
- W związanych rozmowach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe powiązania środowiska uruchomieniowego (na przykład utworzone przez przepływy focusu wątku) nadal mają zastosowanie tam, gdzie istnieją.
- Dla międzyagentowych uruchomień ACP bez jawnego `cwd` OpenClaw dziedziczy docelowy obszar roboczy agenta z konfiguracji agenta.
- Brakujące odziedziczone ścieżki obszaru roboczego wracają do domyślnego `cwd` backendu; błędy dostępu inne niż brak ścieżki są zwracane jako błędy uruchomienia.

## Uruchamianie sesji ACP

Istnieją dwa sposoby uruchomienia sesji ACP:

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
    Domyślną wartością `runtime` jest `subagent`, więc ustaw `runtime: "acp"` jawnie
    dla sesji ACP. Jeśli pominięto `agentId`, OpenClaw używa
    `acp.defaultAgent`, gdy jest skonfigurowane. `mode: "session"` wymaga
    `thread: true`, aby utrzymać trwałą związaną rozmowę.
    </Note>

  </Tab>
  <Tab title="Z polecenia /acp">
    Użyj `/acp spawn` do jawnego sterowania operatora z czatu.

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
  Dla sesji ACP musi mieć wartość `"acp"`.
</ParamField>
<ParamField path="agentId" type="string">
  Identyfikator docelowego harnessu ACP. Wraca do `acp.defaultAgent`, jeśli jest ustawione.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Żądanie przepływu wiązania wątku tam, gdzie jest obsługiwane.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` oznacza jednorazowe uruchomienie; `"session"` oznacza trwałość. Jeśli `thread: true` i
  `mode` jest pominięte, OpenClaw może domyślnie przejść do zachowania trwałego zależnie od
  ścieżki środowiska uruchomieniowego. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy środowiska uruchomieniowego (walidowany przez politykę backendu/środowiska uruchomieniowego).
  Jeśli zostanie pominięty, uruchomienie ACP dziedziczy obszar roboczy docelowego agenta,
  gdy jest skonfigurowany; brakujące odziedziczone ścieżki wracają do wartości domyślnych backendu,
  a rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznów istniejącą sesję ACP zamiast tworzyć nową. Agent
  odtwarza historię rozmowy przez `session/load`. Wymaga
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` strumieniuje podsumowania postępu początkowego przebiegu ACP z powrotem do
  sesji żądającej jako zdarzenia systemowe. Akceptowane odpowiedzi obejmują
  `streamLogPath` wskazujące log JSONL ograniczony do sesji
  (`<sessionId>.acp-stream.jsonl`), który można śledzić, aby zobaczyć pełną historię przekazywania.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Przerywa podrzędną turę ACP po N sekundach. `0` utrzymuje turę na
  ścieżce gateway bez limitu czasu. Ta sama wartość jest stosowana do przebiegu Gateway
  i środowiska uruchomieniowego ACP, aby zawieszone/wyczerpane limitami harnessy
  nie zajmowały bez końca pasa nadrzędnego agenta.
</ParamField>
<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla podrzędnej sesji ACP. Uruchomienia Codex ACP
  normalizują odwołania OpenClaw Codex, takie jak `openai-codex/gpt-5.4`, do konfiguracji startowej Codex
  ACP przed `session/new`; formy slash, takie jak
  `openai-codex/gpt-5.4/high`, również ustawiają wysiłek reasoning Codex ACP.
  Inne harnessy muszą ogłaszać ACP `models` i obsługiwać
  `session/set_model`; w przeciwnym razie OpenClaw/acpx kończy się jasnym błędem zamiast
  po cichu wracać do domyślnego ustawienia docelowego agenta.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny poziom thinking/reasoning. Dla Codex ACP `minimal` mapuje do
  niskiego wysiłku, `low`/`medium`/`high`/`xhigh` mapują bezpośrednio, a `off`
  pomija startowe nadpisanie wysiłku reasoning.
</ParamField>

## Tryby wiązania i wątków przy uruchamianiu

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                              |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | Wiąże bieżącą aktywną rozmowę w miejscu; kończy się błędem, jeśli żadna nie jest aktywna. |
    | `off`  | Nie tworzy powiązania z bieżącą rozmową.                               |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „zrób z tego kanału lub czatu zaplecze Codex”.
    - `--bind here` nie tworzy potomnego wątku.
    - `--bind here` jest dostępne tylko na kanałach, które udostępniają obsługę wiązania z bieżącą rozmową.
    - `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                           |
    | ------ | ---------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: wiąże ten wątek. Poza wątkiem: tworzy/wiąże potomny wątek, gdy jest to obsługiwane. |
    | `here` | Wymaga bieżącego aktywnego wątku; kończy się błędem, jeśli nie jesteś w wątku.                      |
    | `off`  | Brak powiązania. Sesja startuje bez powiązania.                                                      |

    Uwagi:

    - Na powierzchniach bez obsługi wiązania wątków domyślne zachowanie jest w praktyce `off`.
    - Uruchomienie związane z wątkiem wymaga wsparcia polityki kanału:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Użyj `--bind here`, gdy chcesz przypiąć bieżącą rozmowę bez tworzenia potomnego wątku.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą być albo interaktywnymi obszarami roboczymi, albo
pracą w tle należącą do nadrzędnego elementu. Ścieżka dostarczania zależy od tego kształtu.

<AccordionGroup>
  <Accordion title="Interaktywne sesje ACP">
    Sesje interaktywne mają służyć do dalszej rozmowy na widocznej powierzchni
    czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą rozmowę z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwałe skonfigurowane `bindings[].type="acp"` kierują pasujące rozmowy do tej samej sesji ACP.

    Kolejne wiadomości w związanej rozmowie są kierowane bezpośrednio do
    sesji ACP, a wyjście ACP jest dostarczane z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do harnessu:

    - Zwykłe związane wiadomości następcze są wysyłane jako tekst promptu, plus załączniki tylko wtedy, gdy harness/backend je obsługuje.
    - Polecenia zarządzania `/acp` i lokalne polecenia Gateway są przechwytywane przed dyspozycją ACP.
    - Zdarzenia ukończenia generowane przez środowisko uruchomieniowe są materializowane per cel. Agenci OpenClaw otrzymują wewnętrzną kopertę kontekstu środowiska uruchomieniowego OpenClaw; zewnętrzne harnessy ACP otrzymują zwykły prompt z wynikiem podrzędnym i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych harnessów ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają widocznego dla użytkownika tekstu wyzwalającego albo zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają ustrukturyzowane w OpenClaw tam, gdzie to możliwe, i nie są traktowane jako treść czatu utworzona przez użytkownika.

  </Accordion>
  <Accordion title="Jednorazowe sesje ACP należące do nadrzędnego elementu">
    Jednorazowe sesje ACP uruchomione przez inny przebieg agenta są podrzędnymi
    zadaniami w tle, podobnie jak sub-agenci:

    - Element nadrzędny zleca pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Element podrzędny działa we własnej sesji harnessu ACP.
    - Tury podrzędne działają na tym samym pasie tła, którego używają natywne uruchomienia sub-agentów, więc wolny harness ACP nie blokuje niezwiązanej pracy głównej sesji.
    - Ukończenie jest raportowane z powrotem przez ścieżkę ogłoszenia ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia do zwykłego promptu ACP przed wysłaniem go do zewnętrznego harnessu, dzięki czemu harnessy nie widzą znaczników kontekstu środowiska uruchomieniowego przeznaczonych tylko dla OpenClaw.
    - Element nadrzędny przepisuje wynik podrzędny zwykłym głosem asystenta, gdy przydaje się odpowiedź skierowana do użytkownika.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między elementem nadrzędnym
    i podrzędnym. Element podrzędny ma już kanał ukończenia z powrotem do
    elementu nadrzędnego.

  </Accordion>
  <Accordion title="sessions_send i dostarczanie A2A">
    `sessions_send` może po uruchomieniu kierować do innej sesji. Dla zwykłych
    sesji peer OpenClaw używa ścieżki dalszej wiadomości agent-to-agent (A2A)
    po wstrzyknięciu wiadomości:

    - Czeka na odpowiedź sesji docelowej.
    - Opcjonalnie pozwala żądającemu i celowi wymienić ograniczoną liczbę kolejnych tur.
    - Prosi cel o wygenerowanie wiadomości ogłaszającej.
    - Dostarcza to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A to fallback dla wysyłania do peerów, gdy nadawca potrzebuje
    widocznej wiadomości następczej. Pozostaje włączona, gdy niezwiązana sesja może
    zobaczyć i wysłać wiadomość do celu ACP, na przykład przy szerokich
    ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija dalszą ścieżkę A2A tylko wtedy, gdy żądający jest
    rodzicem własnego jednorazowego podrzędnego zadania ACP należącego do rodzica. W takim przypadku
    uruchomienie A2A ponad ukończeniem zadania może wybudzić rodzica wynikiem
    podrzędnego zadania, przekazać odpowiedź rodzica z powrotem do podrzędnego zadania i
    utworzyć pętlę echa rodzic/podrzędny. Wynik `sessions_send` zgłasza
    `delivery.status="skipped"` dla tego przypadku podrzędnego zadania należącego do rodzica, ponieważ
    ścieżka ukończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Wznawianie istniejącej sesji">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    zaczynać od nowa. Agent odtwarza historię rozmowy przez
    `session/load`, więc podejmuje pracę z pełnym kontekstem tego, co było wcześniej.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe przypadki użycia:

    - Przekazanie sesji Codex z laptopa na telefon — powiedz agentowi, aby podjął pracę tam, gdzie skończyłeś.
    - Kontynuowanie sesji kodowania rozpoczętej interaktywnie w CLI, teraz bezobsługowo przez agenta.
    - Podjęcie pracy przerwanej przez restart gateway lub timeout bezczynności.

    Uwagi:

    - `resumeSessionId` wymaga `runtime: "acp"` — zwraca błąd, jeśli zostanie użyte ze środowiskiem uruchomieniowym sub-agenta.
    - `resumeSessionId` przywraca historię rozmowy ACP upstream; `thread` i `mode` nadal normalnie odnoszą się do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Docelowy agent musi obsługiwać `session/load` (obsługują to Codex i Claude Code).
    - Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się jasnym błędem — bez cichego fallbacku do nowej sesji.

  </Accordion>
  <Accordion title="Test smoke po wdrożeniu">
    Po wdrożeniu gateway wykonaj test end-to-end na żywo zamiast
    polegać na testach jednostkowych:

    1. Zweryfikuj wdrożoną wersję gateway i commit na hoście docelowym.
    2. Otwórz tymczasową sesję mostka ACPX do aktywnego agenta.
    3. Poproś tego agenta o wywołanie `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` i zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, prawdziwe `childSessionKey` i brak błędu walidatora.
    5. Posprzątaj tymczasową sesję mostka.

    Utrzymuj bramkę na `mode: "run"` i pomijaj `streamTo: "parent"` —
    ścieżki związane z wątkiem `mode: "session"` oraz przekazywanie strumienia to osobne,
    bogatsze przebiegi integracyjne.

  </Accordion>
</AccordionGroup>

## Zgodność z sandboxem

Sesje ACP obecnie działają na środowisku uruchomieniowym hosta, **a nie** wewnątrz
sandboxa OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzny harness może odczytywać/zapisywać zgodnie z własnymi uprawnieniami CLI i wybranym `cwd`.
- Polityka sandboxa OpenClaw **nie** otacza wykonania harnessu ACP.
- OpenClaw nadal egzekwuje bramki funkcji ACP, dozwolonych agentów, własność sesji, powiązania kanałów i politykę dostarczania Gateway.
- Użyj `runtime: "subagent"` dla natywnej pracy OpenClaw wymuszanej przez sandbox.
</Warning>

Obecne ograniczenia:

- Jeśli sesja żądająca jest objęta sandboxem, uruchomienia ACP są blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozwiązywanie celu sesji

Większość działań `/acp` akceptuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozwiązywania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - najpierw próbuje klucza
   - potem identyfikatora sesji w kształcie UUID
   - potem etykiety
2. Bieżące powiązanie wątku (jeśli ta rozmowa/wątek jest związana z sesją ACP).
3. Fallback bieżącej sesji żądającego.

Zarówno powiązania z bieżącą rozmową, jak i powiązania wątków uczestniczą w
kroku 2.

Jeśli żaden cel nie zostanie rozwiązany, OpenClaw zwraca jasny błąd
(`Unable to resolve session target: ...`).

## Kontrolki ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje turę w toku dla sesji docelowej.                  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do uruchomionej sesji.        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązania celów wątków.             | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje środowiska uruchomieniowego i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb środowiska uruchomieniowego dla sesji docelowej. | `/acp set-mode plan`                                          |
| `/acp set`           | Ogólny zapis opcji konfiguracji środowiska uruchomieniowego. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego środowiska uruchomieniowego. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzeń.                      | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia timeout środowiska uruchomieniowego (sekundy).    | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu środowiska uruchomieniowego.    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska uruchomieniowego sesji. | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla listę ostatnich sesji ACP z magazynu.           | `/acp sessions`                                               |
| `/acp doctor`        | Kondycja backendu, możliwości, możliwe do wykonania poprawki. | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączenia.   | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje środowiska uruchomieniowego oraz identyfikatory sesji
na poziomie środowiska uruchomieniowego i backendu. Błędy dotyczące nieobsługiwanych kontrolek są wyraźnie zwracane,
gdy backend nie ma danej możliwości. `/acp sessions` odczytuje
magazyn dla bieżącej związanej sesji lub sesji żądającej; tokeny celu
(`session-key`, `session-id` lub `session-label`) są rozwiązywane przez
odkrywanie sesji gateway, w tym niestandardowe katalogi główne `session.store`
per agent.

### Mapowanie opcji środowiska uruchomieniowego

`/acp` ma wygodne polecenia i ogólny setter. Równoważne
operacje:

| Polecenie                    | Mapuje do                            | Uwagi                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | klucz konfiguracji środowiska uruchomieniowego `model` | Dla Codex ACP OpenClaw normalizuje `openai-codex/<model>` do identyfikatora modelu adaptera i mapuje suffixy reasoning w formie slash, takie jak `openai-codex/gpt-5.4/high`, na `reasoning_effort`. |
| `/acp set thinking <level>`  | klucz konfiguracji środowiska uruchomieniowego `thinking` | Dla Codex ACP OpenClaw wysyła odpowiadające `reasoning_effort`, jeśli adapter je obsługuje.                                                                                   |
| `/acp permissions <profile>` | klucz konfiguracji środowiska uruchomieniowego `approval_policy` | —                                                                                                                                                                               |
| `/acp timeout <seconds>`     | klucz konfiguracji środowiska uruchomieniowego `timeout` | —                                                                                                                                                                               |
| `/acp cwd <path>`            | nadpisanie `cwd` środowiska uruchomieniowego | Bezpośrednia aktualizacja.                                                                                                                                                      |
| `/acp set <key> <value>`     | ogólne                               | `key=cwd` używa ścieżki nadpisania `cwd`.                                                                                                                                       |
| `/acp reset-options`         | czyści wszystkie nadpisania środowiska uruchomieniowego | —                                                                                                                                                                               |

## Harness acpx, konfiguracja pluginu i uprawnienia

Informacje o konfiguracji harnessu acpx (aliasy Claude Code / Codex / Gemini CLI),
mostkach MCP plugin-tools i OpenClaw-tools oraz trybach uprawnień ACP
znajdziesz w
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                         | Naprawa                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Brak pluginu backendu, jest wyłączony lub zablokowany przez `plugins.allow`.   | Zainstaluj i włącz plugin backendu, uwzględnij `acpx` w `plugins.allow`, gdy ta lista dozwolonych jest ustawiona, a następnie uruchom `/acp doctor`.                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                   | Ustaw `acp.enabled=true`.                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dyspozycja z normalnych wiadomości w wątku jest wyłączona.                      | Ustaw `acp.dispatch.enabled=true`.                                                                                                                                        |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na liście dozwolonych.                                   | Użyj dozwolonego `agentId` lub zaktualizuj `acp.allowedAgents`.                                                                                                          |
| `/acp doctor` zgłasza, że backend nie jest gotowy zaraz po uruchomieniu     | Sprawdzanie zależności pluginu lub samonaprawa nadal trwa.                      | Poczekaj chwilę i uruchom ponownie `/acp doctor`; jeśli nadal jest niezdrowy, sprawdź błąd instalacji backendu oraz politykę allow/deny pluginu.                       |
| Nie znaleziono polecenia harnessu                                           | CLI adaptera nie jest zainstalowane lub pierwsze pobranie `npx` zakończyło się błędem. | Zainstaluj/rozgrzej adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx.                                                                            |
| Model-not-found z harnessu                                                  | Identyfikator modelu jest prawidłowy dla innego dostawcy/harnessu, ale nie dla tego celu ACP. | Użyj modelu wymienionego przez ten harness, skonfiguruj model w harnessie lub pomiń nadpisanie.                                                                         |
| Błąd uwierzytelniania dostawcy z harnessu                                   | OpenClaw działa poprawnie, ale docelowy CLI/dostawca nie jest zalogowany.       | Zaloguj się lub podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                                |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token key/id/label.                                               | Uruchom `/acp sessions`, skopiuj dokładny key/label i spróbuj ponownie.                                                                                                  |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` użyto bez aktywnej rozmowy, którą można powiązać.                 | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości bieżącego powiązania rozmowy ACP.                     | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                         |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` użyto poza kontekstem wątku.                                    | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                    | Powiąż ponownie jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązania wątków.                                    | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Środowisko uruchomieniowe ACP działa po stronie hosta; sesja żądająca jest objęta sandboxem. | Użyj `runtime="subagent"` z sesji objętych sandboxem albo uruchom ACP z sesji bez sandboxa.                                                                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla środowiska uruchomieniowego ACP.               | Użyj `runtime="subagent"` dla wymaganego sandboxa albo użyj ACP z `sandbox="inherit"` z sesji bez sandboxa.                                                             |
| `Cannot apply --model ... did not advertise model support`                  | Docelowy harness nie udostępnia ogólnego przełączania modelu ACP.               | Użyj harnessu, który ogłasza ACP `models`/`session/set_model`, użyj odwołań do modelu Codex ACP albo skonfiguruj model bezpośrednio w harnessie, jeśli ma własną flagę startową. |
| Brak metadanych ACP dla związanej sesji                                     | Nieaktualne/usunięte metadane sesji ACP.                                        | Utwórz ponownie przez `/acp spawn`, a następnie ponownie powiąż/skup wątek.                                                                                              |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapis/wykonanie w nieinteraktywnej sesji ACP.          | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration). |
| Sesja ACP kończy się bardzo wcześnie z niewielką ilością wyjścia            | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`. | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bez końca po zakończeniu pracy                       | Proces harnessu zakończył się, ale sesja ACP nie zgłosiła ukończenia.           | Monitoruj przez `ps aux \| grep acpx`; ręcznie zabij nieaktualne procesy.                                                                                                |
| Harness widzi `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                       | Wewnętrzna koperta zdarzenia wyciekła poza granicę ACP.                         | Zaktualizuj OpenClaw i ponownie uruchom przepływ ukończenia; zewnętrzne harnessy powinny otrzymywać wyłącznie zwykłe prompty ukończenia.                                |

## Powiązane

- [Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup)
- [Agent send](/pl/tools/agent-send)
- [CLI Backends](/pl/gateway/cli-backends)
- [Codex harness](/pl/plugins/codex-harness)
- [Narzędzia sandboxa multi-agent](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostka)](/pl/cli/acp)
- [Sub-agenci](/pl/tools/subagents)
