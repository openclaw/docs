---
read_when:
    - Настройка Plugin канала (аутентификация, контроль доступа, несколько учетных записей)
    - Устранение неполадок с ключами конфигурации для отдельных каналов
    - Аудит политики DM, политики групп или ограничения по упоминанию
summary: 'Конфигурация канала: контроль доступа, сопряжение, ключи для каждого канала в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и других каналах'
title: Конфигурация — каналы
x-i18n:
    generated_at: "2026-06-28T22:55:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключи конфигурации отдельных каналов в `channels.*`. Охватывает доступ к личным сообщениям и группам,
настройки нескольких аккаунтов, фильтрацию по упоминаниям и ключи отдельных каналов для Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage и других встроенных канальных Plugin.

Для агентов, инструментов, среды выполнения Gateway и других ключей верхнего уровня см.
[Справочник по конфигурации](/ru/gateway/configuration-reference).

## Каналы

Каждый канал запускается автоматически, когда существует его раздел конфигурации (если не задано `enabled: false`).

### Доступ к личным сообщениям и группам

Все каналы поддерживают политики личных сообщений и групповые политики:

| Политика личных сообщений | Поведение                                                            |
| ------------------------- | -------------------------------------------------------------------- |
| `pairing` (по умолчанию)  | Неизвестные отправители получают одноразовый код привязки; владелец должен одобрить |
| `allowlist`               | Только отправители из `allowFrom` (или из хранилища разрешенных привязок) |
| `open`                    | Разрешить все входящие личные сообщения (требует `allowFrom: ["*"]`) |
| `disabled`                | Игнорировать все входящие личные сообщения                           |

| Групповая политика          | Поведение                                                   |
| --------------------------- | ----------------------------------------------------------- |
| `allowlist` (по умолчанию)  | Только группы, соответствующие настроенному списку разрешений |
| `open`                      | Обходить списки разрешений групп (фильтрация по упоминаниям все равно применяется) |
| `disabled`                  | Блокировать все сообщения групп/комнат                      |

<Note>
`channels.defaults.groupPolicy` задает значение по умолчанию, когда `groupPolicy` поставщика не задан.
Срок действия кодов привязки истекает через 1 час. Ожидающие запросы привязки личных сообщений ограничены **3 на канал**.
Если блок поставщика полностью отсутствует (`channels.<provider>` отсутствует), групповая политика среды выполнения возвращается к `allowlist` (закрытие при сбое) с предупреждением при запуске.
</Note>

### Переопределения модели канала

Используйте `channels.modelByChannel`, чтобы закрепить определенные идентификаторы каналов или собеседников личных сообщений за моделью. Значения принимают `provider/model` или настроенные псевдонимы моделей. Сопоставление каналов применяется, когда у сессии еще нет переопределения модели (например, заданного через `/model`).

