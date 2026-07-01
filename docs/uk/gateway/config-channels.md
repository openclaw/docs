---
read_when:
    - Налаштування channel plugin (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення несправностей ключів конфігурації для кожного каналу
    - Аудит політики DM, групової політики або обмеження за згадками
summary: 'Конфігурація каналів: контроль доступу, сполучення, ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-07-01T13:23:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації за каналами в `channels.*`. Охоплює доступ до DM і груп,
налаштування кількох облікових записів, фільтрацію за згадками та ключі за каналами для Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage та інших вбудованих Plugin каналів.

Для агентів, інструментів, середовища виконання Gateway та інших ключів верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його секція конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і політики груп:

| Політика DM          | Поведінка                                                       |
| -------------------- | --------------------------------------------------------------- |
| `pairing` (типово)   | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`          | Лише відправники в `allowFrom` (або у сховищі дозволених сполучень) |
| `open`               | Дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)           |
| `disabled`           | Ігнорувати всі вхідні DM                                        |

| Політика груп          | Поведінка                                             |
| ---------------------- | ----------------------------------------------------- |
| `allowlist` (типово)   | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                 | Обійти списки дозволених груп (фільтрація за згадками все ще застосовується) |
| `disabled`             | Блокувати всі повідомлення груп/кімнат                |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення DM обмежені **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), політика груп середовища виконання повертається до `allowlist` (закриття при збої) з попередженням під час запуску.
</Note>

### Перевизначення моделі каналу

Використовуйте `channels.modelByChannel`, щоб закріпити певні ID каналів або співрозмовників у прямих повідомленнях за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналів застосовується, коли сесія ще не має перевизначення моделі (наприклад, заданого через `/model`).

Для розмов у групах/тредах ключами є специфічні для каналу ID груп, ID тем або назви каналів. Для розмов у прямих повідомленнях (DM) ключами є ідентифікатори співрозмовників, отримані з ідентичності відправника каналу (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` або `SenderId`). Точна форма ключа залежить від каналу:

| Канал    | Форма ключа DM      | Приклад                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | сирий ID користувача | `123456789`                                  |
| Discord  | сирий ID користувача | `987654321`                                  |
| WhatsApp | номер телефону або JID | `15551234567`                              |
| Matrix   | ID користувача Matrix | `@user:matrix.org`                         |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

Ключі, специфічні для DM, збігаються лише в розмовах із прямими повідомленнями; вони не впливають на маршрутизацію груп/тредів.

### Типові значення каналів і Heartbeat

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

- `channels.defaults.groupPolicy`: резервна політика груп, коли `groupPolicy` на рівні провайдера не встановлено.
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь контекст цитат/тредів/історії), `allowlist` (включати лише контекст від дозволених відправників), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення за каналом: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні статуси каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати погіршені/помилкові статуси у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: відтворювати компактний вивід Heartbeat у стилі індикатора.

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

- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для DM і груп WhatsApp. Використовуйте прямий номер E.164 або JID групи WhatsApp у `match.peer.id`. Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він є; інакше перший налаштований ID облікового запису (відсортований).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей вибір резервного типового облікового запису, коли він збігається з налаштованим ID облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису мігрується `openclaw doctor` у `whatsapp/default`.
- Перевизначення за обліковим записом: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
      streaming: "partial", // off | partial | block | progress (default: partial)
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
- `apiRoot` — це лише корінь Telegram Bot API. Використовуйте `https://api.telegram.org` або власний розміщений/proxy-корінь, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий кінцевий суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, коли він збігається з налаштованим ID облікового запису.
- У налаштуваннях із кількома обліковими записами (2+ ID облікових записів) задайте явний типовий (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли він відсутній або недійсний.
- `configWrites: false` блокує записи конфігурації, ініційовані Telegram (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
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

- Токен: `channels.discord.token`, із `DISCORD_BOT_TOKEN` як резервним варіантом для стандартного облікового запису.
- Прямі вихідні виклики, що надають явний Discord `token`, використовують цей токен для виклику; параметри повторних спроб і політик облікового запису все одно беруться з вибраного облікового запису в активному знімку середовища виконання.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір стандартного облікового запису, коли збігається з налаштованим ідентифікатором облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал гільдії) для цілей доставки; голі числові ідентифікатори відхиляються.
- Слаги гільдій пишуться нижнім регістром із заміною пробілів на `-`; ключі каналів використовують слаговану назву (без `#`). Віддавайте перевагу ідентифікаторам гільдій.
- Повідомлення, створені ботами, стандартно ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- Канали, що підтримують вхідні повідомлення, створені ботами, можуть використовувати спільний [захист від циклів ботів](/uk/channels/bot-loop-protection). Задайте `channels.defaults.botLoopProtection` для базових бюджетів пар, а потім перевизначайте канал або обліковий запис лише тоді, коли окрема поверхня потребує інших лімітів.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний вихідний текст `@handle` з ідентифікаторами користувачів Discord перед надсиланням, щоб відомих учасників команди можна було згадувати детерміновано, навіть коли тимчасовий кеш каталогу порожній. Перевизначення для окремого облікового запису розміщуються в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (стандартно 17) розділяє високі повідомлення, навіть якщо вони менші за 2000 символів.
- `channels.discord.suppressEmbeds` стандартно має значення `true`, тому вихідні URL не розгортаються в попередні перегляди посилань Discord, якщо це не вимкнено. Явні корисні навантаження `embeds` усе одно надсилаються звичайно; виклики інструментів для окремих повідомлень можуть перевизначити це через `suppressEmbeds`.
- `channels.discord.threadBindings` керує маршрутизацією, прив’язаною до потоків Discord:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до потоків (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язана доставка/маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса через неактивність у годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSessions`: перемикач для `sessions_spawn({ thread: true })` і автоматичного створення/прив’язування потоків ACP thread-spawn (стандартно: `true`)
  - `defaultSpawnContext`: нативний контекст субагента для породжень, прив’язаних до потоків (стандартно `"fork"`)
- Записи верхнього рівня `bindings[]` із `type: "acp"` налаштовують сталі прив’язки ACP для каналів і потоків (використовуйте ідентифікатор каналу/потоку в `match.peer.id`). Семантика полів спільна в [агентах ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.agentComponents.ttlMs` керує тим, як довго надіслані зворотні виклики компонентів Discord залишаються зареєстрованими. Стандартне значення — `1800000` (30 хвилин), максимальне — `86400000` (24 години), а перевизначення для окремого облікового запису розміщуються в `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Довші значення довше зберігають придатність старих кнопок/виборів/форм, тому віддавайте перевагу найкоротшому TTL, що підходить для робочого процесу.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкове автоматичне приєднання + перевизначення LLM + TTS. Текстові конфігурації Discord стандартно залишають голос вимкненим; задайте `channels.discord.voice.enabled=true`, щоб увімкнути його.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, що використовується для відповідей у голосовому каналі Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE `@discordjs/voice` (стандартно `true` і `24`).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням Ready `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання (стандартно `30000`).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки часу від’єднана голосова сесія може входити в сигналізацію повторного підключення, перш ніж OpenClaw її знищить (стандартно `15000`).
- Відтворення голосу Discord не переривається подією початку мовлення іншого користувача. Щоб уникнути циклів зворотного зв’язку, OpenClaw ігнорує нове захоплення голосу, поки відтворюється TTS.
- OpenClaw додатково намагається відновити приймання голосу, виходячи з голосової сесії та повторно приєднуючись до неї після повторних збоїв дешифрування.
- `channels.discord.streaming` є канонічним ключем режиму потоку. Discord стандартно використовує `streaming.mode: "progress"`, щоб перебіг роботи інструментів/завдань з’являвся в одному редагованому повідомленні попереднього перегляду; задайте `streaming.mode: "off"`, щоб вимкнути це. Застарілі значення `streamMode` і булеві значення `streaming` залишаються псевдонімами середовища виконання; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `channels.discord.autoPresence` зіставляє доступність середовища виконання зі станом присутності бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним іменем/тегом (аварійний режим сумісності).
- `channels.discord.execApprovals`: нативна для Discord доставка затверджень exec і авторизація затверджувачів.
  - `enabled`: `true`, `false` або `"auto"` (стандартно). В автоматичному режимі затвердження exec активуються, коли затверджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Discord, яким дозволено затверджувати запити exec. Якщо пропущено, використовується резервне `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий список дозволених ідентифікаторів агентів. Пропустіть, щоб пересилати затвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або регулярний вираз).
  - `target`: куди надсилати запити затвердження. `"dm"` (стандартно) надсилає в DM затверджувачам, `"channel"` надсилає у вихідний канал, `"both"` надсилає в обидва місця. Коли ціль містить `"channel"`, кнопками можуть користуватися лише визначені затверджувачі.
  - `cleanupAfterResolve`: коли `true`, видаляє DM із затвердженням після затвердження, відмови або тайм-ауту.

**Режими сповіщень про реакції:** `off` (немає), `own` (повідомлення бота, стандартно), `all` (усі повідомлення), `allowlist` (з `guilds.<id>.users` для всіх повідомлень).

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

- JSON облікового запису служби: вбудований (`serviceAccount`) або файловий (`serviceAccountFile`).
- SecretRef облікового запису служби також підтримується (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним email-принципалом (аварійний режим сумісності).

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

- **Режим Socket** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного використання env стандартного облікового запису).
- **Режим HTTP** потребує `botToken` плюс `signingSecret` (на кореневому рівні або для кожного облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API приймача Bolt. Використовуйте це лише під час розслідування тайм-аутів ping/pong або застарілої поведінки websocket. `clientPingTimeout` за замовчуванням має значення `15000`; `serverPingTimeout` і `pingPongLoggingEnabled` передаються лише коли налаштовані.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack показують поля джерела/статусу для кожних облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в режимі HTTP —
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштований через SecretRef, але поточний шлях команди/runtime не зміг
  отримати значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір стандартного облікового запису, коли він збігається з id налаштованого облікового запису.
- `channels.slack.streaming.mode` є канонічним ключем режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним потоковим транспортом Slack. Застарілі значення `streamMode`, булеве `streaming` і `nativeStreaming` залишаються runtime-аліасами; виконайте `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `unfurlLinks` і `unfurlMedia` передають булеві параметри розгортання посилань і медіа Slack `chat.postMessage` для відповідей бота. `unfurlLinks` за замовчуванням має значення `false`, щоб вихідні посилання бота не розгорталися вбудовано, якщо це не ввімкнено; `unfurlMedia` пропускається, якщо не налаштовано. Встановіть будь-яке з цих значень у `channels.slack.accounts.<accountId>`, щоб перевизначити значення верхнього рівня для одного облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (за замовчуванням), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сесії потоку:** `thread.historyScope` є окремою для кожного потоку (за замовчуванням) або спільною для каналу. `thread.inheritParent` копіює стенограму батьківського каналу до нових потоків.

- Нативне потокове передавання Slack разом зі статусом потоку в стилі асистента Slack "is typing..." потребують цільового потоку відповіді. DM верхнього рівня за замовчуванням лишаються поза потоком, тож вони все ще можуть передаватися через попередні перегляди чернетки Slack із публікацією та редагуванням замість показу нативного потокового/статусного попереднього перегляду в стилі потоку.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, доки виконується відповідь, а потім видаляє її після завершення. Використовуйте шорткод emoji Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: доставка через нативний клієнт затверджень Slack і авторизація затверджувача exec. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`). Затвердження Plugin можуть використовувати цей шлях нативного клієнта для запитів, що походять зі Slack, коли затверджувачі Plugin Slack визначаються; доставку затверджень Plugin нативно через Slack також можна ввімкнути через `approvals.plugin` для сесій, що походять зі Slack, або цілей Slack. Затвердження Plugin використовують затверджувачів Plugin Slack із `allowFrom` і стандартну маршрутизацію, а не затверджувачів exec.

| Група дій | За замовчуванням | Примітки                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | Реагувати + перелічувати реакції |
| messages     | enabled | Читати/надсилати/редагувати/видаляти  |
| pins         | enabled | Закріпити/відкріпити/перелічити         |
| memberInfo   | enabled | Інформація про учасника            |
| emojiList    | enabled | Список власних emoji      |

### Mattermost

Mattermost постачається як вбудований Plugin у поточних випусках OpenClaw. Старіші або
кастомні збірки можуть установити поточний npm-пакет за допомогою
`openclaw plugins install @openclaw/mattermost`. Перевірте
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
щодо поточних dist-tags перед фіксацією версії.

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

Коли нативні команди Mattermost увімкнені:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має вказувати на кінцеву точку OpenClaw gateway і бути доступним із сервера Mattermost.
- Нативні callback-и slash автентифікуються токенами для кожної команди, які повертає
  Mattermost під час реєстрації slash-команди. Якщо реєстрація не вдається або жодні
  команди не активовані, OpenClaw відхиляє callback-и з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів callback Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен callback.
  Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення вимоги згадки для окремого каналу (`"*"` для стандартного значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір стандартного облікового запису, коли він збігається з id налаштованого облікового запису.

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
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір стандартного облікового запису, коли він збігається з id налаштованого облікового запису.

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Демон або порт не потрібні. Це рекомендований шлях для нових налаштувань OpenClaw iMessage, коли хост може надати дозволи до бази даних Messages і Automation.

Підтримку BlueBubbles видалено. `channels.bluebubbles` не є підтримуваною поверхнею runtime-конфігурації в поточному OpenClaw. Перенесіть старі конфігурації до `channels.imessage`; дивіться [Видалення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) для короткої версії та [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) для повної таблиці перекладу.

Якщо Gateway не запущений на Mac, де виконано вхід у Messages, залиште `channels.imessage.enabled=true` і встановіть `channels.imessage.cliPath` на SSH-обгортку, яка запускає `imsg "$@"` на цьому Mac. Стандартний локальний шлях `imsg` працює лише на macOS.

Перш ніж покладатися на SSH-обгортку для виробничих надсилань, перевірте вихідний `imsg send` через саме цю обгортку. Деякі стани macOS TCC призначають Messages Automation для `/usr/libexec/sshd-keygen-wrapper`, через що читання й перевірки можуть працювати, а надсилання завершуватимуться помилкою AppleEvents `-1743`; дивіться [Надсилання через SSH-обгортку завершується помилкою AppleEvents -1743](/uk/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір стандартного облікового запису, коли він збігається з id налаштованого облікового запису.

- Потребує Full Disk Access до бази даних Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб перелічити чати.
- `cliPath` може вказувати на SSH-обгортку; встановіть `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (за замовчуванням: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тож переконайтеся, що ключ ретрансляційного хоста вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані iMessage.
- `channels.imessage.sendTransport`: бажаний транспорт надсилання RPC `imsg` для звичайних вихідних відповідей. `auto` (за замовчуванням) використовує міст IMCore для наявних чатів, коли він запущений, а потім повертається до AppleScript; `bridge` потребує доставки через приватний API; `applescript` примусово використовує публічний шлях автоматизації Messages.
- `channels.imessage.actions.*`: увімкнути дії приватного API, які також обмежуються `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` за замовчуванням вимкнено; встановіть його в `true`, перш ніж очікувати вхідні медіа в ходах агента.
- Вхідне відновлення після перезапуску bridge/gateway є автоматичним (дедуплікація GUID плюс вікова межа застарілого backlog). Наявні конфігурації `channels.imessage.catchup.enabled: true` досі підтримуються як застарілий профіль сумісності.
- `channels.imessage.groups`: реєстр груп і налаштування для кожної групи. З `groupPolicy: "allowlist"` налаштуйте або явні ключі `chat_id`, або запис із wildcard `"*"`, щоб групові повідомлення могли пройти через шлюз реєстру.
- Записи верхнього рівня `bindings[]` із `type: "acp"` можуть прив’язувати розмови iMessage до постійних сесій ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

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
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначити це через `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і це мережеве явне ввімкнення є незалежними засобами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у налаштуваннях із кількома обліковими записами.
- `channels.matrix.autoJoin` за замовчуванням має значення `off`, тому запрошені кімнати та нові запрошення у стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: доставлення підтверджень exec, нативне для Matrix, і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі підтвердження exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Matrix (наприклад, `@owner:example.org`), яким дозволено схвалювати запити exec.
  - `agentFilter`: необов’язковий список дозволених ID агентів. Пропустіть, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або регулярний вираз).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (за замовчуванням), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для окремих облікових записів: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM Matrix групуються в сесії: `per-user` (за замовчуванням) спільно використовує сесію за маршрутизованим співрозмовником, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки стану Matrix і live-пошуки в каталозі використовують ту саму політику проксі, що й трафік runtime.
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
- Повну конфігурацію Teams (облікові дані, webhook, політика DM/груп, перевизначення для окремих команд/каналів) задокументовано в [Microsoft Teams](/uk/channels/msteams).

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
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли він збігається з ID налаштованого облікового запису.
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
- Токени env застосовуються лише до **типового** облікового запису.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте нетиповий обліковий запис через `openclaw channels add` (або onboarding каналу), все ще маючи однорівневу конфігурацію каналу для одного облікового запису, OpenClaw спочатку переносить значення верхнього рівня, що належать до облікового запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переносять їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
- Наявні прив’язки лише до каналу (без `accountId`) і далі відповідають типовому обліковому запису; прив’язки з областю облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня для одного облікового запису, що належать до облікового запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад, Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Дивіться повний індекс каналів: [Канали](/uk/channels).

### Контроль згадок у групових чатах

Групові повідомлення за замовчуванням **вимагають згадки** (метадані згадки або безпечні шаблони регулярних виразів). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Видимі відповіді керуються окремо. Звичайні групові, канальні та внутрішні прямі запити WebChat за замовчуванням використовують автоматичну фінальну доставку: фінальний текст асистента публікується через застарілий шлях видимої відповіді. Увімкніть `messages.visibleReplies: "message_tool"` або `messages.groupChat.visibleReplies: "message_tool"`, коли видимий вивід має публікуватися лише після того, як агент викличе `message(action=send)`. Якщо модель повертає фінальний текст без виклику інструмента повідомлень у режимі лише для інструмента, де це ввімкнено, цей фінальний текст залишається приватним, а докладний журнал gateway записує метадані пригніченого payload.

Видимі відповіді лише через інструмент вимагають моделі/runtime, що надійно викликає інструменти, і рекомендовані для спільних фонових кімнат на моделях останнього покоління, таких як GPT 5.5. Деякі слабші моделі можуть відповідати фінальним текстом, але не розуміють, що видимий для джерела вивід потрібно надсилати через `message(action=send)`. Для таких моделей використовуйте `"automatic"`, щоб фінальний хід асистента був шляхом видимої відповіді. Якщо журнал сесії показує текст асистента з `didSendViaMessagingTool: false`, модель створила приватний фінальний текст замість виклику інструмента повідомлень. Перемкніться на сильнішу модель із викликом інструментів для цього каналу, перегляньте докладний журнал gateway для зведення пригніченого payload або задайте `messages.groupChat.visibleReplies: "automatic"`, щоб використовувати видимі фінальні відповіді для кожного групового/канального запиту.

Якщо інструмент повідомлень недоступний за активною політикою інструментів, OpenClaw повертається до автоматичних видимих відповідей замість мовчазного пригнічення відповіді. `openclaw doctor` попереджає про цю невідповідність.

Це правило застосовується до звичайного фінального тексту агента. Прив’язки розмов, що належать Plugin, використовують відповідь, повернену Plugin-власником, як видиму відповідь для заявлених ходів прив’язаного потоку; Plugin не потрібно викликати `message(action=send)` для таких відповідей прив’язки.

**Усунення несправностей: групова @згадка запускає індикацію набору, потім тиша (без помилки)**

Симптом: групова/канальна @згадка показує індикатор набору, і журнал gateway повідомляє `dispatch complete (queuedFinal=false, replies=0)`, але в кімнаті не з’являється жодне повідомлення. DM до того самого агента відповідають нормально.

Причина: режим видимої відповіді групи/каналу визначається як `"message_tool"`, тому OpenClaw виконує хід, але пригнічує фінальний текст асистента, якщо агент не викликає `message(action=send)`. У цьому режимі немає контракту `NO_REPLY`; відсутність виклику інструмента повідомлень означає відсутність відповіді в джерелі. Помилки немає, бо пригнічення є налаштованою поведінкою. Звичайні ходи груп і каналів за замовчуванням мають `"automatic"`, тому цей симптом з’являється лише коли `messages.groupChat.visibleReplies` (або глобальний `messages.visibleReplies`) явно задано як `"message_tool"`. Harness `defaultVisibleReplies` тут не застосовується — резолвер групи/каналу ігнорує його; він впливає лише на прямі/source-чати (Codex harness так пригнічує фінальні відповіді прямих чатів).

Виправлення: або виберіть сильнішу модель із викликом інструментів, або приберіть явне перевизначення `"message_tool"`, щоб повернутися до типового `"automatic"`, або задайте `messages.groupChat.visibleReplies: "automatic"`, щоб примусово ввімкнути видимі відповіді для кожного групового/канального запиту. Gateway гаряче перезавантажує конфігурацію `messages` після збереження файла; перезапускайте gateway лише тоді, коли спостереження за файлами або перезавантаження конфігурації вимкнено в розгортанні.

**Типи згадок:**

- **Згадки метаданих**: нативні @згадки платформи. Ігноруються в режимі self-chat WhatsApp.
- **Текстові шаблони**: безпечні шаблони регулярних виразів у `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони та небезпечні вкладені повторення ігноруються.
- Контроль згадок застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначати його через `channels.<channel>.historyLimit` (або для окремого облікового запису). Задайте `0`, щоб вимкнути.

`messages.groupChat.unmentionedInbound: "room_event"` надсилає незгадані always-on групові/канальні повідомлення як тихий контекст кімнати на підтримуваних каналах. Згадані повідомлення, команди та прямі повідомлення залишаються запитами користувача. Повні приклади для Discord, Slack і Telegram дивіться в [Фонові події кімнати](/uk/channels/ambient-room-events).

`messages.visibleReplies` є глобальним типовим значенням для source-event; `messages.groupChat.visibleReplies` перевизначає його для групових/канальних source-event. Коли `messages.visibleReplies` не задано, direct/source-чати використовують вибране типове значення runtime або harness, але внутрішні прямі ходи WebChat використовують автоматичну фінальну доставку для паритету підказок Pi/Codex. Задайте `messages.visibleReplies: "message_tool"`, щоб навмисно вимагати `message(action=send)` для видимого виводу. Списки дозволених каналів і контроль згадок і далі вирішують, чи обробляється подія.

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

Розв’язання: перевизначення для окремого DM → типове значення провайдера → без ліміту (зберігається все).

Підтримується: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте власний номер до `allowFrom`, щоб увімкнути режим self-chat (ігнорує нативні @згадки, відповідає лише на текстові шаблони):

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
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовано на сторінках відповідних каналів/Plugin, а також у [Slash Commands](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, залишає Slack вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, залишає Slack вимкненим.
- Перевизначення для каналу: `channels.discord.commands.native` (bool або `"auto"`). Для Discord значення `false` пропускає реєстрацію та очищення нативних команд під час запуску.
- Перевизначайте реєстрацію нативних Skills для кожного каналу за допомогою `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled` і відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; `/config show` лише для читання залишається доступною звичайним клієнтам-операторам із правом запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, керованого OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, установлення та елементів керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` обмежує мутації конфігурації для кожного каналу (типово: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, що цільово стосуються цього облікового запису (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструментів перезапуску Gateway. Типово: `true`.
- `ownerAllowFrom` — це явний allowlist власників для команд лише для власника та дій каналів, обмежених власником. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному prompt. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Коли встановлено, це **єдине** джерело авторизації (allowlist каналів/сполучення та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.
- Мапа документації команд:
  - вбудований і bundled каталог: [Slash Commands](/uk/tools/slash-commands)
  - поверхні команд, специфічні для каналу: [Channels](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди сполучення: [Pairing](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - Dreaming пам’яті: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
