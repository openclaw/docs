---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (режим Socket + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

Готово до продакшену для DM і каналів через інтеграції застосунку Slack. Типовий режим — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Спарювання" icon="link" href="/uk/channels/pairing">
    Slack DM типово використовують режим спарювання.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
</CardGroup>

## Вибір між Socket Mode і HTTP Request URLs

Обидва транспорти готові до продакшену та мають паритет функцій для обміну повідомленнями, слеш-команд, App Home та інтерактивності. Обирайте за формою розгортання, а не за функціями.

| Аспект                       | Socket Mode (типово)                                                                 | HTTP Request URLs                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Публічна URL-адреса Gateway  | Не потрібна                                                                          | Потрібна (DNS, TLS, зворотний проксі або тунель)                                                                          |
| Вихідна мережа               | Вихідний WSS до `wss-primary.slack.com` має бути доступний                           | Без вихідного WS; лише вхідний HTTPS                                                                                      |
| Потрібні токени              | Bot token (`xoxb-...`) + App-Level Token (`xapp-...`) з `connections:write`          | Bot token (`xoxb-...`) + Signing Secret                                                                                   |
| Ноутбук розробника / за firewall | Працює без додаткових налаштувань                                                | Потрібен публічний тунель (ngrok, Cloudflare Tunnel, Tailscale Funnel) або staging Gateway                                |
| Горизонтальне масштабування  | Один сеанс Socket Mode на застосунок на хост; для кількох Gateway потрібні окремі застосунки Slack | Stateless POST-обробник; кілька реплік Gateway можуть спільно використовувати один застосунок за балансувальником навантаження |
| Кілька облікових записів на одному Gateway | Підтримується; кожен обліковий запис відкриває власний WS                    | Підтримується; кожному обліковому запису потрібен унікальний `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували |
| Транспорт слеш-команд        | Доставляються через WS-з’єднання; `slash_commands[].url` ігнорується                 | Slack надсилає POST до `slash_commands[].url`; поле потрібне для dispatch команди                                         |
| Підписування запитів         | Не використовується (автентифікація — це App-Level Token)                            | Slack підписує кожен запит; OpenClaw перевіряє через `signingSecret`                                                      |
| Відновлення після розриву з’єднання | Slack SDK автоматично перепідключається; застосовується налаштування pong-timeout транспорту Gateway | Немає постійного з’єднання, яке може розірватися; повторні спроби виконуються для кожного запиту від Slack                |

<Note>
  **Обирайте Socket Mode** для хостів з одним Gateway, ноутбуків розробників і on-prem мереж, які можуть виходити до `*.slack.com`, але не можуть приймати вхідний HTTPS.

**Обирайте HTTP Request URLs**, коли запускаєте кілька реплік Gateway за балансувальником навантаження, коли вихідний WSS заблокований, але вхідний HTTPS дозволений, або коли ви вже завершуєте Slack webhooks на зворотному проксі.
</Note>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (типово)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть свій workspace → вставте один із маніфестів нижче → **Next** → **Create**.

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
          **Recommended** відповідає повному набору функцій вбудованого Slack plugin: App Home, слеш-команди, файли, реакції, закріплення, групові DM та читання emoji/usergroup. Обирайте **Minimal**, коли політика workspace обмежує scopes — він покриває DM, історію каналів/груп, згадки та слеш-команди, але прибирає файли, реакції, закріплення, групові DM (`mpim:*`), `emoji:read` і `usergroups:read`. Див. [Чекліст маніфесту та scopes](#manifest-and-scope-checklist) для обґрунтування кожного scope й додаткових опцій, як-от додаткові слеш-команди.
        </Note>

        Після того як Slack створить застосунок:

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

        Резервний варіант через env (лише типовий обліковий запис):

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
      <Step title="Створіть новий застосунок Slack">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть свій workspace → вставте один із маніфестів нижче → замініть `https://gateway-host.example.com/slack/events` на публічну URL-адресу Gateway → **Next** → **Create**.

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

```json Мінімальний
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
          **Рекомендований** відповідає повному набору функцій вбудованого Slack plugin; **Мінімальний** вилучає файли, реакції, закріплення, групові DM (`mpim:*`), `emoji:read` і `usergroups:read` для робочих просторів із суворими обмеженнями. Див. [контрольний список маніфеста й scope](#manifest-and-scope-checklist), щоб отримати обґрунтування для кожного scope.
        </Note>

        <Info>
          Усі три поля URL (`slash_commands[].url`, `event_subscriptions.request_url` і `interactivity.request_url` / `message_menu_options_url`) вказують на той самий endpoint OpenClaw. Схема маніфеста Slack вимагає, щоб вони називалися окремо, але OpenClaw маршрутизує за типом payload, тож достатньо одного `webhookPath` (типово `/slack/events`). Slash-команди без `slash_commands[].url` у режимі HTTP непомітно не виконуватимуть жодної дії.
        </Info>

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

OpenClaw типово встановлює для клієнта Slack SDK тайм-аут pong у 15 секунд для Socket Mode. Перевизначайте налаштування транспорту лише тоді, коли потрібне налаштування під конкретний робочий простір або хост:

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

Використовуйте це лише для робочих просторів Socket Mode, які журналюють тайм-аути Slack websocket pong/server-ping, або працюють на хостах із відомим голодуванням event loop. `clientPingTimeout` — це очікування pong після того, як SDK надсилає client ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення й події app залишаються станом застосунку, а не сигналами живучості транспорту.

## Контрольний список маніфеста й scope

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

### Додаткові налаштування маніфеста

Відкрийте різні функції, що розширюють наведені вище типові значення.

Типовий маніфест вмикає вкладку Slack App Home **Home** і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку Home, OpenClaw публікує безпечний типовий Home view за допомогою `views.publish`; payload розмови або приватна конфігурація не включаються. Вкладка **Messages** залишається ввімкненою для Slack DM.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Можна використовувати кілька [нативних slash-команд](#commands-and-slash-behavior) замість однієї налаштованої команди, з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 slash-команд.

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
        Використовуйте той самий список `slash_commands`, що й вище для Socket Mode, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

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
  <Accordion title="Додаткові області авторства (операції запису)">
    Додайте область бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (користувацьке ім'я та піктограму) замість стандартної ідентичності застосунку Slack.

    Якщо ви використовуєте піктограму emoji, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Додаткові області user-token (операції читання)">
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
- HTTP-режим потребує `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об'єкти SecretRef.
- Токени конфігурації перевизначають резервне значення env.
- Резервне значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до стандартного облікового запису.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного значення env) і за замовчуванням має поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан: `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секрету, але поточна команда/шлях виконання
  не змогли визначити фактичне значення.
- У HTTP-режимі включено `signingSecretStatus`; у Socket Mode
  обов'язкова пара — це `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу user token може мати перевагу, коли його налаштовано. Для записів bot token залишається пріоритетним; записи через user-token дозволені лише коли `userTokenReadOnly: false` і bot token недоступний.
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

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` — канонічний список дозволів DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (за замовчуванням true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM за замовчуванням false)
    - `dm.groupChannels` (необов'язковий список дозволів MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналу">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Список дозволів каналів міститься в `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад, `C12345678`) як ключі конфігурації.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), середовище виконання повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` задано).

    Розпізнавання імені/ID:

    - записи списку дозволів каналів і записи списку дозволів DM розпізнаються під час запуску, коли доступ токена це дозволяє
    - нерозпізнані записи з іменами каналів зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням спершу використовують ID; пряме зіставлення імені користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** збігаються за `groupPolicy: "allowlist"`. Пошук каналу за замовчуванням спершу використовує ID, тому ключ на основі імені ніколи не маршрутизуватиметься успішно, а всі повідомлення в цьому каналі буде тихо заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і здається, що ключ на основі імені працює.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою миші → **Copy link** — ID (`C...`) з'являється наприкінці URL.

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
    Повідомлення каналів за замовчуванням обмежені згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач бота є учасником цієї групи користувачів; потребує `usergroups:read`
    - шаблони регулярних виразів для згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді на потік із ботом (вимкнено, коли `thread.requireExplicitMention` має значення `true`)

    Поканальні елементи керування (`channels.slack.channels.<id>`; імена лише через розв'язання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або символ узагальнення `"*"`
      (застарілі ключі без префікса й надалі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише тоді, коли бот-відправник явно вказаний в allowlist `users` цієї кімнати, або коли принаймні один явний ID власника Slack із `channels.slack.allowFrom` зараз є учасником кімнати. Символи узагальнення та записи власників за відображуваним іменем не задовольняють наявність власника. Наявність власника використовує `conversations.members` Slack; переконайтеся, що застосунок має відповідну область читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників завершується невдало, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Потоки, сеанси та теги відповідей

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- Прив'язки маршрутів Slack приймають сирі ID співрозмовників, а також форми цілей Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- З типовим `session.dmScope=main` DM Slack згортаються до головного сеансу агента.
- Сеанси каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в потоках можуть створювати суфікси сеансів потоків (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує кількістю наявних повідомлень потоку, які отримуються під час запуску нового сеансу потоку (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, пригнічує неявні згадки в потоках, щоб бот відповідав лише на явні згадки `@bot` усередині потоків, навіть якщо бот уже брав участь у потоці. Без цього відповіді в потоці, де брав участь бот, обходять обмеження `requireMention`.

Елементи керування потоками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: окремо для `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** потоки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги й надалі враховуються в режимі `"off"`. Потоки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими в рядку.
</Note>

