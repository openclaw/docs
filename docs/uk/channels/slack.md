---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-03T01:34:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

Готово до продакшну для особистих повідомлень і каналів через інтеграції Slack app. Стандартний режим — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Slack за замовчуванням використовують режим сполучення.
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

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) нижче й продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

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

        Резервний варіант через env (лише стандартний обліковий запис):

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

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфесту](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - установіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

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
        Використовуйте унікальні шляхи webhook для HTTP із кількома обліковими записами

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

OpenClaw за замовчуванням встановлює для клієнта Slack SDK тайм-аут pong 15 секунд у Socket Mode. Перевизначайте транспортні налаштування лише тоді, коли потрібне налаштування під конкретний робочий простір або хост:

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

Використовуйте це лише для робочих просторів Socket Mode, де фіксуються тайм-аути Slack websocket pong/server-ping, або для хостів із відомим голодуванням циклу подій. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення застосунку й події залишаються станом застосунку, а не сигналами працездатності транспорту.

## Контрольний список маніфесту та scope

Базовий маніфест Slack app однаковий для Socket Mode і HTTP Request URLs. Відрізняється лише блок `settings` (і `url` для slash command).

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

Для режиму **HTTP Request URLs** замініть `settings` на HTTP-варіант і додайте `url` до кожної slash command. Потрібна публічна URL-адреса:

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

Увімкніть різні функції, що розширюють наведені вище стандартні налаштування.

Стандартний маніфест вмикає вкладку **Home** у Slack App Home і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку Home, OpenClaw публікує безпечне стандартне подання Home через `views.publish`; payload розмови або приватна конфігурація не включаються. Вкладка **Messages** залишається ввімкненою для особистих повідомлень Slack.

<AccordionGroup>
  <Accordion title="Додаткові нативні slash commands">

    Кілька [нативних slash commands](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 slash commands.

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
  <Accordion title="Додаткові scopes авторства (операції запису)">
    Додайте scope бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власне ім’я користувача та іконку), а не стандартну ідентичність Slack app.

    Якщо ви використовуєте emoji-іконку, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові області дії токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типові області дії для читання:

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
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні текстові
  рядки або об’єкти SecretRef.
- Токени з конфігурації перевизначають резервні значення env.
- Резервні значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до типового облікового запису.
- `userToken` (`xoxp-...`) налаштовується лише через конфігурацію (без резервного значення env) і типово має поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка статусу:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше не-inline джерело секретів, але поточна команда чи шлях виконання
  не змогли отримати фактичне значення.
- У режимі HTTP включено `signingSecretStatus`; у Socket Mode
  потрібна пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій і читання каталогу можна надавати перевагу токену користувача, коли його налаштовано. Для запису перевага залишається за токеном бота; записи через токен користувача дозволені лише коли `userTokenReadOnly: false` і токен бота недоступний.
</Tip>

## Дії та шлюзи

Дії Slack керуються `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | Типово |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії з повідомленнями Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ID файлів Slack, показані у вхідних плейсхолдерах файлів, і повертає попередні перегляди зображень для зображень або метадані локального файлу для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` є канонічним allowlist для DM.

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, коли їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` все ще читаються для сумісності. `openclaw doctor --fix` переносить їх у `dmPolicy` і `allowFrom`, коли це можна зробити без зміни доступу.

    Спарювання в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розташований у `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад `C12345678`) як ключі конфігурації.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), runtime повертається до `groupPolicy="allowlist"` і записує попередження (навіть якщо задано `channels.defaults.groupPolicy`).

    Розв’язання імен/ID:

    - записи allowlist каналів і записи allowlist DM розв’язуються під час запуску, коли доступ токена це дозволяє
    - нерозв’язані записи імен каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів типово спершу використовують ID; пряме зіставлення за іменем користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** зіставляються за `groupPolicy: "allowlist"`. Пошук каналу типово спершу використовує ID, тому ключ на основі імені ніколи не буде успішно маршрутизований, а всі повідомлення в цьому каналі будуть тихо заблоковані. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації і ключ на основі імені здається робочим.

    Завжди використовуйте ID каналу Slack як ключ. Щоб знайти його: клацніть канал у Slack правою кнопкою → **Copy link** — ID (`C...`) з’явиться в кінці URL.

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
    Повідомлення в каналах типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач-бот є учасником цієї групи користувачів; потребує `usergroups:read`
    - regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, резервний варіант `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді на потік бота (вимкнена, коли `thread.requireExplicitMention` дорівнює `true`)

    Поканальні елементи керування (`channels.slack.channels.<id>`; імена лише через розв’язання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса все ще зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише коли бот-відправник явно зазначений в allowlist `users` цієї кімнати або коли принаймні один явний ID власника Slack з `channels.slack.allowFrom` зараз є учасником кімнати. Wildcard і записи власників за відображуваним іменем не задовольняють присутність власника. Присутність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідну область дії читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників завершується невдало, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Потоки, сесії та теги відповіді

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- Прив’язки маршруту Slack приймають необроблені ID співрозмовників, а також цільові форми Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- З типовим `session.dmScope=main` DM Slack згортаються до основної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в потоках можуть створювати суфікси сесій потоків (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень потоку отримується, коли починається нова сесія потоку (типово `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли `true`, пригнічує неявні згадки в потоках, щоб бот відповідав лише на явні згадки `@bot` усередині потоків, навіть коли бот уже брав участь у потоці. Без цього відповіді в потоці, де брав участь бот, обходять шлюз `requireMention`.

