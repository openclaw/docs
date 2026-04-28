---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
sidebarTitle: Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-28T11:04:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6d235f0880d879f1cf491a75bb15088be68c0bc27a97937120f88a2aaaee283
    source_path: channels/mattermost.md
    workflow: 16
---

Status: вбудований plugin (токен бота + події WebSocket). Підтримуються канали, групи та особисті повідомлення. Mattermost — це платформа командного обміну повідомленнями, яку можна розгорнути самостійно; дивіться офіційний сайт [mattermost.com](https://mattermost.com), щоб дізнатися подробиці про продукт і завантаження.

## Вбудований plugin

<Note>
Mattermost постачається як вбудований plugin у поточних релізах OpenClaw, тому звичайні пакетні збірки не потребують окремого встановлення.
</Note>

Якщо ви використовуєте старішу збірку або кастомне встановлення без Mattermost, встановіть його вручну:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

<Steps>
  <Step title="Ensure plugin is available">
    Поточні пакетні релізи OpenClaw уже містять його. Старіші/кастомні встановлення можуть додати його вручну за допомогою команд вище.
  </Step>
  <Step title="Create a Mattermost bot">
    Створіть обліковий запис бота Mattermost і скопіюйте **токен бота**.
  </Step>
  <Step title="Copy the base URL">
    Скопіюйте **базовий URL** Mattermost (наприклад, `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

  </Step>
</Steps>

## Нативні slash-команди

Нативні slash-команди вмикаються явно. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через API Mattermost і отримує callback POST-и на HTTP-сервері gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native: "auto"` за замовчуванням вимкнено для Mattermost. Установіть `native: true`, щоб увімкнути.
    - Якщо `callbackUrl` пропущено, OpenClaw виводить його з хоста/порту gateway + `callbackPath`.
    - Для налаштувань із кількома обліковими записами `commands` можна задати на верхньому рівні або в `channels.mattermost.accounts.<id>.commands` (значення облікового запису перевизначають поля верхнього рівня).
    - Callback-и команд перевіряються за токенами для кожної команди, які Mattermost повертає, коли OpenClaw реєструє команди `oc_*`.
    - Slash callback-и завершуються закрито, якщо реєстрація не вдалася, запуск був частковим або токен callback-а не збігається з жодною із зареєстрованих команд.

  </Accordion>
  <Accordion title="Reachability requirement">
    Callback-ендпоїнт має бути доступний із сервера Mattermost.

    - Не встановлюйте `callbackUrl` у `localhost`, якщо Mattermost не працює на тому самому хості/у тому самому мережевому просторі імен, що й OpenClaw.
    - Не встановлюйте `callbackUrl` у базовий URL Mattermost, якщо цей URL не проксіює `/api/channels/mattermost/command` до OpenClaw через reverse proxy.
    - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повернути `405 Method Not Allowed` від OpenClaw, а не `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Якщо ваш callback спрямовано на приватні/tailnet/внутрішні адреси, установіть Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити хост/домен callback-а.

    Використовуйте записи хоста/домену, а не повні URL.

    - Добре: `gateway.tailnet-name.ts.net`
    - Погано: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Змінні середовища (обліковий запис за замовчуванням)

Установіть їх на хості gateway, якщо віддаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Змінні середовища застосовуються лише до **типового** облікового запису (`default`). Інші облікові записи мають використовувати значення конфігурації.

`MATTERMOST_URL` не можна встановити з workspace `.env`; дивіться [файли workspace `.env`](/uk/gateway/security).
</Note>

## Режими чату

Mattermost автоматично відповідає на особисті повідомлення. Поведінка каналу керується `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Відповідати в каналах лише за @згадування.
  </Tab>
  <Tab title="onmessage">
    Відповідати на кожне повідомлення каналу.
  </Tab>
  <Tab title="onchar">
    Відповідати, коли повідомлення починається з префікса-тригера.
  </Tab>
</Tabs>

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
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але перевага надається `chatmode`.

## Потоки та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в основному каналі, чи починають потік під дописом-тригером.

- `off` (за замовчуванням): відповідати в потоці лише тоді, коли вхідний допис уже в ньому.
- `first`: для дописів верхнього рівня в каналі/групі починати потік під цим дописом і маршрутизувати розмову до сесії в межах потоку.
- `all`: сьогодні для Mattermost така сама поведінка, як `first`.
- Особисті повідомлення ігнорують це налаштування й залишаються без потоків.

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

- Сесії в межах потоку використовують id допису-тригера як корінь потоку.
- `first` і `all` наразі еквівалентні, бо щойно Mattermost має корінь потоку, наступні фрагменти й медіа продовжуються в тому самому потоці.

## Контроль доступу (особисті повідомлення)

- Типово: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код сполучення).
- Схваліть через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні DM: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- Типово: `channels.mattermost.groupPolicy = "allowlist"` (доступ обмежено згадкою).
- Додавайте відправників до списку дозволених за допомогою `channels.mattermost.groupAllowFrom` (рекомендовано ID користувачів).
- Перевизначення згадки для окремих каналів містяться в `channels.mattermost.groups.<channelId>.requireMention` або `channels.mattermost.groups["*"].requireMention` для типового значення.
- Зіставлення `@username` є змінним і вмикається лише коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (доступ обмежено згадкою).
- Примітка щодо виконання: якщо `channels.mattermost` повністю відсутній, під час виконання для перевірок груп застосовується fallback до `groupPolicy="allowlist"` (навіть якщо задано `channels.defaults.groupPolicy`).

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

Використовуйте ці формати цілей з `openclaw message send` або cron/webhooks:

- `channel:<id>` для каналу
- `user:<id>` для DM
- `@username` для DM (визначається через Mattermost API)

<Warning>
Голі непрозорі ID (як-от `64ifufp...`) є **неоднозначними** в Mattermost (ID користувача чи ID каналу).

OpenClaw визначає їх **спочатку як користувача**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` успішний), OpenClaw надсилає **DM**, визначаючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID вважається **ID каналу**.

Якщо потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).
</Warning>

## Повторна спроба DM-каналу

Коли OpenClaw надсилає повідомлення до цілі DM у Mattermost і спершу має визначити прямий канал, він типово повторює спроби після тимчасових збоїв створення прямого каналу.

Використовуйте `channels.mattermost.dmChannelRetry`, щоб налаштувати цю поведінку глобально для Plugin Mattermost, або `channels.mattermost.accounts.<id>.dmChannelRetry` для одного облікового запису.

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
- Повторні спроби застосовуються до тимчасових збоїв, як-от обмеження частоти, відповіді 5xx, а також помилки мережі або тайм-ауту.
- Клієнтські помилки 4xx, окрім `429`, вважаються постійними й не повторюються.

## Потокове передавання попереднього перегляду

Mattermost потоково передає міркування, активність інструментів і частковий текст відповіді в один **чернетковий допис попереднього перегляду**, який фіналізується на місці, коли фінальну відповідь безпечно надіслати. Попередній перегляд оновлюється в тому самому ID допису замість засмічення каналу повідомленнями для кожного фрагмента. Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду й використовують звичайну доставку замість скидання одноразового допису попереднього перегляду.

Увімкніть через `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Streaming modes">
    - `partial` — звичний вибір: один допис попереднього перегляду, який редагується зі зростанням відповіді, а потім фіналізується повною відповіддю.
    - `block` використовує чернеткові фрагменти в стилі додавання всередині допису попереднього перегляду.
    - `progress` показує попередній перегляд статусу під час генерування й публікує лише фінальну відповідь після завершення.
    - `off` вимикає потокове передавання попереднього перегляду.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - Якщо потік неможливо фіналізувати на місці (наприклад, допис було видалено посеред потоку), OpenClaw повертається до надсилання нового фінального допису, щоб відповідь не була втрачена.
    - Payloads лише з міркуваннями не потрапляють у дописи каналу, включно з текстом, що надходить як blockquote `> Reasoning:`. Установіть `/reasoning on`, щоб бачити міркування в інших поверхнях; фінальний допис Mattermost зберігає лише відповідь.
    - Див. [Потокове передавання](/uk/concepts/streaming#preview-streaming-modes) для матриці зіставлення каналів.

  </Accordion>
</AccordionGroup>

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це ID допису Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до маршрутизованої сесії агента.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнути/вимкнути дії реакцій (типово true).
- Перевизначення для окремого облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

## Інтерактивні кнопки (інструмент повідомлень)

Надсилайте повідомлення з клікабельними кнопками. Коли користувач натискає кнопку, агент отримує вибір і може відповісти.

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

Використовуйте `message action=send` з параметром `buttons`. Кнопки — це двовимірний масив (рядки кнопок):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Поля кнопок:

<ParamField path="text" type="string" required>
  Мітка для відображення.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Значення, що надсилається назад під час натискання (використовується як ID дії).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Стиль кнопки.
</ParamField>

Коли користувач натискає кнопку:

<Steps>
  <Step title="Кнопки замінено підтвердженням">
    Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
  </Step>
  <Step title="Agent отримує вибір">
    Agent отримує вибір як вхідне повідомлення та відповідає.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Примітки щодо реалізації">
    - Зворотні виклики кнопок використовують перевірку HMAC-SHA256 (автоматично, конфігурація не потрібна).
    - Mattermost вилучає дані зворотного виклику зі своїх відповідей API (функція безпеки), тому після натискання всі кнопки видаляються — часткове видалення неможливе.
    - Ідентифікатори дій, що містять дефіси або підкреслення, автоматично очищуються (обмеження маршрутизації Mattermost).

  </Accordion>
  <Accordion title="Конфігурація та доступність">
    - `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб увімкнути опис інструмента кнопок у системному запиті agent.
    - `channels.mattermost.interactions.callbackBaseUrl`: необов’язкова зовнішня базова URL-адреса для зворотних викликів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може напряму досягти gateway на його хості прив’язки.
    - У налаштуваннях із кількома обліковими записами також можна встановити те саме поле в `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw формує URL-адресу зворотного виклику з `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
    - Правило доступності: URL-адреса зворотного виклику кнопки має бути доступною з сервера Mattermost. `localhost` працює лише тоді, коли Mattermost і OpenClaw працюють на одному хості/в одному просторі імен мережі.
    - Якщо ціль зворотного виклику є приватною/tailnet/внутрішньою, додайте її хост/домен до `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти та webhooks можуть надсилати кнопки напряму через REST API Mattermost, не проходячи через інструмент `message` agent. За можливості використовуйте `buildButtonAttachments()` з plugin; якщо надсилаєте сирий JSON, дотримуйтеся цих правил:

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
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Критичні правила**

1. Вкладення розміщуються в `props.attachments`, а не в `attachments` верхнього рівня (тихо ігнорується).
2. Кожна дія потребує `type: "button"` — без цього натискання тихо проковтуються.
3. Кожна дія потребує поля `id` — Mattermost ігнорує дії без ідентифікаторів.
4. `id` дії має бути **лише літерно-цифровим** (`[a-zA-Z0-9]`). Дефіси та підкреслення порушують серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має відповідати `id` кнопки, щоб повідомлення підтвердження показувало назву кнопки (наприклад, "Approve"), а не сирий ідентифікатор.
6. `context.action_id` є обов’язковим — без нього обробник взаємодії повертає 400.

</Warning>

**Генерація токена HMAC**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени, що відповідають логіці перевірки gateway:

<Steps>
  <Step title="Виведіть секрет із токена бота">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Створіть об’єкт context">
    Створіть об’єкт context з усіма полями, **крім** `_token`.
  </Step>
  <Step title="Серіалізуйте з відсортованими ключами">
    Серіалізуйте з **відсортованими ключами** і **без пробілів** (gateway використовує `JSON.stringify` з відсортованими ключами, що створює компактний вивід).
  </Step>
  <Step title="Підпишіть payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Додайте токен">
    Додайте отриманий шістнадцятковий digest як `_token` у context.
  </Step>
</Steps>

Приклад Python:

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

<AccordionGroup>
  <Accordion title="Поширені помилки HMAC">
    - Python `json.dumps` за замовчуванням додає пробіли (`{"key": "val"}`). Використовуйте `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
    - Завжди підписуйте **всі** поля context (за винятком `_token`). Gateway видаляє `_token`, а потім підписує все, що залишилося. Підписування підмножини спричиняє тихий збій перевірки.
    - Використовуйте `sort_keys=True` — gateway сортує ключі перед підписуванням, а Mattermost може змінювати порядок полів context під час збереження payload.
    - Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет має бути однаковим у процесі, що створює кнопки, і в gateway, що виконує перевірку.

  </Accordion>
</AccordionGroup>

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який визначає назви каналів і користувачів через API Mattermost. Це вмикає цілі `#channel-name` і `@username` в `openclaw message send` та доставках cron/webhook.

Конфігурація не потрібна — адаптер використовує токен бота з конфігурації облікового запису.

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

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Переконайтеся, що бот перебуває в каналі, і згадайте його (oncall), використайте префікс тригера (onchar) або встановіть `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Помилки автентифікації або кількох облікових записів">
    - Перевірте токен бота, базову URL-адресу та чи ввімкнено обліковий запис.
    - Проблеми з кількома обліковими записами: змінні env застосовуються лише до облікового запису `default`.

  </Accordion>
  <Accordion title="Вбудовані slash-команди не працюють">
    - `Unauthorized: invalid command token.`: OpenClaw не прийняв токен зворотного виклику. Типові причини:
      - реєстрація slash-команди не вдалася або лише частково завершилася під час запуску
      - зворотний виклик потрапляє не в той gateway/обліковий запис
      - у Mattermost досі є старі команди, що вказують на попередню ціль зворотного виклику
      - gateway перезапустився без повторної активації slash-команд
    - Якщо вбудовані slash-команди перестали працювати, перевірте журнали на `mattermost: failed to register slash commands` або `mattermost: native slash commands enabled but no commands could be registered`.
    - Якщо `callbackUrl` пропущено, а журнали попереджають, що зворотний виклик визначено як `http://127.0.0.1:18789/...`, ця URL-адреса, ймовірно, доступна лише тоді, коли Mattermost працює на тому самому хості/у тому самому просторі імен мережі, що й OpenClaw. Натомість встановіть явно зовні доступний `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Проблеми з кнопками">
    - Кнопки виглядають як білі прямокутники: agent може надсилати неправильно сформовані дані кнопок. Перевірте, що кожна кнопка має поля `text` і `callback_data`.
    - Кнопки відображаються, але натискання нічого не роблять: переконайтеся, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, а `EnablePostActionIntegration` має значення `true` у ServiceSettings.
    - Кнопки повертають 404 після натискання: `id` кнопки, ймовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на нелітерно-цифрових ідентифікаторах. Використовуйте лише `[a-zA-Z0-9]`.
    - Журнали Gateway містять `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля context (не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
    - Журнали Gateway містять `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що його включено під час створення integration payload.
    - Підтвердження показує сирий ідентифікатор замість назви кнопки: `context.action_id` не відповідає `id` кнопки. Встановіть обидва в однакове очищене значення.
    - Agent не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження згадок
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення безпеки
