---
read_when:
    - Налаштування Plugin каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення несправностей із ключами конфігурації для кожного каналу
    - Аудит політики DM, політики груп або обмеження за згадками
summary: 'Конфігурація каналів: контроль доступу, сполучення, ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-04-29T05:39:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27393684cef61ab3599f9793cc9e691239a5bb5852ad638b3c2dd20de76ee9fa
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації для окремих каналів у `channels.*`. Охоплює доступ до DM і груп,
налаштування кількох облікових записів, обмеження за згадками та ключі для окремих каналів Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage й інших вбудованих Plugin каналів.

Для агентів, інструментів, runtime Gateway та інших ключів верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не вказано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і групові політики:

| Політика DM         | Поведінка                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або у сховищі дозволених сполучень) |
| `open`              | Дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                        |

| Групова політика      | Поведінка                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (типово) | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                | Обійти списки дозволених груп (обмеження за згадками все ще застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення DM обмежені **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), групова політика runtime повертається до `allowlist` (закрито в разі помилки) із попередженням під час запуску.
</Note>

### Перевизначення моделі каналу

Використовуйте `channels.modelByChannel`, щоб закріпити певні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналів застосовується, коли сеанс ще не має перевизначення моделі (наприклад, заданого через `/model`).

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

### Типові значення каналів і Heartbeat

Використовуйте `channels.defaults` для спільної групової політики та поведінки Heartbeat між провайдерами:

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

- `channels.defaults.groupPolicy`: резервна групова політика, коли `groupPolicy` на рівні провайдера не встановлено.
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь цитований/тредовий/історичний контекст), `allowlist` (включати контекст лише від дозволених відправників), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для окремого каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні статуси каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати деградовані/помилкові статуси у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: рендерити компактний вивід Heartbeat у стилі індикатора.

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

<Accordion title="Багато облікових записів WhatsApp">

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше перший налаштований ID облікового запису (у відсортованому порядку).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, коли він збігається з налаштованим ID облікового запису.
- Застарілий auth dir Baileys для одного облікового запису мігрується `openclaw doctor` у `whatsapp/default`.
- Перевизначення для окремих облікових записів: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; символьні посилання відхиляються), з `TELEGRAM_BOT_TOKEN` як резервом для типового облікового запису.
- `apiRoot` — це лише корінь Telegram Bot API. Використовуйте `https://api.telegram.org` або власний self-hosted/proxy root, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий кінцевий суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ID облікового запису.
- У налаштуваннях із кількома обліковими записами (2+ ID облікових записів) задайте явне типове значення (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли воно відсутнє або недійсне.
- `configWrites: false` блокує ініційовані Telegram записи конфігурації (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#channel-specific-settings).
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
- Прямі вихідні виклики, що надають явний Discord `token`, використовують цей токен для виклику; параметри повторних спроб/політики облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим id облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) для цілей доставки; прості числові ID відхиляються.
- Slug-и guild записуються малими літерами із заміною пробілів на `-`; ключі каналів використовують назву зі slug (без `#`). Віддавайте перевагу ID guild.
- Повідомлення, створені ботом, за замовчуванням ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `maxLinesPerMessage` (типово 17) розділяє високі повідомлення, навіть якщо вони коротші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до thread:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного auto-unfocus після неактивності в годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: opt-in перемикач для автоматичного створення/прив’язки thread через `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і thread-ів (використовуйте id каналу/thread у `match.peer.id`). Семантика полів спільна в [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів Discord components v2.
- `channels.discord.voice` вмикає розмови у голосових каналах Discord і необов’язкове auto-join + перевизначення LLM + TTS.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, що використовується для відповідей у голосовому каналі Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE `@discordjs/voice` (`true` і `24` за замовчуванням).
- OpenClaw додатково намагається відновити приймання голосу, залишаючи голосову сесію та повторно приєднуючись до неї після повторних помилок дешифрування.
- `channels.discord.streaming` є канонічним ключем режиму потоку. Застарілі значення `streamMode` і булеві значення `streaming` мігруються автоматично.
- `channels.discord.autoPresence` зіставляє доступність runtime із presence бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає змінюване зіставлення name/tag (режим сумісності break-glass).
- `channels.discord.execApprovals`: нативна для Discord доставка схвалень exec і авторизація approver-ів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі схвалення exec активуються, коли approver-ів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати exec-запити. Якщо пропущено, використовується резервне значення `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID agent-ів. Пропустіть, щоб пересилати схвалення для всіх agent-ів.
  - `sessionFilter`: необов’язкові патерни ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово) надсилає в DM approver-ів, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва місця. Коли target містить `"channel"`, кнопки можуть використовувати лише визначені approver-и.
  - `cleanupAfterResolve`: коли `true`, видаляє DM зі схваленнями після схвалення, відхилення або timeout.

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

