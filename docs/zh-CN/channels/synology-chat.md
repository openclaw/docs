---
read_when:
    - 设置 Synology Chat 与 OpenClaw 配合使用
    - 调试 Synology Chat 网络钩子路由
summary: Synology Chat 网络钩子设置和 OpenClaw 配置
title: Synology Chat
x-i18n:
    generated_at: "2026-04-29T05:57:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Status：使用 Synology Chat webhook 的内置插件私信渠道。
该插件接受来自 Synology Chat outgoing webhook 的入站消息，并通过 Synology Chat incoming webhook 发送回复。

## 内置插件

Synology Chat 在当前 OpenClaw 版本中作为内置插件随附，因此正常的打包构建不需要单独安装。

如果你使用的是较旧构建，或排除了 Synology Chat 的自定义安装，请手动安装：

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

1. 确保 Synology Chat 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧/自定义安装可以使用上面的命令从源码检出手动添加。
   - `openclaw onboard` 现在会在与 `openclaw channels add` 相同的渠道设置列表中显示 Synology Chat。
   - 非交互式设置：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. 在 Synology Chat 集成中：
   - 创建一个 incoming webhook 并复制其 URL。
   - 使用你的 secret token 创建一个 outgoing webhook。
3. 将 outgoing webhook URL 指向你的 OpenClaw Gateway 网关：
   - 默认是 `https://gateway-host/webhook/synology`。
   - 或使用你的自定义 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成设置。
   - 引导式：`openclaw onboard`
   - 直接：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重启 Gateway 网关，并向 Synology Chat 机器人发送私信。

Webhook 认证详情：

- OpenClaw 会先从 `body.token` 接受 outgoing webhook token，然后是 `?token=...`，最后是 headers。
- 接受的 header 形式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空 token 或缺失 token 会失败关闭。

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

`SYNOLOGY_CHAT_INCOMING_URL` 不能从工作区 `.env` 设置；请参阅[工作区 `.env` 文件](/zh-CN/gateway/security)。

## 私信策略和访问控制

- `dmPolicy: "allowlist"` 是推荐的默认值。
- `allowedUserIds` 接受 Synology 用户 ID 列表（或逗号分隔字符串）。
- 在 `allowlist` 模式下，空的 `allowedUserIds` 列表会被视为配置错误，webhook 路由不会启动（如需允许所有用户，请使用 `dmPolicy: "open"` 与 `allowedUserIds: ["*"]`）。
- 只有当 `allowedUserIds` 包含 `"*"` 时，`dmPolicy: "open"` 才允许公开私信；如果是限制性条目，则只有匹配的用户可以聊天。
- `dmPolicy: "disabled"` 会阻止私信。
- 默认情况下，回复收件人绑定保持在稳定的数字 `user_id` 上。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是应急兼容模式，会重新启用可变用户名/昵称查找来投递回复。
- 配对批准可使用：
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 出站投递

使用数字 Synology Chat 用户 ID 作为目标。

示例：

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

支持通过基于 URL 的文件投递发送媒体。
出站文件 URL 必须使用 `http` 或 `https`，并且在 OpenClaw 将该 URL 转发到 NAS webhook 之前，会拒绝私有或其他被阻止的网络目标。

## 多账户

`channels.synology-chat.accounts` 下支持多个 Synology Chat 账户。
每个账户都可以覆盖 token、incoming URL、webhook path、私信策略和限制。
私信会话按账户和用户隔离，因此两个不同 Synology 账户上的相同数字 `user_id` 不会共享对话状态。
为每个已启用账户指定不同的 `webhookPath`。OpenClaw 现在会拒绝重复的精确路径，并且在多账户设置中会拒绝启动仅继承共享 webhook path 的命名账户。
如果你有意需要为某个命名账户使用旧版继承，请在该账户上或在 `channels.synology-chat` 设置 `dangerouslyAllowInheritedWebhookPath: true`，但重复的精确路径仍会失败关闭。优先使用显式的按账户路径。

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

- 保持 `token` 机密，如果泄露请轮换。
- 除非你明确信任自签名的本地 NAS 证书，否则保持 `allowInsecureSsl: false`。
- 入站 webhook 请求会按发送者进行 token 验证和限速。
- 无效 token 检查使用常量时间 secret 比较，并失败关闭。
- 生产环境优先使用 `dmPolicy: "allowlist"`。
- 除非你明确需要基于旧版用户名的回复投递，否则保持 `dangerouslyAllowNameMatching` 关闭。
- 除非你明确接受多账户设置中的共享路径路由风险，否则保持 `dangerouslyAllowInheritedWebhookPath` 关闭。

## 故障排除

- `Missing required fields (token, user_id, text)`：
  - outgoing webhook payload 缺少某个必填字段
  - 如果 Synology 通过 headers 发送 token，请确保 Gateway 网关/代理保留这些 headers
- `Invalid token`：
  - outgoing webhook secret 与 `channels.synology-chat.token` 不匹配
  - 请求命中了错误的账户/webhook path
  - 反向代理在请求到达 OpenClaw 之前剥离了 token header
- `Rate limit exceeded`：
  - 来自同一来源的无效 token 尝试过多，可能会暂时锁定该来源
  - 已认证发送者也有单独的按用户消息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`：
  - `dmPolicy="allowlist"` 已启用，但未配置用户
- `User not authorized`：
  - 发送者的数字 `user_id` 不在 `allowedUserIds` 中

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固
