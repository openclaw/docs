---
read_when:
    - 你想将 OpenClaw 连接到 LINE
    - 你需要设置 LINE webhook 和凭证
    - 你想要 LINE 专属的消息选项
summary: LINE Messaging API 插件设置、配置和用法
title: LINE
x-i18n:
    generated_at: "2026-07-05T11:02:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: abad928180a8b5590ab32a28688531214b78eaee104e6b82f068ae48e2e930f0
    source_path: channels/line.md
    workflow: 16
---

LINE 通过 LINE Messaging API 连接到 OpenClaw。该插件在 Gateway 网关上作为 webhook 接收器运行，并使用你的 channel access token + channel secret 进行身份验证。

状态：官方插件，单独安装。支持私信、群聊、媒体、位置、Flex 消息、模板消息和快速回复。不支持表情回应和线程。

## 安装

在配置渠道之前安装 LINE：

```bash
openclaw plugins install @openclaw/line
```

本地 checkout（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 设置

1. 创建 LINE Developers 账号并打开 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）一个 Provider，并添加一个 **Messaging API** 渠道。
3. 从渠道设置中复制 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 设置中启用 **Use webhook**。
5. 将 webhook URL 设置为你的 Gateway 网关端点（需要 HTTPS）：

```text
https://gateway-host/line/webhook
```

Gateway 网关会响应 LINE 的 webhook 验证（GET），并在签名和 payload 验证后立即确认已签名的入站事件（POST）；智能体处理会继续异步进行。
如果需要自定义路径，请设置 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，并相应更新 URL。

安全说明：

- LINE 签名验证依赖 body（对原始 body 进行 HMAC），因此 OpenClaw 会在验证前应用严格的预认证 body 限制（64 KB）和读取超时。
- OpenClaw 会从已验证的原始请求字节处理 webhook 事件。为保证签名完整性安全，会忽略上游中间件转换后的 `req.body` 值。

## 配置

最小配置：

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

公开私信配置：

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

环境变量（仅默认账号）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret 文件：

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

`tokenFile` 和 `secretFile` 必须指向常规文件。符号链接会被拒绝。
内联配置值优先于文件；环境变量是默认账号的最后 fallback。

多个账号：

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

私信默认使用配对。未知发送者会收到一个配对代码，并且其消息会被忽略，直到获批：

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允许列表和策略：

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`（默认 `pairing`）
- `channels.line.allowFrom`: 私信用的允许列表 LINE 用户 ID；`dmPolicy: "open"` 要求 `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`（默认 `allowlist`）
- `channels.line.groupAllowFrom`: 群组用的允许列表 LINE 用户 ID
- 按群组覆盖：`channels.line.groups.<groupId>.allowFrom`（以及 `enabled`、`requireMention`、`systemPrompt`、`skills`）
- 静态发送者访问组可通过 `accessGroup:<name>` 从 `allowFrom`、`groupAllowFrom` 和按群组 `allowFrom` 引用；参见 [访问组](/zh-CN/channels/access-groups)。
- 运行时说明：如果完全缺少 `channels.line`，运行时会在群组检查中 fallback 到 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy`）。

LINE ID 区分大小写。有效 ID 形如：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 聊天室：`R` + 32 个十六进制字符

## 消息行为

- 文本按 5000 个字符分块。
- Markdown 格式会被剥离；代码块和表格会在可行时转换为 Flex 卡片。
- 流式响应会被缓冲；智能体工作期间，LINE 会收到带加载动画的完整分块。
- 媒体下载受 `channels.line.mediaMaxMb` 限制（默认 10）。
- 入站媒体会先保存到 `~/.openclaw/media/inbound/`，再传递给智能体，与其他渠道插件使用的共享媒体存储一致。

## 频道数据（富消息）

使用 `channelData.line` 发送快速回复、位置、Flex 卡片或模板消息。

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

LINE 插件还附带用于 Flex 消息预设的 `/card` 命令：

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP 支持

LINE 支持 ACP（Agent Communication Protocol）对话绑定：

- `/acp spawn <agent> --bind here` 将当前 LINE 聊天绑定到 ACP 会话，而不创建子线程。
- 已配置的 ACP 绑定和活跃的对话绑定 ACP 会话在 LINE 上的工作方式与其他对话渠道相同。

详情参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 出站媒体

LINE 插件通过智能体消息工具发送图片、视频和音频：

- **图片**：作为 LINE 图片消息发送；预览图片默认使用媒体 URL。
- **视频**：需要预览图片；将 `channelData.line.previewImageUrl` 设置为图片 URL。
- **音频**：作为 LINE 音频消息发送；除非设置了 `channelData.line.durationMs`，否则时长默认为 60 秒。

设置时，媒体类型取自 `channelData.line.mediaKind`；否则会从其他 LINE 选项或 URL 文件后缀推断，并以图片作为 fallback。

出站媒体 URL 必须是最多 2000 个字符的公开 HTTPS URL。OpenClaw 会在将 URL 交给 LINE 前验证目标主机名，并拒绝 local loopback、link-local 和私有网络目标。

未使用 LINE 专用选项的通用媒体发送会使用图片路由。

## 故障排查

- **Webhook 验证失败：** 确保 webhook URL 是 HTTPS，且 `channelSecret` 与 LINE console 匹配。
- **没有入站事件：** 确认 webhook 路径与 `channels.line.webhookPath` 匹配，并且 Gateway 网关可从 LINE 访问。
- **媒体下载错误：** 如果媒体超过默认限制，请提高 `channels.line.mediaMaxMb`。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
