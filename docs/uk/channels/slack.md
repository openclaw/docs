---
read_when:
    - Налаштування Slack або налагодження сокетного/HTTP-режиму Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-06T12:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

Готовий до production-використання для DM і каналів через інтеграції Slack app. Режим за замовчуванням — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    DM у Slack за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з виправлення.
  </Card>
</CardGroup>

## Вибір між Socket Mode і HTTP Request URLs

Обидва транспорти готові до production-використання й мають паритет функцій для обміну повідомленнями, slash commands, App Home та інтерактивності. Обирайте за формою розгортання, а не за функціями.

| Критерій                     | Socket Mode (за замовчуванням)                                                       | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Публічна URL-адреса Gateway  | Не потрібна                                                                          | Потрібна (DNS, TLS, reverse proxy або тунель)                                                                  |
| Вихідна мережа               | Вихідне WSS до `wss-primary.slack.com` має бути доступним                            | Без вихідного WS; лише вхідний HTTPS                                                                           |
| Потрібні токени              | Bot token (`xoxb-...`) + App-Level Token (`xapp-...`) з `connections:write`          | Bot token (`xoxb-...`) + Signing Secret                                                                        |
| Ноутбук розробника / за firewall | Працює як є                                                                      | Потребує публічного тунелю (ngrok, Cloudflare Tunnel, Tailscale Funnel) або staging Gateway                    |
| Горизонтальне масштабування  | Один сеанс Socket Mode на app на host; кільком Gateway потрібні окремі Slack apps    | Stateless POST-обробник; кілька реплік Gateway можуть спільно використовувати одну app за load balancer        |
| Кілька облікових записів на одному Gateway | Підтримується; кожен обліковий запис відкриває власний WS                 | Підтримується; кожному обліковому запису потрібен унікальний `webhookPath` (за замовчуванням `/slack/events`), щоб реєстрації не конфліктували |
| Транспорт slash command      | Доставляється через WS-з'єднання; `slash_commands[].url` ігнорується                 | Slack надсилає POST до `slash_commands[].url`; поле потрібне, щоб команда виконувалася                         |
| Підписування запитів         | Не використовується (автентифікація — це App-Level Token)                            | Slack підписує кожен запит; OpenClaw перевіряє за допомогою `signingSecret`                                    |
| Відновлення після розриву з'єднання | Slack SDK автоматично перепідключається; застосовується transport tuning Gateway для pong-timeout | Немає постійного з'єднання, яке може розірватися; повторні спроби виконуються Slack окремо для кожного запиту |

<Note>
  **Обирайте Socket Mode** для host з одним Gateway, ноутбуків розробників і on-prem мереж, які можуть вихідно звертатися до `*.slack.com`, але не можуть приймати вхідний HTTPS.

