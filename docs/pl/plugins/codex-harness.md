---
read_when:
    - Chcesz użyć dołączonego środowiska app-server Codex
    - Potrzebujesz przykładów konfiguracji środowiska Codex
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się niepowodzeniem zamiast przechodzić awaryjnie na PI
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączony mechanizm serwera aplikacji Codex
title: Środowisko uruchomieniowe Codex
x-i18n:
    generated_at: "2026-05-02T09:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

Wbudowany plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
app-server Codex zamiast wbudowanego harnessu PI.

Użyj tego, gdy chcesz, aby Codex odpowiadał za niskopoziomową sesję agenta:
wykrywanie modeli, natywne wznawianie wątków, natywną kompakcję i wykonywanie
przez app-server. OpenClaw nadal odpowiada za kanały czatu, pliki sesji, wybór
modelu, narzędzia, zatwierdzenia, dostarczanie multimediów oraz widoczne
lustrzane odzwierciedlenie transkrypcji.

Gdy tura czatu źródłowego działa przez harness Codex, widoczne odpowiedzi
domyślnie używają narzędzia OpenClaw `message`, jeśli wdrożenie nie
skonfigurowało jawnie `messages.visibleReplies`. Agent może nadal prywatnie
zakończyć swoją turę Codex; publikuje w kanale tylko wtedy, gdy wywoła
`message(action="send")`. Ustaw `messages.visibleReplies: "automatic"`, aby
zachować końcowe odpowiedzi czatu bezpośredniego na starszej automatycznej
ścieżce dostarczania.

Tury heartbeat Codex domyślnie otrzymują też narzędzie `heartbeat_respond`, więc
agent może zapisać, czy wybudzenie ma pozostać ciche, czy powiadomić, bez
kodowania tego przepływu sterowania w tekście końcowym.

Jeśli próbujesz się zorientować, zacznij od
[Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes). Krótka wersja:
`openai/gpt-5.5` to referencja modelu, `codex` to runtime, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Szybka konfiguracja

Większość użytkowników, którzy chcą „Codex w OpenClaw”, chce tej ścieżki:
zalogować się subskrypcją ChatGPT/Codex, a następnie uruchamiać osadzone tury
agenta przez natywny runtime app-server Codex. Referencja modelu nadal pozostaje
kanoniczna jako `openai/gpt-*`; uwierzytelnianie subskrypcji pochodzi z konta lub
profilu Codex, a nie z prefiksu modelu `openai-codex/*`.

Najpierw zaloguj się przez Codex OAuth, jeśli jeszcze tego nie zrobiono:

```bash
openclaw models auth login --provider openai-codex
```

Następnie włącz wbudowany plugin `codex` i wymuś runtime Codex:

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

Jeśli konfiguracja używa `plugins.allow`, dodaj tam także `codex`:

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

Nie używaj `openai-codex/gpt-*`, gdy chodzi Ci o natywny runtime Codex. Ten
prefiks jest jawną ścieżką „Codex OAuth przez PI”. Zmiany konfiguracji dotyczą
nowych lub zresetowanych sesji; istniejące sesje zachowują zapisany runtime.

## Co zmienia ten plugin

Wbudowany plugin `codex` dostarcza kilka oddzielnych możliwości:

| Możliwość                        | Jak jej używasz                                      | Co robi                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywny runtime osadzony           | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez app-server Codex.                  |
| Natywne polecenia sterowania czatem      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże i kontroluje wątki app-server Codex z konwersacji komunikatora.    |
| Dostawca/katalog app-server Codex | elementy wewnętrzne `codex`, udostępniane przez harness     | Pozwala runtime wykrywać i walidować modele app-server.                     |
| Ścieżka rozumienia multimediów Codex    | ścieżki zgodności modeli obrazów `codex/*`           | Uruchamia ograniczone tury app-server Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywny przekaźnik hooków                 | Hooki pluginu wokół natywnych zdarzeń Codex             | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex.  |

Włączenie pluginu udostępnia te możliwości. **Nie** powoduje to:

- używania Codex dla każdego modelu OpenAI
- konwertowania referencji modeli `openai-codex/*` na natywny runtime
- ustawienia ACP/acpx jako domyślnej ścieżki Codex
- przełączania na gorąco istniejących sesji, które już zapisały runtime PI
- zastąpienia dostarczania kanałów OpenClaw, plików sesji, przechowywania profili
  uwierzytelniania ani routingu wiadomości

Ten sam plugin odpowiada także za natywną powierzchnię poleceń sterowania czatem
`/codex`. Jeśli plugin jest włączony, a użytkownik prosi o powiązanie,
wznowienie, sterowanie, zatrzymanie lub sprawdzenie wątków Codex z czatu, agenci
powinni preferować `/codex ...` zamiast ACP. ACP pozostaje jawnym rozwiązaniem
awaryjnym, gdy użytkownik prosi o ACP/acpx albo testuje adapter ACP Codex.

Natywne tury Codex zachowują hooki pluginów OpenClaw jako publiczną warstwę
zgodności. Są to wewnątrzprocesowe hooki OpenClaw, a nie hooki poleceń Codex
`hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkrypcji
- `before_agent_finalize` przez przekaźnik Codex `Stop`
- `agent_end`

Pluginy mogą także rejestrować neutralne względem runtime middleware wyników
narzędzi, aby przepisywać dynamiczne wyniki narzędzi OpenClaw po wykonaniu
narzędzia przez OpenClaw i przed zwróceniem wyniku do Codex. Jest to oddzielne
od publicznego hooka pluginu `tool_result_persist`, który przekształca zapisy
wyników narzędzi w transkrypcji należącej do OpenClaw.

Semantykę samych hooków pluginów opisują [Hooki pluginów](/pl/plugins/hooks) oraz
[Zachowanie strażnika pluginów](/pl/tools/plugin).

Harness jest domyślnie wyłączony. Nowe konfiguracje powinny utrzymywać
referencje modeli OpenAI w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`, gdy potrzebują
natywnego wykonywania przez app-server. Starsze referencje modeli `codex/*`
nadal automatycznie wybierają harness dla zgodności, ale starsze prefiksy
dostawców oparte na runtime nie są pokazywane jako normalne wybory
modelu/dostawcy.

