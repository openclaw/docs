---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
sidebarTitle: Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-01T15:14:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e83d7d4a1b60822f5efdb004fb28e26764b7cd70b3c78296b882d38d51241ae
    source_path: channels/mattermost.md
    workflow: 16
---

Статус: вбудований Plugin (токен бота + події WebSocket). Канали, групи та DM підтримуються. Mattermost — це платформа командного обміну повідомленнями, яку можна розгорнути самостійно; подробиці про продукт і завантаження див. на офіційному сайті [mattermost.com](https://mattermost.com).

## Вбудований Plugin

<Note>
Mattermost постачається як вбудований Plugin у поточних випусках OpenClaw, тому звичайні пакетовані збірки не потребують окремого встановлення.
</Note>

Якщо ви використовуєте старішу збірку або власне встановлення, що виключає Mattermost, встановіть поточний npm-пакет, коли його буде опубліковано:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Локальний checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий, використовуйте поточну пакетовану збірку
OpenClaw або шлях до локального checkout, доки не буде
опубліковано новіший npm-пакет.

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

<Steps>
  <Step title="Переконайтеся, що Plugin доступний">
    Поточні пакетовані випуски OpenClaw уже містять його. Старіші або власні встановлення можуть додати його вручну за допомогою наведених вище команд.
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

## Нативні slash-команди

Нативні slash-команди вмикаються за бажанням. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через API Mattermost і отримує callback POST на HTTP-сервері Gateway.

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
  <Accordion title="Примітки щодо поведінки">
    - `native: "auto"` за замовчуванням вимкнено для Mattermost. Установіть `native: true`, щоб увімкнути.
    - Якщо `callbackUrl` пропущено, OpenClaw виводить її з хоста/порту Gateway + `callbackPath`.
    - Для налаштувань із кількома обліковими записами `commands` можна задати на верхньому рівні або в `channels.mattermost.accounts.<id>.commands` (значення облікового запису перевизначають поля верхнього рівня).
    - Callback команд перевіряються за допомогою токенів окремих команд, які Mattermost повертає, коли OpenClaw реєструє команди `oc_*`.
    - OpenClaw оновлює поточну реєстрацію команд Mattermost перед прийняттям кожного callback, тож застарілі токени з видалених або повторно згенерованих slash-команд припиняють прийматися без перезапуску Gateway.
    - Перевірка callback закривається з помилкою, якщо API Mattermost не може підтвердити, що команда все ще поточна; невдалі перевірки коротко кешуються, паралельні пошуки об’єднуються, а запуски свіжого пошуку обмежуються за частотою для кожної команди, щоб обмежити тиск повторного відтворення.
    - Slash callback закриваються з помилкою, коли реєстрація не вдалася, запуск був частковим або токен callback не збігається із зареєстрованим токеном розв’язаної команди (токен, чинний для однієї команди, не може дістатися upstream-перевірки для іншої команди).

  </Accordion>
  <Accordion title="Вимога доступності">
    Кінцева точка callback має бути доступною з сервера Mattermost.

    - Не встановлюйте `callbackUrl` у `localhost`, якщо Mattermost не працює на тому самому хості або в тому самому мережевому просторі імен, що й OpenClaw.
    - Не встановлюйте `callbackUrl` у базову URL-адресу Mattermost, якщо ця URL-адреса не виконує reverse proxy `/api/channels/mattermost/command` до OpenClaw.
    - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повернути `405 Method Not Allowed` від OpenClaw, а не `404`.

  </Accordion>
  <Accordion title="Список дозволених вихідних з’єднань Mattermost">
    Якщо ваш callback спрямований на приватні/tailnet/внутрішні адреси, задайте Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити хост/домен callback.

    Використовуйте записи хоста/домену, а не повні URL-адреси.

    - Правильно: `gateway.tailnet-name.ts.net`
    - Неправильно: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Змінні середовища (обліковий запис за замовчуванням)

Установіть їх на хості Gateway, якщо віддаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Інші облікові записи мають використовувати значення конфігурації.

`MATTERMOST_URL` не можна задати з робочого `.env`; див. [Файли `.env` робочого простору](/uk/gateway/security).
</Note>

## Режими чату

Mattermost автоматично відповідає на DM. Поведінка каналу керується `chatmode`:

<Tabs>
  <Tab title="oncall (за замовчуванням)">
    Відповідати в каналах лише за @згадуванням.
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

- `onchar` все одно відповідає на явні @згадування.
- `channels.mattermost.requireMention` підтримується для застарілих конфігурацій, але перевага надається `chatmode`.

## Потоки та сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в основному каналі, чи починають потік під дописом, який їх спричинив.

- `off` (за замовчуванням): відповідати в потоці лише тоді, коли вхідний допис уже в ньому.
- `first`: для дописів верхнього рівня в каналі/групі почати потік під цим дописом і спрямувати розмову до сесії, прив’язаної до потоку.
- `all`: для Mattermost сьогодні така сама поведінка, як `first`.
- Прямі повідомлення ігнорують це налаштування й залишаються без потоків.

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

- Сесії, прив’язані до потоку, використовують ідентифікатор допису, що спричинив відповідь, як корінь потоку.
- `first` і `all` наразі еквівалентні, бо щойно Mattermost має корінь потоку, наступні фрагменти й медіа продовжуються в тому самому потоці.

## Контроль доступу (DM)

- За замовчуванням: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код сполучення).
- Підтвердьте через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні DM: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- За замовчуванням: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадування).
- Додайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендовано ідентифікатори користувачів).
- Перевизначення згадувань для окремих каналів містяться в `channels.mattermost.groups.<channelId>.requireMention` або `channels.mattermost.groups["*"].requireMention` для значення за замовчуванням.
- Зіставлення `@username` є змінним і вмикається лише коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із вимогою згадування).
- Примітка щодо runtime: якщо `channels.mattermost` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для групових перевірок (навіть якщо встановлено `channels.defaults.groupPolicy`).

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
- `@username` для DM (розв’язується через API Mattermost)

