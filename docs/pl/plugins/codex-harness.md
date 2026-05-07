---
read_when:
    - Chcesz użyć dołączonego środowiska testowego app-server Codex
    - Potrzebujesz przykładów konfiguracji środowiska uruchomieniowego Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na Pi
summary: Uruchamiaj przebiegi wbudowanego agenta OpenClaw za pośrednictwem dołączonego mechanizmu serwera aplikacji Codex
title: Uprząż Codex
x-i18n:
    generated_at: "2026-05-07T01:54:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
serwer aplikacji Codex zamiast wbudowanego mechanizmu PI.

Użyj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
odkrywaniem modeli, natywnym wznawianiem wątków, natywną compaction oraz wykonywaniem
przez serwer aplikacji. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modelu, narzędziami,
zatwierdzeniami, dostarczaniem multimediów oraz widocznym lustrzanym zapisem transkrypcji.

Gdy tura czatu źródłowego działa przez mechanizm Codex, widoczne odpowiedzi domyślnie
używają narzędzia OpenClaw `message`, jeśli wdrożenie nie skonfigurowało jawnie
`messages.visibleReplies`. Agent nadal może zakończyć swoją turę Codex prywatnie;
publikuje w kanale tylko wtedy, gdy wywoła `message(action="send")`. Ustaw
`messages.visibleReplies: "automatic"`, aby zachować końcowe odpowiedzi w czacie bezpośrednim na
starszej ścieżce automatycznego dostarczania.

Tury Codex Heartbeat domyślnie otrzymują także narzędzie `heartbeat_respond`, aby
agent mógł zapisać, czy wybudzenie powinno pozostać ciche, czy wysłać powiadomienie, bez kodowania
tego przepływu sterowania w tekście końcowym.

Wskazówki dotyczące inicjatywy specyficzne dla Heartbeat są wysyłane jako instrukcja deweloperska
trybu współpracy Codex w samej turze heartbeat. Zwykłe tury czatu przywracają
tryb Codex Default zamiast przenosić filozofię heartbeat w swoim normalnym
prompcie uruchomieniowym.

Jeśli próbujesz się zorientować, zacznij od
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes). Krótka wersja jest taka:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Większość użytkowników, którzy chcą „Codex w OpenClaw”, potrzebuje tej ścieżki: zaloguj się z
subskrypcją ChatGPT/Codex, a następnie uruchamiaj osadzone tury agenta przez natywne
środowisko uruchomieniowe serwera aplikacji Codex. Referencja modelu nadal pozostaje kanoniczna jako
`openai/gpt-*`; uwierzytelnianie subskrypcji pochodzi z konta/profilu Codex, a nie
z prefiksu modelu `openai-codex/*`.

Najpierw zaloguj się przez Codex OAuth, jeśli jeszcze tego nie zrobiono:

```bash
openclaw models auth login --provider openai-codex
```

Następnie włącz dołączony Plugin `codex` i wymuś środowisko uruchomieniowe Codex:

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

Nie używaj `openai-codex/gpt-*` w konfiguracji. Ten prefiks to starsza ścieżka, którą
`openclaw doctor --fix` przepisuje na `openai/gpt-*` w modelach podstawowych,
fallbackach, nadpisaniach heartbeat/subagent/compaction, hookach, nadpisaniach kanałów
oraz nieaktualnych utrwalonych pinezkach tras sesji.

## Co zmienia ten Plugin

Dołączony Plugin `codex` wnosi kilka osobnych możliwości:

| Możliwość                         | Jak jej używasz                                      | Co robi                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywne osadzone środowisko uruchomieniowe | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez serwer aplikacji Codex.         |
| Natywne polecenia sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże i kontroluje wątki serwera aplikacji Codex z rozmowy w komunikatorze.   |
| Dostawca/katalog serwera aplikacji Codex | elementy wewnętrzne `codex`, udostępniane przez mechanizm | Pozwala środowisku uruchomieniowemu odkrywać i weryfikować modele serwera aplikacji. |
| Ścieżka rozumienia multimediów Codex | ścieżki zgodności modeli obrazów `codex/*`          | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik hooków         | Hooki Plugin wokół natywnych zdarzeń Codex          | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie Plugin udostępnia te możliwości. **Nie**:

- zaczyna używać Codex dla każdego modelu OpenAI
- konwertuje referencje modeli `openai-codex/*` na natywne środowisko uruchomieniowe bez sprawdzenia przez doctor,
  że Codex jest zainstalowany, włączony, dostarcza mechanizm `codex`
  i jest gotowy do OAuth
- czyni ACP/acpx domyślną ścieżką Codex
- przełącza na gorąco istniejących sesji, które już zapisały środowisko uruchomieniowe PI
- zastępuje dostarczania kanałów OpenClaw, plików sesji, przechowywania profili uwierzytelniania ani
  routingu wiadomości

Ten sam Plugin jest również właścicielem natywnej powierzchni poleceń sterowania czatem `/codex`. Jeśli
Plugin jest włączony, a użytkownik prosi o powiązanie, wznowienie, sterowanie, zatrzymanie lub sprawdzenie
wątków Codex z czatu, agenci powinni preferować `/codex ...` zamiast ACP. ACP pozostaje
jawnym fallbackiem, gdy użytkownik prosi o ACP/acpx lub testuje adapter ACP
Codex.

