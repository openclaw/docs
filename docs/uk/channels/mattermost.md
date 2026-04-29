---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
sidebarTitle: Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-29T05:36:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Стан: вбудований plugin (токен бота + події WebSocket). Підтримуються канали, групи та приватні повідомлення. Mattermost — це платформа командного обміну повідомленнями, яку можна розгорнути самостійно; подробиці про продукт і завантаження див. на офіційному сайті [mattermost.com](https://mattermost.com).

## Вбудований plugin

<Note>
Mattermost постачається як вбудований plugin у поточних випусках OpenClaw, тому звичайні пакетовані збірки не потребують окремого встановлення.
</Note>

Якщо ви використовуєте старішу збірку або власне встановлення, яке виключає Mattermost, встановіть поточний npm-пакет, коли його буде опубліковано:

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

Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарів, використовуйте поточну пакетовану
збірку OpenClaw або шлях до локального checkout, доки новіший npm-пакет не буде
опубліковано.

Подробиці: [Plugins](/uk/tools/plugin)

## Швидке налаштування

<Steps>
  <Step title="Ensure plugin is available">
    Поточні пакетовані випуски OpenClaw уже містять його. Старіші або власні встановлення можуть додати його вручну за допомогою команд вище.
  </Step>
  <Step title="Create a Mattermost bot">
    Створіть обліковий запис бота Mattermost і скопіюйте **токен бота**.
  </Step>
  <Step title="Copy the base URL">
    Скопіюйте **базову URL-адресу** Mattermost (наприклад, `https://chat.example.com`).
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

Нативні slash-команди вмикаються окремо. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через API Mattermost і приймає callback POST на HTTP-сервері Gateway.

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
    - Якщо `callbackUrl` пропущено, OpenClaw виводить його з хоста/порту Gateway + `callbackPath`.
    - Для налаштувань із кількома обліковими записами `commands` можна задати на верхньому рівні або в `channels.mattermost.accounts.<id>.commands` (значення облікового запису перевизначають поля верхнього рівня).
    - Callback команд перевіряються за токенами окремих команд, які Mattermost повертає, коли OpenClaw реєструє команди `oc_*`.
    - Slash callback завершуються закрито, якщо реєстрація не вдалася, запуск був частковим або токен callback не збігається з однією із зареєстрованих команд.

  </Accordion>
  <Accordion title="Reachability requirement">
    Кінцева точка callback має бути доступною із сервера Mattermost.

    - Не встановлюйте `callbackUrl` у `localhost`, якщо Mattermost не працює на тому самому хості або в тому самому мережевому namespace, що й OpenClaw.
    - Не встановлюйте `callbackUrl` у базову URL-адресу Mattermost, якщо ця URL-адреса не проксіює `/api/channels/mattermost/command` до OpenClaw через reverse proxy.
    - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повернути `405 Method Not Allowed` від OpenClaw, а не `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Якщо ваш callback спрямовано на приватні/tailnet/внутрішні адреси, установіть Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити хост/домен callback.

    Використовуйте записи хоста/домену, а не повні URL-адреси.

    - Добре: `gateway.tailnet-name.ts.net`
    - Погано: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Змінні середовища (обліковий запис за замовчуванням)

Задайте їх на хості Gateway, якщо вам зручніше використовувати змінні середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Інші облікові записи мають використовувати значення конфігурації.

`MATTERMOST_URL` не можна задати з workspace `.env`; див. [файли Workspace `.env`](/uk/gateway/security).
</Note>

## Режими чату

Mattermost автоматично відповідає на приватні повідомлення. Поведінка в каналах керується `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Відповідати в каналах лише за @згадкою.
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

- `onchar` усе одно відповідає на явні @згадки.
- `channels.mattermost.requireMention` підтримується для застарілих конфігурацій, але перевага надається `chatmode`.

## Потоки й сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах лишаються в основному каналі, чи починають потік під дописом, який їх спричинив.

- `off` (за замовчуванням): відповідати в потоці лише тоді, коли вхідний допис уже є в потоці.
- `first`: для дописів верхнього рівня в каналі/групі почати потік під цим дописом і скерувати розмову до сесії, прив’язаної до потоку.
- `all`: наразі така сама поведінка, як `first`, для Mattermost.
- Приватні повідомлення ігнорують це налаштування й залишаються без потоків.

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

- Сесії, прив’язані до потоку, використовують id допису, який їх спричинив, як корінь потоку.
- `first` і `all` наразі еквівалентні, бо щойно Mattermost має корінь потоку, наступні фрагменти та медіа продовжуються в тому самому потоці.

## Контроль доступу (приватні повідомлення)

- За замовчуванням: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Підтвердження через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні приватні повідомлення: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- За замовчуванням: `channels.mattermost.groupPolicy = "allowlist"` (з обмеженням за згадкою).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендовано ID користувачів).
- Перевизначення згадок для окремих каналів розміщуються в `channels.mattermost.groups.<channelId>.requireMention` або `channels.mattermost.groups["*"].requireMention` для значення за замовчуванням.
- Зіставлення `@username` змінне й вмикається лише коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (з обмеженням за згадкою).
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
- `user:<id>` для приватного повідомлення
- `@username` для приватного повідомлення (розв’язується через API Mattermost)

