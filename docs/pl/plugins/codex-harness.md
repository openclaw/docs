---
read_when:
    - Chcesz użyć dołączonego środowiska app-server Codex
    - Potrzebujesz przykładów konfiguracji środowiska uruchomieniowego Codex
    - Chcesz, aby wdrożenia wyłącznie z Codexem kończyły się błędem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pośrednictwem dołączonego mechanizmu app-server Codex
title: Środowisko Codex
x-i18n:
    generated_at: "2026-05-01T10:01:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

Pakietowy Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
serwer aplikacji Codex zamiast wbudowanego mechanizmu PI.

Użyj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
wykrywaniem modeli, natywnym wznawianiem wątków, natywną Compaction oraz
wykonywaniem przez serwer aplikacji. OpenClaw nadal zarządza kanałami czatu,
plikami sesji, wyborem modelu, narzędziami, zatwierdzeniami, dostarczaniem
multimediów oraz widocznym lustrem transkrypcji.

Jeśli próbujesz się zorientować, zacznij od
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes). Krótka wersja:
`openai/gpt-5.5` to referencja modelu, `codex` to runtime, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Aby używać mechanizmu Codex dla tur agenta GPT, pozostaw kanoniczną referencję
modelu jako `openai/gpt-*`, włącz pakietowy Plugin `codex` i ustaw
`agentRuntime.id: "codex"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Jeśli Twoja konfiguracja używa `plugins.allow`, dodaj tam także `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Nie używaj `openai-codex/gpt-*` dla tej ścieżki. To wybiera Codex OAuth przez
normalny runner PI, chyba że osobno wymusisz runtime. Zmiany konfiguracji
stosują się do nowych lub zresetowanych sesji; istniejące sesje zachowują
zapisany runtime.

## Co zmienia ten Plugin

Pakietowy Plugin `codex` wnosi kilka osobnych możliwości:

| Możliwość                         | Jak jej używasz                                      | Co robi                                                                        |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Natywny osadzony runtime          | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez serwer aplikacji Codex.          |
| Natywne polecenia kontroli czatu  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże i kontroluje wątki serwera aplikacji Codex z rozmowy w komunikatorze.    |
| Dostawca/katalog serwera aplikacji Codex | elementy wewnętrzne `codex`, udostępniane przez mechanizm | Pozwala runtime wykrywać i walidować modele serwera aplikacji.                 |
| Ścieżka rozumienia mediów Codex   | ścieżki zgodności modeli obrazów `codex/*`          | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywne przekazywanie hooków      | Hooki Plugin wokół natywnych zdarzeń Codex          | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie Plugin udostępnia te możliwości. Nie powoduje to:

- rozpoczęcia używania Codex dla każdego modelu OpenAI
- konwersji referencji modeli `openai-codex/*` na natywny runtime
- ustawienia ACP/acpx jako domyślnej ścieżki Codex
- przełączania na gorąco istniejących sesji, które już zapisały runtime PI
- zastąpienia dostarczania przez kanały OpenClaw, plików sesji, magazynu profili uwierzytelniania ani
  routingu wiadomości

Ten sam Plugin zarządza także natywną powierzchnią poleceń kontroli czatu
`/codex`. Jeśli Plugin jest włączony, a użytkownik prosi o powiązanie,
wznowienie, sterowanie, zatrzymanie lub sprawdzenie wątków Codex z czatu,
agenci powinni preferować `/codex ...` zamiast ACP. ACP pozostaje wyraźnym
wariantem zapasowym, gdy użytkownik prosi o ACP/acpx lub testuje adapter ACP
Codex.

Natywne tury Codex zachowują hooki Plugin OpenClaw jako publiczną warstwę
zgodności. Są to hooki OpenClaw działające w procesie, a nie hooki poleceń
Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkrypcji
- `before_agent_finalize` przez przekazanie Codex `Stop`
- `agent_end`

Pluginy mogą także rejestrować neutralne względem runtime middleware wyników
narzędzi, aby przepisywać dynamiczne wyniki narzędzi OpenClaw po wykonaniu
narzędzia przez OpenClaw i przed zwróceniem wyniku do Codex. Jest to osobne od
publicznego hooka Plugin `tool_result_persist`, który przekształca zapisy
wyników narzędzi w transkrypcji należącej do OpenClaw.

Semantykę samych hooków Plugin opisują [Hooki Plugin](/pl/plugins/hooks)
oraz [Zachowanie strażnika Plugin](/pl/tools/plugin).

