---
read_when:
    - Chcesz użyć dołączonego mechanizmu app-server Codex
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia wyłącznie z Codexem kończyły się niepowodzeniem zamiast przechodzić awaryjnie na Pi
summary: Uruchamiaj tury osadzonego agenta OpenClaw za pośrednictwem dołączonego środowiska testowego Codex app-server
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-05-03T09:49:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83cb442bb2b87fdfe530619e8951bc8f4f5a7d3bfd68ca49eeb16bbdd8b189b4
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
serwer aplikacji Codex zamiast wbudowanej uprzęży PI.

Użyj tego, gdy chcesz, aby Codex odpowiadał za niskopoziomową sesję agenta:
wykrywanie modeli, natywne wznawianie wątków, natywną compaction oraz
wykonywanie na serwerze aplikacji. OpenClaw nadal odpowiada za kanały czatu,
pliki sesji, wybór modelu, narzędzia, zatwierdzenia, dostarczanie multimediów
oraz widoczne lustrzane odbicie transkryptu.

Gdy tura czatu źródłowego działa przez uprząż Codex, widoczne odpowiedzi
domyślnie używają narzędzia OpenClaw `message`, jeśli wdrożenie nie
skonfigurowało jawnie `messages.visibleReplies`. Agent nadal może prywatnie
zakończyć swoją turę Codex; publikuje w kanale tylko wtedy, gdy wywoła
`message(action="send")`. Ustaw `messages.visibleReplies: "automatic"`, aby
zachować końcowe odpowiedzi w bezpośrednim czacie na starszej automatycznej
ścieżce dostarczania.

Tury heartbeat Codex domyślnie otrzymują też narzędzie `heartbeat_respond`,
dzięki czemu agent może zapisać, czy wybudzenie ma pozostać ciche, czy wysłać
powiadomienie, bez kodowania tego przepływu sterowania w tekście końcowym.

Jeśli próbujesz się zorientować, zacznij od
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes). Krótka wersja:
`openai/gpt-5.5` to referencja modelu, `codex` to runtime, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Większość użytkowników, którzy chcą „Codex w OpenClaw”, chce tej ścieżki:
zaloguj się z subskrypcją ChatGPT/Codex, a następnie uruchamiaj osadzone tury
agenta przez natywny runtime serwera aplikacji Codex. Referencja modelu nadal
pozostaje kanoniczna jako `openai/gpt-*`; uwierzytelnianie subskrypcji pochodzi
z konta/profilu Codex, nie z prefiksu modelu `openai-codex/*`.

Najpierw zaloguj się przez Codex OAuth, jeśli jeszcze tego nie zrobiono:

```bash
openclaw models auth login --provider openai-codex
```

Następnie włącz dołączony plugin `codex` i wymuś runtime Codex:

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

Jeśli konfiguracja używa `plugins.allow`, dodaj tam również `codex`:

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

Nie używaj `openai-codex/gpt-*`, gdy masz na myśli natywny runtime Codex. Ten
prefiks oznacza jawną ścieżkę „Codex OAuth przez PI”. Zmiany konfiguracji
dotyczą nowych lub zresetowanych sesji; istniejące sesje zachowują zapisany
runtime.

## Co zmienia ten plugin

Dołączony plugin `codex` wnosi kilka oddzielnych możliwości:

| Możliwość                         | Jak jej używać                                      | Co robi                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywny osadzony runtime          | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez serwer aplikacji Codex.         |
| Natywne komendy sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże i kontroluje wątki serwera aplikacji Codex z konwersacji w komunikatorze. |
| Dostawca/katalog serwera aplikacji Codex | elementy wewnętrzne `codex`, udostępniane przez uprząż | Pozwala runtime wykrywać i walidować modele serwera aplikacji.                |
| Ścieżka rozumienia multimediów Codex | ścieżki zgodności modeli obrazów `codex/*`          | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik hooków         | Hooki pluginu wokół natywnych zdarzeń Codex         | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie pluginu udostępnia te możliwości. **Nie**:

- zaczyna używać Codex dla każdego modelu OpenAI
- konwertuje referencji modeli `openai-codex/*` na natywny runtime
- ustawia ACP/acpx jako domyślnej ścieżki Codex
- przełącza na gorąco istniejących sesji, które już zapisały runtime PI
- zastępuje dostarczania kanałów OpenClaw, plików sesji, przechowywania profili
  uwierzytelniania ani routingu wiadomości

Ten sam plugin odpowiada również za natywną powierzchnię komend sterowania
czatem `/codex`. Jeśli plugin jest włączony, a użytkownik prosi o powiązanie,
wznowienie, sterowanie, zatrzymanie lub sprawdzenie wątków Codex z czatu,
agenci powinni preferować `/codex ...` zamiast ACP. ACP pozostaje jawną opcją
zapasową, gdy użytkownik prosi o ACP/acpx albo testuje adapter ACP Codex.

