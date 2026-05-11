---
read_when:
    - Налаштування частоти Heartbeat або обміну повідомленнями
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat та правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-05-11T20:37:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat чи cron?** Див. [Автоматизація та завдання](/uk/automation), щоб дізнатися, коли використовувати кожне з них.
</Note>

Heartbeat запускає **періодичні ходи агента** в основній сесії, щоб модель могла показувати все, що потребує уваги, не засмічуючи вас повідомленнями.

Heartbeat — це запланований хід основної сесії; він **не** створює записи [фонового завдання](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані завдання cron).

Усунення неполадок: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Виберіть періодичність">
    Залиште Heartbeat увімкненим (за замовчуванням `30m` або `1h` для автентифікації Anthropic OAuth/токеном, зокрема повторного використання Claude CLI) або задайте власну періодичність.
  </Step>
  <Step title="Додайте HEARTBEAT.md (необов’язково)">
    Створіть короткий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочій області агента.
  </Step>
  <Step title="Вирішіть, куди мають надходити повідомлення Heartbeat">
    `target: "none"` — значення за замовчуванням; задайте `target: "last"`, щоб маршрутизувати до останнього контакту.
  </Step>
  <Step title="Необов’язкове налаштування">
    - Увімкніть доставку міркувань Heartbeat для прозорості.
    - Використовуйте полегшений початковий контекст, якщо запускам Heartbeat потрібен лише `HEARTBEAT.md`.
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

