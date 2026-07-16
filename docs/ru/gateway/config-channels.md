---
read_when:
    - Настройка плагина канала (аутентификация, управление доступом, несколько учётных записей)
    - Устранение неполадок с ключами конфигурации для отдельных каналов
    - Аудит политики личных сообщений, политики групп и фильтрации по упоминаниям
summary: 'Настройка каналов: управление доступом, сопряжение и отдельные ключи для каждого канала в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и других сервисах'
title: Конфигурация — каналы
x-i18n:
    generated_at: "2026-07-16T16:20:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

Ключи конфигурации отдельных каналов в `channels.*`: доступ к личным сообщениям и группам, конфигурации с несколькими аккаунтами, фильтрация по упоминаниям и отдельные ключи для Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и других канальных плагинов.

Сведения об агентах, инструментах, среде выполнения Gateway и других ключах верхнего уровня см. в [справочнике по конфигурации](/ru/gateway/configuration-reference).

## Каналы

Каждый канал запускается автоматически при наличии соответствующего раздела конфигурации (если только не задано `enabled: false`). Telegram и iMessage входят в основной пакет `openclaw`. Другие официальные каналы (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost и другие) устанавливаются как отдельные плагины с помощью `openclaw plugins install <spec>`; полный список и инструкции по установке см. в разделе [Каналы](/ru/channels).

### Доступ к личным сообщениям и группам

Все каналы поддерживают политики личных сообщений и групп:

| Политика личных сообщений | Поведение                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (по умолчанию) | Неизвестные отправители получают одноразовый код сопряжения; владелец должен подтвердить |
| `allowlist`         | Только отправители из `allowFrom` (или хранилища разрешений сопряжённых отправителей)             |
| `open`              | Разрешить все входящие личные сообщения (требуется `allowFrom: ["*"]`)             |
| `disabled`          | Игнорировать все входящие личные сообщения                                          |

| Политика групп          | Поведение                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (по умолчанию) | Только группы, соответствующие настроенному списку разрешений          |
| `open`                | Не применять списки разрешённых групп (фильтрация по упоминаниям продолжает действовать) |
| `disabled`            | Блокировать все сообщения групп и комнат                          |

<Note>
`channels.defaults.groupPolicy` задаёт значение по умолчанию, если у провайдера не задано `groupPolicy`.
Срок действия кодов сопряжения истекает через 1 час. Число ожидающих запросов на сопряжение ограничено **3 на аккаунт** (в пределах канала и идентификатора аккаунта).
Если блок провайдера полностью отсутствует (нет `channels.<provider>`), политика групп среды выполнения переключается на `allowlist` (запрет по умолчанию), а при запуске выводится предупреждение.
</Note>

### Переопределение моделей для каналов

Используйте `channels.modelByChannel`, чтобы закрепить модель за конкретными идентификаторами каналов или собеседниками в личных сообщениях. В качестве значений принимаются `provider/model` или настроенные псевдонимы моделей. Сопоставление каналов применяется только тогда, когда для сеанса ещё не задано активное переопределение модели (например, через `/model`).

