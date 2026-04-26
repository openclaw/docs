---
read_when:
    - 设置 Mattermost
    - 调试 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 机器人设置和 OpenClaw 配置
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T08:13:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Status：内置插件（bot token + WebSocket 事件）。支持渠道、群组和私信。Mattermost 是一个可自托管的团队消息平台；产品详情和下载请参见官方网站 [mattermost.com](https://mattermost.com)。

## 内置插件

<Note>
Mattermost 在当前的 OpenClaw 版本中作为内置插件提供，因此常规打包构建不需要单独安装。
</Note>

如果你使用的是较旧版本，或排除了 Mattermost 的自定义安装，请手动安装：

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

详情： [Plugins](/zh-CN/tools/plugin)

## 快速设置

<Steps>
  <Step title="确保插件可用">
    当前打包的 OpenClaw 版本已内置该插件。较旧版本或自定义安装可使用上面的命令手动添加。
  </Step>
  <Step title="创建 Mattermost 机器人">
    创建一个 Mattermost 机器人账户，并复制 **bot token**。
  </Step>
  <Step title="复制基础 URL">
    复制 Mattermost 的 **base URL**（例如 `https://chat.example.com`）。
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

原生斜杠命令为可选启用。启用后，OpenClaw 会通过 Mattermost API 注册 `oc_*` 斜杠命令，并在 Gateway 网关 HTTP 服务器上接收回调 `POST` 请求。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 当 Mattermost 无法直接访问 Gateway 网关时使用（反向代理/公共 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="行为说明">
    - `native: "auto"` 对 Mattermost 默认禁用。设置 `native: true` 以启用。
    - 如果省略 `callbackUrl`，OpenClaw 会根据 Gateway 网关的 host/port 和 `callbackPath` 推导出一个地址。
    - 对于多账户设置，`commands` 可以设置在顶层，也可以设置在 `channels.mattermost.accounts.<id>.commands` 下（账户级值会覆盖顶层字段）。
    - 命令回调会使用 OpenClaw 注册 `oc_*` 命令时 Mattermost 返回的每命令 token 进行校验。
    - 当注册失败、启动不完整，或回调 token 与已注册命令都不匹配时，斜杠命令回调会以失败关闭方式处理。
  </Accordion>
  <Accordion title="可达性要求">
    回调端点必须可从 Mattermost 服务器访问。

    - 除非 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间中，否则不要将 `callbackUrl` 设置为 `localhost`。
    - 除非该 URL 会将 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否则不要将 `callbackUrl` 设置为你的 Mattermost 基础 URL。
    - 一个快速检查方法是运行 `curl https://<gateway-host>/api/channels/mattermost/command`；`GET` 应返回来自 OpenClaw 的 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 出站访问允许列表">
    如果你的回调目标是私有地址、tailnet 地址或内部地址，请将 Mattermost 的 `ServiceSettings.AllowedUntrustedInternalConnections` 设置为包含该回调 host/domain。

    使用 host/domain 条目，而不是完整 URL。

    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 环境变量（默认账户）

如果你更喜欢使用环境变量，请在 Gateway 网关主机上设置：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
环境变量仅适用于 **default** 账户（`default`）。其他账户必须使用配置值。

`MATTERMOST_URL` 不能通过工作区 `.env` 设置；请参见 [Workspace `.env` files](/zh-CN/gateway/security)。
</Note>

## 聊天模式

Mattermost 会自动响应私信。渠道行为由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall (default)">
    仅在渠道中被 @提及时响应。
  </Tab>
  <Tab title="onmessage">
    响应每一条渠道消息。
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

- `onchar` 仍会响应显式的 @提及。
- `channels.mattermost.requireMention` 会继续兼容旧配置，但更推荐使用 `chatmode`。

## 线程和会话

使用 `channels.mattermost.replyToMode` 控制渠道和群组回复是保留在主渠道中，还是在触发消息下开启线程。

- `off`（默认）：仅当传入消息本身已经在线程中时，才在线程中回复。
- `first`：对于渠道/群组中的顶层消息，在该消息下开启线程，并将对话路由到线程作用域的会话。
- `all`：当前在 Mattermost 中与 `first` 行为相同。
- 私信会忽略此设置，并保持非线程模式。

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

- 线程作用域的会话使用触发消息的 post id 作为线程根。
- `first` 和 `all` 当前等价，因为一旦 Mattermost 已有线程根，后续分块和媒体内容都会继续发送到同一线程。

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会收到配对码）。
- 通过以下命令批准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。

## 渠道（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（提及门控）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入允许列表（推荐使用用户 ID）。
- 每个渠道的提及覆盖配置位于 `channels.mattermost.groups.<channelId>.requireMention`，或者使用 `channels.mattermost.groups["*"].requireMention` 作为默认值。
- `@username` 匹配是可变的，且仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 公开渠道：`channels.mattermost.groupPolicy="open"`（提及门控）。
- 运行时说明：如果 `channels.mattermost` 完全缺失，运行时在群组检查中会回退为 `groupPolicy="allowlist"`（即使已设置 `channels.defaults.groupPolicy` 也是如此）。

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

将以下目标格式与 `openclaw message send` 或 cron/webhooks 一起使用：

- `channel:<id>` 表示一个渠道
- `user:<id>` 表示一个私信
- `@username` 表示一个私信（通过 Mattermost API 解析）

<Warning>
裸的不透明 ID（如 `64ifufp...`）在 Mattermost 中是 **有歧义的**（用户 ID 或渠道 ID）。

OpenClaw 会按 **优先用户** 的顺序解析：

- 如果该 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 会先通过 `/api/v4/channels/direct` 解析直连渠道，然后发送 **私信**。
- 否则，该 ID 会被视为 **渠道 ID**。

如果你需要确定性行为，请始终使用显式前缀（`user:<id>` / `channel:<id>`）。
</Warning>

## 私信渠道重试

当 OpenClaw 向 Mattermost 私信目标发送消息，且需要先解析直连渠道时，默认会重试临时性的直连渠道创建失败。

使用 `channels.mattermost.dmChannelRetry` 可为 Mattermost 插件全局调整该行为，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 只为某个账户调整。

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

- 这仅适用于私信渠道创建（`/api/v4/channels/direct`），并不适用于每一次 Mattermost API 调用。
- 重试适用于限流、5xx 响应，以及网络或超时错误等临时性失败。
- 除 `429` 外的 4xx 客户端错误会被视为永久性错误，不会重试。

## 预览流式传输

Mattermost 会将思考过程、工具活动和部分回复文本流式写入单个 **草稿预览消息**，并在最终答案可安全发送时原地完成定稿。预览会在同一个 post id 上更新，而不是通过逐块消息刷屏。媒体/错误类型的最终消息会取消待处理的预览编辑，并改用常规投递，而不是刷新一个无用的预览消息。

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
    - `partial` 是常见选择：一个预览消息会随着回复增长而被编辑，最后用完整答案定稿。
    - `block` 在预览消息中使用追加式草稿分块。
    - `progress` 在生成期间显示状态预览，并仅在完成时发送最终答案。
    - `off` 会禁用预览流式传输。
  </Accordion>
  <Accordion title="流式传输行为说明">
    - 如果流无法原地定稿（例如消息在流过程中被删除），OpenClaw 会回退为发送一条新的最终消息，因此回复不会丢失。
    - 纯推理负载不会显示在渠道消息中，包括以 `> Reasoning:` 引述块形式到达的文本。设置 `/reasoning on` 可在其他界面中查看思考过程；Mattermost 的最终消息只保留答案。
    - 渠道映射矩阵请参见 [Streaming](/zh-CN/concepts/streaming#preview-streaming-modes)。
  </Accordion>
</AccordionGroup>

## 表情回应（消息工具）

- 使用 `message action=react`，并设置 `channel=mattermost`。
- `messageId` 是 Mattermost 的 post id。
- `emoji` 接受如 `thumbsup` 或 `:+1:` 之类的名称（冒号可选）。
- 设置 `remove=true`（布尔值）可移除一个回应。
- 添加/移除表情回应事件会作为系统事件转发到已路由的智能体会话。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用表情回应操作（默认 true）。
- 每账户覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互式按钮（消息工具）

发送带可点击按钮的消息。当用户点击按钮时，智能体会收到所选内容并可作出响应。

通过在渠道能力中添加 `inlineButtons` 来启用按钮：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用 `message action=send` 并带上 `buttons` 参数。按钮是一个二维数组（按钮行）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按钮字段：

<ParamField path="text" type="string" required>
  显示标签。
</ParamField>
<ParamField path="callback_data" type="string" required>
  点击后回传的值（用作动作 ID）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  按钮样式。
</ParamField>

当用户点击按钮时：

<Steps>
  <Step title="按钮会被替换为确认信息">
    所有按钮都会被替换为一行确认文本（例如：“✓ **Yes** selected by @user”）。
  </Step>
  <Step title="智能体接收所选内容">
    智能体会将该选择作为一条入站消息接收，并作出响应。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="实现说明">
    - 按钮回调使用 HMAC-SHA256 校验（自动完成，无需配置）。
    - Mattermost 会从其 API 响应中移除回调数据（安全特性），因此按钮在点击后都会被移除——无法只移除部分按钮。
    - 包含连字符或下划线的动作 ID 会被自动净化处理（Mattermost 路由限制）。
  </Accordion>
  <Accordion title="配置和可达性">
    - `channels.mattermost.capabilities`：能力字符串数组。添加 `"inlineButtons"` 可在智能体系统提示词中启用按钮工具描述。
    - `channels.mattermost.interactions.callbackBaseUrl`：按钮回调可选的外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接访问 Gateway 网关绑定的 host 时使用此项。
    - 在多账户设置中，你也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置相同字段。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 会根据 `gateway.customBindHost` + `gateway.port` 推导回调 URL，然后回退到 `http://localhost:<port>`。
    - 可达性规则：按钮回调 URL 必须可从 Mattermost 服务器访问。只有当 Mattermost 和 OpenClaw 运行在同一主机/网络命名空间中时，`localhost` 才可用。
    - 如果你的回调目标是私有地址、tailnet 地址或内部地址，请将其 host/domain 添加到 Mattermost 的 `ServiceSettings.AllowedUntrustedInternalConnections` 中。
  </Accordion>
</AccordionGroup>

### 直接 API 集成（外部脚本）

外部脚本和 webhooks 可以直接通过 Mattermost REST API 发送按钮，而不必经过智能体的 `message` 工具。尽量使用插件中的 `buildButtonAttachments()`；如果直接发送原始 JSON，请遵循以下规则：

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
            type: "button", // 必填，否则点击会被静默忽略
            name: "Approve", // 显示标签
            style: "primary", // 可选："default"、"primary"、"danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // 必须与按钮 id 一致（用于名称查找）
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // 见下方 HMAC 小节
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

1. attachments 放在 `props.attachments` 中，而不是顶层 `attachments`（否则会被静默忽略）。
2. 每个动作都需要 `type: "button"` —— 没有它，点击会被静默吞掉。
3. 每个动作都需要 `id` 字段 —— 没有 ID 的动作会被 Mattermost 忽略。
4. 动作 `id` 必须 **仅包含字母数字**（`[a-zA-Z0-9]`）。连字符和下划线会破坏 Mattermost 服务端动作路由（返回 404）。使用前请先移除它们。
5. `context.action_id` 必须与按钮的 `id` 一致，这样确认消息才会显示按钮名称（例如 “Approve”），而不是原始 ID。
6. `context.action_id` 是必填项 —— 没有它，交互处理器会返回 400。
   </Warning>

**HMAC token 生成**

Gateway 网关使用 HMAC-SHA256 校验按钮点击。外部脚本必须生成与 Gateway 网关校验逻辑一致的 token：

<Steps>
  <Step title="从 bot token 派生 secret">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="构建 context 对象">
    构建包含除 `_token` 之外所有字段的 context 对象。
  </Step>
  <Step title="按已排序的键序列化">
    使用 **已排序的键** 且 **不带空格** 进行序列化（Gateway 网关使用带排序键的 `JSON.stringify`，输出为紧凑格式）。
  </Step>
  <Step title="对负载签名">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="添加 token">
    将生成的十六进制摘要作为 `_token` 添加到 context 中。
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
  <Accordion title="常见 HMAC 陷阱">
    - Python 的 `json.dumps` 默认会添加空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 以匹配 JavaScript 的紧凑输出（`{"key":"val"}`）。
    - 始终对 **所有** context 字段（除 `_token` 外）进行签名。Gateway 网关会先移除 `_token`，然后对剩余全部字段签名。只签名子集会导致静默校验失败。
    - 使用 `sort_keys=True` —— Gateway 网关会在签名前对键排序，而 Mattermost 在存储负载时可能会重排 context 字段。
    - 应从 bot token 派生 secret（确定性），而不是使用随机字节。创建按钮的进程和负责校验的 Gateway 网关必须使用相同的 secret。
  </Accordion>
</AccordionGroup>

## 目录适配器

Mattermost 插件包含一个目录适配器，可通过 Mattermost API 解析渠道名和用户名。这使得在 `openclaw message send` 和 cron/webhook 投递中可以使用 `#channel-name` 和 `@username` 目标。

无需配置——该适配器会使用账户配置中的 bot token。

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

<AccordionGroup>
  <Accordion title="渠道中没有回复">
    确保机器人已加入该渠道，并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="身份验证或多账户错误">
    - 检查 bot token、base URL，以及账户是否已启用。
    - 多账户问题：环境变量仅适用于 `default` 账户。
  </Accordion>
  <Accordion title="原生斜杠命令失败">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受该回调 token。常见原因：
      - 斜杠命令注册失败，或启动时仅部分完成
      - 回调命中了错误的 Gateway 网关/账户
      - Mattermost 仍保留指向旧回调目标的旧命令
      - Gateway 网关重启后未重新激活斜杠命令
    - 如果原生斜杠命令停止工作，请检查日志中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略了 `callbackUrl`，且日志警告回调被解析为 `http://127.0.0.1:18789/...`，那么该 URL 很可能只有在 Mattermost 与 OpenClaw 运行于同一主机/网络命名空间时才可访问。请改为设置一个显式、外部可访问的 `commands.callbackUrl`。
  </Accordion>
  <Accordion title="按钮问题">
    - 按钮显示为白框：智能体可能发送了格式错误的按钮数据。检查每个按钮是否都同时包含 `text` 和 `callback_data` 字段。
    - 按钮已渲染，但点击无反应：请确认 Mattermost 服务器配置中的 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，并且 `ServiceSettings` 中的 `EnablePostActionIntegration` 为 `true`。
    - 点击按钮返回 404：按钮的 `id` 很可能包含连字符或下划线。Mattermost 的动作路由器无法处理非字母数字 ID。请仅使用 `[a-zA-Z0-9]`。
    - Gateway 网关日志出现 `invalid _token`：HMAC 不匹配。请检查你是否对所有 context 字段（而不是子集）进行了签名，是否使用了已排序的键，以及是否使用了紧凑 JSON（无空格）。参见上方 HMAC 小节。
    - Gateway 网关日志出现 `missing _token in context`：按钮的 context 中没有 `_token` 字段。请确保在构建 integration 负载时包含该字段。
    - 确认信息显示原始 ID 而不是按钮名称：`context.action_id` 与按钮的 `id` 不匹配。请将二者设置为相同的净化值。
    - 智能体不了解按钮：请在 Mattermost 渠道配置中添加 `capabilities: ["inlineButtons"]`。
  </Accordion>
</AccordionGroup>

## 相关内容

- [Channel Routing](/zh-CN/channels/channel-routing) — 消息的会话路由
- [Channels Overview](/zh-CN/channels) — 所有受支持的渠道
- [Groups](/zh-CN/channels/groups) — 群聊行为和提及门控
- [Pairing](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [Security](/zh-CN/gateway/security) — 访问模型和加固措施
