---
read_when:
    - Uruchamianie harnessów kodowania przez ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją w kanałach komunikatorów
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, podłączeniem Pluginu lub dostarczaniem uzupełnień
    - Obsługa poleceń /acp z czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne środowiska kodowania (Claude Code, Cursor, Gemini CLI, jawne Codex ACP, OpenClaw ACP, OpenCode) przez backend ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-06-30T14:32:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Sesje Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
pozwalają OpenClaw uruchamiać zewnętrzne harnessy programistyczne (na przykład Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI oraz inne
obsługiwane harnessy ACPX) przez backendowy plugin ACP.

Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

<Note>
**ACP to ścieżka zewnętrznych harnessów, a nie domyślna ścieżka Codex.** Natywny
plugin serwera aplikacji Codex odpowiada za kontrolki `/codex ...` oraz domyślne
wbudowane środowisko uruchomieniowe `openai/gpt-*` dla tur agentów; ACP odpowiada za
kontrolki `/acp ...` oraz sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code łączył się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                         | Użyj                                  | Uwagi                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać lub kontrolować Codex w bieżącej konwersacji                                           | `/codex bind`, `/codex threads`       | Natywna ścieżka serwera aplikacji Codex, gdy plugin `codex` jest włączony; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/szybki tryb/uprawnienia, zatrzymanie i sterowanie. ACP jest jawną ścieżką awaryjną |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP lub inny zewnętrzny harness _przez_ OpenClaw | Ta strona                             | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska uruchomieniowego                                                            |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta                     | [`openclaw acp`](/pl/cli/acp)            | Tryb mostu. IDE/klient komunikuje się z OpenClaw przez ACP po stdio/WebSocket                                                                                                                  |
| Ponownie użyć lokalnego AI CLI jako tekstowego modelu awaryjnego                                | [Backendy CLI](/pl/gateway/cli-backends) | To nie jest ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak środowiska uruchomieniowego harnessu                                                                                        |

## Czy to działa od razu?

Tak, po zainstalowaniu oficjalnego pluginu środowiska uruchomieniowego ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouty źródłowe mogą używać lokalnego pluginu workspace `extensions/acpx` po
`pnpm install`. Uruchom `/acp doctor`, aby sprawdzić gotowość.

