---
read_when:
    - Налаштування Slack або налагодження режиму сокета/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Режим Socket + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-05-02T04:47:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60e06b138e1579156ccd07bb6db1a25009be970d072ba500b61810c5b78fd01d
    source_path: channels/slack.md
    workflow: 16
---

Готово до продакшну для прямих повідомлень і каналів через інтеграції застосунку Slack. Режим за замовчуванням — сокетний режим; URL-адреси HTTP-запитів також підтримуються.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Slack за замовчуванням використовують режим сполучення.
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
  <Tab title="Сокетний режим (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфеста](#manifest-and-scope-checklist) нижче й продовжте створення
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

        Резервний варіант через змінні середовища (лише обліковий запис за замовчуванням):

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

  <Tab title="URL-адреси HTTP-запитів">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад маніфеста](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
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
        Використовуйте унікальні шляхи Webhook для HTTP з кількома обліковими записами

        Надайте кожному обліковому запису окремий `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували.
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

## Налаштування транспорту сокетного режиму

OpenClaw за замовчуванням задає тайм-аут очікування pong для клієнта Slack SDK на 15 секунд у сокетному режимі. Перевизначайте налаштування транспорту лише тоді, коли потрібне налаштування під конкретний робочий простір або хост:

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

Використовуйте це лише для робочих просторів у сокетному режимі, де фіксуються тайм-аути Slack websocket pong/server-ping, або для хостів із відомим голодуванням циклу подій. `clientPingTimeout` — це очікування pong після того, як SDK надсилає клієнтський ping; `serverPingTimeout` — це очікування ping від сервера Slack. Повідомлення й події застосунку залишаються станом застосунку, а не сигналами працездатності транспорту.

## Контрольний список маніфеста й областей доступу

Базовий маніфест застосунку Slack однаковий для сокетного режиму та URL-адрес HTTP-запитів. Відрізняється лише блок `settings` (і `url` слеш-команди).

Базовий маніфест (сокетний режим за замовчуванням):

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

Для **режиму URL-адрес HTTP-запитів** замініть `settings` на HTTP-варіант і додайте `url` до кожної слеш-команди. Потрібна публічна URL-адреса:

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

### Додаткові налаштування маніфеста

Увімкніть різні функції, які розширюють наведені вище типові параметри.

Типовий маніфест вмикає вкладку **Головна** на сторінці застосунку Slack і підписується на `app_home_opened`. Коли учасник робочого простору відкриває вкладку «Головна», OpenClaw публікує безпечне типове подання головної сторінки через `views.publish`; жодне навантаження розмови або приватна конфігурація не включаються. Вкладка **Повідомлення** залишається ввімкненою для особистих повідомлень Slack.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні слеш-команди">

    З певними нюансами можна використовувати кілька [нативних слеш-команд](#commands-and-slash-behavior) замість однієї налаштованої команди:

    - Використовуйте `/agentstatus` замість `/status`, тому що команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 слеш-команд.

    Замініть наявний розділ `features.slash_commands` підмножиною [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Сокетний режим (за замовчуванням)">

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
      <Tab title="URL-адреси HTTP-запитів">
        Використовуйте той самий список `slash_commands`, що й для сокетного режиму вище, і додайте `"url": "https://gateway-host.example.com/slack/events"` до кожного запису. Приклад:

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
  <Accordion title="Необов’язкові області доступу авторства (операції запису)">
    Додайте область доступу бота `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власне ім’я користувача та піктограму) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте піктограму-емодзі, Slack очікує синтаксис `:emoji_name:`.

  </Accordion>
  <Accordion title="Необов’язкові області дії токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими областями дії для читання є:

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

- `botToken` + `appToken` потрібні для Socket Mode.
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Токени конфігурації перевизначають резервні значення env.
- Резервні значення env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовуються лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) задається лише в конфігурації (без резервного значення env) і за замовчуванням має поведінку лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Інспекція облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Стан — `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше не-вбудоване джерело секрету, але поточна команда/шлях виконання
  не зміг отримати фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  потрібна пара — `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу може надаватися перевага токену користувача, якщо його налаштовано. Для записів перевага лишається за токеном бота; записи через токен користувача дозволені лише коли `userTokenReadOnly: false` і токен бота недоступний.
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

