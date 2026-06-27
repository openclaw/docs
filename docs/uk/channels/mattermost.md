---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
sidebarTitle: Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:12:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Стан: завантажуваний plugin (токен бота + події WebSocket). Канали, групи та DM підтримуються. Mattermost — це платформа командного обміну повідомленнями, яку можна самостійно розгорнути; подробиці про продукт і завантаження див. на офіційному сайті [mattermost.com](https://mattermost.com).

## Встановлення

Встановіть Mattermost перед налаштуванням каналу:

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
    Встановіть `@openclaw/mattermost` за допомогою наведеної вище команди, потім перезапустіть Gateway, якщо він уже запущений.
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

Нативні slash-команди вмикаються явно. Коли їх увімкнено, OpenClaw реєструє slash-команди `oc_*` через API Mattermost і отримує callback POST-запити на HTTP-сервері gateway.

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
    - Callback-запити команд перевіряються за токенами кожної команди, які Mattermost повертає, коли OpenClaw реєструє команди `oc_*`.
    - OpenClaw оновлює поточну реєстрацію команд Mattermost перед прийняттям кожного callback-запиту, тому застарілі токени від видалених або повторно згенерованих slash-команд перестають прийматися без перезапуску gateway.
    - Перевірка callback-запиту завершується закритою відмовою, якщо API Mattermost не може підтвердити, що команда досі актуальна; невдалі перевірки коротко кешуються, паралельні пошуки об’єднуються, а запуск нових пошуків обмежується за частотою для кожної команди, щоб обмежити тиск повторного відтворення.
    - Slash callback-запити завершуються закритою відмовою, коли реєстрація не вдалася, запуск був частковим або токен callback-запиту не відповідає зареєстрованому токену розпізнаної команди (токен, дійсний для однієї команди, не може дійти до upstream-перевірки для іншої команди).

  </Accordion>
  <Accordion title="Reachability requirement">
    Кінцева точка callback має бути доступною із сервера Mattermost.

    - Не встановлюйте `callbackUrl` на `localhost`, якщо Mattermost не працює на тому самому хості/у тому самому мережевому просторі імен, що й OpenClaw.
    - Не встановлюйте `callbackUrl` на базову URL-адресу Mattermost, якщо ця URL-адреса не проксирує `/api/channels/mattermost/command` до OpenClaw через reverse proxy.
    - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повернути `405 Method Not Allowed` від OpenClaw, а не `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Якщо ваш callback націлений на приватні/tailnet/внутрішні адреси, задайте Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити хост/домен callback.

    Використовуйте записи хоста/домену, а не повні URL-адреси.

    - Правильно: `gateway.tailnet-name.ts.net`
    - Неправильно: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Змінні середовища (обліковий запис за замовчуванням)

Задайте їх на хості gateway, якщо віддаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Змінні середовища застосовуються лише до **облікового запису за замовчуванням** (`default`). Інші облікові записи мають використовувати значення конфігурації.

`MATTERMOST_URL` не можна задати з робочого `.env`; див. [робочі файли `.env`](/uk/gateway/security).
</Note>

## Режими чату

Mattermost автоматично відповідає на DM. Поведінка каналу керується `chatmode`:

<Tabs>
  <Tab title="oncall (default)">
    Відповідати в каналах лише за @згадкою.
  </Tab>
  <Tab title="onmessage">
    Відповідати на кожне повідомлення в каналі.
  </Tab>
  <Tab title="onchar">
    Відповідати, коли повідомлення починається з тригерного префікса.
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
- `channels.mattermost.requireMention` враховується для застарілих конфігурацій, але перевага надається `chatmode`.
- Після того як бот надішле видиму відповідь у гілці каналу, подальші повідомлення в цій самій гілці отримуватимуть відповідь без нової @згадки або префікса `onchar`, тому багатокрокові розмови в гілці продовжуватимуться. Участь запам’ятовується на 7 днів неактивності гілки (оновлюється після кожної відповіді) і зберігається після перезапусків gateway. Гілки, які бот лише спостерігав, не змінюються; почніть нове повідомлення верхнього рівня, щоб знову вимагати явну згадку.

## Гілки та сеанси

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в основному каналі, чи починають гілку під дописом, який їх викликав.

- `off` (за замовчуванням): відповідати в гілці лише тоді, коли вхідний допис уже в гілці.
- `first`: для дописів верхнього рівня в каналі/групі починати гілку під цим дописом і маршрутизувати розмову до сеансу, прив’язаного до гілки.
- `all`: така сама поведінка, як `first`, для Mattermost наразі.
- Прямі повідомлення ігнорують це налаштування та залишаються без гілок.

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

- Сеанси, прив’язані до гілки, використовують id допису, який її викликав, як корінь гілки.
- `first` і `all` наразі еквівалентні, тому що щойно Mattermost має корінь гілки, наступні фрагменти й медіа продовжуються в цій самій гілці.

## Контроль доступу (DM)

- За замовчуванням: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код спарювання).
- Підтвердження через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні DM: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` приймає записи `accessGroup:<name>`. Див. [групи доступу](/uk/channels/access-groups).

## Канали (групи)

- За замовчуванням: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадки).
- Дозволяйте відправників через `channels.mattermost.groupAllowFrom` (рекомендовано user ID).
- `channels.mattermost.groupAllowFrom` приймає записи `accessGroup:<name>`. Див. [групи доступу](/uk/channels/access-groups).
- Перевизначення згадок для окремих каналів містяться в `channels.mattermost.groups.<channelId>.requireMention` або `channels.mattermost.groups["*"].requireMention` для значення за замовчуванням.
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

