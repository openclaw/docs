---
read_when:
    - 配置渠道插件（身份验证、访问控制、多账户）
    - 每个渠道配置键的故障排除
    - 审计私信策略、群组策略或提及门控
summary: 渠道配置：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等渠道的访问控制、配对和每渠道密钥
title: 配置 — 渠道
x-i18n:
    generated_at: "2026-04-28T13:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e56a515d15fc6122d4de6cb30b81d969da9d72d9bb8fbba8a19542af35102058
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 下的按渠道配置键。涵盖私信和群组访问、
多账号设置、提及门控，以及 Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage 和其他内置渠道插件的按渠道键。

对于智能体、工具、Gateway 网关运行时以及其他顶级键，请参见
[配置参考](/zh-CN/gateway/configuration-reference)。

## 渠道

每个渠道会在其配置段存在时自动启动（除非设置了 `enabled: false`）。

### 私信和群组访问

所有渠道都支持私信策略和群组策略：

| 私信策略            | 行为                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（默认）   | 未知发送者会收到一次性配对码；所有者必须批准                    |
| `allowlist`         | 仅允许 `allowFrom` 中的发送者（或已配对的允许存储中的发送者）   |
| `open`              | 允许所有传入私信（需要 `allowFrom: ["*"]`）                     |
| `disabled`          | 忽略所有传入私信                                                |

| 群组策略              | 行为                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（默认）   | 仅允许匹配已配置允许列表的群组                         |
| `open`                | 绕过群组允许列表（提及门控仍然适用）                   |
| `disabled`            | 阻止所有群组/房间消息                                  |

<Note>
`channels.defaults.groupPolicy` 会在提供商的 `groupPolicy` 未设置时设置默认值。
配对码会在 1 小时后过期。待处理的私信配对请求上限为**每个渠道 3 个**。
如果提供商块完全缺失（不存在 `channels.<provider>`），运行时群组策略会回退到 `allowlist`（故障关闭），并在启动时发出警告。
</Note>

### 渠道模型覆盖

使用 `channels.modelByChannel` 将特定渠道 ID 固定到某个模型。值接受 `provider/model` 或已配置的模型别名。当会话尚未有模型覆盖时（例如通过 `/model` 设置），会应用渠道映射。

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

### 渠道默认值和心跳

使用 `channels.defaults` 为各提供商共享群组策略和心跳行为：

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

- `channels.defaults.groupPolicy`：提供商级 `groupPolicy` 未设置时的回退群组策略。
- `channels.defaults.contextVisibility`：所有渠道的默认补充上下文可见性模式。取值：`all`（默认，包含所有引用/线程/历史上下文）、`allowlist`（仅包含来自允许列表发送者的上下文）、`allowlist_quote`（与 allowlist 相同，但保留显式引用/回复上下文）。按渠道覆盖：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在心跳输出中包含健康渠道 Status。
- `channels.defaults.heartbeat.showAlerts`：在心跳输出中包含降级/错误 Status。
- `channels.defaults.heartbeat.useIndicator`：渲染紧凑的指示器样式心跳输出。

### WhatsApp

WhatsApp 通过 Gateway 网关的 Web 渠道（Baileys Web）运行。当存在已链接会话时，它会自动启动。

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

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

- 出站命令默认使用账号 `default`（如果存在）；否则使用第一个已配置账号 ID（排序后）。
- 可选的 `channels.whatsapp.defaultAccount` 会在其匹配已配置账号 ID 时覆盖该回退默认账号选择。
- 旧版单账号 Baileys 认证目录会由 `openclaw doctor` 迁移到 `whatsapp/default`。
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

- 机器人令牌：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（仅限常规文件；符号链接会被拒绝），默认账号的回退值为 `TELEGRAM_BOT_TOKEN`。
- `apiRoot` 仅是 Telegram Bot API 根地址。使用 `https://api.telegram.org` 或你的自托管/代理根地址，不要使用 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 会移除意外的尾随 `/bot<TOKEN>` 后缀。
- 可选的 `channels.telegram.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。
- 在多账号设置（2 个以上账号 ID）中，设置显式默认值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`），以避免回退路由；当缺失或无效时，`openclaw doctor` 会发出警告。
- `configWrites: false` 会阻止 Telegram 发起的配置写入（超级群组 ID 迁移、`/config set|unset`）。
- 顶级 `bindings[]` 条目使用 `type: "acp"` 为论坛话题配置持久 ACP 绑定（在 `match.peer.id` 中使用规范的 `chatId:topic:topicId`）。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#channel-specific-settings) 中共享。
- Telegram 流式预览使用 `sendMessage` + `editMessageText`（适用于直接聊天和群聊）。
- 重试策略：请参见[重试策略](/zh-CN/concepts/retry)。

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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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