Mechanizm jest domyślnie wyłączony. Nowe konfiguracje powinny pozostawiać
referencje modeli OpenAI w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`, gdy mają
używać natywnego wykonywania przez serwer aplikacji. Starsze referencje modeli
`codex/*` nadal automatycznie wybierają ten mechanizm dla zgodności, ale
starsze prefiksy dostawców oparte na runtime nie są pokazywane jako zwykłe
wybory modelu/dostawcy.

Jeśli Plugin `codex` jest włączony, ale model podstawowy nadal ma postać
`openai-codex/*`, `openclaw doctor` ostrzega zamiast zmieniać trasę. To celowe:
`openai-codex/*` pozostaje ścieżką Codex OAuth/subskrypcji przez PI, a natywne
wykonywanie przez serwer aplikacji pozostaje jawnym wyborem runtime.

## Mapa tras

Użyj tej tabeli przed zmianą konfiguracji:

| Oczekiwane zachowanie                         | Referencja modelu         | Konfiguracja runtime                  | Wymaganie Plugin            | Oczekiwana etykieta statusu    |
| --------------------------------------------- | ------------------------- | ------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API przez normalny runner OpenClaw     | `openai/gpt-*`            | pominięte albo `runtime: "pi"`        | dostawca OpenAI             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/subskrypcja przez PI              | `openai-codex/gpt-*`      | pominięte albo `runtime: "pi"`        | dostawca OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Natywne osadzone tury serwera aplikacji Codex | `openai/gpt-*`            | `agentRuntime.id: "codex"`            | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Mieszani dostawcy z zachowawczym trybem auto  | referencje właściwe dla dostawcy | `agentRuntime.id: "auto"`       | opcjonalne runtime Plugin   | zależy od wybranego runtime    |
| Jawna sesja adaptera Codex ACP                | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"` | sprawny backend `acpx`      | status zadania/sesji ACP       |

Ważne rozróżnienie dotyczy dostawcy i runtime:

- `openai-codex/*` odpowiada na pytanie „której trasy dostawcy/uwierzytelniania ma użyć PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla ma wykonać tę
  osadzoną turę?”
- `/codex ...` odpowiada na pytanie „którą natywną konwersację Codex ten czat ma
  powiązać lub kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces mechanizmu ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Trasy z rodziny OpenAI są zależne od prefiksu. Użyj `openai-codex/*`, gdy chcesz
Codex OAuth przez PI; użyj `openai/*`, gdy chcesz bezpośredniego dostępu do
OpenAI API albo gdy wymuszasz natywny mechanizm serwera aplikacji Codex:

| Referencja modelu                             | Ścieżka runtime                              | Użyj, gdy                                                                  |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | dostawca OpenAI przez instalację OpenClaw/PI | Chcesz bieżący bezpośredni dostęp do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth przez OpenClaw/PI         | Chcesz uwierzytelnianie subskrypcją ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | mechanizm serwera aplikacji Codex            | Chcesz natywne wykonywanie przez serwer aplikacji Codex dla osadzonej tury agenta. |

GPT-5.5 jest obecnie w OpenClaw dostępny tylko przez subskrypcję/OAuth. Użyj
`openai-codex/gpt-5.5` dla PI OAuth albo `openai/gpt-5.5` z mechanizmem serwera
aplikacji Codex. Bezpośredni dostęp kluczem API do `openai/gpt-5.5` jest
obsługiwany, gdy OpenAI włączy GPT-5.5 w publicznym API.

Starsze referencje `codex/gpt-*` pozostają akceptowane jako aliasy zgodności.
Migracja zgodności Doctor przepisuje starsze podstawowe referencje runtime na
kanoniczne referencje modeli i zapisuje politykę runtime osobno, natomiast
starsze referencje wyłącznie fallback pozostają bez zmian, ponieważ runtime
jest konfigurowany dla całego kontenera agenta. Nowe konfiguracje PI Codex OAuth
powinny używać `openai-codex/gpt-*`; nowe konfiguracje natywnego mechanizmu
serwera aplikacji powinny używać `openai/gpt-*` oraz
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy
OpenAI Codex OAuth. Użyj `codex/gpt-*`, gdy rozumienie obrazów ma działać przez
ograniczoną turę serwera aplikacji Codex. Model serwera aplikacji Codex musi
deklarować obsługę wejścia obrazowego; modele Codex tylko tekstowe kończą się
niepowodzeniem przed rozpoczęciem tury multimedialnej.

Użyj `/status`, aby potwierdzić efektywny mechanizm dla bieżącej sesji. Jeśli
wybór jest zaskakujący, włącz logowanie debug dla podsystemu `agents/harness`
i sprawdź ustrukturyzowany rekord bramy `agent harness selected`. Zawiera on
identyfikator wybranego mechanizmu, powód wyboru, politykę runtime/fallback oraz,
w trybie `auto`, wynik obsługi każdego kandydata Plugin.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy wszystkie te warunki są spełnione:

- pakietowy Plugin `codex` jest włączony lub dozwolony
- podstawowy model agenta to `openai-codex/*`
- efektywny runtime tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „włączony
Plugin Codex” oznacza „natywny runtime serwera aplikacji Codex”. OpenClaw nie
wykonuje takiego przeskoku. Ostrzeżenie oznacza:

- **Nie trzeba nic zmieniać**, jeśli zamierzałeś używać ChatGPT/Codex OAuth przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamierzałeś używać natywnego wykonywania
  przez serwer aplikacji.
- Istniejące sesje nadal wymagają `/new` lub `/reset` po zmianie runtime,
  ponieważ przypięcia runtime sesji są trwałe.

Wybór mechanizmu nie jest kontrolką sesji na żywo. Gdy uruchamiana jest tura
osadzona, OpenClaw zapisuje identyfikator wybranego mechanizmu w tej sesji i
używa go dalej dla kolejnych tur w tym samym identyfikatorze sesji. Zmień
konfigurację `agentRuntime` albo `OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby
przyszłe sesje używały innego mechanizmu; użyj `/new` lub `/reset`, aby rozpocząć
świeżą sesję przed przełączeniem istniejącej rozmowy między PI i Codex. Pozwala
to uniknąć odtwarzania jednej transkrypcji przez dwa niezgodne natywne systemy
sesji.

Starsze sesje utworzone przed przypięciami mechanizmu są traktowane jako
przypięte do PI, gdy mają już historię transkrypcji. Użyj `/new` lub `/reset`,
aby włączyć Codex dla tej rozmowy po zmianie konfiguracji.

`/status` pokazuje efektywny runtime modelu. Domyślny mechanizm PI pojawia się
jako `Runtime: OpenClaw Pi Default`, a mechanizm serwera aplikacji Codex jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym pakietowym Plugin `codex`.
- Serwer aplikacji Codex `0.125.0` lub nowszy. Pakietowy Plugin domyślnie
  zarządza zgodnym binarium serwera aplikacji Codex, więc lokalne polecenia
  `codex` w `PATH` nie wpływają na normalne uruchamianie mechanizmu.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji albo dla mostka
  uwierzytelniania Codex w OpenClaw. Lokalne uruchomienia serwera aplikacji
  przez stdio używają zarządzanego przez OpenClaw katalogu domowego Codex dla
  każdego agenta oraz izolowanego procesu potomnego `HOME`, więc domyślnie nie
  odczytują Twojego osobistego konta `~/.codex`, Skills, pluginów,
  konfiguracji, stanu wątków ani natywnych `$HOME/.agents/skills`.

Plugin blokuje starsze lub niewersjonowane uzgodnienia z serwerem aplikacji.
Dzięki temu OpenClaw pozostaje na powierzchni protokołu, wobec której był
testowany.

W testach smoke na żywo i w Dockerze uwierzytelnianie zwykle pochodzi z konta
Codex CLI albo z profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne
uruchomienia serwera aplikacji przez stdio mogą także przejść awaryjnie na
`CODEX_API_KEY` / `OPENAI_API_KEY`, gdy konto nie jest dostępne.

## Dodaj Codex obok innych modeli

Nie ustawiaj `agentRuntime.id: "codex"` globalnie, jeśli ten sam agent powinien swobodnie przełączać się
między Codex a modelami dostawców innych niż Codex. Wymuszone środowisko uruchomieniowe dotyczy każdej
osadzonej tury tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy
to środowisko uruchomieniowe jest wymuszone, OpenClaw nadal próbuje użyć harnessu Codex i kończy się
kontrolowanym błędem, zamiast po cichu kierować tę turę przez PI.

Zamiast tego użyj jednej z tych struktur:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta na `agentRuntime.id: "auto"` i fallback PI dla normalnego mieszanego
  użycia dostawców.
- Używaj starszych odwołań `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` oraz jawną politykę środowiska uruchomieniowego Codex.

Na przykład ta konfiguracja pozostawia domyślnego agenta na normalnym automatycznym wyborze i
dodaje osobnego agenta Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Przy tej strukturze:

- Domyślny agent `main` używa normalnej ścieżki dostawcy i fallbacku zgodności PI.
- Agent `codex` używa harnessu serwera aplikacyjnego Codex.
- Jeśli Codex jest niedostępny lub nieobsługiwany dla agenta `codex`, tura kończy się
  błędem zamiast cicho używać PI.

## Routing poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, a nie wyłącznie według słowa „Codex”:

| Użytkownik prosi o...                                    | Agent powinien użyć...                           |
| -------------------------------------------------------- | ------------------------------------------------ |
| „Powiąż ten czat z Codex”                                | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                         | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                      | `/codex threads`                                 |
| „Zgłoś raport wsparcia dla nieudanego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij feedback Codex tylko dla tego załączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj Codex jako środowiska uruchomieniowego tego agenta” | zmiana konfiguracji na `agentRuntime.id`         |
| „Użyj mojej subskrypcji ChatGPT/Codex ze zwykłym OpenClaw” | odwołania modeli `openai-codex/*`                |
| „Uruchom Codex przez ACP/acpx”                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”     | ACP/acpx, nie `/codex` i nie natywni subagenci   |

OpenClaw reklamuje agentom wskazówki dotyczące uruchamiania ACP tylko wtedy, gdy ACP jest włączone,
możliwe do dispatchowania i obsługiwane przez załadowany backend środowiska uruchomieniowego. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills Pluginu nie powinny uczyć agenta routingu
ACP.

## Wdrożenia tylko z Codex

Wymuś harness Codex, gdy musisz udowodnić, że każda osadzona tura agenta
używa Codex. Jawne środowiska uruchomieniowe Pluginów domyślnie nie mają fallbacku PI, więc
`fallback: "none"` jest opcjonalne, ale często przydatne jako dokumentacja:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Nadpisanie przez środowisko:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Gdy Codex jest wymuszony, OpenClaw wcześnie kończy się błędem, jeśli Plugin Codex jest wyłączony,
serwer aplikacyjny jest zbyt stary albo serwer aplikacyjny nie może się uruchomić. Ustaw
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` tylko wtedy, gdy celowo chcesz, aby PI obsługiwał
brak wyboru harnessu.

## Codex dla poszczególnych agentów

Możesz sprawić, że jeden agent będzie używał wyłącznie Codex, podczas gdy domyślny agent zachowa normalny
automatyczny wybór:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Używaj normalnych poleceń sesji do przełączania agentów i modeli. `/new` tworzy świeżą
sesję OpenClaw, a harness Codex tworzy lub wznawia swój poboczny wątek serwera aplikacyjnego
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnej turze ponownie rozwiązać harness z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacyjny o dostępne modele. Jeśli
wykrywanie nie powiedzie się lub przekroczy limit czasu, używa wbudowanego katalogu fallback dla:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Możesz dostroić wykrywanie pod `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i trzymało się
katalogu fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Połączenie z serwerem aplikacyjnym i polityka

Domyślnie Plugin uruchamia lokalnie zarządzany plik binarny Codex OpenClaw za pomocą:

```bash
codex app-server --listen stdio://
```

Zarządzany plik binarny jest zadeklarowany jako dołączona zależność środowiska uruchomieniowego Pluginu i przygotowywany
wraz z resztą zależności Pluginu `codex`. Dzięki temu wersja serwera aplikacyjnego
jest powiązana z dołączonym Pluginem, a nie z dowolnym osobnym CLI Codex,
które akurat jest zainstalowane lokalnie. Ustaw `appServer.command` tylko wtedy, gdy
celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje harnessu Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana postawa lokalnego operatora używana
dla autonomicznych Heartbeatów: Codex może używać narzędzi powłoki i sieci bez
zatrzymywania się na natywnych promptach zatwierdzeń, na które nikt nie może odpowiedzieć.

Aby włączyć zatwierdzenia przeglądane przez strażnika Codex, ustaw `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Tryb Guardian używa natywnej ścieżki zatwierdzeń automatycznego przeglądu Codex. Gdy Codex prosi o
opuszczenie piaskownicy, zapis poza obszarem roboczym lub dodanie uprawnień, takich jak dostęp
do sieci, Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
promptu człowieka. Recenzent stosuje framework ryzyka Codex i zatwierdza lub odrzuca
konkretne żądanie. Używaj Guardian, gdy chcesz więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą łączyć
preset z jawnymi wyborami. Starsza wartość recenzenta `guardian_subagent` jest
nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać
`auto_review`.

Dla już uruchomionego serwera aplikacyjnego użyj transportu WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Uruchomienia serwera aplikacyjnego przez stdio domyślnie dziedziczą środowisko procesu OpenClaw,
ale OpenClaw jest właścicielem mostka kont serwera aplikacyjnego Codex i ustawia zarówno
`CODEX_HOME`, jak i `HOME` na katalogi dla danego agenta w stanie OpenClaw
tego agenta. Własny loader Skills Codex czyta `$CODEX_HOME/skills` oraz
`$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień serwera aplikacyjnego.
Dzięki temu natywne dla Codex Skills, Pluginy, konfiguracja, konta i stan wątków
pozostają w zakresie agenta OpenClaw, zamiast przenikać z osobistego katalogu domowego
CLI Codex operatora.

Pluginy OpenClaw i snapshoty Skills OpenClaw nadal przepływają przez własny
rejestr Pluginów i loader Skills OpenClaw. Osobiste zasoby CLI Codex nie. Jeśli masz
przydatne Skills lub Pluginy CLI Codex, które powinny stać się częścią agenta OpenClaw,
zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego obszaru roboczego agenta OpenClaw.
Natywne Pluginy, hooki i pliki konfiguracyjne Codex są raportowane lub archiwizowane
do ręcznego przeglądu zamiast automatycznej aktywacji, ponieważ mogą
wykonywać polecenia, wystawiać serwery MCP lub przenosić poświadczenia.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacyjnego w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacyjnego przez stdio, `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacyjnego, a uwierzytelnianie OpenAI
   nadal jest wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu podrzędnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych tur serwera aplikacyjnego Codex przez API.
Jawne profile kluczy API Codex i lokalny fallback kluczy środowiskowych stdio używają logowania
serwera aplikacyjnego zamiast odziedziczonego środowiska procesu podrzędnego. Połączenia z serwerem aplikacyjnym
przez WebSocket nie otrzymują fallbacku kluczy API ze środowiska Gateway; użyj jawnego profilu uwierzytelniania lub
własnego konta zdalnego serwera aplikacyjnego.

Jeśli wdrożenie wymaga dodatkowej izolacji środowiska, dodaj te zmienne do
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` wpływa tylko na uruchamiany proces podrzędny serwera aplikacyjnego Codex.

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                 |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw bez ustawienia, aby użyć zarządzanego pliku binarnego; ustaw tylko w przypadku jawnego nadpisania.                                                                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                             |
| `url`               | nieustawione                             | Adres URL WebSocket app-server.                                                                                                                                                                                                             |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                                                                                                                                                      |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                               |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchamianego procesu app-server stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent w OpenClaw przy uruchomieniach lokalnych. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | Ustawienie wstępne dla wykonywania YOLO lub przeglądanego przez opiekuna.                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku/zwrocie.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb piaskownicy Codex wysyłany przy rozpoczęciu/wznowieniu wątku.                                                                                                                                                                  |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby Codex przeglądał natywne monity zatwierdzeń. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                      |
| `serviceTier`       | nieustawione                             | Opcjonalny poziom usługi app-server Codex: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                                    |

Dynamiczne wywołania narzędzi należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw
przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex
nieudaną odpowiedź narzędzia dynamicznego, aby zwrot mógł być kontynuowany
zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na ograniczone do zwrotu żądanie app-server Codex,
uprząż oczekuje także, że Codex zakończy natywny zwrot przez `turn/completed`.
Jeśli app-server milczy przez 60 sekund po tej odpowiedzi, OpenClaw w miarę
możliwości przerywa zwrot Codex, zapisuje diagnostyczny limit czasu i zwalnia
tor sesji OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za
nieaktualnym natywnym zwrotem.

Nadpisania środowiska pozostają dostępne do testowania lokalnego:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego testowania lokalnego.
Konfiguracja jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje
zachowanie pluginu w tym samym przeglądanym pliku co resztę konfiguracji
uprzęży Codex.

## Używanie komputera

Używanie komputera opisano w osobnym przewodniku konfiguracji:
[Używanie komputera w Codex](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji do sterowania pulpitem ani sam nie
wykonuje działań na pulpicie. Przygotowuje app-server Codex, sprawdza, czy
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex obsługiwać
natywne wywołania narzędzi MCP podczas zwrotów w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace
Codex, zarejestruj `cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Używanie komputera w Codex](/pl/plugins/codex-computer-use), aby poznać
różnicę między używaniem komputera należącym do Codex a bezpośrednią
rejestracją MCP.

Minimalna konfiguracja:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Konfigurację można sprawdzić lub zainstalować z powierzchni poleceń:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Używanie komputera jest specyficzne dla macOS i może wymagać lokalnych uprawnień
systemu operacyjnego, zanim serwer MCP Codex będzie mógł sterować aplikacjami.
Jeśli `computerUse.enabled` ma wartość true, a serwer MCP jest niedostępny,
zwroty w trybie Codex kończą się niepowodzeniem przed rozpoczęciem wątku,
zamiast po cichu działać bez natywnych narzędzi używania komputera. Zobacz
[Używanie komputera w Codex](/pl/plugins/codex-computer-use), aby poznać opcje
marketplace, ograniczenia zdalnego katalogu, przyczyny statusów i rozwiązywanie
problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować
standardowy dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` albo `/reset` po zmianie
konfiguracji środowiska uruchomieniowego lub używania komputera, aby istniejące
sesje nie zachowywały starego powiązania wątku PI lub Codex.

## Typowe przepisy

Lokalny Codex z domyślnym transportem stdio:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Walidacja uprzęży tylko dla Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Zatwierdzenia Codex przeglądane przez opiekuna:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Zdalny app-server z jawnymi nagłówkami:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Przełączanie modeli pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw
jest dołączona do istniejącego wątku Codex, następny zwrot ponownie wysyła do
app-server aktualnie wybrany model OpenAI, dostawcę, politykę zatwierdzania,
piaskownicę i poziom usługi. Przełączenie z `openai/gpt-5.5` na
`openai/gpt-5.2` zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z
nowo wybranym modelem.

## Polecenie Codex

Dołączony plugin rejestruje `/codex` jako autoryzowane polecenie z ukośnikiem.
Jest ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje bieżącą łączność app-server, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla bieżące modele app-server Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany plugin używania komputera i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany plugin używania komputera i ponownie ładuje serwery MCP.
- `/codex account` pokazuje konto i status limitów szybkości.
- `/codex mcp` wyświetla status serwera MCP app-server Codex.
- `/codex skills` wyświetla Skills app-server Codex.

### Typowy przepływ debugowania

Gdy agent oparty na Codex robi coś zaskakującego w Telegram, Discord, Slack lub
innym kanale, zacznij od rozmowy, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką
   notatkę opisującą to, co zobaczono.
2. Zatwierdź żądanie diagnostyki raz. Zatwierdzenie tworzy lokalny plik zip
   diagnostyki Gateway i, ponieważ sesja używa uprzęży Codex, wysyła także
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu albo wątku
   pomocy. Zawiera lokalną ścieżkę pakietu, podsumowanie prywatności,
   identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz wiersz
   `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować uruchomienie, wykonaj w terminalu
   wydrukowane polecenie `Inspect locally`. Wygląda jak `codex resume <thread-id>`
   i otwiera natywny wątek Codex, aby można było sprawdzić rozmowę, kontynuować
   ją lokalnie albo zapytać Codex, dlaczego wybrał dane narzędzie lub plan.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego OpenClaw Gateway. W przypadku większości zgłoszeń do pomocy technicznej lepszym punktem wyjścia jest `/diagnostics [note]`, ponieważ łączy lokalny stan Gateway i identyfikatory wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics), aby poznać pełny model prywatności i zachowanie w czatach grupowych.

Rdzeń OpenClaw udostępnia również właścicielom polecenie `/diagnostics [note]` jako ogólne polecenie diagnostyczne Gateway. Jego monit zatwierdzenia pokazuje wstęp dotyczący danych wrażliwych, linkuje do [Eksportu diagnostyki](/pl/gateway/diagnostics) i za każdym razem żąda uruchomienia `openclaw gateway diagnostics export --json` przez jawne zatwierdzenie wykonania. Nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu OpenClaw wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu i podsumowaniem manifestu. Gdy aktywna sesja OpenClaw używa harnessu Codex, to samo zatwierdzenie autoryzuje również wysłanie odpowiednich pakietów opinii Codex na serwery OpenAI. Monit zatwierdzenia informuje, że opinia Codex zostanie wysłana, ale przed zatwierdzeniem nie wymienia identyfikatorów sesji ani wątków Codex.

Jeśli `/diagnostics` zostanie wywołane przez właściciela w czacie grupowym, OpenClaw utrzymuje współdzielony kanał w czystości: grupa otrzymuje tylko krótkie powiadomienie, natomiast wstęp diagnostyczny, monity zatwierdzenia oraz identyfikatory sesji/wątków Codex są wysyłane do właściciela prywatną ścieżką zatwierdzenia. Jeśli nie ma prywatnej ścieżki do właściciela, OpenClaw odrzuca żądanie grupowe i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` serwera aplikacji Codex i prosi serwer aplikacji o dołączenie logów dla każdego wymienionego wątku oraz utworzonych podwątków Codex, gdy są dostępne. Przesłanie przechodzi standardową ścieżką opinii Codex na serwery OpenAI; jeśli opinie Codex są wyłączone w tym serwerze aplikacji, polecenie zwraca błąd serwera aplikacji. Ukończona odpowiedź diagnostyczna wymienia kanały, identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia `codex resume <thread-id>` dla wysłanych wątków. Jeśli odmówisz zatwierdzenia lub je zignorujesz, OpenClaw nie wypisze tych identyfikatorów Codex. To przesłanie nie zastępuje lokalnego eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam plik powiązania sidecar, którego harness używa dla zwykłych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje aktualnie wybrany model OpenClaw do serwera aplikacji i utrzymuje włączoną rozszerzoną historię.

### Sprawdź wątek Codex z CLI

Najszybszym sposobem zrozumienia nieudanego uruchomienia Codex jest często bezpośrednie otwarcie natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w konwersacji kanału i chcesz sprawdzić problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub sposób rozumowania. Najprostszą ścieżką jest zwykle najpierw uruchomić `/diagnostics [note]`: po zatwierdzeniu ukończony raport wymienia każdy wątek Codex i wypisuje polecenie `Inspect locally`, na przykład `codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio do terminala.

Możesz też uzyskać identyfikator wątku z `/codex binding` dla bieżącego czatu albo z `/codex threads [filter]` dla ostatnich wątków serwera aplikacji Codex, a następnie uruchomić to samo polecenie `codex resume` w swojej powłoce.

Powierzchnia poleceń wymaga serwera aplikacji Codex `0.125.0` lub nowszego. Poszczególne metody kontrolne są zgłaszane jako `unsupported by this Codex app-server`, jeśli przyszły lub niestandardowy serwer aplikacji nie udostępnia tej metody JSON-RPC.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                 | Zgodność produktu/Plugin między harnessami PI i Codex.              |
| Middleware rozszerzeń serwera aplikacji Codex | Pluginy dołączone do OpenClaw | Zachowanie adaptera dla każdej tury wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania zachowaniem Plugin OpenClaw. Dla obsługiwanego mostka natywnych narzędzi i uprawnień OpenClaw wstrzykuje konfigurację Codex per wątek dla `PreToolUse`, `PostToolUse`, `PermissionRequest` i `Stop`. Inne hooki Codex, takie jak `SessionStart` i `UserPromptSubmit`, pozostają kontrolkami na poziomie Codex; nie są udostępniane jako hooki Plugin OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o wywołanie, więc OpenClaw uruchamia zachowanie Plugin i middleware, które posiada, w adapterze harnessu. W przypadku natywnych narzędzi Codex to Codex posiada kanoniczny rekord narzędzia. OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex, chyba że Codex udostępni tę operację przez serwer aplikacji lub natywne wywołania zwrotne hooków.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień serwera aplikacji Codex i stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex. Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i `llm_output` są obserwacjami na poziomie adaptera, a nie przechwyceniami bajt po bajcie wewnętrznego żądania Codex lub ładunków Compaction.

Natywne powiadomienia serwera aplikacji Codex `hook/started` i `hook/completed` są projektowane jako zdarzenia agenta `codex_app_server.hook` dla trajektorii i debugowania. Nie wywołują hooków Plugin OpenClaw.

## Kontrakt wsparcia V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex posiada większą część natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji wokół tej granicy.

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Wsparcie                                | Dlaczego                                                                                                                                                                                             |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                             | Serwer aplikacji Codex posiada turę OpenAI, wznowienie natywnego wątku i kontynuację natywnego narzędzia.                                                                                            |
| Kierowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                       |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                        |
| Pluginy promptu i kontekstu                   | Obsługiwane                             | OpenClaw buduje nakładki promptów i projektuje kontekst do tury Codex przed rozpoczęciem lub wznowieniem wątku.                                                                                      |
| Cykl życia silnika kontekstu                  | Obsługiwane                             | Składanie, pobieranie lub konserwacja po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                 |
| Hooki dynamicznych narzędzi                   | Obsługiwane                             | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół dynamicznych narzędzi należących do OpenClaw.                                                                      |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z uczciwymi ładunkami trybu Codex.                                                                  |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez natywny przekaźnik hooków | Codex `Stop` jest przekazywane do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                  |
| Blokowanie lub obserwowanie natywnej powłoki, patchy i MCP | Obsługiwane przez natywny przekaźnik hooków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP w serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie jest. |
| Natywna polityka uprawnień                    | Obsługiwane przez natywny przekaźnik hooków | Codex `PermissionRequest` może być kierowane przez politykę OpenClaw tam, gdzie środowisko uruchomieniowe ją udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex kontynuuje przez swoją standardową ścieżkę opiekuna lub zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                             | OpenClaw rejestruje żądanie wysłane do serwera aplikacji i powiadomienia serwera aplikacji, które otrzymuje.                                                                                         |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia | Granica V1 | Przyszła ścieżka |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutacja argumentów narzędzi natywnych | Natywne hooki Codex przed użyciem narzędzia mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych dla Codex. | Wymaga obsługi hooków/schematu Codex dla zastępczych danych wejściowych narzędzia. |
| Edytowalna historia transkryptu natywna dla Codex | Codex jest właścicielem kanonicznej historii natywnego wątku. OpenClaw jest właścicielem lustrzanej kopii i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych mechanizmów wewnętrznych. | Dodać jawne interfejsy API serwera aplikacji Codex, jeśli potrzebna jest ingerencja w natywny wątek. |
| `tool_result_persist` dla rekordów narzędzi natywnych dla Codex | Ten hook przekształca zapisy transkryptu należącego do OpenClaw, a nie rekordy narzędzi natywnych dla Codex. | Może tworzyć lustrzaną kopię przekształconych rekordów, ale kanoniczne przepisanie wymaga obsługi po stronie Codex. |
| Bogate metadane natywnego Compaction | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/odrzuconych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction w Codex. |
| Interwencja w Compaction | Obecne hooki Compaction OpenClaw w trybie Codex działają na poziomie powiadomień. | Dodać hooki Codex przed/po Compaction, jeśli pluginy muszą wetować lub przepisywać natywny proces Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex wewnętrznie buduje końcowe żądanie API OpenAI. | Wymaga zdarzenia śledzenia żądania modelu w Codex albo API debugowania. |

## Narzędzia, media i Compaction

Warstwa uruchomieniowa Codex zmienia wyłącznie niskopoziomowego wykonawcę osadzonego agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
warstwy uruchomieniowej. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i wyniki
narzędzi komunikacyjnych nadal przechodzą przez normalną ścieżkę dostarczania OpenClaw.

Natywny przekaźnik hooków jest celowo ogólny, ale kontrakt obsługi v1 jest
ograniczony do ścieżek narzędzi i uprawnień natywnych dla Codex, które OpenClaw testuje. W
środowisku uruchomieniowym Codex obejmuje to ładunki shell, patch i MCP `PreToolUse`,
`PostToolUse` oraz `PermissionRequest`. Nie zakładaj, że każde przyszłe
zdarzenie hooka Codex jest powierzchnią pluginu OpenClaw, dopóki kontrakt środowiska uruchomieniowego jej nie nazwie.

W przypadku `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy
tylko wtedy, gdy polityka podejmie decyzję. Wynik bez decyzji nie jest zezwoleniem.
Codex traktuje go jako brak decyzji hooka i przechodzi do własnej ścieżki strażnika
lub zatwierdzenia przez użytkownika.

Wywołania uzyskania zatwierdzenia narzędzi MCP w Codex są kierowane przez przepływ
zatwierdzania pluginów OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Monity `request_user_input` Codex są odsyłane do
czatu źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada na to natywne
żądanie serwera, zamiast być sterowana jako dodatkowy kontekst. Inne żądania pozyskania
MCP nadal kończą się odmową.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera aplikacji Codex. Przy
domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje zakolejkowane wiadomości czatu
dla skonfigurowanego okna wyciszenia i wysyła je jako jedno żądanie `turn/steer` w
kolejności nadejścia. Starszy tryb `queue` wysyła oddzielne żądania `turn/steer`. Tury
przeglądu Codex i ręcznego Compaction mogą odrzucać sterowanie w tej samej turze, w takim przypadku
OpenClaw używa kolejki wiadomości uzupełniających, gdy wybrany tryb pozwala na ścieżkę awaryjną. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa warstwy uruchomieniowej Codex, natywne Compaction wątku jest
delegowane do serwera aplikacji Codex. OpenClaw utrzymuje lustrzaną kopię transkryptu dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub warstwy uruchomieniowej. Lustrzana
kopia obejmuje monit użytkownika, końcowy tekst asystenta oraz lekkie rekordy
rozumowania lub planu Codex, gdy serwer aplikacji je emituje. Obecnie OpenClaw rejestruje tylko
sygnały rozpoczęcia i zakończenia natywnego Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy wpisów, które Codex
zachował po Compaction.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist` obecnie nie
przepisuje rekordów wyników narzędzi natywnych dla Codex. Ma zastosowanie tylko wtedy, gdy
OpenClaw zapisuje wynik narzędzia w transkrypcie sesji należącym do OpenClaw.

Generowanie mediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS i rozumienie mediów
nadal używają odpowiednich ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** jest to oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (lub starsze odwołanie `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
backendu zgodności, gdy żadna warstwa uruchomieniowa Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testów. Wymuszone
środowisko uruchomieniowe Codex teraz kończy się błędem zamiast wracać do PI, chyba że
jawnie ustawisz `agentRuntime.fallback: "pi"`. Gdy serwer aplikacji Codex zostanie
wybrany, jego błędy pojawiają się bezpośrednio bez dodatkowej konfiguracji awaryjnej.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby uzgadnianie serwera aplikacji
zgłaszało wersję `0.125.0` lub nowszą. Wydania wstępne tej samej wersji lub wersje z sufiksem
kompilacji, takie jak `0.125.0-alpha.2` albo `0.125.0+custom`, są odrzucane, ponieważ
stabilne minimum protokołu `0.125.0` jest tym, co OpenClaw testuje.

**Wykrywanie modeli jest wolne:** zmniejsz `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket natychmiast kończy się niepowodzeniem:** sprawdź `appServer.url`, `authToken`
oraz upewnij się, że zdalny serwer aplikacji obsługuje tę samą wersję protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** jest to oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starsze odwołanie
`codex/*`. Zwykłe `openai/gpt-*` i inne odwołania dostawców pozostają na swojej normalnej
ścieżce dostawcy w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`, każda osadzona
tura dla tego agenta musi być modelem OpenAI obsługiwanym przez Codex.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` z nowej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` albo `/reset`; jeśli problem się utrzymuje, uruchom ponownie
Gateway, aby wyczyścić nieaktualne rejestracje natywnych hooków. Jeśli `computer-use.list_apps`
przekracza limit czasu, uruchom ponownie Codex Computer Use albo Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy warstwy uruchomieniowej agentów](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Stan](/pl/cli/status)
- [Hooki Plugin](/pl/plugins/hooks)
- [Informacje referencyjne o konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
