---
read_when:
    - Chcesz użyć dołączonego środowiska serwera aplikacji Codex
    - Potrzebujesz przykładów konfiguracji środowiska uruchomieniowego Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pomocą dołączonego mechanizmu testowego app-server Codex
title: Środowisko Codex
x-i18n:
    generated_at: "2026-05-07T13:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
serwer aplikacji Codex zamiast wbudowanej uprzęży PI.

Użyj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
wykrywaniem modeli, natywnym wznawianiem wątków, natywną kompakcją i wykonywaniem
przez serwer aplikacji. OpenClaw nadal zarządza kanałami czatu, plikami sesji,
wyborem modelu, narzędziami, zatwierdzeniami, dostarczaniem multimediów i
widocznym lustrem transkryptu.

Gdy tura czatu źródłowego działa przez uprząż Codex, widoczne odpowiedzi
domyślnie używają narzędzia OpenClaw `message`, jeśli wdrożenie nie skonfigurowało
jawnie `messages.visibleReplies`. Agent nadal może zakończyć swoją turę Codex
prywatnie; publikuje w kanale tylko wtedy, gdy wywoła `message(action="send")`.
Ustaw `messages.visibleReplies: "automatic"`, aby zachować końcowe odpowiedzi w
czacie bezpośrednim na starszej ścieżce automatycznego dostarczania.

Tury Heartbeat Codex również domyślnie otrzymują narzędzie `heartbeat_respond`,
dzięki czemu agent może zapisać, czy wybudzenie ma pozostać ciche czy wysłać
powiadomienie, bez kodowania tego przepływu sterowania w tekście końcowym.

Wytyczne dotyczące inicjatywy specyficzne dla Heartbeat są wysyłane jako
instrukcja deweloperska trybu współpracy Codex w samej turze Heartbeat. Zwykłe
tury czatu przywracają tryb Codex Default zamiast przenosić filozofię Heartbeat
w swoim normalnym prompcie wykonawczym.

Jeśli próbujesz się zorientować, zacznij od
[Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes). Krótka wersja:
`openai/gpt-5.5` to referencja modelu, `codex` to środowisko wykonawcze, a
Telegram, Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Większość użytkowników, którzy chcą „Codex w OpenClaw”, chce tej ścieżki:
zaloguj się przy użyciu subskrypcji ChatGPT/Codex, a następnie uruchamiaj
osadzone tury agenta przez natywne środowisko wykonawcze serwera aplikacji
Codex. Referencja modelu nadal pozostaje kanoniczna jako `openai/gpt-*`;
uwierzytelnianie subskrypcji pochodzi z konta/profilu Codex, a nie z prefiksu
modelu `openai-codex/*`.

Najpierw zaloguj się przez Codex OAuth, jeśli jeszcze tego nie zrobiono:

```bash
openclaw models auth login --provider openai-codex
```

Następnie włącz dołączony plugin `codex` i wymuś środowisko wykonawcze Codex:

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

Jeśli Twoja konfiguracja używa `plugins.allow`, dodaj tam również `codex`:

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
którą `openclaw doctor --fix` przepisuje na `openai/gpt-*` w modelach głównych,
fallbackach, nadpisaniach Heartbeat/subagenta/Compaction, hookach,
nadpisaniach kanałów i nieaktualnych utrwalonych przypięciach tras sesji.

## Co zmienia ten plugin

Dołączony plugin `codex` dostarcza kilka odrębnych możliwości:

| Możliwość                         | Jak jej używasz                                      | Co robi                                                                        |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Natywne osadzone środowisko wykonawcze | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez serwer aplikacji Codex.          |
| Natywne polecenia sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże wątki serwera aplikacji Codex z konwersacją w komunikatorze i nimi steruje. |
| Dostawca/katalog serwera aplikacji Codex | wewnętrzne elementy `codex`, ujawniane przez uprząż | Pozwala środowisku wykonawczemu wykrywać i walidować modele serwera aplikacji. |
| Ścieżka rozumienia multimediów Codex | ścieżki zgodności modeli obrazów `codex/*`          | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik hooków          | Hooki pluginu wokół natywnych zdarzeń Codex         | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie pluginu udostępnia te możliwości. **Nie**:

- zastępuje bezpośrednich powierzchni klucza API OpenAI, takich jak obrazy,
  osadzenia, mowa czy czas rzeczywisty
- konwertuje referencji modelu `openai-codex/*` bez `openclaw doctor --fix`
- ustawia ACP/acpx jako domyślnej ścieżki Codex
- przełącza na gorąco istniejących sesji, które już zapisały środowisko
  wykonawcze PI
- zastępuje dostarczania kanałowego OpenClaw, plików sesji, przechowywania
  profili uwierzytelniania ani routingu wiadomości

Ten sam plugin jest też właścicielem natywnej powierzchni poleceń sterowania
czatem `/codex`. Jeśli plugin jest włączony, a użytkownik prosi o powiązanie,
wznowienie, sterowanie, zatrzymanie lub sprawdzenie wątków Codex z czatu,
agenci powinni preferować `/codex ...` zamiast ACP. ACP pozostaje jawnym
fallbackiem, gdy użytkownik prosi o ACP/acpx lub testuje adapter ACP Codex.

