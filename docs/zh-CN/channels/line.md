---
read_when:
    - 你想将 OpenClaw 连接到 LINE
    - 你需要 LINE 网络钩子 + 凭证设置
    - 你想要 LINE 专用的消息选项
summary: LINE Messaging API 插件设置、配置和使用
title: 行
x-i18n:
    generated_at: "2026-04-29T05:38:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE 通过 LINE Messaging API 连接到 OpenClaw。该插件在 Gateway 网关上作为 webhook
接收器运行，并使用你的 channel access token + channel secret 进行
身份验证。

Status：内置插件。支持私信、群聊、媒体、位置、Flex
消息、template messages 和 quick replies。不支持表情回应和线程。

## 内置插件

在当前 OpenClaw 版本中，LINE 作为内置插件提供，因此正常的
打包构建不需要单独安装。

如果你使用的是较旧构建，或是不包含 LINE 的自定义安装，请在发布后安装
当前 npm 包：

```bash
openclaw plugins install @openclaw/line
```

如果 npm 报告 OpenClaw 拥有的包已弃用或缺失，请使用
当前打包的 OpenClaw 构建或本地检出，直到 npm 包发布节奏
跟上。

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 设置

1. 创建 LINE Developers 账号并打开 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）一个提供商，并添加一个 **Messaging API** 渠道。
3. 从渠道设置中复制 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 设置中启用 **Use webhook**。
5. 将 webhook URL 设置为你的 Gateway 网关端点（需要 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 网关会响应 LINE 的 webhook 验证（GET）和入站事件（POST）。
如果需要自定义路径，请设置 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，并相应更新 URL。

安全说明：

- LINE 签名验证依赖正文（对原始正文执行 HMAC），因此 OpenClaw 会在验证前应用严格的预认证正文限制和超时。
- OpenClaw 会处理来自已验证原始请求字节的 webhook 事件。为保证签名完整性安全，会忽略上游中间件转换后的 `req.body` 值。

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

私信默认使用配对。未知发送者会收到一个配对码，并且其
消息会被忽略，直到获得批准。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允许列表和策略：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：允许发送私信的 LINE 用户 ID
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：允许发送群组消息的 LINE 用户 ID
- 按群组覆盖：`channels.line.groups.<groupId>.allowFrom`
- 运行时说明：如果 `channels.line` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 来进行群组检查（即使设置了 `channels.defaults.groupPolicy`）。

LINE ID 区分大小写。有效 ID 如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 房间：`R` + 32 个十六进制字符

## 消息行为

- 文本会按 5000 个字符分块。
- Markdown 格式会被剥离；代码块和表格会在可能时转换为 Flex
  卡片。
- 流式响应会被缓冲；在智能体工作时，LINE 会收到带有加载
  动画的完整分块。
- 媒体下载受 `channels.line.mediaMaxMb` 限制（默认 10）。
- 入站媒体会先保存到 `~/.openclaw/media/inbound/`，然后再传递给
  智能体，这与其他内置渠道插件使用的共享媒体存储一致。

## 渠道数据（富消息）

使用 `channelData.line` 发送 quick replies、位置、Flex 卡片或 template
messages。

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

LINE 支持 ACP（Agent Communication Protocol）对话绑定：

- `/acp spawn <agent> --bind here` 将当前 LINE 聊天绑定到 ACP 会话，而不创建子线程。
- 已配置的 ACP 绑定和活跃的对话绑定 ACP 会话在 LINE 上的工作方式与其他对话渠道相同。

详见 [ACP 智能体](/zh-CN/tools/acp-agents)。

## 出站媒体

LINE 插件支持通过智能体消息工具发送图片、视频和音频文件。媒体会通过 LINE 专用投递路径发送，并带有适当的预览和跟踪处理：

- **图片**：作为 LINE 图片消息发送，并自动生成预览。
- **视频**：发送时带有显式预览和内容类型处理。
- **音频**：作为 LINE 音频消息发送。

出站媒体 URL 必须是公开 HTTPS URL。OpenClaw 会在将 URL 交给 LINE 前验证目标主机名，并拒绝 local loopback、链路本地和私有网络目标。

当 LINE 专用路径不可用时，通用媒体发送会回退到现有的仅图片路由。

## 故障排除

- **Webhook 验证失败：**确保 webhook URL 使用 HTTPS，并且
  `channelSecret` 与 LINE console 匹配。
- **没有入站事件：**确认 webhook 路径与 `channels.line.webhookPath`
  匹配，并且 LINE 可以访问 Gateway 网关。
- **媒体下载错误：**如果媒体超过默认限制，请提高 `channels.line.mediaMaxMb`。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
