---
read_when:
    - Налаштування Slack або налагодження режиму сокета/HTTP для Slack
summary: Налаштування Slack і поведінка під час виконання (режим Socket + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:21:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7334027c606ff6465190433d2159c3f9cfbcf1e8a3a1e826682423f71700a064
    source_path: channels/slack.md
    workflow: 16
---

Готово до продакшену для DM і каналів через інтеграції Slack app. Режим за замовчуванням — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    DM у Slack за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналами" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий Slack app">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть свій робочий простір → вставте один із наведених нижче маніфестів → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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

```json Minimal
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** відповідає повному набору можливостей вбудованого Slack plugin: App Home, слеш-команди, файли, реакції, закріплення, групові DM і читання емодзі/груп користувачів. Виберіть **Minimal**, коли політика робочого простору обмежує scopes — він охоплює DM, історію каналів/груп, згадки та слеш-команди, але вилучає файли, реакції, закріплення, групові DM (`mpim:*`), `emoji:read` і `usergroups:read`. Див. [Контрольний список маніфесту та scopes](#manifest-and-scope-checklist), щоб дізнатися обґрунтування для кожного scope і додаткові параметри, як-от додаткові слеш-команди.
        </Note>

        Після того як Slack створить app:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: додайте `connections:write`, збережіть, скопіюйте значення `xapp-...`.
        - **Install App → Install to Workspace**: скопіюйте `xoxb-...` Bot User OAuth Token.

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

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Створіть новий Slack app">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть свій робочий простір → вставте один із наведених нижче маніфестів → замініть `https://gateway-host.example.com/slack/events` на публічну URL-адресу вашого Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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

```json Minimal
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Recommended** відповідає повному набору можливостей вбудованого Slack plugin; **Minimal** вилучає файли, реакції, закріплення, групові DM (`mpim:*`), `emoji:read` і `usergroups:read` для робочих просторів із суворими обмеженнями. Див. [Контрольний список маніфесту та scopes](#manifest-and-scope-checklist), щоб дізнатися обґрунтування для кожного scope.
        </Note>

        Після того як Slack створить app:

        - **Basic Information → App Credentials**: скопіюйте **Signing Secret** для перевірки запитів.
        - **Install App → Install to Workspace**: скопіюйте `xoxb-...` Bot User OAuth Token.

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
        Використовуйте унікальні шляхи Webhook для HTTP із кількома обліковими записами

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

OpenClaw за замовчуванням встановлює для клієнта Slack SDK тайм-аут pong у 15 секунд для Socket Mode. Перевизначайте параметри транспорту лише тоді, коли потрібне налаштування під конкретний робочий простір або хост:

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

Використовуйте це лише для робочих просторів Socket Mode, які журналюють тайм-аути pong/server-ping вебсокета Slack, або працюють на хостах із відомим блокуванням event loop. `clientPingTimeout` — це очікування pong після того, як SDK надсилає client ping; `serverPingTimeout` — це очікування server pings від Slack. Повідомлення й події app залишаються станом застосунку, а не сигналами живучості транспорту.

## Контрольний список маніфесту та scopes

Базовий маніфест Slack app однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` слеш-команди).

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

Для **режиму HTTP Request URLs** замініть `settings` варіантом HTTP і додайте `url` до кожної slash-команди. Потрібна публічна URL-адреса:

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

Відкрийте різні функції, які розширюють наведені вище типові значення.

Типовий маніфест вмикає вкладку **Home** для Slack App Home і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку Home, OpenClaw публікує безпечний типовий вигляд Home за допомогою `views.publish`; корисне навантаження розмови або приватна конфігурація не включаються. Вкладка **Messages** залишається ввімкненою для приватних повідомлень Slack.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Замість однієї налаштованої команди можна використовувати кілька [нативних slash-команд](#commands-and-slash-behavior) з урахуванням нюансів:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше ніж 25 slash-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (типово)">

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
        Використовуйте той самий список `slash_commands`, що й у Socket Mode вище, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

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
  <Accordion title="Необов’язкові області авторства (операції запису)">
    Додайте область бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та піктограму) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте піктограму emoji, Slack очікує синтаксис `:emoji_name:`.

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
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні текстові
  рядки або об’єкти SecretRef.
