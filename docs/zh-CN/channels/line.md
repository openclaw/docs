---
read_when:
    - 你想将 OpenClaw 连接到 LINE
    - 你需要设置 LINE webhook 和凭据
    - 你需要 LINE 专用的消息选项
summary: LINE Messaging API 插件的设置、配置和用法
title: LINE
x-i18n:
    generated_at: "2026-07-11T20:20:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE 通过 LINE Messaging API 连接到 OpenClaw。该插件在 Gateway 网关上作为 webhook 接收器运行，并使用你的渠道访问令牌和渠道密钥进行身份验证。

状态：官方插件，需单独安装。支持私信、群聊、媒体、位置、Flex 消息、模板消息和快速回复。不支持表情回应和话题串。

## 安装

配置渠道前先安装 LINE：

```bash
openclaw plugins install @openclaw/line
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 设置

1. 创建 LINE Developers 账号并打开 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）一个 Provider，然后添加 **Messaging API** 渠道。
3. 从渠道设置中复制 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 设置中启用 **Use webhook**。
5. 将 webhook URL 设置为你的 Gateway 网关端点（必须使用 HTTPS）：

```text
https://gateway-host/line/webhook
```

Gateway 网关会响应 LINE 的 webhook 验证请求（GET），并在完成签名和载荷验证后立即确认已签名的入站事件（POST）；智能体处理则继续异步进行。
如果需要自定义路径，请设置 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，并相应更新 URL。

安全注意事项：

- LINE 签名验证依赖请求正文（对原始正文执行 HMAC），因此 OpenClaw 会在验证前实施严格的身份验证前正文大小限制（64 KB）和读取超时。
- OpenClaw 使用已验证的原始请求字节处理 webhook 事件。为确保签名完整性，会忽略由上游中间件转换的 `req.body` 值。

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

环境变量（仅适用于默认账号）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

令牌/密钥文件：

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
内联配置值优先于文件；对于默认账号，环境变量是最后的回退来源。

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

私信默认使用配对。未知发送者会收到配对码，在获批前，其消息会被忽略：

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允许列表和策略：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`（默认为 `pairing`）
- `channels.line.allowFrom`：私信允许列表中的 LINE 用户 ID；`dmPolicy: "open"` 要求设置为 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`（默认为 `allowlist`）
- `channels.line.groupAllowFrom`：群组允许列表中的 LINE 用户 ID
- 每个群组的覆盖配置：`channels.line.groups.<groupId>.allowFrom`（以及 `enabled`、`requireMention`、`systemPrompt`、`skills`）
- 可通过 `accessGroup:<name>`，在 `allowFrom`、`groupAllowFrom` 和每个群组的 `allowFrom` 中引用静态发送者访问组；请参阅[访问组](/zh-CN/channels/access-groups)。
- 运行时注意事项：如果完全缺少 `channels.line`，运行时会在群组检查中回退到 `groupPolicy="allowlist"`（即使已设置 `channels.defaults.groupPolicy`）。

LINE ID 区分大小写。有效 ID 的格式如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 聊天室：`R` + 32 个十六进制字符

## 消息行为

- 文本按 5000 个字符分块。
- Markdown 格式会被移除；代码块和表格会尽可能转换为 Flex 卡片。
- 流式响应会被缓冲；智能体工作期间，LINE 会显示加载动画，并接收完整的数据块。
- 媒体下载大小受 `channels.line.mediaMaxMb` 限制（默认为 10）。
- 入站媒体在传递给智能体之前，会保存到 `~/.openclaw/media/inbound/`，与其他渠道插件使用的共享媒体存储保持一致。

## 渠道数据（富消息）

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
        contents: {/* Flex payload */},
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

LINE 插件还提供用于 Flex 消息预设的 `/card` 命令：

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP 支持

LINE 支持 ACP（智能体通信协议）对话绑定：

- `/acp spawn <agent> --bind here` 将当前 LINE 聊天绑定到 ACP 会话，而不创建子话题串。
- 已配置的 ACP 绑定和处于活动状态的对话绑定 ACP 会话，可像在其他对话渠道中一样在 LINE 上工作。

有关详情，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 出站媒体

LINE 插件通过智能体消息工具发送图片、视频和音频：

- **图片**：作为 LINE 图片消息发送；预览图片默认使用媒体 URL。
- **视频**：需要预览图片；将 `channelData.line.previewImageUrl` 设置为图片 URL。
- **音频**：作为 LINE 音频消息发送；除非设置了 `channelData.line.durationMs`，否则时长默认为 60 秒。

设置 `channelData.line.mediaKind` 时，媒体类型取自该配置；否则根据其他 LINE 选项或 URL 文件后缀推断，并以图片作为回退类型。

出站媒体 URL 必须是长度不超过 2000 个字符的公开 HTTPS URL。OpenClaw 在将 URL 交给 LINE 之前会验证目标主机名，并拒绝 local loopback、链路本地和私有网络目标。

不包含 LINE 专用选项的通用媒体发送会使用图片路径。

## 故障排查

- **Webhook 验证失败：**确保 webhook URL 使用 HTTPS，并且 `channelSecret` 与 LINE Console 中的值一致。
- **没有入站事件：**确认 webhook 路径与 `channels.line.webhookPath` 匹配，并且 LINE 可以访问 Gateway 网关。
- **媒体下载错误：**如果媒体超过默认限制，请增大 `channels.line.mediaMaxMb`。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有受支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和安全加固
