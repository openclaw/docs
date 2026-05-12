---
read_when:
    - Ви хочете використовувати вбудований серверний каркас застосунку Codex
    - Вам потрібні приклади конфігурації обв’язки Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість повернення до PI
summary: Запускайте ходи вбудованого агента OpenClaw через комплектний harness app-server Codex
title: Обв’язка Codex
x-i18n:
    generated_at: "2026-05-12T08:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Вбудований plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агентів OpenAI
через Codex app-server замість вбудованого PI harness.

Використовуйте Codex harness, коли хочете, щоб Codex керував низькорівневою сесією агента:
нативне відновлення thread, нативне продовження tool, нативна compaction і
виконання app-server. OpenClaw і далі керує каналами чату, файлами сесій, вибором моделі,
динамічними tools OpenClaw, approvals, доставкою медіа та видимим
дзеркалом transcript.

Звичайне налаштування використовує канонічні посилання на моделі OpenAI, як-от `openai/gpt-5.5`.
Не налаштовуйте посилання на моделі `openai-codex/gpt-*`. Задавайте порядок auth агентів OpenAI
у `auth.order.openai`; старі профілі `openai-codex:*` і записи
`auth.order.openai-codex` залишаються підтримуваними для наявних інсталяцій.

OpenClaw запускає threads Codex app-server з нативним code mode Codex і
увімкненим режимом лише code-mode. Це утримує відкладені/пошукові динамічні tools OpenClaw
усередині власного виконання коду та поверхні tool-search Codex, замість додавання
обгортки tool-search у стилі PI поверх Codex.

Для ширшого розділення model/provider/runtime почніть з
[середовищ виконання агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — runtime, а Telegram,
Discord, Slack або інший канал залишається комунікаційною поверхнею.

## Вимоги

- OpenClaw з доступним вбудованим plugin `codex`.
- Якщо ваша конфігурація використовує `plugins.allow`, додайте `codex`.
- Codex app-server `0.125.0` або новіший. Вбудований plugin типово керує сумісним
  бінарним файлом Codex app-server, тому локальні команди `codex` у `PATH` не
  впливають на звичайний запуск harness.
- Codex auth доступний через `openclaw models auth login --provider openai-codex`,
  обліковий запис app-server у Codex home агента або явний auth profile Codex API-key.

Про пріоритет auth, ізоляцію середовища, власні команди app-server, виявлення моделей
і всі поля конфігурації див.
[довідник Codex harness](/uk/plugins/codex-harness-reference).

## Швидкий старт

Більшість користувачів, які хочуть Codex в OpenClaw, обирають цей шлях: увійти з
підпискою ChatGPT/Codex, увімкнути вбудований plugin `codex` і використовувати
канонічне посилання на модель `openai/gpt-*`.

Увійдіть через Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Увімкніть вбудований plugin `codex` і виберіть модель агента OpenAI:

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

Перезапустіть gateway після зміни конфігурації plugin. Якщо наявний чат уже
має сесію, використайте `/new` або `/reset` перед тестуванням змін runtime, щоб наступний
хід визначив harness з поточної конфігурації.

## Конфігурація

Конфігурація зі швидкого старту — це мінімально достатня конфігурація Codex harness. Налаштовуйте
параметри Codex harness у конфігурації OpenClaw, а CLI використовуйте лише для Codex auth:

| Потреба                                   | Налаштуйте                                                                              | Де                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| Увімкнути harness                        | `plugins.entries.codex.enabled: true`                                                   | Конфігурація OpenClaw           |
| Зберегти інсталяцію plugin зі списком дозволених | Додайте `codex` у `plugins.allow`                                                       | Конфігурація OpenClaw           |
| Спрямовувати ходи агентів OpenAI через Codex | `agents.defaults.model` або `agents.list[].model` як `openai/gpt-*`                    | Конфігурація агента OpenClaw    |
| Увійти через Codex OAuth                 | `openclaw models auth login --provider openai-codex`                                    | Auth profile CLI                |
| Додати резервний API-key для запусків Codex | Профіль API-key `openai:*`, указаний після subscription auth у `auth.order.openai`     | Auth profile CLI + конфігурація OpenClaw |
| Завершуватися помилкою, коли Codex недоступний | Provider або model `agentRuntime.id: "codex"`                                          | Конфігурація model/provider OpenClaw |
| Використовувати прямий трафік OpenAI API | Provider або model `agentRuntime.id: "pi"` зі звичайним auth OpenAI                    | Конфігурація model/provider OpenClaw |
| Налаштувати поведінку app-server         | `plugins.entries.codex.config.appServer.*`                                              | Конфігурація plugin Codex       |
| Увімкнути нативні apps plugin Codex      | `plugins.entries.codex.config.codexPlugins.*`                                           | Конфігурація plugin Codex       |
| Увімкнути Codex Computer Use             | `plugins.entries.codex.config.computerUse.*`                                            | Конфігурація plugin Codex       |

Використовуйте посилання на моделі `openai/gpt-*` для ходів агентів OpenAI з Codex. Надавайте перевагу
`auth.order.openai` для порядку subscription-first/API-key-backup. Наявні
auth profiles `openai-codex:*` і `auth.order.openai-codex` залишаються чинними, але
не створюйте нові посилання на моделі `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

У такій формі обидва профілі все одно виконуються через Codex для ходів агентів
`openai/gpt-*`. API key є лише резервним auth, а не запитом на перемикання на PI або
звичайний OpenAI Responses.

Решта цієї сторінки описує поширені варіанти, між якими користувачі мають вибрати:
форма розгортання, fail-closed routing, політика guardian approval, нативні Codex
plugins і Computer Use. Повні списки параметрів, значення за замовчуванням, enums, discovery,
ізоляцію середовища, timeouts і поля transport app-server див. у
[довіднику Codex harness](/uk/plugins/codex-harness-reference).

## Перевірка runtime Codex

Використайте `/status` у чаті, де очікуєте Codex. Хід агента OpenAI на базі Codex
показує:

```text
Runtime: OpenAI Codex
```

Потім перевірте стан Codex app-server:

```text
/codex status
/codex models
```

`/codex status` повідомляє про підключення app-server, обліковий запис, rate limits, MCP
servers і skills. `/codex models` перелічує живий каталог Codex app-server для
harness і облікового запису. Якщо `/status` неочікуваний, див.
[Усунення несправностей](#troubleshooting).

## Routing і вибір моделі

Тримайте provider refs і runtime policy окремо:

- Використовуйте `openai/gpt-*` для ходів агентів OpenAI через Codex.
- Не використовуйте `openai-codex/gpt-*` у конфігурації. Запустіть `openclaw doctor --fix`, щоб
  виправити legacy refs і застарілі route pins сесій.
- `agentRuntime.id: "codex"` необов’язковий для звичайного auto mode OpenAI, але корисний,
  коли розгортання має fail closed, якщо Codex недоступний.
- `agentRuntime.id: "pi"` переводить provider або model у пряму поведінку PI, коли
  це зроблено навмисно.
- `/codex ...` керує нативними розмовами Codex app-server з чату.
- ACP/acpx — це окремий шлях зовнішнього harness. Використовуйте його лише тоді, коли користувач просить
  ACP/acpx або зовнішній harness adapter.

Поширений routing команд:

| Намір користувача              | Використовуйте                          |
| ------------------------------ | --------------------------------------- |
| Приєднати поточний чат         | `/codex bind [--cwd <path>]`            |
| Відновити наявний thread Codex | `/codex resume <thread-id>`             |
| Перелічити або відфільтрувати threads Codex | `/codex threads [filter]`               |
| Надіслати лише feedback Codex  | `/codex diagnostics [note]`             |
| Запустити завдання ACP/acpx    | Команди сесій ACP/acpx, не `/codex`     |

| Випадок використання                                  | Налаштуйте                                                       | Перевірте                               | Примітки                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Підписка ChatGPT/Codex з нативним runtime Codex      | `openai/gpt-*` плюс увімкнений plugin `codex`                    | `/status` показує `Runtime: OpenAI Codex` | Рекомендований шлях                |
| Fail closed, якщо Codex недоступний                  | Provider або model `agentRuntime.id: "codex"`                    | Хід завершується помилкою замість PI fallback | Використовуйте для розгортань лише з Codex |
| Прямий API-key трафік OpenAI через PI                | Provider або model `agentRuntime.id: "pi"` і звичайний auth OpenAI | `/status` показує PI runtime            | Використовуйте лише коли PI навмисний |
| Legacy конфігурація                                  | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` переписує її    | Не створюйте нову конфігурацію так |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Статус завдання/сесії ACP               | Окремо від нативного Codex harness |

`agents.defaults.imageModel` дотримується такого самого розділення prefix. Використовуйте `openai/gpt-*`
для звичайного маршруту OpenAI і `codex/gpt-*` лише тоді, коли розуміння зображень
має виконуватися через обмежений хід Codex app-server. Не використовуйте
`openai-codex/gpt-*`; doctor переписує цей legacy prefix на `openai/gpt-*`.

## Шаблони розгортання

### Базове розгортання Codex

Використовуйте конфігурацію зі швидкого старту, коли всі ходи агентів OpenAI мають типово
використовувати Codex.

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
    },
  },
}
```

### Змішане розгортання provider

Ця форма залишає Claude агентом за замовчуванням і додає іменованого агента Codex:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

З цією конфігурацією агент `main` використовує свій звичайний шлях provider, а агент
`codex` використовує Codex app-server.

### Fail-closed розгортання Codex

Для ходів агентів OpenAI `openai/gpt-*` уже визначається як Codex, коли
вбудований plugin доступний. Додайте явну runtime policy, якщо хочете записане
правило fail-closed:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Коли Codex примусово заданий, OpenClaw завершується рано з помилкою, якщо plugin Codex вимкнено,
app-server занадто старий або app-server не може запуститися.

## Політика app-server

За замовчуванням plugin запускає керований OpenClaw бінарний файл Codex локально зі stdio
transport. Задавайте `appServer.command` лише тоді, коли навмисно хочете запускати
інший виконуваний файл. Використовуйте WebSocket transport лише тоді, коли app-server уже
запущений деінде:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Локальні сеанси app-server через stdio за замовчуванням використовують довірену позицію локального оператора:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Якщо локальні вимоги Codex забороняють цю
неявну позицію YOLO, OpenClaw натомість вибирає дозволені дозволи наглядача.
Коли для сеансу активна пісочниця OpenClaw, OpenClaw звужує Codex
`danger-full-access` до Codex `workspace-write`, щоб нативні ходи Codex у
режимі коду залишалися в межах ізольованого робочого простору.

Використовуйте режим наглядача, коли потрібна нативна автоперевірка Codex перед
виходом із пісочниці або наданням додаткових дозволів:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Режим наглядача розгортається в схвалення Codex app-server, зазвичай
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` і
`sandbox: "workspace-write"`, коли локальні вимоги дозволяють ці значення.

Для кожного поля app-server, порядку автентифікації, ізоляції середовища,
виявлення та поведінки тайм-аутів див. [довідник Codex harness](/uk/plugins/codex-harness-reference).

## Команди й діагностика

Вбудований Plugin реєструє `/codex` як slash-команду на будь-якому каналі, що
підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` перевіряє з’єднання з app-server, моделі, обліковий запис, обмеження швидкості,
  сервери MCP і Skills.
- `/codex models` виводить список активних моделей Codex app-server.
- `/codex threads [filter]` виводить список нещодавніх потоків Codex app-server.
- `/codex resume <thread-id>` прив’язує поточний сеанс OpenClaw до
  наявного потоку Codex.
- `/codex compact` просить Codex app-server виконати Compaction прив’язаного потоку.
- `/codex review` запускає нативний перегляд Codex для прив’язаного потоку.
- `/codex diagnostics [note]` запитує підтвердження перед надсиланням відгуку Codex для
  прив’язаного потоку.
- `/codex account` показує стан облікового запису та обмежень швидкості.
- `/codex mcp` виводить стан серверів MCP Codex app-server.
- `/codex skills` виводить Skills Codex app-server.

Для більшості звітів підтримки почніть із `/diagnostics [note]` у розмові,
де сталася помилка. Це створює один діагностичний звіт Gateway і, для сеансів
Codex harness, запитує схвалення на надсилання відповідного пакета відгуку Codex.
Див. [експорт діагностики](/uk/gateway/diagnostics), щоб дізнатися про модель приватності та поведінку
в групових чатах.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам потрібне саме
завантаження відгуку Codex для поточного прив’язаного потоку без повного
діагностичного пакета Gateway.

### Локальна перевірка потоків Codex

Найшвидший спосіб перевірити невдалий запуск Codex часто полягає в тому, щоб відкрити нативний потік Codex
безпосередньо:

```bash
codex resume <thread-id>
```

Отримайте ідентифікатор потоку із завершеної відповіді `/diagnostics`, `/codex binding` або
`/codex threads [filter]`.

Щодо механіки завантаження та меж діагностики на рівні середовища виконання див.
[середовище виконання Codex harness](/uk/plugins/codex-harness-runtime#codex-feedback-upload).

Автентифікація вибирається в такому порядку:

1. Упорядковані профілі автентифікації OpenAI для агента, бажано в
   `auth.order.openai`. Наявні ідентифікатори профілів `openai-codex:*` залишаються чинними.
2. Наявний обліковий запис app-server у Codex home цього агента.
3. Лише для локальних запусків app-server через stdio: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли обліковий запис app-server відсутній, а автентифікація OpenAI
   усе ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він видаляє
`CODEX_API_KEY` і `OPENAI_API_KEY` із породженого дочірнього процесу Codex. Це
залишає API-ключі рівня Gateway доступними для embedding або прямих моделей OpenAI
без випадкового тарифікування нативних ходів Codex app-server через API.
Явні профілі API-ключів Codex і локальний резервний env-key для stdio використовують вхід app-server
замість успадкованого середовища дочірнього процесу. WebSocket-з’єднання app-server
не отримують резервний API-ключ із середовища Gateway; використовуйте явний профіль автентифікації або
власний обліковий запис віддаленого app-server.

Якщо профіль підписки досягає ліміту використання Codex, OpenClaw записує час скидання,
коли Codex його повідомляє, і пробує наступний упорядкований профіль автентифікації для того самого
запуску Codex. Коли час скидання минає, профіль підписки знову стає придатним
без зміни вибраної моделі `openai/gpt-*` або середовища виконання Codex.

Якщо розгортанню потрібна додаткова ізоляція середовища, додайте ці змінні до
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` впливає лише на породжений дочірній процес Codex app-server.

