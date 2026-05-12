---
read_when:
    - Ви хочете використовувати комплектну обв’язку app-server Codex
    - Вам потрібні приклади конфігурації середовища Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість переходу на PI
summary: Запуск ходів вбудованого агента OpenClaw через комплектну обв’язку app-server Codex
title: Обв’язка Codex
x-i18n:
    generated_at: "2026-05-12T00:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Комплектний Plugin `codex` дає OpenClaw змогу виконувати вбудовані ходи агента OpenAI
через app-server Codex замість вбудованої обв’язки PI.

Використовуйте обв’язку Codex, коли хочете, щоб Codex відповідав за низькорівневу сесію агента:
нативне відновлення гілки, нативне продовження інструментів, нативна Compaction і
виконання app-server. OpenClaw і далі відповідає за канали чату, файли сесій, вибір моделі,
динамічні інструменти OpenClaw, схвалення, доставку медіа та видиме дзеркало стенограми.

Звичайне налаштування використовує канонічні посилання на моделі OpenAI, як-от `openai/gpt-5.5`.
Не налаштовуйте посилання на моделі `openai-codex/gpt-*`. Розміщуйте порядок автентифікації агентів OpenAI
у `auth.order.openai`; старі профілі `openai-codex:*` і
записи `auth.order.openai-codex` лишаються підтримуваними для наявних інсталяцій.

OpenClaw запускає гілки app-server Codex із нативним режимом коду Codex і
увімкненим режимом лише коду. Це тримає відкладені/пошукові динамічні інструменти OpenClaw
у власному виконанні коду Codex і поверхні пошуку інструментів, замість додавання
обгортки пошуку інструментів у стилі PI поверх Codex.