Jeśli plugin `codex` jest włączony, ale model główny nadal ma postać
`openai-codex/*`, `openclaw doctor` wyświetla ostrzeżenie zamiast zmieniać
ścieżkę. To celowe: `openai-codex/*` pozostaje ścieżką PI Codex
OAuth/subskrypcji, a natywne wykonywanie app-server pozostaje jawnym wyborem
runtime.

## Mapa ścieżek

Użyj tej tabeli przed zmianą konfiguracji:

| Oczekiwane zachowanie                                     | Referencja modelu                  | Konfiguracja runtime                         | Ścieżka uwierzytelniania/profilu           | Oczekiwana etykieta statusu          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Subskrypcja ChatGPT/Codex z natywnym runtime Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth lub konto Codex | `Runtime: OpenAI Codex`        |
| OpenAI API przez zwykły runner OpenClaw            | `openai/gpt-*`             | pominięte lub `runtime: "pi"`             | Klucz OpenAI API               | `Runtime: OpenClaw Pi Default` |
| Subskrypcja ChatGPT/Codex przez PI                | `openai-codex/gpt-*`       | pominięte lub `runtime: "pi"`             | Dostawca OpenAI Codex OAuth  | `Runtime: OpenClaw Pi Default` |
| Mieszani dostawcy z konserwatywnym trybem automatycznym          | referencje specyficzne dla dostawcy     | `agentRuntime.id: "auto"`              | Według wybranego dostawcy        | Zależy od wybranego runtime    |
| Jawna sesja adaptera Codex ACP                   | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"` | Uwierzytelnianie backendu ACP             | Status zadania/sesji ACP        |

Ważny podział to dostawca kontra runtime:

- `openai-codex/*` odpowiada na pytanie „której ścieżki dostawcy/uwierzytelniania
  powinien użyć PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla powinna wykonać tę
  osadzoną turę?”
- `/codex ...` odpowiada na pytanie „którą natywną konwersację Codex ten czat ma
  powiązać lub kontrolować?”
- ACP odpowiada na pytanie „który zewnętrzny proces harnessu powinien uruchomić
  acpx?”

## Wybierz właściwy prefiks modelu

Ścieżki rodziny OpenAI zależą od prefiksu. Dla typowej konfiguracji subskrypcji
plus natywnego runtime Codex użyj `openai/*` z `agentRuntime.id: "codex"`.
Używaj `openai-codex/*` tylko wtedy, gdy celowo chcesz Codex OAuth przez PI:

| Referencja modelu                                     | Ścieżka runtime                                 | Kiedy używać                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Dostawca OpenAI przez instalację OpenClaw/PI | Gdy chcesz aktualnego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth przez OpenClaw/PI       | Gdy chcesz uwierzytelniania subskrypcją ChatGPT/Codex z domyślnym runnerem PI.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Gdy chcesz uwierzytelniania subskrypcją ChatGPT/Codex z natywnym wykonywaniem Codex.     |

GPT-5.5 może pojawiać się zarówno na bezpośrednich ścieżkach klucza API OpenAI,
jak i subskrypcji Codex, gdy konto je udostępnia. Użyj `openai/gpt-5.5` z
harnessem app-server Codex dla natywnego runtime Codex, `openai-codex/gpt-5.5`
dla PI OAuth albo `openai/gpt-5.5` bez nadpisania runtime Codex dla ruchu z
bezpośrednim kluczem API.

Starsze referencje `codex/gpt-*` nadal są akceptowane jako aliasy zgodności.
Migracja zgodności doctor przepisuje starsze referencje głównego runtime na
kanoniczne referencje modeli i zapisuje politykę runtime oddzielnie, natomiast
starsze referencje używane tylko jako fallback pozostają niezmienione, ponieważ
runtime jest konfigurowany dla całego kontenera agenta. Nowe konfiguracje PI
Codex OAuth powinny używać `openai-codex/gpt-*`; nowe konfiguracje natywnego
harnessu app-server powinny używać `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` podlega temu samemu podziałowi prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów powinno działać przez ścieżkę
dostawcy OpenAI Codex OAuth. Użyj `codex/gpt-*`, gdy rozumienie obrazów powinno
działać przez ograniczoną turę app-server Codex. Model app-server Codex musi
deklarować obsługę wejścia obrazowego; modele Codex obsługujące tylko tekst
zawiodą przed rozpoczęciem tury multimedialnej.

Użyj `/status`, aby potwierdzić efektywny harness bieżącej sesji. Jeśli wybór
jest zaskakujący, włącz logowanie debugowania dla podsystemu `agents/harness` i
sprawdź ustrukturyzowany rekord `agent harness selected` gatewaya. Zawiera on
wybrany identyfikator harnessu, powód wyboru, politykę runtime/fallback oraz, w
trybie `auto`, wynik obsługi każdego kandydata pluginu.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy wszystkie poniższe warunki są prawdziwe:

