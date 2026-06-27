---
read_when:
    - Налаштування Slack або налагодження режиму сокета, HTTP чи ретрансляції Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode, URL-адреси HTTP-запитів і режим ретрансляції)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:13:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Готово до використання в продакшені для DM і каналів через інтеграції застосунку Slack. Режим за замовчуванням — Socket Mode; URL-адреси HTTP-запитів також підтримуються. Режим ретрансляції призначений для керованих розгортань, де довірений маршрутизатор відповідає за вхідний трафік Slack.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    DM Slack за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Діагностика між каналами й інструкції з відновлення.
  </Card>
</CardGroup>

## Вибір Socket Mode або URL-адрес HTTP-запитів

Обидва транспорти готові до використання в продакшені та мають паритет функцій для повідомлень, slash-команд, App Home й інтерактивності. Обирайте за формою розгортання, а не за функціями.

| Аспект                       | Socket Mode (за замовчуванням)                                                                                                                       | URL-адреси HTTP-запитів                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Публічна URL-адреса Gateway  | Не потрібна                                                                                                                                          | Потрібна (DNS, TLS, зворотний проксі або тунель)                                                               |
| Вихідна мережа               | Має бути доступний вихідний WSS до `wss-primary.slack.com`                                                                                            | Без вихідного WS; лише вхідний HTTPS                                                                          |
| Потрібні токени              | Токен бота + App-Level Token із `connections:write`                                                                                                  | Токен бота + Signing Secret                                                                                    |
| Ноутбук розробника / за firewall | Працює як є                                                                                                                                      | Потрібен публічний тунель (ngrok, Cloudflare Tunnel, Tailscale Funnel) або staging Gateway                     |
| Горизонтальне масштабування  | Один сеанс Socket Mode на застосунок на хост; кільком Gateway потрібні окремі застосунки Slack                                                       | Stateless POST-обробник; кілька реплік Gateway можуть спільно використовувати один застосунок за load balancer |
| Кілька облікових записів на одному Gateway | Підтримується; кожен обліковий запис відкриває власний WS                                                                                | Підтримується; кожному обліковому запису потрібен унікальний `webhookPath` (за замовчуванням `/slack/events`), щоб реєстрації не конфліктували |
| Транспорт slash-команд       | Доставляються через WS-з’єднання; `slash_commands[].url` ігнорується                                                                                 | Slack надсилає POST на `slash_commands[].url`; поле потрібне для виконання команди                             |
| Підписування запитів         | Не використовується (автентифікація — це App-Level Token)                                                                                            | Slack підписує кожен запит; OpenClaw перевіряє через `signingSecret`                                           |
| Відновлення після розриву з’єднання | Автоматичне повторне підключення Slack SDK увімкнено; OpenClaw також перезапускає невдалі сеанси Socket Mode з обмеженим backoff. Застосовується налаштування транспорту для pong-timeout. | Немає постійного з’єднання, яке може розірватися; повторні спроби виконуються Slack для кожного запиту          |

<Note>
  **Обирайте Socket Mode** для хостів з одним Gateway, ноутбуків розробників і on-prem мереж, які можуть встановлювати вихідні з’єднання до `*.slack.com`, але не можуть приймати вхідний HTTPS.

**Обирайте URL-адреси HTTP-запитів**, коли запускаєте кілька реплік Gateway за load balancer, коли вихідний WSS заблоковано, але вхідний HTTPS дозволено, або коли ви вже завершуєте Webhook-и Slack на зворотному проксі.
</Note>

### Режим ретрансляції

Режим ретрансляції відокремлює вхідний трафік Slack від Gateway OpenClaw. Довірений маршрутизатор утримує
єдине з’єднання Slack Socket Mode, обирає цільовий Gateway і пересилає типізовану
подію через автентифікований websocket. Gateway продовжує використовувати свій токен бота для
вихідних викликів Slack Web API.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

URL-адреса ретрансляції має використовувати `wss://`, якщо вона не спрямована на localhost. Розглядайте bearer-токен і
таблицю маршрутів маршрутизатора як частину межі авторизації Slack: маршрутизовані події входять у
звичайний обробник повідомлень Slack як авторизовані активації. Надана маршрутизатором `slack_identity`
у websocket-фреймі `hello` може задати стандартне вихідне ім’я користувача й іконку; явна
ідентичність, надана викликачем, усе одно має пріоритет. З’єднання ретрансляції повторно підключається з тим самим
обмеженим backoff-таймінгом, що використовується Socket Mode, і очищає надану маршрутизатором ідентичність щоразу,
коли від’єднується.

