---
read_when:
    - Вам потрібна точна семантика або значення за замовчуванням для полів конфігурації
    - Ви перевіряєте блоки конфігурації каналів, моделей, шлюзу або інструментів
summary: Повний довідник для кожного ключа конфігурації OpenClaw, значень за замовчуванням і налаштувань каналів
title: Довідник з конфігурації
x-i18n:
    generated_at: "2026-04-06T15:34:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7768cb77e1d3fc483c66f655ea891d2c32f21b247e3c1a56a919b28a37f9b128
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Довідник з конфігурації

Кожне поле, доступне в `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Configuration](/uk/gateway/configuration).

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні значення за замовчуванням, якщо їх пропущено.

---

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не вказано `enabled: false`).

### Доступ до приватних повідомлень і груп

Усі канали підтримують політики для приватних повідомлень і груп:

| Політика DM         | Поведінка                                                     |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники з `allowFrom` (або зі сховища дозволів сполучення) |
| `open`              | Дозволити всі вхідні приватні повідомлення (потребує `allowFrom: ["*"]`) |
| `disabled`          | Ігнорувати всі вхідні приватні повідомлення                   |

| Політика груп        | Поведінка                                              |
| -------------------- | ------------------------------------------------------ |
| `allowlist` (типово) | Лише групи, що відповідають налаштованому списку дозволених |
| `open`               | Обійти списки дозволених груп (фільтрація за згадуваннями все одно застосовується) |
| `disabled`           | Блокувати всі повідомлення в групах/кімнатах           |

<Note>
`channels.defaults.groupPolicy` встановлює значення за замовчуванням, коли `groupPolicy` у провайдера не задано.
Коди сполучення спливають через 1 годину. Кількість очікуваних запитів на сполучення DM обмежена **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп у runtime повертається до `allowlist` (закрито за замовчуванням) із попередженням під час запуску.
</Note>

### Перевизначення моделі для каналів

Використовуйте `channels.modelByChannel`, щоб закріпити конкретні ідентифікатори каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Відображення каналу застосовується, коли сесія ще не має перевизначення моделі (наприклад, встановленого через `/model`).

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

### Типові значення для каналів і heartbeat

Використовуйте `channels.defaults` для спільної поведінки політики груп і heartbeat у різних провайдерів:

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

- `channels.defaults.groupPolicy`: резервна політика груп, коли `groupPolicy` на рівні провайдера не задано.
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь контекст цитат/гілок/історії), `allowlist` (включати контекст лише від відправників зі списку дозволених), `allowlist_quote` (як `allowlist`, але зберігати явний контекст цитати/відповіді). Перевизначення для каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати здорові стани каналів у вивід heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати деградовані/помилкові стани у вивід heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал шлюзу (Baileys Web). Він запускається автоматично, коли існує пов’язана сесія.

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він існує; інакше — перший налаштований `account id` (відсортований).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.
- Застарілий каталог автентифікації Baileys для одного облікового запису переноситься `openclaw doctor` у `whatsapp/default`.
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
      streaming: "partial", // off | partial | block | progress (типово: off; явно вмикайте, щоб уникнути обмежень rate limit на попередній перегляд і редагування)
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; симлінки відхиляються), з `TELEGRAM_BOT_TOKEN` як резервом для облікового запису за замовчуванням.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.
- У багатооблікових конфігураціях (2+ `account id`) задайте явний типово вибраний обліковий запис (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, якщо цього немає або значення невалідне.
- `configWrites: false` блокує ініційовані Telegram записи в конфігурацію (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив’язки для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Попередній перегляд стриму в Telegram використовує `sendMessage` + `editMessageText` (працює в приватних і групових чатах).
- Політика повторних спроб: див. [Retry policy](/uk/concepts/retry).

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

- Токен: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як резервом для облікового запису за замовчуванням.
- Прямі вихідні виклики, які явно передають Discord `token`, використовують цей токен для виклику; налаштування повторних спроб/політик для облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) як цілі доставки; прості числові ID відхиляються.
- Slug-и guild мають бути в нижньому регістрі з пробілами, заміненими на `-`; ключі каналів використовують slug-ім’я (без `#`). Віддавайте перевагу ID guild.
- Повідомлення, створені ботами, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення від ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення на рівні каналу) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (крім @everyone/@here).
- `maxLinesPerMessage` (типово 17) розбиває високі повідомлення навіть якщо вони менші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією, прив’язаною до гілок Discord:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до гілок (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного unfocus через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: прапорець opt-in для автоматичного створення/прив’язки гілок через `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні ACP-прив’язки для каналів і гілок (використовуйте channel/thread id у `match.peer.id`). Семантика полів спільна з [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` встановлює акцентний колір для контейнерів Discord components v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + TTS.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` напряму передаються в параметри DAVE `@discordjs/voice` (типово `true` і `24`).
- OpenClaw також намагається відновити прийом голосу, виходячи й знову приєднуючись до голосової сесії після повторних помилок дешифрування.
- `channels.discord.streaming` — канонічний ключ режиму стриму. Застарілі значення `streamMode` і булеві `streaming` автоматично мігруються.
- `channels.discord.autoPresence` відображає доступність runtime у присутність бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінним ім’ям/тегом (режим сумісності break-glass).
- `channels.discord.execApprovals`: доставка схвалень exec у нативному форматі Discord та авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати exec-запити. Якщо не вказано, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Якщо не вказано, пересилаються схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово) надсилає у DM схвалювачам, `"channel"` — у вихідний канал, `"both"` — в обидва місця. Коли `target` включає `"channel"`, кнопки можуть використовувати лише визначені схвалювачі.
  - `cleanupAfterResolve`: якщо `true`, видаляє DM зі схваленням після схвалення, відхилення або тайм-ауту.

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

- JSON облікового запису сервісу: вбудований (`serviceAccount`) або через файл (`serviceAccountFile`).
- Також підтримується SecretRef для облікового запису сервісу (`serviceAccountRef`).
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
      streaming: "partial", // off | partial | block | progress (режим попереднього перегляду)
      nativeStreaming: true, // використовувати нативний Slack streaming API, коли streaming=partial
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

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як резерв із env для облікового запису за замовчуванням).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (у корені або на рівні облікового запису).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack показують поля джерела/статусу для кожного облікового запису, такі як
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштований через SecretRef, але поточний шлях команди/runtime не зміг
  отримати значення секрету.
- `configWrites: false` блокує ініційовані Slack записи в конфігурацію.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.
- `channels.slack.streaming` — канонічний ключ режиму стриму. Застарілі значення `streamMode` і булеві `streaming` автоматично мігруються.
- Використовуйте `user:<id>` (DM) або `channel:<id>` як цілі доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

**Ізоляція сесій у гілках:** `thread.historyScope` — на рівні гілки (типово) або спільна в межах каналу. `thread.inheritParent` копіює транскрипт батьківського каналу в нові гілки.

- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім прибирає її після завершення. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: доставка схвалень exec у нативному форматі Slack та авторизація схвалювачів. Та сама схема, що й для Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій   | Типово  | Примітки               |
| ----------- | ------- | ---------------------- |
| reactions   | увімкнено | Реагувати + перелік реакцій |
| messages    | увімкнено | Читати/надсилати/редагувати/видаляти |
| pins        | увімкнено | Закріпити/відкріпити/перелік |
| memberInfo  | увімкнено | Інформація про учасника |
| emojiList   | увімкнено | Список кастомних emoji |

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
        // Необов’язковий явний URL для reverse proxy/публічних розгортань
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Режими чату: `oncall` (відповідати на @-згадування, типово), `onmessage` (на кожне повідомлення), `onchar` (на повідомлення, що починаються з префікса-тригера).

Коли увімкнені нативні команди Mattermost:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повним URL.
- `commands.callbackUrl` має вказувати на endpoint шлюзу OpenClaw і бути досяжним із сервера Mattermost.
- Нативні callback-и slash-команд автентифікуються за допомогою токенів кожної команди, які
  Mattermost повертає під час реєстрації slash-команд. Якщо реєстрація не вдасться або жодні
  команди не будуть активовані, OpenClaw відхилить callback-и з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів callback-ів Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен callback-а.
  Використовуйте значення хоста/домену, а не повні URL.
- `channels.mattermost.configWrites`: дозволяти або забороняти ініційовані Mattermost записи в конфігурацію.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення фільтрації за згадуваннями для окремого каналу (`"*"` для типового значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.

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

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

- `channels.signal.account`: закріпити запуск каналу за конкретною ідентичністю облікового запису Signal.
- `channels.signal.configWrites`: дозволяти або забороняти ініційовані Signal записи в конфігурацію.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (на основі plugin, налаштовується під `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, керування групами й розширені дії:
      // див. /channels/bluebubbles
    },
  },
}
```

- Основні шляхи ключів, описані тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних ACP-сесій. Використовуйте BlueBubbles handle або target string (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- Повна конфігурація каналу BlueBubbles описана в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC поверх stdio). Демон або порт не потрібні.

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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.

- Потребує Full Disk Access до БД Messages.
- Віддавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тож переконайтеся, що ключ relay-хоста вже є в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволяти або забороняти ініційовані iMessage записи в конфігурацію.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних ACP-сесій. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH-обгортки для iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix працює через extension і налаштовується під `channels.matrix`.

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

- Автентифікація за токеном використовує `accessToken`; автентифікація за паролем — `userId` + `password`.
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явний HTTP(S) proxy. Іменовані облікові записи можуть перевизначити його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і цей opt-in для мережі — незалежні елементи керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у багатооблікових конфігураціях.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати й нові запрошення в стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: доставка схвалень exec у нативному форматі Matrix та авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати exec-запити.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Якщо не вказано, пересилаються схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово), `"channel"` (вихідна кімната) або `"both"`.
  - Перевизначення на рівні облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (типово) спільно використовує сесію за маршрутизованим peer, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки статусу Matrix і живі пошуки в каталозі використовують ту саму політику proxy, що й runtime-трафік.
- Повна конфігурація Matrix, правила адресації та приклади налаштування описані в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams працює через extension і налаштовується під `channels.msteams`.

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

- Основні шляхи ключів, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повна конфігурація Teams (облікові дані, webhook, політика DM/груп, перевизначення для команди/каналу) описана в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC працює через extension і налаштовується під `channels.irc`.

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

- Основні шляхи ключів, описані тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він збігається з налаштованим `account id`.
- Повна конфігурація каналу IRC (host/port/TLS/channels/allowlists/фільтрація за згадуваннями) описана в [IRC](/uk/channels/irc).

### Багатообліковість (усі канали)

Запускайте кілька облікових записів на канал (кожен зі своїм `accountId`):

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
- Токени з env застосовуються лише до облікового запису **default**.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо не перевизначені на рівні облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте не-типовий обліковий запис через `openclaw channels add` (або онбординг каналу), коли ще використовується однокористувацька конфігурація верхнього рівня, OpenClaw спочатку переносить значення верхнього рівня, що стосуються одного облікового запису, у карту облікових записів каналу, щоб оригінальний обліковий запис продовжив працювати. Для більшості каналів вони переміщуються в `channels.<channel>.accounts.default`; Matrix може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише каналу (без `accountId`) і далі збігаються з обліковим записом за замовчуванням; прив’язки на рівні облікового запису лишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня, що належать одному обліковому запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix може зберегти наявну відповідну іменовану/типову ціль.

### Інші extension-канали

Багато extension-каналів налаштовуються як `channels.<id>` і описані на окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Повний індекс каналів: [Channels](/uk/channels).

### Фільтрація за згадуваннями в групових чатах

Для групових повідомлень типово **потрібна згадка** (метадані згадки або безпечні regex-патерни). Це стосується групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

**Типи згадок:**

- **Metadata mentions**: нативні @-згадки платформи. Ігноруються в режимі self-chat у WhatsApp.
- **Text patterns**: безпечні regex-патерни в `agents.list[].groupChat.mentionPatterns`. Невалідні патерни й небезпечні вкладені повторення ігноруються.
- Фільтрація за згадуваннями застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один патерн).

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

`messages.groupChat.historyLimit` встановлює глобальне значення за замовчуванням. Канали можуть перевизначити його через `channels.<channel>.historyLimit` (або на рівні облікового запису). Задайте `0`, щоб вимкнути.

#### Ліміти історії для DM

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

Розв’язання: перевизначення для конкретного DM → типове значення провайдера → без ліміту (зберігається все).

Підтримуються: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте власний номер до `allowFrom`, щоб увімкнути режим self-chat (ігнорує нативні @-згадки, відповідає лише на текстові патерни):

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
    native: "auto", // реєструвати нативні команди, коли підтримується
    text: true, // розбирати /commands у повідомленнях чату
    bash: false, // дозволити ! (аліас: /bash)
    bashForegroundMs: 2000,
    config: false, // дозволити /config
    debug: false, // дозволити /debug
    restart: false, // дозволити /restart + інструмент перезапуску шлюзу
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Деталі команд">

- Текстові команди мають бути **окремими** повідомленнями, що починаються з `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, але залишає Slack вимкненим.
- Перевизначення для каналу: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- `channels.telegram.customCommands` додає додаткові пункти меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для shell хоста. Потребує `tools.elevated.enabled` і того, щоб відправник був у `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів шлюзу `chat.send` постійні записи через `/config set|unset` також потребують `operator.admin`; read-only `/config show` лишається доступним для звичайних операторських клієнтів із правом запису.
- `channels.<provider>.configWrites` керує мутаціями конфігурації на рівні каналу (типово: true).
- Для багатооблікових каналів `channels.<provider>.accounts.<id>.configWrites` також керує записами, націленими на цей обліковий запис (наприклад `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` задається для кожного провайдера. Якщо вказано, це **єдине** джерело авторизації (списки дозволених/сполучення каналу і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики access group, коли `allowFrom` не задано.

</Accordion>

---

## Типові значення агентів

### `agents.defaults.workspace`

Типове значення: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Необов’язковий корінь репозиторію, який показується в рядку Runtime системного prompt-а. Якщо не задано, OpenClaw автоматично визначає його, підіймаючись угору від workspace.

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

- Пропустіть `agents.defaults.skills`, щоб типово дозволити всі Skills без обмежень.
- Пропустіть `agents.list[].skills`, щоб успадкувати типові значення.
- Задайте `agents.list[].skills: []`, щоб не було жодних Skills.
- Непорожній список `agents.list[].skills` є кінцевим набором для цього агента; він
  не об’єднується з типовими значеннями.

### `agents.defaults.skipBootstrap`

Вимикає автоматичне створення bootstrap-файлів workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Керує тим, коли bootstrap-файли workspace вставляються в системний prompt. Типове значення: `"always"`.

- `"continuation-skip"`: безпечні ходи продовження (після завершеної відповіді асистента) пропускають повторну вставку bootstrap workspace, зменшуючи розмір prompt-а. Запуски heartbeat і повторні спроби після compaction усе одно перебудовують контекст.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Максимальна кількість символів на bootstrap-файл workspace перед обрізанням. Типове значення: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Максимальна загальна кількість символів, що вставляються з усіх bootstrap-файлів workspace. Типове значення: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Керує видимим для агента текстом попередження, коли bootstrap-контекст обрізається.
Типове значення: `"once"`.

- `"off"`: ніколи не вставляти текст попередження в системний prompt.
- `"once"`: вставляти попередження один раз для кожного унікального сигнатурного обрізання (рекомендовано).
- `"always"`: вставляти попередження під час кожного запуску, коли є обрізання.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Максимальний розмір у пікселях для найдовшого боку зображення в блоках зображень транскрипту/інструментів перед викликами провайдера.
Типове значення: `1200`.

Менші значення зазвичай зменшують використання vision-токенів і розмір payload запиту для запусків із великою кількістю скріншотів.
Більші значення зберігають більше візуальних деталей.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Часовий пояс для контексту системного prompt-а (не для часових позначок повідомлень). Якщо не задано, використовується часовий пояс хоста.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Формат часу в системному prompt-і. Типове значення: `auto` (налаштування ОС).

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

- `model`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Рядкова форма задає лише основну модель.
  - Об’єктна форма задає основну модель плюс впорядковані резервні моделі.
- `imageModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується шляхом інструмента `image` як конфігурація vision-моделі.
  - Також використовується для резервної маршрутизації, коли вибрана/типова модель не може приймати вхідні зображення.