- wbudowany plugin `codex` jest włączony lub dozwolony
- główny model agenta ma postać `openai-codex/*`
- efektywny runtime tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „plugin Codex
włączony” oznacza „natywny runtime app-server Codex”. OpenClaw nie wykonuje tego
skoku. Ostrzeżenie oznacza:

- **Nie jest wymagana żadna zmiana**, jeśli zamierzałeś użyć ChatGPT/Codex OAuth
  przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamierzałeś użyć natywnego wykonywania
  app-server.
- Istniejące sesje nadal wymagają `/new` albo `/reset` po zmianie runtime,
  ponieważ przypięcia runtime sesji są trwałe.

Wybór harnessu nie jest kontrolą sesji na żywo. Gdy działa tura osadzona,
OpenClaw zapisuje wybrany identyfikator harnessu w tej sesji i dalej używa go w
późniejszych turach z tym samym identyfikatorem sesji. Zmień konfigurację
`agentRuntime` albo `OPENCLAW_AGENT_RUNTIME`, gdy chcesz, aby przyszłe sesje
używały innego harnessu; użyj `/new` albo `/reset`, aby rozpocząć świeżą sesję
przed przełączeniem istniejącej konwersacji między PI i Codex. Pozwala to
uniknąć odtwarzania jednej transkrypcji przez dwa niezgodne natywne systemy
sesji.

Starsze sesje utworzone przed przypięciami harnessu są traktowane jako przypięte
do PI, gdy mają historię transkrypcji. Użyj `/new` albo `/reset`, aby włączyć tę
konwersację do Codex po zmianie konfiguracji.

`/status` pokazuje efektywne środowisko wykonawcze modelu. Domyślny harness PI jest wyświetlany jako
`Runtime: OpenClaw Pi Default`, a harness serwera aplikacji Codex jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym pluginem `codex`.
- Serwer aplikacji Codex `0.125.0` lub nowszy. Dołączony plugin domyślnie zarządza zgodnym
  binarium serwera aplikacji Codex, więc lokalne polecenia `codex` w `PATH` nie
  wpływają na normalne uruchamianie harnessu.
- Uwierzytelnianie Codex dostępne dla procesu serwera aplikacji albo dla mostka
  uwierzytelniania Codex w OpenClaw. Lokalne uruchomienia serwera aplikacji używają zarządzanego przez OpenClaw katalogu domowego Codex dla każdego
  agenta oraz izolowanego podrzędnego `HOME`, więc domyślnie nie odczytują Twojego osobistego
  konta, Skills, pluginów, konfiguracji, stanu wątków ani natywnego
  `$HOME/.agents/skills` z `~/.codex`.

Plugin blokuje starsze lub niewersjonowane uzgodnienia serwera aplikacji. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, z którą został przetestowany.

W testach dymnych live i Docker uwierzytelnianie zwykle pochodzi z konta Codex CLI
albo profilu uwierzytelniania OpenClaw `openai-codex`. Lokalne uruchomienia serwera aplikacji stdio mogą
również awaryjnie użyć `CODEX_API_KEY` / `OPENAI_API_KEY`, gdy nie ma żadnego konta.

## Dodawanie Codex obok innych modeli

Nie ustawiaj globalnie `agentRuntime.id: "codex"`, jeśli ten sam agent ma swobodnie przełączać się
między Codex a modelami dostawców innych niż Codex. Wymuszone środowisko wykonawcze dotyczy każdej
osadzonej tury tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy
to środowisko wykonawcze jest wymuszone, OpenClaw nadal próbuje użyć harnessu Codex i kończy niepowodzeniem w trybie zamkniętym
zamiast po cichu kierować tę turę przez PI.

Zamiast tego użyj jednego z tych układów:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Zachowaj domyślnego agenta na `agentRuntime.id: "auto"` oraz awaryjne użycie PI dla zwykłego mieszanego
  użycia dostawców.
- Używaj starszych referencji `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` oraz jawną politykę środowiska wykonawczego Codex.

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

W tym układzie:

- Domyślny agent `main` używa normalnej ścieżki dostawcy i awaryjnej zgodności PI.
- Agent `codex` używa harnessu serwera aplikacji Codex.
- Jeśli Codex jest brakujący lub nieobsługiwany dla agenta `codex`, tura kończy się niepowodzeniem
  zamiast po cichu używać PI.

## Kierowanie poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, a nie tylko według słowa „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Powiąż ten czat z Codex”                              | `/codex bind`                                    |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                             |
| „Pokaż wątki Codex”                                    | `/codex threads`                                 |
| „Zgłoś raport wsparcia dla błędnego uruchomienia Codex” | `/diagnostics [note]`                            |
| „Wyślij tylko opinię Codex dla tego dołączonego wątku” | `/codex diagnostics [note]`                      |
| „Użyj mojej subskrypcji ChatGPT/Codex ze środowiskiem wykonawczym Codex” | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Użyj mojej subskrypcji ChatGPT/Codex przez PI”        | referencje modeli `openai-codex/*`              |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` i nie natywni podagenci   |

OpenClaw reklamuje agentom wskazówki uruchamiania ACP tylko wtedy, gdy ACP jest włączone,
możliwe do wysłania i wspierane przez załadowany backend środowiska wykonawczego. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills pluginu nie powinny uczyć agenta kierowania przez ACP.

## Wdrożenia tylko Codex

Wymuś harness Codex, gdy musisz udowodnić, że każda osadzona tura agenta
używa Codex. Jawne środowiska wykonawcze pluginów domyślnie nie mają awaryjnego PI, więc
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

Gdy Codex jest wymuszony, OpenClaw kończy wcześnie niepowodzeniem, jeśli plugin Codex jest wyłączony,
serwer aplikacji jest zbyt stary albo serwer aplikacji nie może się uruchomić. Ustaw
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` tylko wtedy, gdy celowo chcesz, aby PI obsłużyło
brakujący wybór harnessu.