OpenClaw informuje agentów o uruchamianiu ACP tylko wtedy, gdy ACP jest **naprawdę
używalne**: ACP musi być włączone, dispatch nie może być wyłączony, bieżąca
sesja nie może być zablokowana przez sandbox, a backend środowiska uruchomieniowego musi być
załadowany. Jeśli te warunki nie są spełnione, Skills pluginu ACP i wskazówki
`sessions_spawn` dla ACP pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Pułapki przy pierwszym uruchomieniu">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny wykaz pluginów i **musi** zawierać `acpx`; w przeciwnym razie zainstalowany backend ACP jest celowo blokowany, a `/acp doctor` zgłasza brakujący wpis na liście dozwolonych.
    - Adapter Codex ACP jest przygotowywany wraz z pluginem `acpx` i uruchamiany lokalnie, gdy to możliwe.
    - Codex ACP działa z izolowanym `CODEX_HOME`; OpenClaw kopiuje z konfiguracji Codex hosta zaufane wpisy projektów oraz bezpieczną konfigurację routingu modeli/dostawców, natomiast auth, powiadomienia i hooki pozostają w konfiguracji hosta.
    - Inne adaptery docelowych harnessów nadal mogą być pobierane na żądanie przez `npx` przy pierwszym użyciu.
    - Auth dostawcy nadal musi istnieć na hoście dla tego harnessu.
    - Jeśli host nie ma npm ani dostępu do sieci, pobieranie adaptera przy pierwszym uruchomieniu kończy się niepowodzeniem, dopóki cache nie zostaną wstępnie rozgrzane albo adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska uruchomieniowego">
    ACP uruchamia prawdziwy zewnętrzny proces harnessu. OpenClaw odpowiada za routing,
    stan zadań w tle, dostarczanie, powiązania i politykę; harness
    odpowiada za logowanie do dostawcy, katalog modeli, zachowanie systemu plików i
    narzędzia natywne.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony, sprawny backend.
    - Identyfikator celu jest dozwolony przez `acp.allowedAgents`, gdy ta lista dozwolonych jest ustawiona.
    - Polecenie harnessu może uruchomić się na hoście Gateway.
    - Auth dostawcy jest obecne dla tego harnessu (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego harnessu - identyfikatory modeli nie są przenośne między harnessami.
    - Żądane `cwd` istnieje i jest dostępne albo pomiń `cwd` i pozwól backendowi użyć wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów o uprawnienia, więc uruchomienia programistyczne intensywnie używające zapisu/wykonywania zwykle wymagają profilu uprawnień ACPX, który może działać bez nadzoru.

  </Accordion>
</AccordionGroup>

Narzędzia pluginów OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie
udostępniane harnessom ACP. Włącz jawne mosty MCP w
[Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup) tylko wtedy, gdy harness
powinien wywoływać te narzędzia bezpośrednio.

## Obsługiwane cele harnessów

Z backendem `acpx` używaj tych identyfikatorów harnessów jako celów `/acp spawn <id>`
lub `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator harnessu | Typowy backend                                 | Uwagi                                                                               |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`               | Adapter Claude Code ACP                        | Wymaga auth Claude Code na hoście.                                                  |
| `codex`                | Adapter Codex ACP                              | Jawna ścieżka awaryjna ACP tylko wtedy, gdy natywne `/codex` jest niedostępne albo zażądano ACP. |
| `copilot`              | Adapter GitHub Copilot ACP                     | Wymaga auth Copilot CLI/środowiska uruchomieniowego.                                |
| `cursor`               | Cursor CLI ACP (`cursor-agent acp`)            | Nadpisz polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP. |
| `droid`                | Factory Droid CLI                              | Wymaga auth Factory/Droid albo `FACTORY_API_KEY` w środowisku harnessu.             |
| `gemini`               | Adapter Gemini CLI ACP                         | Wymaga auth Gemini CLI albo konfiguracji klucza API.                                |
| `iflow`                | iFlow CLI                                      | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `kilocode`             | Kilo Code CLI                                  | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `kimi`                 | Kimi/Moonshot CLI                              | Wymaga auth Kimi/Moonshot na hoście.                                                |
| `kiro`                 | Kiro CLI                                       | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.                |
| `opencode`             | Adapter OpenCode ACP                           | Wymaga auth OpenCode CLI/dostawcy.                                                  |
| `openclaw`             | Most OpenClaw Gateway przez `openclaw acp`     | Pozwala harnessowi obsługującemu ACP komunikować się z powrotem z sesją OpenClaw Gateway. |
| `qwen`                 | Qwen Code / Qwen CLI                           | Wymaga auth zgodnego z Qwen na hoście.                                               |

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
    Kontynuuj w powiązanej konwersacji lub wątku (albo wskaż klucz
    sesji jawnie).
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
    - Uruchomienie tworzy lub wznawia sesję środowiska uruchomieniowego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy uruchomienie należy do rodzica.
    - Sesje ACP należące do rodzica są traktowane jako praca w tle, nawet gdy sesja środowiska uruchomieniowego jest trwała; ukończenie i dostarczanie między powierzchniami przechodzą przez notifier zadania rodzica zamiast działać jak normalna sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka końcowe lub osierocone jednorazowe sesje ACP należące do rodzica. Trwałe sesje ACP są zachowywane, dopóki istnieje aktywne powiązanie konwersacji; nieaktualne trwałe sesje bez aktywnego powiązania są zamykane, aby nie mogły zostać po cichu wznowione po zakończeniu zadania właściciela albo usunięciu jego rekordu zadania.
    - Powiązane wiadomości uzupełniające trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, odfokusowane, zresetowane albo nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako normalny tekst promptu do powiązanego harnessu ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Harness nadal może zachować własną historię upstream, jeśli obsługuje wznawianie.
    - Plugin acpx czyści drzewa procesów wrapperów i adapterów należące do OpenClaw po `close` oraz zbiera nieaktualne osierocone procesy ACPX należące do OpenClaw podczas uruchamiania Gateway.
    - Bezczynni workerzy środowiska uruchomieniowego kwalifikują się do czyszczenia po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Reguły natywnego routingu Codex">
    Wyzwalacze w języku naturalnym, które powinny kierować do **natywnego pluginu Codex**,
    gdy jest włączony:

    - „Powiąż ten kanał Discord z Codex.”
    - „Dołącz ten czat do wątku Codex `<id>`.”
    - „Pokaż wątki Codex, a potem powiąż ten.”

    Natywne powiązanie konwersacji Codex jest domyślną ścieżką sterowania czatem.
    Dynamiczne narzędzia OpenClaw nadal wykonują się przez OpenClaw, natomiast
    narzędzia natywne dla Codex, takie jak shell/apply-patch, wykonują się wewnątrz Codex.
    Dla zdarzeń narzędzi natywnych dla Codex OpenClaw wstrzykuje natywny
    przekaźnik hooków dla każdej tury, aby hooki pluginów mogły blokować `before_tool_call`, obserwować
    `after_tool_call` oraz kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie pluginy mogą poprosić o jeszcze jedno
    przejście modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów narzędzi natywnych dla Codex
    ani nie przepisuje rekordów wątków Codex. Używaj jawnego ACP tylko wtedy,
    gdy chcesz model środowiska uruchomieniowego/sesji ACP. Granica wbudowanego
    wsparcia Codex jest udokumentowana w
    [kontrakcie wsparcia Codex harness v1](/pl/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Ściąga wyboru modelu / dostawcy / środowiska uruchomieniowego">
    - starsze referencje modeli Codex - starsza trasa modelu OAuth/subskrypcji Codex naprawiana przez doctor.
    - `openai/*` - natywne wbudowane środowisko uruchomieniowe app-server Codex dla tur agentów OpenAI.
    - `/codex ...` - natywne sterowanie konwersacją Codex.
    - `/acp ...` lub `runtime: "acp"` - jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze języka naturalnego dla routingu ACP">
    Wyzwalacze, które powinny kierować do środowiska uruchomieniowego ACP:

    - "Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik."
    - "Użyj Gemini CLI do tego zadania w wątku, a następnie utrzymuj dalsze odpowiedzi w tym samym wątku."
    - "Uruchom Codex przez ACP w wątku w tle."

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje `agentId` harnessa,
    wiąże z bieżącą konwersacją lub wątkiem, gdy jest to obsługiwane, i
    kieruje dalsze odpowiedzi do tej sesji aż do zamknięcia/wygaśnięcia. Codex
    używa tej ścieżki tylko wtedy, gdy ACP/acpx jest jawne albo natywny
    plugin Codex jest niedostępny dla żądanej operacji.

    Dla `sessions_spawn`, `runtime: "acp"` jest ogłaszane tylko wtedy, gdy ACP
    jest włączone, żądający nie działa w piaskownicy, a backend środowiska uruchomieniowego
    ACP jest załadowany. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    wysyłanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych
    wywołań `sessions_spawn({ runtime: "acp" })`. Celuje w identyfikatory harnessów ACP, takie jak `codex`,
    `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
    identyfikatora agenta konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
    jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
    w przeciwnym razie użyj domyślnego środowiska uruchomieniowego podagenta. Gdy agent OpenClaw
    jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
    `runtime.acp.agent` jako bazowego identyfikatora harnessa.

  </Accordion>
</AccordionGroup>

## ACP kontra podagenci

Używaj ACP, gdy chcesz zewnętrznego środowiska uruchomieniowego harnessa. Używaj **natywnego
app-server Codex** do powiązania/sterowania konwersacją Codex, gdy plugin `codex`
jest włączony. Używaj **podagentów**, gdy chcesz natywnych dla OpenClaw
delegowanych uruchomień.

| Obszar          | Sesja ACP                           | Uruchomienie podagenta                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko uruchomieniowe       | Plugin backendu ACP (na przykład acpx) | Natywne środowisko uruchomieniowe podagentów OpenClaw  |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania    | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko uruchomieniowe) |

Zobacz też [Podagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda tak:

1. Płaszczyzna sterowania sesją ACP OpenClaw.
2. Oficjalny plugin środowiska uruchomieniowego `@openclaw/acpx`.
3. Adapter Claude ACP.
4. Mechanizmy środowiska uruchomieniowego/sesji po stronie Claude.

ACP Claude jest **sesją harnessa** z kontrolkami ACP, wznawianiem sesji,
śledzeniem zadań w tle oraz opcjonalnym powiązaniem konwersacji/wątku.

Backendy CLI są oddzielnymi tekstowymi lokalnymi awaryjnymi środowiskami uruchomieniowymi - zobacz
[Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada brzmi:

- **Chcesz `/acp spawn`, wiązalne sesje, kontrolki środowiska uruchomieniowego lub trwałą pracę harnessa?** Użyj ACP.
- **Chcesz prostego lokalnego tekstowego trybu awaryjnego przez surowe CLI?** Użyj backendów CLI.

## Powiązane sesje

### Model mentalny

- **Powierzchnia czatu** - miejsce, w którym ludzie kontynuują rozmowę (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** - trwały stan środowiska uruchomieniowego Codex/Claude/Gemini, do którego kieruje OpenClaw.
- **Wątek/temat potomny** - opcjonalna dodatkowa powierzchnia komunikacji tworzona tylko przez `--thread ...`.
- **Przestrzeń robocza środowiska uruchomieniowego** - lokalizacja systemu plików (`cwd`, checkout repozytorium, przestrzeń robocza backendu), w której działa harness. Niezależna od powierzchni czatu.

### Powiązania bieżącej konwersacji

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do
uruchomionej sesji ACP - bez wątku potomnego, ta sama powierzchnia czatu. OpenClaw nadal
zarządza transportem, uwierzytelnianiem, bezpieczeństwem i dostarczaniem. Dalsze wiadomości w tej
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
    - W Discord `spawnSessions` bramkuje tworzenie wątków potomnych dla `--thread auto|here` - nie dla `--bind here`.
    - Jeśli uruchamiasz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy przestrzeń roboczą **agenta docelowego**. Brakujące dziedziczone ścieżki (`ENOENT`/`ENOTDIR`) wracają do domyślnego backendu; inne błędy dostępu (np. `EACCES`) pojawiają się jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w powiązanych konwersacjach - polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst dalszych odpowiedzi trafia do powiązanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje powiązane z wątkiem">
    Gdy powiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Dalsze wiadomości w tym wątku trafiają do powiązanej sesji ACP.
    - Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
    - Cofnięcie fokusu/zamknięcie/archiwizacja/limit bezczynności lub wygaśnięcie maksymalnego wieku usuwa powiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` to polecenia Gateway, a nie prompty do harnessa ACP.

    Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne wysyłanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Uruchamianie sesji wątków adaptera kanału włączone (domyślnie: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Obsługa powiązań wątków jest specyficzna dla adaptera. Jeśli aktywny
    adapter kanału nie obsługuje powiązań wątków, OpenClaw zwraca jasny
    komunikat o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału, który udostępnia możliwość powiązania sesji/wątku.
    - Bieżąca wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forów w grupach/supergrupach i tematy DM).
    - Kanały pluginów mogą dodać obsługę przez ten sam interfejs powiązań.

  </Accordion>
</AccordionGroup>

## Trwałe powiązania kanałów

Dla nieulotnych przepływów pracy skonfiguruj trwałe powiązania ACP w
wpisach najwyższego poziomu `bindings[]`.

### Model powiązań

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe powiązanie konwersacji ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje konwersację docelową. Kształty dla poszczególnych kanałów:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kanał/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Preferuj stabilne identyfikatory Slack; powiązania kanałów dopasowują również odpowiedzi wewnątrz wątków tego kanału.
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Używaj numerów E.164, takich jak `+15555550123`, dla czatów bezpośrednich oraz JID grup WhatsApp, takich jak `120363424282127706@g.us`, dla grup.
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
  Opcjonalny katalog roboczy środowiska uruchomieniowego.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Opcjonalne nadpisanie backendu.
</ParamField>

### Domyślne ustawienia środowiska uruchomieniowego dla każdego agenta

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

- OpenClaw zapewnia, że skonfigurowana sesja ACP istnieje po dopuszczeniu specyficznym dla kanału i przed użyciem.
- Wiadomości w tym kanale, temacie lub czacie są kierowane do skonfigurowanej sesji ACP.
- Skonfigurowane powiązania ACP są właścicielami swojej trasy sesji. Rozsyłanie kanałowe typu fan-out nie zastępuje skonfigurowanej sesji ACP dla dopasowanego powiązania.
- W powiązanych konwersacjach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe powiązania środowiska uruchomieniowego (na przykład tworzone przez przepływy skupienia wątku) nadal obowiązują tam, gdzie występują.
- W przypadku międzyagentowych uruchomień ACP bez jawnego `cwd` OpenClaw dziedziczy przestrzeń roboczą agenta docelowego z konfiguracji agenta.
- Brakujące dziedziczone ścieżki przestrzeni roboczej wracają do domyślnego cwd backendu; niebrakujące błędy dostępu są zgłaszane jako błędy uruchomienia.

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
    `runtime` domyślnie ma wartość `subagent`, więc dla sesji ACP ustaw
    jawnie `runtime: "acp"`. Jeśli `agentId` zostanie pominięte, OpenClaw użyje
    `acp.defaultAgent`, gdy jest skonfigurowane. `mode: "session"` wymaga
    `thread: true`, aby utrzymać trwałą powiązaną konwersację.
    </Note>

  </Tab>
  <Tab title="From /acp command">
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

    Zobacz [polecenia ukośnikowe](/pl/tools/slash-commands).

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
  Żąda przepływu powiązania wątku tam, gdzie jest obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` jest jednorazowe; `"session"` jest trwałe. Jeśli `thread: true` i
  `mode` zostanie pominięte, OpenClaw może domyślnie użyć trwałego zachowania zależnie od
  ścieżki środowiska uruchomieniowego. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy środowiska uruchomieniowego (walidowany przez politykę backendu/środowiska
  uruchomieniowego). Jeśli zostanie pominięty, uruchomienie ACP dziedziczy przestrzeń roboczą agenta docelowego,
  gdy jest skonfigurowana; brakujące dziedziczone ścieżki wracają do domyślnych wartości backendu,
  natomiast rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora, używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza historię
  konwersacji przez `session/load`. Wymaga `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` przesyła strumieniowo początkowe podsumowania postępu uruchomienia ACP z powrotem do
  sesji żądającej jako zdarzenia systemowe. Akceptowane odpowiedzi obejmują
  `streamLogPath` wskazujące na log JSONL o zakresie sesji
  (`<sessionId>.acp-stream.jsonl`), który można śledzić, aby uzyskać pełną historię przekazywania.
  Strumienie postępu rodzica domyślnie pokazują komentarze asystenta i postęp statusu ACP,
  chyba że `streaming.progress.commentary=false`. Discord również domyślnie ustawia
  podglądy rodzica w trybie postępu, gdy nie skonfigurowano trybu strumienia. Postęp
  statusu nadal respektuje `acp.stream.tagVisibility`, więc tagi takie jak `plan`
  pozostają ukryte, chyba że zostaną jawnie włączone.
</ParamField>

Uruchomienia ACP `sessions_spawn` używają `agents.defaults.subagents.runTimeoutSeconds` jako
domyślnego limitu tury dziecka. Narzędzie nie akceptuje nadpisań limitu czasu dla pojedynczego wywołania.

<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla sesji podrzędnej ACP. Uruchomienia Codex ACP
  normalizują referencje OpenAI, takie jak `openai/gpt-5.4`, do konfiguracji startowej Codex ACP
  przed `session/new`; formy ukośnikowe, takie jak `openai/gpt-5.4/high`,
  ustawiają również wysiłek rozumowania Codex ACP.
  Gdy zostanie pominięte, `sessions_spawn({ runtime: "acp" })` używa istniejących
  domyślnych modeli subagentów (`agents.defaults.subagents.model` lub
  `agents.list[].subagents.model`), gdy są skonfigurowane; w przeciwnym razie pozwala
  harnessowi ACP użyć własnego modelu domyślnego.
  Inne harnessy muszą ogłaszać `models` ACP i obsługiwać
  `session/set_model`; w przeciwnym razie OpenClaw/acpx zgłasza jasny błąd zamiast
  po cichu wracać do domyślnego agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny wysiłek myślenia/rozumowania. Dla Codex ACP `minimal` mapuje się na
  niski wysiłek, `low`/`medium`/`high`/`xhigh` mapują się bezpośrednio, a `off`
  pomija startowe nadpisanie wysiłku rozumowania.
  Gdy zostanie pominięte, uruchomienia ACP używają istniejących domyślnych wartości myślenia subagentów oraz
  per-model `agents.defaults.models["provider/model"].params.thinking`
  dla wybranego modelu.
</ParamField>

## Tryby powiązania uruchomienia i wątku

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                            |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Powiąż bieżącą aktywną konwersację w miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz powiązania bieżącej konwersacji.                            |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „uczyń ten kanał lub czat wspieranym przez Codex”.
    - `--bind here` nie tworzy wątku podrzędnego.
    - `--bind here` jest dostępne tylko w kanałach, które udostępniają obsługę powiązania bieżącej konwersacji.
    - `--bind` i `--thread` nie mogą być łączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                         |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek podrzędny, gdy jest obsługiwany. |
    | `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli użytkownik nie jest w wątku.              |
    | `off`  | Brak powiązania. Sesja uruchamia się bez powiązania.                                               |

    Uwagi:

    - Na powierzchniach powiązań bez wątków domyślne zachowanie jest faktycznie `off`.
    - Uruchomienie powiązane z wątkiem wymaga obsługi polityki kanału:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Użyj `--bind here`, gdy chcesz przypiąć bieżącą konwersację bez tworzenia wątku podrzędnego.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą być interaktywnymi przestrzeniami roboczymi albo pracą w tle
należącą do rodzica. Ścieżka dostarczania zależy od tej postaci.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sesje interaktywne są przeznaczone do kontynuowania rozmowy na widocznej powierzchni
    czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą konwersację z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwałe skonfigurowane `bindings[].type="acp"` kierują dopasowane konwersacje do tej samej sesji ACP.

    Kolejne wiadomości w powiązanej konwersacji są kierowane bezpośrednio do
    sesji ACP, a wyjście ACP jest dostarczane z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do harnessu:

    - Zwykłe powiązane kontynuacje są wysyłane jako tekst promptu, plus załączniki tylko wtedy, gdy harness/backend je obsługuje.
    - Polecenia zarządzające `/acp` i lokalne polecenia Gateway są przechwytywane przed wysłaniem do ACP.
    - Zdarzenia ukończenia wygenerowane przez środowisko uruchomieniowe są materializowane dla każdego celu. Agenci OpenClaw otrzymują wewnętrzną kopertę kontekstu środowiska uruchomieniowego OpenClaw; zewnętrzne harnessy ACP otrzymują zwykły prompt z wynikiem dziecka i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych harnessów ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają tekstu wyzwalacza widocznego dla użytkownika albo zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają ustrukturyzowane w OpenClaw tam, gdzie to możliwe, i nie są traktowane jako treść czatu autorstwa użytkownika.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Jednorazowe sesje ACP uruchomione przez inne uruchomienie agenta są dziećmi działającymi
    w tle, podobnie jak subagenci:

    - Rodzic prosi o pracę przez `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Dziecko działa we własnej sesji harnessu ACP.
    - Tury dziecka działają na tej samej ścieżce tła, której używają natywne uruchomienia subagentów, więc powolny harness ACP nie blokuje niepowiązanej pracy głównej sesji.
    - Raporty ukończenia wracają przez ścieżkę ogłaszania ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia na zwykły prompt ACP przed wysłaniem go do zewnętrznego harnessu, więc harnessy nie widzą znaczników kontekstu środowiska uruchomieniowego właściwych tylko dla OpenClaw.
    - Rodzic przepisuje wynik dziecka normalnym głosem asystenta, gdy przydatna jest odpowiedź widoczna dla użytkownika.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między rodzicem
    a dzieckiem. Dziecko ma już kanał ukończenia z powrotem do
    rodzica.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` może kierować do innej sesji po uruchomieniu. Dla zwykłych
    sesji równorzędnych OpenClaw używa ścieżki kontynuacji agent-do-agenta (A2A)
    po wstrzyknięciu wiadomości:

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól żądającemu i celowi wymienić ograniczoną liczbę tur kontynuacji.
    - Poproś cel o utworzenie wiadomości ogłoszenia.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest mechanizmem awaryjnym dla wysyłek równorzędnych, w których nadawca potrzebuje
    widocznej kontynuacji. Pozostaje włączona, gdy niepowiązana sesja może
    zobaczyć cel ACP i wysłać do niego wiadomość, na przykład przy szerokich
    ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija dalszą obsługę A2A tylko wtedy, gdy żądający jest
    rodzicem własnego, należącego do rodzica, jednorazowego dziecka ACP. W takim przypadku
    uruchomienie A2A na zakończeniu zadania może wybudzić rodzica z wynikiem
    dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i
    utworzyć pętlę echa rodzic/dziecko. Wynik `sessions_send` zgłasza
    `delivery.status="skipped"` dla tego przypadku należącego dziecka, ponieważ
    ścieżka zakończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Resume an existing session">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    zaczynać od nowa. Agent odtwarza historię konwersacji przez
    `session/load`, więc wznawia pracę z pełnym kontekstem tego, co było wcześniej.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe przypadki użycia:

    - Przekaż sesję Codex z laptopa na telefon - powiedz agentowi, aby kontynuował od miejsca, w którym skończono.
    - Kontynuuj sesję programowania rozpoczętą interaktywnie w CLI, teraz bezobsługowo przez swojego agenta.
    - Wznów pracę przerwaną przez restart Gateway lub limit bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko, gdy `runtime: "acp"`; domyślne środowisko uruchomieniowe podagenta ignoruje to pole wyłącznie dla ACP.
    - `streamTo` ma zastosowanie tylko, gdy `runtime: "acp"`; domyślne środowisko uruchomieniowe podagenta ignoruje to pole wyłącznie dla ACP.
    - `resumeSessionId` to lokalny dla hosta identyfikator wznowienia ACP/harness, a nie klucz sesji kanału OpenClaw; OpenClaw nadal sprawdza zasady uruchamiania ACP i zasady agenta docelowego przed wysłaniem, natomiast backend ACP lub harness odpowiada za autoryzację ładowania tego nadrzędnego identyfikatora.
    - `resumeSessionId` przywraca nadrzędną historię konwersacji ACP; `thread` i `mode` nadal normalnie stosują się do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code to obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się czytelnym błędem - bez cichego przejścia do nowej sesji.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Po wdrożeniu Gateway uruchom rzeczywiste sprawdzenie end-to-end zamiast
    polegać na testach jednostkowych:

    1. Zweryfikuj wdrożoną wersję Gateway i commit na hoście docelowym.
    2. Otwórz tymczasową sesję mostka ACPX do rzeczywistego agenta.
    3. Poproś tego agenta o wywołanie `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` oraz zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywisty `childSessionKey` i brak błędu walidatora.
    5. Wyczyść tymczasową sesję mostka.

    Pozostaw bramkę na `mode: "run"` i pomiń `streamTo: "parent"` -
    powiązany z wątkiem `mode: "session"` oraz ścieżki przekazywania strumienia to osobne,
    bogatsze przebiegi integracyjne.

  </Accordion>
</AccordionGroup>

## Zgodność z piaskownicą

Sesje ACP obecnie działają w środowisku uruchomieniowym hosta, **nie** wewnątrz
piaskownicy OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzny harness może odczytywać/zapisywać zgodnie z własnymi uprawnieniami CLI i wybranym `cwd`.
- Polityka piaskownicy OpenClaw **nie** obejmuje wykonywania harness ACP.
- OpenClaw nadal egzekwuje bramki funkcji ACP, dozwolonych agentów, własność sesji, powiązania kanałów i politykę dostarczania Gateway.
- Użyj `runtime: "subagent"` dla natywnej pracy OpenClaw egzekwowanej przez piaskownicę.

</Warning>

Obecne ograniczenia:

- Jeśli sesja żądająca działa w piaskownicy, uruchomienia ACP są blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozpoznawanie celu sesji

Większość akcji `/acp` akceptuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozpoznawania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - próbuje klucza
   - następnie identyfikatora sesji w kształcie UUID
   - następnie etykiety
2. Bieżące powiązanie wątku (jeśli ta konwersacja/wątek jest powiązany z sesją ACP).
3. Zapasowe użycie bieżącej sesji żądającego.

Powiązania bieżącej konwersacji i powiązania wątku uczestniczą w
kroku 2.

Jeśli nie uda się rozpoznać celu, OpenClaw zwraca czytelny błąd
(`Unable to resolve session target: ...`).

## Kontrolki ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje trwającą turę dla sesji docelowej.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązania celów wątku.              | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje środowiska uruchomieniowego i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb środowiska uruchomieniowego dla sesji docelowej. | `/acp set-mode plan`                                          |
| `/acp set`           | Zapisuje ogólną opcję konfiguracji środowiska uruchomieniowego. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego środowiska uruchomieniowego. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu środowiska uruchomieniowego (sekundy). | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu środowiska uruchomieniowego.    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska uruchomieniowego sesji. | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                  | `/acp sessions`                                               |
| `/acp doctor`        | Stan backendu, możliwości, wykonalne poprawki.            | `/acp doctor`                                                 |
| `/acp install`       | Drukuje deterministyczne kroki instalacji i włączania.    | `/acp install`                                                |

Kontrolki środowiska uruchomieniowego (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` i `reset-options`) wymagają
tożsamości właściciela z zewnętrznych kanałów oraz `operator.admin` od wewnętrznych klientów Gateway.
Autoryzowani nadawcy niebędący właścicielami nadal mogą używać `sessions`, `doctor`,
`install` i `help`.

`/acp status` pokazuje efektywne opcje środowiska uruchomieniowego oraz identyfikatory sesji
na poziomie środowiska uruchomieniowego i backendu. Błędy nieobsługiwanych kontrolek są zgłaszane
czytelnie, gdy backend nie ma danej możliwości. `/acp sessions` odczytuje
magazyn dla bieżącej powiązanej sesji lub sesji żądającego; tokeny celu
(`session-key`, `session-id` lub `session-label`) są rozpoznawane przez
odkrywanie sesji Gateway, w tym niestandardowe katalogi główne `session.store`
dla poszczególnych agentów.

### Mapowanie opcji środowiska uruchomieniowego

`/acp` ma wygodne polecenia i ogólny setter. Równoważne
operacje:

| Polecenie                    | Mapuje się na                        | Uwagi                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | klucz konfiguracji środowiska uruchomieniowego `model` | Dla ACP Codex OpenClaw normalizuje `openai/<model>` do identyfikatora modelu adaptera i mapuje sufiksy rozumowania po ukośniku, takie jak `openai/gpt-5.4/high`, na `reasoning_effort`.                    |
| `/acp set thinking <level>`  | opcję kanoniczną `thinking`          | OpenClaw wysyła równoważnik ogłoszony przez backend, gdy jest dostępny, preferując `thinking`, następnie `effort`, `reasoning_effort` lub `thought_level`. Dla ACP Codex adapter mapuje wartości na `reasoning_effort`. |
| `/acp permissions <profile>` | opcję kanoniczną `permissionProfile` | OpenClaw wysyła równoważnik ogłoszony przez backend, gdy jest dostępny, taki jak `approval_policy`, `permission_profile`, `permissions` lub `permission_mode`.                                           |
| `/acp timeout <seconds>`     | opcję kanoniczną `timeoutSeconds`    | OpenClaw wysyła równoważnik ogłoszony przez backend, gdy jest dostępny, taki jak `timeout` lub `timeout_seconds`.                                                                                          |
| `/acp cwd <path>`            | nadpisanie cwd środowiska uruchomieniowego | Bezpośrednia aktualizacja.                                                                                                                                                                                 |
| `/acp set <key> <value>`     | ogólne                               | `key=cwd` używa ścieżki nadpisania cwd.                                                                                                                                                                    |
| `/acp reset-options`         | czyści wszystkie nadpisania środowiska uruchomieniowego | -                                                                                                                                                                                                          |

## harness acpx, konfiguracja Plugin i uprawnienia

Informacje o konfiguracji harness acpx (aliasy Claude Code / Codex / Gemini CLI),
mostkach MCP plugin-tools i OpenClaw-tools oraz trybach uprawnień ACP
znajdziesz w
[agenci ACP - konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                                                                | Poprawka                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Brakujący Plugin zaplecza, wyłączony lub zablokowany przez `plugins.allow`.                                            | Zainstaluj i włącz Plugin zaplecza, uwzględnij `acpx` w `plugins.allow`, gdy ta lista dozwolonych jest ustawiona, a następnie uruchom `/acp doctor`.                     |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                                                          | Ustaw `acp.enabled=true`.                                                                                                                                               |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatyczne wysyłanie ze zwykłych wiadomości w wątku jest wyłączone.                                                  | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne kierowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają.                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na liście dozwolonych.                                                                          | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                         |
| `/acp doctor` zgłasza, że zaplecze nie jest gotowe tuż po starcie           | Plugin zaplecza jest brakujący, wyłączony, zablokowany przez politykę zezwoleń/odmów albo jego skonfigurowany plik wykonywalny jest niedostępny. | Zainstaluj/włącz Plugin zaplecza, uruchom ponownie `/acp doctor` i sprawdź błąd instalacji zaplecza lub polityki, jeśli nadal pozostaje w złym stanie.                   |
| Nie znaleziono polecenia mechanizmu uruchomieniowego                        | CLI adaptera nie jest zainstalowane, brakuje zewnętrznego Pluginu albo pierwsze pobranie `npx` nie powiodło się dla adaptera innego niż Codex. | Uruchom `/acp doctor`, zainstaluj/wstępnie przygotuj adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx.                                           |
| Mechanizm uruchomieniowy zgłasza brak modelu                                | Identyfikator modelu jest prawidłowy dla innego dostawcy/mechanizmu uruchomieniowego, ale nie dla tego celu ACP.       | Użyj modelu wymienionego przez ten mechanizm uruchomieniowy, skonfiguruj model w mechanizmie uruchomieniowym albo pomiń nadpisanie.                                     |
| Błąd uwierzytelniania dostawcy z mechanizmu uruchomieniowego                | OpenClaw działa poprawnie, ale docelowe CLI/dostawca nie jest zalogowany.                                              | Zaloguj się albo podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                              |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token klucza/identyfikatora/etykiety.                                                                    | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i spróbuj ponownie.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej rozmowy możliwej do powiązania.                                                       | Przejdź do docelowego czatu/kanału i spróbuj ponownie albo użyj uruchomienia bez powiązania.                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową.                                                           | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | Użyto `--thread here` poza kontekstem wątku.                                                                           | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                            |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                                           | Ponownie powiąż jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                      |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązania wątku.                                                                            | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Środowisko wykonawcze ACP działa po stronie hosta; sesja żądająca jest w piaskownicy.                                 | Użyj `runtime="subagent"` z sesji w piaskownicy albo uruchom ACP spawn z sesji poza piaskownicą.                                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla środowiska wykonawczego ACP.                                                          | Użyj `runtime="subagent"` dla wymaganego działania w piaskownicy albo użyj ACP z `sandbox="inherit"` z sesji poza piaskownicą.                                           |
| `Cannot apply --model ... did not advertise model support`                  | Docelowy mechanizm uruchomieniowy nie udostępnia ogólnego przełączania modeli ACP.                                    | Użyj mechanizmu uruchomieniowego, który deklaruje ACP `models`/`session/set_model`, użyj referencji modeli ACP Codex albo skonfiguruj model bezpośrednio w mechanizmie uruchomieniowym, jeśli ma własną flagę startową. |
| Brak metadanych ACP dla powiązanej sesji                                    | Nieaktualne/usunięte metadane sesji ACP.                                                                               | Utwórz ponownie za pomocą `/acp spawn`, a następnie ponownie powiąż/ustaw fokus na wątek.                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapisy/wykonanie w nieinteraktywnej sesji ACP.                                                | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i zrestartuj gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration). |
| Sesja ACP kończy się wcześnie z niewielką ilością danych wyjściowych        | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`.                                  | Sprawdź logi gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zatrzymuje się bez końca po zakończeniu pracy                     | Proces mechanizmu uruchomieniowego zakończył się, ale sesja ACP nie zgłosiła ukończenia.                              | Zaktualizuj OpenClaw; bieżące czyszczenie acpx usuwa nieaktualne procesy opakowujące i adaptera należące do OpenClaw przy zamknięciu oraz starcie Gateway.              |
| Mechanizm uruchomieniowy widzi `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`      | Wewnętrzna koperta zdarzenia wyciekła przez granicę ACP.                                                              | Zaktualizuj OpenClaw i uruchom ponownie przepływ ukończenia; zewnętrzne mechanizmy uruchomieniowe powinny otrzymywać wyłącznie zwykłe prompty ukończenia.               |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` należy do
natywnego przekaźnika hooków Codex, a nie do ACP/acpx. W powiązanym czacie Codex rozpocznij nową
sesję za pomocą `/new` albo `/reset`; jeśli zadziała raz, a potem wróci przy następnym
natywnym wywołaniu narzędzia, zrestartuj serwer aplikacji Codex albo OpenClaw Gateway zamiast
powtarzać `/new`. Zobacz [Rozwiązywanie problemów z mechanizmem uruchomieniowym Codex](/pl/plugins/codex-harness#troubleshooting).
</Note>

## Powiązane

- [Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie do agenta](/pl/tools/agent-send)
- [Zaplecza CLI](/pl/gateway/cli-backends)
- [Mechanizm uruchomieniowy Codex](/pl/plugins/codex-harness)
- [Środowisko wykonawcze mechanizmu uruchomieniowego Codex](/pl/plugins/codex-harness-runtime)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Subagenci](/pl/tools/subagents)