**Обирайте HTTP Request URLs**, коли запускаєте кілька реплік Gateway за load balancer, коли вихідний WSS заблокований, але вхідний HTTPS дозволений, або коли ви вже завершуєте Slack Webhook на reverse proxy.
</Note>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть свій workspace → вставте один із manifest нижче → **Next** → **Create**.

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
          **Recommended** відповідає повному набору функцій вбудованого Slack Plugin: App Home, slash commands, файли, реакції, pins, групові DM та читання emoji/usergroup. Обирайте **Minimal**, коли політика workspace обмежує scopes — він охоплює DM, історію каналів/груп, згадки та slash commands, але прибирає файли, реакції, pins, групові DM (`mpim:*`), `emoji:read` і `usergroups:read`. Див. [чеклист manifest і scope](#manifest-and-scope-checklist) для обґрунтування кожного scope та додаткових опцій, як-от додаткові slash commands.
        </Note>

        Після того як Slack створить app:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: додайте `connections:write`, збережіть, скопіюйте значення `xapp-...`.
        - **Install App → Install to Workspace**: скопіюйте `xoxb-...` Bot User OAuth Token.

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

        Env fallback (лише обліковий запис за замовчуванням):

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
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть свій workspace → вставте один із manifest нижче → замініть `https://gateway-host.example.com/slack/events` на вашу публічну URL-адресу Gateway → **Next** → **Create**.

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
          **Рекомендовано** відповідає повному набору функцій вбудованого Slack plugin; **Мінімальний** вилучає файли, реакції, закріплення, групові DM (`mpim:*`), `emoji:read` і `usergroups:read` для робочих просторів з обмеженнями. Перегляньте [контрольний список маніфесту та scope](#manifest-and-scope-checklist), щоб дізнатися обґрунтування для кожного scope.
        </Note>

        <Info>
          Усі три URL-поля (`slash_commands[].url`, `event_subscriptions.request_url` і `interactivity.request_url` / `message_menu_options_url`) вказують на той самий endpoint OpenClaw. Схема маніфесту Slack вимагає називати їх окремо, але OpenClaw маршрутизує за типом payload, тому достатньо одного `webhookPath` (типово `/slack/events`). Slash commands без `slash_commands[].url` у HTTP-режимі непомітно нічого не виконуватимуть.
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

OpenClaw типово встановлює тайм-аут pong клієнта Slack SDK на 15 секунд для Socket Mode. Перевизначайте налаштування транспорту лише тоді, коли потрібне налаштування для конкретного робочого простору або хоста:

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

Використовуйте це лише для робочих просторів Socket Mode, які логують тайм-аути Slack websocket pong/server-ping, або запускаються на хостах з відомим виснаженням event loop. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення й події app залишаються станом застосунку, а не сигналами працездатності транспорту.

## Контрольний список маніфесту та scope

Базовий маніфест Slack app однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` slash command).

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

Для режиму **HTTP Request URLs** замініть `settings` на HTTP-варіант і додайте `url` до кожного slash command. Потрібна публічна URL-адреса:

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

Типовий маніфест вмикає вкладку **Home** у Slack App Home і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку Home, OpenClaw публікує безпечний типовий Home view за допомогою `views.publish`; payload розмови або приватна конфігурація не включаються. Вкладка **Messages** залишається ввімкненою для Slack DM.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash commands">

    Кілька [нативних slash commands](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з такими нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше ніж 25 slash commands.

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
  <Accordion title="Додаткові області авторства (операції запису)">
    Додайте область бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (користувацьке ім’я та іконку) замість стандартної ідентичності застосунку Slack.

    Якщо ви використовуєте іконку emoji, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Додаткові області токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типові області читання такі:

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
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають рядки відкритого тексту
  або об’єкти SecretRef.
- Токени конфігурації мають пріоритет над резервним значенням з env.
- Резервне значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до стандартного облікового запису.
- `userToken` (`xoxp-...`) задається лише в конфігурації (без резервного значення env) і за замовчуванням працює лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секретів, але поточна команда чи шлях виконання
  не змогли отримати фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  обов’язкова пара — це `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій і читання каталогу токен користувача може мати пріоритет, коли його налаштовано. Для запису пріоритет залишається за токеном бота; записи через токен користувача дозволені лише тоді, коли `userTokenReadOnly: false` і токен бота недоступний.
</Tip>

## Дії та шлюзи

Дії Slack керуються через `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | За замовчуванням |
| ---------- | ---------------- |
| messages   | увімкнено        |
| reactions  | увімкнено        |
| pins       | увімкнено        |
| memberInfo | увімкнено        |
| emojiList  | увімкнено        |

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ID файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередні перегляди зображень для зображень або метадані локального файла для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` є канонічним списком дозволених для DM.

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

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` мігрує їх у `dmPolicy` і `allowFrom`, коли це можливо без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Список дозволених каналів розташований у `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад `C12345678`) як ключі конфігурації.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), виконання повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` задано).

    Розпізнавання імені/ID:

    - записи списку дозволених каналів і записи списку дозволених DM розпізнаються під час запуску, коли доступ токена це дозволяє
    - нерозпізнані записи імен каналів зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням спершу використовують ID; пряме зіставлення за іменем користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** збігаються з `groupPolicy: "allowlist"`. Пошук каналу за замовчуванням спершу використовує ID, тому ключ на основі імені ніколи не маршрутизуватиметься успішно, а всі повідомлення в цьому каналі будуть мовчки заблоковані. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і ключ на основі імені виглядає так, ніби працює.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою → **Copy link** — ID (`C...`) з’являється наприкінці URL.

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

    Неправильно (мовчки блокується з `groupPolicy: "allowlist"`):

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

  <Tab title="Згадки та користувачі каналів">
    Повідомлення каналів за замовчуванням обмежені згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач-бот є учасником цієї групи користувачів; потребує `usergroups:read`
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді боту (вимкнено, коли `thread.requireExplicitMention` дорівнює `true`)

    Елементи керування для кожного каналу (`channels.slack.channels.<id>`; імена лише через розпізнавання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список дозволених)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса досі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише тоді, коли бот-відправник явно вказаний у списку дозволених `users` цієї кімнати, або коли принаймні один явний ID власника Slack з `channels.slack.allowFrom` зараз є учасником кімнати. Wildcard і записи власників за відображуваним ім’ям не задовольняють наявність власника. Наявність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідну область читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників не вдається, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Треди, сесії та теги відповідей

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- Прив’язки маршрутів Slack приймають необроблені ID співрозмовників, а також цільові форми Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- З типовим `session.dmScope=main` DM Slack зводяться до головної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в треді можуть створювати суфікси сесії треду (`:thread:<threadTs>`), коли це застосовно.
- `channels.slack.thread.historyScope` за замовчуванням дорівнює `thread`; `thread.inheritParent` за замовчуванням дорівнює `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень треду отримується, коли запускається нова сесія треду (за замовчуванням `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (за замовчуванням `false`): коли `true`, пригнічує неявні згадки в треді, щоб бот відповідав лише на явні згадки `@bot` у тредах, навіть якщо бот уже брав участь у треді. Без цього відповіді в треді за участю бота обходять обмеження `requireMention`.

Елементи керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (за замовчуванням `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **усі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги досі враховуються в режимі `"off"`. Треди Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими в рядку.
</Note>

## Реакції підтвердження

`ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервна emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує короткі коди (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду наживо:

- `off`: вимкнути потокове передавання попереднього перегляду наживо.
- `partial` (за замовчуванням): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли чернетка попереднього перегляду активна, маршрутизувати оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/прогресу.
- `streaming.preview.commandText` / `streaming.progress.commandText`: задайте `status`, щоб зберігати компактні рядки прогресу інструментів, приховуючи необроблений текст команд/exec (за замовчуванням: `raw`).

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

`channels.slack.streaming.nativeTransport` керує нативним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` дорівнює `partial` (за замовчуванням: `true`).

- Для появи нативного потокового передавання тексту та стану треду помічника Slack має бути доступний тред відповіді. Вибір треду досі відповідає `replyToMode`.
- Канал, груповий чат і кореневі DM верхнього рівня досі можуть використовувати звичайну чернетку попереднього перегляду, коли нативне потокове передавання недоступне або треду відповіді немає.
- DM Slack верхнього рівня за замовчуванням залишаються поза тредом, тому вони не показують нативний потоковий/статусний попередній перегляд Slack у стилі треду; натомість OpenClaw публікує та редагує чернетку попереднього перегляду в DM.
- Медіа та нетекстові payload повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні текстові/блокові фінали скидаються лише тоді, коли можуть редагувати попередній перегляд на місці.
- Якщо потокове передавання не вдається посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload.

Використовуйте чернетку попереднього перегляду замість нативного потокового передавання тексту Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) є застарілим runtime-псевдонімом для `channels.slack.streaming.mode`.
- булевий `channels.slack.streaming` є застарілим runtime-псевдонімом для `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` є runtime-псевдонімом для `channels.slack.streaming.nativeTransport`.
- Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію потокового передавання Slack на канонічні ключі.

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім прибирає її після завершення запуску. Це найкорисніше поза відповідями в тредах, які використовують типовий індикатор стану "is typing...".

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcode-и (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично виконується після завершення відповіді або шляху помилки.

## Медіа, фрагментація та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених у Slack (потік запитів із токен-автентифікацією), і записуються до медіасховища, коли отримання успішне та обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл за допомогою `download-file`.

    Завантаження використовують обмежені тайм-аути простою та загального часу. Якщо отримання файла Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файла.

    Типове runtime-обмеження розміру вхідних даних становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття з пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може містити відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа відповідає `channels.slack.mediaMaxMb`, якщо налаштовано; інакше надсилання каналом використовує типові значення за MIME-видом із медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Текстові або лише блокові DM Slack можуть публікуватися безпосередньо в ID користувачів; завантаження файлів і надсилання в тредах спершу відкривають DM через API розмов Slack, оскільки ці шляхи потребують конкретного ID розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash-команд

Slash-команди відображаються в Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові значення команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових налаштувань manifest](#additional-manifest-settings) у вашому застосунку Slack і натомість вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим нативних команд **вимкнено** для Slack, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Меню аргументів нативних команд використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед dispatch вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронним фільтруванням опцій, коли доступні обробники опцій інтерактивності
- перевищено ліміти Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Slash-сесії використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно маршрутизують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

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

Коли ввімкнено, агенти можуть створювати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і маршрутизують натискання або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback-ів є непрозорими токенами, згенерованими OpenClaw, а не сирими значеннями, створеними агентом.
- Якщо згенеровані інтерактивні блоки перевищили б ліміти Slack Block Kit, OpenClaw повертається до оригінальної текстової відповіді замість надсилання недійсного payload блоків.

## Exec-схвалення в Slack

Slack може діяти як нативний клієнт схвалення з інтерактивними кнопками та взаємодіями замість fallback до Web UI або термінала.

- Exec-схвалення використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналом.
- Схвалення Plugin усе ще можуть розв’язуватися через ту саму нативну поверхню кнопок Slack, коли запит уже потрапляє в Slack, а вид ID схвалення — `plugin:`.
- Авторизація схвалювача все ще застосовується: лише користувачі, визначені як схвалювачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок схвалення, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на схвалення рендеряться як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що чат-схвалення
недоступні або ручне схвалення є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; повертається до `commands.ownerAllowFrom`, коли можливо)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні exec-схвалення, коли `enabled` не встановлено або дорівнює `"auto"` і принаймні один
схвалювач розв’язується. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт схвалення.
Установіть `enabled: true`, щоб примусово ввімкнути нативні схвалення, коли схвалювачі розв’язуються.