- 令牌：`channels.discord.token`，默认账户可回退到 `DISCORD_BOT_TOKEN`。
- 提供显式 Discord `token` 的直接出站调用会使用该令牌执行调用；账户重试/策略设置仍来自活动运行时快照中选定的账户。
- 可选的 `channels.discord.defaultAccount` 在匹配已配置账户 ID 时会覆盖默认账户选择。
- 使用 `user:<id>`（私信）或 `channel:<id>`（服务器频道）作为投递目标；裸数字 ID 会被拒绝。
- 服务器 slug 为小写，并将空格替换为 `-`；频道键使用 slug 化后的名称（不含 `#`）。优先使用服务器 ID。
- 默认忽略机器人发送的消息。`allowBots: true` 会启用这些消息；使用 `allowBots: "mentions"` 仅接受提及该机器人的机器人消息（仍会过滤自己的消息）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及频道覆盖项）会丢弃提及其他用户或角色但未提及该机器人的消息（不包括 @everyone/@here）。
- `maxLinesPerMessage`（默认 17）会拆分过高的消息，即使消息少于 2000 个字符。
- `channels.discord.threadBindings` 控制 Discord 线程绑定路由：
  - `enabled`：Discord 对线程绑定会话功能的覆盖（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及绑定投递/路由）
  - `idleHours`：Discord 对非活动自动取消聚焦小时数的覆盖（`0` 表示禁用）
  - `maxAgeHours`：Discord 对硬性最长生命周期小时数的覆盖（`0` 表示禁用）
  - `spawnSubagentSessions`：`sessions_spawn({ thread: true })` 自动创建/绑定线程的选择加入开关
- 顶层 `bindings[]` 中带有 `type: "acp"` 的条目会为渠道和线程配置持久 ACP 绑定（在 `match.peer.id` 中使用频道/线程 ID）。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#channel-specific-settings) 中共享。
- `channels.discord.ui.components.accentColor` 设置 Discord components v2 容器的强调色。
- `channels.discord.voice` 启用 Discord 语音频道对话，以及可选的自动加入 + LLM + TTS 覆盖。
- `channels.discord.voice.model` 可选地覆盖用于 Discord 语音频道响应的 LLM 模型。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 会传递给 `@discordjs/voice` DAVE 选项（默认分别为 `true` 和 `24`）。
- OpenClaw 还会在重复解密失败后尝试通过离开/重新加入语音会话来恢复语音接收。
- `channels.discord.streaming` 是规范的流模式键。旧版 `streamMode` 和布尔值 `streaming` 会自动迁移。
- `channels.discord.autoPresence` 将运行时可用性映射到机器人在线状态（healthy => online、degraded => idle、exhausted => dnd），并允许可选的状态文本覆盖。
- `channels.discord.dangerouslyAllowNameMatching` 会重新启用可变名称/tag 匹配（应急兼容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec 审批投递和审批者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在自动模式下，当可以从 `approvers` 或 `commands.ownerAllowFrom` 解析审批者时，exec 审批会激活。
  - `approvers`：允许审批 exec 请求的 Discord 用户 ID。省略时回退到 `commands.ownerAllowFrom`。
  - `agentFilter`：可选的智能体 ID 允许列表。省略则转发所有智能体的审批。
  - `sessionFilter`：可选的会话键模式（子字符串或正则表达式）。
  - `target`：发送审批提示的位置。`"dm"`（默认）发送到审批者私信，`"channel"` 发送到来源频道，`"both"` 同时发送到两者。当 target 包含 `"channel"` 时，按钮只能由已解析的审批者使用。
  - `cleanupAfterResolve`：当为 `true` 时，会在批准、拒绝或超时后删除审批私信。

**反应通知模式：**`off`（无）、`own`（机器人的消息，默认）、`all`（所有消息）、`allowlist`（来自所有消息上的 `guilds.<id>.users`）。

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

- 服务账户 JSON：内联（`serviceAccount`）或基于文件（`serviceAccountFile`）。
- 也支持服务账户 SecretRef（`serviceAccountRef`）。
- 环境变量回退：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
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