## Встановлення

Встановіть Slack перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` реєструє та вмикає plugin. Plugin усе ще нічого не робить, доки ви не налаштуєте застосунок Slack і параметри каналу нижче. Див. [Plugins](/uk/tools/plugin) щодо загальної поведінки plugin і правил встановлення.

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть свій workspace → вставте один із наведених нижче маніфестів → **Next** → **Create**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** відповідає повному набору функцій Slack plugin: App Home, slash-команди, файли, реакції, закріплення, групові DM і читання emoji/usergroup. Обирайте **Minimal**, коли політика workspace обмежує scopes — він покриває DM, історію каналів/груп, згадки та slash-команди, але вилучає файли, реакції, закріплення, групові DM (`mpim:*`), `emoji:read` і `usergroups:read`. Див. [контрольний список маніфесту та scopes](#manifest-and-scope-checklist) для обґрунтування кожного scope і додаткових параметрів, як-от додаткові slash-команди.
        </Note>

        Після створення застосунку Slack:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: додайте `connections:write`, збережіть, скопіюйте App-Level Token.
        - **Install App -> Install to Workspace**: скопіюйте Bot User OAuth Token.

      </Step>

      <Step title="Налаштуйте OpenClaw">

        Рекомендоване налаштування SecretRef:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        Fallback через env (лише стандартний обліковий запис):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
      <Step title="Create a new Slack app">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Створити новий застосунок** → **З маніфесту** → виберіть свій робочий простір → вставте один із наведених нижче маніфестів → замініть `https://gateway-host.example.com/slack/events` на вашу публічну URL-адресу Gateway → **Далі** → **Створити**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Рекомендований** відповідає повному набору функцій Slack plugin; **Мінімальний** вилучає файли, реакції, закріплення, групові DM (`mpim:*`), `emoji:read` і `usergroups:read` для робочих просторів із суворими обмеженнями. Див. [контрольний список маніфесту та областей доступу](#manifest-and-scope-checklist), щоб дізнатися обґрунтування для кожної області доступу.
        </Note>

        <Info>
          Усі три поля URL (`slash_commands[].url`, `event_subscriptions.request_url` і `interactivity.request_url` / `message_menu_options_url`) вказують на ту саму кінцеву точку OpenClaw. Схема маніфесту Slack вимагає називати їх окремо, але OpenClaw маршрутизує за типом payload, тому достатньо одного `webhookPath` (типово `/slack/events`). Команди slash без `slash_commands[].url` непомітно не виконуватимуть жодних дій у режимі HTTP.
        </Info>

        Після того як Slack створить застосунок:

        - **Основна інформація → Облікові дані застосунку**: скопіюйте **Signing Secret** для перевірки запитів.
        - **Установити застосунок -> Установити в робочий простір**: скопіюйте Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Рекомендоване налаштування SecretRef:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Налаштування транспорту Socket Mode

OpenClaw типово встановлює для клієнта Slack SDK час очікування pong у 15 секунд для Socket Mode. Перевизначайте налаштування транспорту лише тоді, коли потрібне налаштування для конкретного робочого простору або хоста:

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

Використовуйте це лише для робочих просторів Socket Mode, які реєструють у журналах тайм-аути pong/server-ping websocket Slack або працюють на хостах із відомим виснаженням циклу подій. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення та події застосунку залишаються станом застосунку, а не сигналами життєздатності транспорту.

Примітки:

- `socketMode` ігнорується в режимі HTTP Request URL.
- Базові налаштування `channels.slack.socketMode` застосовуються до всіх облікових записів Slack, якщо їх не перевизначено. Перевизначення для окремого облікового запису використовують `channels.slack.accounts.<accountId>.socketMode`; оскільки це перевизначення об’єкта, включіть кожне поле налаштування сокета, яке потрібно для цього облікового запису.
- Лише `clientPingTimeout` має типове значення OpenClaw (`15000`). `serverPingTimeout` і `pingPongLoggingEnabled` передаються до Slack SDK лише тоді, коли їх налаштовано.
- Затримка перезапуску Socket Mode починається приблизно з 2 секунд і обмежується приблизно 30 секундами. Відновлювані збої запуску, очікування запуску та від’єднання повторюються, доки канал не зупиниться. Постійні помилки облікового запису й облікових даних, як-от недійсна автентифікація, відкликані токени або відсутні області доступу, швидко завершуються помилкою замість нескінченних повторів.

## Контрольний список маніфесту та областей доступу

