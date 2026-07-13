---
read_when:
    - Настройка Slack или отладка режима сокетов, HTTP или ретрансляции Slack
summary: Настройка Slack и поведение во время выполнения (Socket Mode, URL-адреса HTTP-запросов и режим ретрансляции)
title: Slack
x-i18n:
    generated_at: "2026-07-13T19:32:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c29d2dccefc54d3972fd8ff4edccfdc3779c030a8d51f29a750a0057d9f0998e
    source_path: channels/slack.md
    workflow: 16
---

Поддержка Slack охватывает личные сообщения и каналы посредством интеграций с приложением Slack. По умолчанию используется транспорт Socket Mode; также поддерживаются HTTP Request URLs. Режим ретрансляции предназначен для управляемых развертываний, в которых доверенный маршрутизатор управляет входящим трафиком Slack.

<CardGroup cols={3}>
  <Card title="Сопряжение" icon="link" href="/ru/channels/pairing">
    Для личных сообщений Slack по умолчанию используется режим сопряжения.
  </Card>
  <Card title="Команды с косой чертой" icon="terminal" href="/ru/tools/slash-commands">
    Поведение встроенных команд и каталог команд.
  </Card>
  <Card title="Устранение неполадок каналов" icon="wrench" href="/ru/channels/troubleshooting">
    Межканальная диагностика и сценарии устранения неполадок.
  </Card>
</CardGroup>

## Выбор транспорта

Socket Mode и HTTP Request URLs обеспечивают одинаковую функциональность для обмена сообщениями, команд с косой чертой, App Home и интерактивных возможностей. Выбирайте исходя из архитектуры развертывания, а не набора функций.

| Аспект                       | Socket Mode (по умолчанию)                                                                                                                           | HTTP Request URLs                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Публичный URL Gateway        | Не требуется                                                                                                                                         | Требуется (DNS, TLS, обратный прокси-сервер или туннель)                                                               |
| Исходящая сеть               | Должно быть доступно исходящее WSS-подключение к `wss-primary.slack.com`                                                                                  | Без исходящего WS; только входящий HTTPS                                                                               |
| Необходимые токены           | Токен бота + App-Level Token с `connections:write`                                                                                                    | Токен бота + Signing Secret                                                                                            |
| Ноутбук разработчика / сеть за межсетевым экраном | Работает без дополнительной настройки                                                                                                    | Требуется публичный туннель (ngrok, Cloudflare Tunnel, Tailscale Funnel) или промежуточный Gateway                     |
| Горизонтальное масштабирование | Один сеанс Socket Mode на приложение на каждом хосте; для нескольких Gateway требуются отдельные приложения Slack                                  | Обработчик POST без состояния; несколько реплик Gateway могут совместно использовать одно приложение за балансировщиком нагрузки |
| Несколько учетных записей на одном Gateway | Поддерживается; каждая учетная запись открывает собственное WS-подключение                                                               | Поддерживается; каждой учетной записи требуется уникальный `webhookPath` (по умолчанию `/slack/events`), чтобы регистрации не конфликтовали |
| Транспорт команд с косой чертой | Доставляются через WS-подключение; `slash_commands[].url` игнорируется                                                                               | Slack отправляет POST на `slash_commands[].url`; поле обязательно для передачи команды                                    |
| Подписание запросов          | Не используется (аутентификация выполняется с помощью App-Level Token)                                                                               | Slack подписывает каждый запрос; OpenClaw проверяет подпись с помощью `signingSecret`                               |
| Восстановление после разрыва подключения | Автоматическое переподключение Slack SDK включено; OpenClaw также перезапускает завершившиеся с ошибкой сеансы Socket Mode с ограниченной экспоненциальной задержкой. Применяются настройки транспорта для тайм-аута pong. | Нет постоянного подключения, которое может разорваться; Slack повторяет каждый запрос отдельно                        |

<Note>
  **Выбирайте Socket Mode** для хостов с одним Gateway, ноутбуков разработчиков и локальных сетей, которые могут устанавливать исходящие подключения к `*.slack.com`, но не могут принимать входящий HTTPS-трафик.

**Выбирайте HTTP Request URLs**, если запускаете несколько реплик Gateway за балансировщиком нагрузки, если исходящий WSS заблокирован, но входящий HTTPS разрешен, либо если вы уже принимаете вебхуки Slack на обратном прокси-сервере.
</Note>

