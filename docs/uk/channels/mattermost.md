---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
sidebarTitle: Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-06T04:01:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 784138a30529971b4f80a1a764eef8992f6a8290a6032e34abae864e52dc212b
    source_path: channels/mattermost.md
    workflow: 16
---

Status: завантажуваний Plugin (токен бота + події WebSocket). Підтримуються канали, групи та особисті повідомлення. Mattermost — це самостійно розгортувана платформа командного обміну повідомленнями; подробиці про продукт і завантаження див. на офіційному сайті [mattermost.com](https://mattermost.com).

## Встановлення

Установіть Mattermost перед налаштуванням каналу:

<Tabs>
  <Tab title="реєстр npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="локальна робоча копія">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

<Steps>
  <Step title="Переконайтеся, що Plugin доступний">
    Поточні пакетовані випуски OpenClaw уже включають його. Старіші або власні встановлення можуть додати його вручну за допомогою команд вище.
  </Step>
  <Step title="Створіть бота Mattermost">
    Створіть обліковий запис бота Mattermost і скопіюйте **токен бота**.
  </Step>
  <Step title="Скопіюйте базову URL-адресу">
    Скопіюйте **базову URL-адресу** Mattermost (наприклад, `https://chat.example.com`).
  </Step>
  <Step title="Налаштуйте OpenClaw і запустіть gateway">
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

## Нативні слеш-команди

Нативні слеш-команди вмикаються окремо. Коли їх увімкнено, OpenClaw реєструє слеш-команди `oc_*` через API Mattermost і отримує callback POST-запити на HTTP-сервері gateway.

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
    - Якщо `callbackUrl` пропущено, OpenClaw виводить його з хоста/порту gateway + `callbackPath`.
    - Для налаштувань із кількома обліковими записами `commands` можна задати на верхньому рівні або в `channels.mattermost.accounts.<id>.commands` (значення облікового запису перевизначають поля верхнього рівня).
    - Callback-запити команд перевіряються за токенами окремих команд, які повертає Mattermost, коли OpenClaw реєструє команди `oc_*`.
    - OpenClaw оновлює поточну реєстрацію команд Mattermost перед прийняттям кожного callback-запиту, тому застарілі токени з видалених або повторно згенерованих слеш-команд перестають прийматися без перезапуску gateway.
    - Перевірка callback-запиту відмовляє за замовчуванням, якщо API Mattermost не може підтвердити, що команда досі актуальна; невдалі перевірки коротко кешуються, паралельні запити об’єднуються, а початок свіжих пошуків обмежується за частотою для кожної команди, щоб обмежити тиск повторного відтворення.
    - Слеш-callback-запити відмовляють за замовчуванням, коли реєстрація не вдалася, запуск був частковим або токен callback-запиту не збігається із зареєстрованим токеном визначеної команди (токен, дійсний для однієї команди, не може дійти до upstream-перевірки для іншої команди).

  </Accordion>
  <Accordion title="Вимога доступності">
    Кінцева точка callback має бути доступною із сервера Mattermost.

    - Не задавайте `callbackUrl` як `localhost`, якщо Mattermost не працює на тому самому хості/у тому самому мережевому просторі імен, що й OpenClaw.
    - Не задавайте `callbackUrl` як базову URL-адресу Mattermost, якщо ця URL-адреса не reverse-proxy `/api/channels/mattermost/command` до OpenClaw.
    - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повернути `405 Method Not Allowed` від OpenClaw, а не `404`.

  </Accordion>
  <Accordion title="Allowlist вихідних з’єднань Mattermost">
    Якщо ваш callback націлено на приватні/tailnet/внутрішні адреси, задайте Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити хост/домен callback.

    Використовуйте записи хоста/домену, а не повні URL-адреси.

    - Добре: `gateway.tailnet-name.ts.net`
    - Погано: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Змінні середовища (обліковий запис за замовчуванням)

Задайте їх на хості gateway, якщо віддаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Інші облікові записи мають використовувати значення конфігурації.

`MATTERMOST_URL` не можна задати з робочого простору `.env`; див. [Файли `.env` робочого простору](/uk/gateway/security).
</Note>

## Режими чату

Mattermost автоматично відповідає на особисті повідомлення. Поведінка каналу керується `chatmode`:

<Tabs>
  <Tab title="oncall (за замовчуванням)">
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

- `onchar` все одно відповідає на явні @згадки.
- `channels.mattermost.requireMention` підтримується для застарілих конфігурацій, але перевага надається `chatmode`.

## Потоки та сеанси

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в основному каналі, чи починають потік під дописом-тригером.

- `off` (за замовчуванням): відповідати в потоці лише тоді, коли вхідний допис уже в ньому.
- `first`: для дописів верхнього рівня в каналі/групі почати потік під цим дописом і маршрутизувати розмову до сеансу, прив’язаного до потоку.
- `all`: на сьогодні така сама поведінка, як `first`, для Mattermost.
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

- Сеанси, прив’язані до потоку, використовують id допису-тригера як корінь потоку.
- `first` і `all` наразі еквівалентні, бо щойно Mattermost має корінь потоку, подальші фрагменти й медіа продовжуються в тому самому потоці.

## Керування доступом (особисті повідомлення)

- За замовчуванням: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код спарювання).
- Схвалення через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні особисті повідомлення: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- За замовчуванням: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадки).
- Додавайте відправників до allowlist за допомогою `channels.mattermost.groupAllowFrom` (рекомендовано ID користувачів).
- Перевизначення згадки для окремих каналів розміщуються в `channels.mattermost.groups.<channelId>.requireMention` або `channels.mattermost.groups["*"].requireMention` для значення за замовчуванням.
- Зіставлення `@username` є змінним і вмикається лише коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із вимогою згадки).
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
- `user:<id>` для особистого повідомлення
- `@username` для особистого повідомлення (визначається через API Mattermost)

