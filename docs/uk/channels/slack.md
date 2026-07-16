---
read_when:
    - Налаштування Slack або налагодження режиму сокета, HTTP чи ретрансляції Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode, URL-адреси HTTP-запитів і режим ретрансляції)
title: Slack
x-i18n:
    generated_at: "2026-07-16T17:32:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Підтримка Slack охоплює приватні повідомлення та канали через інтеграції застосунків Slack. Типовим транспортом є Socket Mode; також підтримуються HTTP Request URLs. Режим ретрансляції призначений для керованих розгортань, у яких довірений маршрутизатор керує вхідним трафіком Slack.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Для приватних повідомлень Slack типовим є режим сполучення.
  </Card>
  <Card title="Команди з косою рискою" icon="terminal" href="/uk/tools/slash-commands">
    Поведінка нативних команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
</CardGroup>

## Вибір транспорту

Socket Mode і HTTP Request URLs мають однакову функціональність для обміну повідомленнями, команд із косою рискою, App Home та інтерактивних можливостей. Вибирайте відповідно до архітектури розгортання, а не набору функцій.

| Аспект                       | Socket Mode (типово)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Загальнодоступна URL-адреса Gateway | Не потрібна                                                                                                                                         | Потрібна (DNS, TLS, зворотний проксі або тунель)                                                                   |
| Вихідна мережа               | Має бути доступне вихідне WSS-з’єднання з `wss-primary.slack.com`                                                                                            | Без вихідного WS; лише вхідний HTTPS                                                                             |
| Необхідні токени             | Токен бота + App-Level Token з `connections:write`                                                                                                 | Токен бота + Signing Secret                                                                                     |
| Ноутбук розробника / за брандмауером | Працює без додаткового налаштування                                                                                                                                          | Потрібен загальнодоступний тунель (ngrok, Cloudflare Tunnel, Tailscale Funnel) або проміжний Gateway                          |
| Горизонтальне масштабування  | Один сеанс Socket Mode на застосунок для кожного хоста; для кількох Gateway потрібні окремі застосунки Slack                                                                 | Обробник POST без стану; кілька реплік Gateway можуть спільно використовувати один застосунок за балансувальником навантаження                     |
| Кілька облікових записів на одному Gateway | Підтримується; кожен обліковий запис відкриває власне WS-з’єднання                                                                                                             | Підтримується; кожному обліковому запису потрібен унікальний `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували |
| Транспорт команд із косою рискою | Доставляються через WS-з’єднання; `slash_commands[].url` ігнорується                                                                                  | Slack надсилає POST до `slash_commands[].url`; поле обов’язкове для передавання команди                           |
| Підписування запитів         | Не використовується (автентифікація виконується за допомогою App-Level Token)                                                                                                               | Slack підписує кожен запит; OpenClaw перевіряє його за допомогою `signingSecret`                                              |
| Відновлення після розриву з’єднання | Автоматичне повторне підключення Slack SDK увімкнено; OpenClaw також перезапускає невдалі сеанси Socket Mode з обмеженою експоненційною затримкою. Застосовуються налаштування транспорту для тайм-ауту pong. | Немає постійного з’єднання, яке може розірватися; повторні спроби Slack виконуються для кожного запиту                                           |

<Note>
  **Вибирайте Socket Mode** для хостів з одним Gateway, ноутбуків розробників і локальних мереж, які можуть встановлювати вихідне з’єднання з `*.slack.com`, але не можуть приймати вхідний HTTPS.

**Вибирайте HTTP Request URLs**, якщо запускаєте кілька реплік Gateway за балансувальником навантаження, якщо вихідний WSS заблоковано, але вхідний HTTPS дозволено, або якщо вебхуки Slack уже завершуються на зворотному проксі.
</Note>

<Warning>
  Slack може підтримувати кілька з’єднань Socket Mode для одного застосунку та доставляти кожне корисне навантаження через будь-яке з них. Тому окремим шлюзам OpenClaw, які спільно використовують один застосунок Slack, потрібна однакова конфігурація маршрутизації та авторизації. Інакше використовуйте окремий застосунок Slack для кожного шлюзу, єдину точку входу ретрансляції або HTTP Request URLs за балансувальником навантаження. Див. [Використання Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Режим ретрансляції

Режим ретрансляції відокремлює вхідний трафік Slack від Gateway OpenClaw. Довірений маршрутизатор керує єдиним з’єднанням Slack Socket Mode, вибирає цільовий шлюз і пересилає типізовану подію через автентифіковане вебсокет-з’єднання. Gateway і надалі використовує власний токен бота для вихідних викликів Slack Web API.

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

URL-адреса ретрансляції має використовувати `wss://`, якщо її ціллю не є localhost. Вважайте токен пред’явника й таблицю маршрутів маршрутизатора частиною межі авторизації Slack: маршрутизовані події надходять до звичайного обробника повідомлень Slack як авторизовані активації. Наданий маршрутизатором `slack_identity` у кадрі вебсокета `hello` може задавати типові ім’я користувача та піктограму для вихідних повідомлень; явно задані викликачем ідентифікаційні дані мають пріоритет. З’єднання ретрансляції відновлюється з такою самою обмеженою експоненційною затримкою, як і Socket Mode, та очищає надані маршрутизатором ідентифікаційні дані під час кожного відключення.

### Загальноорганізаційні інсталяції Enterprise Grid

Один обліковий запис Slack може отримувати повідомлення з кожного робочого простору, охопленого
загальноорганізаційною інсталяцією Enterprise Grid. Виберіть прямий Socket Mode або HTTP
Request URLs; режим ретрансляції не підтримується для корпоративних облікових записів. Обидва
наведені нижче маніфести з мінімальними привілеями вмикають лише шлях подій V1 `message` і `app_mention`,
негайні відповіді та реакції стану, якими керує слухач.

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

Попросіть адміністратора або власника організації Enterprise Grid схвалити застосунок, установити його на
рівні організації та вибрати робочі простори, які охоплюватиме інсталяція.
Перед запуском OpenClaw переконайтеся, що застосунок доступний у кожному потрібному робочому просторі.
Створіть токен рівня застосунку з `connections:write` для Socket Mode,
а потім скопіюйте токен бота із загальноорганізаційної інсталяції. Налаштуйте обліковий запис, який
використовує токен бота із загальноорганізаційної інсталяції:

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

Використовуйте режим HTTP, коли Gateway має загальнодоступну кінцеву точку HTTPS і не відкриває
з’єднання Socket Mode. Замініть URL-адресу в прикладі загальнодоступною URL-адресою
`webhookPath` Gateway (типово `/slack/events`):

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

Попросіть адміністратора або власника організації Enterprise Grid схвалити застосунок, установити його на
рівні організації та вибрати робочі простори, які охоплюватиме інсталяція.
Після того як Slack перевірить Request URL, скопіюйте токен бота загальноорганізаційної інсталяції та
**Basic Information -> App Credentials -> Signing Secret** застосунку. Налаштуйте
корпоративний обліковий запис із тим самим шляхом Request URL:

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

Під час запуску OpenClaw перевіряє `enterpriseOrgInstall` за допомогою Slack `auth.test`.
Запуск завершується помилкою для токена загальноорганізаційної інсталяції без прапорця або токена робочого простору з прапорцем.
Slack залишається джерелом істини щодо того, які робочі простори надали дозвіл на
інсталяцію; потім OpenClaw застосовує налаштовані політики каналів, користувачів,
приватних повідомлень і згадок до кожної доставленої події. Enterprise V1 відхиляє всі створені ботом
події `message` і `app_mention` перед передаванням незалежно від
`allowBots`, оскільки загальноорганізаційні інсталяції не надають стабільної ідентичності
бота з прив’язкою до робочого простору для запобігання циклам.

Підтримка Enterprise навмисно обмежена прямим Socket Mode або HTTP,
подіями `message` і `app_mention` та негайними відповідями на них. Режим ретрансляції,
команди з косою рискою, інтерактивні дії, App Home, слухачі подій реакцій, закріплення, інструменти дій Slack,
нативні схвалення Slack, прив’язки, доставка в черзі або за розкладом
і проактивне надсилання недоступні для корпоративного облікового запису. Вихідні
реакції підтвердження, набору тексту та стану підтримуються через
клієнт Slack, яким керує слухач, і потребують `reactions:write`; вхідні сповіщення
про реакції та інструменти дій із реакціями залишаються недоступними.