Natywne tury Codex zachowują hooki Plugin OpenClaw jako publiczną warstwę zgodności.
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
zwróceniem wyniku do Codex. Jest to osobne od publicznego hooka Plugin
`tool_result_persist`, który przekształca należące do OpenClaw zapisy wyników narzędzi
w transkrypcji.

Semantykę samych hooków Plugin opisują [Hooki Plugin](/pl/plugins/hooks)
oraz [Zachowanie strażników Plugin](/pl/tools/plugin).

Mechanizm jest domyślnie wyłączony. Nowe konfiguracje powinny zachować referencje modeli OpenAI
w formie kanonicznej `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`, gdy
wymagają natywnego wykonywania przez serwer aplikacji. Starsze referencje modeli `codex/*` nadal automatycznie wybierają
mechanizm dla zgodności, ale starsze prefiksy dostawców oparte na środowisku uruchomieniowym
nie są pokazywane jako normalne wybory modelu/dostawcy.

Jeśli jakakolwiek skonfigurowana trasa modelu nadal ma postać `openai-codex/*`, `openclaw doctor --fix`
przepisuje ją na `openai/*`. Dla pasujących tras agentów ustawia środowisko uruchomieniowe agenta
na `codex` tylko wtedy, gdy Plugin Codex jest zainstalowany, włączony, dostarcza
mechanizm `codex` i ma używalne OAuth; w przeciwnym razie ustawia środowisko uruchomieniowe na `pi`.

## Mapa tras

Użyj tej tabeli przed zmianą konfiguracji:

| Oczekiwane zachowanie                                | Referencja modelu         | Konfiguracja środowiska uruchomieniowego | Trasa uwierzytelniania/profilu | Oczekiwana etykieta stanu       |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth lub konto Codex  | `Runtime: OpenAI Codex`        |
| OpenAI API przez normalny runner OpenClaw            | `openai/gpt-*`             | pominięte lub `runtime: "pi"`          | Klucz OpenAI API             | `Runtime: OpenClaw Pi Default` |
| Starsza konfiguracja wymagająca naprawy doctor       | `openai-codex/gpt-*`       | naprawione na `codex` lub `pi`         | Istniejące skonfigurowane uwierzytelnianie | Sprawdź ponownie po `doctor --fix` |
| Mieszani dostawcy z konserwatywnym trybem automatycznym | referencje specyficzne dla dostawcy | `agentRuntime.id: "auto"`              | Według wybranego dostawcy    | Zależy od wybranego środowiska uruchomieniowego |
| Jawna sesja adaptera Codex ACP                       | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"` | Uwierzytelnianie backendu ACP | Stan zadania/sesji ACP         |

Ważny podział to dostawca kontra środowisko uruchomieniowe:

- `openai-codex/*` to starsza trasa, którą doctor przepisuje.
- `agentRuntime.id: "codex"` wymaga mechanizmu Codex i kończy się błędem zamkniętym, jeśli
  jest niedostępny.
- `agentRuntime.id: "auto"` pozwala zarejestrowanym mechanizmom przejmować pasujące trasy
  dostawcy, ale kanoniczne referencje OpenAI nadal należą do PI, chyba że mechanizm obsługuje
  daną parę dostawca/model.
- `/codex ...` odpowiada na pytanie „którą natywną rozmowę Codex ten czat ma powiązać
  lub kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces mechanizmu ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Trasy z rodziny OpenAI są specyficzne dla prefiksu. Dla typowej konfiguracji z subskrypcją oraz
natywnym środowiskiem uruchomieniowym Codex użyj `openai/*` z `agentRuntime.id: "codex"`.
Traktuj `openai-codex/*` jako starszą konfigurację, którą doctor powinien przepisać:

| Referencja modelu                            | Ścieżka środowiska uruchomieniowego          | Kiedy używać                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Dostawca OpenAI przez mechanikę OpenClaw/PI  | Chcesz bieżącego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Starsza trasa naprawiana przez doctor         | Masz starą konfigurację; uruchom `openclaw doctor --fix`, aby ją przepisać. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Mechanizm serwera aplikacji Codex             | Chcesz uwierzytelniania subskrypcji ChatGPT/Codex z natywnym wykonywaniem Codex. |

GPT-5.5 może pojawiać się zarówno na bezpośrednich trasach z kluczem OpenAI API, jak i trasach subskrypcji Codex,
gdy Twoje konto je udostępnia. Użyj `openai/gpt-5.5` z mechanizmem serwera aplikacji Codex
dla natywnego środowiska uruchomieniowego Codex albo `openai/gpt-5.5` bez nadpisania środowiska uruchomieniowego Codex
dla bezpośredniego ruchu z kluczem API.

Starsze referencje `codex/gpt-*` pozostają akceptowane jako aliasy zgodności. Migracja zgodności doctor
przepisuje starsze referencje środowiska uruchomieniowego na kanoniczne referencje modeli
i zapisuje politykę środowiska uruchomieniowego osobno. Nowe konfiguracje natywnego mechanizmu serwera aplikacji
powinny używać `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` podąża za tym samym podziałem prefiksów. Użyj
`openai/gpt-*` dla normalnej trasy OpenAI oraz `codex/gpt-*`, gdy rozumienie obrazów
powinno działać przez ograniczoną turę serwera aplikacji Codex. Nie używaj
`openai-codex/gpt-*`; doctor przepisuje ten starszy prefiks na `openai/gpt-*`. Model
serwera aplikacji Codex musi deklarować obsługę wejścia obrazu; tekstowe modele Codex
kończą się błędem przed rozpoczęciem tury multimedialnej.

