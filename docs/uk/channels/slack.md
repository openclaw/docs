---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + URL-адреси HTTP-запитів)
title: Slack
x-i18n:
    generated_at: "2026-04-25T00:01:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8d177cad1e795ecccf31cff486b9c8036bf91b22d122e8afbd9cfaf7635e4ea
    source_path: channels/slack.md
    workflow: 15
---

Готово до використання в продакшені для особистих повідомлень і каналів через інтеграції застосунку Slack. Типовий режим — Socket Mode; також підтримуються URL-адреси HTTP-запитів.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Slack типово працюють у режимі підключення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (типово)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і виберіть робочий простір для свого застосунку
        - вставте [приклад manifest](#manifest-and-scope-checklist) нижче та продовжте створення
        - згенеруйте **App-Level Token** (`xapp-...`) з `connections:write`
        - встановіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)
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

        Резервний варіант через змінні середовища (лише для типового облікового запису):

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
        - вставте [приклад manifest](#manifest-and-scope-checklist) і оновіть URL-адреси перед створенням
        - збережіть **Signing Secret** для перевірки запитів
        - встановіть застосунок і скопіюйте показаний **Bot Token** (`xoxb-...`)

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
        Використовуйте унікальні шляхи Webhook для багатьох облікових записів HTTP

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

## Контрольний список manifest і scope

Базовий manifest застосунку Slack однаковий для Socket Mode і URL-адрес HTTP-запитів. Відрізняється лише блок `settings` (і `url` для слеш-команди).

Базовий manifest (Socket Mode типово):

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

### Додаткові параметри manifest

Показують різні можливості, що розширюють наведені вище типові значення.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні слеш-команди">

    Кілька [нативних слеш-команд](#commands-and-slash-behavior) можна використовувати замість однієї налаштованої команди з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 слеш-команд.

    Замініть наявний розділ `features.slash_commands` на підмножину [доступних команд](/uk/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (типово)">

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
  <Accordion title="Необов’язкові scope авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували ідентичність активного агента (власні ім’я користувача та значок) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте значок emoji, Slack очікує синтаксис `:emoji_name:`.
  </Accordion>
  <Accordion title="Необов’язкові scope user token (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви покладаєтесь на читання через пошук Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- Для Socket Mode потрібні `botToken` + `appToken`.
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервним варіантом через env.
- Резервний варіант через env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до типового облікового запису.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного варіанту через env) і типово працює лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожних облікових даних (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус має значення `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштований через SecretRef
  або інше неinline-джерело секрету, але поточний шлях команди/виконання
  не зміг визначити фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогів user token може мати пріоритет, якщо його налаштовано. Для запису пріоритетним залишається bot token; запис через user token дозволений лише коли `userTokenReadOnly: false`, а bot token недоступний.
</Tip>

## Дії та обмеження

Дії Slack керуються через `channels.slack.actions.*`.

Доступні групи дій у поточному наборі інструментів Slack:

| Група      | Типово |
| ---------- | ------- |
| messages   | увімкнено |
| reactions  | увімкнено |
| pins       | увімкнено |
| memberInfo | увімкнено |
| emojiList  | увімкнено |

Поточні дії для повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`. `download-file` приймає ідентифікатори файлів Slack, показані у вхідних заповнювачах файлів, і повертає попередній перегляд зображень для зображень або метадані локального файла для інших типів файлів.

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.slack.dmPolicy` керує доступом до DM (застаріле: `channels.slack.dm.policy`):

    - `pairing` (типово)
    - `allowlist`
    - `open` (потрібно, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці DM:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові DM типово false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Підключення в DM використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналу">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розміщується в `channels.slack.channels` і має використовувати стабільні ідентифікатори каналів.

    Примітка щодо виконання: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час виконання використовується резервне значення `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Визначення імені/ідентифікатора:

    - записи allowlist каналів і записи allowlist DM визначаються під час запуску, якщо доступ токена це дозволяє
    - нерозв’язані записи назв каналів зберігаються як налаштовані, але типово ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів типово виконуються за ідентифікатором; пряме зіставлення імені користувача/slug вимагає `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналу">
    Повідомлення в каналах типово обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в гілці для бота (вимикається, коли `thread.requireExplicitMention` дорівнює `true`)

    Керування для кожного каналу (`channels.slack.channels.<id>`; імена лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або wildcard `"*"`
      (застарілі ключі без префікса все ще зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Гілки, сесії та теги відповідей

- DM маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- Із типовим `session.dmScope=main` DM у Slack згортаються до основної сесії агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в гілках можуть створювати суфікси сесій гілок (`:thread:<threadTs>`), коли це застосовно.
- `channels.slack.thread.historyScope` типово має значення `thread`; `thread.inheritParent` типово має значення `false`.
- `channels.slack.thread.initialHistoryLimit` визначає, скільки наявних повідомлень гілки отримується під час запуску нової сесії гілки (типово `20`; установіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (типово `false`): коли має значення `true`, пригнічує неявні згадки в гілках, тому бот відповідає лише на явні згадки `@bot` усередині гілок, навіть якщо бот уже брав участь у гілці. Без цього відповіді в гілці, у якій брав участь бот, оминають обмеження `requireMention`.

Елементи керування гілками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для кожного `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** гілки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"` — у Slack гілки приховують повідомлення з каналу, тоді як відповіді в Telegram залишаються видимими вбудовано.

## Реакції підтвердження

`ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервний emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокова передача тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду в реальному часі:

- `off`: вимкнути потоковий попередній перегляд у реальному часі.
- `partial` (типово): замінювати текст попереднього перегляду найновішим частковим виводом.
- `block`: додавати порційні оновлення попереднього перегляду.
- `progress`: показувати текст стану прогресу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чернетковий попередній перегляд, спрямовувати оновлення інструментів/прогресу в те саме відредаговане повідомлення попереднього перегляду (типово: `true`). Установіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативною потоковою передачею тексту Slack, коли `channels.slack.streaming.mode` дорівнює `partial` (типово: `true`).

- Для нативної потокової передачі тексту та відображення статусу гілки помічника Slack має бути доступна гілка відповіді. Вибір гілки все одно підпорядковується `replyToMode`.
- Кореневі повідомлення каналів і групових чатів усе ще можуть використовувати звичайний чернетковий попередній перегляд, коли нативна потокова передача недоступна.
- DM верхнього рівня в Slack типово залишаються поза гілками, тому не показують попередній перегляд у стилі гілки; використовуйте відповіді в гілках або `typingReaction`, якщо хочете видимий прогрес там.
- Для медіа й нетекстових корисних навантажень використовується звичайна доставка.
- Фінальні медіа/помилки скасовують відкладені редагування попереднього перегляду; придатні фінальні текстові/блокові відповіді скидаються лише тоді, коли можуть відредагувати попередній перегляд на місці.
- Якщо потокова передача збоїть посеред відповіді, OpenClaw повертається до звичайної доставки для решти корисних навантажень.

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

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрується до `channels.slack.streaming.mode`.
- булеве `channels.slack.streaming` автоматично мігрує до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застаріле `channels.slack.nativeStreaming` автоматично мігрує до `channels.slack.streaming.nativeTransport`.

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення виконання. Це найбільш корисно поза відповідями в гілках, які використовують типовий індикатор стану "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція надсилається за принципом best-effort, а очищення автоматично намагається виконатися після завершення відповіді або сценарію помилки.

## Медіа, розбиття на частини та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL-адрес, що хостяться Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне та дозволяють обмеження розміру. Заповнювачі файлів включають Slack `fileId`, щоб агенти могли отримати оригінальний файл через `download-file`.

    Типове обмеження розміру вхідних даних під час виконання — `20MB`, якщо не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - частини тексту використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в гілках (`thread_ts`)
    - обмеження вихідних медіа підпорядковується `channels.slack.mediaMaxMb`, якщо налаштовано; інакше для надсилання в канали використовуються типові MIME-kind з медіаконвеєра
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для DM
    - `channel:<id>` для каналів

    DM у Slack відкриваються через API розмов Slack під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

Слеш-команди з’являються в Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команди:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових параметрів manifest](#additional-manifest-settings) у вашому застосунку Slack і вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях.

- Автоматичний режим нативних команд для Slack **вимкнено**, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Нативні меню аргументів використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед надсиланням вибраного значення параметра:

- до 5 варіантів: блоки кнопок
- 6-100 варіантів: статичне меню вибору
- більше 100 варіантів: зовнішній вибір з асинхронною фільтрацією варіантів, якщо доступні обробники параметрів інтерактивності
- перевищено обмеження Slack: закодовані значення варіантів резервно переходять до кнопок

```txt
/think
```

Сесії слеш-команд використовують ізольовані ключі, такі як `agent:<agentId>:slack:slash:<userId>`, і все ще маршрутизують виконання команд до сесії цільової розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи керування відповідями, створеними агентом, але ця можливість типово вимкнена.

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

Коли функцію ввімкнено, агенти можуть виводити директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і спрямовують натискання або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це UI, специфічний для Slack. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивного callback — це непрозорі токени, згенеровані OpenClaw, а не необроблені значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують обмеження Slack Block Kit, OpenClaw резервно повертається до початкової текстової відповіді замість надсилання некоректного payload блоків.

## Підтвердження exec у Slack

Slack може діяти як нативний клієнт підтвердження з інтерактивними кнопками та взаємодіями, замість резервного переходу до Web UI або термінала.

- Підтвердження exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації DM/каналів.
- Підтвердження Plugin також можуть визначатися через ту саму нативну поверхню кнопок Slack, коли запит уже надходить у Slack, а тип ідентифікатора підтвердження — `plugin:`.
- Авторизація того, хто підтверджує, усе ще примусово застосовується: лише користувачі, визначені як ті, хто підтверджує, можуть схвалювати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок підтвердження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що підтвердження в чаті недоступні
або ручне підтвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; за можливості використовує резервне значення з `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні підтвердження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
користувач, що підтверджує. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт підтвердження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні підтвердження, коли визначаються користувачі, що підтверджують.

Типова поведінка без явної конфігурації підтвердження exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна нативна конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити користувачів, що підтверджують, додати фільтри або
вибрати доставку до початкового чату:

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

Пересилання спільних `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на підтвердження exec також мають
маршрутизуватися в інші чати або явні позасмугові цілі. Пересилання спільних `approvals.plugin` також є
окремим; нативні кнопки Slack усе ще можуть визначати підтвердження Plugin, коли ці запити вже надходять
у Slack.

`/approve` у тому ж чаті також працює в каналах і DM Slack, які вже підтримують команди. Повну модель пересилання підтверджень див. у [Підтвердження exec](/uk/tools/exec-approvals).

## Події та операційна поведінка

- Редагування/видалення повідомлень зіставляються із системними подіями.
- Розсилки з гілок ("Also send to channel" для відповідей у гілках) обробляються як звичайні повідомлення користувача.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасників, створення/перейменування каналів і додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані topic/purpose каналу вважаються недовіреним контекстом і можуть бути вставлені в контекст маршрутизації.
- Початкове повідомлення гілки та початкове заповнення контексту історії гілки фільтруються за налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і взаємодії з модальними вікнами генерують структуровані системні події `Slack interaction: ...` з розширеними полями payload:
  - дії блоків: вибрані значення, мітки, значення вибору та метадані `workflow_*`
  - події модальних вікон `view_submission` і `view_closed` з маршрутизованими метаданими каналу та введеними даними форми

## Довідник конфігурації

Основне посилання: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Ключові поля Slack">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до DM: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; залишайте вимкненим, якщо не потрібно)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- гілки/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення проблем

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по порядку:

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

  <Accordion title="Повідомлення DM ігноруються">
    Перевірте:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (або застаріле `channels.slack.dm.policy`)
    - підтвердження підключення / записи allowlist
    - події DM Slack Assistant: докладні журнали з `drop message_changed`
      зазвичай означають, що Slack надіслав подію відредагованої гілки Assistant без
      людського відправника, якого можна відновити, у метаданих повідомлення

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не підключається">
    Перевірте bot token + app token і ввімкнення Socket Mode в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштований, але поточне середовище виконання не змогло визначити значення,
    що походить із SecretRef.

  </Accordion>

  <Accordion title="Режим HTTP не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - URL-адреси запитів Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного облікового запису HTTP

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, обліковий запис HTTP налаштований, але поточне середовище виконання не змогло
    визначити signing secret, що походить із SecretRef.

  </Accordion>

  <Accordion title="Нативні/слеш-команди не спрацьовують">
    Перевірте, що саме ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними слеш-командами, зареєстрованими в Slack
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Підключити користувача Slack до Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових DM.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизація вхідних повідомлень до агентів.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель загроз і посилення захисту.
  </Card>
  <Card title="Конфігурація" icon="sliders" href="/uk/gateway/configuration">
    Структура конфігурації та пріоритети.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Каталог команд і поведінка.
  </Card>
</CardGroup>