Поточні дії повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ID файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередні перегляди зображень для зображень або метадані локального файлу для інших типів файлів.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM. `channels.slack.allowFrom` є канонічним списком дозволених DM.

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`)
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

    Застарілі `channels.slack.dm.policy` і `channels.slack.dm.allowFrom` усе ще читаються для сумісності. `openclaw doctor --fix` мігрує їх до `dmPolicy` і `allowFrom`, коли може зробити це без зміни доступу.

    Сполучення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Список дозволених каналів міститься в `channels.slack.channels` і **має використовувати стабільні ID каналів Slack** (наприклад `C12345678`) як ключі конфігурації.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), runtime повертається до `groupPolicy="allowlist"` і записує попередження (навіть якщо `channels.defaults.groupPolicy` задано).

    Розпізнавання імен/ID:

    - записи списку дозволених каналів і записи списку дозволених DM розпізнаються під час запуску, коли доступ токена це дозволяє
    - нерозпізнані записи імен каналів зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням спершу використовують ID; пряме зіставлення імені користувача/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Ключі на основі імен (`#channel-name` або `channel-name`) **не** зіставляються під `groupPolicy: "allowlist"`. Пошук каналу за замовчуванням спершу використовує ID, тому ключ на основі імені ніколи не буде успішно маршрутизований, а всі повідомлення в цьому каналі буде мовчки заблоковано. Це відрізняється від `groupPolicy: "open"`, де ключ каналу не потрібен для маршрутизації, і ключ на основі імені здається робочим.

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

    Неправильно (мовчки блокується під `groupPolicy: "allowlist"`):

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
    - згадка групи користувачів Slack (`<!subteam^S...>`), коли користувач-бот є членом цієї групи користувачів; потребує `usergroups:read`
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервне `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в гілці боту (вимкнено, коли `thread.requireExplicitMention` дорівнює `true`)

    Поканальні елементи керування (`channels.slack.channels.<id>`; імена лише через розпізнавання під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (список дозволених)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключів `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або символ-джокер `"*"`
      (застарілі ключі без префікса досі зіставляються лише з `id:`)

    `allowBots` є консервативним для каналів і приватних каналів: повідомлення кімнати, створені ботом, приймаються лише коли бот-відправник явно зазначений у списку дозволених `users` цієї кімнати або коли принаймні один явний ID власника Slack із `channels.slack.allowFrom` наразі є учасником кімнати. Символи-джокери та записи власників за відображуваними іменами не задовольняють наявність власника. Наявність власника використовує Slack `conversations.members`; переконайтеся, що застосунок має відповідну область дії читання для типу кімнати (`channels:read` для публічних каналів, `groups:read` для приватних каналів). Якщо пошук учасників не вдається, OpenClaw відкидає повідомлення кімнати, створене ботом.

  </Tab>
</Tabs>

## Гілки, сеанси та теги відповіді

- DM маршрутизуються як `direct`; канали як `channel`; MPIM як `group`.
- Прив’язки маршрутів Slack приймають сирі ID співрозмовників, а також цільові форми Slack, як-от `channel:C12345678`, `user:U12345678` і `<@U12345678>`.
- Із типовим `session.dmScope=main` DM Slack згортаються в основний сеанс агента.
- Сеанси каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в гілках можуть створювати суфікси сеансів гілок (`:thread:<threadTs>`), коли це застосовно.
- Значення `channels.slack.thread.historyScope` за замовчуванням — `thread`; значення `thread.inheritParent` за замовчуванням — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень гілки отримується під час запуску нового сеансу гілки (за замовчуванням `20`; задайте `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (за замовчуванням `false`): коли `true`, пригнічує неявні згадки в гілках, тож бот відповідає лише на явні згадки `@bot` у гілках, навіть якщо бот уже брав участь у гілці. Без цього відповіді в гілці за участю бота обходять обмеження `requireMention`.

Елементи керування гілками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (за замовчуванням `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповіді:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` вимикає **всі** гілки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Гілки Slack приховують повідомлення з каналу, тоді як відповіді Telegram залишаються видимими безпосередньо в потоці.
</Note>

## Реакції підтвердження

`ackReaction` надсилає emoji підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок розпізнавання:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою живого попереднього перегляду:

- `off`: вимкнути потокове передавання живого попереднього перегляду.
- `partial` (за замовчуванням): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати фрагментовані оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли чорновий попередній перегляд активний, маршрутизувати оновлення інструментів/прогресу до того самого редагованого повідомлення попереднього перегляду (за замовчуванням: `true`). Задайте `false`, щоб зберігати окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` дорівнює `partial` (за замовчуванням: `true`).

- Для появи нативного потокового передавання тексту та стану гілки асистента Slack має бути доступна гілка відповіді. Вибір гілки все одно дотримується `replyToMode`.
- Корені каналів і групових чатів усе ще можуть використовувати звичайний чорновий попередній перегляд, коли нативне потокове передавання недоступне.
- DM Slack верхнього рівня за замовчуванням залишаються поза гілками, тому вони не показують попередній перегляд у стилі гілки; використовуйте відповіді в гілках або `typingReaction`, якщо хочете бачити прогрес там.
- Медіа та нетекстові payloads повертаються до звичайної доставки.
- Фінали медіа/помилок скасовують очікувані редагування попереднього перегляду; придатні фінали тексту/блоків скидаються лише тоді, коли можуть редагувати попередній перегляд на місці.
- Якщо потокове передавання зазнає невдачі посеред відповіді, OpenClaw повертається до звичайної доставки для решти payloads.

Використовуйте чорновий попередній перегляд замість нативного потокового передавання тексту Slack:

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

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення запуску. Це найкорисніше поза відповідями в гілках, які використовують стандартний індикатор стану "is typing...".

Порядок розпізнавання:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад `"hourglass_flowing_sand"`).
- Реакція виконується за найкращої спроби, а очищення автоматично виконується після завершення відповіді або шляху помилки.

