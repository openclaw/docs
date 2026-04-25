---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки Discord бота, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-04-25T00:01:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 349f82e96e17aad30e4dc28c25d06841121f37b35c367f13f52cd0700105bd11
    source_path: channels/discord.md
    workflow: 15
---

Готово для особистих повідомлень і каналів гільдії через офіційний Gateway Discord.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Discord типово працюють у режимі підключення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Власна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і підключити його до OpenClaw. Ми рекомендуємо додати бота на ваш власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок і бота Discord">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ту назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані наміри">
    Досі на сторінці **Bot**, прокрутіть до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імені з ID)
    - **Presence Intent** (необов’язково; потрібне лише для оновлень статусу)

  </Step>

  <Step title="Скопіюйте токен вашого бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він вам скоро знадобиться.

  </Step>

  <Step title="Створіть URL-запрошення і додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL-запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть до **OAuth2 URL Generator** і ввімкніть:

    - `bot`
    - `applications.commands`

    Унизу з’явиться розділ **Bot Permissions**. Увімкніть щонайменше:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в тредах Discord, зокрема в процесах форумних або медіаканалів, які створюють або продовжують тред, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно ввімкнути Developer Mode, щоб мати змогу копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші на **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші на **своєму аватарі** → **Copy User ID**

    Збережіть свій **Server ID** і **User ID** разом із Bot Token — ви надішлете всі три до OpenClaw на наступному кроці.

  </Step>

  <Step title="Дозвольте особисті повідомлення від учасників сервера">
    Щоб підключення працювало, Discord має дозволяти вашому боту надсилати вам особисті повідомлення. Клацніть правою кнопкою миші на **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам особисті повідомлення. Залиште це ввімкненим, якщо хочете використовувати особисті повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, можете вимкнути особисті повідомлення після підключення.

  </Step>

  <Step title="Безпечно встановіть токен бота (не надсилайте його в чаті)">
    Токен вашого бота Discord — це секрет (як пароль). Установіть його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте підключення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Напишіть своєму агенту OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, замість цього використайте вкладку CLI / config.

        > "Я вже встановив токен свого Discord бота в конфігурації. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви віддаєте перевагу файловій конфігурації, встановіть:

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

        Підтримуються прості текстові значення `token`. Також підтримуються значення SecretRef для `channels.discord.token` у постачальниках env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше підключення в особистих повідомленнях">
    Дочекайтеся, поки Gateway запуститься, а потім напишіть своєму боту в Discord. Він відповість кодом підключення.

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

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через особисті повідомлення.

  </Step>
</Steps>

<Note>
Визначення токена враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується для цього конкретного виклику. Це стосується дій надсилання та дій читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Параметри політики облікового запису/повторних спроб і надалі беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: Налаштуйте робочий простір гільдії

