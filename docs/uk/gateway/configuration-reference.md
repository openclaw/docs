---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації channel, model, Gateway або tool
summary: Довідник з конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник з конфігурації
x-i18n:
    generated_at: "2026-04-23T18:47:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87b651be76f9a40969f42f2e6a7ca1b47135877dcb00a6165e1ab0a0feb977fe
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Довідник з конфігурації

Основний довідник із конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Ця сторінка охоплює основні поверхні конфігурації OpenClaw і містить посилання назовні, коли підсистема має власний глибший довідник. Вона **не** намагається вбудувати на одній сторінці весь каталог команд, що належать channel/Plugin, або всі глибокі параметри memory/QMD.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, яка використовується для валідації та інтерфейсу Control, із об’єднаними метаданими bundled/Plugin/channel, коли вони доступні
- `config.schema.lookup` повертає один вузол схеми з прив’язкою до шляху для інструментів детального перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий hash документації конфігурації відносно поточної поверхні схеми

Окремі розгорнуті довідники:

- [Довідник із конфігурації memory](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/uk/tools/slash-commands) для поточного каталогу вбудованих + bundled команд
- сторінки відповідних channel/Plugin для поверхонь команд, специфічних для channel

Формат конфігурації — **JSON5** (дозволені коментарі + завершальні коми). Усі поля необов’язкові — якщо їх не вказано, OpenClaw використовує безпечні значення за замовчуванням.

---

## Channels

Кожен channel запускається автоматично, коли існує його секція конфігурації (якщо не вказано `enabled: false`).

### Доступ до DM і груп

Усі channels підтримують політики DM і політики груп:

| Політика DM         | Поведінка                                                      |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код pairing; власник має схвалити |
| `allowlist`         | Лише відправники з `allowFrom` (або зі сховища paired allow)   |
| `open`              | Дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)          |
| `disabled`          | Ігнорувати всі вхідні DM                                       |

| Політика груп         | Поведінка                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (типово)  | Лише групи, що відповідають налаштованому allowlist   |
| `open`                | Обійти allowlist груп (обмеження за згадуваннями все ще застосовується) |
| `disabled`            | Блокувати всі повідомлення в групах/кімнатах          |

<Note>
`channels.defaults.groupPolicy` задає значення за замовчуванням, коли `groupPolicy` провайдера не встановлено.
Коди pairing спливають через 1 годину. Кількість очікуваних запитів на pairing для DM обмежена **3 на channel**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп під час виконання повертається до `allowlist` (закритий режим за замовчуванням) із попередженням під час запуску.
</Note>

### Перевизначення моделі для channel

Використовуйте `channels.modelByChannel`, щоб прив’язати конкретні ID channel до моделі. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Прив’язка channel застосовується, коли для сесії ще немає перевизначення моделі (наприклад, заданого через `/model`).

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

### Значення за замовчуванням для channel і Heartbeat

Використовуйте `channels.defaults` для спільної поведінки політики груп і Heartbeat для всіх провайдерів:

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
- `channels.defaults.contextVisibility`: режим видимості додаткового контексту за замовчуванням для всіх channels. Значення: `all` (типово, включати весь контекст із цитат/гілок/історії), `allowlist` (включати контекст лише від відправників у allowlist), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення на рівні channel: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати статуси справних channel у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати деградовані/error статуси у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через web channel шлюзу (Baileys Web). Він запускається автоматично, коли існує прив’язана сесія.

```json5
{
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

<Accordion title="Багатообліковий WhatsApp">

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він присутній; інакше — перший налаштований ID облікового запису (у відсортованому порядку).
- Необов’язковий параметр `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису переноситься командою `openclaw doctor` у `whatsapp/default`.
- Перевизначення на рівні облікового запису: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються), із `TELEGRAM_BOT_TOKEN` як резервним варіантом для облікового запису за замовчуванням.
- Необов’язковий параметр `channels.telegram.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.
- У конфігураціях із багатьма обліковими записами (2+ ID облікових записів) задайте явний обліковий запис за замовчуванням (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, якщо це значення відсутнє або некоректне.
- `configWrites: false` блокує ініційовані з Telegram записи конфігурації (міграції ID supergroup, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив’язки для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Попередній перегляд потокової передачі в Telegram використовує `sendMessage` + `editMessageText` (працює в особистих і групових чатах).
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
- Прямі вихідні виклики, які явно передають Discord `token`, використовують цей токен для виклику; налаштування повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий параметр `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) як цілі доставки; прості числові ID відхиляються.
- Slug-и guild мають нижній регістр, а пробіли в них замінюються на `-`; ключі channel використовують slug-ім’я (без `#`). Віддавайте перевагу ID guild.
- Повідомлення, створені ботом, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно відфільтровуються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення на рівні channel) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `maxLinesPerMessage` (типово 17) розбиває довгі за висотою повідомлення, навіть якщо вони коротші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією, прив’язаною до гілок Discord:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до гілок (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокусу через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач opt-in для автоматичного створення/прив’язки гілок через `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив’язки для channel і гілок (використовуйте id channel/гілки в `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + TTS.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` напряму передаються в параметри DAVE `@discordjs/voice` (типово `true` і `24`).
- Крім того, OpenClaw намагається відновити прийом голосу, виходячи та повторно входячи в голосову сесію після повторних збоїв дешифрування.
- `channels.discord.streaming` — канонічний ключ режиму потокової передачі. Застарілі значення `streamMode` і булеві значення `streaming` мігруються автоматично.
- `channels.discord.autoPresence` відображає доступність runtime у статус присутності бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінюваними іменами/тегами (аварійний режим сумісності).
- `channels.discord.execApprovals`: доставка схвалень exec у стилі Discord і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати exec-запити. Якщо не вказано, використовується резервний варіант `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Не вказуйте, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово) надсилає в DM схвалювачів, `"channel"` надсилає у вихідний channel, `"both"` надсилає в обидва місця. Коли `target` містить `"channel"`, кнопки можуть використовувати лише визначені схвалювачі.
  - `cleanupAfterResolve`: якщо `true`, видаляє DM для схвалення після схвалення, відхилення або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, типово), `all` (усі повідомлення), `allowlist` (від `guilds.<id>.users` для всіх повідомлень).

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

- JSON службового облікового запису: вбудований (`serviceAccount`) або на основі файла (`serviceAccountFile`).
- Також підтримується SecretRef службового облікового запису (`serviceAccountRef`).
- Резервні варіанти env: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` як цілі доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінюваними email-принципалами (аварійний режим сумісності).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
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

- **Режим Socket** вимагає і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного варіанта env облікового запису за замовчуванням).
- **Режим HTTP** вимагає `botToken` плюс `signingSecret` (у корені або для конкретного облікового запису).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack показують поля джерела/статусу для кожного облікового даних, такі як
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує ініційовані зі Slack записи конфігурації.
- Необов’язковий параметр `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.
- `channels.slack.streaming.mode` — канонічний ключ режиму потокової передачі Slack. `channels.slack.streaming.nativeTransport` керує нативним транспортом потокової передачі Slack. Застарілі значення `streamMode`, булеві значення `streaming` і `nativeStreaming` мігруються автоматично.
- Використовуйте `user:<id>` (DM) або `channel:<id>` як цілі доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

**Ізоляція сесій гілок:** `thread.historyScope` задається для кожної гілки окремо (типово) або спільно для channel. `thread.inheritParent` копіює транскрипт батьківського channel у нові гілки.

- Нативна потокова передача Slack плюс статус гілки в стилі помічника Slack “is typing...” вимагають ціль відповіді в гілці. DM верхнього рівня типово залишаються поза гілкою, тому замість попереднього перегляду в стилі гілки вони використовують `typingReaction` або звичайну доставку.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: доставка схвалень exec у стилі Slack і авторизація схвалювачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій   | Типово  | Примітки               |
| ----------- | ------- | ---------------------- |
| reactions   | увімкнено | Реагування + список реакцій |
| messages    | увімкнено | Читання/надсилання/редагування/видалення |
| pins        | увімкнено | Закріплення/відкріплення/список |
| memberInfo  | увімкнено | Інформація про учасника |
| emojiList   | увімкнено | Список користувацьких emoji |

