---
read_when:
    - Ви хочете використати вбудовану обв’язку сервера застосунку Codex
    - Вам потрібні приклади конфігурації harness для Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість резервного переходу на PI
summary: Запускайте ходи вбудованого агента OpenClaw через комплектну обв’язку app-server Codex
title: обв’язка Codex
x-i18n:
    generated_at: "2026-05-01T20:39:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 082c3a81eb6ef238477ca4013114a84e6ea7b188e23fb31855297beaaa7fec40
    source_path: plugins/codex-harness.md
    workflow: 16
---

Вбудований plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
Codex app-server замість вбудованого PI harness.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента:
виявленням моделей, нативним відновленням потоку, нативним Compaction і виконанням
app-server. OpenClaw і надалі керує каналами чату, файлами сесій, вибором моделей,
інструментами, схваленнями, доставкою медіа та видимим дзеркалом транскрипту.

Коли хід із вихідного чату виконується через Codex harness, видимі відповіді за
замовчуванням використовують інструмент OpenClaw `message`, якщо розгортання явно
не налаштувало `messages.visibleReplies`. Агент усе ще може завершити свій хід
Codex приватно; він публікує в канал лише тоді, коли викликає `message(action="send")`.
Задайте `messages.visibleReplies: "automatic"`, щоб зберегти фінальні відповіді
прямого чату на застарілому автоматичному шляху доставки.

Ходи Codex heartbeat також за замовчуванням отримують інструмент `heartbeat_respond`,
щоб агент міг записати, чи пробудження має залишитися тихим або надіслати
сповіщення, не кодувавши цей керівний потік у фінальному тексті.

