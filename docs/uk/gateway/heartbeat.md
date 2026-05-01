---
read_when:
    - Налаштування частоти Heartbeat або повідомлень
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-05-01T18:34:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat чи Cron?** Див. [Автоматизація й завдання](/uk/automation) щодо рекомендацій, коли використовувати кожен із них.
</Note>

Heartbeat запускає **періодичні ходи агента** в основній сесії, щоб модель могла показувати все, що потребує уваги, не засипаючи вас повідомленнями.

Heartbeat — це запланований хід в основній сесії; він **не** створює записи [фонових завдань](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані завдання Cron).

Усунення несправностей: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть частоту">
    Залиште Heartbeat увімкненими (за замовчуванням `30m`, або `1h` для автентифікації Anthropic OAuth/токеном, зокрема повторного використання Claude CLI) або задайте власну частоту.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть короткий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочому просторі агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення Heartbeat">
    `target: "none"` — значення за замовчуванням; задайте `target: "last"`, щоб спрямовувати повідомлення останньому контакту.
  </Step>
  <Step title="Необов’язкове налаштування">
    - Увімкніть доставку міркувань Heartbeat для прозорості.
    - Використовуйте легкий початковий контекст, якщо запуску Heartbeat потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сесії, щоб не надсилати всю історію розмови під час кожного Heartbeat.
    - Обмежте Heartbeat активними годинами (локальний час).

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

