---
read_when:
    - Робота над функціями каналу Discord
summary: Стан підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-05-06T12:48:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11cc911dbc569db7a31ce4a16de167bc8ea771d1dd7842cb151f666f3cb9285b
    source_path: channels/discord.md
    workflow: 16
---

Готовий для приватних повідомлень і каналів гільдій через офіційний Discord gateway.

<CardGroup cols={3}>
  <Card title="Спарювання" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Discord за замовчуванням запускаються в режимі спарювання.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити нову програму з ботом, додати бота на свій сервер і спарувати його з OpenClaw. Рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть програму Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть її, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Задайте для **Username** ім'я, яким ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Залишаючись на сторінці **Bot**, прокрутіть до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов'язково)
    - **Server Members Intent** (рекомендовано; обов'язково для allowlist ролей і зіставлення імен з ID)
    - **Presence Intent** (необов'язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається".
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він скоро знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення і додайте бота на сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на свій сервер.

    Прокрутіть до **OAuth2 URL Generator** і ввімкніть:

    - `bot`
    - `applications.commands`

    Нижче з'явиться розділ **Bot Permissions**. Увімкніть щонайменше:

    **General Permissions**
      - Перегляд каналів
    **Text Permissions**
      - Надсилання повідомлень
      - Читання історії повідомлень
      - Вбудовування посилань
      - Додавання файлів
      - Додавання реакцій (необов'язково)

    Це базовий набір для звичайних текстових каналів. Якщо плануєте публікувати в гілках Discord, зокрема у сценаріях форумів або медіаканалів, які створюють або продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Поверніться в програму Discord. Вам потрібно ввімкнути Developer Mode, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч з аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші **server icon** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші **own avatar** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** поруч із Bot Token — на наступному кроці ви надішлете всі три в OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб спарювання працювало, Discord має дозволити вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші **server icon** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дає учасникам сервера (зокрема ботам) змогу надсилати вам приватні повідомлення. Залиште це ввімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, можете вимкнути приватні повідомлення після спарювання.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чаті)">
    Токен вашого бота Discord є секретом (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

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

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через програму OpenClaw для Mac або зупинивши й повторно запустивши процес `openclaw gateway run`.
    Для встановлень керованого сервісу запустіть `openclaw gateway install` з оболонки, де присутній `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб сервіс міг розв'язати SecretRef з env після перезапуску.
    Якщо ваш хост заблокований або обмежений Discord під час стартового пошуку програми, задайте ID програми/клієнта Discord з Developer Portal, щоб запуск міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для стандартного облікового запису або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кілька ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте спарювання">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже задав токен мого бота Discord у конфігурації. Завершіть налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
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

        Env-резерв для стандартного облікового запису:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторно запустіть без `--dry-run`. Значення `token` у відкритому тексті підтримуються. Значення SecretRef також підтримуються для `channels.discord.token` через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord зберігайте токен кожного бота й ID програми в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тому задавайте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID програми.

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

  <Step title="Схваліть перше спарювання через приватні повідомлення">
    Дочекайтеся, поки gateway запуститься, а потім напишіть своєму боту в Discord приватне повідомлення. Він відповість кодом спарювання.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код спарювання своєму агенту в наявному каналі:

        > "Схвали цей код спарювання Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Коди спарювання спливають через 1 годину.

    Тепер ви маєте мати змогу спілкуватися зі своїм агентом у Discord через приватні повідомлення.

  </Step>
</Steps>

<Note>
Розв'язання токена враховує обліковий запис. Значення токена з конфігурації мають пріоритет над env-резервом. `DISCORD_BOT_TOKEN` використовується лише для стандартного облікового запису.
Якщо два ввімкнені облікові записи Discord розв'язуються в той самий токен бота, OpenClaw запускає лише один монітор gateway для цього токена. Токен із конфігурації має пріоритет над стандартним env-резервом; інакше перемагає перший увімкнений обліковий запис, а дубльований обліковий запис позначається як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується саме для цього виклику. Це застосовується до дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису й налаштування повторних спроб усе одно беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли приватні повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви і ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist гільдії">
    Це дає вашому агенту змогу відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Discord Server ID `<server_id>` до allowlist гільдії"
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

  <Step title="Дозвольте відповіді без @згадки">
    За замовчуванням ваш агент відповідає в каналах гільдії лише тоді, коли його @згадують. Для приватного сервера ви, ймовірно, хочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдії звичайні фінальні відповіді асистента за замовчуванням залишаються приватними. Видимий вивід Discord треба надсилати явно за допомогою інструмента `message`, тому агент може за замовчуванням спостерігати й публікувати лише тоді, коли вирішить, що відповідь у каналі корисна.

    Це означає, що вибрана модель має надійно викликати інструменти. Якщо Discord показує набір тексту, а журнали показують використання токенів, але повідомлення не опубліковано, перевірте журнал сесії на наявність тексту асистента з `didSendViaMessagingTool: false`. Це означає, що модель створила приватну фінальну відповідь замість виклику `message(action=send)`. Перейдіть на сильнішу модель для виклику інструментів або використайте конфігурацію нижче, щоб відновити застарілі автоматичні фінальні відповіді.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без потреби бути @згаданим"
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

        Щоб відновити застарілі автоматичні фінальні відповіді для групових/канальних кімнат, задайте `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Сплануйте пам'ять у каналах гільдії">
    За замовчуванням довготривала пам'ять (MEMORY.md) завантажується лише в сесіях приватних повідомлень. Канали гільдії не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст з MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони ін'єктуються в кожну сесію). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них на вимогу за допомогою інструментів пам'яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкуватися. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що пасує вашому робочому процесу.

## Модель runtime

- Gateway керує підключенням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді з Discord повертаються до Discord.
- Метадані гільдії/каналу Discord додаються до підказки моделі як недовірений
  контекст, а не як видимий користувачеві префікс відповіді. Якщо модель скопіює цей конверт
  назад, OpenClaw видаляє скопійовані метадані з вихідних відповідей і з
  майбутнього контексту відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують спільну основну сесію агента (`agent:main:main`).
- Канали гільдій ізольовані ключами сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM ігноруються за замовчуванням (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас усе ще передаючи `CommandTargetSessionKey` до маршрутизованої сесії розмови.
- Доставлення текстових оголошень cron/Heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа та структуровані компонентні payload-и залишаються
  багато-повідомними, коли агент створює кілька payload-ів, придатних для доставлення.

## Канали форумів

Канали форумів і медіа Discord приймають лише дописи в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення батьківському форуму (`channel:<forumId>`), щоб автоматично створити тред. Заголовок треду використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити тред напряму. Не передавайте `--message-id` для каналів форумів.

Приклад: надіслати до батьківського форуму, щоб створити тред

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити тред форуму

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самого треду (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агентів. Використовуйте інструмент повідомлень із payload-ом `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити використовувати кнопки, меню вибору та форми кілька разів, доки вони не спливуть.

Щоб обмежити, хто може натискати кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Коли це налаштовано, користувачі без збігу отримують ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадними списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору ефемерна, і використовувати її може лише користувач, який її викликав.

Вкладення файлів:

- Блоки `file` мають указувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
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

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` керує доступом до DM. `channels.discord.allowFrom` є канонічним списком дозволених для DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` включав `"*"`)
    - `disabled`

    Якщо політика DM не відкрита, невідомі користувачі блокуються (або отримують запит на сполучення в режимі `pairing`).

    Пріоритетність для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Для одного облікового запису `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застарілий `dm.allowFrom` не задані.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Формат цілі DM для доставлення:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID зазвичай розпізнаються як ID каналів, коли активний типовий канал, але ID, перелічені в ефективному DM `allowFrom` облікового запису, трактуються як цілі користувацьких DM для сумісності.

  </Tab>

  <Tab title="DM access groups">
    DM Discord можуть використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Назви груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, учасники якої виражені у звичайному синтаксисі `allowFrom` кожного каналу, або `type: "discord.channelAudience"`, коли поточна аудиторія `ViewChannel` каналу Discord має динамічно визначати членство. Спільну поведінку груп доступу задокументовано тут: [Групи доступу](/uk/channels/access-groups).

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

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник DM є учасником налаштованої гільдії та наразі має ефективний дозвіл `ViewChannel` для налаштованого каналу після застосування ролей і перевизначень каналу.

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

    Ви можете поєднувати динамічні та статичні записи:

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

    Пошуки закривають доступ у разі помилки. Якщо Discord повертає `Missing Access`, пошук учасника завершується невдало або канал належить іншій гільдії, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу на основі аудиторії каналу. DM не містять стану учасника гільдії, тому OpenClaw розпізнає учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Guild policy">
    Обробкою гільдій керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова лінія, коли існує `channels.discord`, це `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (перевага за `id`, slug приймається)
    - необов’язкові списки дозволених відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволені, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення імен/тегів вимкнене за замовчуванням; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо гільдія має налаштовані `channels`, канали не зі списку забороняються
    - якщо гільдія не має блоку `channels`, усі канали в цій дозволеній гільдії дозволені

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

    Якщо ви лише встановили `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, runtime fallback — `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
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
    - необов’язковий список дозволених через `dm.groupChannels` (ID каналів або slug-и)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише гільдії. Якщо прив’язка також задає інші поля зіставлення (наприклад `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнений для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` пропускає реєстрацію та очищення slash-команд Discord під час запуску. Раніше зареєстровані команди можуть залишатися видимими в Discord, доки ви не видалите їх із застосунку Discord.
- Авторизація нативних команд використовує ті самі списки дозволених і політики Discord, що й звичайна обробка повідомлень.
- Команди можуть усе ще бути видимими в інтерфейсі Discord для користувачів без авторизації; виконання все одно застосовує авторизацію OpenClaw і повертає "не авторизовано".

Див. [Slash-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Стандартні налаштування slash-команд:

- `ephemeral: true`

## Подробиці функцій

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

    Примітка: `off` вимикає неявне об’єднання відповідей у гілки. Явні теги `[[reply_to_*]]` усе ще враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord для цього ходу.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був дебаунсованим пакетом із кількох повідомлень. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних бурхливих чатів, а не для кожного
    ходу з одним повідомленням.

    Ідентифікатори повідомлень відображаються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` зберігає одну редаговану чернетку статусу й оновлює її перебігом інструментів до фінального доставлення; `streamMode` є застарілим псевдонімом середовища виконання. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на канонічний ключ.

    За замовчуванням залишається `off`, бо редагування попереднього перегляду Discord швидко наштовхуються на ліміти частоти, коли кілька ботів або Gateway спільно використовують один обліковий запис.

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
    - `block` випускає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, обмежені `textChunkLimit`).
    - Медіа, помилки та фінальні відповіді з явною відповіддю скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи повторно використовують оновлення інструментів/перебігу повідомлення попереднього перегляду.
    - `streaming.preview.commandText` / `streaming.progress.commandText` керує деталізацією команд/виконання в компактних рядках перебігу: `raw` (за замовчуванням) або `status` (лише мітка інструмента).

    Приховати сирий текст команд/виконання, зберігаючи компактні рядки перебігу:

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

    Потоковий попередній перегляд підтримує лише текст; медіавідповіді повертаються до звичайного доставлення. Коли потокове передавання `block` явно ввімкнене, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервний варіант: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сеанси каналів і успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси гілок успадковують вибір `/model` на рівні сеансу батьківського каналу лише як резервний варіант моделі; локальні вибори `/model` у гілці все одно мають пріоритет, а історія транскрипту батьківського каналу не копіюється, якщо не ввімкнене успадкування транскрипту.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) дає згоду на засівання нових автогілок із батьківського транскрипту. Перевизначення для облікового запису розміщені в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть розв’язувати цілі приватних повідомлень `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів додаються як **ненадійний** контекст. Списки дозволених визначають, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord може прив’язати гілку до цілі сеансу, щоб подальші повідомлення в цій гілці й далі маршрутизувалися до того самого сеансу (зокрема сеансів підагентів).

    Команди:

    - `/focus <target>` прив’язати поточну/нову гілку до цілі підагента/сеансу
    - `/unfocus` вилучити прив’язку поточної гілки
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокуса через неактивність для сфокусованих прив’язок
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

    - `session.threadBindings.*` задає глобальні значення за замовчуванням.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSessions` керує автоматичним створенням/прив’язуванням гілок для `sessions_spawn({ thread: true })` і створень гілок ACP. За замовчуванням: `true`.
    - `defaultSpawnContext` керує нативним контекстом підагента для створень, прив’язаних до гілки. За замовчуванням: `"fork"`.
    - Застарілі ключі `spawnSubagentSessions`/`spawnAcpSessions` мігруються через `openclaw doctor --fix`.
    - Якщо прив’язки гілок вимкнені для облікового запису, `/focus` і пов’язані операції прив’язування гілок недоступні.

    Див. [Підагенти](/uk/tools/subagents), [Агенти ACP](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Для стабільних робочих просторів ACP, які працюють завжди, налаштуйте типізовані прив’язки ACP верхнього рівня, що націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або гілку на місці й утримує майбутні повідомлення в тому самому сеансі ACP. Повідомлення гілки успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або гілці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив’язки гілок можуть перевизначати розв’язання цілі, поки активні.
    - `spawnSessions` обмежує створення/прив’язування дочірніх гілок через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents) для подробиць поведінки прив’язок.

  </Accordion>

  <Accordion title="Reaction notifications">
    Режим сповіщень про реакції для гільдії:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованого сеансу Discord.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode-емодзі або назви кастомних емодзі.
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
    Маршрутизуйте WebSocket-трафік Gateway Discord і стартові REST-пошуки (ID застосунку + розв’язання списку дозволених) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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

  <Accordion title="PluralKit support">
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
    - відображувані імена учасників зіставляються за назвою/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують оригінальний ID повідомлення й обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення обробляються як повідомлення ботів і відкидаються, якщо `allowBots=true` не задано

  </Accordion>

  <Accordion title="Outbound mention aliases">
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

  <Accordion title="Presence configuration">
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

    Приклад активності (кастомний статус є стандартним типом активності):

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

    Приклад потокового передавання:

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
    - 4: Кастомна (використовує текст активності як стан статусу; емодзі необов’язковий)
    - 5: Змагається

    Приклад автоматичної присутності (сигнал стану середовища виконання):

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

    Автоматична присутність зіставляє доступність виконання зі статусом Discord: справний => online, погіршений або невідомий => idle, вичерпаний або недоступний => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Підтвердження в Discord">
    Discord підтримує обробку підтверджень через кнопки в приватних повідомленнях і може необов’язково публікувати запити на підтвердження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає власні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного підтверджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить підтверджувачів exec із канального `allowFrom`, застарілого `dm.allowFrom` або `defaultTo` для приватних повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як власний клієнт підтверджень.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на підтвердження та фінальні результати приватно. Спочатку він пробує Discord DM, коли власник, що викликає команду, має маршрут власника Discord; якщо це недоступно, він повертається до першого доступного маршруту власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на підтвердження видимий у каналі. Кнопки можуть використовувати лише визначені підтверджувачі; інші користувачі отримують ефемерну відмову. Запити на підтвердження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сеансу, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки підтвердження, які використовують інші чат-канали. Власний адаптер Discord переважно додає маршрутизацію DM для підтверджувачів і розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має додавати ручну команду `/approve` лише тоді, коли результат інструмента повідомляє,
    що чат-підтвердження недоступні або ручне підтвердження є єдиним шляхом.
    Якщо власне середовище виконання підтверджень Discord не активне, OpenClaw залишає
    видимим локальний детермінований запит `/approve <id> <decision>`. Якщо
    середовище виконання активне, але власну картку неможливо доставити до жодної цілі,
    OpenClaw надсилає в той самий чат резервне повідомлення з точною командою `/approve`
    з очікуваного підтвердження.

    Автентифікація Gateway і вирішення підтверджень дотримуються спільного контракту клієнта Gateway (`plugin:` ID вирішуються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Підтвердження типово спливають через 30 хвилин.

    Див. [Підтвердження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord охоплюють дії з повідомленнями, адмініструванням каналів, модерацією, присутністю та метаданими.

Основні приклади:

- повідомлення: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файла), щоб задати зображення обкладинки запланованої події.

Шлюзи дій розміщуються в `channels.discord.actions.*`.

Типова поведінка шлюзу:

| Група дій                                                                                                                                                                | Типово    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено |
| roles                                                                                                                                                                    | вимкнено  |
| moderation                                                                                                                                                               | вимкнено  |
| presence                                                                                                                                                                 | вимкнено  |

## UI Components v2

OpenClaw використовує Discord components v2 для підтверджень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для власного UI (розширено; потребує створення payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Задавайте для окремого облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві окремі голосові поверхні: **голосові канали** реального часу (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду хвилі). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються allowlist ролей/користувачів.
3. Запросіть бота зі scopes `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть власні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status`, щоб керувати сеансами. Команда використовує типового агента облікового запису та дотримується тих самих правил allowlist і групової політики, що й інші команди Discord.

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
- `voice.model` перевизначає LLM, який використовується лише для відповідей голосового каналу Discord. Залиште незаданим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- Перевизначення `systemPrompt` для окремих каналів Discord застосовуються до ходів голосової транскрипції для цього голосового каналу.
- Ходи голосової транскрипції визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос Discord є opt-in для текстових конфігурацій; задайте `channels.discord.voice.enabled=true` (або збережіть наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначати підписку на intent станів голосу. Залиште незаданим, щоб intent відповідав ефективному ввімкненню голосу.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання. Типово: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, доки від’єднаний голосовий сеанс почне перепідключатися, перш ніж його знищити. Типово: `15000`.
- OpenClaw також відстежує помилки розшифрування отримання та автоматично відновлюється, виходячи з голосового каналу й повторно приєднуючись до нього після повторних помилок у короткому вікні.
- Якщо після оновлення журнали отримання неодноразово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінійка `@discordjs/voice` містить upstream-виправлення padding з discord.js PR #11449, яке закрило issue discord.js #11419.

Конвеєр голосового каналу:

- Захоплення Discord PCM перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхід Discord і маршрутизацію, поки LLM відповіді працює з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернути текст, оскільки голос Discord володіє фінальним TTS-відтворенням.
- `voice.model`, коли задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; отримане аудіо відтворюється у приєднаному каналі.

Облікові дані визначаються для кожного компонента окремо: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвилі та потребують аудіо OGG/Opus. OpenClaw генерує хвилю автоматично, але потребує `ffmpeg` і `ffprobe` на хості Gateway для перевірки та перетворення.

- Надайте **локальний шлях до файла** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби перетворює його на OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень guild">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли залежите від визначення користувача/учасника
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення guild несподівано заблоковані">

    - перевірте `groupPolicy`
    - перевірте allowlist guild у `channels.discord.guilds`
    - якщо існує мапа `channels` guild, дозволені лише перелічені канали
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

    - `groupPolicy="allowlist"` без відповідного allowlist guild/каналу
    - `requireMention` налаштовано в неправильному місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправника заблоковано allowlist `users` guild/каналу

  </Accordion>

  <Accordion title="Довгі ходи Discord або дублікати відповідей">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Регулятори черги Discord gateway:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою слухача Discord gateway, а не тривалістю ходу агента

    Discord не застосовує timeout, власником якого є канал, до ходів агента в черзі. Слухачі повідомлень передають керування негайно, а поставлені в чергу запуски Discord зберігають порядок у межах сеансу, доки життєвий цикл сеансу/інструмента/середовища виконання не завершить або не перерве роботу.

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

  <Accordion title="Попередження про тайм-аути пошуку метаданих Gateway">
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої використовують стандартну URL-адресу Gateway Discord як резервний варіант, а повідомлення про них у журналах обмежуються за частотою.

    Параметри тайм-ауту метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне значення з env, коли конфігурацію не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - стандартне значення: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через тайм-аут Gateway READY">
    OpenClaw очікує на подію Gateway `READY` Discord під час запуску та після повторних підключень у рантаймі. Налаштуванням із кількома обліковими записами та рознесеним у часі запуском може знадобитися довше стартове вікно READY, ніж стандартне.

    Параметри тайм-ауту READY:

    - запуск, один обліковий запис: `channels.discord.gatewayReadyTimeoutMs`
    - запуск, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - резервне значення з env для запуску, коли конфігурацію не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - стандартне значення для запуску: `15000` (15 секунд), максимум: `120000`
    - рантайм, один обліковий запис: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - рантайм, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - резервне значення з env для рантайму, коли конфігурацію не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - стандартне значення для рантайму: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі-slug, зіставлення в рантаймі все ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікування схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли між ботами">
    За стандартом повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і списку дозволених, щоб уникнути циклічної поведінки.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Збої голосового STT із DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була наявна логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (стандартно)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (стандартне значення upstream) і змінюйте лише за потреби
    - стежте в журналах за:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте з upstream-історією приймання DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Найважливіші поля Discord">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет слухача), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставлення: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повтор: `mediaMaxMb` (обмежує вихідні завантаження до Discord, стандартно `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та експлуатація

- Розглядайте токени ботів як секрети (`DISCORD_BOT_TOKEN` рекомендовано в контрольованих середовищах).
- Надавайте мінімально необхідні дозволи Discord.
- Якщо розгортання/стан команд застаріли, перезапустіть gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord із gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групового чату та списку дозволених.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і зміцнення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставте гільдії та канали з агентами.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Власна поведінка команд.
  </Card>
</CardGroup>
