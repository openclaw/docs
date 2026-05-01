---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-05-01T23:09:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d87dfc4cbebb2cbf89d92dc2eb55903ada60a390f92c1e1817d67baada87669
    source_path: channels/discord.md
    workflow: 16
---

Готово для DM і каналів гільдій через офіційний Discord Gateway.

<CardGroup cols={3}>
  <Card title="Створення пари" icon="link" href="/uk/channels/pairing">
    Discord DM за замовчуванням працюють у режимі створення пари.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та процес виправлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити нову програму з ботом, додати бота на свій сервер і створити для нього пару з OpenClaw. Рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спершу створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть програму Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть її, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Залишаючись на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть назад угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається".
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він невдовзі знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на свій сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і ввімкніть:

    - `bot`
    - `applications.commands`

    Нижче з’явиться розділ **Bot Permissions**. Увімкніть принаймні:

    **General Permissions**
      - Перегляд каналів
    **Text Permissions**
      - Надсилання повідомлень
      - Читання історії повідомлень
      - Вбудовування посилань
      - Прикріплення файлів
      - Додавання реакцій (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в тредах Discord, зокрема у сценаріях форумних або медіаканалів, які створюють або продовжують тред, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у програму Discord, потрібно ввімкнути Developer Mode, щоб мати змогу копіювати внутрішні ID.

    1. Натисніть **User Settings** (іконка шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші **іконку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші **власний аватар** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** поруч із Bot Token — на наступному кроці ви надішлете всі три до OpenClaw.

  </Step>

  <Step title="Дозвольте DM від учасників сервера">
    Щоб створення пари працювало, Discord має дозволяти вашому боту надсилати вам DM. Клацніть правою кнопкою миші **іконку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам DM. Залиште це ввімкненим, якщо хочете використовувати Discord DM з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, можете вимкнути DM після створення пари.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чат)">
    Токен вашого Discord-бота є секретом (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

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

    Якщо OpenClaw уже працює як фонова служба, перезапустіть його через програму OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.
    Для встановлень керованої служби запустіть `openclaw gateway install` з оболонки, де присутній `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб служба могла розв’язати env SecretRef після перезапуску.
    Якщо ваш хост заблокований або обмежений за частотою запитів під час стартового пошуку програми Discord, задайте ID програми/клієнта Discord з Developer Portal, щоб запуск міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для облікового запису за замовчуванням або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кілька ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і створіть пару">

    <Tabs>
      <Tab title="Попросіть свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому. Якщо Discord — ваш перший канал, натомість використовуйте вкладку CLI / config.

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

        Резервний env для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім запустіть повторно без `--dry-run`. Значення `token` у відкритому тексті підтримуються. Значення SecretRef також підтримуються для `channels.discord.token` через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord зберігайте токен кожного бота та ID програми в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тому задавайте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID програми.

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

  <Step title="Підтвердьте перше створення пари через DM">
    Дочекайтеся, доки gateway запрацює, а потім надішліть DM своєму боту в Discord. Він відповість кодом створення пари.

    <Tabs>
      <Tab title="Попросіть свого агента">
        Надішліть код створення пари своєму агенту в наявному каналі:

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

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через DM.

  </Step>
</Steps>

<Note>
Розв’язання токена враховує обліковий запис. Значення токена з конфігурації мають пріоритет над резервним env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Якщо два ввімкнені облікові записи Discord розв’язуються в той самий токен бота, OpenClaw запускає лише один gateway monitor для цього токена. Токен із конфігурації має пріоритет над резервним env за замовчуванням; інакше перемагає перший увімкнений обліковий запис, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (дії інструмента message/каналу) явний `token` для кожного виклику використовується для цього виклику. Це застосовується до дій надсилання та дій у стилі читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису й налаштування повторних спроб усе одно беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Щойно DM запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених гільдій">
    Це дає змогу вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в DM.

    <Tabs>
      <Tab title="Попросіть свого агента">
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

    У каналах гільдії звичайні фінальні відповіді асистента за замовчуванням залишаються приватними. Видимий вивід Discord потрібно надсилати явно за допомогою інструмента `message`, тож агент може за замовчуванням спостерігати й публікувати лише тоді, коли вирішить, що відповідь у каналі корисна.

    <Tabs>
      <Tab title="Попросіть свого агента">
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

  <Step title="Сплануйте пам’ять у каналах гільдії">
    За замовчуванням довготривала пам’ять (MEMORY.md) завантажується лише в DM-сесіях. Канали гільдії не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Попросіть свого агента">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони впроваджуються в кожну сесію). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкування. Ваш агент бачить назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що підходить вашому робочому процесу.

## Модель runtime

- Gateway володіє з’єднанням Discord.
- Маршрутизація відповідей є детермінованою: вхідні відповіді Discord повертаються до Discord.
- Метадані гільдії/каналу Discord додаються до підказки моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель скопіює цей конверт
  назад, OpenClaw вилучить скопійовані метадані з вихідних відповідей і з
  майбутнього контексту повторного відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують головну сесію агента (`agent:main:main`).
- Канали гільдій ізольовані ключами сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), але все одно несуть `CommandTargetSessionKey` до маршрутизованої сесії розмови.
- Доставка текстових оголошень cron/heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа та структуровані payload компонентів залишаються
  багатоповідомними, коли агент генерує кілька придатних до доставки payload.

## Форумні канали

Форумні та медіаканали Discord приймають лише дописи в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити тред. Заголовок треду використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити тред напряму. Не передавайте `--message-id` для форумних каналів.

Приклад: надіслати до батьківського форуму, щоб створити тред

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити форумний тред

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самого треду (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери Discord components v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб кнопки, меню вибору та форми можна було використовувати багато разів, доки не спливе їхній термін дії.

Щоб обмежити, хто може натиснути кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Коли налаштовано, користувачі, які не збігаються, отримують ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору є ефемерною, і використовувати її може лише користувач, який викликав команду.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` із кількістю полів до 5
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
    `channels.discord.dmPolicy` керує доступом до DM. `channels.discord.allowFrom` є канонічним allowlist для DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (вимагає, щоб `channels.discord.allowFrom` містив `"*"`)
    - `disabled`

    Якщо політика DM не є відкритою, невідомі користувачі блокуються (або їм пропонується сполучення в режимі `pairing`).

    Пріоритетність для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Для одного облікового запису `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застарілий `dm.allowFrom` не задані.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` все ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID зазвичай розпізнаються як ID каналів, коли активне значення каналу за замовчуванням, але ID, перелічені в ефективному DM `allowFrom` облікового запису, розглядаються як цілі DM користувача для сумісності.

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

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник DM є учасником налаштованої гільдії та наразі має ефективний дозвіл `ViewChannel` на налаштований канал після застосування ролей і перевизначень каналу.

    Приклад: дозволити всім, хто може бачити `#maintainers`, надсилати DM боту, залишаючи DM закритими для всіх інших.

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

    Пошуки закривають доступ у разі помилки. Якщо Discord повертає `Missing Access`, пошук учасника завершується невдало або канал належить до іншої гільдії, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу аудиторії каналу. DM не містять стан учасника гільдії, тому OpenClaw розв’язує учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Guild policy">
    Обробкою гільдій керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова лінія, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (переважно `id`, slug приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо будь-який із них налаштовано, відправники дозволені, коли вони збігаються з `users` АБО `roles`
    - пряме зіставлення імен/тегів вимкнено за замовчуванням; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як режим сумісності для аварійного випадку
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо гільдія має налаштовані `channels`, канали не зі списку відхиляються
    - якщо гільдія не має блока `channels`, дозволені всі канали в цій allowlisted гільдії

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

    Якщо ви встановили лише `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, runtime fallback — `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` — `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Повідомлення гільдій за замовчуванням обмежені згадками.

    Виявлення згадок охоплює:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, які згадують іншого користувача/роль, але не бота (крім @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slugs)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише для гільдії. Якщо прив’язка також задає інші поля зіставлення (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди можуть усе ще бути видимими в UI Discord для користувачів, які не авторизовані; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Стандартні налаштування slash-команд:

- `ephemeral: true`

## Відомості про функції

<AccordionGroup>
  <Accordion title="Теги відповідей і нативні відповіді">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (стандартно)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне створення ланцюжків відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне нативне посилання на відповідь до першого вихідного повідомлення Discord для цього ходу.
    `batched` додає неявне нативне посилання Discord на відповідь лише тоді, коли
    вхідний хід був згрупованою з усуненням брязкоту партією з кількох повідомлень. Це корисно,
    коли вам потрібні нативні відповіді переважно для неоднозначних швидких чатів, а не для кожного
    ходу з одним повідомленням.

    Ідентифікатори повідомлень відображаються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може потоково передавати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (стандартно) | `partial` | `block` | `progress`. `progress` зіставляється з `partial` у Discord; `streamMode` є застарілим псевдонімом і мігрується автоматично.

    Стандартним лишається `off`, оскільки редагування попереднього перегляду Discord швидко впираються в обмеження швидкості, коли кілька ботів або gateway використовують один обліковий запис.

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
    - `block` випускає фрагменти розміром із чернетку (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву; значення обмежуються `textChunkLimit`).
    - Медіа, помилки та фінальні явні відповіді скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (стандартно `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; медіавідповіді повертаються до звичайної доставки. Коли потокове передавання `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка гілок">
    Контекст історії сервера:

    - стандарт `channels.discord.historyLimit` — `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сеанси каналу й успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси гілок успадковують вибір `/model` рівня сеансу з батьківського каналу як резерв лише для моделі; локальні для гілки вибори `/model` усе одно мають пріоритет, а історія транскрипту батьківського каналу не копіюється, якщо не ввімкнено успадкування транскрипту.
    - `channels.discord.thread.inheritParent` (стандартно `false`) вмикає для нових автоматичних гілок початкове наповнення з батьківського транскрипту. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть розв’язувати цілі DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів вводяться як **ненадійний** контекст. Списки дозволених визначають, хто може запускати агента, а не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Прив’язані до гілок сеанси для субагентів">
    Discord може прив’язати гілку до цілі сеансу, щоб подальші повідомлення в цій гілці й надалі маршрутизувалися до того самого сеансу (включно із сеансами субагентів).

    Команди:

    - `/focus <target>` прив’язати поточну/нову гілку до цілі субагента/сеансу
    - `/unfocus` видалити прив’язку поточної гілки
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокуса за неактивності для сфокусованих прив’язок
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

    - `session.threadBindings.*` задає глобальні стандартні значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати гілки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати гілки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки гілок вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки гілок недоступні.

    Див. [Субагенти](/uk/tools/subagents), [Агенти ACP](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних «always-on» робочих просторів ACP налаштуйте типізовані прив’язки ACP верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або гілку на місці та зберігає майбутні повідомлення в тому самому сеансі ACP. Повідомлення гілки успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або гілці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив’язки гілок можуть перевизначати розв’язання цілі, доки активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірню гілку через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents), щоб дізнатися більше про поведінку прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожного сервера:

    - `off`
    - `own` (стандартно)
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

    - Discord приймає unicode-емодзі або назви власних емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані каналом, увімкнені стандартно.

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
    Маршрутизуйте WebSocket-трафік Discord gateway і стартові REST-пошуки (ID застосунку + розв’язання списку дозволених) через HTTP(S)-проксі з `channels.discord.proxy`.

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
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Примітки:

    - списки дозволених можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за назвою/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID оригінального повідомлення й обмежені часовим вікном
    - якщо пошук не вдався, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо `allowBots=true` не задано

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

    Приклад активності (власний статус є стандартним типом активності):

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
    - 1: Потокове передавання (потребує `activityUrl`)
    - 2: Слухає
    - 3: Дивиться
    - 4: Власний (використовує текст активності як стан статусу; емодзі необов’язковий)
    - 5: Змагається

    Приклад автоматичної присутності (сигнал справності середовища виконання):

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

    Автоматична присутність зіставляє доступність середовища виконання зі статусом Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Затвердження в Discord">
    Discord підтримує обробку затверджень за допомогою кнопок у DM і може необов’язково публікувати запити на затвердження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, стандартно: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні затвердження виконання, коли `enabled` не задано або має значення `"auto"` і можна розв’язати принаймні одного затверджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить затверджувачів виконання з канального `allowFrom`, застарілого `dm.allowFrom` або direct-message `defaultTo`. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт затвердження.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на затвердження та фінальні результати приватно. Спочатку він пробує Discord DM, коли власник, що викликає команду, має маршрут власника Discord; якщо він недоступний, використовується перший доступний маршрут власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на схвалення видимий у каналі. Лише визначені схвалювачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на схвалення містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо отримати з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також рендерить спільні кнопки схвалення, які використовують інші чат-канали. Нативний адаптер Discord переважно додає маршрутизацію DM для схвалювачів і розсилання в канал.
    Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
    має додавати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що чат-схвалення недоступні або ручне схвалення є єдиним шляхом.
    Якщо нативне середовище схвалень Discord не активне, OpenClaw залишає
    локальний детермінований запит `/approve <id> <decision>` видимим. Якщо
    середовище активне, але нативну картку неможливо доставити жодній цілі,
    OpenClaw надсилає резервне сповіщення в той самий чат із точною командою `/approve`
    з очікуваного схвалення.

    Автентифікація Gateway і вирішення схвалень дотримуються спільного контракту клієнта Gateway (`plugin:` IDs вирішуються через `plugin.approval.resolve`; інші IDs через `exec.approval.resolve`). Схвалення за замовчуванням спливають через 30 хвилин.

    Див. [Схвалення Exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти й шлюзи дій

Дії повідомлень Discord охоплюють обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файлу), щоб установити обкладинку запланованої події.

Шлюзи дій розміщені в `channels.discord.actions.*`.

Поведінка шлюзів за замовчуванням:

| Група дій                                                                                                                                                                | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                    | вимкнено         |
| moderation                                                                                                                                                               | вимкнено         |
| presence                                                                                                                                                                 | вимкнено         |

## UI Components v2

OpenClaw використовує components v2 Discord для схвалень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (розширений сценарій; потребує створення payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Налаштуйте для кожного облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві окремі голосові поверхні: голосові канали **реального часу** (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду хвилі). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволених ролей/користувачів.
3. Запросіть бота зі scopes `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status`, щоб керувати сесіями. Команда використовує агента за замовчуванням для облікового запису й дотримується тих самих правил списку дозволених і групової політики, що й інші команди Discord.

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

Нотатки:

- `voice.tts` перевизначає `messages.tts` лише для голосового відтворення.
- `voice.model` перевизначає LLM, який використовується лише для відповідей голосового каналу Discord. Залиште його неналаштованим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- Перевизначення `systemPrompt` Discord для окремих каналів застосовуються до ходів голосової транскрипції для цього голосового каналу.
- Ходи голосової транскрипції визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос Discord є opt-in для конфігурацій лише з текстом; установіть `channels.discord.voice.enabled=true` (або залиште наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на intent голосового стану. Залиште неналаштованим, щоб intent відповідав ефективному ввімкненню голосу.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів приєднання `@discordjs/voice`.
- Значення за замовчуванням `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо вони не налаштовані.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоприєднання. За замовчуванням: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, доки від’єднана голосова сесія почне перепідключення, перш ніж знищити її. За замовчуванням: `15000`.
- OpenClaw також відстежує помилки розшифрування прийому й автоматично відновлюється, виходячи з голосового каналу та приєднуючись до нього знову після повторних помилок за короткий проміжок часу.
- Якщо журнали прийому після оновлення неодноразово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінія `@discordjs/voice` містить upstream-виправлення padding з PR #11449 discord.js, яке закрило issue #11419 discord.js.

Конвеєр голосового каналу:

- Захоплення PCM Discord перетворюється на тимчасовий файл WAV.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхід Discord і маршрутизацію, тоді як LLM відповіді працює з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернутий текст, бо голос Discord володіє фінальним відтворенням TTS.
- `voice.model`, якщо налаштовано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; отримане аудіо відтворюється в приєднаному каналі.

Облікові дані вирішуються для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвилі й потребують аудіо OGG/Opus. OpenClaw генерує хвилю автоматично, але потребує `ffmpeg` і `ffprobe` на хості Gateway для перевірки та перетворення.

- Надайте **шлях до локального файлу** (URL відхиляються).
- Опустіть текстовий вміст (Discord відхиляє текст + голосове повідомлення в тому самому payload).
- Приймається будь-який аудіоформат; OpenClaw перетворює на OGG/Opus за потреби.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від вирішення користувача/учасника
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - перевірте `groupPolicy`
    - перевірте список дозволених guild у `channels.discord.guilds`
    - якщо існує мапа guild `channels`, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволених guild/channel
    - `requireMention` налаштовано в неправильному місці (має бути під `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано списком дозволених `users` для guild/channel

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Регулятори черги gateway Discord:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою слухача gateway Discord, а не часом життя ходу агента

    Discord не застосовує timeout, що належить каналу, до поставлених у чергу ходів агента. Слухачі повідомлень передають роботу негайно, а поставлені в чергу запуски Discord зберігають порядок у межах сесії, доки життєвий цикл сесії/інструмента/середовища виконання не завершить або не перерве роботу.

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

    Регулятори timeout метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне значення env, коли конфігурацію не налаштовано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - за замовчуванням: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте slug keys, зіставлення під час виконання все ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення pairing у режимі `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і списків дозволених, щоб уникнути циклічної поведінки.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - підтримуйте OpenClaw в актуальному стані (`openclaw update`), щоб була наявна логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (типово)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (типове значення upstream) і коригуйте лише за потреби
    - стежте в журналах за:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали й порівняйте з upstream-історією приймання DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основне джерело: [Довідник конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет слухача), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- метадані Gateway: `gatewayInfoTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb` (обмежує вихідні завантаження Discord, типово `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, `bindings[]` верхнього рівня (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та експлуатація

- Розглядайте токени ботів як секрети (`DISCORD_BOT_TOKEN` бажано використовувати в керованих середовищах).
- Надавайте мінімально необхідні дозволи Discord.
- Якщо розгортання/стан команд застаріли, перезапустіть gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord із gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка групового чату й списку дозволених.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте сервери й канали з агентами.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
