---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та налаштування
title: Discord
x-i18n:
    generated_at: "2026-04-24T17:24:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: df5d215c6a6c43e1b3f60837752f60eafc6e34c1ffd4aaceb2f60d4dd3c130be
    source_path: channels/discord.md
    workflow: 15
---

Готово для приватних повідомлень і каналів серверів через офіційний Gateway Discord.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Discord за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і сполучити його з OpenClaw. Ми рекомендуємо додати бота до вашого власного приватного сервера. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    На бічній панелі натисніть **Bot**. Установіть **Username** на ту назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Усе ще на сторінці **Bot** прокрутіть до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імені з ID)
    - **Presence Intent** (необов’язково; потрібне лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен свого бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL-запрошення й додайте бота на свій сервер">
    На бічній панелі натисніть **OAuth2**. Ви згенеруєте URL-запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть до **OAuth2 URL Generator** і увімкніть:

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в тредах Discord, зокрема в процесах форумних або медіаканалів, які створюють або продовжують тред, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue** для підключення. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно увімкнути Developer Mode, щоб мати змогу копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші **значок сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші свій **аватар** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три значення в OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб сполучення працювало, Discord має дозволяти вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші **значок сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам приватні повідомлення. Залиште це ввімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали сервера, після сполучення можна вимкнути приватні повідомлення.

  </Step>

  <Step title="Безпечно встановіть токен свого бота (не надсилайте його в чат)">
    Токен вашого бота Discord — це секрет (як пароль). Установіть його на машині, де працює OpenClaw, перш ніж надсилати повідомлення агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте сполучення">

    <Tabs>
      <Tab title="Попросіть свого агента">
        Напишіть своєму агенту OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і скажіть йому це. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже встановив токен свого Discord-бота в config. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
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

        Резервне env-значення для стандартного облікового запису:

```bash
DISCORD_BOT_TOKEN=...
```

        Підтримуються plaintext-значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` у провайдерах env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Схваліть перше сполучення в приватних повідомленнях">
    Дочекайтеся, поки Gateway запуститься, а потім напишіть боту в приватні повідомлення в Discord. У відповідь він надішле код сполучення.

    <Tabs>
      <Tab title="Попросіть свого агента">
        Надішліть код сполучення своєму агенту в наявному каналі:

        > "Схвали цей код сполучення Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Термін дії кодів сполучення закінчується через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через приватні повідомлення.

  </Step>
</Steps>

<Note>
Визначення токена враховує обліковий запис. Значення токена в config мають пріоритет над резервним env-значенням. `DISCORD_BOT_TOKEN` використовується лише для стандартного облікового запису.
Для розширених вихідних викликів (дії інструмента повідомлень/каналу) явний `token` використовується для цього конкретного виклику. Це стосується дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису/повторних спроб усе ще надходить із вибраного облікового запису в активному runtime snapshot.
</Note>

## Рекомендовано: налаштуйте робочий простір сервера

Коли приватні повідомлення вже працюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує окрему сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist серверів">
    Це дозволяє вашому агенту відповідати в будь-якому каналі вашого сервера, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Додай мій Server ID Discord `<server_id>` до allowlist серверів"
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
      <Tab title="Попросіть свого агента">
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

  <Step title="Сплануйте використання пам’яті в каналах сервера">
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в сесіях приватних повідомлень. У каналах сервера `MEMORY.md` не завантажується автоматично.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, розмістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони додаються до кожної сесії). Довготривалі нотатки зберігайте в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкуватися. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що інше, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway керує підключенням до Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення Discord отримують відповіді назад у Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують спільну головну сесію агента (`agent:main:main`).
- Канали сервера мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові приватні повідомлення за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих сесіях команд (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизованої сесії розмови.

## Форумні канали

Форумні та медіаканали Discord приймають лише публікації в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити тред. Заголовок треду використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити тред безпосередньо. Не передавайте `--message-id` для форумних каналів.

Приклад: надсилання до батьківського форуму для створення треду

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явне створення форумного треду

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте повідомлення в сам тред (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, списків вибору та форм до закінчення строку їх дії.

Щоб обмежити, хто може натискати кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо це налаштовано, користувачі, які не відповідають умові, отримають ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний вибір моделі зі списками провайдера й моделі та кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь засобу вибору є ефемерною, і лише користувач, який викликав команду, може нею користуватися.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); для кількох файлів використовуйте `media-gallery`
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має відповідати посиланню вкладення

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

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика приватних повідомлень">
    `channels.discord.dmPolicy` керує доступом до приватних повідомлень (застаріле: `channels.discord.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика приватних повідомлень не є open, невідомі користувачі блокуються (або отримують запит на сполучення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат DM-цілі для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Числові ID без префікса є неоднозначними й відхиляються, якщо явно не вказано тип цілі user/channel.

  </Tab>

  <Tab title="Політика серверів">
    Обробка серверів керується `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечне базове значення, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - сервер має відповідати `channels.discord.guilds` (перевага надається `id`, slug приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення за іменем/тегом вимкнене за замовчуванням; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для сервера налаштовано `channels`, канали поза списком відхиляються
    - якщо для сервера немає блока `channels`, дозволяються всі канали в цьому сервері з allowlist

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

    Якщо ви лише встановили `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, резервне значення runtime буде `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки та групові приватні повідомлення">
    Повідомлення на сервері за замовчуванням вимагають згадки.

    Визначення згадки включає:

    - явну згадку бота
    - налаштовані шаблони згадки (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожного сервера/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (крім @everyone/@here).

    Групові приватні повідомлення:

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

## Нативні команди та авторизація команд

- `commands.native` за замовчуванням має значення `"auto"` і увімкнено для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не авторизовані; виконання все одно застосовує авторизацію OpenClaw і повертає "не авторизовано".

Див. [Слеш-команди](/uk/tools/slash-commands), щоб переглянути каталог команд і поведінку.

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

    Примітка: `off` вимикає неявне впорядкування відповідей у треді. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord у межах ходу.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був дебаунс-пакетом із кількох повідомлень. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних чатів зі сплесками, а не для кожного
    окремого ходу з одним повідомленням.

    ID повідомлень додаються до context/history, щоб агенти могли орієнтуватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд live stream">
    OpenClaw може потоково передавати чернетки відповідей, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` у Discord відображається як `partial`; `streamMode` є застарілим псевдонімом і автоматично мігрується.

    За замовчуванням лишається `off`, тому що редагування попереднього перегляду в Discord швидко впирається в обмеження частоти, коли кілька ботів або Gateway спільно використовують один обліковий запис.

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
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, обмежені до `textChunkLimit`).
    - Підсумкові повідомлення з медіа, помилками та явними відповідями скасовують усі очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли явно ввімкнено потоковий режим `block`, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка тредів">
    Контекст історії сервера:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка тредів:

    - Треди Discord маршрутизуються як сесії каналів і успадковують конфігурацію батьківського каналу, якщо не перевизначено інше.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) дозволяє новим автотредам ініціалізуватися з батьківського транскрипту. Перевизначення для окремих облікових записів містяться в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть визначати DM-цілі `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів додаються як **ненадійний** контекст. Allowlist визначають, хто може запускати агента, але не є повноцінною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сесії, прив’язані до тредів, для субагентів">
    Discord може прив’язувати тред до цілі сесії, щоб подальші повідомлення в цьому треді й надалі маршрутизувалися до тієї самої сесії (зокрема до сесій субагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий тред до цілі субагента/сесії
    - `/unfocus` видалити поточну прив’язку треду
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокусу через неактивність для сфокусованих прив’язок
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
        spawnSubagentSessions: false, // увімкнення за бажанням
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні значення за замовчуванням.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати треди для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати треди для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки тредів вимкнено для облікового запису, `/focus` та пов’язані операції прив’язки тредів недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Configuration Reference](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних ACP-робочих просторів «always-on» налаштуйте типізовані ACP-прив’язки верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або тред на місці й зберігає майбутні повідомлення в тій самій ACP-сесії. Повідомлення в треді успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або треді `/new` і `/reset` скидають ту саму ACP-сесію на місці. Тимчасові прив’язки тредів можуть перевизначати визначення цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній тред через `--thread auto|here`.

    Див. [ACP Agents](/uk/tools/acp-agents), щоб ознайомитися з деталями поведінки прив’язок.

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
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервне значення емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви користувацьких емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи в config">
    Записи в config, ініційовані з каналу, увімкнені за замовчуванням.

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
    Маршрутизуйте WebSocket-трафік Gateway Discord і стартові REST-запити (ID застосунку + визначення allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
        token: "pk_live_...", // необов’язково; потрібен для приватних систем
      },
    },
  },
}
```

    Примітки:

    - allowlist можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошук використовує ID оригінального повідомлення й обмежується часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо тільки `allowBots=true`

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
        exhaustedText: "токен вичерпано",
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
    Discord підтримує обробку погоджень за допомогою кнопок у приватних повідомленнях і за бажанням може публікувати запити на погодження в каналі походження.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовується резервне значення `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні exec-погодження, коли `enabled` не задано або має значення `"auto"` і принаймні одного погоджувача можна визначити або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не визначає exec-погоджувачів із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Установіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт погодження.

    Коли `target` має значення `channel` або `both`, запит на погодження видно в каналі. Лише визначені погоджувачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на погодження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw використовує резервну доставку через DM.

    Discord також відображає спільні кнопки погодження, які використовуються іншими чат-каналами. Нативний адаптер Discord головним чином додає маршрутизацію DM для погоджувачів і fanout у канали.
    Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що погодження через чат недоступні або ручне погодження — єдиний шлях.

    Авторизація Gateway і визначення погодження відповідають спільному клієнтському контракту Gateway (`plugin:` ID визначаються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). За замовчуванням термін дії погоджень спливає через 30 хвилин.

    Див. [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та обмеження дій

Дії з повідомленнями Discord включають обмін повідомленнями, адміністрування каналів, модерацію, статус присутності та дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- статус присутності: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файла) для встановлення обкладинки запланованої події.

Обмеження дій розташовані в `channels.discord.actions.*`.

Поведінка обмежень за замовчуванням:

| Група дій                                                                                                                                                                | Значення за замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено                 |
| roles                                                                                                                                                                    | вимкнено                  |
| moderation                                                                                                                                                               | вимкнено                  |
| presence                                                                                                                                                                 | вимкнено                  |

## Інтерфейс Components v2

OpenClaw використовує Discord components v2 для exec-погоджень і маркерів між контекстами. Дії з повідомленнями Discord також можуть приймати `components` для користувацького інтерфейсу (розширено; потребує побудови payload компонентів через інструмент Discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендуються.

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

## Голос

У Discord є дві окремі голосові поверхні: голосові канали realtime (**voice channels**) (безперервні розмови) і вкладення голосових повідомлень (**voice message attachments**) (формат із попереднім переглядом waveform). Gateway підтримує обидва варіанти.

### Голосові канали

Вимоги:

- Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот потребує дозволів Connect + Speak у цільовому голосовому каналі.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує стандартного агента облікового запису й дотримується тих самих правил allowlist і group policy, що й інші команди Discord.

Приклад автоматичного підключення:

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
- Для ходів транскрипції голосу статус власника визначається з Discord `allowFrom` (або `dm.allowFrom`); користувачі без статусу власника не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос увімкнено за замовчуванням; установіть `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів підключення `@discordjs/voice`.
- Значення за замовчуванням `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- OpenClaw також відстежує помилки дешифрування під час прийому й автоматично відновлюється, виходячи з голосового каналу та повторно приєднуючись після повторних помилок у короткому часовому вікні.
- Якщо журнали прийому неодноразово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути помилка прийому upstream `@discordjs/voice`, описана в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд waveform і вимагають аудіо OGG/Opus. OpenClaw генерує waveform автоматично, але потребує `ffmpeg` і `ffprobe` на хості Gateway для аналізу та конвертації.

- Надайте **шлях до локального файла** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Підтримується будь-який аудіоформат; OpenClaw за потреби конвертує в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень сервера">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви покладаєтеся на визначення користувача/учасника
    - перезапустіть Gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення сервера неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist серверів у `channels.discord.guilds`
    - якщо існує мапа `channels` сервера, дозволяються лише канали зі списку
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="require mention false, але все одно блокується">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного allowlist сервера/каналу
    - `requireMention` налаштовано в неправильному місці (має бути в `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано allowlist `users` сервера/каналу

  </Accordion>

  <Accordion title="Обробники з тривалим виконанням завершуються за тайм-аутом або дублюють відповіді">

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
    - за замовчуванням: `1800000` (30 хвилин); установіть `0`, щоб вимкнути

    Рекомендоване базове налаштування:

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

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення в runtime все одно може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з приватними повідомленнями та сполученням">

    - приватні повідомлення вимкнено: `channels.discord.dm.enabled=false`
    - політику приватних повідомлень вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT пропускає дані з DecryptionFailed(...)">

    - підтримуйте актуальну версію OpenClaw (`openclaw update`), щоб логіка відновлення отримання голосу Discord була доступна
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (значення upstream за замовчуванням) і змінюйте лише за потреби
    - стежте за журналами:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо помилки тривають після автоматичного повторного підключення, зберіть журнали й порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основний довідник: [Configuration reference - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Ключові поля Discord">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb` (обмежує вихідні завантаження Discord, за замовчуванням `100MB`), `retry`
- дії: `actions.*`
- статус присутності: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та експлуатація

- Розглядайте токени ботів як секрети (у контрольованих середовищах бажано використовувати `DISCORD_BOT_TOKEN`).
- Надавайте дозволи Discord за принципом найменших привілеїв.
- Якщо розгортання/стан команд застарів, перезапустіть Gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групового чату та allowlist.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте сервери та канали з агентами.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
