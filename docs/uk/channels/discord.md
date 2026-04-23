---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та налаштування
title: Discord
x-i18n:
    generated_at: "2026-04-23T08:25:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Статус: готово для приватних повідомлень і каналів гільдій через офіційний gateway Discord.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    За замовчуванням приватні повідомлення Discord працюють у режимі підключення.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналом" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і підключити його до OpenClaw. Ми рекомендуємо додавати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (оберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок і бота Discord">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Все ще на сторінці **Bot**, прокрутіть вниз до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібне лише для оновлень статусу присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Поверніться вгору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він вам скоро знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення й додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на свій сервер.

    Прокрутіть вниз до **OAuth2 URL Generator** і увімкніть:

    - `bot`
    - `applications.commands`

    Нижче з’явиться розділ **Bot Permissions**. Увімкніть щонайменше:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в обговореннях Discord, зокрема у сценаріях форумних або медіаканалів, що створюють або продовжують обговорення, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL внизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на Discord-сервері.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно увімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші на **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші на **власному аватарі** → **Copy User ID**

    Збережіть свій **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три значення в OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб підключення працювало, Discord має дозволяти вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші на **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам приватні повідомлення. Залиште це увімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, після підключення можна вимкнути приватні повідомлення.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чат)">
    Токен вашого Discord-бота — це секрет (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фонова служба, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте підключення">

    <Tabs>
      <Tab title="Попросіть свого агента">
        Напишіть своєму агенту OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і скажіть йому це. Якщо Discord — ваш перший канал, замість цього використайте вкладку CLI / config.

        > "Я вже задав токен свого Discord-бота в конфігурації. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви віддаєте перевагу файловій конфігурації, задайте:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Резервна змінна середовища для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Підтримуються відкриті значення `token`. Також підтримуються значення SecretRef для `channels.discord.token` у провайдерах env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше підключення через приватні повідомлення">
    Дочекайтеся, поки gateway запуститься, а потім надішліть приватне повідомлення своєму боту в Discord. Він відповість кодом підключення.

    <Tabs>
      <Tab title="Попросіть свого агента">
        Надішліть код підключення своєму агенту в наявному каналі:

        > "Підтвердь цей код підключення Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Термін дії кодів підключення спливає через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через приватні повідомлення.

  </Step>
</Steps>

<Note>
Визначення токена враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервною змінною середовища. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується для цього виклику. Це застосовується до дій надсилання й читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису/налаштування повторних спроб усе ще беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Щойно приватні повідомлення запрацюють, ви зможете налаштувати свій Discord-сервер як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених гільдій">
    Це дозволяє вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Додай мій Discord Server ID `<server_id>` до списку дозволених гільдій"
      </Tab>
      <Tab title="Конфігурація">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Дозвольте відповіді без @mention">
    За замовчуванням ваш агент відповідає в каналах гільдії лише тоді, коли його згадано через @mention. Для приватного сервера, ймовірно, ви захочете, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без @mention"
      </Tab>
      <Tab title="Конфігурація">
        Задайте `requireMention: false` у конфігурації гільдії:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Плануйте використання пам’яті в каналах гільдії">
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в сесіях приватних повідомлень. У каналах гільдії `MEMORY.md` автоматично не завантажується.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, розмістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони впроваджуються для кожної сесії). Довготривалі нотатки зберігайте в `MEMORY.md` і звертайтеся до них за потреби через інструменти пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму Discord-сервері й почніть спілкування. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway керує з’єднанням Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення Discord повертаються в Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують спільну основну сесію агента (`agent:main:main`).
- Канали гільдії мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові приватні повідомлення за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизованої сесії розмови.

## Форумні канали

Форумні та медіаканали Discord приймають лише публікації в обговореннях. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення батьківському форуму (`channel:<forumId>`), щоб автоматично створити обговорення. Заголовок обговорення використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити обговорення напряму. Не передавайте `--message-id` для форумних каналів.

