---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
sidebarTitle: Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T07:59:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Статус: вбудований Plugin (токен бота + події WebSocket). Підтримуються канали, групи та DM. Mattermost — це self-hostable платформа командного обміну повідомленнями; деталі про продукт і завантаження див. на офіційному сайті [mattermost.com](https://mattermost.com).

## Вбудований Plugin

<Note>
Mattermost постачається як вбудований Plugin у поточних релізах OpenClaw, тому звичайні пакетовані збірки не потребують окремого встановлення.
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
  <Step title="Переконайтеся, що Plugin доступний">
    У поточних пакетованих релізах OpenClaw він уже вбудований. У старіших або кастомних встановленнях його можна додати вручну за допомогою наведених вище команд.
  </Step>
  <Step title="Створіть бота Mattermost">
    Створіть обліковий запис бота Mattermost і скопіюйте **токен бота**.
  </Step>
  <Step title="Скопіюйте базову URL-адресу">
    Скопіюйте **базову URL-адресу** Mattermost (наприклад, `https://chat.example.com`).
  </Step>
  <Step title="Налаштуйте OpenClaw і запустіть Gateway">
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

## Власні slash-команди

Власні slash-команди є опційними. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через API Mattermost і отримує callback POST-запити на HTTP-сервері Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Використовуйте, коли Mattermost не може напряму дістатися до Gateway (reverse proxy/публічна URL-адреса).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Примітки щодо поведінки">
    - `native: "auto"` типово вимкнено для Mattermost. Установіть `native: true`, щоб увімкнути.
    - Якщо `callbackUrl` не вказано, OpenClaw формує його з хоста/порту gateway + `callbackPath`.
    - Для конфігурацій з кількома обліковими записами `commands` можна задати на верхньому рівні або в `channels.mattermost.accounts.<id>.commands` (значення облікового запису перевизначають поля верхнього рівня).
    - Callback-и команд перевіряються за допомогою токенів команд, які Mattermost повертає, коли OpenClaw реєструє команди `oc_*`.
    - Callback-и slash-команд працюють у режимі fail closed, якщо реєстрація не вдалася, запуск був частковим або токен callback не збігається з одним із зареєстрованих команд.
  </Accordion>
  <Accordion title="Вимога доступності">
    Endpoint callback має бути доступним із сервера Mattermost.

    - Не встановлюйте `callbackUrl` у `localhost`, якщо Mattermost не працює на тому самому хості/в тому самому network namespace, що й OpenClaw.
    - Не встановлюйте `callbackUrl` у базову URL-адресу вашого Mattermost, якщо ця URL-адреса не проксіює `/api/channels/mattermost/command` до OpenClaw через reverse proxy.
    - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET-запит має повертати `405 Method Not Allowed` від OpenClaw, а не `404`.

  </Accordion>
  <Accordion title="Allowlist вихідних з'єднань Mattermost">
    Якщо ваш callback спрямовано на приватні/tailnet/внутрішні адреси, установіть у Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити хост/домен callback.

    Використовуйте записи хоста/домену, а не повні URL-адреси.

    - Правильно: `gateway.tailnet-name.ts.net`
    - Неправильно: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Змінні середовища (обліковий запис за замовчуванням)

Установіть їх на хості gateway, якщо віддаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Для інших облікових записів потрібно використовувати значення в конфігурації.

`MATTERMOST_URL` не можна задавати з робочого `.env`; див. [Workspace `.env` files](/uk/gateway/security).
</Note>

## Режими чату

Mattermost автоматично відповідає на DM. Поведінка в каналах керується через `chatmode`:

<Tabs>
  <Tab title="oncall (типово)">
    Відповідає лише при @згадуванні в каналах.
  </Tab>
  <Tab title="onmessage">
    Відповідає на кожне повідомлення в каналі.
  </Tab>
  <Tab title="onchar">
    Відповідає, коли повідомлення починається з префікса-тригера.
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

- `onchar` усе одно реагує на явні @згадування.
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але рекомендовано використовувати `chatmode`.

## Потоки та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи залишаються відповіді в каналах і групах в основному каналі, чи починають потік під повідомленням-тригером.

- `off` (типово): відповідати в потоці лише тоді, коли вхідне повідомлення вже перебуває в ньому.
- `first`: для повідомлень верхнього рівня в каналі/групі запускати потік під цим повідомленням і спрямовувати розмову в сесію, прив'язану до потоку.
- `all`: на сьогодні для Mattermost поводиться так само, як `first`.
- Прямі повідомлення ігнорують цей параметр і залишаються без потоків.

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

- Сесії, прив'язані до потоку, використовують id повідомлення-тригера як корінь потоку.
- `first` і `all` наразі еквівалентні, оскільки щойно Mattermost має корінь потоку, наступні чанки та медіа продовжують іти в той самий потік.

## Контроль доступу (DM)

- Типово: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Підтвердження через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні DM: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- Типово: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадування).
- Дозволяйте відправників через `channels.mattermost.groupAllowFrom` (рекомендовано ID користувачів).
- Перевизначення згадувань для окремих каналів розміщуються в `channels.mattermost.groups.<channelId>.requireMention` або `channels.mattermost.groups["*"].requireMention` як значення за замовчуванням.
- Відповідність `@username` є змінною та вмикається лише коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
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

