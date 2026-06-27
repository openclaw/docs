---
read_when:
    - Налаштування Plugin каналу (автентифікація, контроль доступу, кілька облікових записів)
    - Усунення несправностей ключів конфігурації для окремих каналів
    - Аудит політики DM, групової політики або обмеження згадок
summary: 'Налаштування каналу: контроль доступу, сполучення, ключі для кожного каналу в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage тощо'
title: Конфігурація — канали
x-i18n:
    generated_at: "2026-06-27T17:31:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключі конфігурації для окремих каналів у `channels.*`. Охоплює доступ до DM і груп,
налаштування з кількома обліковими записами, обмеження за згадкою та ключі окремих каналів для Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage та інших вбудованих канальних plugins.

Для агентів, tools, runtime Gateway та інших ключів верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Канали

Кожен канал запускається автоматично, коли існує його розділ конфігурації (якщо не задано `enabled: false`).

### Доступ до DM і груп

Усі канали підтримують політики DM і групові політики:

| Політика DM         | Поведінка                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (типово)  | Невідомі відправники отримують одноразовий код сполучення; власник має схвалити |
| `allowlist`         | Лише відправники в `allowFrom` (або у сховищі дозволених сполучених відправників) |
| `open`              | Дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)           |
| `disabled`          | Ігнорувати всі вхідні DM                                        |

| Групова політика       | Поведінка                                               |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (типово)   | Лише групи, що відповідають налаштованому списку дозволених |
| `open`                 | Обійти списки дозволених груп (обмеження за згадкою все ще застосовується) |
| `disabled`             | Блокувати всі повідомлення груп/кімнат                 |

<Note>
`channels.defaults.groupPolicy` задає типове значення, коли `groupPolicy` провайдера не встановлено.
Коди сполучення спливають через 1 годину. Очікувані запити на сполучення DM обмежені **3 на канал**.
Якщо блок провайдера повністю відсутній (`channels.<provider>` відсутній), групова політика runtime повертається до `allowlist` (fail-closed) із попередженням під час запуску.
</Note>

### Перевизначення моделі каналу

Використовуйте `channels.modelByChannel`, щоб закріпити конкретні ID каналів або співрозмовників у direct-message за моделлю. Значення приймають `provider/model` або налаштовані псевдоніми моделей. Зіставлення каналу застосовується, коли сесія ще не має перевизначення моделі (наприклад, заданого через `/model`).

