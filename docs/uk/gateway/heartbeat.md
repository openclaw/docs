---
read_when:
    - Налаштування частоти Heartbeat або обміну повідомленнями
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-04-28T03:37:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fb2c900c8190b963c795ca7dcfc5627451ebd1e9d5291d330a644e13d358d4
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat чи Cron?** Див. [Автоматизація та завдання](/uk/automation), щоб зрозуміти, коли використовувати кожен варіант.
</Note>

Heartbeat виконує **періодичні ходи агента** в основному сеансі, щоб модель могла повідомляти про все, що потребує уваги, не засипаючи вас повідомленнями.

Heartbeat — це запланований хід в основному сеансі; він **не** створює записи [фонових завдань](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані завдання Cron).

Усунення несправностей: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть частоту">
    Залиште Heartbeat увімкненим (типово `30m` або `1h` для автентифікації Anthropic OAuth/токеном, включно з повторним використанням Claude CLI) або задайте власну частоту.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть невеликий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочому просторі агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення Heartbeat">
    `target: "none"` — типове значення; задайте `target: "last"`, щоб спрямовувати повідомлення останньому контакту.
  </Step>
  <Step title="Необов’язкове налаштування">
    - Увімкніть доставку міркувань Heartbeat для прозорості.
    - Використовуйте полегшений початковий контекст, якщо запускам Heartbeat потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сеанси, щоб не надсилати повну історію розмови під час кожного Heartbeat.
    - Обмежте Heartbeat активними годинами (місцевий час).

  </Step>
</Steps>

Приклад конфігурації:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Типові значення

