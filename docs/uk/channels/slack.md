---
read_when:
    - Налаштування Slack або налагодження сокетного/HTTP-режиму Slack
summary: Налаштування Slack і поведінка під час виконання (режим Socket + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-02T02:59:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82dbc27617415cb21e3c682d58c8a8a7f56c7471af0b43d5fcbb5df3fa872a49
    source_path: channels/slack.md
    workflow: 16
---

Готово до production-використання для DM і каналів через інтеграції застосунку Slack. Типовий режим — Socket Mode; HTTP Request URLs також підтримуються.

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
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче та продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) із `connections:write`
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

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

        Резервний варіант через env (лише типовий обліковий запис):

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

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

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

        Надайте кожному обліковому запису окремий `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували.
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

OpenClaw типово встановлює для клієнта Slack SDK час очікування pong у 15 секунд для Socket Mode. Перевизначайте налаштування транспорту лише тоді, коли вам потрібне налаштування для конкретного робочого простору або хоста:

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

Використовуйте це лише для робочих просторів Socket Mode, які записують у журнал тайм-аути pong websocket Slack або server-ping, чи працюють на хостах із відомим голодуванням event loop. `clientPingTimeout` — це очікування pong після того, як SDK надсилає client ping; `serverPingTimeout` — це очікування ping-ів сервера Slack. Повідомлення й події застосунку залишаються станом застосунку, а не сигналами живості транспорту.

## Чекліст маніфесту та scope-ів

Базовий маніфест застосунку Slack однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` slash-команди).

Базовий маніфест (Socket Mode типово):

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

Покажіть різні функції, що розширюють наведені вище типові значення.

