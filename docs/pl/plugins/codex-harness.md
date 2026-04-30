---
read_when:
    - Chcesz używać dołączonego środowiska uruchomieniowego serwera aplikacji Codex
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pośrednictwem dołączonego środowiska app-server Codex
title: Środowisko Codex
x-i18n:
    generated_at: "2026-04-30T10:06:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
serwer aplikacji Codex zamiast wbudowanego harnessu PI.

Użyj tego, gdy chcesz, aby Codex odpowiadał za niskopoziomową sesję agenta:
wykrywanie modeli, natywne wznawianie wątków, natywną Compaction i wykonywanie
przez serwer aplikacji. OpenClaw nadal odpowiada za kanały czatu, pliki sesji,
wybór modelu, narzędzia, zatwierdzenia, dostarczanie multimediów oraz widoczne
lustrzane odbicie transkrypcji.

Jeśli próbujesz się zorientować, zacznij od
[środowisk uruchomieniowych agentów](/pl/concepts/agent-runtimes). W skrócie:
`openai/gpt-5.5` to odwołanie do modelu, `codex` to środowisko uruchomieniowe, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Co zmienia ten Plugin

Dołączony Plugin `codex` wnosi kilka osobnych możliwości:

| Możliwość                         | Jak jej używasz                                     | Co robi                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywne osadzone środowisko uruchomieniowe | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez serwer aplikacji Codex.         |
| Natywne polecenia sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże wątki serwera aplikacji Codex z konwersacją w komunikatorze i steruje nimi. |
| Dostawca/katalog serwera aplikacji Codex | elementy wewnętrzne `codex`, udostępniane przez harness | Pozwala środowisku uruchomieniowemu wykrywać i walidować modele serwera aplikacji. |
| Ścieżka rozumienia multimediów Codex | ścieżki zgodności modeli obrazów `codex/*`          | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik hooków         | Hooki Pluginu wokół zdarzeń natywnych dla Codex     | Pozwala OpenClaw obserwować/blokować obsługiwane zdarzenia narzędzi/finalizacji natywne dla Codex. |

Włączenie Pluginu udostępnia te możliwości. Nie powoduje to:

- używania Codex dla każdego modelu OpenAI
- konwersji odwołań do modeli `openai-codex/*` na natywne środowisko uruchomieniowe
- ustawienia ACP/acpx jako domyślnej ścieżki Codex
- przełączania na gorąco istniejących sesji, które już zapisały środowisko uruchomieniowe PI
- zastąpienia dostarczania kanałowego OpenClaw, plików sesji, przechowywania profili uwierzytelniania ani
  routingu wiadomości

Ten sam Plugin odpowiada też za natywną powierzchnię poleceń sterowania czatem `/codex`. Jeśli
Plugin jest włączony, a użytkownik prosi o powiązanie, wznowienie, sterowanie, zatrzymanie lub sprawdzenie
wątków Codex z czatu, agenci powinni preferować `/codex ...` zamiast ACP. ACP pozostaje
jawnym rozwiązaniem zapasowym, gdy użytkownik prosi o ACP/acpx lub testuje adapter ACP
Codex.

Natywne tury Codex zachowują hooki Pluginu OpenClaw jako publiczną warstwę zgodności.
Są to działające w procesie hooki OpenClaw, a nie hooki poleceń Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkrypcji
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą też rejestrować neutralne względem środowiska uruchomieniowego middleware wyników narzędzi, aby przepisywać
dynamiczne wyniki narzędzi OpenClaw po wykonaniu narzędzia przez OpenClaw i zanim
wynik zostanie zwrócony do Codex. Jest to niezależne od publicznego hooka Pluginu
`tool_result_persist`, który przekształca należące do OpenClaw zapisy wyników narzędzi
w transkrypcji.

Semantykę samych hooków Pluginu opisują [hooki Pluginu](/pl/plugins/hooks)
oraz [zachowanie strażnika Pluginu](/pl/tools/plugin).

Harness jest domyślnie wyłączony. Nowe konfiguracje powinny zachowywać kanoniczne odwołania do modeli OpenAI
jako `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`, gdy
chcą natywnego wykonywania przez serwer aplikacji. Starsze odwołania do modeli `codex/*` nadal automatycznie wybierają
harness ze względu na zgodność, ale starsze prefiksy dostawców obsługiwane przez środowisko uruchomieniowe
nie są pokazywane jako zwykłe opcje modelu/dostawcy.