<Warning>
Голі непрозорі ID (наприклад, `64ifufp...`) є **неоднозначними** в Mattermost (ID користувача або ID каналу).

OpenClaw визначає їх **спершу як користувача**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` успішний), OpenClaw надсилає **особисте повідомлення**, визначивши прямий канал через `/api/v4/channels/direct`.
- Інакше ID вважається **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).
</Warning>

## Повторна спроба каналу особистих повідомлень

Коли OpenClaw надсилає до цілі особистого повідомлення Mattermost і спочатку має визначити прямий канал, він за замовчуванням повторює спроби для тимчасових збоїв створення прямого каналу.

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

- Це застосовується лише до створення каналу особистих повідомлень (`/api/v4/channels/direct`), а не до кожного виклику API Mattermost.
- Повторні спроби застосовуються до тимчасових збоїв, як-от обмеження частоти, відповіді 5xx і помилки мережі або тайм-ауту.
- Клієнтські помилки 4xx, окрім `429`, вважаються постійними й не повторюються.

## Потоковий preview

Mattermost передає міркування, активність інструментів і частковий текст відповіді в один **чернетковий preview-допис**, який фіналізується на місці, коли фінальну відповідь безпечно надіслати. Preview оновлюється в тому самому id допису замість засмічення каналу повідомленнями для кожного фрагмента. Фінали з медіа/помилками скасовують очікувані редагування preview і використовують звичайну доставку замість скидання одноразового preview-допису.

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
  <Accordion title="Режими потокового передавання">
    - `partial` — звичайний вибір: один preview-допис, який редагується в міру зростання відповіді, а потім фіналізується повною відповіддю.
    - `block` використовує чернеткові фрагменти зі стилем додавання всередині preview-допису.
    - `progress` показує preview стану під час генерації й публікує фінальну відповідь лише після завершення.
    - `off` вимикає потоковий preview.

  </Accordion>
  <Accordion title="Примітки щодо поведінки потокового передавання">
    - Якщо потік не можна фіналізувати на місці (наприклад, допис було видалено посеред потоку), OpenClaw повертається до надсилання нового фінального допису, щоб відповідь ніколи не загубилася.
    - Payload-и лише з міркуваннями приглушуються в дописах каналу, включно з текстом, що надходить як blockquote `> Reasoning:`. Установіть `/reasoning on`, щоб бачити міркування на інших поверхнях; фінальний допис Mattermost зберігає лише відповідь.
    - Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці зіставлення каналів.

  </Accordion>
</AccordionGroup>

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` із `channel=mattermost`.
- `messageId` — це id допису Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (логічне значення), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до маршрутизованого сеансу агента.

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
  Відображувана мітка.
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
    Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Yes** selected by @user").
  </Step>
  <Step title="Агент отримує вибір">
    Агент отримує вибір як вхідне повідомлення й відповідає.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Примітки щодо реалізації">
    - Зворотні виклики кнопок використовують перевірку HMAC-SHA256 (автоматично, конфігурація не потрібна).
    - Mattermost прибирає дані зворотного виклику зі своїх відповідей API (функція безпеки), тому всі кнопки видаляються під час натискання - часткове видалення неможливе.
    - ID дій, що містять дефіси або підкреслення, автоматично нормалізуються (обмеження маршрутизації Mattermost).

  </Accordion>
  <Accordion title="Конфігурація та доступність">
    - `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб увімкнути опис інструмента кнопок у системному промпті агента.
    - `channels.mattermost.interactions.callbackBaseUrl`: необов'язкова зовнішня базова URL-адреса для зворотних викликів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може напряму дістатися Gateway за його прив'язаним хостом.
    - У налаштуваннях із кількома обліковими записами також можна встановити те саме поле в `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw виводить URL-адресу зворотного виклику з `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
    - Правило доступності: URL-адреса зворотного виклику кнопки має бути доступною із сервера Mattermost. `localhost` працює лише тоді, коли Mattermost і OpenClaw працюють на одному хості/просторі імен мережі.
    - Якщо ціль зворотного виклику приватна/tailnet/внутрішня, додайте її хост/домен до `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти та webhooks можуть публікувати кнопки напряму через Mattermost REST API замість проходження через інструмент `message` агента. За можливості використовуйте `buildButtonAttachments()` із Plugin; якщо публікуєте необроблений JSON, дотримуйтеся цих правил:

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
            id: "mybutton01", // alphanumeric only - see below
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