## Codex na agenta

Możesz ustawić jednego agenta jako tylko Codex, podczas gdy domyślny agent zachowa normalny
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

Używaj normalnych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy nową
sesję OpenClaw, a harness Codex tworzy lub wznawia swój boczny wątek serwera aplikacji
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnej turze ponownie rozwiązać harness z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie plugin Codex pyta serwer aplikacji o dostępne modele. Jeśli
wykrywanie się nie powiedzie lub przekroczy limit czasu, używa dołączonego katalogu awaryjnego dla:

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

## Połączenie i polityka serwera aplikacji

Domyślnie plugin uruchamia lokalnie zarządzane przez OpenClaw binarium Codex z:

```bash
codex app-server --listen stdio://
```

Zarządzane binarium jest dostarczane z pakietem pluginu `codex`. Dzięki temu
wersja serwera aplikacji jest powiązana z dołączonym pluginem zamiast z dowolnym osobnym
Codex CLI zainstalowanym lokalnie. Ustaw `appServer.command` tylko wtedy,
gdy celowo chcesz uruchomić inny plik wykonywalny.

Domyślnie OpenClaw uruchamia lokalne sesje harnessu Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana postawa lokalnego operatora używana
dla autonomicznych Heartbeat: Codex może używać powłoki i narzędzi sieciowych bez
zatrzymywania się na natywnych promptach zatwierdzania, na które nikt nie jest dostępny, aby odpowiedzieć.

Aby włączyć zatwierdzenia sprawdzane przez strażnika Codex, ustaw `appServer.mode:
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

Tryb strażnika używa natywnej ścieżki zatwierdzania z automatyczną recenzją Codex. Gdy Codex prosi o
opuszczenie piaskownicy, zapis poza obszarem roboczym albo dodanie uprawnień, takich jak dostęp do sieci,
Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza lub odrzuca
konkretne żądanie. Użyj Guardiana, gdy chcesz mieć więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą mieszać
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
ale OpenClaw jest właścicielem mostka konta serwera aplikacji Codex i ustawia zarówno
`CODEX_HOME`, jak i `HOME` na katalogi per agent w stanie OpenClaw tego agenta.
Własny loader Skills Codex odczytuje `$CODEX_HOME/skills` oraz
`$HOME/.agents/skills`, więc obie wartości są izolowane dla lokalnych uruchomień serwera aplikacji.
Dzięki temu natywne Skills, pluginy, konfiguracja, konta i stan wątków Codex
są ograniczone do agenta OpenClaw zamiast przenikać z osobistego katalogu domowego Codex CLI operatora.

Pluginy OpenClaw i migawki Skills OpenClaw nadal przepływają przez własny
rejestr pluginów i loader Skills OpenClaw. Osobiste zasoby Codex CLI nie. Jeśli masz
przydatne Skills lub pluginy Codex CLI, które powinny stać się częścią agenta OpenClaw,
zinwentaryzuj je jawnie:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Dostawca migracji Codex kopiuje Skills do bieżącego obszaru roboczego agenta OpenClaw.
Natywne pluginy, hooki i pliki konfiguracyjne Codex są raportowane lub archiwizowane
do ręcznego przeglądu zamiast być aktywowane automatycznie, ponieważ mogą
wykonywać polecenia, udostępniać serwery MCP albo zawierać poświadczenia.

Uwierzytelnianie jest wybierane w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw Codex dla agenta.
2. Istniejące konto serwera aplikacji w katalogu domowym Codex tego agenta.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio, `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy nie ma konta serwera aplikacji i uwierzytelnianie OpenAI
   jest nadal wymagane.

Gdy OpenClaw widzi profil uwierzytelniania Codex w stylu subskrypcji ChatGPT, usuwa
`CODEX_API_KEY` i `OPENAI_API_KEY` z uruchamianego procesu potomnego Codex. Dzięki temu
klucze API na poziomie Gateway pozostają dostępne dla embeddingów lub bezpośrednich modeli OpenAI
bez przypadkowego rozliczania natywnych tur serwera aplikacji Codex przez API.
Jawne profile klucza API Codex oraz lokalne awaryjne użycie kluczy środowiskowych stdio korzystają z logowania serwera aplikacji
zamiast z odziedziczonego środowiska procesu potomnego. Połączenia WebSocket z serwerem aplikacji
nie otrzymują awaryjnych kluczy API środowiska Gateway; użyj jawnego profilu uwierzytelniania albo
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

`appServer.clearEnv` wpływa tylko na uruchamiany proces potomny serwera aplikacji Codex.

