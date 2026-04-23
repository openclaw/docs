---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації channel, model, gateway або tool
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник конфігурації
x-i18n:
    generated_at: "2026-04-23T20:52:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76596321b0508dd2953bc066fed85f8ffd5121d926fd66b6add0e4dfea98ab28
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Основний довідник конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Configuration](/uk/gateway/configuration).

Ця сторінка охоплює основні поверхні конфігурації OpenClaw і дає посилання назовні, коли підсистема має власний глибший довідник. Вона **не** намагається вбудувати на одній сторінці кожен каталог команд, яким володіє channel/Plugin, або кожен глибокий параметр memory/QMD.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, із metadata bundled/Plugin/channel, об’єднаною за наявності
- `config.schema.lookup` повертає один вузол схеми з обмеженням за шляхом для інструментів drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють baseline hash документів конфігурації відносно поточної поверхні схеми

Окремі поглиблені довідники:

- [Memory configuration reference](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/uk/tools/slash-commands) для поточного каталогу вбудованих + bundled команд
- сторінки відповідних channel/Plugin для поверхонь команд, специфічних для каналу

Формат config — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — якщо їх пропустити, OpenClaw використовує безпечні значення за замовчуванням.

---

## Channels

Кожен channel запускається автоматично, коли існує його розділ конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі channels підтримують DM policy і group policy:

| DM policy           | Поведінка                                                      |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код pairing; власник має схвалити |
| `allowlist`         | Лише відправники з `allowFrom` (або схваленого paired store)   |
| `open`              | Дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)          |
| `disabled`          | Ігнорувати всі вхідні DM                                       |

| Group policy          | Поведінка                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (типово)  | Лише групи, що відповідають налаштованому allowlist   |
| `open`                | Обходить group allowlist-и (gating згадок усе ще застосовується) |
| `disabled`            | Блокує всі повідомлення груп/кімнат                   |

<Note>
`channels.defaults.groupPolicy` задає значення за замовчуванням, коли `groupPolicy` provider-а не задано.
Коди pairing спливають через 1 годину. Кількість очікуваних запитів на DM pairing обмежена **3 на канал**.
Якщо блок provider-а відсутній повністю (`channels.<provider>` відсутній), runtime для group policy повертається до `allowlist` (fail-closed) з попередженням під час запуску.
</Note>

### Перевизначення моделі для channel

Використовуйте `channels.modelByChannel`, щоб закріпити конкретні ID channel за моделлю. Значення приймають `provider/model` або налаштовані aliases моделей. Це зіставлення channel застосовується, коли сесія ще не має перевизначення моделі (наприклад, заданого через `/model`).

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

### Типові параметри channel і heartbeat

Використовуйте `channels.defaults` для спільної поведінки group-policy і heartbeat у різних provider-ів:

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

- `channels.defaults.groupPolicy`: fallback group policy, коли `groupPolicy` на рівні provider-а не задано.
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх channels. Значення: `all` (типово, включати весь контекст цитат/thread/history), `allowlist` (включати контекст лише від allowlisted-відправників), `allowlist_quote` (як allowlist, але зберігати явний контекст quote/reply). Перевизначення для конкретного каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати healthy-статуси channel у вивід heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати degraded/error-статуси channel у вивід heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід heartbeat у стилі indicator.

### WhatsApp

WhatsApp працює через web channel gateway (`Baileys Web`). Він запускається автоматично, коли існує прив’язана сесія.

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

- Вихідні команди за замовчуванням використовують обліковий запис `default`, якщо він є; інакше — перший налаштований ID облікового запису (відсортований).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей fallback-вибір типового облікового запису, коли він збігається з налаштованим ID облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису мігрується `openclaw doctor` до `whatsapp/default`.
- Перевизначення для конкретного облікового запису: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Token бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; symlink-и відхиляються), з `TELEGRAM_BOT_TOKEN` як fallback для облікового запису за замовчуванням.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає типовий вибір облікового запису, коли він збігається з налаштованим ID облікового запису.
- У конфігураціях з кількома обліковими записами (2+ ID облікових записів) задайте явне значення за замовчуванням (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути fallback-маршрутизації; `openclaw doctor` попереджає, якщо цього немає або значення некоректне.
- `configWrites: false` блокує ініційовані через Telegram записи до config (міграції ID supergroup, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив’язки для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Попередній перегляд потоків Telegram використовує `sendMessage` + `editMessageText` (працює в особистих і групових чатах).
- Retry policy: див. [Retry policy](/uk/concepts/retry).

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

- Token: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як fallback для облікового запису за замовчуванням.
- Прямі вихідні виклики, які передають явний Discord `token`, використовують цей token для виклику; налаштування retry/policy облікового запису все одно беруться з вибраного облікового запису в активному snapshot runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.
- Для цілей доставки використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild); прості числові ID відхиляються.
- Slug-и guild мають нижній регістр, а пробіли замінюються на `-`; ключі channel використовують slug-ім’я (без `#`). Перевагу слід надавати ID guild.
- Повідомлення, створені ботом, за замовчуванням ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно відфільтровуються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення для channel) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `maxLinesPerMessage` (за замовчуванням 17) розбиває довгі повідомлення навіть тоді, коли вони менші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до thread:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття focus через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: опційний перемикач для автоматичного створення/прив’язки thread через `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив’язки для channel і thread (використовуйте id channel/thread у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає accent color для контейнерів Discord components v2.
- `channels.discord.voice` вмикає розмови у voice channel Discord і необов’язкові перевизначення auto-join + TTS.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` напряму передаються в параметри DAVE `@discordjs/voice` (`true` і `24` за замовчуванням).
- OpenClaw також намагається відновити прийом voice, виходячи й повторно приєднуючись до voice session після повторних помилок дешифрування.
- `channels.discord.streaming` — це канонічний ключ режиму stream. Застарілі `streamMode` і булеві значення `streaming` мігруються автоматично.
- `channels.discord.autoPresence` зіставляє доступність runtime зі статусом присутності бота (healthy => online, degraded => idle, exhausted => dnd) і дає змогу необов’язково перевизначати текст статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінним ім’ям/tag (режим сумісності break-glass).
- `channels.discord.execApprovals`: нативна для Discord доставка підтверджень exec і авторизація тих, хто може схвалювати.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). У режимі auto підтвердження exec активуються, коли тих, хто схвалює, можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати запити exec. Якщо не задано, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Якщо не вказано, підтвердження пересилаються для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (за замовчуванням) надсилає в DM тим, хто схвалює, `"channel"` надсилає у вихідний channel, `"both"` надсилає в обидва місця. Коли target включає `"channel"`, кнопки можуть використовувати лише ті, кого вдалося визначити як approvers.
  - `cleanupAfterResolve`: коли `true`, видаляє DM із запитами на схвалення після схвалення, відхилення або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, за замовчуванням), `all` (усі повідомлення), `allowlist` (із `guilds.<id>.users` для всіх повідомлень).

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

- JSON service account: вбудований (`serviceAccount`) або через файл (`serviceAccountFile`).
- Також підтримується SecretRef service account (`serviceAccountRef`).
- Fallback-и env: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Для цілей доставки використовуйте `spaces/<spaceId>` або `users/<userId>`.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінним email principal (режим сумісності break-glass).

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

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як env fallback для облікового запису за замовчуванням).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (на кореневому рівні або для конкретного облікового запису).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають plaintext-рядки
  або об’єкти SecretRef.
- Snapshot-и облікових записів Slack показують поля джерела/стану для кожного облікового даного, наприклад
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у HTTP mode,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/runtime не зміг
  розв’язати значення секрету.
- `configWrites: false` блокує ініційовані через Slack записи до config.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.
- `channels.slack.streaming.mode` — це канонічний ключ режиму stream для Slack. `channels.slack.streaming.nativeTransport` керує нативним transport stream у Slack. Застарілі значення `streamMode`, булеві `streaming` і `nativeStreaming` мігруються автоматично.
- Для цілей доставки використовуйте `user:<id>` (DM) або `channel:<id>`.

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сесій thread:** `thread.historyScope` — окремо для кожного thread (за замовчуванням) або спільно для всього channel. `thread.inheritParent` копіює transcript батьківського channel у нові thread.

- Нативний streaming Slack плюс статус thread у стилі Slack assistant "is typing..." вимагають ціль reply thread. DM верхнього рівня за замовчуванням залишаються поза thread, тому використовують `typingReaction` або звичайну доставку замість preview у стилі thread.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а після завершення видаляє її. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка підтверджень exec і авторизація тих, хто може схвалювати. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій   | За замовчуванням | Примітки                 |
| ----------- | ---------------- | ------------------------ |
| reactions   | enabled          | Реакції + перелік реакцій |
| messages    | enabled          | Читання/надсилання/редагування/видалення |
| pins        | enabled          | Закріплення/відкріплення/перелік |
| memberInfo  | enabled          | Інформація про учасника  |
| emojiList   | enabled          | Список кастомних emoji   |

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

Режими чату: `oncall` (відповідати на @-згадку, за замовчуванням), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з trigger prefix).