Użyj `/status`, aby potwierdzić efektywny mechanizm dla bieżącej sesji. Jeśli
wybór jest zaskakujący, włącz logowanie debugowania dla podsystemu `agents/harness`
i sprawdź ustrukturyzowany rekord Gateway `agent harness selected`. Zawiera on
identyfikator wybranego mechanizmu, powód wyboru, politykę środowiska uruchomieniowego/fallbacku oraz,
w trybie `auto`, wynik obsługi każdego kandydata Plugin.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy skonfigurowane referencje modeli lub utrwalony stan tras sesji
nadal używają `openai-codex/*`. `openclaw doctor --fix` przepisuje te trasy
na:

- `openai/<model>`
- `agentRuntime.id: "codex"`, gdy Codex jest zainstalowany, włączony, dostarcza
  mechanizm `codex` i ma używalne OAuth
- `agentRuntime.id: "pi"` w przeciwnym razie

Trasa `codex` wymusza natywny mechanizm Codex. Trasa `pi` utrzymuje
agenta na domyślnym runnerze OpenClaw zamiast włączać lub instalować Codex jako
efekt uboczny czyszczenia starszej trasy.
Doctor naprawia także nieaktualne utrwalone pinezki sesji we wszystkich odkrytych magazynach sesji agentów,
aby stare rozmowy nie pozostały zablokowane na usuniętej trasie.

Wybór harness nie jest kontrolą sesji na żywo. Gdy uruchamiana jest osadzona tura,
OpenClaw zapisuje wybrany identyfikator harness w tej sesji i nadal używa go w
późniejszych turach w ramach tego samego identyfikatora sesji. Zmień konfigurację
`agentRuntime` albo `OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby przyszłe sesje
używały innego harness; użyj `/new` albo `/reset`, aby rozpocząć świeżą sesję
przed przełączeniem istniejącej rozmowy między PI i Codex. Zapobiega to
odtwarzaniu jednego transkryptu przez dwa niezgodne natywne systemy sesji.

Sesje starszego typu utworzone przed przypięciami harness są traktowane jako
przypięte do PI, gdy mają już historię transkryptu. Użyj `/new` albo `/reset`,
aby włączyć tę rozmowę do Codex po zmianie konfiguracji.

`/status` pokazuje efektywny runtime modelu. Domyślny harness PI jest widoczny
jako `Runtime: OpenClaw Pi Default`, a harness serwera aplikacji Codex jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym pluginem `codex`.
- Serwer aplikacji Codex `0.125.0` albo nowszy. Dołączony plugin domyślnie zarządza zgodnym
  plikiem binarnym serwera aplikacji Codex, więc lokalne polecenia `codex` w `PATH`
  nie wpływają na normalne uruchamianie harness.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji albo dla mostu
  uwierzytelniania Codex w OpenClaw. Lokalne uruchomienia serwera aplikacji stdio używają
  zarządzanego przez OpenClaw katalogu domowego Codex dla każdego agenta oraz izolowanego
  podrzędnego `HOME`, więc domyślnie nie odczytują Twojego osobistego
  konta, Skills, pluginów, konfiguracji, stanu wątków ani natywnego
  `$HOME/.agents/skills` z `~/.codex`.

Plugin blokuje starsze albo niewersjonowane uzgodnienia serwera aplikacji. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, względem której był testowany.

W testach smoke na żywo i w Dockerze uwierzytelnianie zwykle pochodzi z konta CLI Codex
albo profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia serwera
aplikacji stdio mogą też przełączyć się awaryjnie na `CODEX_API_KEY` / `OPENAI_API_KEY`,
gdy nie ma konta.

## Pliki inicjalizacji workspace

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentów projektu. OpenClaw
nie zapisuje syntetycznych plików dokumentów projektu Codex ani nie polega na zapasowych
nazwach plików Codex dla plików persony, ponieważ mechanizmy zapasowe Codex mają
zastosowanie tylko wtedy, gdy brakuje `AGENTS.md`.

Aby zachować parzystość workspace OpenClaw, harness Codex rozwiązuje pozostałe pliki
inicjalizacji (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` oraz `MEMORY.md`, jeśli istnieją) i przekazuje je przez instrukcje
deweloperskie Codex w `thread/start` i `thread/resume`. Dzięki temu `SOUL.md` oraz
powiązany kontekst persony/profilu workspace pozostają widoczne na natywnej ścieżce
Codex kształtującej zachowanie, bez duplikowania `AGENTS.md`.

## Dodawanie Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent ma swobodnie przełączać się
między Codex i modelami dostawców innych niż Codex. Wymuszony runtime ma zastosowanie do każdej
osadzonej tury tego agenta lub tej sesji. Jeśli wybierzesz model Anthropic, gdy
ten runtime jest wymuszony, OpenClaw nadal spróbuje harness Codex i zakończy działanie
błędem zamiast po cichu kierować tę turę przez PI.

Zamiast tego użyj jednej z tych form:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta na `agentRuntime.id: "auto"` i zapasowym PI dla normalnego mieszanego
  użycia dostawców.