Типова поведінка без явної конфігурації exec-схвалення Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли потрібно перевизначити схвалювачів, додати фільтри або
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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити exec-схвалення також мають
маршрутизуватися до інших чатів або явних позаканальних цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack усе ще можуть розв’язувати схвалення Plugin, коли ці запити вже потрапляють
у Slack.

Same-chat `/approve` також працює в каналах Slack і DM, які вже підтримують команди. Див. [Exec-схвалення](/uk/tools/exec-approvals), щоб переглянути повну модель переспрямування схвалень.

## Події та операційна поведінка

- Редагування/видалення повідомлень зіставляються із системними подіями.
- Трансляції тредів (відповіді в тредах "Also send to channel") обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасника, створення/перейменування каналу та додавання/видалення pin зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу розглядаються як недовірений контекст і можуть бути впроваджені в контекст маршрутизації.
- Початкове повідомлення треду та початкове засівання контексту історії треду фільтруються за налаштованими allowlist-ами відправників, коли застосовно.
- Block actions і модальні взаємодії створюють структуровані системні події `Slack interaction: ...` з багатими полями payload:
  - block actions: вибрані значення, мітки, значення picker-а та метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеннями форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Важливі поля Slack">

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
    - allowlist каналів (`channels.slack.channels`) — **ключами мають бути ID каналів** (`C12345678`), а не назви (`#channel-name`). Ключі на основі назв мовчки не спрацьовують під `groupPolicy: "allowlist"`, оскільки маршрутизація каналів типово насамперед використовує ID. Щоб знайти ID: клацніть канал у Slack правою кнопкою → **Copy link** — значення `C...` наприкінці URL є ID каналу.
    - `requireMention`
    - allowlist `users` для окремого каналу

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
    - схвалення pairing / записи allowlist
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
    налаштовано, але поточний runtime не зміг розв’язати значення на основі SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях Webhook
    - URL запитів Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у snapshot-ах облікового запису,
    HTTP-обліковий запис налаштовано, але поточний runtime не зміг
    розв’язати signing secret на основі SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на меті:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist-и каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник vision для вкладень

