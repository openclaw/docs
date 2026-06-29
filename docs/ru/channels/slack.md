---
read_when:
    - Настройка Slack или отладка режима Slack socket, HTTP или relay
summary: Настройка Slack и поведение во время выполнения (Socket Mode, URL-адреса HTTP-запросов и режим ретрансляции)
title: Slack
x-i18n:
    generated_at: "2026-06-28T22:36:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Готово для продакшена в личных сообщениях и каналах через интеграции Slack app. Режим по умолчанию — Socket Mode; URL-адреса HTTP-запросов также поддерживаются. Режим ретрансляции предназначен для управляемых развертываний, где доверенный маршрутизатор отвечает за входящий трафик Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ru/channels/pairing">
    Личные сообщения Slack по умолчанию используют режим сопряжения.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ru/tools/slash-commands">
    Нативное поведение команд и каталог команд.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ru/channels/troubleshooting">
    Межканальная диагностика и инструкции по восстановлению.
  </Card>
</CardGroup>

## Выбор Socket Mode или URL-адресов HTTP-запросов

Оба транспорта готовы для продакшена и обеспечивают паритет функций для обмена сообщениями, slash-команд, App Home и интерактивности. Выбирайте по форме развертывания, а не по функциям.

| Аспект                       | Socket Mode (по умолчанию)                                                                                                                          | URL-адреса HTTP-запросов                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Публичный URL Gateway        | Не требуется                                                                                                                                         | Требуется (DNS, TLS, обратный прокси или туннель)                                                                     |
| Исходящая сеть               | Должен быть доступен исходящий WSS к `wss-primary.slack.com`                                                                                         | Без исходящего WS; только входящий HTTPS                                                                              |
| Нужные токены                | Токен бота + App-Level Token с `connections:write`                                                                                                   | Токен бота + Signing Secret                                                                                           |
| Ноутбук разработчика / за firewall | Работает как есть                                                                                                                                     | Нужен публичный туннель (ngrok, Cloudflare Tunnel, Tailscale Funnel) или промежуточный Gateway                         |
| Горизонтальное масштабирование | Один сеанс Socket Mode на приложение на хост; нескольким Gateway нужны отдельные приложения Slack                                                     | Stateless-обработчик POST; несколько реплик Gateway могут использовать одно приложение за балансировщиком нагрузки     |
| Несколько аккаунтов на одном Gateway | Поддерживается; каждый аккаунт открывает собственный WS                                                                                               | Поддерживается; каждому аккаунту нужен уникальный `webhookPath` (по умолчанию `/slack/events`), чтобы регистрации не конфликтовали |
| Транспорт slash-команд       | Доставляются через WS-соединение; `slash_commands[].url` игнорируется                                                                                | Slack отправляет POST на `slash_commands[].url`; поле обязательно, чтобы команда была доставлена                       |
| Подпись запросов             | Не используется (авторизация выполняется через App-Level Token)                                                                                      | Slack подписывает каждый запрос; OpenClaw проверяет его с помощью `signingSecret`                                     |
| Восстановление при разрыве соединения | Включено автопереподключение Slack SDK; OpenClaw также перезапускает сбойные сеансы Socket Mode с ограниченным backoff. Применяется настройка транспорта по pong-timeout. | Нет постоянного соединения, которое может оборваться; повторы выполняются Slack для каждого запроса                    |

<Note>
  **Выбирайте Socket Mode** для хостов с одним Gateway, ноутбуков разработчиков и on-prem сетей, которые могут обращаться к `*.slack.com` наружу, но не могут принимать входящий HTTPS.

**Выбирайте URL-адреса HTTP-запросов**, когда запускаете несколько реплик Gateway за балансировщиком нагрузки, когда исходящий WSS заблокирован, но входящий HTTPS разрешен, или когда Slack Webhook уже завершаются на обратном прокси.
</Note>

### Режим ретрансляции

Режим ретрансляции отделяет входящий трафик Slack от Gateway OpenClaw. Доверенный маршрутизатор владеет
единственным соединением Slack Socket Mode, выбирает целевой Gateway и пересылает типизированное
событие через аутентифицированный websocket. Gateway продолжает использовать свой токен бота для
исходящих вызовов Slack Web API.

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

URL ретрансляции должен использовать `wss://`, если только он не указывает на localhost. Рассматривайте bearer-токен и
таблицу маршрутов маршрутизатора как часть границы авторизации Slack: маршрутизированные события попадают в
обычный обработчик сообщений Slack как авторизованные активации. Предоставленный маршрутизатором `slack_identity`
в websocket-фрейме `hello` может задать исходящие имя пользователя и значок по умолчанию; явно
переданная вызывающей стороной identity по-прежнему имеет приоритет. Соединение ретрансляции переподключается с теми же
ограниченными интервалами backoff, что и Socket Mode, и очищает предоставленную маршрутизатором identity при каждом
отключении.

## Установка

