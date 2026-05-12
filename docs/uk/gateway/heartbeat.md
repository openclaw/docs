---
read_when:
    - Налаштування періодичності Heartbeat або обміну повідомленнями
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:58:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat чи Cron?** Див. [Автоматизацію](/uk/automation), щоб зрозуміти, коли використовувати кожен із них.
</Note>

Heartbeat запускає **періодичні ходи агента** в основному сеансі, щоб модель могла повідомляти про все, що потребує уваги, не засмічуючи вас повідомленнями.

Heartbeat — це запланований хід основного сеансу, він **не** створює записи [фонових завдань](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані Cron-завдання).

Усунення проблем: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть частоту">
    Залиште Heartbeat увімкненим (за замовчуванням `30m` або `1h` для автентифікації Anthropic OAuth/токеном, зокрема повторного використання Claude CLI) або задайте власну частоту.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть короткий чекліст `HEARTBEAT.md` або блок `tasks:` у робочій області агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення Heartbeat">
    `target: "none"` є значенням за замовчуванням; задайте `target: "last"`, щоб спрямовувати повідомлення останньому контакту.
  </Step>
  <Step title="Необов’язкове налаштування">
    - Увімкніть доставку міркувань Heartbeat для прозорості.
    - Використовуйте полегшений початковий контекст, якщо для запусків Heartbeat потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сеанси, щоб не надсилати повну історію розмови під час кожного Heartbeat.
    - Обмежте Heartbeat активними годинами (за місцевим часом).

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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Значення за замовчуванням

