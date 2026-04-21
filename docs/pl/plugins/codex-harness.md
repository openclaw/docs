---
read_when:
    - Chcesz użyć bundlowanej uprzęży app-server Codex
    - Potrzebujesz odwołań do modeli Codex i przykładów konfiguracji
    - Chcesz wyłączyć zapasowy Pi dla wdrożeń tylko z Codex
summary: Uruchamianie tur osadzonego agenta OpenClaw przez bundlowaną uprząż app-server Codex
title: Codex Harness
x-i18n:
    generated_at: "2026-04-21T09:56:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Bundlowany plugin `codex` pozwala OpenClaw uruchamiać tury osadzonego agenta przez
app-server Codex zamiast przez wbudowaną uprząż Pi.

Użyj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta: wykrywaniem
modeli, natywnym wznawianiem wątków, natywnym Compaction i wykonaniem app-server.
OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modeli, narzędziami,
zatwierdzeniami, dostarczaniem mediów i widoczną lustrzaną kopią transkrypcji.

Uprząż jest domyślnie wyłączona. Jest wybierana tylko wtedy, gdy plugin `codex` jest
włączony, a rozpoznany model to model `codex/*`, albo gdy jawnie wymusisz
`embeddedHarness.runtime: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.
Jeśli nigdy nie skonfigurujesz `codex/*`, istniejące uruchomienia Pi, OpenAI, Anthropic, Gemini, local
i custom-provider zachowają swoje obecne działanie.

## Wybierz właściwy prefiks modelu

OpenClaw ma oddzielne ścieżki dla dostępu w kształcie OpenAI i Codex:

| Model ref              | Ścieżka runtime                              | Użyj, gdy                                                               |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | Dostawca OpenAI przez warstwę OpenClaw/Pi    | Chcesz bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Dostawca OAuth OpenAI Codex przez Pi         | Chcesz używać OAuth ChatGPT/Codex bez uprzęży app-server Codex.         |
| `codex/gpt-5.4`        | Bundlowany dostawca Codex oraz Codex Harness | Chcesz natywnego wykonania app-server Codex dla tury osadzonego agenta. |

Codex Harness przejmuje tylko odwołania do modeli `codex/*`. Istniejące odwołania `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local i custom provider zachowują
swoje normalne ścieżki.

## Wymagania

- OpenClaw z dostępnym bundlowanym pluginem `codex`.
- App-server Codex `0.118.0` lub nowszy.
- Uwierzytelnianie Codex dostępne dla procesu app-server.

Plugin blokuje starsze lub niewersjonowane handshaki app-server. Dzięki temu
OpenClaw pozostaje przy powierzchni protokołu, względem której został przetestowany.

W testach smoke live i Docker uwierzytelnianie zwykle pochodzi z `OPENAI_API_KEY`, plus
opcjonalne pliki CLI Codex, takie jak `~/.codex/auth.json` i
`~/.codex/config.toml`. Użyj tego samego materiału uwierzytelniającego, którego używa
twój lokalny app-server Codex.

## Minimalna konfiguracja

Użyj `codex/gpt-5.4`, włącz bundlowany plugin i wymuś uprząż `codex`:

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

Jeśli konfiguracja używa `plugins.allow`, uwzględnij tam również `codex`:

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

Ustawienie `agents.defaults.model` lub modelu agenta na `codex/<model>` także
automatycznie włącza bundlowany plugin `codex`. Jawny wpis pluginu nadal jest
przydatny we współdzielonych konfiguracjach, ponieważ jasno wskazuje intencję wdrożenia.

## Dodaj Codex bez zastępowania innych modeli

Zachowaj `runtime: "auto"`, gdy chcesz używać Codex dla modeli `codex/*` oraz Pi dla
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

Przy takim kształcie:

- `/model codex` lub `/model codex/gpt-5.4` używa uprzęży app-server Codex.
- `/model gpt` lub `/model openai/gpt-5.4` używa ścieżki dostawcy OpenAI.
- `/model opus` używa ścieżki dostawcy Anthropic.
- Jeśli wybrany zostanie model inny niż Codex, Pi pozostaje uprzężą zgodności.

## Wdrożenia tylko z Codex

Wyłącz zapasowy Pi, jeśli chcesz mieć pewność, że każda tura osadzonego agenta używa
Codex Harness:

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

Nadpisanie środowiskowe:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallback OpenClaw kończy się błędem wcześnie, jeśli plugin Codex jest wyłączony,
żądany model nie jest odwołaniem `codex/*`, app-server jest zbyt stary albo
app-server nie może się uruchomić.

## Codex per agent

Możesz ustawić jednego agenta jako wyłącznie Codex, podczas gdy agent domyślny zachowa normalny
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

Używaj normalnych poleceń sesji do przełączania agentów i modeli. `/new` tworzy świeżą
sesję OpenClaw, a Codex Harness tworzy lub wznawia swój boczny wątek app-server
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku.

## Wykrywanie modeli

Domyślnie plugin Codex pyta app-server o dostępne modele. Jeśli
wykrywanie nie powiedzie się lub przekroczy limit czasu, używa bundlowanego katalogu zapasowego:

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

Wyłącz wykrywanie, jeśli chcesz, aby start unikał sondowania Codex i trzymał się
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

## Połączenie app-server i polityka

Domyślnie plugin uruchamia Codex lokalnie przez:

```bash
codex app-server --listen stdio://
```

Domyślnie OpenClaw prosi Codex o żądanie natywnych zatwierdzeń. Tę
politykę można dalej dostroić, na przykład zaostrzyć ją i kierować przeglądy przez
guardian:

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

| Field               | Default                                  | Znaczenie                                                               |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.             |
| `command`           | `"codex"`                                | Plik wykonywalny dla transportu stdio.                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                         |
| `url`               | unset                                    | Adres URL WebSocket app-server.                                         |
| `authToken`         | unset                                    | Token Bearer dla transportu WebSocket.                                  |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                           |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-server.              |
| `approvalPolicy`    | `"on-request"`                           | Natywna polityka zatwierdzeń Codex wysyłana przy starcie/wznowieniu/turze wątku. |
| `sandbox`           | `"workspace-write"`                      | Natywny tryb sandbox Codex wysyłany przy starcie/wznowieniu wątku.      |
| `approvalsReviewer` | `"user"`                                 | Użyj `"guardian_subagent"`, aby guardian Codex przeglądał natywne zatwierdzenia. |
| `serviceTier`       | unset                                    | Opcjonalna warstwa usług Codex, na przykład `"priority"`.               |

Starsze zmienne środowiskowe nadal działają jako wartości zapasowe dla testów lokalnych, gdy
pasujące pole konfiguracji nie jest ustawione:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Konfiguracja jest preferowana dla powtarzalnych wdrożeń.

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

Walidacja uprzęży tylko Codex, z wyłączonym zapasowym Pi:

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

Zatwierdzenia Codex przeglądane przez guardian:

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

Przełączanie modeli pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw jest dołączona
do istniejącego wątku Codex, następna tura ponownie wysyła obecnie wybrane
`codex/*` model, dostawcę, politykę zatwierdzeń, sandbox i warstwę usług do
app-server. Przełączenie z `codex/gpt-5.4` na `codex/gpt-5.2` zachowuje
powiązanie wątku, ale prosi Codex o kontynuację z nowo wybranym modelem.

## Polecenie Codex

Bundlowany plugin rejestruje `/codex` jako autoryzowane polecenie slash. Jest
ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje bieżącą łączność app-server, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla bieżące modele app-server Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o wykonanie Compaction dołączonego wątku.
- `/codex review` uruchamia natywny przegląd Codex dla dołączonego wątku.
- `/codex account` pokazuje status konta i limitów szybkości.
- `/codex mcp` wyświetla status serwera MCP app-server Codex.
- `/codex skills` wyświetla Skills app-server Codex.

`/codex resume` zapisuje ten sam plik powiązania sidecar, którego uprząż używa w
zwykłych turach. Przy następnej wiadomości OpenClaw wznowi ten wątek Codex, przekaże
aktualnie wybrany model OpenClaw `codex/*` do app-server i zachowa włączoną
rozszerzoną historię.

Powierzchnia poleceń wymaga app-server Codex `0.118.0` lub nowszego. Poszczególne
metody sterujące są raportowane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Narzędzia, media i Compaction

Codex Harness zmienia tylko niskopoziomowy executor osadzonego agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
uprzęży. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i wyjście narzędzi do wiadomości
nadal przechodzą przez zwykłą ścieżkę dostarczania OpenClaw.

Gdy wybrany model używa Codex Harness, natywny Compaction wątku jest delegowany do
app-server Codex. OpenClaw zachowuje lustrzaną kopię transkrypcji na potrzeby historii kanału,
wyszukiwania, `/new`, `/reset` i przyszłego przełączania modelu lub uprzęży. Ta
kopia obejmuje prompt użytkownika, końcowy tekst asystenta oraz lekkie rekordy
rozumowania lub planu Codex, gdy app-server je emituje.

Generowanie mediów nie wymaga Pi. Generowanie obrazów, wideo, muzyki, PDF, TTS oraz
rozumienie mediów nadal używa pasujących ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się w `/model`:** włącz `plugins.entries.codex.enabled`,
ustaw odwołanie do modelu `codex/*` albo sprawdź, czy `plugins.allow` wyklucza `codex`.

**OpenClaw wraca do Pi:** ustaw `embeddedHarness.fallback: "none"` lub
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` podczas testów.

**App-server jest odrzucany:** zaktualizuj Codex, aby handshake app-server
raportował wersję `0.118.0` lub nowszą.

**Wykrywanie modeli jest wolne:** obniż `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket od razu się nie udaje:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny app-server mówi w tej samej wersji protokołu app-server Codex.

**Model inny niż Codex używa Pi:** to jest oczekiwane. Codex Harness przejmuje tylko
odwołania do modeli `codex/*`.

## Powiązane

- [Pluginy Agent Harness](/pl/plugins/sdk-agent-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Referencja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing#live-codex-app-server-harness-smoke)
