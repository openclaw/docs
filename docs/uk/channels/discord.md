---
read_when:
    - Робота над функціями каналу Discord
summary: Стан підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-05-01T11:01:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43fdd86a45a815cfef7ab71746c9ca5966f76df3c9da4f18204bf5d0f59f6352
    source_path: channels/discord.md
    workflow: 16
---

Готово для приватних повідомлень і каналів серверів через офіційний Discord Gateway.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Discord типово відкривають режим сполучення.
  </Card>
  <Card title="Команди зі скісною рискою" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити нову програму з ботом, додати бота на свій сервер і сполучити його з OpenClaw. Рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть програму Discord і бота">
    Перейдіть на [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть її, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Установіть **Username** на ім'я, яким ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані intents">
    Залишаючись на сторінці **Bot**, прокрутіть до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов'язково)
    - **Server Members Intent** (рекомендовано; обов'язково для списків дозволених ролей і зіставлення імен з ID)
    - **Presence Intent** (необов'язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не "скидається".
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він невдовзі знадобиться.

  </Step>

  <Step title="Згенеруйте URL запрошення та додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL запрошення з потрібними дозволами, щоб додати бота на свій сервер.

    Прокрутіть до **OAuth2 URL Generator** і ввімкніть:

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте писати в гілках Discord, зокрема в робочих процесах форумних або медіаканалів, які створюють чи продовжують гілку, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL унизу, вставте його в браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть режим розробника та зберіть свої ID">
    Повернувшись у застосунок Discord, потрібно ввімкнути режим розробника, щоб копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Клацніть правою кнопкою миші **значок сервера** на бічній панелі → **Copy Server ID**
    3. Клацніть правою кнопкою миші **власний аватар** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви надішлете всі три в OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб сполучення працювало, Discord має дозволити вашому боту надсилати вам приватні повідомлення. Клацніть правою кнопкою миші **значок сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дає змогу учасникам сервера (зокрема ботам) надсилати вам приватні повідомлення. Залиште це ввімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали сервера, можете вимкнути приватні повідомлення після сполучення.

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

    Якщо OpenClaw уже працює як фоновий сервіс, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й повторно запустивши процес `openclaw gateway run`.
    Для встановлень керованого сервісу запустіть `openclaw gateway install` з оболонки, де присутній `DISCORD_BOT_TOKEN`, або збережіть змінну в `~/.openclaw/.env`, щоб сервіс міг розв'язати env SecretRef після перезапуску.
    Якщо ваш хост заблоковано або обмежено за частотою запитів під час стартового пошуку програми Discord, установіть ID програми/клієнта Discord із Developer Portal, щоб запуск міг пропустити цей виклик REST. Використовуйте `channels.discord.applicationId` для типового облікового запису або `channels.discord.accounts.<accountId>.applicationId`, коли запускаєте кількох ботів Discord.

  </Step>

  <Step title="Налаштуйте OpenClaw і сполучіть">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і повідомте йому. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже встановив токен свого бота Discord у конфігурації. Заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
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

        Резервне env-значення для типового облікового запису:

```bash
DISCORD_BOT_TOKEN=...
```

        Для скриптового або віддаленого налаштування запишіть той самий блок JSON5 за допомогою `openclaw config patch --file ./discord.patch.json5 --dry-run`, а потім повторно запустіть без `--dry-run`. Підтримуються відкриті значення `token`. Значення SecretRef також підтримуються для `channels.discord.token` у провайдерах env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

        Для кількох ботів Discord тримайте токен і ID програми кожного бота в його обліковому записі. Верхньорівневий `channels.discord.applicationId` успадковується обліковими записами, тому встановлюйте його там лише тоді, коли кожен обліковий запис має використовувати той самий ID програми.

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

  <Step title="Підтвердьте перше сполучення приватним повідомленням">
    Зачекайте, доки Gateway запрацює, а потім надішліть боту приватне повідомлення в Discord. Він відповість кодом сполучення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код сполучення своєму агенту в наявному каналі:

        > "Підтвердь цей код сполучення Discord: `<CODE>`"
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
Розв'язання токенів враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним env-значенням. `DISCORD_BOT_TOKEN` використовується лише для типового облікового запису.
Якщо два ввімкнені облікові записи Discord розв'язуються в той самий токен бота, OpenClaw запускає лише один монітор Gateway для цього токена. Токен із конфігурації має пріоритет над типовим резервним env-значенням; інакше перший увімкнений обліковий запис перемагає, а дубльований обліковий запис повідомляється як вимкнений.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` для кожного виклику використовується для цього виклику. Це стосується дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису та параметри повторних спроб усе одно надходять із вибраного облікового запису в активному знімку виконання.
</Note>

## Рекомендовано: налаштуйте робочий простір сервера

Коли приватні повідомлення запрацюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з власним контекстом. Це рекомендовано для приватних серверів, де є лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до списку дозволених серверів">
    Це дає змогу вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Discord Server ID `<server_id>` до списку дозволених серверів"
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
    Типово ваш агент відповідає в каналах сервера лише коли його згадують через @mention. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    У каналах сервера звичайні фінальні відповіді асистента типово залишаються приватними. Видимий вивід Discord потрібно явно надсилати інструментом `message`, тож агент може типово непомітно спостерігати й писати лише тоді, коли вирішить, що відповідь у каналі корисна.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без потреби бути @mentioned"
      </Tab>
      <Tab title="Конфігурація">
        Установіть `requireMention: false` у конфігурації сервера:

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

  <Step title="Сплануйте пам'ять у каналах сервера">
    Типово довгострокова пам'ять (MEMORY.md) завантажується лише в сесіях приватних повідомлень. Канали сервера не завантажують MEMORY.md автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довгостроковий контекст із MEMORY.md."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, помістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони вставляються в кожну сесію). Зберігайте довгострокові нотатки в `MEMORY.md` і звертайтеся до них за потреби за допомогою інструментів пам'яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і почніть спілкування. Ваш агент може бачити назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що підходить вашому робочому процесу.

## Модель виконання

- Gateway володіє з’єднанням Discord.
- Маршрутизація відповідей детермінована: вхідні відповіді Discord повертаються в Discord.
- Метадані guild/channel Discord додаються до підказки моделі як ненадійний
  контекст, а не як видимий користувачу префікс відповіді. Якщо модель скопіює цю обгортку
  назад, OpenClaw видаляє скопійовані метадані з вихідних відповідей і з
  майбутнього контексту повторного відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати спільно використовують основну сесію агента (`agent:main:main`).
- Канали guild ізольовані ключами сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні slash-команди виконуються в ізольованих командних сесіях (`agent:<agentId>:discord:slash:<userId>`), водночас усе ще передаючи `CommandTargetSessionKey` до сесії маршрутизованої розмови.
- Доставка текстових оголошень cron/heartbeat до Discord використовує фінальну
  видиму асистенту відповідь один раз. Медіа й структуровані payload-и компонентів залишаються
  багатоповідомленнєвими, коли агент генерує кілька payload-ів, придатних до доставки.

## Канали форумів

Канали форумів і медіа Discord приймають лише дописи в гілках. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити гілку. Назва гілки використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити гілку напряму. Не передавайте `--message-id` для каналів форумів.

Приклад: надішліть до батьківського форуму, щоб створити гілку

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Приклад: явно створіть гілку форуму

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте до самої гілки (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів v2 Discord для повідомлень агента. Використовуйте інструмент повідомлень із payload-ом `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення та дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій дозволяють до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Установіть `components.reusable=true`, щоб дозволити багаторазове використання кнопок, елементів вибору й форм до завершення їхнього строку дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо налаштовано, користувачі без збігу отримують ephemeral відмову.

Slash-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадними списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарівання замість реєстрації моделей із чату. Відповідь вибору є ephemeral, і використовувати її може лише користувач, який її викликав.

Вкладення файлів:

- Блоки `file` мають указувати на посилання вкладення (`attachment://<filename>`)
- Надайте вкладення через `media`/`path`/`filePath` (один файл); використовуйте `media-gallery` для кількох файлів
- Використовуйте `filename`, щоб перевизначити назву завантаження, коли вона має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` з до 5 полями
- Типи полів: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw додає кнопку запуску автоматично

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
    `channels.discord.dmPolicy` контролює доступ до DM. `channels.discord.allowFrom` є канонічним списком дозволених DM.

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

    Застарілі `channels.discord.dm.policy` і `channels.discord.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Формат цілі DM для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID зазвичай розпізнаються як ID каналів, коли активний стандартний канал, але ID, перелічені в ефективному DM `allowFrom` облікового запису, трактуються як цілі користувацьких DM для сумісності.

  </Tab>

  <Tab title="Guild policy">
    Обробка guild контролюється `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова конфігурація, коли існує `channels.discord`, це `allowlist`.

    Поведінка `allowlist`:

    - guild має збігатися з `channels.discord.guilds` (`id` бажаний, slug приймається)
    - необов’язкові списки дозволених відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли вони збігаються з `users` АБО `roles`
    - прямий збіг імен/тегів за замовчуванням вимкнений; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний режим сумісності
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи імен/тегів
    - якщо guild має налаштовані `channels`, канали не зі списку відхиляються
    - якщо guild не має блока `channels`, усі канали в цій allowlisted guild дозволені

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

    Якщо ви задаєте лише `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, runtime fallback — це `groupPolicy="allowlist"` (із попередженням у журналах), навіть якщо `channels.defaults.groupPolicy` має значення `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Повідомлення guild за замовчуванням обмежені згадками.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    `requireMention` налаштовується для кожного guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` необов’язково відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Group DM:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників Discord guild до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і оцінюються після прив’язок peer або parent-peer та перед прив’язками лише guild. Якщо прив’язка також задає інші поля збігу (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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
- Перевизначення для окремого каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Авторизація нативних команд використовує ті самі списки дозволених/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в UI Discord для користувачів, які не авторизовані; виконання все одно застосовує авторизацію OpenClaw і повертає "not authorized".

Див. [Slash-команди](/uk/tools/slash-commands) для каталогу команд і поведінки.

Стандартні налаштування slash-команд:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord підтримує теги відповідей у виводі агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Контролюється `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне створення гілок відповідей. Явні теги `[[reply_to_*]]` усе ще враховуються.
    `first` завжди додає неявне посилання нативної відповіді до першого вихідного повідомлення Discord для ходу.
    `batched` додає неявне посилання нативної відповіді Discord лише тоді, коли
    вхідний хід був дебаунсованим пакетом із кількох повідомлень. Це корисно,
    коли вам потрібні нативні відповіді переважно для неоднозначних сплесків чату, а не для кожного
    ходу з одним повідомленням.

    ID повідомлень передаються в контексті/історії, щоб агенти могли адресувати конкретні повідомлення.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw може транслювати чорнові відповіді, надсилаючи тимчасове повідомлення й редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` відображається на `partial` у Discord; `streamMode` є застарілим псевдонімом і мігрується автоматично.

    За замовчуванням залишається `off`, оскільки редагування попереднього перегляду Discord швидко впираються в rate limits, коли кілька ботів або gateways спільно використовують обліковий запис.

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
    - Фінальні відповіді з медіа, помилками та явними відповідями скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) контролює, чи повторно використовують оновлення інструментів/прогресу повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; медіавідповіді повертаються до звичайної доставки. Коли потокове передавання `block` явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Контекст історії guild:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка гілок:

    - Гілки Discord маршрутизуються як сеанси каналів і успадковують конфігурацію батьківського каналу, якщо її не перевизначено.
    - Сеанси гілок успадковують вибір `/model` на рівні сеансу батьківського каналу як резервний варіант лише для моделі; локальні для гілки вибори `/model` усе одно мають пріоритет, а історія транскрипту батьківського каналу не копіюється, якщо не ввімкнено успадкування транскрипту.
    - `channels.discord.thread.inheritParent` (типово `false`) вмикає засівання нових автоматичних гілок із батьківського транскрипту. Перевизначення для окремого облікового запису розміщуються в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструментів повідомлень можуть розпізнавати цілі DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів вставляються як **ненадійний** контекст. Списки дозволених визначають, хто може запускати агента, а не є повною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Сеанси, прив'язані до гілок, для субагентів">
    Discord може прив'язати гілку до цілі сеансу, щоб подальші повідомлення в цій гілці й далі маршрутизувалися до того самого сеансу (зокрема сеансів субагентів).

    Команди:

    - `/focus <target>` прив'язати поточну/нову гілку до цілі субагента/сеансу
    - `/unfocus` видалити прив'язку поточної гілки
    - `/agents` показати активні запуски та стан прив'язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокуса через неактивність для сфокусованих прив'язок
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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Примітки:

    - `session.threadBindings.*` задає глобальні типові значення.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути `true`, щоб автоматично створювати/прив'язувати гілки для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути `true`, щоб автоматично створювати/прив'язувати гілки для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив'язки гілок вимкнено для облікового запису, `/focus` і пов'язані операції прив'язки гілок недоступні.

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

    - `/acp spawn codex --bind here` прив'язує поточний канал або гілку на місці та залишає майбутні повідомлення в тому самому сеансі ACP. Повідомлення гілок успадковують прив'язку батьківського каналу.
    - У прив'язаному каналі або гілці `/new` і `/reset` скидають той самий сеанс ACP на місці. Тимчасові прив'язки гілок можуть перевизначати розпізнавання цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив'язати дочірню гілку через `--thread auto|here`.

    Див. [Агенти ACP](/uk/tools/acp-agents) для деталей поведінки прив'язки.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для окремої гільдії:

    - `off`
    - `own` (типово)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події та прикріплюються до маршрутизованого сеансу Discord.

  </Accordion>

  <Accordion title="Реакції підтвердження">
    `ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок розпізнавання:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає емодзі Unicode або назви користувацьких емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані каналом, увімкнено типово.

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
    Маршрутизуйте WebSocket-трафік Gateway Discord і початкові REST-запити під час запуску (ідентифікатор застосунку + розпізнавання списку дозволених) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

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
    - пошуки використовують початковий ідентифікатор повідомлення та обмежені часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями ботів і відкидаються, якщо `allowBots=true` не задано

  </Accordion>

  <Accordion title="Конфігурація присутності">
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
    - 4: Користувацька (використовує текст активності як стан статусу; емодзі необов'язковий)
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

    Автоматична присутність зіставляє доступність середовища виконання зі статусом Discord: справний => онлайн, погіршений або невідомий => неактивний, вичерпаний або недоступний => не турбувати. Необов'язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Схвалення в Discord">
    Discord підтримує обробку схвалень на основі кнопок у DM і може додатково публікувати запити на схвалення в початковому каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов'язково; за можливості повертається до `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні схвалення виконання, коли `enabled` не задано або дорівнює `"auto"` і можна розпізнати принаймні одного схвалювача, або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить схвалювачів виконання з канального `allowFrom`, застарілого `dm.allowFrom` або `defaultTo` для прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт схвалень.

    Для чутливих групових команд лише для власника, як-от `/diagnostics` і `/export-trajectory`, OpenClaw надсилає запити на схвалення та фінальні результати приватно. Спершу він пробує Discord DM, коли власник, який викликає команду, має маршрут власника Discord; якщо він недоступний, OpenClaw повертається до першого доступного маршруту власника з `commands.ownerAllowFrom`, наприклад Telegram.

    Коли `target` дорівнює `channel` або `both`, запит на схвалення видимий у каналі. Кнопками можуть користуватися лише розпізнані схвалювачі; інші користувачі отримують ефемерну відмову. Запити на схвалення містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ідентифікатор каналу не можна вивести з ключа сеансу, OpenClaw повертається до доставки через DM.

    Discord також відображає спільні кнопки схвалення, які використовуються іншими чат-каналами. Нативний адаптер Discord головно додає маршрутизацію DM для схвалювачів і розсилання в канал.
    Коли ці кнопки наявні, вони є основним UX схвалень; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що схвалення в чаті недоступні або ручне схвалення є єдиним шляхом.
    Якщо нативне середовище виконання схвалень Discord неактивне, OpenClaw залишає
    локальну детерміновану підказку `/approve <id> <decision>` видимою. Якщо
    середовище виконання активне, але нативну картку не можна доставити жодній цілі,
    OpenClaw надсилає резервне повідомлення в той самий чат із точною командою `/approve`
    із очікуваного схвалення.

    Автентифікація Gateway і розпізнавання схвалень дотримуються спільного контракту клієнта Gateway (ідентифікатори `plugin:` розпізнаються через `plugin.approval.resolve`; інші ідентифікатори через `exec.approval.resolve`). Типово схвалення спливають через 30 хвилин.

    Див. [Схвалення виконання](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord включають повідомлення, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- повідомлення: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов'язковий параметр `image` (URL або шлях до локального файлу), щоб задати обкладинку запланованої події.

Шлюзи дій розміщуються в `channels.discord.actions.*`.

Типова поведінка шлюзу:

| Група дій                                                                                                                                                                | За замовчуванням |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | увімкнено        |
| roles                                                                                                                                                                    | вимкнено         |
| moderation                                                                                                                                                               | вимкнено         |
| presence                                                                                                                                                                 | вимкнено         |

## UI компонентів v2

OpenClaw використовує компоненти Discord v2 для схвалень виконання та маркерів міжконтекстного переходу. Дії з повідомленнями Discord також можуть приймати `components` для власного UI (розширений режим; потребує побудови payload компонента через інструмент discord), тоді як застарілі `embeds` залишаються доступними, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовують контейнери компонентів Discord (hex).
- Задавайте для кожного облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord має дві окремі голосові поверхні: голосові канали **voice channels** у реальному часі (безперервні розмови) та вкладення голосових повідомлень **voice message attachments** (формат попереднього перегляду з хвильовою формою). Gateway підтримує обидві.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, коли використовуються списки дозволених ролей/користувачів.
3. Запросіть бота зі scopes `bot` і `applications.commands`.
4. Надайте Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status` для керування сеансами. Команда використовує типового агента облікового запису й дотримується тих самих правил списку дозволених і групової політики, що й інші команди Discord.

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
- `voice.model` перевизначає LLM, що використовується лише для відповідей у голосовому каналі Discord. Не задавайте його, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрипцію.
- Перевизначення `systemPrompt` для окремих каналів Discord застосовуються до ходів голосового транскрипту для цього голосового каналу.
- Ходи голосового транскрипту визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад `gateway` і `cron`).
- Голос увімкнено за замовчуванням; задайте `channels.discord.voice.enabled=false`, щоб вимкнути голосовий runtime і Gateway intent `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` може явно перевизначити підписку на intent станів голосу. Не задавайте його, щоб intent відповідав `voice.enabled`.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` передаються до параметрів join `@discordjs/voice`.
- Типові значення `@discordjs/voice`: `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- `voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання. За замовчуванням: `30000`.
- `voice.reconnectGraceMs` керує тим, скільки OpenClaw чекає, доки від'єднаний голосовий сеанс почне перепідключення, перш ніж знищити його. За замовчуванням: `15000`.
- OpenClaw також відстежує збої розшифрування прийому й автоматично відновлюється, виходячи з голосового каналу та повторно приєднуючись після повторюваних збоїв за короткий проміжок часу.
- Якщо після оновлення журнали прийому повторно показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Вбудована лінійка `@discordjs/voice` включає upstream-виправлення padding з PR discord.js #11449, яке закрило issue discord.js #11419.

Конвеєр голосового каналу:

- Захоплення Discord PCM перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через вхідний потік Discord і маршрутизацію, тоді як LLM відповіді працює з політикою голосового виводу, яка приховує інструмент агента `tts` і просить повернути текст, оскільки голос Discord відповідає за фінальне TTS-відтворення.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об'єднується поверх `messages.tts`; отримане аудіо відтворюється в приєднаному каналі.

Облікові дані визначаються для кожного компонента: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` і автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми й потребують аудіо OGG/Opus. OpenClaw автоматично генерує хвильову форму, але потребує `ffmpeg` і `ffprobe` на хості Gateway для перевірки та перетворення.

- Надайте **локальний шлях до файлу** (URL відхиляються).
- Не вказуйте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw перетворює його на OGG/Opus за потреби.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від розпізнавання користувача/учасника
    - перезапустіть Gateway після зміни intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - перевірте `groupPolicy`
    - перевірте список дозволених guild у `channels.discord.guilds`
    - якщо існує map `channels` для guild, дозволено лише перелічені канали
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
    - `requireMention` налаштовано в неправильному місці (має бути під `channels.discord.guilds` або записом channel)
    - відправника заблоковано списком дозволених `users` guild/channel

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Типові журнали:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Регулятори черги Discord Gateway:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - це керує лише роботою listener Discord Gateway, а не часом життя ходу агента

    Discord не застосовує timeout, що належить каналу, до поставлених у чергу ходів агента. Listeners повідомлень передають роботу негайно, а поставлені в чергу запуски Discord зберігають порядок у межах сеансу, доки життєвий цикл сеансу/інструмента/runtime не завершиться або не скасує роботу.

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
    OpenClaw отримує метадані Discord `/gateway/bot` перед підключенням. Тимчасові збої повертаються до типового URL Gateway Discord і мають обмеження частоти в журналах.

    Регулятори timeout метаданих:

    - один обліковий запис: `channels.discord.gatewayInfoTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env, коли config не задано: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - за замовчуванням: `30000` (30 секунд), максимум: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, runtime-зіставлення все одно може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM вимкнено: `channels.discord.dm.enabled=false`
    - політику DM вимкнено: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікування схвалення pairing у режимі `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    За замовчуванням повідомлення, створені ботами, ігноруються.

    Якщо ви задаєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і списків дозволених, щоб уникнути циклічної поведінки.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - підтримуйте OpenClaw актуальним (`openclaw update`), щоб була наявна логіка відновлення прийому голосу Discord
    - підтвердьте `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (upstream-значення за замовчуванням) і налаштовуйте лише за потреби
    - стежте за журналами:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного приєднання, зберіть журнали й порівняйте з upstream-історією прийому DAVE в [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Discord](/uk/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команда: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- метадані Gateway: `gatewayInfoTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (застарілий alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повтор: `mediaMaxMb` (обмежує вихідні завантаження Discord, за замовчуванням `100MB`), `retry`
- дії: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та операції

- Розглядайте токени ботів як секрети (`DISCORD_BOT_TOKEN` бажано використовувати в керованих середовищах).
- Надавайте Discord-дозволи за принципом найменших привілеїв.
- Якщо розгортання/стан команд застаріли, перезапустіть Gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов'язане

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
  <Card title="Багатоагентна маршрутизація" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте гільдії та канали з агентами.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
