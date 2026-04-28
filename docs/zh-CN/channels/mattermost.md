---
read_when:
    - 设置 Mattermost
    - 调试 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 机器人设置和 OpenClaw 配置
title: Mattermost
x-i18n:
    generated_at: "2026-04-28T11:45:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6d235f0880d879f1cf491a75bb15088be68c0bc27a97937120f88a2aaaee283
    source_path: channels/mattermost.md
    workflow: 16
---

Status：内置插件（机器人令牌 + WebSocket 事件）。支持渠道、群组和私信。Mattermost 是一个可自托管的团队消息平台；产品详情和下载请参阅官方网站 [mattermost.com](https://mattermost.com)。

## 内置插件

<Note>
Mattermost 在当前 OpenClaw 版本中作为内置插件提供，因此常规打包构建无需单独安装。
</Note>

如果你使用的是较旧的构建，或自定义安装中排除了 Mattermost，请手动安装：

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

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

<Steps>
  <Step title="确保插件可用">
    当前打包的 OpenClaw 版本已经内置它。较旧/自定义安装可以使用上面的命令手动添加。
  </Step>
  <Step title="创建 Mattermost 机器人">
    创建一个 Mattermost 机器人账号并复制 **机器人令牌**。
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

原生斜杠命令是可选启用的。启用后，OpenClaw 会通过 Mattermost API 注册 `oc_*` 斜杠命令，并在 Gateway 网关 HTTP 服务器上接收回调 POST。

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
    - 对于 Mattermost，`native: "auto"` 默认禁用。设置 `native: true` 以启用。
    - 如果省略 `callbackUrl`，OpenClaw 会从 Gateway 网关主机/端口 + `callbackPath` 派生一个。
    - 对于多账号设置，可以在顶层设置 `commands`，也可以在 `channels.mattermost.accounts.<id>.commands` 下设置（账号值会覆盖顶层字段）。
    - 命令回调会使用 OpenClaw 注册 `oc_*` 命令时 Mattermost 返回的每条命令令牌进行验证。
    - 当注册失败、启动不完整，或回调令牌与任何已注册命令都不匹配时，斜杠回调会安全失败。

  </Accordion>
  <Accordion title="可达性要求">
    回调端点必须能从 Mattermost 服务器访问。

    - 不要将 `callbackUrl` 设置为 `localhost`，除非 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间中。
    - 不要将 `callbackUrl` 设置为你的 Mattermost 基础 URL，除非该 URL 将 `/api/channels/mattermost/command` 反向代理到 OpenClaw。
    - 快速检查方法是 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 应从 OpenClaw 返回 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 出站允许列表">
    如果你的回调目标是私有/tailnet/内部地址，请设置 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`，使其包含回调主机/域名。

    使用主机/域名条目，不要使用完整 URL。

    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 环境变量（默认账号）

如果你更喜欢使用环境变量，请在 Gateway 网关主机上设置这些变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
环境变量只适用于**默认**账号（`default`）。其他账号必须使用配置值。

`MATTERMOST_URL` 不能从工作区 `.env` 设置；请参阅[工作区 `.env` 文件](/zh-CN/gateway/security)。
</Note>

## 聊天模式

Mattermost 会自动响应私信。渠道行为由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall (default)">
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

- `onchar` 仍会响应明确的 @提及。
- 旧版配置仍支持 `channels.mattermost.requireMention`，但推荐使用 `chatmode`。

## 线程和会话

使用 `channels.mattermost.replyToMode` 控制渠道和群组回复是保留在主渠道中，还是在触发帖子下开启线程。

- `off`（默认）：仅当入站帖子已经在线程中时，才在线程中回复。
- `first`：对于顶层渠道/群组帖子，在该帖子下开启线程，并将对话路由到线程作用域的会话。
- `all`：目前在 Mattermost 中与 `first` 行为相同。
- 直接消息会忽略此设置，并保持非线程形式。

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

- 线程作用域会话使用触发帖子 ID 作为线程根。
- `first` 和 `all` 目前等价，因为一旦 Mattermost 有了线程根，后续分块和媒体会继续留在同一线程中。

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会收到配对码）。
- 通过以下命令批准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加 `channels.mattermost.allowFrom=["*"]`。

## 渠道（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（需要提及）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入允许列表（建议使用用户 ID）。
- 按渠道的提及覆盖项位于 `channels.mattermost.groups.<channelId>.requireMention` 下，或使用 `channels.mattermost.groups["*"].requireMention` 作为默认值。
- `@username` 匹配是可变的，并且仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放渠道：`channels.mattermost.groupPolicy="open"`（需要提及）。
- 运行时说明：如果完全缺少 `channels.mattermost`，运行时会回退到 `groupPolicy="allowlist"` 来进行群组检查（即使设置了 `channels.defaults.groupPolicy`）。

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
裸不透明 ID（如 `64ifufp...`）在 Mattermost 中是**有歧义的**（用户 ID 与渠道 ID）。

OpenClaw 会按**用户优先**解析它们：

- 如果该 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 会通过 `/api/v4/channels/direct` 解析直接渠道并发送**私信**。
- 否则，该 ID 会被视为**渠道 ID**。

如果你需要确定性行为，请始终使用显式前缀（`user:<id>` / `channel:<id>`）。
</Warning>

## 私信渠道重试

当 OpenClaw 向 Mattermost 私信目标发送消息并需要先解析直接渠道时，它默认会重试临时性的直接渠道创建失败。

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

- 这仅适用于私信渠道创建（`/api/v4/channels/direct`），不适用于每一次 Mattermost API 调用。
- 重试适用于临时失败，例如速率限制、5xx 响应，以及网络或超时错误。
- 除 `429` 外的 4xx 客户端错误会被视为永久错误，不会重试。

## 预览流式传输

Mattermost 会将思考、工具活动和部分回复文本流式传输到单个**草稿预览帖子**中，并在最终答案可以安全发送时就地完成。预览会在同一个帖子 ID 上更新，而不是用逐块消息刷屏。媒体/错误最终结果会取消待处理的预览编辑，并使用常规投递，而不是刷新一个一次性的预览帖子。

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
    - `partial` 是通常选择：一个预览帖子会随着回复增长而被编辑，然后用完整答案完成。
    - `block` 在预览帖子内使用追加式草稿分块。
    - `progress` 在生成期间显示状态预览，并且只在完成时发布最终答案。
    - `off` 禁用预览流式传输。

  </Accordion>
  <Accordion title="流式传输行为说明">
    - 如果无法就地完成流（例如帖子在流中途被删除），OpenClaw 会回退为发送新的最终帖子，确保回复不会丢失。
    - 仅推理载荷会从渠道帖子中抑制，包括作为 `> Reasoning:` 块引用到达的文本。设置 `/reasoning on` 可以在其他界面查看思考过程；Mattermost 的最终帖子只保留答案。
    - 请参阅[流式传输](/zh-CN/concepts/streaming#preview-streaming-modes)了解渠道映射矩阵。

  </Accordion>
</AccordionGroup>

## 表情反应（消息工具）

- 使用 `message action=react`，并设置 `channel=mattermost`。
- `messageId` 是 Mattermost 帖子 ID。
- `emoji` 接受 `thumbsup` 或 `:+1:` 这样的名称（冒号可选）。
- 设置 `remove=true`（布尔值）以移除表情反应。
- 表情反应添加/移除事件会作为系统事件转发到已路由的智能体会话。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用表情反应操作（默认 true）。
- 按账号覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互式按钮（消息工具）

发送带有可点击按钮的消息。当用户点击按钮时，智能体会收到所选项并可以响应。

通过向渠道能力添加 `inlineButtons` 来启用按钮：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用 `message action=send` 并带上 `buttons` 参数。按钮是二维数组（按钮行）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按钮字段：

<ParamField path="text" type="string" required>
  显示标签。
</ParamField>
<ParamField path="callback_data" type="string" required>
  点击时发回的值（用作操作 ID）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  按钮样式。
</ParamField>

当用户点击按钮时：

<Steps>
  <Step title="按钮替换为确认信息">
    所有按钮都会替换为一行确认信息（例如，“✓ **Yes** selected by @user”）。
  </Step>
  <Step title="智能体接收选择">
    智能体会将该选择作为入站消息接收并响应。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="实现说明">
    - 按钮回调使用 HMAC-SHA256 验证（自动处理，无需配置）。
    - Mattermost 会从其 API 响应中去除回调数据（安全功能），因此点击时会移除所有按钮，无法进行部分移除。
    - 包含连字符或下划线的操作 ID 会自动清理（Mattermost 路由限制）。

  </Accordion>
  <Accordion title="配置和可达性">
    - `channels.mattermost.capabilities`：能力字符串数组。添加 `"inlineButtons"` 可在智能体系统提示中启用按钮工具描述。
    - `channels.mattermost.interactions.callbackBaseUrl`：可选的按钮回调外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接通过 Gateway 网关的绑定主机访问它时使用。
    - 在多账户设置中，你也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置相同字段。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 会从 `gateway.customBindHost` + `gateway.port` 派生回调 URL，然后回退到 `http://localhost:<port>`。
    - 可达性规则：按钮回调 URL 必须能从 Mattermost 服务器访问。只有当 Mattermost 和 OpenClaw 在同一主机/网络命名空间上运行时，`localhost` 才有效。
    - 如果你的回调目标是私有/tailnet/内部地址，请将其主机/域名添加到 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 集成（外部脚本）

外部脚本和 webhook 可以通过 Mattermost REST API 直接发布按钮，而不是通过智能体的 `message` 工具。尽可能使用插件中的 `buildButtonAttachments()`；如果发布原始 JSON，请遵循以下规则：

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

1. 附件放在 `props.attachments` 中，而不是顶层 `attachments`（否则会被静默忽略）。
2. 每个操作都需要 `type: "button"`，否则点击会被静默吞掉。
3. 每个操作都需要 `id` 字段，Mattermost 会忽略没有 ID 的操作。
4. 操作 `id` 必须**仅包含字母数字字符**（`[a-zA-Z0-9]`）。连字符和下划线会破坏 Mattermost 的服务端操作路由（返回 404）。使用前请移除它们。
5. `context.action_id` 必须匹配按钮的 `id`，这样确认消息会显示按钮名称（例如“Approve”），而不是原始 ID。
6. `context.action_id` 是必需的；没有它时交互处理程序会返回 400。

</Warning>

**HMAC 令牌生成**

Gateway 网关使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 Gateway 网关验证逻辑匹配的令牌：

<Steps>
  <Step title="从机器人令牌派生密钥">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="构建上下文对象">
    使用除 `_token` 之外的所有字段构建上下文对象。
  </Step>
  <Step title="使用排序键序列化">
    使用**排序键**且**无空格**进行序列化（Gateway 网关使用带排序键的 `JSON.stringify`，会产生紧凑输出）。
  </Step>
  <Step title="签名载荷">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="添加令牌">
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
  <Accordion title="常见 HMAC 陷阱">
    - Python 的 `json.dumps` 默认会添加空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 以匹配 JavaScript 的紧凑输出（`{"key":"val"}`）。
    - 始终签名**所有**上下文字段（减去 `_token`）。Gateway 网关会移除 `_token`，然后签名剩余的所有内容。只签名子集会导致静默验证失败。
    - 使用 `sort_keys=True`，因为 Gateway 网关会在签名前对键排序，而且 Mattermost 在存储载荷时可能会重新排序上下文字段。
    - 从机器人令牌派生密钥（确定性），不要使用随机字节。创建按钮的进程和执行验证的 Gateway 网关必须使用相同密钥。

  </Accordion>
</AccordionGroup>

## 目录适配器

Mattermost 插件包含一个目录适配器，可通过 Mattermost API 解析渠道和用户名。这允许在 `openclaw message send` 以及 cron/webhook 投递中使用 `#channel-name` 和 `@username` 目标。

无需配置，适配器会使用账户配置中的机器人令牌。

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
    确保机器人在该渠道中，并提及它（oncall）、使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="认证或多账户错误">
    - 检查机器人令牌、基础 URL，以及账户是否已启用。
    - 多账户问题：环境变量只适用于 `default` 账户。

  </Accordion>
  <Accordion title="原生斜杠命令失败">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回调令牌。典型原因包括：
      - 斜杠命令注册在启动时失败或仅部分完成
      - 回调命中了错误的 Gateway 网关/账户
      - Mattermost 仍有旧命令指向之前的回调目标
      - Gateway 网关重启后没有重新激活斜杠命令
    - 如果原生斜杠命令停止工作，请检查日志中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略 `callbackUrl`，且日志警告回调解析为 `http://127.0.0.1:18789/...`，该 URL 很可能只有当 Mattermost 与 OpenClaw 在同一主机/网络命名空间运行时才可达。请改为设置显式的外部可达 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按钮问题">
    - 按钮显示为空白框：智能体可能正在发送格式错误的按钮数据。检查每个按钮是否同时具有 `text` 和 `callback_data` 字段。
    - 按钮可以渲染但点击无效：确认 Mattermost 服务器配置中的 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，且 ServiceSettings 中的 `EnablePostActionIntegration` 为 `true`。
    - 点击按钮返回 404：按钮 `id` 很可能包含连字符或下划线。Mattermost 的操作路由器在非字母数字 ID 上会失效。仅使用 `[a-zA-Z0-9]`。
    - Gateway 网关日志显示 `invalid _token`：HMAC 不匹配。检查你是否签名了所有上下文字段（而不是子集）、使用了排序键，并使用了紧凑 JSON（无空格）。请参阅上面的 HMAC 部分。
    - Gateway 网关日志显示 `missing _token in context`：按钮上下文中没有 `_token` 字段。构建集成载荷时请确保包含该字段。
    - 确认信息显示原始 ID 而不是按钮名称：`context.action_id` 与按钮的 `id` 不匹配。将两者设置为相同的清理后值。
    - 智能体不知道按钮：将 `capabilities: ["inlineButtons"]` 添加到 Mattermost 渠道配置。

  </Accordion>
</AccordionGroup>

## 相关内容

- [渠道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) — 私信认证和配对流程
- [安全](/zh-CN/gateway/security) — 访问模型和加固
