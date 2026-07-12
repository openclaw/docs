---
read_when:
    - Uruchamianie środowisk programistycznych przez ACP
    - Konfigurowanie sesji ACP powiązanych z konwersacją w kanałach komunikacyjnych
    - Powiązanie konwersacji w kanale wiadomości z trwałą sesją ACP
    - Rozwiązywanie problemów z backendem ACP, integracją pluginu lub dostarczaniem wyników po zakończeniu
    - Obsługa poleceń /acp z poziomu czatu
sidebarTitle: ACP agents
summary: Uruchamiaj zewnętrzne środowiska programistyczne (Claude Code, Cursor, Gemini CLI, jawnie wskazany Codex ACP, OpenClaw ACP, OpenCode) za pośrednictwem backendu ACP
title: Agenci ACP
x-i18n:
    generated_at: "2026-07-12T15:37:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

Sesje [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) umożliwiają
OpenClaw uruchamianie zewnętrznych środowisk programistycznych (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI i innych obsługiwanych środowisk ACPX)
za pośrednictwem Pluginu zaplecza ACP. Każde uruchomienie jest śledzone jako
[zadanie w tle](/pl/automation/tasks).

<Note>
**ACP jest ścieżką dla zewnętrznych środowisk, a nie domyślną ścieżką Codex.** Natywny
Plugin serwera aplikacji Codex obsługuje polecenia `/codex ...` oraz domyślne
osadzone środowisko wykonawcze `openai/gpt-*` dla tur agentów; ACP obsługuje polecenia `/acp ...`
oraz sesje `sessions_spawn({ runtime: "acp" })`.

Aby umożliwić Codex lub Claude Code bezpośrednie połączenie jako zewnętrzny klient MCP
z istniejącymi konwersacjami kanałów OpenClaw, użyj
[`openclaw mcp serve`](/pl/cli/mcp) zamiast ACP.
</Note>

## Którą stronę wybrać?

| Chcesz...                                                                                       | Użyj                                  | Uwagi                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Powiązać Codex z bieżącą konwersacją lub nim sterować                                           | `/codex bind`, `/codex threads`       | Natywna ścieżka serwera aplikacji Codex, gdy Plugin `codex` jest włączony: odpowiedzi w powiązanym czacie, przekazywanie obrazów, model/tryb szybki/uprawnienia, zatrzymywanie i sterowanie. ACP stanowi jawny mechanizm rezerwowy |
| Uruchomić Claude Code, Gemini CLI, jawnie Codex ACP lub inne zewnętrzne środowisko _za pośrednictwem_ OpenClaw | Ta strona                             | Sesje powiązane z czatem, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, zadania w tle, sterowanie środowiskiem wykonawczym                                                           |
| Udostępnić sesję Gateway OpenClaw _jako_ serwer ACP dla edytora lub klienta                     | [`openclaw acp`](/pl/cli/acp)            | Tryb mostu: IDE/klient komunikuje się z OpenClaw za pomocą ACP przez stdio/WebSocket                                                                                                      |
| Ponownie wykorzystać lokalne CLI AI jako rezerwowy model wyłącznie tekstowy                     | [Zaplecza CLI](/pl/gateway/cli-backends) | To nie jest ACP: brak narzędzi OpenClaw, sterowania ACP i środowiska wykonawczego                                                                                                         |

## Czy to działa od razu?

Tak, po zainstalowaniu oficjalnego Pluginu środowiska wykonawczego ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kopie robocze kodu źródłowego mogą korzystać z lokalnego Pluginu przestrzeni roboczej `extensions/acpx` po
wykonaniu `pnpm install`. Uruchom `/acp doctor`, aby sprawdzić gotowość.

OpenClaw informuje agentów o uruchamianiu ACP tylko wtedy, gdy ACP jest **rzeczywiście dostępne**:
ACP musi być włączone, wysyłanie zadań nie może być wyłączone, bieżąca sesja nie może
być blokowana przez piaskownicę, a zaplecze środowiska wykonawczego musi być załadowane i sprawne. Jeśli
którykolwiek warunek nie jest spełniony, Skills ACP i wskazówki ACP dotyczące `sessions_spawn` pozostają ukryte,
aby agent nie sugerował niedostępnego zaplecza.

