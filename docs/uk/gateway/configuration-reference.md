---
read_when:
    - Вам потрібна точна семантика або значення за замовчуванням для окремих полів конфігурації
    - Ви перевіряєте блоки конфігурації каналів, моделей, gateway або інструментів
summary: Повний довідник для кожного ключа конфігурації OpenClaw, значень за замовчуванням і налаштувань каналів
title: Довідник з конфігурації
x-i18n:
    generated_at: "2026-04-06T02:29:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 266cbb43d9a4b4a3e8839dc8bc6c6d06382ecbbe33210c702f7699b47988123d
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Довідник з конфігурації

Кожне поле, доступне в `~/.openclaw/openclaw.json`. Огляд, орієнтований на задачі, див. у [Configuration](/uk/gateway/configuration).

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов'язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх пропущено.

---

## Канали

Кожен канал запускається автоматично, коли існує його секція конфігурації (якщо не вказано `enabled: false`).

### Доступ до приватних повідомлень і груп

Усі канали підтримують політики для приватних повідомлень і політики для груп:

| Політика DM         | Поведінка                                                     |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код pairing; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або у сховищі дозволів paired) |
| `open`              | Дозволити всі вхідні приватні повідомлення (потрібно `allowFrom: ["*"]`) |
| `disabled`          | Ігнорувати всі вхідні приватні повідомлення                   |