Natywne tury Codex zachowują hooki pluginów OpenClaw jako publiczną warstwę
zgodności. Są to wewnątrzprocesowe hooki OpenClaw, a nie hooki poleceń Codex
`hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkryptu
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą również rejestrować neutralne względem środowiska wykonawczego
oprogramowanie pośredniczące wyników narzędzi, aby przepisywać dynamiczne wyniki
narzędzi OpenClaw po wykonaniu narzędzia przez OpenClaw i przed zwróceniem
wyniku do Codex. Jest to odrębne od publicznego hooka pluginu
`tool_result_persist`, który przekształca zapisy wyników narzędzi w transkrypcie
należące do OpenClaw.

Semantykę samych hooków pluginów opisują [Hooki pluginów](/pl/plugins/hooks) oraz
[Zachowanie strażnika pluginów](/pl/tools/plugin).

Referencje modeli agentów OpenAI domyślnie używają uprzęży. Nowe konfiguracje
powinny zachowywać referencje modeli OpenAI w kanonicznej postaci
`openai/gpt-*`; `agentRuntime.id: "codex"` nadal jest poprawne, ale nie jest już
wymagane dla tur agentów OpenAI. Starsze referencje modeli `codex/*` nadal
automatycznie wybierają uprząż ze względu na zgodność, ale starsze prefiksy
dostawców oparte na środowisku wykonawczym nie są pokazywane jako normalne
wybory modeli/dostawców.

Jeśli jakakolwiek skonfigurowana trasa modelu nadal ma postać
`openai-codex/*`, `openclaw doctor --fix` przepisuje ją na `openai/*`. Dla
pasujących tras agentów ustawia środowisko wykonawcze agenta na `codex` i
zachowuje istniejące nadpisania profili uwierzytelniania `openai-codex`.

## Mapa tras

Użyj tej tabeli przed zmianą konfiguracji:

| Oczekiwane zachowanie                              | Referencja modelu          | Konfiguracja środowiska wykonawczego | Trasa uwierzytelniania/profilu | Oczekiwana etykieta stanu    |
| -------------------------------------------------- | -------------------------- | ------------------------------------ | ------------------------------ | ---------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem wykonawczym Codex | `openai/gpt-*`             | pominięta lub `agentRuntime.id: "codex"` | Codex OAuth lub konto Codex    | `Runtime: OpenAI Codex`      |
| Uwierzytelnianie kluczem API OpenAI dla modeli agentów | `openai/gpt-*`             | pominięta lub `agentRuntime.id: "codex"` | profil klucza API `openai-codex` | `Runtime: OpenAI Codex`      |
| Starsza konfiguracja wymagająca naprawy doctor     | `openai-codex/gpt-*`       | naprawiona do `codex`                | Istniejące skonfigurowane uwierzytelnianie | Sprawdź ponownie po `doctor --fix` |
| Mieszani dostawcy z konserwatywnym trybem automatycznym | referencje specyficzne dla dostawcy | `agentRuntime.id: "auto"`            | Według wybranego dostawcy      | Zależy od wybranego środowiska wykonawczego |
| Jawna sesja adaptera ACP Codex                     | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"`  | Uwierzytelnianie backendu ACP  | Stan zadania/sesji ACP       |

Ważny podział dotyczy dostawcy i środowiska wykonawczego:

- `openai-codex/*` to starsza trasa, którą doctor przepisuje.
- `agentRuntime.id: "codex"` wymaga uprzęży Codex i kończy się zamkniętym
  błędem, jeśli jest niedostępna.
- `agentRuntime.id: "auto"` pozwala zarejestrowanym uprzężom przejmować pasujące
  trasy dostawców; referencje agentów OpenAI rozwiązują się do Codex zamiast PI.
- `/codex ...` odpowiada na pytanie „z którą natywną konwersacją Codex ten czat
  ma się powiązać lub którą ma kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces uprzęży ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Trasy z rodziny OpenAI są specyficzne dla prefiksów. W typowej konfiguracji
subskrypcji plus natywnego środowiska wykonawczego Codex użyj `openai/*`.
Traktuj `openai-codex/*` jako starszą konfigurację, którą doctor powinien
przepisać:

| Referencja modelu                                | Ścieżka środowiska wykonawczego          | Kiedy używać                                                       |
| ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------ |
| `openai/gpt-5.4`                                  | Uprząż serwera aplikacji Codex dla tur agenta | Chcesz modeli agentów OpenAI przez Codex.                          |
| `openai-codex/gpt-5.5`                            | Starsza trasa naprawiana przez doctor    | Masz starą konfigurację; uruchom `openclaw doctor --fix`, aby ją przepisać. |
| `openai/gpt-5.5` + profil klucza API `openai-codex` | Uprząż serwera aplikacji Codex           | Chcesz uwierzytelniania kluczem API dla modelu agenta OpenAI.      |

GPT-5.5 może pojawiać się zarówno na bezpośrednich trasach klucza API OpenAI,
jak i trasach subskrypcji Codex, gdy Twoje konto je udostępnia. Użyj
`openai/gpt-5.5` z uprzężą serwera aplikacji Codex dla natywnego środowiska
wykonawczego Codex albo `openai/gpt-5.5` bez nadpisania środowiska wykonawczego
Codex dla bezpośredniego ruchu klucza API.

Starsze referencje `codex/gpt-*` pozostają akceptowane jako aliasy zgodności.
Migracja zgodności doctor przepisuje starsze referencje środowiska wykonawczego
na kanoniczne referencje modeli i zapisuje politykę środowiska wykonawczego
oddzielnie. Nowe konfiguracje natywnej uprzęży serwera aplikacji powinny używać
`openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai/gpt-*` dla normalnej trasy OpenAI oraz `codex/gpt-*`, gdy rozumienie
obrazów ma działać przez ograniczoną turę serwera aplikacji Codex. Nie używaj
`openai-codex/gpt-*`; doctor przepisuje ten starszy prefiks na `openai/gpt-*`.
Model serwera aplikacji Codex musi deklarować obsługę wejścia obrazowego; modele
Codex obsługujące tylko tekst kończą się błędem przed rozpoczęciem tury
multimedialnej.

Użyj `/status`, aby potwierdzić efektywną uprząż bieżącej sesji. Jeśli wybór
jest zaskakujący, włącz logowanie debugowania dla podsystemu `agents/harness` i
sprawdź ustrukturyzowany rekord gatewaya `agent harness selected`. Zawiera on
identyfikator wybranej uprzęży, powód wyboru, politykę środowiska
wykonawczego/fallbacku oraz, w trybie `auto`, wynik obsługi każdego kandydata
pluginu.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy skonfigurowane referencje modeli lub utrwalony
stan trasy sesji nadal używają `openai-codex/*`. `openclaw doctor --fix`
przepisuje te trasy na:

- `openai/<model>`
- `agentRuntime.id: "codex"`

Trasa `codex` wymusza natywną uprząż Codex. Konfiguracja środowiska wykonawczego
PI nie jest dozwolona dla tur modeli agentów OpenAI.
Doctor naprawia również nieaktualne utrwalone przypięcia sesji w wykrytych
magazynach sesji agentów, aby stare konwersacje nie pozostały zablokowane na
usuniętej trasie.

Wybór uprzęży nie jest mechanizmem sterowania sesją na żywo. Gdy działa
osadzona tura, OpenClaw zapisuje identyfikator wybranej uprzęży w tej sesji i
nadal używa go dla późniejszych tur w tym samym identyfikatorze sesji. Zmień
konfigurację `agentRuntime` lub `OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby
przyszłe sesje używały innej uprzęży; użyj `/new` lub `/reset`, aby rozpocząć
świeżą sesję przed przełączeniem istniejącej konwersacji między PI i Codex.
Pozwala to uniknąć odtwarzania jednego transkryptu przez dwa niezgodne natywne
systemy sesji.

Starsze sesje utworzone przed przypięciami uprzęży są traktowane jako przypięte
do PI, gdy mają już historię transkryptu. Użyj `/new` lub `/reset`, aby po
zmianie konfiguracji włączyć tę konwersację do Codex.

`/status` pokazuje efektywne środowisko wykonawcze modelu. Domyślna uprząż PI
pojawia się jako `Runtime: OpenClaw Pi Default`, a uprząż serwera aplikacji
Codex jako `Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- Codex app-server `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym plikiem binarnym Codex app-server, więc lokalne polecenia `codex` w `PATH` nie wpływają na normalne uruchamianie harnessa.
- Uwierzytelnianie Codex dostępne dla procesu app-server albo dla mostka uwierzytelniania Codex w OpenClaw. Lokalne uruchomienia app-server używają zarządzanego przez OpenClaw katalogu domowego Codex dla każdego agenta oraz izolowanego podrzędnego `HOME`, więc domyślnie nie odczytują Twojego osobistego konta `~/.codex`, Skills, plugins, konfiguracji, stanu wątków ani natywnego `$HOME/.agents/skills`.

Plugin blokuje starsze albo niewersjonowane handshaki app-server. Dzięki temu OpenClaw pozostaje na powierzchni protokołu, względem której został przetestowany.

W testach smoke na żywo i w Dockerze uwierzytelnianie zwykle pochodzi z konta Codex CLI albo profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia app-server przez stdio mogą również awaryjnie użyć `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy nie ma konta.

## Pliki startowe workspace

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentacji projektu. OpenClaw nie zapisuje syntetycznych plików dokumentacji projektu Codex ani nie zależy od zapasowych nazw plików Codex dla plików persony, ponieważ mechanizmy zapasowe Codex mają zastosowanie tylko wtedy, gdy brakuje `AGENTS.md`.

Aby zachować parytet workspace OpenClaw, harness Codex rozwiązuje pozostałe pliki startowe (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` oraz `MEMORY.md`, gdy są obecne) i przekazuje je przez instrukcje deweloperskie Codex przy `thread/start` i `thread/resume`. Dzięki temu `SOUL.md` i powiązany kontekst persony/profilu workspace pozostają widoczne w natywnej ścieżce Codex kształtującej zachowanie bez duplikowania `AGENTS.md`.

## Dodawanie Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent ma swobodnie przełączać się między Codex i modelami dostawców innych niż Codex. Wymuszone runtime stosuje się do każdej osadzonej tury dla tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy to runtime jest wymuszone, OpenClaw nadal próbuje użyć harnessa Codex i kończy niepowodzeniem, zamiast po cichu kierować tę turę przez PI.

Zamiast tego użyj jednego z tych kształtów:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta na `agentRuntime.id: "auto"` oraz zapasowe PI do normalnego mieszanego użycia dostawców.
- Używaj starszych odwołań `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować `openai/*` oraz jawną politykę runtime Codex.

Na przykład ta konfiguracja pozostawia domyślnego agenta przy normalnym automatycznym wyborze i dodaje osobnego agenta Codex:

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

Przy tym kształcie:

- Domyślny agent `main` używa normalnej ścieżki dostawcy i zapasowej zgodności PI.
- Agent `codex` używa harnessa Codex app-server.
- Jeśli Codex jest brakujący lub nieobsługiwany dla agenta `codex`, tura kończy się niepowodzeniem zamiast dyskretnie użyć PI.

## Kierowanie poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, a nie wyłącznie według słowa „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Przypnij ten czat do Codex”                           | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                    | `/codex threads`                                 |
| „Zgłoś raport wsparcia dla nieudanego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij feedback Codex tylko dla tego załączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj mojej subskrypcji ChatGPT/Codex z runtime Codex” | `openai/*`                                       |
| „Napraw stare przypięcia konfiguracji/sesji `openai-codex/*`” | `openclaw doctor --fix`                          |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` i nie natywne sub-agenty |

OpenClaw reklamuje agentom wskazówki dotyczące spawnowania ACP tylko wtedy, gdy ACP jest włączone, możliwe do dyspozycji i wspierane przez załadowany backend runtime. Jeśli ACP nie jest dostępne, prompt systemowy i Skills Plugin nie powinny uczyć agenta o routingu ACP.

## Wdrożenia wyłącznie z Codex

Wymuś harness Codex, gdy musisz udowodnić, że każda osadzona tura agenta używa Codex. Jawne runtime plugins kończą się niepowodzeniem w sposób zamknięty i nigdy nie są po cichu ponawiane przez PI:

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

Gdy Codex jest wymuszony, OpenClaw wcześnie kończy niepowodzeniem, jeśli Plugin Codex jest wyłączony, app-server jest zbyt stary albo app-server nie może się uruchomić.

## Codex dla pojedynczego agenta

Możesz ustawić jednego agenta jako wyłącznie Codex, podczas gdy domyślny agent zachowa normalny automatyczny wybór:

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

Używaj normalnych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy świeżą sesję OpenClaw, a harness Codex tworzy lub wznawia swój boczny wątek app-server w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku i pozwala następnej turze ponownie rozwiązać harness z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta app-server o dostępne modele. Jeśli wykrywanie zakończy się niepowodzeniem albo przekroczy limit czasu, używa dołączonego katalogu zapasowego dla:

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

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i trzymało się katalogu zapasowego:

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

## Połączenie i polityka app-server

Domyślnie Plugin uruchamia lokalnie zarządzany przez OpenClaw plik binarny Codex z:

```bash
codex app-server --listen stdio://
```

Zarządzany plik binarny jest dostarczany z pakietem Plugin `codex`. Dzięki temu wersja app-server jest powiązana z dołączonym Plugin, a nie z dowolnym osobnym Codex CLI, który akurat jest zainstalowany lokalnie. Ustaw `appServer.command` tylko wtedy, gdy celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje harnessa Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jest to zaufana lokalna postawa operatora używana
dla autonomicznych heartbeatów: Codex może używać narzędzi powłoki i sieci bez
zatrzymywania się na natywnych promptach zatwierdzenia, na które nikt nie może odpowiedzieć.

Aby włączyć zatwierdzenia przeglądane przez guardiana Codex, ustaw `appServer.mode:
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

Tryb guardian używa natywnej ścieżki zatwierdzania auto-review Codex. Gdy Codex prosi o opuszczenie sandboxa, zapis poza workspace albo dodanie uprawnień takich jak dostęp do sieci, Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do prompta dla człowieka. Recenzent stosuje framework ryzyka Codex i zatwierdza albo odrzuca konkretne żądanie. Używaj Guardian, gdy potrzebujesz większych zabezpieczeń niż tryb YOLO, ale nadal chcesz, aby agenci bez nadzoru robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą mieszać preset z jawnymi wyborami. Starsza wartość recenzenta `guardian_subagent` jest nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać `auto_review`.

Dla już działającego app-server użyj transportu WebSocket:

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

Uruchomienia app-server przez stdio domyślnie dziedziczą środowisko procesu OpenClaw, ale OpenClaw jest właścicielem mostka konta Codex app-server i ustawia zarówno `CODEX_HOME`, jak i `HOME` na katalogi per-agent w stanie OpenClaw tego agenta. Własny loader Skills Codex czyta `$CODEX_HOME/skills` i `$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień app-server. Dzięki temu natywne Skills Codex, plugins, konfiguracja, konta i stan wątków są ograniczone do agenta OpenClaw, zamiast przenikać z osobistego katalogu domowego Codex CLI operatora.

Plugins OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny rejestr plugins i loader Skills w OpenClaw. Osobiste zasoby Codex CLI nie przepływają. Jeśli masz przydatne Skills albo plugins Codex CLI, które powinny stać się częścią agenta OpenClaw, zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego workspace agenta OpenClaw. Natywne plugins, hooki i pliki konfiguracyjne Codex są raportowane lub archiwizowane do ręcznego przeglądu zamiast automatycznej aktywacji, ponieważ mogą wykonywać polecenia, wystawiać serwery MCP albo przenosić dane uwierzytelniające.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania Codex w OpenClaw dla agenta.
2. Istniejące konto app-server w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień app-server przez stdio: `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta app-server, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw zobaczy profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu podrzędnego Codex. Dzięki temu klucze API na poziomie Gateway pozostają dostępne dla embeddingów albo bezpośrednich modeli OpenAI, bez przypadkowego rozliczania natywnych tur Codex app-server przez API. Jawne profile kluczy API Codex i lokalny zapasowy klucz środowiskowy stdio używają logowania app-server zamiast dziedziczonego środowiska procesu podrzędnego. Połączenia WebSocket app-server nie otrzymują zapasowych kluczy API środowiska Gateway; użyj jawnego profilu uwierzytelniania albo własnego konta zdalnego app-server.

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

`appServer.clearEnv` wpływa tylko na uruchamiany proces podrzędny Codex app-server.

Codex dynamic tools domyślnie używają profilu `native-first`. W tym trybie
OpenClaw nie udostępnia dynamic tools, które dublują natywne operacje obszaru
roboczego Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` i
`update_plan`. Narzędzia integracyjne OpenClaw, takie jak wiadomości, sesje,
media, cron, browser, nodes, gateway, `heartbeat_respond` i `web_search`,
pozostają dostępne.

Obsługiwane pola najwyższego poziomu pluginu Codex:

| Pole                       | Domyślnie        | Znaczenie                                                                                  |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Użyj `"openclaw-compat"`, aby udostępnić pełny zestaw OpenClaw dynamic tools dla Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Dodatkowe nazwy OpenClaw dynamic tools pomijane w turach Codex app-server.                 |

Obsługiwane pola `appServer`:

| Pole                          | Domyślnie                                | Znaczenie                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                            |
| `command`                     | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko dla jawnego nadpisania.                                                                                               |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                        |
| `url`                         | nieustawione                             | URL app-server WebSocket.                                                                                                                                                                                                              |
| `authToken`                   | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                                                                                                                                                 |
| `headers`                     | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                          |
| `clearEnv`                    | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchamianego procesu app-server stdio po tym, jak OpenClaw zbuduje swoje odziedziczone środowisko. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex na agenta w OpenClaw przy uruchomieniach lokalnych. |
| `requestTimeoutMs`            | `60000`                                  | Limit czasu dla wywołań control plane app-server.                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | Okno ciszy po żądaniu Codex app-server ograniczonym do tury, gdy OpenClaw czeka na `turn/completed`. Zwiększ tę wartość dla wolnych faz syntezy po użyciu narzędzi lub wyłącznie statusowych.                                         |
| `mode`                        | `"yolo"`                                 | Preset dla wykonania YOLO lub weryfikowanego przez opiekuna.                                                                                                                                                                           |
| `approvalPolicy`              | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy starcie/wznowieniu/turze wątku.                                                                                                                                                     |
| `sandbox`                     | `"danger-full-access"`                   | Natywny tryb piaskownicy Codex wysyłany przy starcie/wznowieniu wątku.                                                                                                                                                                 |
| `approvalsReviewer`           | `"user"`                                 | Użyj `"auto_review"`, aby pozwolić Codex przeglądać natywne monity zatwierdzania. `guardian_subagent` pozostaje starszym aliasem.                                                                                                      |
| `serviceTier`                 | nieustawione                             | Opcjonalna warstwa usługi Codex app-server: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                              |

Wywołania OpenClaw-owned dynamic tool są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw
przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex
nieudaną odpowiedź dynamic-tool, aby tura mogła kontynuować zamiast zostawić
sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie Codex app-server ograniczone do tury,
uprząż oczekuje również, że Codex zakończy natywną turę zdarzeniem
`turn/completed`. Jeśli app-server pozostaje cichy przez
`appServer.turnCompletionIdleTimeoutMs` po tej odpowiedzi, OpenClaw w trybie
best-effort przerywa turę Codex, zapisuje diagnostyczny timeout i zwalnia pas
sesji OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za przestarzałą
natywną turą. Każde nieterminalne powiadomienie dla tej samej tury, w tym
`rawResponseItem/completed`, rozbraja ten krótki watchdog, ponieważ Codex
udowodnił, że tura nadal żyje; dłuższy terminalny watchdog nadal chroni przed
rzeczywiście zablokowanymi turami. Diagnostyka timeout obejmuje ostatnią metodę
powiadomienia app-server oraz, dla surowych elementów odpowiedzi asystenta, typ
elementu, rolę, id i ograniczony podgląd tekstu asystenta.

Nadpisania środowiskowe pozostają dostępne do testów lokalnych:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` jest nieustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego testowania lokalnego.
Konfiguracja jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje
zachowanie pluginu w tym samym przeglądanym pliku co resztę konfiguracji uprzęży
Codex.

## Computer use

Computer Use jest omówione w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji do sterowania pulpitem ani sam nie
wykonuje akcji pulpitu. Przygotowuje Codex app-server, weryfikuje dostępność
serwera MCP `computer-use`, a następnie pozwala Codex obsługiwać natywne
wywołania narzędzi MCP podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace
Codex, zarejestruj `cua-driver mcp` poleceniem `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use), aby poznać różnicę
między Computer Use zarządzanym przez Codex a bezpośrednią rejestracją MCP.

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

Computer Use jest specyficzne dla macOS i może wymagać lokalnych uprawnień
systemu operacyjnego, zanim serwer MCP Codex będzie mógł sterować aplikacjami.
Jeśli `computerUse.enabled` ma wartość true, a serwer MCP jest niedostępny, tury
w trybie Codex kończą się niepowodzeniem przed rozpoczęciem wątku zamiast cicho
działać bez natywnych narzędzi Computer Use. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use), aby poznać wybory
marketplace, limity zdalnego katalogu, powody statusu i rozwiązywanie problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować
standardowy dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` lub `/reset` po zmianie
konfiguracji środowiska uruchomieniowego albo Computer Use, aby istniejące sesje
nie zachowywały starego powiązania z PI lub wątkiem Codex.

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

Zatwierdzenia Codex weryfikowane przez opiekuna:

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
jest dołączona do istniejącego wątku Codex, następna tura ponownie wysyła do
app-server aktualnie wybrany model OpenAI, dostawcę, politykę zatwierdzania,
piaskownicę i warstwę usługi. Przełączenie z `openai/gpt-5.5` na
`openai/gpt-5.2` zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z
nowo wybranym modelem.

## Polecenie Codex

Dołączony plugin rejestruje `/codex` jako autoryzowane polecenie ukośnikowe.
Jest ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje na żywo łączność z serwerem aplikacji, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla modele Codex dostępne na żywo z serwera aplikacji.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany Plugin Computer Use i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany Plugin Computer Use i przeładowuje serwery MCP.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

Gdy Codex zgłasza błąd limitu użycia, OpenClaw dołącza następny czas resetu
serwera aplikacji, jeśli Codex go podał. Użyj `/codex account` w tej samej
rozmowie, aby sprawdzić bieżące konto i okna limitów szybkości.

### Typowy przepływ debugowania

Gdy agent oparty na Codex zrobi coś zaskakującego w Telegram, Discord, Slack,
lub innym kanale, zacznij od rozmowy, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` lub inną krótką notatkę,
   która opisuje to, co zobaczono.
2. Zatwierdź żądanie diagnostyki raz. Zatwierdzenie tworzy lokalny plik zip
   diagnostyki Gateway i, ponieważ sesja używa uprzęży Codex, wysyła też
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu lub wątku wsparcia.
   Zawiera ona lokalną ścieżkę pakietu, podsumowanie prywatności, identyfikatory sesji OpenClaw,
   identyfikatory wątków Codex oraz wiersz `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować uruchomienie, uruchom wydrukowane polecenie `Inspect locally`
   w terminalu. Wygląda ono jak `codex resume <thread-id>` i otwiera
   natywny wątek Codex, aby można było sprawdzić rozmowę, kontynuować ją lokalnie
   albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub plan.

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostycznego
OpenClaw Gateway. W przypadku większości zgłoszeń wsparcia lepszym punktem wyjścia jest `/diagnostics [note]`,
ponieważ łączy lokalny stan Gateway i identyfikatory wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics),
aby poznać pełny model prywatności i zachowanie czatów grupowych.

Rdzeń OpenClaw udostępnia też tylko właścicielom `/diagnostics [note]` jako ogólne
polecenie diagnostyczne Gateway. Jego monit zatwierdzenia pokazuje wprowadzenie
dotyczące danych wrażliwych, linki do [Eksportu diagnostyki](/pl/gateway/diagnostics) i za każdym razem żąda
`openclaw gateway diagnostics export --json` przez jawne zatwierdzenie wykonania.
Nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu
OpenClaw wysyła raport możliwy do wklejenia, z lokalną ścieżką pakietu i podsumowaniem
manifestu. Gdy aktywna sesja OpenClaw używa uprzęży Codex, to samo
zatwierdzenie autoryzuje również wysłanie odpowiednich pakietów opinii Codex na
serwery OpenAI. Monit zatwierdzenia mówi, że opinia Codex zostanie wysłana, ale
nie wymienia identyfikatorów sesji ani wątków Codex przed zatwierdzeniem.

Jeśli `/diagnostics` zostanie wywołane przez właściciela na czacie grupowym, OpenClaw utrzymuje
współdzielony kanał w czystości: grupa otrzymuje tylko krótkie powiadomienie, natomiast
wprowadzenie diagnostyczne, monity zatwierdzenia oraz identyfikatory sesji/wątków Codex są wysyłane do
właściciela przez prywatną trasę zatwierdzania. Jeśli nie ma prywatnej trasy właściciela,
OpenClaw odrzuca żądanie grupowe i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` serwera aplikacji Codex i prosi
serwer aplikacji o dołączenie logów dla każdego wymienionego wątku oraz utworzonych podwątków Codex,
gdy są dostępne. Przesyłanie przechodzi przez normalną ścieżkę opinii Codex na serwery OpenAI;
jeśli opinia Codex jest wyłączona na tym serwerze aplikacji, polecenie zwraca
błąd serwera aplikacji. Ukończona odpowiedź diagnostyczna wymienia kanały,
identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia `codex resume <thread-id>`
dla wysłanych wątków. Jeśli odmówisz zatwierdzenia lub je zignorujesz,
OpenClaw nie wypisze tych identyfikatorów Codex. To przesłanie nie zastępuje lokalnego
eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam boczny plik powiązania, którego uprząż używa podczas
normalnych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje
aktualnie wybrany model OpenClaw do serwera aplikacji i utrzymuje włączoną
rozszerzoną historię.

### Sprawdzanie wątku Codex z CLI

Najszybszym sposobem zrozumienia błędnego uruchomienia Codex jest często bezpośrednie otwarcie natywnego
wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w rozmowie kanałowej i chcesz sprawdzić
problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego dokonał
konkretnego wyboru narzędzia lub rozumowania. Najłatwiejszą ścieżką jest zwykle najpierw uruchomienie
`/diagnostics [note]`: po zatwierdzeniu ukończony raport wymienia
każdy wątek Codex i wypisuje polecenie `Inspect locally`, na przykład
`codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio do terminala.

Możesz też uzyskać identyfikator wątku z `/codex binding` dla bieżącego czatu albo
`/codex threads [filter]` dla ostatnich wątków serwera aplikacji Codex, a następnie uruchomić to samo
polecenie `codex resume` w swojej powłoce.

Powierzchnia poleceń wymaga serwera aplikacji Codex `0.125.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy serwer aplikacji nie udostępnia tej metody JSON-RPC.

## Granice haków

Uprząż Codex ma trzy warstwy haków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Haki Plugin OpenClaw                  | OpenClaw                 | Zgodność produktu/pluginu między uprzężami PI i Codex.              |
| Oprogramowanie pośredniczące rozszerzeń serwera aplikacji Codex | Pluginy dołączone do OpenClaw | Zachowanie adaptera dla każdej tury wokół dynamicznych narzędzi OpenClaw. |
| Natywne haki Codex                    | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania
zachowaniem Plugin OpenClaw. Dla obsługiwanego mostu natywnych narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex dla wątku dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`. Gdy zatwierdzenia serwera aplikacji Codex są włączone
(`approvalPolicy` nie jest `"never"`), domyślnie wstrzykiwana konfiguracja natywnych haków
pomija `PermissionRequest`, aby recenzent serwera aplikacji Codex i most zatwierdzeń OpenClaw
obsługiwały rzeczywiste eskalacje po przeglądzie. Operatorzy nadal mogą jawnie dodać
`permission_request` do `nativeHookRelay.events`, gdy potrzebują przekaźnika zgodności.
Inne haki Codex, takie jak `SessionStart` i `UserPromptSubmit`, pozostają
kontrolkami poziomu Codex; nie są udostępniane jako haki Plugin OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie Plugin i oprogramowania pośredniczącego, które posiada w
adapterze uprzęży. W przypadku narzędzi natywnych Codex Codex posiada kanoniczny rekord narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego
wątku Codex, chyba że Codex udostępni tę operację przez serwer aplikacji lub wywołania zwrotne
natywnych haków.

Projekcje cyklu życia Compaction i LLM pochodzą z powiadomień serwera aplikacji Codex
oraz stanu adaptera OpenClaw, a nie z natywnych poleceń haków Codex.
Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie bajt w bajt przechwyconymi
wewnętrznymi żądaniami Codex ani ładunkami Compaction.

Natywne powiadomienia serwera aplikacji Codex `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania.
Nie wywołują haków Plugin OpenClaw.

## Kontrakt obsługi V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex posiada większą część
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji
wokół tej granicy.

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Obsługa                                                                              | Dlaczego                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                                                                          | Serwer aplikacji Codex odpowiada za turę OpenAI, natywne wznowienie wątku i natywną kontynuację narzędzi.                                                                                                  |
| Trasowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                                                                          | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                             |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                                                                          | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje w ścieżce wykonania.                                                                                                                |
| Pluginy promptów i kontekstu                  | Obsługiwane                                                                          | OpenClaw buduje nakładki promptów i wprowadza kontekst do tury Codex przed uruchomieniem lub wznowieniem wątku.                                                                                            |
| Cykl życia silnika kontekstu                  | Obsługiwane                                                                          | Składanie, przyjmowanie lub konserwacja po turze oraz koordynacja compaction silnika kontekstu działają dla tur Codex.                                                                                     |
| Dynamiczne hooki narzędzi                     | Obsługiwane                                                                          | Middleware `before_tool_call`, `after_tool_call` i wyników narzędzi działa wokół dynamicznych narzędzi należących do OpenClaw.                                                                             |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera                                                 | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z rzetelnymi ładunkami trybu Codex.                                                                       |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez natywne przekazywanie hooków                                       | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                        |
| Natywna powłoka, patch i blokowanie lub obserwowanie MCP | Obsługiwane przez natywne przekazywanie hooków                              | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP w serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie jest. |
| Natywna polityka uprawnień                    | Obsługiwane przez zatwierdzenia serwera aplikacji Codex i zgodnościowe natywne przekazywanie hooków | Żądania zatwierdzeń serwera aplikacji Codex są trasowane przez OpenClaw po przeglądzie Codex. Natywne przekazywanie hooka `PermissionRequest` jest opcjonalne dla natywnych trybów zatwierdzania, ponieważ Codex emituje je przed przeglądem strażnika. |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                                                                          | OpenClaw zapisuje żądanie wysłane do serwera aplikacji oraz otrzymane z niego powiadomienia.                                                                                                                |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                         | Granica V1                                                                                                                                     | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutowanie argumentów natywnych narzędzi             | Natywne hooki Codex przed narzędziem mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych dla Codex.                       | Wymaga obsługi hooka/schematu Codex dla zastępczych danych wejściowych narzędzia.         |
| Edytowalna historia transkryptu natywnego Codex     | Codex posiada kanoniczną historię natywnego wątku. OpenClaw posiada kopię lustrzaną i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodać jawne API serwera aplikacji Codex, jeśli potrzebna jest ingerencja w natywny wątek. |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hook przekształca zapisy transkryptu należące do OpenClaw, a nie rekordy narzędzi natywnych Codex.                                      | Można kopiować lustrzanie przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate natywne metadane compaction                  | OpenClaw obserwuje rozpoczęcie i ukończenie compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń compaction Codex.                                               |
| Interwencja w compaction                            | Obecne hooki compaction OpenClaw są w trybie Codex na poziomie powiadomień.                                                                      | Dodać hooki Codex przed/po compaction, jeśli pluginy muszą wetować lub przepisywać natywną compaction. |
| Przechwytywanie żądań API modelu bajt po bajcie     | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex wewnętrznie buduje finalne żądanie API OpenAI.          | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                     |

## Narzędzia, multimedia i compaction

Uprząż Codex zmienia tylko niskopoziomowy wbudowany wykonawca agenta.

OpenClaw nadal buduje listę narzędzi i otrzymuje dynamiczne wyniki narzędzi z
uprzęży. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i wyjście narzędzi
wiadomości nadal przechodzą przez normalną ścieżkę dostarczania OpenClaw.

Natywne przekazywanie hooków jest celowo ogólne, ale kontrakt obsługi v1 jest
ograniczony do natywnych ścieżek narzędzi i uprawnień Codex testowanych przez OpenClaw. W
środowisku uruchomieniowym Codex obejmuje to powłokę, patch i ładunki MCP `PreToolUse`,
`PostToolUse` oraz `PermissionRequest`. Nie zakładaj, że każde przyszłe
zdarzenie hooka Codex jest powierzchnią plugina OpenClaw, dopóki kontrakt środowiska uruchomieniowego
nie nazwie go wprost.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy
tylko wtedy, gdy decyduje polityka. Wynik bez decyzji nie jest zezwoleniem. Codex traktuje go jako brak
decyzji hooka i przechodzi do własnej ścieżki strażnika albo zatwierdzenia przez użytkownika.
Tryby zatwierdzania serwera aplikacji Codex domyślnie pomijają ten natywny hook; ten akapit
ma zastosowanie, gdy `permission_request` jest jawnie uwzględnione w
`nativeHookRelay.events` albo instaluje je zgodnościowe środowisko uruchomieniowe.
Gdy operator wybiera `allow-always` dla natywnego żądania uprawnień Codex,
OpenClaw zapamiętuje dokładny odcisk provider/sesja/narzędzie dane wejściowe/cwd dla
ograniczonego okna sesji. Zapamiętana decyzja jest celowo wyłącznie dokładnym dopasowaniem:
zmienione polecenie, argumenty, ładunek narzędzia albo cwd tworzy nowe
zatwierdzenie.

Wywołania zatwierdzania narzędzi MCP Codex są trasowane przez przepływ
zatwierdzania pluginów OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do
źródłowego czatu, a następna zakolejkowana wiadomość uzupełniająca odpowiada na to natywne
żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne żądania wywołań MCP
nadal kończą się bezpieczną odmową.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera aplikacji Codex. Przy
domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje zakolejkowane wiadomości czatu
dla skonfigurowanego okna ciszy i wysyła je jako jedno żądanie `turn/steer` w
kolejności przybycia. Starszy tryb `queue` wysyła oddzielne żądania `turn/steer`. Przegląd Codex
i ręczne tury compaction mogą odrzucić sterowanie w tej samej turze; w takim przypadku
OpenClaw używa kolejki followup, gdy wybrany tryb pozwala na fallback. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa uprzęży Codex, natywna compaction wątku jest
delegowana do serwera aplikacji Codex. OpenClaw utrzymuje kopię lustrzaną transkryptu dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub uprzęży. Kopia
obejmuje prompt użytkownika, finalny tekst asystenta oraz lekkie rekordy rozumowania
lub planu Codex, gdy serwer aplikacji je emituje. Obecnie OpenClaw zapisuje tylko
sygnały rozpoczęcia i ukończenia natywnej compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania compaction ani audytowalnej listy wpisów, które Codex
zachował po compaction.

Ponieważ Codex posiada kanoniczny natywny wątek, `tool_result_persist` obecnie nie
przepisuje rekordów wyników narzędzi natywnych Codex. Ma zastosowanie tylko wtedy, gdy
OpenClaw zapisuje wynik narzędzia transkryptu sesji należącej do OpenClaw.

Generowanie multimediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS i
rozumienie multimediów nadal używają pasujących ustawień providera/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły provider `/model`:** jest to oczekiwane w
nowych konfiguracjach. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (albo starszą referencję `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
zgodnościowego backendu, gdy żadna uprząż Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testów. Wymuszone
środowisko uruchomieniowe Codex kończy się błędem zamiast wracać do PI. Gdy serwer aplikacji Codex
zostanie wybrany, jego błędy są ujawniane bezpośrednio.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby uzgadnianie serwera aplikacji
zgłaszało wersję `0.125.0` lub nowszą. Wydania przedpremierowe tej samej wersji albo wersje z sufiksem build,
takie jak `0.125.0-alpha.2` albo `0.125.0+custom`, są odrzucane, ponieważ
stabilny próg protokołu `0.125.0` jest tym, co testuje OpenClaw.

**Wykrywanie modeli jest powolne:** obniż `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket natychmiast zawodzi:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny serwer aplikacji mówi tą samą wersją protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** jest to oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starszą referencję
`codex/*`. Zwykłe referencje `openai/gpt-*` i innych providerów pozostają na swojej normalnej
ścieżce providera w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`, każda wbudowana
tura dla tego agenta musi być obsługiwanym przez Codex modelem OpenAI.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` w nowej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem się utrzymuje, uruchom ponownie
Gateway, aby wyczyścić nieaktualne rejestracje natywnych hooków. Jeśli `computer-use.list_apps`
przekracza limit czasu, uruchom ponownie Codex Computer Use lub Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy uprzęży agentów](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Hooki Pluginów](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
