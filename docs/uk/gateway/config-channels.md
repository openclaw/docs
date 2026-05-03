---
read_when:
    - Налаштування Plugin каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення неполадок із ключами конфігурації для окремих каналів
    - Аудит політики особистих повідомлень, групової політики або контролю згадок
summary: 'Налаштування каналів: контроль доступу, сполучення, поканальні ключі для Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-05-03T01:35:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5ec4aad94a844f6e2f936b2e0d208343ea264c9a4c74f7fc610c516e0353b53b
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації окремих каналів у `channels.*`. Охоплює доступ до DM і груп,
налаштування кількох облікових записів, фільтрацію за згадками та поканальні ключі для Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage та інших вбудованих плагінів каналів.

Для агентів, інструментів, середовища виконання Gateway та інших ключів верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і групові політики:

| Політика DM         | Поведінка                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або у сховищі дозволених після сполучення) |
| `open`              | Дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                       |

| Групова політика      | Поведінка                                              |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                | Обійти списки дозволених груп (фільтрація за згадками все одно застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення DM обмежені **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), групова політика під час виконання повертається до `allowlist` (закрито в разі помилки) із попередженням під час запуску.
</Note>

### Перевизначення моделі каналу

Використовуйте `channels.modelByChannel`, щоб закріпити певні ідентифікатори каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналів застосовується, коли сеанс ще не має перевизначення моделі (наприклад, заданого через `/model`).

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

Використовуйте `channels.defaults` для спільної поведінки групової політики та Heartbeat між провайдерами:

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
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь цитований/ланцюжковий/історичний контекст), `allowlist` (включати лише контекст від дозволених відправників), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні стани каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати погіршені стани/помилки у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: показувати компактний індикаторний вивід Heartbeat.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує зв’язаний сеанс.

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

