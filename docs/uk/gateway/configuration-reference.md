---
read_when:
    - Вам потрібні точні семантики полів конфігурації або значення за замовчуванням
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник із конфігурації Gateway для основних ключів OpenClaw, значень за замовчуванням і посилань на окремі довідники підсистем
title: Довідник із конфігурації
x-i18n:
    generated_at: "2026-04-21T02:12:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e50315811f2ba31d325983397ffbd0f71c6e5e95a58a4412b62ebb969b50a3db
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Довідник із конфігурації

Основний довідник із конфігурації для `~/.openclaw/openclaw.json`. Огляд, орієнтований на завдання, див. у [Configuration](/uk/gateway/configuration).

Ця сторінка охоплює основні поверхні конфігурації OpenClaw і містить посилання назовні, коли підсистема має власний, глибший довідник. Вона **не** намагається вбудувати на одній сторінці кожен каталог команд, що належить каналу/Plugin, або кожен глибокий параметр пам’яті/QMD.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, що використовується для валідації та Control UI, із метаданими bundled/Plugin/channel, об’єднаними за наявності
- `config.schema.lookup` повертає один вузол схеми для певного шляху для інструментів детального перегляду
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють базовий геш документації конфігурації щодо поточної поверхні схеми

Окремі глибокі довідники:

- [Довідник із конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки відповідних каналів/Plugin для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх пропущено.

---

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не вказано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і політики груп:

| Політика DM         | Поведінка                                                      |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або в paired allow store)      |
| `open`              | Дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)          |
| `disabled`          | Ігнорувати всі вхідні DM                                       |

| Політика груп        | Поведінка                                             |
| -------------------- | ----------------------------------------------------- |
| `allowlist` (типово) | Лише групи, що відповідають налаштованому списку дозволених |
| `open`               | Обійти списки дозволених для груп (gate за згадуваннями все ще застосовується) |
| `disabled`           | Блокувати всі повідомлення груп/кімнат                |

<Note>
`channels.defaults.groupPolicy` задає значення за замовчуванням, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Кількість очікувальних запитів на DM pairing обмежена **3 на канал**.
Якщо блок провайдера відсутній повністю (`channels.<provider>` відсутній), політика груп під час виконання повертається до `allowlist` (fail-closed) з попередженням під час запуску.
</Note>

### Перевизначення моделі для каналу

Використовуйте `channels.modelByChannel`, щоб закріпити конкретні ідентифікатори каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Це зіставлення каналу застосовується, коли сеанс ще не має перевизначення моделі (наприклад, установленого через `/model`).

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

### Значення каналів за замовчуванням і Heartbeat

Використовуйте `channels.defaults` для спільної поведінки політики груп і Heartbeat у різних провайдерів:

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
- `channels.defaults.contextVisibility`: режим типової видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь процитований/потоковий/історичний контекст), `allowlist` (включати контекст лише від відправників зі списку дозволених), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати стани справних каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати стани деградації/помилок у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує пов’язаний сеанс.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // сині галочки (false у режимі self-chat)
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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше — перший налаштований ідентифікатор облікового запису (відсортований).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає це резервне вибирання типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису переноситься командою `openclaw doctor` у `whatsapp/default`.
- Перевизначення для окремого облікового запису: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (типово: off; вмикайте явно, щоб уникнути лімітів частоти на редагування попереднього перегляду)
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; символічні посилання відхиляються), з `TELEGRAM_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- У багатооблікових конфігураціях (2+ ідентифікатори облікових записів) установіть явний типовий обліковий запис (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли цього бракує або значення недійсне.
- `configWrites: false` блокує ініційовані з Telegram записи в конфігурацію (міграції ID supergroup, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів є спільною в [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Попередній перегляд потоків Telegram використовує `sendMessage` + `editMessageText` (працює у прямих і групових чатах).
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
      streaming: "off", // off | partial | block | progress (progress зіставляється з partial у Discord)
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
        spawnSubagentSessions: false, // opt-in для sessions_spawn({ thread: true })
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

- Токен: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; налаштування повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) як цілі доставки; прості числові ID відхиляються.
- Slug-и guild мають нижній регістр, а пробіли замінюються на `-`; ключі каналів використовують slug-овану назву (без `#`). Надавайте перевагу ID guild.
- Повідомлення, створені ботом, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналу) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `maxLinesPerMessage` (типово 17) розбиває високі повідомлення навіть тоді, коли вони мають менше ніж 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією, прив’язаною до потоків Discord:
  - `enabled`: перевизначення Discord для функцій сеансів, прив’язаних до потоку (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач opt-in для автоматичного створення/прив’язування потоків у `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і потоків (використовуйте id каналу/потоку в `match.peer.id`). Семантика полів є спільною в [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає колір акценту для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + TTS.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` напряму передаються в параметри DAVE `@discordjs/voice` (типово `true` і `24`).
- OpenClaw також додатково намагається відновити прийом голосу, виходячи та повторно приєднуючись до голосового сеансу після повторних збоїв дешифрування.
- `channels.discord.streaming` — це канонічний ключ режиму потоку. Застарілі значення `streamMode` і булеві `streaming` автоматично мігруються.
- `channels.discord.autoPresence` зіставляє доступність runtime із присутністю бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінними name/tag (режим сумісності break-glass).
- `channels.discord.execApprovals`: Discord-native доставка схвалень exec і авторизація тих, хто схвалює.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto схвалення exec активуються, коли тих, хто схвалює, можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати exec-запити. Якщо значення пропущено, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансу (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово) надсилає в DM тих, хто схвалює, `"channel"` надсилає у вихідний канал, `"both"` надсилає в обидва місця. Коли target включає `"channel"`, кнопки можуть використовувати лише визначені учасники, які схвалюють.
  - `cleanupAfterResolve`: коли `true`, видаляє DM зі схваленням після схвалення, відхилення або тайм-ауту.

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

- JSON сервісного облікового запису: inline (`serviceAccount`) або через файл (`serviceAccountFile`).
- Також підтримується SecretRef сервісного облікового запису (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` як цілі доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінним email principal (режим сумісності break-glass).

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
        nativeTransport: true, // використовувати native streaming API Slack, коли mode=partial
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

- **Socket mode** вимагає і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного env-варіанта типового облікового запису).
- **HTTP mode** вимагає `botToken` плюс `signingSecret` (у корені або для конкретного облікового запису).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack показують поля джерела/статусу для кожного облікового запису, такі як
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує ініційовані зі Slack записи в конфігурацію.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- `channels.slack.streaming.mode` — це канонічний ключ режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує native streaming transport Slack. Застарілі значення `streamMode`, булеві `streaming` і `nativeStreaming` автоматично мігруються.
- Використовуйте `user:<id>` (DM) або `channel:<id>` як цілі доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сеансів потоку:** `thread.historyScope` є окремим для кожного потоку (типово) або спільним для каналу. `thread.inheritParent` копіює транскрипт батьківського каналу в нові потоки.

- Native streaming Slack плюс статус потоку в стилі Slack assistant «is typing...» вимагають ціль відповіді у потоці. DM верхнього рівня типово залишаються поза потоком, тому вони використовують `typingReaction` або звичайну доставку замість попереднього перегляду в стилі потоку.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode емодзі Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native доставка схвалень exec і авторизація тих, хто схвалює. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій   | Типово  | Примітки                |
| ----------- | ------- | ----------------------- |
| reactions   | увімкнено | Реагувати + перелік реакцій |
| messages    | увімкнено | Читання/надсилання/редагування/видалення |
| pins        | увімкнено | Закріпити/відкріпити/перелік |
| memberInfo  | увімкнено | Інформація про учасника |
| emojiList   | увімкнено | Перелік користувацьких емодзі |

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
        // Необов’язковий явний URL для reverse-proxy/public розгортань
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Режими чату: `oncall` (відповідати на @-згадування, типово), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з тригерного префікса).

Коли native-команди Mattermost увімкнені:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повним URL.
- `commands.callbackUrl` має вказувати на endpoint Gateway OpenClaw і бути доступним із сервера Mattermost.
- Native slash callback-колбеки автентифікуються за допомогою токенів для кожної команди, які Mattermost повертає
  під час реєстрації slash-команд. Якщо реєстрація не вдається або не
  активовано жодної команди, OpenClaw відхиляє колбеки з повідомленням
  `Unauthorized: invalid command token.`
- Для private/tailnet/internal хостів колбеків Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен колбеку.
  Використовуйте значення хоста/домену, а не повні URL.
- `channels.mattermost.configWrites`: дозволяти чи забороняти записи в конфігурацію, ініційовані Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення gate за згадуванням для окремого каналу (`"*"` для значення за замовчуванням).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // необов’язкова прив’язка облікового запису
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

- `channels.signal.account`: закріпити запуск каналу за конкретною ідентичністю облікового запису Signal.
- `channels.signal.configWrites`: дозволяти чи забороняти записи в конфігурацію, ініційовані Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (на основі Plugin, налаштовується в `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // див. /channels/bluebubbles
    },
  },
}
```

- Основні шляхи ключів, які тут розглядаються: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних сеансів ACP. Використовуйте BlueBubbles handle або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повну конфігурацію каналу BlueBubbles задокументовано в [BlueBubbles](/uk/channels/bluebubbles).

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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.

- Потрібен Full Disk Access до бази даних Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб отримати список чатів.
- `cliPath` може вказувати на SSH-обгортку; установіть `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ хоста relay уже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволяти чи забороняти записи в конфігурацію, ініційовані iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сеансів ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH-обгортки для iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix підтримується розширенням і налаштовується в `channels.matrix`.

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
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S) proxy. Іменовані облікові записи можуть перевизначати його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і цей мережевий opt-in — незалежні механізми керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у багатооблікових конфігураціях.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати та нові запрошення в стилі DM ігноруються, доки ви не встановите `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: Matrix-native доставка схвалень exec і авторизація тих, хто схвалює.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto схвалення exec активуються, коли тих, хто схвалює, можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати exec-запити.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансу (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово), `"channel"` (вихідна кімната) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сеанси: `per-user` (типово) спільний за маршрутизованим peer, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки стану Matrix і live directory lookup-и використовують ту саму proxy-політику, що й runtime-трафік.
- Повну конфігурацію Matrix, правила націлювання та приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams підтримується розширенням і налаштовується в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // див. /channels/msteams
    },
  },
}
```

