---
read_when:
    - Налаштування частоти або повідомлень Heartbeat
    - Вибір між Heartbeat і Cron для запланованих завдань
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T05:55:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat чи Cron?** Див. [Automation & Tasks](/uk/automation), щоб зрозуміти, коли слід використовувати кожен із них.

Heartbeat запускає **періодичні цикли агента** в main session, щоб модель могла
повідомляти про все, що потребує уваги, не засипаючи вас повідомленнями.

Heartbeat — це запланований цикл main-session — він **не** створює записів [фонових завдань](/uk/automation/tasks).
Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані завдання cron).

Усунення несправностей: [Scheduled Tasks](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

1. Залиште heartbeat увімкненим (типове значення — `30m`, або `1h` для автентифікації Anthropic OAuth/token, включно з повторним використанням Claude CLI) або задайте власну частоту.
2. Створіть невеликий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочому просторі агента (необов’язково, але рекомендовано).
3. Визначте, куди мають надходити повідомлення heartbeat (`target: "none"` — типове значення; установіть `target: "last"`, щоб маршрутизувати до останнього контакту).
4. Необов’язково: увімкніть доставку reasoning heartbeat для прозорості.
5. Необов’язково: використовуйте полегшений bootstrap-контекст, якщо запускам heartbeat потрібен лише `HEARTBEAT.md`.
6. Необов’язково: увімкніть ізольовані сесії, щоб не надсилати повну історію розмови під час кожного heartbeat.
7. Необов’язково: обмежте heartbeat активними годинами (за місцевим часом).

Приклад конфігурації:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка до останнього контакту (типово "none")
        directPolicy: "allow", // типово: allow для прямих/DM цілей; установіть "block", щоб придушити
        lightContext: true, // необов’язково: ін’єктувати з bootstrap-файлів лише HEARTBEAT.md
        isolatedSession: true, // необов’язково: нова сесія для кожного запуску (без історії розмови)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // необов’язково: також надсилати окреме повідомлення `Reasoning:`
      },
    },
  },
}
```

## Типові значення

- Інтервал: `30m` (або `1h`, коли виявленим режимом автентифікації є Anthropic OAuth/token, включно з повторним використанням Claude CLI). Установіть `agents.defaults.heartbeat.every` або для конкретного агента `agents.list[].heartbeat.every`; використайте `0m`, щоб вимкнути.
- Тіло prompt (налаштовується через `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Prompt heartbeat надсилається **дослівно** як повідомлення користувача. System
  prompt містить розділ “Heartbeat” лише тоді, коли heartbeat увімкнено для
  типового агента, а запуск внутрішньо позначено відповідним прапорцем.
- Коли heartbeat вимкнено через `0m`, звичайні запуски також не включають `HEARTBEAT.md`
  до bootstrap-контексту, щоб модель не бачила інструкцій, призначених лише для heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі.
  Поза вікном heartbeat пропускаються до наступного тіку всередині вікна.

## Для чого потрібен prompt heartbeat

Типовий prompt навмисно зроблено широким:

- **Фонові завдання**: “Consider outstanding tasks” спонукає агента переглядати
  незавершені справи (вхідні, календар, нагадування, роботу в черзі) і повідомляти про все термінове.
