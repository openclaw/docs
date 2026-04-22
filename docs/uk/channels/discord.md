---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-04-22T09:50:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 758846d22457ff66e28736a2e4c67c930ad4cd4dd5493b32afcc1912758fd540
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Статус: готовий для прямих повідомлень і каналів серверів через офіційний шлюз Discord.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Для Discord DM за замовчуванням використовується режим підключення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно буде створити новий застосунок із ботом, додати бота на свій сервер і підключити його до OpenClaw. Ми рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть Discord application і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ту назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані інтенти">
    Ще на сторінці **Bot** прокрутіть вниз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібне лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть назад угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається".
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть вниз до **OAuth2 URL Generator** і ввімкніть:

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в Discord threads, зокрема в процесах forum або media channels, які створюють або продовжують thread, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно увімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші по **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші по **власному аватару** → **Copy User ID**

    Збережіть **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три OpenClaw.

  </Step>

  <Step title="Дозвольте DM від учасників сервера">
    Щоб підключення працювало, Discord має дозволяти вашому боту надсилати вам DM. Клацніть правою кнопкою миші по **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам DM. Залиште це ввімкненим, якщо хочете використовувати Discord DM з OpenClaw. Якщо ви плануєте використовувати лише канали сервера, після підключення DM можна вимкнути.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чаті)">
    Токен вашого бота Discord — це секретні дані (як пароль). Задайте його на машині, де запущено OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw вже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте підключення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Напишіть своєму агенту OpenClaw у будь-якому вже наявному каналі (наприклад, Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже задав токен бота Discord у конфігурації. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви віддаєте перевагу конфігурації на основі файлу, задайте:

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

        Резервне значення env для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Підтримуються відкриті значення `token`. Також для `channels.discord.token` підтримуються значення SecretRef через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше підключення DM">
    Дочекайтеся, поки шлюз запуститься, а потім надішліть DM своєму боту в Discord. Він відповість кодом підключення.

    <Tabs>
      <Tab title="Запитайте свого агента">
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

    Коди підключення дійсні протягом 1 години.

    Тепер ви маєте мати змогу спілкуватися зі своїм агентом у Discord через DM.

  </Step>
</Steps>

<Note>
Визначення токена враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується для цього конкретного виклику. Це застосовується до дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису та налаштування повторних спроб і далі беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте простір роботи сервера

Коли DM вже працюють, ви можете налаштувати свій Discord server як повноцінний простір роботи, де кожен канал отримує окрему сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist серверів">
    Це дозволить вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в DM.

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
    За замовчуванням ваш агент відповідає в каналах сервера лише тоді, коли його згадують через @mention. Для приватного сервера вам, імовірно, потрібно, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без @mention"
      </Tab>
      <Tab title="Config">
        Задайте `requireMention: false` у конфігурації сервера:

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

  <Step title="Сплануйте використання пам’яті в каналах сервера">
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в DM-сесіях. У каналах сервера `MEMORY.md` автоматично не завантажується.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть сталі інструкції в `AGENTS.md` або `USER.md` (вони додаються до кожної сесії). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби через інструменти пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкування. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway керує підключенням до Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення з Discord повертаються назад у Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують головну сесію агента (`agent:main:main`).
- Канали сервера мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM ігноруються за замовчуванням (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизованої сесії розмови.

## Канали forum

Discord forum і media channels приймають лише публікації thread. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського forum (`channel:<forumId>`), щоб автоматично створити thread. Заголовок thread використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити thread напряму. Не передавайте `--message-id` для forum channels.

Приклад: надіслати до батьківського forum для створення thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити forum thread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські forum не приймають Discord components. Якщо вам потрібні components, надсилайте в сам thread (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує Discord components v2 containers для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодії маршрутизуються назад агенту як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Ряди дій дозволяють до 5 кнопок або одне select menu
- Типи select: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням components одноразові. Задайте `components.reusable=true`, щоб дозволити багаторазове використання buttons, selects і forms до завершення строку їх дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо це налаштовано, користувачі без збігу отримають ephemeral-відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками провайдера та моделі, а також кроком Submit. Відповідь вибору є ephemeral, і використовувати її може лише користувач, який викликав команду.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Передавайте вкладення через `media`/`path`/`filePath` (один файл); для кількох файлів використовуйте `media-gallery`
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` із максимум 5 полями
- Типи полів: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw автоматично додає кнопку запуску

Приклад:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Необов’язковий резервний текст",
  components: {
    reusable: true,
    text: "Оберіть шлях",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Підтвердити",
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
          placeholder: "Оберіть варіант",
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
        { type: "text", label: "Ініціатор" },
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
  <Tab title="Політика DM">
    `channels.discord.dmPolicy` керує доступом до DM (застаріле: `channels.discord.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (вимагає, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика DM не є open, невідомі користувачі блокуються (або отримують запит на підключення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Просто числові ID є неоднозначними й відхиляються, якщо явно не вказано тип цілі user/channel.

  </Tab>

  <Tab title="Політика сервера">
    Обробка серверів керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечний базовий режим, коли існує `channels.discord`, — це `allowlist`.

    Поведінка `allowlist`:

    - сервер має збігатися з `channels.discord.guilds` (перевага за `id`, slug також приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-яке з них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення за іменем/тегом вимкнене за замовчуванням; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
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

    Якщо ви лише задали `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, резервна поведінка runtime буде `groupPolicy="allowlist"` (з попередженням у логах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Згадки та group DM">
    Повідомлення сервера за замовчуванням вимагають згадки.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожного сервера/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (крім @everyone/@here).

    Group DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників сервера Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише для сервера. Якщо прив’язка також задає інші поля match (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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
  <Accordion title="Створіть застосунок і бота">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Скопіюйте токен бота

  </Accordion>

  <Accordion title="Привілейовані інтенти">
    У **Bot -> Privileged Gateway Intents** увімкніть:

    - Message Content Intent
    - Server Members Intent (рекомендовано)

    Presence intent є необов’язковим і потрібен лише якщо ви хочете отримувати оновлення присутності. Задання присутності бота (`setPresence`) не вимагає ввімкнення оновлень присутності для учасників.

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в Discord threads, зокрема в процесах forum або media channels, які створюють або продовжують thread, також увімкніть **Send Messages in Threads**.
    Уникайте `Administrator`, якщо в ньому немає явної потреби.

  </Accordion>

  <Accordion title="Скопіюйте ID">
    Увімкніть Discord Developer Mode, а потім скопіюйте:

    - ID сервера
    - ID каналу
    - ID користувача

    Для надійних аудитів і перевірок віддавайте перевагу числовим ID у конфігурації OpenClaw.

  </Accordion>
</AccordionGroup>

## Нативні команди й авторизація команд

- `commands.native` за замовчуванням має значення `"auto"` і увімкнене для Discord.
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в UI Discord для користувачів без авторизації; виконання все одно застосовує авторизацію OpenClaw і повертає "не авторизовано".

Див. [Слеш-команди](/uk/tools/slash-commands), щоб ознайомитися з каталогом команд і поведінкою.

Налаштування слеш-команд за замовчуванням:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Теги відповіді та нативні відповіді">
    Discord підтримує теги відповіді у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне об’єднання відповідей у гілки. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне нативне посилання відповіді до першого вихідного повідомлення Discord у межах ходу.
    `batched` додає неявне нативне посилання відповіді Discord лише тоді, коли
    вхідний хід був дебаунс-пакетом із кількох повідомлень. Це корисно,
    коли ви хочете використовувати нативні відповіді переважно для неоднозначних
    інтенсивних чатів, а не для кожного
    окремого повідомлення.

    ID повідомлень доступні в контексті/історії, тож агенти можуть націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд live stream">
    OpenClaw може потоково показувати чернетки відповідей, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту.

    - `channels.discord.streaming` керує потоковим попереднім переглядом (`off` | `partial` | `block` | `progress`, за замовчуванням: `off`).
    - За замовчуванням лишається `off`, оскільки редагування попереднього перегляду в Discord може швидко впиратися в ліміти швидкості, особливо коли кілька ботів або шлюзів використовують той самий обліковий запис чи трафік сервера.
    - `progress` приймається для узгодженості між каналами й у Discord відображається як `partial`.
    - `channels.discord.streamMode` — це застарілий псевдонім, який автоматично мігрується.
    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` виводить фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву).
    - Фінальні повідомлення з медіа, помилками й явними відповідями скасовують відкладені редагування попереднього перегляду без скидання тимчасової чернетки перед звичайною доставкою.
    - `streaming.preview.toolProgress` керує тим, чи повторно використовуватимуть оновлення інструментів/прогресу те саме чернеткове повідомлення попереднього перегляду (за замовчуванням: `true`). Установіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.

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

    Типові параметри фрагментації режиму `block` (обмежуються значенням `channels.discord.textChunkLimit`):

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

    Примітка: потоковий попередній перегляд відокремлений від block streaming. Коли для Discord явно
    увімкнено block streaming, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка thread">
    Контекст історії сервера:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка thread:

    - Discord threads маршрутизуються як сесії каналу
    - метадані батьківського thread можуть використовуватися для зв’язування з батьківською сесією
    - конфігурація thread успадковує конфігурацію батьківського каналу, якщо не існує окремого запису для thread

    Теми каналів додаються як **ненадійний** контекст (не як системний промпт).
    Контекст відповіді та цитованого повідомлення наразі зберігається таким, яким був отриманий.
    Discord allowlist насамперед обмежують, хто може активувати агента, а не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сесії, прив’язані до thread, для subagents">
    Discord може прив’язати thread до цілі сесії, щоб подальші повідомлення в цьому thread і далі маршрутизувалися до тієї самої сесії (зокрема сесій subagents).

    Команди:

    - `/focus <target>` прив’язати поточний/новий thread до цілі subagent/session
    - `/unfocus` видалити поточну прив’язку thread
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокуса через неактивність для прив’язок із фокусом
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для прив’язок із фокусом

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
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати threads для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати threads для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки thread вимкнені для облікового запису, `/focus` і пов’язані операції прив’язки thread недоступні.

    Див. [Sub-agents](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Configuration Reference](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні ACP-прив’язки каналів">
    Для стабільних ACP-просторів роботи "always-on" налаштуйте typed ACP bindings верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або thread Discord на місці й зберігає маршрутизацію майбутніх повідомлень до тієї самої ACP-сесії.
    - Це все ще може означати "запустити нову ACP-сесію Codex", але саме по собі не створює новий thread у Discord. Наявний канал лишається поверхнею чату.
    - Codex усе ще може працювати у власному `cwd` або workspace backend на диску. Цей workspace є станом runtime, а не thread у Discord.
    - Повідомлення thread можуть успадковувати ACP-прив’язку батьківського каналу.
    - У прив’язаному каналі або thread команди `/new` і `/reset` скидають ту саму ACP-сесію на місці.
    - Тимчасові прив’язки thread усе ще працюють і можуть перевизначати визначення цілі, доки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній thread через `--thread auto|here`. Він не потрібен для `/acp spawn ... --bind here` у поточному каналі.

    Див. [ACP Agents](/uk/tools/acp-agents), щоб дізнатися подробиці поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожного сервера:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події й додаються до маршрутизованої Discord-сесії.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервне emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode emoji або назви custom emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Запис у конфігурацію">
    Запис у конфігурацію, ініційований із каналу, увімкнений за замовчуванням.

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

  <Accordion title="Gateway proxy">
    Маршрутизуйте WebSocket-трафік Discord gateway і стартові REST-запити (application ID + визначення allowlist) через HTTP(S) proxy за допомогою `channels.discord.proxy`.

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

    - allowlist може використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за name/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошук використовує ID оригінального повідомлення й обмежений часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо не задано `allowBots=true`

  </Accordion>

  <Accordion title="Налаштування присутності">
    Оновлення присутності застосовуються, коли ви задаєте поле статусу або активності, або коли вмикаєте auto presence.

    Приклад лише статусу:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Приклад активності (custom status — тип активності за замовчуванням):

```json5
{
  channels: {
    discord: {
      activity: "Час для фокусування",
      activityType: 4,
    },
  },
}
```

    Приклад streaming:

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

    Приклад auto presence (сигнал стану runtime):

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

    Auto presence відображає доступність runtime у статус Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Підтвердження в Discord">
    Discord підтримує обробку підтверджень через кнопки в DM і за потреби може публікувати запити на підтвердження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовує резервне значення `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні exec approvals, коли `enabled` не задано або має значення `"auto"` і принаймні одного approver можна визначити або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не визначає exec approvers із channel `allowFrom`, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт підтверджень.

    Коли `target` має значення `channel` або `both`, запит на підтвердження видимий у каналі. Лише визначені approvers можуть використовувати кнопки; інші користувачі отримують ephemeral-відмову. Запити на підтвердження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки підтвердження, які використовуються іншими чат-каналами. Нативний адаптер Discord головним чином додає DM-маршрутизацію для approver і fanout у канал.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента повідомляє,
    що підтвердження в чаті недоступні або ручне підтвердження — єдиний шлях.

    Gateway auth для цього обробника використовує той самий спільний контракт визначення облікових даних, що й інші клієнти Gateway:

    - локальна auth з пріоритетом env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, потім `gateway.auth.*`)
    - у локальному режимі `gateway.remote.*` може використовуватися як резервний варіант лише коли `gateway.auth.*` не задано; локальні SecretRef, які налаштовані, але не визначаються, завершуються за принципом fail closed
    - підтримка віддаленого режиму через `gateway.remote.*`, коли це застосовно
    - перевизначення URL безпечні щодо перевизначень: перевизначення CLI не повторно використовують неявні облікові дані, а перевизначення env використовують лише облікові дані env

    Поведінка визначення підтверджень:

    - ID з префіксом `plugin:` визначаються через `plugin.approval.resolve`.
    - Інші ID визначаються через `exec.approval.resolve`.
    - Discord не робить тут додаткового резервного переходу exec-to-plugin; префікс id
      визначає, який метод gateway він викликає.

    Термін дії exec approvals за замовчуванням спливає через 30 хвилин. Якщо підтвердження не працюють через
    невідомі ID підтверджень, перевірте визначення approver, увімкнення функції і
    що тип доставленого id підтвердження відповідає очікуваному запиту.

    Пов’язана документація: [Exec approvals](/uk/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Інструменти та обмеження дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файлу), щоб задати обкладинку запланованої події.

Обмеження дій містяться в `channels.discord.actions.*`.

Поведінка обмежень за замовчуванням:

| Група дій                                                                                                                                                                | Значення за замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено                 |
| roles                                                                                                                                                                    | вимкнено                  |
| moderation                                                                                                                                                               | вимкнено                  |
| presence                                                                                                                                                                 | вимкнено                  |

## UI components v2

OpenClaw використовує Discord components v2 для exec approvals і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для custom UI (розширено; потребує побудови payload компонента через інструмент discord), тоді як застарілі `embeds` лишаються доступними, але не рекомендуються.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовується контейнерами компонентів Discord (hex).
- Задайте для окремого облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

OpenClaw може приєднуватися до голосових каналів Discord для realtime, безперервних розмов. Це окремо від вкладень голосових повідомлень.

Вимоги:

- Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот повинен мати дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте нативну команду лише для Discord `/vc join|leave|status` для керування сесіями. Команда використовує агента облікового запису за замовчуванням і дотримується тих самих правил allowlist і group policy, що й інші команди Discord.

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
- Ходи транскрипції голосу визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад, `gateway` і `cron`).
- Голос увімкнено за замовчуванням; задайте `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` напряму передаються в параметри приєднання `@discordjs/voice`.
- Значення `@discordjs/voice` за замовчуванням — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- OpenClaw також відстежує помилки розшифрування під час отримання й автоматично відновлюється, виходячи та повторно приєднуючись до голосового каналу після повторних помилок за короткий проміжок часу.
- Якщо в журналах отримання постійно з’являється `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути висхідною помилкою отримання `@discordjs/voice`, відстежуваною в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд waveform і потребують аудіо OGG/Opus плюс метадані. OpenClaw генерує waveform автоматично, але для перевірки та конвертації аудіофайлів на хості gateway мають бути доступні `ffmpeg` і `ffprobe`.

Вимоги й обмеження:

- Передавайте **шлях до локального файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord не дозволяє текст + голосове повідомлення в одному payload).
- Підтримується будь-який аудіоформат; OpenClaw конвертує в OGG/Opus за потреби.

Приклад:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені інтенти або бот не бачить повідомлень сервера">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від визначення користувачів/учасників
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення сервера неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist сервера в `channels.discord.guilds`
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
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано allowlist `users` сервера/каналу

  </Accordion>

  <Accordion title="Обробники з довгим виконанням завершуються за таймаутом або дублюють відповіді">

    Типові журнали:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Параметр бюджету listener:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Параметр таймауту виконання worker:

    - один обліковий запис: `channels.discord.inboundWorker.runTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - за замовчуванням: `1800000` (30 хвилин); задайте `0`, щоб вимкнути

    Рекомендований базовий варіант:

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
    лише якщо вам потрібен окремий запобіжний механізм для поставлених у чергу ходів агента.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення під час runtime все ще може працювати, але probe не зможе повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і підключенням">

    - DM вимкнені: `channels.discord.dm.enabled=false`
    - політика DM вимкнена: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження підключення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви задаєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT обривається з DecryptionFailed(...)">

    - підтримуйте актуальність OpenClaw (`openclaw update`), щоб була присутня логіка відновлення отримання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (висхідне значення за замовчуванням) і налаштовуйте лише за потреби
    - стежте за журналами:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

Основний довідник:

- [Configuration reference - Discord](/uk/gateway/configuration-reference#discord)

Ключові поля Discord:

- запуск/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` обмежує вихідні завантаження Discord (за замовчуванням: `100MB`)
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Безпека й експлуатація

- Розглядайте токени ботів як секрети (`DISCORD_BOT_TOKEN` є бажаним у середовищах із наглядом).
- Надавайте Discord мінімально необхідні дозволи.
- Якщо розгортання/стан команд застаріли, перезапустіть gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Безпека](/uk/gateway/security)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення проблем](/uk/channels/troubleshooting)
- [Слеш-команди](/uk/tools/slash-commands)
