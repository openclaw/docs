---
read_when:
    - Ви хочете використовувати вбудовану обв’язку app-server Codex
    - Вам потрібні приклади конфігурації обв’язки Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість повернення до Pi
summary: Запускайте цикли вбудованого агента OpenClaw через комплектну обв’язку app-server Codex
title: Обв’язка Codex
x-i18n:
    generated_at: "2026-05-11T20:46:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Вбудований Plugin `codex` дає OpenClaw змогу виконувати вбудовані ходи агента OpenAI
через Codex app-server замість вбудованого PI harness.

Використовуйте Codex harness, коли хочете, щоб Codex керував низькорівневою сесією агента:
нативне відновлення ланцюжка, нативне продовження інструментів, нативна Compaction і
виконання app-server. OpenClaw і далі керує каналами чату, файлами сесій, вибором моделі,
динамічними інструментами OpenClaw, схваленнями, доставкою медіа та видимим
дзеркалом транскрипту.

Звичайне налаштування використовує канонічні посилання на моделі OpenAI, як-от `openai/gpt-5.5`.
Не налаштовуйте посилання на моделі `openai-codex/gpt-*`. Розміщуйте порядок автентифікації агента OpenAI
у `auth.order.openai`; старі профілі `openai-codex:*` і
записи `auth.order.openai-codex` залишаються підтримуваними для наявних інсталяцій.

OpenClaw запускає ланцюжки Codex app-server із нативним режимом коду Codex і
увімкненим режимом лише коду. Це тримає відкладені/доступні для пошуку динамічні інструменти OpenClaw
усередині власного виконання коду й поверхні пошуку інструментів Codex, замість додавання
обгортки пошуку інструментів у стилі PI поверх Codex.

Щоб зрозуміти ширший поділ моделі/провайдера/середовища виконання, почніть з
[Середовищ виконання агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — середовище виконання, а Telegram,
Discord, Slack або інший канал залишається поверхнею комунікації.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- Якщо ваша конфігурація використовує `plugins.allow`, додайте `codex`.
- Codex app-server `0.125.0` або новіший. Вбудований Plugin типово керує сумісним
  бінарним файлом Codex app-server, тому локальні команди `codex` у `PATH` не
  впливають на звичайний запуск harness.
- Автентифікація Codex доступна через `openclaw models auth login --provider openai-codex`,
  обліковий запис app-server у Codex home агента або явний профіль автентифікації Codex API-key.

Про пріоритет автентифікації, ізоляцію середовища, користувацькі команди app-server, виявлення моделей
і всі поля конфігурації див.
[Довідник Codex harness](/uk/plugins/codex-harness-reference).

## Швидкий старт

Більшість користувачів, які хочуть Codex в OpenClaw, потребують такого шляху: увійти з
підпискою ChatGPT/Codex, увімкнути вбудований Plugin `codex` і використовувати
канонічне посилання на модель `openai/gpt-*`.

Увійдіть через Codex OAuth:

```bash
openclaw models auth login --provider openai-codex
```

Увімкніть вбудований Plugin `codex` і виберіть модель агента OpenAI:

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

Перезапустіть Gateway після зміни конфігурації Plugin. Якщо наявний чат уже
має сесію, використайте `/new` або `/reset` перед тестуванням змін середовища виконання, щоб наступний
хід визначив harness із поточної конфігурації.

## Конфігурація

Конфігурація швидкого старту — це мінімально придатна конфігурація Codex harness. Налаштовуйте параметри Codex
harness у конфігурації OpenClaw, а CLI використовуйте лише для автентифікації Codex:

| Потреба                                | Установіть                                                                        | Де                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Увімкнути harness                      | `plugins.entries.codex.enabled: true`                                            | Конфігурація OpenClaw              |
| Зберегти інсталяцію Plugin зі списком дозволених | Додайте `codex` у `plugins.allow`                                                | Конфігурація OpenClaw              |
| Маршрутизувати ходи агента OpenAI через Codex | `agents.defaults.model` або `agents.list[].model` як `openai/gpt-*`              | Конфігурація агента OpenClaw       |
| Увійти через Codex OAuth               | `openclaw models auth login --provider openai-codex`                             | Профіль автентифікації CLI         |
| Додати резерв API-key для запусків Codex | Профіль API-key `openai:*`, указаний після автентифікації за підпискою в `auth.order.openai` | Профіль автентифікації CLI + конфігурація OpenClaw |
| Завершуватися помилкою, коли Codex недоступний | `agentRuntime.id: "codex"` провайдера або моделі                                | Конфігурація моделі/провайдера OpenClaw |
| Використовувати прямий трафік OpenAI API | `agentRuntime.id: "pi"` провайдера або моделі зі звичайною автентифікацією OpenAI | Конфігурація моделі/провайдера OpenClaw |
| Налаштувати поведінку app-server       | `plugins.entries.codex.config.appServer.*`                                       | Конфігурація Codex Plugin          |
| Увімкнути нативні застосунки Plugin Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Конфігурація Codex Plugin          |
| Увімкнути Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Конфігурація Codex Plugin          |

Використовуйте посилання на моделі `openai/gpt-*` для ходів агента OpenAI, що працюють через Codex. Надавайте перевагу
`auth.order.openai` для порядку «спершу підписка/резерв API-key». Наявні
профілі автентифікації `openai-codex:*` і `auth.order.openai-codex` залишаються чинними, але
не записуйте нові посилання на моделі `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

У такій формі обидва профілі все одно виконуються через Codex для ходів агента
`openai/gpt-*`. API key є лише резервом автентифікації, а не запитом на перехід до PI або
звичайного OpenAI Responses.

Решта цієї сторінки описує поширені варіанти, між якими користувачі мають вибрати:
форма розгортання, маршрутизація із завершенням помилкою, політика схвалення guardian, нативні Codex
plugins і Computer Use. Повні списки параметрів, типові значення, enums, виявлення,
ізоляцію середовища, тайм-аути та поля транспорту app-server див. у
[Довіднику Codex harness](/uk/plugins/codex-harness-reference).

## Перевірка середовища виконання Codex

Використайте `/status` у чаті, де очікуєте Codex. Хід агента OpenAI через Codex
показує:

```text
Runtime: OpenAI Codex
```

Потім перевірте стан Codex app-server:

```text
/codex status
/codex models
```

`/codex status` повідомляє про з’єднання з app-server, обліковий запис, ліміти швидкості, MCP
servers і skills. `/codex models` перелічує живий каталог Codex app-server для
harness і облікового запису. Якщо `/status` неочікуваний, див.
[Усунення несправностей](#troubleshooting).

## Маршрутизація та вибір моделі

Тримайте посилання провайдерів і політику середовища виконання окремо:

- Використовуйте `openai/gpt-*` для ходів агента OpenAI через Codex.
- Не використовуйте `openai-codex/gpt-*` у конфігурації. Запустіть `openclaw doctor --fix`, щоб
  виправити застарілі посилання й застарілі прив’язки маршруту сесії.
- `agentRuntime.id: "codex"` необов’язковий для звичайного автоматичного режиму OpenAI, але корисний,
  коли розгортання має завершуватися помилкою, якщо Codex недоступний.
- `agentRuntime.id: "pi"` переводить провайдера або модель у пряму поведінку PI, коли
  це зроблено навмисно.
- `/codex ...` керує нативними розмовами Codex app-server із чату.
- ACP/acpx — це окремий шлях зовнішнього harness. Використовуйте його лише тоді, коли користувач просить
  ACP/acpx або адаптер зовнішнього harness.

Поширена маршрутизація команд:

| Намір користувача               | Використайте                            |
| ------------------------------- | --------------------------------------- |
| Приєднати поточний чат          | `/codex bind [--cwd <path>]`            |
| Відновити наявний ланцюжок Codex | `/codex resume <thread-id>`             |
| Перелічити або фільтрувати ланцюжки Codex | `/codex threads [filter]`               |
| Надіслати лише відгук Codex     | `/codex diagnostics [note]`             |
| Запустити завдання ACP/acpx     | Команди сесії ACP/acpx, не `/codex`     |

| Випадок використання                                  | Налаштуйте                                                       | Перевірте                               | Примітки                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Підписка ChatGPT/Codex із нативним середовищем виконання Codex | `openai/gpt-*` плюс увімкнений Plugin `codex`                    | `/status` показує `Runtime: OpenAI Codex` | Рекомендований шлях                |
| Завершуватися помилкою, якщо Codex недоступний       | `agentRuntime.id: "codex"` провайдера або моделі                 | Хід завершується помилкою замість fallback PI | Використовуйте для розгортань лише з Codex |
| Прямий трафік OpenAI API-key через PI                | `agentRuntime.id: "pi"` провайдера або моделі та звичайна автентифікація OpenAI | `/status` показує середовище виконання PI | Використовуйте лише коли PI навмисний |
| Застаріла конфігурація                               | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` переписує її    | Не пишіть нову конфігурацію так    |
| Адаптер ACP/acpx Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                         | Стан завдання/сесії ACP                 | Окремо від нативного Codex harness |

`agents.defaults.imageModel` використовує той самий поділ за префіксом. Використовуйте `openai/gpt-*`
для звичайного маршруту OpenAI і `codex/gpt-*` лише коли розуміння зображень
має виконуватися через обмежений хід Codex app-server. Не використовуйте
`openai-codex/gpt-*`; doctor переписує цей застарілий префікс на `openai/gpt-*`.

## Патерни розгортання

### Базове розгортання Codex

Використовуйте конфігурацію швидкого старту, коли всі ходи агента OpenAI мають типово
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

### Змішане розгортання провайдерів

Ця форма залишає Claude типовим агентом і додає іменованого агента Codex:

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

З цією конфігурацією агент `main` використовує свій звичайний шлях провайдера, а агент
`codex` використовує Codex app-server.

### Розгортання Codex із завершенням помилкою

Для ходів агента OpenAI `openai/gpt-*` уже визначається як Codex, коли
вбудований Plugin доступний. Додайте явну політику середовища виконання, коли хочете записане
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

Коли Codex примусово задано, OpenClaw завершується рано, якщо Codex Plugin вимкнено,
app-server занадто старий або app-server не може запуститися.

## Політика app-server

Типово Plugin запускає керований OpenClaw бінарний файл Codex локально з транспортом stdio.
Задавайте `appServer.command` лише тоді, коли навмисно хочете запустити
інший виконуваний файл. Використовуйте транспорт WebSocket лише коли app-server уже
працює в іншому місці:

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

Локальні сеанси app-server stdio за замовчуванням використовують довірену позицію локального оператора:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Якщо локальні вимоги Codex не дозволяють цю
неявну позицію YOLO, OpenClaw натомість вибирає дозволені дозволи guardian.
Коли для сеансу активна пісочниця OpenClaw, OpenClaw звужує Codex
`danger-full-access` до Codex `workspace-write`, щоб нативні ходи Codex у режимі коду
залишалися в межах робочої області в пісочниці.

Використовуйте режим guardian, коли хочете нативний автоогляд Codex перед виходами
з пісочниці або додатковими дозволами:

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

Режим guardian розгортається в затвердження app-server Codex, зазвичай
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` і
`sandbox: "workspace-write"`, коли локальні вимоги дозволяють ці значення.

Для кожного поля app-server, порядку автентифікації, ізоляції середовища, виявлення та
поведінки тайм-аутів див. [довідник Codex harness](/uk/plugins/codex-harness-reference).

## Команди та діагностика

Вбудований Plugin реєструє `/codex` як slash-команду в будь-якому каналі, що
підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` перевіряє підключення app-server, моделі, обліковий запис, обмеження частоти,
  MCP-сервери та Skills.
- `/codex models` перелічує активні моделі app-server Codex.
- `/codex threads [filter]` перелічує нещодавні потоки app-server Codex.
- `/codex resume <thread-id>` прив’язує поточний сеанс OpenClaw до
  наявного потоку Codex.
- `/codex compact` просить app-server Codex стиснути прив’язаний потік.
- `/codex review` запускає нативний огляд Codex для прив’язаного потоку.
- `/codex diagnostics [note]` запитує перед надсиланням відгуку Codex для
  прив’язаного потоку.
- `/codex account` показує стан облікового запису та обмежень частоти.
- `/codex mcp` перелічує стан MCP-серверів app-server Codex.
- `/codex skills` перелічує Skills app-server Codex.

Для більшості звітів у підтримку почніть із `/diagnostics [note]` у розмові,
де сталася помилка. Це створює один діагностичний звіт Gateway і, для сеансів
Codex harness, запитує дозвіл на надсилання відповідного пакета відгуку Codex.
Див. [експорт діагностики](/uk/gateway/diagnostics) щодо моделі приватності та поведінки
в групових чатах.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам конкретно потрібне
завантаження відгуку Codex для поточного прив’язаного потоку без повного
діагностичного пакета Gateway.

### Локальний огляд потоків Codex

Найшвидший спосіб дослідити невдалий запуск Codex часто полягає в тому, щоб відкрити нативний потік Codex
безпосередньо:

```bash
codex resume <thread-id>
```

Отримайте ідентифікатор потоку з завершеної відповіді `/diagnostics`, `/codex binding` або
`/codex threads [filter]`.

Про механіку завантаження та межі діагностики на рівні середовища виконання див.
[середовище виконання Codex harness](/uk/plugins/codex-harness-runtime#codex-feedback-upload).

Автентифікація вибирається в такому порядку:

1. Впорядковані профілі автентифікації OpenAI для агента, бажано в
   `auth.order.openai`. Наявні ідентифікатори профілів `openai-codex:*` залишаються чинними.
2. Наявний обліковий запис app-server у Codex home цього агента.
3. Лише для локальних запусків app-server stdio: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли облікового запису app-server немає, а автентифікація OpenAI
   все ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він видаляє
`CODEX_API_KEY` і `OPENAI_API_KEY` зі створеного дочірнього процесу Codex. Це
залишає API-ключі рівня Gateway доступними для embeddings або прямих моделей OpenAI,
не змушуючи нативні ходи app-server Codex випадково оплачуватися через API.
Явні профілі API-ключів Codex і локальний резервний варіант env-key stdio використовують вхід app-server
замість успадкованого середовища дочірнього процесу. Підключення app-server WebSocket
не отримують резервний API-ключ середовища Gateway; використовуйте явний профіль автентифікації або
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

`appServer.clearEnv` впливає лише на створений дочірній процес app-server Codex.

Динамічні інструменти Codex за замовчуванням використовують завантаження `searchable`. OpenClaw не надає
динамічні інструменти, що дублюють нативні операції Codex із робочою областю: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` і `update_plan`. Решта інтеграційних інструментів OpenClaw,
як-от обмін повідомленнями, сеанси, медіа, cron, браузер, вузли,
gateway, `heartbeat_respond` і `web_search`, доступні через пошук інструментів Codex
у просторі імен `openclaw`, що зменшує початковий контекст моделі.
`sessions_yield` і відповіді джерела лише для message-tool залишаються прямими, оскільки це
контракти керування ходом. Інструкції співпраці Heartbeat повідомляють Codex
шукати `heartbeat_respond` перед завершенням ходу Heartbeat, коли інструмент
ще не завантажено.

Встановлюйте `codexDynamicToolsLoading: "direct"` лише під час підключення до власного app-server Codex,
який не може шукати відкладені динамічні інструменти, або під час налагодження повного
набору інструментів.

Підтримувані поля верхнього рівня Plugin Codex:

| Поле                       | За замовчуванням | Значення                                                                                  |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"`   | Використовуйте `"direct"`, щоб помістити динамічні інструменти OpenClaw безпосередньо в початковий контекст інструментів Codex. |
| `codexDynamicToolsExclude` | `[]`             | Додаткові імена динамічних інструментів OpenClaw, які слід пропустити в ходах app-server Codex. |
| `codexPlugins`             | вимкнено         | Нативна підтримка Plugin/застосунків Codex для перенесених кураторських plugins, установлених із джерела. |

Підтримувані поля `appServer`:

| Поле                          | За замовчуванням                                     | Значення                                                                                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                            | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                                                                                                                                                       |
| `command`                     | керований двійковий файл Codex                       | Виконуваний файл для транспорту stdio. Залиште невстановленим, щоб використовувати керований двійковий файл; встановлюйте лише для явного перевизначення.                                                                             |
| `args`                        | `["app-server", "--listen", "stdio://"]`             | Аргументи для транспорту stdio.                                                                                                                                                                                                        |
| `url`                         | не встановлено                                       | URL app-server WebSocket.                                                                                                                                                                                                              |
| `authToken`                   | не встановлено                                       | Bearer-токен для транспорту WebSocket.                                                                                                                                                                                                 |
| `headers`                     | `{}`                                                 | Додаткові заголовки WebSocket.                                                                                                                                                                                                         |
| `clearEnv`                    | `[]`                                                 | Додаткові імена змінних середовища, вилучені зі створеного процесу app-server stdio після того, як OpenClaw побудує успадковане середовище. `CODEX_HOME` і `HOME` зарезервовані для ізоляції Codex за агентами в OpenClaw під час локальних запусків. |
| `requestTimeoutMs`            | `60000`                                              | Тайм-аут для викликів площини керування app-server.                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs` | `60000`                                              | Тихе вікно після запиту app-server Codex у межах ходу, поки OpenClaw чекає на `turn/completed`. Збільште його для повільних фаз синтезу після інструментів або лише зі статусом.                                                      |
| `mode`                        | `"yolo"`, якщо локальні вимоги Codex не забороняють YOLO | Пресет для виконання YOLO або виконання з оглядом guardian. Локальні вимоги stdio, що пропускають `danger-full-access`, затвердження `never` або рецензента `user`, роблять неявне значення за замовчуванням guardian.                |
| `approvalPolicy`              | `"never"` або дозволена політика затвердження guardian | Нативна політика затвердження Codex, яку надсилають під час старту/відновлення/ходу потоку. Значення guardian за замовчуванням віддають перевагу `"on-request"`, коли це дозволено.                                                  |
| `sandbox`                     | `"danger-full-access"` або дозволена пісочниця guardian | Нативний режим пісочниці Codex, який надсилають під час старту/відновлення потоку. Значення guardian за замовчуванням віддають перевагу `"workspace-write"`, коли це дозволено, інакше `"read-only"`. Коли активна пісочниця OpenClaw, `danger-full-access` звужується до `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` або дозволений рецензент guardian           | Використовуйте `"auto_review"`, щоб дозволити Codex оглядати нативні запити затвердження, коли це дозволено, інакше `guardian_subagent` або `user`. `guardian_subagent` залишається застарілим псевдонімом.                            |
| `serviceTier`                 | не встановлено                                       | Необов’язковий рівень сервісу app-server Codex. `"priority"` вмикає маршрутизацію fast-mode, `"flex"` запитує flex-обробку, `null` очищає перевизначення, а застаріле `"fast"` приймається як `"priority"`.                            |

Динамічні виклики інструментів, що належать OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: запити Codex `item/tool/call` типово використовують 30-секундний
сторожовий таймер OpenClaw. Додатний аргумент `timeoutMs` для окремого виклику подовжує
або скорочує бюджет саме цього інструмента. Інструмент `image_generate` також використовує
`agents.defaults.imageGenerationModel.timeoutMs`, коли виклик інструмента не надає
власного тайм-ауту, а інструмент розуміння медіа `image` використовує
`tools.media.image.timeoutSeconds` або свій 60-секундний медійний типовий тайм-аут. Бюджети динамічних інструментів
обмежені 600000 мс. У разі тайм-ауту OpenClaw перериває сигнал інструмента
там, де це підтримується, і повертає Codex невдалу відповідь динамічного інструмента, щоб хід
міг продовжитися, а не залишав сеанс у `processing`.

Після того як OpenClaw відповідає на обмежений ходом запит app-server Codex, harness
також очікує, що Codex завершить нативний хід через `turn/completed`. Якщо
app-server мовчить протягом `appServer.turnCompletionIdleTimeoutMs` після цієї
відповіді, OpenClaw у режимі найкращої спроби перериває хід Codex, записує діагностичний
тайм-аут і звільняє смугу сеансу OpenClaw, щоб наступні повідомлення чату
не ставали в чергу за застарілим нативним ходом. Будь-яке нетермінальне сповіщення для
того самого ходу, зокрема `rawResponseItem/completed`, вимикає цей короткий сторожовий таймер,
оскільки Codex довів, що хід усе ще активний; довший термінальний сторожовий таймер
продовжує захищати справді завислі ходи. Діагностика тайм-ауту включає
останній метод сповіщення app-server і, для raw-елементів відповіді асистента,
тип елемента, роль, id і обмежений попередній перегляд тексту асистента.

Перевизначення через середовище залишаються доступними для локального тестування:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` обходить керований бінарний файл, коли
`appServer.command` не задано.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування. Конфігурація
бажаніша для повторюваних розгортань, оскільки вона тримає поведінку Plugin в тому
самому перевіреному файлі, що й решту налаштування harness Codex.

## Нативні Plugin-и Codex

Підтримка нативних Plugin-ів Codex використовує власні можливості app і Plugin
app-server Codex у тому самому потоці Codex, що й хід harness OpenClaw. OpenClaw
не перетворює Plugin-и Codex на синтетичні динамічні інструменти OpenClaw
`codex_plugin_*`.

`codexPlugins` впливає лише на сеанси, які вибирають нативний harness Codex. Він
не впливає на запуски PI, звичайні запуски провайдера OpenAI, прив’язки розмов
ACP або інші harness-и.

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
            allow_destructive_actions: false,
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

Конфігурація app потоку обчислюється, коли OpenClaw встановлює сеанс harness Codex
або замінює застарілу прив’язку потоку Codex. Вона не переобчислюється на кожному ході.
Після зміни `codexPlugins` використайте `/new`, `/reset` або перезапустіть gateway, щоб
майбутні сеанси harness Codex стартували з оновленим набором app.

Докладніше про придатність до міграції, інвентар app, політику руйнівних дій,
elicitations і діагностику нативних Plugin-ів див.
[Нативні Plugin-и Codex](/uk/plugins/codex-native-plugins).

## Computer Use

Computer Use описано в окремому посібнику з налаштування:
[Codex Computer Use](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не постачає вендорськи app керування робочим столом і не виконує
дії на робочому столі самостійно. Він готує app-server Codex, перевіряє, що
MCP-сервер `computer-use` доступний, а потім дозволяє Codex володіти нативними викликами
інструментів MCP під час ходів у режимі Codex.

## Межі runtime

Harness Codex змінює лише низькорівневий вбудований виконавець агента.

- Динамічні інструменти OpenClaw підтримуються. Codex просить OpenClaw виконати ці
  інструменти, тому OpenClaw залишається на шляху виконання.
- Нативні shell, patch, MCP та інструменти app Codex належать Codex.
  OpenClaw може спостерігати або блокувати вибрані нативні події через підтримуваний
  relay, але не переписує аргументи нативних інструментів.
- Codex володіє нативною Compaction. OpenClaw зберігає дзеркало transcript для історії
  каналу, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness.
- Генерація медіа, розуміння медіа, TTS, approvals і вивід messaging-tool
  і надалі проходять через відповідні налаштування провайдера/моделі OpenClaw.
- `tool_result_persist` застосовується до результатів інструментів transcript, що належать OpenClaw, а не
  до записів результатів нативних інструментів Codex.

Про шари hook, підтримувані поверхні V1, обробку нативних дозволів, скеровування черги,
механіку вивантаження відгуку Codex і деталі compaction див.
[runtime harness Codex](/uk/plugins/codex-harness-runtime).

## Усунення несправностей

**Codex не відображається як звичайний провайдер `/model`:** це очікувано для
нових конфігурацій. Виберіть модель `openai/gpt-*`, увімкніть
`plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає
`codex`.

**OpenClaw використовує PI замість Codex:** переконайтеся, що посилання на модель є
`openai/gpt-*` на офіційному провайдері OpenAI і що Plugin Codex
встановлений та увімкнений. Якщо під час тестування потрібен строгий доказ, задайте для провайдера або
моделі `agentRuntime.id: "codex"`. Примусовий runtime Codex завершується помилкою замість
відкату до PI.

**Залишилася застаріла конфігурація `openai-codex/*`:** запустіть `openclaw doctor --fix`.
Doctor переписує застарілі посилання на моделі на `openai/*`, вилучає застарілі session- і
whole-agent-піни runtime та зберігає наявні перевизначення auth-profile.

**app-server відхилено:** використовуйте app-server Codex `0.125.0` або новіший.
Передрелізи тієї самої версії або версії з суфіксом збірки, як-от
`0.125.0-alpha.2` чи `0.125.0+custom`, відхиляються, бо OpenClaw перевіряє
стабільний мінімальний рівень протоколу `0.125.0`.

**`/codex status` не може підключитися:** перевірте, що вбудований Plugin `codex`
увімкнений, що `plugins.allow` включає його, коли налаштовано allowlist, і
що будь-які власні `appServer.command`, `url`, `authToken` або заголовки є чинними.

**Виявлення моделей повільне:** зменште
`plugins.entries.codex.config.discovery.timeoutMs` або вимкніть виявлення. Див.
[довідник harness Codex](/uk/plugins/codex-harness-reference#model-discovery).

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`,
заголовки, а також що віддалений app-server підтримує ту саму версію протоколу app-server
Codex.

**Модель не Codex використовує PI:** це очікувано, якщо політика runtime провайдера або моделі
не маршрутизує її до іншого harness. Звичайні посилання на провайдерів не OpenAI залишаються на
своєму нормальному шляху провайдера в режимі `auto`.

**Computer Use встановлено, але інструменти не запускаються:** перевірте
`/codex computer-use status` з нового сеансу. Якщо інструмент повідомляє
`Native hook relay unavailable`, використайте `/new` або `/reset`; якщо проблема не зникає, перезапустіть
gateway, щоб очистити застарілі реєстрації нативних hook. Див.
[Codex Computer Use](/uk/plugins/codex-computer-use#troubleshooting).

## Пов’язане

- [Довідник harness Codex](/uk/plugins/codex-harness-reference)
- [runtime harness Codex](/uk/plugins/codex-harness-runtime)
- [Нативні Plugin-и Codex](/uk/plugins/codex-native-plugins)
- [Codex Computer Use](/uk/plugins/codex-computer-use)
- [Runtime агентів](/uk/concepts/agent-runtimes)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Провайдер OpenAI](/uk/providers/openai)
- [Plugin-и agent harness](/uk/plugins/sdk-agent-harness)
- [Hook-и Plugin](/uk/plugins/hooks)
- [Експорт діагностики](/uk/gateway/diagnostics)
- [Статус](/uk/cli/status)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
