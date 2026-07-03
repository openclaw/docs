---
read_when:
    - Працюємо над функціями каналу Discord
summary: Стан підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:54:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

Готово для DM і каналів гільдії через офіційний Discord gateway.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Discord DM за замовчуванням переходять у режим сполучення.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і сполучити його з OpenClaw. Радимо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на те, як ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть privileged intents">
    Залишаючись на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібен лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть назад угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається".
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і ввімкніть:

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в потоках Discord, зокрема у сценаріях форумних або медіаканалів, які створюють або продовжують потік, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб під’єднати. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, потрібно ввімкнути Developer Mode, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → прокрутіть до **Developer** на бічній панелі → увімкніть **Developer Mode**

        *(Примітка: у мобільному застосунку Discord Developer Mode розташований у **App Settings** → **Advanced**)*

    2. Клацніть правою кнопкою **значок сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою **власний аватар** → **Copy User ID**

    Збережіть **Server ID** і **User ID** поруч із Bot Token — на наступному кроці ви надішлете всі три до OpenClaw.

  </Step>

  <Step title="Дозвольте DM від учасників сервера">
    Щоб сполучення працювало, Discord має дозволяти вашому боту надсилати вам DM. Клацніть правою кнопкою **значок сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам DM. Залиште це ввімкненим, якщо хочете використовувати Discord DM з OpenClaw. Якщо плануєте використовувати лише канали гільдії, можете вимкнути DM після сполучення.

  </Step>

  <Step title="Безпечно встановіть токен бота (не надсилайте його в чат)">
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

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw Mac або зупинивши й запустивши знову процес `openclaw gateway run`.
    Для встановлень як керованого сервісу виконайте `openclaw gateway install` з оболонки, де наявний `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб сервіс міг розв’язати env SecretRef після перезапуску.
    Якщо ваш хост заблокований або обмежений за частотою запитів під час стартового пошуку застосунку Discord, установіть ID застосунку/клієнта Discord з Developer Portal, щоб запуск міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для облікового запису за замовчуванням або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кілька ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і сполучіть">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому. Якщо Discord — ваш перший канал, натомість скористайтеся вкладкою CLI / config.

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо віддаєте перевагу файловій конфігурації, установіть:

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

        Резервний env для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторіть запуск без `--dry-run`. Значення `token` у відкритому тексті підтримуються. Значення SecretRef також підтримуються для `channels.discord.token` через провайдерів env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord зберігайте токен і ID застосунку кожного бота в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тож задавайте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID застосунку.

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

  <Step title="Схваліть перше сполучення через DM">
    Дочекайтеся запуску gateway, а потім надішліть DM своєму боту в Discord. Він відповість кодом сполучення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код сполучення своєму агенту в наявному каналі:

        > "Approve this Discord pairing code: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Коди сполучення спливають через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через DM.

  </Step>
</Steps>

<Note>
Розв’язання токенів враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Якщо два ввімкнені облікові записи Discord розв’язуються в той самий токен бота, OpenClaw запускає лише один монітор gateway для цього токена. Токен із конфігурації має пріоритет над резервним env за замовчуванням; інакше перший увімкнений обліковий запис перемагає, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується саме для цього виклику. Це стосується дій надсилання та читання/перевірки, наприклад read/search/fetch/thread/pins/permissions. Політика облікового запису й налаштування повторних спроб усе одно надходять із вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли DM запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist гільдій">
    Це дає агенту змогу відповідати в будь-якому каналі вашого сервера, а не лише в DM.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Add my Discord Server ID `<server_id>` to the guild allowlist"
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
    За замовчуванням ваш агент відповідає в каналах гільдії лише коли його @згадують. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдії звичайні відповіді за замовчуванням публікуються автоматично. Для спільних кімнат, які завжди ввімкнені, увімкніть `messages.groupChat.visibleReplies: "message_tool"`, щоб агент міг спостерігати й публікувати лише тоді, коли вирішить, що відповідь у каналі корисна. Це найкраще працює з моделями останнього покоління з надійною роботою інструментів, такими як GPT 5.5. Події фонової кімнати залишаються тихими, якщо інструмент не надсилає. Див. [Події фонової кімнати](/uk/channels/ambient-room-events) для повної конфігурації режиму спостереження.

    Якщо Discord показує введення тексту, а журнали показують використання токенів, але повідомлення не опубліковано, перевірте, чи хід був налаштований як подія фонової кімнати або чи були ввімкнені видимі відповіді через інструмент повідомлень.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Allow my agent to respond on this server without having to be @mentioned"
      </Tab>
      <Tab title="Конфігурація">
        Установіть `requireMention: false` у конфігурації гільдії:

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

        Щоб вимагати надсилання через інструмент повідомлень для видимих відповідей групи/каналу, установіть `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Сплануйте пам’ять у каналах гільдії">
    За замовчуванням довготривала пам’ять (MEMORY.md) завантажується лише в DM-сесіях. Канали гільдії не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони впроваджуються в кожну сесію). Тримайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкування. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що підходить вашому робочому процесу.

## Runtime-модель

- Gateway володіє підключенням Discord.
- Маршрутизація відповідей є детермінованою: вхідні відповіді з Discord повертаються до Discord.
- Метадані гільдії/каналу Discord додаються до підказки моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель копіює цей конверт
  назад, OpenClaw вилучає скопійовані метадані з вихідних відповідей і з
  майбутнього контексту відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали гільдій ізольовано в ключах сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизованої сесії розмови.
- Доставка текстових оголошень Cron/Heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа й структуровані payload компонентів залишаються
  багатоповідомними, коли агент видає кілька доставних payload.

## Форумні канали