Динамічні інструменти Codex за замовчуванням завантажуються як `searchable`. OpenClaw не відкриває
динамічні інструменти, що дублюють нативні операції Codex з робочим простором: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` і `update_plan`. Решта інструментів інтеграції OpenClaw,
як-от обмін повідомленнями, сеанси, медіа, cron, браузер, вузли,
gateway, `heartbeat_respond` і `web_search`, доступні через пошук інструментів Codex
у просторі імен `openclaw`, що зменшує початковий контекст моделі.
`sessions_yield` і відповіді джерела лише для інструментів повідомлень залишаються прямими, бо це
контракти керування ходом. Інструкції співпраці Heartbeat повідомляють Codex, що потрібно
шукати `heartbeat_respond` перед завершенням ходу heartbeat, коли інструмент
ще не завантажено.

Встановлюйте `codexDynamicToolsLoading: "direct"` лише під час підключення до власного Codex
app-server, який не може шукати відкладені динамічні інструменти, або під час налагодження повного
навантаження інструментів.

Підтримувані поля верхнього рівня Plugin Codex:

| Поле                       | За замовчуванням | Значення                                                                                 |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"`   | Використовуйте `"direct"`, щоб помістити динамічні інструменти OpenClaw безпосередньо в початковий контекст інструментів Codex. |
| `codexDynamicToolsExclude` | `[]`             | Додаткові імена динамічних інструментів OpenClaw, які слід пропускати в ходах Codex app-server. |
| `codexPlugins`             | вимкнено         | Нативна підтримка Plugin/app Codex для перенесених curated plugins, установлених із вихідного коду. |