| Політика груп         | Поведінка                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (типово)  | Лише групи, що відповідають налаштованому allowlist    |
| `open`                | Обійти allowlist груп (gating за згадками все одно застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає значення за замовчуванням, коли `groupPolicy` у провайдера не встановлено.
Коди pairing дійсні 1 годину. Кількість очікуючих запитів pairing для приватних повідомлень обмежена **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп під час виконання повертається до `allowlist` (fail-closed) із попередженням під час запуску.
</Note>

### Перевизначення моделі для каналу

Використовуйте `channels.modelByChannel`, щоб закріпити певні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Відображення каналу застосовується, коли сесія ще не має перевизначення моделі (наприклад, встановленого через `/model`).

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

### Значення каналів за замовчуванням і heartbeat

Використовуйте `channels.defaults` для спільної поведінки group-policy і heartbeat у різних провайдерів:

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
- `channels.defaults.contextVisibility`: режим видимості додаткового контексту за замовчуванням для всіх каналів. Значення: `all` (типово, включати весь контекст цитат/гілок/історії), `allowlist` (включати контекст лише від відправників з allowlist), `allowlist_quote` (як `allowlist`, але зберігати явний контекст цитати/відповіді). Перевизначення для каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати здорові стани каналів у вивід heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати деградовані/помилкові стани у вивід heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати compact heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через web-канал gateway (Baileys Web). Він запускається автоматично, коли існує прив'язана сесія.

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

<Accordion title="Багатоакаунтний WhatsApp">

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

- Вихідні команди типово використовують акаунт `default`, якщо він є; інакше — перший налаштований ID акаунта (після сортування).
- Необов'язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.
- Застарілий каталог автентифікації Baileys для одного акаунта мігрується командою `openclaw doctor` у `whatsapp/default`.
- Перевизначення для окремого акаунта: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Відповідай коротко.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Дотримуйся теми.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Резервна копія Git" },
        { command: "generate", description: "Створити зображення" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (типово: off; явно вмикайте, щоб уникнути лімітів rate limits на редагування preview)
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються), з `TELEGRAM_BOT_TOKEN` як резервним варіантом для акаунта за замовчуванням.
- Необов'язковий `channels.telegram.defaultAccount` перевизначає вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.
- У багатоакаунтних конфігураціях (2+ ID акаунтів) установіть явне значення за замовчуванням (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли його немає або воно некоректне.
- `configWrites: false` блокує ініційовані з Telegram записи в конфігурацію (міграції ID supergroup, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив'язки для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Telegram stream preview використовують `sendMessage` + `editMessageText` (працює в приватних і групових чатах).
- Політика retry: див. [Retry policy](/uk/concepts/retry).

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
              systemPrompt: "Лише короткі відповіді.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress відображається як partial у Discord)
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
        spawnSubagentSessions: false, // opt-in для `sessions_spawn({ thread: true })`
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

- Токен: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як резервним варіантом для акаунта за замовчуванням.
- Прямі вихідні виклики, що передають явний Discord `token`, використовують цей токен для виклику; налаштування retry/політики акаунта все одно беруться з вибраного акаунта в активному runtime snapshot.
- Необов'язковий `channels.discord.defaultAccount` перевизначає вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) для цілей доставки; просто числові ID відхиляються.
- Slug-и guild — у нижньому регістрі, із пробілами, заміненими на `-`; ключі каналів використовують slug-овану назву (без `#`). Віддавайте перевагу ID guild.
- Повідомлення, створені ботом, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення від ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення на рівні каналу) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (окрім @everyone/@here).
- `maxLinesPerMessage` (типово 17) розбиває високі повідомлення, навіть якщо вони коротші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією, прив'язаною до Discord thread:
  - `enabled`: перевизначення Discord для функцій сесій, прив'язаних до thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив'язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного unfocus через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач opt-in для автоматичного створення/прив'язки thread через `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив'язки для каналів і thread (використовуйте id каналу/thread у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає accent color для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов'язкові перевизначення auto-join + TTS.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` напряму передаються до параметрів DAVE у `@discordjs/voice` (`true` і `24` за замовчуванням).
- OpenClaw також намагається відновити прийом голосу, виходячи та повторно входячи в голосову сесію після повторних збоїв дешифрування.
- `channels.discord.streaming` — канонічний ключ режиму stream. Застарілі `streamMode` і булеві значення `streaming` автоматично мігруються.
- `channels.discord.autoPresence` відображає доступність runtime у presence бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов'язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінюваними name/tag (режим сумісності break-glass).
- `channels.discord.execApprovals`: доставка native exec approval для Discord і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto схвалення exec активуються, коли схвалювачів можна визначити через `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати exec-запити. Якщо пропущено, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов'язковий allowlist ID агентів. Якщо пропущено, пересилаються схвалення для всіх агентів.
  - `sessionFilter`: необов'язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово) надсилає у DM схвалювачів, `"channel"` — у вихідний канал, `"both"` — в обидва місця. Коли target включає `"channel"`, кнопки можуть використовувати лише визначені схвалювачі.
  - `cleanupAfterResolve`: коли `true`, видаляє approval DM після схвалення, відхилення або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, типово), `all` (усі повідомлення), `allowlist` (із `guilds.<id>.users` для всіх повідомлень).

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

- JSON сервісного акаунта: inline (`serviceAccount`) або через файл (`serviceAccountFile`).
- Також підтримується SecretRef для сервісного акаунта (`serviceAccountRef`).
- Резервні env: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінюваним email principal (режим сумісності break-glass).

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
          systemPrompt: "Лише короткі відповіді.",
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
      streaming: "partial", // off | partial | block | progress (режим preview)
      nativeStreaming: true, // використовувати native streaming API Slack, коли streaming=partial
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

- **Socket mode** вимагає і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як резервні env для акаунта за замовчуванням).
- **HTTP mode** вимагає `botToken` плюс `signingSecret` (у корені або для окремого акаунта).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об'єкти SecretRef.
- Snapshot-и Slack акаунтів показують поля джерела/стану облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в HTTP mode —
  `signingSecretStatus`. `configured_unavailable` означає, що акаунт
  налаштовано через SecretRef, але поточний шлях команди/runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані зі Slack.
- Необов'язковий `channels.slack.defaultAccount` перевизначає вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.
- `channels.slack.streaming` — канонічний ключ режиму stream. Застарілі `streamMode` і булеві значення `streaming` автоматично мігруються.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

**Ізоляція thread-сесій:** `thread.historyScope` — окремо для thread (типово) або спільно для каналу. `thread.inheritParent` копіює transcript батьківського каналу в нові thread.

- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а після завершення видаляє її. Використовуйте shortcode емодзі Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: доставка native exec approval для Slack і авторизація схвалювачів. Та сама схема, що і в Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій     | Типово    | Примітки                 |
| ------------- | --------- | ------------------------ |
| reactions     | увімкнено | Реагувати + перелік реакцій |
| messages      | увімкнено | Читання/надсилання/редагування/видалення |
| pins          | увімкнено | Закріпити/відкріпити/перелік |
| memberInfo    | увімкнено | Інформація про учасника  |
| emojiList     | увімкнено | Список користувацьких емодзі |

### Mattermost

Mattermost постачається як plugin: `openclaw plugins install @openclaw/mattermost`.

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
        // Необов'язковий явний URL для reverse-proxy/публічних розгортань
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Режими чату: `oncall` (відповідати на @-згадки, типово), `onmessage` (на кожне повідомлення), `onchar` (на повідомлення, що починаються з trigger-префікса).

Коли native-команди Mattermost увімкнено:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повним URL.
- `commands.callbackUrl` має вказувати на endpoint OpenClaw gateway і бути доступним із сервера Mattermost.
- Native slash callback автентифікуються токенами для кожної команди, які Mattermost повертає
  під час реєстрації slash-команди. Якщо реєстрація не вдається або жодна
  команда не активована, OpenClaw відхиляє callback з повідомленням
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/internal хостів callback Mattermost може вимагати, щоб
  `ServiceSettings.AllowedUntrustedInternalConnections` містив callback host/domain.
  Використовуйте значення host/domain, а не повні URL.
- `channels.mattermost.configWrites`: дозволяти або забороняти записи конфігурації, ініційовані з Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення gating за згадками для окремого каналу (`"*"` для типового).
- Необов'язковий `channels.mattermost.defaultAccount` перевизначає вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // необов'язкова прив'язка до акаунта
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

- `channels.signal.account`: закріпити запуск каналу за певною ідентичністю акаунта Signal.
- `channels.signal.configWrites`: дозволяти або забороняти записи конфігурації, ініційовані з Signal.
- Необов'язковий `channels.signal.defaultAccount` перевизначає вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (підтримується plugin, налаштовується в `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, керування групами та розширені дії:
      // див. /channels/bluebubbles
    },
  },
}
```

- Ключові шляхи core, описані тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов'язковий `channels.bluebubbles.defaultAccount` перевизначає вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив'язувати розмови BlueBubbles до постійних ACP-сесій. Використовуйте дескриптор BlueBubbles або рядок цілі (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повну конфігурацію каналу BlueBubbles задокументовано в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Не потрібні ні daemon, ні порт.

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

- Необов'язковий `channels.imessage.defaultAccount` перевизначає вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.

- Потрібен Full Disk Access до бази Messages DB.
- Віддавайте перевагу цілям `chat_id:<id>`. Щоб отримати список чатів, використовуйте `imsg chats --limit 20`.
- `cliPath` може вказувати на SSH wrapper; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи до вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку host key, тому переконайтеся, що ключ relay host уже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволяти або забороняти записи конфігурації, ініційовані з iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив'язувати розмови iMessage до постійних ACP-сесій. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH wrapper для iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix підтримується як extension і налаштовується в `channels.matrix`.

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
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S) proxy. Іменовані акаунти можуть перевизначати його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.allowPrivateNetwork` дозволяє приватні/internal homeserver. `proxy` і `allowPrivateNetwork` — незалежні елементи керування.
- `channels.matrix.defaultAccount` вибирає бажаний акаунт у багатоакаунтних конфігураціях.
- `channels.matrix.execApprovals`: доставка native exec approval для Matrix і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto схвалення exec активуються, коли схвалювачів можна визначити через `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати exec-запити.
  - `agentFilter`: необов'язковий allowlist ID агентів. Якщо пропущено, пересилаються схвалення для всіх агентів.
  - `sessionFilter`: необов'язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово), `"channel"` (вихідна кімната) або `"both"`.
  - Перевизначення для окремого акаунта: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (типово) спільний за маршрутизованим peer, а `per-room` ізолює кожну DM-кімнату.
- Перевірки стану Matrix і live directory lookup використовують ту саму політику proxy, що й runtime-трафік.
- Повну конфігурацію Matrix, правила таргетингу і приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams підтримується як extension і налаштовується в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, політики team/channel:
      // див. /channels/msteams
    },
  },
}
```

