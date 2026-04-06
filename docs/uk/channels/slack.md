---
read_when:
    - Налаштування Slack або налагодження режиму socket/HTTP у Slack
summary: Налаштування Slack і поведінка під час роботи (Socket Mode + URL-адреси HTTP Request)
title: Slack
x-i18n:
    generated_at: "2026-04-06T06:59:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 471421a34e5ff20dfc46dab85422d2e814524068c8466d0738448cd5d64d415b
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Статус: готово до використання в production для приватних повідомлень + каналів через інтеграції застосунку Slack. Режим за замовчуванням — Socket Mode; URL-адреси HTTP Request також підтримуються.

<CardGroup cols={3}>
  <Card title="Підключення" icon="link" href="/uk/channels/pairing">
    Приватні повідомлення Slack за замовчуванням використовують режим підключення.
  </Card>
  <Card title="Слеш-команди" icon="terminal" href="/uk/tools/slash-commands">
    Вбудована поведінка команд і каталог команд.
  </Card>
  <Card title="Усунення несправностей каналів" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та сценарії відновлення.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Socket Mode (за замовчуванням)">
    <Steps>
      <Step title="Створіть застосунок Slack і токени">
        У налаштуваннях застосунку Slack:

        - увімкніть **Socket Mode**
        - створіть **App Token** (`xapp-...`) з `connections:write`
        - встановіть застосунок і скопіюйте **Bot Token** (`xoxb-...`)
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

        Резервне значення з env (лише для облікового запису за замовчуванням):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Підпишіть події застосунку">
        Підпишіть події бота для:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Також увімкніть **Messages Tab** у App Home для приватних повідомлень.
      </Step>

      <Step title="Запустіть gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL-адреси HTTP Request">
    <Steps>
      <Step title="Налаштуйте застосунок Slack для HTTP">

        - встановіть режим HTTP (`channels.slack.mode="http"`)
        - скопіюйте **Signing Secret** Slack
        - встановіть однаковий Request URL для Event Subscriptions, Interactivity і Slash command на той самий шлях webhook (типово `/slack/events`)

      </Step>

      <Step title="Налаштуйте HTTP-режим OpenClaw">

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

      </Step>

      <Step title="Використовуйте унікальні шляхи webhook для HTTP з кількома обліковими записами">
        Підтримується HTTP-режим для кожного облікового запису окремо.

        Призначте кожному обліковому запису окремий `webhookPath`, щоб реєстрації не конфліктували.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Контрольний список маніфесту та scope

<AccordionGroup>
  <Accordion title="Приклад маніфесту застосунку Slack" defaultOpen>

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
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

  </Accordion>

  <Accordion title="Необов'язкові scope токена користувача (операції читання)">
    Якщо ви налаштовуєте `channels.slack.userToken`, типовими scope для читання є:

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

- `botToken` + `appToken` обов'язкові для Socket Mode.
- Для HTTP-режиму потрібні `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні текстові
  рядки або об'єкти SecretRef.
- Токени з конфігурації мають пріоритет над резервним значенням з env.
- Резервне значення з env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` застосовується лише до облікового запису за замовчуванням.
- `userToken` (`xoxp-...`) доступний лише в конфігурації (без резервного значення з env) і за замовчуванням працює в режимі лише читання (`userTokenReadOnly: true`).
- Необов'язково: додайте `chat:write.customize`, якщо хочете, щоб вихідні повідомлення використовували активну ідентичність агента (власні `username` та icon). `icon_emoji` використовує синтаксис `:emoji_name:`.

Поведінка знімка статусу:

- Перевірка облікового запису Slack відстежує поля `*Source` і `*Status`
  для кожного облікового запису (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Статус може бути `available`, `configured_unavailable` або `missing`.
- `configured_unavailable` означає, що обліковий запис налаштовано через SecretRef
  або інше не-inline джерело секретів, але поточна команда/шлях виконання
  не змогли визначити фактичне значення.
- У HTTP-режимі включається `signingSecretStatus`; у Socket Mode
  потрібною парою є `botTokenStatus` + `appTokenStatus`.

<Tip>
Для дій/читання каталогів за наявності конфігурації може віддаватися перевага токену користувача. Для запису пріоритетним залишається токен бота; запис через токен користувача дозволяється лише коли `userTokenReadOnly: false` і токен бота недоступний.
</Tip>

## Дії та обмеження

Дії Slack керуються через `channels.slack.actions.*`.

Доступні групи дій у поточному інструментарії Slack:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Поточні дії для повідомлень Slack включають `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` і `emoji-list`.

## Керування доступом і маршрутизація

<Tabs>
  <Tab title="Політика приватних повідомлень">
    `channels.slack.dmPolicy` керує доступом до приватних повідомлень (застаріле: `channels.slack.dm.policy`):

    - `pairing` (за замовчуванням)
    - `allowlist`
    - `open` (потрібно, щоб `channels.slack.allowFrom` містив `"*"`; застаріле: `channels.slack.dm.allowFrom`)
    - `disabled`

    Прапорці приватних повідомлень:

    - `dm.enabled` (типово true)
    - `channels.slack.allowFrom` (рекомендовано)
    - `dm.allowFrom` (застаріле)
    - `dm.groupEnabled` (групові приватні повідомлення типово false)
    - `dm.groupChannels` (необов'язковий allowlist MPIM)

    Пріоритет для кількох облікових записів:

    - `channels.slack.accounts.default.allowFrom` застосовується лише до облікового запису `default`.
    - Іменовані облікові записи успадковують `channels.slack.allowFrom`, якщо їхній власний `allowFrom` не задано.
    - Іменовані облікові записи не успадковують `channels.slack.accounts.default.allowFrom`.

    Підключення в приватних повідомленнях використовує `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Політика каналів">
    `channels.slack.groupPolicy` керує обробкою каналів:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist каналів зберігається в `channels.slack.channels` і має використовувати стабільні ID каналів.

    Примітка щодо роботи: якщо `channels.slack` повністю відсутній (налаштування лише через env), під час роботи використовується резервне значення `groupPolicy="allowlist"` і записується попередження в журнал (навіть якщо встановлено `channels.defaults.groupPolicy`).

    Визначення імені/ID:

    - записи allowlist каналів і allowlist приватних повідомлень визначаються під час запуску, коли доступ токена це дозволяє
    - записи з невизначеними назвами каналів зберігаються в конфігурації, але типово ігноруються для маршрутизації
    - вхідна авторизація і маршрутизація каналів типово працюють за ID; пряме зіставлення імені користувача/sluга потребує `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Згадки та користувачі каналів">
    Повідомлення в каналах типово обмежені згадками.

    Джерела згадок:

    - явна згадка застосунку (`<@botId>`)
    - шаблони regex для згадок (`agents.list[].groupChat.mentionPatterns`, резервне значення `messages.groupChat.mentionPatterns`)
    - неявна поведінка відповідей у гілці на бота

    Керування для кожного каналу (`channels.slack.channels.<id>`; імена лише через визначення під час запуску або `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - формат ключа `toolsBySender`: `id:`, `e164:`, `username:`, `name:` або шаблон `"*"`
      (застарілі ключі без префікса досі зіставляються лише з `id:`)

  </Tab>
</Tabs>

## Гілки, сесії та теги відповідей

- Приватні повідомлення маршрутизуються як `direct`; канали — як `channel`; MPIM — як `group`.
- Із типовим `session.dmScope=main` приватні повідомлення Slack згортаються в основну сесію агента.
- Сесії каналів: `agent:<agentId>:slack:channel:<channelId>`.
- Відповіді в гілках можуть створювати суфікси сесій гілок (`:thread:<threadTs>`), коли це застосовно.
- Типове значення `channels.slack.thread.historyScope` — `thread`; типове значення `thread.inheritParent` — `false`.
- `channels.slack.thread.initialHistoryLimit` керує тим, скільки наявних повідомлень у гілці буде отримано під час початку нової сесії гілки (типово `20`; установіть `0`, щоб вимкнути).

Керування гілками відповідей:

- `channels.slack.replyToMode`: `off|first|all|batched` (типово `off`)
- `channels.slack.replyToModeByChatType`: для `direct|group|channel`
- застаріле резервне значення для прямих чатів: `channels.slack.dm.replyToMode`

Підтримуються ручні теги відповідей:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Примітка: `replyToMode="off"` вимикає **усі** гілки відповідей у Slack, включно з явними тегами `[[reply_to_*]]`. Це відрізняється від Telegram, де явні теги все ще враховуються в режимі `"off"`. Відмінність відображає моделі гілок на платформах: у Slack гілки приховують повідомлення з каналу, тоді як у Telegram відповіді залишаються видимими в основному потоці чату.

## Реакції підтвердження

`ackReaction` надсилає emoji-підтвердження, поки OpenClaw обробляє вхідне повідомлення.

Порядок визначення:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- резервне значення emoji ідентичності агента (`agents.list[].identity.emoji`, інакше "👀")

Примітки:

- Slack очікує shortcode (наприклад `"eyes"`).
- Використовуйте `""`, щоб вимкнути реакцію для облікового запису Slack або глобально.

## Потокове передавання тексту

`channels.slack.streaming` керує поведінкою попереднього перегляду в реальному часі:

- `off`: вимкнути потоковий попередній перегляд.
- `partial` (за замовчуванням): замінювати текст попереднього перегляду останнім частковим виводом.
- `block`: додавати оновлення попереднього перегляду частинами.
- `progress`: показувати текст статусу прогресу під час генерації, а потім надсилати фінальний текст.

`channels.slack.nativeStreaming` керує вбудованим потоковим передаванням тексту Slack, коли `streaming` має значення `partial` (типово: `true`).

- Щоб з'явилося вбудоване потокове передавання тексту, має бути доступна гілка відповіді. Вибір гілки й надалі визначається `replyToMode`. Без неї використовується звичайний чернетковий попередній перегляд.
- Медіа та не текстові payload повертаються до звичайної доставки.
- Якщо потокове передавання зламається посеред відповіді, OpenClaw повернеться до звичайної доставки для решти payload.

Використовуйте чернетковий попередній перегляд замість вбудованого потокового передавання тексту Slack:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Застарілі ключі:

- `channels.slack.streamMode` (`replace | status_final | append`) автоматично мігрує до `channels.slack.streaming`.
- булеве значення `channels.slack.streaming` автоматично мігрує до `channels.slack.nativeStreaming`.

## Резервна реакція набору тексту

`typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки OpenClaw обробляє відповідь, а потім видаляє її після завершення виконання. Це особливо корисно поза відповідями в гілках, які використовують типовий індикатор статусу "is typing...".

Порядок визначення:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Примітки:

- Slack очікує shortcode (наприклад `"hourglass_flowing_sand"`).
- Реакція є best-effort, а очищення намагається виконатися автоматично після завершення відповіді або сценарію помилки.

## Медіа, поділ на частини та доставка

<AccordionGroup>
  <Accordion title="Вхідні вкладення">
    Вкладення файлів Slack завантажуються з приватних URL, розміщених у Slack (потік запитів з автентифікацією токеном), і записуються до сховища медіа, якщо отримання успішне та дозволяють обмеження розміру.

    Типове обмеження розміру вхідних даних під час роботи становить `20MB`, якщо не перевизначено через `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Вихідний текст і файли">
    - частини тексту використовують `channels.slack.textChunkLimit` (типово 4000)
    - `channels.slack.chunkMode="newline"` вмикає поділ спочатку за абзацами
    - надсилання файлів використовує API завантаження Slack і може включати відповіді в гілках (`thread_ts`)
    - обмеження вихідних медіа визначається `channels.slack.mediaMaxMb`, якщо задано; інакше надсилання через канал використовують типові значення MIME-kind з конвеєра медіа
  </Accordion>

  <Accordion title="Цілі доставки">
    Бажані явні цілі:

    - `user:<id>` для приватних повідомлень
    - `channel:<id>` для каналів

    Приватні повідомлення Slack відкриваються через API conversations Slack під час надсилання до цілей користувача.

  </Accordion>
</AccordionGroup>

## Команди та поведінка слеш-команд

- Вбудований автоматичний режим команд **вимкнено** для Slack (`commands.native: "auto"` не вмикає вбудовані команди Slack).
- Увімкніть вбудовані обробники команд Slack через `channels.slack.commands.native: true` (або глобально `commands.native: true`).
- Коли вбудовані команди ввімкнено, зареєструйте відповідні слеш-команди в Slack (імена `/<command>`), за одним винятком:
  - зареєструйте `/agentstatus` для команди status (Slack резервує `/status`)
- Якщо вбудовані команди не ввімкнено, ви можете запускати одну налаштовану слеш-команду через `channels.slack.slashCommand`.
- Вбудовані меню аргументів тепер адаптують свою стратегію відображення:
  - до 5 варіантів: блоки кнопок
  - 6-100 варіантів: статичне меню вибору
  - понад 100 варіантів: зовнішній вибір з асинхронною фільтрацією варіантів, коли доступні обробники інтерактивних параметрів
  - якщо закодовані значення варіантів перевищують ліміти Slack, потік повертається до кнопок
- Для довгих payload параметрів меню аргументів слеш-команд використовують діалог підтвердження перед відправленням вибраного значення.

Типові налаштування слеш-команд:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Сесії слеш-команд використовують ізольовані ключі:

- `agent:<agentId>:slack:slash:<userId>`

і все одно маршрутизують виконання команди щодо цільової сесії розмови (`CommandTargetSessionKey`).

## Інтерактивні відповіді

Slack може відображати інтерактивні елементи керування відповідями, створеними агентом, але ця функція за замовчуванням вимкнена.

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

Коли функцію увімкнено, агенти можуть надсилати директиви відповідей лише для Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Ці директиви компілюються в Slack Block Kit і маршрутизують натискання або вибір назад через наявний шлях подій взаємодії Slack.

Примітки:

- Це специфічний для Slack UI. Інші канали не перетворюють директиви Slack Block Kit у власні системи кнопок.
- Значення інтерактивних callback — це непрозорі токени, згенеровані OpenClaw, а не вихідні значення, створені агентом.
- Якщо згенеровані інтерактивні блоки перевищать ліміти Slack Block Kit, OpenClaw повернеться до початкової текстової відповіді замість надсилання недійсного payload blocks.

## Підтвердження exec у Slack

Slack може працювати як вбудований клієнт підтвердження з інтерактивними кнопками та взаємодіями замість повернення до Web UI або термінала.

- Підтвердження exec використовують `channels.slack.execApprovals.*` для вбудованої маршрутизації приватних повідомлень/каналів.
- Підтвердження plugin також можуть визначатися через ту саму вбудовану поверхню кнопок Slack, коли запит уже потрапляє в Slack і тип id підтвердження — `plugin:`.
- Авторизація того, хто підтверджує, і далі застосовується: лише користувачі, визначені як approvers, можуть підтверджувати або відхиляти запити через Slack.

Це використовує ту саму спільну поверхню кнопок підтвердження, що й інші канали. Якщо у налаштуваннях застосунку Slack увімкнено `interactivity`, запити на підтвердження відображаються як кнопки Block Kit безпосередньо в розмові.
Коли ці кнопки присутні, вони є основним UX підтвердження; OpenClaw
має включати ручну команду `/approve` лише тоді, коли результат інструмента вказує, що підтвердження в чаті недоступні або ручне підтвердження є єдиним шляхом.

Шлях конфігурації:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (необов'язково; використовує резервне значення `commands.ownerAllowFrom`, коли можливо)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, типово: `dm`)
- `agentFilter`, `sessionFilter`

Slack автоматично вмикає вбудовані підтвердження exec, коли `enabled` не задано або має значення `"auto"` і визначається принаймні один
approver. Установіть `enabled: false`, щоб явно вимкнути Slack як вбудований клієнт підтвердження.
Установіть `enabled: true`, щоб примусово ввімкнути вбудовані підтвердження, коли approvers визначаються.

Типова поведінка без явної конфігурації підтвердження exec для Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Явна вбудована конфігурація Slack потрібна лише тоді, коли ви хочете перевизначити approvers, додати фільтри або
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

Спільне переспрямування `approvals.exec` є окремим. Використовуйте його лише тоді, коли запити на підтвердження exec також мають
маршрутизуватися до інших чатів або явно заданих зовнішніх цілей. Спільне переспрямування `approvals.plugin` також є
окремим; вбудовані кнопки Slack усе одно можуть визначати підтвердження plugin, коли ці запити вже надходять
у Slack.

Команда `/approve` у тому ж чаті також працює в каналах і приватних повідомленнях Slack, які вже підтримують команди. Див. [Exec approvals](/uk/tools/exec-approvals), щоб ознайомитися з повною моделлю переспрямування підтверджень.

## Події та поведінка під час роботи

- Редагування/видалення повідомлень і трансляції гілок перетворюються на системні події.
- Події додавання/видалення реакцій перетворюються на системні події.
- Події входу/виходу учасників, створення/перейменування каналів і додавання/видалення закріплень перетворюються на системні події.
- `channel_id_changed` може мігрувати ключі конфігурації каналу, коли ввімкнено `configWrites`.
- Метадані теми/призначення каналу вважаються ненадійним контекстом і можуть бути вставлені в контекст маршрутизації.
- Ініціатор гілки та початкове заповнення контексту історії гілки фільтруються за налаштованими allowlist відправників, коли це застосовно.
- Дії блоків і взаємодії з модальними вікнами породжують структуровані системні події `Slack interaction: ...` з насиченими полями payload:
  - дії блоків: вибрані значення, мітки, значення picker і метадані `workflow_*`
  - події модальних вікон `view_submission` і `view_closed` з маршрутизованими метаданими каналу та полями форми

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - Slack](/uk/gateway/configuration-reference#slack)

  Важливі поля Slack:
  - режим/автентифікація: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - доступ до приватних повідомлень: `dm.enabled`, `dmPolicy`, `allowFrom` (застаріле: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - перемикач сумісності: `dangerouslyAllowNameMatching` (аварійний варіант; не вмикайте без потреби)
  - доступ до каналів: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - гілки/історія: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - операції/можливості: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Немає відповідей у каналах">
    Перевірте по черзі:

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
    - підтвердження підключення / записи allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Режим Socket не підключається">
    Перевірте дійсність токенів бота + застосунку та те, що Socket Mode увімкнено в налаштуваннях застосунку Slack.

    Якщо `openclaw channels status --probe --json` показує `botTokenStatus` або
    `appTokenStatus: "configured_unavailable"`, обліковий запис Slack
    налаштовано, але поточне середовище виконання не змогло визначити значення,
    що зберігається через SecretRef.

  </Accordion>

  <Accordion title="HTTP-режим не отримує події">
    Перевірте:

    - signing secret
    - шлях webhook
    - URL-адреси Request URL у Slack (Events + Interactivity + Slash Commands)
    - унікальний `webhookPath` для кожного HTTP-облікового запису

    Якщо `signingSecretStatus: "configured_unavailable"` з'являється у знімках
    облікових записів, HTTP-обліковий запис налаштовано, але поточне середовище виконання не змогло
    визначити signing secret, що зберігається через SecretRef.

  </Accordion>

  <Accordion title="Вбудовані/слеш-команди не спрацьовують">
    Переконайтеся, що ви мали на увазі:

    - режим вбудованих команд (`channels.slack.commands.native: true`) з відповідними слеш-командами, зареєстрованими в Slack
    - або режим однієї слеш-команди (`channels.slack.slashCommand.enabled: true`)

    Також перевірте `commands.useAccessGroups` і allowlist каналів/користувачів.

  </Accordion>
</AccordionGroup>

## Пов'язане

- [Підключення](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Усунення несправностей](/uk/channels/troubleshooting)
- [Конфігурація](/uk/gateway/configuration)
- [Слеш-команди](/uk/tools/slash-commands)