Щойно особисті повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist гільдії">
    Це дає змогу вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в особистих повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Server ID Discord `<server_id>` до allowlist гільдії"
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
    За замовчуванням ваш агент відповідає в каналах гільдії лише тоді, коли його згадують через @mention. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без потреби в @mention"
      </Tab>
      <Tab title="Config">
        Установіть `requireMention: false` у конфігурації вашої гільдії:

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
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в сесіях особистих повідомлень. У каналах гільдії `MEMORY.md` автоматично не завантажується.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони додаються до кожної сесії). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби через інструменти пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкування. Ваш агент бачить назву каналу, а кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway керує підключенням до Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення з Discord повертаються в Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують головну сесію агента (`agent:main:main`).
- Канали гільдії мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові особисті повідомлення типово ігноруються (`channels.discord.dm.groupEnabled=false`).
- Власні слеш-команди працюють в ізольованих сесіях команд (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизованої сесії розмови.

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

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із навантаженням `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення та відповідають наявним налаштуванням Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, списків вибору та форм, доки не сплине строк їх дії.

Щоб обмежити, хто може натиснути кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо це налаштовано, користувачі, які не відповідають умовам, отримають тимчасову відмову, видиму лише їм.

Слеш-команди `/model` і `/models` відкривають інтерактивний засіб вибору моделі з випадаючими списками постачальника, моделі та сумісних runtime, а також із кроком Submit. `/models add` застаріла і тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь засобу вибору є тимчасовою, видимою лише користувачу, який викликав її, і лише він може нею користуватися.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Передайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має відповідати посиланню вкладення

Модальні форми:

- Додайте `components.modal` з до 5 полями
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
  <Tab title="Політика DM">
    `channels.discord.dmPolicy` керує доступом до DM (застаріле: `channels.discord.dm.policy`):

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика DM не є open, невідомі користувачі блокуються (або отримують запит на підключення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат DM-цілі для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Числові ID без префікса неоднозначні й відхиляються, якщо явно не вказано тип цілі користувача/каналу.

  </Tab>

  <Tab title="Політика гільдії">
    Обробкою гільдії керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечне базове значення, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (перевага надається `id`, також приймається slug)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення за ім’ям/тегом типово вимкнене; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - для `users` підтримуються імена/теги, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо для гільдії налаштовано `channels`, канали, яких немає в списку, забороняються
    - якщо гільдія не має блоку `channels`, дозволяються всі канали в цій гільдії з allowlist

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

    Якщо ви лише встановите `DISCORD_BOT_TOKEN` і не створите блок `channels.discord`, резервним значенням runtime буде `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки і групові DM">
    Повідомлення гільдії типово вимагають згадки.

    Визначення згадки включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові DM:

    - типово: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агента за ролями

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки за ролями приймають лише ID ролей і перевіряються після прив’язок peer або parent-peer та перед прив’язками лише для гільдії. Якщо прив’язка також задає інші поля match (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

## Власні команди та авторизація команд

- `commands.native` типово має значення `"auto"` і ввімкнене для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані власні команди Discord.
- Авторизація власних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не авторизовані; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Слеш-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Типові налаштування слеш-команд:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Теги відповіді та власні відповіді">
    Discord підтримує теги відповіді у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Це керується через `channels.discord.replyToMode`:

    - `off` (типово)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне розгалуження відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання власної відповіді до першого вихідного повідомлення Discord для цього ходу.
    `batched` додає неявне посилання власної відповіді Discord лише тоді, коли
    вхідний хід був відкладеним пакетом із кількох повідомлень. Це корисно,
    коли ви хочете використовувати власні відповіді переважно для неоднозначних
    чатів зі сплесками повідомлень, а не для кожного окремого повідомлення.

    ID повідомлень доступні в контексті/історії, тому агенти можуть націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може передавати чернетки відповідей потоком, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (типово) | `partial` | `block` | `progress`. `progress` відображається як `partial` у Discord; `streamMode` — це застарілий псевдонім, який автоматично мігрується.

    Типовим залишається `off`, оскільки редагування попереднього перегляду в Discord швидко впирається в обмеження частоти, коли кілька ботів або Gateway використовують спільний обліковий запис.

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
    - `block` надсилає фрагменти розміром із чернетку (використовуйте `draftChunk` для налаштування розміру та точок розбиття, обмежених до `textChunkLimit`).
    - Остаточні повідомлення з медіа, помилкою та явною відповіддю скасовують відкладені редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (типово `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли потік `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потоку.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка тредів">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` типово `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка тредів:

    - Треди Discord маршрутизуються як сесії каналів і успадковують конфігурацію батьківського каналу, якщо не перевизначено інакше.
    - `channels.discord.thread.inheritParent` (типово `false`) дозволяє новим автоматичним тредам початково використовувати транскрипт батьківського каналу. Перевизначення для облікових записів розташовані в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть визначати DM-цілі `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів додаються як **недовірений** контекст. Allowlist визначають, хто може запускати агента, але не є повноцінною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сесії, прив’язані до тредів, для субагентів">
    Discord може прив’язати тред до цілі сесії, щоб наступні повідомлення в цьому треді й далі маршрутизувалися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язує поточний/новий тред до цілі субагента/сесії
    - `/unfocus` видаляє поточну прив’язку треду
    - `/agents` показує активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглядає/оновлює автоматичне зняття фокуса через неактивність для сфокусованих прив’язок
    - `/session max-age <duration|off>` переглядає/оновлює жорсткий максимальний вік для сфокусованих прив’язок

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

    - `session.threadBindings.*` задає глобальні типові значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати треди для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати треди для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки тредів вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки тредів недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Довідник із конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних ACP-робочих просторів "always-on" налаштуйте верхньорівневі типізовані прив’язки ACP, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або тред на місці й зберігає майбутні повідомлення в тій самій сесії ACP. Повідомлення тредів успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або треді `/new` і `/reset` скидають ту саму сесію ACP на місці. Тимчасові прив’язки тредів можуть перевизначати визначення цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній тред через `--thread auto|here`.

    Див. [ACP Agents](/uk/tools/acp-agents) для подробиць про поведінку прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожної гільдії:

    - `off`
    - `own` (типово)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованої сесії Discord.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний варіант емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви власних емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані з каналу, типово ввімкнені.

    Це впливає на процеси `/config set|unset` (коли функції команд увімкнені).

    Вимкнути:

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
    Маршрутизуйте трафік WebSocket Gateway Discord і стартові REST-запити (ID застосунку + визначення allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID вихідного повідомлення та обмежуються часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо не встановлено `allowBots=true`

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

    Приклад активності (типовий тип активності — власний статус):

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
    - 1: Streaming (потребує `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (використовує текст активності як стан статусу; емодзі необов’язкове)
    - 5: Competing

    Приклад автоматичної присутності (сигнал стану runtime):

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

    Автоматична присутність зіставляє доступність runtime зі статусом Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Погодження в Discord">
    Discord підтримує обробку погоджень за допомогою кнопок у DM і може за потреби публікувати запити на погодження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовує резервне значення `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає власні погодження exec, коли `enabled` не задано або дорівнює `"auto"` і можна визначити принаймні одного погоджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не визначає погоджувачів exec із канального `allowFrom`, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Установіть `enabled: false`, щоб явно вимкнути Discord як власний клієнт погоджень.

    Коли `target` має значення `channel` або `both`, запит на погодження видимий у каналі. Лише визначені погоджувачі можуть користуватися кнопками; інші користувачі отримують тимчасову відмову, видиму лише їм. Запити на погодження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки погодження, які використовують інші чат-канали. Власний адаптер Discord головно додає маршрутизацію DM для погоджувачів і fanout у канал.
    Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що погодження в чаті недоступні або ручне погодження є єдиним шляхом.

    Авторизація Gateway і визначення погодження дотримуються спільного контракту клієнта Gateway (`plugin:` ID визначаються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Типовий строк дії погоджень — 30 хвилин.

    Див. [Погодження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та обмеження дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файла), щоб установити зображення обкладинки запланованої події.

Обмеження дій розташовані в `channels.discord.actions.*`.

Типова поведінка обмежень:

| Група дій                                                                                                                                                                | Типово   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ввімкнено |
| roles                                                                                                                                                                    | вимкнено |
| moderation                                                                                                                                                               | вимкнено |
| presence                                                                                                                                                                 | вимкнено |

## UI компонентів v2

OpenClaw використовує компоненти Discord v2 для погоджень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для власного UI (розширено; потребує побудови навантаження компонента через інструмент discord), тоді як застарілі `embeds` і далі доступні, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Для окремого облікового запису встановлюється через `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` ігноруються, коли присутні компоненти v2.

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

У Discord є дві окремі голосові поверхні: голосові канали realtime (безперервні розмови) і вкладення голосових повідомлень (формат попереднього перегляду waveform). Gateway підтримує обидві.

### Голосові канали

Вимоги:

- Увімкніть власні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот має мати дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує типового агента облікового запису й дотримується тих самих правил allowlist і group policy, що й інші команди Discord.

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
- Ходи транскрипції голосу визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад, `gateway` і `cron`).
- Голос типово ввімкнений; установіть `channels.discord.voice.enabled=false`, щоб його вимкнути.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- OpenClaw також відстежує помилки розшифрування під час отримання й автоматично відновлюється, виходячи та повторно приєднуючись до голосового каналу після повторних помилок за короткий проміжок часу.
- Якщо журнали отримання постійно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути помилка отримання в `@discordjs/voice`, що відстежується в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд waveform і потребують аудіо OGG/Opus. OpenClaw автоматично генерує waveform, але на хості Gateway потрібні `ffmpeg` і `ffprobe` для аналізу та конвертації.

- Передайте **шлях до локального файла** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє одночасне надсилання тексту й голосового повідомлення).
- Підтримується будь-який формат аудіо; OpenClaw за потреби конвертує його в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлення гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від визначення користувача/учасника
    - перезапустіть Gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення гільдії неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist гільдії в `channels.discord.guilds`
    - якщо існує мапа `channels` гільдії, дозволені лише канали зі списку
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Параметр requireMention false, але все одно блокується">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного allowlist гільдії/каналу
    - `requireMention` налаштовано не в тому місці (має бути під `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано allowlist `users` гільдії/каналу

  </Accordion>

  <Accordion title="Обробники з тривалим виконанням завершуються за тайм-аутом або дублюють відповіді">

    Типові журнали:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Параметр бюджету listener:

    - для одного облікового запису: `channels.discord.eventQueue.listenerTimeout`
    - для кількох облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Параметр тайм-ауту виконання worker:

    - для одного облікового запису: `channels.discord.inboundWorker.runTimeoutMs`
    - для кількох облікових записів: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - типове значення: `1800000` (30 хвилин); установіть `0`, щоб вимкнути

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

    Використовуйте `eventQueue.listenerTimeout` для повільного налаштування listener і `inboundWorker.runTimeoutMs`
    лише якщо вам потрібен окремий запобіжний механізм для поставлених у чергу ходів агента.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення під час runtime усе ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і підключенням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження підключення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    Типово повідомлення, створені ботами, ігноруються.

    Якщо ви встановили `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Краще використовувати `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення від ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT втрачає дані з DecryptionFailed(...)">

    - підтримуйте актуальну версію OpenClaw (`openclaw update`), щоб логіка відновлення отримання голосу Discord була наявна
    - підтвердьте `channels.discord.voice.daveEncryption=true` (типово)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (типове значення upstream) і налаштовуйте лише за потреби
    - стежте за журналами:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Довідник із конфігурації

Основне посилання: [Довідник із конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Важливі поля Discord">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокова передача: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb` (обмежує вихідні завантаження Discord, типово `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневі `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека й експлуатація

- Розглядайте токени ботів як секрети (у керованих середовищах перевага надається `DISCORD_BOT_TOKEN`).
- Надавайте Discord мінімально необхідні дозволи.
- Якщо розгортання/стан команд застаріли, перезапустіть Gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Підключіть користувача Discord до Gateway.
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
    Зіставляйте гільдії та канали з агентами.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка власних команд.
  </Card>
</CardGroup>
