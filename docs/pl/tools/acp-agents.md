---
read_when:
    - Uruchamianie środowisk kodowania za pośrednictwem ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją w kanałach wiadomości
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, podłączeniem Plugin lub dostarczaniem ukończeń
    - Obsługa poleceń /acp z poziomu czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne środowiska kodowania (Claude Code, Cursor, Gemini CLI, jawny Codex ACP, OpenClaw ACP, OpenCode) za pośrednictwem backendu ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-05-06T09:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
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
wbudowane środowisko uruchomieniowe `agentRuntime.id: "codex"`; ACP odpowiada za
kontrolki `/acp ...` oraz sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code łączył się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi rozmowami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                         | Użyj tego                             | Uwagi                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać Codex lub sterować nim w bieżącej rozmowie                                             | `/codex bind`, `/codex threads`       | Natywna ścieżka serwera aplikacji Codex, gdy Plugin `codex` jest włączony; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/tryb szybki/uprawnienia, zatrzymanie i sterowanie. ACP jest jawną opcją awaryjną |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inne zewnętrzne środowisko _przez_ OpenClaw | Ta strona                             | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska uruchomieniowego                                                                             |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta                     | [`openclaw acp`](/pl/cli/acp)            | Tryb mostu. IDE/klient komunikuje się przez ACP z OpenClaw przez stdio/WebSocket                                                                                                                              |
| Ponownie użyć lokalnego CLI AI jako tekstowego modelu awaryjnego                                | [Backendy CLI](/pl/gateway/cli-backends) | To nie ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak środowiska uruchomieniowego                                                                                                                      |

## Czy to działa od razu po instalacji?

Tak, po zainstalowaniu oficjalnego Plugin środowiska uruchomieniowego ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kopie robocze ze źródeł mogą używać lokalnego Plugin obszaru roboczego `extensions/acpx` po
`pnpm install`. Uruchom `/acp doctor`, aby sprawdzić gotowość.

