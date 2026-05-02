---
read_when:
    - Chcesz używać dołączonego mechanizmu Codex app-server
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast korzystać awaryjnie z PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączony mechanizm app-server Codex
title: Środowisko Codex
x-i18n:
    generated_at: "2026-05-02T23:39:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ffa0cbb28422b2ed8d7c0eef6ee0222072c523d170b4b33597bb37bd3fa9700
    source_path: plugins/codex-harness.md
    workflow: 16
---

Dołączony plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agentów przez
serwer aplikacji Codex zamiast wbudowanego środowiska PI.

Użyj tego, gdy chcesz, aby Codex odpowiadał za niskopoziomową sesję agenta:
wykrywanie modeli, natywne wznawianie wątków, natywną Compaction i wykonywanie
na serwerze aplikacji. OpenClaw nadal odpowiada za kanały czatu, pliki sesji,
wybór modelu, narzędzia, zatwierdzenia, dostarczanie multimediów i widoczne
odbicie transkrypcji.

Gdy tura czatu źródłowego działa przez środowisko Codex, widoczne odpowiedzi
domyślnie używają narzędzia OpenClaw `message`, jeśli wdrożenie nie skonfigurowało
jawnie `messages.visibleReplies`. Agent nadal może prywatnie zakończyć swoją turę
Codex; publikuje w kanale tylko wtedy, gdy wywoła `message(action="send")`. Ustaw
`messages.visibleReplies: "automatic"`, aby zachować końcowe odpowiedzi w czacie
bezpośrednim na starszej ścieżce automatycznego dostarczania.

Tury Codex Heartbeat domyślnie otrzymują także narzędzie `heartbeat_respond`, dzięki
czemu agent może zapisać, czy wybudzenie ma pozostać ciche, czy wysłać
powiadomienie, bez kodowania tego przepływu sterowania w tekście końcowym.

Jeśli próbujesz się zorientować, zacznij od
[Czasów wykonania agentów](/pl/concepts/agent-runtimes). Krótka wersja jest taka:
`openai/gpt-5.5` to referencja modelu, `codex` to czas wykonania, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Większość użytkowników, którzy chcą „Codex w OpenClaw”, chce tej ścieżki: zaloguj
się przy użyciu subskrypcji ChatGPT/Codex, a następnie uruchamiaj osadzone tury
agentów przez natywny czas wykonania serwera aplikacji Codex. Referencja modelu
nadal pozostaje kanoniczna jako `openai/gpt-*`; uwierzytelnianie subskrypcji
pochodzi z konta/profilu Codex, a nie z prefiksu modelu `openai-codex/*`.

Najpierw zaloguj się przy użyciu Codex OAuth, jeśli jeszcze tego nie zrobiono:

```bash
openclaw models auth login --provider openai-codex
```

Następnie włącz dołączony plugin `codex` i wymuś czas wykonania Codex:

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

Nie używaj `openai-codex/gpt-*`, gdy masz na myśli natywny czas wykonania Codex.
Ten prefiks oznacza jawną ścieżkę „Codex OAuth przez PI”. Zmiany konfiguracji
dotyczą nowych lub resetowanych sesji; istniejące sesje zachowują zapisany czas
wykonania.

## Co zmienia ten plugin

Dołączony plugin `codex` zapewnia kilka odrębnych możliwości:

| Możliwość                         | Jak jej używać                                      | Co robi                                                                       |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywny osadzony czas wykonania   | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agentów OpenClaw przez serwer aplikacji Codex.        |
| Natywne komendy sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże wątki serwera aplikacji Codex z konwersacją komunikatora i nimi steruje. |
| Dostawca/katalog serwera aplikacji Codex | elementy wewnętrzne `codex`, udostępniane przez środowisko | Pozwala czasowi wykonania wykrywać i weryfikować modele serwera aplikacji.    |
| Ścieżka rozumienia multimediów Codex | ścieżki zgodności modeli obrazów `codex/*`        | Uruchamia ograniczone tury serwera aplikacji Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik haków          | Haki Plugin wokół natywnych zdarzeń Codex           | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie pluginu udostępnia te możliwości. **Nie** powoduje to:

- rozpoczęcia używania Codex dla każdego modelu OpenAI
- konwersji referencji modeli `openai-codex/*` do natywnego czasu wykonania
- ustawienia ACP/acpx jako domyślnej ścieżki Codex
- gorącego przełączenia istniejących sesji, które już zapisały czas wykonania PI
- zastąpienia dostarczania kanałów OpenClaw, plików sesji, przechowywania profili
  uwierzytelniania ani routingu wiadomości

Ten sam plugin odpowiada również za natywną powierzchnię komend sterowania czatem
`/codex`. Jeśli plugin jest włączony, a użytkownik prosi o powiązanie, wznowienie,
sterowanie, zatrzymanie lub sprawdzenie wątków Codex z czatu, agenci powinni
preferować `/codex ...` zamiast ACP. ACP pozostaje jawną alternatywą, gdy
użytkownik prosi o ACP/acpx lub testuje adapter ACP Codex.