## Реакції підтвердження

`ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розв'язання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує короткі коди (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Текстове потокове передавання

`channels.slack.streaming` керує поведінкою живого попереднього перегляду:

- `off`: вимкнути потокове передавання живого попереднього перегляду.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст стану поступу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли чернетковий попередній перегляд активний, спрямовувати оновлення інструментів/поступу в те саме редаговане повідомлення попереднього перегляду (типово: `true`). Установіть `false`, щоб зберігати окремі повідомлення інструментів/поступу.
- `streaming.preview.commandText` / `streaming.progress.commandText`: установіть `status`, щоб зберігати компактні рядки поступу інструментів, приховуючи сирий текст команд/виконання (типово: `raw`).

Приховати сирий текст команд/виконання, зберігаючи компактні рядки поступу:

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

`channels.slack.streaming.nativeTransport` керує нативним текстовим потоковим передаванням Slack, коли `channels.slack.streaming.mode` має значення `partial` (типово: `true`).

- Для появи нативного текстового потокового передавання та стану потоку асистента Slack має бути доступний потік відповіді. Вибір потоку й надалі дотримується `replyToMode`.
- Канали, групові чати та кореневі повідомлення DM верхнього рівня й надалі можуть використовувати звичайний чернетковий попередній перегляд, коли нативне потокове передавання недоступне або немає потоку відповіді.
- DM Slack верхнього рівня за замовчуванням залишаються поза потоками, тому вони не показують нативний попередній перегляд потоку/стану Slack у стилі потоку; натомість OpenClaw публікує та редагує чернетковий попередній перегляд у DM.
- Медіа та нетекстові корисні навантаження повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні текстові/блокові фінальні повідомлення скидаються лише тоді, коли вони можуть редагувати попередній перегляд на місці.
- Якщо потокове передавання завершується невдало посеред відповіді, OpenClaw повертається до звичайної доставки для решти корисних навантажень.

Використовуйте чернетковий попередній перегляд замість нативного текстового потокового передавання Slack:

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

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в гілках, які використовують типовий індикатор стану "is typing...".

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує короткі коди (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично пробується після завершення відповіді або шляху помилки.

## Медіа, фрагментація та доставка

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених у Slack (потік запиту з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне та обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл через `download-file`.

    Завантаження використовують обмежені тайм-аути простою та загального часу. Якщо отримання файлу Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файлу.

    Стандартне обмеження розміру вхідних даних під час виконання становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ із пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в гілках (`thread_ts`)
    - обмеження вихідних медіа бере `channels.slack.mediaMaxMb`, коли його налаштовано; інакше надсилання в канали використовує типові значення MIME-виду з конвеєра медіа

  </Accordion>

  <Accordion title="Delivery targets">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Текстові або лише блокові DM Slack можуть публікуватися безпосередньо за ID користувачів; завантаження файлів і надсилання в гілках спочатку відкривають DM через API розмов Slack, бо ці шляхи потребують конкретного ID розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash

Slash-команди з’являються у Slack як одна налаштована команда або кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити стандартні параметри команди:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових налаштувань маніфесту](#additional-manifest-settings) у вашій програмі Slack і натомість вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим нативних команд для Slack **вимкнено**, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Меню нативних аргументів використовують адаптивну стратегію відображення, яка показує модальне вікно підтвердження перед dispatch вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронною фільтрацією опцій, коли доступні обробники параметрів інтерактивності
- перевищено обмеження Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Slash-сесії використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно спрямовують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи керування відповідями, створені агентом, але ця функція типово вимкнена.

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

Коли ввімкнено, агенти можуть виводити директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються у Slack Block Kit і спрямовують натискання або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не сирі значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищили б обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного корисного навантаження блоків.

## Exec-затвердження у Slack

Slack може діяти як нативний клієнт затвердження з інтерактивними кнопками та взаємодіями, замість повернення до Web UI або термінала.

- Exec-затвердження використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналу.
- Plugin-затвердження все ще можуть розв’язуватися через ту саму нативну для Slack поверхню кнопок, коли запит уже потрапляє у Slack і вид ID затвердження — `plugin:`.
- Авторизація затверджувачів усе ще застосовується: лише користувачі, визначені як затверджувачі, можуть затверджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок затвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашої програми Slack, запити на затвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки наявні, вони є основним UX затвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що chat
затвердження недоступні або ручне затвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні exec-затвердження, коли `enabled` не задано або має значення `"auto"` і принаймні один
затверджувач розв’язується. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт затвердження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні затвердження, коли затверджувачі розв’язуються.

Типова поведінка без явної конфігурації exec-затверджень Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли потрібно перевизначити затверджувачів, додати фільтри або
вибрати доставку в початковий чат:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити exec-затвердження також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack усе ще можуть розв’язувати Plugin-затвердження, коли ці запити вже потрапляють
у Slack.

`/approve` у тому самому чаті також працює в каналах Slack і DM, які вже підтримують команди. Див. [Exec-затвердження](/uk/tools/exec-approvals), щоб ознайомитися з повною моделлю переспрямування затверджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень зіставляються із системними подіями.
- Трансляції гілок (відповіді в гілках "Also send to channel") обробляються як звичайні повідомлення користувачів.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасників, створення/перейменування каналу та додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналів, коли `configWrites` увімкнено.
- Метадані теми/призначення каналу вважаються ненадійним контекстом і можуть бути введені в контекст маршрутизації.
- Початкове повідомлення гілки та засівання контексту початкової історії гілки фільтруються налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і модальні взаємодії створюють структуровані системні події `Slack interaction: ...` з багатими полями корисного навантаження:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` із маршрутизованими метаданими каналу та введеннями форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (break-glass; тримайте вимкненим, якщо не потрібно)
- доступ до каналу: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- гілки/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="No replies in channels">
    Перевірте по черзі:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`) — **ключами мають бути ID каналів** (`C12345678`), а не назви (`#channel-name`). Ключі на основі назв непомітно не спрацьовують із `groupPolicy: "allowlist"`, бо маршрутизація каналів типово спочатку використовує ID. Щоб знайти ID: клацніть канал у Slack правою кнопкою → **Copy link** — значення `C...` наприкінці URL є ID каналу.
    - `requireMention`
    - per-channel allowlist `users`

    Корисні команди:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - затвердження pairing / записи allowlist
    - Події DM Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав подію редагованої гілки Assistant без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Перевірте токени бота й програми та ввімкнення Socket Mode у налаштуваннях програми Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштований, але поточне середовище виконання не змогло розв’язати
    значення на основі SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Перевірте:

    - секрет підписування
    - шлях Webhook
    - URL запитів Slack (події + інтерактивність + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, HTTP-обліковий запис налаштований, але поточне середовище виконання не змогло
    розв’язати секрет підписування на основі SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими у Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник vision для вкладень

Slack може прикріплювати завантажені медіа до ходу агента, коли завантаження файлів Slack успішні й обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою vision; інші файли зберігаються як завантажуваний файловий контекст, а не обробляються як вхідне зображення.

### Підтримувані типи медіа

| Тип медіа                      | Джерело              | Поточна поведінка                                                               | Примітки                                                                  |
| ------------------------------ | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack      | Завантажуються й додаються до ходу для обробки з підтримкою зору                | Ліміт на файл: `channels.slack.mediaMaxMb` (за замовчуванням 20 MB)       |
| Файли PDF                      | URL файлу Slack      | Завантажуються й надаються як файловий контекст для інструментів на кшталт `download-file` або `pdf` | Вхідні дані Slack не перетворюють PDF на вхідні дані для image-vision автоматично |
| Інші файли                     | URL файлу Slack      | Завантажуються, коли це можливо, і надаються як файловий контекст               | Бінарні файли не обробляються як вхідні зображення                        |
| Відповіді в треді              | Файли початкового повідомлення треду | Файли кореневого повідомлення можуть бути додані як контекст, коли відповідь не має власних медіа | Початкові повідомлення лише з файлами використовують placeholder вкладення |
| Повідомлення з кількома зображеннями | Кілька файлів Slack | Кожен файл оцінюється незалежно                                                 | Обробка Slack обмежена вісьмома файлами на повідомлення                   |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватного URL Slack за допомогою токена бота (`xoxb-...`).
2. У разі успіху файл записується до сховища медіа.
3. Шляхи до завантажених медіа й типи вмісту додаються до вхідного контексту.
4. Шляхи моделей/інструментів із підтримкою зображень можуть використовувати вкладені зображення з цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня треду

Коли повідомлення надходить у треді (має батьківський `thread_ts`):

- Якщо сама відповідь не має безпосередніх медіа, а включене кореневе повідомлення має файли, Slack може додати кореневі файли як контекст початкового повідомлення треду.
- Безпосередні вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється placeholder вкладення, щоб fallback все одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через конвеєр медіа.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у payload події.
- Збій завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделей

- **Ліміт розміру**: за замовчуванням 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Збої завантаження**: файли, які Slack не може віддати, прострочені URL, недоступні файли, завеликі файли та HTML-відповіді Slack для автентифікації/входу пропускаються замість того, щоб повідомлятися як непідтримувані формати.
- **Модель зору**: аналіз зображень використовує активну модель відповіді, коли вона підтримує зір, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                           | Обхідний шлях                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Прострочений URL файлу Slack          | Файл пропускається; помилка не показується                                  | Повторно завантажте файл у Slack                                           |
| Модель зору не налаштована            | Вкладені зображення зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використайте модель відповіді з підтримкою зору |
| Дуже великі зображення (> 20 MB за замовчуванням) | Пропускаються відповідно до ліміту розміру                                  | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                  |
| Переслані/поширені вкладення          | Текст і розміщені у Slack медіа зображень/файлів обробляються best-effort   | Поширте їх напряму в треді OpenClaw                                        |
| Вкладення PDF                         | Зберігаються як файловий/медійний контекст, не спрямовуються автоматично через image vision | Використайте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення зору для вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Slack із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових DM.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і зміцнення захисту.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритети.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
