---
read_when:
    - Налаштування Slack або налагодження сокетного/HTTP-режиму Slack
summary: Налаштування Slack і поведінка під час виконання (сокетний режим + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-03T22:33:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72fecf4371107e2a0685886ef9f9d24cfd9cc59fdce69e36e85dac985cbd3fe4
    source_path: channels/slack.md
    workflow: 16
---

Готовий до production-використання для DM і каналів через інтеграції застосунку Slack. Режим за замовчуванням — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    DM у Slack за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з усунення несправностей.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) із `connections:write`
        - встановіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - встановіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

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
        Використовуйте унікальні шляхи Webhook для HTTP із кількома обліковими записами

        Надайте кожному обліковому запису окремий `webhookPath` (за замовчуванням `/slack/events`), щоб реєстрації не конфліктували.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Налаштування транспорту Socket Mode

OpenClaw за замовчуванням установлює для клієнта Slack SDK тайм-аут pong у 15 секунд для Socket Mode. Перевизначайте налаштування транспорту лише тоді, коли потрібне налаштування під конкретний робочий простір або хост:

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

Використовуйте це лише для робочих просторів Socket Mode, які журналюють тайм-аути Slack websocket pong/server-ping, або працюють на хостах із відомим блокуванням циклу подій. `clientPingTimeout` — це очікування pong після того, як SDK надсилає client ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення й події застосунку залишаються станом застосунку, а не сигналами життєздатності транспорту.

## Контрольний список маніфесту та областей доступу

Базовий маніфест застосунку Slack однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` для slash-команди).

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

Увімкніть інші функції, що розширюють наведені вище стандартні значення.

Маніфест за замовчуванням вмикає вкладку **Home** у Slack App Home і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку Home, OpenClaw публікує безпечне подання Home за замовчуванням через `views.publish`; дані розмови або приватна конфігурація не включаються. Вкладка **Messages** залишається ввімкненою для DM у Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Замість однієї налаштованої команди можна використовувати кілька [нативних slash-команд](#commands-and-slash-behavior) з такими нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 slash-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
    // ...repeat for every command with the same `url` value
  ]
}
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    Додайте область доступу бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача й іконку) замість стандартної ідентичності застосунку Slack.

    Якщо ви використовуєте emoji-іконку, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими областями доступу для читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви покладаєтеся на читання пошуку Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- `botToken` + `appToken` потрібні для Socket Mode.
- HTTP-режим потребує `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті текстові
  рядки або об’єкти SecretRef.
- Токени конфігурації перевизначають резервні env.
- Резервні env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) задається лише в конфігурації (без резервного env) і за замовчуванням працює лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секретів, але поточна команда/шлях виконання
  не зміг отримати фактичне значення.
- У HTTP-режимі включено `signingSecretStatus`; у Socket Mode
  обов’язкова пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу можна надавати перевагу токену користувача, якщо його налаштовано. Для запису токен бота залишається пріоритетним; записи токеном користувача дозволені лише коли `userTokenReadOnly: false` і токен бота недоступний.
</Tip>

## Дії та шлюзи

Дії Slack керуються `channels.slack.actions.*`.

Доступні групи дій у поточних інструментах Slack:

| Група      | За замовчуванням |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ідентифікатори файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередні перегляди зображень для зображень або метадані локальних файлів для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` — канонічний список дозволених DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` включав `"*"`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (за замовчуванням true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM за замовчуванням false)
    - `dm.groupChannels` (необов’язковий список дозволених MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` переносить їх у `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Список дозволених каналів міститься в `channels.slack.channels` і **має використовувати стабільні ідентифікатори каналів Slack** (наприклад `C12345678`) як ключі конфігурації.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), середовище виконання повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` задано).

    Розпізнавання імен/ID:

    - записи списку дозволених каналів і записи списку дозволених DM розпізнаються під час запуску, коли доступ токена це дозволяє
    - нерозпізнані записи імен каналів зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням працюють передусім за ID; пряме зіставлення імен користувачів/слагів потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** збігаються під `groupPolicy: "allowlist"`. Пошук каналу за замовчуванням працює передусім за ID, тому ключ на основі імені ніколи не маршрутизуватиметься успішно, а всі повідомлення в цьому каналі буде тихо заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і ключ на основі імені здається робочим.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал правою кнопкою в Slack → **Copy link** — ID (`C...`) з’являється в кінці URL.

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

    Неправильно (тихо блокується під `groupPolicy: "allowlist"`):

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

  <Tab title="Згадки та користувачі каналу">
    Повідомлення каналів за замовчуванням обмежені згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач-бот є учасником цієї групи користувачів; потребує `usergroups:read`
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в гілці на повідомлення бота (вимкнено, коли `thread.requireExplicitMention` дорівнює `true`)

    Налаштування для кожного каналу (`channels.slack.channels.<id>`; імена лише через зіставлення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список дозволених)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса досі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише тоді, коли бот-відправник явно вказаний у списку дозволених `users` цієї кімнати, або коли принаймні один явний ID власника Slack із `channels.slack.allowFrom` зараз є учасником кімнати. Wildcard-и та записи власників за відображуваним ім’ям не задовольняють наявність власника. Наявність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідний read scope для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників завершується невдало, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Гілки, сесії та теги відповідей

- DM-и маршрутизуються як `direct`; канали як `channel`; MPIM-и як `group`.
- Прив’язки маршрутів Slack приймають необроблені ID співрозмовників, а також форми цілей Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- Із типовим `session.dmScope=main` DM-и Slack згортаються до головної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в гілках можуть створювати суфікси сесій гілок (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень гілки отримується під час запуску нової сесії гілки (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, пригнічує неявні згадки в гілці, щоб бот відповідав лише на явні згадки `@bot` усередині гілок, навіть якщо бот уже брав участь у гілці. Без цього відповіді в гілці, де брав участь бот, обходять обмеження `requireMention`.

Налаштування гілок відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** гілки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Гілки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими inline.
</Note>

## Реакції підтвердження

`ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою live preview:

- `off`: вимкнути потокове передавання live preview.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надіслати фінальний текст.
- `streaming.preview.toolProgress`: коли чернетковий попередній перегляд активний, спрямовувати оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (типово: `true`). Установіть `false`, щоб зберігати окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` дорівнює `partial` (типово: `true`).

- Для появи нативного потокового передавання тексту та статусу гілки помічника Slack має бути доступна гілка відповіді. Вибір гілки все ще відповідає `replyToMode`.
- Корені каналів, групових чатів і DM верхнього рівня все ще можуть використовувати звичайний чернетковий попередній перегляд, коли нативне потокове передавання недоступне або гілки відповіді не існує.
- DM-и Slack верхнього рівня типово залишаються поза гілками, тому вони не показують нативний stream/status preview у стилі гілок Slack; натомість OpenClaw публікує й редагує чернетковий попередній перегляд у DM.
- Медіа та нетекстові payload-и повертаються до звичайної доставки.
- Фінали медіа/помилок скасовують очікувані редагування попереднього перегляду; придатні фінали тексту/блоків скидаються лише тоді, коли можуть відредагувати попередній перегляд на місці.
- Якщо потокове передавання завершується невдало посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload-ів.

Використовуйте чернетковий попередній перегляд замість нативного потокового передавання тексту Slack:

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
- булевий `channels.slack.streaming` автоматично мігрується до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` автоматично мігрується до `channels.slack.streaming.nativeTransport`.

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в гілках, які використовують типовий індикатор статусу "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується best-effort, а очищення автоматично запускається після завершення відповіді або шляху помилки.

