---
read_when:
    - Робота над функціями каналу Discord
summary: Статус підтримки бота Discord, можливості та конфігурація
title: Discord
x-i18n:
    generated_at: "2026-04-27T12:48:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce2cf1dcff2b596822ba96043470a66e3833e562c2fc152ed5d2fc6e9ca70da7
    source_path: channels/discord.md
    workflow: 15
---

Готово для приватних повідомлень і каналів гільдій через офіційний Discord gateway.

<CardGroup cols={3}>
  <Card title="Зіставлення" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Discord за замовчуванням працюють у режимі зіставлення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та процес відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

Вам потрібно створити новий застосунок із ботом, додати бота на свій сервер і зіставити його з OpenClaw. Ми рекомендуємо додати бота на власний приватний сервер. Якщо у вас його ще немає, [спочатку створіть його](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (виберіть **Create My Own > For me and my friends**).

<Steps>
  <Step title="Створіть застосунок Discord і бота">
    Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications) і натисніть **New Application**. Назвіть його, наприклад, "OpenClaw".

    Натисніть **Bot** на бічній панелі. Встановіть **Username** на ту назву, якою ви називаєте свого агента OpenClaw.

  </Step>

  <Step title="Увімкніть привілейовані інтенти">
    Усе ще на сторінці **Bot**, прокрутіть вниз до **Privileged Gateway Intents** і ввімкніть:

    - **Message Content Intent** (обов’язково)
    - **Server Members Intent** (рекомендовано; обов’язково для allowlist ролей і зіставлення імені з ID)
    - **Presence Intent** (необов’язково; потрібно лише для оновлень присутності)

  </Step>

  <Step title="Скопіюйте токен бота">
    Прокрутіть угору на сторінці **Bot** і натисніть **Reset Token**.

    <Note>
    Попри назву, це створює ваш перший токен — нічого не «скидається».
    </Note>

    Скопіюйте токен і збережіть його десь. Це ваш **Bot Token**, і він скоро знадобиться.

  </Step>

  <Step title="Згенеруйте URL-запрошення та додайте бота на свій сервер">
    Натисніть **OAuth2** на бічній панелі. Ви згенеруєте URL-запрошення з правильними дозволами, щоб додати бота на свій сервер.

    Прокрутіть до **OAuth2 URL Generator** і ввімкніть:

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

    Це базовий набір для звичайних текстових каналів. Якщо ви плануєте публікувати в тредах Discord, зокрема у сценаріях форумних або медіаканалів, які створюють або продовжують тред, також увімкніть **Send Messages in Threads**.
    Скопіюйте згенерований URL внизу, вставте його у браузер, виберіть свій сервер і натисніть **Continue**, щоб підключити. Тепер ви маєте бачити свого бота на сервері Discord.

  </Step>

  <Step title="Увімкніть режим розробника та зберіть свої ID">
    Повернувшись у застосунок Discord, вам потрібно ввімкнути режим розробника, щоб можна було копіювати внутрішні ID.

    1. Натисніть **User Settings** (значок шестерні поруч із вашим аватаром) → **Advanced** → увімкніть **Developer Mode**
    2. Натисніть правою кнопкою миші на **значок сервера** на бічній панелі → **Copy Server ID**
    3. Натисніть правою кнопкою миші на **власний аватар** → **Copy User ID**

    Збережіть свої **Server ID** і **User ID** разом із Bot Token — на наступному кроці ви передасте всі три значення в OpenClaw.

  </Step>

  <Step title="Дозвольте приватні повідомлення від учасників сервера">
    Щоб зіставлення працювало, Discord має дозволяти вашому боту надсилати вам приватні повідомлення. Натисніть правою кнопкою миші на **значок сервера** → **Privacy Settings** → увімкніть **Direct Messages**.

    Це дозволяє учасникам сервера (включно з ботами) надсилати вам приватні повідомлення. Залиште це ввімкненим, якщо хочете використовувати приватні повідомлення Discord з OpenClaw. Якщо ви плануєте використовувати лише канали гільдії, після зіставлення можна вимкнути приватні повідомлення.

  </Step>

  <Step title="Безпечно задайте токен бота (не надсилайте його в чаті)">
    Токен вашого бота Discord — це секретні дані (як пароль). Задайте його на машині, де працює OpenClaw, перш ніж писати своєму агенту.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Якщо OpenClaw уже запущено як фонову службу, перезапустіть його через застосунок OpenClaw для Mac або зупинивши й знову запустивши процес `openclaw gateway run`.

  </Step>

  <Step title="Налаштуйте OpenClaw і виконайте зіставлення">

    <Tabs>
      <Tab title="Запитайте свого агента">
        Поспілкуйтеся зі своїм агентом OpenClaw у будь-якому наявному каналі (наприклад, Telegram) і скажіть йому це. Якщо Discord — ваш перший канал, натомість використайте вкладку CLI / config.

        > "Я вже задав токен бота Discord у конфігурації. Будь ласка, заверши налаштування Discord з User ID `<user_id>` і Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Якщо ви надаєте перевагу файловій конфігурації, задайте:

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

        Резервне значення env для облікового запису за замовчуванням:

```bash
DISCORD_BOT_TOKEN=...
```

        Підтримуються відкриті значення `token`. Також для `channels.discord.token` підтримуються значення SecretRef через провайдерів env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Підтвердьте перше зіставлення через приватні повідомлення">
    Дочекайтеся, поки gateway запуститься, а потім напишіть своєму боту в Discord у приватні повідомлення. Він відповість кодом зіставлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        Надішліть код зіставлення своєму агенту в наявному каналі:

        > "Підтвердь цей код зіставлення Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Термін дії кодів зіставлення спливає через 1 годину.

    Тепер ви маєте змогу спілкуватися зі своїм агентом у Discord через приватні повідомлення.

  </Step>
</Steps>

<Note>
Визначення токена враховує обліковий запис. Значення токена в конфігурації мають пріоритет над резервним значенням env. `DISCORD_BOT_TOKEN` використовується лише для облікового запису за замовчуванням.
Для розширених вихідних викликів (інструмент повідомлень/дії каналу) явний `token` використовується для цього виклику. Це застосовується до дій надсилання та читання/перевірки (наприклад, read/search/fetch/thread/pins/permissions). Політика облікового запису та налаштування повторних спроб усе ще беруться з вибраного облікового запису в активному runtime snapshot.
</Note>

## Рекомендовано: налаштуйте робочий простір гільдії

Коли приватні повідомлення вже працюють, ви можете налаштувати свій сервер Discord як повноцінний робочий простір, де кожен канал отримує власну сесію агента з окремим контекстом. Це рекомендовано для приватних серверів, де єте лише ви та ваш бот.

<Steps>
  <Step title="Додайте свій сервер до allowlist гільдій">
    Це дає змогу вашому агенту відповідати в будь-якому каналі на вашому сервері, а не лише в приватних повідомленнях.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Додай мій Discord Server ID `<server_id>` до allowlist гільдій"
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
    За замовчуванням ваш агент відповідає в каналах гільдії лише тоді, коли його згадують через @mention. Для приватного сервера ви, ймовірно, захочете, щоб він відповідав на кожне повідомлення.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Дозволь моєму агенту відповідати на цьому сервері без @mention"
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

      </Tab>
    </Tabs>

  </Step>

  <Step title="Сплануйте роботу з пам’яттю в каналах гільдії">
    За замовчуванням довготривала пам’ять (`MEMORY.md`) завантажується лише в сесіях приватних повідомлень. У каналах гільдії `MEMORY.md` не завантажується автоматично.

    <Tabs>
      <Tab title="Запитайте свого агента">
        > "Коли я ставлю запитання в каналах Discord, використовуй memory_search або memory_get, якщо тобі потрібен довготривалий контекст із `MEMORY.md`."
      </Tab>
      <Tab title="Вручну">
        Якщо вам потрібен спільний контекст у кожному каналі, розмістіть стабільні інструкції в `AGENTS.md` або `USER.md` (вони вбудовуються в кожну сесію). Зберігайте довготривалі нотатки в `MEMORY.md` і звертайтеся до них за потреби через інструменти пам’яті.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Тепер створіть кілька каналів на своєму сервері Discord і починайте спілкування. Ваш агент бачить назву каналу, і кожен канал отримує власну ізольовану сесію — тож ви можете налаштувати `#coding`, `#home`, `#research` або будь-що, що відповідає вашому робочому процесу.

## Модель виконання

