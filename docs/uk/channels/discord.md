---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та налаштування
title: Discord
x-i18n:
    generated_at: "2026-04-21T16:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1681315a6c246c4b68347f5e22319e132f30ea4e29a19e7d1da9e83dce7b68d0
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Статус: готово для приватних повідомлень і каналів серверів через офіційний шлюз Discord.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Для приватних повідомлень Discord типовим режимом є режим підключення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Власна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналом" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно буде створити новий застосунок із ботом, додати бота на свій сервер і підключити його до OpenClaw. Ми рекомендуємо додавати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ту назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані інтенти">
    Перебуваючи на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імен із ID)
    - **Presence Intent** (необов’язково; потрібне лише для оновлень статусу присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL-запрошення й додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL-запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і ввімкніть:

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

  <Step title="Увімкніть режим розробника та зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно ввімкнути режим розробника, щоб мати змогу копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші на **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші на **своєму аватарі** → **Copy User ID**

    Збережіть свій **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб підключення працювало, Discord має дозволяти вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші на **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам приватні повідомлення. Залишайте це ввімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали сервера, можете вимкнути приватні повідомлення після підключення.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чаті)">
    Токен вашого бота Discord є секретом (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши та знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте підключення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поговоріть зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, натомість скористайтеся вкладкою CLI / config.

        > "Я вже задав токен свого Discord-бота в конфігурації. Будь ласка, заверши налаштування Discord із User ID `<user_id>` і Server ID `<server_id>`."
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

        Резервне значення env для типового облікового запису:

```bash
DISCORD_BOT_TOKEN=...
```

        Підтримуються відкриті значення `token`. Для `channels.discord.token` також підтримуються значення SecretRef у провайдерах env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше підключення через приватні повідомлення">
    Дочекайтеся, поки шлюз запуститься, а потім напишіть своєму боту в Discord у приватні повідомлення. Він відповість кодом підключення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код підключення своєму агенту у вашому наявному каналі:

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
Визначення токена враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для типового облікового запису.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується для цього конкретного виклику. Це стосується дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису/параметри повторних спроб, як і раніше, беруться з вибраного облікового запису в активному знімку середовища виконання.
</Note>

## Рекомендовано: налаштуйте робочий простір сервера

Коли приватні повідомлення вже працюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента зі своїм контекстом. Це рекомендовано для приватних серверів, де єте лише ви й ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist серверів">
    Це дає змогу вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Discord Server ID `<server_id>` до allowlist серверів"
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
    Типово ваш агент відповідає в каналах сервера лише тоді, коли його згадано через @mention. Для приватного сервера вам, імовірно, варто дозволити йому відповідати на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без обов’язкового @mentioned"
      </Tab>
      <Tab title="Конфігурація">
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
    Типово довготривала пам’ять (`MEMORY.md`) завантажується лише в сесіях приватних повідомлень. У каналах сервера `MEMORY.md` автоматично не завантажується.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони додаються до кожної сесії). Довготривалі нотатки зберігайте в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкуватися. Ваш агент бачить назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель виконання

- Gateway керує з’єднанням із Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді з Discord повертаються назад у Discord.
- Типово (`session.dmScope=main`) приватні чати використовують основну сесію агента (`agent:main:main`).
- Канали серверів мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові приватні чати типово ігноруються (`channels.discord.dm.groupEnabled=false`).
- Власні слеш-команди виконуються в ізольованих сесіях команд (`agent:<agentId>:discord:slash:<userId>`), при цьому все одно несуть `CommandTargetSessionKey` до маршрутизованої сесії розмови.

## Канали форуму

Канали форуму й медіаканали Discord приймають лише публікації в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити тред. Заголовок треду використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити тред безпосередньо. Не передавайте `--message-id` для каналів форуму.

