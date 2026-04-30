---
read_when:
    - Налаштування Slack або налагодження режиму сокета/HTTP для Slack
summary: Налаштування Slack і поведінка під час виконання (режим сокетів + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-04-30T13:51:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

Готово до production для DM і каналів через інтеграції застосунків Slack. Режим за замовчуванням — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    DM у Slack типово використовують режим сполучення.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Кросканальна діагностика та сценарії ремонту.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

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

        Резервний варіант через змінні середовища (лише обліковий запис за замовчуванням):

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
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

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
        Використовуйте унікальні шляхи webhook для HTTP із кількома обліковими записами

        Надайте кожному обліковому запису окремий `webhookPath` (за замовчуванням `/slack/events`), щоб реєстрації не конфліктували.
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

OpenClaw за замовчуванням установлює для клієнта Slack SDK тайм-аут pong 15 секунд у Socket Mode. Перевизначайте налаштування транспорту лише тоді, коли потрібне налаштування під конкретний робочий простір або хост:

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

Використовуйте це лише для робочих просторів Socket Mode, які журналюють тайм-аути Slack websocket pong/server-ping, або працюють на хостах із відомим голодуванням циклу подій. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення й події застосунку залишаються станом застосунку, а не сигналами життєздатності транспорту.

## Чекліст маніфесту та scope

Базовий маніфест застосунку Slack однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` для slash-команди).

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

Для режиму **HTTP Request URLs** замініть `settings` на HTTP-варіант і додайте `url` до кожної slash-команди. Потрібен публічний URL:

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

### Додаткові налаштування маніфесту

Показуйте інші функції, що розширюють наведені вище типові значення.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Кілька [нативних slash-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з такими нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 slash-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

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
  <Accordion title="Optional authorship scopes (write operations)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та іконку) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте emoji-іконку, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope для читання є:

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

- `botToken` + `appToken` обовʼязкові для Socket Mode.
- Режим HTTP потребує `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають plaintext
  рядки або обʼєкти SecretRef.
- Токени конфігурації перевизначають резервне значення env.
- Резервне значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) задається лише в конфігурації (без резервного значення env) і типово має поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан має значення `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше неінлайнове джерело секретів, але поточна команда/шлях runtime
  не змогли отримати фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  обовʼязкова пара — це `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу токен користувача може мати пріоритет, якщо його налаштовано. Для записів пріоритетним залишається токен бота; записи через токен користувача дозволені лише коли `userTokenReadOnly: false` і токен бота недоступний.
</Tip>

## Дії та гейти

