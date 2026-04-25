---
read_when:
    - Налаштування плагіна каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення проблем із ключами конфігурації для кожного каналу
    - Аудит політики приватних повідомлень, політики груп або обмеження за згадками
summary: 'Конфігурація каналів: контроль доступу, сполучення, окремі ключі для кожного каналу у Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-04-25T11:56:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b7071f7cda3f7f71b464e64c2abb8e0b88326606234f0cf7778c80a7ef4b3e0
    source_path: gateway/config-channels.md
    workflow: 15
---

Ключі конфігурації для кожного каналу в `channels.*`. Охоплює доступ до приватних повідомлень і груп,
налаштування з кількома обліковими записами, обмеження за згадками та окремі ключі для кожного каналу для Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage та інших вбудованих плагінів каналів.

Для агентів, інструментів, середовища виконання Gateway та інших ключів верхнього рівня див.
[Довідник із конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не вказано `enabled: false`).

### Доступ до приватних повідомлень і груп

Усі канали підтримують політики приватних повідомлень і політики груп:

| Політика приватних повідомлень | Поведінка                                                      |
| ------------------------------ | -------------------------------------------------------------- |
| `pairing` (типово)             | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`                    | Лише відправники в `allowFrom` (або в пов’язаному сховищі дозволів) |
| `open`                         | Дозволити всі вхідні приватні повідомлення (потрібно `allowFrom: ["*"]`) |
| `disabled`                     | Ігнорувати всі вхідні приватні повідомлення                    |

| Політика груп          | Поведінка                                               |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (типово)   | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                 | Обійти списки дозволених груп (обмеження за згадками все одно застосовується) |
| `disabled`             | Блокувати всі повідомлення в групах/кімнатах           |

<Note>
`channels.defaults.groupPolicy` встановлює типове значення, коли `groupPolicy` провайдера не задано.
Коди сполучення дійсні протягом 1 години. Кількість очікувальних запитів на сполучення в приватних повідомленнях обмежена **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп у середовищі виконання повертається до `allowlist` (безпечне блокування за замовчуванням) із попередженням під час запуску.
</Note>

### Перевизначення моделі для каналу

Використовуйте `channels.modelByChannel`, щоб закріпити певні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Відображення каналу застосовується, коли для сесії ще не задано перевизначення моделі (наприклад, встановлене через `/model`).

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

### Типові параметри каналів і Heartbeat

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

- `channels.defaults.groupPolicy`: резервна політика груп, коли `groupPolicy` на рівні провайдера не задано.
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь контекст цитат/гілок/історії), `allowlist` (включати контекст лише від відправників зі списку дозволених), `allowlist_quote` (те саме, що `allowlist`, але зберігати явний контекст цитати/відповіді). Перевизначення для окремого каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати стани справних каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати стани деградації/помилок у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує пов’язана сесія.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // сині позначки (false у режимі чату із собою)
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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше — перший налаштований ідентифікатор облікового запису (у відсортованому порядку).
- Необов’язковий параметр `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису переноситься командою `openclaw doctor` до `whatsapp/default`.
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
      streaming: "partial", // off | partial | block | progress (типово: off; увімкніть явно, щоб уникнути обмежень частоти для попередніх переглядів редагування)
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; символьні посилання відхиляються), з резервним значенням `TELEGRAM_BOT_TOKEN` для типового облікового запису.
- Необов’язковий параметр `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- У конфігураціях із кількома обліковими записами (2+ ідентифікатори облікових записів) задайте явний типовий обліковий запис (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути маршрутизації через резервне значення; `openclaw doctor` попереджає, коли цього немає або значення некоректне.
- `configWrites: false` блокує ініційовані з Telegram записи конфігурації (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічне `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна з [Агенти ACP](/uk/tools/acp-agents#channel-specific-settings).
- Попередній перегляд потоків у Telegram використовує `sendMessage` + `editMessageText` (працює в особистих і групових чатах).
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

- Токен: `channels.discord.token`, з резервним значенням `DISCORD_BOT_TOKEN` для типового облікового запису.
- Прямі вихідні виклики, у яких явно передано Discord `token`, використовують цей токен для виклику; налаштування повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку середовища виконання.
- Необов’язковий параметр `channels.discord.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- Для цілей доставки використовуйте `user:<id>` (DM) або `channel:<id>` (канал сервера); прості числові ID відхиляються.
- Слаги серверів мають нижній регістр, а пробіли замінюються на `-`; ключі каналів використовують назву у вигляді слага (без `#`). Надавайте перевагу ID серверів.
- Повідомлення, створені ботом, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення на рівні каналу) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (крім @everyone/@here).
- `maxLinesPerMessage` (типово 17) розбиває довгі за висотою повідомлення, навіть якщо вони коротші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією, прив’язаною до гілок Discord:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до гілок (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і доставка/маршрутизація з прив’язкою)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач opt-in для автоматичного створення/прив’язки гілок у `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і гілок (використовуйте id каналу/гілки в `match.peer.id`). Семантика полів спільна з [Агенти ACP](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + LLM + TTS.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, що використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` напряму передаються в параметри DAVE `@discordjs/voice` (типово `true` і `24`).
- OpenClaw додатково намагається відновити прийом голосу, виходячи з голосової сесії та приєднуючись повторно після повторних помилок дешифрування.
- `channels.discord.streaming` — це канонічний ключ режиму потокової передачі. Застарілі значення `streamMode` і булеві значення `streaming` мігруються автоматично.
- `channels.discord.autoPresence` зіставляє доступність середовища виконання зі статусом присутності бота (healthy => online, degraded => idle, exhausted => dnd) і дає змогу необов’язково перевизначати текст статусу.
- `channels.discord.dangerouslyAllowNameMatching` знову вмикає зіставлення за змінним ім’ям/тегом (режим сумісності break-glass).
- `channels.discord.execApprovals`: нативна для Discord доставка підтверджень exec і авторизація тих, хто може їх схвалювати.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto підтвердження exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: Discord ID користувачів, яким дозволено схвалювати exec-запити. Якщо не вказано, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Не вказуйте, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (типово) надсилає в приватні повідомлення схвалювачам, `"channel"` надсилає у вихідний канал, `"both"` надсилає в обидва місця. Коли target містить `"channel"`, кнопками можуть користуватися лише визначені схвалювачі.
  - `cleanupAfterResolve`: коли `true`, видаляє приватні повідомлення з підтвердженням після схвалення, відхилення або тайм-ауту.

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

