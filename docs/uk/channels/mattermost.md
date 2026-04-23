---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T20:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

Статус: bundled plugin (токен бота + події WebSocket). Підтримуються канали, групи та DM.
Mattermost — це платформа командного обміну повідомленнями, яку можна самостійно розгорнути; офіційний сайт із подробицями про продукт і завантаженнями:
[mattermost.com](https://mattermost.com).

## Bundled plugin

Mattermost постачається як bundled plugin у поточних випусках OpenClaw, тому звичайні
зібрані пакети не потребують окремого встановлення.

Якщо у вас старіша збірка або нетипове встановлення без Mattermost,
встановіть його вручну:

Установлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що Plugin Mattermost доступний.
   - Поточні пакетні випуски OpenClaw уже містять його в комплекті.
   - У старіших/нетипових встановленнях його можна додати вручну командами вище.
2. Створіть обліковий запис бота Mattermost і скопіюйте **токен бота**.
3. Скопіюйте **базовий URL** Mattermost (наприклад, `https://chat.example.com`).
4. Налаштуйте OpenClaw і запустіть Gateway.

Мінімальна конфігурація:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Вбудовані slash-команди

Вбудовані slash-команди є опціональними. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через
API Mattermost і отримує callback POST-запити на HTTP-сервері Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Використовуйте, коли Mattermost не може напряму звернутися до Gateway (reverse proxy/публічний URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Примітки:

- `native: "auto"` типово вимкнено для Mattermost. Щоб увімкнути, встановіть `native: true`.
- Якщо `callbackUrl` не вказано, OpenClaw виводить його з host/port Gateway + `callbackPath`.
- Для конфігурацій із кількома обліковими записами `commands` можна задавати на верхньому рівні або під
  `channels.mattermost.accounts.<id>.commands` (значення облікового запису перевизначають поля верхнього рівня).
- Command callback перевіряються за токенами окремих команд, які повертає
  Mattermost, коли OpenClaw реєструє команди `oc_*`.
- Slash callback працюють у режимі fail closed, якщо реєстрація не вдалася, запуск був частковим або
  токен callback не збігається з жодною із зареєстрованих команд.
- Вимога доступності: endpoint callback має бути доступним із сервера Mattermost.
  - Не встановлюйте `callbackUrl` у `localhost`, якщо Mattermost не працює на тому самому host/network namespace, що й OpenClaw.
  - Не встановлюйте `callbackUrl` у базовий URL вашого Mattermost, якщо цей URL не проксіює `/api/channels/mattermost/command` до OpenClaw через reverse proxy.
  - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET-запит має повертати `405 Method Not Allowed` від OpenClaw, а не `404`.
- Вимога allowlist вихідних з’єднань Mattermost:
  - Якщо ваш callback націлений на приватні/tailnet/internal адреси, налаштуйте Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, щоб він містив host/domain callback.
  - Використовуйте записи host/domain, а не повні URL.
    - Правильно: `gateway.tailnet-name.ts.net`
    - Неправильно: `https://gateway.tailnet-name.ts.net`

## Змінні середовища (типовий обліковий запис)

Установіть їх на host Gateway, якщо віддаєте перевагу env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Env vars застосовуються лише до **типового** облікового запису (`default`). Для інших облікових записів потрібно використовувати значення конфігурації.

`MATTERMOST_URL` не можна задати з робочого простору `.env`; див. [Workspace `.env` files](/uk/gateway/security).

## Режими чату

Mattermost автоматично відповідає на DM. Поведінка в каналах керується `chatmode`:

- `oncall` (типово): відповідати в каналах лише при @згадці.
- `onmessage`: відповідати на кожне повідомлення в каналі.
- `onchar`: відповідати, коли повідомлення починається з trigger prefix.

Приклад конфігурації:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Примітки:

- `onchar` усе одно відповідає на явні @згадки.
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але переважно слід використовувати `chatmode`.

## Гілки та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в
основному каналі, чи починають гілку під постом, що їх викликав.

- `off` (типово): відповідати в гілці лише тоді, коли вхідний пост уже перебуває в ній.
- `first`: для повідомлень верхнього рівня в каналі/групі почати гілку під цим постом і спрямувати
  розмову до сесії з областю дії цієї гілки.
- `all`: наразі для Mattermost поводиться так само, як `first`.
- Прямі повідомлення ігнорують це налаштування й залишаються без гілок.

Приклад конфігурації:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Примітки:

- Сесії з областю дії гілки використовують id поста, що спрацював, як корінь гілки.
- `first` і `all` наразі еквівалентні, оскільки щойно Mattermost має корінь гілки,
  подальші фрагменти й медіа продовжуються в тій самій гілці.

## Керування доступом (DM)

- Типово: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код спарювання).
- Схвалення через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні DM: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- Типово: `channels.mattermost.groupPolicy = "allowlist"` (із перевіркою згадки).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендуються ID користувачів).
- Перевизначення згадки для окремих каналів задаються в `channels.mattermost.groups.<channelId>.requireMention`
  або `channels.mattermost.groups["*"].requireMention` як типове значення.
- Відповідність `@username` є змінною та ввімкнена лише коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із перевіркою згадки).
- Примітка щодо runtime: якщо `channels.mattermost` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

Приклад:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Цілі для вихідної доставки

Використовуйте ці формати цілей із `openclaw message send` або cron/webhooks:

- `channel:<id>` для каналу
- `user:<id>` для DM
- `@username` для DM (визначається через API Mattermost)

Звичайні непрозорі ID (наприклад `64ifufp...`) у Mattermost є **неоднозначними** (ID користувача чи ID каналу).

OpenClaw визначає їх у порядку **спочатку користувач**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` виконується успішно), OpenClaw надсилає **DM**, визначаючи direct channel через `/api/v4/channels/direct`.
- Інакше ID вважається **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).

## Повторні спроби для DM-каналу

Коли OpenClaw надсилає в ціль DM Mattermost і спочатку має визначити direct channel,
він типово повторює транзитні збої створення direct channel.

Використовуйте `channels.mattermost.dmChannelRetry`, щоб налаштувати цю поведінку глобально для Plugin Mattermost,
або `channels.mattermost.accounts.<id>.dmChannelRetry` для окремого облікового запису.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Примітки:

- Це застосовується лише до створення DM-каналу (`/api/v4/channels/direct`), а не до кожного виклику API Mattermost.
- Повторні спроби застосовуються до транзитних збоїв, як-от обмеження швидкості, відповіді 5xx, а також помилки мережі чи тайм-ауту.
- Клієнтські помилки 4xx, окрім `429`, вважаються постійними й не повторюються.

## Попередній перегляд Streaming

Mattermost передає міркування, активність інструментів і частковий текст відповіді в один **чернетковий пост попереднього перегляду**, який фіналізується на місці, коли фінальну відповідь безпечно надсилати. Попередній перегляд оновлюється в межах того самого id поста замість засмічення каналу повідомленнями для кожного фрагмента. Фінальні медіа/помилки скасовують відкладені редагування попереднього перегляду й використовують звичайну доставку замість вивантаження тимчасового поста попереднього перегляду.

Увімкнення через `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Примітки:

- `partial` — звичний вибір: один пост попереднього перегляду, який редагується в міру зростання відповіді, а потім фіналізується повною відповіддю.
- `block` використовує чернеткові фрагменти у стилі append всередині поста попереднього перегляду.
- `progress` показує попередній перегляд статусу під час генерування й публікує фінальну відповідь лише після завершення.
- `off` вимикає попередній перегляд Streaming.
- Якщо потік неможливо фіналізувати на місці (наприклад, пост було видалено під час потоку), OpenClaw повертається до надсилання нового фінального поста, щоб відповідь ніколи не була втрачена.
- Дані лише з міркуваннями не потрапляють до постів у каналі, зокрема текст, що надходить як blockquote `> Reasoning:`. Установіть `/reasoning on`, щоб бачити міркування в інших поверхнях; фінальний пост Mattermost містить лише відповідь.
- Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці відповідності каналів.

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id поста Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (boolean), щоб прибрати реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до маршрутизованої сесії агента.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнути/вимкнути дії реакцій (типово true).
- Перевизначення для облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

## Інтерактивні кнопки (інструмент повідомлень)

Надсилайте повідомлення з кнопками, на які можна натискати. Коли користувач натискає кнопку, агент отримує
вибір і може відповісти.

Увімкніть кнопки, додавши `inlineButtons` до можливостей каналу:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Використовуйте `message action=send` із параметром `buttons`. Кнопки — це двовимірний масив (ряди кнопок):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Поля кнопок:

- `text` (обов’язково): мітка для показу.
- `callback_data` (обов’язково): значення, що повертається при натисканні (використовується як ID дії).
- `style` (необов’язково): `"default"`, `"primary"` або `"danger"`.

Коли користувач натискає кнопку:

1. Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
2. Агент отримує вибір як вхідне повідомлення та відповідає.

Примітки:

- Button callback використовують перевірку HMAC-SHA256 (автоматично, без додаткової конфігурації).
- Mattermost прибирає callback data зі своїх відповідей API (функція безпеки), тому всі кнопки
  видаляються при натисканні — часткове видалення неможливе.
- ID дій, що містять дефіси або підкреслення, автоматично санітизуються
  (обмеження маршрутизації Mattermost).

Конфігурація:

- `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб
  увімкнути опис інструмента кнопок у системному запиті агента.
- `channels.mattermost.interactions.callbackBaseUrl`: необов’язковий зовнішній базовий URL для
  callback кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може
  напряму звернутися до Gateway за його bind host.
- У конфігураціях із кількома обліковими записами те саме поле також можна задати в
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Якщо `interactions.callbackBaseUrl` не вказано, OpenClaw виводить URL callback із
  `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
- Правило доступності: URL callback кнопок має бути доступним із сервера Mattermost.
  `localhost` працює лише тоді, коли Mattermost і OpenClaw запущені на тому самому host/network namespace.