- **Перевірка з людиною**: “Checkup sometimes on your human during day time” спонукає до
  випадкового ненав’язливого повідомлення на кшталт “чи щось тобі потрібно?”, але уникає нічного спаму
  завдяки використанню вашого налаштованого локального часового поясу (див. [/concepts/timezone](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск heartbeat не створює запису завдання.

Якщо ви хочете, щоб heartbeat робив щось дуже конкретне (наприклад, “перевіряти статистику Gmail PubSub”
або “перевіряти стан gateway”), задайте `agents.defaults.heartbeat.prompt` (або
`agents.list[].heartbeat.prompt`) як власне тіло, яке надсилається дослівно.

## Контракт відповіді

- Якщо нічого не потребує уваги, дайте відповідь **`HEARTBEAT_OK`**.
- Під час запусків heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, якщо воно з’являється
  **на початку або в кінці** відповіді. Токен видаляється, а відповідь
  відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (типово: 300).
- Якщо `HEARTBEAT_OK` з’являється **посередині** відповіді, воно не має
  спеціального значення.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза heartbeat сторонній `HEARTBEAT_OK` на початку/в кінці повідомлення видаляється
і логуються; повідомлення, яке складається лише з `HEARTBEAT_OK`, відкидається.

## Конфігурація

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // типово: 30m (0m вимикає)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // типово: false (доставляти окреме повідомлення Reasoning:, коли доступне)
        lightContext: false, // типово: false; true залишає з bootstrap-файлів робочого простору лише HEARTBEAT.md
        isolatedSession: false, // типово: false; true запускає кожен heartbeat у новій сесії (без історії розмови)
        target: "last", // типово: none | варіанти: last | none | <channel id> (core або plugin, наприклад "bluebubbles")
        to: "+15551234567", // необов’язкове перевизначення для конкретного каналу
        accountId: "ops-bot", // необов’язковий id каналу для multi-account
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // макс. кількість символів, дозволена після HEARTBEAT_OK
      },
    },
  },
}
```

### Область дії та пріоритет

- `agents.defaults.heartbeat` задає глобальну поведінку heartbeat.
- `agents.list[].heartbeat` об’єднується поверх; якщо будь-який агент має блок `heartbeat`, **heartbeat запускаються лише для цих агентів**.
- `channels.defaults.heartbeat` задає типові параметри видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає типові параметри каналів.
- `channels.<channel>.accounts.<id>.heartbeat` (канали multi-account) перевизначає налаштування для конкретного каналу.

### Heartbeat для конкретного агента

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, **heartbeat запускаються лише для цих агентів**.
Блок для конкретного агента об’єднується поверх `agents.defaults.heartbeat`
(тобто можна один раз задати спільні типові значення й перевизначати їх для окремих агентів).

Приклад: два агенти, heartbeat запускається лише для другого.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка до останнього контакту (типово "none")
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

Обмежте heartbeat робочими годинами в конкретному часовому поясі:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // явна доставка до останнього контакту (типово "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // необов’язково; використовує ваш userTimezone, якщо задано, інакше часовий пояс хоста
        },
      },
    },
  },
}
```

Поза цим вікном (до 9:00 або після 22:00 за східним часом) heartbeat пропускаються. Наступний запланований тік усередині вікна виконається нормально.

### Налаштування 24/7

Якщо ви хочете, щоб heartbeat запускався весь день, використовуйте один із цих варіантів:

- Узагалі не вказуйте `activeHours` (без обмеження часовим вікном; це типова поведінка).
- Установіть повноденне вікно: `activeHours: { start: "00:00", end: "24:00" }`.

Не встановлюйте однакові значення `start` і `end` (наприклад, з `08:00` до `08:00`).
Це обробляється як вікно нульової ширини, тому heartbeat завжди пропускається.

### Приклад multi account

Використовуйте `accountId`, щоб націлити heartbeat на конкретний обліковий запис у каналах multi-account, як-от Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // необов’язково: маршрут до конкретної теми/потоку
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

### Примітки щодо полів

- `every`: інтервал heartbeat (рядок тривалості; типова одиниця = хвилини).
- `model`: необов’язкове перевизначення model для запусків heartbeat (`provider/model`).
- `includeReasoning`: коли увімкнено, також доставляє окреме повідомлення `Reasoning:`, коли воно доступне (такий самий формат, як `/reasoning on`).
- `lightContext`: якщо `true`, запуски heartbeat використовують полегшений bootstrap-контекст і з bootstrap-файлів робочого простору залишають лише `HEARTBEAT.md`.
- `isolatedSession`: якщо `true`, кожен heartbeat запускається в новій сесії без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й cron `sessionTarget: "isolated"`. Значно зменшує витрати токенів на кожен heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки при цьому все одно використовує контекст main session.
- `session`: необов’язковий ключ сесії для запусків heartbeat.
  - `main` (типово): main session агента.
  - Явний ключ сесії (скопіюйте з `openclaw sessions --json` або з [CLI sessions](/uk/cli/sessions)).
  - Формати ключів сесії: див. [Sessions](/uk/concepts/session) і [Groups](/uk/channels/groups).
- `target`:
  - `last`: доставити до останнього використаного зовнішнього каналу.
  - явний канал: будь-який налаштований канал або id Plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
  - `none` (типово): запускати heartbeat, але **не доставляти** назовні.
- `directPolicy`: керує поведінкою доставки в direct/DM:
  - `allow` (типово): дозволити доставку heartbeat у direct/DM.
  - `block`: придушити доставку в direct/DM (`reason=dm-blocked`).
