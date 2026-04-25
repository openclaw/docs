---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та налаштування
title: Discord
x-i18n:
    generated_at: "2026-04-25T11:56:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 685dd2dce8a299233b14e7bdd5f502ee92f740b7dbb3104e86e0c2f36aabcfe1
    source_path: channels/discord.md
    workflow: 15
---

Готово до використання в особистих повідомленнях і каналах серверів через офіційний Gateway Discord.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Discord за замовчуванням працюють у режимі підключення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і підключити його до OpenClaw. Ми рекомендуємо додати бота на ваш власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (оберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ту назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Усе ще на сторінці **Bot**, прокрутіть вниз до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібен лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен вашого бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це генерує ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL-запрошення й додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL-запрошення з правильними дозволами для додавання бота на ваш сервер.

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в гілках Discord, зокрема у процесах форумів або медіаканалів, які створюють або продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно ввімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч з аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші на **значку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші на **власному аватарі** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви надішлете всі три значення в OpenClaw.

  </Step>

  <Step title="Дозвольте особисті повідомлення від учасників сервера">
    Щоб підключення працювало, Discord має дозволяти вашому боту надсилати вам особисті повідомлення. Клацніть правою кнопкою миші на **значку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам особисті повідомлення. Залишайте це ввімкненим, якщо хочете використовувати особисті повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали сервера, можна вимкнути особисті повідомлення після підключення.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чат)">
    Токен вашого бота Discord — це секретне значення (як пароль). Установіть його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

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
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і скажіть йому це. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже задав токен свого бота Discord у config. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви віддаєте перевагу файловому config, задайте:

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

        Підтримуються відкриті значення `token`. Також для `channels.discord.token` підтримуються значення SecretRef у провайдерах env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше підключення через особисті повідомлення">
    Дочекайтеся, поки Gateway запуститься, а потім надішліть боту особисте повідомлення в Discord. Він відповість кодом підключення.

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

    Термін дії кодів підключення спливає через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через особисті повідомлення.

  </Step>
</Steps>

<Note>
Розв’язання токенів враховує обліковий запис. Значення токена з config мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для окремого виклику використовується саме для цього виклику. Це стосується дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Налаштування політики облікового запису/повторних спроб усе одно беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір сервера

Коли особисті повідомлення вже працюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал матиме власний сеанс агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви й ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених серверів">
    Це дозволить вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в особистих повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Server ID Discord `<server_id>` до списку дозволених серверів"
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
    За замовчуванням ваш агент відповідає в каналах сервера лише тоді, коли його згадали через @mention. Для приватного сервера вам, імовірно, захочеться, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
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
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в сеансах особистих повідомлень. У каналах сервера `MEMORY.md` не завантажується автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони вбудовуються в кожен сеанс). Зберігайте довготривалі нотатки в `MEMORY.md` і отримуйте до них доступ за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкування. Ваш агент бачить назву каналу, і кожен канал отримує власний ізольований сеанс — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому процесу роботи.

## Модель runtime

