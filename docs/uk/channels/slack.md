---
read_when:
    - Налаштування Slack або налагодження режиму сокета/HTTP для Slack
summary: Налаштування Slack і поведінка під час виконання (режим сокетів + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-03T22:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2be45f03511a64373b1f4316c59800eeeef8baccb4c00454b49999258b2e546b
    source_path: channels/slack.md
    workflow: 16
---

Готово до production-використання для DM і каналів через інтеграції Slack app. Режим за замовчуванням — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Slack DM за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика й інструкції з відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий Slack app">
        У налаштуваннях Slack app натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого app
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - установіть app і скопіюйте показаний **Bot Token** (`xoxb-...`)

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

        - виберіть **from a manifest** і виберіть робочий простір для свого app
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - установіть app і скопіюйте показаний **Bot Token** (`xoxb-...`)

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
        Використовуйте унікальні шляхи Webhook для HTTP з кількома обліковими записами

        Надайте кожному обліковому запису окремий `webhookPath` (за замовчуванням `/slack/events`), щоб реєстрації не конфліктували.
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

OpenClaw за замовчуванням установлює час очікування pong для клієнта Slack SDK у 15 секунд для Socket Mode. Перевизначайте параметри транспорту лише тоді, коли потрібне налаштування для конкретного робочого простору або хоста:

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

Використовуйте це лише для робочих просторів Socket Mode, які журналюють тайм-аути Slack websocket pong/server-ping, або для хостів із відомим виснаженням циклу подій. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення app і події залишаються станом застосунку, а не сигналами працездатності транспорту.

## Контрольний список маніфесту й scope

Базовий маніфест Slack app однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` для slash-команди).

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

Для режиму **HTTP Request URLs** замініть `settings` на HTTP-варіант і додайте `url` до кожної slash-команди. Потрібна публічна URL-адреса:

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

Увімкніть інші функції, які розширюють наведені вище значення за замовчуванням.

Маніфест за замовчуванням вмикає вкладку **Home** у Slack App Home і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку Home, OpenClaw публікує безпечне подання Home за замовчуванням через `views.publish`; жодне корисне навантаження розмови або приватна конфігурація не включається. Вкладка **Messages** залишається ввімкненою для Slack DM.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Кілька [нативних slash-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
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
      <Tab title="HTTP Request URLs">
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

        Повторіть це значення `url` для кожної команди в списку.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    Додайте scope бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власне ім’я користувача та іконку) замість стандартної ідентичності застосунку Slack.

    Якщо ви використовуєте іконку emoji, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типові scope для читання:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви покладаєтеся на читання через пошук Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- `botToken` + `appToken` потрібні для Socket Mode.
- Режим HTTP потребує `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають рядки відкритого тексту
  або об’єкти SecretRef.
- Токени конфігурації перевизначають резервне значення env.
- Резервне значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до стандартного облікового запису.
- `userToken` (`xoxp-...`) налаштовується лише в конфігурації (без резервного значення env) і типово має поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожного облікового запису (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан: `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секретів, але поточний шлях команди/середовища виконання
  не зміг отримати фактичне значення.
- У режимі HTTP включено `signingSecretStatus`; у Socket Mode
  потрібна пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу токен користувача може мати пріоритет, якщо його налаштовано. Для запису токен бота лишається пріоритетним; записи через токен користувача дозволені лише коли `userTokenReadOnly: false` і токен бота недоступний.
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

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` — канонічний список дозволених для DM.

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий список дозволених MPIM)

    Пріоритетність для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Список дозволених каналів міститься в `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад `C12345678`) як ключі конфігурації.

    Примітка щодо середовища виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), середовище виконання переходить до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` задано).

    Розв’язання назви/ID:

    - записи списку дозволених каналів і записи списку дозволених DM розв’язуються під час запуску, коли доступ токена це дозволяє
    - нерозв’язані записи назв каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - вхідна авторизація й маршрутизація каналів типово спершу використовують ID; пряме зіставлення імені користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі назви (`#channel-name` або `channel-name`) **не** збігаються за `groupPolicy: "allowlist"`. Пошук каналу типово спершу використовує ID, тому ключ на основі назви ніколи не маршрутизуватиметься успішно, а всі повідомлення в цьому каналі буде тихо заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і ключ на основі назви здається робочим.

    Завжди використовуйте ID каналу Slack як ключ. Щоб його знайти: клацніть канал у Slack правою кнопкою → **Copy link** — ID (`C...`) з’явиться наприкінці URL.

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

    Неправильно (тихо блокується за `groupPolicy: "allowlist"`):

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
    Повідомлення каналів типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач-бот є учасником цієї групи користувачів; потребує `usergroups:read`
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді на потік бота (вимкнена, коли `thread.requireExplicitMention` має значення `true`)

    Поканальні елементи керування (`channels.slack.channels.<id>`; назви лише через розв’язання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список дозволених)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса досі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише коли бот-відправник явно вказаний у списку дозволених `users` цієї кімнати або коли принаймні один явний ID власника Slack з `channels.slack.allowFrom` наразі є учасником кімнати. Wildcard і записи власників за відображуваним іменем не задовольняють присутність власника. Присутність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідний scope читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників не вдається, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Потоки, сеанси та теги відповіді

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- Прив’язки маршрутів Slack приймають необроблені ID учасників, а також форми цілей Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- Із типовим `session.dmScope=main` DM Slack згортаються до головного сеансу агента.
- Сеанси каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в потоках можуть створювати суфікси сеансу потоку (`:thread:<threadTs>`), коли застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень потоку отримується під час старту нового сеансу потоку (типово `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, пригнічує неявні згадки потоку, щоб бот відповідав лише на явні згадки `@bot` усередині потоків, навіть якщо бот уже брав участь у потоці. Без цього відповіді в потоці за участю бота обходять шлюз `requireMention`.

Елементи керування потоками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** потоки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Потоки Slack приховують повідомлення з каналу, тоді як відповіді Telegram лишаються видимими inline.
</Note>

## Реакції підтвердження

`ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервне emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Текстове потокове передавання

`channels.slack.streaming` керує поведінкою живого попереднього перегляду:

- `off`: вимкнути потокове передавання живого попереднього перегляду.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати chunked-оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерування, а потім надіслати фінальний текст.
- `streaming.preview.toolProgress`: коли чернетка попереднього перегляду активна, маршрутизувати оновлення інструментів/прогресу в те саме відредаговане повідомлення попереднього перегляду (типово: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативним текстовим потоковим передаванням Slack, коли `channels.slack.streaming.mode` має значення `partial` (типово: `true`).

- Потік відповіді має бути доступний, щоб з’являлися нативне текстове потокове передавання й стан потоку асистента Slack. Вибір потоку все одно відповідає `replyToMode`.
- Канали, групові чати й корені DM верхнього рівня досі можуть використовувати звичайну чернетку попереднього перегляду, коли нативне потокове передавання недоступне або потоку відповіді немає.
- DM Slack верхнього рівня типово лишаються поза потоком, тому вони не показують thread-style нативний stream/status попередній перегляд Slack; натомість OpenClaw публікує й редагує чернетку попереднього перегляду в DM.
- Медіа та нетекстові payload повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні текстові/block фінали flush лише тоді, коли можуть відредагувати попередній перегляд на місці.
- Якщо потокове передавання переривається посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload.

Використовуйте чернетку попереднього перегляду замість нативного текстового потокового передавання Slack:

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

## Резервна реакція введення

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в потоках, які використовують типовий індикатор стану "is typing...".

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує шорткоди (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично пробується після завершення відповіді або шляху помилки.

## Медіа, поділ на фрагменти та доставлення

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне та обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл за допомогою `download-file`.

    Завантаження використовують обмежені таймаути простою та загального часу. Якщо отримання файлу Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файлу.

    Стандартне обмеження розміру вхідних даних під час виконання становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ із пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в гілках (`thread_ts`)
    - обмеження вихідних медіа відповідає `channels.slack.mediaMaxMb`, якщо налаштовано; інакше надсилання в канал використовує типові значення за MIME-типом із медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставлення">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Текстові або лише блокові Slack DM можуть публікуватися безпосередньо за ID користувачів; завантаження файлів і надсилання в гілках спочатку відкривають DM через API розмов Slack, бо ці шляхи потребують конкретного ID розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash

Команди slash з’являються у Slack як одна налаштована команда або кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових налаштувань маніфесту](#additional-manifest-settings) у вашій програмі Slack і натомість вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим нативних команд **вимкнено** для Slack, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Меню нативних аргументів використовують адаптивну стратегію рендерингу, яка показує модальне підтвердження перед надсиланням вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній список вибору з асинхронною фільтрацією опцій, коли доступні обробники параметрів інтерактивності
- перевищено обмеження Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Сесії slash використовують ізольовані ключі, як-от `agent:<agentId>:slack:slash:<userId>`, і все одно спрямовують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може рендерити створені агентом інтерактивні елементи керування відповіддю, але ця функція типово вимкнена.

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

Коли ввімкнено, агенти можуть виводити директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються у Slack Block Kit і спрямовують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перетворюють директиви Slack Block Kit на власні системи кнопок.
- Значення інтерактивних callback є непрозорими токенами, згенерованими OpenClaw, а не необробленими значеннями, створеними агентом.
- Якщо згенеровані інтерактивні блоки перевищили б обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload блоків.

## Затвердження Exec у Slack

Slack може діяти як нативний клієнт затвердження з інтерактивними кнопками та взаємодіями замість повернення до Web UI або термінала.

- Затвердження Exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналу.
- Затвердження Plugin усе ще можуть розв’язуватися через ту саму нативну для Slack поверхню кнопок, коли запит уже потрапляє у Slack і тип ID затвердження є `plugin:`.
- Авторизація затверджувача все одно примусово застосовується: лише користувачі, ідентифіковані як затверджувачі, можуть затверджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок затвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашої програми Slack, запити на затвердження рендеряться як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX затвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що
затвердження через чат недоступні або ручне затвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні затвердження Exec, коли `enabled` не задано або має значення `"auto"` і принаймні один
затверджувач визначається. Задайте `enabled: false`, щоб явно вимкнути Slack як нативний клієнт затвердження.
Задайте `enabled: true`, щоб примусово ввімкнути нативні затвердження, коли затверджувачі визначаються.

Типова поведінка без явної конфігурації затвердження Exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли потрібно перевизначити затверджувачів, додати фільтри або
увімкнути доставлення до початкового чату:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на затвердження Exec також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack усе ще можуть розв’язувати затвердження Plugin, коли ці запити вже потрапляють
у Slack.

`/approve` у тому самому чаті також працює в каналах Slack і DM, які вже підтримують команди. Див. [Затвердження Exec](/uk/tools/exec-approvals), щоб отримати повну модель переспрямування затверджень.

## Події та операційна поведінка

- Редагування й видалення повідомлень відображаються у системні події.
- Трансляції гілок (відповіді в гілках «Також надіслати до каналу») обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій відображаються у системні події.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення відображаються у системні події.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли `configWrites` увімкнено.
- Метадані теми/призначення каналу розглядаються як недовірений контекст і можуть вводитися в контекст маршрутизації.
- Початкове повідомлення гілки та засівання початкового контексту історії гілки фільтруються налаштованими списками дозволених відправників, коли застосовно.
- Дії блоків і модальні взаємодії створюють структуровані системні події `Slack interaction: ...` з насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення засобів вибору та метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеннями форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (break-glass; тримайте вимкненим, якщо не потрібно)
- доступ до каналу: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- гілки/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставлення: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте за порядком:

    - `groupPolicy`
    - список дозволених каналів (`channels.slack.channels`) — **ключі мають бути ID каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв тихо не спрацьовують за `groupPolicy: "allowlist"`, бо маршрутизація каналів типово насамперед спирається на ID. Щоб знайти ID: клацніть канал у Slack правою кнопкою → **Копіювати посилання** — значення `C...` у кінці URL є ID каналу.
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
    - затвердження сполучення / записи списку дозволених
    - події DM Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію гілки Assistant без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте токени бота й програми та ввімкнення Socket Mode у налаштуваннях програми Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    підкріплене SecretRef.

  </Accordion>

  <Accordion title="Режим HTTP не отримує події">
    Перевірте:

    - секрет підпису
    - шлях Webhook
    - URL запитів Slack (події + інтерактивність + команди slash)
    - унікальний `webhookPath` для кожного облікового запису HTTP

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, обліковий запис HTTP налаштовано, але поточне середовище виконання не змогло
    визначити секрет підпису, підкріплений SecretRef.

  </Accordion>

  <Accordion title="Нативні команди / команди slash не спрацьовують">
    Перевірте, що саме ви мали на меті:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними командами slash, зареєстрованими у Slack
    - або режим однієї команди slash (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і списки дозволених каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник зору для вкладень

Slack може прикріплювати завантажені медіа до ходу агента, коли завантаження файлів Slack успішне та обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою зору; інші файли зберігаються як контекст файлу, доступний для завантаження, а не трактуються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                     | Джерело               | Поточна поведінка                                                                  | Примітки                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack       | Завантажуються й додаються до ходу для обробки з підтримкою зору                   | Обмеження на файл: `channels.slack.mediaMaxMb` (типово 20 MB)                 |
| PDF-файли                      | URL файлу Slack       | Завантажуються й надаються як файловий контекст для інструментів, як-от `download-file` або `pdf` | Вхідні дані Slack не перетворюють PDF на вхідні дані зображень для зору автоматично |
| Інші файли                    | URL файлу Slack       | Завантажуються, коли це можливо, і надаються як файловий контекст                              | Двійкові файли не обробляються як вхідні зображення                               |
| Відповіді в тредах                 | Файли початкового повідомлення треду | Файли кореневого повідомлення можуть бути гідратовані як контекст, коли відповідь не має прямих медіа  | Початкові повідомлення лише з файлами використовують заповнювач вкладення                          |
| Повідомлення з кількома зображеннями           | Кілька файлів Slack | Кожен файл оцінюється незалежно                                              | Обробка Slack обмежена вісьмома файлами на повідомлення                     |

### Вхідний конвеєр

Коли надходить повідомлення Slack із вкладеними файлами:

1. OpenClaw завантажує файл із приватної URL-адреси Slack за допомогою токена бота (`xoxb-...`).
2. У разі успіху файл записується до сховища медіа.
3. Шляхи завантажених медіа й типи вмісту додаються до вхідного контексту.
4. Шляхи моделей/інструментів із підтримкою зору можуть використовувати вкладені зображення з цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня треду

Коли повідомлення надходить у треді (має батьківський `thread_ts`):

- Якщо сама відповідь не має прямих медіа, а включене кореневе повідомлення має файли, Slack може гідратувати кореневі файли як контекст початкового повідомлення треду.
- Прямі вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється заповнювачем вкладення, щоб резервний механізм усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька вкладених файлів:

- Кожне вкладення обробляється незалежно через медіаконвеєр.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження й моделі

- **Обмеження розміру**: Типово 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: Файли, які Slack не може надати, прострочені URL-адреси, недоступні файли, завеликі файли та HTML-відповіді автентифікації/входу Slack пропускаються замість повідомлення про непідтримувані формати.
- **Модель зору**: Аналіз зображень використовує активну модель відповіді, якщо вона підтримує зір, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                               | Поточна поведінка                                                             | Обхідний шлях                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Прострочена URL-адреса файлу Slack                 | Файл пропускається; помилка не показується                                                 | Повторно завантажте файл у Slack                                                |
| Модель зору не налаштована            | Вкладені зображення зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використайте модель відповіді з підтримкою зору |
| Дуже великі зображення (> 20 MB типово) | Пропускаються відповідно до обмеження розміру                                                         | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                       |
| Переслані/спільні вкладення           | Текст і медіа зображень/файлів, розміщені в Slack, обробляються за принципом найкращого зусилля                       | Поділіться ними напряму в треді OpenClaw                                   |
| PDF-вкладення                        | Зберігаються як файловий/медійний контекст, не маршрутизуються автоматично через зір для зображень  | Використайте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF   |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення зору для вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Slack із Gateway.
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
    Структура конфігурації та пріоритетність.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
