---
read_when:
    - Ви хочете використовувати комплектний harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервне перемикання на Pi для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T20:05:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 323ee3e0f4b78017e325288247c025403fc55216059a71e2596acdaaf56e7b25
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Комплектний Plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через app-server Codex замість вбудованого harness Pi.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням потоку, нативним Compaction і виконанням app-server.
OpenClaw і далі керує чат-каналами, файлами сесій, вибором моделей, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex також враховують спільні хуки Plugin, тож шими запитів,
автоматизація з урахуванням Compaction, middleware інструментів і спостерігачі життєвого циклу залишаються узгодженими з harness Pi:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Комплектні Plugin також можуть реєструвати фабрику розширення app-server Codex, щоб додавати асинхронне middleware `tool_result`.

Harness вимкнено за замовчуванням. У нових конфігураціях слід залишати посилання на моделі OpenAI канонічними у вигляді `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли потрібне нативне виконання app-server. Застарілі посилання на моделі `codex/*` і далі автоматично вибирають harness для сумісності.

## Виберіть правильний префікс моделі

Тепер OpenClaw зберігає канонічні посилання на моделі OpenAI GPT як `openai/*`:

| Посилання на модель                                  | Шлях runtime                                | Використовуйте, коли                                                      |
| ---------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.5`                                     | Провайдер OpenAI через внутрішню логіку OpenClaw/Pi | Вам потрібен прямий доступ до OpenAI Platform API за допомогою `OPENAI_API_KEY`. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness app-server Codex                    | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

Застарілі посилання `openai-codex/gpt-*` і `codex/gpt-*` залишаються підтримуваними як псевдоніми сумісності, але в новій документації та прикладах конфігурації слід використовувати `openai/gpt-*`.

Вибір harness не є елементом керування живою сесією. Коли виконується вбудований хід,
OpenClaw записує ідентифікатор вибраного harness у цю сесію і продовжує використовувати його для наступних ходів у межах того самого ідентифікатора сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між Pi і Codex. Це дає змогу уникнути повторного відтворення одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до закріплення harness, вважаються закріпленими за Pi, щойно в них з’являється історія транскрипту. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на Codex після зміни конфігурації.

`/status` показує ефективний harness, відмінний від Pi, поруч із `Fast`, наприклад
`Fast · codex`. Harness Pi за замовчуванням не показується.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- app-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або неверсійовані handshake app-server. Це гарантує, що
OpenClaw працює з тією поверхнею протоколу, щодо якої його було протестовано.

Для live- і Docker-smoke-тестів автентифікація зазвичай надходить з `OPENAI_API_KEY`, а також з необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть комплектний Plugin і примусово задайте harness `codex`:

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

Застарілі конфігурації, які задають `agents.defaults.model` або модель агента як
`codex/<model>`, і далі автоматично вмикають комплектний Plugin `codex`. У нових конфігураціях слід віддавати перевагу `openai/<model>` разом із явним записом `embeddedHarness` вище.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а Pi — для всього іншого. Для нових конфігурацій надавайте перевагу явному `runtime: "codex"` для агентів, які мають використовувати harness.

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

За такої структури:

- `/model gpt` або `/model openai/gpt-5.5` використовує harness app-server Codex для цієї конфігурації.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, Pi залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервне перемикання на Pi, коли потрібно довести, що кожен вбудований хід агента використовує harness Codex:

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

Перевизначення через середовище:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли резервне перемикання вимкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server надто старий або app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити одного агента лише-Codex, тоді як агент за замовчуванням зберігатиме звичайний
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

Використовуйте звичайні команди сесії для перемикання агентів і моделей. `/new` створює нову
сесію OpenClaw, а harness Codex створює або відновлює свій sidecar-потік app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку
і дає змогу наступному ходу знову визначити harness із поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує в app-server доступні моделі. Якщо
виявлення не вдається або завершується за тайм-аутом, він використовує комплектний резервний каталог для:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалося опитування Codex і використовувався лише резервний каталог:

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

За замовчуванням Plugin локально запускає Codex так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, що використовується
для автономних Heartbeat: Codex може використовувати shell та мережеві інструменти, не зупиняючись на нативних запитах на погодження, на які нікому відповідати.

Щоб увімкнути погодження Codex, які перевіряє guardian, задайте `appServer.mode:
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

Guardian — це нативний рецензент погоджень Codex. Коли Codex просить вийти за межі sandbox, записати за межами workspace або додати дозволи, як-от мережевий доступ, Codex спрямовує цей запит на погодження до субагента-рецензента, а не до людини через запит. Рецензент застосовує ризикову модель Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, коли вам потрібні суворіші запобіжники, ніж у режимі YOLO, але при цьому агенти мають і далі просуватися без нагляду.

Набір `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики, як і раніше, мають пріоритет над `mode`, тож у розширених розгортаннях можна поєднувати цей набір із явними виборами.

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

| Поле                | За замовчуванням                          | Значення                                                                                                  |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не задано                                | URL app-server WebSocket.                                                                                 |
| `authToken`         | не задано                                | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Тайм-аут для викликів control-plane app-server.                                                           |
| `mode`              | `"yolo"`                                 | Набір для YOLO або виконання з погодженням, що перевіряється guardian.                                    |
| `approvalPolicy`    | `"never"`                                | Нативна політика погодження Codex, що надсилається під час старту/відновлення потоку/ходу.               |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, що надсилається під час старту/відновлення потоку.                          |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб Guardian Codex перевіряв запити.                                |
| `serviceTier`       | не задано                                | Необов’язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища, як і раніше, працюють як резервні варіанти для локального тестування, коли відповідне поле конфігурації не задано:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань перевага надається конфігурації, оскільки вона зберігає поведінку Plugin
в тому самому перевіреному файлі, що й решта налаштування harness Codex.

## Поширені рецепти

Локальний Codex зі стандартним транспортом stdio:

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

Перевірка harness лише-Codex, із вимкненим резервним перемиканням на Pi:

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

Погодження Codex, перевірені Guardian:

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

Перемикання моделей і далі контролюється OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточно вибрану модель OpenAI, провайдера, політику погодження, sandbox і рівень сервісу.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язку до потоку, але просить Codex продовжити з нововибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
універсальною і працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує стан живого підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та skills.
- `/codex models` показує список живих моделей app-server Codex.
- `/codex threads [filter]` показує список нещодавніх потоків Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати Compaction для приєднаного потоку.
- `/codex review` запускає нативний перегляд Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує список станів MCP-серверів app-server Codex.
- `/codex skills` показує список skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw `codex/*` до app-server і зберігає
увімкнену розширену історію.

Поверхня команд вимагає app-server Codex версії `0.118.0` або новішої. Про окремі
методи керування повідомляється як `unsupported by this Codex app-server`, якщо
майбутній або користувацький app-server не надає цей метод JSON-RPC.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вихід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Запити погодження інструментів MCP Codex маршрутизуються через потік погодження Plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`; інші запити на підтвердження й запити довільного вводу, як і раніше, відхиляються безумовно.

Коли вибрана модель використовує harness Codex, нативний Compaction потоку делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
містить запит користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex, коли app-server їх надсилає. Наразі OpenClaw записує лише нативні сигнали початку та завершення Compaction. Він ще не показує
людинозрозумілий підсумок Compaction або придатний до аудиту список того, які записи Codex
залишив після Compaction.

Генерація медіа не потребує Pi. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа і далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
задайте посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує Pi замість Codex:** якщо жоден harness Codex не бере на себе виконання,
OpenClaw може використовувати Pi як backend сумісності. Задайте
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден Plugin harness не підходить. Щойно app-server Codex вибрано, його збої проявляються безпосередньо без додаткової конфігурації резервного перемикання.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв про версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується з помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Модель не-Codex використовує Pi:** це очікувана поведінка. Harness Codex бере на себе
лише посилання на моделі `codex/*`.

## Пов’язане

- [Plugins Harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
