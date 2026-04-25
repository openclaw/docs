---
read_when:
    - Ви хочете використовувати комплектний harness app-server Codex
    - Вам потрібні приклади конфігурації harness Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість переходу до PI резервно
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний harness app-server Codex
title: harness Codex
x-i18n:
    generated_at: "2026-04-25T03:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67f1bc703e8e45c60f7062f00cd1d68fde146785db649709e9eddce48d0a9941
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектний Plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
Codex app-server замість вбудованого harness Pi.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням thread, нативною Compaction та виконанням через app-server.
OpenClaw, як і раніше, керує каналами чату, файлами сесій, вибором моделі, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Якщо ви намагаєтеся зорієнтуватися, почніть із
[Середовища виконання агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — це середовище виконання, а Telegram,
Discord, Slack або інший канал лишається поверхнею комунікації.

Нативні ходи Codex зберігають хуки Plugin OpenClaw як публічний шар сумісності.
Це внутрішньопроцесні хуки OpenClaw, а не командні хуки Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `agent_end`

Plugins також можуть реєструвати нейтральне до середовища виконання middleware результатів інструментів, щоб переписувати
динамічні результати інструментів OpenClaw після того, як OpenClaw виконає інструмент, і до того,
як результат буде повернено до Codex. Це окремо від публічного
хука Plugin `tool_result_persist`, який перетворює записи результатів інструментів
у транскрипті, якими володіє OpenClaw.

Щодо семантики самих хуків Plugin дивіться [Хуки Plugin](/uk/plugins/hooks)
і [Поведінка guard Plugin](/uk/tools/plugin).

За замовчуванням harness вимкнено. У нових конфігураціях слід залишати посилання на моделі OpenAI
канонічними як `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли вони
хочуть нативне виконання через app-server. Застарілі посилання на моделі `codex/*` і далі автоматично вибирають
harness для сумісності, але застарілі префікси провайдерів, підкріплені середовищем виконання, не
показуються як звичайні варіанти моделі/провайдера.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, коли вам потрібна
автентифікація Codex OAuth через Pi; використовуйте `openai/*`, коли вам потрібен прямий доступ до OpenAI API або
коли ви примусово використовуєте нативний harness Codex app-server:

| Model ref                                             | Шлях середовища виконання                     | Використовуйте, коли                                                        |
| ----------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Провайдер OpenAI через внутрішню логіку OpenClaw/Pi | Вам потрібен поточний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OpenAI Codex OAuth через OpenClaw/Pi         | Вам потрібна автентифікація за підпискою ChatGPT/Codex з типовим runner Pi. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness Codex app-server                     | Вам потрібне нативне виконання через Codex app-server для вбудованого ходу агента.   |

GPT-5.5 наразі в OpenClaw доступний лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для OAuth через Pi або `openai/gpt-5.5` разом із harness Codex
app-server. Прямий доступ за API key для `openai/gpt-5.5` підтримується,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і далі приймаються як псевдоніми сумісності. Doctor
під час міграції сумісності переписує застарілі основні посилання середовища виконання на канонічні посилання моделей
і записує політику середовища виконання окремо, тоді як застарілі посилання лише для fallback
лишаються без змін, оскільки середовище виконання налаштовується для всього контейнера агента.
У нових конфігураціях Pi Codex OAuth слід використовувати `openai-codex/gpt-*`; у нових нативних
конфігураціях harness app-server слід використовувати `openai/gpt-*` разом із
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` дотримується того самого поділу префіксів. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має працювати через шлях провайдера OpenAI
Codex OAuth. Використовуйте `codex/gpt-*`, коли розуміння зображень має працювати
через обмежений хід Codex app-server. Модель Codex app-server повинна
оголошувати підтримку вхідних зображень; текстові моделі Codex завершуються помилкою до того, як
почнеться хід із медіа.

Використовуйте `/status`, щоб підтвердити фактичний harness для поточної сесії. Якщо
вибір видається неочікуваним, увімкніть журналювання налагодження для підсистеми `agents/harness`
і перевірте структурований запис gateway `agent harness selected`. Він
містить ідентифікатор вибраного harness, причину вибору, політику runtime/fallback і,
у режимі `auto`, результат підтримки для кожного кандидата Plugin.

Вибір harness не є механізмом керування живою сесією. Коли виконується вбудований хід,
OpenClaw записує ідентифікатор вибраного harness у цій сесії й продовжує використовувати його для
наступних ходів у межах того самого ідентифікатора сесії. Змініть конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, якщо хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між Pi і Codex. Це запобігає повторному програванню одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до закріплення harness, вважаються прив’язаними до Pi, щойно вони
мають історію транскрипту. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на
Codex після зміни конфігурації.

`/status` показує фактичне середовище виконання моделі. Типовий harness Pi відображається як
`Runtime: OpenClaw Pi Default`, а harness Codex app-server відображається як
`Runtime: OpenAI Codex`.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Доступна автентифікація Codex для процесу app-server.

Plugin блокує старіші або неверсіоновані handshake app-server. Це дозволяє
OpenClaw залишатися в межах поверхні протоколу, з якою його було протестовано.

Для живих і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
з необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте той самий матеріал автентифікації, який використовує ваш локальний
Codex app-server.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть комплектний Plugin і примусово вкажіть harness `codex`:

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

Застарілі конфігурації, які встановлюють `agents.defaults.model` або модель агента в
`codex/<model>`, і далі автоматично вмикають комплектний Plugin `codex`. У нових конфігураціях слід
надавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додайте Codex поряд з іншими моделями

Не встановлюйте `runtime: "codex"` глобально, якщо той самий агент має вільно перемикатися
між Codex і моделями інших провайдерів. Примусове середовище виконання застосовується до кожного
вбудованого ходу для цього агента або сесії. Якщо ви виберете модель Anthropic, поки це
середовище виконання примусово задано, OpenClaw однаково спробує harness Codex і завершиться помилкою
замість того, щоб непомітно спрямувати цей хід через Pi.

Натомість використовуйте одну з таких форм:

- Розмістіть Codex в окремому агенті з `embeddedHarness.runtime: "codex"`.
- Залиште для типового агента `runtime: "auto"` і fallback до Pi для звичайного змішаного
  використання провайдерів.
- Використовуйте застарілі посилання `codex/*` лише для сумісності. У нових конфігураціях слід надавати перевагу
  `openai/*` разом з явною політикою runtime Codex.

Наприклад, це залишає типовий агент на звичайному автоматичному виборі й
додає окремого агента Codex:

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
        },
      },
    ],
  },
}
```

За такої форми:

- Типовий агент `main` використовує звичайний шлях провайдера та fallback сумісності Pi.
- Агент `codex` використовує harness Codex app-server.
- Якщо Codex відсутній або не підтримується для агента `codex`, хід
  завершується помилкою замість тихого використання Pi.

## Розгортання лише з Codex

Примусово використовуйте harness Codex, коли вам потрібно довести, що кожен вбудований хід агента
використовує Codex. Явні середовища виконання Plugin типово не мають fallback до Pi, тому
`fallback: "none"` необов’язковий, але часто корисний як документація:

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
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Коли Codex примусово задано, OpenClaw завершується помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server занадто старий або app-server не може запуститися. Установлюйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`, лише якщо ви свідомо хочете, щоб Pi обробляв
відсутній вибір harness.

## Codex для окремого агента

Ви можете зробити одного агента лише для Codex, поки типовий агент зберігає звичайний
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

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює нову
сесію OpenClaw, а harness Codex за потреби створює або відновлює свій sidecar thread app-server.
`/reset` очищає прив’язку сесії OpenClaw для цього thread і дозволяє наступному ходу знову
визначити harness із поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex звертається до app-server, щоб отримати доступні моделі. Якщо
виявлення завершується помилкою або перевищує час очікування, він використовує комплектний резервний каталог для:

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

Вимкніть виявлення, якщо хочете, щоб запуск не виконував перевірку Codex і використовував
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

## Підключення до app-server і політика

За замовчуванням Plugin запускає Codex локально за допомогою:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це модель довіреного локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати shell та мережеві інструменти, не
зупиняючись на нативних запитах погодження, на які нікому відповідати.

Щоб увімкнути погодження, які переглядає guardian Codex, установіть `appServer.mode:
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

Режим Guardian використовує нативний шлях автоперевірки погоджень Codex. Коли Codex просить
вийти за межі sandbox, записати поза межами робочої області або додати дозволи, як-от мережевий
доступ, Codex спрямовує цей запит на погодження до нативного reviewer замість
людського запиту. Reviewer застосовує систему оцінки ризиків Codex і схвалює або відхиляє
конкретний запит. Використовуйте Guardian, коли вам потрібно більше запобіжників, ніж у режимі YOLO,
але все ж потрібно, щоб агенти без нагляду могли просуватися далі.

Preset `guardian` розгортається в `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`.
Окремі поля політики, як і раніше, перевизначають `mode`, тому в розширених розгортаннях можна поєднувати
preset з явними налаштуваннями. Старіше значення reviewer `guardian_subagent`
і далі приймається як псевдонім сумісності, але в нових конфігураціях слід використовувати
`auto_review`.

Для app-server, що вже працює, використовуйте транспорт WebSocket:

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

| Field               | За замовчуванням                         | Значення                                                                                                          |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                                   |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                                   |
| `url`               | не встановлено                           | URL WebSocket app-server.                                                                                         |
| `authToken`         | не встановлено                           | Bearer token для транспорту WebSocket.                                                                            |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                                    |
| `requestTimeoutMs`  | `60000`                                  | Час очікування для викликів control-plane app-server.                                                             |
| `mode`              | `"yolo"`                                 | Preset для виконання YOLO або guardian-reviewed.                                                                  |
| `approvalPolicy`    | `"never"`                                | Нативна політика погоджень Codex, що надсилається під час старту/відновлення/ходу thread.                        |
| `sandbox`           | `"danger-full-access"`                   | Режим нативного sandbox Codex, що надсилається під час старту/відновлення thread.                                |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"auto_review"`, щоб дозволити Codex переглядати нативні запити на погодження. `guardian_subagent` лишається застарілим псевдонімом. |
| `serviceTier`       | не встановлено                           | Необов’язковий рівень сервісу Codex app-server: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старіші змінні середовища і далі працюють як fallback для локального тестування, коли
відповідне поле конфігурації не задане:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань краще використовувати конфігурацію, оскільки вона зберігає поведінку Plugin
в тому самому перевіреному файлі, що й решта налаштувань harness Codex.

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

Перевірка harness лише з Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
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
            approvalsReviewer: "auto_review",
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
до наявного thread Codex, наступний хід знову надсилає до
app-server поточну вибрану модель OpenAI, провайдера, політику погоджень, sandbox і
рівень сервісу. Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язку thread, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує живе підключення до app-server, моделі, обліковий запис, ліміти швидкості, сервери MCP і skills.
- `/codex models` перелічує живі моделі Codex app-server.
- `/codex threads [filter]` перелічує нещодавні threads Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного thread Codex.
- `/codex compact` просить Codex app-server виконати Compaction для приєднаного thread.
- `/codex review` запускає нативну перевірку Codex для приєднаного thread.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує стан серверів MCP Codex app-server.
- `/codex skills` перелічує Skills Codex app-server.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей thread Codex, передає
поточну вибрану модель OpenClaw до app-server і зберігає
увімкнену розширену історію.

Поверхня команд вимагає Codex app-server `0.118.0` або новішого. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або нетиповий app-server не надає цей метод JSON-RPC.

## Межі hook

Harness Codex має три шари hook:

| Layer                                 | Власник                  | Призначення                                                        |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| Хуки Plugin OpenClaw                  | OpenClaw                 | Сумісність продукту/Plugin між harness Pi і Codex.                 |
| Middleware розширення Codex app-server | Комплектні plugins OpenClaw | Поведінка адаптера для кожного ходу навколо динамічних інструментів OpenClaw. |
| Нативні hooks Codex                   | Codex                    | Низькорівневий життєвий цикл Codex і політика нативних інструментів із конфігурації Codex. |

OpenClaw не використовує файлові `hooks.json` Codex рівня проєкту або глобального рівня для маршрутизації
поведінки Plugin OpenClaw. Для підтримуваного мосту нативних інструментів і дозволів
OpenClaw впроваджує конфігурацію Codex для кожного thread для `PreToolUse`, `PostToolUse` і
`PermissionRequest`. Інші hooks Codex, такі як `SessionStart`,
`UserPromptSubmit` і `Stop`, залишаються елементами керування на рівні Codex; вони не відкриваються
як хуки Plugin OpenClaw у контракті v1.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку Plugin і middleware, якою він володіє, у
адаптері harness. Для нативних інструментів Codex Codex володіє канонічним записом інструмента.
OpenClaw може дзеркалити вибрані події, але не може переписувати нативний thread Codex,
якщо Codex не відкриє цю операцію через app-server або callbacks нативних hook.

Проєкції Compaction і життєвого циклу LLM надходять із
сповіщень Codex app-server і стану адаптера OpenClaw, а не з команд нативних hook Codex.
Події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` — це спостереження на рівні адаптера, а не побайтні копії
внутрішнього запиту Codex або payload Compaction.

Нативні сповіщення app-server Codex `hook/started` і `hook/completed`
проєктуються як події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають хуки Plugin OpenClaw.

## Контракт підтримки V1

Режим Codex — це не Pi з іншим викликом моделі під ним. Codex бере на себе більшу частину
нативного циклу моделі, а OpenClaw адаптує свої поверхні Plugin і сесії
навколо цього кордону.

Підтримується в runtime Codex v1:

| Surface                                 | Підтримка                                | Чому                                                                                                                                       |
| --------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Цикл моделі OpenAI через Codex          | Підтримується                            | Codex app-server володіє ходом OpenAI, нативним відновленням thread і нативним продовженням інструментів.                                |
| Маршрутизація та доставка каналів OpenClaw | Підтримується                          | Telegram, Discord, Slack, WhatsApp, iMessage та інші канали лишаються поза runtime моделі.                                                |
| Динамічні інструменти OpenClaw          | Підтримується                            | Codex просить OpenClaw виконати ці інструменти, тому OpenClaw лишається в шляху виконання.                                                |
| Plugins prompt і контексту              | Підтримується                            | OpenClaw будує накладки prompt і проєктує контекст у хід Codex перед запуском або відновленням thread.                                   |
| Життєвий цикл рушія контексту           | Підтримується                            | Збирання, ingest або обслуговування після ходу, а також координація Compaction рушія контексту виконуються для ходів Codex.              |
| Хуки динамічних інструментів            | Підтримується                            | `before_tool_call`, `after_tool_call` і middleware результатів інструментів виконуються навколо динамічних інструментів OpenClaw.        |
| Хуки життєвого циклу                    | Підтримуються як спостереження адаптера  | `llm_input`, `llm_output`, `agent_end`, `before_compaction` і `after_compaction` спрацьовують із чесними payload у режимі Codex.         |
| Блокування або спостереження за нативним shell і patch | Підтримується через relay нативних hook | Codex `PreToolUse` і `PostToolUse` ретранслюються для зафіксованих поверхонь нативних інструментів. Блокування підтримується; переписування аргументів — ні. |
| Нативна політика дозволів               | Підтримується через relay нативних hook  | Codex `PermissionRequest` можна маршрутизувати через політику OpenClaw там, де runtime це підтримує.                                      |
| Захоплення траєкторії app-server        | Підтримується                            | OpenClaw записує запит, який він надіслав до app-server, і сповіщення, які він від нього отримує.                                        |

Не підтримується в runtime Codex v1:

| Surface                                             | Межа V1                                                                                                                                         | Майбутній шлях                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Мутація аргументів нативних інструментів            | Нативні pre-tool hooks Codex можуть блокувати, але OpenClaw не переписує аргументи нативних інструментів Codex.                                | Потрібна підтримка hooks/schema Codex для заміни вхідних даних інструменту.                               |
| Редагована історія транскрипту Codex-native         | Codex володіє канонічною історією нативного thread. OpenClaw володіє дзеркалом і може проєктувати майбутній контекст, але не повинен змінювати непідтримувані внутрішні елементи. | Додати явні API Codex app-server, якщо потрібна операція над нативним thread.                             |
| `tool_result_persist` для записів нативних інструментів Codex | Цей hook перетворює записи транскрипту, якими володіє OpenClaw, а не записи нативних інструментів Codex.                                       | Можна було б дзеркалити перетворені записи, але канонічне переписування потребує підтримки Codex.         |
| Розширені метадані нативної Compaction              | OpenClaw спостерігає початок і завершення Compaction, але не отримує стабільного списку збережених/відкинутих елементів, дельти токенів або payload підсумку. | Потрібні багатші події Compaction у Codex.                                                                 |
| Втручання в Compaction                              | Поточні хуки Compaction OpenClaw у режимі Codex працюють на рівні сповіщень.                                                                    | Додати pre/post hooks Compaction у Codex, якщо plugins мають блокувати або переписувати нативну Compaction. |
| Gate для stop або final-answer                      | Codex має нативні hooks зупинки, але OpenClaw не відкриває gate для final-answer як контракт Plugin v1.                                         | Майбутній opt-in примітив із захистом циклу та тайм-аутів.                                                 |
| Паритет нативних hooks MCP як зафіксована поверхня v1 | Relay є загальним, але OpenClaw ще не ввів version-gating і не протестував наскрізну поведінку нативних pre/post hooks MCP.                    | Додати тести й документацію relay MCP OpenClaw, щойно підтримуваний мінімум протоколу app-server покриє ці payload. |
| Побайтне захоплення запиту до model API             | OpenClaw може захоплювати запити й сповіщення app-server, але ядро Codex внутрішньо будує фінальний запит до OpenAI API.                       | Потрібна подія трасування запиту моделі Codex або API налагодження.                                        |

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, будує список інструментів і отримує результати динамічних інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів повідомлень
і далі проходять через звичайний шлях доставки OpenClaw.

Relay нативних hook навмисно є загальним, але контракт підтримки v1
обмежений шляхами нативних інструментів і дозволів Codex, які перевіряє OpenClaw. Не
припускайте, що кожна майбутня подія hook Codex є поверхнею Plugin OpenClaw, доки
контракт runtime прямо цього не визначить.

Запити погодження інструментів MCP Codex маршрутизуються через потік
погоджень Plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Запити Codex `request_user_input` надсилаються назад до
початкового чату, а наступне поставлене в чергу повідомлення-відповідь відповідає на цей нативний
запит сервера замість того, щоб спрямовуватися як додатковий контекст. Інші запити elicitation MCP
і далі завершуються помилкою без fallback.

Коли вибрана модель використовує harness Codex, нативна Compaction thread делегується
Codex app-server. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
містить prompt користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex, коли app-server їх надсилає. Наразі OpenClaw лише
записує сигнали початку та завершення нативної Compaction. Він ще не показує
людинозрозумілий підсумок Compaction або перевірний список того, які записи Codex
зберіг після Compaction.

Оскільки Codex володіє канонічним нативним thread, `tool_result_persist` наразі не
переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента в транскрипт сесії, яким володіє OpenClaw.

Генерація медіа не вимагає Pi. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа і далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не з’являється як звичайний провайдер `/model`:** це очікувано для
нових конфігурацій. Виберіть модель `openai/gpt-*` із
`embeddedHarness.runtime: "codex"` (або застаріле посилання `codex/*`), увімкніть
`plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає
`codex`.

**OpenClaw використовує Pi замість Codex:** `runtime: "auto"` і далі може використовувати Pi як
бекенд сумісності, коли жоден harness Codex не бере виконання на себе. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування. Тепер
примусове середовище виконання Codex завершується помилкою замість fallback до Pi, якщо ви
явно не встановили `embeddedHarness.fallback: "pi"`. Щойно буде вибрано Codex app-server,
його помилки відображатимуться безпосередньо без додаткової конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket відразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і переконайтеся, що віддалений app-server використовує ту саму версію протоколу Codex app-server.

**Модель не Codex використовує Pi:** це очікувано, якщо ви не примусово задали
`embeddedHarness.runtime: "codex"` для цього агента або не вибрали застаріле
посилання `codex/*`. Звичайні `openai/gpt-*` та посилання інших провайдерів лишаються на своєму
звичайному шляху провайдера в режимі `auto`. Якщо ви примусово задаєте `runtime: "codex"`, кожен вбудований
хід для цього агента має бути моделлю OpenAI, яку підтримує Codex.

## Пов’язане

- [Plugins Agent Harness](/uk/plugins/sdk-agent-harness)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Провайдер OpenAI](/uk/providers/openai)
- [Status](/uk/cli/status)
- [Хуки Plugin](/uk/plugins/hooks)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
