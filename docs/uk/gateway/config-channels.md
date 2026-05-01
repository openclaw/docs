---
read_when:
    - Налаштування Plugin каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення неполадок із ключами конфігурації для кожного каналу
    - Аудит політики прямих повідомлень, політики груп або контролю згадок
summary: 'Налаштування каналів: контроль доступу, сполучення, ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-05-01T11:53:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5de8f93b0578e76d4e8cbe7d521bf536ad24df5aaf9a5bf613a7d8196024ae11
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації окремих каналів у `channels.*`. Охоплює доступ до DM і груп,
налаштування кількох акаунтів, вимогу згадки та ключі окремих каналів для Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage та інших вбудованих channel plugins.

Для агентів, інструментів, середовища виконання gateway та інших ключів верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його секція конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і політики груп:

| Політика DM         | Поведінка                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або у сховищі дозволених сполучень) |
| `open`              | Дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                       |

| Політика груп         | Поведінка                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (типово)  | Лише групи, що відповідають налаштованому allowlist    |
| `open`                | Обійти allowlist груп (вимога згадки все одно діє)     |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити сполучення DM обмежено **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп у runtime повертається до `allowlist` (відмова за замовчуванням) із попередженням під час запуску.
</Note>

### Перевизначення моделі каналу

