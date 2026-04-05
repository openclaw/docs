---
read_when:
    - 设置 Mattermost
    - 调试 Mattermost 路由
summary: Mattermost 机器人设置和 OpenClaw 配置
title: Mattermost
x-i18n:
    generated_at: "2026-04-05T08:16:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21dc7543176fda0b38b00fab60f0daae38dffcf68fa1cf7930a9f14ec57cb5a
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

状态：内置插件（bot token + WebSocket 事件）。支持频道、群组和私信。
Mattermost 是一个可自行托管的团队消息平台；产品详情和下载请参见官网
[mattermost.com](https://mattermost.com)。

## 内置插件

Mattermost 在当前 OpenClaw 版本中作为内置插件提供，因此普通的打包构建不需要单独安装。

如果你使用的是较旧版本或排除了 Mattermost 的自定义安装，请手动安装：

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/mattermost
```

本地检出安装（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

详情参见：[插件](/tools/plugin)

## 快速设置

1. 确保 Mattermost 插件可用。
   - 当前打包的 OpenClaw 版本已内置该插件。
   - 较旧/自定义安装可使用上述命令手动添加。
2. 创建一个 Mattermost 机器人账号，并复制 **bot token**。
3. 复制 Mattermost 的 **base URL**（例如 `https://chat.example.com`）。
4. 配置 OpenClaw 并启动 gateway。

最小配置：

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## 原生斜杠命令

原生斜杠命令为可选启用。启用后，OpenClaw 会通过 Mattermost API 注册 `oc_*` 斜杠命令，并在 gateway HTTP 服务器上接收回调 POST 请求。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 当 Mattermost 无法直接访问 gateway 时使用（反向代理/公网 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

说明：

- `native: "auto"` 在 Mattermost 中默认是禁用的。设置 `native: true` 可启用。
- 如果省略 `callbackUrl`，OpenClaw 会根据 gateway host/port 和 `callbackPath` 推导一个地址。
- 对于多账号设置，`commands` 可设置在顶层，也可设置在
  `channels.mattermost.accounts.<id>.commands` 下（账号值会覆盖顶层字段）。
- 命令回调会使用 Mattermost 在 OpenClaw 注册 `oc_*` 命令时返回的逐命令 token 进行验证。
- 如果注册失败、启动不完整，或回调 token 与任一已注册命令都不匹配，斜杠回调会以失败即关闭方式处理。
- 可达性要求：Mattermost 服务器必须能够访问回调端点。
  - 除非 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间，否则不要把 `callbackUrl` 设为 `localhost`。
  - 除非该 URL 会将 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否则不要把 `callbackUrl` 设为你的 Mattermost base URL。
  - 一个快速检查方法是运行 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 应返回来自 OpenClaw 的 `405 Method Not Allowed`，而不是 `404`。
- Mattermost 出站 allowlist 要求：
  - 如果你的回调目标使用私有/tailnet/内部地址，请将回调 host/domain 加入 Mattermost 的
    `ServiceSettings.AllowedUntrustedInternalConnections`。
  - 使用 host/domain 条目，而不是完整 URL。
    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

## 环境变量（默认账号）

如果你更喜欢使用环境变量，请在 gateway 主机上设置以下变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

环境变量仅适用于**默认**账号（`default`）。其他账号必须使用配置值。

## 聊天模式

Mattermost 会自动回复私信。频道行为由 `chatmode` 控制：

- `oncall`（默认）：仅在频道中被 @ 提及时回复。
- `onmessage`：回复每一条频道消息。
- `onchar`：当消息以触发前缀开头时回复。

配置示例：

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

说明：

- `onchar` 仍会对显式 @ 提及进行回复。
- 对于旧配置，`channels.mattermost.requireMention` 仍会生效，但更推荐使用 `chatmode`。

## 线程与会话

使用 `channels.mattermost.replyToMode` 控制频道和群组回复是保留在主频道中，还是在触发消息下方开启一个线程。

- `off`（默认）：只有当入站消息本身已在线程中时，才在线程中回复。
- `first`：对于频道/群组中的顶层消息，在该消息下开启线程，并将对话路由到线程作用域的会话。
- `all`：对于当前 Mattermost，与 `first` 的行为相同。
- 私信会忽略此设置，并保持非线程化。

配置示例：

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

说明：

- 线程作用域的会话会使用触发消息的 post id 作为线程根。
- `first` 和 `all` 当前是等价的，因为一旦 Mattermost 有了线程根，后续的分块和媒体都会继续进入同一个线程。

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会收到配对码）。
- 批准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加 `channels.mattermost.allowFrom=["*"]`。

## 频道（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（提及门控）。
- 使用 `channels.mattermost.groupAllowFrom` 对发送者加入 allowlist（推荐使用用户 ID）。
- 按频道的提及覆盖位于 `channels.mattermost.groups.<channelId>.requireMention`
  或 `channels.mattermost.groups["*"].requireMention`（用作默认值）。
- `@username` 匹配是可变的，且仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放频道：`channels.mattermost.groupPolicy="open"`（提及门控）。
- 运行时说明：如果 `channels.mattermost` 完全缺失，运行时在进行群组检查时会回退到 `groupPolicy="allowlist"`（即使设置了 `channels.defaults.groupPolicy` 也是如此）。

示例：

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## 出站交付目标

将以下目标格式与 `openclaw message send` 或 cron/webhook 一起使用：

- `channel:<id>` 表示频道
- `user:<id>` 表示私信
- `@username` 表示私信（通过 Mattermost API 解析）

裸的不透明 ID（例如 `64ifufp...`）在 Mattermost 中是**有歧义的**（用户 ID 或频道 ID）。

OpenClaw 会按**用户优先**顺序解析：

- 如果该 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 会先通过 `/api/v4/channels/direct` 解析直连频道，然后发送**私信**。
- 否则，该 ID 会被视为**频道 ID**。

如果你需要确定性行为，请始终使用显式前缀（`user:<id>` / `channel:<id>`）。

## 私信频道重试

当 OpenClaw 向 Mattermost 私信目标发送消息且需要先解析直连频道时，默认会对瞬时的直连频道创建失败进行重试。

使用 `channels.mattermost.dmChannelRetry` 可为整个 Mattermost 插件全局调优此行为，
或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 为单个账号调优。

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

说明：

- 这仅适用于私信频道创建（`/api/v4/channels/direct`），而不是所有 Mattermost API 调用。
- 重试适用于限流、5xx 响应以及网络或超时错误等瞬时故障。
- 除 `429` 之外的 4xx 客户端错误会被视为永久性错误，不会重试。

## 表情回应（message 工具）

- 使用 `message action=react`，并设置 `channel=mattermost`。
- `messageId` 是 Mattermost 的 post id。
- `emoji` 接受 `thumbsup` 或 `:+1:` 这样的名称（冒号可选）。
- 设置 `remove=true`（boolean）可移除表情回应。
- 表情回应的添加/移除事件会作为系统事件转发到已路由的智能体会话。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用表情回应操作（默认 true）。
- 按账号覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互按钮（message 工具）

发送带可点击按钮的消息。用户点击按钮后，智能体会收到所选内容并作出响应。

通过将 `inlineButtons` 添加到渠道 capabilities 中来启用按钮：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用 `message action=send` 并附带 `buttons` 参数。按钮是二维数组（按钮行）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按钮字段：

- `text`（必需）：显示标签。
- `callback_data`（必需）：点击时回传的值（用作操作 ID）。
- `style`（可选）：`"default"`、`"primary"` 或 `"danger"`。

当用户点击按钮时：

1. 所有按钮都会被替换为一行确认信息（例如 “✓ **Yes** selected by @user”）。
2. 智能体会将该选择作为入站消息接收并作出回复。

说明：

- 按钮回调使用 HMAC-SHA256 验证（自动完成，无需配置）。
- Mattermost 会从其 API 响应中剥离 callback data（安全特性），因此按钮点击后会移除所有按钮——无法只部分移除。
- 包含连字符或下划线的操作 ID 会被自动清理
  （Mattermost 路由限制）。

配置：

- `channels.mattermost.capabilities`：能力字符串数组。添加 `"inlineButtons"` 以在智能体系统提示中启用按钮工具说明。
- `channels.mattermost.interactions.callbackBaseUrl`：按钮回调的可选外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接访问 gateway 绑定主机时使用。
- 在多账号设置中，你也可以在
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置同一字段。
- 如果省略 `interactions.callbackBaseUrl`，OpenClaw 会根据
  `gateway.customBindHost` + `gateway.port` 推导回调 URL，然后回退到 `http://localhost:<port>`。
- 可达性规则：按钮回调 URL 必须能被 Mattermost 服务器访问。
  只有当 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间时，`localhost` 才可用。
- 如果你的回调目标是私有/tailnet/内部地址，请将其 host/domain 添加到 Mattermost 的
  `ServiceSettings.AllowedUntrustedInternalConnections` 中。

### 直接 API 集成（外部脚本）

外部脚本和 webhook 可以直接通过 Mattermost REST API 发送按钮，而不是通过智能体的 `message` 工具。
尽可能使用扩展中的 `buildButtonAttachments()`；如果发送原始 JSON，请遵循以下规则：

**负载结构：**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 仅限字母数字 —— 见下文
            type: "button", // 必需，否则点击会被静默忽略
            name: "Approve", // 显示标签
            style: "primary", // 可选："default"、"primary"、"danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // 必须与按钮 id 匹配（用于名称查找）
                action: "approve",
                // ... 任意自定义字段 ...
                _token: "<hmac>", // 参见下方 HMAC 部分
              },
            },
          },
        ],
      },
    ],
  },
}
```

**关键规则：**

1. Attachments 要放在 `props.attachments` 中，而不是顶层 `attachments`（否则会被静默忽略）。
2. 每个 action 都需要 `type: "button"` —— 没有它，点击会被静默吞掉。
3. 每个 action 都需要 `id` 字段 —— Mattermost 会忽略没有 ID 的 action。
4. Action `id` 必须**仅包含字母数字**（`[a-zA-Z0-9]`）。连字符和下划线会破坏
   Mattermost 服务端的 action 路由（返回 404）。使用前请先移除它们。
5. `context.action_id` 必须与按钮的 `id` 匹配，这样确认消息才会显示按钮名称
   （例如 “Approve”），而不是原始 ID。
6. `context.action_id` 是必需的 —— 没有它，交互处理器会返回 400。

**HMAC token 生成：**

gateway 会使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 gateway 验证逻辑匹配的 token：

1. 从 bot token 派生密钥：
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. 构建包含所有字段但**不包含** `_token` 的 context 对象。
3. 使用**排序后的键**和**无空格**格式进行序列化（gateway 使用带排序键的 `JSON.stringify`，
   其输出是紧凑格式）。
4. 签名：`HMAC-SHA256(key=secret, data=serializedContext)`
5. 将生成的十六进制摘要作为 `_token` 添加到 context 中。

Python 示例：

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

常见 HMAC 陷阱：

- Python 的 `json.dumps` 默认会添加空格（`{"key": "val"}`）。请使用
  `separators=(",", ":")` 以匹配 JavaScript 的紧凑输出（`{"key":"val"}`）。
- 始终对**所有** context 字段（除 `_token` 外）进行签名。gateway 会先移除 `_token`，
  然后对剩余所有内容签名。只对部分字段签名会导致静默验证失败。
- 使用 `sort_keys=True` —— gateway 在签名前会对键排序，而 Mattermost 在存储负载时
  可能会重新排列 context 字段。
- 从 bot token 派生密钥（确定性），而不是使用随机字节。创建按钮的进程与执行验证的 gateway
  必须使用相同的密钥。

## 目录适配器

Mattermost 插件包含一个目录适配器，可通过 Mattermost API 解析频道名和用户名。
这使得你可以在 `openclaw message send` 和 cron/webhook 交付中使用 `#channel-name` 和 `@username` 目标。

