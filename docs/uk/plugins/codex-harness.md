---
read_when:
    - Ви хочете використовувати вбудований стенд app-server для Codex
    - Вам потрібні приклади конфігурації Codex harness
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою, а не поверталися до OpenClaw
summary: Запускайте ходи вбудованого агента OpenClaw через вбудований harness app-server Codex
title: Codex harness
x-i18n:
    generated_at: "2026-06-27T17:50:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

Вбудований плагін `codex` дає OpenClaw змогу виконувати вбудовані ходи агента OpenAI
через Codex app-server замість вбудованого harness OpenClaw.

Використовуйте Codex harness, коли хочете, щоб Codex керував низькорівневим сеансом агента:
нативне відновлення треду, нативне продовження інструментів, нативна Compaction і
виконання через app-server. OpenClaw і далі керує каналами чату, файлами сеансів, вибором моделі,
динамічними інструментами OpenClaw, схваленнями, доставкою медіа та видимим
дзеркалом транскрипту.

Звичайне налаштування використовує канонічні посилання на моделі OpenAI, як-от `openai/gpt-5.5`.
Не налаштовуйте застарілі посилання Codex GPT. Розмістіть порядок автентифікації агента OpenAI
у `auth.order.openai`; старі ідентифікатори профілів автентифікації Codex і
старі записи порядку автентифікації Codex є застарілим станом, який виправляє
`openclaw doctor --fix`.

Коли жодна пісочниця OpenClaw не активна, OpenClaw запускає треди Codex app-server
з увімкненим нативним режимом коду Codex, залишаючи режим лише для коду вимкненим за замовчуванням.
Це зберігає доступними нативний робочий простір Codex і можливості коду,
а динамічні інструменти OpenClaw продовжують працювати через міст app-server `item/tool/call`.
Активна пісочниця OpenClaw і обмежені політики інструментів повністю вимикають нативний режим коду,
якщо ви не ввімкнете експериментальний шлях sandbox exec-server.

Ця нативна функція Codex відокремлена від
[режиму коду OpenClaw](/uk/reference/code-mode), який є опціональним runtime QuickJS-WASI
для загальних запусків OpenClaw з іншим форматом вхідних даних `exec`.

