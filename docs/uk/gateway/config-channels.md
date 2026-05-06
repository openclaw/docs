---
read_when:
    - Налаштування Plugin каналу (автентифікація, керування доступом, кілька облікових записів)
    - Усунення несправностей із ключами конфігурації для окремих каналів
    - Аудит політики особистих повідомлень, групової політики або обмеження згадок
summary: 'Конфігурація каналів: контроль доступу, сполучення, ключі для кожного каналу у Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-05-06T12:49:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9be70fd706bcf5acfd06b99632c97f4affb854c6aed02558f70c0403247c448
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації для каналів у `channels.*`. Охоплює доступ до DM і груп, налаштування кількох облікових записів, обмеження за згадкою та ключі окремих каналів для Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших вбудованих Plugin каналів.

Для агентів, інструментів, середовища виконання gateway та інших ключів верхнього рівня див. [Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не вказано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і політики груп:

| Політика DM         | Поведінка                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або в сховищі дозволених сполучень) |
| `open`              | Дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                        |

| Політика групи        | Поведінка                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                | Обходити списки дозволених груп (обмеження за згадкою все одно застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Кількість очікуваних запитів на сполучення DM обмежена **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` немає), політика груп середовища виконання повертається до `allowlist` (fail-closed) із попередженням під час запуску.
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

Використовуйте `channels.defaults` для спільної політики груп і поведінки Heartbeat між провайдерами:

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
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь процитований контекст/контекст гілки/історії), `allowlist` (включати лише контекст від відправників зі списку дозволених), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні статуси каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати погіршені/помилкові статуси у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відтворювати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал gateway (Baileys Web). Він запускається автоматично, коли існує прив’язаний сеанс.

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

<Accordion title="WhatsApp із кількома обліковими записами">

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше перший налаштований ID облікового запису (відсортований).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, коли він збігається з налаштованим ID облікового запису.
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
- `apiRoot` — це лише корінь Telegram Bot API. Використовуйте `https://api.telegram.org` або власний self-hosted/proxy корінь, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий завершальний суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ID облікового запису.
- У налаштуваннях із кількома обліковими записами (2+ ID облікових записів) задайте явне типове значення (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли це значення відсутнє або недійсне.
- `configWrites: false` блокує ініційовані Telegram записи конфігурації (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` із `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
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
      streaming: "off", // off | partial | block | progress
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

- Токен: `channels.discord.token`, із `DISCORD_BOT_TOKEN` як резервом для облікового запису за замовчуванням.
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; налаштування повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку середовища виконання.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з ідентифікатором налаштованого облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал гільдії) для цілей доставки; прості числові ID відхиляються.
- Слаги гільдій записуються в нижньому регістрі з пробілами, заміненими на `-`; ключі каналів використовують назву зі слагом (без `#`). Надавайте перевагу ID гільдій.
- Повідомлення, створені ботами, за замовчуванням ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний вихідний текст `@handle` з ID користувачів Discord перед надсиланням, тому відомих учасників команди можна згадувати детерміновано, навіть коли тимчасовий кеш каталогу порожній. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (за замовчуванням 17) розділяє високі повідомлення, навіть якщо вони менші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до тредів:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до тредів (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного скасування фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSessions`: перемикач для `sessions_spawn({ thread: true })` і автоматичного створення/прив’язування тредів під час ACP thread-spawn (за замовчуванням: `true`)
  - `defaultSpawnContext`: нативний контекст субагента для запусків, прив’язаних до тредів (за замовчуванням `"fork"`)
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують сталі прив’язки ACP для каналів і тредів (використовуйте ID каналу/треду в `match.peer.id`). Семантика полів спільна в [ACP-агентах](/uk/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення автоматичного приєднання + LLM + TTS. Конфігурації Discord лише для тексту залишають голос вимкненим за замовчуванням; задайте `channels.discord.voice.enabled=true`, щоб увімкнути його.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, що використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE `@discordjs/voice` (за замовчуванням `true` і `24`).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням `@discordjs/voice` Ready для `/vc join` і спроб автоматичного приєднання (за замовчуванням `30000`).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки часу від’єднана голосова сесія може переходити в сигналізацію повторного підключення, перш ніж OpenClaw її знищить (за замовчуванням `15000`).
- OpenClaw додатково намагається відновити приймання голосу, виходячи з голосової сесії та повторно приєднуючись до неї після повторюваних збоїв розшифрування.
- `channels.discord.streaming` є канонічним ключем режиму потоку. Застарілі значення `streamMode` і булеві `streaming` залишаються псевдонімами середовища виконання; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `channels.discord.autoPresence` зіставляє доступність середовища виконання з присутністю бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним іменем/тегом (режим сумісності на крайній випадок).
- `channels.discord.execApprovals`: нативна для Discord доставка схвалень exec і авторизація затверджувачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі схвалення exec активуються, коли затверджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати запити exec. Якщо пропущено, використовується резерв `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або регулярний вираз).
  - `target`: куди надсилати запити на схвалення. `"dm"` (за замовчуванням) надсилає в DM затверджувачів, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва місця. Коли ціль містить `"channel"`, кнопками можуть користуватися лише визначені затверджувачі.
  - `cleanupAfterResolve`: коли `true`, видаляє DM зі схваленнями після схвалення, відхилення або тайм-ауту.

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

- JSON сервісного облікового запису: вбудований (`serviceAccount`) або файловий (`serviceAccountFile`).
- SecretRef сервісного облікового запису також підтримується (`serviceAccountRef`).
- Резерви змінних середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним принципалом email (режим сумісності на крайній випадок).

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

- **Режим Socket** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резерву змінних середовища облікового запису за замовчуванням).
- **Режим HTTP** потребує `botToken` плюс `signingSecret` (на корені або для окремого облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API отримувача Bolt. Використовуйте це лише під час розслідування тайм-аутів ping/pong або поведінки застарілого websocket.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack надають поля джерела/статусу для окремих облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, в режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштований через SecretRef, але поточний шлях команди/середовища виконання не зміг
  визначити значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з ідентифікатором налаштованого облікового запису.
- `channels.slack.streaming.mode` є канонічним ключем режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним потоковим транспортом Slack. Застарілі значення `streamMode`, булеві `streaming` і `nativeStreaming` залишаються псевдонімами середовища виконання; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сесій тредів:** `thread.historyScope` є окремою для кожного треду (за замовчуванням) або спільною для каналу. `thread.inheritParent` копіює стенограму батьківського каналу до нових тредів.

- Нативний streaming Slack разом зі статусом треду в стилі асистента Slack "is typing..." потребують цільового треду відповіді. DM верхнього рівня за замовчуванням залишаються поза тредом, тож вони все одно можуть streaming через чернеткові попередні перегляди Slack із публікацією та редагуванням замість показу попереднього перегляду нативного потоку/статусу в стилі треду.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode емодзі Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка схвалень exec і авторизація затверджувачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій    | За замовчуванням | Примітки                         |
| ------------ | ---------------- | -------------------------------- |
| reactions    | увімкнено        | Реагувати + перелічувати реакції |
| messages     | увімкнено        | Читати/надсилати/редагувати/видаляти |
| pins         | увімкнено        | Закріпити/відкріпити/перелічити |
| memberInfo   | увімкнено        | Інформація про учасника          |
| emojiList    | увімкнено        | Список користувацьких емодзі     |

### Mattermost

Mattermost постачається як bundled plugin у поточних випусках OpenClaw. Старіші або
користувацькі збірки можуть установити поточний пакет npm за допомогою
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

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на кінцеву точку Gateway OpenClaw і бути доступним із сервера Mattermost.
- Нативні slash-зворотні виклики автентифікуються токенами для кожної команди, які повертає
  Mattermost під час реєстрації slash-команди. Якщо реєстрація не вдається або
  жодні команди не активовано, OpenClaw відхиляє зворотні виклики з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів зворотних викликів Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен зворотного виклику.
  Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити ініційовані Mattermost записи конфігурації.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення фільтрації згадок для окремого каналу (`"*"` для типового значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли збігається з ідентифікатором налаштованого облікового запису.

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

- `channels.signal.account`: прив’язати запуск каналу до конкретної ідентичності облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити ініційовані Signal записи конфігурації.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли збігається з ідентифікатором налаштованого облікового запису.

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

- Основні шляхи ключів, описані тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли збігається з ідентифікатором налаштованого облікового запису.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до сталих сесій ACP. Використовуйте handle BlueBubbles або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли збігається з ідентифікатором налаштованого облікового запису.

- Потрібен Full Disk Access до БД Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують вхідні шляхи вкладень (за замовчуванням: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ хоста ретранслятора вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити ініційовані iMessage записи конфігурації.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до сталих сесій ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

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
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначити це за допомогою `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver. `proxy` і ця явна згода на мережу є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із кількома обліковими записами.
- `channels.matrix.autoJoin` за замовчуванням має значення `off`, тому запрошені кімнати й нові запрошення в стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка схвалень виконання й авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі схвалення виконання активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати запити виконання.
  - `agentFilter`: необов’язковий список дозволених ідентифікаторів агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (за замовчуванням), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (за замовчуванням) спільно використовує сесію за маршрутизованим peer, тоді як `per-room` ізолює кожну DM-кімнату.
- Проби стану Matrix і live-пошуки в каталозі використовують ту саму політику проксі, що й runtime-трафік.
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
      // see /channels/msteams
    },
  },
}
```

- Основні шляхи ключів, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, Webhook, політика DM/груп, перевизначення для окремих команд/каналів) задокументовано в [Microsoft Teams](/uk/channels/msteams).

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

- Основні шляхи ключів, описані тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли збігається з ідентифікатором налаштованого облікового запису.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlists/mention gating) задокументовано в [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

Запустіть кілька облікових записів на канал (кожен із власним `accountId`):

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
- Якщо ви додаєте обліковий запис не за замовчуванням через `openclaw channels add` (або під час onboarding каналу), залишаючись на конфігурації каналу верхнього рівня з одним обліковим записом, OpenClaw спершу переносить scoped до облікового запису значення верхнього рівня для одного облікового запису в мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише до каналу (без `accountId`) продовжують відповідати типовому обліковому запису; прив’язки scoped до облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи scoped до облікового запису значення верхнього рівня для одного облікового запису в підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші Plugin-канали

Багато Plugin-каналів налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Див. повний індекс каналів: [Канали](/uk/channels).

### Фільтрація згадок у групових чатах

Групові повідомлення за замовчуванням **вимагають згадки** (метадані згадки або безпечні regex-шаблони). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Видимі відповіді керуються окремо. Для групових/канальних кімнат за замовчуванням використовується `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw все одно обробляє turn, але звичайні фінальні відповіді залишаються приватними, а видимий вивід у кімнату потребує `message(action=send)`. Задавайте `"automatic"` лише тоді, коли хочете legacy-поведінку, за якої звичайні відповіді публікуються назад у кімнату. Щоб застосувати таку саму поведінку видимих відповідей лише через інструмент і до прямих чатів, задайте `messages.visibleReplies: "message_tool"`; harness Codex також використовує цю поведінку лише через інструмент як своє незадане типове значення для прямих чатів.

Видимі відповіді лише через інструмент потребують моделі/runtime, що надійно викликає інструменти. Якщо
журнал сесії показує текст асистента з `didSendViaMessagingTool: false`, то
модель створила приватну фінальну відповідь замість виклику інструмента повідомлень.
Перейдіть на сильнішу модель для виклику інструментів для цього каналу або задайте
`messages.groupChat.visibleReplies: "automatic"`, щоб відновити legacy-видимі фінальні
відповіді.

Якщо інструмент повідомлень недоступний за активної політики інструментів, OpenClaw повертається до автоматичних видимих відповідей замість мовчазного придушення відповіді. `openclaw doctor` попереджає про цю невідповідність.

Gateway гаряче перезавантажує конфігурацію `messages` після збереження файлу. Перезапускайте лише тоді, коли спостереження за файлами або перезавантаження конфігурації вимкнено в розгортанні.

**Типи згадок:**

- **Згадки в метаданих**: Нативні @-згадки платформи. Ігноруються в режимі самочату WhatsApp.
- **Текстові шаблони**: Безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечні вкладені повторення ігноруються.
- Обмеження за згадками застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначити його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Установіть `0`, щоб вимкнути.

`messages.visibleReplies` є глобальним значенням за замовчуванням для вихідного ходу; `messages.groupChat.visibleReplies` перевизначає його для вихідних ходів групи/каналу. Коли `messages.visibleReplies` не задано, harness може надати власне значення за замовчуванням для прямих/вихідних чатів; harness Codex за замовчуванням використовує `message_tool`. Дозвільні списки каналів і обмеження за згадками все одно визначають, чи буде хід оброблено.

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

Порядок визначення: перевизначення для конкретного DM → значення провайдера за замовчуванням → без обмеження (зберігається все).

Підтримується: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

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
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, пам’ять `/dreaming`, керування телефоном `/phone` і Talk `/voice`, документуються на сторінках відповідних каналів/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (bool або `"auto"`). Для Discord `false` пропускає реєстрацію нативних команд і очищення під час запуску.
- Перевизначайте реєстрацію нативних команд Skills для окремого каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові пункти меню Telegram-бота.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled` і відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; доступна лише для читання команда `/config show` залишається доступною для звичайних операторських клієнтів із правом запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованого OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, встановлення та керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` обмежує зміни конфігурації для окремого каналу (за замовчуванням: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, ціллю яких є цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. За замовчуванням: `true`.
- `ownerAllowFrom` є явним дозвільним списком власників для команд/інструментів лише для власника. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному prompt. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Коли його задано, він є **єдиним** джерелом авторизації (дозвільні списки/сполучення каналів і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не задано.
- Мапа документації команд:
  - вбудований і bundled каталог: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд для окремих каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди сполучення: [Сполучення](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — agents](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
