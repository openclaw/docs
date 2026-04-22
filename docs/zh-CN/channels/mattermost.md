---
read_when:
    - 设置 Mattermost
    - 调试 Mattermost 路由
summary: Mattermost 机器人设置和 OpenClaw 配置
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T01:34:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

状态：内置插件（bot token + WebSocket 事件）。支持渠道、群组和私信。
Mattermost 是一个可自托管的团队消息平台；产品详情和下载请参见官方站点
[mattermost.com](https://mattermost.com)。

## 内置插件

Mattermost 在当前的 OpenClaw 版本中作为内置插件提供，因此常规打包构建无需单独安装。

如果你使用的是较旧版本，或是不包含 Mattermost 的自定义安装，
请手动安装：

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/mattermost
```

本地 checkout（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

详情： [Plugins](/zh-CN/tools/plugin)

## 快速设置

1. 确保 Mattermost 插件可用。
   - 当前打包发布的 OpenClaw 版本已内置该插件。
   - 较旧版本 / 自定义安装可使用上面的命令手动添加。
2. 创建一个 Mattermost bot 账户，并复制 **bot token**。
3. 复制 Mattermost **base URL**（例如 `https://chat.example.com`）。
4. 配置 OpenClaw 并启动 Gateway 网关。

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

原生斜杠命令为可选启用。启用后，OpenClaw 会通过
Mattermost API 注册 `oc_*` 斜杠命令，并在 Gateway 网关 HTTP 服务器上接收回调 POST 请求。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 当 Mattermost 无法直接访问 Gateway 网关时使用（反向代理 / 公网 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

说明：

- `native: "auto"` 对 Mattermost 默认为禁用。设置 `native: true` 以启用。
- 如果省略 `callbackUrl`，OpenClaw 会根据 Gateway 网关 host / port 和 `callbackPath` 自动推导。
- 对于多账户配置，`commands` 可以设置在顶层，也可以设置在
  `channels.mattermost.accounts.<id>.commands` 下（账户级值会覆盖顶层字段）。
- 命令回调会使用 Mattermost 在 OpenClaw 注册 `oc_*` 命令时返回的每命令 token 进行校验。
- 当注册失败、启动不完整，或回调 token 与任一已注册命令都不匹配时，
  斜杠命令回调会以失败关闭方式拒绝处理。
- 可达性要求：回调端点必须可从 Mattermost 服务器访问。
  - 除非 Mattermost 与 OpenClaw 运行在同一主机 / 网络命名空间中，否则不要将 `callbackUrl` 设置为 `localhost`。
  - 除非该 URL 会将 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否则不要将 `callbackUrl` 设置为你的 Mattermost base URL。
  - 一个快速检查方法是运行 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 请求应返回来自 OpenClaw 的 `405 Method Not Allowed`，而不是 `404`。
- Mattermost 出站允许列表要求：
  - 如果你的回调目标是私有地址 / tailnet / 内网地址，请设置 Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` 以包含回调 host / domain。
  - 使用 host / domain 条目，而不是完整 URL。
    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

## 环境变量（默认账户）

如果你更倾向于使用环境变量，请在 Gateway 网关主机上设置以下内容：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

环境变量仅适用于 **默认** 账户（`default`）。其他账户必须使用配置值。

## 聊天模式

Mattermost 会自动响应私信。渠道行为由 `chatmode` 控制：

- `oncall`（默认）：仅在渠道中被 @提及时响应。
- `onmessage`：响应每条渠道消息。
- `onchar`：当消息以触发前缀开头时响应。

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

- `onchar` 仍会响应显式的 @提及。
- `channels.mattermost.requireMention` 仍会兼容旧版配置，但更推荐使用 `chatmode`。

## 线程与会话

使用 `channels.mattermost.replyToMode` 来控制渠道和群组回复是保留在主渠道中，
还是在触发消息下启动一个线程。

- `off`（默认）：仅当传入消息本身已经在线程中时，才在线程中回复。
- `first`：对于渠道 / 群组中的顶层消息，在该消息下启动线程，并将对话路由到一个线程作用域的会话。
- `all`：在当前 Mattermost 中，其行为与 `first` 相同。
- 私信会忽略该设置，并保持非线程模式。

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

- 线程作用域会话使用触发消息的 post id 作为线程根节点。
- `first` 和 `all` 当前等价，因为一旦 Mattermost 已经有线程根节点，
  后续分块和媒体内容都会继续发送到同一线程中。

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会收到一个配对码）。
- 通过以下命令批准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加 `channels.mattermost.allowFrom=["*"]`。

## 渠道（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（受提及门控）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入允许列表（推荐使用用户 ID）。
- 每渠道提及覆盖项位于 `channels.mattermost.groups.<channelId>.requireMention`
  或 `channels.mattermost.groups["*"].requireMention`（作为默认值）。
- `@username` 匹配是可变的，且仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放渠道：`channels.mattermost.groupPolicy="open"`（受提及门控）。
- 运行时说明：如果完全缺少 `channels.mattermost`，运行时在进行群组检查时会回退为 `groupPolicy="allowlist"`（即使已设置 `channels.defaults.groupPolicy` 也是如此）。

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

## 出站投递的 target 格式

在 `openclaw message send` 或 cron / webhook 中使用以下 target 格式：

- `channel:<id>` 表示渠道
- `user:<id>` 表示私信
- `@username` 表示私信（通过 Mattermost API 解析）

裸的不透明 ID（如 `64ifufp...`）在 Mattermost 中是 **有歧义的**
（可能是用户 ID，也可能是渠道 ID）。

OpenClaw 会按 **用户优先** 进行解析：

- 如果该 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 会通过 `/api/v4/channels/direct` 解析直连渠道并发送 **私信**。
- 否则，该 ID 会被视为 **渠道 ID**。

如果你需要确定性的行为，请始终使用显式前缀（`user:<id>` / `channel:<id>`）。

## 私信渠道重试

当 OpenClaw 向 Mattermost 私信 target 发送消息且需要先解析直连渠道时，
默认会对瞬时性的直连渠道创建失败进行重试。

使用 `channels.mattermost.dmChannelRetry` 可全局调整 Mattermost 插件的此行为，
或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 为某个账户单独设置。

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

- 这仅适用于私信渠道创建（`/api/v4/channels/direct`），而不是每一次 Mattermost API 调用。
- 重试适用于限流、5xx 响应，以及网络或超时错误等瞬时性失败。
- 除 `429` 之外的 4xx 客户端错误会被视为永久性错误，不会重试。

## 预览流式传输

Mattermost 会将思考内容、工具活动和部分回复文本流式写入同一个**草稿预览消息**，当最终答案可以安全发送时，会原地完成定稿。预览会在同一个 post id 上更新，而不会用逐块消息刷屏。媒体 / 错误类最终结果会取消待处理的预览编辑，并改用常规投递，而不是刷新一个临时的预览消息。

通过 `channels.mattermost.streaming` 启用：

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

说明：

- `partial` 是通常的选择：使用一条预览消息，随着回复增长不断编辑，最后以完整答案定稿。
- `block` 会在预览消息内使用追加式草稿分块。
- `progress` 会在生成期间显示状态预览，并仅在完成时发布最终答案。
- `off` 会禁用预览流式传输。
- 如果流无法原地定稿（例如消息在流过程中被删除），OpenClaw 会回退为发送一条新的最终消息，以确保回复不会丢失。
- 参见 [Streaming](/zh-CN/concepts/streaming#preview-streaming-modes) 了解渠道映射矩阵。

## Reactions（消息工具）

- 使用 `message action=react`，并设置 `channel=mattermost`。
- `messageId` 是 Mattermost 的 post id。
- `emoji` 接受如 `thumbsup` 或 `:+1:` 这样的名称（冒号可选）。
- 设置 `remove=true`（布尔值）可移除一个 reaction。
- Reaction 添加 / 移除事件会作为系统事件转发到已路由的智能体会话。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用 / 禁用 reaction 操作（默认 true）。
- 每账户覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互式按钮（消息工具）

发送带有可点击按钮的消息。当用户点击按钮时，智能体会收到该选择，
并可以作出响应。

通过将 `inlineButtons` 添加到渠道能力中来启用按钮：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用 `message action=send` 并提供 `buttons` 参数。按钮为二维数组（按钮行）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按钮字段：

- `text`（必填）：显示标签。
- `callback_data`（必填）：点击后回传的值（作为 action ID 使用）。
- `style`（可选）：`"default"`、`"primary"` 或 `"danger"`。

当用户点击按钮时：

1. 所有按钮都会被替换为一行确认文本（例如，“✓ **Yes** selected by @user”）。
2. 智能体会将该选择作为一条传入消息接收，并作出响应。

说明：

- 按钮回调使用 HMAC-SHA256 校验（自动完成，无需配置）。
- Mattermost 会从其 API 响应中剥离回调数据（安全特性），因此点击后所有按钮
  都会被移除——无法实现部分移除。
- 包含连字符或下划线的 action ID 会被自动清理
  （Mattermost 路由限制）。

配置：

- `channels.mattermost.capabilities`：能力字符串数组。添加 `"inlineButtons"` 以在智能体系统提示中启用按钮工具说明。
- `channels.mattermost.interactions.callbackBaseUrl`：按钮回调的可选外部基础 URL
  （例如 `https://gateway.example.com`）。当 Mattermost 无法直接通过 Gateway 网关绑定的 host 访问时，请使用此项。
- 在多账户配置中，你也可以在
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置相同字段。
- 如果省略 `interactions.callbackBaseUrl`，OpenClaw 会根据
  `gateway.customBindHost` + `gateway.port` 推导回调 URL，然后回退到 `http://localhost:<port>`。
- 可达性规则：按钮回调 URL 必须可从 Mattermost 服务器访问。
  `localhost` 仅在 Mattermost 和 OpenClaw 运行在同一主机 / 网络命名空间时有效。
- 如果你的回调目标是私有地址 / tailnet / 内网地址，请将其 host / domain 添加到 Mattermost 的
  `ServiceSettings.AllowedUntrustedInternalConnections`。

### 直接 API 集成（外部脚本）

外部脚本和 webhook 可以直接通过 Mattermost REST API 发送按钮，
而不必经过智能体的 `message` 工具。尽可能使用扩展中的 `buildButtonAttachments()`；如果发送原始 JSON，请遵循以下规则：

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
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
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

1. Attachments 应放在 `props.attachments` 中，而不是顶层 `attachments`（否则会被静默忽略）。
2. 每个 action 都需要 `type: "button"` —— 缺少它时，点击会被静默吞掉。
3. 每个 action 都需要一个 `id` 字段 —— 没有 ID 的 action 会被 Mattermost 忽略。
4. Action `id` 必须是**仅字母数字**（`[a-zA-Z0-9]`）。连字符和下划线会破坏
   Mattermost 服务端的 action 路由（返回 404）。使用前请将它们移除。
5. `context.action_id` 必须与按钮的 `id` 一致，这样确认消息才会显示按钮名称
   （例如 “Approve”），而不是原始 ID。
6. `context.action_id` 是必填项 —— 没有它，交互处理器会返回 400。

**HMAC token 生成：**

Gateway 网关使用 HMAC-SHA256 校验按钮点击。外部脚本必须生成
与 Gateway 网关校验逻辑一致的 token：

1. 从 bot token 派生 secret：
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. 构建 context 对象，包含除 `_token` 之外的所有字段。
3. 使用**排序后的键**和**无空格**进行序列化（Gateway 网关使用
   带排序键的 `JSON.stringify`，会产生紧凑输出）。
4. 签名：`HMAC-SHA256(key=secret, data=serializedContext)`
5. 将得到的十六进制摘要作为 `_token` 加入 context。

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
- 始终对**所有** context 字段（不含 `_token`）进行签名。Gateway 网关会先移除 `_token`，
  然后对剩余所有内容签名。只签名子集会导致静默校验失败。
- 使用 `sort_keys=True` —— Gateway 网关在签名前会对键排序，而 Mattermost 在存储负载时
  可能会重排 context 字段。
- 从 bot token 派生 secret（确定性），而不是使用随机字节。创建按钮的进程与负责校验的 Gateway 网关
  必须使用相同的 secret。

## 目录适配器

Mattermost 插件包含一个目录适配器，可通过 Mattermost API 解析渠道名和用户名。
这样就能在 `openclaw message send` 和 cron / webhook 投递中使用
`#channel-name` 和 `@username` 作为 target。

无需配置 —— 该适配器会使用账户配置中的 bot token。

## 多账户

Mattermost 支持在 `channels.mattermost.accounts` 下配置多个账户：

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

- 渠道中没有回复：确认 bot 已加入该渠道，并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
- 认证错误：检查 bot token、base URL，以及账户是否已启用。
- 多账户问题：环境变量仅适用于 `default` 账户。
- 原生斜杠命令返回 `Unauthorized: invalid command token.`：OpenClaw
  未接受该回调 token。常见原因包括：
  - 斜杠命令注册在启动时失败，或仅部分完成
  - 回调打到了错误的 Gateway 网关 / 账户
  - Mattermost 仍保留指向旧回调目标的旧命令
  - Gateway 网关重启后未重新激活斜杠命令
- 如果原生斜杠命令停止工作，请检查日志中是否有
  `mattermost: failed to register slash commands` 或
  `mattermost: native slash commands enabled but no commands could be registered`。
- 如果省略了 `callbackUrl`，且日志警告回调被解析为
  `http://127.0.0.1:18789/...`，那么该 URL 很可能仅在
  Mattermost 与 OpenClaw 运行于同一主机 / 网络命名空间时可达。请改为显式设置一个外部可达的 `commands.callbackUrl`。
- 按钮显示为空白框：智能体可能发送了格式错误的按钮数据。检查每个按钮是否同时包含 `text` 和 `callback_data` 字段。
- 按钮能渲染但点击无效：确认 Mattermost 服务器配置中的 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，并且 `ServiceSettings` 中的 `EnablePostActionIntegration` 为 `true`。
- 按钮点击返回 404：按钮的 `id` 很可能包含连字符或下划线。Mattermost 的 action 路由器无法处理非字母数字 ID。仅使用 `[a-zA-Z0-9]`。
- Gateway 网关日志显示 `invalid _token`：HMAC 不匹配。请检查你是否对所有 context 字段签名（而不是子集）、使用了排序键，并使用紧凑 JSON（无空格）。参见上方 HMAC 部分。
- Gateway 网关日志显示 `missing _token in context`：按钮的 context 中缺少 `_token` 字段。构建集成负载时请确保包含它。
- 确认信息显示的是原始 ID 而不是按钮名称：`context.action_id` 与按钮的 `id` 不一致。请将二者设置为相同的清洗后值。
- 智能体不知道按钮功能：在 Mattermost 渠道配置中添加 `capabilities: ["inlineButtons"]`。

## 相关内容

- [Channels Overview](/zh-CN/channels) — 所有支持的渠道
- [Pairing](/zh-CN/channels/pairing) — 私信认证与配对流程
- [Groups](/zh-CN/channels/groups) — 群组聊天行为与提及门控
- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Security](/zh-CN/gateway/security) — 访问模型与加固
