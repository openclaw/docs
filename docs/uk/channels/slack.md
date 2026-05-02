---
read_when:
    - Налаштування Slack або налагодження сокетного/HTTP-режиму Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-02T04:01:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a676acabdb4dce83f813f991692624e1f5b2dff739e68b5c5bd7b064dd82d03
    source_path: channels/slack.md
    workflow: 16
---

Готовий до production-використання для DM і каналів через інтеграції Slack app. Режим за замовчуванням — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    DM у Slack за замовчуванням використовують режим створення пари.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з виправлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий Slack app">
        У налаштуваннях Slack app натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть workspace для свого app
        - вставте [приклад manifest](#manifest-and-scope-checklist) нижче й продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - установіть app і скопіюйте показаний **Bot Token** (`xoxb-...`)

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
        У налаштуваннях Slack app натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть workspace для свого app
        - вставте [приклад manifest](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - установіть app і скопіюйте показаний **Bot Token** (`xoxb-...`)

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
        Використовуйте унікальні webhook-шляхи для HTTP із кількома обліковими записами

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

OpenClaw за замовчуванням установлює для клієнта Slack SDK час очікування pong 15 секунд у Socket Mode. Перевизначайте транспортні налаштування лише тоді, коли потрібне налаштування під конкретний workspace або хост:

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

Використовуйте це лише для workspace у Socket Mode, які фіксують у журналах таймаути pong/server-ping для websocket Slack або працюють на хостах із відомим виснаженням event loop. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — очікування ping від сервера Slack. Повідомлення й події app залишаються станом застосунку, а не сигналами активності транспорту.

## Контрольний список manifest і scopes

Базовий manifest Slack app однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` slash-команди).

Базовий manifest (Socket Mode за замовчуванням):

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

### Додаткові налаштування manifest

Увімкніть інші функції, що розширюють наведені вище типові значення.

Типовий manifest вмикає вкладку **Home** у Slack App Home і підписується на `app_home_opened`. Коли учасник workspace відкриває вкладку Home, OpenClaw публікує безпечне типове подання Home через `views.publish`; payload розмови або приватна конфігурація не додаються. Вкладка **Messages** лишається ввімкненою для DM у Slack.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Кілька [нативних slash-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше ніж 25 slash-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (за замовчуванням)">

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
        Використовуйте той самий список `slash_commands`, що й для Socket Mode вище, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

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
  <Accordion title="Необов’язкові scopes авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (користувацьке ім’я та іконку), а не типову ідентичність Slack app.

    Якщо ви використовуєте emoji-іконку, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові області доступу користувацького токена (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими областями доступу для читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви покладаєтеся на читання через пошук Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- `botToken` + `appToken` потрібні для Socket Mode.
- Режим HTTP потребує `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Токени конфігурації мають пріоритет над резервними значеннями зі змінних середовища.
- Резервні значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) налаштовується лише в конфігурації (без резервного значення env) і за замовчуванням працює лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Інспекція облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайн-джерело секретів, але поточна команда чи шлях виконання
  не змогли отримати фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  потрібна пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій і читання каталогу користувацький токен може мати пріоритет, якщо його налаштовано. Для запису перевага залишається за bot token; записи через користувацький токен дозволені лише коли `userTokenReadOnly: false` і bot token недоступний.
</Tip>

## Дії та шлюзи

Дії Slack керуються через `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | За замовчуванням |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ID файлів Slack, показані у вхідних плейсхолдерах файлів, і повертає прев’ю зображень для зображень або метадані локального файлу для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` є канонічним allowlist для DM.

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

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли це можливо без зміни доступу.

    Спарювання в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розташований у `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад `C12345678`) як ключі конфігурації.

    Примітка щодо runtime: якщо `channels.slack` повністю відсутній (налаштування лише через env), runtime повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Розпізнавання імен/ID:

    - записи allowlist каналів і записи allowlist DM розпізнаються під час запуску, коли доступ токена це дозволяє
    - нерозпізнані записи з іменами каналів зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням спершу використовують ID; прямий збіг за username/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** збігаються під `groupPolicy: "allowlist"`. Пошук каналу за замовчуванням спершу використовує ID, тому ключ на основі імені ніколи не маршрутизуватиметься успішно, а всі повідомлення в цьому каналі буде тихо заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і ключ на основі імені здається робочим.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою → **Copy link** — ID (`C...`) з’являється в кінці URL.

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

  <Tab title="Згадки та користувачі каналу">
    Повідомлення каналів за замовчуванням пропускаються через фільтр згадок.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач бота є учасником цієї групи користувачів; потребує `usergroups:read`
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - неявна поведінка гілки відповіді боту (вимкнено, коли `thread.requireExplicitMention` має значення `true`)

    Керування на рівні каналу (`channels.slack.channels.<id>`; імена лише через розв’язання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключів `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса досі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише тоді, коли бот-відправник явно вказаний у allowlist `users` цієї кімнати, або коли принаймні один явний ID власника Slack із `channels.slack.allowFrom` зараз є учасником кімнати. Wildcard і записи власника за відображуваним іменем не задовольняють умову присутності власника. Присутність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідну область читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників не вдається, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Гілки, сеанси й теги відповіді

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- З типовим `session.dmScope=main` DM Slack згортаються в основний сеанс агента.
- Сеанси каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в гілках можуть створювати суфікси сеансів гілок (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень гілки отримується під час запуску нового сеансу гілки (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, пригнічує неявні згадки в гілках, щоб бот відповідав лише на явні згадки `@bot` усередині гілок, навіть якщо бот уже брав участь у гілці. Без цього відповіді в гілці, де брав участь бот, обходять фільтр `requireMention`.

Керування гілками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: окремо для `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** гілки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все одно враховуються в режимі `"off"`. Гілки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими в рядку.
</Note>

## Реакції підтвердження

`ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує короткі коди (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою live preview:

- `off`: вимкнути потокове передавання live preview.
- `partial` (типово): замінювати текст preview найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення preview.
- `progress`: показувати текст статусу перебігу під час генерації, а потім надіслати фінальний текст.
- `streaming.preview.toolProgress`: коли draft preview активний, спрямовувати оновлення інструментів/перебігу в те саме редаговане повідомлення preview (типово: `true`). Установіть `false`, щоб зберігати окремі повідомлення інструментів/перебігу.

`channels.slack.streaming.nativeTransport` керує нативним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (типово: `true`).

- Для появи нативного потокового передавання тексту й статусу гілки помічника Slack має бути доступна гілка відповіді. Вибір гілки все одно відповідає `replyToMode`.
- Корені каналів і групових чатів усе ще можуть використовувати звичайний draft preview, коли нативне потокове передавання недоступне.
- DM Slack верхнього рівня за замовчуванням залишаються поза гілкою, тому вони не показують preview у стилі гілки; використовуйте відповіді в гілках або `typingReaction`, якщо хочете мати там видимий перебіг.
- Медіа й нетекстові payloads повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування preview; придатні фінальні текстові/блокові результати скидаються лише тоді, коли можуть редагувати preview на місці.
- Якщо потокове передавання завершується помилкою посеред відповіді, OpenClaw повертається до звичайної доставки для решти payloads.

Використовуйте draft preview замість нативного потокового передавання тексту Slack:

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
- boolean `channels.slack.streaming` автоматично мігрується до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` автоматично мігрується до `channels.slack.streaming.nativeTransport`.

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в гілках, які використовують типовий індикатор статусу "is typing...".

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує короткі коди (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично пробується після завершення відповіді або шляху помилки.

## Медіа, фрагментація й доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне й обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл за допомогою `download-file`.

    Завантаження використовують обмежені тайм-аути простою й загального часу. Якщо отримання файлу Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файлу.

    Обмеження вхідного розміру під час виконання за замовчуванням становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ із пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може містити відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа використовує `channels.slack.mediaMaxMb`, якщо налаштовано; інакше надсилання в канал використовує типові значення за MIME-типом із медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    Текстові або лише блочні Slack DM можуть публікуватися напряму в ідентифікатори користувачів; завантаження файлів і надсилання в тредах спочатку відкривають DM через API розмов Slack, тому що ці шляхи потребують конкретного ідентифікатора розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash

Slash-команди відображаються у Slack як одна налаштована команда або кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові значення команд:

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

Меню аргументів нативних команд використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед надсиланням вибраного значення параметра:

- до 5 варіантів: блоки кнопок
- 6-100 варіантів: статичне меню вибору
- понад 100 варіантів: зовнішній вибір з асинхронним фільтруванням варіантів, коли доступні обробники параметрів інтерактивності
- перевищені ліміти Slack: закодовані значення параметрів повертаються до кнопок

```txt
/think
```

Slash-сеанси використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно спрямовують виконання команд до цільового сеансу розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може рендерити створені агентом інтерактивні елементи керування відповідями, але ця функція за замовчуванням вимкнена.

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

Коли ввімкнено, агенти можуть надсилати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перетворюють директиви Slack Block Kit на власні системи кнопок.
- Значення інтерактивних callback є непрозорими токенами, згенерованими OpenClaw, а не сирими значеннями, створеними агентом.
- Якщо згенеровані інтерактивні блоки перевищили б ліміти Slack Block Kit, OpenClaw натомість повертається до початкової текстової відповіді, щоб не надсилати недійсне payload блоків.

## Exec-схвалення у Slack

Slack може працювати як нативний клієнт схвалень з інтерактивними кнопками та взаємодіями, замість повернення до Web UI або термінала.

- Exec-схвалення використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналів.
- Схвалення Plugin усе ще можуть вирішуватися через ту саму нативну поверхню кнопок Slack, коли запит уже надходить у Slack і тип ідентифікатора схвалення є `plugin:`.
- Авторизація схвалювача все ще застосовується: лише користувачі, ідентифіковані як схвалювачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок схвалення, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити схвалення рендеряться як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX схвалення; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що схвалення
через чат недоступні або ручне схвалення є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні Exec-схвалення, коли `enabled` не задано або має значення `"auto"` і визначено принаймні одного
схвалювача. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт схвалень.
Установіть `enabled: true`, щоб примусово ввімкнути нативні схвалення, коли схвалювачів визначено.

Типова поведінка без явної конфігурації Exec-схвалень Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити схвалювачів, додати фільтри або
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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити Exec-схвалення також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack усе ще можуть вирішувати схвалення Plugin, коли ці запити вже надходять
у Slack.

`/approve` у тому самому чаті також працює в каналах Slack і DM, які вже підтримують команди. Див. [Exec-схвалення](/uk/tools/exec-approvals) для повної моделі переспрямування схвалень.

## Події та операційна поведінка

- Редагування/видалення повідомлень зіставляються із системними подіями.
- Трансляції тредів (відповіді в тредах "Also send to channel") обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналів, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються ненадійним контекстом і можуть бути впроваджені в контекст маршрутизації.
- Початкове повідомлення треду та початкове наповнення контексту історії треду фільтруються за налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і модальні взаємодії генерують структуровані системні події `Slack interaction: ...` із насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події modal `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеннями форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застарілі: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (break-glass; тримайте вимкненим, якщо не потрібно)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по порядку:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`) — **ключі мають бути ідентифікаторами каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв непомітно не спрацьовують із `groupPolicy: "allowlist"`, тому що маршрутизація каналів за замовчуванням насамперед використовує ID. Щоб знайти ID: клацніть канал у Slack правою кнопкою → **Copy link** — значення `C...` наприкінці URL є ідентифікатором каналу.
    - `requireMention`
    - allowlist `users` для окремого каналу

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
    - `channels.slack.dmPolicy` (або застарілий `channels.slack.dm.policy`)
    - схвалення спарювання / записи allowlist
    - події Slack Assistant DM: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію треду Assistant без
      відновлюваного людського відправника в метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте токени bot + app і ввімкнення Socket Mode у налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    що підтримується SecretRef.

  </Accordion>

  <Accordion title="HTTP-режим не отримує події">
    Перевірте:

    - секрет підписування
    - шлях webhook
    - URL запитів Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити секрет підписування, що підтримується SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими у Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник vision для вкладень

Slack може додавати завантажені медіа до ходу агента, коли завантаження файлів Slack успішні й обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою vision; інші файли зберігаються як контекст файлів для завантаження, а не розглядаються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                      | Джерело              | Поточна поведінка                                                                  | Примітки                                                                  |
| ------------------------------ | -------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack      | Завантажуються й додаються до ходу для обробки з підтримкою зорових можливостей    | Ліміт на файл: `channels.slack.mediaMaxMb` (типово 20 MB)                 |
| Файли PDF                      | URL файлу Slack      | Завантажуються й надаються як файловий контекст для інструментів, як-от `download-file` або `pdf` | Вхідні повідомлення Slack не перетворюють PDF на вхідні дані image-vision автоматично |
| Інші файли                     | URL файлу Slack      | Завантажуються, коли це можливо, і надаються як файловий контекст                  | Двійкові файли не розглядаються як вхідні зображення                      |
| Відповіді в гілках             | Файли початкового повідомлення гілки | Файли кореневого повідомлення можуть бути підвантажені як контекст, коли відповідь не має власних медіа | Початкові повідомлення лише з файлами використовують заповнювач вкладення |
| Повідомлення з кількома зображеннями | Кілька файлів Slack | Кожен файл оцінюється незалежно                                                     | Обробка Slack обмежена вісьмома файлами на повідомлення                   |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватного URL Slack за допомогою токена бота (`xoxb-...`).
2. У разі успіху файл записується до сховища медіа.
3. Шляхи завантажених медіа та типи вмісту додаються до вхідного контексту.
4. Шляхи моделі/інструмента з підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або медіапосилання для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня гілки

Коли повідомлення надходить у гілці (має батьківський `thread_ts`):

- Якщо сама відповідь не має прямих медіа, а включене кореневе повідомлення має файли, Slack може підвантажити кореневі файли як контекст початку гілки.
- Прямі вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється заповнювачем вкладення, щоб резервний шлях усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через медіаконвеєр.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделі

- **Ліміт розміру**: типово 20 MB на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: файли, які Slack не може надати, прострочені URL, недоступні файли, завеликі файли та HTML-відповіді автентифікації/входу Slack пропускаються замість того, щоб повідомлятися як непідтримувані формати.
- **Модель зорового аналізу**: аналіз зображень використовує активну модель відповіді, коли вона підтримує зоровий аналіз, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                           | Обхідний шлях                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Прострочений URL файлу Slack          | Файл пропускається; помилка не показується                                   | Повторно завантажте файл у Slack                                           |
| Модель зорового аналізу не налаштована | Вкладення зображень зберігаються як медіапосилання, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використайте модель відповіді з підтримкою зорового аналізу |
| Дуже великі зображення (> 20 MB типово) | Пропускаються відповідно до ліміту розміру                                   | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                  |
| Переслані/поширені вкладення          | Текст і розміщені в Slack медіа зображень/файлів обробляються за принципом best-effort | Поділіться ними напряму в гілці OpenClaw                                   |
| PDF-вкладення                         | Зберігаються як файловий/медіаконтекст, але автоматично не спрямовуються через зоровий аналіз зображень | Використовуйте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення зорового аналізу вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Slack із Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка каналу та групових DM.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Configuration" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритетність.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
