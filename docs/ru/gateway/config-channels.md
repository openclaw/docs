---
read_when:
    - Настройка Plugin канала (аутентификация, контроль доступа, несколько учетных записей)
    - Устранение неполадок ключей конфигурации для отдельных каналов
    - Аудит политики личных сообщений, политики групп или проверки упоминаний
summary: 'Конфигурация каналов: контроль доступа, сопряжение, ключи для каждого канала в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и других сервисах'
title: Конфигурация — каналы
x-i18n:
    generated_at: "2026-07-01T13:17:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключи конфигурации для отдельных каналов в `channels.*`. Охватывает доступ к личным сообщениям и группам,
настройки с несколькими учетными записями, фильтрацию по упоминаниям и ключи для отдельных каналов Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage и других встроенных Plugin каналов.

Для агентов, инструментов, среды выполнения Gateway и других ключей верхнего уровня см.
[Справочник по конфигурации](/ru/gateway/configuration-reference).

## Каналы

Каждый канал запускается автоматически, когда существует его раздел конфигурации (если не задано `enabled: false`).

### Доступ к личным сообщениям и группам

Все каналы поддерживают политики личных сообщений и групповые политики:

| Политика личных сообщений | Поведение                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (по умолчанию) | Неизвестные отправители получают одноразовый код сопряжения; владелец должен одобрить |
| `allowlist`         | Только отправители из `allowFrom` (или из хранилища разрешенных сопряжений)             |
| `open`              | Разрешить все входящие личные сообщения (требует `allowFrom: ["*"]`)             |
| `disabled`          | Игнорировать все входящие личные сообщения                                          |

| Групповая политика       | Поведение                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (по умолчанию) | Только группы, соответствующие настроенному списку разрешений          |
| `open`                | Обходить групповые списки разрешений (фильтрация по упоминаниям все равно применяется) |
| `disabled`            | Блокировать все сообщения групп/комнат                          |

<Note>
`channels.defaults.groupPolicy` задает значение по умолчанию, когда `groupPolicy` провайдера не установлен.
Коды сопряжения истекают через 1 час. Ожидающие запросы сопряжения личных сообщений ограничены **3 на канал**.
Если блок провайдера полностью отсутствует (`channels.<provider>` отсутствует), групповая политика среды выполнения возвращается к `allowlist` (закрыто при отказе) с предупреждением при запуске.
</Note>

### Переопределения модели канала

Используйте `channels.modelByChannel`, чтобы закрепить конкретные ID каналов или собеседников в личных сообщениях за моделью. Значения принимают `provider/model` или настроенные псевдонимы моделей. Сопоставление каналов применяется, когда у сеанса еще нет переопределения модели (например, заданного через `/model`).

