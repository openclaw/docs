---
read_when:
    - 你想将 OpenClaw 连接到 LINE
    - 你需要配置 LINE Webhook 和凭证
    - 你需要 LINE 专用的消息参数
summary: LINE Messaging API 插件的设置、配置和使用
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:34:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE 通过 LINE Messaging API 连接到 OpenClaw。插件作为 Gateway 网关上的 webhook 接收器运行，并使用你的频道访问令牌 + 频道密钥进行身份验证。

状态：可加载插件。支持私信、群聊、媒体、位置、Flex messages、template messages 和快速回复。不支持回应和线程。

## 安装

配置渠道前先安装 LINE：

```bash
openclaw plugins install @openclaw/line
```

本地工作副本（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 设置

1. 创建 LINE Developers 账号并打开 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）Provider，并添加 **Messaging API** 渠道。
3. 从渠道设置中复制**频道访问令牌**和**频道密钥**。
4. 在 Messaging API 设置中启用 **Use webhook**。
5. 为你的 Gateway 网关端点设置 webhook URL（需要 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 网关会响应 LINE 的 webhook 验证（GET），并在签名和载荷验证后立即确认已签名的传入事件（POST）；智能体处理会继续异步进行。
如果需要自定义路径，请设置 `channels.line.webhookPath` 或 `channels.line.accounts.<id>.webhookPath`，并相应更新 URL。

安全说明：

- LINE 签名验证依赖请求体（对原始请求体执行 HMAC），因此 OpenClaw 会在验证前应用严格的请求体大小限制和身份验证前超时。
- OpenClaw 会从已验证的原始请求字节处理 webhook 事件。为保持签名完整性，会忽略上游中间件转换后的 `req.body` 值。

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

开放私信配置：

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

`tokenFile` 和 `secretFile` 必须指向普通文件。符号链接会被拒绝。

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

私信默认需要配对。未知发送者会收到配对码，其消息在获批前会被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允许列表和策略：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：允许发送私信的 LINE 用户 ID；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：允许的 LINE 群组 ID
- 单个群组覆盖项：`channels.line.groups.<groupId>.allowFrom`
- 静态发送者访问组可以通过 `accessGroup:<name>` 从 `allowFrom`、`groupAllowFrom` 和群组级 `allowFrom` 引用。
- 运行时说明：如果完全缺少 `channels.line`，运行时会在群组检查中回退到 `groupPolicy="allowlist"`（即使已设置 `channels.defaults.groupPolicy`）。

LINE ID 区分大小写。有效 ID 如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 房间：`R` + 32 个十六进制字符

## 消息行为

- 文本会按 5000 个字符分段。
- Markdown 格式会被移除；代码块和表格会尽可能转换为 Flex cards。
- 流式响应会被缓冲；智能体工作期间，LINE 会收到带加载动画的完整分段。
- 媒体下载受 `channels.line.mediaMaxMb` 限制（默认为 10）。
- 传入媒体会先保存到 `~/.openclaw/media/inbound/`，再传递给智能体，这与其他内置渠道插件使用的通用媒体存储一致。

## 渠道数据（扩展消息）

使用 `channelData.line` 发送快速回复、位置、Flex cards 或 template messages。

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

LINE 插件还附带用于 Flex messages 预设的 `/card` 命令：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支持

LINE 支持 ACP（Agent Communication Protocol）会话绑定：

- `/acp spawn <agent> --bind here` 会将当前 LINE 聊天绑定到 ACP 会话，而不创建子线程。
- 已配置的 ACP 绑定和绑定到会话的活动 ACP 会话，在 LINE 中的工作方式与其他会话渠道相同。

详见 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 传出媒体

LINE 插件支持通过智能体消息工具发送图片、视频和音频文件。媒体会通过 LINE 专用投递路径发送，并进行相应的预览处理和跟踪：

- **图片**：作为 LINE 图片消息发送，并自动生成预览。
- **视频**：发送时会显式处理预览和内容类型。
- **音频**：作为 LINE 音频消息发送。

传出媒体 URL 必须是公开 HTTPS URL。OpenClaw 会在把 URL 传递给 LINE 前检查目标主机名，并拒绝 local loopback、链路本地和私有网络目标。

当 LINE 专用路径不可用时，通用媒体发送只会回退到现有的图片专用路由。

## 故障排除

- **webhook 验证失败：**确保 webhook URL 使用 HTTPS，且 `channelSecret` 与 LINE console 匹配。
- **没有传入事件：**确认 webhook 路径与 `channels.line.webhookPath` 匹配，并且 Gateway 网关可被 LINE 访问。
- **媒体下载错误：**如果媒体超过默认限制，请增大 `channels.line.mediaMaxMb`。

## 另见

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及限制
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固保护