Приклад: надсилання до батьківського форуму для створення треду

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явне створення треду форуму

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте в сам тред (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із навантаженням `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

Типово компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, виборів і форм, доки не сплине термін їх дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо налаштовано, користувачі, які не збігаються з умовами, отримують ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний засіб вибору моделі з випадними списками провайдера й моделі та кроком Submit. Відповідь засобу вибору є ефемерною, і лише користувач, який її викликав, може нею користуватися.

Вкладення файлів:

- блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити ім’я завантаження, коли воно має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` із максимум 5 полями
- Типи полів: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw автоматично додає кнопку-тригер

Приклад:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Необов’язковий резервний текст",
  components: {
    reusable: true,
    text: "Виберіть шлях",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Схвалити",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Відхилити", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Виберіть варіант",
          options: [
            { label: "Варіант A", value: "a" },
            { label: "Варіант B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Деталі",
      triggerLabel: "Відкрити форму",
      fields: [
        { type: "text", label: "Запитувач" },
        {
          type: "select",
          label: "Пріоритет",
          options: [
            { label: "Низький", value: "low" },
            { label: "Високий", value: "high" },
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

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика приватних повідомлень не є open, невідомі користувачі блокуються (або отримують запит на підключення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі приватних повідомлень для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Прості числові ID є неоднозначними й відхиляються, якщо явно не вказано тип цілі user/channel.

  </Tab>

  <Tab title="Політика серверів">
    Обробка серверів керується `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечним базовим значенням, коли існує `channels.discord`, є `allowlist`.

    Поведінка `allowlist`:

    - сервер має збігатися з `channels.discord.guilds` (перевага надається `id`, slug також приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення імен/тегів типово вимкнене; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - для `users` підтримуються імена/теги, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо для сервера налаштовано `channels`, канали, яких немає в списку, відхиляються
    - якщо сервер не має блоку `channels`, дозволяються всі канали в цьому allowlist-сервері

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

    Якщо ви лише задаєте `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, резервним значенням середовища виконання буде `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки та групові приватні повідомлення">
    Повідомлення серверів типово вимагають згадки.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    `requireMention` налаштовується для кожного сервера/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові приватні повідомлення:

    - типово: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агента на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників серверів Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише для серверів. Якщо прив’язка також задає інші поля збігу (наприклад, `peer` + `guildId` + `roles`), мають збігатися всі налаштовані поля.

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

  <Accordion title="Привілейовані інтенти">
    У **Bot -> Privileged Gateway Intents** увімкніть:

    - Message Content Intent
    - Server Members Intent (рекомендовано)

    Presence intent є необов’язковим і потрібен лише якщо ви хочете отримувати оновлення присутності. Налаштування присутності бота (`setPresence`) не потребує ввімкнення оновлень присутності для учасників.

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

    Уникайте `Administrator`, якщо в цьому немає явної потреби.

  </Accordion>

  <Accordion title="Копіювання ID">
    Увімкніть у Discord режим розробника, а потім скопіюйте:

    - ID сервера
    - ID каналу
    - ID користувача

    Для надійних аудитів і перевірок віддавайте перевагу числовим ID у конфігурації OpenClaw.

  </Accordion>
</AccordionGroup>

## Власні команди та авторизація команд

- `commands.native` типово має значення `"auto"` і ввімкнене для Discord.
- Перевизначення для конкретного каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані власні команди Discord.
- Авторизація власних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не мають авторизації; виконання все одно дотримується авторизації OpenClaw і повертає «не авторизовано».

Див. [Слеш-команди](/uk/tools/slash-commands), щоб ознайомитися з каталогом команд і поведінкою.

Типові параметри слеш-команд:

- `ephemeral: true`

## Подробиці функцій

<AccordionGroup>
  <Accordion title="Теги відповіді та власні reply">
    Discord підтримує теги reply у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керуються через `channels.discord.replyToMode`:

    - `off` (типово)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне threading відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне власне посилання reply до першого вихідного повідомлення Discord у межах ходу.
    `batched` додає неявне власне посилання reply Discord лише тоді, коли
    вхідний хід був debounce-пакетом із кількох повідомлень. Це корисно,
    коли вам потрібні власні reply переважно для неоднозначних діалогів із
    раптовими серіями повідомлень, а не для кожного окремого ходу з одним повідомленням.

    ID повідомлень виводяться в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може передавати чернетки відповідей у потоковому режимі, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту.

    - `channels.discord.streaming` керує потоковим попереднім переглядом (`off` | `partial` | `block` | `progress`, типово: `off`).
    - Типовим значенням залишається `off`, оскільки редагування попереднього перегляду в Discord може швидко впиратися в ліміти частоти, особливо коли кілька ботів або шлюзів спільно використовують один обліковий запис чи трафік сервера.
    - `progress` приймається для узгодженості між каналами й у Discord зіставляється з `partial`.
    - `channels.discord.streamMode` є застарілим псевдонімом і мігрує автоматично.
    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk` для налаштування розміру та точок розриву).
    - `streaming.preview.toolProgress` керує тим, чи оновлення інструментів/прогресу повторно використовують те саме повідомлення попереднього перегляду чернетки (типово: `true`). Установіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.

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

    Типові значення фрагментації режиму `block` (обмежуються значенням `channels.discord.textChunkLimit`):

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

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки.

    Примітка: потоковий попередній перегляд відокремлений від потокової передачі блоків. Коли потокова передача блоків явно
    ввімкнена для Discord, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної потокової передачі.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка тредів">
    Контекст історії серверів:

    - `channels.discord.historyLimit` типово `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка тредів:

    - треди Discord маршрутизуються як сесії каналів
    - метадані батьківського треду можуть використовуватися для зв’язування з батьківською сесією
    - конфігурація треду успадковує конфігурацію батьківського каналу, якщо немає окремого запису для треду

    Теми каналів додаються як **ненадійний** контекст (а не як system prompt).
    Контекст reply і цитованих повідомлень наразі залишається таким, як був отриманий.
    Allowlist у Discord насамперед обмежують, хто може запускати агента, а не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Прив’язані до тредів сесії для субагентів">
    Discord може прив’язати тред до цілі сесії, щоб наступні повідомлення в цьому треді й надалі маршрутизувалися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язує поточний/новий тред до цілі субагента/сесії
    - `/unfocus` видаляє поточну прив’язку треду
    - `/agents` показує активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглядає/оновлює автоматичне зняття фокуса через неактивність для прив’язок у фокусі
    - `/session max-age <duration|off>` переглядає/оновлює жорсткий максимальний вік для прив’язок у фокусі

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
        spawnSubagentSessions: false, // увімкнення за потреби
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні типові значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати треди для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати треди для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки тредів вимкнені для облікового запису, `/focus` і пов’язані операції прив’язки тредів недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Довідник із конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних «постійно активних» робочих просторів ACP налаштуйте типізовані прив’язки ACP верхнього рівня, націлені на розмови в Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або тред Discord на місці та зберігає маршрутизацію майбутніх повідомлень до тієї самої ACP-сесії.
    - Це все ще може означати «запустити нову ACP-сесію Codex», але саме по собі не створює новий тред Discord. Наявний канал залишається поверхнею чату.
    - Codex усе ще може працювати у власному `cwd` або робочому просторі бекенда на диску. Цей робочий простір є станом середовища виконання, а не тредом Discord.
    - Повідомлення треду можуть успадковувати ACP-прив’язку батьківського каналу.
    - У прив’язаному каналі або треді `/new` і `/reset` скидають ту саму ACP-сесію на місці.
    - Тимчасові прив’язки тредів усе ще працюють і можуть перевизначати визначення цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній тред через `--thread auto|here`. Він не потрібен для `/acp spawn ... --bind here` у поточному каналі.

    Див. [ACP Agents](/uk/tools/acp-agents), щоб дізнатися подробиці про поведінку прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожного сервера:

    - `off`
    - `own` (типово)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованої Discord-сесії.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервне значення емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви користувацьких емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані з каналу, типово ввімкнені.

    Це впливає на потоки `/config set|unset` (коли функції команд увімкнені).

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

  <Accordion title="Проксі Gateway">
    Маршрутизуйте трафік WebSocket шлюзу Discord і стартові REST-запити (ID застосунку + визначення allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
        token: "pk_live_...", // необов’язково; потрібно для приватних систем
      },
    },
  },
}
```

    Примітки:

    - allowlist можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID початкового повідомлення й обмежуються часовим вікном
    - якщо пошук не вдався, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо не задано `allowBots=true`

  </Accordion>

  <Accordion title="Налаштування присутності">
    Оновлення присутності застосовуються, коли ви задаєте поле статусу або активності, або коли вмикаєте автоматичну присутність.

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

    Приклад активності (користувацький статус є типовим типом активності):

```json5
{
  channels: {
    discord: {
      activity: "Час фокусування",
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
      activity: "Кодування наживо",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Мапа типів активності:

    - 0: Playing
    - 1: Streaming (потрібен `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (використовує текст активності як стан статусу; емодзі необов’язкове)
    - 5: Competing

    Приклад автоматичної присутності (сигнал працездатності середовища виконання):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "токен вичерпано",
      },
    },
  },
}
```

    Автоматична присутність зіставляє доступність середовища виконання зі статусом Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Підтвердження в Discord">
    Discord підтримує обробку підтверджень на основі кнопок у приватних повідомленнях і за потреби може публікувати запити на підтвердження в каналі походження.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовується резервне значення з `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає власні exec-підтвердження, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного затверджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не визначає exec-затверджувачів із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` приватних повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як власний клієнт підтвердження.

    Коли `target` має значення `channel` або `both`, запит на підтвердження видимий у каналі. Лише визначені затверджувачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на підтвердження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw повертається до доставки через приватні повідомлення.

    Discord також відтворює спільні кнопки підтвердження, які використовуються іншими чат-каналами. Власний адаптер Discord головно додає маршрутизацію підтверджень затверджувачам у приватні повідомлення та fanout у канали.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що чат-підтвердження недоступні або єдиним шляхом є ручне підтвердження.

    Авторизація Gateway для цього обробника використовує той самий спільний контракт визначення облікових даних, що й інші клієнти Gateway:

    - локальна авторизація env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, потім `gateway.auth.*`)
    - у локальному режимі `gateway.remote.*` можуть використовуватися як резервне значення лише коли `gateway.auth.*` не задано; налаштовані, але не визначені локальні SecretRef завершуються в закритому режимі
    - підтримка віддаленого режиму через `gateway.remote.*`, коли застосовно
    - перевизначення URL безпечні щодо перевизначень: перевизначення CLI не повторно використовують неявні облікові дані, а перевизначення env використовують лише облікові дані env

    Поведінка визначення підтверджень:

    - ID з префіксом `plugin:` визначаються через `plugin.approval.resolve`.
    - Інші ID визначаються через `exec.approval.resolve`.
    - Discord тут не виконує додатковий резервний перехід exec-to-plugin; префікс
      id визначає, який метод gateway буде викликано.

    Термін дії exec-підтверджень типово спливає через 30 хвилин. Якщо підтвердження завершуються помилкою з
    невідомими ID підтвердження, перевірте визначення затверджувачів, увімкнення функції та
    чи збігається тип доставленого id підтвердження з очікуваним запитом.

    Пов’язана документація: [Exec approvals](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файла), щоб задати обкладинку запланованої події.

Шлюзи дій знаходяться в `channels.discord.actions.*`.

Типова поведінка шлюзів:

| Група дій                                                                                                                                                                | Типово   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Інтерфейс Components v2

OpenClaw використовує Discord components v2 для exec-підтверджень і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького інтерфейсу (розширено; потребує створення навантаження компонента через інструмент discord), тоді як застарілі `embeds` усе ще доступні, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, що використовується контейнерами компонентів Discord (hex).
- Задайте для кожного облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

- Увімкніть власні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот повинен мати дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте власну команду лише для Discord `/vc join|leave|status` для керування сесіями. Команда використовує типового агента облікового запису й дотримується тих самих правил allowlist і group policy, що й інші команди Discord.

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

- `voice.tts` перевизначає `messages.tts` лише для відтворення голосу.
- Ходи розшифрування голосу визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад, `gateway` і `cron`).
- Голос типово ввімкнений; установіть `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` напряму передаються в параметри приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice`: `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- OpenClaw також відстежує збої розшифрування під час приймання й автоматично відновлюється, виходячи та повторно приєднуючись до голосового каналу після повторних збоїв за короткий проміжок часу.
- Якщо журнали приймання постійно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути помилка приймання `@discordjs/voice` на боці upstream, відстежувана в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми й потребують аудіо OGG/Opus разом із метаданими. OpenClaw генерує хвильову форму автоматично, але для цього на хості Gateway мають бути доступні `ffmpeg` і `ffprobe`, щоб аналізувати та конвертувати аудіофайли.

Вимоги й обмеження:

- Надайте **локальний шлях до файла** (URL відхиляються).
- Не додавайте текстовий вміст (Discord не дозволяє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

Приклад:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені інтенти або бот не бачить повідомлень сервера">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви покладаєтеся на визначення користувачів/учасників
    - перезапустіть gateway після зміни інтендів

  </Accordion>

  <Accordion title="Повідомлення сервера неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist серверів у `channels.discord.guilds`
    - якщо існує мапа `channels` сервера, дозволені лише канали зі списку
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
    - `requireMention` налаштовано не в тому місці (має бути під `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано allowlist `users` сервера/каналу

  </Accordion>

  <Accordion title="Довготривалі обробники завершуються за тайм-аутом або дублюють відповіді">

    Типові журнали:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Параметр бюджету listener:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Параметр тайм-ауту виконання worker:

    - один обліковий запис: `channels.discord.inboundWorker.runTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - типове значення: `1800000` (30 хвилин); установіть `0`, щоб вимкнути

    Рекомендоване базове значення:

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

    Використовуйте `eventQueue.listenerTimeout` для повільного налаштування listener і `inboundWorker.runTimeoutMs`
    лише якщо вам потрібен окремий запобіжник для чергових ходів агента.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення під час виконання все ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з приватними повідомленнями та підключенням">

    - приватні повідомлення вимкнено: `channels.discord.dm.enabled=false`
    - політику приватних повідомлень вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження підключення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    Типово повідомлення, створені ботом, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT втрачається з DecryptionFailed(...)">

    - підтримуйте OpenClaw в актуальному стані (`openclaw update`), щоб була наявна логіка відновлення приймання голосу Discord
    - переконайтеся, що `channels.discord.voice.daveEncryption=true` (типово)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (типове upstream-значення) і змінюйте лише за потреби
    - відстежуйте журнали на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали й порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Вказівники на довідник із конфігурації

Основний довідник:

- [Довідник із конфігурації - Discord](/uk/gateway/configuration-reference#discord)

Важливі поля Discord:

- запуск/авторизація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокова передача: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb`, `retry`
  - `mediaMaxMb` обмежує вихідні завантаження Discord (типово: `100MB`)
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- інтерфейс: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Безпека й експлуатація

- Розглядайте токени ботів як секрети (у контрольованих середовищах перевага за `DISCORD_BOT_TOKEN`).
- Надавайте Discord дозволи за принципом найменших привілеїв.
- Якщо розгортання/стан команди застаріли, перезапустіть gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Безпека](/uk/gateway/security)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
- [Слеш-команди](/uk/tools/slash-commands)