Slack може прикріплювати завантажені медіафайли до ходу агента, коли завантаження файлів Slack успішне й обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою зору; інші файли зберігаються як завантажуваний файловий контекст, а не обробляються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                      | Джерело             | Поточна поведінка                                                               | Примітки                                                                  |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack     | Завантажуються й прикріплюються до ходу для обробки з підтримкою зору           | Ліміт на файл: `channels.slack.mediaMaxMb` (типово 20 МБ)                 |
| PDF-файли                      | URL файлу Slack     | Завантажуються й надаються як файловий контекст для інструментів, як-от `download-file` або `pdf` | Вхідні дані Slack не перетворюють PDF автоматично на вхідні дані для зору |
| Інші файли                     | URL файлу Slack     | Завантажуються, коли це можливо, і надаються як файловий контекст               | Двійкові файли не обробляються як вхідні зображення                       |
| Відповіді в гілці              | Файли початкового повідомлення гілки | Файли кореневого повідомлення можуть бути додані як контекст, коли відповідь не має власних медіа | Початкові повідомлення лише з файлами використовують заповнювач вкладення |
| Повідомлення з кількома зображеннями | Кілька файлів Slack | Кожен файл оцінюється незалежно                                                  | Обробка Slack обмежена вісьмома файлами на повідомлення                   |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватної URL-адреси Slack за допомогою токена бота (`xoxb-...`).
2. У разі успіху файл записується до сховища медіа.
3. Завантажені шляхи медіа й типи вмісту додаються до вхідного контексту.
4. Шляхи моделей/інструментів із підтримкою зображень можуть використовувати вкладені зображення з цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня гілки

