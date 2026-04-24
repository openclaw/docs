---
read_when:
    - Chcesz użyć dołączonego harnessu app-server Codex
    - Potrzebujesz odwołań do modeli Codex i przykładów konfiguracji
    - Chcesz wyłączyć fallback Pi dla wdrożeń tylko z Codex
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączony harness app-server Codex
title: harness Codex
x-i18n:
    generated_at: "2026-04-24T09:22:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
app-server Codex zamiast wbudowanego harnessu Pi.

Użyj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta: wykrywaniem
modeli, natywnym wznawianiem wątku, natywną Compaction i wykonywaniem przez
app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modeli, narzędziami,
zatwierdzeniami, dostarczaniem multimediów oraz widocznym lustrzanym zapisem transkryptu.

Natywne tury Codex zachowują hooki Plugin OpenClaw jako publiczną warstwę zgodności.
Są to hooki OpenClaw działające w procesie, a nie hooki poleceń Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkryptu
- `agent_end`

Dołączone pluginy mogą również rejestrować fabrykę rozszerzeń app-server Codex, aby dodać
asynchroniczne middleware `tool_result`. To middleware działa dla dynamicznych narzędzi OpenClaw
po wykonaniu narzędzia przez OpenClaw i przed zwróceniem wyniku do Codex. Jest
oddzielone od publicznego hooka pluginu `tool_result_persist`, który przekształca
zapisy wyników narzędzi w transkrypcie zarządzanym przez OpenClaw.

Harness jest domyślnie wyłączony. Nowe konfiguracje powinny zachować odwołania do modeli OpenAI
w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`embeddedHarness.runtime: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`, gdy
mają używać natywnego wykonywania przez app-server. Starsze odwołania do modeli `codex/*` nadal automatycznie wybierają
harness dla zachowania zgodności.

## Wybierz właściwy prefiks modelu

Trasy rodziny OpenAI są specyficzne dla prefiksu. Użyj `openai-codex/*`, gdy chcesz
OAuth Codex przez Pi; użyj `openai/*`, gdy chcesz bezpośredniego dostępu do API OpenAI lub
gdy wymuszasz natywny harness app-server Codex:

| Model ref                                             | Ścieżka runtime                               | Użyj, gdy                                                                  |
| ----------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Dostawca OpenAI przez mechanizmy OpenClaw/Pi  | Chcesz obecnego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OAuth OpenAI Codex przez OpenClaw/Pi          | Chcesz uwierzytelniania subskrypcją ChatGPT/Codex z domyślnym runnerem Pi. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex                      | Chcesz natywnego wykonywania przez app-server Codex dla osadzonej tury agenta.   |

GPT-5.5 jest obecnie w OpenClaw dostępny tylko przez subskrypcję/OAuth. Użyj
`openai-codex/gpt-5.5` dla OAuth Pi albo `openai/gpt-5.5` z harnessem
app-server Codex. Bezpośredni dostęp przez klucz API dla `openai/gpt-5.5` będzie obsługiwany,
gdy OpenAI udostępni GPT-5.5 w publicznym API.