- Używaj starszych odwołań `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` oraz jawną politykę runtime Codex.

Na przykład ta konfiguracja pozostawia domyślnego agenta przy normalnym automatycznym wyborze i
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

W tej formie:

- Domyślny agent `main` używa normalnej ścieżki dostawcy oraz zapasowej zgodności PI.
- Agent `codex` używa harness serwera aplikacji Codex.
- Jeśli Codex jest niedostępny albo nieobsługiwany dla agenta `codex`, tura kończy się
  błędem zamiast po cichu używać PI.

## Routing poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, nie tylko według słowa „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                           |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Powiąż ten czat z Codex”                              | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                    | `/codex threads`                                 |
| „Zgłoś raport wsparcia dotyczący złego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij opinię Codex tylko dla tego załączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj mojej subskrypcji ChatGPT/Codex z runtime Codex” | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Napraw stare przypięcia konfiguracji/sesji `openai-codex/*`” | `openclaw doctor --fix`                          |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` i nie natywne podagenty |

OpenClaw reklamuje agentom wskazówki uruchamiania ACP tylko wtedy, gdy ACP jest włączone,
możliwe do wywołania i obsługiwane przez załadowany backend runtime. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills pluginu nie powinny uczyć agenta routingu ACP.

## Wdrożenia tylko z Codex

Wymuś harness Codex, gdy musisz udowodnić, że każda osadzona tura agenta
używa Codex. Jawne runtime pluginu kończą się błędem i nigdy nie są po cichu ponawiane
przez PI:

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
}
```

Nadpisanie środowiskowe:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Przy wymuszonym Codex OpenClaw wcześnie kończy się błędem, jeśli plugin Codex jest wyłączony,
serwer aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić.

## Codex dla poszczególnych agentów

Możesz uczynić jednego agenta wyłącznie Codex, podczas gdy domyślny agent zachowuje normalny
automatyczny wybór:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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

Używaj normalnych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy świeżą
sesję OpenClaw, a harness Codex tworzy lub wznawia swój boczny wątek serwera aplikacji
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnej turze ponownie rozwiązać harness z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie plugin Codex pyta serwer aplikacji o dostępne modele. Jeśli
wykrywanie nie powiedzie się albo przekroczy limit czasu, używa dołączonego katalogu zapasowego dla:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Możesz dostroić wykrywanie w `plugins.entries.codex.config.discovery`:

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

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i pozostało przy
katalogu zapasowym:

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

## Połączenie i polityka serwera aplikacji

Domyślnie plugin uruchamia lokalnie zarządzany przez OpenClaw plik binarny Codex za pomocą:

```bash
codex app-server --listen stdio://
```

Zarządzany plik binarny jest dostarczany z pakietem pluginu `codex`. Dzięki temu
wersja serwera aplikacji jest powiązana z dołączonym pluginem, a nie z dowolnym osobnym
CLI Codex zainstalowanym lokalnie. Ustaw `appServer.command` tylko wtedy,
gdy celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje harness Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana lokalna postawa operatora używana
dla autonomicznych Heartbeat: Codex może używać narzędzi powłoki i sieci bez
zatrzymywania się na natywnych promptach zatwierdzeń, na które nikt nie może odpowiedzieć.

Aby włączyć zatwierdzenia oceniane przez strażnika Codex, ustaw `appServer.mode:
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

Tryb Guardian używa natywnej ścieżki automatycznej oceny zatwierdzeń Codex. Gdy Codex prosi o
opuszczenie sandbox, zapis poza workspace albo dodanie uprawnień takich jak dostęp do sieci,
Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do promptu dla człowieka.
Recenzent stosuje ramy ryzyka Codex i zatwierdza albo odrzuca konkretne żądanie.
Używaj Guardian, gdy chcesz mieć więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą łączyć
preset z jawnymi wyborami. Starsza wartość recenzenta `guardian_subagent` jest
nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać
`auto_review`.

Dla już uruchomionego serwera aplikacji użyj transportu WebSocket:

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
`CODEX_HOME`, jak i `HOME` na katalogi poszczególnych agentów w stanie OpenClaw
tego agenta. Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` oraz
`$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień
serwera aplikacji. Dzięki temu natywne Skills, pluginy, konfiguracja, konta i stan wątków
Codex są ograniczone do agenta OpenClaw zamiast przenikać z osobistego katalogu domowego
CLI Codex operatora.

Pluginy OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny
rejestr pluginów i loader Skills OpenClaw. Osobiste zasoby CLI Codex nie przepływają.
Jeśli masz przydatne Skills albo pluginy CLI Codex, które powinny stać się częścią agenta OpenClaw,
zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego workspace agenta OpenClaw.
Natywne pluginy, hooki i pliki konfiguracyjne Codex są raportowane albo archiwizowane
do ręcznego przeglądu zamiast automatycznej aktywacji, ponieważ mogą
wykonywać polecenia, wystawiać serwery MCP albo przenosić dane uwierzytelniające.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie OpenAI
   jest nadal wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu podrzędnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla osadzeń lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych tur serwera aplikacji Codex przez API.
Jawne profile kluczy API Codex i lokalny fallback klucza środowiskowego stdio używają logowania
serwera aplikacji zamiast dziedziczonego środowiska procesu podrzędnego. Połączenia WebSocket
serwera aplikacji nie otrzymują fallbacku klucza API ze środowiska Gateway; użyj jawnego profilu uwierzytelniania albo
własnego konta zdalnego serwera aplikacji.

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

`appServer.clearEnv` wpływa tylko na uruchamiany proces podrzędny serwera aplikacji Codex.

Dynamiczne narzędzia Codex domyślnie używają profilu `native-first`. W tym trybie
OpenClaw nie udostępnia dynamicznych narzędzi, które duplikują natywne operacje Codex na obszarze roboczym:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` i
`update_plan`. Narzędzia integracyjne OpenClaw, takie jak komunikacja, sesje, media,
cron, przeglądarka, węzły, gateway, `heartbeat_respond` i `web_search`, pozostają
dostępne.

