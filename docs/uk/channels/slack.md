---
read_when:
    - Налаштування Slack або налагодження сокетного/HTTP-режиму Slack
summary: Налаштування Slack і поведінка під час виконання (режим сокетів + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-04-29T03:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cad48c342c4edf0857d79264e5a3213e58b8f5cde6bd04fa11eca1c969a8f1a
    source_path: channels/slack.md
    workflow: 16
---

Готово для виробництва для DM і каналів через інтеграції Slack app. Типовий режим — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Slack DM типово використовують режим сполучення.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та playbook-и відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (типово)">
    <Steps>
      <Step title="Створіть новий Slack app">
        У налаштуваннях Slack app натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть workspace для вашого app
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - встановіть app і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Резервний env-варіант (лише типовий обліковий запис):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Створіть новий Slack app">
        У налаштуваннях Slack app натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть workspace для вашого app
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - встановіть app і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Використовуйте унікальні шляхи Webhook для HTTP із кількома обліковими записами

        Надайте кожному обліковому запису окремий `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували.
        </Note>

      </Step>

      <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Налаштування транспорту Socket Mode

OpenClaw типово встановлює для клієнта Slack SDK тайм-аут pong 15 секунд для Socket Mode. Перевизначайте налаштування транспорту лише тоді, коли потрібне налаштування під конкретний workspace або хост:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Використовуйте це лише для workspace-ів Socket Mode, які логують тайм-аути Slack websocket pong/server-ping, або працюють на хостах із відомим голодуванням event loop. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — це очікування ping-ів від сервера Slack. Повідомлення app і події залишаються станом застосунку, а не сигналами справності транспорту.

## Контрольний список маніфесту та scope-ів

Базовий маніфест Slack app однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` slash-команди).