## Медіа, фрагментація та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Файлові вкладення Slack завантажуються з приватних URL, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, коли отримання успішне й обмеження розміру це дозволяють. Заповнювачі файлів містять Slack `fileId`, щоб агенти могли отримати початковий файл за допомогою `download-file`.

    Завантаження використовують обмежені тайм-аути бездіяльності та загального часу. Якщо отримання файлу Slack зависає або завершується помилкою, OpenClaw продовжує обробляти повідомлення й повертається до заповнювача файлу.

    Обмеження розміру вхідних даних під час виконання типово становить `20MB`, якщо його не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - фрагменти тексту використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ із пріоритетом абзаців
    - надсилання файлів використовує API завантаження Slack і може містити відповіді в треді (`thread_ts`)
    - обмеження вихідних медіа відповідає `channels.slack.mediaMaxMb`, коли налаштовано; інакше надсилання каналом використовує типові значення за MIME-типом із медіаконвеєра

  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для особистих повідомлень
    - `channel:<id>` для каналів

    Особисті повідомлення Slack лише з текстом/блоками можуть публікуватися безпосередньо за ідентифікаторами користувачів; завантаження файлів і надсилання в тредах спершу відкривають особисте повідомлення через API розмов Slack, тому що ці шляхи потребують конкретного ідентифікатора розмови.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash-команд

Slash-команди з’являються в Slack як одна налаштована команда або кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команд:

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

Меню нативних аргументів використовують адаптивну стратегію відтворення, яка показує модальне вікно підтвердження перед надсиланням вибраного значення опції:

- до 5 опцій: блоки кнопок
- 6-100 опцій: статичне меню вибору
- понад 100 опцій: зовнішній вибір з асинхронною фільтрацією опцій, коли доступні обробники параметрів інтерактивності
- перевищені обмеження Slack: закодовані значення опцій повертаються до кнопок

```txt
/think
```

Slash-сеанси використовують ізольовані ключі, як-от `agent:<agentId>:slack:slash:<userId>`, і все одно спрямовують виконання команд до цільового сеансу розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати створені агентом елементи керування інтерактивними відповідями, але ця функція типово вимкнена.

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

Коли ввімкнено, агенти можуть видавати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують натискання або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це інтерфейс, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це згенеровані OpenClaw непрозорі токени, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищили б обмеження Slack Block Kit, OpenClaw повертається до початкової текстової відповіді замість надсилання недійсного навантаження блоків.

## Підтвердження exec у Slack

Slack може діяти як нативний клієнт підтвердження з інтерактивними кнопками та взаємодіями, замість повернення до вебінтерфейсу або термінала.

