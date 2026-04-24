---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP Slack
summary: Налаштування Slack і поведінка під час виконання (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-24T17:24:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 830fe844f1f278062de3c186f2b7865684962c10dfb2740a42bf7b47e342b534
    source_path: channels/slack.md
    workflow: 15
---

Готово до продакшену для особистих повідомлень і каналів через інтеграції застосунку Slack. Режим за замовчуванням — Socket Mode; HTTP Request URLs також підтримуються.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення Slack за замовчуванням працюють у режимі сполучення.
  </Card>
  <Card title="Slash-команди" icon="terminal" href="/uk/tools/slash-commands">
    Нативна поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення проблем із каналом" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть новий застосунок Slack">
        У налаштуваннях застосунку Slack натисніть кнопку **[Create New App](https://api.slack.com/apps/new)**:

        - виберіть **from a manifest** і оберіть робочий простір для вашого застосунку
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

        Резервний варіант через env (лише для облікового запису за замовчуванням):

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

        - виберіть **from a manifest** і оберіть робочий простір для вашого застосунку
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
        Використовуйте унікальні шляхи webhook для багатьох облікових записів HTTP

        Призначте кожному обліковому запису окремий `webhookPath` (типово `/slack/events`), щоб реєстрації не конфліктували.
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

Для **режиму HTTP Request URLs** замініть `settings` на HTTP-варіант і додайте `url` до кожної slash-команди. Потрібна публічна URL-адреса:

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

Покривають різні функції, що розширюють наведені вище типові значення.

<AccordionGroup>
  <Accordion title="Необов’язкові нативні slash-команди">

    Можна використовувати кілька [нативних slash-команд](#commands-and-slash-behavior) замість однієї налаштованої команди з певними нюансами:

    - Використовуйте `/agentstatus` замість `/status`, оскільки команда `/status` зарезервована.
    - Одночасно можна зробити доступними не більше 25 slash-команд.

    Замініть наявний розділ `features.slash_commands` на підмножину [доступних команд](/uk/tools/slash-commands#command-list):

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
  <Accordion title="Необов’язкові scope авторства (операції запису)">
    Додайте bot scope `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власні ім’я користувача та значок) замість типової ідентичності застосунку Slack.

    Якщо ви використовуєте emoji-значок, Slack очікує синтаксис `:emoji_name:`.
  </Accordion>
  <Accordion title="Необов’язкові scope user-token (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope читання є:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (якщо ви покладаєтеся на читання пошуку Slack)

  </Accordion>
</AccordionGroup>

## Модель токенів

- `botToken` + `appToken` потрібні для Socket Mode.
- Для режиму HTTP потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні
  рядки або об’єкти SecretRef.
- Токени в конфігурації мають пріоритет над резервним варіантом через env.
- Резервний варіант через env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного варіанту через env) і за замовчуванням працює в режимі лише для читання (`userTokenReadOnly: true`).

Поведінка знімка стану:

- Інспекція облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожного облікового запису (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше не inline-джерело секрету, але поточний шлях команди/виконання
  не зміг визначити фактичне значення.
- У режимі HTTP включається `signingSecretStatus`; у Socket Mode
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогу перевага може надаватися user token, якщо його налаштовано. Для запису перевага залишається за bot token; запис через user token дозволяється лише коли `userTokenReadOnly: false` і bot token недоступний.
</Tip>

## Дії та обмеження

Дії Slack керуються через `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Група      | За замовчуванням |
| ---------- | ---------------- |
| messages   | увімкнено        |
| reactions  | увімкнено        |
| pins       | увімкнено        |
| memberInfo | увімкнено        |
| emojiList  | увімкнено        |

Поточні дії для повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` та `emoji-list`.

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика особистих повідомлень">
    `channels.slack.dmPolicy` керує доступом до особистих повідомлень (застаріле: `channels.slack.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потребує, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці особистих повідомлень:

    - `dm.enabled` (за замовчуванням true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові особисті повідомлення за замовчуванням false)
    - `dm.groupChannels` (необов’язковий allowlist MPIM)

    Пріоритет для багатьох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Сполучення в особистих повідомленнях використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів розміщується в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка щодо runtime: якщо `channels.slack` повністю відсутній (налаштування лише через env), runtime використовує резервне значення `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    Визначення імені/ID:

    - записи allowlist каналів і allowlist особистих повідомлень визначаються під час запуску, коли доступ токена це дозволяє
    - записи з іменами каналів, які не вдалося визначити, зберігаються як налаштовані, але за замовчуванням ігноруються для маршрутизації
    - вхідна авторизація та маршрутизація каналів за замовчуванням працюють за ID; пряме зіставлення імен користувачів/slug потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналів">
    Повідомлення в каналах за замовчуванням обмежуються згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони регулярних виразів для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповіді в треді на бота (вимикається, якщо `thread.requireExplicitMention` має значення `true`)

    Керування на рівні каналу (`channels.slack.channels.<id>`; імена лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключів `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або шаблон `"*"`
      (застарілі ключі без префікса все ще зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Треди, сесії та теги відповідей

- Особисті повідомлення маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- Із типовим `session.dmScope=main` особисті повідомлення Slack згортаються в основну сесію агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в тредах можуть створювати суфікси сесій тредів (`:thread:<threadTs>`), коли це застосовно.
- Значення за замовчуванням для `channels.slack.thread.historyScope` — `thread`; для `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень треду буде отримано під час старту нової сесії треду (за замовчуванням `20`; встановіть `0`, щоб вимкнути).
- `channels.slack.thread.requireExplicitMention` (за замовчуванням `false`): коли має значення `true`, пригнічує неявні згадки в треді, тож бот відповідає лише на явні згадки `@bot` усередині тредів, навіть якщо бот уже брав участь у треді. Без цього відповіді в треді, де брав участь бот, обходять обмеження `requireMention`.

Керування тредами відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (за замовчуванням `off`)
- `channels.slack.replyToModeByChatType`: для `direct|group|channel`
- застарілий резервний варіант для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** треди відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"` — у Slack треди приховують повідомлення з каналу, тоді як у Telegram відповіді лишаються видимими вбудовано.

## Реакції підтвердження

`ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервне emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcodes (наприклад, `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду в реальному часі:

- `off`: вимкнути потоковий попередній перегляд у реальному часі.
- `partial` (за замовчуванням): замінювати текст попереднього перегляду останнім частковим виводом.
- `block`: додавати оновлення попереднього перегляду фрагментами.
- `progress`: показувати текст стану прогресу під час генерації, а потім надсилати фінальний текст.
- `streaming.preview.toolProgress`: коли активний чорновий попередній перегляд, спрямовувати оновлення інструментів/прогресу в те саме редаговане повідомлення попереднього перегляду (за замовчуванням: `true`). Встановіть `false`, щоб зберегти окремі повідомлення інструментів/прогресу.

`channels.slack.streaming.nativeTransport` керує нативним потоковим передаванням тексту Slack, коли `channels.slack.streaming.mode` має значення `partial` (за замовчуванням: `true`).

- Щоб з’явилося нативне потокове передавання тексту та статус треду Slack assistant, має бути доступний тред відповіді. Вибір треду, як і раніше, підпорядковується `replyToMode`.
- Кореневі повідомлення каналів і групових чатів усе ще можуть використовувати звичайний чорновий попередній перегляд, коли нативне потокове передавання недоступне.
- Особисті повідомлення Slack верхнього рівня за замовчуванням лишаються поза тредами, тому не показують попередній перегляд у стилі треду; використовуйте відповіді в треді або `typingReaction`, якщо хочете видимий прогрес там.
- Медіа та нетекстові корисні навантаження використовують резервну звичайну доставку.
- Фінальні повідомлення з медіа/помилками скасовують відкладені редагування попереднього перегляду; придатні фінальні текстові/блокові повідомлення скидаються лише тоді, коли можуть відредагувати попередній перегляд на місці.
- Якщо потокове передавання зривається посеред відповіді, OpenClaw переходить на звичайну доставку для решти корисних навантажень.

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
- булеве `channels.slack.streaming` автоматично мігрується до `channels.slack.streaming.mode` і `channels.slack.streaming.nativeTransport`.
- застарілий `channels.slack.nativeStreaming` автоматично мігрується до `channels.slack.streaming.nativeTransport`.

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її, коли виконання завершується. Це особливо корисно поза відповідями в тредах, які використовують типовий індикатор стану "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcodes (наприклад, `"hourglass_flowing_sand"`).
- Реакція виконується за можливості, а очищення автоматично намагається виконатися після завершення відповіді або шляху помилки.

## Медіа, розбиття на частини та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL-адрес, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне та дозволяють обмеження розміру.

    Обмеження розміру вхідних даних у runtime за замовчуванням становить `20MB`, якщо не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - текстові частини використовують `channels.slack.textChunkLimit` (за замовчуванням 4000)
    - `channels.slack.chunkMode="newline"` вмикає розбиття спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в тредах (`thread_ts`)
    - обмеження вихідних медіа використовує `channels.slack.mediaMaxMb`, якщо налаштовано; інакше надсилання каналами використовує типові значення MIME-kind з медіа-конвеєра
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для особистих повідомлень
    - `channel:<id>` для каналів

    Особисті повідомлення Slack відкриваються через API розмов Slack під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка slash-команд

Slash-команди з’являються в Slack або як одна налаштована команда, або як кілька нативних команд. Налаштуйте `channels.slack.slashCommand`, щоб змінити типові параметри команди:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Нативні команди потребують [додаткових налаштувань маніфесту](#additional-manifest-settings) у вашому застосунку Slack і вмикаються через `channels.slack.commands.native: true` або `commands.native: true` у глобальних конфігураціях натомість.

- Автоматичний режим нативних команд **вимкнено** для Slack, тому `commands.native: "auto"` не вмикає нативні команди Slack.

```txt
/help
```

Нативні меню аргументів використовують адаптивну стратегію рендерингу, яка показує модальне вікно підтвердження перед відправленням вибраного значення параметра:

- до 5 варіантів: блоки кнопок
- 6-100 варіантів: статичне меню вибору
- понад 100 варіантів: зовнішній вибір з асинхронною фільтрацією варіантів, коли доступні обробники параметрів interactivity
- перевищено обмеження Slack: закодовані значення варіантів повертаються до кнопок

```txt
/think
```

Сесії slash-команд використовують ізольовані ключі на кшталт `agent:<agentId>:slack:slash:<userId>` і все одно маршрутизують виконання команд до цільової сесії розмови за допомогою `CommandTargetSessionKey`.

## Інтерактивні відповіді

Slack може відтворювати інтерактивні елементи відповіді, створені агентом, але цю функцію за замовчуванням вимкнено.

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

Коли функцію ввімкнено, агенти можуть генерувати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і маршрутизують натискання або вибори назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це специфічний для Slack інтерфейс. Інші канали не перекладають директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних зворотних викликів — це непрозорі токени, згенеровані OpenClaw, а не сирі значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищують обмеження Slack Block Kit, OpenClaw використовує резервну оригінальну текстову відповідь замість надсилання недійсного payload blocks.

## Погодження exec у Slack

Slack може працювати як нативний клієнт погодження з інтерактивними кнопками та взаємодіями замість резервного переходу до Web UI або термінала.

- Погодження exec використовують `channels.slack.execApprovals.*` для нативної маршрутизації до особистих повідомлень/каналів.
- Погодження Plugin також можуть визначатися через ту саму Slack-native поверхню кнопок, коли запит уже потрапляє в Slack і тип id погодження — `plugin:`.
- Авторизація затверджувача все одно примусово виконується: лише користувачі, визначені як затверджувачі, можуть підтверджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок погодження, що й інші канали. Коли `interactivity` увімкнено в налаштуваннях вашого застосунку Slack, запити на погодження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX погодження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента повідомляє, що погодження в чаті недоступні або ручне погодження — єдиний шлях.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов’язково; використовує резервне значення з `commands.ownerAllowFrom`, коли це можливо)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає нативні погодження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
затверджувач. Установіть `enabled: false`, щоб явно вимкнути Slack як нативний клієнт погодження.
Установіть `enabled: true`, щоб примусово ввімкнути нативні погодження, коли визначаються затверджувачі.

Типова поведінка без явної конфігурації погоджень exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна Slack-native конфігурація потрібна лише тоді, коли ви хочете перевизначити затверджувачів, додати фільтри або
вибрати доставку в чат походження:

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

Спільне переспрямування `approvals.exec` налаштовується окремо. Використовуйте його лише тоді, коли запити на погодження exec також мають
маршрутизуватися до інших чатів або явно визначених позасмугових цілей. Спільне переспрямування `approvals.plugin` також
налаштовується окремо; Slack-native кнопки все одно можуть визначати погодження Plugin, коли ці запити вже надходять
у Slack.

`/approve` у тому самому чаті також працює в каналах і особистих повідомленнях Slack, які вже підтримують команди. Див. [Погодження exec](/uk/tools/exec-approvals) для повної моделі переспрямування погоджень.

## Події та операційна поведінка

- Редагування/видалення повідомлень і широкомовні повідомлення тредів зіставляються із системними подіями.
- Події додавання/видалення реакцій зіставляються із системними подіями.
- Події входу/виходу учасників, створення/перейменування каналів і додавання/видалення закріплень зіставляються із системними подіями.
- `channel_id_changed` може переносити ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються недовіреним контекстом і можуть бути впроваджені в контекст маршрутизації.
- Автор треду та початкове заповнення контексту історії треду фільтруються відповідно до налаштованих allowlist відправників, коли це застосовно.
- Дії блоків і взаємодії з модальними вікнами генерують структуровані системні події `Slack interaction: ...` із розширеними полями payload:
  - дії блоків: вибрані значення, мітки, значення вибору та метадані `workflow_*`
  - події модальних вікон `view_submission` і `view_closed` із маршрутизованими метаданими каналу та введенням форми

## Довідник конфігурації

Основний довідник: [Довідник конфігурації - Slack](/uk/gateway/config-channels#slack).

<Accordion title="Найважливіші поля Slack">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- доступ до особистих повідомлень: `dm.enabled`, `dmPolicy`, `allowFrom` (застарілі: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; не вмикайте без потреби)
- доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- треди/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- операції/функції: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Усунення проблем

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте в такому порядку:

    - `groupPolicy`
    - allowlist каналів (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` на рівні каналу

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
    - погодження сполучення / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode не підключається">
    Перевірте bot token + app token і те, що Socket Mode увімкнено в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточний runtime не зміг визначити значення,
    що підтримується SecretRef.

  </Accordion>

  <Accordion title="HTTP mode не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з’являється у знімках
    облікового запису, HTTP-обліковий запис налаштовано, але поточний runtime не зміг
    визначити signing secret, що підтримується SecretRef.

  </Accordion>

  <Accordion title="Нативні/slash-команди не спрацьовують">
    Перевірте, який саме режим ви мали на увазі:

    - режим нативних команд (`channels.slack.commands.native: true`) з відповідними slash-командами, зареєстрованими в Slack
    - або режим однієї slash-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Зв’яжіть користувача Slack із Gateway.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка каналів і групових особистих повідомлень.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизуйте вхідні повідомлення до агентів.
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