- Токени конфігурації перевизначають резервні значення env.
- Резервні значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до типового облікового запису.
- `userToken` (`xoxp-...`) налаштовується лише в конфігурації (без резервного значення env) і типово має поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секретів, але поточний шлях команди/середовища виконання
  не зміг отримати фактичне значення.
- У режимі HTTP включено `signingSecretStatus`; у Socket Mode
  потрібна пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу токен користувача може мати перевагу, коли його налаштовано. Для записів перевага залишається за токеном бота; записи з токеном користувача дозволені лише коли `userTokenReadOnly: false` і токен бота недоступний.
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

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ідентифікатори файлів Slack, показані у вхідних плейсхолдерах файлів, і повертає попередні перегляди зображень для зображень або метадані локального файлу для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` контролює доступ DM. `channels.slack.allowFrom` — канонічний allowlist для DM.

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` контролює обробку каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розміщується в `channels.slack.channels` і **має використовувати стабільні ідентифікатори каналів Slack** (наприклад `C12345678`) як ключі конфігурації.

    Примітка щодо середовища виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), середовище виконання повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` задано).

    Розпізнавання назви/ідентифікатора:

    - записи списку дозволених каналів і записи списку дозволених DM розпізнаються під час запуску, коли доступ до токена це дозволяє
    - нерозпізнані записи з назвами каналів зберігаються як налаштовано, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів типово спершу використовують ID; пряме зіставлення за іменем користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі назв (`#channel-name` або `channel-name`) **не** збігаються за `groupPolicy: "allowlist"`. Пошук каналу типово спершу використовує ID, тому ключ на основі назви ніколи не маршрутизуватиметься успішно, а всі повідомлення в цьому каналі буде мовчки заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, а ключ на основі назви здається робочим.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою миші → **Copy link** — ID (`C...`) зʼявиться в кінці URL.

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

    Неправильно (мовчки блокується за `groupPolicy: "allowlist"`):

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
    Повідомлення в каналах типово пропускаються лише за наявності згадки.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач бота є учасником цієї групи користувачів; потребує `usergroups:read`
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - неявна поведінка гілки з відповіддю боту (вимкнено, коли `thread.requireExplicitMention` має значення `true`)

    Поканальні елементи керування (`channels.slack.channels.<id>`; назви лише через розпізнавання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список дозволених)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса досі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, написані ботом, приймаються лише тоді, коли бот-відправник явно вказаний у списку дозволених `users` цієї кімнати, або коли принаймні один явний ID власника Slack із `channels.slack.allowFrom` наразі є учасником кімнати. Wildcard і записи власників за відображуваним іменем не задовольняють умову присутності власника. Присутність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідний read-scope для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників не вдається, OpenClaw відкидає повідомлення кімнати, написане ботом.

  </Tab>
</Tabs>