无需额外配置——该适配器会使用账号配置中的 bot token。

## 多账号

Mattermost 支持在 `channels.mattermost.accounts` 下配置多个账号：

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## 故障排除

- 频道中没有回复：确保机器人已加入该频道，并 @ 提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
- 认证错误：检查 bot token、base URL，以及该账号是否已启用。
- 多账号问题：环境变量仅适用于 `default` 账号。
- 原生斜杠命令返回 `Unauthorized: invalid command token.`：OpenClaw
  未接受该回调 token。常见原因包括：
  - 斜杠命令注册失败，或启动时仅部分完成
  - 回调命中了错误的 gateway/账号
  - Mattermost 仍保留旧命令，指向之前的回调目标
  - gateway 重启后未重新激活斜杠命令
- 如果原生斜杠命令停止工作，请检查日志中是否有
  `mattermost: failed to register slash commands` 或
  `mattermost: native slash commands enabled but no commands could be registered`。
- 如果省略了 `callbackUrl` 且日志警告回调解析为
  `http://127.0.0.1:18789/...`，该 URL 很可能只有在
  Mattermost 与 OpenClaw 运行在同一主机/网络命名空间时才可访问。请改为显式设置一个外部可访问的 `commands.callbackUrl`。
- 按钮显示为空白方块：智能体发送的按钮数据可能格式不正确。请检查每个按钮是否同时包含 `text` 和 `callback_data` 字段。
- 按钮可以渲染但点击无反应：请验证 Mattermost 服务器配置中的 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，并且 `ServiceSettings` 中的 `EnablePostActionIntegration` 为 `true`。
- 点击按钮返回 404：按钮 `id` 很可能包含连字符或下划线。Mattermost 的 action 路由器在非字母数字 ID 上会失效。仅使用 `[a-zA-Z0-9]`。
- Gateway 网关日志显示 `invalid _token`：HMAC 不匹配。请检查是否对所有 context 字段（而非子集）进行了签名、使用了排序后的键，以及使用了紧凑 JSON（无空格）。参见上文 HMAC 部分。
- Gateway 网关日志显示 `missing _token in context`：按钮的 context 中没有 `_token` 字段。请确保在构建 integration 负载时包含它。
- 确认消息显示的是原始 ID 而不是按钮名称：`context.action_id` 与按钮的 `id` 不匹配。请将两者设置为同一个清理后的值。
- 智能体不了解按钮：在 Mattermost 渠道配置中添加 `capabilities: ["inlineButtons"]`。

## 相关

- [渠道概览](/channels) — 所有支持的渠道
- [配对](/channels/pairing) — 私信身份验证和配对流程
- [群组](/channels/groups) — 群聊行为和提及门控
- [渠道路由](/channels/channel-routing) — 消息的会话路由
- [安全性](/gateway/security) — 访问模型和加固