- `to`: необов’язкове перевизначення одержувача (id, специфічний для каналу, наприклад E.164 для WhatsApp або id чату Telegram). Для тем/потоків Telegram використовуйте `<chatId>:topic:<messageThreadId>`.
- `accountId`: необов’язковий id облікового запису для каналів multi-account. Коли `target: "last"`, id облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше ігнорується. Якщо id облікового запису не відповідає налаштованому обліковому запису для визначеного каналу, доставка пропускається.
- `prompt`: перевизначає типове тіло prompt (не об’єднується).
- `ackMaxChars`: максимальна кількість символів, дозволена після `HEARTBEAT_OK` до доставки.
- `suppressToolErrorWarnings`: якщо `true`, придушує payload-и попереджень про помилки tools під час запусків heartbeat.
- `activeHours`: обмежує запуски heartbeat часовим вікном. Об’єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, виключно; `24:00` дозволено для кінця дня) та необов’язковим `timezone`.
  - Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо задано, інакше повертається до часового поясу системи хоста.
  - `"local"`: завжди використовує часовий пояс системи хоста.
  - Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо він некоректний, використовується поведінка `"user"`, описана вище.
  - `start` і `end` не мають бути рівними для активного вікна; рівні значення обробляються як нульова ширина (завжди поза вікном).
  - Поза активним вікном heartbeat пропускаються до наступного тіку всередині вікна.

## Поведінка доставки

- Heartbeat за замовчуванням запускаються в main session агента (`agent:<id>:<mainKey>`),
  або в `global`, коли `session.scope = "global"`. Установіть `session`, щоб перевизначити це на
  конкретну сесію каналу (Discord/WhatsApp тощо).
- `session` впливає лише на контекст запуску; доставкою керують `target` і `to`.
- Щоб доставляти в конкретний канал/конкретному одержувачу, установіть `target` + `to`. Якщо
  `target: "last"`, доставка використовує останній зовнішній канал для цієї сесії.
- Доставка heartbeat за замовчуванням дозволяє direct/DM-цілі. Установіть `directPolicy: "block"`, щоб придушити надсилання на direct-цілі, водночас залишивши сам цикл heartbeat.
- Якщо основна черга зайнята, heartbeat пропускається і повторюється пізніше.
- Якщо `target` не дає жодного зовнішнього призначення, запуск усе одно відбувається, але
  вихідне повідомлення не надсилається.
- Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск одразу пропускається з `reason=alerts-disabled`.
- Якщо вимкнено лише доставку сповіщень, OpenClaw усе одно може виконати heartbeat, оновити часові мітки завдань, термін виконання яких настав, відновити часову мітку бездіяльності сесії та придушити зовнішній payload сповіщення.
- Якщо визначена heartbeat-ціль підтримує typing, OpenClaw показує typing, доки
  виконується heartbeat. Для цього використовується та сама ціль, до якої heartbeat
  надсилав би вивід чату, і це вимикається через `typingMode: "never"`.
- Відповіді лише для heartbeat **не** підтримують активність сесії; останній `updatedAt`
  відновлюється, тому завершення за неактивністю працює звичайним чином.
- Історія Control UI і WebChat приховує prompt-и heartbeat та підтвердження,
  що містять лише OK. Базовий transcript сесії все одно може містити ці
  цикли для аудиту/повторного відтворення.
- Відокремлені [фонові завдання](/uk/automation/tasks) можуть ставити системну подію в чергу й пробуджувати heartbeat, коли main session має швидко щось помітити. Таке пробудження не робить запуск heartbeat фоновим завданням.

## Керування видимістю

За замовчуванням підтвердження `HEARTBEAT_OK` придушуються, тоді як вміст
сповіщень доставляється. Ви можете налаштувати це для окремого каналу або облікового запису:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Приховувати HEARTBEAT_OK (типово)
      showAlerts: true # Показувати повідомлення сповіщень (типово)
      useIndicator: true # Генерувати події-індикатори (типово)
  telegram:
    heartbeat:
      showOk: true # Показувати OK-підтвердження в Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Придушити доставку сповіщень для цього облікового запису
