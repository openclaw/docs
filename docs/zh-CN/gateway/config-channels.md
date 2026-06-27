---
read_when:
    - 配置渠道插件（凭证、访问控制、多账号）
    - 排查各渠道配置键问题
    - 审计私信策略、群组策略或提及门控
summary: 频道配置：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等渠道的访问控制、配对和按渠道配置的键
title: 配置 — 渠道
x-i18n:
    generated_at: "2026-06-27T01:57:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

按频道配置 `channels.*` 下的键。涵盖私信和群组访问、多账号设置、提及门控，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他内置渠道插件的按频道键。

对于智能体、工具、Gateway 网关运行时和其他顶层键，请参阅
[配置参考](/zh-CN/gateway/configuration-reference)。

## 频道

每个频道都会在其配置区段存在时自动启动（除非设置了 `enabled: false`）。

### 私信和群组访问

所有频道都支持私信策略和群组策略：

| 私信策略            | 行为                                                   |
| ------------------- | ------------------------------------------------------ |
| `pairing`（默认）   | 未知发送者会获得一次性配对码；所有者必须批准         |
| `allowlist`         | 仅允许 `allowFrom` 中的发送者（或已配对的允许存储）   |
| `open`              | 允许所有入站私信（需要 `allowFrom: ["*"]`）           |
| `disabled`          | 忽略所有入站私信                                     |

| 群组策略              | 行为                                             |
| --------------------- | ------------------------------------------------ |
| `allowlist`（默认）   | 仅允许匹配已配置允许列表的群组                  |
| `open`                | 绕过群组允许列表（提及门控仍然适用）            |
| `disabled`            | 阻止所有群组/房间消息                           |

<Note>
`channels.defaults.groupPolicy` 会在提供商的 `groupPolicy` 未设置时设置默认值。
配对码会在 1 小时后过期。待处理的私信配对请求上限为**每个频道 3 个**。
如果提供商块完全缺失（不存在 `channels.<provider>`），运行时群组策略会回退到 `allowlist`（故障关闭），并在启动时发出警告。
</Note>

### 频道模型覆盖

使用 `channels.modelByChannel` 将特定频道 ID 或私信对等方固定到某个模型。值接受 `provider/model` 或已配置的模型别名。当会话尚未有模型覆盖时（例如通过 `/model` 设置），会应用频道映射。