Щоб ознайомитися з ширшим розділенням моделі/провайдера/runtime, почніть з
[Runtime агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — це runtime, а Telegram,
Discord, Slack або інший канал лишається поверхнею комунікації.

## Вимоги

- OpenClaw із доступним комплектним Plugin `codex`.
- Якщо ваша конфігурація використовує `plugins.allow`, додайте `codex`.
- app-server Codex `0.125.0` або новіший. Комплектний Plugin типово керує сумісним
  бінарним файлом app-server Codex, тому локальні команди `codex` у `PATH` не
  впливають на звичайний запуск обв’язки.
- Автентифікація Codex, доступна через `openclaw models auth login --provider openai-codex`,
  обліковий запис app-server у Codex home агента або явний профіль автентифікації Codex API-key.

Про пріоритет автентифікації, ізоляцію середовища, власні команди app-server, виявлення моделей
і всі поля конфігурації див.
[Довідник обв’язки Codex](/uk/plugins/codex-harness-reference).

## Швидкий старт

Більшість користувачів, які хочуть Codex в OpenClaw, потребують такого шляху: увійти з
підпискою ChatGPT/Codex, увімкнути комплектний Plugin `codex` і використати
канонічне посилання на модель `openai/gpt-*`.

Увійдіть через Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Увімкніть комплектний Plugin `codex` і виберіть модель агента OpenAI:

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

Перезапустіть gateway після зміни конфігурації Plugin. Якщо наявний чат уже
має сесію, використайте `/new` або `/reset` перед тестуванням змін runtime, щоб наступний
хід визначив обв’язку з поточної конфігурації.

## Конфігурація

Конфігурація зі швидкого старту — це мінімально життєздатна конфігурація обв’язки Codex. Налаштовуйте
параметри обв’язки Codex у конфігурації OpenClaw, а CLI використовуйте лише для автентифікації Codex:

| Потреба                                | Налаштуйте                                                                       | Де                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Увімкнути обв’язку                     | `plugins.entries.codex.enabled: true`                                            | Конфігурація OpenClaw              |
| Зберегти інсталяцію Plugin зі списком дозволених | Додайте `codex` у `plugins.allow`                                                | Конфігурація OpenClaw              |
| Спрямовувати ходи агента OpenAI через Codex | `agents.defaults.model` або `agents.list[].model` як `openai/gpt-*`              | Конфігурація агента OpenClaw       |
| Увійти через Codex OAuth               | `openclaw models auth login --provider openai-codex`                             | Профіль автентифікації CLI         |
| Додати резервний API-key для запусків Codex | Профіль API-key `openai:*`, указаний після автентифікації за підпискою в `auth.order.openai` | Профіль автентифікації CLI + конфігурація OpenClaw |
| Завершуватися помилкою, коли Codex недоступний | Provider або модель `agentRuntime.id: "codex"`                                   | Конфігурація моделі/provider OpenClaw |
| Використовувати прямий трафік OpenAI API | Provider або модель `agentRuntime.id: "pi"` зі звичайною автентифікацією OpenAI  | Конфігурація моделі/provider OpenClaw |
| Налаштувати поведінку app-server       | `plugins.entries.codex.config.appServer.*`                                       | Конфігурація Plugin Codex          |
| Увімкнути нативні Plugin-додатки Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Конфігурація Plugin Codex          |
| Увімкнути Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Конфігурація Plugin Codex          |

Використовуйте посилання на моделі `openai/gpt-*` для ходів агента OpenAI з підтримкою Codex. Надавайте перевагу
`auth.order.openai` для порядку «спершу підписка/резервний API-key». Наявні
профілі автентифікації `openai-codex:*` і `auth.order.openai-codex` лишаються чинними, але
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

У такій формі обидва профілі все одно запускаються через Codex для ходів агента
`openai/gpt-*`. API key — це лише резерв автентифікації, а не запит на перемикання на PI або
звичайні OpenAI Responses.

Решта цієї сторінки охоплює поширені варіанти, між якими користувачі мають обрати:
схема розгортання, маршрутизація із завершенням помилкою, політика схвалення guardian, нативні Plugin
Codex і Computer Use. Повні списки параметрів, значення за замовчуванням, enums, виявлення,
ізоляцію середовища, тайм-аути та поля транспорту app-server див. у
[довіднику обв’язки Codex](/uk/plugins/codex-harness-reference).

## Перевірка runtime Codex

Використайте `/status` у чаті, де очікуєте Codex. Хід агента OpenAI з підтримкою Codex
показує:

```text
Runtime: OpenAI Codex
```

Потім перевірте стан app-server Codex:

```text
/codex status
/codex models
```

`/codex status` повідомляє про підключення app-server, обліковий запис, ліміти частоти, MCP
servers і skills. `/codex models` показує live-каталог app-server Codex для
обв’язки й облікового запису. Якщо `/status` неочікуваний, див.
[Усунення несправностей](#troubleshooting).

## Маршрутизація та вибір моделі

Тримайте посилання provider і політику runtime окремо:

- Використовуйте `openai/gpt-*` для ходів агента OpenAI через Codex.
- Не використовуйте `openai-codex/gpt-*` у конфігурації. Запустіть `openclaw doctor --fix`, щоб
  виправити застарілі посилання та старі прив’язки маршруту сесії.
- `agentRuntime.id: "codex"` необов’язковий для звичайного автоматичного режиму OpenAI, але корисний,
  коли розгортання має завершуватися помилкою, якщо Codex недоступний.
- `agentRuntime.id: "pi"` переводить provider або модель на пряму поведінку PI, коли
  це зроблено навмисно.
- `/codex ...` керує нативними розмовами app-server Codex із чату.
- ACP/acpx — це окремий зовнішній шлях обв’язки. Використовуйте його лише тоді, коли користувач просить
  ACP/acpx або зовнішній адаптер обв’язки.

Поширена маршрутизація команд:

| Намір користувача              | Використовуйте                         |
| ------------------------------ | -------------------------------------- |
| Прикріпити поточний чат        | `/codex bind [--cwd <path>]`           |
| Відновити наявну гілку Codex   | `/codex resume <thread-id>`            |
| Перелічити або відфільтрувати гілки Codex | `/codex threads [filter]`              |
| Надіслати лише відгук Codex    | `/codex diagnostics [note]`            |
| Запустити завдання ACP/acpx    | Команди сесій ACP/acpx, не `/codex`    |

| Випадок використання                               | Налаштуйте                                                       | Перевірте                               | Примітки                           |
| -------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Підписка ChatGPT/Codex із нативним runtime Codex   | `openai/gpt-*` плюс увімкнений Plugin `codex`                    | `/status` показує `Runtime: OpenAI Codex` | Рекомендований шлях                |
| Завершуватися помилкою, якщо Codex недоступний     | Provider або модель `agentRuntime.id: "codex"`                   | Хід завершується помилкою замість fallback на PI | Використовуйте для розгортань лише з Codex |
| Прямий трафік OpenAI API-key через PI              | Provider або модель `agentRuntime.id: "pi"` і звичайна автентифікація OpenAI | `/status` показує runtime PI            | Використовуйте лише коли PI навмисний |
| Застаріла конфігурація                             | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` переписує її    | Не створюйте нову конфігурацію так |
| Адаптер ACP/acpx Codex                             | ACP `sessions_spawn({ runtime: "acp" })`                         | Стан завдання/сесії ACP                 | Окремо від нативної обв’язки Codex |

`agents.defaults.imageModel` дотримується такого самого розділення префіксів. Використовуйте `openai/gpt-*`
для звичайного маршруту OpenAI і `codex/gpt-*` лише тоді, коли розуміння зображень
має виконуватися через обмежений хід app-server Codex. Не використовуйте
`openai-codex/gpt-*`; doctor переписує цей застарілий префікс на `openai/gpt-*`.

## Шаблони розгортання

### Базове розгортання Codex

Використовуйте конфігурацію зі швидкого старту, коли всі ходи агента OpenAI мають типово використовувати Codex.

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

Ця форма зберігає Claude як типового агента й додає іменованого агента Codex:

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

З цією конфігурацією агент `main` використовує свій звичайний шлях provider, а
агент `codex` використовує app-server Codex.

### Розгортання Codex із завершенням помилкою

Для ходів агента OpenAI `openai/gpt-*` уже визначається як Codex, коли
комплектний Plugin доступний. Додайте явну політику runtime, коли хочете письмове
правило завершення помилкою:

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

Коли Codex примусово задано, OpenClaw завершується рано, якщо Plugin Codex вимкнено,
app-server занадто старий або app-server не може запуститися.

## Політика app-server

Типово Plugin запускає керований OpenClaw бінарний файл Codex локально з transport stdio.
Задавайте `appServer.command` лише коли навмисно хочете запустити
інший виконуваний файл. Використовуйте WebSocket transport лише тоді, коли app-server уже
запущений в іншому місці:

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
неявну позицію YOLO, OpenClaw натомість вибирає дозволені дозволи guardian.
Коли для сеансу активна пісочниця OpenClaw, OpenClaw звужує Codex
`danger-full-access` до Codex `workspace-write`, щоб нативні ходи режиму коду
Codex залишалися в межах робочої області в пісочниці.

Використовуйте режим guardian, коли потрібна нативна автоматична перевірка
Codex перед виходами з пісочниці або наданням додаткових дозволів:

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

Режим guardian розгортається в схвалення app-server Codex, зазвичай
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` і
`sandbox: "workspace-write"`, коли локальні вимоги дозволяють ці значення.

Для кожного поля app-server, порядку автентифікації, ізоляції середовища,
виявлення та поведінки тайм-аутів див. [довідник Codex harness](/uk/plugins/codex-harness-reference).

## Команди та діагностика

Вбудований Plugin реєструє `/codex` як slash-команду в будь-якому каналі, що
підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` перевіряє підключення app-server, моделі, обліковий запис, ліміти швидкості,
  MCP-сервери та Skills.
- `/codex models` перелічує активні моделі app-server Codex.
- `/codex threads [filter]` перелічує нещодавні треди app-server Codex.
- `/codex resume <thread-id>` прив'язує поточний сеанс OpenClaw до
  наявного треду Codex.
- `/codex compact` просить app-server Codex стиснути прив'язаний тред.
- `/codex review` запускає нативну перевірку Codex для прив'язаного треду.
- `/codex diagnostics [note]` запитує перед надсиланням відгуку Codex для
  прив'язаного треду.
- `/codex account` показує стан облікового запису та лімітів швидкості.
- `/codex mcp` перелічує стан MCP-серверів app-server Codex.
- `/codex skills` перелічує Skills app-server Codex.

Для більшості звітів підтримки починайте з `/diagnostics [note]` у розмові,
де сталася помилка. Вона створює один діагностичний звіт Gateway і, для сеансів
Codex harness, запитує схвалення на надсилання відповідного пакета відгуку
Codex. Див. [експорт діагностики](/uk/gateway/diagnostics) щодо моделі
приватності та поведінки групового чату.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам конкретно потрібне
завантаження відгуку Codex для поточного прив'язаного треду без повного
діагностичного пакета Gateway.

### Локальна перевірка тредів Codex

Найшвидший спосіб перевірити невдалий запуск Codex часто полягає в тому, щоб
відкрити нативний тред Codex безпосередньо:

```bash
codex resume <thread-id>
```

Отримайте thread id із завершеної відповіді `/diagnostics`, `/codex binding` або
`/codex threads [filter]`.

Щодо механіки завантаження та меж діагностики на рівні runtime див.
[runtime Codex harness](/uk/plugins/codex-harness-runtime#codex-feedback-upload).

Автентифікація вибирається в такому порядку:

1. Упорядковані профілі автентифікації OpenAI для агента, бажано в
   `auth.order.openai`. Наявні id профілів `openai-codex:*` залишаються чинними.
2. Наявний обліковий запис app-server у Codex home цього агента.
3. Лише для локальних запусків app-server через stdio: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли обліковий запис app-server відсутній, а автентифікація
   OpenAI усе ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він
видаляє `CODEX_API_KEY` і `OPENAI_API_KEY` із породженого дочірнього процесу
Codex. Це залишає API-ключі рівня Gateway доступними для embeddings або прямих
моделей OpenAI, не змушуючи нативні ходи app-server Codex випадково
тарифікуватися через API. Явні профілі API-ключів Codex і локальний резервний
варіант env-ключа stdio використовують логін app-server замість успадкованого
env дочірнього процесу. Підключення app-server через WebSocket не отримують
резервний API-ключ env Gateway; використовуйте явний профіль автентифікації або
власний обліковий запис віддаленого app-server.

Якщо профіль підписки досягає ліміту використання Codex, OpenClaw записує час
скидання, коли Codex його повідомляє, і пробує наступний упорядкований профіль
автентифікації для того самого запуску Codex. Коли час скидання минає, профіль
підписки знову стає придатним без зміни вибраної моделі `openai/gpt-*` або
runtime Codex.

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

`appServer.clearEnv` впливає лише на породжений дочірній процес app-server Codex.

Динамічні інструменти Codex за замовчуванням завантажуються як `searchable`.
OpenClaw не надає динамічні інструменти, що дублюють нативні операції Codex з
робочою областю: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` і
`update_plan`. Решта інтеграційних інструментів OpenClaw, як-от messaging,
sessions, media, cron, browser, nodes, gateway, `heartbeat_respond` і
`web_search`, доступні через пошук інструментів Codex у просторі імен
`openclaw`, що зменшує початковий контекст моделі.
`sessions_yield` і відповіді джерела лише через інструмент повідомлень
залишаються прямими, бо це контракти керування ходом. Інструкції співпраці
Heartbeat кажуть Codex шукати `heartbeat_respond` перед завершенням ходу
Heartbeat, коли інструмент ще не завантажений.

Установлюйте `codexDynamicToolsLoading: "direct"` лише під час підключення до
спеціального app-server Codex, який не може шукати відкладені динамічні
інструменти, або під час налагодження повного payload інструментів.

Підтримувані поля верхнього рівня Plugin Codex:

| Поле                       | Типове значення | Значення                                                                                 |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"`  | Використовуйте `"direct"`, щоб розмістити динамічні інструменти OpenClaw безпосередньо в початковому контексті інструментів Codex. |
| `codexDynamicToolsExclude` | `[]`            | Додаткові назви динамічних інструментів OpenClaw, які треба omit з ходів app-server Codex.              |
| `codexPlugins`             | вимкнено        | Нативна підтримка plugin/app Codex для мігрованих встановлених із джерела curated plugins.           |

Підтримувані поля `appServer`:

| Поле                          | Типове значення                                       | Значення                                                                                                                                                                                                                                |
| ----------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` породжує Codex; `"websocket"` підключається до `url`.                                                                                                                                                                        |
| `command`                     | керований бінарний файл Codex                         | Виконуваний файл для транспорту stdio. Залиште невстановленим, щоб використовувати керований бінарний файл; задавайте лише для явного перевизначення.                                                                                  |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | Аргументи для транспорту stdio.                                                                                                                                                                                                         |
| `url`                         | не встановлено                                        | URL app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | не встановлено                                        | Bearer token для транспорту WebSocket.                                                                                                                                                                                                  |
| `headers`                     | `{}`                                                  | Додаткові заголовки WebSocket.                                                                                                                                                                                                          |
| `clearEnv`                    | `[]`                                                  | Додаткові назви змінних середовища, вилучені з породженого процесу app-server stdio після того, як OpenClaw побудує своє успадковане середовище. `CODEX_HOME` і `HOME` зарезервовані для ізоляції Codex на рівні агента OpenClaw під час локальних запусків. |
| `requestTimeoutMs`            | `60000`                                               | Тайм-аут для викликів control-plane app-server.                                                                                                                                                                                        |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | Тихе вікно після запиту app-server Codex у межах ходу, поки OpenClaw чекає на `turn/completed`. Збільште це значення для повільних фаз синтезу після інструментів або лише зі статусом.                                               |
| `mode`                        | `"yolo"`, якщо локальні вимоги Codex не забороняють YOLO | Preset для виконання YOLO або виконання з перевіркою guardian. Локальні вимоги stdio, що omit `danger-full-access`, схвалення `never` або reviewer `user`, роблять неявне типове значення guardian.                                  |
| `approvalPolicy`              | `"never"` або дозволена політика схвалення guardian   | Нативна політика схвалення Codex, що надсилається до start/resume/turn треду. Типові значення guardian надають перевагу `"on-request"`, коли це дозволено.                                                                             |
| `sandbox`                     | `"danger-full-access"` або дозволена пісочниця guardian | Нативний режим пісочниці Codex, що надсилається до start/resume треду. Типові значення guardian надають перевагу `"workspace-write"`, коли це дозволено, інакше `"read-only"`. Коли активна пісочниця OpenClaw, `danger-full-access` звужується до `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` або дозволений reviewer guardian             | Використовуйте `"auto_review"`, щоб дозволити Codex перевіряти нативні запити схвалення, коли це дозволено, інакше `guardian_subagent` або `user`. `guardian_subagent` залишається legacy alias.                                      |
| `serviceTier`                 | не встановлено                                        | Необов'язковий service tier app-server Codex. `"priority"` вмикає routing fast-mode, `"flex"` запитує flex processing, `null` очищає override, а legacy `"fast"` приймається як `"priority"`.                                         |

Динамічні виклики інструментів, якими володіє OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: запити Codex `item/tool/call` типово використовують 30-секундний
сторожовий таймер OpenClaw. Додатний аргумент `timeoutMs` для окремого виклику подовжує
або скорочує бюджет саме цього інструмента. Інструмент `image_generate` також використовує
`agents.defaults.imageGenerationModel.timeoutMs`, коли виклик інструмента не надає
власний таймаут, а інструмент `image` для розуміння медіа використовує
`tools.media.image.timeoutSeconds` або своє 60-секундне типове значення для медіа. Бюджети
динамічних інструментів обмежені 600000 мс. У разі таймауту OpenClaw перериває сигнал
інструмента там, де це підтримується, і повертає Codex невдалу відповідь динамічного
інструмента, щоб хід міг продовжитися, а не залишати сеанс у стані `processing`.

Після того як OpenClaw відповідає на запит app-server у межах ходу Codex, harness
також очікує, що Codex завершить нативний хід через `turn/completed`. Якщо
app-server мовчить протягом `appServer.turnCompletionIdleTimeoutMs` після цієї
відповіді, OpenClaw у режимі best-effort перериває хід Codex, записує діагностичний
таймаут і звільняє смугу сеансу OpenClaw, щоб подальші повідомлення чату не
ставали в чергу за застарілим нативним ходом. Будь-яке нетермінальне сповіщення для
того самого ходу, зокрема `rawResponseItem/completed`, вимикає цей короткий
сторожовий таймер, бо Codex довів, що хід досі живий; довший термінальний сторожовий
таймер продовжує захищати справді завислі ходи. Діагностика таймауту містить
останній метод сповіщення app-server і, для сирих елементів відповіді асистента,
тип елемента, роль, id і обмежений попередній перегляд тексту асистента.

Перевизначення через середовище залишаються доступними для локального тестування:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` обходить керований двійковий файл, коли
`appServer.command` не задано.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
є бажаною для повторюваних розгортань, бо вона тримає поведінку plugin у тому самому
переглянутому файлі, що й решту налаштувань Codex harness.

## Нативні plugins Codex

Підтримка нативних Codex plugins використовує власні можливості app і plugin
Codex app-server у тому самому потоці Codex, що й хід OpenClaw harness. OpenClaw
не перетворює Codex plugins на синтетичні динамічні інструменти OpenClaw
`codex_plugin_*`.

`codexPlugins` впливає лише на сеанси, які вибирають нативний Codex harness. Він
не впливає на запуски PI, звичайні запуски провайдера OpenAI, прив'язки розмов
ACP або інші harnesses.

Мінімальна мігрована конфігурація:

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

Конфігурація app для потоку обчислюється, коли OpenClaw встановлює сеанс Codex harness
або замінює застарілу прив'язку потоку Codex. Вона не переобчислюється на кожному
ході. Після зміни `codexPlugins` використайте `/new`, `/reset` або перезапустіть gateway,
щоб майбутні сеанси Codex harness починалися з оновленим набором apps.

Щодо придатності до міграції, інвентарю apps, політики деструктивних дій,
elicitations і діагностики нативних plugin див.
[Нативні Codex plugins](/uk/plugins/codex-native-plugins).

## Computer Use

Computer Use описано в окремому посібнику з налаштування:
[Codex Computer Use](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не вбудовує app для керування робочим столом і не виконує
дії на робочому столі самостійно. Він готує Codex app-server, перевіряє, що MCP-сервер
`computer-use` доступний, а потім дозволяє Codex володіти нативними викликами
інструментів MCP під час ходів у режимі Codex.

## Межі runtime

Codex harness змінює лише низькорівневий вбудований виконавець агента.

- Динамічні інструменти OpenClaw підтримуються. Codex просить OpenClaw виконати ці
  інструменти, тому OpenClaw залишається на шляху виконання.
- Нативні для Codex shell, patch, MCP і нативні app tools належать Codex.
  OpenClaw може спостерігати або блокувати вибрані нативні події через підтримуваний
  relay, але він не переписує аргументи нативних інструментів.
- Codex володіє нативним compaction. OpenClaw зберігає дзеркало транскрипту для історії
  каналів, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness.
- Генерація медіа, розуміння медіа, TTS, approvals і вивід messaging-tool
  продовжують проходити через відповідні налаштування провайдера/моделі OpenClaw.
- `tool_result_persist` застосовується до результатів інструментів транскрипту, якими
  володіє OpenClaw, а не до записів результатів нативних інструментів Codex.

Щодо шарів hook, підтримуваних поверхонь V1, обробки нативних дозволів, керування
чергою, механіки завантаження відгуків Codex і деталей compaction див.
[Runtime Codex harness](/uk/plugins/codex-harness-runtime).

## Усунення несправностей

**Codex не відображається як звичайний провайдер `/model`:** це очікувано для
нових конфігурацій. Виберіть модель `openai/gpt-*`, увімкніть
`plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає
`codex`.

**OpenClaw використовує PI замість Codex:** переконайтеся, що посилання на модель є
`openai/gpt-*` на офіційному провайдері OpenAI, а Codex plugin встановлено й
увімкнено. Якщо під час тестування потрібен суворий доказ, задайте для провайдера або
моделі `agentRuntime.id: "codex"`. Примусовий runtime Codex завершується помилкою,
а не повертається до PI.

**Залишилася застаріла конфігурація `openai-codex/*`:** виконайте `openclaw doctor --fix`.
Doctor переписує застарілі посилання на моделі в `openai/*`, вилучає застарілі
закріплення runtime сеансів і всього агента та зберігає наявні перевизначення
auth-profile.

**app-server відхилено:** використовуйте Codex app-server `0.125.0` або новіший.
Пререлізи тієї самої версії або версії з суфіксом збірки, як-от
`0.125.0-alpha.2` чи `0.125.0+custom`, відхиляються, бо OpenClaw перевіряє
стабільний мінімум протоколу `0.125.0`.

**`/codex status` не може підключитися:** перевірте, що вбудований plugin `codex`
увімкнено, що `plugins.allow` містить його, коли налаштовано allowlist, і що всі
власні `appServer.command`, `url`, `authToken` або headers є коректними.

**Виявлення моделей повільне:** зменште
`plugins.entries.codex.config.discovery.timeoutMs` або вимкніть виявлення. Див.
[Довідник Codex harness](/uk/plugins/codex-harness-reference#model-discovery).

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`,
headers і те, що віддалений app-server використовує ту саму версію протоколу
Codex app-server.

**Модель не Codex використовує PI:** це очікувано, якщо політика runtime провайдера
або моделі не спрямовує її до іншого harness. Звичайні посилання на провайдерів
не OpenAI залишаються на своєму нормальному шляху провайдера в режимі `auto`.

**Computer Use встановлено, але інструменти не запускаються:** перевірте
`/codex computer-use status` із нового сеансу. Якщо інструмент повідомляє
`Native hook relay unavailable`, використайте `/new` або `/reset`; якщо це не зникає,
перезапустіть gateway, щоб очистити застарілі реєстрації нативних hooks. Див.
[Codex Computer Use](/uk/plugins/codex-computer-use#troubleshooting).

## Пов'язане

- [Довідник Codex harness](/uk/plugins/codex-harness-reference)
- [Runtime Codex harness](/uk/plugins/codex-harness-runtime)
- [Нативні Codex plugins](/uk/plugins/codex-native-plugins)
- [Codex Computer Use](/uk/plugins/codex-computer-use)
- [Runtimes агентів](/uk/concepts/agent-runtimes)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Провайдер OpenAI](/uk/providers/openai)
- [Plugins agent harness](/uk/plugins/sdk-agent-harness)
- [Hooks plugin](/uk/plugins/hooks)
- [Експорт діагностики](/uk/gateway/diagnostics)
- [Статус](/uk/cli/status)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