Jeśli Plugin `codex` jest włączony, ale główny model nadal ma postać
`openai-codex/*`, `openclaw doctor` ostrzega zamiast zmieniać trasę. To
celowe: `openai-codex/*` pozostaje ścieżką OAuth/subskrypcji Codex przez PI, a
natywne wykonywanie przez serwer aplikacji pozostaje jawnym wyborem środowiska uruchomieniowego.

## Mapa tras

Użyj tej tabeli przed zmianą konfiguracji:

| Pożądane zachowanie                       | Odwołanie do modelu       | Konfiguracja środowiska uruchomieniowego | Wymaganie Pluginu           | Oczekiwana etykieta statusu    |
| ----------------------------------------- | ------------------------- | ---------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API przez zwykły runner OpenClaw   | `openai/gpt-*`            | pominięte lub `runtime: "pi"`            | Dostawca OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/subskrypcja Codex przez PI          | `openai-codex/gpt-*`      | pominięte lub `runtime: "pi"`            | Dostawca OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Natywne osadzone tury serwera aplikacji Codex | `openai/gpt-*`            | `agentRuntime.id: "codex"`               | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Mieszani dostawcy z konserwatywnym trybem auto | odwołania właściwe dla dostawcy | `agentRuntime.id: "auto"`                | Opcjonalne środowiska uruchomieniowe Pluginów | Zależy od wybranego środowiska uruchomieniowego |
| Jawna sesja adaptera ACP Codex             | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"`      | sprawny backend `acpx`      | Status zadania/sesji ACP       |

Ważny podział dotyczy dostawcy i środowiska uruchomieniowego:

- `openai-codex/*` odpowiada na pytanie „której trasy dostawcy/uwierzytelniania ma użyć PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla ma wykonać tę
  osadzoną turę?”
- `/codex ...` odpowiada na pytanie „którą natywną konwersację Codex ten czat ma powiązać
  lub kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces harnessu ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Trasy z rodziny OpenAI są zależne od prefiksu. Użyj `openai-codex/*`, gdy chcesz
OAuth Codex przez PI; użyj `openai/*`, gdy chcesz bezpośredni dostęp do OpenAI API lub
gdy wymuszasz natywny harness serwera aplikacji Codex:

| Odwołanie do modelu                         | Ścieżka środowiska uruchomieniowego          | Kiedy używać                                                               |
| ------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | Dostawca OpenAI przez instalację OpenClaw/PI | Chcesz bieżącego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | OAuth OpenAI Codex przez OpenClaw/PI         | Chcesz uwierzytelniania subskrypcji ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness serwera aplikacji Codex              | Chcesz natywnego wykonywania przez serwer aplikacji Codex dla osadzonej tury agenta. |

GPT-5.5 jest obecnie w OpenClaw dostępny tylko przez subskrypcję/OAuth. Użyj
`openai-codex/gpt-5.5` dla OAuth przez PI albo `openai/gpt-5.5` z harnessem
serwera aplikacji Codex. Bezpośredni dostęp przez klucz API dla `openai/gpt-5.5` jest obsługiwany,
gdy OpenAI włączy GPT-5.5 w publicznym API.

Starsze odwołania `codex/gpt-*` pozostają akceptowane jako aliasy zgodności. Migracja zgodności
doctor przepisuje starsze główne odwołania środowiska uruchomieniowego na kanoniczne odwołania do modeli
i zapisuje politykę środowiska uruchomieniowego osobno, natomiast starsze odwołania wyłącznie zapasowe
pozostają bez zmian, ponieważ środowisko uruchomieniowe jest konfigurowane dla całego kontenera agenta.
Nowe konfiguracje OAuth PI Codex powinny używać `openai-codex/gpt-*`; nowe natywne
konfiguracje harnessu serwera aplikacji powinny używać `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` podlega temu samemu podziałowi prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy OAuth OpenAI
Codex. Użyj `codex/gpt-*`, gdy rozumienie obrazów ma działać
przez ograniczoną turę serwera aplikacji Codex. Model serwera aplikacji Codex musi
deklarować obsługę wejścia obrazowego; modele Codex tylko tekstowe kończą się błędem, zanim tura multimedialna
się rozpocznie.

Użyj `/status`, aby potwierdzić efektywny harness dla bieżącej sesji. Jeśli
wybór jest zaskakujący, włącz logowanie debug dla podsystemu `agents/harness`
i sprawdź ustrukturyzowany rekord Gateway `agent harness selected`. Zawiera on
identyfikator wybranego harnessu, powód wyboru, politykę środowiska uruchomieniowego/zapasową oraz,
w trybie `auto`, wynik obsługi każdego kandydata Pluginu.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy spełnione są wszystkie te warunki:

- dołączony Plugin `codex` jest włączony lub dozwolony
- główny model agenta to `openai-codex/*`
- efektywne środowisko uruchomieniowe tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „włączony Plugin Codex” oznacza
„natywne środowisko uruchomieniowe serwera aplikacji Codex”. OpenClaw nie wykonuje takiego przeskoku. Ostrzeżenie
oznacza:

- **Nie jest wymagana żadna zmiana**, jeśli zamierzone było OAuth ChatGPT/Codex przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamierzone było natywne wykonywanie przez serwer aplikacji.
- Istniejące sesje nadal wymagają `/new` lub `/reset` po zmianie środowiska uruchomieniowego,
  ponieważ przypięcia środowiska uruchomieniowego sesji są trwałe.

Wybór harnessu nie jest sterowaniem sesją na żywo. Gdy uruchamiana jest osadzona tura,
OpenClaw zapisuje identyfikator wybranego harnessu w tej sesji i używa go dalej dla
kolejnych tur w tym samym identyfikatorze sesji. Zmień konfigurację `agentRuntime` lub
`OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby przyszłe sesje używały innego harnessu;
użyj `/new` lub `/reset`, aby rozpocząć świeżą sesję przed przełączeniem istniejącej
konwersacji między PI a Codex. Zapobiega to odtwarzaniu jednej transkrypcji przez
dwa niezgodne natywne systemy sesji.

Starsze sesje utworzone przed przypięciami harnessu są traktowane jako przypięte do PI, gdy tylko
mają historię transkrypcji. Użyj `/new` lub `/reset`, aby po zmianie konfiguracji włączyć
Codex dla tej konwersacji.

`/status` pokazuje efektywne środowisko uruchomieniowe modelu. Domyślny harness PI pojawia się jako
`Runtime: OpenClaw Pi Default`, a harness serwera aplikacji Codex pojawia się jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym Pluginem `codex`.
- Serwer aplikacji Codex `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarium serwera aplikacji Codex, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na normalny start harnessu.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji lub dla mostka uwierzytelniania Codex
  w OpenClaw.

Plugin blokuje starsze lub pozbawione wersji uzgodnienia serwera aplikacji. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, względem której został przetestowany.