- Інтервал: `30m` (або `1h`, коли виявлений режим автентифікації Anthropic OAuth/токеном, зокрема повторне використання Claude CLI). Задайте `agents.defaults.heartbeat.every` або `agents.list[].heartbeat.every`; використовуйте `0m`, щоб вимкнути.
- Тіло запиту (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Запит Heartbeat надсилається **дослівно** як повідомлення користувача. Системний запит містить розділ "Heartbeat" лише тоді, коли Heartbeat увімкнено для агента за замовчуванням, а запуск позначено внутрішньо.
- Коли Heartbeat вимкнено за допомогою `0m`, звичайні запуски також пропускають `HEARTBEAT.md` у початковому контексті, щоб модель не бачила інструкції, призначені лише для Heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза межами вікна Heartbeat пропускаються до наступного такту всередині вікна.
- Heartbeat автоматично відкладається, доки робота cron активна або стоїть у черзі. Задайте `heartbeat.skipWhenBusy: true`, щоб відкладати також за додатково зайнятих ліній (робота субагента або вкладених команд); це корисно для локального Ollama та інших обмежених хостів з одним runtime.

## Для чого призначений запит Heartbeat

Запит за замовчуванням навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" спонукає агента переглядати подальші дії (вхідні, календар, нагадування, роботу в черзі) і показувати все термінове.
- **Перевірка людини**: "Checkup sometimes on your human during day time" спонукає час від часу надсилати легке повідомлення "anything you need?", але уникає нічного спаму завдяки використанню налаштованого локального часового поясу (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск Heartbeat не створює запис завдання.

Якщо ви хочете, щоб Heartbeat виконував щось дуже конкретне (наприклад, "check Gmail PubSub stats" або "verify gateway health"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) як власне тіло (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Запуски Heartbeat із доступом до інструментів можуть натомість викликати `heartbeat_respond` з `notify: false` для відсутності видимого оновлення або `notify: true` плюс `notificationText` для сповіщення. Якщо структурована відповідь інструмента присутня, вона має пріоритет над текстовим fallback.
- Під час запусків Heartbeat OpenClaw трактує `HEARTBEAT_OK` як підтвердження, коли він з’являється на **початку або в кінці** відповіді. Токен вилучається, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (за замовчуванням: 300).
- Якщо `HEARTBEAT_OK` з’являється **в середині** відповіді, він не обробляється особливим чином.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза Heartbeat випадковий `HEARTBEAT_OK` на початку/в кінці повідомлення вилучається та записується в журнал; повідомлення, яке складається лише з `HEARTBEAT_OK`, відкидається.

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

### Обсяг і пріоритет

- `agents.defaults.heartbeat` задає глобальну поведінку Heartbeat.
- `agents.list[].heartbeat` накладається зверху; якщо будь-який агент має блок `heartbeat`, Heartbeat запускають **лише ці агенти**.
- `channels.defaults.heartbeat` задає значення видимості за замовчуванням для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає значення каналу за замовчуванням.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома акаунтами) перевизначає налаштування для окремого каналу.

### Heartbeat для окремих агентів

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, **лише ці агенти** запускають Heartbeat. Блок для окремого агента об’єднується поверх `agents.defaults.heartbeat` (тож можна один раз задати спільні стандартні значення й перевизначати їх для кожного агента).

Приклад: два агенти, лише другий агент запускає Heartbeat.

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

Поза цим вікном (до 9:00 або після 22:00 за східним часом) Heartbeat пропускається. Наступний запланований такт у межах вікна виконуватиметься звичайно.

### Налаштування 24/7

Якщо потрібно, щоб Heartbeat працював увесь день, використайте один із цих шаблонів:

- Повністю пропустіть `activeHours` (без обмеження часовим вікном; це стандартна поведінка).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це вважається вікном нульової ширини, тому Heartbeat завжди пропускається.
</Warning>

### Приклад із кількома акаунтами

Використовуйте `accountId`, щоб націлитися на певний акаунт у каналах із кількома акаунтами, як-от Telegram:

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
  Коли ввімкнено, також доставляє окреме повідомлення `Reasoning:`, якщо воно доступне (у тій самій формі, що й `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Коли значення `true`, запуски Heartbeat використовують полегшений початковий контекст і зберігають лише `HEARTBEAT.md` із початкових файлів робочого простору.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Коли значення `true`, кожен Heartbeat запускається в новій сесії без попередньої історії розмови. Використовує той самий шаблон ізоляції, що й Cron `sessionTarget: "isolated"`. Суттєво зменшує витрати токенів на кожен Heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основної сесії.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Коли значення `true`, запуски Heartbeat відкладаються на додатково зайнятих лініях: робота субагента або вкладеної команди. Лінії Cron завжди відкладають Heartbeat, навіть без цього прапорця, тому хости локальних моделей не запускають запити Cron і Heartbeat одночасно.
</ParamField>
<ParamField path="session" type="string">
  Необов’язковий ключ сесії для запусків Heartbeat.

- `main` (стандартно): основна сесія агента.
- Явний ключ сесії (скопіюйте з `openclaw sessions --json` або [CLI сесій](/uk/cli/sessions)).
- Формати ключів сесій: див. [Сесії](/uk/concepts/session) і [Групи](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставити в останній використаний зовнішній канал.
- явний канал: будь-який налаштований канал або id plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (стандартно): запустити Heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою прямої доставки/DM. `allow`: дозволити пряму доставку/DM для Heartbeat. `block`: приглушити пряму доставку/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необов’язкове перевизначення отримувача (id, специфічний для каналу, наприклад E.164 для WhatsApp або id чату Telegram). Для тем/гілок Telegram використовуйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необов’язковий id акаунта для каналів із кількома акаунтами. Коли `target: "last"`, id акаунта застосовується до визначеного останнього каналу, якщо він підтримує акаунти; інакше ігнорується. Якщо id акаунта не відповідає налаштованому акаунту для визначеного каналу, доставку пропущено.

</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає стандартний текст запиту (не об’єднується).

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
- `start` і `end` не мають бути однаковими для активного вікна; однакові значення трактуються як нульова ширина (завжди поза вікном).
- Поза активним вікном Heartbeat-и пропускаються до наступного тику всередині вікна.

</ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Маршрутизація сеансу й цілі">
    - Heartbeat-и за замовчуванням виконуються в основному сеансі агента (`agent:<id>:<mainKey>`) або в `global`, коли `session.scope = "global"`. Задайте `session`, щоб перевизначити на конкретний сеанс каналу (Discord/WhatsApp/тощо).
    - `session` впливає лише на контекст запуску; доставка керується `target` і `to`.
    - Щоб доставити в конкретний канал/одержувачу, задайте `target` + `to`. Із `target: "last"` доставка використовує останній зовнішній канал для цього сеансу.
    - Доставки Heartbeat за замовчуванням дозволяють прямі/DM-цілі. Задайте `directPolicy: "block"`, щоб пригнічувати надсилання на прямі цілі, водночас усе ще виконуючи хід Heartbeat.
    - Якщо основна черга, lane цільового сеансу, lane cron або активне cron-завдання зайняті, Heartbeat пропускається та повторюється пізніше.
    - Якщо `skipWhenBusy: true`, lane-и субагентів і вкладені lane-и також відкладають запуски Heartbeat.
    - Якщо `target` не розв’язується в зовнішнє призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається заздалегідь як `reason=alerts-disabled`.
    - Якщо вимкнено лише доставку сповіщень, OpenClaw усе ще може виконати Heartbeat, оновити часові мітки завдань із терміном, відновити часову мітку простою сеансу та пригнітити зовнішній payload сповіщення.
    - Якщо розв’язана ціль Heartbeat підтримує індикатор набору, OpenClaw показує набір, доки запуск Heartbeat активний. Це використовує ту саму ціль, куди Heartbeat надсилав би чат-вивід, і вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сеансу й аудит">
    - Відповіді лише від Heartbeat **не** підтримують сеанс активним. Метадані Heartbeat можуть оновити рядок сеансу, але завершення через простій використовує `lastInteractionAt` з останнього реального повідомлення користувача/каналу, а щоденне завершення використовує `sessionStartedAt`.
    - Історія Control UI і WebChat приховує промпти Heartbeat та підтвердження лише OK. Базовий transcript сеансу все ще може містити ці ходи для аудиту/відтворення.
    - Відокремлені [фонові завдання](/uk/automation/tasks) можуть поставити системну подію в чергу та пробудити Heartbeat, коли основний сеанс має швидко щось помітити. Це пробудження не робить запуск Heartbeat фоновим завданням.

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
- `useIndicator`: емітує події індикатора для поверхонь статусу UI.

Якщо **усі три** мають значення false, OpenClaw повністю пропускає запуск Heartbeat (без виклику моделі).

### Приклади для каналу й акаунта

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
| Типова поведінка (тихі OK, сповіщення увімкнено) | _(конфігурація не потрібна)_                                                            |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необов’язково)

Якщо файл `HEARTBEAT.md` існує в робочій області, типовий промпт каже агенту прочитати його. Сприймайте його як свій "контрольний список Heartbeat": малий, стабільний і безпечний для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` ін’єктується лише тоді, коли для типового агента увімкнено настанови Heartbeat. Вимкнення cadence Heartbeat через `0m` або встановлення `includeSystemPromptSection: false` пропускає його зі звичайного bootstrap-контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб заощадити API-виклики. Про такий пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, Heartbeat усе одно запускається, а модель вирішує, що робити.

Тримайте його крихітним (короткий контрольний список або нагадування), щоб уникати роздування промпта.

Приклад `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Блоки `tasks:`

`HEARTBEAT.md` також підтримує малий структурований блок `tasks:` для перевірок на основі інтервалів усередині самого Heartbeat.

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
    - До промпта Heartbeat для цього тику включаються лише завдання, **термін яких настав**.
    - Якщо немає завдань із настанням терміну, Heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
    - Вміст не із завдань у `HEARTBEAT.md` зберігається та додається як додатковий контекст після списку завдань із настанням терміну.
    - Часові мітки останнього запуску завдань зберігаються в стані сеансу (`heartbeatTaskState`), тому інтервали переживають звичайні перезапуски.
    - Часові мітки завдань просуваються лише після того, як запуск Heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як завершені.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли потрібно, щоб один файл Heartbeat містив кілька періодичних перевірок без оплати за всі з них на кожному тику.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви його про це попросите.

`HEARTBEAT.md` — це просто звичайний файл у робочій області агента, тож ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Онови `HEARTBEAT.md`, щоб додати щоденну перевірку календаря."
- "Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на подальших діях щодо inbox."

Якщо ви хочете, щоб це відбувалося проактивно, також можна включити явний рядок у свій промпт Heartbeat, наприклад: "Якщо контрольний список застаріває, онови HEARTBEAT.md кращим варіантом."

<Warning>
Не додавайте секрети (API-ключі, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною контексту промпта.
</Warning>

## Ручне пробудження (за запитом)

Ви можете поставити системну подію в чергу та запустити негайний Heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо кілька агентів мають налаштований `heartbeat`, ручне пробудження негайно запускає кожен із цих Heartbeat агентів.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тику.

## Доставка reasoning (необов’язково)

За замовчуванням Heartbeat-и доставляють лише фінальний payload "відповіді".

Якщо вам потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли увімкнено, Heartbeat-и також доставлятимуть окреме повідомлення з префіксом `Reasoning:` (та сама форма, що й `/reasoning on`). Це може бути корисно, коли агент керує кількома сеансами/codex-ами й ви хочете бачити, чому він вирішив вас ping-нути, але це також може розкривати більше внутрішніх деталей, ніж вам потрібно. Краще тримати це вимкненим у групових чатах.

## Обізнаність про вартість

Heartbeat-и виконують повні ходи агента. Коротші інтервали витрачають більше токенів. Щоб зменшити вартість:

- Використовуйте `isolatedSession: true`, щоб уникнути надсилання повної історії розмови (~100K токенів до ~2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Задайте дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` малим.
- Використовуйте `target: "none"`, якщо потрібні лише оновлення внутрішнього стану.

## Переповнення контексту після Heartbeat

Якщо Heartbeat раніше залишив наявний сеанс на меншій локальній моделі, наприклад моделі Ollama з вікном 32k, а наступний хід основного сеансу повідомляє про переповнення контексту, скиньте runtime-модель сеансу назад до налаштованої основної моделі. Повідомлення скидання OpenClaw вказує на це, коли остання runtime-модель збігається з налаштованою `heartbeat.model`.

Поточні Heartbeat-и зберігають наявну runtime-модель спільного сеансу після завершення запуску. Ви все ще можете використовувати `isolatedSession: true`, щоб запускати Heartbeat-и у свіжому сеансі, поєднати це з `lightContext: true` для найменшого промпта або вибрати модель Heartbeat із вікном контексту, достатньо великим для спільного сеансу.

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — усі механізми автоматизації стисло
- [Фонові завдання](/uk/automation/tasks) — як відстежується відокремлена робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на планування Heartbeat
- [Усунення неполадок](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
