---
read_when:
    - Робота над функціями каналу Discord
summary: Стан підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-05-02T02:59:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f82966fd7c7f5ded09d72ea8bc8fe255316fe0178ee71c3f8a4e36410aead54
    source_path: channels/discord.md
    workflow: 16
---

Готово для приватних повідомлень і каналів гільдій через офіційний Discord gateway.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Discord типово запускаються в режимі сполучення.
  </Card>
  <Card title="Команди зі скісною рискою" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес виправлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і спарувати його з OpenClaw. Ми рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Встановіть **Username** на ім’я, яким ви називаєте свого агента OpenClaw.

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

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він незабаром знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з правильними дозволами, щоб додати бота на свій сервер.

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в гілках Discord, зокрема в робочих процесах форумних або медіаканалів, які створюють або продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте побачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть Developer Mode і зберіть свої ID">
    Повернувшись у застосунок Discord, потрібно ввімкнути Developer Mode, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші **значок сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші **власний аватар** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** поруч із Bot Token — на наступному кроці ви надішлете всі три в OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб сполучення працювало, Discord має дозволити вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші **значок сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (зокрема ботам) надсилати вам приватні повідомлення. Залиште це ввімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, після сполучення можна вимкнути приватні повідомлення.

  </Step>

  <Step title="Безпечно встановіть токен бота (не надсилайте його в чаті)">
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

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й повторно запустивши процес `openclaw gateway run`.
    Для встановлень керованого сервісу запустіть `openclaw gateway install` з оболонки, де присутній `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб сервіс міг розв’язати env SecretRef після перезапуску.
    Якщо ваш хост заблокований або обмежений Discord за частотою під час стартового пошуку застосунку, встановіть ID застосунку/клієнта Discord з Developer Portal, щоб запуск міг пропустити цей REST-виклик. Використовуйте `channels.discord.applicationId` для стандартного облікового запису або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кількох ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і спаруйте">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і скажіть йому це. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / конфігурації.

        > "Я вже встановив токен свого бота Discord у конфігурації. Завершіть налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / конфігурація">
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

        Env fallback для стандартного облікового запису:

```bash
DISCORD_BOT_TOKEN=...
```

        Для сценарного або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторіть запуск без `--dry-run`. Підтримуються відкриті текстові значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` через провайдери env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord зберігайте токен кожного бота та ID застосунку в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тому задавайте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID застосунку.

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

  <Step title="Схваліть перше сполучення через приватне повідомлення">
    Зачекайте, доки gateway запрацює, а потім напишіть своєму боту в Discord приватне повідомлення. Він відповість кодом сполучення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код сполучення своєму агенту у вашому наявному каналі:

        > "Схвали цей код сполучення Discord: `<CODE>`"
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
Розв’язання токена враховує обліковий запис. Значення токена в конфігурації мають перевагу над env fallback. `DISCORD_BOT_TOKEN` використовується лише для стандартного облікового запису.
Якщо два ввімкнені облікові записи Discord розв’язуються в той самий токен бота, OpenClaw запускає лише один gateway-монітор для цього токена. Токен із конфігурації має перевагу над стандартним env fallback; інакше перемагає перший увімкнений обліковий запис, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для конкретного виклику використовується саме для цього виклику. Це стосується дій надсилання й читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису та налаштування повторних спроб усе ще беруться з вибраного облікового запису в активному знімку runtime.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли приватні повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених гільдій">
    Це дозволяє вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

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
    Типово ваш агент відповідає в каналах гільдії лише тоді, коли його @згадали. Для приватного сервера ви, ймовірно, хочете, щоб він відповідав на кожне повідомлення.

    У каналах гільдії звичайні фінальні відповіді помічника типово залишаються приватними. Видимий вивід Discord потрібно надсилати явно за допомогою інструмента `message`, тож агент може типово залишатися спостерігачем і публікувати лише тоді, коли вирішить, що відповідь у каналі корисна.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без потреби бути @згаданим"
      </Tab>
      <Tab title="Конфігурація">
        Задайте `requireMention: false` у конфігурації вашої гільдії:

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

        Щоб відновити застарілі автоматичні фінальні відповіді для групових чатів/кімнат каналів, задайте `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Сплануйте пам’ять у каналах гільдії">
    Типово довгострокова пам’ять (MEMORY.md) завантажується лише в сесіях приватних повідомлень. Канали гільдії не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довгостроковий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони впроваджуються для кожної сесії). Зберігайте довгострокові нотатки в `MEMORY.md` і звертайтеся до них за потреби через інструменти пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкуватися. Ваш агент бачить назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що підходить вашому робочому процесу.

## Модель runtime

- Gateway володіє з’єднанням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді Discord повертаються до Discord.
- Метадані гільдії/каналу Discord додаються до підказки моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель копіює цей конверт
  назад, OpenClaw видаляє скопійовані метадані з вихідних відповідей і з
  майбутнього контексту відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали гільдій ізольовані ключами сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові DM ігноруються за замовчуванням (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас усе ще несучи `CommandTargetSessionKey` до маршрутизованої сесії розмови.
- Текстова доставка оголошень cron/heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа й структуровані payload-и компонентів залишаються
  багатоповідомними, коли агент видає кілька доставних payload-ів.

## Форумні канали

Форумні й медіаканали Discord приймають лише дописи в потоках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити потік. Заголовок потоку використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити потік напряму. Не передавайте `--message-id` для форумних каналів.

Приклад: надішліть до батьківського форуму, щоб створити потік

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: створіть форумний потік явно

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самого потоку (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload-ом `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити кнопкам, спискам вибору й формам використовуватися багато разів, доки вони не завершать строк дії.