- JSON сервісного облікового запису: inline (`serviceAccount`) або файловий (`serviceAccountFile`).
- SecretRef сервісного облікового запису також підтримується (`serviceAccountRef`).
- Резервні змінні env: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає змінюване зіставлення email principal (режим сумісності break-glass).

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

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як резервне значення env для облікового запису за замовчуванням).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (у корені або для кожного облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API Bolt receiver. Використовуйте це лише під час дослідження timeout ping/pong або поведінки застарілого websocket.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають plaintext
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack надають поля джерела/статусу для кожних облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в HTTP mode —
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях command/runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим id облікового запису.
- `channels.slack.streaming.mode` є канонічним ключем режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним streaming transport Slack. Застарілі значення `streamMode`, булеві значення `streaming` і `nativeStreaming` мігруються автоматично.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція thread-сесій:** `thread.historyScope` є окремим для кожного thread (типово) або спільним для каналу. `thread.inheritParent` копіює транскрипт батьківського каналу до нових thread-ів.

- Нативний streaming Slack разом зі Slack assistant-style статусом thread "is typing..." потребують цілі reply thread. DM верхнього рівня за замовчуванням залишаються поза thread, тому вони використовують `typingReaction` або звичайну доставку замість preview у стилі thread.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка схвалень exec і авторизація approver-ів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій | Типово | Примітки              |
| --------- | ------ | --------------------- |
| reactions | увімкнено | Реагувати + перелічувати реакції |
| messages  | увімкнено | Читати/надсилати/редагувати/видаляти |
| pins      | увімкнено | Закріпити/відкріпити/перелічити |
| memberInfo | увімкнено | Інформація про учасника |
| emojiList | увімкнено | Список власних emoji |

### Mattermost

Mattermost постачається як bundled Plugin у поточних релізах OpenClaw. Старіші або
custom builds можуть установити поточний пакет npm за допомогою
`openclaw plugins install @openclaw/mattermost`; якщо npm повідомляє, що пакет,
яким володіє OpenClaw, позначено як deprecated, використовуйте bundled Plugin або локальний checkout
до публікації новішого пакета npm.

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

Режими чату: `oncall` (відповідати на @-згадку, типово), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса-тригера).

Коли нативні команди Mattermost увімкнено:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на endpoint OpenClaw gateway і бути доступним із сервера Mattermost.
- Нативні slash callbacks автентифікуються за допомогою токенів для кожної команди, повернених
  Mattermost під час реєстрації slash command. Якщо реєстрація не вдається або жодні
  команди не активовано, OpenClaw відхиляє callbacks з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/internal callback hosts Mattermost може вимагати, щоб
  `ServiceSettings.AllowedUntrustedInternalConnections` містив callback host/domain.
  Використовуйте значення host/domain, а не повні URL.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення mention-gating для кожного каналу (`"*"` для значення за замовчуванням).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим id облікового запису.

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
- `channels.signal.configWrites`: дозволити або заборонити зміни конфігурації, ініційовані Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає типовий вибір облікового запису, коли він відповідає налаштованому ідентифікатору облікового запису.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (із підтримкою Plugin, налаштовується в `channels.bluebubbles`).

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

