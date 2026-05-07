---
read_when:
    - Налаштування Plugin для каналу (автентифікація, керування доступом, кілька облікових записів)
    - Усунення несправностей ключів конфігурації для кожного каналу
    - Аудит політики приватних повідомлень, групової політики або обмеження за згадками
summary: 'Конфігурація каналів: контроль доступу, сполучення, ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-05-07T13:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10ff37f804fe3a2443372c4b195c00a4ee427ebd4c602bfb13e5040bddfaab93
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації для окремих каналів у `channels.*`. Охоплює доступ до DM і груп,
налаштування кількох облікових записів, фільтрацію за згадкою та ключі окремих каналів для Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage та інших вбудованих канальних plugin.

Для агентів, інструментів, середовища виконання gateway та інших ключів верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і групові політики:

| Політика DM         | Поведінка                                                        |
| ------------------- | ---------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або в парному сховищі дозволених) |
| `open`              | Дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)             |
| `disabled`          | Ігнорувати всі вхідні DM                                         |

| Групова політика      | Поведінка                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (типово)  | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                | Обійти списки дозволених груп (фільтрація за згадкою все одно застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` постачальника не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення DM обмежені **3 на канал**.
Якщо блок постачальника повністю відсутній (`channels.<provider>` відсутній), групова політика середовища виконання повертається до `allowlist` (закриття в разі помилки) із попередженням під час запуску.
</Note>

### Перевизначення моделі каналу

Використовуйте `channels.modelByChannel`, щоб закріпити певні ID каналів за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Мапінг каналів застосовується, коли сеанс ще не має перевизначення моделі (наприклад, заданого через `/model`).

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

Використовуйте `channels.defaults` для спільної групової політики та поведінки Heartbeat між постачальниками:

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

- `channels.defaults.groupPolicy`: резервна групова політика, коли `groupPolicy` на рівні постачальника не встановлено.
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь контекст цитат/гілок/історії), `allowlist` (включати лише контекст від дозволених відправників), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для окремого каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні стани каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати погіршені/помилкові стани у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відтворювати компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал gateway (Baileys Web). Він запускається автоматично, коли існує зв’язаний сеанс.

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він існує; інакше перший налаштований ID облікового запису (після сортування).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, коли він відповідає налаштованому ID облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису переноситься `openclaw doctor` у `whatsapp/default`.
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
- `apiRoot` є лише коренем Telegram Bot API. Використовуйте `https://api.telegram.org` або власний розгорнутий/проксі-корінь, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий кінцевий суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає типовий вибір облікового запису, коли він відповідає налаштованому ID облікового запису.
- У налаштуваннях із кількома обліковими записами (2+ ID облікових записів) задайте явне типове значення (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли воно відсутнє або недійсне.
- `configWrites: false` блокує ініційовані Telegram записи конфігурації (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують сталі прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [ACP Agents](/uk/tools/acp-agents#persistent-channel-bindings).
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
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; налаштування повторів/політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з ідентифікатором налаштованого облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал гільдії) для цілей доставки; прості числові ID відхиляються.
- Slug гільдій записуються нижнім регістром із заміною пробілів на `-`; ключі каналів використовують slug-імена (без `#`). Надавайте перевагу ID гільдій.
- Повідомлення, створені ботами, типово ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний вихідний текст `@handle` з ID користувачів Discord перед надсиланням, щоб відомих учасників команди можна було згадувати детерміновано навіть тоді, коли тимчасовий кеш каталогу порожній. Перевизначення для окремих облікових записів розміщуються в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (типово 17) розбиває високі повідомлення навіть тоді, коли вони коротші за 2000 символів.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до thread:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSessions`: перемикач для `sessions_spawn({ thread: true })` і автоматичного створення/прив’язки thread під час ACP thread-spawn (типово: `true`)
  - `defaultSpawnContext`: нативний контекст субагента для запусків, прив’язаних до thread (типово `"fork"`)
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і thread (використовуйте ID каналу/thread у `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + LLM + TTS. Текстові конфігурації Discord типово залишають голос вимкненим; задайте `channels.discord.voice.enabled=true`, щоб увімкнути його.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, яка використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються в параметри DAVE `@discordjs/voice` (`true` і `24` типово).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб auto-join (типово `30000`).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки часу від’єднана голосова сесія може входити в сигналізацію повторного підключення, перш ніж OpenClaw її знищить (типово `15000`).
- Відтворення голосу Discord не переривається подією початку мовлення іншого користувача. Щоб уникнути петель зворотного зв’язку, OpenClaw ігнорує нове захоплення голосу, поки відтворюється TTS.
- OpenClaw додатково намагається відновити приймання голосу, виходячи з голосової сесії та повторно входячи в неї після повторних помилок дешифрування.
- `channels.discord.streaming` є канонічним ключем режиму потоку. Discord типово використовує `streaming.mode: "progress"`, щоб прогрес інструментів/роботи з’являвся в одному редагованому повідомленні попереднього перегляду; задайте `streaming.mode: "off"`, щоб вимкнути це. Застарілі значення `streamMode` і булеві значення `streaming` залишаються runtime-псевдонімами; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `channels.discord.autoPresence` зіставляє доступність runtime зі статусом присутності бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним іменем/тегом (режим сумісності break-glass).
- `channels.discord.execApprovals`: нативна для Discord доставка схвалень exec і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати запити exec. Якщо пропущено, використовується резервний варіант `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити схвалення. `"dm"` (типово) надсилає в DM схвалювачів, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва місця. Коли target містить `"channel"`, кнопки можуть використовувати лише визначені схвалювачі.
  - `cleanupAfterResolve`: коли `true`, видаляє DM зі схваленнями після схвалення, відхилення або таймауту.

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

- JSON сервісного облікового запису: вбудований (`serviceAccount`) або з файла (`serviceAccountFile`).
- SecretRef сервісного облікового запису також підтримується (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним email-principal (режим сумісності break-glass).

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

- **Socket mode** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` як резервні змінні середовища для облікового запису за замовчуванням).
- **HTTP mode** потребує `botToken` плюс `signingSecret` (на кореневому рівні або для окремого облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API приймача Bolt. Використовуйте це лише під час дослідження таймаутів ping/pong або поведінки застарілого websocket.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack відкривають поля джерела/статусу для кожного облікового запису, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в HTTP mode —
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/runtime не зміг
  отримати значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з ідентифікатором налаштованого облікового запису.
- `channels.slack.streaming.mode` є канонічним ключем режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним потоковим транспортом Slack. Застарілі значення `streamMode`, булеві значення `streaming` і `nativeStreaming` залишаються runtime-псевдонімами; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сесії thread:** `thread.historyScope` є окремим для кожного thread (типово) або спільним для каналу. `thread.inheritParent` копіює transcript батьківського каналу в нові thread.

- Нативний streaming Slack разом зі thread-статусом у стилі асистента Slack "is typing..." потребують цілі reply thread. DM верхнього рівня типово залишаються поза thread, тому вони все ще можуть стримити через чернеткові попередні перегляди Slack із публікацією та редагуванням замість показу нативного потоку/попереднього перегляду статусу в стилі thread.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, поки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка схвалень exec і авторизація схвалювачів. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`).

| Група дій | Типово | Нотатки                  |
| ------------ | ------- | ---------------------- |
| reactions    | увімкнено | Реагувати + список реакцій |
| messages     | увімкнено | Читати/надсилати/редагувати/видаляти  |
| pins         | увімкнено | Закріпити/відкріпити/перелічити         |
| memberInfo   | увімкнено | Інформація про учасника            |
| emojiList    | увімкнено | Список власних emoji      |

### Mattermost

Mattermost постачається як bundled Plugin у поточних релізах OpenClaw. Старіші або
кастомні збірки можуть установити поточний npm-пакет за допомогою
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

Режими чату: `oncall` (відповідати на @-згадку, за замовчуванням), `onmessage` (на кожне повідомлення), `onchar` (повідомлення, що починаються з префікса-тригера).

Коли нативні команди Mattermost увімкнені:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на кінцеву точку Gateway OpenClaw і бути доступною із сервера Mattermost.
- Нативні slash-зворотні виклики автентифікуються токенами окремих команд, які повертає Mattermost під час реєстрації slash-команди. Якщо реєстрація завершується невдало або жодні команди не активовано, OpenClaw відхиляє зворотні виклики з повідомленням `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів зворотних викликів Mattermost може вимагати, щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен зворотного виклику.
  Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити ініційовані Mattermost записи конфігурації.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення шлюзу згадок для окремого каналу (`"*"` для значення за замовчуванням).
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

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (із `reactionAllowlist`).

- `channels.signal.account`: прив’язати запуск каналу до конкретної ідентичності облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити ініційовані Signal записи конфігурації.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли збігається з ідентифікатором налаштованого облікового запису.

### BlueBubbles

BlueBubbles — це застарілий міст iMessage (на основі Plugin, налаштований у `channels.bluebubbles`). Наявні налаштування й надалі підтримуються, але для нових розгортань iMessage в OpenClaw слід віддавати перевагу `channels.imessage`, коли `imsg` може працювати на хості Messages.

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
- Записи верхнього рівня `bindings[]` із `type: "acp"` можуть прив’язувати розмови BlueBubbles до постійних сеансів ACP. Використовуйте handle BlueBubbles або цільовий рядок (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- Повна конфігурація каналу BlueBubbles і обґрунтування застарілості задокументовані в [BlueBubbles](/uk/channels/bluebubbles).

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Демон або порт не потрібні. Це рекомендований шлях для нових налаштувань iMessage в OpenClaw, коли хост може надати дозволи на базу даних Messages і Automation.

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

- Потребує Full Disk Access до бази даних Messages.
- Віддавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (за замовчуванням: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тож переконайтеся, що ключ relay-хоста вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити ініційовані iMessage записи конфігурації.
- Записи верхнього рівня `bindings[]` із `type: "acp"` можуть прив’язувати розмови iMessage до постійних сеансів ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

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
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначати його за допомогою `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і це явне ввімкнення мережі є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у налаштуваннях із кількома обліковими записами.
- `channels.matrix.autoJoin` за замовчуванням має значення `off`, тому запрошені кімнати й нові запрошення у стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативна для Matrix доставка затверджень exec і авторизація затверджувачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі затвердження exec активуються, коли затверджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Matrix (наприклад `@owner:example.org`), яким дозволено затверджувати запити exec.
  - `agentFilter`: необов’язковий allowlist ідентифікаторів агентів. Опустіть, щоб пересилати затвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансів (підрядок або regex).
  - `target`: куди надсилати запити на затвердження. `"dm"` (за замовчуванням), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для окремого облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM у Matrix групуються в сеанси: `per-user` (за замовчуванням) спільно використовує сеанс за маршрутизованим peer, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки статусу Matrix і живі пошуки в каталозі використовують ту саму політику проксі, що й runtime-трафік.
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

- Основні шляхи ключів, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повна конфігурація Teams (облікові дані, Webhook, політика DM/груп, перевизначення для окремих команд/каналів) задокументована в [Microsoft Teams](/uk/channels/msteams).

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
- Повна конфігурація каналу IRC (host/port/TLS/channels/allowlists/шлюз згадок) задокументована в [IRC](/uk/channels/irc).

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

- `default` використовується, коли `accountId` опущено (CLI + маршрутизація).
- Env-токени застосовуються лише до облікового запису **default**.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте обліковий запис не за замовчуванням через `openclaw channels add` (або onboarding каналу), поки все ще використовуєте конфігурацію каналу верхнього рівня з одним обліковим записом, OpenClaw спершу переносить значення верхнього рівня, що стосуються одного облікового запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану ціль або ціль за замовчуванням.
- Наявні прив’язки лише до каналу (без `accountId`) і далі збігаються з обліковим записом за замовчуванням; прив’язки з прив’язкою до облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня, що стосуються одного облікового запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану ціль або ціль за замовчуванням.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Дивіться повний індекс каналів: [Канали](/uk/channels).

### Шлюз згадок у груповому чаті

Для групових повідомлень за замовчуванням **потрібна згадка** (згадка в метаданих або безпечні regex-шаблони). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Видимі відповіді керуються окремо. Для кімнат груп/каналів типовим є `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw усе ще обробляє хід, але звичайні фінальні відповіді залишаються приватними, а видимий вивід у кімнату потребує `message(action=send)`. Установлюйте `"automatic"` лише тоді, коли потрібна застаріла поведінка, за якої звичайні відповіді публікуються назад у кімнату. Щоб застосувати таку саму поведінку видимих відповідей лише через інструмент і до прямих чатів, задайте `messages.visibleReplies: "message_tool"`; середовище Codex також використовує цю поведінку лише через інструмент як типовий варіант для прямих чатів, коли значення не задано.

Видимі відповіді лише через інструмент потребують моделі/середовища виконання, яке надійно викликає інструменти. Якщо
журнал сесії показує текст асистента з `didSendViaMessagingTool: false`, це означає, що
модель створила приватну фінальну відповідь замість виклику інструмента повідомлень.
Перемкніться на сильнішу модель для виклику інструментів для цього каналу або задайте
`messages.groupChat.visibleReplies: "automatic"`, щоб відновити застарілі видимі фінальні
відповіді.

Якщо інструмент повідомлень недоступний за активної політики інструментів, OpenClaw повертається до автоматичних видимих відповідей замість мовчазного пригнічення відповіді. `openclaw doctor` попереджає про цю невідповідність.

Gateway гаряче перезавантажує конфігурацію `messages` після збереження файлу. Перезапускайте лише тоді, коли в розгортанні вимкнено спостереження за файлами або перезавантаження конфігурації.

**Типи згадок:**

- **Метадані згадок**: нативні @-згадки платформи. Ігноруються в режимі самочату WhatsApp.
- **Текстові шаблони**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечні вкладені повторення ігноруються.
- Фільтрація за згадками застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне типове значення. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Задайте `0`, щоб вимкнути.

`messages.visibleReplies` є глобальним типовим значенням для ходів від джерела; `messages.groupChat.visibleReplies` перевизначає його для ходів від джерела в групах/каналах. Коли `messages.visibleReplies` не задано, середовище може надати власне типове значення для прямих чатів/джерел; середовище Codex за замовчуванням використовує `message_tool`. Списки дозволених каналів і фільтрація за згадками все одно визначають, чи буде хід оброблено.

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

- Цей блок налаштовує поверхні команд. Поточний каталог вбудованих і комплектних команд див. у [Slash-команди](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, сполучення пристроїв `/pair`, пам’ять `/dreaming`, керування телефоном `/phone` і Talk `/voice`, задокументовані на сторінках відповідних каналів/Plugin, а також у [Slash-команди](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (bool або `"auto"`). Для Discord `false` пропускає реєстрацію нативних команд і очищення під час запуску.
- Перевизначайте реєстрацію нативних команд Skills для окремого каналу через `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled`, а відправник має бути в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; доступний лише для читання `/config show` залишається доступним для звичайних клієнтів-операторів із областю запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера під керуванням OpenClaw у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, встановлення та елементів керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` фільтрує зміни конфігурації для окремого каналу (типово: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також фільтрує записи, спрямовані на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. Типово: `true`.
- `ownerAllowFrom` — явний список дозволених власників для команд/інструментів лише для власника. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному промпті. Задайте `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Коли його задано, це **єдине** джерело авторизації (списки дозволених каналів/сполучення та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не задано.
- Мапа документації команд:
  - вбудований і комплектний каталог: [Slash-команди](/uk/tools/slash-commands)
  - поверхні команд для окремих каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди сполучення: [Сполучення](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - Dreaming пам’яті: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
