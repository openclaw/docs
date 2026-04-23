---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T07:25:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Статус: вбудований plugin (токен бота + події WebSocket). Підтримуються канали, групи та особисті повідомлення.
Mattermost — це платформа командного обміну повідомленнями з можливістю самостійного хостингу; подробиці про продукт і завантаження дивіться на офіційному сайті
[mattermost.com](https://mattermost.com).

## Вбудований plugin

Mattermost постачається як вбудований plugin у поточних релізах OpenClaw, тому звичайним
пакетним збіркам не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або спеціальне встановлення без Mattermost,
встановіть його вручну:

Встановлення через CLI (реєстр npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Подробиці: [Plugins](/uk/tools/plugin)

## Швидке налаштування

1. Переконайтеся, що plugin Mattermost доступний.
   - У поточних пакетних релізах OpenClaw він уже вбудований.
   - У старіших/спеціальних встановленнях його можна додати вручну за допомогою наведених вище команд.
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

## Нативні slash-команди

Нативні slash-команди вмикаються за бажанням. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через
Mattermost API і отримує callback POST-запити на HTTP-сервері Gateway.

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

- `native: "auto"` за замовчуванням вимкнено для Mattermost. Щоб увімкнути, задайте `native: true`.
- Якщо `callbackUrl` пропущено, OpenClaw виводить його з host/port Gateway + `callbackPath`.
- Для конфігурацій із кількома обліковими записами `commands` можна задати на верхньому рівні або в
  `channels.mattermost.accounts.<id>.commands` (значення облікового запису мають пріоритет над полями верхнього рівня).
- Callback-и команд перевіряються за допомогою токенів для кожної команди, які повертає
  Mattermost, коли OpenClaw реєструє команди `oc_*`.
- Callback-и slash-команд завершуються відмовою за замовчуванням, якщо реєстрація не вдалася, запуск був частковим або
  токен callback не збігається з жодною із зареєстрованих команд.
- Вимога доступності: endpoint callback має бути доступний із сервера Mattermost.
  - Не задавайте `callbackUrl` як `localhost`, якщо Mattermost не працює на тому самому хості/в тому самому network namespace, що й OpenClaw.
  - Не задавайте `callbackUrl` як базовий URL вашого Mattermost, якщо цей URL не проксіює через reverse proxy `/api/channels/mattermost/command` до OpenClaw.
  - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повертати `405 Method Not Allowed` від OpenClaw, а не `404`.
- Вимога allowlist вихідних з’єднань Mattermost:
  - Якщо ваш callback спрямований на приватні/tailnet/внутрішні адреси, задайте в Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити host/domain callback.
  - Використовуйте записи host/domain, а не повні URL.
    - Правильно: `gateway.tailnet-name.ts.net`
    - Неправильно: `https://gateway.tailnet-name.ts.net`

## Змінні середовища (обліковий запис за замовчуванням)

Задайте їх на хості Gateway, якщо вам зручніше використовувати env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Env vars застосовуються лише до **default** облікового запису (`default`). Для інших облікових записів потрібно використовувати значення з конфігурації.

`MATTERMOST_URL` не можна задавати з workspace `.env`; див. [Workspace `.env` files](/uk/gateway/security).

## Режими чату

Mattermost автоматично відповідає на особисті повідомлення. Поведінка в каналах керується через `chatmode`:

- `oncall` (за замовчуванням): відповідати лише при @згадуванні в каналах.
- `onmessage`: відповідати на кожне повідомлення в каналі.
- `onchar`: відповідати, коли повідомлення починається з префікса-тригера.

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

- `onchar` усе одно відповідає на явні @згадування.
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але краще використовувати `chatmode`.

## Потоки та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в
основному каналі, чи починають потік під постом, який їх спричинив.

- `off` (за замовчуванням): відповідати в потоці лише тоді, коли вхідний пост уже знаходиться в ньому.
- `first`: для повідомлень верхнього рівня в каналі/групі створювати потік під цим постом і маршрутизувати
  розмову до сесії, прив’язаної до потоку.
- `all`: наразі для Mattermost має ту саму поведінку, що й `first`.
- Особисті повідомлення ігнорують цей параметр і залишаються без потоків.

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

- Сесії, прив’язані до потоку, використовують id поста-тригера як корінь потоку.
- `first` і `all` наразі еквівалентні, оскільки щойно Mattermost має корінь потоку,
  подальші фрагменти та медіа продовжуються в тому самому потоці.

## Контроль доступу (особисті повідомлення)

- За замовчуванням: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Підтвердження через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні особисті повідомлення: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- За замовчуванням: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадування).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендовано використовувати ID користувачів).
- Перевизначення згадування для окремих каналів розміщуються в `channels.mattermost.groups.<channelId>.requireMention`
  або в `channels.mattermost.groups["*"].requireMention` як типове значення.
