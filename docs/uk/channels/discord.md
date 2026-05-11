---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки, можливості та конфігурація бота Discord
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Готово для особистих повідомлень і каналів гільдій через офіційний Discord Gateway.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Discord за замовчуванням використовують режим спарювання.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес виправлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і спарувати його з OpenClaw. Ми рекомендуємо додавати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Встановіть **Username** на те ім'я, яким ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Enable privileged intents">
    Залишаючись на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов'язково)
    - **Server Members Intent** (рекомендовано; обов'язково для allowlist ролей і зіставлення імен з ID)
    - **Presence Intent** (необов'язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Copy your bot token">
    Прокрутіть сторінку **Bot** назад угору й натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається."
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він вам незабаром знадобиться.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на свій сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і ввімкніть:

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте писати в гілках Discord, зокрема у сценаріях каналів форуму або медіаканалів, які створюють або продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL внизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб під'єднати. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Повернувшись у застосунок Discord, потрібно ввімкнути Developer Mode, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч з аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші **значок сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші **власний аватар** → **Copy User ID**

    Збережіть ваші **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви надішлете всі три до OpenClaw.

  </Step>

  <Step title="Allow DMs from server members">
    Щоб спарювання працювало, Discord має дозволяти вашому боту надсилати вам особисті повідомлення. Клацніть правою кнопкою миші **значок сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам особисті повідомлення. Залиште це ввімкненим, якщо хочете використовувати особисті повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, можете вимкнути особисті повідомлення після спарювання.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Токен вашого бота Discord є секретом (як пароль). Встановіть його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

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

    Якщо OpenClaw уже працює як фонова служба, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й запустивши знову процес `openclaw gateway run`.
    Для встановлень керованої служби запустіть `openclaw gateway install` з оболонки, де присутній `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб служба могла визначити env SecretRef після перезапуску.
    Якщо ваш хост заблокований або обмежений лімітом запитів під час стартового пошуку застосунку Discord, встановіть ID застосунку/клієнта Discord з Developer Portal, щоб запуск міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для облікового запису за замовчуванням або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кілька ботів Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте його. Якщо Discord є вашим першим каналом, натомість використайте вкладку CLI / config.

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
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

        Резервний env для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптованого або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторно запустіть без `--dry-run`. Значення `token` у відкритому тексті підтримуються. Значення SecretRef також підтримуються для `channels.discord.token` через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord тримайте токен кожного бота й ID застосунку в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тому встановлюйте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID застосунку.

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
    Зачекайте, доки Gateway запрацює, а потім надішліть особисте повідомлення своєму боту в Discord. Він відповість кодом спарювання.

    <Tabs>
      <Tab title="Ask your agent">
        Надішліть код спарювання своєму агенту в наявному каналі:

        > "Approve this Discord pairing code: `<CODE>`"
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
Визначення токена враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Якщо два ввімкнені облікові записи Discord визначаються до одного й того самого токена бота, OpenClaw запускає лише один монітор Gateway для цього токена. Токен із конфігурації має пріоритет над резервним env за замовчуванням; інакше перемагає перший увімкнений обліковий запис, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для конкретного виклику використовується для цього виклику. Це застосовується до дій надсилання та читання/перевірки (наприклад read/search/fetch/thread/pins/permissions). Налаштування політики облікового запису/повторних спроб усе одно беруться з вибраного облікового запису в активному runtime snapshot.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли особисті повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

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
    За замовчуванням ваш агент відповідає в каналах гільдії лише коли його згадують через @mention. Для приватного сервера ви, ймовірно, хочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдії звичайні фінальні відповіді асистента за замовчуванням залишаються приватними. Видимий вивід Discord потрібно надсилати явно за допомогою інструмента `message`, тож агент може за замовчуванням лишатися непомітним і публікувати лише тоді, коли вирішить, що відповідь у канал корисна.

    Це означає, що вибрана модель має надійно викликати інструменти. Якщо Discord показує індикатор набору, а журнали показують використання токенів, але повідомлення не опубліковано, перевірте журнал сесії на наявність тексту асистента з `didSendViaMessagingTool: false`. Це означає, що модель створила приватну фінальну відповідь замість виклику `message(action=send)`. Перейдіть на сильнішу модель для виклику інструментів або використайте конфігурацію нижче, щоб відновити застарілі автоматичні фінальні відповіді.

    <Tabs>
      <Tab title="Ask your agent">
        > "Allow my agent to respond on this server without having to be @mentioned"
      </Tab>
      <Tab title="Config">
        Встановіть `requireMention: false` у конфігурації вашої гільдії:

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

        Щоб відновити застарілі автоматичні фінальні відповіді для кімнат групових чатів/каналів, встановіть `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    За замовчуванням довгострокова пам'ять (MEMORY.md) завантажується лише в сесіях особистих повідомлень. Канали гільдії не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Ask your agent">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони інжектуються в кожну сесію). Тримайте довгострокові нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам'яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкуватися. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що підходить вашому робочому процесу.

## Модель виконання

- Gateway керує з’єднанням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді Discord повертаються до Discord.
- Метадані гільдії/каналу Discord додаються до запиту моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель копіює цю обгортку
  назад, OpenClaw вилучає скопійовані метадані з вихідних відповідей і з
  майбутнього контексту повторного відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують головну сесію агента (`agent:main:main`).
- Канали гільдії ізольовані ключами сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизованої сесії розмови.
- Доставка текстових оголошень Cron/Heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа та структуровані payload компонентів залишаються
  багатоповідомними, коли агент створює кілька deliverable payloads.

## Форумні канали

Форумні та медіаканали Discord приймають лише дописи в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити тред. Заголовок треду використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити тред напряму. Не передавайте `--message-id` для форумних каналів.

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

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самого треду (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодій маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити використовувати кнопки, меню вибору та форми кілька разів до завершення їхнього терміну дії.

Щоб обмежити, хто може натиснути кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Коли це налаштовано, користувачі без збігу отримують ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з розкривними списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору ефемерна, і використовувати її може лише користувач, який її викликав. Меню вибору Discord обмежені 25 варіантами, тому додавайте записи `provider/*` до `agents.defaults.models`, коли потрібно, щоб вибір показував динамічно виявлені моделі лише для вибраних провайдерів, таких як `openai-codex` або `vllm`.

Вкладення файлів:

- Блоки `file` мають указувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` із максимум 5 полями
- Типи полів: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw автоматично додає кнопку-тригер

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
    `channels.discord.dmPolicy` керує доступом до DM. `channels.discord.allowFrom` є канонічним allowlist DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`)
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

    Прості числові ID зазвичай розпізнаються як ID каналів, коли активне типове значення каналу, але ID, перелічені в ефективному DM `allowFrom` облікового запису, трактуються як цілі DM користувачів для сумісності.

  </Tab>

  <Tab title="Групи доступу">
    Авторизація Discord DM і текстових команд може використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Імена груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, учасники якої виражені звичайним для кожного каналу синтаксисом `allowFrom`, або `type: "discord.channelAudience"`, коли поточна аудиторія Discord-каналу `ViewChannel` має динамічно визначати членство. Спільну поведінку груп доступу задокументовано тут: [Групи доступу](/uk/channels/access-groups).

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

    Приклад: дозволити будь-кому, хто бачить `#maintainers`, надсилати DM боту, залишаючи DM закритими для всіх інших.

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

    Пошуки завершуються закрито. Якщо Discord повертає `Missing Access`, пошук учасника завершується невдало або канал належить іншій гільдії, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу за аудиторією каналу. DM не містять стану учасника гільдії, тому OpenClaw визначає учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Політика гільдії">
    Обробка гільдій керується `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечний базовий рівень, коли існує `channels.discord`, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (`id` бажаний, slug приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволені, коли вони збігаються з `users` АБО `roles`
    - прямий збіг імен/тегів за замовчуванням вимкнено; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо гільдія має налаштовані `channels`, канали не зі списку відхиляються
    - якщо гільдія не має блоку `channels`, дозволені всі канали в цій гільдії з allowlist

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

    Якщо ви встановили лише `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, runtime fallback — `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Згадки та групові DM">
    Повідомлення гільдії за замовчуванням обмежуються згадками.

    Виявлення згадок охоплює:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    Під час написання вихідних повідомлень Discord використовуйте канонічний синтаксис згадок: `<@USER_ID>` для користувачів, `<#CHANNEL_ID>` для каналів і `<@&ROLE_ID>` для ролей. Не використовуйте застарілу форму згадки псевдоніма `<@!USER_ID>`.

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, що згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slugs)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише за гільдією. Якщо прив’язка також задає інші поля збігу (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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
- `commands.native=false` пропускає реєстрацію slash-команд Discord і очищення під час запуску. Раніше зареєстровані команди можуть залишатися видимими в Discord, доки ви не видалите їх із застосунку Discord.
- Авторизація нативних команд використовує ті самі списки дозволених користувачів і політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в UI Discord для користувачів без авторизації; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Типові налаштування slash-команд:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Теги відповіді та нативні відповіді">
    Discord підтримує теги відповіді у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (типово)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне створення гілок відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.
    `first` завжди додає неявне нативне посилання відповіді до першого вихідного повідомлення Discord для цього ходу.
    `batched` додає неявне нативне посилання відповіді Discord лише тоді, коли
    вхідний хід був debounce-пакетом із кількох повідомлень. Це корисно,
    коли ви хочете нативні відповіді переважно для неоднозначних швидких чатів, а не для кожного
    ходу з одним повідомленням.

    ID повідомлень показуються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд live stream">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` | `partial` | `block` | `progress` (типово). `progress` зберігає одну редаговану чернетку статусу й оновлює її прогресом інструментів до остаточної доставки; спільна початкова мітка є рухомим рядком, тому вона прокручується вгору, як і решта, коли з’являється достатньо роботи. `streamMode` — застарілий runtime-псевдонім. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на канонічний ключ.

    Установіть `channels.discord.streaming.mode` у `off`, щоб вимкнути редагування попереднього перегляду Discord. Якщо block streaming Discord явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного streaming.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` редагує одне повідомлення попереднього перегляду в міру надходження токенів.
    - `block` видає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, з обмеженням до `textChunkLimit`).
    - Фінальні повідомлення з медіа, помилкою або явною відповіддю скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (типово `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.
    - Рядки інструментів/прогресу відображаються як компактні emoji + заголовок + деталі, коли доступно, наприклад `🛠️ Bash: run tests` або `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` керує деталями команди/виконання в компактних рядках прогресу: `raw` (типово) або `status` (лише мітка інструмента).

    Приховати необроблений текст команди/виконання, зберігаючи компактні рядки прогресу:

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

    Streaming попереднього перегляду працює лише з текстом; відповіді з медіа повертаються до звичайної доставки. Коли `block` streaming явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного streaming.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка гілок">
    Контекст історії guild:

    - `channels.discord.historyLimit` типово `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сеанси каналу й успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси гілок успадковують вибір `/model` рівня сеансу батьківського каналу як fallback лише для моделі; локальні для гілки вибори `/model` усе ще мають пріоритет, а історія транскрипту батьківського каналу не копіюється, якщо успадкування транскрипту не ввімкнено.
    - `channels.discord.thread.inheritParent` (типово `false`) вмикає для нових автоматичних гілок початкове заповнення з батьківського транскрипту. Перевизначення для окремого акаунта розміщені в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть розв’язувати DM-цілі `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час fallback активації на етапі відповіді.

    Теми каналів додаються як **ненадійний** контекст. Списки дозволених користувачів обмежують, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сеанси, прив’язані до гілки, для субагентів">
    Discord може прив’язати гілку до цілі сеансу, щоб подальші повідомлення в цій гілці продовжували маршрутизуватися до того самого сеансу (включно із сеансами субагентів).

    Команди:

    - `/focus <target>` прив’язати поточну/нову гілку до цілі субагента/сеансу
    - `/unfocus` видалити прив’язку поточної гілки
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичний unfocus через неактивність для сфокусованих прив’язок
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
    - `spawnSessions` керує автоматичним створенням/прив’язкою гілок для `sessions_spawn({ thread: true })` і породження гілок ACP. Типово: `true`.
    - `defaultSpawnContext` керує нативним контекстом субагента для породжень, прив’язаних до гілки. Типово: `"fork"`.
    - Застарілі ключі `spawnSubagentSessions`/`spawnAcpSessions` мігруються через `openclaw doctor --fix`.
    - Якщо прив’язки гілок вимкнено для акаунта, `/focus` і пов’язані операції прив’язки гілок недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних "always-on" робочих просторів ACP налаштуйте верхньорівневі типізовані прив’язки ACP, націлені на розмови Discord.

    Шлях конфігурації:

    - `bindings[]` із `type: "acp"` і `match.channel: "discord"`

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
    - `spawnSessions` контролює створення/прив’язку дочірніх гілок через `--thread auto|here`.

    Див. [ACP Agents](/uk/tools/acp-agents) для деталей поведінки прив’язки.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для окремого guild:

    - `off`
    - `own` (типово)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованого сеансу Discord.

  </Accordion>

  <Accordion title="Ack-реакції">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback до emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode emoji або назви користувацьких emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або акаунта.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані каналом, увімкнено за замовчуванням.

    Це впливає на потоки `/config set|unset` (коли функції команд увімкнено).

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
    Маршрутизуйте WebSocket-трафік Gateway Discord і стартові REST-запити (ID застосунку + розв’язання списку дозволених) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Перевизначення для окремого акаунта:

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
    - пошуки використовують ID оригінального повідомлення та обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення обробляються як повідомлення ботів і відкидаються, якщо `allowBots=true` не задано

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

    Мапа типів активності:

    - 0: Грає
    - 1: Транслює (потребує `activityUrl`)
    - 2: Слухає
    - 3: Дивиться
    - 4: Власний (використовує текст активності як стан статусу; emoji необов'язковий)
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

    Автоматична присутність зіставляє доступність runtime зі статусом Discord: справний => online, погіршений або невідомий => idle, вичерпаний або недоступний => dnd. Необов'язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Підтвердження в Discord">
    Discord підтримує обробку підтверджень на основі кнопок у DM і може додатково публікувати запити підтвердження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов'язково; за можливості використовує запасний варіант `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні підтвердження виконання, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного затверджувача: з `execApprovals.approvers` або з `commands.ownerAllowFrom`. Discord не виводить затверджувачів виконання з канального `allowFrom`, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Установіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт підтверджень.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити підтвердження та фінальні результати приватно. Спочатку він пробує Discord DM, коли власник, що викликає команду, має маршрут власника Discord; якщо він недоступний, використовується перший доступний маршрут власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит підтвердження видимий у каналі. Лише визначені затверджувачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити підтвердження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо отримати з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відтворює спільні кнопки підтвердження, які використовують інші чат-канали. Нативний адаптер Discord переважно додає маршрутизацію DM для затверджувачів і розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має додавати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що чат-підтвердження недоступні або ручне підтвердження є єдиним шляхом.
    Якщо нативний runtime підтверджень Discord не активний, OpenClaw залишає
    локальний детермінований запит `/approve <id> <decision>` видимим. Якщо
    runtime активний, але нативну картку неможливо доставити до жодної цілі,
    OpenClaw надсилає резервне повідомлення в той самий чат із точною командою `/approve`
    з очікуваного підтвердження.

    Автентифікація Gateway і розв'язання підтверджень відповідають спільному контракту клієнта Gateway (`plugin:` ID розв'язуються через `plugin.approval.resolve`; інші ID через `exec.approval.resolve`). Типово підтвердження спливають через 30 хвилин.

    Див. [Підтвердження виконання](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії з повідомленнями Discord охоплюють обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов'язковий параметр `image` (URL або шлях до локального файла), щоб установити обкладинку запланованої події.

Шлюзи дій розташовані в `channels.discord.actions.*`.

Типова поведінка шлюзів:

| Група дій                                                                                                                                                                | Типово     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено  |
| roles                                                                                                                                                                    | вимкнено   |
| moderation                                                                                                                                                               | вимкнено   |
| presence                                                                                                                                                                 | вимкнено   |

## UI компонентів v2

OpenClaw використовує компоненти Discord v2 для підтверджень виконання та міжконтекстних маркерів. Дії з повідомленнями Discord також можуть приймати `components` для власного UI (розширений режим; потребує побудови payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає колір акценту, який використовують контейнери компонентів Discord (hex).
- Установлюється для кожного облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві окремі голосові поверхні: realtime **голосові канали** (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду waveform). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються allowlist ролей/користувачів.
3. Запросіть бота зі scopes `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status`, щоб керувати сесіями. Команда використовує типового агента облікового запису та дотримується тих самих правил allowlist і групової політики, що й інші команди Discord.

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
        model: "openai-codex/gpt-5.5",
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
          voice: "cedar",
        },
      },
    },
  },
}
```

Примітки:

- `voice.tts` перевизначає `messages.tts` лише для голосового відтворення `stt-tts`. Режими реального часу використовують `voice.realtime.voice`.
- `voice.mode` керує шляхом розмови. Типове значення — `agent-proxy`: голосовий фронтенд реального часу обробляє таймінг реплік, переривання та відтворення, делегує змістовну роботу маршрутизованому агенту OpenClaw через `openclaw_agent_consult` і обробляє результат як текстовий запит Discord від цього мовця. `stt-tts` зберігає старіший пакетний потік STT плюс TTS. `bidi` дає змогу моделі реального часу спілкуватися напряму, водночас надаючи `openclaw_agent_consult` для мозку OpenClaw.
- `voice.agentSession` керує тим, яка розмова OpenClaw отримує голосові репліки. Залиште це значення незаданим для власної сесії голосового каналу або встановіть `{ mode: "target", target: "channel:<text-channel-id>" }`, щоб голосовий канал працював як розширення мікрофона/динаміка для наявної сесії текстового каналу Discord, наприклад `#maintainers`.
- `voice.model` перевизначає мозок агента OpenClaw для голосових відповідей Discord і консультацій реального часу. Залиште це значення незаданим, щоб успадкувати модель маршрутизованого агента. Це окремо від `voice.realtime.model`.
- `agent-proxy` маршрутизує мовлення через `discord-voice`, що зберігає звичайну авторизацію власника/інструментів для мовця й цільової сесії, але приховує інструмент агента `tts`, оскільки Discord voice відповідає за відтворення. Типово `agent-proxy` надає консультації повний доступ до інструментів, еквівалентний власнику, для мовців-власників (`voice.realtime.toolPolicy: "owner"`) і наполегливо віддає перевагу консультації з агентом OpenClaw перед змістовними відповідями (`voice.realtime.consultPolicy: "always"`). У цьому типовому режимі `always` шар реального часу не промовляє автоматично заповнювальні фрази перед відповіддю консультації; він захоплює та транскрибує мовлення, а потім озвучує маршрутизовану відповідь OpenClaw. Якщо кілька примусових відповідей консультації завершуються, поки Discord ще відтворює першу відповідь, пізніші відповіді з точним мовленням ставляться в чергу, доки відтворення не стане неактивним, замість замінювати мовлення посеред речення.
- У режимі `stt-tts` STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- У режимах реального часу `voice.realtime.provider`, `voice.realtime.model` і `voice.realtime.voice` налаштовують аудіосесію реального часу. Для OpenAI Realtime 2 плюс мозку Codex використовуйте `voice.realtime.model: "gpt-realtime-2"` і `voice.model: "openai-codex/gpt-5.5"`.
- Провайдер OpenAI Realtime приймає поточні назви подій Realtime 2 і застарілі сумісні з Codex псевдоніми для подій вихідного аудіо та транскриптів, тому сумісні знімки провайдера можуть змінюватися без втрати аудіо асистента.
- `voice.realtime.bargeIn` керує тим, чи події початку мовлення в Discord переривають активне відтворення реального часу. Якщо не задано, це значення наслідує налаштування переривання вхідного аудіо провайдера реального часу.
- `voice.realtime.minBargeInAudioEndMs` керує мінімальною тривалістю відтворення асистента перед тим, як barge-in OpenAI Realtime обрізає аудіо. Типово: `250`. Установіть `0` для негайного переривання в кімнатах із низьким рівнем відлуння або збільште значення для конфігурацій із динаміками та сильним відлунням.
- Для голосу OpenAI під час відтворення в Discord установіть `voice.tts.provider: "openai"` і виберіть голос Text-to-speech у `voice.tts.openai.voice` або `voice.tts.providers.openai.voice`. `cedar` — вдалий вибір із чоловічим звучанням у поточній моделі OpenAI TTS.
- Перевизначення `systemPrompt` для окремих каналів Discord застосовуються до реплік голосового транскрипту для цього голосового каналу.
- Репліки голосового транскрипту визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власників (наприклад, `gateway` і `cron`).
- Голос Discord є opt-in для конфігурацій лише з текстом; установіть `channels.discord.voice.enabled=true` (або збережіть наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на voice-state intent. Залиште це значення незаданим, щоб intent відповідав ефективному ввімкненню голосу.
- Якщо `voice.autoJoin` має кілька записів для тієї самої гільдії, OpenClaw приєднується до останнього налаштованого каналу для цієї гільдії.
- `voice.allowedChannels` — необов’язковий allowlist резидентності. Залиште це значення незаданим, щоб дозволити `/vc join` у будь-який авторизований голосовий канал Discord. Якщо задано, `/vc join`, auto-join під час запуску та переміщення голосового стану бота обмежуються переліченими записами `{ guildId, channelId }`. Установіть порожній масив, щоб заборонити всі голосові приєднання Discord. Якщо Discord перемістить бота за межі allowlist, OpenClaw залишить цей канал і повторно приєднається до налаштованої цілі auto-join, коли вона доступна.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються напряму до параметрів приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- OpenClaw типово використовує чистий JS-декодер `opusscript` для приймання голосу Discord. Необов’язковий нативний пакет `@discordjs/opus` ігнорується політикою встановлення pnpm у репозиторії, щоб звичайні встановлення, Docker-лінії та непов’язані тести не компілювали нативний addon. Виділені хости для голосової продуктивності можуть opt-in через `OPENCLAW_DISCORD_OPUS_DECODER=native` після встановлення нативного addon.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для спроб `/vc join` і auto-join. Типово: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, доки від’єднана голосова сесія почне повторне підключення, перш ніж знищити її. Типово: `15000`.
- У режимі `stt-tts` голосове відтворення не зупиняється лише через те, що інший користувач починає говорити. Щоб уникнути циклів зворотного зв’язку, OpenClaw ігнорує нове захоплення голосу, поки TTS відтворюється; говоріть після завершення відтворення для наступної репліки. Режими реального часу передають початок мовлення як сигнали barge-in провайдеру реального часу.
- У режимах реального часу відлуння від динаміків у відкритий мікрофон може виглядати як barge-in і переривати відтворення. Для кімнат Discord із сильним відлунням установіть `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, щоб OpenAI не переривався автоматично на вхідному аудіо. Додайте `voice.realtime.bargeIn: true`, якщо ви все ще хочете, щоб події початку мовлення Discord переривали активне відтворення. Міст OpenAI Realtime ігнорує обрізання відтворення, коротші за `voice.realtime.minBargeInAudioEndMs`, як імовірне відлуння/шум і логує їх як пропущені замість очищення відтворення Discord.
- `voice.captureSilenceGraceMs` керує тим, як довго OpenClaw чекає після того, як Discord повідомляє, що мовець зупинився, перш ніж фіналізувати цей аудіосегмент для STT. Типово: `2500`; збільште це значення, якщо Discord розбиває звичайні паузи на уривчасті часткові транскрипти.
- Коли вибраним провайдером TTS є ElevenLabs, голосове відтворення Discord використовує потоковий TTS і починається з потоку відповіді провайдера. Провайдери без підтримки потокового передавання повертаються до шляху синтезованого тимчасового файла.
- OpenClaw також відстежує помилки розшифрування приймання й автоматично відновлюється, виходячи з голосового каналу та повторно приєднуючись до нього після повторних помилок у короткому вікні.
- Якщо журнали приймання повторно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` після оновлення, зберіть звіт про залежності та журнали. Вбудована лінія `@discordjs/voice` містить upstream-виправлення padding з PR discord.js #11449, яке закрило issue discord.js #11419.
- Події приймання `The operation was aborted` очікувані, коли OpenClaw фіналізує захоплений сегмент мовця; це докладні діагностичні повідомлення, а не попередження.
- Докладні голосові журнали Discord містять обмежений однорядковий попередній перегляд STT-транскрипту для кожного прийнятого сегмента мовця, тож налагодження показує і сторону користувача, і сторону відповіді агента без виведення необмеженого тексту транскрипту.
- У режимі `agent-proxy` примусовий fallback консультації пропускає ймовірно неповні фрагменти транскрипту, наприклад текст, що закінчується на `...` або кінцевий сполучник на кшталт `and`, а також очевидні неакційні завершення на кшталт “be right back” або “bye”. Журнали показують `forced agent consult skipped reason=...`, коли це запобігає застарілій відповіді в черзі.

Налаштування нативного opus для source checkout:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Використовуйте Node 22 для Gateway, коли потрібен upstream macOS arm64 prebuilt native addon. Якщо ви використовуєте інше середовище виконання Node, opt-in інсталятору може знадобитися локальний toolchain source-build `node-gyp`.

Після встановлення нативного addon запустіть Gateway з:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Докладні голосові журнали мають показувати `discord voice: opus decoder: @discordjs/opus`. Без env opt-in або якщо нативний addon відсутній чи не може завантажитися на хості, OpenClaw логує `discord voice: opus decoder: opusscript` і продовжує приймати голос через чистий JS fallback.

Конвеєр STT плюс TTS:

- Захоплення Discord PCM перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через ingress і маршрутизацію Discord, тоді як response LLM працює з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернутий текст, оскільки Discord voice відповідає за фінальне відтворення TTS.
- `voice.model`, якщо задано, перевизначає лише response LLM для цієї репліки голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; провайдери з підтримкою потокового передавання подають дані безпосередньо в програвач, інакше отриманий аудіофайл відтворюється в приєднаному каналі.

Приклад типової сесії голосового каналу agent-proxy:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Без блока `voice.agentSession` кожен голосовий канал отримує власну маршрутизовану сесію OpenClaw. Наприклад, `/vc join channel:234567890123456789` спілкується із сесією для цього голосового каналу Discord. Модель реального часу — це лише голосовий фронтенд; змістовні запити передаються налаштованому агенту OpenClaw. Якщо модель реального часу створює фінальний транскрипт без виклику інструмента консультації, OpenClaw примусово виконує консультацію як fallback, щоб типова поведінка все одно була схожою на розмову з агентом.

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Приклад realtime bidi:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Голос як розширення наявної сесії каналу Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

У режимі `agent-proxy` бот приєднується до налаштованого голосового каналу, але репліки агента OpenClaw використовують звичайну маршрутизовану сесію та агента цільового каналу. Голосова сесія реального часу озвучує повернутий результат назад у голосовий канал. Агент-супервізор усе ще може використовувати звичайні інструменти повідомлень відповідно до своєї політики інструментів, зокрема надсилати окреме повідомлення Discord, якщо це правильна дія.

Корисні форми цілі:

- `target: "channel:123456789012345678"` маршрутизує через сесію текстового каналу Discord.
- `target: "123456789012345678"` обробляється як ціль каналу.
- `target: "dm:123456789012345678"` або `target: "user:123456789012345678"` маршрутизує через цю сесію direct message.

Приклад OpenAI Realtime із сильним відлунням:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

Використовуйте це, коли модель чує власне відтворення Discord через відкритий мікрофон, але ви все одно хочете переривати її мовленням. OpenClaw не дає OpenAI автоматично переривати відповідь на сирому вхідному аудіо, тоді як `bargeIn: true` дає змогу подіям початку мовлення в Discord і вже активному аудіо мовця скасовувати активні відповіді в реальному часі до того, як наступна захоплена репліка дійде до OpenAI. Дуже ранні сигнали втручання з `audioEndMs` нижче `minBargeInAudioEndMs` вважаються ймовірним відлунням або шумом і ігноруються, щоб модель не обривалася на першому кадрі відтворення.

Очікувані голосові журнали:

- Під час приєднання: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Під час запуску реального часу: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Під час аудіо мовця: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` і `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Під час пропущеного застарілого мовлення: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` або `reason=non-actionable-closing ...`
- Після завершення відповіді в реальному часі: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Під час зупинки або скидання відтворення: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Під час консультації в реальному часі: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Під час відповіді агента: `discord voice: agent turn answer ...`
- Під час поставленого в чергу точного мовлення: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, після чого `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Під час виявлення втручання: `discord voice: realtime barge-in detected source=speaker-start ...` або `discord voice: realtime barge-in detected source=active-speaker-audio ...`, після чого `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Під час переривання в реальному часі: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, після чого або `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, або `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Під час ігнорованого відлуння або шуму: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Коли втручання вимкнено: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Під час неактивного відтворення: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Щоб налагодити обривання аудіо, читайте голосові журнали реального часу як часову шкалу:

1. `realtime audio playback started` означає, що Discord почав відтворювати аудіо асистента. З цього моменту міст починає рахувати фрагменти виводу асистента, PCM-байти Discord, байти постачальника реального часу та тривалість синтезованого аудіо.
2. `realtime speaker turn opened` позначає, що мовець Discord став активним. Якщо відтворення вже активне й `bargeIn` увімкнено, після цього може з’явитися `barge-in detected source=speaker-start`.
3. `realtime input audio started` позначає перший фактичний аудіокадр, отриманий для цієї репліки мовця. `outputActive=true` або ненульове `outputAudioMs` тут означає, що мікрофон надсилає вхідний сигнал, поки відтворення асистента ще активне.
4. `barge-in detected source=active-speaker-audio` означає, що OpenClaw побачив живе аудіо мовця, поки відтворення асистента було активним. Це корисно, щоб відрізнити справжнє переривання від події початку мовлення в Discord без корисного аудіо.
5. `barge-in requested reason=...` означає, що OpenClaw попросив постачальника реального часу скасувати або обрізати активну відповідь. Він містить `outputAudioMs`, `outputActive` і `playbackChunks`, щоб ви могли побачити, скільки аудіо асистента фактично відтворилося до переривання.
6. `realtime audio playback stopped reason=...` — це локальна точка скидання відтворення Discord. Причина вказує, хто зупинив відтворення: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` або `session-close`.
7. `realtime speaker turn closed` підсумовує захоплену вхідну репліку. `chunks=0` або `hasAudio=false` означає, що репліка мовця відкрилася, але жодне придатне аудіо не дійшло до мосту реального часу. `interruptedPlayback=true` означає, що ця вхідна репліка наклалася на вивід асистента й запустила логіку втручання.

Корисні поля:

- `outputAudioMs`: тривалість аудіо асистента, згенерована постачальником реального часу до цього рядка журналу.
- `audioMs`: тривалість аудіо асистента, яку OpenClaw порахував до зупинки відтворення.
- `elapsedMs`: час за настінним годинником між відкриттям і закриттям потоку відтворення або репліки мовця.
- `discordBytes`: стерео PCM-байти 48 кГц, надіслані до або отримані з голосу Discord.
- `realtimeBytes`: PCM-байти у форматі постачальника, надіслані до або отримані від постачальника реального часу.
- `playbackChunks`: фрагменти аудіо асистента, переслані до Discord для активної відповіді.
- `sinceLastAudioMs`: проміжок між останнім захопленим аудіокадром мовця та закриттям репліки мовця.

Поширені шаблони:

- Негайний обрив із `source=active-speaker-audio`, малим `outputAudioMs` і тим самим користувачем поруч зазвичай вказує на потрапляння відлуння динаміка в мікрофон. Збільште `voice.realtime.minBargeInAudioEndMs`, зменште гучність динаміків, використовуйте навушники або встановіть `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, після якого йде `speaker turn closed ... hasAudio=false`, означає, що Discord повідомив про початок мовлення, але аудіо не дійшло до OpenClaw. Це може бути тимчасова голосова подія Discord, поведінка шумового порога або клієнт, який на мить активував мікрофон.
- `audio playback stopped reason=stream-close` без близького втручання або `provider-clear-audio` означає, що локальний потік відтворення Discord несподівано завершився. Перевірте попередні журнали постачальника та програвача Discord.
- `capture ignored during playback (barge-in disabled)` означає, що OpenClaw навмисно відкинув вхідний сигнал, поки аудіо асистента було активним. Увімкніть `voice.realtime.bargeIn`, якщо хочете, щоб мовлення переривало відтворення.
- `barge-in ignored ... outputActive=false` означає, що VAD Discord або постачальника повідомив про мовлення, але OpenClaw не мав активного відтворення для переривання. Це не має обривати аудіо.

Облікові дані визначаються окремо для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio`, автентифікація TTS для `messages.tts`/`voice.tts` і автентифікація постачальника реального часу для `voice.realtime.providers` або звичайної конфігурації автентифікації постачальника.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми та потребують аудіо OGG/Opus. OpenClaw генерує хвильову форму автоматично, але на хості Gateway потрібні `ffmpeg` і `ffprobe` для перевірки та конвертації.

- Надайте **локальний шлях до файлу** (URL-адреси відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному корисному навантаженні).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені наміри або бот не бачить повідомлень гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від визначення користувача або учасника
    - перезапустіть Gateway після зміни намірів

  </Accordion>

  <Accordion title="Повідомлення гільдії несподівано заблоковано">

    - перевірте `groupPolicy`
    - перевірте список дозволених гільдій у `channels.discord.guilds`
    - якщо існує мапа `channels` гільдії, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Вимога згадки вимкнена, але все одно заблоковано">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволених гільдій або каналів
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправника заблоковано списком дозволених `users` на рівні гільдії або каналу

  </Accordion>

  <Accordion title="Довготривалі репліки Discord або дубльовані відповіді">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Параметри черги Gateway Discord:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою слухача Gateway Discord, а не тривалістю репліки агента

    Discord не застосовує тайм-аут, що належить каналу, до поставлених у чергу реплік агента. Слухачі повідомлень одразу передають роботу далі, а поставлені в чергу запуски Discord зберігають порядок у межах сесії, доки життєвий цикл сесії, інструмента або середовища виконання не завершить або не перерве роботу.

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
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої повертаються до стандартної URL-адреси Gateway Discord і обмежуються за частотою в журналах.

    Параметри тайм-ауту метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне значення env, коли конфігурацію не встановлено: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - стандартне значення: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через тайм-аут READY Gateway">
    OpenClaw очікує подію Gateway Discord `READY` під час запуску та після повторних підключень середовища виконання. Налаштування з кількома обліковими записами й поетапним запуском можуть потребувати довшого стартового вікна READY, ніж стандартне.

    Параметри тайм-ауту READY:

    - запуск, один обліковий запис: `channels.discord.gatewayReadyTimeoutMs`
    - запуск, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - резервне значення env для запуску, коли конфігурацію не встановлено: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - стандартне значення запуску: `15000` (15 секунд), максимум: `120000`
    - середовище виконання, один обліковий запис: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - середовище виконання, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - резервне значення env для середовища виконання, коли конфігурацію не встановлено: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - стандартне значення середовища виконання: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ідентифікаторів каналів.

    Якщо ви використовуєте ключі-слаги, зіставлення під час виконання все одно може працювати, але проба не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-бот">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    If you set `channels.discord.allowBots=true`, use strict mention and allowlist rules to avoid loop behavior.
    Prefer `channels.discord.allowBots="mentions"` to only accept bot messages that mention the bot.

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - keep OpenClaw current (`openclaw update`) so the Discord voice receive recovery logic is present
    - confirm `channels.discord.voice.daveEncryption=true` (default)
    - start from `channels.discord.voice.decryptionFailureTolerance=24` (upstream default) and tune only if needed
    - watch logs for:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - if failures continue after automatic rejoin, collect logs and compare against the upstream DAVE receive history in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) and [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Configuration reference

Primary reference: [Configuration reference - Discord](/uk/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (listener budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (legacy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (caps outbound Discord uploads, default `100MB`), `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Safety and operations

- Treat bot tokens as secrets (`DISCORD_BOT_TOKEN` preferred in supervised environments).
- Grant least-privilege Discord permissions.
- If command deploy/state is stale, restart gateway and re-check with `openclaw channels status --probe`.

## Related

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Pair a Discord user to the gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Group chat and allowlist behavior.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Route inbound messages to agents.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Threat model and hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/uk/concepts/multi-agent">
    Map guilds and channels to agents.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Native command behavior.
  </Card>
</CardGroup>
