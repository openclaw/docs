---
read_when:
    - Налаштування Plugin каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення проблем із поканальними ключами конфігурації
    - Аудит політики особистих повідомлень, політики груп або обмеження згадок
summary: 'Конфігурація каналів: контроль доступу, сполучення, ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-05-07T01:51:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f94d41a347ade8b9447e9f31e48d46830b2faac2202823480a68b7986107176e
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації окремих каналів у `channels.*`. Охоплює доступ до DM і груп,
налаштування кількох акаунтів, обмеження за згадками та ключі окремих каналів для Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage та інших вбудованих Plugin каналів.

Для агентів, інструментів, середовища виконання Gateway та інших ключів верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і групові політики:

| Політика DM         | Поведінка                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або в сховищі дозволених сполучених) |
| `open`              | Дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                       |

| Групова політика      | Поведінка                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                | Обійти списки дозволених груп (обмеження за згадками все ще застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення DM обмежено **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` немає), групова політика під час виконання повертається до `allowlist` (fail-closed) із попередженням під час запуску.
</Note>

### Перевизначення моделей каналів

Використовуйте `channels.modelByChannel`, щоб закріпити певні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналу застосовується, коли сеанс ще не має перевизначення моделі (наприклад, заданого через `/model`).

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

### Типові налаштування каналів і Heartbeat

Використовуйте `channels.defaults` для спільної поведінки групових політик і Heartbeat між провайдерами:

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
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь цитований/потоковий/історичний контекст), `allowlist` (включати контекст лише від дозволених відправників), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для окремого каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні стани каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати погіршені/помилкові стани у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відтворювати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує пов’язаний сеанс.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
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
}
```

<Accordion title="Кілька акаунтів WhatsApp">

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

- Вихідні команди типово використовують акаунт `default`, якщо він є; інакше перший налаштований ID акаунта (відсортований).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового акаунта, коли збігається з налаштованим ID акаунта.
- Застарілий каталог автентифікації Baileys для одного акаунта мігрується `openclaw doctor` у `whatsapp/default`.
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються), із `TELEGRAM_BOT_TOKEN` як резервним варіантом для типового акаунта.
- `apiRoot` є лише коренем Telegram Bot API. Використовуйте `https://api.telegram.org` або власний self-hosted/proxy корінь, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий завершальний суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового акаунта, коли збігається з налаштованим ID акаунта.
- У налаштуваннях із кількома акаунтами (2+ ID акаунтів) задайте явне типове значення (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли воно відсутнє або недійсне.
- `configWrites: false` блокує ініційовані Telegram записи конфігурації (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [Агентах ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- Попередній перегляд потоків Telegram використовує `sendMessage` + `editMessageText` (працює в прямих і групових чатах).
- Політика повторів: див. [Політика повторів](/uk/concepts/retry).

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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
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

- Токен: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; параметри повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим id облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) для цілей доставлення; голі числові ID відхиляються.
- Slug-и guild мають нижній регістр із пробілами, заміненими на `-`; ключі каналів використовують slug-овану назву (без `#`). Надавайте перевагу ID guild.
- Повідомлення, створені ботами, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний вихідний текст `@handle` з ID користувачів Discord перед надсиланням, щоб відомих колег можна було згадувати детерміновано, навіть коли тимчасовий кеш каталогу порожній. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (типово 17) розбиває високі повідомлення, навіть якщо вони мають менше 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до threads:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до threads (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язане доставлення/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного скасування фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSessions`: перемикач для `sessions_spawn({ thread: true })` і автоматичного створення/прив’язування thread під час ACP thread-spawn (типово: `true`)
  - `defaultSpawnContext`: нативний контекст subagent для spawn, прив’язаних до threads (типово `"fork"`)
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують сталі прив’язки ACP для каналів і threads (використовуйте id каналу/thread у `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення автоматичного приєднання + LLM + TTS. Текстові конфігурації Discord типово залишають голос вимкненим; задайте `channels.discord.voice.enabled=true`, щоб увімкнути його.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, що використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE `@discordjs/voice` (типово `true` і `24`).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання (типово `30000`).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки часу від’єднана голосова сесія може входити в сигналізацію повторного підключення, перш ніж OpenClaw її знищить (типово `15000`).
- OpenClaw додатково намагається відновити приймання голосу, залишаючи голосову сесію та повторно приєднуючись до неї після повторюваних помилок розшифрування.
- `channels.discord.streaming` є канонічним ключем режиму потоку. Discord типово використовує `streaming.mode: "progress"`, тож перебіг роботи інструментів/завдань з’являється в одному редагованому повідомленні попереднього перегляду; задайте `streaming.mode: "off"`, щоб вимкнути це. Застарілі значення `streamMode` і булеві значення `streaming` залишаються runtime-аліасами; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `channels.discord.autoPresence` зіставляє доступність runtime з присутністю бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає змінне зіставлення імен/тегів (режим сумісності на випадок надзвичайної ситуації).
- `channels.discord.execApprovals`: нативне для Discord доставлення схвалень exec і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати запити exec. Якщо не вказано, використовується резервне значення `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити схвалення. `"dm"` (типово) надсилає в DM схвалювачів, `"channel"` надсилає до початкового каналу, `"both"` надсилає в обидва місця. Коли target містить `"channel"`, кнопками можуть користуватися лише визначені схвалювачі.
  - `cleanupAfterResolve`: коли `true`, видаляє DM зі схваленнями після схвалення, відмови або timeout.

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

- JSON облікового запису служби: inline (`serviceAccount`) або на основі файлу (`serviceAccountFile`).
- SecretRef облікового запису служби також підтримується (`serviceAccountRef`).
- Резервні env-значення: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставлення.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає змінне зіставлення email-principal (режим сумісності на випадок надзвичайної ситуації).

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

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного env-значення типового облікового запису).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (на корені або для окремого облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API приймача Bolt. Використовуйте це лише під час дослідження timeout ping/pong або застарілої поведінки websocket.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack надають поля джерела/статусу для окремих облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в HTTP mode -
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточна команда/шлях runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує ініційовані Slack записи конфігурації.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим id облікового запису.
- `channels.slack.streaming.mode` є канонічним ключем режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним потоковим транспортом Slack. Застарілі значення `streamMode`, булеві значення `streaming` і `nativeStreaming` залишаються runtime-аліасами; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставлення.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сесій thread:** `thread.historyScope` є окремим для кожного thread (типово) або спільним для каналу. `thread.inheritParent` копіює стенограму батьківського каналу до нових threads.

- Нативний streaming Slack разом зі статусом thread у стилі асистента Slack "is typing..." потребують цільового thread для відповіді. DM верхнього рівня типово залишаються поза thread, тож вони все одно можуть використовувати streaming через чернеткові попередні перегляди Slack із публікацією та редагуванням замість показу нативного потоку/попереднього перегляду статусу в стилі thread.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте Slack emoji shortcode, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативне для Slack доставлення схвалень exec і авторизація схвалювачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій | Типово | Примітки                  |
| ------------ | ------- | ---------------------- |
| reactions    | увімкнено | Реагувати + перелічувати реакції |
| messages     | увімкнено | Читати/надсилати/редагувати/видаляти  |
| pins         | увімкнено | Закріплювати/відкріплювати/перелічувати         |
| memberInfo   | увімкнено | Інформація про учасника            |
| emojiList    | увімкнено | Список користувацьких emoji      |

### Mattermost

Mattermost постачається як bundled Plugin у поточних випусках OpenClaw. Старіші або
кастомні збірки можуть установити поточний пакет npm за допомогою
`openclaw plugins install @openclaw/mattermost`. Перевірте
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
для поточних dist-tags перед закріпленням версії.

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

Коли ввімкнені нативні команди Mattermost:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на кінцеву точку OpenClaw gateway і бути доступним із сервера Mattermost.
- Нативні slash-зворотні виклики автентифікуються токенами для кожної команди, які Mattermost повертає під час реєстрації slash-команди. Якщо реєстрація не вдається або жодні команди не активовано, OpenClaw відхиляє зворотні виклики з повідомленням `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів зворотних викликів Mattermost може вимагати, щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен зворотного виклику. Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення фільтрації за згадками для окремого каналу (`"*"` для типового значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ідентифікатором облікового запису.

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

- `channels.signal.account`: прив’язати запуск каналу до конкретної ідентичності облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ідентифікатором облікового запису.

### BlueBubbles

BlueBubbles — це застарілий міст iMessage (на базі Plugin, налаштовується в `channels.bluebubbles`). Наявні налаштування залишаються підтримуваними, але для нових розгортань OpenClaw iMessage варто надавати перевагу `channels.imessage`, коли `imsg` може працювати на хості Messages.

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
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ідентифікатором облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних сеансів ACP. Використовуйте handle BlueBubbles або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- Повна конфігурація каналу BlueBubbles і обґрунтування застарівання задокументовані в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Демон або порт не потрібні. Це рекомендований шлях для нових налаштувань OpenClaw iMessage, коли хост може надати дозволи до бази даних Messages і Automation.

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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ідентифікатором облікового запису.

- Потребує Full Disk Access до БД Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують вхідні шляхи вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тож переконайтеся, що ключ хоста ретранслятора вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сеансів ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Приклад SSH-обгортки iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix працює на базі Plugin і налаштовується в `channels.matrix`.

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
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначити це через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver. `proxy` і це мережеве opt-in налаштування є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у налаштуваннях із кількома обліковими записами.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати й нові запрошення у стилі DM ігноруються, доки ви не встановите `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: Matrix-нативна доставка схвалень exec і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати запити exec.
  - `agentFilter`: необов’язковий allowlist ідентифікаторів агентів. Опустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансів (підрядок або регулярний вираз).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сеанси: `per-user` (типово) спільно використовує сеанс за маршрутизованим peer, а `per-room` ізолює кожну кімнату DM.
- Перевірки статусу Matrix і live-пошуки каталогу використовують ту саму політику проксі, що й трафік під час виконання.
- Повна конфігурація Matrix, правила таргетингу й приклади налаштування задокументовані в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams працює на базі Plugin і налаштовується в `channels.msteams`.

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
- Повна конфігурація Teams (облікові дані, Webhook, політика DM/груп, перевизначення для окремих команд/каналів) задокументована в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC працює на базі Plugin і налаштовується в `channels.irc`.

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
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ідентифікатором облікового запису.
- Повна конфігурація каналу IRC (host/port/TLS/channels/allowlists/mention gating) задокументована в [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

Запустіть кілька облікових записів для кожного каналу (кожен із власним `accountId`):

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
- Env-токени застосовуються лише до **типового** облікового запису.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте нетиповий обліковий запис через `openclaw channels add` (або під час onboarding каналу), залишаючись на конфігурації каналу верхнього рівня з одним обліковим записом, OpenClaw спершу переносить значення верхнього рівня для одного облікового запису, що належать до області облікового запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише до каналу (без `accountId`) продовжують збігатися з типовим обліковим записом; прив’язки з областю облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня для одного облікового запису, що належать до області облікового запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Див. повний індекс каналів: [Канали](/uk/channels).

### Фільтрація згадок у групових чатах

Групові повідомлення типово **вимагають згадки** (згадка в метаданих або безпечні regex-шаблони). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat і iMessage.

Видимі відповіді керуються окремо. Для групових/канальних кімнат типово встановлено `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw усе ще обробляє хід, але звичайні фінальні відповіді залишаються приватними, а видимий вивід у кімнату вимагає `message(action=send)`. Установлюйте `"automatic"` лише тоді, коли потрібна застаріла поведінка, за якої звичайні відповіді публікуються назад у кімнату. Щоб застосувати таку саму поведінку видимих відповідей лише через інструмент і до прямих чатів, задайте `messages.visibleReplies: "message_tool"`; harness Codex також використовує цю поведінку лише через інструмент як своє типове значення для прямих чатів, коли параметр не задано.

Видимі відповіді лише через інструмент потребують моделі/runtime, які надійно викликають інструменти. Якщо журнал сеансу показує текст асистента з `didSendViaMessagingTool: false`, модель створила приватну фінальну відповідь замість виклику інструмента повідомлень. Перемкніться на сильнішу модель із викликом інструментів для цього каналу або задайте `messages.groupChat.visibleReplies: "automatic"`, щоб відновити застарілі видимі фінальні відповіді.

Якщо інструмент повідомлень недоступний за активною політикою інструментів, OpenClaw повертається до автоматичних видимих відповідей замість мовчазного приглушення відповіді. `openclaw doctor` попереджає про цю невідповідність.

Gateway гаряче перезавантажує конфігурацію `messages` після збереження файлу. Перезапускайте лише тоді, коли відстеження файлів або перезавантаження конфігурації вимкнено в розгортанні.

**Типи згадок:**

- **Метадані згадок**: Нативні @-згадки платформи. Ігноруються в режимі самочату WhatsApp.
- **Текстові шаблони**: Безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечне вкладене повторення ігноруються.
- Обмеження згадками застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
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

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначити його за допомогою `channels.<channel>.historyLimit` (або для окремого облікового запису). Установіть `0`, щоб вимкнути.

`messages.visibleReplies` є глобальним значенням за замовчуванням для ходів із джерела; `messages.groupChat.visibleReplies` перевизначає його для ходів із групового/канального джерела. Коли `messages.visibleReplies` не задано, harness може надати власне значення за замовчуванням для прямих/джерельних чатів; Codex harness за замовчуванням використовує `message_tool`. Списки дозволених каналів і обмеження згадками все одно визначають, чи обробляється хід.

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

Визначення: перевизначення для окремого DM → значення provider за замовчуванням → без обмеження (зберігається все).

Підтримуються: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим самочату

Додайте власний номер до `allowFrom`, щоб увімкнути режим самочату (ігнорує нативні @-згадки, відповідає лише на текстові шаблони):

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

- Цей блок налаштовує поверхні команд. Поточний вбудований і bundled каталог команд див. у [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, документовані на сторінках відповідних каналів/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (булеве значення або `"auto"`). Для Discord `false` пропускає реєстрацію нативних команд і очищення під час запуску.
- Перевизначайте реєстрацію нативних Skills для окремого каналу за допомогою `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові пункти меню Telegram-бота.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled` і відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; `/config show` лише для читання залишається доступним звичайним operator-клієнтам із правом запису.
- `mcp: true` вмикає `/mcp` для керованої OpenClaw конфігурації MCP-сервера в `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, встановлення та керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` обмежує зміни конфігурації для окремого каналу (за замовчуванням: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, які спрямовані на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. За замовчуванням: `true`.
- `ownerAllowFrom` — це явний список дозволених власників для команд/інструментів лише для власника. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному prompt. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного provider. Коли встановлено, це **єдине** джерело авторизації (списки дозволених каналів/сполучення та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.
- Карта документації команд:
  - вбудований і bundled каталог: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд, специфічні для каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди сполучення: [Сполучення](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