```

Пріоритет: для облікового запису → для каналу → типові значення каналу → вбудовані типові значення.

### Що робить кожен прапорець

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь, що містить лише OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає відповідь, що не є OK.
- `useIndicator`: генерує події-індикатори для UI-поверхонь статусу.

Якщо **всі три** значення дорівнюють false, OpenClaw повністю пропускає запуск heartbeat (без виклику моделі).

### Приклади для окремого каналу та окремого облікового запису

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # усі облікові записи Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # придушити сповіщення лише для облікового запису ops
  telegram:
    heartbeat:
      showOk: true
```

### Поширені шаблони

| Мета                                     | Конфігурація                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Типова поведінка (тихі OK, сповіщення увімкнено) | _(конфігурація не потрібна)_                                                                   |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }`      |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`       |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                                |

## HEARTBEAT.md (необов’язково)

Якщо у workspace існує файл `HEARTBEAT.md`, типовий prompt вказує
агенту прочитати його. Сприймайте його як свій “контрольний список heartbeat”: невеликий, стабільний і
безпечний для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` ін’єктується лише тоді, коли
heartbeat-guidance увімкнено для типового агента. Вимкнення частоти heartbeat через `0m` або
встановлення `includeSystemPromptSection: false` прибирає його зі звичайного bootstrap-контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки
на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити API-виклики.
Таке пропускання позначається як `reason=empty-heartbeat-file`.
Якщо файл відсутній, heartbeat усе одно виконується, а модель сама вирішує, що робити.

Тримайте його невеликим (короткий контрольний список або нагадування), щоб уникнути роздування prompt.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує невеликий структурований блок `tasks:` для перевірок
на основі інтервалів усередині самого heartbeat.

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

Поведінка:

- OpenClaw парсить блок `tasks:` і перевіряє кожне завдання відносно його власного `interval`.
- До prompt heartbeat для цього тіку включаються лише **завдання, термін яких настав**.
- Якщо жодне завдання не має насталого терміну, heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
- Вміст `HEARTBEAT.md`, що не належить до завдань, зберігається й додається як додатковий контекст після списку завдань, термін яких настав.
- Часові мітки останнього запуску завдань зберігаються в стані сесії (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
- Часові мітки завдань зсуваються вперед лише після того, як запуск heartbeat проходить свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як завершені.

Режим завдань корисний, якщо ви хочете, щоб один heartbeat-файл містив кілька періодичних перевірок без оплати всіх із них на кожному тіці.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви його про це попросите.

`HEARTBEAT.md` — це просто звичайний файл у workspace агента, тож ви можете сказати
агенту (у звичайному чаті) щось на кшталт:

- “Update `HEARTBEAT.md` to add a daily calendar check.”
- “Rewrite `HEARTBEAT.md` so it’s shorter and focused on inbox follow-ups.”

Якщо ви хочете, щоб це відбувалося проактивно, можна також додати явний рядок у
свій prompt heartbeat, наприклад: “If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

Примітка щодо безпеки: не додавайте секрети (API-ключі, телефонні номери, приватні токени) до
`HEARTBEAT.md` — він стає частиною контексту prompt.

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу й негайно запустити heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо в кількох агентів налаштовано `heartbeat`, ручне пробудження негайно запустить heartbeat кожного з них.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тіку.

## Доставка reasoning (необов’язково)

За замовчуванням heartbeat доставляють лише фінальний payload “answer”.

Якщо ви хочете прозорості, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли це ввімкнено, heartbeat також доставлятимуть окреме повідомлення з префіксом
`Reasoning:` (такий самий формат, як `/reasoning on`). Це може бути корисно, коли агент
керує кількома сесіями/codex-ами і ви хочете бачити, чому він вирішив написати
вам, — але це також може розкрити більше внутрішніх деталей, ніж вам потрібно. У групових чатах краще тримати це
вимкненим.

## Урахування вартості

Heartbeat запускають повноцінні цикли агента. Коротші інтервали спалюють більше токенів. Щоб зменшити витрати:

- Використовуйте `isolatedSession: true`, щоб не надсилати повну історію розмови (~100K токенів зменшується приблизно до ~2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Установіть дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` невеликим.
- Використовуйте `target: "none"`, якщо вам потрібні лише внутрішні оновлення стану.

## Пов’язане

- [Automation & Tasks](/uk/automation) — усі механізми автоматизації з одного погляду
- [Background Tasks](/uk/automation/tasks) — як відстежується відокремлена робота
- [Timezone](/uk/concepts/timezone) — як часовий пояс впливає на планування heartbeat
- [Troubleshooting](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
