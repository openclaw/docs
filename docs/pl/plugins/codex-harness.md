---
read_when:
    - Chcesz użyć dołączonego środowiska uruchomieniowego app-server Codex
    - Potrzebujesz przykładów konfiguracji środowiska uruchomieniowego Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przełączać się awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączony mechanizm uruchomieniowy serwera aplikacji Codex
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-04-30T20:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agentów przez
serwer aplikacji Codex zamiast wbudowanego mechanizmu PI.

Użyj tego, gdy chcesz, aby Codex odpowiadał za niskopoziomową sesję agenta:
wykrywanie modeli, natywne wznawianie wątków, natywne Compaction oraz wykonanie
przez serwer aplikacji. OpenClaw nadal odpowiada za kanały czatu, pliki sesji,
wybór modelu, narzędzia, zatwierdzenia, dostarczanie multimediów oraz widoczne
lustro transkrypcji.

Jeśli próbujesz się zorientować, zacznij od
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes). Krótka wersja:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Co zmienia ten Plugin

Dołączony Plugin `codex` wnosi kilka oddzielnych możliwości:

| Możliwość                         | Jak jej używasz                                      | Co robi                                                                        |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Natywne osadzone środowisko uruchomieniowe | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agentów OpenClaw przez serwer aplikacji Codex.         |
| Natywne polecenia sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże i kontroluje wątki serwera aplikacji Codex z rozmowy w komunikatorze.    |
| Dostawca/katalog serwera aplikacji Codex | elementy wewnętrzne `codex`, udostępniane przez mechanizm | Pozwala środowisku uruchomieniowemu wykrywać i weryfikować modele serwera aplikacji. |
| Ścieżka rozumienia multimediów Codex | ścieżki zgodności modeli obrazów `codex/*`           | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik hooków          | hooki Pluginu wokół zdarzeń natywnych Codex          | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie Pluginu udostępnia te możliwości. Nie powoduje to:

- używania Codex dla każdego modelu OpenAI
- konwertowania referencji modeli `openai-codex/*` na natywne środowisko uruchomieniowe
- ustawienia ACP/acpx jako domyślnej ścieżki Codex
- przełączania na gorąco istniejących sesji, które już zapisały środowisko uruchomieniowe PI
- zastąpienia dostarczania kanałów OpenClaw, plików sesji, przechowywania profili uwierzytelniania ani
  routingu wiadomości

Ten sam Plugin odpowiada także za natywną powierzchnię polecenia sterowania czatem `/codex`. Jeśli
Plugin jest włączony, a użytkownik prosi o powiązanie, wznowienie, sterowanie, zatrzymanie lub sprawdzenie
wątków Codex z czatu, agenci powinni preferować `/codex ...` zamiast ACP. ACP pozostaje
jawną opcją awaryjną, gdy użytkownik prosi o ACP/acpx albo testuje adapter ACP
Codex.

Natywne tury Codex zachowują hooki Pluginu OpenClaw jako publiczną warstwę zgodności.
Są to hooki OpenClaw działające w procesie, a nie hooki poleceń Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkrypcji
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą także rejestrować neutralne względem środowiska uruchomieniowego middleware wyników narzędzi, aby przepisywać
dynamiczne wyniki narzędzi OpenClaw po wykonaniu narzędzia przez OpenClaw i przed
zwróceniem wyniku do Codex. Jest to oddzielne od publicznego hooka Pluginu
`tool_result_persist`, który przekształca zapisy wyników narzędzi w transkrypcji
należącej do OpenClaw.

Semantykę samych hooków Pluginu opisują [Hooki Pluginu](/pl/plugins/hooks)
oraz [Zachowanie strażnika Pluginu](/pl/tools/plugin).

Mechanizm jest domyślnie wyłączony. Nowe konfiguracje powinny zachować kanoniczne referencje modeli OpenAI
jako `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`, gdy
mają używać natywnego wykonania przez serwer aplikacji. Starsze referencje modeli `codex/*` nadal automatycznie wybierają
mechanizm ze względu na zgodność, ale starsze prefiksy dostawców obsługiwane przez środowisko uruchomieniowe
nie są pokazywane jako zwykłe wybory modelu/dostawcy.

Jeśli Plugin `codex` jest włączony, ale główny model nadal ma postać
`openai-codex/*`, `openclaw doctor` wyświetla ostrzeżenie zamiast zmieniać trasę. To
zamierzone: `openai-codex/*` pozostaje ścieżką OAuth/subskrypcji PI Codex, a
natywne wykonanie przez serwer aplikacji pozostaje jawnym wyborem środowiska uruchomieniowego.

## Mapa tras

Użyj tej tabeli przed zmianą konfiguracji:

| Pożądane zachowanie                         | Referencja modelu          | Konfiguracja środowiska uruchomieniowego | Wymaganie Pluginu          | Oczekiwana etykieta statusu     |
| ------------------------------------------- | -------------------------- | ---------------------------------------- | -------------------------- | ------------------------------- |
| OpenAI API przez normalny runner OpenClaw   | `openai/gpt-*`             | pominięte albo `runtime: "pi"`           | Dostawca OpenAI            | `Runtime: OpenClaw Pi Default`  |
| OAuth/subskrypcja Codex przez PI            | `openai-codex/gpt-*`       | pominięte albo `runtime: "pi"`           | Dostawca OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default`  |
| Natywne osadzone tury serwera aplikacji Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`               | Plugin `codex`             | `Runtime: OpenAI Codex`         |
| Mieszani dostawcy z konserwatywnym trybem automatycznym | referencje specyficzne dla dostawcy | `agentRuntime.id: "auto"`                | Opcjonalne środowiska uruchomieniowe Pluginów | Zależy od wybranego środowiska uruchomieniowego |
| Jawna sesja adaptera Codex ACP              | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"`      | sprawny backend `acpx`     | Status zadania/sesji ACP        |

Ważny podział to dostawca kontra środowisko uruchomieniowe:

- `openai-codex/*` odpowiada na pytanie „której trasy dostawcy/uwierzytelniania ma użyć PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla ma wykonać tę
  osadzoną turę?”
- `/codex ...` odpowiada na pytanie „z którą natywną rozmową Codex ten czat ma się powiązać
  albo którą ma kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces mechanizmu ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Trasy z rodziny OpenAI są specyficzne dla prefiksu. Użyj `openai-codex/*`, gdy chcesz
OAuth Codex przez PI; użyj `openai/*`, gdy chcesz bezpośredniego dostępu do OpenAI API albo
gdy wymuszasz natywny mechanizm serwera aplikacji Codex:

| Referencja modelu                            | Ścieżka środowiska uruchomieniowego          | Kiedy używać                                                              |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Dostawca OpenAI przez infrastrukturę OpenClaw/PI | Gdy chcesz bieżącego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OAuth OpenAI Codex przez OpenClaw/PI         | Gdy chcesz uwierzytelniania subskrypcją ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Mechanizm serwera aplikacji Codex            | Gdy chcesz natywnego wykonania przez serwer aplikacji Codex dla osadzonej tury agenta. |

GPT-5.5 jest obecnie w OpenClaw dostępny tylko przez subskrypcję/OAuth. Użyj
`openai-codex/gpt-5.5` dla PI OAuth albo `openai/gpt-5.5` z mechanizmem
serwera aplikacji Codex. Bezpośredni dostęp przez klucz API dla `openai/gpt-5.5` będzie obsługiwany,
gdy OpenAI włączy GPT-5.5 w publicznym API.

Starsze referencje `codex/gpt-*` pozostają akceptowane jako aliasy zgodności. Migracja zgodności
Doctor przepisuje starsze podstawowe referencje środowiska uruchomieniowego na kanoniczne referencje modeli
i zapisuje politykę środowiska uruchomieniowego oddzielnie, natomiast starsze referencje używane tylko jako fallback
pozostają bez zmian, ponieważ środowisko uruchomieniowe jest konfigurowane dla całego kontenera agenta.
Nowe konfiguracje PI Codex OAuth powinny używać `openai-codex/gpt-*`; nowe konfiguracje natywnego
mechanizmu serwera aplikacji powinny używać `openai/gpt-*` oraz
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy OAuth OpenAI
Codex. Użyj `codex/gpt-*`, gdy rozumienie obrazów ma działać
przez ograniczoną turę serwera aplikacji Codex. Model serwera aplikacji Codex musi
deklarować obsługę wejścia obrazowego; modele Codex tylko tekstowe kończą się niepowodzeniem przed rozpoczęciem tury
multimedialnej.

Użyj `/status`, aby potwierdzić efektywny mechanizm dla bieżącej sesji. Jeśli
wybór jest zaskakujący, włącz logowanie debug dla podsystemu `agents/harness`
i sprawdź strukturalny rekord Gateway `agent harness selected`. Zawiera on
wybrany identyfikator mechanizmu, powód wyboru, politykę runtime/fallback oraz,
w trybie `auto`, wynik obsługi każdego kandydata Pluginu.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy wszystkie poniższe warunki są prawdziwe:

- dołączony Plugin `codex` jest włączony lub dozwolony
- podstawowy model agenta to `openai-codex/*`
- efektywne środowisko uruchomieniowe tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „włączony Plugin Codex” oznacza
„natywne środowisko uruchomieniowe serwera aplikacji Codex”. OpenClaw nie dokonuje takiego przeskoku. Ostrzeżenie
oznacza:

- **Nie jest wymagana żadna zmiana**, jeśli zamierzałeś użyć ChatGPT/Codex OAuth przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamierzałeś użyć natywnego wykonania
  przez serwer aplikacji.
- Istniejące sesje nadal wymagają `/new` albo `/reset` po zmianie środowiska uruchomieniowego,
  ponieważ przypięcia środowiska uruchomieniowego sesji są trwałe.

Wybór mechanizmu nie jest kontrolą sesji na żywo. Gdy uruchamiana jest osadzona tura,
OpenClaw zapisuje wybrany identyfikator mechanizmu w tej sesji i nadal używa go dla
kolejnych tur w tym samym identyfikatorze sesji. Zmień konfigurację `agentRuntime` albo
`OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby przyszłe sesje używały innego mechanizmu;
użyj `/new` albo `/reset`, aby rozpocząć świeżą sesję przed przełączeniem istniejącej
rozmowy między PI i Codex. Pozwala to uniknąć odtwarzania jednej transkrypcji przez
dwa niezgodne natywne systemy sesji.

Starsze sesje utworzone przed przypięciami mechanizmu są traktowane jako przypięte do PI, gdy
mają historię transkrypcji. Użyj `/new` albo `/reset`, aby włączyć tę rozmowę do
Codex po zmianie konfiguracji.

`/status` pokazuje efektywne środowisko uruchomieniowe modelu. Domyślny mechanizm PI pojawia się jako
`Runtime: OpenClaw Pi Default`, a mechanizm serwera aplikacji Codex pojawia się jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym Pluginem `codex`.
- Serwer aplikacji Codex `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarium serwera aplikacji Codex, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na normalny start mechanizmu.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji albo dla mostka uwierzytelniania Codex
  w OpenClaw. Lokalne uruchomienia serwera aplikacji przez stdio używają zarządzanego przez OpenClaw katalogu domowego Codex dla każdego
  agenta oraz izolowanego podrzędnego `HOME`, więc domyślnie nie odczytują twojego osobistego
  konta `~/.codex`, Skills, Pluginów, konfiguracji, stanu wątków ani natywnego
  `$HOME/.agents/skills`.

Plugin blokuje starsze albo niewersjonowane uzgodnienia serwera aplikacji. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, wobec której został przetestowany.

W testach smoke na żywo i w Dockerze uwierzytelnianie zwykle pochodzi z konta Codex CLI
albo profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia serwera aplikacji stdio mogą
także wrócić do `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy konto nie jest obecne.

## Minimalna konfiguracja

Użyj `openai/gpt-5.5`, włącz dołączony Plugin i wymuś mechanizm `codex`:

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
      },
    },
  },
}
```

Jeśli twoja konfiguracja używa `plugins.allow`, dodaj tam także `codex`:

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

Starsze konfiguracje, które ustawiają `agents.defaults.model` albo model agenta na
`codex/<model>`, nadal automatycznie włączają dołączony Plugin `codex`. Nowe konfiguracje powinny
preferować `openai/<model>` oraz powyższy jawny wpis `agentRuntime`.

## Dodaj Codex obok innych modeli

Nie ustawiaj `agentRuntime.id: "codex"` globalnie, jeśli ten sam agent ma swobodnie przełączać się
między modelami dostawców Codex i innych niż Codex. Wymuszone środowisko uruchomieniowe dotyczy każdego
osadzonego turnu tego agenta lub sesji. Jeśli wybierzesz model Anthropic przy
wymuszonym tym środowisku uruchomieniowym, OpenClaw nadal spróbuje użyć uprzęży Codex i zakończy działanie w sposób zamknięty,
zamiast po cichu trasować ten turn przez Pi.

Zamiast tego użyj jednego z tych kształtów:

- Umieść Codex w dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta przy `agentRuntime.id: "auto"` oraz awaryjne użycie Pi dla zwykłego mieszanego
  korzystania z dostawców.
- Używaj starszych odwołań `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` oraz jawną politykę środowiska uruchomieniowego Codex.

Na przykład to pozostawia domyślnego agenta przy normalnym automatycznym wyborze i
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

W tym kształcie:

- Domyślny agent `main` używa normalnej ścieżki dostawcy i awaryjnej zgodności Pi.
- Agent `codex` używa uprzęży serwera aplikacji Codex.
- Jeśli Codex jest niedostępny lub nieobsługiwany dla agenta `codex`, turn kończy się niepowodzeniem
  zamiast po cichu używać Pi.

## Trasowanie poleceń agenta

Agenci powinni trasować żądania użytkownika według intencji, a nie samego słowa „Codex”:

| Użytkownik prosi o...                                   | Agent powinien użyć...                           |
| -------------------------------------------------------- | ------------------------------------------------ |
| „Powiąż ten czat z Codex”                                | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                         | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                      | `/codex threads`                                 |
| „Złóż zgłoszenie wsparcia dla nieudanego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij opinię Codex tylko dla tego załączonego wątku”   | `/codex diagnostics [note]`                      |
| „Użyj Codex jako środowiska uruchomieniowego dla tego agenta” | zmiana konfiguracji `agentRuntime.id`            |
| „Użyj mojej subskrypcji ChatGPT/Codex ze zwykłym OpenClaw” | odwołania modeli `openai-codex/*`                |
| „Uruchom Codex przez ACP/acpx”                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”     | ACP/acpx, nie `/codex` i nie natywni podagenci   |

OpenClaw reklamuje wskazówki spawnowania ACP agentom tylko wtedy, gdy ACP jest włączone,
możliwe do wysłania i oparte na załadowanym backendzie środowiska uruchomieniowego. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills Plugin nie powinny uczyć agenta o trasowaniu
ACP.

## Wdrożenia tylko z Codex

Wymuś uprząż Codex, gdy musisz dowieść, że każdy osadzony turn agenta
używa Codex. Jawne środowiska uruchomieniowe Plugin domyślnie nie mają awaryjnego użycia Pi, więc
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

Nadpisanie środowiskowe:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Przy wymuszonym Codex OpenClaw kończy się wcześnie, jeśli Plugin Codex jest wyłączony,
serwer aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić. Ustaw
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` tylko wtedy, gdy celowo chcesz, aby Pi obsługiwał
brak wyboru uprzęży.

## Codex dla konkretnego agenta

Możesz ustawić jednego agenta jako tylko Codex, podczas gdy domyślny agent zachowuje normalny
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

Używaj normalnych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy świeżą
sesję OpenClaw, a uprząż Codex tworzy lub wznawia swój poboczny wątek serwera aplikacji
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnemu turnowi ponownie rozwiązać uprząż z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacji o dostępne modele. Jeśli
wykrywanie się nie powiedzie lub przekroczy limit czasu, używa dołączonego katalogu awaryjnego dla:

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

Wyłącz wykrywanie, gdy chcesz, aby start nie sondował Codex i trzymał się
katalogu awaryjnego:

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

## Połączenie z serwerem aplikacji i polityka

Domyślnie Plugin uruchamia lokalnie zarządzany plik binarny Codex OpenClaw za pomocą:

```bash
codex app-server --listen stdio://
```

Zarządzany plik binarny jest zadeklarowany jako dołączona zależność środowiska uruchomieniowego Plugin i umieszczany
wraz z pozostałymi zależnościami Plugin `codex`. Dzięki temu wersja serwera aplikacji
jest powiązana z dołączonym Plugin, a nie z dowolnym osobnym CLI Codex,
które akurat jest zainstalowane lokalnie. Ustaw `appServer.command` tylko wtedy, gdy
celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje uprzęży Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana lokalna postawa operatora używana
dla autonomicznych Heartbeat: Codex może używać narzędzi powłoki i sieci bez
zatrzymywania się na natywnych promptach zatwierdzeń, na które nikt nie może odpowiedzieć.

Aby włączyć zatwierdzenia recenzowane przez strażnika Codex, ustaw `appServer.mode:
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

Tryb strażnika używa natywnej ścieżki zatwierdzeń automatycznej recenzji Codex. Gdy Codex prosi o
opuszczenie piaskownicy, zapis poza obszarem roboczym lub dodanie uprawnień takich jak dostęp
do sieci, Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza albo odrzuca
konkretne żądanie. Użyj Guardian, gdy chcesz więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby agenci bez nadzoru robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą łączyć
preset z jawnymi wyborami. Starsza wartość recenzenta `guardian_subagent` jest
nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać
`auto_review`.

Dla już działającego serwera aplikacji użyj transportu WebSocket:

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

Uruchomienia serwera aplikacji stdio domyślnie dziedziczą środowisko procesu OpenClaw,
ale OpenClaw posiada most konta serwera aplikacji Codex i ustawia zarówno
`CODEX_HOME`, jak i `HOME` na katalogi konkretnego agenta w stanie OpenClaw
tego agenta. Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` oraz
`$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień serwera aplikacji.
Dzięki temu natywne Skills, pluginy, konfiguracja, konta i stan wątków Codex
pozostają w zakresie agenta OpenClaw, zamiast wyciekać z osobistego katalogu domowego CLI Codex
operatora.

