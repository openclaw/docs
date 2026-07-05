---
read_when:
    - 配置渠道插件（凭证、访问控制、多账户）
    - 按渠道配置键的故障排查
    - 审计私信策略、群组策略或提及门控
summary: 频道配置：访问控制、配对，以及跨 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等渠道的每渠道密钥
title: 配置 — 渠道
x-i18n:
    generated_at: "2026-07-05T11:17:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26a8920ee55a2e9985425dad6b982a62b61877bde5bb8fcf6ce5e172bf7fb36e
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 下的按渠道配置键：私信和群组访问、多账号设置、提及门控，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他渠道插件的按渠道键。

对于智能体、工具、Gateway 网关运行时和其他顶层键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 渠道

当配置段存在时，每个渠道都会自动启动（除非 `enabled: false`）。Telegram 和 iMessage 随核心 `openclaw` 包一起发布。其他官方渠道（Discord、Slack、WhatsApp、Matrix、Microsoft Teams、IRC、Google Chat、Signal、Mattermost 等）作为独立插件安装，使用 `openclaw plugins install <spec>`；完整列表和安装 spec 请参阅[渠道](/zh-CN/channels)。

### 私信和群组访问

所有渠道都支持私信策略和群组策略：

| 私信策略            | 行为                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（默认） | 未知发送者会收到一次性配对码；所有者必须批准 |
| `allowlist`         | 仅允许 `allowFrom`（或已配对允许存储）中的发送者             |
| `open`              | 允许所有入站私信（需要 `allowFrom: ["*"]`）             |
| `disabled`          | 忽略所有入站私信                                          |

| 群组策略          | 行为                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（默认） | 仅允许匹配已配置允许列表的群组          |
| `open`                | 绕过群组允许列表（提及门控仍然适用） |
| `disabled`            | 阻止所有群组/房间消息                          |

<Note>
`channels.defaults.groupPolicy` 会在提供商的 `groupPolicy` 未设置时设为默认值。
配对码会在 1 小时后过期。待处理的配对请求上限为**每个账号 3 个**（按渠道和账号 id 限定范围）。
如果提供商块完全缺失（不存在 `channels.<provider>`），运行时群组策略会回退到 `allowlist`（故障关闭），并在启动时发出警告。
</Note>

### 渠道模型覆盖

使用 `channels.modelByChannel` 将特定渠道 ID 或私信对端固定到某个模型。值接受 `provider/model` 或已配置的模型别名。仅当会话还没有活动模型覆盖时（例如通过 `/model` 设置的覆盖），渠道映射才会应用。

