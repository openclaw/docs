---
read_when:
    - Налаштування Slack або налагодження сокетного/HTTP-режиму Slack
summary: Налаштування Slack і поведінка під час виконання (режим Socket + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

Готово до production-використання для DM і каналів через інтеграції застосунку Slack. Режим за замовчуванням — Socket Mode; URL-адреси HTTP-запитів також підтримуються.

<CardGroup cols={3}>
  <Card title="Спарювання" icon="link" href="/uk/channels/pairing">
    DM у Slack за замовчуванням використовують режим спарювання.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення неполадок каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть workspace для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - встановіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Налаштуйте OpenClaw">

        Рекомендоване налаштування SecretRef:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Резервний варіант через env (лише обліковий запис за замовчуванням):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Запустіть gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL-адреси HTTP-запитів">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть workspace для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - встановіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Налаштуйте OpenClaw">

        Рекомендоване налаштування SecretRef:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Використовуйте унікальні шляхи webhook для HTTP із кількома обліковими записами

        Надайте кожному обліковому запису окремий `webhookPath` (за замовчуванням `/slack/events`), щоб реєстрації не конфліктували.
        </Note>

      </Step>

      <Step title="Запустіть gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Налаштування транспорту Socket Mode

OpenClaw за замовчуванням встановлює для клієнта Slack SDK тайм-аут pong у 15 секунд для Socket Mode. Перевизначайте параметри транспорту лише тоді, коли потрібне налаштування для конкретного workspace або хоста:

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

Використовуйте це лише для workspace у Socket Mode, які реєструють тайм-аути pong/server-ping websocket Slack або працюють на хостах із відомим голодуванням event loop. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення та події застосунку залишаються станом застосунку, а не сигналами працездатності транспорту.

## Контрольний список маніфесту й scope

Базовий маніфест застосунку Slack однаковий для Socket Mode і URL-адрес HTTP-запитів. Відрізняється лише блок `settings` (і `url` slash-команди).

Базовий маніфест (Socket Mode за замовчуванням):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
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

Для режиму **URL-адрес HTTP-запитів** замініть `settings` на HTTP-варіант і додайте `url` до кожної slash-команди. Потрібна публічна URL-адреса:

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
        "app_home_opened",
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

Увімкніть інші функції, що розширюють наведені вище значення за замовчуванням.

Маніфест за замовчуванням вмикає вкладку Slack App Home **Home** і підписується на `app_home_opened`. Коли учасник workspace відкриває вкладку Home, OpenClaw публікує безпечний стандартний вигляд Home через `views.publish`; payload розмови або приватна конфігурація не включаються. Вкладка **Messages** залишається ввімкненою для DM у Slack.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Кілька [нативних slash-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з нюансами:

    - Використовуйте `/agentstatus` замість `/status`, бо команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 slash-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (за замовчуванням)">

```json
{
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL-адреси HTTP-запитів">
        Використовуйте той самий список `slash_commands`, що й для Socket Mode вище, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

```json
{
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
  ]
}
```

        Повторіть це значення `url` для кожної команди у списку.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необов’язкові області авторства (операції запису)">
    Додайте область бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та іконку) замість стандартної ідентичності застосунку Slack.

    Якщо ви використовуєте іконку-емодзі, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові області токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими областями читання є:

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
- Режим HTTP потребує `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Токени конфігурації перевизначають резервні значення env.
- Резервне значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до стандартного облікового запису.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного значення env) і типово має поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Інспекція облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан має значення `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секрету, але поточна команда чи шлях виконання
  не змогли отримати фактичне значення.
- У режимі HTTP включено `signingSecretStatus`; у Socket Mode
  обов’язкова пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій і читання каталогу перевага може надаватися токену користувача, якщо його налаштовано. Для запису пріоритетним залишається токен бота; записи через токен користувача дозволені лише коли `userTokenReadOnly: false` і токен бота недоступний.
</Tip>

## Дії та шлюзи

Дії Slack контролюються через `channels.slack.actions.*`.

Доступні групи дій у поточних інструментах Slack:

| Група      | Типово |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ID файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередні перегляди зображень для зображень або метадані локального файлу для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` — канонічний allowlist для DM.

    - `pairing` (типово)
    - `allowlist`
    - `open` (вимагає, щоб `channels.slack.allowFrom` містив `"*"`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритетність для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` переносить їх до `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Pairing у DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналу">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розміщується в `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад, `C12345678`) як ключі конфігурації.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне `groupPolicy="allowlist"` і записується попередження (навіть якщо `channels.defaults.groupPolicy` задано).

    Розв’язання імені/ID:

    - записи allowlist каналів і записи allowlist DM розв’язуються під час запуску, коли доступ токена це дозволяє
    - нерозв’язані записи назв каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів типово спершу використовують ID; пряме зіставлення імені користувача/slug вимагає `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** збігаються за `groupPolicy: "allowlist"`. Пошук каналу типово спершу використовує ID, тому ключ на основі імені ніколи не маршрутизуватиметься успішно, і всі повідомлення в цьому каналі буде мовчки заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, а ключ на основі імені здається робочим.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою миші → **Copy link** — ID (`C...`) з’являється в кінці URL.

    Правильно:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Неправильно (тихо заблоковано за `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    Повідомлення каналів за замовчуванням допускаються лише за наявності згадки.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач-бот є учасником цієї групи користувачів; потребує `usergroups:read`
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді боту (вимкнено, коли `thread.requireExplicitMention` має значення `true`)

    Керування для окремого каналу (`channels.slack.channels.<id>`; імена лише через розпізнавання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса й далі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише тоді, коли бот-відправник явно вказаний в allowlist `users` цієї кімнати, або коли принаймні один явний ідентифікатор власника Slack з `channels.slack.allowFrom` зараз є учасником кімнати. Wildcard і записи власника за відображуваним іменем не задовольняють наявність власника. Наявність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідний scope читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників не вдається, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Треди, сеанси й теги відповіді

- Особисті повідомлення маршрутизуються як `direct`; канали як `channel`; багатокористувацькі особисті повідомлення як `group`.
- Прив'язки маршрутів Slack приймають сирі ідентифікатори співрозмовників, а також форми цілі Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- З типовим `session.dmScope=main` особисті повідомлення Slack згортаються до основного сеансу агента.
- Сеанси каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сеансу треду (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень треду отримується під час запуску нового сеансу треду (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, пригнічує неявні згадки в треді, тож бот відповідає лише на явні згадки `@bot` у тредах, навіть якщо бот уже брав участь у треді. Без цього відповіді в треді за участю бота обходять перевірку `requireMention`.

Керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги й далі враховуються в режимі `"off"`. Треди Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими в рядку.
</Note>

## Реакції підтвердження

`ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розв'язання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcode (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою live preview:

- `off`: вимкнути потокове передавання live preview.
- `partial` (типово): замінювати текст preview найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення preview.
- `progress`: показувати текст статусу перебігу під час генерування, а потім надіслати фінальний текст.
- `streaming.preview.toolProgress`: коли draft preview активний, спрямовувати оновлення інструментів/перебігу в те саме редаговане повідомлення preview (типово: `true`). Установіть `false`, щоб зберігати окремі повідомлення інструментів/перебігу.
- `streaming.preview.commandText` / `streaming.progress.commandText`: установіть `status`, щоб зберігати компактні рядки перебігу інструментів, приховуючи сирий текст команд/виконання (типово: `raw`).

Приховати сирий текст команд/виконання, зберігаючи компактні рядки перебігу:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` керує нативним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (типово: `true`).

- Для появи нативного потокового передавання тексту й статусу треду асистента Slack має бути доступний тред відповіді. Вибір треду й далі дотримується `replyToMode`.
- Канали, групові чати й кореневі повідомлення особистих повідомлень верхнього рівня й далі можуть використовувати звичайний draft preview, коли нативне потокове передавання недоступне або тред відповіді не існує.
- Особисті повідомлення Slack верхнього рівня за замовчуванням лишаються поза тредом, тому вони не показують нативний stream/status preview у стилі треду Slack; натомість OpenClaw публікує й редагує draft preview в особистому повідомленні.
- Медіа й нетекстові payload повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування preview; придатні фінальні тексти/блоки скидаються лише тоді, коли можуть редагувати preview на місці.
- Якщо потокове передавання зазнає помилки посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload.

Використовувати draft preview замість нативного потокового передавання тексту Slack:

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

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в тредах, які використовують стандартний індикатор стану "набирає текст...".

Порядок вирішення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує короткі коди (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується за принципом найкращих зусиль, а очищення автоматично виконується після завершення відповіді або шляху помилки.

## Медіа, розбиття на фрагменти та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне та обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл за допомогою `download-file`.

    Завантаження використовують обмежені тайм-аути простою та загальні тайм-аути. Якщо отримання файлу Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файлу.

    Стандартне обмеження розміру вхідних даних під час виконання становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (стандартно 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ із пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа дотримується `channels.slack.mediaMaxMb`, коли налаштовано; інакше надсилання в канал використовує стандартні значення MIME-виду з медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Текстові або лише блокові DM Slack можуть публікуватися безпосередньо за ID користувачів; завантаження файлів і надсилання в тредах спершу відкривають DM через API розмов Slack, оскільки ці шляхи потребують конкретного ID розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash

Slash-команди відображаються в Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити стандартні значення команд:

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

Меню нативних аргументів використовують адаптивну стратегію рендерингу, яка показує модальне підтвердження перед передаванням вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронною фільтрацією опцій, коли доступні обробники параметрів інтерактивності
- перевищено ліміти Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Slash-сесії використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно спрямовують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати створені агентом інтерактивні елементи керування відповідями, але ця функція стандартно вимкнена.

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

Або увімкніть її лише для одного облікового запису Slack:

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

Ці директиви компілюються в Slack Block Kit і спрямовують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищили б ліміти Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного корисного навантаження блоків.

## Схвалення exec у Slack

Slack може працювати як нативний клієнт схвалень з інтерактивними кнопками та взаємодіями, замість повернення до Web UI або термінала.

- Схвалення exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналом.
- Схвалення Plugin усе ще можуть вирішуватися через ту саму нативну поверхню кнопок Slack, коли запит уже потрапляє в Slack, а вид ID схвалення — `plugin:`.
- Авторизація схвалювача все одно застосовується: лише користувачі, визначені як схвалювачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок схвалення, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на схвалення відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що чат-схвалення
недоступні або ручне схвалення є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, стандартно: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні схвалення exec, коли `enabled` не задано або має значення `"auto"` і принаймні один
схвалювач визначається. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт схвалень.
Установіть `enabled: true`, щоб примусово ввімкнути нативні схвалення, коли визначаються схвалювачі.

Стандартна поведінка без явної конфігурації схвалень exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити схвалювачів, додати фільтри або
увімкнути доставку в початковий чат:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити схвалення exec також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack все ще можуть вирішувати схвалення Plugin, коли ці запити вже потрапляють
у Slack.

`/approve` у тому самому чаті також працює в каналах Slack і DM, які вже підтримують команди. Див. [Схвалення exec](/uk/tools/exec-approvals), щоб ознайомитися з повною моделлю переспрямування схвалень.

## Події та операційна поведінка

- Редагування/видалення повідомлень відображаються в системні події.
- Трансляції тредів (відповіді в треді "Також надіслати в канал") обробляються як звичайні повідомлення користувачів.
- Події додавання/видалення реакцій відображаються в системні події.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення відображаються в системні події.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли `configWrites` увімкнено.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути інжектовані в контекст маршрутизації.
- Початковий допис треду та початкове заповнення контексту історії треду фільтруються налаштованими списками дозволених відправників, коли це застосовно.
- Дії блоків і модальні взаємодії створюють структуровані системні події `Slack interaction: ...` з насиченими полями корисного навантаження:
  - дії блоків: вибрані значення, мітки, значення вибирача та метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеннями форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (break-glass; тримайте вимкненим, якщо не потрібно)
- доступ до каналу: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по порядку:

    - `groupPolicy`
    - список дозволених каналів (`channels.slack.channels`) — **ключі мають бути ID каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв непомітно не спрацьовують із `groupPolicy: "allowlist"`, оскільки маршрутизація каналів стандартно спершу використовує ID. Щоб знайти ID: клацніть канал у Slack правою кнопкою → **Копіювати посилання** — значення `C...` наприкінці URL є ID каналу.
    - `requireMention`
    - поканальний список дозволених `users`

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
    - схвалення спарювання / записи списку дозволених
    - події DM Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію треду Assistant без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте токени бота й застосунку та ввімкнення Socket Mode у налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштований, але поточне середовище виконання не змогло визначити значення,
    підкріплене SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - секрет підпису
    - шлях Webhook
    - URL запитів Slack (події + інтерактивність + Slash Commands)
    - унікальний `webhookPath` для кожного облікового запису HTTP

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється в знімках
    облікових записів, обліковий запис HTTP налаштований, але поточне середовище виконання не змогло
    визначити секрет підпису, підкріплений SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали намір використати:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і списки дозволених каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник vision для вкладень

Slack може приєднувати завантажені медіа до ходу агента, коли завантаження файлів Slack успішні та обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповідей з підтримкою vision; інші файли зберігаються як завантажуваний файловий контекст, а не обробляються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                      | Джерело              | Поточна поведінка                                                                  | Примітки                                                                 |
| ------------------------------ | -------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack      | Завантажуються й долучаються до ходу для обробки з підтримкою зору                | Ліміт на файл: `channels.slack.mediaMaxMb` (за замовчуванням 20 MB)      |
| Файли PDF                      | URL файлу Slack      | Завантажуються й надаються як файловий контекст для інструментів, як-от `download-file` або `pdf` | Вхідні повідомлення Slack не перетворюють PDF автоматично на вхідні дані для зору за зображеннями |
| Інші файли                     | URL файлу Slack      | Завантажуються, коли це можливо, і надаються як файловий контекст                 | Двійкові файли не обробляються як вхідні зображення                     |
| Відповіді в гілці              | Файли початкового повідомлення гілки | Файли кореневого повідомлення можуть бути завантажені як контекст, коли відповідь не має власних медіа | Початкові повідомлення лише з файлами використовують placeholder вкладення |
| Повідомлення з кількома зображеннями | Кілька файлів Slack  | Кожен файл оцінюється незалежно                                                    | Обробка Slack обмежена вісьмома файлами на повідомлення                 |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватної URL-адреси Slack за допомогою токена бота (`xoxb-...`).
2. Після успішного завантаження файл записується до сховища медіа.
3. Шляхи завантажених медіа й типи вмісту додаються до вхідного контексту.
4. Шляхи моделей/інструментів із підтримкою зору можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня гілки

Коли повідомлення надходить у гілці (має батьківський `thread_ts`):

- Якщо сама відповідь не має власних медіа, а включене кореневе повідомлення має файли, Slack може завантажити кореневі файли як контекст початкового повідомлення гілки.
- Безпосередні вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється placeholder вкладення, щоб fallback усе ще міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через конвеєр медіа.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у payload події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження й моделі

- **Ліміт розміру**: За замовчуванням 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: Файли, які Slack не може надати, прострочені URL-адреси, недоступні файли, завеликі файли та HTML-відповіді автентифікації/входу Slack пропускаються замість того, щоб повідомлятися як непідтримувані формати.
- **Модель зору**: Аналіз зображень використовує активну модель відповіді, якщо вона підтримує зір, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                          | Обхідний шлях                                                             |
| ------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Прострочена URL-адреса файлу Slack    | Файл пропущено; помилка не показується                                     | Повторно завантажте файл у Slack                                          |
| Модель зору не налаштована            | Вкладення зображень зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використайте модель відповіді з підтримкою зору |
| Дуже великі зображення (> 20 MB за замовчуванням) | Пропускаються згідно з лімітом розміру                                     | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                 |
| Переслані/поширені вкладення          | Текст і розміщені в Slack медіа зображень/файлів обробляються за best-effort | Поширте повторно безпосередньо в гілці OpenClaw                           |
| Вкладення PDF                         | Зберігаються як файловий/медіаконтекст, але не маршрутизуються автоматично через зір за зображеннями | Використайте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення зору для вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Перевірка наживо: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Прив’яжіть користувача Slack до Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових особистих повідомлень.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Configuration" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритети.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