<AccordionGroup>
  <Accordion title="Pułapki przy pierwszym uruchomieniu">
    - Jeśli ustawiono `plugins.allow`, jest to restrykcyjny wykaz Pluginów i **musi** zawierać `acpx`; w przeciwnym razie zainstalowane zaplecze ACP zostanie celowo zablokowane (`/acp doctor` zgłosi brakujący wpis na liście dozwolonych).
    - Adapter Codex ACP jest dostarczany z Pluginem `acpx` i w miarę możliwości uruchamia się lokalnie.
    - Codex ACP działa z odizolowanym `CODEX_HOME`. OpenClaw kopiuje z konfiguracji Codex hosta zaufane wpisy zaufania projektów oraz bezpieczną konfigurację routingu modeli/dostawców (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` i bezpieczne pola `model_providers.<name>`); uwierzytelnianie, powiadomienia i haki pozostają wyłącznie w konfiguracji hosta.
    - Adaptery innych docelowych środowisk mogą być pobierane na żądanie za pomocą `npx` przy pierwszym użyciu.
    - Uwierzytelnianie u dostawcy musi już być skonfigurowane na hoście dla danego środowiska.
    - Jeśli host nie ma dostępu do npm ani sieci, pobieranie adapterów przy pierwszym uruchomieniu nie powiedzie się, dopóki pamięci podręczne nie zostaną wcześniej wypełnione lub adapter nie zostanie zainstalowany w inny sposób.

  </Accordion>
  <Accordion title="Wymagania wstępne środowiska wykonawczego">
    ACP uruchamia rzeczywisty proces zewnętrznego środowiska. OpenClaw odpowiada za routing,
    stan zadań w tle, dostarczanie, powiązania i zasady; środowisko odpowiada za
    logowanie u dostawcy, katalog modeli, działanie systemu plików i natywne narzędzia.

    Zanim obwinisz OpenClaw, sprawdź:

    - `/acp doctor` zgłasza włączone i sprawne zaplecze.
    - Identyfikator docelowy jest dozwolony przez `acp.allowedAgents`, jeśli ta lista dozwolonych jest ustawiona.
    - Polecenie środowiska może zostać uruchomione na hoście Gateway.
    - Uwierzytelnianie dostawcy jest dostępne dla tego środowiska (`claude`, `codex`, `gemini`, `opencode`, `droid` itd.).
    - Wybrany model istnieje w tym środowisku — identyfikatorów modeli nie można przenosić między środowiskami.
    - Żądany katalog `cwd` istnieje i jest dostępny; możesz też pominąć `cwd`, aby zaplecze użyło wartości domyślnej.
    - Tryb uprawnień odpowiada wykonywanej pracy. Sesje nieinteraktywne nie mogą klikać natywnych monitów o uprawnienia, dlatego uruchomienia programistyczne intensywnie zapisujące dane lub wykonujące polecenia zwykle wymagają profilu uprawnień ACPX, który może działać bez interfejsu.

  </Accordion>
</AccordionGroup>

Narzędzia Pluginów OpenClaw i wbudowane narzędzia OpenClaw **nie** są domyślnie udostępniane
środowiskom ACP. Włącz jawne mosty MCP opisane w
[Konfiguracja agentów ACP](/pl/tools/acp-agents-setup) tylko wtedy, gdy środowisko ma
bezpośrednio wywoływać te narzędzia.

## Obsługiwane środowiska docelowe

Z zapleczem `acpx` używaj poniższych identyfikatorów jako wartości docelowych `/acp spawn <id>` lub
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Identyfikator środowiska | Typowe zaplecze                                  | Uwagi                                                                                           |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `claude`                 | Adapter ACP Claude Code                          | Wymaga uwierzytelnienia Claude Code na hoście.                                                  |
| `codex`                  | Adapter Codex ACP                                | Jawny mechanizm rezerwowy ACP używany tylko wtedy, gdy natywne `/codex` jest niedostępne lub zażądano ACP. |
| `copilot`                | Adapter ACP GitHub Copilot                       | Wymaga uwierzytelnienia CLI/środowiska wykonawczego Copilot.                                    |
| `cursor`                 | Cursor CLI ACP (`cursor-agent acp`)              | Zastąp polecenie acpx, jeśli lokalna instalacja udostępnia inny punkt wejścia ACP.               |
| `droid`                  | Factory Droid CLI                                | Wymaga uwierzytelnienia Factory/Droid lub `FACTORY_API_KEY` w środowisku procesu.                |
| `fast-agent`             | Adapter ACP fast-agent-mcp                       | Pobierany na żądanie za pomocą `uvx`.                                                           |
| `gemini`                 | Adapter ACP Gemini CLI                           | Wymaga uwierzytelnienia Gemini CLI lub konfiguracji klucza API.                                 |
| `iflow`                  | iFlow CLI                                        | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.                         |
| `kilocode`               | Kilo Code CLI                                    | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.                         |
| `kimi`                   | Kimi/Moonshot CLI                                | Wymaga uwierzytelnienia Kimi/Moonshot na hoście.                                                |
| `kiro`                   | Kiro CLI                                         | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.                         |
| `mux`                    | Adapter ACP Mux CLI                              | Pobierany na żądanie za pomocą `npx`.                                                           |
| `opencode`               | Adapter ACP OpenCode                             | Wymaga uwierzytelnienia CLI/dostawcy OpenCode.                                                  |
| `openclaw`               | Most Gateway OpenClaw przez `openclaw acp`       | Umożliwia środowisku obsługującemu ACP komunikację zwrotną z sesją Gateway OpenClaw.             |
| `qoder`                  | Qoder CLI                                        | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.                         |
| `qwen`                   | Qwen Code / Qwen CLI                             | Wymaga uwierzytelnienia zgodnego z Qwen na hoście.                                              |
| `trae`                   | Adapter ACP Trae CLI                             | Dostępność adaptera i sterowanie modelem zależą od zainstalowanego CLI.                         |

`pi` (pi-acp) jest również zarejestrowany w zapleczu acpx, ale nie jest
środowiskiem programistycznym w takim samym znaczeniu jak pozostałe wymienione powyżej.

Niestandardowe aliasy agentów acpx można skonfigurować bezpośrednio w acpx, ale zasady OpenClaw
nadal sprawdzają `acp.allowedAgents` oraz wszelkie mapowania
`agents.list[].runtime.acp.agent` przed wysłaniem zadania.

## Procedura operatora

Skrócony przebieg `/acp` z poziomu czatu:

<Steps>
  <Step title="Uruchomienie">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` lub jawnie
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Praca">
    Kontynuuj w powiązanej konwersacji lub wątku (albo jawnie wskaż klucz sesji).
  </Step>
  <Step title="Sprawdzenie stanu">
    `/acp status`
  </Step>
  <Step title="Dostosowanie">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Sterowanie">
    Bez zastępowania kontekstu: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Zatrzymanie">
    `/acp cancel` (bieżąca tura) lub `/acp close` (sesja i powiązania).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Szczegóły cyklu życia">
    - Uruchomienie tworzy lub wznawia sesję środowiska wykonawczego ACP, zapisuje metadane ACP w magazynie sesji OpenClaw i może utworzyć zadanie w tle, gdy uruchomienie należy do procesu nadrzędnego.
    - Sesje ACP należące do procesu nadrzędnego są traktowane jako praca w tle nawet wtedy, gdy sesja środowiska wykonawczego jest trwała; zakończenie i dostarczanie między powierzchniami odbywają się przez mechanizm powiadomień zadania nadrzędnego, zamiast zachowywać się jak zwykła sesja czatu widoczna dla użytkownika.
    - Utrzymanie zadań zamyka zakończone lub osierocone jednorazowe sesje ACP należące do procesu nadrzędnego. Trwałe sesje ACP są zachowywane, dopóki istnieje aktywne powiązanie z konwersacją; nieaktualne trwałe sesje bez aktywnego powiązania są zamykane, aby nie mogły zostać po cichu wznowione po zakończeniu zadania właściciela lub usunięciu jego rekordu.
    - Kolejne wiadomości w ramach powiązania trafiają bezpośrednio do sesji ACP, dopóki powiązanie nie zostanie zamknięte, pozbawione fokusu, zresetowane lub nie wygaśnie.
    - Polecenia Gateway pozostają lokalne. `/acp ...`, `/status` i `/unfocus` nigdy nie są wysyłane jako zwykły tekst monitu do powiązanego środowiska ACP.
    - `cancel` przerywa aktywną turę, jeśli zaplecze obsługuje anulowanie; nie usuwa powiązania ani metadanych sesji.
    - `close` kończy sesję ACP z punktu widzenia OpenClaw i usuwa powiązanie. Środowisko może nadal zachowywać własną historię po stronie nadrzędnej, jeśli obsługuje wznawianie.
    - Plugin acpx po wykonaniu `close` czyści drzewa procesów opakowujących i adapterów należących do OpenClaw oraz usuwa nieaktualne osierocone procesy ACPX należące do OpenClaw podczas uruchamiania Gateway.
    - Bezczynne procesy robocze środowiska wykonawczego mogą zostać usunięte po czasie określonym przez `acp.runtime.ttlMinutes`; zapisane metadane sesji pozostają dostępne dla `/acp sessions`.

  </Accordion>
  <Accordion title="Reguły natywnego routingu Codex">
    Wyzwalacze w języku naturalnym, które powinny być kierowane do **natywnego Pluginu Codex**,
    gdy jest on włączony:

    - „Powiąż ten kanał Discord z Codex”.
    - „Dołącz ten czat do wątku Codex `<id>`”.
    - „Pokaż wątki Codex, a następnie powiąż ten”.

    Natywne powiązanie konwersacji Codex jest domyślną ścieżką sterowania czatem.
    Dynamiczne narzędzia OpenClaw nadal są wykonywane przez OpenClaw, natomiast narzędzia
    natywne dla Codex, takie jak powłoka/apply-patch, są wykonywane wewnątrz Codex. Dla zdarzeń
    narzędzi natywnych dla Codex OpenClaw wprowadza w każdej turze natywny przekaźnik hooków,
    dzięki któremu hooki pluginów mogą blokować `before_tool_call`, obserwować
    `after_tool_call` i kierować zdarzenia Codex `PermissionRequest` przez mechanizm
    zatwierdzeń OpenClaw. Hooki Codex `Stop` są przekazywane do
    `before_agent_finalize` OpenClaw, gdzie pluginy mogą zażądać jeszcze jednego
    przebiegu modelu, zanim Codex sfinalizuje odpowiedź. Przekaźnik celowo pozostaje
    zachowawczy: nie modyfikuje argumentów narzędzi natywnych dla Codex
    ani nie przepisuje rekordów wątków Codex. Używaj jawnego ACP tylko wtedy, gdy chcesz
    korzystać z modelu środowiska wykonawczego/sesji ACP. Granice obsługi osadzonego
    Codex opisano w
    [kontrakcie obsługi mechanizmu Codex v1](/pl/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Ściągawka wyboru modelu / dostawcy / środowiska wykonawczego">
    - starsze odwołania do modeli Codex - starsza ścieżka modelu Codex OAuth/subskrypcji naprawiana przez doctor.
    - `openai/*` - osadzone natywne środowisko wykonawcze serwera aplikacji Codex dla tur agenta OpenAI.
    - `/codex ...` - natywne sterowanie konwersacją Codex.
    - `/acp ...` lub `runtime: "acp"` - jawne sterowanie ACP/acpx.

  </Accordion>
  <Accordion title="Wyzwalacze języka naturalnego kierujące do ACP">
    Wyzwalacze, które powinny kierować do środowiska wykonawczego ACP:

    - „Uruchom to jako jednorazową sesję Claude Code ACP i podsumuj wynik”.
    - „Użyj Gemini CLI do tego zadania w wątku, a następnie prowadź dalsze interakcje w tym samym wątku”.
    - „Uruchom Codex przez ACP w wątku działającym w tle”.

    OpenClaw wybiera `runtime: "acp"`, rozpoznaje `agentId` mechanizmu, wiąże go
    z bieżącą konwersacją lub wątkiem, jeśli jest to obsługiwane, i kieruje dalsze
    interakcje do tej sesji aż do jej zamknięcia/wygaśnięcia. Codex korzysta z tej
    ścieżki tylko wtedy, gdy ACP/acpx wskazano jawnie lub natywny plugin Codex
    jest niedostępny dla żądanej operacji.

    W przypadku `sessions_spawn` opcja `runtime: "acp"` jest udostępniana tylko wtedy,
    gdy ACP jest włączone, zgłaszający nie działa w piaskownicy i załadowano backend
    środowiska wykonawczego ACP. `acp.dispatch.enabled=false` wstrzymuje automatyczne
    kierowanie wątków ACP, ale nie ukrywa ani nie blokuje jawnych wywołań
    `sessions_spawn({ runtime: "acp" })`. Opcja ta wskazuje identyfikatory mechanizmów
    ACP, takie jak `codex`, `claude`, `droid`, `gemini` lub `opencode`. Nie przekazuj
    zwykłego identyfikatora agenta z konfiguracji OpenClaw, pochodzącego z
    `agents_list`, chyba że ten wpis został jawnie skonfigurowany za pomocą
    `agents.list[].runtime.type="acp"`; w przeciwnym razie użyj domyślnego środowiska
    wykonawczego podagenta. Gdy agent OpenClaw jest skonfigurowany z
    `runtime.type="acp"`, OpenClaw używa `runtime.acp.agent` jako bazowego
    identyfikatora mechanizmu.

  </Accordion>
</AccordionGroup>

## ACP a podagenci

Używaj ACP, gdy potrzebujesz zewnętrznego środowiska wykonawczego mechanizmu. Używaj
**natywnego serwera aplikacji Codex** do wiązania konwersacji Codex i sterowania nimi,
gdy plugin `codex` jest włączony. Używaj **podagentów**, gdy potrzebujesz delegowanych
przebiegów natywnych dla OpenClaw.

| Obszar             | Sesja ACP                                  | Przebieg podagenta                         |
| ------------------ | ------------------------------------------ | ------------------------------------------ |
| Środowisko wykonawcze | Plugin backendu ACP (na przykład acpx)   | Natywne środowisko wykonawcze podagenta OpenClaw |
| Klucz sesji        | `agent:<agentId>:acp:<uuid>`               | `agent:<agentId>:subagent:<uuid>`          |
| Główne polecenia   | `/acp ...`                                 | `/subagents ...`                           |
| Narzędzie uruchamiania | `sessions_spawn` z `runtime:"acp"`     | `sessions_spawn` (domyślne środowisko wykonawcze) |

Zobacz także [Podagenci](/pl/tools/subagents).

## Jak ACP uruchamia Claude Code

W przypadku Claude Code przez ACP stos wygląda następująco:

1. Płaszczyzna sterowania sesjami ACP OpenClaw.
2. Oficjalny plugin środowiska wykonawczego `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Mechanizmy środowiska wykonawczego/sesji po stronie Claude.

ACP Claude jest **sesją mechanizmu** z funkcjami sterowania ACP, wznawianiem sesji,
śledzeniem zadań w tle i opcjonalnym powiązaniem z konwersacją/wątkiem.

Backendy CLI są oddzielnymi, lokalnymi, wyłącznie tekstowymi środowiskami wykonawczymi
używanymi awaryjnie — zobacz [Backendy CLI](/pl/gateway/cli-backends).

Dla operatorów praktyczna zasada jest następująca:

- **Potrzebujesz `/acp spawn`, sesji z możliwością wiązania, sterowania środowiskiem wykonawczym lub trwałej pracy mechanizmu?** Użyj ACP.
- **Potrzebujesz prostego lokalnego trybu awaryjnego opartego na tekście przez surowy CLI?** Użyj backendów CLI.

## Powiązane sesje

### Model mentalny

- **Powierzchnia czatu** — miejsce, w którym użytkownicy kontynuują rozmowę (kanał Discord, temat Telegram, czat iMessage).
- **Sesja ACP** — trwały stan środowiska wykonawczego Codex/Claude/Gemini, do którego OpenClaw kieruje ruch.
- **Wątek/temat podrzędny** — opcjonalna dodatkowa powierzchnia komunikacji tworzona wyłącznie przez `--thread ...`.
- **Obszar roboczy środowiska wykonawczego** — lokalizacja w systemie plików (`cwd`, kopia robocza repozytorium, obszar roboczy backendu), w której działa mechanizm. Jest niezależny od powierzchni czatu.

### Powiązania z bieżącą konwersacją

`/acp spawn <harness> --bind here` przypina bieżącą konwersację do
uruchomionej sesji ACP — bez wątku podrzędnego, na tej samej powierzchni czatu. OpenClaw
nadal odpowiada za transport, uwierzytelnianie, bezpieczeństwo i dostarczanie. Kolejne
wiadomości w tej konwersacji są kierowane do tej samej sesji; `/new` i `/reset`
resetują sesję w miejscu; `/acp close` usuwa powiązanie.

Przykłady:

```text
/codex bind                                              # natywne powiązanie Codex, kierowanie tutaj przyszłych wiadomości
/codex model gpt-5.4                                     # dostosowanie powiązanego natywnego wątku Codex
/codex stop                                              # sterowanie aktywną natywną turą Codex
/acp spawn codex --bind here                             # jawny tryb awaryjny ACP dla Codex
/acp spawn codex --thread auto                           # może utworzyć wątek/temat podrzędny i powiązać sesję w nim
/acp spawn codex --bind here --cwd /workspace/repo       # to samo powiązanie czatu, Codex działa w /workspace/repo
```

<AccordionGroup>
  <Accordion title="Reguły powiązań i wyłączność">
    - `--bind here` i `--thread ...` wzajemnie się wykluczają.
    - `--bind here` działa tylko w kanałach, które deklarują obsługę powiązania z bieżącą konwersacją; w przeciwnym razie OpenClaw zwraca jasny komunikat o braku obsługi. Powiązania zachowują się po ponownym uruchomieniu Gateway.
    - W Discord opcja `spawnSessions` kontroluje tworzenie wątków podrzędnych dla `--thread auto|here` — nie dla `--bind here`.
    - Jeśli uruchomisz sesję dla innego agenta ACP bez `--cwd`, OpenClaw domyślnie dziedziczy obszar roboczy **agenta docelowego**. Brakujące odziedziczone ścieżki (`ENOENT`/`ENOTDIR`) powodują użycie domyślnej wartości backendu; inne błędy dostępu (np. `EACCES`) są zgłaszane jako błędy uruchamiania.
    - Polecenia zarządzania Gateway pozostają lokalne w powiązanych konwersacjach — polecenia `/acp ...` są obsługiwane przez OpenClaw nawet wtedy, gdy zwykły tekst dalszej interakcji jest kierowany do powiązanej sesji ACP; `/status` i `/unfocus` również pozostają lokalne, gdy obsługa poleceń jest włączona dla tej powierzchni.

  </Accordion>
  <Accordion title="Sesje powiązane z wątkami">
    Gdy powiązania wątków są włączone dla adaptera kanału:

    - OpenClaw wiąże wątek z docelową sesją ACP.
    - Kolejne wiadomości w tym wątku są kierowane do powiązanej sesji ACP.
    - Dane wyjściowe ACP są dostarczane z powrotem do tego samego wątku.
    - Usunięcie fokusu/zamknięcie/archiwizacja/przekroczenie limitu bezczynności lub maksymalnego wieku usuwa powiązanie.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` i `/unfocus` są poleceniami Gateway, a nie monitami dla mechanizmu ACP.

    Wymagane flagi funkcji dla ACP powiązanego z wątkami:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` jest domyślnie włączone (ustaw `false`, aby wstrzymać automatyczne kierowanie wątków ACP; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają).
    - Uruchamianie sesji wątków przez adapter kanału jest włączone (domyślnie: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Obsługa powiązań wątków zależy od adaptera. Jeśli aktywny adapter kanału
    nie obsługuje powiązań wątków, OpenClaw zwraca jasny komunikat
    o braku obsługi/niedostępności.

  </Accordion>
  <Accordion title="Kanały obsługujące wątki">
    - Dowolny adapter kanału udostępniający możliwość wiązania sesji/wątków.
    - Obecna wbudowana obsługa: wątki/kanały **Discord**, tematy **Telegram** (tematy forum w grupach/supergrupach i tematy wiadomości bezpośrednich).
    - Kanały pluginów mogą dodać obsługę przez ten sam interfejs powiązań.

  </Accordion>
</AccordionGroup>

## Trwałe powiązania kanałów

W przypadku nieulotnych przepływów pracy skonfiguruj trwałe powiązania ACP we wpisach
najwyższego poziomu `bindings[]`.

### Model powiązań

<ParamField path="bindings[].type" type='"acp"'>
  Oznacza trwałe powiązanie konwersacji ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identyfikuje docelową konwersację. Struktury dla poszczególnych kanałów:

- **Kanał/wątek Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kanał/wiadomość bezpośrednia Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Preferuj stabilne identyfikatory Slack; powiązania kanałów obejmują również odpowiedzi w wątkach danego kanału.
- **Temat forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Wiadomość bezpośrednia/grupa WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Dla czatów bezpośrednich używaj numerów E.164, takich jak `+15555550123`, a dla grup identyfikatorów JID grup WhatsApp, takich jak `120363424282127706@g.us`.
- **Wiadomość bezpośrednia/grupa iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Dla stabilnych powiązań grupowych preferuj `chat_id:*`.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Identyfikator agenta OpenClaw będącego właścicielem.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Opcjonalne nadpisanie ACP.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Opcjonalna etykieta przeznaczona dla operatora.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Opcjonalny katalog roboczy środowiska wykonawczego.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Opcjonalne nadpisanie backendu.
</ParamField>

### Domyślne ustawienia środowiska wykonawczego dla poszczególnych agentów

Użyj `agents.list[].runtime`, aby jednokrotnie zdefiniować domyślne ustawienia ACP dla każdego agenta:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (identyfikator mechanizmu, np. `codex` lub `claude`)
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

### Działanie

- OpenClaw zapewnia istnienie skonfigurowanej sesji ACP po dopuszczeniu właściwym dla danego kanału, a przed jej użyciem.
- Wiadomości w tym kanale, temacie lub czacie są kierowane do skonfigurowanej sesji ACP.
- Skonfigurowane powiązania ACP są właścicielami tras swoich sesji. Rozsyłanie transmisji kanału nie zastępuje skonfigurowanej sesji ACP dla pasującego powiązania.
- W powiązanych konwersacjach `/new` i `/reset` resetują w miejscu ten sam klucz sesji ACP.
- Tymczasowe powiązania środowiska uruchomieniowego (na przykład utworzone przez przepływy skupienia na wątku) nadal mają zastosowanie tam, gdzie występują.
- W przypadku uruchamiania ACP między agentami bez jawnego `cwd` OpenClaw dziedziczy przestrzeń roboczą agenta docelowego z konfiguracji agenta.
- Brakujące odziedziczone ścieżki przestrzeni roboczej powodują użycie domyślnego katalogu roboczego backendu; błędy dostępu do istniejących ścieżek są zgłaszane jako błędy uruchomienia.

## Uruchamianie sesji ACP

Sesję ACP można uruchomić na dwa sposoby:

<Tabs>
  <Tab title="Z sessions_spawn">
    Użyj `runtime: "acp"`, aby uruchomić sesję ACP z tury agenta lub wywołania
    narzędzia.

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
    Wartością domyślną `runtime` jest `subagent`, dlatego dla sesji ACP ustaw
    jawnie `runtime: "acp"`. Jeśli pominięto `agentId`, OpenClaw używa
    `acp.defaultAgent`, o ile go skonfigurowano. `mode: "session"` wymaga
    `thread: true`, aby zachować trwałą powiązaną konwersację.
    </Note>

  </Tab>
  <Tab title="Z polecenia /acp">
    Użyj `/acp spawn`, aby jawnie sterować operacją z poziomu czatu.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Najważniejsze flagi:

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
  Dla sesji ACP musi mieć wartość `"acp"`.
</ParamField>
<ParamField path="agentId" type="string">
  Identyfikator docelowego środowiska ACP. Jeśli ustawiono `acp.defaultAgent`,
  zostanie użyty jako wartość zastępcza.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Żąda przepływu powiązania z wątkiem tam, gdzie jest on obsługiwany.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` oznacza wykonanie jednorazowe, a `"session"` — trwałe. Jeśli ustawiono
  `thread: true` i pominięto `mode`, OpenClaw może domyślnie zastosować trwałe
  działanie zależnie od ścieżki środowiska uruchomieniowego. `mode: "session"`
  wymaga `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Żądany katalog roboczy środowiska uruchomieniowego (weryfikowany zgodnie
  z zasadami backendu/środowiska uruchomieniowego). Jeśli go pominięto,
  uruchomienie ACP dziedziczy skonfigurowaną przestrzeń roboczą agenta
  docelowego; brakujące odziedziczone ścieżki powodują użycie wartości
  domyślnych backendu, natomiast rzeczywiste błędy dostępu są zwracane.
</ParamField>
<ParamField path="label" type="string">
  Etykieta widoczna dla operatora, używana w tekście sesji/banera.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Wznawia istniejącą sesję ACP zamiast tworzyć nową. Agent odtwarza historię
  konwersacji za pomocą `session/load`. Wymaga `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` przesyła podsumowania postępu początkowego uruchomienia ACP z
  powrotem do sesji zgłaszającej żądanie jako zdarzenia systemowe.
  Akceptowane odpowiedzi obejmują `streamLogPath` wskazujący dziennik JSONL
  ograniczony do sesji (`<sessionId>.acp-stream.jsonl`), który można śledzić,
  aby uzyskać pełną historię przekazywania. Strumienie postępu sesji
  nadrzędnej domyślnie pokazują komentarze asystenta i postęp stanu ACP,
  chyba że ustawiono `streaming.progress.commentary=false`. Discord również
  domyślnie używa trybu postępu dla podglądów sesji nadrzędnej, gdy nie
  skonfigurowano trybu strumienia. Postęp stanu nadal respektuje
  `acp.stream.tagVisibility`, dlatego znaczniki takie jak `plan` pozostają
  ukryte, chyba że zostaną jawnie włączone.
</ParamField>

Uruchomienia ACP przez `sessions_spawn` używają
`agents.defaults.subagents.runTimeoutSeconds` jako domyślnego limitu czasu
tury podrzędnej. Narzędzie nie przyjmuje nadpisania limitu czasu dla
pojedynczego wywołania (`runTimeoutSeconds`/`timeoutSeconds` są odrzucane
z błędem nakazującym skonfigurowanie wartości domyślnej).

<ParamField path="model" type="string">
  Jawne nadpisanie modelu dla podrzędnej sesji ACP. Uruchomienia Codex ACP
  normalizują odwołania OpenAI, takie jak `openai/gpt-5.4`, do konfiguracji
  startowej Codex ACP przed `session/new`; formy z ukośnikami, takie jak
  `openai/gpt-5.4/high`, ustawiają również intensywność rozumowania Codex ACP.
  Gdy parametr zostanie pominięty,
  `sessions_spawn({ runtime: "acp" })` używa istniejących domyślnych modeli
  podagentów (`agents.defaults.subagents.model` lub
  `agents.list[].subagents.model`), o ile zostały skonfigurowane; w przeciwnym
  razie pozwala środowisku ACP użyć jego własnego modelu domyślnego. Inne
  środowiska muszą udostępniać `models` ACP i obsługiwać `session/set_model`;
  w przeciwnym razie OpenClaw/acpx zgłasza jednoznaczny błąd zamiast po cichu
  używać domyślnego modelu agenta docelowego.
</ParamField>
<ParamField path="thinking" type="string">
  Jawnie określona intensywność myślenia/rozumowania. W przypadku Codex ACP
  `minimal` odpowiada niskiej intensywności, wartości
  `low`/`medium`/`high`/`xhigh` są odwzorowywane bezpośrednio, a `off` pomija
  startowe nadpisanie intensywności rozumowania. Po pominięciu tego parametru
  uruchomienia ACP używają istniejących domyślnych ustawień myślenia
  podagentów oraz właściwego dla modelu ustawienia
  `agents.defaults.models["provider/model"].params.thinking` dla wybranego
  modelu.
</ParamField>

## Tryby powiązania i wątku podczas uruchamiania

<Tabs>
  <Tab title="--bind here|off">
    | Tryb   | Działanie                                                                    |
    | ------ | ---------------------------------------------------------------------------- |
    | `here` | Powiąż w miejscu bieżącą aktywną konwersację; zgłoś błąd, jeśli żadna nie jest aktywna. |
    | `off`  | Nie twórz powiązania z bieżącą konwersacją.                                  |

    Uwagi:

    - `--bind here` to najprostsza ścieżka operatorska służąca do powiązania tego kanału lub czatu z Codex.
    - `--bind here` nie tworzy wątku podrzędnego.
    - `--bind here` jest dostępne tylko w kanałach udostępniających obsługę powiązania z bieżącą konwersacją.
    - `--bind` i `--thread` nie mogą być użyte razem w tym samym wywołaniu `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Tryb   | Działanie                                                                                              |
    | ------ | ------------------------------------------------------------------------------------------------------ |
    | `auto` | W aktywnym wątku: powiąż ten wątek. Poza wątkiem: utwórz/powiąż wątek podrzędny, jeśli jest to obsługiwane. |
    | `here` | Wymagaj bieżącego aktywnego wątku; zgłoś błąd, jeśli operacja nie odbywa się w wątku.                   |
    | `off`  | Bez powiązania. Sesja rozpoczyna się bez powiązania.                                                   |

    Uwagi:

    - Na powierzchniach powiązań nieobsługujących wątków zachowanie domyślne jest w praktyce równoważne `off`.
    - Uruchomienie powiązane z wątkiem wymaga obsługi przez zasady kanału:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Użyj `--bind here`, aby przypiąć bieżącą konwersację bez tworzenia wątku podrzędnego.

  </Tab>
</Tabs>

## Model dostarczania

Sesje ACP mogą pełnić funkcję interaktywnych przestrzeni roboczych albo pracy
w tle należącej do sesji nadrzędnej. Ścieżka dostarczania zależy od tej formy.

<AccordionGroup>
  <Accordion title="Interaktywne sesje ACP">
    Sesje interaktywne służą do kontynuowania rozmowy na widocznej powierzchni czatu:

    - `/acp spawn ... --bind here` wiąże bieżącą konwersację z sesją ACP.
    - `/acp spawn ... --thread ...` wiąże wątek/temat kanału z sesją ACP.
    - Trwałe skonfigurowane wpisy `bindings[].type="acp"` kierują pasujące konwersacje do tej samej sesji ACP.

    Kolejne wiadomości w powiązanej konwersacji są kierowane bezpośrednio do
    sesji ACP, a dane wyjściowe ACP są dostarczane z powrotem do tego samego
    kanału/wątku/tematu.

    Co OpenClaw wysyła do środowiska:

    - Zwykłe powiązane wiadomości uzupełniające są wysyłane jako tekst promptu wraz z załącznikami, ale tylko wtedy, gdy środowisko/backend je obsługuje.
    - Polecenia zarządzające `/acp` oraz lokalne polecenia Gateway są przechwytywane przed przekazaniem do ACP.
    - Zdarzenia ukończenia generowane przez środowisko uruchomieniowe są materializowane osobno dla każdego celu. Agenci OpenClaw otrzymują wewnętrzną kopertę kontekstu środowiska uruchomieniowego OpenClaw; zewnętrzne środowiska ACP otrzymują zwykły prompt z wynikiem procesu podrzędnego i instrukcją. Surowa koperta `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` nigdy nie powinna być wysyłana do zewnętrznych środowisk ani utrwalana jako tekst wypowiedzi użytkownika w transkrypcji ACP.
    - Wpisy transkrypcji ACP używają tekstu wyzwalającego widocznego dla użytkownika albo zwykłego promptu ukończenia. Wewnętrzne metadane zdarzeń pozostają w OpenClaw w postaci ustrukturyzowanej, gdy jest to możliwe, i nie są traktowane jako treść czatu utworzona przez użytkownika.

  </Accordion>
  <Accordion title="Jednorazowe sesje ACP należące do sesji nadrzędnej">
    Jednorazowe sesje ACP uruchamiane przez innego agenta są procesami
    podrzędnymi działającymi w tle, podobnie jak podagenci:

    - Sesja nadrzędna zleca pracę za pomocą `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Proces podrzędny działa we własnej sesji środowiska ACP.
    - Tury procesu podrzędnego działają na tej samej ścieżce zadań w tle, której używają natywne uruchomienia podagentów, dzięki czemu powolne środowisko ACP nie blokuje niezwiązanej pracy sesji głównej.
    - Ukończenie jest zgłaszane przez ścieżkę powiadamiania o ukończeniu zadania. OpenClaw przekształca wewnętrzne metadane ukończenia w zwykły prompt ACP przed wysłaniem go do zewnętrznego środowiska, dzięki czemu środowiska nie widzą znaczników kontekstu środowiska uruchomieniowego właściwych wyłącznie dla OpenClaw.
    - Sesja nadrzędna przepisuje wynik procesu podrzędnego zwykłym głosem asystenta, gdy przydatna jest odpowiedź przeznaczona dla użytkownika.

    **Nie** traktuj tej ścieżki jako czatu równorzędnego między sesją nadrzędną
    a procesem podrzędnym. Proces podrzędny ma już kanał zgłaszania ukończenia
    do sesji nadrzędnej.

  </Accordion>
  <Accordion title="sessions_send i dostarczanie A2A">
    Po uruchomieniu `sessions_send` może wskazywać inną sesję. W przypadku
    zwykłych sesji równorzędnych OpenClaw po wstrzyknięciu wiadomości używa
    ścieżki kolejnej wiadomości agent-agent (A2A):

    - Poczekaj na odpowiedź sesji docelowej.
    - Opcjonalnie pozwól sesji zgłaszającej żądanie i sesji docelowej wymienić ograniczoną liczbę kolejnych tur.
    - Poproś sesję docelową o utworzenie komunikatu ogłoszenia.
    - Dostarcz to ogłoszenie do widocznego kanału lub wątku.

    Ta ścieżka A2A jest rozwiązaniem rezerwowym dla wysyłania między równorzędnymi sesjami, gdy nadawca potrzebuje
    widocznej odpowiedzi uzupełniającej. Pozostaje włączona, gdy niepowiązana sesja może zobaczyć
    cel ACP i wysłać do niego wiadomość, na przykład przy szerokich ustawieniach
    `tools.sessions.visibility`.

    OpenClaw pomija odpowiedź uzupełniającą A2A tylko wtedy, gdy żądający jest rodzicem
    własnego, jednorazowego elementu podrzędnego ACP należącego do rodzica. W takim przypadku uruchomienie A2A
    po ukończeniu zadania może wznowić rodzica z wynikiem elementu podrzędnego, przekazać
    odpowiedź rodzica z powrotem do elementu podrzędnego i utworzyć pętlę echa
    rodzic/element podrzędny. Wynik `sessions_send` zgłasza `delivery.status="skipped"` dla
    tego przypadku własnego elementu podrzędnego, ponieważ za wynik odpowiada już
    ścieżka ukończenia.

  </Accordion>
  <Accordion title="Wznawianie istniejącej sesji">
    Użyj `resumeSessionId`, aby kontynuować poprzednią sesję ACP zamiast
    rozpoczynać nową. Agent odtwarza historię konwersacji za pomocą
    `session/load`, dzięki czemu podejmuje pracę z pełnym kontekstem wcześniejszych działań.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Typowe zastosowania:

    - Przekazanie sesji Codex z laptopa na telefon — poleć agentowi kontynuować od miejsca, w którym przerwano.
    - Kontynuowanie sesji programistycznej rozpoczętej interaktywnie w CLI, teraz bez interfejsu za pośrednictwem agenta.
    - Wznowienie pracy przerwanej przez ponowne uruchomienie Gateway lub limit czasu bezczynności.

    Uwagi:

    - `resumeSessionId` ma zastosowanie tylko przy `runtime: "acp"`; domyślne środowisko uruchomieniowe podagenta ignoruje to pole przeznaczone wyłącznie dla ACP.
    - `streamTo` ma zastosowanie tylko przy `runtime: "acp"`; domyślne środowisko uruchomieniowe podagenta ignoruje to pole przeznaczone wyłącznie dla ACP.
    - `resumeSessionId` jest lokalnym dla hosta identyfikatorem wznowienia ACP/harness, a nie kluczem sesji kanału OpenClaw; przed przekazaniem OpenClaw nadal sprawdza zasady uruchamiania ACP i zasady agenta docelowego, natomiast backend ACP lub harness odpowiada za autoryzację wczytania tego nadrzędnego identyfikatora.
    - `resumeSessionId` przywraca nadrzędną historię konwersacji ACP; `thread` i `mode` nadal działają normalnie dla tworzonej nowej sesji OpenClaw, dlatego `mode: "session"` wciąż wymaga `thread: true`.
    - Agent docelowy musi obsługiwać `session/load` (Codex i Claude Code obsługują).
    - Jeśli identyfikator sesji nie zostanie znaleziony, uruchomienie kończy się czytelnym błędem — bez cichego przejścia do nowej sesji.

  </Accordion>
  <Accordion title="Test dymny po wdrożeniu">
    Po wdrożeniu Gateway przeprowadź rzeczywisty test kompleksowy zamiast polegać
    na testach jednostkowych:

    1. Zweryfikuj wersję i commit wdrożonego Gateway na hoście docelowym.
    2. Otwórz tymczasową sesję pomostową ACPX z działającym agentem.
    3. Poproś tego agenta o wywołanie `sessions_spawn` z `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` i zadaniem `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Zweryfikuj `accepted=yes`, rzeczywisty `childSessionKey` i brak błędu walidatora.
    5. Usuń tymczasową sesję pomostową.

    Ogranicz ten test do `mode: "run"` i pomiń `streamTo: "parent"` —
    powiązany z wątkiem tryb `mode: "session"` oraz ścieżki przekazywania strumienia stanowią oddzielne, bardziej rozbudowane
    testy integracyjne.

  </Accordion>
</AccordionGroup>

## Zgodność z piaskownicą

Sesje ACP działają obecnie w środowisku uruchomieniowym hosta, **nie** wewnątrz
piaskownicy OpenClaw.

<Warning>
**Granica bezpieczeństwa:**

- Zewnętrzny harness może odczytywać i zapisywać dane zgodnie z własnymi uprawnieniami CLI oraz wybranym `cwd`.
- Zasady piaskownicy OpenClaw **nie** obejmują wykonywania harness ACP.
- OpenClaw nadal egzekwuje bramki funkcji ACP, listę dozwolonych agentów, własność sesji, powiązania kanałów oraz zasady dostarczania Gateway.
- Użyj `runtime: "subagent"` do natywnych zadań OpenClaw objętych egzekwowaniem piaskownicy.

</Warning>

Bieżące ograniczenia:

- Jeśli sesja żądającego działa w piaskownicy, uruchamianie ACP jest blokowane zarówno dla `sessions_spawn({ runtime: "acp" })`, jak i `/acp spawn`.
- `sessions_spawn` z `runtime: "acp"` nie obsługuje `sandbox: "require"`.

## Rozpoznawanie celu sesji

Większość działań `/acp` przyjmuje opcjonalny cel sesji (`session-key`,
`session-id` lub `session-label`).

**Kolejność rozpoznawania:**

1. Jawny argument celu (lub `--session` dla `/acp steer`)
   - najpierw próbuje klucza
   - następnie identyfikatora sesji w formacie UUID
   - następnie etykiety
2. Bieżące powiązanie wątku (jeśli ta konwersacja lub ten wątek jest powiązany z sesją ACP).
3. Powrót do bieżącej sesji żądającego.

W kroku 2 uwzględniane są zarówno powiązania bieżącej konwersacji, jak i powiązania wątku.

Jeśli nie uda się rozpoznać żadnego celu, OpenClaw zwraca czytelny błąd
(`Unable to resolve session target: ...`).

## Elementy sterujące ACP

| Polecenie            | Działanie                                                  | Przykład                                                       |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| `/acp spawn`         | Tworzy sesję ACP; opcjonalne powiązanie bieżące lub z wątkiem. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Anuluje trwającą turę sesji docelowej.                     | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Wysyła instrukcję sterującą do działającej sesji.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Zamyka sesję i usuwa powiązania celów wątku.               | `/acp close`                                                  |
| `/acp status`        | Wyświetla backend, tryb, stan, opcje środowiska uruchomieniowego i możliwości. | `/acp status`                                                 |
| `/acp set-mode`      | Ustawia tryb środowiska uruchomieniowego sesji docelowej.  | `/acp set-mode plan`                                          |
| `/acp set`           | Zapisuje ogólną opcję konfiguracji środowiska uruchomieniowego. | `/acp set model openai/gpt-5.4`                            |
| `/acp cwd`           | Ustawia nadpisanie katalogu roboczego środowiska uruchomieniowego. | `/acp cwd /Users/user/Projects/repo`                       |
| `/acp permissions`   | Ustawia profil zasad zatwierdzania.                        | `/acp permissions strict`                                    |
| `/acp timeout`       | Ustawia limit czasu środowiska uruchomieniowego (w sekundach). | `/acp timeout 120`                                         |
| `/acp model`         | Ustawia nadpisanie modelu środowiska uruchomieniowego.     | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Usuwa nadpisania opcji środowiska uruchomieniowego sesji.  | `/acp reset-options`                                         |
| `/acp sessions`      | Wyświetla ostatnie sesje ACP z magazynu.                   | `/acp sessions`                                              |
| `/acp doctor`        | Wyświetla stan backendu, możliwości i możliwe do wykonania poprawki. | `/acp doctor`                                          |
| `/acp install`       | Wyświetla deterministyczne kroki instalacji i włączania.   | `/acp install`                                               |

Elementy sterujące środowiskiem uruchomieniowym (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` i `reset-options`) wymagają
tożsamości właściciela w kanałach zewnętrznych oraz `operator.admin` od wewnętrznych
klientów Gateway. Autoryzowani nadawcy niebędący właścicielami nadal mogą używać `sessions`,
`doctor`, `install` i `help`.

`/acp status` wyświetla obowiązujące opcje środowiska uruchomieniowego oraz identyfikatory sesji
na poziomie środowiska uruchomieniowego i backendu. Błędy nieobsługiwanych elementów sterujących są
wyraźnie zgłaszane, gdy backend nie ma danej możliwości. `/acp sessions` odczytuje magazyn
dla bieżącej powiązanej sesji lub sesji żądającego; tokeny celu (`session-key`,
`session-id` lub `session-label`) są rozpoznawane przez mechanizm wykrywania sesji Gateway,
w tym niestandardowe katalogi główne `session.store` dla poszczególnych agentów.

### Mapowanie opcji środowiska uruchomieniowego

`/acp` udostępnia polecenia skrótowe i ogólny mechanizm ustawiania. Równoważne operacje:

| Polecenie                    | Mapowanie                             | Uwagi                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | klucz konfiguracji środowiska uruchomieniowego `model` | W przypadku ACP Codex OpenClaw normalizuje `openai/<model>` do identyfikatora modelu adaptera i mapuje sufiksy poziomu rozumowania po ukośniku, takie jak `openai/gpt-5.4/high`, na `reasoning_effort`. |
| `/acp set thinking <level>`  | kanoniczna opcja `thinking`           | OpenClaw wysyła odpowiednik ogłaszany przez backend, jeśli jest dostępny, preferując kolejno `thinking`, `effort`, `reasoning_effort` lub `thought_level`. W przypadku ACP Codex adapter mapuje wartości na `reasoning_effort`. |
| `/acp permissions <profile>` | kanoniczna opcja `permissionProfile`  | OpenClaw wysyła odpowiednik ogłaszany przez backend, jeśli jest dostępny, na przykład `approval_policy`, `permission_profile`, `permissions` lub `permission_mode`. |
| `/acp timeout <seconds>`     | kanoniczna opcja `timeoutSeconds`     | OpenClaw wysyła odpowiednik ogłaszany przez backend, jeśli jest dostępny, na przykład `timeout` lub `timeout_seconds`. |
| `/acp cwd <path>`            | nadpisanie katalogu roboczego środowiska uruchomieniowego | Aktualizacja bezpośrednia. |
| `/acp set <key> <value>`     | ogólne                                | `key=cwd` korzysta ze ścieżki nadpisania katalogu roboczego. |
| `/acp reset-options`         | usuwa wszystkie nadpisania środowiska uruchomieniowego | - |

## Harness acpx, konfiguracja pluginu i uprawnienia

Informacje o konfiguracji harness acpx (aliasach Claude Code / Codex / Gemini CLI),
mostach MCP plugin-tools i OpenClaw-tools oraz trybach uprawnień ACP
znajdziesz w sekcji [Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup).

## Rozwiązywanie problemów

| Objaw                                                                                    | Prawdopodobna przyczyna                                                                                                 | Rozwiązanie                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | Plugin zaplecza nie jest zainstalowany, jest wyłączony lub blokowany przez `plugins.allow`.                            | Zainstaluj i włącz Plugin zaplecza, dodaj `acpx` do `plugins.allow`, jeśli ta lista dozwolonych elementów jest ustawiona, a następnie uruchom `/acp doctor`.                                                  |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP jest globalnie wyłączone.                                                                                          | Ustaw `acp.enabled=true`.                                                                                                                                                                                    |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Automatyczne przekazywanie zwykłych wiadomości z wątków jest wyłączone.                                                | Ustaw `acp.dispatch.enabled=true`, aby wznowić automatyczne kierowanie wątków; jawne wywołania `sessions_spawn({ runtime: "acp" })` nadal działają.                                                           |
| `ACP agent "<id>" is not allowed by policy`                                               | Agent nie znajduje się na liście dozwolonych agentów.                                                                 | Użyj dozwolonego `agentId` lub zaktualizuj `acp.allowedAgents`.                                                                                                                                              |
| `/acp doctor` reports backend not ready right after startup                               | Plugin zaplecza nie jest zainstalowany, jest wyłączony, blokowany przez reguły zezwalania/odmawiania albo jego skonfigurowany plik wykonywalny jest niedostępny. | Zainstaluj lub włącz Plugin zaplecza, ponownie uruchom `/acp doctor`, a jeśli nadal zgłasza problemy, sprawdź błąd instalacji zaplecza lub reguł.                                                             |
| Nie znaleziono polecenia uprzęży                                                         | CLI adaptera nie jest zainstalowane, brakuje zewnętrznego Pluginu albo podczas pierwszego uruchomienia nie powiodło się pobieranie przez `npx` dla adaptera innego niż Codex. | Uruchom `/acp doctor`, zainstaluj lub wstępnie przygotuj adapter na hoście Gateway albo jawnie skonfiguruj polecenie agenta acpx.                                                                            |
| Uprząż zgłasza, że nie znaleziono modelu                                                 | Identyfikator modelu jest prawidłowy dla innego dostawcy lub innej uprzęży, ale nie dla tego celu ACP.                 | Użyj modelu wymienionego przez tę uprząż, skonfiguruj model w uprzęży albo pomiń nadpisanie.                                                                                                                  |
| Uprząż zgłasza błąd uwierzytelniania dostawcy                                            | OpenClaw działa prawidłowo, ale docelowe CLI lub dostawca nie jest zalogowany.                                         | Zaloguj się lub podaj wymagany klucz dostawcy w środowisku hosta Gateway.                                                                                                                                    |
| `Unable to resolve session target: ...`                                                   | Nieprawidłowy token klucza, identyfikatora lub etykiety.                                                               | Uruchom `/acp sessions`, skopiuj dokładny klucz lub etykietę i spróbuj ponownie.                                                                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation`               | Użyto `--bind here` bez aktywnej rozmowy umożliwiającej powiązanie.                                                     | Przejdź do docelowego czatu lub kanału i spróbuj ponownie albo utwórz sesję bez powiązania.                                                                                                                   |
| `Conversation bindings are unavailable for <channel>.`                                    | Adapter nie obsługuje obecnie powiązań ACP z rozmową.                                                                  | Użyj `/acp spawn ... --thread ...`, jeśli jest obsługiwane, skonfiguruj `bindings[]` najwyższego poziomu albo przejdź na obsługiwany kanał.                                                                   |
| `--thread here requires running /acp spawn inside an active ... thread`                   | Użyto `--thread here` poza kontekstem wątku.                                                                           | Przejdź do docelowego wątku albo użyj `--thread auto`/`off`.                                                                                                                                                 |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Inny użytkownik jest właścicielem aktywnego celu powiązania.                                                           | Ponownie powiąż jako właściciel albo użyj innej rozmowy lub innego wątku.                                                                                                                                    |
| `Thread bindings are unavailable for <channel>.`                                          | Adapter nie obsługuje powiązań wątków.                                                                                 | Użyj `--thread off` albo przejdź do obsługiwanego adaptera lub kanału.                                                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Środowisko wykonawcze ACP działa po stronie hosta, a sesja żądająca działa w piaskownicy.                              | W sesjach działających w piaskownicy użyj `runtime="subagent"` albo utwórz sesję ACP z sesji niedziałającej w piaskownicy.                                                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | Zażądano `sandbox="require"` dla środowiska wykonawczego ACP.                                                          | Jeśli piaskownica jest wymagana, użyj `runtime="subagent"`, albo użyj ACP z `sandbox="inherit"` w sesji niedziałającej w piaskownicy.                                                                         |
| `Cannot apply --model ... did not advertise model support`                                | Docelowa uprząż nie udostępnia ogólnego przełączania modeli ACP.                                                       | Użyj uprzęży deklarującej obsługę ACP `models`/`session/set_model`, użyj odwołań do modeli Codex ACP albo skonfiguruj model bezpośrednio w uprzęży, jeśli ma własną flagę uruchomieniową.                       |
| Brak metadanych ACP dla powiązanej sesji                                                 | Nieaktualne lub usunięte metadane sesji ACP.                                                                           | Utwórz ją ponownie za pomocą `/acp spawn`, a następnie ponownie powiąż wątek lub ustaw na nim fokus.                                                                                                          |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` blokuje zapis lub wykonywanie w nieinteraktywnej sesji ACP.                                           | Ustaw `plugins.entries.acpx.config.permissionMode` na `approve-all` i uruchom ponownie Gateway. Zobacz [Konfiguracja uprawnień](/pl/tools/acp-agents-setup#permission-configuration).                            |
| Sesja ACP szybko kończy się niepowodzeniem i zwraca niewiele danych wyjściowych           | Monity o uprawnienia są blokowane przez `permissionMode`/`nonInteractivePermissions`.                                  | Sprawdź dzienniki Gateway pod kątem `AcpRuntimeError`. Aby przyznać pełne uprawnienia, ustaw `permissionMode=approve-all`; aby zapewnić łagodne ograniczenie funkcjonalności, ustaw `nonInteractivePermissions=deny`. |
| Sesja ACP zawiesza się bezterminowo po zakończeniu pracy                                  | Proces uprzęży zakończył się, ale sesja ACP nie zgłosiła ukończenia.                                                   | Zaktualizuj OpenClaw; bieżący mechanizm czyszczenia acpx kończy nieaktualne procesy opakowujące i procesy adapterów należące do OpenClaw podczas zamykania i uruchamiania Gateway.                            |
| Uprząż widzi `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | Wewnętrzna otoczka zdarzenia wyciekła przez granicę ACP.                                                               | Zaktualizuj OpenClaw i ponownie uruchom przepływ ukończenia; zewnętrzne uprzęże powinny otrzymywać wyłącznie zwykłe monity ukończenia.                                                                         |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` dotyczy
natywnego przekaźnika punktów zaczepienia Codex, a nie ACP/acpx. W powiązanym
czacie Codex rozpocznij nową sesję za pomocą `/new` lub `/reset`; jeśli zadziała
to raz, a następnie błąd powróci przy kolejnym natywnym wywołaniu narzędzia,
uruchom ponownie serwer aplikacji Codex lub Gateway OpenClaw zamiast powtarzać
`/new`. Zobacz
[Rozwiązywanie problemów z uprzężą Codex](/pl/plugins/codex-harness#troubleshooting).
</Note>

## Powiązane

- [Agenci ACP — konfiguracja](/pl/tools/acp-agents-setup)
- [Wysyłanie przez agenta](/pl/tools/agent-send)
- [Zaplecza CLI](/pl/gateway/cli-backends)
- [Uprząż Codex](/pl/plugins/codex-harness)
- [Środowisko wykonawcze uprzęży Codex](/pl/plugins/codex-harness-runtime)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (tryb mostu)](/pl/cli/acp)
- [Podagenci](/pl/tools/subagents)