Типовий маніфест вмикає вкладку **Home** у Slack App Home і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку Home, OpenClaw публікує безпечне типове подання Home через `views.publish`; payload розмови або приватна конфігурація не включаються. Вкладка **Messages** залишається ввімкненою для Slack DM.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Кілька [нативних slash-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з такими нюансами:

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
        Використовуйте той самий список `slash_commands`, що й у Socket Mode вище, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

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
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власне ім’я користувача та іконку) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте іконку emoji, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові області user-token (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типові області читання такі:

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
- Токени в конфігурації перевизначають резервні значення з env.
- Резервні env-значення `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до стандартного облікового запису.
- `userToken` (`xoxp-...`) налаштовується лише через конфігурацію (без резервного env-значення) і за замовчуванням має поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан: `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше не-inline джерело секрету, але поточний шлях команди/середовища виконання
  не зміг визначити фактичне значення.
- У HTTP-режимі включено `signingSecretStatus`; у Socket Mode
  обов’язкова пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання довідника user token може мати пріоритет, якщо його налаштовано. Для запису bot token і далі має пріоритет; записи через user-token дозволені лише коли `userTokenReadOnly: false` і bot token недоступний.
</Tip>

## Дії та шлюзи

Дії Slack контролюються через `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | Стандартно |
| ---------- | ---------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії повідомлень Slack містять `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ідентифікатори файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередні перегляди зображень для зображень або метадані локальних файлів для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` — канонічний allowlist для DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (за замовчуванням true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM за замовчуванням false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` переносить їх у `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів міститься в `channels.slack.channels` і **має використовувати стабільні ідентифікатори каналів Slack** (наприклад, `C12345678`) як ключі конфігурації.

    Примітка щодо середовища виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), середовище виконання повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` задано).

    Розпізнавання імен/ідентифікаторів:

    - записи allowlist каналів і записи allowlist DM розпізнаються під час запуску, коли доступ токена це дозволяє
    - нерозпізнані записи з іменами каналів зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням спершу використовують ID; пряме зіставлення імен користувачів/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** збігаються під `groupPolicy: "allowlist"`. Пошук каналу за замовчуванням спершу використовує ID, тому ключ на основі імені ніколи не маршрутизуватиметься успішно, а всі повідомлення в цьому каналі буде тихо заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і ключ на основі імені виглядає робочим.

    Завжди використовуйте ідентифікатор каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою миші → **Copy link** — ID (`C...`) з’явиться в кінці URL.

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

  <Tab title="Mentions and channel users">
    Повідомлення каналів за замовчуванням пропускаються лише за згадкою.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач бота є учасником цієї групи користувачів; потребує `usergroups:read`
    - regex-патерни згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявна поведінка гілки з відповіддю боту (вимкнено, коли `thread.requireExplicitMention` має значення `true`)

    Поканальні елементи керування (`channels.slack.channels.<id>`; імена лише через розв’язання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список дозволених)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса й надалі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише тоді, коли бот-відправник явно вказаний у списку дозволених `users` цієї кімнати, або коли принаймні один явний ідентифікатор власника Slack із `channels.slack.allowFrom` наразі є учасником кімнати. Wildcard і записи власників за відображуваним іменем не підтверджують присутність власника. Присутність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідну область читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників не вдається, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Гілки, сесії та теги відповіді

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- За стандартного `session.dmScope=main` DM Slack згортаються до основної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в гілках можуть створювати суфікси сесій гілок (`:thread:<threadTs>`), коли це застосовно.
- Стандартне значення `channels.slack.thread.historyScope` — `thread`; стандартне значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень гілки отримується під час запуску нової сесії гілки (стандартно `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (стандартно `false`): коли `true`, пригнічує неявні згадки в гілці, щоб бот відповідав лише на явні згадки `@bot` усередині гілок, навіть якщо бот уже брав участь у гілці. Без цього відповіді в гілці, де брав участь бот, обходять пропускання `requireMention`.

Елементи керування гілками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (стандартно `off`)
- `channels.slack.replyToModeByChatType`: окремо для `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **усі** гілки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги й надалі враховуються в режимі `"off"`. Гілки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими вбудовано.
</Note>

## Реакції підтвердження

`ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує короткі коди (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою живого попереднього перегляду:

- `off`: вимкнути потокове передавання живого попереднього перегляду.
- `partial` (стандартно): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст стану перебігу під час генерування, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли чернетковий попередній перегляд активний, маршрутизувати оновлення інструментів/перебігу в те саме редаговане повідомлення попереднього перегляду (стандартно: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/перебігу.

`channels.slack.streaming.nativeTransport` керує нативним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (стандартно: `true`).

- Для появи нативного потокового передавання тексту та стану гілки асистента Slack має бути доступна гілка відповіді. Вибір гілки й надалі дотримується `replyToMode`.
- Корені каналів і групових чатів усе ще можуть використовувати звичайний чернетковий попередній перегляд, коли нативне потокове передавання недоступне.
- DM Slack верхнього рівня за замовчуванням залишаються поза гілкою, тому вони не показують попередній перегляд у стилі гілки; використовуйте відповіді в гілках або `typingReaction`, якщо хочете бачити перебіг там.
- Медіа та нетекстові payload-и повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні текстові/блокові фінальні повідомлення скидаються лише тоді, коли можуть редагувати попередній перегляд на місці.
- Якщо потокове передавання зазнає збою посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload-ів.

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

## Резервна реакція набору

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її, коли виконання завершується. Це найкорисніше поза відповідями в гілках, які використовують стандартний індикатор стану "is typing...".

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує короткі коди (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично виконується після завершення відповіді або шляху збою.

## Медіа, фрагментація та доставка

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Вкладені файли Slack завантажуються з приватних URL, розміщених у Slack (потік запиту з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне та обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл за допомогою `download-file`.

    Завантаження використовують обмежені таймаути простою та загального часу. Якщо отримання файлу Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файлу.

    Обмеження розміру вхідних даних під час виконання за замовчуванням становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття з пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа відповідає `channels.slack.mediaMaxMb`, коли налаштовано; інакше надсилання в канал використовує типові значення за MIME-типом із медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM Slack відкриваються через API розмов Slack під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash

Slash-команди з’являються у Slack як одна налаштована команда або кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові значення команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових налаштувань маніфесту](#additional-manifest-settings) у вашому застосунку Slack і натомість вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим нативних команд **вимкнено** для Slack, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Меню нативних аргументів використовують адаптивну стратегію відтворення, яка показує модальне вікно підтвердження перед передаванням вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6–100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронною фільтрацією опцій, коли доступні обробники параметрів інтерактивності
- перевищені ліміти Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Slash-сеанси використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно спрямовують виконання команд до цільового сеансу розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відтворювати створені агентом елементи керування інтерактивною відповіддю, але ця функція за замовчуванням вимкнена.

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

Ці директиви компілюються в Slack Block Kit і спрямовують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це інтерфейс, специфічний для Slack. Інші канали не перетворюють директиви Slack Block Kit на власні системи кнопок.
- Значення інтерактивних callback — це згенеровані OpenClaw непрозорі токени, а не сирі значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищили б ліміти Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload блоків.

## Підтвердження виконання у Slack

Slack може працювати як нативний клієнт підтверджень з інтерактивними кнопками та взаємодіями, замість повернення до Web UI або термінала.

- Підтвердження виконання використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналів.
- Підтвердження Plugin усе ще можуть вирішуватися через ту саму нативну для Slack поверхню кнопок, коли запит уже надходить у Slack, а вид ідентифікатора підтвердження — `plugin:`.
- Авторизація користувачів, які підтверджують, усе ще застосовується: лише користувачі, визначені як ті, хто може підтверджувати, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок підтвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити підтвердження відтворюються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента повідомляє, що підтвердження в чаті
недоступні або ручне підтвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; повертається до `commands.ownerAllowFrom`, коли можливо)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні підтвердження виконання, коли `enabled` не задано або має значення `"auto"` і
визначається принаймні один користувач для підтвердження. Задайте `enabled: false`, щоб явно вимкнути Slack як нативний клієнт підтверджень.
Задайте `enabled: true`, щоб примусово ввімкнути нативні підтвердження, коли визначаються користувачі для підтвердження.

Типова поведінка без явної конфігурації підтверджень виконання Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли потрібно перевизначити користувачів для підтвердження, додати фільтри або
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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити підтвердження виконання також мають
спрямовуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack усе ще можуть вирішувати підтвердження Plugin, коли ці запити вже надходять
у Slack.

`/approve` у тому самому чаті також працює в каналах Slack і DM, які вже підтримують команди. Див. [Підтвердження виконання](/uk/tools/exec-approvals), щоб переглянути повну модель переспрямування підтверджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень зіставляються із системними подіями.
- Трансляції тредів (відповіді в треді з параметром «Також надіслати в канал») обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу розглядаються як ненадійний контекст і можуть бути вставлені в контекст маршрутизації.
- Початкове повідомлення треду та початкове заповнення контексту історії треду фільтруються налаштованими списками дозволених відправників, коли застосовно.
- Дії блоків і модальні взаємодії виводять структуровані системні події `Slack interaction: ...` з насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введенням форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації — Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний; тримайте вимкненим, якщо не потрібно)
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
    - список дозволених каналів (`channels.slack.channels`) — **ключі мають бути ідентифікаторами каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв непомітно не спрацьовують із `groupPolicy: "allowlist"`, оскільки маршрутизація каналів за замовчуванням насамперед використовує ідентифікатори. Щоб знайти ідентифікатор: клацніть правою кнопкою канал у Slack → **Copy link** — значення `C...` наприкінці URL є ідентифікатором каналу.
    - `requireMention`
    - поканальний список дозволених `users`

    Корисні команди:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM-повідомлення ігноруються">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - підтвердження pairing / записи списку дозволених
    - Події DM Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію треду Assistant без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не підключається">
    Перевірте токени bot + app і ввімкнення Socket Mode у налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштований, але поточне середовище виконання не змогло визначити значення на основі SecretRef.

  </Accordion>

  <Accordion title="Режим HTTP не отримує події">
    Перевірте:

    - signing secret
    - шлях Webhook
    - URL запитів Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках облікового запису,
    HTTP-обліковий запис налаштований, але поточне середовище виконання не змогло
    визначити signing secret на основі SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) із відповідними slash-командами, зареєстрованими у Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і списки дозволених каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник vision для вкладень

Slack може прикріплювати завантажені медіа до кроку агента, коли завантаження файлів Slack успішне й обмеження розміру дозволяють. Файли зображень можуть проходити через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою vision; інші файли зберігаються як контекст файлів для завантаження, а не обробляються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                     | Джерело               | Поточна поведінка                                                                  | Примітки                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack       | Завантажуються й додаються до ходу для обробки з підтримкою зору                   | Ліміт на файл: `channels.slack.mediaMaxMb` (типово 20 MB)                 |
| Файли PDF                      | URL файлу Slack       | Завантажуються й надаються як файловий контекст для інструментів, як-от `download-file` або `pdf` | Вхідні повідомлення Slack не перетворюють PDF автоматично на вхідні дані для зорової обробки |
| Інші файли                    | URL файлу Slack       | Завантажуються, коли це можливо, і надаються як файловий контекст                              | Бінарні файли не обробляються як вхідні зображення                               |
| Відповіді в треді                 | Файли початкового повідомлення треду | Файли кореневого повідомлення можуть бути завантажені як контекст, коли відповідь не має власних медіа  | Початкові повідомлення лише з файлами використовують заповнювач вкладення                          |
| Повідомлення з кількома зображеннями           | Кілька файлів Slack | Кожен файл оцінюється незалежно                                              | Обробка Slack обмежена вісьмома файлами на повідомлення                     |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватної URL-адреси Slack за допомогою токена бота (`xoxb-...`).
2. У разі успіху файл записується до сховища медіа.
3. Шляхи завантажених медіа й типи вмісту додаються до вхідного контексту.
4. Шляхи моделі/інструменту з підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня треду

Коли повідомлення надходить у треді (має батьківський `thread_ts`):

- Якщо сама відповідь не має власних медіа, а включене кореневе повідомлення має файли, Slack може завантажити кореневі файли як контекст початкового повідомлення треду.
- Власні вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється заповнювачем вкладення, щоб резервний варіант усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через медіаконвеєр.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделей

- **Ліміт розміру**: Типово 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: Файли, які Slack не може надати, прострочені URL-адреси, недоступні файли, завеликі файли та HTML-відповіді автентифікації/входу Slack пропускаються, а не повідомляються як непідтримувані формати.
- **Зорова модель**: Аналіз зображень використовує активну модель відповіді, коли вона підтримує зір, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                               | Поточна поведінка                                                             | Обхідний шлях                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Прострочена URL-адреса файлу Slack                 | Файл пропускається; помилка не показується                                                 | Повторно завантажте файл у Slack                                                |
| Зорова модель не налаштована            | Вкладення зображень зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використовуйте модель відповіді з підтримкою зору |
| Дуже великі зображення (> 20 MB типово) | Пропускаються відповідно до ліміту розміру                                                         | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                       |
| Переслані/спільні вкладення           | Текст і розміщені в Slack медіа зображень/файлів обробляються за принципом найкращих зусиль                       | Поділіться ними повторно безпосередньо в треді OpenClaw                                   |
| Вкладення PDF                        | Зберігаються як файловий/медійний контекст, не спрямовуються автоматично через зорову обробку зображень  | Використовуйте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF   |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення зорової обробки вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Slack із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових DM.
  </Card>
  <Card title="Маршрутизація каналу" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення до агентів.
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