<Warning>
Голі opaque ID (як-от `64ifufp...`) є **неоднозначними** в Mattermost (ID користувача чи ID каналу).

OpenClaw розв’язує їх **спершу як користувача**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` успішний), OpenClaw надсилає **приватне повідомлення**, розв’язуючи direct-канал через `/api/v4/channels/direct`.
- Інакше ID вважається **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).
</Warning>

## Повторна спроба DM-каналу

Коли OpenClaw надсилає повідомлення до цілі Mattermost DM і спершу має розв’язати direct-канал, він за замовчуванням повторює спроби після тимчасових помилок створення direct-каналу.

Використовуйте `channels.mattermost.dmChannelRetry`, щоб налаштувати цю поведінку глобально для plugin Mattermost, або `channels.mattermost.accounts.<id>.dmChannelRetry` для одного облікового запису.

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
- Повторні спроби застосовуються до тимчасових помилок, таких як обмеження частоти, відповіді 5xx, а також мережеві помилки чи тайм-аути.
- Клієнтські помилки 4xx, крім `429`, вважаються постійними й не повторюються.

## Потокова preview-видача

Mattermost транслює міркування, активність інструментів і частковий текст відповіді в один **чернетковий preview-допис**, який фіналізується на місці, коли фінальну відповідь безпечно надіслати. Preview оновлюється на тому самому id допису замість засмічення каналу повідомленнями для кожного фрагмента. Фінальні повідомлення з медіа/помилками скасовують очікувані редагування preview і використовують звичайну доставку замість flush одноразового preview-допису.

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
    - `partial` — звичайний вибір: один preview-допис, який редагується зі зростанням відповіді, а потім фіналізується повною відповіддю.
    - `block` використовує чернеткові фрагменти в стилі append всередині preview-допису.
    - `progress` показує preview стану під час генерації й публікує фінальну відповідь лише після завершення.
    - `off` вимикає потокову preview-видачу.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - Якщо потік не можна фіналізувати на місці (наприклад, допис було видалено посеред потоку), OpenClaw повертається до надсилання нового фінального допису, щоб відповідь не загубилася.
    - Payloads лише з reasoning пригнічуються в дописах каналу, включно з текстом, який надходить як blockquote `> Reasoning:`. Установіть `/reasoning on`, щоб бачити міркування в інших поверхнях; фінальний допис Mattermost зберігає лише відповідь.
    - Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці зіставлення каналів.

  </Accordion>
</AccordionGroup>

## Реакції (інструмент message)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id допису Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до скерованої сесії агента.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнути/вимкнути дії реакцій (за замовчуванням true).
- Перевизначення для окремого облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

## Інтерактивні кнопки (інструмент message)

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

Поля кнопки:

<ParamField path="text" type="string" required>
  Мітка для відображення.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Значення, яке надсилається назад під час натискання (використовується як ID дії).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Стиль кнопки.
</ParamField>

Коли користувач натискає кнопку:

<Steps>
  <Step title="Кнопки замінено підтвердженням">
    Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Так** вибрано @user").
  </Step>
  <Step title="Агент отримує вибір">
    Агент отримує вибір як вхідне повідомлення й відповідає.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Нотатки щодо реалізації">
    - Зворотні виклики кнопок використовують перевірку HMAC-SHA256 (автоматично, конфігурація не потрібна).
    - Mattermost вилучає дані зворотного виклику зі своїх відповідей API (функція безпеки), тому всі кнопки видаляються під час натискання — часткове видалення неможливе.
    - Ідентифікатори дій, що містять дефіси або підкреслення, автоматично очищуються (обмеження маршрутизації Mattermost).

  </Accordion>
  <Accordion title="Конфігурація та доступність">
    - `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб увімкнути опис інструмента кнопок у системному промпті агента.
    - `channels.mattermost.interactions.callbackBaseUrl`: необов’язкова зовнішня базова URL-адреса для зворотних викликів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може напряму дістатися до Gateway за його хостом прив’язки.
    - У налаштуваннях із кількома обліковими записами ви також можете встановити те саме поле в `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw виводить URL-адресу зворотного виклику з `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
    - Правило доступності: URL-адреса зворотного виклику кнопки має бути доступною із сервера Mattermost. `localhost` працює лише тоді, коли Mattermost і OpenClaw запущені на тому самому хості/просторі імен мережі.
    - Якщо ціль зворотного виклику є приватною/tailnet/внутрішньою, додайте її хост/домен до Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Пряма інтеграція з API (зовнішні скрипти)

