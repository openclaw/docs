---
read_when:
    - Робота над функціями каналу Discord
summary: Стан підтримки бота Discord, можливості та налаштування
title: Discord
x-i18n:
    generated_at: "2026-05-02T02:19:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 38dbdcf8fe6eb84c77ec7d0e88ecd839b6ecfa311194b2740a3a17a34f85823c
    source_path: channels/discord.md
    workflow: 16
---

Готово для особистих повідомлень і каналів сервера через офіційний Discord Gateway.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Discord за замовчуванням використовують режим створення пари.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Власна поведінка команд і каталог команд.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і створити пару з OpenClaw. Ми рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спершу створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на те, як ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Enable privileged intents">
    Залишаючись на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Copy your bot token">
    Прокрутіть назад угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається".
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він скоро знадобиться.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і ввімкніть:

    - `bot`
    - `applications.commands`

    Нижче з’явиться розділ **Bot Permissions**. Увімкніть принаймні:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в тредах Discord, зокрема у сценаріях форумних або медіаканалів, які створюють чи продовжують тред, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб під’єднати. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Повернувшись у застосунок Discord, потрібно ввімкнути Developer Mode, щоб ви могли копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні біля вашого аватара) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою вашу **іконку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою ваш **власний аватар** → **Copy User ID**

    Збережіть ваші **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви надішлете всі три до OpenClaw.

  </Step>

  <Step title="Allow DMs from server members">
    Щоб створення пари працювало, Discord має дозволити вашому боту надсилати вам особисті повідомлення. Клацніть правою кнопкою вашу **іконку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам особисті повідомлення. Залиште це ввімкненим, якщо хочете використовувати особисті повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали сервера, після створення пари можете вимкнути особисті повідомлення.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Токен вашого бота Discord є секретом (як пароль). Установіть його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.
    Для керованих інсталяцій сервісу запустіть `openclaw gateway install` з оболонки, де наявна змінна `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб сервіс міг визначити env SecretRef після перезапуску.
    Якщо ваш хост заблоковано або обмежено за частотою через стартовий пошук застосунку Discord, установіть ID застосунку/клієнта Discord з Developer Portal, щоб запуск міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для облікового запису за замовчуванням або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кілька ботів Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте його. Якщо Discord — ваш перший канал, натомість скористайтеся вкладкою CLI / config.

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
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

        Резервне env-значення для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторіть без `--dry-run`. Підтримуються відкриті текстові значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord зберігайте кожен токен бота та ID застосунку в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тож задавайте його там лише тоді, коли всі облікові записи мають використовувати той самий ID застосунку.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approve first DM pairing">
    Зачекайте, доки Gateway запрацює, а потім напишіть своєму боту в Discord в особисті повідомлення. Він відповість кодом створення пари.

    <Tabs>
      <Tab title="Ask your agent">
        Надішліть код створення пари своєму агенту у вашому наявному каналі:

        > "Approve this Discord pairing code: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Коди створення пари спливають через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через особисті повідомлення.

  </Step>
</Steps>

<Note>
Визначення токенів враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним env-значенням. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Якщо два ввімкнені облікові записи Discord визначаються в той самий токен бота, OpenClaw запускає лише один монітор Gateway для цього токена. Токен із конфігурації має пріоритет над резервним env-значенням за замовчуванням; інакше перемагає перший увімкнений обліковий запис, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується саме для цього виклику. Це стосується дій надсилання й читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису та налаштування повторних спроб усе одно беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір сервера

Коли особисті повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента зі своїм контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Це дає вашому агенту змогу відповідати в будь-якому каналі на вашому сервері, а не лише в особистих повідомленнях.

    <Tabs>
      <Tab title="Ask your agent">
        > "Add my Discord Server ID `<server_id>` to the guild allowlist"
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

  <Step title="Allow responses without @mention">
    За замовчуванням ваш агент відповідає в каналах сервера лише тоді, коли його згадали через @. Для приватного сервера вам, імовірно, потрібно, щоб він відповідав на кожне повідомлення.

    У каналах сервера звичайні фінальні відповіді асистента за замовчуванням залишаються приватними. Видимий вивід Discord потрібно надсилати явно за допомогою інструмента `message`, тож агент може за замовчуванням залишатися непомітним і публікувати лише тоді, коли вирішить, що відповідь у каналі корисна.

    <Tabs>
      <Tab title="Ask your agent">
        > "Allow my agent to respond on this server without having to be @mentioned"
      </Tab>
      <Tab title="Config">
        Установіть `requireMention: false` у конфігурації вашого сервера:

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

        Щоб відновити застарілі автоматичні фінальні відповіді для групових/канальних кімнат, установіть `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    За замовчуванням довготривала пам’ять (MEMORY.md) завантажується лише в сесіях особистих повідомлень. Канали сервера не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Ask your agent">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони додаються до кожної сесії). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкуватися. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що підходить для вашого робочого процесу.

