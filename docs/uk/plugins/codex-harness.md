---
read_when:
    - Ви хочете використовувати вбудовану обв’язку app-server Codex
    - Вам потрібні приклади конфігурації середовища запуску Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою, а не переходили на PI як запасний варіант
summary: Запускайте раунди вбудованого агента OpenClaw через постачаний у комплекті тестовий каркас Codex app-server
title: Обв’язка Codex
x-i18n:
    generated_at: "2026-05-07T01:53:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

Вбудований plugin `codex` дає OpenClaw змогу виконувати вбудовані ходи агента через app-server Codex замість вбудованого PI harness.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням потоків, нативним Compaction і виконанням через app-server. OpenClaw і далі керує чат-каналами, файлами сесій, вибором моделей, інструментами, схваленнями, доставкою медіа та видимим дзеркалом транскрипту.

Коли хід із вихідного чату виконується через harness Codex, видимі відповіді за замовчуванням використовують інструмент OpenClaw `message`, якщо розгортання явно не налаштувало `messages.visibleReplies`. Агент усе ще може завершити свій хід Codex приватно; він публікує повідомлення в канал лише тоді, коли викликає `message(action="send")`. Установіть `messages.visibleReplies: "automatic"`, щоб залишити фінальні відповіді прямого чату на застарілому шляху автоматичної доставки.

Ходи Codex Heartbeat також за замовчуванням отримують інструмент `heartbeat_respond`, щоб агент міг записати, чи пробудження має залишитися тихим або сповістити, не кодувавши цей потік керування у фінальному тексті.

Настанови щодо ініціативи, специфічні для Heartbeat, надсилаються як інструкція розробника режиму співпраці Codex у самому ході Heartbeat. Звичайні ходи чату відновлюють режим Codex Default замість того, щоб переносити філософію Heartbeat у свій звичайний runtime prompt.

Якщо ви намагаєтеся зорієнтуватися, почніть із
[Середовищ виконання агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — runtime, а Telegram,
Discord, Slack або інший канал лишається поверхнею комунікації.

## Швидка конфігурація

Більшість користувачів, які хочуть "Codex в OpenClaw", хочуть саме цей маршрут: увійти з підпискою ChatGPT/Codex, а потім виконувати вбудовані ходи агента через нативний runtime app-server Codex. Посилання на модель усе ще лишається канонічним як
`openai/gpt-*`; автентифікація підписки походить з облікового запису/профілю Codex, а не з префікса моделі `openai-codex/*`.

Спершу увійдіть через Codex OAuth, якщо ще не зробили цього:

```bash
openclaw models auth login --provider openai-codex
```

Потім увімкніть вбудований plugin `codex` і примусово задайте runtime Codex:

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
      agentRuntime: {
        id: "codex",
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

Не використовуйте `openai-codex/gpt-*` у конфігурації. Цей префікс є застарілим маршрутом, який
`openclaw doctor --fix` переписує на `openai/gpt-*` у primary models,
fallbacks, heartbeat/subagent/compaction overrides, hooks, channel overrides
і застарілих збережених session route pins.

## Що змінює цей plugin

Вбудований plugin `codex` додає кілька окремих можливостей:

| Можливість                       | Як її використовувати                              | Що вона робить                                                               |
| -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Нативний вбудований runtime      | `agentRuntime.id: "codex"`                         | Виконує вбудовані ходи агента OpenClaw через app-server Codex.               |
| Нативні команди керування чатом  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Прив’язує й керує потоками app-server Codex із розмови в месенджері.         |
| Провайдер/каталог app-server Codex | внутрішні механізми `codex`, доступні через harness | Дає runtime змогу виявляти й перевіряти моделі app-server.                   |
| Шлях розуміння медіа Codex       | шляхи сумісності image-model `codex/*`             | Виконує обмежені ходи app-server Codex для підтримуваних моделей розуміння зображень. |
| Нативна ретрансляція хуків       | Хуки plugin навколо Codex-native подій             | Дає OpenClaw змогу спостерігати/блокувати підтримувані Codex-native події інструментів/завершення. |

Увімкнення plugin робить ці можливості доступними. Воно **не**:

- починає використовувати Codex для кожної моделі OpenAI
- перетворює посилання на моделі `openai-codex/*` на нативний runtime без перевірки doctor, що Codex установлено, увімкнено, він додає harness `codex` і готовий до OAuth
- робить ACP/acpx типовим шляхом Codex
- гаряче перемикає наявні сесії, які вже записали runtime PI
- замінює доставку каналами OpenClaw, файли сесій, сховище auth-profile або маршрутизацію повідомлень

Цей самий plugin також відповідає за нативну поверхню команд керування чатом `/codex`. Якщо plugin увімкнено й користувач просить прив’язати, відновити, скерувати, зупинити або переглянути потоки Codex із чату, агенти мають віддавати перевагу `/codex ...` замість ACP. ACP лишається явним fallback, коли користувач просить ACP/acpx або тестує ACP-адаптер Codex.

Нативні ходи Codex зберігають хуки plugin OpenClaw як публічний шар сумісності. Це внутрішньопроцесні хуки OpenClaw, а не командні хуки Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `before_agent_finalize` через ретрансляцію Codex `Stop`
- `agent_end`

Plugins також можуть реєструвати runtime-neutral middleware результатів інструментів, щоб переписувати динамічні результати інструментів OpenClaw після того, як OpenClaw виконає інструмент, і до того, як результат буде повернуто в Codex. Це окремо від публічного хука plugin
`tool_result_persist`, який трансформує записи результатів інструментів у транскрипті, що належать OpenClaw.

Щодо семантики самих хуків plugin див. [Хуки Plugin](/uk/plugins/hooks)
і [Поведінка захисту Plugin](/uk/tools/plugin).

Harness вимкнено за замовчуванням. Нові конфігурації мають зберігати посилання на моделі OpenAI канонічними як `openai/gpt-*` і явно задавати
`agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли їм потрібне нативне виконання через app-server. Застарілі посилання на моделі `codex/*` усе ще автоматично вибирають harness для сумісності, але застарілі префікси провайдерів, підтримані runtime, не показуються як звичайні варіанти моделі/провайдера.

Якщо будь-який налаштований маршрут моделі все ще має вигляд `openai-codex/*`, `openclaw doctor --fix`
переписує його на `openai/*`. Для відповідних маршрутів агента він установлює runtime агента в `codex` лише тоді, коли Codex plugin установлено, увімкнено, він додає harness
`codex` і має придатний OAuth; інакше встановлює runtime у `pi`.

## Карта маршрутів

Скористайтеся цією таблицею перед зміною конфігурації:

| Бажана поведінка                                   | Посилання на модель       | Конфігурація runtime                  | Маршрут auth/profile        | Очікувана мітка статусу        |
| -------------------------------------------------- | ------------------------- | ------------------------------------- | --------------------------- | ------------------------------ |
| Підписка ChatGPT/Codex із нативним runtime Codex   | `openai/gpt-*`            | `agentRuntime.id: "codex"`            | Codex OAuth або обліковий запис Codex | `Runtime: OpenAI Codex`        |
| OpenAI API через звичайний runner OpenClaw         | `openai/gpt-*`            | пропущено або `runtime: "pi"`         | OpenAI API key              | `Runtime: OpenClaw Pi Default` |
| Застаріла конфігурація, що потребує repair doctor  | `openai-codex/gpt-*`      | виправлено до `codex` або `pi`        | Наявна налаштована автентифікація | Перевірте знову після `doctor --fix` |
| Змішані провайдери з консервативним auto mode      | refs конкретних провайдерів | `agentRuntime.id: "auto"`           | Для вибраного провайдера    | Залежить від вибраного runtime |
| Явна сесія ACP-адаптера Codex                      | залежить від ACP prompt/model | `sessions_spawn` з `runtime: "acp"` | ACP backend auth            | Статус ACP task/session        |

Важливий поділ — провайдер проти runtime:

- `openai-codex/*` — це застарілий маршрут, який doctor переписує.
- `agentRuntime.id: "codex"` вимагає harness Codex і fail closed, якщо він недоступний.
- `agentRuntime.id: "auto"` дозволяє зареєстрованим harnesses претендувати на відповідні маршрути провайдерів, але канонічні посилання OpenAI усе ще належать PI, якщо harness не підтримує цю пару провайдер/модель.
- `/codex ...` відповідає на запитання "яку нативну розмову Codex має прив’язати або контролювати цей чат?"
- ACP відповідає на запитання "який зовнішній процес harness має запустити acpx?"

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Для типової конфігурації "підписка плюс нативний runtime Codex" використовуйте `openai/*` з `agentRuntime.id: "codex"`.
Сприймайте `openai-codex/*` як застарілу конфігурацію, яку doctor має переписати:

| Посилання на модель                         | Шлях runtime                                | Коли використовувати                                                     |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`                            | Провайдер OpenAI через plumbing OpenClaw/PI | Потрібен поточний прямий доступ до OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | Застарілий маршрут, який виправляє doctor   | Ви на старій конфігурації; запустіть `openclaw doctor --fix`, щоб переписати її. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                  | Потрібна auth підписки ChatGPT/Codex із нативним виконанням Codex.       |

GPT-5.5 може з’являтися як на прямих маршрутах OpenAI API-key, так і на маршрутах підписки Codex, коли ваш обліковий запис відкриває їх. Використовуйте `openai/gpt-5.5` з harness app-server Codex для нативного runtime Codex або `openai/gpt-5.5` без перевизначення runtime Codex для прямого трафіку API-key.

Застарілі refs `codex/gpt-*` лишаються прийнятними як aliases сумісності. Міграція сумісності doctor переписує застарілі refs runtime на канонічні refs моделей і записує політику runtime окремо. Нові конфігурації нативного app-server harness мають використовувати `openai/gpt-*` плюс `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` дотримується того самого поділу префіксів. Використовуйте
`openai/gpt-*` для звичайного маршруту OpenAI і `codex/gpt-*`, коли розуміння зображень має виконуватися через обмежений хід app-server Codex. Не використовуйте
`openai-codex/gpt-*`; doctor переписує цей застарілий префікс на `openai/gpt-*`. Модель app-server Codex має оголошувати підтримку вводу зображень; text-only моделі Codex завершуються помилкою до запуску media turn.

Використовуйте `/status`, щоб підтвердити ефективний harness для поточної сесії. Якщо вибір неочікуваний, увімкніть debug logging для підсистеми `agents/harness`
і перегляньте структурований запис Gateway `agent harness selected`. Він містить selected harness id, selection reason, runtime/fallback policy і, у режимі `auto`, support result кожного plugin candidate.

### Що означають попередження doctor

`openclaw doctor` попереджає, коли налаштовані refs моделей або збережений стан session route все ще використовують `openai-codex/*`. `openclaw doctor --fix` переписує ці маршрути на:

- `openai/<model>`
- `agentRuntime.id: "codex"`, коли Codex установлено, увімкнено, він додає harness
  `codex` і має придатний OAuth
- `agentRuntime.id: "pi"` інакше

Маршрут `codex` примусово використовує нативний harness Codex. Маршрут `pi` залишає агента на типовому runner OpenClaw замість увімкнення або встановлення Codex як побічного ефекту очищення застарілого маршруту.
Doctor також виправляє застарілі збережені session pins у виявлених сховищах agent session, щоб старі розмови не залишалися застряглими на видаленому маршруті.

Вибір середовища виконання не є керуванням активною сесією. Коли запускається вбудований хід,
OpenClaw записує вибраний ідентифікатор середовища виконання в цю сесію та продовжує використовувати його для
наступних ходів із тим самим ідентифікатором сесії. Змініть конфігурацію `agentRuntime` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували інше середовище виконання;
скористайтеся `/new` або `/reset`, щоб почати нову сесію перед перемиканням наявної
розмови між PI і Codex. Це запобігає повторному відтворенню одного транскрипту через
дві несумісні нативні системи сесій.

Застарілі сесії, створені до прив’язок середовища виконання, вважаються прив’язаними до PI після того,
як у них з’являється історія транскрипту. Скористайтеся `/new` або `/reset`, щоб увімкнути
Codex для цієї розмови після зміни конфігурації.

`/status` показує фактичне середовище виконання моделі. Стандартне середовище PI відображається як
`Runtime: OpenClaw Pi Default`, а середовище Codex app-server відображається як
`Runtime: OpenAI Codex`.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- Codex app-server `0.125.0` або новіший. Вбудований Plugin типово керує сумісним
  бінарним файлом Codex app-server, тому локальні команди `codex` у `PATH`
  не впливають на звичайний запуск середовища виконання.
- Авторизація Codex, доступна процесу app-server або мосту авторизації Codex в OpenClaw.
  Локальні запуски app-server використовують керований OpenClaw домашній каталог Codex для кожного
  агента та ізольований дочірній `HOME`, тому типово не читають ваші особисті
  обліковий запис `~/.codex`, Skills, plugins, конфігурацію, стан потоків або нативний
  `$HOME/.agents/skills`.

Plugin блокує старіші або неверсіоновані рукостискання app-server. Це утримує
OpenClaw на поверхні протоколу, з якою його було протестовано.

Для живих і Docker smoke-тестів авторизація зазвичай надходить з облікового запису Codex CLI
або профілю авторизації OpenClaw `openai-codex`. Локальні запуски stdio app-server також можуть
резервно використовувати `CODEX_API_KEY` / `OPENAI_API_KEY`, коли облікового запису немає.

## Файли початкового завантаження робочого простору

Codex сам обробляє `AGENTS.md` через нативне виявлення документації проєкту. OpenClaw
не записує синтетичні файли документації проєкту Codex і не залежить від резервних
імен файлів Codex для persona-файлів, оскільки резервні варіанти Codex застосовуються лише тоді,
коли `AGENTS.md` відсутній.

Для паритету робочого простору OpenClaw середовище Codex визначає інші файли початкового
завантаження (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` і `MEMORY.md`, якщо вони наявні) і передає їх через інструкції розробника Codex
у `thread/start` і `thread/resume`. Це зберігає `SOUL.md` і пов’язаний контекст
persona/профілю робочого простору видимими в нативному каналі формування поведінки Codex
без дублювання `AGENTS.md`.

## Додавання Codex поруч з іншими моделями

Не встановлюйте `agentRuntime.id: "codex"` глобально, якщо той самий агент має вільно перемикатися
між Codex і моделями провайдерів, що не є Codex. Примусове середовище виконання застосовується до кожного
вбудованого ходу для цього агента або сесії. Якщо ви виберете модель Anthropic, коли
це середовище виконання примусово задане, OpenClaw усе одно спробує середовище Codex і завершить роботу з помилкою
замість тихого спрямування цього ходу через PI.

Натомість використовуйте одну з цих форм:

- Розмістіть Codex на окремому агенті з `agentRuntime.id: "codex"`.
- Залиште стандартного агента на `agentRuntime.id: "auto"` і резервному PI для звичайного змішаного
  використання провайдерів.
- Використовуйте застарілі посилання `codex/*` лише для сумісності. Нові конфігурації мають надавати перевагу
  `openai/*` плюс явній політиці середовища виконання Codex.

Наприклад, це залишає стандартного агента на звичайному автоматичному виборі та
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
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

З такою формою:

- Стандартний агент `main` використовує звичайний шлях провайдера та резервну сумісність PI.
- Агент `codex` використовує середовище Codex app-server.
- Якщо Codex відсутній або не підтримується для агента `codex`, хід завершується помилкою
  замість тихого використання PI.

## Маршрутизація команд агента

Агенти мають маршрутизувати запити користувача за наміром, а не лише за словом "Codex":

| Користувач просить...                                  | Агент має використати...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Прив’язати цей чат до Codex"                          | `/codex bind`                                    |
| "Відновити потік Codex `<id>` тут"                     | `/codex resume <id>`                             |
| "Показати потоки Codex"                                | `/codex threads`                                 |
| "Подати звіт у підтримку про невдалий запуск Codex"    | `/diagnostics [note]`                            |
| "Надіслати відгук Codex лише для цього прикріпленого потоку" | `/codex diagnostics [note]`                      |
| "Використовувати мою підписку ChatGPT/Codex із середовищем Codex" | `openai/*` плюс `agentRuntime.id: "codex"`       |
| "Виправити старі прив’язки конфігурації/сесій `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Запустити Codex через ACP/acpx"                       | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Запустити Claude Code/Gemini/OpenCode/Cursor у потоці" | ACP/acpx, не `/codex` і не нативні підагенти |

OpenClaw рекламує агентам інструкції зі створення ACP лише тоді, коли ACP увімкнено,
його можна диспетчеризувати, і він підтримується завантаженим бекендом середовища виконання. Якщо ACP недоступний,
системний промпт і Skills Plugin не повинні навчати агента маршрутизації ACP.

## Розгортання лише з Codex

Примусово задайте середовище Codex, коли потрібно довести, що кожен вбудований хід агента
використовує Codex. Явні середовища виконання Plugin завершуються помилкою і ніколи не повторюються тихо
через PI:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Перевизначення середовищем:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Коли Codex примусово задано, OpenClaw завершується рано, якщо Plugin Codex вимкнений,
app-server занадто старий або app-server не може запуститися.

## Codex для окремого агента

Ви можете зробити одного агента лише Codex, тоді як стандартний агент зберігає звичайний
автовибір:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Використовуйте звичайні команди сесії для перемикання агентів і моделей. `/new` створює нову
сесію OpenClaw, а середовище Codex створює або відновлює свій допоміжний потік app-server
за потреби. `/reset` очищує прив’язку сесії OpenClaw для цього потоку
та дозволяє наступному ходу знову визначити середовище виконання з поточної конфігурації.

## Виявлення моделей

Типово Plugin Codex запитує в app-server доступні моделі. Якщо
виявлення завершується невдало або за тайм-аутом, він використовує вбудований резервний каталог для:

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

Вимкніть виявлення, коли хочете, щоб запуск уникав зондування Codex і дотримувався
резервного каталогу:

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

## З’єднання app-server і політика

Типово Plugin запускає локально керований OpenClaw бінарний файл Codex за допомогою:

```bash
codex app-server --listen stdio://
```

Керований бінарний файл постачається з пакетом Plugin `codex`. Це утримує версію
app-server прив’язаною до вбудованого Plugin, а не до будь-якого окремого
Codex CLI, який випадково встановлено локально. Задавайте `appServer.command` лише тоді,
коли навмисно хочете запускати інший виконуваний файл.

Типово OpenClaw запускає локальні сесії середовища Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена позиція локального оператора, яка використовується
для автономних Heartbeat: Codex може використовувати інструменти shell і мережі без
зупинок на нативних запитах схвалення, на які ніхто не може відповісти.

Щоб увімкнути схвалення Codex, перевірені guardian, задайте `appServer.mode:
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

Режим guardian використовує нативний шлях автоматичної перевірки схвалень Codex. Коли Codex просить
вийти з sandbox, записати за межами робочого простору або додати дозволи, як-от доступ
до мережі, Codex маршрутизує цей запит на схвалення до нативного перевіряча замість
людської підказки. Перевіряч застосовує рамку ризиків Codex і схвалює або відхиляє
конкретний запит. Використовуйте Guardian, коли вам потрібно більше запобіжників, ніж у режимі YOLO,
але все ще потрібно, щоб автоматичні агенти могли рухатися далі без нагляду.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`.
Окремі поля політики все ще перевизначають `mode`, тому розширені розгортання можуть поєднувати
пресет із явними виборами. Старіше значення перевіряча `guardian_subagent`
все ще приймається як сумісний псевдонім, але нові конфігурації мають використовувати
`auto_review`.

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

Запуски stdio app-server типово успадковують середовище процесу OpenClaw,
але OpenClaw володіє мостом облікового запису Codex app-server і встановлює як
`CODEX_HOME`, так і `HOME` на каталоги для кожного агента в стані OpenClaw
цього агента. Власний завантажувач Skills Codex читає `$CODEX_HOME/skills` і
`$HOME/.agents/skills`, тому обидва значення ізольовано для локальних запусків app-server.
Це зберігає нативні для Codex Skills, plugins, конфігурацію, облікові записи та стан потоків
у межах агента OpenClaw замість витоку з особистого домашнього каталогу Codex CLI
оператора.

Plugins OpenClaw і знімки Skills OpenClaw усе ще проходять через власний
реєстр Plugin і завантажувач Skills OpenClaw. Особисті ресурси Codex CLI не проходять. Якщо у вас є
корисні Skills або plugins Codex CLI, які мають стати частиною агента OpenClaw,
інвентаризуйте їх явно:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Провайдер міграції Codex копіює Skills у поточний робочий простір агента OpenClaw.
Нативні plugins, hooks і файли конфігурації Codex звітуються або архівуються
для ручного перегляду замість автоматичної активації, оскільки вони можуть
виконувати команди, надавати MCP-сервери або містити облікові дані.

Авторизація вибирається в такому порядку:

1. Явний профіль авторизації OpenClaw Codex для агента.
2. Наявний обліковий запис app-server у домашньому каталозі Codex цього агента.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли облікового запису app-server немає, а авторизація OpenAI
   все ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він вилучає
`CODEX_API_KEY` і `OPENAI_API_KEY` із породженого дочірнього процесу Codex. Це
зберігає API-ключі рівня Gateway доступними для embeddings або прямих моделей OpenAI,
не змушуючи нативні звернення app-server Codex випадково тарифікуватися через API.
Явні профілі API-ключа Codex і локальний резервний варіант stdio env-key використовують
вхід через app-server замість успадкованого env дочірнього процесу. З'єднання app-server через WebSocket
не отримують резервний API-ключ env Gateway; використовуйте явний профіль автентифікації або
власний обліковий запис віддаленого app-server.

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

Динамічні інструменти Codex типово використовують профіль `native-first`. У цьому режимі
OpenClaw не відкриває динамічні інструменти, які дублюють нативні для Codex операції робочого простору:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` і
`update_plan`. Інтеграційні інструменти OpenClaw, як-от обмін повідомленнями, сесії, медіа,
cron, браузер, вузли, Gateway, `heartbeat_respond` і `web_search`, залишаються
доступними.

Підтримувані поля верхнього рівня Plugin Codex:

| Поле                       | Типове значення | Значення                                                                                         |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Використовуйте `"openclaw-compat"`, щоб відкрити повний набір динамічних інструментів OpenClaw для app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Додаткові назви динамічних інструментів OpenClaw, які слід вилучити зі звернень app-server Codex. |

Підтримувані поля `appServer`:

| Поле                | Типове значення                         | Значення                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` породжує Codex; `"websocket"` підключається до `url`.                                                                                                                                                                     |
| `command`           | керований бінарний файл Codex            | Виконуваний файл для транспорту stdio. Не задавайте, щоб використовувати керований бінарний файл; задавайте лише для явного перевизначення.                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                                                                                                                                                     |
| `url`               | не задано                                | URL app-server WebSocket.                                                                                                                                                                                                           |
| `authToken`         | не задано                                | Bearer-токен для транспорту WebSocket.                                                                                                                                                                                              |
| `headers`           | `{}`                                     | Додаткові заголовки WebSocket.                                                                                                                                                                                                      |
| `clearEnv`          | `[]`                                     | Додаткові назви змінних середовища, вилучені з породженого процесу app-server stdio після того, як OpenClaw побудує своє успадковане середовище. `CODEX_HOME` і `HOME` зарезервовані для поагентної ізоляції Codex OpenClaw під час локальних запусків. |
| `requestTimeoutMs`  | `60000`                                  | Тайм-аут для викликів control-plane app-server.                                                                                                                                                                                     |
| `mode`              | `"yolo"`                                 | Пресет для виконання YOLO або виконання з перевіркою guardian.                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Нативна політика схвалень Codex, надіслана під час запуску/відновлення/звернення потоку.                                                                                                                                            |
| `sandbox`           | `"danger-full-access"`                   | Нативний режим sandbox Codex, надісланий під час запуску/відновлення потоку.                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                                 | Використовуйте `"auto_review"`, щоб дозволити Codex перевіряти нативні запити схвалення. `guardian_subagent` залишається застарілим псевдонімом.                                                                                    |
| `serviceTier`       | не задано                                | Необов'язковий рівень сервісу app-server Codex: `"fast"`, `"flex"` або `null`. Недійсні застарілі значення ігноруються.                                                                                                            |

Виклики динамічних інструментів, якими володіє OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: кожен запит Codex `item/tool/call` має отримати
відповідь OpenClaw протягом 30 секунд. У разі тайм-ауту OpenClaw перериває сигнал інструмента
там, де це підтримується, і повертає Codex невдалу відповідь dynamic-tool, щоб
звернення могло продовжитися, а не залишало сесію у стані `processing`.

Після того як OpenClaw відповідає на запит app-server Codex у межах звернення, harness
також очікує, що Codex завершить нативне звернення через `turn/completed`. Якщо
app-server мовчить 60 секунд після цієї відповіді, OpenClaw у режимі best-effort
перериває звернення Codex, записує діагностичний тайм-аут і звільняє
lane сесії OpenClaw, щоб наступні повідомлення чату не ставали в чергу за застарілим
нативним зверненням.

Перевизначення середовища залишаються доступними для локального тестування:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` обходить керований бінарний файл, коли
`appServer.command` не задано.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` вилучено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального тестування. Конфігурація
бажана для повторюваних розгортань, бо вона тримає поведінку Plugin у тому самому
перевіреному файлі, що й решту налаштування harness Codex.

## Використання комп'ютера

Computer Use описано в окремому посібнику з налаштування:
[Codex Computer Use](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не постачає у складі desktop-control app і не виконує
дії на робочому столі самостійно. Він готує app-server Codex, перевіряє, що
MCP-сервер `computer-use` доступний, а потім дозволяє Codex обробляти нативні
виклики інструментів MCP під час звернень у режимі Codex.

Для прямого доступу драйвера TryCua поза потоком marketplace Codex зареєструйте
`cua-driver mcp` через `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Див. [Codex Computer Use](/uk/plugins/codex-computer-use), щоб зрозуміти різницю
між Computer Use, яким володіє Codex, і прямою реєстрацією MCP.

Мінімальна конфігурація:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Налаштування можна перевірити або встановити з командної поверхні:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use є специфічним для macOS і може вимагати локальних дозволів ОС, перш ніж
MCP-сервер Codex зможе керувати застосунками. Якщо `computerUse.enabled` має значення true, а MCP
server недоступний, звернення в режимі Codex завершуються помилкою до запуску потоку, а не
мовчки виконуються без нативних інструментів Computer Use. Див.
[Codex Computer Use](/uk/plugins/codex-computer-use) щодо варіантів marketplace,
обмежень віддаленого каталогу, причин статусу та усунення несправностей.

Коли `computerUse.autoInstall` має значення true, OpenClaw може зареєструвати стандартний
вбудований marketplace Codex Desktop з
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, якщо Codex
ще не виявив локальний marketplace. Використовуйте `/new` або `/reset` після
зміни конфігурації runtime або Computer Use, щоб наявні сесії не зберігали старе
прив'язування потоку PI або Codex.

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

Перевірка harness лише для Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
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

Схвалення Codex з перевіркою guardian:

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

Перемикання моделей залишається під контролем OpenClaw. Коли сесію OpenClaw приєднано
до наявного потоку Codex, наступне звернення знову надсилає поточно вибрану
модель OpenAI, provider, політику схвалень, sandbox і рівень сервісу до
app-server. Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає
прив'язування потоку, але просить Codex продовжити з новообраною моделлю.

## Команда Codex

Вбудований Plugin реєструє `/codex` як авторизовану slash-команду. Вона
універсальна й працює в будь-якому каналі, що підтримує текстові команди OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти частоти, MCP-сервери та skills.
- `/codex models` виводить список поточних моделей app-server Codex.
- `/codex threads [filter]` виводить список нещодавніх потоків Codex.
- `/codex resume <thread-id>` прив’язує поточний сеанс OpenClaw до наявного потоку Codex.
- `/codex compact` просить app-server Codex стиснути прив’язаний потік.
- `/codex review` запускає нативний огляд Codex для прив’язаного потоку.
- `/codex diagnostics [note]` запитує підтвердження перед надсиланням діагностичного відгуку Codex для прив’язаного потоку.
- `/codex computer-use status` перевіряє налаштований Plugin Computer Use і MCP-сервер.
- `/codex computer-use install` встановлює налаштований Plugin Computer Use і перезавантажує MCP-сервери.
- `/codex account` показує стан облікового запису та лімітів частоти.
- `/codex mcp` виводить стан MCP-серверів app-server Codex.
- `/codex skills` виводить список skills app-server Codex.

Коли Codex повідомляє про помилку ліміту використання, OpenClaw додає наступний час скидання app-server, якщо Codex його надав. Використовуйте `/codex account` у тій самій розмові, щоб переглянути поточний обліковий запис і вікна лімітів частоти.

### Типовий процес налагодження

Коли агент на базі Codex робить щось несподіване в Telegram, Discord, Slack або іншому каналі, почніть із розмови, де виникла проблема:

1. Виконайте `/diagnostics bad tool choice after image upload` або додайте іншу коротку примітку, що описує побачене.
2. Один раз підтвердьте запит діагностики. Підтвердження створює локальний діагностичний zip-файл Gateway і, оскільки сеанс використовує обв’язку Codex, також надсилає відповідний пакет відгуку Codex на сервери OpenAI.
3. Скопіюйте завершену відповідь діагностики у звіт про помилку або потік підтримки. Вона містить шлях до локального пакета, зведення приватності, ідентифікатори сеансів OpenClaw, ідентифікатори потоків Codex і рядок `Inspect locally` для кожного потоку Codex.
4. Якщо ви хочете налагодити запуск самостійно, виконайте надруковану команду `Inspect locally` у терміналі. Вона має вигляд `codex resume <thread-id>` і відкриває нативний потік Codex, щоб ви могли переглянути розмову, продовжити її локально або запитати Codex, чому він вибрав певний інструмент чи план.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам потрібне саме завантаження відгуку Codex для поточного прив’язаного потоку без повного діагностичного пакета OpenClaw Gateway. Для більшості звітів у підтримку `/diagnostics [note]` є кращою відправною точкою, оскільки вона пов’язує локальний стан Gateway та ідентифікатори потоків Codex в одній відповіді. Див. [Експорт діагностики](/uk/gateway/diagnostics), щоб дізнатися про повну модель приватності та поведінку в групових чатах.

Ядро OpenClaw також надає доступну лише власнику команду `/diagnostics [note]` як загальну діагностичну команду Gateway. Її запит підтвердження показує преамбулу про чутливі дані, посилається на [Експорт діагностики](/uk/gateway/diagnostics) і щоразу запитує `openclaw gateway diagnostics export --json` через явне підтвердження виконання. Не підтверджуйте діагностику правилом allow-all. Після підтвердження OpenClaw надсилає звіт, придатний для вставлення, зі шляхом до локального пакета та зведенням маніфесту. Коли активний сеанс OpenClaw використовує обв’язку Codex, те саме підтвердження також дозволяє надсилати відповідні пакети відгуку Codex на сервери OpenAI. Запит підтвердження повідомляє, що відгук Codex буде надіслано, але до підтвердження не перелічує ідентифікатори сеансу чи потоку Codex.

Якщо `/diagnostics` викликає власник у груповому чаті, OpenClaw не засмічує спільний канал: група отримує лише коротке повідомлення, а преамбула діагностики, запити підтвердження та ідентифікатори сеансів/потоків Codex надсилаються власнику через приватний маршрут підтвердження. Якщо приватного маршруту до власника немає, OpenClaw відхиляє груповий запит і просить власника виконати його з DM.

Підтверджене завантаження Codex викликає `feedback/upload` app-server Codex і просить app-server додати журнали для кожного вказаного потоку та породжених підпотоків Codex, якщо вони доступні. Завантаження проходить через звичайний шлях відгуку Codex на сервери OpenAI; якщо відгук Codex вимкнено в цьому app-server, команда повертає помилку app-server. Завершена відповідь діагностики перелічує канали, ідентифікатори сеансів OpenClaw, ідентифікатори потоків Codex і локальні команди `codex resume <thread-id>` для надісланих потоків. Якщо ви відхилите або проігноруєте підтвердження, OpenClaw не виведе ці ідентифікатори Codex. Це завантаження не замінює локальний експорт діагностики Gateway.

`/codex resume` записує той самий sidecar-файл прив’язки, який обв’язка використовує для звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає поточно вибрану модель OpenClaw в app-server і залишає розширену історію ввімкненою.

### Перегляд потоку Codex із CLI

Найшвидший спосіб зрозуміти невдалий запуск Codex часто полягає в тому, щоб відкрити нативний потік Codex напряму:

```sh
codex resume <thread-id>
```

Використовуйте це, коли помітили помилку в розмові каналу й хочете переглянути проблемний сеанс Codex, продовжити його локально або запитати Codex, чому він зробив певний вибір інструмента чи міркування. Найпростіший шлях зазвичай такий: спочатку виконати `/diagnostics [note]`; після підтвердження завершений звіт перелічить кожен потік Codex і надрукує команду `Inspect locally`, наприклад `codex resume <thread-id>`. Ви можете скопіювати цю команду прямо в термінал.

Також можна отримати ідентифікатор потоку з `/codex binding` для поточного чату або `/codex threads [filter]` для нещодавніх потоків app-server Codex, а потім виконати ту саму команду `codex resume` у своїй оболонці.

Поверхня команд потребує app-server Codex `0.125.0` або новішого. Окремі методи керування повідомляються як `unsupported by this Codex app-server`, якщо майбутній або користувацький app-server не надає цей метод JSON-RPC.

## Межі хуків

Обв’язка Codex має три рівні хуків:

| Рівень                                | Власник                  | Призначення                                                         |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Хуки Plugin OpenClaw                  | OpenClaw                 | Сумісність продукту/Plugin між обв’язками PI та Codex.              |
| Middleware розширень app-server Codex | Вбудовані plugins OpenClaw | Поведінка адаптера для кожного ходу навколо динамічних інструментів OpenClaw. |
| Нативні хуки Codex                    | Codex                    | Низькорівневий життєвий цикл Codex і політика нативних інструментів із конфігурації Codex. |

OpenClaw не використовує проєктні або глобальні файли Codex `hooks.json` для маршрутизації поведінки Plugin OpenClaw. Для підтримуваного моста нативних інструментів і дозволів OpenClaw впроваджує конфігурацію Codex для кожного потоку для `PreToolUse`, `PostToolUse`, `PermissionRequest` і `Stop`. Коли підтвердження app-server Codex увімкнені (`approvalPolicy` не дорівнює `"never"`), стандартна впроваджена конфігурація нативних хуків не містить `PermissionRequest`, щоб рецензент app-server Codex і міст підтверджень OpenClaw обробляли реальні ескалації після огляду. Оператори все ще можуть явно додати `permission_request` до `nativeHookRelay.events`, коли їм потрібен relay сумісності. Інші хуки Codex, як-от `SessionStart` і `UserPromptSubmit`, залишаються засобами керування рівня Codex; вони не надаються як хуки Plugin OpenClaw у контракті v1.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитує виклик, тому OpenClaw запускає поведінку Plugin і middleware, якою він володіє, в адаптері обв’язки. Для нативних інструментів Codex саме Codex володіє канонічним записом інструмента. OpenClaw може дзеркалити вибрані події, але не може переписати нативний потік Codex, якщо Codex не надає цю операцію через app-server або callbacks нативних хуків.

Проєкції Compaction і життєвого циклу LLM надходять із сповіщень app-server Codex і стану адаптера OpenClaw, а не з команд нативних хуків Codex. Події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і `llm_output` є спостереженнями рівня адаптера, а не побайтовими копіями внутрішнього запиту Codex або payload Compaction.

Сповіщення app-server нативних `hook/started` і `hook/completed` Codex проєктуються як події агента `codex_app_server.hook` для траєкторії та налагодження. Вони не викликають хуки Plugin OpenClaw.

## Контракт підтримки V1

Режим Codex — це не PI з іншим викликом моделі під ним. Codex володіє більшою частиною нативного циклу моделі, а OpenClaw адаптує свої поверхні Plugin і сеансів навколо цієї межі.

Підтримується в runtime Codex v1:

| Поверхня                                     | Підтримка                                                                            | Чому                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Цикл моделі OpenAI через Codex                | Підтримується                                                                        | Сервер застосунку Codex володіє ходом OpenAI, нативним відновленням гілки та нативним продовженням інструментів.                                                                                               |
| Маршрутизація й доставка каналами OpenClaw    | Підтримується                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage та інші канали залишаються поза середовищем виконання моделі.                                                                                                      |
| Динамічні інструменти OpenClaw                | Підтримується                                                                        | Codex просить OpenClaw виконати ці інструменти, тому OpenClaw залишається в шляху виконання.                                                                                                                    |
| Plugin для підказок і контексту               | Підтримується                                                                        | OpenClaw будує накладки підказок і проєктує контекст у хід Codex перед запуском або відновленням гілки.                                                                                                        |
| Життєвий цикл рушія контексту                 | Підтримується                                                                        | Збирання, приймання або післяхідне обслуговування, а також координація Compaction рушія контексту виконуються для ходів Codex.                                                                                  |
| Хуки динамічних інструментів                  | Підтримується                                                                        | `before_tool_call`, `after_tool_call` і проміжне ПЗ результатів інструментів виконуються навколо динамічних інструментів, якими володіє OpenClaw.                                                              |
| Хуки життєвого циклу                          | Підтримується як спостереження адаптера                                             | `llm_input`, `llm_output`, `agent_end`, `before_compaction` і `after_compaction` спрацьовують із чесними корисними навантаженнями режиму Codex.                                                                 |
| Шлюз перегляду фінальної відповіді            | Підтримується через нативний ретранслятор хуків                                     | Codex `Stop` ретранслюється в `before_agent_finalize`; `revise` просить Codex виконати ще один прохід моделі перед фіналізацією.                                                                                |
| Блокування або спостереження нативної оболонки, патча та MCP | Підтримується через нативний ретранслятор хуків                                     | Codex `PreToolUse` і `PostToolUse` ретранслюються для зафіксованих нативних поверхонь інструментів, зокрема корисних навантажень MCP на сервері застосунку Codex `0.125.0` або новішому. Блокування підтримується; переписування аргументів — ні. |
| Нативна політика дозволів                     | Підтримується через схвалення сервера застосунку Codex і сумісний нативний ретранслятор хуків | Запити на схвалення сервера застосунку Codex маршрутизуються через OpenClaw після перевірки Codex. Нативний ретранслятор хука `PermissionRequest` є опціональним для нативних режимів схвалення, бо Codex випромінює його до перевірки захисником. |
| Захоплення траєкторії сервера застосунку      | Підтримується                                                                        | OpenClaw записує запит, який він надіслав серверу застосунку, і сповіщення сервера застосунку, які отримує.                                                                                                    |

Не підтримується в середовищі виконання Codex v1:

| Поверхня                                            | Межа V1                                                                                                                                         | Майбутній шлях                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Мутація аргументів нативного інструмента            | Нативні передінструментальні хуки Codex можуть блокувати, але OpenClaw не переписує аргументи нативних інструментів Codex.                    | Потребує підтримки хуків/схеми Codex для заміни вхідних даних інструмента.              |
| Редагована історія нативної стенограми Codex        | Codex володіє канонічною історією нативної гілки. OpenClaw володіє дзеркалом і може проєктувати майбутній контекст, але не повинен змінювати непідтримувані внутрішні дані. | Додати явні API сервера застосунку Codex, якщо потрібна хірургія нативної гілки.        |
| `tool_result_persist` для записів нативних інструментів Codex | Цей хук перетворює записи стенограми, якими володіє OpenClaw, а не записи нативних інструментів Codex.                                        | Можна дзеркалити перетворені записи, але канонічне переписування потребує підтримки Codex. |
| Багаті нативні метадані Compaction                  | OpenClaw спостерігає початок і завершення Compaction, але не отримує стабільний список збереженого/відкинутого, дельту токенів або корисне навантаження підсумку. | Потребує багатших подій Compaction від Codex.                                           |
| Втручання в Compaction                              | Поточні хуки Compaction OpenClaw у режимі Codex мають рівень сповіщень.                                                                         | Додати перед-/післяхуки Compaction Codex, якщо Plugin мають ветувати або переписувати нативну Compaction. |
| Побайтове захоплення API-запиту моделі              | OpenClaw може захоплювати запити й сповіщення сервера застосунку, але ядро Codex внутрішньо будує фінальний API-запит OpenAI.                 | Потребує події трасування запиту моделі Codex або API налагодження.                     |

## Інструменти, медіа та Compaction

Обв'язка Codex змінює лише низькорівневий вбудований виконавець агента.

OpenClaw і надалі будує список інструментів і отримує результати динамічних інструментів від обв'язки. Текст, зображення, відео, музика, TTS, схвалення та вивід інструментів обміну повідомленнями продовжують проходити звичайним шляхом доставки OpenClaw.

Нативний ретранслятор хуків навмисно є універсальним, але контракт підтримки v1 обмежений нативними для Codex шляхами інструментів і дозволів, які тестує OpenClaw. У середовищі виконання Codex це охоплює корисні навантаження оболонки, патча та MCP `PreToolUse`, `PostToolUse` і `PermissionRequest`. Не припускайте, що кожна майбутня подія хука Codex є поверхнею Plugin OpenClaw, доки контракт середовища виконання не назве її.

Для `PermissionRequest` OpenClaw повертає явні рішення дозволити або заборонити лише тоді, коли це вирішує політика. Результат без рішення не є дозволом. Codex трактує його як відсутність рішення хука й переходить до власного захисника або шляху схвалення користувачем. Режими схвалення сервера застосунку Codex типово пропускають цей нативний хук; цей абзац застосовується, коли `permission_request` явно включено в `nativeHookRelay.events` або коли його встановлює сумісне середовище виконання.
Коли оператор вибирає `allow-always` для нативного запиту дозволу Codex, OpenClaw запам'ятовує точний відбиток постачальника/сеансу/вхідних даних інструмента/cwd для обмеженого вікна сеансу. Запам'ятоване рішення навмисно працює лише за точним збігом: змінена команда, аргументи, корисне навантаження інструмента або cwd створюють нове схвалення.

Запити схвалення інструментів MCP Codex маршрутизуються через потік схвалення Plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як `"mcp_tool_call"`. Запити Codex `request_user_input` надсилаються назад до початкового чату, а наступне поставлене в чергу повідомлення-відповідь відповідає на цей нативний запит сервера замість того, щоб спрямовуватися як додатковий контекст. Інші запити з'ясування MCP і надалі закриваються з відмовою.

Скерування черги активного запуску відображається на `turn/steer` сервера застосунку Codex. Із типовим `messages.queue.mode: "steer"` OpenClaw групує поставлені в чергу повідомлення чату протягом налаштованого тихого вікна та надсилає їх як один запит `turn/steer` у порядку надходження. Застарілий режим `queue` надсилає окремі запити `turn/steer`. Перевірка Codex і ручні ходи Compaction можуть відхиляти скерування в тому самому ході; у такому разі OpenClaw використовує чергу подальших повідомлень, коли вибраний режим дозволяє резервний варіант. Див. [Черга скерування](/uk/concepts/queue-steering).

Коли вибрана модель використовує обв'язку Codex, нативна Compaction гілки делегується серверу застосунку Codex. OpenClaw зберігає дзеркало стенограми для історії каналу, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або обв'язки. Дзеркало містить підказку користувача, фінальний текст асистента та полегшені записи міркувань або плану Codex, коли сервер застосунку їх випромінює. Наразі OpenClaw записує лише сигнали початку та завершення нативної Compaction. Він ще не відкриває зрозумілий людині підсумок Compaction або придатний до аудиту список записів, які Codex зберіг після Compaction.

Оскільки Codex володіє канонічною нативною гілкою, `tool_result_persist` наразі не переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли OpenClaw записує результат інструмента стенограми сеансу, якою володіє OpenClaw.

Генерація медіа не потребує PI. Зображення, відео, музика, PDF, TTS і розуміння медіа й надалі використовують відповідні налаштування постачальника/моделі, як-от `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і `messages.tts`.

## Усунення несправностей

**Codex не відображається як звичайний постачальник `/model`:** це очікувано для нових конфігурацій. Виберіть модель `openai/gpt-*` з `agentRuntime.id: "codex"` (або застаріле посилання `codex/*`), увімкніть `plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** `agentRuntime.id: "auto"` усе ще може використовувати PI як сумісний бекенд, коли жодна обв'язка Codex не забирає запуск. Установіть `agentRuntime.id: "codex"`, щоб примусово вибрати Codex під час тестування. Примусове середовище виконання Codex завершується помилкою замість повернення до PI. Після вибору сервера застосунку Codex його помилки показуються напряму.

**Сервер застосунку відхилено:** оновіть Codex, щоб рукостискання сервера застосунку повідомляло версію `0.125.0` або новішу. Передрелізи тієї самої версії або версії із суфіксом збірки, як-от `0.125.0-alpha.2` чи `0.125.0+custom`, відхиляються, бо стабільний протокольний мінімум `0.125.0` — це те, що тестує OpenClaw.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs` або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken` і що віддалений сервер застосунку говорить тією самою версією протоколу сервера застосунку Codex.

**Модель не Codex використовує PI:** це очікувано, якщо ви не примусили `agentRuntime.id: "codex"` для цього агента або не вибрали застаріле посилання `codex/*`. Звичайні `openai/gpt-*` та інші посилання постачальників у режимі `auto` залишаються на своєму звичайному шляху постачальника. Якщо ви примусово задаєте `agentRuntime.id: "codex"`, кожен вбудований хід для цього агента має бути підтримуваною Codex моделлю OpenAI.

**Computer Use встановлено, але інструменти не запускаються:** перевірте
`/codex computer-use status` у новій сесії. Якщо інструмент повідомляє
`Native hook relay unavailable`, використайте `/new` або `/reset`; якщо проблема не зникає, перезапустіть
Gateway, щоб очистити застарілі реєстрації native hook. Якщо `computer-use.list_apps`
завершується через тайм-аут, перезапустіть Codex Computer Use або Codex Desktop і повторіть спробу.

## Пов’язане

- [Plugin агентського harness](/uk/plugins/sdk-agent-harness)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Провайдер OpenAI](/uk/providers/openai)
- [Статус](/uk/cli/status)
- [Хуки Plugin](/uk/plugins/hooks)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
