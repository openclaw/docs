---
read_when:
    - Робота над функціями каналу Discord
summary: Стан підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-05-02T06:09:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5526523b55dc2c861206eaf6b016c025da33bc5c47d196ba7aed6fb4c3e6595
    source_path: channels/discord.md
    workflow: 16
---

Готово для особистих повідомлень і каналів гільдії через офіційний Discord Gateway.

<CardGroup cols={3}>
  <Card title="Спарювання" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Discord за замовчуванням працюють у режимі спарювання.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити нову програму з ботом, додати бота на свій сервер і спарувати його з OpenClaw. Рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спершу створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть програму Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть її на кшталт "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на те, як ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Залишаючись на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; потрібно для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається".
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він знадобиться вам незабаром.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на свій сервер.

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте писати в треди Discord, зокрема у робочих процесах форумних або медіаканалів, які створюють чи продовжують тред, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб під’єднати. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у програму Discord, потрібно ввімкнути Developer Mode, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (іконка шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою вашу **іконку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою ваш **власний аватар** → **Copy User ID**

    Збережіть ваші **Server ID** і **User ID** поруч із Bot Token — на наступному кроці ви надішлете всі три до OpenClaw.

  </Step>

  <Step title="Дозвольте особисті повідомлення від учасників сервера">
    Щоб спарювання працювало, Discord має дозволити вашому боту надсилати вам особисті повідомлення. Клацніть правою кнопкою вашу **іконку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам особисті повідомлення. Залиште це ввімкненим, якщо хочете використовувати особисті повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, можете вимкнути особисті повідомлення після спарювання.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чат)">
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

    Якщо OpenClaw уже працює як фонова служба, перезапустіть його через програму OpenClaw для Mac або зупинивши й повторно запустивши процес `openclaw gateway run`.
    Для встановлень керованої служби запустіть `openclaw gateway install` з оболонки, де присутній `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб служба могла розв’язати env SecretRef після перезапуску.
    Якщо ваш хост заблоковано або обмежено за частотою запитів під час стартового пошуку програми Discord, задайте ID програми/клієнта Discord із Developer Portal, щоб запуск міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для облікового запису за замовчуванням або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кількох ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і спаруйте">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, скористайтеся вкладкою CLI / config.

        > "Я вже задав токен свого бота Discord у конфігурації. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
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

        Резервний env-варіант для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторіть запуск без `--dry-run`. Значення `token` у відкритому тексті підтримуються. Значення SecretRef також підтримуються для `channels.discord.token` через постачальників env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord зберігайте токен і ID програми кожного бота в його обліковому записі. `channels.discord.applicationId` верхнього рівня успадковується обліковими записами, тому задавайте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID програми.

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

  <Step title="Схваліть перше спарювання через особисті повідомлення">
    Зачекайте, доки Gateway запуститься, а потім напишіть своєму боту в Discord в особисті повідомлення. Він відповість кодом спарювання.

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

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через особисті повідомлення.

  </Step>
</Steps>

<Note>
Розв’язання токена враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним env-варіантом. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Якщо два ввімкнені облікові записи Discord розв’язуються до того самого токена бота, OpenClaw запускає лише один монітор Gateway для цього токена. Токен із конфігурації має пріоритет над резервним env-варіантом за замовчуванням; інакше перемагає перший увімкнений обліковий запис, а дубльований обліковий запис позначається як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується для цього виклику. Це застосовується до дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису та налаштування повторів усе ще беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли особисті повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повний робочий простір, де кожен канал отримує власну сесію агента зі своїм контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених гільдій">
    Це дає змогу вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в особистих повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Discord Server ID `<server_id>` до списку дозволених гільдій"
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
    За замовчуванням ваш агент відповідає в каналах гільдії лише коли його @згадують. Для приватного сервера ви, ймовірно, хочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдії звичайні фінальні відповіді асистента за замовчуванням залишаються приватними. Видимий вивід Discord потрібно явно надсилати за допомогою інструмента `message`, тож агент може за замовчуванням спостерігати й публікувати лише тоді, коли вирішить, що відповідь у каналі корисна.

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

  <Step title="Сплануйте пам’ять у каналах гільдії">
    За замовчуванням довгострокова пам’ять (MEMORY.md) завантажується лише в сесіях особистих повідомлень. Канали гільдії не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довгостроковий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони впроваджуються в кожну сесію). Зберігайте довгострокові нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкуватися. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що пасує вашому робочому процесу.

## Runtime-модель

- Gateway відповідає за з’єднання з Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді з Discord повертаються в Discord.
- Метадані гільдії/каналу Discord додаються до підказки моделі як недовірений
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель скопіює цю обгортку
  назад, OpenClaw видаляє скопійовані метадані з вихідних відповідей і з
  майбутнього контексту відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали гільдій ізольовані ключами сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас усе ще передаючи `CommandTargetSessionKey` до маршрутизованої сесії розмови.
- Доставлення текстових оголошень Cron/Heartbeat у Discord використовує остаточну
  видиму асистенту відповідь один раз. Медіа та структуровані payload компонентів залишаються
  багатоповідомленнєвими, коли агент випускає кілька payload, придатних до доставлення.

## Форумні канали

Форумні та медіаканали Discord приймають лише дописи в гілках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити гілку. Назва гілки використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити гілку напряму. Не передавайте `--message-id` для форумних каналів.

Приклад: надіслати до батьківського форуму, щоб створити гілку

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити форумну гілку

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самої гілки (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, виборів і форм, доки вони не завершать дію.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Коли це налаштовано, користувачі без збігу отримують ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору є ефемерною, і користуватися нею може лише користувач, який її викликав.

Файлові вкладення:

- Блоки `file` мають посилатися на reference вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити ім’я завантаження, коли воно має збігатися з reference вкладення

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
    `channels.discord.dmPolicy` керує доступом до DM. `channels.discord.allowFrom` є канонічним allowlist для DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`)
    - `disabled`

    Якщо політика DM не відкрита, невідомих користувачів блокують (або пропонують pairing у режимі `pairing`).

    Пріоритетність кількох акаунтів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до акаунта `default`.
    - Для одного акаунта `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані акаунти успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застарілий `dm.allowFrom` не задані.
    - Іменовані акаунти не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` все ще зчитуються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Формат цілі DM для доставлення:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID зазвичай розпізнаються як ID каналів, коли активний типовий канал, але ID, перелічені в ефективному DM `allowFrom` акаунта, для сумісності трактуються як цілі користувацьких DM.

  </Tab>

  <Tab title="DM access groups">
    DM Discord можуть використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Імена груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, учасники якої виражаються звичайним синтаксисом `allowFrom` кожного каналу, або `type: "discord.channelAudience"`, коли поточна аудиторія `ViewChannel` каналу Discord має динамічно визначати членство. Поведінка спільних груп доступу задокументована тут: [Групи доступу](/uk/channels/access-groups).

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

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник DM є учасником налаштованої гільдії та наразі має ефективний дозвіл `ViewChannel` на налаштованому каналі після застосування ролей і перевизначень каналу.

    Приклад: дозволити всім, хто бачить `#maintainers`, писати боту в DM, водночас залишаючи DM закритими для всіх інших.

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

    Пошуки завершуються закрито. Якщо Discord повертає `Missing Access`, пошук учасника зазнає невдачі або канал належить іншій гільдії, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу на основі аудиторії каналу. DM не містять стану учасника гільдії, тому OpenClaw розв’язує учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Guild policy">
    Обробкою гільдій керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова лінія, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (переважно `id`, slug приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправників дозволено, коли вони збігаються з `users` АБО `roles`
    - прямий збіг за іменем/тегом за замовчуванням вимкнено; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як режим сумісності break-glass
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо гільдія має налаштовані `channels`, канали поза списком заборонені
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

    Якщо ви задаєте лише `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, runtime fallback — `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Повідомлення гільдій за замовчуванням пропускаються через перевірку згадки.

    Виявлення згадки включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slugs)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише гільдії. Якщо прив’язка також задає інші поля збігу (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

- `commands.native` за замовчуванням дорівнює `"auto"` і ввімкнено для Discord.
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Автентифікація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в UI Discord для користувачів, які не авторизовані; виконання все одно застосовує автентифікацію OpenClaw і повертає "not authorized".

Див. [Слеш-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Налаштування слеш-команд за замовчуванням:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Теги відповідей і нативні відповіді">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне створення ланцюжків відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord у цьому ході.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був дебаунсованою групою з кількох повідомлень. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних активних чатів,
    а не для кожного ходу з одним повідомленням.

    ID повідомлень доступні в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` зіставляється з `partial` у Discord; `streamMode` є застарілим псевдонімом і мігрується автоматично.

    За замовчуванням лишається `off`, бо редагування попереднього перегляду Discord швидко впирається в обмеження частоти, коли кілька ботів або Gateway використовують один обліковий запис.

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
    - `block` випускає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву; обмежується `textChunkLimit`).
    - Медіа, помилки та фінальні відповіді з явною відповіддю скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд працює лише з текстом; відповіді з медіа повертаються до звичайної доставки. Коли потокове передавання `block` явно ввімкнене, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка потоків">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка потоків:

    - Потоки Discord маршрутизуються як сеанси каналів і успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси потоків успадковують вибір `/model` на рівні сеансу батьківського каналу як резерв лише для моделі; локальні для потоку вибори `/model` усе одно мають пріоритет, а історія транскрипту батьківського каналу не копіюється, якщо не ввімкнено успадкування транскрипту.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) вмикає для нових автоматичних потоків початкове наповнення з батьківського транскрипту. Перевизначення для окремих облікових записів розміщені в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструменту повідомлень можуть розпізнавати DM-цілі `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів вставляються як **ненадійний** контекст. Списки дозволених визначають, хто може запускати агента, а не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сеанси, прив'язані до потоків, для субагентів">
    Discord може прив'язати потік до цілі сеансу, щоб подальші повідомлення в цьому потоці продовжували маршрутизуватися до того самого сеансу (зокрема сеансів субагентів).

    Команди:

    - `/focus <target>` прив'язати поточний/новий потік до цілі субагента/сеансу
    - `/unfocus` видалити прив'язку поточного потоку
    - `/agents` показати активні запуски та стан прив'язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне скасування фокуса через неактивність для сфокусованих прив'язок
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для сфокусованих прив'язок

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
    - `spawnSessions` керує автоматичним створенням/прив'язкою потоків для `sessions_spawn({ thread: true })` і породжень потоків ACP. За замовчуванням: `true`.
    - `defaultSpawnContext` керує нативним контекстом субагента для породжень, прив'язаних до потоку. За замовчуванням: `"fork"`.
    - Застарілі ключі `spawnSubagentSessions`/`spawnAcpSessions` мігруються через `openclaw doctor --fix`.
    - Якщо прив'язки потоків вимкнені для облікового запису, `/focus` і пов'язані операції прив'язки потоків недоступні.

    Див. [Субагенти](/uk/tools/subagents), [Агенти ACP](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив'язки каналів ACP">
    Для стабільних "завжди ввімкнених" робочих просторів ACP налаштуйте типізовані прив'язки ACP верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив'язує поточний канал або потік на місці й зберігає майбутні повідомлення в тому самому сеансі ACP. Повідомлення потоків успадковують прив'язку батьківського каналу.
    - У прив'язаному каналі або потоці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив'язки потоків можуть перевизначати розпізнавання цілі, доки активні.
    - `spawnSessions` обмежує створення/прив'язку дочірніх потоків через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents), щоб дізнатися подробиці поведінки прив'язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для окремої гільдії:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованого сеансу Discord.

  </Accordion>

  <Accordion title="Ack-реакції">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розпізнавання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви власних емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані каналом, увімкнені за замовчуванням.

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
    Маршрутизуйте WebSocket-трафік Gateway Discord і стартові REST-пошуки (ID застосунку + розпізнавання списку дозволених) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
    Увімкніть розпізнавання PluralKit, щоб зіставляти проксійовані повідомлення з ідентичністю учасника системи:

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
    - пошуки використовують ID вихідного повідомлення й обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо не встановлено `allowBots=true`

  </Accordion>

  <Accordion title="Псевдоніми вихідних згадок">
    Використовуйте `mentionAliases`, коли агентам потрібні детерміновані вихідні згадки для відомих користувачів Discord. Ключі — це імена без початкового `@`; значення — ID користувачів Discord. Невідомі імена, `@everyone`, `@here` і згадки всередині code span Markdown лишаються без змін.

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

    Приклад активності (власний статус є типом активності за замовчуванням):

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
    - 1: Транслює (потребує `activityUrl`)
    - 2: Слухає
    - 3: Дивиться
    - 4: Користувацька (використовує текст активності як стан статусу; емодзі необов'язковий)
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

    Автоматична присутність зіставляє доступність runtime зі статусом Discord: справний => онлайн, погіршений або невідомий => неактивний, вичерпаний або недоступний => dnd. Необов'язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Схвалення в Discord">
    Discord підтримує обробку схвалень на основі кнопок у DM і може необов'язково публікувати запити на схвалення в початковому каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов'язково; коли можливо, повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні схвалення виконання, коли `enabled` не задано або має значення `"auto"` і можна розпізнати принаймні одного схвалювача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить схвалювачів виконання з `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` прямих повідомлень. Встановіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт схвалень.

    Для чутливих команд групи, доступних лише власнику, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на схвалення та фінальні результати приватно. Спершу він намагається використати Discord DM, коли власник, який викликав команду, має маршрут власника Discord; якщо він недоступний, OpenClaw повертається до першого доступного маршруту власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на схвалення видимий у каналі. Лише визначені особи, що схвалюють, можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на схвалення містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ідентифікатор каналу неможливо отримати з ключа сеансу, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки схвалення, які використовують інші чат-канали. Нативний адаптер Discord переважно додає маршрутизацію DM для осіб, що схвалюють, і розсилання в канали.
    Коли ці кнопки присутні, вони є основним інтерфейсом схвалення; OpenClaw
    має додавати ручну команду `/approve` лише тоді, коли результат інструмента повідомляє,
    що схвалення в чаті недоступні або ручне схвалення є єдиним шляхом.
    Якщо нативне середовище виконання схвалень Discord не активне, OpenClaw залишає
    видимим локальний детермінований запит `/approve <id> <decision>`. Якщо
    середовище виконання активне, але нативну картку неможливо доставити до жодної цілі,
    OpenClaw надсилає резервне сповіщення в той самий чат із точною командою `/approve`
    з очікуваного схвалення.

    Автентифікація Gateway і розв’язання схвалень дотримуються спільного контракту клієнта Gateway (ідентифікатори `plugin:` розв’язуються через `plugin.approval.resolve`; інші ідентифікатори — через `exec.approval.resolve`). За замовчуванням термін дії схвалень спливає через 30 хвилин.

    Див. [схвалення Exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та гейти дій

Дії повідомлень Discord охоплюють обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файла), щоб установити зображення обкладинки запланованої події.

Гейти дій розташовані в `channels.discord.actions.*`.

Поведінка гейтів за замовчуванням:

| Група дій                                                                                                                                                               | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                    | вимкнено         |
| moderation                                                                                                                                                               | вимкнено         |
| presence                                                                                                                                                                 | вимкнено         |

## Інтерфейс компонентів v2

OpenClaw використовує компоненти Discord v2 для схвалень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького інтерфейсу (розширений режим; потребує створення навантаження компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає колір акценту, який використовують контейнери компонентів Discord (hex).
- Налаштовуйте для кожного облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві окремі голосові поверхні: **голосові канали** в реальному часі (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду з хвильовою формою). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволених ролей/користувачів.
3. Запросіть бота з областями доступу `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status` для керування сеансами. Команда використовує агента облікового запису за замовчуванням і дотримується тих самих правил списків дозволених і групової політики, що й інші команди Discord.

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

Нотатки:

- `voice.tts` перевизначає `messages.tts` лише для голосового відтворення.
- `voice.model` перевизначає LLM, який використовується лише для відповідей у голосових каналах Discord. Залиште його незаданим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрибування.
- Перевизначення `systemPrompt` для окремих каналів Discord застосовуються до ходів голосової транскрипції для цього голосового каналу.
- Ходи голосової транскрипції визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос Discord є опційним для конфігурацій лише з текстом; задайте `channels.discord.voice.enabled=true` (або залиште наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначати підписку на voice-state intent. Залиште його незаданим, щоб intent відповідав ефективному ввімкненню голосу.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів приєднання `@discordjs/voice`.
- Значення `@discordjs/voice` за замовчуванням — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready у `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання. За замовчуванням: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, доки від’єднаний голосовий сеанс почне повторне підключення, перш ніж знищити його. За замовчуванням: `15000`.
- OpenClaw також відстежує збої розшифрування отриманих даних і автоматично відновлюється, виходячи з голосового каналу та повторно приєднуючись до нього після повторних збоїв у короткому вікні.
- Якщо після оновлення журнали отримання повторно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінійка `@discordjs/voice` містить upstream-виправлення padding з PR discord.js #11449, яке закрило проблему discord.js #11419.

Конвеєр голосового каналу:

- Захоплення PCM Discord перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипція надсилається через вхідний потік і маршрутизацію Discord, тоді як LLM відповіді працює з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернути текст, оскільки голос Discord відповідає за фінальне відтворення TTS.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` зливається поверх `messages.tts`; отримане аудіо відтворюється в приєднаному каналі.

Облікові дані розв’язуються для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми та потребують аудіо OGG/Opus. OpenClaw автоматично генерує хвильову форму, але потребує `ffmpeg` і `ffprobe` на хості Gateway, щоб перевіряти та конвертувати.

- Надайте **шлях до локального файла** (URL відхиляються).
- Пропустіть текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному навантаженні).
- Приймається будь-який аудіоформат; OpenClaw конвертує в OGG/Opus за потреби.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від розв’язання користувача/учасника
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення гільдії несподівано заблоковано">

    - перевірте `groupPolicy`
    - перевірте список дозволених гільдій у `channels.discord.guilds`
    - якщо існує мапа guild `channels`, дозволені лише перелічені канали
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

    - `groupPolicy="allowlist"` без відповідного списку дозволених гільдій/каналів
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправника заблоковано списком дозволених `users` гільдії/каналу

  </Accordion>

  <Accordion title="Довготривалі ходи Discord або дубльовані відповіді">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Налаштування черги Gateway Discord:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою слухача Gateway Discord, а не тривалістю ходу агента

    Discord не застосовує тайм-аут, що належить каналу, до поставлених у чергу ходів агента. Слухачі повідомлень передають керування негайно, а поставлені в чергу запуски Discord зберігають порядок у межах сеансу, доки життєвий цикл сеансу/інструмента/середовища виконання не завершить або не перерве роботу.

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

  <Accordion title="Попередження про тайм-аут пошуку метаданих Gateway">
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої повертаються до стандартного URL Gateway Discord і обмежуються за частотою в журналах.

    Налаштування тайм-ауту метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне значення env, коли конфігурацію не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - за замовчуванням: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через тайм-аут READY Gateway">
    OpenClaw чекає на подію Gateway Discord `READY` під час запуску та після повторних підключень середовища виконання. Налаштування з кількома обліковими записами та staggered-запуском можуть потребувати довшого вікна READY під час запуску, ніж стандартне.

    Налаштування тайм-ауту READY:

    - startup для одного облікового запису: `channels.discord.gatewayReadyTimeoutMs`
    - startup для кількох облікових записів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - резервне значення startup з env, коли config не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - стандартне значення startup: `15000` (15 секунд), максимум: `120000`
    - runtime для одного облікового запису: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime для кількох облікових записів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - резервне значення runtime з env, коли config не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - стандартне значення runtime: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі-slug, зіставлення під час runtime все одно може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікування схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-бот">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадування й allowlist, щоб уникнути зациклення.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT зникає з DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була наявна логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (типове значення upstream) і налаштовуйте лише за потреби
    - стежте за журналами на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо після автоматичного повторного приєднання збої тривають, зберіть журнали й порівняйте з upstream-історією приймання DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник з конфігурації

Основний довідник: [Довідник з конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Високосигнальні поля Discord">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет слухача), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повтор: `mediaMaxMb` (обмежує вихідні завантаження Discord, за замовчуванням `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, `bindings[]` верхнього рівня (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та експлуатація

- Розглядайте токени ботів як секрети (у керованих середовищах бажано `DISCORD_BOT_TOKEN`).
- Надавайте мінімально необхідні дозволи Discord.
- Якщо розгортання/стан команд застарілі, перезапустіть gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord із gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групового чату й allowlist.
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
    Поведінка нативних команд.
  </Card>
</CardGroup>