Для групповых бесед и тем ключами являются идентификаторы групп, идентификаторы тем или имена каналов, специфичные для канала. Для бесед в личных сообщениях ключами являются идентификаторы собеседников, полученные из личности отправителя канала (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` или `SenderId`). Точная форма ключа зависит от канала:

| Канал    | Форма ключа личных сообщений | Пример                                       |
| -------- | ---------------------------- | -------------------------------------------- |
| Slack    | `user:U...`                  | `user:U12345`                                |
| Telegram | необработанный ID пользователя | `123456789`                                  |
| Discord  | необработанный ID пользователя | `987654321`                                  |
| WhatsApp | номер телефона или JID       | `15551234567`                                |
| Matrix   | ID пользователя Matrix       | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`              | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

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

Ключи, специфичные для личных сообщений, совпадают только в беседах личных сообщений; они не влияют на маршрутизацию групп/тем.

### Значения по умолчанию канала и Heartbeat

Используйте `channels.defaults` для общего поведения групповой политики и Heartbeat у разных поставщиков:

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

- `channels.defaults.groupPolicy`: резервная групповая политика, когда `groupPolicy` на уровне поставщика не задана.
- `channels.defaults.contextVisibility`: режим видимости дополнительного контекста по умолчанию для всех каналов. Значения: `all` (по умолчанию, включает весь контекст цитат/тем/истории), `allowlist` (включает контекст только от разрешенных отправителей), `allowlist_quote` (то же, что allowlist, но сохраняет явный контекст цитаты/ответа). Переопределение для канала: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включать исправные статусы каналов в вывод Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включать ухудшенные статусы и ошибки в вывод Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: отображать компактный вывод Heartbeat в стиле индикатора.

### WhatsApp

WhatsApp работает через веб-канал Gateway (Baileys Web). Он запускается автоматически, когда существует связанная сессия.

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

- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для личных сообщений и групп WhatsApp. Используйте прямой номер E.164 или JID группы WhatsApp в `match.peer.id`. Семантика полей общая и описана в [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Несколько аккаунтов WhatsApp">

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

- Исходящие команды по умолчанию используют аккаунт `default`, если он есть; иначе первый настроенный идентификатор аккаунта (после сортировки).
- Необязательный `channels.whatsapp.defaultAccount` переопределяет этот резервный выбор аккаунта по умолчанию, когда совпадает с настроенным идентификатором аккаунта.
- Устаревший каталог аутентификации Baileys для одного аккаунта мигрируется `openclaw doctor` в `whatsapp/default`.
- Переопределения для аккаунта: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Токен бота: `channels.telegram.botToken` или `channels.telegram.tokenFile` (только обычный файл; символические ссылки отклоняются), с `TELEGRAM_BOT_TOKEN` как резервным вариантом для аккаунта по умолчанию.
- `apiRoot` — это только корень Telegram Bot API. Используйте `https://api.telegram.org` или собственный размещенный/прокси-корень, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` удаляет случайный завершающий суффикс `/bot<TOKEN>`.
- Необязательный `channels.telegram.defaultAccount` переопределяет выбор аккаунта по умолчанию, когда совпадает с настроенным идентификатором аккаунта.
- В настройках с несколькими аккаунтами (2+ идентификатора аккаунтов) задайте явное значение по умолчанию (`channels.telegram.defaultAccount` или `channels.telegram.accounts.default`), чтобы избежать резервной маршрутизации; `openclaw doctor` предупреждает, когда оно отсутствует или недействительно.
- `configWrites: false` блокирует записи конфигурации, инициированные Telegram (миграции ID супергрупп, `/config set|unset`).
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для тем форумов (используйте канонический `chatId:topic:topicId` в `match.peer.id`). Семантика полей общая и описана в [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).
- Предпросмотры потоковой передачи Telegram используют `sendMessage` + `editMessageText` (работает в личных и групповых чатах).
- Политика повторных попыток: см. [Политика повторных попыток](/ru/concepts/retry).

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

- Токен: `channels.discord.token`, с `DISCORD_BOT_TOKEN` как резервным вариантом для учетной записи по умолчанию.
- Прямые исходящие вызовы, которые передают явный `token` Discord, используют этот токен для вызова; настройки повторных попыток и политик учетной записи по-прежнему берутся из выбранной учетной записи в активном снимке среды выполнения.
- Необязательный `channels.discord.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда он совпадает с идентификатором настроенной учетной записи.
- Используйте `user:<id>` (DM) или `channel:<id>` (канал гильдии) для целей доставки; голые числовые ID отклоняются.
- Слаги гильдий записываются в нижнем регистре, а пробелы заменяются на `-`; ключи каналов используют слагированное имя (без `#`). Предпочитайте ID гильдий.
- Сообщения, созданные ботами, по умолчанию игнорируются. `allowBots: true` включает их; используйте `allowBots: "mentions"`, чтобы принимать только сообщения ботов, которые упоминают бота (собственные сообщения по-прежнему отфильтровываются).
- Каналы, поддерживающие входящие сообщения, созданные ботами, могут использовать общую [защиту от зацикливания ботов](/ru/channels/bot-loop-protection). Задайте `channels.defaults.botLoopProtection` для базовых бюджетов пар, затем переопределяйте канал или учетную запись только когда одной поверхности нужны другие лимиты.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (и переопределения каналов) отбрасывает сообщения, которые упоминают другого пользователя или роль, но не бота (исключая @everyone/@here).
- `channels.discord.mentionAliases` сопоставляет стабильный исходящий текст `@handle` с ID пользователей Discord перед отправкой, чтобы известных участников команды можно было упоминать детерминированно, даже когда временный кэш каталога пуст. Переопределения для отдельных учетных записей находятся в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (по умолчанию 17) разбивает высокие сообщения, даже если они короче 2000 символов.
- `channels.discord.suppressEmbeds` по умолчанию равно `true`, поэтому исходящие URL не разворачиваются в предпросмотры ссылок Discord, если это не отключено. Явные полезные нагрузки `embeds` по-прежнему отправляются как обычно; вызовы инструментов для отдельных сообщений могут переопределить это через `suppressEmbeds`.
- `channels.discord.threadBindings` управляет маршрутизацией Discord, привязанной к тредам:
  - `enabled`: переопределение Discord для функций сессий, привязанных к тредам (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` и привязанная доставка/маршрутизация)
  - `idleHours`: переопределение Discord для автоматического снятия фокуса при неактивности в часах (`0` отключает)
  - `maxAgeHours`: переопределение Discord для жесткого максимального возраста в часах (`0` отключает)
  - `spawnSessions`: переключатель для `sessions_spawn({ thread: true })` и автоматического создания/привязки тредов ACP thread-spawn (по умолчанию: `true`)
  - `defaultSpawnContext`: нативный контекст подагента для запусков, привязанных к тредам (по умолчанию `"fork"`)
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для каналов и тредов (используйте ID канала/треда в `match.peer.id`). Семантика полей общая и описана в [Агентах ACP](/ru/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задает акцентный цвет для контейнеров компонентов Discord v2.
- `channels.discord.agentComponents.ttlMs` управляет тем, как долго отправленные callback-компоненты Discord остаются зарегистрированными. Значение по умолчанию — `1800000` (30 минут), максимум — `86400000` (24 часа), а переопределения для отдельных учетных записей находятся в `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Более длинные значения дольше сохраняют пригодность старых кнопок/селекторов/форм, поэтому предпочитайте самый короткий TTL, который подходит рабочему процессу.
- `channels.discord.voice` включает разговоры в голосовых каналах Discord и необязательные переопределения автоподключения + LLM + TTS. Текстовые конфигурации Discord по умолчанию оставляют голос выключенным; задайте `channels.discord.voice.enabled=true`, чтобы включить его.
- `channels.discord.voice.model` необязательно переопределяет модель LLM, используемую для ответов в голосовом канале Discord.
- `channels.discord.voice.daveEncryption` и `channels.discord.voice.decryptionFailureTolerance` передаются в параметры DAVE `@discordjs/voice` (`true` и `24` по умолчанию).
- `channels.discord.voice.connectTimeoutMs` управляет начальным ожиданием Ready `@discordjs/voice` для `/vc join` и попыток автоподключения (`30000` по умолчанию).
- `channels.discord.voice.reconnectGraceMs` управляет тем, сколько времени отключенная голосовая сессия может входить в сигнализацию переподключения до того, как OpenClaw уничтожит ее (`15000` по умолчанию).
- Воспроизведение голоса Discord не прерывается событием начала речи другого пользователя. Чтобы избежать петель обратной связи, OpenClaw игнорирует новый захват голоса, пока воспроизводится TTS.
- OpenClaw дополнительно пытается восстановить прием голоса, покидая голосовую сессию и подключаясь к ней заново после повторяющихся ошибок расшифровки.
- `channels.discord.streaming` — канонический ключ режима потока. Discord по умолчанию использует `streaming.mode: "progress"`, поэтому ход выполнения инструментов/работы появляется в одном редактируемом сообщении предпросмотра; задайте `streaming.mode: "off"`, чтобы отключить это. Устаревшие значения `streamMode` и булев `streaming` остаются псевдонимами среды выполнения; запустите `openclaw doctor --fix`, чтобы переписать сохраненную конфигурацию.
- `channels.discord.autoPresence` сопоставляет доступность среды выполнения с присутствием бота (healthy => online, degraded => idle, exhausted => dnd) и допускает необязательные переопределения текста статуса.
- `channels.discord.dangerouslyAllowNameMatching` снова включает сопоставление по изменяемому имени/тегу (аварийный режим совместимости).
- `channels.discord.execApprovals`: нативная для Discord доставка подтверждений exec и авторизация утверждающих.
  - `enabled`: `true`, `false` или `"auto"` (по умолчанию). В автоматическом режиме подтверждения exec активируются, когда утверждающих можно разрешить из `approvers` или `commands.ownerAllowFrom`.
  - `approvers`: ID пользователей Discord, которым разрешено утверждать запросы exec. Если опущено, используется резервное значение `commands.ownerAllowFrom`.
  - `agentFilter`: необязательный allowlist ID агентов. Опустите, чтобы пересылать подтверждения для всех агентов.
  - `sessionFilter`: необязательные шаблоны ключей сессий (подстрока или regex).
  - `target`: куда отправлять запросы подтверждения. `"dm"` (по умолчанию) отправляет в DM утверждающим, `"channel"` отправляет в исходный канал, `"both"` отправляет в оба места. Когда цель включает `"channel"`, кнопки доступны только разрешенным утверждающим.
  - `cleanupAfterResolve`: когда `true`, удаляет DM с подтверждением после утверждения, отказа или тайм-аута.

**Режимы уведомлений о реакциях:** `off` (нет), `own` (сообщения бота, по умолчанию), `all` (все сообщения), `allowlist` (из `guilds.<id>.users` для всех сообщений).

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

- JSON сервисного аккаунта: встроенный (`serviceAccount`) или файловый (`serviceAccountFile`).
- SecretRef сервисного аккаунта также поддерживается (`serviceAccountRef`).
- Резервные значения env: `GOOGLE_CHAT_SERVICE_ACCOUNT` или `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Используйте `spaces/<spaceId>` или `users/<userId>` для целей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` снова включает сопоставление по изменяемому email-principal (аварийный режим совместимости).

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

- **Режим Socket** требует одновременно `botToken` и `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного значения env учетной записи по умолчанию).
- **Режим HTTP** требует `botToken` плюс `signingSecret` (на корневом уровне или для каждой учетной записи).
- `socketMode` передает настройку транспорта Socket Mode Slack SDK в публичный API приемника Bolt. Используйте это только при расследовании тайм-аутов ping/pong или устаревшего поведения websocket. `clientPingTimeout` по умолчанию равен `15000`; `serverPingTimeout` и `pingPongLoggingEnabled` передаются только при настройке.
- `botToken`, `appToken`, `signingSecret` и `userToken` принимают открытые
  строки или объекты SecretRef.
- Снимки учетных записей Slack раскрывают поля источника/статуса для отдельных учетных данных, такие как
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` и, в режиме HTTP,
  `signingSecretStatus`. `configured_unavailable` означает, что учетная запись
  настроена через SecretRef, но текущая команда или runtime-путь не смогли
  разрешить значение секрета.
- `configWrites: false` блокирует инициированную Slack запись конфигурации.
- Необязательный `channels.slack.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда он совпадает с id настроенной учетной записи.
- `channels.slack.streaming.mode` — канонический ключ режима потока Slack. `channels.slack.streaming.nativeTransport` управляет нативным потоковым транспортом Slack. Устаревшие значения `streamMode`, логическое `streaming` и `nativeStreaming` остаются runtime-алиасами; выполните `openclaw doctor --fix`, чтобы переписать сохраненную конфигурацию.
- `unfurlLinks` и `unfurlMedia` передают логические значения разворачивания ссылок и медиа Slack `chat.postMessage` для ответов бота. `unfurlLinks` по умолчанию равен `false`, поэтому исходящие ссылки бота не разворачиваются inline, если это не включено; `unfurlMedia` опускается, если не настроен. Задайте любое значение в `channels.slack.accounts.<accountId>`, чтобы переопределить значение верхнего уровня для одной учетной записи.
- Используйте `user:<id>` (DM) или `channel:<id>` для целей доставки.

**Режимы уведомлений о реакциях:** `off`, `own` (по умолчанию), `all`, `allowlist` (из `reactionAllowlist`).

**Изоляция сессий thread:** `thread.historyScope` применяется к отдельному thread (по умолчанию) или совместно используется в канале. `thread.inheritParent` копирует расшифровку родительского канала в новые threads.

- Нативный стриминг Slack плюс статус thread в стиле Slack assistant «печатает...» требуют цель thread для ответа. DM верхнего уровня по умолчанию остаются вне thread, поэтому они все еще могут передаваться потоком через предварительные просмотры черновика Slack с публикацией и редактированием, а не показывать preview нативного stream/status в стиле thread.
- `typingReaction` добавляет временную реакцию к входящему сообщению Slack, пока выполняется ответ, затем удаляет ее по завершении. Используйте shortcode эмодзи Slack, например `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: доставка Slack-native approval-client и авторизация утверждающих exec. Та же schema, что и у Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID пользователей Slack), `agentFilter`, `sessionFilter` и `target` (`"dm"`, `"channel"` или `"both"`). Утверждения Plugin могут использовать этот путь native-client для запросов из Slack, когда утверждающие Slack plugin разрешаются; доставку Slack-native plugin approval также можно включить через `approvals.plugin` для сессий из Slack или целей Slack. Утверждения Plugin используют утверждающих Slack plugin из `allowFrom` и маршрутизацию по умолчанию, а не утверждающих exec.

| Группа действий | По умолчанию | Примечания                         |
| --------------- | ------------ | ---------------------------------- |
| reactions       | включено     | Реагировать + список реакций       |
| messages        | включено     | Читать/отправлять/редактировать/удалять |
| pins            | включено     | Закрепить/открепить/список         |
| memberInfo      | включено     | Информация об участнике            |
| emojiList       | включено     | Список пользовательских эмодзи     |

### Mattermost

Mattermost поставляется как встроенный plugin в текущих релизах OpenClaw. Более старые или
пользовательские сборки могут установить актуальный npm-пакет с помощью
`openclaw plugins install @openclaw/mattermost`. Проверьте
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
на наличие текущих dist-tags перед закреплением версии.

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

Режимы чата: `oncall` (отвечать на @-упоминание, по умолчанию), `onmessage` (каждое сообщение), `onchar` (сообщения, начинающиеся с триггерного префикса).

Когда включены нативные команды Mattermost:

- `commands.callbackPath` должен быть путем (например, `/api/channels/mattermost/command`), а не полным URL.
- `commands.callbackUrl` должен разрешаться в endpoint Gateway OpenClaw и быть доступным с сервера Mattermost.
- Нативные slash callbacks аутентифицируются токенами отдельных команд, возвращенными
  Mattermost при регистрации slash command. Если регистрация завершается с ошибкой или
  команды не активированы, OpenClaw отклоняет callbacks с
  `Unauthorized: invalid command token.`
- Для private/tailnet/internal callback hosts Mattermost может требовать,
  чтобы `ServiceSettings.AllowedUntrustedInternalConnections` включал callback host/domain.
  Используйте значения host/domain, а не полные URL.
- `channels.mattermost.configWrites`: разрешить или запретить инициированную Mattermost запись конфигурации.
- `channels.mattermost.requireMention`: требовать `@mention` перед ответом в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: переопределение проверки упоминания для каждого канала (`"*"` для значения по умолчанию).
- Необязательный `channels.mattermost.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда он совпадает с id настроенной учетной записи.

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

**Режимы уведомлений о реакциях:** `off`, `own` (по умолчанию), `all`, `allowlist` (из `reactionAllowlist`).

- `channels.signal.account`: закрепить запуск канала за конкретной идентичностью учетной записи Signal.
- `channels.signal.configWrites`: разрешить или запретить инициированную Signal запись конфигурации.
- Необязательный `channels.signal.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда он совпадает с id настроенной учетной записи.

### iMessage

OpenClaw запускает `imsg rpc` (JSON-RPC через stdio). Демон или порт не требуется. Это предпочтительный путь для новых настроек OpenClaw iMessage, когда host может предоставить разрешения к базе данных Messages и Automation.

Поддержка BlueBubbles была удалена. `channels.bluebubbles` не является поддерживаемой runtime-поверхностью конфигурации в текущем OpenClaw. Перенесите старые конфигурации в `channels.imessage`; используйте [Удаление BlueBubbles и путь imsg iMessage](/ru/announcements/bluebubbles-imessage) для краткой версии и [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles) для полной таблицы перевода.

Если Gateway не запущен на Mac со входом в Messages, оставьте `channels.imessage.enabled=true` и задайте `channels.imessage.cliPath` как SSH wrapper, который запускает `imsg "$@"` на этом Mac. Локальный путь `imsg` по умолчанию доступен только в macOS.

Перед тем как полагаться на SSH wrapper для production-отправок, проверьте исходящий `imsg send` через этот точный wrapper. Некоторые состояния macOS TCC назначают Messages Automation на `/usr/libexec/sshd-keygen-wrapper`, из-за чего чтение и probes могут работать, а отправки завершаются ошибкой AppleEvents `-1743`; см. [Отправки через SSH wrapper завершаются с AppleEvents -1743](/ru/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- Необязательный `channels.imessage.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда он совпадает с id настроенной учетной записи.

- Требует Full Disk Access к DB Messages.
- Предпочитайте цели `chat_id:<id>`. Используйте `imsg chats --limit 20`, чтобы вывести список чатов.
- `cliPath` может указывать на SSH wrapper; задайте `remoteHost` (`host` или `user@host`) для получения вложений через SCP.
- `attachmentRoots` и `remoteAttachmentRoots` ограничивают пути входящих вложений (по умолчанию: `/Users/*/Library/Messages/Attachments`).
- SCP использует строгую проверку host-key, поэтому убедитесь, что ключ relay host уже существует в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: разрешить или запретить инициированную iMessage запись конфигурации.
- `channels.imessage.sendTransport`: предпочтительный транспорт отправки RPC `imsg` для обычных исходящих ответов. `auto` (по умолчанию) использует мост IMCore для существующих чатов, когда он запущен, затем откатывается к AppleScript; `bridge` требует доставки через private API; `applescript` принудительно использует публичный путь автоматизации Messages.
- `channels.imessage.actions.*`: включить действия private API, которые также ограничиваются `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` по умолчанию выключен; задайте `true`, прежде чем ожидать входящие медиа в ходах агента.
- Восстановление входящих сообщений после перезапуска bridge/gateway выполняется автоматически (дедупликация GUID плюс ограничитель возраста устаревшего backlog). Существующие конфигурации `channels.imessage.catchup.enabled: true` все еще учитываются как deprecated профиль совместимости.
- `channels.imessage.groups`: реестр групп и настройки для каждой группы. С `groupPolicy: "allowlist"` настройте либо явные ключи `chat_id`, либо wildcard-запись `"*"`, чтобы групповые сообщения могли пройти проверку реестра.
- Записи `bindings[]` верхнего уровня с `type: "acp"` могут привязывать беседы iMessage к постоянным сессиям ACP. Используйте нормализованный handle или явную цель чата (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) в `match.peer.id`. Общая семантика полей: [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Пример SSH wrapper для iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix поддерживается plugin и настраивается в `channels.matrix`.

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

- Аутентификация по токену использует `accessToken`; аутентификация по паролю использует `userId` + `password`.
- `channels.matrix.proxy` направляет HTTP-трафик Matrix через явный HTTP(S)-прокси. Именованные учетные записи могут переопределить его с помощью `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` разрешает частные/внутренние homeserver. `proxy` и это сетевое явное включение являются независимыми настройками.
- `channels.matrix.defaultAccount` выбирает предпочтительную учетную запись в конфигурациях с несколькими учетными записями.
- `channels.matrix.autoJoin` по умолчанию имеет значение `off`, поэтому приглашенные комнаты и новые приглашения в стиле личных сообщений игнорируются, пока вы не зададите `autoJoin: "allowlist"` с `autoJoinAllowlist` или `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативная для Matrix доставка подтверждений exec и авторизация подтверждающих.
  - `enabled`: `true`, `false` или `"auto"` (по умолчанию). В автоматическом режиме подтверждения exec активируются, когда подтверждающих можно разрешить из `approvers` или `commands.ownerAllowFrom`.
  - `approvers`: идентификаторы пользователей Matrix (например, `@owner:example.org`), которым разрешено подтверждать exec-запросы.
  - `agentFilter`: необязательный allowlist идентификаторов агентов. Не указывайте, чтобы пересылать подтверждения для всех агентов.
  - `sessionFilter`: необязательные шаблоны ключей сессий (подстрока или регулярное выражение).
  - `target`: куда отправлять запросы подтверждения. `"dm"` (по умолчанию), `"channel"` (исходная комната) или `"both"`.
  - Переопределения для отдельных учетных записей: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` управляет тем, как личные сообщения Matrix группируются в сессии: `per-user` (по умолчанию) разделяет сессии по маршрутизированному собеседнику, а `per-room` изолирует каждую комнату личных сообщений.
- Проверки статуса Matrix и live-поиски в каталоге используют ту же прокси-политику, что и runtime-трафик.
- Полная конфигурация Matrix, правила таргетинга и примеры настройки документированы в [Matrix](/ru/channels/matrix).

### Microsoft Teams

Microsoft Teams поддерживается Plugin и настраивается в `channels.msteams`.

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

- Основные пути ключей, описанные здесь: `channels.msteams`, `channels.msteams.configWrites`.
- Полная конфигурация Teams (учетные данные, Webhook, политика личных сообщений/групп, переопределения для команд/каналов) документирована в [Microsoft Teams](/ru/channels/msteams).

### IRC

IRC поддерживается Plugin и настраивается в `channels.irc`.

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

- Основные пути ключей, описанные здесь: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необязательный `channels.irc.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда совпадает с идентификатором настроенной учетной записи.
- Полная конфигурация канала IRC (host/port/TLS/channels/allowlists/mention gating) документирована в [IRC](/ru/channels/irc).

### Несколько учетных записей (все каналы)

Запустите несколько учетных записей на канал (каждая со своим `accountId`):

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

- `default` используется, когда `accountId` не указан (CLI + маршрутизация).
- Токены из окружения применяются только к учетной записи **по умолчанию**.
- Базовые настройки канала применяются ко всем учетным записям, если не переопределены для конкретной учетной записи.
- Используйте `bindings[].match.accountId`, чтобы маршрутизировать каждую учетную запись к другому агенту.
- Если вы добавляете учетную запись не по умолчанию через `openclaw channels add` (или онбординг канала), пока все еще используете одноаккаунтную конфигурацию канала верхнего уровня, OpenClaw сначала переносит одноаккаунтные значения верхнего уровня, относящиеся к учетной записи, в карту учетных записей канала, чтобы исходная учетная запись продолжала работать. Большинство каналов перемещают их в `channels.<channel>.accounts.default`; Matrix вместо этого может сохранить существующую совпадающую именованную/дефолтную цель.
- Существующие привязки только к каналу (без `accountId`) продолжают соответствовать учетной записи по умолчанию; привязки с областью учетной записи остаются необязательными.
- `openclaw doctor --fix` также исправляет смешанные формы, перемещая одноаккаунтные значения верхнего уровня, относящиеся к учетной записи, в продвинутую учетную запись, выбранную для этого канала. Большинство каналов используют `accounts.default`; Matrix вместо этого может сохранить существующую совпадающую именованную/дефолтную цель.

### Другие каналы Plugin

Многие каналы Plugin настраиваются как `channels.<id>` и документированы на своих отдельных страницах каналов (например Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat и Twitch).
См. полный указатель каналов: [Каналы](/ru/channels).

### Фильтрация упоминаний в групповом чате

Для групповых сообщений по умолчанию **требуется упоминание** (упоминание из метаданных или безопасные шаблоны регулярных выражений). Применяется к групповым чатам WhatsApp, Telegram, Discord, Google Chat и iMessage.

Видимые ответы управляются отдельно. Обычные групповые, канальные и внутренние прямые запросы WebChat по умолчанию используют автоматическую доставку финального ответа: финальный текст ассистента публикуется через устаревший путь видимого ответа. Включайте `messages.visibleReplies: "message_tool"` или `messages.groupChat.visibleReplies: "message_tool"`, когда видимый вывод должен публиковаться только после вызова агентом `message(action=send)`. Если модель возвращает финальный текст без вызова инструмента сообщений в режиме только через инструмент, этот финальный текст остается приватным, а подробный журнал Gateway записывает метаданные подавленной полезной нагрузки.

Видимые ответы только через инструмент требуют модель/runtime, которые надежно вызывают инструменты, и рекомендуются для общих фоновых комнат на моделях последнего поколения, таких как GPT 5.5. Некоторые более слабые модели могут отвечать финальным текстом, но не понимать, что видимый для источника вывод должен отправляться через `message(action=send)`. Для таких моделей используйте `"automatic"`, чтобы финальный ход ассистента был путем видимого ответа. Если журнал сессии показывает текст ассистента с `didSendViaMessagingTool: false`, модель создала приватный финальный текст вместо вызова инструмента сообщений. Переключитесь на более сильную модель с вызовом инструментов для этого канала, проверьте подробный журнал Gateway на сводку подавленной полезной нагрузки или задайте `messages.groupChat.visibleReplies: "automatic"`, чтобы использовать видимые финальные ответы для каждого группового/канального запроса.

Если инструмент сообщений недоступен при активной политике инструментов, OpenClaw откатывается к автоматическим видимым ответам вместо молчаливого подавления ответа. `openclaw doctor` предупреждает об этом несоответствии.

Это правило применяется к обычному финальному тексту агента. Привязки разговоров, принадлежащие Plugin, используют ответ, возвращенный владельцем Plugin, как видимый ответ для заявленных ходов привязанного треда; Plugin не должен вызывать `message(action=send)` для таких ответов привязки.

**Устранение неполадок: групповое @mention запускает индикатор набора, затем тишина (без ошибки)**

Симптом: @mention в группе/канале показывает индикатор набора, а журнал Gateway сообщает `dispatch complete (queuedFinal=false, replies=0)`, но сообщение не появляется в комнате. Личные сообщения тому же агенту отвечают нормально.

Причина: режим видимого ответа для группы/канала разрешается в `"message_tool"`, поэтому OpenClaw выполняет ход, но подавляет финальный текст ассистента, если агент не вызывает `message(action=send)`. В этом режиме нет контракта `NO_REPLY`; отсутствие вызова инструмента сообщений означает отсутствие ответа в источник. Ошибки нет, потому что подавление является настроенным поведением. Обычные групповые и канальные ходы по умолчанию используют `"automatic"`, поэтому этот симптом появляется только когда `messages.groupChat.visibleReplies` (или глобальный `messages.visibleReplies`) явно задан в `"message_tool"`. Harness `defaultVisibleReplies` здесь не применяется — резолвер групп/каналов игнорирует его; он влияет только на прямые/исходные чаты (таким образом Codex harness подавляет финальные ответы прямых чатов).

Исправление: выберите более сильную модель с вызовом инструментов, удалите явное переопределение `"message_tool"`, чтобы вернуться к значению по умолчанию `"automatic"`, или задайте `messages.groupChat.visibleReplies: "automatic"`, чтобы принудительно включить видимые ответы для каждого группового/канального запроса. Gateway горячо перезагружает конфигурацию `messages` после сохранения файла; перезапускайте Gateway только когда наблюдение за файлами или перезагрузка конфигурации отключены в развертывании.

**Типы упоминаний:**

- **Упоминания из метаданных**: нативные платформенные @-упоминания. Игнорируются в режиме self-chat WhatsApp.
- **Текстовые шаблоны**: безопасные шаблоны регулярных выражений в `agents.list[].groupChat.mentionPatterns`. Недопустимые шаблоны и небезопасные вложенные повторения игнорируются.
- Фильтрация упоминаний применяется только когда обнаружение возможно (нативные упоминания или хотя бы один шаблон).

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

`messages.groupChat.historyLimit` задает глобальное значение по умолчанию. Каналы могут переопределить его с помощью `channels.<channel>.historyLimit` (или для отдельной учетной записи). Задайте `0`, чтобы отключить.

`messages.groupChat.unmentionedInbound: "room_event"` отправляет неупомянутые always-on сообщения группы/канала как тихий контекст комнаты на поддерживаемых каналах. Упомянутые сообщения, команды и личные сообщения остаются пользовательскими запросами. Полные примеры для Discord, Slack и Telegram см. в [Фоновых событиях комнаты](/ru/channels/ambient-room-events).

`messages.visibleReplies` — глобальное значение по умолчанию для исходных событий; `messages.groupChat.visibleReplies` переопределяет его для исходных событий групп/каналов. Когда `messages.visibleReplies` не задан, прямые/исходные чаты используют выбранный runtime или значение по умолчанию harness, но внутренние прямые ходы WebChat используют автоматическую финальную доставку для паритета подсказок Pi/Codex. Задайте `messages.visibleReplies: "message_tool"`, чтобы намеренно требовать `message(action=send)` для видимого вывода. Allowlist каналов и фильтрация упоминаний по-прежнему решают, обрабатывается ли событие.

#### Ограничения истории личных сообщений

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

Разрешение: переопределение для конкретного личного сообщения → значение по умолчанию провайдера → без ограничения (сохраняется все).

Поддерживается: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Режим self-chat

Включите собственный номер в `allowFrom`, чтобы включить режим self-chat (игнорирует нативные @-упоминания, отвечает только на текстовые шаблоны):

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

### Команды (обработка команд чата)

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

<Accordion title="Сведения о командах">

- Этот блок настраивает поверхности команд. Текущий встроенный и поставляемый каталог команд см. в разделе [Команды Slash](/ru/tools/slash-commands).
- Эта страница — **справочник по ключам конфигурации**, а не полный каталог команд. Команды, принадлежащие каналам/Plugin, такие как QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` и Talk `/voice`, документированы на страницах соответствующих каналов/Plugin, а также в разделе [Команды Slash](/ru/tools/slash-commands).
- Текстовые команды должны быть **отдельными** сообщениями с начальным `/`.
- `native: "auto"` включает нативные команды для Discord/Telegram и оставляет Slack выключенным.
- `nativeSkills: "auto"` включает нативные команды Skills для Discord/Telegram и оставляет Slack выключенным.
- Переопределение для отдельного канала: `channels.discord.commands.native` (bool или `"auto"`). Для Discord значение `false` пропускает регистрацию нативных команд и очистку при запуске.
- Переопределяйте регистрацию нативных Skills для отдельного канала с помощью `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` добавляет дополнительные пункты меню бота Telegram.
- `bash: true` включает `! <cmd>` для оболочки хоста. Требуются `tools.elevated.enabled` и отправитель в `tools.elevated.allowFrom.<channel>`.
- `config: true` включает `/config` (чтение/запись `openclaw.json`). Для клиентов Gateway `chat.send` постоянные записи `/config set|unset` также требуют `operator.admin`; команда `/config show` только для чтения остается доступной обычным клиентам-операторам с областью записи.
- `mcp: true` включает `/mcp` для конфигурации MCP-сервера, управляемого OpenClaw, в `mcp.servers`.
- `plugins: true` включает `/plugins` для обнаружения, установки и управления включением/отключением Plugin.
- `channels.<provider>.configWrites` ограничивает изменения конфигурации для отдельного канала (по умолчанию: true).
- Для каналов с несколькими учетными записями `channels.<provider>.accounts.<id>.configWrites` также ограничивает записи, нацеленные на эту учетную запись (например, `/allowlist --config --account <id>` или `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` отключает `/restart` и действия инструментов перезапуска Gateway. По умолчанию: `true`.
- `ownerAllowFrom` — явный список разрешенных владельцев для команд только владельца и действий канала, защищенных проверкой владельца. Он отделен от `allowFrom`.
- `ownerDisplay: "hash"` хеширует идентификаторы владельцев в системном промпте. Задайте `ownerDisplaySecret`, чтобы управлять хешированием.
- `allowFrom` задается для каждого provider. Если он задан, это **единственный** источник авторизации (списки разрешений/сопряжение канала и `useAccessGroups` игнорируются).
- `useAccessGroups: false` позволяет командам обходить политики групп доступа, когда `allowFrom` не задан.
- Карта документации по командам:
  - встроенный и поставляемый каталог: [Команды Slash](/ru/tools/slash-commands)
  - поверхности команд, специфичные для каналов: [Каналы](/ru/channels)
  - команды QQ Bot: [QQ Bot](/ru/channels/qqbot)
  - команды сопряжения: [Сопряжение](/ru/channels/pairing)
  - команда карточки LINE: [LINE](/ru/channels/line)
  - memory dreaming: [Dreaming](/ru/concepts/dreaming)

</Accordion>

---

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/configuration-reference) — ключи верхнего уровня
- [Конфигурация — агенты](/ru/gateway/config-agents)
- [Обзор каналов](/ru/channels)
