---
read_when:
    - Ви хочете використовувати вбудовану обв’язку app-server Codex
    - Вам потрібні приклади конфігурації обв’язки Codex
    - Ви хочете, щоб розгортання лише з Codex завершувалися помилкою замість резервного переходу на Pi
summary: Запускайте ходи вбудованого агента OpenClaw через обв’язку Codex app-server, що постачається в комплекті
title: Обв’язка Codex
x-i18n:
    generated_at: "2026-05-07T15:09:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Пакетний Plugin `codex` дає OpenClaw змогу запускати вбудовані ходи агента через app-server Codex замість вбудованої обв'язки PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням моделей, нативним відновленням ланцюжка, нативним compaction і виконанням app-server. OpenClaw усе ще керує каналами чату, файлами сесій, вибором моделі, інструментами, approvals, доставленням медіа та видимим дзеркалом транскрипту.

Коли хід вихідного чату виконується через обв'язку Codex, видимі відповіді за замовчуванням використовують інструмент OpenClaw `message`, якщо розгортання явно не налаштувало `messages.visibleReplies`. Агент усе ще може завершити свій хід Codex приватно; він публікує в канал лише тоді, коли викликає `message(action="send")`. Установіть `messages.visibleReplies: "automatic"`, щоб зберегти фінальні відповіді прямих чатів на застарілому автоматичному шляху доставлення.

Ходи Heartbeat у Codex також за замовчуванням отримують інструмент `heartbeat_respond`, щоб агент міг записати, чи пробудження має залишитися тихим або надіслати сповіщення, не кодувавши цей потік керування у фінальному тексті.

Специфічні для Heartbeat настанови щодо ініціативи надсилаються як інструкція розробника Codex collaboration-mode у самому ході Heartbeat. Звичайні ходи чату відновлюють режим Codex Default замість того, щоб переносити філософію Heartbeat у свій звичайний runtime prompt.

Якщо ви намагаєтеся зорієнтуватися, почніть з
[Середовища виконання агентів](/uk/concepts/agent-runtimes). Коротко:
`openai/gpt-5.5` — це посилання на модель, `codex` — runtime, а Telegram,
Discord, Slack або інший канал залишається поверхнею спілкування.

## Швидка конфігурація

Більшість користувачів, які хочуть "Codex в OpenClaw", хочуть саме цей маршрут: увійти за допомогою підписки ChatGPT/Codex, а потім запускати вбудовані ходи агента через нативний app-server runtime Codex. Посилання на модель усе ще лишається канонічним як
`openai/gpt-*`; автентифікація підписки надходить з облікового запису/профілю Codex, а не з префікса моделі `openai-codex/*`.

Спочатку увійдіть через Codex OAuth, якщо ще не зробили цього:

```bash
openclaw models auth login --provider openai-codex
```

Потім увімкніть пакетний Plugin `codex` і примусово задайте runtime Codex:

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

Не використовуйте `openai-codex/gpt-*` у конфігурації. Цей префікс є застарілим маршрутом, який `openclaw doctor --fix` переписує на `openai/gpt-*` для основних моделей, резервних варіантів, перевизначень heartbeat/subagent/compaction, hooks, перевизначень каналів і застарілих збережених прив'язок маршруту сесії.

## Що змінює цей Plugin

Пакетний Plugin `codex` додає кілька окремих можливостей:

| Можливість                       | Як її використовувати                              | Що вона робить                                                              |
| -------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| Нативний вбудований runtime      | `agentRuntime.id: "codex"`                         | Запускає вбудовані ходи агента OpenClaw через app-server Codex.             |
| Нативні команди керування чатом  | `/codex bind`, `/codex resume`, `/codex steer`, ... | Прив'язує та контролює ланцюжки app-server Codex із розмови в месенджері.   |
| Провайдер/каталог app-server Codex | внутрішні механізми `codex`, доступні через обв'язку | Дає runtime змогу виявляти й перевіряти моделі app-server.                 |
| Шлях розуміння медіа Codex       | шляхи сумісності image-model `codex/*`             | Запускає обмежені ходи app-server Codex для підтримуваних моделей розуміння зображень. |
| Нативна ретрансляція hook        | Plugin hooks навколо нативних подій Codex          | Дає OpenClaw змогу спостерігати/блокувати підтримувані нативні події інструментів/фіналізації Codex. |

Увімкнення Plugin робить ці можливості доступними. Воно **не**:

- замінює прямі поверхні API-ключа OpenAI, як-от зображення, embeddings, speech або realtime
- конвертує посилання на моделі `openai-codex/*` без `openclaw doctor --fix`
- робить ACP/acpx стандартним шляхом Codex
- гаряче перемикає наявні сесії, які вже записали runtime PI
- замінює доставлення каналів OpenClaw, файли сесій, сховище auth-profile або маршрутизацію повідомлень

Цей самий Plugin також володіє нативною поверхнею команд керування чатом `/codex`. Якщо Plugin увімкнено і користувач просить прив'язати, відновити, спрямувати, зупинити або перевірити ланцюжки Codex із чату, агенти мають надавати перевагу `/codex ...` замість ACP. ACP залишається явним резервним варіантом, коли користувач просить ACP/acpx або тестує адаптер ACP Codex.