Natywne tury Codex zachowują hooki pluginów OpenClaw jako publiczną warstwę
zgodności. To są wewnątrzprocesowe hooki OpenClaw, nie hooki komend Codex
`hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkryptu
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą także rejestrować neutralne względem runtime middleware wyników
narzędzi, aby przepisywać wyniki dynamicznych narzędzi OpenClaw po wykonaniu
narzędzia przez OpenClaw i przed zwróceniem wyniku do Codex. Jest to oddzielne
od publicznego hooka pluginu `tool_result_persist`, który transformuje zapisy
wyników narzędzi w transkrypcie należącym do OpenClaw.

Semantykę samych hooków pluginu opisują [Hooki pluginów](/pl/plugins/hooks)
oraz [Zachowanie strażnika pluginów](/pl/tools/plugin).

Uprząż jest domyślnie wyłączona. Nowe konfiguracje powinny zachowywać
referencje modeli OpenAI w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`, gdy chcą
natywnego wykonywania na serwerze aplikacji. Starsze referencje modeli
`codex/*` nadal automatycznie wybierają uprząż dla zgodności, ale starsze
prefiksy dostawców obsługiwane przez runtime nie są pokazywane jako zwykłe
wybory modelu/dostawcy.

Jeśli plugin `codex` jest włączony, ale model główny nadal ma postać
`openai-codex/*`, `openclaw doctor` wyświetla ostrzeżenie zamiast zmieniać
ścieżkę. To zamierzone: `openai-codex/*` pozostaje ścieżką PI Codex
OAuth/subskrypcji, a natywne wykonywanie na serwerze aplikacji pozostaje jawnym
wyborem runtime.

## Mapa ścieżek

Użyj tej tabeli przed zmianą konfiguracji:

| Oczekiwane zachowanie                              | Referencja modelu          | Konfiguracja runtime                  | Ścieżka uwierzytelniania/profilu | Oczekiwana etykieta statusu     |
| -------------------------------------------------- | -------------------------- | ------------------------------------- | -------------------------------- | ------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym runtime Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`            | Codex OAuth lub konto Codex      | `Runtime: OpenAI Codex`         |
| OpenAI API przez zwykły runner OpenClaw            | `openai/gpt-*`             | pominięte albo `runtime: "pi"`        | klucz OpenAI API                 | `Runtime: OpenClaw Pi Default`  |
| Subskrypcja ChatGPT/Codex przez PI                 | `openai-codex/gpt-*`       | pominięte albo `runtime: "pi"`        | dostawca OpenAI Codex OAuth      | `Runtime: OpenClaw Pi Default`  |
| Mieszani dostawcy z konserwatywnym trybem auto     | referencje specyficzne dla dostawcy | `agentRuntime.id: "auto"`             | Według wybranego dostawcy        | Zależy od wybranego runtime     |
| Jawna sesja adaptera Codex ACP                     | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"`   | uwierzytelnianie backendu ACP    | status zadania/sesji ACP        |

Ważny podział to dostawca kontra runtime:

- `openai-codex/*` odpowiada na pytanie „której ścieżki dostawcy/uwierzytelniania ma użyć PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla ma wykonać tę
  osadzoną turę?”
- `/codex ...` odpowiada na pytanie „z którą natywną konwersacją Codex ma się
  powiązać ten czat albo którą ma kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces uprzęży ma uruchomić acpx?”

## Wybór właściwego prefiksu modelu

Ścieżki z rodziny OpenAI są zależne od prefiksu. W typowej konfiguracji
subskrypcji plus natywny runtime Codex użyj `openai/*` z
`agentRuntime.id: "codex"`. Używaj `openai-codex/*` tylko wtedy, gdy celowo
chcesz Codex OAuth przez PI:

| Referencja modelu                            | Ścieżka runtime                              | Kiedy używać                                                               |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Dostawca OpenAI przez hydraulikę OpenClaw/PI | Chcesz bieżący bezpośredni dostęp do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OpenAI Codex OAuth przez OpenClaw/PI         | Chcesz uwierzytelnianie subskrypcji ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Uprząż serwera aplikacji Codex               | Chcesz uwierzytelnianie subskrypcji ChatGPT/Codex z natywnym wykonywaniem Codex. |

GPT-5.5 może pojawiać się zarówno na bezpośrednich ścieżkach klucza API OpenAI,
jak i na ścieżkach subskrypcji Codex, gdy konto je udostępnia. Użyj
`openai/gpt-5.5` z uprzężą serwera aplikacji Codex dla natywnego runtime Codex,
`openai-codex/gpt-5.5` dla PI OAuth albo `openai/gpt-5.5` bez nadpisania
runtime Codex dla bezpośredniego ruchu z kluczem API.

