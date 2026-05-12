---
read_when:
    - Налаштування частоти Heartbeat або повідомлень
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat та правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat чи cron?** Див. [Automation](/uk/automation), щоб зрозуміти, коли використовувати кожен із них.
</Note>

Heartbeat запускає **періодичні ходи агента** в основній сесії, щоб модель могла показувати те, що потребує уваги, не засипаючи вас повідомленнями.

Heartbeat — це запланований хід основної сесії; він **не** створює записи [фонових завдань](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані cron-завдання).

Усунення несправностей: [Scheduled Tasks](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть частоту">
    Залиште Heartbeat увімкненими (за замовчуванням `30m`, або `1h` для Anthropic OAuth/токен-автентифікації, зокрема повторного використання Claude CLI) або задайте власну частоту.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть невеликий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочому просторі агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення Heartbeat">
    `target: "none"` — значення за замовчуванням; задайте `target: "last"`, щоб спрямовувати їх до останнього контакту.
  </Step>
  <Step title="Необов’язкове налаштування">
    - Увімкніть доставку міркувань Heartbeat для прозорості.
    - Використовуйте полегшений початковий контекст, якщо для запусків Heartbeat потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сесії, щоб не надсилати повну історію розмови під час кожного Heartbeat.
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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Значення за замовчуванням

- Інтервал: `30m` (або `1h`, коли виявлено режим автентифікації Anthropic OAuth/токеном, зокрема повторне використання Claude CLI). Задайте `agents.defaults.heartbeat.every` або `agents.list[].heartbeat.every` для окремого агента; використовуйте `0m`, щоб вимкнути.
- Тіло промпта (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Промпт Heartbeat надсилається **дослівно** як повідомлення користувача. Системний промпт містить розділ "Heartbeat" лише коли Heartbeat увімкнено для агента за замовчуванням, а запуск позначено внутрішньо.
- Коли Heartbeat вимкнено через `0m`, звичайні запуски також не включають `HEARTBEAT.md` до початкового контексту, щоб модель не бачила інструкції, призначені лише для Heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза цим вікном Heartbeat пропускаються до наступного тику всередині вікна.
- Heartbeat автоматично відкладаються, поки cron-робота активна або стоїть у черзі. Задайте `heartbeat.skipWhenBusy: true`, щоб також відкладати агента на його власних прив’язаних до ключа сесії субагентських або вкладених командних смугах; сусідні агенти більше не призупиняються лише тому, що інший агент має субагентську роботу в процесі.

## Для чого потрібен промпт Heartbeat

Промпт за замовчуванням навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" підштовхує агента переглянути подальші дії (вхідні, календар, нагадування, роботу в черзі) і показати все термінове.
- **Перевірка людини**: "Checkup sometimes on your human during day time" підштовхує до періодичного легкого повідомлення "щось потрібно?", але уникає нічного спаму, використовуючи ваш налаштований місцевий часовий пояс (див. [Timezone](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск Heartbeat не створює запис завдання.

Якщо ви хочете, щоб Heartbeat виконував щось дуже конкретне (наприклад, "перевірити статистику Gmail PubSub" або "перевірити стан Gateway"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) як власне тіло (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Запуски Heartbeat із підтримкою інструментів можуть натомість викликати `heartbeat_respond` з `notify: false` для відсутності видимого оновлення або `notify: true` плюс `notificationText` для сповіщення. Якщо структурована відповідь інструмента присутня, вона має пріоритет над текстовим резервним варіантом.
- Під час запусків Heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, коли воно з’являється на **початку або в кінці** відповіді. Токен видаляється, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (за замовчуванням: 300).
- Якщо `HEARTBEAT_OK` з’являється **посередині** відповіді, воно не обробляється особливим чином.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза Heartbeat випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється і логуються; повідомлення, яке містить лише `HEARTBEAT_OK`, відкидається.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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
- `channels.<channel>.heartbeat` перевизначає значення каналів за замовчуванням.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома обліковими записами) перевизначає налаштування для каналу.

### Heartbeat для окремого агента

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, Heartbeat запускають **лише ці агенти**. Блок окремого агента накладається на `agents.defaults.heartbeat` (тож ви можете один раз задати спільні значення за замовчуванням і перевизначати їх для кожного агента).

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

Поза цим вікном (до 9:00 або після 22:00 за східним часом) Heartbeat пропускаються. Наступний запланований тик усередині вікна запуститься звичайно.

### Налаштування 24/7

Якщо ви хочете, щоб Heartbeat працювали весь день, використовуйте один із цих шаблонів:

- Повністю опустіть `activeHours` (немає обмеження часовим вікном; це поведінка за замовчуванням).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це трактується як вікно нульової ширини, тому Heartbeat завжди пропускаються.
</Warning>

### Приклад кількох облікових записів

Використовуйте `accountId`, щоб націлитися на конкретний обліковий запис у каналах із кількома обліковими записами, як-от Telegram:

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
  Інтервал Heartbeat (рядок тривалості; одиниця за замовчуванням = хвилини).
</ParamField>
<ParamField path="model" type="string">
  Необов’язкове перевизначення моделі для запусків Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Якщо ввімкнено, також доставляє окреме повідомлення `Reasoning:`, коли воно доступне (та сама форма, що й `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Якщо true, запуски Heartbeat використовують полегшений початковий контекст і залишають лише `HEARTBEAT.md` із файлів початкового завантаження робочого простору.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Якщо true, кожен Heartbeat запускається в новій сесії без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й cron `sessionTarget: "isolated"`. Значно зменшує токен-вартість кожного Heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основної сесії.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Якщо true, запуски Heartbeat відкладаються на додаткових зайнятих смугах цього агента: його власній прив’язаній до ключа сесії субагентській або вкладеній командній роботі. Смуги cron завжди відкладають Heartbeat, навіть без цього прапорця, щоб хости локальних моделей не запускали cron і промпти Heartbeat одночасно.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сесії для запусків Heartbeat.

- `main` (за замовчуванням): основна сесія агента.
- Явний ключ сесії (скопіюйте з `openclaw sessions --json` або з [sessions CLI](/uk/cli/sessions)).
- Формати ключів сесій: див. [Sessions](/uk/concepts/session) і [Groups](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставити до останнього використаного зовнішнього каналу.
- явний канал: будь-який налаштований канал або ідентифікатор Plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (за замовчуванням): запустити Heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою прямої/DM-доставки. `allow`: дозволити пряму/DM-доставку Heartbeat. `block`: придушити пряму/DM-доставку (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необов’язкове перевизначення одержувача (ідентифікатор, специфічний для каналу, наприклад E.164 для WhatsApp або ідентифікатор чату Telegram). Для тем/тредів Telegram використовуйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необов’язковий ідентифікатор облікового запису для каналів із кількома обліковими записами. Коли `target: "last"`, ідентифікатор облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше він ігнорується. Якщо ідентифікатор облікового запису не відповідає налаштованому обліковому запису для визначеного каналу, доставка пропускається.

</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає стандартне тіло prompt (не об’єднується).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальна кількість символів, дозволена після `HEARTBEAT_OK` перед доставленням.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Якщо true, пригнічує payload-и попереджень про помилки інструментів під час запусків Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Обмежує запуски Heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, не включно; `24:00` дозволено для кінця дня) та необов’язковим `timezone`.

- Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо задано, інакше повертається до часового поясу системи-хоста.
- `"local"`: завжди використовує часовий пояс системи-хоста.
- Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо недійсний, повертається до поведінки `"user"` вище.
- `start` і `end` не мають бути однаковими для активного вікна; однакові значення трактуються як вікно нульової ширини (завжди поза вікном).
- Поза активним вікном Heartbeat-и пропускаються до наступного тіку всередині вікна.

</ParamField>

## Поведінка доставлення

<AccordionGroup>
  <Accordion title="Маршрутизація сеансу й цілі">
    - Heartbeat-и типово запускаються в основному сеансі агента (`agent:<id>:<mainKey>`) або в `global`, коли `session.scope = "global"`. Задайте `session`, щоб перевизначити на конкретний сеанс каналу (Discord/WhatsApp/тощо).
    - `session` впливає лише на контекст запуску; доставлення контролюється `target` і `to`.
    - Щоб доставити в конкретний канал/отримувачу, задайте `target` + `to`. З `target: "last"` доставлення використовує останній зовнішній канал для цього сеансу.
    - Доставлення Heartbeat типово дозволяють прямі/DM-цілі. Задайте `directPolicy: "block"`, щоб пригнітити надсилання прямим цілям, але все одно виконати хід Heartbeat.
    - Якщо основна черга, lane цільового сеансу, lane Cron або активне завдання Cron зайняті, Heartbeat пропускається й повторюється пізніше.
    - Якщо `skipWhenBusy: true`, підagent цього агента з ключем сеансу та вкладені lanes також відкладають запуски Heartbeat. Зайняті lanes інших агентів не відкладають цього агента.
    - Якщо `target` не розв’язується в жодне зовнішнє призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається наперед як `reason=alerts-disabled`.
    - Якщо вимкнено лише доставлення сповіщень, OpenClaw усе одно може запустити Heartbeat, оновити timestamps завдань із наставшим строком, відновити timestamp простою сеансу та пригнітити зовнішній payload сповіщення.
    - Якщо розв’язана ціль Heartbeat підтримує індикатор набору, OpenClaw показує набір, доки запуск Heartbeat активний. Для цього використовується та сама ціль, куди Heartbeat надіслав би вивід чату, і це вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сеансу й аудит">
    - Відповіді лише від Heartbeat **не** підтримують сеанс активним. Метадані Heartbeat можуть оновити рядок сеансу, але закінчення строку через простій використовує `lastInteractionAt` з останнього справжнього повідомлення користувача/каналу, а щоденне закінчення строку використовує `sessionStartedAt`.
    - Control UI та історія WebChat приховують prompts Heartbeat і підтвердження лише з OK. Базова транскрипція сеансу все ще може містити ці ходи для аудиту/відтворення.
    - Від’єднані [фонові завдання](/uk/automation/tasks) можуть поставити системну подію в чергу та розбудити Heartbeat, коли основний сеанс має швидко щось помітити. Це пробудження не робить запуск Heartbeat фоновим завданням.

  </Accordion>
</AccordionGroup>

## Елементи керування видимістю

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

Пріоритет: для облікового запису → для каналу → стандартні значення каналу → вбудовані стандартні значення.

### Що робить кожен прапорець

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь лише з OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає відповідь не з OK.
- `useIndicator`: випускає події індикатора для поверхонь статусу UI.

Якщо **всі три** мають значення false, OpenClaw повністю пропускає запуск Heartbeat (без виклику моделі).

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

| Мета                                           | Конфігурація                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Стандартна поведінка (тихі OK, сповіщення ввімкнені) | _(конфігурація не потрібна)_                                                            |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)               | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                        | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необов’язково)

Якщо файл `HEARTBEAT.md` існує в робочій області, стандартний prompt каже агенту прочитати його. Думайте про нього як про ваш "чекліст Heartbeat": малий, стабільний і безпечний для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` вставляється лише тоді, коли інструкції Heartbeat увімкнені для стандартного агента. Вимкнення каденції Heartbeat через `0m` або встановлення `includeSystemPromptSection: false` вилучає його зі звичайного bootstrap-контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та Markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб заощадити виклики API. Цей пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, Heartbeat усе одно запускається, а модель вирішує, що робити.

Тримайте його дуже малим (короткий чекліст або нагадування), щоб уникнути роздування prompt.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує невеликий структурований блок `tasks:` для перевірок на основі інтервалів всередині самого Heartbeat.

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
    - До prompt Heartbeat для цього тіку включаються лише завдання, **строк яких настав**.
    - Якщо немає завдань зі строком, що настав, Heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути змарнованого виклику моделі.
    - Вміст у `HEARTBEAT.md`, який не є завданням, зберігається й додається як додатковий контекст після списку завдань зі строком, що настав.
    - Timestamps останнього запуску завдань зберігаються у стані сеансу (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
    - Timestamps завдань просуваються лише після того, як запуск Heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як виконані.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли ви хочете, щоб один файл Heartbeat містив кілька періодичних перевірок без оплати за всі з них на кожному тіці.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви попросите його.

`HEARTBEAT.md` — це просто звичайний файл у робочій області агента, тому ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Онови `HEARTBEAT.md`, щоб додати щоденну перевірку календаря."
- "Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на подальших діях щодо inbox."

Якщо ви хочете, щоб це відбувалося проактивно, ви також можете включити явний рядок у ваш prompt Heartbeat, наприклад: "Якщо чекліст застаріє, онови HEARTBEAT.md кращим."

<Warning>
Не кладіть секрети (ключі API, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною контексту prompt.
</Warning>

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу та запустити негайний Heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо `heartbeat` налаштовано для кількох агентів, ручне пробудження негайно запускає Heartbeat-и кожного з цих агентів.

Використовуйте `--mode next-heartbeat`, щоб зачекати на наступний запланований тік.

## Доставлення reasoning (необов’язково)

Типово Heartbeat-и доставляють лише фінальний payload "answer".

Якщо вам потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли це ввімкнено, Heartbeat-и також доставлятимуть окреме повідомлення з префіксом `Reasoning:` (така сама форма, як `/reasoning on`). Це може бути корисно, коли агент керує кількома сеансами/codexes і ви хочете бачити, чому він вирішив надіслати вам ping, але це також може розкрити більше внутрішніх деталей, ніж вам потрібно. У групових чатах краще залишати це вимкненим.

## Обізнаність про витрати

Heartbeat-и запускають повні ходи агента. Коротші інтервали спалюють більше токенів. Щоб зменшити витрати:

- Використовуйте `isolatedSession: true`, щоб не надсилати повну історію розмови (приблизно зі 100K токенів до приблизно 2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Задайте дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` малим.
- Використовуйте `target: "none"`, якщо вам потрібні лише оновлення внутрішнього стану.

## Переповнення контексту після Heartbeat

Якщо Heartbeat раніше залишив наявний сеанс на меншій локальній моделі, наприклад моделі Ollama з вікном 32k, а наступний хід основного сеансу повідомляє про переповнення контексту, скиньте runtime-модель сеансу назад до налаштованої основної моделі. Повідомлення скидання OpenClaw прямо вказує на це, коли остання runtime-модель відповідає налаштованій `heartbeat.model`.

Поточні Heartbeat-и зберігають наявну runtime-модель спільного сеансу після завершення запуску. Ви все ще можете використовувати `isolatedSession: true`, щоб запускати Heartbeat-и у свіжому сеансі, поєднувати це з `lightContext: true` для найменшого prompt або вибрати модель Heartbeat з вікном контексту, достатньо великим для спільного сеансу.

## Пов’язане

- [Автоматизація](/uk/automation) — усі механізми автоматизації стисло
- [Фонові завдання](/uk/automation/tasks) — як відстежується від’єднана робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на планування Heartbeat
- [Усунення несправностей](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