### Mattermost

Mattermost постачається як Plugin: `openclaw plugins install @openclaw/mattermost`.

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

Режими чату: `oncall` (відповідати на згадування через @, типово), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса-тригера).

Коли ввімкнено нативні команди Mattermost:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повним URL.
- `commands.callbackUrl` має вказувати на endpoint Gateway OpenClaw і бути доступним із сервера Mattermost.
- Нативні callback-и slash команд автентифікуються за допомогою токенів для кожної команди, які
  Mattermost повертає під час реєстрації slash команд. Якщо реєстрація не вдається або
  жодну команду не активовано, OpenClaw відхиляє callback-и з помилкою
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів callback-ів Mattermost може вимагати, щоб
  `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен callback-а.
  Використовуйте значення хоста/домену, а не повні URL.
- `channels.mattermost.configWrites`: дозволяти або забороняти ініційовані з Mattermost записи конфігурації.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в channels.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення обмеження за згадуванням для конкретного channel (`"*"` для типового значення).
- Необов’язковий параметр `channels.mattermost.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.

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

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

- `channels.signal.account`: прив’язати запуск channel до конкретної ідентичності облікового запису Signal.
- `channels.signal.configWrites`: дозволяти або забороняти ініційовані з Signal записи конфігурації.
- Необов’язковий параметр `channels.signal.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (на основі Plugin, налаштовується в `channels.bluebubbles`).

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

- Основні шляхи ключів, охоплені тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий параметр `channels.bluebubbles.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних сесій ACP. Використовуйте handle BlueBubbles або рядок цілі (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повна конфігурація channel BlueBubbles задокументована в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Демон або порт не потрібні.

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

- Необов’язковий параметр `channels.imessage.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.

- Потрібен Full Disk Access до БД Messages.
- Віддавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ relay-хоста вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволяти або забороняти ініційовані з iMessage записи конфігурації.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сесій ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH-обгортки iMessage">

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

- Автентифікація токеном використовує `accessToken`; автентифікація паролем використовує `userId` + `password`.
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S)-proxy. Іменовані облікові записи можуть перевизначати його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і цей opt-in для мережі є незалежними механізмами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із багатьма обліковими записами.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати та нові запрошення в стилі DM ігноруються, доки ви не встановите `autoJoin: "allowlist"` із `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: доставка схвалень exec у стилі Matrix і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати exec-запити.
  - `agentFilter`: необов’язковий allowlist ID агентів. Не вказуйте, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово), `"channel"` (вихідна кімната) або `"both"`.
  - Перевизначення на рівні облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (типово) спільно використовує сесію за маршрутизованим peer, тоді як `per-room` ізолює кожну кімнату DM.
- Перевірки статусу Matrix і live-пошук у каталозі використовують ту саму політику proxy, що й трафік runtime.
- Повна конфігурація Matrix, правила адресації та приклади налаштування задокументовані в [Matrix](/uk/channels/matrix).

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

- Основні шляхи ключів, охоплені тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повна конфігурація Teams (облікові дані, Webhook, політика DM/груп, перевизначення для окремих team/channel) задокументована в [Microsoft Teams](/uk/channels/msteams).

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