Obsługiwane pola najwyższego poziomu pluginu Codex:

| Pole                       | Domyślnie        | Znaczenie                                                                                 |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Użyj `"openclaw-compat"`, aby udostępnić pełny zestaw dynamicznych narzędzi OpenClaw serwerowi aplikacji Codex. |
| `codexDynamicToolsExclude` | `[]`             | Dodatkowe nazwy dynamicznych narzędzi OpenClaw pomijane w turach serwera aplikacji Codex.  |

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                                                                                                                                             |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                           |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustawiaj tylko jako jawne nadpisanie.                                                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                       |
| `url`               | nieustawione                             | URL WebSocket serwera aplikacji.                                                                                                                                                                                                      |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchamianego procesu serwera aplikacji stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent OpenClaw przy lokalnych uruchomieniach. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                                                     |
| `mode`              | `"yolo"`                                 | Ustawienie wstępne dla wykonywania YOLO lub z przeglądem guardiana.                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy starcie/wznowieniu/turze wątku.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb piaskownicy Codex wysyłany przy starcie/wznowieniu wątku.                                                                                                                                                                |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby Codex przeglądał natywne monity zatwierdzeń. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                |
| `serviceTier`       | nieustawione                             | Opcjonalna warstwa usługi serwera aplikacji Codex: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                      |

Wywołania dynamicznych narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia,
gdy jest to obsługiwane, i zwraca nieudaną odpowiedź dynamicznego narzędzia do Codex, aby
tura mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie serwera aplikacji Codex ograniczone do tury, harness
oczekuje też, że Codex zakończy natywną turę komunikatem `turn/completed`. Jeśli
serwer aplikacji milczy przez 60 sekund po tej odpowiedzi, OpenClaw w trybie best-effort
przerywa turę Codex, zapisuje diagnostyczne przekroczenie limitu czasu i zwalnia pas sesji
OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za przestarzałą
natywną turą.

Nadpisania środowiska pozostają dostępne do testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego testowania lokalnego. Konfiguracja jest
preferowana w powtarzalnych wdrożeniach, ponieważ utrzymuje zachowanie pluginu w tym samym
przeglądanym pliku co reszta konfiguracji harnessu Codex.

## Korzystanie z komputera

