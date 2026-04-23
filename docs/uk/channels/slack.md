---
read_when:
    - Налаштування Slack або налагодження режиму сокета/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-04-23T15:10:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19d87dfc1fd655c3849fd66053826f6d054b9d3150e6321f7f7252ab8409edb8
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Статус: готово до продакшну для приватних повідомлень і каналів через інтеграції застосунку Slack. Режим за замовчуванням — Socket Mode; URL-адреси HTTP-запитів також підтримуються.

<CardGroup cols={3}>
  <Card title="Зіставлення" icon="link" href="/uk/channels/pairing">
    Для приватних повідомлень Slack за замовчуванням використовується режим зіставлення.
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
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочу область для вашого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче та продовжуйте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Резервний варіант через змінні середовища (лише для облікового запису за замовчуванням):

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
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочу область для вашого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Використовуйте унікальні шляхи Webhook для багатьох облікових записів у HTTP

        Призначайте кожному обліковому запису окремий `webhookPath` (за замовчуванням `/slack/events`), щоб реєстрації не конфліктували.
        </Note>

      </Step>

      <Step title="Запустіть Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Контрольний список маніфесту та scope

Базовий маніфест застосунку Slack однаковий для Socket Mode і URL-адрес HTTP-запитів. Відрізняється лише блок `settings` (і `url` слеш-команди).

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
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
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

Для режиму **HTTP Request URLs** замініть `settings` на HTTP-варіант і додайте `url` до кожної слеш-команди. Потрібна публічна URL-адреса:

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

### Додаткові параметри маніфесту

Покривають різні можливості, що розширюють наведені вище типові налаштування.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні слеш-команди">

    Можна використовувати кілька [нативних слеш-команд](#commands-and-slash-behavior) замість однієї налаштованої команди з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 слеш-команд.

    Замініть наявний розділ `features.slash_commands` на підмножину [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
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

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Почати нову сесію",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Скинути поточну сесію",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Ущільнити контекст сесії",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Зупинити поточний запуск",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Керувати строком дії прив’язки до треду",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Встановити рівень мислення",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Перемкнути докладний вивід",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Показати або встановити швидкий режим",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Перемкнути видимість міркувань",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Перемкнути підвищений режим",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Показати або встановити типові параметри exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Показати або встановити модель",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Перелічити провайдерів або моделі для провайдера",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Показати короткий підсумок довідки",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Показати згенерований каталог команд",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Показати, що поточний агент може використовувати прямо зараз",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Показати статус під час виконання, зокрема використання/квоту провайдера, якщо доступно",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Перелічити активні/нещодавні фонові завдання для поточної сесії",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Пояснити, як збирається контекст",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Показати вашу ідентичність відправника",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Запустити Skills за назвою",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Поставити побічне запитання без зміни контексту сесії",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Керувати нижнім колонтитулом використання або показати зведення вартості",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Необов’язкові scope авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та значок) замість стандартної ідентичності застосунку Slack.

    Якщо ви використовуєте значок-емодзі, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові scope токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви залежите від читання через пошук Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- Для Socket Mode потрібні `botToken` + `appToken`.
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні текстові
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервним варіантом через env.
- Резервний варіант через env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) задається лише в конфігурації (без резервного варіанту через env) і за замовчуванням працює в режимі лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Інспекція облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштований через SecretRef
  або інше не-inline джерело секрету, але поточний шлях команди/виконання
  не зміг отримати фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання директорій за наявності налаштування можна віддавати перевагу токену користувача. Для запису пріоритетним залишається токен бота; запис через токен користувача дозволяється лише коли `userTokenReadOnly: false`, а токен бота недоступний.
</Tip>

## Дії та обмеження