Діями Slack керує `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | Типово |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ID файлів Slack, показані у вхідних плейсхолдерах файлів, і повертає попередні перегляди зображень для зображень або метадані локальних файлів для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` — канонічний allowlist для DM.

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необовʼязковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли власне `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли це можливо зробити без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розміщується в `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад `C12345678`) як ключі конфігурації.

    Примітка щодо runtime: якщо `channels.slack` повністю відсутній (налаштування лише через env), runtime повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Розпізнавання імен/ID:

    - записи allowlist каналів і записи allowlist DM розпізнаються під час запуску, коли доступ токена це дозволяє
    - нерозпізнані записи з іменами каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів типово орієнтовані на ID; пряме зіставлення за username/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** зіставляються за `groupPolicy: "allowlist"`. Пошук каналу типово орієнтований на ID, тому ключ на основі імені ніколи не буде успішно маршрутизований, і всі повідомлення в цьому каналі буде тихо заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і ключ на основі імені здається робочим.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою → **Copy link** — ID (`C...`) відображається в кінці URL.

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
    Повідомлення каналів типово обмежені згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповідей у треді бота (вимкнено, коли `thread.requireExplicitMention` має значення `true`)

    Поканальні елементи керування (`channels.slack.channels.<id>`; імена лише через розпізнавання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса все ще зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише коли бот-відправник явно вказаний у allowlist `users` цієї кімнати або коли принаймні один явний ID власника Slack з `channels.slack.allowFrom` наразі є учасником кімнати. Wildcard і записи власників за відображуваним іменем не задовольняють наявність власника. Наявність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідний scope читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників не вдається, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Треди, сесії та теги відповідей

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- За типового `session.dmScope=main` DM Slack згортаються до головної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сесій тредів (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень треду отримується під час запуску нової сесії треду (типово `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, пригнічує неявні згадки в треді, щоб бот відповідав лише на явні згадки `@bot` у тредах, навіть якщо бот уже брав участь у треді. Без цього відповіді в треді, де брав участь бот, обходять гейт `requireMention`.

Елементи керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Треди Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими inline.
</Note>

## Ack-реакції

`ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розпізнавання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою живого попереднього перегляду:

- `off`: вимкнути потокове передавання живого попереднього перегляду.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерації, потім надіслати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чернетковий попередній перегляд, маршрутизувати оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (типово: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (типово: `true`).

- Для появи нативного потокового передавання тексту та стану треду асистента Slack має бути доступний тред відповіді. Вибір треду все ще дотримується `replyToMode`.
- Корені каналів і групових чатів усе ще можуть використовувати звичайний чернетковий попередній перегляд, коли нативне потокове передавання недоступне.
- DM Slack верхнього рівня типово залишаються поза тредами, тому не показують попередній перегляд у стилі треду; використовуйте відповіді в тредах або `typingReaction`, якщо хочете видимий прогрес там.
- Медіа та нетекстові payload повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; придатні фінальні текстові/блокові payload скидаються лише тоді, коли можуть редагувати попередній перегляд на місці.
- Якщо потокове передавання не вдається посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload.

Використовуйте чернетковий попередній перегляд замість нативного потокового передавання тексту Slack:

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

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в тредах, які використовують типовий індикатор стану "is typing...".

Порядок розпізнавання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично пробується після завершення відповіді або шляху помилки.

## Медіа, фрагментація та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне та ліміти розміру це дозволяють. Плейсхолдери файлів включають Slack `fileId`, щоб агенти могли отримати оригінальний файл за допомогою `download-file`.

    Завантаження використовують обмежені тайм-аути бездіяльності та загальні тайм-аути. Якщо отримання файлу Slack зависає або зазнає невдачі, OpenClaw продовжує обробляти повідомлення і повертається до плейсхолдера файлу.

    Обмеження розміру вхідних даних runtime типово становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ із пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в гілках (`thread_ts`)
    - обмеження вихідних медіа відповідає `channels.slack.mediaMaxMb`, коли налаштовано; інакше надсилання в канал використовує типові значення за MIME-типом із медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для особистих повідомлень
    - `channel:<id>` для каналів

    Особисті повідомлення Slack відкриваються через API розмов Slack під час надсилання до користувацьких цілей.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash-команд

Slash-команди з’являються у Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команд:

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

Меню нативних аргументів використовують адаптивну стратегію відображення, яка показує модальне вікно підтвердження перед передаванням вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронною фільтрацією опцій, коли доступні обробники опцій інтерактивності
- перевищено обмеження Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Slash-сесії використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно спрямовують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати створені агентом інтерактивні елементи керування відповідями, але ця функція типово вимкнена.

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

Коли ввімкнено, агенти можуть надсилати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують натискання або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перетворюють директиви Slack Block Kit на власні системи кнопок.
- Значення інтерактивних callback-ів є згенерованими OpenClaw непрозорими токенами, а не сирими значеннями, створеними агентом.
- Якщо згенеровані інтерактивні блоки перевищили б обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного payload блоків.

## Підтвердження exec у Slack

Slack може діяти як нативний клієнт підтверджень з інтерактивними кнопками та взаємодіями, замість повернення до Web UI або термінала.

- Підтвердження exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації в особисті повідомлення/канали.
- Підтвердження Plugin усе ще можуть виконуватися через ту саму нативну для Slack поверхню кнопок, коли запит уже потрапляє у Slack і тип ідентифікатора підтвердження є `plugin:`.
- Авторизація затверджувача все ще застосовується: лише користувачі, визначені як затверджувачі, можуть затверджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок підтвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що підтвердження через чат
недоступні або ручне підтвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і щонайменше один
затверджувач визначається. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт підтверджень.
Установіть `enabled: true`, щоб примусово ввімкнути нативні підтвердження, коли затверджувачі визначаються.

Типова поведінка без явної конфігурації підтверджень exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна для Slack конфігурація потрібна лише тоді, коли ви хочете перевизначити затверджувачів, додати фільтри або
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

Спільне перенаправлення `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити підтвердження exec також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне перенаправлення `approvals.plugin` також
окреме; нативні для Slack кнопки все ще можуть виконувати підтвердження Plugin, коли ці запити вже потрапляють
у Slack.

`/approve` у тому самому чаті також працює в каналах Slack і особистих повідомленнях, які вже підтримують команди. Див. [Підтвердження exec](/uk/tools/exec-approvals), щоб ознайомитися з повною моделлю перенаправлення підтверджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень зіставляються із системними подіями.
- Трансляції гілок (відповіді в гілках "Also send to channel") обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події приєднання/виходу учасника, створення/перейменування каналу та додавання/видалення закріплення зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути додані в контекст маршрутизації.
- Початкове повідомлення гілки та заповнення контексту початковою історією гілки фільтруються налаштованими списками дозволених відправників, коли це застосовно.
- Дії блоків і модальні взаємодії випускають структуровані системні події `Slack interaction: ...` з насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення вибирачів і метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введенням форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Поля Slack з високою інформативністю">

- режим/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до особистих повідомлень: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний режим; тримайте вимкненим, якщо не потрібно)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- гілки/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по черзі:

    - `groupPolicy`
    - список дозволених каналів (`channels.slack.channels`) — **ключі мають бути ідентифікаторами каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв мовчки не спрацьовують під `groupPolicy: "allowlist"`, тому що маршрутизація каналів типово насамперед спирається на ідентифікатор. Щоб знайти ідентифікатор: клацніть канал у Slack правою кнопкою → **Copy link** — значення `C...` наприкінці URL є ідентифікатором каналу.
    - `requireMention`
    - поканальний список дозволених `users`

    Корисні команди:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Повідомлення в особистих повідомленнях ігноруються">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - підтвердження сполучення / записи списку дозволених
    - події особистих повідомлень Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав відредаговану подію гілки Assistant без
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

  <Accordion title="HTTP-режим не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - URL запитів Slack (події + інтерактивність + Slash-команди)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється в знімках
    облікового запису, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, підтриманий SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими у Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і списки дозволених каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник vision для вкладень

Slack може прикріплювати завантажені медіа до ходу агента, коли завантаження файлів Slack успішні й обмеження розміру це дозволяють. Файли зображень можна передавати через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою vision; інші файли зберігаються як контекст завантажуваних файлів, а не обробляються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                     | Джерело               | Поточна поведінка                                                                  | Примітки                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack       | Завантажуються й прикріплюються до ходу для обробки з підтримкою vision                   | Обмеження на файл: `channels.slack.mediaMaxMb` (типово 20 MB)                 |
| PDF-файли                      | URL файлу Slack       | Завантажуються й відкриваються як контекст файлу для інструментів на кшталт `download-file` або `pdf` | Вхідний Slack не перетворює PDF автоматично на вхідні дані image-vision |
| Інші файли                    | URL файлу Slack       | Завантажуються, коли можливо, і відкриваються як контекст файлу                              | Бінарні файли не обробляються як вхідні зображення                               |
| Відповіді в гілках                 | Файли початкового повідомлення гілки | Файли кореневого повідомлення можуть бути підвантажені як контекст, коли відповідь не має прямих медіа  | Початкові повідомлення лише з файлами використовують placeholder вкладення                          |
| Повідомлення з кількома зображеннями           | Кілька файлів Slack | Кожен файл оцінюється незалежно                                              | Обробка Slack обмежена вісьмома файлами на повідомлення                     |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватної URL-адреси Slack за допомогою токена бота (`xoxb-...`).
2. Файл успішно записується до сховища медіа.
3. Шляхи завантажених медіа та типи вмісту додаються до вхідного контексту.
4. Шляхи моделі/інструмента з підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як метадані файлів або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня потоку

Коли повідомлення надходить у потік (має батьківський `thread_ts`):

- Якщо сама відповідь не має прямих медіа, а включене кореневе повідомлення має файли, Slack може доповнити кореневі файли як контекст початку потоку.
- Вкладення безпосередньої відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, подається із заповнювачем вкладення, щоб резервний варіант усе ще міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через конвеєр медіа.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделі

- **Обмеження розміру**: За замовчуванням 20 МБ на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: Файли, які Slack не може надати, прострочені URL-адреси, недоступні файли, завеликі файли та HTML-відповіді автентифікації/входу Slack пропускаються замість того, щоб повідомлятися як непідтримувані формати.
- **Модель бачення**: Аналіз зображень використовує активну модель відповіді, коли вона підтримує бачення, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                              | Обхідний шлях                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Прострочена URL-адреса файлу Slack    | Файл пропущено; помилка не показується                                         | Повторно завантажте файл у Slack                                                 |
| Модель бачення не налаштована         | Вкладення зображень зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використовуйте модель відповіді з підтримкою бачення |
| Дуже великі зображення (> 20 МБ за замовчуванням) | Пропускаються відповідно до обмеження розміру                                  | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                         |
| Переслані/поширені вкладення          | Текст і медіа зображень/файлів, розміщені в Slack, обробляються за принципом найкращих зусиль | Поділіться ними повторно безпосередньо в потоці OpenClaw                          |
| PDF-вкладення                         | Зберігаються як контекст файлів/медіа, не маршрутизуються автоматично через бачення зображень | Використовуйте `download-file` для метаданих файлу або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення бачення для вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Сполучіть користувача Slack із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових DM.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритет.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