Підтримувані поля `appServer`:

| Поле                          | За замовчуванням                                    | Значення                                                                                                                                                                                                                                |
| ----------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                           | `"stdio"` породжує Codex; `"websocket"` підключається до `url`.                                                                                                                                                                        |
| `command`                     | керований двійковий файл Codex                     | Виконуваний файл для stdio transport. Залиште незаданим, щоб використовувати керований двійковий файл; задавайте лише для явного перевизначення.                                                                                      |
| `args`                        | `["app-server", "--listen", "stdio://"]`            | Аргументи для stdio transport.                                                                                                                                                                                                         |
| `url`                         | не задано                                           | URL WebSocket app-server.                                                                                                                                                                                                              |
| `authToken`                   | не задано                                           | Bearer token для WebSocket transport.                                                                                                                                                                                                  |
| `headers`                     | `{}`                                                | Додаткові заголовки WebSocket.                                                                                                                                                                                                         |
| `clearEnv`                    | `[]`                                                | Імена додаткових змінних середовища, видалених із породженого процесу stdio app-server після того, як OpenClaw побудує успадковане середовище. `CODEX_HOME` і `HOME` зарезервовані для ізоляції Codex на рівні агента OpenClaw під час локальних запусків. |
| `requestTimeoutMs`            | `60000`                                             | Тайм-аут для викликів control-plane app-server.                                                                                                                                                                                        |
| `turnCompletionIdleTimeoutMs` | `60000`                                             | Тихе вікно після запиту Codex app-server у межах ходу, поки OpenClaw очікує `turn/completed`. Збільшуйте його для повільних фаз синтезу після інструментів або лише зі статусами.                                                    |
| `mode`                        | `"yolo"`, якщо локальні вимоги Codex не забороняють YOLO | Набір параметрів для YOLO або виконання з перевіркою наглядачем. Локальні вимоги stdio, які не містять `danger-full-access`, схвалення `never` або рецензента `user`, роблять неявним типовим режимом режим наглядача.                |
| `approvalPolicy`              | `"never"` або дозволена політика схвалення наглядача | Нативна політика схвалення Codex, що надсилається під час start/resume/turn потоку. Типові значення наглядача надають перевагу `"on-request"`, коли це дозволено.                                                                     |
| `sandbox`                     | `"danger-full-access"` або дозволена пісочниця наглядача | Нативний режим пісочниці Codex, що надсилається під час start/resume потоку. Типові значення наглядача надають перевагу `"workspace-write"`, коли це дозволено, інакше `"read-only"`. Коли активна пісочниця OpenClaw, `danger-full-access` звужується до `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` або дозволений рецензент наглядача          | Використовуйте `"auto_review"`, щоб дозволити Codex перевіряти нативні запити схвалення, коли це дозволено; інакше `guardian_subagent` або `user`. `guardian_subagent` залишається застарілим псевдонімом.                           |
| `serviceTier`                 | не задано                                           | Необов’язковий рівень сервісу Codex app-server. `"priority"` вмикає fast-mode routing, `"flex"` запитує flex processing, `null` очищає перевизначення, а застаріле `"fast"` приймається як `"priority"`.                               |