Негайні відповіді повторно використовують стандартну поведінку доставки Slack для фрагментів,
медіа, метаданих, резервного визначення ідентичності, розгортання посилань і підтверджень, але лише доки
перевірений клієнт, що належить слухачеві, залишається в активному циклі обробки події. Черга надсилання
в пам’яті та записи участі в гілках розділяються за робочим простором цієї
події; сам клієнт ніколи не серіалізується й не зберігається.

Ключі політики каналів і записи `dm.groupChannels` мають використовувати необроблені стабільні ідентифікатори каналів Slack або
форму `channel:<id>`. OpenClaw нормалізує обидві форми до необробленого ідентифікатора каналу для
зіставлення під час виконання; префікси `slack:`, `group:` і `mpim:` спричиняють помилку запуску.
Записи політики користувачів мають використовувати стабільні ідентифікатори користувачів Slack; імена, слаги, відображувані імена
та адреси електронної пошти спричиняють помилку запуску. Ідентифікатори мають використовувати канонічний префікс
і основну частину Slack у верхньому регістрі (наприклад, `C0123456789` або `U0123456789`); варіанти в нижньому регістрі та
короткі схожі значення спричиняють помилку запуску. Корпоративні облікові записи не можуть увімкнути
`dangerouslyAllowNameMatching`. Корпоративні облікові записи можуть установити глобальне
`mentionPatterns.mode`, але `mentionPatterns.allowIn` і
`mentionPatterns.denyIn` спричиняють помилку запуску, оскільки прості ідентифікатори каналів Slack не
містять кваліфікатора робочого простору й можуть повторно використовуватися в різних робочих просторах. Установлення в робочих просторах
зберігають наявну поведінку шаблонів згадок у межах області. Кожен прийнятий робочий простір
отримує окремі ідентичності маршрутизації, сеансу, стенограми, усунення дублікатів, історії та кешу,
навіть якщо ідентифікатори Slack збігаються. У потоці `message` підтримуються звичайні повідомлення користувачів
і створені користувачами події `file_share`; інші підтипи повідомлень
відхиляються до авторизації або обробки системних подій.

Корпоративні особисті повідомлення мають бути або вимкнені (`dm.enabled=false` чи
`dmPolicy="disabled"`), або явно відкриті за допомогою `dmPolicy="open"` та
чинного облікового запису `allowFrom`, що містить буквальне значення `"*"`. Порожній
список дозволів або ідентифікатори окремих користувачів без `"*"` спричиняють помилку запуску. Сполучення та
покористувацькі списки дозволів для особистих повідомлень відхиляються, оскільки ідентифікатори користувачів Slack не
містять кваліфікатора робочого простору в цих сховищах авторизації. Політика каналів і відправників
і надалі застосовується до повідомлень каналів.

