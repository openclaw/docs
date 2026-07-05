---
read_when:
    - 设置 Mattermost
    - 调试 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost 机器人设置和 OpenClaw 配置
title: Mattermost
x-i18n:
    generated_at: "2026-07-05T11:03:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a1e8c4688bcddbee15d64b388b24bfb03a3890fe05f98fbb47bb904f4a0bc29
    source_path: channels/mattermost.md
    workflow: 16
---

状态：可下载插件（Bot 令牌 + WebSocket 事件）。支持频道、私有频道、群组私信和私信。Mattermost 是一个可自托管的团队消息平台（[mattermost.com](https://mattermost.com)）。

## 安装

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
  <Step title="Ensure plugin is available">
    使用上面的命令安装 `@openclaw/mattermost`，然后如果 Gateway 网关已经在运行，请重启它。
  </Step>
  <Step title="Create a Mattermost bot">
    创建一个 Mattermost Bot 账号，复制 **Bot 令牌**，并将 Bot 添加到它应读取的团队和频道。
  </Step>
  <Step title="Copy the base URL">
    复制 Mattermost **基础 URL**（例如 `https://chat.example.com`）。末尾的 `/api/v4` 会自动剥离。
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

    非交互式替代方式：

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
位于私有/LAN/tailnet 地址上的自托管 Mattermost：出站 Mattermost API 请求会通过 SSRF 防护，默认阻止私有和内部 IP。使用 `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` 选择启用（按账号：`channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## 原生斜杠命令

原生斜杠命令需要选择启用。启用后，OpenClaw 会在 Bot 所属的每个团队中注册 `oc_*` 斜杠命令，并在 Gateway 网关 HTTP 服务器上接收回调 POST。

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

已注册的命令：`/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。使用 `nativeSkills: true` 时，技能命令也会注册为 `/oc_<skill>`。

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native` 和 `nativeSkills` 默认为 `"auto"`，对于 Mattermost 会解析为禁用。请显式将它们设置为 `true`。
    - `callbackPath` 默认为 `/api/channels/mattermost/command`。
    - 如果省略 `callbackUrl`，OpenClaw 会派生 `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`。通配符绑定主机（`0.0.0.0`、`::`）会回退到 `localhost`。
    - 对于多账号设置，`commands` 可以设置在顶层，也可以设置在 `channels.mattermost.accounts.<id>.commands` 下（账号值会覆盖顶层字段）。
    - 其他集成创建的同触发器现有斜杠命令会保持不变（注册会跳过它们）；Bot 创建的命令会在回调 URL 偏移时更新或重新创建。
    - 命令回调会使用 Mattermost 在 OpenClaw 注册 `oc_*` 命令时返回的每命令令牌进行验证。
    - OpenClaw 会在接受每个回调前刷新当前 Mattermost 命令注册，因此来自已删除或重新生成的斜杠命令的过期令牌会在无需重启 Gateway 网关的情况下停止被接受。
    - 如果 Mattermost API 无法确认命令仍是当前命令，回调验证会失败并关闭；失败的验证会短暂缓存，并发查找会合并，并且新的查找启动会按命令限速，以限制重放压力。
    - 当注册失败、启动不完整，或回调令牌与解析出的命令注册令牌不匹配时，斜杠回调会失败并关闭（对一个命令有效的令牌无法对另一个命令进入上游验证）。
    - 已接受的回调会用一条临时的 “Processing...” 回复确认；真正的答案会作为普通消息到达。

  </Accordion>
  <Accordion title="Reachability requirement">
    回调端点必须可从 Mattermost 服务器访问。

    - 不要将 `callbackUrl` 设置为 `localhost`，除非 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间中。
    - 不要将 `callbackUrl` 设置为你的 Mattermost 基础 URL，除非该 URL 将 `/api/channels/mattermost/command` 反向代理到 OpenClaw。
    - 快速检查是 `curl https://<gateway-host>/api/channels/mattermost/command`；GET 应返回来自 OpenClaw 的 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    如果你的回调目标是私有/tailnet/内部地址，请将 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` 设置为包含该回调主机/域名。

    使用主机/域名条目，而不是完整 URL。

    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 环境变量（默认账号）

如果你偏好环境变量，请在 Gateway 网关主机上设置这些变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
环境变量仅适用于**默认**账号（`default`）。其他账号必须使用配置值。

`MATTERMOST_URL` 不能从工作区 `.env` 设置；请参阅[工作区 .env 文件](/zh-CN/gateway/security)。
</Note>

## 聊天模式

Mattermost 会自动响应私信。频道行为由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall (default)">
    仅在频道中被 @提及时响应。
  </Tab>
  <Tab title="onmessage">
    响应每条频道消息。
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
      oncharPrefixes: [">", "!"], // default
    },
  },
}
```

说明：

- `onchar` 仍会响应显式 @提及。
- `channels.mattermost.requireMention` 仍会被遵守，但优先使用 `chatmode`。按频道设置的 `groups.<channelId>.requireMention` 会优先于两者。
- Bot 在频道线程中发送可见回复后，同一线程中的后续消息会在没有新的 @提及或 `onchar` 前缀的情况下得到回答，因此多轮线程对话会持续流转。参与状态会在 Bot 最后一次回复该线程后保留 7 天，并且在 Gateway 网关重启后仍会保留。Bot 仅观察过的线程不受影响；发送新的顶层消息会再次要求显式提及。

## 线程和会话

使用 `channels.mattermost.replyToMode` 控制频道和群组回复是留在主频道中，还是在触发帖下开启线程。

- `off`（默认）：仅当入站帖子已经在线程中时，才在线程中回复。
- `first`：对于顶层频道/群组帖子，在该帖子下开启线程，并将对话路由到线程范围的会话。
- `all` 和 `batched`：目前在 Mattermost 中与 `first` 行为相同，因为一旦 Mattermost 有了线程根，后续分块和媒体会继续留在同一线程中。
- 私信会忽略此设置，并保持非线程化。

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

线程范围的会话使用触发帖 ID 作为线程根。

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会获得配对码）。其他值：`allowlist`、`open`、`disabled`。
- 通过以下方式批准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加 `channels.mattermost.allowFrom=["*"]`（配置 schema 会强制通配符）。
- `channels.mattermost.allowFrom` 接受用户 ID（推荐）和 `accessGroup:<name>` 条目。请参阅[访问组](/zh-CN/channels/access-groups)。

## 频道（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（需要提及）。
- 使用 `channels.mattermost.groupAllowFrom` 设置发送者允许列表（推荐用户 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 条目。请参阅[访问组](/zh-CN/channels/access-groups)。
- 按频道提及覆盖位于 `channels.mattermost.groups.<channelId>.requireMention` 下，默认值可使用 `channels.mattermost.groups["*"].requireMention`。
- `@username` 匹配是可变的，并且仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放频道：`channels.mattermost.groupPolicy="open"`（需要提及）。
- 解析顺序：`channels.mattermost.groupPolicy`，然后是 `channels.defaults.groupPolicy`，然后是 `"allowlist"`。
- 运行时说明：如果完全缺少 `channels.mattermost` 区段，运行时会对群组检查失败并关闭到 `groupPolicy="allowlist"`（即使已设置 `channels.defaults.groupPolicy`），并记录一次性警告。

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

将这些目标格式与 `openclaw message send` 或 cron/webhooks 搭配使用：

| 目标                                | 投递到                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | 按 ID 指定的频道                                             |
| `channel:<name>` 或 `#channel-name` | 按名称指定的频道，会在 Bot 所属的团队中搜索                  |
| `user:<id>` 或 `mattermost:<id>`    | 与该用户的私信                                               |
| `@username`                         | 私信（用户名通过 Mattermost API 解析）                       |

