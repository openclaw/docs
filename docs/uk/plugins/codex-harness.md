---
read_when:
    - Ви хочете використовувати комплектний каркас app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід до Pi для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний каркас app-server Codex
title: Каркас Codex
x-i18n:
    generated_at: "2026-04-23T15:25:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4537cdc043768f19cd097b4542dfb3447bf3342c7c300832e160b795263c2a52
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Каркас Codex

Комплектний Plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через app-server Codex замість вбудованого каркаса PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням потоку, нативним Compaction і виконанням app-server.
OpenClaw і далі керує каналами чату, файлами сесій, вибором моделі, інструментами,
погодженнями, доставкою медіа й видимим дзеркалом транскрипту.

Нативні ходи Codex також враховують спільні хуки Plugin, тому шими промптів,
автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу залишаються узгодженими з каркасом PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Комплектні plugins також можуть реєструвати фабрику розширення app-server Codex, щоб додавати асинхронне middleware `tool_result`.

Каркас вимкнений за замовчуванням. Він вибирається лише тоді, коли Plugin `codex`
увімкнено й визначена модель є моделлю `codex/*`, або коли ви явно примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають свою поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у формі OpenAI і Codex:

| Посилання на модель   | Шлях runtime                                | Використовуйте, коли                                                     |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | Провайдер OpenAI через інфраструктуру OpenClaw/PI | Вам потрібен прямий доступ до API платформи OpenAI з `OPENAI_API_KEY`.   |
| `openai-codex/gpt-5.4` | Провайдер OAuth OpenAI Codex через PI      | Вам потрібен OAuth ChatGPT/Codex без каркаса app-server Codex.           |
| `codex/gpt-5.4`       | Комплектний провайдер Codex плюс каркас Codex | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

Каркас Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або неверсіоновані handshake app-server. Це утримує
OpenClaw у межах поверхні протоколу, з якою його було протестовано.

Для live і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також, за потреби, з файлів CLI Codex, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі автентифікаційні дані, які використовує ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `codex/gpt-5.4`, увімкніть комплектний Plugin і примусово задайте каркас `codex`:

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

Якщо у вашій конфігурації використовується `plugins.allow`, додайте туди також `codex`:

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

Установлення `agents.defaults.model` або моделі агента в `codex/<model>` також
автоматично вмикає комплектний Plugin `codex`. Явний запис Plugin усе ще
корисний у спільних конфігураціях, бо він чітко показує намір розгортання.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*`, а PI — для всього іншого:

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

У такій конфігурації:

- `/model codex` або `/model codex/gpt-5.4` використовує каркас app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається каркасом сумісності.

## Розгортання лише з Codex

Вимкніть резервний перехід до PI, якщо вам потрібно довести, що кожен вбудований хід агента використовує каркас Codex:

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

Перевизначення через змінні середовища:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли fallback вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо Plugin Codex вимкнений,
запитана модель не є посиланням `codex/*`, app-server надто старий або
app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити одного агента лише Codex, тоді як агент за замовчуванням зберігатиме звичайний
автовибір:

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

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює нову
сесію OpenClaw, а каркас Codex створює або відновлює свій sidecar-потік app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку.

## Виявлення моделей

За замовчуванням Plugin Codex запитує в app-server список доступних моделей. Якщо
виявлення завершується помилкою або перевищує час очікування, він використовує комплектний резервний каталог:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалася перевірка Codex і використовувався лише
резервний каталог:

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

## Підключення app-server і політика

За замовчуванням Plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії каркаса Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це поза довіри для локального оператора, який використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних запитах на погодження, коли поруч немає нікого, хто міг би відповісти.

Щоб увімкнути погодження Codex, перевірювані Guardian, задайте `appServer.mode:
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

Guardian — це нативний рецензент погоджень Codex. Коли Codex просить вийти із sandbox, записати поза межами workspace або додати дозволи, як-от доступ до мережі, Codex спрямовує цей запит на погодження до субагента-рецензента замість запиту людині. Рецензент застосовує модель ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, якщо вам потрібно більше захисних обмежень, ніж у режимі YOLO, але водночас потрібно, щоб агенти без нагляду могли просуватися далі.

Пресет `guardian` розгортається до `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики все одно мають пріоритет над `mode`, тож у складніших розгортаннях можна поєднувати пресет із явними виборами.

Для app-server, який уже запущено, використовуйте транспорт WebSocket:

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

| Поле                | Значення за замовчуванням                 | Значення                                                                                                  |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                 | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                                 | URL app-server WebSocket.                                                                                 |
| `authToken`         | не задано                                 | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                      | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                   | Тайм-аут для викликів control plane app-server.                                                           |
| `mode`              | `"yolo"`                                  | Пресет для виконання в режимі YOLO або з погодженнями Guardian.                                           |
| `approvalPolicy`    | `"never"`                                 | Нативна політика погодження Codex, що передається під час старту/відновлення потоку/ходу.                |
| `sandbox`           | `"danger-full-access"`                    | Нативний режим sandbox Codex, що передається під час старту/відновлення потоку.                           |
| `approvalsReviewer` | `"user"`                                  | Використовуйте `"guardian_subagent"`, щоб дозволити Guardian Codex перевіряти запити.                    |
| `serviceTier`       | не задано                                 | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища все ще працюють як fallback для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань бажано використовувати конфігурацію, оскільки вона зберігає поведінку Plugin в тому самому перевіреному файлі, що й решта налаштування каркаса Codex.

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

Перевірка каркаса лише з Codex, з вимкненим fallback до PI:

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

Погодження Codex, перевірювані Guardian:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw прив’язано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточну вибрану модель `codex/*`, провайдера, політику погодження, sandbox і рівень сервісу.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає
прив’язку до потоку, але просить Codex продовжити з нововибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує стан підключення до live app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і skills.
- `/codex models` показує список моделей live app-server Codex.
- `/codex threads [filter]` показує список нещодавніх потоків Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для прив’язаного потоку.
- `/codex review` запускає нативну перевірку Codex для прив’язаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан серверів MCP app-server Codex.
- `/codex skills` показує skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який каркас використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану в OpenClaw модель `codex/*` до app-server і зберігає
увімкнену розширену історію.

Поверхня команд потребує app-server Codex версії `0.118.0` або новішої. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей метод JSON-RPC.

## Інструменти, медіа та Compaction

Каркас Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує динамічні результати інструментів від
каркаса. Текст, зображення, відео, музика, TTS, погодження та вихід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на погодження інструментів MCP Codex спрямовуються через потік погоджень Plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на elicitation і вільне введення все ще завершуються
із закритою відмовою.

Коли вибрана модель використовує каркас Codex, нативний Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або каркаса. Це
дзеркало містить запит користувача, фінальний текст асистента та спрощені записи міркувань або плану Codex, коли app-server їх надсилає. Наразі OpenClaw лише
записує нативні сигнали початку й завершення Compaction. Він поки що не показує
людинозрозумілий підсумок Compaction або аудитний список того, які записи Codex
зберіг після Compaction.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден каркас Codex не обробляє цей запуск,
OpenClaw може використовувати PI як backend сумісності. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб завершуватися з помилкою, коли жоден каркас Plugin не підходить. Щойно буде вибрано app-server Codex, його збої відображатимуться безпосередньо без додаткової конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не-Codex використовує PI:** це очікувано. Каркас Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язані матеріали

- [Plugins каркаса агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
