---
read_when:
    - Ви хочете використовувати вбудований app-server harness Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід до PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через вбудований app-server harness Codex
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T16:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07e7fb033cd4025e53d65a719bab7bd704335933bf19bfb10648cede42cdee46
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Вбудований plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням потоку, нативним Compaction і виконанням app-server. OpenClaw, як і раніше, керує каналами чату, файлами сесій, вибором моделей, інструментами, погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex також дотримуються спільних хуків plugin, тому shim-и промптів, автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу залишаються узгодженими з harness PI:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Вбудовані plugins також можуть реєструвати фабрику розширення app-server Codex, щоб додавати асинхронне middleware `tool_result`.

Harness вимкнений за замовчуванням. Він вибирається лише тоді, коли plugin `codex` увімкнений і для розв’язаної моделі використовується модель `codex/*`, або коли ви явно примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local і custom-provider зберігають свою поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у стилі OpenAI і Codex:

| Посилання на модель    | Шлях runtime                                 | Використовуйте, коли                                                     |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`       | Провайдер OpenAI через plumbing OpenClaw/PI  | Вам потрібен прямий доступ до API платформи OpenAI через `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Провайдер OpenAI Codex OAuth через PI        | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.           |
| `codex/gpt-5.4`        | Вбудований провайдер Codex плюс harness Codex | Вам потрібне нативне виконання через app-server Codex для вбудованого ходу агента. |