Виклики динамічних інструментів, що належать OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: запити Codex `item/tool/call` за замовчуванням використовують 30-секундний
watchdog OpenClaw. Додатний аргумент `timeoutMs` для окремого виклику розширює
або скорочує бюджет саме цього інструмента. Інструмент `image_generate` також використовує
`agents.defaults.imageGenerationModel.timeoutMs`, коли виклик інструмента не
надає власного таймауту, а інструмент `image` для розуміння медіа використовує
`tools.media.image.timeoutSeconds` або свій 60-секундний стандарт для медіа. Бюджети динамічних інструментів
обмежені 600000 мс. У разі таймауту OpenClaw перериває сигнал інструмента
там, де це підтримується, і повертає Codex невдалу відповідь динамічного інструмента, щоб хід
міг продовжитися замість того, щоб залишати сесію в `processing`.

Після того як OpenClaw відповідає на запит app-server у межах ходу Codex, harness
також очікує, що Codex завершить нативний хід через `turn/completed`. Якщо
app-server мовчить протягом `appServer.turnCompletionIdleTimeoutMs` після цієї
відповіді, OpenClaw у режимі best-effort перериває хід Codex, записує діагностичний
таймаут і звільняє смугу сесії OpenClaw, щоб наступні повідомлення чату
не ставали в чергу за застарілим нативним ходом. Будь-яке нетермінальне сповіщення для
того самого ходу, включно з `rawResponseItem/completed`, вимикає цей короткий watchdog,
бо Codex довів, що хід досі активний; довший термінальний watchdog
продовжує захищати справді завислі ходи. Глобальні сповіщення app-server,
наприклад оновлення лімітів частоти, не скидають прогрес простою ходу. Коли Codex видає
завершений елемент `agentMessage`, а потім мовчить без `turn/completed`,
OpenClaw вважає вивід асистента фактично завершеним, у режимі best-effort
перериває нативний хід Codex і звільняє смугу сесії. Діагностика таймаутів
містить останній метод сповіщення app-server і, для сирих
елементів відповіді асистента, тип елемента, роль, ідентифікатор і обмежений попередній перегляд тексту
асистента.

Перевизначення середовища залишаються доступними для локального тестування:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` обходить керований бінарний файл, коли
`appServer.command` не задано.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Config
бажаніша для повторюваних розгортань, бо вона зберігає поведінку Plugin у
тому самому перевіреному файлі, що й решта налаштування harness Codex.

## Нативні плагіни Codex

Підтримка нативних плагінів Codex використовує власні можливості app і plugin
app-server Codex у тому самому потоці Codex, що й хід harness OpenClaw. OpenClaw
не перетворює плагіни Codex на синтетичні динамічні інструменти OpenClaw
`codex_plugin_*`.

`codexPlugins` впливає лише на сесії, які вибирають нативний harness Codex. Він
не впливає на запуски PI, звичайні запуски провайдера OpenAI, прив'язки розмов ACP
або інші harness.

Мінімальна мігрована config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Config app потоку обчислюється, коли OpenClaw встановлює сесію harness Codex
або замінює застарілу прив'язку потоку Codex. Вона не переобчислюється на кожному ході.
Після зміни `codexPlugins` використайте `/new`, `/reset` або перезапустіть Gateway, щоб
майбутні сесії harness Codex стартували з оновленим набором app.

Про критерії міграції, інвентар app, політику руйнівних дій,
запити уточнення та діагностику нативних plugin див.
[Нативні плагіни Codex](/uk/plugins/codex-native-plugins).

## Використання комп'ютера

Використання комп'ютера описано в окремому посібнику з налаштування:
[Використання комп'ютера Codex](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не постачає app для керування робочим столом і не виконує
дії на робочому столі самостійно. Він готує app-server Codex, перевіряє, що
MCP-сервер `computer-use` доступний, а потім дозволяє Codex володіти нативними
викликами інструментів MCP під час ходів у режимі Codex.

## Межі виконання

Harness Codex змінює лише низькорівневий вбудований виконавець агента.

- Динамічні інструменти OpenClaw підтримуються. Codex просить OpenClaw виконати ці
  інструменти, тому OpenClaw залишається в шляху виконання.
- Нативні shell, patch, MCP і нативні app-інструменти Codex належать Codex.
  OpenClaw може спостерігати або блокувати вибрані нативні події через підтримуваний
  relay, але він не переписує аргументи нативних інструментів.
- Codex володіє нативною Compaction. OpenClaw зберігає дзеркало транскрипту для історії
  каналу, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness.
- Генерація медіа, розуміння медіа, TTS, схвалення і вивід messaging-tool
  продовжують проходити через відповідні налаштування провайдера/моделі OpenClaw.
- `tool_result_persist` застосовується до результатів інструментів транскрипту, що належать OpenClaw, а не
  до записів результатів нативних інструментів Codex.

Про шари хуків, підтримувані поверхні V1, обробку нативних дозволів, керування чергою,
механіку завантаження відгуків Codex і подробиці Compaction див.
[Середовище виконання harness Codex](/uk/plugins/codex-harness-runtime).

## Усунення несправностей

**Codex не відображається як звичайний провайдер `/model`:** це очікувано для
нових config. Виберіть модель `openai/gpt-*`, увімкніть
`plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає
`codex`.