Використовуйте ці формати цілей із `openclaw message send` або cron/webhook:

- `channel:<id>` для каналу
- `user:<id>` для DM
- `@username` для DM (розпізнається через API Mattermost)

<Warning>
Голі непрозорі ID (наприклад, `64ifufp...`) є **неоднозначними** в Mattermost (user ID або channel ID).

OpenClaw розпізнає їх **спочатку як користувача**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` успішний), OpenClaw надсилає **DM**, розпізнаючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID обробляється як **channel ID**.

Якщо потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).
</Warning>

## Повторна спроба для DM-каналу

Коли OpenClaw надсилає повідомлення до цілі DM у Mattermost і спершу має розпізнати прямий канал, він за замовчуванням повторює тимчасові помилки створення прямого каналу.

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
- Повторні спроби застосовуються до тимчасових збоїв, як-от rate limit, відповіді 5xx, а також мережеві помилки або timeout.
- Клієнтські помилки 4xx, окрім `429`, вважаються постійними та не повторюються.

## Потоковий попередній перегляд

Mattermost транслює міркування, активність інструментів і частковий текст відповіді в один **чернетковий допис попереднього перегляду**, який фіналізується на місці, коли фінальну відповідь безпечно надіслати. Попередній перегляд оновлюється в тому самому id допису замість засмічення каналу повідомленнями для кожного фрагмента. Фінальні медіа/помилки скасовують відкладені редагування попереднього перегляду та використовують звичайну доставку замість скидання одноразового допису попереднього перегляду.

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
    - `partial` — звичайний вибір: один допис попереднього перегляду, який редагується в міру зростання відповіді, а потім фіналізується повною відповіддю.
    - `block` використовує чернеткові фрагменти в стилі додавання всередині допису попереднього перегляду.
    - `progress` показує попередній перегляд стану під час генерації та публікує лише фінальну відповідь після завершення.
    - `off` вимикає потоковий попередній перегляд.

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - Якщо потік не можна фіналізувати на місці (наприклад, допис було видалено під час потоку), OpenClaw повертається до надсилання нового фінального допису, щоб відповідь ніколи не втратилася.
    - Payload-и лише з міркуваннями пригнічуються в дописах каналу, включно з текстом, що надходить як blockquote `> Thinking`. Установіть `/reasoning on`, щоб бачити міркування на інших поверхнях; фінальний допис Mattermost зберігає лише відповідь.
    - Див. [потокове передавання](/uk/concepts/streaming#preview-streaming-modes) для матриці зіставлення каналів.

  </Accordion>
</AccordionGroup>

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` із `channel=mattermost`.
- `messageId` — це id допису Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Установіть `remove=true` (boolean), щоб видалити реакцію.
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

Надсилайте повідомлення з кнопками, на які можна натискати. Коли користувач натискає кнопку, агент отримує вибір і може відповісти.

Звичайні відповіді агента також можуть містити семантичні payload-и `presentation`. OpenClaw відображає кнопки значень як інтерактивні кнопки Mattermost, залишає URL-кнопки видимими в тексті повідомлення та понижує меню вибору до читабельного тексту.

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

Поля кнопки:

<ParamField path="text" type="string" required>
  Підпис для відображення.
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
    Агент отримує вибір як вхідне повідомлення та відповідає.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Нотатки щодо реалізації">
    - Callback-и кнопок використовують перевірку HMAC-SHA256 (автоматично, конфігурація не потрібна).
    - Mattermost вилучає callback-дані зі своїх API-відповідей (функція безпеки), тому всі кнопки видаляються після натискання — часткове видалення неможливе.
    - ID дій, що містять дефіси або підкреслення, автоматично санітизуються (обмеження маршрутизації Mattermost).

  </Accordion>
  <Accordion title="Конфігурація та доступність">
    - `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб увімкнути опис інструмента кнопок у системному prompt-і агента.
    - `channels.mattermost.interactions.callbackBaseUrl`: необов’язкова зовнішня базова URL-адреса для callback-ів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може напряму досягти Gateway за його bind-хостом.
    - У конфігураціях із кількома обліковими записами ви також можете задати те саме поле в `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw виводить callback-URL з `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
    - Правило доступності: URL callback-у кнопки має бути доступним із сервера Mattermost. `localhost` працює лише тоді, коли Mattermost і OpenClaw запускаються на одному хості/у тому самому мережевому просторі імен.
    - Якщо ваша ціль callback-у приватна/tailnet/внутрішня, додайте її хост/домен до `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

  </Accordion>
