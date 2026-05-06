---
read_when:
    - Chcesz użyć dołączonego środowiska uruchomieniowego Codex app-server
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia wyłącznie z Codexem kończyły się niepowodzeniem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pośrednictwem dołączonego mechanizmu serwera aplikacji Codex
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-05-06T09:23:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
serwer aplikacji Codex zamiast wbudowanego mechanizmu PI.

Użyj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
wykrywaniem modeli, natywnym wznawianiem wątku, natywną kompakcją i wykonywaniem
przez serwer aplikacji. OpenClaw nadal zarządza kanałami czatu, plikami sesji,
wyborem modelu, narzędziami, zatwierdzeniami, dostarczaniem mediów i widocznym
lustrzanym zapisem transkrypcji.

Gdy tura czatu źródłowego działa przez mechanizm Codex, widoczne odpowiedzi
domyślnie używają narzędzia OpenClaw `message`, jeśli wdrożenie nie skonfigurowało
jawnie `messages.visibleReplies`. Agent nadal może zakończyć swoją turę Codex
prywatnie; publikuje w kanale tylko wtedy, gdy wywoła `message(action="send")`.
Ustaw `messages.visibleReplies: "automatic"`, aby zachować końcowe odpowiedzi
czatu bezpośredniego na starszej automatycznej ścieżce dostarczania.

Tury Heartbeat Codex domyślnie otrzymują również narzędzie `heartbeat_respond`,
dzięki czemu agent może zapisać, czy wybudzenie ma pozostać ciche, czy wysłać
powiadomienie, bez kodowania tego przepływu sterowania w tekście końcowym.

Wskazówki dotyczące inicjatywy specyficzne dla Heartbeat są wysyłane jako
instrukcja deweloperska trybu współpracy Codex w samej turze Heartbeat. Zwykłe
tury czatu przywracają tryb Codex Default zamiast przenosić filozofię Heartbeat
w swoim normalnym prompcie środowiska uruchomieniowego.

Jeśli próbujesz się zorientować, zacznij od
[środowisk uruchomieniowych agenta](/pl/concepts/agent-runtimes). W skrócie:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Większość użytkowników, którzy chcą „Codex w OpenClaw”, oczekuje tej ścieżki:
zalogować się przy użyciu subskrypcji ChatGPT/Codex, a następnie uruchamiać
osadzone tury agenta przez natywne środowisko uruchomieniowe serwera aplikacji
Codex. Referencja modelu nadal pozostaje kanoniczna jako `openai/gpt-*`;
uwierzytelnianie subskrypcji pochodzi z konta/profilu Codex, a nie z prefiksu
modelu `openai-codex/*`.

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

Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij tam również `codex`:

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

Nie używaj `openai-codex/gpt-*` w konfiguracji. Ten prefiks to starsza ścieżka,
którą `openclaw doctor --fix` przepisuje na `openai/gpt-*` we wszystkich modelach
głównych, modelach zastępczych, nadpisaniach Heartbeat/subagenta/kompakcji,
hookach, nadpisaniach kanałów i nieaktualnych utrwalonych przypięciach ścieżek
sesji.

## Co zmienia ten Plugin

Dołączony Plugin `codex` udostępnia kilka oddzielnych możliwości:

| Możliwość                         | Jak jej używasz                                      | Co robi                                                                        |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywne osadzone środowisko uruchomieniowe | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez serwer aplikacji Codex.         |
| Natywne polecenia sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże wątki serwera aplikacji Codex z rozmową komunikatora i steruje nimi.    |
| Dostawca/katalog serwera aplikacji Codex | elementy wewnętrzne `codex`, udostępniane przez mechanizm | Pozwala środowisku uruchomieniowemu wykrywać i weryfikować modele serwera aplikacji. |
| Ścieżka rozumienia mediów Codex   | ścieżki zgodności modeli obrazów `codex/*`          | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik hooków         | Hooki Pluginu wokół natywnych zdarzeń Codex         | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie Pluginu udostępnia te możliwości. **Nie** powoduje to:

- używania Codex dla każdego modelu OpenAI
- konwertowania referencji modeli `openai-codex/*` na natywne środowisko
  uruchomieniowe bez weryfikacji przez doctor, że Codex jest zainstalowany,
  włączony, dostarcza mechanizm `codex` i jest gotowy do OAuth
- ustawienia ACP/acpx jako domyślnej ścieżki Codex
- przełączania na gorąco istniejących sesji, które już zarejestrowały środowisko
  uruchomieniowe PI
- zastąpienia dostarczania kanałów OpenClaw, plików sesji, przechowywania profili
  uwierzytelniania ani routingu wiadomości

Ten sam Plugin jest również właścicielem natywnej powierzchni poleceń sterowania
czatem `/codex`. Jeśli Plugin jest włączony, a użytkownik prosi o powiązanie,
wznowienie, sterowanie, zatrzymanie lub sprawdzenie wątków Codex z czatu, agenci
powinni preferować `/codex ...` zamiast ACP. ACP pozostaje jawną ścieżką awaryjną,
gdy użytkownik prosi o ACP/acpx albo testuje adapter ACP Codex.

