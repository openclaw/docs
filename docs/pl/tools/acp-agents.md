---
read_when:
    - Uruchamianie środowisk kodowania przez ACP
    - Konfigurowanie sesji ACP powiązanych z rozmową w kanałach wiadomości
    - Powiązanie rozmowy w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, podłączeniem Pluginu lub dostarczaniem uzupełnień
    - Obsługa poleceń /acp z czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne harnessy kodowania (Claude Code, Cursor, Gemini CLI, jawny Codex ACP, OpenClaw ACP, OpenCode) przez backend ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-06-27T18:24:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
pozwalają OpenClaw uruchamiać zewnętrzne środowiska kodowania (na przykład Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI i inne
obsługiwane środowiska ACPX) przez backendowy plugin ACP.

Każde uruchomienie sesji ACP jest śledzone jako [zadanie w tle](/pl/automation/tasks).

<Note>
**ACP to ścieżka zewnętrznego środowiska, a nie domyślna ścieżka Codex.** Natywny
plugin serwera aplikacji Codex odpowiada za kontrolki `/codex ...` i domyślne
wbudowane środowisko wykonawcze `openai/gpt-*` dla tur agenta; ACP odpowiada za
kontrolki `/acp ...` i sesje `sessions_spawn({ runtime: "acp" })`.

Jeśli chcesz, aby Codex lub Claude Code łączyły się jako zewnętrzny klient MCP
bezpośrednio z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Której strony potrzebuję?

| Chcesz…                                                                                         | Użyj tego                            | Uwagi                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać lub kontrolować Codex w bieżącej konwersacji                                           | `/codex bind`, `/codex threads`       | Natywna ścieżka serwera aplikacji Codex, gdy plugin `codex` jest włączony; obejmuje powiązane odpowiedzi czatu, przekazywanie obrazów, model/tryb szybki/uprawnienia, zatrzymanie i kontrolki sterowania. ACP jest jawną opcją awaryjną |
| Uruchomić Claude Code, Gemini CLI, jawny Codex ACP albo inne zewnętrzne środowisko _przez_ OpenClaw | Ta strona                             | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, kontrolki środowiska wykonawczego                                                                 |
| Udostępnić sesję OpenClaw Gateway _jako_ serwer ACP dla edytora lub klienta                     | [`openclaw acp`](/pl/cli/acp)            | Tryb pomostowy. IDE/klient komunikuje się przez ACP z OpenClaw po stdio/WebSocket                                                                                                             |
| Użyć ponownie lokalnego AI CLI jako tekstowego modelu awaryjnego                                | [Backendy CLI](/pl/gateway/cli-backends) | To nie jest ACP. Brak narzędzi OpenClaw, brak kontrolek ACP, brak środowiska wykonawczego środowiska                                                                                         |

## Czy działa od razu po instalacji?

Tak, po zainstalowaniu oficjalnego pluginu środowiska wykonawczego ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkouty źródłowe mogą używać lokalnego pluginu workspace `extensions/acpx` po
`pnpm install`. Uruchom `/acp doctor`, aby sprawdzić gotowość.

OpenClaw informuje agentów o uruchamianiu ACP tylko wtedy, gdy ACP jest **naprawdę
używalne**: ACP musi być włączone, dispatch nie może być wyłączony, bieżąca
sesja nie może być zablokowana przez sandbox, a backend środowiska wykonawczego musi być
załadowany. Jeśli te warunki nie są spełnione, Skills pluginu ACP i wskazówki
ACP dla `sessions_spawn` pozostają ukryte, aby agent nie sugerował
niedostępnego backendu.