Для бесед в группах и ветках ключами служат зависящие от канала идентификаторы групп, идентификаторы тем или имена каналов. Для бесед в личных сообщениях ключами служат идентификаторы собеседников, полученные из идентификатора отправителя канала (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` или `SenderId`). Точный формат ключа зависит от канала:

| Канал  | Формат ключа личных сообщений         | Пример                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | исходный идентификатор пользователя         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | идентификатор пользователя Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | исходный идентификатор пользователя         | `123456789`                                  |
| WhatsApp | номер телефона или JID | `15551234567`                                |

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

Ключи, предназначенные для личных сообщений, совпадают только в беседах с личными сообщениями; они не влияют на маршрутизацию групп и веток.

### Параметры каналов по умолчанию и Heartbeat

Используйте `channels.defaults`, чтобы задать общие для провайдеров настройки политики групп и Heartbeat:

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

- `channels.defaults.groupPolicy`: резервная политика групп, если на уровне провайдера не задано `groupPolicy`.
- `channels.defaults.contextVisibility`: режим видимости дополнительного контекста по умолчанию для всех каналов. Значения: `all` (по умолчанию, включать весь контекст цитат, веток и истории), `allowlist` (включать только контекст от отправителей из списка разрешений), `allowlist_quote` (как список разрешений, но с сохранением явного контекста цитат и ответов). Переопределение для отдельного канала: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включать состояния исправных каналов в вывод Heartbeat (по умолчанию `false`).
- `channels.defaults.heartbeat.showAlerts`: включать состояния деградации и ошибок в вывод Heartbeat (по умолчанию `true`).
- `channels.defaults.heartbeat.useIndicator`: отображать компактный вывод Heartbeat в виде индикатора (по умолчанию `true`).

### WhatsApp

WhatsApp работает через веб-канал Gateway (Baileys Web). Он запускается автоматически при наличии связанного сеанса.

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

- `web.whatsapp.keepAliveIntervalMs` (по умолчанию `25000`), `connectTimeoutMs` (по умолчанию `60000`) и `defaultQueryTimeoutMs` (по умолчанию `60000`) настраивают сокет Baileys.
- Значения `web.reconnect` по умолчанию: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. При `maxAttempts: 0` повторные попытки продолжаются бесконечно вместо прекращения.
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для личных сообщений и групп WhatsApp. В `match.peer.id` укажите прямой номер в формате E.164 или JID группы WhatsApp. Семантика полей описана в разделе [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).

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

- Для исходящих команд по умолчанию используется аккаунт `default`, если он существует; в противном случае — первый настроенный идентификатор аккаунта в порядке сортировки.
- Необязательный параметр `channels.whatsapp.defaultAccount` переопределяет этот резервный выбор аккаунта по умолчанию, если совпадает с идентификатором настроенного аккаунта.
- Устаревший каталог аутентификации Baileys для одного аккаунта переносится командой `openclaw doctor` в `whatsapp/default`.
- Переопределения для отдельных аккаунтов: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Токен бота: `channels.telegram.botToken` или `channels.telegram.tokenFile` (только обычный файл; символические ссылки отклоняются), с резервным значением `TELEGRAM_BOT_TOKEN` для аккаунта по умолчанию.
- `apiRoot` — только корневой адрес Telegram Bot API. Используйте `https://api.telegram.org` или корневой адрес собственного сервера либо прокси, но не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` удаляет случайно добавленный конечный суффикс `/bot<TOKEN>`.
- Для собственного сервера Bot API в режиме `--local` параметр `trustedLocalFileRoots` перечисляет пути на хосте, которые OpenClaw может читать. Подключите том данных сервера на хосте OpenClaw и настройте корневой каталог данных или каталог отдельного токена; пути контейнера в `/var/lib/telegram-bot-api` сопоставляются с этими корневыми каталогами. Другие абсолютные пути по-прежнему отклоняются.
- Необязательный параметр `channels.telegram.defaultAccount` переопределяет выбор аккаунта по умолчанию, если совпадает с идентификатором настроенного аккаунта.
- В конфигурациях с несколькими аккаунтами (2+ идентификатора аккаунтов) задайте явный аккаунт по умолчанию (`channels.telegram.defaultAccount` или `channels.telegram.accounts.default`), чтобы избежать резервной маршрутизации; `openclaw doctor` выводит предупреждение, если он отсутствует или недействителен.
- `configWrites: false` блокирует инициированную Telegram запись конфигурации (миграции идентификаторов супергрупп, `/config set|unset`).
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для тем форума (используйте канонический `chatId:topic:topicId` в `match.peer.id`). Семантика полей описана в разделе [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).
- Предварительный просмотр потоковой передачи в Telegram использует `sendMessage` + `editMessageText` (работает в личных и групповых чатах).
- По умолчанию `network.dnsResultOrder` имеет значение `"ipv4first"`, чтобы избежать распространённых сбоев получения данных через IPv6.
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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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

- Токен: `channels.discord.token`, с `DISCORD_BOT_TOKEN` в качестве резервного варианта для учётной записи по умолчанию.
- Прямые исходящие вызовы, в которых явно указан Discord `token`, используют этот токен для вызова; настройки повторных попыток и политик учётной записи по-прежнему берутся из выбранной учётной записи в активном снимке среды выполнения.
- Необязательный параметр `channels.discord.defaultAccount` переопределяет выбор учётной записи по умолчанию, если он совпадает с идентификатором настроенной учётной записи.
- Для целей доставки используйте `user:<id>` (личные сообщения) или `channel:<id>` (канал сервера); простые числовые идентификаторы отклоняются.
- Краткие имена серверов записываются строчными буквами, а пробелы заменяются на `-`; ключи каналов используют имя в формате краткого имени (без `#`). Предпочтительно использовать идентификаторы серверов.
- Сообщения, созданные ботами, по умолчанию игнорируются. `allowBots: true` включает их; используйте `allowBots: "mentions"`, чтобы принимать только сообщения ботов, в которых упоминается бот (собственные сообщения по-прежнему отфильтровываются).
- Каналы, поддерживающие входящие сообщения от ботов, могут использовать общую [защиту от циклов ботов](/ru/channels/bot-loop-protection). Задайте `channels.defaults.botLoopProtection` для базовых бюджетов пар, а затем переопределяйте канал или учётную запись только тогда, когда для одной поверхности нужны другие ограничения.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (и переопределения каналов) отбрасывает сообщения, в которых упоминается другой пользователь или роль, но не бот (за исключением @everyone/@here).
- `channels.discord.mentionAliases` перед отправкой сопоставляет стабильный исходящий текст `@handle` с идентификаторами пользователей Discord, чтобы известных участников команды можно было упоминать детерминированно, даже когда временный кеш каталога пуст. Переопределения для отдельных учётных записей находятся в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (по умолчанию `17`) разделяет длинные по высоте сообщения, даже если они содержат менее 2000 символов.
- `channels.discord.suppressEmbeds` по умолчанию имеет значение `true`, поэтому исходящие URL-адреса не разворачиваются в предпросмотр ссылок Discord, если эта функция не отключена. Явные полезные нагрузки `embeds` по-прежнему отправляются обычным образом; вызовы инструментов для отдельных сообщений могут переопределить это поведение с помощью `suppressEmbeds`.
- `channels.discord.threadBindings` управляет маршрутизацией Discord, привязанной к веткам:
  - `enabled`: переопределение Discord для функций сеансов, привязанных к веткам (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а также привязанная доставка и маршрутизация)
  - `idleHours`: переопределение Discord для автоматической потери фокуса после бездействия в часах (`0` отключает)
  - `maxAgeHours`: переопределение Discord для жёсткого максимального возраста в часах (`0` отключает)
  - `spawnSessions`: переключатель автоматического создания и привязки веток для `sessions_spawn({ thread: true })` и создания веток ACP (по умолчанию: `true`)
  - `defaultSpawnContext`: собственный контекст подагента для запусков, привязанных к веткам (по умолчанию `"fork"`)
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для каналов и веток (используйте идентификатор канала или ветки в `match.peer.id`). Семантика полей описана в разделе [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задаёт акцентный цвет для контейнеров компонентов Discord v2.
- `channels.discord.agentComponents.ttlMs` определяет, как долго обратные вызовы отправленных компонентов Discord остаются зарегистрированными. По умолчанию `1800000` (30 минут), максимум `86400000` (24 часа). Переопределения для отдельных учётных записей находятся в `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Предпочтительно использовать самый короткий TTL, подходящий для рабочего процесса.
- `channels.discord.voice` включает разговоры в голосовых каналах Discord и необязательные переопределения автоматического подключения, LLM и TTS. В конфигурациях Discord только для текста голосовые функции по умолчанию отключены; задайте `channels.discord.voice.enabled=true`, чтобы включить их.
- `channels.discord.voice.model` при необходимости переопределяет модель LLM, используемую для ответов в голосовых каналах Discord.
- `channels.discord.voice.daveEncryption` (по умолчанию `true`) и `channels.discord.voice.decryptionFailureTolerance` (по умолчанию `24`) передаются в параметры DAVE `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` управляет начальным ожиданием состояния `@discordjs/voice` Ready для `/vc join` и попыток автоматического подключения (по умолчанию `30000`).
- `channels.discord.voice.reconnectGraceMs` определяет, сколько времени отключённый голосовой сеанс может потратить на переход к сигнализации повторного подключения, прежде чем OpenClaw уничтожит его (по умолчанию `15000`).
- Воспроизведение голоса в Discord не прерывается событием начала речи другого пользователя. Чтобы избежать циклов обратной связи, OpenClaw игнорирует новый захват голоса во время воспроизведения TTS.
- Кроме того, OpenClaw пытается восстановить приём голоса, выходя из голосового сеанса и повторно подключаясь к нему после нескольких сбоев расшифровки.
- `channels.discord.streaming` — канонический ключ режима потоковой передачи. По умолчанию Discord использует `streaming.mode: "progress"`, поэтому ход работы инструментов и выполнения отображается в одном редактируемом сообщении предварительного просмотра; задайте `streaming.mode: "off"`, чтобы отключить это. Устаревшие плоские ключи (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) больше не считываются во время выполнения; запустите `openclaw doctor --fix`, чтобы перенести сохранённую конфигурацию.
- `channels.discord.autoPresence` сопоставляет доступность среды выполнения со статусом присутствия бота (healthy => в сети, degraded => неактивен, exhausted => не беспокоить) и позволяет при необходимости переопределить текст статуса.
- `channels.discord.guilds.<id>.presenceEvents` направляет события появления доступных пользователей в один настроенный канал Discord как системные события агента. Подходящие участники должны иметь возможность просматривать `channelId`; публичные ветки наследуют видимость родительского канала, а для приватных веток дополнительно требуется участие или разрешение Manage Threads. `users` может дополнительно сузить эту аудиторию. Текущий список участников в сети заполняется из полных снимков `GUILD_CREATE`, отслеживаются наблюдаемые переходы из состояния не в сети в состояние в сети, а первый более поздний сигнал о появлении в сети для ранее не замеченного участника считается новой доступностью без утверждения о том, появился ли он в сети или присоединился после создания снимка. Для серверов, превышающих ограничение Discord на снимок в 75 000 участников, сначала требуется явное обновление состояния не в сети. Параметры регулирования: `reconnectSuppressSeconds` (период бездействия после нового сеанса Gateway, пока восстанавливается состояние присутствия на сервере; по умолчанию 300, `0` отключает) и `burstLimit`/`burstWindowSeconds` (ограничение частоты успешно поставленных в очередь событий для каждого сервера; по умолчанию 8 событий за скользящее окно 60s). Возобновлённые сеансы не запускают окно подавления повторного подключения. Существующий период ожидания повторного приветствия для каждого пользователя остаётся равным восьми часам. Для этого требуются `channels.discord.intents.presence=true`, привилегированное разрешение Presence Intent в Developer Portal Discord и включённый Heartbeat агента.
- `channels.discord.dangerouslyAllowNameMatching` повторно включает сопоставление изменяемых имён и тегов (аварийный режим совместимости).
- `channels.discord.execApprovals`: встроенная в Discord доставка запросов на одобрение выполнения и авторизация утверждающих пользователей.
  - `enabled`: `true`, `false` или `"auto"` (по умолчанию). В автоматическом режиме одобрение выполнения активируется, когда утверждающих пользователей можно определить из `approvers` или `commands.ownerAllowFrom`.
  - `approvers`: идентификаторы пользователей Discord, которым разрешено одобрять запросы на выполнение. Если параметр не указан, используется `commands.ownerAllowFrom`.
  - `agentFilter`: необязательный список разрешённых идентификаторов агентов. Не указывайте его, чтобы пересылать запросы на одобрение для всех агентов.
  - `sessionFilter`: необязательные шаблоны ключей сеансов (подстрока или регулярное выражение).
  - `target`: куда отправлять запросы на одобрение. `"dm"` (по умолчанию) отправляет их в личные сообщения утверждающим пользователям, `"channel"` — в исходный канал, `"both"` — в оба места. Когда цель включает `"channel"`, кнопки могут использовать только определённые утверждающие пользователи.
  - `cleanupAfterResolve`: при значении `true` удаляет личные сообщения с запросами на одобрение после одобрения, отказа или истечения времени ожидания.

**Режимы уведомлений о реакциях:** `off` (нет), `own` (сообщения бота, по умолчанию), `all` (все сообщения), `allowlist` (от `guilds.<id>.users` для всех сообщений).

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

- JSON учётной записи службы: встроенный (`serviceAccount`) или файловый (`serviceAccountFile`).
- Также поддерживается SecretRef учётной записи службы (`serviceAccountRef`).
- Резервные переменные среды: `GOOGLE_CHAT_SERVICE_ACCOUNT` или `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (только для учётной записи по умолчанию).
- Для целей доставки используйте `spaces/<spaceId>` или `users/<userId>`.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно включает сопоставление изменяемого основного адреса электронной почты (аварийный режим совместимости).

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
          systemPrompt: "Только короткие ответы.",
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
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // использовать нативный API потоковой передачи Slack при mode=partial
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

- **Режим Socket** требует как `botToken`, так и `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного использования переменных окружения учётной записи по умолчанию).
- **Режим HTTP** требует `botToken` вместе с `signingSecret` (в корне или для отдельной учётной записи).
- `enterpriseOrgInstall: true` подключает учётную запись к
  общекорпоративному пути событий Slack Enterprise Grid. При запуске токен бота
  проверяется с помощью `auth.test`, и запуск завершается ошибкой, если
  настроенный режим не соответствует идентификатору установки Slack.
  Личные сообщения Enterprise должны быть отключены либо использовать
  `dmPolicy: "open"` с действующим `allowFrom: ["*"]`. Политики каналов и
  пользователей должны использовать стабильные идентификаторы Slack;
  изменяемые имена и неподдерживаемые префиксы каналов приводят к ошибке запуска.
  V1 обрабатывает только прямые события Socket Mode или HTTP `message`
  и `app_mention` с немедленными ответами; ретрансляция, команды,
  взаимодействия, App Home, обработчики событий реакций, закрепления,
  инструменты действий, нативные подтверждения, привязки, отложенная доставка
  и проактивные отправки недоступны. Подтверждение получения, индикация набора
  текста и реакции состояния, которыми управляет обработчик, остаются доступны
  с `reactions:write`; входящие уведомления о реакциях и инструменты действий
  с реакциями недоступны. Сведения о манифесте с минимальными привилегиями,
  процессе настройки и полном списке ограничений см. в разделе
  [Общекорпоративные установки Enterprise Grid](/ru/channels/slack#enterprise-grid-org-wide-installs).
- `socketMode` передаёт параметры настройки транспорта Socket Mode SDK Slack в публичный API приёмника Bolt. Используйте его только при исследовании тайм-аутов ping/pong или поведения устаревшего WebSocket-соединения. Значение `clientPingTimeout` по умолчанию — `15000`; `serverPingTimeout` и `pingPongLoggingEnabled` передаются только при явной настройке.
- `botToken`, `appToken`, `signingSecret` и `userToken` принимают строки
  с открытым текстом или объекты SecretRef.
- Снимки учётных записей Slack предоставляют поля источника и состояния для каждого набора учётных данных, например
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в режиме HTTP —
  `signingSecretStatus`. `configured_unavailable` означает, что учётная запись
  настроена через SecretRef, но текущему пути команды или среды выполнения
  не удалось получить значение секрета.
- `configWrites: false` блокирует инициированные Slack изменения конфигурации.
- Необязательный `channels.slack.defaultAccount` переопределяет выбор учётной записи по умолчанию, если совпадает с идентификатором настроенной учётной записи.
- `channels.slack.streaming.mode` — канонический ключ режима потоковой передачи Slack (по умолчанию `"partial"`). `channels.slack.streaming.nativeTransport` управляет нативным транспортом потоковой передачи Slack (по умолчанию `true`). Устаревшие значения `streamMode`, логическое `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` и `nativeStreaming` больше не считываются во время выполнения; запустите `openclaw doctor --fix`, чтобы перенести сохранённую конфигурацию в `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` и `unfurlMedia` передают логические параметры Slack `chat.postMessage` для разворачивания ссылок и медиафайлов в ответах бота. Значение `unfurlLinks` по умолчанию — `false`, поэтому исходящие ссылки бота не разворачиваются в тексте, если это не включено; `unfurlMedia` не передаётся, если не настроен. Задайте любое из значений в `channels.slack.accounts.<accountId>`, чтобы переопределить значение верхнего уровня для одной учётной записи.
- Для целей доставки используйте `user:<id>` (личное сообщение) или `channel:<id>`.

**Режимы уведомлений о реакциях:** `off`, `own` (по умолчанию), `all`, `allowlist` (из `reactionAllowlist`).

**Изоляция сеансов веток:** `thread.historyScope` задаёт отдельный сеанс для каждой ветки (по умолчанию) или общий сеанс для всего канала. `thread.inheritParent` копирует историю родительского канала в новые ветки. `thread.initialHistoryLimit` (по умолчанию `20`) ограничивает количество существующих сообщений ветки, загружаемых при запуске нового сеанса ветки; `0` отключает загрузку истории веток.

- Нативная потоковая передача Slack и состояние ветки «is typing...» в стиле ассистента Slack требуют, чтобы целью ответа была ветка. Личные сообщения верхнего уровня по умолчанию остаются вне веток, поэтому они всё равно могут передаваться потоком через предварительный просмотр Slack с публикацией и редактированием черновика, а не отображать нативный предварительный просмотр потока и состояния в стиле ветки.
- `typingReaction` добавляет временную реакцию к входящему сообщению Slack на время формирования ответа, а затем удаляет её после завершения. Используйте короткий код эмодзи Slack, например `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативная доставка клиенту подтверждений Slack и авторизация подтверждающего выполнение. Схема совпадает с Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (идентификаторы пользователей Slack), `agentFilter`, `sessionFilter` и `target` (`"dm"`, `"channel"` или `"both"`). Подтверждения плагинов могут использовать этот нативный клиентский путь для запросов из Slack, когда удаётся определить подтверждающих плагина Slack; нативную доставку подтверждений плагинов в Slack также можно включить через `approvals.plugin` для сеансов из Slack или целей Slack. Для подтверждений плагинов используются подтверждающие плагина Slack из `allowFrom` и маршрутизация по умолчанию, а не подтверждающие выполнение.

| Группа действий | По умолчанию | Примечания                          |
| --------------- | ------------ | ----------------------------------- |
| reactions       | включено     | Добавление и просмотр реакций       |
| messages        | включено     | Чтение, отправка, изменение, удаление |
| pins            | включено     | Закрепление, открепление, просмотр  |
| memberInfo      | включено     | Сведения об участнике               |
| emojiList       | включено     | Список пользовательских эмодзи      |

### Mattermost

Mattermost устанавливается как отдельный плагин — так же, как Discord, Slack и WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Перед фиксацией версии проверьте актуальные теги дистрибутива на странице [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost).

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
        native: true, // включается явно
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Необязательный явный URL для развёртываний с обратным прокси или публичным доступом
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Режимы чата: `oncall` (отвечать при @-упоминании, по умолчанию), `onmessage` (на каждое сообщение), `onchar` (на сообщения, начинающиеся с префикса-триггера).

Когда нативные команды Mattermost включены:

- `commands.callbackPath` должен быть путём (например, `/api/channels/mattermost/command`), а не полным URL.
- `commands.callbackUrl` должен разрешаться в конечную точку Gateway OpenClaw и быть доступен с сервера Mattermost.
- Нативные обратные вызовы команд с косой чертой аутентифицируются с помощью токенов отдельных команд, возвращаемых
  Mattermost при регистрации команд с косой чертой. Если регистрация завершается
  ошибкой или ни одна команда не активирована, OpenClaw отклоняет обратные вызовы с
  `Unauthorized: invalid command token.`
- Для частных, внутренних или доступных только через tailnet узлов обратного вызова Mattermost может потребовать,
  чтобы `ServiceSettings.AllowedUntrustedInternalConnections` включал узел или домен обратного вызова.
  Используйте значения узла или домена, а не полные URL.
- `channels.mattermost.configWrites`: разрешить или запретить инициированные Mattermost изменения конфигурации.
- `channels.mattermost.requireMention`: требовать `@mention` перед ответом в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: переопределение требования упоминания для отдельного канала (`"*"` для значения по умолчанию).
- Необязательный `channels.mattermost.defaultAccount` переопределяет выбор учётной записи по умолчанию, если совпадает с идентификатором настроенной учётной записи.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // необязательная привязка учётной записи
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

- `channels.signal.account`: привязать запуск канала к идентификатору определённой учётной записи Signal.
- `channels.signal.configWrites`: разрешить или запретить инициированные Signal изменения конфигурации.
- Необязательный `channels.signal.defaultAccount` переопределяет выбор учётной записи по умолчанию, если совпадает с идентификатором настроенной учётной записи.

### iMessage

OpenClaw запускает `imsg rpc` (JSON-RPC через стандартные потоки ввода-вывода). Демон или порт не требуются. Это предпочтительный путь для новых конфигураций OpenClaw iMessage, если узлу можно предоставить разрешения на доступ к базе данных Messages и автоматизацию.

Поддержка BlueBubbles удалена. `channels.bluebubbles` не является поддерживаемой поверхностью конфигурации среды выполнения в текущей версии OpenClaw. Перенесите старые конфигурации в `channels.imessage`; краткую версию см. в разделе [Удаление BlueBubbles и путь imsg для iMessage](/ru/announcements/bluebubbles-imessage), а полную таблицу преобразования — в разделе [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles).

Если Gateway работает не на компьютере Mac, на котором выполнен вход в Messages, сохраните `channels.imessage.enabled=true` и задайте для `channels.imessage.cliPath` SSH-обёртку, запускающую `imsg "$@"` на этом Mac. Локальный путь `imsg` по умолчанию поддерживается только в macOS.

Прежде чем полагаться на SSH-обёртку для производственных отправок, проверьте исходящий `imsg send` через эту конкретную обёртку. В некоторых состояниях TCC macOS разрешение на автоматизацию Messages назначается `/usr/libexec/sshd-keygen-wrapper`, из-за чего чтение и проверки могут работать, а отправка — завершаться ошибкой AppleEvents `-1743`; см. раздел устранения неполадок SSH-обёртки в [iMessage](/ru/channels/imessage).

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

- Необязательный параметр `channels.imessage.defaultAccount` переопределяет выбор учётной записи по умолчанию, если он совпадает с идентификатором настроенной учётной записи.
- Требуется полный доступ к диску для базы данных Messages.
- Предпочтительно использовать цели `chat_id:<id>`. Для вывода списка чатов используйте `imsg chats --limit 20`.
- `cliPath` может указывать на SSH-обёртку; задайте `remoteHost` (`host` или `user@host`) для получения вложений через SCP.
- `attachmentRoots` и `remoteAttachmentRoots` ограничивают пути входящих вложений (по умолчанию: `/Users/*/Library/Messages/Attachments`).
- SCP использует строгую проверку ключа хоста, поэтому убедитесь, что ключ ретрансляционного хоста уже присутствует в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: разрешить или запретить инициированную из iMessage запись конфигурации.
- `channels.imessage.sendTransport`: предпочтительный транспорт отправки RPC `imsg` для обычных исходящих ответов. `auto` (по умолчанию) использует мост IMCore для существующих чатов, когда он запущен, а затем переходит на AppleScript; `bridge` требует доставки через закрытый API; `applescript` принудительно использует общедоступный путь автоматизации Messages.
- `channels.imessage.actions.*`: включить действия закрытого API, которые также ограничиваются параметрами `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` по умолчанию отключён; задайте для него `true`, прежде чем ожидать появления входящих медиафайлов в ходе работы агента.
- Восстановление входящих сообщений после перезапуска моста/Gateway выполняется автоматически (дедупликация по GUID и ограничение возраста устаревшей очереди). Существующие конфигурации `channels.imessage.catchup.enabled: true` по-прежнему поддерживаются как устаревший профиль совместимости; `catchup` по умолчанию отключён.
- `channels.imessage.groups`: реестр групп и настройки отдельных групп. При использовании `groupPolicy: "allowlist"` настройте либо явные ключи `chat_id`, либо запись с подстановочным знаком `"*"`, чтобы групповые сообщения могли пройти проверку реестра.
- Записи верхнего уровня `bindings[]` с `type: "acp"` могут привязывать разговоры iMessage к постоянным сеансам ACP. В `match.peer.id` используйте нормализованный дескриптор или явную цель чата (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`). Общая семантика полей: [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Пример SSH-обёртки iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix работает через плагин и настраивается в `channels.matrix`.

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
- `channels.matrix.proxy` направляет HTTP-трафик Matrix через явно заданный HTTP(S)-прокси. Именованные учётные записи могут переопределять его с помощью `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` разрешает частные/внутренние домашние серверы. `proxy` и это разрешение сетевого доступа являются независимыми средствами управления.
- `channels.matrix.defaultAccount` выбирает предпочтительную учётную запись в конфигурациях с несколькими учётными записями.
- По умолчанию `channels.matrix.autoJoin` имеет значение `"off"`, поэтому приглашения в комнаты и новые приглашения в стиле личных сообщений игнорируются, пока не будет задан `autoJoin: "allowlist"` с `autoJoinAllowlist` или `autoJoin: "always"`.
- `channels.matrix.execApprovals`: встроенная в Matrix доставка запросов на подтверждение выполнения и авторизация подтверждающих пользователей.
  - `enabled`: `true`, `false` или `"auto"` (по умолчанию). В автоматическом режиме подтверждения выполнения активируются, когда подтверждающих пользователей удаётся определить из `approvers` или `commands.ownerAllowFrom`.
  - `approvers`: идентификаторы пользователей Matrix (например, `@owner:example.org`), которым разрешено подтверждать запросы на выполнение.
  - `agentFilter`: необязательный список разрешённых идентификаторов агентов. Не указывайте его, чтобы пересылать подтверждения для всех агентов.
  - `sessionFilter`: необязательные шаблоны ключей сеансов (подстрока или регулярное выражение).
  - `target`: куда отправлять запросы на подтверждение. `"dm"` (по умолчанию), `"channel"` (исходная комната) или `"both"`.
  - Переопределения для отдельных учётных записей: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` определяет, как личные сообщения Matrix группируются в сеансы: `per-user` (по умолчанию) использует общий сеанс для маршрутизированного собеседника, а `per-room` изолирует каждую комнату личных сообщений.
- Проверки состояния Matrix и оперативные запросы к каталогу используют ту же политику прокси, что и трафик среды выполнения.
- Полная конфигурация Matrix, правила выбора целей и примеры настройки описаны в [Matrix](/ru/channels/matrix).

### Microsoft Teams

Microsoft Teams работает через плагин и настраивается в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // политики appId, appPassword, tenantId, webhook, команды/канала:
      // см. /channels/msteams
    },
  },
}
```

- Рассматриваемые здесь основные пути ключей: `channels.msteams`, `channels.msteams.configWrites`.
- Полная конфигурация Teams (учётные данные, webhook, политика личных сообщений/групп, переопределения для отдельных команд/каналов) описана в [Microsoft Teams](/ru/channels/msteams).

### IRC

IRC работает через плагин и настраивается в `channels.irc`.

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

- Рассматриваемые здесь основные пути ключей: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Необязательный параметр `channels.irc.defaultAccount` переопределяет выбор учётной записи по умолчанию, если он совпадает с идентификатором настроенной учётной записи.
- Полная конфигурация канала IRC (хост/порт/TLS/каналы/списки разрешённых пользователей/проверка упоминаний) описана в разделе [IRC](/ru/channels/irc).

### Несколько учётных записей (все каналы)

Используйте несколько учётных записей для каждого канала (каждая со своим `accountId`):

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

- `default` используется, когда `accountId` не указан (CLI + маршрутизация).
- Токены из переменных среды применяются только к учётной записи **по умолчанию**.
- Базовые настройки канала применяются ко всем учётным записям, если не переопределены для конкретной учётной записи.
- Используйте `bindings[].match.accountId`, чтобы направить каждую учётную запись отдельному агенту.
- Если добавить учётную запись не по умолчанию через `openclaw channels add` (или первоначальную настройку канала), продолжая использовать конфигурацию канала верхнего уровня с одной учётной записью, OpenClaw сначала переносит относящиеся к учётной записи значения верхнего уровня из конфигурации одной учётной записи в карту учётных записей канала, чтобы исходная учётная запись продолжила работать. Большинство каналов перемещают их в `channels.<channel>.accounts.default`; Matrix вместо этого может сохранить существующую совпадающую именованную цель или цель по умолчанию.
- Существующие привязки только к каналу (без `accountId`) продолжают соответствовать учётной записи по умолчанию; привязки к конкретным учётным записям остаются необязательными.
- `openclaw doctor --fix` также исправляет смешанные структуры, перемещая относящиеся к учётной записи значения верхнего уровня из конфигурации одной учётной записи в назначенную для этого канала учётную запись. Большинство каналов используют `accounts.default`; Matrix вместо этого может сохранить существующую совпадающую именованную цель или цель по умолчанию.

### Другие каналы-плагины

Многие каналы-плагины настраиваются как `channels.<id>` и описаны на посвящённых им страницах каналов (например, Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch и Zalo).
Полный указатель каналов: [Каналы](/ru/channels).

### Проверка упоминаний в групповых чатах

Для групповых сообщений по умолчанию **требуется упоминание** (упоминание в метаданных или безопасные шаблоны регулярных выражений). Это относится к групповым чатам WhatsApp, Telegram, Discord, Google Chat и iMessage.

Видимые ответы управляются отдельно. Для обычных прямых запросов в группах, каналах и внутреннем WebChat по умолчанию выполняется автоматическая доставка итогового ответа: итоговый текст ассистента публикуется через прежний путь видимого ответа. Включите `messages.visibleReplies: "message_tool"` или `messages.groupChat.visibleReplies: "message_tool"`, если видимый вывод должен публиковаться только после вызова агентом `message(action=send)`. Если в режиме только с инструментами модель возвращает содержательный итоговый ответ без вызова инструмента сообщений, этот итоговый текст остаётся закрытым, подробный журнал Gateway фиксирует метаданные подавленной полезной нагрузки, а OpenClaw ставит в очередь одну повторную попытку восстановления с просьбой к модели доставить тот же ответ через `message(action=send)`.

Для видимых ответов только через инструменты требуется модель/среда выполнения, которая надёжно вызывает инструменты; этот режим рекомендуется для общих фоновых комнат при использовании моделей последнего поколения, таких как GPT-5.6 Sol. Некоторые более слабые модели могут выдавать итоговый текст, но не понимают, что видимый в исходном канале вывод необходимо отправлять с помощью `message(action=send)`. По умолчанию OpenClaw восстанавливает распространённый случай недоставленного итогового ответа, только если ответ содержателен, исходный ход не был событием комнаты, политика отправки не запрещала доставку и ответ в исходный канал ещё не был отправлен. Восстановление ограничено одной повторной попыткой; для синтетического запроса повторной попытки отключается сохранение, а сам запрос исключается из пакетного сбора, чтобы он не мог объединиться с не связанными с ним запросами в очереди. Если повторная попытка также не доставляет ответ или её невозможно поставить в очередь, OpenClaw доставляет только очищенное диагностическое сообщение, например «Ответ был создан, но доставить его в этот чат не удалось. Повторите попытку». Исходный закрытый итоговый текст никогда не помечается для автоматической доставки в исходный канал. Для моделей, которые неоднократно не доставляют ответы, используйте `"automatic"`, чтобы итоговый ход ассистента служил путём видимого ответа, перейдите на более мощную модель с поддержкой вызова инструментов, изучите сводку подавленной полезной нагрузки в подробном журнале Gateway или задайте `messages.groupChat.visibleReplies: "automatic"`, чтобы использовать видимые итоговые ответы для каждого запроса из группы/канала.

Если инструмент сообщений недоступен при активной политике инструментов, OpenClaw вместо скрытого подавления ответа возвращается к автоматическим видимым ответам. `openclaw doctor` предупреждает об этом несоответствии.

Это правило применяется к обычному итоговому тексту агента. Для ходов в заявленных привязанных ветках привязки разговоров, принадлежащие плагинам, используют возвращённый соответствующим плагином ответ как видимый; для таких ответов привязки плагину не требуется вызывать `message(action=send)`.

**Устранение неполадок: после @упоминания в группе появляется индикатор набора текста, а затем ничего не происходит (ошибок нет)**

Симптом: после @упоминания в группе/канале отображается индикатор набора текста, а журнал Gateway сообщает `dispatch complete (queuedFinal=false, replies=0)`, но сообщение в комнате не появляется. Личные сообщения тому же агенту получают ответы как обычно.

Причина: режим видимых ответов для группы/канала разрешается в `"message_tool"`, поэтому OpenClaw выполняет ход, но подавляет итоговый текст ассистента, если агент не вызывает `message(action=send)`. В этом режиме контракт `NO_REPLY` отсутствует; если инструмент сообщений не вызван, исходный итоговый текст остаётся приватным. Для содержательных исходных ходов OpenClaw теперь предпринимает одну защищённую повторную попытку восстановления; короткие заметки, явное молчание, события комнаты, ходы, отклонённые политикой отправки, и уже доставленные ходы повторно не выполняются. Для обычных ходов в группах и каналах по умолчанию используется `"automatic"`, поэтому этот симптом возникает только тогда, когда для `messages.groupChat.visibleReplies` (или глобального `messages.visibleReplies`) явно задано значение `"message_tool"`. Параметр среды выполнения `defaultVisibleReplies` здесь не применяется — распознаватель группы/канала его игнорирует; он влияет только на прямые/исходные чаты (среда выполнения Codex таким образом подавляет итоговые сообщения в прямых чатах).

Исправление: выберите модель с более надёжным вызовом инструментов, удалите явное переопределение `"message_tool"`, чтобы вернуться к значению по умолчанию `"automatic"`, либо задайте `messages.groupChat.visibleReplies: "automatic"`, чтобы принудительно включить видимые ответы для каждого запроса группы/канала. Содержательный недоставленный итоговый ответ больше не должен завершаться молчаливым успехом: он либо должен восстановиться за одну повторную попытку `message(action=send)`, либо показать очищенное диагностическое сообщение об ошибке доставки. Gateway перезагружает конфигурацию `messages` без перезапуска после сохранения файла; перезапускайте Gateway только в том случае, если в развёртывании отключено наблюдение за файлами или перезагрузка конфигурации.

**Типы упоминаний:**

- **Упоминания в метаданных**: нативные @-упоминания платформы. Игнорируются в режиме чата с самим собой в WhatsApp.
- **Текстовые шаблоны**: безопасные регулярные выражения в `agents.list[].groupChat.mentionPatterns`. Недопустимые шаблоны и небезопасные вложенные повторения игнорируются.
- Фильтрация по упоминаниям применяется только тогда, когда их можно обнаружить (нативные упоминания или хотя бы один шаблон).

```json5
{
  messages: {
    visibleReplies: "automatic", // принудительно использовать прежние автоматические итоговые ответы для прямых/исходных чатов
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // всегда активные сообщения комнаты без упоминания становятся ненавязчивым контекстом
      visibleReplies: "message_tool", // включается явно; для видимых ответов в комнате требуется message(action=send)
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` задаёт глобальное значение по умолчанию. Каналы могут переопределить его с помощью `channels.<channel>.historyLimit` (в том числе отдельно для каждой учётной записи). Чтобы отключить, задайте `0`.

`messages.groupChat.unmentionedInbound: "room_event"` передаёт всегда активные сообщения групп/каналов без упоминания как ненавязчивый контекст комнаты в поддерживаемых каналах. Сообщения с упоминаниями, команды и прямые сообщения остаются пользовательскими запросами. Полные примеры для Discord, Slack и Telegram см. в разделе [Фоновые события комнаты](/ru/channels/ambient-room-events).

`messages.visibleReplies` — глобальное значение по умолчанию для исходных событий; `messages.groupChat.visibleReplies` переопределяет его для исходных событий групп/каналов. Если `messages.visibleReplies` не задан, прямые/исходные чаты используют значение по умолчанию выбранной среды выполнения или испытательной среды, но внутренние прямые ходы WebChat используют автоматическую доставку итогового ответа для согласованности запросов Pi/Codex. Задайте `messages.visibleReplies: "message_tool"`, чтобы намеренно требовать `message(action=send)` для видимого вывода. Списки разрешённых каналов и фильтрация по упоминаниям по-прежнему определяют, будет ли обработано событие.

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

Порядок разрешения: переопределение для конкретного личного чата → значение по умолчанию поставщика → без ограничения (сохраняется всё).

Этот распознаватель считывает `channels.<provider>.dmHistoryLimit` и `channels.<provider>.dms.<id>.historyLimit` для любого канала, ключ сеанса которого соответствует стандартному формату `provider:direct:<id>` (или устаревшему `provider:dm:<id>`), поэтому он работает как со встроенными каналами, так и с каналами-плагинами, а не только с фиксированным списком.

#### Режим чата с самим собой

Добавьте собственный номер в `allowFrom`, чтобы включить режим чата с самим собой (нативные @-упоминания игнорируются, ответы отправляются только при совпадении с текстовыми шаблонами):

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
    native: "auto", // регистрировать нативные команды, если они поддерживаются
    nativeSkills: "auto", // регистрировать нативные команды Skills, если они поддерживаются
    text: true, // разбирать /команды в сообщениях чата
    bash: false, // разрешить ! (псевдоним: /bash)
    bashForegroundMs: 2000,
    config: false, // разрешить /config
    mcp: false, // разрешить /mcp
    plugins: false, // разрешить /plugins
    debug: false, // разрешить /debug
    restart: true, // разрешить /restart и внешние запросы перезапуска SIGUSR1
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

- Этот блок настраивает интерфейсы команд. Текущий каталог встроенных и поставляемых в комплекте команд см. в разделе [Команды с косой чертой](/ru/tools/slash-commands).
- Эта страница представляет собой **справочник ключей конфигурации**, а не полный каталог команд. Команды, принадлежащие каналам/плагинам, такие как QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, сопряжение устройств `/pair`, память `/dreaming`, управление телефоном `/phone` и Talk `/voice`, описаны на страницах соответствующих каналов/плагинов и в разделе [Команды с косой чертой](/ru/tools/slash-commands).
- Текстовые команды должны быть **отдельными** сообщениями с начальным `/`.
- `native: "auto"` включает нативные команды для Discord/Telegram и оставляет их отключёнными для Slack.
- `nativeSkills: "auto"` включает нативные команды Skills для Discord/Telegram и оставляет их отключёнными для Slack.
- Переопределение для отдельных каналов: `channels.discord.commands.native` (логическое значение или `"auto"`). Для Discord параметр `false` пропускает регистрацию и очистку нативных команд при запуске.
- Переопределить регистрацию нативных команд Skills для отдельных каналов можно с помощью `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` добавляет дополнительные пункты меню бота Telegram.
- `bash: true` включает `! <cmd>` для оболочки хоста. Требуются `tools.elevated.enabled` и наличие отправителя в `tools.elevated.allowFrom.<channel>`.
- `config: true` включает `/config` (чтение/запись `openclaw.json`). Для клиентов Gateway `chat.send` постоянная запись `/config set|unset` также требует `operator.admin`; доступный только для чтения `/config show` остаётся доступным обычным клиентам-операторам с областью записи.
- `mcp: true` включает `/mcp` для конфигурации управляемого OpenClaw сервера MCP в `mcp.servers`.
- `plugins: true` включает `/plugins` для обнаружения, установки, включения и отключения плагинов.
- `channels.<provider>.configWrites` управляет разрешением на изменение конфигурации отдельно для каждого канала (по умолчанию: true).
- Для каналов с несколькими учётными записями `channels.<provider>.accounts.<id>.configWrites` также управляет записью, направленной на эту учётную запись (например, `/allowlist --config --account <id>` или `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` отключает `/restart` и внешние запросы перезапуска `SIGUSR1`. Значение по умолчанию: `true`.
- `ownerAllowFrom` — явный список разрешённых владельцев для команд только для владельцев и действий канала, доступных только владельцам. Он не связан с `allowFrom`.
- `ownerDisplay: "hash"` хеширует идентификаторы владельцев в системном запросе. Для управления хешированием задайте `ownerDisplaySecret`.
- `allowFrom` задаётся отдельно для каждого поставщика. Если он задан, то является **единственным** источником авторизации (списки разрешённых каналов, сопряжение и `useAccessGroups` игнорируются).
- `useAccessGroups: false` позволяет командам обходить политики групп доступа, если `allowFrom` не задан.
- Карта документации по командам:
  - каталог встроенных и поставляемых в комплекте команд: [Команды с косой чертой](/ru/tools/slash-commands)
  - интерфейсы команд для отдельных каналов: [Каналы](/ru/channels)
  - команды QQ Bot: [QQ Bot](/ru/channels/qqbot)
  - команды сопряжения: [Сопряжение](/ru/channels/pairing)
  - команда карточки LINE: [LINE](/ru/channels/line)
  - Dreaming памяти: [Dreaming](/ru/concepts/dreaming)

</Accordion>

---

## Связанные разделы

- [Справочник по конфигурации](/ru/gateway/configuration-reference) — ключи верхнего уровня
- [Конфигурация — агенты](/ru/gateway/config-agents)
- [Обзор каналов](/ru/channels)