Зовнішні скрипти та webhooks можуть надсилати кнопки напряму через Mattermost REST API замість використання інструмента `message` агента. За можливості використовуйте `buildButtonAttachments()` із Plugin; якщо надсилаєте необроблений JSON, дотримуйтеся цих правил:

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

1. Вкладення розміщуються в `props.attachments`, а не в `attachments` верхнього рівня (інакше їх мовчки ігнорують).
2. Кожній дії потрібен `type: "button"` — без нього натискання мовчки відкидаються.
3. Кожній дії потрібне поле `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси й підкреслення ламають серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб у повідомленні підтвердження показувалася назва кнопки (наприклад, "Approve"), а не необроблений ID.
6. `context.action_id` обов’язковий — без нього обробник взаємодії повертає 400.

</Warning>

**Генерація токена HMAC**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени, що відповідають логіці перевірки Gateway:

<Steps>
  <Step title="Отримайте secret із токена бота">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Створіть об’єкт context">
    Створіть об’єкт context з усіма полями, **крім** `_token`.
  </Step>
  <Step title="Серіалізуйте з відсортованими ключами">
    Серіалізуйте з **відсортованими ключами** та **без пробілів** (Gateway використовує `JSON.stringify` з відсортованими ключами, що створює компактний вивід).
  </Step>
  <Step title="Підпишіть payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Додайте токен">
    Додайте отриманий шістнадцятковий дайджест як `_token` у context.
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
    - Python `json.dumps` типово додає пробіли (`{"key": "val"}`). Використовуйте `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
    - Завжди підписуйте **всі** поля context (за винятком `_token`). Gateway видаляє `_token`, а потім підписує все, що залишилося. Підписування підмножини спричиняє мовчазний збій перевірки.
    - Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може змінити порядок полів context під час зберігання payload.
    - Отримуйте secret із токена бота (детерміновано), а не з випадкових байтів. Secret має бути однаковим у процесі, який створює кнопки, і в Gateway, який перевіряє.

  </Accordion>
</AccordionGroup>

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який розв’язує назви каналів і користувачів через Mattermost API. Це вмикає цілі `#channel-name` і `@username` в `openclaw message send` та доставках cron/webhook.

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
    - Проблеми з кількома обліковими записами: змінні середовища застосовуються лише до облікового запису `default`.

  </Accordion>
  <Accordion title="Нативні slash-команди не працюють">
    - `Unauthorized: invalid command token.`: OpenClaw не прийняв токен зворотного виклику. Типові причини:
      - реєстрація slash-команди не вдалася або лише частково завершилася під час запуску
      - зворотний виклик потрапляє не в той Gateway/обліковий запис
      - Mattermost досі має старі команди, що вказують на попередню ціль зворотного виклику
      - Gateway перезапустився без повторної активації slash-команд
    - Якщо нативні slash-команди перестають працювати, перевірте журнали на `mattermost: failed to register slash commands` або `mattermost: native slash commands enabled but no commands could be registered`.
    - Якщо `callbackUrl` пропущено, а журнали попереджають, що зворотний виклик розв’язано як `http://127.0.0.1:18789/...`, ця URL-адреса, ймовірно, доступна лише тоді, коли Mattermost працює на тому самому хості/просторі імен мережі, що й OpenClaw. Натомість установіть явний зовнішньо доступний `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Проблеми з кнопками">
    - Кнопки відображаються як білі прямокутники: агент може надсилати некоректно сформовані дані кнопок. Перевірте, що кожна кнопка має поля `text` і `callback_data`.
    - Кнопки відображаються, але натискання нічого не роблять: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, а `EnablePostActionIntegration` має значення `true` у ServiceSettings.
    - Кнопки повертають 404 під час натискання: `id` кнопки, ймовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на не буквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
    - Журнали Gateway показують `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля context (а не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
    - Журнали Gateway показують `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що воно включене під час створення integration payload.
    - Підтвердження показує необроблений ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Установіть для обох однакове очищене значення.
    - Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та шлюз згадок
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
