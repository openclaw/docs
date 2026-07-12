---
read_when:
    - 使用 OpenClaw 设置 Synology Chat
    - 调试 Synology Chat webhook 路由
summary: Synology Chat webhook 设置和 OpenClaw 配置
title: Synology Chat
x-i18n:
    generated_at: "2026-07-11T20:20:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat 通过一对 webhook 连接到 OpenClaw：Synology Chat 出站 webhook 将收到的私信发送到 Gateway 网关，回复则通过 Synology Chat 入站 webhook 返回。

状态：官方插件，需单独安装。仅支持私信；支持文本消息和基于 URL 的文件发送。

## 安装

```bash
openclaw plugins install @openclaw/synology-chat
```

本地检出版本（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

1. 安装插件（见上文）。
2. 在 Synology Chat 集成中：
   - 创建入站 webhook 并复制其 URL。
   - 使用你的秘密令牌创建出站 webhook。
3. 将出站 webhook URL 指向你的 OpenClaw Gateway 网关：
   - 默认使用 `https://gateway-host/webhook/synology`。
   - 或使用你的自定义 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成设置。Synology Chat 会出现在以下两种流程中的同一渠道设置列表内：
   - 引导式：`openclaw onboard` 或 `openclaw channels add`
   - 直接设置：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重启 Gateway 网关，并向 Synology Chat Bot 发送私信。

Webhook 身份验证详情：

- OpenClaw 按以下顺序接受出站 webhook 令牌：先从 `body.token`，然后从
  `?token=...`，最后从请求头中获取。
- 接受的请求头形式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 令牌为空或缺失时采用拒绝策略。
- 载荷可以是 `application/x-www-form-urlencoded` 或 `application/json`；必须包含 `token`、`user_id` 和 `text`。

最小配置：

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 环境变量

对于默认账户，你可以使用环境变量：

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（以逗号分隔）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

配置值会覆盖环境变量。

不能从工作区 `.env` 设置 `SYNOLOGY_CHAT_INCOMING_URL` 和 `SYNOLOGY_NAS_HOST`；请参阅[工作区 `.env` 文件](/zh-CN/gateway/security#workspace-env-files)。

## 私信策略和访问控制

- 支持的 `dmPolicy` 值：`allowlist`（默认）、`open` 和 `disabled`。Synology Chat 没有配对流程；请将发送者的 Synology 数字用户 ID 添加到 `allowedUserIds` 以批准发送者。
- `allowedUserIds` 接受 Synology 用户 ID 列表（或以逗号分隔的字符串）。
- 在 `allowlist` 模式下，空的 `allowedUserIds` 列表会被视为配置错误，webhook 路由不会启动。
- 仅当 `allowedUserIds` 包含 `"*"` 时，`dmPolicy: "open"` 才允许公开私信；如果包含限制性条目，则只有匹配的用户可以聊天。`open` 与空的 `allowedUserIds` 列表组合时，也会拒绝启动路由。
- `dmPolicy: "disabled"` 会阻止私信。
- 默认情况下，回复接收者绑定始终使用稳定的数字 `user_id`。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是一种紧急兼容模式，会重新启用可变用户名/昵称查找以投递回复。

## 出站投递

使用 Synology Chat 数字用户 ID 作为目标。接受 `synology-chat:`、`synology_chat:` 和 `synology:` 前缀。

示例：

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

出站文本按 2000 个字符分块。支持通过基于 URL 的文件投递发送媒体：NAS 会下载并附加文件（最大 32 MB）。出站文件 URL 必须使用 `http` 或 `https`，OpenClaw 在将 URL 转发给 NAS webhook 之前，会拒绝私有网络目标或其他被阻止的网络目标。

## 多账户

`channels.synology-chat.accounts` 支持多个 Synology Chat 账户。
每个账户均可覆盖令牌、入站 URL、webhook 路径、私信策略和限制。
私信会话按账户和用户隔离，因此两个不同 Synology 账户中相同的数字 `user_id`
不会共享对话记录状态。
请为每个已启用账户指定不同的 `webhookPath`。OpenClaw 会拒绝完全重复的路径，
并且在多账户设置中，如果命名账户仅继承共享的 webhook 路径，则拒绝启动该账户。
如果你确实需要命名账户继承旧版行为，请在该账户或 `channels.synology-chat` 中设置
`dangerouslyAllowInheritedWebhookPath: true`，但完全重复的路径仍会采用拒绝策略。
建议为每个账户明确设置路径。

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## 安全说明

- 对 `token` 保密；如果泄露，请轮换令牌。
- 除非你明确信任本地 NAS 的自签名证书，否则请保持 `allowInsecureSsl: false`。
- 入站 webhook 请求会验证令牌，并按发送者进行速率限制（`rateLimitPerMinute`，默认为 30）。
- 无效令牌检查使用恒定时间的秘密值比较并采用拒绝策略；反复尝试无效令牌会暂时封禁来源 IP。
- 入站消息文本会针对已知的提示注入模式进行清理，并截断为最多 4000 个字符。
- 生产环境建议使用 `dmPolicy: "allowlist"`。
- 除非你明确需要基于旧版用户名的回复投递，否则请保持关闭 `dangerouslyAllowNameMatching`。
- 除非你明确接受多账户设置中的共享路径路由风险，否则请保持关闭 `dangerouslyAllowInheritedWebhookPath`。

## 故障排查

- `Missing required fields (token, user_id, text)`：
  - 出站 webhook 载荷缺少某个必填字段
  - 如果 Synology 在请求头中发送令牌，请确保 Gateway 网关或代理保留这些请求头
- `Invalid token`：
  - 出站 webhook 秘密值与 `channels.synology-chat.token` 不匹配
  - 请求到达了错误的账户或 webhook 路径
  - 反向代理在请求到达 OpenClaw 之前移除了令牌请求头
- `Rate limit exceeded`：
  - 来自同一来源的无效令牌尝试过多，可能会暂时封禁该来源
  - 已通过身份验证的发送者还有单独的按用户消息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`：
  - 已启用 `dmPolicy="allowlist"`，但未配置任何用户
- `User not authorized`：
  - 发送者的数字 `user_id` 不在 `allowedUserIds` 中

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和安全加固