- Інтервал: `30m` (або `1h`, коли виявлений режим автентифікації Anthropic OAuth/токеном, зокрема повторне використання Claude CLI). Задайте `agents.defaults.heartbeat.every` або `agents.list[].heartbeat.every` для окремого агента; використовуйте `0m`, щоб вимкнути.
- Тіло запиту (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Запит Heartbeat надсилається **дослівно** як повідомлення користувача. Системний запит містить розділ "Heartbeat" лише тоді, коли Heartbeat увімкнено для агента за замовчуванням, а запуск позначено внутрішньо.
- Коли Heartbeat вимкнено через `0m`, звичайні запуски також не включають `HEARTBEAT.md` у початковий контекст, щоб модель не бачила інструкцій, призначених лише для Heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза цим вікном Heartbeat пропускаються до наступного такту всередині вікна.
- Heartbeat автоматично відкладається, доки Cron-робота активна або стоїть у черзі. Задайте `heartbeat.skipWhenBusy: true`, щоб відкладати також за додатково зайнятих ліній (робота субагента або вкладеної команди); це корисно для локального Ollama та інших обмежених хостів з одним середовищем виконання.

## Для чого призначений запит Heartbeat

Запит за замовчуванням навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" спонукає агента переглядати подальші дії (вхідні, календар, нагадування, роботу в черзі) і повідомляти про все термінове.
- **Перевірка стану людини**: "Checkup sometimes on your human during day time" спонукає час від часу надсилати легке повідомлення на кшталт "щось потрібно?", але уникає нічного спаму завдяки використанню налаштованого локального часового поясу (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск Heartbeat не створює запис завдання.

Якщо ви хочете, щоб Heartbeat робив щось дуже конкретне (наприклад, "перевірити статистику Gmail PubSub" або "перевірити стан Gateway"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) з власним тілом (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Запуски Heartbeat з доступом до інструментів можуть натомість викликати `heartbeat_respond` з `notify: false` без видимого оновлення або `notify: true` разом із `notificationText` для сповіщення. Якщо структурована відповідь інструмента наявна, вона має пріоритет над текстовим резервним варіантом.
- Під час запусків Heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, коли він з’являється на **початку або в кінці** відповіді. Токен видаляється, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (за замовчуванням: 300).
- Якщо `HEARTBEAT_OK` з’являється **всередині** відповіді, він не обробляється особливим чином.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза Heartbeat випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється та журналюється; повідомлення, яке містить лише `HEARTBEAT_OK`, відкидається.

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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
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
- `agents.list[].heartbeat` накладається зверху; якщо будь-який агент має блок `heartbeat`, Heartbeat запускають **лише ці агенти**.
- `channels.defaults.heartbeat` задає значення видимості за замовчуванням для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає значення каналу за замовчуванням.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома обліковими записами) перевизначає налаштування для окремого каналу.

### Heartbeat на рівні агента

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, Heartbeat виконують **лише ці агенти**. Блок на рівні агента об’єднується поверх `agents.defaults.heartbeat` (тобто можна один раз задати спільні типові значення й перевизначати їх для кожного агента).

Приклад: два агенти, Heartbeat виконує лише другий агент.

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

Обмежте Heartbeat робочими годинами в конкретному часовому поясі:

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

Поза цим вікном (до 9:00 або після 22:00 за східним часом) Heartbeat пропускаються. Наступний запланований тик усередині вікна виконається звичайним чином.

### Налаштування 24/7

Якщо потрібно, щоб Heartbeat працювали весь день, використайте один із цих шаблонів:

- Повністю пропустіть `activeHours` (без обмеження часовим вікном; це типова поведінка).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це трактується як вікно нульової ширини, тому Heartbeat завжди пропускаються.
</Warning>

### Приклад із кількома обліковими записами

Використовуйте `accountId`, щоб спрямувати повідомлення на конкретний обліковий запис у каналах із кількома обліковими записами, як-от Telegram:

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

### Примітки до полів

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
  Коли `true`, запуски Heartbeat використовують полегшений контекст початкового завантаження й залишають лише `HEARTBEAT.md` із файлів початкового завантаження робочої області.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Коли `true`, кожен Heartbeat виконується в новій сесії без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й cron `sessionTarget: "isolated"`. Значно зменшує витрати токенів на кожен Heartbeat. Поєднайте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основної сесії.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Коли `true`, запуски Heartbeat відкладаються на додаткових зайнятих смугах: робота subagent або вкладених команд. Смуги Cron завжди відкладають Heartbeat, навіть без цього прапорця, тому хости локальних моделей не запускають підказки cron і Heartbeat одночасно.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сесії для запусків Heartbeat.

- `main` (типово): основна сесія агента.
- Явний ключ сесії (скопіюйте з `openclaw sessions --json` або [CLI сесій](/uk/cli/sessions)).
- Формати ключів сесій: див. [Сесії](/uk/concepts/session) і [Групи](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставити в останній використаний зовнішній канал.
- явний канал: будь-який налаштований канал або id plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (типово): запустити Heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою прямої доставки/DM. `allow`: дозволити пряму доставку/доставку DM для Heartbeat. `block`: придушити пряму доставку/доставку DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необов’язкове перевизначення одержувача (специфічний для каналу id, напр. E.164 для WhatsApp або id чату Telegram). Для тем/гілок Telegram використовуйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необов’язковий id облікового запису для каналів із кількома обліковими записами. Коли `target: "last"`, id облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше ігнорується. Якщо id облікового запису не відповідає налаштованому обліковому запису для визначеного каналу, доставка пропускається.

</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає типове тіло підказки (без об’єднання).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальна кількість символів, дозволена після `HEARTBEAT_OK` перед доставкою.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Якщо true, пригнічує payload-и попереджень про помилки інструментів під час запусків heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Обмежує запуски heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, не включно; `24:00` дозволено для кінця дня) і необов’язковим `timezone`.

- Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо задано, інакше повертається до часового поясу системи хоста.
- `"local"`: завжди використовує часовий пояс системи хоста.
- Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо недійсний, повертається до поведінки `"user"` вище.
- `start` і `end` не мають бути однаковими для активного вікна; однакові значення вважаються нульовою шириною (завжди поза вікном).
- Поза активним вікном heartbeat пропускаються до наступного такту всередині вікна.

</ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Маршрутизація сесії та цілі">
    - Heartbeat за замовчуванням запускаються в основній сесії агента (`agent:<id>:<mainKey>`) або в `global`, коли `session.scope = "global"`. Задайте `session`, щоб перевизначити на конкретну сесію каналу (Discord/WhatsApp/тощо).
    - `session` впливає лише на контекст запуску; доставкою керують `target` і `to`.
    - Щоб доставляти до конкретного каналу/одержувача, задайте `target` + `to`. З `target: "last"` доставка використовує останній зовнішній канал для цієї сесії.
    - Доставки heartbeat за замовчуванням дозволяють прямі/DM цілі. Задайте `directPolicy: "block"`, щоб пригнічувати надсилання до прямих цілей, але все одно запускати хід heartbeat.
    - Якщо основна черга, лінія цільової сесії, лінія cron або активне завдання cron зайняті, heartbeat пропускається і повторюється пізніше.
    - Якщо `skipWhenBusy: true`, підлеглі агенти й вкладені лінії також відкладають запуски heartbeat.
    - Якщо `target` не резолвиться в жодне зовнішнє місце призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається заздалегідь як `reason=alerts-disabled`.
    - Якщо вимкнено лише доставку сповіщень, OpenClaw усе одно може запустити heartbeat, оновити часові мітки належних завдань, відновити часову мітку бездіяльності сесії та пригнітити зовнішній payload сповіщення.
    - Якщо розв’язана ціль heartbeat підтримує typing, OpenClaw показує typing, поки запуск heartbeat активний. Це використовує ту саму ціль, до якої heartbeat надсилав би чат-вивід, і вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сесії та аудит">
    - Відповіді лише heartbeat **не** підтримують сесію активною. Метадані heartbeat можуть оновлювати рядок сесії, але закінчення строку через бездіяльність використовує `lastInteractionAt` з останнього справжнього повідомлення користувача/каналу, а щоденне закінчення строку використовує `sessionStartedAt`.
    - Історія Control UI та WebChat приховує prompts heartbeat і підтвердження лише OK. Базова стенограма сесії все ще може містити ці ходи для аудиту/відтворення.
    - Відокремлені [фонові завдання](/uk/automation/tasks) можуть поставити системну подію в чергу й розбудити heartbeat, коли основна сесія має швидко щось помітити. Це пробудження не перетворює запуск heartbeat на фонове завдання.

  </Accordion>
</AccordionGroup>

## Елементи керування видимістю

За замовчуванням підтвердження `HEARTBEAT_OK` пригнічуються, тоді як вміст сповіщень доставляється. Ви можете налаштувати це для кожного каналу або акаунта:

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

Пріоритет: для акаунта → для каналу → типові значення каналу → вбудовані типові значення.

### Що робить кожен прапорець

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь лише OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає відповідь не OK.
- `useIndicator`: генерує події індикатора для поверхонь статусу UI.

Якщо **усі три** мають значення false, OpenClaw повністю пропускає запуск heartbeat (без виклику моделі).

### Приклади для каналу та для акаунта

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

| Мета                                     | Конфігурація                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Типова поведінка (тихі OK, сповіщення ввімкнено) | _(конфігурація не потрібна)_                                                            |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необов’язково)

Якщо файл `HEARTBEAT.md` існує в робочій області, типовий prompt каже агенту прочитати його. Думайте про нього як про ваш "контрольний список heartbeat": малий, стабільний і безпечний для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` вставляється лише тоді, коли настанови heartbeat увімкнені для типового агента. Вимкнення cadence heartbeat через `0m` або встановлення `includeSystemPromptSection: false` пропускає його зі звичайного контексту bootstrap.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити виклики API. Цей пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, heartbeat усе одно запускається, а модель вирішує, що робити.

Тримайте його крихітним (короткий контрольний список або нагадування), щоб уникнути роздуття prompt.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує невеликий структурований блок `tasks:` для перевірок на основі інтервалів усередині самого heartbeat.

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
    - OpenClaw розбирає блок `tasks:` і перевіряє кожне завдання за його власним `interval`.
    - До prompt heartbeat для цього такту включаються лише завдання, строк яких **настав**.
    - Якщо строк жодного завдання не настав, heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
    - Вміст `HEARTBEAT.md`, що не є завданнями, зберігається й додається як додатковий контекст після списку належних завдань.
    - Часові мітки останнього запуску завдань зберігаються в стані сесії (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
    - Часові мітки завдань просуваються лише після того, як запуск heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як виконані.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли ви хочете, щоб один файл heartbeat містив кілька періодичних перевірок без оплати за всі з них на кожному такті.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви попросите його про це.

`HEARTBEAT.md` — це просто звичайний файл у робочій області агента, тож ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Онови `HEARTBEAT.md`, щоб додати щоденну перевірку календаря."
- "Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на подальших діях щодо inbox."

Якщо ви хочете, щоб це відбувалося проактивно, ви також можете додати явний рядок у ваш prompt heartbeat, наприклад: "Якщо контрольний список застаріє, онови HEARTBEAT.md кращою версією."

<Warning>
Не кладіть секрети (API-ключі, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною контексту prompt.
</Warning>

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу й негайно запустити heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо кілька агентів мають налаштований `heartbeat`, ручне пробудження негайно запускає heartbeat кожного з цих агентів.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого такту.

## Доставка міркувань (необов’язково)

За замовчуванням heartbeat доставляють лише фінальний payload "відповіді".

Якщо ви хочете прозорості, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли ввімкнено, heartbeat також доставлятиме окреме повідомлення з префіксом `Reasoning:` (така сама форма, як `/reasoning on`). Це може бути корисно, коли агент керує кількома сесіями/екземплярами codex і ви хочете бачити, чому він вирішив пінганути вас, але це також може розкрити більше внутрішніх деталей, ніж ви хочете. У групових чатах краще залишати це вимкненим.

## Усвідомлення вартості

Heartbeat запускають повні ходи агента. Коротші інтервали спалюють більше токенів. Щоб зменшити вартість:

- Використовуйте `isolatedSession: true`, щоб не надсилати повну історію розмови (~100K токенів до ~2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити файли bootstrap лише `HEARTBEAT.md`.
- Задайте дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` малим.
- Використовуйте `target: "none"`, якщо вам потрібні лише внутрішні оновлення стану.

## Переповнення контексту після heartbeat

Якщо heartbeat раніше залишив наявну сесію на меншій локальній моделі, наприклад моделі Ollama з вікном 32k, а наступний хід основної сесії повідомляє про переповнення контексту, скиньте runtime-модель сесії назад до налаштованої основної моделі. Повідомлення скидання OpenClaw вказує на це, коли остання runtime-модель збігається з налаштованою `heartbeat.model`.

Поточні heartbeat зберігають наявну runtime-модель спільної сесії після завершення запуску. Ви все ще можете використовувати `isolatedSession: true`, щоб запускати heartbeat у свіжій сесії, поєднувати це з `lightContext: true` для найменшого prompt або вибрати модель heartbeat із достатньо великим вікном контексту для спільної сесії.

## Пов’язане

- [Автоматизація](/uk/automation) — усі механізми автоматизації з першого погляду
- [Фонові завдання](/uk/automation/tasks) — як відстежується відокремлена робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на планування heartbeat
- [Усунення несправностей](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