Щоб обмежити, хто може натиснути кнопку, установіть `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Коли налаштовано, користувачі без збігу отримують ефемерну відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадаючими списками провайдера, моделі й сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору ефемерна, і використовувати її може лише користувач, який її викликав.

Вкладення файлів:

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

## Контроль доступу й маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` керує доступом до DM. `channels.discord.allowFrom` є канонічним allowlist для DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (вимагає, щоб `channels.discord.allowFrom` містив `"*"`)
    - `disabled`

    Якщо політика DM не відкрита, невідомі користувачі блокуються (або отримують запит на сполучення в режимі `pairing`).

    Пріоритетність кількох акаунтів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до акаунта `default`.
    - Для одного акаунта `allowFrom` має пріоритет над застарілим `dm.allowFrom`.
    - Іменовані акаунти успадковують `channels.discord.allowFrom`, коли їхні власні `allowFrom` і застарілий `dm.allowFrom` не задані.
    - Іменовані акаунти не успадковують `channels.discord.accounts.default.allowFrom`.

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` переносить їх до `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID зазвичай розпізнаються як ID каналів, коли активний типовий канал, але ID, перелічені в ефективному DM `allowFrom` акаунта, трактуються як цілі користувацьких DM для сумісності.

  </Tab>

  <Tab title="DM access groups">
    DM Discord можуть використовувати динамічні записи `accessGroup:<name>` у `channels.discord.allowFrom`.

    Імена груп доступу спільні для каналів повідомлень. Використовуйте `type: "message.senders"` для статичної групи, учасники якої виражені у звичайному синтаксисі `allowFrom` кожного каналу, або `type: "discord.channelAudience"`, коли поточна аудиторія `ViewChannel` каналу Discord має динамічно визначати членство. Спільна поведінка груп доступу задокументована тут: [Групи доступу](/uk/channels/access-groups).

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

    Текстовий канал Discord не має окремого списку учасників. `type: "discord.channelAudience"` моделює членство так: відправник DM є учасником налаштованої гільдії й наразі має ефективний дозвіл `ViewChannel` на налаштованому каналі після застосування ролей і перевизначень каналу.

    Приклад: дозвольте будь-кому, хто бачить `#maintainers`, надсилати DM боту, залишаючи DM закритими для всіх інших.

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

    Пошуки не відкривають доступ у разі помилки. Якщо Discord повертає `Missing Access`, пошук учасника завершується невдачею або канал належить іншій гільдії, відправник DM вважається неавторизованим.

    Увімкніть **Server Members Intent** у Discord Developer Portal для бота, коли використовуєте групи доступу аудиторії каналу. DM не містять стану учасника гільдії, тому OpenClaw розв’язує учасника через Discord REST під час авторизації.

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
    - прямий збіг імен/тегів вимкнено за замовчуванням; увімкніть `channels.discord.dangerouslyAllowNameMatching: true` лише як режим сумісності на випадок крайньої потреби
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо гільдія має налаштовані `channels`, канали, яких немає в списку, відхиляються
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

    Якщо ви лише встановите `DISCORD_BOT_TOKEN` і не створите блок `channels.discord`, runtime fallback буде `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` — `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Повідомлення гільдій за замовчуванням обмежені згадкою.

    Виявлення згадок охоплює:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку відповіді боту в підтримуваних випадках

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug-и)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише гільдії. Якщо прив’язка також задає інші поля збігу (наприклад `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнено для Discord.
- Перевизначення для каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимі в UI Discord для неавторизованих користувачів; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Налаштування slash-команд за замовчуванням:

- `ephemeral: true`

## Подробиці функції

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

    Примітка: `off` вимикає неявне групування відповідей у ланцюжки. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord для цього ходу.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був дебаунсованим пакетом із кількох повідомлень. Це корисно,
    коли нативні відповіді потрібні переважно для неоднозначних бурхливих чатів,
    а не для кожного ходу з одним повідомленням.

    ID повідомлень передаються в контексті/історії, щоб агенти могли адресувати конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може транслювати чернетки відповідей, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` на Discord зіставляється з `partial`; `streamMode` — застарілий псевдонім, який автоматично мігрується.

    Типовим значенням лишається `off`, тому що редагування попереднього перегляду Discord швидко впирається в обмеження частоти, коли кілька ботів або Gateway використовують один обліковий запис.

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
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk`, щоб налаштувати розмір і точки розриву, обмежені `textChunkLimit`).
    - Медіа, помилки та фінальні повідомлення з явною відповіддю скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення інструментів/прогресу повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; відповіді з медіа повертаються до звичайної доставки. Коли потокове передавання `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного стримінгу.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка ланцюжків">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервний варіант: `messages.groupChat.historyLimit`
    - `0` вимикає

    Керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка ланцюжків:

    - Ланцюжки Discord маршрутизуються як сеанси каналів і успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси ланцюжків успадковують вибір `/model` рівня сеансу батьківського каналу лише як резервну модель; локальні для ланцюжка вибори `/model` усе одно мають пріоритет, а історія транскрипту батьківського каналу не копіюється, якщо успадкування транскрипту не ввімкнено.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) дозволяє новим автоматичним ланцюжкам засіватися з батьківського транскрипту. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть розв’язувати DM-цілі `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів вводяться як **ненадійний** контекст. Списки дозволених користувачів обмежують, хто може запускати агента, але не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сеанси, прив’язані до ланцюжків для підагентів">
    Discord може прив’язати ланцюжок до цілі сеансу, щоб подальші повідомлення в цьому ланцюжку продовжували маршрутизуватися до того самого сеансу (зокрема сеансів підагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий ланцюжок до цілі підагента/сеансу
    - `/unfocus` прибрати прив’язку поточного ланцюжка
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні типові значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати ланцюжки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати ланцюжки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки ланцюжків вимкнено для облікового запису, `/focus` і пов’язані операції прив’язки ланцюжків недоступні.

    Див. [Підагенти](/uk/tools/subagents), [Агенти ACP](/uk/tools/acp-agents) і [Довідник конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналу ACP">
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

    - `/acp spawn codex --bind here` прив’язує поточний канал або ланцюжок на місці та зберігає майбутні повідомлення в тому самому сеансі ACP. Повідомлення ланцюжка успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або ланцюжку `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив’язки ланцюжків можуть перевизначати розв’язання цілі, доки активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній ланцюжок через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents), щоб дізнатися подробиці поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожної гільдії:

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

    - Discord приймає unicode-емодзі або назви користувацьких емодзі.
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
    Маршрутизуйте WebSocket-трафік Discord gateway і стартові REST-запити (ID застосунку + розв’язання списку дозволених) через HTTP(S)-проксі з `channels.discord.proxy`.

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
    - відображувані імена учасників зіставляються за назвою/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошуки використовують ID оригінального повідомлення та обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота та відкидаються, якщо `allowBots=true` не встановлено

  </Accordion>

  <Accordion title="Псевдоніми вихідних згадок">
    Використовуйте `mentionAliases`, коли агентам потрібні детерміновані вихідні згадки для відомих користувачів Discord. Ключі — це дескриптори без початкового `@`; значення — ID користувачів Discord. Невідомі дескриптори, `@everyone`, `@here` і згадки всередині Markdown-кодспанів лишаються без змін.

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

    Карта типів активності:

    - 0: Грає
    - 1: Транслює (потребує `activityUrl`)
    - 2: Слухає
    - 3: Дивиться
    - 4: Користувацький (використовує текст активності як стан статусу; емодзі необов’язковий)
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
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Схвалення в Discord">
    Discord підтримує обробку схвалень на основі кнопок у DM і може додатково публікувати запити схвалення в початковому каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні схвалення виконання, коли `enabled` не задано або має значення `"auto"` і можна розв’язати принаймні одного схвалювача — або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить схвалювачів виконання з `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` прямого повідомлення. Установіть `enabled: false`, щоб явно вимкнути Discord як нативний клієнт схвалення.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на схвалення та фінальні результати приватно. Спочатку він пробує Discord DM, коли власник, що викликав команду, має маршрут власника Discord; якщо це недоступно, він повертається до першого доступного маршруту власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` має значення `channel` або `both`, запит на схвалення видимий у каналі. Лише визначені схвалювачі можуть використовувати кнопки; інші користувачі отримують ефемерну відмову. Запити на схвалення містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу неможливо вивести з ключа сесії, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки схвалення, які використовують інші чат-канали. Нативний адаптер Discord переважно додає маршрутизацію DM для схвалювачів і розсилання в канали.
    Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує,
    що чат-схвалення недоступні або ручне схвалення є єдиним шляхом.
    Якщо нативне середовище виконання схвалень Discord не активне, OpenClaw залишає
    видимим локальний детермінований запит `/approve <id> <decision>`. Якщо
    середовище виконання активне, але нативну картку неможливо доставити до жодної цілі,
    OpenClaw надсилає резервне сповіщення в той самий чат із точною командою `/approve`
    з очікуваного схвалення.

    Автентифікація Gateway і визначення схвалення відповідають спільному контракту клієнта Gateway (ID `plugin:` визначаються через `plugin.approval.resolve`; інші ID через `exec.approval.resolve`). Схвалення типово спливають через 30 хвилин.

    Див. [Схвалення Exec](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord охоплюють повідомлення, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- повідомлення: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або локальний шлях до файлу), щоб задати зображення обкладинки запланованої події.

Шлюзи дій розташовані в `channels.discord.actions.*`.

Типова поведінка шлюзів:

| Група дій                                                                                                                                                                | Типово    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено |
| roles                                                                                                                                                                    | вимкнено |
| moderation                                                                                                                                                               | вимкнено |
| presence                                                                                                                                                                 | вимкнено |

## UI Components v2

OpenClaw використовує Discord components v2 для схвалень exec і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (розширений сценарій; потребує створення payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендуються.

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

Discord має дві окремі голосові поверхні: realtime **голосові канали** (безперервні розмови) і **вкладення голосових повідомлень** (формат попереднього перегляду з хвильовою формою). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволених ролей/користувачів.
3. Запросіть бота зі scopes `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує типового агента облікового запису й дотримується тих самих правил списку дозволених і групової політики, що й інші команди Discord.

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
- `voice.model` перевизначає LLM, що використовується лише для відповідей голосового каналу Discord. Залиште його незаданим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- Перевизначення `systemPrompt` Discord для окремого каналу застосовуються до ходів голосового транскрипту для цього голосового каналу.
- Ходи голосового транскрипту визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос Discord є opt-in для конфігурацій лише з текстом; задайте `channels.discord.voice.enabled=true` (або залиште наявний блок `channels.discord.voice`), щоб увімкнути команди `/vc`, голосове середовище виконання та Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначати підписку на intent стану голосу. Залиште його незаданим, щоб intent відповідав ефективному ввімкненню голосу.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів приєднання `@discordjs/voice`.
- Типові значення `@discordjs/voice`: `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання. Типово: `30000`.
- `voice.reconnectGraceMs` керує тим, скільки часу OpenClaw чекає, доки від’єднана голосова сесія почне перепідключення, перш ніж знищити її. Типово: `15000`.
- OpenClaw також відстежує збої дешифрування прийому й автоматично відновлюється, виходячи з голосового каналу та повторно приєднуючись до нього після повторюваних збоїв у короткому вікні.
- Якщо журнали прийому після оновлення неодноразово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінія `@discordjs/voice` містить upstream-виправлення padding з PR discord.js #11449, яке закрило issue discord.js #11419.

Пайплайн голосового каналу:

- PCM-захоплення Discord перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхід Discord і маршрутизацію, тоді як LLM відповіді працює з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернути текст, оскільки голос Discord відповідає за фінальне відтворення TTS.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; отримане аудіо відтворюється в приєднаному каналі.

Облікові дані визначаються для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми й потребують аудіо OGG/Opus. OpenClaw генерує хвильову форму автоматично, але потребує `ffmpeg` і `ffprobe` на хості Gateway для перевірки й перетворення.

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Опустіть текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw перетворює його на OGG/Opus за потреби.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Використано заборонені intents або бот не бачить повідомлень guild">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від визначення користувача/учасника
    - перезапустіть gateway після зміни intents

  </Accordion>

  <Accordion title="Повідомлення guild несподівано заблоковані">

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

  <Accordion title="Require mention false, але все ще заблоковано">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідного списку дозволених guild/каналу
    - `requireMention` налаштовано не в тому місці (має бути під `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано списком дозволених `users` для guild/каналу

  </Accordion>

  <Accordion title="Довгі ходи Discord або дублікати відповідей">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Налаштування черги Gateway Discord:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою listener Gateway Discord, а не тривалістю ходу агента

    Discord не застосовує тайм-аут, що належить каналу, до поставлених у чергу ходів агента. Слухачі повідомлень передають роботу негайно, а поставлені в чергу запуски Discord зберігають порядок у межах сесії, доки життєвий цикл сесії/інструмента/середовища виконання не завершить або не перерве роботу.

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
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої повертаються до типового URL Gateway Discord і обмежуються за частотою в журналах.

    Налаштування тайм-ауту метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - резервне env-значення, коли конфіг не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - типово: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Перезапуски через тайм-аут READY Gateway">
    OpenClaw чекає на подію `READY` Gateway Discord під час запуску та після повторних підключень середовища виконання. Конфігураціям із кількома обліковими записами та поетапним запуском може знадобитися довше вікно startup READY, ніж типове.

    Налаштування тайм-ауту READY:

    - запуск для одного облікового запису: `channels.discord.gatewayReadyTimeoutMs`
    - запуск для кількох облікових записів: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - резервне значення env під час запуску, якщо конфігурацію не задано: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - типове значення під час запуску: `15000` (15 секунд), максимум: `120000`
    - runtime для одного облікового запису: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime для кількох облікових записів: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - резервне значення env для runtime, якщо конфігурацію не задано: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - типове значення runtime: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ідентифікаторів каналів.

    Якщо ви використовуєте ключі-slug, зіставлення під час виконання все одно може працювати, але probe не зможе повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з DM і сполученням">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується схвалення сполучення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли bot to bot">
    Типово повідомлення, створені ботами, ігноруються.

    Якщо ви задаєте `channels.discord.allowBots=true`, використовуйте строгі правила згадок і списку дозволених, щоб уникнути циклічної поведінки.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була присутня логіка відновлення приймання голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (типово)
    - почніть із `channels.discord.voice.decryptionFailureTolerance=24` (типове значення upstream) і налаштовуйте лише за потреби
    - стежте за журналами для:
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
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет слухача), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставлення: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb` (обмежує вихідні завантаження Discord, типово `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та операції

- Вважайте токени ботів секретами (у керованих середовищах бажано `DISCORD_BOT_TOKEN`).
- Надавайте Discord дозволи за принципом найменших привілеїв.
- Якщо розгортання команд або стан застаріли, перезапустіть gateway і повторно перевірте за допомогою `openclaw channels status --probe`.

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
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Маршрутизація кількох агентів" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте гільдії та канали з агентами.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
