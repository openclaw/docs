---
read_when:
    - Налаштування плагіна каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення несправностей ключів конфігурації для окремих каналів
    - Аудит політики приватних повідомлень, групової політики або фільтрації за згадками
summary: 'Налаштування каналів: керування доступом, сполучення, окремі ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-07-16T17:57:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації для окремих каналів у `channels.*`: доступ до особистих повідомлень і груп, налаштування кількох облікових записів, фільтрація за згадуванням і окремі ключі каналів для Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та інших плагінів каналів.

Для агентів, інструментів, середовища виконання Gateway та інших ключів верхнього рівня див. [довідник із конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не `enabled: false`). Telegram та iMessage постачаються в складі основного пакета `openclaw`. Інші офіційні канали (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost тощо) встановлюються як окремі плагіни за допомогою `openclaw plugins install <spec>`; повний список і специфікації встановлення див. у розділі [Канали](/uk/channels).

### Доступ до особистих повідомлень і груп

Усі канали підтримують політики особистих повідомлень і груп:

| Політика особистих повідомлень | Поведінка                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (типово) | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники з `allowFrom` (або зі сховища дозволів для сполучених відправників)             |
| `open`              | Дозволяти всі вхідні особисті повідомлення (потрібен `allowFrom: ["*"]`)             |
| `disabled`          | Ігнорувати всі вхідні особисті повідомлення                                          |

| Політика груп          | Поведінка                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (типово) | Лише групи, що відповідають налаштованому списку дозволів          |
| `open`                | Оминати списки дозволів груп (фільтрація за згадуванням усе одно застосовується) |
| `disabled`            | Блокувати всі повідомлення груп/кімнат                          |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Термін дії кодів сполучення завершується через 1 годину. Кількість очікуваних запитів на сполучення обмежена до **3 на обліковий запис** (окремо для кожного каналу та ідентифікатора облікового запису).
Якщо блок провайдера відсутній повністю (немає `channels.<provider>`), політика груп середовища виконання повертається до `allowlist` (безпечна відмова) з попередженням під час запуску.
</Note>

### Перевизначення моделей каналів

Використовуйте `channels.modelByChannel`, щоб закріпити певні ідентифікатори каналів або співрозмовників в особистих повідомленнях за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналів застосовується лише тоді, коли сеанс ще не має активного перевизначення моделі (наприклад, установленого через `/model`).