对于群组/话题对话，键是频道特定的群组 ID、主题 ID 或频道名称。对于私信（DM）对话，键是从频道发送者身份派生的对等方标识符（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From` 或 `SenderId`）。确切的键形式取决于频道：

| 频道     | 私信键形式          | 示例                                         |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 原始用户 ID         | `123456789`                                  |
| Discord  | 原始用户 ID         | `987654321`                                  |
| WhatsApp | 电话号码或 JID      | `15551234567`                                |
| Matrix   | Matrix 用户 ID      | `@user:matrix.org`                           |
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

私信专用键只会在私信对话中匹配；它们不会影响群组/话题路由。

### 频道默认值和 Heartbeat

使用 `channels.defaults` 为各提供商配置共享的群组策略和 Heartbeat 行为：

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

- `channels.defaults.groupPolicy`：当提供商级别的 `groupPolicy` 未设置时使用的回退群组策略。
- `channels.defaults.contextVisibility`：所有频道的默认补充上下文可见性模式。值：`all`（默认，包含所有引用/话题/历史上下文）、`allowlist`（仅包含来自允许列表发送者的上下文）、`allowlist_quote`（与 allowlist 相同，但保留显式引用/回复上下文）。按频道覆盖：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在 Heartbeat 输出中包含健康的频道状态。
- `channels.defaults.heartbeat.showAlerts`：在 Heartbeat 输出中包含降级/错误状态。
- `channels.defaults.heartbeat.useIndicator`：渲染紧凑的指示器样式 Heartbeat 输出。

### WhatsApp

WhatsApp 通过 Gateway 网关的 Web 频道（Baileys Web）运行。当存在已链接会话时，它会自动启动。

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

- 带有 `type: "acp"` 的顶层 `bindings[]` 条目会为 WhatsApp 私信和群组配置持久 ACP 绑定。在 `match.peer.id` 中使用 E.164 直连号码或 WhatsApp 群组 JID。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#persistent-channel-bindings) 中共享。

<Accordion title="Multi-account WhatsApp">

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

- 出站命令默认使用账号 `default`（如果存在）；否则使用第一个已配置的账号 ID（排序后）。
- 可选的 `channels.whatsapp.defaultAccount` 会在匹配已配置账号 ID 时覆盖该回退默认账号选择。
- 旧版单账号 Baileys 凭证目录会由 `openclaw doctor` 迁移到 `whatsapp/default`。
- 按账号覆盖：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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

- Bot 令牌：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（仅限常规文件；拒绝符号链接），并以 `TELEGRAM_BOT_TOKEN` 作为默认账号的回退。
- `apiRoot` 仅是 Telegram Bot API 根地址。使用 `https://api.telegram.org` 或你的自托管/代理根地址，不要使用 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 会移除意外的尾随 `/bot<TOKEN>` 后缀。
- 可选的 `channels.telegram.defaultAccount` 会在匹配已配置账号 ID 时覆盖默认账号选择。
- 在多账号设置（2 个以上账号 ID）中，设置显式默认值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免回退路由；当缺失或无效时，`openclaw doctor` 会发出警告。
- `configWrites: false` 会阻止由 Telegram 发起的配置写入（超级群组 ID 迁移、`/config set|unset`）。
- 带有 `type: "acp"` 的顶层 `bindings[]` 条目会为论坛主题配置持久 ACP 绑定（在 `match.peer.id` 中使用规范的 `chatId:topic:topicId`）。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#persistent-channel-bindings) 中共享。
- Telegram 流式预览使用 `sendMessage` + `editMessageText`（适用于私聊和群聊）。
- 重试策略：请参阅[重试策略](/zh-CN/concepts/retry)。

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

- Token：`channels.discord.token`，默认账户可回退使用 `DISCORD_BOT_TOKEN`。
- 提供显式 Discord `token` 的直接出站调用会使用该 token 发起调用；账户重试/策略设置仍来自活动运行时快照中选定的账户。
- 可选的 `channels.discord.defaultAccount` 在匹配已配置账户 ID 时会覆盖默认账户选择。
- 使用 `user:<id>`（私信）或 `channel:<id>`（服务器频道）作为投递目标；裸数字 ID 会被拒绝。
- 服务器 slug 为小写，并将空格替换为 `-`；频道键使用 slug 化名称（不含 `#`）。优先使用服务器 ID。
- 默认会忽略机器人撰写的消息。`allowBots: true` 会启用它们；使用 `allowBots: "mentions"` 可仅接受提及机器人的机器人消息（仍会过滤自己的消息）。
- 支持机器人撰写入站消息的频道可以使用共享的 [机器人循环保护](/zh-CN/channels/bot-loop-protection)。设置 `channels.defaults.botLoopProtection` 作为基线配对预算，只有当某个表面需要不同限制时，才覆盖频道或账户。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及频道覆盖项）会丢弃提及其他用户或角色但未提及机器人的消息（不包括 @everyone/@here）。
- `channels.discord.mentionAliases` 会在发送前将稳定的出站 `@handle` 文本映射到 Discord 用户 ID，因此即使临时目录缓存为空，也能确定性地提及已知队友。按账户覆盖项位于 `channels.discord.accounts.<accountId>.mentionAliases` 下。
- `maxLinesPerMessage`（默认 17）即使在低于 2000 个字符时，也会拆分很高的消息。
- `channels.discord.suppressEmbeds` 默认为 `true`，因此除非禁用，否则出站 URL 不会展开为 Discord 链接预览。显式 `embeds` 负载仍会正常发送；按消息的工具调用可以用 `suppressEmbeds` 覆盖。
- `channels.discord.threadBindings` 控制 Discord 线程绑定路由：
  - `enabled`：线程绑定会话功能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 以及绑定投递/路由）的 Discord 覆盖项
  - `idleHours`：非活动自动取消聚焦的 Discord 覆盖项，以小时为单位（`0` 表示禁用）
  - `maxAgeHours`：硬性最长时长的 Discord 覆盖项，以小时为单位（`0` 表示禁用）
  - `spawnSessions`：用于 `sessions_spawn({ thread: true })` 和 ACP 线程生成自动线程创建/绑定的开关（默认：`true`）
  - `defaultSpawnContext`：线程绑定生成时的原生子智能体上下文（默认为 `"fork"`）