<Warning>
Прості непрозорі ідентифікатори (як-от `64ifufp...`) є **неоднозначними** в Mattermost (ідентифікатор користувача чи ідентифікатор каналу).

OpenClaw розв’язує їх **спершу як користувача**:

- Якщо ідентифікатор існує як користувач (`GET /api/v4/users/<id>` успішний), OpenClaw надсилає **DM**, розв’язуючи прямий канал через `/api/v4/channels/direct`.
- Інакше ідентифікатор вважається **ідентифікатором каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).
</Warning>

## Повторна спроба каналу DM

Коли OpenClaw надсилає до цілі DM у Mattermost і спершу має розв’язати прямий канал, він за замовчуванням повторює спроби після тимчасових збоїв створення прямого каналу.

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

- Це застосовується лише до створення каналу DM (`/api/v4/channels/direct`), а не до кожного виклику API Mattermost.
- Повторні спроби застосовуються до тимчасових збоїв, таких як обмеження частоти, відповіді 5xx, а також мережеві помилки чи помилки timeout.
- Клієнтські помилки 4xx, крім `429`, вважаються постійними й не повторюються.

## Preview streaming

Mattermost транслює мислення, активність інструментів і частковий текст відповіді в один **допис чернетки попереднього перегляду**, який фіналізується на місці, коли фінальну відповідь безпечно надіслати. Попередній перегляд оновлюється в тому самому ідентифікаторі допису, замість того щоб засмічувати канал повідомленнями для кожного фрагмента. Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду й використовують звичайну доставку замість скидання одноразового допису попереднього перегляду.

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
  <Accordion title="Режими streaming">
    - `partial` — звичайний вибір: один допис попереднього перегляду, який редагується зі зростанням відповіді, а потім фіналізується повною відповіддю.
    - `block` використовує фрагменти чернетки в стилі додавання всередині допису попереднього перегляду.
    - `progress` показує попередній перегляд статусу під час генерації й публікує фінальну відповідь лише після завершення.
    - `off` вимикає preview streaming.

  </Accordion>
  <Accordion title="Примітки щодо поведінки streaming">
    - Якщо потік не можна фіналізувати на місці (наприклад, допис було видалено посеред потоку), OpenClaw повертається до надсилання нового фінального допису, щоб відповідь ніколи не губилася.
    - Payloads лише з reasoning пригнічуються в дописах каналу, включно з текстом, що надходить як цитата `> Reasoning:`. Установіть `/reasoning on`, щоб бачити мислення в інших поверхнях; фінальний допис Mattermost зберігає лише відповідь.
    - Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці зіставлення каналів.

  </Accordion>
</AccordionGroup>

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це ідентифікатор допису Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до спрямованої сесії агента.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнути/вимкнути дії реакцій (за замовчуванням true).
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

Використовуйте `message action=send` з параметром `buttons`. Кнопки — це 2D-масив (рядки кнопок):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Поля кнопок:

<ParamField path="text" type="string" required>
  Мітка для відображення.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Значення, яке надсилається назад після натискання (використовується як ID дії).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Стиль кнопки.
</ParamField>

Коли користувач натискає кнопку:

<Steps>
  <Step title="Кнопки замінено підтвердженням">
    Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
  </Step>
  <Step title="Агент отримує вибір">
    Агент отримує вибір як вхідне повідомлення й відповідає.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Примітки щодо реалізації">
    - Зворотні виклики кнопок використовують перевірку HMAC-SHA256 (автоматично, конфігурація не потрібна).
    - Mattermost видаляє дані зворотного виклику зі своїх відповідей API (функція безпеки), тому після натискання видаляються всі кнопки — часткове видалення неможливе.
    - ID дій, що містять дефіси або підкреслення, автоматично очищуються (обмеження маршрутизації Mattermost).

  </Accordion>
  <Accordion title="Конфігурація та доступність">
    - `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб увімкнути опис інструмента кнопок у системному запиті агента.
    - `channels.mattermost.interactions.callbackBaseUrl`: необов'язкова зовнішня базова URL-адреса для зворотних викликів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може напряму дістатися Gateway за його прив'язаним хостом.
    - У налаштуваннях із кількома обліковими записами можна також задати те саме поле в `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw виводить URL зворотного виклику з `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
    - Правило доступності: URL зворотного виклику кнопки має бути доступним із сервера Mattermost. `localhost` працює лише тоді, коли Mattermost і OpenClaw запущені на одному хості/у тому самому мережевому просторі імен.
    - Якщо ціль зворотного виклику є приватною/tailnet/внутрішньою, додайте її хост/домен до Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти й Webhook-и можуть публікувати кнопки напряму через Mattermost REST API замість проходження через інструмент `message` агента. За можливості використовуйте `buildButtonAttachments()` із Plugin; якщо публікуєте сирий JSON, дотримуйтеся таких правил:

**Структура корисного навантаження:**

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

1. Вкладення мають бути в `props.attachments`, а не в `attachments` верхнього рівня (тихо ігнорується).
2. Кожній дії потрібен `type: "button"` — без нього натискання тихо відкидаються.
3. Кожній дії потрібне поле `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси й підкреслення ламають серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб повідомлення підтвердження показувало назву кнопки (наприклад, "Approve") замість сирого ID.
6. `context.action_id` обов'язковий — без нього обробник взаємодії повертає 400.

</Warning>

**Генерація токена HMAC**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени, що відповідають логіці перевірки Gateway:

<Steps>
  <Step title="Виведіть секрет із токена бота">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Побудуйте об'єкт контексту">
    Побудуйте об'єкт контексту з усіма полями, **крім** `_token`.
  </Step>
  <Step title="Серіалізуйте з відсортованими ключами">
    Серіалізуйте з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify` з відсортованими ключами, що створює компактний вивід).
  </Step>
  <Step title="Підпишіть корисне навантаження">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Додайте токен">
    Додайте отриманий шістнадцятковий дайджест як `_token` у контекст.
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
    - Завжди підписуйте **усі** поля контексту (мінус `_token`). Gateway видаляє `_token`, а потім підписує все, що залишилося. Підписування підмножини спричиняє тиху невдачу перевірки.
    - Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може змінити порядок полів контексту під час збереження корисного навантаження.
    - Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет має бути однаковим у процесі, який створює кнопки, і в Gateway, що виконує перевірку.

  </Accordion>
</AccordionGroup>

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який визначає назви каналів і користувачів через Mattermost API. Це вмикає цілі `#channel-name` і `@username` у `openclaw message send` та доставках Cron/Webhook.

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
    Переконайтеся, що бот є в каналі, і згадайте його (oncall), використайте префікс тригера (onchar) або встановіть `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Помилки автентифікації або кількох облікових записів">
    - Перевірте токен бота, базову URL-адресу та чи ввімкнено обліковий запис.
    - Проблеми з кількома обліковими записами: змінні середовища застосовуються лише до облікового запису `default`.

  </Accordion>
  <Accordion title="Нативні slash-команди не працюють">
    - `Unauthorized: invalid command token.`: OpenClaw не прийняв токен зворотного виклику. Типові причини:
      - реєстрація slash-команди не вдалася або лише частково завершилася під час запуску
      - зворотний виклик потрапляє в неправильний Gateway/обліковий запис
      - у Mattermost усе ще є старі команди, що вказують на попередню ціль зворотного виклику
      - Gateway перезапущено без повторної активації slash-команд
    - Якщо нативні slash-команди перестають працювати, перевірте журнали на `mattermost: failed to register slash commands` або `mattermost: native slash commands enabled but no commands could be registered`.
    - Якщо `callbackUrl` пропущено, а журнали попереджають, що зворотний виклик визначено як `http://127.0.0.1:18789/...`, ця URL-адреса, ймовірно, доступна лише тоді, коли Mattermost працює на тому самому хості/у тому самому мережевому просторі імен, що й OpenClaw. Натомість задайте явний зовні доступний `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Проблеми з кнопками">
    - Кнопки з'являються як білі блоки: агент може надсилати неправильно сформовані дані кнопок. Перевірте, що кожна кнопка має обидва поля `text` і `callback_data`.
    - Кнопки відображаються, але натискання нічого не роблять: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, і що `EnablePostActionIntegration` має значення `true` у ServiceSettings.
    - Кнопки повертають 404 після натискання: `id` кнопки, ймовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на не буквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
    - Журнали Gateway показують `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля контексту (а не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
    - Журнали Gateway показують `missing _token in context`: поле `_token` відсутнє в контексті кнопки. Переконайтеся, що воно включене під час побудови корисного навантаження інтеграції.
    - Підтвердження показує сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Установіть обидва значення однаковими після очищення.
    - Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік Pairing
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
