---
read_when:
    - Налаштування частоти Heartbeat або повідомлень
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-04-29T09:12:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat чи cron?** Див. [Автоматизація й завдання](/uk/automation), щоб зрозуміти, коли що використовувати.
</Note>

Heartbeat запускає **періодичні ходи агента** в головному сеансі, щоб модель могла повідомляти про все, що потребує уваги, не засмічуючи вас повідомленнями.

Heartbeat — це запланований хід у головному сеансі; він **не** створює записи [фонових завдань](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані cron-завдання).

Усунення проблем: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть інтервал">
    Залиште Heartbeat увімкненим (типово `30m`, або `1h` для автентифікації Anthropic OAuth/токеном, включно з повторним використанням Claude CLI) або задайте власний інтервал.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть короткий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочому просторі агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення Heartbeat">
    `target: "none"` — типове значення; задайте `target: "last"`, щоб спрямовувати їх останньому контакту.
  </Step>
  <Step title="Необов’язкове налаштування">
    - Увімкніть доставку міркувань Heartbeat для прозорості.
    - Використовуйте полегшений початковий контекст, якщо запускам Heartbeat потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сеанси, щоб не надсилати повну історію розмови для кожного Heartbeat.
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

## Типові значення

- Інтервал: `30m` (або `1h`, коли виявлений режим автентифікації Anthropic OAuth/токеном, включно з повторним використанням Claude CLI). Задайте `agents.defaults.heartbeat.every` або `agents.list[].heartbeat.every`; використовуйте `0m`, щоб вимкнути.
- Тіло промпта (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Промпт Heartbeat надсилається **дослівно** як повідомлення користувача. Системний промпт містить розділ "Heartbeat" лише тоді, коли Heartbeat увімкнено для типового агента, а запуск позначається внутрішньо.
- Коли Heartbeat вимкнено через `0m`, звичайні запуски також не включають `HEARTBEAT.md` до початкового контексту, щоб модель не бачила інструкцій лише для Heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза цим вікном Heartbeat пропускаються до наступного такту всередині вікна.
- Heartbeat автоматично відкладається, поки cron-робота активна або стоїть у черзі. Задайте `heartbeat.skipWhenBusy: true`, щоб також відкладати під час додатково зайнятих ліній (субагента або вкладеної командної роботи); це корисно для локальних Ollama та інших обмежених хостів з одним середовищем виконання.

## Для чого призначений промпт Heartbeat

Типовий промпт навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" підштовхує агента переглянути подальші дії (вхідні, календар, нагадування, роботу в черзі) і повідомити про все термінове.
- **Перевірка людини**: "Checkup sometimes on your human during day time" підштовхує до періодичного легкого повідомлення "чи щось потрібно?", але уникає нічного спаму завдяки використанню налаштованого місцевого часового поясу (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск Heartbeat не створює запис завдання.

Якщо ви хочете, щоб Heartbeat виконував щось дуже конкретне (наприклад, "перевірити статистику Gmail PubSub" або "перевірити справність Gateway"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) із власним тілом (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Під час запусків Heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, коли він з’являється на **початку або в кінці** відповіді. Токен видаляється, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (типово: 300).
- Якщо `HEARTBEAT_OK` з’являється **посередині** відповіді, він не обробляється особливо.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; поверніть лише текст сповіщення.

Поза Heartbeat випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється й логується; повідомлення, що містить лише `HEARTBEAT_OK`, відкидається.

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

### Обсяг і пріоритет

- `agents.defaults.heartbeat` задає глобальну поведінку Heartbeat.
- `agents.list[].heartbeat` накладається зверху; якщо будь-який агент має блок `heartbeat`, Heartbeat запускають **лише ці агенти**.
- `channels.defaults.heartbeat` задає типові параметри видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає типові параметри каналу.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома акаунтами) перевизначає налаштування для окремого каналу.

### Heartbeat для окремих агентів

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, Heartbeat запускають **лише ці агенти**. Блок окремого агента накладається поверх `agents.defaults.heartbeat` (тож ви можете один раз задати спільні типові значення й перевизначати їх для кожного агента).

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

Поза цим вікном (до 9:00 або після 22:00 за східним часом) Heartbeat пропускаються. Наступний запланований такт усередині вікна виконається звичайно.

### Налаштування 24/7

Якщо ви хочете, щоб Heartbeat працював увесь день, використайте один із цих шаблонів:

- Повністю пропустіть `activeHours` (без обмеження часовим вікном; це типова поведінка).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це трактується як вікно нульової ширини, тому Heartbeat завжди пропускається.
</Warning>

### Приклад кількох акаунтів

Використовуйте `accountId`, щоб спрямувати на конкретний акаунт у каналах із кількома акаунтами, як-от Telegram:

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
  Коли ввімкнено, також доставляє окреме повідомлення `Reasoning:`, якщо воно доступне (та сама форма, що й `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Коли true, запуски Heartbeat використовують полегшений початковий контекст і залишають лише `HEARTBEAT.md` із початкових файлів робочого простору.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Коли true, кожен Heartbeat запускається в новому сеансі без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й cron `sessionTarget: "isolated"`. Різко зменшує витрати токенів на кожен Heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст головного сеансу.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Коли true, запуски Heartbeat відкладаються на додатково зайнятих лініях: робота субагента або вкладених команд. Cron-лінії завжди відкладають Heartbeat, навіть без цього прапорця, тому хости локальних моделей не запускають cron і промпти Heartbeat одночасно.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сеансу для запусків Heartbeat.

- `main` (типово): головний сеанс агента.
- Явний ключ сеансу (скопіюйте з `openclaw sessions --json` або з [CLI сеансів](/uk/cli/sessions)).
- Формати ключів сеансів: див. [Сеанси](/uk/concepts/session) і [Групи](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставити в останній використаний зовнішній канал.
- явний канал: будь-який налаштований канал або id plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (типово): запустити Heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою доставки напряму/DM. `allow`: дозволити доставку Heartbeat напряму/DM. `block`: придушити доставку напряму/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необов’язкове перевизначення отримувача (id, специфічний для каналу, наприклад E.164 для WhatsApp або id чату Telegram). Для тем/гілок Telegram використовуйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необов’язковий id акаунта для каналів із кількома акаунтами. Коли `target: "last"`, id акаунта застосовується до визначеного останнього каналу, якщо він підтримує акаунти; інакше ігнорується. Якщо id акаунта не відповідає налаштованому акаунту для визначеного каналу, доставка пропускається.

</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає типове тіло промпта (без злиття).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальна кількість символів після `HEARTBEAT_OK` перед доставкою.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Якщо true, приглушує payload-попередження про помилки інструментів під час запусків Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Обмежує запуски Heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM виключно; `24:00` дозволено для кінця дня) та необов’язковим `timezone`.

- Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо задано, інакше повертається до часового поясу системи хоста.
- `"local"`: завжди використовує часовий пояс системи хоста.
- Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо недійсний, повертається до поведінки `"user"` вище.
- `start` і `end` не мають бути однаковими для активного вікна; однакові значення вважаються нульовою шириною (завжди поза вікном).
- Поза активним вікном Heartbeat пропускаються до наступного тіку всередині вікна.

</ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Сеанс і маршрутизація цілі">
    - Heartbeat за замовчуванням працюють в основному сеансі агента (`agent:<id>:<mainKey>`) або `global`, коли `session.scope = "global"`. Задайте `session`, щоб перевизначити на конкретний сеанс каналу (Discord/WhatsApp/тощо).
    - `session` впливає лише на контекст запуску; доставка керується `target` і `to`.
    - Щоб доставити до конкретного каналу/отримувача, задайте `target` + `to`. З `target: "last"` доставка використовує останній зовнішній канал для цього сеансу.
    - Доставки Heartbeat за замовчуванням дозволяють прямі/DM-цілі. Задайте `directPolicy: "block"`, щоб приглушити надсилання до прямих цілей, водночас усе ще виконуючи крок Heartbeat.
    - Якщо основна черга, lane цільового сеансу, lane cron або активне cron-завдання зайняті, Heartbeat пропускається й повторюється пізніше.
    - Якщо `skipWhenBusy: true`, субагентські та вкладені lanes також відкладають запуски Heartbeat.
    - Якщо `target` не визначається до зовнішнього призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається наперед як `reason=alerts-disabled`.
    - Якщо вимкнена лише доставка сповіщень, OpenClaw усе ще може виконати Heartbeat, оновити позначки часу належних завдань, відновити позначку часу простою сеансу та приглушити зовнішній payload сповіщення.
    - Якщо визначена ціль Heartbeat підтримує індикацію набору, OpenClaw показує набір, поки запуск Heartbeat активний. Це використовує ту саму ціль, куди Heartbeat надсилав би вихід чату, і вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сеансу й аудит">
    - Відповіді лише Heartbeat **не** підтримують сеанс активним. Метадані Heartbeat можуть оновлювати рядок сеансу, але закінчення простою використовує `lastInteractionAt` з останнього справжнього повідомлення користувача/каналу, а щоденне закінчення використовує `sessionStartedAt`.
    - Історія Control UI та WebChat приховує підказки Heartbeat і підтвердження лише OK. Базовий транскрипт сеансу все ще може містити ці кроки для аудиту/повторного відтворення.
    - Відокремлені [фонові завдання](/uk/automation/tasks) можуть поставити системну подію в чергу й розбудити Heartbeat, коли основний сеанс має швидко щось помітити. Це пробудження не робить запуск Heartbeat фоновим завданням.

  </Accordion>
</AccordionGroup>

## Елементи керування видимістю

За замовчуванням підтвердження `HEARTBEAT_OK` приглушуються, тоді як вміст сповіщень доставляється. Це можна налаштувати для каналу або облікового запису:

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

Пріоритет: для облікового запису → для каналу → типові значення каналу → вбудовані типові значення.

### Що робить кожен прапорець

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь лише OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає відповідь не OK.
- `useIndicator`: випромінює події індикатора для поверхонь стану UI.

Якщо **всі три** false, OpenClaw повністю пропускає запуск Heartbeat (без виклику моделі).

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

### Типові шаблони

| Мета                                     | Конфігурація                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Типова поведінка (тихі OK, сповіщення ввімкнені) | _(конфігурація не потрібна)_                                                             |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необов’язково)

Якщо файл `HEARTBEAT.md` існує в робочому просторі, типова підказка просить агента прочитати його. Вважайте його своїм "контрольним списком Heartbeat": невеликим, стабільним і безпечним для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` вставляється лише тоді, коли настанови Heartbeat увімкнені для типового агента. Вимкнення cadence Heartbeat через `0m` або встановлення `includeSystemPromptSection: false` вилучає його зі звичайного початкового контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки й markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб заощадити API-виклики. Цей пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, Heartbeat усе одно запускається, а модель вирішує, що робити.

Тримайте його дуже малим (короткий контрольний список або нагадування), щоб уникнути роздування підказки.

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
    - OpenClaw розбирає блок `tasks:` і перевіряє кожне завдання відносно його власного `interval`.
    - До підказки Heartbeat для цього тіку включаються лише завдання, строк яких **настав**.
    - Якщо немає завдань, строк яких настав, Heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
    - Вміст у `HEARTBEAT.md`, що не належить до завдань, зберігається й додається як додатковий контекст після списку завдань, строк яких настав.
    - Позначки часу останнього запуску завдань зберігаються в стані сеансу (`heartbeatTaskState`), тож інтервали переживають звичайні перезапуски.
    - Позначки часу завдань просуваються лише після того, як запуск Heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як завершені.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли потрібно, щоб один файл Heartbeat містив кілька періодичних перевірок без оплати за всі з них на кожному тіку.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви його про це попросите.

`HEARTBEAT.md` — це просто звичайний файл у робочому просторі агента, тож ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Онови `HEARTBEAT.md`, щоб додати щоденну перевірку календаря."
- "Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на подальших діях щодо вхідних."

Якщо ви хочете, щоб це відбувалося проактивно, можна також включити явний рядок у підказку Heartbeat, наприклад: "Якщо контрольний список застаріє, онови HEARTBEAT.md кращим варіантом."

<Warning>
Не кладіть секрети (API-ключі, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною контексту підказки.
</Warning>

## Ручне пробудження (на вимогу)

Можна поставити системну подію в чергу й запустити негайний Heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо в кількох агентів налаштовано `heartbeat`, ручне пробудження негайно запускає кожен із цих агентських Heartbeat.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тіку.

## Доставка reasoning (необов’язково)

За замовчуванням Heartbeat доставляють лише фінальний payload "відповіді".

Якщо потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли це ввімкнено, Heartbeat також доставлятимуть окреме повідомлення з префіксом `Reasoning:` (та сама форма, що й `/reasoning on`). Це може бути корисно, коли агент керує кількома сеансами/кодексами й ви хочете бачити, чому він вирішив вам написати, але це також може розкрити більше внутрішніх деталей, ніж вам потрібно. У групових чатах краще залишати вимкненим.

## Усвідомлення вартості

Heartbeat запускають повні кроки агента. Коротші інтервали витрачають більше токенів. Щоб зменшити вартість:

- Використовуйте `isolatedSession: true`, щоб уникнути надсилання повної історії розмови (~100K токенів до ~2-5K на запуск).
- Використовуйте `lightContext: true`, щоб обмежити початкові файли лише `HEARTBEAT.md`.
- Задайте дешевший `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` малим.
- Використовуйте `target: "none"`, якщо потрібні лише внутрішні оновлення стану.

## Переповнення контексту після Heartbeat

Якщо Heartbeat використовує меншу локальну модель, наприклад модель Ollama з вікном 32k, а наступний крок основного сеансу повідомляє про переповнення контексту, перевірте, чи попередній Heartbeat не залишив сеанс на моделі Heartbeat. Повідомлення скидання OpenClaw вказує на це, коли остання runtime-модель збігається з налаштованою `heartbeat.model`.

Використовуйте `isolatedSession: true`, щоб запускати Heartbeat у свіжому сеансі, поєднайте це з `lightContext: true` для найменшої підказки або виберіть модель Heartbeat із вікном контексту, достатньо великим для спільного сеансу.

## Пов’язано

- [Автоматизація й завдання](/uk/automation) — усі механізми автоматизації в одному огляді
- [Фонові завдання](/uk/automation/tasks) — як відстежується відокремлена робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на планування Heartbeat
- [Усунення несправностей](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