- Відповідність `@username` є змінною і вмикається лише за `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із вимогою згадування).
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

Використовуйте ці формати цілей із `openclaw message send` або Cron/Webhook-ами:

- `channel:<id>` для каналу
- `user:<id>` для особистого повідомлення
- `@username` для особистого повідомлення (визначається через Mattermost API)

Голі непрозорі ID (наприклад `64ifufp...`) у Mattermost є **неоднозначними** (ID користувача чи ID каналу).

OpenClaw визначає їх у порядку **спочатку користувач**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` виконується успішно), OpenClaw надсилає **особисте повідомлення**, визначаючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID вважається **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).

## Повторні спроби для DM-каналу

Коли OpenClaw надсилає в ціль особистого повідомлення Mattermost і спочатку має визначити прямий канал, він
за замовчуванням повторює спроби при тимчасових збоях створення прямого каналу.

Використовуйте `channels.mattermost.dmChannelRetry`, щоб налаштувати цю поведінку глобально для plugin Mattermost,
або `channels.mattermost.accounts.<id>.dmChannelRetry` для одного облікового запису.

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

- Це застосовується лише до створення DM-каналу (`/api/v4/channels/direct`), а не до кожного виклику Mattermost API.
- Повторні спроби застосовуються до тимчасових збоїв, таких як обмеження швидкості, відповіді 5xx, а також помилки мережі чи timeout.
- Клієнтські помилки 4xx, окрім `429`, вважаються постійними й не повторюються.

## Потокове попереднє відображення

Mattermost передає thinking, активність інструментів і частковий текст відповіді в один **чернетковий пост попереднього перегляду**, який фіналізується на місці, коли фінальну відповідь безпечно надсилати. Попередній перегляд оновлюється в тому самому id поста замість засмічення каналу повідомленнями для кожного фрагмента. Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду й використовують звичайну доставку замість надсилання тимчасового поста попереднього перегляду.

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

- `partial` — звичайний вибір: один пост попереднього перегляду, який редагується в міру зростання відповіді, а потім фіналізується повною відповіддю.
- `block` використовує фрагменти чернетки у стилі додавання всередині поста попереднього перегляду.
- `progress` показує попередній перегляд статусу під час генерації й публікує фінальну відповідь лише після завершення.
- `off` вимикає потокове попереднє відображення.
- Якщо потік не можна фіналізувати на місці (наприклад, пост було видалено посеред потоку), OpenClaw повертається до надсилання нового фінального поста, щоб відповідь ніколи не була втрачена.
- Payload-дані лише з reasoning приховуються з постів каналу, включно з текстом, який надходить як blockquote `> Reasoning:`. Задайте `/reasoning on`, щоб бачити thinking на інших поверхнях; фінальний пост Mattermost містить лише відповідь.
- Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці зіставлення каналів.

## Реакції (інструмент message)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id поста Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Задайте `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до сесії агента, визначеної маршрутизацією.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнення/вимкнення дій із реакціями (за замовчуванням true).
- Перевизначення для окремого облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

## Інтерактивні кнопки (інструмент message)

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

Використовуйте `message action=send` з параметром `buttons`. Кнопки — це двовимірний масив (ряди кнопок):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Поля кнопки:

- `text` (обов’язково): мітка для відображення.
- `callback_data` (обов’язково): значення, яке надсилається назад при натисканні (використовується як ID дії).
- `style` (необов’язково): `"default"`, `"primary"` або `"danger"`.

Коли користувач натискає кнопку:

1. Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
2. Агент отримує вибір як вхідне повідомлення і відповідає.

Примітки:

- Callback-и кнопок використовують перевірку HMAC-SHA256 (автоматично, конфігурація не потрібна).
- Mattermost видаляє callback data зі своїх відповідей API (функція безпеки), тому при натисканні
  видаляються всі кнопки — часткове видалення неможливе.
- ID дій, що містять дефіси або підкреслення, автоматично очищуються
  (обмеження маршрутизації Mattermost).

Конфігурація:

- `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб
  увімкнути опис інструмента кнопок у системному prompt агента.
- `channels.mattermost.interactions.callbackBaseUrl`: необов’язковий зовнішній базовий URL для
  callback-ів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може
  напряму звернутися до Gateway за його bind host.
- У конфігураціях із кількома обліковими записами це саме поле також можна задати в
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw виводить URL callback з
  `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
- Правило доступності: URL callback кнопок має бути доступний із сервера Mattermost.
  `localhost` працює лише тоді, коли Mattermost і OpenClaw працюють на одному хості/в тому самому network namespace.
