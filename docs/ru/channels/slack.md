---
read_when:
    - Настройка Slack или отладка режима сокетов, HTTP либо ретрансляции Slack
summary: Настройка Slack и поведение во время выполнения (Socket Mode, URL-адреса HTTP-запросов и режим ретрансляции)
title: Slack
x-i18n:
    generated_at: "2026-07-16T16:08:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Поддержка Slack охватывает личные сообщения и каналы посредством интеграций с приложениями Slack. По умолчанию используется транспорт Socket Mode; также поддерживаются HTTP Request URLs. Режим ретрансляции предназначен для управляемых развертываний, в которых доверенный маршрутизатор отвечает за входящий трафик Slack.

<CardGroup cols={3}>
  <Card title="Связывание" icon="link" href="/ru/channels/pairing">
    Для личных сообщений Slack по умолчанию используется режим связывания.
  </Card>
  <Card title="Слеш-команды" icon="terminal" href="/ru/tools/slash-commands">
    Поведение встроенных команд и каталог команд.
  </Card>
  <Card title="Устранение неполадок каналов" icon="wrench" href="/ru/channels/troubleshooting">
    Межканальная диагностика и инструкции по устранению неполадок.
  </Card>
</CardGroup>

## Выбор транспорта

Socket Mode и HTTP Request URLs обеспечивают одинаковую функциональность для обмена сообщениями, слеш-команд, App Home и интерактивных возможностей. Выбирайте с учетом архитектуры развертывания, а не функций.

| Аспект                       | Socket Mode (по умолчанию)                                                                                                                           | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Публичный URL Gateway        | Не требуется                                                                                                                                         | Требуется (DNS, TLS, обратный прокси-сервер или туннель)                                                       |
| Исходящая сеть               | Должно быть доступно исходящее WSS-соединение с `wss-primary.slack.com`                                                                                    | Без исходящего WS; только входящий HTTPS                                                                       |
| Необходимые токены           | Токен бота + App-Level Token с `connections:write`                                                                                                    | Токен бота + Signing Secret                                                                                    |
| Ноутбук разработчика / за межсетевым экраном | Работает без дополнительной настройки                                                                                                                | Требуется публичный туннель (ngrok, Cloudflare Tunnel, Tailscale Funnel) или промежуточный Gateway             |
| Горизонтальное масштабирование | Один сеанс Socket Mode на приложение на каждом хосте; для нескольких Gateway требуются отдельные приложения Slack                                    | Обработчик POST без состояния; несколько реплик Gateway могут совместно использовать одно приложение за балансировщиком нагрузки |
| Несколько учетных записей на одном Gateway | Поддерживается; каждая учетная запись открывает собственное WS-соединение                                                                             | Поддерживается; каждой учетной записи требуется уникальный `webhookPath` (по умолчанию `/slack/events`), чтобы регистрации не конфликтовали |
| Транспорт слеш-команд        | Доставка через WS-соединение; `slash_commands[].url` игнорируется                                                                                         | Slack отправляет POST на `slash_commands[].url`; поле обязательно для передачи команды обработчику                |
| Подписание запросов          | Не используется (аутентификация выполняется посредством App-Level Token)                                                                             | Slack подписывает каждый запрос; OpenClaw проверяет подпись с помощью `signingSecret`                       |
| Восстановление после разрыва соединения | Включено автоматическое переподключение Slack SDK; OpenClaw также перезапускает завершившиеся с ошибкой сеансы Socket Mode с ограниченной экспоненциальной задержкой. Применяются настройки транспорта для тайм-аута pong. | Нет постоянного соединения, которое может разорваться; Slack повторяет каждый запрос отдельно                 |

<Note>
  **Выбирайте Socket Mode** для хостов с одним Gateway, ноутбуков разработчиков и локальных сетей, которые могут устанавливать исходящие соединения с `*.slack.com`, но не могут принимать входящий HTTPS.

**Выбирайте HTTP Request URLs**, если несколько реплик Gateway работают за балансировщиком нагрузки, исходящий WSS заблокирован, но входящий HTTPS разрешен, либо вебхуки Slack уже завершаются на обратном прокси-сервере.
</Note>

