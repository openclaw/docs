---
read_when:
    - Ви хочете використовувати комплектований harness app-server Codex
    - Вам потрібні приклади конфігурації harness Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість переходу до Pi
summary: Запустіть вбудовані ходи агента OpenClaw через комплектований harness app-server Codex
title: harness Codex
x-i18n:
    generated_at: "2026-04-24T21:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 674bc34552401d1a492b348ceb86fd513a894760987a0c6fef6e79fdb0b3ebfb
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектований Plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативною Compaction та виконанням app-server.
OpenClaw і далі керує каналами чату, файлами сесії, вибором моделі, інструментами,
погодженнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex зберігають хука Plugin OpenClaw як публічний шар сумісності.
Це внутрішньопроцесні хуки OpenClaw, а не командні хуки Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `agent_end`

Plugins також можуть реєструвати нейтральне до harness middleware результатів інструментів, щоб переписувати
динамічні результати інструментів OpenClaw після того, як OpenClaw виконає інструмент, і до того,
як результат буде повернено до Codex. Це окремо від публічного
хука Plugin `tool_result_persist`, який трансформує записи результатів
інструментів у транскрипті, що належать OpenClaw.

За замовчуванням harness вимкнено. У нових конфігураціях слід зберігати посилання на моделі OpenAI
канонічними як `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли
потрібне нативне виконання app-server. Застарілі посилання на моделі `codex/*` і далі автоматично вибирають
harness для сумісності, але не показуються як звичайні варіанти моделі/провайдера.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, коли хочете
Codex OAuth через PI; використовуйте `openai/*`, коли хочете прямий доступ до OpenAI API або
коли примусово використовуєте нативний harness app-server Codex:

| Посилання на модель                                  | Шлях runtime                                 | Використовуйте, коли                                                        |
| ---------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Провайдер OpenAI через обв’язку OpenClaw/PI  | Вам потрібен поточний прямий доступ до API платформи OpenAI з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OpenAI Codex OAuth через OpenClaw/PI         | Вам потрібна автентифікація передплати ChatGPT/Codex із runner PI за замовчуванням. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness app-server Codex                     | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

GPT-5.5 у OpenClaw наразі доступна лише через передплату/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` з harness
app-server Codex. Прямий доступ через API key для `openai/gpt-5.5` підтримуватиметься,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і далі приймаються як псевдоніми сумісності. Doctor
міграція сумісності переписує застарілі основні посилання `codex/*` на `openai/*`
і окремо записує політику harness Codex. Нові конфігурації PI Codex OAuth
мають використовувати `openai-codex/gpt-*`; нові конфігурації нативного harness app-server
мають використовувати `openai/gpt-*` плюс `embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` дотримується такого самого поділу префіксів. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має виконуватися через шлях провайдера OpenAI
Codex OAuth. Використовуйте `codex/gpt-*`, коли розуміння зображень має виконуватися
через обмежений хід app-server Codex. Модель app-server Codex має
оголошувати підтримку вхідних зображень; текстові моделі Codex завершуються з помилкою до початку
медіа-ходу.

Використовуйте `/status`, щоб підтвердити ефективний harness для поточної сесії. Якщо
вибір виглядає несподіваним, увімкніть журналювання налагодження для підсистеми `agents/harness`
і перегляньте структурований запис шлюзу `agent harness selected`. Він
містить ідентифікатор вибраного harness, причину вибору, політику runtime/fallback, а також,
у режимі `auto`, результат підтримки для кожного кандидата Plugin.

Вибір harness не є елементом керування живою сесією. Коли вбудований хід виконується,
OpenClaw записує ідентифікатор вибраного harness у цій сесії та продовжує використовувати його для
наступних ходів у межах того самого ідентифікатора сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між PI та Codex. Це запобігає повторному відтворенню одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до закріплення harness, вважаються закріпленими за PI, щойно в них
з’являється історія транскрипту. Використовуйте `/new` або `/reset`, щоб перевести таку розмову на
Codex після зміни конфігурації.

`/status` показує ефективний не-PI harness поруч із `Fast`, наприклад
`Fast · codex`. Типовий harness PI і далі відображається як `Runner: pi (embedded)` і
не додає окремий бейдж harness.

## Вимоги

- OpenClaw із доступним комплектованим Plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Автентифікація Codex, доступна для процесу app-server.

Plugin блокує старіші або неверсіоновані handshake app-server. Це залишає
OpenClaw на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також з
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте той самий матеріал автентифікації, що й ваш локальний
app-server Codex.

## Мінімальна конфігурація

Використовуйте `openai/gpt-5.5`, увімкніть комплектований Plugin і примусово вкажіть harness `codex`:

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

Якщо ваша конфігурація використовує `plugins.allow`, включіть туди також `codex`:

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

Застарілі конфігурації, які встановлюють `agents.defaults.model` або модель агента на
`codex/<model>`, усе ще автоматично вмикають комплектований Plugin `codex`. У нових конфігураціях слід
надавати перевагу `openai/<model>` плюс явному запису `embeddedHarness`, наведеному вище.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI — для всього іншого. Для нових конфігурацій надавайте перевагу явному `runtime: "codex"` для
агентів, які мають використовувати harness.

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

За такої форми:

- `/model gpt` або `/model openai/gpt-5.5` використовує harness app-server Codex для цієї конфігурації.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається harness сумісності.

## Розгортання лише з Codex

Примусово використовуйте harness Codex, коли потрібно довести, що кожен вбудований хід агента
використовує Codex. Явні runtime Plugin за замовчуванням не мають fallback до PI, тому
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

Коли Codex примусово увімкнено, OpenClaw завершується з помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server застарий або app-server не може запуститися. Встановлюйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` лише якщо ви навмисно хочете, щоб PI обробляв
відсутній вибір harness.

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
і дозволяє наступному ходу знову визначити harness з поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує app-server про доступні моделі. Якщо
виявлення не вдається або завершується за тайм-аутом, використовується комплектований резервний каталог для:

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

Вимкніть виявлення, якщо хочете, щоб під час запуску не відбувалося зондування Codex і використовувався
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

За замовчуванням Plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це позиція довіреного локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати shell- і мережеві інструменти, не
зупиняючись на нативних запитах погодження, коли нікому відповісти.

Щоб увімкнути погодження Codex, перевірені guardian, установіть `appServer.mode:
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

Guardian — це нативний рецензент погоджень Codex. Коли Codex просить вийти за межі sandbox, записати поза межами workspace або додати дозволи, як-от мережевий доступ, Codex надсилає цей запит на погодження рецензенту-субагенту, а не людині через prompt. Рецензент застосовує модель ризиків Codex і погоджує або відхиляє конкретний запит. Використовуйте Guardian, коли вам потрібно більше запобіжників, ніж у режимі YOLO, але при цьому потрібно, щоб агенти без нагляду продовжували роботу.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики й далі мають пріоритет над `mode`, тому розширені розгортання можуть поєднувати пресет із явними налаштуваннями.

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

| Поле                | Типове значення                          | Значення                                                                                                   |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                            |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                            |
| `url`               | не встановлено                           | URL WebSocket app-server.                                                                                  |
| `authToken`         | не встановлено                           | Bearer token для транспорту WebSocket.                                                                     |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                             |
| `requestTimeoutMs`  | `60000`                                  | Тайм-аут для викликів control plane app-server.                                                            |
| `mode`              | `"yolo"`                                 | Пресет для виконання в режимі YOLO або з перевіркою guardian.                                              |
| `approvalPolicy`    | `"never"`                                | Нативна політика погодження Codex, що надсилається під час запуску/відновлення потоку/ходу.               |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, що надсилається під час запуску/відновлення потоку.                          |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти prompt.                     |
| `serviceTier`       | не встановлено                           | Необов’язковий service tier app-server Codex: `"fast"`, `"flex"` або `null`. Неприпустимі застарілі значення ігноруються. |

Старіші змінні середовища й далі працюють як fallback для локального тестування, коли
відповідне поле конфігурації не встановлено:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` натомість або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Конфігурації
надається перевага для відтворюваних розгортань, оскільки вона зберігає поведінку Plugin в тому
самому перевіреному файлі, що й решта налаштувань harness Codex.

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

Перевірка harness лише-Codex із вимкненим fallback до PI:

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

Погодження Codex із перевіркою guardian:

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

Перемикання моделей залишається під керуванням OpenClaw. Коли сесію OpenClaw прив’язано
до наявного потоку Codex, наступний хід знову надсилає до
app-server поточну вибрану модель OpenAI, провайдера, політику погодження, sandbox і
service tier. Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив’язку до потоку, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Комплектований Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною та працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує живе підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та skills.
- `/codex models` показує список живих моделей app-server Codex.
- `/codex threads [filter]` показує список нещодавніх потоків Codex.
- `/codex resume <thread-id>` прив’язує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex виконати compaction для прив’язаного потоку.
- `/codex review` запускає нативну перевірку Codex для прив’язаного потоку.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` показує список станів MCP-серверів app-server Codex.
- `/codex skills` показує список Skills app-server Codex.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw до app-server і зберігає розширену історію
увімкненою.

Поверхня команд вимагає Codex app-server `0.118.0` або новішої версії. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей JSON-RPC метод.

## Межі хуків

Harness Codex має три шари хуків:

| Шар                                   | Власник                  | Призначення                                                         |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| хуки Plugin OpenClaw                  | OpenClaw                 | Сумісність продукту/Plugin між harness PI і Codex.                  |
| middleware розширення app-server Codex | комплектовані Plugins OpenClaw | Поведінка адаптера навколо динамічних інструментів OpenClaw для кожного ходу. |
| нативні хуки Codex                    | Codex                    | Низькорівневий життєвий цикл Codex і нативна політика інструментів із конфігурації Codex. |

OpenClaw не використовує файли проєктного або глобального Codex `hooks.json` для маршрутизації
поведінки Plugin OpenClaw. Нативні хуки Codex корисні для операцій,
що належать Codex, як-от політика shell, нативна перевірка результатів інструментів, обробка зупинки та
нативна Compaction/життєвий цикл моделі, але вони не є API Plugin OpenClaw.

Для динамічних інструментів OpenClaw, OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку Plugin і middleware, якою він володіє, у
адаптері harness. Для нативних інструментів Codex саме Codex володіє канонічним записом інструмента.
OpenClaw може віддзеркалювати окремі події, але не може переписати нативний потік Codex,
якщо тільки Codex не надає цю операцію через app-server або нативні callback-хуки.

Коли новіші збірки app-server Codex надаватимуть події хуків нативної Compaction і життєвого циклу моделі,
OpenClaw має з урахуванням версії протоколу вмикати цю підтримку та зіставляти
події з наявним контрактом хуків OpenClaw там, де семантика є коректною.
До того часу події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями на рівні адаптера, а не побайтними копіями
внутрішнього запиту Codex або payload Compaction.

Нативні сповіщення app-server Codex `hook/started` і `hook/completed`
проєктуються як події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають хуки Plugin OpenClaw.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw і далі формує список інструментів і отримує результати динамічних інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів повідомлень
і далі проходять звичайним шляхом доставки OpenClaw.

Запити погодження інструментів Codex MCP маршрутизуються через потік погодження Plugin
OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Prompt Codex `request_user_input` надсилаються назад у
початковий чат, а наступне поставлене в чергу повідомлення-відповідь відповідає на цей нативний
запит сервера замість того, щоб спрямовуватися як додатковий контекст. Інші запити elicitation MCP
і далі завершуються за принципом fail closed.

Коли вибрана модель використовує harness Codex, нативна Compaction потоку делегується
app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
містить prompt користувача, фінальний текст помічника та полегшені записи міркувань або
плану Codex, коли app-server їх надсилає. Наразі OpenClaw записує лише сигнали
початку та завершення нативної Compaction. Він ще не надає зрозумілого для людини
зведення Compaction або придатного до аудиту списку того, які записи Codex
зберіг після Compaction.

Оскільки Codex володіє канонічним нативним потоком, `tool_result_persist` наразі не
переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента в транскрипт сесії, що належить OpenClaw.

Генерація медіа не вимагає PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа й далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** `runtime: "auto"` усе ще може використовувати PI як
бекенд сумісності, коли жоден harness Codex не бере виконання на себе. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування. Тепер
примусовий runtime Codex завершується з помилкою замість fallback до PI, якщо ви
явно не встановите `embeddedHarness.fallback: "pi"`. Щойно вибрано app-server Codex,
його збої проявляються безпосередньо без додаткової конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket відразу завершується з помилкою:** перевірте `appServer.url`, `authToken`,
і що віддалений app-server використовує ту саму версію протоколу app-server Codex.

**Не-Codex модель використовує PI:** це очікувано, якщо ви не примусово встановили
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
`openai/gpt-*` та інші посилання провайдерів залишаються на своєму звичайному шляху провайдера.

## Пов’язане

- [Plugins Harness агента](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