- Підтвердження exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації особистих повідомлень/каналів.
- Підтвердження Plugin усе ще можуть вирішуватися через ту саму нативну кнопкову поверхню Slack, коли запит уже потрапляє в Slack, а тип ідентифікатора підтвердження — `plugin:`.
- Авторизація затверджувача все ще застосовується: лише користувачі, ідентифіковані як затверджувачі, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок підтвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що
підтвердження в чаті недоступні або ручне підтвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості повертається до `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і принаймні один
затверджувач визначається. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт підтвердження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні підтвердження, коли затверджувачі визначаються.

Типова поведінка без явної конфігурації підтвердження exec у Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли потрібно перевизначити затверджувачів, додати фільтри або
увімкнути доставку до початкового чату:

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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити підтвердження exec також мають
маршрутизуватися до інших чатів або явних позасмугових цілей. Спільне переспрямування `approvals.plugin` також
окреме; нативні кнопки Slack усе ще можуть вирішувати підтвердження Plugin, коли ці запити вже потрапляють
у Slack.

Same-chat `/approve` також працює в каналах Slack і особистих повідомленнях, які вже підтримують команди. Див. [Підтвердження exec](/uk/tools/exec-approvals) для повної моделі переспрямування підтверджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень зіставляються із системними подіями.
- Трансляції тредів (відповіді в треді «Also send to channel») обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події приєднання/виходу учасників, створення/перейменування каналів і додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли `configWrites` увімкнено.
- Метадані теми/призначення каналу розглядаються як ненадійний контекст і можуть бути впроваджені в контекст маршрутизації.
- Ініціатор треду та початкове засівання контексту історії треду фільтруються за налаштованими списками дозволених відправників, коли це застосовно.
- Дії блоків і модальні взаємодії створюють структуровані системні події `Slack interaction: ...` з багатими полями навантаження:
  - дії блоків: вибрані значення, мітки, значення вибирачів і метадані `workflow_*`
  - події модального `view_submission` і `view_closed` з маршрутизованими метаданими каналу та вхідними даними форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Високосигнальні поля Slack">

- режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до особистих повідомлень: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний режим; тримайте вимкненим, якщо не потрібно)
- доступ до каналу: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте, у такому порядку:

    - `groupPolicy`
    - список дозволених каналів (`channels.slack.channels`) — **ключі мають бути ідентифікаторами каналів** (`C12345678`), а не назвами (`#channel-name`). Ключі на основі назв тихо не спрацьовують із `groupPolicy: "allowlist"`, тому що маршрутизація каналів типово насамперед використовує ідентифікатори. Щоб знайти ідентифікатор: клацніть правою кнопкою канал у Slack → **Copy link** — значення `C...` в кінці URL є ідентифікатором каналу.
    - `requireMention`
    - поканальний список дозволених `users`

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
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - підтвердження спарювання / записи списку дозволених
    - події особистих повідомлень Slack Assistant: докладні журнали зі згадкою `drop message_changed`
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
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    підтримане SecretRef.

  </Accordion>

  <Accordion title="HTTP-режим не отримує події">
    Перевірте:

    - signing secret
    - шлях Webhook
    - URL запитів Slack (події + інтерактивність + Slash Commands)
    - унікальний `webhookPath` для кожного облікового запису HTTP

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікових записів, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, підтриманий SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не запускаються">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і списки дозволених каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Довідник бачення вкладень

Slack може прикріплювати завантажені медіа до ходу агента, коли завантаження файлів Slack успішне й обмеження розміру це дозволяють. Файли зображень можуть передаватися через шлях розуміння медіа або безпосередньо до моделі відповіді з підтримкою бачення; інші файли зберігаються як завантажуваний файловий контекст, а не розглядаються як вхідні зображення.

### Підтримувані типи медіа

| Тип медіа                      | Джерело              | Поточна поведінка                                                                    | Примітки                                                                   |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Зображення JPEG / PNG / GIF / WebP | URL файлу Slack      | Завантажуються й додаються до ходу для обробки з підтримкою бачення                 | Ліміт на файл: `channels.slack.mediaMaxMb` (типово 20 МБ)                 |
| Файли PDF                      | URL файлу Slack      | Завантажуються й надаються як файловий контекст для інструментів, як-от `download-file` або `pdf` | Вхідний Slack автоматично не перетворює PDF на вхідні дані для зорового аналізу |
| Інші файли                     | URL файлу Slack      | Завантажуються, коли це можливо, і надаються як файловий контекст                   | Двійкові файли не обробляються як вхідні зображення                        |
| Відповіді в гілках             | Файли початкового повідомлення гілки | Файли кореневого повідомлення можуть бути підтягнуті як контекст, коли відповідь не має безпосередніх медіа | Початкові повідомлення лише з файлами використовують заповнювач вкладення |
| Повідомлення з кількома зображеннями | Кілька файлів Slack  | Кожен файл оцінюється незалежно                                                       | Обробка Slack обмежена вісьмома файлами на повідомлення                    |