出站发送每条消息最多支持一个附件；请将多个文件拆分为单独发送。

<Warning>
裸不透明 ID（如 `64ifufp...`）在 Mattermost 中是**有歧义的**（用户 ID 与频道 ID）。

OpenClaw 会**优先按用户**解析它们：

- 如果该 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 会通过 `/api/v4/channels/direct` 解析直接频道并发送**私信**。
- 否则，该 ID 会被视为**频道 ID**。

如果你需要确定性行为，请始终使用显式前缀（`user:<id>` / `channel:<id>`）。
</Warning>

## 私信频道重试

当 OpenClaw 发送到 Mattermost 私信目标且需要先解析直接频道时，默认会重试瞬时的直接频道创建失败。

使用 `channels.mattermost.dmChannelRetry` 为 Mattermost 插件全局调整该行为，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 为单个账号调整。默认值：

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

- 这仅适用于私信频道创建（`/api/v4/channels/direct`），不适用于每个 Mattermost API 调用。
- 重试使用带抖动的指数退避，并适用于瞬时失败，例如速率限制、5xx 响应，以及网络或超时错误。
- 除 `429` 以外的 4xx 客户端错误会被视为永久错误，不会重试。

## 预览流式传输

Mattermost 会将思考过程、工具活动和部分回复文本流式传输到单个**草稿预览帖子**中，并在最终答案可以安全发送时就地定稿。预览会更新同一个帖子 id，而不是用逐块消息刷屏频道。媒体/错误终稿会取消待处理的预览编辑，并改用普通投递，而不是刷新一个一次性预览帖子。