## Гілки, сеанси та теги відповіді

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- Привʼязки маршрутів Slack приймають необроблені ID учасників, а також цільові форми Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- За типового `session.dmScope=main` DM Slack згортаються в головний сеанс агента.
- Сеанси каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в гілках можуть створювати суфікси сеансів гілок (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень гілки завантажується під час запуску нового сеансу гілки (типово `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, пригнічує неявні згадки в гілці, щоб бот відповідав лише на явні згадки `@bot` у гілках, навіть якщо бот уже брав участь у гілці. Без цього відповіді в гілці за участі бота обходять фільтр `requireMention`.

Елементи керування гілками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** гілки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги досі враховуються в режимі `"off"`. Гілки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими в рядку.
</Note>

## Реакції підтвердження

`ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розпізнавання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою живого попереднього перегляду:

- `off`: вимкнути потокове передавання живого попереднього перегляду.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерації, потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чернетковий попередній перегляд, спрямовувати оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (типово: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/прогресу.
- `streaming.preview.commandText` / `streaming.progress.commandText`: задайте `status`, щоб зберігати компактні рядки прогресу інструментів, приховуючи необроблений текст команд/exec (типово: `raw`).

Приховати необроблений текст команд/exec, зберігаючи компактні рядки прогресу:

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

- Для появи нативного потокового передавання тексту та стану гілки помічника Slack має бути доступна гілка відповіді. Вибір гілки досі відповідає `replyToMode`.
- Канали, групові чати та кореневі повідомлення DM верхнього рівня досі можуть використовувати звичайний чернетковий попередній перегляд, коли нативне потокове передавання недоступне або гілки відповіді немає.
- DM Slack верхнього рівня типово залишаються поза гілками, тому вони не показують нативний потоковий/статусний попередній перегляд Slack у стилі гілки; натомість OpenClaw публікує й редагує чернетковий попередній перегляд у DM.
- Медіа та нетекстові payloads повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні фінальні текстові/блокові повідомлення скидаються лише тоді, коли вони можуть редагувати попередній перегляд на місці.
- Якщо потокове передавання зазнає збою посеред відповіді, OpenClaw повертається до звичайної доставки для решти payloads.

Використати чернетковий попередній перегляд замість нативного потокового передавання тексту Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрує до `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` автоматично мігрує до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` автоматично мігрує до `channels.slack.streaming.nativeTransport`.

## Резервна реакція введення

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її, коли виконання завершується. Це найкорисніше поза відповідями в гілках, які використовують типовий індикатор стану "is typing...".

Порядок розпізнавання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично виконується після завершення відповіді або шляху помилки.

## Медіа, фрагментація та доставка

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених Slack (потік запиту з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне й обмеження розміру це дозволяють. Заповнювачі файлів включають Slack `fileId`, щоб агенти могли отримати оригінальний файл через `download-file`.

    Завантаження використовують обмежені тайм-аути простою та загального часу. Якщо отримання файлу Slack зависає або завершується з помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файлу.

    Типове runtime-обмеження розміру вхідних даних — `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття зі пріоритетом абзаців
    - надсилання файлів використовують API завантаження Slack і можуть включати відповіді в гілках (`thread_ts`)
    - обмеження вихідних медіа відповідає `channels.slack.mediaMaxMb`, коли налаштовано; інакше надсилання в канал використовує типові значення за MIME-типом із media pipeline

  </Accordion>

  <Accordion title="Delivery targets">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM Slack лише з текстом/блоками можуть публікуватися безпосередньо в ID користувачів; завантаження файлів і надсилання в гілках спершу відкривають DM через API розмов Slack, оскільки ці шляхи потребують конкретного ID розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash

Slash-команди зʼявляються в Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові значення команд:

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

Меню аргументів нативних команд використовують адаптивну стратегію рендерингу, яка показує модальне підтвердження перед dispatch вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній select з асинхронною фільтрацією опцій, коли доступні обробники interactivity options
- перевищені ліміти Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Slash-сеанси використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і досі маршрутизують виконання команд до цільового сеансу розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може рендерити інтерактивні елементи керування відповідями, створені агентом, але цю функцію типово вимкнено.

Увімкнути її глобально:

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

Або увімкнути її лише для одного облікового запису Slack:

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

Ці директиви компілюються в Slack Block Kit і маршрутизують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це інтерфейс, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це згенеровані OpenClaw непрозорі токени, а не сирі значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищуватимуть обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload блоків.

## Схвалення exec у Slack

Slack може працювати як нативний клієнт схвалень з інтерактивними кнопками та взаємодіями замість повернення до вебінтерфейсу або термінала.

- Схвалення exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналу.
- Схвалення Plugin все ще можуть оброблятися через ту саму нативну для Slack поверхню кнопок, коли запит уже потрапляє в Slack і тип id схвалення — `plugin:`.
- Авторизація схвалювачів усе ще застосовується: лише користувачі, визначені як схвалювачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок схвалення, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на схвалення відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX для схвалення; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента повідомляє, що схвалення
в чаті недоступні або ручне схвалення є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні схвалення exec, коли `enabled` не задано або має значення `"auto"` і визначено принаймні одного
схвалювача. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт схвалень.
Установіть `enabled: true`, щоб примусово ввімкнути нативні схвалення, коли визначено схвалювачів.

Типова поведінка без явної конфігурації схвалень exec у Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити схвалювачів, додати фільтри або
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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на схвалення exec також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack усе ще можуть обробляти схвалення Plugin, коли ці запити вже потрапляють
у Slack.

Same-chat `/approve` також працює в каналах Slack і DM, які вже підтримують команди. Див. [Схвалення exec](/uk/tools/exec-approvals), щоб переглянути повну модель переспрямування схвалень.

## Події та операційна поведінка

- Редагування/видалення повідомлень відображаються в системні події.
- Трансляції тредів (відповіді треду з «Also send to channel») обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій відображаються в системні події.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення відображаються в системні події.
- `channel_id_changed` може мігрувати ключі конфігурації каналів, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються ненадійним контекстом і можуть бути вставлені в контекст маршрутизації.
- Початкове повідомлення треду та засівання початкового контексту історії треду фільтруються налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і взаємодії з модальними вікнами створюють структуровані системні події `Slack interaction: ...` з насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker та метадані `workflow_*`
  - події modal `view_submission` і `view_closed` з метаданими маршрутизованого каналу та введеннями форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
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
    Перевірте в такому порядку:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`) — **ключі мають бути ID каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв тихо не спрацьовують за `groupPolicy: "allowlist"`, тому що маршрутизація каналів типово спершу використовує ID. Щоб знайти ID: клацніть канал у Slack правою кнопкою → **Copy link** — значення `C...` наприкінці URL є ID каналу.
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
    - схвалення pairing / записи allowlist
    - події DM Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію треду Assistant без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте bot + app токени та ввімкнення Socket Mode у налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    підтримане SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - webhook path
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється в знімках
    облікового запису, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, підтриманий SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник щодо бачення для вкладень

Slack може прикріплювати завантажені медіа до ходу агента, коли завантаження файлів Slack успішні й обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою vision; інші файли зберігаються як завантажуваний файловий контекст, а не обробляються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                      | Джерело              | Поточна поведінка                                                                 | Примітки                                                                 |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack      | Завантажуються й прикріплюються до ходу для обробки з підтримкою vision           | Обмеження на файл: `channels.slack.mediaMaxMb` (типово 20 MB)            |
| Файли PDF                      | URL файлу Slack      | Завантажуються й доступні як файловий контекст для інструментів, як-от `download-file` або `pdf` | Вхідні дані Slack не перетворюють PDF автоматично на image-vision input |
| Інші файли                     | URL файлу Slack      | Завантажуються, коли можливо, і доступні як файловий контекст                     | Бінарні файли не обробляються як вхідні зображення                       |
| Відповіді треду                | Файли початкового повідомлення треду | Файли кореневого повідомлення можуть бути гідратовані як контекст, коли відповідь не має безпосередніх медіа | Стартери лише з файлами використовують placeholder вкладення             |
| Повідомлення з кількома зображеннями | Кілька файлів Slack  | Кожен файл оцінюється незалежно                                                   | Обробка Slack обмежена вісьмома файлами на повідомлення                  |

### Вхідний pipeline

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватного URL Slack, використовуючи bot token (`xoxb-...`).
2. У разі успіху файл записується до сховища медіа.
3. Завантажені шляхи медіа та типи вмісту додаються до вхідного контексту.
4. Шляхи моделі/інструментів із підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня треду

Коли повідомлення надходить у треді (має батьківський `thread_ts`):

- Якщо сама відповідь не має безпосередніх медіа, а включене кореневе повідомлення має файли, Slack може гідратувати кореневі файли як контекст стартера треду.
- Безпосередні вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється з placeholder вкладенням, щоб fallback усе ще міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через медійний pipeline.
- Завантажені посилання на медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у payload події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделей

- **Обмеження розміру**: типово 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: файли, які Slack не може віддати, протерміновані URL, недоступні файли, надто великі файли та HTML-відповіді автентифікації/входу Slack пропускаються замість повідомлення як непідтримувані формати.
- **Vision model**: аналіз зображень використовує активну модель відповіді, коли вона підтримує vision, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                               | Обхідний шлях                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Прострочена URL-адреса файлу Slack    | Файл пропущено; помилка не відображається                                       | Повторно завантажте файл у Slack                                            |
| Модель зору не налаштовано            | Вкладення зображень зберігаються як медіапосилання, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використайте модель відповіді з підтримкою зору |
| Дуже великі зображення (> 20 MB за замовчуванням) | Пропущено відповідно до обмеження розміру                                       | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                   |
| Переслані/поширені вкладення          | Текст і медіа зображень/файлів, розміщені в Slack, обробляються за принципом найкращих зусиль | Повторно поширте безпосередньо в потоці OpenClaw                            |
| PDF-вкладення                         | Зберігаються як контекст файлу/медіа, але не спрямовуються автоматично через зоровий аналіз зображень | Використайте `download-file` для метаданих файлу або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення зорового аналізу вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Slack із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналу та групових DM.
  </Card>
  <Card title="Маршрутизація каналу" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритетність.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