Pluginy OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny
rejestr Plugin i loader Skills OpenClaw. Osobiste zasoby CLI Codex nie. Jeśli masz
przydatne Skills lub pluginy CLI Codex, które powinny stać się częścią agenta OpenClaw,
zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego obszaru roboczego agenta OpenClaw.
Natywne pluginy, haki i pliki konfiguracyjne Codex są zgłaszane lub archiwizowane
do ręcznej recenzji zamiast być aktywowane automatycznie, ponieważ mogą
wykonywać polecenia, ujawniać serwery MCP lub zawierać dane uwierzytelniające.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio, `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy konto serwera aplikacji nie jest obecne i uwierzytelnianie OpenAI
   jest nadal wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla osadzeń lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych turnów serwera aplikacji Codex przez API.
Jawne profile kluczy API Codex i lokalne awaryjne użycie kluczy środowiskowych stdio używają logowania serwera aplikacji
zamiast odziedziczonego środowiska procesu potomnego. Połączenia WebSocket z serwerem aplikacji
nie otrzymują awaryjnych kluczy API z env Gateway; użyj jawnego profilu uwierzytelniania albo
własnego konta zdalnego serwera aplikacji.

Jeśli wdrożenie potrzebuje dodatkowej izolacji środowiska, dodaj te zmienne do
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

`appServer.clearEnv` wpływa tylko na uruchamiany proces potomny serwera aplikacji Codex.

Obsługiwane pola `appServer`:

| Pole                | Domyślne                                | Znaczenie                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                             |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko w celu jawnego nadpisania.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                       |
| `url`               | nieustawione                             | Adres URL serwera aplikacji WebSocket.                                                                                                                                                                                                            |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-server stdio po tym, jak OpenClaw zbuduje swoje odziedziczone środowisko. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex na agenta w OpenClaw przy uruchomieniach lokalnych. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Ustawienie wstępne dla wykonywania YOLO albo wykonywania sprawdzanego przez opiekuna.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku lub turze.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb piaskownicy Codex wysyłany przy rozpoczęciu/wznowieniu wątku.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby Codex sprawdzał natywne prośby o zatwierdzenie. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                         |
| `serviceTier`       | nieustawione                             | Opcjonalny poziom usługi app-server Codex: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                                            |

Dynamiczne wywołania narzędzi należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw przerywa
sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex nieudaną odpowiedź
narzędzia dynamicznego, aby tura mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie app-server Codex ograniczone do tury, uprząż
oczekuje również, że Codex zakończy natywną turę zdarzeniem `turn/completed`. Jeśli
app-server milczy przez 60 sekund po tej odpowiedzi, OpenClaw w trybie best-effort
przerywa turę Codex, zapisuje diagnostyczny limit czasu i zwalnia pas sesji
OpenClaw, aby kolejne wiadomości czatu nie trafiały do kolejki za przestarzałą
natywną turą.

Nadpisania środowiska pozostają dostępne do testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` jest nieustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych. Konfiguracja jest
preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie Plugin w tym
samym sprawdzanym pliku co resztę konfiguracji uprzęży Codex.

## Użycie komputera