</AccordionGroup>

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти та Webhook-и можуть публікувати кнопки напряму через Mattermost REST API замість проходження через інструмент агента `message`. За можливості використовуйте `buildButtonAttachments()` із Plugin; якщо публікуєте сирий JSON, дотримуйтеся цих правил:

**Структура payload-а:**

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

1. Вкладення мають бути в `props.attachments`, а не в `attachments` верхнього рівня (інакше їх буде мовчки проігноровано).
2. Кожна дія потребує `type: "button"` — без цього натискання мовчки поглинаються.
3. Кожна дія потребує поля `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси та підкреслення ламають серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб повідомлення підтвердження показувало назву кнопки (наприклад, "Approve"), а не сирий ID.
6. `context.action_id` є обов’язковим — обробник взаємодії повертає 400 без нього.

</Warning>

**Генерація HMAC-токена**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени, що відповідають логіці перевірки Gateway:

<Steps>
  <Step title="Виведіть секрет із токена бота">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Побудуйте об’єкт context">
    Побудуйте об’єкт context з усіма полями, **крім** `_token`.
  </Step>
  <Step title="Серіалізуйте з відсортованими ключами">
    Серіалізуйте з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify` з відсортованими ключами, що створює компактний вивід).
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
    - `json.dumps` у Python за замовчуванням додає пробіли (`{"key": "val"}`). Використовуйте `separators=(",", ":")`, щоб відповідати компактному виводу JavaScript (`{"key":"val"}`).
    - Завжди підписуйте **всі** поля context (за винятком `_token`). Gateway видаляє `_token`, а потім підписує все, що залишилося. Підписування підмножини спричиняє мовчазний збій перевірки.
    - Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може змінити порядок полів context під час збереження payload-а.
    - Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет має бути однаковим у процесі, який створює кнопки, і в Gateway, який їх перевіряє.

  </Accordion>
</AccordionGroup>

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який розв’язує назви каналів і користувачів через Mattermost API. Це вмикає цілі `#channel-name` і `@username` в `openclaw message send` та доставках Cron/Webhook.

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
    Переконайтеся, що бот є в каналі, і згадайте його (oncall), використайте префікс-тригер (onchar) або задайте `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Помилки автентифікації або кількох облікових записів">
    - Перевірте токен бота, базову URL-адресу та чи ввімкнено обліковий запис.
    - Проблеми з кількома обліковими записами: змінні env застосовуються лише до облікового запису `default`.

  </Accordion>
  <Accordion title="Нативні slash-команди не працюють">
    - `Unauthorized: invalid command token.`: OpenClaw не прийняв callback-токен. Типові причини:
      - реєстрація slash-команди не вдалася або лише частково завершилася під час запуску
      - callback потрапляє до неправильного Gateway/облікового запису
      - у Mattermost усе ще є старі команди, що вказують на попередню ціль callback-у
      - Gateway перезапустився без повторної активації slash-команд
    - Якщо нативні slash-команди перестають працювати, перевірте журнали на `mattermost: failed to register slash commands` або `mattermost: native slash commands enabled but no commands could be registered`.
    - Якщо `callbackUrl` пропущено, а журнали попереджають, що callback розв’язано в `http://127.0.0.1:18789/...`, ця URL-адреса, ймовірно, доступна лише тоді, коли Mattermost працює на тому самому хості/у тому самому мережевому просторі імен, що й OpenClaw. Натомість задайте явний зовні доступний `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Проблеми з кнопками">
    - Кнопки виглядають як білі прямокутники: агент може надсилати неправильно сформовані дані кнопок. Перевірте, що кожна кнопка має обидва поля `text` і `callback_data`.
    - Кнопки відображаються, але натискання нічого не роблять: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, а `EnablePostActionIntegration` має значення `true` у ServiceSettings.
    - Кнопки повертають 404 після натискання: `id` кнопки, ймовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на небуквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
    - Журнали Gateway містять `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля context (не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
    - Журнали Gateway містять `missing _token in context`: поле `_token` відсутнє в context кнопки. Переконайтеся, що воно включене під час побудови integration payload.
    - Підтвердження показує сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Установіть обидва в однакове санітизоване значення.
    - Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та контроль згадок
- [Спарювання](/uk/channels/pairing) — автентифікація DM і потік спарювання
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
