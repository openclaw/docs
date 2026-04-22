---
read_when:
    - Chcesz użyć dołączonej wiązki harness app-server Codex
    - Potrzebujesz odwołań do modeli Codex i przykładów konfiguracji
    - Chcesz wyłączyć awaryjne przełączanie na Pi w wdrożeniach tylko z Codex
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączoną wiązkę harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-22T09:51:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19bc7481bf7cdce983efe70e697f8665ace875d96f126979b95dd3f2f739fa8a
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać tury osadzonego agenta przez
app-server Codex zamiast przez wbudowany harness PI.

Używaj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta: wykrywaniem
modeli, natywnym wznawianiem wątku, natywnym Compaction oraz wykonywaniem w app-serverze.
OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modeli, narzędziami,
akceptacjami, dostarczaniem multimediów oraz widoczną kopią transkryptu.

Harness jest domyślnie wyłączony. Zostaje wybrany tylko wtedy, gdy Plugin `codex` jest
włączony i rozpoznany model to model `codex/*`, albo gdy jawnie wymusisz `embeddedHarness.runtime: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.
Jeśli nigdy nie skonfigurujesz `codex/*`, istniejące uruchomienia PI, OpenAI, Anthropic, Gemini, local
i custom-provider zachowają swoje obecne działanie.

## Wybierz właściwy prefiks modelu

OpenClaw ma osobne ścieżki dla dostępu w stylu OpenAI i Codex:

| Odwołanie do modelu   | Ścieżka środowiska uruchomieniowego       | Użyj, gdy                                                                 |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Dostawca OpenAI przez mechanizmy OpenClaw/PI | Chcesz bezpośredniego dostępu do API platformy OpenAI z użyciem `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Dostawca OpenAI Codex OAuth przez PI      | Chcesz używać OAuth ChatGPT/Codex bez harnessu app-server Codex.          |
| `codex/gpt-5.4`       | Dołączony dostawca Codex oraz harness Codex | Chcesz natywnego wykonywania w app-serverze Codex dla osadzonej tury agenta. |

Harness Codex przejmuje tylko odwołania do modeli `codex/*`. Istniejące odwołania `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local i custom provider zachowują
swoje normalne ścieżki.

## Wymagania

- OpenClaw z dostępnym dołączonym Pluginem `codex`.
- App-server Codex `0.118.0` lub nowszy.
- Uwierzytelnianie Codex dostępne dla procesu app-server.

Plugin blokuje starsze lub nieposiadające wersji handshaki app-servera. Dzięki temu
OpenClaw pozostaje przy powierzchni protokołu, względem której był testowany.

W testach live i smoke w Dockerze uwierzytelnianie zwykle pochodzi z `OPENAI_API_KEY`, a także
opcjonalnych plików CLI Codex, takich jak `~/.codex/auth.json` oraz
`~/.codex/config.toml`. Użyj tych samych materiałów uwierzytelniających, których używa
Twój lokalny app-server Codex.

## Minimalna konfiguracja

Użyj `codex/gpt-5.4`, włącz dołączony Plugin i wymuś harness `codex`:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
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

Ustawienie `agents.defaults.model` lub modelu agenta na `codex/<model>` również
automatycznie włącza dołączony Plugin `codex`. Jawny wpis Pluginu nadal
jest przydatny we współdzielonych konfiguracjach, ponieważ wyraźnie pokazuje zamiar wdrożenia.

## Dodaj Codex bez zastępowania innych modeli

Pozostaw `runtime: "auto"`, jeśli chcesz używać Codex dla modeli `codex/*` i PI dla
wszystkiego innego:

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Przy takiej strukturze:

- `/model codex` lub `/model codex/gpt-5.4` używa harnessu app-server Codex.
- `/model gpt` lub `/model openai/gpt-5.4` używa ścieżki dostawcy OpenAI.
- `/model opus` używa ścieżki dostawcy Anthropic.
- Jeśli zostanie wybrany model inny niż Codex, PI pozostaje harnesssem zgodności.

## Wdrożenia tylko z Codex

Wyłącz awaryjne przełączanie na PI, gdy musisz wykazać, że każda osadzona tura agenta używa
harnessu Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Nadpisanie przez środowisko:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallbacku OpenClaw kończy działanie wcześnie, jeśli Plugin Codex jest wyłączony,
żądany model nie jest odwołaniem `codex/*`, app-server jest zbyt stary albo
app-server nie może się uruchomić.

## Codex dla pojedynczego agenta

Możesz ustawić jednego agenta jako tylko-Codex, podczas gdy agent domyślny zachowa normalny
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
        model: "codex/gpt-5.4",
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
sesję OpenClaw, a harness Codex tworzy lub wznawia swój poboczny wątek app-servera
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta app-server o dostępne modele. Jeśli
wykrywanie się nie powiedzie albo przekroczy limit czasu, używa dołączonego katalogu zapasowego:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

## Połączenie z app-serverem i zasady

Domyślnie Plugin uruchamia Codex lokalnie przez:

```bash
codex app-server --listen stdio://
```

Domyślnie OpenClaw uruchamia lokalne sesje harnessu Codex całkowicie bez ograniczeń:
`approvalPolicy: "never"` oraz `sandbox: "danger-full-access"`. Odpowiada to
postawie zaufanego lokalnego operatora stosowanej przez CLI Codex i pozwala autonomicznym
Heartbeat korzystać z narzędzi sieciowych i powłoki bez czekania na niewidoczną natywną
ścieżkę akceptacji. Możesz zaostrzyć te zasady, na przykład kierując przeglądy
przez guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Dla już uruchomionego app-servera użyj transportu WebSocket:

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

| Pole                | Domyślnie                                | Znaczenie                                                                |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.              |
| `command`           | `"codex"`                                | Plik wykonywalny dla transportu stdio.                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                          |
| `url`               | nieustawione                             | Adres URL app-servera WebSocket.                                         |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                   |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                            |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-servera.              |
| `approvalPolicy`    | `"never"`                                | Natywna zasada akceptacji Codex wysyłana przy starcie/wznowieniu/turze wątku. |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb sandbox Codex wysyłany przy starcie/wznowieniu wątku.       |
| `approvalsReviewer` | `"user"`                                 | Użyj `"guardian_subagent"`, aby guardian Codex przeglądał natywne akceptacje. |
| `serviceTier`       | nieustawione                             | Opcjonalny poziom usługi Codex, na przykład `"priority"`.                |

Starsze zmienne środowiskowe nadal działają jako fallbacki do testów lokalnych, gdy
pasujące pole konfiguracji nie jest ustawione:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Konfiguracja jest preferowana dla powtarzalnych wdrożeń.

## Częste receptury

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

Walidacja harnessu tylko-Codex, z wyłączonym fallbackiem do PI:

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

Akceptacje Codex przeglądane przez guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

Przełączanie modeli pozostaje pod kontrolą OpenClaw. Gdy sesja OpenClaw jest dołączona
do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany
model `codex/*`, dostawcę, zasady akceptacji, sandbox i poziom usługi do
app-servera. Przełączenie z `codex/gpt-5.4` na `codex/gpt-5.2` zachowuje
powiązanie z wątkiem, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane polecenie slash. Jest
generyczne i działa w każdym kanale, który obsługuje polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje aktywne połączenie z app-serverem, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla aktywne modele app-servera Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o wykonanie Compaction dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwera MCP app-servera Codex.
- `/codex skills` wyświetla Skills app-servera Codex.

`/codex resume` zapisuje ten sam poboczny plik powiązania, którego harness używa do
zwykłych tur. W następnej wiadomości OpenClaw wznowi ten wątek Codex, przekaże
aktualnie wybrany model OpenClaw `codex/*` do app-servera i zachowa włączoną
rozszerzoną historię.

Powierzchnia poleceń wymaga app-servera Codex `0.118.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Narzędzia, multimedia i Compaction

Harness Codex zmienia tylko niskopoziomowy wykonawca osadzonego agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
harnessu. Tekst, obrazy, wideo, muzyka, TTS, akceptacje i dane wyjściowe narzędzi
do przesyłania wiadomości nadal przechodzą przez normalną ścieżkę dostarczania OpenClaw.

Gdy wybrany model używa harnessu Codex, natywny Compaction wątku jest
delegowany do app-servera Codex. OpenClaw zachowuje kopię transkryptu dla historii
kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modelu lub harnessu. Ta
kopia obejmuje prompt użytkownika, końcowy tekst asystenta oraz uproszczone rekordy
rozumowania lub planu Codex, gdy app-server je emituje.

Generowanie multimediów nie wymaga PI. Generowanie obrazów, wideo, muzyki, PDF, TTS i
rozumienie multimediów nadal korzystają z odpowiednich ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` oraz
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się w `/model`:** włącz `plugins.entries.codex.enabled`,
ustaw odwołanie do modelu `codex/*` albo sprawdź, czy `plugins.allow` wyklucza `codex`.

**OpenClaw używa PI zamiast Codex:** jeśli żaden harness Codex nie przejmie uruchomienia,
OpenClaw może użyć PI jako backendu zgodności. Ustaw
`embeddedHarness.runtime: "codex"`, aby wymusić wybór Codex podczas testów, albo
`embeddedHarness.fallback: "none"`, aby zakończyć działanie, gdy żaden harness Pluginu nie pasuje. Gdy
app-server Codex zostanie już wybrany, jego błędy są zgłaszane bezpośrednio, bez dodatkowej
konfiguracji fallbacku.

**App-server jest odrzucany:** zaktualizuj Codex, aby handshake app-servera
zgłaszał wersję `0.118.0` lub nowszą.

**Wykrywanie modeli jest wolne:** zmniejsz `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket od razu kończy się niepowodzeniem:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny app-server używa tej samej wersji protokołu app-server Codex.

**Model inny niż Codex używa PI:** to oczekiwane. Harness Codex przejmuje tylko
odwołania do modeli `codex/*`.

## Powiązane

- [Pluginy Harness agenta](/pl/plugins/sdk-agent-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing#live-codex-app-server-harness-smoke)
