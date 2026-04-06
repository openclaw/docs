---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та налаштування
title: Discord
x-i18n:
    generated_at: "2026-04-06T02:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54af2176a1b4fa1681e3f07494def0c652a2730165058848000e71a59e2a9d08
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Статус: готово для приватних повідомлень і каналів серверів через офіційний шлюз Discord.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Discord за замовчуванням працюють у режимі сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити нову програму з ботом, додати бота на свій сервер і сполучити його з OpenClaw. Ми рекомендуємо додати бота на ваш власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть програму Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть її, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на будь-яке ім’я, яким ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Все ще на сторінці **Bot**, прокрутіть вниз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібен лише для оновлень статусу присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого насправді не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він невдовзі вам знадобиться.

  </Step>

  <Step title="Згенеруйте URL-запрошення і додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL-запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть вниз до **OAuth2 URL Generator** і ввімкніть:

    - `bot`
    - `applications.commands`

    Нижче з’явиться розділ **Bot Permissions**. Увімкніть:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (необов’язково)

    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у програму Discord, вам потрібно ввімкнути Developer Mode, щоб мати змогу копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші на **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші на **своєму аватарі** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви надішлете всі три OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб сполучення працювало, Discord має дозволяти вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші на **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам приватні повідомлення. Залиште це ввімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали серверів, можете вимкнути приватні повідомлення після сполучення.

  </Step>

  <Step title="Безпечно встановіть токен свого бота (не надсилайте його в чат)">
    Токен вашого Discord-бота — це секрет (як пароль). Установіть його на машині, де працює OpenClaw, перш ніж надсилати повідомлення своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через програму OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте сполучення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, у Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже встановив токен свого Discord-бота в конфігурації. Будь ласка, заверши налаштування Discord за допомогою User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви віддаєте перевагу файловій конфігурації, установіть:

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

        Резервне env-значення для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Підтримуються текстові значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` у провайдерах env/file/exec. Див. [Secrets Management](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше сполучення через приватне повідомлення">
    Дочекайтеся, поки шлюз запуститься, а потім надішліть боту приватне повідомлення в Discord. У відповідь він надішле код сполучення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код сполучення своєму агенту в наявному каналі:

        > "Підтвердь цей код сполучення Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Коди сполучення спливають через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через приватні повідомлення.

  </Step>
</Steps>

<Note>
Визначення токена враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним значенням із env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (message tool/channel actions) явний `token` для виклику використовується для цього виклику. Це стосується дій надсилання та дій у стилі читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Налаштування політики облікового запису/повторних спроб усе ще беруться з вибраного облікового запису в активному runtime snapshot.
</Note>

## Рекомендовано: налаштуйте робочий простір сервера

Щойно приватні повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist серверів">
    Це дозволяє вашому агенту відповідати в будь-якому каналі вашого сервера, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Discord Server ID `<server_id>` до allowlist серверів"
      </Tab>
      <Tab title="Config">

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
    За замовчуванням ваш агент відповідає в каналах сервера лише тоді, коли його згадують через @mention. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без потреби в @mentioned"
      </Tab>
      <Tab title="Config">
        Установіть `requireMention: false` у конфігурації сервера:

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

  <Step title="Сплануйте пам’ять для каналів сервера">
    За замовчуванням довготривала пам’ять (MEMORY.md) завантажується лише в сесіях приватних повідомлень. У каналах сервера MEMORY.md не завантажується автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, розмістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони вбудовуються в кожну сесію). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкуватися. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому процесу роботи.

## Модель runtime

- Шлюз керує з’єднанням із Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення Discord отримують відповіді назад у Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали серверів мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові приватні повідомлення ігноруються за замовчуванням (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих сесіях команд (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизованої сесії розмови.

## Канали forum

Канали форумів і медіаканали Discord приймають лише дописи в потоках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського forum (`channel:<forumId>`), щоб автоматично створити потік. Заголовок потоку використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити потік безпосередньо. Не передавайте `--message-id` для каналів forum.

Приклад: надіслати до батьківського forum, щоб створити потік

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити потік forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські forum не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте в сам потік (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери Discord components v2 для повідомлень агента. Використовуйте message tool із payload `components`. Результати взаємодій маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій підтримують до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити використовувати кнопки, елементи вибору та форми кілька разів, доки вони не спливуть.

Щоб обмежити, хто може натискати кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо це налаштовано, користувачі, які не відповідають умові, отримають ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний засіб вибору моделі з випадними списками провайдера та моделі, а також кроком Submit. Відповідь засобу вибору є ефемерною, і використовувати її може лише користувач, який його викликав.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити ім’я завантаження, коли воно має відповідати посиланню вкладення

Модальні форми:

- Додайте `components.modal` з максимум 5 полями
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
    - `open` (потребує, щоб `channels.discord.allowFrom` включав `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика приватних повідомлень не є open, невідомі користувачі блокуються (або отримують запит на сполучення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхній власний `allowFrom` не встановлено.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат DM-цілі для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID неоднозначні й відхиляються, якщо явно не вказано вид цілі користувача/каналу.

  </Tab>

  <Tab title="Політика серверів">
    Обробка серверів керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова конфігурація, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - сервер має збігатися з `channels.discord.guilds` (бажано `id`, slug теж приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли збігаються з `users` АБО `roles`
    - пряме зіставлення за іменем/тегом вимкнене за замовчуванням; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для сервера налаштовано `channels`, канали, яких немає в списку, забороняються
    - якщо сервер не має блоку `channels`, дозволяються всі канали в цьому сервері з allowlist

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

    Якщо ви лише встановите `DISCORD_BOT_TOKEN` і не створите блок `channels.discord`, резервна поведінка runtime буде `groupPolicy="allowlist"` (з попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Згадки та групові приватні повідомлення">
    Повідомлення серверів за замовчуванням вимагають згадки.

    Визначення згадки включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту у підтримуваних випадках

    `requireMention` налаштовується для кожного сервера/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові приватні повідомлення:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів за ролями

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників Discord-сервера до різних агентів за ID ролі. Прив’язки за ролями приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише за сервером. Якщо прив’язка також задає інші поля відповідності (наприклад, `peer` + `guildId` + `roles`), мають збігатися всі налаштовані поля.

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
  <Accordion title="Створення програми і бота">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Скопіюйте токен бота

  </Accordion>

  <Accordion title="Привілейовані intents">
    У **Bot -> Privileged Gateway Intents** увімкніть:

    - Message Content Intent
    - Server Members Intent (рекомендовано)

    Presence intent є необов’язковим і потрібен лише якщо ви хочете отримувати оновлення статусу присутності. Установлення статусу присутності бота (`setPresence`) не потребує ввімкнення оновлень присутності для учасників.

  </Accordion>

  <Accordion title="OAuth scopes і базові дозволи">
    Генератор OAuth URL:

    - scopes: `bot`, `applications.commands`

    Типові базові дозволи:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (необов’язково)

    Уникайте `Administrator`, якщо це не потрібно явно.

  </Accordion>

  <Accordion title="Скопіюйте ID">
    Увімкніть Discord Developer Mode, потім скопіюйте:

    - ID сервера
    - ID каналу
    - ID користувача

    Для надійних аудитів і перевірок віддавайте перевагу числовим ID у конфігурації OpenClaw.

  </Accordion>
</AccordionGroup>

## Нативні команди та авторизація команд

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнений для Discord.
- Перевизначення для конкретного каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не мають доступу; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash commands](/uk/tools/slash-commands) для каталогу команд і поведінки.

Налаштування слеш-команд за замовчуванням:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Теги відповіді та нативні відповіді">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне впорядкування відповідей у потоки. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord у межах ходу.
    `batched` додає неявне посилання нативної відповіді Discord лише коли
    вхідний хід був дебаунсованим пакетом із кількох повідомлень. Це корисно,
    якщо ви хочете використовувати нативні відповіді переважно для неоднозначних
    активних чатів із серіями повідомлень, а не для кожного окремого повідомлення.

    ID повідомлень передаються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд live stream">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту.

    - `channels.discord.streaming` керує потоковим попереднім переглядом (`off` | `partial` | `block` | `progress`, за замовчуванням: `off`).
    - За замовчуванням залишається `off`, оскільки редагування попереднього перегляду в Discord може швидко впертися в обмеження частоти, особливо коли кілька ботів або шлюзів використовують один обліковий запис або трафік сервера.
    - `progress` приймається для міжканальної узгодженості та відображається як `partial` у Discord.
    - `channels.discord.streamMode` — це застарілий псевдонім, і він автоматично мігрується.
    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` виводить фрагменти розміру чернетки (використовуйте `draftChunk` для налаштування розміру та точок розриву).

    Приклад:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Типові значення фрагментації для режиму `block` (обмежуються `channels.discord.textChunkLimit`):

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

    Потоковий попередній перегляд підтримує лише текст; медіавідповіді повертаються до звичайної доставки.

    Примітка: потоковий попередній перегляд відокремлений від block streaming. Коли block streaming явно
    увімкнено для Discord, OpenClaw пропускає потоковий попередній перегляд, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка потоків">
    Контекст історії сервера:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервно: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка потоків:

    - Потоки Discord маршрутизуються як сесії каналів
    - метадані батьківського потоку можуть використовуватися для зв’язування з батьківською сесією
    - конфігурація потоку успадковує конфігурацію батьківського каналу, якщо не існує запису, специфічного для потоку

    Теми каналів вбудовуються як **недовірений** контекст (не як системний prompt).
    Контекст відповідей і процитованих повідомлень наразі залишається таким, як отримано.
    Allowlist Discord переважно визначають, хто може активувати агента, а не є повноцінною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Прив’язані до потоків сесії для субагентів">
    Discord може прив’язати потік до цілі сесії, щоб подальші повідомлення в цьому потоці продовжували маршрутизуватися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий потік до цілі субагента/сесії
    - `/unfocus` видалити поточну прив’язку потоку
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне скасування фокусу через неактивність для прив’язаних фокусованих сесій
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для прив’язаних фокусованих сесій

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
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати потоки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати потоки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки потоків вимкнені для облікового запису, `/focus` і пов’язані операції прив’язки потоків недоступні.

    Див. [Sub-agents](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Configuration Reference](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки ACP-каналів">
    Для стабільних «завжди ввімкнених» ACP-робочих просторів налаштуйте верхньорівневі типізовані ACP-прив’язки, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або потік Discord на місці й надалі спрямовує майбутні повідомлення до тієї самої ACP-сесії.
    - Це все ще може означати «запустити свіжу ACP-сесію Codex», але саме по собі не створює новий потік Discord. Наявний канал залишається поверхнею чату.
    - Codex усе ще може працювати у власному `cwd` або робочому просторі backend на диску. Цей робочий простір є станом runtime, а не потоком Discord.
    - Повідомлення в потоках можуть успадковувати ACP-прив’язку батьківського каналу.
    - У прив’язаному каналі або потоці `/new` і `/reset` скидають ту саму ACP-сесію на місці.
    - Тимчасові прив’язки потоків усе ще працюють і можуть перевизначати визначення цілі, поки активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній потік через `--thread auto|here`. Він не потрібен для `/acp spawn ... --bind here` у поточному каналі.

    Докладніше про поведінку прив’язок див. у [ACP Agents](/uk/tools/acp-agents).

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожного сервера:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події й приєднуються до маршрутизованої Discord-сесії.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервне емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає emoji Unicode або назви власних emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані з каналу, увімкнені за замовчуванням.

    Це впливає на потоки `/config set|unset` (коли функції команд увімкнено).

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

  <Accordion title="Gateway proxy">
    Спрямовуйте трафік WebSocket шлюзу Discord і стартові REST-запити (ID програми + визначення allowlist) через HTTP(S) проксі за допомогою `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Перевизначення для облікового запису:

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

    - allowlist можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за name/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID оригінального повідомлення та обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо `allowBots=true` не встановлено

  </Accordion>

  <Accordion title="Налаштування статусу присутності">
    Оновлення статусу присутності застосовуються, коли ви встановлюєте поле статусу або активності, або коли вмикаєте автоматичний статус присутності.

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

    Приклад активності (користувацький статус є типом активності за замовчуванням):

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

    Приклад стриму:

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
    - 4: Custom (використовує текст активності як стан статусу; emoji необов’язкове)
    - 5: Competing

    Приклад автоматичного статусу присутності (сигнал працездатності runtime):

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

    Auto presence зіставляє доступність runtime зі статусом Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Підтвердження в Discord">
    Discord підтримує обробку підтверджень за допомогою кнопок у приватних повідомленнях і може за бажанням публікувати запити на підтвердження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості резервно використовується `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні exec approvals, коли `enabled` не встановлено або дорівнює `"auto"` і принаймні одного затверджувача можна визначити або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить затверджувачів exec із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Установіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт підтверджень.

    Коли `target` має значення `channel` або `both`, запит на підтвердження видимий у каналі. Лише визначені затверджувачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на підтвердження містять текст команди, тож вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу не вдається вивести з ключа сесії, OpenClaw повертається до доставки через приватні повідомлення.

    Discord також відображає спільні кнопки підтвердження, які використовуються іншими чат-каналами. Нативний адаптер Discord переважно додає маршрутизацію приватних повідомлень для затверджувачів і fanout у канал.
    Коли ці кнопки присутні, вони є основним UX підтверджень; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що підтвердження в чаті недоступні або ручне підтвердження є єдиним шляхом.

    Авторизація шлюзу для цього обробника використовує той самий спільний контракт визначення облікових даних, що й інші клієнти Gateway:

    - локальна авторизація env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, потім `gateway.auth.*`)
    - у локальному режимі `gateway.remote.*` може використовуватися як резерв лише якщо `gateway.auth.*` не встановлено; налаштовані, але нерозв’язані локальні SecretRef завершуються з закриттям доступу
    - підтримка remote-mode через `gateway.remote.*`, коли застосовно
    - перевизначення URL безпечні щодо перевизначень: перевизначення CLI не повторно використовують неявні облікові дані, а перевизначення env використовують лише облікові дані env

    Поведінка визначення підтверджень:

    - ID з префіксом `plugin:` визначаються через `plugin.approval.resolve`.
    - Інші ID визначаються через `exec.approval.resolve`.
    - Discord не робить тут додаткового резервного переходу exec-to-plugin; саме
      префікс id визначає, який метод шлюзу викликається.

    Exec approvals спливають за замовчуванням через 30 хвилин. Якщо підтвердження не працюють через
    невідомі ID підтвердження, перевірте визначення затверджувачів, увімкнення функції та
    те, що доставлений тип ID підтвердження відповідає очікуваному запиту.

    Пов’язана документація: [Exec approvals](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії з повідомленнями Discord включають обмін повідомленнями, адміністрування каналів, модерацію, статус присутності та дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- статус присутності: `setPresence`

Шлюзи дій розташовані в `channels.discord.actions.*`.

Поведінка шлюзів за замовчуванням:

| Група дій                                                                                                                                                                 | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                     | вимкнено         |
| moderation                                                                                                                                                                | вимкнено         |
| presence                                                                                                                                                                  | вимкнено         |

## Components v2 UI

OpenClaw використовує Discord components v2 для exec approvals і міжконтекстних маркерів. Дії з повідомленнями Discord також можуть приймати `components` для користувацького UI (розширено; потребує побудови payload компонента через discord tool), тоді як застарілі `embeds` усе ще доступні, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовується контейнерами компонентів Discord (hex).
- Для окремого облікового запису задається через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

## Голосові канали

OpenClaw може приєднуватися до голосових каналів Discord для безперервних розмов у реальному часі. Це окремо від вкладень голосових повідомлень.

Вимоги:

- Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот має мати дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте нативну команду лише для Discord `/vc join|leave|status` для керування сесіями. Команда використовує агента за замовчуванням для облікового запису й дотримується тих самих правил allowlist і group policy, що й інші команди Discord.

Приклад auto-join:

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

- `voice.tts` перевизначає `messages.tts` лише для відтворення голосу.
- Ходи транскрипції голосу визначають статус власника з `allowFrom` Discord (або `dm.allowFrom`); мовці, які не є власниками, не можуть використовувати інструменти лише для власника (наприклад, `gateway` і `cron`).
- Голос увімкнений за замовчуванням; установіть `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються далі до параметрів приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо не встановлено.
- OpenClaw також відстежує помилки розшифрування під час прийому й автоматично відновлюється, виходячи та повторно приєднуючись до голосового каналу після повторних помилок за короткий проміжок часу.
- Якщо журнали прийому постійно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути помилка прийому у `@discordjs/voice`, відстежувана в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми й потребують аудіо OGG/Opus разом із метаданими. OpenClaw генерує хвильову форму автоматично, але для перевірки й конвертації аудіофайлів на вузлі шлюзу мають бути доступні `ffmpeg` і `ffprobe`.

Вимоги та обмеження:

- Надавайте **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord не дозволяє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

Приклад:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використовуються заборонені intents або бот не бачить повідомлень сервера">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від визначення користувачів/учасників
    - перезапустіть шлюз після зміни intents

  </Accordion>

  <Accordion title="Повідомлення сервера неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist сервера в `channels.discord.guilds`
    - якщо існує мапа `channels` сервера, дозволені лише перелічені канали
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

    - `groupPolicy="allowlist"` без відповідного allowlist сервера/каналу
    - `requireMention` налаштовано не там, де потрібно (має бути в `channels.discord.guilds` або записі каналу)
    - відправника блокує allowlist `users` сервера/каналу

  </Accordion>

  <Accordion title="Довготривалі обробники завершуються за тайм-аутом або дублюють відповіді">

    Типові журнали:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Параметр бюджету слухача:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Параметр тайм-ауту виконання worker:

    - один обліковий запис: `channels.discord.inboundWorker.runTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - за замовчуванням: `1800000` (30 хвилин); установіть `0`, щоб вимкнути

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

    Використовуйте `eventQueue.listenerTimeout` для повільного налаштування слухача, а `inboundWorker.runTimeoutMs`
    лише якщо вам потрібен окремий запобіжник для агентських ходів у черзі.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення під час runtime все ще може працювати, але перевірка не зможе повністю верифікувати дозволи.

  </Accordion>

  <Accordion title="Проблеми з приватними повідомленнями та сполученням">

    - приватні повідомлення вимкнено: `channels.discord.dm.enabled=false`
    - політику приватних повідомлень вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-бот">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановите `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT пропадає з DecryptionFailed(...)">

    - підтримуйте актуальність OpenClaw (`openclaw update`), щоб логіка відновлення прийому голосу Discord була на місці
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - почніть з `channels.discord.voice.decryptionFailureTolerance=24` (типове значення upstream) і налаштовуйте лише за потреби
    - стежте за журналами на предмет:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали й порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

Основний довідник:

- [Configuration reference - Discord](/uk/gateway/configuration-reference#discord)

Високосигнальні поля Discord:

- запуск/авторизація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет слухача), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий псевдонім: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb`, `retry`
  - `mediaMaxMb` обмежує вихідні завантаження Discord (за замовчуванням: `100MB`)
- дії: `actions.*`
- статус присутності: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Безпека та експлуатація

- Розглядайте токени бота як секрети (`DISCORD_BOT_TOKEN` бажаний у керованих середовищах).
- Надавайте Discord лише мінімально необхідні дозволи.
- Якщо стан розгортання/стану команд застарів, перезапустіть шлюз і знову перевірте через `openclaw channels status --probe`.

## Пов’язане

- [Сполучення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Безпека](/uk/gateway/security)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
- [Слеш-команди](/uk/tools/slash-commands)