Użycie komputera opisano w osobnym przewodniku konfiguracji:
[Użycie komputera Codex](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie vendoryzuje aplikacji sterowania pulpitem ani samodzielnie
nie wykonuje akcji na pulpicie. Przygotowuje app-server Codex, weryfikuje, że
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex obsługiwać natywne
wywołania narzędzi MCP podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace Codex, zarejestruj
`cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Użycie komputera Codex](/pl/plugins/codex-computer-use), aby poznać różnicę
między Użyciem komputera należącym do Codex a bezpośrednią rejestracją MCP.

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

Konfigurację można sprawdzić lub zainstalować z poziomu poleceń:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Użycie komputera jest specyficzne dla macOS i może wymagać lokalnych uprawnień systemu operacyjnego, zanim
serwer MCP Codex będzie mógł sterować aplikacjami. Jeśli `computerUse.enabled` ma wartość true, a serwer MCP
jest niedostępny, tury w trybie Codex kończą się niepowodzeniem przed rozpoczęciem wątku zamiast
cicho działać bez natywnych narzędzi Użycia komputera. Zobacz
[Użycie komputera Codex](/pl/plugins/codex-computer-use), aby poznać opcje marketplace,
limity zdalnego katalogu, przyczyny stanu i sposoby rozwiązywania problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować standardowy
dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` lub `/reset` po
zmianie konfiguracji środowiska uruchomieniowego albo Użycia komputera, aby istniejące sesje nie zachowywały starego
powiązania wątku PI lub Codex.

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

Walidacja uprzęży tylko Codex:

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

Zatwierdzenia Codex sprawdzane przez opiekuna:

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

Przełączanie modeli pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw jest podłączona
do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany
model OpenAI, dostawcę, politykę zatwierdzania, piaskownicę i poziom usługi do
app-server. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje
powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane polecenie ukośnikowe. Jest
ogólne i działa w każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje bieżącą łączność app-server, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla modele app-server Codex na żywo.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` podłącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o skompaktowanie podłączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla podłączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla podłączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany Plugin Użycia komputera i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany Plugin Użycia komputera i ponownie ładuje serwery MCP.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwera MCP app-server Codex.
- `/codex skills` wyświetla Skills app-server Codex.

### Typowy przepływ debugowania

Gdy agent oparty na Codex zrobi coś zaskakującego w Telegram, Discord, Slack
albo innym kanale, zacznij od rozmowy, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką notatkę,
   która opisuje to, co zobaczono.
2. Zatwierdź prośbę diagnostyczną jeden raz. Zatwierdzenie tworzy lokalny plik zip diagnostyki Gateway
   i, ponieważ sesja używa uprzęży Codex, wysyła również
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu albo wątku pomocy.
   Zawiera lokalną ścieżkę pakietu, podsumowanie prywatności, identyfikatory sesji OpenClaw,
   identyfikatory wątków Codex oraz wiersz `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować uruchomienie, uruchom wypisane polecenie `Inspect locally`
   w terminalu. Wygląda jak `codex resume <thread-id>` i otwiera
   natywny wątek Codex, aby można było sprawdzić rozmowę, kontynuować ją lokalnie
   albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub plan.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie potrzebujesz przesłania opinii Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego OpenClaw Gateway. Dla większości zgłoszeń do pomocy technicznej lepszym punktem wyjścia jest `/diagnostics [note]`, ponieważ łączy lokalny stan Gateway i identyfikatory wątków Codex w jednej odpowiedzi. Pełny model prywatności i zachowanie w czatach grupowych opisuje [eksport diagnostyki](/pl/gateway/diagnostics).

Rdzeń OpenClaw udostępnia też dostępne tylko dla właścicieli `/diagnostics [note]` jako ogólne polecenie diagnostyki Gateway. Monit zatwierdzenia pokazuje wstęp dotyczący danych wrażliwych, linkuje do [eksportu diagnostyki](/pl/gateway/diagnostics) i za każdym razem żąda `openclaw gateway diagnostics export --json` przez jawne zatwierdzenie wykonania. Nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu OpenClaw wysyła raport gotowy do wklejenia z lokalną ścieżką pakietu i podsumowaniem manifestu. Gdy aktywna sesja OpenClaw używa uprzęży Codex, to samo zatwierdzenie autoryzuje też wysłanie odpowiednich pakietów opinii Codex na serwery OpenAI. Monit zatwierdzenia informuje, że opinia Codex zostanie wysłana, ale przed zatwierdzeniem nie podaje identyfikatorów sesji ani wątków Codex.

Jeśli `/diagnostics` zostanie wywołane przez właściciela w czacie grupowym, OpenClaw utrzymuje kanał współdzielony w czystości: grupa otrzymuje tylko krótkie powiadomienie, a wstęp diagnostyczny, monity zatwierdzenia oraz identyfikatory sesji/wątków Codex są wysyłane do właściciela prywatną ścieżką zatwierdzania. Jeśli nie ma prywatnej ścieżki do właściciela, OpenClaw odmawia obsługi żądania grupowego i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` serwera aplikacji Codex i prosi serwer aplikacji o dołączenie dzienników dla każdego wymienionego wątku oraz utworzonych podwątków Codex, gdy są dostępne. Przesyłanie przechodzi normalną ścieżką opinii Codex na serwery OpenAI; jeśli opinie Codex są wyłączone na tym serwerze aplikacji, polecenie zwraca błąd serwera aplikacji. Ukończona odpowiedź diagnostyczna wymienia kanały, identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia `codex resume <thread-id>` dla wątków, które zostały wysłane. Jeśli odmówisz zatwierdzenia albo je zignorujesz, OpenClaw nie wypisze tych identyfikatorów Codex. To przesłanie nie zastępuje lokalnego eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam poboczny plik powiązania, którego uprząż używa dla normalnych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje aktualnie wybrany model OpenClaw do serwera aplikacji i pozostawia włączoną rozszerzoną historię.

### Inspekcja wątku Codex z CLI

Najszybszym sposobem zrozumienia nieudanego uruchomienia Codex jest często bezpośrednie otwarcie natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w konwersacji na kanale i chcesz sprawdzić problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub konkretny tok rozumowania. Najłatwiejszą ścieżką jest zwykle najpierw uruchomienie `/diagnostics [note]`: po zatwierdzeniu ukończony raport wymienia każdy wątek Codex i wypisuje polecenie `Sprawdź lokalnie`, na przykład `codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio do terminala.

Identyfikator wątku możesz też uzyskać z `/codex binding` dla bieżącego czatu albo `/codex threads [filter]` dla ostatnich wątków serwera aplikacji Codex, a następnie uruchomić to samo polecenie `codex resume` w powłoce.

Powierzchnia poleceń wymaga serwera aplikacji Codex `0.125.0` lub nowszego. Poszczególne metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli przyszły lub niestandardowy serwer aplikacji nie udostępnia tej metody JSON-RPC.

## Granice haków

Uprząż Codex ma trzy warstwy haków:

| Warstwa                               | Właściciel              | Cel                                                                 |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Haki Plugin OpenClaw                  | OpenClaw                | Zgodność produktu/Plugin z uprzężami PI i Codex.                    |
| Oprogramowanie pośredniczące rozszerzeń serwera aplikacji Codex | Dołączone pluginy OpenClaw | Zachowanie adaptera dla każdej tury wokół dynamicznych narzędzi OpenClaw. |
| Natywne haki Codex                    | Codex                   | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania zachowaniem Plugin OpenClaw. Dla obsługiwanego mostu natywnych narzędzi i uprawnień OpenClaw wstrzykuje konfigurację Codex dla danego wątku dla `PreToolUse`, `PostToolUse`, `PermissionRequest` i `Stop`. Inne haki Codex, takie jak `SessionStart` i `UserPromptSubmit`, pozostają mechanizmami sterowania na poziomie Codex; nie są udostępniane jako haki Plugin OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw, OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o wywołanie, więc OpenClaw uruchamia zachowanie Plugin i oprogramowania pośredniczącego, które posiada, w adapterze uprzęży. W przypadku narzędzi natywnych Codex to Codex posiada kanoniczny rekord narzędzia. OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex, chyba że Codex udostępni tę operację przez serwer aplikacji lub natywne wywołania zwrotne haków.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień serwera aplikacji Codex i stanu adaptera OpenClaw, a nie z natywnych poleceń haków Codex. Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i `llm_output` są obserwacjami na poziomie adaptera, a nie dokładnymi co do bajtu przechwyceniami wewnętrznego żądania Codex lub ładunków Compaction.

Natywne powiadomienia serwera aplikacji Codex `hook/started` i `hook/completed` są projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania. Nie wywołują haków Plugin OpenClaw.

## Kontrakt obsługi V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex posiada większą część natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji wokół tej granicy.

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Obsługa                                 | Dlaczego                                                                                                                                                                                             |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                             | Serwer aplikacji Codex posiada turę OpenAI, wznowienie natywnego wątku i kontynuację natywnego narzędzia.                                                                                            |
| Routing i dostarczanie kanałów OpenClaw       | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                       |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                         |
| Pluginy promptów i kontekstu                  | Obsługiwane                             | OpenClaw buduje nakładki promptów i projektuje kontekst do tury Codex przed uruchomieniem lub wznowieniem wątku.                                                                                     |
| Cykl życia silnika kontekstu                  | Obsługiwane                             | Składanie, pobieranie lub utrzymanie po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                  |
| Haki narzędzi dynamicznych                    | Obsługiwane                             | `before_tool_call`, `after_tool_call` i oprogramowanie pośredniczące wyników narzędzi działają wokół dynamicznych narzędzi posiadanych przez OpenClaw.                                                |
| Haki cyklu życia                              | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z rzetelnymi ładunkami trybu Codex.                                                                  |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez przekaźnik natywnych haków | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                   |
| Blokowanie lub obserwacja natywnej powłoki, łatki i MCP | Obsługiwane przez przekaźnik natywnych haków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP na serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez przekaźnik natywnych haków | Codex `PermissionRequest` może być kierowane przez politykę OpenClaw tam, gdzie środowisko uruchomieniowe je udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex kontynuuje przez swoją normalną ścieżkę strażnika lub zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                             | OpenClaw zapisuje żądanie wysłane do serwera aplikacji oraz powiadomienia serwera aplikacji, które otrzymuje.                                                                                        |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                        | Granica V1                                                                                                                                          | Przyszła ścieżka                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Mutacja argumentów narzędzi natywnych               | Natywne haki przednarzędziowe Codex mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych Codex.                                | Wymaga obsługi haków/schematu Codex dla zastępczych danych wejściowych narzędzia.                    |
| Edytowalna natywna historia transkrypcji Codex      | Codex posiada kanoniczną historię natywnego wątku. OpenClaw posiada kopię lustrzaną i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodaj jawne API serwera aplikacji Codex, jeśli potrzebna jest chirurgiczna edycja natywnego wątku.    |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hak przekształca zapisy transkrypcji należące do OpenClaw, a nie rekordy narzędzi natywnych Codex.                                             | Można utworzyć kopię lustrzaną przekształconych rekordów, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate metadane natywnej Compaction                 | OpenClaw obserwuje początek i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction Codex.                                                           |
| Interwencja w Compaction                            | Obecne haki Compaction OpenClaw są na poziomie powiadomień w trybie Codex.                                                                          | Dodaj haki przed/po Compaction Codex, jeśli pluginy muszą wetować lub przepisywać natywną Compaction. |
| Przechwytywanie żądania API modelu bajt w bajt      | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex buduje ostateczne żądanie API OpenAI wewnętrznie.           | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                                 |

## Narzędzia, multimedia i Compaction

Uprząż Codex zmienia wyłącznie niskopoziomowy osadzony executor agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
uprzęży. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi komunikacyjnych nadal przechodzą przez normalną ścieżkę dostarczania
OpenClaw.

Natywny przekaźnik haków jest celowo ogólny, ale kontrakt obsługi v1 jest
ograniczony do ścieżek narzędzi natywnych Codex i uprawnień, które testuje
OpenClaw. W środowisku uruchomieniowym Codex obejmuje to powłokę, poprawki oraz
ładunki MCP `PreToolUse`, `PostToolUse` i `PermissionRequest`. Nie zakładaj, że
każde przyszłe zdarzenie haka Codex jest powierzchnią pluginu OpenClaw, dopóki
kontrakt środowiska uruchomieniowego jej nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia albo odmowy
tylko wtedy, gdy zdecyduje polityka. Wynik bez decyzji nie jest zezwoleniem.
Codex traktuje go jako brak decyzji haka i przechodzi do własnej ścieżki
strażnika albo zatwierdzenia użytkownika.

Wywołania zatwierdzenia narzędzi MCP Codex są kierowane przez przepływ
zatwierdzania pluginów OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind`
jako `"mcp_tool_call"`. Prompty `request_user_input` Codex są odsyłane do
czatu źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada na
to natywne żądanie serwera zamiast być sterowana jako dodatkowy kontekst. Inne
żądania wywołania MCP nadal zawodzą w trybie zamkniętym.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera
aplikacji Codex. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje
zakolejkowane wiadomości czatu przez skonfigurowane okno ciszy i wysyła je jako
jedno żądanie `turn/steer` w kolejności nadejścia. Starszy tryb `queue` wysyła
osobne żądania `turn/steer`. Tury przeglądu Codex i ręcznej Compaction mogą
odrzucić sterowanie w tej samej turze; w takim przypadku OpenClaw używa kolejki
uzupełniającej, gdy wybrany tryb pozwala na fallback. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa uprzęży Codex, natywna Compaction wątku jest
delegowana do serwera aplikacji Codex. OpenClaw utrzymuje kopię lustrzaną
transkrypcji dla historii kanału, wyszukiwania, `/new`, `/reset` oraz
przyszłego przełączania modelu lub uprzęży. Kopia lustrzana obejmuje prompt
użytkownika, końcowy tekst asystenta oraz lekkie rekordy rozumowania lub planu
Codex, gdy serwer aplikacji je emituje. Obecnie OpenClaw rejestruje tylko
sygnały rozpoczęcia i zakończenia natywnej Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy wpisów,
które Codex zachował po Compaction.

Ponieważ Codex posiada kanoniczny natywny wątek, `tool_result_persist` obecnie
nie przepisuje rekordów wyników narzędzi natywnych Codex. Ma zastosowanie tylko
wtedy, gdy OpenClaw zapisuje wynik narzędzia transkrypcji sesji należącej do
OpenClaw.

Generowanie multimediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS i
rozumienie multimediów nadal używają odpowiednich ustawień dostawcy/modelu,
takich jak `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` i `messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako normalny dostawca `/model`:** to oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (albo starsze odwołanie `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
zaplecza zgodności, gdy żadna uprząż Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania.
Wymuszone środowisko uruchomieniowe Codex teraz kończy się błędem zamiast
wracać do PI, chyba że jawnie ustawisz `agentRuntime.fallback: "pi"`. Po
wybraniu serwera aplikacji Codex jego błędy są ujawniane bezpośrednio, bez
dodatkowej konfiguracji fallback.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby uzgadnianie serwera
aplikacji zgłaszało wersję `0.125.0` lub nowszą. Prerelease tej samej wersji
lub wersje z sufiksem kompilacji, takie jak `0.125.0-alpha.2` albo
`0.125.0+custom`, są odrzucane, ponieważ stabilny próg protokołu `0.125.0` jest
tym, co testuje OpenClaw.

**Wykrywanie modeli jest wolne:** obniż `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket natychmiast zawodzi:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny serwer aplikacji mówi tą samą wersją protokołu serwera aplikacji Codex.

**Model niebędący Codex używa PI:** to oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starsze odwołanie
`codex/*`. Zwykłe `openai/gpt-*` i inne odwołania dostawców pozostają na swojej
normalnej ścieżce dostawcy w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`,
każda osadzona tura dla tego agenta musi być modelem OpenAI obsługiwanym przez Codex.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` albo `/reset`; jeśli problem się
utrzymuje, uruchom ponownie gateway, aby wyczyścić nieaktualne rejestracje
natywnych haków. Jeśli `computer-use.list_apps` przekracza limit czasu,
uruchom ponownie Codex Computer Use albo Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Haki pluginów](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