- **Socket mode** 需要同时配置 `botToken` 和 `appToken`（默认账户环境变量回退为 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式** 需要 `botToken` 加 `signingSecret`（在根级或每个账户中）。
- `socketMode` 会将 Slack SDK Socket Mode 传输调优传递给公共 Bolt receiver API。仅在调查 ping/pong 超时或陈旧 websocket 行为时使用它。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文字符串或 SecretRef 对象。
- Slack 账户快照会暴露每项凭证的来源/状态字段，例如 `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式下的 `signingSecretStatus`。`configured_unavailable` 表示该账户已通过 SecretRef 配置，但当前命令/运行时路径无法解析密钥值。
- `configWrites: false` 会阻止 Slack 发起的配置写入。
- 可选的 `channels.slack.defaultAccount` 在匹配已配置账户 ID 时会覆盖默认账户选择。
- `channels.slack.streaming.mode` 是规范的 Slack 流模式键。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生流传输。旧版 `streamMode`、布尔值 `streaming` 和 `nativeStreaming` 会自动迁移。
- 使用 `user:<id>`（私信）或 `channel:<id>` 作为投递目标。

**反应通知模式：**`off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程会话隔离：**`thread.historyScope` 是按线程（默认）或在频道间共享。`thread.inheritParent` 会将父频道转录复制到新线程。

- Slack 原生流式传输以及 Slack 助手风格的 “is typing...” 线程状态需要回复线程目标。顶层私信默认保持在线程外，因此它们使用 `typingReaction` 或普通投递，而不是线程风格预览。
- `typingReaction` 会在回复运行时向入站 Slack 消息添加临时反应，并在完成后移除。使用 Slack emoji shortcode，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec 审批投递和审批者授权。与 Discord 相同的 schema：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 用户 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。

| 操作组 | 默认值 | 说明                  |
| ------------ | ------- | ---------------------- |
| reactions    | 启用 | 反应 + 列出反应 |
| messages     | 启用 | 读取/发送/编辑/删除  |
| pins         | 启用 | 置顶/取消置顶/列出         |
| memberInfo   | 启用 | 成员信息            |
| emojiList    | 启用 | 自定义 emoji 列表      |

### Mattermost

Mattermost 作为插件提供：`openclaw plugins install @openclaw/mattermost`。

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

- `commands.callbackPath` 必须是路径（例如 `/api/channels/mattermost/command`），而不是完整 URL。
- `commands.callbackUrl` 必须解析到 OpenClaw Gateway 网关端点，并可从 Mattermost 服务器访问。
- 原生 slash 回调使用 Mattermost 在 slash 命令注册期间返回的每命令令牌进行身份验证。如果注册失败或没有命令被激活，OpenClaw 会以 `Unauthorized: invalid command token.` 拒绝回调。
- 对于私有/tailnet/内部回调主机，Mattermost 可能要求 `ServiceSettings.AllowedUntrustedInternalConnections` 包含回调主机/域名。使用主机/域名值，而不是完整 URL。
- `channels.mattermost.configWrites`：允许或拒绝 Mattermost 发起的配置写入。
- `channels.mattermost.requireMention`：在频道中回复前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：按频道的提及门控覆盖（`"*"` 表示默认值）。
- 可选的 `channels.mattermost.defaultAccount` 在匹配已配置账户 ID 时会覆盖默认账户选择。

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