<Accordion title="Кілька облікових записів WhatsApp">

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше перший налаштований ідентифікатор облікового запису (у відсортованому порядку).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає вибір резервного типового облікового запису, коли він відповідає налаштованому ідентифікатору облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису мігрується командою `openclaw doctor` у `whatsapp/default`.
- Перевизначення для облікового запису: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; символічні посилання відхиляються), з `TELEGRAM_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- `apiRoot` — це лише корінь Telegram Bot API. Використовуйте `https://api.telegram.org` або власний самостійно розміщений/проксі-корінь, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий кінцевий суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ідентифікатору облікового запису.
- У налаштуваннях із кількома обліковими записами (2+ ідентифікатори облікових записів) задайте явний типовий обліковий запис (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли він відсутній або недійсний.
- `configWrites: false` блокує ініційовані Telegram записи конфігурації (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують сталі прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- Попередній перегляд потоків Telegram використовує `sendMessage` + `editMessageText` (працює в прямих і групових чатах).
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

- Токен: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як резервом для облікового запису за замовчуванням.
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; параметри повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал guild) для цілей доставки; прості числові ID відхиляються.
- Слаги guild пишуться малими літерами із заміною пробілів на `-`; ключі каналів використовують назву зі слагом (без `#`). Надавайте перевагу ID guild.
- Повідомлення, створені ботом, за замовчуванням ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (крім @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний вихідний текст `@handle` з ID користувачів Discord перед надсиланням, щоб відомих колег можна було згадувати детерміновано, навіть коли тимчасовий кеш каталогу порожній. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (за замовчуванням 17) розбиває високі повідомлення, навіть якщо вони мають менше ніж 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до потоків:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до потоків (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSessions`: перемикач для `sessions_spawn({ thread: true })` і автоматичного створення/прив’язування потоків під час thread-spawn ACP (за замовчуванням: `true`)
  - `defaultSpawnContext`: нативний контекст субагента для спавнів, прив’язаних до потоків (за замовчуванням `"fork"`)
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і потоків (використовуйте ID каналу/потоку в `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови у голосових каналах Discord і необов’язкові перевизначення auto-join + LLM + TTS. Текстові конфігурації Discord за замовчуванням залишають голос вимкненим; задайте `channels.discord.voice.enabled=true`, щоб увімкнути.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, що використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються в параметри DAVE `@discordjs/voice` (за замовчуванням `true` і `24`).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб auto-join (за замовчуванням `30000`).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки часу від’єднана голосова сесія може входити в сигналізацію повторного підключення, перш ніж OpenClaw її знищить (за замовчуванням `15000`).
- OpenClaw додатково намагається відновити приймання голосу, виходячи з голосової сесії та повторно приєднуючись після повторюваних помилок розшифрування.
- `channels.discord.streaming` — канонічний ключ режиму потоку. Застарілі значення `streamMode` і булеві `streaming` автоматично мігруються.
- `channels.discord.autoPresence` зіставляє доступність runtime зі статусом присутності бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінними іменами/тегами (режим сумісності break-glass).
- `channels.discord.execApprovals`: нативна для Discord доставка підтверджень exec і авторизація тих, хто може підтверджувати.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі підтвердження exec активуються, коли тих, хто підтверджує, можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено підтверджувати запити exec. Якщо не вказано, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Не вказуйте, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити підтвердження. `"dm"` (за замовчуванням) надсилає в DM тих, хто підтверджує, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва. Коли target містить `"channel"`, кнопки можуть використовувати лише визначені користувачі, що підтверджують.
  - `cleanupAfterResolve`: коли `true`, видаляє DM підтвердження після схвалення, відхилення або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, за замовчуванням), `all` (усі повідомлення), `allowlist` (з `guilds.<id>.users` для всіх повідомлень).

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
- Резерви env: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінним email principal (режим сумісності break-glass).

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

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резерву env облікового запису за замовчуванням).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (у корені або для окремого облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API receiver Bolt. Використовуйте це лише під час дослідження ping/pong timeout або застарілої поведінки websocket.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають plaintext
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack надають поля джерела/статусу для окремих credential, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, в HTTP mode,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточна команда/шлях runtime не змогли
  визначити значення secret.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ID облікового запису.
- `channels.slack.streaming.mode` — канонічний ключ режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним транспортом потокової передачі Slack. Застарілі значення `streamMode`, булеві `streaming` і `nativeStreaming` автоматично мігруються.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сесій потоків:** `thread.historyScope` є окремою для кожного потоку (за замовчуванням) або спільною для каналу. `thread.inheritParent` копіює transcript батьківського каналу до нових потоків.

- Нативна потокова передача Slack разом зі статусом потоку в стилі асистента Slack "is typing..." потребують цілі у вигляді потоку відповіді. DM верхнього рівня за замовчуванням залишаються поза потоком, тому вони все одно можуть передаватися через Slack draft post-and-edit previews замість показу нативного потоку/попереднього перегляду статусу у стилі потоку.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, доки відповідь виконується, а потім видаляє її після завершення. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка підтверджень exec і авторизація тих, хто може підтверджувати. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій | За замовчуванням | Примітки                  |
| ------------ | ------- | ---------------------- |
| reactions    | увімкнено | Реагування + список реакцій |
| messages     | увімкнено | Читання/надсилання/редагування/видалення  |
| pins         | увімкнено | Закріплення/відкріплення/список         |
| memberInfo   | увімкнено | Інформація про учасника            |
| emojiList    | увімкнено | Список користувацьких emoji      |

### Mattermost

Mattermost постачається як bundled plugin у поточних релізах OpenClaw. Старіші або
кастомні збірки можуть встановити поточний пакет npm за допомогою
`openclaw plugins install @openclaw/mattermost`. Перевірте
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
для поточних dist-tags перед фіксацією версії.

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

Режими чату: `oncall` (відповідати на @-згадку, за замовчуванням), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса-тригера).

Коли нативні команди Mattermost увімкнено:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повним URL.
- `commands.callbackUrl` має вказувати на кінцеву точку OpenClaw Gateway і бути доступним із сервера Mattermost.
- Нативні callback-и slash-команд автентифікуються токенами для кожної команди, які повертає
  Mattermost під час реєстрації slash-команди. Якщо реєстрація не вдалася або жодні
  команди не активовано, OpenClaw відхиляє callback-и з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів callback-ів Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив callback-хост/домен.
  Використовуйте значення хоста/домену, а не повні URL.
- `channels.mattermost.configWrites`: дозволити або заборонити ініційовані Mattermost записи конфігурації.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: поканальне перевизначення шлюзування за згадкою (`"*"` для типового значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому id облікового запису.

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
- `channels.signal.configWrites`: дозволити або заборонити ініційовані Signal записи конфігурації.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому id облікового запису.

### BlueBubbles

BlueBubbles є рекомендованим шляхом iMessage (на основі Plugin, налаштовується в `channels.bluebubbles`).

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
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому id облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до сталих сеансів ACP. Використовуйте handle BlueBubbles або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [ACP Agents](/uk/tools/acp-agents#persistent-channel-bindings).
- Повна конфігурація каналу BlueBubbles задокументована в [BlueBubbles](/uk/channels/bluebubbles).

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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому id облікового запису.

- Потрібен Full Disk Access до Messages DB.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб перелічити чати.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують вхідні шляхи вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ relay-хоста вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити ініційовані iMessage записи конфігурації.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до сталих сеансів ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [ACP Agents](/uk/tools/acp-agents#persistent-channel-bindings).

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

- Автентифікація за токеном використовує `accessToken`; автентифікація за паролем використовує `userId` + `password`.
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначити його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і це мережеве opt-in налаштування є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із кількома обліковими записами.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати та нові запрошення у стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` із `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка схвалень exec і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати exec-запити.
  - `agentFilter`: необов’язковий allowlist ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансів (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для кожного облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM-и Matrix групуються в сеанси: `per-user` (типово) спільно використовується за маршрутизованим peer, а `per-room` ізолює кожну DM-кімнату.
- Проби статусу Matrix і live-пошуки в каталозі використовують ту саму політику проксі, що й трафік під час виконання.
- Повна конфігурація Matrix, правила націлювання та приклади налаштування задокументовані в [Matrix](/uk/channels/matrix).

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
- Повна конфігурація Teams (облікові дані, Webhook, політика DM/груп, перевизначення для кожної команди/каналу) задокументована в [Microsoft Teams](/uk/channels/msteams).

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
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому id облікового запису.
- Повна конфігурація каналу IRC (host/port/TLS/channels/allowlists/mention gating) задокументована в [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

Запускайте кілька облікових записів на канал (кожен із власним `accountId`):

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
- Env-токени застосовуються лише до **типового** облікового запису.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте нетиповий обліковий запис через `openclaw channels add` (або onboarding каналу), поки ще використовуєте конфігурацію каналу верхнього рівня з одним обліковим записом, OpenClaw спершу переносить значення верхнього рівня для одного облікового запису з областю облікового запису в мапу облікових записів каналу, щоб початковий обліковий запис продовжував працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише до каналу (без `accountId`) і надалі відповідають типовому обліковому запису; прив’язки з областю облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня для одного облікового запису з областю облікового запису в підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовує `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші Plugin-канали

Багато Plugin-каналів налаштовуються як `channels.<id>` і задокументовані на власних сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Дивіться повний індекс каналів: [Канали](/uk/channels).

### Шлюзування згадок у груповому чаті

Групові повідомлення типово **вимагають згадки** (metadata-згадка або безпечні regex-шаблони). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Видимі відповіді керуються окремо. Групові/канальні кімнати типово мають `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw усе ще обробляє хід, але звичайні фінальні відповіді залишаються приватними, а видимий вивід у кімнату вимагає `message(action=send)`. Задавайте `"automatic"` лише тоді, коли потрібна legacy-поведінка, за якої звичайні відповіді публікуються назад у кімнату. Щоб застосувати ту саму поведінку видимих відповідей лише через інструмент також до прямих чатів, задайте `messages.visibleReplies: "message_tool"`; Codex harness також використовує цю поведінку лише через інструмент як своє типове значення для прямих чатів, коли його не задано.

Якщо інструмент повідомлень недоступний за активною політикою інструментів, OpenClaw повертається до автоматичних видимих відповідей замість мовчазного пригнічення відповіді. `openclaw doctor` попереджає про цю невідповідність.

Gateway гаряче перезавантажує конфігурацію `messages` після збереження файла. Перезапуск потрібен лише тоді, коли спостереження за файлами або перезавантаження конфігурації вимкнено в розгортанні.

**Типи згадок:**

- **Metadata-згадки**: Нативні платформні @-згадки. Ігноруються в режимі self-chat WhatsApp.
- **Текстові шаблони**: Безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечне вкладене повторення ігноруються.
- Шлюзування згадок застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Задайте `0`, щоб вимкнути.

`messages.visibleReplies` — це глобальне значення за замовчуванням для вихідного ходу; `messages.groupChat.visibleReplies` перевизначає його для вихідних ходів групи/каналу. Коли `messages.visibleReplies` не задано, обв’язка може надати власне значення за замовчуванням для прямих/вихідних чатів; обв’язка Codex за замовчуванням використовує `message_tool`. Дозволені списки каналів і фільтрація за згадками все одно визначають, чи буде хід оброблено.

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

Визначення: перевизначення для окремого DM → значення за замовчуванням провайдера → без обмеження (зберігається все).

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

### Команди (обробка команд у чаті)

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

<Accordion title="Command details">

- Цей блок налаштовує поверхні команд. Поточний вбудований і комплектний каталог команд див. у [слеш-командах](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, якими володіють канали/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовано на сторінках відповідних каналів/Plugin, а також у [слеш-командах](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (булеве значення або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначайте нативну реєстрацію Skills для окремого каналу за допомогою `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню Telegram-бота.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled` і відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; режим лише для читання `/config show` залишається доступним звичайним операторським клієнтам з областю доступу на запис.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованого OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення, встановлення та керування ввімкненням/вимкненням Plugin.
- `channels.<provider>.configWrites` обмежує мутації конфігурації для окремого каналу (за замовчуванням: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, націлені на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. За замовчуванням: `true`.
- `ownerAllowFrom` — це явний дозволений список власників для команд/інструментів лише для власника. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному prompt. Задайте `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Коли його задано, це **єдине** джерело авторизації (дозволені списки/спарювання каналів і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не задано.
- Мапа документації команд:
  - вбудований і комплектний каталог: [слеш-команди](/uk/tools/slash-commands)
  - поверхні команд для окремих каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди спарювання: [Спарювання](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