Базовий маніфест застосунку Slack однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` команди slash).

Базовий маніфест (типово для Socket Mode):

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Для **режиму HTTP Request URLs** замініть `settings` на варіант HTTP і додайте `url` до кожної команди slash. Потрібна публічна URL-адреса:

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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Показуйте різні функції, що розширюють наведені вище типові значення.

Стандартний маніфест вмикає вкладку **Головна** Slack App Home і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку «Головна», OpenClaw публікує безпечний типовий вигляд Home через `views.publish`; жодне корисне навантаження розмови або приватна конфігурація не включаються. Вкладка **Повідомлення** залишається ввімкненою для Slack DM. Маніфест також вмикає потоки Slack assistant через `features.assistant_view`, `assistant:write`, `assistant_thread_started` і `assistant_thread_context_changed`; потоки assistant маршрутизуються до власних сеансів потоків OpenClaw і зберігають наданий Slack контекст потоку доступним для агента.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Кілька [нативних slash-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з такими нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно може бути доступно не більше 25 slash-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Режим Socket (типово)">

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
        Використовуйте той самий список `slash_commands`, що й для режиму Socket вище, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

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
    Додайте область бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (користувацьке ім’я користувача та піктограму) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте піктограму emoji, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові області user-token (операції читання)">
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

- `botToken` + `appToken` потрібні для режиму Socket.
- Режим HTTP потребує `botToken` + `signingSecret`.
- Режим relay потребує `botToken`, а також `relay.url`, `relay.authToken` і `relay.gatewayId`; він не використовує app token або signing secret.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` і `userToken` приймають відкриті текстові
  рядки або об’єкти SecretRef.
