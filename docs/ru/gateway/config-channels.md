---
read_when:
    - Настройка плагина канала (аутентификация, управление доступом, несколько учётных записей)
    - Устранение неполадок с ключами конфигурации отдельных каналов
    - Аудит политики личных сообщений, групповой политики или фильтрации по упоминаниям
summary: 'Настройка каналов: управление доступом, сопряжение и отдельные ключи для каждого канала в Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и других сервисах'
title: Конфигурация — каналы
x-i18n:
    generated_at: "2026-07-13T18:08:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 0646e26517bd65b0b2631e24efe22ced83c807811487aee1afacce3a6b66997b
    source_path: gateway/config-channels.md
    workflow: 16
---

Параметры конфигурации отдельных каналов в `channels.*`: доступ к личным сообщениям и группам, настройка нескольких учётных записей, фильтрация по упоминаниям, а также параметры отдельных каналов для Slack, Discord, Telegram, WhatsApp, Matrix, iMessage и других плагинов каналов.

Параметры агентов, инструментов, среды выполнения Gateway и другие параметры верхнего уровня см. в [справочнике по конфигурации](/ru/gateway/configuration-reference).

## Каналы

Каждый канал запускается автоматически, если существует его раздел конфигурации (если только не задано `enabled: false`). Telegram и iMessage входят в основной пакет `openclaw`. Другие официальные каналы (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost и другие) устанавливаются как отдельные плагины с помощью `openclaw plugins install <spec>`; полный список и инструкции по установке см. в разделе [Каналы](/ru/channels).

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
| `open`                | Не применять списки разрешений групп (фильтрация по упоминаниям продолжает действовать) |
| `disabled`            | Блокировать все сообщения групп и комнат                          |

<Note>
`channels.defaults.groupPolicy` задаёт значение по умолчанию, если параметр `groupPolicy` провайдера не задан.
Срок действия кодов сопряжения истекает через 1 час. Количество ожидающих запросов на сопряжение ограничено **3 на учётную запись** (в пределах канала и идентификатора учётной записи).
Если блок провайдера отсутствует полностью (`channels.<provider>` отсутствует), политика групп среды выполнения использует резервное значение `allowlist` (запрет по умолчанию), а при запуске выводится предупреждение.
</Note>

### Переопределение моделей для каналов

Используйте `channels.modelByChannel`, чтобы закрепить модель за конкретными идентификаторами каналов или собеседниками в личных сообщениях. В качестве значений принимаются `provider/model` или настроенные псевдонимы моделей. Сопоставление каналов применяется только тогда, когда для сеанса ещё не действует переопределение модели (например, заданное через `/model`).