- 带有 `type: "acp"` 的顶层 `bindings[]` 条目会为频道和线程配置持久 ACP 绑定（在 `match.peer.id` 中使用频道/线程 ID）。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#persistent-channel-bindings) 中共享。
- `channels.discord.ui.components.accentColor` 设置 Discord 组件 v2 容器的强调色。
- `channels.discord.agentComponents.ttlMs` 控制已发送 Discord 组件回调保持注册的时长。默认值为 `1800000`（30 分钟），最大值为 `86400000`（24 小时），按账户覆盖项位于 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 下。更长的值会让旧按钮/选择器/表单可用更久，因此优先选择适合工作流的最短 TTL。
- `channels.discord.voice` 启用 Discord 语音频道对话，以及可选的自动加入 + LLM + TTS 覆盖项。仅文本的 Discord 配置默认关闭语音；设置 `channels.discord.voice.enabled=true` 以选择启用。
- `channels.discord.voice.model` 可选地覆盖用于 Discord 语音频道响应的 LLM 模型。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` DAVE 选项（默认分别为 `true` 和 `24`）。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试的初始 `@discordjs/voice` Ready 等待时间（默认为 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制断开的语音会话在被 OpenClaw 销毁前，可以花多长时间进入重连信令（默认为 `15000`）。
- Discord 语音播放不会被其他用户的开始讲话事件打断。为避免反馈循环，OpenClaw 会在 TTS 播放期间忽略新的语音捕获。
- OpenClaw 还会在重复解密失败后，通过离开/重新加入语音会话来尝试恢复语音接收。
- `channels.discord.streaming` 是规范的流模式键。Discord 默认使用 `streaming.mode: "progress"`，因此工具/工作进度会显示在一条被编辑的预览消息中；设置 `streaming.mode: "off"` 可禁用它。旧版 `streamMode` 和布尔值 `streaming` 仍保留为运行时别名；运行 `openclaw doctor --fix` 可重写已持久化的配置。
- `channels.discord.autoPresence` 会将运行时可用性映射到机器人在线状态（healthy => online，degraded => idle，exhausted => dnd），并允许可选的状态文本覆盖项。
- `channels.discord.dangerouslyAllowNameMatching` 会重新启用可变名称/标签匹配（应急兼容模式）。
- `channels.discord.execApprovals`：Discord 原生 Exec 审批投递和审批者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在 auto 模式下，当可以从 `approvers` 或 `commands.ownerAllowFrom` 解析审批者时，Exec 审批会激活。
  - `approvers`：允许审批 Exec 请求的 Discord 用户 ID。省略时会回退到 `commands.ownerAllowFrom`。
  - `agentFilter`：可选的智能体 ID 允许列表。省略则转发所有智能体的审批。
  - `sessionFilter`：可选的会话键模式（子字符串或正则表达式）。
  - `target`：发送审批提示的位置。`"dm"`（默认）发送到审批者私信，`"channel"` 发送到发起频道，`"both"` 两者都发送。当目标包含 `"channel"` 时，按钮只能由已解析的审批者使用。
  - `cleanupAfterResolve`：为 `true` 时，在批准、拒绝或超时后删除审批私信。

**回应通知模式：** `off`（无）、`own`（机器人的消息，默认）、`all`（所有消息）、`allowlist`（来自所有消息上的 `guilds.<id>.users`）。

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

- 服务账号 JSON：内联（`serviceAccount`）或基于文件（`serviceAccountFile`）。
- 也支持服务账号 SecretRef（`serviceAccountRef`）。
- 环境回退：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 使用 `spaces/<spaceId>` 或 `users/<userId>` 作为投递目标。
- `channels.googlechat.dangerouslyAllowNameMatching` 会重新启用可变电子邮件主体匹配（应急兼容模式）。

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

- **Socket 模式**需要同时提供 `botToken` 和 `appToken`（默认账户环境变量回退使用 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加 `signingSecret`（位于根级或按账户配置）。
- `socketMode` 会把 Slack SDK Socket Mode 传输调优透传给公共 Bolt 接收器 API。仅在调查 ping/pong 超时或陈旧 websocket 行为时使用它。`clientPingTimeout` 默认为 `15000`；`serverPingTimeout` 和 `pingPongLoggingEnabled` 仅在已配置时传递。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文
  字符串或 SecretRef 对象。
- Slack 账户快照会暴露每个凭据的来源/状态字段，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式下的
  `signingSecretStatus`。`configured_unavailable` 表示该账户
  通过 SecretRef 配置，但当前命令/运行时路径无法
  解析密钥值。
- `configWrites: false` 会阻止由 Slack 发起的配置写入。
- 可选的 `channels.slack.defaultAccount` 会在匹配已配置账户 ID 时覆盖默认账户选择。
- `channels.slack.streaming.mode` 是规范的 Slack 流模式键。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生流式传输。旧版 `streamMode`、布尔值 `streaming` 和 `nativeStreaming` 值仍作为运行时别名保留；运行 `openclaw doctor --fix` 来重写已持久化的配置。
- `unfurlLinks` 和 `unfurlMedia` 会为机器人回复透传 Slack 的 `chat.postMessage` 链接和媒体展开布尔值。`unfurlLinks` 默认为 `false`，因此除非启用，否则出站机器人链接不会内联展开；`unfurlMedia` 除非配置，否则会省略。可在 `channels.slack.accounts.<accountId>` 设置任一值，以覆盖单个账户的顶级值。
- 使用 `user:<id>`（私信）或 `channel:<id>` 作为投递目标。

**回应通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程会话隔离：** `thread.historyScope` 为按线程（默认）或跨渠道共享。`thread.inheritParent` 会将父渠道转录复制到新线程。

- Slack 原生流式传输以及 Slack 助手风格的“正在输入...”线程状态需要回复线程目标。顶级私信默认保持在线程外，因此它们仍可通过 Slack 草稿发布并编辑预览来流式传输，而不是显示线程风格的原生流/状态预览。
- `typingReaction` 会在回复运行期间向入站 Slack 消息添加一个临时回应，并在完成后移除。使用 Slack emoji 短代码，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生审批客户端投递和 Exec 审批人授权。与 Discord 使用相同 schema：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 用户 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。当 Slack 插件审批人可解析时，插件审批可以对源自 Slack 的请求使用此原生客户端路径；也可通过 `approvals.plugin` 为源自 Slack 的会话或 Slack 目标启用 Slack 原生插件审批投递。插件审批使用来自 `allowFrom` 的 Slack 插件审批人和默认路由，而不是 Exec 审批人。

| 操作组 | 默认 | 说明                  |
| ------------ | ------- | ---------------------- |
| reactions    | 已启用 | 添加回应 + 列出回应 |
| messages     | 已启用 | 读取/发送/编辑/删除  |
| pins         | 已启用 | 置顶/取消置顶/列出         |
| memberInfo   | 已启用 | 成员信息            |
| emojiList    | 已启用 | 自定义 emoji 列表      |

### Mattermost

Mattermost 在当前 OpenClaw 版本中作为内置插件提供。较旧或
自定义构建可以使用
`openclaw plugins install @openclaw/mattermost` 安装当前 npm 包。固定版本前，请查看
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
了解当前 dist-tags。

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

聊天模式：`oncall`（在 @-mention 时响应，默认）、`onmessage`（每条消息）、`onchar`（以触发前缀开头的消息）。

启用 Mattermost 原生命令时：

- `commands.callbackPath` 必须是路径（例如 `/api/channels/mattermost/command`），不能是完整 URL。
- `commands.callbackUrl` 必须解析到 OpenClaw Gateway 网关端点，并且可从 Mattermost 服务器访问。
- 原生 slash 回调使用 Mattermost 在 slash 命令注册期间返回的每命令令牌进行认证。如果注册失败或没有
  命令被激活，OpenClaw 会使用
  `Unauthorized: invalid command token.` 拒绝回调。
- 对于私有/tailnet/内部回调主机，Mattermost 可能要求
  `ServiceSettings.AllowedUntrustedInternalConnections` 包含回调主机/域名。
  使用主机/域名值，而不是完整 URL。
- `channels.mattermost.configWrites`：允许或拒绝由 Mattermost 发起的配置写入。
- `channels.mattermost.requireMention`：在渠道中回复前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：按渠道覆盖 mention 门控（`"*"` 表示默认）。
- 可选的 `channels.mattermost.defaultAccount` 会在匹配已配置账户 ID 时覆盖默认账户选择。

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

**回应通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

- `channels.signal.account`：将渠道启动固定到特定 Signal 账户身份。
- `channels.signal.configWrites`：允许或拒绝由 Signal 发起的配置写入。
- 可选的 `channels.signal.defaultAccount` 会在匹配已配置账户 ID 时覆盖默认账户选择。

### iMessage

OpenClaw 会生成 `imsg rpc`（通过 stdio 的 JSON-RPC）。不需要守护进程或端口。当主机可以授予 Messages 数据库和自动化权限时，这是新的 OpenClaw iMessage 设置的首选路径。

BlueBubbles 支持已移除。`channels.bluebubbles` 不是当前 OpenClaw 支持的运行时配置表面。请将旧配置迁移到 `channels.imessage`；简要版本见 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)，完整翻译表见 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。

如果 Gateway 网关未在已登录 Messages 的 Mac 上运行，请保持 `channels.imessage.enabled=true`，并将 `channels.imessage.cliPath` 设置为会在该 Mac 上运行 `imsg "$@"` 的 SSH 包装器。默认本地 `imsg` 路径仅适用于 macOS。

在生产发送依赖 SSH 包装器前，请通过该确切包装器验证一次出站 `imsg send`。某些 macOS TCC 状态会将 Messages 自动化分配给 `/usr/libexec/sshd-keygen-wrapper`，这可能导致读取和探测可用，但发送因 AppleEvents `-1743` 而失败；参见 [SSH 包装器发送因 AppleEvents -1743 失败](/zh-CN/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)。

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

- 可选的 `channels.imessage.defaultAccount` 会在匹配已配置账户 ID 时覆盖默认账户选择。

- 需要对 Messages DB 拥有完全磁盘访问权限。
- 优先使用 `chat_id:<id>` 目标。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH 包装器；设置 `remoteHost`（`host` 或 `user@host`）用于 SCP 附件获取。
- `attachmentRoots` 和 `remoteAttachmentRoots` 会限制入站附件路径（默认：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用严格主机密钥检查，因此请确保中继主机密钥已存在于 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允许或拒绝由 iMessage 发起的配置写入。
- `channels.imessage.sendTransport`：普通出站回复首选的 `imsg` RPC 发送传输。`auto`（默认）会在 IMCore bridge 运行时为现有聊天使用它，然后回退到 AppleScript；`bridge` 需要私有 API 投递；`applescript` 会强制使用公共 Messages 自动化路径。
- `channels.imessage.actions.*`：启用同样受 `imsg status` / `openclaw channels status --probe` 门控的私有 API 操作。
- `channels.imessage.includeAttachments` 默认关闭；在期望智能体轮次中包含入站媒体前，请将其设置为 `true`。
- bridge/gateway 重启后的入站恢复是自动的（GUID 去重加陈旧积压年龄栅栏）。现有 `channels.imessage.catchup.enabled: true` 配置仍会作为已弃用的兼容性配置文件得到遵守。
- `channels.imessage.groups`：群组注册表和按群组设置。使用 `groupPolicy: "allowlist"` 时，请配置显式 `chat_id` 键或 `"*"` 通配符条目，以便群组消息可以通过注册表门控。
- 顶级 `bindings[]` 条目中 `type: "acp"` 可以将 iMessage 对话绑定到持久 ACP 会话。请在 `match.peer.id` 中使用规范化 handle 或显式聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义：[ACP 智能体](/zh-CN/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH 包装器示例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由插件支持，并在 `channels.matrix` 下配置。

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

- 令牌认证使用 `accessToken`；密码认证使用 `userId` + `password`。
- `channels.matrix.proxy` 通过显式 HTTP(S) 代理路由 Matrix HTTP 流量。命名账号可以用 `channels.matrix.accounts.<id>.proxy` 覆盖它。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允许私有/内部 homeserver。`proxy` 和这个网络选择加入是独立控制项。
- `channels.matrix.defaultAccount` 在多账号设置中选择首选账号。
- `channels.matrix.autoJoin` 默认值为 `off`，因此受邀房间和新的私信式邀请会被忽略，直到你设置 `autoJoin: "allowlist"` 并配置 `autoJoinAllowlist`，或设置 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 Exec 审批投递和审批者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在自动模式下，当可以从 `approvers` 或 `commands.ownerAllowFrom` 解析审批者时，Exec 审批会激活。
  - `approvers`：允许批准 Exec 请求的 Matrix 用户 ID（例如 `@owner:example.org`）。
  - `agentFilter`：可选的智能体 ID 允许列表。省略时会转发所有智能体的审批。
  - `sessionFilter`：可选的会话键模式（子字符串或正则表达式）。
  - `target`：发送审批提示的位置。`"dm"`（默认）、`"channel"`（来源房间）或 `"both"`。
  - 单账号覆盖：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私信如何分组为会话：`per-user`（默认）按路由到的对等方共享，而 `per-room` 会隔离每个私信房间。
- Matrix 状态探测和实时目录查找使用与运行时流量相同的代理策略。
- 完整 Matrix 配置、目标规则和设置示例记录在 [Matrix](/zh-CN/channels/matrix) 中。

### Microsoft Teams

Microsoft Teams 由插件支持，并在 `channels.msteams` 下配置。

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

- 这里涵盖的核心键路径：`channels.msteams`、`channels.msteams.configWrites`。
- 完整 Teams 配置（凭证、webhook、私信/群组策略、按 team/按 channel 覆盖）记录在 [Microsoft Teams](/zh-CN/channels/msteams) 中。

### IRC

IRC 由插件支持，并在 `channels.irc` 下配置。

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

- 这里涵盖的核心键路径：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 可选的 `channels.irc.defaultAccount` 会在匹配已配置账号 ID 时覆盖默认账号选择。
- 完整 IRC 渠道配置（host/port/TLS/channels/允许列表/提及门控）记录在 [IRC](/zh-CN/channels/irc) 中。

### 多账号（所有渠道）

为每个渠道运行多个账号（每个账号都有自己的 `accountId`）：

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

- 省略 `accountId` 时会使用 `default`（CLI + 路由）。
- 环境变量令牌只适用于 **默认** 账号。
- 基础渠道设置适用于所有账号，除非按账号覆盖。
- 使用 `bindings[].match.accountId` 将每个账号路由到不同智能体。
- 如果你通过 `openclaw channels add`（或渠道新手引导）添加非默认账号，而当前仍使用单账号顶层渠道配置，OpenClaw 会先将账号作用域的顶层单账号值提升到渠道账号映射中，这样原账号会继续工作。大多数渠道会把它们移动到 `channels.<channel>.accounts.default`；Matrix 可以改为保留现有匹配的命名/默认目标。
- 现有的仅渠道绑定（没有 `accountId`）会继续匹配默认账号；账号作用域绑定仍是可选的。
- `openclaw doctor --fix` 也会通过将账号作用域的顶层单账号值移动到为该渠道选择的已提升账号中，来修复混合形状。大多数渠道使用 `accounts.default`；Matrix 可以改为保留现有匹配的命名/默认目标。

### 其他插件渠道

许多插件渠道配置为 `channels.<id>`，并记录在各自专用的渠道页面中（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
查看完整渠道索引：[渠道](/zh-CN/channels)。

### 群聊提及门控

群组消息默认**需要提及**（元数据提及或安全正则表达式模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

可见回复单独控制。普通群组、频道和内部 WebChat 直接请求默认使用自动最终投递：最终助手文本会通过旧版可见回复路径发布。当可见输出应仅在智能体调用 `message(action=send)` 后发布时，选择加入 `messages.visibleReplies: "message_tool"` 或 `messages.groupChat.visibleReplies: "message_tool"`。如果模型在已选择加入的仅工具模式中返回最终文本但没有调用消息工具，该最终文本会保持私密，Gateway 网关详细日志会记录被抑制载荷的元数据。

仅工具可见回复要求模型/运行时能够可靠调用工具，建议在共享的常驻房间中配合 GPT 5.5 等最新一代模型使用。一些较弱模型可以回答最终文本，但无法理解来源可见输出必须用 `message(action=send)` 发送。对于这些模型，请使用 `"automatic"`，让最终助手轮次成为可见回复路径。如果会话日志显示助手文本带有 `didSendViaMessagingTool: false`，说明模型生成了私密最终文本，而不是调用消息工具。请为该渠道切换到更强的工具调用模型，检查 Gateway 网关详细日志中的被抑制载荷摘要，或设置 `messages.groupChat.visibleReplies: "automatic"`，对每个群组/频道请求使用可见最终回复。

如果消息工具在活动工具策略下不可用，OpenClaw 会回退到自动可见回复，而不是静默抑制响应。`openclaw doctor` 会对此不匹配发出警告。

此规则适用于普通智能体最终文本。插件拥有的对话绑定会把拥有插件返回的回复用作已声明绑定线程轮次的可见响应；插件不需要为这些绑定回复调用 `message(action=send)`。

**故障排除：群组 @mention 触发正在输入后静默（无错误）**

症状：群组/频道 @mention 显示正在输入指示器，Gateway 网关日志报告 `dispatch complete (queuedFinal=false, replies=0)`，但房间里没有收到消息。发送给同一智能体的私信会正常回复。

原因：群组/频道可见回复模式解析为 `"message_tool"`，因此 OpenClaw 会运行该轮次，但会抑制最终助手文本，除非智能体调用 `message(action=send)`。此模式下没有 `NO_REPLY` 合约；没有消息工具调用就没有来源回复。没有错误是因为抑制是已配置的行为。普通群组和频道轮次默认值为 `"automatic"`，因此只有在显式将 `messages.groupChat.visibleReplies`（或全局 `messages.visibleReplies`）设置为 `"message_tool"` 时才会出现此症状。Harness `defaultVisibleReplies` 不适用于这里 —— 群组/频道解析器会忽略它；它只影响直接/来源聊天（Codex harness 会用这种方式抑制直接聊天最终回复）。

修复：选择更强的工具调用模型，移除显式 `"message_tool"` 覆盖以回退到 `"automatic"` 默认值，或设置 `messages.groupChat.visibleReplies: "automatic"`，强制每个群组/频道请求使用可见回复。Gateway 网关会在文件保存后热重载 `messages` 配置；只有在部署中禁用文件监听或配置重载时，才需要重启 Gateway 网关。

**提及类型：**

- **元数据提及**：原生平台 @-mentions。在 WhatsApp 自聊模式中会被忽略。
- **文本模式**：`agents.list[].groupChat.mentionPatterns` 中的安全正则表达式模式。无效模式和不安全的嵌套重复会被忽略。
- 只有在可以检测时（原生提及或至少一个模式），才会强制执行提及门控。

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

`messages.groupChat.historyLimit` 设置全局默认值。渠道可以用 `channels.<channel>.historyLimit`（或按账号）覆盖。设置为 `0` 可禁用。

`messages.groupChat.unmentionedInbound: "room_event"` 会在受支持渠道上，将未提及但始终开启的群组/频道消息作为安静的房间上下文提交。被提及的消息、命令和直接消息仍是用户请求。完整的 Discord、Slack 和 Telegram 示例见 [常驻房间事件](/zh-CN/channels/ambient-room-events)。

`messages.visibleReplies` 是全局来源事件默认值；`messages.groupChat.visibleReplies` 会为群组/频道来源事件覆盖它。当未设置 `messages.visibleReplies` 时，直接/来源聊天会使用所选运行时或 harness 默认值，但内部 WebChat 直接轮次会使用自动最终投递，以保持 Pi/Codex 提示词一致性。设置 `messages.visibleReplies: "message_tool"` 可有意要求 `message(action=send)` 用于可见输出。渠道允许列表和提及门控仍会决定是否处理事件。

#### 私信历史限制

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

解析：按私信覆盖 → 提供商默认值 → 无限制（全部保留）。

支持：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自聊模式

在 `allowFrom` 中包含你自己的号码以启用自聊模式（忽略原生 @-mentions，只响应文本模式）：

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

### 命令（聊天命令处理）

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

<Accordion title="命令详情">

- 此块配置命令界面。关于当前内置 + 捆绑命令目录，请参阅[斜杠命令](/zh-CN/tools/slash-commands)。
- 此页面是**配置键参考**，不是完整命令目录。由渠道/插件拥有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、设备配对 `/pair`、记忆 `/dreaming`、手机控制 `/phone` 和 Talk `/voice`，会在对应的渠道/插件页面以及[斜杠命令](/zh-CN/tools/slash-commands)中记录。
- 文本命令必须是带前导 `/` 的**独立**消息。
- `native: "auto"` 会为 Discord/Telegram 开启原生命令，并让 Slack 保持关闭。
- `nativeSkills: "auto"` 会为 Discord/Telegram 开启原生技能命令，并让 Slack 保持关闭。
- 按渠道覆盖：`channels.discord.commands.native`（布尔值或 `"auto"`）。对于 Discord，`false` 会在启动期间跳过原生命令注册和清理。
- 使用 `channels.<provider>.commands.nativeSkills` 按渠道覆盖原生技能注册。
- `channels.telegram.customCommands` 会添加额外的 Telegram 机器人菜单项。
- `bash: true` 会为主机 shell 启用 `! <cmd>`。需要 `tools.elevated.enabled`，并且发送者位于 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 会启用 `/config`（读取/写入 `openclaw.json`）。对于 Gateway 网关 `chat.send` 客户端，持久化的 `/config set|unset` 写入还需要 `operator.admin`；只读的 `/config show` 仍可供具有普通写入作用域的操作员客户端使用。
- `mcp: true` 会为 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置启用 `/mcp`。
- `plugins: true` 会启用 `/plugins`，用于插件发现、安装以及启用/禁用控制。
- `channels.<provider>.configWrites` 会按渠道控制配置变更（默认：true）。
- 对于多账户渠道，`channels.<provider>.accounts.<id>.configWrites` 也会控制面向该账户的写入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 会禁用 `/restart` 和 Gateway 网关重启工具操作。默认值：`true`。
- `ownerAllowFrom` 是面向仅所有者命令和所有者门控渠道操作的显式所有者允许列表。它独立于 `allowFrom`。
- `ownerDisplay: "hash"` 会在系统提示中哈希所有者 ID。设置 `ownerDisplaySecret` 可控制哈希。
- `allowFrom` 按提供商配置。设置后，它就是**唯一**授权来源（渠道允许列表/配对和 `useAccessGroups` 会被忽略）。
- `useAccessGroups: false` 允许命令在未设置 `allowFrom` 时绕过访问组策略。
- 命令文档映射：
  - 内置 + 捆绑目录：[斜杠命令](/zh-CN/tools/slash-commands)
  - 特定渠道的命令界面：[渠道](/zh-CN/channels)
  - QQ Bot 命令：[QQ Bot](/zh-CN/channels/qqbot)
  - 配对命令：[配对](/zh-CN/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-CN/channels/line)
  - 记忆 Dreaming：[Dreaming](/zh-CN/concepts/dreaming)

</Accordion>

---

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference) — 顶层键
- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [渠道概览](/zh-CN/channels)