**回应通知模式：**`off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

- `channels.signal.account`：将渠道启动固定到特定 Signal 账户身份。
- `channels.signal.configWrites`：允许或拒绝由 Signal 发起的配置写入。
- 可选的 `channels.signal.defaultAccount` 会在匹配已配置的账户 ID 时覆盖默认账户选择。

### BlueBubbles

BlueBubbles 是推荐的 iMessage 路径（由插件支持，在 `channels.bluebubbles` 下配置）。

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

- 此处涵盖的核心键路径：`channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 可选的 `channels.bluebubbles.defaultAccount` 会在匹配已配置的账户 ID 时覆盖默认账户选择。
- 顶层 `bindings[]` 条目使用 `type: "acp"` 时，可以将 BlueBubbles 对话绑定到持久 ACP 会话。在 `match.peer.id` 中使用 BlueBubbles 句柄或目标字符串（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义见：[ACP 智能体](/zh-CN/tools/acp-agents#channel-specific-settings)。
- 完整 BlueBubbles 渠道配置记录在 [BlueBubbles](/zh-CN/channels/bluebubbles)。

### iMessage

OpenClaw 会生成 `imsg rpc`（通过 stdio 的 JSON-RPC）。不需要守护进程或端口。

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

- 可选的 `channels.imessage.defaultAccount` 会在匹配已配置的账户 ID 时覆盖默认账户选择。

- 需要对 Messages 数据库启用完全磁盘访问权限。
- 优先使用 `chat_id:<id>` 目标。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH 包装器；设置 `remoteHost`（`host` 或 `user@host`）用于通过 SCP 获取附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 限制入站附件路径（默认：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用严格的主机密钥检查，因此请确保中继主机密钥已经存在于 `~/.ssh/known_hosts` 中。
- `channels.imessage.configWrites`：允许或拒绝由 iMessage 发起的配置写入。
- 顶层 `bindings[]` 条目使用 `type: "acp"` 时，可以将 iMessage 对话绑定到持久 ACP 会话。在 `match.peer.id` 中使用规范化句柄或显式聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义见：[ACP 智能体](/zh-CN/tools/acp-agents#channel-specific-settings)。

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
- `channels.matrix.proxy` 通过显式 HTTP(S) 代理路由 Matrix HTTP 流量。命名账户可以用 `channels.matrix.accounts.<id>.proxy` 覆盖它。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允许私有/内部 homeserver。`proxy` 和此网络选择加入是独立控制项。
- `channels.matrix.defaultAccount` 在多账户设置中选择首选账户。
- `channels.matrix.autoJoin` 默认为 `off`，因此受邀房间和新的私信式邀请会被忽略，直到你设置带 `autoJoinAllowlist` 的 `autoJoin: "allowlist"`，或设置 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec 审批投递和审批者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在自动模式下，当可以从 `approvers` 或 `commands.ownerAllowFrom` 解析审批者时，exec 审批会激活。
  - `approvers`：允许批准 exec 请求的 Matrix 用户 ID（例如 `@owner:example.org`）。
  - `agentFilter`：可选智能体 ID 允许列表。省略则转发所有智能体的审批。
  - `sessionFilter`：可选会话键模式（子字符串或正则表达式）。
  - `target`：审批提示发送位置。`"dm"`（默认）、`"channel"`（来源房间）或 `"both"`。
  - 按账户覆盖：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私信如何分组为会话：`per-user`（默认）按路由对端共享，而 `per-room` 会隔离每个私信房间。
- Matrix Status 探测和实时目录查找使用与运行时流量相同的代理策略。
- 完整 Matrix 配置、目标规则和设置示例记录在 [Matrix](/zh-CN/channels/matrix)。

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

- 此处涵盖的核心键路径：`channels.msteams`、`channels.msteams.configWrites`。
- 完整 Teams 配置（凭证、webhook、私信/群组策略、按团队/按渠道覆盖）记录在 [Microsoft Teams](/zh-CN/channels/msteams)。

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

- 此处涵盖的核心键路径：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 可选的 `channels.irc.defaultAccount` 会在匹配已配置的账户 ID 时覆盖默认账户选择。
- 完整 IRC 渠道配置（主机/端口/TLS/渠道/允许列表/提及门控）记录在 [IRC](/zh-CN/channels/irc)。

### 多账户（所有渠道）

每个渠道运行多个账户（每个账户都有自己的 `accountId`）：

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

- 省略 `accountId` 时使用 `default`（CLI + 路由）。
- 环境变量令牌仅适用于**默认**账户。
- 基础渠道设置会应用于所有账户，除非按账户覆盖。
- 使用 `bindings[].match.accountId` 将每个账户路由到不同智能体。
- 如果你通过 `openclaw channels add`（或渠道新手引导）添加非默认账户，而当前仍是单账户顶层渠道配置，OpenClaw 会先将账户范围的顶层单账户值提升到渠道账户映射中，使原账户继续工作。多数渠道会将它们移动到 `channels.<channel>.accounts.default`；Matrix 则可以保留现有匹配的命名/默认目标。
- 现有仅渠道绑定（没有 `accountId`）会继续匹配默认账户；账户范围绑定仍是可选的。
- `openclaw doctor --fix` 也会通过将账户范围的顶层单账户值移动到为该渠道选择的提升账户中来修复混合形态。多数渠道使用 `accounts.default`；Matrix 则可以保留现有匹配的命名/默认目标。

### 其他插件渠道

许多插件渠道配置为 `channels.<id>`，并记录在其专用渠道页面中（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
查看完整渠道索引：[渠道](/zh-CN/channels)。

### 群聊提及门控

群组消息默认**需要提及**（元数据提及或安全正则表达式模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

可见回复单独控制。群组/渠道房间默认使用 `messages.groupChat.visibleReplies: "message_tool"`：OpenClaw 仍会处理该轮对话，但普通最终回复保持私密，可见的房间输出需要 `message(action=send)`。仅当你想要普通回复被发回房间的旧版行为时，才设置 `"automatic"`。

**提及类型：**

- **元数据提及**：原生平台 @ 提及。在 WhatsApp 自聊模式中会被忽略。
- **文本模式**：`agents.list[].groupChat.mentionPatterns` 中的安全正则表达式模式。无效模式和不安全的嵌套重复会被忽略。
- 仅在可以检测时（原生提及或至少一个模式）才强制提及门控。

```json5
{
  messages: {
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

`messages.groupChat.historyLimit` 设置全局默认值。渠道可以用 `channels.<channel>.historyLimit`（或按账户）覆盖。设置为 `0` 可禁用。

`messages.groupChat.visibleReplies` 对群组/渠道来源轮次全局生效；渠道允许列表和提及门控仍决定是否处理某一轮。

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

解析顺序：按私信覆盖 → 提供商默认值 → 无限制（全部保留）。

支持：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自聊模式

在 `allowFrom` 中包含你自己的号码以启用自聊模式（忽略原生 @ 提及，仅响应文本模式）：

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

- 此代码块用于配置命令入口。有关当前内置 + 打包命令目录，请参阅[斜杠命令](/zh-CN/tools/slash-commands)。
- 本页是**配置键参考**，不是完整的命令目录。由渠道/插件拥有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、设备配对 `/pair`、memory `/dreaming`、phone-control `/phone` 和 Talk `/voice`，记录在各自的渠道/插件页面以及[斜杠命令](/zh-CN/tools/slash-commands)中。
- 文本命令必须是带有前导 `/` 的**独立**消息。
- `native: "auto"` 会为 Discord/Telegram 启用原生命令，并让 Slack 保持关闭。
- `nativeSkills: "auto"` 会为 Discord/Telegram 启用原生 Skills 命令，并让 Slack 保持关闭。
- 按渠道覆盖：`channels.discord.commands.native`（布尔值或 `"auto"`）。`false` 会清除之前注册的命令。
- 使用 `channels.<provider>.commands.nativeSkills` 按渠道覆盖原生 Skills 注册。
- `channels.telegram.customCommands` 会添加额外的 Telegram bot 菜单条目。
- `bash: true` 会为主机 shell 启用 `! <cmd>`。需要 `tools.elevated.enabled`，且发送者在 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 启用 `/config`（读取/写入 `openclaw.json`）。对于 Gateway 网关 `chat.send` 客户端，持久化的 `/config set|unset` 写入还需要 `operator.admin`；只读的 `/config show` 仍可供普通写入范围的 operator 客户端使用。
- `mcp: true` 为 `mcp.servers` 下由 OpenClaw 管理的 MCP server 配置启用 `/mcp`。
- `plugins: true` 为插件发现、安装以及启用/禁用控制启用 `/plugins`。
- `channels.<provider>.configWrites` 按渠道控制配置变更（默认值：true）。
- 对于多账号渠道，`channels.<provider>.accounts.<id>.configWrites` 也会控制面向该账号的写入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 会禁用 `/restart` 和 Gateway 网关重启工具操作。默认值：`true`。
- `ownerAllowFrom` 是仅限 owner 使用的命令/工具的显式 owner allowlist。它独立于 `allowFrom`。
- `ownerDisplay: "hash"` 会在系统提示中对 owner id 进行哈希处理。设置 `ownerDisplaySecret` 可控制哈希。
- `allowFrom` 按提供商配置。设置后，它就是**唯一**授权来源（渠道 allowlist/配对和 `useAccessGroups` 都会被忽略）。
- 当未设置 `allowFrom` 时，`useAccessGroups: false` 允许命令绕过 access-group 策略。
- 命令文档映射：
  - 内置 + 打包目录：[斜杠命令](/zh-CN/tools/slash-commands)
  - 渠道特定的命令入口：[渠道](/zh-CN/channels)
  - QQ Bot 命令：[QQ Bot](/zh-CN/channels/qqbot)
  - 配对命令：[配对](/zh-CN/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-CN/channels/line)
  - memory dreaming：[Dreaming](/zh-CN/concepts/dreaming)

</Accordion>

---

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference) — 顶层键
- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [渠道概览](/zh-CN/channels)