1. Вкладення розміщуються в `props.attachments`, а не в `attachments` верхнього рівня (мовчки ігнорується).
2. Кожній дії потрібен `type: "button"` - без нього натискання мовчки відкидаються.
3. Кожній дії потрібне поле `id` - Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише алфавітно-цифровим** (`[a-zA-Z0-9]`). Дефіси та підкреслення ламають серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб повідомлення підтвердження показувало назву кнопки (наприклад, "Approve"), а не необроблений ID.
6. `context.action_id` є обов'язковим - обробник взаємодії повертає 400 без нього.

</Warning>

**Генерування токена HMAC**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени, що відповідають логіці перевірки Gateway:

<Steps>
  <Step title="Виведіть секрет із токена бота">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Побудуйте об'єкт контексту">
    Побудуйте об'єкт контексту з усіма полями, **крім** `_token`.
  </Step>
  <Step title="Серіалізуйте з відсортованими ключами">
    Серіалізуйте з **відсортованими ключами** та **без пробілів** (Gateway використовує `JSON.stringify` з відсортованими ключами, що створює компактний вивід).
  </Step>
  <Step title="Підпишіть payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Додайте токен">
    Додайте отриманий шістнадцятковий digest як `_token` у контекст.
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
    - `json.dumps` у Python типово додає пробіли (`{"key": "val"}`). Використовуйте `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
    - Завжди підписуйте **всі** поля контексту (без `_token`). Gateway прибирає `_token`, а потім підписує все, що залишилося. Підписування підмножини призводить до мовчазного збою перевірки.
    - Використовуйте `sort_keys=True` - Gateway сортує ключі перед підписуванням, а Mattermost може змінити порядок полів контексту під час зберігання payload.
    - Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет має бути однаковим у процесі, який створює кнопки, і в Gateway, який їх перевіряє.

  </Accordion>
</AccordionGroup>

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який розв'язує назви каналів і користувачів через Mattermost API. Це вмикає цілі `#channel-name` і `@username` в `openclaw message send` та доставках cron/webhook.

Конфігурація не потрібна - адаптер використовує токен бота з конфігурації облікового запису.

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

## Усунення неполадок

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
      - у Mattermost досі є старі команди, що вказують на попередню ціль зворотного виклику
      - Gateway перезапустився без повторної активації slash-команд
    - Якщо нативні slash-команди перестали працювати, перевірте журнали на `mattermost: failed to register slash commands` або `mattermost: native slash commands enabled but no commands could be registered`.
    - Якщо `callbackUrl` пропущено, а журнали попереджають, що зворотний виклик визначився як `http://127.0.0.1:18789/...`, ця URL-адреса, ймовірно, доступна лише тоді, коли Mattermost працює на тому самому хості/просторі імен мережі, що й OpenClaw. Натомість установіть явний зовнішньо доступний `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Проблеми з кнопками">
    - Кнопки з'являються як білі блоки: агент може надсилати неправильно сформовані дані кнопок. Перевірте, що кожна кнопка має поля `text` і `callback_data`.
    - Кнопки відображаються, але натискання нічого не робить: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, і що `EnablePostActionIntegration` має значення `true` у ServiceSettings.
    - Кнопки повертають 404 під час натискання: `id` кнопки, ймовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на неалфавітно-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
    - Журнали Gateway показують `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля контексту (а не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Дивіться розділ HMAC вище.
    - Журнали Gateway показують `missing _token in context`: поля `_token` немає в контексті кнопки. Переконайтеся, що його включено під час побудови integration payload.
    - Підтвердження показує необроблений ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Установіть для обох однакове нормалізоване значення.
    - Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Маршрутизація каналів](/uk/channels/channel-routing) - маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) - усі підтримувані канали
- [Групи](/uk/channels/groups) - поведінка групового чату та фільтрація згадок
- [Сполучення](/uk/channels/pairing) - автентифікація DM і процес сполучення
- [Безпека](/uk/gateway/security) - модель доступу та посилення захисту