预览流式传输在 `partial` 模式下**默认开启**。通过 `channels.mattermost.streaming` 配置（模式字符串、布尔值，或类似 `{ mode: "progress" }` 的对象）：

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
    - `partial`（默认）：一个预览帖子会随着回复增长而被编辑，然后以完整答案定稿。
    - `block` 在预览帖子内使用追加式草稿块。
    - `progress` 在生成期间显示状态预览，并且只在完成时发布最终答案。
    - `off` 禁用预览流式传输。

  </Accordion>
  <Accordion title="流式传输行为说明">
    - 如果流无法就地定稿（例如帖子在流式传输中途被删除），OpenClaw 会回退为发送新的最终帖子，确保回复不会丢失。
    - 仅思考的载荷会从频道帖子中抑制，包括作为 `> Thinking` 块引用到达的文本。设置 `/reasoning on` 可在其他界面查看思考内容；Mattermost 最终帖子只保留答案。
    - 请参阅 [流式传输](/zh-CN/concepts/streaming#preview-streaming-modes) 了解频道映射矩阵。

  </Accordion>
</AccordionGroup>

## 表情回应（消息工具）

- 使用 `message action=react` 并设置 `channel=mattermost`。
- `messageId` 是 Mattermost 帖子 id。
- `emoji` 接受类似 `thumbsup` 或 `:+1:` 的名称（冒号可选）。
- 设置 `remove=true`（布尔值）以移除表情回应。
- 表情回应添加/移除事件会作为系统事件转发到路由后的智能体会话，并受与消息相同的私信/群组策略检查约束。

示例：

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用表情回应操作（默认 true）。
- 按账号覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互式按钮（消息工具）

发送带可点击按钮的消息。当用户点击按钮时，智能体会收到该选择并可以响应。

按钮来自语义化 `presentation` 载荷（在普通智能体回复和 `message action=send` 中）。OpenClaw 会将值按钮渲染为 Mattermost 交互式按钮，在消息文本中保持 URL 按钮可见，并将选择菜单降级为可读文本。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

呈现按钮字段：

<ParamField path="label" type="string" required>
  显示标签（别名：`text`）。
</ParamField>
<ParamField path="value" type="string">
  点击时发回的值，用作操作 ID（别名：`callback_data`、`callbackData`）。除非设置了 `url`，否则可点击按钮必须提供该字段。
</ParamField>
<ParamField path="url" type="string">
  链接按钮；在消息正文中渲染为 `label: url` 文本，而不是交互式按钮。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  按钮样式。Mattermost 会对不支持的值应用默认样式。
</ParamField>

要在智能体系统提示中声明按钮支持，请将 `inlineButtons` 添加到频道能力：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

当用户点击按钮时：

<Steps>
  <Step title="访问检查">
    点击者必须通过与消息发送者相同的私信/群组策略检查；未授权点击会收到临时通知并被忽略。
  </Step>
  <Step title="按钮替换为确认信息">
    所有按钮都会被替换为确认行（例如：“✓ **Yes** selected by @user”）。
  </Step>
  <Step title="智能体收到选择">
    智能体会将该选择作为入站消息（外加一个系统事件）收到并响应。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="实现说明">
    - 按钮回调使用 HMAC-SHA256 验证（自动完成，无需配置）。
    - 点击后会替换整个附件块，因此所有按钮会一起移除，无法部分移除。
    - 包含连字符或下划线的操作 ID 会自动清理（Mattermost 路由限制）。
    - 如果点击的 `action_id` 与原始帖子上的操作不匹配，会以 `403`（“Unknown action”）拒绝。

  </Accordion>
  <Accordion title="配置和可达性">
    - `channels.mattermost.capabilities`：能力字符串数组。添加 `"inlineButtons"` 以在智能体系统提示中启用按钮工具描述。
    - `channels.mattermost.interactions.callbackBaseUrl`：按钮回调的可选外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接通过 Gateway 网关的绑定主机访问它时使用。
    - 在多账号设置中，你也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置同一字段。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 会从 `gateway.customBindHost` + `gateway.port`（默认 18789）派生回调 URL，然后回退到 `http://localhost:<port>`。回调路径为 `/mattermost/interactions/<accountId>`。
    - 可达性规则：按钮回调 URL 必须能从 Mattermost 服务器访问。`localhost` 只在 Mattermost 和 OpenClaw 运行于同一主机/网络命名空间时有效。
    - `channels.mattermost.interactions.allowedSourceIps`：按钮回调的源 IP 允许列表。如果没有设置，则只接受 loopback 来源（`127.0.0.1`、`::1`），因此远程 Mattermost 服务器必须在此加入允许列表，否则点击会以 `403` 拒绝。在反向代理后方时，还要设置 `gateway.trustedProxies`，以便从转发标头派生真实客户端 IP。
    - 如果你的回调目标是私有/tailnet/内部目标，请将其主机/域名添加到 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 集成（外部脚本）

外部脚本和 webhook 可以通过 Mattermost REST API 直接发布按钮，而不是经过智能体的 `message` 工具。尽可能使用插件中的 `buildButtonAttachments()`；如果发布原始 JSON，请遵循以下规则：

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
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
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
2. 每个操作都需要 `type: "button"`；没有它，点击会被静默吞掉。
3. 每个操作都需要 `id` 字段；Mattermost 会忽略没有 ID 的操作。
4. 操作 `id` 必须**只能包含字母数字**（`[a-zA-Z0-9]`）。连字符和下划线会破坏 Mattermost 的服务器端操作路由（返回 404）。使用前请移除它们。
5. `context.action_id` 必须匹配按钮的 `id`；如果点击的 `action_id` 在帖子上不存在，Gateway 网关会拒绝该点击。
6. `context.action_id` 是必需的；没有它时交互处理器会返回 400。
7. 回调源 IP 必须被允许（见上文 `interactions.allowedSourceIps`）。

</Warning>

**HMAC 令牌生成**

Gateway 网关使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 Gateway 网关验证逻辑匹配的令牌：

<Steps>
  <Step title="从 bot 令牌派生密钥">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`，十六进制编码。
  </Step>
  <Step title="构建上下文对象">
    构建包含除 `_token` 之外所有字段的上下文对象。
  </Step>
  <Step title="使用排序键序列化">
    使用**递归排序键**且**不含空格**进行序列化（Gateway 网关也会规范化嵌套对象并生成紧凑 JSON）。
  </Step>
  <Step title="签名载荷">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="添加令牌">
    将得到的十六进制摘要作为 `_token` 添加到上下文中。
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
    - 始终签名**所有**上下文字段（减去 `_token`）。Gateway 网关会移除 `_token`，然后签名剩余所有内容。只签名子集会导致静默验证失败。
    - 使用 `sort_keys=True`；Gateway 网关会在签名前排序键，Mattermost 在存储载荷时也可能重排上下文字段。
    - 从 bot 令牌派生密钥（确定性），不要使用随机字节。创建按钮的进程和验证按钮的 Gateway 网关必须使用相同密钥。

  </Accordion>
</AccordionGroup>

## 目录适配器

Mattermost 插件包含一个目录适配器，可通过 Mattermost API 解析频道和用户名。这会在 `openclaw message send` 以及 cron/webhook 投递中启用 `#channel-name` 和 `@username` 目标。

无需配置；该适配器会使用账号配置中的 bot 令牌。

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

账号值会覆盖顶层字段；`channels.mattermost.defaultAccount` 选择未指定账号时使用哪个账号。

## 故障排查

<AccordionGroup>
  <Accordion title="频道中没有回复">
    确保 bot 在频道中并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="认证或多账号错误">
    - 检查 bot 令牌、基础 URL，以及账号是否已启用。
    - 多账号问题：环境变量只应用于 `default` 账号。
    - 私有/LAN Mattermost 主机需要 `network.dangerouslyAllowPrivateNetwork: true`（SSRF 防护默认会阻止私有 IP）。

  </Accordion>
  <Accordion title="原生斜杠命令失败">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回调令牌。常见原因：
      - 斜杠命令注册在启动时失败或只完成了一部分
      - 回调打到了错误的 Gateway 网关/账号
      - Mattermost 仍有旧命令指向以前的回调目标
      - Gateway 网关重启后没有重新激活斜杠命令
    - 如果原生斜杠命令停止工作，请检查日志中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略了 `callbackUrl`，且日志警告回调解析到了类似 `http://localhost:18789/...` 的 loopback URL，那么该 URL 很可能只有在 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间时才可访问。请改为设置一个明确可从外部访问的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按钮问题">
    - 按钮显示为白色方框或完全不显示：按钮数据格式不正确。每个呈现按钮都需要一个 `label` 和一个 `value`（缺少任一项的按钮会被丢弃）。
    - 按钮能渲染但点击没有反应：确认 Mattermost 服务器可以访问 Gateway 网关、Mattermost 服务器 IP 已包含在 `channels.mattermost.interactions.allowedSourceIps` 中（未设置时只接受 loopback），并且 `ServiceSettings.AllowedUntrustedInternalConnections` 包含私有目标的回调主机。
    - 按钮点击后返回 404：按钮 `id` 可能包含连字符或下划线。Mattermost 的操作路由会在非字母数字 ID 上失效。请仅使用 `[a-zA-Z0-9]`。
    - Gateway 网关日志显示 `rejected callback source`：点击来自 `interactions.allowedSourceIps` 之外的 IP。请将 Mattermost 服务器或你的入口加入允许列表，并在反向代理后设置 `gateway.trustedProxies`。
    - Gateway 网关日志显示 `invalid _token`：HMAC 不匹配。检查你是否签名了所有上下文字段（而不是子集）、使用排序后的键，并使用紧凑 JSON（无空格）。请参阅上面的 HMAC 部分。
    - Gateway 网关日志显示 `missing _token in context`：按钮上下文中没有 `_token` 字段。构建集成载荷时确保包含该字段。
    - Gateway 网关以 `Unknown action` 拒绝点击：`context.action_id` 与帖子上的任何操作 `id` 都不匹配。请将二者设置为相同的清理后值。
    - Agent 未提供按钮：在 Mattermost 频道配置中添加 `capabilities: ["inlineButtons"]`。

  </Accordion>
</AccordionGroup>

## 相关

- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [渠道概览](/zh-CN/channels) - 所有受支持渠道
- [Groups](/zh-CN/channels/groups) - 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) - 私信认证和配对流程
- [Security](/zh-CN/gateway/security) - 访问模型和加固