- Токени конфігурації перевизначають резервний варіант env.
- Резервний варіант env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до типового облікового запису.
- `userToken` доступний лише в конфігурації (без резервного варіанта env) і типово використовує поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Інспекція облікового запису Slack відстежує для кожних облікових даних поля `*Source` і `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секретів, але поточний шлях команди/середовища виконання
  не зміг отримати фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у режимі Socket
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогів можна віддавати перевагу токену користувача, якщо його налаштовано. Для запису перевага залишається за токеном бота; записи через user-token дозволені лише коли `userTokenReadOnly: false` і токен бота недоступний.
</Tip>

## Дії та шлюзи

Дії Slack керуються `channels.slack.actions.*`.

Доступні групи дій у поточних інструментах Slack:

| Група      | Типово |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ідентифікатори файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередній перегляд зображень для зображень або метадані локального файлу для інших типів файлів.

## Контроль доступу та маршрутизація

  <Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` — канонічний список дозволених для DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (вимагає, щоб `channels.slack.allowFrom` містив `"*"`)
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

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` досі читаються для сумісності. `openclaw doctor --fix` переносить їх у `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Список дозволених каналів міститься в `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад, `C12345678`) як ключі конфігурації.

    Примітка щодо runtime: якщо `channels.slack` повністю відсутній (налаштування лише через env), runtime повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо `channels.defaults.groupPolicy` задано).

    Розв’язання імен/ID:

    - записи списку дозволених каналів і записи списку дозволених DM розв’язуються під час запуску, коли доступ токена це дозволяє
    - нерозв’язані записи імен каналів зберігаються як налаштовано, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням спершу використовують ID; пряме зіставлення за іменем користувача/slug вимагає `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** збігаються за `groupPolicy: "allowlist"`. Пошук каналу за замовчуванням спершу використовує ID, тому ключ на основі імені ніколи не маршрутизуватиметься успішно, а всі повідомлення в цьому каналі буде тихо заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і ключ на основі імені здається працездатним.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою миші → **Copy link** — ID (`C...`) з’явиться в кінці URL.

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

  <Tab title="Згадки та користувачі каналів">
    Повідомлення в каналах за замовчуванням пропускаються лише за наявності згадки.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач-бот є учасником цієї групи користувачів; вимагає `usergroups:read`
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді боту (вимкнено, коли `thread.requireExplicitMention` має значення `true`)

    Елементи керування для окремого каналу (`channels.slack.channels.<id>`; імена лише через розв’язання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список дозволених)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, або wildcard `"*"`
      (застарілі ключі без префікса досі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише тоді, коли бот-відправник явно вказаний у списку дозволених `users` цієї кімнати, або коли принаймні один явний ID власника Slack із `channels.slack.allowFrom` наразі є учасником кімнати. Wildcard-и та записи власників за відображуваним іменем не задовольняють вимогу присутності власника. Присутність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідний read scope для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників завершується помилкою, OpenClaw відкидає повідомлення кімнати, створене ботом.

    Прийняті повідомлення Slack, створені ботом, використовують спільний [захист від циклів ботів](/uk/channels/bot-loop-protection). Налаштуйте `channels.defaults.botLoopProtection` для стандартного бюджету, а потім перевизначте через `channels.slack.botLoopProtection` або `channels.slack.channels.<id>.botLoopProtection`, коли робочому простору або каналу потрібен інший ліміт.

  </Tab>
</Tabs>

## Потоки, сесії та теги відповідей

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- Прив’язки маршрутів Slack приймають сирі ID співрозмовників, а також форми цілей Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- За стандартного `session.dmScope=main` DM Slack згортаються в головну сесію агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Звичайні повідомлення верхнього рівня в каналі залишаються в сесії окремого каналу, навіть коли `replyToMode` не є `off`.
- Відповіді в потоках Slack використовують батьківський Slack `thread_ts` для суфіксів сесій (`:thread:<threadTs>`), навіть коли вихідні відповіді в потоках вимкнено через `replyToMode="off"`.
- OpenClaw засіває придатний корінь каналу верхнього рівня в `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, коли очікується, що цей корінь почне видимий потік Slack, щоб корінь і подальші відповіді в потоці спільно використовували одну сесію OpenClaw. Це застосовується до подій `app_mention`, явних збігів із ботом або налаштованим шаблоном згадки, а також каналів із `requireMention: false` і не-`off` `replyToMode`.
- Стандартне значення `channels.slack.thread.historyScope` — `thread`; стандартне значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень потоку отримується, коли запускається нова сесія потоку (стандартно `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (стандартно `false`): коли `true`, пригнічує неявні згадки в потоці, щоб бот відповідав лише на явні згадки `@bot` усередині потоків, навіть якщо бот уже брав участь у потоці. Без цього відповіді в потоці, де брав участь бот, обходять обмеження `requireMention`.

Елементи керування відповідями в потоках:

- `channels.slack.replyToMode`: `off|first|all|batched` (стандартно `off`)
- `channels.slack.replyToModeByChatType`: окремо для `direct|group|channel`
- застарілий fallback для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Для явних відповідей у потоці Slack з інструмента `message` задайте `replyBroadcast: true` з `action: "send"` і `threadId` або `replyTo`, щоб попросити Slack також транслювати відповідь у потоці в батьківський канал. Це відображається на прапорець Slack `chat.postMessage` `reply_broadcast` і підтримується лише для текстових надсилань або надсилань Block Kit, а не для завантажень медіа.

Коли виклик інструмента `message` виконується всередині потоку Slack і націлений на той самий канал, OpenClaw зазвичай успадковує поточний потік Slack відповідно до `replyToMode`. Задайте `topLevel: true` для `action: "send"` або `action: "upload-file"`, щоб примусово створити нове повідомлення в батьківському каналі. `threadId: null` приймається як такий самий opt-out верхнього рівня.

<Note>
`replyToMode="off"` вимикає вихідні відповіді Slack у потоках, зокрема явні теги `[[reply_to_*]]`. Це не вирівнює вхідні сесії потоків Slack: повідомлення, уже опубліковані всередині потоку Slack, усе одно маршрутизуються до сесії `:thread:<threadTs>`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Потоки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими inline.
</Note>

## Реакції підтвердження

`ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення. `ackReactionScope` вирішує, _коли_ це емодзі фактично надсилається.

### Емодзі (`ackReaction`)

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше `"eyes"` / 👀)

Примітки:

- Slack очікує shortcodes (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

### Область дії (`messages.ackReactionScope`)

Провайдер Slack читає область дії з `messages.ackReactionScope` (стандартно `"group-mentions"`). Наразі немає перевизначення на рівні облікового запису Slack або каналу Slack; значення є глобальним для Gateway.

Значення:

- `"all"`: реагувати в DM і групах.
- `"direct"`: реагувати лише в DM.
- `"group-all"`: реагувати на кожне групове повідомлення (без DM).
- `"group-mentions"` (стандартно): реагувати в групах, але лише коли бота згадано (або в групових mentionables, які opted in). **DM виключено.**
- `"off"` / `"none"`: ніколи не реагувати.

<Note>
Стандартна область дії (`"group-mentions"`) не запускає реакції підтвердження в прямих повідомленнях. Щоб бачити налаштований `ackReaction` (наприклад `"eyes"`) у вхідних DM Slack, задайте `messages.ackReactionScope` як `"direct"` або `"all"`. `messages.ackReactionScope` читається під час запуску провайдера Slack, тому для набуття зміною чинності потрібен перезапуск gateway.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Текстове потокове передавання

`channels.slack.streaming` керує поведінкою live preview:

- `off`: вимкнути потокове передавання live preview.
- `partial` (стандартно): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надіслати фінальний текст.
- `streaming.preview.toolProgress`: коли чернетковий попередній перегляд активний, маршрутизувати оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (стандартно: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/прогресу.
- `streaming.preview.commandText` / `streaming.progress.commandText`: задайте `status`, щоб залишити компактні рядки прогресу інструментів, приховуючи сирий текст команд/exec (стандартно: `raw`).

Приховати сирий текст command/exec, зберігаючи компактні рядки прогресу:

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

`channels.slack.streaming.nativeTransport` керує нативним текстовим потоковим передаванням Slack, коли `channels.slack.streaming.mode` дорівнює `partial` (стандартно: `true`).

Нативні картки завдань прогресу Slack є opt-in для режиму прогресу. Задайте `channels.slack.streaming.progress.nativeTaskCards` як `true` з `channels.slack.streaming.mode="progress"`, щоб надсилати нативну для Slack картку плану/завдання під час виконання роботи, а потім оновити ту саму картку завдання після завершення. Без цього прапорця режим прогресу зберігає портативну поведінку чернеткового попереднього перегляду.

- Щоб з’явилися нативне текстове потокове передавання та статус потоку асистента Slack, має бути доступний потік відповідей. Вибір потоку все ще відповідає `replyToMode`.
- Корені каналів, групових чатів і DM верхнього рівня все ще можуть використовувати звичайний чернетковий попередній перегляд, коли нативне потокове передавання недоступне або потоку відповідей немає.
- DM Slack верхнього рівня стандартно залишаються поза потоком, тому вони не показують нативний stream/status preview Slack у стилі потоку; натомість OpenClaw публікує та редагує чернетковий попередній перегляд у DM.
- Медіа та нетекстові payload-и повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні фінальні текстові/block повідомлення flush only when they can edit the preview in place.
- Якщо потокове передавання завершується помилкою посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload-ів.

Використати чернетковий попередній перегляд замість нативного текстового потокового передавання Slack:

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

Opt in до нативних карток завдань прогресу Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Застарілі ключі:

- `channels.slack.streamMode` (`replace | status_final | append`) є застарілим runtime-аліасом для `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` є застарілим runtime-аліасом для `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` є runtime-аліасом для `channels.slack.streaming.nativeTransport`.
- Запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію потокового передавання Slack до канонічних ключів.

## Fallback реакції набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в потоках, які використовують стандартний індикатор статусу "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується best-effort, а очищення автоматично виконується після завершення шляху відповіді або помилки.

## Медіа, поділ на фрагменти та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне й дозволяють обмеження розміру. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл через `download-file`.

    Завантаження використовують обмежені idle і total timeouts. Якщо отримання файлу Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файлу.

    Runtime-обмеження розміру вхідних даних стандартно дорівнює `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (стандартно 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ із пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може містити відповіді в потоках (`thread_ts`)
    - обмеження вихідних медіа відповідає `channels.slack.mediaMaxMb`, коли налаштовано; інакше надсилання каналом використовує стандартні значення MIME-kind із media pipeline

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Slack DM лише з текстом/block можуть публікуватися безпосередньо в ID користувачів; завантаження файлів і надсилання в потоках спочатку відкривають DM через API розмов Slack, оскільки ці шляхи потребують конкретного ID розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash

Slash-команди з’являються в Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити стандартні параметри команд:

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

Нативні меню аргументів використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед відправленням значення вибраного варіанта:

- до 5 варіантів: блоки кнопок
- 6-100 варіантів: статичне меню вибору
- понад 100 варіантів: зовнішній вибір з асинхронною фільтрацією варіантів, коли доступні обробники параметрів інтерактивності
- перевищено ліміти Slack: закодовані значення варіантів повертаються до кнопок

```txt
/think
```

Slash-сесії використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно маршрутизують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може рендерити створені агентом інтерактивні елементи керування відповідями, але ця функція за замовчуванням вимкнена.
Для нового виводу агента, CLI і Plugin віддавайте перевагу спільним
кнопкам `presentation` або блокам вибору. Вони використовують той самий шлях
взаємодії Slack і водночас деградують в інших каналах.

Увімкніть глобально:

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

Або увімкніть лише для одного облікового запису Slack:

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

Коли ввімкнено, агенти все ще можуть видавати застарілі директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються у Slack Block Kit і маршрутизують натискання або вибір
назад через наявний шлях подій взаємодії Slack. Залишайте їх для старих
prompt-ів і Slack-специфічних аварійних обходів; для нових переносних
елементів керування використовуйте спільну презентацію.

API компілятора директив також застарілі для нового коду-виробника:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Використовуйте payload-и `presentation` і `buildSlackPresentationBlocks(...)` для нових
елементів керування, що рендеряться у Slack.

Примітки:

- Це застарілий UI, специфічний для Slack. Інші канали не перетворюють директиви Slack Block
  Kit на власні системи кнопок.
- Значення інтерактивних callback-ів є непрозорими токенами, згенерованими OpenClaw, а не сирими значеннями, створеними агентом.
- Якщо згенеровані інтерактивні блоки перевищили б обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload-а блоків.

### Подання модальних вікон, якими володіє Plugin

Slack Plugin-и, які реєструють інтерактивний handler, також можуть отримувати події життєвого циклу модального вікна
`view_submission` і `view_closed` до того, як OpenClaw стисне
payload для видимої агенту системної події. Використовуйте один із цих шаблонів
маршрутизації під час відкриття модального вікна Slack:

- Установіть `callback_id` у `openclaw:<namespace>:<payload>`.
- Або збережіть наявний `callback_id` і помістіть `pluginInteractiveData:
"<namespace>:<payload>"` у `private_metadata` модального вікна.

Handler отримує `ctx.interaction.kind` як `view_submission` або
`view_closed`, нормалізовані `inputs` і повний сирий об’єкт `stateValues` від
Slack. Маршрутизації лише за callback-id достатньо, щоб викликати handler Plugin; додайте
наявні поля маршрутизації користувача/сесії з `private_metadata` модального вікна, коли
модальне вікно також має створити видиму агенту системну подію. Агент отримує
компактну, відредаговану системну подію `Slack interaction: ...`. Якщо handler повертає
`systemEvent.summary`, `systemEvent.reference` або `systemEvent.data`, ці
поля включаються до цієї компактної події, щоб агент міг посилатися на
сховище, яким володіє Plugin, не бачачи повного payload-а форми.

## Нативні схвалення у Slack

Slack може діяти як нативний клієнт схвалень з інтерактивними кнопками та взаємодіями, замість fallback до вебінтерфейсу або термінала.

- Схвалення exec і Plugin можуть рендеритися як нативні підказки Slack Block Kit.
- `channels.slack.execApprovals.*` залишається конфігурацією ввімкнення нативного клієнта схвалень exec і маршрутизації DM/каналу.
- DM для схвалень exec використовують `channels.slack.execApprovals.approvers` або `commands.ownerAllowFrom`.
- Схвалення Plugin використовують нативні кнопки Slack, коли Slack увімкнено як нативний клієнт схвалень для вихідної сесії або коли `approvals.plugin` маршрутизує до вихідної Slack-сесії чи цілі Slack.
- DM для схвалень Plugin використовують approver-ів Slack Plugin із `channels.slack.allowFrom`, `allowFrom` іменованого облікового запису або маршруту облікового запису за замовчуванням.
- Авторизація approver-а все ще застосовується: approver-и лише для exec не можуть схвалювати запити Plugin, якщо вони також не є approver-ами Plugin.

Це використовує ту саму спільну поверхню кнопок схвалення, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого Slack app, підказки схвалення рендеряться як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що схвалення в чаті
недоступні або ручне схвалення є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості fallback до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні схвалення exec, коли `enabled` не встановлено або дорівнює `"auto"` і
визначається принаймні один approver exec. Slack також може обробляти нативні схвалення Plugin через цей шлях
нативного клієнта, коли визначаються approver-и Slack Plugin і запит відповідає фільтрам нативного клієнта. Установіть
`enabled: false`, щоб явно вимкнути Slack як нативний клієнт схвалень. Установіть `enabled: true`, щоб
примусово ввімкнути нативні схвалення, коли approver-и визначаються. Вимкнення схвалень Slack exec не вимикає
нативну доставку схвалень Slack Plugin, увімкнену через `approvals.plugin`; доставка схвалень Plugin
натомість використовує approver-ів Slack Plugin.

Поведінка за замовчуванням без явної конфігурації схвалень Slack exec:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити approver-ів, додати фільтри або
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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли підказки схвалення exec також мають
маршрутизуватися до інших чатів або явних позаканальних цілей. Спільне переспрямування `approvals.plugin` також
є окремим; нативна доставка Slack пригнічує цей fallback лише тоді, коли Slack може обробити запит схвалення Plugin
нативно.

Same-chat `/approve` також працює в каналах Slack і DM, які вже підтримують команди. Див. [Схвалення exec](/uk/tools/exec-approvals) для повної моделі переспрямування схвалень.

## Події та операційна поведінка

- Редагування/видалення повідомлень відображаються в системні події.
- Трансляції тредів (відповіді в треді "Also send to channel") обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій відображаються в системні події.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення відображаються в системні події.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли `configWrites` увімкнено.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути вставлені в контекст маршрутизації.
- Початкове повідомлення треду та первинне засівання контексту історії треду фільтруються налаштованими allowlist-ами відправників, коли це застосовно.
- Дії блоків, shortcuts і модальні взаємодії видають структуровані системні події `Slack interaction: ...` з багатими полями payload-а:
  - дії блоків: вибрані значення, мітки, значення picker-ів і метадані `workflow_*`
  - глобальні shortcuts: метадані callback-а й актора, маршрутизовані до прямої сесії актора
  - shortcuts повідомлень: callback, актор, канал, тред і контекст вибраного повідомлення
  - події модального вікна `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеннями форми

Визначте глобальні shortcuts або shortcuts повідомлень у конфігурації вашого Slack app і використовуйте будь-який непорожній callback ID. OpenClaw підтверджує відповідні payload-и shortcuts, застосовує ту саму політику відправника DM/каналу, що й для інших взаємодій Slack, і ставить очищену подію в чергу для маршрутизованої сесії агента. Trigger ID і URL-и відповіді редагуються з контексту агента.

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (break-glass; залишайте вимкненим, якщо не потрібно)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks` (за замовчуванням: `false`), `unfurlMedia` для керування попереднім переглядом посилань/медіа в `chat.postMessage`; установіть `unfurlLinks: true`, щоб знову ввімкнути попередній перегляд посилань
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по порядку:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`) — **ключі мають бути ID каналів** (`C12345678`), а не імена (`#channel-name`). Ключі на основі імен мовчки не спрацьовують за `groupPolicy: "allowlist"`, бо маршрутизація каналів за замовчуванням насамперед використовує ID. Щоб знайти ID: клацніть канал у Slack правою кнопкою → **Copy link** — значення `C...` наприкінці URL є ID каналу.
    - `requireMention`
    - allowlist `users` для окремого каналу
    - `messages.groupChat.visibleReplies`: звичайні запити групи/каналу за замовчуванням мають `"automatic"`. Якщо ви ввімкнули `"message_tool"` і логи показують текст assistant без виклику `message(action=send)`, модель пропустила видимий шлях message-tool. У цьому режимі фінальний текст залишається приватним; перегляньте докладний log Gateway щодо метаданих пригніченого payload-а або встановіть `"automatic"`, якщо хочете, щоб кожна звичайна фінальна відповідь assistant публікувалася через застарілий шлях.
    - `messages.groupChat.unmentionedInbound`: якщо це `"room_event"`, незгадана дозволена розмова в каналі є фоновим контекстом і залишається беззвучною, якщо агент не викличе інструмент `message`. Див. [Фонові події кімнати](/uk/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - схвалення pairing / записи allowlist (`dmPolicy: "open"` все одно потребує `channels.slack.allowFrom: ["*"]`)
    - групові DM використовують обробку MPIM; увімкніть `channels.slack.dm.groupEnabled` і, якщо налаштовано, включіть MPIM у `channels.slack.dm.groupChannels`
    - події Slack Assistant DM: докладні логи зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію Assistant-треду без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте bot + app token-и та ввімкнення Socket Mode у налаштуваннях Slack app.
    App-Level Token потребує `connections:write`, а Bot User OAuth Token
    bot token має належати тому самому Slack app/workspace, що й app token.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточний runtime не зміг визначити значення, підкріплене SecretRef.

    Журнали на кшталт `slack socket mode failed to start; retry ...` є відновлюваними
    помилками запуску. Відсутні scopes, відкликані токени та недійсна автентифікація натомість завершуються швидкою помилкою.
    Журнал `slack token mismatch ...` означає, що токен бота й токен застосунку,
    схоже, належать різним застосункам Slack; виправте облікові дані застосунку Slack.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Перевірте:

    - signing secret
    - шлях webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-акаунта
    - публічна URL-адреса завершує TLS і пересилає запити до шляху Gateway
    - шлях `request_url` застосунку Slack точно збігається з `channels.slack.webhookPath` (типово `/slack/events`)

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    акаунта, HTTP-акаунт налаштовано, але поточне середовище виконання не змогло
    розв’язати signing secret на основі SecretRef.

    Повторюваний журнал `slack: webhook path ... already registered` означає, що два HTTP
    акаунти використовують той самий `webhookPath`; надайте кожному акаунту окремий шлях.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Перевірте, що саме ви планували використовувати:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash commands, зареєстрованими в Slack
    - або режим однієї slash command (`channels.slack.slashCommand.enabled: true`)

    Slack не створює й не видаляє slash commands автоматично. `commands.native: "auto"` не вмикає нативні команди Slack; використовуйте `true` і створіть відповідні команди в застосунку Slack. У режимі HTTP кожна slash command Slack має містити URL-адресу Gateway. У Socket Mode корисні навантаження команд надходять через websocket, а Slack ігнорує `slash_commands[].url`.

    Також перевірте `commands.useAccessGroups`, авторизацію DM, allowlists каналів
    і allowlists `users` для окремих каналів. Slack повертає ефемерні помилки для
    заблокованих відправників slash-command, зокрема:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Довідник із vision для вкладень

Slack може додавати завантажені медіа до ходу агента, коли завантаження файлів Slack успішне й обмеження розміру це дозволяють. Файли зображень можна передавати через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою vision; інші файли зберігаються як завантажуваний файловий контекст, а не обробляються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                       | Джерело             | Поточна поведінка                                                                 | Примітки                                                                 |
| ------------------------------- | ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack     | Завантажуються й додаються до ходу для обробки з підтримкою vision                | Обмеження на файл: `channels.slack.mediaMaxMb` (типово 20 MB)            |
| PDF-файли                       | URL файлу Slack     | Завантажуються й надаються як файловий контекст для інструментів на кшталт `download-file` або `pdf` | Вхідні дані Slack не перетворюють PDF автоматично на вхід image-vision |
| Інші файли                      | URL файлу Slack     | Завантажуються, коли це можливо, і надаються як файловий контекст                 | Бінарні файли не обробляються як вхідні зображення                       |
| Відповіді в тредах              | Файли початкового повідомлення треду | Файли кореневого повідомлення можуть бути гідратовані як контекст, коли відповідь не має власних медіа | Для початкових повідомлень лише з файлами використовується placeholder вкладення |
| Повідомлення з кількома зображеннями | Кілька файлів Slack | Кожен файл оцінюється незалежно                                                   | Обробка Slack обмежена вісьмома файлами на повідомлення                  |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватної URL-адреси Slack за допомогою токена бота.
2. У разі успіху файл записується до сховища медіа.
3. Шляхи завантажених медіа й типи вмісту додаються до вхідного контексту.
4. Шляхи моделей/інструментів із підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або медіапосилання для інструментів, які можуть їх обробляти.

### Успадкування вкладень із кореня треду

Коли повідомлення надходить у треді (має батьківський `thread_ts`):

- Якщо сама відповідь не має власних медіа, а включене кореневе повідомлення має файли, Slack може гідратувати кореневі файли як контекст початкового повідомлення треду.
- Прямі вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється placeholder вкладення, щоб fallback усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через медіаконвеєр.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделі

- **Обмеження розміру**: типово 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: файли, які Slack не може надати, прострочені URL-адреси, недоступні файли, надто великі файли та HTML-відповіді автентифікації/входу Slack пропускаються, а не повідомляються як непідтримувані формати.
- **Модель vision**: аналіз зображень використовує активну модель відповіді, коли вона підтримує vision, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                            | Обхідний шлях                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Прострочена URL-адреса файлу Slack    | Файл пропущено; помилка не показується                                       | Повторно завантажте файл у Slack                                           |
| Модель vision не налаштована          | Вкладення зображень зберігаються як медіапосилання, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використайте модель відповіді з підтримкою vision |
| Дуже великі зображення (> 20 MB типово) | Пропускаються відповідно до обмеження розміру                                | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                  |
| Переслані/поширені вкладення          | Текст і розміщені в Slack медіа зображень/файлів обробляються за принципом best-effort | Поділіться ними повторно безпосередньо в треді OpenClaw                    |
| PDF-вкладення                         | Зберігаються як файловий/медіаконтекст, не маршрутизуються автоматично через image vision | Використовуйте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення vision для вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зіставте користувача Slack із gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових DM.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Configuration" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритет.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
