---
read_when:
    - Chcesz użyć dołączonego mechanizmu app-server Codex
    - Potrzebujesz przykładów konfiguracji harnessu Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się błędem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury wbudowanego agenta OpenClaw za pośrednictwem dołączonego środowiska uruchomieniowego app-server Codex
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-05-05T01:48:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
serwer aplikacji Codex zamiast wbudowanego mechanizmu PI.

Użyj tego, gdy chcesz, aby Codex odpowiadał za niskopoziomową sesję agenta:
wykrywanie modeli, natywne wznawianie wątków, natywną kompakcję i wykonywanie
na serwerze aplikacji. OpenClaw nadal odpowiada za kanały czatu, pliki sesji,
wybór modelu, narzędzia, zatwierdzenia, dostarczanie multimediów i widoczne
odzwierciedlenie transkrypcji.

Gdy tura z czatu źródłowego działa przez mechanizm Codex, widoczne odpowiedzi
domyślnie używają narzędzia OpenClaw `message`, jeśli wdrożenie nie skonfigurowało
jawnie `messages.visibleReplies`. Agent nadal może zakończyć swoją turę Codex
prywatnie; publikuje w kanale tylko wtedy, gdy wywoła `message(action="send")`.
Ustaw `messages.visibleReplies: "automatic"`, aby zachować końcowe odpowiedzi
czatu bezpośredniego na starszej ścieżce automatycznego dostarczania.

Tury Heartbeat Codex domyślnie otrzymują także narzędzie `heartbeat_respond`,
dzięki czemu agent może zapisać, czy wybudzenie ma pozostać ciche, czy wysłać
powiadomienie, bez kodowania tego przepływu sterowania w tekście końcowym.

Wskazówki inicjatywy specyficzne dla Heartbeat są wysyłane jako instrukcja
deweloperska trybu współpracy Codex w samej turze Heartbeat. Zwykłe tury czatu
przywracają tryb domyślny Codex zamiast przenosić filozofię Heartbeat w swoim
normalnym prompcie uruchomieniowym.

Jeśli próbujesz się zorientować, zacznij od
[środowisk wykonawczych agenta](/pl/concepts/agent-runtimes). Krótka wersja jest
taka: `openai/gpt-5.5` to odwołanie do modelu, `codex` to środowisko wykonawcze,
a Telegram, Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Większość użytkowników, którzy chcą „Codex w OpenClaw”, wybiera tę ścieżkę:
zaloguj się za pomocą subskrypcji ChatGPT/Codex, a następnie uruchamiaj
osadzone tury agenta przez natywne środowisko wykonawcze serwera aplikacji
Codex. Odwołanie do modelu nadal pozostaje kanoniczne jako `openai/gpt-*`;
uwierzytelnianie subskrypcyjne pochodzi z konta/profilu Codex, a nie z prefiksu
modelu `openai-codex/*`.

Najpierw zaloguj się przez Codex OAuth, jeśli jeszcze tego nie zrobiono:

```bash
openclaw models auth login --provider openai-codex
```

Następnie włącz dołączony Plugin `codex` i wymuś środowisko wykonawcze Codex:

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

Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij tam także `codex`:

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

Nie używaj `openai-codex/gpt-*`, gdy chodzi Ci o natywne środowisko wykonawcze
Codex. Ten prefiks jest jawną ścieżką „Codex OAuth przez PI”. Zmiany konfiguracji
mają zastosowanie do nowych lub zresetowanych sesji; istniejące sesje zachowują
zapisane środowisko wykonawcze.

## Co zmienia ten Plugin

Dołączony Plugin `codex` dodaje kilka oddzielnych możliwości:

| Możliwość                         | Jak jej używać                                       | Co robi                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywne osadzone środowisko wykonawcze | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez serwer aplikacji Codex.         |
| Natywne polecenia sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże wątki serwera aplikacji Codex z konwersacją wiadomości i steruje nimi.  |
| Dostawca/katalog serwera aplikacji Codex | elementy wewnętrzne `codex`, udostępniane przez mechanizm | Pozwala środowisku wykonawczemu wykrywać i walidować modele serwera aplikacji. |
| Ścieżka rozumienia multimediów Codex | ścieżki zgodności modeli obrazów `codex/*`           | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywne przekazywanie hooków      | Hooki Plugin wokół natywnych zdarzeń Codex           | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie Plugin udostępnia te możliwości. **Nie** powoduje to:

- rozpoczęcia używania Codex dla każdego modelu OpenAI
- konwersji odwołań do modeli `openai-codex/*` na natywne środowisko wykonawcze
- ustawienia ACP/acpx jako domyślnej ścieżki Codex
- gorącego przełączenia istniejących sesji, które już zapisały środowisko wykonawcze PI
- zastąpienia dostarczania kanałowego OpenClaw, plików sesji, przechowywania profili uwierzytelniania ani routingu wiadomości

Ten sam Plugin jest także właścicielem natywnej powierzchni poleceń sterowania
czatem `/codex`. Jeśli Plugin jest włączony, a użytkownik prosi o powiązanie,
wznowienie, sterowanie, zatrzymanie lub sprawdzenie wątków Codex z czatu, agenci
powinni preferować `/codex ...` zamiast ACP. ACP pozostaje jawną ścieżką awaryjną,
gdy użytkownik prosi o ACP/acpx albo testuje adapter ACP Codex.

