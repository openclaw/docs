---
read_when:
    - Налаштування частоти Heartbeat або повідомлень
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T15:47:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat чи cron?** Див. [Автоматизація та завдання](/uk/automation), щоб зрозуміти, коли використовувати кожне.
</Note>

Heartbeat запускає **періодичні ходи агента** в основній сесії, щоб модель могла виявляти все, що потребує уваги, не засипаючи вас повідомленнями.

Heartbeat — це запланований хід основної сесії; він **не** створює записи [фонового завдання](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані завдання cron).

Усунення несправностей: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть частоту">
    Залиште Heartbeat увімкненим (типово `30m`, або `1h` для автентифікації Anthropic OAuth/токеном, зокрема повторного використання Claude CLI) або задайте власну частоту.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть короткий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочому просторі агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення Heartbeat">
    `target: "none"` є типовим значенням; задайте `target: "last"`, щоб спрямовувати повідомлення останньому контакту.
  </Step>
  <Step title="Необов’язкове налаштування">
    - Увімкніть доставку міркувань Heartbeat для прозорості.
    - Використовуйте полегшений початковий контекст, якщо запускам Heartbeat потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сесії, щоб не надсилати повну історію розмови під час кожного Heartbeat.
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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Типові значення

- Інтервал: `30m` (або `1h`, коли виявленим режимом автентифікації є Anthropic OAuth/токен, зокрема повторне використання Claude CLI). Задайте `agents.defaults.heartbeat.every` або `agents.list[].heartbeat.every` для окремого агента; використовуйте `0m`, щоб вимкнути.
- Тіло запиту (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Запит Heartbeat надсилається **дослівно** як повідомлення користувача. Системний запит містить розділ "Heartbeat" лише тоді, коли Heartbeat увімкнено для типового агента, а запуск позначено внутрішньо.
- Коли Heartbeat вимкнено через `0m`, звичайні запуски також не включають `HEARTBEAT.md` у початковий контекст, щоб модель не бачила інструкцій, призначених лише для Heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза вікном Heartbeat пропускається до наступного тику всередині вікна.
- Heartbeat автоматично відкладається, поки робота cron активна або в черзі. Задайте `heartbeat.skipWhenBusy: true`, щоб відкладати також через додатково зайняті напрями (субагент або вкладена командна робота); це корисно для локального Ollama та інших обмежених хостів з одним середовищем виконання.

## Для чого призначений запит Heartbeat

Типовий запит навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" спонукає агента переглядати подальші дії (вхідні, календар, нагадування, роботу в черзі) і виявляти все термінове.
- **Перевірка стану людини**: "Checkup sometimes on your human during day time" спонукає час від часу надсилати легке повідомлення "щось потрібно?", але уникає нічного спаму завдяки використанню налаштованого місцевого часового поясу (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск Heartbeat не створює запис завдання.

Якщо ви хочете, щоб Heartbeat робив щось дуже конкретне (наприклад, "check Gmail PubSub stats" або "verify gateway health"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) як власне тіло (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Запуски Heartbeat з доступом до інструментів можуть натомість викликати `heartbeat_respond` з `notify: false` для оновлення без видимого повідомлення або `notify: true` разом із `notificationText` для сповіщення. Якщо структурована відповідь інструмента присутня, вона має пріоритет над текстовим резервним варіантом.
- Під час запусків Heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, коли воно з’являється на **початку або в кінці** відповіді. Токен видаляється, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (типово: 300).
- Якщо `HEARTBEAT_OK` з’являється **всередині** відповіді, воно не обробляється особливим чином.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; поверніть лише текст сповіщення.

Поза Heartbeat випадкове `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється та журналюється; повідомлення, що містить лише `HEARTBEAT_OK`, відкидається.

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
- `agents.list[].heartbeat` накладається зверху; якщо будь-який агент має блок `heartbeat`, Heartbeat запускають **лише ці агенти**.
- `channels.defaults.heartbeat` задає типові параметри видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає типові параметри каналу.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома обліковими записами) перевизначає налаштування для окремого каналу.

### Heartbeat для окремих агентів

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, Heartbeat запускають **лише ці агенти**. Блок для окремого агента накладається поверх `agents.defaults.heartbeat` (тож ви можете один раз задати спільні типові значення й перевизначати їх для кожного агента).

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

Поза цим вікном (до 9:00 або після 22:00 за східним часом) Heartbeat пропускається. Наступний запланований тик усередині вікна виконається звичайно.

### Налаштування 24/7

Якщо ви хочете, щоб Heartbeat працював увесь день, використайте один із цих шаблонів:

- Повністю пропустіть `activeHours` (без обмеження часовим вікном; це типова поведінка).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це трактується як вікно нульової ширини, тому Heartbeat завжди пропускається.
</Warning>

### Приклад кількох облікових записів

Використовуйте `accountId`, щоб націлитися на конкретний обліковий запис у каналах з кількома обліковими записами, як-от Telegram:

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
  Якщо true, запуски Heartbeat використовують полегшений початковий контекст і зберігають лише `HEARTBEAT.md` з початкових файлів робочого простору.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Якщо true, кожен Heartbeat запускається в новій сесії без попередньої історії розмов. Використовує той самий шаблон ізоляції, що й cron `sessionTarget: "isolated"`. Значно зменшує вартість токенів для кожного Heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основної сесії.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Якщо true, запуски Heartbeat відкладаються через додатково зайняті напрями: роботу субагента або вкладених команд. Напрями Cron завжди відкладають Heartbeat, навіть без цього прапорця, тож хости локальних моделей не запускають запити cron і Heartbeat одночасно.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сесії для запусків Heartbeat.

- `main` (типово): основна сесія агента.
- Явний ключ сесії (скопіюйте з `openclaw sessions --json` або [CLI сесій](/uk/cli/sessions)).
- Формати ключів сесій: див. [Сесії](/uk/concepts/session) і [Групи](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставити до останнього використаного зовнішнього каналу.
- явний канал: будь-який налаштований канал або ідентифікатор plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (типово): запустити Heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою доставки напряму/DM. `allow`: дозволити доставку Heartbeat напряму/DM. `block`: придушити доставку напряму/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необов’язкове перевизначення одержувача (специфічний для каналу ідентифікатор, наприклад E.164 для WhatsApp або ідентифікатор чату Telegram). Для тем/потоків Telegram використовуйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необов’язковий ідентифікатор облікового запису для каналів з кількома обліковими записами. Коли `target: "last"`, ідентифікатор облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше ігнорується. Якщо ідентифікатор облікового запису не відповідає налаштованому обліковому запису для визначеного каналу, доставка пропускається.

</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає типове тіло запиту (не об’єднується).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальна кількість символів, дозволена після `HEARTBEAT_OK` перед доставкою.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Якщо `true`, пригнічує payload-и попереджень про помилки інструментів під час запусків heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Обмежує запуски heartbeat часовим вікном. Обʼєкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, не включно; `24:00` дозволено для кінця дня) і необовʼязковим `timezone`.

- Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо задано, інакше повертається до часового поясу системи хоста.
- `"local"`: завжди використовує часовий пояс системи хоста.
- Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо він недійсний, повертається до поведінки `"user"` вище.
- `start` і `end` не мають бути однаковими для активного вікна; однакові значення трактуються як нульова ширина (завжди поза вікном).
- Поза активним вікном heartbeat-и пропускаються до наступного тіку всередині вікна.

</ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Маршрутизація сесії та цілі">
    - Heartbeat-и за замовчуванням виконуються в основній сесії агента (`agent:<id>:<mainKey>`) або в `global`, коли `session.scope = "global"`. Задайте `session`, щоб перевизначити це на конкретну сесію каналу (Discord/WhatsApp тощо).
    - `session` впливає лише на контекст запуску; доставкою керують `target` і `to`.
    - Щоб доставити в конкретний канал/одержувачу, задайте `target` + `to`. Із `target: "last"` доставка використовує останній зовнішній канал для цієї сесії.
    - Доставки heartbeat за замовчуванням дозволяють прямі/DM-цілі. Задайте `directPolicy: "block"`, щоб пригнічувати надсилання до прямих цілей, водночас усе ще виконуючи хід heartbeat.
    - Якщо основна черга, lane цільової сесії, lane cron або активне cron-завдання зайняті, heartbeat пропускається і повторюється пізніше.
    - Якщо `skipWhenBusy: true`, subagent-и та вкладені lane-и також відкладають запуски heartbeat.
    - Якщо `target` не resolve-иться до зовнішнього призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається наперед як `reason=alerts-disabled`.
    - Якщо вимкнена лише доставка попереджень, OpenClaw усе ще може виконати heartbeat, оновити часові мітки належних завдань, відновити часову мітку простою сесії та пригнітити зовнішній payload попередження.
    - Якщо resolved-ціль heartbeat підтримує індикатор набору тексту, OpenClaw показує набір тексту, доки запуск heartbeat активний. Це використовує ту саму ціль, куди heartbeat надсилав би chat-вивід, і вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сесії та аудит">
    - Відповіді лише від heartbeat **не** підтримують сесію живою. Метадані heartbeat можуть оновити рядок сесії, але закінчення терміну через простій використовує `lastInteractionAt` з останнього реального повідомлення користувача/каналу, а денне закінчення терміну використовує `sessionStartedAt`.
    - Історія Control UI та WebChat приховує prompts heartbeat і OK-only підтвердження. Базовий transcript сесії все ще може містити ці ходи для аудиту/відтворення.
    - Відʼєднані [background tasks](/uk/automation/tasks) можуть поставити системну подію в чергу та розбудити heartbeat, коли основна сесія має швидко щось помітити. Таке пробудження не перетворює запуск heartbeat на background task.

  </Accordion>
</AccordionGroup>

## Керування видимістю

За замовчуванням підтвердження `HEARTBEAT_OK` пригнічуються, тоді як вміст попереджень доставляється. Це можна налаштувати для кожного каналу або кожного акаунта:

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

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає OK-only відповідь.
- `showAlerts`: надсилає вміст попередження, коли модель повертає не-OK відповідь.
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

| Мета                                     | Конфігурація                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Типова поведінка (тихі OK, попередження ввімкнено) | _(конфігурація не потрібна)_                                                             |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необовʼязково)

Якщо файл `HEARTBEAT.md` існує в workspace, типовий prompt каже агенту прочитати його. Сприймайте його як свій «контрольний список heartbeat»: малий, стабільний і безпечний для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` інʼєктується лише тоді, коли guidance heartbeat увімкнено для типового агента. Вимкнення cadence heartbeat за допомогою `0m` або встановлення `includeSystemPromptSection: false` прибирає його зі звичайного bootstrap-контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити API-виклики. Такий пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, heartbeat все одно запускається, і модель вирішує, що робити.

Тримайте його крихітним (короткий контрольний список або нагадування), щоб уникнути роздуття prompt.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує невеликий структурований блок `tasks:` для interval-based перевірок усередині самого heartbeat.

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
    - OpenClaw парсить блок `tasks:` і перевіряє кожне завдання за його власним `interval`.
    - У prompt heartbeat для цього тіку включаються лише **належні до виконання** завдання.
    - Якщо немає завдань, час яких настав, heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
    - Non-task вміст у `HEARTBEAT.md` зберігається та додається як додатковий контекст після списку належних до виконання завдань.
    - Часові мітки останнього запуску завдань зберігаються в стані сесії (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
    - Часові мітки завдань просуваються лише після того, як запуск heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як виконані.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли ви хочете, щоб один файл heartbeat містив кілька періодичних перевірок без оплати за всі з них на кожному тіку.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви попросите його про це.

`HEARTBEAT.md` — це просто звичайний файл у workspace агента, тож ви можете сказати агенту (у звичайному chat) щось на кшталт:

- «Онови `HEARTBEAT.md`, щоб додати щоденну перевірку календаря.»
- «Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на follow-up щодо inbox.»

Якщо ви хочете, щоб це відбувалося проактивно, ви також можете включити явний рядок у свій prompt heartbeat, наприклад: «Якщо контрольний список застаріє, онови HEARTBEAT.md кращим варіантом.»

<Warning>
Не кладіть секрети (API-ключі, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною prompt-контексту.
</Warning>

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу та запустити негайний heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо для кількох агентів налаштовано `heartbeat`, ручне пробудження негайно запускає кожен із цих agent heartbeat-ів.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тіку.

## Доставка міркувань (необовʼязково)

За замовчуванням heartbeat-и доставляють лише фінальний payload «answer».

Якщо вам потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли це ввімкнено, heartbeat-и також доставлятимуть окреме повідомлення з префіксом `Reasoning:` (така сама форма, як `/reasoning on`). Це може бути корисно, коли агент керує кількома сесіями/codexes і ви хочете бачити, чому він вирішив ping-нути вас — але це також може розкрити більше внутрішніх деталей, ніж вам потрібно. У group chats краще залишати це вимкненим.

## Усвідомлення вартості

Heartbeat-и виконують повні ходи агента. Коротші інтервали спалюють більше токенів. Щоб зменшити вартість:

- Використовуйте `isolatedSession: true`, щоб уникнути надсилання повної історії розмови (~100K токенів до ~2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Задайте дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` малим.
- Використовуйте `target: "none"`, якщо вам потрібні лише внутрішні оновлення стану.

## Переповнення контексту після heartbeat

Якщо heartbeat раніше залишив наявну сесію на меншій локальній моделі, наприклад моделі Ollama з вікном 32k, а наступний хід основної сесії повідомляє про переповнення контексту, скиньте runtime model сесії назад до налаштованої primary model. Повідомлення скидання OpenClaw вказує на це, коли остання runtime model збігається з налаштованою `heartbeat.model`.

Поточні heartbeat-и зберігають наявну runtime model спільної сесії після завершення запуску. Ви все ще можете використовувати `isolatedSession: true`, щоб запускати heartbeat-и у свіжій сесії, поєднувати це з `lightContext: true` для найменшого prompt або вибрати модель heartbeat із контекстним вікном, достатньо великим для спільної сесії.

## Повʼязане

- [Automation & Tasks](/uk/automation) — усі механізми автоматизації з першого погляду
- [Background Tasks](/uk/automation/tasks) — як відстежується відʼєднана робота
- [Timezone](/uk/concepts/timezone) — як часовий пояс впливає на планування heartbeat
- [Troubleshooting](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
