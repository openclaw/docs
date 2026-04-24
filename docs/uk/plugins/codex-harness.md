---
read_when:
    - Ви хочете використовувати комплектний app-server harness Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід на PI для розгортань лише з Codex
summary: Запустіть вбудовані ходи агента OpenClaw через комплектний app-server harness Codex
title: harness Codex
x-i18n:
    generated_at: "2026-04-24T07:31:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

Комплектний Plugin `codex` дає змогу OpenClaw запускати вбудовані ходи агента через Codex app-server замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням потоку, нативним Compaction і виконанням app-server.
OpenClaw, як і раніше, керує чат-каналами, файлами сесій, вибором моделей, інструментами,
схваленнями, доставкою медіа та видимим дзеркалом транскрипту.

Нативні ходи Codex зберігають хуки Plugin OpenClaw як публічний шар сумісності.
Це внутрішньопроцесні хуки OpenClaw, а не командні хуки Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `agent_end`

Комплектні Plugins також можуть реєструвати фабрику розширення Codex app-server, щоб додавати
асинхронне проміжне ПЗ `tool_result`. Це проміжне ПЗ виконується для динамічних інструментів OpenClaw
після того, як OpenClaw виконає інструмент, і до того, як результат буде повернено в Codex. Воно
відокремлене від публічного хука Plugin `tool_result_persist`, який перетворює записи
результатів інструментів у транскрипті, якими керує OpenClaw.