- JSON облікового запису служби: вбудований (`serviceAccount`) або на основі файлу (`serviceAccountFile`).
- Також підтримується SecretRef для облікового запису служби (`serviceAccountRef`).
- Резервні значення середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Для цілей доставки використовуйте `spaces/<spaceId>` або `users/<userId>`.
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
        nativeTransport: true, // використовувати нативний API потокової передачі Slack, коли mode=partial
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

- **Режим socket** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як резервні значення змінних середовища для типового облікового запису).
- **Режим HTTP** потребує `botToken` плюс `signingSecret` (у корені або для окремого облікового запису).
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack показують поля джерела/стану для кожного облікового
  даного, наприклад `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштований через SecretRef, але поточний шлях команди/середовища виконання не зміг
  визначити значення секрету.
- `configWrites: false` блокує ініційовані зі Slack записи конфігурації.
- Необов’язковий параметр `channels.slack.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- `channels.slack.streaming.mode` — це канонічний ключ режиму потокової передачі Slack. `channels.slack.streaming.nativeTransport` керує нативним транспортом потокової передачі Slack. Застарілі значення `streamMode`, булеві значення `streaming` і `nativeStreaming` мігруються автоматично.
- Для цілей доставки використовуйте `user:<id>` (DM) або `channel:<id>`.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (із `reactionAllowlist`).

**Ізоляція сесій у гілках:** `thread.historyScope` є для кожної гілки окремо (типово) або спільним для каналу. `thread.inheritParent` копіює стенограму батьківського каналу в нові гілки.

- Нативна потокова передача Slack разом зі статусом гілки в стилі помічника Slack "is typing..." потребують цілі відповіді у гілці. Приватні повідомлення верхнього рівня типово не використовують гілки, тому замість попереднього перегляду в стилі гілки для них використовується `typingReaction` або звичайна доставка.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім прибирає її після завершення. Використовуйте короткий код емодзі Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка підтверджень exec і авторизація схвалювачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій   | Типово увімкнено | Примітки                 |
| ----------- | ---------------- | ------------------------ |
| reactions   | увімкнено        | Реагування + список реакцій |
| messages    | увімкнено        | Читання/надсилання/редагування/видалення |
| pins        | увімкнено        | Закріплення/відкріплення/список |
| memberInfo  | увімкнено        | Інформація про учасника  |
| emojiList   | увімкнено        | Список користувацьких емодзі |

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
        // Необов’язкова явна URL-адреса для розгортань із reverse proxy/публічним доступом
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Режими чату: `oncall` (відповідати на @-згадку, типово), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса тригера).

Коли ввімкнено нативні команди Mattermost:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на endpoint Gateway OpenClaw і бути досяжною із сервера Mattermost.
- Нативні slash callback автентифікуються за допомогою токенів кожної команди, які
  Mattermost повертає під час реєстрації slash command. Якщо реєстрація не вдається або
  жодні команди не активовано, OpenClaw відхиляє callback із повідомленням
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/internal хостів callback Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен callback.
  Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити ініційовані з Mattermost записи конфігурації.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення обмеження за згадками для окремого каналу (`"*"` для типового значення).
- Необов’язковий параметр `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.

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

- `channels.signal.account`: закріпити запуск каналу за певною ідентичністю облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити ініційовані з Signal записи конфігурації.
- Необов’язковий параметр `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.

### BlueBubbles