对于群组/线程对话，键是渠道特定的群组 ID、主题 ID 或渠道名称。对于直接消息（私信）对话，键是从渠道发送者身份派生的对端标识符（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From` 或 `SenderId`）。确切键形式取决于渠道：

| 渠道  | 私信键形式         | 示例                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | 原始用户 ID         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix 用户 ID      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 原始用户 ID         | `123456789`                                  |
| WhatsApp | 电话号码或 JID | `15551234567`                                |

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

私信专用键只在直接消息对话中匹配；它们不会影响群组/线程路由。

### 渠道默认值和 Heartbeat

使用 `channels.defaults` 在各提供商之间共享群组策略和 Heartbeat 行为：

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
- `channels.defaults.heartbeat.showOk`：在 Heartbeat 输出中包含健康的渠道状态（默认 `false`）。
- `channels.defaults.heartbeat.showAlerts`：在 Heartbeat 输出中包含降级/错误状态（默认 `true`）。
- `channels.defaults.heartbeat.useIndicator`：渲染紧凑指示器样式的 Heartbeat 输出（默认 `true`）。

### WhatsApp

WhatsApp 通过 Gateway 网关的 Web 渠道（Baileys Web）运行。当存在已关联会话时，它会自动启动。

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

- `web.whatsapp.keepAliveIntervalMs`（默认 `25000`）、`connectTimeoutMs`（默认 `60000`）和 `defaultQueryTimeoutMs`（默认 `60000`）用于调优 Baileys socket。
- `web.reconnect` 默认值：`initialMs: 2000`、`maxMs: 30000`、`factor: 1.8`、`jitter: 0.25`、`maxAttempts: 12`。`maxAttempts: 0` 会永久重试，而不是放弃。
- 顶层 `bindings[]` 条目通过 `type: "acp"` 为 WhatsApp 私信和群组配置持久 ACP 绑定。在 `match.peer.id` 中使用 E.164 直接号码或 WhatsApp 群组 JID。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#persistent-channel-bindings)中共享。

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

- 出站命令默认使用账号 `default`（如果存在）；否则使用第一个已配置的账号 id（排序后）。
- 可选的 `channels.whatsapp.defaultAccount` 会在匹配已配置账号 id 时覆盖该回退默认账号选择。
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（仅限普通文件；拒绝符号链接），默认账号可回退使用 `TELEGRAM_BOT_TOKEN`。
- `apiRoot` 仅是 Telegram Bot API 根地址。使用 `https://api.telegram.org` 或你的自托管/代理根地址，而不是 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 会移除意外尾随的 `/bot<TOKEN>` 后缀。
- 对于以 `--local` 模式运行的自托管 Bot API 服务器，`trustedLocalFileRoots` 会列出 OpenClaw 可以读取的主机路径。在 OpenClaw 主机上挂载服务器数据卷，并配置其数据根或按 token 目录；`/var/lib/telegram-bot-api` 下的容器路径会映射到这些根。其他绝对路径仍会被拒绝。
- 可选的 `channels.telegram.defaultAccount` 会在匹配已配置账号 id 时覆盖默认账号选择。
- 在多账号设置（2 个以上账号 id）中，设置显式默认值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免回退路由；缺失或无效时，`openclaw doctor` 会警告。
- `configWrites: false` 会阻止 Telegram 发起的配置写入（超群组 ID 迁移、`/config set|unset`）。
- 顶层 `bindings[]` 条目通过 `type: "acp"` 为论坛主题配置持久 ACP 绑定（在 `match.peer.id` 中使用规范的 `chatId:topic:topicId`）。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#persistent-channel-bindings)中共享。
- Telegram 流预览使用 `sendMessage` + `editMessageText`（适用于直接聊天和群聊）。
- `network.dnsResultOrder` 默认为 `"ipv4first"`，以避免常见 IPv6 fetch 失败。
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

- Token：`channels.discord.token`，默认账号回退使用 `DISCORD_BOT_TOKEN`。
- 提供显式 Discord `token` 的直接出站调用会使用该 token 执行调用；账号重试/策略设置仍来自活跃运行时快照中选中的账号。
- 可选的 `channels.discord.defaultAccount` 在匹配已配置账号 ID 时会覆盖默认账号选择。
- 使用 `user:<id>`（私信）或 `channel:<id>`（公会频道）作为投递目标；裸数字 ID 会被拒绝。
- 公会 slug 使用小写，并将空格替换为 `-`；频道键使用 slug 化名称（无 `#`）。优先使用公会 ID。
- 默认忽略 Bot 作者的消息。`allowBots: true` 会启用它们；使用 `allowBots: "mentions"` 可仅接受提及该 Bot 的 Bot 消息（仍会过滤自身消息）。
- 支持 Bot 作者入站消息的渠道可使用共享的 [bot 循环保护](/zh-CN/channels/bot-loop-protection)。设置 `channels.defaults.botLoopProtection` 作为基线配对预算，然后仅在某个表面需要不同限制时覆盖渠道或账号。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及频道覆盖项）会丢弃提及其他用户或角色但未提及该 Bot 的消息（不包括 @everyone/@here）。
- `channels.discord.mentionAliases` 会在发送前将稳定的出站 `@handle` 文本映射到 Discord 用户 ID，因此即使瞬时目录缓存为空，也可以确定性地提及已知队友。每账号覆盖项位于 `channels.discord.accounts.<accountId>.mentionAliases` 下。
- `maxLinesPerMessage`（默认 `17`）即使在 2000 字符以内也会拆分过高的消息。
- `channels.discord.suppressEmbeds` 默认值为 `true`，因此除非禁用，否则出站 URL 不会展开为 Discord 链接预览。显式 `embeds` 负载仍会正常发送；每条消息的工具调用可通过 `suppressEmbeds` 覆盖。
- `channels.discord.threadBindings` 控制 Discord 线程绑定路由：
  - `enabled`：线程绑定会话功能的 Discord 覆盖项（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及绑定投递/路由）
  - `idleHours`：非活跃自动取消聚焦的 Discord 覆盖项，单位为小时（`0` 禁用）
  - `maxAgeHours`：硬性最大年龄的 Discord 覆盖项，单位为小时（`0` 禁用）
  - `spawnSessions`：`sessions_spawn({ thread: true })` 和 ACP 线程生成自动创建/绑定线程的开关（默认：`true`）
  - `defaultSpawnContext`：线程绑定生成的原生子智能体上下文（默认为 `"fork"`）
