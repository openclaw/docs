---
read_when:
    - Налаштування частоти або повідомлень Heartbeat
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:33:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat чи cron?** Див. [Автоматизацію](/uk/automation), щоб зрозуміти, коли використовувати кожен із них.
</Note>

Heartbeat запускає **періодичні ходи агента** в основному сеансі, щоб модель могла виводити на поверхню все, що потребує уваги, не засипаючи вас повідомленнями.

Heartbeat — це запланований хід основного сеансу; він **не** створює записи [фонового завдання](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані cron-завдання).

Усунення несправностей: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть інтервал">
    Залиште heartbeats увімкненими (типово `30m`, або `1h` для автентифікації Anthropic OAuth/токеном, включно з повторним використанням Claude CLI) або задайте власний інтервал.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть короткий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочій області агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення heartbeat">
    `target: "none"` — типове значення; установіть `target: "last"`, щоб спрямовувати їх останньому контакту.
  </Step>
  <Step title="Необов’язкове налаштування">
    - Увімкніть доставку міркувань heartbeat для прозорості.
    - Використовуйте легкий контекст початкового завантаження, якщо для запусків heartbeat потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сеанси, щоб не надсилати всю історію розмови під час кожного heartbeat.
    - Обмежте heartbeats активними годинами (місцевий час).

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
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Типові значення