- Основні шляхи ключів, описані тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає типовий вибір облікового запису, коли він відповідає налаштованому ідентифікатору облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до сталих сеансів ACP. Використовуйте дескриптор BlueBubbles або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [агенти ACP](/uk/tools/acp-agents#channel-specific-settings).
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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає типовий вибір облікового запису, коли він відповідає налаштованому ідентифікатору облікового запису.

- Потрібен Full Disk Access до бази даних Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб отримати список чатів.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують вхідні шляхи вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тож переконайтеся, що ключ хоста ретранслятора вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити зміни конфігурації, ініційовані iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до сталих сеансів ACP. Використовуйте нормалізований дескриптор або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [агенти ACP](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH-обгортки iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix має підтримку Plugin і налаштовується в `channels.matrix`.

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
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначити його за допомогою `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і ця мережева згода є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із кількома обліковими записами.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати й нові запрошення у стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка підтверджень exec і авторизація затверджувачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі підтвердження exec активуються, коли затверджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Matrix (наприклад, `@owner:example.org`), яким дозволено затверджувати запити exec.
  - `agentFilter`: необов’язковий allowlist ідентифікаторів агентів. Пропустіть, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансів (підрядок або регулярний вираз).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (типово), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM у Matrix групуються в сеанси: `per-user` (типово) спільно використовує сеанс за маршрутизованим співрозмовником, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки стану Matrix і живі пошуки в каталозі використовують ту саму політику проксі, що й трафік під час виконання.
- Повну конфігурацію Matrix, правила таргетингу й приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams має підтримку Plugin і налаштовується в `channels.msteams`.

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

- Основні шляхи ключів, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, webhook, політика DM/груп, перевизначення для окремих команд/каналів) задокументовано в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC має підтримку Plugin і налаштовується в `channels.irc`.

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
- Необов’язковий `channels.irc.defaultAccount` перевизначає типовий вибір облікового запису, коли він відповідає налаштованому ідентифікатору облікового запису.
- Повну конфігурацію каналу IRC (хост/порт/TLS/канали/allowlist-и/шлюзування згадок) задокументовано в [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

Запускайте кілька облікових записів для кожного каналу (кожен зі своїм `accountId`):

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

- `default` використовується, коли `accountId` опущено (CLI + маршрутизація).
- Токени середовища застосовуються лише до **типового** облікового запису.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте нетиповий обліковий запис через `openclaw channels add` (або під час онбордингу каналу), поки конфігурація каналу верхнього рівня все ще має один обліковий запис, OpenClaw спочатку переносить значення верхнього рівня для одного облікового запису, що належать до облікового запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише до каналу (без `accountId`) продовжують відповідати типовому обліковому запису; прив’язки з областю облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня для одного облікового запису, що належать до облікового запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад, Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Дивіться повний індекс каналів: [Канали](/uk/channels).

### Шлюзування згадок у груповому чаті

Групові повідомлення типово **вимагають згадки** (згадка в метаданих або безпечні шаблони регулярних виразів). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Видимі відповіді керуються окремо. Групові/канальні кімнати типово мають `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw усе ще обробляє turn, але звичайні фінальні відповіді залишаються приватними, а видимий вивід у кімнату потребує `message(action=send)`. Установлюйте `"automatic"` лише тоді, коли хочете застарілу поведінку, за якої звичайні відповіді надсилаються назад у кімнату.

**Типи згадок:**

- **Згадки в метаданих**: нативні @-згадки платформи. Ігноруються в режимі self-chat WhatsApp.
- **Текстові шаблони**: безпечні шаблони регулярних виразів у `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони й небезпечні вкладені повторення ігноруються.
- Шлюзування згадок застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

```json5
{
  messages: {
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

`messages.groupChat.historyLimit` задає глобальне типове значення. Канали можуть перевизначати його за допомогою `channels.<channel>.historyLimit` (або для окремого облікового запису). Установіть `0`, щоб вимкнути.

`messages.groupChat.visibleReplies` є глобальним для turn-ів із групових/канальних джерел; allowlist-и каналів і шлюзування згадок усе ще вирішують, чи обробляти turn.

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

Вирішення: перевизначення для окремого DM → типове значення провайдера → без обмеження (усе зберігається).

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

- Цей блок налаштовує поверхні команд. Поточний вбудований + комплектний каталог команд див. у [Slash-команди](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/плагінам, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовані на сторінках відповідних каналів/плагінів, а також у [Slash-команди](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди навичок для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для каналу: `channels.discord.commands.native` (логічне значення або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначте реєстрацію нативних команд навичок для каналу за допомогою `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потрібні `tools.elevated.enabled` і відправник у `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; доступний лише для читання `/config show` залишається доступним для звичайних операторських клієнтів з областю запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованого OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, установлення та керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` обмежує зміни конфігурації для каналу (за замовчуванням: true).
- Для багатооблікових каналів `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, спрямовані на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. За замовчуванням: `true`.
- `ownerAllowFrom` — це явний список дозволів власника для команд/інструментів лише для власника. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному промпті. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Якщо встановлено, це **єдине** джерело авторизації (списки дозволів/спарювання каналу та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.
- Мапа документації команд:
  - вбудований + комплектний каталог: [Slash-команди](/uk/tools/slash-commands)
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