### Вхідний конвеєр

Коли надходить повідомлення Slack із файловими вкладеннями:

1. OpenClaw завантажує файл із приватної URL-адреси Slack за допомогою токена бота (`xoxb-...`).
2. Після успішного завантаження файл записується до сховища медіа.
3. Шляхи завантажених медіа та типи вмісту додаються до вхідного контексту.
4. Шляхи моделей/інструментів із підтримкою зображень можуть використовувати вкладення зображень із цього контексту.
5. Файли, що не є зображеннями, залишаються доступними як метадані файлів або посилання на медіа для інструментів, які можуть їх обробляти.

### Успадкування вкладень кореня гілки

Коли повідомлення надходить у гілці (має батьківський `thread_ts`):

- Якщо сама відповідь не має безпосередніх медіа, а включене кореневе повідомлення має файли, Slack може підтягнути кореневі файли як контекст початкового повідомлення гілки.
- Безпосередні вкладення відповіді мають пріоритет над вкладеннями кореневого повідомлення.
- Кореневе повідомлення, яке має лише файли й не має тексту, представлено заповнювачем вкладення, щоб резервний шлях усе одно міг включити його файли.

### Обробка кількох вкладень

Коли одне повідомлення Slack містить кілька файлових вкладень:

- Кожне вкладення обробляється незалежно через медійний конвеєр.
- Посилання на завантажені медіа агрегуються в контекст повідомлення.
- Порядок обробки відповідає порядку файлів Slack у корисному навантаженні події.
- Помилка завантаження одного вкладення не блокує інші.

### Обмеження розміру, завантаження та моделі

- **Ліміт розміру**: типово 20 МБ на файл. Налаштовується через `channels.slack.mediaMaxMb`.
- **Помилки завантаження**: файли, які Slack не може віддати, протерміновані URL-адреси, недоступні файли, завеликі файли та HTML-відповіді Slack для автентифікації/входу пропускаються, а не повідомляються як непідтримувані формати.
- **Модель бачення**: аналіз зображень використовує активну модель відповіді, якщо вона підтримує бачення, або модель зображень, налаштовану в `agents.defaults.imageModel`.

### Відомі обмеження

| Сценарій                              | Поточна поведінка                                                              | Обхідний шлях                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Протермінована URL-адреса файлу Slack | Файл пропускається; помилка не показується                                      | Повторно завантажте файл у Slack                                           |
| Модель бачення не налаштована         | Вкладення зображень зберігаються як посилання на медіа, але не аналізуються як зображення | Налаштуйте `agents.defaults.imageModel` або використайте модель відповіді з підтримкою бачення |
| Дуже великі зображення (> 20 МБ типово) | Пропускаються відповідно до ліміту розміру                                     | Збільште `channels.slack.mediaMaxMb`, якщо Slack дозволяє                  |
| Переслані/спільні вкладення           | Текст і розміщені в Slack медіа зображень/файлів обробляються за принципом найкращої спроби | Поділіться ними безпосередньо в гілці OpenClaw                             |
| Вкладення PDF                         | Зберігаються як файловий/медійний контекст, але автоматично не спрямовуються через зоровий аналіз зображень | Використовуйте `download-file` для метаданих файлу або інструмент `pdf` для аналізу PDF |

### Пов’язана документація

- [Конвеєр розуміння медіа](/uk/nodes/media-understanding)
- [Інструмент PDF](/uk/tools/pdf)
- Епік: [#51349](https://github.com/openclaw/openclaw/issues/51349) — увімкнення бачення для вкладень Slack
- Регресійні тести: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Жива перевірка: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Пов’язане

<CardGroup cols={2}>
  <Card title="З’єднання" icon="link" href="/uk/channels/pairing">
    З’єднайте користувача Slack із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових DM.
  </Card>
  <Card title="Маршрутизація каналу" icon="route" href="/uk/channels/channel-routing">
    Спрямовуйте вхідні повідомлення до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритетність.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