- Ключові шляхи core, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, webhook, політики DM/груп, перевизначення для окремих team/channel) задокументовано в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC підтримується як extension і налаштовується в `channels.irc`.

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

- Ключові шляхи core, описані тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов'язковий `channels.irc.defaultAccount` перевизначає вибір акаунта за замовчуванням, якщо він збігається з ID налаштованого акаунта.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlists/mention gating) задокументовано в [IRC](/uk/channels/irc).

### Багатоакаунтність (усі канали)

Запускайте кілька акаунтів на канал (кожен зі своїм `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Основний бот",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Бот сповіщень",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` використовується, коли `accountId` пропущено (CLI + маршрутизація).
- Env-токени застосовуються лише до акаунта **default**.
- Базові налаштування каналу застосовуються до всіх акаунтів, якщо вони не перевизначені для окремих акаунтів.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен акаунт до іншого агента.
- Якщо ви додаєте не-default акаунт через `openclaw channels add` (або onboarding каналу), поки ще використовуєте однокористувацьку конфігурацію верхнього рівня для каналу, OpenClaw спочатку переносить значення верхнього рівня, прив'язані до одного акаунта, у map акаунтів каналу, щоб початковий акаунт продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default-ціль.
- Наявні bindings лише на рівні каналу (без `accountId`) і далі відповідають акаунту default; bindings з прив'язкою до акаунта залишаються необов'язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи верхньорівневі однокористувацькі значення, прив'язані до акаунта, у promoted account, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default-ціль.

### Інші extension-канали

Багато extension-каналів налаштовуються як `channels.<id>` і документуються на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Повний індекс каналів див. у [Channels](/uk/channels).

### Gating за згадками в групових чатах

Для групових повідомлень типово **потрібна згадка** (metadata mention або безпечні regex-шаблони). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat і iMessage.

**Типи згадок:**

- **Metadata mention**: нативні @-згадки платформи. Ігноруються в режимі self-chat у WhatsApp.
- **Текстові шаблони**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Некоректні шаблони та небезпечне вкладене повторення ігноруються.
- Gating за згадками застосовується лише тоді, коли виявлення можливе (нативні згадки або щонайменше один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого акаунта). Установіть `0`, щоб вимкнути.

#### Ліміти історії для приватних повідомлень

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

Порядок визначення: перевизначення для конкретного DM → значення провайдера за замовчуванням → без ліміту (зберігається все).

Підтримуються: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте свій власний номер до `allowFrom`, щоб увімкнути режим self-chat (ігнорує нативні @-згадки, відповідає лише на текстові шаблони):

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
    native: "auto", // реєструвати native-команди, коли це підтримується
    text: true, // розбирати /commands у повідомленнях чату
    bash: false, // дозволити ! (псевдонім: /bash)
    bashForegroundMs: 2000,
    config: false, // дозволити /config
    debug: false, // дозволити /debug
    restart: false, // дозволити /restart + інструмент перезапуску gateway
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Деталі команд">

- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає native-команди для Discord/Telegram, а для Slack залишає вимкненими.
- Перевизначення для каналу: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потрібні `tools.elevated.enabled` і відправник у `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; read-only `/config show` залишається доступним для звичайних клієнтів оператора з правом запису.
- `channels.<provider>.configWrites` контролює мутації конфігурації для кожного каналу (типово: true).
- Для багатоакаунтних каналів `channels.<provider>.accounts.<id>.configWrites` також контролює записи, що націлені на цей акаунт (наприклад `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` задається для кожного провайдера. Якщо його встановлено, це **єдине** джерело авторизації (allowlist/pairing каналу і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики access-group, коли `allowFrom` не встановлено.

</Accordion>

---

## Типові параметри агентів

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов'язковий корінь репозиторію, що показується в рядку Runtime системного prompt. Якщо не встановлено, OpenClaw автоматично визначає його, піднімаючись вгору від workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Необов'язковий типовий allowlist Skills для агентів, які не задають
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // успадковує github, weather
      { id: "docs", skills: ["docs-search"] }, // замінює типові
      { id: "locked-down", skills: [] }, // без skills
    ],
  },
}
```

- Пропустіть `agents.defaults.skills`, щоб типово не обмежувати Skills.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Установіть `agents.list[].skills: []`, щоб вимкнути всі skills.
- Непорожній список `agents.list[].skills` є остаточним набором для цього агента; він
  не об'єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів у кожному bootstrap-файлі workspace до обрізання. Типове значення: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що додаються з усіх bootstrap-файлів workspace. Типове значення: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує текстом попередження, видимим агенту, коли bootstrap-контекст обрізано.
Типове значення: `"once"`.

- `"off"`: ніколи не додавати текст попередження в системний prompt.
- `"once"`: додавати попередження один раз для кожного унікального підпису обрізання (рекомендовано).
- `"always"`: додавати попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Максимальний розмір у пікселях для довшої сторони зображення в блоках transcript/tool перед викликами провайдера.
Типове значення: `1200`.

Нижчі значення зазвичай зменшують використання vision-token і розмір payload запиту для запусків із великою кількістю скриншотів.
Вищі значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного prompt (не для часових міток повідомлень). Якщо не задано, використовується часовий пояс хоста.

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
      params: { cacheRetention: "long" }, // глобальні типові параметри провайдера
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

- `model`: приймає або рядок (`"provider/model"`), або об'єкт (`{ primary, fallbacks }`).
  - Форма рядка задає лише основну модель.
  - Форма об'єкта задає основну модель плюс впорядковані резервні моделі failover.
- `imageModel`: приймає або рядок (`"provider/model"`), або об'єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як його конфігурація vision-model.
  - Також використовується для резервної маршрутизації, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об'єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею tools/plugins, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-1` для OpenAI Images.
  - Якщо ви безпосередньо вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/ключ API провайдера (наприклад `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` для `openai/*`, `FAL_KEY` для `fal/*`).
  - Якщо це поле пропущено, `image_generate` усе одно може визначити значення провайдера за замовчуванням на основі автентифікації. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об'єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики і вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо це поле пропущено, `music_generate` усе одно може визначити значення провайдера за замовчуванням на основі автентифікації. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації музики у порядку provider-id.
  - Якщо ви безпосередньо вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/ключ API провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об'єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео і вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо це поле пропущено, `video_generate` усе одно може визначити значення провайдера за замовчуванням на основі автентифікації. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації відео у порядку provider-id.
  - Якщо ви безпосередньо вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/ключ API провайдера.
  - Вбудований провайдер генерації відео Qwen наразі підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` і `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об'єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделі.
  - Якщо пропущено, інструмент PDF повертається до `imageModel`, а потім до визначеної моделі сесії/типової моделі.
- `pdfMaxBytesMb`: типовий ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, які враховуються в режимі резервного видобування в інструменті `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типове значення: `"off"`.
- `elevatedDefault`: типовий рівень elevated-output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типове значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад `openai/gpt-5.4`). Якщо ви пропускаєте провайдера, OpenClaw спочатку пробує alias, потім унікальний збіг налаштованого провайдера для цього точного model id, і лише потім повертається до налаштованого провайдера за замовчуванням (застаріла поведінка сумісності, тому надавайте перевагу явному `provider/model`). Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw повертається до першого налаштованого провайдера/моделі, замість того щоб показувати застаріле значення типового провайдера, який уже видалено.
- `models`: налаштований каталог моделей і allowlist для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: глобальні типові параметри провайдера, що застосовуються до всіх моделей. Установлюються в `agents.defaults.params` (наприклад `{ cacheRetention: "long" }`).
- Пріоритет об'єднання `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається через `agents.defaults.models["provider/model"].params` (для окремої моделі), а потім `agents.list[].params` (для відповідного agent id) перевизначає за ключем. Докладніше див. [Prompt Caching](/uk/reference/prompt-caching).
- Засоби запису конфігурації, які змінюють ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об'єкта і по можливості зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів у різних сесіях (кожна сесія все одно серіалізується). Типове значення: 4.

**Вбудовані скорочення alias** (застосовуються лише коли модель є в `agents.defaults.models`):

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

Для моделей Z.AI GLM-4.x thinking mode вмикається автоматично, якщо ви не задасте `--thinking off` або самі не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для потокової передачі викликів інструментів. Установіть `agents.defaults.models["zai/<model>"].params.tool_stream` в `false`, щоб вимкнути це.
Для моделей Anthropic Claude 4.6 типово використовується `adaptive` thinking, якщо явно не встановлено рівень thinking.

- Сесії підтримуються, коли встановлено `sessionArg`.
- Пряме передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

### `agents.defaults.heartbeat`

Періодичні запуски heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m вимикає
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // типово: false; true залишає тільки HEARTBEAT.md серед bootstrap-файлів workspace
        isolatedSession: false, // типово: false; true запускає кожний heartbeat у свіжій сесії (без історії розмови)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (типово) | block
        target: "none", // типово: none | варіанти: last | whatsapp | telegram | discord | ...
        prompt: "Прочитай HEARTBEAT.md, якщо він існує...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: рядок тривалості (ms/s/m/h). Типове значення: `30m` (автентифікація API-key) або `1h` (OAuth-автентифікація). Установіть `0m`, щоб вимкнути.
- `suppressToolErrorWarnings`: коли true, пригнічує payload-и попереджень про помилки інструментів під час запусків heartbeat.
- `directPolicy`: політика прямої доставки/доставки в DM. `allow` (типово) дозволяє доставку до direct-target. `block` пригнічує доставку до direct-target і генерує `reason=dm-blocked`.
- `lightContext`: коли true, запуски heartbeat використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів workspace.
- `isolatedSession`: коли true, кожний heartbeat запускається у свіжій сесії без попередньої історії розмов. Та сама схема ізоляції, що і для cron `sessionTarget: "isolated"`. Зменшує вартість heartbeat у токенах приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: задавайте `agents.list[].heartbeat`. Якщо будь-який агент визначає `heartbeat`, heartbeat виконуються **лише для цих агентів**.
- Heartbeat виконують повні ходи агента — коротші інтервали спалюють більше токенів.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Зберігайте deployment ID, ticket ID і пари host:port точно без змін.", // використовується, коли identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторне вставлення
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов'язкове перевизначення моделі лише для compaction
        notifyUser: true, // надсилати коротке сповіщення, коли починається compaction (типово: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Сесія наближається до compaction. Збережіть довготривалу пам'ять зараз.",
          prompt: "Запишіть будь-які довготривалі нотатки в memory/YYYY-MM-DD.md; відповідайте точним silent token NO_REPLY, якщо зберігати нічого.",
        },
      },
    },
  },
}
```

- `mode`: `default` або `safeguard` (chunked summarization для довгої історії). Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд для однієї операції compaction, після якої OpenClaw її перериває. Типове значення: `900`.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає вбудовану інструкцію зі збереження opaque identifier під час summarization для compaction.
- `identifierInstructions`: необов'язковий власний текст для збереження identifier, який використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов'язкові назви секцій H2/H3 із AGENTS.md, які треба повторно вставити після compaction. Типово `["Session Startup", "Red Lines"]`; установіть `[]`, щоб вимкнути повторне вставлення. Якщо поле не задане або явно встановлене в цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як застарілий резервний варіант.
- `model`: необов'язкове перевизначення `provider/model-id` лише для summarization під час compaction. Використовуйте це, коли основна сесія має залишатися на одній моделі, а зведення compaction мають виконуватись на іншій; якщо не встановлено, compaction використовує основну модель сесії.
- `notifyUser`: коли `true`, надсилає користувачеві коротке повідомлення, коли починається compaction (наприклад, "Compacting context..."). Типово вимкнено, щоб compaction проходив непомітно.
- `memoryFlush`: тихий agentic turn перед auto-compaction для збереження довготривалої пам'яті. Пропускається, коли workspace доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** із контексту в пам'яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

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

- `mode: "cache-ttl"` вмикає проходи pruning.
- `ttl` керує тим, як часто pruning може запускатися знову (після останнього cache touch).
- Pruning спочатку виконує soft-trim для завеликих результатів інструментів, а потім за потреби повністю очищає старіші результати інструментів.

**Soft-trim** зберігає початок + кінець і вставляє `...` посередині.

**Hard-clear** замінює весь результат інструмента на placeholder.

Примітки:

- Блоки зображень ніколи не обрізаються й не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точних token counts.
- Якщо існує менше ніж `keepLastAssistants` повідомлень assistant, pruning пропускається.

</Accordion>

Докладніше про поведінку див. у [Session Pruning](/uk/concepts/session-pruning).

### Block streaming

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

- Канали, відмінні від Telegram, вимагають явного `*.blockStreaming: true`, щоб увімкнути block replies.
- Перевизначення для каналу: `channels.<channel>.blockStreamingCoalesce` (і варіанти для окремих акаунтів). Для Signal/Slack/Discord/Google Chat типово `minChars: 1500`.
- `humanDelay`: випадкова пауза між block replies. `natural` = 800–2500ms. Перевизначення для агента: `agents.list[].humanDelay`.

Подробиці про поведінку і розбиття на chunk див. у [Streaming](/uk/concepts/streaming).

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

- Типові значення: `instant` для приватних чатів/згадок, `message` для групових чатів без згадки.
- Перевизначення для сесії: `session.typingMode`, `session.typingIntervalSeconds`.

Докладніше див. у [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов'язкове sandboxing для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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
          // Також підтримуються SecretRef / inline contents:
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
- `ssh`: загальний віддалений runtime на базі SSH
- `openshell`: runtime OpenShell

Коли вибрано `backend: "openshell"`, специфічні для runtime налаштування
переміщуються до `plugins.entries.openshell.config`.

**Конфігурація SSH backend:**

- `target`: SSH target у форматі `user@host[:port]`
- `command`: команда SSH client (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь для workspace на рівні scope
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, що передаються в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: inline contents або SecretRef, які OpenClaw materializes у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики host-key OpenSSH

**Пріоритет SSH auth:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data` на основі SecretRef визначаються з активного snapshot runtime секретів перед стартом sandbox-сесії