Нативні ходи Codex зберігають Plugin hooks OpenClaw як публічний шар сумісності. Це внутрішньопроцесні hooks OpenClaw, а не командні hooks Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` для дзеркальних записів транскрипту
- `before_agent_finalize` через ретрансляцію Codex `Stop`
- `agent_end`

Plugins також можуть реєструвати runtime-нейтральне проміжне ПЗ результатів інструментів, щоб переписувати динамічні результати інструментів OpenClaw після того, як OpenClaw виконає інструмент, і до того, як результат повернеться в Codex. Це окремо від публічного Plugin hook
`tool_result_persist`, який трансформує записи результатів інструментів у транскрипті, що належать OpenClaw.

Щодо семантики самих Plugin hooks див. [Plugin hooks](/uk/plugins/hooks)
і [Поведінка захисту Plugin](/uk/tools/plugin).

Посилання на моделі агентів OpenAI за замовчуванням використовують обв'язку. Нові конфігурації мають зберігати посилання на моделі OpenAI канонічними як `openai/gpt-*`; `agentRuntime.id: "codex"` усе ще дійсний, але більше не є обов'язковим для ходів агентів OpenAI. Застарілі посилання на моделі `codex/*` усе ще автоматично вибирають обв'язку для сумісності, але runtime-backed застарілі префікси провайдера не показуються як звичайні варіанти моделі/провайдера.

Якщо будь-який налаштований маршрут моделі все ще є `openai-codex/*`, `openclaw doctor --fix`
переписує його на `openai/*`. Для відповідних маршрутів агентів він установлює runtime агента на `codex` і зберігає наявні перевизначення auth profile `openai-codex`.

## Мапа маршрутів

Скористайтеся цією таблицею перед зміною конфігурації:

| Бажана поведінка                                  | Посилання на модель       | Конфігурація runtime                  | Маршрут auth/profile           | Очікувана мітка статусу      |
| ------------------------------------------------- | ------------------------- | ------------------------------------- | ------------------------------ | ---------------------------- |
| Підписка ChatGPT/Codex з нативним runtime Codex   | `openai/gpt-*`            | пропущено або `agentRuntime.id: "codex"` | Codex OAuth або обліковий запис Codex | `Runtime: OpenAI Codex`      |
| Автентифікація OpenAI API-ключем для моделей агентів | `openai/gpt-*`            | пропущено або `agentRuntime.id: "codex"` | API-key профіль `openai-codex` | `Runtime: OpenAI Codex`      |
| Застаріла конфігурація, що потребує виправлення doctor | `openai-codex/gpt-*`      | виправлено на `codex`                 | Наявна налаштована auth        | Перевірте повторно після `doctor --fix` |
| Змішані провайдери з консервативним автоматичним режимом | посилання, специфічні для провайдера | `agentRuntime.id: "auto"`             | Для кожного вибраного провайдера | Залежить від вибраного runtime |
| Явна сесія адаптера Codex ACP                     | залежить від prompt/model ACP | `sessions_spawn` з `runtime: "acp"`   | auth бекенда ACP               | Статус завдання/сесії ACP    |

Важливий поділ — провайдер проти runtime:

- `openai-codex/*` — це застарілий маршрут, який doctor переписує.
- `agentRuntime.id: "codex"` вимагає обв'язку Codex і fails closed, якщо вона недоступна.
- `agentRuntime.id: "auto"` дає зареєстрованим обв'язкам змогу заявляти про підтримку відповідних маршрутів провайдера; посилання агентів OpenAI резолвляться в Codex замість PI.
- `/codex ...` відповідає на питання "до якої нативної розмови Codex має прив'язатися або якою має керувати цей чат?"
- ACP відповідає на питання "який зовнішній процес обв'язки має запустити acpx?"

## Виберіть правильний префікс моделі

Маршрути родини OpenAI залежать від префікса. Для поширеного налаштування з підпискою плюс нативний runtime Codex використовуйте `openai/*`.
Сприймайте `openai-codex/*` як застарілу конфігурацію, яку doctor має переписати:

| Посилання на модель                              | Шлях runtime                            | Коли використовувати                                             |
| ------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| `openai/gpt-5.4`                                 | Обв'язка app-server Codex для ходів агента | Ви хочете моделі агентів OpenAI через Codex.                    |
| `openai-codex/gpt-5.5`                           | Застарілий маршрут, який виправляє doctor | Ви на старій конфігурації; запустіть `openclaw doctor --fix`, щоб переписати її. |
| `openai/gpt-5.5` + API-key профіль `openai-codex` | Обв'язка app-server Codex               | Ви хочете автентифікацію API-ключем для моделі агента OpenAI.   |

GPT-5.5 може з'являтися як у прямих маршрутах OpenAI API-key, так і в маршрутах підписки Codex, коли ваш обліковий запис їх відкриває. Використовуйте `openai/gpt-5.5` з обв'язкою app-server Codex для нативного runtime Codex або `openai/gpt-5.5` без перевизначення runtime Codex для прямого трафіку API-key.

Застарілі посилання `codex/gpt-*` залишаються прийнятими як псевдоніми сумісності. Міграція сумісності doctor переписує застарілі посилання runtime на канонічні посилання моделей і записує політику runtime окремо. Нові конфігурації нативної обв'язки app-server мають використовувати `openai/gpt-*` плюс `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` дотримується такого самого поділу префіксів. Використовуйте
`openai/gpt-*` для звичайного маршруту OpenAI і `codex/gpt-*`, коли розуміння зображень має виконуватися через обмежений хід app-server Codex. Не використовуйте
`openai-codex/gpt-*`; doctor переписує цей застарілий префікс на `openai/gpt-*`. Модель app-server Codex має рекламувати підтримку введення зображень; текстові-only моделі Codex падають до початку медійного ходу.

Використовуйте `/status`, щоб підтвердити ефективну обв'язку для поточної сесії. Якщо вибір дивує, увімкніть debug logging для підсистеми `agents/harness`
і перевірте структурований запис Gateway `agent harness selected`. Він містить вибраний id обв'язки, причину вибору, політику runtime/fallback і, у режимі `auto`, результат підтримки кожного кандидата Plugin.

### Що означають попередження doctor

`openclaw doctor` попереджає, коли налаштовані посилання на моделі або збережений стан маршруту сесії все ще використовують `openai-codex/*`. `openclaw doctor --fix` переписує ці маршрути на:

- `openai/<model>`
- `agentRuntime.id: "codex"`

Маршрут `codex` примусово задає нативну обв'язку Codex. Конфігурація runtime PI не дозволена для ходів моделей агентів OpenAI.
Doctor також виправляє застарілі збережені прив'язки сесій у виявлених сховищах сесій агентів, щоб старі розмови не залишалися застряглими на видаленому маршруті.

Вибір обв'язки не є live-керуванням сесією. Коли виконується вбудований хід, OpenClaw записує id вибраної обв'язки в цій сесії та продовжує використовувати його для наступних ходів у тому самому id сесії. Змініть конфігурацію `agentRuntime` або
`OPENCLAW_AGENT_RUNTIME`, коли хочете, щоб майбутні сесії використовували іншу обв'язку; використайте `/new` або `/reset`, щоб почати свіжу сесію перед перемиканням наявної розмови між PI і Codex. Це запобігає повторному відтворенню одного транскрипту через дві несумісні нативні системи сесій.

Застарілі сесії, створені до прив'язок обв'язки, вважаються прив'язаними до PI, щойно мають історію транскрипту. Використайте `/new` або `/reset`, щоб перевести цю розмову на Codex після зміни конфігурації.

`/status` показує ефективний runtime моделі. Стандартна обв'язка PI відображається як
`Runtime: OpenClaw Pi Default`, а обв'язка app-server Codex відображається як
`Runtime: OpenAI Codex`.

## Вимоги

- OpenClaw із доступним вбудованим Plugin `codex`.
- Codex app-server `0.125.0` або новіший. Вбудований Plugin типово керує сумісним
  бінарним файлом Codex app-server, тому локальні команди `codex` у `PATH` не
  впливають на звичайний запуск harness.
- Автентифікація Codex доступна процесу app-server або мосту автентифікації Codex
  в OpenClaw. Локальні запуски app-server використовують керований OpenClaw дім Codex для кожного
  агента й ізольований дочірній `HOME`, тому типово не читають ваш особистий
  обліковий запис `~/.codex`, skills, plugins, конфігурацію, стан потоків або нативний
  `$HOME/.agents/skills`.

Plugin блокує старіші або неверсійовані рукостискання app-server. Це утримує
OpenClaw на тій поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить з облікового запису Codex CLI
або профілю автентифікації OpenClaw `openai-codex`. Локальні запуски stdio app-server
також можуть повертатися до `CODEX_API_KEY` / `OPENAI_API_KEY`, коли облікового запису немає.

## Файли початкового завантаження робочої області

Codex сам обробляє `AGENTS.md` через нативне виявлення документації проєкту. OpenClaw
не записує синтетичні файли документації проєкту Codex і не залежить від резервних
імен файлів Codex для persona-файлів, оскільки резервні варіанти Codex застосовуються лише тоді, коли
`AGENTS.md` відсутній.

Для паритету робочої області OpenClaw harness Codex розв’язує інші файли початкового завантаження
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` і `MEMORY.md`, коли він наявний) і передає їх через інструкції розробника Codex
під час `thread/start` і `thread/resume`. Це зберігає
`SOUL.md` і пов’язаний контекст persona/профілю робочої області видимими в нативному
каналі формування поведінки Codex без дублювання `AGENTS.md`.

## Додайте Codex поряд з іншими моделями

Не задавайте `agentRuntime.id: "codex"` глобально, якщо той самий агент має вільно перемикатися
між моделями провайдерів Codex і не-Codex. Примусовий runtime застосовується до кожного
вбудованого ходу для цього агента або сесії. Якщо ви виберете модель Anthropic, коли
цей runtime примусово заданий, OpenClaw все одно спробує harness Codex і завершиться закрито,
а не тихо спрямує цей хід через PI.

Натомість використовуйте одну з цих форм:

- Помістіть Codex в окремого агента з `agentRuntime.id: "codex"`.
- Залиште стандартного агента на `agentRuntime.id: "auto"` і резервний варіант PI для звичайного змішаного
  використання провайдерів.
- Використовуйте застарілі посилання `codex/*` лише для сумісності. Нові конфігурації мають віддавати перевагу
  `openai/*` плюс явній політиці runtime Codex.

Наприклад, це залишає стандартного агента на звичайному автоматичному виборі й
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

З цією формою:

- Стандартний агент `main` використовує звичайний шлях провайдера й резервний варіант сумісності PI.
- Агент `codex` використовує harness Codex app-server.
- Якщо Codex відсутній або не підтримується для агента `codex`, хід завершується помилкою,
  а не непомітно використовує PI.

## Маршрутизація команд агента

Агенти мають маршрутизувати запити користувача за наміром, а не лише за словом "Codex":

| Користувач просить...                                  | Агент має використати...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Прив’язати цей чат до Codex"                          | `/codex bind`                                    |
| "Відновити потік Codex `<id>` тут"                     | `/codex resume <id>`                             |
| "Показати потоки Codex"                                | `/codex threads`                                 |
| "Подати звіт підтримки про невдалий запуск Codex"      | `/diagnostics [note]`                            |
| "Надіслати відгук Codex лише для цього вкладеного потоку" | `/codex diagnostics [note]`                      |
| "Використати мою підписку ChatGPT/Codex з runtime Codex" | `openai/*`                                       |
| "Виправити старі прив’язки конфігурації/сесії `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Запустити Codex через ACP/acpx"                       | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Запустити Claude Code/Gemini/OpenCode/Cursor у потоці" | ACP/acpx, не `/codex` і не нативні під-агенти |

OpenClaw рекламує агентам настанови щодо створення ACP лише коли ACP увімкнено,
можна диспетчеризувати та підкріплено завантаженим runtime backend. Якщо ACP недоступний,
системний prompt і Skills Plugin не мають навчати агента маршрутизації ACP.

## Розгортання лише з Codex

Примусово використовуйте harness Codex, коли потрібно довести, що кожен вбудований хід агента
використовує Codex. Явні runtime Plugin завершуються закрито й ніколи непомітно не повторюються
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

Перевизначення через середовище:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Коли Codex примусово заданий, OpenClaw рано завершується помилкою, якщо Plugin Codex вимкнено,
app-server застарий або app-server не може запуститися.

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

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює нову
сесію OpenClaw, а harness Codex створює або відновлює свій допоміжний потік app-server
за потреби. `/reset` очищує прив’язку сесії OpenClaw для цього потоку
й дозволяє наступному ходу знову розв’язати harness з поточної конфігурації.

## Виявлення моделей

Типово Plugin Codex запитує app-server про доступні моделі. Якщо
виявлення не вдається або завершується тайм-аутом, він використовує вбудований резервний каталог для:

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

Вимкніть виявлення, коли хочете, щоб запуск уникав probing Codex і дотримувався
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

## Підключення app-server і політика

Типово Plugin запускає локально керований OpenClaw бінарний файл Codex з:

```bash
codex app-server --listen stdio://
```

Керований бінарний файл постачається з пакетом Plugin `codex`. Це зберігає
версію app-server прив’язаною до вбудованого Plugin, а не до будь-якого окремого
Codex CLI, який випадково встановлено локально. Задавайте `appServer.command` лише тоді,
коли навмисно хочете запустити інший виконуваний файл.

Типово OpenClaw запускає локальні сесії harness Codex у режимі YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` і
`sandbox: "danger-full-access"`. Це довірена позиція локального оператора, яку використовують
для автономних Heartbeat: Codex може використовувати shell і мережеві інструменти без
зупинки на нативних запитах схвалення, на які нікому відповісти.

Щоб увімкнути схвалення Codex з перевіркою guardian, задайте `appServer.mode:
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

Режим Guardian використовує нативний шлях схвалення Codex з автоперевіркою. Коли Codex просить
вийти з пісочниці, записати поза робочою областю або додати дозволи, як-от мережевий
доступ, Codex спрямовує цей запит схвалення нативному reviewer замість
людського prompt. Reviewer застосовує рамку оцінки ризиків Codex і схвалює або відхиляє
конкретний запит. Використовуйте Guardian, коли потрібні сильніші запобіжники, ніж режим YOLO,
але все одно потрібно, щоб unattended agents могли просуватися.

Пресет `guardian` розгортається в `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` і `sandbox: "workspace-write"`.
Окремі поля політики все ще перевизначають `mode`, тож розширені розгортання можуть змішувати
пресет із явними виборами. Старіше значення reviewer `guardian_subagent`
досі приймається як псевдонім сумісності, але нові конфігурації мають використовувати
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
але OpenClaw володіє мостом облікового запису Codex app-server і задає як
`CODEX_HOME`, так і `HOME` у каталоги окремого агента в стані OpenClaw
цього агента. Власний завантажувач skills Codex читає `$CODEX_HOME/skills` і
`$HOME/.agents/skills`, тому обидва значення ізольовані для локальних запусків app-server.
Це утримує нативні skills, plugins, конфігурацію, облікові записи та стан потоків Codex
у межах агента OpenClaw, а не дозволяє їм витікати з особистого дому Codex CLI
оператора.

Plugins OpenClaw і знімки Skills OpenClaw усе ще проходять через власний
реєстр Plugin і завантажувач skills OpenClaw. Особисті ресурси Codex CLI не проходять. Якщо у вас є
корисні skills або plugins Codex CLI, які мають стати частиною агента OpenClaw,
інвентаризуйте їх явно:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Провайдер міграції Codex копіює skills у поточну робочу область агента OpenClaw.
Нативні plugins, hooks і файли конфігурації Codex звітуються або архівуються
для ручного перегляду, а не активуються автоматично, оскільки вони можуть
виконувати команди, відкривати сервери MCP або містити облікові дані.

Автентифікація вибирається в такому порядку:

1. Явний профіль автентифікації OpenClaw Codex для агента.
2. Наявний обліковий запис app-server у домі Codex цього агента.
3. Лише для локальних запусків stdio app-server: `CODEX_API_KEY`, потім
   `OPENAI_API_KEY`, коли облікового запису app-server немає, а автентифікація OpenAI
   все ще потрібна.

Коли OpenClaw бачить профіль автентифікації Codex у стилі підписки ChatGPT, він видаляє
`CODEX_API_KEY` і `OPENAI_API_KEY` зі створеного дочірнього процесу Codex. Це
зберігає API-ключі рівня Gateway доступними для embeddings або прямих моделей OpenAI
без випадкового білінгу нативних ходів Codex app-server через API.
Явні профілі API-ключів Codex і локальний резервний варіант stdio env-key використовують логін app-server
замість успадкованого env дочірнього процесу. Підключення WebSocket app-server
не отримують резервний варіант API-ключа env Gateway; використовуйте явний профіль автентифікації або
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

`appServer.clearEnv` впливає лише на створений дочірній процес Codex app-server.

Codex dynamic tools типово використовують профіль `native-first`. У цьому режимі
OpenClaw не надає dynamic tools, які дублюють власні для Codex операції
робочого простору: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` і
`update_plan`. Інтеграційні інструменти OpenClaw, як-от messaging, sessions, media,
cron, browser, nodes, gateway, `heartbeat_respond` і `web_search`, залишаються
доступними.

Підтримувані поля Codex plugin верхнього рівня:

| Поле                       | Типове значення | Значення                                                                                         |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Використовуйте `"openclaw-compat"`, щоб надати повний набір OpenClaw dynamic tool для Codex app-server. |
| `codexDynamicToolsExclude` | `[]`             | Додаткові назви OpenClaw dynamic tool, які слід пропускати в ходах Codex app-server.             |

Підтримувані поля `appServer`:

| Поле                          | Типове значення                         | Значення                                                                                                                                                                                                                       |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                               | `"stdio"` запускає Codex; `"websocket"` підключається до `url`.                                                                                                                                                                |
| `command`                     | керований бінарний файл Codex           | Виконуваний файл для stdio-транспорту. Залиште незаданим, щоб використовувати керований бінарний файл; задавайте лише для явного перевизначення.                                                                               |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Аргументи для stdio-транспорту.                                                                                                                                                                                               |
| `url`                         | не задано                               | URL WebSocket app-server.                                                                                                                                                                                                      |
| `authToken`                   | не задано                               | Bearer token для WebSocket-транспорту.                                                                                                                                                                                         |
| `headers`                     | `{}`                                    | Додаткові заголовки WebSocket.                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                    | Додаткові назви змінних середовища, які видаляються із запущеного процесу stdio app-server після того, як OpenClaw сформує успадковане середовище. `CODEX_HOME` і `HOME` зарезервовані для поагентної ізоляції Codex в OpenClaw під час локальних запусків. |
| `requestTimeoutMs`            | `60000`                                 | Тайм-аут для викликів app-server control-plane.                                                                                                                                                                                |
| `turnCompletionIdleTimeoutMs` | `60000`                                 | Тихе вікно після запиту Codex app-server в межах ходу, доки OpenClaw очікує на `turn/completed`. Збільшуйте це значення для повільних фаз синтезу після інструментів або лише статусу.                                      |
| `mode`                        | `"yolo"`                                | Пресет для YOLO або виконання з перевіркою guardian.                                                                                                                                                                           |
| `approvalPolicy`              | `"never"`                               | Власна політика схвалень Codex, що надсилається під час start/resume/turn потоку.                                                                                                                                              |
| `sandbox`                     | `"danger-full-access"`                  | Власний режим sandbox Codex, що надсилається під час start/resume потоку.                                                                                                                                                      |
| `approvalsReviewer`           | `"user"`                                | Використовуйте `"auto_review"`, щоб дозволити Codex перевіряти власні запити на схвалення. `guardian_subagent` залишається застарілим псевдонімом.                                                                             |
| `serviceTier`                 | не задано                               | Необов'язковий рівень сервісу Codex app-server: `"fast"`, `"flex"` або `null`. Недійсні застарілі значення ігноруються.                                                                                                       |

Виклики dynamic tool, якими володіє OpenClaw, обмежуються незалежно від
`appServer.requestTimeoutMs`: кожен запит Codex `item/tool/call` має отримати
відповідь OpenClaw протягом 30 секунд. Після тайм-ауту OpenClaw перериває
сигнал інструмента там, де це підтримується, і повертає невдалу відповідь
dynamic-tool до Codex, щоб хід міг продовжитися, а не залишати сесію в
`processing`.

Після того як OpenClaw відповідає на запит Codex app-server в межах ходу, harness
також очікує, що Codex завершить власний хід через `turn/completed`. Якщо
app-server затихає на `appServer.turnCompletionIdleTimeoutMs` після цієї
відповіді, OpenClaw best-effort перериває хід Codex, записує діагностичний
тайм-аут і звільняє lane сесії OpenClaw, щоб наступні повідомлення чату не
ставали в чергу за застарілим власним ходом. Будь-яке нетермінальне сповіщення
для того самого ходу, зокрема `rawResponseItem/completed`, вимикає цей короткий
watchdog, бо Codex довів, що хід усе ще живий; довший термінальний watchdog
продовжує захищати справді завислі ходи. Діагностика тайм-ауту включає метод
останнього сповіщення app-server, а для сирих елементів відповіді асистента —
тип елемента, роль, id і обмежений попередній перегляд тексту асистента.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` для разового локального тестування.
Для повторюваних розгортань бажано використовувати конфігурацію, бо вона
тримає поведінку plugin у тому самому перевіреному файлі, що й решту
налаштування Codex harness.

## Використання комп'ютера

Computer Use описано в окремому посібнику з налаштування:
[Codex Computer Use](/uk/plugins/codex-computer-use).

Коротко: OpenClaw не вендорить застосунок керування робочим столом і не виконує
дії на робочому столі самостійно. Він готує Codex app-server, перевіряє
доступність MCP-сервера `computer-use`, а потім дозволяє Codex обробляти власні
виклики MCP-інструментів під час ходів у режимі Codex.

Для прямого доступу до драйвера TryCua поза потоком Codex marketplace зареєструйте
`cua-driver mcp` за допомогою `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Див. [Codex Computer Use](/uk/plugins/codex-computer-use), щоб зрозуміти відмінність
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

Computer Use є специфічним для macOS і може вимагати локальних дозволів ОС,
перш ніж MCP-сервер Codex зможе керувати застосунками. Якщо `computerUse.enabled`
має значення true, а MCP-сервер недоступний, ходи в режимі Codex завершуються
помилкою до запуску потоку, а не мовчки виконуються без власних інструментів
Computer Use. Див. [Codex Computer Use](/uk/plugins/codex-computer-use) щодо
варіантів marketplace, обмежень віддаленого каталогу, причин статусу й усунення
несправностей.

Коли `computerUse.autoInstall` має значення true, OpenClaw може зареєструвати
стандартний bundled Codex Desktop marketplace з
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`, якщо Codex
ще не виявив локальний marketplace. Використовуйте `/new` або `/reset` після
зміни конфігурації runtime чи Computer Use, щоб наявні сесії не зберігали стару
прив'язку PI або потоку Codex.

## Поширені рецепти

Локальний Codex із типовим stdio-транспортом:

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

Валідація harness лише для Codex:

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

Перемикання моделі залишається під контролем OpenClaw. Коли сесію OpenClaw
прикріплено до наявного потоку Codex, наступний хід знову надсилає app-server
поточну вибрану модель OpenAI, провайдера, політику схвалень, sandbox і рівень
сервісу. Перемикання з `openai/gpt-5.5` на `openai/gpt-5.2` зберігає прив'язку
потоку, але просить Codex продовжити з новою вибраною моделлю.

## Команда Codex

Bundled plugin реєструє `/codex` як авторизовану slash command. Вона є
універсальною й працює в будь-якому каналі, що підтримує текстові команди
OpenClaw.

Поширені форми:

- `/codex status` показує поточне підключення до app-server, моделі, обліковий запис, ліміти частоти, MCP-сервери та Skills.
- `/codex models` перелічує поточні моделі Codex app-server.
- `/codex threads [filter]` перелічує нещодавні потоки Codex.
- `/codex resume <thread-id>` приєднує поточний сеанс OpenClaw до наявного потоку Codex.
- `/codex compact` просить Codex app-server ущільнити приєднаний потік.
- `/codex review` запускає нативний огляд Codex для приєднаного потоку.
- `/codex diagnostics [note]` запитує підтвердження перед надсиланням діагностичного відгуку Codex для приєднаного потоку.
- `/codex computer-use status` перевіряє налаштований Plugin Computer Use і MCP-сервер.
- `/codex computer-use install` встановлює налаштований Plugin Computer Use і перезавантажує MCP-сервери.
- `/codex account` показує стан облікового запису та лімітів частоти.
- `/codex mcp` перелічує стан MCP-серверів Codex app-server.
- `/codex skills` перелічує Skills Codex app-server.

Коли Codex повідомляє про збій через ліміт використання, OpenClaw додає наступний
час скидання app-server, якщо Codex його надав. Використовуйте `/codex account` у тій самій
розмові, щоб переглянути поточний обліковий запис і вікна лімітів частоти.

### Типовий процес налагодження

Коли агент на базі Codex робить щось неочікуване в Telegram, Discord, Slack
або іншому каналі, починайте з розмови, де виникла проблема:

1. Запустіть `/diagnostics bad tool choice after image upload` або іншу коротку нотатку,
   яка описує те, що ви побачили.
2. Підтвердьте запит діагностики один раз. Підтвердження створює локальний zip-файл
   діагностики Gateway і, оскільки сеанс використовує Codex harness, також
   надсилає відповідний пакет відгуку Codex на сервери OpenAI.
3. Скопіюйте завершену відповідь діагностики у звіт про помилку або гілку підтримки.
   Вона містить локальний шлях до пакета, підсумок приватності, ідентифікатори сеансів OpenClaw,
   ідентифікатори потоків Codex і рядок `Inspect locally` для кожного потоку Codex.
4. Якщо ви хочете самостійно налагодити запуск, виконайте надруковану команду `Inspect locally`
   у терміналі. Вона має вигляд `codex resume <thread-id>` і відкриває
   нативний потік Codex, щоб ви могли переглянути розмову, продовжити її локально
   або запитати Codex, чому він вибрав певний інструмент чи план.

Використовуйте `/codex diagnostics [note]` лише тоді, коли вам потрібне саме завантаження
відгуку Codex для поточного приєднаного потоку без повного діагностичного пакета
Gateway OpenClaw. Для більшості звітів у підтримку `/diagnostics [note]` є
кращою початковою точкою, тому що він пов’язує локальний стан Gateway та ідентифікатори
потоків Codex в одній відповіді. Див. [Експорт діагностики](/uk/gateway/diagnostics)
для повної моделі приватності та поведінки в групових чатах.

Основний OpenClaw також надає доступну лише власнику команду `/diagnostics [note]` як загальну
команду діагностики Gateway. Її запит підтвердження показує преамбулу щодо конфіденційних даних,
посилається на [Експорт діагностики](/uk/gateway/diagnostics) і щоразу запитує
`openclaw gateway diagnostics export --json` через явне підтвердження exec.
Не підтверджуйте діагностику правилом allow-all. Після підтвердження
OpenClaw надсилає звіт, який можна вставити, з локальним шляхом до пакета та підсумком
маніфесту. Коли активний сеанс OpenClaw використовує Codex harness, це саме
підтвердження також дозволяє надсилати відповідні пакети відгуку Codex на
сервери OpenAI. Запит підтвердження повідомляє, що відгук Codex буде надіслано, але
не перелічує ідентифікатори сеансів або потоків Codex до підтвердження.

Якщо `/diagnostics` викликає власник у груповому чаті, OpenClaw зберігає
спільний канал чистим: група отримує лише коротке сповіщення, а
діагностична преамбула, запити підтвердження та ідентифікатори сеансів/потоків Codex надсилаються
власнику через приватний маршрут підтвердження. Якщо приватного маршруту власника немає,
OpenClaw відхиляє груповий запит і просить власника запустити його з DM.

Підтверджене завантаження Codex викликає `feedback/upload` Codex app-server і просить
app-server додати журнали для кожного зазначеного потоку та породжених підпотоків Codex,
коли вони доступні. Завантаження проходить через звичайний шлях відгуку Codex на сервери OpenAI;
якщо відгук Codex вимкнено в цьому app-server, команда повертає
помилку app-server. Завершена відповідь діагностики перелічує канали,
ідентифікатори сеансів OpenClaw, ідентифікатори потоків Codex і локальні команди `codex resume <thread-id>`
для потоків, які було надіслано. Якщо ви відхилите або проігноруєте підтвердження,
OpenClaw не надрукує ці ідентифікатори Codex. Це завантаження не замінює локальний
експорт діагностики Gateway.

`/codex resume` записує той самий sidecar-файл прив’язки, який harness використовує для
звичайних ходів. У наступному повідомленні OpenClaw відновлює цей потік Codex, передає
поточну вибрану модель OpenClaw в app-server і залишає розширену історію
увімкненою.

### Перегляд потоку Codex із CLI

Найшвидший спосіб зрозуміти невдалий запуск Codex часто полягає в тому, щоб відкрити нативний потік Codex
безпосередньо:

```sh
codex resume <thread-id>
```

Використовуйте це, коли помічаєте помилку в розмові каналу й хочете переглянути
проблемний сеанс Codex, продовжити його локально або запитати Codex, чому він зробив
певний вибір інструмента чи міркування. Найпростіший шлях зазвичай такий: спочатку запустіть
`/diagnostics [note]`; після підтвердження завершений звіт перелічить
кожен потік Codex і надрукує команду `Inspect locally`, наприклад
`codex resume <thread-id>`. Ви можете скопіювати цю команду безпосередньо в термінал.

Ви також можете отримати ідентифікатор потоку з `/codex binding` для поточного чату або
`/codex threads [filter]` для нещодавніх потоків Codex app-server, а потім виконати ту саму
команду `codex resume` у своїй оболонці.

Поверхня команд потребує Codex app-server `0.125.0` або новішого. Окремі
методи керування повідомляються як `unsupported by this Codex app-server`, якщо
майбутній або кастомний app-server не надає цей метод JSON-RPC.

## Межі хуків

Codex harness має три рівні хуків:

| Рівень                                | Власник                  | Призначення                                                         |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Хуки Plugin OpenClaw                  | OpenClaw                 | Сумісність продукту/Plugin між PI і Codex harness.                  |
| Проміжне ПЗ розширення Codex app-server | Вбудовані plugins OpenClaw | Поведінка адаптера для кожного ходу навколо динамічних інструментів OpenClaw. |
| Нативні хуки Codex                    | Codex                    | Низькорівневий життєвий цикл Codex і нативна політика інструментів із конфігурації Codex. |

OpenClaw не використовує проєктні або глобальні файли Codex `hooks.json` для маршрутизації
поведінки Plugin OpenClaw. Для підтримуваного моста нативних інструментів і дозволів
OpenClaw впроваджує конфігурацію Codex для кожного потоку для `PreToolUse`, `PostToolUse`,
`PermissionRequest` і `Stop`. Коли підтвердження Codex app-server увімкнені
(`approvalPolicy` не дорівнює `"never"`), типова впроваджена конфігурація нативних хуків
опускає `PermissionRequest`, щоб reviewer app-server Codex і міст підтверджень OpenClaw
обробляли реальні ескалації після огляду. Оператори все ще можуть явно додати
`permission_request` до `nativeHookRelay.events`, коли їм потрібен relay сумісності.
Інші хуки Codex, як-от `SessionStart` і `UserPromptSubmit`, залишаються
елементами керування рівня Codex; вони не надаються як хуки Plugin OpenClaw у контракті v1.

Для динамічних інструментів OpenClaw OpenClaw виконує інструмент після того, як Codex запитує
виклик, тому OpenClaw запускає поведінку Plugin і проміжного ПЗ, якою він володіє, в
адаптері harness. Для нативних інструментів Codex саме Codex володіє канонічним записом інструмента.
OpenClaw може віддзеркалювати вибрані події, але не може переписати нативний потік Codex,
якщо Codex не надає цю операцію через app-server або callback-и нативних хуків.

Проєкції Compaction і життєвого циклу LLM надходять із сповіщень Codex app-server
і стану адаптера OpenClaw, а не з нативних команд хуків Codex.
Події OpenClaw `before_compaction`, `after_compaction`, `llm_input` і
`llm_output` є спостереженнями рівня адаптера, а не побайтовими знімками
внутрішнього запиту або payload-ів Compaction Codex.

Сповіщення app-server нативних `hook/started` і `hook/completed` Codex
проєктуються як події агента `codex_app_server.hook` для траєкторії та налагодження.
Вони не викликають хуки Plugin OpenClaw.

## Контракт підтримки V1

Режим Codex не є PI з іншим викликом моделі під ним. Codex володіє більшою частиною
нативного циклу моделі, а OpenClaw адаптує свої поверхні Plugin і сеансу
навколо цієї межі.

Підтримується в Codex runtime v1:

| Поверхня                                      | Підтримка                                                                            | Чому                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Цикл моделі OpenAI через Codex                | Підтримується                                                                        | Codex app-server володіє ходом OpenAI, нативним відновленням потоку та нативним продовженням інструментів.                                                                                                |
| Маршрутизація та доставлення каналів OpenClaw | Підтримується                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage та інші канали залишаються поза середовищем виконання моделі.                                                                                                 |
| Динамічні інструменти OpenClaw                | Підтримується                                                                        | Codex просить OpenClaw виконати ці інструменти, тому OpenClaw залишається в шляху виконання.                                                                                                               |
| Plugin для промптів і контексту               | Підтримується                                                                        | OpenClaw будує накладки промптів і проєктує контекст у хід Codex перед запуском або відновленням потоку.                                                                                                   |
| Життєвий цикл рушія контексту                 | Підтримується                                                                        | Збирання, приймання або обслуговування після ходу, а також координація Compaction рушія контексту виконуються для ходів Codex.                                                                             |
| Хуки динамічних інструментів                  | Підтримується                                                                        | `before_tool_call`, `after_tool_call` і проміжне ПЗ результатів інструментів виконуються навколо динамічних інструментів, якими володіє OpenClaw.                                                         |
| Хуки життєвого циклу                          | Підтримуються як спостереження адаптера                                              | `llm_input`, `llm_output`, `agent_end`, `before_compaction` і `after_compaction` спрацьовують із чесними корисними навантаженнями режиму Codex.                                                           |
| Шлюз перегляду фінальної відповіді            | Підтримується через нативну ретрансляцію хуків                                       | Codex `Stop` ретранслюється в `before_agent_finalize`; `revise` просить Codex виконати ще один прохід моделі перед фіналізацією.                                                                           |
| Нативна оболонка, патч і блокування або спостереження MCP | Підтримується через нативну ретрансляцію хуків                             | Codex `PreToolUse` і `PostToolUse` ретранслюються для зафіксованих нативних поверхонь інструментів, включно з корисними навантаженнями MCP на Codex app-server `0.125.0` або новішому. Блокування підтримується; переписування аргументів — ні. |
| Нативна політика дозволів                     | Підтримується через схвалення Codex app-server і ретрансляцію сумісних нативних хуків | Запити на схвалення Codex app-server проходять через OpenClaw після перевірки Codex. Ретрансляція нативного хука `PermissionRequest` вмикається окремо для нативних режимів схвалення, бо Codex генерує її до перевірки захисником. |
| Захоплення траєкторії app-server              | Підтримується                                                                        | OpenClaw записує запит, який він надіслав до app-server, і сповіщення app-server, які отримує.                                                                                                             |

Не підтримується в середовищі виконання Codex v1:

| Поверхня                                            | Межа V1                                                                                                                                        | Майбутній шлях                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Мутація аргументів нативних інструментів            | Нативні хуки перед інструментом Codex можуть блокувати, але OpenClaw не переписує аргументи нативних інструментів Codex.                      | Потребує підтримки хуків/схеми Codex для заміни вхідних даних інструмента.                |
| Редагована історія нативного транскрипту Codex      | Codex володіє канонічною історією нативного потоку. OpenClaw володіє дзеркалом і може проєктувати майбутній контекст, але не повинен змінювати непідтримувані внутрішні структури. | Додати явні API Codex app-server, якщо потрібна хірургія нативного потоку.                |
| `tool_result_persist` для записів нативних інструментів Codex | Цей хук перетворює записи транскрипту, якими володіє OpenClaw, а не записи нативних інструментів Codex.                                      | Можна дзеркалити перетворені записи, але канонічне переписування потребує підтримки Codex. |
| Багаті нативні метадані Compaction                  | OpenClaw спостерігає початок і завершення Compaction, але не отримує стабільного списку збереженого/відкинутого, дельти токенів або корисного навантаження підсумку. | Потребує багатших подій Compaction у Codex.                                               |
| Втручання в Compaction                              | Поточні хуки Compaction OpenClaw у режимі Codex працюють на рівні сповіщень.                                                                    | Додати хуки Codex до/після Compaction, якщо Plugin потрібно забороняти або переписувати нативну Compaction. |
| Побайтове захоплення запиту до API моделі           | OpenClaw може захоплювати запити й сповіщення app-server, але ядро Codex внутрішньо будує фінальний запит до API OpenAI.                     | Потребує події трасування запиту моделі Codex або API налагодження.                       |

## Інструменти, медіа та Compaction

Обв’язка Codex змінює лише низькорівневий вбудований виконавець агента.

OpenClaw усе ще будує список інструментів і отримує результати динамічних інструментів від обв’язки. Текст, зображення, відео, музика, TTS, схвалення та вивід інструментів обміну повідомленнями продовжують проходити через звичайний шлях доставлення OpenClaw.

Нативна ретрансляція хуків навмисно є узагальненою, але контракт підтримки v1 обмежений шляхами нативних інструментів і дозволів Codex, які тестує OpenClaw. У середовищі виконання Codex це включає корисні навантаження оболонки, патча та MCP `PreToolUse`, `PostToolUse` і `PermissionRequest`. Не припускайте, що кожна майбутня подія хука Codex є поверхнею Plugin OpenClaw, доки контракт середовища виконання її не назве.

Для `PermissionRequest` OpenClaw повертає явні рішення дозволити або відхилити лише тоді, коли це вирішує політика. Результат без рішення не є дозволом. Codex трактує його як відсутність рішення хука й переходить до власного шляху захисника або схвалення користувачем. Режими схвалення Codex app-server типово пропускають цей нативний хук; цей абзац застосовується, коли `permission_request` явно включено в `nativeHookRelay.events` або коли його встановлює сумісне середовище виконання.
Коли оператор вибирає `allow-always` для нативного запиту дозволу Codex, OpenClaw запам’ятовує точний відбиток provider/session/tool input/cwd для обмеженого вікна сеансу. Запам’ятоване рішення навмисно працює лише за точним збігом: змінена команда, аргументи, корисне навантаження інструмента або cwd створюють нове схвалення.

Запити схвалення інструментів Codex MCP спрямовуються через потік схвалення Plugin OpenClaw, коли Codex позначає `_meta.codex_approval_kind` як `"mcp_tool_call"`. Підказки Codex `request_user_input` надсилаються назад до початкового чату, а наступне поставлене в чергу подальше повідомлення відповідає на цей нативний серверний запит замість того, щоб спрямовуватися як додатковий контекст. Інші запити MCP elicitation і далі завершуються закритою відмовою.

Керування чергою активного запуску відображається на Codex app-server `turn/steer`. З типовим `messages.queue.mode: "steer"` OpenClaw групує поставлені в чергу повідомлення чату протягом налаштованого тихого вікна та надсилає їх як один запит `turn/steer` у порядку надходження. Застарілий режим `queue` надсилає окремі запити `turn/steer`. Ходи перевірки Codex і ручної Compaction можуть відхиляти керування в тому самому ході; у такому разі OpenClaw використовує чергу followup, коли вибраний режим дозволяє резервний шлях. Див. [Черга керування](/uk/concepts/queue-steering).

Коли вибрана модель використовує обв’язку Codex, нативна Compaction потоку делегується Codex app-server. OpenClaw зберігає дзеркало транскрипту для історії каналів, пошуку, `/new`, `/reset` і майбутнього перемикання моделі або обв’язки. Дзеркало включає промпт користувача, фінальний текст асистента та легкі записи міркувань або плану Codex, коли app-server їх генерує. Наразі OpenClaw записує лише сигнали початку й завершення нативної Compaction. Він ще не надає придатний для читання людиною підсумок Compaction або аудований список того, які записи Codex зберіг після Compaction.

Оскільки Codex володіє канонічним нативним потоком, `tool_result_persist` наразі не переписує записи результатів нативних інструментів Codex. Він застосовується лише тоді, коли OpenClaw записує результат інструмента в транскрипт сеансу, яким володіє OpenClaw.

Генерація медіа не потребує PI. Зображення, відео, музика, PDF, TTS і розуміння медіа продовжують використовувати відповідні налаштування provider/model, як-от `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і `messages.tts`.

## Усунення несправностей

**Codex не з’являється як звичайний provider `/model`:** це очікувано для нових конфігурацій. Виберіть модель `openai/gpt-*` з `agentRuntime.id: "codex"` (або застаріле посилання `codex/*`), увімкніть `plugins.entries.codex.enabled` і перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw використовує PI замість Codex:** `agentRuntime.id: "auto"` усе ще може використовувати PI як сумісний бекенд, коли жодна обв’язка Codex не бере запуск. Установіть `agentRuntime.id: "codex"`, щоб примусово вибрати Codex під час тестування. Примусове середовище виконання Codex завершується помилкою замість повернення до PI. Після вибору Codex app-server його помилки відображаються напряму.

**app-server відхилено:** оновіть Codex, щоб handshake app-server повідомляв версію `0.125.0` або новішу. Передрелізи тієї самої версії або версії із суфіксом збірки, як-от `0.125.0-alpha.2` чи `0.125.0+custom`, відхиляються, бо стабільний протокольний мінімум `0.125.0` є тим, що тестує OpenClaw.

**Виявлення моделей повільне:** зменште `plugins.entries.codex.config.discovery.timeoutMs` або вимкніть виявлення.

**Транспорт WebSocket одразу завершується помилкою:** перевірте `appServer.url`, `authToken` і те, що віддалений app-server говорить тією самою версією протоколу Codex app-server.

**Модель не Codex використовує PI:** це очікувано, якщо ви не примусили `agentRuntime.id: "codex"` для цього агента або не вибрали застаріле посилання `codex/*`. Звичайні `openai/gpt-*` та інші посилання provider залишаються на своєму звичайному шляху provider у режимі `auto`. Якщо ви примусово встановите `agentRuntime.id: "codex"`, кожен вбудований хід для цього агента має бути моделлю OpenAI, яку підтримує Codex.

**Computer Use встановлено, але інструменти не запускаються:** перевірте
`/codex computer-use status` у новому сеансі. Якщо інструмент повідомляє
`Native hook relay unavailable`, скористайтеся `/new` або `/reset`; якщо проблема не зникає, перезапустіть
Gateway, щоб очистити застарілі реєстрації нативних hook. Якщо `computer-use.list_apps`
завершується за тайм-аутом, перезапустіть Codex Computer Use або Codex Desktop і повторіть спробу.

## Пов’язане

- [Plugin агентського harness](/uk/plugins/sdk-agent-harness)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Постачальники моделей](/uk/concepts/model-providers)
- [Постачальник OpenAI](/uk/providers/openai)
- [Стан](/uk/cli/status)
- [Hook Plugin](/uk/plugins/hooks)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing-live#live-codex-app-server-harness-smoke)
