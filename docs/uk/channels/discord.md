---
read_when:
    - Робота над функціями каналу Discord
summary: Стан підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-05-03T18:10:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a323cd9035265d43aaf60252503a4712264e316b7da175a063bff4ec51f777d
    source_path: channels/discord.md
    workflow: 16
---

Готово до приватних повідомлень і каналів гільдій через офіційний Discord gateway.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Discord типово запускаються в режимі сполучення.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процедура відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і сполучити його з OpenClaw. Рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ім'я, яким ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Залишаючись на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов'язково)
    - **Server Members Intent** (рекомендовано; потрібно для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов'язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть назад угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається."
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він знадобиться вам незабаром.

  </Step>

  <Step title="Згенеруйте URL запрошення і додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і увімкніть:

    - `bot`
    - `applications.commands`

    Нижче з'явиться розділ **Bot Permissions**. Увімкніть щонайменше:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (необов'язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в гілках Discord, зокрема у workflows форумних або медіаканалів, які створюють або продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб під'єднати. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, потрібно увімкнути Developer Mode, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою вашу **іконку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою ваш **власний аватар** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** поруч із Bot Token — на наступному кроці ви надішлете всі три до OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб сполучення працювало, Discord має дозволяти вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою вашу **іконку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дає змогу учасникам сервера (включно з ботами) надсилати вам приватні повідомлення. Тримайте це увімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдій, можете вимкнути приватні повідомлення після сполучення.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чаті)">
    Ваш токен бота Discord є секретом (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

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

    Якщо OpenClaw уже працює як фонова служба, перезапустіть його через Mac-застосунок OpenClaw або зупинивши й повторно запустивши процес `openclaw gateway run`.
    Для встановлень як керованої служби запустіть `openclaw gateway install` з оболонки, де присутній `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб служба могла розв'язати env SecretRef після перезапуску.
    Якщо ваш хост заблоковано або обмежено за частотою запитів під час стартового пошуку застосунку Discord, задайте ID застосунку/клієнта Discord з Developer Portal, щоб під час запуску можна було пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для типового облікового запису або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кількох ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте сполучення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, натомість скористайтеся вкладкою CLI / config.

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

        Env fallback для типового облікового запису:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторно запустіть без `--dry-run`. Відкриті значення `token` підтримуються. Значення SecretRef також підтримуються для `channels.discord.token` через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord зберігайте кожен токен бота та ID застосунку в межах його облікового запису. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тому задавайте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID застосунку.

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

  <Step title="Схваліть перше сполучення через приватні повідомлення">
    Дочекайтеся, доки gateway запрацює, а потім надішліть приватне повідомлення своєму боту в Discord. Він відповість кодом сполучення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код сполучення своєму агенту у вашому наявному каналі:

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

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через приватні повідомлення.

  </Step>
</Steps>

<Note>
Розв'язання токена враховує обліковий запис. Значення токена з конфігурації мають пріоритет над env fallback. `DISCORD_BOT_TOKEN` використовується лише для типового облікового запису.
Якщо два увімкнені облікові записи Discord розв'язуються до того самого токена бота, OpenClaw запускає лише один монітор gateway для цього токена. Токен із конфігурації має пріоритет над типовим env fallback; інакше перший увімкнений обліковий запис перемагає, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується для цього виклику. Це стосується дій надсилання й дій стилю читання/перевірки (наприклад read/search/fetch/thread/pins/permissions). Політика облікового запису й налаштування повторних спроб усе ще беруться з вибраного облікового запису в активному runtime snapshot.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли приватні повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених гільдій">
    Це дає вашому агенту змогу відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

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
    Типово ваш агент відповідає в каналах гільдії лише коли його згадують через @mention. Для приватного сервера ви, ймовірно, хочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдій звичайні фінальні відповіді асистента типово залишаються приватними. Видимий вивід у Discord потрібно надсилати явно за допомогою інструмента `message`, тож агент може типово лишатися спостерігачем і публікувати лише тоді, коли вирішить, що відповідь у каналі корисна.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Allow my agent to respond on this server without having to be @mentioned"
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
    Типово довготривала пам'ять (MEMORY.md) завантажується лише в сесіях приватних повідомлень. Канали гільдій не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони ін'єктуються в кожну сесію). Тримайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам'яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкуватися. Ваш агент бачить назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому workflow.

## Модель виконання

- Gateway володіє підключенням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді Discord повертаються в Discord.
- Метадані гільдії/каналу Discord додаються до підказки моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель копіює цю оболонку
  назад, OpenClaw прибирає скопійовані метадані з вихідних відповідей і з
  майбутнього контексту повторного відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали гільдій мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для спрямованої розмовної сесії.
- Доставка текстових оголошень cron/heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа та структуровані payload-и компонентів залишаються
  багатоповідомними, коли агент видає кілька payload-ів, придатних до доставки.

## Канали форумів

Форуми та медіаканали Discord приймають лише дописи в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення батьківському форуму (`channel:<forumId>`), щоб автоматично створити тред. Назва треду використовує перший непорожній рядок вашого повідомлення.
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

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload-ом `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, списків вибору та форм до закінчення їхнього строку дії.

Щоб обмежити, хто може натиснути кнопку, установіть `allowedUsers` для цієї кнопки (ідентифікатори користувачів Discord, теги або `*`). Коли це налаштовано, користувачі без збігу отримують ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору ефемерна, і використовувати її може лише користувач, який її викликав.

Файлові вкладення:

- Блоки `file` мають указувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

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
  <Tab title="Політика DM">
    `channels.discord.dmPolicy` керує доступом DM. `channels.discord.allowFrom` є канонічним списком дозволених DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`)
    - `disabled`

    Якщо політика DM не є відкритою, невідомі користувачі блокуються (або отримують запит на pairing у режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Для одного облікового запису `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застарілий `dm.allowFrom` не задані.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` переносить їх у `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ідентифікатори зазвичай розпізнаються як ідентифікатори каналів, коли активне значення каналу за замовчуванням, але ідентифікатори, перелічені в ефективному DM `allowFrom` облікового запису, трактуються як цілі користувацьких DM для сумісності.

  </Tab>

  <Tab title="Групи доступу DM">
    DM Discord можуть використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Назви груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, члени якої виражаються в нормальному синтаксисі `allowFrom` кожного каналу, або `type: "discord.channelAudience"`, коли поточна аудиторія `ViewChannel` каналу Discord має динамічно визначати членство. Спільну поведінку груп доступу задокументовано тут: [Групи доступу](/uk/channels/access-groups).

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

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник DM є членом налаштованої гільдії та наразі має ефективний дозвіл `ViewChannel` на налаштованому каналі після застосування ролей і перевизначень каналу.

    Приклад: дозволити будь-кому, хто бачить `#maintainers`, надсилати DM боту, водночас залишаючи DM закритими для всіх інших.

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

    Можна змішувати динамічні та статичні записи:

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

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу аудиторії каналу. DM не містять стану учасника гільдії, тому OpenClaw визначає учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Політика гільдій">
    Обробкою гільдій керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечне базове значення, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має відповідати `channels.discord.guilds` (переважно `id`, slug приймається)
    - необов’язкові списки дозволених відправників: `users` (рекомендовано стабільні ідентифікатори) і `roles` (лише ідентифікатори ролей); якщо налаштовано будь-який із них, відправники дозволені, коли вони збігаються з `users` АБО `roles`
    - прямий збіг за іменем/тегом вимкнений за замовчуванням; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як режим сумісності на крайній випадок
    - імена/теги підтримуються для `users`, але ідентифікатори безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для гільдії налаштовано `channels`, канали не зі списку відхиляються
    - якщо гільдія не має блока `channels`, дозволені всі канали в цій гільдії зі списку дозволених

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

    Якщо ви лише задаєте `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, runtime fallback — `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Згадки та групові DM">
    Повідомлення гільдій за замовчуванням обмежені згадками.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    Під час написання вихідних повідомлень Discord використовуйте канонічний синтаксис згадок: `<@USER_ID>` для користувачів, `<#CHANNEL_ID>` для каналів і `<@&ROLE_ID>` для ролей. Не використовуйте застарілу форму згадки псевдоніма `<@!USER_ID>`.

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, що згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий список дозволених через `dm.groupChannels` (ідентифікатори каналів або slug-и)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ідентифікатором ролі. Прив’язки на основі ролей приймають лише ідентифікатори ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише гільдії. Якщо прив’язка також задає інші поля відповідності (наприклад, `peer` + `guildId` + `roles`), мають збігатися всі налаштовані поля.

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

## Нативні команди та автентифікація команд

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнено для Discord.
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` пропускає реєстрацію команд зі скісною рискою Discord і очищення під час запуску. Раніше зареєстровані команди можуть залишатися видимими в Discord, доки ви не видалите їх із застосунку Discord.
- Автентифікація нативних команд використовує ті самі списки дозволених і політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів без авторизації; виконання все одно застосовує автентифікацію OpenClaw і повертає "not authorized".

Див. [Команди зі скісною рискою](/uk/tools/slash-commands) для каталогу команд і їхньої поведінки.

Налаштування команд зі скісною рискою за замовчуванням:

- `ephemeral: true`

## Відомості про функції

<AccordionGroup>
  <Accordion title="Теги відповідей і нативні відповіді">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується параметром `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне створення гілок відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання на нативну відповідь до першого вихідного повідомлення Discord у ході цього звернення.
    `batched` додає неявне посилання Discord на нативну відповідь лише тоді, коли
    вхідне звернення було відкладеним пакетом із кількох повідомлень. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних швидких чатів, а не для кожного
    звернення з одним повідомленням.

    Ідентифікатори повідомлень доступні в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` зіставляється з `partial` у Discord; `streamMode` є застарілим псевдонімом і мігрується автоматично.

    За замовчуванням залишається `off`, бо редагування попереднього перегляду в Discord швидко впираються в обмеження частоти, коли кілька ботів або Gateway спільно використовують один обліковий запис.

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
    - `block` надсилає фрагменти розміром із чернетку (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, обмежені `textChunkLimit`).
    - Медіа, помилки та фінальні відповіді з явною відповіддю скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли потоковий режим `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка гілок">
    Контекст історії сервера:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервний варіант: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сеанси каналів і успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси гілок успадковують вибір `/model` на рівні сеансу батьківського каналу як резервний варіант лише для моделі; локальні для гілки вибори `/model` усе одно мають пріоритет, а історія батьківської транскрипції не копіюється, якщо не ввімкнено успадкування транскрипції.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) вмикає для нових автогілок початкове наповнення з батьківської транскрипції. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть розв’язувати цілі DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів додаються як **ненадійний** контекст. Списки дозволених обмежують, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сеанси, прив’язані до гілки, для субагентів">
    Discord може прив’язати гілку до цільового сеансу, щоб подальші повідомлення в цій гілці й далі маршрутизувалися до того самого сеансу (зокрема сеансів субагентів).

    Команди:

    - `/focus <target>` прив’язати поточну/нову гілку до цілі субагента/сеансу
    - `/unfocus` прибрати прив’язку поточної гілки
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне скасування фокуса через неактивність для сфокусованих прив’язок
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
    - `spawnSessions` керує автоматичним створенням/прив’язкою гілок для `sessions_spawn({ thread: true })` і створень гілок ACP. За замовчуванням: `true`.
    - `defaultSpawnContext` керує нативним контекстом субагента для створень, прив’язаних до гілки. За замовчуванням: `"fork"`.
    - Застарілі ключі `spawnSubagentSessions`/`spawnAcpSessions` мігруються командою `openclaw doctor --fix`.
    - Якщо прив’язки гілок вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки гілок недоступні.

    Див. [Субагенти](/uk/tools/subagents), [Агенти ACP](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних «завжди ввімкнених» робочих просторів ACP налаштуйте типізовані прив’язки ACP верхнього рівня, що націлюються на розмови Discord.

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
    - У прив’язаному каналі або гілці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив’язки гілок можуть перевизначати розв’язання цілі, доки вони активні.
    - `spawnSessions` обмежує створення/прив’язку дочірніх гілок через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents), щоб дізнатися подробиці поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожного сервера:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованого сеансу Discord.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви користувацьких емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані каналом, увімкнено за замовчуванням.

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
    Маршрутизуйте WebSocket-трафік Gateway Discord і стартові REST-запити (ідентифікатор застосунку + розв’язання списку дозволених) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
    - пошуки використовують ідентифікатор оригінального повідомлення й обмежені часовим вікном
    - якщо пошук завершується невдало, проксійовані повідомлення вважаються повідомленнями ботів і відкидаються, якщо не встановлено `allowBots=true`

  </Accordion>

  <Accordion title="Псевдоніми вихідних згадок">
    Використовуйте `mentionAliases`, коли агентам потрібні детерміновані вихідні згадки відомих користувачів Discord. Ключі є іменами користувачів без початкового `@`; значення є ідентифікаторами користувачів Discord. Невідомі імена, `@everyone`, `@here` і згадки всередині Markdown code spans залишаються без змін.

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
    Оновлення присутності застосовуються, коли ви задаєте поле статусу або активності, або коли вмикаєте автоприсутність.

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

    Приклад потокової трансляції:

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
    - 1: Транслює (потребує `activityUrl`)
    - 2: Слухає
    - 3: Дивиться
    - 4: Користувацька (використовує текст активності як стан статусу; емодзі необов’язковий)
    - 5: Змагається

    Приклад автоприсутності (сигнал стану середовища виконання):

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

    Автоприсутність зіставляє доступність середовища виконання зі статусом Discord: healthy => online, degraded чи unknown => idle, exhausted чи unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує placeholder `{reason}`)

  </Accordion>

  <Accordion title="Затвердження в Discord">
    Discord підтримує обробку затверджень за допомогою кнопок у DM і може за бажанням публікувати запити на затвердження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні затвердження виконання, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного затверджувача: або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить затверджувачів виконання з `allowFrom` каналу, застарілого `dm.allowFrom` чи `defaultTo` для особистих повідомлень. Установіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт затвердження.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на затвердження та фінальні результати приватно. Спочатку він пробує Discord DM, коли власник, що викликав команду, має маршрут власника Discord; якщо він недоступний, використовується перший доступний маршрут власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на затвердження видно в каналі. Кнопки можуть використовувати лише визначені затверджувачі; інші користувачі отримують ефемерну відмову. Запити на затвердження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо отримати з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також рендерить спільні кнопки затвердження, які використовують інші чат-канали. Нативний адаптер Discord здебільшого додає маршрутизацію DM для затверджувачів і розсилання в канал.
    Коли ці кнопки присутні, вони є основним UX затвердження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента повідомляє,
    що чат-затвердження недоступні або ручне затвердження є єдиним шляхом.
    Якщо нативне середовище затвердження Discord не активне, OpenClaw залишає
    локальний детермінований запит `/approve <id> <decision>` видимим. Якщо
    середовище активне, але нативну картку неможливо доставити жодній цілі,
    OpenClaw надсилає резервне сповіщення в той самий чат із точною командою `/approve`
    з очікуваного затвердження.

    Автентифікація Gateway і визначення затвердження дотримуються спільного контракту клієнта Gateway (ID `plugin:` визначаються через `plugin.approval.resolve`; інші ID через `exec.approval.resolve`). Типово затвердження спливають через 30 хвилин.

    Див. [Затвердження виконання](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файлу), щоб установити зображення обкладинки запланованої події.