Natywne tury Codex zachowują hooki Plugin OpenClaw jako publiczną warstwę
zgodności. Są to hooki OpenClaw działające w procesie, a nie hooki poleceń
Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla odzwierciedlonych rekordów transkrypcji
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą także rejestrować neutralne względem środowiska wykonawczego
oprogramowanie pośredniczące wyników narzędzi, aby przepisywać dynamiczne wyniki
narzędzi OpenClaw po wykonaniu narzędzia przez OpenClaw i przed zwróceniem
wyniku do Codex. Jest to oddzielne od publicznego hooka Plugin
`tool_result_persist`, który przekształca zapisy wyników narzędzi w transkrypcji
należącej do OpenClaw.

Semantykę samych hooków Plugin opisują [hooki Plugin](/pl/plugins/hooks) i
[zachowanie osłon Plugin](/pl/tools/plugin).

Mechanizm jest domyślnie wyłączony. Nowe konfiguracje powinny zachowywać
odwołania do modeli OpenAI w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`, gdy wymagane jest
natywne wykonywanie na serwerze aplikacji. Starsze odwołania do modeli `codex/*`
nadal automatycznie wybierają mechanizm dla zgodności, ale starsze prefiksy
dostawców oparte na środowisku wykonawczym nie są pokazywane jako normalne
wybory modeli/dostawców.

Jeśli Plugin `codex` jest włączony, ale główny model nadal ma postać
`openai-codex/*`, `openclaw doctor` ostrzega zamiast zmieniać ścieżkę. Jest to
zamierzone: `openai-codex/*` pozostaje ścieżką Codex OAuth/subskrypcji przez PI,
a natywne wykonywanie na serwerze aplikacji pozostaje jawnym wyborem środowiska
wykonawczego.

## Mapa ścieżek

Użyj tej tabeli przed zmianą konfiguracji:

| Pożądane zachowanie                                | Odwołanie do modelu      | Konfiguracja środowiska wykonawczego | Ścieżka uwierzytelniania/profilu | Oczekiwana etykieta stanu       |
| -------------------------------------------------- | ------------------------ | ------------------------------------ | -------------------------------- | ------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem wykonawczym Codex | `openai/gpt-*`           | `agentRuntime.id: "codex"`           | Codex OAuth lub konto Codex      | `Runtime: OpenAI Codex`         |
| OpenAI API przez normalny runner OpenClaw          | `openai/gpt-*`           | pominięte lub `runtime: "pi"`        | Klucz OpenAI API                 | `Runtime: OpenClaw Pi Default`  |
| Subskrypcja ChatGPT/Codex przez PI                 | `openai-codex/gpt-*`     | pominięte lub `runtime: "pi"`        | Dostawca OpenAI Codex OAuth      | `Runtime: OpenClaw Pi Default`  |
| Mieszani dostawcy z konserwatywnym trybem automatycznym | odwołania specyficzne dla dostawcy | `agentRuntime.id: "auto"`            | Według wybranego dostawcy        | Zależy od wybranego środowiska wykonawczego |
| Jawna sesja adaptera Codex ACP                     | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"`  | Uwierzytelnianie backendu ACP    | Stan zadania/sesji ACP          |

Ważny jest podział na dostawcę i środowisko wykonawcze:

- `openai-codex/*` odpowiada na pytanie „której ścieżki dostawcy/uwierzytelniania ma użyć PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla ma wykonać tę
  osadzoną turę?”
- `/codex ...` odpowiada na pytanie „którą natywną konwersację Codex ma powiązać
  lub kontrolować ten czat?”
- ACP odpowiada na pytanie „który zewnętrzny proces mechanizmu ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Ścieżki z rodziny OpenAI zależą od prefiksu. Dla typowej konfiguracji z
subskrypcją oraz natywnym środowiskiem wykonawczym Codex użyj `openai/*` z
`agentRuntime.id: "codex"`. Używaj `openai-codex/*` tylko wtedy, gdy celowo
chcesz Codex OAuth przez PI:

| Odwołanie do modelu                        | Ścieżka środowiska wykonawczego              | Kiedy używać                                                              |
| ------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                           | Dostawca OpenAI przez mechanizmy OpenClaw/PI | Chcesz bieżący bezpośredni dostęp do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                     | OpenAI Codex OAuth przez OpenClaw/PI         | Chcesz uwierzytelnianie subskrypcją ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Mechanizm serwera aplikacji Codex            | Chcesz uwierzytelnianie subskrypcją ChatGPT/Codex z natywnym wykonywaniem Codex. |

GPT-5.5 może pojawić się zarówno na bezpośrednich ścieżkach OpenAI z kluczem API,
jak i na ścieżkach subskrypcji Codex, gdy Twoje konto je udostępnia. Użyj
`openai/gpt-5.5` z mechanizmem serwera aplikacji Codex dla natywnego środowiska
wykonawczego Codex, `openai-codex/gpt-5.5` dla PI OAuth albo `openai/gpt-5.5`
bez nadpisania środowiska wykonawczego Codex dla ruchu z bezpośrednim kluczem API.

Starsze odwołania `codex/gpt-*` pozostają akceptowane jako aliasy zgodności.
Migracja zgodności w Doctor przepisuje starsze odwołania głównego środowiska
wykonawczego na kanoniczne odwołania do modeli i zapisuje politykę środowiska
wykonawczego oddzielnie, natomiast starsze odwołania używane tylko jako awaryjne
pozostają bez zmian, ponieważ środowisko wykonawcze jest konfigurowane dla całego
kontenera agenta. Nowe konfiguracje PI Codex OAuth powinny używać
`openai-codex/gpt-*`; nowe konfiguracje natywnego mechanizmu serwera aplikacji
powinny używać `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy
OpenAI Codex OAuth. Użyj `codex/gpt-*`, gdy rozumienie obrazów ma działać przez
ograniczoną turę serwera aplikacji Codex. Model serwera aplikacji Codex musi
deklarować obsługę wejścia obrazowego; modele Codex obsługujące tylko tekst
zawiodą przed rozpoczęciem tury multimedialnej.

Użyj `/status`, aby potwierdzić efektywny mechanizm dla bieżącej sesji. Jeśli
wybór jest zaskakujący, włącz rejestrowanie debugowania dla podsystemu
`agents/harness` i sprawdź ustrukturyzowany rekord Gateway `agent harness selected`.
Zawiera on wybrany identyfikator mechanizmu, powód wyboru, politykę środowiska
wykonawczego/awaryjną oraz, w trybie `auto`, wynik obsługi każdego kandydata Plugin.

### Co oznaczają ostrzeżenia Doctor

`openclaw doctor` ostrzega, gdy wszystkie poniższe warunki są prawdziwe:

- dołączony Plugin `codex` jest włączony lub dozwolony
- główny model agenta to `openai-codex/*`
- efektywne środowisko wykonawcze tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „włączony
Plugin Codex” oznacza „natywne środowisko wykonawcze serwera aplikacji Codex”.
OpenClaw nie wykonuje takiego skoku. Ostrzeżenie oznacza:

- **Żadna zmiana nie jest wymagana**, jeśli zamierzono używać ChatGPT/Codex OAuth przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamierzono używać natywnego wykonywania
  na serwerze aplikacji.
- Istniejące sesje nadal wymagają `/new` lub `/reset` po zmianie środowiska
  wykonawczego, ponieważ przypięcia środowiska wykonawczego sesji są trwałe.

Wybór mechanizmu nie jest sterowaniem sesją na żywo. Gdy osadzona tura jest
uruchamiana, OpenClaw zapisuje wybrany identyfikator mechanizmu w tej sesji i
nadal używa go dla późniejszych tur w tym samym identyfikatorze sesji. Zmień
konfigurację `agentRuntime` lub `OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby przyszłe
sesje używały innego mechanizmu; użyj `/new` lub `/reset`, aby rozpocząć świeżą
sesję przed przełączeniem istniejącej konwersacji między PI i Codex. Zapobiega to
odtwarzaniu jednej transkrypcji przez dwa niezgodne natywne systemy sesji.

Starsze sesje utworzone przed przypięciem mechanizmu są traktowane jako przypięte do PI, gdy
mają historię transkrypcji. Użyj `/new` lub `/reset`, aby włączyć tę konwersację do
Codex po zmianie konfiguracji.

`/status` pokazuje efektywne środowisko uruchomieniowe modelu. Domyślny mechanizm PI jest wyświetlany jako
`Runtime: OpenClaw Pi Default`, a mechanizm serwera aplikacji Codex jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym pluginem `codex`.
- Serwer aplikacji Codex `0.125.0` lub nowszy. Dołączony plugin domyślnie zarządza zgodnym
  plikiem binarnym serwera aplikacji Codex, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na normalne uruchamianie mechanizmu.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji albo dla mostu uwierzytelniania Codex
  w OpenClaw. Lokalne uruchomienia serwera aplikacji używają zarządzanego przez OpenClaw katalogu domowego Codex dla każdego
  agenta oraz izolowanego podrzędnego `HOME`, więc domyślnie nie odczytują Twojego osobistego
  konta `~/.codex`, Skills, pluginów, konfiguracji, stanu wątków ani natywnych
  `$HOME/.agents/skills`.

Plugin blokuje starsze lub niewersjonowane uzgodnienia z serwerem aplikacji. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, względem której został przetestowany.

W przypadku testów dymnych live i Docker uwierzytelnianie zwykle pochodzi z konta CLI Codex
albo profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia serwera aplikacji stdio mogą
też awaryjnie użyć `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy nie ma konta.

## Pliki rozruchowe obszaru roboczego

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentów projektu. OpenClaw
nie zapisuje syntetycznych plików dokumentów projektu Codex ani nie zależy od awaryjnych
nazw plików Codex dla plików persony, ponieważ mechanizmy awaryjne Codex mają zastosowanie tylko wtedy, gdy
brakuje `AGENTS.md`.

Aby zachować zgodność obszaru roboczego OpenClaw, mechanizm Codex rozwiązuje pozostałe pliki rozruchowe
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` oraz `MEMORY.md`, gdy istnieje) i przekazuje je przez instrukcje konfiguracji Codex
przy `thread/start` i `thread/resume`. Dzięki temu
`SOUL.md` i powiązany kontekst persony/profilu obszaru roboczego pozostają widoczne bez
duplikowania `AGENTS.md`.

## Dodawanie Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent ma swobodnie przełączać się
między Codex i modelami dostawców innych niż Codex. Wymuszone środowisko uruchomieniowe dotyczy każdego
osadzonego obrotu dla tego agenta lub tej sesji. Jeśli wybierzesz model Anthropic, gdy
to środowisko uruchomieniowe jest wymuszone, OpenClaw nadal spróbuje mechanizmu Codex i zakończy niepowodzeniem w trybie zamkniętym,
zamiast po cichu przekierować ten obrót przez PI.

Zamiast tego użyj jednego z tych kształtów:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta na `agentRuntime.id: "auto"` i awaryjne PI do normalnego mieszanego
  użycia dostawców.
- Używaj starszych odwołań `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` oraz jawną politykę środowiska uruchomieniowego Codex.

Na przykład to pozostawia domyślnego agenta na normalnym wyborze automatycznym i
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

- Domyślny agent `main` używa normalnej ścieżki dostawcy i awaryjnej zgodności z PI.
- Agent `codex` używa mechanizmu serwera aplikacji Codex.
- Jeśli Codex jest niedostępny lub nieobsługiwany dla agenta `codex`, obrót kończy się niepowodzeniem
  zamiast po cichu użyć PI.

## Routing poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, a nie tylko według słowa „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Powiąż ten czat z Codex”                              | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                    | `/codex threads`                                 |
| „Zgłoś raport wsparcia dotyczący nieudanego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij opinię Codex tylko dla tego dołączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj mojej subskrypcji ChatGPT/Codex z runtime Codex” | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Użyj mojej subskrypcji ChatGPT/Codex przez PI”        | odwołania modeli `openai-codex/*`                |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` ani nie natywni podagenci |

OpenClaw reklamuje agentom wskazówki tworzenia ACP tylko wtedy, gdy ACP jest włączone,
dostępne do wysłania i wspierane przez załadowany backend runtime. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills pluginu nie powinny uczyć agenta routingu ACP.

## Wdrożenia tylko z Codex

Wymuś mechanizm Codex, gdy musisz dowieść, że każdy osadzony obrót agenta
używa Codex. Jawne środowiska uruchomieniowe pluginu kończą się niepowodzeniem w trybie zamkniętym i nigdy nie są po cichu ponawiane
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

Gdy Codex jest wymuszony, OpenClaw kończy się wcześnie niepowodzeniem, jeśli plugin Codex jest wyłączony, serwer
aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić.

## Codex dla poszczególnych agentów

Możesz uczynić jednego agenta wyłącznie Codex, podczas gdy domyślny agent zachowuje normalny
wybór automatyczny:

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
sesję OpenClaw, a mechanizm Codex tworzy lub wznawia swój pomocniczy wątek serwera aplikacji
według potrzeb. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnemu obrotowi ponownie rozwiązać mechanizm z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie plugin Codex pyta serwer aplikacji o dostępne modele. Jeśli
wykrywanie się nie powiedzie albo przekroczy limit czasu, używa dołączonego katalogu awaryjnego dla:

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

Wyłącz wykrywanie, gdy chcesz, aby start unikał sondowania Codex i trzymał się
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

Domyślnie plugin uruchamia lokalnie zarządzany przez OpenClaw plik binarny Codex za pomocą:

```bash
codex app-server --listen stdio://
```

Zarządzany plik binarny jest dostarczany z pakietem pluginu `codex`. Dzięki temu
wersja serwera aplikacji jest powiązana z dołączonym pluginem, a nie z dowolnym osobnym
CLI Codex, który akurat jest zainstalowany lokalnie. Ustaw `appServer.command` tylko wtedy, gdy
celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje mechanizmu Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jest to zaufana lokalna postawa operatora używana
dla autonomicznych Heartbeat: Codex może używać narzędzi powłoki i sieciowych bez
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

Tryb strażnika używa natywnej ścieżki zatwierdzeń z automatycznym przeglądem w Codex. Gdy Codex prosi o
opuszczenie piaskownicy, zapis poza obszarem roboczym albo dodanie uprawnień, takich jak dostęp
do sieci, Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
promptu dla człowieka. Recenzent stosuje ramy oceny ryzyka Codex i zatwierdza lub odrzuca
konkretne żądanie. Używaj trybu Guardian, gdy chcesz mieć więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby agenci bez nadzoru robili postępy.

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
`CODEX_HOME`, jak i `HOME` na katalogi poszczególnych agentów w stanie OpenClaw tego agenta.
Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` oraz
`$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień serwera aplikacji.
Dzięki temu natywne Skills, pluginy, konfiguracja, konta i stan wątków Codex
są ograniczone do agenta OpenClaw zamiast wyciekać z osobistego katalogu domowego CLI Codex operatora.

Pluginy OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny
rejestr pluginów i loader Skills OpenClaw. Osobiste zasoby CLI Codex nie. Jeśli masz
użyteczne Skills lub pluginy CLI Codex, które powinny stać się częścią agenta OpenClaw,
zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Provider migracji Codex kopiuje Skills do bieżącego obszaru roboczego agenta OpenClaw.
Natywne pluginy, hooki i pliki konfiguracyjne Codex są zgłaszane lub archiwizowane
do ręcznego przeglądu zamiast automatycznej aktywacji, ponieważ mogą
wykonywać polecenia, wystawiać serwery MCP lub przenosić poświadczenia.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, następnie
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie OpenAI
   jest nadal wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z utworzonego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych obrotów serwera aplikacji Codex przez API.
Jawne profile kluczy API Codex i lokalne awaryjne klucze środowiskowe stdio używają logowania serwera aplikacji
zamiast odziedziczonego środowiska procesu potomnego. Połączenia WebSocket z serwerem aplikacji
nie otrzymują awaryjnych kluczy API ze środowiska Gateway; użyj jawnego profilu uwierzytelniania albo
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

`appServer.clearEnv` wpływa tylko na uruchomiony proces potomny app-server Codex.

Dynamiczne narzędzia Codex domyślnie używają profilu `native-first`. W tym trybie
OpenClaw nie udostępnia dynamicznych narzędzi, które duplikują natywne operacje
obszaru roboczego Codex: `read`, `write`, `edit`, `apply_patch`, `exec`,
`process` oraz `update_plan`. Narzędzia integracyjne OpenClaw, takie jak
wiadomości, sesje, multimedia, cron, przeglądarka, węzły, gateway,
`heartbeat_respond` i `web_search`, pozostają dostępne.

Obsługiwane pola najwyższego poziomu Plugin Codex:

| Pole                       | Domyślnie        | Znaczenie                                                                                                 |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Użyj `"openclaw-compat"`, aby udostępnić pełny zestaw dynamicznych narzędzi OpenClaw app-server Codex.    |
| `codexDynamicToolsExclude` | `[]`             | Dodatkowe nazwy dynamicznych narzędzi OpenClaw do pominięcia w turach app-server Codex.                   |

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                                          |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko przy jawnym nadpisaniu.                                                                                                             |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                                      |
| `url`               | nieustawione                             | Adres URL app-server WebSocket.                                                                                                                                                                                                                      |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                                                                                                                                                               |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu stdio app-server po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent OpenClaw przy lokalnych uruchomieniach. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                           |
| `mode`              | `"yolo"`                                 | Ustawienie wstępne dla wykonywania YOLO albo sprawdzanego przez guardian.                                                                                                                                                                            |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku/turze.                                                                                                                                                               |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb sandbox Codex wysyłany przy rozpoczęciu/wznowieniu wątku.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby Codex sprawdzał natywne monity zatwierdzania. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                              |
| `serviceTier`       | nieustawione                             | Opcjonalna warstwa usługi app-server Codex: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                                            |

Wywołania dynamicznych narzędzi należące do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw
przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex
nieudaną odpowiedź dynamicznego narzędzia, aby tura mogła być kontynuowana
zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie app-server Codex ograniczone zakresem tury,
harness oczekuje także, że Codex zakończy natywną turę za pomocą
`turn/completed`. Jeśli app-server milczy przez 60 sekund po tej odpowiedzi,
OpenClaw dokłada starań, aby przerwać turę Codex, zapisuje diagnostyczne
przekroczenie limitu czasu i zwalnia pas sesji OpenClaw, aby kolejne wiadomości
czatu nie były kolejkowane za nieaktualną natywną turą.

Nadpisania środowiska pozostają dostępne do lokalnego testowania:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy
`appServer.command` jest nieustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego lokalnego testowania.
Konfiguracja jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje
zachowanie Plugin w tym samym sprawdzonym pliku co resztę konfiguracji harness Codex.

## Użycie komputera

Użycie komputera omówiono w osobnym przewodniku konfiguracji:
[Użycie komputera w Codex](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza aplikacji sterowania pulpitem ani samodzielnie
nie wykonuje działań na pulpicie. Przygotowuje app-server Codex, weryfikuje, że
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex obsługiwać
natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace Codex,
zarejestruj `cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Użycie komputera w Codex](/pl/plugins/codex-computer-use), aby poznać różnicę
między użyciem komputera należącym do Codex a bezpośrednią rejestracją MCP.

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

Konfigurację można sprawdzić albo zainstalować z poziomu poleceń:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Użycie komputera jest specyficzne dla macOS i może wymagać lokalnych uprawnień
systemu operacyjnego, zanim serwer MCP Codex będzie mógł sterować aplikacjami.
Jeśli `computerUse.enabled` ma wartość true, a serwer MCP jest niedostępny, tury
w trybie Codex kończą się niepowodzeniem przed uruchomieniem wątku, zamiast
cicho działać bez natywnych narzędzi użycia komputera. Zobacz
[Użycie komputera w Codex](/pl/plugins/codex-computer-use), aby poznać wybory
marketplace, limity zdalnego katalogu, powody statusu i rozwiązywanie problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować
standardowy dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` albo `/reset` po zmianie
konfiguracji środowiska uruchomieniowego lub użycia komputera, aby istniejące
sesje nie zachowywały starego powiązania wątku PI albo Codex.

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
jest dołączona do istniejącego wątku Codex, następna tura ponownie wysyła do
app-server aktualnie wybrany model OpenAI, dostawcę, politykę zatwierdzania,
sandbox i warstwę usługi. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2`
zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane polecenie ukośnikiem. Jest
ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje bieżącą łączność z serwerem aplikacji, modele, konto, limity użycia, serwery MCP oraz Skills.
- `/codex models` wyświetla modele bieżącego serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywną recenzję Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany Plugin Computer Use oraz serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany Plugin Computer Use i przeładowuje serwery MCP.
- `/codex account` pokazuje stan konta oraz limitów użycia.
- `/codex mcp` wyświetla stan serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

Gdy Codex zgłasza błąd limitu użycia, OpenClaw dołącza następny czas
resetu serwera aplikacji, jeśli Codex go podał. Użyj `/codex account` w tej samej
konwersacji, aby sprawdzić bieżące konto i okna limitów użycia.

### Typowy przepływ debugowania

Gdy agent oparty na Codex zrobi coś zaskakującego w Telegram, Discord, Slack
lub innym kanale, zacznij od konwersacji, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką notatkę
   opisującą to, co zobaczono.
2. Zatwierdź żądanie diagnostyczne raz. Zatwierdzenie tworzy lokalny plik zip
   diagnostyki Gateway i, ponieważ sesja używa uprzęży Codex, wysyła także
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu lub wątku wsparcia.
   Zawiera ona ścieżkę lokalnego pakietu, podsumowanie prywatności, identyfikatory sesji OpenClaw,
   identyfikatory wątków Codex oraz wiersz `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować uruchomienie, uruchom wypisane polecenie `Inspect locally`
   w terminalu. Wygląda ono jak `codex resume <thread-id>` i otwiera
   natywny wątek Codex, aby można było sprawdzić konwersację, kontynuować ją lokalnie
   albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub plan.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie potrzebujesz przesłania
opinii Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostyki
Gateway OpenClaw. W przypadku większości zgłoszeń wsparcia `/diagnostics [note]` jest
lepszym punktem startowym, ponieważ łączy lokalny stan Gateway i identyfikatory
wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics),
aby poznać pełny model prywatności i zachowanie w czatach grupowych.

Rdzeń OpenClaw udostępnia także właścicielskie `/diagnostics [note]` jako ogólne
polecenie diagnostyki Gateway. Jego monit zatwierdzenia pokazuje wstęp o danych
wrażliwych, linkuje do [Eksportu diagnostyki](/pl/gateway/diagnostics) i za każdym
razem żąda `openclaw gateway diagnostics export --json` przez jawne zatwierdzenie
wykonania. Nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu
OpenClaw wysyła raport gotowy do wklejenia ze ścieżką lokalnego pakietu i
podsumowaniem manifestu. Gdy aktywna sesja OpenClaw używa uprzęży Codex, to
samo zatwierdzenie autoryzuje także wysłanie odpowiednich pakietów opinii Codex na
serwery OpenAI. Monit zatwierdzenia mówi, że opinia Codex zostanie wysłana, ale
nie wyświetla identyfikatorów sesji ani wątków Codex przed zatwierdzeniem.

Jeśli `/diagnostics` zostanie wywołane przez właściciela na czacie grupowym, OpenClaw utrzymuje
wspólny kanał w czystości: grupa otrzymuje tylko krótkie powiadomienie, a
wstęp diagnostyczny, monity zatwierdzenia oraz identyfikatory sesji/wątków Codex są wysyłane do
właściciela prywatną trasą zatwierdzania. Jeśli nie ma prywatnej trasy właściciela,
OpenClaw odrzuca żądanie grupowe i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` serwera aplikacji Codex i prosi
serwer aplikacji o dołączenie logów dla każdego wymienionego wątku oraz utworzonych podwątków Codex,
gdy są dostępne. Przesyłanie przechodzi zwykłą ścieżką opinii Codex na serwery OpenAI;
jeśli opinie Codex są wyłączone na tym serwerze aplikacji, polecenie zwraca
błąd serwera aplikacji. Ukończona odpowiedź diagnostyczna wymienia kanały,
identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia
`codex resume <thread-id>` dla wysłanych wątków. Jeśli odrzucisz lub zignorujesz zatwierdzenie,
OpenClaw nie wypisze tych identyfikatorów Codex. To przesłanie nie zastępuje lokalnego
eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam plik wiązania towarzyszącego, którego uprząż używa do
normalnych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje
aktualnie wybrany model OpenClaw do serwera aplikacji i pozostawia włączoną
rozszerzoną historię.

### Sprawdzanie wątku Codex z CLI

Najszybszym sposobem zrozumienia nieudanego uruchomienia Codex jest często bezpośrednie otwarcie
natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w konwersacji kanału i chcesz sprawdzić
problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego dokonał
konkretnego wyboru narzędzia lub rozumowania. Najprostszą ścieżką jest zwykle najpierw uruchomienie
`/diagnostics [note]`: po zatwierdzeniu ukończony raport wymienia
każdy wątek Codex i wypisuje polecenie `Inspect locally`, na przykład
`codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio do terminala.

Identyfikator wątku możesz także uzyskać z `/codex binding` dla bieżącego czatu lub
`/codex threads [filter]` dla ostatnich wątków serwera aplikacji Codex, a następnie uruchomić to samo
polecenie `codex resume` w powłoce.

Powierzchnia poleceń wymaga serwera aplikacji Codex `0.125.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy serwer aplikacji nie udostępnia tej metody JSON-RPC.

## Granice hooków

Uprząż Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                 | Zgodność produktu/Plugin w uprzężach PI i Codex.                    |
| Middleware rozszerzeń serwera aplikacji Codex | Pluginy dołączone do OpenClaw | Zachowanie adaptera na turę wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania
zachowaniem Plugin OpenClaw. Dla obsługiwanego pomostu natywnych narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex dla wątku dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`. Inne hooki Codex, takie jak `SessionStart` i
`UserPromptSubmit`, pozostają kontrolkami na poziomie Codex; nie są udostępniane jako
hooki Plugin OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia należące do niego zachowanie Plugin i middleware w
adapterze uprzęży. W przypadku narzędzi natywnych Codex to Codex jest właścicielem kanonicznego rekordu narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępnia tę operację przez serwer aplikacji albo wywołania zwrotne natywnych hooków.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień serwera aplikacji Codex
i stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex.
Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie bajt w bajt przechwyconymi
wewnętrznymi żądaniami ani ładunkami Compaction Codex.

Natywne powiadomienia serwera aplikacji Codex `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania.
Nie wywołują hooków Plugin OpenClaw.

## Kontrakt obsługi V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex posiada większą część
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji
wokół tej granicy.

Obsługiwane w środowisku wykonawczym Codex v1:

| Powierzchnia                                  | Obsługa                                 | Dlaczego                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                             | Serwer aplikacji Codex posiada turę OpenAI, wznowienie natywnego wątku oraz kontynuację natywnego narzędzia.                                                                                          |
| Trasowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem wykonawczym modelu.                                                                                            |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                          |
| Pluginy promptów i kontekstu                  | Obsługiwane                             | OpenClaw buduje nakładki promptu i projektuje kontekst do tury Codex przed rozpoczęciem lub wznowieniem wątku.                                                                                        |
| Cykl życia silnika kontekstu                  | Obsługiwane                             | Składanie, pobieranie lub utrzymanie po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                  |
| Hooki narzędzi dynamicznych                   | Obsługiwane                             | `before_tool_call`, `after_tool_call` oraz middleware wyników narzędzi działają wokół należących do OpenClaw narzędzi dynamicznych.                                                                   |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z rzetelnymi ładunkami trybu Codex.                                                                  |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez przekaźnik natywnych hooków | Codex `Stop` jest przekazywane do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                               |
| Natywne blokowanie lub obserwacja powłoki, łatek i MCP | Obsługiwane przez przekaźnik natywnych hooków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych powierzchni narzędzi natywnych, w tym ładunków MCP na serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez przekaźnik natywnych hooków | Codex `PermissionRequest` może być trasowane przez politykę OpenClaw tam, gdzie środowisko wykonawcze ją udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex kontynuuje przez zwykłą ścieżkę strażnika lub zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                             | OpenClaw rejestruje żądanie wysłane do serwera aplikacji oraz powiadomienia serwera aplikacji, które otrzymuje.                                                                                       |

Nieobsługiwane w środowisku wykonawczym Codex v1:

| Powierzchnia                                       | Granica V1                                                                                                                                      | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Modyfikacja argumentów natywnego narzędzia          | Natywne haki przednarzędziowe Codex mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych dla Codex.                        | Wymaga obsługi haków/schematu Codex dla zastępczych danych wejściowych narzędzia.         |
| Edytowalna historia transkrypcji natywnej Codex     | Codex posiada kanoniczną historię natywnego wątku. OpenClaw posiada lustro i może rzutować przyszły kontekst, ale nie powinien modyfikować nieobsługiwanych elementów wewnętrznych. | Dodać jawne API app-server Codex, jeśli potrzebna jest chirurgiczna modyfikacja natywnego wątku. |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hak przekształca zapisy transkrypcji posiadane przez OpenClaw, a nie rekordy narzędzi natywnych Codex.                                      | Można tworzyć lustrzane kopie przekształconych rekordów, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction Codex.                                               |
| Interwencja w Compaction                            | Obecne haki Compaction OpenClaw w trybie Codex działają na poziomie powiadomień.                                                                 | Dodać haki Codex przed/po Compaction, jeśli plugins muszą wetować lub przepisywać natywną Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie   | OpenClaw może przechwytywać żądania i powiadomienia app-server, ale rdzeń Codex buduje finalne żądanie API OpenAI wewnętrznie.                 | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                     |

## Narzędzia, media i Compaction

Uprząż Codex zmienia tylko niskopoziomowy osadzony wykonawca agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
uprzęży. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i wyjście narzędzi
wiadomości nadal przechodzą przez zwykłą ścieżkę dostarczania OpenClaw.

Natywny przekaźnik haków jest celowo ogólny, ale kontrakt obsługi v1 jest
ograniczony do natywnych ścieżek narzędzi i uprawnień Codex, które testuje
OpenClaw. W środowisku uruchomieniowym Codex obejmuje to ładunki powłoki,
łatek i MCP `PreToolUse`, `PostToolUse` oraz `PermissionRequest`. Nie zakładaj,
że każde przyszłe zdarzenie haka Codex jest powierzchnią plugin OpenClaw,
dopóki kontrakt środowiska uruchomieniowego jej nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy
tylko wtedy, gdy decyduje o tym polityka. Wynik bez decyzji nie jest
zezwoleniem. Codex traktuje go jako brak decyzji haka i przechodzi do własnej
ścieżki strażnika lub zatwierdzenia użytkownika.

Elicitacje zatwierdzeń narzędzi MCP Codex są kierowane przez przepływ
zatwierdzania plugin OpenClaw, gdy Codex oznaczy `_meta.codex_approval_kind`
jako `"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do
czatu źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada
na to natywne żądanie serwera zamiast być kierowana jako dodatkowy kontekst.
Inne żądania elicitacji MCP nadal kończą się bezpiecznym niepowodzeniem.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` app-server
Codex. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje
zakolejkowane wiadomości czatu przez skonfigurowane okno ciszy i wysyła je jako
jedno żądanie `turn/steer` w kolejności nadejścia. Starszy tryb `queue` wysyła
osobne żądania `turn/steer`. Tury przeglądu Codex i ręcznej Compaction mogą
odrzucać sterowanie w tej samej turze; wtedy OpenClaw używa kolejki followup,
gdy wybrany tryb dopuszcza rozwiązanie awaryjne. Zobacz [Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa uprzęży Codex, natywna Compaction wątku jest
delegowana do app-server Codex. OpenClaw utrzymuje lustro transkrypcji dla
historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania
modelu lub uprzęży. Lustro obejmuje prompt użytkownika, finalny tekst
asystenta oraz lekkie rekordy rozumowania lub planu Codex, gdy app-server je
emituje. Obecnie OpenClaw zapisuje tylko sygnały rozpoczęcia i zakończenia
natywnej Compaction. Nie udostępnia jeszcze czytelnego dla człowieka
podsumowania Compaction ani możliwej do audytu listy wpisów, które Codex
zachował po Compaction.

Ponieważ Codex posiada kanoniczny natywny wątek, `tool_result_persist` obecnie
nie przepisuje rekordów wyników narzędzi natywnych Codex. Ma zastosowanie tylko
wtedy, gdy OpenClaw zapisuje wynik narzędzia transkrypcji sesji posiadanej
przez OpenClaw.

Generowanie mediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS i rozumienie
mediów nadal używają odpowiednich ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** to oczekiwane w nowych
konfiguracjach. Wybierz model `openai/gpt-*` z `agentRuntime.id: "codex"` (albo
starszą referencję `codex/*`), włącz `plugins.entries.codex.enabled` i sprawdź,
czy `plugins.allow` nie wyklucza `codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może użyć PI jako
zaplecza zgodności, gdy żadna uprząż Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania.
Wymuszone środowisko uruchomieniowe Codex kończy się niepowodzeniem zamiast
wracać do PI. Po wybraniu app-server Codex jego błędy są zgłaszane bezpośrednio.

**App-server jest odrzucany:** zaktualizuj Codex tak, aby uzgadnianie app-server
zgłaszało wersję `0.125.0` lub nowszą. Przedwydania tej samej wersji albo
wersje z sufiksem kompilacji, takie jak `0.125.0-alpha.2` lub `0.125.0+custom`,
są odrzucane, ponieważ stabilne minimum protokołu `0.125.0` jest tym, co
testuje OpenClaw.

**Wykrywanie modeli jest wolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie.

**Transport WebSocket od razu kończy się niepowodzeniem:** sprawdź
`appServer.url`, `authToken` oraz czy zdalny app-server mówi tą samą wersją
protokołu app-server Codex.

**Model inny niż Codex używa PI:** to oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starszą referencję
`codex/*`. Zwykłe referencje `openai/gpt-*` i innych dostawców pozostają na
swojej normalnej ścieżce dostawcy w trybie `auto`. Jeśli wymusisz
`agentRuntime.id: "codex"`, każda osadzona tura dla tego agenta musi być
obsługiwanym przez Codex modelem OpenAI.

**Computer Use jest zainstalowane, ale narzędzia nie działają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem się
utrzymuje, zrestartuj Gateway, aby wyczyścić nieaktualne rejestracje natywnych
haków. Jeśli `computer-use.list_apps` przekracza limit czasu, zrestartuj Codex
Computer Use lub Codex Desktop i spróbuj ponownie.

## Powiązane

- [Plugins uprzęży agentów](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Haki plugin](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
