---
read_when:
    - Налаштування Plugin каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення несправностей із ключами конфігурації для кожного каналу
    - Аудит політики DM, політики груп або обмеження за згадками
summary: 'Конфігурація каналів: контроль доступу, сполучення, ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-05-02T02:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc790f19aed583b4c52988c170c8883bf56282cfbf3eae26f655f7a4660bd4ed
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації для окремих каналів у `channels.*`. Охоплює доступ до DM і груп,
налаштування з кількома обліковими записами, обмеження за згадкою та ключі для окремих каналів Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage та інших bundled channel plugins.

Для агентів, інструментів, середовища виконання Gateway та інших ключів верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і групові політики:

| Політика DM         | Поведінка                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або paired allow store)         |
| `open`              | Дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                        |

| Групова політика      | Поведінка                                              |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (типово)  | Лише групи, що відповідають налаштованому allowlist    |
| `open`                | Обійти групові allowlists (обмеження за згадкою все ще застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення DM обмежено **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), групова політика під час виконання повертається до `allowlist` (fail-closed) із попередженням під час запуску.
</Note>

### Перевизначення моделей каналів

Використовуйте `channels.modelByChannel`, щоб закріпити конкретні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналів застосовується, коли сеанс ще не має перевизначення моделі (наприклад, заданого через `/model`).

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
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включає весь контекст цитат/тредів/історії), `allowlist` (включає лише контекст від відправників з allowlist), `allowlist_quote` (те саме, що allowlist, але зберігає явний контекст цитати/відповіді). Перевизначення для окремого каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні статуси каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати погіршені/помилкові статуси у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує прив’язаний сеанс.

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше перший налаштований ID облікового запису (у відсортованому порядку).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, коли він збігається з налаштованим ID облікового запису.
- Застарілий каталог авторизації Baileys для одного облікового запису мігрується командою `openclaw doctor` у `whatsapp/default`.
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; symlinks відхиляються), з `TELEGRAM_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- `apiRoot` — це лише корінь Telegram Bot API. Використовуйте `https://api.telegram.org` або власний self-hosted/proxy root, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий кінцевий суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ID облікового запису.
- У налаштуваннях із кількома обліковими записами (2+ ID облікових записів) задайте явний типовий обліковий запис (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли він відсутній або недійсний.
- `configWrites: false` блокує записи конфігурації, ініційовані Telegram (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` із `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [Агентах ACP](/uk/tools/acp-agents#channel-specific-settings).
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

- Токен: `channels.discord.token`, із `DISCORD_BOT_TOKEN` як резервним варіантом для облікового запису за замовчуванням.
- Прямі вихідні виклики, які надають явний `token` Discord, використовують цей токен для виклику; параметри повторних спроб і політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ідентифікатором облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал гільдії) для цілей доставки; прості числові ID відхиляються.
- Слаги гільдій пишуться малими літерами із заміною пробілів на `-`; ключі каналів використовують назву зі слагом (без `#`). Надавайте перевагу ID гільдій.
- Повідомлення, створені ботами, за замовчуванням ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (крім @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний вихідний текст `@handle` з ID користувачів Discord перед надсиланням, тож відомих учасників команди можна згадувати детерміновано, навіть коли тимчасовий кеш каталогу порожній. Перевизначення для окремого облікового запису розміщені в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (за замовчуванням 17) розбиває високі повідомлення, навіть якщо вони менші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до тредів:
  - `enabled`: перевизначення Discord для функцій сесії, прив’язаних до тредів (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного скасування фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSubagentSessions`: перемикач явного ввімкнення для автоматичного створення/прив’язки треду через `sessions_spawn({ thread: true })`
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують сталі прив’язки ACP для каналів і тредів (використовуйте ID каналу/треду в `match.peer.id`). Семантика полів спільна в [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення автоприєднання + LLM + TTS. Текстові конфігурації Discord за замовчуванням залишають голос вимкненим; задайте `channels.discord.voice.enabled=true`, щоб увімкнути.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, що використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE `@discordjs/voice` (`true` і `24` за замовчуванням).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоприєднання (`30000` за замовчуванням).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки часу від’єднана голосова сесія може входити в сигналізацію повторного підключення, перш ніж OpenClaw її знищить (`15000` за замовчуванням).
- OpenClaw додатково намагається відновити приймання голосу, виходячи з голосової сесії та повторно приєднуючись до неї після повторюваних помилок дешифрування.
- `channels.discord.streaming` є канонічним ключем режиму потоку. Застарілі значення `streamMode` і булеві значення `streaming` автоматично мігруються.
- `channels.discord.autoPresence` зіставляє доступність runtime зі статусом присутності бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваними іменем/тегом (режим сумісності для аварійного обходу).
- `channels.discord.execApprovals`: доставка схвалень exec у нативному форматі Discord і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати запити exec. Якщо пропущено, використовується резервне значення `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або регулярний вираз).
  - `target`: куди надсилати запити на схвалення. `"dm"` (за замовчуванням) надсилає в DM схвалювачів, `"channel"` надсилає до початкового каналу, `"both"` надсилає в обидва місця. Коли target включає `"channel"`, кнопками можуть користуватися лише визначені схвалювачі.
  - `cleanupAfterResolve`: коли `true`, видаляє DM зі схваленнями після схвалення, відмови або тайм-ауту.

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

- JSON сервісного облікового запису: вбудований (`serviceAccount`) або на основі файлу (`serviceAccountFile`).
- SecretRef сервісного облікового запису також підтримується (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним email principal (режим сумісності для аварійного обходу).

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

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного env облікового запису за замовчуванням).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (у корені або для окремого облікового запису).
- `socketMode` передає налаштування транспорту Socket Mode SDK Slack до публічного API приймача Bolt. Використовуйте це лише під час розслідування тайм-аутів ping/pong або поведінки застарілого websocket.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають прості текстові
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack надають поля джерела/статусу для окремих облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в HTTP mode —
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/runtime не зміг
  визначити значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ідентифікатором облікового запису.
- `channels.slack.streaming.mode` є канонічним ключем режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним потоковим транспортом Slack. Застарілі значення `streamMode`, булеві значення `streaming` і значення `nativeStreaming` автоматично мігруються.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція тредових сесій:** `thread.historyScope` є окремим для кожного треду (за замовчуванням) або спільним для каналу. `thread.inheritParent` копіює транскрипт батьківського каналу в нові треди.

- Нативний стримінг Slack разом зі статусом треду в стилі асистента Slack "is typing..." потребують цілі треду для відповіді. DM верхнього рівня за замовчуванням залишаються поза тредом, тому вони використовують `typingReaction` або звичайну доставку замість попереднього перегляду в стилі треду.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім прибирає її після завершення. Використовуйте shortcode емодзі Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: доставка схвалень exec у нативному форматі Slack і авторизація схвалювачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій | За замовчуванням | Примітки                  |
| ------------ | ------- | ---------------------- |
| reactions    | увімкнено | Реагувати + перелічувати реакції |
| messages     | увімкнено | Читати/надсилати/редагувати/видаляти  |
| pins         | увімкнено | Закріпити/відкріпити/перелічити         |
| memberInfo   | увімкнено | Інформація про учасника            |
| emojiList    | увімкнено | Список користувацьких емодзі      |

### Mattermost

Mattermost постачається як вбудований Plugin у поточних релізах OpenClaw. Старіші або
кастомні збірки можуть установити поточний npm-пакет за допомогою
`openclaw plugins install @openclaw/mattermost`; якщо npm повідомляє, що
пакет, яким володіє OpenClaw, застарів, використовуйте вбудований Plugin або локальний checkout
до публікації новішого npm-пакета.

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

- `commands.callbackPath` має бути шляхом (наприклад, `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на endpoint OpenClaw gateway і бути доступним із сервера Mattermost.
- Нативні slash callbacks автентифікуються токенами для кожної команди, які повертає
  Mattermost під час реєстрації slash command. Якщо реєстрація не вдається або
  жодні команди не активовано, OpenClaw відхиляє callbacks з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх callback-хостів Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив callback host/domain.
  Використовуйте значення host/domain, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення mention-gating для окремого каналу (`"*"` для типового значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим account id.

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
- `channels.signal.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим account id.

### BlueBubbles

BlueBubbles — рекомендований шлях для iMessage (на базі Plugin, налаштовується в `channels.bluebubbles`).

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

- Основні key paths, описані тут: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Необов’язковий `channels.bluebubbles.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим account id.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних ACP sessions. Використовуйте BlueBubbles handle або target string (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).
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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим account id.

- Потрібен Full Disk Access до Messages DB.
- Надавайте перевагу target `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб перелічити чати.
- `cliPath` може вказувати на SSH wrapper; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (типово: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку host key, тому переконайтеся, що ключ relay host уже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані iMessage.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних ACP sessions. Використовуйте нормалізований handle або явний chat target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [ACP Agents](/uk/tools/acp-agents#channel-specific-settings).

<Accordion title="Приклад SSH wrapper для iMessage">

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

- Автентифікація токеном використовує `accessToken`; автентифікація паролем використовує `userId` + `password`.
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначити його за допомогою `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeservers. `proxy` і ця згода на мережу є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у налаштуваннях із кількома обліковими записами.
- `channels.matrix.autoJoin` типово має значення `off`, тому запрошені кімнати та нові запрошення у стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка exec approvals і авторизація затверджувачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі exec approvals активуються, коли затверджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: Matrix user IDs (наприклад, `@owner:example.org`), яким дозволено затверджувати exec requests.
  - `agentFilter`: необов’язковий allowlist agent ID. Опустіть, щоб пересилати approvals для всіх agents.
  - `sessionFilter`: необов’язкові session key patterns (підрядок або regex).
  - `target`: куди надсилати approval prompts. `"dm"` (типово), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як Matrix DMs групуються в sessions: `per-user` (типово) спільно використовується за маршрутизованим peer, а `per-room` ізолює кожну DM room.
- Matrix status probes і live directory lookups використовують ту саму proxy policy, що й runtime traffic.
- Повну конфігурацію Matrix, правила targeting і приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

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

- Основні key paths, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (credentials, Webhook, DM/group policy, перевизначення для окремої team/channel) задокументовано в [Microsoft Teams](/uk/channels/msteams).

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

- Основні key paths, описані тут: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим account id.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlists/mention gating) задокументовано в [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

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

- `default` використовується, коли `accountId` пропущено (CLI + routing).
- Env tokens застосовуються лише до **типового** облікового запису.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого agent.
- Якщо ви додаєте нетиповий обліковий запис через `openclaw channels add` (або onboarding каналу), поки все ще використовуєте однооблікову конфігурацію каналу верхнього рівня, OpenClaw спочатку переносить account-scoped top-level single-account values до channel account map, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявний відповідний named/default target.
- Наявні channel-only bindings (без `accountId`) і далі відповідають типовому обліковому запису; account-scoped bindings залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи account-scoped top-level single-account values до promoted account, вибраного для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявний відповідний named/default target.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на власних сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Дивіться повний індекс каналів: [Канали](/uk/channels).

### Mention gating у групових чатах

Групові повідомлення типово **вимагають mention** (metadata mention або безпечні regex patterns). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Visible replies керуються окремо. Для group/channel rooms типове значення `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw усе ще обробляє turn, але звичайні final replies залишаються приватними, а видимий output у кімнаті потребує `message(action=send)`. Задайте `"automatic"` лише тоді, коли потрібна legacy behavior, за якої звичайні відповіді публікуються назад у room. Щоб застосувати таку саму поведінку tool-only visible-reply також до direct chats, задайте `messages.visibleReplies: "message_tool"`; Codex harness також використовує цю tool-only behavior як своє незадане типове значення для direct-chat.

Якщо message tool недоступний за активної tool policy, OpenClaw повертається до automatic visible replies замість того, щоб мовчки пригнічувати відповідь. `openclaw doctor` попереджає про цю невідповідність.

Gateway hot-reloads конфігурацію `messages` після збереження файлу. Перезапускайте лише тоді, коли file watching або config reload вимкнено в розгортанні.

**Типи mentions:**

- **Metadata mentions**: нативні platform @-mentions. Ігноруються в режимі WhatsApp self-chat.
- **Text patterns**: безпечні regex patterns у `agents.list[].groupChat.mentionPatterns`. Некоректні patterns і небезпечне nested repetition ігноруються.
- Mention gating застосовується лише тоді, коли виявлення можливе (native mentions або принаймні один pattern).

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

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Установіть `0`, щоб вимкнути.

`messages.visibleReplies` — це глобальне значення за замовчуванням для вихідних ходів; `messages.groupChat.visibleReplies` перевизначає його для вихідних ходів групи/каналу. Коли `messages.visibleReplies` не задано, harness може надати власне значення за замовчуванням для прямих/вихідних чатів; harness Codex за замовчуванням використовує `message_tool`. Списки дозволених каналів і перевірка згадок усе одно визначають, чи буде хід оброблено.

#### Обмеження історії приватних повідомлень

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

Порядок визначення: перевизначення для окремого приватного чату → значення провайдера за замовчуванням → без обмеження (зберігається все).

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

<Accordion title="Command details">

- Цей блок налаштовує поверхні команд. Поточний вбудований і bundled каталог команд див. у [Slash Commands](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовано на сторінках відповідних каналів/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (bool або `"auto"`). `false` очищає раніше зареєстровані команди.
- Перевизначайте реєстрацію нативних Skills для окремого каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові пункти меню Telegram-бота.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled` і відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; `/config show` лише для читання залишається доступним для звичайних клієнтів-операторів із правами запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованого OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, встановлення та елементів керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` обмежує зміни конфігурації для окремого каналу (за замовчуванням: true).
- Для багатооблікових каналів `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, націлені на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску gateway. За замовчуванням: `true`.
- `ownerAllowFrom` — це явний список дозволених власників для команд/інструментів лише для власника. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному промпті. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Якщо його встановлено, це **єдине** джерело авторизації (списки дозволених каналів/сполучення та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.
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
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