- Основні шляхи ключів, які тут розглядаються: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, Webhook, політика DM/груп, перевизначення для окремої команди/каналу) задокументовано в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC підтримується розширенням і налаштовується в `channels.irc`.

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

- Основні шляхи ключів, які тут розглядаються: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlists/gate за згадуваннями) задокументовано в [IRC](/uk/channels/irc).

### Багатообліковість (усі канали)

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

- `default` використовується, коли `accountId` пропущено (CLI + маршрутизація).
- Env-токени застосовуються лише до **default** облікового запису.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте не-default обліковий запис через `openclaw channels add` (або онбординг каналу), залишаючись при цьому в однообліковій конфігурації верхнього рівня для каналу, OpenClaw спершу переносить значення верхнього рівня для одного облікового запису, що залежать від облікового запису, у мапу облікових записів каналу, щоб початковий обліковий запис і надалі працював. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default ціль.
- Наявні прив’язки лише до каналу (без `accountId`) і далі відповідають default обліковому запису; прив’язки з прив’язкою до облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня для одного облікового запису, що залежать від облікового запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default ціль.

### Інші канали розширень

Багато каналів розширень налаштовуються як `channels.<id>` і задокументовані на їхніх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Див. повний індекс каналів: [Channels](/uk/channels).

### Gate за згадуваннями в групових чатах

Для групових повідомлень типово **потрібна згадка** (метадані згадки або безпечні шаблони regex). Це стосується групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

**Типи згадок:**