## Медіа, фрагментація та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених у Slack (потік запиту з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне й обмеження розміру це дозволяють. Плейсхолдери файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл за допомогою `download-file`.

    Завантаження використовують обмежені тайм-аути бездіяльності та загального часу. Якщо отримання файла Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файла.

    Обмеження розміру вхідних даних під час виконання за замовчуванням становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття з пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа дотримується `channels.slack.mediaMaxMb`, коли це налаштовано; інакше надсилання в канали використовує стандартні значення MIME-типів із медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Текстові або лише блочні Slack DM можуть публікуватися безпосередньо в ідентифікатори користувачів; завантаження файлів і надсилання в треди спочатку відкривають DM через API розмов Slack, оскільки ці шляхи потребують конкретного ідентифікатора розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash-команд

Slash-команди з'являються в Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити стандартні параметри команд:

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

Меню нативних аргументів використовують адаптивну стратегію відображення, яка показує модальне підтвердження перед передаванням вибраного значення параметра:

- до 5 параметрів: блоки кнопок
- 6-100 параметрів: статичне меню вибору
- понад 100 параметрів: зовнішній вибір з асинхронною фільтрацією параметрів, коли доступні обробники параметрів інтерактивності
- перевищено обмеження Slack: закодовані значення параметрів повертаються до кнопок

```txt
/think
```

Slash-сеанси використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно спрямовують виконання команд до цільового сеансу розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати створені агентом інтерактивні елементи керування відповідями, але ця функція за замовчуванням вимкнена.

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

Коли це ввімкнено, агенти можуть надсилати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перетворюють директиви Slack Block Kit на власні системи кнопок.
- Значення інтерактивних callback-ів є непрозорими токенами, згенерованими OpenClaw, а не сирими значеннями, створеними агентом.
- Якщо згенеровані інтерактивні блоки перевищили б обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload блоків.

## Схвалення виконання в Slack

Slack може діяти як нативний клієнт схвалення з інтерактивними кнопками та взаємодіями замість повернення до веб-UI або термінала.

- Схвалення виконання використовують `channels.slack.execApprovals.*` для нативного маршрутування DM/каналу.
- Схвалення Plugin все одно можуть розв'язуватися через ту саму нативну для Slack поверхню кнопок, коли запит уже потрапляє в Slack, а тип ідентифікатора схвалення — `plugin:`.
- Авторизація схвалювача все одно застосовується: лише користувачі, визначені як схвалювачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок схвалення, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашої програми Slack, запити схвалення відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що схвалення
в чаті недоступні або ручне схвалення є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов'язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні схвалення виконання, коли `enabled` не задано або має значення `"auto"`, і щонайменше один
схвалювач розв'язується. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт схвалення.
Установіть `enabled: true`, щоб примусово ввімкнути нативні схвалення, коли схвалювачі розв'язуються.

Стандартна поведінка без явної конфігурації схвалення виконання Slack:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити схвалення виконання також мають
спрямовуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack усе одно можуть розв'язувати схвалення Plugin, коли ці запити вже потрапляють
у Slack.

Одночатова команда `/approve` також працює в каналах Slack і DM, які вже підтримують команди. Див. [Схвалення виконання](/uk/tools/exec-approvals), щоб ознайомитися з повною моделлю переспрямування схвалень.

## Події та операційна поведінка

- Редагування й видалення повідомлень зіставляються із системними подіями.
- Трансляції тредів (відповіді в тредах "Also send to channel") обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються ненадійним контекстом і можуть вводитися в контекст маршрутизації.
- Початкове повідомлення треду й початкове засівання контексту історії треду фільтруються налаштованими allowlist-ами відправників, коли це застосовно.
- Дії блоків і модальні взаємодії випускають структуровані системні події `Slack interaction: ...` з багатими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker-ів і метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеними даними форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний; залишайте вимкненим, якщо не потрібно)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по черзі:

    - `groupPolicy`
    - allowlist каналу (`channels.slack.channels`) — **ключі мають бути ідентифікаторами каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв непомітно не спрацьовують із `groupPolicy: "allowlist"`, оскільки маршрутизація каналів за замовчуванням спершу використовує ідентифікатори. Щоб знайти ідентифікатор: клацніть канал у Slack правою кнопкою → **Copy link** — значення `C...` наприкінці URL є ідентифікатором каналу.
    - `requireMention`
    - поканальний allowlist `users`

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
    - схвалення спарювання / записи allowlist
    - події DM Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію треду Assistant без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте токени бота й програми, а також увімкнення Socket Mode у налаштуваннях програми Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштований, але поточне середовище виконання не змогло розв'язати значення,
    підкріплене SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з'являється у знімках
    облікових записів, HTTP-обліковий запис налаштований, але поточне середовище виконання не змогло
    розв'язати signing secret, підкріплений SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist-и каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник зору для вкладень