Для групповых обсуждений и веток ключами служат зависящие от канала идентификаторы групп, идентификаторы тем или названия каналов. Для личных сообщений ключами служат идентификаторы собеседников, полученные из данных отправителя канала (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` или `SenderId`). Точный формат ключа зависит от канала:

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

Ключи для личных сообщений совпадают только в беседах с личными сообщениями; они не влияют на маршрутизацию групп и веток.

### Настройки каналов по умолчанию и Heartbeat

Используйте `channels.defaults` для общих настроек политики групп и поведения Heartbeat у разных провайдеров:

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

- `channels.defaults.groupPolicy`: резервная политика групп, если параметр `groupPolicy` на уровне провайдера не задан.
- `channels.defaults.contextVisibility`: режим дополнительной видимости контекста по умолчанию для всех каналов. Значения: `all` (по умолчанию, включать весь контекст цитат, веток и истории), `allowlist` (включать только контекст от отправителей из списка разрешений), `allowlist_quote` (как список разрешений, но с сохранением контекста явных цитат и ответов). Переопределение для отдельного канала: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: включать исправные состояния каналов в вывод Heartbeat (по умолчанию `false`).
- `channels.defaults.heartbeat.showAlerts`: включать состояния с ухудшением работы и ошибками в вывод Heartbeat (по умолчанию `true`).
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
- Значения `web.reconnect` по умолчанию: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. При `maxAttempts: 0` повторные попытки выполняются бесконечно, а не прекращаются.
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для личных сообщений и групп WhatsApp. В `match.peer.id` используйте прямой номер в формате E.164 или JID группы WhatsApp. Семантика полей описана в разделе [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Несколько учётных записей WhatsApp">

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

- Исходящие команды по умолчанию используют учётную запись `default`, если она существует; в противном случае используется первый настроенный идентификатор учётной записи (после сортировки).
- Необязательный параметр `channels.whatsapp.defaultAccount` переопределяет этот резервный выбор учётной записи по умолчанию, если его значение совпадает с настроенным идентификатором учётной записи.
- Устаревший каталог аутентификации Baileys для одной учётной записи переносится командой `openclaw doctor` в `whatsapp/default`.
- Переопределения для отдельных учётных записей: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Токен бота: `channels.telegram.botToken` или `channels.telegram.tokenFile` (только обычный файл; символические ссылки отклоняются), с резервным значением `TELEGRAM_BOT_TOKEN` для учётной записи по умолчанию.
- `apiRoot` задаёт только корневой адрес Telegram Bot API. Используйте `https://api.telegram.org` или корневой адрес собственного сервера или прокси, а не `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` удаляет случайно добавленный завершающий суффикс `/bot<TOKEN>`.
- Для собственного сервера Bot API в режиме `--local` параметр `trustedLocalFileRoots` перечисляет пути на узле, которые OpenClaw разрешено читать. Подключите том данных сервера на узле OpenClaw и настройте либо его корневой каталог данных, либо каталог отдельного токена; пути контейнера в `/var/lib/telegram-bot-api` сопоставляются с этими корневыми каталогами. Другие абсолютные пути по-прежнему отклоняются.
- Необязательный параметр `channels.telegram.defaultAccount` переопределяет выбор учётной записи по умолчанию, если его значение совпадает с настроенным идентификатором учётной записи.
- В конфигурациях с несколькими учётными записями (2+ идентификатора учётных записей) задайте явную учётную запись по умолчанию (`channels.telegram.defaultAccount` или `channels.telegram.accounts.default`), чтобы избежать резервной маршрутизации; `openclaw doctor` предупреждает, если это значение отсутствует или недопустимо.
- `configWrites: false` блокирует инициированные Telegram изменения конфигурации (перенос идентификаторов супергрупп, `/config set|unset`).
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для тем форума (используйте канонический `chatId:topic:topicId` в `match.peer.id`). Семантика полей описана в разделе [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).
- Предварительный просмотр потоковой передачи в Telegram использует `sendMessage` + `editMessageText` (работает в личных и групповых чатах).
- По умолчанию `network.dnsResultOrder` имеет значение `"ipv4first"`, чтобы избежать распространённых сбоев получения данных по IPv6.
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
              systemPrompt: "Только краткие ответы.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (по умолчанию для Discord: progress)
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

- Токен: `channels.discord.token`, с резервным использованием `DISCORD_BOT_TOKEN` для учетной записи по умолчанию.
- Прямые исходящие вызовы, в которых явно указан Discord `token`, используют этот токен для вызова; параметры повторных попыток и политики учетной записи по-прежнему берутся из выбранной учетной записи в активном снимке среды выполнения.
- Необязательный `channels.discord.defaultAccount` переопределяет выбор учетной записи по умолчанию, если он совпадает с идентификатором настроенной учетной записи.
- Используйте `user:<id>` (личное сообщение) или `channel:<id>` (канал сервера) для целей доставки; числовые идентификаторы без префикса отклоняются.
- Краткие имена серверов записываются в нижнем регистре, а пробелы заменяются на `-`; ключи каналов используют имя в формате краткого имени (без `#`). Предпочтительно использовать идентификаторы серверов.
- Сообщения, созданные ботами, по умолчанию игнорируются. `allowBots: true` включает их обработку; используйте `allowBots: "mentions"`, чтобы принимать только сообщения ботов, в которых упомянут бот (собственные сообщения по-прежнему отфильтровываются).
- Каналы, поддерживающие входящие сообщения от ботов, могут использовать общую [защиту от циклов ботов](/ru/channels/bot-loop-protection). Задайте `channels.defaults.botLoopProtection` для базовых бюджетов пар, а затем переопределяйте канал или учетную запись, только если для одной из поверхностей требуются другие ограничения.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (а также переопределения для каналов) отбрасывает сообщения, в которых упомянут другой пользователь или роль, но не бот (кроме @everyone/@here).
- `channels.discord.mentionAliases` сопоставляет стабильный исходящий текст `@handle` с идентификаторами пользователей Discord перед отправкой, чтобы известных участников команды можно было упоминать детерминированно, даже если временный кэш каталога пуст. Переопределения для отдельных учетных записей находятся в `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (по умолчанию `17`) разбивает длинные по вертикали сообщения, даже если они содержат менее 2000 символов.
- `channels.discord.suppressEmbeds` по умолчанию имеет значение `true`, поэтому исходящие URL-адреса не разворачиваются в предварительный просмотр ссылок Discord, если эта функция не отключена. Явные полезные нагрузки `embeds` по-прежнему отправляются обычным образом; вызовы инструментов для отдельных сообщений могут переопределить это с помощью `suppressEmbeds`.
- `channels.discord.threadBindings` управляет маршрутизацией Discord, привязанной к веткам:
  - `enabled`: переопределение Discord для функций сеансов, привязанных к веткам (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, а также привязанные доставка и маршрутизация)
  - `idleHours`: переопределение Discord для автоматического снятия фокуса после бездействия в часах (`0` отключает)
  - `maxAgeHours`: переопределение Discord для жесткого максимального возраста в часах (`0` отключает)
  - `spawnSessions`: переключатель автоматического создания и привязки веток для `sessions_spawn({ thread: true })` и запуска веток ACP (по умолчанию: `true`)
  - `defaultSpawnContext`: собственный контекст подагента для запусков, привязанных к веткам (по умолчанию `"fork"`)
- Записи верхнего уровня `bindings[]` с `type: "acp"` настраивают постоянные привязки ACP для каналов и веток (используйте идентификатор канала или ветки в `match.peer.id`). Семантика полей описана в разделе [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` задает акцентный цвет для контейнеров компонентов Discord v2.
- `channels.discord.agentComponents.ttlMs` определяет, как долго обратные вызовы отправленных компонентов Discord остаются зарегистрированными. Значение по умолчанию — `1800000` (30 минут), максимальное — `86400000` (24 часа). Переопределения для отдельных учетных записей находятся в `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Предпочтительно использовать минимальный TTL, подходящий для рабочего процесса.
- `channels.discord.voice` включает разговоры в голосовых каналах Discord и необязательные переопределения автоматического подключения, LLM и TTS. В конфигурациях Discord только для текста голосовая связь по умолчанию отключена; задайте `channels.discord.voice.enabled=true`, чтобы включить ее.
- `channels.discord.voice.model` при необходимости переопределяет модель LLM, используемую для ответов в голосовых каналах Discord.
- `channels.discord.voice.daveEncryption` (по умолчанию `true`) и `channels.discord.voice.decryptionFailureTolerance` (по умолчанию `24`) передаются в параметры DAVE `@discordjs/voice`.
- `channels.discord.voice.connectTimeoutMs` управляет начальным ожиданием состояния Ready `@discordjs/voice` для `/vc join` и попыток автоматического подключения (по умолчанию `30000`).
- `channels.discord.voice.reconnectGraceMs` определяет, сколько времени отключенный голосовой сеанс может потратить на переход к сигнализации повторного подключения, прежде чем OpenClaw уничтожит его (по умолчанию `15000`).
- Воспроизведение голоса в Discord не прерывается событием начала речи другого пользователя. Чтобы избежать циклов обратной связи, OpenClaw игнорирует новый захват голоса во время воспроизведения TTS.
- Кроме того, OpenClaw пытается восстановить прием голоса, выходя из голосового сеанса и повторно подключаясь к нему после многократных сбоев расшифровки.
- `channels.discord.streaming` — канонический ключ режима потоковой передачи. Для Discord по умолчанию используется `streaming.mode: "progress"`, поэтому ход выполнения инструментов и работы отображается в одном редактируемом сообщении предварительного просмотра; задайте `streaming.mode: "off"`, чтобы отключить это. Устаревшие плоские ключи (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) больше не считываются во время выполнения; запустите `openclaw doctor --fix`, чтобы перенести сохраненную конфигурацию.
- `channels.discord.autoPresence` сопоставляет доступность среды выполнения со статусом присутствия бота (исправное состояние => в сети, ухудшенное => неактивен, ресурсы исчерпаны => не беспокоить) и позволяет при необходимости переопределять текст статуса.
- `channels.discord.dangerouslyAllowNameMatching` повторно включает сопоставление по изменяемому имени или тегу (аварийный режим совместимости).
- `channels.discord.execApprovals`: встроенная в Discord доставка запросов на одобрение выполнения и авторизация утверждающих пользователей.
  - `enabled`: `true`, `false` или `"auto"` (по умолчанию). В автоматическом режиме одобрения выполнения активируются, когда утверждающих пользователей можно определить из `approvers` или `commands.ownerAllowFrom`.
  - `approvers`: идентификаторы пользователей Discord, которым разрешено одобрять запросы на выполнение. Если значение не указано, используется `commands.ownerAllowFrom`.
  - `agentFilter`: необязательный список разрешенных идентификаторов агентов. Не указывайте его, чтобы пересылать запросы на одобрение для всех агентов.
  - `sessionFilter`: необязательные шаблоны ключей сеансов (подстрока или регулярное выражение).
  - `target`: куда отправлять запросы на одобрение. `"dm"` (по умолчанию) отправляет их в личные сообщения утверждающим пользователям, `"channel"` — в исходный канал, `"both"` — в оба места. Если цель включает `"channel"`, кнопками могут пользоваться только определенные утверждающие пользователи.
  - `cleanupAfterResolve`: при значении `true` удаляет личные сообщения с запросами на одобрение после одобрения, отклонения или истечения времени ожидания.

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

- JSON учетной записи службы: встроенный (`serviceAccount`) или из файла (`serviceAccountFile`).
- Также поддерживается SecretRef учетной записи службы (`serviceAccountRef`).
- Резервные переменные окружения: `GOOGLE_CHAT_SERVICE_ACCOUNT` или `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (только для учетной записи по умолчанию).
- Используйте `spaces/<spaceId>` или `users/<userId>` для целей доставки.
- `channels.googlechat.dangerouslyAllowNameMatching` повторно включает сопоставление по изменяемому субъекту электронной почты (аварийный режим совместимости).

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

- Для **режима Socket** требуются как `botToken`, так и `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` для резервного использования переменных окружения учетной записи по умолчанию).
- Для **режима HTTP** требуются `botToken` и `signingSecret` (на корневом уровне или для отдельной учетной записи).
- `enterpriseOrgInstall: true` подключает учетную запись к общекорпоративному
  пути событий Slack Enterprise Grid. При запуске токен бота проверяется с помощью `auth.test`;
  если настроенный режим не соответствует идентификатору установки Slack, запуск
  завершается с ошибкой. Личные сообщения Enterprise должны быть отключены или использовать
  `dmPolicy: "open"` с действующим `allowFrom: ["*"]`. Политики каналов и пользователей
  должны использовать стабильные идентификаторы Slack; изменяемые имена и неподдерживаемые
  префиксы каналов приводят к ошибке запуска. V1 обрабатывает только прямые события Socket Mode
  или HTTP `message` и `app_mention` с немедленными ответами; ретрансляция,
  команды, взаимодействия, App Home, обработчики событий реакций, закрепления,
  инструменты действий, нативные подтверждения, привязки, отложенная доставка и
  проактивная отправка недоступны. Подтверждение получения, индикатор набора и
  статусные реакции, которыми управляет обработчик, остаются доступны с `reactions:write`;
  входящие уведомления о реакциях и инструменты действий с реакциями недоступны. Описание
  манифеста с минимальными привилегиями, процесса настройки и всех ограничений см. в разделе
  [Общекорпоративные установки Enterprise Grid](/ru/channels/slack#enterprise-grid-org-wide-installs).
- `socketMode` передает параметры настройки транспорта Socket Mode из Slack SDK в общедоступный API приемника Bolt. Используйте его только при исследовании тайм-аутов ping/pong или проблем с зависшими соединениями WebSocket. Значение `clientPingTimeout` по умолчанию — `15000`; `serverPingTimeout` и `pingPongLoggingEnabled` передаются только при наличии настройки.
- `botToken`, `appToken`, `signingSecret` и `userToken` принимают строки
  открытого текста или объекты SecretRef.
- Снимки учетных записей Slack предоставляют отдельные для каждого набора учетных данных поля источника и состояния, например
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, а в режиме HTTP —
  `signingSecretStatus`. `configured_unavailable` означает, что учетная запись
  настроена через SecretRef, но текущему пути команды или среды выполнения
  не удалось получить значение секрета.
- `configWrites: false` блокирует запись конфигурации, инициированную Slack.
- Необязательный параметр `channels.slack.defaultAccount` переопределяет выбор учетной записи по умолчанию, если совпадает с идентификатором настроенной учетной записи.
- `channels.slack.streaming.mode` — канонический ключ режима потоковой передачи Slack (по умолчанию `"partial"`). `channels.slack.streaming.nativeTransport` управляет нативным транспортом потоковой передачи Slack (по умолчанию `true`). Устаревшие значения `streamMode`, логическое `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` и `nativeStreaming` больше не считываются во время выполнения; выполните `openclaw doctor --fix`, чтобы перенести сохраненную конфигурацию в `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`.
- `unfurlLinks` и `unfurlMedia` передают логические параметры Slack `chat.postMessage` для развертывания ссылок и медиафайлов в ответах бота. Значение `unfurlLinks` по умолчанию — `false`, поэтому исходящие ссылки бота не разворачиваются в тексте, если эта возможность не включена; `unfurlMedia` не передается, если параметр не настроен. Укажите любое из этих значений в `channels.slack.accounts.<accountId>`, чтобы переопределить значение верхнего уровня для одной учетной записи.
- Для целей доставки используйте `user:<id>` (личное сообщение) или `channel:<id>`.

**Режимы уведомлений о реакциях:** `off`, `own` (по умолчанию), `all`, `allowlist` (из `reactionAllowlist`).

**Изоляция сеансов веток:** `thread.historyScope` задает отдельный сеанс для каждой ветки (по умолчанию) или общий сеанс для всего канала. `thread.inheritParent` копирует историю родительского канала в новые ветки. `thread.initialHistoryLimit` (по умолчанию `20`) ограничивает количество существующих сообщений ветки, загружаемых при запуске нового сеанса ветки; `0` отключает загрузку истории ветки.

- Для нативной потоковой передачи Slack и отображаемого в стиле ассистента Slack статуса ветки «печатает...» требуется, чтобы ответ был направлен в ветку. Личные сообщения верхнего уровня по умолчанию остаются вне веток, поэтому для них по-прежнему можно использовать потоковую передачу через предварительный просмотр черновика Slack с публикацией и редактированием вместо нативного потокового или статусного предварительного просмотра в стиле ветки.
- `typingReaction` добавляет временную реакцию к входящему сообщению Slack на время подготовки ответа, а после завершения удаляет ее. Используйте короткий код эмодзи Slack, например `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: нативная для Slack доставка клиенту подтверждений и авторизация подтверждающих выполнение. Схема совпадает с Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (идентификаторы пользователей Slack), `agentFilter`, `sessionFilter` и `target` (`"dm"`, `"channel"` или `"both"`). Подтверждения плагинов могут использовать этот нативный клиентский путь для запросов из Slack, если удалось определить подтверждающих плагина Slack; нативную для Slack доставку подтверждений плагинов также можно включить через `approvals.plugin` для сеансов из Slack или целей Slack. Подтверждения плагинов используют подтверждающих плагина Slack из `allowFrom` и маршрутизацию по умолчанию, а не подтверждающих выполнение.

| Группа действий | По умолчанию | Примечания                       |
| --------------- | ------------ | -------------------------------- |
| reactions       | включено     | Добавление и список реакций       |
| messages        | включено     | Чтение, отправка, правка, удаление |
| pins            | включено     | Закрепление, открепление, список  |
| memberInfo      | включено     | Сведения об участнике             |
| emojiList       | включено     | Список пользовательских эмодзи    |

### Mattermost

Mattermost устанавливается как отдельный плагин — так же, как Discord, Slack и WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

Перед закреплением версии проверьте актуальные теги дистрибутива на странице [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost).

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
      streaming: { chunkMode: "length" },
    },
  },
}
```

Режимы чата: `oncall` (отвечать при @-упоминании, по умолчанию), `onmessage` (на каждое сообщение), `onchar` (на сообщения, начинающиеся с префикса-триггера).

Когда нативные команды Mattermost включены:

- `commands.callbackPath` должен быть путем (например, `/api/channels/mattermost/command`), а не полным URL-адресом.
- `commands.callbackUrl` должен указывать на конечную точку Gateway OpenClaw и быть доступен с сервера Mattermost.
- Нативные обратные вызовы команд с косой чертой проходят аутентификацию с помощью отдельных для каждой команды токенов,
  возвращаемых Mattermost при регистрации команды с косой чертой. Если регистрация завершается ошибкой или
  ни одна команда не активирована, OpenClaw отклоняет обратные вызовы с
  `Unauthorized: invalid command token.`
- Для частных, внутренних или доступных только в tailnet узлов обратного вызова Mattermost может потребовать,
  чтобы `ServiceSettings.AllowedUntrustedInternalConnections` содержал узел или домен обратного вызова.
  Используйте значения узлов или доменов, а не полные URL-адреса.
- `channels.mattermost.configWrites`: разрешает или запрещает запись конфигурации, инициированную Mattermost.
- `channels.mattermost.requireMention`: требует `@mention` перед ответом в каналах.
- `channels.mattermost.groups.<channelId>.requireMention`: переопределяет требование упоминания для отдельного канала (`"*"` для значения по умолчанию).
- Необязательный параметр `channels.mattermost.defaultAccount` переопределяет выбор учетной записи по умолчанию, если совпадает с идентификатором настроенной учетной записи.

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

- `channels.signal.account`: закрепляет запуск канала за определенным идентификатором учетной записи Signal.
- `channels.signal.configWrites`: разрешает или запрещает запись конфигурации, инициированную Signal.
- Необязательный параметр `channels.signal.defaultAccount` переопределяет выбор учетной записи по умолчанию, если совпадает с идентификатором настроенной учетной записи.

### iMessage

OpenClaw запускает `imsg rpc` (JSON-RPC через стандартный ввод-вывод). Демон и порт не требуются. Это предпочтительный путь для новых настроек iMessage в OpenClaw, если на узле можно предоставить разрешения на доступ к базе данных Messages и автоматизацию.

Поддержка BlueBubbles удалена. `channels.bluebubbles` не является поддерживаемой поверхностью конфигурации среды выполнения в текущей версии OpenClaw. Перенесите старые конфигурации в `channels.imessage`; краткое описание см. в разделе [Удаление BlueBubbles и путь imsg для iMessage](/ru/announcements/bluebubbles-imessage), а полную таблицу соответствий — в разделе [Переход с BlueBubbles](/ru/channels/imessage-from-bluebubbles).

Если Gateway работает не на компьютере Mac, на котором выполнен вход в Messages, сохраните `channels.imessage.enabled=true` и задайте для `channels.imessage.cliPath` SSH-обертку, запускающую `imsg "$@"` на этом Mac. Локальный путь `imsg` по умолчанию поддерживается только в macOS.

Прежде чем использовать SSH-обертку для отправки сообщений в рабочей среде, проверьте исходящий `imsg send` через эту конкретную обертку. В некоторых состояниях TCC macOS разрешение на автоматизацию Messages назначается `/usr/libexec/sshd-keygen-wrapper`, из-за чего чтение и проверки могут работать, а отправка — завершаться ошибкой AppleEvents `-1743`; см. раздел об устранении неполадок SSH-обертки на странице [iMessage](/ru/channels/imessage).

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

- Необязательный параметр `channels.imessage.defaultAccount` переопределяет выбор учётной записи по умолчанию, если совпадает с идентификатором настроенной учётной записи.
- Требуется полный доступ к диску для базы данных Messages.
- Предпочтительно использовать цели `chat_id:<id>`. Для просмотра списка чатов используйте `imsg chats --limit 20`.
- `cliPath` может указывать на SSH-обёртку; задайте `remoteHost` (`host` или `user@host`) для получения вложений через SCP.
- `attachmentRoots` и `remoteAttachmentRoots` ограничивают пути входящих вложений (по умолчанию: `/Users/*/Library/Messages/Attachments`).
- SCP использует строгую проверку ключа хоста, поэтому убедитесь, что ключ ретрансляционного хоста уже существует в `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: разрешает или запрещает изменение конфигурации по инициативе iMessage.
- `channels.imessage.sendTransport`: предпочтительный транспорт отправки RPC `imsg` для обычных исходящих ответов. `auto` (по умолчанию) использует мост IMCore для существующих чатов, когда он запущен, а затем переключается на AppleScript; `bridge` требует доставки через закрытый API; `applescript` принудительно использует общедоступный путь автоматизации Messages.
- `channels.imessage.actions.*`: включает действия закрытого API, которые также регулируются параметрами `imsg status` / `openclaw channels status --probe`.
- `channels.imessage.includeAttachments` по умолчанию отключён; установите значение `true`, прежде чем ожидать появления входящих медиафайлов в ходах агента.
- Восстановление входящих сообщений после перезапуска моста/Gateway выполняется автоматически (дедупликация по GUID и ограничение возраста устаревшей очереди). Существующие конфигурации `channels.imessage.catchup.enabled: true` по-прежнему поддерживаются как устаревший профиль совместимости; `catchup` по умолчанию отключён.
- `channels.imessage.groups`: реестр групп и настройки отдельных групп. При `groupPolicy: "allowlist"` настройте явные ключи `chat_id` или запись с подстановочным знаком `"*"`, чтобы групповые сообщения могли пройти проверку реестра.
- Записи верхнего уровня `bindings[]` с `type: "acp"` могут привязывать беседы iMessage к постоянным сеансам ACP. Используйте нормализованный адрес или явную цель чата (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) в `match.peer.id`. Общая семантика полей: [Агенты ACP](/ru/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Пример SSH-обёртки iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix работает на основе плагина и настраивается в `channels.matrix`.

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
- `channels.matrix.proxy` направляет HTTP-трафик Matrix через явно заданный прокси-сервер HTTP(S). Именованные учётные записи могут переопределить его с помощью `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` разрешает частные/внутренние домашние серверы. `proxy` и это разрешение сетевого доступа являются независимыми элементами управления.
- `channels.matrix.defaultAccount` выбирает предпочтительную учётную запись в конфигурациях с несколькими учётными записями.
- По умолчанию `channels.matrix.autoJoin` имеет значение `"off"`, поэтому приглашения в комнаты и новые приглашения в стиле личных сообщений игнорируются, пока вы не зададите `autoJoin: "allowlist"` с `autoJoinAllowlist` или `autoJoin: "always"`.
- `channels.matrix.execApprovals`: встроенная в Matrix доставка запросов на подтверждение выполнения и авторизация подтверждающих пользователей.
  - `enabled`: `true`, `false` или `"auto"` (по умолчанию). В автоматическом режиме подтверждения выполнения активируются, когда подтверждающих пользователей можно определить из `approvers` или `commands.ownerAllowFrom`.
  - `approvers`: идентификаторы пользователей Matrix (например, `@owner:example.org`), которым разрешено подтверждать запросы на выполнение.
  - `agentFilter`: необязательный список разрешённых идентификаторов агентов. Не указывайте его, чтобы пересылать подтверждения для всех агентов.
  - `sessionFilter`: необязательные шаблоны ключей сеансов (подстрока или регулярное выражение).
  - `target`: куда отправлять запросы на подтверждение. `"dm"` (по умолчанию), `"channel"` (исходная комната) или `"both"`.
  - Переопределения для отдельных учётных записей: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` определяет, как личные сообщения Matrix объединяются в сеансы: `per-user` (по умолчанию) использует общий сеанс для маршрутизируемого собеседника, а `per-room` изолирует каждую комнату личных сообщений.
- Проверки состояния Matrix и оперативный поиск в каталоге используют ту же политику прокси, что и трафик среды выполнения.
- Полная конфигурация Matrix, правила выбора целей и примеры настройки описаны в разделе [Matrix](/ru/channels/matrix).

### Microsoft Teams

Microsoft Teams работает на основе плагина и настраивается в `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, политики команды/канала:
      // см. /channels/msteams
    },
  },
}
```

- Рассматриваемые здесь основные пути ключей: `channels.msteams`, `channels.msteams.configWrites`.
- Полная конфигурация Teams (учётные данные, webhook, политика личных сообщений/групп, переопределения для отдельных команд/каналов) описана в разделе [Microsoft Teams](/ru/channels/msteams).

### IRC

IRC работает на основе плагина и настраивается в `channels.irc`.

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
- Необязательный параметр `channels.irc.defaultAccount` переопределяет выбор учётной записи по умолчанию, если совпадает с идентификатором настроенной учётной записи.
- Полная конфигурация канала IRC (хост/порт/TLS/каналы/списки разрешений/проверка упоминаний) описана в разделе [IRC](/ru/channels/irc).

### Несколько учётных записей (все каналы)

Используйте несколько учётных записей для одного канала (каждая со своим `accountId`):

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

- `default` используется, если `accountId` не указан (CLI + маршрутизация).
- Токены из переменных среды применяются только к учётной записи **по умолчанию**.
- Базовые настройки канала применяются ко всем учётным записям, если не переопределены для конкретной учётной записи.
- Используйте `bindings[].match.accountId`, чтобы направить каждую учётную запись к отдельному агенту.
- Если вы добавляете учётную запись не по умолчанию через `openclaw channels add` (или при подключении канала), продолжая использовать конфигурацию канала верхнего уровня для одной учётной записи, OpenClaw сначала переносит относящиеся к учётной записи значения верхнего уровня в карту учётных записей канала, чтобы исходная учётная запись продолжила работать. Большинство каналов перемещают их в `channels.<channel>.accounts.default`; Matrix вместо этого может сохранить существующую совпадающую именованную цель или цель по умолчанию.
- Существующие привязки только к каналу (без `accountId`) продолжают соответствовать учётной записи по умолчанию; привязки к конкретным учётным записям остаются необязательными.
- `openclaw doctor --fix` также исправляет смешанные структуры, перемещая относящиеся к учётной записи значения верхнего уровня для одной учётной записи в выбранную для этого канала перенесённую учётную запись. Большинство каналов используют `accounts.default`; Matrix вместо этого может сохранить существующую совпадающую именованную цель или цель по умолчанию.

### Другие каналы плагинов

Многие каналы плагинов настраиваются как `channels.<id>` и описаны на отдельных страницах соответствующих каналов (например, Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch и Zalo).
Полный список каналов см. в разделе [Каналы](/ru/channels).

### Проверка упоминаний в групповых чатах

Для групповых сообщений по умолчанию **требуется упоминание** (упоминание в метаданных или безопасные шаблоны регулярных выражений). Это относится к групповым чатам WhatsApp, Telegram, Discord, Google Chat и iMessage.

Видимые ответы управляются отдельно. Для обычных групповых, канальных и прямых внутренних запросов WebChat по умолчанию используется автоматическая доставка итогового ответа: итоговый текст ассистента публикуется через прежний путь видимых ответов. Включите `messages.visibleReplies: "message_tool"` или `messages.groupChat.visibleReplies: "message_tool"`, если видимый результат должен публиковаться только после вызова агентом `message(action=send)`. Если в режиме только инструментов модель возвращает содержательный итоговый ответ, не вызвав инструмент сообщений, этот итоговый текст остаётся приватным, подробный журнал Gateway записывает метаданные подавленной полезной нагрузки, а OpenClaw ставит в очередь одну повторную попытку восстановления с просьбой к модели доставить тот же ответ через `message(action=send)`.

Для видимых ответов только через инструменты требуется модель/среда выполнения, надёжно вызывающая инструменты; этот режим рекомендуется для общих фоновых комнат при использовании моделей последнего поколения, например GPT-5.6 Sol. Некоторые более слабые модели способны вернуть итоговый текст, но не понимают, что видимый в исходном канале результат необходимо отправить с помощью `message(action=send)`. По умолчанию OpenClaw восстанавливает распространённый случай недоставленного итогового ответа, только если он содержателен, исходный ход не являлся событием комнаты, политика отправки не запретила доставку и ответ в исходный канал ещё не был отправлен. Восстановление ограничено одной повторной попыткой; для синтетического запроса повторной попытки отключается сохранение, а сам запрос исключается из пакетной обработки collect, чтобы он не мог объединиться с посторонними запросами в очереди. Если повторная попытка также не приводит к доставке или её невозможно поставить в очередь, OpenClaw отправляет только очищенное диагностическое сообщение, например «Я сформировал ответ, но не смог доставить его в этот чат. Повторите попытку». Исходный приватный итоговый текст никогда не помечается для автоматической доставки в исходный канал. Для моделей, которые регулярно не доставляют ответы, используйте `"automatic"`, чтобы итоговый ход ассистента служил путём видимого ответа, переключитесь на более мощную модель с вызовом инструментов, проверьте сводку подавленной полезной нагрузки в подробном журнале Gateway или задайте `messages.groupChat.visibleReplies: "automatic"`, чтобы использовать видимые итоговые ответы для каждого группового/канального запроса.

Если инструмент сообщений недоступен в рамках активной политики инструментов, OpenClaw переключается на автоматические видимые ответы вместо скрытого подавления ответа. `openclaw doctor` предупреждает об этом несоответствии.

Это правило применяется к обычному итоговому тексту агента. Для привязок бесед, принадлежащих плагинам, возвращённый соответствующим плагином ответ используется как видимый ответ для ходов заявленной привязанной ветки; плагину не требуется вызывать `message(action=send)` для таких ответов привязки.

**Устранение неполадок: упоминание @mention в группе запускает индикатор набора, после чего ничего не происходит (без ошибки)**

Признак: при упоминании @mention в группе/канале отображается индикатор набора, а журнал Gateway сообщает `dispatch complete (queuedFinal=false, replies=0)`, но сообщение в комнате не появляется. Личные сообщения тому же агенту получают ответы как обычно.

Причина: режим видимых ответов для группы/канала разрешается в `"message_tool"`, поэтому OpenClaw выполняет ход, но скрывает итоговый текст ассистента, если агент не вызывает `message(action=send)`. В этом режиме контракт `NO_REPLY` отсутствует; без вызова инструмента сообщений исходный итоговый текст остаётся приватным. Для содержательных исходных ходов OpenClaw теперь выполняет одну защищённую повторную попытку восстановления; короткие заметки, явное молчание, события комнаты, ходы с запретом политикой отправки и уже доставленные ходы повторно не выполняются. Для обычных групповых и канальных ходов по умолчанию используется `"automatic"`, поэтому этот симптом возникает только тогда, когда `messages.groupChat.visibleReplies` (или глобальный `messages.visibleReplies`) явно задан как `"message_tool"`. Параметр стенда `defaultVisibleReplies` здесь не применяется — обработчик групп/каналов игнорирует его; он влияет только на прямые/исходные чаты (стенд Codex таким образом скрывает итоговые ответы в прямых чатах).

Исправление: выберите модель с более надёжным вызовом инструментов, удалите явное переопределение `"message_tool"`, чтобы вернуться к значению по умолчанию `"automatic"`, или задайте `messages.groupChat.visibleReplies: "automatic"`, чтобы принудительно включить видимые ответы для каждого запроса группы/канала. Содержательный недоставленный итоговый ответ больше не должен завершаться как успешный без вывода; он должен либо восстановиться посредством одной повторной попытки `message(action=send)`, либо показать очищенное диагностическое сообщение об ошибке доставки. Gateway автоматически перезагружает конфигурацию `messages` после сохранения файла; перезапускайте Gateway только в том случае, если в развёртывании отключено наблюдение за файлами или перезагрузка конфигурации.

**Типы упоминаний:**

- **Упоминания в метаданных**: Нативные @-упоминания платформы. Игнорируются в режиме чата с самим собой в WhatsApp.
- **Текстовые шаблоны**: Безопасные регулярные выражения в `agents.list[].groupChat.mentionPatterns`. Недопустимые шаблоны и небезопасные вложенные повторения игнорируются.
- Фильтрация по упоминаниям применяется только тогда, когда обнаружение возможно (нативные упоминания или хотя бы один шаблон).

```json5
{
  messages: {
    visibleReplies: "automatic", // принудительно использовать прежние автоматические итоговые ответы для прямых/исходных чатов
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // постоянно поступающие сообщения комнаты без упоминаний становятся тихим контекстом
      visibleReplies: "message_tool", // включается явно; для видимых ответов в комнате требуется message(action=send)
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` задаёт глобальное значение по умолчанию. Каналы могут переопределять его с помощью `channels.<channel>.historyLimit` (в том числе для отдельной учётной записи). Задайте `0`, чтобы отключить.

`messages.groupChat.unmentionedInbound: "room_event"` отправляет сообщения постоянно активных групп/каналов без упоминаний как тихий контекст комнаты в поддерживаемых каналах. Сообщения с упоминаниями, команды и прямые сообщения остаются пользовательскими запросами. Полные примеры для Discord, Slack и Telegram см. в разделе [Фоновые события комнаты](/ru/channels/ambient-room-events).

`messages.visibleReplies` — глобальное значение по умолчанию для исходных событий; `messages.groupChat.visibleReplies` переопределяет его для исходных событий групп/каналов. Если `messages.visibleReplies` не задан, прямые/исходные чаты используют значение по умолчанию выбранной среды выполнения или стенда, но внутренние прямые ходы WebChat используют автоматическую доставку итогового ответа для соответствия запросов Pi/Codex. Задайте `messages.visibleReplies: "message_tool"`, чтобы намеренно требовать `message(action=send)` для видимого вывода. Списки разрешений каналов и фильтрация по упоминаниям по-прежнему определяют, будет ли событие обработано.

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

Порядок разрешения: переопределение для конкретного личного чата → значение провайдера по умолчанию → без ограничения (сохраняется всё).

Этот обработчик считывает `channels.<provider>.dmHistoryLimit` и `channels.<provider>.dms.<id>.historyLimit` для любого канала, ключ сеанса которого соответствует стандартному формату `provider:direct:<id>` (или устаревшему `provider:dm:<id>`), поэтому он работает как со встроенными каналами, так и с каналами плагинов, а не только с фиксированным списком.

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
    native: "auto", // регистрировать нативные команды, когда они поддерживаются
    nativeSkills: "auto", // регистрировать нативные команды навыков, когда они поддерживаются
    text: true, // разбирать /commands в сообщениях чата
    bash: false, // разрешить ! (псевдоним: /bash)
    bashForegroundMs: 2000,
    config: false, // разрешить /config
    mcp: false, // разрешить /mcp
    plugins: false, // разрешить /plugins
    debug: false, // разрешить /debug
    restart: true, // разрешить /restart и инструмент перезапуска Gateway
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
- Эта страница представляет собой **справочник ключей конфигурации**, а не полный каталог команд. Команды, принадлежащие каналам/плагинам, такие как QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, сопряжение устройств `/pair`, память `/dreaming`, управление телефоном `/phone` и Talk `/voice`, документированы на страницах соответствующих каналов/плагинов, а также в разделе [Команды с косой чертой](/ru/tools/slash-commands).
- Текстовые команды должны быть **отдельными** сообщениями, начинающимися с `/`.
- `native: "auto"` включает нативные команды для Discord/Telegram и оставляет их выключенными для Slack.
- `nativeSkills: "auto"` включает нативные команды навыков для Discord/Telegram и оставляет их выключенными для Slack.
- Переопределение для отдельного канала: `channels.discord.commands.native` (логическое значение или `"auto"`). Для Discord параметр `false` пропускает регистрацию и очистку нативных команд при запуске.
- Переопределите регистрацию нативных команд навыков для отдельного канала с помощью `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` добавляет дополнительные пункты меню бота Telegram.
- `bash: true` включает `! <cmd>` для командной оболочки хоста. Требуется `tools.elevated.enabled`, а отправитель должен присутствовать в `tools.elevated.allowFrom.<channel>`.
- `config: true` включает `/config` (чтение/запись `openclaw.json`). Для клиентов Gateway `chat.send` постоянная запись `/config set|unset` также требует `operator.admin`; доступный только для чтения `/config show` остаётся доступен обычным клиентам-операторам с областью разрешений на запись.
- `mcp: true` включает `/mcp` для конфигурации MCP-сервера под управлением OpenClaw в `mcp.servers`.
- `plugins: true` включает `/plugins` для обнаружения и установки плагинов, а также управления их включением и отключением.
- `channels.<provider>.configWrites` регулирует изменение конфигурации для каждого канала (по умолчанию: true).
- Для каналов с несколькими учётными записями `channels.<provider>.accounts.<id>.configWrites` также регулирует операции записи, нацеленные на эту учётную запись (например, `/allowlist --config --account <id>` или `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` отключает `/restart` и действия инструмента перезапуска Gateway. По умолчанию: `true`.
- `ownerAllowFrom` — явный список разрешений владельцев для команд, доступных только владельцам, и действий канала, ограниченных владельцами. Он отделён от `allowFrom`.
- `ownerDisplay: "hash"` хеширует идентификаторы владельцев в системном запросе. Задайте `ownerDisplaySecret`, чтобы управлять хешированием.
- `allowFrom` задаётся отдельно для каждого провайдера. Если он задан, то становится **единственным** источником авторизации (списки разрешений/сопряжение канала и `useAccessGroups` игнорируются).
- `useAccessGroups: false` позволяет командам обходить политики групп доступа, если `allowFrom` не задан.
- Карта документации по командам:
  - каталог встроенных и поставляемых в комплекте команд: [Команды с косой чертой](/ru/tools/slash-commands)
  - интерфейсы команд отдельных каналов: [Каналы](/ru/channels)
  - команды QQ Bot: [QQ Bot](/ru/channels/qqbot)
  - команды сопряжения: [Сопряжение](/ru/channels/pairing)
  - карточная команда LINE: [LINE](/ru/channels/line)
  - Dreaming памяти: [Dreaming](/ru/concepts/dreaming)

</Accordion>

---

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/configuration-reference) — ключи верхнего уровня
- [Конфигурация — агенты](/ru/gateway/config-agents)
- [Обзор каналов](/ru/channels)