Dynamiczne narzędzia Codex domyślnie używają profilu `native-first`. W tym trybie
OpenClaw nie udostępnia dynamicznych narzędzi, które duplikują natywne operacje obszaru roboczego Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` oraz
`update_plan`. Narzędzia integracyjne OpenClaw, takie jak komunikacja, sesje, media,
Cron, przeglądarka, węzły, Gateway, `heartbeat_respond` oraz `web_search`, pozostają
dostępne.

Obsługiwane pola Plugin najwyższego poziomu Codex:

| Pole                       | Domyślnie        | Znaczenie                                                                                |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Użyj `"openclaw-compat"`, aby udostępnić pełny zestaw dynamicznych narzędzi OpenClaw app-serverowi Codex. |
| `codexDynamicToolsExclude` | `[]`             | Dodatkowe nazwy dynamicznych narzędzi OpenClaw, które mają zostać pominięte w turach app-servera Codex. |

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                                                                                                                                         |
| `command`           | zarządzany plik binarny Codex            | Plik wykonywalny dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego pliku binarnego; ustaw tylko w celu jawnego nadpisania.                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                                                                                                                                     |
| `url`               | nieustawione                             | URL app-servera WebSocket.                                                                                                                                                                                                          |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                     | Dodatkowe nazwy zmiennych środowiskowych usuwane z uruchomionego procesu app-servera stdio po zbudowaniu przez OpenClaw dziedziczonego środowiska. `CODEX_HOME` i `HOME` są zarezerwowane dla izolacji Codex per agent OpenClaw podczas lokalnych uruchomień. |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-servera.                                                                                                                                                                         |
| `mode`              | `"yolo"`                                 | Preset dla wykonywania YOLO albo sprawdzanego przez opiekuna.                                                                                                                                                                       |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana do startu/wznowienia wątku/tury.                                                                                                                                                      |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb piaskownicy Codex wysyłany do startu/wznowienia wątku.                                                                                                                                                                 |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby Codex sprawdzał natywne monity zatwierdzania. `guardian_subagent` pozostaje starszym aliasem.                                                                                                             |
| `serviceTier`       | nieustawione                             | Opcjonalna warstwa usługi app-servera Codex: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane.                                                                                                          |

Wywołania dynamicznych narzędzi należących do OpenClaw są ograniczane niezależnie od
`appServer.requestTimeoutMs`: każde żądanie Codex `item/tool/call` musi otrzymać
odpowiedź OpenClaw w ciągu 30 sekund. Po przekroczeniu limitu czasu OpenClaw przerywa
sygnał narzędzia tam, gdzie jest to obsługiwane, i zwraca do Codex nieudaną odpowiedź
dynamicznego narzędzia, aby tura mogła być kontynuowana zamiast pozostawiać sesję w stanie `processing`.

Po tym, jak OpenClaw odpowie na żądanie app-servera Codex ograniczone do tury, harness
oczekuje także, że Codex zakończy natywną turę przez `turn/completed`. Jeśli
app-server milczy przez 60 sekund po tej odpowiedzi, OpenClaw w trybie best-effort
przerywa turę Codex, zapisuje diagnostyczne przekroczenie limitu czasu i zwalnia
pas sesji OpenClaw, aby kolejne wiadomości czatu nie były kolejkowane za nieaktualną
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego lokalnego testu. Konfiguracja
jest preferowana w powtarzalnych wdrożeniach, ponieważ utrzymuje zachowanie Plugin
w tym samym sprawdzanym pliku co resztę konfiguracji harnessu Codex.

## Użycie komputera

Użycie komputera opisano w osobnym przewodniku konfiguracji:
[Użycie komputera w Codex](/pl/plugins/codex-computer-use).

W skrócie: OpenClaw nie vendoryzuje aplikacji do sterowania pulpitem ani samodzielnie
nie wykonuje działań na pulpicie. Przygotowuje app-server Codex, weryfikuje, że
serwer MCP `computer-use` jest dostępny, a następnie pozwala Codex obsłużyć natywne
wywołania narzędzi MCP podczas tur w trybie Codex.

Aby uzyskać bezpośredni dostęp do sterownika TryCua poza przepływem marketplace Codex, zarejestruj
`cua-driver mcp` poleceniem `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
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

Użycie komputera jest specyficzne dla systemu macOS i może wymagać lokalnych uprawnień systemu operacyjnego, zanim
serwer MCP Codex będzie mógł sterować aplikacjami. Jeśli `computerUse.enabled` ma wartość true, a serwer MCP
jest niedostępny, tury w trybie Codex kończą się niepowodzeniem przed uruchomieniem wątku zamiast
po cichu działać bez natywnych narzędzi użycia komputera. Zobacz
[Użycie komputera w Codex](/pl/plugins/codex-computer-use), aby poznać wybory marketplace,
limity zdalnego katalogu, przyczyny statusu i rozwiązywanie problemów.

Gdy `computerUse.autoInstall` ma wartość true, OpenClaw może zarejestrować standardowy
dołączony marketplace Codex Desktop z
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, jeśli Codex
nie wykrył jeszcze lokalnego marketplace. Użyj `/new` albo `/reset` po
zmianie konfiguracji runtime lub użycia komputera, aby istniejące sesje nie zachowały starego
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

Walidacja harnessu tylko Codex:

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

Przełączanie modeli pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw jest dołączona
do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany
model OpenAI, dostawcę, politykę zatwierdzania, piaskownicę i warstwę usługi do
app-servera. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje
powiązanie wątku, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane polecenie z ukośnikiem. Jest
ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje aktywną łączność app-servera, modele, konto, limity użycia, serwery MCP i Skills.
- `/codex models` wyświetla modele aktywnego app-servera Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywne sprawdzanie Codex dla dołączonego wątku.
- `/codex diagnostics [note]` pyta przed wysłaniem opinii diagnostycznej Codex dla dołączonego wątku.
- `/codex computer-use status` sprawdza skonfigurowany Plugin użycia komputera i serwer MCP.
- `/codex computer-use install` instaluje skonfigurowany Plugin użycia komputera i przeładowuje serwery MCP.
- `/codex account` pokazuje konto i status limitów użycia.
- `/codex mcp` wyświetla status serwerów MCP app-servera Codex.
- `/codex skills` wyświetla Skills app-servera Codex.

### Typowy przepływ debugowania