- 顶层 `bindings[]` 条目如果带有 `type: "acp"`，会为渠道和线程配置持久 ACP 绑定（在 `match.peer.id` 中使用频道/线程 ID）。字段语义在 [ACP 智能体](/zh-CN/tools/acp-agents#persistent-channel-bindings) 中共享。
- `channels.discord.ui.components.accentColor` 设置 Discord 组件 v2 容器的强调色。
- `channels.discord.agentComponents.ttlMs` 控制已发送 Discord 组件回调保持注册的时长。默认 `1800000`（30 分钟），最大 `86400000`（24 小时）。每账号覆盖项位于 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 下。优先使用适合工作流的最短 TTL。
- `channels.discord.voice` 启用 Discord 语音频道对话，以及可选的自动加入 + LLM + TTS 覆盖项。纯文本 Discord 配置默认关闭语音；设置 `channels.discord.voice.enabled=true` 可选择启用。
- `channels.discord.voice.model` 可选地覆盖用于 Discord 语音频道响应的 LLM 模型。
- `channels.discord.voice.daveEncryption`（默认 `true`）和 `channels.discord.voice.decryptionFailureTolerance`（默认 `24`）会透传到 `@discordjs/voice` DAVE 选项。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试的初始 `@discordjs/voice` Ready 等待时间（默认 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制已断开的语音会话在 OpenClaw 销毁它之前，可用于进入重连信令的时长（默认 `15000`）。
- Discord 语音播放不会被其他用户的开始说话事件中断。为避免反馈循环，OpenClaw 在 TTS 播放期间会忽略新的语音捕获。
- OpenClaw 还会在重复解密失败后，通过离开/重新加入语音会话来尝试语音接收恢复。
- `channels.discord.streaming` 是规范的流模式键。Discord 默认使用 `streaming.mode: "progress"`，因此工具/工作进度会显示在一条已编辑的预览消息中；设置 `streaming.mode: "off"` 可将其禁用。旧版 `streamMode` 和布尔 `streaming` 值仍保留为运行时别名；运行 `openclaw doctor --fix` 可重写已持久化的配置。
- `channels.discord.autoPresence` 将运行时可用性映射到 Bot 在线状态（健康 => 在线，降级 => 空闲，耗尽 => 请勿打扰），并允许可选的状态文本覆盖。
- `channels.discord.dangerouslyAllowNameMatching` 会重新启用可变名称/标签匹配（紧急兼容模式）。
- `channels.discord.execApprovals`：Discord 原生 Exec 审批投递和审批者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在自动模式下，当可从 `approvers` 或 `commands.ownerAllowFrom` 解析出审批者时，Exec 审批会激活。
  - `approvers`：允许批准 Exec 请求的 Discord 用户 ID。省略时回退到 `commands.ownerAllowFrom`。
  - `agentFilter`：可选的 Agent ID 允许列表。省略时转发所有智能体的审批。
  - `sessionFilter`：可选的会话键模式（子字符串或正则表达式）。
  - `target`：发送审批提示的位置。`"dm"`（默认）发送到审批者私信，`"channel"` 发送到来源频道，`"both"` 同时发送到两者。当 target 包含 `"channel"` 时，按钮仅可由已解析的审批者使用。
  - `cleanupAfterResolve`：为 `true` 时，在批准、拒绝或超时后删除审批私信。

**表情回应通知模式：** `off`（无）、`own`（Bot 的消息，默认）、`all`（所有消息）、`allowlist`（来自所有消息上的 `guilds.<id>.users`）。

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
- 环境变量回退：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（仅默认账号）。
- 使用 `spaces/<spaceId>` 或 `users/<userId>` 作为投递目标。
- `channels.googlechat.dangerouslyAllowNameMatching` 会重新启用可变电子邮件主体匹配（紧急兼容模式）。

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

- **Socket 模式**需要同时配置 `botToken` 和 `appToken`（默认账户的环境变量回退为 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加 `signingSecret`（位于根级别或按账户配置）。
- `socketMode` 会将 Slack SDK Socket Mode 传输调优透传到公开的 Bolt receiver API。仅在调查 ping/pong 超时或陈旧 websocket 行为时使用它。`clientPingTimeout` 默认值为 `15000`；`serverPingTimeout` 和 `pingPongLoggingEnabled` 仅在配置后才会传递。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文
  字符串或 SecretRef 对象。
- Slack 账户快照会暴露按凭证划分的来源/状态字段，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式下的
  `signingSecretStatus`。`configured_unavailable` 表示账户已
  通过 SecretRef 配置，但当前命令/运行时路径无法
  解析密钥值。
- `configWrites: false` 会阻止由 Slack 发起的配置写入。
- 可选的 `channels.slack.defaultAccount` 会在匹配已配置账户 id 时覆盖默认账户选择。
- `channels.slack.streaming.mode` 是规范的 Slack 流模式键（默认 `"partial"`）。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生流式传输（默认 `true`）。旧版 `streamMode`、布尔值 `streaming`、`chunkMode`、`blockStreaming`、`blockStreamingCoalesce` 和 `nativeStreaming` 值仍保留为运行时别名；运行 `openclaw doctor --fix` 可将持久化配置重写为 `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`。
- `unfurlLinks` 和 `unfurlMedia` 会为 Bot 回复透传 Slack 的 `chat.postMessage` 链接和媒体展开布尔值。`unfurlLinks` 默认值为 `false`，因此除非启用，否则出站 Bot 链接不会内联展开；`unfurlMedia` 未配置时会省略。可在 `channels.slack.accounts.<accountId>` 设置任一值，以覆盖某个账户的顶层值。
- 使用 `user:<id>`（私信）或 `channel:<id>` 作为投递目标。

**表情回应通知模式：**`off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程会话隔离：**`thread.historyScope` 是按线程（默认）或跨频道共享。`thread.inheritParent` 会将父频道转录复制到新线程。`thread.initialHistoryLimit`（默认 `20`）限制新线程会话启动时获取的现有线程消息数量；`0` 会禁用线程历史获取。

- Slack 原生流式传输以及 Slack assistant 风格的 “is typing...” 线程状态都需要回复线程目标。顶层私信默认保持非线程，因此它们仍可通过 Slack 草稿发布并编辑预览来流式传输，而不是显示线程风格的原生流/状态预览。
- `typingReaction` 会在回复运行期间向传入的 Slack 消息添加临时表情回应，并在完成时移除。使用 Slack emoji shortcode，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生审批客户端投递和 exec 审批者授权。与 Discord 使用相同 schema：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 用户 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。当 Slack 插件审批者可解析时，插件审批可对 Slack 来源请求使用这个原生客户端路径；也可以通过 `approvals.plugin` 为 Slack 来源会话或 Slack 目标启用 Slack 原生插件审批投递。插件审批使用来自 `allowFrom` 的 Slack 插件审批者和默认路由，而不是 exec 审批者。

| 操作组 | 默认值 | 说明                  |
| ------------ | ------- | ---------------------- |
| 表情回应    | 已启用 | 表情回应 + 列出表情回应 |
| 消息     | 已启用 | 读取/发送/编辑/删除  |
| 置顶         | 已启用 | 置顶/取消置顶/列出         |
| 成员信息   | 已启用 | 成员信息            |
| emoji 列表    | 已启用 | 自定义 emoji 列表      |

### Mattermost

Mattermost 会作为单独插件安装，方式与 Discord、Slack 和 WhatsApp 相同：

```bash
openclaw plugins install @openclaw/mattermost
```

固定版本前，请查看 [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) 上当前的 dist-tags。

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

聊天模式：`oncall`（在 @-mention 时回应，默认）、`onmessage`（每条消息）、`onchar`（以触发前缀开头的消息）。

启用 Mattermost 原生命令时：

- `commands.callbackPath` 必须是路径（例如 `/api/channels/mattermost/command`），不能是完整 URL。
- `commands.callbackUrl` 必须解析到 OpenClaw Gateway 网关端点，并且 Mattermost 服务器能够访问。
- 原生斜杠命令回调使用 Mattermost 在斜杠命令注册期间返回的按命令划分 token
  进行认证。如果注册失败或没有
  命令被激活，OpenClaw 会用
  `Unauthorized: invalid command token.` 拒绝回调。
- 对于私有/tailnet/内部回调主机，Mattermost 可能要求
  `ServiceSettings.AllowedUntrustedInternalConnections` 包含回调主机/域名。
  使用主机/域名值，不要使用完整 URL。
- `channels.mattermost.configWrites`：允许或拒绝由 Mattermost 发起的配置写入。
- `channels.mattermost.requireMention`：在频道中回复前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：按频道覆盖提及门控（`"*"` 表示默认值）。
- 可选的 `channels.mattermost.defaultAccount` 会在匹配已配置账户 id 时覆盖默认账户选择。

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

**表情回应通知模式：**`off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

- `channels.signal.account`：将频道启动固定到特定 Signal 账户身份。
- `channels.signal.configWrites`：允许或拒绝由 Signal 发起的配置写入。
- 可选的 `channels.signal.defaultAccount` 会在匹配已配置账户 id 时覆盖默认账户选择。

### iMessage

OpenClaw 会生成 `imsg rpc`（通过 stdio 的 JSON-RPC）。不需要守护进程或端口。当主机可以授予 Messages 数据库和 Automation 权限时，这是新 OpenClaw iMessage 设置的首选路径。

BlueBubbles 支持已移除。`channels.bluebubbles` 在当前 OpenClaw 上不是受支持的运行时配置表面。将旧配置迁移到 `channels.imessage`；简短版本请参阅 [BlueBubbles removal and the imsg iMessage path](/zh-CN/announcements/bluebubbles-imessage)，完整转换表请参阅 [Coming from BlueBubbles](/zh-CN/channels/imessage-from-bluebubbles)。

如果 Gateway 网关未运行在已登录 Messages 的 Mac 上，请保留 `channels.imessage.enabled=true`，并将 `channels.imessage.cliPath` 设置为在该 Mac 上运行 `imsg "$@"` 的 SSH 包装器。默认本地 `imsg` 路径仅适用于 macOS。

在依赖 SSH 包装器进行生产发送前，请通过该精确包装器验证一次出站 `imsg send`。某些 macOS TCC 状态会将 Messages Automation 分配给 `/usr/libexec/sshd-keygen-wrapper`，这可能导致读取和探测可用，但发送因 AppleEvents `-1743` 失败；请参阅 [iMessage](/zh-CN/channels/imessage) 上的 SSH 包装器故障排查部分。

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

- 可选的 `channels.imessage.defaultAccount` 会在匹配已配置账户 id 时覆盖默认账户选择。
- 需要对 Messages DB 的 Full Disk Access。
- 优先使用 `chat_id:<id>` 目标。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可指向 SSH 包装器；设置 `remoteHost`（`host` 或 `user@host`）用于 SCP 附件获取。
- `attachmentRoots` 和 `remoteAttachmentRoots` 会限制传入附件路径（默认：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用严格主机密钥检查，因此请确保中继主机密钥已存在于 `~/.ssh/known_hosts` 中。
- `channels.imessage.configWrites`：允许或拒绝由 iMessage 发起的配置写入。
- `channels.imessage.sendTransport`：普通出站回复首选的 `imsg` RPC 发送传输。`auto`（默认）会在 IMCore bridge 运行时对现有聊天使用它，然后回退到 AppleScript；`bridge` 需要私有 API 投递；`applescript` 会强制使用公开的 Messages 自动化路径。
- `channels.imessage.actions.*`：启用也受 `imsg status` / `openclaw channels status --probe` 门控的私有 API 操作。
- `channels.imessage.includeAttachments` 默认关闭；在期望智能体轮次中出现传入媒体前，将其设置为 `true`。
- bridge/gateway 重启后的传入恢复是自动的（GUID 去重加陈旧 backlog 年龄栅栏）。现有 `channels.imessage.catchup.enabled: true` 配置仍会作为已弃用兼容性配置文件受到支持；`catchup` 默认禁用。
- `channels.imessage.groups`：群组注册表和按群组设置。使用 `groupPolicy: "allowlist"` 时，请配置显式 `chat_id` 键或 `"*"` 通配符条目，以便群组消息通过注册表门控。
- 顶层 `bindings[]` 条目若带有 `type: "acp"`，可将 iMessage 对话绑定到持久 ACP 会话。在 `match.peer.id` 中使用规范化 handle 或显式聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义：[ACP Agents](/zh-CN/tools/acp-agents#persistent-channel-bindings)。

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允许私有/内部 homeserver。`proxy` 和这个网络选择加入是相互独立的控制项。
- `channels.matrix.defaultAccount` 在多账户设置中选择首选账户。
- `channels.matrix.autoJoin` 默认是 `"off"`，因此受邀房间和新的私信式邀请会被忽略，直到你设置 `autoJoin: "allowlist"` 并配置 `autoJoinAllowlist`，或设置 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生的 exec 审批投递和审批人授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在自动模式下，当可以从 `approvers` 或 `commands.ownerAllowFrom` 解析审批人时，exec 审批会激活。
  - `approvers`：允许批准 exec 请求的 Matrix 用户 ID（例如 `@owner:example.org`）。
  - `agentFilter`：可选的 agent ID 允许列表。省略时转发所有 agent 的审批。
  - `sessionFilter`：可选的会话键模式（子字符串或正则表达式）。
  - `target`：发送审批提示的位置。`"dm"`（默认）、`"channel"`（来源房间）或 `"both"`。
  - 按账户覆盖：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私信如何分组成会话：`per-user`（默认）按路由对端共享，而 `per-room` 会隔离每个私信房间。
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

- 此处覆盖的核心键路径：`channels.msteams`、`channels.msteams.configWrites`。
- 完整的 Teams 配置（凭据、webhook、私信/群组策略、按团队/按频道覆盖）记录在 [Microsoft Teams](/zh-CN/channels/msteams) 中。

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

- 此处覆盖的核心键路径：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 可选的 `channels.irc.defaultAccount` 会在匹配已配置账户 ID 时覆盖默认账户选择。
- 完整的 IRC 渠道配置（host/port/TLS/channels/allowlists/mention gating）记录在 [IRC](/zh-CN/channels/irc) 中。

### 多账户（所有渠道）

为每个渠道运行多个账户（每个账户都有自己的 `accountId`）：

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
- 环境令牌只适用于**默认**账户。
- 基础渠道设置会应用于所有账户，除非按账户覆盖。
- 使用 `bindings[].match.accountId` 将每个账户路由到不同的智能体。
- 如果你通过 `openclaw channels add`（或渠道新手引导）添加非默认账户，同时仍在使用单账户顶层渠道配置，OpenClaw 会先把账户范围的顶层单账户值提升到渠道账户映射中，以便原账户继续工作。大多数渠道会把它们移入 `channels.<channel>.accounts.default`；Matrix 可以改为保留已有的匹配命名/默认目标。
- 现有的仅渠道绑定（没有 `accountId`）继续匹配默认账户；账户范围绑定仍然是可选的。
- `openclaw doctor --fix` 也会通过把账户范围的顶层单账户值移动到为该渠道选择的提升账户中来修复混合形态。大多数渠道使用 `accounts.default`；Matrix 可以改为保留已有的匹配命名/默认目标。

### 其他插件渠道

许多插件渠道配置为 `channels.<id>`，并在各自专用的渠道页面中记录（例如 Feishu、LINE、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Twitch 和 Zalo）。
请参阅完整渠道索引：[渠道](/zh-CN/channels)。

### 群聊提及门控

群组消息默认**需要提及**（元数据提及或安全的正则表达式模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

可见回复由单独设置控制。普通群组、频道和内部 WebChat 直接请求默认使用自动最终投递：最终 assistant 文本会通过旧版可见回复路径发布。当可见输出只应在 agent 调用 `message(action=send)` 后发布时，选择加入 `messages.visibleReplies: "message_tool"` 或 `messages.groupChat.visibleReplies: "message_tool"`。如果模型在已选择加入的仅工具模式中返回最终文本而未调用消息工具，该最终文本会保持私密，Gateway 网关详细日志会记录被抑制的载荷元数据。

仅工具可见回复需要一个能够可靠调用工具的模型/运行时，并推荐用于 GPT 5.5 等最新一代模型所在的共享环境房间。一些能力较弱的模型可以回答最终文本，但无法理解面向来源可见的输出必须通过 `message(action=send)` 发送。对于这些模型，请使用 `"automatic"`，让最终 assistant 轮次成为可见回复路径。如果会话日志显示 assistant 文本带有 `didSendViaMessagingTool: false`，说明模型生成了私密最终文本，而不是调用消息工具。请为该渠道切换到更强的工具调用模型，检查 Gateway 网关详细日志中的被抑制载荷摘要，或设置 `messages.groupChat.visibleReplies: "automatic"`，以便对每个群组/频道请求使用可见最终回复。

如果消息工具在活动工具策略下不可用，OpenClaw 会回退到自动可见回复，而不是静默抑制响应。`openclaw doctor` 会对此不匹配发出警告。

此规则适用于普通 agent 最终文本。插件拥有的会话绑定会把所属插件返回的回复用作已认领绑定线程轮次的可见响应；插件不需要为这些绑定回复调用 `message(action=send)`。

**故障排查：群组 @mention 触发正在输入后静默（无错误）**

症状：群组/频道 @mention 显示正在输入指示器，Gateway 网关日志报告 `dispatch complete (queuedFinal=false, replies=0)`，但房间中没有消息。同一 agent 的私信会正常回复。

原因：群组/频道可见回复模式解析为 `"message_tool"`，因此 OpenClaw 会运行该轮次，但除非 agent 调用 `message(action=send)`，否则会抑制最终 assistant 文本。此模式中没有 `NO_REPLY` 契约；没有消息工具调用就没有来源回复。没有错误，因为抑制是已配置的行为。普通群组和频道轮次默认是 `"automatic"`，所以此症状只会在 `messages.groupChat.visibleReplies`（或全局 `messages.visibleReplies`）显式设置为 `"message_tool"` 时出现。Harness `defaultVisibleReplies` 不适用于这里 — 群组/频道解析器会忽略它；它只影响直接/来源聊天（Codex harness 会以这种方式抑制直接聊天最终文本）。

修复：选择更强的工具调用模型，移除显式的 `"message_tool"` 覆盖以回退到 `"automatic"` 默认值，或设置 `messages.groupChat.visibleReplies: "automatic"`，为每个群组/频道请求强制使用可见回复。Gateway 网关会在文件保存后热重载 `messages` 配置；只有在部署中禁用了文件监视或配置重载时才需要重启 Gateway 网关。

**提及类型：**

- **元数据提及**：原生平台 @-mentions。在 WhatsApp 自聊模式中会被忽略。
- **文本模式**：`agents.list[].groupChat.mentionPatterns` 中的安全正则表达式模式。无效模式和不安全的嵌套重复会被忽略。
- 只有在可以检测时（原生提及或至少一个模式），才会执行提及门控。

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

`messages.groupChat.historyLimit` 设置全局默认值。渠道可以用 `channels.<channel>.historyLimit`（或按账户）覆盖。设置为 `0` 可禁用。

`messages.groupChat.unmentionedInbound: "room_event"` 会在受支持渠道上把未提及的常开群组/频道消息作为安静的房间上下文提交。被提及的消息、命令和直接消息仍然是用户请求。完整的 Discord、Slack 和 Telegram 示例请参阅 [环境房间事件](/zh-CN/channels/ambient-room-events)。

`messages.visibleReplies` 是全局来源事件默认值；`messages.groupChat.visibleReplies` 会为群组/频道来源事件覆盖它。当 `messages.visibleReplies` 未设置时，直接/来源聊天使用所选运行时或 harness 默认值，但内部 WebChat 直接轮次会使用自动最终投递，以保持 Pi/Codex 提示一致性。设置 `messages.visibleReplies: "message_tool"` 可有意要求 `message(action=send)` 才能产生可见输出。渠道允许列表和提及门控仍然决定事件是否会被处理。

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

此解析器会为任何会话键遵循标准 `provider:direct:<id>`（或旧版 `provider:dm:<id>`）形态的渠道读取 `channels.<provider>.dmHistoryLimit` 和 `channels.<provider>.dms.<id>.historyLimit`，因此它适用于内置渠道和插件渠道，而不只是固定列表。

#### 自聊模式

将你自己的号码包含在 `allowFrom` 中以启用自聊模式（忽略原生 @-mentions，只响应文本模式）：

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

- 此块配置命令界面。有关当前内置 + 捆绑命令目录，请参阅 [斜杠命令](/zh-CN/tools/slash-commands)。
- 本页是**配置键参考**，不是完整命令目录。由渠道/插件拥有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、设备配对 `/pair`、记忆 `/dreaming`、手机控制 `/phone` 和 Talk `/voice`，会在各自的渠道/插件页面以及 [斜杠命令](/zh-CN/tools/slash-commands) 中说明。
- 文本命令必须是带前导 `/` 的**独立**消息。
- `native: "auto"` 会为 Discord/Telegram 启用原生命令，并让 Slack 保持关闭。
- `nativeSkills: "auto"` 会为 Discord/Telegram 启用原生技能命令，并让 Slack 保持关闭。
- 按渠道覆盖：`channels.discord.commands.native`（布尔值或 `"auto"`）。对于 Discord，`false` 会在启动期间跳过原生命令注册和清理。
- 使用 `channels.<provider>.commands.nativeSkills` 按渠道覆盖原生技能注册。
- `channels.telegram.customCommands` 会添加额外的 Telegram Bot 菜单项。
- `bash: true` 会为主机 shell 启用 `! <cmd>`。需要 `tools.elevated.enabled`，且发送者必须位于 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 会启用 `/config`（读取/写入 `openclaw.json`）。对于 Gateway 网关 `chat.send` 客户端，持久化 `/config set|unset` 写入还需要 `operator.admin`；只读 `/config show` 仍可供普通写入权限范围的操作员客户端使用。
- `mcp: true` 会为 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置启用 `/mcp`。
- `plugins: true` 会为插件发现、安装以及启用/禁用控制启用 `/plugins`。
- `channels.<provider>.configWrites` 会按渠道控制配置变更（默认值：true）。
- 对于多账号渠道，`channels.<provider>.accounts.<id>.configWrites` 也会控制面向该账号的写入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 会禁用 `/restart` 和 Gateway 网关重启工具操作。默认值：`true`。
- `ownerAllowFrom` 是所有者专用命令和所有者门控渠道操作的显式所有者允许列表。它与 `allowFrom` 分离。
- `ownerDisplay: "hash"` 会在系统提示词中哈希所有者 ID。设置 `ownerDisplaySecret` 可控制哈希。
- `allowFrom` 按提供商配置。设置后，它就是**唯一**授权来源（渠道允许列表/配对和 `useAccessGroups` 会被忽略）。
- 当未设置 `allowFrom` 时，`useAccessGroups: false` 允许命令绕过访问组策略。
- 命令文档映射：
  - 内置 + 捆绑目录：[斜杠命令](/zh-CN/tools/slash-commands)
  - 渠道特定命令界面：[渠道](/zh-CN/channels)
  - QQ Bot 命令：[QQ Bot](/zh-CN/channels/qqbot)
  - 配对命令：[配对](/zh-CN/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-CN/channels/line)
  - 记忆 Dreaming：[Dreaming](/zh-CN/concepts/dreaming)

</Accordion>

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) — 顶层键
- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [渠道概览](/zh-CN/channels)