Базовий маніфест (типово Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Для режиму **HTTP Request URLs** замініть `settings` на HTTP-варіант і додайте `url` до кожної slash-команди. Потрібен публічний URL:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Додаткові налаштування маніфесту

Показуйте різні функції, які розширюють наведені вище типові значення.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Кілька [нативних slash-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше ніж 25 slash-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (типово)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Використовуйте той самий список `slash_commands`, що й для Socket Mode вище, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необов’язкові scope-и авторства (операції запису)">
    Додайте bot-scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та іконку) замість типової ідентичності Slack app.

    Якщо ви використовуєте emoji-іконку, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові user-token scope-и (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типові scope-и читання:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви залежите від читання пошуку Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- `botToken` + `appToken` потрібні для Socket Mode.
- HTTP-режим потребує `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають plaintext-рядки
  або об’єкти SecretRef.
- Токени конфігурації перевизначають резервний env-варіант.
- Резервний env-варіант `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до типового облікового запису.
- `userToken` (`xoxp-...`) налаштовується лише в конфігурації (без резервного env-варіанту) і типово використовує поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status` для кожних облікових даних
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус — це `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секретів, але поточний шлях команди/runtime
  не зміг визначити фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  обов’язкова пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу токен користувача може мати перевагу, коли його налаштовано. Для записів перевага й надалі надається токену бота; записи через токен користувача дозволені лише коли `userTokenReadOnly: false`, а токен бота недоступний.
</Tip>

## Дії та шлюзи

Дії Slack керуються `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | За замовчуванням |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ID файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередні перегляди зображень для зображень або метадані локального файла для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом DM (застаріле: `channels.slack.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (за замовчуванням true)
    - `channels.slack.allowFrom` (бажано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM за замовчуванням false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Pairing у DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналу">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розміщується в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка щодо runtime: якщо `channels.slack` повністю відсутній (налаштування лише через env), runtime повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Розпізнавання імен/ID:

    - записи allowlist каналів і записи allowlist DM розпізнаються під час запуску, коли доступ токена це дозволяє
    - нерозпізнані записи з іменами каналів зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням спершу використовують ID; пряме зіставлення за іменем користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналу">
    Повідомлення каналу за замовчуванням проходять через шлюз згадок.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - неявна поведінка гілки reply-to-bot (вимкнено, коли `thread.requireExplicitMention` дорівнює `true`)

    Поканальні елементи керування (`channels.slack.channels.<id>`; імена лише через розпізнавання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса й надалі зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Гілки, сесії та теги відповідей

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- З типовим `session.dmScope=main` DM Slack згортаються до головної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в гілках можуть створювати суфікси сесій гілок (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує кількістю наявних повідомлень гілки, які отримуються під час запуску нової сесії гілки (за замовчуванням `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (за замовчуванням `false`): коли `true`, пригнічує неявні згадки в гілці, щоб бот відповідав лише на явні згадки `@bot` у гілках, навіть якщо бот уже брав участь у гілці. Без цього відповіді в гілці, де брав участь бот, обходять шлюз `requireMention`.

Елементи керування відповідями в гілках:

- `channels.slack.replyToMode`: `off|first|all|batched` (за замовчуванням `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий fallback для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** відповіді в гілках у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги й надалі враховуються в режимі `"off"`. Гілки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими inline.
</Note>

## Ack-реакції

`ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Текстовий streaming

`channels.slack.streaming` керує поведінкою live preview:

- `off`: вимкнути streaming live preview.
- `partial` (за замовчуванням): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати chunked-оновлення попереднього перегляду.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чернетковий попередній перегляд, спрямовує оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативним текстовим streaming Slack, коли `channels.slack.streaming.mode` дорівнює `partial` (за замовчуванням: `true`).

- Для появи нативного текстового streaming і статусу гілки Slack assistant має бути доступна гілка відповіді. Вибір гілки й надалі дотримується `replyToMode`.
- Корені каналів і групових чатів можуть і надалі використовувати звичайний чернетковий попередній перегляд, коли нативний streaming недоступний.
- DM Slack верхнього рівня за замовчуванням залишаються поза гілками, тому не показують попередній перегляд у стилі гілки; використовуйте відповіді в гілці або `typingReaction`, якщо хочете бачити там видимий прогрес.
- Медіа та нетекстові payload-и повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні фінальні текстові/block-повідомлення скидаються лише коли можуть редагувати попередній перегляд на місці.
- Якщо streaming завершується помилкою посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload-ів.

Використовуйте чернетковий попередній перегляд замість нативного текстового streaming Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Застарілі ключі:

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрується до `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` автоматично мігрується до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` автоматично мігрується до `channels.slack.streaming.nativeTransport`.

## Fallback реакції набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в гілках, які використовують типовий індикатор статусу "is typing...".

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується best-effort, а cleanup автоматично виконується після завершення відповіді або шляху помилки.

## Медіа, chunking і доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL, розміщених у Slack (потік запиту з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне й обмеження розміру це дозволяють. Заповнювачі файлів включають `fileId` Slack, щоб агенти могли отримати оригінальний файл через `download-file`.

    Завантаження використовують обмежені idle-таймаути й загальні таймаути. Якщо отримання файлу Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файла.

    Runtime-ліміт розміру вхідних даних за замовчуванням становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові chunks використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ із пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в гілках (`thread_ts`)
    - ліміт вихідних медіа дотримується `channels.slack.mediaMaxMb`, коли налаштовано; інакше надсилання в канали використовує типові значення MIME-kind з медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM Slack відкриваються через API розмов Slack під час надсилання до цілей користувачів.

  </Accordion>
</AccordionGroup>

## Команди та slash-поведінка

Slash-команди з’являються в Slack як одна налаштована команда або кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових параметрів маніфесту](#additional-manifest-settings) у вашому застосунку Slack і натомість вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим нативних команд **вимкнено** для Slack, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Меню нативних аргументів використовують адаптивну стратегію рендерингу, яка показує модальне підтвердження перед відправленням вибраного значення опції:

- до 5 опцій: button blocks
- 6-100 опцій: static select menu
- понад 100 опцій: external select з async-фільтрацією опцій, коли доступні handlers опцій interactivity
- перевищені ліміти Slack: закодовані значення опцій повертаються до buttons

```txt
/think
```

Slash-сесії використовують ізольовані ключі, як-от `agent:<agentId>:slack:slash:<userId>`, і надалі маршрутизують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може рендерити створені агентом елементи керування інтерактивними відповідями, але ця функція за замовчуванням вимкнена.

Увімкніть її глобально:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Або ввімкніть її лише для одного облікового запису Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Коли ввімкнено, агенти можуть видавати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються у Slack Block Kit і маршрутизують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це специфічний для Slack UI. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback є непрозорими токенами, згенерованими OpenClaw, а не сирими значеннями, створеними агентом.
- Якщо згенеровані інтерактивні блоки перевищили б ліміти Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload блоків.

## Схвалення exec у Slack

Slack може працювати як нативний клієнт схвалень з інтерактивними кнопками та взаємодіями, замість повернення до Web UI або термінала.

- Схвалення exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналу.
- Схвалення Plugin усе ще можуть оброблятися через ту саму нативну для Slack поверхню кнопок, коли запит уже потрапляє в Slack і тип approval id є `plugin:`.
- Авторизація схвалювача все ще застосовується: лише користувачі, визначені як схвалювачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок схвалення, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашої програми Slack, запити на схвалення відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що схвалення
в чаті недоступні або ручне схвалення є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; повертається до `commands.ownerAllowFrom`, коли можливо)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, стандартно: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні схвалення exec, коли `enabled` не задано або має значення `"auto"` і принаймні один
схвалювач визначається. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт схвалень.
Установіть `enabled: true`, щоб примусово ввімкнути нативні схвалення, коли схвалювачі визначаються.

Стандартна поведінка без явної конфігурації схвалення exec у Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна для Slack конфігурація потрібна лише тоді, коли потрібно перевизначити схвалювачів, додати фільтри або
увімкнути доставку в чат походження:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Спільне перенаправлення `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на схвалення exec також мають
маршрутизуватися в інші чати або явні позасмугові цілі. Спільне перенаправлення `approvals.plugin` також
є окремим; нативні для Slack кнопки все ще можуть обробляти схвалення Plugin, коли ці запити вже потрапляють
у Slack.

Same-chat `/approve` також працює в каналах Slack і DM, які вже підтримують команди. Див. [Схвалення exec](/uk/tools/exec-approvals), щоб переглянути повну модель перенаправлення схвалень.

## Події та операційна поведінка

- Редагування/видалення повідомлень відображаються в системні події.
- Трансляції тредів (відповіді в тредах "Also send to channel") обробляються як звичайні повідомлення користувачів.
- Події додавання/видалення реакцій відображаються в системні події.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення відображаються в системні події.
- `channel_id_changed` може переносити ключі конфігурації каналу, коли `configWrites` увімкнено.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути впроваджені в контекст маршрутизації.
- Автор треду та початкове наповнення контексту історією треду фільтруються налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і модальні взаємодії породжують структуровані системні події `Slack interaction: ...` з багатими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` з метаданими маршрутизованого каналу та введеннями форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Важливі поля Slack">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (break-glass; тримайте вимкненим, якщо не потрібно)
- доступ до каналу: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по черзі:

    - `groupPolicy`
    - allowlist каналу (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` для окремого каналу

    Корисні команди:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Повідомлення DM ігноруються">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - схвалення pairings / записи allowlist
    - події Slack Assistant DM: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію Assistant-thread без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте токени bot + app і ввімкнення Socket Mode у налаштуваннях програми Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточний runtime не зміг визначити значення, підкріплене SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється в snapshots
    облікового запису, HTTP-обліковий запис налаштовано, але поточний runtime не зміг
    визначити signing secret, підкріплений SecretRef.

  </Accordion>

  <Accordion title="Native/slash команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - нативний режим команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник щодо vision для вкладень

Slack може прикріплювати завантажені медіа до ходу агента, коли завантаження файлів Slack успішні й ліміти розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою vision; інші файли зберігаються як завантажуваний файловий контекст, а не обробляються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                     | Джерело               | Поточна поведінка                                                                  | Примітки                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack       | Завантажується та прикріплюється до ходу для обробки з підтримкою vision                   | Ліміт на файл: `channels.slack.mediaMaxMb` (стандартно 20 MB)                 |
| Файли PDF                      | URL файлу Slack       | Завантажується і надається як файловий контекст для інструментів, таких як `download-file` або `pdf` | Вхідний потік Slack не перетворює PDF на вхід image-vision автоматично |
| Інші файли                    | URL файлу Slack       | Завантажуються, коли можливо, і надаються як файловий контекст                              | Бінарні файли не обробляються як вхідні зображення                               |
| Відповіді в треді                 | Файли автора треду | Файли кореневого повідомлення можуть бути завантажені як контекст, коли відповідь не має прямих медіа  | Автори лише з файлами використовують placeholder вкладення                          |
| Повідомлення з кількома зображеннями           | Кілька файлів Slack | Кожен файл оцінюється незалежно                                              | Обробка Slack обмежена вісьмома файлами на повідомлення                     |

### Вхідний pipeline

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватного URL Slack, використовуючи токен bot (`xoxb-...`).
2. Файл успішно записується до media store.
3. Шляхи завантажених медіа та типи вмісту додаються до вхідного контексту.
4. Шляхи моделі/інструмента з підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або медіапосилання для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня треду

Коли повідомлення надходить у треді (має батьківський `thread_ts`):

- Якщо сама відповідь не має прямих медіа, а включене кореневе повідомлення має файли, Slack може завантажити кореневі файли як контекст автора треду.
- Прямі вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється placeholder вкладення, щоб fallback усе ще міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через media pipeline.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у payload події.
- Збій завантаження одного вкладення не блокує інші.

### Ліміти розміру, завантаження та моделі

- **Ліміт розміру**: стандартно 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Збої завантаження**: файли, які Slack не може надати, URL із простроченим терміном дії, недоступні файли, надто великі файли та HTML-відповіді Slack auth/login пропускаються замість повідомлення як непідтримувані формати.
- **Vision модель**: аналіз зображень використовує активну модель відповіді, коли вона підтримує vision, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                               | Поточна поведінка                                                             | Обхідний шлях                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL файлу Slack із простроченим терміном дії                 | Файл пропущено; помилка не показується                                                 | Повторно завантажте файл у Slack                                                |
| Vision модель не налаштована            | Вкладення зображень зберігаються як медіапосилання, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використовуйте модель відповіді з підтримкою vision |
| Дуже великі зображення (> 20 MB стандартно) | Пропускаються відповідно до ліміту розміру                                                         | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                       |
| Переслані/поширені вкладення           | Текст і розміщені в Slack медіа зображень/файлів обробляються за принципом best-effort                       | Повторно поділіться безпосередньо в треді OpenClaw                                   |
| PDF-вкладення                        | Зберігаються як файловий/медіаконтекст, не маршрутизуються автоматично через image vision  | Використовуйте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF   |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення візуального аналізу вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Перевірка в реальному середовищі: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Slack зі шлюзом.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових особистих повідомлень.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення агентам.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритетність.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
