---
read_when:
    - Налаштування частоти Heartbeat або обміну повідомленнями
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Heartbeat
summary: Повідомлення опитування Heartbeat і правила сповіщень
title: Heartbeat
x-i18n:
    generated_at: "2026-04-28T11:12:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4a88385f08704b724a22f0d55719043861f94ed6890d2fbaadb3b399ee27c6d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat чи Cron?** Див. [Автоматизація й завдання](/uk/automation), щоб дізнатися, коли використовувати кожен із них.
</Note>

Heartbeat запускає **періодичні ходи агента** в основній сесії, щоб модель могла повідомляти про все, що потребує уваги, не надсилаючи вам зайвих повідомлень.

Heartbeat — це запланований хід в основній сесії; він **не** створює записи [фонових завдань](/uk/automation/tasks). Записи завдань призначені для відокремленої роботи (запуски ACP, субагенти, ізольовані завдання Cron).

Усунення несправностей: [Заплановані завдання](/uk/automation/cron-jobs#troubleshooting)

## Швидкий старт (для початківців)

<Steps>
  <Step title="Pick a cadence">
    Залиште Heartbeat увімкненим (типове значення — `30m`, або `1h` для автентифікації Anthropic через OAuth/токен, зокрема повторного використання Claude CLI) або задайте власну періодичність.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Створіть короткий контрольний список `HEARTBEAT.md` або блок `tasks:` у робочій області агента.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` — типове значення; задайте `target: "last"`, щоб спрямовувати повідомлення останньому контакту.
  </Step>
  <Step title="Optional tuning">
    - Увімкніть доставку міркувань Heartbeat для прозорості.
    - Використовуйте легкий початковий контекст, якщо для запусків Heartbeat потрібен лише `HEARTBEAT.md`.
    - Увімкніть ізольовані сесії, щоб не надсилати повну історію розмови під час кожного Heartbeat.
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
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Типові значення

- Інтервал: `30m` (або `1h`, коли виявлений режим автентифікації Anthropic через OAuth/токен, зокрема повторне використання Claude CLI). Задайте `agents.defaults.heartbeat.every` або для окремого агента `agents.list[].heartbeat.every`; використовуйте `0m`, щоб вимкнути.
- Тіло промпта (налаштовується через `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Промпт Heartbeat надсилається **дослівно** як повідомлення користувача. Системний промпт містить розділ "Heartbeat" лише тоді, коли Heartbeat увімкнено для типового агента, а запуск позначено внутрішньо.
- Коли Heartbeat вимкнено через `0m`, звичайні запуски також пропускають `HEARTBEAT.md` у початковому контексті, щоб модель не бачила інструкцій, призначених лише для Heartbeat.
- Активні години (`heartbeat.activeHours`) перевіряються в налаштованому часовому поясі. Поза цим вікном Heartbeat пропускається до наступного такту всередині вікна.

## Для чого потрібен промпт Heartbeat

Типовий промпт навмисно широкий:

- **Фонові завдання**: "Consider outstanding tasks" спонукає агента переглянути подальші дії (вхідні, календар, нагадування, роботу в черзі) і повідомити про все термінове.
- **Перевірка стану людини**: "Checkup sometimes on your human during day time" спонукає час від часу надсилати легке повідомлення "щось потрібно?", але уникає нічного спаму завдяки налаштованому локальному часовому поясу (див. [Часовий пояс](/uk/concepts/timezone)).

Heartbeat може реагувати на завершені [фонові завдання](/uk/automation/tasks), але сам запуск Heartbeat не створює запис завдання.

Якщо ви хочете, щоб Heartbeat робив щось дуже конкретне (наприклад, "перевірити статистику Gmail PubSub" або "перевірити стан gateway"), задайте `agents.defaults.heartbeat.prompt` (або `agents.list[].heartbeat.prompt`) як власне тіло (надсилається дослівно).

## Контракт відповіді

- Якщо нічого не потребує уваги, відповідайте **`HEARTBEAT_OK`**.
- Під час запусків Heartbeat OpenClaw розглядає `HEARTBEAT_OK` як підтвердження, якщо воно з'являється на **початку або в кінці** відповіді. Токен вилучається, а відповідь відкидається, якщо решта вмісту має **≤ `ackMaxChars`** (типово: 300).
- Якщо `HEARTBEAT_OK` з'являється **посередині** відповіді, воно не обробляється особливим чином.
- Для сповіщень **не** включайте `HEARTBEAT_OK`; повертайте лише текст сповіщення.

Поза Heartbeat випадкове `HEARTBEAT_OK` на початку/в кінці повідомлення вилучається й записується в журнал; повідомлення, що складається лише з `HEARTBEAT_OK`, відкидається.

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

### Обсяг і пріоритет

- `agents.defaults.heartbeat` задає глобальну поведінку Heartbeat.
- `agents.list[].heartbeat` зливається поверх; якщо будь-який агент має блок `heartbeat`, **лише ці агенти** запускають Heartbeat.
- `channels.defaults.heartbeat` задає типові параметри видимості для всіх каналів.
- `channels.<channel>.heartbeat` перевизначає типові параметри каналу.
- `channels.<channel>.accounts.<id>.heartbeat` (канали з кількома обліковими записами) перевизначає налаштування для окремого каналу.

### Heartbeat для окремих агентів

Якщо будь-який запис `agents.list[]` містить блок `heartbeat`, **лише ці агенти** запускають Heartbeat. Блок окремого агента зливається поверх `agents.defaults.heartbeat` (тож можна один раз задати спільні типові значення й перевизначати їх для кожного агента).

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

Поза цим вікном (до 9:00 або після 22:00 за східним часом) Heartbeat пропускається. Наступний запланований такт усередині вікна виконається звичайно.

### Налаштування 24/7

Якщо ви хочете, щоб Heartbeat працював увесь день, використовуйте один із цих шаблонів:

- Повністю пропустіть `activeHours` (без обмеження часовим вікном; це типова поведінка).
- Задайте вікно на весь день: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Не задавайте однаковий час `start` і `end` (наприклад, від `08:00` до `08:00`). Це трактується як вікно нульової ширини, тому Heartbeat завжди пропускається.
</Warning>

### Приклад з кількома обліковими записами

Використовуйте `accountId`, щоб націлитися на конкретний обліковий запис у каналах із кількома обліковими записами, таких як Telegram:

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

### Примітки щодо полів

<ParamField path="every" type="string">
  Інтервал Heartbeat (рядок тривалості; типова одиниця = хвилини).
</ParamField>
<ParamField path="model" type="string">
  Необов'язкове перевизначення моделі для запусків Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Коли ввімкнено, також доставляє окреме повідомлення `Reasoning:`, якщо воно доступне (така сама форма, як `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Коли значення true, запуски Heartbeat використовують легкий початковий контекст і залишають лише `HEARTBEAT.md` із початкових файлів робочої області.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Коли значення true, кожен Heartbeat запускається у свіжій сесії без попередньої історії розмов. Використовує той самий шаблон ізоляції, що й Cron `sessionTarget: "isolated"`. Значно зменшує вартість токенів на кожен Heartbeat. Поєднуйте з `lightContext: true` для максимальної економії. Маршрутизація доставки все одно використовує контекст основної сесії.
</ParamField>
<ParamField path="session" type="string">
  Необов'язковий ключ сесії для запусків Heartbeat.

- `main` (типово): основна сесія агента.
- Явний ключ сесії (скопіюйте з `openclaw sessions --json` або [CLI сесій](/uk/cli/sessions)).
- Формати ключів сесій: див. [Сесії](/uk/concepts/session) і [Групи](/uk/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: доставляти до останнього використаного зовнішнього каналу.
- явний канал: будь-який налаштований канал або id Plugin, наприклад `discord`, `matrix`, `telegram` або `whatsapp`.
- `none` (типово): запускати Heartbeat, але **не доставляти** назовні.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Керує поведінкою доставки напряму/DM. `allow`: дозволяє доставку Heartbeat напряму/DM. `block`: пригнічує доставку напряму/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Необов'язкове перевизначення одержувача (id, специфічний для каналу, наприклад E.164 для WhatsApp або id чату Telegram). Для тем/гілок Telegram використовуйте `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Необов'язковий id облікового запису для каналів із кількома обліковими записами. Коли `target: "last"`, id облікового запису застосовується до визначеного останнього каналу, якщо він підтримує облікові записи; інакше ігнорується. Якщо id облікового запису не відповідає налаштованому обліковому запису для визначеного каналу, доставка пропускається.

</ParamField>
<ParamField path="prompt" type="string">
  Перевизначає типове тіло промпта (без злиття).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Максимальна кількість символів, дозволена після `HEARTBEAT_OK` перед доставкою.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Коли значення true, пригнічує payload попереджень про помилки інструментів під час запусків Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Обмежує запуски Heartbeat часовим вікном. Об'єкт із `start` (HH:MM, включно; використовуйте `00:00` для початку дня), `end` (HH:MM, не включно; `24:00` дозволено для кінця дня) і необов'язковим `timezone`.

- Пропущено або `"user"`: використовує ваш `agents.defaults.userTimezone`, якщо задано, інакше повертається до часового поясу системи хоста.
- `"local"`: завжди використовує часовий пояс системи хоста.
- Будь-який ідентифікатор IANA (наприклад, `America/New_York`): використовується напряму; якщо він недійсний, повертається до поведінки `"user"`, описаної вище.
- `start` і `end` не мають бути однаковими для активного вікна; однакові значення вважаються нульовою шириною (завжди поза вікном).
- Поза активним вікном Heartbeat пропускаються до наступного тіку всередині вікна.

</ParamField>

## Поведінка доставки

<AccordionGroup>
  <Accordion title="Сеанс і маршрутизація цілі">
    - Heartbeat за замовчуванням запускаються в основному сеансі агента (`agent:<id>:<mainKey>`) або в `global`, коли `session.scope = "global"`. Установіть `session`, щоб перевизначити на конкретний сеанс каналу (Discord/WhatsApp тощо).
    - `session` впливає лише на контекст запуску; доставка керується `target` і `to`.
    - Щоб доставити в конкретний канал/одержувачу, задайте `target` + `to`. З `target: "last"` доставка використовує останній зовнішній канал для цього сеансу.
    - Доставки Heartbeat за замовчуванням дозволяють прямі цілі/DM. Установіть `directPolicy: "block"`, щоб пригнічувати надсилання до прямих цілей, водночас усе ще виконуючи прохід Heartbeat.
    - Якщо основна черга зайнята, Heartbeat пропускається і повторюється пізніше.
    - Якщо `target` не визначає зовнішнє призначення, запуск усе одно відбувається, але вихідне повідомлення не надсилається.

  </Accordion>
  <Accordion title="Видимість і поведінка пропуску">
    - Якщо `showOk`, `showAlerts` і `useIndicator` усі вимкнені, запуск пропускається наперед як `reason=alerts-disabled`.
    - Якщо вимкнено лише доставку сповіщень, OpenClaw усе ще може запустити Heartbeat, оновити часові мітки належних завдань, відновити часову мітку простою сеансу та пригнітити зовнішнє корисне навантаження сповіщення.
    - Якщо визначена ціль Heartbeat підтримує індикацію набору тексту, OpenClaw показує набір тексту, поки запуск Heartbeat активний. Для цього використовується та сама ціль, до якої Heartbeat надсилав би вихідний чат, і це вимикається через `typingMode: "never"`.

  </Accordion>
  <Accordion title="Життєвий цикл сеансу й аудит">
    - Відповіді лише Heartbeat **не** підтримують сеанс активним. Метадані Heartbeat можуть оновлювати рядок сеансу, але закінчення через простій використовує `lastInteractionAt` з останнього справжнього повідомлення користувача/каналу, а щоденне закінчення використовує `sessionStartedAt`.
    - Історія Control UI і WebChat приховує підказки Heartbeat та підтвердження лише OK. Базова транскрипція сеансу все ще може містити ці проходи для аудиту/відтворення.
    - Відокремлені [фонові завдання](/uk/automation/tasks) можуть поставити системну подію в чергу й розбудити Heartbeat, коли основний сеанс має швидко щось помітити. Таке пробудження не перетворює запуск Heartbeat на фонове завдання.

  </Accordion>
</AccordionGroup>

## Елементи керування видимістю

За замовчуванням підтвердження `HEARTBEAT_OK` пригнічуються, тоді як вміст сповіщень доставляється. Ви можете налаштувати це для кожного каналу або облікового запису:

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

- `showOk`: надсилає підтвердження `HEARTBEAT_OK`, коли модель повертає відповідь лише OK.
- `showAlerts`: надсилає вміст сповіщення, коли модель повертає не-OK відповідь.
- `useIndicator`: емітує події індикатора для поверхонь стану UI.

Якщо **всі три** мають значення false, OpenClaw повністю пропускає запуск Heartbeat (без виклику моделі).

### Приклади для каналу й облікового запису

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
| Типова поведінка (тихі OK, сповіщення ввімкнено) | _(конфігурація не потрібна)_                                                             |
| Повністю тихо (без повідомлень, без індикатора) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Лише індикатор (без повідомлень)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK лише в одному каналі                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (необов’язково)

Якщо файл `HEARTBEAT.md` існує в робочому просторі, типова підказка каже агенту прочитати його. Думайте про нього як про ваш "контрольний список Heartbeat": невеликий, стабільний і безпечний для включення кожні 30 хвилин.

Під час звичайних запусків `HEARTBEAT.md` впроваджується лише тоді, коли вказівки Heartbeat увімкнено для типового агента. Вимкнення каденції Heartbeat через `0m` або встановлення `includeSystemPromptSection: false` вилучає його зі звичайного bootstrap-контексту.

Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки й markdown-заголовки на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб заощадити виклики API. Такий пропуск повідомляється як `reason=empty-heartbeat-file`. Якщо файл відсутній, Heartbeat усе одно запускається, а модель вирішує, що робити.

Тримайте його маленьким (короткий контрольний список або нагадування), щоб уникати роздування підказки.

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
    - До підказки Heartbeat для цього тіку включаються лише **належні** завдання.
    - Якщо немає належних завдань, Heartbeat повністю пропускається (`reason=no-tasks-due`), щоб уникнути марного виклику моделі.
    - Вміст у `HEARTBEAT.md`, який не є завданнями, зберігається і додається як додатковий контекст після списку належних завдань.
    - Часові мітки останнього запуску завдань зберігаються в стані сеансу (`heartbeatTaskState`), тож інтервали переживають звичайні перезапуски.
    - Часові мітки завдань просуваються лише після того, як запуск Heartbeat завершує свій звичайний шлях відповіді. Пропущені запуски `empty-heartbeat-file` / `no-tasks-due` не позначають завдання як завершені.

  </Accordion>
</AccordionGroup>

Режим завдань корисний, коли ви хочете, щоб один файл Heartbeat містив кілька періодичних перевірок без оплати за всі з них на кожному тіку.

### Чи може агент оновлювати HEARTBEAT.md?

Так — якщо ви попросите його про це.

`HEARTBEAT.md` — це просто звичайний файл у робочому просторі агента, тож ви можете сказати агенту (у звичайному чаті) щось на кшталт:

- "Онови `HEARTBEAT.md`, щоб додати щоденну перевірку календаря."
- "Перепиши `HEARTBEAT.md`, щоб він був коротшим і зосередженим на подальших діях у вхідних."

Якщо ви хочете, щоб це відбувалося проактивно, ви також можете включити явний рядок у вашу підказку Heartbeat, наприклад: "Якщо контрольний список застаріє, онови HEARTBEAT.md кращим."

<Warning>
Не кладіть секрети (ключі API, номери телефонів, приватні токени) у `HEARTBEAT.md` — він стає частиною контексту підказки.
</Warning>

## Ручне пробудження (на вимогу)

Ви можете поставити системну подію в чергу й запустити негайний Heartbeat за допомогою:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Якщо для кількох агентів налаштовано `heartbeat`, ручне пробудження негайно запускає Heartbeat кожного з цих агентів.

Використовуйте `--mode next-heartbeat`, щоб дочекатися наступного запланованого тіку.

## Доставка міркувань (необов’язково)

За замовчуванням Heartbeat доставляє лише фінальне корисне навантаження "відповіді".

Якщо вам потрібна прозорість, увімкніть:

- `agents.defaults.heartbeat.includeReasoning: true`

Коли це ввімкнено, Heartbeat також доставлятиме окреме повідомлення з префіксом `Reasoning:` (така сама форма, як `/reasoning on`). Це може бути корисним, коли агент керує кількома сеансами/кодексами і ви хочете бачити, чому він вирішив вас пінгувати, але це також може розкрити більше внутрішніх деталей, ніж вам потрібно. У групових чатах краще залишати це вимкненим.

## Обізнаність про вартість

Heartbeat запускає повні проходи агента. Коротші інтервали спалюють більше токенів. Щоб зменшити вартість:

- Використовуйте `isolatedSession: true`, щоб уникнути надсилання повної історії розмови (~100K токенів до ~2-5K за запуск).
- Використовуйте `lightContext: true`, щоб обмежити bootstrap-файли лише `HEARTBEAT.md`.
- Установіть дешевшу `model` (наприклад, `ollama/llama3.2:1b`).
- Тримайте `HEARTBEAT.md` маленьким.
- Використовуйте `target: "none"`, якщо вам потрібні лише оновлення внутрішнього стану.

## Переповнення контексту після Heartbeat

Якщо Heartbeat використовує меншу локальну модель, наприклад модель Ollama з вікном 32k, а наступний прохід основного сеансу повідомляє про переповнення контексту, перевірте, чи попередній Heartbeat не залишив сеанс на моделі Heartbeat. Повідомлення скидання OpenClaw вказує на це, коли остання runtime-модель відповідає налаштованій `heartbeat.model`.

Використовуйте `isolatedSession: true`, щоб запускати Heartbeat у свіжому сеансі, поєднайте це з `lightContext: true` для найменшої підказки або виберіть модель Heartbeat з вікном контексту, достатньо великим для спільного сеансу.

## Пов’язане

- [Автоматизація та завдання](/uk/automation) — усі механізми автоматизації стисло
- [Фонові завдання](/uk/automation/tasks) — як відстежується відокремлена робота
- [Часовий пояс](/uk/concepts/timezone) — як часовий пояс впливає на планування Heartbeat
- [Усунення несправностей](/uk/automation/cron-jobs#troubleshooting) — налагодження проблем автоматизації
