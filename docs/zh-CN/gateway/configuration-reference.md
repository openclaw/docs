---
read_when:
    - 你需要精确到字段级别的配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: 每个 OpenClaw 配置键、默认值和渠道设置的完整参考
title: 配置参考
x-i18n:
    generated_at: "2026-04-05T19:23:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2ac0b26762d642cd3667b3f18b11938947968e79d9cd363e86e31312ce7e981
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 配置参考

`~/.openclaw/openclaw.json` 中提供的每个字段。若要查看面向任务的概览，请参见 [Configuration](/zh-CN/gateway/configuration)。

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段都是可选的——省略时，OpenClaw 会使用安全的默认值。

---

## 渠道

每个渠道只要存在其配置段，就会自动启动（除非设置了 `enabled: false`）。

### 私信和群组访问

所有渠道都支持私信策略和群组策略：

| 私信策略              | 行为                                  |
| --------------------- | ------------------------------------- |
| `pairing`（默认）     | 未知发送者会收到一次性配对码；所有者必须批准 |
| `allowlist`           | 仅允许 `allowFrom` 中的发送者（或已配对允许存储中的发送者） |
| `open`                | 允许所有传入私信（需要 `allowFrom: ["*"]`） |
| `disabled`            | 忽略所有传入私信                      |

| 群组策略                | 行为                                      |
| ----------------------- | ----------------------------------------- |
| `allowlist`（默认）     | 仅允许与已配置允许列表匹配的群组          |
| `open`                  | 绕过群组允许列表（仍会应用提及门控）      |
| `disabled`              | 阻止所有群组/房间消息                     |

<Note>
`channels.defaults.groupPolicy` 会在提供商的 `groupPolicy` 未设置时作为默认值。
配对码会在 1 小时后过期。待处理的私信配对请求每个渠道上限为 **3 个**。
如果某个提供商块完全缺失（不存在 `channels.<provider>`），运行时群组策略会回退为 `allowlist`（默认拒绝）并在启动时发出警告。
</Note>

### 渠道模型覆盖

使用 `channels.modelByChannel` 将特定渠道 ID 固定到某个模型。值接受 `provider/model` 或已配置的模型别名。当某个会话尚未有模型覆盖时（例如通过 `/model` 设置），才会应用该渠道映射。

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

- `channels.defaults.groupPolicy`：当提供商级 `groupPolicy` 未设置时使用的回退群组策略。
- `channels.defaults.contextVisibility`：所有渠道的默认补充上下文可见性模式。取值：`all`（默认，包含所有引用/线程/历史上下文）、`allowlist`（仅包含来自允许列表发送者的上下文）、`allowlist_quote`（与 allowlist 相同，但保留显式引用/回复上下文）。每渠道覆盖：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在心跳输出中包含健康渠道状态。
- `channels.defaults.heartbeat.showAlerts`：在心跳输出中包含降级/错误状态。
- `channels.defaults.heartbeat.useIndicator`：渲染紧凑的指示器样式心跳输出。

### WhatsApp

WhatsApp 通过 Gateway 网关的 Web 渠道（Baileys Web）运行。存在已关联的会话时会自动启动。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 蓝色对勾（自聊模式下为 false）
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
- 可选的 `channels.whatsapp.defaultAccount` 会在其匹配已配置账号 ID 时覆盖该默认账号选择。
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
        { command: "backup", description: "Git 备份" },
        { command: "generate", description: "创建图像" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress（默认：off；为避免预览编辑频率限制，需要显式启用）
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（仅允许常规文件；拒绝符号链接），默认账号还可回退到 `TELEGRAM_BOT_TOKEN`。
- 可选的 `channels.telegram.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。
- 在多账号设置（2 个及以上账号 ID）中，设置显式默认值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免回退路由；若缺失或无效，`openclaw doctor` 会发出警告。
- `configWrites: false` 会阻止由 Telegram 发起的配置写入（超级群组 ID 迁移、`/config set|unset`）。
- 顶层 `bindings[]` 中 `type: "acp"` 的条目可为论坛话题配置持久 ACP 绑定（在 `match.peer.id` 中使用规范形式 `chatId:topic:topicId`）。字段语义与 [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings) 共享。
- Telegram 流式预览使用 `sendMessage` + `editMessageText`（可用于私聊和群聊）。
- 重试策略：参见 [Retry policy](/zh-CN/concepts/retry)。

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
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
      replyToMode: "off", // off | first | all
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
              systemPrompt: "只给出简短回答。",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress（在 Discord 上，progress 会映射为 partial）
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
        spawnSubagentSessions: false, // 为 `sessions_spawn({ thread: true })` 选择性启用
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

- Token：`channels.discord.token`，默认账号可回退到 `DISCORD_BOT_TOKEN`。
- 直接出站调用如果显式提供 Discord `token`，该次调用会使用该 token；账号重试/策略设置仍来自活动运行时快照中的已选账号。
- 可选的 `channels.discord.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。
- 使用 `user:<id>`（私信）或 `channel:<id>`（服务器频道）作为投递目标；裸数字 ID 会被拒绝。
- 服务器 slug 会转为小写并将空格替换为 `-`；频道键使用 slug 化名称（不带 `#`）。优先使用服务器 ID。
- 默认会忽略机器人发送的消息。`allowBots: true` 会启用它们；使用 `allowBots: "mentions"` 可仅接受提及机器人的机器人消息（机器人自己发的消息仍会被过滤）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及频道级覆盖）会丢弃那些提及了其他用户或角色但未提及机器人的消息（不包括 @everyone/@here）。
- `maxLinesPerMessage`（默认 17）会拆分过高的消息，即使其未超过 2000 字符。
- `channels.discord.threadBindings` 控制 Discord 的线程绑定路由：
  - `enabled`：线程绑定会话功能的 Discord 覆盖（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 以及绑定投递/路由）
  - `idleHours`：按小时计算的 Discord 非活动自动取消聚焦覆盖（`0` 表示禁用）
  - `maxAgeHours`：按小时计算的 Discord 硬性最大存活期覆盖（`0` 表示禁用）
  - `spawnSubagentSessions`：为 `sessions_spawn({ thread: true })` 自动创建/绑定线程的选择性开关
- 顶层 `bindings[]` 中 `type: "acp"` 的条目可为频道和线程配置持久 ACP 绑定（在 `match.peer.id` 中使用频道/线程 ID）。字段语义与 [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings) 共享。
- `channels.discord.ui.components.accentColor` 设置 Discord components v2 容器的强调色。
- `channels.discord.voice` 启用 Discord 语音频道对话，以及可选的自动加入和 TTS 覆盖。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` 的 DAVE 选项（默认分别为 `true` 和 `24`）。
- OpenClaw 还会在重复解密失败后通过离开/重新加入语音会话来尝试恢复语音接收。
- `channels.discord.streaming` 是规范的流模式键。旧版 `streamMode` 和布尔型 `streaming` 值会自动迁移。
- `channels.discord.autoPresence` 会将运行时可用性映射为机器人在线状态（healthy => online，degraded => idle，exhausted => dnd），并允许可选的状态文本覆盖。
- `channels.discord.dangerouslyAllowNameMatching` 会重新启用可变名称/tag 匹配（破窗兼容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec 审批投递与审批人授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在自动模式下，当能从 `approvers` 或 `commands.ownerAllowFrom` 解析出审批人时，会激活 exec 审批。
  - `approvers`：允许批准 exec 请求的 Discord 用户 ID。省略时回退到 `commands.ownerAllowFrom`。
  - `agentFilter`：可选的智能体 ID 允许列表。省略则转发所有智能体的审批。
  - `sessionFilter`：可选的会话键模式（子串或正则）。
  - `target`：审批提示发送位置。`"dm"`（默认）发送到审批人的私信，`"channel"` 发送到原始频道，`"both"` 两处都发送。当目标包含 `"channel"` 时，按钮仅对已解析出的审批人可用。
  - `cleanupAfterResolve`：为 `true` 时，在批准、拒绝或超时后删除审批私信。

**反应通知模式：** `off`（无）、`own`（机器人的消息，默认）、`all`（所有消息）、`allowlist`（来自 `guilds.<id>.users`，作用于所有消息）。

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

- 服务账号 JSON：支持内联（`serviceAccount`）或基于文件（`serviceAccountFile`）。
- 也支持服务账号 SecretRef（`serviceAccountRef`）。
- 环境变量回退：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 使用 `spaces/<spaceId>` 或 `users/<userId>` 作为投递目标。
- `channels.googlechat.dangerouslyAllowNameMatching` 会重新启用可变邮箱主体匹配（破窗兼容模式）。

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
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
          systemPrompt: "只给出简短回答。",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
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
      streaming: "partial", // off | partial | block | progress（预览模式）
      nativeStreaming: true, // 当 streaming=partial 时使用 Slack 原生流式 API
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

- **Socket mode** 需要同时提供 `botToken` 和 `appToken`（默认账号的环境变量回退为 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** 需要 `botToken` 加 `signingSecret`（可在根级或按账号设置）。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 支持明文字符串或 SecretRef 对象。
- Slack 账号快照会暴露按凭证划分的来源/状态字段，如 `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式下的 `signingSecretStatus`。`configured_unavailable` 表示该账号通过 SecretRef 配置，但当前命令/运行时路径无法解析密钥值。
- `configWrites: false` 会阻止由 Slack 发起的配置写入。
- 可选的 `channels.slack.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。
- `channels.slack.streaming` 是规范的流模式键。旧版 `streamMode` 和布尔型 `streaming` 值会自动迁移。
- 使用 `user:<id>`（私信）或 `channel:<id>` 作为投递目标。

**反应通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程会话隔离：** `thread.historyScope` 可设为按线程（默认）或跨频道共享。`thread.inheritParent` 会将父频道转录复制到新线程中。

- `typingReaction` 会在回复运行期间为入站 Slack 消息添加一个临时反应，并在完成后移除。使用 Slack emoji 简码，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec 审批投递与审批人授权。其 schema 与 Discord 相同：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 用户 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。

| 操作组       | 默认值  | 说明                  |
| ------------ | ------- | --------------------- |
| reactions    | 启用    | 添加反应并列出反应    |
| messages     | 启用    | 读取/发送/编辑/删除   |
| pins         | 启用    | 固定/取消固定/列出    |
| memberInfo   | 启用    | 成员信息              |
| emojiList    | 启用    | 自定义 emoji 列表     |

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
        native: true, // 选择性启用
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 反向代理/公共部署时可选的显式 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

聊天模式：`oncall`（在 @ 提及时响应，默认）、`onmessage`（每条消息都响应）、`onchar`（响应以触发前缀开头的消息）。

当启用 Mattermost 原生命令时：

- `commands.callbackPath` 必须是路径（例如 `/api/channels/mattermost/command`），不能是完整 URL。
- `commands.callbackUrl` 必须解析到 OpenClaw Gateway 网关端点，并且 Mattermost 服务器能够访问。
- 原生 slash 回调使用 Mattermost 在 slash 命令注册期间返回的每命令 token 进行认证。如果注册失败或没有命令被激活，OpenClaw 会拒绝回调，并返回 `Unauthorized: invalid command token.`。
- 对于私有/tailnet/内部回调主机，Mattermost 可能要求 `ServiceSettings.AllowedUntrustedInternalConnections` 包含回调主机/域名。
  使用主机/域名值，而不是完整 URL。
- `channels.mattermost.configWrites`：允许或拒绝由 Mattermost 发起的配置写入。
- `channels.mattermost.requireMention`：在频道中回复前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：按频道的提及门控覆盖（默认使用 `"*"`）。
- 可选的 `channels.mattermost.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 可选账号绑定
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

**反应通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

- `channels.signal.account`：将渠道启动固定到特定 Signal 账号身份。
- `channels.signal.configWrites`：允许或拒绝由 Signal 发起的配置写入。
- 可选的 `channels.signal.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。

### BlueBubbles

BlueBubbles 是推荐的 iMessage 路径（插件支持，在 `channels.bluebubbles` 下配置）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl、password、webhookPath、群组控制和高级操作：
      // 参见 /channels/bluebubbles
    },
  },
}
```

- 此处涵盖的核心键路径：`channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 可选的 `channels.bluebubbles.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。
- 顶层 `bindings[]` 中 `type: "acp"` 的条目可以将 BlueBubbles 会话绑定到持久 ACP 会话。在 `match.peer.id` 中使用 BlueBubbles handle 或目标字符串（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义： [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings)。
- 完整的 BlueBubbles 渠道配置请参见 [BlueBubbles](/zh-CN/channels/bluebubbles)。

### iMessage

OpenClaw 会启动 `imsg rpc`（通过 stdio 的 JSON-RPC）。无需守护进程或端口。

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

- 可选的 `channels.imessage.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。

- 需要对 Messages 数据库授予“完全磁盘访问”权限。
- 优先使用 `chat_id:<id>` 目标。可用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH 包装器；设置 `remoteHost`（`host` 或 `user@host`）以便使用 SCP 获取附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 会限制入站附件路径（默认：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用严格主机密钥检查，因此请确保中继主机密钥已存在于 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允许或拒绝由 iMessage 发起的配置写入。
- 顶层 `bindings[]` 中 `type: "acp"` 的条目可以将 iMessage 会话绑定到持久 ACP 会话。在 `match.peer.id` 中使用规范化后的 handle 或显式聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义： [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH 包装器示例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由扩展提供支持，配置在 `channels.matrix` 下。

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

- Token 认证使用 `accessToken`；密码认证使用 `userId` + `password`。
- `channels.matrix.proxy` 通过显式 HTTP(S) 代理路由 Matrix HTTP 流量。命名账号可通过 `channels.matrix.accounts.<id>.proxy` 覆盖它。
- `channels.matrix.allowPrivateNetwork` 允许私有/内部 homeserver。`proxy` 和 `allowPrivateNetwork` 是相互独立的控制项。
- `channels.matrix.defaultAccount` 在多账号设置中选择首选账号。
- `channels.matrix.execApprovals`：Matrix 原生 exec 审批投递与审批人授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在自动模式下，当能从 `approvers` 或 `commands.ownerAllowFrom` 解析出审批人时，会激活 exec 审批。
  - `approvers`：允许批准 exec 请求的 Matrix 用户 ID（例如 `@owner:example.org`）。
  - `agentFilter`：可选的智能体 ID 允许列表。省略则转发所有智能体的审批。
  - `sessionFilter`：可选的会话键模式（子串或正则）。
  - `target`：审批提示发送位置。`"dm"`（默认）、`"channel"`（来源房间）或 `"both"`。
  - 每账号覆盖：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私信如何分组到会话中：`per-user`（默认）按路由目标共享，`per-room` 则隔离每个私信房间。
- Matrix 状态探测和实时目录查找与运行时流量使用相同的代理策略。
- 完整的 Matrix 配置、目标规则和设置示例请参见 [Matrix](/zh-CN/channels/matrix)。

### Microsoft Teams

Microsoft Teams 由扩展提供支持，配置在 `channels.msteams` 下。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、webhook、团队/频道策略：
      // 参见 /channels/msteams
    },
  },
}
```

- 此处涵盖的核心键路径：`channels.msteams`、`channels.msteams.configWrites`。
- 完整的 Teams 配置（凭证、webhook、私信/群组策略、按团队/频道的覆盖）请参见 [Microsoft Teams](/zh-CN/channels/msteams)。

### IRC

IRC 由扩展提供支持，配置在 `channels.irc` 下。

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
- 可选的 `channels.irc.defaultAccount` 会在其匹配已配置账号 ID 时覆盖默认账号选择。
- 完整的 IRC 渠道配置（主机/端口/TLS/频道/允许列表/提及门控）请参见 [IRC](/zh-CN/channels/irc)。

### 多账号（所有渠道）

为每个渠道运行多个账号（每个账号都有自己的 `accountId`）：

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "主 Bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "告警 Bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- 当省略 `accountId` 时会使用 `default`（CLI + 路由）。
- 环境变量 token 只适用于 **default** 账号。
- 基础渠道设置会应用到所有账号，除非被按账号覆盖。
- 使用 `bindings[].match.accountId` 将每个账号路由到不同智能体。
- 如果你通过 `openclaw channels add`（或渠道新手引导）添加了非默认账号，而此时仍是单账号顶层渠道配置，OpenClaw 会先将按账号范围的顶层单账号值提升到渠道账号映射中，以确保原账号继续工作。大多数渠道会移动到 `channels.<channel>.accounts.default`；Matrix 则可以保留现有的匹配命名/默认目标。
- 现有的纯渠道绑定（无 `accountId`）将继续匹配默认账号；按账号范围的绑定仍然是可选的。
- `openclaw doctor --fix` 也会修复混合形态：它会将按账号范围的顶层单账号值移动到该渠道选定的提升后账号中。大多数渠道使用 `accounts.default`；Matrix 可以保留现有的匹配命名/默认目标。

### 其他扩展渠道

许多扩展渠道都配置为 `channels.<id>`，并在各自专属的渠道页面中记录（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
参见完整渠道索引：[Channels](/zh-CN/channels)。

### 群聊提及门控

群组消息默认 **要求提及**（元数据提及或安全正则模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

**提及类型：**

- **元数据提及**：平台原生 @ 提及。在 WhatsApp 自聊模式下会被忽略。
- **文本模式**：位于 `agents.list[].groupChat.mentionPatterns` 中的安全正则模式。无效模式和不安全的嵌套重复会被忽略。
- 仅在可检测时（原生提及或至少存在一个模式）才会强制执行提及门控。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 设置全局默认值。渠道可通过 `channels.<channel>.historyLimit`（或按账号）覆盖。设为 `0` 可禁用。

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

将你自己的号码包含在 `allowFrom` 中即可启用自聊模式（忽略原生 @ 提及，只响应文本模式）：

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

### Commands（聊天命令处理）

```json5
{
  commands: {
    native: "auto", // 在支持的平台上注册原生命令
    text: true, // 解析聊天消息中的 /commands
    bash: false, // 允许 !（别名：/bash）
    bashForegroundMs: 2000,
    config: false, // 允许 /config
    debug: false, // 允许 /debug
    restart: false, // 允许 /restart + Gateway 网关重启工具
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="命令详情">

- 文本命令必须是带前导 `/` 的**独立**消息。
- `native: "auto"` 会为 Discord/Telegram 打开原生命令，Slack 则保持关闭。
- 可按渠道覆盖：`channels.discord.commands.native`（布尔值或 `"auto"`）。`false` 会清除之前已注册的命令。
- `channels.telegram.customCommands` 会添加额外的 Telegram 机器人菜单项。
- `bash: true` 启用用于主机 shell 的 `! <cmd>`。要求 `tools.elevated.enabled` 已启用，且发送者在 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 启用 `/config`（读写 `openclaw.json`）。对于 Gateway 网关 `chat.send` 客户端，持久化的 `/config set|unset` 写入还需要 `operator.admin`；只读的 `/config show` 仍对普通具备写权限的 operator 客户端可用。
- `channels.<provider>.configWrites` 控制每个渠道的配置变更（默认：true）。
- 对于多账号渠道，`channels.<provider>.accounts.<id>.configWrites` 也会控制针对该账号的写入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `allowFrom` 是按提供商划分的。设置后，它将成为**唯一**授权来源（渠道允许列表/配对及 `useAccessGroups` 都会被忽略）。
- `useAccessGroups: false` 允许命令在 `allowFrom` 未设置时绕过访问组策略。

</Accordion>

---

## 智能体默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示的 Runtime 行中。未设置时，OpenClaw 会从工作区向上遍历自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

为未设置 `agents.list[].skills` 的智能体提供可选的默认 Skills 允许列表。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 Skills
    ],
  },
}
```

- 省略 `agents.defaults.skills`，默认表示 Skills 不受限制。
- 省略 `agents.list[].skills` 表示继承默认值。
- 设置 `agents.list[].skills: []` 表示不启用任何 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用自动创建工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

单个工作区引导文件在截断前允许的最大字符数。默认值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件注入总字符数上限。默认值：`150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制在引导上下文被截断时，向智能体显示的警告文本。
默认值：`"once"`。

- `"off"`：绝不在系统提示中注入警告文本。
- `"once"`：每种唯一截断签名仅注入一次警告（推荐）。
- `"always"`：只要存在截断，每次运行都注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

在调用提供商前，转录/工具图像块中图像最长边的最大像素尺寸。
默认值：`1200`。

更低的值通常能减少视觉 token 用量和请求载荷大小，适合截图较多的运行。
更高的值能保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系统提示上下文使用的时区（不影响消息时间戳）。默认回退到主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统提示中的时间格式。默认值：`auto`（跟随操作系统偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // 全局默认 provider 参数
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 字符串形式只设置主模型。
  - 对象形式设置主模型以及有序故障转移模型。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `image` 工具路径作为其视觉模型配置使用。
  - 当所选/默认模型不能接受图像输入时，也会用作回退路由。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享图像生成能力以及未来任何生成图像的工具/插件表面使用。
  - 典型值：`google/gemini-3.1-flash-image-preview`（原生 Gemini 图像生成）、`fal/fal-ai/flux/dev`（fal）或 `openai/gpt-image-1`（OpenAI Images）。
  - 如果你直接选择某个 provider/model，也要配置相应的提供商认证/API key（例如 `google/*` 需要 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/*` 需要 `OPENAI_API_KEY`，`fal/*` 需要 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断基于认证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享视频生成能力和内置 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断基于认证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择某个 provider/model，也要配置相应的提供商认证/API key。
  - 内置的 Qwen 视频生成提供商目前最多支持 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用于模型路由。
  - 如果省略，PDF 工具会回退到 `imageModel`，再回退到已解析的会话/默认模型。
- `pdfMaxBytesMb`：当调用时未传 `maxBytesMb` 时，`pdf` 工具的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具在提取回退模式下考虑的默认最大页数。
- `verboseDefault`：智能体的默认 verbose 级别。取值：`"off"`、`"on"`、`"full"`。默认：`"off"`。
- `elevatedDefault`：智能体的默认 elevated-output 级别。取值：`"off"`、`"on"`、`"ask"`、`"full"`。默认：`"on"`。
- `model.primary`：格式为 `provider/model`（例如 `openai/gpt-5.4`）。如果省略 provider，OpenClaw 会先尝试别名，然后尝试与该确切模型 ID 唯一匹配的已配置 provider，最后才回退到已配置的默认 provider（已弃用的兼容行为，因此建议使用显式 `provider/model`）。如果该 provider 不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置 provider/model，而不是暴露一个过时的已删除 provider 默认值。
- `models`：已配置的模型目录以及 `/model` 的允许列表。每个条目都可以包含 `alias`（快捷方式）和 `params`（provider 特定参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`）。
- `params`：应用于所有模型的全局默认 provider 参数。设置在 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（按模型）覆盖，然后 `agents.list[].params`（匹配智能体 ID）按键覆盖。详见 [Prompt Caching](/zh-CN/reference/prompt-caching)。
- 会修改这些字段的配置写入器（例如 `/models set`、`/models set-image` 和回退添加/删除命令）会保存为规范对象形式，并尽可能保留现有回退列表。
- `maxConcurrent`：跨会话的智能体最大并行运行数（每个会话仍会串行化）。默认值：4。

**内置别名简写**（仅当模型位于 `agents.defaults.models` 中时适用）：

| 别名                | 模型                                   |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

你自己配置的别名始终优先于默认值。

Z.AI GLM-4.x 模型会自动启用 thinking 模式，除非你设置 `--thinking off` 或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 用于工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设为 `false` 可禁用。
Anthropic Claude 4.6 模型在未设置显式 thinking 级别时默认使用 `adaptive` thinking。

- 设置了 `sessionArg` 时支持会话。
- 当 `imageArg` 接受文件路径时支持图像透传。

### `agents.defaults.heartbeat`

周期性心跳运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 表示禁用
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // 默认：false；true 时仅保留工作区引导文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 时每次心跳都在全新会话中运行（无历史对话）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（默认）| block
        target: "none", // 默认：none | 可选：last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API-key 认证）或 `1h`（OAuth 认证）。设置为 `0m` 可禁用。
- `suppressToolErrorWarnings`：为 true 时，在心跳运行中抑制工具错误警告载荷。
- `directPolicy`：直接/私信投递策略。`allow`（默认）允许直接目标投递。`block` 会抑制直接目标投递并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，心跳运行使用轻量级引导上下文，并只保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次心跳都在没有历史对话的全新会话中运行。与 cron 的 `sessionTarget: "isolated"` 使用相同隔离模式。可将每次心跳的 token 成本从约 100K 降低到约 2-5K。
- 每智能体：设置 `agents.list[].heartbeat`。当任意智能体定义了 `heartbeat` 时，**只有这些智能体**会运行心跳。
- 心跳会运行完整的智能体轮次——间隔越短，消耗的 token 越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // 在 identifierPolicy=custom 时使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] 表示禁用重新注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 可选，仅用于 compaction 的模型覆盖
        notifyUser: true, // compaction 开始时发送简短通知给用户（默认：false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（对长历史进行分块摘要）。参见 [Compaction](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止前，单次 compaction 操作允许的最大秒数。默认值：`900`。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在 compaction 摘要期间预置内建的不透明标识符保留指导。
- `identifierInstructions`：可选的自定义标识符保留文本，在 `identifierPolicy=custom` 时使用。
- `postCompactionSections`：可选，在 compaction 后重新注入的 AGENTS.md H2/H3 章节名称。默认值为 `["Session Startup", "Red Lines"]`；设置为 `[]` 可禁用重新注入。未设置或显式设置为该默认对时，也会接受旧版 `Every Session`/`Safety` 标题作为兼容回退。
- `model`：仅用于 compaction 摘要的可选 `provider/model-id` 覆盖。当主会话应保持一个模型，而 compaction 摘要应使用另一个模型时使用；未设置时，compaction 使用会话主模型。
- `notifyUser`：为 `true` 时，在 compaction 开始时向用户发送简短通知（例如 “Compacting context...”）。默认禁用，以保持 compaction 静默。
- `memoryFlush`：在自动 compaction 前进行的静默智能体轮次，用于存储持久记忆。工作区为只读时会跳过。

### `agents.defaults.contextPruning`

在发送给 LLM 前，从内存上下文中裁剪**旧的工具结果**。**不会**修改磁盘上的会话历史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 时长（ms/s/m/h），默认单位：分钟
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 模式行为">

- `mode: "cache-ttl"` 启用裁剪流程。
- `ttl` 控制多长时间后才允许再次运行裁剪（以上次缓存触碰为起点）。
- 裁剪会先对过大的工具结果进行软裁剪，然后在需要时硬清除更旧的工具结果。

**软裁剪** 会保留开头和结尾，并在中间插入 `...`。

**硬清除** 会用占位符替换整个工具结果。

注意：

- 图像块永远不会被裁剪/清除。
- 比例基于字符数（近似），不是精确 token 数。
- 如果 assistant 消息少于 `keepLastAssistants` 条，则会跳过裁剪。

</Accordion>

行为细节参见 [Session Pruning](/zh-CN/concepts/session-pruning)。

### 分块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（使用 minMs/maxMs）
    },
  },
}
```

- 非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才会启用分块回复。
- 渠道覆盖：`channels.<channel>.blockStreamingCoalesce`（及按账号变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机停顿。`natural` = 800–2500ms。每智能体覆盖：`agents.list[].humanDelay`。

行为和分块细节参见 [Streaming](/zh-CN/concepts/streaming)。

### 输入状态指示器

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 默认值：私聊/被提及时使用 `instant`，未被提及的群聊使用 `message`。
- 每会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

参见 [Typing Indicators](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南参见 [Sandboxing](/zh-CN/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // 也支持 SecretRef / 内联内容：
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="沙箱详情">

**后端：**

- `docker`：本地 Docker 运行时（默认）
- `ssh`：通用 SSH 远程运行时
- `openshell`：OpenShell 运行时

当选择 `backend: "openshell"` 时，运行时特定设置会移动到
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：`user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于按 scope 划分工作区的远程绝对根目录
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：内联内容或 SecretRef，OpenClaw 会在运行时将其实体化为临时文件
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略开关

**SSH 认证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 由 SecretRef 支持的 `*Data` 值会在沙箱会话开始前从活动 secrets 运行时快照中解析

**SSH 后端行为：**

- 创建或重建后，会为远程工作区执行一次初始播种
- 然后保持远程 SSH 工作区为规范副本
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程变更同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：位于 `~/.openclaw/sandboxes` 下、按 scope 划分的沙箱工作区
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区以只读方式挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`：每会话一个容器 + 工作区
- `agent`：每智能体一个容器 + 工作区（默认）
- `shared`：共享容器和工作区（无跨会话隔离）

**OpenShell 插件配置：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 可选
          gatewayEndpoint: "https://lab.example", // 可选
          policy: "strict", // 可选 OpenShell 策略 ID
          providers: ["openai"], // 可选
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：执行前从本地播种到远端，执行后同步回本地；本地工作区保持为规范副本
- `remote`：创建沙箱时只向远端播种一次，然后保持远程工作区为规范副本

在 `remote` 模式下，在播种步骤之后，于 OpenClaw 外部对主机本地所做的编辑不会自动同步进沙箱。
传输使用 SSH 连接到 OpenShell 沙箱，但插件负责沙箱生命周期以及可选的 mirror 同步。

**`setupCommand`** 在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根文件系统和 root 用户。

**容器默认使用 `network: "none"`**——如果智能体需要出站访问，请设置为 `"bridge"`（或自定义 bridge 网络）。
默认会阻止 `"host"`。默认也会阻止 `"container:<id>"`，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（破窗模式）。

**入站附件** 会暂存到活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载额外的主机目录；全局和按智能体的 binds 会合并。

**沙箱隔离浏览器**（`sandbox.browser.enabled`）：在容器中运行 Chromium + CDP。noVNC URL 会注入到系统提示中。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，并且 OpenClaw 会发出短时有效 token URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认为 `openclaw-sandbox-browser`（专用 bridge 网络）。仅当你明确需要全局 bridge 连接时才设置为 `bridge`。
- `cdpSourceRange` 可将容器边界上的 CDP 入站限制为某个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅为沙箱浏览器容器挂载额外主机目录。设置后（包括 `[]`），它会替代浏览器容器的 `docker.binds`。
- 启动默认值定义在 `scripts/sandbox-browser-entrypoint.sh` 中，并针对容器主机进行了调优：
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`（默认启用）
  - `--disable-3d-apis`、`--disable-software-rasterizer` 和 `--disable-gpu`
    默认启用；如果工作流需要 WebGL/3D，可通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 关闭。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 可重新启用扩展，以便支持依赖扩展的工作流。
  - `--renderer-process-limit=2` 可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 修改；设置为 `0` 以使用 Chromium 的
    默认进程限制。
  - 在启用 `noSandbox` 时，还会加上 `--no-sandbox` 和 `--disable-setuid-sandbox`。
  - 默认值即容器镜像基线；如需修改容器默认值，请使用带自定义入口点的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 当前仅支持 Docker。

构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选浏览器镜像
```

### `agents.list`（按智能体覆盖）

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "主智能体",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 或 { primary, fallbacks }
        thinkingDefault: "high", // 按智能体覆盖 thinking 级别
        reasoningDefault: "on", // 按智能体覆盖 reasoning 可见性
        fastModeDefault: false, // 按智能体覆盖 fast mode
        params: { cacheRetention: "none" }, // 按键覆盖匹配 defaults.models 的参数
        skills: ["docs-search"], // 设置时会替换 agents.defaults.skills
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`：稳定的智能体 ID（必需）。
- `default`：如果设置了多个，则第一个生效（会记录警告）。若一个都未设置，则列表中的第一项为默认值。
- `model`：字符串形式仅覆盖 `primary`；对象形式 `{ primary, fallbacks }` 会同时覆盖二者（`[]` 可禁用全局回退）。仅覆盖 `primary` 的 cron 作业仍会继承默认回退，除非你设置 `fallbacks: []`。
- `params`：按智能体的流参数，合并到 `agents.defaults.models` 中所选模型条目之上。适合用于智能体特定的覆盖，如 `cacheRetention`、`temperature` 或 `maxTokens`，无需复制整个模型目录。
- `skills`：可选的按智能体 Skills 允许列表。若省略，智能体会在 `agents.defaults.skills` 已设置时继承该值；显式列表会替换默认值而不是合并，`[]` 表示没有 Skills。
- `thinkingDefault`：可选的按智能体默认 thinking 级别（`off | minimal | low | medium | high | xhigh | adaptive`）。当未设置按消息或会话覆盖时，会覆盖该智能体的 `agents.defaults.thinkingDefault`。
- `reasoningDefault`：可选的按智能体默认 reasoning 可见性（`on | off | stream`）。当未设置按消息或会话的 reasoning 覆盖时生效。
- `fastModeDefault`：可选的按智能体默认 fast mode（`true | false`）。当未设置按消息或会话的 fast-mode 覆盖时生效。
- `runtime`：可选的按智能体运行时描述符。当智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 配合 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：相对于工作区的路径、`http(s)` URL 或 `data:` URI。
- `identity` 会派生默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name`/`emoji`。
- `subagents.allowAgents`：用于 `sessions_spawn` 的智能体 ID 允许列表（`["*"]` = 任意；默认：仅同一智能体）。
- 沙箱继承保护：如果请求方会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些将以非沙箱方式运行的目标。
- `subagents.requireAgentId`：为 true 时，阻止未提供 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件；默认：false）。

---

## 多智能体路由

在一个 Gateway 网关中运行多个相互隔离的智能体。参见 [Multi-Agent](/zh-CN/concepts/multi-agent)。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 绑定匹配字段

- `type`（可选）：普通路由使用 `route`（缺失时默认为 route），持久 ACP 会话绑定使用 `acp`。
- `match.channel`（必需）
- `match.accountId`（可选；`*` = 任意账号；省略 = 默认账号）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；渠道特定）
- `acp`（可选；仅对 `type: "acp"` 生效）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（全渠道）
6. 默认智能体

在每一层内，第一条匹配的 `bindings` 会生效。

对于 `type: "acp"` 条目，OpenClaw 会按精确会话身份（`match.channel` + account + `match.peer.id`）解析，不使用上述 route 绑定分层顺序。

### 按智能体的访问配置

<Accordion title="完全访问（无沙箱）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="只读工具 + 工作区">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="无文件系统访问（仅消息）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

优先级细节参见 [Multi-Agent 沙箱隔离与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

---

## 会话

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // 高于此 token 数时跳过父线程 fork（0 表示禁用）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 时长或 false
      maxDiskBytes: "500mb", // 可选硬预算
      highWaterBytes: "400mb", // 可选清理目标
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 默认按小时计算的非活动自动取消聚焦（`0` 表示禁用）
      maxAgeHours: 0, // 默认按小时计算的硬性最大存活期（`0` 表示禁用）
    },
    mainKey: "main", // 旧字段（运行时始终使用 "main"）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="会话字段详情">

- **`scope`**：群聊上下文的基础会话分组策略。
  - `per-sender`（默认）：在某个渠道上下文中，每个发送者都有独立会话。
  - `global`：渠道上下文中的所有参与者共享一个会话（仅当确实需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：按跨渠道的发送者 ID 隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账号 + 渠道 + 发送者隔离（推荐用于多账号）。
- **`identityLinks`**：将规范 ID 映射到带 provider 前缀的 peer，用于跨渠道共享会话。
- **`reset`**：主重置策略。`daily` 会在本地时间 `atHour` 重置；`idle` 会在 `idleMinutes` 后重置。当两者都配置时，以先到期者为准。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 仍接受为 `direct` 的别名。
- **`parentForkMaxTokens`**：创建分叉线程会话时，允许的父会话 `totalTokens` 最大值（默认 `100000`）。
  - 如果父会话 `totalTokens` 高于该值，OpenClaw 会启动一个全新的线程会话，而不是继承父转录历史。
  - 设置为 `0` 可禁用该保护，并始终允许父级 fork。
- **`mainKey`**：旧字段。运行时现在始终对主私聊桶使用 `"main"`。
- **`agentToAgent.maxPingPongTurns`**：智能体之间来回交互时的最大回复轮数（整数，范围：`0`–`5`）。`0` 会禁用 ping-pong 链式交互。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 仍可作为别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一条 deny 生效。
- **`maintenance`**：会话存储清理与保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 会执行清理。
  - `pruneAfter`：过期条目的年龄阈值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。
  - `rotateBytes`：当 `sessions.json` 超过该大小时轮转（默认 `10mb`）。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留时长。默认与 `pruneAfter` 相同；设为 `false` 可禁用。
  - `maxDiskBytes`：可选的 sessions 目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会优先移除最旧的制品/会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认是 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（provider 可覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认按小时计算的非活动自动取消聚焦（`0` 表示禁用；provider 可覆盖）
  - `maxAgeHours`：默认按小时计算的硬性最大存活期（`0` 表示禁用；provider 可覆盖）

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 表示禁用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 回复前缀

按渠道/账号覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（越具体越优先）：账号 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 会推导为 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述               | 示例                        |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 简短模型名         | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符     | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称         | `anthropic`                 |
| `{thinkingLevel}` | 当前 thinking 级别 | `high`、`low`、`off`        |
| `{identity.name}` | 智能体身份名称     | （与 `"auto"` 相同）        |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认反应

- 默认使用活动智能体的 `identity.emoji`，否则为 `"👀"`。设为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账号 → 渠道 → `messages.ackReaction` → identity 回退。
- 作用范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord 和 Telegram 上回复后移除确认反应。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期状态反应。
  在 Slack 和 Discord 上，未设置时如果确认反应处于启用状态，则保持状态反应启用。
  在 Telegram 上，需要显式设置为 `true` 才会启用生命周期状态反应。

### 入站防抖

将来自同一发送者的快速文本消息批量合并为一次智能体轮次。媒体/附件会立即刷新。控制命令会绕过防抖。

### TTS（文本转语音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` 控制自动 TTS。`/tts off|always|inbound|tagged` 会按会话覆盖。
- `summaryModel` 会覆盖 `agents.defaults.model.primary` 用于自动摘要。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认是 `false`（选择性启用）。
- API key 会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- `openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序是配置，然后 `OPENAI_TTS_BASE_URL`，再到 `https://api.openai.com/v1`。
- 当 `openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为与 OpenAI 兼容的 TTS 服务器，并放宽模型/语音校验。

---

## Talk

Talk 模式（macOS/iOS/Android）的默认值。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- 当配置了多个 Talk 提供商时，`talk.provider` 必须匹配 `talk.providers` 中的一个键。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，会自动迁移到 `talk.providers.<provider>`。
- 语音 ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 支持明文字符串或 SecretRef 对象。
- 仅当未配置 Talk API key 时，才会使用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 允许 Talk 指令使用友好名称。
- `silenceTimeoutMs` 控制 Talk 模式在用户静音后等待多久才发送转录。未设置时保持平台默认暂停窗口（macOS 和 Android 为 `700 ms`，iOS 为 `900 ms`）。

---

## 工具

### 工具配置文件

`tools.profile` 会在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

本地新手引导会在未设置时将新的本地配置默认设为 `tools.profile: "coding"`（现有的显式配置文件会被保留）。

| 配置文件    | 包含内容                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                          |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                    |
| `full`      | 不限制（与未设置相同）                                                                                                       |

### 工具组

| 组                   | 工具                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`      | `exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名）                                                      |
| `group:fs`           | `read`、`write`、`edit`、`apply_patch`                                                                                  |
| `group:sessions`     | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory`       | `memory_search`、`memory_get`                                                                                           |
| `group:web`          | `web_search`、`x_search`、`web_fetch`                                                                                   |
| `group:ui`           | `browser`、`canvas`                                                                                                     |
| `group:automation`   | `cron`、`gateway`                                                                                                       |
| `group:messaging`    | `message`                                                                                                               |
| `group:nodes`        | `nodes`                                                                                                                 |
| `group:agents`       | `agents_list`                                                                                                           |
| `group:media`        | `image`、`image_generate`、`video_generate`、`tts`                                                                      |
| `group:openclaw`     | 所有内置工具（不包括提供商插件）                                                                                        |

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（deny 优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭也会应用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

进一步限制特定提供商或模型的工具。顺序：基础配置文件 → 提供商配置文件 → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

控制沙箱外的高权限 exec 访问：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 按智能体覆盖（`agents.list[].tools.elevated`）只能进一步收紧限制。
- `/elevated on|off|ask|full` 会按会话存储状态；内联指令仅应用于单条消息。
- 高权限 `exec` 会绕过沙箱隔离，并使用已配置的逃逸路径（默认 `gateway`，当 exec 目标是 `node` 时则使用 `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

工具循环安全检查**默认禁用**。设置 `enabled: true` 可启用检测。
设置可以定义在全局 `tools.loopDetection` 中，也可以在每智能体 `agents.list[].tools.loopDetection` 中覆盖。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`：为循环分析保留的最大工具调用历史。
- `warningThreshold`：重复无进展模式的警告阈值。
- `criticalThreshold`：阻止关键循环的更高重复阈值。
- `globalCircuitBreakerThreshold`：任意无进展运行的硬停止阈值。
- `detectors.genericRepeat`：对重复的同工具/同参数调用发出警告。
- `detectors.knownPollNoProgress`：对已知轮询工具（`process.poll`、`command_status` 等）的无进展情况发出警告/阻止。
- `detectors.pingPong`：对交替出现的无进展成对模式发出警告/阻止。
- 如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，验证将失败。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 或 BRAVE_API_KEY 环境变量
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 可选；省略则自动检测
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

配置入站媒体理解（图像/音频/视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="媒体模型条目字段">

**提供商条目**（`type: "provider"` 或省略）：

- `provider`：API provider ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
- `model`：模型 ID 覆盖
- `profile` / `preferredProfile`：`auth-profiles.json` 配置文件选择

**CLI 条目**（`type: "cli"`）：

- `command`：要运行的可执行文件
- `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等）

**公共字段：**

- `capabilities`：可选列表（`image`、`audio`、`video`）。默认：`openai`/`anthropic`/`minimax` → image，`google` → image+audio+video，`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：按条目的覆盖。
- 失败时会回退到下一条目。

提供商认证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

控制会话工具（`sessions_list`、`sessions_history`、`sessions_send`）可定位哪些会话。

默认值：`tree`（当前会话 + 由其派生的会话，例如 subagents）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注意：

- `self`：仅当前会话键。
- `tree`：当前会话 + 由当前会话派生的会话（subagents）。
- `agent`：属于当前智能体 ID 的任意会话（如果你在同一智能体 ID 下运行按发送者划分的会话，可能包含其他用户）。
- `all`：任意会话。跨智能体定位仍需要 `tools.agentToAgent`。
- 沙箱限制：当当前会话处于沙箱隔离中，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即便 `tools.sessions.visibility="all"`，可见性也会被强制为 `tree`。

### `tools.sessions_spawn`

控制 `sessions_spawn` 的内联附件支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 选择性启用：设为 true 以允许内联文件附件
        maxTotalBytes: 5242880, // 所有文件合计 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 每个文件 1 MB
        retainOnSessionKeep: false, // 当 cleanup="keep" 时保留附件
      },
    },
  },
}
```

注意：

- 仅 `runtime: "subagent"` 支持附件。ACP 运行时会拒绝它们。
- 文件会被实体化到子工作区的 `.openclaw/attachments/<uuid>/` 中，并包含 `.manifest.json`。
- 附件内容会自动从转录持久化中脱敏。
- Base64 输入会进行严格的字母表/填充校验，并在解码前进行大小保护。
- 文件权限为目录 `0700`、文件 `0600`。
- 清理由 `cleanup` 策略决定：`delete` 总会删除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留。

### `tools.experimental`

实验性内置工具开关。默认关闭，除非某条运行时特定的自动启用规则适用。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 启用实验性的 update_plan
    },
  },
}
```

注意：

- `planTool`：为非平凡的多步骤工作跟踪启用结构化 `update_plan` 工具。
- 默认值：对于非 OpenAI 提供商为 `false`。OpenAI 和 OpenAI Codex 运行会自动启用它。
- 启用后，系统提示也会添加使用指导，使模型仅在实质性工作中使用它，并始终保持最多一个步骤为 `in_progress`。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：派生子智能体的默认模型。省略时，子智能体会继承调用者模型。
- `allowAgents`：当请求方智能体未设置自己的 `subagents.allowAgents` 时，供 `sessions_spawn` 使用的默认目标智能体 ID 允许列表（`["*"]` = 任意；默认：仅同一智能体）。
- `runTimeoutSeconds`：当工具调用省略 `runTimeoutSeconds` 时，`sessions_spawn` 使用的默认超时（秒）。`0` 表示无超时。
- 每子智能体工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和 base URL

OpenClaw 使用内置模型目录。通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

```json5
{
  models: {
    mode: "merge", // merge（默认）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- 对于自定义认证需求，使用 `authHeader: true` + `headers`。
- 使用 `OPENCLAW_AGENT_DIR`（或旧版环境变量别名 `PI_CODING_AGENT_DIR`）覆盖智能体配置根目录。
- 对于匹配 provider ID 的合并优先级：
  - 非空的智能体 `models.json` `baseUrl` 值优先。
  - 非空的智能体 `apiKey` 值仅在该提供商当前配置/auth-profile 上下文中不由 SecretRef 管理时优先。
  - 由 SecretRef 管理的 provider `apiKey` 值会从源标记刷新（环境变量引用为 `ENV_VAR_NAME`，file/exec 引用为 `secretref-managed`），而不是持久化已解析的密钥。
  - 由 SecretRef 管理的 provider header 值会从源标记刷新（环境变量引用为 `secretref-env:ENV_VAR_NAME`，file/exec 引用为 `secretref-managed`）。
  - 为空或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
  - 匹配模型的 `contextWindow`/`maxTokens` 会取显式配置值与隐式目录值中更高者。
  - 匹配模型的 `contextTokens` 在显式存在运行时上限时会保留；用它可以在不改变原生模型元数据的情况下限制有效上下文。
  - 当你希望配置完全重写 `models.json` 时，使用 `models.mode: "replace"`。
  - 标记持久化以源为权威：标记来自活动源配置快照（解析前）而非已解析的运行时 secret 值。

### 提供商字段详情

- `models.mode`：provider 目录行为（`merge` 或 `replace`）。
- `models.providers`：按 provider ID 为键的自定义 provider 映射。
- `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。
- `models.providers.*.apiKey`：provider 凭证（优先使用 SecretRef/环境变量替换）。
- `models.providers.*.auth`：认证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，将 `options.num_ctx` 注入请求（默认：`true`）。
- `models.providers.*.authHeader`：当需要时，强制在 `Authorization` header 中传输凭证。
- `models.providers.*.baseUrl`：上游 API base URL。
- `models.providers.*.headers`：用于代理/租户路由的额外静态 header。
- `models.providers.*.request`：模型提供商 HTTP 请求的传输覆盖。
  - `request.headers`：额外 header（与 provider 默认值合并）。值支持 SecretRef。
  - `request.auth`：认证策略覆盖。模式：`"provider-default"`（使用 provider 内建认证）、`"authorization-bearer"`（配合 `token`）、`"header"`（配合 `headerName`、`value` 和可选 `prefix`）。
  - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（配合 `url`）。两种模式都接受可选的 `tls` 子对象。
  - `request.tls`：直连时的 TLS 覆盖。字段：`ca`、`cert`、`key`、`passphrase`（都支持 SecretRef）、`serverName`、`insecureSkipVerify`。
- `models.providers.*.models`：显式 provider 模型目录条目。
- `models.providers.*.models.*.contextWindow`：原生模型上下文窗口元数据。
- `models.providers.*.models.*.contextTokens`：可选运行时上下文上限。当你希望有效上下文预算小于模型原生 `contextWindow` 时使用。
- `models.providers.*.models.*.compat.supportsDeveloperRole`：可选兼容性提示。对于 `api: "openai-completions"` 且非空、非原生 `baseUrl`（host 不是 `api.openai.com`），OpenClaw 会在运行时强制将其设为 `false`。为空或省略 `baseUrl` 时保持默认 OpenAI 行为。
- `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根路径。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启/关闭隐式发现。
- `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选 provider-id 过滤器。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新的轮询间隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的回退上下文窗口。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的回退最大输出 token。

### 提供商示例

<Accordion title="Cerebras（GLM 4.6 / 4.7）">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7（Cerebras）" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6（Cerebras）" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7（Cerebras）" },
          { id: "zai-glm-4.6", name: "GLM 4.6（Cerebras）" },
        ],
      },
    },
  },
}
```

对 Cerebras 使用 `cerebras/zai-glm-4.7`；对 Z.AI 直连使用 `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。对 Zen 目录使用 `opencode/...` 引用，对 Go 目录使用 `opencode-go/...` 引用。快捷方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

设置 `ZAI_API_KEY`。`z.ai/*` 和 `z-ai/*` 都是可接受的别名。快捷方式：`openclaw onboard --auth-choice zai-api-key`。

- 通用端点：`https://api.z.ai/api/paas/v4`
- Coding 端点（默认）：`https://api.z.ai/api/coding/paas/v4`
- 对于通用端点，定义带 base URL 覆盖的自定义 provider。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

中国端点：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

原生 Moonshot 端点会在共享的
`openai-completions` 传输上声明流式使用兼容性，OpenClaw 现在根据端点
能力而不是仅根据内置 provider ID 来决定这一点。

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

兼容 Anthropic 的内置 provider。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（兼容 Anthropic）">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL 不应包含 `/v1`（Anthropic 客户端会自行追加）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直连）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

设置 `MINIMAX_API_KEY`。快捷方式：
`openclaw onboard --auth-choice minimax-global-api` 或
`openclaw onboard --auth-choice minimax-cn-api`。
模型目录现在默认仅使用 M2.7。
在兼容 Anthropic 的流式路径上，除非你显式设置 `thinking`，否则 OpenClaw 默认会禁用 MiniMax thinking。
`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 重写为
`MiniMax-M2.7-highspeed`。

</Accordion>

<Accordion title="本地模型（LM Studio）">

参见 [Local Models](/zh-CN/gateway/local-models)。简而言之：在性能充足的硬件上通过 LM Studio Responses API 运行大型本地模型；保留已合并的托管模型用于回退。

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅针对内置 Skills 的可选允许列表（托管/工作区 Skills 不受影响）。
- `load.extraDirs`：额外的共享 Skills 根目录（优先级最低）。
- `install.preferBrew`：为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装器，再回退到其他安装器类型。
- `install.nodeManager`：针对 `metadata.openclaw.install`
  规格的 Node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使某个 Skill 已内置/已安装，也会将其禁用。
- `entries.<skillKey>.apiKey`：为声明了主环境变量的 Skills 提供的便捷 API key 字段（明文字符串或 SecretRef 对象）。

---

## 插件

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 从 `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions` 以及 `plugins.load.paths` 加载。
- 设备发现支持原生 OpenClaw 插件，以及兼容的 Codex bundle 和 Claude bundle，包括无 manifest 的 Claude 默认布局 bundle。
- **配置变更需要重启 Gateway 网关。**
- `allow`：可选允许列表（仅加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便捷字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件作用域环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会修改提示的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件 hooks 和受支持的 bundle 提供的 hook 目录。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任该插件可为后台子智能体运行请求按次 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任的子智能体覆盖可选规范 `provider/model` 目标允许列表。仅在你有意允许任意模型时才使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（如果可用，则由原生 OpenClaw 插件 schema 验证）。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch provider 设置。
  - `apiKey`：Firecrawl API key（支持 SecretRef）。会回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API base URL（默认：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅提取页面主体内容（默认：`true`）。
  - `maxAgeMs`：最大缓存年龄，单位毫秒（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时，单位秒（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok Web 搜索）设置。
  - `enabled`：启用 X Search provider。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：记忆 dreaming（实验性）设置。模式和阈值参见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `mode`：dreaming 频率预设（`"off"`、`"core"`、`"rem"`、`"deep"`）。默认：`"off"`。
  - `cron`：可选的 dreaming 调度 cron 表达式覆盖。
  - `timezone`：调度评估使用的时区（回退到 `agents.defaults.userTimezone`）。
  - `limit`：每个周期最多提升的候选数。
  - `minScore`：提升所需的最小加权分数阈值。
  - `minRecallCount`：最小回忆计数阈值。
  - `minUniqueQueries`：最小不同查询数阈值。
  - `recencyHalfLifeDays`：近期性分数衰减到一半所需的天数。默认：`14`。
  - `maxAgeDays`：可选的最大日记年龄（按天），超出则不允许提升。
  - `verboseLogging`：将详细的每次 dreaming 日志输出到常规 Gateway 网关日志流。
- 已启用的 Claude bundle 插件也可提供来自 `settings.json` 的嵌入式 Pi 默认值；OpenClaw 会将其作为净化后的智能体设置应用，而不是原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活动记忆插件 ID，或设置为 `"none"` 以禁用记忆插件。
- `plugins.slots.contextEngine`：选择活动上下文引擎插件 ID；默认是 `"legacy"`，除非你安装并选用了其他引擎。
- `plugins.installs`：供 `openclaw plugins update` 使用的 CLI 管理安装元数据。
  - 包括 `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - 将 `plugins.installs.*` 视为托管状态；优先使用 CLI 命令，而不是手动编辑。

参见 [Plugins](/zh-CN/tools/plugin)。

---

## 浏览器

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // 默认可信网络模式
      // allowPrivateNetwork: true, // 旧别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` 会禁用 `act:evaluate` 和 `wait --fn`。
- 当未设置时，`ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认是 `true`（可信网络模型）。
- 如需严格的仅公共网络浏览导航，请设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: false`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/设备发现检查期间也会受到同样的私有网络阻止策略约束。
- `ssrfPolicy.allowPrivateNetwork` 仍支持作为旧版别名。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 添加显式例外。
- 远程配置文件仅支持附加（禁用启动/停止/重置）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时使用 HTTP(S)；当你的提供商直接给出 DevTools WebSocket URL 时使用 WS(S)。
- `existing-session` 配置文件仅适用于主机，并使用 Chrome MCP 而不是 CDP。
- `existing-session` 配置文件可以设置 `userDataDir`，以定位特定的基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：使用 snapshot/ref 驱动的操作而非 CSS 选择器定位、单文件上传 hook、不支持对话框超时覆盖、不支持 `wait --load networkidle`，以及不支持 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅在远程 CDP 场景下才显式设置 `cdpUrl`。
- 自动检测顺序：如果默认浏览器是基于 Chromium 则优先它 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 控制服务：仅 loopback（端口由 `gateway.port` 派生，默认 `18791`）。
- `extraArgs` 会将额外启动标志附加到本地 Chromium 启动中（例如 `--disable-gpu`、窗口大小或调试标志）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji、短文本、图像 URL 或 data URI
    },
  },
}
```

- `seamColor`：原生应用 UI 边框的强调色（Talk Mode 气泡着色等）。
- `assistant`：Control UI 身份覆盖。默认回退到活动智能体身份。

---

## Gateway 网关

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // 或 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // 用于 mode=trusted-proxy；参见 /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // 非 loopback Control UI 必需
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危险的基于 Host header 的 origin 回退模式
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 可选。默认 false。
    allowRealIpFallback: false,
    tools: {
      // 对 /tools/invoke HTTP 的额外 deny
      deny: ["browser"],
      // 从默认 HTTP deny 列表中移除工具
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 网关字段详情">

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接远程 Gateway 网关）。除非为 `local`，否则 Gateway 网关拒绝启动。
- `port`：WS + HTTP 复用的单端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：在 `gateway.bind` 中使用 bind mode 值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用 host 别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` bind 会在容器内监听 `127.0.0.1`。使用 Docker bridge 网络（`-p 18789:18789`）时，流量会到达 `eth0`，因此 Gateway 网关不可达。请使用 `--network host`，或将 `bind` 设为 `"lan"`（或设为 `"custom"` 并配合 `customBindHost: "0.0.0.0"`），以便在所有接口上监听。
- **认证**：默认需要。非 loopback 绑定要求 Gateway 网关认证。实际意味着需要共享 token/password，或使用带 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。新手引导向导默认会生成 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请显式设置 `gateway.auth.mode` 为 `token` 或 `password`。如果两者都已配置且 mode 未设置，启动以及服务安装/修复流程都会失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅用于受信任的本地 local loopback 设置；新手引导提示中不会提供该选项。
- `gateway.auth.mode: "trusted-proxy"`：将认证委托给身份感知型反向代理，并信任来自 `gateway.trustedProxies` 的身份 header（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。此模式要求 **非 loopback** 代理源；同主机的 loopback 反向代理不满足 trusted-proxy 认证条件。
- `gateway.auth.allowTailscale`：当为 `true` 时，Tailscale Serve 身份 header 可用于满足 Control UI/WebSocket 认证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale header 认证；它们仍遵循 Gateway 网关的常规 HTTP 认证模式。此无 token 流程假定 Gateway 网关主机是受信任的。当 `tailscale.mode = "serve"` 时默认值为 `true`。
- `gateway.auth.rateLimit`：可选的认证失败限流器。按客户端 IP 和认证范围应用（共享密钥和设备 token 会独立跟踪）。被拦截的尝试会返回 `429` + `Retry-After`。
  - 在异步的 Tailscale Serve Control UI 路径上，同一 `{scope, clientIp}` 的失败尝试会在失败写入之前串行化。因此来自同一客户端的并发错误尝试，可能会在第二个请求时触发限流，而不是两个都作为普通不匹配并发通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认是 `true`；若你有意让 localhost 流量也受限流约束（测试环境或严格代理部署），请设为 `false`。
- 源自浏览器的 WS 认证尝试始终会在禁用 loopback 豁免的条件下被限流（作为针对基于浏览器的 localhost 暴力破解的纵深防御）。
- 在 loopback 上，这些浏览器来源的锁定会按规范化后的 `Origin`
  值独立隔离，因此来自某个 localhost origin 的重复失败不会自动锁死不同的 origin。
- `tailscale.mode`：`serve`（仅 tailnet，loopback 绑定）或 `funnel`（公开，需要认证）。
- `controlUi.allowedOrigins`：用于 Gateway 网关 WebSocket 连接的显式浏览器 origin 允许列表。当期望浏览器客户端来自非 loopback origin 时必需。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为那些有意依赖 Host header origin 策略的部署启用基于 Host header 的 origin 回退。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端侧的破窗覆盖，允许对受信任私有网络 IP 使用明文 `ws://`；默认仍只允许 loopback 使用明文。
- `gateway.remote.token` / `.password` 是远程客户端凭证字段。它们本身不会配置 Gateway 网关认证。
- `gateway.push.apns.relay.baseUrl`：官方/TestFlight iOS 版本在将基于 relay 的注册发布到 Gateway 网关后，供其使用的外部 APNs relay 基础 HTTPS URL。此 URL 必须与编译进 iOS 构建的 relay URL 一致。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到 relay 的发送超时（毫秒）。默认值：`10000`。
- 基于 relay 的注册会委托给特定的 Gateway 网关身份。配对后的 iOS 应用会获取 `gateway.identity.get`，在 relay 注册中包含该身份，并向 Gateway 网关转发一个以注册为作用域的发送授权。其他 Gateway 网关无法复用该已存储注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：用于覆盖上述 relay 配置的临时环境变量。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅用于开发环境，对 loopback HTTP relay URL 的逃生开关。生产 relay URL 应保持使用 HTTPS。
- `gateway.channelHealthCheckMinutes`：渠道健康监视器间隔（分钟）。设为 `0` 可全局禁用健康监视重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧 socket 阈值（分钟）。应保持大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：滚动一小时内，每个渠道/账号的健康监视器最大重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保留全局监视器启用的前提下，按渠道选择退出健康监视器重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的按账号覆盖。设置时，它优先于渠道级覆盖。
- 仅当 `gateway.auth.*` 未设置时，本地 Gateway 网关调用路径才可将 `gateway.remote.*` 用作回退。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但无法解析，则会以默认拒绝方式失败（不会使用远程回退来掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端 header 的反向代理 IP。只列出你控制的代理。loopback 条目对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**让 loopback 请求具备 `gateway.auth.mode: "trusted-proxy"` 资格。
- `allowRealIpFallback`：为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认 `false`