Starsze referencje `codex/gpt-*` pozostają akceptowane jako aliasy zgodności.
Migracja zgodności w Doctor przepisuje starsze referencje głównego runtime na
kanoniczne referencje modeli i zapisuje politykę runtime osobno, natomiast
starsze referencje używane tylko jako fallback pozostają bez zmian, ponieważ
runtime jest konfigurowany dla całego kontenera agenta. Nowe konfiguracje PI
Codex OAuth powinny używać `openai-codex/gpt-*`; nowe konfiguracje natywnej
uprzęży serwera aplikacji powinny używać `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy
OpenAI Codex OAuth. Użyj `codex/gpt-*`, gdy rozumienie obrazów ma działać przez
ograniczoną turę serwera aplikacji Codex. Model serwera aplikacji Codex musi
deklarować obsługę wejścia obrazu; tekstowe modele Codex kończą się błędem,
zanim tura multimedialna się rozpocznie.

Użyj `/status`, aby potwierdzić efektywną uprząż dla bieżącej sesji. Jeśli
wybór jest zaskakujący, włącz logowanie debugowania dla podsystemu
`agents/harness` i sprawdź strukturalny rekord gatewaya `agent harness selected`.
Zawiera identyfikator wybranej uprzęży, powód wyboru, politykę
runtime/fallback oraz, w trybie `auto`, wynik obsługi każdego kandydata pluginu.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy wszystkie poniższe warunki są spełnione:

- dołączony plugin `codex` jest włączony lub dozwolony
- główny model agenta ma postać `openai-codex/*`
- efektywny runtime tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „włączony
plugin Codex” oznacza „natywny runtime serwera aplikacji Codex”. OpenClaw nie
wykonuje takiego przeskoku. Ostrzeżenie oznacza:

- **Nie trzeba nic zmieniać**, jeśli zamiarem był ChatGPT/Codex OAuth przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamiarem było natywne wykonywanie na
  serwerze aplikacji.
- Istniejące sesje po zmianie runtime nadal wymagają `/new` lub `/reset`,
  ponieważ przypięcia runtime sesji są trwałe.

Wybór uprzęży nie jest kontrolką sesji na żywo. Gdy osadzona tura działa,
OpenClaw zapisuje identyfikator wybranej uprzęży w tej sesji i nadal go używa
dla kolejnych tur w tym samym identyfikatorze sesji. Zmień konfigurację
`agentRuntime` albo `OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby przyszłe sesje
używały innej uprzęży; użyj `/new` lub `/reset`, aby rozpocząć świeżą sesję
przed przełączeniem istniejącej konwersacji między PI i Codex. Pozwala to
uniknąć odtwarzania jednego transkryptu przez dwa niezgodne natywne systemy
sesji.

Starsze sesje utworzone przed przypięciami uprzęży są traktowane jako
przypięte do PI, gdy mają historię transkryptu. Użyj `/new` lub `/reset`, aby
po zmianie konfiguracji włączyć tę konwersację do Codex.

`/status` pokazuje efektywne środowisko wykonawcze modelu. Domyślny harness PI pojawia się jako
`Runtime: OpenClaw Pi Default`, a harness serwera aplikacji Codex pojawia się jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym pluginem `codex`.
- Serwer aplikacji Codex `0.125.0` lub nowszy. Dołączony plugin domyślnie zarządza zgodnym
  plikiem binarnym serwera aplikacji Codex, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na normalne uruchamianie harnessu.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji albo dla mostka uwierzytelniania
  Codex w OpenClaw. Lokalne uruchomienia serwera aplikacji używają zarządzanego przez OpenClaw katalogu domowego Codex dla każdego
  agenta oraz izolowanego podrzędnego `HOME`, więc domyślnie nie odczytują Twojego osobistego
  konta, Skills, pluginów, konfiguracji, stanu wątków ani natywnych
  `$HOME/.agents/skills` z `~/.codex`.

Plugin blokuje starsze lub niewersjonowane uzgodnienia serwera aplikacji. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, względem której został przetestowany.

W testach smoke na żywo i w Dockerze uwierzytelnianie zwykle pochodzi z konta CLI Codex
albo z profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia serwera aplikacji przez stdio
mogą też użyć awaryjnie `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy nie ma konta.

## Pliki startowe workspace

Codex sam obsługuje `AGENTS.md` przez natywne wykrywanie dokumentacji projektu. OpenClaw
nie zapisuje syntetycznych plików dokumentacji projektu Codex ani nie zależy od zapasowych
nazw plików Codex dla plików persony, ponieważ mechanizmy zapasowe Codex mają zastosowanie tylko wtedy, gdy
brakuje `AGENTS.md`.

Aby zapewnić zgodność workspace OpenClaw, harness Codex rozwiązuje pozostałe pliki startowe
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` oraz `MEMORY.md`, gdy istnieje) i przekazuje je przez instrukcje konfiguracji Codex
podczas `thread/start` i `thread/resume`. Dzięki temu `SOUL.md` i powiązany kontekst persony/profilu workspace
pozostają widoczne bez duplikowania `AGENTS.md`.

## Dodawanie Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent ma swobodnie przełączać się
między Codex a modelami dostawców innych niż Codex. Wymuszone środowisko wykonawcze ma zastosowanie do każdej
osadzonej tury tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy
to środowisko wykonawcze jest wymuszone, OpenClaw nadal spróbuje harnessu Codex i zakończy działanie błędem
zamiast po cichu przekierować tę turę przez PI.

Zamiast tego użyj jednego z tych wariantów:

- Umieść Codex w dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta na `agentRuntime.id: "auto"` i awaryjne PI do zwykłego mieszanego
  użycia dostawców.
- Używaj starszych referencji `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` oraz jawną politykę środowiska wykonawczego Codex.

Na przykład ta konfiguracja pozostawia domyślnego agenta przy zwykłym automatycznym wyborze i
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

W takim układzie:

- Domyślny agent `main` używa zwykłej ścieżki dostawcy i awaryjnej zgodności PI.
- Agent `codex` używa harnessu serwera aplikacji Codex.
- Jeśli Codex jest niedostępny albo nieobsługiwany dla agenta `codex`, tura kończy się błędem
  zamiast po cichu użyć PI.

## Routing poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, nie wyłącznie według słowa „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Powiąż ten czat z Codex”                              | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                    | `/codex threads`                                 |
| „Zgłoś raport wsparcia dla nieudanego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij opinię Codex tylko dla tego dołączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj mojej subskrypcji ChatGPT/Codex ze środowiskiem wykonawczym Codex” | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Użyj mojej subskrypcji ChatGPT/Codex przez PI”        | referencje modeli `openai-codex/*`              |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` i nie natywne podagenty   |

OpenClaw reklamuje agentom wskazówki dotyczące uruchamiania ACP tylko wtedy, gdy ACP jest włączone,
możliwe do dispatchu i obsługiwane przez załadowany backend środowiska wykonawczego. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills pluginu nie powinny uczyć agenta o routingu ACP.

## Wdrożenia tylko z Codex

Wymuś harness Codex, gdy musisz udowodnić, że każda osadzona tura agenta
używa Codex. Jawne środowiska wykonawcze pluginów kończą się błędem i nigdy nie są po cichu ponawiane
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

Po wymuszeniu Codex OpenClaw wcześnie kończy działanie błędem, jeśli plugin Codex jest wyłączony,
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

Używaj zwykłych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy świeżą
sesję OpenClaw, a harness Codex tworzy lub wznawia swój poboczny wątek serwera aplikacji
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnej turze ponownie rozwiązać harness z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie plugin Codex pyta serwer aplikacji o dostępne modele. Jeśli
wykrywanie się nie powiedzie albo przekroczy limit czasu, używa dołączonego katalogu zapasowego dla:

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

Domyślnie plugin uruchamia lokalnie zarządzany przez OpenClaw plik binarny Codex za pomocą:

```bash
codex app-server --listen stdio://
```

Zarządzany plik binarny jest dostarczany z pakietem pluginu `codex`. Dzięki temu
wersja serwera aplikacji jest powiązana z dołączonym pluginem, a nie z dowolnym osobnym
CLI Codex zainstalowanym lokalnie. Ustaw `appServer.command` tylko wtedy, gdy
celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje harnessu Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. Jest to zaufana lokalna postawa operatora używana
dla autonomicznych Heartbeat: Codex może używać powłoki i narzędzi sieciowych bez
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

Tryb Guardian używa natywnej ścieżki automatycznego przeglądu zatwierdzeń Codex. Gdy Codex prosi o
opuszczenie sandboxu, zapis poza workspace albo dodanie uprawnień, takich jak dostęp do sieci,
Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza albo odrzuca
konkretne żądanie. Używaj Guardian, gdy chcesz więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

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

Uruchomienia serwera aplikacji przez stdio domyślnie dziedziczą środowisko procesu OpenClaw,
ale OpenClaw posiada mostek konta serwera aplikacji Codex i ustawia zarówno
`CODEX_HOME`, jak i `HOME` na katalogi per agent w stanie OpenClaw tego agenta.
Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` oraz
`$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień
serwera aplikacji. Dzięki temu natywne Skills, pluginy, konfiguracja, konta i stan wątków Codex
pozostają ograniczone do agenta OpenClaw, zamiast przenikać z osobistego katalogu domowego
CLI Codex operatora.

Pluginy OpenClaw i snapshoty Skills OpenClaw nadal przepływają przez własny
rejestr pluginów i loader Skills OpenClaw. Osobiste zasoby CLI Codex nie przepływają. Jeśli masz
przydatne Skills lub pluginy CLI Codex, które powinny stać się częścią agenta OpenClaw,
zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego workspace agenta OpenClaw.
Natywne pluginy, hooki i pliki konfiguracyjne Codex są raportowane albo archiwizowane
do ręcznego przeglądu zamiast automatycznej aktywacji, ponieważ mogą
wykonywać polecenia, udostępniać serwery MCP albo przenosić dane uwierzytelniające.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji przez stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji, a uwierzytelnianie OpenAI
   nadal jest wymagane.

Gdy OpenClaw wykryje profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu podrzędnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla osadzeń lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych tur serwera aplikacji Codex przez API.
Jawne profile klucza API Codex i lokalny awaryjny klucz środowiskowy stdio używają logowania
serwera aplikacji zamiast odziedziczonego środowiska procesu podrzędnego. Połączenia WebSocket
z serwerem aplikacji nie otrzymują awaryjnych kluczy API ze środowiska Gateway; użyj jawnego profilu uwierzytelniania albo
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

`appServer.clearEnv` wpływa tylko na uruchomiony podrzędny proces serwera aplikacji Codex.

Narzędzia dynamiczne Codex domyślnie używają profilu `native-first`. W tym trybie
OpenClaw nie udostępnia narzędzi dynamicznych, które dublują natywne operacje
obszaru roboczego Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` i
`update_plan`. Narzędzia integracyjne OpenClaw, takie jak komunikacja, sesje, media,
cron, przeglądarka, węzły, gateway, `heartbeat_respond` i `web_search` pozostają
dostępne.

Obsługiwane pola najwyższego poziomu pluginu Codex:

| Pole                       | Domyślnie        | Znaczenie                                                                                      |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Użyj `"openclaw-compat"`, aby udostępnić pełny zestaw narzędzi dynamicznych OpenClaw serwerowi aplikacji Codex. |
| `codexDynamicToolsExclude` | `[]`             | Dodatkowe nazwy narzędzi dynamicznych OpenClaw, które mają zostać pominięte w turach serwera aplikacji Codex. |

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                            |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko w przypadku jawnego nadpisania.                                                                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                        |
| `url`               | nieustawione                             | URL serwera aplikacji WebSocket.                                                                                                                                                                                                       |
| `authToken`         | nieustawione                             | Token bearer dla transportu WebSocket.                                                                                                                                                                                                 |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                          |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu serwera aplikacji stdio po tym, jak OpenClaw zbuduje swoje dziedziczone środowisko. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent OpenClaw przy lokalnych uruchomieniach. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania serwera aplikacji.                                                                                                                                                                      |
| `mode`              | `"yolo"`                                 | Preset dla wykonywania YOLO lub przeglądanego przez guardian.                                                                                                                                                                          |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana do startu/wznowienia wątku/tury.                                                                                                                                                         |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb piaskownicy Codex wysyłany do startu/wznowienia wątku.                                                                                                                                                                    |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby pozwolić Codex przeglądać natywne monity zatwierdzeń. `guardian_subagent` pozostaje starszym aliasem.                                                                                                        |
| `serviceTier`       | nieustawione                             | Opcjonalna warstwa usługi serwera aplikacji Codex: `"fast"`, `"flex"` lub `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                        |

Wywołania narzędzi dynamicznych należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw przerywa
sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca nieudaną odpowiedź
narzędzia dynamicznego do Codex, aby tura mogła być kontynuowana zamiast pozostawiać
sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie serwera aplikacji Codex ograniczone do tury,
harness oczekuje także, że Codex zakończy natywną turę za pomocą `turn/completed`. Jeśli
serwer aplikacji milczy przez 60 sekund po tej odpowiedzi, OpenClaw w trybie najlepszej
próby przerywa turę Codex, zapisuje diagnostyczne przekroczenie limitu czasu i zwalnia
tor sesji OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za przestarzałą
natywną turą.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego lokalnego testowania. Konfiguracja
jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie pluginu w tym
samym przeglądanym pliku co reszta konfiguracji harnessu Codex.

## Użycie komputera

Computer Use omówiono w osobnym przewodniku konfiguracji:
[Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie vendoryzuje aplikacji do sterowania pulpitem ani samodzielnie
nie wykonuje akcji pulpitu. Przygotowuje serwer aplikacji Codex, weryfikuje, że serwer
MCP `computer-use` jest dostępny, a następnie pozwala Codex obsługiwać natywne wywołania
narzędzi MCP podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace Codex,
zarejestruj `cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use), aby poznać różnicę między
Computer Use należącym do Codex a bezpośrednią rejestracją MCP.

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

Computer Use jest specyficzne dla macOS i może wymagać lokalnych uprawnień systemu
operacyjnego, zanim serwer MCP Codex będzie mógł sterować aplikacjami. Jeśli
`computerUse.enabled` ma wartość true, a serwer MCP jest niedostępny, tury w trybie
Codex kończą się niepowodzeniem przed startem wątku zamiast cicho działać bez
natywnych narzędzi Computer Use. Zobacz
[Codex Computer Use](/pl/plugins/codex-computer-use), aby poznać wybory marketplace,
limity zdalnego katalogu, przyczyny statusu i rozwiązywanie problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować standardowy
dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` lub `/reset` po zmianie
konfiguracji runtime lub Computer Use, aby istniejące sesje nie zachowywały starego
powiązania z PI lub wątkiem Codex.

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

Walidacja harnessu wyłącznie dla Codex:

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

Zatwierdzenia Codex przeglądane przez guardian:

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

Przełączanie modeli pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw jest
dołączona do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany
model OpenAI, dostawcę, politykę zatwierdzania, piaskownicę i warstwę usługi do
serwera aplikacji. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje
powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony plugin rejestruje `/codex` jako autoryzowane polecenie ukośnikowe. Jest
ogólne i działa na każdym kanale, który obsługuje polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje bieżącą łączność serwera aplikacji, modele, konto, limity użycia, serwery MCP i skills.
- `/codex models` wyświetla modele bieżącego serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` rozpoczyna natywny przegląd Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany plugin Computer Use i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany plugin Computer Use i ponownie ładuje serwery MCP.
- `/codex account` pokazuje status konta i limitów użycia.
- `/codex mcp` wyświetla status serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla skills serwera aplikacji Codex.

### Typowy przepływ debugowania

Gdy agent oparty na Codex zrobi coś zaskakującego w Telegram, Discord, Slack
lub innym kanale, zacznij od konwersacji, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką notatkę
   opisującą to, co zobaczyłeś.
2. Zatwierdź żądanie diagnostyki jeden raz. Zatwierdzenie tworzy lokalny plik zip
   diagnostyki Gateway i, ponieważ sesja używa harnessu Codex, wysyła też
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu albo wątku
   wsparcia. Zawiera ona lokalną ścieżkę pakietu, podsumowanie prywatności,
   identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz wiersz
   `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować przebieg, uruchom wydrukowane polecenie
   `Inspect locally` w terminalu. Wygląda ono jak `codex resume <thread-id>` i
   otwiera natywny wątek Codex, aby można było przejrzeć rozmowę, kontynuować ją
   lokalnie albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub plan.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie podłączonego wątku bez pełnego pakietu diagnostyki
OpenClaw Gateway. W przypadku większości zgłoszeń do wsparcia lepszym punktem
wyjścia jest `/diagnostics [note]`, ponieważ łączy lokalny stan Gateway i
identyfikatory wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics),
aby poznać pełny model prywatności i zachowanie w czatach grupowych.

Rdzeń OpenClaw udostępnia też dostępne tylko dla właściciela `/diagnostics [note]`
jako ogólne polecenie diagnostyki Gateway. Jego monit zatwierdzenia pokazuje
wstęp dotyczący danych wrażliwych, prowadzi do [Eksportu diagnostyki](/pl/gateway/diagnostics)
i za każdym razem żąda uruchomienia `openclaw gateway diagnostics export --json`
przez jawne zatwierdzenie wykonania. Nie zatwierdzaj diagnostyki regułą
zezwalającą na wszystko. Po zatwierdzeniu OpenClaw wysyła raport możliwy do
wklejenia, z lokalną ścieżką pakietu i podsumowaniem manifestu. Gdy aktywna
sesja OpenClaw używa harnessu Codex, to samo zatwierdzenie autoryzuje również
wysłanie odpowiednich pakietów opinii Codex na serwery OpenAI. Monit
zatwierdzenia informuje, że opinia Codex zostanie wysłana, ale przed
zatwierdzeniem nie wymienia identyfikatorów sesji ani wątków Codex.

Jeśli `/diagnostics` zostanie wywołane przez właściciela w czacie grupowym,
OpenClaw utrzymuje kanał współdzielony w czystości: grupa otrzymuje tylko krótką
informację, a wstęp diagnostyczny, monity zatwierdzenia oraz identyfikatory
sesji/wątków Codex są wysyłane do właściciela prywatną ścieżką zatwierdzania.
Jeśli nie ma prywatnej ścieżki do właściciela, OpenClaw odrzuca żądanie z grupy
i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` serwera aplikacji Codex
i prosi serwer aplikacji o dołączenie logów dla każdego wymienionego wątku oraz
utworzonych podwątków Codex, gdy są dostępne. Przesłanie przechodzi standardową
ścieżką opinii Codex na serwery OpenAI; jeśli opinie Codex są wyłączone na tym
serwerze aplikacji, polecenie zwraca błąd serwera aplikacji. Ukończona odpowiedź
diagnostyczna wymienia kanały, identyfikatory sesji OpenClaw, identyfikatory
wątków Codex oraz lokalne polecenia `codex resume <thread-id>` dla wysłanych
wątków. Jeśli odrzucisz albo zignorujesz zatwierdzenie, OpenClaw nie drukuje tych
identyfikatorów Codex. To przesłanie nie zastępuje lokalnego eksportu
diagnostyki Gateway.

`/codex resume` zapisuje ten sam pomocniczy plik powiązania, którego harness
używa dla zwykłych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek
Codex, przekazuje aktualnie wybrany model OpenClaw do serwera aplikacji i
pozostawia włączoną rozszerzoną historię.

### Przeglądanie wątku Codex z CLI

Najszybszym sposobem zrozumienia nieudanego przebiegu Codex często jest
bezpośrednie otwarcie natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w rozmowie na kanale i chcesz przejrzeć
problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego
podjął konkretną decyzję dotyczącą narzędzia lub rozumowania. Najprostsza ścieżka
to zwykle najpierw uruchomić `/diagnostics [note]`: po zatwierdzeniu ukończony
raport wymienia każdy wątek Codex i drukuje polecenie `Inspect locally`, na
przykład `codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio
do terminala.

Możesz też uzyskać identyfikator wątku z `/codex binding` dla bieżącego czatu
albo z `/codex threads [filter]` dla ostatnich wątków serwera aplikacji Codex, a
następnie uruchomić to samo polecenie `codex resume` w swojej powłoce.

Powierzchnia poleceń wymaga serwera aplikacji Codex `0.125.0` lub nowszego.
Poszczególne metody sterowania są zgłaszane jako `unsupported by this Codex app-server`,
jeśli przyszły lub niestandardowy serwer aplikacji nie udostępnia tej metody
JSON-RPC.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel              | Cel                                                                 |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                | Zgodność produktu/Plugin między harnessami PI i Codex.              |
| Middleware rozszerzeń serwera aplikacji Codex | Dołączone Plugin OpenClaw | Zachowanie adaptera na turę wokół dynamicznych narzędzi OpenClaw.   |
| Natywne hooki Codex                   | Codex                   | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do
kierowania zachowaniem Plugin OpenClaw. Dla obsługiwanego natywnego mostu
narzędzi i uprawnień OpenClaw wstrzykuje konfigurację Codex na wątek dla
`PreToolUse`, `PostToolUse`, `PermissionRequest` i `Stop`. Inne hooki Codex,
takie jak `SessionStart` i `UserPromptSubmit`, pozostają kontrolkami poziomu
Codex; nie są udostępniane jako hooki Plugin OpenClaw w kontrakcie v1.

Dla dynamicznych narzędzi OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex
poprosi o wywołanie, więc OpenClaw uruchamia zachowanie Plugin i middleware,
których jest właścicielem w adapterze harnessu. W przypadku narzędzi natywnych
Codex to Codex jest właścicielem kanonicznego rekordu narzędzia. OpenClaw może
odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępnia taką operację przez serwer aplikacji albo wywołania
zwrotne natywnych hooków.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień serwera aplikacji
Codex i stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex. Zdarzenia
OpenClaw `before_compaction`, `after_compaction`, `llm_input` i `llm_output` są
obserwacjami na poziomie adaptera, a nie bajt w bajt przechwyconymi wewnętrznymi
żądaniami Codex ani ładunkami Compaction.

Natywne powiadomienia serwera aplikacji Codex `hook/started` i `hook/completed`
są projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby
trajektorii i debugowania. Nie wywołują hooków Plugin OpenClaw.

## Kontrakt wsparcia V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex jest
właścicielem większej części natywnej pętli modelu, a OpenClaw dostosowuje swoje
powierzchnie Plugin i sesji wokół tej granicy.

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Wsparcie                                | Dlaczego                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                             | Serwer aplikacji Codex jest właścicielem tury OpenAI, wznowienia natywnego wątku i kontynuacji natywnych narzędzi.                                                                                   |
| Kierowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                       |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                         |
| Plugin promptu i kontekstu                    | Obsługiwane                             | OpenClaw buduje nakładki promptu i projektuje kontekst do tury Codex przed rozpoczęciem lub wznowieniem wątku.                                                                                        |
| Cykl życia silnika kontekstu                  | Obsługiwane                             | Składanie, pobieranie albo konserwacja po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                 |
| Hooki narzędzi dynamicznych                   | Obsługiwane                             | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół dynamicznych narzędzi będących własnością OpenClaw.                                                                |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z uczciwymi ładunkami trybu Codex.                                                                   |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez przekaźnik natywnych hooków | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                  |
| Blokowanie lub obserwacja natywnej powłoki, patcha i MCP | Obsługiwane przez przekaźnik natywnych hooków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP na serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez przekaźnik natywnych hooków | Codex `PermissionRequest` może być kierowane przez politykę OpenClaw tam, gdzie środowisko uruchomieniowe je udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex kontynuuje przez swoją normalną ścieżkę strażnika albo zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                             | OpenClaw zapisuje żądanie wysłane do serwera aplikacji oraz powiadomienia serwera aplikacji, które otrzymuje.                                                                                         |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                        | Granica V1                                                                                                                                             | Przyszła ścieżka                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Mutacja argumentów narzędzi natywnych               | Natywne hooki Codex przed użyciem narzędzia mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych Codex.                            | Wymaga obsługi hooka/schematu Codex dla zastępczych danych wejściowych narzędzia.              |
| Edytowalna natywna historia transkrypcji Codex      | Codex jest właścicielem kanonicznej natywnej historii wątku. OpenClaw jest właścicielem kopii lustrzanej i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodaj jawne API serwera aplikacji Codex, jeśli potrzebna jest chirurgiczna edycja natywnego wątku. |
| `tool_result_persist` dla natywnych rekordów narzędzi Codex | Ten hook przekształca zapisy transkrypcji należące do OpenClaw, a nie natywne rekordy narzędzi Codex.                                                   | Można by odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych wpisów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction w Codex.                                                   |
| Interwencja Compaction                              | Obecne hooki Compaction OpenClaw w trybie Codex mają poziom powiadomień.                                                                               | Dodaj hooki Codex przed/po Compaction, jeśli pluginy muszą zawetować lub przepisać natywne Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie   | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex buduje końcowe żądanie OpenAI API wewnętrznie.                  | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                          |

## Narzędzia, media i Compaction

Harness Codex zmienia tylko niskopoziomowy osadzony executor agenta.

OpenClaw nadal buduje listę narzędzi i otrzymuje dynamiczne wyniki narzędzi z
harnessu. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi komunikacyjnych nadal przechodzą przez normalną ścieżkę dostarczania
OpenClaw.

Natywny przekaźnik hooków jest celowo ogólny, ale kontrakt obsługi v1 jest
ograniczony do natywnych ścieżek narzędzi i uprawnień Codex, które testuje
OpenClaw. W środowisku uruchomieniowym Codex obejmuje to powłokę, łatki oraz
ładunki MCP `PreToolUse`, `PostToolUse` i `PermissionRequest`. Nie zakładaj, że
każde przyszłe zdarzenie hooka Codex jest powierzchnią pluginu OpenClaw, dopóki
kontrakt środowiska uruchomieniowego tego nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy
tylko wtedy, gdy zdecyduje o tym polityka. Wynik bez decyzji nie jest
zezwoleniem. Codex traktuje go jako brak decyzji hooka i przechodzi do własnej
ścieżki ochrony lub zatwierdzenia przez użytkownika.

Żądania zatwierdzeń narzędzi Codex MCP są kierowane przez przepływ zatwierdzania
pluginów OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Monity Codex `request_user_input` są odsyłane do
pierwotnego czatu, a następna zakolejkowana wiadomość uzupełniająca odpowiada na
to natywne żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne
żądania pozyskania MCP nadal kończą się bezpiecznym niepowodzeniem.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera
aplikacji Codex. Przy domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje
zakolejkowane wiadomości czatu dla skonfigurowanego cichego okna i wysyła je
jako jedno żądanie `turn/steer` w kolejności nadejścia. Starszy tryb `queue`
wysyła osobne żądania `turn/steer`. Tury przeglądu Codex i ręcznego Compaction
mogą odrzucać sterowanie w tej samej turze; w takim przypadku OpenClaw używa
kolejki uzupełniającej, gdy wybrany tryb pozwala na mechanizm awaryjny. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa harnessu Codex, natywne Compaction wątku jest
delegowane do serwera aplikacji Codex. OpenClaw utrzymuje kopię lustrzaną
transkrypcji na potrzeby historii kanału, wyszukiwania, `/new`, `/reset` oraz
przyszłego przełączania modelu lub harnessu. Kopia lustrzana obejmuje monit
użytkownika, końcowy tekst asystenta oraz lekkie rekordy rozumowania lub planu
Codex, gdy serwer aplikacji je emituje. Obecnie OpenClaw rejestruje tylko
sygnały rozpoczęcia i zakończenia natywnego Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy wpisów,
które Codex zachował po Compaction.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku,
`tool_result_persist` obecnie nie przepisuje natywnych rekordów wyników narzędzi
Codex. Ma zastosowanie tylko wtedy, gdy OpenClaw zapisuje wynik narzędzia
transkrypcji sesji należącej do OpenClaw.

Generowanie mediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS i rozumienie
mediów nadal używają odpowiadających im ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako normalny dostawca `/model`:** to jest oczekiwane
dla nowych konfiguracji. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (albo starszą referencję `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
backendu zgodności, gdy żaden harness Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania.
Wymuszone środowisko uruchomieniowe Codex kończy się niepowodzeniem zamiast
wracać do PI. Po wybraniu serwera aplikacji Codex jego awarie są ujawniane
bezpośrednio.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby handshake serwera
aplikacji zgłaszał wersję `0.125.0` lub nowszą. Prerelease tej samej wersji albo
wersje z sufiksem kompilacji, takie jak `0.125.0-alpha.2` lub
`0.125.0+custom`, są odrzucane, ponieważ stabilny próg protokołu `0.125.0` jest
tym, co testuje OpenClaw.

**Wykrywanie modeli jest wolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` albo wyłącz wykrywanie.

**Transport WebSocket natychmiast zawodzi:** sprawdź `appServer.url`,
`authToken` oraz to, czy zdalny serwer aplikacji mówi tą samą wersją protokołu
serwera aplikacji Codex.

**Model inny niż Codex używa PI:** to jest oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starszą referencję
`codex/*`. Zwykłe `openai/gpt-*` i inne referencje dostawców pozostają na
swojej normalnej ścieżce dostawcy w trybie `auto`. Jeśli wymusisz
`agentRuntime.id: "codex"`, każda osadzona tura dla tego agenta musi być
obsługiwanym przez Codex modelem OpenAI.

**Computer Use jest zainstalowany, ale narzędzia nie działają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem się
utrzymuje, uruchom ponownie Gateway, aby wyczyścić nieaktualne rejestracje
natywnych hooków. Jeśli `computer-use.list_apps` przekracza limit czasu,
uruchom ponownie Codex Computer Use lub Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Hooki Pluginów](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