Використовуйте ці формати цілей з `openclaw message send` або cron/webhooks:

- `channel:<id>` для каналу
- `user:<id>` для DM
- `@username` для DM (визначається через API Mattermost)

<Warning>
Голі непрозорі ID (наприклад `64ifufp...`) у Mattermost **неоднозначні** (ID користувача чи ID каналу).

OpenClaw визначає їх у порядку **спочатку користувач**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` виконується успішно), OpenClaw надсилає **DM**, визначаючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID розглядається як **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).
</Warning>

## Повторні спроби для DM-каналу

Коли OpenClaw надсилає повідомлення до цілі DM у Mattermost і спочатку має визначити прямий канал, за замовчуванням він повторює спроби при тимчасових збоях створення прямого каналу.

Використовуйте `channels.mattermost.dmChannelRetry`, щоб налаштувати цю поведінку глобально для Plugin Mattermost, або `channels.mattermost.accounts.<id>.dmChannelRetry` для окремого облікового запису.

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
- Повторні спроби застосовуються до тимчасових збоїв, таких як обмеження швидкості, відповіді 5xx, а також помилки мережі чи тайм-аути.
- Клієнтські помилки 4xx, окрім `429`, вважаються постійними й не повторюються.

## Потокове попереднє відображення

Mattermost передає thinking, активність інструментів і частковий текст відповіді в один **чернетковий пост попереднього перегляду**, який завершується на місці, коли фінальну відповідь безпечно надсилати. Попередній перегляд оновлюється в тому самому id поста замість засмічення каналу повідомленнями для кожного чанка. Фінальні повідомлення з медіа/помилками скасовують відкладені редагування попереднього перегляду й використовують звичайну доставку замість скидання одноразового поста попереднього перегляду.

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

<AccordionGroup>
  <Accordion title="Режими потокової передачі">
    - `partial` — звичайний вибір: один пост попереднього перегляду, який редагується в міру зростання відповіді, а потім завершується повною відповіддю.
    - `block` використовує чернеткові чанки в стилі додавання всередині поста попереднього перегляду.
    - `progress` показує статусне попереднє відображення під час генерації та публікує фінальну відповідь лише після завершення.
    - `off` вимикає потокове попереднє відображення.
  </Accordion>
  <Accordion title="Примітки щодо поведінки потокової передачі">
    - Якщо потік неможливо завершити на місці (наприклад, пост було видалено під час потоку), OpenClaw повертається до надсилання нового фінального поста, щоб відповідь ніколи не загубилася.
    - Дані лише з reasoning не потрапляють у пости каналу, зокрема текст, що надходить як blockquote `> Reasoning:`. Установіть `/reasoning on`, щоб бачити thinking в інших поверхнях; фінальний пост Mattermost містить лише відповідь.
    - Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці відповідності каналів.
  </Accordion>
</AccordionGroup>

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id поста Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов'язкові).
- Установіть `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до сесії агента, куди спрямовано маршрут.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнути/вимкнути дії реакцій (типово true).
- Перевизначення для окремого облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