- Якщо ваша ціль callback є приватною/tailnet/internal, додайте її host/domain до Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти та Webhook можуть напряму публікувати кнопки через REST API Mattermost
замість використання інструмента `message` агента. Використовуйте `buildButtonAttachments()` із
Plugin, коли це можливо; якщо надсилаєте необроблений JSON, дотримуйтеся таких правил:

**Структура payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // лише буквено-цифрові символи — див. нижче
            type: "button", // обов’язково, інакше натискання тихо ігноруються
            name: "Approve", // мітка для показу
            style: "primary", // необов’язково: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // має збігатися з id кнопки (для пошуку назви)
                action: "approve",
                // ... будь-які власні поля ...
                _token: "<hmac>", // див. розділ HMAC нижче
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Критично важливі правила:**

1. Attachments розміщуються в `props.attachments`, а не в top-level `attachments` (інакше тихо ігноруються).
2. Для кожної дії потрібне `type: "button"` — без цього натискання тихо поглинаються.
3. Для кожної дії потрібне поле `id` — Mattermost ігнорує дії без ID.
4. `id` дії має містити **лише буквено-цифрові символи** (`[a-zA-Z0-9]`). Дефіси й підкреслення ламають
   серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження показувалася
   назва кнопки (наприклад, "Approve"), а не необроблений ID.
6. `context.action_id` є обов’язковим — без нього обробник взаємодії повертає 400.

**Генерування токена HMAC:**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени,
які відповідають логіці перевірки Gateway:

1. Виведіть секрет із токена бота:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Побудуйте об’єкт context з усіма полями **крім** `_token`.
3. Серіалізуйте з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify`
   з відсортованими ключами, що дає компактний вивід).
4. Підпишіть: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Додайте отриманий hex digest як `_token` у context.

Приклад на Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Поширені помилки з HMAC:

- `json.dumps` у Python типово додає пробіли (`{"key": "val"}`). Використовуйте
  `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
- Завжди підписуйте **всі** поля context (крім `_token`). Gateway видаляє `_token`, а потім
  підписує все, що лишається. Підписування лише підмножини призводить до тихого збою перевірки.
- Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, і Mattermost може
  змінювати порядок полів context під час зберігання payload.
- Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет
  має бути однаковим у процесі, який створює кнопки, і в Gateway, який їх перевіряє.

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який визначає назви каналів і користувачів
через API Mattermost. Це дає змогу використовувати цілі `#channel-name` і `@username` у
`openclaw message send` і доставці через cron/Webhook.

Налаштування не потрібне — адаптер використовує токен бота з конфігурації облікового запису.

## Кілька облікових записів

Mattermost підтримує кілька облікових записів у `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Усунення несправностей

- Немає відповідей у каналах: переконайтеся, що бот є в каналі та його згадують (oncall), використовуйте trigger prefix (onchar) або встановіть `chatmode: "onmessage"`.
- Помилки автентифікації: перевірте токен бота, базовий URL і чи ввімкнено обліковий запис.
- Проблеми з кількома обліковими записами: env vars застосовуються лише до облікового запису `default`.
- Вбудовані slash-команди повертають `Unauthorized: invalid command token.`: OpenClaw
  не прийняв токен callback. Типові причини:
  - реєстрація slash-команд не вдалася або була завершена лише частково під час запуску
  - callback потрапляє не до того Gateway/облікового запису
  - Mattermost усе ще має старі команди, що вказують на попередню ціль callback
  - Gateway перезапустився без повторної активації slash-команд
- Якщо вбудовані slash-команди перестали працювати, перевірте журнали на наявність
  `mattermost: failed to register slash commands` або
  `mattermost: native slash commands enabled but no commands could be registered`.
- Якщо `callbackUrl` не вказано, а журнали попереджають, що callback було визначено як
  `http://127.0.0.1:18789/...`, цей URL, імовірно, доступний лише тоді,
  коли Mattermost працює на тому самому host/network namespace, що й OpenClaw. Замість цього задайте
  явний зовнішньо доступний `commands.callbackUrl`.
- Кнопки відображаються як білі прямокутники: агент може надсилати некоректні дані кнопок. Переконайтеся, що кожна кнопка має поля `text` і `callback_data`.
- Кнопки відображаються, але натискання нічого не роблять: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, і що `EnablePostActionIntegration` має значення `true` у ServiceSettings.
- Кнопки повертають 404 при натисканні: `id` кнопки, імовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на небуквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
- Gateway журналює `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля context (а не лише підмножину), використовуєте відсортовані ключі й компактний JSON (без пробілів). Див. розділ HMAC вище.
- Gateway журналює `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що його включено під час побудови payload integration.
- У підтвердженні показується необроблений ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Установіть обидва значення однаковими й санітизованими.
- Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спарювання](/uk/channels/pairing) — автентифікація DM і процес спарювання
- [Групи](/uk/channels/groups) — поведінка групових чатів і керування через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
