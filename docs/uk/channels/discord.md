---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

Готовий до DM і каналів гільдій через офіційний Discord Gateway.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Discord DM за замовчуванням переходять у режим сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Вбудована поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити нову програму з ботом, додати бота на свій сервер і сполучити його з OpenClaw. Рекомендуємо додавати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть програму Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть її, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Встановіть **Username** таким, як ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Залишаючись на сторінці **Bot**, прокрутіть униз до **Privileged Gateway Intents** і увімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імен з ID)
    - **Presence Intent** (необов’язково; потрібен лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть назад угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається".
    </Note>

    Скопіюйте токен і збережіть його. Це ваш **Bot Token**, і він незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на сервер.

    Прокрутіть униз до **OAuth2 URL Generator** і увімкніть:

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

    Це базовий набір для звичайних текстових каналів. Якщо плануєте публікувати в тредах Discord, зокрема в робочих процесах форумних або медіаканалів, які створюють чи продовжують тред, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL внизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб під’єднати. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть режим розробника та зберіть свої ID">
    Повернувшись у програму Discord, потрібно ввімкнути режим розробника, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (іконка шестерні біля вашого аватара) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші **іконку сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші **власний аватар** → **Copy User ID**

    Збережіть **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви надішлете всі три значення в OpenClaw.

  </Step>

  <Step title="Дозвольте DM від учасників сервера">
    Щоб сполучення працювало, Discord має дозволити вашому боту надсилати вам DM. Клацніть правою кнопкою миші **іконку сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам DM. Залиште це ввімкненим, якщо хочете використовувати Discord DM з OpenClaw. Якщо плануєте використовувати лише канали гільдій, після сполучення можна вимкнути DM.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чат)">
    Токен вашого Discord-бота є секретом (як пароль). Задайте його на машині, де запущено OpenClaw, перш ніж писати агенту.

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
    Для встановлень як керований сервіс запустіть `openclaw gateway install` з оболонки, де наявний `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб сервіс міг розв’язати env SecretRef після перезапуску.
    Якщо ваш хост заблокований або обмежений Discord під час lookup програми на старті, задайте ID програми/клієнта Discord з Developer Portal, щоб старт міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для облікового запису за замовчуванням або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кілька ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте сполучення">

    <Tabs>
      <Tab title="Запитайте агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому. Якщо Discord — ваш перший канал, використайте вкладку CLI / config.

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо віддаєте перевагу файловій конфігурації, задайте:

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

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 через `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторно запустіть без `--dry-run`. Значення `token` у відкритому тексті підтримуються. Значення SecretRef також підтримуються для `channels.discord.token` у провайдерах env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord тримайте токен кожного бота та ID програми в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тому задавайте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID програми.

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
    Дочекайтеся запуску Gateway, потім надішліть DM своєму боту в Discord. Він відповість кодом сполучення.

    <Tabs>
      <Tab title="Запитайте агента">
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
Розв’язання токенів враховує обліковий запис. Значення токенів у конфігурації мають пріоритет над резервним env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Якщо два увімкнені облікові записи Discord розв’язуються в той самий токен бота, OpenClaw запускає лише один монітор Gateway для цього токена. Токен із конфігурації має пріоритет над резервним env за замовчуванням; інакше перший увімкнений обліковий запис має пріоритет, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується саме для цього виклику. Це застосовується до дій надсилання та читання/перевірки (наприклад read/search/fetch/thread/pins/permissions). Політика облікового запису та параметри повторних спроб усе одно беруться з вибраного облікового запису в активному runtime snapshot.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли DM запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента зі своїм контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте сервер до allowlist гільдій">
    Це дозволяє вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в DM.

    <Tabs>
      <Tab title="Запитайте агента">
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
    За замовчуванням ваш агент відповідає в каналах гільдії лише тоді, коли його @згадали. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдії звичайні фінальні відповіді асистента за замовчуванням залишаються приватними. Видимий вивід Discord потрібно явно надсилати інструментом `message`, тому агент може за замовчуванням залишатися в режимі спостереження й публікувати лише тоді, коли вирішить, що відповідь у каналі корисна.

    Це означає, що вибрана модель має надійно викликати інструменти. Якщо Discord показує набір тексту, а журнали показують використання токенів, але повідомлення не опубліковано, перевірте журнал сесії на наявність тексту асистента з `didSendViaMessagingTool: false`. Це означає, що модель створила приватну фінальну відповідь замість виклику `message(action=send)`. Перейдіть на сильнішу модель для виклику інструментів або використайте конфігурацію нижче, щоб відновити застарілі автоматичні фінальні відповіді.

    <Tabs>
      <Tab title="Запитайте агента">
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

        Щоб відновити застарілі автоматичні фінальні відповіді для групових чатів/канальних кімнат, задайте `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Сплануйте пам’ять у каналах гільдії">
    За замовчуванням довгострокова пам’ять (MEMORY.md) завантажується лише в DM-сесіях. Канали гільдій не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте агента">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони вставляються в кожну сесію). Тримайте довгострокові нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкуватися. Ваш агент бачить назву каналу, а кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що підходить вашому робочому процесу.

## Модель виконання

- Gateway керує підключенням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді з Discord повертаються до Discord.
- Метадані гільдії/каналу Discord додаються до промпта моделі як ненадійний контекст, а не як видимий користувачеві префікс відповіді. Якщо модель скопіює цю оболонку назад, OpenClaw вилучить скопійовані метадані з вихідних відповідей і з майбутнього контексту відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують спільний головний сеанс агента (`agent:main:main`).
- Канали гільдій ізольовані ключами сеансів (`agent:<agentId>:discord:channel:<channelId>`).
- Групові особисті повідомлення за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сеансах (`agent:<agentId>:discord:slash:<userId>`), водночас передаючи `CommandTargetSessionKey` до маршрутизованого сеансу розмови.
- Доставка текстових оголошень cron/heartbeat до Discord використовує фінальну видиму асистенту відповідь один раз. Медіа та структуровані payload-компоненти залишаються багатоповідомними, коли агент випускає кілька deliverable payload.

## Канали форумів

Канали форумів і медіаканали Discord приймають лише дописи в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити тред. Назвою треду буде перший непорожній рядок вашого повідомлення.
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

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодій маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дають змогу мати до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, меню вибору та форм до завершення їхнього строку дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Коли це налаштовано, користувачі без збігу отримують ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору ефемерна, і використовувати її може лише користувач, який її викликав.

Вкладення файлів:

- Блоки `file` мають указувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` з до 5 полями
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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` керує доступом до особистих повідомлень. `channels.discord.allowFrom` є канонічним списком дозволених відправників для особистих повідомлень.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.discord.allowFrom` містив `"*"`)
    - `disabled`

    Якщо політика особистих повідомлень не відкрита, невідомих користувачів блокують (або пропонують створити пару в режимі `pairing`).

    Пріоритетність для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Для одного облікового запису `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застарілий `dm.allowFrom` не задані.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх у `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Формат цілі особистого повідомлення для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID зазвичай розв’язуються як ID каналів, коли активне значення каналу за замовчуванням, але ID, перелічені в ефективному `allowFrom` особистих повідомлень облікового запису, трактуються як цілі особистих повідомлень користувачів для сумісності.

  </Tab>

  <Tab title="DM access groups">
    Особисті повідомлення Discord можуть використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Назви груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, учасники якої виражені звичайним для кожного каналу синтаксисом `allowFrom`, або `type: "discord.channelAudience"`, коли поточна аудиторія `ViewChannel` каналу Discord має динамічно визначати членство. Спільну поведінку груп доступу задокументовано тут: [Групи доступу](/uk/channels/access-groups).

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

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник особистого повідомлення є учасником налаштованої гільдії й наразі має ефективний дозвіл `ViewChannel` на налаштований канал після застосування ролей і перевизначень каналу.

    Приклад: дозволити будь-кому, хто може бачити `#maintainers`, надсилати особисті повідомлення боту, залишаючи особисті повідомлення закритими для всіх інших.

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

    Пошуки закриваються з відмовою. Якщо Discord повертає `Missing Access`, пошук учасника завершується невдачею або канал належить іншій гільдії, відправник особистого повідомлення вважається неавторизованим.

    Увімкніть **Server Members Intent** для бота в Discord Developer Portal, коли використовуєте групи доступу на основі аудиторії каналу. Особисті повідомлення не містять стану учасника гільдії, тому OpenClaw розв’язує учасника через Discord REST під час авторизації.

  </Tab>

  <Tab title="Guild policy">
    Обробкою гільдій керує `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Захищеним базовим значенням, коли існує `channels.discord`, є `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (рекомендовано `id`, slug приймається)
    - необов’язкові списки дозволених відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо будь-який із них налаштовано, відправники дозволені, коли вони збігаються з `users` АБО `roles`
    - прямий збіг за іменем/тегом вимкнений за замовчуванням; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для гільдії налаштовано `channels`, канали поза списком заборонені
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

  <Tab title="Mentions and group DMs">
    Повідомлення гільдії за замовчуванням обмежені згадуванням.

    Виявлення згадувань охоплює:

    - явне згадування бота
    - налаштовані шаблони згадувань (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    Під час написання вихідних повідомлень Discord використовуйте канонічний синтаксис згадувань: `<@USER_ID>` для користувачів, `<#CHANNEL_ID>` для каналів і `<@&ROLE_ID>` для ролей. Не використовуйте застарілу форму згадування псевдоніма `<@!USER_ID>`.

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, які згадують іншого користувача/роль, але не бота (окрім @everyone/@here).

    Групові особисті повідомлення:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий список дозволених через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і оцінюються після peer або parent-peer прив’язок і перед прив’язками лише за гільдією. Якщо прив’язка також задає інші поля збігу (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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
- `commands.native=false` пропускає реєстрацію та очищення slash-команд Discord під час запуску. Раніше зареєстровані команди можуть залишатися видимими в Discord, доки ви не видалите їх із застосунку Discord.
- Авторизація нативних команд використовує ті самі allowlist-и/політики Discord, що й звичайна обробка повідомлень.
- Команди все одно можуть бути видимими в UI Discord для користувачів, які не авторизовані; виконання все одно застосовує авторизацію OpenClaw і повертає «не авторизовано».

Див. [Slash-команди](/uk/tools/slash-commands), щоб переглянути каталог команд і їхню поведінку.

Типові налаштування slash-команд:

- `ephemeral: true`

## Відомості про функції

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

    Примітка: `off` вимикає неявну потоковість відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord за цей хід.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був debounced-пакетом із кількох повідомлень. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних швидких серій чатів, а не для кожного
    ходу з одним повідомленням.

    ID повідомлень відображаються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд live-потоку">
    OpenClaw може потоково надсилати чернетки відповідей, створюючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` | `partial` | `block` | `progress` (за замовчуванням). `progress` підтримує одну редаговану чернетку статусу й оновлює її прогресом інструментів до фінальної доставки; `streamMode` є застарілим runtime-псевдонімом. Виконайте `openclaw doctor --fix`, щоб переписати збережену конфігурацію на канонічний ключ.

    Установіть `channels.discord.streaming.mode` у `off`, щоб вимкнути редагування попереднього перегляду Discord. Якщо блоковий стримінг Discord явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного стримінгу.

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
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розбиття, з обмеженням до `textChunkLimit`).
    - Медіа, помилки та фінальні повідомлення з явною відповіддю скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.
    - `streaming.preview.commandText` / `streaming.progress.commandText` керує деталями команд/exec у компактних рядках прогресу: `raw` (за замовчуванням) або `status` (лише мітка інструмента).

    Приховати сирий текст команд/exec, зберігаючи компактні рядки прогресу:

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

    Стримінг попереднього перегляду підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли стримінг `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного стримінгу.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка потоків">
    Контекст історії guild:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка потоків:

    - Потоки Discord маршрутизуються як сесії каналів і успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сесії потоків успадковують вибір `/model` рівня сесії батьківського каналу як fallback лише для моделі; локальні для потоку вибори `/model` усе одно мають пріоритет, а історія transcript батька не копіюється, якщо не ввімкнено успадкування transcript.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) вмикає для нових auto-threads початкове наповнення з батьківського transcript. Перевизначення для окремого облікового запису розташовані в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції message-tool можуть розв’язувати DM-цілі `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час fallback активації на етапі відповіді.

    Теми каналів додаються як **ненадійний** контекст. Allowlists обмежують, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Прив’язані до потоків сесії для субагентів">
    Discord може прив’язати потік до цілі сесії, щоб подальші повідомлення в цьому потоці продовжували маршрутизуватися до тієї самої сесії (зокрема сесій субагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий потік до цілі субагента/сесії
    - `/unfocus` видалити прив’язку поточного потоку
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

    - `session.threadBindings.*` задає глобальні значення за замовчуванням.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSessions` керує автоматичним створенням/прив’язуванням потоків для `sessions_spawn({ thread: true })` і створень потоків ACP. За замовчуванням: `true`.
    - `defaultSpawnContext` керує нативним контекстом субагента для створень, прив’язаних до потоків. За замовчуванням: `"fork"`.
    - Застарілі ключі `spawnSubagentSessions`/`spawnAcpSessions` мігруються через `openclaw doctor --fix`.
    - Якщо прив’язки потоків вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки потоків недоступні.

    Див. [Субагенти](/uk/tools/subagents), [Агенти ACP](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних ACP-робочих просторів «always-on» налаштуйте типізовані ACP-прив’язки верхнього рівня, що націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або потік на місці й залишає майбутні повідомлення в тій самій ACP-сесії. Повідомлення потоку успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або потоці `/new` і `/reset` скидають ту саму ACP-сесію на місці. Тимчасові прив’язки потоків можуть перевизначати розв’язання цілі, доки активні.
    - `spawnSessions` керує створенням/прив’язуванням дочірніх потоків через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents), щоб дізнатися подробиці поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для окремого guild:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та додаються до маршрутизованої сесії Discord.

  </Accordion>

  <Accordion title="Ack-реакції">
    `ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розв’язання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback на emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає unicode emoji або назви користувацьких emoji.
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
    Маршрутизуйте WebSocket-трафік Gateway Discord і стартові REST-запити (ID застосунку + розв’язання allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
    Увімкніть розв’язання PluralKit, щоб зіставляти proxied-повідомлення з ідентичністю учасника системи:

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

    - allowlists можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за назвою/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID оригінального повідомлення й обмежені часовим вікном
    - якщо пошук не вдається, proxied-повідомлення вважаються повідомленнями бота й відкидаються, якщо `allowBots=true` не встановлено

  </Accordion>

  <Accordion title="Псевдоніми вихідних згадок">
    Використовуйте `mentionAliases`, коли агентам потрібні детерміновані вихідні згадки для відомих користувачів Discord. Ключі — handles без початкового `@`; значення — ID користувачів Discord. Невідомі handles, `@everyone`, `@here` і згадки всередині Markdown code spans залишаються без змін.

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
    Оновлення присутності застосовуються, коли ви задаєте поле статусу чи активності або коли вмикаєте автоматичну присутність.

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
    - 4: Користувацький (використовує текст активності як стан статусу; emoji необов’язковий)
    - 5: Змагається

    Приклад автоматичної присутності (сигнал справності runtime):

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

    Автоматична присутність зіставляє доступність під час виконання зі статусом Discord: справний => онлайн, погіршений або невідомий => неактивний, вичерпаний або недоступний => не турбувати. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord підтримує обробку схвалень за допомогою кнопок у приватних повідомленнях і може необов’язково публікувати запити на схвалення в початковому каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні схвалення виконання, коли `enabled` не задано або має значення `"auto"`, і можна визначити принаймні одного схвалювача або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить схвалювачів виконання з канального `allowFrom`, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт схвалення.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на схвалення та фінальні результати приватно. Спочатку він пробує Discord DM, коли власник, що викликає команду, має маршрут власника Discord; якщо він недоступний, OpenClaw повертається до першого доступного маршруту власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на схвалення видимий у каналі. Кнопками можуть користуватися лише визначені схвалювачі; інші користувачі отримують ефемерну відмову. Запити на схвалення містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо отримати з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки схвалення, які використовують інші чат-канали. Нативний адаптер Discord переважно додає маршрутизацію DM для схвалювачів і розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
    має додавати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що чат-схвалення недоступні або ручне схвалення є єдиним шляхом.
    Якщо нативне середовище виконання схвалень Discord не активне, OpenClaw залишає
    локальний детермінований запит `/approve <id> <decision>` видимим. Якщо
    середовище виконання активне, але нативну картку неможливо доставити жодній цілі,
    OpenClaw надсилає резервне повідомлення в той самий чат із точною командою `/approve`
    з очікуваного схвалення.

    Автентифікація Gateway і розв’язання схвалень відповідають спільному контракту клієнта Gateway (`plugin:` ID розв’язуються через `plugin.approval.resolve`; інші ID через `exec.approval.resolve`). Типово термін дії схвалень спливає через 30 хвилин.

    Див. [схвалення виконання](/uk/tools/exec-approvals).

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

Шлюзи дій розташовані в `channels.discord.actions.*`.

Типова поведінка шлюзів:

| Група дій                                                                                                                                                                | Типово   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено |
| roles                                                                                                                                                                    | вимкнено |
| moderation                                                                                                                                                               | вимкнено |
| presence                                                                                                                                                                 | вимкнено |

## Інтерфейс компонентів v2

OpenClaw використовує компоненти Discord v2 для схвалень виконання та міжконтекстних маркерів. Дії повідомлень Discord також можуть приймати `components` для власного UI (розширено; потребує створення корисного навантаження компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Задайте для кожного облікового запису за допомогою `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві різні голосові поверхні: голосові канали **реального часу** (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду хвильової форми). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволів ролей/користувачів.
3. Запросіть бота зі scope `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status`, щоб керувати сесіями. Команда використовує типового агента облікового запису й дотримується тих самих правил списків дозволів і групових політик, що й інші команди Discord.

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
- `voice.model` перевизначає LLM, який використовується лише для відповідей у голосовому каналі Discord. Залиште його незаданим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- Перевизначення `systemPrompt` для кожного каналу Discord застосовуються до ходів голосового транскрипту для цього голосового каналу.
- Ходи голосового транскрипту визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос Discord є opt-in для текстових конфігурацій; задайте `channels.discord.voice.enabled=true` (або залиште наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на intent голосового стану. Залиште його незаданим, щоб intent відповідав ефективному ввімкненню голосу.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice` — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання. Типово: `30000`.
- `voice.reconnectGraceMs` керує тим, як довго OpenClaw чекає, поки від’єднана голосова сесія почне повторне підключення, перш ніж знищити її. Типово: `15000`.
- Голосове відтворення не зупиняється лише тому, що інший користувач починає говорити. Щоб уникнути петель зворотного зв’язку, OpenClaw ігнорує нове захоплення голосу, поки відтворюється TTS; говоріть після завершення відтворення для наступного ходу.
- `voice.captureSilenceGraceMs` керує тим, як довго OpenClaw чекає після того, як Discord повідомляє, що мовець зупинився, перш ніж фіналізувати цей аудіосегмент для STT. Типово: `2500`; збільште це значення, якщо Discord розбиває звичайні паузи на уривчасті часткові транскрипти.
- Коли вибраним постачальником TTS є ElevenLabs, голосове відтворення Discord використовує потоковий TTS і стартує з потоку відповіді постачальника. Постачальники без підтримки потокового передавання повертаються до шляху із синтезованим тимчасовим файлом.
- OpenClaw також відстежує помилки розшифрування приймання й автоматично відновлюється, виходячи з голосового каналу та повторно приєднуючись після повторних помилок у короткому вікні.
- Якщо після оновлення журнали приймання неодноразово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінія `@discordjs/voice` містить upstream-виправлення заповнення з PR discord.js #11449, який закрив issue discord.js #11419.
- Події приймання `The operation was aborted` очікувані, коли OpenClaw фіналізує захоплений сегмент мовця; це докладні діагностичні повідомлення, а не попередження.

Конвеєр голосового каналу:

- Захоплення PCM Discord перетворюється на тимчасовий файл WAV.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхід Discord і маршрутизацію, тоді як LLM відповіді працює з політикою голосового виводу, яка приховує агентський інструмент `tts` і просить повернути текст, бо голос Discord відповідає за фінальне відтворення TTS.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; постачальники з підтримкою потокового передавання подають дані безпосередньо в програвач, інакше отриманий аудіофайл відтворюється в приєднаному каналі.

Облікові дані розв’язуються для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми та потребують аудіо OGG/Opus. OpenClaw генерує хвильову форму автоматично, але потребує `ffmpeg` і `ffprobe` на хості Gateway для перевірки та конвертації.

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному корисному навантаженні).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від розв’язання користувача/учасника
    - перезапустіть gateway після зміни intent

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - перевірте `groupPolicy`
    - перевірте список дозволених guild у `channels.discord.guilds`
    - якщо існує мапа `channels` для guild, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Вимога згадки вимкнена, але все ще заблоковано">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволених guild/channel
    - `requireMention` налаштовано не в тому місці (має бути в `channels.discord.guilds` або записі каналу)
    - відправника заблоковано списком дозволених `users` для guild/channel

  </Accordion>

  <Accordion title="Довгі Discord-звернення або дубльовані відповіді">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Параметри черги Discord gateway:

    - один акаунт: `channels.discord.eventQueue.listenerTimeout`
    - кілька акаунтів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою слухача Discord gateway, а не тривалістю звернення агента

    Discord не застосовує тайм-аут, що належить каналу, до поставлених у чергу звернень агента. Слухачі повідомлень одразу передають роботу далі, а поставлені в чергу запуски Discord зберігають порядок у межах сесії, доки життєвий цикл сесії/інструмента/середовища виконання не завершить або не перерве роботу.

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
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. У разі тимчасових збоїв використовується резервна типова URL-адреса Discord gateway, а записи в журналах обмежуються за частотою.

    Параметри тайм-ауту метаданих:

    - один акаунт: `channels.discord.gatewayInfoTimeoutMs`
    - кілька акаунтів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне значення env, коли конфігурацію не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - типово: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через тайм-аут READY Gateway">
    OpenClaw чекає на подію Discord gateway `READY` під час запуску та після повторних підключень середовища виконання. Конфігураціям із кількома акаунтами та рознесенням запуску може знадобитися довше стартове вікно READY, ніж типове.

    Параметри тайм-ауту READY:

    - запуск, один акаунт: `channels.discord.gatewayReadyTimeoutMs`
    - запуск, кілька акаунтів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - резервне значення env для запуску, коли конфігурацію не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - типово для запуску: `15000` (15 секунд), максимум: `120000`
    - середовище виконання, один акаунт: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - середовище виконання, кілька акаунтів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - резервне значення env для середовища виконання, коли конфігурацію не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - типово для середовища виконання: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте slug-ключі, зіставлення під час виконання все одно може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли bot-to-bot">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви встановлюєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і списків дозволених, щоб уникнути циклічної поведінки.
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

  <Accordion title="Скидання Voice STT з DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була наявна логіка відновлення отримання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (типово)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (типове значення upstream) і налаштовуйте лише за потреби
    - стежте за журналами на наявність:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали та порівняйте з upstream-історією отримання DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Важливі поля Discord">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет слухача), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повтор: `mediaMaxMb` (обмежує вихідні завантаження Discord, типово `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневі `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека й експлуатація

- Вважайте токени ботів секретами (у керованих середовищах бажано `DISCORD_BOT_TOKEN`).
- Надавайте Discord дозволи за принципом найменших привілеїв.
- Якщо розгортання команди або стан застаріли, перезапустіть gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Discord з gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Груповий чат і поведінка списку дозволених.
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
