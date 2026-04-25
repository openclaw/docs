---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та налаштування
title: Discord
x-i18n:
    generated_at: "2026-04-25T05:54:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f40c8a768c850e0e90e698fa82eaca81a0a7cd682f5dee8609793f60cc83355
    source_path: channels/discord.md
    workflow: 15
---

Готово до роботи з приватними повідомленнями та каналами серверів через офіційний Discord gateway.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Для приватних повідомлень Discord за замовчуванням використовується режим сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і сполучити його з OpenClaw. Ми рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть Discord application і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. У полі **Username** вкажіть будь-яке ім’я, яким ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Залишаючись на сторінці **Bot**, прокрутіть до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібне лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен вашого бота">
    Поверніться вгору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він вам незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL-запрошення й додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL-запрошення з правильними дозволами для додавання бота на ваш сервер.

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в потоках Discord, зокрема в сценаріях форумних або медіаканалів, які створюють або продовжують потік, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно увімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші на **значку вашого сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші на **своєму аватарі** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три значення OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб сполучення працювало, Discord має дозволяти вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші на **значку вашого сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам приватні повідомлення. Залиште цей параметр увімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали сервера, можете вимкнути приватні повідомлення після сполучення.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чат)">
    Токен вашого Discord-бота — це секретне значення (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через OpenClaw Mac app або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте сполучення">

    <Tabs>
      <Tab title="Попросіть свого агента">
        Напишіть своєму агенту OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте це. Якщо Discord — ваш перший канал, скористайтеся вкладкою CLI / config.

        > "Я вже задав токен свого Discord-бота в config. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви надаєте перевагу файловому config, задайте:

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

        Підтримуються відкриті значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` у постачальниках env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше сполучення в приватних повідомленнях">
    Дочекайтеся, поки gateway запуститься, а потім надішліть приватне повідомлення своєму боту в Discord. Він відповість кодом сполучення.

    <Tabs>
      <Tab title="Попросіть свого агента">
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

    Термін дії кодів сполучення закінчується через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через приватні повідомлення.

  </Step>
</Steps>

<Note>
Розв’язання токенів залежить від облікового запису. Значення токенів у config мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (дії message tool/channel) для цього виклику використовується явний `token` для кожного виклику. Це застосовується до дій надсилання та читання/перевірки (наприклад read/search/fetch/thread/pins/permissions). Налаштування політики облікового запису/повторних спроб усе ще беруться з вибраного облікового запису в активному runtime snapshot.
</Note>

## Рекомендовано: налаштуйте робочий простір сервера

Коли приватні повідомлення вже працюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де єте лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist серверів">
    Це дає вашому агенту змогу відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Попросіть свого агента">
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
      <Tab title="Попросіть свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без @mention"
      </Tab>
      <Tab title="Config">
        Задайте `requireMention: false` у config вашого сервера:

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
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в сесіях приватних повідомлень. У каналах сервера `MEMORY.md` автоматично не завантажується.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, розмістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони додаються до кожної сесії). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби через інструменти пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкування. Ваш агент бачить назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway керує з’єднанням Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення з Discord повертаються в Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують основну сесію агента (`agent:main:main`).
- Канали сервера використовують ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові приватні повідомлення за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих сесіях команд (`agent:<agentId>:discord:slash:<userId>`), при цьому все одно передають `CommandTargetSessionKey` до маршрутизованої сесії розмови.
- Доставка анонсів text-only Cron/Heartbeat до Discord використовує фінальну
  видиму для агента відповідь один раз. Медіа та структуровані payload компонентів залишаються
  багатоповідомленнєвими, коли агент надсилає кілька payload, які можна доставити.

## Форумні канали

Форумні та медіаканали Discord приймають лише публікації в потоках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити потік. Заголовок потоку використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити потік безпосередньо. Не передавайте `--message-id` для форумних каналів.

Приклад: надіслати до батьківського форуму, щоб створити потік

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити форумний потік

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте в сам потік (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте message tool із payload `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Задайте `components.reusable=true`, щоб дозволити багаторазове використання кнопок, меню вибору та форм до завершення строку їх дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (Discord user IDs, теги або `*`). Якщо налаштовано, користувачі, які не збігаються, отримають ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний засіб вибору моделі з випадними списками постачальника, моделі та сумісних runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь засобу вибору є ефемерною, і використовувати її може лише користувач, який викликав команду.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надавайте вкладення через `media`/`path`/`filePath` (один файл); для кількох файлів використовуйте `media-gallery`
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
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика приватних повідомлень не `open`, невідомі користувачі блокуються (або отримують запит на сполучення в режимі `pairing`).

    Пріоритетність для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі приватних повідомлень для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Числові ID без префікса є неоднозначними та відхиляються, якщо явно не вказано тип цілі user/channel.

  </Tab>

  <Tab title="Політика сервера">
    Обробка серверів керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечний базовий режим, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - сервер має відповідати `channels.discord.guilds` (перевага надається `id`, `slug` також приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення імен/тегів за замовчуванням вимкнене; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для сервера налаштовано `channels`, канали, яких немає в списку, забороняються
    - якщо сервер не має блоку `channels`, дозволяються всі канали цього сервера з allowlist

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

    Якщо ви лише задасте `DISCORD_BOT_TOKEN` і не створите блок `channels.discord`, резервний режим runtime буде `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Згадки та групові приватні повідомлення">
    Повідомлення серверів за замовчуванням вимагають згадки.

    Визначення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожного сервера/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, у яких згадується інший користувач/роль, але не бот (крім @everyone/@here).

    Групові приватні повідомлення:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників серверів Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer і перед прив’язками лише для сервера. Якщо прив’язка також задає інші поля зіставлення (наприклад `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

- `commands.native` за замовчуванням має значення `"auto"` і увімкнене для Discord.
- Перевизначення для конкретного каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не мають авторизації; виконання все одно примусово застосовує авторизацію OpenClaw і повертає "not authorized".

Перегляньте [Слеш-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Налаштування слеш-команд за замовчуванням:

- `ephemeral: true`

## Подробиці функцій

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

    Примітка: `off` вимикає неявне прив’язування відповідей у потоках. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord для цього ходу.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був дебаунсованим пакетом із кількох повідомлень. Це корисно,
    коли вам потрібні нативні відповіді переважно для неоднозначних чатів із частими серіями повідомлень, а не для кожного
    окремого ходу з одним повідомленням.

    ID повідомлень додаються до контексту/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд потокової передачі">
    OpenClaw може потоково передавати чернетки відповідей, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` у Discord відображається як `partial`; `streamMode` — це застарілий псевдонім, який автоматично мігрується.

    Типовим значенням лишається `off`, оскільки редагування попереднього перегляду в Discord швидко впирається в обмеження частоти, коли кілька ботів або gateway використовують один обліковий запис.

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
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk` для налаштування розміру та точок розриву, обмежених `textChunkLimit`).
    - Фінальні повідомлення з медіа, помилками та явними відповідями скасовують відкладені редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення tool/progress повторно використовують повідомлення попереднього перегляду.

    Попередній перегляд потокової передачі підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Якщо потоковий режим `block` явно увімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної потокової передачі.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка потоків">
    Контекст історії сервера:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка потоків:

    - Потоки Discord маршрутизуються як сесії каналів і успадковують config батьківського каналу, якщо не перевизначено інакше.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) дозволяє новим автопотокам використовувати ініціалізацію з батьківського транскрипту. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції message-tool можуть розв’язувати цілі приватних повідомлень `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів додаються як **ненадійний** контекст. Allowlist керують тим, хто може активувати агента, але це не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Прив’язані до потоку сесії для субагентів">
    Discord може прив’язати потік до цілі сесії, щоб подальші повідомлення в цьому потоці й далі маршрутизувалися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий потік до цілі субагента/сесії
    - `/unfocus` видалити поточну прив’язку потоку
    - `/agents` показати активні запуски та стан прив’язок
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокуса через неактивність для прив’язок із фокусом
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для прив’язок із фокусом

    Config:

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
    - `spawnSubagentSessions` має бути `true`, щоб автоматично створювати/прив’язувати потоки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути `true`, щоб автоматично створювати/прив’язувати потоки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки потоків вимкнені для облікового запису, `/focus` і пов’язані операції прив’язки потоків недоступні.

    Перегляньте [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Довідник із конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки ACP-каналів">
    Для стабільних "always-on" робочих просторів ACP налаштуйте типізовані прив’язки ACP верхнього рівня, націлені на розмови Discord.

    Шлях config:

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або потік на місці й зберігає майбутні повідомлення в тій самій ACP-сесії. Повідомлення потоку успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або потоці `/new` і `/reset` скидають ту саму ACP-сесію на місці. Тимчасові прив’язки потоків можуть перевизначати розв’язання цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній потік через `--thread auto|here`.

    Перегляньте [ACP Agents](/uk/tools/acp-agents) для подробиць поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожного сервера:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованої Discord-сесії.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви користувацьких емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи config">
    Записи config, ініційовані з каналу, увімкнені за замовчуванням.

    Це впливає на потоки `/config set|unset` (коли функції команд увімкнені).

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
    Маршрутизуйте трафік WebSocket Discord gateway і стартові REST-запити (ID application + розв’язання allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
    Увімкніть розв’язання PluralKit, щоб зіставляти проксійовані повідомлення з ідентичністю учасника системи:

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
    - відображувані імена учасників зіставляються за ім’ям/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID оригінального повідомлення й обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо `allowBots=true` не увімкнено

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
    Discord підтримує обробку погоджень через кнопки в приватних повідомленнях і за потреби може публікувати запити на погодження у вихідному каналі.

    Шлях config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовує резервно `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні погодження exec, коли `enabled` не задано або дорівнює `"auto"` і вдається розв’язати принаймні одного погоджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить погоджувачів exec із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт погоджень.

    Коли `target` має значення `channel` або `both`, запит на погодження видно в каналі. Лише розв’язані погоджувачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на погодження включають текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw використовує резервну доставку в приватні повідомлення.

    Discord також відображає спільні кнопки погодження, які використовують інші чат-канали. Нативний адаптер Discord головно додає маршрутизацію погоджувачів у приватні повідомлення та розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX для погоджень; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат tool повідомляє,
    що погодження в чаті недоступні або ручне погодження — єдиний шлях.

    Автентифікація Gateway і розв’язання погоджень дотримуються спільного контракту клієнта Gateway (`plugin:` ID розв’язуються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Термін дії погоджень за замовчуванням завершується через 30 хвилин.

    Перегляньте [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та обмеження дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файла), щоб задати обкладинку запланованої події.

Обмеження дій розміщені в `channels.discord.actions.*`.

Поведінка обмежень за замовчуванням:

| Група дій                                                                                                                                                                 | Типово    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено |
| roles                                                                                                                                                                     | вимкнено  |
| moderation                                                                                                                                                                | вимкнено  |
| presence                                                                                                                                                                  | вимкнено  |

## Інтерфейс Components v2

OpenClaw використовує Discord components v2 для погоджень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (розширено; потребує побудови payload компонента через discord tool), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовується контейнерами компонентів Discord (hex).
- Для окремого облікового запису задавайте через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві окремі голосові поверхні: realtime **голосові канали** (безперервні розмови) і **вкладення голосових повідомлень** (формат із попереднім переглядом хвилі). Gateway підтримує обидва варіанти.

### Голосові канали

Вимоги:

- Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
- Налаштуйте `channels.discord.voice`.
- Бот має мати дозволи Connect + Speak у цільовому голосовому каналі.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує агента облікового запису за замовчуванням і дотримується тих самих правил allowlist та групової політики, що й інші команди Discord.

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

- `voice.tts` перевизначає `messages.tts` лише для відтворення голосу.
- Ходи транскрипції голосу визначають статус власника з `allowFrom` Discord (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос увімкнено за замовчуванням; задайте `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` напряму передаються до параметрів підключення `@discordjs/voice`.
- Значення за замовчуванням `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- OpenClaw також відстежує помилки дешифрування під час отримання й автоматично відновлюється, виходячи з голосового каналу та повторно підключаючись після повторюваних збоїв за короткий проміжок часу.
- Якщо журнали отримання багаторазово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, це може бути помилкою отримання в upstream `@discordjs/voice`, яку відстежують у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвилі й потребують аудіо OGG/Opus. OpenClaw генерує хвилю автоматично, але на вузлі gateway потрібні `ffmpeg` і `ffprobe` для перевірки та конвертації.

- Надайте **локальний шлях до файла** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень сервера">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від розв’язання користувачів/учасників
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення сервера неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist серверів у `channels.discord.guilds`
    - якщо існує карта `channels` сервера, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, але все одно блокується">
    Типові причини:

    - `groupPolicy="allowlist"` без відповідного allowlist сервера/каналу
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано allowlist `users` сервера/каналу

  </Accordion>

  <Accordion title="Обробники з довгим виконанням завершуються за тайм-аутом або дублюють відповіді">

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
    лише якщо вам потрібен окремий запобіжний механізм для агентських ходів у черзі.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення в runtime усе ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з приватними повідомленнями та сполученням">

    - приватні повідомлення вимкнено: `channels.discord.dm.enabled=false`
    - політику приватних повідомлень вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви задаєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT втрачається з DecryptionFailed(...)">

    - підтримуйте актуальність OpenClaw (`openclaw update`), щоб була наявна логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (значення upstream за замовчуванням) і налаштовуйте лише за потреби
    - відстежуйте журнали на предмет:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного підключення, зберіть журнали й порівняйте з [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Довідник із конфігурації

Основний довідник: [Configuration reference - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Ключові поля Discord">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокова передача: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb` (обмежує вихідні завантаження Discord, за замовчуванням `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневі `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та експлуатація

- Розглядайте токени ботів як секрети (у керованих середовищах бажано використовувати `DISCORD_BOT_TOKEN`).
- Надавайте Discord лише мінімально необхідні дозволи.
- Якщо розгортання/стан команд застаріли, перезапустіть gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord із gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групових чатів і allowlist.
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