- Gateway володіє з’єднанням Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення Discord отримують відповіді назад у Discord.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують спільний основний сеанс агента (`agent:main:main`).
- Канали сервера мають ізольовані ключі сеансів (`agent:<agentId>:discord:channel:<channelId>`).
- Групові особисті повідомлення за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих сеансах команд (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизації в сеанс відповідної розмови.
- Доставка текстових оголошень Cron/Heartbeat у Discord використовує остаточну
  видиму для агента відповідь один раз. Медіа та структуровані корисні навантаження компонентів залишаються
  багатоповідомними, коли агент надсилає кілька доставлюваних корисних навантажень.

## Канали форуму

Форуми Discord і медіаканали приймають лише дописи в гілках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення в батьківський форум (`channel:<forumId>`), щоб автоматично створити гілку. Заголовок гілки використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити гілку безпосередньо. Не передавайте `--message-id` для каналів форуму.

Приклад: надіслати в батьківський форум для створення гілки

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити гілку форуму

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте повідомлення в саму гілку (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із корисним навантаженням `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Задайте `components.reusable=true`, щоб дозволити багаторазове використання кнопок, вибору й форм до завершення їхнього терміну дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо це налаштовано, користувачі без збігу отримають ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний засіб вибору моделі з випадними списками провайдера, моделі та сумісних runtime, а також етапом Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь засобу вибору є ефемерною, і використовувати її може лише користувач, який викликав команду.

Вкладення файлів:

- Блоки `file` мають указувати на посилання вкладення (`attachment://<filename>`)
- Надавайте вкладення через `media`/`path`/`filePath` (один файл); для кількох файлів використовуйте `media-gallery`
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

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
  message: "Необов’язковий резервний текст",
  components: {
    reusable: true,
    text: "Виберіть шлях",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Погодити",
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
      title: "Подробиці",
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
  <Tab title="Політика DM">
    `channels.discord.dmPolicy` керує доступом до DM (застаріле: `channels.discord.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика DM не є open, невідомі користувачі блокуються (або отримують запит на підключення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Просто числові ID є неоднозначними й відхиляються, якщо явно не вказано тип цілі користувача/каналу.

  </Tab>

  <Tab title="Політика сервера">
    Обробка серверів керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечне базове значення, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - сервер має збігатися з `channels.discord.guilds` (перевага надається `id`, допускається slug)
    - необов’язкові списки дозволених відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення за іменем/тегом за замовчуванням вимкнене; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - для `users` підтримуються імена/теги, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменем/тегом
    - якщо для сервера налаштовано `channels`, канали поза списком відхиляються
    - якщо сервер не має блока `channels`, дозволяються всі канали в цьому сервері зі списку дозволених

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

    Якщо ви лише задасте `DISCORD_BOT_TOKEN` і не створите блок `channels.discord`, резервне значення runtime буде `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки та групові DM">
    Повідомлення сервера за замовчуванням вимагають згадки.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    `requireMention` налаштовується окремо для сервера/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий список дозволених через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів за ролями

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників сервера Discord до різних агентів за ID ролі. Прив’язки за ролями приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише за сервером. Якщо прив’язка також задає інші поля match (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

## Нативні команди й авторизація команд

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнене для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі списки дозволених і політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не мають авторизації; виконання однаково примусово застосовує авторизацію OpenClaw і повертає "not authorized".

Перегляньте [Слеш-команди](/uk/tools/slash-commands), щоб дізнатися про каталог команд і поведінку.

Налаштування слеш-команд за замовчуванням:

- `ephemeral: true`

## Докладніше про можливості

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

    Примітка: `off` вимикає неявне групування відповідей у гілки. Явні теги `[[reply_to_*]]` все одно враховуються.
    `first` завжди прикріплює неявне нативне посилання відповіді до першого вихідного повідомлення Discord у межах ходу.
    `batched` прикріплює неявне нативне посилання відповіді Discord лише тоді, коли
    вхідний хід був пакетною обробкою кількох повідомлень із debounce. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних швидких чатів, а не для
    кожного окремого ходу з одним повідомленням.

    ID повідомлень додаються до context/history, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд потокової передачі">
    OpenClaw може передавати чернетки відповідей потоком, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` у Discord відображається як `partial`; `streamMode` — це застарілий псевдонім, який автоматично мігрується.

    Значенням за замовчуванням лишається `off`, тому що редагування попереднього перегляду в Discord швидко впирається в обмеження частоти, коли кілька ботів або Gateway використовують спільний обліковий запис.

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
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розбиття, обмежені `textChunkLimit`).
    - Фінальні повідомлення з медіа, помилками та явними відповідями скасовують відкладені редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи повторно використовуватимуть оновлення інструментів/прогресу повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли `block` streaming явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної потокової передачі.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка гілок">
    Контекст історії сервера:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сеанси каналів і успадковують config батьківського каналу, якщо не перевизначено інше.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) дає змогу новим автогілкам ініціалізуватися з батьківського transcript. Перевизначення для окремих облікових записів розміщені в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть розв’язувати цілі DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів вбудовуються як **ненадійний** контекст. Списки дозволених керують тим, хто може активувати агента, але не є повноцінною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сеанси, прив’язані до гілок, для субагентів">
    Discord може прив’язати гілку до цілі сеансу, щоб подальші повідомлення в цій гілці й надалі маршрутизувалися до того самого сеансу (включно із сеансами субагентів).

    Команди:

    - `/focus <target>` — прив’язати поточну/нову гілку до цілі субагента/сеансу
    - `/unfocus` — зняти поточну прив’язку гілки
    - `/agents` — показати активні запуски й стан прив’язки
    - `/session idle <duration|off>` — переглянути/оновити автоматичне зняття фокусу через неактивність для прив’язок у фокусі
    - `/session max-age <duration|off>` — переглянути/оновити жорсткий максимальний вік для прив’язок у фокусі

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
        spawnSubagentSessions: false, // увімкнення за бажанням
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні значення за замовчуванням.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати гілки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати гілки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки гілок вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки гілок недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Довідник із конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних ACP-робочих просторів "always-on" налаштуйте типізовані прив’язки ACP верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або гілку на місці й зберігає майбутні повідомлення в тому самому сеансі ACP. Повідомлення в гілках успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або гілці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив’язки гілок можуть перевизначати розв’язання цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірню гілку через `--thread auto|here`.

    Перегляньте [ACP Agents](/uk/tools/acp-agents) для подробиць про поведінку прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожного сервера:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованого сеансу Discord.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви власних емодзі.
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
    Маршрутизуйте трафік WebSocket Gateway Discord і початкові REST-запити (ID застосунку + розв’язання allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
    Увімкніть розв’язання PluralKit, щоб зіставляти проксійовані повідомлення з ідентичністю учасника системи:

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

    - allowlists можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошук використовує ID початкового повідомлення й обмежується часовим вікном
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

    Приклад активності (власний статус — тип активності за замовчуванням):

```json5
{
  channels: {
    discord: {
      activity: "Час для фокусу",
      activityType: 4,
    },
  },
}
```

    Приклад стримінгу:

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
    - 4: Custom (використовує текст активності як стан статусу; емодзі необов’язковий)
    - 5: Competing

    Приклад автоматичного статусу присутності (сигнал здоров’я runtime):

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
    Discord підтримує обробку погоджень через кнопки в особистих повідомленнях і може за бажанням публікувати запити на погодження в початковому каналі.

    Шлях config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості резервно використовує `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні погодження exec, коли `enabled` не задано або має значення `"auto"` і можна розв’язати принаймні одного погоджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить погоджувачів exec із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт погоджень.

    Коли `target` має значення `channel` або `both`, запит на погодження видимий у каналі. Лише розв’язані погоджувачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на погодження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сеансу, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки погодження, які використовуються іншими чат-каналами. Нативний адаптер Discord головним чином додає маршрутизацію погоджувачів через DM і fanout у канали.
    Коли ці кнопки присутні, вони є основним UX для погоджень; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що погодження в чаті недоступні або ручне погодження є єдиним шляхом.

    Авторизація Gateway і розв’язання погоджень дотримуються спільного контракту клієнта Gateway (`plugin:` ID розв’язуються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Термін дії погоджень за замовчуванням спливає через 30 хвилин.

    Див. [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord включають надсилання повідомлень, адміністрування каналів, модерацію, статус присутності та дії з метаданими.

Основні приклади:

- повідомлення: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- статус присутності: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файлу), щоб установити зображення обкладинки запланованої події.

Шлюзи дій розміщені в `channels.discord.actions.*`.

Поведінка шлюзів за замовчуванням:

| Група дій                                                                                                                                                                | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                    | вимкнено         |
| moderation                                                                                                                                                               | вимкнено         |
| presence                                                                                                                                                                 | вимкнено         |

## UI Components v2

OpenClaw використовує Discord components v2 для погоджень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для власного UI (розширено; потребує побудови корисного навантаження компонентів через інструмент discord), тоді як застарілі `embeds` лишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає колір акценту, який використовується контейнерами компонентів Discord (hex).
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

## Голос

У Discord є дві окремі голосові поверхні: **голосові канали** realtime (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду хвильової форми). Gateway підтримує обидва варіанти.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються allowlists ролей/користувачів.
3. Запросіть бота з областями `bot` і `applications.commands`.
4. Надайте дозволи Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status` для керування сеансами. Команда використовує агента облікового запису за замовчуванням і дотримується тих самих правил allowlist і group policy, що й інші команди Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Приклад автоматичного приєднання:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Примітки:

- `voice.tts` перевизначає `messages.tts` лише для голосового відтворення.
- `voice.model` перевизначає лише LLM, що використовується для відповідей у голосових каналах Discord. Залиште його незаданим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- Ходи голосових транскриптів визначають статус власника з `allowFrom` Discord (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримати доступ до інструментів лише для власника (наприклад, `gateway` і `cron`).
- Голос увімкнений за замовчуванням; задайте `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` напряму передаються до параметрів приєднання `@discordjs/voice`.
- Значення за замовчуванням `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо не задано інше.
- OpenClaw також відстежує помилки дешифрування під час прийому й автоматично відновлюється, покидаючи/повторно приєднуючись до голосового каналу після повторних помилок за короткий проміжок часу.
- Якщо журнали прийому після оновлення постійно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінійка `@discordjs/voice` включає upstream-виправлення padding із discord.js PR #11449, яке закрило проблему discord.js issue #11419.

Конвеєр голосових каналів:

- Захоплення Discord PCM перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через звичайний вхідний потік і маршрутизацію Discord.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу в голосовому каналі.
- `voice.tts` об’єднується поверх `messages.tts`; отримане аудіо відтворюється в каналі, до якого виконано приєднання.

Облікові дані розв’язуються для кожного компонента окремо: авторизація маршруту LLM для `voice.model`, авторизація STT для `tools.media.audio` і авторизація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми й потребують аудіо OGG/Opus. OpenClaw генерує хвильову форму автоматично, але на хості Gateway мають бути `ffmpeg` і `ffprobe` для аналізу й перетворення.

- Надавайте **шлях до локального файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє поєднання тексту й голосового повідомлення в одному корисному навантаженні).
- Підтримується будь-який аудіоформат; OpenClaw за потреби перетворює його в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень сервера">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, якщо ви залежите від розв’язання користувача/учасника
    - перезапустіть Gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення сервера неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist сервера в `channels.discord.guilds`
    - якщо існує мапа `channels` сервера, дозволено лише канали зі списку
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention має false, але все одно блокується">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного allowlist сервера/каналу
    - `requireMention` налаштовано не в тому місці (має бути під `channels.discord.guilds` або в записі каналу)
    - відправника блокує allowlist `users` сервера/каналу

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
    - за замовчуванням: `1800000` (30 хвилин); задайте `0`, щоб вимкнути

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
    лише якщо вам потрібен окремий запобіжник для поставлених у чергу ходів агента.

  </Accordion>

  <Accordion title="Невідповідності під час аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення в runtime усе ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і підключенням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження підключення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли між ботами">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви задали `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення від ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT пропускає дані через DecryptionFailed(...)">

    - підтримуйте актуальну версію OpenClaw (`openclaw update`), щоб була присутня логіка відновлення прийому голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (upstream-значення за замовчуванням) і змінюйте лише за потреби
    - стежте за журналами:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали й порівняйте з історією upstream щодо прийому DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник із конфігурації

Основний довідник: [Configuration reference - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Високосигнальні поля Discord">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- вхідний worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокова передача: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb` (обмежує вихідні завантаження в Discord, за замовчуванням `100MB`), `retry`
- дії: `actions.*`
- статус присутності: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- можливості: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та операції

- Вважайте токени бота секретами (у керованих середовищах перевага надається `DISCORD_BOT_TOKEN`).
- Надавайте Discord лише мінімально необхідні дозволи.
- Якщо розгортання/стан команд застарілі, перезапустіть Gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Підключіть користувача Discord до Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групових чатів і allowlist.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і зміцнення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте сервери й канали з агентами.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