Gdy agent oparty na Codex zrobi coś zaskakującego w Telegram, Discord, Slack
lub innym kanale, zacznij od rozmowy, w której wystąpił problem:

1. Uruchom `/diagnostics bad tool choice after image upload` albo inną krótką notatkę
   opisującą to, co zobaczyłeś.
2. Zatwierdź żądanie diagnostyki raz. Zatwierdzenie tworzy lokalny plik zip
   diagnostyki Gateway, a ponieważ sesja używa warstwy uruchomieniowej Codex,
   wysyła też odpowiedni pakiet opinii Codex na serwery OpenAI.
3. Skopiuj ukończoną odpowiedź diagnostyczną do zgłoszenia błędu albo wątku
   wsparcia. Zawiera ona lokalną ścieżkę pakietu, podsumowanie prywatności,
   identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz wiersz
   `Inspect locally` dla każdego wątku Codex.
4. Jeśli chcesz samodzielnie debugować przebieg, uruchom wypisane polecenie
   `Inspect locally` w terminalu. Wygląda ono jak `codex resume <thread-id>` i
   otwiera natywny wątek Codex, aby można było przejrzeć rozmowę, kontynuować ją
   lokalnie albo zapytać Codex, dlaczego wybrał konkretne narzędzie lub plan.

Używaj `/codex diagnostics [note]` tylko wtedy, gdy konkretnie chcesz przesłać
opinię Codex dla aktualnie dołączonego wątku bez pełnego lokalnego pakietu
diagnostycznego OpenClaw Gateway. W przypadku większości zgłoszeń do wsparcia
`/diagnostics [note]` jest lepszym punktem wyjścia, ponieważ łączy lokalny stan
Gateway i identyfikatory wątków Codex w jednej odpowiedzi. Zobacz [Eksport diagnostyki](/pl/gateway/diagnostics),
aby poznać pełny model prywatności i zachowanie w czatach grupowych.

Rdzeń OpenClaw udostępnia też przeznaczone tylko dla właściciela
`/diagnostics [note]` jako ogólne polecenie diagnostyczne Gateway. Monit
zatwierdzenia pokazuje wstęp dotyczący danych wrażliwych, zawiera link do
[Eksport diagnostyki](/pl/gateway/diagnostics) i za każdym razem żąda
`openclaw gateway diagnostics export --json` przez jawne zatwierdzenie exec.
Nie zatwierdzaj diagnostyki regułą allow-all. Po zatwierdzeniu OpenClaw wysyła
raport gotowy do wklejenia, zawierający lokalną ścieżkę pakietu i podsumowanie
manifestu. Gdy aktywna sesja OpenClaw używa warstwy uruchomieniowej Codex, to
samo zatwierdzenie autoryzuje też wysłanie odpowiednich pakietów opinii Codex na
serwery OpenAI. Monit zatwierdzenia informuje, że opinia Codex zostanie wysłana,
ale przed zatwierdzeniem nie podaje identyfikatorów sesji ani wątków Codex.

Jeśli `/diagnostics` zostanie wywołane przez właściciela w czacie grupowym,
OpenClaw utrzymuje wspólny kanał w czystości: grupa otrzymuje tylko krótką
notatkę, a wstęp diagnostyczny, monity zatwierdzenia oraz identyfikatory
sesji/wątków Codex są wysyłane do właściciela prywatną ścieżką zatwierdzania.
Jeśli prywatna ścieżka właściciela nie istnieje, OpenClaw odmawia obsługi
żądania z grupy i prosi właściciela o uruchomienie go z DM.

Zatwierdzone przesłanie Codex wywołuje `feedback/upload` app-server Codex i
prosi app-server o dołączenie logów dla każdego wymienionego wątku oraz
utworzonych podwątków Codex, gdy są dostępne. Przesyłanie odbywa się zwykłą
ścieżką opinii Codex na serwery OpenAI; jeśli opinie Codex są wyłączone w tym
app-server, polecenie zwraca błąd app-server. Ukończona odpowiedź diagnostyczna
wymienia kanały, identyfikatory sesji OpenClaw, identyfikatory wątków Codex oraz
lokalne polecenia `codex resume <thread-id>` dla wysłanych wątków. Jeśli
odmówisz zatwierdzenia albo je zignorujesz, OpenClaw nie wypisze tych
identyfikatorów Codex. To przesłanie nie zastępuje lokalnego eksportu
diagnostyki Gateway.

`/codex resume` zapisuje ten sam plik powiązań sidecar, którego warstwa
uruchomieniowa używa dla zwykłych tur. Przy następnej wiadomości OpenClaw
wznawia ten wątek Codex, przekazuje aktualnie wybrany model OpenClaw do
app-server i utrzymuje włączoną rozszerzoną historię.

### Sprawdź wątek Codex z CLI

Najszybszym sposobem zrozumienia nieudanego przebiegu Codex często jest
bezpośrednie otwarcie natywnego wątku Codex:

```sh
codex resume <thread-id>
```

Użyj tego, gdy zauważysz błąd w rozmowie kanału i chcesz sprawdzić problematyczną
sesję Codex, kontynuować ją lokalnie albo zapytać Codex, dlaczego podjął
konkretną decyzję dotyczącą narzędzia lub rozumowania. Najłatwiejszą ścieżką
zwykle jest najpierw uruchomienie `/diagnostics [note]`: po zatwierdzeniu
ukończony raport wymienia każdy wątek Codex i wypisuje polecenie
`Inspect locally`, na przykład `codex resume <thread-id>`. Możesz skopiować to
polecenie bezpośrednio do terminala.