Natywne tury Codex zachowują hooki Pluginu OpenClaw jako publiczną warstwę
zgodności. Są to hooki OpenClaw działające w procesie, a nie hooki poleceń
Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkrypcji
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą również rejestrować neutralne względem środowiska uruchomieniowego
oprogramowanie pośredniczące wyników narzędzi, aby przepisywać dynamiczne wyniki
narzędzi OpenClaw po wykonaniu narzędzia przez OpenClaw i przed zwróceniem wyniku
do Codex. Jest to oddzielne od publicznego hooka Pluginu
`tool_result_persist`, który przekształca zapisy wyników narzędzi w transkrypcji
należącej do OpenClaw.

Semantykę samych hooków Pluginu opisują [hooki Pluginu](/pl/plugins/hooks) oraz
[zachowanie strażnika Pluginu](/pl/tools/plugin).

Mechanizm jest domyślnie wyłączony. Nowe konfiguracje powinny zachować referencje
modeli OpenAI w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`, gdy wymagają
natywnego wykonywania przez serwer aplikacji. Starsze referencje modeli `codex/*`
nadal automatycznie wybierają mechanizm ze względu na zgodność, ale starsze
prefiksy dostawców obsługiwane przez środowisko uruchomieniowe nie są pokazywane
jako normalne wybory modeli/dostawców.

Jeśli jakakolwiek skonfigurowana ścieżka modelu nadal ma postać `openai-codex/*`,
`openclaw doctor --fix` przepisuje ją na `openai/*`. Dla pasujących ścieżek
agentów ustawia środowisko uruchomieniowe agenta na `codex` tylko wtedy, gdy
Plugin Codex jest zainstalowany, włączony, dostarcza mechanizm `codex` i ma
działające OAuth; w przeciwnym razie ustawia środowisko uruchomieniowe na `pi`.

## Mapa ścieżek

Użyj tej tabeli przed zmianą konfiguracji:

| Oczekiwane zachowanie                               | Referencja modelu          | Konfiguracja środowiska uruchomieniowego | Ścieżka uwierzytelniania/profilu | Oczekiwana etykieta statusu    |
| ---------------------------------------------------- | -------------------------- | ---------------------------------------- | -------------------------------- | ------------------------------ |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`               | Codex OAuth lub konto Codex      | `Runtime: OpenAI Codex`        |
| OpenAI API przez normalny runner OpenClaw            | `openai/gpt-*`             | pominięte albo `runtime: "pi"`           | Klucz OpenAI API                 | `Runtime: OpenClaw Pi Default` |
| Starsza konfiguracja wymagająca naprawy doctor       | `openai-codex/gpt-*`       | naprawione do `codex` albo `pi`          | Istniejące skonfigurowane uwierzytelnianie | Sprawdź ponownie po `doctor --fix` |
| Mieszani dostawcy z konserwatywnym trybem automatycznym | referencje specyficzne dla dostawcy | `agentRuntime.id: "auto"`                | Według wybranego dostawcy        | Zależy od wybranego środowiska uruchomieniowego |
| Jawna sesja adaptera Codex ACP                       | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"`      | Uwierzytelnianie backendu ACP    | Status zadania/sesji ACP       |

Ważny podział to dostawca kontra środowisko uruchomieniowe:

- `openai-codex/*` to starsza ścieżka, którą doctor przepisuje.
- `agentRuntime.id: "codex"` wymaga mechanizmu Codex i kończy się zamkniętym
  błędem, jeśli jest niedostępny.
- `agentRuntime.id: "auto"` pozwala zarejestrowanym mechanizmom przejmować
  pasujące ścieżki dostawców, ale kanoniczne referencje OpenAI nadal należą do
  PI, chyba że mechanizm obsługuje daną parę dostawca/model.
- `/codex ...` odpowiada na pytanie „z którą natywną rozmową Codex ten czat ma
  się powiązać lub którą ma kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces mechanizmu ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Ścieżki rodziny OpenAI są zależne od prefiksu. Dla typowej konfiguracji
subskrypcji plus natywnego środowiska uruchomieniowego Codex użyj `openai/*` z
`agentRuntime.id: "codex"`. Traktuj `openai-codex/*` jako starszą konfigurację,
którą doctor powinien przepisać:

| Referencja modelu                            | Ścieżka środowiska uruchomieniowego          | Kiedy używać                                                               |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Dostawca OpenAI przez mechanizmy OpenClaw/PI | Chcesz bieżącego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Starsza ścieżka naprawiana przez doctor      | Używasz starej konfiguracji; uruchom `openclaw doctor --fix`, aby ją przepisać. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Mechanizm serwera aplikacji Codex            | Chcesz uwierzytelniania subskrypcją ChatGPT/Codex z natywnym wykonywaniem Codex. |

GPT-5.5 może pojawić się zarówno na bezpośrednich ścieżkach z kluczem API OpenAI,
jak i na ścieżkach subskrypcji Codex, jeśli Twoje konto je udostępnia. Użyj
`openai/gpt-5.5` z mechanizmem serwera aplikacji Codex dla natywnego środowiska
uruchomieniowego Codex albo `openai/gpt-5.5` bez nadpisania środowiska
uruchomieniowego Codex dla bezpośredniego ruchu z kluczem API.

Starsze referencje `codex/gpt-*` nadal są akceptowane jako aliasy zgodności.
Migracja zgodności doctor przepisuje starsze referencje środowiska uruchomieniowego
na kanoniczne referencje modeli i zapisuje politykę środowiska uruchomieniowego
oddzielnie. Nowe konfiguracje natywnego mechanizmu serwera aplikacji powinny używać
`openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai/gpt-*` dla normalnej ścieżki OpenAI oraz `codex/gpt-*`, gdy rozumienie
obrazu ma działać przez ograniczoną turę serwera aplikacji Codex. Nie używaj
`openai-codex/gpt-*`; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.
Model serwera aplikacji Codex musi deklarować obsługę wejścia obrazowego; modele
Codex tylko tekstowe kończą się błędem przed rozpoczęciem tury medialnej.

Użyj `/status`, aby potwierdzić skuteczny mechanizm bieżącej sesji. Jeśli wybór
jest zaskakujący, włącz logowanie debugowania dla podsystemu `agents/harness` i
sprawdź ustrukturyzowany rekord gatewaya `agent harness selected`. Zawiera on
identyfikator wybranego mechanizmu, powód wyboru, politykę środowiska
uruchomieniowego/awaryjną oraz, w trybie `auto`, wynik obsługi każdego kandydata
Pluginu.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy skonfigurowane referencje modeli albo utrwalony
stan ścieżek sesji nadal używają `openai-codex/*`. `openclaw doctor --fix`
przepisuje te ścieżki na:

- `openai/<model>`
- `agentRuntime.id: "codex"`, gdy Codex jest zainstalowany, włączony, dostarcza
  mechanizm `codex` i ma działające OAuth
- `agentRuntime.id: "pi"` w przeciwnym razie

Ścieżka `codex` wymusza natywny mechanizm Codex. Ścieżka `pi` utrzymuje agenta na
domyślnym runnerze OpenClaw zamiast włączać lub instalować Codex jako efekt uboczny
czyszczenia starszej ścieżki.
Doctor naprawia również nieaktualne utrwalone przypięcia sesji we wszystkich
wykrytych magazynach sesji agentów, aby stare rozmowy nie pozostały zablokowane
na usuniętej ścieżce.

Wybór mechanizmu wykonawczego nie jest kontrolą sesji na żywo. Gdy uruchamia się osadzona tura,
OpenClaw zapisuje identyfikator wybranego mechanizmu wykonawczego w tej sesji i nadal używa go dla
późniejszych tur w ramach tego samego identyfikatora sesji. Zmień konfigurację `agentRuntime` albo
`OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby przyszłe sesje używały innego mechanizmu wykonawczego;
użyj `/new` lub `/reset`, aby rozpocząć świeżą sesję przed przełączeniem istniejącej
konwersacji między PI i Codex. Zapobiega to odtwarzaniu jednego transkryptu przez
dwa niezgodne natywne systemy sesji.

Starsze sesje utworzone przed przypinaniem mechanizmu wykonawczego są traktowane jako przypięte do PI, gdy tylko
mają historię transkryptu. Użyj `/new` lub `/reset`, aby włączyć tę konwersację do
Codex po zmianie konfiguracji.

`/status` pokazuje efektywne środowisko uruchomieniowe modelu. Domyślny mechanizm wykonawczy PI jest wyświetlany jako
`Runtime: OpenClaw Pi Default`, a mechanizm wykonawczy serwera aplikacji Codex jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- Serwer aplikacji Codex `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarium serwera aplikacji Codex, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na zwykłe uruchamianie mechanizmu wykonawczego.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji albo dla mostka uwierzytelniania Codex
  w OpenClaw. Lokalne uruchomienia serwera aplikacji przez stdio używają zarządzanego przez OpenClaw katalogu domowego Codex dla każdego
  agenta oraz izolowanego potomnego `HOME`, więc domyślnie nie odczytują Twojego osobistego
  konta `~/.codex`, Skills, plugins, konfiguracji, stanu wątków ani natywnych
  `$HOME/.agents/skills`.

Plugin blokuje starsze lub niewersjonowane uzgadniania serwera aplikacji. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, względem której został przetestowany.

W testach dymnych na żywo i w Dockerze uwierzytelnianie zwykle pochodzi z konta CLI Codex
albo z profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia serwera aplikacji stdio mogą
również awaryjnie użyć `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy nie ma konta.

## Pliki inicjalizacji obszaru roboczego

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentów projektu. OpenClaw
nie zapisuje syntetycznych plików dokumentów projektu Codex ani nie polega na zapasowych
nazwach plików Codex dla plików persony, ponieważ mechanizmy zapasowe Codex mają zastosowanie tylko wtedy, gdy
brakuje `AGENTS.md`.

Dla parzystości obszaru roboczego OpenClaw mechanizm wykonawczy Codex rozwiązuje pozostałe pliki
inicjalizacyjne (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` oraz `MEMORY.md`, gdy są obecne) i przekazuje je przez instrukcje deweloperskie Codex
przy `thread/start` i `thread/resume`. Dzięki temu
`SOUL.md` oraz powiązany kontekst persony/profilu obszaru roboczego pozostają widoczne na natywnej
ścieżce kształtowania zachowania Codex bez duplikowania `AGENTS.md`.

## Dodawanie Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent powinien swobodnie przełączać się
między Codex a modelami dostawców innych niż Codex. Wymuszone środowisko uruchomieniowe ma zastosowanie do każdej
osadzonej tury dla danego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy
to środowisko uruchomieniowe jest wymuszone, OpenClaw nadal próbuje użyć mechanizmu wykonawczego Codex i zamyka się z błędem,
zamiast po cichu skierować tę turę przez PI.

Zamiast tego użyj jednego z tych kształtów:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta z `agentRuntime.id: "auto"` i zapasową zgodnością PI dla zwykłego mieszanego
  użycia dostawców.
- Używaj starszych referencji `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` plus jawną politykę środowiska uruchomieniowego Codex.

Na przykład to pozostawia domyślnego agenta przy zwykłym automatycznym wyborze i
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

Przy takim kształcie:

- Domyślny agent `main` używa zwykłej ścieżki dostawcy i zapasowej zgodności PI.
- Agent `codex` używa mechanizmu wykonawczego serwera aplikacji Codex.
- Jeśli Codex jest niedostępny lub nieobsługiwany dla agenta `codex`, tura kończy się błędem
  zamiast po cichu używać PI.

## Kierowanie poleceń agentów

Agenci powinni kierować żądania użytkownika według intencji, a nie tylko według słowa „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Przypnij ten czat do Codex”                           | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                    | `/codex threads`                                 |
| „Zgłoś raport wsparcia dla nieudanego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij opinię Codex tylko dla tego załączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj mojej subskrypcji ChatGPT/Codex ze środowiskiem uruchomieniowym Codex” | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Napraw stare przypięcia konfiguracji/sesji `openai-codex/*`” | `openclaw doctor --fix`                          |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` i nie natywne podagenty |

OpenClaw reklamuje agentom wskazówki dotyczące uruchamiania ACP tylko wtedy, gdy ACP jest włączone,
możliwe do wywołania i obsługiwane przez załadowany backend środowiska uruchomieniowego. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills Plugin nie powinny uczyć agenta o
routingu ACP.

## Wdrożenia wyłącznie Codex

Wymuś mechanizm wykonawczy Codex, gdy musisz udowodnić, że każda osadzona tura agenta
używa Codex. Jawne środowiska uruchomieniowe Plugin kończą się błędem i nigdy nie są po cichu ponawiane
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

Nadpisanie przez środowisko:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Przy wymuszonym Codex OpenClaw kończy działanie wcześnie, jeśli Plugin Codex jest wyłączony,
serwer aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić.

## Codex na agenta

Możesz uczynić jednego agenta wyłącznie Codex, podczas gdy domyślny agent zachowuje zwykły
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

Używaj zwykłych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy świeżą
sesję OpenClaw, a mechanizm wykonawczy Codex tworzy lub wznawia swój boczny wątek serwera aplikacji
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnej turze ponownie rozwiązać mechanizm wykonawczy z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacji o dostępne modele. Jeśli
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

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i trzymało się
katalogu zapasowego:

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

Domyślnie Plugin uruchamia lokalnie zarządzane przez OpenClaw binarium Codex z:

```bash
codex app-server --listen stdio://
```

Zarządzane binarium jest dostarczane z pakietem Plugin `codex`. Dzięki temu
wersja serwera aplikacji jest powiązana z dołączonym Plugin zamiast z dowolnym osobnym
CLI Codex przypadkowo zainstalowanym lokalnie. Ustaw `appServer.command` tylko wtedy,
gdy celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje mechanizmu wykonawczego Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana postawa lokalnego operatora używana
dla autonomicznych Heartbeat: Codex może używać narzędzi powłoki i sieci bez
zatrzymywania się na natywnych monitach zatwierdzeń, na które nikt nie jest obecny, by odpowiedzieć.

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

Tryb strażnika używa natywnej ścieżki automatycznej recenzji zatwierdzeń Codex. Gdy Codex prosi o
opuszczenie piaskownicy, zapis poza obszarem roboczym lub dodanie uprawnień, takich jak dostęp do sieci,
Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
monitu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza lub odmawia
konkretnego żądania. Używaj trybu strażnika, gdy chcesz więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą mieszać
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
ale OpenClaw posiada mostek kont serwera aplikacji Codex i ustawia zarówno
`CODEX_HOME`, jak i `HOME` na katalogi per agenta w stanie OpenClaw tego agenta.
Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` i
`$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień serwera aplikacji.
Dzięki temu natywne Skills, plugins, konfiguracja, konta i stan wątków Codex
pozostają w zakresie agenta OpenClaw zamiast przenikać z osobistego katalogu domowego CLI Codex
operatora.

Plugins OpenClaw oraz migawki Skills OpenClaw nadal przepływają przez własny
rejestr Plugin i loader Skills OpenClaw. Osobiste zasoby CLI Codex nie. Jeśli masz
przydatne Skills lub plugins CLI Codex, które powinny stać się częścią agenta OpenClaw,
zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego obszaru roboczego agenta OpenClaw.
Natywne plugins, hooks i pliki konfiguracyjne Codex są zgłaszane lub archiwizowane
do ręcznej recenzji zamiast być aktywowane automatycznie, ponieważ mogą
wykonywać polecenia, udostępniać serwery MCP lub przenosić dane uwierzytelniające.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio, `CODEX_API_KEY`, następnie
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw wykrywa profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddings lub bezpośrednich modeli OpenAI
bez ryzyka, że natywne tury serwera aplikacji Codex zostaną przypadkowo rozliczone przez API.
Jawne profile klucza API Codex oraz lokalny fallback klucza środowiskowego stdio używają logowania
serwera aplikacji zamiast odziedziczonego środowiska procesu potomnego. Połączenia WebSocket
serwera aplikacji nie otrzymują fallbacku klucza API ze środowiska Gateway; użyj jawnego profilu
uwierzytelniania albo własnego konta zdalnego serwera aplikacji.

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

`appServer.clearEnv` wpływa tylko na uruchamiany proces potomny serwera aplikacji Codex.

Dynamiczne narzędzia Codex domyślnie używają profilu `native-first`. W tym trybie
OpenClaw nie udostępnia narzędzi dynamicznych, które dublują natywne operacje Codex
na obszarze roboczym: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` i
`update_plan`. Narzędzia integracyjne OpenClaw, takie jak komunikacja, sesje, multimedia,
cron, przeglądarka, węzły, gateway, `heartbeat_respond` i `web_search`, pozostają
dostępne.

Obsługiwane pola najwyższego poziomu Plugin Codex:

| Pole                       | Domyślnie        | Znaczenie                                                                                 |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Użyj `"openclaw-compat"`, aby udostępnić pełny zestaw dynamicznych narzędzi OpenClaw serwerowi aplikacji Codex. |
| `codexDynamicToolsExclude` | `[]`             | Dodatkowe nazwy dynamicznych narzędzi OpenClaw pomijane w turach serwera aplikacji Codex. |

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                                                                                                                                             |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                           |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustawiaj tylko jako jawne nadpisanie.                                                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                       |
| `url`               | nieustawione                             | URL serwera aplikacji WebSocket.                                                                                                                                                                                                      |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                         |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchamianego procesu serwera aplikacji stdio po zbudowaniu przez OpenClaw odziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent w OpenClaw przy lokalnych uruchomieniach. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                                                    |
| `mode`              | `"yolo"`                                 | Preset dla wykonywania YOLO albo wykonywania recenzowanego przez guardiana.                                                                                                                                                          |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku/tury.                                                                                                                                                 |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb sandbox Codex wysyłany przy rozpoczęciu/wznowieniu wątku.                                                                                                                                                                |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby pozwolić Codex recenzować natywne monity zatwierdzania. `guardian_subagent` pozostaje starszym aliasem.                                                                                                     |
| `serviceTier`       | nieustawione                             | Opcjonalny poziom usługi serwera aplikacji Codex: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                      |

Wywołania narzędzi dynamicznych należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw przerywa
sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex odpowiedź nieudanego
narzędzia dynamicznego, aby tura mogła być kontynuowana zamiast pozostawiać sesję w stanie
`processing`.

Po odpowiedzi OpenClaw na żądanie serwera aplikacji ograniczone do tury Codex, harness
oczekuje także, że Codex zakończy natywną turę zdarzeniem `turn/completed`. Jeśli
serwer aplikacji milczy przez 60 sekund po tej odpowiedzi, OpenClaw w trybie najlepszej
próby przerywa turę Codex, zapisuje diagnostyczny limit czasu i zwalnia ścieżkę sesji
OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za nieaktualną natywną turą.

Nadpisania środowiskowe pozostają dostępne do lokalnego testowania:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` jest nieustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego lokalnego testowania. Konfiguracja
jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie Plugin w tym samym
recenzowanym pliku co resztę konfiguracji harness Codex.

## Użycie komputera

Użycie komputera omówiono w osobnym przewodniku konfiguracji:
[Użycie komputera w Codex](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie vendoryzuje aplikacji do sterowania pulpitem ani sam nie wykonuje
akcji pulpitu. Przygotowuje serwer aplikacji Codex, weryfikuje dostępność serwera MCP
`computer-use`, a następnie pozwala Codex obsługiwać natywne wywołania narzędzi MCP
podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace Codex, zarejestruj
`cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Użycie komputera w Codex](/pl/plugins/codex-computer-use), aby poznać różnicę
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

Użycie komputera jest specyficzne dla macOS i może wymagać lokalnych uprawnień systemu operacyjnego,
zanim serwer MCP Codex będzie mógł sterować aplikacjami. Jeśli `computerUse.enabled` ma wartość true,
a serwer MCP jest niedostępny, tury w trybie Codex kończą się niepowodzeniem przed rozpoczęciem wątku,
zamiast cicho działać bez natywnych narzędzi Użycia komputera. Zobacz
[Użycie komputera w Codex](/pl/plugins/codex-computer-use), aby poznać opcje marketplace,
limity zdalnego katalogu, przyczyny statusu i rozwiązywanie problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować standardowy
dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` albo `/reset` po zmianie
konfiguracji runtime lub Użycia komputera, aby istniejące sesje nie zachowywały starego
powiązania wątku PI albo Codex.

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

Walidacja harness tylko dla Codex:

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

Zatwierdzenia Codex recenzowane przez guardiana:

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
model OpenAI, dostawcę, politykę zatwierdzania, sandbox i poziom usługi do
serwera aplikacji. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje
powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane polecenie ukośnikowe. Jest
generyczne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje na żywo łączność z app-serverem, modele, konto, limity użycia, serwery MCP i Skills.
- `/codex models` wyświetla listę dostępnych na żywo modeli Codex app-server.
- `/codex threads [filter]` wyświetla listę ostatnich wątków Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi Codex app-server o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany Plugin Computer Use i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany Plugin Computer Use i przeładowuje serwery MCP.
- `/codex account` pokazuje stan konta i limitów użycia.
- `/codex mcp` wyświetla stan serwera MCP Codex app-server.
- `/codex skills` wyświetla Skills Codex app-server.

Gdy Codex zgłasza błąd limitu użycia, OpenClaw uwzględnia następny
czas resetu app-servera, jeśli Codex go podał. Użyj `/codex account` w tej samej
konwersacji, aby sprawdzić bieżące konto i okna limitów użycia.

### Typowy przepływ debugowania

Gdy agent wspierany przez Codex zrobi coś zaskakującego w Telegram, Discord, Slack,
lub innym kanale, zacznij od konwersacji, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` lub inną krótką notatkę,
   która opisuje to, co zobaczono.
2. Zatwierdź żądanie diagnostyki jeden raz. Zatwierdzenie tworzy lokalny plik zip
   diagnostyki Gateway i, ponieważ sesja używa środowiska wykonawczego Codex, wysyła też
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu lub wątku wsparcia.
   Zawiera ona ścieżkę lokalnego pakietu, podsumowanie prywatności, identyfikatory sesji OpenClaw,
   identyfikatory wątków Codex oraz wiersz `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować przebieg, uruchom wypisane polecenie `Inspect locally`
   w terminalu. Wygląda ono jak `codex resume <thread-id>` i otwiera
   natywny wątek Codex, aby można było sprawdzić konwersację, kontynuować ją lokalnie
   lub zapytać Codex, dlaczego wybrał konkretne narzędzie albo plan.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy wyraźnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego
OpenClaw Gateway. W przypadku większości zgłoszeń do wsparcia lepszym punktem wyjścia jest
`/diagnostics [note]`, ponieważ łączy lokalny stan Gateway i identyfikatory
wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics),
aby poznać pełny model prywatności i zachowanie w czacie grupowym.

Rdzeń OpenClaw udostępnia też tylko właścicielom `/diagnostics [note]` jako ogólne
polecenie diagnostyczne Gateway. Jego monit zatwierdzenia pokazuje wstęp dotyczący
danych wrażliwych, linki do [Eksportu diagnostyki](/pl/gateway/diagnostics) oraz prosi o
`openclaw gateway diagnostics export --json` przez jawne zatwierdzenie wykonania
za każdym razem. Nie zatwierdzaj diagnostyki regułą pozwalającą na wszystko. Po zatwierdzeniu
OpenClaw wysyła raport do wklejenia ze ścieżką lokalnego pakietu i podsumowaniem
manifestu. Gdy aktywna sesja OpenClaw używa środowiska wykonawczego Codex, to
samo zatwierdzenie autoryzuje także wysłanie odpowiednich pakietów opinii Codex na
serwery OpenAI. Monit zatwierdzenia informuje, że opinia Codex zostanie wysłana, ale
nie wymienia identyfikatorów sesji ani wątków Codex przed zatwierdzeniem.

Jeśli `/diagnostics` zostanie wywołane przez właściciela w czacie grupowym, OpenClaw utrzymuje
wspólny kanał w czystości: grupa otrzymuje tylko krótkie powiadomienie, a
wstęp diagnostyczny, monity zatwierdzenia oraz identyfikatory sesji/wątków Codex są wysyłane do
właściciela prywatną ścieżką zatwierdzenia. Jeśli nie ma prywatnej ścieżki do właściciela,
OpenClaw odmawia obsługi żądania grupowego i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` Codex app-server i prosi
app-server o dołączenie dzienników dla każdego wskazanego wątku oraz utworzonych podwątków Codex,
gdy są dostępne. Przesyłanie przechodzi standardową ścieżką opinii Codex na serwery OpenAI;
jeśli opinie Codex są wyłączone w tym app-serverze, polecenie zwraca
błąd app-servera. Ukończona odpowiedź diagnostyczna wymienia kanały,
identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia `codex resume <thread-id>`
dla wysłanych wątków. Jeśli odrzucisz lub zignorujesz zatwierdzenie,
OpenClaw nie wypisze tych identyfikatorów Codex. To przesłanie nie zastępuje lokalnego
eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam poboczny plik powiązania, którego środowisko wykonawcze używa dla
zwykłych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje
aktualnie wybrany model OpenClaw do app-servera i utrzymuje włączoną rozszerzoną historię.

### Sprawdzanie wątku Codex z CLI

Najszybszym sposobem zrozumienia wadliwego przebiegu Codex jest często bezpośrednie otwarcie natywnego
wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w konwersacji kanału i chcesz sprawdzić
problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego dokonał
określonego wyboru narzędzia lub rozumowania. Najłatwiejszą ścieżką jest zwykle wcześniejsze uruchomienie
`/diagnostics [note]`: po zatwierdzeniu ukończony raport wymienia
każdy wątek Codex i wypisuje polecenie `Inspect locally`, na przykład
`codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio do terminala.

Identyfikator wątku można też uzyskać z `/codex binding` dla bieżącego czatu albo
`/codex threads [filter]` dla ostatnich wątków Codex app-server, a następnie uruchomić to samo
polecenie `codex resume` w powłoce.

Powierzchnia poleceń wymaga Codex app-server `0.125.0` lub nowszego. Poszczególne
metody sterujące są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Granice hooków

Środowisko wykonawcze Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                 | Zgodność produktu/Plugin między środowiskami wykonawczymi PI i Codex. |
| Middleware rozszerzeń Codex app-server | Pluginy dołączone do OpenClaw | Zachowanie adaptera na każdą turę wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania
zachowaniem Plugin OpenClaw. Dla obsługiwanego mostka natywnych narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex na wątek dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`. Inne hooki Codex, takie jak `SessionStart` i
`UserPromptSubmit`, pozostają kontrolkami na poziomie Codex; nie są udostępniane jako
hooki Plugin OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw, OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie Plugin i middleware, które posiada, w
adapterze środowiska wykonawczego. W przypadku narzędzi natywnych Codex, Codex jest właścicielem kanonicznego rekordu narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępni tę operację przez app-server lub wywołania zwrotne natywnych hooków.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień Codex app-server
oraz stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex.
Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie bajt po bajcie przechwyconymi
wewnętrznymi żądaniami lub ładunkami Compaction Codex.

Natywne powiadomienia Codex app-server `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania.
Nie wywołują hooków Plugin OpenClaw.

## Kontrakt wsparcia V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex posiada większą część
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji
wokół tej granicy.

Obsługiwane w środowisku wykonawczym Codex v1:

| Powierzchnia                                  | Wsparcie                                | Dlaczego                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                             | Codex app-server jest właścicielem tury OpenAI, wznawiania natywnego wątku i kontynuacji natywnych narzędzi.                                                                                         |
| Trasowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem wykonawczym modelu.                                                                                           |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                        |
| Pluginy promptów i kontekstu                  | Obsługiwane                             | OpenClaw buduje nakładki promptów i projektuje kontekst do tury Codex przed rozpoczęciem lub wznowieniem wątku.                                                                                      |
| Cykl życia silnika kontekstu                  | Obsługiwane                             | Składanie, pobieranie lub konserwacja po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                 |
| Hooki narzędzi dynamicznych                   | Obsługiwane                             | `before_tool_call`, `after_tool_call` oraz middleware wyników narzędzi działają wokół dynamicznych narzędzi należących do OpenClaw.                                                                  |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` są uruchamiane z uczciwymi ładunkami trybu Codex.                                                                   |
| Bramka korekty końcowej odpowiedzi            | Obsługiwane przez przekaźnik natywnych hooków | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                  |
| Blokowanie lub obserwacja natywnej powłoki, patchy i MCP | Obsługiwane przez przekaźnik natywnych hooków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla utrwalonych powierzchni natywnych narzędzi, w tym ładunków MCP w Codex app-server `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez przekaźnik natywnych hooków | Codex `PermissionRequest` może być kierowane przez politykę OpenClaw tam, gdzie środowisko wykonawcze ją udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex kontynuuje przez swoją standardową ścieżkę strażnika lub zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii app-servera       | Obsługiwane                             | OpenClaw rejestruje żądanie wysłane do app-servera oraz otrzymywane powiadomienia app-servera.                                                                                                       |

Nieobsługiwane w środowisku wykonawczym Codex v1:

| Powierzchnia                                       | Granica V1                                                                                                                                      | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutowanie argumentów narzędzi natywnych             | Natywne hooki Codex przed użyciem narzędzia mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych Codex.                    | Wymaga obsługi hooków/schematu Codex dla zastępczych danych wejściowych narzędzia.        |
| Edytowalna historia transkryptu natywnego Codex     | Codex jest właścicielem kanonicznej historii natywnego wątku. OpenClaw jest właścicielem lustra i może rzutować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodać jawne API serwera aplikacji Codex, jeśli potrzebna jest chirurgiczna edycja natywnego wątku. |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hook przekształca zapisy transkryptu należące do OpenClaw, a nie rekordy narzędzi natywnych Codex.                                         | Można odzwierciedlać przekształcone rekordy, ale kanoniczne przepisywanie wymaga obsługi Codex. |
| Rozbudowane natywne metadane Compaction             | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction Codex.                                                |
| Interwencja Compaction                              | Obecne hooki Compaction OpenClaw mają w trybie Codex poziom powiadomień.                                                                        | Dodać hooki Codex przed/po Compaction, jeśli pluginy muszą wetować lub przepisywać natywną Compaction. |
| Przechwytywanie żądań API modelu bajt w bajt        | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex buduje końcowe żądanie API OpenAI wewnętrznie.          | Wymaga zdarzenia śledzenia żądania modelu Codex albo debug API.                           |

## Narzędzia, multimedia i Compaction

Harness Codex zmienia tylko niskopoziomowy osadzony wykonawca agenta.

OpenClaw nadal buduje listę narzędzi i otrzymuje dynamiczne wyniki narzędzi z
harnessu. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi do wiadomości nadal przechodzą przez normalną ścieżkę dostarczania
OpenClaw.

Natywny przekaźnik hooków jest celowo generyczny, ale kontrakt obsługi v1 jest
ograniczony do natywnych ścieżek narzędzi i uprawnień Codex, które testuje
OpenClaw. W środowisku wykonawczym Codex obejmuje to ładunki `PreToolUse`,
`PostToolUse` i `PermissionRequest` dla powłoki, poprawek i MCP. Nie zakładaj,
że każde przyszłe zdarzenie hooka Codex jest powierzchnią pluginu OpenClaw,
dopóki kontrakt środowiska wykonawczego jej nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy
tylko wtedy, gdy decyduje o tym polityka. Wynik bez decyzji nie jest
zezwoleniem. Codex traktuje go jako brak decyzji hooka i przechodzi do własnej
ścieżki strażnika lub zatwierdzenia użytkownika.

Żądania zatwierdzeń narzędzi MCP Codex są kierowane przez przepływ zatwierdzania
pluginów OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Monity Codex `request_user_input` są odsyłane do
czatu źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada na
to natywne żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne
żądania pozyskania MCP nadal kończą się zamknięciem z odmową.

Kierowanie aktywnej kolejki uruchomienia mapuje się na `turn/steer` serwera
aplikacji Codex. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje
zakolejkowane wiadomości czatu przez skonfigurowane ciche okno i wysyła je jako
jedno żądanie `turn/steer` w kolejności nadejścia. Starszy tryb `queue` wysyła
osobne żądania `turn/steer`. Tury przeglądu Codex i ręcznej Compaction mogą
odrzucić kierowanie w tej samej turze; w takim przypadku OpenClaw używa kolejki
uzupełniającej, gdy wybrany tryb pozwala na fallback. Zobacz
[Kolejka kierowania](/pl/concepts/queue-steering).

Gdy wybrany model używa harnessu Codex, natywna Compaction wątku jest delegowana
do serwera aplikacji Codex. OpenClaw utrzymuje lustro transkryptu dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub
harnessu. Lustro obejmuje monit użytkownika, końcowy tekst asystenta oraz lekkie
rekordy rozumowania lub planu Codex, gdy serwer aplikacji je emituje. Obecnie
OpenClaw rejestruje tylko sygnały rozpoczęcia i zakończenia natywnej Compaction.
Nie udostępnia jeszcze czytelnego dla człowieka podsumowania Compaction ani
audytowalnej listy wpisów, które Codex zachował po Compaction.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist` obecnie nie
przepisuje natywnych rekordów wyników narzędzi Codex. Ma zastosowanie tylko
wtedy, gdy OpenClaw zapisuje wynik narzędzia w transkrypcie sesji należącym do OpenClaw.

Generowanie multimediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS oraz
rozumienie multimediów nadal używają odpowiednich ustawień dostawcy/modelu,
takich jak `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` i `messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako normalny dostawca `/model`:** jest to oczekiwane
dla nowych konfiguracji. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (albo starszą referencję `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
backendu zgodności, gdy żaden harness Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania.
Wymuszone środowisko wykonawcze Codex kończy się błędem zamiast cofać się do PI.
Po wybraniu serwera aplikacji Codex jego błędy są ujawniane bezpośrednio.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby handshake serwera aplikacji
zgłaszał wersję `0.125.0` lub nowszą. Prerelease tej samej wersji albo wersje z
sufiksem buildu, takie jak `0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane,
ponieważ stabilny próg protokołu `0.125.0` jest tym, co testuje OpenClaw.

**Wykrywanie modeli jest wolne:** obniż `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket natychmiast się nie udaje:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny serwer aplikacji używa tej samej wersji protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** jest to oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starszą referencję
`codex/*`. Zwykłe `openai/gpt-*` i inne referencje dostawców pozostają na swojej
normalnej ścieżce dostawcy w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`,
każda osadzona tura dla tego agenta musi być modelem OpenAI obsługiwanym przez Codex.

**Computer Use jest zainstalowane, ale narzędzia nie działają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` albo `/reset`; jeśli problem się utrzymuje,
uruchom ponownie gateway, aby wyczyścić nieaktualne rejestracje natywnych hooków. Jeśli
`computer-use.list_apps` przekracza limit czasu, uruchom ponownie Codex Computer Use albo Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Hooki pluginów](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
