---
read_when:
    - 使用 OpenClaw 设置 Synology Chat
    - 调试 Synology Chat webhook 路由
summary: Synology Chat webhook 设置和 OpenClaw 配置
title: Synology Chat
x-i18n:
    generated_at: "2026-07-05T11:03:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat 通过一对网络钩子连接到 OpenClaw：Synology Chat 出站网络钩子会将传入私信发送到 Gateway 网关，回复则通过 Synology Chat 入站网络钩子发回。

状态：官方插件，单独安装。仅支持私信；支持文本和基于 URL 的文件发送。

## 安装

```bash
openclaw plugins install @openclaw/synology-chat
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

1. 安装插件（见上文）。
2. 在 Synology Chat 集成中：
   - 创建一个入站网络钩子并复制其 URL。
   - 使用你的密钥令牌创建一个出站网络钩子。
3. 将出站网络钩子 URL 指向你的 OpenClaw Gateway 网关：
   - 默认为 `https://gateway-host/webhook/synology`。
   - 或你的自定义 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成设置。Synology Chat 会在两个流程的同一频道设置列表中出现：
   - 引导式：`openclaw onboard` 或 `openclaw channels add`
   - 直接：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重启 Gateway 网关，并向 Synology Chat 机器人发送私信。

网络钩子凭证详情：

- OpenClaw 会先从 `body.token` 接受出站网络钩子令牌，然后是
  `?token=...`，然后是请求头。
- 接受的请求头形式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空令牌或缺失令牌会按失败关闭处理。
- 载荷可以是 `application/x-www-form-urlencoded` 或 `application/json`；`token`、`user_id` 和 `text` 为必填。

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
- `SYNOLOGY_ALLOWED_USER_IDS`（逗号分隔）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

配置值会覆盖环境变量。

`SYNOLOGY_CHAT_INCOMING_URL` 和 `SYNOLOGY_NAS_HOST` 不能从工作区 `.env` 设置；请参阅[工作区 `.env` 文件](/zh-CN/gateway/security#workspace-env-files)。

## 私信策略和访问控制

- 支持的 `dmPolicy` 值：`allowlist`（默认）、`open` 和 `disabled`。Synology Chat 没有配对流程；通过将发送者的数字 Synology 用户 ID 添加到 `allowedUserIds` 来批准发送者。
- `allowedUserIds` 接受 Synology 用户 ID 列表（或逗号分隔字符串）。
- 在 `allowlist` 模式下，空的 `allowedUserIds` 列表会被视为配置错误，网络钩子路由将不会启动。
- 只有当 `allowedUserIds` 包含 `"*"` 时，`dmPolicy: "open"` 才允许公开私信；如果包含限制性条目，则只有匹配用户可以聊天。`open` 搭配空的 `allowedUserIds` 列表也会拒绝启动路由。
- `dmPolicy: "disabled"` 会阻止私信。
- 默认情况下，回复收件人绑定保持在稳定的数字 `user_id` 上。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是破窗兼容模式，会为回复投递重新启用可变用户名/昵称查找。

## 出站投递

使用数字 Synology Chat 用户 ID 作为目标。接受 `synology-chat:`、`synology_chat:` 和 `synology:` 前缀。

示例：

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

出站文本会按 2000 个字符分块。媒体发送通过基于 URL 的文件投递支持：NAS 会下载并附加文件（最大 32 MB）。出站文件 URL 必须使用 `http` 或 `https`，私有或其他被阻止的网络目标会在 OpenClaw 将 URL 转发到 NAS 网络钩子之前被拒绝。

## 多账户

`channels.synology-chat.accounts` 下支持多个 Synology Chat 账户。
每个账户都可以覆盖令牌、入站 URL、网络钩子路径、私信策略和限制。
私信会话按账户和用户隔离，因此两个不同 Synology 账户上的相同数字 `user_id`
不会共享转录状态。
为每个启用的账户提供不同的 `webhookPath`。OpenClaw 会拒绝重复的完全相同路径，
并拒绝启动在多账户设置中仅继承共享网络钩子路径的命名账户。
如果你有意需要命名账户的旧版继承，请在该账户或 `channels.synology-chat`
上设置 `dangerouslyAllowInheritedWebhookPath: true`，
但重复的完全相同路径仍会按失败关闭拒绝。优先使用显式的按账户路径。

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

- 保持 `token` 机密；如果泄露，请轮换它。
- 除非你明确信任自签名本地 NAS 证书，否则保持 `allowInsecureSsl: false`。
- 入站网络钩子请求会按令牌验证，并按发送者限速（`rateLimitPerMinute`，默认 30）。
- 无效令牌检查使用常量时间密钥比较并按失败关闭处理；重复的无效令牌尝试会临时锁定源 IP。
- 入站消息文本会针对已知提示注入模式进行清理，并截断到 4000 个字符。
- 生产环境优先使用 `dmPolicy: "allowlist"`。
- 除非你明确需要基于旧版用户名的回复投递，否则保持关闭 `dangerouslyAllowNameMatching`。
- 除非你明确接受多账户设置中的共享路径路由风险，否则保持关闭 `dangerouslyAllowInheritedWebhookPath`。

## 故障排查

- `Missing required fields (token, user_id, text)`：
  - 出站网络钩子载荷缺少某个必填字段
  - 如果 Synology 在请求头中发送令牌，请确保网关/代理保留这些请求头
- `Invalid token`：
  - 出站网络钩子密钥与 `channels.synology-chat.token` 不匹配
  - 请求命中了错误的账户/网络钩子路径
  - 反向代理在请求到达 OpenClaw 之前剥离了令牌请求头
- `Rate limit exceeded`：
  - 来自同一来源的无效令牌尝试过多会临时锁定该来源
  - 已通过身份验证的发送者还会有单独的按用户消息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`：
  - 已启用 `dmPolicy="allowlist"`，但未配置用户
- `User not authorized`：
  - 发送者的数字 `user_id` 不在 `allowedUserIds` 中

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