- Інтервал: `30m` (або `1h`, коли виявленим режимом автентифікації є Anthropic OAuth/токен, зокрема повторне використання Claude CLI). Задайте `agents.defaults.heartbeat.every` або для окремого агента `agents.list[].heartbeat.every`; використовуйте `0m`, щоб вимкнути.
- Тіло запиту (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Запит Heartbeat надсилається **дослівно** як повідомлення користувача. Системний запит містить розділ "Heartbeat" лише тоді, коли Heartbeat увімкнено для агента за замовчуванням, а запуск позначається внутрішньо.
- Коли Heartbeat вимкнено через `0m`, звичайні запуски також не включають `HEARTBEAT.md` до початкового контексту, щоб модель не бачила інструкції, призначені лише для Heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза цим вікном Heartbeat пропускаються до наступного тика всередині вікна.
- Heartbeat автоматично відкладаються, доки робота Cron активна або в черзі. Задайте `heartbeat.skipWhenBusy: true`, щоб відкладати також у додатково зайнятих доріжках (робота субагента або вкладених команд); це корисно для локальної Ollama та інших обмежених хостів з одним середовищем виконання.

## Для чого призначений запит Heartbeat

Стандартний запит навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" спонукає агента переглянути подальші дії (вхідні, календар, нагадування, роботу в черзі) і показати все термінове.
- **Перевірка стану людини**: "Checkup sometimes on your human during day time" спонукає час від часу надсилати легке повідомлення "щось потрібно?", але уникає нічного спаму, використовуючи налаштований локальний часовий пояс (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск Heartbeat не створює запис завдання.

Якщо ви хочете, щоб Heartbeat робив щось дуже конкретне (наприклад, "check Gmail PubSub stats" або "verify gateway health"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) як власне тіло (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Запуски Heartbeat з доступом до інструментів можуть натомість викликати `heartbeat_respond` з `notify: false` без видимого оновлення або `notify: true` плюс `notificationText` для сповіщення. За наявності структурована відповідь інструмента має пріоритет над текстовим резервним варіантом.
- Під час запусків Heartbeat OpenClaw обробляє `HEARTBEAT_OK` як підтвердження, коли він з’являється на **початку або в кінці** відповіді. Токен видаляється, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (за замовчуванням: 300).
- Якщо `HEARTBEAT_OK` з’являється **посередині** відповіді, він не обробляється особливо.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза Heartbeat випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється і записується в журнал; повідомлення, що складається лише з `HEARTBEAT_OK`, відкидається.

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
- `channels.defaults.heartbeat` задає стандартні параметри видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає стандартні параметри каналу.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома обліковими записами) перевизначає налаштування окремого каналу.

### Heartbeat для окремих агентів

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, Heartbeat запускають **лише ці агенти**. Блок окремого агента накладається поверх `agents.defaults.heartbeat` (тож ви можете один раз задати спільні стандартні параметри й перевизначити їх для окремого агента).

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

Поза цим вікном (до 9:00 або після 22:00 за східним часом) Heartbeat пропускаються. Наступний запланований тик усередині вікна виконається звичайно.

### Налаштування 24/7

Якщо ви хочете, щоб Heartbeat працювали весь день, використайте один із цих шаблонів:

- Повністю пропустіть `activeHours` (без обмеження часовим вікном; це стандартна поведінка).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це обробляється як вікно нульової ширини, тому Heartbeat завжди пропускаються.
</Warning>

### Приклад кількох облікових записів

Використовуйте `accountId`, щоб спрямувати на конкретний обліковий запис у каналах із кількома обліковими записами, як-от Telegram:

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
  Інтервал Heartbeat (рядок тривалості; стандартна одиниця = хвилини).
</ParamField>
<ParamField path="model" type="string">
  Необов’язкове перевизначення моделі для запусків Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Якщо ввімкнено, також доставляє окреме повідомлення `Reasoning:`, коли воно доступне (така сама форма, як `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Якщо `true`, запуски Heartbeat використовують легкий початковий контекст і зберігають лише `HEARTBEAT.md` із початкових файлів робочого простору.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Якщо `true`, кожен Heartbeat запускається у свіжій сесії без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й Cron `sessionTarget: "isolated"`. Значно зменшує витрати токенів на кожен Heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основної сесії.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Якщо `true`, запуски Heartbeat відкладаються на додатково зайнятих доріжках: робота субагента або вкладених команд. Доріжки Cron завжди відкладають Heartbeat, навіть без цього прапорця, тож хости з локальними моделями не запускають запити Cron і Heartbeat одночасно.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сесії для запусків Heartbeat.

- `main` (за замовчуванням): основна сесія агента.
- Явний ключ сесії (скопіюйте з `openclaw sessions --json` або [CLI сесій](/uk/cli/sessions)).
- Формати ключів сесій: див. [Сесії](/uk/concepts/session) і [Групи](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставляти до останнього використаного зовнішнього каналу.
- явний канал: будь-який налаштований канал або id Plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (за замовчуванням): запускати Heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою доставки напряму/DM. `allow`: дозволити доставку Heartbeat напряму/DM. `block`: придушити доставку напряму/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необов’язкове перевизначення отримувача (ідентифікатор, специфічний для каналу, наприклад E.164 для WhatsApp або id чату Telegram). Для тем/гілок Telegram використовуйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необов’язковий id облікового запису для каналів із кількома обліковими записами. Коли `target: "last"`, id облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше ігнорується. Якщо id облікового запису не відповідає налаштованому обліковому запису для визначеного каналу, доставка пропускається.

</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає стандартне тіло запиту (не об’єднується).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальна кількість символів, дозволена після `HEARTBEAT_OK` перед доставкою.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Якщо true, пригнічує payload-и попереджень про помилки інструментів під час запусків Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Обмежує запуски Heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, не включно; `24:00` дозволено для кінця дня) та необов’язковим `timezone`.

- Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо задано, інакше повертається до часового поясу системи хоста.
- `"local"`: завжди використовує часовий пояс системи хоста.
- Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо недійсний, повертається до поведінки `"user"` вище.
- `start` і `end` не мають бути однаковими для активного вікна; однакові значення вважаються нульовою шириною (завжди поза вікном).
- Поза активним вікном Heartbeat пропускаються до наступного тику всередині вікна.

</ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Маршрутизація сеансу й цілі">
    - Heartbeat типово запускаються в основному сеансі агента (`agent:<id>:<mainKey>`) або `global`, коли `session.scope = "global"`. Задайте `session`, щоб перевизначити на конкретний сеанс каналу (Discord/WhatsApp/тощо).
    - `session` впливає лише на контекст запуску; доставкою керують `target` і `to`.
    - Щоб доставити до конкретного каналу/одержувача, задайте `target` + `to`. З `target: "last"` доставка використовує останній зовнішній канал для цього сеансу.
    - Доставки Heartbeat типово дозволяють прямі/DM-цілі. Задайте `directPolicy: "block"`, щоб пригнічувати надсилання до прямих цілей, але все одно виконувати хід Heartbeat.
    - Якщо основна черга, lane цільового сеансу, lane cron або активне cron-завдання зайняті, Heartbeat пропускається й повторюється пізніше.
    - Якщо `skipWhenBusy: true`, підлеглі агенти та вкладені lane також відкладають запуски Heartbeat.
    - Якщо `target` не визначається в жодне зовнішнє призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається заздалегідь як `reason=alerts-disabled`.
    - Якщо вимкнена лише доставка сповіщень, OpenClaw усе ще може запустити Heartbeat, оновити мітки часу належних завдань, відновити мітку часу простою сеансу та пригнітити зовнішній payload сповіщення.
    - Якщо визначена ціль Heartbeat підтримує індикацію набору, OpenClaw показує набір, доки запуск Heartbeat активний. Це використовує ту саму ціль, куди Heartbeat надсилав би чат-вивід, і вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сеансу й аудит">
    - Відповіді лише від Heartbeat **не** підтримують сеанс активним. Метадані Heartbeat можуть оновлювати рядок сеансу, але завершення через простій використовує `lastInteractionAt` з останнього справжнього повідомлення користувача/каналу, а щоденне завершення використовує `sessionStartedAt`.
    - Історія Control UI та WebChat приховує промпти Heartbeat і підтвердження лише OK. Базова стенограма сеансу все ще може містити ці ходи для аудиту/відтворення.
    - Від’єднані [фонові завдання](/uk/automation/tasks) можуть поставити системну подію в чергу та розбудити Heartbeat, коли основний сеанс має швидко щось помітити. Це пробудження не перетворює запуск Heartbeat на фонове завдання.

  </Accordion>
</AccordionGroup>

## Керування видимістю

Типово підтвердження `HEARTBEAT_OK` пригнічуються, тоді як вміст сповіщень доставляється. Ви можете налаштувати це для кожного каналу або облікового запису:

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
- `useIndicator`: емітує події індикатора для поверхонь статусу UI.

Якщо **всі три** мають значення false, OpenClaw повністю пропускає запуск Heartbeat (без виклику моделі).

### Приклади для каналу та для облікового запису

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

| Мета                                      | Конфігурація                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Типова поведінка (тихі OK, сповіщення увімкнені) | _(конфігурація не потрібна)_                                                             |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необов’язково)

Якщо в робочому просторі існує файл `HEARTBEAT.md`, типовий промпт наказує агенту прочитати його. Думайте про нього як про ваш "контрольний список Heartbeat": невеликий, стабільний і безпечний для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` вставляється лише тоді, коли настанови Heartbeat увімкнені для типового агента. Вимкнення ритму Heartbeat через `0m` або встановлення `includeSystemPromptSection: false` пропускає його зі звичайного bootstrap-контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб заощадити виклики API. Такий пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, Heartbeat усе одно запускається, а модель вирішує, що робити.

Тримайте його крихітним (короткий контрольний список або нагадування), щоб уникнути роздування промпта.

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
    - OpenClaw розбирає блок `tasks:` і перевіряє кожне завдання за його власним `interval`.
    - До промпта Heartbeat для цього тику включаються лише **належні** завдання.
    - Якщо належних завдань немає, Heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
    - Вміст у `HEARTBEAT.md`, що не є завданнями, зберігається й додається як додатковий контекст після списку належних завдань.
    - Мітки часу останнього запуску завдань зберігаються в стані сеансу (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
    - Мітки часу завдань просуваються лише після того, як запуск Heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як виконані.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли ви хочете, щоб один файл Heartbeat містив кілька періодичних перевірок без оплати за всі з них на кожному тику.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви попросите його про це.

`HEARTBEAT.md` — це просто звичайний файл у робочому просторі агента, тож ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Онови `HEARTBEAT.md`, щоб додати щоденну перевірку календаря."
- "Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на подальших діях щодо вхідних."

Якщо ви хочете, щоб це відбувалося проактивно, ви також можете включити явний рядок у свій промпт Heartbeat, наприклад: "Якщо контрольний список застаріє, онови HEARTBEAT.md кращим."

<Warning>
Не кладіть секрети (API-ключі, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною контексту промпта.
</Warning>

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу та запустити негайний Heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо `heartbeat` налаштовано для кількох агентів, ручне пробудження негайно запускає кожен із цих Heartbeat агентів.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тику.

## Доставка reasoning (необов’язково)

Типово Heartbeat доставляють лише фінальний payload "відповіді".

Якщо вам потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли ввімкнено, Heartbeat також доставлятимуть окреме повідомлення з префіксом `Reasoning:` (така сама форма, як `/reasoning on`). Це може бути корисно, коли агент керує кількома сеансами/кодексами й ви хочете бачити, чому він вирішив пінгувати вас, але це також може розкрити більше внутрішніх деталей, ніж вам потрібно. Краще залишати це вимкненим у групових чатах.

## Усвідомлення вартості

Heartbeat виконують повні ходи агента. Коротші інтервали спалюють більше токенів. Щоб зменшити вартість:

- Використовуйте `isolatedSession: true`, щоб уникнути надсилання повної історії розмови (від ~100K токенів до ~2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Задайте дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` малим.
- Використовуйте `target: "none"`, якщо вам потрібні лише внутрішні оновлення стану.

## Переповнення контексту після Heartbeat

Якщо Heartbeat використовує меншу локальну модель, наприклад модель Ollama з вікном 32k, а наступний хід основного сеансу повідомляє про переповнення контексту, перевірте, чи попередній Heartbeat залишив сеанс на моделі Heartbeat. Повідомлення скидання OpenClaw вказує на це, коли остання runtime-модель збігається з налаштованою `heartbeat.model`.

Використовуйте `isolatedSession: true`, щоб запускати Heartbeat у свіжому сеансі, поєднуйте це з `lightContext: true` для найменшого промпта або виберіть модель Heartbeat із контекстним вікном, достатньо великим для спільного сеансу.

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — усі механізми автоматизації одним поглядом
- [Фонові завдання](/uk/automation/tasks) — як відстежується від’єднана робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на планування Heartbeat
- [Усунення несправностей](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