- Інтервал: `30m` (або `1h`, коли виявлений режим автентифікації Anthropic OAuth/токеном, включно з повторним використанням Claude CLI). Задайте `agents.defaults.heartbeat.every` або `agents.list[].heartbeat.every`; використовуйте `0m`, щоб вимкнути.
- Тіло промпта (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Промпт Heartbeat надсилається **дослівно** як повідомлення користувача. Системний промпт містить розділ "Heartbeat" лише тоді, коли Heartbeat увімкнено для типового агента, а запуск внутрішньо позначено відповідним прапорцем.
- Коли Heartbeat вимкнено за допомогою `0m`, звичайні запуски також не додають `HEARTBEAT.md` до початкового контексту, щоб модель не бачила інструкції, призначені лише для Heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза цим вікном Heartbeat пропускається до наступного такту всередині вікна.

## Для чого потрібен промпт Heartbeat

Типовий промпт навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" спонукає агента переглянути подальші дії (вхідні, календар, нагадування, роботу в черзі) і повідомити про все термінове.
- **Перевірка стану людини**: "Checkup sometimes on your human during day time" спонукає час від часу надсилати легке повідомлення "чи вам щось потрібно?", але уникає нічного спаму завдяки використанню налаштованого локального часового поясу (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск Heartbeat не створює запис завдання.

Якщо ви хочете, щоб Heartbeat робив щось дуже конкретне (наприклад, "check Gmail PubSub stats" або "verify gateway health"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) як власне тіло (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Під час запусків Heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, якщо він з’являється на **початку або в кінці** відповіді. Токен видаляється, а відповідь відкидається, якщо решта вмісту має довжину **≤ `ackMaxChars`** (типово: 300).
- Якщо `HEARTBEAT_OK` з’являється **посередині** відповіді, він не обробляється особливо.
- Для сповіщень **не** додавайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза Heartbeat випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється й записується в журнал; повідомлення, яке складається лише з `HEARTBEAT_OK`, відкидається.

## Конфігурація

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Область дії та пріоритет

- `agents.defaults.heartbeat` задає глобальну поведінку Heartbeat.
- `agents.list[].heartbeat` об’єднується поверх нього; якщо будь-який агент має блок `heartbeat`, Heartbeat запускають **лише ці агенти**.
- `channels.defaults.heartbeat` задає типові параметри видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає типові параметри каналу.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома обліковими записами) перевизначає налаштування для кожного каналу.

### Heartbeat для окремого агента

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, Heartbeat запускають **лише ці агенти**. Блок окремого агента об’єднується поверх `agents.defaults.heartbeat` (тобто ви можете один раз задати спільні типові параметри й перевизначати їх для окремих агентів).

Приклад: два агенти, Heartbeat запускає лише другий агент.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Приклад активних годин

Обмежте Heartbeat робочими годинами в певному часовому поясі:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Поза цим вікном (до 9:00 або після 22:00 за східним часом) Heartbeat пропускається. Наступний запланований такт усередині вікна виконається звичайно.

### Налаштування 24/7

Якщо ви хочете, щоб Heartbeat працював увесь день, використовуйте один із цих шаблонів:

- Повністю пропустіть `activeHours` (без обмеження часовим вікном; це типова поведінка).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це вважається вікном нульової ширини, тому Heartbeat завжди пропускатиметься.
</Warning>

### Приклад із кількома обліковими записами

Використовуйте `accountId`, щоб націлитися на певний обліковий запис у каналах із кількома обліковими записами, як-от Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Нотатки щодо полів

<ParamField path="every" type="string">
  Інтервал Heartbeat (рядок тривалості; типова одиниця = хвилини).
</ParamField>
<ParamField path="model" type="string">
  Необов’язкове перевизначення моделі для запусків Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Якщо ввімкнено, також доставляє окреме повідомлення `Reasoning:`, коли воно доступне (та сама форма, що й `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Якщо `true`, запуски Heartbeat використовують полегшений початковий контекст і зберігають лише `HEARTBEAT.md` із початкових файлів робочого простору.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Якщо `true`, кожен Heartbeat запускається в новому сеансі без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й Cron `sessionTarget: "isolated"`. Значно зменшує витрати токенів на кожен Heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основного сеансу.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сеансу для запусків Heartbeat.

  - `main` (типово): основний сеанс агента.
  - Явний ключ сеансу (скопіюйте з `openclaw sessions --json` або [CLI сеансів](/uk/cli/sessions)).
  - Формати ключів сеансів: див. [Сеанси](/uk/concepts/session) і [Групи](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
  - `last`: доставляти в останній використаний зовнішній канал.
  - явний канал: будь-який налаштований канал або ідентифікатор Plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
  - `none` (типово): виконувати Heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою доставки напряму/в DM. `allow`: дозволити доставку Heartbeat напряму/в DM. `block`: пригнічувати доставку напряму/в DM (`reason=dm-blocked`).
</ParamField>
<ParamField path="to" type="string">
  Необов’язкове перевизначення отримувача (ідентифікатор, специфічний для каналу, наприклад E.164 для WhatsApp або ідентифікатор чату Telegram). Для тем/гілок Telegram використовуйте `<chatId>:topic:<messageThreadId>`.
</ParamField>
<ParamField path="accountId" type="string">
  Необов’язковий ідентифікатор облікового запису для каналів із кількома обліковими записами. Коли `target: "last"`, ідентифікатор облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше ігнорується. Якщо ідентифікатор облікового запису не збігається з налаштованим обліковим записом для визначеного каналу, доставка пропускається.
</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає типове тіло промпта (без об’єднання).
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальна кількість символів, дозволена після `HEARTBEAT_OK` перед доставкою.
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Якщо `true`, пригнічує попереджувальні payload-и про помилки інструментів під час запусків Heartbeat.
</ParamField>
<ParamField path="activeHours" type="object">
  Обмежує запуски Heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, не включно; `24:00` дозволено для кінця дня) і необов’язковим `timezone`.

  - Якщо не вказано або задано `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо його задано; інакше повертається до часового поясу системи хоста.
  - `"local"`: завжди використовує часовий пояс системи хоста.
  - Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо він недійсний, застосовується поведінка `"user"`, описана вище.
  - `start` і `end` не мають бути однаковими для активного вікна; однакові значення вважаються вікном нульової ширини (завжди поза вікном).
  - Поза активним вікном Heartbeat пропускається до наступного такту всередині вікна.

</ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Маршрутизація сеансу й цілі">
    - Heartbeat типово запускається в основному сеансі агента (`agent:<id>:<mainKey>`) або в `global`, коли `session.scope = "global"`. Задайте `session`, щоб перевизначити на конкретний сеанс каналу (Discord/WhatsApp тощо).
    - `session` впливає лише на контекст запуску; доставкою керують `target` і `to`.
    - Щоб доставляти до конкретного каналу/отримувача, задайте `target` + `to`. З `target: "last"` доставка використовує останній зовнішній канал для цього сеансу.
    - Доставки Heartbeat типово дозволяють прямі/DM-цілі. Задайте `directPolicy: "block"`, щоб пригнічувати надсилання до прямих цілей, але все одно виконувати хід Heartbeat.
    - Якщо основна черга зайнята, Heartbeat пропускається й повторюється пізніше.
    - Якщо `target` не визначає зовнішнього призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається наперед із `reason=alerts-disabled`.
    - Якщо вимкнено лише доставку сповіщень, OpenClaw усе одно може запустити Heartbeat, оновити часові мітки завдань, термін яких настав, відновити часову мітку простою сеансу й пригнітити зовнішній payload сповіщення.
    - Якщо визначена ціль Heartbeat підтримує індикатор набору, OpenClaw показує набір тексту, поки запуск Heartbeat активний. Для цього використовується та сама ціль, куди Heartbeat надсилав би вивід чату, і це вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сеансу й аудит">
    - Відповіді лише від Heartbeat **не** підтримують сеанс активним. Метадані Heartbeat можуть оновлювати рядок сеансу, але завершення через простій використовує `lastInteractionAt` з останнього справжнього повідомлення користувача/каналу, а щоденне завершення — `sessionStartedAt`.
    - Історія Control UI та WebChat приховує промпти Heartbeat і підтвердження, що містять лише OK. Базовий транскрипт сеансу все одно може містити ці ходи для аудиту/відтворення.
    - Відокремлені [фонові завдання](/uk/automation/tasks) можуть поставити системну подію в чергу й розбудити Heartbeat, коли основний сеанс має швидко щось помітити. Таке пробудження не робить запуск Heartbeat фоновим завданням.

  </Accordion>
</AccordionGroup>

## Керування видимістю

Типово підтвердження `HEARTBEAT_OK` пригнічуються, а вміст сповіщень доставляється. Ви можете налаштувати це для кожного каналу або облікового запису:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Пріоритет: для облікового запису → для каналу → типові параметри каналу → вбудовані типові параметри.

### Що робить кожен прапорець

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь, що містить лише OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає відповідь не-OK.
- `useIndicator`: генерує події індикатора для поверхонь стану UI.

Якщо **усі три** мають значення false, OpenClaw повністю пропускає запуск Heartbeat (без виклику моделі).

### Приклади для каналу й для облікового запису

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Поширені шаблони

| Ціль                                       | Конфігурація                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Типова поведінка (тихі OK, сповіщення ввімкнено) | _(конфігурація не потрібна)_                                                            |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)           | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необов’язково)

Якщо файл `HEARTBEAT.md` існує в робочому просторі, типовий промпт каже агенту прочитати його. Сприймайте його як свій "контрольний список Heartbeat": невеликий, стабільний і безпечний для додавання кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` додається лише тоді, коли інструкції Heartbeat увімкнено для типового агента. Вимкнення частоти Heartbeat за допомогою `0m` або встановлення `includeSystemPromptSection: false` прибирає його зі звичайного початкового контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки й заголовки markdown на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб заощадити виклики API. Такий пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, Heartbeat усе одно запускається, а модель вирішує, що робити.

Тримайте його дуже малим (короткий контрольний список або нагадування), щоб уникати роздування промпта.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує невеликий структурований блок `tasks:` для перевірок на основі інтервалів усередині самого Heartbeat.

Приклад:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Поведінка">
    - OpenClaw аналізує блок `tasks:` і перевіряє кожне завдання за його власним `interval`.
    - У промпт Heartbeat для цього такту включаються лише завдання, **термін яких настав**.
    - Якщо немає завдань, термін яких настав, Heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
    - Вміст у `HEARTBEAT.md`, який не належить до завдань, зберігається й додається як додатковий контекст після списку завдань, термін яких настав.
    - Часові мітки останнього запуску завдань зберігаються в стані сеансу (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
    - Часові мітки завдань просуваються лише після того, як запуск Heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як завершені.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли ви хочете, щоб один файл Heartbeat містив кілька періодичних перевірок без оплати за всі з них на кожному такті.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви попросите його про це.

`HEARTBEAT.md` — це просто звичайний файл у робочому просторі агента, тож ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Онови `HEARTBEAT.md`, щоб додати щоденну перевірку календаря."
- "Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на подальших діях щодо вхідних."

Якщо ви хочете, щоб це відбувалося проактивно, ви також можете додати явний рядок у промпт Heartbeat, наприклад: "Якщо контрольний список застаріє, онови HEARTBEAT.md на кращий."

<Warning>
Не додавайте секрети (ключі API, номери телефонів, приватні токени) до `HEARTBEAT.md` — він стає частиною контексту промпта.
</Warning>

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу й запустити негайний Heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо Heartbeat налаштовано для кількох агентів, ручне пробудження негайно запускає Heartbeat для кожного з цих агентів.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого такту.

## Доставка міркувань (необов’язково)

Типово Heartbeat доставляє лише фінальний payload "відповіді".

Якщо вам потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли ввімкнено, Heartbeat також доставлятиме окреме повідомлення з префіксом `Reasoning:` (та сама форма, що й `/reasoning on`). Це може бути корисно, коли агент керує кількома сеансами/кодексами й ви хочете бачити, чому він вирішив написати вам, але це також може розкрити більше внутрішніх деталей, ніж вам потрібно. У групових чатах краще залишати це вимкненим.

## Обізнаність про вартість

Heartbeat виконує повні ходи агента. Коротші інтервали витрачають більше токенів. Щоб зменшити вартість:

- Використовуйте `isolatedSession: true`, щоб не надсилати повну історію розмови (~100 тис. токенів до ~2–5 тис. на запуск).
- Використовуйте `lightContext: true`, щоб обмежити початкові файли лише `HEARTBEAT.md`.
- Задайте дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` малим.
- Використовуйте `target: "none"`, якщо вам потрібні лише оновлення внутрішнього стану.

## Переповнення контексту після Heartbeat

Якщо Heartbeat використовує меншу локальну модель, наприклад модель Ollama з вікном 32k, а наступний хід основного сеансу повідомляє про переповнення контексту, перевірте, чи попередній Heartbeat не залишив сеанс на моделі Heartbeat. Повідомлення скидання OpenClaw вказує на це, коли остання модель часу виконання збігається з налаштованою `heartbeat.model`.

Використовуйте `isolatedSession: true`, щоб запускати Heartbeat у новому сеансі, поєднуйте це з `lightContext: true` для найменшого промпта або виберіть модель Heartbeat із контекстним вікном, достатньо великим для спільного сеансу.

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — огляд усіх механізмів автоматизації
- [Фонові завдання](/uk/automation/tasks) — як відстежується відокремлена робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на планування Heartbeat
- [Усунення несправностей](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