OpenClaw uczy agentów uruchamiania ACP tylko wtedy, gdy ACP jest **naprawdę
używalne**: ACP musi być włączone, dispatch nie może być wyłączony, bieżąca
sesja nie może być blokowana przez sandbox, a backend środowiska uruchomieniowego musi być
załadowany. Jeśli te warunki nie są spełnione, Skills Plugin ACP oraz
wskazówki ACP dla `sessions_spawn` pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Typowe problemy przy pierwszym uruchomieniu">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny spis pluginów i **musi** zawierać `acpx`; w przeciwnym razie zainstalowany backend ACP jest celowo blokowany, a `/acp doctor` zgłasza brakujący wpis listy dozwolonych.
    - Adapter Codex ACP jest dostarczany z Plugin `acpx` i uruchamiany lokalnie, gdy to możliwe.
    - Inne adaptery docelowych środowisk mogą nadal być pobierane na żądanie przez `npx` przy pierwszym użyciu.
    - Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego środowiska.
    - Jeśli host nie ma dostępu do npm ani sieci, pierwsze pobrania adaptera zakończą się niepowodzeniem, dopóki pamięci podręczne nie zostaną wstępnie przygotowane albo adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska uruchomieniowego">
    ACP uruchamia rzeczywisty proces zewnętrznego środowiska. OpenClaw odpowiada za routing,
    stan zadań w tle, dostarczanie, powiązania i politykę; środowisko
    odpowiada za logowanie do dostawcy, katalog modeli, zachowanie systemu plików oraz
    natywne narzędzia.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony i zdrowy backend.
    - Identyfikator docelowy jest dozwolony przez `acp.allowedAgents`, gdy ta lista dozwolonych jest ustawiona.
    - Polecenie środowiska może zostać uruchomione na hoście Gateway.
    - Uwierzytelnianie dostawcy jest obecne dla tego środowiska (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego środowiska - identyfikatory modeli nie są przenośne między środowiskami.
    - Żądany `cwd` istnieje i jest dostępny, albo pomiń `cwd` i pozwól backendowi użyć wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych próśb o uprawnienia, więc przebiegi kodowania intensywnie korzystające z zapisu/wykonywania zwykle wymagają profilu uprawnień ACPX, który może działać bez nadzoru.

  </Accordion>
</AccordionGroup>

Narzędzia Plugin OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie udostępniane
środowiskom ACP. Włącz jawne mosty MCP w
[Konfiguracja agentów ACP](/pl/tools/acp-agents-setup) tylko wtedy, gdy środowisko
powinno wywoływać te narzędzia bezpośrednio.

## Obsługiwane cele środowisk

Z backendem `acpx` używaj tych identyfikatorów środowisk jako celów `/acp spawn <id>`
lub `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator środowiska | Typowy backend                                  | Uwagi                                                                                  |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Wymaga uwierzytelniania Claude Code na hoście.                                       |
| `codex`    | Adapter Codex ACP                              | Jawna opcja awaryjna ACP tylko wtedy, gdy natywne `/codex` jest niedostępne albo zażądano ACP. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Wymaga uwierzytelniania Copilot CLI/środowiska uruchomieniowego.                     |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Nadpisz polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP.  |
| `droid`    | Factory Droid CLI                              | Wymaga uwierzytelniania Factory/Droid albo `FACTORY_API_KEY` w środowisku środowiska. |
| `gemini`   | Adapter Gemini CLI ACP                         | Wymaga uwierzytelniania Gemini CLI albo konfiguracji klucza API.                     |
| `iflow`    | iFlow CLI                                      | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.              |
| `kilocode` | Kilo Code CLI                                  | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.              |
| `kimi`     | Kimi/Moonshot CLI                              | Wymaga uwierzytelniania Kimi/Moonshot na hoście.                                     |
| `kiro`     | Kiro CLI                                       | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.              |
| `opencode` | Adapter OpenCode ACP                           | Wymaga uwierzytelniania OpenCode CLI/dostawcy.                                       |
| `openclaw` | Most OpenClaw Gateway przez `openclaw acp`     | Pozwala środowisku obsługującemu ACP komunikować się z powrotem z sesją OpenClaw Gateway. |
| `pi`       | Pi/wbudowane środowisko uruchomieniowe OpenClaw | Używane do eksperymentów ze środowiskami natywnymi dla OpenClaw.                     |
| `qwen`     | Qwen Code / Qwen CLI                           | Wymaga uwierzytelniania zgodnego z Qwen na hoście.                                   |

Niestandardowe aliasy agentów acpx można skonfigurować w samym acpx, ale polityka OpenClaw
nadal sprawdza `acp.allowedAgents` oraz każde mapowanie
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
  <Step title="Steruj">
    Bez zastępowania kontekstu: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Zatrzymaj">
    `/acp cancel` (bieżąca tura) albo `/acp close` (sesja + powiązania).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Szczegóły cyklu życia">
    - Uruchomienie tworzy lub wznawia sesję środowiska uruchomieniowego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy przebieg należy do rodzica.
    - Sesje ACP należące do rodzica są traktowane jako praca w tle nawet wtedy, gdy sesja środowiska uruchomieniowego jest trwała; ukończenie i dostarczanie między powierzchniami przechodzą przez powiadamiacz zadania rodzica, zamiast działać jak zwykła sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka końcowe lub osierocone jednorazowe sesje ACP należące do rodzica. Trwałe sesje ACP są zachowywane, gdy pozostaje aktywne powiązanie rozmowy; nieaktualne trwałe sesje bez aktywnego powiązania są zamykane, aby nie mogły zostać cicho wznowione po zakończeniu zadania właściciela lub zniknięciu jego rekordu zadania.
    - Powiązane wiadomości uzupełniające trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, odfokusowane, zresetowane albo nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako zwykły tekst promptu do powiązanego środowiska ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z perspektywy OpenClaw i usuwa powiązanie. Środowisko może nadal zachować własną historię upstream, jeśli obsługuje wznawianie.
    - Bezczynni pracownicy środowiska uruchomieniowego kwalifikują się do czyszczenia po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Reguły routingu natywnego Codex">
    Wyzwalacze w języku naturalnym, które powinny być kierowane do **natywnego Plugin
    Codex**, gdy jest włączony:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Natywne powiązanie rozmowy Codex jest domyślną ścieżką sterowania czatem.
    Dynamiczne narzędzia OpenClaw nadal wykonują się przez OpenClaw, podczas gdy
    natywne narzędzia Codex, takie jak shell/apply-patch, wykonują się wewnątrz Codex.
    Dla zdarzeń natywnych narzędzi Codex OpenClaw wstrzykuje natywny
    przekaźnik hooków na turę, aby hooki pluginów mogły blokować `before_tool_call`, obserwować
    `after_tool_call` i kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie pluginy mogą zażądać jeszcze jednego
    przebiegu modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów natywnych narzędzi Codex
    ani nie przepisuje rekordów wątków Codex. Użyj jawnego ACP tylko
    wtedy, gdy chcesz modelu środowiska uruchomieniowego/sesji ACP. Granica obsługi wbudowanego Codex
    jest udokumentowana w
    [kontrakcie obsługi środowiska Codex v1](/pl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Ściąga wyboru modelu / dostawcy / środowiska uruchomieniowego">
    - `openai-codex/*` - ścieżka PI Codex OAuth/subskrypcji.
    - `openai/*` plus `agentRuntime.id: "codex"` - natywne środowisko uruchomieniowe Codex osadzone w serwerze aplikacji.
    - `/codex ...` - natywne sterowanie konwersacją Codex.
    - `/acp ...` lub `runtime: "acp"` - jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze języka naturalnego do routingu ACP">
    Wyzwalacze, które powinny kierować do środowiska uruchomieniowego ACP:

    - "Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik."
    - "Użyj Gemini CLI do tego zadania w wątku, a następnie utrzymaj dalsze odpowiedzi w tym samym wątku."
    - "Uruchom Codex przez ACP w wątku w tle."

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje uprząż `agentId`,
    wiąże z bieżącą konwersacją lub wątkiem, gdy jest to obsługiwane, i
    kieruje dalsze odpowiedzi do tej sesji do czasu zamknięcia/wygaśnięcia. Codex
    podąża tą ścieżką tylko wtedy, gdy ACP/acpx jest jawne albo natywny
    plugin Codex jest niedostępny dla żądanej operacji.

    Dla `sessions_spawn`, `runtime: "acp"` jest ogłaszane tylko wtedy, gdy ACP
    jest włączone, żądający nie jest w piaskownicy, a backend środowiska
    uruchomieniowego ACP jest załadowany. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    wysyłanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych
    wywołań `sessions_spawn({ runtime: "acp" })`. Celuje w identyfikatory uprzęży ACP, takie jak `codex`,
    `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
    identyfikatora agenta konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
    jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
    w przeciwnym razie użyj domyślnego środowiska uruchomieniowego podagenta. Gdy agent OpenClaw
    jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
    `runtime.acp.agent` jako bazowego identyfikatora uprzęży.

  </Accordion>
</AccordionGroup>

## ACP a podagenci

Użyj ACP, gdy chcesz użyć zewnętrznego środowiska uruchomieniowego uprzęży. Użyj **natywnego
serwera aplikacji Codex** do wiązania/sterowania konwersacją Codex, gdy plugin `codex`
jest włączony. Użyj **podagentów**, gdy chcesz delegowanych uruchomień
natywnych dla OpenClaw.

| Obszar          | Sesja ACP                           | Uruchomienie podagenta                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko uruchomieniowe       | Plugin backendu ACP (na przykład acpx) | Natywne środowisko uruchomieniowe podagenta OpenClaw  |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania    | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko uruchomieniowe) |

Zobacz też [Podagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos to:

1. Płaszczyzna sterowania sesją ACP OpenClaw.
2. Oficjalny plugin środowiska uruchomieniowego `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Mechanizmy środowiska uruchomieniowego/sesji po stronie Claude.

ACP Claude jest **sesją uprzęży** z kontrolkami ACP, wznawianiem sesji,
śledzeniem zadań w tle i opcjonalnym wiązaniem konwersacji/wątku.

Backendy CLI są oddzielnymi tekstowymi lokalnymi środowiskami awaryjnymi - zobacz
[Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest taka:

- **Chcesz `/acp spawn`, wiązalne sesje, kontrolki środowiska uruchomieniowego albo trwałą pracę uprzęży?** Użyj ACP.
- **Chcesz prostego lokalnego awaryjnego tekstu przez surowe CLI?** Użyj backendów CLI.

## Sesje powiązane

### Model mentalny

- **Powierzchnia czatu** - miejsce, w którym ludzie kontynuują rozmowę (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** - trwały stan środowiska uruchomieniowego Codex/Claude/Gemini, do którego kieruje OpenClaw.
- **Wątek/temat podrzędny** - opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`.
- **Obszar roboczy środowiska uruchomieniowego** - lokalizacja systemu plików (`cwd`, checkout repozytorium, obszar roboczy backendu), w której działa uprząż. Niezależna od powierzchni czatu.

### Powiązania bieżącej konwersacji

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do
utworzonej sesji ACP - bez wątku podrzędnego, ta sama powierzchnia czatu. OpenClaw nadal
zarządza transportem, uwierzytelnianiem, bezpieczeństwem i dostarczaniem. Kolejne wiadomości w tej
konwersacji trafiają do tej samej sesji; `/new` i `/reset` resetują
sesję w miejscu; `/acp close` usuwa powiązanie.

Przykłady:

```text
/codex bind                                              # natywne powiązanie Codex, kieruj przyszłe wiadomości tutaj
/codex model gpt-5.4                                     # dostrój powiązany natywny wątek Codex
/codex stop                                              # steruj aktywną turą natywnego Codex
/acp spawn codex --bind here                             # jawne awaryjne ACP dla Codex
/acp spawn codex --thread auto                           # może utworzyć wątek/temat podrzędny i powiązać tam
/acp spawn codex --bind here --cwd /workspace/repo       # to samo powiązanie czatu, Codex działa w /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reguły wiązania i wyłączność">
    - `--bind here` i `--thread ...` wzajemnie się wykluczają.
    - `--bind here` działa tylko na kanałach, które ogłaszają wiązanie bieżącej konwersacji; w przeciwnym razie OpenClaw zwraca czytelny komunikat o braku obsługi. Powiązania utrzymują się po restartach Gateway.
    - W Discord, `spawnSessions` bramkuje tworzenie wątków podrzędnych dla `--thread auto|here` - nie dla `--bind here`.
    - Jeśli uruchomisz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **agenta docelowego**. Brakujące odziedziczone ścieżki (`ENOENT`/`ENOTDIR`) wracają do domyślnej wartości backendu; inne błędy dostępu (np. `EACCES`) są zgłaszane jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w powiązanych konwersacjach - polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst dalszych odpowiedzi trafia do powiązanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje powiązane z wątkiem">
    Gdy powiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Kolejne wiadomości w tym wątku trafiają do powiązanej sesji ACP.
    - Wyjście ACP jest dostarczane z powrotem do tego samego wątku.
    - Usunięcie fokusu/zamknięcie/archiwizacja/limit bezczynności albo wygaśnięcie maksymalnego wieku usuwa powiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` są poleceniami Gateway, a nie promptami dla uprzęży ACP.

    Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne wysyłanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Włączone uruchamianie sesji wątków adaptera kanału (domyślnie: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Obsługa wiązania wątków jest specyficzna dla adaptera. Jeśli aktywny adapter
    kanału nie obsługuje powiązań wątków, OpenClaw zwraca czytelny
    komunikat o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału, który udostępnia zdolność wiązania sesji/wątku.
    - Obecna wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy DM).
    - Kanały pluginów mogą dodać obsługę przez ten sam interfejs wiązania.

  </Accordion>
</AccordionGroup>

## Trwałe powiązania kanałów

Dla nieulotnych przepływów pracy skonfiguruj trwałe powiązania ACP we
wpisach najwyższego poziomu `bindings[]`.

### Model wiązania

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe powiązanie konwersacji ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje docelową konwersację. Kształty według kanału:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych powiązań grup.
- **DM/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` dla stabilnych powiązań grup.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Identyfikator agenta OpenClaw, który jest właścicielem.
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

### Domyślne ustawienia środowiska uruchomieniowego dla agenta

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
- Tymczasowe powiązania środowiska uruchomieniowego (na przykład utworzone przez przepływy fokusu wątku) nadal mają zastosowanie tam, gdzie istnieją.
- Dla uruchomień ACP między agentami bez jawnego `cwd`, OpenClaw dziedziczy obszar roboczy agenta docelowego z konfiguracji agenta.
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
    dla sesji ACP. Jeśli pominięto `agentId`, OpenClaw używa
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
  Identyfikator docelowego harnessu ACP. Wraca do `acp.defaultAgent`, jeśli jest ustawione.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Żąda przepływu wiązania wątku tam, gdzie jest obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` jest jednorazowe; `"session"` jest trwałe. Jeśli `thread: true` i
  pominięto `mode`, OpenClaw może domyślnie użyć trwałego zachowania zgodnie ze
  ścieżką runtime. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy runtime (walidowany przez zasady backendu/runtime).
  Jeśli pominięto, spawn ACP dziedziczy obszar roboczy agenta docelowego,
  gdy jest skonfigurowany; brakujące odziedziczone ścieżki wracają do wartości
  domyślnych backendu, natomiast rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora, używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza historię
  konwersacji przez `session/load`. Wymaga `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` przesyła strumieniowo podsumowania postępu początkowego uruchomienia
  ACP z powrotem do sesji żądającej jako zdarzenia systemowe. Akceptowane
  odpowiedzi obejmują `streamLogPath` wskazujące na ograniczony do sesji dziennik
  JSONL (`<sessionId>.acp-stream.jsonl`), który możesz śledzić, aby zobaczyć pełną
  historię przekazywania.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Przerywa turę podrzędną ACP po N sekundach. `0` utrzymuje turę na ścieżce
  Gateway bez limitu czasu. Ta sama wartość jest stosowana do uruchomienia Gateway
  i runtime ACP, aby zablokowane lub pozbawione limitu harnessy nie zajmowały
  pasa agenta nadrzędnego bez końca.
</ParamField>
<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla sesji podrzędnej ACP. Spawny Codex ACP
  normalizują odwołania OpenClaw Codex, takie jak `openai-codex/gpt-5.4`, do
  konfiguracji startowej Codex ACP przed `session/new`; formy slash, takie jak
  `openai-codex/gpt-5.4/high`, ustawiają także wysiłek rozumowania Codex ACP.
  Inne harnessy muszą ogłaszać ACP `models` i obsługiwać `session/set_model`;
  w przeciwnym razie OpenClaw/acpx zawodzi jasno zamiast po cichu wracać do
  domyślnego agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny wysiłek myślenia/rozumowania. Dla Codex ACP `minimal` mapuje się na
  niski wysiłek, `low`/`medium`/`high`/`xhigh` mapują się bezpośrednio, a `off`
  pomija startowe nadpisanie wysiłku rozumowania.
</ParamField>

## Tryby wiązania spawnu i wątku

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                            |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Powiąż bieżącą aktywną konwersację w miejscu; zawiedź, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz powiązania bieżącej konwersacji.                            |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „uczyń ten kanał lub czat wspieranym przez Codex”.
    - `--bind here` nie tworzy wątku podrzędnego.
    - `--bind here` jest dostępne tylko w kanałach, które udostępniają obsługę wiązania bieżącej konwersacji.
    - `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                         |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek podrzędny, gdy jest obsługiwany. |
    | `here` | Wymagaj bieżącego aktywnego wątku; zawiedź, jeśli w żadnym nie jesteś.                              |
    | `off`  | Brak wiązania. Sesja startuje bez powiązania.                                                       |

    Uwagi:

    - Na powierzchniach bez wiązania wątków domyślne zachowanie jest faktycznie `off`.
    - Spawn powiązany z wątkiem wymaga obsługi przez zasady kanału:
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
    Sesje interaktywne mają kontynuować rozmowę na widocznej powierzchni czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą konwersację z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwałe skonfigurowane `bindings[].type="acp"` kierują pasujące konwersacje do tej samej sesji ACP.

    Kolejne wiadomości w powiązanej konwersacji trafiają bezpośrednio do sesji
    ACP, a wyjście ACP jest dostarczane z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do harnessu:

    - Zwykłe powiązane kontynuacje są wysyłane jako tekst promptu oraz załączniki tylko wtedy, gdy harness/backend je obsługuje.
    - Polecenia zarządzające `/acp` i lokalne polecenia Gateway są przechwytywane przed wysłaniem do ACP.
    - Zdarzenia ukończenia wygenerowane przez runtime są materializowane dla każdego celu. Agenty OpenClaw otrzymują wewnętrzną kopertę kontekstu runtime OpenClaw; zewnętrzne harnessy ACP otrzymują zwykły prompt z wynikiem podrzędnym i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych harnessów ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają widocznego dla użytkownika tekstu wyzwalacza albo zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają ustrukturyzowane w OpenClaw tam, gdzie to możliwe, i nie są traktowane jako treść czatu autorstwa użytkownika.

  </Accordion>
  <Accordion title="Jednorazowe sesje ACP należące do rodzica">
    Jednorazowe sesje ACP spawnowane przez inne uruchomienie agenta są dziećmi
    w tle, podobnie jak sub-agenci:

    - Rodzic prosi o pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Dziecko działa we własnej sesji harnessu ACP.
    - Tury dziecka działają na tym samym pasie w tle, którego używają natywne spawny sub-agentów, więc wolny harness ACP nie blokuje niepowiązanej pracy sesji głównej.
    - Ukończenie raportuje z powrotem przez ścieżkę ogłaszania ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia na zwykły prompt ACP przed wysłaniem go do zewnętrznego harnessu, więc harnessy nie widzą markerów kontekstu runtime dostępnych tylko w OpenClaw.
    - Rodzic przepisuje wynik dziecka normalnym głosem asystenta, gdy przydatna jest odpowiedź widoczna dla użytkownika.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między rodzicem
    a dzieckiem. Dziecko ma już kanał ukończenia z powrotem do rodzica.

  </Accordion>
  <Accordion title="sessions_send i dostarczanie A2A">
    `sessions_send` może po spawnie kierować do innej sesji. Dla zwykłych
    sesji równorzędnych OpenClaw używa ścieżki kontynuacji agent-to-agent (A2A)
    po wstrzyknięciu wiadomości:

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól żądającemu i celowi wymienić ograniczoną liczbę tur kontynuacji.
    - Poproś cel o utworzenie wiadomości ogłoszenia.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest ścieżką zapasową dla wysyłek peer, w których nadawca
    potrzebuje widocznej kontynuacji. Pozostaje włączona, gdy niepowiązana sesja
    może zobaczyć i wysłać wiadomość do celu ACP, na przykład przy szerokich
    ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija kontynuację A2A tylko wtedy, gdy żądający jest rodzicem
    własnego, należącego do rodzica jednorazowego dziecka ACP. W takim przypadku
    uruchomienie A2A na ścieżce ukończenia zadania może wybudzić rodzica wynikiem
    dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i utworzyć pętlę
    echa rodzic/dziecko. Wynik `sessions_send` raportuje
    `delivery.status="skipped"` dla tego przypadku własnego dziecka, ponieważ
    ścieżka ukończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Wznawianie istniejącej sesji">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast zaczynać
    od nowa. Agent odtwarza historię konwersacji przez `session/load`, więc
    podejmuje pracę z pełnym kontekstem tego, co było wcześniej.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe przypadki użycia:

    - Przekaż sesję Codex z laptopa na telefon - powiedz agentowi, aby podjął pracę od miejsca, w którym skończyłeś.
    - Kontynuuj sesję kodowania rozpoczętą interaktywnie w CLI, teraz bezinterfejsowo przez swojego agenta.
    - Podejmij pracę przerwaną przez restart gatewaya lub limit czasu bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślny runtime sub-agenta ignoruje to pole dostępne tylko dla ACP.
    - `streamTo` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślny runtime sub-agenta ignoruje to pole dostępne tylko dla ACP.
    - `resumeSessionId` to lokalny dla hosta identyfikator wznowienia ACP/harnessu, a nie klucz sesji kanału OpenClaw; OpenClaw nadal sprawdza zasady spawnu ACP i zasady agenta docelowego przed wysłaniem, natomiast backend ACP lub harness odpowiada za autoryzację ładowania tego identyfikatora upstream.
    - `resumeSessionId` przywraca historię konwersacji upstream ACP; `thread` i `mode` nadal normalnie stosują się do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, spawn kończy się jasnym błędem - bez cichego powrotu do nowej sesji.

  </Accordion>
  <Accordion title="Test dymny po wdrożeniu">
    Po wdrożeniu gatewaya uruchom żywy test end-to-end zamiast ufać testom
    jednostkowym:

    1. Zweryfikuj wersję i commit wdrożonego gatewaya na hoście docelowym.
    2. Otwórz tymczasową sesję mostu ACPX do żywego agenta.
    3. Poproś tego agenta, aby wywołał `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` oraz zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywiste `childSessionKey` i brak błędu walidatora.
    5. Posprzątaj tymczasową sesję mostu.

    Utrzymaj bramkę na `mode: "run"` i pomiń `streamTo: "parent"` -
    powiązane z wątkiem `mode: "session"` oraz ścieżki przekazywania strumienia
    są osobnymi, bogatszymi przebiegami integracyjnymi.

  </Accordion>
</AccordionGroup>

## Zgodność z piaskownicą

Sesje ACP obecnie działają w runtime hosta, **nie** wewnątrz piaskownicy
OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzny harness może odczytywać/zapisywać zgodnie z własnymi uprawnieniami CLI i wybranym `cwd`.
- Polityka piaskownicy OpenClaw **nie** obejmuje wykonywania harnessa ACP.
- OpenClaw nadal wymusza bramki funkcji ACP, dozwolonych agentów, własność sesji, powiązania kanałów oraz politykę dostarczania Gateway.
- Użyj `runtime: "subagent"` dla natywnej pracy OpenClaw z wymuszaną piaskownicą.

</Warning>

Aktualne ograniczenia:

- Jeśli sesja żądająca działa w piaskownicy, tworzenie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozpoznawanie celu sesji

Większość akcji `/acp` przyjmuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozpoznawania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - próbuje klucza
   - następnie identyfikatora sesji w formacie UUID
   - następnie etykiety
2. Powiązanie bieżącego wątku (jeśli ta rozmowa/wątek jest powiązana z sesją ACP).
3. Awaryjnie bieżąca sesja żądająca.

Powiązania bieżącej rozmowy i powiązania wątku uczestniczą w
kroku 2.

Jeśli nie uda się rozpoznać celu, OpenClaw zwraca jasny błąd
(`Unable to resolve session target: ...`).

## Sterowanie ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne powiązanie bieżące lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje trwającą turę dla sesji docelowej.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązania celów wątku.              | `/acp close`                                                  |
| `/acp status`        | Pokazuje zaplecze, tryb, stan, opcje środowiska wykonawczego i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb środowiska wykonawczego dla sesji docelowej. | `/acp set-mode plan`                                          |
| `/acp set`           | Zapisuje ogólną opcję konfiguracji środowiska wykonawczego. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego środowiska wykonawczego. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu środowiska wykonawczego (sekundy).    | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu środowiska wykonawczego.        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska wykonawczego sesji.     | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                  | `/acp sessions`                                               |
| `/acp doctor`        | Stan zaplecza, możliwości, możliwe do wykonania poprawki. | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączenia.   | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje środowiska wykonawczego oraz identyfikatory sesji na poziomie środowiska wykonawczego i
zaplecza. Błędy nieobsługiwanego sterowania są wyświetlane
jasno, gdy zapleczu brakuje danej możliwości. `/acp sessions` odczytuje
magazyn dla bieżącej powiązanej albo żądającej sesji; tokeny celu
(`session-key`, `session-id` lub `session-label`) są rozpoznawane przez
wykrywanie sesji Gateway, w tym niestandardowe katalogi główne `session.store`
dla poszczególnych agentów.

### Mapowanie opcji środowiska wykonawczego

`/acp` ma wygodne polecenia i ogólny setter. Równoważne
operacje:

| Polecenie                    | Mapuje na                            | Uwagi                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | klucz konfiguracji środowiska wykonawczego `model` | Dla Codex ACP OpenClaw normalizuje `openai-codex/<model>` do identyfikatora modelu adaptera i mapuje sufiksy rozumowania z ukośnikiem, takie jak `openai-codex/gpt-5.4/high`, na `reasoning_effort`. |
| `/acp set thinking <level>`  | klucz konfiguracji środowiska wykonawczego `thinking` | Dla Codex ACP OpenClaw wysyła odpowiadający `reasoning_effort`, jeśli adapter go obsługuje.                                                                                    |
| `/acp permissions <profile>` | klucz konfiguracji środowiska wykonawczego `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | klucz konfiguracji środowiska wykonawczego `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | nadpisanie cwd środowiska wykonawczego | Bezpośrednia aktualizacja.                                                                                                                                                     |
| `/acp set <key> <value>`     | ogólne                               | `key=cwd` używa ścieżki nadpisania cwd.                                                                                                                                       |
| `/acp reset-options`         | czyści wszystkie nadpisania środowiska wykonawczego | -                                                                                                                                                                              |

## Harness acpx, konfiguracja Plugin i uprawnienia

Konfigurację harnessa acpx (aliasy Claude Code / Codex / Gemini CLI),
mosty MCP plugin-tools i OpenClaw-tools oraz tryby uprawnień ACP opisuje
[Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                                                                | Rozwiązanie                                                                                                                                                             |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Brak Plugin backendu, jest on wyłączony albo zablokowany przez `plugins.allow`.                                        | Zainstaluj i włącz Plugin backendu, uwzględnij `acpx` w `plugins.allow`, gdy ta lista dozwolonych elementów jest ustawiona, a następnie uruchom `/acp doctor`.          |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                                                          | Ustaw `acp.enabled=true`.                                                                                                                                               |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatyczne wysyłanie ze zwykłych wiadomości wątku jest wyłączone.                                                    | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne kierowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają.                     |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na liście dozwolonych.                                                                          | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                        |
| `/acp doctor` reports backend not ready right after startup                 | Brak Plugin backendu, jest on wyłączony, zablokowany przez zasadę zezwalania/odmawiania albo jego skonfigurowany plik wykonywalny jest niedostępny. | Zainstaluj/włącz Plugin backendu, uruchom ponownie `/acp doctor` i sprawdź błąd instalacji backendu lub zasad, jeśli nadal jest niesprawny.                             |
| Harness command not found                                                   | CLI adaptera nie jest zainstalowane, brakuje zewnętrznego Plugin albo pierwsze pobranie `npx` nie powiodło się dla adaptera innego niż Codex. | Uruchom `/acp doctor`, zainstaluj/wstępnie przygotuj adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx.                                           |
| Model-not-found from the harness                                            | Identyfikator modelu jest prawidłowy dla innego dostawcy/harnessu, ale nie dla tego celu ACP.                          | Użyj modelu wymienionego przez ten harness, skonfiguruj model w harnessie albo pomiń nadpisanie.                                                                        |
| Vendor auth error from the harness                                          | OpenClaw działa prawidłowo, ale docelowe CLI/dostawca nie jest zalogowane.                                             | Zaloguj się albo podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                              |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token klucza/identyfikatora/etykiety.                                                                    | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej rozmowy, z którą można powiązać.                                                      | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową.                                                           | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | Użyto `--thread here` poza kontekstem wątku.                                                                           | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                            |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                                           | Powiąż ponownie jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                      |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązania wątku.                                                                            | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Środowisko uruchomieniowe ACP działa po stronie hosta; sesja żądająca działa w piaskownicy.                           | Użyj `runtime="subagent"` z sesji w piaskownicy albo uruchom ACP spawn z sesji bez piaskownicy.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla środowiska uruchomieniowego ACP.                                                      | Użyj `runtime="subagent"` dla wymaganego działania w piaskownicy albo użyj ACP z `sandbox="inherit"` z sesji bez piaskownicy.                                           |
| `Cannot apply --model ... did not advertise model support`                  | Docelowy harness nie udostępnia ogólnego przełączania modelu ACP.                                                      | Użyj harnessu, który deklaruje ACP `models`/`session/set_model`, użyj referencji modelu Codex ACP albo skonfiguruj model bezpośrednio w harnessie, jeśli ma własną flagę startową. |
| Missing ACP metadata for bound session                                      | Nieaktualne/usunięte metadane sesji ACP.                                                                               | Utwórz ponownie za pomocą `/acp spawn`, a następnie ponownie powiąż/ustaw fokus wątku.                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapisy/wykonywanie w nieinteraktywnej sesji ACP.                                              | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i zrestartuj Gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`.                                 | Sprawdź logi Gateway pod kątem `AcpRuntimeError`. Aby uzyskać pełne uprawnienia, ustaw `permissionMode=approve-all`; aby zapewnić łagodną degradację, ustaw `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Proces harnessu zakończył się, ale sesja ACP nie zgłosiła ukończenia.                                                  | Monitoruj za pomocą `ps aux \| grep acpx`; ręcznie zakończ nieaktualne procesy.                                                                                        |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Wewnętrzna koperta zdarzenia przedostała się przez granicę ACP.                                                        | Zaktualizuj OpenClaw i uruchom ponownie przepływ ukończenia; zewnętrzne harnessy powinny otrzymywać wyłącznie zwykłe prompty ukończenia.                                |

## Powiązane

- [Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Backendy CLI](/pl/gateway/cli-backends)
- [Harness Codex](/pl/plugins/codex-harness)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Subagenci](/pl/tools/subagents)
