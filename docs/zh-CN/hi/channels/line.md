---
read_when:
    - 你想将 OpenClaw 连接到 LINE
    - 你需要设置 LINE Webhook + 凭证
    - 你需要 LINE 专用的消息选项
summary: LINE Messaging API 插件设置、配置和使用
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE 通过 LINE Messaging API 连接到 OpenClaw。插件作为 Gateway 网关上的 Webhook 接收器运行，并使用你的 channel access token + channel secret 进行身份验证。

状态：可下载插件。支持私信、群聊、媒体、位置、Flex 消息、模板消息和快速回复。不支持表情回应和线程。

## 安装

在配置渠道之前安装 LINE：

```bash
openclaw plugins install @openclaw/line
```

本地检出（从 git repo 运行时）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 设置

1. 创建 LINE Developers account 并打开 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）一个 Provider，并添加 **Messaging API** channel。
3. 从 channel settings 复制 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API settings 中启用 **Use webhook**。
5. 将 Webhook URL 设置为你的 Gateway 网关 endpoint（需要 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 网关会响应 LINE 的 Webhook verification（GET），并在 signature 和 payload validation 后立即接受 signed inbound events（POST）；智能体处理会异步继续。
如果你需要自定义路径，请设置 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，并相应更新 URL。

安全说明：

- LINE signature verification 依赖 body（基于 raw body 的 HMAC），因此 OpenClaw 会在 verification 前应用严格的 pre-auth body limits 和 timeout。
- OpenClaw 会从 verified raw request bytes 处理 Webhook events。为了 signature-integrity safety，会忽略 upstream middleware-transformed `req.body` values。

## 配置

最小 config：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Public DM config：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

环境变量（仅 default account）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret files：

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` 和 `secretFile` 应指向 regular files。Symlinks 会被拒绝。

多个 accounts：

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 访问控制

私信默认使用配对。未知 senders 会收到 pairing code，他们的消息在获批前会被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists 和 policies：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：用于 DMs 的 allowlisted LINE user IDs；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：用于 groups 的 allowlisted LINE user IDs
- Per-group overrides：`channels.line.groups.<groupId>.allowFrom`
- Static sender access groups 可以通过 `allowFrom`、`groupAllowFrom` 和 per-group `allowFrom` 中的 `accessGroup:<name>` 引用。
- 运行时说明：如果完全缺少 `channels.line`，runtime 会在 group checks 时 fallback 到 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy`）。

LINE IDs 区分大小写。有效 IDs 如下：

- User：`U` + 32 个 hex chars
- Group：`C` + 32 个 hex chars
- Room：`R` + 32 个 hex chars

## 消息行为

- Text 会按 5000 characters 分成 chunks。
- Markdown formatting 会被移除；code blocks 和 tables 会在可行时转换为 Flex cards。
- Streaming responses 会被 buffered；当 agent 工作时，LINE 会收到带 loading animation 的完整 chunks。
- Media downloads 受 `channels.line.mediaMaxMb`（default 10）限制。
- Inbound media 在传递给 agent 之前会保存到 `~/.openclaw/media/inbound/` 下，
  这与其他 bundled channel plugins 使用的 shared media store 一致。

## Channel data（富消息）

使用 `channelData.line` 发送 quick replies、locations、Flex cards 或 template messages。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE 插件还提供用于 Flex message presets 的 `/card` command：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支持

LINE 支持 ACP（Agent Communication Protocol）conversation bindings：

- `/acp spawn <agent> --bind here` 会将当前 LINE chat bind 到 ACP session，而不创建 child thread。
- Configured ACP bindings 和 active conversation-bound ACP sessions 在 LINE 上会像其他 conversation channels 一样工作。

详情请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 出站媒体

LINE 插件支持通过 agent message tool 发送 images、videos 和 audio files。Media 会通过 LINE-specific delivery path 发送，并带有合适的 preview 和 tracking handling：

- **Images**：作为 LINE image messages 发送，并自动生成 preview。
- **Videos**：带 explicit preview 和 content-type handling 发送。
- **Audio**：作为 LINE audio messages 发送。

Outbound media URLs 必须是 public HTTPS URLs。OpenClaw 会在将 URL 交给 LINE 之前验证 target hostname，并拒绝 loopback、link-local 和 private-network targets。

Generic media sends 在 LINE-specific path 不可用时会 fallback 到 existing image-only route。

## 故障排除

- **Webhook verification fails：** 确保 Webhook URL 是 HTTPS，且
  `channelSecret` 与 LINE console 匹配。
- **No inbound events：** 确认 Webhook path 与 `channels.line.webhookPath` 匹配，
  并且 Gateway 网关可被 LINE 访问。
- **Media download errors：** 如果 media 超过 default limit，请增大 `channels.line.mediaMaxMb`。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的 channels
- [配对](/zh-CN/channels/pairing) — DM authentication 和 pairing flow
- [Groups](/zh-CN/channels/groups) — group chat behavior 和 mention gating
- [频道路由](/zh-CN/channels/channel-routing) — messages 的 session routing
- [Security](/zh-CN/gateway/security) — access model 和 hardening