**Поведінка SSH backend:**

- засіває віддалений workspace один раз після create або recreate
- потім підтримує віддалений SSH workspace як канонічний
- маршрутизує `exec`, файлові інструменти і media path через SSH
- не синхронізує автоматично віддалені зміни назад на хост
- не підтримує sandbox browser container

**Доступ до workspace:**

- `none`: sandbox workspace для кожного scope у `~/.openclaw/sandboxes`
- `ro`: sandbox workspace в `/workspace`, workspace агента монтується лише для читання в `/agent`
- `rw`: workspace агента монтується для читання/запису в `/workspace`

**Scope:**

- `session`: контейнер + workspace для окремої сесії
- `agent`: один контейнер + workspace на агента (типово)
- `shared`: спільний контейнер і workspace (без ізоляції між сесіями)

**Конфігурація plugin OpenShell:**

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
          gateway: "lab", // необов'язково
          gatewayEndpoint: "https://lab.example", // необов'язково
          policy: "strict", // необов'язковий ID політики OpenShell
          providers: ["openai"], // необов'язково
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Режим OpenShell:**

- `mirror`: засіяти remote з local перед exec, синхронізувати назад після exec; локальний workspace залишається канонічним
- `remote`: засіяти remote один раз, коли створюється sandbox, а потім віддалений workspace залишається канонічним