За замовчуванням harness вимкнений. У нових конфігураціях слід зберігати посилання на моделі OpenAI
канонічними як `openai/gpt-*` і явно примусово вказувати
`embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли
потрібне нативне виконання через app-server. Застарілі посилання на моделі `codex/*` і надалі
автоматично вибирають harness для сумісності.

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`, коли потрібна
автентифікація Codex OAuth через PI; використовуйте `openai/*`, коли потрібен прямий доступ до OpenAI API або
коли ви примусово використовуєте нативний harness Codex app-server:

| Посилання на модель                                   | Шлях виконання                               | Використовуйте, коли                                                       |
| ----------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Провайдер OpenAI через зв’язку OpenClaw/PI   | Вам потрібен поточний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OpenAI Codex OAuth через OpenClaw/PI         | Вам потрібна автентифікація підписки ChatGPT/Codex із типовим раннером PI. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness Codex app-server                     | Вам потрібне нативне виконання через Codex app-server для вбудованого ходу агента. |

Наразі GPT-5.5 в OpenClaw доступний лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` із harness
Codex app-server. Прямий доступ за API-ключем для `openai/gpt-5.5` підтримуватиметься,
щойно OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` залишаються прийнятними як псевдоніми сумісності. Нові конфігурації
PI Codex OAuth повинні використовувати `openai-codex/gpt-*`; нові конфігурації
нативного harness app-server повинні використовувати `openai/gpt-*` разом із `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` дотримується того самого поділу за префіксами. Використовуйте
`openai-codex/gpt-*`, коли розуміння зображень має виконуватися через шлях провайдера OpenAI
Codex OAuth. Використовуйте `codex/gpt-*`, коли розуміння зображень має виконуватися
через обмежений хід Codex app-server. Модель Codex app-server повинна
заявляти підтримку вхідних зображень; текстові моделі Codex завершуються помилкою ще до початку
медіа-ходу.

Використовуйте `/status`, щоб підтвердити ефективний harness для поточної сесії. Якщо
вибір виглядає неочікуваним, увімкніть налагоджувальне логування для підсистеми `agents/harness`
і перевірте структурований запис gateway `agent harness selected`. Він
містить ідентифікатор вибраного harness, причину вибору, політику runtime/fallback і,
у режимі `auto`, результат підтримки для кожного кандидата Plugin.

Вибір harness не є елементом керування живою сесією. Коли вбудований хід виконується,
OpenClaw записує ідентифікатор вибраного harness у цю сесію та продовжує використовувати його для
наступних ходів у межах того самого ідентифікатора сесії. Змінюйте конфігурацію `embeddedHarness` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інший harness;
використовуйте `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між PI і Codex. Це дає змогу уникнути повторного відтворення одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до прив’язок harness, вважаються прив’язаними до PI, щойно вони
мають історію транскрипту. Використовуйте `/new` або `/reset`, щоб перевести цю розмову на
Codex після зміни конфігурації.

`/status` показує ефективний не-PI harness поруч із `Fast`, наприклад
`Fast · codex`. Типовий harness PI залишається `Runner: pi (embedded)` і
не додає окремий бейдж harness.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- Codex app-server `0.118.0` або новіший.
- Доступна автентифікація Codex для процесу app-server.

Plugin блокує старіші або безверсійні handshake app-server. Це утримує
OpenClaw у межах поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також із
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі дані автентифікації, що й ваш локальний Codex app-server.

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

Застарілі конфігурації, які встановлюють `agents.defaults.model` або модель агента в
`codex/<model>`, і надалі автоматично вмикають комплектний Plugin `codex`. Нові конфігурації мають
віддавати перевагу `openai/<model>` разом із явним записом `embeddedHarness`, наведеним вище.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете, щоб застарілі посилання `codex/*` вибирали Codex, а
PI — для всього іншого. Для нових конфігурацій надавайте перевагу явному `runtime: "codex"` для
агентів, які мають використовувати цей harness.

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

- `/model gpt` або `/model openai/gpt-5.5` використовує harness Codex app-server для цієї конфігурації.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть fallback на PI, коли потрібно гарантувати, що кожен вбудований хід агента використовує
harness Codex:

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

Коли fallback вимкнено, OpenClaw завершується помилкою на ранньому етапі, якщо Plugin Codex вимкнено,
app-server надто старий або app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити один агент лише для Codex, тоді як агент за замовчуванням зберігатиме звичайний
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
сесію OpenClaw, а harness Codex за потреби створює або відновлює свій sidecar-потік app-server.
`/reset` очищує прив’язку сесії OpenClaw для цього потоку й дозволяє наступному ходу знову
визначити harness із поточної конфігурації.

## Виявлення моделей

За замовчуванням Plugin Codex запитує в app-server доступні моделі. Якщо
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

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалося зондування Codex і використовувався
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

## З’єднання з app-server і політика

За замовчуванням Plugin запускає Codex локально так:

```bash
codex app-server --listen stdio://
```

За замовчуванням OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це поза довіри для локального оператора, що використовується
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних запитах підтвердження, на які нікому відповісти.

Щоб увімкнути перевірювані Guardian схвалення Codex, установіть `appServer.mode:
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

Guardian — це нативний рецензент схвалень Codex. Коли Codex просить вийти із sandbox, записувати поза межами workspace або додати дозволи, як-от мережевий доступ, Codex спрямовує цей запит на схвалення до субагента-рецензента замість запиту людині. Рецензент застосовує модель ризиків Codex і схвалює або відхиляє конкретний запит. Використовуйте Guardian, коли вам потрібно більше запобіжників, ніж у режимі YOLO, але все ж потрібні агенти без нагляду, які можуть просуватися далі.

Набір `guardian` розгортається в `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` і `sandbox: "workspace-write"`. Окремі поля політики, як і раніше, мають пріоритет над `mode`, тому розширені розгортання можуть поєднувати цей набір із явними виборами.

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

| Поле                | Типове значення                          | Значення                                                                                                  |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                           |
| `command`           | `"codex"`                                | Виконуваний файл для транспорту stdio.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                           |
| `url`               | не встановлено                           | URL WebSocket app-server.                                                                                 |
| `authToken`         | не встановлено                           | Bearer-токен для транспорту WebSocket.                                                                    |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                            |
| `requestTimeoutMs`  | `60000`                                  | Час очікування для викликів control-plane app-server.                                                     |
| `mode`              | `"yolo"`                                 | Набір параметрів для виконання в режимі YOLO або з перевіркою Guardian.                                   |
| `approvalPolicy`    | `"never"`                                | Нативна політика схвалення Codex, яка надсилається під час запуску/відновлення потоку/ходу.              |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, який надсилається під час запуску/відновлення потоку.                      |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"guardian_subagent"`, щоб дозволити Codex Guardian перевіряти запити.                    |
| `serviceTier`       | не встановлено                           | Необов’язковий рівень сервісу Codex app-server: `"fast"`, `"flex"` або `null`. Некоректні застарілі значення ігноруються. |

Старі змінні середовища все ще працюють як резервні варіанти для локального тестування, коли
відповідне поле конфігурації не встановлено:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Для
відтворюваних розгортань перевага надається конфігурації, оскільки вона зберігає поведінку Plugin в тому
самому файлі, що пройшов перевірку, що й решта налаштувань harness Codex.

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

Перевірка harness лише з Codex із вимкненим fallback на PI:

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

Схвалення Codex із перевіркою Guardian:

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

Перемикання моделей залишається під керуванням OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, наступний хід знову надсилає в
app-server поточну вибрану модель OpenAI, провайдера, політику схвалення, sandbox і рівень сервісу.
Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив’язку до потоку, але просить Codex
продовжити роботу з новою вибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
загальною і працює в будь-якому каналі, який підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти запитів, сервери MCP і skills.
- `/codex models` перелічує поточні моделі Codex app-server.
- `/codex threads [filter]` перелічує нещодавні потоки Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить Codex app-server виконати Compaction для приєднаного потоку.
- `/codex review` запускає нативну перевірку Codex для приєднаного потоку.
- `/codex account` показує стан облікового запису та лімітів запитів.
- `/codex mcp` показує стан серверів MCP у Codex app-server.
- `/codex skills` показує skills Codex app-server.

`/codex resume` записує той самий файл sidecar-прив’язки, який harness використовує для
звичайних ходів. Під час наступного повідомлення OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw в app-server і залишає
розширену історію ввімкненою.

Поверхня команд вимагає Codex app-server `0.118.0` або новішої версії. Окремі
методи керування позначаються як `unsupported by this Codex app-server`, якщо
майбутній або нестандартний app-server не надає цей метод JSON-RPC.

## Межі хуків

Harness Codex має три шари хуків:

| Шар                                   | Власник                  | Призначення                                                         |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Хуки Plugin OpenClaw                  | OpenClaw                 | Сумісність продукту/Plugin між harness PI і Codex.                  |
| Проміжне ПЗ розширення Codex app-server | Комплектні Plugins OpenClaw | Поведінка адаптера на рівні ходу навколо динамічних інструментів OpenClaw. |
| Нативні хуки Codex                    | Codex                    | Низькорівневий життєвий цикл Codex і політика нативних інструментів із конфігурації Codex. |

OpenClaw не використовує файли проєкту або глобальні файли Codex `hooks.json` для маршрутизації
поведінки Plugin OpenClaw. Нативні хуки Codex корисні для операцій, якими володіє
Codex, таких як політика shell, перевірка результатів нативних інструментів,
обробка зупинки та життєвий цикл нативних моделей/Compaction, але вони не є API Plugin OpenClaw.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку Plugin і проміжного ПЗ, якою він володіє, в
адаптері harness. Для нативних інструментів Codex канонічним записом інструмента володіє Codex.
OpenClaw може дзеркалювати окремі події, але не може переписувати нативний потік Codex,
якщо Codex не надає цю операцію через app-server або колбеки нативних хуків.

Коли новіші збірки Codex app-server надають події хуків життєвого циклу нативних моделей і Compaction,
OpenClaw має керувати підтримкою цього протоколу за версіями та відображати
події в наявний контракт хуків OpenClaw там, де семантика є коректною.
До того часу події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями на рівні адаптера, а не побайтовими захопленнями
внутрішнього запиту Codex або payload Compaction.

Нативні сповіщення Codex app-server `hook/started` і `hook/completed`
проєктуються як події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають хуки Plugin OpenClaw.

## Інструменти, медіа та Compaction

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує результати динамічних інструментів від
harness. Текст, зображення, відео, музика, TTS, схвалення та вивід інструментів обміну повідомленнями
і далі проходять через звичайний шлях доставки OpenClaw.

Запити на схвалення інструментів MCP Codex маршрутизуються через потік схвалення Plugin OpenClaw,
коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Запити Codex `request_user_input` надсилаються назад у
вихідний чат, а наступне поставлене в чергу додаткове повідомлення відповідає на цей нативний
запит сервера замість того, щоб скеровуватися як додатковий контекст. Інші запити elicitation MCP
і далі завершуються безпечним блокуванням.

Коли вибрана модель використовує harness Codex, нативний Compaction потоку делегується
Codex app-server. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness. Дзеркало
включає запит користувача, фінальний текст асистента та полегшені записи міркувань
або плану Codex, коли їх генерує app-server. Наразі OpenClaw записує лише сигнали
початку та завершення нативного Compaction. Він ще не показує
людинозрозумілий підсумок Compaction або придатний до аудиту список того, які записи Codex
зберіг після Compaction.

Оскільки канонічним нативним потоком володіє Codex, `tool_result_persist` наразі не
переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента в транскрипт сесії, яким володіє OpenClaw.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і
розуміння медіа і далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
виберіть модель `openai/gpt-*` з `embeddedHarness.runtime: "codex"` (або
застаріле посилання `codex/*`) і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** якщо жоден harness Codex не бере виконання,
OpenClaw може використовувати PI як сумісний бекенд. Установіть
`embeddedHarness.runtime: "codex"`, щоб примусово вибрати Codex під час тестування, або
`embeddedHarness.fallback: "none"`, щоб отримувати помилку, коли жоден harness Plugin не підходить. Щойно
вибрано Codex app-server, його збої відображаються безпосередньо без додаткової
конфігурації fallback.

**app-server відхиляється:** оновіть Codex, щоб handshake app-server
повідомляв версію `0.118.0` або новішу.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і що віддалений app-server використовує ту саму версію протоколу Codex app-server.

**Не-Codex модель використовує PI:** це очікувана поведінка, якщо ви не примусово встановили
`embeddedHarness.runtime: "codex"` (або не вибрали застаріле посилання `codex/*`). Звичайні
`openai/gpt-*` та посилання інших провайдерів залишаються на своєму стандартному шляху провайдера.

## Пов’язане

- [Plugins Agent Harness](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
