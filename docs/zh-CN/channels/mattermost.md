---
read_when:
    - 设置 Mattermost
    - 调试 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 机器人设置和 OpenClaw 配置
title: Mattermost
x-i18n:
    generated_at: "2026-05-01T15:14:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e83d7d4a1b60822f5efdb004fb28e26764b7cd70b3c78296b882d38d51241ae
    source_path: channels/mattermost.md
    workflow: 16
---

Status：内置插件（Bot 令牌 + WebSocket 事件）。支持渠道、群组和私信。Mattermost 是一个可自托管的团队消息平台；产品详情和下载请参见官方网站 [mattermost.com](https://mattermost.com)。

## 内置插件

<Note>
Mattermost 在当前 OpenClaw 版本中作为内置插件随附，因此普通打包构建不需要单独安装。
</Note>

如果你使用的是较旧构建，或排除了 Mattermost 的自定义安装，请在 npm 包发布后安装当前版本：

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

如果 npm 报告 OpenClaw 拥有的软件包已弃用，请使用当前打包的
OpenClaw 构建或本地检出路径，直到更新的 npm 包
发布。

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

<Steps>
  <Step title="确保插件可用">
    当前打包的 OpenClaw 版本已经内置该插件。较旧/自定义安装可以使用上面的命令手动添加。
  </Step>
  <Step title="创建 Mattermost Bot">
    创建一个 Mattermost Bot 账号并复制 **Bot 令牌**。
  </Step>
  <Step title="复制基础 URL">
    复制 Mattermost **基础 URL**（例如 `https://chat.example.com`）。
  </Step>
  <Step title="配置 OpenClaw 并启动 Gateway 网关">
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

  </Step>
</Steps>

## 原生斜杠命令

原生斜杠命令为可选启用。启用后，OpenClaw 会通过 Mattermost API 注册 `oc_*` 斜杠命令，并在 Gateway 网关 HTTP 服务器上接收回调 POST。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="行为说明">
    - `native: "auto"` 对 Mattermost 默认禁用。设置 `native: true` 以启用。
    - 如果省略 `callbackUrl`，OpenClaw 会从 Gateway 网关主机/端口 + `callbackPath` 派生一个。
    - 对于多账号设置，`commands` 可以设置在顶层，也可以设置在 `channels.mattermost.accounts.<id>.commands` 下（账号值会覆盖顶层字段）。
    - 命令回调会使用 Mattermost 在 OpenClaw 注册 `oc_*` 命令时返回的每命令令牌进行验证。
    - OpenClaw 会在接受每个回调前刷新当前 Mattermost 命令注册，因此已删除或重新生成的斜杠命令中的过期令牌无需重启 Gateway 网关就会停止被接受。
    - 如果 Mattermost API 无法确认该命令仍是当前命令，回调验证会失败关闭；失败的验证会短暂缓存，并发查找会合并，并且每个命令的新查找启动会被限速，以限制重放压力。
    - 当注册失败、启动部分完成，或回调令牌与解析到的命令的已注册令牌不匹配时，斜杠回调会失败关闭（对一个命令有效的令牌不能到达另一个命令的上游验证）。

  </Accordion>
  <Accordion title="可达性要求">
    回调端点必须能被 Mattermost 服务器访问。

    - 除非 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间中，否则不要将 `callbackUrl` 设置为 `localhost`。
    - 除非你的 Mattermost 基础 URL 将 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否则不要将 `callbackUrl` 设置为你的 Mattermost 基础 URL。
    - 一个快速检查是 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 应从 OpenClaw 返回 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 出站允许列表">
    如果你的回调目标是私有/tailnet/内部地址，请设置 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` 以包含回调主机/域名。

    使用主机/域名条目，而不是完整 URL。

    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 环境变量（默认账号）

如果你更偏好环境变量，请在 Gateway 网关主机上设置这些变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
环境变量仅适用于**默认**账号（`default`）。其他账号必须使用配置值。

`MATTERMOST_URL` 不能从工作区 `.env` 设置；请参见[工作区 `.env` 文件](/zh-CN/gateway/security)。
</Note>

## 聊天模式

Mattermost 会自动响应私信。渠道行为由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（默认）">
    仅在渠道中被 @提及时响应。
  </Tab>
  <Tab title="onmessage">
    响应每条渠道消息。
  </Tab>
  <Tab title="onchar">
    当消息以触发前缀开头时响应。
  </Tab>
</Tabs>

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

- `onchar` 仍会响应显式 @提及。
- 旧版配置会遵循 `channels.mattermost.requireMention`，但首选使用 `chatmode`。

## 线程和会话

使用 `channels.mattermost.replyToMode` 控制渠道和群组回复是留在主渠道中，还是在触发帖子下启动线程。

- `off`（默认）：仅当入站帖子已在线程中时，才在线程中回复。
- `first`：对于顶层渠道/群组帖子，在该帖子下启动线程，并将对话路由到线程范围的会话。
- `all`：目前对 Mattermost 来说行为与 `first` 相同。
- 私信会忽略此设置并保持非线程化。

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

- 线程范围的会话使用触发帖子 ID 作为线程根。
- `first` 和 `all` 当前等价，因为一旦 Mattermost 有了线程根，后续分块和媒体会继续留在同一线程中。

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会收到配对码）。
- 通过以下方式批准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。

## 渠道（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（受提及门控）。
- 使用 `channels.mattermost.groupAllowFrom` 允许发送者（建议使用用户 ID）。
- 每渠道提及覆盖位于 `channels.mattermost.groups.<channelId>.requireMention` 下，或用 `channels.mattermost.groups["*"].requireMention` 作为默认值。
- `@username` 匹配是可变的，并且仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放渠道：`channels.mattermost.groupPolicy="open"`（受提及门控）。
- 运行时说明：如果完全缺少 `channels.mattermost`，运行时会回退到 `groupPolicy="allowlist"` 进行群组检查（即使已设置 `channels.defaults.groupPolicy`）。

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

## 出站投递目标

将这些目标格式与 `openclaw message send` 或 cron/webhook 一起使用：

- `channel:<id>` 表示渠道
- `user:<id>` 表示私信
- `@username` 表示私信（通过 Mattermost API 解析）

<Warning>
裸露的不透明 ID（如 `64ifufp...`）在 Mattermost 中是**有歧义的**（用户 ID 与渠道 ID）。

OpenClaw 会按**用户优先**解析：

- 如果该 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 会通过 `/api/v4/channels/direct` 解析直接渠道并发送**私信**。
- 否则，该 ID 会被视为**渠道 ID**。

如果你需要确定性行为，请始终使用显式前缀（`user:<id>` / `channel:<id>`）。
</Warning>

## 私信渠道重试

当 OpenClaw 发送到 Mattermost 私信目标并需要先解析直接渠道时，它默认会重试瞬时的直接渠道创建失败。

使用 `channels.mattermost.dmChannelRetry` 为 Mattermost 插件全局调整该行为，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 为单个账号调整。

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

- 这仅适用于私信渠道创建（`/api/v4/channels/direct`），不适用于每个 Mattermost API 调用。
- 重试适用于瞬时故障，例如速率限制、5xx 响应，以及网络或超时错误。
- 除 `429` 之外的 4xx 客户端错误会被视为永久错误，不会重试。

## 预览流式传输

Mattermost 会将思考、工具活动和部分回复文本流式传输到单个**草稿预览帖子**中，并在最终答案可以安全发送时就地最终确定。预览会在同一个帖子 ID 上更新，而不是用逐块消息刷屏渠道。媒体/错误最终结果会取消待处理的预览编辑，并使用正常投递，而不是刷新一个一次性预览帖子。

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

<AccordionGroup>
  <Accordion title="流式传输模式">
    - `partial` 是通常选择：一个预览帖子会随着回复增长而编辑，然后用完整答案最终确定。
    - `block` 在预览帖子中使用追加样式的草稿分块。
    - `progress` 在生成期间显示状态预览，并且只在完成时发布最终答案。
    - `off` 禁用预览流式传输。

  </Accordion>
  <Accordion title="流式传输行为说明">
    - 如果流无法就地最终确定（例如帖子在流式传输中途被删除），OpenClaw 会回退为发送新的最终帖子，确保回复不会丢失。
    - 仅推理负载会从渠道帖子中抑制，包括作为 `> Reasoning:` 引用块到达的文本。设置 `/reasoning on` 可在其他表面查看思考；Mattermost 最终帖子只保留答案。
    - 请参见[流式传输](/zh-CN/concepts/streaming#preview-streaming-modes)了解渠道映射矩阵。

  </Accordion>
</AccordionGroup>

## 反应（消息工具）

- 使用 `message action=react` 并设置 `channel=mattermost`。
- `messageId` 是 Mattermost 帖子 ID。
- `emoji` 接受 `thumbsup` 或 `:+1:` 这样的名称（冒号可选）。
- 设置 `remove=true`（布尔值）以移除反应。
- 反应添加/移除事件会作为系统事件转发到路由的智能体会话。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用反应操作（默认 true）。
- 每账号覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互式按钮（消息工具）

发送带有可点击按钮的消息。当用户点击按钮时，智能体会收到选择并可以响应。

通过将 `inlineButtons` 添加到渠道能力来启用按钮：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用带 `buttons` 参数的 `message action=send`。按钮是二维数组（按钮行）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按钮字段：

<ParamField path="text" type="string" required>
  显示标签。
</ParamField>
<ParamField path="callback_data" type="string" required>
  点击时回传的值（用作操作 ID）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  按钮样式。
</ParamField>

当用户点击按钮时：

<Steps>
  <Step title="Buttons replaced with confirmation">
    所有按钮都会被替换为一行确认文本（例如，“✓ **Yes** selected by @user”）。
  </Step>
  <Step title="Agent receives the selection">
    智能体会将该选择作为入站消息接收并作出响应。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - 按钮回调使用 HMAC-SHA256 验证（自动完成，无需配置）。
    - Mattermost 会从其 API 响应中剥离回调数据（安全功能），因此点击后所有按钮都会被移除，无法部分移除。
    - 包含连字符或下划线的操作 ID 会自动清理（Mattermost 路由限制）。

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`：能力字符串数组。添加 `"inlineButtons"` 可在智能体系统提示词中启用按钮工具描述。
    - `channels.mattermost.interactions.callbackBaseUrl`：可选的外部基础 URL，用于按钮回调（例如 `https://gateway.example.com`）。当 Mattermost 无法直接通过 Gateway 网关的绑定主机访问它时使用此项。
    - 在多账号设置中，你也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置同一字段。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 会从 `gateway.customBindHost` + `gateway.port` 派生回调 URL，然后回退到 `http://localhost:<port>`。
    - 可达性规则：按钮回调 URL 必须能从 Mattermost 服务器访问。只有当 Mattermost 和 OpenClaw 在同一主机/网络命名空间上运行时，`localhost` 才有效。
    - 如果你的回调目标是私有/tailnet/内部地址，请将其主机/域名添加到 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 集成（外部脚本）

外部脚本和 webhook 可以通过 Mattermost REST API 直接发布按钮，而不是经过智能体的 `message` 工具。可行时使用插件中的 `buildButtonAttachments()`；如果发布原始 JSON，请遵循以下规则：

**载荷结构：**

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

<Warning>
**关键规则**

1. 附件应放在 `props.attachments` 中，而不是顶层 `attachments`（否则会被静默忽略）。
2. 每个操作都需要 `type: "button"`，否则点击会被静默吞掉。
3. 每个操作都需要 `id` 字段，Mattermost 会忽略没有 ID 的操作。
4. 操作 `id` 必须**仅包含字母数字字符**（`[a-zA-Z0-9]`）。连字符和下划线会破坏 Mattermost 的服务器端操作路由（返回 404）。使用前请移除它们。
5. `context.action_id` 必须与按钮的 `id` 匹配，这样确认消息才会显示按钮名称（例如，“Approve”），而不是原始 ID。
6. `context.action_id` 是必需的，缺少它时交互处理程序会返回 400。

</Warning>

**HMAC 令牌生成**

Gateway 网关使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 Gateway 网关验证逻辑匹配的令牌：

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    构建包含除 `_token` 之外所有字段的上下文对象。
  </Step>
  <Step title="Serialize with sorted keys">
    使用**排序后的键**并且**不包含空格**进行序列化（Gateway 网关使用带排序键的 `JSON.stringify`，会生成紧凑输出）。
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    将生成的十六进制摘要作为 `_token` 添加到上下文中。
  </Step>
</Steps>

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

<AccordionGroup>
  <Accordion title="Common HMAC pitfalls">
    - Python 的 `json.dumps` 默认会添加空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 以匹配 JavaScript 的紧凑输出（`{"key":"val"}`）。
    - 始终签名**所有**上下文字段（去掉 `_token`）。Gateway 网关会剥离 `_token`，然后对剩余所有内容签名。只签名子集会导致静默验证失败。
    - 使用 `sort_keys=True`，Gateway 网关会在签名前对键排序，Mattermost 在存储载荷时也可能重新排列上下文字段。
    - 从机器人令牌派生密钥（确定性），不要使用随机字节。创建按钮的进程和执行验证的 Gateway 网关必须使用相同的密钥。

  </Accordion>
</AccordionGroup>

## 目录适配器

Mattermost 插件包含一个目录适配器，可通过 Mattermost API 解析渠道和用户名称。这会在 `openclaw message send` 以及 cron/webhook 投递中启用 `#channel-name` 和 `@username` 目标。

无需配置，适配器会使用账号配置中的机器人令牌。

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

<AccordionGroup>
  <Accordion title="No replies in channels">
    确保机器人位于渠道中并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - 检查机器人令牌、基础 URL，以及该账号是否已启用。
    - 多账号问题：环境变量只会应用到 `default` 账号。

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回调令牌。典型原因包括：
      - slash command 注册失败，或启动时只部分完成
      - 回调命中了错误的 Gateway 网关/账号
      - Mattermost 仍有旧命令指向先前的回调目标
      - Gateway 网关重启后未重新激活 slash command
    - 如果原生 slash command 停止工作，请检查日志中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略 `callbackUrl`，并且日志警告回调解析为 `http://127.0.0.1:18789/...`，那么该 URL 很可能只有在 Mattermost 与 OpenClaw 运行于同一主机/网络命名空间时才可访问。请改为设置一个明确可从外部访问的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="Buttons issues">
    - 按钮显示为白色方框：智能体可能发送了格式错误的按钮数据。检查每个按钮是否同时包含 `text` 和 `callback_data` 字段。
    - 按钮可渲染但点击无反应：验证 Mattermost 服务器配置中的 `AllowedUntrustedInternalConnections` 是否包含 `127.0.0.1 localhost`，并且 ServiceSettings 中的 `EnablePostActionIntegration` 是否为 `true`。
    - 点击按钮返回 404：按钮 `id` 很可能包含连字符或下划线。Mattermost 的操作路由器在非字母数字 ID 上会失效。仅使用 `[a-zA-Z0-9]`。
    - Gateway 网关日志显示 `invalid _token`：HMAC 不匹配。检查是否签名了所有上下文字段（不是子集）、使用排序键，并使用紧凑 JSON（无空格）。参见上方 HMAC 部分。
    - Gateway 网关日志显示 `missing _token in context`：按钮上下文中没有 `_token` 字段。构建集成载荷时请确保包含它。
    - 确认消息显示原始 ID 而不是按钮名称：`context.action_id` 与按钮的 `id` 不匹配。将两者设置为相同的清理后值。
    - 智能体不知道按钮：将 `capabilities: ["inlineButtons"]` 添加到 Mattermost 渠道配置。

  </Accordion>
</AccordionGroup>

## 相关内容

- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [安全](/zh-CN/gateway/security) — 访问模型和加固