Harness Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання на провайдерів `openai/*`, `openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають свої звичайні шляхи.

Вибір harness не є механізмом керування живою сесією. Коли виконується вбудований хід, OpenClaw записує ідентифікатор вибраного harness у цю сесію і продовжує використовувати його для наступних ходів у межах того самого ідентифікатора сесії. Змінюйте конфігурацію `embeddedHarness` або `OPENCLAW_AGENT_RUNTIME`, якщо хочете, щоб майбутні сесії використовували інший harness; використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної розмови між PI і Codex. Це дає змогу уникнути повторного програвання одного транскрипту через дві несумісні нативні системи сесій.

Застарілі сесії, створені до появи прив’язок harness, вважаються прив’язаними до PI, щойно в них з’являється історія транскрипту. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на Codex після зміни конфігурації.

`/status` показує ефективний не-PI harness поруч із `Fast`, наприклад `Fast · codex`. Стандартний harness PI не показується.

## Вимоги

- OpenClaw із доступним вбудованим plugin `codex`.
- Codex app-server версії `0.118.0` або новішої.
- Доступна автентифікація Codex для процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це гарантує, що OpenClaw працює лише з тією поверхнею протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також за потреби з файлів Codex CLI, таких як `~/.codex/auth.json` і `~/.codex/config.toml`. Використовуйте ті самі автентифікаційні матеріали, які використовує ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `codex/gpt-5.4`, увімкніть вбудований plugin і примусово задайте harness `codex`:

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

Встановлення `agents.defaults.model` або моделі агента в `codex/<model>` також автоматично вмикає вбудований plugin `codex`. Явний запис plugin усе одно корисний у спільних конфігураціях, оскільки він робить намір розгортання очевидним.

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

За такої конфігурації:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервний перехід до PI, якщо вам потрібно довести, що кожен вбудований хід агента використовує harness Codex:

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

Якщо резервний перехід вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо plugin Codex вимкнений, запитувана модель не є посиланням `codex/*`, app-server надто старий або app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити один агент таким, що працює лише з Codex, тоді як агент за замовчуванням зберігатиме звичайний автоматичний вибір:

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

Використовуйте звичайні команди сесій, щоб перемикати агентів і моделі. `/new` створює нову сесію OpenClaw, а harness Codex створює або відновлює свій sidecar app-server thread за потреби. `/reset` очищує прив’язку сесії OpenClaw для цього потоку й дозволяє наступному ходу знову визначити harness із поточної конфігурації.

## Виявлення моделей

За замовчуванням plugin Codex запитує app-server про доступні моделі. Якщо виявлення не вдається або завершується за тайм-аутом, використовується вбудований резервний каталог:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалось опитування Codex і використовувався лише резервний каталог:

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

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, яка використовується для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без зупинки на нативних запитах на погодження, коли нікому на них відповідати.

Щоб увімкнути погодження Codex із перевіркою Guardian, задайте `appServer.mode:
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

Guardian — це нативний рецензент погоджень Codex. Коли Codex просить вийти із sandbox, записати дані поза межами workspace або додати дозволи, наприклад доступ до мережі, Codex спрямовує цей запит на погодження до субагента-рецензента замість запиту людині. Рецензент застосовує рамку оцінки ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, якщо вам потрібні суворіші обмеження, ніж у режимі YOLO, але при цьому агенти мають продовжувати роботу без нагляду.

Пресет `guardian` розгортається у `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики, як і раніше, мають пріоритет над `mode`, тому в розширених розгортаннях можна поєднувати цей пресет з явними налаштуваннями.

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

| Поле                | Типове значення                           | Значення                                                                                                  |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                                | URL app-server WebSocket.                                                                                 |
| `authToken`         | не задано                                | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Тайм-аут для викликів control-plane app-server.                                                           |
| `mode`              | `"yolo"`                                 | Пресет для виконання YOLO або виконання з перевіркою Guardian.                                            |
| `approvalPolicy`    | `"never"`                                | Нативна політика погоджень Codex, що надсилається під час запуску/відновлення потоку та ходу.            |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, що надсилається під час запуску/відновлення потоку.                        |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб перевірку запитів виконував Codex Guardian.                    |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища, як і раніше, працюють як резервні варіанти для локального тестування, якщо відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Конфігурація є кращим варіантом для відтворюваних розгортань, оскільки вона зберігає поведінку plugin у тому самому перевіреному файлі, що й решта налаштувань harness Codex.

## Поширені рецепти

Локальний Codex із типовим транспортом stdio:

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

Перевірка harness лише з Codex із вимкненим резервним переходом до PI:

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

Погодження Codex із перевіркою Guardian:

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

Віддалений app-server із явними заголовками:

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

Перемикання моделей і надалі контролюється OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, під час наступного ходу до app-server знову надсилаються
поточна вибрана модель `codex/*`, провайдер, політика погоджень, sandbox і service tier.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає прив’язку до потоку, але
просить Codex продовжити роботу з новою вибраною моделлю.

## Команда Codex

Вбудований plugin реєструє `/codex` як авторизовану slash-команду. Вона є
універсальною і працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує актуальне підключення до app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і Skills.
- `/codex models` виводить список актуальних моделей app-server Codex.
- `/codex threads [filter]` виводить список недавніх потоків Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного потоку.
- `/codex review` запускає нативну перевірку Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` виводить стан серверів MCP app-server Codex.
- `/codex skills` виводить список Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. Під час наступного повідомлення OpenClaw відновлює цей потік Codex, передає
до app-server поточну вибрану модель OpenClaw `codex/*` і зберігає увімкнену розширену
історію.

Поверхня команд вимагає Codex app-server `0.118.0` або новішої версії. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає такого JSON-RPC-методу.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на погодження інструментів Codex MCP маршрутизуються через потік погоджень plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на уточнення та запити довільного введення, як і раніше, жорстко відхиляються.

Коли вибрана модель використовує harness Codex, нативний Compaction потоку
делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделей або harness. Це
дзеркало містить запит користувача, фінальний текст асистента та полегшені записи
міркувань або плану Codex, коли app-server їх надсилає. Наразі OpenClaw лише
записує сигнали початку та завершення нативного Compaction. Він поки що не
показує придатний для читання людиною підсумок Compaction або аудитний список того,
які саме записи Codex зберіг після Compaction.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа, як і раніше, використовує відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не обробляє цей запуск,
OpenClaw може використовувати PI як backend сумісності. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден harness plugin не підходить.
Щойно app-server Codex буде вибрано, його помилки передаватимуться безпосередньо без додаткової
конфігурації резервного переходу.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей працює повільно:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server підтримує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує PI:** це очікувана поведінка. Harness Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язане

- [Plugins harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