Форумні та медіаканали Discord приймають лише дописи в гілках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити гілку. Назва гілки використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити гілку напряму. Не передавайте `--message-id` для форумних каналів.

Приклад: надішліть до батьківського форуму, щоб створити гілку

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створіть форумну гілку

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самої гілки (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодій маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити використовувати кнопки, вибір і форми кілька разів, доки вони не завершать термін дії.

Щоб обмежити, хто може натиснути кнопку, задайте `allowedUsers` для цієї кнопки (ідентифікатори користувачів Discord, теги або `*`). Коли налаштовано, користувачі, які не збігаються, отримують ефемерну відмову.

Callback-и компонентів за замовчуванням завершують термін дії через 30 хвилин. Установіть `channels.discord.agentComponents.ttlMs`, щоб змінити час життя цього реєстру callback-ів для стандартного облікового запису Discord, або `channels.discord.accounts.<accountId>.agentComponents.ttlMs`, щоб перевизначити один обліковий запис у багатообліковому налаштуванні. Значення задається в мілісекундах, має бути додатним цілим числом і обмежене `86400000` (24 години). Довші TTL корисні для робочих процесів review або затвердження, де кнопки мають залишатися придатними до використання, але вони також розширюють вікно, у якому старе повідомлення Discord ще може запустити дію. Віддавайте перевагу найкоротшому TTL, який відповідає робочому процесу, і залишайте значення за замовчуванням, коли застарілі callback-и були б неочікуваними.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору є ефемерною, і використовувати її може лише користувач, який її викликав. Меню вибору Discord обмежені 25 опціями, тому додавайте записи `provider/*` до `agents.defaults.models`, коли хочете, щоб вибір показував динамічно виявлені моделі лише для вибраних провайдерів, як-от `openai` або `vllm`.

Вкладення файлів:

- Блоки `file` мають указувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
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
  <Tab title="Політика DM">
    `channels.discord.dmPolicy` керує доступом DM. `channels.discord.allowFrom` є канонічним allowlist DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` включав `"*"`)
    - `disabled`

    Якщо політика DM не відкрита, невідомі користувачі блокуються (або отримують запит на pairing у режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Для одного облікового запису `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застарілий `dm.allowFrom` не задані.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ідентифікатори зазвичай розв’язуються як ідентифікатори каналів, коли активне стандартне значення каналу, але ідентифікатори, перелічені в ефективному DM `allowFrom` облікового запису, трактуються як цілі користувацьких DM для сумісності.

  </Tab>

  <Tab title="Групи доступу">
    DM Discord і авторизація текстових команд можуть використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Назви груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, члени якої виражаються звичайним синтаксисом `allowFrom` кожного каналу, або `type: "discord.channelAudience"`, коли поточна аудиторія `ViewChannel` каналу Discord має динамічно визначати членство. Спільна поведінка груп доступу задокументована тут: [Групи доступу](/uk/channels/access-groups).

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

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник DM є членом налаштованої гільдії та наразі має ефективний дозвіл `ViewChannel` для налаштованого каналу після застосування ролей і перевизначень каналу.

    Приклад: дозволити будь-кому, хто може бачити `#maintainers`, надсилати DM боту, залишаючи DM закритими для всіх інших.

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

    Пошуки закривають доступ у разі збою. Якщо Discord повертає `Missing Access`, пошук учасника завершується невдало або канал належить іншій гільдії, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу на основі аудиторії каналу. DM не включають стан учасника гільдії, тому OpenClaw розв’язує учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Політика гільдії">
    Обробкою гільдій керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова лінія, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (`id` бажано, slug приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ідентифікатори) і `roles` (лише ідентифікатори ролей); якщо налаштовано будь-який із них, відправники дозволені, коли вони збігаються з `users` АБО `roles`
    - прямий збіг імен/тегів за замовчуванням вимкнено; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як режим сумісності на крайній випадок
    - імена/теги підтримуються для `users`, але ідентифікатори безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо для гільдії налаштовано `channels`, канали не зі списку забороняються
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

    Якщо ви лише задаєте `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, runtime fallback — `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Згадки та групові DM">
    Повідомлення гільдій за замовчуванням обмежені згадкою.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    Під час написання вихідних повідомлень Discord використовуйте канонічний синтаксис згадок: `<@USER_ID>` для користувачів, `<#CHANNEL_ID>` для каналів і `<@&ROLE_ID>` для ролей. Не використовуйте застарілу форму згадки псевдоніма `<@!USER_ID>`.

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ідентифікатори каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників Discord guild до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише для guild. Якщо прив’язка також задає інші поля match (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнено для Discord.
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` пропускає реєстрацію та очищення slash-команд Discord під час запуску. Раніше зареєстровані команди можуть залишатися видимими в Discord, доки ви не видалите їх із застосунку Discord.
- Авторизація нативних команд використовує ті самі allowlist-и/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не авторизовані; виконання все одно застосовує авторизацію OpenClaw і повертає "не авторизовано".

Див. [Slash-команди](/uk/tools/slash-commands) щодо каталогу команд і поведінки.

Типові налаштування slash-команд:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord підтримує теги відповіді у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне створення ланцюжків відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord за хід.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідна подія була debounced-пакетом із кількох повідомлень. Це корисно,
    коли ви хочете використовувати нативні відповіді переважно для неоднозначних
    швидких чатів, а не для кожного ходу з одним повідомленням.

    ID повідомлень показуються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Link previews">
    Discord за замовчуванням створює розширені link embeds для URL. OpenClaw за замовчуванням приглушує ці згенеровані embeds у вихідних повідомленнях Discord, тому URL, надіслані агентом, залишаються звичайними посиланнями, якщо ви явно не ввімкнете інше:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Установіть `channels.discord.accounts.<id>.suppressEmbeds`, щоб перевизначити один обліковий запис. Надсилання через message-tool агента також може передати `suppressEmbeds: false` для одного повідомлення. Явні payload-и Discord `embeds` не приглушуються типовим налаштуванням попереднього перегляду посилань.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` | `partial` | `block` | `progress` (за замовчуванням). `progress` тримає одну редаговану чернетку статусу й оновлює її прогресом інструментів до фінальної доставки; спільна стартова мітка є рухомим рядком, тож вона прокручується геть, як і решта, коли з’являється достатньо роботи. `streamMode` — застарілий runtime-псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на канонічний ключ.

    Установіть `channels.discord.streaming.mode` на `off`, щоб вимкнути редагування попереднього перегляду Discord. Якщо Discord block streaming явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного streaming.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` випускає фрагменти розміром із чернетку (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, обмежені `textChunkLimit`).
    - Фінали з медіа, помилками та явними відповідями скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.
    - Рядки інструментів/прогресу відображаються як компактні emoji + заголовок + деталь, коли доступно, наприклад `🛠️ Bash: run tests` або `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (за замовчуванням `false`) вмикає текст коментаря/преамбули асистента в тимчасовій чернетці прогресу. Коментар очищується перед показом, залишається тимчасовим і не змінює доставку фінальної відповіді.
    - `streaming.progress.maxLineChars` керує бюджетом попереднього перегляду прогресу на рядок. Проза скорочується на межах слів; деталі команд і шляхів зберігають корисні суфікси.
    - `streaming.preview.commandText` / `streaming.progress.commandText` керує деталями command/exec у компактних рядках прогресу: `raw` (за замовчуванням) або `status` (лише мітка інструмента).

    Приховати raw текст command/exec, зберігаючи компактні рядки прогресу:

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Streaming попереднього перегляду підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли `block` streaming явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного streaming.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Контекст історії guild:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка thread:

    - Discord threads маршрутизуються як channel sessions і успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Thread sessions успадковують вибір `/model` рівня сесії батьківського каналу як fallback лише для моделі; локальні для thread вибори `/model` усе одно мають пріоритет, а історія transcript батька не копіюється, якщо не ввімкнено успадкування transcript.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) вмикає для нових auto-threads початкове наповнення з parent transcript. Перевизначення для окремого облікового запису розміщені в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції message-tool можуть розв’язувати DM-цілі `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час fallback активації на етапі відповіді.

    Теми каналів вставляються як **ненадійний** контекст. Allowlists обмежують, хто може запустити агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord може прив’язати thread до цільової сесії, щоб подальші повідомлення в цьому thread продовжували маршрутизуватися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий thread до цілі субагента/сесії
    - `/unfocus` видалити прив’язку поточного thread
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити авто-unfocus через неактивність для сфокусованих прив’язок
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні типові значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSessions` керує автоматичним створенням/прив’язкою threads для `sessions_spawn({ thread: true })` і ACP thread spawns. За замовчуванням: `true`.
    - `defaultSpawnContext` керує нативним контекстом субагента для thread-bound spawns. За замовчуванням: `"fork"`.
    - Застарілі ключі `spawnSubagentSessions`/`spawnAcpSessions` мігруються через `openclaw doctor --fix`.
    - Якщо thread bindings вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки thread недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP агенти](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Для стабільних "always-on" ACP workspaces налаштуйте top-level typed ACP bindings, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або thread на місці та зберігає майбутні повідомлення в тій самій ACP сесії. Повідомлення thread успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або thread `/new` і `/reset` скидають ту саму ACP сесію на місці. Тимчасові thread bindings можуть перевизначати розв’язання цілі, поки активні.
    - `spawnSessions` обмежує створення/прив’язку дочірнього thread через `--thread auto|here`.

    Див. [ACP агенти](/uk/tools/acp-agents) щодо деталей поведінки прив’язки.

  </Accordion>

  <Accordion title="Reaction notifications">
    Режим сповіщень про реакції для окремого guild:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованої сесії Discord.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode emoji або назви custom emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Config writes">
    Записи конфігурації, ініційовані каналом, увімкнені за замовчуванням.

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

  <Accordion title="Gateway proxy">
    Маршрутизуйте WebSocket-трафік Discord Gateway і startup REST lookups (ID застосунку + розв’язання allowlist) через HTTP(S) proxy з `channels.discord.proxy`.
    Проксіювання WebSocket Discord Gateway є явним; WebSocket-з’єднання не успадковують ambient proxy environment variables від процесу Gateway. Startup REST lookups використовують цей proxy, коли налаштовано `channels.discord.proxy`.

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

    - списки дозволених можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують оригінальний ID повідомлення та обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо не задано `allowBots=true`

  </Accordion>

  <Accordion title="Псевдоніми вихідних згадок">
    Використовуйте `mentionAliases`, коли агентам потрібні детерміновані вихідні згадки для відомих користувачів Discord. Ключі — це handles без початкового `@`; значення — ID користувачів Discord. Невідомі handles, `@everyone`, `@here` і згадки всередині Markdown code spans залишаються без змін.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Конфігурація присутності">
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
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Приклад стрімінгу:

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
    - 1: Стрімить (потребує `activityUrl`)
    - 2: Слухає
    - 3: Дивиться
    - 4: Користувацька (використовує текст активності як стан статусу; emoji необов’язковий)
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

  <Accordion title="Підтвердження в Discord">
    Discord підтримує обробку підтверджень на основі кнопок у DM і може необов’язково публікувати запити на підтвердження в початковому каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні exec approvals, коли `enabled` не задано або має значення `"auto"` і можна розв’язати принаймні одного approver — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить exec approvers з канального `allowFrom`, застарілого `dm.allowFrom` або direct-message `defaultTo`. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт підтверджень.

    Для чутливих групових команд лише для owner, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на підтвердження та фінальні результати приватно. Спершу він пробує Discord DM, коли owner, який викликає команду, має owner-маршрут Discord; якщо він недоступний, OpenClaw повертається до першого доступного owner-маршруту з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на підтвердження видно в каналі. Лише розв’язані approvers можуть використовувати кнопки; інші користувачі отримують ephemeral відмову. Запити на підтвердження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо отримати з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відтворює спільні кнопки підтвердження, які використовують інші чат-канали. Нативний адаптер Discord переважно додає маршрутизацію approver DM і розсилання в канал.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має додавати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що чат-підтвердження недоступні або ручне підтвердження є єдиним шляхом.
    Якщо нативний runtime підтверджень Discord не активний, OpenClaw зберігає
    локальний детермінований запит `/approve <id> <decision>` видимим. Якщо
    runtime активний, але нативну картку неможливо доставити жодній цілі,
    OpenClaw надсилає резервне сповіщення в той самий чат з точною командою `/approve`
    з очікуваного підтвердження.

    Автентифікація Gateway і розв’язання підтверджень дотримуються спільного контракту клієнта Gateway (ID `plugin:` розв’язуються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Підтвердження типово спливають через 30 хвилин.

    Див. [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файлу), щоб задати зображення обкладинки запланованої події.

Шлюзи дій розташовані в `channels.discord.actions.*`.

Поведінка шлюзу за замовчуванням:

| Група дій                                                                                                                                                                | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                    | вимкнено         |
| moderation                                                                                                                                                               | вимкнено         |
| presence                                                                                                                                                                 | вимкнено         |

## UI Components v2

OpenClaw використовує компоненти Discord v2 для exec approvals і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (розширено; потребує створення component payload через інструмент discord), тоді як застарілі `embeds` лишаються доступними, але не рекомендуються.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Задавайте для окремого облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` керує тим, як довго надіслані callback-и компонентів Discord лишаються зареєстрованими (типово `1800000`, максимум `86400000`). Задавайте для окремого облікового запису через `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` ігноруються, коли присутні components v2.
- Звичайні попередні перегляди URL типово пригнічуються. Задайте `suppressEmbeds: false` у дії повідомлення, коли одне вихідне посилання має розгортатися.

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

Discord має дві окремі голосові поверхні: realtime **голосові канали** (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду waveform). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволених ролей/користувачів.
3. Запросіть бота з областями `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status`, щоб керувати сесіями. Команда використовує стандартного агента облікового запису й дотримується тих самих правил списку дозволених і групової політики, що й інші команди Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Щоб перевірити ефективні дозволи бота перед приєднанням, виконайте:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Приклад автоматичного приєднання:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Примітки:

- `voice.tts` перевизначає `messages.tts` лише для голосового відтворення `stt-tts`. Режими реального часу використовують `voice.realtime.speakerVoice`.
- `voice.mode` керує шляхом розмови. Стандартне значення — `agent-proxy`: голосовий фронтенд реального часу обробляє таймінг реплік, переривання та відтворення, делегує змістовну роботу маршрутизованому агенту OpenClaw через `openclaw_agent_consult` і розглядає результат як текстовий запит Discord від цього мовця. `stt-tts` зберігає старіший пакетний потік STT плюс TTS. `bidi` дає змогу моделі реального часу спілкуватися напряму, водночас надаючи `openclaw_agent_consult` для мозку OpenClaw.
- `voice.agentSession` керує тим, яка розмова OpenClaw отримує голосові репліки. Залиште це поле незаданим для власної сесії голосового каналу або задайте `{ mode: "target", target: "channel:<text-channel-id>" }`, щоб голосовий канал працював як розширення мікрофона/динаміка наявної сесії текстового каналу Discord, наприклад `#maintainers`.
- `voice.model` перевизначає мозок агента OpenClaw для голосових відповідей Discord і консультацій у реальному часі. Залиште це поле незаданим, щоб успадкувати модель маршрутизованого агента. Воно окреме від `voice.realtime.model`.
- `voice.followUsers` дає боту змогу приєднуватися, переміщатися та виходити з голосових каналів Discord разом із вибраними користувачами. Правила поведінки й приклади див. у розділі [Стеження за користувачами в голосі](#follow-users-in-voice).
- `agent-proxy` маршрутизує мовлення через `discord-voice`, що зберігає звичайну авторизацію власника/інструментів для мовця й цільової сесії, але приховує інструмент агента `tts`, оскільки відтворенням володіє голос Discord. За замовчуванням `agent-proxy` надає консультації повний доступ до інструментів, еквівалентний власнику, для мовців-власників (`voice.realtime.toolPolicy: "owner"`) і наполегливо віддає перевагу консультації з агентом OpenClaw перед змістовними відповідями (`voice.realtime.consultPolicy: "always"`). У цьому стандартному режимі `always` шар реального часу не промовляє автоматично заповнювач перед відповіддю консультації; він захоплює та транскрибує мовлення, а потім промовляє маршрутизовану відповідь OpenClaw. Якщо кілька примусових відповідей консультації завершуються, доки Discord ще відтворює першу відповідь, пізніші відповіді з точним мовленням ставляться в чергу до простою відтворення замість заміни мовлення посеред речення.
- У режимі `stt-tts` STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- У режимах реального часу `voice.realtime.provider`, `voice.realtime.model` і `voice.realtime.speakerVoice` налаштовують аудіосесію реального часу. Для OpenAI Realtime 2 плюс мозку Codex використовуйте `voice.realtime.model: "gpt-realtime-2"` і `voice.model: "openai/gpt-5.5"`.
- Голосові режими реального часу за замовчуванням включають невеликі профільні файли `IDENTITY.md`, `USER.md` і `SOUL.md` в інструкції провайдера реального часу, щоб швидкі прямі репліки зберігали ту саму ідентичність, прив'язку до користувача та персону, що й маршрутизований агент OpenClaw. Задайте `voice.realtime.bootstrapContextFiles` підмножиною, щоб налаштувати це, або `[]`, щоб вимкнути. Підтримувані файли початкового контексту реального часу обмежені цими профільними файлами; `AGENTS.md` залишається у звичайному контексті агента. Впроваджений профільний контекст не замінює `openclaw_agent_consult` для роботи з робочою областю, поточних фактів, пошуку в пам'яті або дій із підтримкою інструментів.
- У режимі реального часу OpenAI `agent-proxy` задайте `voice.realtime.requireWakeName: true`, щоб голос Discord у реальному часі мовчав, доки транскрипт не починається або не закінчується іменем активації. Налаштовані імена активації мають складатися з одного або двох слів. Якщо `voice.realtime.wakeNames` не задано, OpenClaw використовує маршрутизоване `name` агента плюс `OpenClaw`, а як запасний варіант — ідентифікатор агента плюс `OpenClaw`. Фільтрація за іменем активації вимикає автоматичну відповідь провайдера реального часу, маршрутизує прийняті репліки через шлях консультації з агентом OpenClaw і дає коротке голосове підтвердження, коли початкове ім'я активації розпізнано з часткової транскрипції до надходження фінального транскрипту.
- Провайдер реального часу OpenAI приймає поточні назви подій Realtime 2 і застарілі сумісні з Codex псевдоніми для подій вихідного аудіо та транскрипту, тому сумісні знімки провайдера можуть зміщуватися без втрати аудіо асистента.
- `voice.realtime.bargeIn` керує тим, чи події початку мовлення в Discord переривають активне відтворення реального часу. Якщо не задано, воно наслідує налаштування переривання вхідного аудіо провайдера реального часу.
- `voice.realtime.minBargeInAudioEndMs` керує мінімальною тривалістю відтворення асистента перед тим, як переривання OpenAI у реальному часі обрізає аудіо. Стандартно: `250`. Задайте `0` для негайного переривання в кімнатах із низьким відлунням або збільште значення для конфігурацій динаміків із сильним відлунням.
- Для голосу OpenAI під час відтворення в Discord задайте `voice.tts.provider: "openai"` і виберіть голос Text-to-speech у `voice.tts.providers.openai.speakerVoice`. `cedar` — хороший варіант із маскулінним звучанням у поточній моделі OpenAI TTS.
- Перевизначення `systemPrompt` для окремих каналів Discord застосовуються до голосових транскрибованих реплік для цього голосового каналу.
- Голосові транскрибовані репліки визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`) для команд і дій каналу, обмежених власником. Видимість інструментів агента відповідає налаштованій політиці інструментів для маршрутизованої сесії.
- Голос Discord є опціональним для конфігурацій лише з текстом; задайте `channels.discord.voice.enabled=true` (або збережіть наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на intent стану голосу. Залиште це поле незаданим, щоб intent відповідав фактичному ввімкненню голосу.
- Якщо `voice.autoJoin` має кілька записів для тієї самої гільдії, OpenClaw приєднується до останнього налаштованого каналу для цієї гільдії.
- `voice.allowedChannels` — необов'язковий список дозволеного перебування. Залиште його незаданим, щоб дозволити `/vc join` у будь-який авторизований голосовий канал Discord. Коли задано, `/vc join`, автоматичне приєднання під час запуску та переміщення голосового стану бота обмежуються переліченими записами `{ guildId, channelId }`. Задайте порожній масив, щоб заборонити всі голосові приєднання Discord. Якщо Discord перемістить бота за межі списку дозволених, OpenClaw вийде з цього каналу й повторно приєднається до налаштованої цілі автоматичного приєднання, коли вона доступна.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються напряму до параметрів приєднання `@discordjs/voice`.
- Стандартні значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо не задано.
- OpenClaw використовує вбудований кодек `libopus-wasm` для приймання голосу Discord і відтворення необробленого PCM у реальному часі. Він постачається із зафіксованою збіркою libopus WebAssembly і не потребує нативних додатків opus.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання. Стандартно: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, доки від'єднана голосова сесія почне повторне підключення, перш ніж знищити її. Стандартно: `15000`.
- У режимі `stt-tts` голосове відтворення не зупиняється лише тому, що інший користувач починає говорити. Щоб уникнути циклів зворотного зв'язку, OpenClaw ігнорує нове голосове захоплення, доки відтворюється TTS; говоріть після завершення відтворення для наступної репліки. Режими реального часу пересилають початок мовлення як сигнали переривання до провайдера реального часу.
- У режимах реального часу відлуння з динаміків у відкритий мікрофон може виглядати як переривання й зупиняти відтворення. Для кімнат Discord із сильним відлунням задайте `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, щоб OpenAI не переривав автоматично відповідь за вхідним аудіо. Додайте `voice.realtime.bargeIn: true`, якщо все ще хочете, щоб події початку мовлення Discord переривали активне відтворення. Міст реального часу OpenAI ігнорує обрізання відтворення, коротші за `voice.realtime.minBargeInAudioEndMs`, як імовірне відлуння/шум і записує їх як пропущені замість очищення відтворення Discord.
- `voice.captureSilenceGraceMs` керує тим, як довго OpenClaw чекає після того, як Discord повідомляє, що мовець зупинився, перш ніж фіналізувати цей аудіосегмент для STT. Стандартно: `2000`; збільште це значення, якщо Discord розбиває звичайні паузи на уривчасті часткові транскрипти.
- Коли вибраним провайдером TTS є ElevenLabs, голосове відтворення Discord використовує потоковий TTS і починається з потоку відповіді провайдера. Провайдери без підтримки потокового передавання повертаються до шляху синтезованого тимчасового файлу.
- OpenClaw також відстежує збої розшифрування приймання та автоматично відновлюється, виходячи з голосового каналу й повторно приєднуючись до нього після повторюваних збоїв у короткому вікні.
- Якщо після оновлення журнали приймання повторно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінія `@discordjs/voice` містить виправлення заповнення з upstream із PR discord.js #11449, яке закрило issue discord.js #11419.
- Події приймання `The operation was aborted` очікувані, коли OpenClaw фіналізує захоплений сегмент мовця; це докладна діагностика, а не попередження.
- Докладні журнали голосу Discord включають обмежений однорядковий попередній перегляд STT-транскрипту для кожного прийнятого сегмента мовця, тож налагодження показує і сторону користувача, і сторону відповіді агента без вивантаження необмеженого тексту транскрипту.
- У режимі `agent-proxy` примусовий запасний шлях консультації пропускає ймовірно неповні фрагменти транскрипту, як-от текст, що закінчується на `...` або кінцевий сполучник на кшталт `and`, а також очевидні неакційні завершення на кшталт “be right back” або “bye”. Журнали показують `forced agent consult skipped reason=...`, коли це запобігає застарілій відповіді з черги.

### Стеження за користувачами в голосі

Використовуйте `voice.followUsers`, коли хочете, щоб голосовий бот Discord залишався з одним або кількома відомими користувачами Discord замість приєднання до фіксованого каналу під час запуску або очікування `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Поведінка:

- `followUsers` приймає необроблені ідентифікатори користувачів Discord і значення `discord:<id>`. OpenClaw нормалізує обидві форми перед зіставленням подій стану голосу.
- `followUsersEnabled` за замовчуванням має значення `true`, коли налаштовано `followUsers`. Задайте `false`, щоб зберегти список, але зупинити автоматичне голосове стеження.
- Коли відстежуваний користувач приєднується до дозволеного голосового каналу, OpenClaw приєднується до цього каналу. Коли користувач переміщується, OpenClaw переміщується разом із ним. Коли активний відстежуваний користувач від'єднується, OpenClaw виходить.
- Якщо кілька відстежуваних користувачів перебувають в одній гільдії, і активний відстежуваний користувач виходить, OpenClaw переміщується до каналу іншого відстежуваного користувача перед виходом із гільдії. Якщо кілька відстежуваних користувачів переміщуються одночасно, перемагає остання спостережена подія стану голосу.
- `allowedChannels` усе ще застосовується. Відстежуваний користувач у забороненому каналі ігнорується, а сесія, що належить стеженню, переміщується до іншого відстежуваного користувача або виходить.
- OpenClaw узгоджує пропущені події стану голосу під час запуску та з обмеженим інтервалом. Узгодження вибірково перевіряє налаштовані гільдії та обмежує REST-запити на один запуск, тому дуже великі списки `followUsers` можуть потребувати більше ніж одного інтервалу для збіжності.
- Якщо Discord або адміністратор переміщує бота, поки він стежить за користувачем, OpenClaw перебудовує голосову сесію та зберігає право власності стеження, коли місце призначення дозволене. Якщо бота переміщено за межі `allowedChannels`, OpenClaw виходить і повторно приєднується до налаштованої цілі, коли така існує.
- Відновлення приймання DAVE може вийти з того самого каналу й повторно приєднатися до нього після повторюваних збоїв розшифрування. Сесії, що належать стеженню, зберігають право власності стеження на цьому шляху відновлення, тому пізніше від'єднання відстежуваного користувача все одно залишає канал.

Виберіть між режимами приєднання:

- Використовуйте `followUsers` для персональних або операторських налаштувань, де бот має автоматично бути в голосі, коли ви там.
- Використовуйте `autoJoin` для ботів у фіксованих кімнатах, які мають бути присутніми, навіть коли жоден відстежуваний користувач не перебуває в голосі.
- Використовуйте `/vc join` для одноразових приєднань або кімнат, де автоматична голосова присутність була б несподіваною.

Голосовий кодек Discord:

- Журнали отримання голосу показують `discord voice: opus decoder: libopus-wasm`.
- Відтворення в реальному часі кодує сирий стерео PCM 48 кГц в Opus за допомогою того самого вбудованого пакета `libopus-wasm`, перш ніж передати пакети до `@discordjs/voice`.
- Відтворення файлів і потоків провайдера транскодує аудіо в сирий стерео PCM 48 кГц за допомогою ffmpeg, а потім використовує `libopus-wasm` для потоку пакетів Opus, що надсилається до Discord.

Конвеєр STT плюс TTS:

- Захоплення Discord PCM перетворюється на тимчасовий файл WAV.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхідний потік і маршрутизацію Discord, тоді як LLM відповіді запускається з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернути текст, оскільки голос Discord відповідає за фінальне відтворення TTS.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; провайдери з підтримкою потокового передавання подають аудіо безпосередньо в програвач, інакше отриманий аудіофайл відтворюється в приєднаному каналі.

Приклад сеансу голосового каналу agent-proxy за замовчуванням:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Без блока `voice.agentSession` кожен голосовий канал отримує власний маршрутизований сеанс OpenClaw. Наприклад, `/vc join channel:234567890123456789` говорить із сеансом для цього голосового каналу Discord. Модель реального часу є лише голосовим фронтендом; змістовні запити передаються налаштованому агенту OpenClaw. Якщо модель реального часу створює фінальний транскрипт без виклику інструмента консультації, OpenClaw примусово виконує консультацію як резервний варіант, щоб поведінка за замовчуванням усе ще була схожа на розмову з агентом.

Приклад застарілого STT плюс TTS:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Приклад двонапрямного Realtime:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Голос як розширення наявного сеансу каналу Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

У режимі `agent-proxy` бот приєднується до налаштованого голосового каналу, але ходи агента OpenClaw використовують звичайний маршрутизований сеанс і агента цільового каналу. Голосовий сеанс реального часу промовляє повернений результат назад у голосовий канал. Агент-наглядач усе ще може використовувати звичайні інструменти повідомлень відповідно до своєї політики інструментів, зокрема надсилати окреме повідомлення Discord, якщо це правильна дія.

Поки делегований запуск OpenClaw активний, нові голосові транскрипти Discord розглядаються як керування живим запуском перед початком іншого ходу агента. Фрази на кшталт "status", "cancel that", "use the smaller fix" або "when you're done also check tests" класифікуються як статус, скасування, спрямування або подальший ввід для активного сеансу. Результати статусу, скасування, прийнятого спрямування та подальших дій промовляються назад у голосовий канал, щоб абонент знав, чи OpenClaw обробив запит.

Корисні форми цілі:

- `target: "channel:123456789012345678"` маршрутизує через сеанс текстового каналу Discord.
- `target: "123456789012345678"` розглядається як ціль каналу.
- `target: "dm:123456789012345678"` або `target: "user:123456789012345678"` маршрутизує через відповідний сеанс прямого повідомлення.

Приклад OpenAI Realtime із сильним відлунням:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Використовуйте це, коли модель чує власне відтворення Discord через відкритий мікрофон, але ви все одно хочете переривати її мовленням. OpenClaw не дає OpenAI автоматично перериватися на сирому вхідному аудіо, тоді як `bargeIn: true` дозволяє подіям початку мовлення в Discord і вже активному аудіо мовця скасовувати активні відповіді реального часу до того, як наступний захоплений хід дійде до OpenAI. Дуже ранні сигнали втручання з `audioEndMs` нижче `minBargeInAudioEndMs` розглядаються як імовірне відлуння/шум і ігноруються, щоб модель не обривалася на першому кадрі відтворення.

Очікувані голосові журнали:

- Під час приєднання: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Під час запуску реального часу: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Під час аудіо мовця: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` і `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Під час пропущеного застарілого мовлення: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` або `reason=non-actionable-closing ...`
- Після завершення відповіді реального часу: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Під час зупинки/скидання відтворення: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Під час консультації реального часу: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Під час відповіді агента: `discord voice: agent turn answer ...`
- Під час поставленого в чергу точного мовлення: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, після чого `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Під час виявлення втручання: `discord voice: realtime barge-in detected source=speaker-start ...` або `discord voice: realtime barge-in detected source=active-speaker-audio ...`, після чого `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Під час переривання реального часу: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, після чого або `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, або `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Під час ігнорування відлуння/шуму: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Коли втручання вимкнено: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Під час неактивного відтворення: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Щоб налагодити обрізане аудіо, читайте голосові журнали реального часу як часову шкалу:

1. `realtime audio playback started` означає, що Discord почав відтворювати аудіо асистента. Із цього моменту міст починає рахувати вихідні фрагменти асистента, байти Discord PCM, байти реального часу провайдера та тривалість синтезованого аудіо.
2. `realtime speaker turn opened` позначає, що мовець Discord став активним. Якщо відтворення вже активне й `bargeIn` увімкнено, після цього може з’явитися `barge-in detected source=speaker-start`.
3. `realtime input audio started` позначає перший фактичний аудіокадр, отриманий для цього ходу мовця. `outputActive=true` або ненульове `outputAudioMs` тут означає, що мікрофон надсилає ввід, поки відтворення асистента все ще активне.
4. `barge-in detected source=active-speaker-audio` означає, що OpenClaw побачив живе аудіо мовця, поки відтворення асистента було активним. Це корисно для відрізнення справжнього переривання від події початку мовлення Discord без корисного аудіо.
5. `barge-in requested reason=...` означає, що OpenClaw попросив провайдера реального часу скасувати або обрізати активну відповідь. Він містить `outputAudioMs`, `outputActive` і `playbackChunks`, щоб ви могли бачити, скільки аудіо асистента фактично відтворилося до переривання.
6. `realtime audio playback stopped reason=...` є локальною точкою скидання відтворення Discord. Причина вказує, хто зупинив відтворення: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` або `session-close`.
7. `realtime speaker turn closed` підсумовує захоплений вхідний хід. `chunks=0` або `hasAudio=false` означає, що хід мовця відкрився, але жодне придатне аудіо не дійшло до моста реального часу. `interruptedPlayback=true` означає, що цей вхідний хід перетнувся з виводом асистента й запустив логіку втручання.

Корисні поля:

- `outputAudioMs`: тривалість аудіо асистента, згенерованого провайдером реального часу до цього рядка журналу.
- `audioMs`: тривалість аудіо асистента, яку OpenClaw порахував до зупинки відтворення.
- `elapsedMs`: реальний час між відкриттям і закриттям потоку відтворення або ходу мовця.
- `discordBytes`: байти стерео PCM 48 кГц, надіслані до голосу Discord або отримані від нього.
- `realtimeBytes`: байти PCM у форматі провайдера, надіслані до провайдера реального часу або отримані від нього.
- `playbackChunks`: фрагменти аудіо асистента, переслані до Discord для активної відповіді.
- `sinceLastAudioMs`: проміжок між останнім захопленим аудіокадром мовця та закриттям ходу мовця.

Поширені шаблони:

- Негайне обрізання з `source=active-speaker-audio`, малим `outputAudioMs` і тим самим користувачем поруч зазвичай вказує на відлуння динаміка, що потрапляє в мікрофон. Збільште `voice.realtime.minBargeInAudioEndMs`, зменште гучність динаміків, використовуйте навушники або задайте `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, після якого йде `speaker turn closed ... hasAudio=false`, означає, що Discord повідомив про початок мовлення, але аудіо не дійшло до OpenClaw. Це може бути короткочасна голосова подія Discord, поведінка шумового порога або клієнт, який на мить активував мікрофон.
- `audio playback stopped reason=stream-close` без близького втручання або `provider-clear-audio` означає, що локальний потік відтворення Discord несподівано завершився. Перевірте попередні журнали провайдера та програвача Discord.
- `capture ignored during playback (barge-in disabled)` означає, що OpenClaw навмисно відкинув ввід, поки аудіо асистента було активним. Увімкніть `voice.realtime.bargeIn`, якщо хочете, щоб мовлення переривало відтворення.
- `barge-in ignored ... outputActive=false` означає, що VAD Discord або провайдера повідомив про мовлення, але OpenClaw не мав активного відтворення для переривання. Це не повинно обрізати аудіо.

Облікові дані визначаються окремо для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio`, автентифікація TTS для `messages.tts`/`voice.tts` і автентифікація провайдера реального часу для `voice.realtime.providers` або звичайної конфігурації автентифікації провайдера.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвилі й потребують аудіо OGG/Opus. OpenClaw генерує хвилю автоматично, але потребує `ffmpeg` і `ffprobe` на хості Gateway для перевірки та перетворення.

- Укажіть **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби перетворює його на OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли залежите від розпізнавання користувачів/учасників
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - перевірте `groupPolicy`
    - перевірте allowlist guild у `channels.discord.guilds`
    - якщо існує мапа `channels` для guild, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Типові причини:

    - `groupPolicy="allowlist"` без відповідного allowlist guild/channel
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправника заблоковано allowlist `users` для guild/channel

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Параметри черги Discord gateway:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою listener Discord gateway, а не тривалістю ходу агента

    Discord не застосовує тайм-аут, власником якого є канал, до поставлених у чергу ходів агента. Message listeners передають роботу негайно, а поставлені в чергу запуски Discord зберігають порядок у межах сесії, доки життєвий цикл сесії/інструмента/runtime не завершить або не перерве роботу.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої повертаються до стандартного URL gateway Discord і обмежуються за частотою в журналах.

    Параметри тайм-ауту метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне env-значення, коли config не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - стандартно: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw очікує подію `READY` від gateway Discord під час запуску та після повторних підключень runtime. Налаштування з кількома обліковими записами й рознесенням старту можуть потребувати довшого стартового вікна READY, ніж стандартне.

    Параметри тайм-ауту READY:

    - запуск, один обліковий запис: `channels.discord.gatewayReadyTimeoutMs`
    - запуск, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - резервне env-значення для запуску, коли config не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - стандартно для запуску: `15000` (15 секунд), максимум: `120000`
    - runtime, один обліковий запис: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - резервне env-значення для runtime, коли config не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - стандартно для runtime: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте slug-ключі, зіставлення в runtime все ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення pairing у режимі `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути зациклення.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

    OpenClaw також постачає спільний [захист від циклів ботів](/uk/channels/bot-loop-protection). Щоразу, коли `allowBots` дозволяє повідомленням, створеним ботами, доходити до dispatch, Discord зіставляє вхідну подію з фактами `(account, channel, bot pair)`, а загальний pair guard пригнічує пару після перевищення налаштованого бюджету подій. Guard запобігає неконтрольованим циклам між двома ботами, які раніше доводилося зупиняти обмеженнями частоти Discord; він не впливає на розгортання з одним ботом або одноразові відповіді ботів, що залишаються в межах бюджету.

    Стандартні налаштування (активні, коли задано `allowBots`):

    - `maxEventsPerWindow: 20` -- пара ботів може обмінятися 20 повідомленнями в межах ковзного вікна
    - `windowSeconds: 60` -- довжина ковзного вікна
    - `cooldownSeconds: 60` -- після спрацювання бюджету кожне додаткове повідомлення bot-to-bot у будь-якому напрямку відкидається протягом однієї хвилини

    Налаштуйте спільне стандартне значення один раз у `channels.defaults.botLoopProtection`, а потім перевизначте Discord, коли легітимному workflow потрібен більший запас. Пріоритет такий:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - вбудовані стандартні значення

    Discord використовує загальні ключі `maxEventsPerWindow`, `windowSeconds` і `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була наявна логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (стандартно)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (стандарт upstream) і налаштовуйте лише за потреби
    - стежте за журналами на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали й порівняйте їх з upstream-історією приймання DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- запуск/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставлення: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повтор: `mediaMaxMb` (обмежує вихідні завантаження Discord, стандартно `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека й експлуатація

- Ставтеся до токенів ботів як до секретів (`DISCORD_BOT_TOKEN` бажано в керованих середовищах).
- Надавайте Discord дозволи з найменшими необхідними привілеями.
- Якщо deploy/state команд застаріли, перезапустіть gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Пов’яжіть користувача Discord із gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка групового чату й allowlist.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте guilds і канали з агентами.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