Коли повідомлення надходить у гілці (має батьківський `thread_ts`):

- Якщо сама відповідь не має власних медіа, а включене кореневе повідомлення має файли, Slack може додати кореневі файли як контекст початку гілки.
- Прямі вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється заповнювачем вкладення, щоб резервний шлях усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через конвеєр медіа.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження й моделі

- **Ліміт розміру**: типово 20 МБ на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: файли, які Slack не може віддати, прострочені URL-адреси, недоступні файли, завеликі файли та HTML-відповіді автентифікації/входу Slack пропускаються, а не повідомляються як непідтримувані формати.
- **Модель зору**: аналіз зображень використовує активну модель відповіді, якщо вона підтримує зір, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                            | Обхідний шлях                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Прострочена URL-адреса файлу Slack    | Файл пропущено; помилка не показується                                       | Повторно завантажте файл у Slack                                           |
| Модель зору не налаштована            | Вкладені зображення зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використайте модель відповіді з підтримкою зору |
| Дуже великі зображення (> 20 МБ типово) | Пропущено відповідно до ліміту розміру                                      | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                  |
| Переслані/поширені вкладення          | Текст і медіа зображень/файлів, розміщені в Slack, обробляються за принципом найкращої спроби | Повторно поширте безпосередньо в гілці OpenClaw                            |
| PDF-вкладення                         | Зберігаються як файловий/медійний контекст, не спрямовуються автоматично через зір для зображень | Використовуйте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення зору для вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зв’язати користувача Slack із Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових приватних повідомлень.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Спрямовувати вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і зміцнення захисту.
  </Card>
  <Card title="Configuration" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритетність.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