Для групповых обсуждений и тем ключами являются специфичные для канала ID групп, ID тем или имена каналов. Для обсуждений в личных сообщениях ключами являются идентификаторы собеседников, полученные из личности отправителя канала (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` или `SenderId`). Точная форма ключа зависит от канала:

| Канал  | Форма ключа личных сообщений | Пример                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | необработанный ID пользователя | `123456789`                                  |
| Discord  | необработанный ID пользователя | `987654321`                                  |
| WhatsApp | номер телефона или JID | `15551234567`                                |
| Matrix   | ID пользователя Matrix | `@user:matrix.org`                           |
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

Ключи, специфичные для личных сообщений, совпадают только в обсуждениях личных сообщений; они не влияют на маршрутизацию групп/тем.

### Значения каналов по умолчанию и Heartbeat

Используйте `channels.defaults` для общего поведения групповой политики и Heartbeat у провайдеров:

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

- `channels.defaults.groupPolicy`: резервная групповая политика, когда `groupPolicy` на уровне провайдера не задан.
- `channels.defaults.contextVisibility`: режим видимости дополнительного контекста по умолчанию для всех каналов. Значения: `all` (по умолчанию, включает весь контекст цитат/тем/истории), `allowlist` (включать контекст только от отправителей из списка разрешений), `allowlist_quote` (то же, что allowlist, но сохранять явный контекст цитаты/ответа). Переопределение для канала: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включать исправные статусы каналов в вывод Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: включать статусы деградации/ошибок в вывод Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: отображать компактный вывод Heartbeat в стиле индикатора.

### WhatsApp

WhatsApp работает через веб-канал Gateway (Baileys Web). Он запускается автоматически, когда существует связанный сеанс.

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

<Accordion title="Несколько учетных записей WhatsApp">

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

- Исходящие команды по умолчанию используют учетную запись `default`, если она есть; иначе первый настроенный идентификатор учетной записи (после сортировки).
- Необязательный `channels.whatsapp.defaultAccount` переопределяет этот резервный выбор учетной записи по умолчанию, когда он совпадает с настроенным идентификатором учетной записи.
- Устаревший каталог авторизации Baileys для одной учетной записи переносится `openclaw doctor` в `whatsapp/default`.
- Переопределения для учетной записи: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Токен бота: `channels.telegram.botToken` или `channels.telegram.tokenFile` (только обычный файл; символические ссылки отклоняются), с `TELEGRAM_BOT_TOKEN` как резервным вариантом для учетной записи по умолчанию.
- `apiRoot` — это только корень Telegram Bot API. Используйте `https://api.telegram.org` или собственный размещенный/прокси-корень, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` удаляет случайный завершающий суффикс `/bot<TOKEN>`.
- Необязательный `channels.telegram.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда он совпадает с настроенным идентификатором учетной записи.
- В настройках с несколькими учетными записями (2+ идентификатора учетных записей) задайте явное значение по умолчанию (`channels.telegram.defaultAccount` или `channels.telegram.accounts.default`), чтобы избежать резервной маршрутизации; `openclaw doctor` предупреждает, когда оно отсутствует или недействительно.
- `configWrites: false` блокирует инициированные Telegram записи конфигурации (миграции ID супергрупп, `/config set|unset`).
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для тем форума (используйте канонический `chatId:topic:topicId` в `match.peer.id`). Семантика полей общая и описана в [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).
- Предпросмотры потока Telegram используют `sendMessage` + `editMessageText` (работает в личных и групповых чатах).
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

- Токен: `channels.discord.token`, с `DISCORD_BOT_TOKEN` в качестве резервного варианта для учетной записи по умолчанию.
- Прямые исходящие вызовы, которые передают явный Discord `token`, используют этот токен для вызова; параметры повторных попыток и политик учетной записи по-прежнему берутся из выбранной учетной записи в активном снимке среды выполнения.
- Необязательный `channels.discord.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда совпадает с настроенным идентификатором учетной записи.
- Используйте `user:<id>` (DM) или `channel:<id>` (канал гильдии) для целей доставки; простые числовые идентификаторы отклоняются.
- Слаги гильдий пишутся в нижнем регистре с заменой пробелов на `-`; ключи каналов используют имя в виде слага (без `#`). Предпочитайте идентификаторы гильдий.
- Сообщения, созданные ботами, по умолчанию игнорируются. `allowBots: true` включает их; используйте `allowBots: "mentions"`, чтобы принимать только сообщения ботов, в которых упомянут бот (собственные сообщения все равно фильтруются).
- Каналы, поддерживающие входящие сообщения, созданные ботами, могут использовать общую [защиту от зацикливания ботов](/ru/channels/bot-loop-protection). Задайте `channels.defaults.botLoopProtection` для базовых бюджетов пар, а затем переопределяйте канал или учетную запись только когда одной поверхности нужны другие лимиты.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (и переопределения каналов) отбрасывает сообщения, в которых упомянут другой пользователь или роль, но не бот (исключая @everyone/@here).
- `channels.discord.mentionAliases` сопоставляет стабильный исходящий текст `@handle` с идентификаторами пользователей Discord перед отправкой, чтобы известных участников команды можно было упоминать детерминированно, даже когда временный кэш каталога пуст. Переопределения для отдельных учетных записей находятся в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (по умолчанию 17) разбивает высокие сообщения, даже если они короче 2000 символов.
- `channels.discord.suppressEmbeds` по умолчанию равно `true`, поэтому исходящие URL не разворачиваются в предпросмотры ссылок Discord, если это не отключено. Явные полезные нагрузки `embeds` по-прежнему отправляются обычным образом; вызовы инструментов для отдельных сообщений могут переопределить это через `suppressEmbeds`.
- `channels.discord.threadBindings` управляет маршрутизацией Discord, привязанной к тредам:
  - `enabled`: переопределение Discord для функций сессий, привязанных к тредам (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а также привязанная доставка/маршрутизация)
  - `idleHours`: переопределение Discord для автоматического снятия фокуса при неактивности в часах (`0` отключает)
  - `maxAgeHours`: переопределение Discord для жесткого максимального возраста в часах (`0` отключает)
  - `spawnSessions`: переключатель для `sessions_spawn({ thread: true })` и автоматического создания/привязки тредов при создании тредов ACP (по умолчанию: `true`)
  - `defaultSpawnContext`: собственный контекст субагента для запусков, привязанных к тредам (по умолчанию `"fork"`)
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для каналов и тредов (используйте идентификатор канала/треда в `match.peer.id`). Семантика полей общая и описана в [агентах ACP](/ru/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задает акцентный цвет для контейнеров компонентов Discord v2.
- `channels.discord.agentComponents.ttlMs` управляет тем, как долго отправленные обратные вызовы компонентов Discord остаются зарегистрированными. Значение по умолчанию — `1800000` (30 минут), максимум — `86400000` (24 часа), а переопределения для отдельных учетных записей находятся в `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Более длинные значения дольше сохраняют пригодность старых кнопок/селектов/форм, поэтому предпочитайте самый короткий TTL, подходящий для рабочего процесса.
- `channels.discord.voice` включает разговоры в голосовых каналах Discord и необязательные переопределения автоподключения, LLM и TTS. Текстовые конфигурации Discord по умолчанию оставляют голос выключенным; задайте `channels.discord.voice.enabled=true`, чтобы включить его.
- `channels.discord.voice.model` необязательно переопределяет модель LLM, используемую для ответов в голосовых каналах Discord.
- `channels.discord.voice.daveEncryption` и `channels.discord.voice.decryptionFailureTolerance` передаются в параметры DAVE `@discordjs/voice` (по умолчанию `true` и `24`).
- `channels.discord.voice.connectTimeoutMs` управляет начальным ожиданием Ready в `@discordjs/voice` для `/vc join` и попыток автоподключения (по умолчанию `30000`).
- `channels.discord.voice.reconnectGraceMs` управляет тем, сколько времени отключенная голосовая сессия может входить в сигнализацию переподключения, прежде чем OpenClaw уничтожит ее (по умолчанию `15000`).
- Воспроизведение голоса Discord не прерывается событием начала речи другого пользователя. Чтобы избежать петель обратной связи, OpenClaw игнорирует новый захват голоса, пока воспроизводится TTS.
- OpenClaw также пытается восстановить прием голоса, покидая голосовую сессию и повторно входя в нее после повторяющихся ошибок расшифровки.
- `channels.discord.streaming` — канонический ключ режима потоковой передачи. Discord по умолчанию использует `streaming.mode: "progress"`, чтобы ход выполнения инструментов/работы отображался в одном редактируемом сообщении предпросмотра; задайте `streaming.mode: "off"`, чтобы отключить это. Устаревшие значения `streamMode` и булевы значения `streaming` остаются псевдонимами среды выполнения; выполните `openclaw doctor --fix`, чтобы перезаписать сохраненную конфигурацию.
- `channels.discord.autoPresence` сопоставляет доступность среды выполнения с присутствием бота (healthy => online, degraded => idle, exhausted => dnd) и позволяет необязательные переопределения текста статуса.
- `channels.discord.dangerouslyAllowNameMatching` повторно включает сопоставление по изменяемому имени/тегу (аварийный режим совместимости).
- `channels.discord.execApprovals`: встроенная для Discord доставка подтверждений exec и авторизация утверждающих.
  - `enabled`: `true`, `false` или `"auto"` (по умолчанию). В автоматическом режиме подтверждения exec активируются, когда утверждающих можно определить из `approvers` или `commands.ownerAllowFrom`.
  - `approvers`: идентификаторы пользователей Discord, которым разрешено утверждать exec-запросы. Если опущено, используется резервное значение `commands.ownerAllowFrom`.
  - `agentFilter`: необязательный список разрешенных идентификаторов агентов. Опустите, чтобы пересылать подтверждения для всех агентов.
  - `sessionFilter`: необязательные шаблоны ключей сессий (подстрока или регулярное выражение).
  - `target`: куда отправлять запросы подтверждения. `"dm"` (по умолчанию) отправляет в DM утверждающих, `"channel"` отправляет в исходный канал, `"both"` отправляет в оба места. Когда цель включает `"channel"`, кнопки доступны только определенным утверждающим.
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

- JSON сервисного аккаунта: встроенный (`serviceAccount`) или на основе файла (`serviceAccountFile`).
- SecretRef сервисного аккаунта также поддерживается (`serviceAccountRef`).
- Резервные env-значения: `GOOGLE_CHAT_SERVICE_ACCOUNT` или `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Используйте `spaces/<spaceId>` или `users/<userId>` для целей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно включает сопоставление по изменяемому email-принципалу (аварийный режим совместимости).

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

- **Режим Socket** требует одновременно `botToken` и `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного env значения учетной записи по умолчанию).
- **Режим HTTP** требует `botToken` плюс `signingSecret` (в корне или для каждой учетной записи).
- `socketMode` передает настройки транспорта Slack SDK Socket Mode в публичный API приемника Bolt. Используйте его только при расследовании тайм-аутов ping/pong или устаревшего поведения websocket. `clientPingTimeout` по умолчанию равен `15000`; `serverPingTimeout` и `pingPongLoggingEnabled` передаются только если настроены.
- `botToken`, `appToken`, `signingSecret` и `userToken` принимают строки
  открытого текста или объекты SecretRef.
- Снимки учетных записей Slack предоставляют поля источника/статуса для отдельных учетных данных, такие как
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в режиме HTTP -
  `signingSecretStatus`. `configured_unavailable` означает, что учетная запись
  настроена через SecretRef, но текущий путь команды/среды выполнения не смог
  разрешить значение секрета.
- `configWrites: false` блокирует записи конфигурации, инициированные Slack.
- Необязательный `channels.slack.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда он совпадает с id настроенной учетной записи.
- `channels.slack.streaming.mode` - канонический ключ режима потока Slack. `channels.slack.streaming.nativeTransport` управляет собственным потоковым транспортом Slack. Устаревшие значения `streamMode`, логическое `streaming` и `nativeStreaming` остаются runtime-алиасами; выполните `openclaw doctor --fix`, чтобы переписать сохраненную конфигурацию.
- `unfurlLinks` и `unfurlMedia` передают логические значения развертывания ссылок и медиа Slack `chat.postMessage` для ответов бота. `unfurlLinks` по умолчанию равен `false`, поэтому исходящие ссылки бота не разворачиваются встроенно, если это не включено; `unfurlMedia` опускается, если не настроен. Задайте любое из этих значений в `channels.slack.accounts.<accountId>`, чтобы переопределить значение верхнего уровня для одной учетной записи.
- Используйте `user:<id>` (DM) или `channel:<id>` для целей доставки.

**Режимы уведомлений о реакциях:** `off`, `own` (по умолчанию), `all`, `allowlist` (из `reactionAllowlist`).

**Изоляция сессий тредов:** `thread.historyScope` действует для каждого треда (по умолчанию) или совместно для канала. `thread.inheritParent` копирует расшифровку родительского канала в новые треды.

- Собственный стриминг Slack плюс статус треда Slack в стиле ассистента "is typing..." требуют цель в виде треда ответа. DM верхнего уровня по умолчанию остаются вне тредов, поэтому они по-прежнему могут стримиться через предварительные просмотры черновиков Slack с публикацией и редактированием вместо показа нативного превью потока/статуса в стиле треда.
- `typingReaction` добавляет временную реакцию к входящему сообщению Slack, пока выполняется ответ, затем удаляет ее после завершения. Используйте короткий код эмодзи Slack, например `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: доставка клиента подтверждений в нативном интерфейсе Slack и авторизация утверждающего exec. Та же схема, что и в Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID пользователей Slack), `agentFilter`, `sessionFilter` и `target` (`"dm"`, `"channel"` или `"both"`). Подтверждения Plugin могут использовать этот путь нативного клиента для запросов, исходящих из Slack, когда утверждающие Plugin Slack разрешаются; доставка подтверждений Plugin в нативном Slack также может быть включена через `approvals.plugin` для сессий, исходящих из Slack, или целей Slack. Подтверждения Plugin используют утверждающих Plugin Slack из `allowFrom` и маршрутизацию по умолчанию, а не утверждающих exec.

| Группа действий | По умолчанию | Примечания                  |
| ------------ | ------- | ---------------------- |
| reactions    | включено | Реакции + список реакций |
| messages     | включено | Чтение/отправка/редактирование/удаление  |
| pins         | включено | Закрепление/открепление/список         |
| memberInfo   | включено | Информация об участнике            |
| emojiList    | включено | Список пользовательских эмодзи      |

### Mattermost

Mattermost поставляется как встроенный Plugin в текущих релизах OpenClaw. Более старые или
пользовательские сборки могут установить текущий пакет npm с помощью
`openclaw plugins install @openclaw/mattermost`. Проверьте
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
для текущих dist-tags перед закреплением версии.

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

Когда нативные команды Mattermost включены:

- `commands.callbackPath` должен быть путем (например `/api/channels/mattermost/command`), а не полным URL.
- `commands.callbackUrl` должен разрешаться в endpoint Gateway OpenClaw и быть доступен с сервера Mattermost.
- Нативные slash-callbacks аутентифицируются токенами каждой команды, возвращенными
  Mattermost во время регистрации slash-команды. Если регистрация завершается с ошибкой или
  команды не активированы, OpenClaw отклоняет callbacks с
  `Unauthorized: invalid command token.`
- Для приватных/tailnet/внутренних callback-хостов Mattermost может требовать,
  чтобы `ServiceSettings.AllowedUntrustedInternalConnections` включал callback-хост/домен.
  Используйте значения хоста/домена, а не полные URL.
- `channels.mattermost.configWrites`: разрешить или запретить записи конфигурации, инициированные Mattermost.
- `channels.mattermost.requireMention`: требовать `@mention` перед ответом в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: переопределение проверки упоминания для отдельного канала (`"*"` для значения по умолчанию).
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
- `channels.signal.configWrites`: разрешить или запретить записи конфигурации, инициированные Signal.
- Необязательный `channels.signal.defaultAccount` переопределяет выбор учетной записи по умолчанию, когда он совпадает с id настроенной учетной записи.

### iMessage

OpenClaw запускает `imsg rpc` (JSON-RPC через stdio). Демон или порт не требуются. Это предпочтительный путь для новых настроек OpenClaw iMessage, когда хост может предоставить разрешения к базе данных Messages и Automation.

Поддержка BlueBubbles была удалена. `channels.bluebubbles` не является поддерживаемой runtime-поверхностью конфигурации в текущем OpenClaw. Перенесите старые конфигурации в `channels.imessage`; используйте [Удаление BlueBubbles и путь imsg iMessage](/ru/announcements/bluebubbles-imessage) для краткой версии и [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles) для полной таблицы соответствий.

Если Gateway не запущен на Mac, где выполнен вход в Messages, оставьте `channels.imessage.enabled=true` и задайте `channels.imessage.cliPath` как SSH-обертку, которая запускает `imsg "$@"` на этом Mac. Локальный путь `imsg` по умолчанию поддерживается только в macOS.

Перед тем как полагаться на SSH-обертку для производственных отправок, проверьте исходящий `imsg send` через именно эту обертку. Некоторые состояния macOS TCC назначают Messages Automation для `/usr/libexec/sshd-keygen-wrapper`, из-за чего чтение и проверки могут работать, тогда как отправки завершаются с ошибкой AppleEvents `-1743`; см. [Отправки через SSH-обертку завершаются с AppleEvents -1743](/ru/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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

- Требует Full Disk Access к базе данных Messages.
- Предпочитайте цели `chat_id:<id>`. Используйте `imsg chats --limit 20`, чтобы вывести список чатов.
- `cliPath` может указывать на SSH-обертку; задайте `remoteHost` (`host` или `user@host`) для получения вложений через SCP.
- `attachmentRoots` и `remoteAttachmentRoots` ограничивают пути входящих вложений (по умолчанию: `/Users/*/Library/Messages/Attachments`).
- SCP использует строгую проверку host-key, поэтому убедитесь, что ключ хоста ретрансляции уже есть в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: разрешить или запретить записи конфигурации, инициированные iMessage.
- `channels.imessage.sendTransport`: предпочтительный транспорт отправки RPC `imsg` для обычных исходящих ответов. `auto` (по умолчанию) использует мост IMCore для существующих чатов, когда он запущен, затем откатывается к AppleScript; `bridge` требует доставки через приватный API; `applescript` принудительно использует публичный путь автоматизации Messages.
- `channels.imessage.actions.*`: включить действия приватного API, которые также ограничиваются `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` по умолчанию выключен; задайте его в `true`, прежде чем ожидать входящие медиа в ходах агента.
- Входящее восстановление после перезапуска моста/gateway выполняется автоматически (дедупликация GUID плюс возрастной барьер для устаревшего backlog). Существующие конфигурации `channels.imessage.catchup.enabled: true` по-прежнему учитываются как устаревший профиль совместимости.
- `channels.imessage.groups`: реестр групп и настройки для каждой группы. С `groupPolicy: "allowlist"` настройте либо явные ключи `chat_id`, либо wildcard-запись `"*"`, чтобы групповые сообщения могли пройти проверку реестра.
- Записи верхнего уровня `bindings[]` с `type: "acp"` могут привязывать разговоры iMessage к постоянным сессиям ACP. Используйте нормализованный handle или явную цель чата (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) в `match.peer.id`. Общая семантика полей: [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Пример SSH-обертки iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix поддерживается Plugin и настраивается в `channels.matrix`.

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
- `channels.matrix.proxy` направляет HTTP-трафик Matrix через явный HTTP(S)-прокси. Именованные аккаунты могут переопределить его с помощью `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` разрешает частные/внутренние homeserver. `proxy` и это сетевое явное разрешение являются независимыми элементами управления.
- `channels.matrix.defaultAccount` выбирает предпочтительный аккаунт в конфигурациях с несколькими аккаунтами.
- `channels.matrix.autoJoin` по умолчанию имеет значение `off`, поэтому приглашения в комнаты и новые приглашения в стиле DM игнорируются, пока вы не зададите `autoJoin: "allowlist"` с `autoJoinAllowlist` или `autoJoin: "always"`.
- `channels.matrix.execApprovals`: нативная для Matrix доставка подтверждений exec и авторизация утверждающих.
  - `enabled`: `true`, `false` или `"auto"` (по умолчанию). В автоматическом режиме подтверждения exec активируются, когда утверждающих можно определить из `approvers` или `commands.ownerAllowFrom`.
  - `approvers`: ID пользователей Matrix (например, `@owner:example.org`), которым разрешено утверждать запросы exec.
  - `agentFilter`: необязательный список разрешенных ID агентов. Не указывайте, чтобы пересылать подтверждения для всех агентов.
  - `sessionFilter`: необязательные шаблоны ключей сессий (подстрока или регулярное выражение).
  - `target`: куда отправлять запросы подтверждения. `"dm"` (по умолчанию), `"channel"` (исходная комната) или `"both"`.
  - Переопределения для аккаунта: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` управляет тем, как DM Matrix группируются в сессии: `per-user` (по умолчанию) совместно использует сессию для маршрутизируемого собеседника, а `per-room` изолирует каждую комнату DM.
- Проверки статуса Matrix и живые поиски в каталоге используют ту же политику прокси, что и трафик runtime.
- Полная конфигурация Matrix, правила адресации и примеры настройки задокументированы в [Matrix](/ru/channels/matrix).

### Microsoft Teams

Microsoft Teams поддерживается Plugin и настраивается в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, политики team/channel:
      // см. /channels/msteams
    },
  },
}
```

- Основные пути ключей, описанные здесь: `channels.msteams`, `channels.msteams.configWrites`.
- Полная конфигурация Teams (учетные данные, Webhook, политика DM/групп, переопределения для team/channel) задокументирована в [Microsoft Teams](/ru/channels/msteams).

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
- Необязательный `channels.irc.defaultAccount` переопределяет выбор аккаунта по умолчанию, когда совпадает с ID настроенного аккаунта.
- Полная конфигурация канала IRC (host/port/TLS/channels/allowlists/mention gating) задокументирована в [IRC](/ru/channels/irc).

### Несколько аккаунтов (все каналы)

Запускайте несколько аккаунтов на канал (каждый со своим `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Основной бот",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Бот оповещений",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` используется, когда `accountId` опущен (CLI + маршрутизация).
- Токены env применяются только к аккаунту **default**.
- Базовые настройки канала применяются ко всем аккаунтам, если не переопределены для аккаунта.
- Используйте `bindings[].match.accountId`, чтобы направлять каждый аккаунт к другому агенту.
- Если вы добавляете не-default аккаунт через `openclaw channels add` (или онбординг канала), оставаясь на одноаккаунтной конфигурации канала верхнего уровня, OpenClaw сначала переносит одноаккаунтные значения верхнего уровня, относящиеся к аккаунту, в карту аккаунтов канала, чтобы исходный аккаунт продолжал работать. Большинство каналов перемещают их в `channels.<channel>.accounts.default`; Matrix вместо этого может сохранить существующую совпадающую именованную/default цель.
- Существующие привязки только к каналу (без `accountId`) продолжают соответствовать аккаунту default; привязки с областью аккаунта остаются необязательными.
- `openclaw doctor --fix` также исправляет смешанные формы, перемещая одноаккаунтные значения верхнего уровня, относящиеся к аккаунту, в продвинутый аккаунт, выбранный для этого канала. Большинство каналов используют `accounts.default`; Matrix вместо этого может сохранить существующую совпадающую именованную/default цель.

### Другие каналы Plugin

Многие каналы Plugin настраиваются как `channels.<id>` и задокументированы на своих отдельных страницах каналов (например, Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat и Twitch).
См. полный индекс каналов: [Каналы](/ru/channels).

### Mention gating в групповых чатах

Для групповых сообщений по умолчанию **требуется упоминание** (упоминание в метаданных или безопасные шаблоны регулярных выражений). Применяется к групповым чатам WhatsApp, Telegram, Discord, Google Chat и iMessage.

Видимые ответы управляются отдельно. Обычные прямые запросы в группах, каналах и внутреннем WebChat по умолчанию используют автоматическую финальную доставку: финальный текст ассистента публикуется через устаревший путь видимого ответа. Включите `messages.visibleReplies: "message_tool"` или `messages.groupChat.visibleReplies: "message_tool"`, когда видимый вывод должен публиковаться только после вызова агентом `message(action=send)`. Если модель возвращает финальный текст без вызова инструмента сообщений в режиме только через инструмент, финальный текст остается приватным, а подробный журнал gateway записывает метаданные подавленной полезной нагрузки.

Видимые ответы только через инструмент требуют model/runtime, который надежно вызывает инструменты, и рекомендуются для общих фоновых комнат на моделях последнего поколения, таких как GPT 5.5. Некоторые более слабые модели могут отвечать финальным текстом, но не понимать, что видимый для источника вывод должен быть отправлен с помощью `message(action=send)`. Для таких моделей используйте `"automatic"`, чтобы финальный ход ассистента был путем видимого ответа. Если в журнале сессии виден текст ассистента с `didSendViaMessagingTool: false`, модель создала приватный финальный текст вместо вызова инструмента сообщений. Переключитесь на более сильную модель с вызовом инструментов для этого канала, проверьте подробный журнал gateway на сводку подавленной полезной нагрузки или задайте `messages.groupChat.visibleReplies: "automatic"`, чтобы использовать видимые финальные ответы для каждого запроса группы/канала.

Если инструмент сообщений недоступен при активной политике инструментов, OpenClaw откатывается к автоматическим видимым ответам вместо тихого подавления ответа. `openclaw doctor` предупреждает об этом несоответствии.

Это правило применяется к обычному финальному тексту агента. Привязки разговоров, принадлежащие Plugin, используют ответ, возвращенный владельцем Plugin, как видимый ответ для заявленных ходов привязанной ветки; Plugin не нужно вызывать `message(action=send)` для таких ответов привязок.

**Устранение неполадок: групповое @mention запускает набор текста, затем тишина (без ошибки)**

Симптом: @mention в группе/канале показывает индикатор набора текста, и журнал gateway сообщает `dispatch complete (queuedFinal=false, replies=0)`, но сообщение не появляется в комнате. DM к тому же агенту отвечают нормально.

Причина: режим видимых ответов группы/канала разрешается в `"message_tool"`, поэтому OpenClaw выполняет ход, но подавляет финальный текст ассистента, если агент не вызывает `message(action=send)`. В этом режиме нет контракта `NO_REPLY`; отсутствие вызова инструмента сообщений означает отсутствие ответа источнику. Ошибки нет, потому что подавление является настроенным поведением. Обычные ходы групп и каналов по умолчанию используют `"automatic"`, поэтому этот симптом появляется только когда `messages.groupChat.visibleReplies` (или глобальный `messages.visibleReplies`) явно задан как `"message_tool"`. Harness `defaultVisibleReplies` здесь не применяется — распознаватель групп/каналов игнорирует его; он влияет только на прямые/source чаты (harness Codex таким образом подавляет финальные ответы прямых чатов).

Исправление: либо выберите более сильную модель с вызовом инструментов, либо удалите явное переопределение `"message_tool"`, чтобы вернуться к значению по умолчанию `"automatic"`, либо задайте `messages.groupChat.visibleReplies: "automatic"`, чтобы принудительно включить видимые ответы для каждого запроса группы/канала. Gateway горячо перезагружает конфигурацию `messages` после сохранения файла; перезапускайте gateway только если в развертывании отключено наблюдение за файлами или перезагрузка конфигурации.

**Типы упоминаний:**

- **Упоминания в метаданных**: нативные @-упоминания платформы. Игнорируются в режиме self-chat WhatsApp.
- **Текстовые шаблоны**: безопасные шаблоны регулярных выражений в `agents.list[].groupChat.mentionPatterns`. Недопустимые шаблоны и небезопасное вложенное повторение игнорируются.
- Mention gating применяется только когда обнаружение возможно (нативные упоминания или хотя бы один шаблон).

```json5
{
  messages: {
    visibleReplies: "automatic", // принудительно использовать старые автоматические финальные ответы для direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // постоянно включенный неупомянутый фоновый разговор комнаты становится тихим контекстом
      visibleReplies: "message_tool", // явное включение; требовать message(action=send) для видимых ответов комнаты
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` задает глобальное значение по умолчанию. Каналы могут переопределить его с помощью `channels.<channel>.historyLimit` (или для аккаунта). Задайте `0`, чтобы отключить.

`messages.groupChat.unmentionedInbound: "room_event"` отправляет неупомянутые постоянно включенные сообщения групп/каналов как тихий контекст комнаты на поддерживаемых каналах. Упомянутые сообщения, команды и прямые сообщения остаются пользовательскими запросами. Полные примеры для Discord, Slack и Telegram см. в [Фоновые события комнаты](/ru/channels/ambient-room-events).

`messages.visibleReplies` — глобальное значение по умолчанию для source-event; `messages.groupChat.visibleReplies` переопределяет его для source-event групп/каналов. Когда `messages.visibleReplies` не задан, direct/source chats используют выбранное значение по умолчанию runtime или harness, но внутренние прямые ходы WebChat используют автоматическую финальную доставку для паритета подсказок Pi/Codex. Задайте `messages.visibleReplies: "message_tool"`, чтобы намеренно требовать `message(action=send)` для видимого вывода. Списки разрешений каналов и mention gating по-прежнему решают, обрабатывается ли событие.

#### Ограничения истории DM

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

Разрешение: переопределение для DM → значение по умолчанию провайдера → без ограничения (сохраняется всё).

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
    native: "auto", // регистрировать нативные команды, когда поддерживается
    nativeSkills: "auto", // регистрировать нативные команды Skills, когда поддерживается
    text: true, // разбирать /commands в сообщениях чата
    bash: false, // разрешить ! (псевдоним: /bash)
    bashForegroundMs: 2000,
    config: false, // разрешить /config
    mcp: false, // разрешить /mcp
    plugins: false, // разрешить /plugins
    debug: false, // разрешить /debug
    restart: true, // разрешить /restart + инструмент перезапуска gateway
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

- Этот блок настраивает поверхности команд. Текущий встроенный и поставляемый в комплекте каталог команд см. в [Слеш-команды](/ru/tools/slash-commands).
- Эта страница является **справочником по ключам конфигурации**, а не полным каталогом команд. Команды, принадлежащие каналам/Plugin, такие как QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` и Talk `/voice`, документированы на страницах соответствующих каналов/Plugin, а также в [Слеш-команды](/ru/tools/slash-commands).
- Текстовые команды должны быть **отдельными** сообщениями с начальным `/`.
- `native: "auto"` включает нативные команды для Discord/Telegram, оставляет Slack выключенным.
- `nativeSkills: "auto"` включает нативные команды Skills для Discord/Telegram, оставляет Slack выключенным.
- Переопределение для каждого канала: `channels.discord.commands.native` (логическое значение или `"auto"`). Для Discord значение `false` пропускает регистрацию нативных команд и очистку при запуске.
- Переопределите регистрацию нативных Skills для каждого канала с помощью `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` добавляет дополнительные пункты меню Telegram-бота.
- `bash: true` включает `! <cmd>` для оболочки хоста. Требует `tools.elevated.enabled` и отправителя в `tools.elevated.allowFrom.<channel>`.
- `config: true` включает `/config` (читает/записывает `openclaw.json`). Для клиентов Gateway `chat.send` постоянные записи `/config set|unset` также требуют `operator.admin`; доступная только для чтения команда `/config show` остается доступной обычным операторским клиентам с областью записи.
- `mcp: true` включает `/mcp` для конфигурации MCP-сервера, управляемой OpenClaw, в `mcp.servers`.
- `plugins: true` включает `/plugins` для обнаружения Plugin, установки и элементов управления включением/отключением.
- `channels.<provider>.configWrites` ограничивает изменения конфигурации для каждого канала (по умолчанию: true).
- Для каналов с несколькими аккаунтами `channels.<provider>.accounts.<id>.configWrites` также ограничивает записи, нацеленные на этот аккаунт (например, `/allowlist --config --account <id>` или `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` отключает `/restart` и действия инструментов перезапуска Gateway. По умолчанию: `true`.
- `ownerAllowFrom` — явный список разрешенных владельцев для команд только для владельца и действий канала, ограниченных владельцем. Он отделен от `allowFrom`.
- `ownerDisplay: "hash"` хеширует идентификаторы владельцев в системном промпте. Установите `ownerDisplaySecret`, чтобы управлять хешированием.
- `allowFrom` задается для каждого провайдера. Когда он установлен, это **единственный** источник авторизации (списки разрешенных каналов/сопряжение и `useAccessGroups` игнорируются).
- `useAccessGroups: false` позволяет командам обходить политики групп доступа, когда `allowFrom` не установлен.
- Карта документации по командам:
  - встроенный и поставляемый в комплекте каталог: [Слеш-команды](/ru/tools/slash-commands)
  - поверхности команд, специфичные для каналов: [Каналы](/ru/channels)
  - команды QQ Bot: [QQ Bot](/ru/channels/qqbot)
  - команды сопряжения: [Сопряжение](/ru/channels/pairing)
  - команда карточки LINE: [LINE](/ru/channels/line)
  - Dreaming памяти: [Dreaming](/ru/concepts/dreaming)

</Accordion>

---

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/configuration-reference) — ключи верхнего уровня
- [Конфигурация — агенты](/ru/gateway/config-agents)
- [Обзор каналов](/ru/channels)