- `imageGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації зображень і будь-якою майбутньою поверхнею tool/plugin, що генерує зображення.
  - Типові значення: `google/gemini-3.1-flash-image-preview` для нативної генерації зображень Gemini, `fal/fal-ai/flux/dev` для fal або `openai/gpt-image-1` для OpenAI Images.
  - Якщо ви напряму вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/API key для провайдера (наприклад `GEMINI_API_KEY` або `GOOGLE_API_KEY` для `google/*`, `OPENAI_API_KEY` для `openai/*`, `FAL_KEY` для `fal/*`).
  - Якщо поле пропущено, `image_generate` усе одно може вивести типового провайдера з доступною автентифікацією. Спочатку воно пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id.
- `musicGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації музики та вбудованим інструментом `music_generate`.
  - Типові значення: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` або `minimax/music-2.5+`.
  - Якщо поле пропущено, `music_generate` усе одно може вивести типового провайдера з доступною автентифікацією. Спочатку воно пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації музики у порядку provider-id.
  - Якщо ви напряму вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/API key для провайдера.
- `videoGenerationModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується спільною можливістю генерації відео та вбудованим інструментом `video_generate`.
  - Типові значення: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` або `qwen/wan2.7-r2v`.
  - Якщо поле пропущено, `video_generate` усе одно може вивести типового провайдера з доступною автентифікацією. Спочатку воно пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації відео у порядку provider-id.
  - Якщо ви напряму вибираєте `provider/model`, також налаштуйте відповідну автентифікацію/API key для провайдера.
  - Вбудований провайдер генерації відео Qwen наразі підтримує до 1 вихідного відео, 1 вхідного зображення, 4 вхідних відео, тривалість 10 секунд і параметри рівня провайдера `size`, `aspectRatio`, `resolution`, `audio` та `watermark`.
- `pdfModel`: приймає або рядок (`"provider/model"`), або об’єкт (`{ primary, fallbacks }`).
  - Використовується інструментом `pdf` для маршрутизації моделей.
  - Якщо поле пропущено, інструмент PDF повертається до `imageModel`, а потім до розв’язаної моделі сесії/типової моделі.
- `pdfMaxBytesMb`: типовий ліміт розміру PDF для інструмента `pdf`, коли `maxBytesMb` не передано під час виклику.
- `pdfMaxPages`: типова максимальна кількість сторінок, які враховуються в режимі резервного витягування в інструменті `pdf`.
- `verboseDefault`: типовий рівень verbose для агентів. Значення: `"off"`, `"on"`, `"full"`. Типове значення: `"off"`.
- `elevatedDefault`: типовий рівень elevated output для агентів. Значення: `"off"`, `"on"`, `"ask"`, `"full"`. Типове значення: `"on"`.
- `model.primary`: формат `provider/model` (наприклад `openai/gpt-5.4`). Якщо ви пропустите провайдера, OpenClaw спершу спробує alias, потім унікальний збіг серед налаштованих провайдерів для цього точного model id, і лише після цього повернеться до типового налаштованого провайдера (застаріла поведінка сумісності, тому краще вказувати явний `provider/model`). Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw переходить до першого налаштованого provider/model замість того, щоб показувати застаріле типове значення з видаленого провайдера.
- `models`: налаштований каталог моделей і список дозволених для `/model`. Кожен запис може містити `alias` (скорочення) і `params` (специфічні для провайдера, наприклад `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: глобальні типові параметри провайдера, застосовані до всіх моделей. Задаються в `agents.defaults.params` (наприклад `{ cacheRetention: "long" }`).
- Пріоритет злиття `params` (конфігурація): `agents.defaults.params` (глобальна база) перевизначається `agents.defaults.models["provider/model"].params` (для конкретної моделі), а потім `agents.list[].params` (для відповідного id агента) перевизначає за ключем. Подробиці див. у [Prompt Caching](/uk/reference/prompt-caching).
- Засоби запису конфігурації, які мутують ці поля (наприклад `/models set`, `/models set-image` і команди додавання/видалення fallback), зберігають канонічну форму об’єкта і за можливості зберігають наявні списки fallback.
- `maxConcurrent`: максимальна кількість паралельних запусків агентів між сесіями (кожна сесія все одно серіалізується). Типове значення: 4.

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

Моделі Z.AI GLM-4.x автоматично вмикають режим thinking, якщо ви не встановите `--thinking off` або самі не визначите `agents.defaults.models["zai/<model>"].params.thinking`.
Моделі Z.AI типово вмикають `tool_stream` для стримінгу викликів інструментів. Встановіть `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
Моделі Anthropic Claude 4.6 типово використовують thinking `adaptive`, коли явний рівень thinking не задано.

### `agents.defaults.cliBackends`

Необов’язкові CLI backends для резервних запусків лише з текстом (без викликів інструментів). Корисно як запасний варіант, коли API-провайдери не працюють.

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

- CLI backends орієнтовані на текст; інструменти завжди вимкнені.
- Сесії підтримуються, коли задано `sessionArg`.
- Передавання зображень підтримується, коли `imageArg` приймає шляхи до файлів.

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
        lightContext: false, // типово: false; true залишає лише HEARTBEAT.md із bootstrap-файлів workspace
        isolatedSession: false, // типово: false; true запускає кожен heartbeat у новій сесії (без історії розмови)
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

- `every`: рядок тривалості (ms/s/m/h). Типове значення: `30m` (автентифікація через API key) або `1h` (автентифікація через OAuth). Встановіть `0m`, щоб вимкнути.
- `suppressToolErrorWarnings`: якщо true, пригнічує payload-и з попередженнями про помилки інструментів під час запусків heartbeat.
- `directPolicy`: політика прямої/DM-доставки. `allow` (типово) дозволяє доставку на пряму ціль. `block` пригнічує доставку на пряму ціль і повертає `reason=dm-blocked`.
- `lightContext`: якщо true, heartbeat-запуски використовують полегшений bootstrap-контекст і зберігають лише `HEARTBEAT.md` із bootstrap-файлів workspace.
- `isolatedSession`: якщо true, кожен heartbeat запускається в новій сесії без попередньої історії розмови. Та сама схема ізоляції, що й у cron `sessionTarget: "isolated"`. Зменшує витрати токенів на heartbeat приблизно зі ~100K до ~2-5K токенів.
- Для окремого агента: задайте `agents.list[].heartbeat`. Коли будь-який агент визначає `heartbeat`, heartbeat запускається **лише для цих агентів**.
- Heartbeat виконує повні ходи агента — коротші інтервали спалюють більше токенів.

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
        identifierInstructions: "Точно зберігай deployment ID, ticket ID і пари host:port.", // використовується, коли identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] вимикає повторну вставку
        model: "openrouter/anthropic/claude-sonnet-4-6", // необов’язкове перевизначення моделі лише для compaction
        notifyUser: true, // надсилати коротке повідомлення, коли починається compaction (типово: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Сесія наближається до compaction. Збережи тривалі спогади зараз.",
          prompt: "Запиши будь-які довготривалі нотатки в memory/YYYY-MM-DD.md; відповідай точним silent token NO_REPLY, якщо зберігати нічого.",
        },
      },
    },
  },
}
```

- `mode`: `default` або `safeguard` (підсумовування шматками для довгої історії). Див. [Compaction](/uk/concepts/compaction).
- `timeoutSeconds`: максимальна кількість секунд, дозволених для однієї операції compaction, після чого OpenClaw її перериває. Типове значення: `900`.
- `identifierPolicy`: `strict` (типово), `off` або `custom`. `strict` додає вбудовані вказівки зі збереження непрозорих ідентифікаторів під час підсумовування compaction.
- `identifierInstructions`: необов’язковий користувацький текст для збереження ідентифікаторів, що використовується, коли `identifierPolicy=custom`.
- `postCompactionSections`: необов’язкові назви секцій H2/H3 у AGENTS.md, які повторно вставляються після compaction. Типово `["Session Startup", "Red Lines"]`; встановіть `[]`, щоб вимкнути повторну вставку. Якщо не задано або явно задано цю типову пару, старі заголовки `Every Session`/`Safety` також приймаються як legacy fallback.
- `model`: необов’язкове перевизначення `provider/model-id` лише для підсумовування compaction. Використовуйте це, коли основна сесія має лишатися на одній моделі, а підсумки compaction мають створюватися на іншій; якщо не задано, compaction використовує основну модель сесії.
- `notifyUser`: якщо `true`, надсилає користувачу коротке повідомлення, коли починається compaction (наприклад, "Compacting context..."). Типово вимкнено, щоб compaction відбувався тихо.
- `memoryFlush`: тихий агентний хід перед auto-compaction для збереження довготривалих спогадів. Пропускається, коли workspace доступний лише для читання.

### `agents.defaults.contextPruning`

Обрізає **старі результати інструментів** з контексту в пам’яті перед надсиланням до LLM. **Не** змінює історію сесії на диску.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // тривалість (ms/s/m/h), одиниця за замовчуванням: хвилини
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
- Обрізання спочатку м’яко підрізає завеликі результати інструментів, а потім за потреби повністю очищає старіші результати інструментів.

**М’яке обрізання** зберігає початок + кінець і вставляє `...` посередині.

**Жорстке очищення** замінює весь результат інструмента на заповнювач.

Примітки:

- Блоки зображень ніколи не обрізаються/не очищаються.
- Співвідношення базуються на символах (приблизно), а не на точній кількості токенів.
- Якщо існує менше ніж `keepLastAssistants` повідомлень асистента, обрізання пропускається.

</Accordion>

Деталі поведінки див. у [Session Pruning](/uk/concepts/session-pruning).

### Блочний стримінг

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (використовує minMs/maxMs)
    },
  },
}
```

- Канали, відмінні від Telegram, потребують явного `*.blockStreaming: true`, щоб увімкнути блочні відповіді.
- Перевизначення для каналу: `channels.<channel>.blockStreamingCoalesce` (і варіанти на рівні облікового запису). Signal/Slack/Discord/Google Chat типово використовують `minChars: 1500`.
- `humanDelay`: випадкова пауза між блочними відповідями. `natural` = 800–2500ms. Перевизначення для агента: `agents.list[].humanDelay`.

Деталі поведінки та розбиття на частини див. у [Streaming](/uk/concepts/streaming).

### Індикатори введення

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

Див. [Typing Indicators](/uk/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Необов’язкова sandbox-ізоляція для вбудованого агента. Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing).

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
          // Також підтримуються SecretRef / вбудований вміст:
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

**Конфігурація SSH backend:**

- `target`: SSH-ціль у форматі `user@host[:port]`
- `command`: команда SSH-клієнта (типово: `ssh`)
- `workspaceRoot`: абсолютний віддалений корінь, який використовується для workspace кожного scope
- `identityFile` / `certificateFile` / `knownHostsFile`: наявні локальні файли, передані в OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: вбудований вміст або SecretRef, який OpenClaw матеріалізує у тимчасові файли під час runtime
- `strictHostKeyChecking` / `updateHostKeys`: параметри політики ключів хоста OpenSSH

**Пріоритет SSH auth:**

- `identityData` має пріоритет над `identityFile`
- `certificateData` має пріоритет над `certificateFile`
- `knownHostsData` має пріоритет над `knownHostsFile`
- Значення `*Data`, що використовують SecretRef, розв’язуються з активного знімка runtime секретів до початку sandbox-сесії

**Поведінка SSH backend:**

- один раз ініціалізує віддалений workspace після створення або перевідтворення
- після цього підтримує віддалений SSH workspace як канонічний
- маршрутизує `exec`, файлові інструменти й шляхи медіа через SSH
- не синхронізує віддалені зміни назад на хост автоматично
- не підтримує browser-контейнери в sandbox

**Доступ до workspace:**

- `none`: sandbox workspace для кожного scope під `~/.openclaw/sandboxes`
- `ro`: sandbox workspace у `/workspace`, workspace агента монтується як лише для читання в `/agent`
- `rw`: workspace агента монтується з читанням/записом у `/workspace`

**Scope:**

- `session`: окремий контейнер + workspace на сесію
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
          gateway: "lab", // необов’язково
          gatewayEndpoint: "https://lab.example", // необов’язково
          policy: "strict", // необов’язковий ID політики OpenShell
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

- `mirror`: ініціалізує віддалене середовище з локального перед exec, синхронізує назад після exec; локальний workspace лишається канонічним
- `remote`: один раз ініціалізує віддалене середовище, коли sandbox створюється, а далі віддалений workspace лишається канонічним

У режимі `remote` зміни на хості, зроблені локально поза OpenClaw, не синхронізуються в sandbox автоматично після етапу ініціалізації.
Транспорт — SSH у sandbox OpenShell, але plugin керує життєвим циклом sandbox та необов’язковою mirror-синхронізацією.

**`setupCommand`** виконується один раз після створення контейнера (через `sh -lc`). Потребує виходу в мережу, записуваного root і користувача root.

**Контейнери типово використовують `network: "none"`** — задайте `"bridge"` (або власну bridge-мережу), якщо агенту потрібен вихід назовні.
`"host"` блокується. `"container:<id>"` типово блокується, якщо ви явно не встановите
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Вхідні вкладення** тимчасово розміщуються в `media/inbound/*` в активному workspace.

**`docker.binds`** монтує додаткові каталоги хоста; глобальні прив’язки та прив’язки на рівні агента об’єднуються.

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP у контейнері. URL noVNC вставляється в системний prompt. Не потребує `browser.enabled` у `openclaw.json`.
Доступ для спостереження через noVNC типово використовує VNC auth, і OpenClaw видає короткоживучий token URL (замість того, щоб показувати пароль у спільному URL).

- `allowHostControl: false` (типово) блокує sandbox-сесіям доступ до браузера хоста.
- `network` типово дорівнює `openclaw-sandbox-browser` (окрема bridge-мережа). Встановлюйте `bridge` лише тоді, коли вам явно потрібна глобальна bridge-зв’язність.
- `cdpSourceRange` необов’язково обмежує доступ до CDP на межі контейнера діапазоном CIDR (наприклад `172.21.0.1/32`).
- `sandbox.browser.binds` монтує додаткові каталоги хоста лише в контейнер sandbox browser. Якщо задано (включно з `[]`), замінює `docker.binds` для browser-контейнера.
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
    типово увімкнені, їх можна вимкнути за допомогою
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, якщо для WebGL/3D це потрібно.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` знову вмикає extensions, якщо ваш робочий процес
    залежить від них.
  - `--renderer-process-limit=2` можна змінити через
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; задайте `0`, щоб використовувати
    типове обмеження Chromium.
  - а також `--no-sandbox` і `--disable-setuid-sandbox`, коли ввімкнено `noSandbox`.
  - Типові значення — це базова конфігурація образу контейнера; використовуйте власний browser image з власним
    entrypoint, щоб змінити типові параметри контейнера.

</Accordion>

Browser sandboxing і `sandbox.docker.binds` наразі працюють лише з Docker.

Зібрати образи:

```bash
scripts/sandbox-setup.sh           # основний sandbox image
scripts/sandbox-browser-setup.sh   # необов’язковий browser image
```

### `agents.list` (перевизначення на рівні агента)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Головний агент",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // або { primary, fallbacks }
        thinkingDefault: "high", // перевизначення рівня thinking для агента
        reasoningDefault: "on", // перевизначення видимості reasoning для агента
        fastModeDefault: false, // перевизначення fast mode для агента
        params: { cacheRetention: "none" }, // перевизначає відповідні defaults.models params за ключем
        skills: ["docs-search"], // замінює agents.defaults.skills, коли задано
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
- `default`: якщо задано для кількох, перший перемагає (у лог записується попередження). Якщо не задано ніде, типовим є перший елемент списку.
- `model`: рядкова форма перевизначає лише `primary`; об’єктна форма `{ primary, fallbacks }` перевизначає обидва (`[]` вимикає глобальні fallback-и). Cron jobs, які перевизначають лише `primary`, усе одно успадковують типові fallback-и, якщо ви не встановите `fallbacks: []`.
- `params`: параметри потоку на рівні агента, які зливаються поверх вибраного запису моделі в `agents.defaults.models`. Використовуйте це для специфічних для агента перевизначень на кшталт `cacheRetention`, `temperature` або `maxTokens`, не дублюючи весь каталог моделей.
- `skills`: необов’язковий список дозволених Skills для агента. Якщо не задано, агент успадковує `agents.defaults.skills`, коли їх задано; явний список замінює типові значення замість злиття, а `[]` означає відсутність Skills.
- `thinkingDefault`: необов’язковий типовий рівень thinking для агента (`off | minimal | low | medium | high | xhigh | adaptive`). Перевизначає `agents.defaults.thinkingDefault` для цього агента, коли не задано перевизначення на рівні повідомлення або сесії.
- `reasoningDefault`: необов’язкове типове значення видимості reasoning (`on | off | stream`). Застосовується, коли не задано перевизначення reasoning на рівні повідомлення або сесії.
- `fastModeDefault`: необов’язкове типове значення fast mode (`true | false`). Застосовується, коли не задано перевизначення fast mode на рівні повідомлення або сесії.
- `runtime`: необов’язковий дескриптор runtime на рівні агента. Використовуйте `type: "acp"` з типовими значеннями `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), коли агент має типово використовувати ACP harness sessions.
- `identity.avatar`: шлях відносно workspace, `http(s)` URL або `data:` URI.
- `identity` виводить типові значення: `ackReaction` з `emoji`, `mentionPatterns` з `name`/`emoji`.
- `subagents.allowAgents`: список дозволених ID агентів для `sessions_spawn` (`["*"]` = будь-який; типово: лише той самий агент).
- Захист успадкування sandbox: якщо сесія-запитувач ізольована в sandbox, `sessions_spawn` відхиляє цілі, які запускалися б без sandbox.
- `subagents.requireAgentId`: коли true, блокує виклики `sessions_spawn` без `agentId` (примушує явно вибирати профіль; типово false).

---

## Багатоагентна маршрутизація

Запускайте кілька ізольованих агентів в одному Gateway. Див. [Multi-Agent](/uk/concepts/multi-agent).

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

### Поля збігу прив’язки

- `type` (необов’язково): `route` для звичайної маршрутизації (відсутній `type` за замовчуванням означає route), `acp` для постійних ACP-прив’язок розмов.
- `match.channel` (обов’язково)
- `match.accountId` (необов’язково; `*` = будь-який обліковий запис; пропущено = обліковий запис за замовчуванням)
- `match.peer` (необов’язково; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (необов’язково; специфічно для каналу)
- `acp` (необов’язково; лише для `type: "acp"`): `{ mode, label, cwd, backend }`

**Детермінований порядок збігу:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (точний, без peer/guild/team)
5. `match.accountId: "*"` (на весь канал)
6. Агент за замовчуванням

У межах кожного рівня перемагає перший відповідний запис `bindings`.

Для записів `type: "acp"` OpenClaw виконує пошук за точною ідентичністю розмови (`match.channel` + account + `match.peer.id`) і не використовує вищенаведений рівневий порядок прив’язок route.

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

Подробиці пріоритетів див. у [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

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
    parentForkMaxTokens: 100000, // пропустити fork від батьківської гілки вище цього числа токенів (0 вимикає)
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

- **`scope`**: базова стратегія групування сесій для контекстів групових чатів.
  - `per-sender` (типово): кожен відправник отримує ізольовану сесію в межах контексту каналу.
  - `global`: усі учасники в контексті каналу спільно використовують одну сесію (використовуйте лише коли потрібен спільний контекст).
- **`dmScope`**: як групуються DM.
  - `main`: усі DM спільно використовують основну сесію.
  - `per-peer`: ізоляція за ID відправника між каналами.
  - `per-channel-peer`: ізоляція за каналом + відправником (рекомендовано для багатоадресних inbox).
  - `per-account-channel-peer`: ізоляція за обліковим записом + каналом + відправником (рекомендовано для багатооблікових конфігурацій).
- **`identityLinks`**: відображення канонічних ID на peers із префіксом провайдера для спільного використання сесій між каналами.
- **`reset`**: основна політика скидання. `daily` скидає о `atHour` за локальним часом; `idle` скидає після `idleMinutes`. Якщо налаштовано обидва, спрацьовує той, що спливає першим.
- **`resetByType`**: перевизначення за типом (`direct`, `group`, `thread`). Застарілий `dm` приймається як alias для `direct`.
- **`parentForkMaxTokens`**: максимальний `totalTokens` батьківської сесії, дозволений під час створення forked thread session (типово `100000`).
  - Якщо батьківський `totalTokens` вищий за це значення, OpenClaw запускає нову thread session замість успадкування історії транскрипту батьківської сесії.
  - Встановіть `0`, щоб вимкнути цей захист і завжди дозволяти форк від батьківської сесії.
- **`mainKey`**: застаріле поле. Runtime тепер завжди використовує `"main"` для основного кошика direct-chat.
- **`agentToAgent.maxPingPongTurns`**: максимальна кількість взаємних ходів відповіді між агентами під час agent-to-agent обміну (ціле число, діапазон: `0`–`5`). `0` вимикає ping-pong chaining.
- **`sendPolicy`**: збіг за `channel`, `chatType` (`direct|group|channel`, з legacy alias `dm`), `keyPrefix` або `rawKeyPrefix`. Перша заборона перемагає.
- **`maintenance`**: керування очищенням і зберіганням session store.
  - `mode`: `warn` лише виводить попередження; `enforce` застосовує очищення.
  - `pruneAfter`: віковий поріг для застарілих записів (типово `30d`).
  - `maxEntries`: максимальна кількість записів у `sessions.json` (типово `500`).
  - `rotateBytes`: ротує `sessions.json`, коли його розмір перевищує це значення (типово `10mb`).
  - `resetArchiveRetention`: термін зберігання архівів транскриптів `*.reset.<timestamp>`. Типово дорівнює `pruneAfter`; встановіть `false`, щоб вимкнути.
  - `maxDiskBytes`: необов’язковий бюджет диска для каталогу сесій. У режимі `warn` лише логує попередження; у режимі `enforce` спочатку видаляє найстаріші артефакти/сесії.
  - `highWaterBytes`: необов’язкова ціль після очищення бюджету. Типово `80%` від `maxDiskBytes`.
- **`threadBindings`**: глобальні типові значення для функцій сесій, прив’язаних до гілок.
  - `enabled`: головний прапорець за замовчуванням (провайдери можуть перевизначити; Discord використовує `channels.discord.threadBindings.enabled`)
  - `idleHours`: типове автоматичне unfocus через неактивність у годинах (`0` вимикає; провайдери можуть перевизначити)
  - `maxAgeHours`: типовий жорсткий максимальний вік у годинах (`0` вимикає; провайдери можуть перевизначити)

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

Перевизначення на рівні каналу/облікового запису: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Розв’язання (перемагає найконкретніше): account → channel → global. `""` вимикає й зупиняє каскад. `"auto"` виводить `[{identity.name}]`.

**Шаблонні змінні:**

| Змінна            | Опис                  | Приклад                     |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | Коротка назва моделі  | `claude-opus-4-6`           |
| `{modelFull}`     | Повний ідентифікатор моделі | `anthropic/claude-opus-4-6` |
| `{provider}`      | Назва провайдера      | `anthropic`                 |
| `{thinkingLevel}` | Поточний рівень thinking | `high`, `low`, `off`        |
| `{identity.name}` | Назва ідентичності агента | (те саме, що й `"auto"`)    |

Змінні нечутливі до регістру. `{think}` — alias для `{thinkingLevel}`.

### Реакція-підтвердження

- Типово береться з `identity.emoji` активного агента, інакше `"👀"`. Встановіть `""`, щоб вимкнути.
- Перевизначення для каналу: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Порядок розв’язання: account → channel → `messages.ackReaction` → резерв із identity.
- Scope: `group-mentions` (типово), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: прибирає ack після відповіді в Slack, Discord і Telegram.
- `messages.statusReactions.enabled`: вмикає реакції життєвого циклу статусу в Slack, Discord і Telegram.
  У Slack і Discord, якщо не задано, статусні реакції залишаються увімкненими, коли активні ack-реакції.
  У Telegram встановіть це явно в `true`, щоб увімкнути статусні реакції життєвого циклу.

### Вхідний debounce

Об’єднує швидкі текстові повідомлення від того самого відправника в один хід агента. Медіа/вкладення скидаться негайно. Керівні команди обходять debounce.

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

- `auto` керує auto-TTS. `/tts off|always|inbound|tagged` перевизначає значення для сесії.
- `summaryModel` перевизначає `agents.defaults.model.primary` для авто-підсумку.
- `modelOverrides` типово увімкнено; `modelOverrides.allowProvider` типово дорівнює `false` (opt-in).
- API key беруться з резерву `ELEVENLABS_API_KEY`/`XI_API_KEY` і `OPENAI_API_KEY`.
- `openai.baseUrl` перевизначає endpoint OpenAI TTS. Порядок розв’язання: конфігурація, потім `OPENAI_TTS_BASE_URL`, потім `https://api.openai.com/v1`.
- Коли `openai.baseUrl` вказує на endpoint, відмінний від OpenAI, OpenClaw трактує його як сумісний з OpenAI TTS server і послаблює перевірку model/voice.

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

- `talk.provider` має збігатися з ключем у `talk.providers`, коли налаштовано кілька Talk-провайдерів.
- Застарілі пласкі ключі Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) використовуються лише для сумісності й автоматично мігруються в `talk.providers.<provider>`.
- Voice ID беруться з резерву `ELEVENLABS_VOICE_ID` або `SAG_VOICE_ID`.
- `providers.*.apiKey` приймає відкриті рядки або об’єкти SecretRef.
- Резерв `ELEVENLABS_API_KEY` застосовується лише коли API key для Talk не налаштовано.
- `providers.*.voiceAliases` дозволяє директивам Talk використовувати дружні імена.
- `silenceTimeoutMs` керує тим, скільки режим Talk чекає після мовчання користувача, перш ніж надіслати транскрипт. Якщо не задано, зберігається типове вікно паузи для платформи (`700 ms на macOS і Android, 900 ms на iOS`).

---

## Tools

### Профілі інструментів

`tools.profile` задає базовий список дозволених перед `tools.allow`/`tools.deny`:

Локальний онбординг типово встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явні профілі зберігаються).

| Профіль     | Включає                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Без обмежень (те саме, що не задавати)                                                                                          |

### Групи інструментів

| Група              | Інструменти                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як alias для `exec`)                                           |
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
| `group:openclaw`   | Усі вбудовані інструменти (без provider plugin-ів)                                                                      |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона перемагає). Нечутлива до регістру, підтримує шаблони `*`. Застосовується навіть коли Docker sandbox вимкнений.

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

Керує elevated-доступом exec поза sandbox:

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

- Перевизначення для агента (`agents.list[].tools.elevated`) може лише додатково обмежити.
- `/elevated on|off|ask|full` зберігає стан для сесії; inline directives застосовуються до одного повідомлення.
- Elevated `exec` обходить sandbox і використовує налаштований escape path (`gateway` типово або `node`, коли ціллю exec є `node`).

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

Перевірки безпеки від циклів інструментів **типово вимкнені**. Встановіть `enabled: true`, щоб увімкнути виявлення.
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
- `warningThreshold`: поріг повторюваного патерна без прогресу для попереджень.
- `criticalThreshold`: вищий поріг повторення для блокування критичних циклів.
- `globalCircuitBreakerThreshold`: поріг жорсткої зупинки для будь-якого запуску без прогресу.
- `detectors.genericRepeat`: попереджати про повторні виклики того самого інструмента з тими самими аргументами.
- `detectors.knownPollNoProgress`: попереджати/блокувати відомі poll-інструменти (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати про чергування пар без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, валідація завершується помилкою.

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
        directSend: false, // opt-in: надсилати завершені асинхронні задачі music/video безпосередньо в канал
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

<Accordion title="Поля запису media model">

**Запис провайдера** (`type: "provider"` або пропущено):

- `provider`: ID API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення model id
- `profile` / `preferredProfile`: вибір профілю `auth-profiles.json`

**Запис CLI** (`type: "cli"`):

- `command`: виконуваний файл
- `args`: шаблонні аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов’язковий список (`image`, `audio`, `video`). Типові значення: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
- Помилки призводять до fallback на наступний запис.

Автентифікація провайдера дотримується стандартного порядку: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Поля async completion:**

- `asyncCompletion.directSend`: коли `true`, завершені асинхронні задачі `music_generate`
  і `video_generate` спочатку намагаються доставитися прямо в канал. Типове значення: `false`
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

Керує тим, на які сесії можуть націлюватися session tools (`sessions_list`, `sessions_history`, `sessions_send`).

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

- `self`: лише поточний ключ сесії.
- `tree`: поточна сесія + сесії, породжені поточною сесією (subagents).
- `agent`: будь-яка сесія, що належить поточному id агента (може включати інших користувачів, якщо ви запускаєте сесії per-sender під тим самим id агента).
- `all`: будь-яка сесія. Націлювання між агентами все одно потребує `tools.agentToAgent`.
- Затискач sandbox: коли поточна сесія ізольована і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово стає `tree`, навіть якщо `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Керує підтримкою inline-вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: встановіть true, щоб дозволити inline-вкладення файлів
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
- Файли матеріалізуються в дочірньому workspace під `.openclaw/attachments/<uuid>/` з `.manifest.json`.
- Вміст вкладень автоматично редагується з персистентності транскрипту.
- Входи Base64 перевіряються зі строгими перевірками алфавіту/падінгу і захистом за розміром до декодування.
- Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
- Очищення виконується згідно з політикою `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.

### `tools.experimental`

Експериментальні прапорці вбудованих інструментів. Типово вимкнені, якщо не діє правило auto-enable, специфічне для runtime.

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
- Типове значення: `false` для не-OpenAI провайдерів. Запуски OpenAI і OpenAI Codex автоматично вмикають його.
- Коли він увімкнений, системний prompt також додає вказівки з використання, щоб модель застосовувала його лише для суттєвої роботи й тримала максимум один крок у стані `in_progress`.

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

- `model`: типова модель для породжених sub-agents. Якщо не задано, sub-agents успадковують модель викликувача.
- `allowAgents`: типовий список дозволених цільових ID агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента не передає `runTimeoutSeconds`. `0` означає без тайм-ауту.
- Політика інструментів для subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Користувацькі провайдери та base URL

OpenClaw використовує вбудований каталог моделей. Додавайте користувацьких провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

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

- Використовуйте `authHeader: true` + `headers` для нестандартних потреб автентифікації.
- Перевизначте корінь конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий alias змінної середовища).
- Пріоритет злиття для однакових provider ID:
  - Непорожні значення `baseUrl` в agent `models.json` мають пріоритет.
  - Непорожні значення `apiKey` в agent мають пріоритет лише коли цей провайдер не керується через SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` провайдера, керовані SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env refs, `secretref-managed` для file/exec refs) замість збереження розв’язаних секретів.
  - Значення заголовків провайдера, керовані SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env refs, `secretref-managed` для file/exec refs).
  - Порожні або відсутні `apiKey`/`baseUrl` в agent повертаються до `models.providers` у конфігурації.
  - Для однакових моделей `contextWindow`/`maxTokens` використовують більше значення між явною конфігурацією та неявними значеннями каталогу.
  - Для однакових моделей `contextTokens` зберігає явний runtime cap, коли він заданий; використовуйте це, щоб обмежити ефективний контекст без зміни нативних метаданих моделі.
  - Використовуйте `models.mode: "replace"`, якщо хочете, щоб конфігурація повністю переписала `models.json`.
  - Персистентність маркерів є авторитетною від джерела: маркери записуються з активного знімка вихідної конфігурації (до розв’язання), а не з розв’язаних runtime-значень секретів.

### Деталі полів провайдера

- `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
- `models.providers`: карта користувацьких провайдерів за provider id.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані провайдера (краще використовувати SecretRef/env substitution).
- `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions`, вставляє `options.num_ctx` у запити (типово: `true`).
- `models.providers.*.authHeader`: примусово передавати облікові дані в заголовку `Authorization`, коли це потрібно.
- `models.providers.*.baseUrl`: базовий URL upstream API.
- `models.providers.*.headers`: додаткові статичні заголовки для proxy/tenant routing.
- `models.providers.*.request`: перевизначення транспорту для HTTP-запитів model-provider.
  - `request.headers`: додаткові заголовки (зливаються з типовими заголовками провайдера). Значення приймають SecretRef.
  - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію провайдера), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов’язковим `prefix`).
  - `request.proxy`: перевизначення HTTP proxy. Режими: `"env-proxy"` (використовувати env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов’язковий підоб’єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: явні записи каталогу моделей провайдера.
- `models.providers.*.models.*.contextWindow`: нативні метадані вікна контексту моделі.
- `models.providers.*.models.*.contextTokens`: необов’язкове runtime-обмеження контексту. Використовуйте це, коли хочете менший ефективний бюджет контексту, ніж нативний `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` з непорожнім ненативним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це в `false` під час runtime. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
- `plugins.entries.amazon-bedrock.config.discovery`: корінь налаштувань auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне discovery.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр provider-id для цільового discovery.
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

Встановіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

Встановіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` — прийнятні alias. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Coding endpoint (типовий): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint задайте користувацького провайдера з перевизначенням base URL.

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

Нативні endpoint-и Moonshot оголошують сумісність використання streaming на спільному
транспорті `openai-completions`, і OpenClaw тепер визначає це за можливостями endpoint-а,
а не лише за вбудованим provider id.

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

Сумісний з Anthropic вбудований провайдер. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

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

Встановіть `MINIMAX_API_KEY`. Скорочення:
`openclaw onboard --auth-choice minimax-global-api` або
`openclaw onboard --auth-choice minimax-cn-api`.
Каталог моделей тепер типово включає лише M2.7.
На streaming path, сумісному з Anthropic, OpenClaw типово вимикає thinking MiniMax,
якщо ви явно не задасте `thinking` самі. `/fast on` або
`params.fastMode: true` переписує `MiniMax-M2.7` на
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Локальні моделі (LM Studio)">

Див. [Local Models](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному залізі; залишайте hosted-моделі злитими як резерв.

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

- `allowBundled`: необов’язковий список дозволених лише для bundled Skills (managed/workspace Skills не зачіпає).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: якщо true, віддавати перевагу встановлювачам Homebrew, коли `brew`
  доступний, перш ніж переходити до інших типів встановлювачів.
- `install.nodeManager`: пріоритет node installer для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/installed.
- `entries.<skillKey>.apiKey`: зручне поле API key для Skills, які оголошують основну env var (відкритий рядок або об’єкт SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: