---
read_when:
    - 配置渠道插件（身份验证、访问控制、多账号）
    - 按渠道配置键名故障排除
    - 审计私信策略、群组策略或提及门控
summary: 频道配置：访问控制、配对，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等的各渠道密钥
title: 配置 — 渠道
x-i18n:
    generated_at: "2026-05-04T00:47:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57dcc0b5148324ea6fdee51b7b6e97ec7bd7dc3ca89518ab0816fe4172feefbc
    source_path: gateway/config-channels.md
    workflow: 16
---

Per-channel 配置键位于 `channels.*` 下。涵盖私信和群组访问、多账号设置、提及门控，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他内置渠道插件的每渠道键。

对于智能体、工具、Gateway 网关运行时和其他顶级键，请参阅
[配置参考](/zh-CN/gateway/configuration-reference)。

## 渠道

每个渠道会在其配置节存在时自动启动（除非设置了 `enabled: false`）。

### 私信和群组访问

所有渠道都支持私信策略和群组策略：

| 私信策略            | 行为                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（默认） | 未知发送者会获得一次性配对码；所有者必须批准 |
| `allowlist`         | 仅允许 `allowFrom` 中的发送者（或已配对的允许存储中的发送者） |
| `open`              | 允许所有传入私信（需要 `allowFrom: ["*"]`） |
| `disabled`          | 忽略所有传入私信                                          |

| 群组策略              | 行为                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（默认） | 仅允许匹配已配置允许列表的群组          |
| `open`                | 绕过群组允许列表（提及门控仍然适用） |
| `disabled`            | 阻止所有群组/房间消息                          |

<Note>
`channels.defaults.groupPolicy` 会在提供商的 `groupPolicy` 未设置时设置默认值。
配对码会在 1 小时后过期。待处理的私信配对请求上限为**每个渠道 3 个**。
如果提供商块完全缺失（不存在 `channels.<provider>`），运行时群组策略会回退为 `allowlist`（失败时关闭），并显示启动警告。
</Note>

### 渠道模型覆盖

使用 `channels.modelByChannel` 将特定渠道 ID 固定到某个模型。值接受 `provider/model` 或已配置的模型别名。当会话尚未设置模型覆盖（例如通过 `/model` 设置）时，渠道映射会生效。

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

### 渠道默认值和 Heartbeat

使用 `channels.defaults` 为各提供商共享群组策略和 Heartbeat 行为：

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
- `channels.defaults.contextVisibility`：所有渠道的默认补充上下文可见性模式。值：`all`（默认，包含所有引用/线程/历史上下文）、`allowlist`（仅包含来自允许列表发送者的上下文）、`allowlist_quote`（与允许列表相同，但保留显式引用/回复上下文）。每渠道覆盖：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在 Heartbeat 输出中包含健康的渠道 Status。
- `channels.defaults.heartbeat.showAlerts`：在 Heartbeat 输出中包含降级/错误 Status。
- `channels.defaults.heartbeat.useIndicator`：渲染紧凑的指示器式 Heartbeat 输出。

### WhatsApp

WhatsApp 通过 Gateway 网关的 Web 渠道（Baileys Web）运行。存在已链接会话时会自动启动。

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

<Accordion title="多账号 WhatsApp">

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
- 旧版单账号 Baileys 认证目录会由 `openclaw doctor` 迁移到 `whatsapp/default`。
- 每账号覆盖：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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

- Bot token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（仅限普通文件；拒绝符号链接），并以 `TELEGRAM_BOT_TOKEN` 作为默认账号的回退。
- `apiRoot` 仅是 Telegram Bot API 根地址。使用 `https://api.telegram.org` 或你的自托管/代理根地址，而不是 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 会移除意外尾随的 `/bot<TOKEN>` 后缀。
- 可选的 `channels.telegram.defaultAccount` 会在匹配已配置账号 ID 时覆盖默认账号选择。
- 在多账号设置（2 个以上账号 ID）中，请设置显式默认值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免回退路由；缺失或无效时，`openclaw doctor` 会发出警告。
- `configWrites: false` 会阻止 Telegram 发起的配置写入（超级群组 ID 迁移、`/config set|unset`）。
- 顶级 `bindings[]` 条目配合 `type: "acp"` 可为论坛主题配置持久 ACP 绑定（在 `match.peer.id` 中使用规范的 `chatId:topic:topicId`）。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#persistent-channel-bindings) 中共享。
- Telegram 流式预览使用 `sendMessage` + `editMessageText`（适用于直接聊天和群组聊天）。
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
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress
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

- 令牌：`channels.discord.token`，默认账户回退使用 `DISCORD_BOT_TOKEN`。
- 提供显式 Discord `token` 的直接出站调用会将该令牌用于调用；账户重试/策略设置仍来自活跃运行时快照中的所选账户。
- 可选的 `channels.discord.defaultAccount` 在匹配已配置账户 ID 时会覆盖默认账户选择。
- 使用 `user:<id>`（私信）或 `channel:<id>`（服务器频道）作为投递目标；裸数字 ID 会被拒绝。
- 服务器 slug 为小写，并将空格替换为 `-`；频道键使用 slug 化名称（不含 `#`）。优先使用服务器 ID。
- 默认忽略机器人发送的消息。`allowBots: true` 会启用这些消息；使用 `allowBots: "mentions"` 只接受提及机器人的机器人消息（自己的消息仍会被过滤）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及频道覆盖项）会丢弃提及其他用户或角色但未提及机器人的消息（不包括 @everyone/@here）。
- `channels.discord.mentionAliases` 会在发送前将稳定的出站 `@handle` 文本映射到 Discord 用户 ID，因此即使临时目录缓存为空，也可以确定性地提及已知队友。按账户覆盖项位于 `channels.discord.accounts.<accountId>.mentionAliases` 下。
- `maxLinesPerMessage`（默认 17）即使在少于 2000 个字符时，也会拆分很高的消息。
- `channels.discord.threadBindings` 控制 Discord 线程绑定路由：
  - `enabled`：线程绑定会话功能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及绑定投递/路由）的 Discord 覆盖项
  - `idleHours`：按小时计的非活跃自动取消聚焦 Discord 覆盖项（`0` 禁用）
  - `maxAgeHours`：按小时计的硬性最大年龄 Discord 覆盖项（`0` 禁用）
  - `spawnSessions`：`sessions_spawn({ thread: true })` 和 ACP 线程生成自动线程创建/绑定的开关（默认：`true`）
  - `defaultSpawnContext`：线程绑定生成的原生子智能体上下文（默认 `"fork"`）
- 带有 `type: "acp"` 的顶层 `bindings[]` 条目会为频道和线程配置持久 ACP 绑定（在 `match.peer.id` 中使用频道/线程 ID）。字段语义在 [ACP Agents](/zh-CN/tools/acp-agents#persistent-channel-bindings) 中共享。
- `channels.discord.ui.components.accentColor` 设置 Discord 组件 v2 容器的强调色。
- `channels.discord.voice` 启用 Discord 语音频道对话，以及可选的自动加入 + LLM + TTS 覆盖项。纯文本 Discord 配置默认关闭语音；设置 `channels.discord.voice.enabled=true` 以选择启用。
- `channels.discord.voice.model` 可选择覆盖用于 Discord 语音频道响应的 LLM 模型。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 会透传到 `@discordjs/voice` DAVE 选项（默认分别为 `true` 和 `24`）。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试的初始 `@discordjs/voice` Ready 等待时间（默认 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制断开的语音会话在 OpenClaw 销毁它之前，可以用多久进入重连信令（默认 `15000`）。
- OpenClaw 还会在重复解密失败后，通过离开并重新加入语音会话来尝试语音接收恢复。
- `channels.discord.streaming` 是规范的流模式键。旧版 `streamMode` 和布尔值 `streaming` 会自动迁移。
- `channels.discord.autoPresence` 将运行时可用性映射到机器人在线状态（healthy => online、degraded => idle、exhausted => dnd），并允许可选的状态文本覆盖项。
- `channels.discord.dangerouslyAllowNameMatching` 会重新启用可变名称/标签匹配（破窗兼容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec 审批投递和审批人授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在自动模式下，当审批人可从 `approvers` 或 `commands.ownerAllowFrom` 解析时，会激活 exec 审批。
  - `approvers`：允许审批 exec 请求的 Discord 用户 ID。省略时回退到 `commands.ownerAllowFrom`。
  - `agentFilter`：可选的智能体 ID 允许列表。省略则转发所有智能体的审批。
  - `sessionFilter`：可选的会话键模式（子字符串或正则表达式）。
  - `target`：审批提示的发送位置。`"dm"`（默认）发送到审批人的私信，`"channel"` 发送到来源频道，`"both"` 同时发送到两者。当目标包含 `"channel"` 时，按钮仅可由已解析的审批人使用。
  - `cleanupAfterResolve`：为 `true` 时，在批准、拒绝或超时后删除审批私信。

**反应通知模式：** `off`（无）、`own`（机器人的消息，默认）、`all`（所有消息）、`allowlist`（来自所有消息上的 `guilds.<id>.users`）。

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
- `channels.googlechat.dangerouslyAllowNameMatching` 会重新启用可变电子邮件主体匹配（破窗兼容模式）。

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

- **Socket 模式**需要同时提供 `botToken` 和 `appToken`（默认账户环境变量回退为 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加 `signingSecret`（位于根级别或按账户配置）。
- `socketMode` 会将 Slack SDK Socket Mode 传输调优透传到公共 Bolt receiver API。仅在调查 ping/pong 超时或陈旧 websocket 行为时使用它。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文字符串或 SecretRef 对象。
- Slack 账户快照会公开按凭据划分的来源/状态字段，例如 `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式下的 `signingSecretStatus`。`configured_unavailable` 表示该账户通过 SecretRef 配置，但当前命令/运行时路径无法解析密钥值。
- `configWrites: false` 会阻止由 Slack 发起的配置写入。
- 可选的 `channels.slack.defaultAccount` 在匹配已配置账户 ID 时会覆盖默认账户选择。
- `channels.slack.streaming.mode` 是规范的 Slack 流模式键。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生流式传输协议。旧版 `streamMode`、布尔值 `streaming` 和 `nativeStreaming` 会自动迁移。
- 使用 `user:<id>`（私信）或 `channel:<id>` 作为投递目标。

**反应通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程会话隔离：** `thread.historyScope` 是按线程（默认）或在频道中共享。`thread.inheritParent` 会将父频道转录复制到新线程。

- Slack 原生流式传输加上 Slack 助手风格的“is typing...”线程状态需要回复线程目标。顶层私信默认保持在线程外，因此它们仍可通过 Slack 草稿发布并编辑预览进行流式传输，而不是显示线程风格的原生流/状态预览。
- `typingReaction` 会在回复运行期间向入站 Slack 消息添加临时反应，并在完成时移除。使用 Slack 表情短代码，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec 审批投递和审批人授权。架构与 Discord 相同：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 用户 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。

| 操作组 | 默认值 | 说明                  |
| ------------ | ------- | ---------------------- |
| reactions    | 已启用 | 反应 + 列出反应 |
| messages     | 已启用 | 读取/发送/编辑/删除  |
| pins         | 已启用 | 置顶/取消置顶/列出         |
| memberInfo   | 已启用 | 成员信息            |
| emojiList    | 已启用 | 自定义表情列表      |

### Mattermost

Mattermost 在当前 OpenClaw 版本中作为内置插件提供。较旧版本或自定义构建可以使用 `openclaw plugins install @openclaw/mattermost` 安装当前 npm 包。固定版本前，请在 [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) 查看当前 dist-tags。

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

聊天模式：`oncall`（在 @ 提及时响应，默认）、`onmessage`（每条消息）、`onchar`（以触发前缀开头的消息）。

启用 Mattermost 原生命令时：

- `commands.callbackPath` 必须是一个路径（例如 `/api/channels/mattermost/command`），不能是完整 URL。
- `commands.callbackUrl` 必须解析到 OpenClaw Gateway 网关端点，并且 Mattermost 服务器可以访问。
- 原生斜杠命令回调使用 Mattermost 在斜杠命令注册期间返回的按命令 token 进行认证。如果注册失败或没有命令被激活，OpenClaw 会用 `Unauthorized: invalid command token.` 拒绝回调。
- 对于私有/tailnet/内部回调主机，Mattermost 可能要求 `ServiceSettings.AllowedUntrustedInternalConnections` 包含该回调主机/域名。使用主机/域名值，而不是完整 URL。
- `channels.mattermost.configWrites`：允许或拒绝 Mattermost 发起的配置写入。
- `channels.mattermost.requireMention`：在渠道中回复前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：按渠道的提及门控覆盖项（`"*"` 表示默认值）。
- 可选的 `channels.mattermost.defaultAccount` 在匹配已配置账号 ID 时会覆盖默认账号选择。

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

- `channels.signal.account`：将渠道启动固定到特定的 Signal 账号身份。
- `channels.signal.configWrites`：允许或拒绝 Signal 发起的配置写入。
- 可选的 `channels.signal.defaultAccount` 在匹配已配置账号 ID 时会覆盖默认账号选择。

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

- 这里涵盖的核心键路径：`channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 可选的 `channels.bluebubbles.defaultAccount` 在匹配已配置账号 ID 时会覆盖默认账号选择。
- 顶层 `bindings[]` 条目在带有 `type: "acp"` 时，可以将 BlueBubbles 对话绑定到持久 ACP 会话。在 `match.peer.id` 中使用 BlueBubbles handle 或目标字符串（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义：[ACP Agents](/zh-CN/tools/acp-agents#persistent-channel-bindings)。
- 完整的 BlueBubbles 渠道配置记录在 [BlueBubbles](/zh-CN/channels/bluebubbles) 中。

### iMessage

OpenClaw 会启动 `imsg rpc`（通过 stdio 的 JSON-RPC）。不需要守护进程或端口。

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

- 可选的 `channels.imessage.defaultAccount` 在匹配已配置账号 ID 时会覆盖默认账号选择。

- 需要对 Messages DB 授予 Full Disk Access。
- 优先使用 `chat_id:<id>` 目标。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH 包装器；设置 `remoteHost`（`host` 或 `user@host`）以通过 SCP 获取附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 会限制入站附件路径（默认：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用严格的主机密钥检查，因此请确保中继主机密钥已存在于 `~/.ssh/known_hosts` 中。
- `channels.imessage.configWrites`：允许或拒绝 iMessage 发起的配置写入。
- 顶层 `bindings[]` 条目在带有 `type: "acp"` 时，可以将 iMessage 对话绑定到持久 ACP 会话。在 `match.peer.id` 中使用规范化 handle 或显式聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义：[ACP Agents](/zh-CN/tools/acp-agents#persistent-channel-bindings)。

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

- token 认证使用 `accessToken`；密码认证使用 `userId` + `password`。
- `channels.matrix.proxy` 会通过显式 HTTP(S) 代理路由 Matrix HTTP 流量。命名账号可以用 `channels.matrix.accounts.<id>.proxy` 覆盖它。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允许私有/内部 homeserver。`proxy` 和这个网络显式启用项是彼此独立的控制项。
- `channels.matrix.defaultAccount` 在多账号设置中选择首选账号。
- `channels.matrix.autoJoin` 默认为 `off`，因此邀请的房间和新的私信样式邀请会被忽略，直到你设置 `autoJoin: "allowlist"` 并使用 `autoJoinAllowlist`，或设置 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec 审批投递和审批者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在 auto 模式下，当可从 `approvers` 或 `commands.ownerAllowFrom` 解析审批者时，会激活 exec 审批。
  - `approvers`：允许审批 exec 请求的 Matrix 用户 ID（例如 `@owner:example.org`）。
  - `agentFilter`：可选的智能体 ID 允许列表。省略时会转发所有智能体的审批。
  - `sessionFilter`：可选的会话键模式（子字符串或正则）。
  - `target`：发送审批提示的位置。`"dm"`（默认）、`"channel"`（来源房间）或 `"both"`。
  - 按账号覆盖：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私信如何分组到会话中：`per-user`（默认）按路由的对端共享，而 `per-room` 会隔离每个私信房间。
- Matrix 状态探测和实时目录查找使用与运行时流量相同的代理策略。
- 完整的 Matrix 配置、目标规则和设置示例记录在 [Matrix](/zh-CN/channels/matrix) 中。

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
- 完整的 Teams 配置（凭据、webhook、私信/群组策略、按团队/按渠道覆盖项）记录在 [Microsoft Teams](/zh-CN/channels/msteams) 中。

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
- 可选的 `channels.irc.defaultAccount` 在匹配已配置账号 ID 时会覆盖默认账号选择。
- 完整的 IRC 渠道配置（host/port/TLS/channels/allowlists/提及门控）记录在 [IRC](/zh-CN/channels/irc) 中。

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

- 省略 `accountId` 时使用 `default`（CLI + 路由）。
- 环境变量 token 只适用于 **默认** 账号。
- 基础渠道设置会应用于所有账号，除非按账号覆盖。
- 使用 `bindings[].match.accountId` 将每个账号路由到不同的智能体。
- 如果你在仍使用单账号顶层渠道配置时，通过 `openclaw channels add`（或渠道新手引导）添加非默认账号，OpenClaw 会先将账号作用域的顶层单账号值提升到渠道账号映射中，以便原账号继续工作。大多数渠道会将它们移动到 `channels.<channel>.accounts.default`；Matrix 可以改为保留现有匹配的命名/默认目标。
- 现有仅渠道绑定（没有 `accountId`）会继续匹配默认账号；账号作用域绑定仍然是可选的。
- `openclaw doctor --fix` 也会通过将账号作用域的顶层单账号值移动到为该渠道选择的已提升账号中，来修复混合形态。大多数渠道使用 `accounts.default`；Matrix 可以改为保留现有匹配的命名/默认目标。

### 其他插件渠道

许多插件渠道配置为 `channels.<id>`，并记录在各自专用的渠道页面中（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
查看完整渠道索引：[Channels](/zh-CN/channels)。

### 群聊提及门控

群组消息默认 **要求提及**（元数据提及或安全正则模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

可见回复由单独的设置控制。群组/渠道房间默认使用 `messages.groupChat.visibleReplies: "message_tool"`：OpenClaw 仍会处理本轮交互，但普通最终回复会保持私密，可见的房间输出需要 `message(action=send)`。仅当你想要旧版行为，即普通回复会被发回房间时，才设置 `"automatic"`。若要把相同的仅工具可见回复行为也应用到直接聊天，请设置 `messages.visibleReplies: "message_tool"`；Codex harness 也将该仅工具行为作为其未设置的直接聊天默认值。

仅工具可见回复需要能够可靠调用工具的模型/运行时。如果会话日志显示 assistant 文本带有 `didSendViaMessagingTool: false`，则表示模型生成了私密最终回答，而不是调用消息工具。为该渠道切换到更强的工具调用模型，或设置 `messages.groupChat.visibleReplies: "automatic"` 以恢复旧版可见最终回复。

如果消息工具在当前工具策略下不可用，OpenClaw 会回退到自动可见回复，而不是静默抑制响应。`openclaw doctor` 会对此不匹配发出警告。

文件保存后，Gateway 网关会热重载 `messages` 配置。仅当部署中禁用了文件监听或配置重载时才需要重启。

**提及类型：**

- **元数据提及**：原生平台 `@` 提及。在 WhatsApp 自聊模式中会被忽略。
- **文本模式**：`agents.list[].groupChat.mentionPatterns` 中的安全正则模式。无效模式和不安全的嵌套重复会被忽略。
- 只有在可以检测时（原生提及或至少一个模式），才会强制执行提及门控。

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

`messages.groupChat.historyLimit` 设置全局默认值。渠道可以使用 `channels.<channel>.historyLimit`（或按账号）覆盖。设置为 `0` 可禁用。

`messages.visibleReplies` 是全局源轮次默认值；`messages.groupChat.visibleReplies` 会为群组/频道源轮次覆盖它。当 `messages.visibleReplies` 未设置时，harness 可以提供自己的直接/源默认值；Codex harness 默认使用 `message_tool`。渠道允许列表和提及门控仍会决定是否处理某个轮次。

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

在 `allowFrom` 中包含你自己的号码可启用自聊模式（忽略原生 `@` 提及，只响应文本模式）：

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

- 此区块配置命令入口。当前内置 + 捆绑命令目录见 [Slash Commands](/zh-CN/tools/slash-commands)。
- 本页是**配置键参考**，不是完整命令目录。渠道/插件拥有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、设备配对 `/pair`、memory `/dreaming`、phone-control `/phone` 和 Talk `/voice`，在其渠道/插件页面以及 [Slash Commands](/zh-CN/tools/slash-commands) 中记录。
- 文本命令必须是以 `/` 开头的**独立**消息。
- `native: "auto"` 为 Discord/Telegram 开启原生命令，Slack 保持关闭。
- `nativeSkills: "auto"` 为 Discord/Telegram 开启原生 Skills 命令，Slack 保持关闭。
- 按渠道覆盖：`channels.discord.commands.native`（布尔值或 `"auto"`）。对于 Discord，`false` 会跳过启动期间的原生命令注册和清理。
- 使用 `channels.<provider>.commands.nativeSkills` 按渠道覆盖原生 Skills 注册。
- `channels.telegram.customCommands` 会添加额外的 Telegram bot 菜单条目。
- `bash: true` 为主机 shell 启用 `! <cmd>`。需要 `tools.elevated.enabled`，且发送者在 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 启用 `/config`（读取/写入 `openclaw.json`）。对于 Gateway 网关 `chat.send` 客户端，持久化 `/config set|unset` 写入还需要 `operator.admin`；只读 `/config show` 仍可供普通写入范围的操作员客户端使用。
- `mcp: true` 为 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置启用 `/mcp`。
- `plugins: true` 为插件发现、安装以及启用/禁用控制启用 `/plugins`。
- `channels.<provider>.configWrites` 按渠道控制配置变更（默认：true）。
- 对于多账号渠道，`channels.<provider>.accounts.<id>.configWrites` 也会控制针对该账号的写入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 禁用 `/restart` 和 Gateway 网关重启工具操作。默认值：`true`。
- `ownerAllowFrom` 是仅限所有者的命令/工具的显式所有者允许列表。它独立于 `allowFrom`。
- `ownerDisplay: "hash"` 会在系统提示中哈希所有者 ID。设置 `ownerDisplaySecret` 可控制哈希。
- `allowFrom` 是按提供商设置的。设置后，它是**唯一**授权来源（渠道允许列表/配对和 `useAccessGroups` 会被忽略）。
- 当 `allowFrom` 未设置时，`useAccessGroups: false` 允许命令绕过访问组策略。
- 命令文档映射：
  - 内置 + 捆绑目录：[Slash Commands](/zh-CN/tools/slash-commands)
  - 渠道特定命令入口：[Channels](/zh-CN/channels)
  - QQ Bot 命令：[QQ Bot](/zh-CN/channels/qqbot)
  - 配对命令：[Pairing](/zh-CN/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-CN/channels/line)
  - 记忆 Dreaming：[Dreaming](/zh-CN/concepts/dreaming)

</Accordion>

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) — 顶层键
- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [渠道概览](/zh-CN/channels)