Możesz też uzyskać identyfikator wątku z `/codex binding` dla bieżącego czatu
albo z `/codex threads [filter]` dla ostatnich wątków app-server Codex, a potem
uruchomić to samo polecenie `codex resume` w powłoce.

Powierzchnia poleceń wymaga app-server Codex `0.125.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Granice hooków

Warstwa uruchomieniowa Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki pluginów OpenClaw               | OpenClaw                 | Zgodność produktu/pluginów w warstwach uruchomieniowych PI i Codex. |
| Middleware rozszerzeń app-server Codex | Wbudowane pluginy OpenClaw | Zachowanie adaptera dla każdej tury wokół narzędzi dynamicznych OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do
kierowania zachowaniem pluginów OpenClaw. Dla obsługiwanego mostu natywnych
narzędzi i uprawnień OpenClaw wstrzykuje konfigurację Codex dla każdego wątku dla
`PreToolUse`, `PostToolUse`, `PermissionRequest` i `Stop`. Inne hooki Codex,
takie jak `SessionStart` i `UserPromptSubmit`, pozostają kontrolkami na poziomie
Codex; nie są udostępniane jako hooki pluginów OpenClaw w kontrakcie v1.

W przypadku narzędzi dynamicznych OpenClaw, OpenClaw wykonuje narzędzie po tym,
jak Codex poprosi o wywołanie, więc OpenClaw uruchamia zachowanie pluginów i
middleware, które posiada, w adapterze warstwy uruchomieniowej. W przypadku
narzędzi natywnych Codex to Codex posiada kanoniczny rekord narzędzia. OpenClaw
może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku
Codex, chyba że Codex udostępni taką operację przez app-server albo wywołania
zwrotne natywnych hooków.

Projekcje cyklu życia Compaction i LLM pochodzą z powiadomień app-server Codex
oraz stanu adaptera OpenClaw, a nie z poleceń natywnych hooków Codex. Zdarzenia
OpenClaw `before_compaction`, `after_compaction`, `llm_input` i `llm_output` są
obserwacjami na poziomie adaptera, a nie przechwyceniami bajt po bajcie
wewnętrznych żądań Codex ani payloadów Compaction.

Natywne powiadomienia app-server Codex `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby
trajektorii i debugowania. Nie wywołują hooków pluginów OpenClaw.

## Kontrakt obsługi V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex posiada większą
część natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie pluginów i
sesji wokół tej granicy.

Obsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                  | Obsługa                                  | Dlaczego                                                                                                                                                                                              |
| --------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwane                              | App-server Codex posiada turę OpenAI, natywne wznowienie wątku i natywną kontynuację narzędzia.                                                                                                       |
| Routing i dostarczanie kanałów OpenClaw       | Obsługiwane                              | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza środowiskiem uruchomieniowym modelu.                                                                                        |
| Narzędzia dynamiczne OpenClaw                 | Obsługiwane                              | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                                                                                         |
| Pluginy promptów i kontekstu                  | Obsługiwane                              | OpenClaw buduje nakładki promptów i projektuje kontekst do tury Codex przed uruchomieniem albo wznowieniem wątku.                                                                                     |
| Cykl życia silnika kontekstu                  | Obsługiwane                              | Składanie, ingest albo konserwacja po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                     |
| Hooki narzędzi dynamicznych                   | Obsługiwane                              | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół narzędzi dynamicznych należących do OpenClaw.                                                                      |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera     | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z uczciwymi payloadami trybu Codex.                                                                  |
| Bramka rewizji odpowiedzi końcowej            | Obsługiwane przez przekaźnik natywnych hooków | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jedno przejście modelu przed finalizacją.                                                                    |
| Blokowanie albo obserwowanie natywnej powłoki, patchy i MCP | Obsługiwane przez przekaźnik natywnych hooków | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym payloadów MCP w app-server Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie jest. |
| Natywna polityka uprawnień                    | Obsługiwane przez przekaźnik natywnych hooków | Codex `PermissionRequest` może być kierowane przez politykę OpenClaw tam, gdzie środowisko uruchomieniowe ją udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex kontynuuje przez zwykłą ścieżkę guardiana albo zatwierdzenia użytkownika. |
| Przechwytywanie trajektorii app-server        | Obsługiwane                              | OpenClaw rejestruje żądanie wysłane do app-server i powiadomienia app-server, które otrzymuje.                                                                                                       |

Nieobsługiwane w środowisku uruchomieniowym Codex v1:

| Powierzchnia                                        | Granica V1                                                                                                                                      | Przyszła ścieżka                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Modyfikacja argumentów natywnych narzędzi           | Natywne haki Codex przed narzędziem mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych dla Codex.                       | Wymaga obsługi haków/schematu Codex dla zastępczych danych wejściowych narzędzia.         |
| Edytowalna historia natywnej transkrypcji Codex     | Codex jest właścicielem kanonicznej historii natywnego wątku. OpenClaw ma lustro i może projektować przyszły kontekst, ale nie powinien modyfikować nieobsługiwanych elementów wewnętrznych. | Dodaj jawne API serwera aplikacji Codex, jeśli potrzebna jest chirurgiczna edycja natywnego wątku. |
| `tool_result_persist` dla natywnych rekordów narzędzi Codex | Ten hak przekształca zapisy transkrypcji należące do OpenClaw, a nie natywne rekordy narzędzi Codex.                                           | Można odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga obsługi Codex. |
| Bogate natywne metadane Compaction                  | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction w Codex.                                             |
| Interwencja w Compaction                            | Obecne haki Compaction OpenClaw są w trybie Codex na poziomie powiadomień.                                                                      | Dodaj haki Codex przed/po Compaction, jeśli pluginy muszą wetować lub przepisywać natywną Compaction. |
| Przechwytywanie żądania API modelu bajt po bajcie   | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex wewnętrznie buduje końcowe żądanie API OpenAI.          | Wymaga zdarzenia śledzenia żądania modelu Codex albo API debugowania.                     |