<Warning>
  Slack может поддерживать несколько подключений Socket Mode для одного приложения и доставлять каждую полезную нагрузку через любое из них. Поэтому отдельным Gateway OpenClaw, использующим одно приложение Slack, необходимы эквивалентные конфигурации маршрутизации и авторизации. В противном случае используйте отдельное приложение Slack для каждого Gateway, единую точку входа ретрансляции или HTTP Request URLs за балансировщиком нагрузки. См. [Использование Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Режим ретрансляции

Режим ретрансляции отделяет входящий трафик Slack от Gateway OpenClaw. Доверенный маршрутизатор управляет единственным подключением Slack Socket Mode, выбирает целевой Gateway и пересылает типизированное событие через аутентифицированный WebSocket. Gateway по-прежнему использует собственный токен бота для исходящих вызовов Slack Web API.

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

URL ретрансляции должен использовать `wss://`, если только он не указывает на localhost. Рассматривайте токен предъявителя и таблицу маршрутов маршрутизатора как часть границы авторизации Slack: маршрутизированные события поступают в обычный обработчик сообщений Slack как авторизованные активации. Предоставленный маршрутизатором `slack_identity` в кадре WebSocket `hello` может задать имя пользователя и значок для исходящих сообщений по умолчанию; явно указанная вызывающей стороной идентичность по-прежнему имеет приоритет. Подключение ретрансляции восстанавливается с той же ограниченной экспоненциальной задержкой, что и Socket Mode, и при каждом отключении удаляет предоставленную маршрутизатором идентичность.

### Установки для всей организации Enterprise Grid

Одна учетная запись Slack может получать сообщения из всех рабочих пространств, охваченных установкой Enterprise Grid для всей организации. Выберите прямой Socket Mode или HTTP Request URLs; режим ретрансляции не поддерживается для корпоративных учетных записей. Оба приведенных ниже манифеста с минимальными привилегиями включают только путь событий V1 `message` и `app_mention`, немедленные ответы и реакции состояния, управляемые слушателем.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Попросите администратора или владельца организации Enterprise Grid одобрить приложение, установить его на уровне организации и выбрать рабочие пространства, охватываемые установкой. Перед запуском OpenClaw убедитесь, что приложение доступно во всех нужных рабочих пространствах. Создайте токен уровня приложения с `connections:write` для Socket Mode, затем скопируйте токен бота из установки организации. Настройте учетную запись, использующую токен бота, установленного на уровне организации:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

Используйте режим HTTP, если Gateway имеет публичную конечную точку HTTPS и не открывает подключение Socket Mode. Замените URL в примере публичным URL `webhookPath` вашего Gateway (по умолчанию `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Попросите администратора или владельца организации Enterprise Grid одобрить приложение, установить его на уровне организации и выбрать рабочие пространства, охватываемые установкой. После того как Slack проверит Request URL, скопируйте токен бота установки организации и значение **Basic Information -> App Credentials -> Signing Secret** приложения. Настройте корпоративную учетную запись с тем же путем Request URL:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

При запуске OpenClaw проверяет `enterpriseOrgInstall` с помощью Slack `auth.test`. Токен, установленный на уровне организации, без этого флага либо токен рабочего пространства с этим флагом приводит к ошибке запуска. Slack остается источником истины для определения рабочих пространств, предоставивших доступ установке; затем OpenClaw применяет настроенные политики каналов, пользователей, личных сообщений и упоминаний к каждому доставленному событию. Enterprise V1 отклоняет все созданные ботами события `message` и `app_mention` до диспетчеризации независимо от `allowBots`, поскольку установки на уровне организации не предоставляют стабильную идентичность бота с привязкой к рабочему пространству для предотвращения циклов.

Поддержка Enterprise намеренно ограничена прямым Socket Mode или событиями HTTP `message` и `app_mention`, а также немедленными ответами на них. Режим ретрансляции, команды с косой чертой, взаимодействия, App Home, слушатели событий реакций, закрепления, инструменты действий Slack, встроенные подтверждения Slack, привязки, доставка из очереди или по расписанию и проактивная отправка недоступны для корпоративной учетной записи. Исходящие реакции подтверждения, набора текста и состояния поддерживаются через управляемый слушателем клиент Slack и требуют `reactions:write`; входящие уведомления о реакциях и инструменты действий с реакциями остаются недоступны.

Немедленные ответы используют стандартное поведение доставки Slack для фрагментов,
медиафайлов, метаданных, резервного определения личности, разворачивания ссылок и подтверждений, но только пока
проверенный клиент, принадлежащий слушателю, остаётся в активном цикле обработки события. Очередь
отправки в памяти и записи об участии в обсуждениях разделяются по рабочему пространству
этого события; сам клиент никогда не сериализуется и не сохраняется.

Ключи политик каналов и записи `dm.groupChannels` должны использовать необработанные стабильные идентификаторы каналов Slack или
форму `channel:<id>`. OpenClaw нормализует обе формы до необработанного идентификатора канала для
сопоставления во время выполнения; префиксы `slack:`, `group:` и `mpim:` приводят к сбою запуска.
Записи политик пользователей должны использовать стабильные идентификаторы пользователей Slack; имена, краткие имена, отображаемые имена
и адреса электронной почты приводят к сбою запуска. Идентификаторы должны использовать канонический
префикс и основную часть Slack в верхнем регистре (например, `C0123456789` или `U0123456789`); варианты в нижнем регистре и
короткие похожие значения приводят к сбою запуска. Корпоративные аккаунты не могут включать
`dangerouslyAllowNameMatching`. Корпоративные аккаунты могут задать глобальное значение
`mentionPatterns.mode`, но `mentionPatterns.allowIn` и
`mentionPatterns.denyIn` приводят к сбою запуска, поскольку простые идентификаторы каналов Slack не
содержат привязки к рабочему пространству и могут повторно использоваться в разных рабочих пространствах. Установки в рабочих пространствах
сохраняют существующее поведение шаблонов упоминаний с ограниченной областью действия. Каждое принятое рабочее пространство
получает отдельные идентификаторы маршрутизации, сеанса, расшифровки, дедупликации, истории и кеша,
даже если идентификаторы Slack совпадают. В потоке `message` поддерживаются обычные сообщения пользователей
и созданные пользователями события `file_share`; остальные подтипы сообщений
отклоняются до авторизации или обработки системных событий.

Корпоративные личные сообщения должны быть либо отключены (`dm.enabled=false` или
`dmPolicy="disabled"`), либо явно открыты с помощью `dmPolicy="open"` и
действующего значения `allowFrom` аккаунта, содержащего литерал `"*"`. Пустой
список разрешений или идентификаторы отдельных пользователей без `"*"` приводят к сбою запуска. Сопряжение и
списки разрешений личных сообщений для отдельных пользователей отклоняются, поскольку идентификаторы пользователей Slack не
содержат привязки к рабочему пространству в этих хранилищах авторизации. Политики каналов и отправителей
продолжают применяться к сообщениям каналов.

## Установка

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` регистрирует и включает плагин. Он ничего не делает, пока вы не настроите приложение Slack и параметры каналов ниже. Общие правила установки плагинов см. в разделе [Плагины](/ru/tools/plugin).

## Быстрая настройка

Манифесты в этом разделе создают установку с областью действия рабочего пространства. Для
установки в масштабах организации Enterprise Grid используйте отдельный
[манифест и рабочий процесс для всей организации](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Режим Socket Mode (по умолчанию)">
    <Steps>
      <Step title="Создание нового приложения Slack">
        Откройте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → выберите рабочее пространство → вставьте один из приведённых ниже манифестов → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Коннектор Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw связывает обсуждения помощника Slack с агентами OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "Чем вы можете мне помочь?" },
        {
          "title": "Подвести итог по этому каналу",
          "message": "Подведите итог недавней активности в этом канале."
        },
        { "title": "Подготовить ответ", "message": "Помогите мне подготовить ответ." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Отправить сообщение в OpenClaw",
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
    "description": "Коннектор Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw связывает обсуждения помощника Slack с агентами OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "Чем вы можете мне помочь?" },
        {
          "title": "Подвести итог по этому каналу",
          "message": "Подведите итог недавней активности в этом канале."
        },
        { "title": "Подготовить ответ", "message": "Помогите мне подготовить ответ." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Отправить сообщение в OpenClaw",
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
          **Рекомендуемый** вариант соответствует полному набору возможностей плагина Slack: App Home, команды с косой чертой, файлы, реакции, закрепления, групповые личные сообщения и чтение эмодзи и групп пользователей. Выберите **Минимальный** вариант, если политика рабочего пространства ограничивает области доступа: он охватывает личные сообщения, историю каналов и групп, упоминания и команды с косой чертой, но исключает файлы, реакции, закрепления, групповые личные сообщения (`mpim:*`), `emoji:read` и `usergroups:read`. Обоснование каждой области доступа и дополнительные параметры, например дополнительные команды с косой чертой, см. в разделе [Контрольный список манифеста и областей доступа](#manifest-and-scope-checklist).
        </Note>

        После того как Slack создаст приложение:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: добавьте `connections:write`, сохраните и скопируйте токен уровня приложения.
        - **Install App -> Install to Workspace**: скопируйте OAuth-токен пользователя-бота.

      </Step>

      <Step title="Настройка OpenClaw">

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

        Резервный вариант с переменными окружения (только для аккаунта по умолчанию):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Запуск Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL-адреса HTTP-запросов">
    <Steps>
      <Step title="Создание нового приложения Slack">
        Откройте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → выберите рабочее пространство → вставьте один из приведённых ниже манифестов → замените `https://gateway-host.example.com/slack/events` общедоступным URL-адресом Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Коннектор Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw связывает обсуждения помощника Slack с агентами OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "Чем вы можете мне помочь?" },
        {
          "title": "Подвести итог по этому каналу",
          "message": "Подведите итог недавней активности в этом канале."
        },
        { "title": "Подготовить ответ", "message": "Помогите мне подготовить ответ." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Отправить сообщение в OpenClaw",
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
    "description": "Коннектор Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw подключает потоки ассистента Slack к агентам OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "С чем вы можете мне помочь?" },
        {
          "title": "Подвести итоги канала",
          "message": "Подведите итоги недавней активности в этом канале."
        },
        { "title": "Подготовить ответ", "message": "Помогите мне подготовить ответ." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Отправить сообщение в OpenClaw",
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
          Вариант **Рекомендуемый** соответствует полному набору возможностей плагина Slack; вариант **Минимальный** исключает файлы, реакции, закрепления, групповые личные сообщения (`mpim:*`), `emoji:read` и `usergroups:read` для рабочих пространств со строгими ограничениями. Обоснование каждой области доступа см. в разделе [Контрольный список манифеста и областей доступа](#manifest-and-scope-checklist).
        </Note>

        <Info>
          Все три поля URL (`slash_commands[].url`, `event_subscriptions.request_url` и `interactivity.request_url` / `message_menu_options_url`) указывают на одну и ту же конечную точку OpenClaw. Схема манифеста Slack требует указывать их отдельно, но OpenClaw маршрутизирует запросы по типу полезной нагрузки, поэтому достаточно одного `webhookPath` (по умолчанию `/slack/events`). В режиме HTTP команды с косой чертой без `slash_commands[].url` незаметно не выполняют никаких действий.
        </Info>

        После создания приложения в Slack:

        - **Basic Information → App Credentials**: скопируйте **Signing Secret** для проверки запросов.
        - **Install App -> Install to Workspace**: скопируйте Bot User OAuth Token.

      </Step>

      <Step title="Настройте OpenClaw">

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
        Используйте уникальные пути Webhook для нескольких учётных записей в режиме HTTP

        Назначьте каждой учётной записи отдельный `webhookPath` (по умолчанию `/slack/events`), чтобы регистрации не конфликтовали.
        </Note>

      </Step>

      <Step title="Запустите Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Настройка транспорта Socket Mode

По умолчанию OpenClaw устанавливает для клиента Slack SDK тайм-аут ожидания pong в 15 секунд в режиме Socket Mode. Переопределяйте настройки транспорта только при необходимости настройки для конкретного рабочего пространства или хоста:

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

Используйте это только для рабочих пространств в режиме Socket Mode, где регистрируются тайм-ауты pong/server-ping веб-сокета Slack, или для хостов с известным голоданием цикла событий. `clientPingTimeout` — время ожидания pong после отправки клиентского ping пакетом SDK; `serverPingTimeout` — время ожидания серверных ping от Slack. Сообщения и события приложения остаются состоянием приложения, а не сигналами работоспособности транспорта.

Примечания:

- `socketMode` игнорируется в режиме HTTP Request URL.
- Базовые настройки `channels.slack.socketMode` применяются ко всем учётным записям Slack, если они не переопределены. Для переопределений на уровне учётной записи используется `channels.slack.accounts.<accountId>.socketMode`; поскольку это переопределение объекта, укажите все поля настройки сокета, необходимые для этой учётной записи.
- Только `clientPingTimeout` имеет значение по умолчанию OpenClaw (`15000`). `serverPingTimeout` и `pingPongLoggingEnabled` передаются в Slack SDK только при явной настройке.
- Задержка повторного запуска Socket Mode начинается примерно с 2 секунд и ограничивается примерно 30 секундами. После устранимых сбоев запуска, ожидания запуска и отключения попытки повторяются до остановки канала. Неустранимые ошибки учётной записи и учётных данных, такие как недействительная аутентификация, отозванные токены или отсутствующие области доступа, приводят к немедленному завершению вместо бесконечных повторных попыток.

## Контрольный список манифеста и областей доступа

Базовый манифест приложения Slack одинаков для Socket Mode и HTTP Request URLs. Отличаются только блок `settings` (и `url` команды с косой чертой).

Базовый манифест (Socket Mode по умолчанию):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Коннектор Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw подключает потоки ассистента Slack к агентам OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "С чем вы можете мне помочь?" },
        {
          "title": "Подвести итоги канала",
          "message": "Подведите итоги недавней активности в этом канале."
        },
        { "title": "Подготовить ответ", "message": "Помогите мне подготовить ответ." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Отправить сообщение в OpenClaw",
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

Для **режима HTTP Request URLs** замените `settings` вариантом HTTP и добавьте `url` в каждую команду с косой чертой. Требуется общедоступный URL:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Отправить сообщение в OpenClaw",
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

Включите дополнительные возможности, расширяющие указанные выше значения по умолчанию.

Манифест по умолчанию включает вкладку **Home** раздела Slack App Home и подписывается на `app_home_opened`. Когда участник рабочего пространства открывает вкладку Home, OpenClaw публикует безопасное представление Home по умолчанию с `views.publish`; полезная нагрузка беседы и конфиденциальная конфигурация в него не включаются. Когда включён режим одной команды с косой чертой, в подсказке команды используется `channels.slack.slashCommand.name`; в установках с нативными командами или без команд с косой чертой эта подсказка отсутствует. Вкладка **Messages** остаётся включённой для личных сообщений Slack. Манифест также включает потоки ассистента Slack с помощью `features.assistant_view`, `assistant:write`, `assistant_thread_started` и `assistant_thread_context_changed`; потоки ассистента направляются в отдельные сеансы потоков OpenClaw и сохраняют предоставленный Slack контекст потока доступным для агента.

<AccordionGroup>
  <Accordion title="Необязательные нативные команды с косой чертой">

    Вместо одной настроенной команды можно использовать несколько [нативных команд с косой чертой](#commands-and-slash-behavior), учитывая следующие особенности:

    - Используйте `/agentstatus` вместо `/status`, поскольку команда `/status` зарезервирована.
    - В одном приложении Slack одновременно можно зарегистрировать не более 25 команд с косой чертой (ограничение платформы Slack).

    Замените существующий раздел `features.slash_commands` подмножеством [доступных команд](/ru/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (по умолчанию)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Начать новый сеанс",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Сбросить текущий сеанс"
    },
    {
      "command": "/compact",
      "description": "Сжать контекст сеанса",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Остановить текущий запуск"
    },
    {
      "command": "/session",
      "description": "Управлять сроком действия привязки к ветке",
      "usage_hint": "бездействие <duration|off> или максимальный возраст <duration|off>"
    },
    {
      "command": "/think",
      "description": "Задать уровень обдумывания",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Переключить подробный вывод",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Показать или задать быстрый режим",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Переключить видимость рассуждений",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Переключить режим повышенных привилегий",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Показать или задать параметры exec по умолчанию",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Одобрить или отклонить ожидающие запросы на подтверждение",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Показать или задать модель",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Вывести список провайдеров и моделей",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Показать краткую справку"
    },
    {
      "command": "/commands",
      "description": "Показать сформированный каталог команд"
    },
    {
      "command": "/tools",
      "description": "Показать, что текущий агент может использовать прямо сейчас",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Показать состояние среды выполнения, включая использование и квоту провайдера, если они доступны"
    },
    {
      "command": "/tasks",
      "description": "Вывести активные и недавние фоновые задачи текущего сеанса"
    },
    {
      "command": "/context",
      "description": "Объяснить, как формируется контекст",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Показать идентификационные данные отправителя"
    },
    {
      "command": "/skill",
      "description": "Запустить навык по имени",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Задать дополнительный вопрос, не изменяя контекст сеанса",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Задать дополнительный вопрос, не изменяя контекст сеанса",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Настроить нижний колонтитул использования или показать сводку расходов",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL-адреса HTTP-запросов">
        Используйте тот же список `slash_commands`, что и для режима Socket Mode выше, и добавьте `"url": "https://gateway-host.example.com/slack/events"` в каждую запись. Пример:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Начать новый сеанс",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Показать краткую справку",
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
    Добавьте область бота `chat:write.customize`, если хотите, чтобы исходящие сообщения использовали идентичность активного агента (пользовательское имя и значок), а не идентичность приложения Slack по умолчанию.

    Если вы используете значок эмодзи, Slack ожидает синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необязательные области пользовательского токена (операции чтения)">
    Если вы настроили `channels.slack.userToken`, типичные области чтения:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (если вы используете чтение через поиск Slack)

  </Accordion>
</AccordionGroup>

## Модель токенов

- `botToken` + `appToken` необходимы для Socket Mode.
- Для режима HTTP необходимы `botToken` + `signingSecret`.
- Для режима ретрансляции необходим `botToken`, а также `relay.url`, `relay.authToken` и `relay.gatewayId`; токен приложения и секрет подписи не используются.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` и `userToken` принимают строки с открытым текстом
  или объекты SecretRef.
- Токены в конфигурации имеют приоритет над резервными значениями из переменных среды.
- Резервные значения переменных среды `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` и `SLACK_USER_TOKEN` применяются только к учётной записи по умолчанию.
- `userToken` по умолчанию работает только для чтения (`userTokenReadOnly: true`).

Поведение снимка состояния:

- Проверка учётной записи Slack отслеживает для каждого набора учётных данных поля `*Source` и `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Состояние может быть `available`, `configured_unavailable` или `missing`.
- `configured_unavailable` означает, что учётная запись настроена через SecretRef
  или другой источник секрета, не встроенный в конфигурацию, но текущему пути команды или среды выполнения
  не удалось получить фактическое значение.
- В режиме HTTP включается `signingSecretStatus`; в Socket Mode
  обязательной парой является `botTokenStatus` + `appTokenStatus`.

<Tip>
Для действий и чтения каталога при наличии настройки может отдаваться предпочтение пользовательскому токену. Для записи предпочтительным остаётся токен бота; запись с пользовательским токеном разрешена только при `userTokenReadOnly: false` и отсутствии токена бота.
</Tip>

## Действия и ограничения

Действия Slack управляются параметром `channels.slack.actions.*`.

Доступные группы действий в текущем инструментарии Slack:

| Группа     | По умолчанию |
| ---------- | ------------ |
| messages   | включено     |
| reactions  | включено     |
| pins       | включено     |
| memberInfo | включено     |
| emojiList  | включено     |

Текущие действия с сообщениями Slack включают `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` и `emoji-list`. `download-file` принимает идентификаторы файлов Slack, показанные во входящих заполнителях файлов, и возвращает предварительный просмотр изображений либо локальные метаданные для файлов других типов.

## Управление доступом и маршрутизация

<Tabs>
  <Tab title="Политика личных сообщений">
    `channels.slack.dmPolicy` управляет доступом к личным сообщениям. `channels.slack.allowFrom` — канонический список разрешений для личных сообщений.

    - `pairing` (по умолчанию)
    - `allowlist`
    - `open` (требует, чтобы `channels.slack.allowFrom` включал `"*"`)
    - `disabled`

    Флаги личных сообщений:

    - `dm.enabled` (по умолчанию true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (устаревший)
    - `dm.groupEnabled` (для групповых личных сообщений по умолчанию false)
    - `dm.groupChannels` (необязательный список разрешений MPIM)

    Приоритет при нескольких учётных записях:

    - `channels.slack.accounts.default.allowFrom` применяется только к учётной записи `default`.
    - Именованные учётные записи наследуют `channels.slack.allowFrom`, если их собственный `allowFrom` не задан.
    - Именованные учётные записи не наследуют `channels.slack.accounts.default.allowFrom`.

    Устаревшие `channels.slack.dm.policy` и `channels.slack.dm.allowFrom` по-прежнему считываются для совместимости. `openclaw doctor --fix` переносит их в `dmPolicy` и `allowFrom`, когда это можно сделать без изменения доступа.

    Сопряжение в личных сообщениях использует `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Политика каналов">
    `channels.slack.groupPolicy` управляет обработкой каналов:

    - `open`
    - `allowlist`
    - `disabled`

    Список разрешённых каналов находится в `channels.slack.channels` и **должен использовать стабильные идентификаторы каналов Slack** (например, `C12345678`) в качестве ключей конфигурации.

    Примечание о среде выполнения: если `channels.slack` полностью отсутствует (настройка только через переменные среды), среда выполнения возвращается к `groupPolicy="allowlist"` и записывает предупреждение в журнал (даже если задан `channels.defaults.groupPolicy`).

    Разрешение имён и идентификаторов:

    - записи списка разрешённых каналов и списка разрешений для личных сообщений разрешаются при запуске, если это допускает доступ по токену
    - неразрешённые записи с именами каналов сохраняются в настроенном виде, но по умолчанию игнорируются при маршрутизации
    - авторизация входящих сообщений и маршрутизация каналов по умолчанию выполняются прежде всего по идентификатору; прямое сопоставление имени пользователя или короткого имени требует `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключи на основе имён (`#channel-name` или `channel-name`) **не** сопоставляются при `groupPolicy: "allowlist"`. По умолчанию поиск канала выполняется прежде всего по идентификатору, поэтому ключ на основе имени никогда не обеспечит успешную маршрутизацию, а все сообщения в этом канале будут без уведомления заблокированы. Это отличается от `groupPolicy: "open"`, где ключ канала не требуется для маршрутизации и ключ на основе имени кажется рабочим.

    Всегда используйте идентификатор канала Slack в качестве ключа. Чтобы найти его: щёлкните канал в Slack правой кнопкой мыши → **Copy link** — идентификатор (`C...`) указан в конце URL-адреса.

    Правильно:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    Неправильно (без уведомления блокируется при `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Упоминания и пользователи каналов">
    Сообщения каналов по умолчанию требуют упоминания.

    Источники упоминаний:

    - явное упоминание приложения (`<@botId>`)
    - упоминание пользовательской группы Slack (`<!subteam^S...>`), когда пользователь-бот состоит в этой пользовательской группе; требуется `usergroups:read`
    - регулярные выражения упоминаний (`agents.list[].groupChat.mentionPatterns`, резервный вариант `messages.groupChat.mentionPatterns`)
    - неявное поведение ответа в ветке боту (отключено, когда `thread.requireExplicitMention` имеет значение `true`)

    Настройки для отдельных каналов (`channels.slack.channels.<id>`; имена поддерживаются только через разрешение при запуске или `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; переопределяет режим ответа для учётной записи или типа чата в этом канале)
    - `users` (список разрешений)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` или подстановочный знак `"*"`
      (устаревшие ключи без префикса по-прежнему сопоставляются только с `id:`)

    `ignoreOtherMentions` (по умолчанию `false`) отбрасывает сообщения канала, в которых упоминается другой пользователь или группа пользователей, но не этот бот. Личные сообщения и групповые личные сообщения (MPIM) не затрагиваются. Для фильтра требуется разрешённый идентификатор пользователя-бота из `auth.test`; если эта идентификационная информация недоступна (например, при идентификации только по пользовательскому токену), проверка пропускает сообщения без изменений.

    `allowBots` применяет консервативный подход к каналам и закрытым каналам: сообщения в комнате, отправленные ботом, принимаются только в том случае, если отправляющий бот явно указан в списке разрешённых `users` этой комнаты либо если хотя бы один явно заданный идентификатор владельца Slack из `channels.slack.allowFrom` в данный момент принадлежит участнику комнаты. Подстановочные знаки и записи владельцев по отображаемому имени не подтверждают присутствие владельца. Для проверки присутствия владельца используется Slack `conversations.members`; убедитесь, что у приложения есть соответствующая область доступа на чтение для данного типа комнаты (`channels:read` для общедоступных каналов, `groups:read` для закрытых каналов). Если получить список участников не удаётся, OpenClaw отбрасывает отправленное ботом сообщение комнаты.

    Для принятых сообщений Slack, отправленных ботом, используется общая [защита от зацикливания ботов](/ru/channels/bot-loop-protection). Настройте `channels.defaults.botLoopProtection` для бюджета по умолчанию, а затем переопределите его с помощью `channels.slack.botLoopProtection` или `channels.slack.channels.<id>.botLoopProtection`, если для рабочего пространства или канала требуется другой лимит.

  </Tab>
</Tabs>

## Ветки обсуждений, сеансы и теги ответов

- Личные сообщения маршрутизируются как `direct`; каналы — как `channel`; MPIM — как `group`.
- Привязки маршрутов Slack принимают необработанные идентификаторы адресатов, а также формы целей Slack, такие как `channel:C12345678`, `user:U12345678` и `<@U12345678>`.
- При значении `session.dmScope=main` по умолчанию личные сообщения Slack объединяются с основным сеансом агента.
- Сеансы каналов: `agent:<agentId>:slack:channel:<channelId>`.
- Обычные сообщения верхнего уровня в канале остаются в сеансе соответствующего канала, даже если `replyToMode` имеет значение, отличное от `off`.
- В ответах в ветках Slack родительский Slack `thread_ts` используется для суффиксов сеансов (`:thread:<threadTs>`), даже если создание веток для исходящих ответов отключено с помощью `replyToMode="off"`.
- OpenClaw добавляет подходящее корневое сообщение верхнего уровня канала в `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, когда ожидается, что оно начнёт видимую ветку Slack, благодаря чему корневое сообщение и последующие ответы в ветке используют один сеанс OpenClaw. Это относится к событиям `app_mention`, явным упоминаниям бота или совпадениям с настроенными шаблонами упоминаний, а также к каналам `requireMention: false`, в которых `replyToMode` имеет значение, отличное от `off`.
- Значение `channels.slack.thread.historyScope` по умолчанию — `thread`; значение `thread.inheritParent` по умолчанию — `false`.
- `channels.slack.thread.initialHistoryLimit` определяет, сколько существующих сообщений ветки загружается при запуске нового сеанса ветки (по умолчанию `20`; задайте `0`, чтобы отключить).
- `channels.slack.thread.requireExplicitMention` (по умолчанию `false`): при значении `true` подавляет неявные упоминания в ветках, чтобы бот отвечал только на явные упоминания `@bot` внутри веток, даже если бот уже участвовал в ветке. Без этого ответы в ветке с участием бота обходят проверку `requireMention`.

Настройки создания веток для ответов:

- `channels.slack.channels.<id>.replyToMode`: переопределение для отдельного канала, применяемое к сообщениям общедоступных и закрытых каналов Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (по умолчанию `off`)
- `channels.slack.replyToModeByChatType`: для каждого `direct|group|channel`
- устаревший резервный вариант для личных чатов: `channels.slack.dm.replyToMode`

Поддерживаются ручные теги ответов:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Для явных ответов в ветке Slack из инструмента `message` задайте `replyBroadcast: true` вместе с `action: "send"` и `threadId` или `replyTo`, чтобы указать Slack также опубликовать ответ из ветки в родительском канале. Это соответствует флагу `reply_broadcast` Slack `chat.postMessage` и поддерживается только для отправки текста или Block Kit, но не для загрузки медиафайлов.

Когда вызов инструмента `message` выполняется внутри ветки Slack и нацелен на тот же канал, OpenClaw обычно наследует текущую ветку Slack в соответствии с действующим значением `replyToMode` для учётной записи, типа чата или отдельного канала. Автоматические ответы и вызовы `send` или `upload-file` в том же канале используют то же переопределение для отдельного канала. Задайте `topLevel: true` в `action: "send"` или `action: "upload-file"`, чтобы принудительно создать новое сообщение в родительском канале. `threadId: null` также принимается как эквивалентный отказ от ветки на верхнем уровне.

<Note>
`replyToMode="off"` отключает создание веток для исходящих ответов Slack, включая явные теги `[[reply_to_*]]`. При этом входящие сеансы веток Slack не объединяются: сообщения, уже опубликованные внутри ветки Slack, по-прежнему маршрутизируются в сеанс `:thread:<threadTs>`. Это отличается от Telegram, где явные теги по-прежнему учитываются в режиме `"off"`. Ветки Slack скрывают сообщения из канала, тогда как ответы Telegram остаются видимыми в общей ленте.
</Note>

## Реакции-подтверждения

`ackReaction` отправляет эмодзи-подтверждение, пока OpenClaw обрабатывает входящее сообщение. `ackReactionScope` определяет, _когда_ этот эмодзи фактически отправляется.

По умолчанию подтверждение остаётся неизменным, пока собственный статус ветки ассистента Slack показывает ход выполнения с чередующимися сообщениями о загрузке. Задайте `messages.statusReactions.enabled: true`, чтобы включить жизненный цикл реакций «в очереди/обдумывание/инструмент/готово/ошибка».

### Эмодзи (`ackReaction`)

Порядок разрешения:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервный эмодзи идентичности агента (`agents.list[].identity.emoji`, иначе `"eyes"` / 👀)

Примечания:

- Slack ожидает короткие коды (например, `"eyes"`).
- Используйте `""`, чтобы отключить реакцию для учётной записи Slack или глобально.

### Область действия (`messages.ackReactionScope`)

Провайдер Slack считывает область действия из `messages.ackReactionScope` (по умолчанию `"group-mentions"`). В настоящее время переопределение на уровне учётной записи или канала Slack отсутствует; значение применяется глобально ко всему Gateway.

Значения:

- `"all"`: реагировать в личных сообщениях и группах, включая фоновые события комнат.
- `"direct"`: реагировать только в личных сообщениях.
- `"group-all"`: реагировать на каждое групповое сообщение, кроме фоновых событий комнат (без личных сообщений).
- `"group-mentions"` (по умолчанию): реагировать в группах, но только при упоминании бота (или в групповых объектах для упоминания, где это включено). **Личные сообщения исключены.**
- `"off"` / `"none"`: никогда не реагировать.

<Note>
Область действия по умолчанию (`"group-mentions"`) не отправляет реакции-подтверждения в личных сообщениях или при фоновых событиях комнат. Чтобы видеть настроенный `ackReaction` (например, `"eyes"`) во входящих личных сообщениях Slack и при событиях в неактивных комнатах, задайте для `messages.ackReactionScope` значение `"all"`. `messages.ackReactionScope` считывается при запуске провайдера Slack, поэтому для применения изменения требуется перезапуск Gateway.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // реагировать в личных сообщениях и группах
  },
}
```

## Потоковая передача текста

`channels.slack.streaming` управляет поведением предварительного просмотра в реальном времени:

- `off`: отключить потоковую передачу предварительного просмотра в реальном времени.
- `partial` (по умолчанию): заменять текст предварительного просмотра последним частичным результатом.
- `block`: добавлять порционные обновления предварительного просмотра.
- `progress`: показывать текст состояния выполнения во время генерации, а затем отправлять окончательный текст.
- `streaming.preview.toolProgress`: когда активен черновой предварительный просмотр, направлять обновления инструментов и хода выполнения в то же редактируемое сообщение предварительного просмотра (по умолчанию: `true`). Задайте `false`, чтобы сохранять отдельные сообщения инструментов и хода выполнения.
- `streaming.preview.commandText` / `streaming.progress.commandText`: задайте `status`, чтобы сохранять компактные строки хода выполнения инструментов, скрывая необработанный текст команд и их выполнения (по умолчанию: `raw`).

Скрытие необработанного текста команд и их выполнения с сохранением компактных строк хода выполнения:

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

`channels.slack.streaming.nativeTransport` управляет встроенной потоковой передачей текста Slack, когда `channels.slack.streaming.mode` имеет значение `partial` (по умолчанию: `true`).

Встроенные карточки задач Slack для отображения хода выполнения включаются отдельно в режиме хода выполнения. Задайте для `channels.slack.streaming.progress.nativeTaskCards` значение `true` вместе с `channels.slack.streaming.mode="progress"`, чтобы во время работы отправлять встроенную карточку плана или задачи Slack, а по завершении обновлять ту же карточку задачи. Без этого флага режим хода выполнения сохраняет переносимое поведение чернового предварительного просмотра.

- Для отображения встроенной потоковой передачи текста и статуса ветки ассистента Slack должна быть доступна ветка ответов. Выбор ветки по-прежнему определяется `replyToMode`.
- Корневые сообщения каналов, групповых чатов и личных сообщений верхнего уровня по-прежнему могут использовать обычный черновой предварительный просмотр, когда встроенная потоковая передача недоступна или ветка ответов отсутствует.
- Личные сообщения Slack верхнего уровня по умолчанию остаются вне веток, поэтому в них не отображается встроенный потоковый предварительный просмотр или предварительный просмотр состояния в стиле веток Slack; вместо этого OpenClaw публикует и редактирует черновой предварительный просмотр в личном сообщении.
- Медиафайлы и нетекстовые полезные нагрузки доставляются обычным способом.
- Итоговые сообщения с медиафайлами или ошибками отменяют ожидающие изменения предварительного просмотра; подходящие итоговые текстовые сообщения или блоки отправляются только тогда, когда могут изменить предварительный просмотр на месте.
- Если потоковая передача прерывается во время ответа, OpenClaw доставляет оставшиеся полезные нагрузки обычным способом.

Использование чернового предварительного просмотра вместо встроенной потоковой передачи текста Slack:

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

Включение встроенных карточек задач Slack для отображения хода выполнения:

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

- `channels.slack.streamMode` (`replace | status_final | append`) — устаревший псевдоним для `channels.slack.streaming.mode`.
- логический параметр `channels.slack.streaming` — устаревший псевдоним для `channels.slack.streaming.mode` и `channels.slack.streaming.nativeTransport`.
- параметры верхнего уровня `channels.slack.chunkMode` и `channels.slack.nativeStreaming` — устаревшие псевдонимы для `channels.slack.streaming.chunkMode` и `channels.slack.streaming.nativeTransport`.
- Устаревшие псевдонимы не считываются во время выполнения; запустите `openclaw doctor --fix`, чтобы преобразовать сохранённую конфигурацию потоковой передачи Slack в канонические ключи.

## Резервная реакция при наборе текста

`typingReaction` добавляет временную реакцию к входящему сообщению Slack, пока OpenClaw обрабатывает ответ, а затем удаляет её после завершения выполнения. Это особенно полезно вне веток ответов, где используется стандартный индикатор состояния "is typing...".

Порядок разрешения:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примечания:

- Slack ожидает короткие коды (например, `"hourglass_flowing_sand"`).
- Реакция отправляется по мере возможности, а её автоматическое удаление выполняется после завершения ответа или обработки ошибки.

## Голосовой ввод

Чтобы сейчас обратиться к OpenClaw голосом в Slack, отправьте аудиоклип Slack приложению OpenClaw. Микрофон диктовки Slackbot — это отдельная функция Slack, а не API приложения.

- **[Голосовая диктовка Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** доступна в личной переписке пользователя со Slackbot. Slack преобразует запись в запрос для Slackbot, но не передаёт сторонним приложениям Slack через Events API аудиофайл, событие диктовки, запрос или маркер источника ввода. Плагин Slack для OpenClaw не может включить или получать её.
- **[Аудиоклипы Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** — это файлы, хранящиеся в Slack, которые можно публиковать в личной переписке OpenClaw, канале или ветке. OpenClaw загружает доступный клип с помощью токена бота, нормализует MIME-метаданные клипа Slack и передаёт его в общий [конвейер транскрибирования аудио](/ru/nodes/audio). Рекомендуемый манифест приложения включает необходимую область доступа `files:read`.

У аудиоклипов и диктовки Slackbot разные правила конфиденциальности: на клипы распространяется политика хранения файлов Slack, и OpenClaw загружает их для транскрибирования, тогда как, согласно Slack, аудио диктовки не сохраняется.

В канале с `requireMention: true` аудиоклип без подписи может пройти проверку, если в нём произнесён настроенный шаблон упоминания (`agents.list[].groupChat.mentionPatterns`, с резервным переходом к `messages.groupChat.mentionPatterns`). OpenClaw авторизует отправителя до загрузки или транскрибирования клипа, а затем допускает его, только если транскрипция соответствует шаблону. Неудачная или не соответствующая шаблону предварительная транскрипция удаляется вместе с загруженным клипом; она не сохраняется в истории канала. Нативную идентичность Slack `@bot` невозможно определить по речи, поэтому настройте шаблон произносимого имени или добавьте текстовое упоминание. Если включено дублирование транскрипции, оно отправляется только после допуска.

## Медиафайлы, разбиение на части и доставка

<AccordionGroup>
  <Accordion title="Входящие вложения">
    Вложения Slack загружаются с приватных URL-адресов, размещённых в Slack (поток запросов с аутентификацией по токену), и записываются в хранилище медиафайлов, если загрузка успешна и соблюдены ограничения размера. Заполнители файлов содержат Slack `fileId`, чтобы агенты могли получить исходный файл с помощью `download-file`.

    Для загрузок действуют ограниченные тайм-ауты простоя и общего времени. Если получение файла из Slack зависает или завершается ошибкой, OpenClaw продолжает обработку сообщения и использует заполнитель файла.

    По умолчанию ограничение размера входящих данных во время выполнения составляет `20MB`, если оно не переопределено параметром `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Исходящий текст и файлы">
    - для текстовых частей используется `channels.slack.textChunkLimit` (по умолчанию `8000`, но не более собственного ограничения Slack на длину сообщения)
    - `channels.slack.streaming.chunkMode="newline"` включает разбиение прежде всего по абзацам
    - файлы отправляются через API загрузки Slack и могут включать ответы в ветках (`thread_ts`)
    - для длинных подписей к файлам первая допустимая для Slack текстовая часть используется как комментарий к загрузке, а остальные части отправляются последующими сообщениями
    - ограничение размера исходящих медиафайлов определяется параметром `channels.slack.mediaMaxMb`, если он настроен; в противном случае при отправке в каналы используются значения по умолчанию для типа MIME из конвейера обработки медиафайлов

  </Accordion>

  <Accordion title="Цели доставки">
    Предпочтительные явные цели:

    - `user:<id>` для личных сообщений
    - `channel:<id>` для каналов

    Личные сообщения Slack, содержащие только текст или блоки, можно отправлять непосредственно по идентификаторам пользователей; для загрузки файлов и отправки в ветки сначала открывается личная переписка через API бесед Slack, поскольку для этих путей требуется конкретный идентификатор беседы.

  </Accordion>
</AccordionGroup>

## Команды и поведение команд с косой чертой

Команды с косой чертой отображаются в Slack либо как одна настроенная команда, либо как несколько нативных команд. Настройте `channels.slack.slashCommand`, чтобы изменить параметры команд по умолчанию:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Для нативных команд требуются [дополнительные параметры манифеста](#additional-manifest-settings) в вашем приложении Slack; в глобальных конфигурациях они включаются с помощью `channels.slack.commands.native: true` или `commands.native: true`.

- Автоматический режим нативных команд для Slack **отключён**, поэтому `commands.native: "auto"` не включает нативные команды Slack.

```txt
/help
```

Меню аргументов нативных команд отображаются одним из следующих способов в порядке приоритета:

- 3–5 достаточно коротких вариантов: меню переполнения ("...")
- более 100 вариантов при наличии асинхронной фильтрации: внешний список выбора
- 1–2 варианта либо любой вариант, закодированное значение которого слишком длинное для списка выбора: блоки кнопок
- в остальных случаях (6–100 вариантов либо более 100 без асинхронной фильтрации): статическое меню выбора, разбитое по 100 вариантов на меню

```txt
/think
```

Сеансы команд с косой чертой используют изолированные ключи вида `agent:<agentId>:slack:slash:<userId>` и по-прежнему направляют выполнение команд в сеанс целевой беседы с помощью `CommandTargetSessionKey`.

## Нативные диаграммы

Публичный блок Block Kit [`data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
в Slack отображает в сообщениях линейные, столбчатые, площадные и круговые диаграммы. OpenClaw преобразует переносимый
блок `presentation` `chart` в эту нативную структуру; помимо обычного
доступа к сообщениям `chat:write`, дополнительные области доступа OAuth,
загрузка файлов, средство визуализации изображений или настройка Slack не требуются.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Квартальная выручка",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Выручка", "values": [120, 145] }],
      "xLabel": "Квартал"
    }
  ]
}
```

Ограничения Slack применяются до нативной визуализации:

- заголовок и необязательные подписи осей: 50 символов
- круговая диаграмма: 1–12 положительных сегментов
- линейная/столбчатая/площадная диаграмма: 1–12 рядов с уникальными именами и 1–20 общих категорий
- подписи сегментов, категорий и рядов: 20 символов
- каждый ряд должен содержать по одному конечному значению для каждой категории; значения
  некруговых диаграмм могут быть отрицательными

Каждая нативная диаграмма также содержит текстовое представление верхнего уровня для программ
чтения с экрана, уведомлений, зеркалирования сеансов и клиентов, которые не могут отобразить
блок. При стандартной отправке представления в другие каналы OpenClaw те же
детерминированные данные диаграммы передаются в текстовом виде, если канал не заявляет о поддержке нативных диаграмм. Если
во время поэтапного развёртывания Slack отклоняет диаграмму с ошибкой `invalid_blocks`, OpenClaw
удаляет отклонённые нативные блоки данных, сохраняет соседние элементы управления и отправляет
полное представление диаграммы в виде видимого текста.

В настоящее время Slack принимает до двух блоков `data_visualization` в одном сообщении. Если
представление содержит более двух допустимых диаграмм, OpenClaw сохраняет их порядок
и продолжает нативную визуализацию в последующих сообщениях, размещая не более двух
диаграмм в каждом сообщении.

В [объявлении для разработчиков](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
Slack описывает блок как функцию Block Kit для приложений и не указывает ограничений
по платным тарифам. Условия доступности для Business+/Enterprise относятся к
автоматическому созданию диаграмм с помощью ИИ в Slackbot, а не к отправке приложением
уже структурированной диаграммы Block Kit. Диаграммы являются блоками только для сообщений, а не содержимым App
Home, модальных окон или Canvas.

## Нативные таблицы

Текущий блок Block Kit [`data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
в Slack отображает в сообщениях структурированные строки и столбцы. OpenClaw преобразует явный
переносимый блок `presentation` `table` в `data_table`; устаревший
[блок `table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) Slack не используется.
Помимо обычного доступа к сообщениям `chat:write`, дополнительные области доступа OAuth
или настройка Slack не требуются.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Открытая воронка",
      "headers": ["Клиент", "Этап", "ARR"],
      "rows": [
        ["Acme", "Выиграно", 125000],
        ["Globex", "Проверка", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw преобразует заголовки и строковые ячейки в ячейки Slack `raw_text`. Числовые ячейки
преобразуются в `raw_number`, при этом конечное числовое значение сохраняется для нативной сортировки
и фильтрации. `rowHeaderColumnIndex`, если задано, помечает этот столбец с отсчётом от нуля
как столбец заголовков строк Slack.

Опубликованные ограничения Slack для `data_table` применяются до нативной визуализации:

- 1–20 столбцов
- 1–100 строк данных плюс строка заголовков
- одинаковое количество ячеек в каждой строке
- не более 10 000 символов суммарно во всех ячейках таблиц одного сообщения

Несколько допустимых блоков таблиц могут отображаться нативно, пока сообщение
не превышает суммарное ограничение по количеству символов. Таблица, которую невозможно отобразить
в пределах нативных ограничений, преобразуется в полный детерминированный текст без потери строк или
ячеек. Если этот текст превышает размер одного сообщения Slack, при отправке и в ответах на команды с косой чертой
используются упорядоченные текстовые части. Редактирование таблицы завершается явной ошибкой размера вместо
незаметного усечения строк существующего сообщения.

Каждая нативная таблица, созданная из переносимого представления, также содержит текстовое представление
верхнего уровня для программ чтения с экрана, уведомлений, зеркалирования сеансов и
клиентов, которые не могут отобразить блок. Необработанные значения диаграмм и таблиц остаются
буквальными в резервном представлении, поэтому данные ячеек, такие как `<@U123>`, не превращаются в упоминание Slack.
Если Slack отклоняет нативные блоки диаграмм или таблиц с ошибкой `invalid_blocks`, OpenClaw
удаляет все нативные блоки данных за один ограниченный шаг восстановления, сохраняет допустимые
соседние блоки, такие как кнопки и списки выбора, и отправляет полный видимый текст диаграмм
и таблиц с отключённым форматированием Slack. Доставка команд с косой чертой
учитывает бюджет Slack в пять вызовов `response_url` на протяжении выполнения команды. Перед каждым
пакетом ответов выбирается полный план, укладывающийся в оставшееся число вызовов, либо операция завершается ошибкой
до публикации этого пакета.

В нативные таблицы преобразуются только явные блоки таблиц `presentation`.
Таблицы Markdown с вертикальными чертами остаются авторским текстом; OpenClaw не пытается определить
структуру таблицы или типы ячеек. Существующие доверенные производители нативных блоков Slack могут продолжать
передавать необработанные блоки через `channelData.slack.blocks`; OpenClaw формирует резервный
текст из допустимых необработанных ячеек `data_table`, а некорректные пользовательские блоки могут
быть сведены к их подписи или общему резервному представлению Block Kit. Переносимый вывод агентов, CLI
и плагинов должен использовать `presentation`.

## Интерактивные ответы

Slack может отображать созданные агентом интерактивные элементы управления ответами, но по умолчанию эта функция отключена.
Для нового вывода агентов, CLI и плагинов предпочтительно использовать общие
кнопки или блоки выбора `presentation`. Они используют тот же путь взаимодействия
Slack и при этом могут упрощённо отображаться в других каналах.

Включение глобально:

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

Либо включение только для одной учётной записи Slack:

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

Когда функция включена, агенты по-прежнему могут выдавать устаревшие директивы ответов, предназначенные только для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Эти директивы компилируются в Slack Block Kit и направляют нажатия или выбор
обратно по существующему пути событий взаимодействия Slack. Сохраняйте их для старых
запросов и специальных обходных путей Slack; для новых
переносимых элементов управления используйте общее представление.

API компилятора директив также устарели для нового кода-производителя:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Для новых элементов управления, отображаемых в Slack, используйте полезные нагрузки `presentation` и `buildSlackPresentationBlocks(...)`.

Примечания:

- Это устаревший интерфейс, специфичный для Slack. Другие каналы не преобразуют директивы Slack Block
  Kit в собственные системы кнопок.
- Значения интерактивных обратных вызовов — это сгенерированные OpenClaw непрозрачные токены, а не необработанные значения, созданные агентом.
- Если сгенерированные интерактивные блоки превысят ограничения Slack Block Kit, OpenClaw вместо отправки недопустимой полезной нагрузки блоков вернётся к исходному текстовому ответу.

### Отправка модальных форм, обрабатываемая плагином

Плагины Slack, регистрирующие обработчик интерактивных действий, также могут получать события жизненного цикла модальных форм
`view_submission` и `view_closed` до того, как OpenClaw уплотнит
полезную нагрузку для системного события, видимого агенту. При открытии модального окна Slack используйте один из следующих
вариантов маршрутизации:

- Задайте для `callback_id` значение `openclaw:<namespace>:<payload>`.
- Либо сохраните существующий `callback_id` и поместите `pluginInteractiveData:
"<namespace>:<payload>"` в `private_metadata` модального окна.

Обработчик получает `ctx.interaction.kind` как `view_submission` или
`view_closed`, нормализованный `inputs` и полный необработанный объект `stateValues` из
Slack. Для вызова обработчика плагина достаточно маршрутизации только по идентификатору обратного вызова; добавьте
существующие поля маршрутизации пользователя/сеанса `private_metadata` модального окна, если
модальное окно также должно создавать системное событие, видимое агенту. Агент получает
компактное отредактированное системное событие `Slack interaction: ...`. Если обработчик возвращает
`systemEvent.summary`, `systemEvent.reference` или `systemEvent.data`, эти
поля включаются в компактное событие, чтобы агент мог обращаться к
хранилищу плагина, не видя полную полезную нагрузку формы.

## Нативные подтверждения в Slack

Slack может выступать нативным клиентом подтверждений с интерактивными кнопками и взаимодействиями вместо перехода к веб-интерфейсу или терминалу.

- Подтверждения выполнения команд и плагинов могут отображаться как нативные запросы Slack Block Kit.
- `channels.slack.execApprovals.*` по-прежнему отвечает за включение нативного клиента подтверждений выполнения команд и настройку маршрутизации в личные сообщения/каналы.
- Личные сообщения с запросами подтверждения выполнения команд используют `channels.slack.execApprovals.approvers` или `commands.ownerAllowFrom`.
- Для подтверждений плагинов используются нативные кнопки Slack, если Slack включён как нативный клиент подтверждений для исходного сеанса либо если `approvals.plugin` ведёт к исходному сеансу Slack или целевому объекту Slack.
- Личные сообщения с запросами подтверждения плагинов используют подтверждающих плагина Slack из `channels.slack.allowFrom`, `allowFrom` именованной учётной записи или маршрут учётной записи по умолчанию.
- Авторизация подтверждающего по-прежнему обязательна: пользователи, имеющие право подтверждать только выполнение команд, не могут подтверждать запросы плагинов, если они также не назначены подтверждающими плагинов.

Здесь используется та же общая поверхность кнопок подтверждения, что и в других каналах. Когда в настройках приложения Slack включён `interactivity`, запросы подтверждения отображаются непосредственно в беседе как кнопки Block Kit.
При наличии этих кнопок они являются основным интерфейсом подтверждения; OpenClaw
должен добавлять ручную команду `/approve`, только если результат инструмента указывает, что подтверждения
в чате недоступны или ручное подтверждение является единственным вариантом.

Путь конфигурации:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необязательно; по возможности используется `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, по умолчанию: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматически включает нативные подтверждения выполнения команд, если `enabled` не задан или равен `"auto"` и удалось определить хотя бы одного
подтверждающего выполнение команд. Slack также может обрабатывать нативные подтверждения плагинов через этот путь нативного клиента,
если удалось определить подтверждающих плагина Slack и запрос соответствует фильтрам нативного клиента. Задайте
`enabled: false`, чтобы явно отключить Slack как нативный клиент подтверждений. Задайте `enabled: true`, чтобы
принудительно включать нативные подтверждения, когда удалось определить подтверждающих. Отключение подтверждений выполнения команд в Slack не отключает
нативную доставку подтверждений плагинов Slack, включённую через `approvals.plugin`; для доставки подтверждений
плагинов вместо этого используются подтверждающие плагина Slack.

Поведение по умолчанию без явной конфигурации подтверждений выполнения команд в Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явная нативная конфигурация Slack нужна только для переопределения подтверждающих, добавления фильтров или
включения доставки в исходный чат:

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

Общая пересылка `approvals.exec` настраивается отдельно. Используйте её только тогда, когда запросы подтверждения выполнения команд также необходимо
направлять в другие чаты или явно заданным внешним адресатам. Общая пересылка `approvals.plugin` также
настраивается отдельно; нативная доставка Slack подавляет этот резервный механизм, только если Slack может обработать запрос
подтверждения плагина нативно.

`/approve` в том же чате также работает в каналах Slack и личных сообщениях, где уже поддерживаются команды. Полная модель пересылки подтверждений описана в разделе [Подтверждения выполнения команд](/ru/tools/exec-approvals).

## События и рабочее поведение

- Изменения и удаления сообщений преобразуются в системные события.
- Трансляции ответов в ветке (ответы в ветке с параметром "Also send to channel") обрабатываются как обычные сообщения пользователя.
- События добавления и удаления реакций преобразуются в системные события.
- Вступление и выход участников, создание и переименование каналов, а также добавление и удаление закреплений преобразуются в системные события.
- `channel_id_changed` может переносить ключи конфигурации каналов, когда включён `configWrites`.
- Метаданные темы и назначения канала считаются недоверенным контекстом и могут быть внедрены в контекст маршрутизации.
- Начальное сообщение ветки и исходное заполнение контекста историей ветки при необходимости фильтруются настроенными списками разрешённых отправителей.
- Действия с блоками, быстрые команды и взаимодействия с модальными окнами создают структурированные системные события `Slack interaction: ...` с подробными полями полезной нагрузки:
  - действия с блоками: выбранные значения, метки, значения элементов выбора и метаданные `workflow_*`
  - глобальные быстрые команды: метаданные обратного вызова и инициатора с маршрутизацией в прямой сеанс инициатора
  - быстрые команды сообщений: контекст обратного вызова, инициатора, канала, ветки и выбранного сообщения
  - события модального окна `view_submission` и `view_closed` с маршрутизированными метаданными канала и введёнными данными формы

Определите глобальные быстрые команды или быстрые команды сообщений в конфигурации приложения Slack и используйте любой непустой идентификатор обратного вызова. OpenClaw подтверждает получение соответствующих полезных нагрузок быстрых команд, применяет ту же политику отправителей личных сообщений/каналов, что и для других взаимодействий Slack, и ставит очищенное событие в очередь для маршрутизированного сеанса агента. Идентификаторы запуска и URL-адреса ответа удаляются из контекста агента.

## Справочник по конфигурации

Основной справочник: [Справочник по конфигурации — Slack](/ru/gateway/config-channels#slack).

<Accordion title="Основные поля Slack">

- режим/аутентификация: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ к личным сообщениям: `dm.enabled`, `dmPolicy`, `allowFrom` (устаревшие: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- переключатель совместимости: `dangerouslyAllowNameMatching` (аварийный; не включайте без необходимости)
- доступ к каналам: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- ветки/история: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- разворачивание предпросмотра: `unfurlLinks` (по умолчанию: `false`), `unfurlMedia` для управления предпросмотром ссылок/медиа в `chat.postMessage`; задайте `unfurlLinks: true`, чтобы снова включить предпросмотр ссылок
- эксплуатация/возможности: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Нет ответов в каналах">
    Проверьте по порядку:

    - `groupPolicy`
    - список разрешённых каналов (`channels.slack.channels`) — **ключами должны быть идентификаторы каналов** (`C12345678`), а не названия (`#channel-name`). Ключи на основе названий молча не работают при `groupPolicy: "allowlist"`, поскольку по умолчанию маршрутизация каналов в первую очередь использует идентификаторы. Чтобы найти идентификатор: щёлкните канал в Slack правой кнопкой мыши → **Copy link** — значение `C...` в конце URL-адреса является идентификатором канала.
    - `requireMention`
    - список разрешённых `users` для каждого канала
    - `messages.groupChat.visibleReplies`: для обычных запросов групп/каналов по умолчанию используется `"automatic"`. Если вы включили `"message_tool"`, а журналы показывают текст ассистента без вызова `message(action=send)`, модель не использовала видимый путь инструмента сообщений. В этом режиме итоговый текст остаётся приватным; проверьте подробный журнал Gateway на наличие метаданных подавленной полезной нагрузки или задайте значение `"automatic"`, если хотите, чтобы каждый обычный итоговый ответ ассистента публиковался через устаревший путь.
    - `messages.groupChat.unmentionedInbound`: если задано значение `"room_event"`, неадресованные сообщения в разрешённом канале считаются фоновым контекстом и не вызывают ответа, если агент не вызовет инструмент `message`. См. [Фоновые события комнаты](/ru/channels/ambient-room-events).

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

  <Accordion title="Личные сообщения игнорируются">
    Проверьте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (или устаревший `channels.slack.dm.policy`)
    - подтверждения сопряжения / записи списка разрешённых (`dmPolicy: "open"` по-прежнему требует `channels.slack.allowFrom: ["*"]`)
    - групповые личные сообщения используют обработку MPIM; включите `channels.slack.dm.groupEnabled` и, если настроено, добавьте MPIM в `channels.slack.dm.groupChannels`
    - события личных сообщений Slack Assistant: подробные журналы с упоминанием `drop message_changed`
      обычно означают, что Slack отправил событие изменённой ветки Assistant без
      восстанавливаемого отправителя-человека в метаданных сообщения

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не подключается">
    Проверьте токены бота и приложения, а также включение Socket Mode в настройках приложения Slack.
    Токен уровня приложения должен иметь `connections:write`, а токен бота Bot User OAuth Token
    должен относиться к тому же приложению и рабочей области Slack, что и токен приложения.

    Если `openclaw channels status --probe --json` показывает `botTokenStatus` или
    `appTokenStatus: "configured_unavailable"`, учётная запись Slack
    настроена, но текущей среде выполнения не удалось разрешить значение,
    поддерживаемое SecretRef.

    Журналы вида `slack socket mode failed to start; retry ...` указывают на восстанавливаемые
    сбои запуска. При отсутствии областей доступа, отозванных токенах и недействительной аутентификации происходит немедленный отказ.
    Запись `slack token mismatch ...` в журнале означает, что токен бота и токен приложения,
    вероятно, относятся к разным приложениям Slack; исправьте учётные данные приложения Slack.

  </Accordion>

  <Accordion title="Режим HTTP не получает события">
    Проверьте:

    - секрет подписи
    - путь Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - уникальный `webhookPath` для каждой учётной записи HTTP
    - публичный URL-адрес завершает TLS и перенаправляет запросы на путь Gateway
    - путь `request_url` приложения Slack в точности соответствует `channels.slack.webhookPath` (по умолчанию `/slack/events`)

    Если `signingSecretStatus: "configured_unavailable"` присутствует в снимках
    учётной записи, учётная запись HTTP настроена, но текущей среде выполнения не удалось
    разрешить секрет подписи, поддерживаемый SecretRef.

    Повторяющаяся запись `slack: webhook path ... already registered` в журнале означает, что две учётные записи HTTP
    используют один и тот же `webhookPath`; назначьте каждой учётной записи отдельный путь.

  </Accordion>

  <Accordion title="Нативные команды/команды с косой чертой не срабатывают">
    Проверьте, какой вариант вы намеревались использовать:

    - режим нативных команд (`channels.slack.commands.native: true`) с соответствующими слеш-командами, зарегистрированными в Slack
    - или режим одной слеш-команды (`channels.slack.slashCommand.enabled: true`)

    Slack не создаёт и не удаляет слеш-команды автоматически. `commands.native: "auto"` не включает нативные команды Slack; используйте `true` и создайте соответствующие команды в приложении Slack. В режиме HTTP каждая слеш-команда Slack должна содержать URL-адрес Gateway. В Socket Mode полезные данные команд поступают через WebSocket, а Slack игнорирует `slash_commands[].url`.

    Также проверьте `commands.useAccessGroups`, авторизацию личных сообщений, списки разрешённых каналов
    и списки разрешённых `users` для каждого канала. Slack возвращает эфемерные сообщения об ошибках
    заблокированным отправителям слеш-команд, включая:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Справочник по прикреплённым медиафайлам

Slack может прикреплять загруженные медиафайлы к запросу агента, если загрузка файлов из Slack выполнена успешно и соблюдены ограничения размера. Аудиоклипы можно транскрибировать, файлы изображений можно передавать через обработку распознавания медиафайлов или непосредственно модели ответов с поддержкой компьютерного зрения, а остальные файлы остаются доступными в качестве контекста загружаемых файлов.

### Поддерживаемые типы медиафайлов

| Тип медиафайла                 | Источник             | Текущее поведение                                                                 | Примечания                                                                 |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Аудиоклипы Slack               | URL-адрес файла Slack | Загружаются и направляются в общий процесс транскрибирования аудио                | Требуются `files:read` и работающая модель или CLI `tools.media.audio` |
| Изображения JPEG / PNG / GIF / WebP | URL-адрес файла Slack | Загружаются и прикрепляются к запросу для обработки с поддержкой компьютерного зрения | Ограничение на файл: `channels.slack.mediaMaxMb` (по умолчанию 20 МБ)          |
| PDF-файлы                      | URL-адрес файла Slack | Загружаются и предоставляются как файловый контекст для таких инструментов, как `download-file` или `pdf` | Входящая обработка Slack не преобразует PDF автоматически во входные изображения для компьютерного зрения |
| Другие файлы                   | URL-адрес файла Slack | По возможности загружаются и предоставляются как файловый контекст                | Двоичные файлы не обрабатываются как входные изображения                   |
| Ответы в обсуждениях           | Файлы начального сообщения обсуждения | Файлы корневого сообщения могут загружаться как контекст, если в ответе нет собственных медиафайлов | Для начальных сообщений, содержащих только файлы, используется заполнитель вложения |
| Сообщения с несколькими файлами | Несколько файлов Slack | Каждый файл оценивается независимо                                                | Обработка Slack ограничена восемью файлами на сообщение                    |

### Процесс входящей обработки

Когда поступает сообщение Slack с прикреплёнными файлами:

1. OpenClaw загружает файл с приватного URL-адреса Slack, используя токен бота.
2. После успешной загрузки файл записывается в хранилище медиафайлов.
3. Пути загруженных медиафайлов и типы содержимого добавляются во входящий контекст.
4. Аудиоклипы направляются в общий процесс транскрибирования; пути моделей и инструментов с поддержкой изображений могут использовать вложения изображений из того же контекста.
5. Другие файлы остаются доступными в виде метаданных файлов или ссылок на медиафайлы для инструментов, способных их обрабатывать.

### Наследование вложений корневого сообщения обсуждения

Когда сообщение поступает в обсуждение (имеет родителя `thread_ts`):

- Если в самом ответе нет собственных медиафайлов, а включённое корневое сообщение содержит файлы, Slack может загрузить корневые файлы как контекст начального сообщения обсуждения.
- Корневые файлы загружаются только при создании нового сеанса обсуждения или сбросе существующего. Последующие ответы, содержащие только текст, повторно используют контекст существующего сеанса и не прикрепляют корневые файлы заново как новые медиафайлы.
- Вложения непосредственно в ответе имеют приоритет над вложениями корневого сообщения.
- Корневое сообщение, содержащее только файлы без текста, представляется заполнителем вложения, чтобы резервный вариант всё равно мог включить его файлы.

### Обработка нескольких вложений

Когда одно сообщение Slack содержит несколько прикреплённых файлов:

- Каждое вложение независимо обрабатывается в процессе обработки медиафайлов.
- Ссылки на загруженные медиафайлы объединяются в контексте сообщения.
- Порядок обработки соответствует порядку файлов Slack в полезных данных события.
- Ошибка загрузки одного вложения не блокирует остальные.

### Ограничения размера, загрузки и моделей

- **Ограничение размера**: по умолчанию 20 МБ на файл. Настраивается через `channels.slack.mediaMaxMb`.
- **Ограничение транскрибирования аудио**: `tools.media.audio.maxBytes` также применяется, когда загруженный файл отправляется поставщику транскрибирования или CLI.
- **Ошибки загрузки**: файлы, которые Slack не может предоставить, URL-адреса с истёкшим сроком действия, недоступные и слишком большие файлы, а также HTML-ответы авторизации или входа Slack пропускаются, а не обозначаются как неподдерживаемые форматы.
- **Модель компьютерного зрения**: для анализа изображений используется активная модель ответов, если она поддерживает компьютерное зрение, либо модель изображений, настроенная в `agents.defaults.imageModel`.

### Известные ограничения

| Сценарий                                     | Текущее поведение                                                                  | Обходное решение                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Истёк срок действия URL-адреса файла Slack   | Файл пропускается; ошибка не отображается                                          | Повторно загрузите файл в Slack                                                |
| Транскрибирование аудио недоступно           | Клип остаётся прикреплённым, но транскрипция не создаётся                          | Настройте `tools.media.audio` или установите поддерживаемый локальный CLI для транскрибирования |
| Клип без подписи не проходит проверку упоминания | Отбрасывается после приватного предварительного транскрибирования; транскрипция и загруженный файл удаляются | Настройте шаблон упоминания произнесённого имени, добавьте текстовое упоминание бота или используйте личное сообщение |
| Модель компьютерного зрения не настроена     | Вложения изображений сохраняются как ссылки на медиафайлы, но не анализируются как изображения | Настройте `agents.defaults.imageModel` или используйте модель ответов с поддержкой компьютерного зрения |
| Очень большие изображения (> 20 МБ по умолчанию) | Пропускаются согласно ограничению размера                                          | Увеличьте `channels.slack.mediaMaxMb`, если Slack это допускает                         |
| Пересланные или общие вложения               | Текст и размещённые в Slack изображения и файлы обрабатываются по возможности      | Повторно поделитесь ими непосредственно в обсуждении OpenClaw                  |
| Вложения PDF                                 | Сохраняются как файловый или медийный контекст и не направляются автоматически на обработку изображений | Используйте `download-file` для метаданных файла или инструмент `pdf` для анализа PDF |

### Связанная документация

- [Процесс распознавания медиафайлов](/ru/nodes/media-understanding)
- [Аудио и голосовые заметки](/ru/nodes/audio)
- [Инструмент PDF](/ru/tools/pdf)

## См. также

<CardGroup cols={2}>
  <Card title="Сопряжение" icon="link" href="/ru/channels/pairing">
    Сопрягите пользователя Slack с Gateway.
  </Card>
  <Card title="Группы" icon="users" href="/ru/channels/groups">
    Поведение каналов и групповых личных сообщений.
  </Card>
  <Card title="Маршрутизация каналов" icon="route" href="/ru/channels/channel-routing">
    Направляйте входящие сообщения агентам.
  </Card>
  <Card title="Безопасность" icon="shield" href="/ru/gateway/security">
    Модель угроз и усиление защиты.
  </Card>
  <Card title="Конфигурация" icon="sliders" href="/ru/gateway/configuration">
    Структура конфигурации и приоритеты.
  </Card>
  <Card title="Слеш-команды" icon="terminal" href="/ru/tools/slash-commands">
    Каталог команд и их поведение.
  </Card>
</CardGroup>