Korzystanie z komputera opisuje osobny przewodnik konfiguracji:
[Korzystanie z komputera w Codex](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji do sterowania pulpitem ani samodzielnie nie wykonuje
akcji na pulpicie. Przygotowuje serwer aplikacji Codex, sprawdza, czy
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex obsługiwać natywne
wywołania narzędzi MCP podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace Codex, zarejestruj
`cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Korzystanie z komputera w Codex](/pl/plugins/codex-computer-use), aby poznać różnicę
między Korzystaniem z komputera należącym do Codex a bezpośrednią rejestracją MCP.

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

Korzystanie z komputera jest specyficzne dla macOS i może wymagać lokalnych uprawnień systemu operacyjnego, zanim
serwer MCP Codex będzie mógł sterować aplikacjami. Jeśli `computerUse.enabled` ma wartość true, a serwer MCP
jest niedostępny, tury w trybie Codex kończą się niepowodzeniem przed startem wątku zamiast
po cichu działać bez natywnych narzędzi Korzystania z komputera. Zobacz
[Korzystanie z komputera w Codex](/pl/plugins/codex-computer-use), aby poznać wybory marketplace,
limity zdalnego katalogu, powody statusów i rozwiązywanie problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować standardowy
dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` albo `/reset` po
zmianie konfiguracji środowiska uruchomieniowego lub Korzystania z komputera, aby istniejące sesje nie zachowywały starego
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

Walidacja harnessu tylko dla Codex:

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

Zatwierdzenia Codex z przeglądem guardiana:

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

Zdalny serwer aplikacji z jawnymi nagłówkami:

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

Przełączanie modeli pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw jest dołączona
do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany
model OpenAI, dostawcę, politykę zatwierdzania, piaskownicę i warstwę usługi do
serwera aplikacji. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje
powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony plugin rejestruje `/codex` jako autoryzowane polecenie ukośnikowe. Jest
ogólne i działa w każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje łączność z serwerem aplikacji na żywo, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla modele serwera aplikacji Codex na żywo.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany Plugin Computer Use i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany Plugin Computer Use i przeładowuje serwery MCP.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwera MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

Gdy Codex zgłasza błąd limitu użycia, OpenClaw dołącza następny czas resetowania
serwera aplikacji, jeśli Codex go podał. Użyj `/codex account` w tej samej
rozmowie, aby sprawdzić bieżące konto i okna limitów szybkości.

### Typowy przepływ debugowania

Gdy agent oparty na Codex zrobi coś zaskakującego w Telegram, Discord, Slack
lub innym kanale, zacznij od rozmowy, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką notatkę
   opisującą to, co zaobserwowano.
2. Zatwierdź żądanie diagnostyki jeden raz. Zatwierdzenie tworzy lokalny plik zip
   diagnostyki Gateway i, ponieważ sesja używa mechanizmu Codex, wysyła także
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu lub wątku pomocy.
   Zawiera ona ścieżkę lokalnego pakietu, podsumowanie prywatności, identyfikatory sesji OpenClaw,
   identyfikatory wątków Codex oraz wiersz `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować uruchomienie, uruchom wypisane polecenie `Inspect locally`
   w terminalu. Wygląda ono jak `codex resume <thread-id>` i otwiera
   natywny wątek Codex, aby można było sprawdzić rozmowę, kontynuować ją lokalnie
   albo zapytać Codex, dlaczego wybrał dane narzędzie lub plan.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego
OpenClaw Gateway. W przypadku większości zgłoszeń do pomocy `/diagnostics [note]` jest
lepszym punktem wyjścia, ponieważ łączy lokalny stan Gateway i identyfikatory
wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics),
aby poznać pełny model prywatności i zachowanie na czacie grupowym.

Rdzeń OpenClaw udostępnia także właścicielską komendę `/diagnostics [note]` jako ogólną
komendę diagnostyczną Gateway. Jej monit zatwierdzenia pokazuje preambułę dotyczącą danych wrażliwych,
linkuje do [Eksportu diagnostyki](/pl/gateway/diagnostics) i za każdym razem żąda
`openclaw gateway diagnostics export --json` przez jawne zatwierdzenie wykonania.
Nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu
OpenClaw wysyła raport gotowy do wklejenia ze ścieżką lokalnego pakietu i
podsumowaniem manifestu. Gdy aktywna sesja OpenClaw używa mechanizmu Codex, to
samo zatwierdzenie autoryzuje także wysłanie odpowiednich pakietów opinii Codex na
serwery OpenAI. Monit zatwierdzenia informuje, że opinia Codex zostanie wysłana, ale
nie pokazuje identyfikatorów sesji ani wątków Codex przed zatwierdzeniem.

Jeśli `/diagnostics` zostanie wywołane przez właściciela na czacie grupowym, OpenClaw utrzymuje
współdzielony kanał w porządku: grupa otrzymuje tylko krótkie powiadomienie, natomiast
preambuła diagnostyczna, monity zatwierdzenia oraz identyfikatory sesji/wątków Codex są wysyłane do
właściciela prywatną ścieżką zatwierdzania. Jeśli nie ma prywatnej ścieżki do właściciela,
OpenClaw odrzuca żądanie grupowe i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` serwera aplikacji Codex i prosi
serwer aplikacji o dołączenie logów dla każdego wymienionego wątku oraz utworzonych podwątków Codex,
gdy są dostępne. Przesyłanie odbywa się normalną ścieżką opinii Codex na serwery OpenAI;
jeśli opinie Codex są wyłączone w tym serwerze aplikacji, komenda zwraca
błąd serwera aplikacji. Ukończona odpowiedź diagnostyczna wymienia kanały,
identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne komendy `codex resume <thread-id>`
dla wysłanych wątków. Jeśli odmówisz zatwierdzenia lub je zignorujesz,
OpenClaw nie wypisze tych identyfikatorów Codex. To przesłanie nie zastępuje lokalnego
eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam pomocniczy plik wiązania, którego mechanizm używa dla
zwykłych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje
aktualnie wybrany model OpenClaw do serwera aplikacji i pozostawia włączoną
rozszerzoną historię.

### Sprawdzanie wątku Codex z CLI

Najszybszym sposobem zrozumienia nieudanego uruchomienia Codex jest często bezpośrednie otwarcie
natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w rozmowie na kanale i chcesz sprawdzić
problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego dokonał
konkretnego wyboru narzędzia lub rozumowania. Najłatwiej zwykle najpierw uruchomić
`/diagnostics [note]`: po zatwierdzeniu ukończony raport wyświetla
każdy wątek Codex i wypisuje komendę `Inspect locally`, na przykład
`codex resume <thread-id>`. Możesz skopiować tę komendę bezpośrednio do terminala.

Możesz także uzyskać identyfikator wątku z `/codex binding` dla bieżącego czatu albo
`/codex threads [filter]` dla ostatnich wątków serwera aplikacji Codex, a następnie uruchomić tę samą
komendę `codex resume` w powłoce.

Powierzchnia komend wymaga serwera aplikacji Codex `0.125.0` lub nowszego. Poszczególne
metody sterujące są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy serwer aplikacji nie udostępnia danej metody JSON-RPC.

## Granice hooków

Mechanizm Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel              | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                 | Zgodność produktu/Plugin między mechanizmami PI i Codex.            |
| Middleware rozszerzeń serwera aplikacji Codex | Pluginy dołączone do OpenClaw | Zachowanie adaptera na turę wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania
zachowaniem Plugin OpenClaw. Dla obsługiwanego mostu natywnych narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex dla wątku dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`. Gdy zatwierdzenia serwera aplikacji Codex są włączone
(`approvalPolicy` nie ma wartości `"never"`), domyślna wstrzykiwana konfiguracja natywnych hooków
pomija `PermissionRequest`, aby recenzent serwera aplikacji Codex i most zatwierdzeń OpenClaw
obsługiwały rzeczywiste eskalacje po przeglądzie. Operatorzy mogą nadal jawnie dodać
`permission_request` do `nativeHookRelay.events`, gdy potrzebują przekaźnika zgodności.
Inne hooki Codex, takie jak `SessionStart` i `UserPromptSubmit`, pozostają
kontrolkami na poziomie Codex; nie są udostępniane jako hooki Plugin OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw, OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie Plugin i middleware, których jest właścicielem w
adapterze mechanizmu. W przypadku narzędzi natywnych Codex to Codex jest właścicielem kanonicznego rekordu narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępni taką operację przez serwer aplikacji lub wywołania zwrotne natywnych hooków.

Projekcje cyklu życia Compaction i LLM pochodzą z powiadomień serwera aplikacji Codex
oraz stanu adaptera OpenClaw, a nie z natywnych komend hooków Codex.
Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie przechwyceniami bajt po bajcie
wewnętrznego żądania Codex ani ładunków Compaction.

Natywne powiadomienia serwera aplikacji Codex `hook/started` i `hook/completed` są
rzutowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania.
Nie wywołują hooków Plugin OpenClaw.

## Kontrakt obsługi V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex jest właścicielem większej części
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji
wokół tej granicy.

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Obszar                                        | Obsługa                                                                              | Dlaczego                                                                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                                                                          | Serwer aplikacji Codex obsługuje turę OpenAI, natywne wznawianie wątku i natywną kontynuację narzędzi.                                                                                                    |
| Routing i dostarczanie kanałów OpenClaw       | Obsługiwane                                                                          | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem wykonawczym modelu.                                                                                                |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                                                                          | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                             |
| Pluginy promptów i kontekstu                  | Obsługiwane                                                                          | OpenClaw buduje nakładki promptów i przekazuje kontekst do tury Codex przed rozpoczęciem lub wznowieniem wątku.                                                                                           |
| Cykl życia silnika kontekstu                  | Obsługiwane                                                                          | Składanie, pobieranie lub konserwacja po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                      |
| Hooki narzędzi dynamicznych                   | Obsługiwane                                                                          | `before_tool_call`, `after_tool_call` oraz oprogramowanie pośredniczące wyników narzędzi działają wokół dynamicznych narzędzi należących do OpenClaw.                                                     |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera                                                 | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z poprawnymi ładunkami trybu Codex.                                                                       |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez natywny przekaźnik hooków                                          | Codex `Stop` jest przekazywane do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                        |
| Natywna powłoka, poprawka i MCP blokuj lub obserwuj | Obsługiwane przez natywny przekaźnik hooków                                          | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP w serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie jest. |
| Natywna polityka uprawnień                    | Obsługiwane przez zatwierdzenia serwera aplikacji Codex i zgodnościowy natywny przekaźnik hooków | Żądania zatwierdzenia serwera aplikacji Codex są kierowane przez OpenClaw po przeglądzie Codex. Natywny przekaźnik hooka `PermissionRequest` jest opcjonalny dla natywnych trybów zatwierdzania, ponieważ Codex emituje go przed przeglądem przez strażnika. |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                                                                          | OpenClaw zapisuje żądanie wysłane do serwera aplikacji i otrzymywane przez siebie powiadomienia serwera aplikacji.                                                                                        |

Nieobsługiwane w środowisku wykonawczym Codex v1:

| Obszar                                              | Granica V1                                                                                                                                       | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Mutowanie argumentów natywnych narzędzi             | Natywne hooki Codex przed użyciem narzędzia mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych dla Codex.                 | Wymaga obsługi hooków/schematu Codex dla zastępczych danych wejściowych narzędzia.        |
| Edytowalna natywna historia transkrypcji Codex      | Codex posiada kanoniczną natywną historię wątku. OpenClaw posiada kopię lustrzaną i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodaj jawne API serwera aplikacji Codex, jeśli potrzebna jest operacja na natywnym wątku. |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hook przekształca zapisy transkrypcji należące do OpenClaw, a nie rekordy narzędzi natywnych dla Codex.                                     | Można tworzyć kopię lustrzaną przekształconych rekordów, ale kanoniczne przepisywanie wymaga obsługi przez Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction w Codex.                                             |
| Interwencja w Compaction                            | Obecne hooki Compaction w OpenClaw w trybie Codex mają poziom powiadomień.                                                                       | Dodaj hooki przed/po Compaction w Codex, jeśli pluginy muszą wetować lub przepisywać natywną Compaction. |
| Przechwytywanie żądań API modelu bajt po bajcie     | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex wewnętrznie buduje końcowe żądanie API OpenAI.           | Wymaga zdarzenia śledzenia żądań modelu Codex lub debug API.                              |

## Narzędzia, media i Compaction

Uprząż Codex zmienia tylko niskopoziomowy osadzony executor agenta.

OpenClaw nadal buduje listę narzędzi i otrzymuje wyniki narzędzi dynamicznych z
uprzęży. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi komunikacyjnych nadal przechodzą przez zwykłą ścieżkę dostarczania
OpenClaw.

Natywny przekaźnik hooków jest celowo ogólny, ale kontrakt obsługi v1 jest
ograniczony do ścieżek natywnych narzędzi i uprawnień Codex, które testuje
OpenClaw. W środowisku wykonawczym Codex obejmuje to powłokę, poprawkę i ładunki
MCP `PreToolUse`, `PostToolUse` oraz `PermissionRequest`. Nie zakładaj, że każde
przyszłe zdarzenie hooka Codex jest powierzchnią pluginu OpenClaw, dopóki kontrakt
środowiska wykonawczego go nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy tylko
wtedy, gdy decyduje polityka. Wynik bez decyzji nie jest zezwoleniem. Codex
traktuje go jako brak decyzji hooka i przechodzi do własnej ścieżki strażnika lub
zatwierdzenia użytkownika. Tryby zatwierdzania serwera aplikacji Codex domyślnie
pomijają ten natywny hook; ten akapit ma zastosowanie, gdy `permission_request`
jest jawnie uwzględnione w `nativeHookRelay.events` albo instaluje je zgodnościowe
środowisko wykonawcze.
Gdy operator wybiera `allow-always` dla natywnego żądania uprawnień Codex,
OpenClaw zapamiętuje dokładny odcisk provider/sesja/narzędzie dane wejściowe/cwd
dla ograniczonego okna sesji. Zapamiętana decyzja jest celowo tylko dokładnym
dopasowaniem: zmienione polecenie, argumenty, ładunek narzędzia lub cwd tworzą
nowe zatwierdzenie.

Elicytacje zatwierdzania narzędzi MCP Codex są kierowane przez przepływ
zatwierdzania pluginów OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind`
jako `"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do
źródłowego czatu, a następna zakolejkowana wiadomość uzupełniająca odpowiada na
to natywne żądanie serwera, zamiast być kierowana jako dodatkowy kontekst. Inne
żądania elicytacji MCP nadal kończą się zamknięciem z odmową.

Sterowanie kolejką aktywnego uruchomienia mapuje się na serwer aplikacji Codex
`turn/steer`. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje
zakolejkowane wiadomości czatu dla skonfigurowanego okna ciszy i wysyła je jako
jedno żądanie `turn/steer` w kolejności nadejścia. Starszy tryb `queue` wysyła
osobne żądania `turn/steer`. Przegląd Codex i ręczne tury Compaction mogą odrzucić
sterowanie w tej samej turze; w takim przypadku OpenClaw używa kolejki
uzupełniającej, gdy wybrany tryb pozwala na fallback. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa uprzęży Codex, natywna Compaction wątku jest delegowana
do serwera aplikacji Codex. OpenClaw utrzymuje kopię lustrzaną transkrypcji dla
historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania
modelu lub uprzęży. Kopia lustrzana obejmuje prompt użytkownika, końcowy tekst
asystenta oraz lekkie rekordy rozumowania lub planu Codex, gdy serwer aplikacji
je emituje. Obecnie OpenClaw zapisuje tylko sygnały rozpoczęcia i zakończenia
natywnej Compaction. Nie udostępnia jeszcze czytelnego dla człowieka podsumowania
Compaction ani audytowalnej listy wpisów, które Codex zachował po Compaction.

Ponieważ Codex posiada kanoniczny natywny wątek, `tool_result_persist` obecnie
nie przepisuje rekordów wyników narzędzi natywnych Codex. Ma zastosowanie tylko
wtedy, gdy OpenClaw zapisuje wynik narzędzia transkrypcji sesji należącej do
OpenClaw.

Generowanie mediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS i rozumienie
mediów nadal używają pasujących ustawień providera/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` oraz
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły provider `/model`:** jest to oczekiwane w
nowych konfiguracjach. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (lub starszy ref `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
zgodnościowego backendu, gdy żadna uprząż Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania.
Wymuszone środowisko wykonawcze Codex kończy się niepowodzeniem zamiast wracać
do PI. Po wybraniu serwera aplikacji Codex jego błędy są pokazywane bezpośrednio.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby uzgadnianie serwera
aplikacji raportowało wersję `0.125.0` lub nowszą. Wersje przedpremierowe tej
samej wersji lub wersje z sufiksem kompilacji, takie jak `0.125.0-alpha.2` lub
`0.125.0+custom`, są odrzucane, ponieważ stabilny próg protokołu `0.125.0` jest
tym, co testuje OpenClaw.

**Wykrywanie modeli jest wolne:** obniż `plugins.entries.codex.config.discovery.timeoutMs`
lub wyłącz wykrywanie.

**Transport WebSocket natychmiast kończy się niepowodzeniem:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny serwer aplikacji mówi tą samą wersją protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** jest to oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starszy ref
`codex/*`. Zwykłe `openai/gpt-*` i inne refy providerów pozostają na swojej
normalnej ścieżce providera w trybie `auto`. Jeśli wymusisz
`agentRuntime.id: "codex"`, każda osadzona tura dla tego agenta musi być modelem
OpenAI obsługiwanym przez Codex.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` w świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem nadal występuje, uruchom ponownie
Gateway, aby wyczyścić nieaktualne rejestracje natywnych hooków. Jeśli `computer-use.list_apps`
przekroczy limit czasu, uruchom ponownie Codex Computer Use lub Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy uprzęży agentów](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Hooki Plugin](/pl/plugins/hooks)
- [Informacje o konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