<Warning>
  Slack может поддерживать несколько соединений Socket Mode для одного приложения и доставлять каждую полезную нагрузку через любое из них. Поэтому отдельным Gateway OpenClaw, совместно использующим приложение Slack, необходимы одинаковые настройки маршрутизации и авторизации. В противном случае используйте отдельное приложение Slack для каждого Gateway, единую точку входа ретрансляции или HTTP Request URLs за балансировщиком нагрузки. См. [Использование Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Режим ретрансляции

Режим ретрансляции отделяет входящий трафик Slack от Gateway OpenClaw. Доверенный маршрутизатор отвечает за единственное соединение Slack Socket Mode, выбирает целевой Gateway и пересылает типизированное событие через аутентифицированное соединение WebSocket. Gateway по-прежнему использует собственный токен бота для исходящих вызовов Slack Web API.

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

URL ретрансляции должен использовать `wss://`, если только он не указывает на localhost. Рассматривайте токен предъявителя и таблицу маршрутов маршрутизатора как часть границы авторизации Slack: маршрутизируемые события поступают в обычный обработчик сообщений Slack как авторизованные активации. Предоставленный маршрутизатором `slack_identity` в кадре WebSocket `hello` может задать исходящие имя пользователя и значок по умолчанию; явно указанная вызывающей стороной идентичность по-прежнему имеет приоритет. Соединение ретрансляции переподключается с той же ограниченной экспоненциальной задержкой, что и Socket Mode, и удаляет предоставленную маршрутизатором идентичность при каждом отключении.

### Установки для всей организации Enterprise Grid

Одна учетная запись Slack может получать сообщения из всех рабочих пространств, охваченных
установкой на уровне организации Enterprise Grid. Выберите прямой Socket Mode или HTTP
Request URLs; режим ретрансляции для корпоративных учетных записей не поддерживается. Оба
приведенных ниже манифеста с минимальными привилегиями включают только путь событий V1
`message` и `app_mention`, немедленные ответы и реакции состояния,
управляемые прослушивателем.

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

Попросите Enterprise Grid Org Admin или Org Owner одобрить приложение, установить его на
уровне организации и выбрать рабочие пространства, охватываемые установкой.
Перед запуском OpenClaw убедитесь, что приложение доступно во всех нужных рабочих
пространствах. Создайте токен уровня приложения с `connections:write` для Socket Mode,
затем скопируйте токен бота из установки организации. Настройте учетную запись,
использующую токен бота, установленного на уровне организации:

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

Используйте режим HTTP, если у Gateway есть публичная конечная точка HTTPS и он не открывает
соединение Socket Mode. Замените URL в примере публичным URL Gateway
`webhookPath` (по умолчанию `/slack/events`):

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

Попросите Enterprise Grid Org Admin или Org Owner одобрить приложение, установить его на
уровне организации и выбрать рабочие пространства, охватываемые установкой.
После проверки Request URL службой Slack скопируйте токен бота установки организации и
**Basic Information -> App Credentials -> Signing Secret** приложения. Настройте
корпоративную учетную запись с тем же путем Request URL:

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

При запуске OpenClaw проверяет `enterpriseOrgInstall` с помощью Slack `auth.test`.
Токен, установленный на уровне организации, без этого флага или токен рабочего пространства
с этим флагом приводят к сбою запуска. Slack остается источником истины в отношении рабочих
пространств, предоставивших доступ установке; затем OpenClaw применяет настроенные политики
каналов, пользователей, личных сообщений и упоминаний к каждому доставленному событию.
Enterprise V1 отклоняет все созданные ботом события `message` и
`app_mention` до передачи обработчику независимо от `allowBots`, поскольку
установки на уровне организации не предоставляют стабильную идентичность бота с привязкой
к рабочему пространству для предотвращения циклов.

Поддержка Enterprise намеренно ограничена прямым Socket Mode или событиями HTTP
`message` и `app_mention` и немедленными ответами на них. Режим ретрансляции,
слеш-команды, взаимодействия, App Home, прослушиватели событий реакций, закрепления,
инструменты действий Slack, встроенные одобрения Slack, привязки, доставка из очереди или
по расписанию и проактивная отправка недоступны для корпоративной учетной записи. Исходящие
реакции подтверждения, набора текста и состояния поддерживаются через клиент Slack,
управляемый прослушивателем, и требуют `reactions:write`; входящие уведомления о реакциях
и инструменты действий с реакциями остаются недоступными.

Немедленные ответы используют стандартное поведение доставки Slack для фрагментов,
медиафайлов, метаданных, резервного определения идентичности, разворачивания ссылок и подтверждений, но только пока
проверенный клиент, принадлежащий обработчику, остаётся в активном цикле события. Очередь
отправки в памяти и записи об участии в обсуждениях разделяются по рабочему пространству
этого события; сам клиент никогда не сериализуется и не сохраняется.

Ключи политики каналов и записи `dm.groupChannels` должны использовать необработанные стабильные идентификаторы каналов Slack или
форму `channel:<id>`. OpenClaw нормализует обе формы до необработанного идентификатора канала для
сопоставления во время выполнения; префиксы `slack:`, `group:` и `mpim:` приводят к сбою запуска.
Записи политики пользователей должны использовать стабильные идентификаторы пользователей Slack; имена, слаги, отображаемые имена
и адреса электронной почты приводят к сбою запуска. Идентификаторы должны использовать канонический для Slack
префикс и основную часть в верхнем регистре (например, `C0123456789` или `U0123456789`); варианты в нижнем регистре и
короткие похожие значения приводят к сбою запуска. Для корпоративных учётных записей нельзя включить
`dangerouslyAllowNameMatching`. Для корпоративных учётных записей можно задать глобальный параметр
`mentionPatterns.mode`, но `mentionPatterns.allowIn` и
`mentionPatterns.denyIn` приводят к сбою запуска, поскольку простые идентификаторы каналов Slack не
привязаны к рабочему пространству и могут повторно использоваться в разных рабочих пространствах. Установки в рабочих пространствах
сохраняют существующее поведение шаблонов упоминаний с ограниченной областью действия. Каждое принятое рабочее пространство
получает отдельные идентичности маршрутизации, сеанса, расшифровки, дедупликации, истории и кэша,
даже если идентификаторы Slack совпадают. В потоке `message` поддерживаются обычные сообщения пользователей
и созданные пользователями события `file_share`; остальные подтипы сообщений
отклоняются до авторизации или обработки системных событий.

Корпоративные личные сообщения должны быть либо отключены (`dm.enabled=false` или
`dmPolicy="disabled"`), либо явно открыты с помощью `dmPolicy="open"` и
эффективного параметра учётной записи `allowFrom`, содержащего литерал `"*"`. Пустой
список разрешений или идентификаторы отдельных пользователей без `"*"` приводят к сбою запуска. Сопряжение и
пользовательские списки разрешений для личных сообщений отклоняются, поскольку идентификаторы пользователей Slack не
привязаны к рабочему пространству в этих хранилищах авторизации. Политики каналов и отправителей
продолжают применяться к сообщениям каналов.

## Установка

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` регистрирует и включает плагин. Он не выполняет никаких действий, пока не настроены приложение Slack и параметры каналов ниже. Общие правила установки плагинов см. в разделе [Плагины](/ru/tools/plugin).

## Быстрая настройка

Манифесты в этом разделе создают установку с областью действия рабочего пространства. Для
установки на уровне всей организации Enterprise Grid вместо этого используйте специальный
[манифест и рабочий процесс для всей организации](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Режим сокетов (по умолчанию)">
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
      "assistant_description": "OpenClaw подключает обсуждения помощника Slack к агентам OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "С чем вы можете мне помочь?" },
        {
          "title": "Сводка по этому каналу",
          "message": "Составьте сводку недавней активности в этом канале."
        },
        { "title": "Черновик ответа", "message": "Помогите мне составить черновик ответа." }
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
      "assistant_description": "OpenClaw подключает обсуждения помощника Slack к агентам OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "С чем вы можете мне помочь?" },
        {
          "title": "Сводка по этому каналу",
          "message": "Составьте сводку недавней активности в этом канале."
        },
        { "title": "Черновик ответа", "message": "Помогите мне составить черновик ответа." }
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
          **Recommended** соответствует полному набору возможностей плагина Slack: App Home, команды с косой чертой, файлы, реакции, закреплённые элементы, групповые личные сообщения и чтение эмодзи и групп пользователей. Выберите **Minimal**, если политика рабочего пространства ограничивает области доступа: этот вариант охватывает личные сообщения, историю каналов и групп, упоминания и команды с косой чертой, но исключает файлы, реакции, закреплённые элементы, групповые личные сообщения (`mpim:*`), `emoji:read` и `usergroups:read`. Обоснование каждой области доступа и дополнительные варианты, например дополнительные команды с косой чертой, см. в разделе [Контрольный список манифеста и областей доступа](#manifest-and-scope-checklist).
        </Note>

        После создания приложения в Slack:

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

        Резервный вариант с переменными среды (только для учётной записи по умолчанию):

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
        Откройте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → выберите рабочее пространство → вставьте один из приведённых ниже манифестов → замените `https://gateway-host.example.com/slack/events` публичным URL-адресом Gateway → **Next** → **Create**.

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
      "assistant_description": "OpenClaw подключает обсуждения помощника Slack к агентам OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "С чем вы можете мне помочь?" },
        {
          "title": "Сводка по этому каналу",
          "message": "Составьте сводку недавней активности в этом канале."
        },
        { "title": "Черновик ответа", "message": "Помогите мне составить черновик ответа." }
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
      "assistant_description": "OpenClaw подключает ветки ассистента Slack к агентам OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "С чем вы можете мне помочь?" },
        {
          "title": "Сводка по этому каналу",
          "message": "Составьте сводку недавней активности в этом канале."
        },
        { "title": "Черновик ответа", "message": "Помогите мне составить черновик ответа." }
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
          Вариант **Рекомендуемый** соответствует полному набору функций плагина Slack; в варианте **Минимальный** исключены файлы, реакции, закреплённые сообщения, групповые личные сообщения (`mpim:*`), `emoji:read` и `usergroups:read` для рабочих пространств со строгими ограничениями. Обоснование каждой области доступа см. в разделе [Контрольный список манифеста и областей доступа](#manifest-and-scope-checklist).
        </Note>

        <Info>
          Все три поля URL (`slash_commands[].url`, `event_subscriptions.request_url` и `interactivity.request_url` / `message_menu_options_url`) указывают на одну и ту же конечную точку OpenClaw. Схема манифеста Slack требует задавать их отдельно, но OpenClaw выполняет маршрутизацию по типу полезной нагрузки, поэтому достаточно одного `webhookPath` (по умолчанию `/slack/events`). В режиме HTTP слеш-команды без `slash_commands[].url` неявно игнорируются.
        </Info>

        После создания приложения в Slack:

        - **Basic Information → App Credentials**: скопируйте **Signing Secret** для проверки запросов.
        - **Install App -> Install to Workspace**: скопируйте токен OAuth пользователя-бота.

      </Step>

      <Step title="Настройка OpenClaw">

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

      <Step title="Запуск Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Настройка транспорта Socket Mode

По умолчанию OpenClaw устанавливает для клиента Slack SDK тайм-аут ожидания pong в Socket Mode равным 15 секундам. Изменяйте настройки транспорта только при необходимости настройки для конкретного рабочего пространства или хоста:

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

Используйте это только для рабочих пространств в Socket Mode, где регистрируются тайм-ауты pong/server-ping веб-сокета Slack, или для хостов с известным дефицитом времени цикла событий. `clientPingTimeout` — время ожидания pong после отправки клиентского ping пакетом SDK; `serverPingTimeout` — время ожидания серверных ping от Slack. Сообщения и события приложения остаются состоянием приложения, а не сигналами активности транспорта.

Примечания:

- `socketMode` игнорируется в режиме HTTP Request URL.
- Базовые настройки `channels.slack.socketMode` применяются ко всем учётным записям Slack, если не переопределены. Для переопределений на уровне учётной записи используется `channels.slack.accounts.<accountId>.socketMode`; поскольку это переопределение объекта, укажите все поля настройки сокета, необходимые для этой учётной записи.
- Значение по умолчанию в OpenClaw (`15000`) есть только у `clientPingTimeout`. `serverPingTimeout` и `pingPongLoggingEnabled` передаются в Slack SDK только при явной настройке.
- Задержка перед повторным запуском Socket Mode начинается примерно с 2 секунд и ограничивается примерно 30 секундами. После устранимых сбоев запуска, ожидания запуска и отключения попытки повторяются до остановки канала. При постоянных ошибках учётной записи и учётных данных, таких как недействительная аутентификация, отозванные токены или отсутствующие области доступа, работа быстро завершается с ошибкой вместо бесконечных повторных попыток.

## Контрольный список манифеста и областей доступа

Базовый манифест приложения Slack одинаков для Socket Mode и HTTP Request URLs. Отличаются только блок `settings` (и `url` слеш-команды).

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
      "assistant_description": "OpenClaw подключает ветки ассистента Slack к агентам OpenClaw.",
      "suggested_prompts": [
        { "title": "Что вы умеете?", "message": "С чем вы можете мне помочь?" },
        {
          "title": "Сводка по этому каналу",
          "message": "Составьте сводку недавней активности в этом канале."
        },
        { "title": "Черновик ответа", "message": "Помогите мне составить черновик ответа." }
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

Для режима **HTTP Request URLs** замените `settings` вариантом HTTP и добавьте `url` в каждую слеш-команду. Требуется общедоступный URL:

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

Включите дополнительные функции, расширяющие приведённые выше настройки по умолчанию.

Манифест по умолчанию включает вкладку **Home** раздела Slack App Home и подписку на `app_home_opened`. Когда участник рабочего пространства открывает вкладку Home, OpenClaw публикует безопасное представление Home по умолчанию с `views.publish`; полезная нагрузка беседы и конфиденциальная конфигурация в него не включаются. Когда включён режим одной слеш-команды, в подсказке команды используется `channels.slack.slashCommand.name`; в установках с нативными командами или без слеш-команд эта подсказка отсутствует. Вкладка **Messages** остаётся включённой для личных сообщений Slack. Манифест также включает ветки ассистента Slack с помощью `features.assistant_view`, `assistant:write`, `assistant_thread_started` и `assistant_thread_context_changed`; ветки ассистента направляются в отдельные сеансы веток OpenClaw и сохраняют предоставленный Slack контекст ветки доступным агенту.

<AccordionGroup>
  <Accordion title="Необязательные нативные слеш-команды">

    Вместо одной настроенной команды можно использовать несколько [нативных слеш-команд](#commands-and-slash-behavior), учитывая следующие особенности:

    - Используйте `/agentstatus` вместо `/status`, поскольку команда `/status` зарезервирована.
    - В приложении Slack можно одновременно зарегистрировать не более 25 слеш-команд (ограничение платформы Slack).

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
      "usage_hint": "простой <duration|off> или максимальный возраст <duration|off>"
    },
    {
      "command": "/think",
      "description": "Задать уровень обдумывания",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Включить или отключить подробный вывод",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Показать или задать быстрый режим",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Включить или отключить отображение рассуждений",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Включить или отключить режим повышенных привилегий",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Показать или задать настройки выполнения по умолчанию",
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
      "description": "Показать список поставщиков и моделей",
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
      "description": "Показать состояние среды выполнения, включая использование и квоту поставщика, если доступны"
    },
    {
      "command": "/tasks",
      "description": "Показать активные и недавние фоновые задачи текущего сеанса"
    },
    {
      "command": "/context",
      "description": "Объяснить, как формируется контекст",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Показать идентификатор отправителя"
    },
    {
      "command": "/skill",
      "description": "Запустить навык по имени",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Задать дополнительный вопрос без изменения контекста сеанса",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Задать дополнительный вопрос без изменения контекста сеанса",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Настроить нижний колонтитул использования или показать сводку затрат",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL-адреса HTTP-запросов">
        Используйте тот же список `slash_commands`, что и для Socket Mode выше, и добавьте `"url": "https://gateway-host.example.com/slack/events"` в каждую запись. Пример:

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
    Добавьте область бота `chat:write.customize`, если исходящие сообщения должны использовать идентификатор активного агента (пользовательское имя и значок) вместо идентификатора приложения Slack по умолчанию.

    Если используется значок эмодзи, Slack ожидает синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необязательные области пользовательского токена (операции чтения)">
    Если настроен `channels.slack.userToken`, обычно используются следующие области чтения:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (если используются операции чтения через поиск Slack)

  </Accordion>
</AccordionGroup>

## Модель токенов

- `botToken` и `appToken` обязательны для Socket Mode.
- Для режима HTTP требуются `botToken` и `signingSecret`.
- Для режима ретрансляции требуется `botToken`, а также `relay.url`, `relay.authToken` и `relay.gatewayId`; токен приложения и секрет подписи в нём не используются.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` и `userToken` принимают строки с открытым текстом
  или объекты SecretRef.
- Токены из конфигурации переопределяют резервные значения из переменных среды.
- Резервные значения переменных среды `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` и `SLACK_USER_TOKEN` применяются только к учётной записи по умолчанию.
- По умолчанию `userToken` работает только для чтения (`userTokenReadOnly: true`).

Поведение снимка состояния:

- При проверке учётной записи Slack для каждого набора учётных данных отслеживаются поля `*Source` и `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Состояние может быть `available`, `configured_unavailable` или `missing`.
- `configured_unavailable` означает, что учётная запись настроена через SecretRef
  или другой источник секрета, не встроенный в конфигурацию, но текущей команде или пути среды выполнения
  не удалось получить фактическое значение.
- В режиме HTTP включается `signingSecretStatus`; в Socket Mode
  обязательной парой являются `botTokenStatus` и `appTokenStatus`.

<Tip>
Для действий и чтения каталога при наличии настройки может использоваться преимущественно пользовательский токен. Для записи преимущество сохраняется за токеном бота; запись с пользовательским токеном разрешена, только если `userTokenReadOnly: false` и токен бота недоступен.
</Tip>

## Действия и ограничения

Действия Slack управляются параметром `channels.slack.actions.*`.

Доступные группы действий в текущих инструментах Slack:

| Группа     | По умолчанию |
| ---------- | ------------ |
| messages   | включено     |
| reactions  | включено     |
| pins       | включено     |
| memberInfo | включено     |
| emojiList  | включено     |

Текущие действия с сообщениями Slack включают `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` и `emoji-list`. `download-file` принимает идентификаторы файлов Slack, показанные во входящих заполнителях файлов, и возвращает предпросмотр изображений либо метаданные локального файла для файлов других типов.

## Управление доступом и маршрутизация

<Tabs>
  <Tab title="Политика личных сообщений">
    `channels.slack.dmPolicy` управляет доступом к личным сообщениям. `channels.slack.allowFrom` — канонический список разрешённых личных сообщений.

    - `pairing` (по умолчанию)
    - `allowlist`
    - `open` (требует, чтобы `channels.slack.allowFrom` содержал `"*"`)
    - `disabled`

    Флаги личных сообщений:

    - `dm.enabled` (по умолчанию true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (устаревший)
    - `dm.groupEnabled` (для групповых личных сообщений по умолчанию false)
    - `dm.groupChannels` (необязательный список разрешённых MPIM)

    Приоритет при нескольких учётных записях:

    - `channels.slack.accounts.default.allowFrom` применяется только к учётной записи `default`.
    - Именованные учётные записи наследуют `channels.slack.allowFrom`, если их собственный `allowFrom` не задан.
    - Именованные учётные записи не наследуют `channels.slack.accounts.default.allowFrom`.

    Устаревшие `channels.slack.dm.policy` и `channels.slack.dm.allowFrom` по-прежнему считываются для совместимости. `openclaw doctor --fix` переносит их в `dmPolicy` и `allowFrom`, если это можно сделать без изменения доступа.

    Для сопряжения в личных сообщениях используется `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Политика каналов">
    `channels.slack.groupPolicy` управляет обработкой каналов:

    - `open`
    - `allowlist`
    - `disabled`

    Список разрешённых каналов находится в `channels.slack.channels` и **должен использовать стабильные идентификаторы каналов Slack** (например, `C12345678`) в качестве ключей конфигурации.

    Примечание о среде выполнения: если `channels.slack` полностью отсутствует (настройка только через переменные среды), среда выполнения использует резервное значение `groupPolicy="allowlist"` и записывает предупреждение в журнал (даже если задан `channels.defaults.groupPolicy`).

    Разрешение имён и идентификаторов:

    - записи списков разрешённых каналов и личных сообщений разрешаются при запуске, если это допускает доступ по токену
    - неразрешённые записи с именами каналов сохраняются в заданном виде, но по умолчанию игнорируются при маршрутизации
    - по умолчанию входящая авторизация и маршрутизация каналов в первую очередь используют идентификаторы; для прямого сопоставления по имени пользователя или краткому имени требуется `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключи на основе имён (`#channel-name` или `channel-name`) **не** сопоставляются при `groupPolicy: "allowlist"`. По умолчанию поиск канала в первую очередь выполняется по идентификатору, поэтому ключ на основе имени никогда не обеспечит успешную маршрутизацию, а все сообщения в этом канале будут блокироваться без уведомления. Это отличается от `groupPolicy: "open"`, где ключ канала не требуется для маршрутизации и кажется, что ключ на основе имени работает.

    Всегда используйте идентификатор канала Slack в качестве ключа. Чтобы найти его, щёлкните канал в Slack правой кнопкой мыши → **Copy link** — идентификатор (`C...`) указан в конце URL-адреса.

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
    По умолчанию сообщения в каналах требуют упоминания.

    Источники упоминаний:

    - явное упоминание приложения (`<@botId>`)
    - упоминание группы пользователей Slack (`<!subteam^S...>`), если пользователь-бот входит в эту группу пользователей; требуется `usergroups:read`
    - регулярные выражения для упоминаний (`agents.list[].groupChat.mentionPatterns`, резервное значение `messages.groupChat.mentionPatterns`)
    - неявное поведение ответа в ветке боту (отключается, если `thread.requireExplicitMention` имеет значение `true`)

    Параметры отдельных каналов (`channels.slack.channels.<id>`; имена доступны только через разрешение при запуске или `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; переопределяет режим ответа учётной записи или типа чата для этого канала)
    - `users` (список разрешённых)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` или подстановочный знак `"*"`
      (устаревшие ключи без префикса по-прежнему сопоставляются только с `id:`)

    `ignoreOtherMentions` (по умолчанию `false`) отбрасывает сообщения канала, в которых упоминается другой пользователь или группа пользователей, но не этот бот. Личные сообщения и групповые личные сообщения (MPIM) не затрагиваются. Для фильтра требуется разрешённый идентификатор пользователя-бота из `auth.test`; если эта идентификационная информация недоступна (например, используется идентификация только по пользовательскому токену), проверка пропускает сообщения без изменений.

    `allowBots` применяет консервативный подход к публичным и приватным каналам: сообщения комнаты, отправленные ботом, принимаются, только если отправляющий бот явно указан в списке разрешённых `users` этой комнаты либо хотя бы один явно заданный идентификатор владельца Slack из `channels.slack.allowFrom` в данный момент принадлежит участнику комнаты. Подстановочные знаки и записи владельцев по отображаемому имени не подтверждают присутствие владельца. Для проверки присутствия владельца используется Slack `conversations.members`; убедитесь, что у приложения есть соответствующая область разрешений на чтение для данного типа комнаты (`channels:read` для публичных каналов, `groups:read` для приватных каналов). Если получить список участников не удаётся, OpenClaw отбрасывает сообщение комнаты, отправленное ботом.

    Для принятых сообщений Slack, отправленных ботом, используется общая [защита от зацикливания ботов](/ru/channels/bot-loop-protection). Настройте `channels.defaults.botLoopProtection` как бюджет по умолчанию, а затем переопределите его с помощью `channels.slack.botLoopProtection` или `channels.slack.channels.<id>.botLoopProtection`, если для рабочего пространства или канала требуется другой лимит.

  </Tab>
</Tabs>

## Ветки, сеансы и теги ответов

- Личные сообщения маршрутизируются как `direct`; каналы — как `channel`; MPIM — как `group`.
- Привязки маршрутов Slack принимают необработанные идентификаторы получателей, а также формы целей Slack, такие как `channel:C12345678`, `user:U12345678` и `<@U12345678>`.
- При значении `session.dmScope=main` по умолчанию личные сообщения Slack объединяются в основной сеанс агента.
- Сеансы каналов: `agent:<agentId>:slack:channel:<channelId>`.
- Обычные сообщения верхнего уровня в канале остаются в сеансе соответствующего канала, даже если `replyToMode` имеет значение, отличное от `off`.
- Для ответов в ветках Slack используется родительский Slack `thread_ts` в суффиксах сеансов (`:thread:<threadTs>`), даже если создание веток для исходящих ответов отключено с помощью `replyToMode="off"`.
- OpenClaw добавляет подходящее корневое сообщение верхнего уровня канала в `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, если ожидается, что оно начнёт видимую ветку Slack, чтобы корневое сообщение и последующие ответы в ветке использовали один сеанс OpenClaw. Это относится к событиям `app_mention`, явным упоминаниям бота или совпадениям с настроенным шаблоном упоминания, а также к каналам `requireMention: false` со значением `replyToMode`, отличным от `off`.
- Значение `channels.slack.thread.historyScope` по умолчанию — `thread`; значение `thread.inheritParent` по умолчанию — `false`.
- `channels.slack.thread.initialHistoryLimit` определяет, сколько существующих сообщений ветки загружается при запуске нового сеанса ветки (по умолчанию `20`; задайте `0`, чтобы отключить).
- `channels.slack.thread.requireExplicitMention` (по умолчанию `false`): при значении `true` подавляет неявные упоминания в ветках, чтобы бот отвечал только на явные упоминания `@bot` внутри веток, даже если бот уже участвовал в ветке. Без этого ответы в ветке с участием бота обходят проверку `requireMention`.

Настройки создания веток для ответов:

- `channels.slack.channels.<id>.replyToMode`: переопределение для отдельных публичных или приватных каналов Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (по умолчанию `off`)
- `channels.slack.replyToModeByChatType`: для каждого `direct|group|channel`
- устаревший резервный вариант для личных чатов: `channels.slack.dm.replyToMode`

Поддерживаются теги ответов, задаваемые вручную:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Для явных ответов в ветках Slack из инструмента `message` задайте `replyBroadcast: true` вместе с `action: "send"` и `threadId` или `replyTo`, чтобы запросить у Slack дополнительную публикацию ответа из ветки в родительском канале. Это соответствует флагу Slack `reply_broadcast` для `chat.postMessage` и поддерживается только при отправке текста или Block Kit, но не при загрузке медиафайлов.

Когда вызов инструмента `message` выполняется внутри ветки Slack и нацелен на тот же канал, OpenClaw обычно наследует текущую ветку Slack в соответствии с эффективным значением `replyToMode` для учётной записи, типа чата или отдельного канала. Автоматические ответы и вызовы `send` или `upload-file` в том же канале используют то же переопределение для отдельного канала. Задайте `topLevel: true` для `action: "send"` или `action: "upload-file"`, чтобы принудительно создать новое сообщение в родительском канале. `threadId: null` принимается как эквивалентный отказ от ветки на верхнем уровне.

<Note>
`replyToMode="off"` отключает создание веток для исходящих ответов Slack, включая явные теги `[[reply_to_*]]`. При этом входящие сеансы веток Slack не преобразуются в плоские: сообщения, уже опубликованные внутри ветки Slack, по-прежнему маршрутизируются в сеанс `:thread:<threadTs>`. Это отличается от Telegram, где явные теги продолжают учитываться в режиме `"off"`. Ветки Slack скрывают сообщения из канала, тогда как ответы Telegram остаются видимыми в общей ленте.
</Note>

## Реакции-подтверждения

`ackReaction` отправляет эмодзи подтверждения, пока OpenClaw обрабатывает входящее сообщение. `ackReactionScope` определяет, _когда_ этот эмодзи фактически отправляется.

По умолчанию реакция-подтверждение остаётся неизменной, а состояние собственной ветки ассистента Slack отображает ход выполнения с помощью сменяющихся сообщений о загрузке. Задайте `messages.statusReactions.enabled: true`, чтобы вместо этого включить жизненный цикл реакций «в очереди/обдумывание/инструмент/готово/ошибка».

### Эмодзи (`ackReaction`)

Порядок разрешения:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервный эмодзи из идентификационных данных агента (`agents.list[].identity.emoji`, иначе `"eyes"` / 👀)

Примечания:

- Slack ожидает короткие коды (например, `"eyes"`).
- Используйте `""`, чтобы отключить реакцию для учётной записи Slack или глобально.

### Область действия (`messages.ackReactionScope`)

Провайдер Slack считывает область действия из `messages.ackReactionScope` (по умолчанию `"group-mentions"`). Сейчас переопределение на уровне учётной записи или канала Slack отсутствует; значение является глобальным для Gateway.

Значения:

- `"all"`: реагировать в личных сообщениях и группах, включая фоновые события комнат.
- `"direct"`: реагировать только в личных сообщениях.
- `"group-all"`: реагировать на каждое групповое сообщение, кроме фоновых событий комнат (без личных сообщений).
- `"group-mentions"` (по умолчанию): реагировать в группах, но только при упоминании бота (или в группах с поддержкой упоминаний, где эта возможность включена). **Личные сообщения исключены.**
- `"off"` / `"none"`: никогда не реагировать.

<Note>
Область действия по умолчанию (`"group-mentions"`) не запускает реакции-подтверждения в личных сообщениях или при фоновых событиях комнат. Чтобы настроенный `ackReaction` (например, `"eyes"`) отображался для входящих личных сообщений Slack и фоновых событий неактивных комнат, задайте для `messages.ackReactionScope` значение `"all"`. `messages.ackReactionScope` считывается при запуске провайдера Slack, поэтому для применения изменения требуется перезапуск Gateway.
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

- `off`: отключить потоковый предварительный просмотр в реальном времени.
- `partial` (по умолчанию): заменять текст предварительного просмотра последним частичным результатом.
- `block`: добавлять порционные обновления предварительного просмотра.
- `progress`: показывать текст состояния выполнения во время генерации, а затем отправлять окончательный текст.
- `streaming.preview.toolProgress`: когда активен предварительный просмотр черновика, направлять обновления инструментов и хода выполнения в то же редактируемое сообщение предварительного просмотра (по умолчанию: `true`). Задайте `false`, чтобы сохранять отдельные сообщения инструментов и хода выполнения.
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

`channels.slack.streaming.nativeTransport` управляет собственной потоковой передачей текста Slack, когда `channels.slack.streaming.mode` имеет значение `partial` (по умолчанию: `true`).

Собственные карточки задач Slack с ходом выполнения включаются отдельно для режима выполнения. Задайте для `channels.slack.streaming.progress.nativeTaskCards` значение `true` вместе с `channels.slack.streaming.mode="progress"`, чтобы во время выполнения работы отправлять собственную карточку плана или задачи Slack, а после завершения обновить ту же карточку. Без этого флага режим выполнения сохраняет переносимое поведение предварительного просмотра черновика.

- Для отображения собственной потоковой передачи текста и состояния ветки ассистента Slack должна быть доступна ветка ответа. Выбор ветки по-прежнему определяется `replyToMode`.
- Корневые сообщения каналов, групповых чатов и личных сообщений верхнего уровня могут использовать обычный предварительный просмотр черновика, когда собственная потоковая передача недоступна или ветка ответа отсутствует.
- Личные сообщения Slack верхнего уровня по умолчанию остаются вне веток, поэтому в них не отображается собственный потоковый предварительный просмотр или предварительный просмотр состояния в стиле веток Slack; вместо этого OpenClaw публикует и редактирует предварительный просмотр черновика в личном сообщении.
- Медиафайлы и нетекстовые данные отправляются обычным способом.
- Окончательные медиафайлы и сообщения об ошибках отменяют ожидающие изменения предварительного просмотра; подходящие окончательные текстовые сообщения и блоки применяются только тогда, когда предварительный просмотр можно изменить на месте.
- Если потоковая передача прерывается в середине ответа, OpenClaw отправляет оставшиеся данные обычным способом.

Использование предварительного просмотра черновика вместо собственной потоковой передачи текста Slack:

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

Включение собственных карточек задач Slack с ходом выполнения:

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
- `channels.slack.chunkMode` и `channels.slack.nativeStreaming` верхнего уровня — устаревшие псевдонимы для `channels.slack.streaming.chunkMode` и `channels.slack.streaming.nativeTransport`.
- Устаревшие псевдонимы не считываются во время выполнения; запустите `openclaw doctor --fix`, чтобы перезаписать сохранённую конфигурацию потоковой передачи Slack с использованием канонических ключей.

## Резервная реакция при наборе текста

`typingReaction` добавляет временную реакцию к входящему сообщению Slack, пока OpenClaw обрабатывает ответ, а затем удаляет её после завершения выполнения. Это особенно полезно за пределами ответов в ветках, где по умолчанию используется индикатор состояния «печатает...».

Порядок разрешения:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примечания:

- Slack ожидает короткие коды (например, `"hourglass_flowing_sand"`).
- Реакция предоставляется по мере возможности, а после завершения ответа или обработки ошибки автоматически предпринимается попытка её удалить.

## Голосовой ввод

Чтобы сейчас обратиться к OpenClaw голосом в Slack, отправьте аудиоклип Slack приложению OpenClaw. Микрофон диктовки Slackbot — это отдельная функция, принадлежащая Slack, а не API приложения.

- **[Голосовой ввод Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** доступен в личной беседе пользователя со Slackbot. Slack преобразует запись в запрос для Slackbot, но не передаёт сторонним приложениям Slack через Events API аудиофайл, событие диктовки, запрос или маркер источника ввода. Плагин OpenClaw для Slack не может включить или получать эти данные.
- **[Аудиоклипы Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** хранятся как файлы Slack, которые можно публиковать в личных сообщениях OpenClaw, каналах или ветках. OpenClaw скачивает доступный клип с помощью токена бота, нормализует MIME-метаданные клипа Slack и передаёт его в общий [конвейер транскрибирования аудио](/ru/nodes/audio). Рекомендуемый манифест приложения включает необходимую область доступа `files:read`.

Аудиоклипы и голосовой ввод Slackbot имеют разные правила конфиденциальности: на клипы распространяется политика хранения файлов Slack, и OpenClaw скачивает их для транскрибирования, тогда как, по заявлению Slack, аудио голосового ввода не сохраняется.

В канале с `requireMention: true` аудиоклип без подписи может пройти проверку, если в нём произнесён настроенный шаблон упоминания (`agents.list[].groupChat.mentionPatterns`, с переходом к `messages.groupChat.mentionPatterns` при его отсутствии). OpenClaw авторизует отправителя до скачивания или транскрибирования клипа, а затем допускает его только при совпадении транскрипции. Неудачная или не соответствующая шаблону предварительная транскрипция удаляется вместе со скачанным клипом и не сохраняется в истории канала. Нативную идентичность Slack `@bot` невозможно определить по речи, поэтому настройте шаблон произносимого имени или добавьте текстовое упоминание. Если включено дублирование транскрипции, она отправляется только после допуска.

## Медиафайлы, разбиение и доставка

<AccordionGroup>
  <Accordion title="Входящие вложения">
    Файловые вложения Slack скачиваются с размещённых в Slack закрытых URL-адресов (с использованием потока запросов с аутентификацией по токену) и записываются в хранилище медиафайлов, если получение прошло успешно и ограничения размера соблюдены. Заполнители файлов содержат Slack `fileId`, чтобы агенты могли получить исходный файл с помощью `download-file`.

    Для скачивания используются ограниченные тайм-ауты простоя и общего времени. Если получение файла из Slack зависает или завершается ошибкой, OpenClaw продолжает обработку сообщения и использует заполнитель файла.

    По умолчанию ограничение размера входящих данных во время выполнения составляет `20MB`, если оно не переопределено параметром `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Исходящий текст и файлы">
    - текстовые фрагменты используют `channels.slack.textChunkLimit` (по умолчанию `8000`, с ограничением собственным максимальным размером сообщения Slack)
    - `channels.slack.streaming.chunkMode="newline"` включает разбиение в первую очередь по абзацам
    - для отправки файлов используются API загрузки Slack; также поддерживаются ответы в ветках (`thread_ts`)
    - для длинных подписей к файлам первый допустимый в Slack текстовый фрагмент используется как комментарий к загрузке, а оставшиеся фрагменты отправляются последующими сообщениями
    - ограничение размера исходящих медиафайлов определяется параметром `channels.slack.mediaMaxMb`, если он настроен; в противном случае при отправке в каналы используются значения по умолчанию для соответствующего MIME-типа из конвейера медиафайлов

  </Accordion>

  <Accordion title="Цели доставки">
    Предпочтительные явные цели:

    - `user:<id>` для личных сообщений
    - `channel:<id>` для каналов

    Личные сообщения Slack, содержащие только текст или блоки, можно отправлять непосредственно по идентификаторам пользователей; для загрузки файлов и отправки в ветки сначала открывается личная беседа через API бесед Slack, поскольку этим путям требуется конкретный идентификатор беседы.

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

Для нативных команд требуются [дополнительные настройки манифеста](#additional-manifest-settings) в приложении Slack; вместо этого в глобальных конфигурациях они включаются с помощью `channels.slack.commands.native: true` или `commands.native: true`.

- Автоматический режим нативных команд для Slack **отключён**, поэтому `commands.native: "auto"` не включает нативные команды Slack.

```txt
/help
```

Меню аргументов нативных команд отображаются одним из следующих способов в порядке приоритета:

- 3–5 достаточно коротких вариантов: меню переполнения ("...")
- более 100 вариантов при наличии асинхронной фильтрации: внешний список выбора
- 1–2 варианта или любой вариант, закодированное значение которого слишком длинное для списка выбора: блоки кнопок
- в остальных случаях (6–100 вариантов или более 100 без асинхронной фильтрации): статическое меню выбора, разбитое на группы по 100 вариантов

```txt
/think
```

Сеансы команд с косой чертой используют изолированные ключи наподобие `agent:<agentId>:slack:slash:<userId>` и по-прежнему направляют выполнение команд в сеанс целевой беседы с помощью `CommandTargetSessionKey`.

## Нативные диаграммы

Публичный блок Slack [`data_visualization` Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
отображает в сообщениях линейные, столбчатые, площадные и круговые диаграммы. OpenClaw преобразует переносимый блок
`presentation` `chart` в эту нативную структуру; помимо обычного
доступа к сообщениям `chat:write` не требуются дополнительные области OAuth,
загрузка файлов, средство визуализации изображений или настройка Slack.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Quarterly revenue",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Revenue", "values": [120, 145] }],
      "xLabel": "Quarter"
    }
  ]
}
```

Ограничения Slack применяются до нативной визуализации:

- заголовок и необязательные подписи осей: 50 символов
- круговая диаграмма: 1–12 положительных сегментов
- линейная, столбчатая или площадная диаграмма: 1–12 рядов с уникальными именами и 1–20 общих категорий
- подписи сегментов, категорий и рядов: 20 символов
- каждый ряд должен содержать по одному конечному значению для каждой категории; значения
  некруговых диаграмм могут быть отрицательными

Каждая нативная диаграмма также содержит текстовое представление верхнего уровня для программ
чтения с экрана, уведомлений, зеркалирования сеансов и клиентов, которые не могут отобразить
блок. При стандартной отправке представления в другие каналы OpenClaw те получают те же
детерминированные данные диаграммы в текстовом виде, если не заявляют о поддержке нативных диаграмм. Если
во время поэтапного развёртывания Slack отклоняет диаграмму с ошибкой `invalid_blocks`, OpenClaw
удаляет отклонённые нативные блоки данных, сохраняет соседние элементы управления и отправляет
полное представление диаграммы в виде видимого текста.

В настоящее время Slack принимает до двух блоков `data_visualization` на сообщение. Если
представление содержит более двух допустимых диаграмм, OpenClaw сохраняет их порядок
и продолжает нативную визуализацию в последующих сообщениях, размещая не более двух
диаграмм в каждом сообщении.

В [объявлении для разработчиков](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
Slack описывает этот блок как предназначенную для приложений функцию Block Kit и не указывает
ограничений по платному тарифу. Условия доступности для Business+/Enterprise относятся к
автоматическому созданию диаграмм ИИ в Slackbot, а не к отправке приложением
уже структурированной диаграммы Block Kit. Диаграммы являются блоками только для сообщений, а не содержимым App
Home, модальных окон или Canvas.

## Нативные таблицы

Текущий блок Slack [`data_table` Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
отображает в сообщениях структурированные строки и столбцы. OpenClaw преобразует явно заданный
переносимый блок `presentation` `table` в `data_table`; устаревший блок Slack
[`table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) не используется.
Помимо обычного доступа к сообщениям `chat:write`, дополнительные области OAuth
или настройки Slack не требуются.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Open pipeline",
      "headers": ["Account", "Stage", "ARR"],
      "rows": [
        ["Acme", "Won", 125000],
        ["Globex", "Review", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw преобразует заголовки и строковые ячейки в ячейки Slack `raw_text`. Числовые ячейки
преобразуются в `raw_number`, при этом конечное числовое значение сохраняется для нативной сортировки
и фильтрации. `rowHeaderColumnIndex`, если этот параметр задан, помечает указанный с нуля
столбец как заголовки строк Slack.

Опубликованные Slack ограничения `data_table` применяются до нативной визуализации:

- 1–20 столбцов
- 1–100 строк данных плюс строка заголовков
- одинаковое количество ячеек в каждой строке
- не более 10 000 символов суммарно во всех ячейках таблиц одного сообщения

Несколько допустимых блоков таблиц могут отображаться нативно, пока сообщение
не превышает суммарное ограничение количества символов. Таблица, которая не помещается
в нативные ограничения, преобразуется в полный детерминированный текст без потери строк или
ячеек. Если этот текст превышает размер одного сообщения Slack, при отправке и ответах на команды с косой чертой
используются упорядоченные текстовые фрагменты. Редактирование таблицы завершается явной ошибкой размера вместо
незаметного усечения строк существующего сообщения.

Каждая нативная таблица, созданная из переносимого представления, также содержит текстовое представление
верхнего уровня для программ чтения с экрана, уведомлений, зеркалирования сеансов и
клиентов, которые не могут отобразить блок. Необработанные значения диаграмм и таблиц остаются буквальными
в резервном представлении, поэтому данные ячеек наподобие `<@U123>` не превращаются в упоминание Slack.
Если Slack отклоняет нативные блоки диаграмм или таблиц с ошибкой `invalid_blocks`, OpenClaw
удаляет все нативные блоки данных за один ограниченный шаг восстановления, сохраняет допустимые
соседние блоки, например кнопки и списки выбора, и отправляет полный видимый текст диаграмм
и таблиц с отключённым форматированием Slack. При доставке команд с косой чертой
отслеживается бюджет Slack в пять вызовов `response_url` на протяжении всей команды. Перед каждым
пакетом ответов выбирается полный план, укладывающийся в оставшееся количество вызовов, либо операция завершается ошибкой
до публикации этого пакета.

Только явно заданные блоки таблиц `presentation` преобразуются в нативные таблицы.
Таблицы Markdown с вертикальными чертами остаются авторским текстом; OpenClaw не пытается определить
структуру таблицы или типы ячеек. Существующие доверенные производители нативных блоков Slack могут и дальше
передавать необработанные блоки через `channelData.slack.blocks`; OpenClaw формирует резервный
текст из допустимых необработанных ячеек `data_table`, тогда как некорректные пользовательские блоки могут
быть сведены к подписи или общему резервному представлению Block Kit. Переносимый вывод агентов, CLI
и плагинов должен использовать `presentation`.

## Интерактивные ответы

Slack может отображать созданные агентом интерактивные элементы управления ответами, но по умолчанию эта функция отключена.
Для нового вывода агентов, CLI и плагинов предпочтительно использовать общие
кнопки или блоки выбора `presentation`. Они используют тот же путь взаимодействия
Slack и при этом корректно упрощаются в других каналах.

Включите эту возможность глобально:

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

Или включите её только для одной учётной записи Slack:

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

После включения агенты по-прежнему могут выдавать устаревшие директивы ответов, предназначенные только для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Эти директивы компилируются в Slack Block Kit, а нажатия или выбор
направляются обратно через существующий путь событий взаимодействия Slack. Сохраняйте их для старых
запросов и специальных механизмов обхода, предназначенных для Slack; для новых
переносимых элементов управления используйте общее представление.

API компилятора директив также устарели для нового кода производителей:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Для новых элементов управления, отображаемых в Slack, используйте полезные нагрузки `presentation` и `buildSlackPresentationBlocks(...)`.

Примечания:

- Это устаревший интерфейс, специфичный для Slack. Другие каналы не преобразуют директивы Slack Block
  Kit в собственные системы кнопок.
- Значения интерактивных обратных вызовов — это сгенерированные OpenClaw непрозрачные токены, а не исходные значения, заданные агентом.
- Если сгенерированные интерактивные блоки превысят ограничения Slack Block Kit, OpenClaw вместо отправки недопустимой полезной нагрузки блоков возвращается к исходному текстовому ответу.

### Отправка модальных форм, обрабатываемая плагинами

Плагины Slack, регистрирующие обработчик интерактивных событий, также могут получать события жизненного цикла модальных форм
`view_submission` и `view_closed` до того, как OpenClaw сожмёт
полезную нагрузку для системного события, видимого агенту. При открытии модального окна Slack используйте один из следующих
вариантов маршрутизации:

- Задайте для `callback_id` значение `openclaw:<namespace>:<payload>`.
- Либо сохраните существующее значение `callback_id` и поместите `pluginInteractiveData:
"<namespace>:<payload>"` в поле `private_metadata` модального окна.

Обработчик получает `ctx.interaction.kind` как `view_submission` или
`view_closed`, нормализованное значение `inputs` и полный исходный объект `stateValues` из
Slack. Для вызова обработчика плагина достаточно маршрутизации только по идентификатору обратного вызова; включите
существующие поля маршрутизации пользователя/сеанса `private_metadata` модального окна, если
модальное окно также должно создавать системное событие, видимое агенту. Агент получает
компактное системное событие `Slack interaction: ...` с удалёнными конфиденциальными данными. Если обработчик возвращает
`systemEvent.summary`, `systemEvent.reference` или `systemEvent.data`, эти
поля включаются в компактное событие, чтобы агент мог обращаться к
хранилищу плагина, не видя полной полезной нагрузки формы.

## Встроенные подтверждения в Slack

Slack может выступать встроенным клиентом подтверждений с интерактивными кнопками и действиями вместо перехода к веб-интерфейсу или терминалу.

- Подтверждения выполнения и плагинов могут отображаться как встроенные запросы Slack Block Kit.
- `channels.slack.execApprovals.*` по-прежнему отвечает за включение встроенного клиента подтверждений выполнения и настройку маршрутизации в личные сообщения/каналы.
- Личные сообщения с запросами подтверждения выполнения используют `channels.slack.execApprovals.approvers` или `commands.ownerAllowFrom`.
- Подтверждения плагинов используют встроенные кнопки Slack, когда Slack включён как встроенный клиент подтверждений для исходного сеанса либо когда `approvals.plugin` указывает на исходный сеанс Slack или целевой объект Slack.
- Личные сообщения с запросами подтверждения плагинов используют утверждающих плагинов Slack из `channels.slack.allowFrom`, `allowFrom` именованной учётной записи или маршрут учётной записи по умолчанию.
- Авторизация утверждающего по-прежнему применяется: пользователи, имеющие право подтверждать только выполнение, не могут подтверждать запросы плагинов, если они также не являются утверждающими плагинов.

Здесь используется та же общая поверхность кнопок подтверждения, что и в других каналах. Когда `interactivity` включён в настройках приложения Slack, запросы подтверждения отображаются непосредственно в беседе как кнопки Block Kit.
При наличии этих кнопок они являются основным интерфейсом подтверждения; OpenClaw
должен включать ручную команду `/approve` только тогда, когда результат инструмента сообщает, что
подтверждения в чате недоступны или ручное подтверждение является единственным способом.

Путь конфигурации:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необязательно; по возможности используется `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, по умолчанию: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматически включает встроенные подтверждения выполнения, когда `enabled` не задано или имеет значение `"auto"` и удаётся определить хотя бы одного
утверждающего выполнения. Slack также может обрабатывать встроенные подтверждения плагинов через этот путь встроенного клиента,
когда удаётся определить утверждающих плагинов Slack и запрос соответствует фильтрам встроенного клиента. Установите
`enabled: false`, чтобы явно отключить Slack как встроенный клиент подтверждений. Установите `enabled: true`, чтобы
принудительно включить встроенные подтверждения, когда удаётся определить утверждающих. Отключение подтверждений выполнения Slack не отключает
доставку встроенных подтверждений плагинов Slack, включённую через `approvals.plugin`; для доставки подтверждений
плагинов вместо этого используются утверждающие плагинов Slack.

Поведение по умолчанию без явной конфигурации подтверждений выполнения Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явная встроенная конфигурация Slack требуется только для переопределения утверждающих, добавления фильтров или
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

Общая переадресация `approvals.exec` настраивается отдельно. Используйте её только тогда, когда запросы подтверждения выполнения также должны
направляться в другие чаты или явно заданным внешним адресатам. Общая переадресация `approvals.plugin` также
настраивается отдельно; встроенная доставка Slack подавляет этот резервный вариант только тогда, когда Slack может обработать запрос
подтверждения плагина встроенным способом.

Команда `/approve` в том же чате также работает в каналах Slack и личных сообщениях, которые уже поддерживают команды. Полная модель переадресации подтверждений описана в разделе [Подтверждения выполнения](/ru/tools/exec-approvals).

## События и рабочее поведение

- Изменения и удаления сообщений преобразуются в системные события.
- Рассылки из ветки (ответы в ветке с параметром "Also send to channel") обрабатываются как обычные сообщения пользователей.
- События добавления и удаления реакций преобразуются в системные события.
- События присоединения и выхода участников, создания и переименования каналов, а также добавления и удаления закреплений преобразуются в системные события.
- Необязательный опрос присутствия может преобразовать наблюдаемый переход участника-человека из `away` в `active` в событие в последнем активном подходящем сеансе Slack этого участника. По умолчанию отключено.
- `channel_id_changed` может переносить ключи конфигурации каналов, когда включено `configWrites`.
- Метаданные темы и назначения канала считаются недоверенным контекстом и могут внедряться в контекст маршрутизации.
- Начальное сообщение ветки и исходное заполнение контекста из истории ветки фильтруются по настроенным спискам разрешённых отправителей, когда это применимо.
- Действия с блоками, быстрые команды и взаимодействия с модальными окнами создают структурированные системные события `Slack interaction: ...` с расширенными полями полезной нагрузки:
  - действия с блоками: выбранные значения, подписи, значения средств выбора и метаданные `workflow_*`
  - глобальные быстрые команды: метаданные обратного вызова и инициатора, направляемые в прямой сеанс инициатора
  - быстрые команды сообщений: контекст обратного вызова, инициатора, канала, ветки и выбранного сообщения
  - события модального окна `view_submission` и `view_closed` с маршрутизированными метаданными канала и данными формы

Определите глобальные быстрые команды или быстрые команды сообщений в конфигурации приложения Slack и используйте любой непустой идентификатор обратного вызова. OpenClaw подтверждает получение соответствующих полезных нагрузок быстрых команд, применяет ту же политику отправителей для личных сообщений и каналов, что и для других взаимодействий Slack, и ставит очищенное событие в очередь маршрутизированного сеанса агента. Идентификаторы триггеров и URL-адреса ответов удаляются из контекста агента.

### События присутствия

Slack не отправляет изменения присутствия через Events API или Socket Mode. Вместо этого OpenClaw может опрашивать [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) для участников-людей, чьи сообщения прошли обычные проверки доступа и маршрутизации Slack.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (по умолчанию): без таймера присутствия и вызовов Slack API.
- `auto`: отслеживать личные сообщения, MPIM и ветки Slack, активные за последние 24 часа и содержащие не более 8 наблюдаемых участников-людей. Сеансы каналов верхнего уровня исключаются.
- `on`: отслеживать те же беседы без ограничения числа участников и включать сеансы каналов верхнего уровня. Используйте переопределение для отдельного канала, чтобы принудительно включить или отключить один канал.

OpenClaw опрашивает не более 45 уникальных пользователей в минуту для каждой учётной записи Slack, сохраняет первый результат без пробуждения агента и пробуждает его только при наблюдаемом переходе из `away` в `active`. Для каждой пары учётной записи Slack и пользователя действует постоянный 8-часовой период ожидания, даже если этот человек участвует в нескольких ветках. Событие направляется только в последнюю активную подходящую беседу этого человека и предписывает агенту обратиться к памяти/вики и известному контексту часового пояса, прежде чем решать, следует ли отправить одно короткое приветствие. Агент может не отвечать.

Токену бота требуется `users:read`, уже включённое в рекомендуемый манифест. События присутствия недоступны для установок Enterprise Grid на уровне всей организации.

## Справочник по конфигурации

Основной справочник: [Справочник по конфигурации — Slack](/ru/gateway/config-channels#slack).

<Accordion title="Ключевые поля Slack">

- режим/аутентификация: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ к личным сообщениям: `dm.enabled`, `dmPolicy`, `allowFrom` (устаревшие: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- переключатель совместимости: `dangerouslyAllowNameMatching` (аварийный вариант; не включайте без необходимости)
- доступ к каналам: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- ветки/история: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- пробуждение по присутствию: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; по умолчанию `off`)
- доставка: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- предпросмотр: `unfurlLinks` (по умолчанию: `false`), `unfurlMedia` для управления предпросмотром ссылок и медиа `chat.postMessage`; установите `unfurlLinks: true`, чтобы снова включить предпросмотр ссылок
- эксплуатация/возможности: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Нет ответов в каналах">
    Проверьте по порядку:

    - `groupPolicy`
    - список разрешённых каналов (`channels.slack.channels`) — **ключами должны быть идентификаторы каналов** (`C12345678`), а не названия (`#channel-name`). Ключи на основе названий незаметно не работают при `groupPolicy: "allowlist"`, поскольку маршрутизация каналов по умолчанию в первую очередь использует идентификаторы. Чтобы найти идентификатор: щёлкните канал в Slack правой кнопкой мыши → **Copy link** — значение `C...` в конце URL-адреса является идентификатором канала.
    - `requireMention`
    - список разрешённых `users` для отдельного канала
    - `messages.groupChat.visibleReplies`: для обычных запросов группы/канала по умолчанию используется `"automatic"`. Если включено `"message_tool"` и журналы содержат текст ассистента без вызова `message(action=send)`, модель не использовала видимый путь инструмента сообщений. В этом режиме итоговый текст остаётся приватным; проверьте подробный журнал Gateway на наличие метаданных подавленной полезной нагрузки или установите значение `"automatic"`, если требуется публиковать каждый обычный итоговый ответ ассистента через устаревший путь.
    - `messages.groupChat.unmentionedInbound`: если установлено значение `"room_event"`, разрешённые сообщения канала без упоминаний считаются фоновым контекстом и не вызывают ответа, пока агент не вызовет инструмент `message`. См. [Фоновые события комнаты](/ru/channels/ambient-room-events).

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
    - подтверждения сопряжения / записи списка разрешений (`dmPolicy: "open"` по-прежнему требует `channels.slack.allowFrom: ["*"]`)
    - групповые личные сообщения используют обработку MPIM; включите `channels.slack.dm.groupEnabled` и, если настроено, добавьте MPIM в `channels.slack.dm.groupChannels`
    - события личных сообщений Slack Assistant: подробные журналы с упоминанием `drop message_changed`
      обычно означают, что Slack отправил событие отредактированной ветки Assistant без
      доступного для восстановления отправителя-человека в метаданных сообщения

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не подключается">
    Проверьте токены бота и приложения, а также включение Socket Mode в настройках приложения Slack.
    Токен уровня приложения должен иметь `connections:write`, а токен OAuth пользователя бота
    должен относиться к тому же приложению и рабочему пространству Slack, что и токен приложения.

    Если `openclaw channels status --probe --json` показывает `botTokenStatus` или
    `appTokenStatus: "configured_unavailable"`, учетная запись Slack
    настроена, но текущей среде выполнения не удалось получить значение,
    указанное через SecretRef.

    Записи журнала наподобие `slack socket mode failed to start; retry ...` означают устранимые
    ошибки запуска. При отсутствии областей доступа, отозванных токенах и недействительной аутентификации
    вместо этого происходит немедленный сбой. Запись `slack token mismatch ...` означает, что токен бота и токен приложения,
    вероятно, относятся к разным приложениям Slack; исправьте учетные данные приложения Slack.

  </Accordion>

  <Accordion title="Режим HTTP не получает события">
    Проверьте:

    - секрет подписи
    - путь Webhook
    - URL-адреса запросов Slack (события, интерактивные действия и команды с косой чертой)
    - уникальный `webhookPath` для каждой учетной записи HTTP
    - публичный URL завершает TLS-соединение и перенаправляет запросы на путь Gateway
    - путь `request_url` приложения Slack в точности совпадает с `channels.slack.webhookPath` (по умолчанию `/slack/events`)

    Если `signingSecretStatus: "configured_unavailable"` присутствует в снимках
    учетной записи, учетная запись HTTP настроена, но текущей среде выполнения не удалось
    получить секрет подписи, указанный через SecretRef.

    Повторяющаяся запись журнала `slack: webhook path ... already registered` означает, что две учетные записи HTTP
    используют один и тот же `webhookPath`; назначьте каждой учетной записи отдельный путь.

  </Accordion>

  <Accordion title="Нативные команды и команды с косой чертой не выполняются">
    Проверьте, какой режим предполагалось использовать:

    - режим нативных команд (`channels.slack.commands.native: true`) с соответствующими командами с косой чертой, зарегистрированными в Slack
    - или режим одной команды с косой чертой (`channels.slack.slashCommand.enabled: true`)

    Slack не создает и не удаляет команды с косой чертой автоматически. `commands.native: "auto"` не включает нативные команды Slack; используйте `true` и создайте соответствующие команды в приложении Slack. В режиме HTTP каждая команда Slack с косой чертой должна содержать URL Gateway. В Socket Mode полезная нагрузка команд поступает через WebSocket, а Slack игнорирует `slash_commands[].url`.

    Также проверьте `commands.useAccessGroups`, авторизацию личных сообщений, списки разрешенных каналов
    и списки разрешений `users` для отдельных каналов. Для заблокированных отправителей
    команд с косой чертой Slack возвращает временные ошибки, включая:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Справочник по вложенным медиафайлам

Slack может прикреплять загруженные медиафайлы к ходу агента, если загрузка файлов из Slack завершилась успешно и соблюдены ограничения размера. Аудиоклипы можно транскрибировать, файлы изображений можно передавать по пути распознавания медиафайлов или непосредственно модели ответа с поддержкой компьютерного зрения, а остальные файлы остаются доступными как контекст загружаемых файлов.

### Поддерживаемые типы медиафайлов

| Тип медиафайла                 | Источник             | Текущее поведение                                                                 | Примечания                                                               |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Аудиоклипы Slack               | URL файла Slack      | Загружаются и направляются в общий процесс транскрибирования аудио                 | Требуются `files:read` и рабочая модель или CLI `tools.media.audio`      |
| Изображения JPEG / PNG / GIF / WebP | URL файла Slack | Загружаются и прикрепляются к ходу для обработки с поддержкой компьютерного зрения | Ограничение на файл: `channels.slack.mediaMaxMb` (по умолчанию 20 МБ)                 |
| PDF-файлы                      | URL файла Slack      | Загружаются и предоставляются как файловый контекст для таких инструментов, как `download-file` или `pdf` | Входящая обработка Slack не преобразует PDF автоматически во входные изображения для компьютерного зрения |
| Другие файлы                   | URL файла Slack      | По возможности загружаются и предоставляются как файловый контекст                | Двоичные файлы не обрабатываются как входные изображения                  |
| Ответы в ветках                | Файлы начального сообщения ветки | Файлы корневого сообщения могут загружаться как контекст, если ответ не содержит собственных медиафайлов | Для начальных сообщений только с файлами используется заполнитель вложения |
| Сообщения с несколькими файлами | Несколько файлов Slack | Каждый файл оценивается независимо                                               | Обработка Slack ограничена восемью файлами на сообщение                   |

### Процесс входящей обработки

При поступлении сообщения Slack с файловыми вложениями:

1. OpenClaw загружает файл по приватному URL Slack с использованием токена бота.
2. После успешной загрузки файл записывается в хранилище медиафайлов.
3. Пути загруженных медиафайлов и типы содержимого добавляются во входящий контекст.
4. Аудиоклипы направляются в общий процесс транскрибирования; пути моделей и инструментов с поддержкой изображений могут использовать вложенные изображения из того же контекста.
5. Другие файлы остаются доступными как метаданные файлов или ссылки на медиафайлы для инструментов, способных их обрабатывать.

### Наследование вложений корневого сообщения ветки

Когда сообщение поступает в ветку (имеет родительский элемент `thread_ts`):

- Если сам ответ не содержит медиафайлов, а включенное корневое сообщение содержит файлы, Slack может загрузить корневые файлы как контекст начального сообщения ветки.
- Корневые файлы загружаются только при инициализации нового или сброшенного сеанса ветки. Последующие текстовые ответы используют существующий контекст сеанса и не прикрепляют корневые файлы повторно как новые медиафайлы.
- Вложения непосредственно в ответе имеют приоритет над вложениями корневого сообщения.
- Корневое сообщение, содержащее только файлы без текста, представляется заполнителем вложения, чтобы резервный механизм по-прежнему мог включить его файлы.

### Обработка нескольких вложений

Когда одно сообщение Slack содержит несколько файловых вложений:

- Каждое вложение обрабатывается независимо в рамках процесса обработки медиафайлов.
- Ссылки на загруженные медиафайлы объединяются в контексте сообщения.
- Порядок обработки соответствует порядку файлов Slack в полезной нагрузке события.
- Ошибка загрузки одного вложения не блокирует остальные.

### Ограничения размера, загрузки и моделей

- **Ограничение размера**: по умолчанию 20 МБ на файл. Настраивается через `channels.slack.mediaMaxMb`.
- **Ограничение транскрибирования аудио**: `tools.media.audio.maxBytes` также применяется, когда загруженный файл отправляется поставщику транскрибирования или CLI.
- **Ошибки загрузки**: файлы, которые Slack не может предоставить, URL с истекшим сроком действия, недоступные и слишком большие файлы, а также HTML-ответы страницы аутентификации или входа Slack пропускаются, а не помечаются как неподдерживаемые форматы.
- **Модель компьютерного зрения**: для анализа изображений используется активная модель ответа, если она поддерживает компьютерное зрение, либо модель изображений, настроенная в `agents.defaults.imageModel`.

### Известные ограничения

| Сценарий                                     | Текущее поведение                                                                  | Обходной путь                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Срок действия URL файла Slack истек          | Файл пропускается; ошибка не отображается                                          | Повторно загрузите файл в Slack                                               |
| Транскрибирование аудио недоступно           | Клип остается прикрепленным, но транскрипция не создается                          | Настройте `tools.media.audio` или установите поддерживаемый локальный CLI для транскрибирования |
| Клип без подписи не проходит проверку упоминания | Отбрасывается после приватного предварительного транскрибирования; транскрипция и загрузка удаляются | Настройте шаблон упоминания произнесенного имени, добавьте текстовое упоминание бота или используйте личное сообщение |
| Модель компьютерного зрения не настроена     | Вложения изображений сохраняются как ссылки на медиафайлы, но не анализируются как изображения | Настройте `agents.defaults.imageModel` или используйте модель ответа с поддержкой компьютерного зрения |
| Очень большие изображения (> 20 МБ по умолчанию) | Пропускаются согласно ограничению размера                                        | Увеличьте `channels.slack.mediaMaxMb`, если Slack это допускает                          |
| Пересланные или общие вложения               | Текст и размещенные в Slack изображения и файлы обрабатываются по мере возможности | Повторно отправьте их непосредственно в ветку OpenClaw                        |
| Вложения PDF                                 | Сохраняются как файловый или медийный контекст и не направляются автоматически в систему компьютерного зрения | Используйте `download-file` для метаданных файла или инструмент `pdf` для анализа PDF |

### Связанная документация

- [Процесс распознавания медиафайлов](/ru/nodes/media-understanding)
- [Аудио и голосовые заметки](/ru/nodes/audio)
- [Инструмент PDF](/ru/tools/pdf)

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Сопряжение" icon="link" href="/ru/channels/pairing">
    Сопряжение пользователя Slack с Gateway.
  </Card>
  <Card title="Группы" icon="users" href="/ru/channels/groups">
    Поведение каналов и групповых личных сообщений.
  </Card>
  <Card title="Маршрутизация каналов" icon="route" href="/ru/channels/channel-routing">
    Маршрутизация входящих сообщений агентам.
  </Card>
  <Card title="Безопасность" icon="shield" href="/ru/gateway/security">
    Модель угроз и усиление защиты.
  </Card>
  <Card title="Конфигурация" icon="sliders" href="/ru/gateway/configuration">
    Структура конфигурации и приоритеты.
  </Card>
  <Card title="Команды с косой чертой" icon="terminal" href="/ru/tools/slash-commands">
    Каталог команд и их поведение.
  </Card>
</CardGroup>