- Gateway керує підключенням до Discord.
- Маршрутизація відповідей детермінована: вхідні повідомлення Discord отримують відповіді назад у Discord.
- Метадані гільдії/каналу Discord додаються до prompt моделі як недовірений контекст, а не як видимий користувачу префікс відповіді. Якщо модель копіює цю оболонку назад, OpenClaw прибирає скопійовані метадані з вихідних відповідей і з майбутнього контексту повторного відтворення.
- За замовчуванням (`session.dmScope=main`) прямі чати використовують спільну основну сесію агента (`agent:main:main`).
- Канали гільдії мають ізольовані ключі сесій (`agent:<agentId>:discord:channel:<channelId>`).
- Групові приватні повідомлення за замовчуванням ігноруються (`channels.discord.dm.groupEnabled=false`).
- Нативні слеш-команди виконуються в ізольованих сесіях команд (`agent:<agentId>:discord:slash:<userId>`), при цьому все ще передаючи `CommandTargetSessionKey` до маршрутизованої сесії розмови.
- Доставка текстових оголошень Cron/Heartbeat у Discord використовує фінальну видиму асистенту відповідь один раз. Медіадані та структуровані payload компонентів залишаються багатоповідомними, коли агент надсилає кілька придатних до доставки payload.

## Форумні канали

Форумні та медіаканали Discord приймають лише публікації в тредах. OpenClaw підтримує два способи їх створення:

- Надішліть повідомлення до батьківського форуму (`channel:<forumId>`), щоб автоматично створити тред. Заголовок треду використовує перший непорожній рядок вашого повідомлення.
- Використайте `openclaw message thread create`, щоб створити тред безпосередньо. Не передавайте `--message-id` для форумних каналів.

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

Батьківські форуми не приймають компоненти Discord. Якщо вам потрібні компоненти, надсилайте повідомлення в сам тред (`channel:<threadId>`).

## Інтерактивні компоненти

OpenClaw підтримує контейнери компонентів Discord v2 для повідомлень агента. Використовуйте інструмент повідомлень із payload `components`. Результати взаємодії маршрутизуються назад до агента як звичайні вхідні повідомлення й дотримуються наявних налаштувань Discord `replyToMode`.

Підтримувані блоки:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Рядки дій підтримують до 5 кнопок або одне меню вибору
- Типи вибору: `string`, `user`, `role`, `mentionable`, `channel`

За замовчуванням компоненти одноразові. Задайте `components.reusable=true`, щоб дозволити багаторазове використання кнопок, виборів і форм, доки не сплине строк їх дії.

Щоб обмежити, хто може натискати кнопку, задайте `allowedUsers` для цієї кнопки (ID користувачів Discord, теги або `*`). Якщо це налаштовано, користувачі, які не збігаються з правилом, отримають ефемерну відмову.

Слеш-команди `/model` і `/models` відкривають інтерактивний вибір моделі з випадними списками провайдера, моделі та сумісного runtime, а також кроком Submit. `/models add` застаріла й тепер повертає повідомлення про застарілість замість реєстрації моделей із чату. Відповідь вибору є ефемерною, і використовувати її може лише користувач, який викликав команду.

Вкладення файлів:

- блоки `file` мають вказувати на посилання вкладення (`attachment://<filename>`)
- передайте вкладення через `media`/`path`/`filePath` (один файл); для кількох файлів використовуйте `media-gallery`
- використовуйте `filename`, щоб перевизначити ім’я завантаження, коли воно має збігатися з посиланням вкладення

Модальні форми:

- Додайте `components.modal` із максимум 5 полями
- Типи полів: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw автоматично додає кнопку тригера

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
  <Tab title="Політика приватних повідомлень">
    `channels.discord.dmPolicy` керує доступом до приватних повідомлень (застаріле: `channels.discord.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.discord.allowFrom` містив `"*"`; застаріле: `channels.discord.dm.allowFrom`)
    - `disabled`

    Якщо політика приватних повідомлень не є open, невідомі користувачі блокуються (або отримують запит на зіставлення в режимі `pairing`).

    Пріоритет для кількох облікових записів:

    - `channels.discord.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.discord.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.discord.accounts.default.allowFrom`.

    Формат цілі приватних повідомлень для доставки:

    - `user:<id>`
    - згадка `<@id>`

    Голі числові ID є неоднозначними й відхиляються, якщо явно не вказано тип цілі user/channel.

  </Tab>

  <Tab title="Політика гільдії">
    Обробка гільдій керується через `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Безпечна базова поведінка, коли існує `channels.discord`, — це `allowlist`.

    Поведінка `allowlist`:

    - гільдія має збігатися з `channels.discord.guilds` (переважно `id`, slug також приймається)
    - необов’язкові allowlist відправників: `users` (рекомендовано стабільні ID) і `roles` (лише ID ролей); якщо налаштовано будь-який із них, відправники дозволяються, коли збігаються з `users` АБО `roles`
    - пряме зіставлення імен/тегів за замовчуванням вимкнене; вмикайте `channels.discord.dangerouslyAllowNameMatching: true` лише як аварійний сумісний режим
    - імена/теги підтримуються для `users`, але ID безпечніші; `openclaw security audit` попереджає, коли використовуються записи з іменами/тегами
    - якщо для гільдії налаштовано `channels`, канали поза списком забороняються
    - якщо гільдія не має блоку `channels`, дозволяються всі канали в цій allowlist-гілдії

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

    Якщо ви лише задаєте `DISCORD_BOT_TOKEN` і не створюєте блок `channels.discord`, резервна поведінка runtime буде `groupPolicy="allowlist"` (із попередженням у логах), навіть якщо `channels.defaults.groupPolicy` дорівнює `open`.

  </Tab>

  <Tab title="Згадки та групові приватні повідомлення">
    Повідомлення гільдії за замовчуванням вимагають згадки.

    Виявлення згадок включає:

    - явну згадку бота
    - налаштовані шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявну поведінку reply-to-bot у підтримуваних випадках

    `requireMention` налаштовується для кожної гільдії/каналу (`channels.discord.guilds...`).
    `ignoreOtherMentions` за потреби відкидає повідомлення, які згадують іншого користувача/роль, але не бота (за винятком @everyone/@here).

    Групові приватні повідомлення:

    - за замовчуванням: ігноруються (`dm.groupEnabled=false`)
    - необов’язковий allowlist через `dm.groupChannels` (ID каналів або slug)

  </Tab>
</Tabs>

### Маршрутизація агентів на основі ролей

Використовуйте `bindings[].match.roles`, щоб маршрутизувати учасників гільдії Discord до різних агентів за ID ролі. Прив’язки на основі ролей приймають лише ID ролей і обчислюються після прив’язок peer або parent-peer та перед прив’язками лише для гільдій. Якщо прив’язка також задає інші поля match (наприклад, `peer` + `guildId` + `roles`), усі налаштовані поля мають збігатися.

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

- `commands.native` за замовчуванням має значення `"auto"` і ввімкнене для Discord.
- Перевизначення для конкретного каналу: `channels.discord.commands.native`.
- `commands.native=false` явно очищає раніше зареєстровані нативні команди Discord.
- Автентифікація нативних команд використовує ті самі allowlist/політики Discord, що й звичайна обробка повідомлень.
- Команди все ще можуть бути видимими в інтерфейсі Discord для користувачів, які не авторизовані; виконання все одно застосовує автентифікацію OpenClaw і повертає "not authorized".

Див. [Слеш-команди](/uk/tools/slash-commands), щоб переглянути каталог команд і поведінку.

Налаштування слеш-команд за замовчуванням:

- `ephemeral: true`

## Деталі функцій

<AccordionGroup>
  <Accordion title="Теги відповідей і нативні відповіді">
    Discord підтримує теги відповідей у виведенні агента:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Керується через `channels.discord.replyToMode`:

    - `off` (за замовчуванням)
    - `first`
    - `all`
    - `batched`

    Примітка: `off` вимикає неявне threading відповідей. Явні теги `[[reply_to_*]]` усе одно враховуються.
    `first` завжди додає неявне нативне посилання відповіді до першого вихідного повідомлення Discord для цього ходу.
    `batched` додає неявне нативне посилання відповіді Discord лише тоді, коли
    вхідний хід був debounce-пакетом із кількох повідомлень. Це корисно,
    коли вам потрібні нативні відповіді переважно для неоднозначних серійних чатів, а не для кожного
    окремого повідомлення.

    ID повідомлень передаються в контексті/історії, щоб агенти могли націлюватися на конкретні повідомлення.

  </Accordion>

  <Accordion title="Попередній перегляд живого потоку">
    OpenClaw може передавати чернетки відповідей потоком, надсилаючи тимчасове повідомлення та редагуючи його в міру надходження тексту. `channels.discord.streaming` приймає `off` (за замовчуванням) | `partial` | `block` | `progress`. `progress` у Discord відображається як `partial`; `streamMode` є застарілим псевдонімом і автоматично мігрує.

    За замовчуванням лишається `off`, оскільки редагування попереднього перегляду в Discord швидко впирається в rate limits, коли кілька ботів або gateway спільно використовують один обліковий запис.

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
    - `block` надсилає фрагменти розміру чернетки (використовуйте `draftChunk` для налаштування розміру та точок розбиття, обмежених `textChunkLimit`).
    - Фінальні медіа, помилки й явні відповіді скасовують очікувані редагування попереднього перегляду.
    - `streaming.preview.toolProgress` (за замовчуванням `true`) керує тим, чи оновлення tool/progress повторно використовують повідомлення попереднього перегляду.

    Потоковий попередній перегляд підтримує лише текст; медіавідповіді повертаються до звичайної доставки. Коли `block` streaming явно ввімкнено, OpenClaw пропускає потік попереднього перегляду, щоб уникнути подвійного потокового передавання.

  </Accordion>

  <Accordion title="Історія, контекст і поведінка тредів">
    Контекст історії гільдії:

    - `channels.discord.historyLimit` за замовчуванням `20`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Елементи керування історією приватних повідомлень:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Поведінка тредів:

    - Треди Discord маршрутизуються як сесії каналів і успадковують конфігурацію батьківського каналу, якщо не перевизначено інше.
    - Сесії тредів успадковують вибір `/model` на рівні сесії батьківського каналу як резервний варіант лише для моделі; локальні для треду вибори `/model` усе одно мають пріоритет, а історія стенограми батьківського каналу не копіюється, якщо не ввімкнено успадкування стенограми.
    - `channels.discord.thread.inheritParent` (за замовчуванням `false`) вмикає для нових автотредів ініціалізацію з батьківської стенограми. Перевизначення для кожного облікового запису розміщені в `channels.discord.accounts.<id>.thread.inheritParent`.
    - Реакції інструмента повідомлень можуть визначати цілі приватних повідомлень `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` зберігається під час резервної активації на етапі відповіді.

    Теми каналів вбудовуються як **недовірений** контекст. Allowlist визначають, хто може запускати агента, а не є повноцінною межею редагування додаткового контексту.

  </Accordion>

  <Accordion title="Прив’язані до тредів сесії для субагентів">
    Discord може прив’язати тред до цілі сесії, щоб наступні повідомлення в цьому треді продовжували маршрутизуватися до тієї самої сесії (включно із сесіями субагентів).

    Команди:

    - `/focus <target>` прив’язати поточний/новий тред до цілі субагента/сесії
    - `/unfocus` видалити поточну прив’язку треду
    - `/agents` показати активні запуски й стан прив’язки
    - `/session idle <duration|off>` переглянути/оновити автоматичне зняття фокуса через неактивність для прив’язаних фокусованих сесій
    - `/session max-age <duration|off>` переглянути/оновити жорсткий максимальний вік для прив’язаних фокусованих сесій

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

    - `session.threadBindings.*` задає глобальні значення за замовчуванням.
    - `channels.discord.threadBindings.*` перевизначає поведінку Discord.
    - `spawnSubagentSessions` має бути true, щоб автоматично створювати/прив’язувати треди для `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` має бути true, щоб автоматично створювати/прив’язувати треди для ACP (`/acp spawn ... --thread ...` або `sessions_spawn({ runtime: "acp", thread: true })`).
    - Якщо прив’язки тредів вимкнені для облікового запису, `/focus` і пов’язані операції прив’язки тредів недоступні.

    Див. [Субагенти](/uk/tools/subagents), [ACP Agents](/uk/tools/acp-agents) і [Довідник із конфігурації](/uk/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Постійні прив’язки каналів ACP">
    Для стабільних ACP-робочих просторів "always-on" налаштуйте типізовані ACP-прив’язки верхнього рівня, націлені на розмови Discord.

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

    - `/acp spawn codex --bind here` прив’язує поточний канал або тред на місці й зберігає майбутні повідомлення в тій самій сесії ACP. Повідомлення треду успадковують прив’язку батьківського каналу.
    - У прив’язаному каналі або треді `/new` і `/reset` скидають ту саму сесію ACP на місці. Тимчасові прив’язки тредів можуть перевизначати визначення цілі, поки вони активні.
    - `spawnAcpSessions` потрібен лише тоді, коли OpenClaw має створити/прив’язати дочірній тред через `--thread auto|here`.

    Див. [ACP Agents](/uk/tools/acp-agents), щоб переглянути деталі поведінки прив’язок.

  </Accordion>

  <Accordion title="Сповіщення про реакції">
    Режим сповіщень про реакції для кожної гільдії:

    - `off`
    - `own` (за замовчуванням)
    - `all`
    - `allowlist` (використовує `guilds.<id>.users`)

    Події реакцій перетворюються на системні події й приєднуються до маршрутизованої сесії Discord.

  </Accordion>

  <Accordion title="Реакції-підтвердження">
    `ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

    Порядок визначення:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - резервне значення емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

    Примітки:

    - Discord приймає Unicode-емодзі або назви користувацьких емодзі.
    - Використовуйте `""`, щоб вимкнути реакцію для каналу або облікового запису.

  </Accordion>

  <Accordion title="Записи конфігурації">
    Записи конфігурації, ініційовані з каналу, увімкнені за замовчуванням.

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
    Маршрутизуйте трафік WebSocket Discord gateway і стартові REST-запити (ID застосунку + визначення allowlist) через HTTP(S)-проксі за допомогою `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Перевизначення для кожного облікового запису:

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

    - allowlist можуть використовувати `pk:<memberId>`
    - відображувані імена учасників зіставляються за іменем/slug лише коли `channels.discord.dangerouslyAllowNameMatching: true`
    - пошук використовує ID початкового повідомлення й обмежується часовим вікном
    - якщо пошук не вдається, проксійовані повідомлення вважаються повідомленнями бота й відкидаються, якщо тільки `allowBots=true`

  </Accordion>

  <Accordion title="Конфігурація присутності">
    Оновлення присутності застосовуються, коли ви задаєте поле статусу або активності, або коли вмикаєте автоматичну присутність.

    Приклад лише статусу:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Приклад активності (користувацький статус — тип активності за замовчуванням):

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

    Відповідність типів активності:

    - 0: Playing
    - 1: Streaming (потрібен `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (використовує текст активності як стан статусу; емодзі необов’язкове)
    - 5: Competing

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

    Автоматична присутність відображає доступність runtime у статус Discord: healthy => online, degraded або unknown => idle, exhausted або unavailable => dnd. Необов’язкові перевизначення тексту:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (підтримує заповнювач `{reason}`)

  </Accordion>

  <Accordion title="Погодження в Discord">
    Discord підтримує обробку погоджень за допомогою кнопок у приватних повідомленнях і за бажанням може публікувати запити на погодження у вихідному каналі.

    Шлях конфігурації:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (необов’язково; за можливості використовується резервне значення `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord автоматично вмикає нативні погодження exec, коли `enabled` не задано або дорівнює `"auto"` і принаймні одного затверджувача можна визначити або з `execApprovals.approvers`, або з `commands.ownerAllowFrom`. Discord не виводить затверджувачів exec із `allowFrom` каналу, застарілого `dm.allowFrom` або `defaultTo` прямих повідомлень. Задайте `enabled: false`, щоб явно вимкнути Discord як нативний клієнт погодження.

    Коли `target` має значення `channel` або `both`, запит на погодження видимий у каналі. Використовувати кнопки можуть лише визначені затверджувачі; інші користувачі отримують ефемерну відмову. Запити на погодження містять текст команди, тому вмикайте доставку в канал лише в довірених каналах. Якщо ID каналу не можна визначити з ключа сесії, OpenClaw повертається до доставки в приватні повідомлення.

    Discord також відображає спільні кнопки погодження, які використовуються іншими чат-каналами. Нативний адаптер Discord головним чином додає маршрутизацію погоджень у приватні повідомлення затверджувачів і fanout у канал.
    Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
    має включати ручну команду `/approve` лише тоді, коли результат інструмента каже,
    що погодження в чаті недоступні або ручне погодження є єдиним шляхом.

    Автентифікація Gateway і визначення погоджень дотримуються спільного контракту клієнта Gateway (`plugin:` ID визначаються через `plugin.approval.resolve`; інші ID — через `exec.approval.resolve`). Термін дії погоджень за замовчуванням спливає через 30 хвилин.

    Див. [Exec approvals](/uk/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Інструменти та шлюзи дій

Дії повідомлень Discord включають обмін повідомленнями, адміністрування каналів, модерацію, присутність і дії з метаданими.

Основні приклади:

- обмін повідомленнями: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- реакції: `react`, `reactions`, `emojiList`
- модерація: `timeout`, `kick`, `ban`
- присутність: `setPresence`

Дія `event-create` приймає необов’язковий параметр `image` (URL або шлях до локального файла), щоб задати обкладинку запланованої події.

Шлюзи дій розміщені в `channels.discord.actions.*`.

Поведінка шлюзів за замовчуванням:

| Action group                                                                                                                                                             | Default  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## UI компонентів v2

OpenClaw використовує компоненти Discord v2 для exec approvals і маркерів між контекстами. Дії повідомлень Discord також можуть приймати `components` для користувацького UI (розширено; потребує побудови payload компонента через інструмент discord), тоді як застарілі `embeds` усе ще доступні, але не рекомендовані.

- `channels.discord.ui.components.accentColor` задає акцентний колір, який використовується контейнерами компонентів Discord (hex).
- Задайте для кожного облікового запису через `channels.discord.accounts.<id>.ui.components.accentColor`.
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

У Discord є дві окремі голосові поверхні: голосові канали **voice channels** у реальному часі (безперервні розмови) і вкладення **voice message attachments** (формат попереднього перегляду хвильової форми). Gateway підтримує обидва варіанти.

### Голосові канали

Контрольний список налаштування:

1. Увімкніть Message Content Intent у Discord Developer Portal.
2. Увімкніть Server Members Intent, якщо використовуються allowlist ролей/користувачів.
3. Запросіть бота з областями `bot` і `applications.commands`.
4. Надайте дозволи Connect, Speak, Send Messages і Read Message History у цільовому голосовому каналі.
5. Увімкніть нативні команди (`commands.native` або `channels.discord.commands.native`).
6. Налаштуйте `channels.discord.voice`.

Використовуйте `/vc join|leave|status` для керування сесіями. Команда використовує агента облікового запису за замовчуванням і дотримується тих самих правил allowlist і group policy, що й інші команди Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Приклад автоматичного підключення:

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
- `voice.model` перевизначає LLM, що використовується лише для відповідей у голосових каналах Discord. Залиште незаданим, щоб успадкувати модель маршрутизованого агента.
- STT використовує `tools.media.audio`; `voice.model` не впливає на транскрибування.
- Ходи голосової стенограми визначають статус власника з Discord `allowFrom` (або `dm.allowFrom`); мовці, які не є власниками, не можуть отримувати доступ до інструментів лише для власника (наприклад, `gateway` і `cron`).
- Голос увімкнено за замовчуванням; задайте `channels.discord.voice.enabled=false`, щоб вимкнути його.
- `voice.daveEncryption` і `voice.decryptionFailureTolerance` напряму передаються в параметри підключення `@discordjs/voice`.
- Значення `@discordjs/voice` за замовчуванням — `daveEncryption=true` і `decryptionFailureTolerance=24`, якщо їх не задано.
- OpenClaw також відстежує збої дешифрування під час приймання й автоматично відновлюється, виходячи з голосового каналу та знову підключаючись після повторних збоїв за короткий проміжок часу.
- Якщо після оновлення журнали приймання неодноразово показують `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, зберіть звіт про залежності та журнали. Включена лінійка `@discordjs/voice` містить upstream-виправлення padding із discord.js PR #11449, яке закрило проблему discord.js issue #11419.

Конвеєр голосових каналів:

- Захоплений Discord PCM перетворюється на тимчасовий WAV-файл.
- `tools.media.audio` обробляє STT, наприклад `openai/gpt-4o-mini-transcribe`.
- Транскрипт надсилається через звичайний вхідний потік і маршрутизацію Discord.
- `voice.model`, якщо задано, перевизначає лише LLM відповіді для цього ходу голосового каналу.
- `voice.tts` об’єднується поверх `messages.tts`; отримане аудіо відтворюється в підключеному каналі.

Облікові дані визначаються для кожного компонента окремо: автентифікація маршруту LLM для `voice.model`, автентифікація STT для `tools.media.audio` та автентифікація TTS для `messages.tts`/`voice.tts`.

### Голосові повідомлення

Голосові повідомлення Discord показують попередній перегляд хвильової форми та потребують аудіо OGG/Opus. OpenClaw генерує хвильову форму автоматично, але потребує `ffmpeg` і `ffprobe` на хості gateway для перевірки й конвертації.

- Вкажіть **шлях до локального файла** (URL відхиляються).
- Не додавайте текстовий вміст (Discord відхиляє текст + голосове повідомлення в одному payload).
- Приймається будь-який аудіоформат; OpenClaw за потреби конвертує його в OGG/Opus.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Усунення проблем

<AccordionGroup>
  <Accordion title="Використано заборонені інтенти або бот не бачить повідомлень гільдії">

    - увімкніть Message Content Intent
    - увімкніть Server Members Intent, коли ви залежите від визначення користувача/учасника
    - перезапустіть gateway після зміни інтенцій

  </Accordion>

  <Accordion title="Повідомлення гільдії неочікувано блокуються">

    - перевірте `groupPolicy`
    - перевірте allowlist гільдій у `channels.discord.guilds`
    - якщо існує мапа `channels` гільдії, дозволені лише перелічені канали
    - перевірте поведінку `requireMention` і шаблони згадок

    Корисні перевірки:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false, але все одно блокується">
    Поширені причини:

    - `groupPolicy="allowlist"` без відповідної allowlist гільдії/каналу
    - `requireMention` налаштовано в неправильному місці (має бути в `channels.discord.guilds` або в записі каналу)
    - відправника заблоковано allowlist `users` гільдії/каналу

  </Accordion>

  <Accordion title="Довготривалі обробники завершуються за тайм-аутом або дублюють відповіді">

    Типові журнали:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Параметр бюджету listener:

    - один обліковий запис: `channels.discord.eventQueue.listenerTimeout`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Параметр тайм-ауту виконання worker:

    - один обліковий запис: `channels.discord.inboundWorker.runTimeoutMs`
    - кілька облікових записів: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - за замовчуванням: `1800000` (30 хвилин); задайте `0`, щоб вимкнути

    Рекомендована базова конфігурація:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Використовуйте `eventQueue.listenerTimeout` для повільного налаштування listener, а `inboundWorker.runTimeoutMs`
    лише якщо вам потрібен окремий запобіжник для агентських ходів у черзі.

  </Accordion>

  <Accordion title="Невідповідності аудиту дозволів">
    Перевірки дозволів `channels status --probe` працюють лише для числових ID каналів.

    Якщо ви використовуєте ключі slug, зіставлення під час виконання все одно може працювати, але probe не може повністю перевірити дозволи.

  </Accordion>

  <Accordion title="Проблеми з приватними повідомленнями та зіставленням">

    - приватні повідомлення вимкнені: `channels.discord.dm.enabled=false`
    - політика приватних повідомлень вимкнена: `channels.discord.dmPolicy="disabled"` (застаріле: `channels.discord.dm.policy`)
    - очікується підтвердження зіставлення в режимі `pairing`

  </Accordion>

  <Accordion title="Цикли бот-до-бота">
    За замовчуванням повідомлення, створені ботом, ігноруються.

    Якщо ви задаєте `channels.discord.allowBots=true`, використовуйте суворі правила згадок і allowlist, щоб уникнути циклічної поведінки.
    Надавайте перевагу `channels.discord.allowBots="mentions"`, щоб приймати лише повідомлення ботів, які згадують бота.

  </Accordion>

  <Accordion title="Голосовий STT пропускає дані з DecryptionFailed(...)">

    - підтримуйте OpenClaw в актуальному стані (`openclaw update`), щоб логіка відновлення приймання Discord voice була присутня
    - підтвердьте, що `channels.discord.voice.daveEncryption=true` (за замовчуванням)
    - починайте з `channels.discord.voice.decryptionFailureTolerance=24` (upstream-значення за замовчуванням) і налаштовуйте лише за потреби
    - стежте за журналами:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - якщо збої тривають після автоматичного повторного підключення, зберіть журнали й порівняйте з upstream-історією приймання DAVE у [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) і [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Довідник із конфігурації

Основний довідник: [Configuration reference - Discord](/uk/gateway/config-channels#discord).

<Accordion title="Високосигнальні поля Discord">

- запуск/автентифікація: `enabled`, `token`, `accounts.*`, `allowBots`
- політика: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- команди: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- черга подій: `eventQueue.listenerTimeout` (бюджет listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- відповідь/історія: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- потокове передавання: `streaming` (застарілий псевдонім: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- медіа/повторні спроби: `mediaMaxMb` (обмежує вихідні завантаження Discord, за замовчуванням `100MB`), `retry`
- дії: `actions.*`
- присутність: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- функції: `threadBindings`, верхньорівневий `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Безпека та операції

- Розглядайте токени бота як секрети (`DISCORD_BOT_TOKEN` є кращим варіантом у контрольованих середовищах).
- Надавайте Discord дозволи за принципом найменших привілеїв.
- Якщо стан розгортання/стан команд застарів, перезапустіть gateway і повторно перевірте через `openclaw channels status --probe`.

## Пов’язані теми

<CardGroup cols={2}>
  <Card title="Зіставлення" icon="link" href="/uk/channels/pairing">
    Зіставте користувача Discord із gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групового чату та allowlist.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Маршрутизація між кількома агентами" icon="sitemap" href="/uk/concepts/multi-agent">
    Зіставляйте гільдії та канали з агентами.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд.
  </Card>
</CardGroup>