Для групових розмов і гілок ключами є залежні від каналу ідентифікатори груп, ідентифікатори тем або назви каналів. Для розмов в особистих повідомленнях ключами є ідентифікатори співрозмовників, отримані з ідентичності відправника каналу (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` або `SenderId`). Точний формат ключа залежить від каналу:

| Канал  | Формат ключа особистих повідомлень         | Приклад                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | необроблений ідентифікатор користувача         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | ідентифікатор користувача Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | необроблений ідентифікатор користувача         | `123456789`                                  |
| WhatsApp | номер телефону або JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

Ключі, призначені для особистих повідомлень, збігаються лише в розмовах через особисті повідомлення; вони не впливають на маршрутизацію груп або гілок.

### Типові значення каналів і Heartbeat

Використовуйте `channels.defaults` для спільної політики груп і поведінки Heartbeat серед провайдерів:

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
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь контекст цитат/гілок/історії), `allowlist` (включати лише контекст від відправників зі списку дозволів), `allowlist_quote` (так само, як список дозволів, але зберігати явний контекст цитати/відповіді). Перевизначення для окремого каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні стани каналів у вивід Heartbeat (типово `false`).
- `channels.defaults.heartbeat.showAlerts`: включати стани погіршення роботи/помилок у вивід Heartbeat (типово `true`).
- `channels.defaults.heartbeat.useIndicator`: відображати компактний вивід Heartbeat у стилі індикатора (типово `true`).

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = retry forever
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- `web.whatsapp.keepAliveIntervalMs` (типово `25000`), `connectTimeoutMs` (типово `60000`) і `defaultQueryTimeoutMs` (типово `60000`) налаштовують сокет Baileys.
- Типові значення `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0` повторює спроби безкінечно замість припинення.
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для особистих повідомлень і груп WhatsApp. Використовуйте безпосередній номер у форматі E.164 або JID групи WhatsApp у `match.peer.id`. Семантику полів описано в розділі [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

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

- Вихідні команди типово використовують обліковий запис `default`, якщо він існує; інакше — перший налаштований ідентифікатор облікового запису (після сортування).
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, коли він відповідає налаштованому ідентифікатору облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису переноситься командою `openclaw doctor` до `whatsapp/default`.
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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; символічні посилання відхиляються), з `TELEGRAM_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- `apiRoot` — це лише коренева адреса Telegram Bot API. Використовуйте `https://api.telegram.org` або власну кореневу адресу самостійно розміщеного сервера/проксі, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий кінцевий суфікс `/bot<TOKEN>`.
- Для самостійно розміщеного сервера Bot API в режимі `--local` параметр `trustedLocalFileRoots` перелічує шляхи хоста, які OpenClaw може читати. Підключіть том даних сервера на хості OpenClaw і налаштуйте кореневий каталог даних або каталог для окремого токена; шляхи контейнера в `/var/lib/telegram-bot-api` зіставляються з цими кореневими каталогами. Інші абсолютні шляхи й надалі відхиляються.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає налаштованому ідентифікатору облікового запису.
- У конфігураціях із кількома обліковими записами (2+ ідентифікатори облікових записів) задайте явний типовий обліковий запис (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли він відсутній або недійсний.
- `configWrites: false` блокує ініційовані Telegram записи конфігурації (міграції ідентифікаторів супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форуму (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантику полів описано в розділі [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- Попередній перегляд потокового виводу Telegram використовує `sendMessage` + `editMessageText` (працює в особистих і групових чатах).
- `network.dnsResultOrder` типово має значення `"ipv4first"`, щоб уникнути поширених помилок отримання через IPv6.
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
              systemPrompt: "Лише короткі відповіді.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (типове значення Discord: progress)
        chunkMode: "length", // length | newline
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

- Токен: `channels.discord.token`, із `DISCORD_BOT_TOKEN` як резервним варіантом для типового облікового запису.
- Прямі вихідні виклики, що надають явний Discord `token`, використовують цей токен для виклику; параметри повторних спроб і політик облікового запису все одно беруться з вибраного облікового запису в активному знімку середовища виконання.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір типового облікового запису, коли він відповідає ідентифікатору налаштованого облікового запису.
- Використовуйте `user:<id>` (приватне повідомлення) або `channel:<id>` (канал сервера) як цілі доставки; прості числові ідентифікатори відхиляються.
- Слаги серверів записуються малими літерами із заміною пробілів на `-`; ключі каналів використовують назву у форматі слага (без `#`). Надавайте перевагу ідентифікаторам серверів.
- Повідомлення, створені ботами, типово ігноруються. `allowBots: true` дозволяє їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно відфільтровуються).
- Канали, що підтримують вхідні повідомлення від ботів, можуть використовувати спільний [захист від зациклення ботів](/uk/channels/bot-loop-protection). Установіть `channels.defaults.botLoopProtection` для базових лімітів пар, а потім перевизначайте їх для каналу чи облікового запису лише тоді, коли окремій поверхні потрібні інші ліміти.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення для каналів) відкидає повідомлення, що згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний текст вихідного `@handle` з ідентифікаторами користувачів Discord перед надсиланням, щоб відомих колег можна було згадувати детерміновано, навіть коли тимчасовий кеш каталогу порожній. Перевизначення для окремих облікових записів містяться в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (типово `17`) розділяє високі повідомлення, навіть якщо вони містять менше ніж 2000 символів.
- `channels.discord.suppressEmbeds` типово має значення `true`, тому вихідні URL-адреси не розгортаються в попередній перегляд посилань Discord, якщо це не вимкнено. Явні корисні навантаження `embeds` усе одно надсилаються у звичайному режимі; виклики інструментів для окремих повідомлень можуть перевизначити це за допомогою `suppressEmbeds`.
- `channels.discord.threadBindings` керує маршрутизацією Discord, прив’язаною до гілок:
  - `enabled`: перевизначення Discord для функцій сеансів, прив’язаних до гілок (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язана доставка й маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса після бездіяльності в годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSessions`: перемикач автоматичного створення та прив’язування гілок для `sessions_spawn({ thread: true })` і створення гілок ACP (типове значення: `true`)
  - `defaultSpawnContext`: нативний контекст підлеглого агента для створень, прив’язаних до гілок (типово `"fork"`)
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і гілок (використовуйте ідентифікатор каналу/гілки в `match.peer.id`). Семантика полів спільна з розділом [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.agentComponents.ttlMs` визначає, як довго надіслані зворотні виклики компонентів Discord залишаються зареєстрованими. Типове значення — `1800000` (30 хвилин), максимальне — `86400000` (24 години). Перевизначення для окремих облікових записів містяться в `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Надавайте перевагу найкоротшому TTL, що відповідає робочому процесу.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord, а також необов’язкове автоматичне приєднання й перевизначення LLM і TTS. У текстових конфігураціях Discord голос типово вимкнено; установіть `channels.discord.voice.enabled=true`, щоб увімкнути його.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, що використовується для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` (типово `true`) і `channels.discord.voice.decryptionFailureTolerance` (типово `24`) передаються до параметрів DAVE `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням готовності `@discordjs/voice` для `/vc join` і спроб автоматичного приєднання (типово `30000`).
- `channels.discord.voice.reconnectGraceMs` визначає, скільки часу від’єднаний голосовий сеанс може витратити на перехід до сигналізації повторного підключення, перш ніж OpenClaw знищить його (типово `15000`).
- Відтворення голосу Discord не переривається подією початку мовлення іншого користувача. Щоб уникнути циклів зворотного зв’язку, OpenClaw ігнорує нове захоплення голосу під час відтворення TTS.
- Крім того, OpenClaw намагається відновити приймання голосу, виходячи з голосового сеансу та повторно приєднуючись до нього після неодноразових помилок розшифрування.
- `channels.discord.streaming` — канонічний ключ режиму потоку. Для Discord типовим є `streaming.mode: "progress"`, тому перебіг роботи інструментів і виконання завдань відображається в одному редагованому повідомленні попереднього перегляду; установіть `streaming.mode: "off"`, щоб вимкнути це. Застарілі плоскі ключі (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) більше не зчитуються під час виконання; запустіть `openclaw doctor --fix`, щоб перенести збережену конфігурацію.
- `channels.discord.autoPresence` зіставляє доступність середовища виконання зі статусом присутності бота (справний => у мережі, погіршений => неактивний, вичерпаний => не турбувати) і дає змогу необов’язково перевизначати текст статусу.
- `channels.discord.guilds.<id>.presenceEvents` спрямовує події появи доступності людей в один налаштований канал Discord як системні події агента. Відповідні учасники повинні мати змогу переглядати `channelId`; публічні гілки успадковують видимість батьківського каналу, тоді як приватні гілки додатково вимагають членства або дозволу Manage Threads. `users` може додатково звузити цю аудиторію. Початковий список учасників у мережі формується з повних знімків `GUILD_CREATE`; система спрямовує спостережувані переходи зі стану поза мережею до стану в мережі та розглядає перший пізніший сигнал про перебування в мережі для раніше невідомого учасника як нову доступність, не стверджуючи, чи він увійшов у мережу, чи приєднався після створення знімка. Для серверів, що перевищують ліміт знімка Discord у 75,000 учасників, спочатку потрібне явне оновлення стану поза мережею. Параметри регулювання частоти: `reconnectSuppressSeconds` (період тиші після нового сеансу Gateway, поки стан присутності сервера перебудовується; типово 300, `0` вимикає) і `burstLimit`/`burstWindowSeconds` (обмеження частоти успішно поставлених у чергу подій для кожного сервера; типово 8 подій на ковзне вікно тривалістю 60 с). Відновлені сеанси не запускають період приглушення після повторного підключення. Наявний період очікування перед повторним привітанням користувача залишається рівним восьми годинам. Для цього потрібні `channels.discord.intents.presence=true`, привілейований Presence Intent у Developer Portal Discord і ввімкнений Heartbeat агента.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення змінюваних імен/тегів (аварійний режим сумісності).
- `channels.discord.execApprovals`: нативна для Discord доставка запитів на схвалення виконання та авторизація осіб, що схвалюють.
  - `enabled`: `true`, `false` або `"auto"` (типово). В автоматичному режимі схвалення виконання активуються, коли осіб, що схвалюють, можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Discord, яким дозволено схвалювати запити на виконання. Якщо параметр не вказано, використовується `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий список дозволених ідентифікаторів агентів. Не вказуйте його, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансів (підрядок або регулярний вираз).
  - `target`: куди надсилати запити на схвалення. `"dm"` (типово) надсилає їх у приватні повідомлення осіб, що схвалюють, `"channel"` — у вихідний канал, а `"both"` — в обидва місця. Коли ціль містить `"channel"`, кнопками можуть користуватися лише визначені особи, що схвалюють.
  - `cleanupAfterResolve`: коли встановлено `true`, видаляє приватні повідомлення зі схваленням після схвалення, відхилення або завершення часу очікування.

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

- JSON облікового запису служби: вбудований (`serviceAccount`) або файловий (`serviceAccountFile`).
- Також підтримується SecretRef облікового запису служби (`serviceAccountRef`).
- Резервні змінні середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (лише для типового облікового запису).
- Використовуйте `spaces/<spaceId>` або `users/<userId>` як цілі доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно вмикає зіставлення змінюваних ідентифікаторів електронної пошти (аварійний режим сумісності).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
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
      replyToMode: "off", // вимкнено | перше | усі | пакетно
      thread: {
        historyScope: "thread", // гілка | канал
        inheritParent: false,
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // вимкнено | частково | блок | перебіг
        chunkMode: "length", // довжина | новий рядок
        nativeTransport: true, // використовувати власний API потокового передавання Slack, коли mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // особисті повідомлення | канал | обидва
      },
    },
  },
}
```

- **Режим Socket** потребує обох `botToken` і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного використання змінних середовища типового облікового запису).
- **Режим HTTP** потребує `botToken` разом із `signingSecret` (у корені або для кожного облікового запису).
- `enterpriseOrgInstall: true` підключає обліковий запис до шляху подій Slack Enterprise Grid
  для всієї організації. Під час запуску токен бота перевіряється за допомогою `auth.test`, і
  запуск завершується помилкою, якщо налаштований режим не відповідає ідентичності інсталяції Slack.
  Особисті повідомлення Enterprise мають бути вимкнені або використовувати `dmPolicy: "open"` із чинним
  `allowFrom: ["*"]`. Політики каналів і користувачів мають використовувати стабільні ідентифікатори Slack;
  змінювані назви й непідтримувані префікси каналів спричиняють помилку запуску. V1 обробляє лише
  прямі події Socket Mode або HTTP `message` і `app_mention` із негайними
  відповідями; ретрансляція, команди, взаємодії, App Home, обробники подій реакцій,
  закріплення, інструменти дій, нативні схвалення, прив’язки, відкладена доставка та
  проактивні надсилання недоступні. Підтвердження, введення тексту й
  реакції стану, якими керує обробник, залишаються доступними з `reactions:write`; вхідні
  сповіщення про реакції та інструменти дій із реакціями недоступні. Див.
  [Інсталяції Enterprise Grid для всієї організації](/uk/channels/slack#enterprise-grid-org-wide-installs)
  щодо маніфесту з мінімальними привілеями, процесу налаштування та повного переліку обмежень.
- `socketMode` передає налаштування транспорту Socket Mode SDK Slack до публічного API приймача Bolt. Використовуйте це лише під час дослідження тайм-аутів ping/pong або поведінки застарілого websocket-з’єднання. Типове значення `clientPingTimeout` — `15000`; `serverPingTimeout` і `pingPongLoggingEnabled` передаються лише за наявності налаштування.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають звичайні текстові
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack надають для кожних облікових даних поля джерела/стану, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/середовища виконання не зміг
  визначити секретне значення.
- `configWrites: false` блокує запис конфігурації, ініційований Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає ідентифікатору налаштованого облікового запису.
- `channels.slack.streaming.mode` — канонічний ключ режиму потоку Slack (типово `"partial"`). `channels.slack.streaming.nativeTransport` керує нативним транспортом потокового передавання Slack (типово `true`). Застарілі значення `streamMode`, логічне `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` і `nativeStreaming` більше не зчитуються під час виконання; запустіть `openclaw doctor --fix`, щоб перенести збережену конфігурацію до `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` і `unfurlMedia` передають логічні параметри розгортання посилань і медіа `chat.postMessage` Slack для відповідей бота. Типове значення `unfurlLinks` — `false`, тому вихідні посилання бота не розгортаються в тексті, якщо це не ввімкнено; `unfurlMedia` не передається, якщо його не налаштовано. Установіть будь-яке зі значень у `channels.slack.accounts.<accountId>`, щоб перевизначити значення верхнього рівня для одного облікового запису.
- Використовуйте `user:<id>` (особисті повідомлення) або `channel:<id>` як цілі доставки.

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (від `reactionAllowlist`).

**Ізоляція сеансів гілок:** `thread.historyScope` — для кожної гілки (типово) або спільний у межах каналу. `thread.inheritParent` копіює журнал батьківського каналу до нових гілок. `thread.initialHistoryLimit` (типово `20`) обмежує кількість наявних повідомлень гілки, які отримуються під час запуску нового сеансу гілки; `0` вимикає отримання історії гілки.

- Нативне потокове передавання Slack разом зі статусом гілки «is typing...» у стилі асистента Slack потребують цілі відповіді в гілці. Особисті повідомлення верхнього рівня типово залишаються поза гілками, тому вони все одно можуть передаватися потоком через чернетки Slack із попереднім переглядом публікації та редагування замість показу нативного попереднього перегляду потоку/стану в стилі гілки.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack під час формування відповіді, а після завершення видаляє її. Використовуйте короткий код емодзі Slack, наприклад `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативна для Slack доставка клієнту схвалення та авторизація затверджувача виконання. Схема така сама, як у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ідентифікатори користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`). Схвалення Plugin можуть використовувати цей нативний клієнтський шлях для запитів зі Slack, коли визначено затверджувачів Plugin Slack; нативну для Slack доставку схвалень Plugin також можна ввімкнути через `approvals.plugin` для сеансів зі Slack або цілей Slack. Схвалення Plugin використовують затверджувачів Plugin Slack із `allowFrom` і типову маршрутизацію, а не затверджувачів виконання.

| Група дій   | Типово    | Примітки                         |
| ------------ | --------- | -------------------------------- |
| reactions    | увімкнено | Реагувати + перелічувати реакції |
| messages     | увімкнено | Читати/надсилати/редагувати/видаляти |
| pins         | увімкнено | Закріплювати/відкріплювати/перелічувати |
| memberInfo   | увімкнено | Інформація про учасника          |
| emojiList    | увімкнено | Список власних емодзі            |

### Mattermost

Mattermost установлюється як окремий Plugin, так само як Discord, Slack і WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Перевірте актуальні dist-теги на [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost), перш ніж фіксувати версію.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // за викликом | для повідомлення | за символом
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // явне ввімкнення
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Необов’язкова явна URL-адреса для розгортань із зворотним проксі або публічним доступом
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Режими чату: `oncall` (відповідати на @згадку, типово), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса-тригера).

Коли ввімкнено нативні команди Mattermost:

- `commands.callbackPath` має бути шляхом (наприклад, `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має визначатися як кінцева точка Gateway OpenClaw і бути доступним із сервера Mattermost.
- Нативні зворотні виклики slash-команд автентифікуються за допомогою окремих токенів команд, які повертає
  Mattermost під час реєстрації slash-команд. Якщо реєстрація завершилася помилкою або жодну
  команду не активовано, OpenClaw відхиляє зворотні виклики з
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх вузлів зворотного виклику Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив вузол/домен зворотного виклику.
  Використовуйте значення вузла/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити запис конфігурації, ініційований Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення вимоги згадки для кожного каналу (`"*"` як типове значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає ідентифікатору налаштованого облікового запису.

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
      reactionNotifications: "own", // вимкнено | власні | усі | список дозволених
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Режими сповіщень про реакції:** `off`, `own` (типово), `all`, `allowlist` (від `reactionAllowlist`).

- `channels.signal.account`: прив’язати запуск каналу до ідентичності конкретного облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити запис конфігурації, ініційований Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір типового облікового запису, якщо він відповідає ідентифікатору налаштованого облікового запису.

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Демон або порт не потрібні. Це рекомендований шлях для нових налаштувань OpenClaw iMessage, коли вузол може надати дозволи на базу даних Messages і автоматизацію.

Підтримку BlueBubbles видалено. `channels.bluebubbles` не є підтримуваною поверхнею конфігурації середовища виконання в поточній версії OpenClaw. Перенесіть старі конфігурації до `channels.imessage`; стислий опис див. у [Видалення BlueBubbles і шлях imsg для iMessage](/uk/announcements/bluebubbles-imessage), а повну таблицю відповідників — у [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles).

Якщо Gateway працює не на Mac із виконаним входом у Messages, залиште `channels.imessage.enabled=true` і задайте для `channels.imessage.cliPath` SSH-обгортку, яка запускає `imsg "$@"` на цьому Mac. Типовий локальний шлях `imsg` призначений лише для macOS.

Перш ніж покладатися на SSH-обгортку для робочих надсилань, перевірте вихідний `imsg send` саме через цю обгортку. Деякі стани TCC у macOS призначають автоматизацію Messages для `/usr/libexec/sshd-keygen-wrapper`, через що читання й перевірки можуть працювати, тоді як надсилання завершуються помилкою AppleEvents `-1743`; див. розділ про усунення несправностей SSH-обгортки в [iMessage](/uk/channels/imessage).

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

- Необов’язковий параметр `channels.imessage.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає ідентифікатору налаштованого облікового запису.
- Потребує повного доступу до диска для бази даних Messages.
- Надавайте перевагу цілям `chat_id:<id>`. Скористайтеся `imsg chats --limit 20`, щоб переглянути список чатів.
- `cliPath` може вказувати на обгортку SSH; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (за замовчуванням: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку ключа хоста, тому переконайтеся, що ключ хоста ретранслятора вже наявний у `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити ініційований через iMessage запис конфігурації.
- `channels.imessage.sendTransport`: бажаний транспорт надсилання RPC `imsg` для звичайних вихідних відповідей. `auto` (за замовчуванням) використовує міст IMCore для наявних чатів, коли він працює, а потім переходить на AppleScript; `bridge` вимагає доставлення через приватний API; `applescript` примусово використовує загальнодоступний шлях автоматизації Messages.
- `channels.imessage.actions.*`: увімкнути дії приватного API, які також обмежуються параметрами `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` за замовчуванням вимкнено; задайте для нього `true`, перш ніж очікувати вхідні медіафайли в ходах агента.
- Відновлення вхідних повідомлень після перезапуску мосту/Gateway відбувається автоматично (дедуплікація за GUID і вікове обмеження для застарілої черги). Наявні конфігурації `channels.imessage.catchup.enabled: true` досі підтримуються як застарілий профіль сумісності; `catchup` за замовчуванням вимкнено.
- `channels.imessage.groups`: реєстр груп і налаштування для окремих груп. З `groupPolicy: "allowlist"` налаштуйте явні ключі `chat_id` або запис із шаблоном `"*"`, щоб групові повідомлення могли пройти перевірку реєстру.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сеансів ACP. Використовуйте нормалізований дескриптор або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Спільна семантика полів: [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Приклад обгортки SSH для iMessage">

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
- `channels.matrix.proxy` спрямовує HTTP-трафік Matrix через явно заданий проксі HTTP(S). Іменовані облікові записи можуть перевизначити його за допомогою `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні домашні сервери. `proxy` і цей дозвіл мережі є незалежними засобами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із кількома обліковими записами.
- `channels.matrix.autoJoin` за замовчуванням має значення `"off"`, тому запрошення до кімнат і нові запрошення на кшталт особистих повідомлень ігноруються, доки ви не задасте `autoJoin: "allowlist"` із `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: власний для Matrix механізм доставлення запитів на схвалення виконання та авторизації осіб, які схвалюють.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі схвалення виконання активуються, коли осіб, які схвалюють, можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Matrix (наприклад, `@owner:example.org`), яким дозволено схвалювати запити на виконання.
  - `agentFilter`: необов’язковий список дозволених ідентифікаторів агентів. Не вказуйте його, щоб пересилати запити на схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сеансів (підрядок або регулярний вираз).
  - `target`: куди надсилати запити на схвалення. `"dm"` (за замовчуванням), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для окремих облікових записів: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` визначає, як особисті повідомлення Matrix об’єднуються в сеанси: `per-user` (за замовчуванням) спільно використовує сеанс за маршрутизованим співрозмовником, тоді як `per-room` ізолює кожну кімнату особистих повідомлень.
- Перевірки стану Matrix і динамічні пошуки в каталозі використовують ту саму політику проксі, що й трафік середовища виконання.
- Повну конфігурацію Matrix, правила вибору цілей і приклади налаштування задокументовано в [Matrix](/uk/channels/matrix).

### Microsoft Teams

Microsoft Teams працює на основі Plugin і налаштовується в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, політики команди/каналу:
      // див. /channels/msteams
    },
  },
}
```

- Основні шляхи ключів, описані тут: `channels.msteams`, `channels.msteams.configWrites`.
- Повну конфігурацію Teams (облікові дані, webhook, політика особистих/групових повідомлень, перевизначення для окремих команд/каналів) задокументовано в [Microsoft Teams](/uk/channels/msteams).

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
- Необов’язковий параметр `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, якщо він відповідає ідентифікатору налаштованого облікового запису.
- Повну конфігурацію каналу IRC (хост/порт/TLS/канали/списки дозволених/перевірка згадок) задокументовано в розділі [IRC](/uk/channels/irc).

### Кілька облікових записів (усі канали)

Використовуйте кілька облікових записів для кожного каналу (кожен зі своїм `accountId`):

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
- Токени зі змінних середовища застосовуються лише до облікового запису **за замовчуванням**.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для окремого облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб спрямувати кожен обліковий запис до іншого агента.
- Якщо додати обліковий запис, відмінний від облікового запису за замовчуванням, через `openclaw channels add` (або під час початкового налаштування каналу), зберігаючи конфігурацію каналу верхнього рівня для одного облікового запису, OpenClaw спочатку переносить значення верхнього рівня, що стосуються одного облікового запису, до мапи облікових записів каналу, щоб початковий обліковий запис продовжив працювати. Більшість каналів переміщують їх до `channels.<channel>.accounts.default`; натомість Matrix може зберегти наявну відповідну іменовану ціль або ціль за замовчуванням.
- Наявні прив’язки лише до каналу (без `accountId`) і надалі відповідають обліковому запису за замовчуванням; прив’язки до конкретного облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переміщуючи значення верхнього рівня, що стосуються одного облікового запису, до підвищеного облікового запису, вибраного для цього каналу. Більшість каналів використовують `accounts.default`; натомість Matrix може зберегти наявну відповідну іменовану ціль або ціль за замовчуванням.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на окремих сторінках каналів (наприклад, Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch і Zalo).
Повний покажчик каналів див. у розділі [Канали](/uk/channels).

### Перевірка згадок у груповому чаті

Для групових повідомлень за замовчуванням **потрібна згадка** (згадка в метаданих або безпечні шаблони регулярних виразів). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Видимі відповіді керуються окремо. Для звичайних прямих запитів у групах, каналах і внутрішньому WebChat за замовчуванням використовується автоматичне доставлення остаточної відповіді: остаточний текст асистента публікується через застарілий шлях видимої відповіді. Увімкніть `messages.visibleReplies: "message_tool"` або `messages.groupChat.visibleReplies: "message_tool"`, якщо видимий результат має публікуватися лише після виклику агентом `message(action=send)`. Якщо модель повертає змістовну остаточну відповідь без виклику інструмента повідомлень у ввімкненому режимі лише інструментів, цей остаточний текст залишається приватним, докладний журнал Gateway записує метадані прихованого корисного навантаження, а OpenClaw ставить у чергу одну повторну спробу відновлення з проханням до моделі доставити ту саму відповідь через `message(action=send)`.

Для видимих відповідей лише через інструменти потрібна модель/середовище виконання, що надійно викликає інструменти; цей режим рекомендовано для спільних фонових кімнат із моделями останнього покоління, як-от GPT-5.6 Sol. Деякі слабші моделі можуть повертати остаточний текст відповіді, але не розуміють, що видимий у джерелі результат потрібно надіслати через `message(action=send)`. За замовчуванням OpenClaw відновлює типовий випадок недоставленої остаточної відповіді, лише якщо вона змістовна, початковий хід не був подією кімнати, політика надсилання не заборонила доставлення й відповідь до джерела ще не було надіслано. Відновлення обмежене однією повторною спробою; воно не зберігає синтетичний запит повторної спроби та виключає цю спробу з пакетного збирання, щоб вона не могла об’єднатися з непов’язаними запитами в черзі. Якщо повторна спроба також не доставляється або її неможливо поставити в чергу, OpenClaw доставляє лише очищене діагностичне повідомлення на кшталт «Я згенерував відповідь, але не зміг доставити її до цього чату. Спробуйте ще раз». Початковий приватний остаточний текст ніколи не позначається для автоматичного доставлення до джерела. Для моделей, які неодноразово не доставляють відповіді, використовуйте `"automatic"`, щоб остаточний хід асистента слугував шляхом видимої відповіді, перейдіть на потужнішу модель із викликом інструментів, перевірте докладний журнал Gateway на наявність зведення прихованого корисного навантаження або задайте `messages.groupChat.visibleReplies: "automatic"`, щоб використовувати видимі остаточні відповіді для кожного запиту групи/каналу.

Якщо інструмент повідомлень недоступний за активною політикою інструментів, OpenClaw переходить на автоматичні видимі відповіді замість мовчазного приховування відповіді. `openclaw doctor` попереджає про цю невідповідність.

Це правило застосовується до звичайного остаточного тексту агента. Прив’язки розмов, якими володіє Plugin, використовують повернену відповідь власного Plugin як видиму відповідь для ходів заявленої прив’язаної гілки; Plugin не потрібно викликати `message(action=send)` для таких відповідей прив’язки.

**Усунення несправностей: групова @згадка запускає індикатор набору тексту, після чого нічого не відбувається (без помилки)**

Ознака: @згадка в групі/каналі показує індикатор набору тексту, а журнал Gateway повідомляє `dispatch complete (queuedFinal=false, replies=0)`, але жодне повідомлення не з’являється в кімнаті. Особисті повідомлення тому самому агенту отримують відповіді як зазвичай.

Причина: режим видимих відповідей групи/каналу визначається як `"message_tool"`, тому OpenClaw виконує цикл, але приховує фінальний текст асистента, якщо агент не викликає `message(action=send)`. У цьому режимі немає контракту `NO_REPLY`; якщо інструмент повідомлень не викликано, початковий фінальний текст залишається приватним. Для змістовних вхідних звернень OpenClaw тепер виконує одну захищену повторну спробу відновлення; короткі нотатки, явна вказівка мовчати, події кімнати, цикли з відхиленням політикою надсилання та вже доставлені цикли повторно не виконуються. Звичайні цикли груп і каналів типово використовують `"automatic"`, тому цей симптом з’являється лише тоді, коли для `messages.groupChat.visibleReplies` (або глобального `messages.visibleReplies`) явно встановлено `"message_tool"`. Параметр середовища виконання `defaultVisibleReplies` тут не застосовується — механізм визначення групи/каналу його ігнорує; він впливає лише на прямі/вихідні чати (у такий спосіб середовище виконання Codex приховує фінальні відповіді прямих чатів).

Виправлення: виберіть модель, яка надійніше викликає інструменти, вилучіть явне перевизначення `"message_tool"`, щоб повернутися до типового значення `"automatic"`, або встановіть `messages.groupChat.visibleReplies: "automatic"`, щоб примусово вмикати видимі відповіді для кожного запиту групи/каналу. Змістовна фінальна відповідь, що не була доставлена, більше не має завершуватися мовчазним успіхом; вона має або відновитися завдяки одній повторній спробі `message(action=send)`, або показати очищене діагностичне повідомлення про помилку доставки. Gateway автоматично перезавантажує конфігурацію `messages` після збереження файлу; перезапускайте Gateway лише тоді, коли в розгортанні вимкнено спостереження за файлами або перезавантаження конфігурації.

**Типи згадок:**

- **Згадки в метаданих**: нативні @-згадки платформи. Ігноруються в режимі чату із самим собою у WhatsApp.
- **Текстові шаблони**: безпечні шаблони регулярних виразів у `agents.list[].groupChat.mentionPatterns`. Некоректні шаблони та небезпечні вкладені повторення ігноруються.
- Фільтрація за згадками застосовується лише тоді, коли їх можна виявити (нативні згадки або принаймні один шаблон).

```json5
{
  messages: {
    visibleReplies: "automatic", // примусово використовувати старі автоматичні фінальні відповіді для прямих/вихідних чатів
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // постійні повідомлення кімнати без згадок стають тихим контекстом
      visibleReplies: "message_tool", // явне ввімкнення; для видимих відповідей у кімнаті потрібен message(action=send)
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` задає глобальне типове значення. Канали можуть перевизначити його за допомогою `channels.<channel>.historyLimit` (або окремо для облікового запису). Щоб вимкнути, встановіть `0`.

`messages.groupChat.unmentionedInbound: "room_event"` передає постійні повідомлення групи/каналу без згадок як тихий контекст кімнати в підтримуваних каналах. Повідомлення зі згадками, команди та прямі повідомлення й надалі вважаються запитами користувача. Повні приклади для Discord, Slack і Telegram наведено в розділі [Фонові події кімнати](/uk/channels/ambient-room-events).

`messages.visibleReplies` є глобальним типовим значенням для вихідних подій; `messages.groupChat.visibleReplies` перевизначає його для вихідних подій групи/каналу. Якщо `messages.visibleReplies` не задано, прямі/вихідні чати використовують типове значення вибраного середовища виконання або середовища тестування, але внутрішні прямі цикли WebChat використовують автоматичну доставку фінальної відповіді для однакової поведінки запитів Pi/Codex. Установіть `messages.visibleReplies: "message_tool"`, щоб навмисно вимагати `message(action=send)` для видимого виведення. Списки дозволів каналів і фільтрація за згадками й надалі визначають, чи буде подію оброблено.

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

Порядок визначення: перевизначення для окремого приватного чату → типове значення постачальника → без обмеження (зберігається все).

Цей механізм визначення читає `channels.<provider>.dmHistoryLimit` і `channels.<provider>.dms.<id>.historyLimit` для будь-якого каналу, ключ сеансу якого відповідає стандартному формату `provider:direct:<id>` (або застарілому `provider:dm:<id>`), тому він працює як із вбудованими каналами, так і з каналами Plugin, а не лише з фіксованим переліком.

#### Режим чату із самим собою

Додайте власний номер до `allowFrom`, щоб увімкнути режим чату із самим собою (нативні @-згадки ігноруються, відповіді надсилаються лише на текстові шаблони):

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
    native: "auto", // реєструвати нативні команди, якщо вони підтримуються
    nativeSkills: "auto", // реєструвати нативні команди Skills, якщо вони підтримуються
    text: true, // розбирати /команди в повідомленнях чату
    bash: false, // дозволити ! (псевдонім: /bash)
    bashForegroundMs: 2000,
    config: false, // дозволити /config
    mcp: false, // дозволити /mcp
    plugins: false, // дозволити /plugins
    debug: false, // дозволити /debug
    restart: true, // дозволити /restart і зовнішні запити на перезапуск SIGUSR1
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

- Цей блок налаштовує інтерфейси команд. Поточний каталог вбудованих і комплектних команд див. у розділі [Команди зі скісною рискою](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, сполучення пристроїв `/pair`, пам’яті `/dreaming`, керування телефоном `/phone` і Talk `/voice`, задокументовано на сторінках відповідних каналів/Plugin, а також у розділі [Команди зі скісною рискою](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, але залишає їх вимкненими для Slack.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, але залишає їх вимкненими для Slack.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (логічне значення або `"auto"`). Для Discord параметр `false` пропускає реєстрацію та очищення нативних команд під час запуску.
- Перевизначайте реєстрацію нативних команд Skills для окремого каналу за допомогою `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові пункти меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для командної оболонки хоста. Потребує `tools.elevated.enabled` і наявності відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів Gateway `chat.send` постійний запис `/config set|unset` також потребує `operator.admin`; доступ лише для читання до `/config show` залишається доступним звичайним операторським клієнтам із дозволом на запис.
- `mcp: true` вмикає `/mcp` для конфігурації сервера MCP, яким керує OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для пошуку, встановлення, увімкнення та вимкнення Plugin.
- `channels.<provider>.configWrites` обмежує змінення конфігурації для окремого каналу (типово: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також обмежує операції запису, спрямовані на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і зовнішні запити на перезапуск `SIGUSR1`. Типове значення: `true`.
- `ownerAllowFrom` — це явний список дозволів власника для команд, доступних лише власнику, і дій каналу, обмежених власником. Він відокремлений від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системній підказці. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається окремо для кожного постачальника. Якщо його встановлено, він є **єдиним** джерелом авторизації (списки дозволів/сполучення каналів і `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, якщо `allowFrom` не встановлено.
- Мапа документації команд:
  - каталог вбудованих і комплектних команд: [Команди зі скісною рискою](/uk/tools/slash-commands)
  - інтерфейси команд окремих каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди сполучення: [Сполучення](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - сновидіння пам’яті: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язані матеріали

- [Довідник із конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