Використовуйте `channels.modelByChannel`, щоб закріпити конкретні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналу застосовується, коли сеанс ще не має перевизначення моделі (наприклад, заданого через `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Типові параметри каналу та Heartbeat

Використовуйте `channels.defaults` для спільної поведінки політики груп і Heartbeat між провайдерами:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: резервна політика груп, коли `groupPolicy` на рівні провайдера не встановлено.
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включає весь контекст цитат/тредів/історії), `allowlist` (включає лише контекст від дозволених відправників), `allowlist_quote` (те саме, що allowlist, але зберігає явний контекст цитати/відповіді). Перевизначення для каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні статуси каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати погіршені/помилкові статуси у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує пов’язаний сеанс.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp із кількома акаунтами">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Вихідні команди типово використовують акаунт `default`, якщо він існує; інакше перший налаштований ID акаунта (за сортуванням).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового акаунта, коли збігається з налаштованим ID акаунта.
- Застарілий каталог автентифікації Baileys для одного акаунта мігрується командою `openclaw doctor` у `whatsapp/default`.
- Перевизначення для акаунта: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; символічні посилання відхиляються), з `TELEGRAM_BOT_TOKEN` як резервним варіантом для типового акаунта.
- `apiRoot` — це лише корінь Telegram Bot API. Використовуйте `https://api.telegram.org` або ваш самостійно розгорнутий/проксійований корінь, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий кінцевий суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає типовий вибір акаунта, коли збігається з налаштованим ID акаунта.
- У налаштуваннях із кількома акаунтами (2+ ID акаунтів) задайте явний типовий акаунт (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли він відсутній або недійсний.
- `configWrites: false` блокує записи конфігурації, ініційовані Telegram (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують сталі прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантику полів наведено в [Агенти ACP](/uk/tools/acp-agents#channel-specific-settings).
- Попередні перегляди потоків Telegram використовують `sendMessage` + `editMessageText` (працює в прямих і групових чатах).
- Політика повторних спроб: див. [Політика повторних спроб](/uk/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Токен: `channels.discord.token`, із `DISCORD_BOT_TOKEN` як резервним варіантом для облікового запису за замовчуванням.
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; налаштування повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з ідентифікатором налаштованого облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) для цілей доставки; прості числові ID відхиляються.
- Слаги guild записуються малими літерами із заміною пробілів на `-`; ключі каналів використовують назву у форматі слага (без `#`). Надавайте перевагу ID guild.
- Повідомлення, створені ботами, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `maxLinesPerMessage` (типово 17) розбиває високі повідомлення навіть тоді, коли вони мають менше ніж 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до threads:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до threads (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач добровільного ввімкнення для автоматичного створення/прив’язування threads через `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і threads (використовуйте ID каналу/thread у `match.peer.id`). Семантика полів спільна в [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів Discord components v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкове автоприєднання + перевизначення LLM + TTS. Текстові конфігурації Discord типово залишають голос вимкненим; задайте `channels.discord.voice.enabled=true`, щоб увімкнути.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, яка використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE `@discordjs/voice` (типово `true` і `24`).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоприєднання (типово `30000`).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки часу від’єднана голосова сесія може витратити на перехід у сигналізацію повторного підключення, перш ніж OpenClaw її знищить (типово `15000`).
- OpenClaw додатково намагається відновити приймання голосу, виходячи з голосової сесії та повторно приєднуючись після повторюваних помилок розшифрування.
- `channels.discord.streaming` є канонічним ключем режиму потоку. Застарілі значення `streamMode` і булеві значення `streaming` мігруються автоматично.
- `channels.discord.autoPresence` відображає доступність runtime на присутність бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним іменем/тегом (режим сумісності на випадок критичної потреби).
- `channels.discord.execApprovals`: нативна для Discord доставка затверджень exec і авторизація затверджувачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі затвердження exec активуються, коли затверджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено затверджувати запити exec. Якщо пропущено, використовується резервний `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Пропустіть, щоб пересилати затвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на затвердження. `"dm"` (типово) надсилає в DM затверджувачів, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва. Коли target містить `"channel"`, кнопки можуть використовувати лише визначені затверджувачі.
  - `cleanupAfterResolve`: коли `true`, видаляє DM із затвердженнями після затвердження, відхилення або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, типово), `all` (усі повідомлення), `allowlist` (з `guilds.<id>.users` для всіх повідомлень).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON сервісного облікового запису: inline (`serviceAccount`) або на основі файлу (`serviceAccountFile`).
- SecretRef сервісного облікового запису також підтримується (`serviceAccountRef`).
- Резервні env: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення змінюваного email principal (режим сумісності на випадок критичної потреби).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного env облікового запису за замовчуванням).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (у root або для окремого облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API Bolt receiver. Використовуйте це лише під час дослідження тайм-ауту ping/pong або поведінки застарілого websocket.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають plaintext
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack відкривають поля джерела/статусу для кожних облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштований через SecretRef, але поточний шлях command/runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з ідентифікатором налаштованого облікового запису.
- `channels.slack.streaming.mode` є канонічним ключем режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним streaming transport Slack. Застарілі значення `streamMode`, булеві `streaming` і `nativeStreaming` мігруються автоматично.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сесій thread:** `thread.historyScope` є окремим для кожного thread (типово) або спільним у межах каналу. `thread.inheritParent` копіює transcript батьківського каналу в нові threads.

- Нативний streaming Slack плюс thread-статус у стилі Slack assistant "is typing..." потребують цільового thread для відповіді. DM верхнього рівня типово залишаються поза thread, тому використовують `typingReaction` або звичайну доставку замість preview у стилі thread.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка затверджень exec і авторизація затверджувачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій | Типово | Примітки                  |
| ------------ | ------- | ---------------------- |
| reactions    | увімкнено | Реагувати + список реакцій |
| messages     | увімкнено | Читати/надсилати/редагувати/видаляти  |
| pins         | увімкнено | Закріпити/відкріпити/показати список         |
| memberInfo   | увімкнено | Інформація про учасника            |
| emojiList    | увімкнено | Список користувацьких emoji      |

### Mattermost

Mattermost постачається як вбудований Plugin у поточних релізах OpenClaw. Старіші або
кастомні збірки можуть встановити поточний npm-пакет за допомогою
`openclaw plugins install @openclaw/mattermost`; якщо npm повідомляє, що
пакет, яким володіє OpenClaw, deprecated, використовуйте вбудований Plugin або локальний checkout
до публікації новішого npm-пакета.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Режими чату: `oncall` (відповідати на @-згадку, типово), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса тригера).

Коли нативні команди Mattermost увімкнені:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на endpoint Gateway OpenClaw і бути доступним із сервера Mattermost.
- Нативні slash callbacks автентифікуються за допомогою токенів для кожної команди, які Mattermost повертає під час реєстрації slash command. Якщо реєстрація завершується невдало або жодні команди не активовано, OpenClaw відхиляє callbacks з повідомленням `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів callback Mattermost може вимагати, щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен callback. Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення mention-gating для окремого каналу (`"*"` для типового значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з id налаштованого облікового запису.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (з `reactionAllowlist`).

- `channels.signal.account`: прив’язати запуск каналу до конкретної ідентичності облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з id налаштованого облікового запису.

### BlueBubbles

BlueBubbles — рекомендований шлях iMessage (на основі Plugin, налаштовується в `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Основні ключові шляхи, описані тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з id налаштованого облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних сесій ACP. Використовуйте handle BlueBubbles або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повна конфігурація каналу BlueBubbles задокументована в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Daemon або port не потрібні.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з id налаштованого облікового запису.

- Потребує Full Disk Access до Messages DB.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб вивести список чатів.
- `cliPath` може вказувати на SSH wrapper; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку host key, тому переконайтеся, що ключ хоста ретранслятора вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сесій ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix працює на основі Plugin і налаштовується в `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Автентифікація за токеном використовує `accessToken`; автентифікація за паролем використовує `userId` + `password`.
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явний HTTP(S) proxy. Іменовані облікові записи можуть перевизначити це за допомогою `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeservers. `proxy` і цей network opt-in є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у налаштуваннях із кількома обліковими записами.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені rooms і нові запрошення у стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка exec approvals і авторизація approver.
  - `enabled`: `true`, `false` або `"auto"` (типово). В auto mode exec approvals активуються, коли approvers можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: Matrix user IDs (наприклад `@owner:example.org`), яким дозволено схвалювати exec requests.
  - `agentFilter`: необов’язковий agent ID allowlist. Пропустіть, щоб пересилати approvals для всіх agents.
  - `sessionFilter`: необов’язкові шаблони session key (substring або regex).
  - `target`: куди надсилати approval prompts. `"dm"` (типово), `"channel"` (originating room) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як Matrix DMs групуються в сесії: `per-user` (типово) спільно використовує routed peer, тоді як `per-room` ізолює кожну DM room.
- Status probes Matrix і live directory lookups використовують ту саму політику proxy, що й runtime traffic.
- Повна конфігурація Matrix, правила targeting і приклади налаштування задокументовані в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams працює на основі Plugin і налаштовується в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Основні ключові шляхи, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повна конфігурація Teams (credentials, Webhook, DM/group policy, перевизначення для окремих team/каналів) задокументована в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC працює на основі Plugin і налаштовується в `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Основні ключові шляхи, описані тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з id налаштованого облікового запису.
- Повна конфігурація каналу IRC (host/port/TLS/channels/allowlists/mention gating) задокументована в [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

Запускайте кілька облікових записів на канал (кожен зі своїм `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` використовується, коли `accountId` пропущено (CLI + routing).
- Env tokens застосовуються лише до **типового** облікового запису.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб спрямувати кожен обліковий запис до іншого agent.
- Якщо ви додаєте нетиповий обліковий запис через `openclaw channels add` (або channel onboarding), поки все ще використовуєте конфігурацію каналу верхнього рівня з одним обліковим записом, OpenClaw спочатку переносить прив’язані до облікового запису значення верхнього рівня для одного облікового запису в map облікових записів каналу, щоб оригінальний обліковий запис продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише до каналу (без `accountId`) продовжують відповідати типовому обліковому запису; прив’язки з областю облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи прив’язані до облікового запису значення верхнього рівня для одного облікового запису в підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на своїх спеціальних сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Дивіться повний індекс каналів: [Канали](/uk/channels).

### Mention gating у груповому чаті

Для групових повідомлень типово **потрібна згадка** (metadata mention або безпечні regex patterns). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat і iMessage.

Видимі відповіді керуються окремо. Для group/channel rooms типово задано `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw усе ще обробляє turn, але звичайні фінальні відповіді залишаються приватними, а видимий вивід у room потребує `message(action=send)`. Задавайте `"automatic"` лише тоді, коли потрібна legacy поведінка, за якої звичайні відповіді публікуються назад у room. Щоб застосувати таку саму поведінку видимих відповідей лише через tool і до прямих чатів, задайте `messages.visibleReplies: "message_tool"`.

Якщо message tool недоступний за активною tool policy, OpenClaw повертається до автоматичних видимих відповідей замість того, щоб мовчки придушувати response. `openclaw doctor` попереджає про цю невідповідність.

Gateway гаряче перезавантажує конфігурацію `messages` після збереження файлу. Перезапуск потрібен лише тоді, коли file watching або config reload вимкнено в deployment.

**Типи згадок:**

- **Metadata mentions**: нативні platform @-mentions. Ігноруються в режимі WhatsApp self-chat.
- **Text patterns**: безпечні regex patterns у `agents.list[].groupChat.mentionPatterns`. Недійсні patterns і небезпечне nested repetition ігноруються.
- Mention gating застосовується лише тоді, коли виявлення можливе (native mentions або принаймні один pattern).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначити його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Установіть `0`, щоб вимкнути.

`messages.visibleReplies` — це глобальне значення за замовчуванням для вихідних turn; `messages.groupChat.visibleReplies` перевизначає його для вихідних turn у групах/каналах. Списки дозволених каналів і перевірка згадок усе ще визначають, чи буде turn оброблено.

#### Ліміти історії DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Розв’язання: перевизначення для окремого DM → значення провайдера за замовчуванням → без ліміту (зберігається все).

Підтримується: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим чату із собою

Додайте власний номер до `allowFrom`, щоб увімкнути режим чату із собою (ігнорує нативні @-згадки, відповідає лише на текстові шаблони):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Команди (обробка команд чату)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Відомості про команди">

- Цей блок налаштовує поверхні команд. Поточний вбудований і комплектний каталог команд див. у [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, якими володіють канали/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовано на сторінках відповідних каналів/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (булеве значення або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначте реєстрацію нативних Skills для окремого каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові пункти меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled` і відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів Gateway `chat.send` сталі записи `/config set|unset` також потребують `operator.admin`; доступна лише для читання команда `/config show` лишається доступною для звичайних операторських клієнтів з областю запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, яким керує OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для пошуку Plugin, встановлення та керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` обмежує мутації конфігурації для окремого каналу (за замовчуванням: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, що націлені на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. За замовчуванням: `true`.
- `ownerAllowFrom` — це явний список дозволених власників для команд/інструментів, доступних лише власнику. Він відокремлений від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному prompt. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Коли встановлено, це **єдине** джерело авторизації (списки дозволених каналів/спарювання та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.
- Мапа документації команд:
  - вбудований і комплектний каталог: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд, специфічні для каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди спарювання: [Спарювання](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - Dreaming пам’яті: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