**OpenClaw використовує PI замість Codex:** переконайтеся, що посилання на модель є
`openai/gpt-*` на офіційному провайдері OpenAI і що Plugin Codex
встановлений та увімкнений. Якщо під час тестування потрібен строгий доказ, задайте для провайдера або
моделі `agentRuntime.id: "codex"`. Примусовий runtime Codex завершується невдачею замість
повернення до PI.

**Застаріла config `openai-codex/*` лишається:** запустіть `openclaw doctor --fix`.
Doctor переписує застарілі посилання на моделі в `openai/*`, видаляє застарілі піни runtime для сесії та
всього агента, і зберігає наявні перевизначення auth-profile.

**app-server відхилено:** використовуйте app-server Codex `0.125.0` або новіший.
Передрелізи тієї самої версії або версії із суфіксом збірки, як-от
`0.125.0-alpha.2` або `0.125.0+custom`, відхиляються, бо OpenClaw перевіряє
стабільний мінімум протоколу `0.125.0`.

**`/codex status` не може підключитися:** перевірте, що вбудований Plugin `codex`
увімкнений, що `plugins.allow` містить його, коли налаштовано allowlist, і
що будь-які користувацькі `appServer.command`, `url`, `authToken` або headers є валідними.

**Виявлення моделей повільне:** зменште
`plugins.entries.codex.config.discovery.timeoutMs` або вимкніть виявлення. Див.
[Довідник harness Codex](/uk/plugins/codex-harness-reference#model-discovery).

**Транспорт WebSocket одразу завершується невдачею:** перевірте `appServer.url`, `authToken`,
headers і те, що віддалений app-server використовує ту саму версію протоколу app-server
Codex.

**Модель не Codex використовує PI:** це очікувано, якщо політика runtime провайдера або моделі
не маршрутизує її до іншого harness. Звичайні посилання на провайдерів не OpenAI залишаються на
своєму звичайному шляху провайдера в режимі `auto`.

**Computer Use встановлено, але інструменти не запускаються:** перевірте
`/codex computer-use status` із нової сесії. Якщо інструмент повідомляє
`Native hook relay unavailable`, використайте `/new` або `/reset`; якщо це не минає, перезапустіть
Gateway, щоб очистити застарілі реєстрації нативних хуків. Див.
[Використання комп'ютера Codex](/uk/plugins/codex-computer-use#troubleshooting).

## Пов'язане

- [Довідник harness Codex](/uk/plugins/codex-harness-reference)
- [Середовище виконання harness Codex](/uk/plugins/codex-harness-runtime)
- [Нативні плагіни Codex](/uk/plugins/codex-native-plugins)
- [Використання комп'ютера Codex](/uk/plugins/codex-computer-use)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Провайдер OpenAI](/uk/providers/openai)
- [Плагіни harness агента](/uk/plugins/sdk-agent-harness)
- [Хуки Plugin](/uk/plugins/hooks)
- [Експорт діагностики](/uk/gateway/diagnostics)
- [Статус](/uk/cli/status)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