Діями Slack керує `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Поточні дії для повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика приватних повідомлень">
    `channels.slack.dmPolicy` керує доступом до приватних повідомлень (застаріле: `channels.slack.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці приватних повідомлень:

    - `dm.enabled` (за замовчуванням true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (для групових приватних повідомлень за замовчуванням false)
    - `dm.groupChannels` (необов’язковий allowlist для MPIM)

    Пріоритет у multi-account:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не заданий.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Зіставлення в приватних повідомленнях використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розташовано в `channels.slack.channels` і він має використовувати стабільні ID каналів.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Розв’язання імен/ID:

    - записи allowlist каналів і allowlist приватних повідомлень розв’язуються під час запуску, якщо доступ токена це дозволяє
    - нерозв’язані записи імен каналів зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням працюють за принципом ID-first; пряме зіставлення за ім’ям користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналів">
    Повідомлення каналів за замовчуванням проходять через обмеження за згадкою.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді на бота (вимикається, коли `thread.requireExplicitMention` має значення `true`)

    Елементи керування для кожного каналу (`channels.slack.channels.<id>`; імена лише через розв’язання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключів `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса все ще зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Треди, сесії та теги відповідей

- Приватні повідомлення маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- З типовим `session.dmScope=main` приватні повідомлення Slack згортаються в основну сесію агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сесій тредів (`:thread:<threadTs>`), коли це доречно.
- За замовчуванням `channels.slack.thread.historyScope` має значення `thread`; `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` визначає, скільки наявних повідомлень треду отримується під час запуску нової сесії треду (за замовчуванням `20`; встановіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (за замовчуванням `false`): якщо `true`, пригнічує неявні згадки в треді, тож бот відповідає лише на явні згадки `@bot` усередині тредів, навіть якщо бот уже брав участь у треді. Без цього відповіді в треді, у якому брав участь бот, обходять обмеження `requireMention`.

Елементи керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (за замовчуванням `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все одно враховуються в режимі `"off"` — у Slack треди приховують повідомлення з каналу, тоді як відповіді в Telegram залишаються видимими вбудовано.

## Реакції підтвердження

`ackReaction` надсилає емодзі-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний варіант — емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше `"👀"`)

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокова передача тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду в реальному часі:

- `off`: вимкнути потокову передачу попереднього перегляду в реальному часі.
- `partial` (за замовчуванням): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чернетковий попередній перегляд, спрямовувати оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Установіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативною потоковою передачею тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (за замовчуванням: `true`).

- Для нативної потокової передачі тексту та відображення статусу треду Slack assistant має бути доступний тред відповіді. Вибір треду, як і раніше, визначається `replyToMode`.
- Кореневі повідомлення каналів і групових чатів усе ще можуть використовувати звичайний чернетковий попередній перегляд, якщо нативна потокова передача недоступна.
- Приватні повідомлення Slack верхнього рівня за замовчуванням залишаються поза тредами, тому не показують попередній перегляд у стилі треду; використовуйте відповіді в треді або `typingReaction`, якщо хочете бачити прогрес там.
- Медіа та нетекстові payload використовують звичайну доставку як резервний варіант.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні фінальні текстові/block-відповіді скидаються лише тоді, коли можуть редагувати попередній перегляд на місці.
- Якщо потокова передача переривається посеред відповіді, OpenClaw використовує звичайну доставку для решти payload.

Використовуйте чернетковий попередній перегляд замість нативної потокової передачі тексту Slack:

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

## Резервний варіант реакції введення

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в треді, які використовують типовий індикатор статусу "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично намагається виконатися після завершення відповіді або сценарію помилки.

## Медіа, поділ на фрагменти та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне та дозволяють обмеження розміру.

    Обмеження розміру вхідних даних під час виконання за замовчуванням становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа визначається `channels.slack.mediaMaxMb`, якщо налаштовано; інакше надсилання через канал використовують типові значення MIME-kind із media pipeline
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для приватних повідомлень
    - `channel:<id>` для каналів

    Приватні повідомлення Slack відкриваються через API розмов Slack під час надсилання в цілі користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

Слеш-команди відображаються в Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команди:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових параметрів маніфесту](#additional-manifest-settings) у вашому застосунку Slack і вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим нативних команд **вимкнений** для Slack, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Нативні меню аргументів використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед відправленням вибраного значення параметра:

- до 5 варіантів: блоки кнопок
- 6–100 варіантів: статичне меню вибору
- понад 100 варіантів: external select з асинхронною фільтрацією варіантів, коли доступні обробники параметрів interactivity
- перевищено ліміти Slack: закодовані значення варіантів використовують кнопки як резервний варіант

```txt
/think
```

Сесії слеш-команд використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно маршрутизують виконання команд до сесії цільової розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи керування відповідями, створеними агентом, але цю можливість за замовчуванням вимкнено.

Увімкнути глобально:

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

Або увімкнути лише для одного облікового запису Slack:

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

Коли цю можливість увімкнено, агенти можуть виводити директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і маршрутизують натискання або вибір назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують ліміти Slack Block Kit, OpenClaw використовує оригінальну текстову відповідь як резервний варіант замість надсилання невалідного payload блоків.

## Погодження Exec у Slack

Slack може працювати як нативний клієнт погодження з інтерактивними кнопками та взаємодіями замість переходу до Web UI або термінала як резервного варіанту.

- Погодження Exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації в приватні повідомлення/канали.
- Погодження Plugin також можуть оброблятися через ту саму нативну поверхню кнопок Slack, коли запит уже надходить у Slack і тип id погодження — `plugin:`.
- Авторизація того, хто погоджує, усе одно примусово застосовується: лише користувачі, визначені як approvers, можуть погоджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок погодження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на погодження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що
погодження в чаті недоступні або ручне погодження — єдиний шлях.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовується резервний варіант `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні погодження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
approver. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт погодження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні погодження, коли approvers визначаються.

Типова поведінка без явної конфігурації погодження exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити approvers, додати фільтри або
увімкнути доставку до чату-джерела:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на погодження exec також мають
маршрутизуватися до інших чатів або явних out-of-band цілей. Спільне переспрямування `approvals.plugin` також є
окремим; нативні кнопки Slack усе ще можуть обробляти погодження plugin, коли ці запити вже надходять
у Slack.

`/approve` у тому самому чаті також працює в каналах і приватних повідомленнях Slack, які вже підтримують команди. Див. [Exec approvals](/uk/tools/exec-approvals), щоб ознайомитися з повною моделлю переспрямування погоджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень/розсилання тредів зіставляються із системними подіями.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасників, створення/перейменування каналів, а також додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути впроваджені в контекст маршрутизації.
- Початкове повідомлення треду та початкове заповнення контексту історії треду фільтруються за налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і взаємодії з модальними вікнами створюють структуровані системні події `Slack interaction: ...` із розширеними полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події модальних вікон `view_submission` і `view_closed` із маршрутизованими метаданими каналу та введеними даними форми

## Вказівники на довідник конфігурації

Основний довідник:

- [Configuration reference - Slack](/uk/gateway/configuration-reference#slack)

  Високосигнальні поля Slack:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - доступ до приватних повідомлень: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; залишайте вимкненим, якщо не потрібно)
  - доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Усунення проблем

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте в такому порядку:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` для кожного каналу

    Корисні команди:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Повідомлення в приватних повідомленнях ігноруються">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - погодження pairing / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте токени бота й застосунку та увімкнення Socket Mode у налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштований, але поточне середовище виконання не змогло визначити значення,
    яке походить із SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, HTTP-обліковий запис налаштований, але поточне середовище виконання не змогло
    визначити signing secret, який походить із SecretRef.

  </Accordion>

  <Accordion title="Нативні/слеш-команди не спрацьовують">
    Перевірте, чи ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) із відповідними зареєстрованими в Slack слеш-командами
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Зіставлення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Усунення проблем](/uk/channels/troubleshooting)
- [Конфігурація](/uk/gateway/configuration)
- [Слеш-команди](/uk/tools/slash-commands)