BlueBubbles — це рекомендований шлях для iMessage (на основі Plugin, налаштовується в `channels.bluebubbles`).

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

- Основні шляхи ключів, охоплені тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий параметр `channels.bluebubbles.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних сесій ACP. Використовуйте BlueBubbles handle або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [Агенти ACP](/uk/tools/acp-agents#channel-specific-settings).
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

- Необов’язковий параметр `channels.imessage.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.

- Потрібен Full Disk Access до бази даних Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує строгу перевірку ключа хоста, тому переконайтеся, що ключ хоста ретранслятора вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити ініційовані з iMessage записи конфігурації.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сесій ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [Агенти ACP](/uk/tools/acp-agents#channel-specific-settings).

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
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S) проксі. Іменовані облікові записи можуть перевизначати його через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/internal homeserver. `proxy` і цей мережевий opt-in — незалежні елементи керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із кількома обліковими записами.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати та нові запрошення у стилі DM ігноруються, доки ви не встановите `autoJoin: "allowlist"` із `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка підтверджень exec і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). У режимі auto підтвердження exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: Matrix user ID (наприклад `@owner:example.org`), яким дозволено схвалювати exec-запити.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Не вказуйте, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (типово), `"channel"` (вихідна кімната) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (типово) спільно використовує сесію за маршрутизованим peer, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки стану Matrix і живі пошуки в каталозі використовують ту саму політику проксі, що й трафік середовища виконання.
- Повну конфігурацію Matrix, правила націлювання та приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams працює на основі Plugin і налаштовується в `channels.msteams`.

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

- Основні шляхи ключів, охоплені тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, webhook, політику DM/груп, перевизначення для окремих команд/каналів) задокументовано в [Microsoft Teams](/uk/channels/msteams).

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
- Необов’язковий параметр `channels.irc.defaultAccount` перевизначає вибір типового облікового запису, якщо він збігається з налаштованим ідентифікатором облікового запису.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlists/обмеження за згадками) задокументовано в [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

Запускайте кілька облікових записів для одного каналу (кожен зі своїм `accountId`):

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
- Токени середовища застосовуються лише до облікового запису **default**.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте не-типовий обліковий запис через `openclaw channels add` (або онбординг каналу), поки ще використовуєте однооблікову конфігурацію каналу верхнього рівня, OpenClaw спочатку переносить значення верхнього рівня для одного облікового запису, що належать обліковому запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Для більшості каналів вони переміщуються в `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише на рівні каналу (без `accountId`) і надалі відповідатимуть типовому обліковому запису; прив’язки на рівні облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня для одного облікового запису, що належать обліковому запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Перегляньте повний індекс каналів: [Канали](/uk/channels).

### Обмеження за згадками в групових чатах

Для повідомлень у групах типово **потрібна згадка** (метадані згадки або безпечні шаблони regex). Це застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

**Типи згадок:**

- **Згадки в метаданих**: нативні @-згадки платформи. Ігноруються в режимі чату із собою WhatsApp.
- **Текстові шаблони**: безпечні шаблони regex у `agents.list[].groupChat.mentionPatterns`. Некоректні шаблони та небезпечні вкладені повторення ігноруються.
- Обмеження за згадками застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне типове значення. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Установіть `0`, щоб вимкнути.

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

Розв’язання: перевизначення для конкретного DM → типове значення провайдера → без обмеження (зберігається все).

Підтримується: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим чату із собою

Додайте власний номер у `allowFrom`, щоб увімкнути режим чату із собою (ігнорує нативні @-згадки, відповідає лише на текстові шаблони):

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
    native: "auto", // реєструвати нативні команди, коли це підтримується
    nativeSkills: "auto", // реєструвати нативні команди Skills, коли це підтримується
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

- Цей блок налаштовує поверхні команд. Для поточного каталогу вбудованих + комплектних команд див. [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка — це **довідник ключів конфігурації**, а не повний каталог команд. Команди, що належать каналу/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовані на сторінках відповідних каналів/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, але залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, але залишає Slack вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначайте реєстрацію нативних команд Skills для окремого каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled`, а відправник має бути в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; лише читання `/config show` залишається доступним для звичайних клієнтів оператора з правом запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованого OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для пошуку Plugin, встановлення та елементів керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` контролює, чи дозволені зміни конфігурації для кожного каналу (типово: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також контролює записи, націлені на цей обліковий запис (наприклад `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску gateway. Типове значення: `true`.
- `ownerAllowFrom` — це явний список дозволених власників для команд/інструментів, доступних лише власнику. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному prompt. Встановіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` є окремим для кожного провайдера. Якщо його задано, це **єдине** джерело авторизації (списки дозволених каналів/сполучення та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дає командам змогу обходити політики груп доступу, коли `allowFrom` не задано.
- Відповідність документації команд:
  - каталог вбудованих + комплектних команд: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд для окремих каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди сполучення: [Сполучення](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