Коли увімкнено native-команди Mattermost:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повним URL.
- `commands.callbackUrl` має вказувати на endpoint gateway OpenClaw і бути досяжним із сервера Mattermost.
- Native slash callback-и автентифікуються токенами для кожної команди, які повертає
  Mattermost під час реєстрації slash command. Якщо реєстрація не вдається або
  жодна команда не активується, OpenClaw відхиляє callback-и з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/internal хостів callback Mattermost може вимагати, щоб
  `ServiceSettings.AllowedUntrustedInternalConnections` включав хост/домен callback.
  Використовуйте значення хоста/домену, а не повні URL.
- `channels.mattermost.configWrites`: дозволити або заборонити ініційовані через Mattermost записи до config.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в channels.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення gating згадок для окремого channel (`"*"` для значення за замовчуванням).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.

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

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (з `reactionAllowlist`).

- `channels.signal.account`: прив’язати запуск channel до конкретної ідентичності облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити записи до config, ініційовані через Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (на основі Plugin-а, налаштовується через `channels.bluebubbles`).

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

- Основні шляхи ключів, які охоплено тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних ACP-сесій. Використовуйте рядок handle або target BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повну конфігурацію каналу BlueBubbles задокументовано в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Daemon або порт не потрібні.

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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.

- Потрібен Full Disk Access до БД Messages.
- Віддавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб вивести список чатів.
- `cliPath` може вказувати на SSH wrapper; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (за замовчуванням: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ relay host уже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи до config, ініційовані через iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних ACP-сесій. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH wrapper для iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix працює через Plugin і налаштовується в `channels.matrix`.

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

- Автентифікація token використовує `accessToken`; автентифікація паролем використовує `userId` + `password`.
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S) proxy. Іменовані облікові записи можуть перевизначати це через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/internal homeserver-и. `proxy` і цей network opt-in — це незалежні засоби керування.
- `channels.matrix.defaultAccount` вибирає пріоритетний обліковий запис у конфігураціях із кількома обліковими записами.
- `channels.matrix.autoJoin` за замовчуванням має значення `off`, тому запрошені room і нові запрошення в стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` разом з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка підтверджень exec і авторизація тих, хто може схвалювати.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). У режимі auto підтвердження exec активуються, коли approvers можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати запити exec.
  - `agentFilter`: необов’язковий allowlist ID агентів. Якщо не вказано, підтвердження пересилаються для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (за замовчуванням), `"channel"` (вихідна room) або `"both"`.
  - Перевизначення для конкретного облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (за замовчуванням) об’єднує за routed peer, тоді як `per-room` ізолює кожну DM room.
- Status probe-и Matrix і live directory lookups використовують ту саму policy proxy, що й runtime-трафік.
- Повну конфігурацію Matrix, правила націлювання та приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams працює через Plugin і налаштовується в `channels.msteams`.

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

- Основні шляхи ключів, які охоплено тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, webhook, DM/group policy, перевизначення для конкретної team/channel) задокументовано в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC працює через Plugin і налаштовується в `channels.irc`.

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

- Основні шляхи ключів, які охоплено тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlist-и/gating згадок) задокументовано в [IRC](/uk/channels/irc).

### Багатообліковість (усі channels)

Запуск кількох облікових записів для одного channel (кожен зі своїм `accountId`):

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
- Env token-и застосовуються лише до облікового запису **за замовчуванням**.
- Базові налаштування channel застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте неосновний обліковий запис через `openclaw channels add` (або onboarding channel), поки все ще використовуєте top-level конфігурацію channel для одного облікового запису, OpenClaw спочатку переносить значення top-level single-account, обмежені обліковим записом, у карту облікових записів channel, щоб початковий обліковий запис продовжив працювати. Більшість channels переносять їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default-ціль.
- Наявні прив’язки лише на рівні channel (без `accountId`) і далі зіставляються з обліковим записом за замовчуванням; прив’язки в межах облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи top-level single-account значення, обмежені обліковим записом, у promoted-обліковий запис, вибраний для цього channel. Більшість channels використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default-ціль.

### Інші Plugin channels

Багато Plugin channels налаштовуються як `channels.<id>` і задокументовані на окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Див. повний індекс каналів: [Channels](/uk/channels).

### Gating згадок у групових чатах

Для групових повідомлень за замовчуванням **потрібна згадка** (метадані згадки або безпечні regex-шаблони). Це застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

**Типи згадок:**

- **Metadata mentions**: нативні @-згадки платформи. Ігноруються в режимі self-chat WhatsApp.
- **Text patterns**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Некоректні шаблони та небезпечні вкладені повторення ігноруються.
- Gating згадок застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Channels можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Задайте `0`, щоб вимкнути.

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

Розв’язання: перевизначення для конкретного DM → значення provider-а за замовчуванням → без обмеження (зберігається все).

Підтримується для: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте власний номер до `allowFrom`, щоб увімкнути режим self-chat (ігнорує нативні @-згадки, відповідає лише на text pattern-и):

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

### Commands (обробка команд у чаті)

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

<Accordion title="Подробиці commands">

- Цей блок налаштовує поверхні команд. Поточний каталог вбудованих + bundled команд див. у [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка — **довідник ключів конфігурації**, а не повний каталог команд. Команди, якими володіють channel/Plugin, такі як QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовані на сторінках відповідних channel/Plugin плюс у [Slash Commands](/uk/tools/slash-commands).
- Text-команди мають бути **окремими** повідомленнями, що починаються з `/`.
- `native: "auto"` вмикає native-команди для Discord/Telegram, але залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає native-команди Skills для Discord/Telegram, але залишає Slack вимкненим.
- Перевизначення для конкретного каналу: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначуйте реєстрацію native-команд Skills для конкретного каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові пункти меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для shell хоста. Потребує `tools.elevated.enabled` і наявності відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; режим лише читання `/config show` залишається доступним для звичайних клієнтів operator зі scope на запис.
- `mcp: true` вмикає `/mcp` для конфігурації MCP server, якою керує OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin-ів, встановлення та керування увімкненням/вимкненням.
- `channels.<provider>.configWrites` контролює мутації config для кожного каналу (за замовчуванням: true).
- Для багатооблікових каналів `channels.<provider>.accounts.<id>.configWrites` також контролює записи, спрямовані на цей обліковий запис (наприклад `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії tool перезапуску gateway. За замовчуванням: `true`.
- `ownerAllowFrom` — це явний allowlist власника для команд/tool-ів лише для власника. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ID власника в system prompt. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` — для кожного provider-а окремо. Якщо його задано, це **єдине** джерело авторизації (allowlist-и/pairing каналу й `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити policy груп доступу, коли `allowFrom` не задано.
- Карта документації команд:
  - вбудований + bundled каталог: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд, специфічні для channel: [Channels](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди pairing: [Pairing](/uk/channels/pairing)
  - команда LINE card: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Типові параметри агента

### `agents.defaults.workspace`

За замовчуванням: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime system prompt. Якщо не задано, OpenClaw автоматично визначає його, піднімаючись вгору від workspace.

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

- Пропустіть `agents.defaults.skills`, щоб за замовчуванням не обмежувати Skills.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Задайте `agents.list[].skills: []`, щоб не було жодних Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли workspace ін’єктуються в system prompt. За замовчуванням: `"always"`.

- `"continuation-skip"`: у безпечних continuation-turn після завершеної відповіді assistant повторна ін’єкція bootstrap workspace пропускається, що зменшує розмір prompt. Запуски heartbeat і повторні спроби після Compaction все одно перебудовують контекст.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів для одного bootstrap-файла workspace до обрізання. За замовчуванням: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, ін’єктованих через усі bootstrap-файли workspace. За замовчуванням: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
За замовчуванням: `"once"`.

- `"off"`: ніколи не ін’єктувати текст попередження в system prompt.
- `"once"`: ін’єктувати попередження один раз для кожного унікального сигнатурного випадку обрізання (рекомендовано).
- `"always"`: ін’єктувати попередження під час кожного запуску, коли існує обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Карта володіння budget контексту

OpenClaw має кілька великих budget prompt/контексту, і вони
навмисно розділені між підсистемами, замість того щоб усе проходило через один загальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайна ін’єкція bootstrap workspace.
- `agents.defaults.startupContext.*`:
  одноразовий startup prelude для `/new` і `/reset`, зокрема недавні щоденні
  файли `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, ін’єктований у system prompt.
- `agents.defaults.contextLimits.*`:
  обмежені runtime-уривки та ін’єктовані блоки, якими володіє runtime.
- `memory.qmd.limits.*`:
  розмір indexed memory-search snippet та ін’єкції.

Використовуйте відповідне перевизначення для конкретного агента лише тоді, коли одному агенту потрібен інший
budget:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує startup prelude першого turn, який ін’єктується під час порожніх запусків `/new` і `/reset`.

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

Спільні значення за замовчуванням для обмежених поверхонь runtime-контексту.

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

- `memoryGetMaxChars`: типове обмеження уривка `memory_get` до додавання metadata обрізання та continuation notice.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines` не
  вказано.
- `toolResultMaxChars`: активне обмеження результату tool, що використовується для збережених результатів і відновлення після переповнення.
- `postCompactionMaxChars`: обмеження уривка AGENTS.md, що використовується під час ін’єкції оновлення після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для конкретного агента для спільних параметрів `contextLimits`. Пропущені поля успадковуються
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

Глобальне обмеження для компактного списку Skills, який ін’єктується в system prompt. Це
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

Перевизначення budget prompt Skills для конкретного агента.

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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках transcript/tool image перед викликами provider-а.
За замовчуванням: `1200`.

Нижчі значення зазвичай зменшують використання vision-token і розмір payload запиту для запусків із великою кількістю скриншотів.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту system prompt (не для часових позначок повідомлень). Якщо не задано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в system prompt. За замовчуванням: `auto` (налаштування ОС).

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
  - Форма рядка задає лише primary model.
  - Форма об’єкта задає primary плюс впорядковані failover-моделі.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом tool `image` як конфігурація vision model.
  - Також використовується як fallback-маршрутизація, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною capability генерації зображень і будь-якою майбутньою поверхнею tool/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-2` для OpenAI Images.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну auth/API key для цього provider-а (наприклад `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` для `openai/*`, `FAL_KEY` для `fal/*`).
  - Якщо це поле не задано, `image_generate` усе одно може вивести типове значення provider-а на основі auth. Спочатку він пробує поточний типовий provider, а потім решту зареєстрованих provider-ів генерації зображень у порядку ID provider-а.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною capability генерації музики та вбудованим tool `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо це поле не задано, `music_generate` усе одно може вивести типове значення provider-а на основі auth. Спочатку він пробує поточний типовий provider, а потім решту зареєстрованих provider-ів генерації музики в порядку ID provider-а.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну auth/API key для цього provider-а.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною capability генерації відео та вбудованим tool `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо це поле не задано, `video_generate` усе одно може вивести типове значення provider-а на основі auth. Спочатку він пробує поточний типовий provider, а потім решту зареєстрованих provider-ів генерації відео в порядку ID provider-а.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну auth/API key для цього provider-а.
  - Bundled provider генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість до 10 секунд і параметри рівня provider-а `size`, `aspectRatio`, `resolution`, `audio` та `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується tool-ом `pdf` для маршрутизації моделі.
  - Якщо не задано, PDF tool повертається до `imageModel`, а потім до визначеної моделі сесії/типової моделі.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для tool `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, що враховуються в режимі fallback-витягування tool-а `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. За замовчуванням: `"off"`.
- `elevatedDefault`: типовий рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. За замовчуванням: `"on"`.
- `model.primary`: формат `provider/model` (наприклад `openai/gpt-5.5`). Якщо ви пропускаєте provider, OpenClaw спочатку пробує alias, потім унікальний збіг exact model id серед налаштованих provider-ів і лише потім повертається до налаштованого provider-а за замовчуванням (це застаріла поведінка сумісності, тож краще явно вказувати `provider/model`). Якщо цей provider більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого provider/model замість того, щоб показувати застаріле типове значення від видаленого provider-а.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для provider-а, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
  - Безпечне редагування: використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи. `config set` відмовляється від замін, які видалили б наявні записи allowlist, якщо ви не передасте `--replace`.
  - Потоки configure/onboarding у межах конкретного provider-а об’єднують вибрані моделі цього provider-а в цю мапу й зберігають інші, уже налаштовані provider-и.
- `params`: глобальні типові параметри provider-а, що застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад `{ cacheRetention: "long" }`).
- Пріоритет об’єднання `params` (config): `agents.defaults.params` (глобальна база) перевизначається через `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (для відповідного ID агента) перевизначає ключі. Докладніше див. [Prompt Caching](/uk/reference/prompt-caching).
- `embeddedHarness`: типова політика низькорівневого embedded runtime агента. Використовуйте `runtime: "auto"`, щоб зареєстровані harness Plugin-ів могли перехоплювати підтримувані моделі, `runtime: "pi"` для примусового використання вбудованого harness PI або зареєстрований ID harness, наприклад `runtime: "codex"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний fallback PI.
- Автори config, які змінюють ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об’єкта й за можливості зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно серіалізується). За замовчуванням: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` керує тим, який низькорівневий executor виконує embedded turn-и агента.
У більшості розгортань слід залишити типове значення `{ runtime: "auto", fallback: "pi" }`.
Використовуйте це, коли довірений Plugin надає нативний harness, наприклад bundled
Codex app-server harness.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` або ID зареєстрованого harness Plugin-а. Bundled Plugin Codex реєструє `codex`.
- `fallback`: `"pi"` або `"none"`. `"pi"` зберігає вбудований harness PI як fallback сумісності, коли жоден harness Plugin-а не вибрано. `"none"` змушує помилково завершуватися у випадку відсутнього або непідтримуваного harness Plugin-а замість тихого переходу на PI. Помилки вибраного harness Plugin-а завжди показуються напряму.
- Перевизначення через environment: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` вимикає fallback PI для цього процесу.
- Для розгортань лише з Codex задайте `model: "openai/gpt-5.5"`, `embeddedHarness.runtime: "codex"` і `embeddedHarness.fallback: "none"`.
- Вибір harness фіксується для кожного session id після першого embedded run. Зміни config/env впливають на нові або скинуті сесії, але не на наявний transcript. Застарілі сесії з історією transcript, але без зафіксованого harness, вважаються закріпленими за PI. `/status` показує не-PI ID harness, наприклад `codex`, поруч із `Fast`.
- Це керує лише embedded chat harness. Генерація медіа, vision, PDF, music, video і TTS усе ще використовують свої налаштування provider/model.

**Вбудовані shorthand-alias-и** (застосовуються лише коли модель є в `agents.defaults.models`):

| Alias               | Модель                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ваші налаштовані alias-и завжди мають пріоритет над типовими.

Моделі Z.AI GLM-4.x автоматично вмикають режим thinking, якщо ви не задасте `--thinking off` або самостійно не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI за замовчуванням вмикають `tool_stream` для потокового виклику tool. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 за замовчуванням використовується thinking `adaptive`, якщо явний рівень thinking не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI backend-и для fallback-запусків лише з текстом (без викликів tool). Корисно як резервний варіант, коли provider-и API не працюють.

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

- CLI backend-и орієнтовані насамперед на текст; tools завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Pass-through зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь system prompt, зібраний OpenClaw, на фіксований рядок. Задається на типовому рівні (`agents.defaults.systemPromptOverride`) або для конкретного агента (`agents.list[].systemPromptOverride`). Значення для конкретного агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із prompt.

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

Незалежні від provider-а overlay prompt-ів, що застосовуються за сімейством моделей. ID моделей сімейства GPT-5 отримують спільний контракт поведінки між provider-ами; `personality` керує лише шаром дружнього стилю взаємодії.

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

- `"friendly"` (за замовчуванням) і `"on"` вмикають шар дружнього стилю взаємодії.
- `"off"` вимикає лише дружній шар; тегований контракт поведінки GPT-5 залишається увімкненим.
- Застарілий `plugins.entries.openai.config.personality` усе ще зчитується, коли це спільне налаштування не задано.

### `agents.defaults.heartbeat`

Періодичні запуски heartbeat.

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

- `every`: рядок тривалості (ms/s/m/h). За замовчуванням: `30m` (автентифікація API key) або `1h` (автентифікація OAuth). Задайте `0m`, щоб вимкнути.
- `includeSystemPromptSection`: якщо `false`, прибирає секцію Heartbeat із system prompt і пропускає ін’єкцію `HEARTBEAT.md` у bootstrap-контекст. За замовчуванням: `true`.
- `suppressToolErrorWarnings`: якщо `true`, пригнічує payload-и попереджень про помилки tool під час запусків heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного turn агента heartbeat до його переривання. Якщо не задавати, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: policy прямої доставки/DM. `allow` (за замовчуванням) дозволяє доставку до прямої цілі. `block` пригнічує доставку до прямої цілі та генерує `reason=dm-blocked`.
- `lightContext`: якщо `true`, запуски heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів workspace.
- `isolatedSession`: якщо `true`, кожен heartbeat виконується у свіжій сесії без попередньої історії розмови. Такий самий шаблон ізоляції, як у cron `sessionTarget: "isolated"`. Зменшує вартість одного heartbeat приблизно зі ~100K до ~2-5K token-ів.
- Для конкретного агента: задайте `agents.list[].heartbeat`. Якщо будь-який агент визначає `heartbeat`, heartbeat запускаються **лише для цих агентів**.
- Heartbeat виконують повні turn-и агента — коротші інтервали спалюють більше token-ів.

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

- `mode`: `default` або `safeguard` (підсумовування довгих історій по частинах). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin provider-а compaction. Якщо задано, замість вбудованого підсумовування LLM викликається `summarize()` цього provider-а. У разі збою використовується вбудований варіант. Вибір provider-а примусово вмикає `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволена для однієї операції Compaction до її переривання OpenClaw. За замовчуванням: `900`.
- `identifierPolicy`: `strict` (за замовчуванням), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів під час підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст про збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов’язкові назви секцій H2/H3 з AGENTS.md, які повторно ін’єктуються після Compaction. За замовчуванням `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторну ін’єкцію. Якщо значення не задано або явно задано цю типову пару, як застарілий fallback також приймаються старіші заголовки `Every Session`/`Safety`.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, коли основна сесія має зберігати одну модель, а підсумки Compaction повинні виконуватися на іншій; якщо не задано, Compaction використовує primary model сесії.
- `notifyUser`: коли `true`, надсилає користувачеві короткі повідомлення, коли Compaction починається і коли завершується (наприклад, "Compacting context..." і "Compaction complete"). За замовчуванням вимкнено, щоб Compaction залишався тихим.
- `memoryFlush`: тихий agentic turn перед auto-Compaction для збереження довготривалих спогадів. Пропускається, коли workspace доступний лише для читання.

### `agents.defaults.contextPruning`

Очищає **старі результати tool** з контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

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

- `mode: "cache-ttl"` вмикає проходи очищення.
- `ttl` керує тим, як часто очищення може виконуватися знову (після останнього торкання кешу).
- Очищення спочатку м’яко обрізає завеликі результати tool, а потім жорстко очищає старіші результати tool, якщо це потрібно.

**Soft-trim** зберігає початок + кінець і вставляє `...` посередині.

**Hard-clear** замінює весь результат tool placeholder-ом.

Примітки:

- Блоки зображень ніколи не обрізаються/не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості token-ів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень assistant, очищення пропускається.

</Accordion>

Докладніше про поведінку див. [Session Pruning](/uk/concepts/session-pruning).

### Блокове потокове передавання

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

- Для не-Telegram channel потрібне явне `*.blockStreaming: true`, щоб увімкнути block replies.
- Перевизначення для channel: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремого облікового запису). Signal/Slack/Discord/Google Chat за замовчуванням мають `minChars: 1500`.
- `humanDelay`: випадкова пауза між block replies. `natural` = 800–2500ms. Перевизначення для конкретного агента: `agents.list[].humanDelay`.

Докладніше про поведінку та chunking див. [Streaming](/uk/concepts/streaming).

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

- За замовчуванням: `instant` для особистих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язковий sandboxing для embedded агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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

<Accordion title="Подробиці sandbox">

**Backend:**

- `docker`: локальний runtime Docker (за замовчуванням)
- `ssh`: загальний віддалений runtime на основі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, специфічні для runtime налаштування переносяться до
`plugins.entries.openshell.config`.

**Конфігурація backend SSH:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (за замовчуванням: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для workspace у межах кожного scope
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані до OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри policy ключів хоста OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef розв’язуються з активного snapshot runtime секретів до запуску сесії sandbox

**Поведінка backend SSH:**

- один раз ініціалізує віддалений workspace після create або recreate
- потім зберігає віддалений SSH workspace як канонічний
- маршрутизує `exec`, file tools і media paths через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує контейнери браузера sandbox

**Доступ до workspace:**

- `none`: workspace sandbox для кожного scope у `~/.openclaw/sandboxes`
- `ro`: workspace sandbox у `/workspace`, workspace агента монтується лише для читання в `/agent`
- `rw`: workspace агента монтується для читання/запису в `/workspace`

**Scope:**

- `session`: окремий контейнер + workspace для кожної сесії
- `agent`: один контейнер + workspace на агента (за замовчуванням)
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

- `mirror`: перед `exec` засіває віддалений простір із локального, після `exec` синхронізує назад; локальний workspace залишається канонічним
- `remote`: один раз засіває віддалений простір під час створення sandbox, після чого канонічним залишається віддалений workspace

У режимі `remote` редагування на хості, зроблені поза OpenClaw, після кроку початкового засівання не синхронізуються автоматично в sandbox.
Транспортом є SSH до sandbox OpenShell, але Plugin володіє життєвим циклом sandbox і необов’язковою синхронізацією mirror.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потребує вихідного доступу до мережі, доступного для запису root і користувача root.

**Контейнери за замовчуванням використовують `network: "none"`** — установіть `"bridge"` (або власну bridge network), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` заблоковано за замовчуванням, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Вхідні вкладення** розміщуються в `media/inbound/*` в активному workspace.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для конкретного агента об’єднуються.

**Браузер у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC ін’єктується в system prompt. Не потребує `browser.enabled` у `openclaw.json`.
Доступ спостерігача noVNC за замовчуванням використовує VNC auth, а OpenClaw генерує URL із короткоживучим token (замість того, щоб показувати пароль у спільному URL).

- `allowHostControl: false` (за замовчуванням) блокує націлювання sandboxed-сесій на браузер хоста.
- `network` за замовчуванням має значення `openclaw-sandbox-browser` (виділена bridge network). Установлюйте `bridge` лише тоді, коли вам явно потрібна глобальна зв’язність bridge.
- `cdpSourceRange` за бажанням обмежує вхідний CDP на межі контейнера до діапазону CIDR (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер браузера sandbox. Якщо задано (зокрема `[]`), замінює `docker.binds` для контейнера браузера.
- Типові параметри запуску визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для хостів контейнерів:
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
  - `--disable-extensions` (типово увімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    увімкнені за замовчуванням і можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо для роботи з WebGL/3D це потрібно.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` повторно вмикає extensions, якщо ваш workflow
    від них залежить.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - а також `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовим рівнем образу контейнера; використовуйте власний browser image із власним
    entrypoint, щоб змінити типові параметри контейнера.

</Accordion>

Browser sandboxing і `sandbox.docker.binds` підтримуються лише для Docker.

Побудова образів:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (перевизначення для конкретного агента)

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

- `id`: стабільний ID агента (обов’язково).
- `default`: коли таких записів кілька, перший має пріоритет (записується попередження). Якщо не задано жодного, типовим стає перший елемент списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback-и). Cron jobs, які перевизначають лише `primary`, усе одно успадковують типові fallback-и, якщо ви не задасте `fallbacks: []`.
- `params`: параметри stream для конкретного агента, об’єднані поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для перевизначень на рівні агента, таких як `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `skills`: необов’язковий allowlist Skills для конкретного агента. Якщо його пропущено, агент успадковує `agents.defaults.skills`, якщо його задано; явний список замінює типові значення замість об’єднання, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для конкретного агента (`off | minimal | low | medium | high | xhigh | adaptive | max`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для конкретного повідомлення чи сесії.
- `reasoningDefault`: необов’язкове типове значення видимості reasoning для конкретного агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для конкретного повідомлення чи сесії.
- `fastModeDefault`: необов’язкове типове значення fast mode для конкретного агента (`true | false`). Застосовується, коли не задано перевизначення fast mode для конкретного повідомлення чи сесії.
- `embeddedHarness`: необов’язкове перевизначення політики низькорівневого harness для конкретного агента. Використовуйте `{ runtime: "codex", fallback: "none" }`, щоб зробити один агент лише Codex, а інші агенти залишити з типовим fallback PI.
- `runtime`: необов’язковий опис runtime для конкретного агента. Використовуйте `type: "acp"` разом з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент за замовчуванням має використовувати ACP harness sessions.
- `identity.avatar`: шлях відносно workspace, URL `http(s)` або URI `data:`.
- `identity` формує типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist ID агентів для `sessions_spawn` (`["*"]` = будь-який; за замовчуванням: лише той самий агент).
- Захист успадкування sandbox: якщо сесія-запитувач працює в sandbox, `sessions_spawn` відхиляє цілі, які запустилися б без sandbox.
- `subagents.requireAgentId`: коли `true`, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує до явного вибору профілю; за замовчуванням: false).

---

## Маршрутизація Multi-agent

Запускайте кілька ізольованих агентів у межах одного Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

### Поля match для binding

- `type` (необов’язково): `route` для звичайної маршрутизації (якщо тип відсутній, використовується route), `acp` для постійних ACP conversation bindings.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; якщо пропущено = обліковий запис за замовчуванням)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічні для channel)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок match:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього channel)
6. Агент за замовчуванням

У межах кожного рівня перший відповідний запис `bindings` має пріоритет.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок route binding.

### Профілі доступу для конкретного агента

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

<Accordion title="Інструменти й workspace лише для читання">

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

Докладніше про пріоритети див. [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

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

<Accordion title="Подробиці полів session">

- **`scope`**: базова стратегія групування сесій для контекстів групового чату.
  - `per-sender` (за замовчуванням): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише тоді, коли спільний контекст є бажаним).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM спільно використовують основну сесію.
  - `per-peer`: ізоляція за ID відправника між каналами.
  - `per-channel-peer`: ізоляція за channel + відправник (рекомендовано для inbox із кількома користувачами).
  - `per-account-channel-peer`: ізоляція за обліковий запис + channel + відправник (рекомендовано для багатооблікових конфігурацій).
- **`identityLinks`**: мапа канонічних ID до peer-ів із префіксами provider-а для спільного використання сесій між каналами.
- **`reset`**: основна policy скидання. `daily` скидає в `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Коли налаштовано обидва, спрацьовує те, що закінчиться першим.
- **`resetByType`**: перевизначення для конкретного типу (`direct`, `group`, `thread`). Застаріле `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` у батьківській сесії, дозволене при створенні forked thread session (за замовчуванням `100000`).
  - Якщо `totalTokens` батьківської сесії перевищує це значення, OpenClaw запускає нову thread session замість успадкування історії transcript батьківської сесії.
  - Установіть `0`, щоб вимкнути цей захист і завжди дозволяти forking від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для основного bucket прямого чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість turn-ів відповіді у відповідь між агентами під час обміну agent-to-agent (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжки ping-pong.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перший збіг deny має пріоритет.
- **`maintenance`**: очищення сховища сесій + параметри зберігання.
  - `mode`: `warn` лише видає попередження; `enforce` застосовує очищення.
  - `pruneAfter`: вікове обмеження для застарілих записів (за замовчуванням `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (за замовчуванням `500`).
  - `rotateBytes`: ротує `sessions.json`, коли він перевищує цей розмір (за замовчуванням `10mb`).
  - `resetArchiveRetention`: термін зберігання архівів transcript `*.reset.<timestamp>`. За замовчуванням дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий жорсткий ліміт дискового простору для каталогу сесій. У режимі `warn` він записує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення за бюджетом. За замовчуванням дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до thread.
  - `enabled`: головний типовий перемикач (provider-и можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типовий час автоматичного зняття focus через неактивність у годинах (`0` вимикає; provider-и можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; provider-и можуть перевизначати)

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

Перевизначення для конкретного каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Порядок розв’язання (найспецифічніше має пріоритет): account → channel → global. `""` вимикає префікс і зупиняє каскад. `"auto"` формує `[{identity.name}]`.

**Змінні шаблону:**

| Змінна            | Опис                   | Приклад                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва provider-а       | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off`      |
| `{identity.name}` | Ім’я identity агента   | (те саме, що `"auto"`)      |

Змінні не чутливі до регістру. `{think}` — це alias для `{thinkingLevel}`.

### Ack reaction

- За замовчуванням використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для конкретного каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок розв’язання: account → channel → `messages.ackReaction` → fallback identity.
- Scope: `group-mentions` (за замовчуванням), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє ack після відповіді у Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції життєвого циклу статусу в Slack, Discord і Telegram.
  У Slack і Discord відсутнє значення зберігає статусні реакції увімкненими, коли ack reactions активні.
  У Telegram потрібно явно встановити `true`, щоб увімкнути статусні реакції життєвого циклу.

### Вхідний debounce

Об’єднує швидкі текстові повідомлення від одного відправника в один turn агента. Медіа/вкладення скидаються негайно. Команди керування обходять debounce.

### TTS (text-to-speech)

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

- `auto` керує типовим режимом auto-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні prefs, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для auto-summary.
- `modelOverrides` увімкнено за замовчуванням; для `modelOverrides.allowProvider` за замовчуванням установлено `false` (opt-in).
- API key використовують fallback до `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок розв’язання: config, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на не-OpenAI endpoint, OpenClaw трактує його як OpenAI-compatible TTS server і послаблює валідацію model/voice.

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

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кількох provider-ів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- ID голосів використовують fallback до `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає plaintext-рядки або об’єкти SecretRef.
- Fallback `ELEVENLABS_API_KEY` застосовується лише тоді, коли не налаштовано жодного API key Talk.
- `providers.*.voiceAliases` дає змогу директивам Talk використовувати дружні назви.
- `silenceTimeoutMs` керує тим, як довго режим Talk чекає після тиші користувача, перш ніж надіслати transcript. Якщо не задано, використовується типове для платформи вікно паузи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Tools

### Профілі tool

`tools.profile` задає базовий allowlist перед `tools.allow`/`tools.deny`:

Локальний onboarding для нових локальних config за замовчуванням встановлює `tools.profile: "coding"`, якщо значення не задано (наявні явні профілі зберігаються).

| Профіль     | Включає                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Без обмежень (те саме, що без значення)                                                                                         |

### Групи tool

| Група              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як alias для `exec`)                                            |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Усі вбудовані tools (не включає provider Plugin-и)                                                                      |

### `tools.allow` / `tools.deny`

Глобальна allow/deny policy для tool (deny має пріоритет). Без урахування регістру, підтримує wildcard-и `*`. Застосовується навіть тоді, коли Docker sandbox вимкнений.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує tools для конкретних provider-ів або моделей. Порядок: base profile → profile provider-а → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.5": { allow: ["group:fs", "sessions_list"] },
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

- Перевизначення для конкретного агента (`agents.list[].tools.elevated`) може лише додатково обмежувати.
- `/elevated on|off|ask|full` зберігає стан для кожної сесії; inline-директиви застосовуються до одного повідомлення.
- Elevated `exec` обходить sandboxing і використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціллю exec є `node`).

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
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Перевірки безпеки від циклів tool **вимкнені за замовчуванням**. Установіть `enabled: true`, щоб увімкнути виявлення.
Параметри можна задавати глобально в `tools.loopDetection` і перевизначати для конкретного агента в `agents.list[].tools.loopDetection`.

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

- `historySize`: максимальна історія викликів tool, яка зберігається для аналізу циклів.
- `warningThreshold`: поріг повторюваного шаблону без прогресу для попереджень.
- `criticalThreshold`: вищий поріг повторення для блокування критичних циклів.
- `globalCircuitBreakerThreshold`: жорсткий поріг зупинки для будь-якого запуску без прогресу.
- `detectors.genericRepeat`: попереджати про повторювані виклики того самого tool з тими самими args.
- `detectors.knownPollNoProgress`: попереджати/блокувати відомі poll-tools (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати чергування пар без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, валідація завершується помилкою.

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

Налаштовує розуміння вхідних медіа (image/audio/video):

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

<Accordion title="Поля запису моделі media">

**Запис provider-а** (`type: "provider"` або пропущено):

- `provider`: ID API provider-а (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення ID моделі
- `profile` / `preferredProfile`: вибір профілю з `auth-profiles.json`

**Запис CLI** (`type: "cli"`):

- `command`: виконуваний файл для запуску
- `args`: шаблонізовані args (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов’язковий список (`image`, `audio`, `video`). Значення за замовчуванням: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для конкретного запису.
- У разі помилки виконується fallback до наступного запису.

Автентифікація provider-а дотримується стандартного порядку: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Поля async completion:**

- `asyncCompletion.directSend`: коли `true`, завершені асинхронні завдання `music_generate`
  і `video_generate` спочатку намагаються доставлятися безпосередньо в channel. За замовчуванням: `false`
  (застарілий шлях requester-session wake/model-delivery).

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

Керує тим, на які сесії можуть націлюватися tools сесій (`sessions_list`, `sessions_history`, `sessions_send`).

За замовчуванням: `tree` (поточна сесія + сесії, породжені нею, наприклад subagent-и).

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
- `tree`: поточна сесія + сесії, породжені поточною сесією (subagent-и).
- `agent`: будь-яка сесія, що належить поточному ID агента (може включати інших користувачів, якщо ви запускаєте сесії per-sender під тим самим ID агента).
- `all`: будь-яка сесія. Націлювання між агентами все одно потребує `tools.agentToAgent`.
- Обмеження sandbox: коли поточна сесія працює в sandbox, а `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється в `tree`, навіть якщо `tools.sessions.visibility="all"`.

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
- Файли матеріалізуються в workspace дочірньої сесії за шляхом `.openclaw/attachments/<uuid>/` разом із `.manifest.json`.
- Вміст вкладень автоматично редагується в persistence transcript.
- Вхідні дані Base64 перевіряються суворою перевіркою алфавіту/padding і захистом розміру до декодування.
- Дозволи файлів: `0700` для каталогів і `0600` для файлів.
- Очищення підпорядковується policy `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише тоді, коли `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

Експериментальні прапорці вбудованих tool. За замовчуванням вимкнені, якщо не застосовується правило auto-enable для strict-agentic GPT-5.

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

- `planTool`: вмикає структурований експериментальний tool `update_plan` для відстеження нетривіальної багатокрокової роботи.
- За замовчуванням: `false`, якщо лише `agents.defaults.embeddedPi.executionContract` (або перевизначення для конкретного агента) не встановлено в `"strict-agentic"` для запуску сімейства GPT-5 OpenAI або OpenAI Codex. Установіть `true`, щоб примусово ввімкнути tool поза цим контекстом, або `false`, щоб залишити його вимкненим навіть для strict-agentic запусків GPT-5.
- Коли його ввімкнено, system prompt також додає інструкції з використання, щоб модель застосовувала його лише для суттєвої роботи та тримала не більше одного кроку `in_progress`.

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

- `model`: типова модель для породжених subagent-ів. Якщо не задано, subagent-и успадковують модель викликача.
- `allowAgents`: типовий allowlist цільових ID агентів для `sessions_spawn`, коли агент-запитувач не задає власне `subagents.allowAgents` (`["*"]` = будь-який; за замовчуванням: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (секунди) для `sessions_spawn`, коли у виклику tool не вказано `runTimeoutSeconds`. `0` означає без тайм-ауту.
- Policy tool для конкретного subagent-а: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Власні provider-и та base URL

OpenClaw використовує вбудований каталог моделей. Додавайте власні provider-и через `models.providers` у config або `~/.openclaw/agents/<agentId>/agent/models.json`.

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

- Використовуйте `authHeader: true` + `headers` для власних потреб автентифікації.
- Перевизначайте корінь config агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий alias змінної середовища).
- Пріоритет об’єднання для відповідних ID provider-ів:
  - Непорожні значення `baseUrl` з `models.json` агента мають пріоритет.
  - Непорожні значення `apiKey` агента мають пріоритет лише тоді, коли `apiKey` цього provider-а не керується через SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` provider-а, керовані через SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env ref, `secretref-managed` для file/exec ref) замість збереження розв’язаних секретів.
  - Значення header provider-а, керовані через SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env ref, `secretref-managed` для file/exec ref).
  - Порожні або відсутні значення `apiKey`/`baseUrl` агента використовують fallback до `models.providers` у config.
  - Для відповідних моделей `contextWindow`/`maxTokens` використовують вище значення між явним config і неявними значеннями каталогу.
  - Для відповідних моделей `contextTokens` зберігає явне runtime-обмеження, якщо воно задане; використовуйте це, щоб обмежити фактичний контекст без зміни metadata нативної моделі.
  - Використовуйте `models.mode: "replace"`, коли хочете, щоб config повністю переписав `models.json`.
  - Збереження маркерів є джерельно-авторитетним: маркери записуються з активного snapshot config джерела (до розв’язання), а не з розв’язаних секретних значень runtime.

### Подробиці полів provider-а

- `models.mode`: поведінка каталогу provider-а (`merge` або `replace`).
- `models.providers`: мапа власних provider-ів з ключем за ID provider-а.
  - Безпечне редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для додавальних оновлень. `config set` відмовляється від руйнівних замін, якщо ви не передасте `--replace`.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані provider-а (краще використовувати SecretRef/env substitution).
- `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` ін’єктує `options.num_ctx` у запити (за замовчуванням: `true`).
- `models.providers.*.authHeader`: примусово передає облікові дані в заголовку `Authorization`, коли це потрібно.
- `models.providers.*.baseUrl`: base URL висхідного API.
- `models.providers.*.headers`: додаткові статичні headers для маршрутизації proxy/tenant.
- `models.providers.*.request`: перевизначення transport для HTTP-запитів model-provider.
  - `request.headers`: додаткові headers (об’єднуються з типовими значеннями provider-а). Значення приймають SecretRef.
  - `request.auth`: перевизначення стратегії auth. Режими: `"provider-default"` (використовувати вбудовану auth provider-а), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов’язковим `prefix`).
  - `request.proxy`: перевизначення HTTP proxy. Режими: `"env-proxy"` (використовувати env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов’язковий підоб’єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTPS до `baseUrl`, якщо DNS резолвиться в приватні, CGNAT або подібні діапазони, через захист SSRF HTTP fetch provider-а (operator opt-in для довірених self-hosted OpenAI-compatible endpoint-ів). WebSocket використовує той самий `request` для headers/TLS, але не цей SSRF-захист fetch. За замовчуванням `false`.
- `models.providers.*.models`: явні записи каталогу моделей provider-а.
- `models.providers.*.models.*.contextWindow`: metadata нативного вікна контексту моделі.
- `models.providers.*.models.*.contextTokens`: необов’язкове runtime-обмеження контексту. Використовуйте це, коли хочете менший фактичний budget контексту, ніж нативний `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` з непорожнім не-нативним `baseUrl` (host не `api.openai.com`) OpenClaw примусово встановлює це в `false` під час runtime. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для OpenAI-compatible chat endpoint-ів, що підтримують лише рядки. Коли `true`, OpenClaw сплющує чисто текстові масиви `messages[].content` у звичайні рядки перед надсиланням запиту.
- `plugins.entries.amazon-bedrock.config.discovery`: корінь налаштувань auto-discovery для Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне discovery.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр ID provider-а для цільового discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: fallback context window для виявлених моделей.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: fallback max output tokens для виявлених моделей.

### Приклади provider-ів

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

Використовуйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` для прямого Z.AI.

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

Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або посилання `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

Установіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` є прийнятними alias-ами. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint для coding (за замовчуванням): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint-а визначте власний provider із перевизначенням base URL.

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

Для endpoint-а China: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

Нативні endpoint-и Moonshot повідомляють про сумісність streaming usage на спільному transport `openai-completions`, і OpenClaw прив’язує це до можливостей endpoint-а, а не лише до ID вбудованого provider-а.

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

Anthropic-compatible, вбудований provider. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

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

Base URL має бути без `/v1` (клієнт Anthropic додає його сам). Скорочення: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (напряму)">

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

Установіть `MINIMAX_API_KEY`. Скорочення:
`openclaw onboard --auth-choice minimax-global-api` або
`openclaw onboard --auth-choice minimax-cn-api`.
Каталог моделей за замовчуванням містить лише M2.7.
На Anthropic-compatible streaming path OpenClaw вимикає thinking MiniMax
за замовчуванням, якщо ви явно не задасте `thinking`. `/fast on` або
`params.fastMode: true` переписує `MiniMax-M2.7` у
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Локальні моделі (LM Studio)">

Див. [Local Models](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному залізі; зберігайте hosted-моделі об’єднаними для fallback.

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
- `install.preferBrew`: коли `true`, віддає перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перш ніж переходити до інших типів інсталяторів.
- `install.nodeManager`: пріоритет node-інсталятора для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручне поле API key для Skills, які оголошують основну env var (plaintext-рядок або об’єкт SecretRef).

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
- Discovery приймає нативні Plugin-и OpenClaw, а також сумісні Codex bundles і Claude bundles, включно з безманіфестними Claude bundle-ами у типовому layout.
- **Зміни конфігурації потребують перезапуску gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені Plugin-и). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API key на рівні Plugin-а (коли Plugin це підтримує).
- `plugins.entries.<id>.env`: мапа env var у межах Plugin-а.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` і ігнорує поля legacy `before_agent_start`, що мутують prompt, зберігаючи при цьому legacy `modelOverride` і `providerOverride`. Це застосовується до hook-ів нативних Plugin-ів і підтримуваних каталогів hook-ів, наданих bundle-ами.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому Plugin-у запитувати перевизначення `provider` і `model` для кожного запуску фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли свідомо хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт config, визначений Plugin-ом (валідується за schema нативного Plugin-а OpenClaw, якщо вона доступна).
- `plugins.entries.firecrawl.config.webFetch`: налаштування provider-а web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (приймає SecretRef). Використовує fallback до `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL API Firecrawl (за замовчуванням: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст сторінок (за замовчуванням: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (за замовчуванням: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scrape у секундах (за замовчуванням: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути provider X Search.
  - `model`: модель Grok, яку слід використовувати для пошуку (наприклад `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory Dreaming. Фази та пороги див. у [Dreaming](/uk/concepts/dreaming).
  - `enabled`: головний перемикач Dreaming (за замовчуванням `false`).
  - `frequency`: cron cadence для кожного повного проходу Dreaming (за замовчуванням `"0 3 * * *"`).
  - policy phase і пороги є деталями реалізації (а не користувацькими ключами config).
- Повна конфігурація memory знаходиться в [Memory configuration reference](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundle Plugin-и також можуть додавати embedded Pi defaults із `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як сирі патчі config OpenClaw.
- `plugins.slots.memory`: вибрати ID активного Plugin-а пам’яті або `"none"`, щоб вимкнути Plugin-и пам’яті.
- `plugins.slots.contextEngine`: вибрати ID активного Plugin-а context engine; за замовчуванням `"legacy"`, якщо ви не встановите й не виберете інший engine.
- `plugins.installs`: metadata встановлень, якими керує CLI, і які використовуються `openclaw plugins update`.
  - Включає `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Вважайте `plugins.installs.*` керованим станом; віддавайте перевагу командам CLI, а не ручному редагуванню.

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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` у вимкненому стані, якщо не задано, тому навігація browser за замовчуванням залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви навмисно довіряєте навігації browser у приватній мережі.
- У суворому режимі endpoint-и віддалених профілів CDP (`profiles.*.cdpUrl`) підлягають тим самим блокуванням приватної мережі під час перевірок доступності/discovery.
- `ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий alias.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі є лише attach-only (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виконав discovery через `/json/version`; використовуйте WS(S),
  коли provider дає вам прямий DevTools WebSocket URL.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися
  до вибраного хоста або через підключений browser node.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлюватися на конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Для профілів `existing-session` залишаються чинними поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-selector, hooks завантаження одного файла, відсутність перевизначень тайм-ауту діалогів, відсутність `wait --load networkidle`, а також відсутність `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; задавайте
  `cdpUrl` явно лише для віддаленого CDP.
- Порядок auto-detect: browser за замовчуванням, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Сервіс керування: лише loopback (порт виводиться з `gateway.port`, за замовчуванням `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розміри вікна або прапорці налагодження).

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

- `seamColor`: accent color для chrome нативного UI (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення identity для Control UI. Використовує fallback до identity активного агента.

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

<Accordion title="Подробиці полів Gateway">

- `mode`: `local` (запускати gateway) або `remote` (підключатися до віддаленого gateway). Gateway відмовляється запускатися, якщо не задано `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (за замовчуванням), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі alias-и bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не alias-и host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка про Docker**: типове bind-значення `loopback` слухає `127.0.0.1` усередині контейнера. За bridge networking Docker (`-p 18789:18789`) трафік приходить на `eth0`, тож gateway недоступний. Використовуйте `--network host` або задайте `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: за замовчуванням обов’язкова. Для не-loopback bind-ів потрібна auth gateway. На практиці це означає shared token/password або reverse proxy з урахуванням identity з `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding за замовчуванням генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (зокрема SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Потоки запуску та встановлення/ремонту сервісу завершуються помилкою, якщо обидва налаштовані, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних loopback-конфігурацій; цей режим навмисно не пропонується в prompt-ах onboarding.
- `gateway.auth.mode: "trusted-proxy"`: делегує auth reverse proxy, що враховує identity, і довіряє заголовкам identity від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy на тому самому хості через loopback не задовольняє вимоги trusted-proxy auth.
- `gateway.auth.allowTailscale`: коли `true`, заголовки identity Tailscale Serve можуть задовольняти auth для Control UI/WebSocket (перевіряється через `tailscale whois`). HTTP API endpoint-и **не** використовують цю auth через заголовки Tailscale; вони підпорядковуються звичайному режиму HTTP auth gateway. Цей безтокеновий потік припускає, що хост gateway є довіреним. За замовчуванням `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий обмежувач невдалих спроб auth. Застосовується на кожен IP клієнта і на кожну область auth окремо (shared-secret і device-token відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом про невдачу. Тому паралельні хибні спроби від того самого клієнта можуть спровокувати обмежувач уже на другому запиті, замість того щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` за замовчуванням дорівнює `true`; установіть `false`, коли свідомо хочете також обмежувати localhost-трафік (для тестових конфігурацій або суворих proxy-розгортань).
- Спроби WS auth із browser-origin завжди throttle-яться з вимкненим exemption для loopback (додатковий захист від brute force localhost через browser).
- На loopback ці блокування для browser-origin ізолюються за нормалізованим
  значенням `Origin`, тож повторні невдачі з одного localhost origin не
  блокують автоматично інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind на loopback) або `funnel` (публічний, потребує auth).
- `controlUi.allowedOrigins`: явний allowlist browser-origin для WebSocket-підключень до Gateway. Потрібний, коли browser-клієнти очікуються з не-loopback origin-ів.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає fallback origin через Host header для розгортань, що навмисно покладаються на policy origin через Host header.
- `remote.transport`: `ssh` (за замовчуванням) або `direct` (ws/wss). Для `direct` `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: клієнтське break-glass-перевизначення, яке дозволяє plaintext `ws://` до довірених IP приватної мережі; за замовчуванням plaintext дозволений лише для loopback.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Самі по собі вони не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL для зовнішнього APNs relay, який використовують офіційні/TestFlight-збірки iOS після того, як вони публікують реєстрації на основі relay у gateway. Цей URL має збігатися з URL relay, скомпільованим у збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання gateway-to-relay у мілісекундах. За замовчуванням `10000`.
- Реєстрації на основі relay делегуються конкретній identity gateway. Paired застосунок iOS отримує `gateway.identity.get`, включає цю identity в реєстрацію relay і передає до gateway дозвіл на надсилання в межах реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові перевизначення через env для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: лише для розробки, аварійний виняток для loopback HTTP relay URL. У production relay URL має залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал health-monitor каналу в хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски health-monitor. За замовчуванням: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого socket у хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. За замовчуванням: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на channel/account за ковзну годину. За замовчуванням: `10`.
- `channels.<provider>.healthMonitor.enabled`: перевизначення для конкретного каналу, щоб відмовитися від перезапусків health-monitor, залишивши глобальний monitor увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатооблікових channels. Якщо задано, воно має пріоритет над перевизначенням на рівні channel.
- Локальні шляхи викликів gateway можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується fail-closed (без маскування через remote fallback).
- `trustedProxies`: IP reverse proxy, які термінують TLS або ін’єктують forwarded-client headers. Вказуйте лише proxy, які ви контролюєте. Записи loopback залишаються коректними для конфігурацій на одному хості з proxy/local detection (наприклад Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. За замовчуванням `false` для fail-closed-поведінки.
- `gateway.tools.deny`: додаткові назви tool, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: прибирає назви tool із типового HTTP deny list.

</Accordion>

### OpenAI-compatible endpoint-и

- Chat Completions: за замовчуванням вимкнено. Увімкнення через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Захист URL-input для Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist-и трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання через URL.
- Необов’язковий заголовок посилення безпеки відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (встановлюйте лише для HTTPS origin-ів, які ви контролюєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

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

- `enabled`: вмикає термінацію TLS на listener gateway (HTTPS/WSS) (за замовчуванням: `false`).
- `autoGenerate`: автоматично генерує локальну self-signed пару cert/key, коли явні файли не налаштовані; лише для local/dev.
- `certPath`: шлях у файловій системі до файла TLS certificate.
- `keyPath`: шлях у файловій системі до приватного ключа TLS; обмежуйте до нього доступ через дозволи.
- `caPath`: необов’язковий шлях до bundle CA для перевірки клієнтів або власних ланцюжків довіри.

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

- `mode`: керує тим, як зміни config застосовуються під час runtime.
  - `"off"`: ігнорує live-редагування; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускає процес gateway при зміні config.
  - `"hot"`: застосовує зміни в процесі без перезапуску.
  - `"hybrid"` (за замовчуванням): спочатку пробує hot reload; якщо потрібно, повертається до restart.
- `debounceMs`: debounce-вікно в ms перед застосуванням змін config (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час очікування в ms для поточних операцій перед примусовим перезапуском (за замовчуванням: `300000` = 5 хвилин).

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

- `hooks.enabled=true` вимагає непорожній `hooks.token`.
- `hooks.token` має бути **відмінним** від `gateway.auth.token`; повторне використання token Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонізований `sessionKey`, установіть `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping не потребують цього opt-in.

**Endpoint-и:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` із payload запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (за замовчуванням: `false`).
- `POST /hooks/<name>` → розв’язується через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані через шаблон, трактуються як зовнішньо передані й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Подробиці mapping">

- `match.path` зіставляється з підшляхом після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляється з полем payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на JS/TS module, що повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID використовують fallback до агента за замовчуванням.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або відсутність = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook agent без явного `sessionKey`.
- `allowRequestSessionKey`: дозволяє викликачам `/hooks/agent` і session key з mapping на основі шаблонів задавати `sessionKey` (за замовчуванням: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-який mapping або preset використовує шаблонізований `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у channel; за замовчуванням `channel` має значення `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволеною, якщо задано каталог моделей).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте таку маршрутизацію на рівні окремого повідомлення, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` так, щоб вони відповідали простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість шаблонного типового значення.

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

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, коли це налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути це.
- Не запускайте окремий `gog gmail watch serve` паралельно з Gateway.

---

## Хост canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Обслуговує HTML/CSS/JS і A2UI, які може редагувати агент, через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: зберігайте `gateway.bind: "loopback"` (за замовчуванням).
- Для не-loopback bind-ів маршрути canvas потребують auth Gateway (token/password/trusted-proxy), так само як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають auth headers; після того як node paired і підключений, Gateway рекламує capability URL-и в межах node для доступу до canvas/A2UI.
- Capability URL-и прив’язані до активної WS-сесії node і швидко спливають. Fallback на основі IP не використовується.
- Ін’єктує клієнт live-reload у HTML, що обслуговується.
- Автоматично створює початковий `index.html`, коли каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску gateway.
- Вимикайте live reload для великих каталогів або у випадку помилок `EMFILE`.

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

- `minimal` (за замовчуванням): не включає `cliPath` + `sshPort` у записи TXT.
- `full`: включає `cliPath` + `sshPort`.
- Hostname за замовчуванням: `openclaw`. Перевизначення через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast DNS-SD zone у `~/.openclaw/dns/`. Для discovery між мережами поєднуйте це з DNS server (рекомендовано CoreDNS) + Tailscale split DNS.

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

- Вбудовані env vars застосовуються лише тоді, коли у process env відсутній відповідний ключ.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден із них не перевизначає наявні vars).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашого login shell.
- Повний порядок пріоритетів див. у [Environment](/uk/help/environment).

### Підстановка env var

Посилайтеся на env vars у будь-якому рядку config через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні vars спричиняють помилку під час завантаження config.
- Екрануйте через `$${VAR}`, щоб отримати буквальний `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є додатковими: plaintext-значення все ще працюють.

### `SecretRef`

Використовуйте один формат об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон `id` для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `id` для `source: "file"`: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон `id` для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` для `source: "exec"` не повинен містити шляхових сегментів `.` або `..`, розділених `/` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання з `auth-profiles.json` включено до runtime-розв’язання та покриття audit.

### Конфігурація provider-ів секретів

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

- Provider `file` підтримує `mode: "json"` і `mode: "singleValue"` (`id` має бути `"value"` у режимі singleValue).
- Шляхи provider-ів file і exec завершуються fail-closed, якщо перевірка Windows ACL недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Provider `exec` вимагає абсолютний шлях `command` і використовує payload-и протоколу через stdin/stdout.
- За замовчуванням symlink-шляхи до команд відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити symlink-шляхи, водночас валідуючи шлях до розв’язаного target.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до шляху розв’язаного target.
- Дочірнє environment для `exec` за замовчуванням мінімальне; передавайте потрібні змінні явно через `passEnv`.
- Посилання на секрети розв’язуються під час активації у snapshot в пам’яті, після чого шляхи запитів читають лише цей snapshot.
- Під час активації застосовується фільтрація активної поверхні: нерозв’язані посилання на увімкнених поверхнях призводять до збою запуску/reload, тоді як неактивні поверхні пропускаються з діагностикою.

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

- Профілі для конкретного агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Профілі режиму OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані auth-profile на основі SecretRef.
- Статичні runtime-облікові дані беруться з розв’язаних snapshot-ів у пам’яті; застарілі статичні записи `auth.json` очищаються під час виявлення.
- Застарілі OAuth-імпорти беруться з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Поведінка runtime секретів і інструменти `audit/configure/apply`: [Secrets Management](/uk/gateway/secrets).

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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль завершується невдачею через справжні
  помилки billing/insufficient-credit (за замовчуванням: `5`). Явний текст billing
  усе ще може потрапити сюди навіть у відповідях `401`/`403`, але
  зіставлення тексту, специфічні для provider-а, залишаються обмеженими provider-ом,
  якому вони належать (наприклад `Key limit exceeded` для OpenRouter). Retryable HTTP `402` usage-window або
  повідомлення про ліміти витрат organization/workspace натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин billing backoff для конкретних provider-ів.
- `billingMaxHours`: верхня межа в годинах для експоненційного зростання billing backoff (за замовчуванням: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високовпевнених збоїв `auth_permanent` (за замовчуванням: `10`).
- `authPermanentMaxMinutes`: верхня межа в хвилинах для зростання backoff `auth_permanent` (за замовчуванням: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників backoff (за замовчуванням: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile в межах одного provider-а для помилок overloaded перед перемиканням на model fallback (за замовчуванням: `1`). Такі форми зайнятості provider-а, як `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації overloaded provider/profile (за замовчуванням: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile в межах одного provider-а для помилок rate-limit перед перемиканням на model fallback (за замовчуванням: `1`). До цього bucket rate-limit також входить текст, характерний для provider-а, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

---

## Логування

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
- `consoleLevel` підвищується до `debug`, коли передано `--verbose`.
- `maxFileBytes`: максимальний розмір файла журналу в байтах, після якого записи пригнічуються (додатне ціле число; за замовчуванням: `524288000` = 500 MB). Для production-розгортань використовуйте зовнішню ротацію журналів.

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

- `enabled`: головний перемикач для виводу інструментування (за замовчуванням: `true`).
- `flags`: масив рядків-прапорців, що вмикають цільовий вивід журналів (підтримує wildcard-и, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: віковий поріг у ms для виведення попереджень про завислі сесії, поки сесія залишається у стані processing.
- `otel.enabled`: вмикає pipeline експорту OpenTelemetry (за замовчуванням: `false`).
- `otel.endpoint`: URL collector-а для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (за замовчуванням) або `"grpc"`.
- `otel.headers`: додаткові headers HTTP/gRPC metadata, які надсилаються разом із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт trace, metrics або logs.
- `otel.sampleRate`: частота sample-ів trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного flush telemetry в ms.
- `cacheTrace.enabled`: журналювати snapshot-и cache trace для embedded runs (за замовчуванням: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL cache trace (за замовчуванням: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід cache trace (усі за замовчуванням: `true`).

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

- `channel`: канал релізу для встановлень npm/git — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (за замовчуванням: `true`).
- `auto.enabled`: увімкнути фонове auto-update для встановлень пакетів (за замовчуванням: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед auto-apply для stable-каналу (за замовчуванням: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу rollout для stable-каналу в годинах (за замовчуванням: `12`; максимум: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу, у годинах (за замовчуванням: `1`; максимум: `24`).

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

- `enabled`: глобальний feature gate ACP (за замовчуванням: `false`).
- `dispatch.enabled`: незалежний gate для dispatch turn-ів ACP session (за замовчуванням: `true`). Установіть `false`, щоб залишити ACP-команди доступними, але заблокувати виконання.
- `backend`: ID backend-а runtime ACP за замовчуванням (має збігатися із зареєстрованим Plugin-ом runtime ACP).
- `defaultAgent`: fallback ID цільового агента ACP, коли spawn-и не задають явної цілі.
- `allowedAgents`: allowlist ID агентів, дозволених для сесій runtime ACP; порожній список означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних ACP session.
- `stream.coalesceIdleMs`: вікно flush за неактивністю в ms для streamed text.
- `stream.maxChunkChars`: максимальний розмір chunk до розбиття streamed block projection.
- `stream.repeatSuppression`: пригнічувати повторювані рядки status/tool у межах turn (за замовчуванням: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до terminal events turn-а.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих tool events (за замовчуванням: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу assistant, що проєктується на один ACP turn.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих ACP status/update lines.
- `stream.tagVisibility`: запис, що зіставляє назви tag-ів із булевими перевизначеннями видимості для streamed events.
- `runtime.ttlMinutes`: idle TTL у хвилинах для worker-ів ACP session до моменту, коли вони можуть бути очищені.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід запускати під час bootstrap середовища runtime ACP.

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

- `cli.banner.taglineMode` керує стилем tagline у banner:
  - `"random"` (за замовчуванням): змінні кумедні/сезонні tagline.
  - `"default"`: фіксований нейтральний tagline (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту tagline (title/version у banner все одно показуються).
- Щоб приховати весь banner (а не лише tagline), задайте env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadata, які записуються потоками guided setup CLI (`onboard`, `configure`, `doctor`):

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

Див. поля identity в `agents.list` у розділі [Типові параметри агента](#agent-defaults).

---

## Bridge (застарілий, видалений)

Поточні збірки більше не містять TCP bridge. Node підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною schema config (валідація завершується помилкою, доки їх не видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Застаріла конфігурація bridge (історична довідка)">

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

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків cron перед очищенням із `sessions.json`. Також керує очищенням архівів видалених transcript cron. За замовчуванням: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір одного файла журналу запуску (`cron/runs/<jobId>.jsonl`) до очищення. За замовчуванням: `2_000_000` байт.
- `runLog.keepLines`: кількість найновіших рядків, які зберігаються при спрацьовуванні очищення журналу запуску. За замовчуванням: `2000`.
- `webhookToken`: bearer token, що використовується для доставки cron webhook через POST (`delivery.mode = "webhook"`); якщо не задано, заголовок auth не надсилається.
- `webhook`: застарілий legacy fallback URL webhook (http/https), який використовується лише для збережених завдань, що все ще мають `notify: true`.

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

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань при тимчасових помилках (за замовчуванням: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у ms для кожної повторної спроби (за замовчуванням: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, що запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Якщо не задано, повторюються всі тимчасові типи.

Застосовується лише до одноразових cron-завдань. Для періодичних завдань використовується окрема обробка збоїв.

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

- `enabled`: увімкнути failure alert-и для cron-завдань (за замовчуванням: `false`).
- `after`: кількість послідовних збоїв перед спрацьовуванням alert (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними alert-ами для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення channel; `"webhook"` публікує в налаштований webhook.
- `accountId`: необов’язковий ID облікового запису або channel для обмеження доставки alert.

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

- Типова ціль для сповіщень про помилки cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; за замовчуванням `"announce"`, коли є достатньо даних про ціль.
- `channel`: перевизначення channel для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне значення за замовчуванням.
- Коли не задано ні глобальну, ні per-job ціль збою, завдання, які вже доставляють результат через `announce`, у разі збою використовують fallback до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону моделі media

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Змінна            | Опис                                            |
| ----------------- | ----------------------------------------------- |
| `{{Body}}`        | Повне тіло вхідного повідомлення                |
| `{{RawBody}}`     | Сире тіло (без обгорток history/sender)         |
| `{{BodyStripped}}`| Тіло з прибраними груповими згадками            |
| `{{From}}`        | Ідентифікатор відправника                       |
| `{{To}}`          | Ідентифікатор одержувача                        |
| `{{MessageSid}}`  | ID повідомлення channel                         |
| `{{SessionId}}`   | UUID поточної сесії                             |
| `{{IsNewSession}}`| `"true"`, коли створено нову сесію              |
| `{{MediaUrl}}`    | Псевдо-URL вхідного медіа                       |
| `{{MediaPath}}`   | Локальний шлях до медіа                         |
| `{{MediaType}}`   | Тип медіа (image/audio/document/…)              |
| `{{Transcript}}`  | Аудіотранскрипт                                 |
| `{{Prompt}}`      | Розв’язаний media prompt для записів CLI        |
| `{{MaxChars}}`    | Розв’язана максимальна кількість символів виводу для записів CLI |
| `{{ChatType}}`    | `"direct"` або `"group"`                        |
| `{{GroupSubject}}`| Тема групи (best effort)                        |
| `{{GroupMembers}}`| Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`  | Відображуване ім’я відправника (best effort)    |
| `{{SenderE164}}`  | Номер телефону відправника (best effort)        |
| `{{Provider}}`    | Підказка provider-а (whatsapp, telegram, discord тощо) |

---

## Include-и config (`$include`)

Розділяйте config на кілька файлів:

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

**Поведінка об’єднання:**

- Один файл: замінює об’єкт-контейнер.
- Масив файлів: глибоко об’єднується в заданому порядку (пізніші значення перевизначають попередні).
- Сусідні ключі: об’єднуються після include-ів (перевизначають включені значення).
- Вкладені include-и: до 10 рівнів вкладеності.
- Шляхи: розв’язуються відносно файла, який включає, але мають залишатися всередині каталогу config верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми та `../` дозволені лише тоді, коли вони все одно розв’язуються в межах цього кордону.
- Записи, якими володіє OpenClaw і які змінюють лише один top-level розділ, підкріплений include-ом з одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Root include-и, масиви include-ів та include-и з перевизначеннями сусідніх ключів є лише для читання для записів, якими володіє OpenClaw; такі записи завершуються fail-closed замість сплощення config.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок розбору та циклічних include-ів.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_