- Інтервал: `30m` (або `1h`, коли виявлений режим автентифікації — Anthropic OAuth/токен, включно з повторним використанням Claude CLI). Задайте `agents.defaults.heartbeat.every` або `agents.list[].heartbeat.every` для окремого агента; використовуйте `0m`, щоб вимкнути.
- Тіло запиту (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Тайм-аут: heartbeat-ходи без заданого значення використовують `agents.defaults.timeoutSeconds`, якщо його встановлено. Інакше вони використовують інтервал heartbeat з обмеженням до 600 секунд. Задайте `agents.defaults.heartbeat.timeoutSeconds` або `agents.list[].heartbeat.timeoutSeconds` для окремого агента, якщо потрібна довша робота heartbeat.
- Запит heartbeat надсилається **дослівно** як повідомлення користувача. Системний запит містить розділ "Heartbeat" лише коли heartbeats увімкнені для типового агента, а запуск позначається внутрішньо.
- Коли heartbeats вимкнено через `0m`, звичайні запуски також не включають `HEARTBEAT.md` у контекст початкового завантаження, щоб модель не бачила інструкції лише для heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза вікном heartbeats пропускаються до наступного такту всередині вікна.
- Heartbeats автоматично відкладаються, доки cron-робота активна або перебуває в черзі. Установіть `heartbeat.skipWhenBusy: true`, щоб також відкладати агента на його власних прив’язаних до ключа сеансу субагентських або вкладених командних смугах; суміжні агенти більше не призупиняються лише тому, що інший агент має субагентську роботу в процесі.

## Для чого призначений запит heartbeat

Типовий запит навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" підштовхує агента переглядати подальші дії (вхідні, календар, нагадування, роботу в черзі) і виводити на поверхню все термінове.
- **Перевірка людини**: "Checkup sometimes on your human during day time" підштовхує інколи надсилати легке повідомлення "щось потрібно?", але уникає нічного спаму завдяки вашому налаштованому місцевому часовому поясу (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск heartbeat не створює запис завдання.

Якщо ви хочете, щоб heartbeat виконував щось дуже конкретне (наприклад, "check Gmail PubSub stats" або "verify gateway health"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) як власне тіло (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Heartbeat-запуски з доступом до інструментів можуть натомість викликати `heartbeat_respond` з `notify: false` для невидимого оновлення або `notify: true` плюс `notificationText` для сповіщення. Якщо структурована відповідь інструмента присутня, вона має пріоритет над текстовим запасним варіантом.
- Під час heartbeat-запусків OpenClaw трактує `HEARTBEAT_OK` як підтвердження, коли він з’являється на **початку або в кінці** відповіді. Токен вилучається, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (типово: 300).
- Якщо `HEARTBEAT_OK` з’являється **посередині** відповіді, він не обробляється особливо.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза heartbeats випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення вилучається й журналюється; повідомлення, що складається лише з `HEARTBEAT_OK`, відкидається.

## Конфігурація

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
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

- `agents.defaults.heartbeat` задає глобальну поведінку heartbeat.
- `agents.list[].heartbeat` накладається зверху; якщо будь-який агент має блок `heartbeat`, heartbeats запускають **лише ці агенти**.
- `channels.defaults.heartbeat` задає типові параметри видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає типові параметри каналу.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома обліковими записами) перевизначає параметри для каналу.

### Heartbeats для окремого агента

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, heartbeats запускають **лише ці агенти**. Блок окремого агента накладається поверх `agents.defaults.heartbeat` (тобто можна один раз задати спільні типові значення й перевизначати їх для агента).

Приклад: два агенти, heartbeats запускає лише другий агент.

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

Обмежте heartbeats робочими годинами в певному часовому поясі:

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

Поза цим вікном (до 9:00 або після 22:00 за східним часом) heartbeats пропускаються. Наступний запланований такт усередині вікна виконається звичайно.

### Налаштування 24/7

Якщо ви хочете, щоб heartbeats запускалися весь день, використайте один із цих шаблонів:

- Повністю опустіть `activeHours` (без обмеження часовим вікном; це типова поведінка).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не встановлюйте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це трактується як вікно нульової ширини, тому heartbeats завжди пропускаються.
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
  Інтервал heartbeat (рядок тривалості; типова одиниця = хвилини).
</ParamField>
<ParamField path="model" type="string">
  Необов’язкове перевизначення моделі для heartbeat-запусків (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Коли ввімкнено, також доставляє окреме повідомлення `Thinking`, якщо воно доступне (та сама форма, що й `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Коли `true`, heartbeat-запуски використовують легкий контекст початкового завантаження й залишають лише `HEARTBEAT.md` із файлів початкового завантаження робочої області.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Коли `true`, кожен heartbeat запускається у свіжому сеансі без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й cron `sessionTarget: "isolated"`. Різко зменшує вартість токенів на кожен heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основного сеансу.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Коли `true`, heartbeat-запуски відкладаються на додаткових зайнятих смугах цього агента: його власній прив’язаній до ключа сеансу субагентській або вкладеній командній роботі. Cron-смуги завжди відкладають heartbeats, навіть без цього прапорця, щоб хости локальних моделей не запускали cron і heartbeat-запити одночасно.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сеансу для heartbeat-запусків.

- `main` (типово): основний сеанс агента.
- Явний ключ сеансу (скопіюйте з `openclaw sessions --json` або [sessions CLI](/uk/cli/sessions)).
- Формати ключів сеансу: див. [Сеанси](/uk/concepts/session) і [Групи](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставити до останнього використаного зовнішнього каналу.
- явний канал: будь-який налаштований канал або id Plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (типово): запустити heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою доставки напряму/DM. `allow`: дозволити доставку heartbeat напряму/DM. `block`: придушити доставку напряму/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необов’язкове перевизначення отримувача (специфічний для каналу id, наприклад E.164 для WhatsApp або id чату Telegram). Для тем/тредів Telegram використовуйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необов’язковий ідентифікатор облікового запису для каналів із кількома обліковими записами. Коли `target: "last"`, ідентифікатор облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше його ігнорують. Якщо ідентифікатор облікового запису не відповідає налаштованому обліковому запису для визначеного каналу, доставку пропускають.

</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає стандартне тіло запиту (без об’єднання).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальна кількість символів, дозволена після `HEARTBEAT_OK` перед доставкою.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Коли має значення true, пригнічує payload попереджень про помилки інструментів під час запусків Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Максимальна кількість секунд, дозволена для ходу агента Heartbeat до його переривання. Не задавайте, щоб використовувати `agents.defaults.timeoutSeconds`, якщо встановлено, інакше використовується cadence Heartbeat з обмеженням у 600 секунд.

</ParamField>
<ParamField path="activeHours" type="object">
  Обмежує запуски Heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, не включно; `24:00` дозволено для кінця дня) та необов’язковим `timezone`.

- Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо встановлено, інакше повертається до часового поясу системи хоста.
- `"local"`: завжди використовує часовий пояс системи хоста.
- Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо недійсний, повертається до поведінки `"user"` вище.
- `start` і `end` не мають бути однаковими для активного вікна; однакові значення вважаються нульовою шириною (завжди поза вікном).
- Поза активним вікном Heartbeat пропускаються до наступного тіку всередині вікна.

</ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Сеанс і маршрутизація цілі">
    - Heartbeat за замовчуванням запускаються в основному сеансі агента (`agent:<id>:<mainKey>`) або в `global`, коли `session.scope = "global"`. Установіть `session`, щоб перевизначити на сеанс певного каналу (Discord/WhatsApp/тощо).
    - `session` впливає лише на контекст запуску; доставкою керують `target` і `to`.
    - Щоб доставити до певного каналу/одержувача, установіть `target` + `to`. З `target: "last"` доставка використовує останній зовнішній канал для цього сеансу.
    - Доставки Heartbeat за замовчуванням дозволяють прямі/DM-цілі. Установіть `directPolicy: "block"`, щоб пригнічувати надсилання до прямих цілей, водночас продовжуючи виконувати хід Heartbeat.
    - Якщо основна черга, lane цільового сеансу, lane cron або активне завдання cron зайняті, Heartbeat пропускається й повторюється пізніше.
    - Якщо `skipWhenBusy: true`, підлеглий агент цього агента з ключем сеансу та вкладені lanes також відкладають запуски Heartbeat. Зайняті lanes інших агентів не відкладають цього агента.
    - Якщо `target` не визначає жодного зовнішнього призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається наперед із `reason=alerts-disabled`.
    - Якщо вимкнено лише доставку сповіщень, OpenClaw все ще може запустити Heartbeat, оновити часові мітки належних завдань, відновити часову мітку простою сеансу та приглушити зовнішній payload сповіщення.
    - Якщо визначена ціль Heartbeat підтримує індикатор набору тексту, OpenClaw показує набір тексту, поки запуск Heartbeat активний. Це використовує ту саму ціль, куди Heartbeat надіслав би чат-вивід, і вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сеансу й аудит">
    - Відповіді лише від Heartbeat **не** підтримують сеанс активним. Метадані Heartbeat можуть оновлювати рядок сеансу, але завершення через бездіяльність використовує `lastInteractionAt` з останнього реального повідомлення користувача/каналу, а щоденне завершення використовує `sessionStartedAt`.
    - Історія Control UI та WebChat приховує запити Heartbeat і підтвердження лише OK. Базова розшифровка сеансу все ще може містити ці ходи для аудиту/повторного відтворення.
    - Відокремлені [фонові завдання](/uk/automation/tasks) можуть поставити системну подію в чергу й розбудити Heartbeat, коли основний сеанс має швидко щось помітити. Це пробудження не робить запуск Heartbeat фоновим завданням.

  </Accordion>
</AccordionGroup>

## Елементи керування видимістю

За замовчуванням підтвердження `HEARTBEAT_OK` пригнічуються, а вміст сповіщень доставляється. Ви можете налаштувати це для кожного каналу або облікового запису:

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

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь лише OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає відповідь не OK.
- `useIndicator`: емiтує події індикатора для поверхонь статусу UI.

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

| Мета                                     | Конфігурація                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Стандартна поведінка (тихі OK, сповіщення ввімкнено) | _(конфігурація не потрібна)_                                                            |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необов’язково)

Якщо файл `HEARTBEAT.md` існує в робочій області, стандартний запит каже агенту прочитати його. Сприймайте його як свій «контрольний список Heartbeat»: малий, стабільний і безпечний для перегляду кожні 30 хвилин.

У звичайних запусках `HEARTBEAT.md` додається лише тоді, коли настанови Heartbeat увімкнено для стандартного агента. Вимкнення cadence Heartbeat через `0m` або встановлення `includeSystemPromptSection: false` вилучає його зі звичайного bootstrap-контексту.

У нативному harness Codex вміст `HEARTBEAT.md` не додається до ходу. Якщо файл існує й має вміст, відмінний від пробільних символів, інструкції режиму співпраці Heartbeat спрямовують Codex до файла й кажуть прочитати його перед продовженням.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки, коментарі Markdown/HTML, заголовки Markdown на кшталт `# Heading`, маркери fence або порожні заготовки контрольного списку), OpenClaw пропускає запуск Heartbeat, щоб заощадити API-виклики. Про такий пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, Heartbeat все одно запускається, а модель вирішує, що робити.

Тримайте його крихітним (короткий контрольний список або нагадування), щоб уникнути роздуття запиту.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує невеликий структурований блок `tasks:` для інтервальних перевірок усередині самого Heartbeat.

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
    - До запиту Heartbeat для цього тіку включаються лише завдання, **строк яких настав**.
    - Якщо строк жодного завдання не настав, Heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути змарнованого виклику моделі.
    - Незавданнєвий вміст у `HEARTBEAT.md` зберігається й додається як додатковий контекст після списку завдань, строк яких настав.
    - Часові мітки останнього запуску завдань зберігаються у стані сеансу (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
    - Часові мітки завдань просуваються лише після того, як запуск Heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як завершені.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли ви хочете, щоб один файл Heartbeat містив кілька періодичних перевірок без оплати за всі на кожному тіку.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви попросите його про це.

`HEARTBEAT.md` — це просто звичайний файл у робочій області агента, тож ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

Якщо ви хочете, щоб це відбувалося проактивно, ви також можете додати явний рядок до свого запиту Heartbeat, наприклад: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
Не кладіть секрети (API-ключі, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною контексту запиту.
</Warning>

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу й негайно запустити Heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо `heartbeat` налаштовано для кількох агентів, ручне пробудження негайно запускає Heartbeat кожного з цих агентів.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тіку.

## Доставка reasoning (необов’язково)

За замовчуванням Heartbeat доставляє лише фінальний payload «answer».

Якщо вам потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли ввімкнено, Heartbeat також доставлятиме окреме повідомлення з префіксом `Thinking` (та сама форма, що й `/reasoning on`). Це може бути корисно, коли агент керує кількома сеансами/codexes і ви хочете бачити, чому він вирішив написати вам, але це також може розкрити більше внутрішніх деталей, ніж ви хочете. Краще тримати це вимкненим у групових чатах.

## Обізнаність про вартість

Heartbeat запускає повні ходи агента. Коротші інтервали спалюють більше токенів. Щоб зменшити вартість:

- Використовуйте `isolatedSession: true`, щоб не надсилати повну історію розмови (від ~100K токенів до ~2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Установіть дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` малим.
- Використовуйте `target: "none"`, якщо вам потрібні лише оновлення внутрішнього стану.

## Переповнення контексту після Heartbeat

Якщо Heartbeat раніше залишив наявний сеанс на меншій локальній моделі, наприклад моделі Ollama з вікном 32k, а наступний хід основного сеансу повідомляє про переповнення контексту, скиньте runtime-модель сеансу назад до налаштованої основної моделі. Повідомлення скидання OpenClaw вказує на це, коли остання runtime-модель збігається з налаштованою `heartbeat.model`.

Поточні Heartbeat зберігають наявну runtime-модель спільного сеансу після завершення запуску. Ви все ще можете використовувати `isolatedSession: true`, щоб запускати Heartbeat у свіжому сеансі, поєднати це з `lightContext: true` для найменшого запиту або вибрати модель Heartbeat із достатньо великим контекстним вікном для спільного сеансу.

## Пов’язане

- [Автоматизація](/uk/automation) — усі механізми автоматизації з першого погляду
- [Фонові завдання](/uk/automation/tasks) — як відстежується відокремлена робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на планування Heartbeat
- [Усунення несправностей](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