- **Згадки в метаданих**: нативні @-згадки платформи. Ігноруються в режимі self-chat WhatsApp.
- **Текстові шаблони**: безпечні шаблони regex у `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечні вкладені повторення ігноруються.
- Gate за згадуваннями застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Установіть `0`, щоб вимкнути.

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

Порядок визначення: перевизначення для конкретного DM → значення за замовчуванням провайдера → без ліміту (зберігається все).

Підтримується: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте власний номер до `allowFrom`, щоб увімкнути режим self-chat (ігнорує нативні @-згадки, відповідає лише на текстові шаблони):

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

### Команди (обробка команд у чаті)

```json5
{
  commands: {
    native: "auto", // реєструвати native-команди, коли це підтримується
    nativeSkills: "auto", // реєструвати native-команди Skills, коли це підтримується
    text: true, // розбирати /commands у повідомленнях чату
    bash: false, // дозволити ! (псевдонім: /bash)
    bashForegroundMs: 2000,
    config: false, // дозволити /config
    mcp: false, // дозволити /mcp
    plugins: false, // дозволити /plugins
    debug: false, // дозволити /debug
    restart: true, // дозволити /restart + інструмент перезапуску gateway
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

<Accordion title="Деталі команд">

- Цей блок налаштовує поверхні команд. Поточний каталог вбудованих + bundled команд див. у [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналу/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовано на сторінках відповідних каналів/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає native-команди для Discord/Telegram, але залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає native-команди Skills для Discord/Telegram, але залишає Slack вимкненим.
- Перевизначення для каналу: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначайте реєстрацію native-команд Skills для каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню Telegram bot.
- `bash: true` вмикає `! <cmd>` для shell хоста. Потрібно `tools.elevated.enabled` і щоб відправник був у `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів gateway `chat.send` постійні записи `/config set|unset` також вимагають `operator.admin`; доступний лише для читання `/config show` залишається доступним для звичайних клієнтів operator з правами запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, яким керує OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, встановлення та керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` керує мутаціями конфігурації для кожного каналу окремо (типово: true).
- Для багатооблікових каналів `channels.<provider>.accounts.<id>.configWrites` також керує записами, націленими на цей обліковий запис (наприклад `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску gateway. Типове значення: `true`.
- `ownerAllowFrom` — це явний список дозволених власників для команд/інструментів лише для власника. Він відокремлений від `allowFrom`.
- `ownerDisplay: "hash"` хешує ID власників у system prompt. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного provider окремо. Якщо його встановлено, це **єдине** джерело авторизації (списки дозволених каналу/spairing і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики access-group, коли `allowFrom` не встановлено.
- Мапа документації команд:
  - каталог вбудованих + bundled команд: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд, специфічні для каналу: [Channels](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди pairing: [Pairing](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Типові значення агента

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime у system prompt. Якщо не задано, OpenClaw автоматично визначає його, підіймаючись вгору від робочого простору.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов’язковий типовий список дозволених Skills для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює типові значення
      { id: "locked-down", skills: [] }, // без Skills
    ],
  },
}
```

- Пропустіть `agents.defaults.skills`, щоб типово не обмежувати Skills.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Установіть `agents.list[].skills: []`, щоб не дозволяти жодних Skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів робочого простору (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли робочого простору додаються до system prompt. Типове значення: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторне додавання bootstrap робочого простору, зменшуючи розмір prompt. Запуски Heartbeat і повторні спроби після Compaction усе одно перебудовують контекст.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на один bootstrap-файл робочого простору перед обрізанням. Типове значення: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що додаються з усіх bootstrap-файлів робочого простору. Типове значення: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізано.
Типове значення: `"once"`.

- `"off"`: ніколи не додавати текст попередження до system prompt.
- `"once"`: додавати попередження один раз для кожного унікального сигнатурного випадку обрізання (рекомендовано).
- `"always"`: додавати попередження під час кожного запуску, коли існує обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Мапа власників бюджету контексту

OpenClaw має кілька великих бюджетів prompt/контексту, і вони
навмисно розділені за підсистемами, а не проходять через один універсальний
параметр.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  звичайне додавання bootstrap робочого простору.
- `agents.defaults.startupContext.*`:
  одноразова стартова преамбула для `/new` і `/reset`, включно з останніми
  щоденними файлами `memory/*.md`.
- `skills.limits.*`:
  компактний список Skills, що додається до system prompt.
- `agents.defaults.contextLimits.*`:
  обмежені уривки runtime і додані блоки, що належать runtime.
- `memory.qmd.limits.*`:
  розміри фрагментів індексованого пошуку пам’яті та їх додавання.

Використовуйте відповідне перевизначення для окремого агента лише тоді, коли одному агенту потрібен інший
бюджет:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Керує стартовою преамбулою першого ходу, яка додається в запусках простих `/new` і `/reset`.

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

Спільні типові значення для обмежених поверхонь runtime-контексту.

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

- `memoryGetMaxChars`: типова межа уривка `memory_get` перед додаванням
  метаданих обрізання та повідомлення про продовження.
- `memoryGetDefaultLines`: типове вікно рядків `memory_get`, коли `lines`
  пропущено.
- `toolResultMaxChars`: активна межа результату інструмента, яка використовується для збережених результатів і
  відновлення після переповнення.
- `postCompactionMaxChars`: межа уривка AGENTS.md, яка використовується під час оновлювального додавання після Compaction.

#### `agents.list[].contextLimits`

Перевизначення для окремого агента для спільних параметрів `contextLimits`. Пропущені поля успадковуються
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

Глобальна межа для компактного списку Skills, що додається до system prompt. Це
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

Перевизначення для бюджету prompt Skills для окремого агента.

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

Максимальний розмір у пікселях для найдовшої сторони зображення в блоках зображень transcript/tool перед викликами provider.
Типове значення: `1200`.

Менші значення зазвичай зменшують використання vision-token і розмір payload запиту для запусків із великою кількістю знімків екрана.
Більші значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту system prompt (не для часових міток повідомлень). Якщо не задано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в system prompt. Типове значення: `auto` (параметр ОС).

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
        primary: "openai/gpt-image-1",
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
      params: { cacheRetention: "long" }, // глобальні типові параметри provider
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, наприклад codex
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
  - Форма об’єкта задає основну модель плюс впорядковані моделі для failover.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація vision-model.
  - Також використовується для резервної маршрутизації, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею інструмента/Plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-1` для OpenAI Images.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію/API key provider (наприклад `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` для `openai/*`, `FAL_KEY` для `fal/*`).
  - Якщо значення пропущено, `image_generate` усе одно може визначити типове значення provider з підтримкою автентифікації. Спочатку він пробує поточного типового provider, потім решту зареєстрованих provider генерації зображень у порядку provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо значення пропущено, `music_generate` усе одно може визначити типове значення provider з підтримкою автентифікації. Спочатку він пробує поточного типового provider, потім решту зареєстрованих provider генерації музики в порядку provider-id.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію/API key provider.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо значення пропущено, `video_generate` усе одно може визначити типове значення provider з підтримкою автентифікації. Спочатку він пробує поточного типового provider, потім решту зареєстрованих provider генерації відео в порядку provider-id.
  - Якщо ви вибираєте provider/model напряму, також налаштуйте відповідну автентифікацію/API key provider.
  - Bundled provider генерації відео Qwen підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд і параметри рівня provider `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо значення пропущено, інструмент PDF повертається до `imageModel`, а потім до визначеної моделі сеансу/типової моделі.
- `pdfMaxBytesMb`: типове обмеження розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, що враховуються в режимі резервного вилучення для інструмента `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типове значення: `"off"`.
- `elevatedDefault`: типовий рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типове значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад `openai/gpt-5.4`). Якщо ви пропускаєте provider, OpenClaw спочатку пробує alias, потім унікальний збіг exact model id серед налаштованих provider, і лише потім повертається до налаштованого типового provider (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей provider більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого provider/model замість того, щоб показувати застаріле типове значення видаленого provider.
- `models`: налаштований каталог моделей і список дозволених для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для provider, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: глобальні типові параметри provider, які застосовуються до всіх моделей. Задаються в `agents.defaults.params` (наприклад `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), потім `agents.list[].params` (відповідний id агента) перевизначає за ключем. Докладно див. [Prompt Caching](/uk/reference/prompt-caching).
- `embeddedHarness`: типова політика низькорівневого runtime вбудованого агента. Використовуйте `runtime: "auto"`, щоб дозволити зареєстрованим harness Plugin перехоплювати підтримувані моделі, `runtime: "pi"`, щоб примусово використовувати вбудований harness PI, або зареєстрований id harness, наприклад `runtime: "codex"`. Установіть `fallback: "none"`, щоб вимкнути автоматичний резервний перехід до PI.
- Засоби запису конфігурації, які змінюють ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об’єкта й, за можливості, зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сеансами (кожен сеанс усе одно серіалізований). Типове значення: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` керує тим, який низькорівневий виконавець обробляє ходи вбудованого агента.
У більшості розгортань слід залишити типове значення `{ runtime: "auto", fallback: "pi" }`.
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
- `fallback`: `"pi"` або `"none"`. `"pi"` зберігає вбудований harness PI як сумісний резервний варіант. `"none"` призводить до помилки у випадку відсутнього або непідтримуваного вибору harness Plugin замість тихого використання PI.
- Перевизначення через середовище: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` перевизначає `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` вимикає резервний перехід до PI для цього процесу.
- Для розгортань лише з Codex установіть `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` і `embeddedHarness.fallback: "none"`.
- Це керує лише embedded chat harness. Генерація медіа, vision, PDF, музика, відео й TTS, як і раніше, використовують свої налаштування provider/model.

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

Моделі Z.AI GLM-4.x автоматично вмикають режим thinking, якщо ви не встановите `--thinking off` або самі не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 типово використовується thinking `adaptive`, якщо не задано явний рівень thinking.

### `agents.defaults.cliBackends`

Необов’язкові CLI-бекенди для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API provider зазнають збою.

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
- Сеанси підтримуються, коли задано `sessionArg`.
- Передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.systemPromptOverride`

Замінює весь system prompt, зібраний OpenClaw, фіксованим рядком. Задається на типовому рівні (`agents.defaults.systemPromptOverride`) або для окремого агента (`agents.list[].systemPromptOverride`). Значення для окремого агента мають пріоритет; порожнє значення або значення лише з пробілів ігнорується. Корисно для контрольованих експериментів із prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Періодичні запуски Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m вимикає
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // типово: true; false прибирає розділ Heartbeat із system prompt
        lightContext: false, // типово: false; true залишає лише HEARTBEAT.md із bootstrap-файлів робочого простору
        isolatedSession: false, // типово: false; true запускає кожен heartbeat у новому сеансі (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (типово) | block
        target: "none", // типово: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). Типове значення: `30m` (автентифікація API-key) або `1h` (автентифікація OAuth). Установіть `0m`, щоб вимкнути.
- `includeSystemPromptSection`: коли false, прибирає розділ Heartbeat із system prompt і пропускає додавання `HEARTBEAT.md` до bootstrap-контексту. Типове значення: `true`.
- `suppressToolErrorWarnings`: коли true, пригнічує payload-и попереджень про помилки інструментів під час запусків heartbeat.
- `timeoutSeconds`: максимальний час у секундах, дозволений для одного ходу агента heartbeat перед його перериванням. Якщо не задано, використовується `agents.defaults.timeoutSeconds`.
- `directPolicy`: політика прямої доставки/DM. `allow` (типово) дозволяє доставку за прямою ціллю. `block` пригнічує доставку за прямою ціллю та генерує `reason=dm-blocked`.
- `lightContext`: коли true, запуски heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів робочого простору.
- `isolatedSession`: коли true, кожен heartbeat запускається в новому сеансі без попередньої історії розмови. Такий самий шаблон ізоляції, як у Cron `sessionTarget: "isolated"`. Зменшує вартість токенів на один heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, Heartbeat запускаються **лише для цих агентів**.
- Heartbeat виконують повні ходи агента — коротші інтервали спалюють більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id зареєстрованого Plugin provider для Compaction (необов’язково)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Точно зберігайте ідентифікатори розгортання, ідентифікатори тікетів і пари host:port.", // використовується, коли identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторне додавання
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для Compaction
        notifyUser: true, // надсилати короткі сповіщення, коли Compaction починається та завершується (типово: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Сеанс наближається до Compaction. Збережіть тривалі спогади зараз.",
          prompt: "Запишіть будь-які тривалі нотатки в memory/YYYY-MM-DD.md; дайте точну тиху відповідь токеном NO_REPLY, якщо зберігати нічого.",
        },
      },
    },
  },
}
```

- `mode`: `default` або `safeguard` (підсумовування частинами для довгих історій). Див. [Compaction](/uk/concepts/compaction).
- `provider`: id зареєстрованого Plugin provider для Compaction. Якщо задано, замість вбудованого підсумовування LLM викликається `summarize()` цього provider. У разі збою повертається до вбудованого варіанта. Установлення provider примусово вмикає `mode: "safeguard"`. Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволених для однієї операції Compaction, після чого OpenClaw перериває її. Типове значення: `900`.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає вбудовані вказівки щодо збереження непрозорих ідентифікаторів на початку підсумовування Compaction.
- `identifierInstructions`: необов’язковий власний текст щодо збереження ідентифікаторів, який використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов’язкові назви секцій H2/H3 з AGENTS.md, які повторно додаються після Compaction. Типово `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторне додавання. Якщо значення не задано або явно задано цю типову пару, старіші заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування Compaction. Використовуйте це, якщо основний сеанс має залишатися на одній моделі, а підсумки Compaction — виконуватися на іншій; якщо значення не задано, Compaction використовує основну модель сеансу.
- `notifyUser`: коли `true`, надсилає користувачеві короткі сповіщення, коли Compaction починається і коли він завершується (наприклад, «Compacting context...» і «Compaction complete»). Типово вимкнено, щоб Compaction залишався тихим.
- `memoryFlush`: тихий агентний хід перед автоматичним Compaction для збереження тривалих спогадів. Пропускається, коли робочий простір доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** з контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сеансу на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // тривалість (ms/s/m/h), типова одиниця: хвилини
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Вміст старого результату інструмента очищено]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Поведінка режиму cache-ttl">

- `mode: "cache-ttl"` вмикає проходи обрізання.
- `ttl` керує тим, як часто обрізання може запускатися знову (після останнього торкання кешу).
- Обрізання спочатку м’яко скорочує завеликі результати інструментів, а потім, якщо потрібно, повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок і кінець та вставляє посередині `...`.

**Повне очищення** замінює весь результат інструмента заповнювачем.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Докладніше про поведінку див. у [Session Pruning](/uk/concepts/session-pruning).

### Потокова передача блоками

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (використовуйте minMs/maxMs)
    },
  },
}
```

- Для каналів, відмінних від Telegram, потрібно явно задати `*.blockStreaming: true`, щоб увімкнути відповіді блоками.
- Перевизначення для каналу: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих облікових записів). Для Signal/Slack/Discord/Google Chat типово `minChars: 1500`.
- `humanDelay`: випадкова пауза між блоками відповіді. `natural` = 800–2500 мс. Перевизначення для окремого агента: `agents.list[].humanDelay`.

Докладніше про поведінку та деталі розбиття див. у [Streaming](/uk/concepts/streaming).

### Індикатори набору

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

- Типові значення: `instant` для прямих чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для сеансу: `session.typingMode`, `session.typingIntervalSeconds`.

Див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкове пісочницювання для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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
          // Також підтримуються SecretRef / inline-вміст:
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

<Accordion title="Деталі sandbox">

**Backend:**

- `docker`: локальний runtime Docker (типово)
- `ssh`: загальний віддалений runtime на основі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, налаштування, специфічні для runtime, переміщуються до
`plugins.entries.openshell.config`.

**Конфігурація backend SSH:**

- `target`: ціль SSH у формі `user@host[:port]`
- `command`: команда клієнта SSH (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, що використовується для робочих просторів за scope
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: inline-вміст або SecretRef, які OpenClaw матеріалізує у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хостів OpenSSH

**Пріоритет автентифікації SSH:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного знімка runtime секретів до початку сеансу sandbox

**Поведінка backend SSH:**

- один раз ініціалізує віддалений робочий простір після створення або повторного створення
- потім зберігає віддалений робочий простір SSH як канонічний
- маршрутизує `exec`, файлові інструменти та шляхи до медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує контейнерів browser у sandbox

**Доступ до робочого простору:**

- `none`: робочий простір sandbox за scope у `~/.openclaw/sandboxes`
- `ro`: робочий простір sandbox у `/workspace`, робочий простір агента змонтовано лише для читання в `/agent`
- `rw`: робочий простір агента змонтовано для читання/запису в `/workspace`

**Scope:**

- `session`: окремий контейнер + робочий простір для сеансу
- `agent`: один контейнер + робочий простір на агента (типово)
- `shared`: спільний контейнер і робочий простір (без ізоляції між сеансами)

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
          gateway: "lab", // необов’язково
          gatewayEndpoint: "https://lab.example", // необов’язково
          policy: "strict", // необов’язковий id політики OpenShell
          providers: ["openai"], // необов’язково
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: ініціалізує віддалений простір із локального перед exec, синхронізує назад після exec; локальний робочий простір залишається канонічним
- `remote`: ініціалізує віддалений простір один раз під час створення sandbox, потім зберігає віддалений робочий простір канонічним

У режимі `remote` локальні зміни на хості, зроблені поза OpenClaw, не синхронізуються в sandbox автоматично після кроку ініціалізації.
Транспорт — SSH до sandbox OpenShell, але Plugin керує життєвим циклом sandbox і необов’язковою синхронізацією mirror.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує вихідного мережевого доступу, кореня з можливістю запису, користувача root.

**Для контейнерів типово використовується `network: "none"`** — установіть `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихідний доступ.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (режим break-glass).

**Вхідні вкладення** розміщуються в `media/inbound/*` у активному робочому просторі.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки для окремого агента об’єднуються.

**Browser у sandbox** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC додається до system prompt. Не вимагає `browser.enabled` в `openclaw.json`.
Доступ спостерігача через noVNC типово використовує автентифікацію VNC, а OpenClaw видає URL із короткоживучим токеном (замість розкриття пароля у спільному URL).

- `allowHostControl: false` (типово) блокує націлювання сеансів у sandbox на browser хоста.
- `network` типово має значення `openclaw-sandbox-browser` (виділена bridge-мережа). Установлюйте `bridge` лише тоді, коли вам явно потрібна глобальна підключеність bridge.
- `cdpSourceRange` за потреби обмежує вхідний CDP на межі контейнера до діапазону CIDR (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер browser у sandbox. Якщо задано (включно з `[]`), він замінює `docker.binds` для контейнера browser.
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
  - `--disable-extensions` (типово ввімкнено)
  - `--disable-3d-apis`, `--disable-software-rasterizer` і `--disable-gpu`
    типово ввімкнені й можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо для використання WebGL/3D це потрібно.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає розширення, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типове обмеження процесів Chromium.
  - а також `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для образу контейнера; щоб змінити типові параметри контейнера, використовуйте власний
    образ browser із власним entrypoint.

</Accordion>

Пісочницювання browser і `sandbox.docker.binds` підтримуються лише для Docker.

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
        model: "anthropic/claude-opus-4-6", // або { primary, fallbacks }
        thinkingDefault: "high", // перевизначення рівня thinking для окремого агента
        reasoningDefault: "on", // перевизначення видимості reasoning для окремого агента
        fastModeDefault: false, // перевизначення fast mode для окремого агента
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // перевизначає ключі відповідних defaults.models params
        skills: ["docs-search"], // замінює agents.defaults.skills, якщо задано
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
- `default`: якщо задано кілька, перший має пріоритет (записується попередження). Якщо не задано жодного, типовим стає перший елемент списку.
- `model`: форма рядка перевизначає лише `primary`; форма об’єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback). Cron-завдання, які перевизначають лише `primary`, усе одно успадковують типові fallback, якщо ви не задасте `fallbacks: []`.
- `params`: параметри потоку для окремого агента, що зливаються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень, таких як `cacheRetention`, `temperature` або `maxTokens`, без дублювання всього каталогу моделей.
- `skills`: необов’язковий список дозволених Skills для окремого агента. Якщо пропущено, агент успадковує `agents.defaults.skills`, якщо їх задано; явний список замінює типові значення замість злиття, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для окремого агента (`off | minimal | low | medium | high | xhigh | adaptive`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення для повідомлення або сеансу.
- `reasoningDefault`: необов’язкове типове значення видимості reasoning для окремого агента (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning для повідомлення або сеансу.
- `fastModeDefault`: необов’язкове типове значення fast mode для окремого агента (`true | false`). Застосовується, коли не задано перевизначення fast mode для повідомлення або сеансу.
- `embeddedHarness`: необов’язкове перевизначення політики низькорівневого harness для окремого агента. Використовуйте `{ runtime: "codex", fallback: "none" }`, щоб зробити один агент лише Codex, тоді як інші агенти зберігатимуть типовий fallback до PI.
- `runtime`: необов’язковий дескриптор runtime для окремого агента. Використовуйте `type: "acp"` із типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сеанси harness ACP.
- `identity.avatar`: шлях відносно робочого простору, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених id агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Захист успадкування sandbox: якщо сеанс-запитувач працює в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б поза sandbox.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (примушує явний вибір профілю; типово: false).

---

## Маршрутизація між агентами

Запускайте кількох ізольованих агентів в одному Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

### Поля відповідності прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній type типово означає route), `acp` для постійних прив’язок розмов ACP.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = типовий обліковий запис)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для каналу)
- `acp` (необов’язково; лише для записів `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок відповідності:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на рівні всього каналу)
6. Типовий агент

У межах кожного рівня перший відповідний запис `bindings` має пріоритет.

Для записів `type: "acp"` OpenClaw виконує визначення за точною ідентичністю розмови (`match.channel` + обліковий запис + `match.peer.id`) і не використовує наведений вище порядок рівнів прив’язок route.

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

<Accordion title="Інструменти й робочий простір лише для читання">

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

## Сеанс

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
    parentForkMaxTokens: 100000, // пропускати fork батьківського потоку вище цього ліміту токенів (0 вимикає)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // тривалість або false
      maxDiskBytes: "500mb", // необов’язковий жорсткий бюджет
      highWaterBytes: "400mb", // необов’язкова ціль очищення
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // типове автоматичне зняття фокуса через неактивність у годинах (`0` вимикає)
      maxAgeHours: 0, // типовий жорсткий максимальний вік у годинах (`0` вимикає)
    },
    mainKey: "main", // застаріле (runtime завжди використовує "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Деталі полів сеансу">

- **`scope`**: базова стратегія групування сеансів для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольований сеанс у межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують один сеанс (використовуйте лише тоді, коли спільний контекст справді задумано).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM спільно використовують головний сеанс.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція для кожної пари канал + відправник (рекомендовано для вхідних скриньок із кількома користувачами).
  - `per-account-channel-peer`: ізоляція для кожної комбінації обліковий запис + канал + відправник (рекомендовано для багатообліковості).
- **`identityLinks`**: зіставляє канонічні id з peer-ідентифікаторами з префіксом provider для спільного використання сеансів між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва варіанти, спрацьовує той, що настає раніше.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` батьківського сеансу, дозволене під час створення forked-сеансу потоку (типово `100000`).
  - Якщо `totalTokens` батьківського сеансу перевищує це значення, OpenClaw запускає новий сеанс потоку замість успадкування історії транскрипту батьківського сеансу.
  - Установіть `0`, щоб вимкнути цей запобіжник і завжди дозволяти forking від батьківського сеансу.
- **`mainKey`**: застаріле поле. Runtime завжди використовує `"main"` для головного прямого кошика чату.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість ходів відповіді назад між агентами під час обмінів агент-до-агента (ціле число, діапазон: `0`–`5`). `0` вимикає ланцюжок ping-pong.
- **`sendPolicy`**: відповідність за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перший deny має пріоритет.
- **`maintenance`**: очищення сховища сеансів + керування зберіганням.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: ротує `sessions.json`, коли він перевищує цей розмір (типово `10mb`).
  - `resetArchiveRetention`: термін зберігання архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий жорсткий бюджет дискового простору для каталогу сеансів. У режимі `warn` це журналює попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сеанси.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово дорівнює `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сеансів, прив’язаних до потоків.
  - `enabled`: головний типовий перемикач (provider-и можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне зняття фокуса через неактивність у годинах (`0` вимикає; provider-и можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; provider-и можуть перевизначати)

</Accordion>

---

## Повідомлення

```json5
{
  messages: {
    responsePrefix: "🦞", // або "auto"
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
      debounceMs: 2000, // 0 вимикає
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Префікс відповіді

Перевизначення для каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Визначення (найспецифічніше має пріоритет): обліковий запис → канал → глобальне значення. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Змінні шаблону:**

| Змінна           | Опис                   | Приклад                     |
| ---------------- | ---------------------- | --------------------------- |
| `{model}`        | Коротка назва моделі   | `claude-opus-4-6`           |
| `{modelFull}`    | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`     | Назва provider         | `anthropic`                 |
| `{thinkingLevel}`| Поточний рівень thinking | `high`, `low`, `off`      |
| `{identity.name}`| Назва identity агента  | (те саме, що `"auto"`)      |

Змінні нечутливі до регістру. `{think}` є alias для `{thinkingLevel}`.

### Реакція підтвердження

- Типово береться з `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: обліковий запис → канал → `messages.ackReaction` → резервне значення з identity.
- Scope: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: прибирає підтвердження після відповіді у Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо значення не задано, реакції статусу залишаються ввімкненими, коли активні реакції підтвердження.
  У Telegram установіть це явно в `true`, щоб увімкнути реакції статусу життєвого циклу.

### Debounce вхідних повідомлень

Об’єднує швидкі текстові повідомлення від одного й того самого відправника в один хід агента. Медіа/вкладення скидаються негайно. Керувальні команди обходять debounce.

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

- `auto` керує типовим режимом auto-TTS: `off`, `always`, `inbound` або `tagged`. `/tts on|off` може перевизначати локальні налаштування, а `/tts status` показує фактичний стан.
- `summaryModel` перевизначає `agents.defaults.model.primary` для автоматичного підсумку.
- `modelOverrides` типово ввімкнено; `modelOverrides.allowProvider` типово має значення `false` (opt-in).
- API key повертаються до `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на endpoint, відмінний від OpenAI, OpenClaw трактує його як OpenAI-compatible TTS-сервер і послаблює валідацію model/voice.

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

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька Talk provider.
- Застарілі пласкі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності й автоматично мігруються до `talk.providers.<provider>`.
- Для Voice ID резервними значеннями є `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті рядки або об’єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли ключ API Talk не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні назви.
- `silenceTimeoutMs` керує тим, скільки часу режим Talk чекає після тиші користувача, перш ніж надіслати транскрипт. Якщо значення не задано, зберігається типове вікно паузи платформи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий список дозволених перед `tools.allow`/`tools.deny`:

Локальний онбординг типово встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явні профілі зберігаються).

| Профіль    | Містить                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`  | лише `session_status`                                                                                                          |
| `coding`   | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging`| `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`     | Без обмежень (те саме, що не задано)                                                                                           |

### Групи інструментів

| Група              | Інструменти                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як alias для `exec`)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                   |
| `group:automation` | `cron`, `gateway`                                                                                                     |
| `group:messaging`  | `message`                                                                                                             |
| `group:nodes`      | `nodes`                                                                                                               |
| `group:agents`     | `agents_list`                                                                                                         |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                    |
| `group:openclaw`   | Усі вбудовані інструменти (без provider Plugin)                                                                       |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (deny має пріоритет). Нечутлива до регістру, підтримує wildcard `*`. Застосовується навіть тоді, коли Docker sandbox вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для конкретних provider або моделей. Порядок: базовий профіль → профіль provider → allow/deny.

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
- `/elevated on|off|ask|full` зберігає стан для кожного сеансу; inline-директиви застосовуються до одного повідомлення.
- Elevated `exec` обходить sandbox і використовує налаштований escape path (`gateway` типово або `node`, коли ціль exec — `node`).

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

Перевірки безпеки циклів інструментів **типово вимкнені**. Установіть `enabled: true`, щоб увімкнути виявлення.
Налаштування можна визначати глобально в `tools.loopDetection` і перевизначати для окремого агента в `agents.list[].tools.loopDetection`.

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
- `warningThreshold`: поріг повторюваного патерну без прогресу для попереджень.
- `criticalThreshold`: вищий поріг повторення для блокування критичних циклів.
- `globalCircuitBreakerThreshold`: жорсткий поріг зупинки для будь-якого запуску без прогресу.
- `detectors.genericRepeat`: попереджати про повторні виклики одного й того самого інструмента з однаковими аргументами.
- `detectors.knownPollNoProgress`: попереджати/блокувати відомі poll-інструменти (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати чергувальні патерни пар без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, валідація завершується помилкою.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // або env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // необов’язково; пропустіть для auto-detect
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

Налаштовує розуміння вхідних медіа (зображення/аудіо/відео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: надсилати завершені асинхронні music/video безпосередньо в канал
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

<Accordion title="Поля запису моделі медіа">

**Запис provider** (`type: "provider"` або пропущено):

- `provider`: id API provider (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення id моделі
- `profile` / `preferredProfile`: вибір профілю `auth-profiles.json`

**Запис CLI** (`type: "cli"`):

- `command`: виконуваний файл для запуску
- `args`: шаблонізовані аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов’язковий список (`image`, `audio`, `video`). Типові значення: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
- У разі помилки використовується наступний запис.

Автентифікація provider дотримується стандартного порядку: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Поля асинхронного завершення:**

- `asyncCompletion.directSend`: коли `true`, завершені асинхронні завдання `music_generate`
  і `video_generate` спершу намагаються доставлятися прямо в канал. Типове значення: `false`
  (застарілий шлях пробудження сеансу запитувача/доставки моделі).

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

Керує тим, на які сеанси можуть націлюватися інструменти сеансів (`sessions_list`, `sessions_history`, `sessions_send`).

Типове значення: `tree` (поточний сеанс + сеанси, породжені ним, наприклад subagents).

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

- `self`: лише ключ поточного сеансу.
- `tree`: поточний сеанс + сеанси, породжені поточним сеансом (subagents).
- `agent`: будь-який сеанс, що належить поточному id агента (може включати інших користувачів, якщо ви запускаєте сеанси per-sender під тим самим id агента).
- `all`: будь-який сеанс. Націлювання між агентами все одно вимагає `tools.agentToAgent`.
- Обмеження sandbox: коли поточний сеанс працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibility примусово встановлюється на `tree`, навіть якщо `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Керує підтримкою inline-вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: установіть true, щоб дозволити inline-вкладення файлів
        maxTotalBytes: 5242880, // 5 MB сумарно для всіх файлів
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB на файл
        retainOnSessionKeep: false, // зберігати вкладення, коли cleanup="keep"
      },
    },
  },
}
```

Примітки:

- Вкладення підтримуються лише для `runtime: "subagent"`. Runtime ACP їх відхиляє.
- Файли матеріалізуються в дочірньому робочому просторі в `.openclaw/attachments/<uuid>/` разом із `.manifest.json`.
- Вміст вкладень автоматично редагується в збереженні транскрипту.
- Входи Base64 перевіряються з суворими перевірками алфавіту/відступів і захистом розміру до декодування.
- Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
- Очищення підпорядковується політиці `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.

### `tools.experimental`

Прапорці експериментальних вбудованих інструментів. Типово вимкнено, якщо не спрацьовує правило автоувімкнення strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // увімкнути експериментальний update_plan
    },
  },
}
```

Примітки:

- `planTool`: вмикає структурований інструмент `update_plan` для відстеження нетривіальної багатокрокової роботи.
- Типове значення: `false`, якщо тільки `agents.defaults.embeddedPi.executionContract` (або перевизначення для окремого агента) не встановлено на `"strict-agentic"` для запуску OpenAI або OpenAI Codex сімейства GPT-5. Установіть `true`, щоб примусово ввімкнути інструмент поза цією областю, або `false`, щоб залишити його вимкненим навіть для запусків strict-agentic GPT-5.
- Коли увімкнено, system prompt також додає вказівки щодо використання, щоб модель застосовувала його лише для суттєвої роботи й тримала не більше одного кроку в стані `in_progress`.

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

- `model`: типова модель для породжених sub-agents. Якщо значення пропущено, sub-agents успадковують модель викликача.
- `allowAgents`: типовий список дозволених цільових id агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли у виклику інструмента пропущено `runTimeoutSeconds`. `0` означає відсутність тайм-ауту.
- Політика інструментів для subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Користувацькі provider і base URL

OpenClaw використовує вбудований каталог моделей. Додавайте користувацьких provider через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (типово) | replace
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
- Перевизначайте корінь конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий псевдонім змінної середовища).
- Пріоритет злиття для відповідних id provider:
  - Непорожні значення `baseUrl` з agent `models.json` мають пріоритет.
  - Непорожні значення `apiKey` агента мають пріоритет лише тоді, коли цим provider не керує SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` provider, якими керує SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env-ref, `secretref-managed` для file/exec-ref) замість збереження розв’язаних секретів.
  - Значення заголовків provider, якими керує SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env-ref, `secretref-managed` для file/exec-ref).
  - Порожні або відсутні `apiKey`/`baseUrl` агента повертаються до `models.providers` у конфігурації.
  - Для відповідних моделей `contextWindow`/`maxTokens` використовують вище значення між явною конфігурацією та неявними значеннями каталогу.
  - Для відповідних моделей `contextTokens` зберігає явне обмеження runtime, коли воно присутнє; використовуйте це, щоб обмежити фактичний контекст без зміни нативних метаданих моделі.
  - Використовуйте `models.mode: "replace"`, якщо хочете, щоб конфігурація повністю переписувала `models.json`.
  - Збереження маркерів є джерельно-авторитетним: маркери записуються з активного знімка конфігурації джерела (до розв’язання), а не з розв’язаних runtime-значень секретів.

### Деталі полів provider

- `models.mode`: поведінка каталогу provider (`merge` або `replace`).
- `models.providers`: мапа користувацьких provider, ключована за id provider.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані provider (надавайте перевагу SecretRef/env substitution).
- `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` додавати `options.num_ctx` у запити (типово: `true`).
- `models.providers.*.authHeader`: примусово передавати облікові дані в заголовку `Authorization`, коли це потрібно.
- `models.providers.*.baseUrl`: базовий URL висхідного API.
- `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації proxy/tenant.
- `models.providers.*.request`: перевизначення транспорту для HTTP-запитів provider моделі.
  - `request.headers`: додаткові заголовки (зливаються з типовими значеннями provider). Значення приймають SecretRef.
  - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію provider), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов’язковим `prefix`).
  - `request.proxy`: перевизначення HTTP proxy. Режими: `"env-proxy"` (використовувати env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов’язковий підоб’єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTPS до `baseUrl`, якщо DNS розв’язується у приватні, CGNAT або подібні діапазони, через захист HTTP fetch provider від SSRF (opt-in оператора для довірених самостійно розгорнутих OpenAI-compatible endpoint). WebSocket використовує той самий `request` для заголовків/TLS, але не цей SSRF-gate fetch. Типове значення `false`.
- `models.providers.*.models`: явні записи каталогу моделей provider.
- `models.providers.*.models.*.contextWindow`: метадані нативного вікна контексту моделі.
- `models.providers.*.models.*.contextTokens`: необов’язкове runtime-обмеження контексту. Використовуйте це, коли вам потрібен менший фактичний бюджет контексту, ніж нативне `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` з непорожнім ненативним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це значення в `false` під час runtime. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для OpenAI-compatible chat endpoint, які приймають лише рядки. Коли `true`, OpenClaw сплющує масиви `messages[].content`, що містять лише текст, у звичайні рядки перед надсиланням запиту.
- `plugins.entries.amazon-bedrock.config.discovery`: корінь налаштувань auto-discovery для Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр provider-id для цільового виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне вікно контексту для виявлених моделей.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для виявлених моделей.

### Приклади provider

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

Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

Установіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` приймаються як alias. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint для кодування (типово): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint визначте користувацький provider із перевизначенням base URL.

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

Нативні endpoint Moonshot оголошують сумісність використання streaming на спільному
транспорті `openai-completions`, і OpenClaw прив’язує це до можливостей endpoint
а не лише до вбудованого id provider.

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

Сумісний з Anthropic, вбудований provider. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

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

Base URL має не містити `/v1` (клієнт Anthropic додає його). Скорочення: `openclaw onboard --auth-choice synthetic-api-key`.

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

Установіть `MINIMAX_API_KEY`. Скорочення:
`openclaw onboard --auth-choice minimax-global-api` або
`openclaw onboard --auth-choice minimax-cn-api`.
Каталог моделей типово містить лише M2.7.
На Anthropic-compatible streaming-шляху OpenClaw типово вимикає thinking MiniMax,
якщо ви явно не встановите `thinking` самостійно. `/fast on` або
`params.fastMode: true` переписує `MiniMax-M2.7` на
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Локальні моделі (LM Studio)">

Див. [Local Models](/uk/gateway/local-models). Коротко: запускайте потужну локальну модель через LM Studio Responses API на серйозному обладнанні; залишайте hosted-моделі об’єднаними для fallback.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // або відкритий рядок
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: необов’язковий список дозволених лише для bundled Skills (керовані/робочі Skills не зачіпає).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: коли true, надавати перевагу інсталяторам Homebrew, якщо `brew`
  доступний, перед поверненням до інших типів інсталяторів.
- `install.nodeManager`: пріоритет node-інсталятора для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручний параметр для Skills, які оголошують основну env-змінну (відкритий рядок або об’єкт SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
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
- Виявлення приймає нативні Plugin OpenClaw, а також сумісні bundles Codex і Claude, включно з bundle Claude без manifest у типовому layout.
- **Зміни конфігурації вимагають перезапуску gateway.**
- `allow`: необов’язковий список дозволених (завантажуються лише перелічені Plugin). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле ключа API на рівні Plugin (коли це підтримується Plugin).
- `plugins.entries.<id>.env`: мапа env var для області Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` і ігнорує поля мутації prompt зі застарілого `before_agent_start`, зберігаючи при цьому застарілі `modelOverride` і `providerOverride`. Застосовується до нативних hook-ів Plugin і підтримуваних каталогів hook-ів, наданих bundle.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому Plugin запитувати перевизначення `provider` і `model` для кожного запуску фонових subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий список дозволених канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"`, лише якщо свідомо хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (перевіряється схемою нативного Plugin OpenClaw, коли вона доступна).
- `plugins.entries.firecrawl.config.webFetch`: налаштування provider вебвитягування Firecrawl.
  - `apiKey`: ключ API Firecrawl (приймає SecretRef). Повертається до `plugins.entries.firecrawl.config.webSearch.apiKey`, застарілого `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: базовий URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут scrape-запиту в секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути provider X Search.
  - `model`: модель Grok для пошуку (наприклад `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming. Див. [Dreaming](/uk/concepts/dreaming) для фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: cadence Cron для кожного повного проходу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не користувацькими ключами конфігурації).
- Повна конфігурація пам’яті міститься в [Довіднику з конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Plugin Claude bundle також можуть додавати вбудовані типові значення Pi з `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного memory Plugin або `"none"`, щоб вимкнути memory Plugin.
- `plugins.slots.contextEngine`: вибрати id активного Plugin context engine; типово `"legacy"`, якщо ви не встановите й не виберете інший engine.
- `plugins.installs`: метадані встановлення, якими керує CLI і які використовує `openclaw plugins update`.
  - Містять `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Сприймайте `plugins.installs.*` як керований стан; надавайте перевагу командам CLI замість ручного редагування.

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
      // dangerouslyAllowPrivateNetwork: true, // opt-in лише для довіреного доступу browser до приватної мережі
      // allowPrivateNetwork: true, // застарілий alias
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо значення не задано, тому навігація browser типово залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли свідомо довіряєте навігації browser у приватній мережі.
- У строгому режимі віддалені endpoint профілів CDP (`profiles.*.cdpUrl`) підлягають такому самому блокуванню приватної мережі під час перевірок досяжності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий alias.
- У строгому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі є лише attach-only (start/stop/reset вимкнено).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  коли ваш provider надає прямий DevTools WebSocket URL.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений browser Node.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль browser на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлювання через CSS-selector, hooks
  однофайлового завантаження, без перевизначень тайм-ауту діалогів, без `wait --load networkidle`,
  а також без `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Порядок auto-detect: типовий browser, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Сервіс керування: лише loopback (порт визначається з `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові прапорці запуску до локального старту Chromium (наприклад
  `--disable-gpu`, розмір вікна або debug-прапорці).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, короткий текст, URL зображення або URI data
    },
  },
}
```

- `seamColor`: колір акценту для chrome нативного UI застосунку (відтінок бульбашки Talk Mode тощо).
- `assistant`: перевизначення identity для Control UI. Якщо не задано, використовується identity активного агента.

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
      // password: "your-password", // або OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // для mode=trusted-proxy; див. /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // небезпечно: дозволити абсолютні зовнішні URL embed http(s)
      // allowedOrigins: ["https://control.example.com"], // потрібно для Control UI не на loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // небезпечний режим резервного використання Host-header origin
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
    // Необов’язково. Типове значення false.
    allowRealIpFallback: false,
    tools: {
      // Додаткові HTTP deny для /tools/invoke
      deny: ["browser"],
      // Прибрати інструменти з типового HTTP deny-списку
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

<Accordion title="Деталі полів Gateway">

- `mode`: `local` (запустити gateway) або `remote` (підключитися до віддаленого gateway). Gateway відмовляється запускатися, якщо не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі alias для bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не alias хоста (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка для Docker**: типове bind-значення `loopback` слухає `127.0.0.1` усередині контейнера. За bridge-мережі Docker (`-p 18789:18789`) трафік надходить на `eth0`, тому gateway недосяжний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Auth**: типово обов’язкова. Прив’язки не до loopback вимагають автентифікації gateway. На практиці це означає спільний token/password або reverse proxy з awareness щодо identity з `gateway.auth.mode: "trusted-proxy"`. Майстер онбордингу типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Потоки запуску й встановлення/відновлення служби завершуються помилкою, коли налаштовано обидва значення, а mode не задано.
- `gateway.auth.mode: "none"`: явний режим без auth. Використовуйте лише для довірених локальних loopback-налаштувань; цей варіант навмисно не пропонується в підказках онбордингу.
- `gateway.auth.mode: "trusted-proxy"`: делегувати auth reverse proxy з awareness щодо identity і довіряти заголовкам identity від `gateway.trustedProxies` (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **джерело proxy не з loopback**; reverse proxy на loopback на тому самому хості не задовольняють trusted-proxy auth.
- `gateway.auth.allowTailscale`: коли `true`, заголовки identity Tailscale Serve можуть задовольняти auth для Control UI/WebSocket (перевіряється через `tailscale whois`). Endpoint-и HTTP API **не** використовують цю auth за заголовками Tailscale; вони дотримуються звичайного режиму HTTP auth gateway. Цей безтокеновий потік припускає, що хост gateway є довіреним. Типово `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий лімітер невдалих спроб auth. Застосовується для кожного IP клієнта і для кожної області auth (shared-secret і device-token відстежуються окремо). Заблоковані спроби повертають `429` + `Retry-After`.
  - На асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом про збій. Тому одночасні хибні спроби від того самого клієнта можуть спрацювати на лімітер уже на другому запиті, замість того щоб обидві пройшли як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово дорівнює `true`; встановіть `false`, якщо ви свідомо хочете також лімітувати localhost-трафік (для тестових налаштувань або строгих розгортань proxy).
- Спроби auth до WS з походження browser завжди дроселюються з вимкненим звільненням для loopback (захист у глибину від brute force localhost через browser).
- На loopback такі блокування для browser-origin ізолюються для кожного нормалізованого значення `Origin`,
  тому повторні збої з одного localhost-origin не блокують автоматично
  інший origin.
- `tailscale.mode`: `serve` (лише tailnet, bind на loopback) або `funnel` (публічний доступ, вимагає auth).
- `controlUi.allowedOrigins`: явний список дозволених browser-origin для підключень WebSocket Gateway. Потрібен, коли browser-клієнти очікуються з origin, відмінних від loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне визначення origin за Host-header для розгортань, що навмисно покладаються на політику origin за Host-header.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: клієнтське break-glass-перевизначення, яке дозволяє відкритий `ws://` до довірених IP приватної мережі; типово plaintext і надалі дозволено лише для loopback.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують auth gateway.
- `gateway.push.apns.relay.baseUrl`: базовий HTTPS URL зовнішнього APNs relay, який використовують офіційні/TestFlight збірки iOS після публікації relay-backed реєстрацій до gateway. Цей URL має збігатися з URL relay, зібраним у збірці iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання gateway-to-relay у мілісекундах. Типове значення `10000`.
- Реєстрації на основі relay делегуються конкретній identity gateway. Спарений iOS-застосунок отримує `gateway.identity.get`, включає цю identity у реєстрацію relay і пересилає gateway грант надсилання, прив’язаний до реєстрації. Інший gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env-перевизначення для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: лише для розробки, аварійний виняток для loopback HTTP URL relay. URL relay у production мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал моніторингу стану каналу в хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски health-monitor. Типове значення: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте це значення більшим або рівним `gateway.channelHealthCheckMinutes`. Типове значення: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків health-monitor на канал/обліковий запис за ковзну годину. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out для окремого каналу від перезапусків health-monitor при збереженні глобального монітора.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в багатооблікових каналах. Якщо задано, має пріоритет над перевизначенням рівня каналу.
- Локальні шляхи виклику gateway можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується fail-closed (без маскування через remote fallback).
- `trustedProxies`: IP reverse proxy, які завершують TLS або додають заголовки пересланого клієнта. Перелічуйте лише proxy, якими ви керуєте. Записи loopback і далі валідні для налаштувань proxy на тому самому хості/локального виявлення (наприклад Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, gateway приймає `X-Real-IP`, якщо `X-Forwarded-For` відсутній. Типове значення `false` для поведінки fail-closed.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny-список).
- `gateway.tools.allow`: прибирає назви інструментів із типового HTTP deny-списку.

</Accordion>

### OpenAI-compatible endpoint-и

- Chat Completions: типово вимкнено. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення захисту URL-input для Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні списки allowlist трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання URL.
- Необов’язковий заголовок посилення захисту відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (установлюйте лише для HTTPS origin, якими ви керуєте; див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька gateway на одному хості з унікальними портами й каталогами стану:

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

- `enabled`: вмикає завершення TLS на listener gateway (HTTPS/WSS) (типове значення: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовані; лише для локального/dev використання.
- `certPath`: шлях файлової системи до файлу сертифіката TLS.
- `keyPath`: шлях файлової системи до файлу приватного ключа TLS; тримайте його з обмеженими правами доступу.
- `caPath`: необов’язковий шлях до CA bundle для перевірки клієнта або користувацьких ланцюгів довіри.

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
  - `"off"`: ігнорувати live-редагування; зміни вимагають явного перезапуску.
  - `"restart"`: завжди перезапускати процес gateway при зміні конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку намагатися зробити hot reload; якщо потрібно — перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час у мс очікування завершення операцій у польоті перед примусовим перезапуском (типово: `300000` = 5 хвилин).

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
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
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
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання token gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежуйте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).

**Endpoint-и:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з payload запиту приймається лише тоді, коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → визначається через `hooks.mappings`

<Accordion title="Деталі mapping">

- `match.path` відповідає підшляху після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` відповідає полю payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають значення з payload.
- `transform` може вказувати на JS/TS-модуль, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи й traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID повертаються до типового агента.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити всі, `[]` = заборонити всі).
- `defaultSessionKey`: необов’язковий фіксований ключ сеансу для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликачам `/hooks/agent` задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий список дозволених префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`.
- `deliver: true` надсилає фінальну відповідь у канал; `channel` типово дорівнює `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволений, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

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
    // enabled: false, // або OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Обслуговує HTML/CSS/JS, які агент може редагувати, і A2UI через HTTP на порту Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Для bind не на loopback: маршрути canvas вимагають auth Gateway (token/password/trusted-proxy), так само як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки auth; після pairing і підключення Node Gateway оголошує URL можливостей, прив’язані до Node, для доступу до canvas/A2UI.
- URL можливостей прив’язуються до активного WS-сеансу Node і швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload в обслуговуваний HTML.
- Автоматично створює початковий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни вимагають перезапуску gateway.
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

- `minimal` (типово): не включати `cliPath` + `sshPort` у TXT-записи.
- `full`: включати `cliPath` + `sshPort`.
- Ім’я хоста типово `openclaw`. Перевизначається через `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує зону unicast DNS-SD у `~/.openclaw/dns/`. Для виявлення між мережами поєднуйте з DNS-сервером (рекомендовано CoreDNS) + split DNS у Tailscale.

Налаштування: `openclaw dns setup --apply`.

---

## Середовище

### `env` (inline env vars)

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

- Inline env vars застосовуються лише тоді, коли в env процесу немає відповідного ключа.
- Файли `.env`: `.env` у CWD + `~/.openclaw/.env` (жоден із них не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої login shell.
- Повний порядок пріоритетів див. у [Environment](/uk/help/environment).

### Підстановка env var

Посилайтеся на env vars у будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Збігаються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні спричиняють помилку під час завантаження конфігурації.
- Екрануйте як `$${VAR}` для буквального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: відкриті значення і далі працюють.

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
- id для `source: "exec"` не повинні містити `.` або `..` як slash-delimited сегменти шляху (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [SecretRef Credential Surface](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання `auth-profiles.json` входять до runtime-розв’язання та покриття аудиту.

### Конфігурація provider секретів

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // необов’язковий явний env provider
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

- Provider `file` підтримує `mode: "json"` і `mode: "singleValue"` (у режимі singleValue значення `id` має бути `"value"`).
- Provider `exec` вимагає абсолютний шлях `command` і використовує payload-и протоколу через stdin/stdout.
- Типово символьні посилання в шляхах команд відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-симлінки, перевіряючи шлях до розв’язаного target.
- Якщо налаштовано `trustedDirs`, перевірка trusted-dir застосовується до шляху розв’язаного target.
- Дочірнє середовище `exec` типово мінімальне; явно передавайте потрібні змінні через `passEnv`.
- Посилання на секрети розв’язуються під час активації у знімок у пам’яті, після чого шляхи запитів читають лише цей знімок.
- Під час активації застосовується фільтрація активної поверхні: нерозв’язані посилання на ввімкнених поверхнях спричиняють збій startup/reload, тоді як неактивні поверхні пропускаються з діагностикою.

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
- `auth-profiles.json` підтримує посилання на рівні значення (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю auth на основі SecretRef.
- Статичні runtime-облікові дані надходять із розв’язаних знімків у пам’яті; застарілі статичні записи `auth.json` очищаються при виявленні.
- Застарілий імпорт OAuth — з `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: базовий backoff у годинах, коли профіль зазнає збою через справжні
  billing-помилки/нестачу коштів (типово: `5`). Явний текст про billing
  усе ще може потрапити сюди навіть на відповідях `401`/`403`, але
  текстові matcher-и для конкретних provider залишаються обмеженими provider-ом,
  якому вони належать (наприклад OpenRouter
  `Key limit exceeded`). Retryable HTTP `402` usage-window або
  повідомлення про ліміти витрат organization/workspace натомість залишаються у шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин billing backoff для окремих provider.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання billing backoff (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для високовпевнених збоїв `auth_permanent` (типово: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-profile того самого provider для помилок перевантаження перед переходом до fallback моделі (типово: `1`). Сюди потрапляють форми busy provider, такі як `ModelNotReadyException`.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою rotation перевантаженого provider/profile (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-profile того самого provider для помилок rate-limit перед переходом до fallback моделі (типово: `1`). До цього кошика rate-limit входить і текст, характерний для provider, як-от `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

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
- `consoleLevel` підвищується до `debug` при `--verbose`.
- `maxFileBytes`: максимальний розмір файла журналу в байтах, після якого запис пригнічується (додатне ціле число; типово: `524288000` = 500 MB). Для production-розгортань використовуйте зовнішню ротацію журналів.

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

- `enabled`: головний перемикач виводу instrumentation (типово: `true`).
- `flags`: масив рядків-прапорців, що вмикають цільовий вивід журналу (підтримує wildcard, як-от `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для виведення попереджень про завислий сеанс, поки сеанс залишається в стані обробки.
- `otel.enabled`: вмикає пайплайн експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL collector для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, що надсилаються разом із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: вмикають експорт traces, metrics або logs.
- `otel.sampleRate`: частота семплювання traces `0`–`1`.
- `otel.flushIntervalMs`: періодичний інтервал flush телеметрії в мс.
- `cacheTrace.enabled`: журналювати знімки трасування кешу для embedded-запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL трасування кешу (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід трасування кешу (усе типово: `true`).

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

- `channel`: канал релізу для npm/git-встановлень — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для package-встановлень (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автозастосуванням на stable-каналі (типово: `6`; максимум: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання для stable-каналу в годинах (типово: `12`; максимум: `168`).
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

- `enabled`: глобальний feature gate ACP (типово: `false`).
- `dispatch.enabled`: незалежний gate для dispatch ходів сеансу ACP (типово: `true`). Установіть `false`, щоб залишити команди ACP доступними, але заблокувати виконання.
- `backend`: id типового backend runtime ACP (має збігатися із зареєстрованим Plugin runtime ACP).
- `defaultAgent`: резервний id цільового агента ACP, коли spawn-и не задають явну ціль.
- `allowedAgents`: список дозволених id агентів для сеансів runtime ACP; порожній список означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сеансів ACP.
- `stream.coalesceIdleMs`: вікно idle flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір chunk перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки статусу/інструментів на хід (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік інкрементально; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, проєктованих на один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків статусу/оновлення ACP.
- `stream.tagVisibility`: запис назв tag із булевими перевизначеннями видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для worker-ів сеансів ACP до моменту, коли вони стають придатними для очищення.
- `runtime.installCommand`: необов’язкова команда встановлення для запуску під час bootstrap середовища runtime ACP.

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

- `cli.banner.taglineMode` керує стилем слогана банера:
  - `"random"` (типово): змінні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), установіть env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Метадані, які записуються керованими CLI-потоками налаштування (`onboard`, `configure`, `doctor`):

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

Див. поля identity у `agents.list` у розділі [Типові значення агента](#agent-defaults).

---

## Bridge (застаріле, видалено)

Поточні збірки більше не містять TCP bridge. Node підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація завершується помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

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
    webhook: "https://example.invalid/legacy", // застарілий fallback для збережених завдань notify:true
    webhookToken: "replace-with-dedicated-token", // необов’язковий bearer token для вихідної auth webhook
    sessionRetention: "24h", // рядок тривалості або false
    runLog: {
      maxBytes: "2mb", // типово 2_000_000 байтів
      keepLines: 2000, // типово 2000
    },
  },
}
```

- `sessionRetention`: як довго зберігати завершені ізольовані сеанси запуску cron перед очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів cron. Типове значення: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу на запуск (`cron/runs/<jobId>.jsonl`) перед очищенням. Типове значення: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, що зберігаються, коли запускається очищення журналу запуску. Типове значення: `2000`.
- `webhookToken`: bearer token, який використовується для POST-доставки webhook cron (`delivery.mode = "webhook"`); якщо значення пропущено, заголовок auth не надсилається.
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

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань при тимчасових помилках (типово: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, що запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати для всіх тимчасових типів.

Застосовується лише до одноразових cron-завдань. Повторювані завдання використовують окрему обробку збоїв.

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

- `enabled`: увімкнути сповіщення про збої для cron-завдань (типово: `false`).
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мінімум: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` виконує POST на налаштований webhook.
- `accountId`: необов’язковий id облікового запису або каналу для обмеження доставки сповіщення.

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

- Типова ціль для сповіщень про збої cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; типово `"announce"`, коли є достатньо даних про ціль.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL webhook. Обов’язково для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не задано ні глобальної, ні цілі збоїв для окремого завдання, завдання, які вже доставляють через `announce`, при збої повертаються до цієї основної announce-цілі.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не дорівнює `"webhook"`.

Див. [Cron Jobs](/uk/automation/cron-jobs). Ізольовані виконання cron відстежуються як [background tasks](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблону, які розгортаються в `tools.media.models[].args`:

| Змінна            | Опис                                              |
| ----------------- | ------------------------------------------------- |
| `{{Body}}`        | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`     | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}`| Тіло без згадок у групі                           |
| `{{From}}`        | Ідентифікатор відправника                         |
| `{{To}}`          | Ідентифікатор призначення                         |
| `{{MessageSid}}`  | id повідомлення каналу                            |
| `{{SessionId}}`   | UUID поточного сеансу                             |
| `{{IsNewSession}}`| `"true"`, коли створено новий сеанс              |
| `{{MediaUrl}}`    | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`   | Локальний шлях до медіа                           |
| `{{MediaType}}`   | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`  | Транскрипт аудіо                                  |
| `{{Prompt}}`      | Розв’язаний media prompt для CLI-записів          |
| `{{MaxChars}}`    | Розв’язана максимальна кількість символів виводу для CLI-записів |
| `{{ChatType}}`    | `"direct"` або `"group"`                          |
| `{{GroupSubject}}`| Тема групи (best effort)                          |
| `{{GroupMembers}}`| Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`  | Відображуване ім’я відправника (best effort)      |
| `{{SenderE164}}`  | Номер телефону відправника (best effort)          |
| `{{Provider}}`    | Підказка provider (`whatsapp`, `telegram`, `discord` тощо) |

---

## Include конфігурації (`$include`)

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

- Один файл: замінює об’єкт, у якому міститься.
- Масив файлів: deep-merge у заданому порядку (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів глибини.
- Шляхи: розв’язуються відносно файлу, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` для `openclaw.json`). Абсолютні форми/`../` дозволені лише тоді, коли після розв’язання вони все одно залишаються в межах цього кордону.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок парсингу та циклічних include.

---

_Пов’язане: [Configuration](/uk/gateway/configuration) · [Configuration Examples](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_