Щоб зрозуміти ширший поділ між моделлю, провайдером і runtime, почніть з
[Runtime агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — це runtime, а Telegram,
Discord, Slack або інший канал залишається поверхнею комунікації.

## Вимоги

- OpenClaw з доступним вбудованим плагіном `codex`.
- Якщо ваша конфігурація використовує `plugins.allow`, додайте `codex`.
- Codex app-server `0.125.0` або новіший. Вбудований плагін за замовчуванням керує сумісним
  бінарним файлом Codex app-server, тому локальні команди `codex` у `PATH` не
  впливають на звичайний запуск harness.
- Автентифікація Codex доступна через `openclaw models auth login --provider openai`,
  обліковий запис app-server у Codex home агента або явний профіль автентифікації Codex з API-ключем.

Про пріоритет автентифікації, ізоляцію середовища, власні команди app-server, виявлення моделей
і всі поля конфігурації дивіться
[довідник Codex harness](/uk/plugins/codex-harness-reference).

## Швидкий старт

Більшість користувачів, які хочуть Codex в OpenClaw, потребують такого шляху: увійти з
підпискою ChatGPT/Codex, увімкнути вбудований плагін `codex` і використовувати
канонічне посилання на модель `openai/gpt-*`.

Увійдіть через Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Увімкніть вбудований плагін `codex` і виберіть модель агента OpenAI:

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

Перезапустіть Gateway після зміни конфігурації плагінів. Якщо наявний чат уже
має сеанс, використайте `/new` або `/reset` перед перевіркою змін runtime, щоб наступний
хід визначив harness з поточної конфігурації.

## Конфігурація

Конфігурація зі швидкого старту — це мінімально життєздатна конфігурація Codex harness. Задавайте параметри Codex
harness у конфігурації OpenClaw, а CLI використовуйте лише для автентифікації Codex:

| Потреба                                | Задайте                                                                          | Де                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Увімкнути harness                      | `plugins.entries.codex.enabled: true`                                            | Конфігурація OpenClaw              |
| Зберегти встановлення плагіна зі списку дозволених | Додайте `codex` у `plugins.allow`                                                | Конфігурація OpenClaw              |
| Спрямувати ходи агента OpenAI через Codex | `agents.defaults.model` або `agents.list[].model` як `openai/gpt-*`              | Конфігурація агента OpenClaw       |
| Увійти через ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | Профіль автентифікації CLI         |
| Додати резервний API-ключ для запусків Codex | профіль API-ключа `openai:*`, зазначений після автентифікації підписки в `auth.order.openai` | Профіль автентифікації CLI + конфігурація OpenClaw |
| Завершувати з помилкою, коли Codex недоступний | `agentRuntime.id: "codex"` для провайдера або моделі                             | Конфігурація моделі/провайдера OpenClaw |
| Використовувати прямий трафік OpenAI API | `agentRuntime.id: "openclaw"` для провайдера або моделі зі звичайною автентифікацією OpenAI | Конфігурація моделі/провайдера OpenClaw |
| Налаштувати поведінку app-server       | `plugins.entries.codex.config.appServer.*`                                       | Конфігурація плагіна Codex         |
| Увімкнути нативні застосунки плагінів Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Конфігурація плагіна Codex         |
| Увімкнути Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Конфігурація плагіна Codex         |

Використовуйте посилання на моделі `openai/gpt-*` для ходів агентів OpenAI, підтриманих Codex. Надавайте перевагу
`auth.order.openai` для порядку спочатку підписка, потім резервний API-ключ. Наявні
старі ідентифікатори профілів автентифікації Codex і старий порядок автентифікації Codex є застарілим станом лише для doctor;
не записуйте нові застарілі посилання Codex GPT.

Не задавайте `compaction.model` або `compaction.provider` для агентів, підтриманих Codex.
Codex виконує ущільнення через нативний стан треду app-server, тому OpenClaw ігнорує
ці локальні перевизначення підсумовувача під час runtime, а `openclaw doctor --fix` видаляє
їх, коли агент використовує Codex.

Lossless і надалі підтримується як контекстний рушій для складання, приймання й
обслуговування навколо ходів Codex. Налаштовуйте його через
`plugins.slots.contextEngine: "lossless-claw"` і
`plugins.entries.lossless-claw.config.summaryModel`, а не через
`agents.defaults.compaction.provider`. `openclaw doctor --fix` мігрує старий
формат `compaction.provider: "lossless-claw"` до слота контекстного рушія Lossless,
коли Codex є активним runtime, але нативний Codex і далі керує Compaction.

Нативний Codex app-server harness підтримує контекстні рушії, які потребують
попереднього складання промпту. Загальні CLI-бекенди, включно з `codex-cli`, не надають
такої можливості хоста.

Для агентів, підтриманих Codex, `/compact` запускає нативну Compaction Codex app-server у
прив'язаному треді. OpenClaw не чекає завершення, не накладає тайм-аут OpenClaw,
не перезапускає спільний app-server і не переходить резервно до контекстного рушія або
публічного підсумовувача OpenAI. Якщо нативна прив'язка треду Codex відсутня або
застаріла, команда завершується закритою помилкою, щоб оператор бачив реальну межу runtime
замість тихого перемикання бекендів Compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

У такому форматі обидва профілі все одно проходять через Codex для ходів агента
`openai/gpt-*`. API-ключ є лише резервом автентифікації, а не запитом на перемикання до OpenClaw або
звичайних OpenAI Responses.

Решта цієї сторінки описує поширені варіанти, між якими користувачі мають вибрати:
форма розгортання, маршрутизація з відмовою в закритому режимі, політика схвалення guardian, нативні плагіни Codex
і Computer Use. Повні списки параметрів, значення за замовчуванням, enum-значення, виявлення,
ізоляцію середовища, тайм-аути та транспортні поля app-server дивіться в
[довіднику Codex harness](/uk/plugins/codex-harness-reference).

## Перевірка runtime Codex

Використайте `/status` у чаті, де очікуєте Codex. Хід агента OpenAI, підтриманий Codex,
показує:

```text
Runtime: OpenAI Codex
```

Потім перевірте стан Codex app-server:

```text
/codex status
/codex models
```

`/codex status` повідомляє про з'єднання з app-server, обліковий запис, ліміти швидкості, MCP
сервери та Skills. `/codex models` перелічує живий каталог Codex app-server для
harness і облікового запису. Якщо `/status` виглядає неочікувано, дивіться
[Усунення несправностей](#troubleshooting).

## Маршрутизація та вибір моделі

Тримайте посилання на провайдерів і політику runtime окремо:

- Використовуйте `openai/gpt-*` для ходів агента OpenAI через Codex.
- Не використовуйте застарілі посилання Codex GPT у конфігурації. Запустіть `openclaw doctor --fix`, щоб
  виправити застарілі посилання та несвіжі прив'язки маршрутів сеансів.
- `agentRuntime.id: "codex"` необов'язковий для звичайного автоматичного режиму OpenAI, але корисний,
  коли розгортання має завершуватися закритою помилкою, якщо Codex недоступний.
- `agentRuntime.id: "openclaw"` переводить провайдера або модель на вбудований runtime OpenClaw,
  коли це навмисно.
- `/codex ...` керує нативними розмовами Codex app-server із чату.
- ACP/acpx — це окремий шлях зовнішнього harness. Використовуйте його лише тоді, коли користувач просить
  ACP/acpx або адаптер зовнішнього harness.

Типова маршрутизація команд:

| Намір користувача                                   | Використовуйте                                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Приєднати поточний чат                              | `/codex bind [--cwd <path>]`                                                                          |
| Відновити наявний тред Codex                        | `/codex resume <thread-id>`                                                                           |
| Перелічити або відфільтрувати треди Codex           | `/codex threads [filter]`                                                                             |
| Перелічити нативні плагіни Codex                    | `/codex plugins list`                                                                                 |
| Увімкнути або вимкнути налаштований нативний плагін Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Приєднати наявний сеанс Codex CLI на спареному вузлі | `/codex sessions --host <node> [filter]`, потім `/codex resume <session-id> --host <node> --bind here` |
| Надіслати лише відгук Codex                         | `/codex diagnostics [note]`                                                                           |
| Запустити завдання ACP/acpx                         | Команди сеансу ACP/acpx, а не `/codex`                                                               |

| Сценарій використання                               | Налаштування                                                           | Перевірка                               | Примітки                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Підписка ChatGPT/Codex із нативним середовищем виконання Codex | `openai/gpt-*` плюс увімкнений plugin `codex`                          | `/status` показує `Runtime: OpenAI Codex` | Рекомендований шлях                   |
| Відмова із закриттям доступу, якщо Codex недоступний | Provider або model `agentRuntime.id: "codex"`                          | Хід завершується помилкою замість вбудованого fallback | Використовуйте для розгортань лише з Codex |
| Прямий трафік API-ключа OpenAI через OpenClaw        | Provider або model `agentRuntime.id: "openclaw"` і звичайна автентифікація OpenAI | `/status` показує середовище виконання OpenClaw | Використовуйте лише коли OpenClaw є навмисним |
| Застаріла конфігурація                               | застарілі Codex GPT refs                                               | `openclaw doctor --fix` переписує її    | Не пишіть нову конфігурацію таким способом |
| ACP/acpx адаптер Codex                               | ACP `sessions_spawn({ runtime: "acp" })`                               | Стан завдання/сесії ACP                 | Окремо від нативного harness Codex    |

`agents.defaults.imageModel` дотримується такого самого розділення за префіксом. Використовуйте `openai/gpt-*`
для звичайного маршруту OpenAI і `codex/gpt-*` лише тоді, коли розуміння зображень
має виконуватися через обмежений хід app-server Codex. Не використовуйте
застарілі Codex GPT refs; doctor переписує цей застарілий префікс на `openai/gpt-*`.

## Шаблони розгортання

### Базове розгортання Codex

Використовуйте конфігурацію quickstart, коли всі ходи агента OpenAI мають використовувати Codex за
замовчуванням.

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

Ця форма залишає Claude агентом за замовчуванням і додає іменований агент Codex:

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

### Розгортання Codex із відмовою із закриттям доступу

Для ходів агента OpenAI `openai/gpt-*` уже розв’язується до Codex, коли
вбудований plugin доступний. Додайте явну політику середовища виконання, коли потрібне письмове
правило відмови із закриттям доступу:

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

Коли Codex примусово ввімкнено, OpenClaw завершує роботу рано, якщо plugin Codex вимкнено, 
app-server занадто старий або app-server не може запуститися.

## Політика app-server

За замовчуванням plugin запускає локально керований OpenClaw бінарний файл Codex із transport stdio.
Встановлюйте `appServer.command` лише тоді, коли навмисно хочете запустити
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

Локальні stdio сесії app-server за замовчуванням використовують довірену позицію локального оператора:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Якщо локальні вимоги Codex забороняють цю
неявну YOLO-позицію, OpenClaw натомість вибирає дозволені права guardian.
Коли для сесії активна пісочниця OpenClaw, OpenClaw вимикає нативний Code Mode Codex,
користувацькі MCP-сервери та виконання plugin на базі застосунку для цього
ходу, замість того щоб покладатися на пісочницю Codex на боці хоста. Доступ до оболонки надається
через динамічні інструменти на базі пісочниці OpenClaw, такі як `sandbox_exec` і
`sandbox_process`, коли доступні звичайні інструменти exec/process.

Використовуйте нормалізований exec mode OpenClaw, коли потрібна нативна auto-review Codex перед
виходами з пісочниці або додатковими дозволами:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Для сесій app-server Codex OpenClaw відображає `tools.exec.mode: "auto"` на схвалення,
переглянуті Codex Guardian, зазвичай
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` і
`sandbox: "workspace-write"`, коли локальні вимоги дозволяють ці значення.
У `tools.exec.mode: "auto"` OpenClaw не зберігає застарілі небезпечні перевизначення Codex
`approvalPolicy: "never"` або `sandbox: "danger-full-access"`; використовуйте
`tools.exec.mode: "full"` для навмисної позиції Codex без схвалень. Застарілий
preset `plugins.entries.codex.config.appServer.mode: "guardian"` усе ще
працює, але `tools.exec.mode: "auto"` є нормалізованою поверхнею OpenClaw.

Порівняння на рівні режимів зі схваленнями host exec і дозволами ACPX дивіться в
[Режими дозволів](/uk/tools/permission-modes).

Про кожне поле app-server, порядок автентифікації, ізоляцію середовища, виявлення та
поведінку timeout дивіться [Довідник harness Codex](/uk/plugins/codex-harness-reference).

## Команди та діагностика

Вбудований plugin реєструє `/codex` як slash command у будь-якому каналі, який
підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` перевіряє підключення app-server, моделі, обліковий запис, rate limits,
  MCP-сервери та skills.
- `/codex models` показує список live моделей app-server Codex.
- `/codex threads [filter]` показує список нещодавніх threads app-server Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до
  наявного thread Codex.
- `/codex compact` просить app-server Codex стиснути приєднаний thread.
- `/codex review` запускає нативний review Codex для приєднаного thread.
- `/codex diagnostics [note]` запитує перед надсиланням feedback Codex для
  приєднаного thread.
- `/codex account` показує стан облікового запису та rate-limit.
- `/codex mcp` показує список станів MCP-серверів app-server Codex.
- `/codex skills` показує список skills app-server Codex.

Для більшості звітів підтримки починайте з `/diagnostics [note]` у розмові,
де сталася помилка. Вона створює один діагностичний звіт Gateway і, для сесій
harness Codex, просить схвалення на надсилання відповідного пакета feedback Codex.
Дивіться [Експорт діагностики](/uk/gateway/diagnostics) щодо моделі приватності та поведінки
в групових чатах.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам конкретно потрібне завантаження
feedback Codex для поточного приєднаного thread без повного діагностичного пакета
Gateway.

### Локальна перевірка threads Codex

Найшвидший спосіб перевірити невдалий запуск Codex часто полягає у відкритті нативного thread
Codex напряму:

```bash
codex resume <thread-id>
```

Отримайте thread id із завершеної відповіді `/diagnostics`, `/codex binding` або
`/codex threads [filter]`.

Про механіку завантаження та межі діагностики рівня середовища виконання дивіться
[Середовище виконання harness Codex](/uk/plugins/codex-harness-runtime#codex-feedback-upload).

Автентифікація вибирається в такому порядку:

1. Впорядковані профілі автентифікації OpenAI для агента, бажано під
   `auth.order.openai`. Запустіть `openclaw doctor --fix`, щоб мігрувати старі
   застарілі ids профілів автентифікації Codex і застарілий порядок автентифікації Codex.
2. Наявний обліковий запис app-server у Codex home цього агента.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли немає облікового запису app-server і автентифікація OpenAI
   усе ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він видаляє
`CODEX_API_KEY` і `OPENAI_API_KEY` із породженого дочірнього процесу Codex. Це
залишає API-ключі рівня Gateway доступними для embeddings або прямих моделей OpenAI
без випадкового білінгу нативних ходів app-server Codex через API.
Явні профілі API-ключів Codex і локальний fallback env-key stdio використовують login app-server
замість успадкованого env дочірнього процесу. Підключення WebSocket app-server
не отримують fallback API-ключа env Gateway; використовуйте явний профіль автентифікації або
власний обліковий запис віддаленого app-server.
Коли налаштовані нативні plugins Codex, OpenClaw встановлює або оновлює ці
plugins через підключений app-server перед тим, як відкривати застосунки, що належать plugin, для
thread Codex. `app/list` залишається джерелом істини для app ids,
доступності та metadata, але OpenClaw володіє рішенням увімкнення для кожного thread:
якщо політика дозволяє зазначений доступний app, OpenClaw надсилає
`thread/start.config.apps[appId].enabled = true`, навіть коли `app/list` наразі
повідомляє, що цей app вимкнено. Цей шлях не вигадує встановлення app для
невідомих ids; OpenClaw активує лише marketplace plugins за допомогою `plugin/install`,
а потім оновлює inventory.

Якщо профіль підписки досягає ліміту використання Codex, OpenClaw записує час reset,
коли Codex його повідомляє, і пробує наступний впорядкований профіль автентифікації для того самого
запуску Codex. Коли час reset минає, профіль підписки знову стає придатним
без зміни вибраної моделі `openai/gpt-*` або середовища виконання Codex.

Для локальних запусків stdio app-server OpenClaw встановлює `CODEX_HOME` у per-agent
каталог, щоб конфігурація Codex, файли автентифікації/облікового запису, cache/data plugin і нативний
стан thread не читали й не записували особистий `~/.codex` оператора за
замовчуванням. OpenClaw зберігає звичайний процесний `HOME`; підпроцеси, запущені Codex,
усе ще можуть знаходити конфігурацію та токени user-home, а Codex може виявляти спільні
записи `$HOME/.agents/skills` і `$HOME/.agents/plugins/marketplace.json`.

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
OpenClaw видаляє `CODEX_HOME` і `HOME` з цього списку під час нормалізації локального запуску:
`CODEX_HOME` залишається per-agent, а `HOME` залишається успадкованим, щоб
підпроцеси могли використовувати звичайний стан user-home.

Динамічні інструменти Codex типово завантажуються в режимі `searchable`. OpenClaw не надає
динамічні інструменти, що дублюють нативні операції Codex із робочим простором: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` і `update_plan`. Більшість решти
інтеграційних інструментів OpenClaw, як-от повідомлення, медіа, cron, браузер, вузли,
gateway і `heartbeat_respond`, доступні через пошук інструментів Codex у просторі імен
`openclaw`, що зменшує початковий контекст моделі. Вебпошук
типово використовує розміщений інструмент Codex `web_search`, коли пошук увімкнено й не
вибрано керованого провайдера. Нативний розміщений пошук і керований динамічний інструмент OpenClaw
`web_search` є взаємовиключними, тож керований пошук не може обійти
нативні обмеження доменів. OpenClaw використовує керований інструмент, коли розміщений пошук
недоступний, явно вимкнений або замінений вибраним керованим провайдером.
OpenClaw залишає окреме розширення Codex `web.run` вимкненим, оскільки
трафік production app-server відхиляє його визначений користувачем простір імен `web`.
`tools.web.search.enabled: false` вимикає обидва шляхи, так само як і
LLM-only запуск із вимкненими інструментами. Codex трактує `"cached"` як налаштування
переваги й розв’язує його в живий зовнішній доступ для необмежених звернень app-server.
Автоматичний керований резервний шлях закривається з помилкою, коли задано нативні
`allowedDomains`, щоб список дозволів не можна було обійти. Постійні зміни ефективної
політики пошуку перестворюють прив’язаний потік Codex перед наступним зверненням.
Тимчасові обмеження для окремого звернення використовують тимчасовий обмежений потік
і зберігають наявну прив’язку для подальшого відновлення.
`sessions_yield` і відповіді з джерелами лише інструментів повідомлень залишаються прямими, оскільки
це контракти керування зверненням. `sessions_spawn` залишається доступним для пошуку, щоб нативний
`spawn_agent` Codex лишався основною поверхнею підлеглих агентів Codex, тоді як явне
делегування OpenClaw або ACP усе ще доступне через простір імен динамічних
інструментів `openclaw`. Інструкції для співпраці через Heartbeat вказують Codex шукати
`heartbeat_respond` перед завершенням звернення Heartbeat, коли інструмент ще не
завантажено.

Установлюйте `codexDynamicToolsLoading: "direct"` лише під час підключення до власного Codex
app-server, який не може шукати відкладені динамічні інструменти, або під час налагодження повного
набору інструментів.

Підтримувані поля верхнього рівня Plugin Codex:

| Поле                       | Типове значення | Значення                                                                                 |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"`  | Використовуйте `"direct"`, щоб помістити динамічні інструменти OpenClaw безпосередньо в початковий контекст інструментів Codex. |
| `codexDynamicToolsExclude` | `[]`            | Додаткові назви динамічних інструментів OpenClaw, які слід пропускати в зверненнях Codex app-server. |
| `codexPlugins`             | вимкнено        | Нативна підтримка Plugin/app Codex для перенесених curated plugins, встановлених із джерела. |

Підтримувані поля `appServer`:

| Поле                                          | Типове значення                                        | Значення                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                                                                                                                                                                                                                                                                                                                 |
| `command`                                     | керований бінарний файл Codex                          | Виконуваний файл для транспорту stdio. Залиште незаданим, щоб використовувати керований бінарний файл; задавайте лише для явного перевизначення.                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Аргументи для транспорту stdio.                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | не задано                                              | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | не задано                                              | Bearer-токен для транспорту WebSocket. Приймає літеральний рядок або SecretInput, наприклад `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                   | Додаткові заголовки WebSocket. Значення заголовків приймають літеральні рядки або значення SecretInput, наприклад `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | Додаткові назви змінних середовища, які видаляються зі створеного процесу stdio app-server після того, як OpenClaw побудує успадковане середовище. OpenClaw зберігає окремий для агента `CODEX_HOME` і успадкований `HOME` для локальних запусків.                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | Увімкнення поверхні інструментів Codex лише для режиму коду. Динамічні інструменти OpenClaw залишаються зареєстрованими в Codex, тому вкладені виклики `tools.*` повертаються через міст app-server `item/tool/call`.                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | не задано                                              | Корінь робочого простору віддаленого Codex app-server. Коли задано, OpenClaw визначає локальний корінь робочого простору з розв’язаного робочого простору OpenClaw, зберігає поточний суфікс cwd під цим віддаленим коренем і надсилає до Codex лише фінальний cwd app-server. Якщо cwd поза розв’язаним коренем робочого простору OpenClaw, OpenClaw безпечно відмовляє замість надсилання локального шляху Gateway до віддаленого app-server. |
| `requestTimeoutMs`                            | `60000`                                                | Час очікування для викликів площини керування app-server.                                                                                                                                                                                                                                                                                                                                       |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Тихе вікно після того, як Codex приймає хід, або після запиту app-server у межах ходу, поки OpenClaw очікує `turn/completed`.                                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Запобіжник простою завершення й прогресу, що використовується після передавання інструменту, завершення нативного інструменту, сирого прогресу асистента після інструменту, завершення сирого міркування або прогресу міркування, поки OpenClaw очікує `turn/completed`. Використовуйте це для довірених або важких робочих навантажень, де синтез після інструменту може правомірно мовчати довше, ніж бюджет фінального випуску асистента. |
| `mode`                                        | `"yolo"`, якщо локальні вимоги Codex не забороняють YOLO | Пресет для YOLO або виконання з перевіркою guardian. Локальні вимоги stdio, що не містять `danger-full-access`, схвалення `never` або рецензента `user`, роблять неявним типовим значенням guardian.                                                                                                                                                                                            |
| `approvalPolicy`                              | `"never"` або дозволена політика схвалення guardian    | Нативна політика схвалення Codex, що надсилається під час старту, відновлення або ходу потоку. Типові значення guardian надають перевагу `"on-request"`, коли це дозволено.                                                                                                                                                                                                                    |
| `sandbox`                                     | `"danger-full-access"` або дозволений sandbox guardian | Нативний режим sandbox Codex, що надсилається під час старту або відновлення потоку. Типові значення guardian надають перевагу `"workspace-write"`, коли це дозволено, інакше `"read-only"`. Коли активний sandbox OpenClaw, ходи `danger-full-access` використовують Codex `workspace-write` з доступом до мережі, виведеним із налаштування вихідного трафіку sandbox OpenClaw.              |
| `approvalsReviewer`                           | `"user"` або дозволений рецензент guardian             | Використовуйте `"auto_review"`, щоб дозволити Codex переглядати нативні запити схвалення, коли це дозволено, інакше `guardian_subagent` або `user`. `guardian_subagent` залишається застарілим псевдонімом.                                                                                                                                                                                    |
| `serviceTier`                                 | не задано                                              | Необов’язковий рівень сервісу Codex app-server. `"priority"` вмикає маршрутизацію fast-mode, `"flex"` запитує обробку flex, `null` очищує перевизначення, а застаріле `"fast"` приймається як `"priority"`.                                                                                                                                                                                    |
| `networkProxy`                                | вимкнено                                               | Увімкнення мережі профілю дозволів Codex для команд app-server. OpenClaw визначає вибрану конфігурацію `permissions.<profile>.network` і вибирає її через `default_permissions` замість надсилання `sandbox`.                                                                                                                                                                                  |
| `experimental.sandboxExecServer`              | `false`                                                | Експериментальне ввімкнення попереднього перегляду, яке реєструє середовище Codex на базі sandbox OpenClaw у Codex app-server 0.132.0 або новішому, щоб нативне виконання Codex могло працювати всередині активного sandbox OpenClaw.                                                                                                                                                         |

`appServer.networkProxy` є явним, бо змінює контракт sandbox Codex. Коли його
ввімкнено, OpenClaw також задає `features.network_proxy.enabled` і
`default_permissions` у конфігурації потоку Codex, щоб згенерований профіль
дозволів міг запустити керовану мережу Codex. Типово OpenClaw генерує
стійку до колізій назву профілю `openclaw-network-<fingerprint>` з тіла
профілю; використовуйте `profileName` лише тоді, коли потрібна стабільна
локальна назва.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Якщо звичайний runtime app-server був би `danger-full-access`, увімкнення
`networkProxy` використовує доступ до файлової системи у стилі робочого простору
для згенерованого профілю дозволів. Кероване Codex примусове застосування мережі
є sandbox-мережею, тому профіль із повним доступом не захищав би вихідний трафік.
Записи доменів використовують `allow` або `deny`; записи сокетів Unix
використовують значення Codex `allow` або `none`.

Динамічні виклики інструментів, якими володіє OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: запити Codex `item/tool/call` типово використовують 90-секундний
сторожовий таймер OpenClaw. Додатний аргумент `timeoutMs` для окремого виклику подовжує
або скорочує бюджет саме цього інструмента. Інструмент `image_generate` використовує
`agents.defaults.imageGenerationModel.timeoutMs`, коли виклик інструмента не надає
власного тайм-ауту, або інакше 120-секундне типове значення для генерації зображень.
Інструмент `image` для розуміння медіа використовує
`tools.media.image.timeoutSeconds` або своє 60-секундне типове значення для медіа. Для
розуміння зображень цей тайм-аут застосовується до самого запиту й не
зменшується попередньою підготовчою роботою. Бюджети динамічних інструментів
обмежені 600000 мс. У разі тайм-ауту OpenClaw перериває сигнал інструмента
там, де це підтримується, і повертає Codex відповідь динамічного інструмента з помилкою, щоб хід
міг продовжитися, а сесія не залишалася в `processing`.
Цей сторожовий таймер є зовнішнім бюджетом динамічного `item/tool/call`; специфічні для провайдера
тайм-аути запитів виконуються всередині цього виклику й зберігають власну семантику тайм-аутів.

Після того як Codex приймає хід, і після того як OpenClaw відповідає на
запит app-server у межах ходу, обв’язка очікує, що Codex просуватиме поточний хід і
зрештою завершить нативний хід через `turn/completed`. Якщо app-server
мовчить протягом `appServer.turnCompletionIdleTimeoutMs`, OpenClaw у режимі best-effort
перериває хід Codex, записує діагностичний тайм-аут і звільняє
смугу сесії OpenClaw, щоб наступні повідомлення чату не ставали в чергу за застарілим
нативним ходом. Більшість нетермінальних сповіщень для того самого ходу вимикають цей короткий
сторожовий таймер, бо Codex довів, що хід досі активний. Передавання інструментам використовують
довший бюджет бездіяльності після інструмента: після того як OpenClaw повертає відповідь
`item/tool/call`, після завершення нативних елементів інструментів, як-от `commandExecution`, після сирих
завершень `custom_tool_call_output`, а також після сирого прогресу асистента після інструмента,
завершень міркувань або прогресу міркувань. Захист використовує
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, коли це налаштовано, і
інакше типово становить п’ять хвилин. Той самий бюджет після інструмента також подовжує
сторожовий таймер прогресу для мовчазного вікна синтезу перед тим, як Codex випустить наступну
подію поточного ходу. Глобальні сповіщення app-server, як-от оновлення обмежень частоти,
не скидають прогрес бездіяльності ходу. Завершення міркувань, завершення
`agentMessage` у commentary та сирий прогрес міркувань або асистента до інструмента можуть
супроводжуватися автоматичною фінальною відповіддю, тому вони використовують захист відповіді після прогресу
замість негайного звільнення смуги сесії. Лише
фінальні/некоментарні завершені елементи `agentMessage` і сирі
завершення асистента до інструмента вмикають звільнення після виводу асистента: якщо після цього Codex замовкає
без `turn/completed`, OpenClaw у режимі best-effort перериває нативний хід і
звільняє смугу сесії. Безпечні для повторного відтворення збої stdio app-server, зокрема
тайм-аути завершення ходу без доказів асистента, інструмента, активного елемента або
побічного ефекту, повторюються один раз у свіжій спробі app-server. Небезпечні
тайм-аути все одно виводять завислий клієнт app-server з роботи й звільняють смугу сесії
OpenClaw. Вони також очищають застарілу прив’язку нативного потоку замість того, щоб
відтворюватися автоматично. Тайм-аути спостереження за завершенням показують специфічний для Codex текст тайм-ауту:
безпечні для повторного відтворення випадки кажуть, що відповідь може бути неповною, тоді як небезпечні випадки
просять користувача перевірити поточний стан перед повторною спробою. Публічна діагностика тайм-аутів
містить структурні поля, як-от останній метод сповіщення app-server,
id/type/role сирого елемента відповіді асистента, кількість активних запитів/елементів і стан
увімкненого спостереження. Коли останнє сповіщення є сирим елементом відповіді асистента, вона
також містить обмежений попередній перегляд тексту асистента. Вона не містить сирого промпта або
вмісту інструментів.

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
бажаніший для повторюваних розгортань, бо він тримає поведінку Plugin у тому самому
переглянутому файлі, що й решта налаштування обв’язки Codex.

## Нативні Plugin Codex

Підтримка нативних Plugin Codex використовує власні можливості app і Plugin app-server Codex
у тому самому потоці Codex, що й хід обв’язки OpenClaw. OpenClaw
не перетворює Plugin Codex на синтетичні динамічні інструменти OpenClaw
`codex_plugin_*`.

`codexPlugins` впливає лише на сесії, які вибирають нативну обв’язку Codex. Він
не впливає на запуски вбудованої обв’язки, звичайні запуски провайдера OpenAI, прив’язки розмов ACP
або інші обв’язки.

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

Конфігурація app потоку обчислюється, коли OpenClaw встановлює сесію обв’язки Codex
або замінює застарілу прив’язку потоку Codex. Вона не переобчислюється на кожному ході.
Після зміни `codexPlugins` використайте `/new`, `/reset` або перезапустіть gateway, щоб
майбутні сесії обв’язки Codex стартували з оновленим набором app.

Щодо придатності до міграції, інвентарю app, політики руйнівних дій,
elicitations і діагностики нативних Plugin див.
[Нативні Plugin Codex](/uk/plugins/codex-native-plugins).

Доступ до app і Plugin на боці OpenAI контролюється обліковим записом Codex, у який виконано вхід,
а для робочих просторів Business і Enterprise/Edu — також засобами керування app робочого простору. Див.
[Використання Codex із вашим планом ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
для огляду облікових записів OpenAI і керування робочим простором.

## Computer Use

Computer Use описано в окремому посібнику з налаштування:
[Codex Computer Use](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не вендорить app керування робочим столом і не виконує
дії на робочому столі самостійно. Він готує app-server Codex, перевіряє, що
MCP-сервер `computer-use` доступний, а потім дозволяє Codex володіти нативними викликами
інструментів MCP під час ходів у режимі Codex.

## Межі часу виконання

Обв’язка Codex змінює лише низькорівневий вбудований виконавець агента.

- Динамічні інструменти OpenClaw підтримуються. Codex просить OpenClaw виконувати ці
  інструменти, тож OpenClaw залишається в шляху виконання.
- Нативні shell, patch, MCP та інструменти нативних app Codex належать Codex.
  OpenClaw може спостерігати або блокувати вибрані нативні події через підтримуваний
  relay, але не переписує аргументи нативних інструментів.
- Codex володіє нативним compaction. OpenClaw зберігає дзеркало транскрипту для історії
  каналу, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або обв’язки, але
  не замінює compaction Codex підсумовувачем OpenClaw або context-engine.
- Генерація медіа, розуміння медіа, TTS, схвалення та вивід messaging-tool
  продовжують проходити через відповідні налаштування провайдера/моделі OpenClaw.
- `tool_result_persist` застосовується до результатів інструментів транскрипту, якими володіє OpenClaw, а не
  до записів результатів нативних інструментів Codex.

Щодо шарів hook, підтримуваних поверхонь V1, нативної обробки дозволів, спрямування черги,
механіки завантаження зворотного зв’язку Codex і деталей compaction див.
[Середовище виконання обв’язки Codex](/uk/plugins/codex-harness-runtime).

## Усунення несправностей

**Codex не відображається як звичайний провайдер `/model`:** це очікувано для
нових конфігурацій. Виберіть модель `openai/gpt-*`, увімкніть
`plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає
`codex`.

**OpenClaw використовує вбудовану обв’язку замість Codex:** переконайтеся, що ref моделі є
`openai/gpt-*` на офіційному провайдері OpenAI і що Plugin Codex
встановлено та ввімкнено. Якщо під час тестування потрібен строгий доказ, задайте для провайдера або
моделі `agentRuntime.id: "codex"`. Примусове середовище виконання Codex завершується помилкою замість
відкату до OpenClaw.

**Середовище виконання OpenAI Codex відкочується до шляху API-ключа:** зберіть редагований
уривок gateway, який показує модель, середовище виконання, вибраного провайдера та збій.
Попросіть зачеплених колег виконати цю команду лише для читання на їхньому хості OpenClaw:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Корисні уривки зазвичай містять `openai/gpt-5.5` або `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` або `harnessRuntime`,
`candidateProvider: "openai"` і результат `401`, `Incorrect API key` або
`No API key`. Виправлений запуск має показувати шлях OpenAI OAuth
замість звичайного збою API-ключа OpenAI.

**Залишилася конфігурація застарілих ref моделей Codex:** виконайте `openclaw doctor --fix`.
Doctor переписує застарілі ref моделей на `openai/*`, вилучає застарілі закріплення середовища виконання
сесії та всього агента й зберігає наявні перевизначення auth-профілів.

**App-server відхилено:** використовуйте app-server Codex `0.125.0` або новіший.
Пререлізи тієї самої версії або версії з суфіксом збірки, як-от
`0.125.0-alpha.2` або `0.125.0+custom`, відхиляються, бо OpenClaw перевіряє
стабільний мінімальний рівень протоколу `0.125.0`.

**`/codex status` не може підключитися:** перевірте, що bundled Plugin `codex`
увімкнено, що `plugins.allow` містить його, коли налаштовано allowlist, і
що будь-які користувацькі `appServer.command`, `url`, `authToken` або headers є коректними.

**Виявлення моделей повільне:** зменште
`plugins.entries.codex.config.discovery.timeoutMs` або вимкніть виявлення. Див.
[Довідник обв’язки Codex](/uk/plugins/codex-harness-reference#model-discovery).

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`,
headers і те, що віддалений app-server говорить тією самою версією протоколу app-server
Codex.

**Нативні інструменти shell або patch блокуються з `Native hook relay unavailable`:**
потік Codex досі намагається використати id нативного hook relay, який OpenClaw більше
не має зареєстрованим. Це проблема транспорту нативного hook Codex, а не збій бекенда ACP,
провайдера, GitHub або shell-команди. Почніть свіжу сесію в
зачепленому чаті за допомогою `/new` або `/reset`, а потім повторіть нешкідливу команду. Якщо це
спрацьовує один раз, але наступний нативний виклик інструмента знову завершується помилкою, розглядайте `/new` лише як тимчасовий
обхідний шлях: скопіюйте промпт у свіжу сесію після перезапуску app-server Codex
або OpenClaw Gateway, щоб старі потоки були відкинуті, а реєстрації нативних hook
створилися заново.

**Модель не Codex використовує вбудовану обв’язку:** це очікувано, якщо
політика середовища виконання провайдера або моделі не маршрутизує її до іншої обв’язки. Звичайні ref провайдерів не OpenAI
залишаються на своєму нормальному шляху провайдера в режимі `auto`.

**Computer Use встановлено, але інструменти не запускаються:** перевірте
`/codex computer-use status` у новому сеансі. Якщо інструмент повідомляє
`Native hook relay unavailable`, скористайтеся наведеним вище відновленням native hook relay. Див.
[Codex Computer Use](/uk/plugins/codex-computer-use#troubleshooting).

## Пов’язане

- [Довідник harness Codex](/uk/plugins/codex-harness-reference)
- [Середовище виконання harness Codex](/uk/plugins/codex-harness-runtime)
- [Нативні Plugin Codex](/uk/plugins/codex-native-plugins)
- [Codex Computer Use](/uk/plugins/codex-computer-use)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Постачальники моделей](/uk/concepts/model-providers)
- [Постачальник OpenAI](/uk/providers/openai)
- [Довідка OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness агентів](/uk/plugins/sdk-agent-harness)
- [Хуки Plugin](/uk/plugins/hooks)
- [Експорт діагностики](/uk/gateway/diagnostics)
- [Стан](/uk/cli/status)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
