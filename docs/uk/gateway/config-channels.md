---
read_when:
    - Налаштування Plugin каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення неполадок із ключами конфігурації для кожного каналу
    - Аудит політики DM, групової політики або контролю за згадками
summary: 'Конфігурація каналів: керування доступом, сполучення й ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-05-11T20:35:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації для кожного каналу в `channels.*`. Охоплює доступ до DM і груп,
налаштування з кількома обліковими записами, фільтрацію за згадками та ключі для кожного каналу для Slack, Discord,
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
| `allowlist`         | Лише відправники в `allowFrom` (або в сховищі дозволених після сполучення) |
| `open`              | Дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                       |

| Групова політика      | Поведінка                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (default) | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                | Обходити списки дозволених груп (фільтрація за згадками все одно застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                |

<Note>
`channels.defaults.groupPolicy` задає стандартне значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення DM обмежені **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` немає), групова політика під час виконання повертається до `allowlist` (закриття в разі збою) з попередженням під час запуску.
</Note>

### Перевизначення моделі каналу

Використовуйте `channels.modelByChannel`, щоб прив’язати конкретні ідентифікатори каналів до моделі. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналу застосовується, коли сесія ще не має перевизначення моделі (наприклад, заданого через `/model`).

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

### Стандартні параметри каналів і Heartbeat

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
- `channels.defaults.contextVisibility`: стандартний режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь контекст цитат/тредів/історії), `allowlist` (включати лише контекст від відправників зі списку дозволених), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні статуси каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати статуси деградації/помилки у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує зв’язана сесія.

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

<Accordion title="WhatsApp з кількома обліковими записами">

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше перший налаштований ідентифікатор облікового запису (після сортування).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір стандартного облікового запису, коли він збігається з налаштованим ідентифікатором облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису мігрується командою `openclaw doctor` до `whatsapp/default`.
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; символічні посилання відхиляються), з `TELEGRAM_BOT_TOKEN` як резервним варіантом для стандартного облікового запису.
- `apiRoot` — це лише корінь Telegram Bot API. Використовуйте `https://api.telegram.org` або свій самостійно розміщений/проксі-корінь, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий кінцевий суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір стандартного облікового запису, коли він збігається з налаштованим ідентифікатором облікового запису.
- У налаштуваннях із кількома обліковими записами (2+ ідентифікатори облікових записів) задайте явне стандартне значення (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли воно відсутнє або недійсне.
- `configWrites: false` блокує ініційовані Telegram записи конфігурації (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- Попередні перегляди потоку Telegram використовують `sendMessage` + `editMessageText` (працює в прямих і групових чатах).
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

- Токен: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як резервним варіантом для облікового запису за замовчуванням.
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; налаштування повторних спроб/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку середовища виконання.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ідентифікатором облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал гільдії) для цілей доставки; прості числові ID відхиляються.
- Слаги гільдій мають нижній регістр із пробілами, заміненими на `-`; ключі каналів використовують слаговану назву (без `#`). Надавайте перевагу ID гільдій.
- Повідомлення, створені ботами, за замовчуванням ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний вихідний текст `@handle` з ID користувачів Discord перед надсиланням, щоб відомих учасників команди можна було згадувати детерміновано, навіть коли тимчасовий кеш каталогу порожній. Перевизначення для окремих облікових записів розміщені в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (за замовчуванням 17) розбиває високі повідомлення, навіть якщо вони мають менше ніж 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до тредів:
  - `enabled`: перевизначення Discord для функцій сеансів, прив’язаних до тредів (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного скасування фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSessions`: перемикач для `sessions_spawn({ thread: true })` і автоматичного створення/прив’язування тредів ACP thread-spawn (за замовчуванням: `true`)
  - `defaultSpawnContext`: нативний контекст підагентів для запусків, прив’язаних до тредів (за замовчуванням `"fork"`)
- Елементи верхнього рівня `bindings[]` з `type: "acp"` налаштовують сталі прив’язки ACP для каналів і тредів (використовуйте ID каналу/треду в `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів Discord components v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + LLM + TTS. Текстові конфігурації Discord за замовчуванням залишають голос вимкненим; задайте `channels.discord.voice.enabled=true`, щоб увімкнути.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, яка використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE `@discordjs/voice` (за замовчуванням `true` і `24`).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб auto-join (за замовчуванням `30000`).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки від’єднаний голосовий сеанс може переходити в сигналізацію повторного підключення, перш ніж OpenClaw його знищить (за замовчуванням `15000`).
- Відтворення голосу Discord не переривається подією початку мовлення іншого користувача. Щоб уникнути петель зворотного зв’язку, OpenClaw ігнорує нове захоплення голосу під час відтворення TTS.
- OpenClaw також намагається відновити приймання голосу, виходячи з голосового сеансу та повторно приєднуючись після повторюваних помилок дешифрування.
- `channels.discord.streaming` є канонічним ключем режиму потоку. Discord за замовчуванням використовує `streaming.mode: "progress"`, щоб прогрес інструментів/роботи відображався в одному редагованому повідомленні попереднього перегляду; задайте `streaming.mode: "off"`, щоб вимкнути. Застарілі значення `streamMode` і булеві значення `streaming` лишаються псевдонімами середовища виконання; виконайте `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `channels.discord.autoPresence` зіставляє доступність середовища виконання зі статусом присутності бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення змінних імен/тегів (режим сумісності break-glass).
- `channels.discord.execApprovals`: нативна для Discord доставка схвалень exec і авторизація затверджувачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі схвалення exec активуються, коли затверджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати запити exec. Якщо пропущено, використовується резервний варіант `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансів (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (за замовчуванням) надсилає в DM затверджувачів, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва. Коли ціль містить `"channel"`, кнопки можуть використовувати лише визначені затверджувачі.
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

- JSON сервісного облікового запису: inline (`serviceAccount`) або на основі файлу (`serviceAccountFile`).
- SecretRef для сервісного облікового запису також підтримується (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення змінних email-принципалів (режим сумісності break-glass).

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
      unfurlLinks: false,
      unfurlMedia: false,
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

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як резервні змінні середовища для облікового запису за замовчуванням).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (у корені або для окремого облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API Bolt receiver. Використовуйте це лише під час дослідження тайм-аутів ping/pong або застарілої поведінки websocket.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають plaintext
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack надають поля джерела/статусу для окремих облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в HTTP mode —
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточна команда/шлях середовища виконання не змогли
  отримати значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з налаштованим ідентифікатором облікового запису.
- `channels.slack.streaming.mode` є канонічним ключем режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним потоковим транспортом Slack. Застарілі значення `streamMode`, булеві значення `streaming` і `nativeStreaming` лишаються псевдонімами середовища виконання; виконайте `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `unfurlLinks` і `unfurlMedia` передають булеві параметри розгортання посилань і медіа Slack `chat.postMessage` для відповідей бота. Пропустіть їх, щоб зберегти поведінку Slack за замовчуванням; задайте їх у `channels.slack.accounts.<accountId>`, щоб перевизначити верхній рівень за замовчуванням для одного облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сеансів тредів:** `thread.historyScope` є окремою для кожного треду (за замовчуванням) або спільною для каналу. `thread.inheritParent` копіює транскрипт батьківського каналу в нові треди.

- Нативний стримінг Slack плюс статус треду в стилі Slack assistant “is typing...” потребують цілі треду для відповіді. DM верхнього рівня за замовчуванням лишаються поза тредами, тому вони все ще можуть транслюватися через чернеткові попередні перегляди Slack із публікацією та редагуванням, замість показу нативного потокового/статусного попереднього перегляду в стилі треду.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім прибирає її після завершення. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка схвалень exec і авторизація затверджувачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій | За замовчуванням | Примітки                  |
| ------------ | ------- | ---------------------- |
| reactions    | увімкнено | Реагувати + перелічувати реакції |
| messages     | увімкнено | Читати/надсилати/редагувати/видаляти  |
| pins         | увімкнено | Закріпити/відкріпити/перелічити         |
| memberInfo   | увімкнено | Інформація про учасника            |
| emojiList    | увімкнено | Список власних emoji      |

### Mattermost

Mattermost постачається як bundled Plugin у поточних релізах OpenClaw. Старіші або
кастомні збірки можуть установити поточний npm-пакет за допомогою
`openclaw plugins install @openclaw/mattermost`. Перевірте
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
щодо поточних dist-tags, перш ніж закріплювати версію.

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
- Нативні slash-зворотні виклики автентифікуються токенами для кожної команди, які повертає Mattermost під час реєстрації slash-команди. Якщо реєстрація не вдається або жодні команди не активовано, OpenClaw відхиляє зворотні виклики з `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів зворотних викликів Mattermost може вимагати, щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен зворотного виклику. Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення шлюзу згадок для окремого каналу (`"*"` для значення за замовчуванням).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він відповідає налаштованому ідентифікатору облікового запису.

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
- `channels.signal.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він відповідає налаштованому ідентифікатору облікового запису.

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Демон або порт не потрібні. Це рекомендований шлях для нових налаштувань OpenClaw iMessage, коли хост може надати дозволи до бази даних Messages і Automation.

Підтримку BlueBubbles вилучено. `channels.bluebubbles` не є підтримуваною поверхнею конфігурації середовища виконання в поточному OpenClaw. Перенесіть старі конфігурації до `channels.imessage`; скористайтеся [Вилученням BlueBubbles і шляхом imsg iMessage](/uk/announcements/bluebubbles-imessage) для короткої версії та [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) для повної таблиці відповідностей.

Якщо Gateway не запущено на Mac, де виконано вхід у Messages, залиште `channels.imessage.enabled=true` і встановіть `channels.imessage.cliPath` на SSH-обгортку, яка запускає `imsg "$@"` на цьому Mac. Локальний шлях `imsg` за замовчуванням працює лише на macOS.

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він відповідає налаштованому ідентифікатору облікового запису.

- Потребує Full Disk Access до бази даних Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб перелічити чати.
- `cliPath` може вказувати на SSH-обгортку; установіть `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (за замовчуванням: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тож переконайтеся, що ключ хоста ретранслятора вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані iMessage.
- `channels.imessage.actions.*`: увімкнути дії приватного API, які також обмежуються через `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` вимкнено за замовчуванням; установіть його в `true`, перш ніж очікувати вхідні медіа в ходах агента.
- `channels.imessage.catchup.enabled`: увімкнути повторне відтворення вхідних повідомлень, які надійшли, поки Gateway був недоступний.
- `channels.imessage.groups`: реєстр груп і налаштування для кожної групи. З `groupPolicy: "allowlist"` налаштуйте або явні ключі `chat_id`, або запис із символом узагальнення `"*"`, щоб групові повідомлення могли пройти шлюз реєстру.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сеансів ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Приклад SSH-обгортки iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix підтримується Plugin і налаштовується в `channels.matrix`.

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і це мережеве явне ввімкнення є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у налаштуваннях із кількома обліковими записами.
- `channels.matrix.autoJoin` за замовчуванням має значення `off`, тож запрошені кімнати й нові запрошення у стилі DM ігноруються, доки ви не встановите `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: доставка схвалень exec засобами Matrix і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Matrix (наприклад `@owner:example.org`), яким дозволено схвалювати запити exec.
  - `agentFilter`: необов’язковий allowlist ідентифікаторів агентів. Опустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансів (підрядок або regex).
  - `target`: куди надсилати запити схвалення. `"dm"` (за замовчуванням), `"channel"` (кімната походження) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сеанси: `per-user` (за замовчуванням) ділиться за маршрутизованим peer, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки статусу Matrix і живі пошуки в каталозі використовують ту саму політику проксі, що й трафік середовища виконання.
- Повну конфігурацію Matrix, правила таргетування та приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams підтримується Plugin і налаштовується в `channels.msteams`.

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
- Повну конфігурацію Teams (облікові дані, webhook, політика DM/груп, перевизначення для команди/каналу) задокументовано в [Microsoft Teams](/uk/channels/msteams).

### IRC

IRC підтримується Plugin і налаштовується в `channels.irc`.

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
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він відповідає налаштованому ідентифікатору облікового запису.
- Повну конфігурацію каналу IRC (host/port/TLS/channels/allowlists/mention gating) задокументовано в [IRC](/uk/channels/irc).

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

- `default` використовується, коли `accountId` опущено (CLI + маршрутизація).
- Env-токени застосовуються лише до **облікового запису за замовчуванням**.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб спрямовувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте обліковий запис не за замовчуванням через `openclaw channels add` (або під час онбордингу каналу), поки все ще маєте конфігурацію каналу верхнього рівня з одним обліковим записом, OpenClaw спершу просуває значення одного облікового запису верхнього рівня, scoped для облікового запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише каналу (без `accountId`) продовжують відповідати обліковому запису за замовчуванням; прив’язки, scoped для облікового запису, залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення одного облікового запису верхнього рівня, scoped для облікового запису, у просунутий обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші Plugin-канали

Багато Plugin-каналів налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Див. повний індекс каналів: [Канали](/uk/channels).

### Шлюз згадок у груповому чаті

Групові повідомлення за замовчуванням **вимагають згадки** (згадка в metadata або безпечні regex-шаблони). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Видимі відповіді керуються окремо. Групові кімнати/кімнати каналів типово використовують `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw усе ще обробляє хід, але звичайні фінальні відповіді залишаються приватними, а видимий вивід у кімнаті потребує `message(action=send)`. Встановлюйте `"automatic"` лише коли потрібна застаріла поведінка, за якої звичайні відповіді публікуються назад у кімнату. Щоб застосувати таку саму поведінку видимих відповідей лише через інструмент і до прямих чатів, встановіть `messages.visibleReplies: "message_tool"`; Codex harness також використовує цю поведінку лише через інструмент як типове значення для прямих чатів, коли воно не задане.

Видимі відповіді лише через інструмент потребують моделі/runtime, що надійно викликає інструменти. Якщо
журнал сесії показує текст асистента з `didSendViaMessagingTool: false`, це означає, що
модель створила приватну фінальну відповідь замість виклику інструмента повідомлень.
Перейдіть на сильнішу модель із викликом інструментів для цього каналу або встановіть
`messages.groupChat.visibleReplies: "automatic"`, щоб відновити застарілі видимі фінальні
відповіді.

Якщо інструмент повідомлень недоступний за активної політики інструментів, OpenClaw повертається до автоматичних видимих відповідей замість тихого приглушення відповіді. `openclaw doctor` попереджає про цю невідповідність.

Gateway гаряче перезавантажує конфігурацію `messages` після збереження файлу. Перезапускайте лише тоді, коли спостереження за файлами або перезавантаження конфігурації вимкнено в розгортанні.

**Типи згадок:**

- **Метадані згадок**: нативні @-згадки платформи. Ігноруються в режимі самочату WhatsApp.
- **Текстові шаблони**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечні вкладені повторення ігноруються.
- Шлюз згадок застосовується лише коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне типове значення. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого акаунта). Встановіть `0`, щоб вимкнути.

`messages.visibleReplies` є глобальним типовим значенням для source-turn; `messages.groupChat.visibleReplies` перевизначає його для group/channel source turns. Коли `messages.visibleReplies` не задано, harness може надати власне типове значення direct/source; Codex harness типово використовує `message_tool`. Allowlist каналів і шлюз згадок усе ще вирішують, чи обробляється хід.

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

Розв’язання: перевизначення для окремого DM → типове значення провайдера → без ліміту (усе зберігається).

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
- Ця сторінка є **довідником конфігураційних ключів**, а не повним каталогом команд. Команди, що належать каналам/плагінам, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, документуються на сторінках відповідних каналів/плагінів, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (bool або `"auto"`). Для Discord значення `false` пропускає реєстрацію нативних команд і очищення під час запуску.
- Перевизначте реєстрацію нативних Skills для окремого каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню Telegram-бота.
- `bash: true` вмикає `! <cmd>` для shell хоста. Потребує `tools.elevated.enabled` і відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читання/запис `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; `/config show` лише для читання залишається доступним звичайним клієнтам operator із write-scope.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованого OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення, встановлення та керування увімкненням/вимкненням плагінів.
- `channels.<provider>.configWrites` обмежує мутації конфігурації для окремого каналу (типово: true).
- Для каналів із кількома акаунтами `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, що націлені на цей акаунт (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. Типово: `true`.
- `ownerAllowFrom` — явний allowlist власника для команд/інструментів лише для власника. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує id власників у системному prompt. Встановіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Коли його встановлено, це **єдине** джерело авторизації (allowlist/спарювання каналів і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики access-group, коли `allowFrom` не встановлено.
- Мапа документації команд:
  - вбудований і bundled каталог: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд для окремих каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди спарювання: [Pairing](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