У режимі `remote` локальні редагування на хості, зроблені поза OpenClaw, не синхронізуються автоматично в sandbox після початкового засівання.
Транспорт — SSH до sandbox OpenShell, але plugin керує життєвим циклом sandbox і необов'язковою mirror sync.

**`setupCommand`** запускається один раз після створення контейнера (через `sh -lc`). Потрібні вихід у мережу, записуваний root і користувач root.

**Для контейнерів типово встановлено `network: "none"`** — задайте `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихід назовні.
`"host"` заблоковано. `"container:<id>"` типово заблоковано, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Вхідні вкладення** поміщаються в `media/inbound/*` в активному workspace.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні й per-agent binds об'єднуються.

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC додається в системний prompt. Не потребує `browser.enabled` в `openclaw.json`.
Доступ спостерігача через noVNC типово використовує VNC auth, а OpenClaw видає URL з короткоживучим токеном (замість того щоб показувати пароль у спільному URL).

- `allowHostControl: false` (типово) блокує для sandboxed-сесій націлення на browser хоста.
- `network` типово `openclaw-sandbox-browser` (окрема bridge-мережа). Установлюйте `bridge` лише коли явно потрібна глобальна bridge-підключеність.
- `cdpSourceRange` може обмежувати вхідний CDP на рівні контейнера певним діапазоном CIDR (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише до контейнера sandbox browser. Якщо встановлено (включно з `[]`), замінює `docker.binds` для контейнера browser.
- Типові параметри запуску визначено в `scripts/sandbox-browser-entrypoint.sh` і налаштовано для контейнерних хостів:
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
    типово ввімкнені й можуть бути вимкнені через
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо потрібне використання WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає extensions, якщо ваш workflow
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; установіть `0`, щоб використовувати
    типовий ліміт процесів Chromium.
  - плюс `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення є базовими для контейнерного image; щоб змінити їх, використовуйте власний browser image з власним
    entrypoint.

</Accordion>

Browser sandboxing і `sandbox.docker.binds` наразі підтримуються лише для Docker.

Побудова образів:

```bash
scripts/sandbox-setup.sh           # основний sandbox image
scripts/sandbox-browser-setup.sh   # необов'язковий browser image
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
        thinkingDefault: "high", // перевизначення рівня thinking для агента
        reasoningDefault: "on", // перевизначення видимості reasoning для агента
        fastModeDefault: false, // перевизначення fast mode для агента
        params: { cacheRetention: "none" }, // перевизначає відповідні defaults.models params за ключами
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

- `id`: стабільний ID агента (обов'язково).
- `default`: якщо встановлено для кількох, перемагає перший (логуватиметься попередження). Якщо не встановлено ніде, default — перший елемент у списку.
- `model`: форма рядка перевизначає лише `primary`; форма об'єкта `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback). Cron jobs, що перевизначають лише `primary`, і далі успадковують типові fallback, якщо ви не встановите `fallbacks: []`.
- `params`: stream-параметри для окремого агента, що об'єднуються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень на кшталт `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `skills`: необов'язковий allowlist Skills для окремого агента. Якщо поле пропущено, агент успадковує `agents.defaults.skills`, якщо його встановлено; явний список замінює типові значення, а не об'єднується з ними, і `[]` означає відсутність skills.
- `thinkingDefault`: необов'язковий типовий рівень thinking для агента (`off | minimal | low | medium | high | xhigh | adaptive`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, якщо не встановлено перевизначення для окремого повідомлення або сесії.
- `reasoningDefault`: необов'язкове типове значення видимості reasoning для агента (`on | off | stream`). Застосовується, якщо немає перевизначення reasoning для окремого повідомлення або сесії.
- `fastModeDefault`: необов'язкове типове значення fast mode для агента (`true | false`). Застосовується, якщо немає перевизначення fast-mode для окремого повідомлення або сесії.
- `runtime`: необов'язковий дескриптор runtime для агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати сесії ACP harness.
- `identity.avatar`: шлях відносно workspace, URL `http(s)` або URI `data:`.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: allowlist ID агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Запобіжник успадкування sandbox: якщо сесія запитувача працює в sandbox, `sessions_spawn` відхиляє цілі, які запускались би без sandbox.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn`, у яких пропущено `agentId` (вимагає явного вибору профілю; типово: false).

---

## Маршрутизація між кількома агентами

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

### Поля match у binding

- `type` (необов'язково): `route` для звичайної маршрутизації (якщо `type` відсутній, типово `route`), `acp` для постійних ACP-прив'язок розмов.
- `match.channel` (обов'язково)
- `match.accountId` (необов'язково; `*` = будь-який акаунт; якщо пропущено = акаунт за замовчуванням)
- `match.peer` (необов'язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов'язково; специфічні для каналу)
- `acp` (необов'язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок match:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний збіг, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Агент за замовчуванням

У межах кожного рівня перемагає перший запис `bindings`, що збігся.

Для записів `type: "acp"` OpenClaw визначає відповідність за точною ідентичністю розмови (`match.channel` + акаунт + `match.peer.id`) і не використовує наведений вище порядок route binding.

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

<Accordion title="Інструменти та workspace лише для читання">

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

<Accordion title="Без доступу до файлової системи (лише повідомлення)">

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
    parentForkMaxTokens: 100000, // пропускати fork батьківської thread вище цього token count (0 вимикає)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // тривалість або false
      maxDiskBytes: "500mb", // необов'язковий жорсткий бюджет
      highWaterBytes: "400mb", // необов'язкова ціль очищення
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // типове автоматичне unfocus через неактивність у годинах (`0` вимикає)
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

<Accordion title="Деталі полів session">

- **`scope`**: базова стратегія групування session для контекстів групового чату.
  - `per-sender` (типово): кожен відправник отримує ізольовану session у контексті каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну session (використовуйте лише там, де потрібен спільний контекст).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM спільно використовують головну session.
  - `per-peer`: ізоляція за id відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для inbox з кількома користувачами).
  - `per-account-channel-peer`: ізоляція за акаунтом + каналом + відправником (рекомендовано для багатоакаунтності).
- **`identityLinks`**: мапа канонічних id до provider-prefixed peer для спільного використання session між каналами.
- **`reset`**: основна політика reset. `daily` скидає о `atHour` за місцевим часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва, спрацьовує те, що закінчиться раніше.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальне значення `totalTokens` батьківської session, дозволене під час створення forked thread session (типово `100000`).
  - Якщо батьківське `totalTokens` перевищує це значення, OpenClaw запускає свіжу thread session замість успадкування transcript history батьківської session.
  - Установіть `0`, щоб вимкнути цей запобіжник і завжди дозволяти parent forking.
- **`mainKey`**: застаріле поле. Runtime тепер завжди використовує `"main"` для головного кошика direct-chat.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість взаємних reply-back turns між агентами під час обміну агент-до-агента (ціле число, діапазон: `0`–`5`). `0` вимикає ping-pong chaining.
- **`sendPolicy`**: зіставлення за `channel`, `chatType` (`direct|group|channel`, із застарілим alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перший deny має пріоритет.
- **`maintenance`**: очищення session-store + елементи керування зберіганням.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: поріг віку для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: ротація `sessions.json`, коли його розмір перевищує це значення (типово `10mb`).
  - `resetArchiveRetention`: час зберігання архівів transcript `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; установіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов'язковий бюджет дискового простору для каталогу сесій. У режимі `warn` логуються попередження; у режимі `enforce` спочатку видаляються найстаріші артефакти/сесії.
  - `highWaterBytes`: необов'язкова ціль після очищення за бюджетом. Типово `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій session, прив'язаних до thread.
  - `enabled`: головний перемикач за замовчуванням (провайдери можуть перевизначати; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне unfocus через неактивність у годинах (`0` вимикає; провайдери можуть перевизначати)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначати)

</Accordion>

---

## Messages

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

Перевизначення для каналу/акаунта: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Порядок визначення (найспецифічніше перемагає): акаунт → канал → глобальне значення. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Шаблонні змінні:**

| Змінна            | Опис                     | Приклад                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | Коротка назва моделі     | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера         | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off`        |
| `{identity.name}` | Назва identity агента    | (те саме, що `"auto"`)      |

Змінні нечутливі до регістру. `{think}` — alias для `{thinkingLevel}`.

### Ack reaction

- Типово використовується `identity.emoji` активного агента, інакше `"👀"`. Установіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок визначення: акаунт → канал → `messages.ackReaction` → резервне значення з identity.
- Scope: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: видаляє ack після відповіді в Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції статусу життєвого циклу в Slack, Discord і Telegram.
  У Slack і Discord, якщо значення не задано, статусні реакції залишаються ввімкненими, коли активні ack reaction.
  У Telegram установіть це явно в `true`, щоб увімкнути реакції статусу життєвого циклу.

### Вхідний debounce

Об'єднує швидкі текстові повідомлення від одного відправника в один хід агента. Media/вкладення скидаються негайно. Керуючі команди обходять debouncing.

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

- `auto` керує автоматичним TTS. `/tts off|always|inbound|tagged` перевизначає для кожної session.
- `summaryModel` перевизначає `agents.defaults.model.primary` для auto-summary.
- `modelOverrides` типово увімкнено; `modelOverrides.allowProvider` типово `false` (потрібен opt-in).
- API-ключі повертаються до `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок визначення: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на endpoint, який не належить OpenAI, OpenClaw вважає його OpenAI-compatible TTS server і послаблює перевірку model/voice.

---

## Talk

Типові параметри для режиму Talk (macOS/iOS/Android).

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

- `talk.provider` має збігатися з ключем у `talk.providers`, якщо налаштовано кілька провайдерів Talk.
- Застарілі плоскі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) призначені лише для сумісності і автоматично мігруються в `talk.providers.<provider>`.
- Voice ID повертаються до `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті рядки або об'єкти SecretRef.
- Резервне значення `ELEVENLABS_API_KEY` застосовується лише тоді, коли ключ API для Talk не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні назви.
- `silenceTimeoutMs` визначає, як довго режим Talk чекає після тиші користувача перед надсиланням transcript. Якщо не задано, зберігається типове для платформи вікно паузи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий allowlist перед `tools.allow`/`tools.deny`:

Local onboarding типово встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо це поле не задане (існуючі явно задані профілі зберігаються).

| Профіль     | Містить                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Без обмежень (те саме, що й незадане значення)                                                                                  |

### Групи інструментів

| Група              | Інструменти                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як alias для `exec`)                                              |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                     |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`   |
| `group:memory`     | `memory_search`, `memory_get`                                                                                              |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                      |
| `group:ui`         | `browser`, `canvas`                                                                                                        |
| `group:automation` | `cron`, `gateway`                                                                                                          |
| `group:messaging`  | `message`                                                                                                                  |
| `group:nodes`      | `nodes`                                                                                                                    |
| `group:agents`     | `agents_list`                                                                                                              |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                         |
| `group:openclaw`   | Усі вбудовані інструменти (без provider plugin)                                                                            |

### `tools.allow` / `tools.deny`

Глобальна політика allow/deny для інструментів (deny має пріоритет). Нечутлива до регістру, підтримує wildcard `*`. Застосовується, навіть коли Docker sandbox вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для певних провайдерів або моделей. Порядок: базовий профіль → профіль провайдера → allow/deny.

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

- Перевизначення для окремого агента (`agents.list[].tools.elevated`) може лише ще більше обмежити доступ.
- `/elevated on|off|ask|full` зберігає стан для кожної session; inline directives застосовуються лише до одного повідомлення.
- Elevated `exec` обходить sandboxing і використовує налаштований escape path (`gateway` за замовчуванням або `node`, коли ціль exec — `node`).

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

Перевірки безпеки від циклів інструментів **типово вимкнено**. Установіть `enabled: true`, щоб увімкнути виявлення.
Налаштування можна визначити глобально в `tools.loopDetection` і перевизначити для окремого агента в `agents.list[].tools.loopDetection`.

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
- `criticalThreshold`: вищий поріг повторень для блокування критичних циклів.
- `globalCircuitBreakerThreshold`: поріг жорсткої зупинки для будь-якого запуску без прогресу.
- `detectors.genericRepeat`: попереджати про повторні виклики того самого інструмента з тими самими аргументами.
- `detectors.knownPollNoProgress`: попереджати/блокувати відомі інструменти poll (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати чергування пар шаблонів без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, перевірка не проходить.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // або BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // необов'язково; пропустіть для auto-detect
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

**Запис провайдера** (`type: "provider"` або пропущено):

- `provider`: ID API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення model id
- `profile` / `preferredProfile`: вибір профілю `auth-profiles.json`

**CLI-запис** (`type: "cli"`):

- `command`: виконуваний файл
- `args`: шаблонізовані аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов'язковий список (`image`, `audio`, `video`). Типові значення: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
- У разі помилки використовується наступний запис.

Автентифікація провайдера слідує стандартному порядку: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

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

Керує тим, на які session можуть націлюватися session tools (`sessions_list`, `sessions_history`, `sessions_send`).

Типове значення: `tree` (поточна session + session, створені нею, наприклад subagents).

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

- `self`: лише поточний ключ session.
- `tree`: поточна session + session, створені поточною session (subagents).
- `agent`: будь-яка session, що належить поточному agent id (може включати інших користувачів, якщо ви використовуєте per-sender session під тим самим agent id).
- `all`: будь-яка session. Націлення між агентами все одно вимагає `tools.agentToAgent`.
- Обмеження sandbox: коли поточна session працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється в `tree`, навіть якщо `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Керує підтримкою inline-вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: установіть true, щоб дозволити inline file attachments
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
- Файли materialize у дочірньому workspace в `.openclaw/attachments/<uuid>/` з `.manifest.json`.
- Вміст вкладень автоматично redacted із збереження transcript.
- Вхідні дані Base64 перевіряються суворою перевіркою алфавіту/падингу і запобіжником розміру до декодування.
- Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
- Очищення слідує політиці `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.

### `tools.experimental`

Експериментальні прапорці для вбудованих інструментів. Типово вимкнені, якщо не застосовується правило автоматичного ввімкнення для певного runtime.

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
- Типове значення: `false` для провайдерів, відмінних від OpenAI. Для запусків OpenAI та OpenAI Codex він вмикається автоматично.
- Коли ввімкнено, системний prompt також додає інструкції з використання, щоб модель застосовувала його лише для суттєвої роботи й тримала не більше одного кроку в стані `in_progress`.

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

- `model`: типова модель для створених sub-agent. Якщо пропущено, sub-agent успадковують модель викликуча.
- `allowAgents`: типовий allowlist цільових ID агентів для `sessions_spawn`, коли агент-запитувач не задає власне `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента не передає `runTimeoutSeconds`. `0` означає відсутність тайм-ауту.
- Політика інструментів для subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Власні провайдери і base URL

OpenClaw використовує вбудований каталог моделей. Додавайте власних провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

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

- Використовуйте `authHeader: true` + `headers` для власних сценаріїв автентифікації.
- Перевизначайте корінь конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий alias змінної середовища).
- Пріоритет об'єднання для провайдерів із тим самим ID:
  - Непорожні значення `baseUrl` з `models.json` агента мають пріоритет.
  - Непорожні значення `apiKey` агента мають пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` провайдерів, керованих через SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env refs, `secretref-managed` для file/exec refs) замість збереження визначених секретів.
  - Значення header провайдера, керовані через SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env refs, `secretref-managed` для file/exec refs).
  - Порожні або відсутні `apiKey`/`baseUrl` агента повертаються до `models.providers` у конфігурації.
  - Для збігу моделей `contextWindow`/`maxTokens` використовується більше значення між явною конфігурацією та неявними значеннями каталогу.
  - Для збігу моделей `contextTokens` зберігається явне runtime-обмеження, якщо воно задане; використовуйте його, щоб обмежити ефективний контекст, не змінюючи нативні метадані моделі.
  - Використовуйте `models.mode: "replace"`, коли хочете, щоб конфігурація повністю переписала `models.json`.
  - Збереження маркерів є джерело-орієнтованим: маркери записуються з активного snapshot джерельної конфігурації (до визначення), а не з визначених runtime-значень секретів.

### Деталі полів провайдера

- `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
- `models.providers`: мапа власних провайдерів, ключована provider id.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані провайдера (переважно SecretRef/env substitution).
- `models.providers.*.auth`: стратегія auth (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` додавати `options.num_ctx` до запитів (типово: `true`).
- `models.providers.*.authHeader`: примусово передавати облікові дані в заголовку `Authorization`, коли це потрібно.
- `models.providers.*.baseUrl`: base URL upstream API.
- `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації proxy/tenant.
- `models.providers.*.request`: перевизначення транспорту для HTTP-запитів model-provider.
  - `request.headers`: додаткові заголовки (об'єднуються з типовими значеннями провайдера). Значення приймають SecretRef.
  - `request.auth`: перевизначення стратегії auth. Режими: `"provider-default"` (використовувати вбудовану auth провайдера), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов'язковим `prefix`).
  - `request.proxy`: перевизначення HTTP proxy. Режими: `"env-proxy"` (використовувати env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов'язковий підоб'єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих підключень. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: явні записи каталогу моделей провайдера.
- `models.providers.*.models.*.contextWindow`: метадані нативного вікна контексту моделі.
- `models.providers.*.models.*.contextTokens`: необов'язкове runtime-обмеження контексту. Використовуйте його, якщо хочете менший ефективний бюджет контексту, ніж нативний `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов'язкова compatibility hint. Для `api: "openai-completions"` з непорожнім ненативним `baseUrl` (host не `api.openai.com`) OpenClaw примусово встановлює це в `false` під час runtime. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
- `plugins.entries.amazon-bedrock.config.discovery`: кореневий блок налаштувань auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне discovery.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов'язковий фільтр provider-id для цільового discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне вікно контексту для знайдених моделей.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для знайдених моделей.

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

Установіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` — прийнятні alias. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint для coding (типовий): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint визначте власного провайдера з перевизначенням base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
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
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
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
транспорті `openai-completions`, і OpenClaw тепер визначає це за можливостями
endpoint, а не лише за вбудованим provider id.

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

Сумісний з Anthropic, вбудований провайдер. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

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

Base URL має не містити `/v1` (клієнт Anthropic додає його сам). Скорочення: `openclaw onboard --auth-choice synthetic-api-key`.

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
Каталог моделей тепер типово використовує лише M2.7.
На Anthropic-compatible streaming path OpenClaw типово вимикає MiniMax thinking,
якщо ви явно самі не задасте `thinking`. `/fast on` або
`params.fastMode: true` переписує `MiniMax-M2.7` на
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Локальні моделі (LM Studio)">

Див. [Local Models](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному обладнанні; залишайте hosted-моделі об'єднаними для fallback.

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

- `allowBundled`: необов'язковий allowlist лише для bundled Skills (managed/workspace skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені skills (найнижчий пріоритет).
- `install.preferBrew`: коли true, віддавати перевагу інсталяторам Homebrew, якщо доступний `brew`,
  перш ніж переходити до інших типів інсталятора.
- `install.nodeManager`: бажаний node installer для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручне поле API-ключа для skills, які оголошують основну env variable (відкритий рядок або об'єкт SecretRef).

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

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` і `plugins.load.paths`.
- Discovery приймає нативні OpenClaw plugins, а також сумісні збірки Codex і Claude, включно з bundle Claude стандартного layout без manifest.
- **Зміни конфігурації вимагають перезапуску gateway.**
- `allow`: необов'язковий allowlist (завантажуються лише перелічені plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні plugin (коли plugin це підтримує).
- `plugins.entries.<id>.env`: мапа env vars у межах plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, core блокує `before_prompt_build` і ігнорує поля legacy `before_agent_start`, що мутують prompt, зберігаючи при цьому legacy `modelOverride` і `providerOverride`. Застосовується до native plugin hooks і підтримуваних каталогів hooks, що надаються bundle.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому plugin запитувати перевизначення `provider` і `model` для окремого запуску background subagent.
- `plugins.entries.<id>.subagent.allowedModels`: необов'язковий allowlist канонічних цілей `provider/model` для довірених перевизначень subagent. Використовуйте `"*"` лише тоді, коли свідомо хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об'єкт конфігурації, визначений plugin (перевіряється нативною схемою OpenClaw plugin, якщо вона доступна).
- `plugins.entries.firecrawl.config.webFetch`: налаштування провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Повертається до `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` або env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягати зі сторінок лише основний вміст (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут scrape-запиту в секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: налаштування xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдера X Search.
  - `model`: модель Grok для пошуку (наприклад `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: налаштування memory dreaming (експериментально). Про фази й пороги див. [Dreaming](/uk/concepts/dreaming).
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: cron cadence для кожного повного проходу dreaming (`"0 3 * * *"` за замовчуванням).
  - політика фаз і пороги — це деталі реалізації (не користувацькі ключі конфігурації).
- Увімкнені Claude bundle plugins також можуть додавати вбудовані типові налаштування Pi з `settings.json`; OpenClaw застосовує їх як санітизовані налаштування агентів, а не як сирі патчі конфігурації OpenClaw.
- `plugins.sl