---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

Готово для особистих повідомлень і каналів гільдій через офіційний Discord gateway.

<CardGroup cols={3}>
  <Card title="Створення пари" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Discord за замовчуванням використовують режим створення пари.
  </Card>
  <Card title="Команди зі скісною рискою" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами та потік відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити нову програму з ботом, додати бота на свій сервер і створити для нього пару з OpenClaw. Рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть програму Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть її, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ім’я, яким ви називаєте свого агента OpenClaw.

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

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він скоро знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення й додайте бота на свій сервер">
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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в гілках Discord, зокрема у сценаріях форумних або медіаканалів, які створюють чи продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть режим розробника та зберіть свої ID">
    Повернувшись у програму Discord, потрібно ввімкнути режим розробника, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші **значок сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші **власний аватар** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви надішлете всі три до OpenClaw.

  </Step>

  <Step title="Дозвольте особисті повідомлення від учасників сервера">
    Щоб створення пари працювало, Discord має дозволяти вашому боту надсилати вам особисті повідомлення. Клацніть правою кнопкою миші **значок сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дає змогу учасникам сервера (включно з ботами) надсилати вам особисті повідомлення. Залиште це ввімкненим, якщо хочете використовувати особисті повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, можете вимкнути особисті повідомлення після створення пари.

  </Step>

  <Step title="Безпечно встановіть токен бота (не надсилайте його в чаті)">
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

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через програму OpenClaw для Mac або зупинивши й повторно запустивши процес `openclaw gateway run`.
    Для встановлень керованого сервісу запустіть `openclaw gateway install` з оболонки, де присутній `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб сервіс міг розв’язати env SecretRef після перезапуску.
    Якщо ваш хост заблокований або обмежений за частотою запитів під час стартового пошуку програми Discord, установіть ID програми/клієнта Discord з Developer Portal, щоб під час запуску пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для стандартного облікового запису або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кілька ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і створіть пару">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, натомість скористайтеся вкладкою CLI / конфігурація.

        > "Я вже встановив токен свого бота Discord у конфігурації. Заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / конфігурація">
        Якщо ви надаєте перевагу файловій конфігурації, установіть:

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

        Резервне значення env для стандартного облікового запису:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторно запустіть без `--dry-run`. Підтримуються відкриті значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` через постачальників env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord тримайте токен кожного бота та ID програми в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тож установлюйте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID програми.

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

  <Step title="Підтвердьте перше створення пари в особистих повідомленнях">
    Зачекайте, доки gateway запуститься, а потім напишіть своєму боту в Discord в особисті повідомлення. Він відповість кодом створення пари.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код створення пари своєму агенту в наявному каналі:

        > "Підтверди цей код створення пари Discord: `<CODE>`"
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
Розв’язання токенів враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для стандартного облікового запису.
Якщо два ввімкнені облікові записи Discord розв’язуються в той самий токен бота, OpenClaw запускає лише один монітор gateway для цього токена. Токен із конфігурації має пріоритет над стандартним резервним значенням env; інакше перший увімкнений обліковий запис перемагає, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується для цього виклику. Це застосовується до дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису й налаштування повторних спроб усе одно беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли особисті повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

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

  <Step title="Дозвольте відповіді без @mention">
    За замовчуванням ваш агент відповідає в каналах гільдії лише коли його згадують через @mention. Для приватного сервера ви, ймовірно, хочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдії звичайні фінальні відповіді асистента за замовчуванням залишаються приватними. Видимий вивід Discord потрібно надсилати явно за допомогою інструмента `message`, щоб агент міг за замовчуванням перебувати в режимі очікування й публікувати лише тоді, коли вирішить, що відповідь у каналі корисна.

    Це означає, що вибрана модель має надійно викликати інструменти. Якщо Discord показує введення тексту, а журнали показують використання токенів, але повідомлення не опубліковано, перевірте журнал сесії на текст асистента з `didSendViaMessagingTool: false`. Це означає, що модель створила приватну фінальну відповідь замість виклику `message(action=send)`. Перемкніться на сильнішу модель для виклику інструментів або використайте конфігурацію нижче, щоб відновити застарілі автоматичні фінальні відповіді.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без необхідності бути згаданим через @mention"
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

        Щоб відновити застарілі автоматичні фінальні відповіді для групових/канальних кімнат, установіть `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Сплануйте пам’ять у каналах гільдії">
    За замовчуванням довготривала пам’ять (MEMORY.md) завантажується лише в сесіях особистих повідомлень. Канали гільдії не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони впроваджуються в кожну сесію). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкуватися. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що інше, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway володіє підключенням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді Discord повертаються в Discord.
- Метадані гільдії/каналу Discord додаються до промпта моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель копіює цей конверт
  назад, OpenClaw вилучає скопійовані метадані з вихідних відповідей і з
  майбутнього контексту відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали гільдій ізольовані ключами сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас усе ще передаючи `CommandTargetSessionKey` до маршрутизованої сесії розмови.
- Доставка текстових оголошень cron/heartbeat у Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа й структуровані payload компонентів залишаються
  багатоповідомленнєвими, коли агент видає кілька payload, придатних для доставки.

## Канали форумів

Канали форумів і медіа в Discord приймають лише дописи в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити тред. Заголовок треду використовує перший непорожній рядок вашого повідомлення.
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

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити використовувати кнопки, меню вибору й форми кілька разів до завершення строку їх дії.

Щоб обмежити, хто може натиснути кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Коли це налаштовано, користувачі без збігу отримують ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний засіб вибору моделі з випадаючими списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь засобу вибору ефемерна, і користуватися нею може лише користувач, який її викликав.

Файлові вкладення:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
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
  <Tab title="Політика DM">
    `channels.discord.dmPolicy` керує доступом DM. `channels.discord.allowFrom` є канонічним allowlist для DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (вимагає, щоб `channels.discord.allowFrom` містив `"*"`)
    - `disabled`

    Якщо політика DM не є відкритою, невідомих користувачів блокують (або просять виконати pairing у режимі `pairing`).

    Пріоритет для кількох акаунтів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до акаунта `default`.
    - Для одного акаунта `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані акаунти успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застаріле `dm.allowFrom` не задані.
    - Іменовані акаунти не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID зазвичай розв’язуються як ID каналів, коли активний стандартний канал, але ID, перелічені в ефективному DM `allowFrom` акаунта, трактуються як цілі користувацьких DM для сумісності.

  </Tab>

  <Tab title="Групи доступу DM">
    DM Discord можуть використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Назви груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, учасники якої виражені в нормальному синтаксисі `allowFrom` кожного каналу, або `type: "discord.channelAudience"`, коли поточна аудиторія `ViewChannel` каналу Discord має динамічно визначати членство. Спільна поведінка груп доступу задокументована тут: [Групи доступу](/uk/channels/access-groups).

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

    Можна змішувати динамічні й статичні записи:

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

    Пошуки завершуються закритою відмовою. Якщо Discord повертає `Missing Access`, пошук учасника завершується помилкою або канал належить іншій гільдії, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу на основі аудиторії каналу. DM не містять стану учасника гільдії, тому OpenClaw розв’язує учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Політика гільдій">
    Обробкою гільдій керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечний базовий рівень, коли `channels.discord` існує, — `allowlist`.

    Поведінка `allowlist`:

    - гільдія має відповідати `channels.discord.guilds` (перевага за `id`, slug приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовані стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволені, коли вони збігаються з `users` АБО `roles`
    - прямий збіг за іменем/тегом вимкнено за замовчуванням; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо в гільдії налаштовано `channels`, канали поза списком забороняються
    - якщо гільдія не має блока `channels`, усі канали в цій гільдії з allowlist дозволені

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

    Якщо ви встановили лише `DISCORD_BOT_TOKEN` і не створили блок `channels.discord`, runtime fallback — `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Згадки та групові DM">
    Повідомлення гільдій за замовчуванням потребують згадки.

    Виявлення згадок охоплює:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    Під час написання вихідних повідомлень Discord використовуйте канонічний синтаксис згадок: `<@USER_ID>` для користувачів, `<#CHANNEL_ID>` для каналів і `<@&ROLE_ID>` для ролей. Не використовуйте застарілу форму згадки нікнейму `<@!USER_ID>`.

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

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

## Нативні команди та автентифікація команд

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнено для Discord.
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` пропускає реєстрацію та очищення слеш-команд Discord під час запуску. Раніше зареєстровані команди можуть залишатися видимими в Discord, доки ви не видалите їх із застосунку Discord.
- Авторизація нативних команд використовує ті самі списки дозволів/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для неавторизованих користувачів; виконання все одно забезпечує авторизацію OpenClaw і повертає "not authorized".

Див. [слеш-команди](/uk/tools/slash-commands), щоб дізнатися про каталог команд і поведінку.

Стандартні налаштування слеш-команд:

- `ephemeral: true`

## Подробиці функції

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord підтримує теги відповіді у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується параметром `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне створення ланцюжків відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord у межах ходу.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був відкладеним пакетом із кількох повідомлень. Це корисно,
    коли ви хочете використовувати нативні відповіді переважно для неоднозначних серій швидких повідомлень, а не для кожного
    ходу з одним повідомленням.

    Ідентифікатори повідомлень передаються в контекст/історію, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` | `partial` | `block` | `progress` (за замовчуванням). `progress` зберігає одну редаговану чернетку статусу й оновлює її прогресом інструментів до фінальної доставки; `streamMode` є застарілим псевдонімом часу виконання. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на канонічний ключ.

    Установіть `channels.discord.streaming.mode` у `off`, щоб вимкнути редагування попереднього перегляду Discord. Якщо блокову трансляцію Discord явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної трансляції.

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
    - `block` надсилає фрагменти розміром із чернетку (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, з обмеженням до `textChunkLimit`).
    - Медіа, помилки та фінальні повідомлення з явною відповіддю скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.
    - `streaming.preview.commandText` / `streaming.progress.commandText` керує деталями команд/виконання в компактних рядках прогресу: `raw` (за замовчуванням) або `status` (лише мітка інструмента).

    Приховати сирий текст команд/виконання, зберігаючи компактні рядки прогресу:

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

    Трансляція попереднього перегляду підтримує лише текст; медіавідповіді повертаються до звичайної доставки. Коли трансляцію `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної трансляції.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервний варіант: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сеанси каналу й успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси гілок успадковують вибір `/model` рівня сеансу батьківського каналу як резервний варіант лише для моделі; локальні для гілки вибори `/model` усе ще мають пріоритет, а історія транскрипту батьківського каналу не копіюється, якщо успадкування транскрипту не ввімкнено.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) дозволяє новим автогілкам ініціалізуватися з батьківського транскрипту. Перевизначення для окремого облікового запису містяться в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть визначати цілі DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів додаються як **ненадійний** контекст. Списки дозволів обмежують, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord може прив’язати гілку до цілі сеансу, щоб подальші повідомлення в цій гілці продовжували маршрутизуватися до того самого сеансу (зокрема сеансів субагентів).

    Команди:

    - `/focus <target>` прив’язати поточну/нову гілку до цілі субагента/сеансу
    - `/unfocus` видалити прив’язку поточної гілки
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автофокусування за неактивністю для прив’язок у фокусі
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для прив’язок у фокусі

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
    - `spawnSessions` керує автоматичним створенням/прив’язкою гілок для `sessions_spawn({ thread: true })` і створенням гілок ACP. За замовчуванням: `true`.
    - `defaultSpawnContext` керує нативним контекстом субагента для створень, прив’язаних до гілки. За замовчуванням: `"fork"`.
    - Застарілі ключі `spawnSubagentSessions`/`spawnAcpSessions` мігруються командою `openclaw doctor --fix`.
    - Якщо прив’язки гілок вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки гілок недоступні.

    Див. [субагенти](/uk/tools/subagents), [агенти ACP](/uk/tools/acp-agents) і [довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Для стабільних робочих просторів ACP, що працюють "завжди ввімкнено", налаштуйте типізовані прив’язки ACP верхнього рівня, націлені на розмови Discord.

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
    - У прив’язаному каналі або гілці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив’язки гілок можуть перевизначати визначення цілі, поки активні.
    - `spawnSessions` обмежує створення/прив’язку дочірніх гілок через `--thread auto|here`.

    Див. [агенти ACP](/uk/tools/acp-agents), щоб дізнатися подробиці поведінки прив’язок.

  </Accordion>

  <Accordion title="Reaction notifications">
    Режим сповіщень про реакції для окремої гільдії:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованого сеансу Discord.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode-емодзі або назви користувацьких емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
    Маршрутизуйте трафік WebSocket Gateway Discord і стартові REST-пошуки (ідентифікатор застосунку + визначення списку дозволів) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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

  <Accordion title="PluralKit support">
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

    - списки дозволів можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за назвою/slug лише тоді, коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ідентифікатор оригінального повідомлення й обмежені часовим вікном
    - якщо пошук не вдався, проксійовані повідомлення розглядаються як повідомлення ботів і відкидаються, якщо `allowBots=true` не встановлено

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Використовуйте `mentionAliases`, коли агентам потрібні детерміновані вихідні згадки для відомих користувачів Discord. Ключі — це дескриптори без початкового `@`; значення — ідентифікатори користувачів Discord. Невідомі дескриптори, `@everyone`, `@here` і згадки всередині Markdown code spans залишаються без змін.

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

    Мапа типів активності:

    - 0: Грає
    - 1: Транслює (потребує `activityUrl`)
    - 2: Слухає
    - 3: Дивиться
    - 4: Користувацька (використовує текст активності як стан статусу; емодзі необов’язковий)
    - 5: Змагається

    Приклад автоматичної присутності (сигнал стану часу виконання):

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

  <Accordion title="Схвалення в Discord">
    Discord підтримує обробку схвалень за допомогою кнопок у DM і може додатково публікувати запити на схвалення в початковому каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні схвалення виконання, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного схвалювача: або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить схвалювачів виконання з канального `allowFrom`, застарілого `dm.allowFrom` чи `defaultTo` для прямих повідомлень. Установіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт схвалень.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на схвалення та остаточні результати приватно. Спочатку він пробує Discord DM, коли власник, що викликає команду, має маршрут власника Discord; якщо він недоступний, OpenClaw повертається до першого доступного маршруту власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на схвалення видно в каналі. Лише визначені схвалювачі можуть користуватися кнопками; інші користувачі отримують ephemeral-відмову. Запити на схвалення містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу не можна отримати з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відтворює спільні кнопки схвалення, які використовують інші чат-канали. Нативний адаптер Discord переважно додає маршрутизацію DM для схвалювачів і розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що чат-схвалення недоступні або ручне схвалення є єдиним шляхом.
    Якщо нативний runtime схвалень Discord не активний, OpenClaw залишає
    локальний детермінований запит `/approve <id> <decision>` видимим. Якщо
    runtime активний, але нативну картку неможливо доставити жодній цілі,
    OpenClaw надсилає резервне сповіщення в той самий чат із точною командою `/approve`
    з очікуваного схвалення.

    Автентифікація Gateway і вирішення схвалень дотримуються спільного контракту клієнта Gateway (ID `plugin:` вирішуються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Типово схвалення спливають через 30 хвилин.

    Див. [Схвалення виконання](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord охоплюють обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файлу), щоб задати обкладинку запланованої події.

Шлюзи дій розміщені в `channels.discord.actions.*`.

Типова поведінка шлюзів:

| Група дій                                                                                                                                                                | Типово    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено |
| roles                                                                                                                                                                    | вимкнено  |
| moderation                                                                                                                                                               | вимкнено  |
| presence                                                                                                                                                                 | вимкнено  |

## UI Components v2

OpenClaw використовує Discord components v2 для схвалень виконання та маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для власного UI (розширено; потребує побудови component payload через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
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

Discord має дві окремі голосові поверхні: realtime **голосові канали** (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду хвильової форми). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволених ролей/користувачів.
3. Запросіть бота зі scope `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status`, щоб керувати сесіями. Команда використовує типового агента облікового запису та дотримується тих самих правил списку дозволених і групової політики, що й інші команди Discord.

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
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрибування.
- Перевизначення Discord `systemPrompt` для окремого каналу застосовуються до ходів голосового транскрипту для цього голосового каналу.
- Ходи голосового транскрипту визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос Discord є opt-in для текстових конфігурацій; задайте `channels.discord.voice.enabled=true` (або збережіть наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосовий runtime і Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на intent стану голосу. Залиште незаданим, щоб intent дотримувався ефективного ввімкнення голосу.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються в параметри приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice`: `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready у `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання. Типово: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, доки від’єднана голосова сесія почне повторне підключення, перш ніж знищити її. Типово: `15000`.
- OpenClaw також відстежує помилки дешифрування приймання й автоматично відновлюється, виходячи з голосового каналу та повторно приєднуючись після повторних помилок у короткому вікні.
- Якщо після оновлення журнали приймання багаторазово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Укомплектована лінійка `@discordjs/voice` містить upstream-виправлення padding з PR discord.js #11449, яке закрило issue discord.js #11419.

Конвеєр голосового каналу:

- Захоплення Discord PCM перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхід Discord і маршрутизацію, тоді як LLM відповіді працює з політикою voice-output, яка приховує інструмент агента `tts` і просить повернути текст, оскільки голос Discord сам відповідає за фінальне TTS-відтворення.
- `voice.model`, коли задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; отримане аудіо відтворюється в приєднаному каналі.

Облікові дані визначаються для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми та потребують аудіо OGG/Opus. OpenClaw генерує хвильову форму автоматично, але потребує `ffmpeg` і `ffprobe` на хості Gateway для перевірки та конвертації.

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Опустіть текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw конвертує в OGG/Opus за потреби.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень guild">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від визначення користувачів/учасників
    - перезапустіть Gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення guild несподівано заблоковано">

    - перевірте `groupPolicy`
    - перевірте список дозволених guild у `channels.discord.guilds`
    - якщо існує мапа `channels` guild, дозволено лише перелічені канали
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

    - `groupPolicy="allowlist"` без відповідного списку дозволених guild/каналу
    - `requireMention` налаштовано в неправильному місці (має бути під `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано списком дозволених `users` guild/каналу

  </Accordion>

  <Accordion title="Довгі ходи Discord або дублікати відповідей">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Регулятори черги Gateway Discord:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою listener Gateway Discord, а не тривалістю ходу агента

    Discord не застосовує timeout, яким володіє канал, до ходів агента в черзі. Message listeners передають роботу негайно, а запуски Discord у черзі зберігають порядок у межах сесії, доки lifecycle сесії/інструмента/runtime не завершить або не перерве роботу.

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
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. У разі тимчасових збоїв використовується стандартна URL-адреса Gateway Discord, а повідомлення в журналах обмежуються за частотою.

    Параметри тайм-ауту метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне значення з env, коли конфігурацію не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - стандартне значення: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через тайм-аут Gateway READY">
    OpenClaw очікує подію Gateway Discord `READY` під час запуску та після повторних підключень під час виконання. Налаштування з кількома обліковими записами та рознесенням запуску можуть потребувати довшого вікна READY під час запуску, ніж стандартне.

    Параметри тайм-ауту READY:

    - запуск, один обліковий запис: `channels.discord.gatewayReadyTimeoutMs`
    - запуск, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - резервне значення з env для запуску, коли конфігурацію не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - стандартне значення для запуску: `15000` (15 секунд), максимум: `120000`
    - виконання, один обліковий запис: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - виконання, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - резервне значення з env для виконання, коли конфігурацію не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - стандартне значення для виконання: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ідентифікаторів каналів.

    Якщо ви використовуєте ключі-скорочення, зіставлення під час виконання все ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікування схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-бот">
    За замовчуванням повідомлення, написані ботами, ігноруються.

    Якщо ви задаєте `channels.discord.allowBots=true`, використовуйте строгі правила згадок і списку дозволених, щоб уникнути циклічної поведінки.
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

  <Accordion title="Голосове STT переривається з DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була наявна логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (стандартне значення)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (стандартне значення upstream) і змінюйте лише за потреби
    - стежте в журналах за:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали й порівняйте з upstream-історією приймання DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- доставлення: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повтор: `mediaMaxMb` (обмежує вихідні завантаження Discord, стандартно `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та операції

- Обробляйте токени ботів як секрети (`DISCORD_BOT_TOKEN` бажано в контрольованих середовищах).
- Надавайте Discord дозволи за принципом найменших привілеїв.
- Якщо розгортання/стан команд застаріли, перезапустіть Gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групового чату та списку дозволених.
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
    Поведінка нативних команд.
  </Card>
</CardGroup>