Natywne tury Codex zachowują haki pluginów OpenClaw jako publiczną warstwę
zgodności. To są haki OpenClaw działające w procesie, a nie haki komend Codex
`hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkrypcji
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą też rejestrować neutralne względem czasu wykonania oprogramowanie
pośredniczące wyników narzędzi, aby przepisywać dynamiczne wyniki narzędzi
OpenClaw po wykonaniu narzędzia przez OpenClaw i przed zwróceniem wyniku do
Codex. Jest to oddzielne od publicznego haka pluginu `tool_result_persist`, który
przekształca zapisy wyników narzędzi transkrypcji należące do OpenClaw.

Semantykę samych haków pluginów opisują [Haki Plugin](/pl/plugins/hooks) i
[Zachowanie strażnika Plugin](/pl/tools/plugin).

Środowisko jest domyślnie wyłączone. Nowe konfiguracje powinny zachowywać
referencje modeli OpenAI w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`, gdy potrzebują
natywnego wykonywania na serwerze aplikacji. Starsze referencje modeli `codex/*`
nadal automatycznie wybierają środowisko ze względu na zgodność, ale starsze
prefiksy dostawców oparte na czasie wykonania nie są pokazywane jako zwykłe
wybory modelu/dostawcy.

Jeśli plugin `codex` jest włączony, ale główny model nadal ma postać
`openai-codex/*`, `openclaw doctor` ostrzega zamiast zmieniać ścieżkę. To
zamierzone: `openai-codex/*` pozostaje ścieżką PI Codex OAuth/subskrypcji, a
natywne wykonywanie na serwerze aplikacji pozostaje jawnym wyborem czasu
wykonania.

## Mapa ścieżek

Użyj tej tabeli przed zmianą konfiguracji:

| Pożądane zachowanie                                  | Referencja modelu         | Konfiguracja czasu wykonania            | Ścieżka uwierzytelniania/profilu | Oczekiwana etykieta statusu     |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Subskrypcja ChatGPT/Codex z natywnym czasem wykonania Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth lub konto Codex  | `Runtime: OpenAI Codex`        |
| OpenAI API przez zwykły runner OpenClaw              | `openai/gpt-*`             | pominięte lub `runtime: "pi"`           | Klucz OpenAI API             | `Runtime: OpenClaw Pi Default` |
| Subskrypcja ChatGPT/Codex przez PI                   | `openai-codex/gpt-*`       | pominięte lub `runtime: "pi"`           | Dostawca OpenAI Codex OAuth  | `Runtime: OpenClaw Pi Default` |
| Mieszani dostawcy z konserwatywnym trybem automatycznym | referencje specyficzne dla dostawcy | `agentRuntime.id: "auto"`              | Według wybranego dostawcy    | Zależy od wybranego czasu wykonania |
| Jawna sesja adaptera Codex ACP                       | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"` | Uwierzytelnianie zaplecza ACP | Status zadania/sesji ACP       |

Istotny jest podział na dostawcę i czas wykonania:

- `openai-codex/*` odpowiada na pytanie „której ścieżki dostawcy/uwierzytelniania ma użyć PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla ma wykonać tę
  osadzoną turę?”
- `/codex ...` odpowiada na pytanie „z którą natywną konwersacją Codex ma się
  powiązać ten czat lub którą ma kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces środowiska ma uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Ścieżki rodziny OpenAI zależą od prefiksu. W typowej konfiguracji subskrypcji
plus natywnego czasu wykonania Codex użyj `openai/*` z
`agentRuntime.id: "codex"`. Używaj `openai-codex/*` tylko wtedy, gdy celowo
chcesz Codex OAuth przez PI:

| Referencja modelu                            | Ścieżka czasu wykonania                       | Kiedy używać                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Dostawca OpenAI przez mechanizmy OpenClaw/PI | Gdy chcesz bieżącego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth przez OpenClaw/PI         | Gdy chcesz uwierzytelniania subskrypcji ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Środowisko serwera aplikacji Codex           | Gdy chcesz uwierzytelniania subskrypcji ChatGPT/Codex z natywnym wykonywaniem Codex. |

GPT-5.5 może pojawiać się zarówno na bezpośrednich ścieżkach klucza API OpenAI,
jak i subskrypcji Codex, gdy Twoje konto je udostępnia. Użyj
`openai/gpt-5.5` ze środowiskiem serwera aplikacji Codex dla natywnego czasu
wykonania Codex, `openai-codex/gpt-5.5` dla PI OAuth albo `openai/gpt-5.5` bez
nadpisania czasu wykonania Codex dla ruchu z bezpośrednim kluczem API.

Starsze referencje `codex/gpt-*` nadal są akceptowane jako aliasy zgodności.
Migracja zgodności doctor przepisuje starsze główne referencje czasu wykonania
na kanoniczne referencje modeli i zapisuje politykę czasu wykonania oddzielnie,
natomiast starsze referencje używane wyłącznie jako fallback pozostają bez zmian,
ponieważ czas wykonania jest konfigurowany dla całego kontenera agenta. Nowe
konfiguracje PI Codex OAuth powinny używać `openai-codex/gpt-*`; nowe
konfiguracje natywnego środowiska serwera aplikacji powinny używać
`openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy
OpenAI Codex OAuth. Użyj `codex/gpt-*`, gdy rozumienie obrazów ma działać przez
ograniczoną turę serwera aplikacji Codex. Model serwera aplikacji Codex musi
deklarować obsługę wejścia obrazowego; modele Codex wyłącznie tekstowe zawodzą
zanim tura multimedialna się rozpocznie.

Użyj `/status`, aby potwierdzić skuteczne środowisko dla bieżącej sesji. Jeśli
wybór jest zaskakujący, włącz logowanie debugowania dla podsystemu
`agents/harness` i sprawdź ustrukturyzowany rekord Gateway `agent harness selected`.
Zawiera on wybrany identyfikator środowiska, powód wyboru, politykę
czasu wykonania/fallbacku oraz, w trybie `auto`, wynik obsługi każdego kandydata
pluginu.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy wszystkie te warunki są spełnione:

- dołączony plugin `codex` jest włączony lub dozwolony
- główny model agenta to `openai-codex/*`
- skuteczny czas wykonania tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „włączony
plugin Codex” oznacza „natywny czas wykonania serwera aplikacji Codex”. OpenClaw
nie wykonuje takiego przeskoku. Ostrzeżenie oznacza:

- **Żadna zmiana nie jest wymagana**, jeśli zamierzeniem było ChatGPT/Codex OAuth przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamierzeniem było natywne wykonywanie na
  serwerze aplikacji.
- Istniejące sesje nadal wymagają `/new` lub `/reset` po zmianie czasu wykonania,
  ponieważ przypięcia czasu wykonania sesji są trwałe.

Wybór środowiska nie jest kontrolą sesji na żywo. Gdy wykonywana jest osadzona
tura, OpenClaw zapisuje wybrany identyfikator środowiska w tej sesji i używa go
dla kolejnych tur w tym samym identyfikatorze sesji. Zmień konfigurację
`agentRuntime` lub `OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby przyszłe sesje
używały innego środowiska; użyj `/new` lub `/reset`, aby rozpocząć świeżą sesję
przed przełączeniem istniejącej konwersacji między PI a Codex. Pozwala to uniknąć
odtwarzania jednej transkrypcji przez dwa niezgodne natywne systemy sesji.

Starsze sesje utworzone przed przypięciami środowiska są traktowane jako
przypięte do PI, gdy mają już historię transkrypcji. Użyj `/new` lub `/reset`,
aby włączyć Codex dla tej konwersacji po zmianie konfiguracji.

`/status` pokazuje efektywny runtime modelu. Domyślny mechanizm PI jest wyświetlany jako
`Runtime: OpenClaw Pi Default`, a mechanizm Codex app-server jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym pluginem `codex`.
- Codex app-server `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  plikiem binarnym Codex app-server, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na normalne uruchamianie mechanizmu.
- Uwierzytelnianie Codex dostępne dla procesu app-server albo dla mostka uwierzytelniania Codex
  w OpenClaw. Lokalne uruchomienia app-server używają zarządzanego przez OpenClaw katalogu domowego Codex dla każdego
  agenta oraz izolowanego potomnego `HOME`, więc domyślnie nie odczytują Twojego osobistego
  konta `~/.codex`, Skills, pluginów, konfiguracji, stanu wątków ani natywnego
  `$HOME/.agents/skills`.

Plugin blokuje starsze lub pozbawione wersji uzgodnienia app-server. Utrzymuje to
OpenClaw na powierzchni protokołu, względem której został przetestowany.

W testach smoke na żywo i w Dockerze uwierzytelnianie zwykle pochodzi z konta Codex CLI
albo z profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia stdio app-server mogą
również awaryjnie użyć `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy nie ma konta.

## Pliki bootstrapu workspace

Codex obsługuje `AGENTS.md` samodzielnie przez natywne wykrywanie dokumentacji projektu. OpenClaw
nie zapisuje syntetycznych plików dokumentacji projektu Codex ani nie zależy od zapasowych
nazw plików Codex dla plików persony, ponieważ zapasowe nazwy Codex mają zastosowanie tylko wtedy, gdy
brakuje `AGENTS.md`.

Aby zachować parytet workspace w OpenClaw, mechanizm Codex rozwiązuje pozostałe
pliki bootstrapu (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` oraz `MEMORY.md`, gdy istnieje) i przekazuje je przez instrukcje
konfiguracji Codex przy `thread/start` i `thread/resume`. Dzięki temu
`SOUL.md` i powiązany kontekst persony/profilu workspace pozostają widoczne bez
duplikowania `AGENTS.md`.

## Dodawanie Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent ma swobodnie przełączać się
między Codex a modelami dostawców innych niż Codex. Wymuszony runtime ma zastosowanie do każdego
osadzonego turn dla tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy
ten runtime jest wymuszony, OpenClaw nadal spróbuje użyć mechanizmu Codex i zakończy się niepowodzeniem w trybie zamkniętym,
zamiast po cichu kierować ten turn przez PI.

Zamiast tego użyj jednej z tych struktur:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Zostaw domyślnego agenta na `agentRuntime.id: "auto"` i zapasowym PI dla normalnego mieszanego
  użycia dostawców.
- Używaj starszych odwołań `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` plus jawną politykę runtime Codex.

Na przykład ta konfiguracja zostawia domyślnego agenta przy normalnym automatycznym wyborze i
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

- Domyślny agent `main` używa normalnej ścieżki dostawcy i zapasowej zgodności PI.
- Agent `codex` używa mechanizmu Codex app-server.
- Jeśli Codex jest brakujący lub nieobsługiwany dla agenta `codex`, turn kończy się niepowodzeniem
  zamiast cicho użyć PI.

## Routing poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, a nie wyłącznie po słowie „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Przypnij ten czat do Codex”                           | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                    | `/codex threads`                                 |
| „Złóż raport wsparcia dla złego uruchomienia Codex”    | `/diagnostics [note]`                            |
| „Wyślij feedback Codex tylko dla tego załączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj mojej subskrypcji ChatGPT/Codex z runtime Codex” | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Użyj mojej subskrypcji ChatGPT/Codex przez PI”        | odwołania modeli `openai-codex/*`                |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` i nie natywne subagenty   |

OpenClaw reklamuje agentom wskazówki dotyczące spawn ACP tylko wtedy, gdy ACP jest włączone,
możliwe do wywołania i obsługiwane przez załadowany backend runtime. Jeśli ACP jest niedostępne,
prompt systemowy i Skills pluginu nie powinny uczyć agenta routingu
ACP.

## Wdrożenia wyłącznie z Codex

Wymuś mechanizm Codex, gdy musisz dowieść, że każdy osadzony turn agenta
używa Codex. Jawne runtime pluginów domyślnie nie mają zapasowego PI, więc
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

Przy wymuszonym Codex OpenClaw kończy się wcześnie niepowodzeniem, jeśli Plugin Codex jest wyłączony,
app-server jest zbyt stary albo app-server nie może się uruchomić. Ustaw
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` tylko wtedy, gdy celowo chcesz, aby PI obsługiwał
brakujący wybór mechanizmu.

## Codex per agent

Możesz uczynić jednego agenta wyłącznie Codex, podczas gdy domyślny agent zachowuje normalny
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
sesję OpenClaw, a mechanizm Codex tworzy lub wznawia swój poboczny wątek app-server
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnemu turn ponownie rozwiązać mechanizm z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta app-server o dostępne modele. Jeśli
wykrywanie się nie powiedzie albo przekroczy limit czasu, używa dołączonego katalogu zapasowego dla:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Wykrywanie możesz dostroić pod `plugins.entries.codex.config.discovery`:

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

## Połączenie i polityka app-server

Domyślnie Plugin uruchamia lokalnie zarządzany przez OpenClaw plik binarny Codex z:

```bash
codex app-server --listen stdio://
```

Zarządzany plik binarny jest dostarczany z pakietem pluginu `codex`. Dzięki temu
wersja app-server jest powiązana z dołączonym pluginem, a nie z dowolnym osobnym
Codex CLI, który akurat jest zainstalowany lokalnie. Ustaw `appServer.command` tylko wtedy,
gdy celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje mechanizmu Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana lokalna postawa operatora używana
dla autonomicznych Heartbeat: Codex może używać narzędzi powłoki i sieci bez
zatrzymywania się na natywnych promptach zatwierdzania, na które nikt nie jest dostępny odpowiedzieć.

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

Tryb Guardian używa natywnej ścieżki zatwierdzania z automatycznym przeglądem Codex. Gdy Codex prosi o
opuszczenie sandboxa, zapis poza workspace albo dodanie uprawnień takich jak dostęp do sieci,
Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza lub odrzuca
konkretne żądanie. Użyj Guardian, gdy chcesz więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą mieszać
preset z jawnymi wyborami. Starsza wartość recenzenta `guardian_subagent` jest
nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać
`auto_review`.

Dla już uruchomionego app-server użyj transportu WebSocket:

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

Uruchomienia stdio app-server domyślnie dziedziczą środowisko procesu OpenClaw,
ale OpenClaw posiada mostek konta Codex app-server i ustawia zarówno
`CODEX_HOME`, jak i `HOME` na katalogi per-agent w stanie OpenClaw
tego agenta. Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` i
`$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień app-server.
Dzięki temu natywne Skills, pluginy, konfiguracja, konta i stan wątków Codex
pozostają ograniczone do agenta OpenClaw, zamiast przenikać z osobistego
katalogu domowego Codex CLI operatora.

Pluginy OpenClaw i snapshoty Skills OpenClaw nadal przepływają przez własny
rejestr pluginów i loader Skills OpenClaw. Osobiste zasoby Codex CLI nie. Jeśli masz
przydatne Skills lub pluginy Codex CLI, które powinny stać się częścią agenta OpenClaw,
zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego workspace agenta OpenClaw.
Natywne pluginy, hooki i pliki konfiguracji Codex są raportowane lub archiwizowane
do ręcznego przeglądu zamiast automatycznej aktywacji, ponieważ mogą
wykonywać polecenia, udostępniać serwery MCP albo przenosić dane uwierzytelniające.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto app-server w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień stdio app-server, `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy nie ma konta app-server, a uwierzytelnianie OpenAI jest
   nadal wymagane.

Gdy OpenClaw zobaczy profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddings albo bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych turn Codex app-server przez API.
Jawne profile klucza API Codex i lokalny zapasowy klucz środowiskowy stdio używają logowania app-server
zamiast dziedziczonego środowiska procesu potomnego. Połączenia WebSocket app-server
nie otrzymują zapasowego klucza API ze środowiska Gateway; użyj jawnego profilu uwierzytelniania albo
własnego konta zdalnego app-server.

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

`appServer.clearEnv` wpływa tylko na utworzony proces podrzędny app-server Codex.

Narzędzia dynamiczne Codex domyślnie używają profilu `native-first`. W tym trybie OpenClaw nie udostępnia narzędzi dynamicznych, które duplikują natywne operacje obszaru roboczego Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` i `update_plan`. Narzędzia integracyjne OpenClaw, takie jak wiadomości, sesje, media, cron, przeglądarka, węzły, gateway, `heartbeat_respond` i `web_search`, pozostają dostępne.

Obsługiwane pola najwyższego poziomu Pluginu Codex:

| Pole                       | Domyślnie        | Znaczenie                                                                                              |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Użyj `"openclaw-compat"`, aby udostępnić pełny zestaw narzędzi dynamicznych OpenClaw app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Dodatkowe nazwy narzędzi dynamicznych OpenClaw pomijane w turach app-server Codex.                     |

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                               |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko przy jawnym nadpisaniu.                                                                                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                           |
| `url`               | nieustawione                             | URL app-server WebSocket.                                                                                                                                                                                                                 |
| `authToken`         | nieustawione                             | Token bearer dla transportu WebSocket.                                                                                                                                                                                                    |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z utworzonego procesu app-server stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla lokalnej izolacji Codex per agent OpenClaw. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                                                                                                                                                |
| `mode`              | `"yolo"`                                 | Ustawienie wstępne dla wykonania YOLO lub sprawdzanego przez guardiana.                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy rozpoczęciu/wznowieniu wątku/turze.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb piaskownicy Codex wysyłany przy rozpoczęciu/wznowieniu wątku.                                                                                                                                                                |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby Codex sprawdzał natywne monity zatwierdzeń. `guardian_subagent` pozostaje starszym aliasem.                                                                                                                     |
| `serviceTier`       | nieustawione                             | Opcjonalny poziom usługi app-server Codex: `"fast"`, `"flex"` lub `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                                   |

Wywołania narzędzi dynamicznych należące do OpenClaw są ograniczane niezależnie od `appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw przerywa sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca nieudaną odpowiedź narzędzia dynamicznego do Codex, aby tura mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie app-server ograniczone do tury Codex, harness oczekuje również, że Codex zakończy natywną turę komunikatem `turn/completed`. Jeśli app-server milczy przez 60 sekund po tej odpowiedzi, OpenClaw w trybie best-effort przerywa turę Codex, zapisuje diagnostyczny timeout i zwalnia tor sesji OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za przestarzałą natywną turą.

Nadpisania środowiska pozostają dostępne do lokalnego testowania:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzany plik binarny, gdy `appServer.command` jest nieustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj `plugins.entries.codex.config.appServer.mode: "guardian"` albo `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego lokalnego testowania. Konfiguracja jest preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie Pluginu w tym samym sprawdzanym pliku co resztę konfiguracji harnessu Codex.

## Użycie komputera

Computer Use jest omówione we własnym przewodniku konfiguracji: [Codex Computer Use](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie dostarcza w pakiecie aplikacji sterowania pulpitem ani samodzielnie nie wykonuje akcji na pulpicie. Przygotowuje app-server Codex, weryfikuje dostępność serwera MCP `computer-use`, a następnie pozwala Codex obsługiwać natywne wywołania narzędzi MCP podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp sterownika TryCua poza przepływem marketplace Codex, zarejestruj `cua-driver mcp` za pomocą `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`. Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use), aby poznać różnicę między Computer Use należącym do Codex a bezpośrednią rejestracją MCP.

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

Computer Use jest specyficzne dla macOS i może wymagać lokalnych uprawnień systemu operacyjnego, zanim serwer MCP Codex będzie mógł sterować aplikacjami. Jeśli `computerUse.enabled` ma wartość true, a serwer MCP jest niedostępny, tury w trybie Codex kończą się niepowodzeniem przed rozpoczęciem wątku, zamiast cicho działać bez natywnych narzędzi Computer Use. Zobacz [Codex Computer Use](/pl/plugins/codex-computer-use), aby poznać opcje marketplace, limity zdalnego katalogu, przyczyny statusu i rozwiązywanie problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować standardowy dołączony marketplace Codex Desktop z `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex nie wykrył jeszcze lokalnego marketplace. Użyj `/new` lub `/reset` po zmianie konfiguracji środowiska uruchomieniowego albo Computer Use, aby istniejące sesje nie zachowywały starego powiązania z PI lub wątkiem Codex.

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

Zatwierdzenia Codex sprawdzane przez guardiana:

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

Przełączanie modelu pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw jest dołączona do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany model OpenAI, dostawcę, politykę zatwierdzania, piaskownicę i poziom usługi do app-server. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane polecenie ukośnikowe. Jest ono ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje aktywną łączność z serwerem aplikacji, modele, konto, limity szybkości, serwery MCP oraz Skills.
- `/codex models` wyświetla modele aktywnego serwera aplikacji Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi serwer aplikacji Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywną recenzję Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dotyczącej dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany plugin Computer Use i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany plugin Computer Use i przeładowuje serwery MCP.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwerów MCP serwera aplikacji Codex.
- `/codex skills` wyświetla Skills serwera aplikacji Codex.

### Typowy przepływ debugowania

Gdy agent oparty na Codex zrobi coś zaskakującego w Telegram, Discord, Slack
lub innym kanale, zacznij od rozmowy, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką notatkę,
   która opisuje to, co widzisz.
2. Zatwierdź żądanie diagnostyki raz. Zatwierdzenie tworzy lokalny pakiet zip diagnostyki
   Gateway i, ponieważ sesja używa środowiska uruchomieniowego Codex, wysyła też
   odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu albo wątku pomocy.
   Zawiera ona ścieżkę lokalnego pakietu, podsumowanie prywatności, identyfikatory sesji OpenClaw,
   identyfikatory wątków Codex oraz wiersz `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować przebieg, uruchom wypisane polecenie `Inspect locally`
   w terminalu. Wygląda ono jak `codex resume <thread-id>` i otwiera
   natywny wątek Codex, aby można było przejrzeć rozmowę, kontynuować ją lokalnie
   albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub plan.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego pakietu diagnostyki
OpenClaw Gateway. W większości zgłoszeń do pomocy lepszym punktem wyjścia jest
`/diagnostics [note]`, ponieważ wiąże lokalny stan Gateway i identyfikatory
wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics),
aby poznać pełny model prywatności i zachowanie w czatach grupowych.

Rdzeń OpenClaw udostępnia też dostępne tylko dla właściciela `/diagnostics [note]` jako ogólne
polecenie diagnostyki Gateway. Jego monit zatwierdzenia pokazuje wstęp dotyczący
danych wrażliwych, odsyła do [Eksport diagnostyki](/pl/gateway/diagnostics) i za każdym razem
żąda wykonania `openclaw gateway diagnostics export --json` przez jawne zatwierdzenie wykonania.
Nie zatwierdzaj diagnostyki regułą zezwalającą na wszystko. Po zatwierdzeniu
OpenClaw wysyła raport gotowy do wklejenia ze ścieżką lokalnego pakietu i
podsumowaniem manifestu. Gdy aktywna sesja OpenClaw używa środowiska uruchomieniowego
Codex, to samo zatwierdzenie autoryzuje również wysłanie odpowiednich pakietów opinii Codex
na serwery OpenAI. Monit zatwierdzenia informuje, że opinia Codex zostanie wysłana, ale
przed zatwierdzeniem nie wymienia identyfikatorów sesji ani wątków Codex.

Jeśli `/diagnostics` zostanie wywołane przez właściciela w czacie grupowym, OpenClaw utrzymuje
współdzielony kanał w czystości: grupa otrzymuje tylko krótkie powiadomienie, a
wstęp diagnostyki, monity zatwierdzenia oraz identyfikatory sesji/wątków Codex są wysyłane do
właściciela prywatną ścieżką zatwierdzania. Jeśli nie ma prywatnej ścieżki właściciela,
OpenClaw odrzuca żądanie grupowe i prosi właściciela o uruchomienie go z wiadomości prywatnej.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` serwera aplikacji Codex i prosi
serwer aplikacji o dołączenie logów dla każdego wymienionego wątku oraz utworzonych podwątków Codex,
gdy są dostępne. Przesłanie przechodzi standardową ścieżką opinii Codex na serwery OpenAI;
jeśli opinie Codex są wyłączone w tym serwerze aplikacji, polecenie zwraca błąd
serwera aplikacji. Ukończona odpowiedź diagnostyczna wymienia kanały,
identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz lokalne polecenia `codex resume <thread-id>`
dla wysłanych wątków. Jeśli odmówisz zatwierdzenia lub je zignorujesz,
OpenClaw nie wypisze tych identyfikatorów Codex. To przesłanie nie zastępuje lokalnego
eksportu diagnostyki Gateway.

`/codex resume` zapisuje ten sam plik powiązania towarzyszącego, którego środowisko uruchomieniowe używa dla
zwykłych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje
aktualnie wybrany model OpenClaw do serwera aplikacji i utrzymuje włączoną rozszerzoną historię.

### Inspekcja wątku Codex z CLI

Najszybszym sposobem zrozumienia błędnego przebiegu Codex jest często bezpośrednie otwarcie
natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w rozmowie kanałowej i chcesz przejrzeć
problematyczną sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego dokonał
konkretnego wyboru narzędzia lub rozumowania. Najłatwiejszą ścieżką jest zwykle najpierw uruchomienie
`/diagnostics [note]`: po zatwierdzeniu ukończony raport wymienia
każdy wątek Codex i wypisuje polecenie `Inspect locally`, na przykład
`codex resume <thread-id>`. Możesz skopiować to polecenie bezpośrednio do terminala.

Identyfikator wątku możesz też uzyskać z `/codex binding` dla bieżącego czatu albo
`/codex threads [filter]` dla ostatnich wątków serwera aplikacji Codex, a następnie uruchomić to samo
polecenie `codex resume` w swojej powłoce.

Powierzchnia poleceń wymaga serwera aplikacji Codex `0.125.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy serwer aplikacji nie udostępnia tej metody JSON-RPC.

## Granice hooków

Środowisko uruchomieniowe Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki pluginów OpenClaw               | OpenClaw                 | Zgodność produktu/pluginów między środowiskami PI i Codex.          |
| Middleware rozszerzeń serwera aplikacji Codex | Wbudowane pluginy OpenClaw | Zachowanie adaptera na turę wokół dynamicznych narzędzi OpenClaw.   |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania
zachowaniem pluginów OpenClaw. Dla obsługiwanego mostu natywnych narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex na wątek dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`. Inne hooki Codex, takie jak `SessionStart` i
`UserPromptSubmit`, pozostają kontrolkami poziomu Codex; nie są udostępniane jako
hooki pluginów OpenClaw w kontrakcie v1.

W przypadku dynamicznych narzędzi OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie pluginów i middleware, których jest właścicielem, w
adapterze środowiska uruchomieniowego. W przypadku narzędzi natywnych Codex właścicielem kanonicznego rekordu narzędzia jest Codex.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępni taką operację przez serwer aplikacji albo wywołania zwrotne natywnych hooków.

Projekcje cyklu życia Compaction i LLM pochodzą z powiadomień serwera aplikacji Codex
oraz stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex.
Zdarzenia `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` OpenClaw są obserwacjami na poziomie adaptera, a nie przechwyceniami bajt po bajcie
wewnętrznego żądania Codex ani ładunków Compaction.

Natywne powiadomienia serwera aplikacji Codex `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania.
Nie wywołują hooków pluginów OpenClaw.

## Kontrakt wsparcia v1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex jest właścicielem większej części
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie pluginów i sesji
wokół tej granicy.

Obsługiwane w środowisku wykonawczym Codex v1:

| Powierzchnia                                  | Wsparcie                                | Dlaczego                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                             | Serwer aplikacji Codex jest właścicielem tury OpenAI, wznowienia natywnego wątku i kontynuacji natywnych narzędzi.                                                                                  |
| Trasowanie i dostarczanie kanałów OpenClaw    | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem wykonawczym modelu.                                                                                           |
| Dynamiczne narzędzia OpenClaw                 | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                         |
| Pluginy promptów i kontekstu                  | Obsługiwane                             | OpenClaw buduje nakładki promptu i projektuje kontekst do tury Codex przed rozpoczęciem lub wznowieniem wątku.                                                                                        |
| Cykl życia silnika kontekstu                  | Obsługiwane                             | Składanie, pobieranie lub konserwacja po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                 |
| Hooki narzędzi dynamicznych                   | Obsługiwane                             | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół dynamicznych narzędzi, których właścicielem jest OpenClaw.                                                        |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z uczciwymi ładunkami trybu Codex.                                                                  |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez przekaźnik natywnych hooków | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                  |
| Blokowanie lub obserwacja natywnej powłoki, poprawek i MCP | Obsługiwane przez przekaźnik natywnych hooków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym ładunków MCP na serwerze aplikacji Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwane przez przekaźnik natywnych hooków | Codex `PermissionRequest` może być trasowany przez politykę OpenClaw tam, gdzie środowisko wykonawcze ją udostępnia. Jeśli OpenClaw nie zwróci żadnej decyzji, Codex kontynuuje przez swoją normalną ścieżkę strażnika lub zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii serwera aplikacji | Obsługiwane                             | OpenClaw rejestruje żądanie wysłane do serwera aplikacji oraz otrzymywane od niego powiadomienia.                                                                                                     |

Nieobsługiwane w środowisku wykonawczym Codex v1:

| Powierzchnia                                        | Granica V1                                                                                                                                     | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutacja argumentów natywnych narzędzi               | Natywne haki Codex przed użyciem narzędzia mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych dla Codex.                 | Wymaga obsługi haków/schematu Codex dla zastępczych danych wejściowych narzędzia.         |
| Edytowalna historia transkryptu natywnego Codex     | Codex posiada kanoniczną natywną historię wątku. OpenClaw posiada kopię lustrzaną i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodać jawne API serwera aplikacji Codex, jeśli potrzebna jest chirurgiczna edycja natywnego wątku. |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hak przekształca zapisy transkryptu należące do OpenClaw, a nie rekordy narzędzi natywnych Codex.                                           | Można kopiować lustrzanie przekształcone rekordy, ale kanoniczne przepisywanie wymaga obsługi Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction w Codex.                                             |
| Interwencja w Compaction                            | Obecne haki Compaction OpenClaw w trybie Codex działają na poziomie powiadomień.                                                                | Dodać haki Codex przed/po Compaction, jeśli pluginy muszą wetować lub przepisywać natywną Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie   | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex wewnętrznie buduje finalne żądanie API OpenAI.           | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                     |

## Narzędzia, media i Compaction

Uprząż Codex zmienia tylko niskopoziomowy osadzony executor agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
uprzęży. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi komunikacyjnych nadal przechodzą przez normalną ścieżkę dostarczania
OpenClaw.

Natywny przekaźnik haków jest celowo generyczny, ale kontrakt obsługi v1 jest
ograniczony do natywnych dla Codex ścieżek narzędzi i uprawnień, które testuje
OpenClaw. W środowisku uruchomieniowym Codex obejmuje to ładunki shell, patch i MCP
`PreToolUse`, `PostToolUse` oraz `PermissionRequest`. Nie zakładaj, że każde przyszłe
zdarzenie haka Codex jest powierzchnią pluginu OpenClaw, dopóki nie nazwie go
kontrakt środowiska uruchomieniowego.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy
tylko wtedy, gdy decyduje polityka. Wynik bez decyzji nie jest zezwoleniem.
Codex traktuje go jako brak decyzji haka i przechodzi do własnej ścieżki
strażnika albo zatwierdzenia przez użytkownika.

Żądania zatwierdzenia narzędzi Codex MCP są kierowane przez przepływ zatwierdzania
pluginów OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Monity Codex `request_user_input` są odsyłane do
pierwotnego czatu, a następna zakolejkowana wiadomość uzupełniająca odpowiada
na to natywne żądanie serwera zamiast być kierowana jako dodatkowy kontekst.
Inne żądania elicytacji MCP nadal kończą się bezpiecznym zamknięciem.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera aplikacji Codex. Przy
domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje zakolejkowane wiadomości czatu
dla skonfigurowanego okna ciszy i wysyła je jako jedno żądanie `turn/steer` w
kolejności nadejścia. Starszy tryb `queue` wysyła osobne żądania `turn/steer`. Tury
recenzji Codex i ręcznej Compaction mogą odrzucić sterowanie w tej samej turze; w takim przypadku
OpenClaw używa kolejki uzupełniającej, gdy wybrany tryb pozwala na fallback. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa uprzęży Codex, natywna Compaction wątku jest
delegowana do serwera aplikacji Codex. OpenClaw utrzymuje kopię lustrzaną transkryptu dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub uprzęży. Kopia
lustrzana obejmuje monit użytkownika, finalny tekst asystenta oraz lekkie rekordy
rozumowania lub planu Codex, gdy serwer aplikacji je emituje. Obecnie OpenClaw
zapisuje tylko sygnały rozpoczęcia i zakończenia natywnej Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy wpisów, które Codex
zachował po Compaction.

Ponieważ Codex posiada kanoniczny natywny wątek, `tool_result_persist` obecnie nie
przepisuje rekordów wyników narzędzi natywnych Codex. Ma zastosowanie tylko wtedy,
gdy OpenClaw zapisuje wynik narzędzia transkryptu sesji należącej do OpenClaw.

Generowanie mediów nie wymaga PI. Obrazy, wideo, muzyka, PDF, TTS i rozumienie
mediów nadal używają odpowiednich ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** jest to oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (albo starszą referencję `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
backendu zgodności, gdy żadna uprząż Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania. Wymuszone
środowisko uruchomieniowe Codex obecnie kończy się niepowodzeniem zamiast wracać do PI, chyba że
jawnie ustawisz `agentRuntime.fallback: "pi"`. Gdy serwer aplikacji Codex zostanie
wybrany, jego błędy są ujawniane bezpośrednio, bez dodatkowej konfiguracji fallback.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby uzgadnianie serwera aplikacji
zgłaszało wersję `0.125.0` lub nowszą. Wydania przedpremierowe tej samej wersji albo wersje z sufiksem kompilacji,
takie jak `0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ
stabilny próg protokołu `0.125.0` jest tym, co testuje OpenClaw.

**Wykrywanie modeli jest wolne:** obniż `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket natychmiast zawodzi:** sprawdź `appServer.url`, `authToken`
oraz to, czy zdalny serwer aplikacji mówi tą samą wersją protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** jest to oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starszą referencję
`codex/*`. Zwykłe referencje `openai/gpt-*` i innych dostawców pozostają na swojej normalnej
ścieżce dostawcy w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`, każda osadzona
tura dla tego agenta musi być modelem OpenAI obsługiwanym przez Codex.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem się utrzymuje, uruchom ponownie
gateway, aby wyczyścić nieaktualne natywne rejestracje haków. Jeśli `computer-use.list_apps`
przekracza limit czasu, uruchom ponownie Codex Computer Use albo Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agenta](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Haki pluginów](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