- Основні шляхи ключів, охоплені тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий параметр `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з ID налаштованого облікового запису.
- Повна конфігурація channel IRC (host/port/TLS/channels/allowlist/обмеження за згадуванням) задокументована в [IRC](/uk/channels/irc).

### Багатообліковість (усі channels)

Запускайте кілька облікових записів для одного channel (кожен із власним `accountId`):

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

- `default` використовується, коли `accountId` не вказано (CLI + маршрутизація).
- Токени env застосовуються лише до облікового запису **default**.
- Базові налаштування channel застосовуються до всіх облікових записів, якщо не перевизначені для конкретного облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте не-default обліковий запис через `openclaw channels add` (або під час онбордингу channel), поки ще використовуєте top-level конфігурацію channel для одного облікового запису, OpenClaw спочатку переносить значення top-level для одного облікового запису, що належать до області облікового запису, у мапу облікових записів channel, щоб початковий обліковий запис і далі працював. Більшість channels переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default-ціль.
- Наявні прив’язки лише для channel (без `accountId`) і далі відповідатимуть обліковому запису default; прив’язки в межах облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи top-level значення для одного облікового запису, що належать до області облікового запису, у вибраний для цього channel promoted account. Більшість channels використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default-ціль.

### Інші channel на основі Plugin

Багато channel на основі Plugin налаштовуються як `channels.<id>` і задокументовані на їхніх окремих сторінках channel (наприклад, Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Див. повний індекс channel: [Channels](/uk/channels).

### Обмеження групового чату за згадуванням

Для повідомлень у групах типово **потрібна згадка** (згадка в метаданих або безпечні regex-шаблони). Це застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

**Типи згадок:**

- **Згадки в метаданих**: нативні @-згадки платформи. Ігноруються в режимі self-chat WhatsApp.
- **Текстові шаблони**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Неприпустимі шаблони та небезпечні вкладені повторення ігноруються.
- Обмеження за згадуванням застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Channels можуть перевизначати його через `channels.<channel>.historyLimit` (або на рівні облікового запису). Установіть `0`, щоб вимкнути.

#### Обмеження історії DM

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

Порядок визначення: перевизначення для конкретного DM → типове значення провайдера → без обмеження (зберігається все).

Підтримуються: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте власний номер у `allowFrom`, щоб увімкнути режим self-chat (ігнорує нативні @-згадки, відповідає лише на текстові шаблони):

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

### Commands (обробка chat-команд)

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

<Accordion title="Докладно про команди">

- Цей блок налаштовує поверхні команд. Актуальний каталог вбудованих + bundled команд див. у [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка — **довідник ключів конфігурації**, а не повний каталог команд. Команди, що належать channel/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовані на сторінках відповідних channel/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, але залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, але залишає Slack вимкненим.
- Перевизначення для окремого channel: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначайте реєстрацію нативних команд Skills для окремого channel через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для shell хоста. Потребує `tools.elevated.enabled` і наявності відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; доступний лише для читання `/config show` залишається доступним для звичайних клієнтів оператора з правами на запис.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованої OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для пошуку Plugin, встановлення та елементів керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` керує мутаціями конфігурації для кожного channel (типово: true).
- Для channels із багатьма обліковими записами `channels.<provider>.accounts.<id>.configWrites` також керує записами, націленими на цей обліковий запис (наприклад `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. Типове значення: `true`.
- `ownerAllowFrom` — це явний allowlist власника для команд/інструментів, доступних лише власнику. Він відокремлений від `allowFrom`.
- `ownerDisplay: "hash"` хешує id власника в системному prompt. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Якщо його встановлено, це **єдине** джерело авторизації (allowlist/pairing channel і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.
- Відображення документації команд:
  - каталог вбудованих + bundled: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд, специфічні для channel: [Channels](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди pairing: [Pairing](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - dreaming для memory: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Значення агентів за замовчуванням

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime системного prompt. Якщо не встановлено, OpenClaw автоматично визначає його, піднімаючись вгору від workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий allowlist Skills для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Не вказуйте `agents.defaults.skills`, щоб типово дозволити необмежені Skills.
- Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
- Установіть `agents.list[].skills: []`, щоб не дозволити жодних Skills.
- Непорожній список `agents.list[].skills` є фінальним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли workspace вбудовуються в системний prompt. Типове значення: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне вбудовування bootstrap workspace, зменшуючи розмір prompt. Запуски Heartbeat і повторні спроби після Compaction усе одно перебудовують контекст.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів у кожному bootstrap-файлі workspace до обрізання. Типове значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вбудовуються з усіх bootstrap-файлів workspace. Типове значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
Типове значення: `"once"`.

- `"off"`: ніколи не вбудовувати текст попередження в системний prompt.
- `"once"`: вбудовувати попередження один раз для кожної унікальної сигнатури обрізання (рекомендовано).
- `"always"`: вбудовувати попередження під час кожного запуску, якщо є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта відповідальності за бюджет контексту

OpenClaw має кілька об’ємних бюджетів prompt/контексту, і вони
навмисно розділені за підсистемами, а не проходять через один загальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне вбудовування bootstrap workspace.
- `agents.defaults.startupContext.*`:
  одноразовий стартовий пролог для `/new` і `/reset`, включно з недавніми
  файлами `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, вбудований у системний prompt.
- `agents.defaults.contextLimits.*`:
  обмежені витяги runtime і вбудовані блоки, що належать runtime.
- `memory.qmd.limits.*`:
  розмір фрагментів і вбудовування для індексованого memory-search.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовим прологом першого ходу, який вбудовується під час запусків bare `/new` і `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Спільні типові значення для обмежених поверхонь контексту runtime.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: типове обмеження витягу `memory_get` до додавання
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines`
  не вказано.
- `toolResultMaxChars`: поточне обмеження результатів інструментів, що використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: обмеження витягу AGENTS.md, що використовується під час вбудовування
  оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних параметрів `contextLimits`. Не вказані поля успадковуються
з `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Глобальне обмеження для компактного списку Skills, вбудованого в системний prompt. Це
не впливає на читання файлів `SKILL.md` на вимогу.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Перевизначення бюджету prompt для Skills для окремого агента.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Максимальний розмір у пікселях для довшої сторони зображення в блоках зображень transcript/tool перед викликами провайдера.
Типове значення: `1200`.

Менші значення зазвичай зменшують використання vision-токенів і розмір payload запиту для запусків із великою кількістю знімків екрана.
Більші значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного prompt (не для часових міток повідомлень). Якщо не встановлено, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному prompt. Типове значення: `auto` (налаштування ОС).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Форма рядка задає лише основну модель.
  - Форма об’єкта задає основну модель плюс упорядкований список моделей для failover.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація vision-моделі.
  - Також використовується як резервна маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею tool/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-2` для OpenAI Images.
  - Якщо ви безпосередньо вибираєте provider/model, також налаштуйте відповідну автентифікацію провайдера/API key (наприклад `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` для `openai/*`, `FAL_KEY` для `fal/*`).
  - Якщо не вказано, `image_generate` усе одно може визначити типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо не вказано, `music_generate` усе одно може визначити типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації музики в порядку provider-id.
  - Якщо ви безпосередньо вибираєте provider/model, також налаштуйте відповідну автентифікацію провайдера/API key.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо не вказано, `video_generate` усе одно може визначити типове значення провайдера з автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації відео в порядку provider-id.
  - Якщо ви безпосередньо вибираєте provider/model, також налаштуйте відповідну автентифікацію провайдера/API key.
  - Bundled-провайдер генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` та `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо не вказано, інструмент PDF використовує резервно `imageModel`, а потім визначену модель сесії/типову модель.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передається під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, які враховуються режимом резервного витягування в інструменті `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типове значення: `"off"`.
- `elevatedDefault`: типовий рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типове значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад `openai/gpt-5.4`). Якщо ви не вкажете провайдера, OpenClaw спочатку пробує alias, потім унікальний збіг exact model id серед налаштованих провайдерів, і лише після цього використовує типового налаштованого провайдера (застаріла поведінка сумісності, тому краще явно вказувати `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw переходить до першої налаштованої пари provider/model замість того, щоб показувати застаріле типове значення видаленого провайдера.
- `models`: каталог налаштованих моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
  - Безпечне редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відхиляє заміни, які видалили б наявні записи allowlist, якщо не передано `--replace`.
  - Потоки configure/onboarding на рівні провайдера об’єднують вибрані моделі провайдера в цю мапу й зберігають уже налаштованих, не пов’язаних із цим провайдерів.
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (для відповідного id агента) перевизначає за ключем. Докладніше див. у [Prompt Caching](/uk/reference/prompt-caching).
- `embeddedHarness`: типова низькорівнева політика runtime для вбудованого агента. Використовуйте `runtime: "auto"`, щоб зареєстровані harness-и Plugin могли підхоплювати підтримувані моделі, `runtime: "pi"` для примусового використання вбудованого harness PI або зареєстрований id harness, наприклад `runtime: "codex"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід на PI.
- Засоби запису конфігурації, які змінюють ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об’єкта й за можливості зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно виконується послідовно). Типове значення: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` керує тим, який низькорівневий виконавець запускає ходи вбудованого агента.
У більшості розгортань слід залишати типове значення `{ runtime: "auto", fallback: "pi" }`.
Використовуйте це, коли довірений Plugin надає нативний harness, наприклад bundled
harness app-server Codex.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` або id зареєстрованого harness Plugin. Bundled Plugin Codex реєструє `codex`.
- `fallback`: `"pi"` або `"none"`. `"pi"` зберігає вбудований harness PI як резерв сумісності, коли не вибрано жодного harness Plugin. `"none"` призводить до помилки у разі відсутнього або непідтримуваного вибору harness Plugin замість тихого переходу на PI. Помилки вибраного harness Plugin завжди показуються безпосередньо.
- Перевизначення через середовище: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` вимикає резервний перехід на PI для цього процесу.
- Для розгортань лише з Codex установіть `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` і `embeddedHarness.fallback: "none"`.
- Вибір harness закріплюється за кожним id сесії після першого вбудованого запуску. Зміни конфігурації/env впливають на нові або скинуті сесії, а не на наявний transcript. Застарілі сесії з історією transcript, але без записаного закріплення, вважаються закріпленими за PI. `/status` показує не-PI id harness, такі як `codex`, поруч із `Fast`.
- Це керує лише вбудованим harness чату. Генерація медіа, vision, PDF, музика, відео та TTS і далі використовують свої налаштування provider/model.

**Вбудовані скорочення alias** (застосовуються лише тоді, коли модель є в `agents.defaults.models`):

| Alias               | Модель                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ваші налаштовані alias завжди мають пріоритет над типовими.

Для моделей Z.AI GLM-4.x thinking mode вмикається автоматично, якщо ви не встановите `--thinking off` або самі не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Для моделей Z.AI типово вмикається `tool_stream` для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути його.
Для моделей Anthropic Claude 4.6 типово використовується `adaptive` thinking, коли явний рівень thinking не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери недоступні.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-бекенди орієнтовані насамперед на текст; інструменти завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Наскрізна передача зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь системний prompt, зібраний OpenClaw, фіксованим рядком. Задається на типовому рівні (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілами ігнорується. Корисно для контрольованих експериментів із prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Незалежні від провайдера накладки prompt, що застосовуються за сімейством моделей. Ідентифікатори моделей сімейства GPT-5 отримують спільний поведінковий контракт між провайдерами; `personality` керує лише шаром дружнього стилю взаємодії.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (типово) і `"on"` вмикають шар дружнього стилю взаємодії.
- `"off"` вимикає лише дружній шар; позначений поведінковий контракт GPT-5 залишається ввімкненим.
- Застаріле `plugins.entries.openai.config.personality` і далі зчитується, коли це спільне налаштування не задане.

### `agents.defaults.heartbeat`

Періодичні запуски Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). Типове значення: `30m` (автентифікація через API key) або `1h` (автентифікація через OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: якщо `false`, прибирає секцію Heartbeat із системного prompt і пропускає вбудовування `HEARTBEAT.md` у bootstrap-контекст. Типове значення: `true`.
- `suppressToolErrorWarnings`: якщо `true`, пригнічує payload попереджень про помилки інструментів під час запусків Heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента Heartbeat перед примусовим перериванням. Залиште незаданим, щоб використовувати `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/доставки в DM. `allow` (типово) дозволяє доставку за прямою ціллю. `block` пригнічує доставку за прямою ціллю й видає `reason=dm-blocked`.
- `lightContext`: якщо `true`, запуски Heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів workspace.
- `isolatedSession`: якщо `true`, кожен запуск Heartbeat виконується в новій сесії без попередньої історії розмови. Та сама схема ізоляції, що й у Cron `sessionTarget: "isolated"`. Зменшує вартість одного Heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat запускаються **лише для цих агентів**.
- Heartbeat виконують повні ходи агента — коротші інтервали витрачають більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` або `safeguard` (підсумовування частинами для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin провайдера Compaction. Якщо вказано, замість вбудованого LLM-підсумовування викликається `summarize()` провайдера. У разі помилки виконується повернення до вбудованого варіанта. Установлення провайдера примусово задає `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction, після чого OpenClaw перериває її. Типове значення: `900`.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст про збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов’язкові назви секцій H2/H3 з AGENTS.md для повторного вбудовування після Compaction. Типово `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторне вбудовування. Якщо не задано або явно задано цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, якщо основна сесія має залишатися на одній моделі, а підсумки Compaction — виконуватися на іншій; якщо не задано, Compaction використовує основну модель сесії.
- `notifyUser`: якщо `true`, надсилає користувачу короткі сповіщення, коли Compaction починається і коли завершується (наприклад, “Compacting context...” і “Compaction complete”). Типово вимкнено, щоб Compaction залишався беззвучним.
- `memoryFlush`: тихий агентний хід перед автоматичною Compaction для збереження довготривалих memory. Пропускається, якщо workspace доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** з контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` керує тим, як часто обрізання може виконуватися повторно (після останнього торкання кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім за потреби повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок + кінець і вставляє `...` посередині.

**Повне очищення** замінює весь результат інструмента на заповнювач.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення рахуються за символами (приблизно), а не за точною кількістю токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. [Session Pruning](/uk/concepts/session-pruning).

### Потокова передача блоками

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Channels, відмінні від Telegram, потребують явного `*.blockStreaming: true`, щоб увімкнути відповіді блоками.
- Перевизначення для channel: `channels.<channel>.blockStreamingCoalesce` (і варіанти на рівні облікового запису). Для Signal/Slack/Discord/Google Chat типово `minChars: 1500`.
- `humanDelay`: випадкова пауза між відповідями блоками. `natural` = 800–2500 ms. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Докладніше про поведінку й поділ на блоки див. у [Streaming](/uk/concepts/streaming).

### Індикатори набору тексту

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Типові значення: `instant` для особистих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Докладніше див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкове sandbox-ізолювання для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Докладно про sandbox">

**Бекенд:**

- `docker`: локальний runtime Docker (типово)
- `ssh`: універсальний віддалений runtime на основі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для runtime, переносяться до
`plugins.entries.openshell.config`.

**Конфігурація SSH-бекенда:**

- `target`: ціль SSH у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь для workspace на рівні scope
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного знімка runtime секретів до початку sandbox-сесії

**Поведінка SSH-бекенда:**

- один раз ініціалізує віддалений workspace після створення або повторного створення
- потім зберігає віддалений SSH-workspace як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує browser-контейнери sandbox

**Доступ до workspace:**

- `none`: sandbox-workspace на рівні scope у `~/.openclaw/sandboxes`
- `ro`: sandbox-workspace у `/workspace`, workspace агента монтується лише для читання в `/agent`
- `rw`: workspace агента монтується для читання й запису в `/workspace`

**Scope:**

- `session`: окремий контейнер + workspace для кожної сесії
- `agent`: один контейнер + workspace для кожного агента (типово)
- `shared`: спільний контейнер і workspace (без ізоляції між сесіями)

**Конфігурація Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: перед `exec` ініціалізує віддалене середовище з локального, після `exec` синхронізує назад; локальний workspace залишається канонічним
- `remote`: один раз ініціалізує віддалене середовище під час створення sandbox, після чого віддалений workspace залишається канонічним

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після етапу початкової ініціалізації.
Транспортом є SSH до sandbox OpenShell, але Plugin керує життєвим циклом sandbox і необов’язковою синхронізацією mirror.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потрібні вихід у мережу, root-файлова система з можливістю запису та користувач root.

**Контейнери типово використовують `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихід назовні.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (аварійний режим).

**Вхідні вкладення** розміщуються в `media/inbound/*` у поточному workspace.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки й прив’язки для окремого агента об’єднуються.

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вбудовується в системний prompt. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача через noVNC типово використовує автентифікацію VNC, а OpenClaw видає короткоживучий URL із токеном (замість розкриття пароля у спільному URL).

- `allowHostControl: false` (типово) блокує для sandboxed-сесій націлювання на browser хоста.
- `network` типово має значення `openclaw-sandbox-browser` (окрема bridge-мережа). Установлюйте `bridge` лише тоді, коли вам явно потрібна глобальна зв’язність bridge-мережі.
- `cdpSourceRange` за потреби обмежує вхідний CDP-трафік на межі контейнера до діапазону CIDR (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер sandbox browser. Якщо вказано (включно з `[]`), воно замінює `docker.binds` для контейнера browser.
- Типові параметри запуску визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для хостів із контейнерами:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (типово ввімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово ввімкнені й можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо цього потребує використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш сценарій
    роботи залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - а також `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для образу контейнера; щоб змінити типові параметри контейнера, використовуйте власний
    образ browser із власним entrypoint.

</Accordion>

Ізоляція browser у sandbox і `sandbox.docker.binds` підтримуються лише для Docker.

Збирання образів:

```bash
scripts/sandbox-setup.sh           # основний образ sandbox
scripts/sandbox-browser-setup.sh   # необов’язковий образ browser
```

### `agents.list` (перевизначення для окремого агента)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: стабільний id агента (обов’язково).
- `default`: якщо таких позначено кілька, перший має пріоритет (записується попередження). Якщо не позначено жодного, типовим стає перший запис у списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback). Завдання Cron, які перевизначають лише `primary`, і далі успадковують типові fallback, якщо ви явно не встановите `fallbacks: []`.
- `params`: параметри потоку для окремого агента, які зливаються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для перевизначень, специфічних для агента, таких як `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `skills`: необов’язковий allowlist Skills для окремого агента. Якщо не вказано, агент успадковує `agents.defaults.skills`, коли це налаштовано; явний список замінює типові значення замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для окремого повідомлення або сесії.
- `reasoningDefault`: необов’язкове типове значення видимості reasoning для окремого агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для окремого повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення fast mode для окремого агента (`true | false`). Застосовується, коли не задано перевизначення fast mode для окремого повідомлення або сесії.
- `embeddedHarness`: необов’язкове перевизначення політики низькорівневого harness для окремого агента. Використовуйте `{ runtime: "codex", fallback: "none" }`, щоб зробити один агент лише Codex, поки інші агенти зберігають типовий резервний PI.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` разом із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент повинен типово використовувати сесії harness ACP.
- `identity.avatar`: шлях відносно workspace, `http(s)` URL або `data:` URI.
- `identity` виводить типові значення: `ackReaction` із `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist id агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Захист успадкування sandbox: якщо сесія, що ініціює запит, працює в sandbox, `sessions_spawn` відхиляє цілі, які були б запущені без sandbox.
- `subagents.requireAgentId`: коли `true`, блокує виклики `sessions_spawn`, які не містять `agentId` (примушує до явного вибору профілю; типово: false).

---

## Маршрутизація між агентами

Запускайте кілька ізольованих агентів усередині одного Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Поля збігу bindings

- `type` (необов’язково): `route` для звичайної маршрутизації (якщо тип не вказано, типово використовується route), `acp` для постійних ACP-прив’язок розмов.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо пропущено = обліковий запис за замовчуванням)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для channel)
- `acp` (необов’язково; лише для записів `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігу:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на рівні channel)
6. Агент за замовчуванням

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw виконує зіставлення за точною ідентичністю розмови (`match.channel` + account + `match.peer.id`) і не використовує наведений вище порядок рівнів route bindings.

### Профілі доступу для окремих агентів

<Accordion title="Повний доступ (без sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Інструменти лише для читання + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Без доступу до файлової системи (лише обмін повідомленнями)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Докладніше про пріоритети див. у [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Докладно про поля Session">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту channel.
  - `global`: усі учасники в контексті channel спільно використовують одну сесію (використовуйте лише тоді, коли потрібен спільний контекст).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM спільно використовують основну сесію.
  - `per-peer`: ізоляція за id відправника між channels.
  - `per-channel-peer`: ізоляція для кожного channel + відправника (рекомендовано для inbox із кількома користувачами).
  - `per-account-channel-peer`: ізоляція для кожного облікового запису + channel + відправника (рекомендовано для багатообліковості).
- **`identityLinks`**: мапа канонічних id до peer із префіксом провайдера для спільного використання сесії між channels.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, спрацьовує той, який настає раніше.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` батьківської сесії, дозволене під час створення fork-сесії гілки (типово `100000`).
  - Якщо `totalTokens` батьківської сесії перевищує це значення, OpenClaw запускає нову сесію гілки замість успадкування історії transcript батьківської сесії.
  - Установіть `0`, щоб вимкнути цей запобіжник і завжди дозволяти fork від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для основного кошика direct-chat.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість відповідей назад і вперед між агентами під час обміну агент-до-агента (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжки ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона має пріоритет.
- **`maintenance`**: очищення сховища сесій + параметри зберігання.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: ротує `sessions.json`, коли його розмір перевищує це значення (типово `10mb`).
  - `resetArchiveRetention`: строк зберігання архівів transcript `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий жорсткий бюджет диска для каталогу сесій. У режимі `warn` записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово становить `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до гілок.
  - `enabled`: головний перемикач типового значення (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокусу через неактивність у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типове жорстке обмеження максимального віку в годинах (`0` вимикає; провайдери можуть перевизначати)

</Accordion>

---

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Префікс відповіді

Перевизначення для channel/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Порядок визначення (найспецифічніше перемагає): обліковий запис → channel → глобальне. `""` вимикає й зупиняє каскадування. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна           | Опис                   | Приклад                     |
| ---------------- | ---------------------- | --------------------------- |
| `{model}`        | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`    | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`     | Назва провайдера       | `anthropic`                 |
| `{thinkingLevel}`| Поточний рівень thinking | `high`, `low`, `off`      |
| `{identity.name}`| Назва identity агента  | (те саме, що `"auto"`)      |

Змінні нечутливі до регістру. `{think}` є alias для `{thinkingLevel}`.

### Реакція підтвердження

- Типово береться з `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → channel → `messages.ackReaction` → резервне значення identity.
- Область дії: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє підтвердження після відповіді в Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо значення не задано, реакції статусу залишаються ввімкненими, коли активні реакції підтвердження.
  У Telegram для ввімкнення реакцій статусу життєвого циклу потрібно явно встановити `true`.

### Вхідний debounce

Об’єднує швидкі текстові повідомлення від того самого відправника в один хід агента. Media/вкладення скидаються негайно. Керівні команди оминають debounce.

### TTS (перетворення тексту в мовлення)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` керує типовим режимом автоматичного TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` типово ввімкнено; `modelOverrides.allowProvider` типово має значення `false` (opt-in).
- API key резервно беруться з `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на endpoint, відмінний від OpenAI, OpenClaw розглядає його як OpenAI-сумісний TTS-сервер і послаблює перевірку моделі/голосу.

---

## Talk

Типові значення для режиму Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` має відповідати ключу в `talk.providers`, коли налаштовано кількох провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- Voice ID резервно беруться з `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає рядки у відкритому вигляді або об’єкти SecretRef.
- Резервний варіант `ELEVENLABS_API_KEY` застосовується лише тоді, коли не налаштовано API key Talk.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні назви.
- `silenceTimeoutMs` керує тим, скільки Talk mode чекає після тиші користувача, перш ніж надіслати transcript. Якщо не задано, зберігається типове для платформи вікно паузи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Tools

### Профілі інструментів

`tools.profile` задає базовий allowlist перед застосуванням `tools.allow`/`tools.deny`:

Локальний онбординг типово встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явні профілі зберігаються).

| Профіль     | Включає                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Без обмежень (те саме, що не вказано)                                                                                           |

### Групи інструментів

| Група              | Інструменти                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як alias для `exec`)                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                            |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                                                      |
| `group:automation` | `cron`, `gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                       |
| `group:openclaw`   | Усі вбудовані інструменти (без provider Plugin)                                                                          |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Нечутлива до регістру, підтримує wildcard `*`. Застосовується навіть тоді, коли Docker sandbox вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для конкретних провайдерів або моделей. Порядок: базовий профіль → профіль провайдера → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Керує elevated-доступом до exec поза sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Перевизначення для окремого агента (`agents.list[].tools.elevated`) може лише додатково обмежувати.
- `/elevated on|off|ask|full` зберігає стан для кожної сесії; inline-директиви застосовуються до одного повідомлення.
- Elevated `exec` обходить sandboxing і використовує налаштований шлях виходу (`gateway` типово, або `node`, коли ціллю exec є `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Перевірки безпеки циклів інструментів **типово вимкнені**. Установіть `enabled: true`, щоб активувати виявлення.
Налаштування можна задавати глобально в `tools.loopDetection` і перевизначати для окремого агента в `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: максимальна історія викликів інструментів, що зберігається для аналізу циклів.
- `warningThreshold`: поріг повторюваного шаблону без прогресу для попереджень.
- `criticalThreshold`: вищий поріг повторення для блокування критичних циклів.
- `globalCircuitBreakerThreshold`: жорсткий поріг зупинки для будь-якого запуску без прогресу.
- `detectors.genericRepeat`: попереджати про повторні виклики того самого інструмента з тими самими аргументами.
- `detectors.knownPollNoProgress`: попереджати/блокувати відомі інструменти опитування (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати шаблони чергування пар без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, валідація не проходить.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Налаштовує розуміння вхідних media (зображення/аудіо/відео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Поля запису моделі Media">

**Запис провайдера** (`type: "provider"` або пропущено):

- `provider`: id API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення id моделі
- `profile` / `preferredProfile`: вибір профілю з `auth-profiles.json`

**Запис CLI** (`type: "cli"`):

- `command`: виконуваний файл для запуску
- `args`: шаблонізовані аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов’язковий список (`image`, `audio`, `video`). Типові значення: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
- У разі помилки використовується наступний запис.

Автентифікація провайдера використовує стандартний порядок: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Поля асинхронного завершення:**

- `asyncCompletion.directSend`: коли `true`, завершені асинхронні завдання `music_generate`
  і `video_generate` спочатку намагаються виконати пряму доставку в channel. Типове значення: `false`
  (застарілий шлях пробудження requester-session/доставки моделі).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Керує тим, на які сесії можуть націлюватися інструменти сесій (`sessions_list`, `sessions_history`, `sessions_send`).

Типове значення: `tree` (поточна сесія + сесії, породжені нею, наприклад subagents).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Примітки:

- `self`: лише ключ поточної сесії.
- `tree`: поточна сесія + сесії, породжені поточною сесією (subagents).
- `agent`: будь-яка сесія, що належить поточному id агента (може включати інших користувачів, якщо ви запускаєте сесії per-sender під тим самим id агента).
- `all`: будь-яка сесія. Націлювання між агентами все одно потребує `tools.agentToAgent`.
- Обмеження sandbox: коли поточна сесія працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibility примусово встановлюється в `tree`, навіть якщо `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Керує підтримкою inline-вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Примітки:

- Вкладення підтримуються лише для `runtime: "subagent"`. Runtime ACP їх відхиляє.
- Файли матеріалізуються в дочірньому workspace у `.openclaw/attachments/<uuid>/` разом із `.manifest.json`.
- Вміст вкладень автоматично редагується під час збереження transcript.
- Вхідні дані base64 перевіряються зі строгими перевірками алфавіту/заповнення та захистом розміру до декодування.
- Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
- Очищення дотримується політики `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише тоді, коли `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

Експериментальні прапорці вбудованих інструментів. Типово вимкнені, якщо не застосовується правило автоматичного ввімкнення strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Примітки:

- `planTool`: вмикає структурований інструмент `update_plan` для відстеження нетривіальної багатокрокової роботи.
- Типове значення: `false`, якщо тільки `agents.defaults.embeddedPi.executionContract` (або перевизначення для окремого агента) не встановлено в `"strict-agentic"` для запуску OpenAI або OpenAI Codex сімейства GPT-5. Установіть `true`, щоб примусово ввімкнути інструмент поза цією областю, або `false`, щоб залишити його вимкненим навіть для запусків strict-agentic GPT-5.
- Коли ввімкнено, системний prompt також додає вказівки щодо використання, щоб модель використовувала його лише для суттєвої роботи й підтримувала щонайбільше один крок `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: типова модель для породжених sub-agents. Якщо не вказано, sub-agents успадковують модель викликача.
- `allowAgents`: типовий allowlist id цільових агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента не містить `runTimeoutSeconds`. `0` означає відсутність тайм-ауту.
- Політика інструментів для subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Користувацькі провайдери та base URL

OpenClaw використовує вбудований каталог моделей. Додавайте користувацьких провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Використовуйте `authHeader: true` + `headers` для користувацьких потреб автентифікації.
- Перевизначайте корінь конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий alias змінної середовища).
- Пріоритет злиття для провайдерів із відповідними ID:
  - Непорожні значення `baseUrl` з агентського `models.json` мають пріоритет.
  - Непорожні значення `apiKey` агента мають пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` провайдерів, якими керує SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань) замість збереження визначених секретів.
  - Значення заголовків провайдерів, якими керує SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань).
  - Порожні або відсутні `apiKey`/`baseUrl` агента резервно беруться з `models.providers` у конфігурації.
  - Для відповідних моделей `contextWindow`/`maxTokens` використовують більше значення між явною конфігурацією та неявними значеннями каталогу.
  - Для відповідних моделей `contextTokens` зберігає явне обмеження runtime, коли воно присутнє; використовуйте це, щоб обмежити фактичний контекст без зміни рідних метаданих моделі.
  - Використовуйте `models.mode: "replace"`, якщо хочете, щоб конфігурація повністю перезаписала `models.json`.
  - Збереження маркерів є авторитетним від джерела: маркери записуються з активного знімка конфігурації джерела (до визначення), а не з визначених значень секретів runtime.

### Докладно про поля провайдера

- `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
- `models.providers`: мапа користувацьких провайдерів, ключована за id провайдера.
  - Безпечне редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для додаткових оновлень. `config set` відхиляє руйнівні заміни, якщо не передано `--replace`.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані провайдера (краще використовувати SecretRef/підстановку env).
- `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` вставляє `options.num_ctx` у запити (типово: `true`).
- `models.providers.*.authHeader`: примусово передає облікові дані в заголовку `Authorization`, коли це потрібно.
- `models.providers.*.baseUrl`: базовий URL API вищого рівня.
- `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації через proxy/tenant.
- `models.providers.*.request`: перевизначення транспорту для HTTP-запитів model-provider.
  - `request.headers`: додаткові заголовки (зливаються з типовими значеннями провайдера). Значення приймають SecretRef.
  - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію провайдера), `"authorization-bearer"` (із `token`), `"header"` (із `headerName`, `value`, необов’язковим `prefix`).
  - `request.proxy`: перевизначення HTTP proxy. Режими: `"env-proxy"` (використовувати env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (із `url`). Обидва режими приймають необов’язковий підоб’єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTPS до `baseUrl`, якщо DNS визначається в приватні, CGNAT або подібні діапазони, через захист HTTP fetch провайдера (operator opt-in для довірених саморозміщених OpenAI-сумісних endpoint). WebSocket використовує той самий `request` для заголовків/TLS, але не цей SSRF-запобіжник fetch. Типове значення `false`.
- `models.providers.*.models`: явні записи каталогу моделей провайдера.
- `models.providers.*.models.*.contextWindow`: метадані рідного вікна контексту моделі.
- `models.providers.*.models.*.contextTokens`: необов’язкове обмеження контексту runtime. Використовуйте це, коли хочете мати менший фактичний бюджет контексту, ніж рідний `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` із непорожнім нерідним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це значення в `false` під час runtime. Порожній/відсутній `baseUrl` зберігає типову поведінку OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для OpenAI-сумісних chat-endpoint, які приймають лише рядки. Коли `true`, OpenClaw сплющує масиви `messages[].content`, що містять лише текст, у звичайні рядки перед надсиланням запиту.
- `plugins.entries.amazon-bedrock.config.discovery`: корінь налаштувань автовиявлення Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр provider-id для цільового виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне вікно контексту для виявлених моделей.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для виявлених моделей.

### Приклади провайдерів

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Використовуйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` — для прямого Z.AI.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або `opencode-go/...` для каталогу Go. Скорочений варіант: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Установіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` — допустимі alias. Скорочений варіант: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint для кодування (типовий): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint визначте користувацького провайдера з перевизначенням base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Для endpoint у Китаї: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

Рідні endpoint Moonshot оголошують сумісність використання потокової передачі на спільному
транспорті `openai-completions`, і OpenClaw визначає це за можливостями endpoint,
а не лише за id вбудованого провайдера.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Сумісний з Anthropic, вбудований провайдер. Скорочений варіант: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (сумісний з Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL має не містити `/v1` (клієнт Anthropic додає його). Скорочений варіант: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Установіть `MINIMAX_API_KEY`. Скорочені варіанти:
`openclaw onboard --auth-choice minimax-global-api` або
`openclaw onboard --auth-choice minimax-cn-api`.
Каталог моделей типово містить лише M2.7.
На Anthropic-сумісному шляху потокової передачі OpenClaw типово вимикає thinking MiniMax,
якщо ви явно не задасте `thinking` самостійно. `/fast on` або
`params.fastMode: true` переписує `MiniMax-M2.7` на
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Локальні моделі (LM Studio)">

Див. [Local Models](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному обладнанні; зберігайте hosted-моделі об’єднаними для fallback.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: необов’язковий allowlist лише для bundled Skills (керовані/workspace Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: коли `true`, надає перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед переходом до інших типів інсталяторів.
- `install.nodeManager`: бажаний менеджер node для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/встановлений.
- `entries.<skillKey>.apiKey`: зручне поле для Skills, які оголошують основну env-змінну (рядок у відкритому вигляді або об’єкт SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також `plugins.load.paths`.
- Виявлення приймає нативні Plugins OpenClaw, а також сумісні bundled Codex і Claude, включно з bundle Claude стандартної структури без manifest.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені Plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API key на рівні Plugin (коли Plugin це підтримує).
- `plugins.entries.<id>.env`: мапа env-змінних у межах Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` і ігнорує поля legacy `before_agent_start`, що змінюють prompt, зберігаючи legacy `modelOverride` і `providerOverride`. Застосовується до нативних hooks Plugin і підтримуваних каталогів hooks, наданих bundle.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому Plugin запитувати перевизначення `provider` і `model` для окремих запусків фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"`, лише якщо навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (валідується схемою нативного Plugin OpenClaw, коли вона доступна).
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (приймає SecretRef). Резервно береться з `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут scrape-запиту в секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування X Search від xAI (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування dreaming для memory. Фази й пороги див. у [Dreaming](/uk/concepts/dreaming).
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: cadence Cron для кожного повного циклу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги — це деталі реалізації (не користувацькі ключі конфігурації).
- Повна конфігурація memory наведена в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені bundle Plugins Claude також можуть додавати типові значення вбудованого Pi з `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як сирі patch конфігурації OpenClaw.
- `plugins.slots.memory`: вибір id активного Plugin memory або `"none"` для вимкнення Plugins memory.
- `plugins.slots.contextEngine`: вибір id активного Plugin механізму контексту; типово `"legacy"`, якщо ви не встановите й не виберете інший механізм.
- `plugins.installs`: керовані CLI метадані встановлення, які використовуються `openclaw plugins update`.
  - Містять `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Ставтеся до `plugins.installs.*` як до керованого стану; віддавайте перевагу командам CLI, а не ручному редагуванню.

Див. [Plugins](/uk/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` вимикає `act:evaluate` і `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому навігація browser типово залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте навігації browser у приватній мережі.
- У суворому режимі endpoint віддалених профілів CDP (`profiles.*.cdpUrl`) під час перевірок досяжності/виявлення підлягають такому самому блокуванню приватної мережі.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як legacy alias.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі attach-only (start/stop/reset вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає прямий URL DevTools WebSocket.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися
  до вибраного хоста або через підключений browser Node.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлюватися на конкретний
  профіль browser на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-селектори, hooks завантаження
  одного файлу, відсутність перевизначень тайм-ауту діалогів, відсутність `wait --load networkidle`, а також
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Порядок автовиявлення: browser за замовчуванням, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Сервіс керування: лише loopback (порт виводиться з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розмір вікна або прапорці налагодження).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: акцентний колір для chrome нативного UI застосунку (тон бульбашки Talk Mode тощо).
- `assistant`: перевизначення identity Control UI. Резервно використовується identity активного агента.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Докладно про поля Gateway">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо значення не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі alias для bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не alias хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає на `127.0.0.1` усередині контейнера. За bridge-мережі Docker (`-p 18789:18789`) трафік надходить на `eth0`, тож gateway недоступний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: типово обов’язкова. Прив’язки не до loopback потребують автентифікації gateway. На практиці це означає спільний token/password або reverse proxy з awareness identity з `gateway.auth.mode: "trusted-proxy"`. Майстер онбордингу типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), явно встановіть `gateway.auth.mode` у `token` або `password`. Запуск, а також потоки встановлення/відновлення сервісу завершуються помилкою, якщо налаштовано обидва, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних конфігурацій loopback; цей варіант навмисно не пропонується в підказках онбордингу.
- `gateway.auth.mode: "trusted-proxy"`: делегувати auth reverse proxy з awareness identity і довіряти заголовкам identity від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy loopback на тому самому хості не задовольняє trusted-proxy auth.
- `gateway.auth.allowTailscale`: коли `true`, заголовки identity Tailscale Serve можуть задовольняти auth для Control UI/WebSocket (перевіряється через `tailscale whois`). Endpoint HTTP API **не** використовують цю auth через заголовки Tailscale; вони дотримуються звичайного HTTP auth mode gateway. Цей безтокеновий потік передбачає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий лімітатор невдалих спроб auth. Застосовується для кожного IP клієнта та для кожної області auth (shared-secret і device-token відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом невдачі. Тому одночасні погані спроби від того самого клієнта можуть спрацювати на лімітер уже на другому запиті, замість того щоб обидві просто пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; установіть `false`, коли навмисно хочете, щоб трафік localhost теж підлягав rate limiting (для тестових конфігурацій або суворих розгортань через proxy).
- Спроби WS auth із browser-origin завжди обмежуються без винятку для loopback (додатковий захист від браузерного brute force на localhost).
- На loopback ці блокування для browser-origin ізольовані за нормалізованим значенням `Origin`,
  тому повторні збої з одного localhost origin не блокують автоматично
  інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind до loopback) або `funnel` (публічно, потребує auth).
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень Gateway WebSocket. Обов’язковий, коли очікуються клієнти browser не з loopback-origin.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне визначення origin через заголовок Host для розгортань, що навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: клієнтське аварійне перевизначення, яке дозволяє plaintext `ws://` до довірених IP приватної мережі; типово plaintext і далі дозволено лише для loopback.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL зовнішнього relay APNs, який використовують офіційні/TestFlight-збірки iOS після публікації relay-backed реєстрацій у gateway. Цей URL має збігатися з URL relay, зібраним в iOS-build.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від gateway до relay у мілісекундах. Типове значення: `10000`.
- Реєстрації на основі relay делегуються конкретній identity gateway. Зв’язаний застосунок iOS викликає `gateway.identity.get`, включає цю identity в реєстрацію relay і пересилає gateway дозвіл на надсилання в межах цієї реєстрації. Інший gateway не може повторно використати таку збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення через env для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний шлях лише для розробки для loopback HTTP URL relay. У production URL relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал монітору справності channel у хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типове значення: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типове значення: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor для одного channel/account за ковзну годину. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out на рівні channel для перезапусків health-monitor при збереженні глобального монітора ввімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення на рівні облікового запису для channels із багатьма обліковими записами. Якщо задано, воно має пріоритет над перевизначенням на рівні channel.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef, але не визначено, визначення завершується в закритому режимі (без маскування через резервний remote).
- `trustedProxies`: IP reverse proxy, які завершують TLS або вставляють переслані заголовки клієнта. Вказуйте лише proxy, які ви контролюєте. Записи loopback усе ще валідні для конфігурацій same-host proxy/локального виявлення (наприклад Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типове значення `false` для поведінки fail-closed.
- `gateway.tools.deny`: додаткові назви інструментів, заблокованих для HTTP `POST /tools/invoke` (розширює типовий список заборон).
- `gateway.tools.allow`: прибирає назви інструментів із типового списку заборон для HTTP.

</Accordion>

### Endpoint OpenAI-compatible

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення безпеки для URL-входу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    та/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення безпеки відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (установлюйте лише для HTTPS-origin, які ви контролюєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція між кількома інстансами

Запускайте кілька gateway на одному хості з унікальними портами та каталогами стану:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапорці: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

Див. [Multiple Gateways](/uk/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: вмикає завершення TLS на слухачі gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовано; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файла TLS certificate.
- `keyPath`: шлях файлової системи до файла приватного ключа TLS; обмежте права доступу.
- `caPath`: необов’язковий шлях до bundle CA для перевірки клієнта або власних ланцюгів довіри.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: керує тим, як зміни конфігурації застосовуються під час runtime.
  - `"off"`: ігнорувати live-зміни; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway після зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку пробувати hot reload; якщо потрібно — переходити до перезапуску.
- `debounceMs`: вікно debounce у ms перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час у ms очікування завершення операцій у польоті перед примусовим перезапуском (типово: `300000` = 5 хвилин).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` або `x-openclaw-token: <token>`.
Токени hook у query string відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежуйте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонізований `sessionKey`, установіть `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не потребують цього opt-in.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з payload запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → визначається через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані шаблоном, розглядаються як зовнішньо надані й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Докладно про mapping">

- `match.path` відповідає підшляху після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` відповідає полю payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на модуль JS/TS, що повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID резервно переходять до агента за замовчуванням.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і `sessionKey`, керованим шаблоном у mapping, задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Стає обов’язковим, коли будь-який mapping або preset використовує шаблонізований `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у channel; `channel` типово має значення `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволено, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію для кожного повідомлення, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes`, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість типового шаблонізованого значення.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо це налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
- Не запускайте окремий `gog gmail watch serve` паралельно з Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Обслуговує HTML/CSS/JS і A2UI, які агент може редагувати, через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Для bind не до loopback: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), так само як інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після pairing і підключення Node Gateway рекламує URL можливостей на рівні Node для доступу до canvas/A2UI.
- URL можливостей прив’язані до активної WS-сесії Node і швидко спливають. Резервне визначення за IP не використовується.
- Вбудовує клієнт live reload у HTML, що обслуговується.
- Автоматично створює стартовий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимикайте live reload для великих каталогів або при помилках `EMFILE`.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (типово): не включає `cliPath` + `sshPort` у TXT-записи.
- `full`: включає `cliPath` + `sshPort`.
- Ім’я хоста типово `openclaw`. Перевизначайте через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте це з DNS-сервером (рекомендовано CoreDNS) + split DNS у Tailscale.

Налаштування: `openclaw dns setup --apply`.

---

## Environment

### `env` (вбудовані env vars)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Вбудовані env vars застосовуються лише тоді, коли в env процесу відсутній ключ.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден із них не перевизначає наявні vars).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашого login shell.
- Повний порядок пріоритетів див. у [Environment](/uk/help/environment).

### Підстановка env vars

Посилайтеся на env vars у будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні vars спричиняють помилку під час завантаження конфігурації.
- Екрануйте через `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Secrets

Посилання на secret є додатковими: значення у відкритому вигляді й далі працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id для `source: "exec"` не повинні містити сегментів шляху `.` або `..`, розділених `/` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання в `auth-profiles.json` включені до покриття визначення runtime та аудиту.

### Конфігурація провайдерів secret

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Примітки:

- Провайдер `file` підтримує `mode: "json"` і `mode: "singleValue"` (у режимі singleValue значення `id` має бути `"value"`).
- Шляхи провайдерів file і exec завершуються в закритому режимі, якщо перевірка ACL Windows недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` вимагає абсолютного шляху `command` і використовує payload-и протоколу через stdin/stdout.
- Типово шляхи команд через symlink відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи symlink із перевіркою шляху визначеної цілі.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до шляху визначеної цілі.
- Дочірнє середовище `exec` типово мінімальне; явно передавайте потрібні змінні через `passEnv`.
- Посилання на secret визначаються під час активації у знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активної поверхні: невизначені посилання на ввімкнених поверхнях призводять до помилки запуску/перезавантаження, тоді як неактивні поверхні пропускаються з діагностикою.

---

## Сховище auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Профілі для окремого агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для режимів статичних облікових даних.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні облікові дані runtime надходять із визначених знімків у пам’яті; застарілі статичні записи `auth.json` очищаються при виявленні.
- Застарілий імпорт OAuth виконується з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка runtime для secrets і інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: базовий backoff у годинах, коли профіль зазнає збою через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг
  усе одно може потрапити сюди навіть у відповідях `401`/`403`, але
  зіставлення тексту, специфічні для провайдера, і далі обмежуються провайдером,
  якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Повторювані HTTP `402` повідомлення про usage-window або
  ліміти витрат organization/workspace натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин backoff для білінгу на рівні провайдера.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високовпевнених збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile в межах того самого провайдера для помилок перевантаження перед переходом до fallback моделі (типово: `1`). Сюди потрапляють форми зайнятості провайдера, такі як `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile в межах того самого провайдера для помилок rate-limit перед переходом до fallback моделі (типово: `1`). До цього кошика rate-limit входять тексти провайдерів на кшталт `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Типовий файл журналу: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Установіть `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug`, коли використовується `--verbose`.
- `maxFileBytes`: максимальний розмір файла журналу в байтах, після якого запис припиняється (додатне ціле число; типово: `524288000` = 500 MB). Для production-розгортань використовуйте зовнішню ротацію журналів.

---

## Діагностика

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: головний перемикач для виводу інструментування (типово: `true`).
- `flags`: масив рядків-прапорців, що вмикають цільовий вивід журналів (підтримує wildcard, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: віковий поріг у ms для виведення попереджень про завислі сесії, поки сесія залишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються із запитами експорту OTel.
- `otel.serviceName`: ім’я сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнення експорту trace, metrics або logs.
- `otel.sampleRate`: частота вибірки trace `0`–`1`.
- `otel.flushIntervalMs`: періодичний інтервал скидання telemetry у ms.
- `cacheTrace.enabled`: журналювати знімки trace кешу для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: вихідний шлях для cache trace JSONL (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід cache trace (усі типово: `true`).

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: канал релізів для встановлень npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для встановлень пакетів (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед авто-застосуванням для stable-каналу (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (типово: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу, у годинах (типово: `1`; максимум: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: глобальний feature gate для ACP (типово: `false`).
- `dispatch.enabled`: незалежний gate для dispatch ходу сесії ACP (типово: `true`). Установіть `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: id типового runtime backend ACP (має відповідати зареєстрованому Plugin runtime ACP).
- `defaultAgent`: резервний id цільового агента ACP, коли spawn не задає явної цілі.
- `allowedAgents`: allowlist id агентів, дозволених для runtime-сесій ACP; порожнє значення означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle flush у ms для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір блоку перед поділом проєкції потокового блоку.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів для кожного ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, проєктованих за один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв тегів у відповідність із булевими перевизначеннями видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для workers сесії ACP до моменту, коли їх можна очищати.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід виконати під час bootstrap середовища runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` керує стилем слогана banner:
  - `"random"` (типово): змінні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/version banner усе одно показуються).
- Щоб приховати весь banner (а не лише слогани), установіть env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Метадані, які записуються керованими потоками налаштування CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

Див. поля identity в `agents.list` у розділі [Значення агентів за замовчуванням](#agent-defaults).

---

## Bridge (legacy, removed)

Поточні збірки більше не містять TCP bridge. Node підключаються через Gateway WebSocket. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація завершується помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Конфігурація legacy bridge (історична довідка)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: як довго зберігати завершені сесії ізольованих запусків Cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених transcript Cron. Типове значення: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу на запуск (`cron/runs/<jobId>.jsonl`) перед очищенням. Типове значення: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, що зберігаються, коли спрацьовує очищення журналу запуску. Типове значення: `2000`.
- `webhookToken`: bearer token, який використовується для доставки webhook POST у Cron (`delivery.mode = "webhook"`); якщо не вказано, заголовок auth не надсилається.
- `webhook`: застарілий legacy fallback URL webhook (http/https), який використовується лише для збережених завдань, у яких ще є `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань при тимчасових помилках (типово: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у ms для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, які запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Не вказуйте, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових завдань Cron. Для повторюваних завдань використовується окрема обробка збоїв.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: увімкнути сповіщення про збої для завдань Cron (типово: `false`).
- `after`: кількість послідовних збоїв до надсилання сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення channel; `"webhook"` надсилає на налаштований webhook.
- `accountId`: необов’язковий id облікового запису або channel для обмеження доставки сповіщення.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Типова ціль для сповіщень про збої Cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних про ціль.
- `channel`: перевизначення channel для доставки announce. `"last"` повторно використовує останній відомий channel доставки.
- `to`: явна ціль announce або URL webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` на рівні завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальної, ні на рівні завдання failure destination, завдання, які вже доставляють через `announce`, у разі збою резервно використовують цю основну announce-ціль.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі Media

Заповнювачі шаблону, що розгортаються в `tools.media.models[].args`:

| Змінна            | Опис                                              |
| ----------------- | ------------------------------------------------- |
| `{{Body}}`        | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`     | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}`| Тіло без згадок групи                             |
| `{{From}}`        | Ідентифікатор відправника                         |
| `{{To}}`          | Ідентифікатор призначення                         |
| `{{MessageSid}}`  | id повідомлення channel                           |
| `{{SessionId}}`   | UUID поточної сесії                               |
| `{{IsNewSession}}`| `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`    | Псевдо-URL вхідного media                         |
| `{{MediaPath}}`   | Локальний шлях до media                           |
| `{{MediaType}}`   | Тип media (image/audio/document/…)                |
| `{{Transcript}}`  | transcript аудіо                                  |
| `{{Prompt}}`      | Визначений media prompt для записів CLI           |
| `{{MaxChars}}`    | Визначена максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`    | `"direct"` або `"group"`                          |
| `{{GroupSubject}}`| Тема групи (best effort)                          |
| `{{GroupMembers}}`| Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`  | Ім’я відображення відправника (best effort)       |
| `{{SenderE164}}`  | Номер телефону відправника (best effort)          |
| `{{Provider}}`    | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Включення конфігурації (`$include`)

Розділяйте конфігурацію на кілька файлів:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Поведінка злиття:**

- Один файл: замінює об’єкт, що його містить.
- Масив файлів: глибоко зливається в заданому порядку (пізніші перевизначають ранніші).
- Сусідні ключі: зливаються після включень (перевизначають включені значення).
- Вкладені включення: до 10 рівнів глибини.
- Шляхи: визначаються відносно файла, який виконує включення, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли після визначення вони все одно залишаються в межах цієї межі.
- Записи, що належать OpenClaw і змінюють лише одну секцію верхнього рівня, забезпечену включенням одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі включення, масиви включень і включення з перевизначеннями сусідніх ключів є лише для читання для записів, що належать OpenClaw; такі записи завершуються в закритому режимі замість сплющення конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних включень.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_
