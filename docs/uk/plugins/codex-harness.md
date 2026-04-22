---
read_when:
    - Ви хочете використовувати комплектний app-server harness Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервне перемикання на PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний app-server harness Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-22T05:35:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45dbd39a7d8ebb3a39d8dca3a5125c07b7168d1658ca07b85792645fb98613c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Комплектний plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням потоку, нативною Compaction і виконанням app-server. OpenClaw, як і раніше, керує чат-каналами, файлами сесії, вибором моделі, інструментами, погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

За замовчуванням harness вимкнений. Він вибирається лише тоді, коли plugin `codex` увімкнено і визначена модель є моделлю `codex/*`, або коли ви явно примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local і custom-provider зберігають поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у форматі OpenAI і Codex:

| Посилання на модель   | Шлях виконання                              | Використовуйте, коли                                                    |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Провайдер OpenAI через інфраструктуру OpenClaw/PI | Вам потрібен прямий доступ до OpenAI Platform API за допомогою `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Провайдер OpenAI Codex OAuth через PI      | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.          |
| `codex/gpt-5.4`       | Комплектний провайдер Codex плюс harness Codex | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

Harness Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання на провайдери `openai/*`, `openai-codex/*`, Anthropic, Gemini, xAI, local і custom зберігають свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним комплектним plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старі або неверсіоновані handshake app-server. Це гарантує, що OpenClaw працює на поверхні протоколу, з якою його було протестовано.

Для live- і Docker-smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також з необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і `~/.codex/config.toml`. Використовуйте ті самі автентифікаційні матеріали, які застосовує ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `codex/gpt-5.4`, увімкніть комплектний plugin і примусово задайте harness `codex`:

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

Якщо ваша конфігурація використовує `plugins.allow`, додайте туди також `codex`:

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

Установлення `agents.defaults.model` або моделі агента в `codex/<model>` також автоматично вмикає комплектний plugin `codex`. Явний запис plugin усе одно корисний у спільних конфігураціях, тому що він робить намір розгортання очевидним.

## Додайте Codex без заміни інших моделей

Залиште `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*`, а PI — для всього іншого:

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

За такої конфігурації:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex-модель, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервний перехід на PI, якщо вам потрібно підтвердити, що кожен вбудований хід агента використовує harness Codex:

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

Перевизначення через середовище:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Якщо резервний перехід вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо plugin Codex вимкнено, запитувана модель не є посиланням `codex/*`, app-server надто старий або app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити один агент лише для Codex, тоді як агент за замовчуванням зберігатиме звичайний автоматичний вибір:

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

Використовуйте звичайні команди сесії для перемикання агентів і моделей. `/new` створює нову сесію OpenClaw, а harness Codex створює або відновлює свій sidecar-потік app-server за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку.

## Виявлення моделей

За замовчуванням plugin Codex запитує app-server про доступні моделі. Якщо виявлення не вдається або завершується за тайм-аутом, він використовує комплектний резервний каталог:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Ви можете налаштувати виявлення в `plugins.entries.codex.config.discovery`:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не було перевірки Codex і використовувався лише резервний каталог:

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

## Підключення до app-server і політика

За замовчуванням plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw просить Codex запитувати нативні погодження. Ви можете додатково налаштувати цю політику, наприклад зробити її суворішою та спрямовувати перевірки через guardian:

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

Для вже запущеного app-server використовуйте транспорт WebSocket:

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

Підтримувані поля `appServer`:

| Поле                | За замовчуванням                           | Значення                                                                 |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                  | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.          |
| `command`           | `"codex"`                                  | Виконуваний файл для транспорту stdio.                                   |
| `args`              | `["app-server", "--listen", "stdio://"]`   | Аргументи для транспорту stdio.                                          |
| `url`               | не задано                                  | URL app-server WebSocket.                                                |
| `authToken`         | не задано                                  | Bearer token для транспорту WebSocket.                                   |
| `headers`           | `{}`                                       | Додаткові заголовки WebSocket.                                           |
| `requestTimeoutMs`  | `60000`                                    | Тайм-аут для викликів control plane app-server.                          |
| `approvalPolicy`    | `"on-request"`                             | Нативна політика погодження Codex, що надсилається під час start/resume/turn потоку. |
| `sandbox`           | `"workspace-write"`                        | Нативний режим sandbox Codex, що надсилається під час start/resume потоку. |
| `approvalsReviewer` | `"user"`                                   | Використовуйте `"guardian_subagent"`, щоб дозволити guardian Codex перевіряти нативні погодження. |
| `serviceTier`       | не задано                                  | Необов’язковий рівень сервісу Codex, наприклад `"priority"`.             |

Старі змінні середовища все ще працюють як резервний варіант для локального тестування, коли відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Для відтворюваних розгортань перевага надається конфігурації.

## Поширені рецепти

Локальний Codex із транспортом stdio за замовчуванням:

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

Перевірка harness лише з Codex, із вимкненим резервним переходом на PI:

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

Погодження Codex, перевірені guardian:

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

Віддалений app-server з явними заголовками:

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

Перемикання моделей залишається під контролем OpenClaw. Коли сесію OpenClaw приєднано до наявного потоку Codex, наступний хід знову надсилає в app-server поточно вибрану модель `codex/*`, провайдера, політику погодження, sandbox і рівень сервісу. Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає прив’язку до потоку, але просить Codex продовжити роботу з нововибраною моделлю.

## Команда Codex

Комплектний plugin реєструє `/codex` як авторизовану slash-команду. Вона універсальна й працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує живе підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та Skills.
- `/codex models` перелічує живі моделі app-server Codex.
- `/codex threads [filter]` перелічує нещодавні потоки Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного потоку.
- `/codex review` запускає нативну перевірку Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` перелічує стан MCP-серверів app-server Codex.
- `/codex skills` перелічує Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає в app-server поточну вибрану модель OpenClaw `codex/*` і зберігає розширену історію увімкненою.

Поверхня команд вимагає Codex app-server `0.118.0` або новішої версії. Окремі методи керування позначаються як `unsupported by this Codex app-server`, якщо майбутній або custom app-server не надає цей JSON-RPC-метод.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів від harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів обміну повідомленнями продовжують проходити через звичайний шлях доставки OpenClaw.

Коли вибрана модель використовує harness Codex, нативна Compaction потоку делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало містить запит користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex, коли app-server їх надсилає.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і розуміння медіа й надалі використовують відповідні налаштування провайдера/моделі, такі як `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і `messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`, задайте посилання на модель `codex/*` або перевірте, чи не виключає `plugins.allow` значення `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не обробляє запуск, OpenClaw може використовувати PI як backend сумісності. Установіть `embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або `embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден plugin harness не підходить. Щойно вибрано app-server Codex, його збої відображаються безпосередньо без додаткового налаштування резервного переходу.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs` або вимкніть виявлення.

**Транспорт WebSocket відразу завершується помилкою:** перевірте `appServer.url`, `authToken` і що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Не-Codex-модель використовує PI:** це очікувана поведінка. Harness Codex обробляє лише посилання на моделі `codex/*`.

## Пов’язане

- [Plugins Harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