Slack може прикріплювати завантажені медіа до ходу агента, коли завантаження файлів Slack успішні й обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою зору; інші файли зберігаються як контекст завантажуваних файлів, а не обробляються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                     | Джерело               | Поточна поведінка                                                                  | Примітки                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack       | Завантажуються й прикріплюються до ходу для обробки з підтримкою бачення                   | Обмеження на файл: `channels.slack.mediaMaxMb` (типово 20 MB)                 |
| PDF-файли                      | URL файлу Slack       | Завантажуються й надаються як файловий контекст для інструментів, таких як `download-file` або `pdf` | Вхідний Slack не перетворює PDF на вхідні дані для бачення зображень автоматично |
| Інші файли                    | URL файлу Slack       | Завантажуються, коли це можливо, і надаються як файловий контекст                              | Двійкові файли не обробляються як вхідні зображення                               |
| Відповіді в треді                 | Файли початкового повідомлення треду | Файли кореневого повідомлення можуть бути гідровані як контекст, коли відповідь не має безпосередніх медіа  | Початкові повідомлення лише з файлами використовують заповнювач вкладення                          |
| Повідомлення з кількома зображеннями           | Кілька файлів Slack | Кожен файл оцінюється незалежно                                              | Обробка Slack обмежена вісьмома файлами на повідомлення                     |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватного URL Slack, використовуючи токен бота (`xoxb-...`).
2. Після успіху файл записується до сховища медіа.
3. Шляхи завантажених медіа та типи вмісту додаються до вхідного контексту.
4. Шляхи моделей/інструментів із підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Наслідування вкладень кореня треду

Коли повідомлення надходить у тред (має батьківський `thread_ts`):

- Якщо сама відповідь не має безпосередніх медіа, а включене кореневе повідомлення має файли, Slack може гідрувати кореневі файли як контекст початкового повідомлення треду.
- Безпосередні вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється заповнювачем вкладення, щоб резервний варіант усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через медіаконвеєр.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделі

- **Обмеження розміру**: типово 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: файли, які Slack не може надати, протерміновані URL, недоступні файли, завеликі файли та HTML-відповіді автентифікації/входу Slack пропускаються, а не повідомляються як непідтримувані формати.
- **Модель бачення**: аналіз зображень використовує активну модель відповіді, коли вона підтримує бачення, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                               | Поточна поведінка                                                             | Обхідний шлях                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Протермінований URL файлу Slack                 | Файл пропущено; помилка не показується                                                 | Повторно завантажте файл у Slack                                                |
| Модель бачення не налаштована            | Вкладення зображень зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використовуйте модель відповіді з підтримкою бачення |
| Дуже великі зображення (> 20 MB типово) | Пропускаються через обмеження розміру                                                         | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                       |
| Переслані/поширені вкладення           | Текст і розміщені у Slack медіа зображень/файлів обробляються за принципом найкращого зусилля                       | Повторно поширте безпосередньо в треді OpenClaw                                   |
| PDF-вкладення                        | Зберігаються як файловий/медійний контекст, не маршрутизуються автоматично через бачення зображень  | Використовуйте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF   |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення бачення вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    З’єднайте користувача Slack із gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка каналу та групових DM.
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