W testach live i testach dymnych Docker uwierzytelnianie zwykle pochodzi z konta Codex CLI
lub profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia serwera aplikacji przez stdio mogą
też awaryjnie użyć `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy nie ma konta.

## Minimalna konfiguracja

Użyj `openai/gpt-5.5`, włącz dołączony Plugin i wymuś harness `codex`:

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

Starsze konfiguracje, które ustawiają `agents.defaults.model` lub model agenta na
`codex/<model>`, nadal automatycznie włączają dołączony Plugin `codex`. Nowe konfiguracje powinny
preferować `openai/<model>` plus jawną pozycję `agentRuntime` powyżej.

## Dodaj Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent ma swobodnie przełączać się
między modelami dostawców Codex i innych niż Codex. Wymuszone środowisko uruchomieniowe dotyczy każdej
osadzonej tury dla tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy
to środowisko uruchomieniowe jest wymuszone, OpenClaw nadal spróbuje użyć harnessu Codex i zakończy zamkniętym błędem,
zamiast po cichu skierować tę turę przez PI.

Zamiast tego użyj jednego z tych kształtów:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta na `agentRuntime.id: "auto"` i awaryjnym PI dla normalnego mieszanego
  użycia providerów.
- Używaj starszych referencji `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` oraz jawną politykę runtime Codex.

Na przykład to pozostawia domyślnego agenta na normalnym automatycznym wyborze i
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

- Domyślny agent `main` używa normalnej ścieżki providera i awaryjnej zgodności PI.
- Agent `codex` używa uprzęży serwera aplikacji Codex.
- Jeśli Codex jest brakujący lub nieobsługiwany dla agenta `codex`, tura kończy się niepowodzeniem
  zamiast po cichu używać PI.

## Routing poleceń agentów

Agenci powinni kierować żądania użytkownika według intencji, a nie tylko według słowa „Codex”:

| Użytkownik prosi o...                                    | Agent powinien użyć...                           |
| -------------------------------------------------------- | ------------------------------------------------ |
| „Powiąż ten czat z Codex”                                | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                         | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                      | `/codex threads`                                 |
| „Zgłoś raport wsparcia dla nieudanego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij feedback Codex tylko dla tego załączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj Codex jako runtime dla tego agenta”                | zmiana konfiguracji `agentRuntime.id`            |
| „Użyj mojej subskrypcji ChatGPT/Codex ze zwykłym OpenClaw” | referencje modeli `openai-codex/*`               |
| „Uruchom Codex przez ACP/acpx”                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”     | ACP/acpx, nie `/codex` i nie natywni subagenci   |

OpenClaw reklamuje agentom wskazówki uruchamiania ACP tylko wtedy, gdy ACP jest włączone,
możliwe do dyspozycji i wspierane przez załadowany backend runtime. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills Pluginów nie powinny uczyć agenta routingu ACP.

## Wdrożenia tylko z Codex

Wymuś uprząż Codex, gdy musisz udowodnić, że każda osadzona tura agenta
używa Codex. Jawne runtime Pluginów domyślnie nie mają awaryjnego PI, więc
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

Po wymuszeniu Codex OpenClaw kończy się wcześnie, jeśli Plugin Codex jest wyłączony, jeśli
serwer aplikacji jest zbyt stary albo jeśli serwer aplikacji nie może się uruchomić. Ustaw
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` tylko wtedy, gdy celowo chcesz, aby PI obsłużyło
brakujący wybór uprzęży.

## Codex dla pojedynczego agenta

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

Użyj normalnych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy świeżą
sesję OpenClaw, a uprząż Codex tworzy lub wznawia swój poboczny wątek serwera aplikacji
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnej turze ponownie rozwiązać uprząż z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta serwer aplikacji o dostępne modele. Jeśli
wykrywanie się nie powiedzie albo przekroczy limit czasu, używa dołączonego katalogu awaryjnego dla:

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

## Połączenie i polityka serwera aplikacji

Domyślnie Plugin uruchamia lokalnie zarządzany binarny Codex OpenClaw za pomocą:

```bash
codex app-server --listen stdio://
```

Zarządzany binarny jest zadeklarowany jako dołączona zależność runtime Pluginu i przygotowywany
razem z resztą zależności Pluginu `codex`. Dzięki temu wersja serwera aplikacji
jest powiązana z dołączonym Pluginem, a nie z dowolnym osobnym CLI Codex,
które akurat jest zainstalowane lokalnie. Ustaw `appServer.command` tylko wtedy, gdy
celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje uprzęży Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana postawa lokalnego operatora używana
dla autonomicznych heartbeatów: Codex może używać powłoki i narzędzi sieciowych bez
zatrzymywania się na natywnych promptach zatwierdzania, na które nie ma komu odpowiedzieć.

Aby włączyć zatwierdzenia sprawdzane przez guardian Codex, ustaw `appServer.mode:
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

Tryb Guardian używa natywnej ścieżki zatwierdzania auto-review Codex. Gdy Codex prosi o
opuszczenie piaskownicy, zapis poza workspace albo dodanie uprawnień takich jak dostęp
do sieci, Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza albo odrzuca
konkretne żądanie. Używaj Guardian, gdy chcesz więcej zabezpieczeń niż w trybie YOLO,
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
ale OpenClaw jest właścicielem mostu konta serwera aplikacji Codex. Auth jest wybierane w tej
kolejności:

1. Jawny profil auth OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji, takie jak lokalne logowanie ChatGPT w CLI Codex.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, następnie
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a auth OpenAI jest
   nadal wymagane.

Gdy OpenClaw widzi profil auth Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z utworzonego procesu podrzędnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddings lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych tur serwera aplikacji Codex przez API.
Jawne profile klucza API Codex i lokalny awaryjny klucz środowiskowy stdio używają logowania serwera aplikacji
zamiast odziedziczonego środowiska procesu podrzędnego. Połączenia WebSocket z serwerem aplikacji
nie otrzymują awaryjnego klucza API ze środowiska Gateway; użyj jawnego profilu auth albo
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

`appServer.clearEnv` wpływa tylko na utworzony proces podrzędny serwera aplikacji Codex.

Obsługiwane pola `appServer`:

| Pole               | Domyślnie                                | Znaczenie                                                                                                                                    |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                  |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko przy jawnej zmianie.        |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                              |
| `url`               | nieustawione                             | URL app-server WebSocket.                                                                                                                    |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                                                       |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-server stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                  |
| `mode`              | `"yolo"`                                 | Ustawienie wstępne dla wykonywania YOLO lub sprawdzanego przez guardian.                                                                     |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku/turn.                                                        |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb sandbox Codex wysyłany przy rozpoczęciu/wznowieniu wątku.                                                                       |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby Codex sprawdzał natywne monity zatwierdzania. `guardian_subagent` pozostaje starszym aliasem.                     |
| `serviceTier`       | nieustawione                             | Opcjonalna warstwa usługi app-server Codex: `"fast"`, `"flex"` lub `null`. Nieprawidłowe starsze wartości są ignorowane.                    |

Dynamiczne wywołania narzędzi należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw
przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex
nieudaną odpowiedź dynamicznego narzędzia, aby turn mógł być kontynuowany
zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na ograniczone do turn żądanie app-server Codex,
harness oczekuje też, że Codex zakończy natywny turn przez `turn/completed`.
Jeśli app-server milczy przez 60 sekund po tej odpowiedzi, OpenClaw w trybie
best-effort przerywa turn Codex, zapisuje diagnostyczny limit czasu i zwalnia
tor sesji OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za
nieaktualnym natywnym turn.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych.
Konfiguracja jest zalecana dla powtarzalnych wdrożeń, ponieważ utrzymuje
zachowanie pluginu w tym samym sprawdzanym pliku co reszta konfiguracji
harness Codex.

## Użycie komputera

Computer Use jest opisane w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie vendoryzuje aplikacji do sterowania pulpitem ani sam nie
wykonuje działań na pulpicie. Przygotowuje app-server Codex, sprawdza, czy
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex obsługiwać
natywne wywołania narzędzi MCP podczas turn w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace
Codex, zarejestruj `cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use), aby poznać różnicę
między należącym do Codex Computer Use a bezpośrednią rejestracją MCP.

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

Computer Use jest specyficzne dla macOS i może wymagać lokalnych uprawnień
systemu operacyjnego, zanim serwer MCP Codex będzie mógł sterować aplikacjami.
Jeśli `computerUse.enabled` ma wartość true, a serwer MCP jest niedostępny,
turn w trybie Codex kończy się niepowodzeniem przed rozpoczęciem wątku, zamiast
po cichu działać bez natywnych narzędzi Computer Use. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use), aby poznać wybory
marketplace, ograniczenia zdalnego katalogu, przyczyny statusu i rozwiązywanie
problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować
standardowy, dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` lub `/reset` po zmianie
konfiguracji runtime lub Computer Use, aby istniejące sesje nie zachowywały
starego powiązania PI lub wątku Codex.

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

Zatwierdzenia Codex sprawdzane przez guardian:

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

Przełączanie modelu pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw
jest podłączona do istniejącego wątku Codex, kolejny turn ponownie wysyła do
app-server aktualnie wybrany model OpenAI, dostawcę, politykę zatwierdzania,
sandbox i warstwę usługi. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2`
zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym
modelem.

## Polecenie Codex

Dołączony plugin rejestruje `/codex` jako autoryzowane polecenie ukośnika. Jest
ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje aktywną łączność app-server, modele, konto, limity szybkości, serwery MCP i skills.
- `/codex models` wypisuje aktywne modele app-server Codex.
- `/codex threads [filter]` wypisuje ostatnie wątki Codex.
- `/codex resume <thread-id>` podłącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o skompaktowanie podłączonego wątku.
- `/codex review` uruchamia natywny review Codex dla podłączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla podłączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany plugin Computer Use i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany plugin Computer Use i przeładowuje serwery MCP.
- `/codex account` pokazuje status konta i limitów szybkości.
- `/codex mcp` wypisuje status serwera MCP app-server Codex.
- `/codex skills` wypisuje skills app-server Codex.

### Typowy przepływ debugowania

Gdy agent wspierany przez Codex zrobi coś zaskakującego w Telegram, Discord,
Slack lub innym kanale, zacznij od rozmowy, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką
   notatkę opisującą to, co zaobserwowano.
2. Zatwierdź żądanie diagnostyki raz. Zatwierdzenie tworzy lokalny pakiet zip
   diagnostyki Gateway i, ponieważ sesja używa harness Codex, wysyła też
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu lub wątku
   wsparcia. Zawiera lokalną ścieżkę pakietu, podsumowanie prywatności,
   identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz wiersz
   `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie zdebugować uruchomienie, uruchom wypisane polecenie
   `Inspect locally` w terminalu. Wygląda jak `codex resume <thread-id>` i
   otwiera natywny wątek Codex, aby można było przejrzeć rozmowę, kontynuować ją
   lokalnie albo zapytać Codex, dlaczego wybrał dane narzędzie lub plan.

Użyj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie podłączonego wątku bez pełnego pakietu diagnostyki
OpenClaw Gateway. W przypadku większości zgłoszeń wsparcia lepszym punktem
startowym jest `/diagnostics [note]`, ponieważ wiąże lokalny stan Gateway i
identyfikatory wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics),
aby poznać pełny model prywatności i zachowanie na czacie grupowym.

Rdzeń OpenClaw udostępnia też dostępne tylko dla owner `/diagnostics [note]`
jako ogólne polecenie diagnostyki Gateway. Jego monit zatwierdzania pokazuje
preambułę dotyczącą danych wrażliwych, linkuje do [Eksportu diagnostyki](/pl/gateway/diagnostics)
i za każdym razem żąda `openclaw gateway diagnostics export --json` przez jawne
zatwierdzenie exec. Nie zatwierdzaj diagnostyki regułą allow-all. Po
zatwierdzeniu OpenClaw wysyła raport możliwy do wklejenia z lokalną ścieżką
pakietu i podsumowaniem manifestu. Gdy aktywna sesja OpenClaw używa harness
Codex, to samo zatwierdzenie autoryzuje również wysłanie odpowiednich pakietów
opinii Codex na serwery OpenAI. Monit zatwierdzania informuje, że opinia Codex
zostanie wysłana, ale przed zatwierdzeniem nie wymienia identyfikatorów sesji
ani wątków Codex.

Jeśli `/diagnostics` zostanie wywołane przez owner na czacie grupowym, OpenClaw
utrzymuje współdzielony kanał w czystości: grupa otrzymuje tylko krótkie
powiadomienie, a preambuła diagnostyki, monity zatwierdzania oraz identyfikatory
sesji/wątków Codex są wysyłane do owner prywatną trasą zatwierdzania. Jeśli nie
ma prywatnej trasy owner, OpenClaw odmawia obsługi żądania grupowego i prosi
owner o uruchomienie go z DM.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` app-servera Codex i prosi
app-server o dołączenie logów dla każdego wymienionego wątku oraz utworzonych
podwątków Codex, gdy są dostępne. Przesłanie przechodzi zwykłą ścieżką opinii
Codex na serwery OpenAI; jeśli opinie Codex są wyłączone w tym app-serverze,
polecenie zwraca błąd app-servera. Ukończona odpowiedź diagnostyczna wymienia
kanały, identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne
polecenia `codex resume <thread-id>` dla wysłanych wątków. Jeśli odrzucisz albo
zignorujesz zatwierdzenie, OpenClaw nie wypisze tych identyfikatorów Codex. To
przesłanie nie zastępuje lokalnego eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam pomocniczy plik powiązania, którego harness używa
dla zwykłych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex,
przekazuje aktualnie wybrany model OpenClaw do app-servera i pozostawia włączoną
rozszerzoną historię.

### Sprawdzanie wątku Codex z CLI

Najszybszym sposobem zrozumienia nieudanego uruchomienia Codex jest często
bezpośrednie otwarcie natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w rozmowie kanału i chcesz sprawdzić problematyczną
sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego wybrał
konkretne narzędzie lub sposób rozumowania. Najprostsza ścieżka to zwykle
najpierw uruchomić `/diagnostics [note]`: po zatwierdzeniu ukończony raport
wymienia każdy wątek Codex i wypisuje polecenie `Sprawdź lokalnie`, na przykład
`codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio do terminala.

Identyfikator wątku możesz też uzyskać z `/codex binding` dla bieżącego czatu albo
`/codex threads [filter]` dla ostatnich wątków app-servera Codex, a następnie
uruchomić to samo polecenie `codex resume` w swojej powłoce.

Powierzchnia poleceń wymaga app-servera Codex `0.125.0` lub nowszego.
Poszczególne metody sterowania są zgłaszane jako `unsupported by this Codex app-server`,
jeśli przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                 | Zgodność produktu i Plugin między harnessami PI oraz Codex.         |
| Middleware rozszerzeń app-servera Codex | Dołączone Plugin OpenClaw | Zachowanie adaptera dla każdej tury wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do
kierowania zachowaniem Plugin OpenClaw. Dla obsługiwanego mostu natywnych narzędzi
i uprawnień OpenClaw wstrzykuje konfigurację Codex dla każdego wątku dla
`PreToolUse`, `PostToolUse`, `PermissionRequest` i `Stop`. Inne hooki Codex, takie
jak `SessionStart` i `UserPromptSubmit`, pozostają mechanizmami kontroli na
poziomie Codex; nie są udostępniane jako hooki Plugin OpenClaw w kontrakcie v1.

Dla dynamicznych narzędzi OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex
poprosi o wywołanie, więc OpenClaw uruchamia należące do niego zachowanie Plugin i
middleware w adapterze harnessa. Dla narzędzi natywnych Codex to Codex jest
właścicielem kanonicznego rekordu narzędzia. OpenClaw może odzwierciedlać wybrane
zdarzenia, ale nie może przepisać natywnego wątku Codex, chyba że Codex udostępni
taką operację przez app-server albo natywne wywołania zwrotne hooków.

Projekcje cyklu życia Compaction i LLM pochodzą z powiadomień app-servera Codex
oraz stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex. Zdarzenia
OpenClaw `before_compaction`, `after_compaction`, `llm_input` i `llm_output` są
obserwacjami na poziomie adaptera, a nie przechwyceniami bajt w bajt wewnętrznego
żądania Codex ani ładunków Compaction.

Natywne powiadomienia app-servera Codex `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii
i debugowania. Nie wywołują one hooków Plugin OpenClaw.

## Kontrakt obsługi v1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex posiada większą
część natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i
sesji wokół tej granicy.

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Obsługa                                | Dlaczego                                                                                                                                                                                              |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                            | App-server Codex posiada turę OpenAI, wznowienie natywnego wątku i kontynuację natywnych narzędzi.                                                                                                    |
| Kierowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                            | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                        |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                            | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                         |
| Plugin promptów i kontekstu                   | Obsługiwane                            | OpenClaw buduje nakładki promptów i projektuje kontekst do tury Codex przed uruchomieniem albo wznowieniem wątku.                                                                                     |
| Cykl życia silnika kontekstu                  | Obsługiwane                            | Składanie, ingest albo utrzymanie po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                      |
| Hooki narzędzi dynamicznych                   | Obsługiwane                            | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół należących do OpenClaw narzędzi dynamicznych.                                                                       |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z rzetelnymi ładunkami trybu Codex.                                                                   |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez przekaźnik natywnych hooków | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                    |
| Blokowanie albo obserwowanie natywnych shell, patch i MCP | Obsługiwane przez przekaźnik natywnych hooków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP w app-serverze Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez przekaźnik natywnych hooków | Codex `PermissionRequest` może być kierowane przez politykę OpenClaw tam, gdzie środowisko uruchomieniowe ją udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex kontynuuje przez zwykłą ścieżkę guardian albo zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii app-servera       | Obsługiwane                            | OpenClaw zapisuje żądanie wysłane do app-servera oraz powiadomienia app-servera, które otrzymuje.                                                                                                     |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                        | Granica v1                                                                                                                                      | Przyszła ścieżka                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutacja argumentów natywnych narzędzi               | Natywne hooki przednarzędziowe Codex mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych Codex.                            | Wymaga obsługi przez hooki lub schemat Codex dla zastępczych danych wejściowych narzędzia. |
| Edytowalna historia natywnej transkrypcji Codex     | Codex posiada kanoniczną historię natywnego wątku. OpenClaw posiada odzwierciedlenie i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodać jawne API app-servera Codex, jeśli potrzebna jest operacja na natywnym wątku.        |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hook przekształca zapisy transkrypcji należące do OpenClaw, a nie rekordy narzędzi natywnych Codex.                                         | Można by odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw obserwuje rozpoczęcie i ukończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction w Codex.                                             |
| Interwencja Compaction                              | Bieżące hooki Compaction OpenClaw w trybie Codex są na poziomie powiadomień.                                                                    | Dodać hooki Codex przed/po Compaction, jeśli Plugin muszą wetować albo przepisywać natywne Compaction. |
| Przechwytywanie żądania API modelu bajt w bajt      | OpenClaw może przechwytywać żądania app-servera i powiadomienia, ale rdzeń Codex buduje końcowe żądanie API OpenAI wewnętrznie.                 | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                     |

## Narzędzia, media i Compaction

Harness Codex zmienia tylko niskopoziomowy osadzony executor agenta.

OpenClaw nadal buduje listę narzędzi i otrzymuje wyniki narzędzi dynamicznych z
harnessa. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i wyjście narzędzi
komunikacyjnych nadal przechodzą przez zwykłą ścieżkę dostarczania OpenClaw.

Przekaźnik natywnych hooków jest celowo ogólny, ale kontrakt obsługi v1 ogranicza
się do natywnych ścieżek narzędzi i uprawnień Codex, które testuje OpenClaw. W
środowisku uruchomieniowym Codex obejmuje to ładunki shell, patch i MCP
`PreToolUse`, `PostToolUse` oraz `PermissionRequest`. Nie zakładaj, że każde
przyszłe zdarzenie hooka Codex jest powierzchnią Plugin OpenClaw, dopóki kontrakt
środowiska uruchomieniowego jej nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje allow albo deny tylko wtedy,
gdy zdecyduje o tym polityka. Wynik bez decyzji nie jest zgodą. Codex traktuje go
jako brak decyzji hooka i przechodzi do własnej ścieżki guardian albo zatwierdzenia
użytkownika.

Żądania zatwierdzeń narzędzi MCP Codex są kierowane przez przepływ zatwierdzeń
Plugin OpenClaw, gdy Codex oznaczy `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do czatu
źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada na to
natywne żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne
żądania elicytacji MCP nadal kończą się zamknięciem z odmową.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera aplikacji Codex. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje zakolejkowane wiadomości czatu przez skonfigurowane okno ciszy i wysyła je jako jedno żądanie `turn/steer` w kolejności nadejścia. Starszy tryb `queue` wysyła oddzielne żądania `turn/steer`. Tury przeglądu Codex i ręcznej kompakcji mogą odrzucać sterowanie w tej samej turze; w takim przypadku OpenClaw używa kolejki followup, gdy wybrany tryb pozwala na mechanizm awaryjny. Zobacz [Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa uprzęży Codex, natywna kompakcja wątku jest delegowana do serwera aplikacji Codex. OpenClaw utrzymuje lustrzaną kopię transkryptu na potrzeby historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub uprzęży. Kopia zawiera prompt użytkownika, końcowy tekst asystenta oraz lekkie rekordy rozumowania lub planu Codex, gdy serwer aplikacji je emituje. Obecnie OpenClaw zapisuje tylko sygnały rozpoczęcia i zakończenia natywnej kompakcji. Nie udostępnia jeszcze czytelnego dla człowieka podsumowania kompakcji ani możliwej do audytu listy wpisów, które Codex zachował po kompakcji.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist` nie przepisuje obecnie natywnych rekordów wyników narzędzi Codex. Ma zastosowanie tylko wtedy, gdy OpenClaw zapisuje wynik narzędzia w transkrypcie sesji należącej do OpenClaw.

Generowanie multimediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS oraz rozumienie multimediów nadal używają odpowiednich ustawień dostawcy/modelu, takich jak `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i `messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** jest to oczekiwane w nowych konfiguracjach. Wybierz model `openai/gpt-*` z `agentRuntime.id: "codex"` (albo starsze odwołanie `codex/*`), włącz `plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza `codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako zgodnego backendu, gdy żadna uprząż Codex nie przejmie uruchomienia. Ustaw `agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania. Wymuszony runtime Codex kończy się teraz błędem zamiast przechodzić awaryjnie na PI, chyba że jawnie ustawisz `agentRuntime.fallback: "pi"`. Po wybraniu serwera aplikacji Codex jego błędy są zgłaszane bezpośrednio, bez dodatkowej konfiguracji awaryjnej.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby uzgadnianie serwera aplikacji zgłaszało wersję `0.125.0` lub nowszą. Wersje prerelease tej samej wersji albo wersje z sufiksem kompilacji, takie jak `0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ OpenClaw testuje stabilny minimalny poziom protokołu `0.125.0`.

**Wykrywanie modeli jest wolne:** obniż `plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie.

**Transport WebSocket natychmiast zawodzi:** sprawdź `appServer.url`, `authToken` oraz czy zdalny serwer aplikacji mówi tą samą wersją protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** jest to oczekiwane, chyba że wymuszono `agentRuntime.id: "codex"` dla tego agenta albo wybrano starsze odwołanie `codex/*`. Zwykłe `openai/gpt-*` i odwołania innych dostawców pozostają na swojej normalnej ścieżce dostawcy w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`, każda osadzona tura dla tego agenta musi być obsługiwanym przez Codex modelem OpenAI.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź `/codex computer-use status` z nowej sesji. Jeśli narzędzie zgłasza `Native hook relay unavailable`, użyj `/new` albo `/reset`; jeśli problem się utrzymuje, uruchom ponownie gateway, aby wyczyścić przestarzałe rejestracje natywnych hooków. Jeśli `computer-use.list_apps` przekracza limit czasu, uruchom ponownie Codex Computer Use albo Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
- [Runtime’y agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Hooki Plugin](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
