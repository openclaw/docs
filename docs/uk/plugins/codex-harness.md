---
read_when:
    - Ви хочете використовувати вбудований app-server harness Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід на Pi для розгортань лише з Codex
summary: Запускати ходи вбудованого агента OpenClaw через вбудований app-server harness Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T07:26:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Вбудований plugin `codex` дає змогу OpenClaw виконувати ходи вбудованого агента через
app-server Codex замість вбудованого harness Pi.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням thread, нативним Compaction і виконанням через app-server.
OpenClaw, як і раніше, керує каналами чату, файлами сесій, вибором моделей, інструментами,
підтвердженнями, доставкою медіа та видимим дзеркалом стенограми.

Нативні ходи Codex також дотримуються спільних хуків plugin, тому shims prompt, автоматизація
з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу залишаються
узгодженими з harness Pi:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Вбудовані plugins також можуть реєструвати фабрику розширення app-server Codex, щоб додавати
асинхронне middleware `tool_result`.

Цей harness вимкнено за замовчуванням. Він вибирається лише тоді, коли plugin `codex`
увімкнено і визначена модель є моделлю `codex/*`, або коли ви явно примусово задаєте
`embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запускі Pi, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають свою поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у стилі OpenAI і Codex:

| Посилання на модель   | Шлях runtime                                | Коли використовувати                                                      |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Провайдер OpenAI через інфраструктуру OpenClaw/Pi | Вам потрібен прямий доступ до OpenAI Platform API через `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Провайдер OAuth OpenAI Codex через Pi      | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.            |
| `codex/gpt-5.4`       | Вбудований провайдер Codex плюс harness Codex | Вам потрібне нативне виконання через app-server Codex для ходу вбудованого агента. |

Harness Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним вбудованим plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Доступна автентифікація Codex для процесу app-server.

Plugin блокує handshake app-server старіших версій або без версії. Це гарантує, що
OpenClaw працює на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить через `OPENAI_API_KEY`, а також,
за потреби, через файли CLI Codex, як-от `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний app-server Codex.

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

Установлення `agents.defaults.model` або моделі агента у `codex/<model>` також
автоматично вмикає вбудований plugin `codex`. Явний запис plugin усе одно
корисний у спільних конфігураціях, оскільки робить намір розгортання очевидним.

## Додати Codex без заміни інших моделей

Залиште `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*`, а Pi — для
всього іншого:

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

За такої форми:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано модель не Codex, Pi залишається compatibility harness.

## Розгортання лише з Codex

Вимкніть резервний перехід на Pi, якщо потрібно гарантувати, що кожен хід вбудованого агента використовує
harness Codex:

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

Якщо резервний перехід вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо plugin Codex вимкнено,
потрібна модель не є посиланням `codex/*`, app-server надто старий або
app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити один агент лише Codex, залишивши для типового агента звичайний
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
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar thread app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього thread.

## Виявлення моделей

За замовчуванням plugin Codex запитує в app-server доступні моделі. Якщо
виявлення не вдається або перевищує час очікування, використовується вбудований резервний каталог:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалося зондування Codex і використовувався
лише резервний каталог:

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

За замовчуванням plugin локально запускає Codex так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, що використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних запитах підтвердження, на які нікому відповісти.

Щоб увімкнути підтвердження Codex із перевіркою Guardian, задайте `appServer.mode:
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

Режим Guardian розгортається в:

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

Guardian — це нативний рецензент підтверджень Codex. Коли Codex просить вийти за межі
sandbox, записати за межі workspace або додати дозволи, як-от доступ до мережі,
Codex спрямовує цей запит на підтвердження рецензенту-підагенту замість людини. Рецензент
збирає контекст і застосовує модель оцінки ризику Codex, а потім
підтверджує або відхиляє конкретний запит. Guardian корисний, коли вам потрібно більше
запобіжників, ніж у режимі YOLO, але водночас потрібні автономні агенти й Heartbeat, щоб просуватися далі.

Docker live harness включає перевірку Guardian, якщо
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Він запускає harness Codex у
режимі Guardian, перевіряє, що безпечну shell-команду з підвищенням привілеїв підтверджено, і
перевіряє, що надсилання фальшивого секрету до недовіреного зовнішнього призначення відхилено,
щоб агент повторно попросив явне підтвердження.

Окремі поля політики, як і раніше, мають вищий пріоритет за `mode`, тому просунуті розгортання можуть
поєднувати цей пресет із явними значеннями.

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

| Поле                | За замовчуванням                           | Значення                                                                                                    |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                             |
| `command`           | `"codex"`                                 | Виконуваний файл для транспорту stdio.                                                                      |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Аргументи для транспорту stdio.                                                                             |
| `url`               | не задано                                 | URL WebSocket app-server.                                                                                   |
| `authToken`         | не задано                                 | Bearer-токен для транспорту WebSocket.                                                                      |
| `headers`           | `{}`                                      | Додаткові заголовки WebSocket.                                                                              |
| `requestTimeoutMs`  | `60000`                                   | Час очікування для викликів control-plane app-server.                                                       |
| `mode`              | `"yolo"`                                  | Пресет для режиму YOLO або виконання з перевіркою Guardian.                                                 |
| `approvalPolicy`    | `"never"`                                 | Нативна політика підтвердження Codex, що передається під час запуску/відновлення thread і ходу.            |
| `sandbox`           | `"danger-full-access"`                    | Нативний режим sandbox Codex, що передається під час запуску/відновлення thread.                           |
| `approvalsReviewer` | `"user"`                                  | Використовуйте `"guardian_subagent"`, щоб підтвердження перевіряв Codex Guardian.                           |
| `serviceTier`       | не задано                                 | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища все ще працюють як резервні значення для локального тестування, коли
відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є кращим варіантом для відтворюваних розгортань, оскільки зберігає поведінку plugin в тому
самому перевіреному файлі, що й решту налаштувань harness Codex.

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

Перевірка harness лише з Codex, із вимкненим резервним переходом на Pi:

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

Підтвердження Codex із перевіркою Guardian:

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

Перемикання моделей залишається під керуванням OpenClaw. Коли сесію OpenClaw приєднано
до наявного thread Codex, наступний хід знову надсилає до
app-server поточні вибрані `codex/*` модель, провайдера, політику підтвердження, sandbox і рівень сервісу.
Перемикання з `codex/gpt-5.4` на `codex/gpt-5.2` зберігає прив’язку thread, але просить Codex
продовжити роботу з новою вибраною моделлю.

## Команда Codex

Вбудований plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує активне підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та skills.
- `/codex models` показує активні моделі app-server Codex.
- `/codex threads [filter]` показує нещодавні threads Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного thread.
- `/codex review` запускає нативний review Codex для приєднаного thread.
- `/codex account` показує обліковий запис і стан лімітів швидкості.
- `/codex mcp` показує стан MCP-серверів app-server Codex.
- `/codex skills` показує skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану модель OpenClaw `codex/*` до app-server і залишає
розширену історію ввімкненою.

Поверхня команд вимагає app-server Codex версії `0.118.0` або новішої. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або custom app-server не надає цього JSON-RPC-методу.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, підтвердження та вивід інструментів обміну повідомленнями
і далі проходять звичайним шляхом доставки OpenClaw.

Запити на підтвердження інструментів Codex MCP маршрутизуються через потік
підтвердження plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на elicitation і запити довільного введення, як і раніше, закриваються з відмовою.

Коли вибрана модель використовує harness Codex, нативний Compaction thread
делегується app-server Codex. OpenClaw зберігає дзеркало стенограми для історії каналів,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
включає prompt користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex, якщо app-server їх надсилає. Наразі OpenClaw лише записує сигнали початку й завершення нативного Compaction. Він ще не показує
людинозрозуміле зведення Compaction або придатний до аудиту список того, які записи Codex
зберіг після Compaction.

Генерація медіа не потребує Pi. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує Pi замість Codex:** якщо жоден harness Codex не обробляє запуск,
OpenClaw може використовувати Pi як сумісний бекенд. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден harness plugin не підходить. Щойно
буде вибрано app-server Codex, його помилки відображатимуться безпосередньо без додаткової
конфігурації резервного переходу.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не Codex використовує Pi:** це очікувана поведінка. Harness Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язане

- [Plugins harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
