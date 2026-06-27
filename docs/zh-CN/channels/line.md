---
read_when:
    - 你想将 OpenClaw 连接到 LINE
    - 你需要完成 LINE 网络钩子和凭据设置
    - 你需要 LINE 专属消息选项
summary: LINE Messaging API 插件设置、配置和使用
title: LINE
x-i18n:
    generated_at: "2026-06-27T01:23:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE 通过 LINE Messaging API 连接到 OpenClaw。该插件作为 Gateway 网关上的 webhook 接收器运行，并使用你的渠道访问令牌 + 渠道密钥进行认证。

状态：可下载插件。支持私信、群聊、媒体、位置、Flex 消息、模板消息和快捷回复。不支持回应和线程。

## 安装

在配置渠道之前安装 LINE：

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
2. 创建（或选择）一个 Provider，并添加一个 **Messaging API** 渠道。
3. 从渠道设置中复制 **渠道访问令牌** 和 **渠道密钥**。
4. 在 Messaging API 设置中启用 **使用 webhook**。
5. 将 webhook URL 设置为你的 Gateway 网关端点（必须使用 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 网关会响应 LINE 的 webhook 验证（GET），并在签名和载荷验证后立即确认已签名的入站事件（POST）；智能体处理会继续异步进行。
如果需要自定义路径，请设置 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，并相应更新 URL。

安全说明：

- LINE 签名验证依赖请求正文（基于原始正文的 HMAC），因此 OpenClaw 会在验证前应用严格的认证前正文大小限制和超时。
- OpenClaw 会根据已验证的原始请求字节处理 webhook 事件。为保证签名完整性安全，会忽略上游中间件转换后的 `req.body` 值。

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

私信默认使用配对。未知发送者会收到配对码，在获批之前，其消息会被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允许列表和策略：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：用于私信的允许列表 LINE 用户 ID；`dmPolicy: "open"` 要求 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：用于群组的允许列表 LINE 用户 ID
- 按群组覆盖：`channels.line.groups.<groupId>.allowFrom`
- 静态发送者访问组可通过 `accessGroup:<name>` 从 `allowFrom`、`groupAllowFrom` 和按群组的 `allowFrom` 引用。
- 运行时说明：如果 `channels.line` 完全缺失，运行时会在群组检查中回退到 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy`）。

LINE ID 区分大小写。有效 ID 如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 房间：`R` + 32 个十六进制字符

## 消息行为

- 文本会按 5000 个字符分块。
- Markdown 格式会被移除；代码块和表格会在可行时转换为 Flex 卡片。
- 流式响应会被缓冲；智能体工作期间，LINE 会收到完整分块并显示加载动画。
- 媒体下载受 `channels.line.mediaMaxMb` 限制（默认 10）。
- 入站媒体会先保存到 `~/.openclaw/media/inbound/`，再传递给智能体，这与其他内置渠道插件使用的共享媒体存储一致。

## 渠道数据（富消息）

使用 `channelData.line` 发送快捷回复、位置、Flex 卡片或模板消息。

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

LINE 插件还提供用于 Flex 消息预设的 `/card` 命令：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支持

LINE 支持 ACP（Agent Communication Protocol）会话绑定：

- `/acp spawn <agent> --bind here` 会将当前 LINE 聊天绑定到 ACP 会话，而不创建子线程。
- 已配置的 ACP 绑定和活跃的会话绑定 ACP 会话可在 LINE 上像其他会话渠道一样工作。

详见 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 出站媒体

LINE 插件支持通过智能体消息工具发送图片、视频和音频文件。媒体会通过 LINE 专用投递路径发送，并进行适当的预览和跟踪处理：

- **图片**：作为 LINE 图片消息发送，并自动生成预览。
- **视频**：发送时会显式处理预览和内容类型。
- **音频**：作为 LINE 音频消息发送。

出站媒体 URL 必须是公开 HTTPS URL。OpenClaw 会在将 URL 交给 LINE 之前验证目标主机名，并拒绝 local loopback、链路本地和私有网络目标。

当 LINE 专用路径不可用时，通用媒体发送会回退到现有的仅图片路径。

## 故障排除

- **Webhook 验证失败：**确保 webhook URL 使用 HTTPS，且 `channelSecret` 与 LINE console 匹配。
- **没有入站事件：**确认 webhook 路径与 `channels.line.webhookPath` 匹配，并且 Gateway 网关可被 LINE 访问。
- **媒体下载错误：**如果媒体超过默认限制，请提高 `channels.line.mediaMaxMb`。

## 相关

- [Channels 概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