- Якщо ваша ціль callback є приватною/tailnet/внутрішньою, додайте її host/domain до Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Пряма інтеграція з API (зовнішні скрипти)

Зовнішні скрипти та Webhook-и можуть публікувати кнопки напряму через REST API Mattermost
замість використання інструмента `message` агента. Використовуйте `buildButtonAttachments()` із
plugin, коли це можливо; якщо надсилаєте необроблений JSON, дотримуйтеся цих правил:

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
            type: "button", // обов’язково, інакше натискання мовчки ігноруються
            name: "Approve", // мітка для відображення
            style: "primary", // необов’язково: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // має збігатися з id кнопки (для визначення name)
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

1. Attachments розміщуються в `props.attachments`, а не у верхньорівневому `attachments` (інакше мовчки ігноруються).
2. Кожна дія потребує `type: "button"` — без цього натискання мовчки поглинаються.
3. Кожна дія потребує поля `id` — Mattermost ігнорує дії без ID.
4. `id` дії має містити **лише буквено-цифрові символи** (`[a-zA-Z0-9]`). Дефіси та підкреслення ламають
   серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження відображалася
   назва кнопки (наприклад, "Approve"), а не сирий ID.
6. `context.action_id` є обов’язковим — без нього обробник interaction повертає 400.

**Генерація HMAC-токена:**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени,
які відповідають логіці перевірки Gateway:

1. Виведіть секрет із токена бота:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Побудуйте об’єкт context з усіма полями **крім** `_token`.
3. Серіалізуйте з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify`
   із відсортованими ключами, що дає компактний вивід).
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

- `json.dumps` у Python за замовчуванням додає пробіли (`{"key": "val"}`). Використовуйте
  `separators=(",", ":")`, щоб збігалося з компактним виводом JavaScript (`{"key":"val"}`).
- Завжди підписуйте **всі** поля context (крім `_token`). Gateway видаляє `_token`, а потім
  підписує все, що залишилося. Підписування лише підмножини спричиняє тиху помилку перевірки.
- Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може
  змінювати порядок полів context під час збереження payload.
- Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет
  має бути однаковим у процесі, який створює кнопки, і в Gateway, який їх перевіряє.

## Адаптер директорії

Plugin Mattermost містить адаптер директорії, який визначає назви каналів і користувачів
через Mattermost API. Це дає змогу використовувати цілі `#channel-name` і `@username` у
`openclaw message send` і доставці через Cron/Webhook.

Жодна конфігурація не потрібна — адаптер використовує токен бота з конфігурації облікового запису.

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

- Немає відповідей у каналах: переконайтеся, що бот є в каналі і його згадують (oncall), використовуйте префікс-тригер (onchar) або задайте `chatmode: "onmessage"`.
- Помилки автентифікації: перевірте токен бота, базовий URL і те, чи обліковий запис увімкнено.
- Проблеми з кількома обліковими записами: env vars застосовуються лише до облікового запису `default`.
- Нативні slash-команди повертають `Unauthorized: invalid command token.`: OpenClaw
  не прийняв токен callback. Типові причини:
  - реєстрація slash-команд не вдалася або під час запуску завершилася лише частково
  - callback надходить до неправильного Gateway/облікового запису
  - у Mattermost залишилися старі команди, що вказують на попередню ціль callback
  - Gateway перезапустився без повторної активації slash-команд
- Якщо нативні slash-команди перестали працювати, перевірте логи на наявність
  `mattermost: failed to register slash commands` або
  `mattermost: native slash commands enabled but no commands could be registered`.
- Якщо `callbackUrl` пропущено і в логах є попередження, що callback було визначено як
  `http://127.0.0.1:18789/...`, цей URL, імовірно, доступний лише тоді,
  коли Mattermost працює на тому самому хості/в тому самому network namespace, що й OpenClaw. Замість цього задайте
  явний зовнішньо доступний `commands.callbackUrl`.
- Кнопки відображаються як білі прямокутники: агент може надсилати некоректні дані кнопок. Переконайтеся, що кожна кнопка має поля `text` і `callback_data`.
- Кнопки відображаються, але натискання нічого не роблять: переконайтеся, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, і що в ServiceSettings `EnablePostActionIntegration` має значення `true`.
- Після натискання кнопок повертається 404: `id` кнопки, імовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на не буквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
- У логах Gateway `invalid _token`: невідповідність HMAC. Переконайтеся, що ви підписуєте всі поля context (а не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
- У логах Gateway `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що його включено під час побудови payload integration.
- У підтвердженні показується сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Задайте для обох однакове очищене значення.
- Агент нічого не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація особистих повідомлень і потік pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та вимога згадування
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та хардненінг