Установите Slack перед настройкой канала:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` регистрирует и включает Plugin. Plugin по-прежнему ничего не делает, пока вы не настроите Slack app и параметры канала ниже. См. [Plugins](/ru/tools/plugin) для общего поведения Plugin и правил установки.

## Быстрая настройка

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Откройте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → выберите рабочую область → вставьте один из манифестов ниже → **Next** → **Create**.

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
          **Recommended** соответствует полному набору функций Slack Plugin: App Home, slash-команды, файлы, реакции, закрепления, групповые личные сообщения и чтение emoji/usergroup. Выберите **Minimal**, когда политика рабочей области ограничивает scopes — он покрывает личные сообщения, историю каналов/групп, упоминания и slash-команды, но исключает файлы, реакции, закрепления, групповые личные сообщения (`mpim:*`), `emoji:read` и `usergroups:read`. См. [контрольный список манифеста и scopes](#manifest-and-scope-checklist) для обоснования каждого scope и добавочных опций, таких как дополнительные slash-команды.
        </Note>

        После того как Slack создаст приложение:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: добавьте `connections:write`, сохраните, скопируйте App-Level Token.
        - **Install App -> Install to Workspace**: скопируйте Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Рекомендуемая настройка SecretRef:

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

        Резервный вариант через env (только аккаунт по умолчанию):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        Откройте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → выберите свое рабочее пространство → вставьте один из манифестов ниже → замените `https://gateway-host.example.com/slack/events` на публичный URL вашего Gateway → **Next** → **Create**.

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
          **Рекомендуемый** соответствует полному набору функций Slack plugin; **минимальный** исключает файлы, реакции, закрепленные сообщения, групповые личные сообщения (`mpim:*`), `emoji:read` и `usergroups:read` для рабочих пространств с ограничениями. Обоснование для каждого scope см. в разделе [Контрольный список манифеста и scope](#manifest-and-scope-checklist).
        </Note>

        <Info>
          Все три поля URL (`slash_commands[].url`, `event_subscriptions.request_url` и `interactivity.request_url` / `message_menu_options_url`) указывают на один и тот же endpoint OpenClaw. Схема манифеста Slack требует задавать их отдельно, но OpenClaw маршрутизирует по типу payload, поэтому достаточно одного `webhookPath` (по умолчанию `/slack/events`). Slash-команды без `slash_commands[].url` в режиме HTTP будут тихо ничего не делать.
        </Info>

        После того как Slack создаст приложение:

        - **Basic Information → App Credentials**: скопируйте **Signing Secret** для проверки запросов.
        - **Install App -> Install to Workspace**: скопируйте Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Рекомендуемая настройка SecretRef:

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
        Используйте уникальные пути webhook для HTTP с несколькими учетными записями

        Задайте каждой учетной записи отдельный `webhookPath` (по умолчанию `/slack/events`), чтобы регистрации не конфликтовали.
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

## Настройка транспорта Socket Mode

OpenClaw по умолчанию задает для клиента Slack SDK тайм-аут pong в 15 секунд для Socket Mode. Переопределяйте настройки транспорта только тогда, когда нужна настройка под конкретное рабочее пространство или хост:

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

Используйте это только для рабочих пространств Socket Mode, где логируются тайм-ауты websocket pong/server-ping Slack, или для хостов с известным истощением event loop. `clientPingTimeout` — это ожидание pong после того, как SDK отправляет клиентский ping; `serverPingTimeout` — ожидание серверных ping от Slack. Сообщения приложения и события остаются состоянием приложения, а не сигналами жизнеспособности транспорта.

Примечания:

- `socketMode` игнорируется в режиме HTTP Request URL.
- Базовые настройки `channels.slack.socketMode` применяются ко всем учетным записям Slack, если они не переопределены. Переопределения для отдельных учетных записей используют `channels.slack.accounts.<accountId>.socketMode`; поскольку это объектное переопределение, включите все поля настройки сокета, которые нужны для этой учетной записи.
- Только у `clientPingTimeout` есть значение по умолчанию OpenClaw (`15000`). `serverPingTimeout` и `pingPongLoggingEnabled` передаются в Slack SDK только при явной настройке.
- Backoff перезапуска Socket Mode начинается примерно с 2 секунд и ограничивается примерно 30 секундами. Восстановимые сбои запуска, ожидания запуска и отключения повторяются, пока канал не остановится. Постоянные ошибки учетной записи и учетных данных, такие как недействительная аутентификация, отозванные токены или отсутствующие scope, завершаются быстро вместо бесконечных повторов.

## Контрольный список манифеста и scope

Базовый манифест приложения Slack одинаков для Socket Mode и HTTP Request URLs. Отличается только блок `settings` (и `url` slash-команды).

Базовый манифест (Socket Mode по умолчанию):

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

Для режима **HTTP Request URLs** замените `settings` на HTTP-вариант и добавьте `url` в каждую slash-команду. Требуется публичный URL:

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

### Дополнительные настройки манифеста

Предоставьте другие функции, расширяющие приведенные выше значения по умолчанию.

Манифест по умолчанию включает вкладку Slack App Home **Home** и подписывается на `app_home_opened`. Когда участник рабочей области открывает вкладку Home, OpenClaw публикует безопасное представление Home по умолчанию с помощью `views.publish`; полезная нагрузка беседы или приватная конфигурация не включаются. Вкладка **Messages** остается включенной для Slack DM. Манифест также включает потоки Slack assistant с `features.assistant_view`, `assistant:write`, `assistant_thread_started` и `assistant_thread_context_changed`; потоки assistant направляются в собственные сеансы потоков OpenClaw и сохраняют предоставленный Slack контекст потока доступным для агента.

<AccordionGroup>
  <Accordion title="Необязательные собственные слеш-команды">

    Несколько [собственных слеш-команд](#commands-and-slash-behavior) можно использовать вместо одной настроенной команды с учетом нюансов:

    - Используйте `/agentstatus` вместо `/status`, потому что команда `/status` зарезервирована.
    - Одновременно можно сделать доступными не более 25 слеш-команд.

    Замените существующий раздел `features.slash_commands` подмножеством [доступных команд](/ru/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (по умолчанию)">

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
      <Tab title="URL HTTP-запросов">
        Используйте тот же список `slash_commands`, что и для Socket Mode выше, и добавьте `"url": "https://gateway-host.example.com/slack/events"` в каждую запись. Пример:

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

        Повторите это значение `url` для каждой команды в списке.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необязательные области авторства (операции записи)">
    Добавьте область бота `chat:write.customize`, если хотите, чтобы исходящие сообщения использовали идентификатор активного агента (настраиваемое имя пользователя и значок) вместо идентификатора приложения Slack по умолчанию.

    Если вы используете значок emoji, Slack ожидает синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необязательные области пользовательского токена (операции чтения)">
    Если вы настраиваете `channels.slack.userToken`, типичные области чтения:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (если вы полагаетесь на чтение поиска Slack)

  </Accordion>
</AccordionGroup>

## Модель токенов

- `botToken` + `appToken` обязательны для Socket Mode.
- Для режима HTTP требуются `botToken` + `signingSecret`.
- Для режима Relay требуются `botToken`, а также `relay.url`, `relay.authToken` и `relay.gatewayId`; он не использует токен приложения или секрет подписи.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` и `userToken` принимают открытые
  строки или объекты SecretRef.
- Токены в конфигурации переопределяют резервные значения env.
- Резервные значения env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` применяются только к учетной записи по умолчанию.
- `userToken` задается только в конфигурации (без резервного значения env) и по умолчанию работает только для чтения (`userTokenReadOnly: true`).

Поведение снимка состояния:

- Проверка учетной записи Slack отслеживает поля `*Source` и `*Status`
  для каждого учетного материала (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус: `available`, `configured_unavailable` или `missing`.
- `configured_unavailable` означает, что учетная запись настроена через SecretRef
  или другой не inline-источник секрета, но текущая команда или путь выполнения
  не смогли получить фактическое значение.
- В режиме HTTP включается `signingSecretStatus`; в Socket Mode
  обязательная пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для действий и чтения каталога пользовательский токен может иметь приоритет, если настроен. Для записей приоритет остается у токена бота; записи с пользовательским токеном разрешены только когда `userTokenReadOnly: false` и токен бота недоступен.
</Tip>

## Действия и шлюзы

Действия Slack управляются через `channels.slack.actions.*`.

Доступные группы действий в текущих инструментах Slack:

| Группа     | По умолчанию |
| ---------- | ------------ |
| messages   | включено     |
| reactions  | включено     |
| pins       | включено     |
| memberInfo | включено     |
| emojiList  | включено     |

Текущие действия с сообщениями Slack включают `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` и `emoji-list`. `download-file` принимает идентификаторы файлов Slack, показанные во входящих заполнителях файлов, и возвращает предварительные просмотры изображений для изображений или метаданные локального файла для других типов файлов.

## Контроль доступа и маршрутизация

  <Tabs>
  <Tab title="Политика DM">
    `channels.slack.dmPolicy` управляет доступом к DM. `channels.slack.allowFrom` — канонический список разрешенных для DM.

    - `pairing` (по умолчанию)
    - `allowlist`
    - `open` (требует, чтобы `channels.slack.allowFrom` включал `"*"`)
    - `disabled`

    Флаги DM:

    - `dm.enabled` (по умолчанию true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (устаревшее)
    - `dm.groupEnabled` (групповые DM по умолчанию отключены)
    - `dm.groupChannels` (необязательный список разрешенных MPIM)

    Приоритет для нескольких учетных записей:

    - `channels.slack.accounts.default.allowFrom` применяется только к учетной записи `default`.
    - Именованные учетные записи наследуют `channels.slack.allowFrom`, если их собственный `allowFrom` не задан.
    - Именованные учетные записи не наследуют `channels.slack.accounts.default.allowFrom`.

    Устаревшие `channels.slack.dm.policy` и `channels.slack.dm.allowFrom` все еще читаются для совместимости. `openclaw doctor --fix` переносит их в `dmPolicy` и `allowFrom`, когда это можно сделать без изменения доступа.

    Сопряжение в DM использует `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Политика канала">
    `channels.slack.groupPolicy` управляет обработкой каналов:

    - `open`
    - `allowlist`
    - `disabled`

    Список разрешенных каналов находится в `channels.slack.channels` и **должен использовать стабильные идентификаторы каналов Slack** (например, `C12345678`) как ключи конфигурации.

    Примечание о runtime: если `channels.slack` полностью отсутствует (настройка только через env), runtime откатывается к `groupPolicy="allowlist"` и записывает предупреждение в журнал (даже если `channels.defaults.groupPolicy` задан).

    Разрешение имен/ID:

    - записи списка разрешенных каналов и записи списка разрешенных DM разрешаются при запуске, когда доступ токена это позволяет
    - неразрешенные записи с именами каналов сохраняются как настроены, но по умолчанию игнорируются для маршрутизации
    - входящая авторизация и маршрутизация каналов по умолчанию сначала используют ID; прямое сопоставление по имени пользователя/slug требует `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключи на основе имен (`#channel-name` или `channel-name`) **не** сопоставляются при `groupPolicy: "allowlist"`. Поиск канала по умолчанию сначала использует ID, поэтому ключ на основе имени никогда не будет успешно маршрутизирован, а все сообщения в этом канале будут молча заблокированы. Это отличается от `groupPolicy: "open"`, где ключ канала не требуется для маршрутизации, и ключ на основе имени выглядит рабочим.

    Всегда используйте ID канала Slack как ключ. Чтобы найти его: щелкните правой кнопкой мыши канал в Slack → **Copy link** — ID (`C...`) появится в конце URL.

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

    Неправильно (молча блокируется при `groupPolicy: "allowlist"`):

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

  <Tab title="Упоминания и пользователи канала">
    Сообщения в каналах по умолчанию требуют упоминания.

    Источники упоминаний:

    - явное упоминание приложения (`<@botId>`)
    - упоминание группы пользователей Slack (`<!subteam^S...>`), когда пользователь бота является участником этой группы пользователей; требует `usergroups:read`
    - regex-шаблоны упоминаний (`agents.list[].groupChat.mentionPatterns`, резервный вариант `messages.groupChat.mentionPatterns`)
    - неявное поведение ответа в треде боту (отключено, когда `thread.requireExplicitMention` равно `true`)

    Элементы управления для каждого канала (`channels.slack.channels.<id>`; имена только через разрешение при запуске или `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список разрешенных)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` или wildcard `"*"`
      (устаревшие ключи без префикса все еще сопоставляются только с `id:`)

    `allowBots` действует консервативно для каналов и приватных каналов: сообщения комнат, созданные ботами, принимаются только когда отправляющий бот явно указан в allowlist `users` этой комнаты или когда хотя бы один явный ID владельца Slack из `channels.slack.allowFrom` сейчас является участником комнаты. Подстановочные знаки и записи владельцев по отображаемому имени не подтверждают присутствие владельца. Для проверки присутствия владельца используется Slack `conversations.members`; убедитесь, что у приложения есть соответствующий read scope для типа комнаты (`channels:read` для публичных каналов, `groups:read` для приватных каналов). Если поиск участников завершается ошибкой, OpenClaw отбрасывает созданное ботом сообщение комнаты.

    Принятые сообщения Slack, созданные ботами, используют общую [защиту от циклов ботов](/ru/channels/bot-loop-protection). Настройте `channels.defaults.botLoopProtection` для бюджета по умолчанию, затем переопределяйте его через `channels.slack.botLoopProtection` или `channels.slack.channels.<id>.botLoopProtection`, когда рабочей области или каналу нужен другой лимит.

  </Tab>
</Tabs>

## Потоки, сессии и теги ответов

- Личные сообщения маршрутизируются как `direct`; каналы как `channel`; MPIM как `group`.
- Привязки маршрутов Slack принимают необработанные ID собеседников, а также формы целей Slack, например `channel:C12345678`, `user:U12345678` и `<@U12345678>`.
- При значении по умолчанию `session.dmScope=main` личные сообщения Slack сворачиваются в основную сессию агента.
- Сессии каналов: `agent:<agentId>:slack:channel:<channelId>`.
- Обычные сообщения верхнего уровня в канале остаются в сессии конкретного канала, даже когда `replyToMode` не равен `off`.
- Ответы в потоках Slack используют родительский Slack `thread_ts` для суффиксов сессии (`:thread:<threadTs>`), даже когда исходящие ответы в потоках отключены через `replyToMode="off"`.
- OpenClaw помещает подходящий корень верхнего уровня канала в `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, когда ожидается, что этот корень начнет видимый поток Slack, чтобы корень и последующие ответы в потоке использовали одну сессию OpenClaw. Это применяется к событиям `app_mention`, явным совпадениям с ботом или настроенным шаблоном упоминания, а также к каналам с `requireMention: false` и `replyToMode`, отличным от `off`.
- Значение по умолчанию для `channels.slack.thread.historyScope` — `thread`; значение по умолчанию для `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` управляет тем, сколько существующих сообщений потока загружается при запуске новой сессии потока (по умолчанию `20`; задайте `0`, чтобы отключить).
- `channels.slack.thread.requireExplicitMention` (по умолчанию `false`): когда `true`, подавляет неявные упоминания в потоке, чтобы бот отвечал только на явные упоминания `@bot` внутри потоков, даже если бот уже участвовал в потоке. Без этого ответы в потоке с участием бота обходят проверку `requireMention`.

Управление ответами в потоках:

- `channels.slack.replyToMode`: `off|first|all|batched` (по умолчанию `off`)
- `channels.slack.replyToModeByChatType`: для каждого `direct|group|channel`
- устаревший fallback для прямых чатов: `channels.slack.dm.replyToMode`

Поддерживаются ручные теги ответов:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Для явных ответов в потоках Slack из инструмента `message` задайте `replyBroadcast: true` с `action: "send"` и `threadId` или `replyTo`, чтобы попросить Slack также транслировать ответ в потоке в родительский канал. Это сопоставляется с флагом Slack `chat.postMessage` `reply_broadcast` и поддерживается только для отправки текста или Block Kit, но не для загрузок медиа.

Когда вызов инструмента `message` выполняется внутри потока Slack и нацелен на тот же канал, OpenClaw обычно наследует текущий поток Slack согласно `replyToMode`. Задайте `topLevel: true` для `action: "send"` или `action: "upload-file"`, чтобы принудительно создать новое сообщение в родительском канале. `threadId: null` принимается как тот же отказ от потока верхнего уровня.

<Note>
`replyToMode="off"` отключает исходящие ответы Slack в потоках, включая явные теги `[[reply_to_*]]`. Это не выравнивает входящие сессии потоков Slack: сообщения, уже опубликованные внутри потока Slack, все равно маршрутизируются в сессию `:thread:<threadTs>`. Это отличается от Telegram, где явные теги по-прежнему учитываются в режиме `"off"`. Потоки Slack скрывают сообщения из канала, а ответы Telegram остаются видимыми встроенно.
</Note>

## Реакции подтверждения

`ackReaction` отправляет emoji подтверждения, пока OpenClaw обрабатывает входящее сообщение. `ackReactionScope` определяет, _когда_ этот emoji фактически отправляется.

### Emoji (`ackReaction`)

Порядок разрешения:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback на emoji идентичности агента (`agents.list[].identity.emoji`, иначе `"eyes"` / 👀)

Примечания:

- Slack ожидает shortcodes (например, `"eyes"`).
- Используйте `""`, чтобы отключить реакцию для аккаунта Slack или глобально.

### Область (`messages.ackReactionScope`)

Провайдер Slack читает область из `messages.ackReactionScope` (по умолчанию `"group-mentions"`). На сегодня нет переопределения на уровне аккаунта Slack или канала Slack; значение глобально для gateway.

Значения:

- `"all"`: реагировать в личных сообщениях и группах.
- `"direct"`: реагировать только в личных сообщениях.
- `"group-all"`: реагировать на каждое групповое сообщение (без личных сообщений).
- `"group-mentions"` (по умолчанию): реагировать в группах, но только когда бот упомянут (или в групповых mentionables, которые включили это). **Личные сообщения исключены.**
- `"off"` / `"none"`: никогда не реагировать.

<Note>
Область по умолчанию (`"group-mentions"`) не запускает реакции подтверждения в прямых сообщениях. Чтобы видеть настроенный `ackReaction` (например, `"eyes"`) во входящих личных сообщениях Slack, задайте `messages.ackReactionScope` как `"direct"` или `"all"`. `messages.ackReactionScope` читается при запуске провайдера Slack, поэтому для применения изменения нужен перезапуск gateway.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Потоковая передача текста

`channels.slack.streaming` управляет поведением live preview:

- `off`: отключить потоковую передачу live preview.
- `partial` (по умолчанию): заменять текст предварительного просмотра последним частичным выводом.
- `block`: добавлять фрагментированные обновления предварительного просмотра.
- `progress`: показывать текст состояния прогресса во время генерации, затем отправлять финальный текст.
- `streaming.preview.toolProgress`: когда черновой предварительный просмотр активен, направлять обновления инструментов/прогресса в то же редактируемое сообщение предварительного просмотра (по умолчанию: `true`). Задайте `false`, чтобы сохранять отдельные сообщения инструментов/прогресса.
- `streaming.preview.commandText` / `streaming.progress.commandText`: задайте `status`, чтобы сохранять компактные строки прогресса инструментов, скрывая необработанный текст команд/exec (по умолчанию: `raw`).

Скрыть необработанный текст команд/exec, сохраняя компактные строки прогресса:

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

`channels.slack.streaming.nativeTransport` управляет нативной потоковой передачей текста Slack, когда `channels.slack.streaming.mode` равен `partial` (по умолчанию: `true`).

Нативные карточки задач прогресса Slack включаются явно для режима прогресса. Задайте `channels.slack.streaming.progress.nativeTaskCards` как `true` вместе с `channels.slack.streaming.mode="progress"`, чтобы отправлять нативную для Slack карточку плана/задачи, пока работа выполняется, а затем обновлять ту же карточку задачи при завершении. Без этого флага режим прогресса сохраняет переносимое поведение чернового предварительного просмотра.

- Для появления нативной потоковой передачи текста и статуса потока ассистента Slack должен быть доступен поток ответов. Выбор потока по-прежнему следует `replyToMode`.
- Корни каналов, групповых чатов и личных сообщений верхнего уровня все равно могут использовать обычный черновой предварительный просмотр, когда нативная потоковая передача недоступна или нет потока ответов.
- Личные сообщения Slack верхнего уровня по умолчанию остаются вне потока, поэтому они не показывают нативный предварительный просмотр потока/статуса Slack в стиле thread; вместо этого OpenClaw публикует и редактирует черновой предварительный просмотр в личном сообщении.
- Медиа и нетекстовые payloads используют fallback к обычной доставке.
- Финальные медиа/ошибки отменяют ожидающие правки предварительного просмотра; подходящие финальные тексты/блоки сбрасываются только когда они могут редактировать предварительный просмотр на месте.
- Если потоковая передача завершается ошибкой в середине ответа, OpenClaw использует fallback к обычной доставке для оставшихся payloads.

Использовать черновой предварительный просмотр вместо нативной потоковой передачи текста Slack:

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

Включить нативные карточки задач прогресса Slack:

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

Устаревшие ключи:

- `channels.slack.streamMode` (`replace | status_final | append`) — устаревший runtime-псевдоним для `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` — устаревший runtime-псевдоним для `channels.slack.streaming.mode` и `channels.slack.streaming.nativeTransport`.
- устаревший `channels.slack.nativeStreaming` — runtime-псевдоним для `channels.slack.streaming.nativeTransport`.
- Запустите `openclaw doctor --fix`, чтобы переписать сохраненную конфигурацию потоковой передачи Slack на канонические ключи.

## Fallback реакции набора текста

`typingReaction` добавляет временную реакцию к входящему сообщению Slack, пока OpenClaw обрабатывает ответ, а затем удаляет ее после завершения запуска. Это наиболее полезно вне ответов в потоках, которые используют стандартный индикатор состояния "is typing...".

Порядок разрешения:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примечания:

- Slack ожидает shortcodes (например, `"hourglass_flowing_sand"`).
- Реакция выполняется по принципу best-effort, а очистка автоматически предпринимается после завершения ответа или пути ошибки.

## Медиа, разбиение на фрагменты и доставка

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Файловые вложения Slack скачиваются с приватных URL, размещенных Slack (поток запроса с аутентификацией токеном), и записываются в хранилище медиа, когда получение успешно и лимиты размера позволяют. Заполнители файлов включают Slack `fileId`, чтобы агенты могли получить исходный файл через `download-file`.

    Скачивания используют ограниченные тайм-ауты простоя и общего времени. Если получение файла Slack зависает или завершается ошибкой, OpenClaw продолжает обработку сообщения и использует fallback к заполнителю файла.

    Runtime-лимит размера входящих данных по умолчанию равен `20MB`, если не переопределен через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - текстовые фрагменты используют `channels.slack.textChunkLimit` (по умолчанию 4000)
    - `channels.slack.chunkMode="newline"` включает разбиение сначала по абзацам
    - отправка файлов использует API загрузки Slack и может включать ответы в потоках (`thread_ts`)
    - лимит исходящих медиа следует `channels.slack.mediaMaxMb`, когда он настроен; иначе отправки канала используют значения по умолчанию по MIME-виду из конвейера медиа

  </Accordion>

  <Accordion title="Delivery targets">
    Предпочтительные явные цели:

    - `user:<id>` для личных сообщений
    - `channel:<id>` для каналов

    Личные сообщения Slack только с текстом/блоками можно публиковать напрямую по ID пользователей; загрузки файлов и отправки в потоках сначала открывают личное сообщение через API бесед Slack, потому что этим путям нужен конкретный ID беседы.

  </Accordion>
</AccordionGroup>

## Команды и поведение slash

Slash-команды отображаются в Slack либо как одна настроенная команда, либо как несколько нативных команд. Настройте `channels.slack.slashCommand`, чтобы изменить значения команд по умолчанию:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативные команды требуют [дополнительных настроек манифеста](#additional-manifest-settings) в вашем приложении Slack и вместо этого включаются через `channels.slack.commands.native: true` или `commands.native: true` в глобальных конфигурациях.

- Нативный автоматический режим команд **выключен** для Slack, поэтому `commands.native: "auto"` не включает нативные команды Slack.

```txt
/help
```

Нативные меню аргументов используют адаптивную стратегию рендеринга, которая показывает модальное окно подтверждения перед отправкой выбранного значения опции:

- до 5 опций: блоки кнопок
- 6-100 опций: статическое меню выбора
- более 100 опций: внешний select с асинхронной фильтрацией опций, когда доступны обработчики options для интерактивности
- превышены лимиты Slack: закодированные значения опций используют fallback к кнопкам

```txt
/think
```

Slash-сеансы используют изолированные ключи вроде `agent:<agentId>:slack:slash:<userId>` и по-прежнему направляют выполнение команд в целевой сеанс беседы с помощью `CommandTargetSessionKey`.

## Интерактивные ответы

Slack может отображать созданные агентом элементы управления интерактивными ответами, но по умолчанию эта функция отключена.
Для нового вывода агента, CLI и Plugin предпочитайте общие
кнопки `presentation` или блоки выбора. Они используют тот же путь взаимодействия Slack
и при этом корректно деградируют в других каналах.

Включите глобально:

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

Или включите только для одной учетной записи Slack:

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

Если включено, агенты все еще могут выдавать устаревшие директивы ответов только для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Эти директивы компилируются в Slack Block Kit и направляют нажатия или выбор
обратно через существующий путь событий взаимодействия Slack. Сохраняйте их для старых
промптов и Slack-специфичных аварийных обходов; для новых
переносимых элементов управления используйте общую презентацию.

API компилятора директив также устарели для нового кода-производителя:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Используйте полезные нагрузки `presentation` и `buildSlackPresentationBlocks(...)` для новых
элементов управления, отображаемых в Slack.

Примечания:

- Это устаревший UI, специфичный для Slack. Другие каналы не переводят директивы Slack Block
  Kit в собственные системы кнопок.
- Значения интерактивных обратных вызовов являются непрозрачными токенами, созданными OpenClaw, а не сырыми значениями, заданными агентом.
- Если созданные интерактивные блоки превысят ограничения Slack Block Kit, OpenClaw вернется к исходному текстовому ответу вместо отправки недопустимой полезной нагрузки блоков.

### Отправки модальных окон, принадлежащие Plugin

Plugin Slack, которые регистрируют интерактивный обработчик, также могут получать события жизненного цикла модальных окон
`view_submission` и `view_closed` до того, как OpenClaw сожмет
полезную нагрузку для видимого агенту системного события. При открытии модального окна Slack используйте один из этих
шаблонов маршрутизации:

- Задайте `callback_id` как `openclaw:<namespace>:<payload>`.
- Или сохраните существующий `callback_id` и поместите `pluginInteractiveData:
"<namespace>:<payload>"` в `private_metadata` модального окна.

Обработчик получает `ctx.interaction.kind` как `view_submission` или
`view_closed`, нормализованные `inputs` и полный сырой объект `stateValues` из
Slack. Маршрутизации только по callback ID достаточно, чтобы вызвать обработчик Plugin; включайте
существующие поля маршрутизации пользователя/сеанса из `private_metadata` модального окна, когда
модальное окно также должно создать видимое агенту системное событие. Агент получает
компактное, отредактированное системное событие `Slack interaction: ...`. Если обработчик возвращает
`systemEvent.summary`, `systemEvent.reference` или `systemEvent.data`, эти
поля включаются в это компактное событие, чтобы агент мог ссылаться на
хранилище, принадлежащее Plugin, не видя полной полезной нагрузки формы.

## Нативные подтверждения в Slack

Slack может работать как нативный клиент подтверждений с интерактивными кнопками и взаимодействиями, вместо отката к Web UI или терминалу.

- Подтверждения Exec и Plugin могут отображаться как нативные подсказки Slack Block Kit.
- `channels.slack.execApprovals.*` остается конфигурацией включения нативного клиента подтверждений exec и маршрутизации DM/канала.
- DM подтверждений exec используют `channels.slack.execApprovals.approvers` или `commands.ownerAllowFrom`.
- Подтверждения Plugin используют нативные кнопки Slack, когда Slack включен как нативный клиент подтверждений для исходного сеанса или когда `approvals.plugin` направляет в исходный сеанс Slack либо целевой Slack.
- DM подтверждений Plugin используют утверждающих Plugin Slack из `channels.slack.allowFrom`, `allowFrom` именованной учетной записи или маршрута учетной записи по умолчанию.
- Авторизация утверждающих по-прежнему принудительно проверяется: утверждающие только exec не могут подтверждать запросы Plugin, если они также не являются утверждающими Plugin.

Это использует ту же общую поверхность кнопок подтверждения, что и другие каналы. Когда `interactivity` включена в настройках вашего приложения Slack, подсказки подтверждения отображаются как кнопки Block Kit прямо в беседе.
Когда эти кнопки присутствуют, они являются основным UX подтверждения; OpenClaw
должен включать ручную команду `/approve` только когда результат инструмента сообщает, что
подтверждения в чате недоступны или ручное подтверждение является единственным путем.

Путь конфигурации:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необязательно; по возможности откатывается к `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, по умолчанию: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматически включает нативные подтверждения exec, когда `enabled` не задано или равно `"auto"` и разрешается хотя бы один
утверждающий exec. Slack также может обрабатывать нативные подтверждения Plugin через этот путь нативного клиента,
когда разрешаются утверждающие Plugin Slack и запрос соответствует фильтрам нативного клиента. Задайте
`enabled: false`, чтобы явно отключить Slack как нативный клиент подтверждений. Задайте `enabled: true`, чтобы
принудительно включить нативные подтверждения, когда разрешаются утверждающие. Отключение подтверждений exec Slack не отключает
доставку нативных подтверждений Plugin Slack, включенную через `approvals.plugin`; доставка подтверждений Plugin
вместо этого использует утверждающих Plugin Slack.

Поведение по умолчанию без явной конфигурации подтверждений exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явная нативная конфигурация Slack нужна только когда требуется переопределить утверждающих, добавить фильтры или
включить доставку в исходный чат:

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

Общая пересылка `approvals.exec` отделена. Используйте ее только когда подсказки подтверждения exec также должны
направляться в другие чаты или явные внеполосные цели. Общая пересылка `approvals.plugin` также
отделена; нативная доставка Slack подавляет этот откат только когда Slack может обработать запрос
подтверждения Plugin нативно.

`/approve` в том же чате также работает в каналах Slack и DM, которые уже поддерживают команды. См. [Подтверждения Exec](/ru/tools/exec-approvals) для полной модели пересылки подтверждений.

## События и операционное поведение

- Редактирования/удаления сообщений преобразуются в системные события.
- Трансляции тредов (ответы в треде с "Also send to channel") обрабатываются как обычные сообщения пользователя.
- События добавления/удаления реакций преобразуются в системные события.
- События входа/выхода участника, создания/переименования канала и добавления/удаления закрепления преобразуются в системные события.
- `channel_id_changed` может мигрировать ключи конфигурации канала, когда включено `configWrites`.
- Метаданные темы/назначения канала считаются недоверенным контекстом и могут быть внедрены в контекст маршрутизации.
- Начальное сообщение треда и первичное заполнение контекста истории треда фильтруются настроенными allowlist отправителей, когда применимо.
- Действия блоков, ярлыки и модальные взаимодействия создают структурированные системные события `Slack interaction: ...` с богатыми полями полезной нагрузки:
  - действия блоков: выбранные значения, метки, значения picker и метаданные `workflow_*`
  - глобальные ярлыки: метаданные callback и участника, направленные в прямой сеанс участника
  - ярлыки сообщений: контекст callback, участника, канала, треда и выбранного сообщения
  - события модальных окон `view_submission` и `view_closed` с маршрутизированными метаданными канала и вводом формы

Определите глобальные ярлыки или ярлыки сообщений в конфигурации приложения Slack и используйте любой непустой callback ID. OpenClaw подтверждает соответствующие полезные нагрузки ярлыков, применяет ту же политику отправителей DM/каналов, что и для других взаимодействий Slack, и ставит очищенное событие в очередь для маршрутизированного сеанса агента. Trigger ID и URL ответов редактируются из контекста агента.

## Справочник конфигурации

Основной справочник: [Справочник конфигурации - Slack](/ru/gateway/config-channels#slack).

<Accordion title="Высокосигнальные поля Slack">

- режим/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ к DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- переключатель совместимости: `dangerouslyAllowNameMatching` (аварийный режим; держите выключенным, если не требуется)
- доступ к каналу: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треды/история: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- развертки: `unfurlLinks` (по умолчанию: `false`), `unfurlMedia` для управления предпросмотром ссылок/медиа в `chat.postMessage`; задайте `unfurlLinks: true`, чтобы снова включить предпросмотр ссылок
- операции/функции: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Нет ответов в каналах">
    Проверьте по порядку:

    - `groupPolicy`
    - allowlist каналов (`channels.slack.channels`) — **ключи должны быть ID каналов** (`C12345678`), а не именами (`#channel-name`). Ключи на основе имен молча не срабатывают при `groupPolicy: "allowlist"`, потому что маршрутизация каналов по умолчанию сначала использует ID. Чтобы найти ID: щелкните канал в Slack правой кнопкой мыши → **Copy link** — значение `C...` в конце URL является ID канала.
    - `requireMention`
    - allowlist `users` для каждого канала
    - `messages.groupChat.visibleReplies`: обычные запросы группы/канала по умолчанию используют `"automatic"`. Если вы включили `"message_tool"` и журналы показывают текст ассистента без вызова `message(action=send)`, модель пропустила путь видимого message-tool. В этом режиме финальный текст остается приватным; проверьте подробный журнал Gateway на метаданные подавленной полезной нагрузки или задайте `"automatic"`, если хотите, чтобы каждый обычный финальный ответ ассистента публиковался через legacy-путь.
    - `messages.groupChat.unmentionedInbound`: если значение равно `"room_event"`, разрешенная беседа канала без упоминания является фоновым контекстом и остается без ответа, если агент не вызовет инструмент `message`. См. [Фоновые события комнаты](/ru/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    Полезные команды:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Сообщения DM игнорируются">
    Проверьте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (или legacy `channels.slack.dm.policy`)
    - подтверждения привязки / записи allowlist (`dmPolicy: "open"` все равно требует `channels.slack.allowFrom: ["*"]`)
    - групповые DM используют обработку MPIM; включите `channels.slack.dm.groupEnabled` и, если настроено, включите MPIM в `channels.slack.dm.groupChannels`
    - события DM Slack Assistant: подробные журналы с упоминанием `drop message_changed`
      обычно означают, что Slack отправил отредактированное событие треда Assistant без
      восстанавливаемого человека-отправителя в метаданных сообщения

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не подключается">
    Проверьте токены бота и приложения, а также включение Socket Mode в настройках приложения Slack.
    App-Level Token требует `connections:write`, а Bot User OAuth Token
    бота должен принадлежать тому же приложению/рабочему пространству Slack, что и токен приложения.

    Если `openclaw channels status --probe --json` показывает `botTokenStatus` или
    `appTokenStatus: "configured_unavailable"`, учетная запись Slack
    настроена, но текущая среда выполнения не смогла разрешить значение на основе SecretRef.

    Журналы вроде `slack socket mode failed to start; retry ...` означают восстанавливаемые
    сбои запуска. Отсутствующие scopes, отозванные токены и недействительная аутентификация
    вместо этого завершаются с ошибкой сразу. Журнал `slack token mismatch ...` означает, что токен бота и токен приложения,
    по-видимому, относятся к разным приложениям Slack; исправьте учетные данные приложения Slack.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Проверьте:

    - signing secret
    - путь webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - уникальный `webhookPath` для каждой HTTP-учетной записи
    - публичный URL завершает TLS и перенаправляет запросы на путь Gateway
    - путь `request_url` приложения Slack точно совпадает с `channels.slack.webhookPath` (по умолчанию `/slack/events`)

    Если `signingSecretStatus: "configured_unavailable"` появляется в снимках
    учетной записи, HTTP-учетная запись настроена, но текущая среда выполнения не смогла
    разрешить подписывающий секрет на базе SecretRef.

    Повторяющийся журнал `slack: webhook path ... already registered` означает, что две HTTP-
    учетные записи используют один и тот же `webhookPath`; задайте каждой учетной записи отдельный путь.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Проверьте, что именно вы намеревались использовать:

    - режим нативных команд (`channels.slack.commands.native: true`) с соответствующими slash-командами, зарегистрированными в Slack
    - или режим одной slash-команды (`channels.slack.slashCommand.enabled: true`)

    Slack не создает и не удаляет slash-команды автоматически. `commands.native: "auto"` не включает нативные команды Slack; используйте `true` и создайте соответствующие команды в приложении Slack. В режиме HTTP каждая slash-команда Slack должна включать URL Gateway. В Socket Mode полезные нагрузки команд поступают через websocket, а Slack игнорирует `slash_commands[].url`.

    Также проверьте `commands.useAccessGroups`, авторизацию DM, списки разрешенных каналов
    и списки разрешенных `users` для каждого канала. Slack возвращает эфемерные ошибки для
    заблокированных отправителей slash-команд, включая:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Справочник по vision для вложений

Slack может прикреплять загруженные медиа к ходу агента, когда загрузка файлов Slack успешна и ограничения размера это позволяют. Файлы изображений могут передаваться через путь понимания медиа или напрямую в модель ответа с поддержкой vision; другие файлы сохраняются как загружаемый файловый контекст, а не рассматриваются как входные изображения.

### Поддерживаемые типы медиа

| Тип медиа                      | Источник             | Текущее поведение                                                               | Примечания                                                                 |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Изображения JPEG / PNG / GIF / WebP | URL файла Slack  | Загружаются и прикрепляются к ходу для обработки с поддержкой vision            | Лимит на файл: `channels.slack.mediaMaxMb` (по умолчанию 20 MB)            |
| PDF-файлы                      | URL файла Slack      | Загружаются и доступны как файловый контекст для инструментов вроде `download-file` или `pdf` | Входящий Slack не преобразует PDF в image-vision-ввод автоматически |
| Другие файлы                   | URL файла Slack      | Загружаются, когда возможно, и доступны как файловый контекст                   | Бинарные файлы не рассматриваются как входные изображения                  |
| Ответы в треде                 | Файлы начального сообщения треда | Файлы корневого сообщения могут быть подгружены как контекст, когда у ответа нет прямых медиа | Начальные сообщения только с файлами используют placeholder вложения |
| Сообщения с несколькими изображениями | Несколько файлов Slack | Каждый файл оценивается независимо                                             | Обработка Slack ограничена восемью файлами на сообщение                    |

### Входящий конвейер

Когда приходит сообщение Slack с файловыми вложениями:

1. OpenClaw загружает файл с приватного URL Slack, используя токен бота.
2. При успехе файл записывается в хранилище медиа.
3. Пути загруженных медиа и типы содержимого добавляются во входящий контекст.
4. Пути модели/инструмента с поддержкой изображений могут использовать вложения изображений из этого контекста.
5. Файлы, не являющиеся изображениями, остаются доступными как файловые метаданные или ссылки на медиа для инструментов, которые могут их обработать.

### Наследование вложений из корня треда

Когда сообщение приходит в треде (имеет родительский `thread_ts`):

- Если у самого ответа нет прямых медиа, а включенное корневое сообщение содержит файлы, Slack может подгрузить корневые файлы как контекст начального сообщения треда.
- Прямые вложения ответа имеют приоритет над вложениями корневого сообщения.
- Корневое сообщение, в котором есть только файлы и нет текста, представляется placeholder вложения, чтобы резервный путь все равно мог включить его файлы.

### Обработка нескольких вложений

Когда одно сообщение Slack содержит несколько файловых вложений:

- Каждое вложение обрабатывается независимо через медийный конвейер.
- Ссылки на загруженные медиа агрегируются в контекст сообщения.
- Порядок обработки следует порядку файлов Slack в полезной нагрузке события.
- Сбой загрузки одного вложения не блокирует остальные.

### Ограничения размера, загрузки и модели

- **Ограничение размера**: по умолчанию 20 MB на файл. Настраивается через `channels.slack.mediaMaxMb`.
- **Сбои загрузки**: файлы, которые Slack не может отдать, истекшие URL, недоступные файлы, слишком большие файлы и HTML-ответы Slack auth/login пропускаются вместо сообщения о неподдерживаемых форматах.
- **Модель vision**: анализ изображений использует активную модель ответа, когда она поддерживает vision, или модель изображений, настроенную в `agents.defaults.imageModel`.

### Известные ограничения

| Сценарий                              | Текущее поведение                                                           | Обходной путь                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Истекший URL файла Slack              | Файл пропускается; ошибка не отображается                                    | Загрузите файл в Slack повторно                                           |
| Модель vision не настроена            | Вложения изображений сохраняются как ссылки на медиа, но не анализируются как изображения | Настройте `agents.defaults.imageModel` или используйте модель ответа с поддержкой vision |
| Очень большие изображения (> 20 MB по умолчанию) | Пропускаются согласно ограничению размера                                  | Увеличьте `channels.slack.mediaMaxMb`, если Slack позволяет                |
| Пересланные/общие вложения            | Текст и размещенные в Slack медиа изображений/файлов обрабатываются по мере возможности | Повторно поделитесь ими напрямую в треде OpenClaw                          |
| PDF-вложения                          | Сохраняются как файловый/медийный контекст, но автоматически не направляются через image vision | Используйте `download-file` для файловых метаданных или инструмент `pdf` для анализа PDF |

### Связанная документация

- [Конвейер понимания медиа](/ru/nodes/media-understanding)
- [Инструмент PDF](/ru/tools/pdf)
- Эпик: [#51349](https://github.com/openclaw/openclaw/issues/51349) — включение vision для вложений Slack
- Регрессионные тесты: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-верификация: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ru/channels/pairing">
    Свяжите пользователя Slack с gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ru/channels/groups">
    Поведение каналов и групповых DM.
  </Card>
  <Card title="Channel routing" icon="route" href="/ru/channels/channel-routing">
    Маршрутизируйте входящие сообщения агентам.
  </Card>
  <Card title="Security" icon="shield" href="/ru/gateway/security">
    Модель угроз и усиление защиты.
  </Card>
  <Card title="Configuration" icon="sliders" href="/ru/gateway/configuration">
    Структура конфигурации и приоритеты.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ru/tools/slash-commands">
    Каталог команд и поведение.
  </Card>
</CardGroup>