Приклад: надсилання в батьківський форум для створення обговорення

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явне створення форумного обговорення

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте в саме обговорення (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із корисним навантаженням `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, списків вибору та форм, доки не спливе їхній термін дії.

Щоб обмежити, хто може натискати кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо налаштовано, користувачі, які не збігаються, отримають ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадними списками провайдера й моделі та кроком Submit. Якщо не задано `commands.modelsWrite=false`, `/models add` також підтримує додавання нового запису провайдера/моделі з чату, а нові додані моделі з’являються без перезапуску gateway. Відповідь вибору є ефемерною, і використовувати її може лише користувач, який викликав команду.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити ім’я завантаження, коли воно має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` із до 5 полями
- Типи полів: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw автоматично додає кнопку запуску

Приклад:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика приватних повідомлень">
    `channels.discord.dmPolicy` керує доступом до приватних повідомлень (застаріле: `channels.discord.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика приватних повідомлень не відкрита, невідомі користувачі блокуються (або отримують запит на підключення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі приватного повідомлення для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Числові ID без префікса є неоднозначними та відхиляються, якщо явно не вказано тип цілі користувача/каналу.

  </Tab>

  <Tab title="Політика гільдії">
    Обробка гільдій керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова поведінка, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (переважно `id`, також приймається slug)
    - необов’язкові списки дозволених відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення за іменем/тегом за замовчуванням вимкнене; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для гільдії налаштовано `channels`, канали, яких немає в списку, забороняються
    - якщо для гільдії немає блоку `channels`, дозволяються всі канали в цій гільдії зі списку дозволених

    Приклад:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Якщо ви лише задали `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, резервна поведінка runtime — `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки та групові приватні повідомлення">
    Повідомлення в гільдіях за замовчуванням вимагають згадки.

    Виявлення згадки включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожної гільдії/каналу окремо (`channels.discord.guilds...`).
    `ignoreOtherMentions` за бажанням відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові приватні повідомлення:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий список дозволених через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише на рівні гільдії. Якщо прив’язка також задає інші поля зіставлення (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Налаштування Developer Portal

<AccordionGroup>
  <Accordion title="Створення застосунку та бота">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Скопіюйте токен бота

  </Accordion>

  <Accordion title="Привілейовані intents">
    У **Bot -> Privileged Gateway Intents** увімкніть:

    - Message Content Intent
    - Server Members Intent (рекомендовано)

    Presence intent є необов’язковим і потрібен лише якщо ви хочете отримувати оновлення присутності. Налаштування присутності бота (`setPresence`) не потребує ввімкнення оновлень присутності для учасників.

  </Accordion>

  <Accordion title="OAuth scopes і базові дозволи">
    Генератор OAuth URL:

    - scopes: `bot`, `applications.commands`

    Типові базові дозволи:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в обговореннях Discord, зокрема у сценаріях форумних або медіаканалів, що створюють або продовжують обговорення, також увімкніть **Send Messages in Threads**.
    Уникайте `Administrator`, якщо він не потрібен явно.

  </Accordion>

  <Accordion title="Копіювання ID">
    Увімкніть Discord Developer Mode, а потім скопіюйте:

    - ID сервера
    - ID каналу
    - ID користувача

    Для надійних аудитів і перевірок віддавайте перевагу числовим ID у конфігурації OpenClaw.

  </Accordion>
</AccordionGroup>

## Нативні команди та авторизація команд

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнено для Discord.
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі списки дозволених і політики Discord, що й звичайна обробка повідомлень.
- Команди все одно можуть бути видимими в інтерфейсі Discord для користувачів без авторизації; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Налаштування slash-команд за замовчуванням:

- `ephemeral: true`

## Деталі можливостей

<AccordionGroup>
  <Accordion title="Теги відповідей і нативні відповіді">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Це керується через `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне вкладення відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord за цей хід.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був відкладеним пакетом із кількох повідомлень. Це корисно,
    коли вам потрібні нативні відповіді переважно для неоднозначних чатів із
    серією повідомлень, а не для кожного окремого повідомлення.

    ID повідомлень відображаються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд Live stream">
    OpenClaw може передавати чернетки відповідей потоком, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` у Discord відповідає `partial`; `streamMode` є застарілим псевдонімом і автоматично мігрується.

    Значенням за замовчуванням лишається `off`, оскільки редагування попереднього перегляду в Discord швидко впирається в обмеження частоти, коли кілька ботів або gateway спільно використовують один обліковий запис.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` виводить фрагменти розміру чернетки (використовуйте `draftChunk` для налаштування розміру й точок розриву, обмежених `textChunkLimit`).
    - Фінальні повідомлення з медіа, помилками та явними відповідями скасовують незавершені редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи повторно використовують оновлення інструментів/прогресу повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли `block` streaming явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового виводу.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка обговорень">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервно: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка обговорень:

    - Обговорення Discord маршрутизуються як сесії каналів і успадковують конфігурацію батьківського каналу, якщо не перевизначено.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) вмикає для нових автообговорень початкове заповнення з батьківського транскрипту. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть визначати цілі приватних повідомлень `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів упроваджуються як **ненадійний** контекст. Списки дозволених обмежують, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сесії, прив’язані до обговорень, для субагентів">
    Discord може прив’язати обговорення до цілі сесії, щоб подальші повідомлення в цьому обговоренні продовжували маршрутизуватися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язати поточне/нове обговорення до цілі субагента/сесії
    - `/unfocus` видалити поточну прив’язку обговорення
    - `/agents` показати активні запуски й стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне скасування фокуса через неактивність для сфокусованих прив’язок
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для сфокусованих прив’язок

    Конфігурація:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні значення за замовчуванням.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути `true`, щоб автоматично створювати/прив’язувати обговорення для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути `true`, щоб автоматично створювати/прив’язувати обговорення для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки обговорень вимкнено для облікового запису, `/focus` та пов’язані операції прив’язки обговорень недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Довідник із конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки ACP до каналів">
    Для стабільних «завжди активних» робочих просторів ACP налаштуйте типізовані ACP-прив’язки верхнього рівня, націлені на розмови Discord.

    Шлях конфігурації:

    - `bindings[]` з `type: "acp"` і `match.channel: "discord"`

    Приклад:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Примітки:

    - `/acp spawn codex --bind here` прив’язує поточний канал або обговорення на місці й зберігає майбутні повідомлення в тій самій сесії ACP. Повідомлення в обговореннях успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або обговоренні `/new` і `/reset` скидають ту саму сесію ACP на місці. Тимчасові прив’язки обговорень можуть перевизначати визначення цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірнє обговорення через `--thread auto|here`.

    Див. [ACP Agents](/uk/tools/acp-agents) для подробиць про поведінку прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожної гільдії:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованої сесії Discord.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервне емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви користувацьких емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис конфігурації">
    Записи конфігурації, ініційовані каналом, за замовчуванням увімкнені.

    Це впливає на сценарії `/config set|unset` (коли ввімкнено функції команд).

    Вимкнення:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Проксі gateway">
    Маршрутизуйте трафік WebSocket gateway Discord і початкові REST-запити (ID застосунку + визначення списку дозволених) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Перевизначення для окремого облікового запису:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Підтримка PluralKit">
    Увімкніть визначення PluralKit, щоб зіставляти проксійовані повідомлення з ідентичністю учасника системи:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Примітки:

    - списки дозволених можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за назвою/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошук використовує оригінальний ID повідомлення й обмежується часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо не задано `allowBots=true`

  </Accordion>

  <Accordion title="Налаштування статусу присутності">
    Оновлення статусу присутності застосовуються, коли ви задаєте поле статусу або активності, або коли вмикаєте автоматичний статус присутності.

    Приклад лише зі статусом:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Приклад активності (користувацький статус — тип активності за замовчуванням):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Приклад трансляції:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Відповідність типів активності:

    - 0: Playing
    - 1: Streaming (потрібен `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (використовує текст активності як стан статусу; емодзі необов’язкове)
    - 5: Competing

    Приклад автоматичного статусу присутності (сигнал стану runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Автоматичний статус присутності зіставляє доступність runtime зі статусом Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Погодження в Discord">
    Discord підтримує обробку погоджень за допомогою кнопок у приватних повідомленнях і може за потреби публікувати запити на погодження в каналі, де вони виникли.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовується резервно `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні exec-погодження, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного погоджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не визначає exec-погоджувачів із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт погодження.

    Коли `target` має значення `channel` або `both`, запит на погодження видимий у каналі. Лише визначені погоджувачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на погодження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо визначити з ключа сесії, OpenClaw повертається до доставки через приватні повідомлення.

    Discord також відображає спільні кнопки погодження, які використовуються іншими чат-каналами. Нативний адаптер Discord головним чином додає маршрутизацію приватних повідомлень погоджувачам і розсилання в канал.
    Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що погодження через чат недоступні або ручне погодження — єдиний шлях.

    Авторизація gateway і визначення погоджень дотримуються спільного клієнтського контракту Gateway (`plugin:` ID визначаються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Термін дії погоджень за замовчуванням спливає через 30 хвилин.

    Див. [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та обмеження дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, статус присутності та дії з метаданими.

Основні приклади:

- повідомлення: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- статус присутності: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файлу), щоб задати зображення обкладинки запланованої події.

Обмеження дій розміщені в `channels.discord.actions.*`.

Поведінка обмежень за замовчуванням:

| Група дій                                                                                                                                                                 | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                     | вимкнено         |
| moderation                                                                                                                                                                | вимкнено         |
| presence                                                                                                                                                                  | вимкнено         |

## UI components v2

OpenClaw використовує Discord components v2 для exec-погоджень і міжконтекстних маркерів. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (розширений сценарій; потребує побудови корисного навантаження компонентів через інструмент discord), тоді як застарілі `embeds` усе ще доступні, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовується контейнерами компонентів Discord (hex).
- Задається для окремого облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` ігноруються, коли присутні components v2.

Приклад:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Голос

У Discord є дві окремі голосові поверхні: realtime **voice channels** (безперервні розмови) і **voice message attachments** (формат попереднього перегляду хвильової форми). gateway підтримує обидві.

### Voice channels

Вимоги:

- Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот має мати дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує агента за замовчуванням для облікового запису й дотримується тих самих правил списку дозволених і групової політики, що й інші команди Discord.

Приклад автоматичного приєднання:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Примітки:

- `voice.tts` перевизначає `messages.tts` лише для голосового відтворення.
- Ходи голосових транскриптів визначають статус власника з `allowFrom` Discord (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад, `gateway` і `cron`).
- Голос увімкнено за замовчуванням; задайте `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються в параметри приєднання `@discordjs/voice`.
- Якщо не задано, значення за замовчуванням для `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`.
- OpenClaw також відстежує збої розшифрування при отриманні й автоматично відновлюється, виходячи та повторно приєднуючись до голосового каналу після повторних збоїв за короткий проміжок часу.
- Якщо в логах отримання постійно з’являється `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути помилка отримання у `@discordjs/voice`, що відстежується в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми й потребують аудіо OGG/Opus. OpenClaw автоматично генерує хвильову форму, але на хості gateway потрібні `ffmpeg` і `ffprobe` для перевірки та конвертації.

- Укажіть **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному корисному навантаженні).
- Підтримується будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від визначення користувачів/учасників
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення гільдії неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте список дозволених гільдій у `channels.discord.guilds`
    - якщо існує мапа `channels` гільдії, дозволені лише канали зі списку
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, але все одно блокується">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволених гільдій/каналів
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або в записі каналу)
    - відправник заблокований списком дозволених `users` для гільдії/каналу

  </Accordion>

  <Accordion title="Довготривалі обробники завершуються за тайм-аутом або дублюють відповіді">

    Типові логи:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Параметр бюджету listener:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Параметр тайм-ауту виконання worker:

    - один обліковий запис: `channels.discord.inboundWorker.runTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - за замовчуванням: `1800000` (30 хвилин); задайте `0`, щоб вимкнути

    Рекомендована базова конфігурація:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Використовуйте `eventQueue.listenerTimeout` для повільного налаштування listener, а `inboundWorker.runTimeoutMs`
    лише якщо вам потрібен окремий запобіжник для агентських ходів у черзі.

  </Accordion>

  <Accordion title="Невідповідності під час аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення в runtime все одно може працювати, але probe не зможе повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з приватними повідомленнями та підключенням">

    - приватні повідомлення вимкнено: `channels.discord.dm.enabled=false`
    - політику приватних повідомлень вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження підключення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    За замовчуванням повідомлення, створені ботом, ігноруються.

    Якщо ви задали `channels.discord.allowBots=true`, використовуйте суворі правила згадок і списків дозволених, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT втрачається з DecryptionFailed(...)">

    - підтримуйте актуальність OpenClaw (`openclaw update`), щоб була наявна логіка відновлення прийому голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (значення upstream за замовчуванням) і налаштовуйте лише за потреби
    - відстежуйте логи на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть логи й порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Вказівники на довідник із конфігурації

Основний довідник:

- [Довідник із конфігурації - Discord](/uk/gateway/configuration-reference#discord)

Ключові поля Discord:

- запуск/авторизація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb`, `retry`
  - `mediaMaxMb` обмежує вихідні завантаження в Discord (за замовчуванням: `100MB`)
- дії: `actions.*`
- статус присутності: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- можливості: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Безпека та операції

- Ставтеся до токенів ботів як до секретів (`DISCORD_BOT_TOKEN` є бажаним варіантом у керованих середовищах).
- Надавайте Discord лише мінімально необхідні дозволи.
- Якщо стан розгортання/стан команд застарів, перезапустіть gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Безпека](/uk/gateway/security)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
- [Slash-команди](/uk/tools/slash-commands)