## Інтерактивні кнопки (інструмент повідомлень)

Надсилайте повідомлення з кнопками, які можна натискати. Коли користувач натискає кнопку, агент отримує вибір і може відповісти.

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

<ParamField path="text" type="string" required>
  Мітка для відображення.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Значення, яке надсилається назад при натисканні (використовується як ID дії).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Стиль кнопки.
</ParamField>

Коли користувач натискає кнопку:

<Steps>
  <Step title="Кнопки замінюються підтвердженням">
    Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
  </Step>
  <Step title="Агент отримує вибір">
    Агент отримує вибір як вхідне повідомлення і відповідає.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Примітки щодо реалізації">
    - Callback-и кнопок використовують перевірку HMAC-SHA256 (автоматично, без потреби в налаштуванні).
    - Mattermost видаляє callback data зі своїх API-відповідей (функція безпеки), тому всі кнопки видаляються при натисканні — часткове видалення неможливе.
    - ID дій, що містять дефіси або підкреслення, автоматично санітизуються (обмеження маршрутизації Mattermost).
  </Accordion>
  <Accordion title="Конфігурація та доступність">
    - `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб увімкнути опис інструмента кнопок у системному prompt агента.
    - `channels.mattermost.interactions.callbackBaseUrl`: необов'язкова зовнішня базова URL-адреса для callback-ів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може напряму дістатися Gateway за його bind host.
    - У конфігураціях із кількома обліковими записами це саме поле також можна задати в `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Якщо `interactions.callbackBaseUrl` не вказано, OpenClaw формує callback URL з `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
    - Правило доступності: URL callback кнопки має бути доступним із сервера Mattermost. `localhost` працює лише тоді, коли Mattermost і OpenClaw запущені на тому самому хості/в тому самому network namespace.
    - Якщо ваша ціль callback є приватною/tailnet/внутрішньою, додайте її хост/домен до `ServiceSettings.AllowedUntrustedInternalConnections` у Mattermost.
  </Accordion>
</AccordionGroup>

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти й Webhook-и можуть напряму надсилати кнопки через Mattermost REST API замість використання інструмента `message` агента. Використовуйте `buildButtonAttachments()` із Plugin, коли це можливо; якщо надсилаєте raw JSON, дотримуйтесь таких правил:

**Структура payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Виберіть варіант:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // лише буквено-цифрові символи — див. нижче
            type: "button", // обов'язково, інакше натискання буде мовчки проігноровано
            name: "Approve", // мітка для відображення
            style: "primary", // необов'язково: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // має збігатися з id кнопки (для визначення назви)
                action: "approve",
                // ... будь-які користувацькі поля ...
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

<Warning>
**Критично важливі правила**

1. Attachments мають бути в `props.attachments`, а не у верхньорівневому `attachments` (інакше їх буде мовчки проігноровано).
2. Кожна дія потребує `type: "button"` — без цього натискання будуть мовчки проковтнуті.
3. Кожна дія потребує поле `id` — Mattermost ігнорує дії без ID.
4. `id` дії має містити **лише буквено-цифрові символи** (`[a-zA-Z0-9]`). Дефіси й підкреслення ламають серверну маршрутизацію дій у Mattermost (повертається 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження відображалася назва кнопки (наприклад, "Approve"), а не raw ID.
6. `context.action_id` є обов'язковим — без нього обробник інтеракцій повертає 400.
</Warning>

**Генерація HMAC-токена**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени, що відповідають логіці перевірки Gateway:

<Steps>
  <Step title="Отримайте секрет із токена бота">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Побудуйте об'єкт context">
    Побудуйте об'єкт context з усіма полями **крім** `_token`.
  </Step>
  <Step title="Серіалізуйте з відсортованими ключами">
    Серіалізуйте з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify` з відсортованими ключами, що дає компактний вивід).
  </Step>
  <Step title="Підпишіть payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Додайте токен">
    Додайте отриманий hex-дайджест як `_token` у context.
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
  <Accordion title="Поширені помилки з HMAC">
    - `json.dumps` у Python типово додає пробіли (`{"key": "val"}`). Використовуйте `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
    - Завжди підписуйте **всі** поля context (окрім `_token`). Gateway прибирає `_token`, а потім підписує все, що залишилося. Підписування лише підмножини спричиняє мовчазний збій перевірки.
    - Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може змінювати порядок полів context під час збереження payload.
    - Отримуйте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет має бути однаковим у процесі, який створює кнопки, і в Gateway, який їх перевіряє.
  </Accordion>
</AccordionGroup>

## Адаптер directory

Plugin Mattermost містить адаптер directory, який визначає назви каналів і користувачів через API Mattermost. Це дає змогу використовувати цілі `#channel-name` і `@username` в `openclaw message send` і доставках Cron/Webhook.

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
    Переконайтеся, що бот є в каналі, і згадайте його (oncall), використайте префікс-тригер (onchar) або встановіть `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Помилки автентифікації або кількох облікових записів">
    - Перевірте токен бота, базову URL-адресу та чи ввімкнено обліковий запис.
    - Проблеми з кількома обліковими записами: змінні середовища застосовуються лише до облікового запису `default`.
  </Accordion>
  <Accordion title="Не працюють власні slash-команди">
    - `Unauthorized: invalid command token.`: OpenClaw не прийняв токен callback. Типові причини:
      - реєстрація slash-команд не вдалася або завершилася лише частково під час запуску
      - callback потрапляє не в той gateway/обліковий запис
      - у Mattermost все ще залишилися старі команди, що вказують на попередню ціль callback
      - gateway перезапустився без повторної активації slash-команд
    - Якщо власні slash-команди перестали працювати, перевірте логи на `mattermost: failed to register slash commands` або `mattermost: native slash commands enabled but no commands could be registered`.
    - Якщо `callbackUrl` не вказано, а логи попереджають, що callback було визначено як `http://127.0.0.1:18789/...`, ця URL-адреса, імовірно, доступна лише тоді, коли Mattermost працює на тому самому хості/в тому самому network namespace, що й OpenClaw. Натомість задайте явний зовнішньо доступний `commands.callbackUrl`.
  </Accordion>
  <Accordion title="Проблеми з кнопками">
    - Кнопки відображаються як білі прямокутники: агент може надсилати некоректні дані кнопок. Переконайтеся, що кожна кнопка має поля `text` і `callback_data`.
    - Кнопки відображаються, але натискання нічого не робить: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost включає `127.0.0.1 localhost`, і що `EnablePostActionIntegration` має значення `true` у ServiceSettings.
    - Кнопки повертають 404 при натисканні: `id` кнопки, імовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на не буквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
    - Gateway логуватиме `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля context (а не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
    - Gateway логуватиме `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що воно включене під час побудови payload інтеграції.
    - У підтвердженні показується raw ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Установіть обидва в одне й те саме санітизоване значення.
    - Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.
  </Accordion>
</AccordionGroup>

## Пов'язане

- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Groups](/uk/channels/groups) — поведінка групового чату та вимога згадування
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Security](/uk/gateway/security) — модель доступу та зміцнення безпеки