## Модель runtime

- Gateway володіє підключенням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді Discord повертаються до Discord.
- Метадані сервера/каналу Discord додаються до підказки моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель копіює цей конверт
  назад, OpenClaw вилучає скопійовані метадані з вихідних відповідей і з
  майбутнього контексту повторного відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основний сеанс агента (`agent:main:main`).
- Канали серверів мають ізольовані ключі сеансів (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сеансах (`agent:<agentId>:discord:slash:<userId>`), але все одно передають `CommandTargetSessionKey` до маршрутизованого сеансу розмови.
- Доставка текстових оголошень cron/heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа й структуровані корисні навантаження компонентів залишаються
  багатоповідомленнєвими, коли агент випускає кілька придатних до доставки корисних навантажень.

## Канали форумів

Канали форумів і медіа Discord приймають лише дописи в гілках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити гілку. Заголовок гілки використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити гілку напряму. Не передавайте `--message-id` для каналів форумів.

Приклад: надіслати до батьківського форуму, щоб створити гілку

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити гілку форуму

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самої гілки (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із корисним навантаженням `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити використовувати кнопки, списки вибору та форми кілька разів, доки вони не завершать строк дії.

Щоб обмежити, хто може натискати кнопку, установіть `allowedUsers` для цієї кнопки (ідентифікатори користувачів Discord, теги або `*`). Коли це налаштовано, користувачі без збігу отримують ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками провайдера, моделі та сумісного середовища виконання, а також кроком надсилання. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору ефемерна, і використовувати її може лише користувач, який її викликав.

Файлові вкладення:

- Блоки `file` мають указувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

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

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` керує доступом до DM. `channels.discord.allowFrom` є канонічним списком дозволених DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`)
    - `disabled`

    Якщо політика DM не відкрита, невідомих користувачів блокують (або пропонують створити пару в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Для одного облікового запису `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застаріле `dm.allowFrom` не задані.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ідентифікатори зазвичай розпізнаються як ідентифікатори каналів, коли активне значення каналу за замовчуванням, але ідентифікатори, зазначені в ефективному DM `allowFrom` облікового запису, трактуються як цілі користувацьких DM для сумісності.

  </Tab>

  <Tab title="DM access groups">
    DM Discord можуть використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Назви груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, члени якої виражені у звичайному синтаксисі `allowFrom` кожного каналу, або `type: "discord.channelAudience"`, коли поточна аудиторія `ViewChannel` каналу Discord має динамічно визначати членство. Спільну поведінку груп доступу задокументовано тут: [Групи доступу](/uk/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник DM є учасником налаштованого сервера й наразі має ефективний дозвіл `ViewChannel` на налаштованому каналі після застосування ролей і перевизначень каналу.

    Приклад: дозволити будь-кому, хто може бачити `#maintainers`, писати боту в DM, залишаючи DM закритими для всіх інших.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Ви можете змішувати динамічні та статичні записи:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Пошуки закривають доступ у разі помилки. Якщо Discord повертає `Missing Access`, пошук учасника завершується невдало або канал належить іншому серверу, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** на порталі розробника Discord для бота, коли використовуєте групи доступу аудиторії каналу. DM не містять стану учасника сервера, тому OpenClaw визначає учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Guild policy">
    Обробка серверів керується `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова лінія, коли існує `channels.discord`, це `allowlist`.

    Поведінка `allowlist`:

    - сервер має збігатися з `channels.discord.guilds` (переважно `id`, slug також приймається)
    - необов’язкові списки дозволених відправників: `users` (рекомендовано стабільні ідентифікатори) і `roles` (лише ідентифікатори ролей); якщо налаштовано будь-який із них, відправників дозволено, коли вони збігаються з `users` АБО `roles`
    - прямий збіг за назвою/тегом вимкнено за замовчуванням; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - назви/теги підтримуються для `users`, але ідентифікатори безпечніші; `openclaw security audit` попереджає, коли використовуються записи назви/тега
    - якщо сервер має налаштовані `channels`, канали не зі списку відхиляються
    - якщо сервер не має блока `channels`, дозволені всі канали на цьому сервері зі списку дозволених

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

    Якщо ви лише задаєте `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, резервна поведінка середовища виконання — `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Повідомлення серверів за замовчуванням обмежені згадками.

    Виявлення згадок охоплює:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожного сервера/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, які згадують іншого користувача/роль, але не бота (крім @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий список дозволених через `dm.groupChannels` (ідентифікатори каналів або slugs)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників сервера Discord до різних агентів за ідентифікатором ролі. Прив’язки на основі ролей приймають лише ідентифікатори ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише за сервером. Якщо прив’язка також задає інші поля збігу (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

- `commands.native` за замовчуванням дорівнює `"auto"` і ввімкнено для Discord.
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі списки дозволених і політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в UI Discord для користувачів, які не авторизовані; виконання все одно застосовує авторизацію OpenClaw і повертає «не авторизовано».

Див. [Slash-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Типові налаштування slash-команд:

- `ephemeral: true`

## Відомості про функції

<AccordionGroup>
  <Accordion title="Теги відповідей і нативні відповіді">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується `channels.discord.replyToMode`:

    - `off` (типово)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне формування ланцюжків відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне нативне посилання відповіді до першого вихідного повідомлення Discord для ходу.
    `batched` додає неявне нативне посилання відповіді Discord лише тоді, коли
    вхідний хід був debounce-пакетом із кількох повідомлень. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних швидких чатів, а не для кожного
    ходу з одним повідомленням.

    Ідентифікатори повідомлень показуються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд live-потоку">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (типово) | `partial` | `block` | `progress`. `progress` відображається на `partial` у Discord; `streamMode` є застарілим псевдонімом і автоматично мігрується.

    Типове значення лишається `off`, бо редагування попереднього перегляду в Discord швидко впирається в обмеження частоти, коли кілька ботів або gateway використовують спільний обліковий запис.

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
    - `block` виводить фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, обмежені `textChunkLimit`).
    - Медіа, помилки та фінальні відповіді з явним посиланням скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (типово `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли потоковий режим `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного стримінгу.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка гілок">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` типово `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сеанси каналів і успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси гілок успадковують вибір `/model` рівня сеансу батьківського каналу як резерв лише для моделі; локальні для гілки вибори `/model` усе одно мають пріоритет, а історія транскрипту батька не копіюється, якщо не ввімкнено успадкування транскрипту.
    - `channels.discord.thread.inheritParent` (типово `false`) вмикає для нових автоматичних гілок початкове заповнення з батьківського транскрипту. Перевизначення для окремих облікових записів містяться в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції message-tool можуть розв’язувати цілі DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів вставляються як **ненадійний** контекст. Allowlist обмежують, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Прив’язані до гілок сеанси для субагентів">
    Discord може прив’язати гілку до цілі сеансу, щоб наступні повідомлення в цій гілці й далі маршрутизувалися до того самого сеансу (включно із сеансами субагентів).

    Команди:

    - `/focus <target>` прив’язати поточну/нову гілку до цілі субагента/сеансу
    - `/unfocus` вилучити прив’язку поточної гілки
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне unfocus через неактивність для сфокусованих прив’язок
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

    - `session.threadBindings.*` задає глобальні типові значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати гілки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати гілки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки гілок вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки гілок недоступні.

    Див. [Субагенти](/uk/tools/subagents), [Агенти ACP](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних робочих просторів ACP у режимі «завжди ввімкнено» налаштуйте типізовані прив’язки ACP верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або гілку на місці й зберігає майбутні повідомлення в тому самому сеансі ACP. Повідомлення гілки успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або гілці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив’язки гілок можуть перевизначати розв’язання цілі, доки активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірню гілку через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents), щоб дізнатися деталі поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для окремої гільдії:

    - `off`
    - `own` (типово)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованого сеансу Discord.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode emoji або назви власних emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані каналом, увімкнені типово.

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

  <Accordion title="Проксі Gateway">
    Маршрутизуйте Discord gateway WebSocket-трафік і стартові REST-пошуки (ідентифікатор застосунку + розв’язання allowlist) через HTTP(S)-проксі з `channels.discord.proxy`.

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
    - відображувані імена учасників зіставляються за назвою/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ідентифікатор оригінального повідомлення та обмежені часовим вікном
    - якщо пошук завершується невдало, проксійовані повідомлення вважаються повідомленнями ботів і відкидаються, якщо `allowBots=true` не встановлено

  </Accordion>

  <Accordion title="Конфігурація присутності">
    Оновлення присутності застосовуються, коли ви встановлюєте поле статусу або активності, або коли вмикаєте автоматичну присутність.

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

    Приклад активності (власний статус є типовим типом активності):

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

    Мапа типів активності:

    - 0: Грає
    - 1: Стримить (потребує `activityUrl`)
    - 2: Слухає
    - 3: Дивиться
    - 4: Власна (використовує текст активності як стан статусу; emoji необов’язковий)
    - 5: Змагається

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

    Автоматична присутність зіставляє доступність runtime зі статусом Discord: справний => online, погіршений або невідомий => idle, вичерпаний або недоступний => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує placeholder `{reason}`)

  </Accordion>

  <Accordion title="Схвалення в Discord">
    Discord підтримує обробку схвалень кнопками в DM і може необов’язково публікувати запити на схвалення у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні схвалення exec, коли `enabled` не встановлено або дорівнює `"auto"` і можна розв’язати принаймні одного схвалювача, або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить схвалювачів exec із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Установіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт схвалення.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на схвалення та фінальні результати приватно. Спочатку він пробує DM Discord, коли власник, що викликає команду, має маршрут власника Discord; якщо це недоступно, він повертається до першого доступного маршруту власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на схвалення видно в каналі. Лише визначені схвалювачі можуть використовувати кнопки; інші користувачі отримують тимчасову відмову. Запити на схвалення містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу не можна вивести з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки схвалення, які використовуються іншими чат-каналами. Нативний адаптер Discord переважно додає маршрутизацію DM для схвалювачів і розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що чат-схвалення недоступні або ручне схвалення є єдиним шляхом.
    Якщо нативне середовище виконання схвалень Discord не активне, OpenClaw залишає
    видимим локальний детермінований запит `/approve <id> <decision>`. Якщо
    середовище виконання активне, але нативну картку неможливо доставити до жодної цілі,
    OpenClaw надсилає резервне сповіщення в той самий чат із точною командою `/approve`
    з очікуваного схвалення.

    Автентифікація Gateway і визначення схвалень відповідають спільному контракту клієнта Gateway (`plugin:` ID визначаються через `plugin.approval.resolve`; інші ID через `exec.approval.resolve`). Схвалення за замовчуванням спливають через 30 хвилин.

    Див. [схвалення Exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файлу), щоб встановити обкладинку запланованої події.

Шлюзи дій розташовані в `channels.discord.actions.*`.

Поведінка шлюзів за замовчуванням:

| Група дій                                                                                                                                                                | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                    | вимкнено         |
| moderation                                                                                                                                                               | вимкнено         |
| presence                                                                                                                                                                 | вимкнено         |

## UI компонентів v2

OpenClaw використовує компоненти Discord v2 для схвалень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (розширений сценарій; потребує створення payload компонента через інструмент discord), тоді як застарілі `embeds` лишаються доступними, але не рекомендуються.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Задайте для окремого акаунта через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві окремі голосові поверхні: realtime **голосові канали** (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду хвильової форми). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволів ролей/користувачів.
3. Запросіть бота зі scope `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує агента за замовчуванням для акаунта та дотримується тих самих правил списків дозволів і групової політики, що й інші команди Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Приклад автоприєднання:

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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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
- `voice.model` перевизначає LLM, що використовується лише для відповідей голосового каналу Discord. Залиште його незаданим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрибування.
- Перевизначення `systemPrompt` для окремих каналів Discord застосовуються до ходів голосового транскрипта для цього голосового каналу.
- Ходи голосового транскрипта визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); спікери, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос Discord є opt-in для конфігурацій лише з текстом; встановіть `channels.discord.voice.enabled=true` (або залиште наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на intent голосового стану. Залиште його незаданим, щоб intent відповідав ефективному ввімкненню голосу.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів приєднання `@discordjs/voice`.
- Значення за замовчуванням `@discordjs/voice`: `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо вони не задані.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоприєднання. За замовчуванням: `30000`.
- `voice.reconnectGraceMs` керує тим, скільки OpenClaw чекає, поки від’єднана голосова сесія почне перепідключення, перш ніж знищити її. За замовчуванням: `15000`.
- OpenClaw також відстежує помилки розшифрування під час приймання та автоматично відновлюється, залишаючи голосовий канал і приєднуючись до нього знову після повторних помилок у короткому вікні.
- Якщо після оновлення журнали приймання багаторазово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінійка `@discordjs/voice` включає upstream-виправлення padding з PR discord.js #11449, який закрив issue discord.js #11419.

Пайплайн голосового каналу:

- PCM-захоплення Discord перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхід Discord і маршрутизацію, тоді як LLM відповіді працює з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернути текст, бо Discord voice відповідає за фінальне відтворення TTS.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; отримане аудіо відтворюється у приєднаному каналі.

Облікові дані визначаються для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми та потребують аудіо OGG/Opus. OpenClaw автоматично генерує хвильову форму, але потребує `ffmpeg` і `ffprobe` на хості gateway для перевірки та конвертації.

- Надайте **шлях до локального файлу** (URL відхиляються).
- Не вказуйте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від визначення користувача/учасника
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення гільдії неочікувано заблоковані">

    - перевірте `groupPolicy`
    - перевірте список дозволів гільдій у `channels.discord.guilds`
    - якщо існує мапа `channels` гільдії, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, але все одно заблоковано">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволів гільдії/каналу
    - `requireMention` налаштовано в неправильному місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправника заблоковано списком дозволів `users` гільдії/каналу

  </Accordion>

  <Accordion title="Довготривалі ходи Discord або дублікати відповідей">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Параметри черги gateway Discord:

    - один акаунт: `channels.discord.eventQueue.listenerTimeout`
    - кілька акаунтів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою слухача gateway Discord, а не тривалістю ходу агента

    Discord не застосовує таймаут, що належить каналу, до поставлених у чергу ходів агента. Слухачі повідомлень одразу передають роботу далі, а поставлені в чергу запуски Discord зберігають порядок у межах сесії, доки життєвий цикл сесії/інструмента/середовища виконання не завершить або не перерве роботу.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Попередження про таймаут пошуку метаданих Gateway">
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої повертаються до стандартного URL gateway Discord і обмежуються за частотою в журналах.

    Параметри таймауту метаданих:

    - один акаунт: `channels.discord.gatewayInfoTimeoutMs`
    - кілька акаунтів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне значення env, коли config не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - за замовчуванням: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через таймаут READY Gateway">
    OpenClaw чекає на подію gateway `READY` Discord під час запуску та після перепідключень середовища виконання. Налаштуванням із кількома акаунтами та рознесенням запуску може знадобитися довше startup READY window, ніж стандартне.

    Параметри таймауту READY:

    - запуск, один акаунт: `channels.discord.gatewayReadyTimeoutMs`
    - запуск, кілька акаунтів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - резервне значення env для запуску, коли config не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - стандарт для запуску: `15000` (15 секунд), максимум: `120000`
    - runtime, один акаунт: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime, кілька акаунтів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - резервне значення env для runtime, коли config не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - стандарт для runtime: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення під час виконання все ще може працювати, але перевірка не може повністю підтвердити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - Політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікування схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-бот">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і списку дозволених, щоб уникнути циклічної поведінки.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT переривається з DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була доступна логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (стандартне значення upstream) і налаштовуйте лише за потреби
    - стежте за журналами на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте їх з upstream-історією приймання DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Високосигнальні поля Discord">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет слухача), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторна спроба: `mediaMaxMb` (обмежує вихідні завантаження Discord, за замовчуванням `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та експлуатація

- Розглядайте токени ботів як секрети (у керованих середовищах бажано `DISCORD_BOT_TOKEN`).
- Надавайте мінімально необхідні дозволи Discord.
- Якщо розгортання/стан команди застаріли, перезапустіть Gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групового чату та списку дозволених.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Маршрутизація між кількома агентами" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте гільдії та канали з агентами.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