## Установлення

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` реєструє й вмикає плагін. Він нічого не робить, доки не буде налаштовано застосунок Slack і параметри каналів нижче. Загальні правила встановлення плагінів див. у розділі [Плагіни](/uk/tools/plugin).

## Швидке налаштування

Маніфести в цьому розділі створюють установлення в межах робочого простору. Для
встановлення на рівні організації Enterprise Grid натомість використовуйте спеціальний
[маніфест і робочий процес для всієї організації](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Режим сокета (типово)">
    <Steps>
      <Step title="Створення нового застосунку Slack">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть робочий простір → вставте один із наведених нижче маніфестів → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "З’єднувач Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw з’єднує гілки помічника Slack з агентами OpenClaw.",
      "suggested_prompts": [
        { "title": "Що ви вмієте?", "message": "Із чим ви можете мені допомогти?" },
        {
          "title": "Підсумувати цей канал",
          "message": "Підсумуйте нещодавню активність у цьому каналі."
        },
        { "title": "Створити чернетку відповіді", "message": "Допоможіть мені створити чернетку відповіді." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Надіслати повідомлення до OpenClaw",
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
    "description": "З’єднувач Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw з’єднує гілки помічника Slack з агентами OpenClaw.",
      "suggested_prompts": [
        { "title": "Що ви вмієте?", "message": "Із чим ви можете мені допомогти?" },
        {
          "title": "Підсумувати цей канал",
          "message": "Підсумуйте нещодавню активність у цьому каналі."
        },
        { "title": "Створити чернетку відповіді", "message": "Допоможіть мені створити чернетку відповіді." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Надіслати повідомлення до OpenClaw",
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
          **Рекомендований** варіант відповідає повному набору функцій плагіна Slack: App Home, команди з косою рискою, файли, реакції, закріплення, групові особисті повідомлення та читання емодзі й груп користувачів. Виберіть **Мінімальний**, якщо політика робочого простору обмежує області доступу — він охоплює особисті повідомлення, історію каналів і груп, згадки та команди з косою рискою, але не підтримує файли, реакції, закріплення, групові особисті повідомлення (`mpim:*`), `emoji:read` і `usergroups:read`. Обґрунтування кожної області доступу та додаткові параметри, як-от додаткові команди з косою рискою, див. у розділі [Контрольний список маніфесту й областей доступу](#manifest-and-scope-checklist).
        </Note>

        Після створення застосунку в Slack:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: додайте `connections:write`, збережіть і скопіюйте токен рівня застосунку.
        - **Install App -> Install to Workspace**: скопіюйте OAuth-токен користувача-бота.

      </Step>

      <Step title="Налаштування OpenClaw">

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

        Резервне використання змінних середовища (лише типовий обліковий запис):

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

  <Tab title="URL-адреси HTTP-запитів">
    <Steps>
      <Step title="Створення нового застосунку Slack">
        Відкрийте [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → виберіть робочий простір → вставте один із наведених нижче маніфестів → замініть `https://gateway-host.example.com/slack/events` на загальнодоступну URL-адресу Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "З’єднувач Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw з’єднує гілки помічника Slack з агентами OpenClaw.",
      "suggested_prompts": [
        { "title": "Що ви вмієте?", "message": "Із чим ви можете мені допомогти?" },
        {
          "title": "Підсумувати цей канал",
          "message": "Підсумуйте нещодавню активність у цьому каналі."
        },
        { "title": "Створити чернетку відповіді", "message": "Допоможіть мені створити чернетку відповіді." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Надіслати повідомлення до OpenClaw",
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
    "description": "Конектор Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw з’єднує потоки асистента Slack з агентами OpenClaw.",
      "suggested_prompts": [
        { "title": "Що ти вмієш?", "message": "Із чим ти можеш мені допомогти?" },
        {
          "title": "Підсумувати цей канал",
          "message": "Підсумуй нещодавню активність у цьому каналі."
        },
        { "title": "Створити чернетку відповіді", "message": "Допоможи мені створити чернетку відповіді." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Надіслати повідомлення до OpenClaw",
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
          Варіант **Рекомендовано** відповідає повному набору можливостей плагіна Slack; варіант **Мінімальний** виключає файли, реакції, закріплення, групові приватні повідомлення (`mpim:*`), `emoji:read` і `usergroups:read` для робочих просторів із жорсткими обмеженнями. Обґрунтування кожної області доступу наведено в розділі [Контрольний список маніфесту й областей доступу](#manifest-and-scope-checklist).
        </Note>

        <Info>
          Усі три поля URL (`slash_commands[].url`, `event_subscriptions.request_url` і `interactivity.request_url` / `message_menu_options_url`) вказують на ту саму кінцеву точку OpenClaw. Схема маніфесту Slack вимагає задавати їм окремі назви, але OpenClaw маршрутизує дані за типом корисного навантаження, тому достатньо одного `webhookPath` (типове значення — `/slack/events`). Команди з похилою рискою без `slash_commands[].url` у режимі HTTP без повідомлень не виконують жодних дій.
        </Info>

        Після створення застосунку в Slack:

        - **Basic Information → App Credentials**: скопіюйте **Signing Secret** для перевірки запитів.
        - **Install App -> Install to Workspace**: скопіюйте Bot User OAuth Token.

      </Step>

      <Step title="Налаштування OpenClaw">

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

        Призначте кожному обліковому запису окремий `webhookPath` (типове значення — `/slack/events`), щоб реєстрації не конфліктували.
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

## Налаштування транспорту Socket Mode

За замовчуванням OpenClaw установлює для клієнта Slack SDK у Socket Mode час очікування pong у 15 секунд. Змінюйте налаштування транспорту лише тоді, коли потрібне налаштування для певного робочого простору або хоста:

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

Використовуйте це лише для робочих просторів Socket Mode, у журналах яких фіксуються помилки очікування pong або серверного ping вебсокета Slack, чи для хостів із відомим голодуванням циклу подій. `clientPingTimeout` — це час очікування pong після надсилання клієнтського ping засобами SDK; `serverPingTimeout` — час очікування серверних ping від Slack. Повідомлення та події застосунку залишаються станом застосунку, а не сигналами працездатності транспорту.

Примітки:

- `socketMode` ігнорується в режимі HTTP Request URL.
- Базові налаштування `channels.slack.socketMode` застосовуються до всіх облікових записів Slack, якщо їх не перевизначено. Перевизначення для окремого облікового запису задаються через `channels.slack.accounts.<accountId>.socketMode`; оскільки це перевизначення об’єктом, додайте всі поля налаштування сокета, потрібні для цього облікового запису.
- Лише `clientPingTimeout` має типове значення OpenClaw (`15000`). `serverPingTimeout` і `pingPongLoggingEnabled` передаються до Slack SDK лише тоді, коли їх налаштовано.
- Затримка між повторними спробами перезапуску Socket Mode починається приблизно з 2 секунд і обмежується приблизно 30 секундами. Після відновлюваних помилок запуску, очікування запуску та роз’єднання спроби повторюються, доки канал не зупиниться. Постійні помилки облікового запису й облікових даних, як-от недійсна автентифікація, відкликані токени або відсутні області доступу, спричиняють негайну відмову замість нескінченних повторних спроб.

## Контрольний список маніфесту й областей доступу

Базовий маніфест застосунку Slack однаковий для Socket Mode і HTTP Request URL. Відрізняються лише блок `settings` (і `url` команди з похилою рискою).

Базовий маніфест (типовий для Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Конектор Slack для OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw з’єднує потоки асистента Slack з агентами OpenClaw.",
      "suggested_prompts": [
        { "title": "Що ти вмієш?", "message": "Із чим ти можеш мені допомогти?" },
        {
          "title": "Підсумувати цей канал",
          "message": "Підсумуй нещодавню активність у цьому каналі."
        },
        { "title": "Створити чернетку відповіді", "message": "Допоможи мені створити чернетку відповіді." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Надіслати повідомлення до OpenClaw",
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

Для **режиму HTTP Request URL** замініть `settings` варіантом HTTP і додайте `url` до кожної команди з похилою рискою. Потрібна загальнодоступна URL-адреса:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Надіслати повідомлення до OpenClaw",
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

Додайте інші можливості, що розширюють наведені вище типові налаштування.

Типовий маніфест вмикає вкладку **Home** на сторінці Slack App Home і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку Home, OpenClaw публікує безпечне типове подання Home з `views.publish`; корисне навантаження розмови та приватна конфігурація до нього не входять. Коли ввімкнено режим однієї команди з похилою рискою, у підказці команди використовується `channels.slack.slashCommand.name`; в інсталяціях із нативними командами або без команд із похилою рискою ця підказка відсутня. Вкладка **Messages** залишається ввімкненою для приватних повідомлень Slack. Маніфест також вмикає потоки асистента Slack за допомогою `features.assistant_view`, `assistant:write`, `assistant_thread_started` і `assistant_thread_context_changed`; потоки асистента спрямовуються до власних сеансів потоків OpenClaw і зберігають доступність наданого Slack контексту потоку для агента.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні команди з похилою рискою">

    Замість однієї налаштованої команди можна використовувати кілька [нативних команд із похилою рискою](#commands-and-slash-behavior), але з певними особливостями:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - В одному застосунку Slack одночасно можна зареєструвати не більше 25 команд із похилою рискою (обмеження платформи Slack).

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (типово)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Почати новий сеанс",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Скинути поточний сеанс"
    },
    {
      "command": "/compact",
      "description": "Стиснути контекст сеансу",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Зупинити поточний запуск"
    },
    {
      "command": "/session",
      "description": "Керувати завершенням прив’язки до гілки",
      "usage_hint": "idle <duration|off> або max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Установити рівень міркування",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Перемкнути докладне виведення",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Показати або встановити швидкий режим",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Перемкнути видимість міркувань",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Перемкнути режим із підвищеними привілеями",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Показати або встановити типові параметри виконання",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Схвалити або відхилити запити на схвалення, що очікують",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Показати або встановити модель",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Перелічити постачальників і моделі",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Показати коротку довідку"
    },
    {
      "command": "/commands",
      "description": "Показати згенерований каталог команд"
    },
    {
      "command": "/tools",
      "description": "Показати, що поточний агент може використовувати зараз",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Показати стан середовища виконання, зокрема використання або квоту постачальника, якщо доступно"
    },
    {
      "command": "/tasks",
      "description": "Перелічити активні й нещодавні фонові завдання поточного сеансу"
    },
    {
      "command": "/context",
      "description": "Пояснити, як формується контекст",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Показати вашу ідентичність відправника"
    },
    {
      "command": "/skill",
      "description": "Запустити навичку за назвою",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Поставити побічне запитання без зміни контексту сеансу",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Поставити побічне запитання без зміни контексту сеансу",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Керувати нижнім колонтитулом використання або показати зведення витрат",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL-адреси HTTP-запитів">
        Використовуйте той самий список `slash_commands`, що й для режиму Socket Mode вище, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Почати новий сеанс",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Показати коротку довідку",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Повторіть це значення `url` для кожної команди у списку.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необов’язкові області авторства (операції запису)">
    Додайте область бота `chat:write.customize`, якщо потрібно, щоб вихідні повідомлення використовували ідентичність активного агента (власні ім’я користувача та піктограму) замість типової ідентичності застосунку Slack.

    Якщо використовується піктограма емодзі, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові області токена користувача (операції читання)">
    Якщо налаштовано `channels.slack.userToken`, типовими областями читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви залежите від читання результатів пошуку Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- `botToken` + `appToken` потрібні для Socket Mode.
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- Для режиму ретрансляції потрібен `botToken` разом із `relay.url`, `relay.authToken` і `relay.gatewayId`; токен застосунку або секрет підпису не використовується.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` і `userToken` приймають рядки
  звичайного тексту або об’єкти SecretRef.
- Токени конфігурації перевизначають резервні значення зі змінних середовища.
- Резервні значення змінних середовища `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` і `SLACK_USER_TOKEN` застосовуються лише до типового облікового запису.
- `userToken` за замовчуванням працює лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує для кожних облікових даних поля `*Source` і `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан має значення `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше джерело секрету, яке не вбудоване безпосередньо, але поточний шлях команди чи середовища виконання
  не зміг отримати фактичне значення.
- У режимі HTTP включено `signingSecretStatus`; у Socket Mode
  обов’язковою парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій і читання каталогу, якщо налаштовано, перевага може надаватися токену користувача. Для запису перевага залишається за токеном бота; запис із токеном користувача дозволено лише за умови `userTokenReadOnly: false` і недоступності токена бота.
</Tip>

## Дії та обмеження

Дії Slack контролюються параметром `channels.slack.actions.*`.

Доступні групи дій у поточних інструментах Slack:

| Група      | Типове значення |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії з повідомленнями Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ідентифікатори файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередній перегляд зображень або локальні метадані файлів для інших типів файлів.

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика особистих повідомлень">
    `channels.slack.dmPolicy` контролює доступ до особистих повідомлень. `channels.slack.allowFrom` — канонічний список дозволів для особистих повідомлень.

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`)
    - `disabled`

    Прапорці особистих повідомлень:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (для групових особистих повідомлень типово false)
    - `dm.groupChannels` (необов’язковий список дозволів MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхнє власне значення `allowFrom` не встановлено.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` усе ще зчитуються для сумісності. `openclaw doctor --fix` переносить їх до `dmPolicy` і `allowFrom`, якщо це можливо без зміни доступу.

    Для спарювання в особистих повідомленнях використовується `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналу">
    `channels.slack.groupPolicy` контролює обробку каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Список дозволів каналів міститься в `channels.slack.channels` і **має використовувати стабільні ідентифікатори каналів Slack** (наприклад, `C12345678`) як ключі конфігурації.

    Примітка щодо середовища виконання: якщо `channels.slack` повністю відсутній (налаштування лише через змінні середовища), середовище виконання повертається до `groupPolicy="allowlist"` і записує попередження до журналу (навіть якщо встановлено `channels.defaults.groupPolicy`).

    Визначення назви або ідентифікатора:

    - записи списку дозволів каналів і списку дозволів особистих повідомлень визначаються під час запуску, якщо це дозволяє доступ за токеном
    - невизначені записи з назвами каналів зберігаються відповідно до конфігурації, але типово ігноруються під час маршрутизації
    - вхідна авторизація та маршрутизація каналів типово насамперед використовують ідентифікатори; пряме зіставлення імені користувача або слага потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі назв (`#channel-name` або `channel-name`) **не** збігаються за `groupPolicy: "allowlist"`. Пошук каналу типово насамперед використовує ідентифікатор, тому ключ на основі назви ніколи не забезпечить успішну маршрутизацію, а всі повідомлення в цьому каналі буде мовчки заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, тому ключ на основі назви видається працездатним.

    Завжди використовуйте ідентифікатор каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою миші → **Copy link** — ідентифікатор (`C...`) розташований наприкінці URL-адреси.

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

    Неправильно (мовчки блокується за `groupPolicy: "allowlist"`):

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

  <Tab title="Згадки та користувачі каналу">
    Повідомлення каналів типово потребують згадки.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач-бот є учасником цієї групи користувачів; потребує `usergroups:read`
    - шаблони регулярних виразів для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в гілці боту (вимкнено, коли `thread.requireExplicitMention` має значення `true`)

    Налаштування для окремих каналів (`channels.slack.channels.<id>`; назви — лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; перевизначає режим відповіді облікового запису або типу чату для цього каналу)
    - `users` (список дозволів)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` або шаблон-замінник `"*"`
      (застарілі ключі без префікса все ще зіставляються лише з `id:`)

    `ignoreOtherMentions` (типово `false`) відкидає повідомлення каналу, які згадують іншого користувача або групу користувачів, але не цього бота. Особисті повідомлення та групові особисті повідомлення (MPIM) не зачіпаються. Фільтр потребує визначеного ідентифікатора користувача бота з `auth.test`; якщо ця ідентичність недоступна (наприклад, ідентичність лише з токеном користувача), шлюз відмовляє у відкритому режимі, і повідомлення проходять без змін.

    `allowBots` діє консервативно для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються, лише якщо бот-відправник явно зазначений у списку дозволених `users` цієї кімнати або якщо принаймні один явний ідентифікатор власника Slack з `channels.slack.allowFrom` наразі є учасником кімнати. Символи узагальнення та записи власників за відображуваним ім’ям не підтверджують присутність власника. Для визначення присутності власника використовується Slack `conversations.members`; переконайтеся, що застосунок має відповідну область читання для типу кімнати (`channels:read` для загальнодоступних каналів, `groups:read` для приватних каналів). Якщо пошук учасника завершується помилкою, OpenClaw відкидає повідомлення кімнати, створене ботом.

    Прийняті повідомлення Slack, створені ботом, використовують спільний [захист від зациклення ботів](/uk/channels/bot-loop-protection). Налаштуйте `channels.defaults.botLoopProtection` для типового бюджету, а потім перевизначте його за допомогою `channels.slack.botLoopProtection` або `channels.slack.channels.<id>.botLoopProtection`, якщо робочому простору чи каналу потрібне інше обмеження.

  </Tab>
</Tabs>

## Гілки, сеанси та теги відповідей

- Особисті повідомлення маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- Прив’язки маршрутів Slack приймають необроблені ідентифікатори співрозмовників, а також форми цілей Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- За типового значення `session.dmScope=main` особисті повідомлення Slack об’єднуються в основний сеанс агента.
- Сеанси каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Звичайні повідомлення верхнього рівня в каналі залишаються в окремому сеансі каналу, навіть коли `replyToMode` має значення, відмінне від `off`.
- Відповіді в гілках Slack використовують батьківський Slack `thread_ts` для суфіксів сеансів (`:thread:<threadTs>`), навіть коли створення гілок для вихідних відповідей вимкнено за допомогою `replyToMode="off"`.
- OpenClaw додає відповідний кореневий допис каналу верхнього рівня до `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, якщо очікується, що цей кореневий допис започаткує видиму гілку Slack, завдяки чому кореневий допис і подальші відповіді в гілці використовують один сеанс OpenClaw. Це стосується подій `app_mention`, явних збігів згадок бота або налаштованих шаблонів згадок, а також каналів `requireMention: false` зі значенням `replyToMode`, відмінним від `off`.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує кількістю наявних повідомлень гілки, які отримуються під час запуску нового сеансу гілки (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, неявні згадки у гілці пригнічуються, тому бот відповідає лише на явні згадки `@bot` усередині гілок, навіть якщо бот уже брав участь у гілці. Без цього відповіді в гілці за участю бота обходять шлюз `requireMention`.

Керування створенням гілок для відповідей:

- `channels.slack.channels.<id>.replyToMode`: перевизначення для окремого каналу щодо повідомлень у каналах і приватних каналах Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються теги відповідей, задані вручну:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Для явних відповідей у гілках Slack з інструмента `message` установіть `replyBroadcast: true` разом із `action: "send"` і `threadId` або `replyTo`, щоб Slack також транслював відповідь із гілки до батьківського каналу. Це відповідає прапорцю Slack `chat.postMessage` `reply_broadcast` і підтримується лише для надсилання тексту або Block Kit, але не для завантаження медіафайлів.

Коли виклик інструмента `message` виконується всередині гілки Slack і спрямований до того самого каналу, OpenClaw зазвичай успадковує поточну гілку Slack відповідно до чинного `replyToMode` для облікового запису, типу чату або окремого каналу. Автоматичні відповіді та виклики `send` або `upload-file` у тому самому каналі використовують те саме перевизначення для окремого каналу. Установіть `topLevel: true` у `action: "send"` або `action: "upload-file"`, щоб примусово створити нове повідомлення батьківського каналу. `threadId: null` приймається як та сама відмова від успадкування на верхньому рівні.

<Note>
`replyToMode="off"` вимикає створення гілок для вихідних відповідей Slack, зокрема явні теги `[[reply_to_*]]`. Це не об’єднує вхідні сеанси гілок Slack: повідомлення, уже опубліковані в гілці Slack, і надалі маршрутизуються до сеансу `:thread:<threadTs>`. Це відрізняється від Telegram, де явні теги й далі враховуються в режимі `"off"`. Гілки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими безпосередньо в чаті.
</Note>

## Реакції-підтвердження

`ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення. `ackReactionScope` визначає, _коли_ це емодзі фактично надсилається.

Типово підтвердження залишається статичним, а вбудований стан гілки асистента Slack показує перебіг виконання за допомогою змінних повідомлень про завантаження. Установіть `messages.statusReactions.enabled: true`, щоб увімкнути життєвий цикл реакцій «у черзі»/«обдумування»/«інструмент»/«завершено»/«помилка».

### Емодзі (`ackReaction`)

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервне емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше `"eyes"` / 👀)

Примітки:

- Slack очікує короткі коди (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

### Область дії (`messages.ackReactionScope`)

Провайдер Slack зчитує область дії з `messages.ackReactionScope` (типово `"group-mentions"`). Наразі перевизначення на рівні облікового запису або каналу Slack немає; значення є глобальним для Gateway.

Значення:

- `"all"`: реагувати в особистих повідомленнях і групах, зокрема на фонові події кімнат.
- `"direct"`: реагувати лише в особистих повідомленнях.
- `"group-all"`: реагувати на кожне групове повідомлення, крім фонових подій кімнат (без особистих повідомлень).
- `"group-mentions"` (типово): реагувати в групах, але лише коли згадано бота (або в групах зі згадуванням, які це ввімкнули). **Особисті повідомлення виключено.**
- `"off"` / `"none"`: ніколи не реагувати.

<Note>
Типова область дії (`"group-mentions"`) не запускає реакції-підтвердження в прямих повідомленнях або для фонових подій кімнат. Щоб бачити налаштоване `ackReaction` (наприклад, `"eyes"`) у вхідних особистих повідомленнях Slack і подіях неактивних кімнат, установіть для `messages.ackReactionScope` значення `"all"`. `messages.ackReactionScope` зчитується під час запуску провайдера Slack, тому для набрання зміною чинності потрібно перезапустити Gateway.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // реагувати в особистих повідомленнях і групах
  },
}
```

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду наживо:

- `off`: вимкнути потокове передавання попереднього перегляду наживо.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим результатом.
- `block`: додавати порційні оновлення попереднього перегляду.
- `progress`: показувати текст стану виконання під час генерування, а потім надіслати остаточний текст.
- `streaming.preview.toolProgress`: коли попередній перегляд чернетки активний, спрямовувати оновлення інструментів і перебігу виконання до того самого редагованого повідомлення попереднього перегляду (типово: `true`). Установіть `false`, щоб залишити окремі повідомлення інструментів і перебігу виконання.
- `streaming.preview.commandText` / `streaming.progress.commandText`: установіть `status`, щоб зберегти компактні рядки перебігу виконання інструментів, приховавши необроблений текст команд/виконання (типово: `raw`).

Приховати необроблений текст команд/виконання, зберігши компактні рядки перебігу виконання:

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

`channels.slack.streaming.nativeTransport` керує вбудованим потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (типово: `true`).

Вбудовані картки завдань перебігу виконання Slack вмикаються окремо для режиму перебігу виконання. Установіть для `channels.slack.streaming.progress.nativeTaskCards` значення `true` разом із `channels.slack.streaming.mode="progress"`, щоб надсилати вбудовану картку плану/завдання Slack під час виконання роботи, а після завершення оновити ту саму картку завдання. Без цього прапорця режим перебігу виконання зберігає переносиму поведінку попереднього перегляду чернетки.

- Щоб з’явилися вбудоване потокове передавання тексту та стан гілки асистента Slack, має бути доступна гілка відповіді. Вибір гілки й надалі визначається `replyToMode`.
- Кореневі повідомлення каналів, групових чатів і особистих повідомлень верхнього рівня можуть і надалі використовувати звичайний попередній перегляд чернетки, коли вбудоване потокове передавання недоступне або гілки відповіді немає.
- Особисті повідомлення Slack верхнього рівня типово залишаються поза гілками, тому вони не показують вбудований потоковий перегляд або перегляд стану в стилі гілок Slack; натомість OpenClaw публікує та редагує попередній перегляд чернетки в особистому повідомленні.
- Медіафайли та нетекстові корисні дані використовують звичайне доставлення як резервний варіант.
- Остаточні медіаповідомлення та повідомлення про помилки скасовують очікувані редагування попереднього перегляду; відповідні остаточні текстові або блокові повідомлення надсилаються лише тоді, коли можуть редагувати попередній перегляд на місці.
- Якщо потокове передавання переривається помилкою посеред відповіді, OpenClaw переходить до звичайного доставлення решти корисних даних.

Використовувати попередній перегляд чернетки замість вбудованого потокового передавання тексту Slack:

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

Увімкнути вбудовані картки завдань перебігу виконання Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) — застарілий псевдонім для `channels.slack.streaming.mode`.
- логічний `channels.slack.streaming` — застарілий псевдонім для `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- `channels.slack.chunkMode` і `channels.slack.nativeStreaming` верхнього рівня — застарілі псевдоніми для `channels.slack.streaming.chunkMode` і `channels.slack.streaming.nativeTransport`.
- Застарілі псевдоніми не зчитуються під час виконання; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію потокового передавання Slack із використанням канонічних ключів.

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями у гілках, які використовують типовий індикатор стану "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує короткі коди (наприклад, `"hourglass_flowing_sand"`).
- Реакція працює за принципом найкращих зусиль, а автоматичне очищення виконується після завершення відповіді або шляху помилки.

## Голосове введення

Щоб зараз говорити з OpenClaw у Slack, надішліть аудіокліп Slack застосунку OpenClaw. Мікрофон диктування Slackbot — це окрема функція, що належить Slack, а не API застосунку.

- **[Голосове диктування Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** доступне в приватній розмові користувача зі Slackbot. Slack перетворює запис на запит до Slackbot, але не передає стороннім застосункам Slack через Events API аудіофайл, подію диктування, запит або маркер джерела введення. Plugin Slack для OpenClaw не може ввімкнути чи отримати його.
- **[Аудіокліпи Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** — це файли, збережені в Slack, які можна опублікувати в приватному повідомленні OpenClaw, каналі або гілці. OpenClaw завантажує доступний кліп за допомогою токена бота, нормалізує MIME-метадані кліпу Slack і передає його через спільний [конвеєр транскрибування аудіо](/uk/nodes/audio). Рекомендований маніфест застосунку містить необхідну область дозволів `files:read`.

Аудіокліпи й диктування Slackbot мають різні принципи конфіденційності: кліпи підпадають під політику зберігання файлів Slack, і OpenClaw завантажує їх для транскрибування, тоді як, за твердженням Slack, аудіо диктування не зберігається.

У каналі з `requireMention: true` аудіокліп без підпису може пройти перевірку, якщо в ньому вимовлено налаштований шаблон згадки (`agents.list[].groupChat.mentionPatterns`, із резервним використанням `messages.groupChat.mentionPatterns`). OpenClaw авторизує відправника перед завантаженням або транскрибуванням кліпу, а потім допускає його лише тоді, коли транскрипція відповідає шаблону. Невдала або невідповідна попередня транскрипція видаляється разом із завантаженим кліпом; вона не зберігається в історії каналу. Ідентичність нативної згадки Slack `@bot` неможливо визначити з мовлення, тому налаштуйте шаблон вимовленого імені або додайте текстову згадку. Якщо ввімкнено дублювання транскрипції, її надсилають лише після допуску.

## Медіафайли, поділ на частини та доставлення

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією за токеном), і записуються до сховища медіафайлів, якщо отримання успішне й обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл за допомогою `download-file`.

    Для завантажень застосовуються обмежені тайм-аути бездіяльності та загального часу. Якщо отримання файлу зі Slack зупиняється або завершується невдало, OpenClaw продовжує обробляти повідомлення й використовує заповнювач файлу як резервний варіант.

    Стандартне обмеження розміру вхідних даних під час виконання становить `20MB`, якщо його не перевизначено параметром `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові частини використовують `channels.slack.textChunkLimit` (типове значення `8000`, обмежене власним лімітом довжини повідомлення Slack)
    - `channels.slack.streaming.chunkMode="newline"` вмикає поділ насамперед за абзацами
    - надсилання файлів використовує API завантаження Slack і може містити відповіді в гілках (`thread_ts`)
    - для довгих підписів до файлів перша безпечна для Slack текстова частина використовується як коментар до завантаження, а решта частин надсилається наступними повідомленнями
    - обмеження вихідних медіафайлів відповідає `channels.slack.mediaMaxMb`, якщо його налаштовано; інакше для надсилання в канал використовуються типові значення за MIME-типом із конвеєра медіафайлів

  </Accordion>

  <Accordion title="Цілі доставлення">
    Рекомендовані явні цілі:

    - `user:<id>` для приватних повідомлень
    - `channel:<id>` для каналів

    Приватні повідомлення Slack, що містять лише текст або блоки, можна надсилати безпосередньо за ідентифікаторами користувачів; для завантаження файлів і надсилання в гілки спочатку відкривається приватна розмова через API розмов Slack, оскільки ці шляхи потребують конкретного ідентифікатора розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка команд із похилою рискою

Команди з похилою рискою відображаються в Slack як одна налаштована команда або кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових параметрів маніфесту](#additional-manifest-settings) у вашому застосунку Slack і натомість вмикаються за допомогою `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим нативних команд для Slack **вимкнено**, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Меню аргументів нативних команд відображаються одним із наведених нижче способів у порядку пріоритету:

- 3–5 достатньо коротких варіантів: меню переповнення ("...")
- понад 100 варіантів за наявності асинхронного фільтрування: зовнішній список вибору
- 1–2 варіанти або будь-який варіант, закодоване значення якого задовге для списку вибору: блоки кнопок
- в інших випадках (6–100 варіантів або понад 100 без асинхронного фільтрування): статичне меню вибору, поділене на частини по 100 варіантів на меню

```txt
/think
```

Сеанси команд із похилою рискою використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно спрямовують виконання команд до сеансу цільової розмови за допомогою `CommandTargetSessionKey`.

## Нативні діаграми

Загальнодоступний [блок Block Kit `data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/) Slack
відображає в повідомленнях лінійні, стовпчикові, площинні та секторні діаграми. OpenClaw зіставляє переносний
блок `presentation` `chart` із цією нативною структурою; крім звичайного доступу до повідомлень
`chat:write`, не потрібні додаткова область дозволів OAuth,
завантаження файлів, засіб візуалізації зображень або конфігурація Slack.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Квартальний дохід",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Дохід", "values": [120, 145] }],
      "xLabel": "Квартал"
    }
  ]
}
```

Обмеження Slack застосовуються до нативного відображення:

- заголовок і необов’язкові підписи осей: 50 символів
- секторна діаграма: 1–12 додатних сегментів
- лінійна/стовпчикова/площинна діаграма: 1–12 рядів з унікальними назвами та 1–20 спільних категорій
- підписи сегментів, категорій і рядів: 20 символів
- кожен ряд повинен містити одне скінченне значення для кожної категорії; значення не секторних діаграм
  можуть бути від’ємними

Кожна нативна діаграма також містить текстове представлення верхнього рівня для програм зчитування з екрана,
сповіщень, дзеркалювання сеансів і клієнтів, які не можуть відобразити
блок. Стандартні презентації, надіслані до інших каналів OpenClaw, отримують ті самі
детерміновані дані діаграми у вигляді тексту, якщо не заявляють про підтримку нативних діаграм. Якщо
Slack відхиляє діаграму з `invalid_blocks` під час поетапного розгортання, OpenClaw
видаляє відхилені нативні блоки даних, зберігає всі сусідні елементи керування й надсилає
повне представлення діаграми як видимий текст.

Наразі Slack приймає до двох блоків `data_visualization` в одному повідомленні. Якщо
презентація містить понад дві коректні діаграми, OpenClaw зберігає їхній порядок
і продовжує нативне відображення в наступних повідомленнях, розміщуючи не більше двох
діаграм у кожному повідомленні.

У [повідомленні для розробників](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
Slack описує цей блок як орієнтовану на застосунки функцію Block Kit і не зазначає жодних
обмежень платного тарифного плану. Формулювання про доступність для Business+/Enterprise стосується
автоматичного створення діаграм ШІ у Slackbot, що відрізняється від надсилання застосунком
уже структурованої діаграми Block Kit. Діаграми є блоками лише для повідомлень, а не вмістом App
Home, модальних вікон або Canvas.

## Нативні таблиці

Поточний [блок Block Kit `data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
Slack відображає в повідомленнях структуровані рядки та стовпці. OpenClaw зіставляє явний
переносний блок `presentation` `table` із `data_table`; він не використовує застарілий
[блок `table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) Slack.
Крім звичайного доступу до повідомлень `chat:write`, не потрібні додаткова область дозволів OAuth
або конфігурація Slack.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Відкритий конвеєр",
      "headers": ["Обліковий запис", "Етап", "ARR"],
      "rows": [
        ["Acme", "Виграно", 125000],
        ["Globex", "Перевірка", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw зіставляє заголовки й текстові комірки з комірками Slack `raw_text`. Числові комірки
зіставляються з `raw_number`, а скінченне числове значення зберігається для нативного сортування
та фільтрування. `rowHeaderColumnIndex`, якщо цей параметр задано, позначає відповідний стовпець із нульовою
індексацією як заголовки рядків Slack.

Опубліковані обмеження Slack для `data_table` застосовуються до нативного відображення:

- 1–20 стовпців
- 1–100 рядків даних плюс рядок заголовка
- однакова кількість комірок у кожному рядку
- щонайбільше 10 000 символів загалом у всіх комірках таблиць одного повідомлення

Кілька коректних блоків таблиць можуть відображатися нативно, доки повідомлення
не перевищує загального обмеження кількості символів. Таблиця, яку неможливо відобразити в межах
нативного формату, перетворюється на повний детермінований текст без утрати рядків або
комірок. Якщо цей текст не вміщується в одне повідомлення Slack, надсилання й відповіді на команди з похилою рискою використовують
упорядковані текстові частини. Редагування таблиці завершується явною помилкою розміру замість
непомітного відсікання рядків з наявного повідомлення.

Кожна нативна таблиця, створена з переносної презентації, також містить текстове
представлення верхнього рівня для програм зчитування з екрана, сповіщень, дзеркалювання сеансів і
клієнтів, які не можуть відобразити блок. Необроблені значення діаграм і таблиць залишаються буквальними
в резервному представленні, тому дані комірок на кшталт `<@U123>` не перетворюються на згадку Slack.
Якщо Slack відхиляє нативні блоки діаграм або таблиць із `invalid_blocks`, OpenClaw
видаляє всі нативні блоки даних за один обмежений крок відновлення, зберігає коректні
сусідні блоки, як-от кнопки та списки вибору, і надсилає повний видимий текст діаграм
і таблиць із вимкненим форматуванням Slack. Доставлення команд із похилою рискою
відстежує бюджет команди в п’ять викликів `response_url`. Перед кожною
групою відповідей вибирається повний план, який укладається в решту викликів, або операція завершується
невдало до публікації цієї групи.

До нативних таблиць перетворюються лише явні блоки таблиць `presentation`.
Таблиці Markdown із вертикальними рисками залишаються авторським текстом; OpenClaw не намагається визначати
структуру таблиці чи типи комірок. Наявні довірені виробники нативного вмісту Slack можуть і надалі
передавати необроблені блоки через `channelData.slack.blocks`; OpenClaw створює резервний
текст із коректних необроблених комірок `data_table`, тоді як некоректні користувацькі блоки можуть
спрощуватися до підпису або загального резервного представлення Block Kit. Переносний вивід агентів, CLI
і плагінів має використовувати `presentation`.

## Інтерактивні відповіді

Slack може відображати створені агентом інтерактивні елементи керування відповідями, але ця функція типово вимкнена.
Для нового виводу агентів, CLI і плагінів віддавайте перевагу спільним
кнопкам або блокам вибору `presentation`. Вони використовують той самий шлях взаємодії
Slack і водночас коректно спрощуються в інших каналах.

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

Або ввімкніть лише для одного облікового запису Slack:

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

Коли функцію ввімкнено, агенти все ще можуть виводити застарілі директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують натискання або вибір
назад через наявний шлях подій взаємодії Slack. Зберігайте їх для старих
запитів і специфічних для Slack обхідних шляхів; для нових
переносних елементів керування використовуйте спільну презентацію.

API компілятора директив також застарілі для нового коду виробників:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Для нових елементів керування, що відображаються у Slack, використовуйте корисні навантаження `presentation` і `buildSlackPresentationBlocks(...)`.

Примітки:

- Це застарілий інтерфейс, специфічний для Slack. Інші канали не перетворюють директиви Slack Block
  Kit на власні системи кнопок.
- Значення інтерактивних зворотних викликів — це згенеровані OpenClaw непрозорі токени, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують обмеження Slack Block Kit, OpenClaw надсилає початкову текстову відповідь замість недійсного навантаження блоків.

### Надсилання модальних форм, керованих плагінами

Плагіни Slack, які реєструють інтерактивний обробник, також можуть отримувати події життєвого циклу
`view_submission` і `view_closed`, перш ніж OpenClaw ущільнить
навантаження для системної події, видимої агенту. Під час відкриття модальної форми Slack використовуйте один із таких
шаблонів маршрутизації:

- Установіть `callback_id` у значення `openclaw:<namespace>:<payload>`.
- Або збережіть наявний `callback_id` і помістіть `pluginInteractiveData:
"<namespace>:<payload>"` у поле `private_metadata` модальної форми.

Обробник отримує `ctx.interaction.kind` як `view_submission` або
`view_closed`, нормалізований `inputs` і повний необроблений об’єкт `stateValues` від
Slack. Для виклику обробника плагіна достатньо маршрутизації лише за ідентифікатором зворотного виклику; додайте
наявні поля маршрутизації користувача/сеансу `private_metadata` модальної форми, якщо
модальна форма також має створювати системну подію, видиму агенту. Агент отримує
компактну редаговану системну подію `Slack interaction: ...`. Якщо обробник повертає
`systemEvent.summary`, `systemEvent.reference` або `systemEvent.data`, ці
поля включаються до цієї компактної події, щоб агент міг посилатися на
сховище, кероване плагіном, не бачачи повного навантаження форми.

## Вбудовані підтвердження у Slack

Slack може працювати як вбудований клієнт підтверджень з інтерактивними кнопками та взаємодіями замість переходу до вебінтерфейсу або термінала.

- Підтвердження виконання та плагінів можуть відображатися як вбудовані запити Slack Block Kit.
- `channels.slack.execApprovals.*` залишається конфігурацією ввімкнення вбудованого клієнта підтверджень виконання та маршрутизації до особистих повідомлень/каналів.
- Особисті повідомлення для підтвердження виконання використовують `channels.slack.execApprovals.approvers` або `commands.ownerAllowFrom`.
- Для підтверджень плагінів використовуються вбудовані кнопки Slack, коли Slack увімкнено як вбудований клієнт підтверджень для початкового сеансу або коли `approvals.plugin` спрямовує до початкового сеансу Slack чи цілі Slack.
- Особисті повідомлення для підтвердження плагінів використовують відповідальних за підтвердження плагінів Slack із `channels.slack.allowFrom`, `allowFrom` іменованого облікового запису або стандартного маршруту облікового запису.
- Авторизація відповідального за підтвердження й надалі застосовується: відповідальні, уповноважені лише на виконання, не можуть підтверджувати запити плагінів, якщо вони також не є відповідальними за підтвердження плагінів.

Тут використовується та сама спільна поверхня кнопок підтвердження, що й в інших каналах. Коли `interactivity` увімкнено в налаштуваннях застосунку Slack, запити підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
За наявності цих кнопок вони є основним інтерфейсом підтвердження; OpenClaw
має додавати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що підтвердження
в чаті недоступні або ручне підтвердження є єдиним способом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовується `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типове значення: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає вбудовані підтвердження виконання, коли `enabled` не задано або має значення `"auto"` і визначено принаймні одного
відповідального за підтвердження виконання. Slack також може обробляти вбудовані підтвердження плагінів через цей шлях вбудованого клієнта,
коли визначено відповідальних за підтвердження плагінів Slack і запит відповідає фільтрам вбудованого клієнта. Установіть
`enabled: false`, щоб явно вимкнути Slack як вбудований клієнт підтверджень. Установіть `enabled: true`, щоб
примусово вмикати вбудовані підтвердження, коли визначено відповідальних. Вимкнення підтверджень виконання Slack не вимикає
вбудовану доставку підтверджень плагінів Slack, увімкнену через `approvals.plugin`; для доставки підтверджень
плагінів натомість використовуються відповідальні за підтвердження плагінів Slack.

Типова поведінка без явної конфігурації підтверджень виконання Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна вбудована конфігурація Slack потрібна лише для перевизначення відповідальних за підтвердження, додавання фільтрів або
ввімкнення доставки до початкового чату:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити підтвердження виконання також потрібно
спрямовувати до інших чатів або явних зовнішніх цілей. Спільне переспрямування `approvals.plugin` також є
окремим; вбудована доставка Slack пригнічує цей резервний механізм лише тоді, коли Slack може обробити запит
на підтвердження плагіна вбудованим способом.

`/approve` у тому самому чаті також працює в каналах і особистих повідомленнях Slack, які вже підтримують команди. Повну модель переспрямування підтверджень див. у розділі [Підтвердження виконання](/uk/tools/exec-approvals).

## Події та робоча поведінка

- Редагування та видалення повідомлень перетворюються на системні події.
- Трансляції гілок (відповіді в гілках із параметром "Also send to channel") обробляються як звичайні повідомлення користувача.
- Події додавання та видалення реакцій перетворюються на системні події.
- Події приєднання та виходу учасників, створення та перейменування каналів, а також додавання та видалення закріплень перетворюються на системні події.
- Необов’язкове опитування присутності може перетворити спостережуваний перехід учасника-людини з `away` до `active` на подію в його останньому активному придатному сеансі Slack. Типово вимкнено.
- `channel_id_changed` може переносити ключі конфігурації каналів, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються ненадійним контекстом і можуть бути додані до контексту маршрутизації.
- Початкове повідомлення гілки та початкове наповнення контекстом історії гілки фільтруються за налаштованими списками дозволених відправників, коли це застосовно.
- Дії блоків, ярлики та взаємодії з модальними формами створюють структуровані системні події `Slack interaction: ...` із докладними полями навантаження:
  - дії блоків: вибрані значення, мітки, значення засобів вибору та метадані `workflow_*`
  - глобальні ярлики: метадані зворотного виклику та виконавця, спрямовані до прямого сеансу виконавця
  - ярлики повідомлень: контекст зворотного виклику, виконавця, каналу, гілки та вибраного повідомлення
  - події модальної форми `view_submission` і `view_closed` із метаданими спрямованого каналу та введеними даними форми

Визначте глобальні ярлики або ярлики повідомлень у конфігурації застосунку Slack і використовуйте будь-який непорожній ідентифікатор зворотного виклику. OpenClaw підтверджує отримання відповідних навантажень ярликів, застосовує ту саму політику щодо відправників особистих повідомлень/каналів, що й для інших взаємодій Slack, і ставить очищену подію в чергу для спрямованого сеансу агента. Ідентифікатори запуску та URL-адреси відповідей приховуються з контексту агента.

### Події присутності

Slack не надсилає зміни присутності через Events API або Socket Mode. Натомість OpenClaw може опитувати [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) для учасників-людей, чиї повідомлення пройшли звичайні перевірки доступу та маршрутизації Slack.

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

- `off` (типово): без таймера присутності та викликів API Slack.
- `auto`: відстежувати особисті повідомлення, MPIM і гілки Slack, активні протягом останніх 24 годин, із щонайбільше 8 спостережуваними учасниками-людьми. Сеанси каналів верхнього рівня виключено.
- `on`: відстежувати ті самі розмови без обмеження кількості учасників і включати сеанси каналів верхнього рівня. Використовуйте перевизначення для окремого каналу, щоб примусово ввімкнути або вимкнути один канал.

OpenClaw опитує не більше 45 унікальних користувачів за хвилину для кожного облікового запису Slack, зберігає перший результат без пробудження агента та пробуджує його лише за спостережуваного переходу з `away` до `active`. Для кожного облікового запису Slack і користувача діє стійкий 8-годинний період очікування, навіть якщо ця особа бере участь у кількох гілках. Подія спрямовується лише до останньої активної придатної розмови цієї особи та вказує агенту звернутися до пам’яті/вікі й відомого контексту часового поясу, перш ніж вирішувати, чи надсилати одне коротке привітання. Агент може не відповідати.

Токену бота потрібен `users:read`, який уже включено до рекомендованого маніфесту. Події присутності недоступні для встановлень на рівні всієї організації Enterprise Grid.

## Довідник конфігурації

Основний довідник: [Довідник конфігурації — Slack](/uk/gateway/config-channels#slack).

<Accordion title="Основні поля Slack">

- режим/автентифікація: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до особистих повідомлень: `dm.enabled`, `dmPolicy`, `allowFrom` (застарілі: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний засіб; не вмикайте без потреби)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- гілки/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- пробудження за присутністю: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; типово `off`)
- доставка: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- розгортання: `unfurlLinks` (типово: `false`), `unfurlMedia` для керування попереднім переглядом посилань/медіа `chat.postMessage`; установіть `unfurlLinks: true`, щоб знову ввімкнути попередній перегляд посилань
- операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте в такому порядку:

    - `groupPolicy`
    - список дозволених каналів (`channels.slack.channels`) — **ключами мають бути ідентифікатори каналів** (`C12345678`), а не назви (`#channel-name`). Ключі на основі назв непомітно не спрацьовують у `groupPolicy: "allowlist"`, оскільки маршрутизація каналів типово насамперед використовує ідентифікатори. Щоб знайти ідентифікатор: клацніть канал у Slack правою кнопкою миші → **Copy link** — значення `C...` наприкінці URL-адреси є ідентифікатором каналу.
    - `requireMention`
    - список дозволених `users` для окремого каналу
    - `messages.groupChat.visibleReplies`: для звичайних запитів груп/каналів типовим є `"automatic"`. Якщо ви ввімкнули `"message_tool"` і журнали показують текст асистента без виклику `message(action=send)`, модель не використала видимий шлях інструмента повідомлень. У цьому режимі остаточний текст залишається приватним; перевірте докладний журнал Gateway на наявність метаданих пригніченого навантаження або встановіть значення `"automatic"`, якщо потрібно, щоб кожна звичайна остаточна відповідь асистента публікувалася через застарілий шлях.
    - `messages.groupChat.unmentionedInbound`: якщо значення — `"room_event"`, дозволені повідомлення в каналі без згадки є фоновим контекстом і не спричиняють відповіді, якщо агент не викликає інструмент `message`. Див. [Фонові події кімнати](/uk/channels/ambient-room-events).

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

  <Accordion title="Особисті повідомлення ігноруються">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застарілий `channels.slack.dm.policy`)
    - схвалення сполучення / записи списку дозволених (`dmPolicy: "open"` усе ще потребує `channels.slack.allowFrom: ["*"]`)
    - групові приватні повідомлення використовують обробку MPIM; увімкніть `channels.slack.dm.groupEnabled` і, якщо налаштовано, додайте MPIM до `channels.slack.dm.groupChannels`
    - події приватних повідомлень Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав подію відредагованої гілки Assistant без
      можливості відновити відправника-людину з метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не підключається">
    Перевірте токени бота й застосунку та ввімкнення Socket Mode у налаштуваннях застосунку Slack.
    Токен рівня застосунку має містити `connections:write`, а токен OAuth користувача бота
    має належати тому самому застосунку й робочому простору Slack, що й токен застосунку.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточному середовищу виконання не вдалося визначити значення,
    надане через SecretRef.

    Журнали на кшталт `slack socket mode failed to start; retry ...` позначають відновлювані
    помилки запуску. Натомість відсутні області доступу, відкликані токени та недійсні
    облікові дані спричиняють негайне завершення з помилкою. Запис `slack token mismatch ...`
    означає, що токен бота й токен застосунку, імовірно, належать різним застосункам Slack;
    виправте облікові дані застосунку Slack.

  </Accordion>

  <Accordion title="Режим HTTP не отримує події">
    Перевірте:

    - секрет підпису
    - шлях Webhook
    - URL-адреси запитів Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного облікового запису HTTP
    - публічна URL-адреса завершує TLS і переспрямовує запити до шляху Gateway
    - шлях `request_url` застосунку Slack точно відповідає `channels.slack.webhookPath` (типове значення — `/slack/events`)

    Якщо `signingSecretStatus: "configured_unavailable"` з'являється у знімках
    облікового запису, обліковий запис HTTP налаштовано, але поточному середовищу
    виконання не вдалося визначити секрет підпису, наданий через SecretRef.

    Повторюваний запис журналу `slack: webhook path ... already registered` означає, що два облікові
    записи HTTP використовують той самий `webhookPath`; призначте кожному обліковому запису окремий шлях.

  </Accordion>

  <Accordion title="Власні команди / команди з косою рискою не спрацьовують">
    Перевірте, який варіант передбачався:

    - режим власних команд (`channels.slack.commands.native: true`) із відповідними командами з косою рискою, зареєстрованими в Slack
    - або режим однієї команди з косою рискою (`channels.slack.slashCommand.enabled: true`)

    Slack не створює й не видаляє команди з косою рискою автоматично. `commands.native: "auto"` не вмикає власні команди Slack; використовуйте `true` і створіть відповідні команди в застосунку Slack. У режимі HTTP кожна команда Slack із косою рискою має містити URL-адресу Gateway. У Socket Mode дані команд надходять через WebSocket, а Slack ігнорує `slash_commands[].url`.

    Також перевірте `commands.useAccessGroups`, авторизацію приватних повідомлень, списки дозволених каналів
    і списки дозволених `users` для кожного каналу. Slack повертає ефемерні помилки
    для заблокованих відправників команд із косою рискою, зокрема:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Довідка щодо медіавкладень

Slack може додавати завантажені медіафайли до звернення агента, якщо завантаження файлів зі Slack успішне й це дозволяють обмеження розміру. Аудіокліпи можна транскрибувати, файли зображень можна передавати через шлях розпізнавання медіа або безпосередньо моделі відповіді з підтримкою комп'ютерного зору, а інші файли залишаються доступними як контекст завантажуваних файлів.

### Підтримувані типи медіа

| Тип медіа                      | Джерело             | Поточна поведінка                                                                  | Примітки                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Аудіокліпи Slack               | URL-адреса файлу Slack | Завантажуються й спрямовуються через спільну транскрипцію аудіо                    | Потребує `files:read` і робочої моделі або CLI `tools.media.audio`      |
| Зображення JPEG / PNG / GIF / WebP | URL-адреса файлу Slack | Завантажуються й додаються до звернення для обробки з підтримкою комп'ютерного зору | Обмеження на файл: `channels.slack.mediaMaxMb` (типово 20 MB)                 |
| Файли PDF                      | URL-адреса файлу Slack | Завантажуються й надаються як файловий контекст для таких інструментів, як `download-file` або `pdf` | Вхідна обробка Slack не перетворює PDF автоматично на вхідні зображення для комп'ютерного зору |
| Інші файли                     | URL-адреса файлу Slack | За можливості завантажуються й надаються як файловий контекст                      | Двійкові файли не обробляються як вхідні зображення                         |
| Відповіді в гілці              | Файли початкового повідомлення гілки | Файли кореневого повідомлення можна завантажити як контекст, якщо відповідь не має власних медіафайлів | Для початкових повідомлень лише з файлами використовується заповнювач вкладення |
| Повідомлення з кількома файлами | Кілька файлів Slack | Кожен файл оцінюється окремо                                                       | Обробка Slack обмежена вісьмома файлами на повідомлення                     |

### Конвеєр вхідної обробки

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватної URL-адреси Slack за допомогою токена бота.
2. Після успішного завантаження файл записується до сховища медіа.
3. Шляхи й типи вмісту завантажених медіафайлів додаються до вхідного контексту.
4. Аудіокліпи спрямовуються до спільного конвеєра транскрипції; шляхи моделей та інструментів із підтримкою зображень можуть використовувати вкладені зображення з того самого контексту.
5. Інші файли залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореневого повідомлення гілки

Коли повідомлення надходить у гілці (має батьківський `thread_ts`):

- Якщо сама відповідь не має власних медіафайлів, а включене кореневе повідомлення містить файли, Slack може завантажити кореневі файли як контекст початкового повідомлення гілки.
- Кореневі файли завантажуються лише під час початкового наповнення нового або скинутого сеансу гілки. Наступні текстові відповіді повторно використовують наявний контекст сеансу й не додають кореневі файли повторно як нові медіафайли.
- Власні вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, що містить лише файли без тексту, представляється заповнювачем вкладення, щоб резервний варіант усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через конвеєр медіа.
- Посилання на завантажені медіафайли об'єднуються в контексті повідомлення.
- Порядок обробки відповідає порядку файлів Slack у даних події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження й моделей

- **Обмеження розміру**: типово 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Обмеження транскрипції аудіо**: `tools.media.audio.maxBytes` також застосовується, коли завантажений файл надсилається постачальнику транскрипції або CLI.
- **Помилки завантаження**: файли, які Slack не може надати, прострочені URL-адреси, недоступні або завеликі файли та HTML-відповіді автентифікації чи входу Slack пропускаються, а не позначаються як непідтримувані формати.
- **Модель комп'ютерного зору**: для аналізу зображень використовується активна модель відповіді, якщо вона підтримує комп'ютерний зір, або модель зображень, налаштована в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                                      | Поточна поведінка                                                                   | Обхідний шлях                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Прострочена URL-адреса файлу Slack            | Файл пропускається; помилка не відображається                                      | Повторно завантажте файл у Slack                                                |
| Транскрипція аудіо недоступна                 | Кліп залишається вкладеним, але транскрипція не створюється                         | Налаштуйте `tools.media.audio` або встановіть підтримуваний локальний CLI транскрипції |
| Кліп без підпису не проходить перевірку згадки | Відкидається після приватної попередньої транскрипції; транскрипція й завантажений файл видаляються | Налаштуйте шаблон згадки вимовленого імені, додайте текстову згадку бота або використовуйте приватне повідомлення |
| Модель комп'ютерного зору не налаштована      | Вкладені зображення зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використовуйте модель відповіді з підтримкою комп'ютерного зору |
| Дуже великі зображення (> 20 MB типово)       | Пропускаються відповідно до обмеження розміру                                      | Збільште `channels.slack.mediaMaxMb`, якщо Slack це дозволяє                          |
| Переслані або поширені вкладення              | Текст і розміщені в Slack зображення та файлові медіа обробляються за можливості    | Повторно надішліть їх безпосередньо в гілці OpenClaw                           |
| Вкладення PDF                                 | Зберігаються як файловий або медіаконтекст і не спрямовуються автоматично через комп'ютерний зір | Використовуйте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF |

### Пов'язана документація

- [Конвеєр розпізнавання медіа](/uk/nodes/media-understanding)
- [Аудіо й голосові нотатки](/uk/nodes/audio)
- [Інструмент PDF](/uk/tools/pdf)

## Пов'язані матеріали

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Slack із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових приватних повідомлень.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення агентам.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритети.
  </Card>
  <Card title="Команди з косою рискою" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і їхня поведінка.
  </Card>
</CardGroup>