<AccordionGroup>
  <Accordion title="Pułapki pierwszego uruchomienia">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny spis pluginów i **musi** zawierać `acpx`; w przeciwnym razie zainstalowany backend ACP jest celowo blokowany, a `/acp doctor` zgłasza brakujący wpis listy dozwolonych.
    - Adapter Codex ACP jest dostarczany z pluginem `acpx` i uruchamiany lokalnie, gdy to możliwe.
    - Codex ACP działa z izolowanym `CODEX_HOME`; OpenClaw kopiuje zaufane wpisy projektów oraz bezpieczną konfigurację routingu modeli/dostawców z konfiguracji hosta Codex, natomiast uwierzytelnianie, powiadomienia i hooki pozostają w konfiguracji hosta.
    - Adaptery innych docelowych środowisk mogą nadal być pobierane na żądanie przez `npx` przy pierwszym użyciu.
    - Uwierzytelnianie dostawcy nadal musi istnieć na hoście dla tego środowiska.
    - Jeśli host nie ma npm ani dostępu do sieci, pobieranie adapterów przy pierwszym uruchomieniu kończy się niepowodzeniem, dopóki pamięci podręczne nie zostaną wstępnie przygotowane albo adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska wykonawczego">
    ACP uruchamia rzeczywisty proces zewnętrznego środowiska. OpenClaw odpowiada za routing,
    stan zadań w tle, dostarczanie, powiązania i zasady; środowisko
    odpowiada za logowanie do dostawcy, katalog modeli, zachowanie systemu plików i
    narzędzia natywne.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączony, sprawny backend.
    - Identyfikator docelowy jest dozwolony przez `acp.allowedAgents`, gdy ta lista dozwolonych jest ustawiona.
    - Polecenie środowiska może uruchomić się na hoście Gateway.
    - Uwierzytelnianie dostawcy jest obecne dla tego środowiska (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje dla tego środowiska - identyfikatory modeli nie są przenośne między środowiskami.
    - Żądany `cwd` istnieje i jest dostępny, albo pomiń `cwd` i pozwól backendowi użyć jego wartości domyślnej.
    - Tryb uprawnień pasuje do pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów o uprawnienia, więc przebiegi kodowania intensywnie używające zapisu/wykonania zwykle wymagają profilu uprawnień ACPX, który może działać bez nadzoru.

  </Accordion>
</AccordionGroup>

Narzędzia pluginów OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie
udostępniane środowiskom ACP. Włącz jawne mosty MCP w
[Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup) tylko wtedy, gdy środowisko
ma wywoływać te narzędzia bezpośrednio.

## Obsługiwane cele środowisk

Z backendem `acpx` używaj tych identyfikatorów środowisk jako celów `/acp spawn <id>`
lub `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator środowiska | Typowy backend                                 | Uwagi                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Wymaga uwierzytelniania Claude Code na hoście.                                      |
| `codex`    | Adapter Codex ACP                              | Jawna opcja awaryjna ACP tylko wtedy, gdy natywne `/codex` jest niedostępne albo zażądano ACP. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Wymaga uwierzytelniania Copilot CLI/środowiska wykonawczego.                       |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Nadpisz polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP. |
| `droid`    | Factory Droid CLI                              | Wymaga uwierzytelniania Factory/Droid albo `FACTORY_API_KEY` w środowisku środowiska. |
| `gemini`   | Adapter Gemini CLI ACP                         | Wymaga uwierzytelniania Gemini CLI albo konfiguracji klucza API.                   |
| `iflow`    | iFlow CLI                                      | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.               |
| `kilocode` | Kilo Code CLI                                  | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.               |
| `kimi`     | Kimi/Moonshot CLI                              | Wymaga uwierzytelniania Kimi/Moonshot na hoście.                                   |
| `kiro`     | Kiro CLI                                       | Dostępność adaptera i kontrola modelu zależą od zainstalowanego CLI.               |
| `opencode` | Adapter OpenCode ACP                           | Wymaga uwierzytelniania OpenCode CLI/dostawcy.                                     |
| `openclaw` | Most OpenClaw Gateway przez `openclaw acp`     | Pozwala środowisku obsługującemu ACP komunikować się z powrotem z sesją OpenClaw Gateway. |
| `qwen`     | Qwen Code / Qwen CLI                           | Wymaga uwierzytelniania zgodnego z Qwen na hoście.                                 |

Niestandardowe aliasy agentów acpx można skonfigurować w samym acpx, ale zasady OpenClaw
nadal sprawdzają `acp.allowedAgents` i każde mapowanie
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
    Kontynuuj w powiązanej konwersacji lub wątku (albo jawnie wskaż
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
    - Uruchomienie tworzy lub wznawia sesję środowiska wykonawczego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy przebieg jest własnością rodzica.
    - Sesje ACP będące własnością rodzica są traktowane jako praca w tle nawet wtedy, gdy sesja środowiska wykonawczego jest trwała; ukończenie i dostarczanie między powierzchniami przechodzą przez powiadamiacz zadania nadrzędnego, zamiast zachowywać się jak zwykła sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka zakończone lub osierocone jednorazowe sesje ACP będące własnością rodzica. Trwałe sesje ACP są zachowywane, dopóki istnieje aktywne powiązanie konwersacji; nieaktualne trwałe sesje bez aktywnego powiązania są zamykane, aby nie mogły zostać po cichu wznowione po zakończeniu zadania właściciela albo usunięciu jego rekordu zadania.
    - Powiązane wiadomości uzupełniające trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, odfokusowane, zresetowane lub nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako zwykły tekst promptu do powiązanego środowiska ACP.
    - `cancel` przerywa aktywną turę, gdy backend obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Środowisko może nadal zachować własną historię upstream, jeśli obsługuje wznowienie.
    - Plugin acpx czyści należące do OpenClaw drzewa procesów wrappera i adaptera po `close` oraz usuwa osierocone procesy ACPX należące do OpenClaw podczas uruchamiania Gateway.
    - Bezczynne workery środowiska wykonawczego kwalifikują się do czyszczenia po `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Reguły routingu natywnego Codex">
    Wyzwalacze w języku naturalnym, które powinny kierować do **natywnego pluginu Codex**,
    gdy jest włączony:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Natywne wiązanie rozmowy Codex jest domyślną ścieżką sterowania czatem.
    Narzędzia dynamiczne OpenClaw nadal wykonują się przez OpenClaw, natomiast
    narzędzia natywne dla Codex, takie jak shell/apply-patch, wykonują się wewnątrz Codex.
    Dla zdarzeń narzędzi natywnych dla Codex OpenClaw wstrzykuje natywny
    przekaźnik hooków dla każdej tury, aby hooki pluginów mogły blokować `before_tool_call`, obserwować
    `after_tool_call` i kierować zdarzenia Codex `PermissionRequest`
    przez zatwierdzenia OpenClaw. Hooki Codex `Stop` są przekazywane do
    OpenClaw `before_agent_finalize`, gdzie pluginy mogą zażądać jeszcze jednego
    przebiegu modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik pozostaje
    celowo konserwatywny: nie modyfikuje argumentów narzędzi natywnych dla Codex
    ani nie przepisuje rekordów wątku Codex. Używaj jawnego ACP tylko
    wtedy, gdy potrzebujesz modelu środowiska wykonawczego/sesji ACP. Granica obsługi osadzonego Codex
    jest udokumentowana w
    [Kontrakcie obsługi Codex harness v1](/pl/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Ściągawka wyboru modelu / providera / środowiska wykonawczego">
    - starsze odwołania do modeli Codex - starsza trasa modelu OAuth/subskrypcji Codex naprawiana przez doctor.
    - `openai/*` - natywne osadzone środowisko wykonawcze serwera aplikacji Codex dla tur agenta OpenAI.
    - `/codex ...` - natywne sterowanie rozmową Codex.
    - `/acp ...` lub `runtime: "acp"` - jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze języka naturalnego trasowane do ACP">
    Wyzwalacze, które powinny kierować do środowiska wykonawczego ACP:

    - "Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik."
    - "Użyj Gemini CLI do tego zadania w wątku, a potem utrzymuj kontynuacje w tym samym wątku."
    - "Uruchom Codex przez ACP w wątku w tle."

    OpenClaw wybiera `runtime: "acp"`, rozwiązuje `agentId` harnessa,
    wiąże z bieżącą rozmową lub wątkiem, gdy jest to obsługiwane, i
    kieruje kontynuacje do tej sesji aż do zamknięcia/wygaśnięcia. Codex podąża tą
    ścieżką tylko wtedy, gdy ACP/acpx jest jawne albo natywny plugin Codex
    jest niedostępny dla żądanej operacji.

    Dla `sessions_spawn`, `runtime: "acp"` jest ogłaszane tylko wtedy, gdy ACP
    jest włączone, żądający nie jest w sandboxie i załadowany jest backend środowiska wykonawczego
    ACP. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    wysyłanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych
    wywołań `sessions_spawn({ runtime: "acp" })`. Celuje w identyfikatory harnessów ACP, takie jak `codex`,
    `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj zwykłego
    identyfikatora agenta konfiguracji OpenClaw z `agents_list`, chyba że ten wpis jest
    jawnie skonfigurowany z `agents.list[].runtime.type="acp"`;
    w przeciwnym razie użyj domyślnego środowiska wykonawczego podagenta. Gdy agent OpenClaw
    jest skonfigurowany z `runtime.type="acp"`, OpenClaw używa
    `runtime.acp.agent` jako bazowego identyfikatora harnessa.

  </Accordion>
</AccordionGroup>

## ACP kontra podagenci

Użyj ACP, gdy potrzebujesz zewnętrznego środowiska wykonawczego harnessa. Użyj **natywnego
serwera aplikacji Codex** do wiązania/sterowania rozmową Codex, gdy plugin `codex`
jest włączony. Użyj **podagentów**, gdy potrzebujesz natywnych dla OpenClaw
delegowanych uruchomień.

| Obszar          | Sesja ACP                           | Uruchomienie podagenta                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Środowisko wykonawcze       | Plugin backendu ACP (na przykład acpx) | Natywne środowisko wykonawcze podagenta OpenClaw  |
| Klucz sesji   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Główne polecenia | `/acp ...`                            | `/subagents ...`                   |
| Narzędzie uruchamiania    | `sessions_spawn` z `runtime:"acp"` | `sessions_spawn` (domyślne środowisko wykonawcze) |

Zobacz też [Podagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

Dla Claude Code przez ACP stos wygląda następująco:

1. Płaszczyzna sterowania sesją ACP OpenClaw.
2. Oficjalny plugin środowiska wykonawczego `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Mechanizmy środowiska wykonawczego/sesji po stronie Claude.

ACP Claude to **sesja harnessa** ze sterowaniem ACP, wznawianiem sesji,
śledzeniem zadań w tle i opcjonalnym wiązaniem rozmowy/wątku.

Backendy CLI są oddzielnymi tekstowymi lokalnymi zapasowymi środowiskami wykonawczymi - zobacz
[Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna reguła brzmi:

- **Chcesz `/acp spawn`, wiązalne sesje, sterowanie środowiskiem wykonawczym lub trwałą pracę harnessa?** Użyj ACP.
- **Chcesz prosty lokalny tekstowy fallback przez surowe CLI?** Użyj backendów CLI.

## Sesje powiązane

### Model mentalny

- **Powierzchnia czatu** - miejsce, gdzie ludzie kontynuują rozmowę (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** - trwały stan środowiska wykonawczego Codex/Claude/Gemini, do którego kieruje OpenClaw.
- **Wątek/temat potomny** - opcjonalna dodatkowa powierzchnia wiadomości tworzona tylko przez `--thread ...`.
- **Obszar roboczy środowiska wykonawczego** - lokalizacja systemu plików (`cwd`, checkout repozytorium, obszar roboczy backendu), w której działa harness. Niezależna od powierzchni czatu.

### Wiązania bieżącej rozmowy

`/acp spawn <harness> --bind here` przypina bieżącą rozmowę do
utworzonej sesji ACP - bez wątku potomnego, ta sama powierzchnia czatu. OpenClaw nadal
zarządza transportem, uwierzytelnianiem, bezpieczeństwem i dostarczaniem. Kolejne wiadomości w tej
rozmowie są kierowane do tej samej sesji; `/new` i `/reset` resetują
sesję w miejscu; `/acp close` usuwa wiązanie.

Przykłady:

```text
/codex bind                                              # natywne wiązanie Codex, kieruj przyszłe wiadomości tutaj
/codex model gpt-5.4                                     # dostrój powiązany natywny wątek Codex
/codex stop                                              # kontroluj aktywną turę natywną Codex
/acp spawn codex --bind here                             # jawny fallback ACP dla Codex
/acp spawn codex --thread auto                           # może utworzyć wątek/temat potomny i powiązać tam
/acp spawn codex --bind here --cwd /workspace/repo       # to samo wiązanie czatu, Codex działa w /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reguły wiązania i wyłączność">
    - `--bind here` i `--thread ...` wzajemnie się wykluczają.
    - `--bind here` działa tylko na kanałach, które ogłaszają wiązanie bieżącej rozmowy; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Wiązania utrzymują się po restartach Gateway.
    - W Discord, `spawnSessions` bramkuje tworzenie wątków potomnych dla `--thread auto|here` - nie dla `--bind here`.
    - Jeśli uruchomisz innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **agenta docelowego**. Brakujące odziedziczone ścieżki (`ENOENT`/`ENOTDIR`) cofają się do domyślnego backendu; inne błędy dostępu (np. `EACCES`) są ujawniane jako błędy uruchomienia.
    - Polecenia zarządzania Gateway pozostają lokalne w powiązanych rozmowach - polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst kontynuacji jest kierowany do powiązanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne zawsze, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje powiązane z wątkiem">
    Gdy wiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Kolejne wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
    - Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
    - Odłączenie/zamknięcie/archiwizacja/limit bezczynności lub wygaśnięcie maksymalnego wieku usuwa wiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` są poleceniami Gateway, nie promptami do harnessa ACP.

    Wymagane flagi funkcji dla ACP powiązanego z wątkiem:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne wysyłanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Włączone uruchamianie sesji wątków adaptera kanału (domyślnie: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Obsługa wiązania wątków zależy od adaptera. Jeśli aktywny adapter kanału
    nie obsługuje wiązań wątków, OpenClaw zwraca jasny
    komunikat o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału, który ujawnia możliwość wiązania sesji/wątku.
    - Bieżąca wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy DM).
    - Kanały pluginów mogą dodać obsługę przez ten sam interfejs wiązania.

  </Accordion>
</AccordionGroup>

## Trwałe wiązania kanałów

Dla nieulotnych przepływów pracy skonfiguruj trwałe wiązania ACP w
wpisach najwyższego poziomu `bindings[]`.

### Model wiązania

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe wiązanie rozmowy ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje rozmowę docelową. Kształty według kanału:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kanał/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Preferuj stabilne identyfikatory Slack; wiązania kanałów dopasowują także odpowiedzi wewnątrz wątków tego kanału.
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grupa WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Używaj numerów E.164, takich jak `+15555550123`, dla czatów bezpośrednich oraz identyfikatorów JID grup WhatsApp, takich jak `120363424282127706@g.us`, dla grup.
- **DM/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Preferuj `chat_id:*` dla stabilnych wiązań grup.

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
  Opcjonalny katalog roboczy środowiska wykonawczego.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Opcjonalne nadpisanie backendu.
</ParamField>

### Domyślne wartości środowiska wykonawczego dla agenta

Użyj `agents.list[].runtime`, aby jednorazowo zdefiniować domyślne wartości ACP dla agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator harnessa, np. `codex` lub `claude`)
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

- OpenClaw zapewnia, że skonfigurowana sesja ACP istnieje po dopuszczeniu specyficznym dla kanału i przed użyciem.
- Wiadomości w tym kanale, temacie lub czacie są kierowane do skonfigurowanej sesji ACP.
- Skonfigurowane powiązania ACP są właścicielami swojej trasy sesji. Rozsyłanie broadcastowe kanału nie zastępuje skonfigurowanej sesji ACP dla dopasowanego powiązania.
- W powiązanych rozmowach `/new` i `/reset` resetują ten sam klucz sesji ACP w miejscu.
- Tymczasowe powiązania środowiska uruchomieniowego (na przykład utworzone przez przepływy skupienia wątku) nadal obowiązują tam, gdzie występują.
- Dla międzyagentowych uruchomień ACP bez jawnego `cwd` OpenClaw dziedziczy przestrzeń roboczą agenta docelowego z konfiguracji agenta.
- Brakujące odziedziczone ścieżki przestrzeni roboczej cofają się do domyślnego cwd backendu; istniejące błędy dostępu są zgłaszane jako błędy uruchomienia.

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
    `runtime` domyślnie przyjmuje wartość `subagent`, więc ustaw jawnie `runtime: "acp"`
    dla sesji ACP. Jeśli `agentId` zostanie pominięte, OpenClaw używa
    `acp.defaultAgent`, gdy jest skonfigurowane. `mode: "session"` wymaga
    `thread: true`, aby utrzymać trwałą powiązaną rozmowę.
    </Note>

  </Tab>
  <Tab title="Z polecenia /acp">
    Użyj `/acp spawn` do jawnej kontroli operatora z czatu.

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
  Musi być `"acp"` dla sesji ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Identyfikator docelowego harnessu ACP. Cofa się do `acp.defaultAgent`, jeśli jest ustawiony.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Żąda przepływu powiązania wątku tam, gdzie jest obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` jest jednorazowe; `"session"` jest trwałe. Jeśli `thread: true` i
  `mode` jest pominięte, OpenClaw może domyślnie wybrać trwałe zachowanie zgodnie ze
  ścieżką środowiska uruchomieniowego. `mode: "session"` wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy środowiska uruchomieniowego (walidowany przez politykę backendu/środowiska uruchomieniowego).
  Jeśli pominięto, uruchomienie ACP dziedziczy przestrzeń roboczą agenta docelowego,
  gdy jest skonfigurowana; brakujące odziedziczone ścieżki cofają się do wartości
  domyślnych backendu, a rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora, używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent
  odtwarza historię rozmowy przez `session/load`. Wymaga
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` przesyła strumieniowo początkowe podsumowania postępu uruchomienia ACP z powrotem do
  sesji żądającej jako zdarzenia systemowe. Akceptowane odpowiedzi obejmują
  `streamLogPath` wskazujące dziennik JSONL o zakresie sesji
  (`<sessionId>.acp-stream.jsonl`), który można śledzić, aby uzyskać pełną historię przekaźnika.
  Strumienie postępu rodzica domyślnie pokazują komentarz asystenta i postęp statusu ACP,
  chyba że `streaming.progress.commentary=false`. Discord również domyślnie
  ustawia podglądy rodzica na tryb postępu, gdy nie skonfigurowano trybu strumienia. Postęp
  statusu nadal honoruje `acp.stream.tagVisibility`, więc tagi takie jak `plan`
  pozostają ukryte, chyba że zostaną jawnie włączone.
</ParamField>

Uruchomienia ACP `sessions_spawn` używają `agents.defaults.subagents.runTimeoutSeconds` jako
domyślnego limitu tury potomnej. Narzędzie nie akceptuje nadpisań limitu czasu dla pojedynczego wywołania.

<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla sesji potomnej ACP. Uruchomienia Codex ACP
  normalizują referencje OpenAI, takie jak `openai/gpt-5.4`, do konfiguracji startowej Codex ACP
  przed `session/new`; formy ukośnikowe, takie jak `openai/gpt-5.4/high`,
  ustawiają także poziom wysiłku rozumowania Codex ACP.
  Po pominięciu `sessions_spawn({ runtime: "acp" })` używa istniejących
  domyślnych modeli podagentów (`agents.defaults.subagents.model` lub
  `agents.list[].subagents.model`), gdy są skonfigurowane; w przeciwnym razie pozwala
  harnessowi ACP użyć własnego modelu domyślnego.
  Inne harnessy muszą ogłaszać ACP `models` i obsługiwać
  `session/set_model`; w przeciwnym razie OpenClaw/acpx kończy się jasno zamiast
  po cichu cofać się do domyślnego agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawny poziom thinking/reasoning. Dla Codex ACP `minimal` mapuje się na
  niski poziom, `low`/`medium`/`high`/`xhigh` mapują się bezpośrednio, a `off`
  pomija startowe nadpisanie poziomu rozumowania.
  Po pominięciu uruchomienia ACP używają istniejących domyślnych wartości thinking podagentów oraz
  `agents.defaults.models["provider/model"].params.thinking` dla wybranego modelu.
</ParamField>

## Tryby powiązania uruchomienia i wątku

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Zachowanie                                                               |
    | ------ | ------------------------------------------------------------------------ |
    | `here` | Powiąż bieżącą aktywną rozmowę w miejscu; zakończ błędem, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz powiązania bieżącej rozmowy.                                   |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatora dla „spraw, aby ten kanał lub czat był obsługiwany przez Codex”.
    - `--bind here` nie tworzy wątku potomnego.
    - `--bind here` jest dostępne tylko w kanałach, które udostępniają obsługę powiązania bieżącej rozmowy.
    - `--bind` i `--thread` nie mogą być połączone w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Zachowanie                                                                                            |
    | ------ | ----------------------------------------------------------------------------------------------------- |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek potomny, gdy jest obsługiwany. |
    | `here` | Wymagaj bieżącego aktywnego wątku; zakończ błędem, jeśli nie jesteś w żadnym.                        |
    | `off`  | Brak powiązania. Sesja zaczyna jako niepowiązana.                                                     |

    Uwagi:

    - Na powierzchniach powiązania bez wątków domyślne zachowanie jest faktycznie `off`.
    - Uruchomienie powiązane z wątkiem wymaga obsługi przez politykę kanału:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Użyj `--bind here`, gdy chcesz przypiąć bieżącą rozmowę bez tworzenia wątku potomnego.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą być interaktywnymi przestrzeniami roboczymi albo pracą w tle
należącą do rodzica. Ścieżka dostarczania zależy od tej postaci.

<AccordionGroup>
  <Accordion title="Interaktywne sesje ACP">
    Sesje interaktywne mają kontynuować rozmowę na widocznej powierzchni
    czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą rozmowę z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwałe skonfigurowane `bindings[].type="acp"` kierują dopasowane rozmowy do tej samej sesji ACP.

    Kolejne wiadomości w powiązanej rozmowie są kierowane bezpośrednio do
    sesji ACP, a wyjście ACP jest dostarczane z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do harnessu:

    - Normalne powiązane kontynuacje są wysyłane jako tekst promptu oraz załączniki tylko wtedy, gdy harness/backend je obsługuje.
    - Polecenia zarządzania `/acp` i lokalne polecenia Gateway są przechwytywane przed wysłaniem ACP.
    - Zdarzenia ukończenia wygenerowane przez środowisko uruchomieniowe są materializowane dla każdego celu. Agenci OpenClaw otrzymują wewnętrzną kopertę runtime-context OpenClaw; zewnętrzne harnessy ACP otrzymują zwykły prompt z wynikiem potomnym i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych harnessów ani utrwalana jako tekst transkryptu użytkownika ACP.
    - Wpisy transkryptu ACP używają widocznego dla użytkownika tekstu wyzwalacza lub zwykłego promptu ukończenia. Metadane zdarzeń wewnętrznych pozostają w OpenClaw w ustrukturyzowanej postaci tam, gdzie to możliwe, i nie są traktowane jako treść czatu napisana przez użytkownika.

  </Accordion>
  <Accordion title="Jednorazowe sesje ACP należące do rodzica">
    Jednorazowe sesje ACP uruchamiane przez inne uruchomienie agenta są
    dziećmi w tle, podobnie jak podagenci:

    - Rodzic prosi o pracę za pomocą `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Dziecko działa we własnej sesji harnessu ACP.
    - Tury dziecka działają na tej samej ścieżce tła, której używają natywne uruchomienia podagentów, więc wolny harness ACP nie blokuje niepowiązanej pracy sesji głównej.
    - Raporty ukończenia wracają przez ścieżkę ogłaszania ukończenia zadania. OpenClaw konwertuje wewnętrzne metadane ukończenia na zwykły prompt ACP przed wysłaniem go do zewnętrznego harnessu, więc harnessy nie widzą markerów kontekstu środowiska uruchomieniowego specyficznych dla OpenClaw.
    - Rodzic przepisuje wynik dziecka normalnym głosem asystenta, gdy przydatna jest odpowiedź widoczna dla użytkownika.

    **Nie** traktuj tej ścieżki jako czatu peer-to-peer między rodzicem
    a dzieckiem. Dziecko ma już kanał ukończenia z powrotem do
    rodzica.

  </Accordion>
  <Accordion title="sessions_send i dostarczanie A2A">
    `sessions_send` może wskazać inną sesję po uruchomieniu. Dla zwykłych
    sesji równorzędnych OpenClaw używa ścieżki kontynuacji agent-do-agenta (A2A)
    po wstrzyknięciu wiadomości:

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól żądającemu i celowi wymienić ograniczoną liczbę tur kontynuacji.
    - Poproś cel o utworzenie komunikatu ogłoszenia.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest mechanizmem awaryjnym dla wysyłek równorzędnych, gdy nadawca potrzebuje
    widocznej kontynuacji. Pozostaje włączona, gdy niepowiązana sesja może
    zobaczyć i wysłać wiadomość do celu ACP, na przykład przy szerokich
    ustawieniach `tools.sessions.visibility`.

    OpenClaw pomija dalsze działanie A2A tylko wtedy, gdy żądający jest
    rodzicem swojego własnego, należącego do rodzica, jednorazowego dziecka ACP. W takim przypadku
    uruchomienie A2A po ukończeniu zadania może wybudzić rodzica z wynikiem
    dziecka, przekazać odpowiedź rodzica z powrotem do dziecka i
    utworzyć pętlę echa rodzic/dziecko. Wynik `sessions_send` zgłasza
    `delivery.status="skipped"` dla tego przypadku należącego dziecka, ponieważ
    ścieżka ukończenia już odpowiada za wynik.

  </Accordion>
  <Accordion title="Wznawianie istniejącej sesji">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    zaczynać od nowa. Agent odtwarza historię rozmowy przez
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

    - Przekaż sesję Codex z laptopa na telefon - powiedz agentowi, aby kontynuował od miejsca, w którym przerwano.
    - Kontynuuj sesję kodowania rozpoczętą interaktywnie w CLI, teraz bezobsługowo przez agenta.
    - Wznów pracę przerwaną przez ponowne uruchomienie Gateway lub limit bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślne środowisko uruchomieniowe subagenta ignoruje to pole właściwe tylko dla ACP.
    - `streamTo` ma zastosowanie tylko wtedy, gdy `runtime: "acp"`; domyślne środowisko uruchomieniowe subagenta ignoruje to pole właściwe tylko dla ACP.
    - `resumeSessionId` to lokalny dla hosta identyfikator wznowienia ACP/harness, a nie klucz sesji kanału OpenClaw; OpenClaw nadal sprawdza zasady uruchamiania ACP i zasady agenta docelowego przed wysłaniem, natomiast backend ACP lub harness odpowiada za autoryzację wczytania tego identyfikatora upstream.
    - `resumeSessionId` przywraca historię rozmowy upstream ACP; `thread` i `mode` nadal stosują się normalnie do nowej sesji OpenClaw, którą tworzysz, więc `mode: "session"` nadal wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się jasnym błędem - bez cichego przejścia do nowej sesji.

  </Accordion>
  <Accordion title="Test dymny po wdrożeniu">
    Po wdrożeniu Gateway uruchom sprawdzenie end-to-end na żywo zamiast
    polegać na testach jednostkowych:

    1. Zweryfikuj wersję i commit wdrożonego Gateway na hoście docelowym.
    2. Otwórz tymczasową sesję mostka ACPX do działającego agenta.
    3. Poproś tego agenta, aby wywołał `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` oraz zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywiste `childSessionKey` i brak błędu walidatora.
    5. Wyczyść tymczasową sesję mostka.

    Zachowaj bramkę na `mode: "run"` i pomiń `streamTo: "parent"` -
    powiązane z wątkiem `mode: "session"` oraz ścieżki przekazywania strumienia to osobne,
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
- Użyj `runtime: "subagent"` dla natywnych prac OpenClaw z egzekwowaniem piaskownicy.

</Warning>

Obecne ograniczenia:

- Jeśli sesja żądającego działa w piaskownicy, uruchomienia ACP są blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozpoznawanie celu sesji

Większość działań `/acp` przyjmuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozpoznawania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - próbuje klucza
   - następnie identyfikatora sesji w kształcie UUID
   - następnie etykiety
2. Bieżące powiązanie wątku (jeśli ta rozmowa/wątek jest powiązana z sesją ACP).
3. Zapasowa bieżąca sesja żądającego.

Powiązania bieżącej rozmowy i powiązania wątków uczestniczą
w kroku 2.

Jeśli nie uda się rozpoznać celu, OpenClaw zwraca jasny błąd
(`Unable to resolve session target: ...`).

## Kontrolki ACP

| Polecenie            | Co robi                                                   | Przykład                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalnie bieżące powiązanie lub powiązanie wątku. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje trwającą turę dla sesji docelowej.                | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i odpina cele wątku.                         | `/acp close`                                                  |
| `/acp status`        | Pokazuje backend, tryb, stan, opcje środowiska uruchomieniowego i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb środowiska uruchomieniowego dla sesji docelowej. | `/acp set-mode plan`                                          |
| `/acp set`           | Zapisuje ogólną opcję konfiguracji środowiska uruchomieniowego. | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego środowiska uruchomieniowego. | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Ustawia profil polityki zatwierdzania.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Ustawia limit czasu środowiska uruchomieniowego (sekundy). | `/acp timeout 120`                                            |
| `/acp model`         | Ustawia nadpisanie modelu środowiska uruchomieniowego.    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska uruchomieniowego sesji. | `/acp reset-options`                                          |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP ze store.                    | `/acp sessions`                                               |
| `/acp doctor`        | Stan backendu, możliwości i możliwe do wykonania poprawki. | `/acp doctor`                                                 |
| `/acp install`       | Drukuje deterministyczne kroki instalacji i włączania.    | `/acp install`                                                |

`/acp status` pokazuje efektywne opcje środowiska uruchomieniowego oraz identyfikatory sesji
na poziomie środowiska uruchomieniowego i backendu. Błędy nieobsługiwanych kontrolek są pokazywane
jasno, gdy backend nie ma danej możliwości. `/acp sessions` odczytuje
store dla bieżącej powiązanej sesji lub sesji żądającego; tokeny celu
(`session-key`, `session-id` lub `session-label`) są rozpoznawane przez
odkrywanie sesji gateway, w tym niestandardowe korzenie `session.store`
dla poszczególnych agentów.

### Mapowanie opcji środowiska uruchomieniowego

`/acp` ma wygodne polecenia i ogólny setter. Równoważne
operacje:

| Polecenie                    | Mapuje na                            | Uwagi                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | klucz konfiguracji runtime `model`   | Dla Codex ACP OpenClaw normalizuje `openai/<model>` do identyfikatora modelu adaptera i mapuje sufiksy rozumowania ze slashem, takie jak `openai/gpt-5.4/high`, na `reasoning_effort`.                    |
| `/acp set thinking <level>`  | opcja kanoniczna `thinking`          | OpenClaw wysyła odpowiednik reklamowany przez backend, gdy jest obecny, preferując `thinking`, potem `effort`, `reasoning_effort` lub `thought_level`. Dla Codex ACP adapter mapuje wartości na `reasoning_effort`. |
| `/acp permissions <profile>` | opcja kanoniczna `permissionProfile` | OpenClaw wysyła odpowiednik reklamowany przez backend, gdy jest obecny, taki jak `approval_policy`, `permission_profile`, `permissions` lub `permission_mode`.                                           |
| `/acp timeout <seconds>`     | opcja kanoniczna `timeoutSeconds`    | OpenClaw wysyła odpowiednik reklamowany przez backend, gdy jest obecny, taki jak `timeout` lub `timeout_seconds`.                                                                                         |
| `/acp cwd <path>`            | nadpisanie cwd runtime               | Bezpośrednia aktualizacja.                                                                                                                                                                                 |
| `/acp set <key> <value>`     | ogólne                               | `key=cwd` używa ścieżki nadpisania cwd.                                                                                                                                                                    |
| `/acp reset-options`         | czyści wszystkie nadpisania runtime  | -                                                                                                                                                                                                          |

## Harness acpx, konfiguracja Plugin i uprawnienia

Konfigurację harness acpx (aliasy Claude Code / Codex / Gemini CLI),
mostki MCP plugin-tools i OpenClaw-tools oraz tryby
uprawnień ACP opisuje
[Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                       | Prawdopodobna przyczyna                                                                                                | Poprawka                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Brak Plugin backendu, jest wyłączony albo zablokowany przez `plugins.allow`.                                           | Zainstaluj i włącz Plugin backendu, dodaj `acpx` do `plugins.allow`, gdy ta lista dozwolonych jest ustawiona, a następnie uruchom `/acp doctor`.                                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP jest globalnie wyłączone.                                                                                         | Ustaw `acp.enabled=true`.                                                                                                                                                             |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatyczne przekazywanie ze zwykłych wiadomości w wątku jest wyłączone.                                              | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne kierowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają.                                   |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent nie znajduje się na liście dozwolonych.                                                                          | Użyj dozwolonego `agentId` albo zaktualizuj `acp.allowedAgents`.                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | Brak Plugin backendu, jest wyłączony, zablokowany przez zasady dozwalania/odmawiania albo skonfigurowany plik wykonywalny jest niedostępny. | Zainstaluj/włącz Plugin backendu, ponownie uruchom `/acp doctor` i sprawdź błąd instalacji backendu albo zasad, jeśli nadal jest w niezdrowym stanie.                                 |
| Harness command not found                                                   | CLI adaptera nie jest zainstalowane, brakuje zewnętrznego Plugin albo pierwsze pobranie przez `npx` nie powiodło się dla adaptera innego niż Codex. | Uruchom `/acp doctor`, zainstaluj/wstępnie przygotuj adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx.                                                         |
| Model-not-found from the harness                                            | Identyfikator modelu jest prawidłowy dla innego dostawcy/mechanizmu, ale nie dla tego celu ACP.                       | Użyj modelu wskazanego przez ten mechanizm, skonfiguruj model w mechanizmie albo pomiń nadpisanie.                                                                                    |
| Vendor auth error from the harness                                          | OpenClaw działa poprawnie, ale docelowe CLI/dostawca nie jest zalogowany.                                             | Zaloguj się albo podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                                            |
| `Unable to resolve session target: ...`                                     | Nieprawidłowy token klucza/identyfikatora/etykiety.                                                                    | Uruchom `/acp sessions`, skopiuj dokładny klucz/etykietę i ponów próbę.                                                                                                               |
| `--bind here requires running /acp spawn inside an active ... conversation` | Użyto `--bind here` bez aktywnej rozmowy, którą można powiązać.                                                       | Przejdź do docelowego czatu/kanału i ponów próbę albo użyj uruchomienia bez powiązania.                                                                                               |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter nie ma możliwości powiązania ACP z bieżącą rozmową.                                                          | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj najwyższego poziomu `bindings[]` albo przejdź do obsługiwanego kanału.                                        |
| `--thread here requires running /acp spawn inside an active ... thread`     | Użyto `--thread here` poza kontekstem wątku.                                                                           | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                                          | Przepnij powiązanie jako właściciel albo użyj innej rozmowy lub wątku.                                                                                                                |
| `Thread bindings are unavailable for <channel>.`                            | Adapter nie ma możliwości powiązania wątku.                                                                            | Użyj `--thread off` albo przejdź do obsługiwanego adaptera/kanału.                                                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Środowisko uruchomieniowe ACP działa po stronie hosta; sesja żądająca działa w piaskownicy.                          | Użyj `runtime="subagent"` z sesji w piaskownicy albo uruchom ACP spawn z sesji bez piaskownicy.                                                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Zażądano `sandbox="require"` dla środowiska uruchomieniowego ACP.                                                     | Użyj `runtime="subagent"` dla wymaganego uruchomienia w piaskownicy albo użyj ACP z `sandbox="inherit"` z sesji bez piaskownicy.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Docelowy mechanizm nie udostępnia ogólnego przełączania modeli ACP.                                                   | Użyj mechanizmu, który ogłasza ACP `models`/`session/set_model`, użyj referencji modeli Codex ACP albo skonfiguruj model bezpośrednio w mechanizmie, jeśli ma własną flagę startową. |
| Missing ACP metadata for bound session                                      | Nieaktualne/usunięte metadane sesji ACP.                                                                               | Utwórz ponownie przez `/acp spawn`, a następnie przepnij powiązanie/skup wątek.                                                                                                       |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokuje zapisy/wykonania w nieinteraktywnej sesji ACP.                                               | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie Gateway. Zobacz [Konfigurację uprawnień](/pl/tools/acp-agents-setup#permission-configuration).   |
| ACP session fails early with little output                                  | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`.                                | Sprawdź logi Gateway pod kątem `AcpRuntimeError`. Dla pełnych uprawnień ustaw `permissionMode=approve-all`; dla łagodnej degradacji ustaw `nonInteractivePermissions=deny`.           |
| ACP session stalls indefinitely after completing work                       | Proces mechanizmu zakończył się, ale sesja ACP nie zgłosiła ukończenia.                                               | Zaktualizuj OpenClaw; obecne czyszczenie acpx usuwa nieaktualne procesy opakowujące i adaptera należące do OpenClaw przy zamknięciu oraz starcie Gateway.                            |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Wewnętrzna koperta zdarzenia wyciekła przez granicę ACP.                                                              | Zaktualizuj OpenClaw i ponownie uruchom przepływ ukończenia; zewnętrzne mechanizmy powinny otrzymywać wyłącznie zwykłe monity ukończenia.                                             |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` należy do
natywnego przekaźnika hooków Codex, nie do ACP/acpx. W powiązanym czacie Codex rozpocznij świeżą
sesję poleceniem `/new` albo `/reset`; jeśli zadziała raz, a potem wróci przy następnym
natywnym wywołaniu narzędzia, uruchom ponownie serwer aplikacji Codex albo OpenClaw Gateway zamiast
powtarzać `/new`. Zobacz [Rozwiązywanie problemów z mechanizmem Codex](/pl/plugins/codex-harness#troubleshooting).
</Note>

## Powiązane

- [Agenci ACP - konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie agenta](/pl/tools/agent-send)
- [Backendy CLI](/pl/gateway/cli-backends)
- [Mechanizm Codex](/pl/plugins/codex-harness)
- [Środowisko uruchomieniowe mechanizmu Codex](/pl/plugins/codex-harness-runtime)
- [Narzędzia piaskownicy wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Podagenci](/pl/tools/subagents)
