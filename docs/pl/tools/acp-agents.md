---
read_when:
    - Uruchamianie środowisk kodowania za pośrednictwem ACP
    - Konfigurowanie sesji ACP powiązanych z rozmową w kanałach komunikacyjnych
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, okablowaniem Plugin lub dostarczaniem ukończeń
    - Obsługiwanie poleceń /acp z poziomu czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne środowiska kodowania (Claude Code, Cursor, Gemini CLI, jawny Codex ACP, OpenClaw ACP, OpenCode) przez backend ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-05-01T10:04:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

[Sesje Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
pozwalają OpenClaw uruchamiać zewnętrzne środowiska kodowania (na przykład Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI i inne
obsługiwane środowiska ACPX) przez Plugin backendu ACP.

Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

<Note>
**ACP to ścieżka zewnętrznego środowiska, a nie domyślna ścieżka Codex.** Natywny
Plugin serwera aplikacji Codex obsługuje sterowanie `/codex ...` oraz
wbudowane środowisko uruchomieniowe `agentRuntime.id: "codex"`; ACP obsługuje
sterowanie `/acp ...` i sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                         | Użyj tego                             | Uwagi                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać Codex z bieżącą konwersacją albo nim sterować                                           | `/codex bind`, `/codex threads`       | Natywna ścieżka serwera aplikacji Codex, gdy Plugin `codex` jest włączony; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/szybki tryb/uprawnienia, zatrzymanie i sterowanie. ACP jest jawną ścieżką awaryjną |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP albo inne zewnętrzne środowisko _przez_ OpenClaw | Ta strona                             | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, sterowanie środowiskiem uruchomieniowym                                                          |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta                      | [`openclaw acp`](/pl/cli/acp)            | Tryb mostu. IDE/klient komunikuje się z OpenClaw przez ACP po stdio/WebSocket                                                                                                                   |
| Ponownie użyć lokalnego AI CLI jako tekstowego modelu awaryjnego                                 | [Backendy CLI](/pl/gateway/cli-backends) | Nie ACP. Brak narzędzi OpenClaw, brak sterowania ACP, brak środowiska uruchomieniowego środowiska                                                                                              |

## Czy to działa od razu po instalacji?

Zwykle tak. Świeże instalacje zawierają dołączony Plugin środowiska uruchomieniowego `acpx`,
domyślnie włączony, z lokalnie przypiętym w Pluginie plikiem binarnym `acpx`, który OpenClaw wykrywa
i sam naprawia natychmiast po uruchomieniu nasłuchiwania HTTP Gateway. Uruchom
`/acp doctor`, aby sprawdzić gotowość.

OpenClaw informuje agentów o uruchamianiu ACP tylko wtedy, gdy ACP jest **rzeczywiście
używalne**: ACP musi być włączone, wysyłanie nie może być wyłączone, bieżąca
sesja nie może być zablokowana przez piaskownicę, a backend środowiska uruchomieniowego musi być
załadowany. Jeśli te warunki nie są spełnione, Skills Pluginu ACP i wskazówki
`sessions_spawn` dla ACP pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Pułapki pierwszego uruchomienia">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny spis Pluginów i **musi** zawierać `acpx`; w przeciwnym razie dołączona wartość domyślna jest celowo blokowana, a `/acp doctor` zgłasza brakujący wpis na liście dozwolonych.
    - Dołączony adapter Codex ACP jest przygotowywany z Pluginem `acpx` i uruchamiany lokalnie, gdy to możliwe.
    - Inne docelowe adaptery środowisk nadal mogą być pobierane na żądanie przez `npx` przy pierwszym użyciu.
    - Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego środowiska.
    - Jeśli host nie ma npm ani dostępu do sieci, pobieranie adapterów przy pierwszym uruchomieniu nie powiedzie się, dopóki pamięci podręczne nie zostaną wstępnie rozgrzane albo adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska uruchomieniowego">
    ACP uruchamia rzeczywisty zewnętrzny proces środowiska. OpenClaw odpowiada za routing,
    stan zadania w tle, dostarczanie, powiązania i politykę; środowisko
    odpowiada za logowanie do swojego dostawcy, katalog modeli, zachowanie systemu plików i
    natywne narzędzia.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony, zdrowy backend.
    - Identyfikator docelowy jest dozwolony przez `acp.allowedAgents`, gdy ta lista dozwolonych jest ustawiona.
    - Polecenie środowiska może uruchomić się na hoście Gateway.
    - Uwierzytelnianie dostawcy jest obecne dla tego środowiska (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego środowiska — identyfikatory modeli nie są przenośne między środowiskami.
    - Żądany `cwd` istnieje i jest dostępny albo pomiń `cwd` i pozwól backendowi użyć wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów o uprawnienia, więc intensywne uruchomienia kodowania z zapisem/wykonywaniem zwykle potrzebują profilu uprawnień ACPX, który może działać bez nadzoru.

  </Accordion>
</AccordionGroup>

Narzędzia Pluginów OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie udostępniane
środowiskom ACP. Włącz jawne mosty MCP w
[Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup) tylko wtedy, gdy środowisko
powinno bezpośrednio wywoływać te narzędzia.

## Obsługiwane środowiska docelowe

Z dołączonym backendem `acpx` używaj tych identyfikatorów środowisk jako celów `/acp spawn <id>`
albo `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator środowiska | Typowy backend                                  | Uwagi                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Wymaga uwierzytelniania Claude Code na hoście.                                      |
| `codex`    | Adapter Codex ACP                              | Jawna ścieżka awaryjna ACP tylko wtedy, gdy natywne `/codex` jest niedostępne albo zażądano ACP. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Wymaga uwierzytelniania Copilot CLI/środowiska uruchomieniowego.                   |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Nadpisz polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP. |
| `droid`    | Factory Droid CLI                              | Wymaga uwierzytelniania Factory/Droid albo `FACTORY_API_KEY` w środowisku środowiska. |
| `gemini`   | Adapter Gemini CLI ACP                         | Wymaga uwierzytelniania Gemini CLI albo konfiguracji klucza API.                   |
| `iflow`    | iFlow CLI                                      | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.             |
| `kilocode` | Kilo Code CLI                                  | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.             |
| `kimi`     | Kimi/Moonshot CLI                              | Wymaga uwierzytelniania Kimi/Moonshot na hoście.                                    |
| `kiro`     | Kiro CLI                                       | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.             |
| `opencode` | Adapter OpenCode ACP                           | Wymaga uwierzytelniania OpenCode CLI/dostawcy.                                      |
| `openclaw` | Most OpenClaw Gateway przez `openclaw acp`     | Pozwala środowisku obsługującemu ACP komunikować się z powrotem z sesją OpenClaw Gateway. |
| `pi`       | Pi/wbudowane środowisko uruchomieniowe OpenClaw | Używane do eksperymentów ze środowiskami natywnymi dla OpenClaw.                    |
| `qwen`     | Qwen Code / Qwen CLI                           | Wymaga uwierzytelniania zgodnego z Qwen na hoście.                                  |

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
    Kontynuuj w powiązanej konwersacji lub wątku (albo wskaż
    klucz sesji jawnie).
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
    `/acp cancel` (bieżąca tura) albo `/acp close` (sesja + powiązania).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Szczegóły cyklu życia">
    - Uruchomienie tworzy lub wznawia sesję środowiska uruchomieniowego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy uruchomienie jest własnością rodzica.
    - Sesje ACP należące do rodzica są traktowane jako praca w tle nawet wtedy, gdy sesja środowiska uruchomieniowego jest trwała; ukończenie i dostarczanie między powierzchniami przechodzą przez powiadamiacz zadania nadrzędnego, zamiast działać jak normalna sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka terminalne lub osierocone jednorazowe sesje ACP należące do rodzica. Trwałe sesje ACP są zachowywane, dopóki pozostaje aktywne powiązanie konwersacji; przestarzałe trwałe sesje bez aktywnego powiązania są zamykane, aby nie mogły zostać po cichu wznowione po zakończeniu zadania właściciela albo usunięciu jego rekordu zadania.
    - Powiązane wiadomości uzupełniające trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, wycofane z fokusu, zresetowane albo nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako normalny tekst promptu do powiązanego środowiska ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Środowisko może nadal zachować własną historię nadrzędną, jeśli obsługuje wznawianie.
    - Bezczynne procesy robocze środowiska uruchomieniowego kwalifikują się do czyszczenia po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Natywne reguły routingu Codex">
    Wyzwalacze w języku naturalnym, które powinny kierować do **natywnego Pluginu Codex**,
    gdy jest włączony:

    - "Powiąż ten kanał Discord z Codex."
    - "Dołącz ten czat do wątku Codex `<id>`."
    - "Pokaż wątki Codex, a potem powiąż ten."

    Natywne powiązanie konwersacji Codex jest domyślną ścieżką sterowania czatem.
    Dynamiczne narzędzia OpenClaw nadal wykonują się przez OpenClaw, natomiast
    narzędzia natywne dla Codex, takie jak shell/apply-patch, wykonują się wewnątrz Codex.
    Dla zdarzeń narzędzi natywnych dla Codex OpenClaw wstrzykuje natywny przekaźnik hooków
    na każdą turę, aby hooki Pluginów mogły blokować `before_tool_call`, obserwować
    `after_tool_call` i kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie Pluginy mogą zażądać jeszcze jednego
    przebiegu modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów narzędzi natywnych dla Codex
    ani nie przepisuje rekordów wątków Codex. Używaj jawnego ACP tylko wtedy,
    gdy chcesz modelu środowiska uruchomieniowego/sesji ACP. Granica wbudowanej obsługi Codex
    jest udokumentowana w
    [kontrakcie obsługi środowiska Codex v1](/pl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Ściąga wyboru modelu / dostawcy / środowiska wykonawczego">
    - `openai-codex/*` — trasa OAuth/subskrypcji PI Codex.
    - `openai/*` plus `agentRuntime.id: "codex"` — natywne wbudowane środowisko wykonawcze Codex app-server.
    - `/codex ...` — natywne sterowanie konwersacją Codex.
    - `/acp ...` lub `runtime: "acp"` — jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze języka naturalnego dla trasowania ACP">
    Wyzwalacze, które powinny kierować do środowiska wykonawczego ACP:

    - "Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik."
    - "Użyj Gemini CLI do tego zadania w wątku, a potem utrzymuj kolejne odpowiedzi w tym samym wątku."
    - "Uruchom Codex przez ACP w wątku w tle."

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje uprząż `agentId`,
    wiąże z bieżącą konwersacją lub wątkiem, gdy jest to obsługiwane, i
    kieruje kolejne odpowiedzi do tej sesji aż do zamknięcia/wygaśnięcia. Codex
    podąża tą ścieżką tylko wtedy, gdy ACP/acpx jest jawne albo natywny
    plugin Codex jest niedostępny dla żądanej operacji.

    Dla `sessions_spawn`, `runtime: "acp"` jest ogłaszane tylko wtedy, gdy ACP
    jest włączone, żądający nie działa w piaskownicy, a backend środowiska
    wykonawczego ACP jest załadowany. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    wysyłanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych
    wywołań `sessions_spawn({ runtime: "acp" })`. Celuje w identyfikatory uprzęży ACP, takie jak `codex`,
    `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
    identyfikatora agenta z konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
    jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
    w przeciwnym razie użyj domyślnego środowiska wykonawczego podagenta. Gdy agent OpenClaw
    jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
    `runtime.acp.agent` jako bazowego identyfikatora uprzęży.

  </Accordion>
</AccordionGroup>

## ACP kontra podagenci

Użyj ACP, gdy potrzebujesz zewnętrznego środowiska wykonawczego uprzęży. Użyj **natywnego Codex
app-server** do wiązania/sterowania konwersacją Codex, gdy plugin `codex`
jest włączony. Użyj **podagentów**, gdy potrzebujesz natywnych dla OpenClaw
delegowanych uruchomień.

| Obszar        | Sesja ACP                              | Uruchomienie podagenta             |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko wykonawcze | Backend pluginu ACP (na przykład acpx) | Natywne środowisko wykonawcze podagenta OpenClaw |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko wykonawcze) |

Zobacz też [Podagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda tak:

1. Płaszczyzna sterowania sesją ACP OpenClaw.
2. Dołączony plugin środowiska wykonawczego `acpx`.
3. Adapter ACP Claude.
4. Mechanizmy środowiska wykonawczego/sesji po stronie Claude.

ACP Claude to **sesja uprzęży** ze sterowaniem ACP, wznawianiem sesji,
śledzeniem zadań w tle oraz opcjonalnym wiązaniem konwersacji/wątku.

Backendy CLI to oddzielne tekstowe lokalne zapasowe środowiska wykonawcze — zobacz
[Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada brzmi:

- **Potrzebujesz `/acp spawn`, wiązalnych sesji, sterowania środowiskiem wykonawczym lub trwałej pracy uprzęży?** Użyj ACP.
- **Potrzebujesz prostego lokalnego tekstowego trybu zapasowego przez surowe CLI?** Użyj backendów CLI.

## Sesje powiązane

### Model mentalny

- **Powierzchnia czatu** — miejsce, w którym ludzie dalej rozmawiają (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** — trwały stan środowiska wykonawczego Codex/Claude/Gemini, do którego OpenClaw trasuje.
- **Wątek/temat potomny** — opcjonalna dodatkowa powierzchnia komunikacji tworzona tylko przez `--thread ...`.
- **Przestrzeń robocza środowiska wykonawczego** — lokalizacja w systemie plików (`cwd`, checkout repozytorium, przestrzeń robocza backendu), w której działa uprząż. Niezależna od powierzchni czatu.

### Powiązania bieżącej konwersacji

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do
utworzonej sesji ACP — bez wątku potomnego, ta sama powierzchnia czatu. OpenClaw nadal
obsługuje transport, uwierzytelnianie, bezpieczeństwo i dostarczanie. Kolejne wiadomości w tej
konwersacji trafiają do tej samej sesji; `/new` i `/reset` resetują
sesję w miejscu; `/acp close` usuwa powiązanie.

Przykłady:

```text
/codex bind                                              # natywne powiązanie Codex, kieruj przyszłe wiadomości tutaj
/codex model gpt-5.4                                     # dostrój powiązany natywny wątek Codex
/codex stop                                              # steruj aktywną turą natywnego Codex
/acp spawn codex --bind here                             # jawny zapasowy ACP dla Codex
/acp spawn codex --thread auto                           # może utworzyć wątek/temat potomny i powiązać tam
/acp spawn codex --bind here --cwd /workspace/repo       # to samo powiązanie czatu, Codex działa w /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reguły wiązania i wyłączność">
    - `--bind here` i `--thread ...` wzajemnie się wykluczają.
    - `--bind here` działa tylko w kanałach, które deklarują wiązanie bieżącej konwersacji; w przeciwnym razie OpenClaw zwraca czytelny komunikat o braku obsługi. Powiązania utrzymują się między restartami Gateway.
    - W Discord `spawnAcpSessions` jest wymagane tylko wtedy, gdy OpenClaw musi utworzyć wątek potomny dla `--thread auto|here` — nie dla `--bind here`.
    - Jeśli uruchomisz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy przestrzeń roboczą **agenta docelowego**. Brakujące odziedziczone ścieżki (`ENOENT`/`ENOTDIR`) wracają do domyślnej wartości backendu; inne błędy dostępu (np. `EACCES`) pojawiają się jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w powiązanych konwersacjach — polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst kolejnych odpowiedzi trafia do powiązanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje powiązane z wątkiem">
    Gdy powiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Kolejne wiadomości w tym wątku trafiają do powiązanej sesji ACP.
    - Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
    - Odłączenie fokusowania/zamknięcie/archiwizacja/limit bezczynności albo wygaśnięcie maksymalnego wieku usuwa powiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` to polecenia Gateway, a nie prompty do uprzęży ACP.

    Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne wysyłanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Włączona flaga tworzenia wątków ACP adaptera kanału (specyficzna dla adaptera):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Obsługa powiązań wątków jest specyficzna dla adaptera. Jeśli aktywny adapter
    kanału nie obsługuje powiązań wątków, OpenClaw zwraca czytelny
    komunikat o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału, który udostępnia możliwość wiązania sesji/wątku.
    - Obecna wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy DM).
    - Kanały Plugin mogą dodać obsługę przez ten sam interfejs wiązania.

  </Accordion>
</AccordionGroup>

## Trwałe powiązania kanałów

Dla nieefemerycznych przepływów pracy skonfiguruj trwałe powiązania ACP w
wpisach najwyższego poziomu `bindings[]`.

### Model wiązania

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe powiązanie konwersacji ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje konwersację docelową. Kształty dla poszczególnych kanałów:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` lub `chat_identifier:*` dla stabilnych powiązań grup.
- **DM/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` dla stabilnych powiązań grup.

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
  Opcjonalny katalog roboczy środowiska wykonawczego.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Opcjonalne nadpisanie backendu.
</ParamField>

### Domyślne wartości środowiska wykonawczego dla agenta

Użyj `agents.list[].runtime`, aby jednorazowo zdefiniować domyślne wartości ACP dla agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator uprzęży, np. `codex` lub `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Pierwszeństwo nadpisań dla powiązanych sesji ACP:**

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
- W powiązanych konwersacjach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe powiązania środowiska wykonawczego (na przykład utworzone przez przepływy fokusowania wątków) nadal mają zastosowanie tam, gdzie są obecne.
- Dla uruchomień ACP między agentami bez jawnego `cwd` OpenClaw dziedziczy przestrzeń roboczą agenta docelowego z konfiguracji agenta.
- Brakujące odziedziczone ścieżki przestrzeni roboczej wracają do domyślnego cwd backendu; niebrakujące błędy dostępu pojawiają się jako błędy uruchomienia.

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
    dla sesji ACP. Jeśli pominięto `agentId`, OpenClaw używa
    `acp.defaultAgent`, gdy jest skonfigurowany. `mode: "session"` wymaga
    `thread: true`, aby utrzymać trwałą powiązaną rozmowę.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Użyj `/acp spawn`, aby mieć jawną kontrolę operatora z czatu.

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
  Identyfikator docelowego adaptera wykonawczego ACP. Wraca do `acp.defaultAgent`, jeśli jest ustawiony.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Żądaj przepływu powiązania wątku tam, gdzie jest obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` jest jednorazowe; `"session"` jest trwałe. Jeśli `thread: true`, a
  `mode` pominięto, OpenClaw może domyślnie użyć trwałego zachowania zgodnie ze
  ścieżką środowiska wykonawczego. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy środowiska wykonawczego (walidowany przez politykę
  backendu/środowiska wykonawczego). Jeśli go pominięto, uruchomienie ACP dziedziczy
  obszar roboczy agenta docelowego, gdy jest skonfigurowany; brakujące dziedziczone ścieżki wracają do domyślnych
  ustawień backendu, a rzeczywiste błędy dostępu są zwracane.
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
  `"parent"` strumieniuje podsumowania postępu początkowego uruchomienia ACP z powrotem do
  sesji żądającej jako zdarzenia systemowe. Akceptowane odpowiedzi obejmują
  `streamLogPath`, wskazujący dziennik JSONL o zakresie sesji
  (`<sessionId>.acp-stream.jsonl`), który możesz śledzić, aby zobaczyć pełną historię przekazywania.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Przerywa turę potomną ACP po N sekundach. `0` utrzymuje turę na
  ścieżce Gateway bez limitu czasu. Ta sama wartość jest stosowana do uruchomienia Gateway
  i środowiska wykonawczego ACP, aby zatrzymane lub wyczerpane limitami adaptery wykonawcze nie
  zajmowały pasa agenta nadrzędnego bez końca.
</ParamField>
<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla sesji potomnej ACP. Uruchomienia ACP Codex
  normalizują odwołania OpenClaw Codex, takie jak `openai-codex/gpt-5.4`, do konfiguracji startowej Codex
  ACP przed `session/new`; formy ukośnikowe, takie jak
  `openai-codex/gpt-5.4/high`, ustawiają też wysiłek rozumowania Codex ACP.
  Inne adaptery wykonawcze muszą ogłaszać `models` ACP i obsługiwać
  `session/set_model`; w przeciwnym razie OpenClaw/acpx zgłasza jasny błąd zamiast
  po cichu wracać do domyślnego agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny wysiłek myślenia/rozumowania. Dla Codex ACP `minimal` mapuje się na
  niski wysiłek, `low`/`medium`/`high`/`xhigh` mapują się bezpośrednio, a `off`
  pomija nadpisanie startowe wysiłku rozumowania.
</ParamField>

## Tryby powiązania uruchomienia i wątku

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                             |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Powiąż bieżącą aktywną rozmowę w miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz powiązania z bieżącą rozmową.                                |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „uczyń ten kanał lub czat obsługiwanym przez Codex”.
    - `--bind here` nie tworzy wątku potomnego.
    - `--bind here` jest dostępne tylko na kanałach, które udostępniają obsługę powiązania bieżącej rozmowy.
    - `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                         |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek potomny, gdy jest obsługiwany. |
    | `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli nie jesteś w wątku.                       |
    | `off`  | Brak powiązania. Sesja startuje bez powiązania.                                                    |

    Uwagi:

    - Na powierzchniach bez powiązania wątków domyślne zachowanie to w praktyce `off`.
    - Uruchomienie powiązane z wątkiem wymaga obsługi przez politykę kanału:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Użyj `--bind here`, gdy chcesz przypiąć bieżącą rozmowę bez tworzenia wątku potomnego.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą być interaktywnymi obszarami roboczymi albo pracą w tle
należącą do rodzica. Ścieżka dostarczania zależy od tej formy.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sesje interaktywne służą do dalszej rozmowy na widocznej powierzchni
    czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą rozmowę z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwale skonfigurowane `bindings[].type="acp"` kierują pasujące rozmowy do tej samej sesji ACP.

    Kolejne wiadomości w powiązanej rozmowie są kierowane bezpośrednio do
    sesji ACP, a wynik ACP jest dostarczany z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do adaptera wykonawczego:

    - Zwykłe powiązane kontynuacje są wysyłane jako tekst promptu oraz załączniki tylko wtedy, gdy adapter wykonawczy/backend je obsługuje.
    - Polecenia zarządzające `/acp` i lokalne polecenia Gateway są przechwytywane przed wysłaniem do ACP.
    - Zdarzenia ukończenia wygenerowane przez środowisko wykonawcze są materializowane zależnie od celu. Agenci OpenClaw otrzymują wewnętrzną kopertę kontekstu wykonawczego OpenClaw; zewnętrzne adaptery wykonawcze ACP otrzymują zwykły prompt z wynikiem potomnym i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych adapterów wykonawczych ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają tekstu wyzwalacza widocznego dla użytkownika albo zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają ustrukturyzowane w OpenClaw tam, gdzie to możliwe, i nie są traktowane jako treść czatu napisana przez użytkownika.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Jednorazowe sesje ACP uruchomione przez inny przebieg agenta działają jako
    dzieci w tle, podobnie jak podagenci:

    - Rodzic prosi o pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Dziecko działa we własnej sesji adaptera wykonawczego ACP.
    - Tury dziecka działają na tym samym pasie tła, którego używają natywne uruchomienia podagentów, więc powolny adapter wykonawczy ACP nie blokuje niepowiązanej pracy sesji głównej.
    - Raporty ukończenia wracają przez ścieżkę ogłaszania ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia na zwykły prompt ACP przed wysłaniem go do zewnętrznego adaptera wykonawczego, więc adaptery wykonawcze nie widzą markerów kontekstu wykonawczego dostępnych tylko dla OpenClaw.
    - Rodzic przepisuje wynik dziecka zwykłym głosem asystenta, gdy przydatna jest odpowiedź widoczna dla użytkownika.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między rodzicem
    a dzieckiem. Dziecko ma już kanał ukończenia z powrotem do
    rodzica.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` może wskazać inną sesję po uruchomieniu. Dla zwykłych
    sesji równorzędnych OpenClaw używa ścieżki kontynuacji agent-do-agenta (A2A)
    po wstrzyknięciu wiadomości:

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól żądającemu i celowi wymienić ograniczoną liczbę tur kontynuacji.
    - Poproś cel o utworzenie wiadomości ogłoszeniowej.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest rozwiązaniem awaryjnym dla wysyłek równorzędnych, gdy nadawca potrzebuje
    widocznej kontynuacji. Pozostaje włączona, gdy niepowiązana sesja może
    widzieć i wysyłać wiadomości do celu ACP, na przykład przy szerokich
    ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija kontynuację A2A tylko wtedy, gdy żądający jest
    rodzicem własnego jednorazowego dziecka ACP należącego do rodzica. W takim przypadku
    uruchomienie A2A ponad ukończeniem zadania może obudzić rodzica z
    wynikiem dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i
    utworzyć pętlę echa rodzic/dziecko. Wynik `sessions_send` zgłasza
    `delivery.status="skipped"` dla tego przypadku posiadanego dziecka, ponieważ
    ścieżka ukończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Resume an existing session">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    zaczynać od nowa. Agent odtwarza historię rozmowy przez
    `session/load`, więc kontynuuje z pełnym kontekstem tego, co było wcześniej.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe przypadki użycia:

    - Przekaż sesję Codex z laptopa na telefon — powiedz agentowi, aby podjął pracę od miejsca, w którym przerwano.
    - Kontynuuj sesję kodowania rozpoczętą interaktywnie w CLI, teraz bez interfejsu przez agenta.
    - Podejmij pracę przerwaną przez restart Gateway lub limit czasu bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślne środowisko wykonawcze podagenta ignoruje to pole wyłącznie dla ACP.
    - `streamTo` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślne środowisko wykonawcze podagenta ignoruje to pole wyłącznie dla ACP.
    - `resumeSessionId` to lokalny dla hosta identyfikator wznowienia ACP/adaptera wykonawczego, a nie klucz sesji kanału OpenClaw; OpenClaw nadal sprawdza politykę uruchamiania ACP i politykę agenta docelowego przed wysłaniem, natomiast backend lub adapter wykonawczy ACP odpowiada za autoryzację ładowania tego nadrzędnego identyfikatora.
    - `resumeSessionId` przywraca historię rozmowy nadrzędnego ACP; `thread` i `mode` nadal normalnie stosują się do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się jasnym błędem — bez cichego powrotu do nowej sesji.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Po wdrożeniu Gateway uruchom sprawdzenie end-to-end na żywo zamiast
    ufać testom jednostkowym:

    1. Zweryfikuj wdrożoną wersję Gateway i commit na hoście docelowym.
    2. Otwórz tymczasową sesję mostka ACPX do agenta na żywo.
    3. Poproś tego agenta, aby wywołał `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` i zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywisty `childSessionKey` i brak błędu walidatora.
    5. Posprzątaj tymczasową sesję mostka.

    Pozostaw bramkę na `mode: "run"` i pomiń `streamTo: "parent"` —
    powiązany z wątkiem `mode: "session"` oraz ścieżki przekazywania strumienia to oddzielne,
    bogatsze przebiegi integracyjne.

  </Accordion>
</AccordionGroup>

## Zgodność z piaskownicą

Sesje ACP obecnie działają w środowisku wykonawczym hosta, **nie** wewnątrz
piaskownicy OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzny harness może odczytywać/zapisywać zgodnie z własnymi uprawnieniami CLI i wybranym `cwd`.
- Polityka sandboxa OpenClaw **nie** obejmuje wykonywania harnessu ACP.
- OpenClaw nadal egzekwuje bramki funkcji ACP, dozwolonych agentów, własność sesji, powiązania kanałów i zasady dostarczania Gateway.
- Użyj `runtime: "subagent"` do natywnej pracy OpenClaw z wymuszonym sandboxem.

</Warning>

Obecne ograniczenia:

- Jeśli sesja żądającego jest objęta sandboxem, uruchamianie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozpoznawanie celu sesji

Większość akcji `/acp` akceptuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozpoznawania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - próbuje klucza
   - następnie identyfikatora sesji w kształcie UUID
   - następnie etykiety
2. Powiązanie bieżącego wątku (jeśli ta konwersacja/wątek jest powiązana z sesją ACP).
3. Rezerwowa bieżąca sesja żądającego.

Powiązania bieżącej konwersacji i powiązania wątku uczestniczą w
kroku 2.

Jeśli nie uda się rozpoznać żadnego celu, OpenClaw zwraca jasny błąd
(`Unable to resolve session target: ...`).

## Polecenia ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje wykonywaną turę dla sesji docelowej.              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązanie celów wątku.              | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje uruchomieniowe, możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb uruchomieniowy dla sesji docelowej.          | `/acp set-mode plan`                                          |
| `/acp set`           | Zapisuje ogólną opcję konfiguracji uruchomieniowej.       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego uruchomienia.       | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu uruchomienia (w sekundach).           | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu uruchomieniowego.               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji uruchomieniowych sesji.            | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                  | `/acp sessions`                                               |
| `/acp doctor`        | Stan backendu, możliwości, możliwe do wykonania poprawki. | `/acp doctor`                                                 |
| `/acp install`       | Wypisuje deterministyczne kroki instalacji i włączania.   | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje uruchomieniowe oraz identyfikatory sesji
na poziomie środowiska uruchomieniowego i backendu. Błędy nieobsługiwanych
kontrolek są wyraźnie pokazywane, gdy backend nie ma danej możliwości.
`/acp sessions` odczytuje magazyn dla bieżącej powiązanej sesji lub sesji
żądającego; tokeny celu (`session-key`, `session-id` lub `session-label`)
są rozpoznawane przez wykrywanie sesji gateway, w tym niestandardowe katalogi
główne `session.store` dla poszczególnych agentów.

### Mapowanie opcji uruchomieniowych

`/acp` ma wygodne polecenia i ogólny setter. Równoważne
operacje:

| Polecenie                    | Mapuje się na                       | Uwagi                                                                                                                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | klucz konfiguracji uruchomieniowej `model` | Dla Codex ACP OpenClaw normalizuje `openai-codex/<model>` do identyfikatora modelu adaptera i mapuje sufiksy rozumowania z ukośnikiem, takie jak `openai-codex/gpt-5.4/high`, na `reasoning_effort`. |
| `/acp set thinking <level>`  | klucz konfiguracji uruchomieniowej `thinking` | Dla Codex ACP OpenClaw wysyła odpowiadające `reasoning_effort`, gdy adapter je obsługuje.                                                                                      |
| `/acp permissions <profile>` | klucz konfiguracji uruchomieniowej `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | klucz konfiguracji uruchomieniowej `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | nadpisanie cwd uruchomienia          | Bezpośrednia aktualizacja.                                                                                                                                                     |
| `/acp set <key> <value>`     | ogólne                              | `key=cwd` używa ścieżki nadpisania cwd.                                                                                                                                       |
| `/acp reset-options`         | czyści wszystkie nadpisania uruchomieniowe | —                                                                                                                                                                              |

## Harness acpx, konfiguracja Plugin i uprawnienia

Konfigurację harnessu acpx (aliasy Claude Code / Codex / Gemini CLI),
mostki MCP plugin-tools i OpenClaw-tools oraz tryby uprawnień ACP opisano w
[agenci ACP — konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                      | Prawdopodobna przyczyna                                                                                                | Naprawa                                                                                                                                                                             |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                    | Brak Plugin zaplecza, jest wyłączony albo zablokowany przez `plugins.allow`.                                           | Zainstaluj i włącz Plugin zaplecza, uwzględnij `acpx` w `plugins.allow`, gdy ta lista dozwolonych jest ustawiona, a następnie uruchom `/acp doctor`.                                |
| `ACP is disabled by policy (acp.enabled=false)`                            | ACP jest globalnie wyłączone.                                                                                          | Ustaw `acp.enabled=true`.                                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`          | Automatyczne wysyłanie ze zwykłych wiadomości w wątku jest wyłączone.                                                  | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne trasowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają.                                  |
| `ACP agent "<id>" is not allowed by policy`                                | Agent nie znajduje się na liście dozwolonych.                                                                          | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` zgłasza, że zaplecze nie jest gotowe zaraz po uruchomieniu   | Sonda zależności Plugin lub samonaprawa nadal działa.                                                                  | Poczekaj krótko i uruchom ponownie `/acp doctor`; jeśli stan nadal jest nieprawidłowy, sprawdź błąd instalacji zaplecza oraz politykę zezwalania/odmowy dla Plugin.                 |
| Nie znaleziono polecenia harness                                           | CLI adaptera nie jest zainstalowane, brakuje przygotowanych zależności Plugin albo pierwsze pobranie `npx` nie powiodło się dla adaptera innego niż Codex. | Uruchom `/acp doctor`, napraw zależności Plugin, zainstaluj lub wstępnie przygotuj adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx.                          |
| Błąd nieznalezionego modelu z harness                                      | Identyfikator modelu jest poprawny dla innego dostawcy/harness, ale nie dla tego celu ACP.                             | Użyj modelu wymienionego przez ten harness, skonfiguruj model w harness albo pomiń nadpisanie.                                                                                      |
| Błąd uwierzytelniania dostawcy z harness                                   | OpenClaw działa poprawnie, ale docelowe CLI/dostawca nie jest zalogowany.                                              | Zaloguj się albo podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                                          |
| `Unable to resolve session target: ...`                                    | Nieprawidłowy token klucza/id/etykiety.                                                                                | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i ponów próbę.                                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej rozmowy, którą można powiązać.                                                        | Przejdź do docelowego czatu/kanału i ponów próbę albo użyj uruchomienia bez powiązania.                                                                                             |
| `Conversation bindings are unavailable for <channel>.`                     | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową.                                                            | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj nadrzędne `bindings[]` albo przejdź do obsługiwanego kanału.                                                 |
| `--thread here requires running /acp spawn inside an active ... thread`    | Użyto `--thread here` poza kontekstem wątku.                                                                           | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`              | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                                           | Ponownie powiąż jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                                  |
| `Thread bindings are unavailable for <channel>.`                           | Adapter nie ma możliwości powiązywania wątków.                                                                         | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                                  |
| `Sandboxed sessions cannot spawn ACP sessions ...`                         | Środowisko uruchomieniowe ACP działa po stronie hosta; sesja żądająca działa w piaskownicy.                            | Użyj `runtime="subagent"` z sesji w piaskownicy albo uruchom ACP spawn z sesji poza piaskownicą.                                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`    | Zażądano `sandbox="require"` dla środowiska uruchomieniowego ACP.                                                      | Użyj `runtime="subagent"` dla wymaganego działania w piaskownicy albo użyj ACP z `sandbox="inherit"` z sesji poza piaskownicą.                                                       |
| `Cannot apply --model ... did not advertise model support`                 | Docelowy harness nie udostępnia ogólnego przełączania modeli ACP.                                                      | Użyj harness, który deklaruje ACP `models`/`session/set_model`, użyj odwołań do modeli ACP Codex albo skonfiguruj model bezpośrednio w harness, jeśli ma własną flagę startową.      |
| Brak metadanych ACP dla powiązanej sesji                                   | Nieaktualne lub usunięte metadane sesji ACP.                                                                           | Utwórz ponownie za pomocą `/acp spawn`, a następnie ponownie powiąż/ustaw fokus wątku.                                                                                               |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`   | `permissionMode` blokuje zapisy/wykonanie w nieinteraktywnej sesji ACP.                                                | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i zrestartuj Gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration).        |
| Sesja ACP kończy się wcześnie z niewielką ilością danych wyjściowych       | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`.                                  | Sprawdź logi Gateway pod kątem `AcpRuntimeError`. Aby uzyskać pełne uprawnienia, ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bez końca po ukończeniu pracy                       | Proces harness zakończył działanie, ale sesja ACP nie zgłosiła ukończenia.                                             | Monitoruj za pomocą `ps aux \| grep acpx`; ręcznie zakończ nieaktualne procesy.                                                                                                     |
| Harness widzi `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                      | Wewnętrzna koperta zdarzenia wyciekła przez granicę ACP.                                                               | Zaktualizuj OpenClaw i ponownie uruchom przepływ ukończenia; zewnętrzne harness powinny otrzymywać wyłącznie zwykłe prompty ukończenia.                                             |

## Powiązane

- [Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie do agenta](/pl/tools/agent-send)
- [Zaplecza CLI](/pl/gateway/cli-backends)
- [Harness Codex](/pl/plugins/codex-harness)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Podagenci](/pl/tools/subagents)