Для групових/потокових розмов ключами є специфічні для каналу ID груп, ID тем або назви каналів. Для розмов direct-message (DM) ключами є ідентифікатори співрозмовників, отримані з ідентичності відправника каналу (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` або `SenderId`). Точна форма ключа залежить від каналу:

| Канал    | Форма ключа DM     | Приклад                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | необроблений ID користувача | `123456789`                           |
| Discord  | необроблений ID користувача | `987654321`                           |
| WhatsApp | номер телефону або JID | `15551234567`                             |
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

Ключі, специфічні для DM, збігаються лише в розмовах direct-message; вони не впливають на маршрутизацію груп/потоків.

### Типові значення каналів і Heartbeat

Використовуйте `channels.defaults` для спільної групової політики та поведінки Heartbeat для різних провайдерів:

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
- `channels.defaults.contextVisibility`: типовий режим видимості додаткового контексту для всіх каналів. Значення: `all` (типово, включати весь цитований/потоковий/історичний контекст), `allowlist` (включати контекст лише від відправників зі списку дозволених), `allowlist_quote` (те саме, що allowlist, але зберігати явний контекст цитати/відповіді). Перевизначення для окремого каналу: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включати справні стани каналів у вивід Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включати погіршені/помилкові стани у вивід Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: рендерити компактний вивід Heartbeat у стилі індикатора.

### WhatsApp

WhatsApp працює через вебканал Gateway (Baileys Web). Він запускається автоматично, коли існує пов’язана сесія.

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

- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для WhatsApp DM і груп. Використовуйте прямий номер E.164 або JID групи WhatsApp у `match.peer.id`. Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

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
- Необов’язковий `channels.whatsapp.defaultAccount` перевизначає цей резервний вибір типового облікового запису, коли збігається з налаштованим ID облікового запису.
- Застарілий каталог автентифікації Baileys для одного облікового запису мігрується `openclaw doctor` у `whatsapp/default`.
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

- Токен бота: `channels.telegram.botToken` або `channels.telegram.tokenFile` (лише звичайний файл; симлінки відхиляються), з `TELEGRAM_BOT_TOKEN` як резервом для типового облікового запису.
- `apiRoot` є лише коренем Telegram Bot API. Використовуйте `https://api.telegram.org` або власний self-hosted/proxy корінь, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` видаляє випадковий завершальний суфікс `/bot<TOKEN>`.
- Необов’язковий `channels.telegram.defaultAccount` перевизначає вибір типового облікового запису, коли збігається з налаштованим ID облікового запису.
- У налаштуваннях із кількома обліковими записами (2+ ID облікових записів) задайте явний типовий (`channels.telegram.defaultAccount` або `channels.telegram.accounts.default`), щоб уникнути резервної маршрутизації; `openclaw doctor` попереджає, коли він відсутній або недійсний.
- `configWrites: false` блокує ініційовані Telegram записи конфігурації (міграції ID супергруп, `/config set|unset`).
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для тем форумів (використовуйте канонічний `chatId:topic:topicId` у `match.peer.id`). Семантика полів спільна в [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).
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

- Токен: `channels.discord.token`, з `DISCORD_BOT_TOKEN` як резервним варіантом для облікового запису за замовчуванням.
- Прямі вихідні виклики, які надають явний Discord `token`, використовують цей токен для виклику; параметри повторних спроб і політик облікового запису все одно беруться з вибраного облікового запису в активному знімку runtime.
- Необов’язковий `channels.discord.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли збігається з налаштованим ідентифікатором облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` (канал сервера) для цілей доставлення; голі числові ID відхиляються.
- Slug серверів мають бути в нижньому регістрі, а пробіли замінюються на `-`; ключі каналів використовують slug-назву (без `#`). Надавайте перевагу ID серверів.
- Повідомлення, створені ботами, стандартно ігноруються. `allowBots: true` вмикає їх; використовуйте `allowBots: "mentions"`, щоб приймати лише повідомлення ботів, які згадують бота (власні повідомлення все одно фільтруються).
- Канали, які підтримують вхідні повідомлення, створені ботами, можуть використовувати спільний [захист від bot loop](/uk/channels/bot-loop-protection). Задайте `channels.defaults.botLoopProtection` для базових бюджетів пар, а потім перевизначайте канал або обліковий запис лише тоді, коли окрема поверхня потребує інших обмежень.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (і перевизначення каналів) відкидає повідомлення, які згадують іншого користувача або роль, але не бота (за винятком @everyone/@here).
- `channels.discord.mentionAliases` зіставляє стабільний вихідний текст `@handle` з ID користувачів Discord перед надсиланням, щоб відомих учасників команди можна було згадувати детерміновано навіть тоді, коли тимчасовий кеш каталогу порожній. Перевизначення для окремих облікових записів містяться в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (стандартно 17) розбиває високі повідомлення, навіть коли вони коротші за 2000 символів.
- `channels.discord.suppressEmbeds` стандартно має значення `true`, тому вихідні URL не розгортаються в Discord-попередні перегляди посилань, якщо це не вимкнено. Явні корисні навантаження `embeds` усе одно надсилаються звичайно; виклики інструментів для окремих повідомлень можуть перевизначати це через `suppressEmbeds`.
- `channels.discord.threadBindings` керує прив’язаною до тредів маршрутизацією Discord:
  - `enabled`: перевизначення Discord для функцій сесій, прив’язаних до тредів (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а також прив’язане доставлення й маршрутизація)
  - `idleHours`: перевизначення Discord для автоматичного зняття фокуса після неактивності в годинах (`0` вимикає)
  - `maxAgeHours`: перевизначення Discord для жорсткого максимального віку в годинах (`0` вимикає)
  - `spawnSessions`: перемикач для `sessions_spawn({ thread: true })` і автоматичного створення/прив’язування тредів під час ACP thread-spawn (стандартно: `true`)
  - `defaultSpawnContext`: нативний контекст субагента для прив’язаних до тредів запусків (стандартно `"fork"`)
- Записи верхнього рівня `bindings[]` з `type: "acp"` налаштовують постійні прив’язки ACP для каналів і тредів (використовуйте ID каналу/треду в `match.peer.id`). Семантика полів спільна в [ACP Agents](/uk/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задає акцентний колір для контейнерів компонентів Discord v2.
- `channels.discord.agentComponents.ttlMs` керує тим, як довго надіслані callback-компоненти Discord залишаються зареєстрованими. Стандартне значення — `1800000` (30 хвилин), максимум — `86400000` (24 години), а перевизначення для окремих облікових записів містяться в `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Довші значення довше зберігають придатність старих кнопок/селектів/форм, тому надавайте перевагу найкоротшому TTL, який підходить для робочого процесу.
- `channels.discord.voice` вмикає розмови в голосових каналах Discord і необов’язкові перевизначення auto-join + LLM + TTS. Текстові конфігурації Discord стандартно залишають голос вимкненим; задайте `channels.discord.voice.enabled=true`, щоб увімкнути його.
- `channels.discord.voice.model` необов’язково перевизначає модель LLM, яку використовують для відповідей у голосових каналах Discord.
- `channels.discord.voice.daveEncryption` і `channels.discord.voice.decryptionFailureTolerance` передаються до параметрів DAVE `@discordjs/voice` (`true` і `24` стандартно).
- `channels.discord.voice.connectTimeoutMs` керує початковим очікуванням Ready у `@discordjs/voice` для `/vc join` і спроб auto-join (`30000` стандартно).
- `channels.discord.voice.reconnectGraceMs` керує тим, скільки часу від’єднана голосова сесія може витратити на перехід до сигналізації повторного з’єднання, перш ніж OpenClaw її знищить (`15000` стандартно).
- Відтворення голосу Discord не переривається подією початку мовлення іншого користувача. Щоб уникнути петель зворотного зв’язку, OpenClaw ігнорує нове захоплення голосу, доки відтворюється TTS.
- OpenClaw додатково намагається відновити приймання голосу, виходячи з голосової сесії та повторно приєднуючись до неї після повторюваних збоїв дешифрування.
- `channels.discord.streaming` — канонічний ключ режиму потоку. Discord стандартно використовує `streaming.mode: "progress"`, щоб прогрес інструментів/роботи з’являвся в одному редагованому повідомленні попереднього перегляду; задайте `streaming.mode: "off"`, щоб вимкнути це. Застарілі значення `streamMode` і булеві значення `streaming` залишаються runtime-псевдонімами; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `channels.discord.autoPresence` зіставляє доступність runtime із присутністю бота (healthy => online, degraded => idle, exhausted => dnd) і дозволяє необов’язкові перевизначення тексту статусу.
- `channels.discord.dangerouslyAllowNameMatching` повторно вмикає зіставлення за змінюваним іменем/тегом (режим сумісності для аварійного обходу).
- `channels.discord.execApprovals`: нативне для Discord доставлення схвалень exec і авторизація схвалювачів.
  - `enabled`: `true`, `false` або `"auto"` (стандартно). В автоматичному режимі схвалення exec активуються, коли схвалювачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ID користувачів Discord, яким дозволено схвалювати запити exec. Якщо пропущено, використовується резервний `commands.ownerAllowFrom`.
  - `agentFilter`: необов’язковий allowlist ID агентів. Пропустіть, щоб пересилати схвалення для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на схвалення. `"dm"` (стандартно) надсилає в DM схвалювачів, `"channel"` надсилає в початковий канал, `"both"` надсилає в обидва місця. Коли ціль містить `"channel"`, кнопками можуть користуватися лише визначені схвалювачі.
  - `cleanupAfterResolve`: коли `true`, видаляє DM зі схваленнями після схвалення, відхилення або тайм-ауту.

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

- JSON сервісного облікового запису: вбудований (`serviceAccount`) або файловий (`serviceAccountFile`).
- SecretRef сервісного облікового запису також підтримується (`serviceAccountRef`).
- Резервні значення env: `GOOGLE_CHAT_SERVICE_ACCOUNT` або `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Використовуйте `spaces/<spaceId>` або `users/<userId>` для цілей доставлення.
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

- **Режим Socket** потребує і `botToken`, і `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного env стандартного облікового запису).
- **Режим HTTP** потребує `botToken` плюс `signingSecret` (у корені або для кожного облікового запису).
- `socketMode` передає налаштування транспорту Slack SDK Socket Mode до публічного API приймача Bolt. Використовуйте це лише під час дослідження тайм-аутів ping/pong або застарілої поведінки websocket. `clientPingTimeout` за замовчуванням має значення `15000`; `serverPingTimeout` і `pingPongLoggingEnabled` передаються лише коли налаштовані.
- `botToken`, `appToken`, `signingSecret` і `userToken` приймають відкриті
  рядки або об’єкти SecretRef.
- Знімки облікових записів Slack показують поля джерела/стану для кожних облікових даних, як-от
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` і, у режимі HTTP,
  `signingSecretStatus`. `configured_unavailable` означає, що обліковий запис
  налаштовано через SecretRef, але поточний шлях команди/середовища виконання не зміг
  отримати значення секрету.
- `configWrites: false` блокує записи конфігурації, ініційовані Slack.
- Необов’язковий `channels.slack.defaultAccount` перевизначає вибір стандартного облікового запису, коли збігається з налаштованим ідентифікатором облікового запису.
- `channels.slack.streaming.mode` — канонічний ключ режиму потоку Slack. `channels.slack.streaming.nativeTransport` керує нативним потоковим транспортом Slack. Застарілі значення `streamMode`, булевий `streaming` і `nativeStreaming` залишаються runtime-псевдонімами; запустіть `openclaw doctor --fix`, щоб переписати збережену конфігурацію.
- `unfurlLinks` і `unfurlMedia` передають булеві параметри розгортання посилань і медіа Slack `chat.postMessage` для відповідей бота. `unfurlLinks` за замовчуванням має значення `false`, щоб вихідні посилання бота не розгорталися inline, якщо це не ввімкнено; `unfurlMedia` пропускається, якщо не налаштовано. Задайте будь-яке значення в `channels.slack.accounts.<accountId>`, щоб перевизначити значення верхнього рівня для одного облікового запису.
- Використовуйте `user:<id>` (DM) або `channel:<id>` для цілей доставки.

**Режими сповіщень про реакції:** `off`, `own` (стандартно), `all`, `allowlist` (з `reactionAllowlist`).

**Ізоляція сесій потоку:** `thread.historyScope` є окремим для кожного потоку (стандартно) або спільним для каналу. `thread.inheritParent` копіює транскрипт батьківського каналу в нові потоки.

- Нативний стримінг Slack плюс статус потоку Slack у стилі асистента «is typing...» потребують цілі потоку відповіді. DM верхнього рівня за замовчуванням лишаються поза потоком, тому вони все ще можуть стримити через Slack-перегляди чернетки з публікацією та редагуванням замість показу нативного попереднього перегляду потоку/статусу в стилі потоку.
- `typingReaction` додає тимчасову реакцію до вхідного повідомлення Slack, доки виконується відповідь, а потім видаляє її після завершення. Використовуйте shortcode емодзі Slack, як-от `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-нативна доставка клієнта схвалення та авторизація затверджувача exec. Та сама схема, що й у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ідентифікатори користувачів Slack), `agentFilter`, `sessionFilter` і `target` (`"dm"`, `"channel"` або `"both"`). Схвалення Plugin можуть використовувати цей шлях нативного клієнта для запитів зі Slack, коли затверджувачі Plugin Slack розв’язуються; Slack-нативну доставку схвалень Plugin також можна ввімкнути через `approvals.plugin` для сесій зі Slack або цілей Slack. Схвалення Plugin використовують затверджувачів Plugin Slack з `allowFrom` і стандартну маршрутизацію, а не затверджувачів exec.

| Група дій | Стандартно | Примітки                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | Реакції + список реакцій |
| messages     | enabled | Читати/надсилати/редагувати/видаляти  |
| pins         | enabled | Закріпити/відкріпити/список         |
| memberInfo   | enabled | Інформація про учасника            |
| emojiList    | enabled | Список користувацьких емодзі      |

### Mattermost

Mattermost постачається як вбудований Plugin у поточних релізах OpenClaw. Старіші або
кастомні збірки можуть встановити поточний npm-пакет за допомогою
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

Режими чату: `oncall` (відповідати на @-згадку, стандартно), `onmessage` (кожне повідомлення), `onchar` (повідомлення, що починаються з префікса-тригера).

Коли нативні команди Mattermost увімкнені:

- `commands.callbackPath` має бути шляхом (наприклад `/api/channels/mattermost/command`), а не повною URL-адресою.
- `commands.callbackUrl` має розв’язуватися в endpoint Gateway OpenClaw і бути доступним із сервера Mattermost.
- Нативні slash callbacks автентифікуються токенами кожної команди, які повертає
  Mattermost під час реєстрації slash command. Якщо реєстрація не вдалася або жодні
  команди не активовано, OpenClaw відхиляє callbacks із
  `Unauthorized: invalid command token.`
- Для приватних/tailnet/внутрішніх хостів callback Mattermost може вимагати,
  щоб `ServiceSettings.AllowedUntrustedInternalConnections` містив хост/домен callback.
  Використовуйте значення хоста/домену, а не повні URL-адреси.
- `channels.mattermost.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Mattermost.
- `channels.mattermost.requireMention`: вимагати `@mention` перед відповіддю в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: перевизначення mention-gating для каналу (`"*"` для стандартного значення).
- Необов’язковий `channels.mattermost.defaultAccount` перевизначає вибір стандартного облікового запису, коли збігається з налаштованим ідентифікатором облікового запису.

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

**Режими сповіщень про реакції:** `off`, `own` (стандартно), `all`, `allowlist` (з `reactionAllowlist`).

- `channels.signal.account`: прив’язати запуск каналу до конкретної ідентичності облікового запису Signal.
- `channels.signal.configWrites`: дозволити або заборонити записи конфігурації, ініційовані Signal.
- Необов’язковий `channels.signal.defaultAccount` перевизначає вибір стандартного облікового запису, коли збігається з налаштованим ідентифікатором облікового запису.

### iMessage

OpenClaw запускає `imsg rpc` (JSON-RPC через stdio). Daemon або порт не потрібні. Це рекомендований шлях для нових налаштувань OpenClaw iMessage, коли хост може надати дозволи до бази даних Messages і Automation.

Підтримку BlueBubbles видалено. `channels.bluebubbles` не є підтримуваною runtime-поверхнею конфігурації в поточному OpenClaw. Перенесіть старі конфігурації до `channels.imessage`; використовуйте [Видалення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) для короткої версії та [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) для повної таблиці перекладу.

Якщо Gateway не працює на Mac із виконаним входом у Messages, залиште `channels.imessage.enabled=true` і задайте `channels.imessage.cliPath` як SSH-обгортку, що запускає `imsg "$@"` на цьому Mac. Стандартний локальний шлях `imsg` працює лише на macOS.

Перед тим як покладатися на SSH-обгортку для production-надсилань, перевірте вихідний `imsg send` саме через цю обгортку. Деякі стани macOS TCC призначають Messages Automation для `/usr/libexec/sshd-keygen-wrapper`, через що читання й probes можуть працювати, а надсилання завершуватися помилкою AppleEvents `-1743`; див. [Надсилання через SSH-обгортку завершується помилкою AppleEvents -1743](/uk/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- Необов’язковий `channels.imessage.defaultAccount` перевизначає вибір стандартного облікового запису, коли збігається з налаштованим ідентифікатором облікового запису.

- Потребує Full Disk Access до Messages DB.
- Надавайте перевагу цілям `chat_id:<id>`. Використовуйте `imsg chats --limit 20`, щоб перелічити чати.
- `cliPath` може вказувати на SSH-обгортку; задайте `remoteHost` (`host` або `user@host`) для отримання вкладень через SCP.
- `attachmentRoots` і `remoteAttachmentRoots` обмежують шляхи вхідних вкладень (стандартно: `/Users/*/Library/Messages/Attachments`).
- SCP використовує сувору перевірку host-key, тому переконайтеся, що ключ relay-хоста вже існує в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: дозволити або заборонити записи конфігурації, ініційовані iMessage.
- `channels.imessage.sendTransport`: бажаний транспорт надсилання RPC `imsg` для звичайних вихідних відповідей. `auto` (стандартно) використовує міст IMCore для наявних чатів, коли він працює, а потім повертається до AppleScript; `bridge` потребує доставки через private API; `applescript` примусово використовує публічний шлях автоматизації Messages.
- `channels.imessage.actions.*`: увімкнути дії private API, які також обмежуються `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` за замовчуванням вимкнено; задайте `true`, перш ніж очікувати вхідні медіа в agent turns.
- Відновлення вхідних повідомлень після перезапуску bridge/gateway відбувається автоматично (GUID dedupe плюс обмеження віку застарілого backlog). Наявні конфігурації `channels.imessage.catchup.enabled: true` усе ще підтримуються як застарілий профіль сумісності.
- `channels.imessage.groups`: реєстр груп і налаштування для кожної групи. З `groupPolicy: "allowlist"` налаштуйте або явні ключі `chat_id`, або wildcard-запис `"*"`, щоб групові повідомлення могли пройти gate реєстру.
- Записи верхнього рівня `bindings[]` з `type: "acp"` можуть прив’язувати розмови iMessage до постійних сесій ACP. Використовуйте нормалізований handle або явну ціль чату (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) у `match.peer.id`. Семантика спільних полів: [Агенти ACP](/uk/tools/acp-agents#persistent-channel-bindings).

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
- `channels.matrix.proxy` маршрутизує HTTP-трафік Matrix через явний HTTP(S)-проксі. Іменовані облікові записи можуть перевизначити це за допомогою `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` дозволяє приватні/внутрішні homeserver-и. `proxy` і ця мережева згода є незалежними елементами керування.
- `channels.matrix.defaultAccount` вибирає бажаний обліковий запис у конфігураціях із кількома обліковими записами.
- `channels.matrix.autoJoin` за замовчуванням має значення `off`, тому запрошені кімнати й нові запрошення у стилі DM ігноруються, доки ви не задасте `autoJoin: "allowlist"` з `autoJoinAllowlist` або `autoJoin: "always"`.
- `channels.matrix.execApprovals`: доставлення підтверджень exec у нативному форматі Matrix і авторизація затверджувачів.
  - `enabled`: `true`, `false` або `"auto"` (за замовчуванням). В автоматичному режимі підтвердження exec активуються, коли затверджувачів можна визначити з `approvers` або `commands.ownerAllowFrom`.
  - `approvers`: ідентифікатори користувачів Matrix (наприклад, `@owner:example.org`), яким дозволено затверджувати exec-запити.
  - `agentFilter`: необов’язковий allowlist ідентифікаторів агентів. Опустіть, щоб пересилати підтвердження для всіх агентів.
  - `sessionFilter`: необов’язкові шаблони ключів сесій (підрядок або regex).
  - `target`: куди надсилати запити на підтвердження. `"dm"` (за замовчуванням), `"channel"` (початкова кімната) або `"both"`.
  - Перевизначення для кожного облікового запису: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` керує тим, як DM-и Matrix групуються в сесії: `per-user` (за замовчуванням) спільно використовує сесію за маршрутизованим співрозмовником, тоді як `per-room` ізолює кожну DM-кімнату.
- Перевірки стану Matrix і live-пошуки в каталозі використовують ту саму політику проксі, що й трафік runtime.
- Повна конфігурація Matrix, правила таргетингу й приклади налаштування задокументовані в [Matrix](/uk/channels/matrix).

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
- Повна конфігурація Teams (облікові дані, webhook, політика DM/груп, перевизначення для команд і каналів) задокументована в [Microsoft Teams](/uk/channels/msteams).

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
- Необов’язковий `channels.irc.defaultAccount` перевизначає вибір облікового запису за замовчуванням, коли збігається з налаштованим ідентифікатором облікового запису.
- Повна конфігурація каналу IRC (хост/порт/TLS/канали/allowlist-и/обмеження за згадками) задокументована в [IRC](/uk/channels/irc).

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
- Токени env застосовуються лише до облікового запису **default**.
- Базові налаштування каналу застосовуються до всіх облікових записів, якщо їх не перевизначено для конкретного облікового запису.
- Використовуйте `bindings[].match.accountId`, щоб маршрутизувати кожен обліковий запис до іншого агента.
- Якщо ви додаєте обліковий запис не за замовчуванням через `openclaw channels add` (або onboarding каналу), усе ще маючи однорівневу конфігурацію каналу з одним обліковим записом, OpenClaw спершу переносить значення верхнього рівня одного облікового запису, що належать до облікового запису, у мапу облікових записів каналу, щоб початковий обліковий запис продовжував працювати. Більшість каналів переносять їх у `channels.<channel>.accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/стандартну ціль.
- Наявні прив’язки лише до каналу (без `accountId`) і далі відповідають обліковому запису за замовчуванням; прив’язки з областю облікового запису залишаються необов’язковими.
- `openclaw doctor --fix` також виправляє змішані форми, переносячи значення верхнього рівня одного облікового запису, що належать до облікового запису, у підвищений обліковий запис, вибраний для цього каналу. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/стандартну ціль.

### Інші канали Plugin

Багато каналів Plugin налаштовуються як `channels.<id>` і задокументовані на своїх окремих сторінках каналів (наприклад Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat і Twitch).
Дивіться повний індекс каналів: [Канали](/uk/channels).

### Обмеження групового чату за згадками

Групові повідомлення за замовчуванням **вимагають згадки** (згадка в метаданих або безпечні regex-шаблони). Застосовується до групових чатів WhatsApp, Telegram, Discord, Google Chat та iMessage.

Видимі відповіді керуються окремо. Звичайні групові, канальні та внутрішні прямі запити WebChat за замовчуванням використовують автоматичне фінальне доставлення: фінальний текст помічника надсилається через застарілий шлях видимої відповіді. Увімкніть `messages.visibleReplies: "message_tool"` або `messages.groupChat.visibleReplies: "message_tool"`, коли видимий вивід має публікуватися лише після того, як агент викличе `message(action=send)`. Якщо модель повертає фінальний текст без виклику інструмента повідомлень у ввімкненому режимі лише інструмента, цей фінальний текст залишається приватним, а докладний журнал gateway записує метадані приглушеного payload.

Видимі відповіді лише через інструмент потребують моделі/runtime, що надійно викликає інструменти, і рекомендовані для спільних фонових кімнат на моделях найновішого покоління, як-от GPT 5.5. Деякі слабші моделі можуть відповідати фінальним текстом, але не розуміють, що вивід, видимий у джерелі, потрібно надсилати через `message(action=send)`. Для таких моделей використовуйте `"automatic"`, щоб фінальний хід помічника був шляхом видимої відповіді. Якщо журнал сесії показує текст помічника з `didSendViaMessagingTool: false`, модель створила приватний фінальний текст замість виклику інструмента повідомлень. Перемкніться на сильнішу модель із викликом інструментів для цього каналу, перегляньте докладний журнал gateway для зведення приглушеного payload або задайте `messages.groupChat.visibleReplies: "automatic"`, щоб використовувати видимі фінальні відповіді для кожного групового/канального запиту.

Якщо інструмент повідомлень недоступний за активної політики інструментів, OpenClaw повертається до автоматичних видимих відповідей замість тихого приглушення відповіді. `openclaw doctor` попереджає про цю невідповідність.

Це правило застосовується до звичайного фінального тексту агента. Прив’язки розмов, якими володіє Plugin, використовують відповідь, повернену Plugin-власником, як видиму відповідь для заявлених ходів прив’язаного потоку; Plugin не має викликати `message(action=send)` для таких відповідей прив’язки.

**Усунення несправностей: групова @згадка запускає індикатор набору, а потім тиша (без помилки)**

Симптом: групова/канальна @згадка показує індикатор набору, а журнал gateway повідомляє `dispatch complete (queuedFinal=false, replies=0)`, але жодне повідомлення не надходить у кімнату. DM-и до того самого агента відповідають нормально.

Причина: режим видимої відповіді для групи/каналу визначається як `"message_tool"`, тому OpenClaw виконує хід, але приглушує фінальний текст помічника, якщо агент не викликає `message(action=send)`. У цьому режимі немає контракту `NO_REPLY`; відсутність виклику інструмента повідомлень означає відсутність відповіді в джерелі. Помилки немає, бо приглушення є налаштованою поведінкою. Звичайні групові та канальні ходи за замовчуванням мають `"automatic"`, тому цей симптом з’являється лише тоді, коли `messages.groupChat.visibleReplies` (або глобальний `messages.visibleReplies`) явно задано як `"message_tool"`. Harness `defaultVisibleReplies` тут не застосовується — resolver групи/каналу його ігнорує; він впливає лише на прямі/джерельні чати (harness Codex приглушує фінальні відповіді прямих чатів саме так).

Виправлення: або виберіть сильнішу модель із викликом інструментів, або приберіть явне перевизначення `"message_tool"`, щоб повернутися до стандартного `"automatic"`, або задайте `messages.groupChat.visibleReplies: "automatic"`, щоб примусово вмикати видимі відповіді для кожного групового/канального запиту. Gateway гаряче перезавантажує конфігурацію `messages` після збереження файла; перезапускайте gateway лише тоді, коли відстеження файлів або перезавантаження конфігурації вимкнено в розгортанні.

**Типи згадок:**

- **Згадки метаданих**: нативні @згадки платформи. Ігноруються в режимі self-chat WhatsApp.
- **Текстові шаблони**: безпечні regex-шаблони в `agents.list[].groupChat.mentionPatterns`. Недійсні шаблони й небезпечне вкладене повторення ігноруються.
- Обмеження за згадками застосовується лише тоді, коли виявлення можливе (нативні згадки або принаймні один шаблон).

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

`messages.groupChat.historyLimit` задає глобальне значення за замовчуванням. Канали можуть перевизначити його через `channels.<channel>.historyLimit` (або для кожного облікового запису). Задайте `0`, щоб вимкнути.

`messages.groupChat.unmentionedInbound: "room_event"` передає незгадані постійно ввімкнені групові/канальні повідомлення як тихий контекст кімнати в підтримуваних каналах. Згадані повідомлення, команди й прямі повідомлення залишаються запитами користувача. Дивіться [Фонові події кімнати](/uk/channels/ambient-room-events) для повних прикладів Discord, Slack і Telegram.

`messages.visibleReplies` є глобальним стандартом для source-event; `messages.groupChat.visibleReplies` перевизначає його для group/channel source events. Коли `messages.visibleReplies` не задано, прямі/source-чати використовують вибране значення runtime або стандарт harness, але внутрішні прямі ходи WebChat використовують автоматичне фінальне доставлення для паритету промптів Pi/Codex. Задайте `messages.visibleReplies: "message_tool"`, щоб навмисно вимагати `message(action=send)` для видимого виводу. Channel allowlist-и й обмеження за згадками й далі вирішують, чи обробляється подія.

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

Визначення: перевизначення для конкретного DM → стандарт provider → без ліміту (зберігається все).

Підтримується: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Додайте власний номер у `allowFrom`, щоб увімкнути режим self-chat (ігнорує нативні @згадки, відповідає лише на текстові шаблони):

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

- Цей блок налаштовує поверхні команд. Поточний вбудований + комплектний каталог команд див. у [Слеш-командах](/uk/tools/slash-commands).
- Ця сторінка є **довідником ключів конфігурації**, а не повним каталогом команд. Команди, що належать каналам/Plugin, як-от QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` і Talk `/voice`, задокументовано на сторінках їхніх каналів/Plugin, а також у [Слеш-командах](/uk/tools/slash-commands).
- Текстові команди мають бути **окремими** повідомленнями з початковим `/`.
- `native: "auto"` вмикає нативні команди для Discord/Telegram, а Slack залишає вимкненим.
- `nativeSkills: "auto"` вмикає нативні команди Skills для Discord/Telegram, а Slack залишає вимкненим.
- Перевизначення для окремого каналу: `channels.discord.commands.native` (bool або `"auto"`). Для Discord значення `false` пропускає реєстрацію та очищення нативних команд під час запуску.
- Перевизначте реєстрацію нативних Skills для окремого каналу за допомогою `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` додає додаткові записи меню бота Telegram.
- `bash: true` вмикає `! <cmd>` для оболонки хоста. Потребує `tools.elevated.enabled` і відправника в `tools.elevated.allowFrom.<channel>`.
- `config: true` вмикає `/config` (читає/записує `openclaw.json`). Для клієнтів Gateway `chat.send` постійні записи `/config set|unset` також потребують `operator.admin`; `/config show` лише для читання залишається доступною для звичайних операторських клієнтів з областю запису.
- `mcp: true` вмикає `/mcp` для конфігурації MCP-сервера, яким керує OpenClaw, у `mcp.servers`.
- `plugins: true` вмикає `/plugins` для виявлення Plugin, встановлення та елементів керування ввімкненням/вимкненням.
- `channels.<provider>.configWrites` обмежує мутації конфігурації для окремого каналу (типово: true).
- Для каналів із кількома обліковими записами `channels.<provider>.accounts.<id>.configWrites` також обмежує записи, націлені на цей обліковий запис (наприклад, `/allowlist --config --account <id>` або `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` вимикає `/restart` і дії інструмента перезапуску Gateway. Типово: `true`.
- `ownerAllowFrom` — це явний allowlist власників для команд лише для власників і дій каналів, обмежених власником. Він окремий від `allowFrom`.
- `ownerDisplay: "hash"` хешує ідентифікатори власників у системному промпті. Установіть `ownerDisplaySecret`, щоб керувати хешуванням.
- `allowFrom` задається для кожного провайдера. Якщо встановлено, це **єдине** джерело авторизації (allowlist каналів/створення пари та `useAccessGroups` ігноруються).
- `useAccessGroups: false` дозволяє командам обходити політики груп доступу, коли `allowFrom` не встановлено.
- Мапа документації команд:
  - вбудований + комплектний каталог: [Слеш-команди](/uk/tools/slash-commands)
  - поверхні команд для окремих каналів: [Канали](/uk/channels)
  - команди QQ Bot: [QQ Bot](/uk/channels/qqbot)
  - команди створення пари: [Створення пари](/uk/channels/pairing)
  - команда картки LINE: [LINE](/uk/channels/line)
  - memory dreaming: [Dreaming](/uk/concepts/dreaming)

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Огляд каналів](/uk/channels)
