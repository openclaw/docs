---
read_when:
    - Працюємо над функціями каналу Discord
summary: Статус підтримки, можливості та конфігурація бота Discord
title: Discord
x-i18n:
    generated_at: "2026-06-30T14:22:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

Готово для DM і каналів гільдії через офіційний Discord gateway.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Discord DM за замовчуванням використовують режим сполучення.
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
  <Step title="Створіть застосунок і бота Discord">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ім’я, яким ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Залишаючись на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; потрібно для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть назад угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається."
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він скоро знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на свій сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і ввімкніть:

    - `bot`
    - `applications.commands`

    Нижче з’явиться розділ **Bot Permissions**. Увімкніть щонайменше:

    **Загальні дозволи**
      - Переглядати канали

    **Текстові дозволи**
      - Надсилати повідомлення
      - Читати історію повідомлень
      - Вбудовувати посилання
      - Прикріплювати файли
      - Додавати реакції (необов’язково)

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати повідомлення в гілках Discord, зокрема в сценаріях форумних або медіаканалів, які створюють або продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, потрібно ввімкнути Developer Mode, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (іконка шестерні біля вашого аватара) → прокрутіть до **Developer** на бічній панелі → увімкніть **Developer Mode**

        *(Примітка: у мобільному застосунку Discord Developer Mode розташований у **App Settings** → **Advanced**)*

    2. Клацніть правою кнопкою миші **іконку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші **власний аватар** → **Copy User ID**

    Збережіть **Server ID** і **User ID** поруч із Bot Token — на наступному кроці ви надішлете всі три значення в OpenClaw.

  </Step>

  <Step title="Дозвольте DM від учасників сервера">
    Щоб сполучення працювало, Discord має дозволяти вашому боту надсилати вам DM. Клацніть правою кнопкою миші **іконку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам DM. Залиште це ввімкненим, якщо хочете використовувати Discord DM з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, після сполучення DM можна вимкнути.

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

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й повторно запустивши процес `openclaw gateway run`.
    Для керованих інсталяцій сервісу виконайте `openclaw gateway install` із shell, де присутня змінна `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб сервіс міг розв’язати env SecretRef після перезапуску.
    Якщо ваш хост заблокований або обмежений Discord під час стартового пошуку застосунку, установіть ID застосунку/клієнта Discord з Developer Portal, щоб запуск міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для облікового запису за замовчуванням або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кілька ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте сполучення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому це. Якщо Discord — ваш перший канал, натомість скористайтеся вкладкою CLI / config.

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви віддаєте перевагу файловій конфігурації, установіть:

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

        Env fallback для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторіть запуск без `--dry-run`. Підтримуються відкриті значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord зберігайте токен і ID застосунку кожного бота в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тому встановлюйте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID застосунку.

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
    Дочекайтеся, доки gateway запрацює, а потім надішліть DM своєму боту в Discord. Він відповість кодом сполучення.

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
Розв’язання токена враховує обліковий запис. Значення токена з конфігурації мають пріоритет над env fallback. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Якщо два ввімкнені облікові записи Discord розв’язуються в той самий токен бота, OpenClaw запускає лише один монітор gateway для цього токена. Токен із конфігурації має пріоритет над env fallback за замовчуванням; інакше перший увімкнений обліковий запис перемагає, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується саме для цього виклику. Це стосується дій надсилання та читання/перевірки (наприклад read/search/fetch/thread/pins/permissions). Політика облікового запису й налаштування повторних спроб усе одно беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли DM запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента зі своїм контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених гільдій">
    Це дозволяє вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в DM.

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

  <Step title="Дозвольте відповіді без @згадки">
    За замовчуванням ваш агент відповідає в каналах гільдії лише тоді, коли його @згадали. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдії звичайні відповіді за замовчуванням публікуються автоматично. Для спільних постійно активних кімнат увімкніть `messages.groupChat.visibleReplies: "message_tool"`, щоб агент міг спостерігати й публікувати повідомлення лише тоді, коли вирішить, що відповідь у каналі корисна. Це найкраще працює з моделями останнього покоління, які надійно використовують інструменти, наприклад GPT 5.5. Фонові події кімнати залишаються тихими, якщо інструмент не надсилає повідомлення. Повну конфігурацію режиму спостереження див. у [Фонові події кімнати](/uk/channels/ambient-room-events).

    Якщо Discord показує, що бот набирає текст, а журнали показують використання токенів, але повідомлення не опубліковано, перевірте, чи turn було налаштовано як фонову подію кімнати або ввімкнено видимі відповіді через інструмент повідомлень.

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

        Щоб вимагати надсилання через інструмент повідомлень для видимих відповідей у групі/каналі, установіть `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Сплануйте пам’ять у каналах гільдії">
    За замовчуванням довгострокова пам’ять (MEMORY.md) завантажується лише в сесіях DM. Канали гільдії не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони інжектуються в кожну сесію). Зберігайте довгострокові нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкуватися. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель runtime

- Gateway керує підключенням до Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді з Discord повертаються до Discord.
- Метадані гільдії/каналу Discord додаються до prompt моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель копіює цей конверт
  назад, OpenClaw вилучає скопійовані метадані з вихідних відповідей і з
  майбутнього контексту повторного відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали гільдії ізолюються ключами сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас зберігаючи `CommandTargetSessionKey` для маршрутизованої сесії розмови.
- Текстова доставка оголошень cron/heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа та структуровані payload компонентів залишаються
  багатоповідомними, коли агент випускає кілька payload, придатних для доставки.

## Канали форумів

Форуми та медіаканали Discord приймають лише дописи в threads. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити thread. Назва thread використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити thread напряму. Не передавайте `--message-id` для каналів форуму.

Приклад: надіслати до батьківського форуму, щоб створити thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створити forum thread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самого thread (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодій маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити використовувати кнопки, списки вибору та форми кілька разів до завершення строку їх дії.

Щоб обмежити, хто може натиснути кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо налаштовано, користувачі без збігу отримують ephemeral відмову.

Callbacks компонентів за замовчуванням завершують дію через 30 хвилин. Установіть `channels.discord.agentComponents.ttlMs`, щоб змінити строк життя реєстру callbacks для стандартного облікового запису Discord, або `channels.discord.accounts.<accountId>.agentComponents.ttlMs`, щоб перевизначити один обліковий запис у багатообліковому налаштуванні. Значення задається в мілісекундах, має бути додатним цілим числом і обмежене `86400000` (24 години). Довші TTL корисні для workflows перевірки або схвалення, де кнопки мають залишатися придатними до використання, але вони також розширюють вікно, у якому старе повідомлення Discord усе ще може запускати дію. Віддавайте перевагу найкоротшому TTL, який підходить для workflow, і залишайте стандартне значення, коли застарілі callbacks були б несподіваними.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками provider, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору є ephemeral, і скористатися нею може лише користувач, який її викликав. Меню вибору Discord обмежені 25 варіантами, тому додавайте записи `provider/*` до `agents.defaults.models`, коли хочете, щоб вибір показував динамічно виявлені моделі лише для вибраних providers, як-от `openai` або `vllm`.

Вкладення файлів:

- Блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` керує доступом до DM. `channels.discord.allowFrom` є канонічним дозволеним списком DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (вимагає, щоб `channels.discord.allowFrom` містив `"*"`)
    - `disabled`

    Якщо політика DM не відкрита, невідомі користувачі блокуються (або отримують запит на pairing у режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Для одного облікового запису `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застарілий `dm.allowFrom` не задані.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID зазвичай розв’язуються як ID каналів, коли активний стандартний канал, але ID, перелічені в ефективному DM `allowFrom` облікового запису, для сумісності трактуються як цілі user DM.

  </Tab>

  <Tab title="Access groups">
    Авторизація DM Discord і текстових команд може використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

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

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник DM є учасником налаштованої гільдії та наразі має ефективний дозвіл `ViewChannel` на налаштований канал після застосування ролей і перевизначень каналу.

    Приклад: дозволити всім, хто бачить `#maintainers`, надсилати DM боту, водночас залишивши DM закритими для всіх інших.

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

    Пошуки відмовляють закрито. Якщо Discord повертає `Missing Access`, пошук учасника завершується невдачею або канал належить іншій гільдії, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу на основі аудиторії каналу. DM не містять стану учасника гільдії, тому OpenClaw розв’язує учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Guild policy">
    Обробкою гільдій керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечним базовим рівнем, коли існує `channels.discord`, є `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (перевага надається `id`, slug приймається)
    - необов’язкові дозволені списки відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволені, коли вони збігаються з `users` АБО `roles`
    - прямий збіг за іменем/тегом за замовчуванням вимкнено; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для гільдії налаштовано `channels`, канали не зі списку забороняються
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

    Якщо ви встановлюєте лише `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, runtime fallback становить `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Повідомлення гільдії за замовчуванням обмежені згадками.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    Під час написання вихідних повідомлень Discord використовуйте канонічний синтаксис згадок: `<@USER_ID>` для користувачів, `<#CHANNEL_ID>` для каналів і `<@&ROLE_ID>` для ролей. Не використовуйте застарілу форму згадки псевдоніма `<@!USER_ID>`.

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, що згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий дозволений список через `dm.groupChannels` (ID каналів або slugs)

  </Tab>
</Tabs>

### Рольова маршрутизація агентів

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише для гільдії. Якщо прив’язка також задає інші поля відповідності (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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
- Авторизація нативних команд використовує ті самі списки дозволів/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для неавторизованих користувачів; виконання все одно забезпечує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash-команди](/uk/tools/slash-commands), щоб переглянути каталог команд і поведінку.

Стандартні налаштування slash-команд:

- `ephemeral: true`

## Деталі функцій

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

    Примітка: `off` вимикає неявну потокову прив’язку відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord за хід.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідна подія була debounced-пакетом із кількох повідомлень. Це корисно,
    коли потрібні нативні відповіді переважно для неоднозначних швидких чатів, а не для кожного
    ходу з одним повідомленням.

    ID повідомлень відображаються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередні перегляди посилань">
    Discord за замовчуванням створює розширені вбудовані блоки для URL. OpenClaw за замовчуванням пригнічує ці згенеровані вбудовані блоки у вихідних повідомленнях Discord, тому URL, надіслані агентом, залишаються звичайними посиланнями, якщо ви не ввімкнете іншу поведінку:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Установіть `channels.discord.accounts.<id>.suppressEmbeds`, щоб перевизначити це для одного облікового запису. Надсилання через інструмент повідомлень агента також може передати `suppressEmbeds: false` для одного повідомлення. Явні payload-и Discord `embeds` не пригнічуються стандартним налаштуванням попереднього перегляду посилань.

  </Accordion>

  <Accordion title="Попередній перегляд live-трансляції">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` | `partial` | `block` | `progress` (за замовчуванням). `progress` зберігає одну редаговану чернетку статусу й оновлює її прогресом інструментів до фінальної доставки; спільна початкова мітка є рухомим рядком, тому вона прокручується вгору, як і решта, коли з’являється достатньо роботи. `streamMode` є застарілим runtime-псевдонімом. Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію на канонічний ключ.

    Установіть `channels.discord.streaming.mode` у `off`, щоб вимкнути редагування попереднього перегляду Discord. Якщо потокове передавання блоками Discord явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної трансляції.

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
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, обмежені `textChunkLimit`).
    - Медіа, помилки та фінальні відповіді з явним reply скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи повторно використовують оновлення інструментів/прогресу повідомлення попереднього перегляду.
    - Рядки інструментів/прогресу відображаються як компактні emoji + заголовок + деталі, коли вони доступні, наприклад `🛠️ Bash: run tests` або `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (за замовчуванням `false`) вмикає текст коментаря/преамбули асистента в тимчасовій чернетці прогресу. Коментар очищується перед показом, залишається тимчасовим і не змінює доставку фінальної відповіді.
    - `streaming.progress.maxLineChars` керує бюджетом попереднього перегляду прогресу для кожного рядка. Проза скорочується за межами слів; деталі команд і шляхів зберігають корисні суфікси.
    - `streaming.preview.commandText` / `streaming.progress.commandText` керує деталями command/exec у компактних рядках прогресу: `raw` (за замовчуванням) або `status` (лише мітка інструмента).

    Приховати сирий текст command/exec, зберігаючи компактні рядки прогресу:

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

    Потокове передавання попереднього перегляду підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли потокове передавання `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійної трансляції.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка потоків">
    Контекст історії гільдії:

    - стандартне значення `channels.discord.historyLimit` — `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка потоків:

    - Потоки Discord маршрутизуються як сеанси каналу й успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси потоків успадковують вибір `/model` рівня сеансу батьківського каналу як резерв лише для моделі; локальні для потоку вибори `/model` усе одно мають пріоритет, а історія транскрипту батьківського каналу не копіюється, якщо успадкування транскрипту не ввімкнено.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) вмикає для нових авто-потоків початкове заповнення з батьківського транскрипту. Перевизначення для окремого облікового запису розташовані в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть розв’язувати DM-цілі `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів вставляються як **ненадійний** контекст. Списки дозволів визначають, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сеанси для субагентів, прив’язані до потоків">
    Discord може прив’язати потік до цілі сеансу, щоб подальші повідомлення в цьому потоці продовжували маршрутизуватися до того самого сеансу (включно із сеансами субагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий потік до цілі субагента/сеансу
    - `/unfocus` видалити прив’язку поточного потоку
    - `/agents` показати активні запуски та стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокусу через неактивність для сфокусованих прив’язок
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

    - `session.threadBindings.*` задає глобальні стандартні значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSessions` керує автоматичним створенням/прив’язкою потоків для `sessions_spawn({ thread: true })` і створень потоків ACP. Стандартне значення: `true`.
    - `defaultSpawnContext` керує нативним контекстом субагента для створень, прив’язаних до потоку. Стандартне значення: `"fork"`.
    - Застарілі ключі `spawnSubagentSessions`/`spawnAcpSessions` мігруються через `openclaw doctor --fix`.
    - Якщо прив’язки потоків вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки потоків недоступні.

    Див. [Субагенти](/uk/tools/subagents), [Агенти ACP](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних "always-on" робочих просторів ACP налаштуйте типізовані прив’язки ACP верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або потік на місці й утримує майбутні повідомлення в тому самому сеансі ACP. Повідомлення потоку успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або потоці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив’язки потоків можуть перевизначати розв’язання цілі, доки активні.
    - `spawnSessions` обмежує створення/прив’язку дочірніх потоків через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents), щоб дізнатися деталі поведінки прив’язок.

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
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode emoji або назви користувацьких emoji.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

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
    Маршрутизуйте WebSocket-трафік Gateway Discord і стартові REST-пошуки (ID застосунку + розв’язання списку дозволів) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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

    Нотатки:

    - списки дозволених можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за name/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID оригінального повідомлення та обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо `allowBots=true` не задано

  </Accordion>

  <Accordion title="Псевдоніми вихідних згадок">
    Використовуйте `mentionAliases`, коли агентам потрібні детерміновані вихідні згадки для відомих користувачів Discord. Ключі — це ідентифікатори без початкового `@`; значення — ID користувачів Discord. Невідомі ідентифікатори, `@everyone`, `@here` і згадки всередині Markdown code spans залишаються без змін.

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
    - 4: Користувацька (використовує текст активності як стан статусу; емодзі необов’язковий)
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

    Автоматична присутність відображає доступність runtime у статус Discord: healthy => online, degraded or unknown => idle, exhausted or unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує placeholder `{reason}`)

  </Accordion>

  <Accordion title="Підтвердження в Discord">
    Discord підтримує обробку підтверджень на основі кнопок у DM і може за бажанням публікувати запити підтвердження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і можна визначити принаймні одного підтверджувача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить підтверджувачів exec із канального `allowFrom`, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт підтверджень.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити підтвердження та фінальні результати приватно. Спочатку він пробує DM Discord, коли власник, що викликає команду, має маршрут власника Discord; якщо він недоступний, використовується перший доступний маршрут власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит підтвердження видимий у каналі. Кнопки можуть використовувати лише визначені підтверджувачі; інші користувачі отримують ефемерну відмову. Запити підтвердження містять текст команди, тому вмикайте доставлення в канал лише в довірених каналах. Якщо ID каналу неможливо отримати з ключа сесії, OpenClaw повертається до доставлення через DM.

    Discord також відображає спільні кнопки підтвердження, які використовують інші чат-канали. Нативний адаптер Discord переважно додає маршрутизацію DM для підтверджувачів і розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
    має включати ручну команду `/approve` лише коли результат інструмента вказує,
    що чат-підтвердження недоступні або ручне підтвердження є єдиним шляхом.
    Якщо нативний runtime підтверджень Discord не активний, OpenClaw залишає
    видимим локальний детермінований запит `/approve <id> <decision>`. Якщо
    runtime активний, але нативну картку неможливо доставити жодній цілі,
    OpenClaw надсилає резервне сповіщення в той самий чат із точною командою `/approve`
    з очікуваного підтвердження.

    Автентифікація Gateway і розв’язання підтверджень дотримуються спільного контракту клієнта Gateway (ID `plugin:` розв’язуються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Підтвердження типово спливають через 30 хвилин.

    Див. [Підтвердження exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файлу), щоб задати зображення обкладинки запланованої події.

Шлюзи дій розташовані в `channels.discord.actions.*`.

Типова поведінка шлюзів:

| Група дій                                                                                                                                                                | Типово   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено |
| roles                                                                                                                                                                    | вимкнено |
| moderation                                                                                                                                                               | вимкнено |
| presence                                                                                                                                                                 | вимкнено |

## Інтерфейс компонентів v2

OpenClaw використовує компоненти Discord v2 для підтверджень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (просунуто; потребує побудови payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Задайте для окремого акаунта через `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` керує тим, як довго callback-и надісланих компонентів Discord залишаються зареєстрованими (типово `1800000`, максимум `86400000`). Задайте для окремого акаунта через `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` ігноруються, коли присутні компоненти v2.
- Попередній перегляд звичайних URL типово пригнічується. Задайте `suppressEmbeds: false` у дії повідомлення, коли одне вихідне посилання має розгортатися.

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

Discord має дві окремі голосові поверхні: голосові канали реального часу **voice channels** (безперервні розмови) і **voice message attachments** (формат попереднього перегляду хвилі). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволених ролей/користувачів.
3. Запросіть бота зі scope-ами `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status`, щоб керувати сесіями. Команда використовує типового агента акаунта й дотримується тих самих правил списків дозволених і групової політики, що й інші команди Discord.

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

Нотатки:

- `voice.tts` перевизначає `messages.tts` лише для голосового відтворення `stt-tts`. Режими realtime використовують `voice.realtime.speakerVoice`.
- `voice.mode` керує шляхом розмови. Типовий режим — `agent-proxy`: realtime голосовий фронтенд обробляє таймінг реплік, переривання та відтворення, делегує змістовну роботу маршрутизованому агенту OpenClaw через `openclaw_agent_consult` і трактує результат як набраний Discord-запит від цього мовця. `stt-tts` зберігає старіший пакетний потік STT плюс TTS. `bidi` дозволяє realtime моделі спілкуватися напряму, водночас надаючи `openclaw_agent_consult` для мозку OpenClaw.
- `voice.agentSession` керує тим, яка розмова OpenClaw отримує голосові репліки. Залиште його невстановленим для власної сесії голосового каналу або задайте `{ mode: "target", target: "channel:<text-channel-id>" }`, щоб голосовий канал працював як розширення мікрофона/динаміка для наявної сесії текстового каналу Discord, наприклад `#maintainers`.
- `voice.model` перевизначає мозок агента OpenClaw для голосових відповідей Discord і realtime консультацій. Залиште його невстановленим, щоб успадкувати модель маршрутизованого агента. Це окремо від `voice.realtime.model`.
- `voice.followUsers` дозволяє боту приєднуватися до голосу Discord, переходити між каналами й виходити разом з вибраними користувачами. Див. [Стеження за користувачами в голосі](#follow-users-in-voice), щоб переглянути правила поведінки та приклади.
- `agent-proxy` маршрутизує мовлення через `discord-voice`, що зберігає звичайну авторизацію власника/інструментів для мовця й цільової сесії, але приховує інструмент агента `tts`, бо голос Discord відповідає за відтворення. За замовчуванням `agent-proxy` надає консультації повний доступ до інструментів на рівні власника для мовців-власників (`voice.realtime.toolPolicy: "owner"`) і наполегливо віддає перевагу консультації з агентом OpenClaw перед змістовними відповідями (`voice.realtime.consultPolicy: "always"`). У цьому типовому режимі `always` realtime шар не промовляє автоматично заповнювач перед відповіддю консультації; він захоплює й транскрибує мовлення, а потім промовляє маршрутизовану відповідь OpenClaw. Якщо кілька примусових відповідей консультації завершуються, поки Discord усе ще відтворює першу відповідь, пізніші відповіді з точним текстом мовлення ставляться в чергу до простою відтворення, а не замінюють мовлення посеред речення.
- У режимі `stt-tts` STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- У режимах realtime `voice.realtime.provider`, `voice.realtime.model` і `voice.realtime.speakerVoice` налаштовують realtime аудіосесію. Для OpenAI Realtime 2 плюс мозку Codex використовуйте `voice.realtime.model: "gpt-realtime-2"` і `voice.model: "openai/gpt-5.5"`.
- Realtime голосові режими типово включають невеликі профільні файли `IDENTITY.md`, `USER.md` і `SOUL.md` в інструкції realtime провайдера, щоб швидкі прямі репліки зберігали ту саму ідентичність, прив’язку до користувача й персону, що й маршрутизований агент OpenClaw. Задайте `voice.realtime.bootstrapContextFiles` як підмножину, щоб налаштувати це, або `[]`, щоб вимкнути. Підтримувані realtime bootstrap-файли обмежені цими профільними файлами; `AGENTS.md` залишається у звичайному контексті агента. Впроваджений профільний контекст не замінює `openclaw_agent_consult` для роботи в робочій області, поточних фактів, пошуку в пам’яті або дій, підкріплених інструментами.
- У realtime режимі OpenAI `agent-proxy` задайте `voice.realtime.requireWakeName: true`, щоб realtime голос Discord мовчав, доки транскрипт не почнеться або не завершиться wake name. Налаштовані wake names мають складатися з одного або двох слів. Якщо `voice.realtime.wakeNames` не встановлено, OpenClaw використовує `name` маршрутизованого агента плюс `OpenClaw`, з fallback до id агента плюс `OpenClaw`. Обмеження за wake-name вимикає авто-відповідь realtime провайдера, маршрутизує прийняті репліки через шлях консультації агента OpenClaw і дає коротке голосове підтвердження, коли початкове wake name розпізнано з часткової транскрипції до надходження фінального транскрипту.
- Realtime провайдер OpenAI приймає поточні назви подій Realtime 2 і застарілі сумісні з Codex псевдоніми для подій вихідного аудіо та транскрипту, тож сумісні знімки провайдера можуть змінюватися без втрати аудіо асистента.
- `voice.realtime.bargeIn` керує тим, чи події початку мовлення в Discord переривають активне realtime відтворення. Якщо не встановлено, він наслідує налаштування переривання вхідного аудіо realtime провайдера.
- `voice.realtime.minBargeInAudioEndMs` керує мінімальною тривалістю відтворення асистента перед тим, як OpenAI realtime barge-in обріже аудіо. Типово: `250`. Задайте `0` для негайного переривання в кімнатах із низьким відлунням або збільште значення для налаштувань із динаміками, де багато відлуння.
- Для голосу OpenAI у відтворенні Discord задайте `voice.tts.provider: "openai"` і виберіть голос Text-to-speech у `voice.tts.providers.openai.speakerVoice`. `cedar` — хороший варіант із чоловічим звучанням у поточній моделі OpenAI TTS.
- Поканальні перевизначення Discord `systemPrompt` застосовуються до голосових транскрибованих реплік для цього голосового каналу.
- Голосові транскрибовані репліки визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`) для команд і дій каналу, обмежених власником. Видимість інструментів агента відповідає налаштованій політиці інструментів для маршрутизованої сесії.
- Голос Discord є opt-in для конфігурацій лише з текстом; задайте `channels.discord.voice.enabled=true` (або залиште наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на voice-state intent. Залиште невстановленим, щоб intent відповідав ефективному ввімкненню голосу.
- Якщо `voice.autoJoin` має кілька записів для тієї самої гільдії, OpenClaw приєднується до останнього налаштованого каналу для цієї гільдії.
- `voice.allowedChannels` — необов’язковий allowlist резидентності. Залиште його невстановленим, щоб дозволити `/vc join` у будь-який авторизований голосовий канал Discord. Коли встановлено, `/vc join`, автоприєднання під час запуску та переміщення голосового стану бота обмежені переліченими записами `{ guildId, channelId }`. Задайте порожній масив, щоб заборонити всі голосові приєднання Discord. Якщо Discord перемістить бота за межі allowlist, OpenClaw вийде з цього каналу й повторно приєднається до налаштованої цілі автоприєднання, коли вона доступна.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються напряму в параметри приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо не встановлено.
- OpenClaw використовує вбудований кодек `libopus-wasm` для отримання голосу Discord і realtime відтворення raw PCM. Він постачається з закріпленою збіркою libopus WebAssembly і не потребує нативних opus addons.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоприєднання. Типово: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, доки від’єднана голосова сесія почне повторно підключатися, перш ніж знищити її. Типово: `15000`.
- У режимі `stt-tts` голосове відтворення не зупиняється лише тому, що інший користувач почав говорити. Щоб уникнути циклів зворотного зв’язку, OpenClaw ігнорує нове захоплення голосу, поки відтворюється TTS; говоріть після завершення відтворення для наступної репліки. Режими realtime передають початки мовлення як сигнали barge-in до realtime провайдера.
- У режимах realtime відлуння з динаміків у відкритий мікрофон може виглядати як barge-in і переривати відтворення. Для кімнат Discord із сильним відлунням задайте `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`, щоб OpenAI не переривав автоматично відповідь на вхідне аудіо. Додайте `voice.realtime.bargeIn: true`, якщо все ще хочете, щоб події початку мовлення Discord переривали активне відтворення. Realtime міст OpenAI ігнорує обрізання відтворення, коротші за `voice.realtime.minBargeInAudioEndMs`, як імовірне відлуння/шум і логує їх як пропущені замість очищення відтворення Discord.
- `voice.captureSilenceGraceMs` керує тим, як довго OpenClaw чекає після того, як Discord повідомляє, що мовець зупинився, перш ніж фіналізувати цей аудіосегмент для STT. Типово: `2000`; збільште це значення, якщо Discord розбиває нормальні паузи на уривчасті часткові транскрипти.
- Коли ElevenLabs є вибраним TTS провайдером, голосове відтворення Discord використовує потоковий TTS і починається з потоку відповіді провайдера. Провайдери без підтримки стримінгу повертаються до шляху синтезованого тимчасового файла.
- OpenClaw також відстежує помилки розшифрування отримання та автоматично відновлюється, виходячи з голосового каналу й повторно приєднуючись після повторних помилок у короткому вікні.
- Якщо після оновлення логи отримання повторно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та логи. Вбудована лінія `@discordjs/voice` включає upstream виправлення padding з PR discord.js #11449, яке закрило issue discord.js #11419.
- Події отримання `The operation was aborted` очікувані, коли OpenClaw фіналізує захоплений сегмент мовця; це докладна діагностика, а не попередження.
- Докладні логи голосу Discord включають обмежений однорядковий попередній перегляд STT транскрипту для кожного прийнятого сегмента мовця, тож налагодження показує і бік користувача, і бік відповіді агента без виведення необмеженого тексту транскрипту.
- У режимі `agent-proxy` примусовий fallback консультації пропускає ймовірно неповні фрагменти транскрипту, як-от текст, що закінчується на `...` або кінцевий сполучник на кшталт `and`, а також очевидні непрактичні завершення на кшталт “be right back” або “bye”. Логи показують `forced agent consult skipped reason=...`, коли це запобігає застарілій відповіді в черзі.

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

- `followUsers` приймає raw ID користувачів Discord і значення `discord:<id>`. OpenClaw нормалізує обидві форми перед зіставленням подій voice-state.
- `followUsersEnabled` типово дорівнює `true`, коли `followUsers` налаштовано. Задайте `false`, щоб зберегти список, але зупинити автоматичне стеження в голосі.
- Коли користувач, за яким стежать, приєднується до дозволеного голосового каналу, OpenClaw приєднується до цього каналу. Коли користувач переміщується, OpenClaw переміщується разом із ним. Коли активний користувач, за яким стежать, від’єднується, OpenClaw виходить.
- Якщо кілька користувачів, за якими стежать, перебувають у тій самій гільдії, і активний користувач, за яким стежать, виходить, OpenClaw переходить до каналу іншого відстежуваного користувача перед виходом із гільдії. Якщо кілька користувачів, за якими стежать, переміщуються одночасно, перемагає остання спостережена подія voice-state.
- `allowedChannels` усе ще застосовується. Користувач, за яким стежать, у забороненому каналі ігнорується, а сесія, керована стеженням, переходить до іншого користувача, за яким стежать, або виходить.
- OpenClaw узгоджує пропущені події voice-state під час запуску та з обмеженим інтервалом. Узгодження вибірково перевіряє налаштовані гільдії та обмежує REST-запити за один запуск, тому дуже великі списки `followUsers` можуть потребувати більше ніж одного інтервалу, щоб зійтися.
- Якщо Discord або адміністратор переміщує бота, поки він стежить за користувачем, OpenClaw перебудовує голосову сесію та зберігає володіння стеженням, коли пункт призначення дозволений. Якщо бота переміщено за межі `allowedChannels`, OpenClaw виходить і повторно приєднується до налаштованої цілі, коли вона існує.
- Відновлення отримання DAVE може вийти й повторно приєднатися до того самого каналу після повторних помилок розшифрування. Сесії, керовані стеженням, зберігають володіння стеженням через цей шлях відновлення, тож пізніше від’єднання користувача, за яким стежать, усе ще залишає канал.

Виберіть між режимами приєднання:

- Використовуйте `followUsers` для особистих або операторських налаштувань, де бот має автоматично бути в голосі, коли ви там.
- Використовуйте `autoJoin` для ботів у фіксованих кімнатах, які мають бути присутніми, навіть коли жоден відстежуваний користувач не перебуває в голосі.
- Використовуйте `/vc join` для одноразових приєднань або кімнат, де автоматична голосова присутність була б несподіваною.

Голосовий кодек Discord:

- Журнали отримання голосу показують `discord voice: opus decoder: libopus-wasm`.
- Відтворення в реальному часі кодує сирий стерео PCM 48 кГц в Opus тим самим вбудованим пакетом `libopus-wasm`, перш ніж передати пакети до `@discordjs/voice`.
- Відтворення файлів і потоків провайдера перекодовує в сирий стерео PCM 48 кГц за допомогою ffmpeg, а потім використовує `libopus-wasm` для потоку пакетів Opus, що надсилається до Discord.

Конвеєр STT плюс TTS:

- Захоплення Discord PCM перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхідний потік і маршрутизацію Discord, тоді як LLM відповіді запускається з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернути текст, тому що голос Discord відповідає за фінальне відтворення TTS.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; провайдери з підтримкою потокового передавання напряму передають дані в програвач, інакше отриманий аудіофайл відтворюється в приєднаному каналі.

Приклад стандартної сесії голосового каналу agent-proxy:

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

Без блока `voice.agentSession` кожен голосовий канал отримує власну маршрутизовану сесію OpenClaw. Наприклад, `/vc join channel:234567890123456789` говорить із сесією для цього голосового каналу Discord. Модель реального часу є лише голосовим фронтендом; змістовні запити передаються налаштованому агенту OpenClaw. Якщо модель реального часу створює фінальний транскрипт без виклику інструмента консультації, OpenClaw примусово виконує консультацію як резервний варіант, щоб стандартна поведінка все одно була схожа на розмову з агентом.

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

Приклад двонапрямного режиму реального часу:

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

Голос як розширення наявної сесії каналу Discord:

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

У режимі `agent-proxy` бот приєднується до налаштованого голосового каналу, але ходи агента OpenClaw використовують звичайну маршрутизовану сесію та агента цільового каналу. Голосова сесія реального часу озвучує повернений результат назад у голосовий канал. Агент-супервізор усе ще може використовувати звичайні інструменти повідомлень відповідно до своєї політики інструментів, зокрема надсилати окреме повідомлення Discord, якщо це правильна дія.

Поки делегований запуск OpenClaw активний, нові голосові транскрипти Discord розглядаються як керування активним запуском перед запуском іншого ходу агента. Фрази на кшталт "статус", "скасуй це", "використай менше виправлення" або "коли закінчиш, також перевір тести" класифікуються як статус, скасування, спрямування або подальше введення для активної сесії. Результати статусу, скасування, прийнятого спрямування та подальших дій озвучуються назад у голосовий канал, щоб абонент знав, чи OpenClaw обробив запит.

Корисні форми цілі:

- `target: "channel:123456789012345678"` маршрутизує через сесію текстового каналу Discord.
- `target: "123456789012345678"` розглядається як ціль каналу.
- `target: "dm:123456789012345678"` або `target: "user:123456789012345678"` маршрутизує через цю сесію прямих повідомлень.

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

Використовуйте це, коли модель чує власне відтворення Discord через відкритий мікрофон, але ви все одно хочете перервати її мовленням. OpenClaw не дає OpenAI автоматично перериватися на сирому вхідному аудіо, тоді як `bargeIn: true` дозволяє подіям початку мовлення Discord і вже активному аудіо мовця скасовувати активні відповіді реального часу до того, як наступний захоплений хід дійде до OpenAI. Дуже ранні сигнали втручання з `audioEndMs` нижче `minBargeInAudioEndMs` вважаються ймовірним відлунням/шумом і ігноруються, щоб модель не обривалася на першому кадрі відтворення.

Очікувані голосові журнали:

- Під час приєднання: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Під час запуску реального часу: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Під час аудіо мовця: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` і `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Під час пропущеного застарілого мовлення: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` або `reason=non-actionable-closing ...`
- Після завершення відповіді реального часу: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Під час зупинки/скидання відтворення: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Під час консультації реального часу: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Після відповіді агента: `discord voice: agent turn answer ...`
- Під час поставленого в чергу точного мовлення: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, після чого `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Під час виявлення втручання: `discord voice: realtime barge-in detected source=speaker-start ...` або `discord voice: realtime barge-in detected source=active-speaker-audio ...`, після чого `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Під час переривання реального часу: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, після чого або `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...`, або `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Під час ігнорованого відлуння/шуму: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Коли втручання вимкнено: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Під час неактивного відтворення: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Щоб налагодити обірване аудіо, читайте голосові журнали реального часу як часову шкалу:

1. `realtime audio playback started` означає, що Discord почав відтворювати аудіо асистента. Міст із цього моменту починає рахувати фрагменти виводу асистента, байти Discord PCM, байти реального часу провайдера та синтезовану тривалість аудіо.
2. `realtime speaker turn opened` позначає, що мовець Discord став активним. Якщо відтворення вже активне і `bargeIn` увімкнено, за цим може йти `barge-in detected source=speaker-start`.
3. `realtime input audio started` позначає перший фактичний аудіокадр, отриманий для цього ходу мовця. `outputActive=true` або ненульове `outputAudioMs` тут означає, що мікрофон надсилає вхідні дані, поки відтворення асистента ще активне.
4. `barge-in detected source=active-speaker-audio` означає, що OpenClaw побачив живе аудіо мовця, поки відтворення асистента було активним. Це корисно для відрізнення справжнього переривання від події початку мовлення Discord без корисного аудіо.
5. `barge-in requested reason=...` означає, що OpenClaw попросив провайдера реального часу скасувати або обрізати активну відповідь. Він містить `outputAudioMs`, `outputActive` і `playbackChunks`, щоб ви могли побачити, скільки аудіо асистента фактично відтворилося до переривання.
6. `realtime audio playback stopped reason=...` є точкою локального скидання відтворення Discord. Причина вказує, хто зупинив відтворення: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` або `session-close`.
7. `realtime speaker turn closed` підсумовує захоплений вхідний хід. `chunks=0` або `hasAudio=false` означає, що хід мовця відкрився, але жодне придатне аудіо не дійшло до моста реального часу. `interruptedPlayback=true` означає, що цей вхідний хід перетнувся з виводом асистента й запустив логіку втручання.

Корисні поля:

- `outputAudioMs`: тривалість аудіо асистента, згенерованого провайдером реального часу до рядка журналу.
- `audioMs`: тривалість аудіо асистента, яку OpenClaw порахував до зупинки відтворення.
- `elapsedMs`: час настінного годинника між відкриттям і закриттям потоку відтворення або ходу мовця.
- `discordBytes`: байти стерео PCM 48 кГц, надіслані до голосу Discord або отримані від нього.
- `realtimeBytes`: байти PCM у форматі провайдера, надіслані до провайдера реального часу або отримані від нього.
- `playbackChunks`: фрагменти аудіо асистента, передані до Discord для активної відповіді.
- `sinceLastAudioMs`: проміжок між останнім захопленим аудіокадром мовця та закриттям ходу мовця.

Поширені шаблони:

- Негайне обривання з `source=active-speaker-audio`, малим `outputAudioMs` і тим самим користувачем поруч зазвичай вказує на потрапляння відлуння динаміка в мікрофон. Збільште `voice.realtime.minBargeInAudioEndMs`, зменште гучність динаміка, використовуйте навушники або встановіть `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start`, після якого йде `speaker turn closed ... hasAudio=false`, означає, що Discord повідомив про початок мовлення, але аудіо не дійшло до OpenClaw. Це може бути тимчасова голосова подія Discord, поведінка шумового порога або коротке вмикання мікрофона клієнтом.
- `audio playback stopped reason=stream-close` без близького втручання або `provider-clear-audio` означає, що локальний потік відтворення Discord несподівано завершився. Перевірте попередні журнали провайдера та програвача Discord.
- `capture ignored during playback (barge-in disabled)` означає, що OpenClaw навмисно відкинув введення, поки аудіо асистента було активним. Увімкніть `voice.realtime.bargeIn`, якщо хочете, щоб мовлення переривало відтворення.
- `barge-in ignored ... outputActive=false` означає, що VAD Discord або провайдера повідомив про мовлення, але OpenClaw не мав активного відтворення, яке можна перервати. Це не повинно обривати аудіо.

Облікові дані визначаються для кожного компонента окремо: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio`, автентифікація TTS для `messages.tts`/`voice.tts` і автентифікація провайдера реального часу для `voice.realtime.providers` або звичайної конфігурації автентифікації провайдера.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвилі й потребують аудіо OGG/Opus. OpenClaw автоматично генерує форму хвилі, але потребує `ffmpeg` і `ffprobe` на хості Gateway для перевірки й перетворення.

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw перетворює його на OGG/Opus за потреби.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від розпізнавання користувачів/учасників
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення гільдії несподівано заблоковано">

    - перевірте `groupPolicy`
    - перевірте список дозволених гільдій у `channels.discord.guilds`
    - якщо існує map `channels` гільдії, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, але все одно заблоковано">
    Типові причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволених гільдій/каналів
    - `requireMention` налаштовано не в тому місці (має бути під `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано списком дозволених `users` гільдії/каналу

  </Accordion>

  <Accordion title="Довгі Discord turns або дубльовані відповіді">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Регулятори черги Discord gateway:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою listener Discord gateway, а не тривалістю agent turn

    Discord не застосовує тайм-аут, власником якого є канал, до поставлених у чергу agent turns. Message listeners одразу передають роботу далі, а поставлені в чергу Discord runs зберігають порядок у межах сесії, доки життєвий цикл сесії/інструмента/runtime не завершить або не перерве роботу.

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
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої відступають до стандартного URL Discord gateway і обмежуються за частотою в журналах.

    Регулятори тайм-ауту метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - env fallback, коли config не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - стандартно: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через тайм-аут Gateway READY">
    OpenClaw очікує подію Discord gateway `READY` під час запуску та після повторних підключень runtime. Налаштування з кількома обліковими записами й рознесеним запуском можуть потребувати довшого вікна READY під час запуску, ніж стандартне.

    Регулятори тайм-ауту READY:

    - запуск, один обліковий запис: `channels.discord.gatewayReadyTimeoutMs`
    - запуск, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - startup env fallback, коли config не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - стандартний запуск: `15000` (15 секунд), максимум: `120000`
    - runtime, один обліковий запис: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime, кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - runtime env fallback, коли config не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - стандартний runtime: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте slug-ключі, зіставлення під час runtime все ще може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми DM і pairing">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення pairing у режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-бот">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і списків дозволених, щоб уникнути циклічної поведінки.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

    OpenClaw також постачає спільний [захист від бот-циклів](/uk/channels/bot-loop-protection). Щоразу, коли `allowBots` дозволяє повідомленням, створеним ботами, дійти до dispatch, Discord зіставляє вхідну подію з фактами `(account, channel, bot pair)`, а загальний pair guard пригнічує пару після перевищення налаштованого бюджету подій. Guard запобігає неконтрольованим циклам між двома ботами, які раніше доводилося зупиняти обмеженнями частоти Discord; він не впливає на розгортання з одним ботом або одноразові відповіді ботів, що залишаються в межах бюджету.

    Стандартні налаштування (активні, коли встановлено `allowBots`):

    - `maxEventsPerWindow: 20` -- пара ботів може обмінятися 20 повідомленнями в межах ковзного вікна
    - `windowSeconds: 60` -- довжина ковзного вікна
    - `cooldownSeconds: 60` -- після спрацювання бюджету кожне додаткове повідомлення бот-бот у будь-якому напрямку відкидається протягом однієї хвилини

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

  <Accordion title="Voice STT скидається з DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була доступна логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (стандартно)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (стандарт upstream) і налаштовуйте лише за потреби
    - стежте за журналами на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте з upstream-історією DAVE receive у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Найважливіші поля Discord">

- запуск/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повтор: `mediaMaxMb` (обмежує вихідні завантаження Discord, стандартно `100MB`), `retry`
- дії: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- можливості: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та експлуатація

- Розглядайте токени ботів як секрети (`DISCORD_BOT_TOKEN` бажаний у контрольованих середовищах).
- Надавайте мінімально необхідні дозволи Discord.
- Якщо розгортання/стан команд застаріли, перезапустіть gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Discord із gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Груповий чат і поведінка списку дозволених.
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
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