Шлюзи дій розташовані в `channels.discord.actions.*`.

Типова поведінка шлюзів:

| Група дій                                                                                                                                                                | Типово   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено |
| roles                                                                                                                                                                    | вимкнено |
| moderation                                                                                                                                                               | вимкнено |
| presence                                                                                                                                                                 | вимкнено |

## UI компонентів v2

OpenClaw використовує компоненти Discord v2 для затверджень виконання та маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для кастомного UI (розширений режим; потребує створення payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Налаштовуйте для кожного акаунта за допомогою `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві окремі голосові поверхні: realtime **голосові канали** (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду хвилі). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволених ролей/користувачів.
3. Запросіть бота зі scope `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує типового агента акаунта й дотримується тих самих правил списків дозволених і групової політики, що й інші команди Discord.

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
- `voice.model` перевизначає LLM, що використовується лише для відповідей голосового каналу Discord. Залиште незаданим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- Перевизначення `systemPrompt` для окремого каналу Discord застосовуються до ходів голосової транскрипції для цього голосового каналу.
- Ходи голосової транскрипції визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос Discord є opt-in для конфігурацій лише з текстом; установіть `channels.discord.voice.enabled=true` (або залиште наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище та Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на voice-state intent. Залиште незаданим, щоб intent відповідав ефективному ввімкненню голосу.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання. Типово: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, доки від’єднана голосова сесія почне повторне підключення, перш ніж знищити її. Типово: `15000`.
- OpenClaw також відстежує помилки розшифрування прийому й автоматично відновлюється, виходячи з голосового каналу та повторно приєднуючись після повторних помилок у короткому вікні.
- Якщо після оновлення журнали прийому повторно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінійка `@discordjs/voice` містить upstream-виправлення padding з discord.js PR #11449, яке закрило issue discord.js #11419.

Конвеєр голосового каналу:

- PCM-захоплення Discord перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхідний потік і маршрутизацію Discord, тоді як LLM відповіді працює з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернений текст, оскільки Discord voice відповідає за фінальне відтворення TTS.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` зливається поверх `messages.tts`; отримане аудіо відтворюється в приєднаному каналі.

Облікові дані визначаються для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвилі й потребують аудіо OGG/Opus. OpenClaw автоматично генерує хвилю, але потребує `ffmpeg` і `ffprobe` на хості gateway для перевірки та конвертації.

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлення guild">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від визначення користувача/учасника
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення guild несподівано заблоковані">

    - перевірте `groupPolicy`
    - перевірте список дозволених guild у `channels.discord.guilds`
    - якщо існує мапа `channels` guild, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і патерни згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, але все ще заблоковано">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволених guild/каналу
    - `requireMention` налаштовано в неправильному місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправника заблоковано списком дозволених `users` guild/каналу

  </Accordion>

  <Accordion title="Довгі ходи Discord або дубльовані відповіді">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Налаштування черги Discord gateway:

    - один акаунт: `channels.discord.eventQueue.listenerTimeout`
    - кілька акаунтів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою слухача Discord gateway, а не тривалістю ходу агента

    Discord не застосовує timeout, що належить каналу, до поставлених у чергу ходів агента. Слухачі повідомлень передають роботу негайно, а поставлені в чергу запуски Discord зберігають порядок у межах сесії, доки життєвий цикл сесії/інструмента/середовища не завершить або не перерве роботу.

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

  <Accordion title="Попередження про timeout пошуку метаданих Gateway">
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої повертаються до типового URL gateway Discord і обмежуються за частотою в журналах.

    Налаштування timeout метаданих:

    - один акаунт: `channels.discord.gatewayInfoTimeoutMs`
    - кілька акаунтів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резерв env, коли конфігурацію не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - типово: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через тайм-аут READY у Gateway">
    OpenClaw очікує події `READY` Gateway Discord під час запуску та після повторних підключень у runtime. Налаштування з кількома обліковими записами та рознесенням запуску в часі можуть потребувати довшого стартового вікна READY, ніж типове.

    Параметри тайм-ауту READY:

    - запуск для одного облікового запису: `channels.discord.gatewayReadyTimeoutMs`
    - запуск для кількох облікових записів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback через env під час запуску, коли config не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - типове значення запуску: `15000` (15 секунд), максимум: `120000`
    - runtime для одного облікового запису: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime для кількох облікових записів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback через env у runtime, коли config не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - типове значення runtime: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ідентифікаторів каналів.

    Якщо ви використовуєте ключі-slug, зіставлення в runtime все ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли між ботами">
    Типово повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадування та allowlist, щоб уникнути циклічної поведінки.
    Віддавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Втрати Voice STT з DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була наявна логіка відновлення отримання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (типово)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (типове значення upstream) і налаштовуйте лише за потреби
    - відстежуйте в журналах:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо помилки тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте з історією отримання DAVE в upstream у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Високосигнальні поля Discord">

- запуск/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторна спроба: `mediaMaxMb` (обмежує вихідні завантаження Discord, типово `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневі `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека й експлуатація

- Обробляйте токени ботів як секрети (`DISCORD_BOT_TOKEN` бажано в контрольованих середовищах).
- Надавайте Discord дозволи за принципом найменших привілеїв.
- Якщо розгортання/стан команд застаріли, перезапустіть Gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Груповий чат і поведінка allowlist.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте guilds і канали з агентами.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд.
  </Card>
</CardGroup>
