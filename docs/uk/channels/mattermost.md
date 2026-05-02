---
read_when:
    - Налаштування Mattermost
    - Налагодження маршрутизації Mattermost
sidebarTitle: Mattermost
summary: Налаштування бота Mattermost і конфігурація OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T07:07:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

Статус: завантажуваний plugin (токен бота + події WebSocket). Підтримуються канали, групи та DM. Mattermost — це командна платформа обміну повідомленнями, яку можна розмістити самостійно; подробиці про продукт і завантаження див. на офіційному сайті [mattermost.com](https://mattermost.com).

## Встановлення

Встановіть Mattermost перед налаштуванням каналу:

<Tabs>
  <Tab title="реєстр npm">
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

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

<Steps>
  <Step title="Переконайтеся, що plugin доступний">
    Поточні пакетовані випуски OpenClaw уже містять його. Старіші/кастомні встановлення можуть додати його вручну за допомогою команд вище.
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
  <Accordion title="Нотатки щодо поведінки">
    - `native: "auto"` типово вимкнено для Mattermost. Задайте `native: true`, щоб увімкнути.
    - Якщо `callbackUrl` пропущено, OpenClaw виводить її з хоста/порту gateway + `callbackPath`.
    - Для налаштувань із кількома обліковими записами `commands` можна задати на верхньому рівні або в `channels.mattermost.accounts.<id>.commands` (значення облікового запису перевизначають поля верхнього рівня).
    - Callback-и команд перевіряються за токенами окремих команд, які Mattermost повертає, коли OpenClaw реєструє команди `oc_*`.
    - OpenClaw оновлює поточну реєстрацію команд Mattermost перед прийняттям кожного callback-а, тому застарілі токени з видалених або перегенерованих slash-команд перестають прийматися без перезапуску gateway.
    - Перевірка callback-а завершується із забороною, якщо API Mattermost не може підтвердити, що команда все ще актуальна; невдалі перевірки коротко кешуються, паралельні пошуки об’єднуються, а початок нових пошуків обмежується за частотою для кожної команди, щоб стримати тиск повторного відтворення.
    - Slash-callback-и завершуються із забороною, коли реєстрація не вдалася, запуск був частковим або токен callback-а не збігається із зареєстрованим токеном знайденої команди (токен, чинний для однієї команди, не може дійти до upstream-перевірки для іншої команди).

  </Accordion>
  <Accordion title="Вимога доступності">
    Endpoint callback-а має бути доступним із сервера Mattermost.

    - Не задавайте `callbackUrl` як `localhost`, якщо Mattermost не працює на тому самому хості/у тому самому мережевому просторі імен, що й OpenClaw.
    - Не задавайте `callbackUrl` як базову URL-адресу Mattermost, якщо ця URL-адреса не проксіює `/api/channels/mattermost/command` до OpenClaw через reverse proxy.
    - Швидка перевірка: `curl https://<gateway-host>/api/channels/mattermost/command`; GET має повернути `405 Method Not Allowed` від OpenClaw, а не `404`.

  </Accordion>
  <Accordion title="Allowlist вихідних з’єднань Mattermost">
    Якщо ваш callback націлений на приватні/tailnet/внутрішні адреси, задайте Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`, щоб включити хост/домен callback-а.

    Використовуйте записи хоста/домену, а не повні URL-адреси.

    - Добре: `gateway.tailnet-name.ts.net`
    - Погано: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Змінні середовища (типовий обліковий запис)

Задайте їх на хості gateway, якщо віддаєте перевагу змінним середовища:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Змінні середовища застосовуються лише до **типового** облікового запису (`default`). Інші облікові записи мають використовувати значення конфігурації.

`MATTERMOST_URL` не можна задавати з робочого `.env`; див. [файли `.env` робочої області](/uk/gateway/security).
</Note>

## Режими чату

Mattermost автоматично відповідає на DM. Поведінка каналу керується `chatmode`:

<Tabs>
  <Tab title="oncall (типово)">
    Відповідати в каналах лише при @згадуванні.
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

Нотатки:

- `onchar` усе одно відповідає на явні @згадування.
- `channels.mattermost.requireMention` підтримується для застарілих конфігурацій, але перевага надається `chatmode`.

## Треди й сесії

Використовуйте `channels.mattermost.replyToMode`, щоб керувати тим, чи відповіді в каналах і групах залишаються в основному каналі, чи починають тред під дописом-тригером.

- `off` (типово): відповідати в треді лише тоді, коли вхідний допис уже в ньому.
- `first`: для дописів верхнього рівня в каналі/групі почати тред під цим дописом і маршрутизувати розмову до сесії з областю треду.
- `all`: сьогодні для Mattermost така сама поведінка, як `first`.
- Прямі повідомлення ігнорують це налаштування й залишаються без тредів.

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

Нотатки:

- Сесії з областю треду використовують id допису-тригера як корінь треду.
- `first` і `all` наразі еквівалентні, бо щойно Mattermost має корінь треду, наступні фрагменти й медіа продовжуються в тому самому треді.

## Контроль доступу (DM)

- Типово: `channels.mattermost.dmPolicy = "pairing"` (невідомі відправники отримують код pairing).
- Схваліть через:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Публічні DM: `channels.mattermost.dmPolicy="open"` плюс `channels.mattermost.allowFrom=["*"]`.

## Канали (групи)

- Типово: `channels.mattermost.groupPolicy = "allowlist"` (із вимогою згадування).
- Додавайте відправників до allowlist через `channels.mattermost.groupAllowFrom` (рекомендовано ID користувачів).
- Перевизначення згадувань для кожного каналу розміщуються в `channels.mattermost.groups.<channelId>.requireMention` або `channels.mattermost.groups["*"].requireMention` для типового значення.
- Зіставлення `@username` змінюване й вмикається лише коли `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Відкриті канали: `channels.mattermost.groupPolicy="open"` (із вимогою згадування).
- Нотатка щодо runtime: якщо `channels.mattermost` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

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
Голі непрозорі ID (як-от `64ifufp...`) є **неоднозначними** в Mattermost (ID користувача чи ID каналу).

OpenClaw розв’язує їх **спочатку як користувача**:

- Якщо ID існує як користувач (`GET /api/v4/users/<id>` успішний), OpenClaw надсилає **DM**, розв’язуючи прямий канал через `/api/v4/channels/direct`.
- Інакше ID обробляється як **ID каналу**.

Якщо вам потрібна детермінована поведінка, завжди використовуйте явні префікси (`user:<id>` / `channel:<id>`).
</Warning>

## Повторна спроба каналу DM

Коли OpenClaw надсилає до цілі DM у Mattermost і спершу має розв’язати прямий канал, він типово повторює тимчасові збої створення прямого каналу.

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

Нотатки:

- Це застосовується лише до створення каналу DM (`/api/v4/channels/direct`), а не до кожного виклику API Mattermost.
- Повторні спроби застосовуються до тимчасових збоїв, як-от rate limits, відповіді 5xx і помилки мережі або timeout.
- Клієнтські помилки 4xx, окрім `429`, вважаються постійними й не повторюються.

## Потокове preview

Mattermost транслює thinking, активність інструментів і частковий текст відповіді в єдиний **чернетковий preview-допис**, який фіналізується на місці, коли фінальну відповідь безпечно надсилати. Preview оновлюється в тому самому id допису замість засмічення каналу повідомленнями для кожного фрагмента. Фінальні медіа/помилки скасовують очікувані редагування preview і використовують звичайну доставку замість скидання одноразового preview-допису.

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
    - `partial` — звичайний вибір: один preview-допис, який редагується в міру зростання відповіді, а потім фіналізується повною відповіддю.
    - `block` використовує чернеткові фрагменти в стилі append всередині preview-допису.
    - `progress` показує preview статусу під час генерації й публікує фінальну відповідь лише після завершення.
    - `off` вимикає потокове preview.

  </Accordion>
  <Accordion title="Нотатки щодо поведінки streaming">
    - Якщо stream не можна фіналізувати на місці (наприклад, допис видалено посеред stream), OpenClaw переходить до надсилання нового фінального допису, щоб відповідь ніколи не втрачалася.
    - Payload-и лише з reasoning приховуються з дописів каналу, включно з текстом, який надходить як blockquote `> Reasoning:`. Задайте `/reasoning on`, щоб бачити thinking на інших поверхнях; фінальний допис Mattermost залишає лише відповідь.
    - Див. [Streaming](/uk/concepts/streaming#preview-streaming-modes) для матриці зіставлення каналів.

  </Accordion>
</AccordionGroup>

## Реакції (інструмент message)

- Використовуйте `message action=react` з `channel=mattermost`.
- `messageId` — це id допису Mattermost.
- `emoji` приймає назви на кшталт `thumbsup` або `:+1:` (двокрапки необов’язкові).
- Задайте `remove=true` (boolean), щоб видалити реакцію.
- Події додавання/видалення реакцій пересилаються як системні події до маршрутизованої сесії агента.

Приклади:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Конфігурація:

- `channels.mattermost.actions.reactions`: увімкнути/вимкнути дії реакцій (типово true).
- Перевизначення для облікового запису: `channels.mattermost.accounts.<id>.actions.reactions`.

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
  Мітка відображення.
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
    Усі кнопки замінюються рядком підтвердження (наприклад, "✓ **Так** вибрано @user").
  </Step>
  <Step title="Агент отримує вибір">
    Агент отримує вибір як вхідне повідомлення та відповідає.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Примітки щодо реалізації">
    - Зворотні виклики кнопок використовують перевірку HMAC-SHA256 (автоматично, конфігурація не потрібна).
    - Mattermost видаляє callback data зі своїх API-відповідей (функція безпеки), тому всі кнопки видаляються під час натискання — часткове видалення неможливе.
    - ID дій, що містять дефіси або підкреслення, автоматично очищуються (обмеження маршрутизації Mattermost).

  </Accordion>
  <Accordion title="Конфігурація та доступність">
    - `channels.mattermost.capabilities`: масив рядків можливостей. Додайте `"inlineButtons"`, щоб увімкнути опис інструмента кнопок у системному промпті агента.
    - `channels.mattermost.interactions.callbackBaseUrl`: необов’язковий зовнішній базовий URL для зворотних викликів кнопок (наприклад, `https://gateway.example.com`). Використовуйте це, коли Mattermost не може напряму досягти Gateway за його bind-хостом.
    - У налаштуваннях із кількома обліковими записами також можна встановити те саме поле в `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Якщо `interactions.callbackBaseUrl` пропущено, OpenClaw виводить URL зворотного виклику з `gateway.customBindHost` + `gateway.port`, а потім повертається до `http://localhost:<port>`.
    - Правило доступності: URL зворотного виклику кнопки має бути доступним із сервера Mattermost. `localhost` працює лише тоді, коли Mattermost і OpenClaw працюють на одному хості/у тому самому мережевому просторі імен.
    - Якщо ваша ціль зворотного виклику приватна/tailnet/внутрішня, додайте її хост/домен до Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Пряма інтеграція API (зовнішні скрипти)

Зовнішні скрипти та Webhook-и можуть публікувати кнопки напряму через Mattermost REST API замість проходження через інструмент агента `message`. За можливості використовуйте `buildButtonAttachments()` з Plugin; якщо публікуєте сирий JSON, дотримуйтеся цих правил:

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

1. Вкладення розміщуються в `props.attachments`, а не в `attachments` верхнього рівня (мовчки ігнорується).
2. Кожній дії потрібен `type: "button"` — без нього натискання мовчки відкидаються.
3. Кожній дії потрібне поле `id` — Mattermost ігнорує дії без ID.
4. `id` дії має бути **лише буквено-цифровим** (`[a-zA-Z0-9]`). Дефіси та підкреслення ламають серверну маршрутизацію дій Mattermost (повертає 404). Видаляйте їх перед використанням.
5. `context.action_id` має збігатися з `id` кнопки, щоб повідомлення підтвердження показувало назву кнопки (наприклад, "Approve"), а не сирий ID.
6. `context.action_id` обов’язковий — без нього обробник взаємодії повертає 400.

</Warning>

**Генерація HMAC-токена**

Gateway перевіряє натискання кнопок за допомогою HMAC-SHA256. Зовнішні скрипти мають генерувати токени, що відповідають логіці перевірки Gateway:

<Steps>
  <Step title="Виведіть секрет із токена бота">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Створіть об’єкт контексту">
    Створіть об’єкт контексту з усіма полями, **крім** `_token`.
  </Step>
  <Step title="Серіалізуйте з відсортованими ключами">
    Серіалізуйте з **відсортованими ключами** і **без пробілів** (Gateway використовує `JSON.stringify` з відсортованими ключами, що створює компактний вивід).
  </Step>
  <Step title="Підпишіть payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Додайте токен">
    Додайте отриманий hex digest як `_token` у контекст.
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
    - Завжди підписуйте **всі** поля контексту (мінус `_token`). Gateway видаляє `_token`, а потім підписує все, що залишилося. Підписування підмножини спричиняє мовчазний збій перевірки.
    - Використовуйте `sort_keys=True` — Gateway сортує ключі перед підписуванням, а Mattermost може змінити порядок полів контексту під час збереження payload.
    - Виводьте секрет із токена бота (детерміновано), а не з випадкових байтів. Секрет має бути однаковим у процесі, який створює кнопки, і в Gateway, який перевіряє.

  </Accordion>
</AccordionGroup>

## Адаптер каталогу

Plugin Mattermost містить адаптер каталогу, який розпізнає назви каналів і користувачів через Mattermost API. Це вмикає цілі `#channel-name` і `@username` в `openclaw message send` та доставленнях Cron/Webhook.

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
    Переконайтеся, що бот перебуває в каналі, і згадайте його (oncall), використайте префікс-тригер (onchar) або встановіть `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Помилки автентифікації або кількох облікових записів">
    - Перевірте токен бота, базовий URL і чи ввімкнено обліковий запис.
    - Проблеми з кількома обліковими записами: env vars застосовуються лише до облікового запису `default`.

  </Accordion>
  <Accordion title="Вбудовані slash-команди не працюють">
    - `Unauthorized: invalid command token.`: OpenClaw не прийняв токен зворотного виклику. Типові причини:
      - реєстрація slash-команди не вдалася або лише частково завершилася під час запуску
      - зворотний виклик потрапляє в неправильний Gateway/обліковий запис
      - Mattermost досі має старі команди, що вказують на попередню ціль зворотного виклику
      - Gateway перезапустився без повторної активації slash-команд
    - Якщо вбудовані slash-команди перестали працювати, перевірте логи на `mattermost: failed to register slash commands` або `mattermost: native slash commands enabled but no commands could be registered`.
    - Якщо `callbackUrl` пропущено, а логи попереджають, що зворотний виклик розв’язано в `http://127.0.0.1:18789/...`, цей URL, імовірно, доступний лише тоді, коли Mattermost працює на тому самому хості/у тому самому мережевому просторі імен, що й OpenClaw. Натомість встановіть явний зовні доступний `commands.callbackUrl`.

  </Accordion>
  <Accordion title="Проблеми з кнопками">
    - Кнопки виглядають як білі прямокутники: агент може надсилати неправильно сформовані дані кнопок. Перевірте, що кожна кнопка має обидва поля `text` і `callback_data`.
    - Кнопки відображаються, але натискання нічого не роблять: перевірте, що `AllowedUntrustedInternalConnections` у конфігурації сервера Mattermost містить `127.0.0.1 localhost`, і що `EnablePostActionIntegration` має значення `true` у ServiceSettings.
    - Кнопки повертають 404 під час натискання: `id` кнопки, ймовірно, містить дефіси або підкреслення. Маршрутизатор дій Mattermost ламається на небуквено-цифрових ID. Використовуйте лише `[a-zA-Z0-9]`.
    - Логи Gateway `invalid _token`: невідповідність HMAC. Перевірте, що ви підписуєте всі поля контексту (не підмножину), використовуєте відсортовані ключі та компактний JSON (без пробілів). Див. розділ HMAC вище.
    - Логи Gateway `missing _token in context`: поле `_token` відсутнє в контексті кнопки. Переконайтеся, що воно включене під час побудови integration payload.
    - Підтвердження показує сирий ID замість назви кнопки: `context.action_id` не збігається з `id` кнопки. Встановіть для обох однакове очищене значення.
    - Агент не знає про кнопки: додайте `capabilities: ["inlineButtons"]` до конфігурації каналу Mattermost.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Групи](/uk/channels/groups) — поведінка групового чату та шлюзування згадок
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