Елементи керування потоками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** потоки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Потоки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими inline.
</Note>

## Ack-реакції

`ackReaction` надсилає емодзі підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний емодзі ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Текстовий стримінг

`channels.slack.streaming` керує поведінкою live-попереднього перегляду:

- `off`: вимкнути стримінг live-попереднього перегляду.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надіслати фінальний текст.
- `streaming.preview.toolProgress`: коли чорновий попередній перегляд активний, маршрутизувати оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (типово: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативним текстовим стримінгом Slack, коли `channels.slack.streaming.mode` дорівнює `partial` (типово: `true`).

- Потік відповіді має бути доступним, щоб з’явилися нативний текстовий стримінг і статус потоку асистента Slack. Вибір потоку все ще відповідає `replyToMode`.
- Канали, групові чати й корені DM верхнього рівня все ще можуть використовувати звичайний чорновий попередній перегляд, коли нативний стримінг недоступний або потоку відповіді немає.
- DM Slack верхнього рівня типово залишаються поза потоком, тому вони не показують нативний стримінг/попередній перегляд статусу у стилі потоків Slack; натомість OpenClaw публікує та редагує чорновий попередній перегляд у DM.
- Медіа й нетекстові payload повертаються до звичайної доставки.
- Фінальні медіа/помилки скасовують очікувані редагування попереднього перегляду; відповідні фінальні текстові/блокові результати flush виконуються лише коли вони можуть відредагувати попередній перегляд на місці.
- Якщо стримінг завершується невдало посеред відповіді, OpenClaw повертається до звичайної доставки для решти payload.

Використовуйте чорновий попередній перегляд замість нативного текстового стримінгу Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично переноситься в `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` автоматично переноситься в `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` автоматично переноситься в `channels.slack.streaming.nativeTransport`.

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її, коли виконання завершується. Це найкорисніше поза відповідями в потоках, які використовують типовий індикатор статусу "is typing...".

Порядок розв’язання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується за принципом best-effort, а очищення автоматично намагається виконатися після завершення відповіді або шляху помилки.

## Медіа, поділ на фрагменти та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне й обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати оригінальний файл через `download-file`.

    Завантаження використовують обмежені тайм-аути простою та загального часу. Якщо отримання файла Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файла.

    Обмеження розміру вхідних даних під час виконання за замовчуванням становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові фрагменти використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття з пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа дотримується `channels.slack.mediaMaxMb`, коли налаштовано; інакше надсилання в канал використовує стандартні значення за типом MIME з медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для приватних повідомлень
    - `channel:<id>` для каналів

    Приватні повідомлення Slack лише з текстом/блоками можуть публікуватися безпосередньо за ідентифікаторами користувачів; завантаження файлів і надсилання в тредах спочатку відкривають приватне повідомлення через API розмов Slack, оскільки ці шляхи потребують конкретного ідентифікатора розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash-команд

Slash-команди з'являються в Slack як одна налаштована команда або кілька вбудованих команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити стандартні параметри команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Вбудовані команди потребують [додаткових параметрів маніфесту](#additional-manifest-settings) у вашому застосунку Slack і натомість вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим вбудованих команд **вимкнено** для Slack, тому `commands.native: "auto"` не вмикає вбудовані команди Slack.

```txt
/help
```

Меню аргументів вбудованих команд використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед відправленням вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронною фільтрацією опцій, коли доступні обробники опцій інтерактивності
- перевищені обмеження Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Slash-сесії використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно маршрутизують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати створені агентом інтерактивні елементи керування відповідями, але ця функція за замовчуванням вимкнена.

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

Ці директиви компілюються в Slack Block Kit і маршрутизують кліки або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це інтерфейс, специфічний для Slack. Інші канали не перетворюють директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback-ів є непрозорими токенами, згенерованими OpenClaw, а не сирими значеннями, створеними агентом.
- Якщо згенеровані інтерактивні блоки перевищили б обмеження Slack Block Kit, OpenClaw натомість повертається до початкової текстової відповіді, а не надсилає недійсне корисне навантаження блоків.

## Затвердження exec у Slack

Slack може діяти як вбудований клієнт затвердження з інтерактивними кнопками та взаємодіями, замість повернення до веб-інтерфейсу або термінала.

- Затвердження exec використовують `channels.slack.execApprovals.*` для вбудованої маршрутизації приватних повідомлень/каналів.
- Затвердження Plugin все ще можуть вирішуватися через ту саму поверхню вбудованих кнопок Slack, коли запит уже надходить у Slack і тип ідентифікатора затвердження є `plugin:`.
- Авторизація затверджувачів усе ще застосовується: лише користувачі, визначені як затверджувачі, можуть затверджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок затвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на затвердження рендеряться як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки наявні, вони є основним UX затвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що затвердження в чаті
недоступні або ручне затвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов'язково; повертається до `commands.ownerAllowFrom`, коли можливо)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає вбудовані затвердження exec, коли `enabled` не задано або має значення `"auto"` і визначено принаймні одного
затверджувача. Задайте `enabled: false`, щоб явно вимкнути Slack як вбудований клієнт затвердження.
Задайте `enabled: true`, щоб примусово ввімкнути вбудовані затвердження, коли визначено затверджувачів.

Стандартна поведінка без явної конфігурації затвердження exec у Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна конфігурація, вбудована в Slack, потрібна лише тоді, коли потрібно перевизначити затверджувачів, додати фільтри або
ввімкнути доставку в чат походження:

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

Спільне пересилання `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на затвердження exec також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне пересилання `approvals.plugin` також
окреме; вбудовані кнопки Slack усе ще можуть вирішувати затвердження Plugin, коли ці запити вже надходять
у Slack.

`/approve` у тому самому чаті також працює в каналах Slack і приватних повідомленнях, які вже підтримують команди. Див. [Затвердження exec](/uk/tools/exec-approvals) для повної моделі пересилання затверджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень відображаються в системні події.
- Трансляції тредів (відповіді в треді з "Also send to channel") обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій відображаються в системні події.
- Події приєднання/виходу учасників, створення/перейменування каналу та додавання/видалення закріплень відображаються в системні події.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу обробляються як ненадійний контекст і можуть бути інжектовані в контекст маршрутизації.
- Початкове повідомлення треду та початкове наповнення контексту історії треду фільтруються за налаштованими allowlist-ами відправників, коли застосовно.
- Дії блоків і модальні взаємодії випускають структуровані системні події `Slack interaction: ...` з насиченими полями корисного навантаження:
  - дії блоків: вибрані значення, мітки, значення пікерів і метадані `workflow_*`
  - події модальних `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеннями форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до приватних повідомлень: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний; тримайте вимкненим, якщо не потрібно)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по черзі:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`) — **ключі мають бути ідентифікаторами каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв тихо не спрацьовують із `groupPolicy: "allowlist"`, оскільки маршрутизація каналів за замовчуванням спершу використовує ідентифікатор. Щоб знайти ідентифікатор: клацніть канал у Slack правою кнопкою → **Copy link** — значення `C...` наприкінці URL-адреси є ідентифікатором каналу.
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
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - затвердження зв'язування / записи allowlist
    - події DM Slack Assistant: докладні журнали зі згадкою `drop message_changed`
      зазвичай означають, що Slack надіслав подію відредагованого треду Assistant без
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
    підкріплене SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях Webhook
    - URL-адреси запитів Slack (події + інтерактивність + slash-команди)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з'являється в знімках
    облікових записів, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, підкріплений SecretRef.

  </Accordion>

  <Accordion title="Вбудовані/slash-команди не запускаються">
    Перевірте, що саме ви мали на увазі:

    - режим вбудованих команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist-и каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник vision для вкладень

Slack може прикріплювати завантажені медіа до ходу агента, коли завантаження файлів Slack успішне й обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою vision; інші файли зберігаються як контекст файлів, доступних для завантаження, а не розглядаються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                      | Джерело             | Поточна поведінка                                                                  | Примітки                                                                  |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файла Slack      | Завантажуються й додаються до ходу для обробки з підтримкою бачення              | Ліміт на файл: `channels.slack.mediaMaxMb` (типово 20 МБ)                 |
| PDF-файли                      | URL файла Slack      | Завантажуються й надаються як файловий контекст для інструментів, як-от `download-file` або `pdf` | Вхідний Slack не перетворює PDF автоматично на вхідні дані для зорового аналізу |
| Інші файли                     | URL файла Slack      | Завантажуються, коли це можливо, і надаються як файловий контекст                | Бінарні файли не розглядаються як вхідні зображення                       |
| Відповіді в треді              | Файли початкового повідомлення треду | Файли кореневого повідомлення можуть бути додані як контекст, коли відповідь не має прямих медіа | Початкові повідомлення лише з файлами використовують заповнювач вкладення |
| Повідомлення з кількома зображеннями | Кілька файлів Slack | Кожен файл оцінюється незалежно                                                   | Обробка Slack обмежена вісьмома файлами на повідомлення                   |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватного URL Slack за допомогою токена бота (`xoxb-...`).
2. Після успішного завантаження файл записується до сховища медіа.
3. Шляхи завантажених медіа та типи вмісту додаються до вхідного контексту.
4. Шляхи моделей/інструментів із підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як файлові метадані або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня треду

Коли повідомлення надходить у треді (має батьківський `thread_ts`):

- Якщо сама відповідь не має прямих медіа, а включене кореневе повідомлення має файли, Slack може додати кореневі файли як контекст початкового повідомлення треду.
- Прямі вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представляється заповнювачем вкладення, щоб резервний шлях усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через медіаконвеєр.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделей

- **Обмеження розміру**: типово 20 МБ на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: файли, які Slack не може надати, прострочені URL, недоступні файли, завеликі файли та HTML-відповіді автентифікації/входу Slack пропускаються, а не повідомляються як непідтримувані формати.
- **Модель бачення**: аналіз зображень використовує активну модель відповіді, якщо вона підтримує бачення, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                            | Обхідний шлях                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Прострочений URL файла Slack           | Файл пропускається; помилка не показується                                   | Повторно завантажте файл у Slack                                           |
| Модель бачення не налаштована          | Вкладення зображень зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використовуйте модель відповіді з підтримкою бачення |
| Дуже великі зображення (> 20 МБ типово) | Пропускаються відповідно до обмеження розміру                                | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                  |
| Переслані/поширені вкладення           | Текст і медіа зображень/файлів, розміщені в Slack, обробляються за принципом найкращих зусиль | Повторно поширте безпосередньо в треді OpenClaw                            |
| PDF-вкладення                          | Зберігаються як файловий/медійний контекст, не маршрутизуються автоматично через бачення зображень | Використовуйте `download-file` для файлових метаданих або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення бачення для вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Slack із gateway.
  </Card>
  <Card title="Groups" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових приватних повідомлень.
  </Card>
  <Card title="Channel routing" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Security" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Configuration" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритети.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