## Narzędzia, media i Compaction

Harness Codex zmienia tylko niskopoziomowy wykonawca osadzonego agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
harnessu. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzia wiadomości nadal przechodzą przez normalną ścieżkę dostarczania
OpenClaw.

Natywny przekaźnik haków jest celowo ogólny, ale kontrakt obsługi v1 jest
ograniczony do natywnych dla Codex ścieżek narzędzi i uprawnień, które testuje
OpenClaw. W środowisku uruchomieniowym Codex obejmuje to ładunki shell, patch i MCP `PreToolUse`,
`PostToolUse` oraz `PermissionRequest`. Nie zakładaj, że każde przyszłe
zdarzenie haka Codex jest powierzchnią Plugin OpenClaw, dopóki kontrakt środowiska uruchomieniowego jej
nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje zezwolenia lub odmowy
tylko wtedy, gdy decyduje polityka. Wynik bez decyzji nie jest zezwoleniem. Codex traktuje go jako brak
decyzji haka i przechodzi do własnej ścieżki guardiana lub zatwierdzenia przez użytkownika.

Wywołania zatwierdzeń narzędzi Codex MCP są kierowane przez przepływ zatwierdzeń
pluginów OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Monity Codex `request_user_input` są odsyłane do
czatu źródłowego, a następna zakolejkowana wiadomość uzupełniająca odpowiada na to natywne
żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne żądania wywołań MCP
nadal kończą się zamkniętą odmową.

Sterowanie kolejką aktywnego uruchomienia mapuje się na `turn/steer` serwera aplikacji Codex. Przy
domyślnym `messages.queue.mode: "steer"` OpenClaw grupuje zakolejkowane wiadomości czatu
dla skonfigurowanego okna ciszy i wysyła je jako jedno żądanie `turn/steer` w
kolejności nadejścia. Starszy tryb `queue` wysyła osobne żądania `turn/steer`. Tury
przeglądu Codex i ręcznej Compaction mogą odrzucić sterowanie w tej samej turze; w takim przypadku
OpenClaw używa kolejki uzupełniającej, gdy wybrany tryb pozwala na fallback. Zobacz
[Kolejka sterowania](/pl/concepts/queue-steering).

Gdy wybrany model używa harnessu Codex, natywna Compaction wątku jest
delegowana do serwera aplikacji Codex. OpenClaw utrzymuje lustro transkrypcji dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub harnessu. Lustro
obejmuje monit użytkownika, końcowy tekst asystenta oraz lekkie rekordy rozumowania lub planu Codex,
gdy serwer aplikacji je emituje. Obecnie OpenClaw rejestruje tylko sygnały rozpoczęcia i zakończenia
natywnej Compaction. Nie udostępnia jeszcze czytelnego dla człowieka podsumowania Compaction ani
audytowalnej listy wpisów, które Codex zachował po Compaction.

Ponieważ Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist` obecnie nie
przepisuje natywnych rekordów wyników narzędzi Codex. Ma zastosowanie tylko wtedy, gdy
OpenClaw zapisuje wynik narzędzia w transkrypcji sesji należącej do OpenClaw.

Generowanie mediów nie wymaga PI. Obraz, wideo, muzyka, PDF, TTS i rozumienie
mediów nadal używają odpowiednich ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako normalny dostawca `/model`:** jest to oczekiwane w
nowych konfiguracjach. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (albo starszą referencję `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
zaplecza zgodności, gdy żaden harness Codex nie przejmie uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testowania. Wymuszone
środowisko uruchomieniowe Codex teraz kończy się błędem zamiast wracać do PI, chyba że
jawnie ustawisz `agentRuntime.fallback: "pi"`. Gdy serwer aplikacji Codex zostanie
wybrany, jego błędy są ujawniane bezpośrednio bez dodatkowej konfiguracji fallback.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex, aby handshake serwera aplikacji
zgłaszał wersję `0.125.0` lub nowszą. Prerelease o tej samej wersji albo wersje z sufiksem
kompilacji, takie jak `0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ
stabilny próg protokołu `0.125.0` jest tym, co testuje OpenClaw.

**Wykrywanie modeli jest wolne:** zmniejsz `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket natychmiast kończy się błędem:** sprawdź `appServer.url`, `authToken`
oraz to, czy zdalny serwer aplikacji używa tej samej wersji protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** jest to oczekiwane, chyba że wymuszono
`agentRuntime.id: "codex"` dla tego agenta albo wybrano starszą referencję
`codex/*`. Zwykłe referencje `openai/gpt-*` i innych dostawców pozostają na swojej normalnej
ścieżce dostawcy w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`, każda osadzona
tura dla tego agenta musi być modelem OpenAI obsługiwanym przez Codex.

**Computer Use jest zainstalowany, ale narzędzia się nie uruchamiają:** sprawdź
`/codex computer-use status` ze świeżej sesji. Jeśli narzędzie zgłasza
`Native hook relay unavailable`, użyj `/new` lub `/reset`; jeśli problem trwa, uruchom ponownie
gateway, aby wyczyścić nieaktualne rejestracje natywnych haków. Jeśli `computer-use.list_apps`
przekracza limit czasu, uruchom ponownie Codex Computer Use lub Codex Desktop i spróbuj ponownie.

## Powiązane

- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Haki Plugin](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