Starsze odwołania `codex/gpt-*` pozostają akceptowane jako aliasy zgodności. Nowe konfiguracje
OAuth PI Codex powinny używać `openai-codex/gpt-*`; nowe konfiguracje natywnego harnessu
app-server powinny używać `openai/gpt-*` plus `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazu ma działać przez ścieżkę dostawcy OAuth OpenAI
Codex. Użyj `codex/gpt-*`, gdy rozumienie obrazu ma działać
przez ograniczoną turę app-server Codex. Model app-server Codex musi
deklarować obsługę wejścia obrazów; modele tekstowe Codex kończą się błędem, zanim rozpocznie się tura multimedialna.

Użyj `/status`, aby potwierdzić efektywny harness dla bieżącej sesji. Jeśli
wybór jest zaskakujący, włącz logowanie debug dla podsystemu `agents/harness`
i sprawdź ustrukturyzowany rekord gateway `agent harness selected`. Zawiera on
identyfikator wybranego harnessu, przyczynę wyboru, politykę runtime/fallback oraz,
w trybie `auto`, wynik obsługi każdego kandydata pluginu.

Wybór harnessu nie jest mechanizmem sterowania aktywną sesją. Gdy osadzona tura zostanie uruchomiona,
OpenClaw zapisuje identyfikator wybranego harnessu w tej sesji i nadal go używa dla
kolejnych tur w ramach tego samego identyfikatora sesji. Zmień konfigurację `embeddedHarness` lub
`OPENCLAW_AGENT_RUNTIME`, jeśli chcesz, aby przyszłe sesje używały innego harnessu;
użyj `/new` lub `/reset`, aby rozpocząć świeżą sesję przed przełączeniem istniejącej
konwersacji między Pi i Codex. Pozwala to uniknąć odtwarzania jednego transkryptu przez
dwa niezgodne natywne systemy sesji.

Starsze sesje utworzone przed wprowadzeniem przypięć harnessu są traktowane jako przypięte do Pi, jeśli
mają już historię transkryptu. Użyj `/new` lub `/reset`, aby przełączyć tę konwersację na
Codex po zmianie konfiguracji.

`/status` pokazuje efektywny harness inny niż PI obok `Fast`, na przykład
`Fast · codex`. Domyślny harness Pi nadal pozostaje `Runner: pi (embedded)` i
nie dodaje osobnej plakietki harnessu.

## Wymagania

- OpenClaw z dostępnym dołączonym pluginem `codex`.
- App-server Codex `0.118.0` lub nowszy.
- Uwierzytelnianie Codex dostępne dla procesu app-server.

Plugin blokuje starsze lub niezweryfikowane handshake app-server. Dzięki temu
OpenClaw pozostaje przy powierzchni protokołu, z którą był testowany.

W testach smoke live i Docker uwierzytelnianie zwykle pochodzi z `OPENAI_API_KEY`, plus
opcjonalne pliki Codex CLI, takie jak `~/.codex/auth.json` i
`~/.codex/config.toml`. Używaj tych samych materiałów uwierzytelniających, z których korzysta Twój lokalny app-server Codex.

## Minimalna konfiguracja

Użyj `openai/gpt-5.5`, włącz dołączony plugin i wymuś harness `codex`:

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
      embeddedHarness: {
        runtime: "codex",
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

Starsze konfiguracje ustawiające `agents.defaults.model` lub model agenta na
`codex/<model>` nadal automatycznie włączają dołączony plugin `codex`. Nowe konfiguracje powinny
preferować `openai/<model>` plus jawny wpis `embeddedHarness` powyżej.

## Dodaj Codex bez zastępowania innych modeli

Zachowaj `runtime: "auto"`, jeśli chcesz, aby starsze odwołania `codex/*` wybierały Codex, a
Pi było używane dla wszystkiego innego. W nowych konfiguracjach preferuj jawne `runtime: "codex"` dla
agentów, którzy mają używać tego harnessu.

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
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Przy takiej konfiguracji:

- `/model gpt` lub `/model openai/gpt-5.5` używa harnessu app-server Codex dla tej konfiguracji.
- `/model opus` używa ścieżki dostawcy Anthropic.
- Jeśli wybrany jest model inny niż Codex, Pi pozostaje harnessem zgodności.

## Wdrożenia tylko z Codex

Wyłącz fallback Pi, gdy musisz wykazać, że każda osadzona tura agenta używa
harnessu Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Nadpisanie przez zmienną środowiskową:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallbacku OpenClaw kończy działanie wcześniej z błędem, jeśli plugin Codex jest wyłączony,
app-server jest zbyt stary albo app-server nie może się uruchomić.

## Codex dla konkretnego agenta

Możesz ustawić jednego agenta jako tylko Codex, podczas gdy domyślny agent zachowa normalny
automatyczny wybór:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Używaj zwykłych poleceń sesji do przełączania agentów i modeli. `/new` tworzy nową
sesję OpenClaw, a harness Codex tworzy lub wznawia swój poboczny wątek app-server
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala, aby następna tura ponownie ustaliła harness z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie plugin Codex pyta app-server o dostępne modele. Jeśli
wykrywanie się nie powiedzie lub przekroczy limit czasu, używa dołączonego katalogu zapasowego dla:

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

Wyłącz wykrywanie, jeśli chcesz, aby uruchamianie nie próbowało sondować Codex i pozostało przy
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

## Połączenie i polityka app-server

Domyślnie plugin uruchamia Codex lokalnie za pomocą:

```bash
codex app-server --listen stdio://
```

Domyślnie OpenClaw uruchamia lokalne sesje harnessu Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To postawa zaufanego lokalnego operatora używana
dla autonomicznych Heartbeat: Codex może używać narzędzi shell i sieci bez
zatrzymywania się na natywnych promptach zatwierdzeń, na które nikt nie czeka, aby odpowiedzieć.

Aby włączyć zatwierdzenia z recenzją guardian w Codex, ustaw `appServer.mode:
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

Guardian to natywny recenzent zatwierdzeń Codex. Gdy Codex prosi o wyjście poza sandbox, zapis poza obszarem roboczym lub dodanie uprawnień takich jak dostęp do sieci, Codex kieruje to żądanie zatwierdzenia do subagenta recenzującego zamiast do promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza albo odrzuca konkretne żądanie. Użyj Guardian, gdy chcesz mieć więcej zabezpieczeń niż w trybie YOLO, ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` oraz `sandbox: "workspace-write"`. Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą łączyć preset z jawnymi wyborami.

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

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                  |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                |
| `command`           | `"codex"`                                | Plik wykonywalny dla transportu stdio.                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                            |
| `url`               | nieustawione                             | URL app-server WebSocket.                                                                                  |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                                                     |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                              |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                 |
| `mode`              | `"yolo"`                                 | Preset dla wykonywania YOLO lub z recenzją guardian.                                                       |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzeń Codex wysyłana przy starcie/wznawianiu/turze wątku.                          |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb sandbox Codex wysyłany przy starcie/wznawianiu wątku.                                         |
| `approvalsReviewer` | `"user"`                                 | Użyj `"guardian_subagent"`, aby pozwolić Codex Guardian recenzować prompty.                               |
| `serviceTier`       | nieustawione                             | Opcjonalny poziom usługi app-server Codex: `"fast"`, `"flex"` lub `null`. Nieprawidłowe starsze wartości są ignorowane. |

Starsze zmienne środowiskowe nadal działają jako fallbacki dla lokalnych testów, gdy
odpowiadające pole konfiguracji nie jest ustawione:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Użyj zamiast tego
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowego testu lokalnego. Konfiguracja jest
preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie pluginu w
tym samym sprawdzanym pliku co reszta konfiguracji harnessu Codex.

## Typowe receptury

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

Walidacja harnessu tylko Codex, z wyłączonym fallbackiem Pi:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Zatwierdzenia Codex z recenzją guardian:

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
            approvalsReviewer: "guardian_subagent",
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

Przełączanie modeli pozostaje pod kontrolą OpenClaw. Gdy sesja OpenClaw jest podłączona
do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany
model OpenAI, dostawcę, politykę zatwierdzeń, sandbox i poziom usługi do
app-server. Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje
powiązanie wątku, ale prosi Codex o kontynuację z nowo wybranym modelem.

## Polecenie Codex

Dołączony plugin rejestruje `/codex` jako autoryzowane polecenie slash. Jest ono
ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje stan połączenia z app-server na żywo, modele, konto, limity szybkości, serwery MCP i skills.
- `/codex models` wyświetla modele app-server Codex na żywo.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` podłącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o Compaction podłączonego wątku.
- `/codex review` uruchamia natywną recenzję Codex dla podłączonego wątku.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwera MCP app-server Codex.
- `/codex skills` wyświetla Skills app-server Codex.

`/codex resume` zapisuje ten sam poboczny plik powiązania, którego harness używa dla
zwykłych tur. Przy następnej wiadomości OpenClaw wznawia ten wątek Codex, przekazuje
aktualnie wybrany model OpenClaw do app-server i utrzymuje włączoną
rozszerzoną historię.

Powierzchnia poleceń wymaga app-server Codex `0.118.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki pluginów OpenClaw               | OpenClaw                 | Zgodność produktu/pluginu między harnessami Pi i Codex.             |
| Middleware rozszerzeń app-server Codex | Dołączone pluginy OpenClaw | Zachowanie adaptera per tura wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików Codex `hooks.json` do kierowania
zachowaniem pluginów OpenClaw. Natywne hooki Codex są przydatne dla operacji
zarządzanych przez Codex, takich jak polityka shell, natywna recenzja wyników narzędzi, obsługa zatrzymania oraz
natywny cykl życia Compaction/modelu, ale nie są API pluginów OpenClaw.

Dla dynamicznych narzędzi OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie pluginu i middleware, którym zarządza w
adapterze harnessu. W przypadku narzędzi natywnych Codex to Codex zarządza kanonicznym rekordem narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępni tę operację przez app-server lub natywne callbacki hooków.

Gdy nowsze wersje app-server Codex udostępnią natywne zdarzenia hooków cyklu życia
Compaction i modelu, OpenClaw powinien wersjonować obsługę tego protokołu i mapować te
zdarzenia na istniejący kontrakt hooków OpenClaw tam, gdzie semantyka jest uczciwa.
Do tego czasu zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie przechwyceniami bajt w bajt
wewnętrznego żądania lub payloadu Compaction Codex.

Natywne powiadomienia app-server Codex `hook/started` i `hook/completed` są
rzutowane jako zdarzenia agenta `codex_app_server.hook` dla trajektorii i debugowania.
Nie wywołują hooków pluginów OpenClaw.

## Narzędzia, multimedia i Compaction

Harness Codex zmienia tylko niskopoziomowy wykonawca osadzonego agenta.

OpenClaw nadal buduje listę narzędzi i odbiera wyniki dynamicznych narzędzi z
harnessu. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i wyjście narzędzi komunikacyjnych
nadal przechodzą przez zwykłą ścieżkę dostarczania OpenClaw.

Żądania zatwierdzenia narzędzi MCP Codex są kierowane przez przepływ
zatwierdzeń pluginów OpenClaw, gdy Codex oznaczy `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do
oryginalnego czatu, a następna zakolejkowana wiadomość uzupełniająca odpowiada na to natywne
żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne żądania wywołania MCP nadal kończą się bezpieczną odmową.

Gdy wybrany model używa harnessu Codex, natywna Compaction wątku jest delegowana
do app-server Codex. OpenClaw zachowuje lustrzany zapis transkryptu dla historii kanału,
wyszukiwania, `/new`, `/reset` i przyszłego przełączania modelu lub harnessu. Ten
zapis zawiera prompt użytkownika, końcowy tekst asystenta oraz lekkie rekordy rozumowania lub planu Codex,
gdy app-server je emituje. Obecnie OpenClaw zapisuje tylko sygnały rozpoczęcia i zakończenia natywnej Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy wpisów, które Codex
zachował po Compaction.

Ponieważ Codex zarządza kanonicznym natywnym wątkiem, `tool_result_persist` obecnie nie
przepisuje rekordów wyników narzędzi natywnych Codex. Ma zastosowanie tylko wtedy, gdy
OpenClaw zapisuje wynik narzędzia w transkrypcie sesji zarządzanym przez OpenClaw.

Generowanie multimediów nie wymaga Pi. Generowanie obrazów, wideo, muzyki, PDF, TTS oraz
rozumienie multimediów nadal używają odpowiednich ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` oraz
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się w `/model`:** włącz `plugins.entries.codex.enabled`,
wybierz model `openai/gpt-*` z `embeddedHarness.runtime: "codex"` (albo
starsze odwołanie `codex/*`) i sprawdź, czy `plugins.allow` nie wyklucza `codex`.

**OpenClaw używa Pi zamiast Codex:** jeśli żaden harness Codex nie przejmie uruchomienia,
OpenClaw może użyć Pi jako backendu zgodności. Ustaw
`embeddedHarness.runtime: "codex"`, aby wymusić wybór Codex podczas testów, albo
`embeddedHarness.fallback: "none"`, aby zakończyć błędem, gdy żaden harness pluginu nie pasuje. Gdy
app-server Codex zostanie wybrany, jego błędy są zgłaszane bezpośrednio, bez dodatkowej
konfiguracji fallbacku.

**App-server jest odrzucany:** zaktualizuj Codex, aby handshake app-server
zgłaszał wersję `0.118.0` lub nowszą.

**Wykrywanie modeli jest wolne:** zmniejsz `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket kończy się błędem natychmiast:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny app-server mówi w tej samej wersji protokołu app-server Codex.

**Model inny niż Codex używa Pi:** to oczekiwane, chyba że wymusisz
`embeddedHarness.runtime: "codex"` (albo wybierzesz starsze odwołanie `codex/*`). Zwykłe
`openai/gpt-*` i odwołania do innych dostawców pozostają na swojej normalnej ścieżce dostawcy.

## Powiązane

- [Pluginy Agent Harness](/pl/plugins/sdk-agent-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