Якщо ви намагаєтеся зорієнтуватися, почніть з
[Середовища виконання агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — runtime, а Telegram,
Discord, Slack або інший канал залишається поверхнею комунікації.

## Швидка конфігурація

Щоб використовувати Codex harness для ходів агента GPT, зберігайте канонічне
посилання на модель як `openai/gpt-*`, увімкніть вбудований plugin `codex` і задайте
`agentRuntime.id: "codex"`:

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

Не використовуйте `openai-codex/gpt-*` для цього шляху. Це вибирає Codex OAuth
через звичайний PI runner, якщо ви окремо не примусите runtime. Зміни
конфігурації застосовуються до нових або скинутих сесій; наявні сесії зберігають
свій записаний runtime.

## Що змінює цей plugin

Вбудований plugin `codex` додає кілька окремих можливостей:

| Можливість                       | Як ви її використовуєте                            | Що вона робить                                                               |
| -------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| Нативний вбудований runtime      | `agentRuntime.id: "codex"`                         | Запускає вбудовані ходи агента OpenClaw через Codex app-server.             |
| Нативні команди керування чатом  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Прив’язує та керує потоками Codex app-server із розмови в месенджері.       |
| Провайдер/каталог Codex app-server | внутрішні механізми `codex`, доступні через harness | Дає runtime змогу виявляти й перевіряти моделі app-server.                  |
| Шлях розуміння медіа Codex       | шляхи сумісності моделей зображень `codex/*`       | Запускає обмежені ходи Codex app-server для підтримуваних моделей розуміння зображень. |
| Нативна ретрансляція hooks       | Plugin hooks навколо нативних подій Codex          | Дає OpenClaw змогу спостерігати/блокувати підтримувані нативні події інструментів/фіналізації Codex. |

Увімкнення plugin робить ці можливості доступними. Воно **не**:

- починає використовувати Codex для кожної моделі OpenAI
- перетворює посилання на моделі `openai-codex/*` на нативний runtime
- робить ACP/acpx стандартним шляхом Codex
- гаряче перемикає наявні сесії, які вже записали PI runtime
- замінює доставку каналів OpenClaw, файли сесій, сховище auth-profile або
  маршрутизацію повідомлень

Той самий plugin також володіє нативною поверхнею команд керування чатом
`/codex`. Якщо plugin увімкнений і користувач просить прив’язати, відновити,
скерувати, зупинити або переглянути потоки Codex із чату, агенти мають надавати
перевагу `/codex ...` над ACP. ACP залишається явним запасним варіантом, коли
користувач просить ACP/acpx або тестує адаптер ACP Codex.

Нативні ходи Codex зберігають OpenClaw plugin hooks як публічний шар сумісності.
Це внутрішньопроцесні hooks OpenClaw, а не командні hooks Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `before_agent_finalize` через ретрансляцію Codex `Stop`
- `agent_end`

Plugins також можуть реєструвати runtime-нейтральне проміжне ПЗ результатів
інструментів, щоб переписувати динамічні результати інструментів OpenClaw після
того, як OpenClaw виконає інструмент, і до повернення результату в Codex. Це
окремо від публічного plugin hook `tool_result_persist`, який трансформує
належні OpenClaw записи результатів інструментів у транскрипті.

Щодо семантики самих plugin hooks див. [Plugin hooks](/uk/plugins/hooks)
і [Поведінка Plugin guard](/uk/tools/plugin).

Harness вимкнений за замовчуванням. Нові конфігурації мають зберігати посилання
на моделі OpenAI канонічними як `openai/gpt-*` і явно примушувати
`agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`, коли їм потрібне
нативне виконання app-server. Застарілі посилання на моделі `codex/*` усе ще
автоматично вибирають harness для сумісності, але застарілі runtime-backed
префікси провайдерів не показуються як звичайні варіанти моделей/провайдерів.

Якщо plugin `codex` увімкнений, але основна модель усе ще
`openai-codex/*`, `openclaw doctor` попереджає замість зміни маршруту. Це
навмисно: `openai-codex/*` залишається шляхом PI Codex OAuth/підписки, а
нативне виконання app-server залишається явним вибором runtime.

## Карта маршрутів

Використовуйте цю таблицю перед зміною конфігурації:

| Бажана поведінка                           | Посилання на модель       | Конфігурація runtime                   | Вимога до plugin             | Очікувана мітка стану          |
| ------------------------------------------ | ------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| OpenAI API через звичайний runner OpenClaw | `openai/gpt-*`            | пропущено або `runtime: "pi"`          | Провайдер OpenAI             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/підписка через PI              | `openai-codex/gpt-*`      | пропущено або `runtime: "pi"`          | Провайдер OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Нативні вбудовані ходи Codex app-server    | `openai/gpt-*`            | `agentRuntime.id: "codex"`             | plugin `codex`               | `Runtime: OpenAI Codex`        |
| Змішані провайдери з консервативним автоматичним режимом | посилання, специфічні для провайдера | `agentRuntime.id: "auto"` | Необов’язкові plugin runtimes | Залежить від вибраного runtime |
| Явна сесія адаптера Codex ACP              | залежить від ACP prompt/model | `sessions_spawn` з `runtime: "acp"` | справний бекенд `acpx`       | Стан ACP завдання/сесії        |

Важливий поділ — провайдер проти runtime:

- `openai-codex/*` відповідає на запитання «який маршрут провайдера/автентифікації має використовувати PI?»
- `agentRuntime.id: "codex"` відповідає на запитання «який цикл має виконувати цей
  вбудований хід?»
- `/codex ...` відповідає на запитання «до якої нативної розмови Codex має бути прив’язаний
  або якою має керувати цей чат?»
- ACP відповідає на запитання «який зовнішній harness-процес має запустити acpx?»

## Виберіть правильний префікс моделі

Маршрути сімейства OpenAI залежать від префікса. Використовуйте `openai-codex/*`,
коли хочете Codex OAuth через PI; використовуйте `openai/*`, коли хочете прямий
доступ до OpenAI API або коли примушуєте нативний Codex app-server harness:

| Посилання на модель                         | Шлях runtime                                  | Використовуйте, коли                                                     |
| ------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`                            | Провайдер OpenAI через обв’язку OpenClaw/PI   | Вам потрібен поточний прямий доступ OpenAI Platform API з `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                      | OpenAI Codex OAuth через OpenClaw/PI          | Вам потрібна автентифікація підписки ChatGPT/Codex зі стандартним PI runner. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                    | Вам потрібне нативне виконання Codex app-server для вбудованого ходу агента. |

GPT-5.5 наразі в OpenClaw доступний лише через підписку/OAuth. Використовуйте
`openai-codex/gpt-5.5` для PI OAuth або `openai/gpt-5.5` з Codex
app-server harness. Прямий доступ через API-ключ для `openai/gpt-5.5`
підтримується після того, як OpenAI увімкне GPT-5.5 у публічному API.

Застарілі посилання `codex/gpt-*` і далі приймаються як aliases сумісності.
Сумісна міграція Doctor переписує застарілі основні посилання runtime на
канонічні посилання на моделі й окремо записує політику runtime, тоді як
застарілі посилання лише для fallback залишаються без змін, бо runtime
налаштовується для всього контейнера агента. Нові конфігурації PI Codex OAuth
мають використовувати `openai-codex/gpt-*`; нові конфігурації нативного
app-server harness мають використовувати `openai/gpt-*` плюс
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` дотримується того самого поділу префіксів.
Використовуйте `openai-codex/gpt-*`, коли розуміння зображень має виконуватися
через шлях провайдера OpenAI Codex OAuth. Використовуйте `codex/gpt-*`, коли
розуміння зображень має виконуватися через обмежений хід Codex app-server.
Модель Codex app-server має оголошувати підтримку введення зображень; текстові
моделі Codex завершуються помилкою до початку медіаходу.

Використовуйте `/status`, щоб підтвердити фактичний harness для поточної сесії.
Якщо вибір неочікуваний, увімкніть debug-логування для підсистеми
`agents/harness` і перегляньте структурований запис gateway `agent harness selected`.
Він містить вибраний ідентифікатор harness, причину вибору, політику runtime/fallback,
а в режимі `auto` — результат підтримки кожного кандидата plugin.

### Що означають попередження doctor

`openclaw doctor` попереджає, коли всі ці умови істинні:

- вбудований plugin `codex` увімкнений або дозволений
- основна модель агента — `openai-codex/*`
- фактичний runtime цього агента не `codex`

Це попередження існує тому, що користувачі часто очікують, що «увімкнений Codex
plugin» означає «нативний runtime Codex app-server». OpenClaw не робить такого
стрибка. Попередження означає:

- **Зміни не потрібні**, якщо ви мали на увазі ChatGPT/Codex OAuth через PI.
- Змініть модель на `openai/<model>` і задайте
  `agentRuntime.id: "codex"`, якщо ви мали на увазі нативне виконання
  app-server.
- Наявним сесіям усе ще потрібні `/new` або `/reset` після зміни runtime,
  бо прив’язки runtime сесій липкі.

Вибір harness не є керуванням живою сесією. Коли виконується вбудований хід,
OpenClaw записує вибраний ідентифікатор harness у цій сесії й продовжує
використовувати його для подальших ходів у тому самому ідентифікаторі сесії.
Змініть конфігурацію `agentRuntime` або `OPENCLAW_AGENT_RUNTIME`, коли хочете,
щоб майбутні сесії використовували інший harness; використовуйте `/new` або
`/reset`, щоб почати свіжу сесію перед перемиканням наявної розмови між PI і
Codex. Це запобігає повторному програванню одного транскрипту через дві
несумісні нативні системи сесій.

Застарілі сесії, створені до появи прив’язок harness, вважаються прив’язаними
до PI після того, як у них з’являється історія транскрипту. Використовуйте
`/new` або `/reset`, щоб після зміни конфігурації перевести цю розмову на Codex.

`/status` показує фактичний runtime моделі. Стандартний PI harness відображається
як `Runtime: OpenClaw Pi Default`, а Codex app-server harness — як
`Runtime: OpenAI Codex`.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- Codex app-server `0.125.0` або новіший. Вбудований Plugin типово керує сумісним
  бінарним файлом Codex app-server, тому локальні команди `codex` у `PATH` не
  впливають на звичайний запуск harness.
- Авторизація Codex доступна процесу app-server або Codex auth
  bridge OpenClaw. Локальні запуски app-server використовують керований OpenClaw Codex home для кожного
  агента та ізольований дочірній `HOME`, тому типово вони не читають ваш особистий
  обліковий запис `~/.codex`, skills, plugins, config, стан thread або нативні
  `$HOME/.agents/skills`.

Plugin блокує старіші або неверсіоновані app-server handshakes. Це утримує
OpenClaw на поверхні протоколу, з якою він був протестований.

Для live і Docker smoke tests авторизація зазвичай надходить з облікового запису Codex CLI
або auth profile OpenClaw `openai-codex`. Локальні запуски stdio app-server також можуть
резервно використовувати `CODEX_API_KEY` / `OPENAI_API_KEY`, коли обліковий запис відсутній.

## Додайте Codex поруч з іншими моделями

Не встановлюйте `agentRuntime.id: "codex"` глобально, якщо той самий агент має вільно перемикатися
між моделями провайдерів Codex і не-Codex. Примусовий runtime застосовується до кожного
вбудованого turn для цього агента або session. Якщо вибрати модель Anthropic, коли
цей runtime примусово задано, OpenClaw все одно спробує Codex harness і завершиться помилкою
замість того, щоб непомітно спрямувати цей turn через PI.

Натомість використовуйте один із цих варіантів:

- Розмістіть Codex на окремому агенті з `agentRuntime.id: "codex"`.
- Залиште агент за замовчуванням на `agentRuntime.id: "auto"` і PI fallback для звичайного змішаного
  використання провайдерів.
- Використовуйте застарілі refs `codex/*` лише для сумісності. Нові configs мають віддавати перевагу
  `openai/*` плюс явній політиці Codex runtime.

Наприклад, це залишає агент за замовчуванням на звичайному автоматичному виборі та
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

З такою формою:

- Агент `main` за замовчуванням використовує звичайний шлях провайдера та PI compatibility fallback.
- Агент `codex` використовує Codex app-server harness.
- Якщо Codex відсутній або не підтримується для агента `codex`, turn завершується помилкою
  замість тихого використання PI.

## Маршрутизація команд агента

Агенти мають маршрутизувати запити користувача за наміром, а не лише за словом "Codex":

| Користувач просить...                                    | Агент має використовувати...                      |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Прив’язати цей чат до Codex"                            | `/codex bind`                                    |
| "Відновити thread Codex `<id>` тут"                      | `/codex resume <id>`                             |
| "Показати threads Codex"                                 | `/codex threads`                                 |
| "Подати support report для невдалого запуску Codex"      | `/diagnostics [note]`                            |
| "Надіслати Codex feedback лише для цього вкладеного thread" | `/codex diagnostics [note]`                      |
| "Використати Codex як runtime для цього агента"          | зміна config на `agentRuntime.id`                |
| "Використати мою підписку ChatGPT/Codex зі звичайним OpenClaw" | refs моделі `openai-codex/*`                     |
| "Запустити Codex через ACP/acpx"                         | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Запустити Claude Code/Gemini/OpenCode/Cursor у thread"  | ACP/acpx, не `/codex` і не нативні sub-agents    |

OpenClaw показує агентам рекомендації ACP spawn лише тоді, коли ACP увімкнено,
доступний для dispatch і підтриманий завантаженим runtime backend. Якщо ACP недоступний,
system prompt і plugin skills не мають навчати агента маршрутизації ACP.

## Розгортання лише з Codex

Примусово використовуйте Codex harness, коли потрібно довести, що кожен вбудований turn агента
використовує Codex. Явні plugin runtimes типово не мають PI fallback, тому
`fallback: "none"` необов’язковий, але часто корисний як документація:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Перевизначення середовища:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Коли Codex примусово задано, OpenClaw рано завершується помилкою, якщо Codex plugin вимкнено,
app-server занадто старий або app-server не може запуститися. Встановлюйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` лише якщо ви навмисно хочете, щоб PI обробляв
відсутній вибір harness.

## Codex для окремого агента

Можна зробити одного агента лише Codex, тоді як агент за замовчуванням збереже звичайний
автовибір:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Використовуйте звичайні session commands, щоб перемикати агентів і моделі. `/new` створює нову
OpenClaw session, а Codex harness створює або відновлює свій sidecar app-server
thread за потреби. `/reset` очищає прив’язку OpenClaw session для цього thread
і дозволяє наступному turn знову визначити harness із поточного config.

## Виявлення моделей

Типово Codex plugin запитує в app-server доступні моделі. Якщо
виявлення завершується помилкою або timeout, він використовує вбудований fallback catalog для:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Можна налаштувати виявлення в `plugins.entries.codex.config.discovery`:

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

Вимкніть виявлення, коли хочете, щоб запуск уникав probing Codex і використовував
fallback catalog:

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

Типово Plugin запускає керований OpenClaw бінарний файл Codex локально з:

```bash
codex app-server --listen stdio://
```

Керований бінарний файл постачається з пакетом Plugin `codex`. Це зберігає
версію app-server прив’язаною до вбудованого Plugin, а не до будь-якого окремого
Codex CLI, який випадково встановлено локально. Встановлюйте `appServer.command` лише тоді,
коли ви навмисно хочете запустити інший executable.

Типово OpenClaw запускає локальні sessions Codex harness у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена позиція локального оператора, яку використовують
для автономних heartbeats: Codex може використовувати shell і network tools без
зупинки на нативних approval prompts, на які нікому відповісти.

Щоб увімкнути approvals, перевірені Codex guardian, встановіть `appServer.mode:
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

Режим Guardian використовує нативний шлях Codex auto-review approval. Коли Codex просить
вийти за межі sandbox, писати поза workspace або додати permissions на кшталт network
access, Codex маршрутизує цей approval request до нативного reviewer замість
людського prompt. Reviewer застосовує Codex risk framework і схвалює або відхиляє
конкретний request. Використовуйте Guardian, коли потрібні жорсткіші guardrails, ніж у режимі YOLO,
але unattended agents усе ще мають просувати роботу вперед.

Preset `guardian` розгортається в `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`.
Окремі policy fields усе ще перевизначають `mode`, тому advanced deployments можуть поєднувати
preset з явними choices. Старіше значення reviewer `guardian_subagent`
досі приймається як compatibility alias, але нові configs мають використовувати
`auto_review`.

Для app-server, який уже запущено, використовуйте WebSocket transport:

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

Запуски stdio app-server типово успадковують process environment OpenClaw,
але OpenClaw володіє account bridge Codex app-server і встановлює і
`CODEX_HOME`, і `HOME` у per-agent directories під state OpenClaw цього агента.
Власний skill loader Codex читає `$CODEX_HOME/skills` і
`$HOME/.agents/skills`, тому обидва значення ізольовані для локальних запусків app-server.
Це утримує Codex-native skills, plugins, config, accounts і стан thread
у межах агента OpenClaw замість витоку з особистого Codex CLI home оператора.

OpenClaw plugins і OpenClaw skill snapshots і далі проходять через власний
plugin registry і skill loader OpenClaw. Особисті assets Codex CLI не проходять. Якщо у вас є
корисні skills або plugins Codex CLI, які мають стати частиною агента OpenClaw,
явно інвентаризуйте їх:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex migration provider копіює skills у поточний workspace агента OpenClaw.
Нативні plugins, hooks і config files Codex повідомляються або архівуються
для ручного перегляду замість автоматичної активації, оскільки вони можуть
виконувати commands, відкривати MCP servers або містити credentials.

Auth вибирається в такому порядку:

1. Явний auth profile OpenClaw Codex для агента.
2. Наявний обліковий запис app-server у Codex home цього агента.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли немає облікового запису app-server, а OpenAI auth
   усе ще потрібна.

Коли OpenClaw бачить Codex auth profile у стилі підписки ChatGPT, він прибирає
`CODEX_API_KEY` і `OPENAI_API_KEY` із породженого дочірнього процесу Codex. Це
залишає Gateway-level API keys доступними для embeddings або прямих моделей OpenAI
без випадкового billing нативних turns Codex app-server через API.
Явні Codex API-key profiles і локальний stdio env-key fallback використовують app-server
login замість inherited child-process env. WebSocket app-server connections
не отримують fallback Gateway env API-key; використовуйте явний auth profile або
власний обліковий запис remote app-server.

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

Codex dynamic tools типово використовують профіль `native-first`. У цьому режимі
OpenClaw не відкриває dynamic tools, що дублюють Codex-native workspace
operations: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` і
`update_plan`. OpenClaw integration tools, як-от messaging, sessions, media,
cron, browser, nodes, gateway, `heartbeat_respond` і `web_search`, залишаються
доступними.

Підтримувані top-level поля Codex plugin:

| Поле                       | За замовчуванням        | Значення                                                                                                      |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"`        | Використовуйте `"openclaw-compat"`, щоб надати Codex app-server повний набір динамічних інструментів OpenClaw. |
| `codexDynamicToolsExclude` | `[]`                    | Додаткові назви динамічних інструментів OpenClaw, які треба пропускати в зверненнях Codex app-server.          |

Підтримувані поля `appServer`:

| Поле                | За замовчуванням                       | Значення                                                                                                                                                                                                                                             |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                              | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                                                                                                                                                                      |
| `command`           | керований бінарний файл Codex          | Виконуваний файл для транспорту stdio. Не задавайте, щоб використовувати керований бінарний файл; задавайте лише для явного перевизначення.                                                                                                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | Аргументи для транспорту stdio.                                                                                                                                                                                                                      |
| `url`               | не задано                              | URL WebSocket app-server.                                                                                                                                                                                                                            |
| `authToken`         | не задано                              | Bearer-токен для транспорту WebSocket.                                                                                                                                                                                                               |
| `headers`           | `{}`                                   | Додаткові заголовки WebSocket.                                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                   | Додаткові назви змінних середовища, які видаляються із запущеного процесу stdio app-server після того, як OpenClaw побудує успадковане середовище. `CODEX_HOME` і `HOME` зарезервовані для ізоляції Codex на кожного агента OpenClaw під час локальних запусків. |
| `requestTimeoutMs`  | `60000`                                | Тайм-аут для викликів площини керування app-server.                                                                                                                                                                                                   |
| `mode`              | `"yolo"`                               | Пресет для YOLO або виконання з перевіркою guardian.                                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                              | Нативна політика підтверджень Codex, яку надсилають під час start/resume/turn потоку.                                                                                                                                                                |
| `sandbox`           | `"danger-full-access"`                 | Нативний режим пісочниці Codex, який надсилають під час start/resume потоку.                                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                               | Використовуйте `"auto_review"`, щоб дозволити Codex переглядати нативні запити підтвердження. `guardian_subagent` залишається застарілим псевдонімом.                                                                                               |
| `serviceTier`       | не задано                              | Необов’язковий рівень сервісу Codex app-server: `"fast"`, `"flex"` або `null`. Недійсні застарілі значення ігноруються.                                                                                                                              |

Виклики динамічних інструментів, якими володіє OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: кожен запит Codex `item/tool/call` має отримати
відповідь OpenClaw протягом 30 секунд. У разі тайм-ауту OpenClaw перериває сигнал
інструмента там, де це підтримується, і повертає Codex невдалу відповідь
динамічного інструмента, щоб звернення могло продовжитися, а не залишало сесію в
`processing`.

Після того як OpenClaw відповідає на запит app-server у межах звернення Codex,
обв’язка також очікує, що Codex завершить нативне звернення через
`turn/completed`. Якщо app-server мовчить 60 секунд після цієї відповіді,
OpenClaw докладає зусиль, щоб перервати звернення Codex, записує діагностичний
тайм-аут і звільняє смугу сесії OpenClaw, щоб наступні повідомлення чату не
ставали в чергу за застарілим нативним зверненням.

Перевизначення середовища залишаються доступними для локального тестування:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` обходить керований бінарний файл, коли
`appServer.command` не задано.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` було видалено. Натомість використовуйте
`plugins.entries.codex.config.appServer.mode: "guardian"` або
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для одноразового локального
тестування. Для повторюваних розгортань перевага надається конфігурації,
оскільки вона зберігає поведінку Plugin у тому самому перевіреному файлі, що й
решту налаштування обв’язки Codex.

## Використання комп’ютера

Використання комп’ютера описано в окремому посібнику з налаштування:
[Використання комп’ютера Codex](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не постачає вендоризований застосунок керування робочим столом
і не виконує дії на робочому столі самостійно. Він готує Codex app-server,
перевіряє, що MCP-сервер `computer-use` доступний, а потім дозволяє Codex
обробляти нативні виклики інструментів MCP під час звернень у режимі Codex.

Для прямого доступу до драйвера TryCua поза потоком marketplace Codex
зареєструйте `cua-driver mcp` через `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Див. [Використання комп’ютера Codex](/uk/plugins/codex-computer-use), щоб
зрозуміти різницю між використанням комп’ютера, яким володіє Codex, і прямою
реєстрацією MCP.

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
        fallback: "none",
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

Використання комп’ютера є специфічним для macOS і може потребувати локальних
дозволів ОС, перш ніж MCP-сервер Codex зможе керувати застосунками. Якщо
`computerUse.enabled` має значення true, а MCP-сервер недоступний, звернення в
режимі Codex завершується помилкою до запуску потоку, замість того щоб тихо
працювати без нативних інструментів використання комп’ютера. Див.
[Використання комп’ютера Codex](/uk/plugins/codex-computer-use) щодо варіантів
marketplace, обмежень віддаленого каталогу, причин статусу й усунення
несправностей.

Коли `computerUse.autoInstall` має значення true, OpenClaw може зареєструвати
стандартний комплектний marketplace Codex Desktop з
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, якщо Codex
ще не виявив локальний marketplace. Використовуйте `/new` або `/reset` після
зміни runtime чи конфігурації використання комп’ютера, щоб наявні сесії не
зберігали стару прив’язку PI або потоку Codex.

## Поширені рецепти

Локальний Codex із транспортом stdio за замовчуванням:

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

Перевірка обв’язки лише для Codex:

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

Підтвердження Codex із перевіркою guardian:

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

Перемикання моделей залишається під керуванням OpenClaw. Коли сесію OpenClaw
приєднано до наявного потоку Codex, наступне звернення знову надсилає до
app-server поточну вибрану модель OpenAI, провайдера, політику підтверджень,
пісочницю та рівень сервісу. Перемикання з `openai/gpt-5.5` на
`openai/gpt-5.2` зберігає прив’язку потоку, але просить Codex продовжити з
новою вибраною моделлю.

## Команда Codex

Комплектний Plugin реєструє `/codex` як авторизовану slash-команду. Вона є
узагальненою та працює в будь-якому каналі, який підтримує текстові команди
OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти швидкості, MCP-сервери та skills.
- `/codex models` перелічує поточні моделі Codex app-server.
- `/codex threads [filter]` перелічує нещодавні потоки Codex.
- `/codex resume <thread-id>` приєднує поточну сесію OpenClaw до наявного потоку Codex.
- `/codex compact` просить Codex app-server ущільнити приєднаний потік.
- `/codex review` запускає нативний review Codex для приєднаного потоку.
- `/codex diagnostics [note]` запитує перед надсиланням діагностичного відгуку Codex для приєднаного потоку.
- `/codex computer-use status` перевіряє налаштований Plugin використання комп’ютера та MCP-сервер.
- `/codex computer-use install` встановлює налаштований Plugin використання комп’ютера та перезавантажує MCP-сервери.
- `/codex account` показує статус облікового запису та лімітів швидкості.
- `/codex mcp` перелічує статус MCP-серверів Codex app-server.
- `/codex skills` перелічує skills Codex app-server.

### Поширений робочий процес налагодження

Коли агент на основі Codex робить щось неочікуване в Telegram, Discord, Slack
або іншому каналі, почніть із розмови, де сталася проблема:

1. Запустіть `/diagnostics bad tool choice after image upload` або іншу коротку нотатку,
   яка описує побачене.
2. Один раз схваліть запит діагностики. Схвалення створює локальний zip-файл
   діагностики Gateway і, оскільки сеанс використовує середовище Codex, також
   надсилає відповідний пакет відгуку Codex на сервери OpenAI.
3. Скопіюйте завершену відповідь діагностики у звіт про помилку або гілку
   підтримки. Вона містить шлях до локального пакета, зведення про приватність,
   ідентифікатори сеансів OpenClaw, ідентифікатори гілок Codex і рядок
   `Inspect locally` для кожної гілки Codex.
4. Якщо ви хочете самостійно налагодити запуск, виконайте надруковану команду
   `Inspect locally` у терміналі. Вона має вигляд `codex resume <thread-id>` і
   відкриває нативну гілку Codex, щоб ви могли переглянути розмову, продовжити її
   локально або запитати Codex, чому він вибрав певний інструмент чи план.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам потрібне саме
завантаження відгуку Codex для поточної приєднаної гілки без повного пакета
діагностики OpenClaw Gateway. Для більшості звітів підтримки `/diagnostics [note]`
є кращою початковою точкою, бо він пов'язує локальний стан Gateway і
ідентифікатори гілок Codex в одній відповіді. Див. [Експорт діагностики](/uk/gateway/diagnostics)
для повної моделі приватності та поведінки в груповому чаті.

Ядро OpenClaw також надає доступну лише власнику команду `/diagnostics [note]`
як загальну команду діагностики Gateway. Її запит схвалення показує вступ про
чутливі дані, посилається на [Експорт діагностики](/uk/gateway/diagnostics) і щоразу
запитує `openclaw gateway diagnostics export --json` через явне схвалення exec.
Не схвалюйте діагностику правилом allow-all. Після схвалення OpenClaw надсилає
звіт, який можна вставити, зі шляхом до локального пакета та зведенням
маніфесту. Коли активний сеанс OpenClaw використовує середовище Codex, те саме
схвалення також дозволяє надсилання відповідних пакетів відгуку Codex на
сервери OpenAI. Запит схвалення повідомляє, що відгук Codex буде надіслано, але
не перелічує ідентифікатори сеансів або гілок Codex до схвалення.

Якщо `/diagnostics` викликає власник у груповому чаті, OpenClaw зберігає спільний
канал чистим: група отримує лише коротке сповіщення, тоді як вступ діагностики,
запити схвалення та ідентифікатори сеансів/гілок Codex надсилаються власнику
через приватний маршрут схвалення. Якщо приватного маршруту власника немає,
OpenClaw відхиляє груповий запит і просить власника запустити його з DM.

Схвалене завантаження Codex викликає `feedback/upload` сервера застосунку Codex
і просить сервер застосунку включити журнали для кожної переліченої гілки та
створених підгілок Codex, коли вони доступні. Завантаження проходить звичайним
шляхом відгуку Codex на сервери OpenAI; якщо відгук Codex вимкнено на цьому
сервері застосунку, команда повертає помилку сервера застосунку. Завершена
відповідь діагностики перелічує канали, ідентифікатори сеансів OpenClaw,
ідентифікатори гілок Codex і локальні команди `codex resume <thread-id>` для
надісланих гілок. Якщо ви відхилите або проігноруєте схвалення, OpenClaw не
виведе ці ідентифікатори Codex. Це завантаження не замінює локальний експорт
діагностики Gateway.

`/codex resume` записує той самий бічний файл прив'язки, який середовище
використовує для звичайних ходів. У наступному повідомленні OpenClaw відновлює
цю гілку Codex, передає поточно вибрану модель OpenClaw на сервер застосунку та
залишає розширену історію ввімкненою.

### Перегляд гілки Codex із CLI

Найшвидший спосіб зрозуміти невдалий запуск Codex часто полягає у прямому
відкритті нативної гілки Codex:

```sh
codex resume <thread-id>
```

Використовуйте це, коли помічаєте помилку в розмові каналу й хочете переглянути
проблемний сеанс Codex, продовжити його локально або запитати Codex, чому він
зробив певний вибір інструмента чи міркування. Найпростіший шлях зазвичай -
спочатку запустити `/diagnostics [note]`: після схвалення завершений звіт
перелічує кожну гілку Codex і друкує команду `Inspect locally`, наприклад
`codex resume <thread-id>`. Ви можете скопіювати цю команду безпосередньо в
термінал.

Також можна отримати ідентифікатор гілки з `/codex binding` для поточного чату
або `/codex threads [filter]` для нещодавніх гілок сервера застосунку Codex, а
потім виконати ту саму команду `codex resume` у вашій оболонці.

Поверхня команд потребує сервера застосунку Codex `0.125.0` або новішого.
Окремі методи керування повідомляються як `unsupported by this Codex app-server`,
якщо майбутній або власний сервер застосунку не надає цей метод JSON-RPC.

## Межі хуків

Середовище Codex має три рівні хуків:

| Рівень                                | Власник                  | Призначення                                                        |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| Хуки плагінів OpenClaw                | OpenClaw                 | Сумісність продукту/плагіна між середовищами PI та Codex.          |
| Middleware розширень сервера застосунку Codex | Пакетні плагіни OpenClaw | Поведінка адаптера на кожному ході навколо динамічних інструментів OpenClaw. |
| Нативні хуки Codex                    | Codex                    | Низькорівневий життєвий цикл Codex і політика нативних інструментів із конфігурації Codex. |

OpenClaw не використовує проєктні або глобальні файли Codex `hooks.json` для
маршрутизації поведінки плагінів OpenClaw. Для підтримуваного моста нативних
інструментів і дозволів OpenClaw впроваджує конфігурацію Codex для кожної гілки
для `PreToolUse`, `PostToolUse`, `PermissionRequest` і `Stop`. Інші хуки Codex,
як-от `SessionStart` і `UserPromptSubmit`, залишаються засобами керування рівня
Codex; вони не надаються як хуки плагінів OpenClaw у контракті v1.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як
Codex запитує виклик, тож OpenClaw запускає поведінку плагіна й middleware, якою
володіє, в адаптері середовища. Для нативних інструментів Codex канонічним
записом інструмента володіє Codex. OpenClaw може віддзеркалювати вибрані події,
але не може переписати нативну гілку Codex, якщо Codex не надає цю операцію
через сервер застосунку або callback-и нативних хуків.

Проєкції Compaction і життєвого циклу LLM надходять зі сповіщень сервера
застосунку Codex і стану адаптера OpenClaw, а не з команд нативних хуків Codex.
Події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями рівня адаптера, а не побайтовими знімками
внутрішнього запиту Codex або корисних даних Compaction.

Нативні сповіщення сервера застосунку Codex `hook/started` і `hook/completed`
проєктуються як події агента `codex_app_server.hook` для траєкторії та
налагодження. Вони не викликають хуки плагінів OpenClaw.

## Контракт підтримки V1

Режим Codex - це не PI з іншим викликом моделі під ним. Codex володіє більшою
частиною нативного циклу моделі, а OpenClaw адаптує свої поверхні плагінів і
сеансів навколо цієї межі.

Підтримується в середовищі виконання Codex v1:

| Поверхня                                      | Підтримка                               | Чому                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Цикл моделі OpenAI через Codex                | Підтримується                           | Сервер застосунку Codex володіє ходом OpenAI, відновленням нативної гілки та продовженням нативних інструментів.                                                                                     |
| Маршрутизація й доставлення каналів OpenClaw  | Підтримується                           | Telegram, Discord, Slack, WhatsApp, iMessage та інші канали залишаються поза середовищем виконання моделі.                                                                                            |
| Динамічні інструменти OpenClaw                | Підтримується                           | Codex просить OpenClaw виконати ці інструменти, тож OpenClaw залишається на шляху виконання.                                                                                                          |
| Плагіни промптів і контексту                  | Підтримується                           | OpenClaw будує накладки промптів і проєктує контекст у хід Codex перед запуском або відновленням гілки.                                                                                               |
| Життєвий цикл рушія контексту                 | Підтримується                           | Збирання, приймання або обслуговування після ходу, а також координація Compaction рушія контексту виконуються для ходів Codex.                                                                        |
| Хуки динамічних інструментів                  | Підтримується                           | `before_tool_call`, `after_tool_call` і middleware результатів інструментів виконуються навколо динамічних інструментів, якими володіє OpenClaw.                                                      |
| Хуки життєвого циклу                          | Підтримуються як спостереження адаптера | `llm_input`, `llm_output`, `agent_end`, `before_compaction` і `after_compaction` спрацьовують із чесними корисними даними режиму Codex.                                                               |
| Шлюз перегляду фінальної відповіді            | Підтримується через ретрансляцію нативних хуків | Codex `Stop` ретранслюється до `before_agent_finalize`; `revise` просить Codex виконати ще один прохід моделі перед фіналізацією.                                                                     |
| Блокування або спостереження нативної оболонки, патчів і MCP | Підтримується через ретрансляцію нативних хуків | Codex `PreToolUse` і `PostToolUse` ретранслюються для зафіксованих поверхонь нативних інструментів, включно з корисними даними MCP на сервері застосунку Codex `0.125.0` або новішому. Блокування підтримується; переписування аргументів - ні. |
| Політика нативних дозволів                    | Підтримується через ретрансляцію нативних хуків | Codex `PermissionRequest` може маршрутизуватися через політику OpenClaw там, де середовище виконання це надає. Якщо OpenClaw не повертає рішення, Codex продовжує через звичайний guardian або шлях схвалення користувачем. |
| Захоплення траєкторії сервера застосунку      | Підтримується                           | OpenClaw записує запит, який він надіслав на сервер застосунку, і сповіщення сервера застосунку, які отримує.                                                                                         |

Не підтримується в середовищі виконання Codex v1:

| Поверхня                                             | Межа V1                                                                                                                                     | Майбутній шлях                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Зміна аргументів нативного інструмента                       | Нативні передінструментальні хуки Codex можуть блокувати, але OpenClaw не переписує аргументи нативних інструментів Codex.                                               | Потребує підтримки хуків/схем Codex для заміни вхідних даних інструмента.                            |
| Редагована нативна історія транскрипту Codex            | Codex володіє канонічною нативною історією потоку. OpenClaw володіє дзеркалом і може проєктувати майбутній контекст, але не повинен змінювати непідтримувані внутрішні структури. | Додати явні API сервера застосунку Codex, якщо потрібне хірургічне редагування нативного потоку.                    |
| `tool_result_persist` для записів нативних інструментів Codex | Цей хук трансформує записи транскрипту, що належать OpenClaw, а не записи нативних інструментів Codex.                                                           | Можна дзеркалити трансформовані записи, але канонічне переписування потребує підтримки Codex.              |
| Багаті нативні метадані Compaction                     | OpenClaw спостерігає початок і завершення Compaction, але не отримує стабільного списку збереженого/відкинутого, дельти токенів або корисного навантаження підсумку.            | Потребує багатших подій Compaction у Codex.                                                     |
| Втручання в Compaction                             | Поточні хуки Compaction OpenClaw у режимі Codex мають рівень сповіщень.                                                                         | Додати хуки Codex до/після Compaction, якщо plugins потрібно забороняти або переписувати нативну Compaction. |
| Побайтове захоплення запиту до API моделі             | OpenClaw може захоплювати запити й сповіщення сервера застосунку, але ядро Codex внутрішньо формує фінальний запит OpenAI API.                      | Потребує події трасування запиту моделі Codex або API налагодження.                                   |

## Інструменти, медіа та Compaction

Обв’язка Codex змінює лише низькорівневий вбудований виконавець агента.

OpenClaw і далі формує список інструментів і отримує динамічні результати інструментів від
обв’язки. Текст, зображення, відео, музика, TTS, затвердження та вивід інструментів обміну повідомленнями
далі проходять звичайним шляхом доставки OpenClaw.

Нативний ретранслятор хуків навмисно є універсальним, але контракт підтримки v1
обмежений шляхами нативних інструментів і дозволів Codex, які тестує OpenClaw. У
середовищі виконання Codex це включає корисні навантаження shell, patch і MCP `PreToolUse`,
`PostToolUse` та `PermissionRequest`. Не припускайте, що кожна майбутня
подія хуків Codex є поверхнею OpenClaw Plugin, доки контракт середовища виконання
не назве її.

Для `PermissionRequest` OpenClaw повертає явні рішення дозволити або заборонити
лише тоді, коли це вирішує політика. Результат без рішення не є дозволом. Codex
розглядає його як відсутність рішення хука й переходить до власного guardian або шляху затвердження користувачем.

Запити на затвердження інструментів Codex MCP спрямовуються через потік
затвердження Plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як
`"mcp_tool_call"`. Підказки Codex `request_user_input` надсилаються назад до
початкового чату, а наступне поставлене в чергу подальше повідомлення відповідає на цей нативний
запит сервера замість того, щоб спрямовуватися як додатковий контекст. Інші запити
на отримання даних MCP і далі закриваються з помилкою.

Спрямування черги активного запуску відображається на `turn/steer` сервера застосунку Codex. З
типовим `messages.queue.mode: "steer"` OpenClaw пакетно збирає повідомлення чату в черзі
протягом налаштованого тихого вікна й надсилає їх як один запит `turn/steer` у
порядку надходження. Застарілий режим `queue` надсилає окремі запити `turn/steer`. Огляди Codex
і ручні ходи Compaction можуть відхиляти спрямування в тому самому ході; у такому разі
OpenClaw використовує чергу подальших повідомлень, коли вибраний режим дозволяє резервний шлях. Див.
[Черга спрямування](/uk/concepts/queue-steering).

Коли вибрана модель використовує обв’язку Codex, нативна Compaction потоку
делегується серверу застосунку Codex. OpenClaw зберігає дзеркало транскрипту для історії
каналу, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або обв’язки. Дзеркало
містить запит користувача, фінальний текст асистента та легкі записи міркувань
або плану Codex, коли сервер застосунку їх видає. Наразі OpenClaw записує лише
сигнали початку й завершення нативної Compaction. Він ще не надає
людинозрозумілий підсумок Compaction або придатний для аудиту список записів, які Codex
зберіг після Compaction.

Оскільки Codex володіє канонічним нативним потоком, `tool_result_persist` наразі не
переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли
OpenClaw записує результат інструмента до транскрипту сеансу, що належить OpenClaw.

Генерація медіа не потребує PI. Зображення, відео, музика, PDF, TTS і розуміння медіа
й далі використовують відповідні налаштування провайдера/моделі, як-от
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення несправностей

**Codex не відображається як звичайний провайдер `/model`:** це очікувано для
нових конфігурацій. Виберіть модель `openai/gpt-*` з
`agentRuntime.id: "codex"` (або застаріле посилання `codex/*`), увімкніть
`plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає
`codex`.

**OpenClaw використовує PI замість Codex:** `agentRuntime.id: "auto"` усе ще може використовувати PI як
бекенд сумісності, коли жодна обв’язка Codex не приймає запуск. Установіть
`agentRuntime.id: "codex"`, щоб примусово вибрати Codex під час тестування.
Примусове середовище виконання Codex тепер завершується помилкою замість повернення до PI, якщо ви
явно не встановите `agentRuntime.fallback: "pi"`. Щойно сервер застосунку Codex
вибрано, його помилки відображаються напряму без додаткової конфігурації резервного шляху.

**Сервер застосунку відхилено:** оновіть Codex, щоб узгодження із сервером застосунку
повідомляло версію `0.125.0` або новішу. Передрелізи тієї самої версії або версії із суфіксом збірки,
як-от `0.125.0-alpha.2` чи `0.125.0+custom`, відхиляються, бо
стабільний мінімум протоколу `0.125.0` є тим, що тестує OpenClaw.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken`
і те, що віддалений сервер застосунку використовує ту саму версію протоколу сервера застосунку Codex.

**Модель не Codex використовує PI:** це очікувано, якщо ви не примусили
`agentRuntime.id: "codex"` для цього агента або не вибрали застаріле
посилання `codex/*`. Звичайні `openai/gpt-*` та інші посилання провайдерів залишаються на своєму звичайному
шляху провайдера в режимі `auto`. Якщо ви примусово встановите `agentRuntime.id: "codex"`, кожен вбудований
хід для цього агента має бути моделлю OpenAI, яку підтримує Codex.

**Computer Use установлено, але інструменти не запускаються:** перевірте
`/codex computer-use status` із нового сеансу. Якщо інструмент повідомляє
`Native hook relay unavailable`, використайте `/new` або `/reset`; якщо це не зникає, перезапустіть
gateway, щоб очистити застарілі реєстрації нативних хуків. Якщо `computer-use.list_apps`
завершується тайм-аутом, перезапустіть Codex Computer Use або Codex Desktop і повторіть спробу.

## Пов’язане

- [Plugins обв’язки агента](/uk/plugins/sdk-agent-harness)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Провайдер OpenAI](/uk/providers/openai)
- [Статус](/uk/cli/status)
- [Хуки Plugin](/uk/plugins/hooks)
- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
