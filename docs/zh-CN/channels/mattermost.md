---
read_when:
    - 设置 Mattermost
    - 调试 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost Bot 设置和 OpenClaw 配置
title: Mattermost
x-i18n:
    generated_at: "2026-07-11T20:20:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

状态：可下载插件（机器人令牌 + WebSocket 事件）。支持频道、私有频道、群组私信和私信。Mattermost 是一个可自托管的团队消息平台（[mattermost.com](https://mattermost.com)）。

## 安装

<Tabs>
  <Tab title="npm 注册表">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="本地检出">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

详情：[插件](/zh-CN/tools/plugin)

## 快速设置

<Steps>
  <Step title="确保插件可用">
    使用上面的命令安装 `@openclaw/mattermost`，如果 Gateway 网关已在运行，请重启它。
  </Step>
  <Step title="创建 Mattermost 机器人">
    创建一个 Mattermost 机器人账户，复制**机器人令牌**，并将机器人添加到它应读取的团队和频道。
  </Step>
  <Step title="复制基础 URL">
    复制 Mattermost 的**基础 URL**（例如 `https://chat.example.com`）。末尾的 `/api/v4` 会被自动移除。
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

    非交互式替代方案：

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
对于部署在私有/LAN/tailnet 地址上的自托管 Mattermost：出站 Mattermost API 请求会经过 SSRF 防护，默认阻止私有和内部 IP。可通过 `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` 选择启用（按账户配置：`channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## 原生斜杠命令

原生斜杠命令需要选择启用。启用后，OpenClaw 会在机器人所属的每个团队中注册 `oc_*` 斜杠命令，并通过 Gateway 网关 HTTP 服务器接收回调 POST 请求。

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

注册的命令：`/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。启用 `nativeSkills: true` 后，技能命令也会注册为 `/oc_<skill>`。

<AccordionGroup>
  <Accordion title="行为说明">
    - `native` 和 `nativeSkills` 默认为 `"auto"`，在 Mattermost 中会解析为禁用。请明确将它们设置为 `true`。
    - `callbackPath` 默认为 `/api/channels/mattermost/command`。
    - 如果省略 `callbackUrl`，OpenClaw 会推导出 `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`。通配符绑定主机（`0.0.0.0`、`::`）会回退到 `localhost`。
    - 对于多账户设置，可以在顶层或 `channels.mattermost.accounts.<id>.commands` 下设置 `commands`（账户值会覆盖顶层字段）。
    - 由其他集成创建且触发词相同的现有斜杠命令不会被修改（注册时会跳过）；当回调 URL 发生变化时，机器人创建的命令会被更新或重新创建。
    - 命令回调使用 OpenClaw 注册 `oc_*` 命令时 Mattermost 返回的各命令专用令牌进行验证。
    - OpenClaw 会在接受每次回调前刷新当前的 Mattermost 命令注册信息，因此已删除或重新生成的斜杠命令所对应的过期令牌无需重启 Gateway 网关便会停止被接受。
    - 如果 Mattermost API 无法确认命令仍为当前命令，回调验证会以失败关闭；失败的验证结果会被短暂缓存，并发查询会被合并，而且每个命令的新查询启动会受到速率限制，以约束重放压力。
    - 如果注册失败、启动未完整完成，或回调令牌与已解析命令的注册令牌不匹配，斜杠命令回调会以失败关闭（对某个命令有效的令牌无法通过另一个命令的上游验证）。
    - 已接受的回调会通过一条仅发送者可见的“处理中...”回复进行确认；实际回答会以普通消息的形式送达。

  </Accordion>
  <Accordion title="可达性要求">
    Mattermost 服务器必须能够访问回调端点。

    - 除非 Mattermost 与 OpenClaw 运行在同一主机或网络命名空间中，否则不要将 `callbackUrl` 设置为 `localhost`。
    - 除非你的 Mattermost 基础 URL 会将 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否则不要将 `callbackUrl` 设置为该 URL。
    - 可通过 `curl https://<gateway-host>/api/channels/mattermost/command` 快速检查；GET 请求应从 OpenClaw 返回 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 出站允许列表">
    如果回调目标是私有/tailnet/内部地址，请设置 Mattermost 的 `ServiceSettings.AllowedUntrustedInternalConnections`，使其包含回调主机或域名。

    请使用主机或域名条目，而不是完整 URL。

    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 环境变量（默认账户）

如果你更喜欢使用环境变量，请在 Gateway 网关主机上设置：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
环境变量仅适用于**默认**账户（`default`）。其他账户必须使用配置值。

不能通过工作区 `.env` 设置 `MATTERMOST_URL`；请参阅[工作区 .env 文件](/zh-CN/gateway/security)。
</Note>

## 聊天模式

Mattermost 会自动响应私信。频道行为由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（默认）">
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

- `onchar` 仍会响应明确的 @提及。
- `channels.mattermost.requireMention` 仍然有效，但优先使用 `chatmode`。按频道设置的 `groups.<channelId>.requireMention` 优先级高于两者。
- 机器人在频道话题中发送可见回复后，同一话题中的后续消息无需新的 @提及或 `onchar` 前缀即可获得回复，从而保持多轮话题对话持续进行。机器人最后一次在该话题中回复后，参与状态会保留 7 天，并且在 Gateway 网关重启后仍然保留。机器人仅观察过的话题不受影响；若要再次要求明确提及，请发送新的顶层消息。

## 话题与会话

使用 `channels.mattermost.replyToMode` 控制频道和群组回复是保留在主频道中，还是在触发消息下启动话题。

- `off`（默认）：仅当入站消息已经位于话题中时，才在话题中回复。
- `first`：对于顶层频道或群组消息，在该消息下启动话题，并将对话路由到话题范围的会话。
- `all` 和 `batched`：目前在 Mattermost 中与 `first` 行为相同，因为 Mattermost 一旦建立话题根，后续消息分块和媒体就会继续发送到同一话题中。
- 即使设置了 `replyToMode`，私信也默认为 `off`。

使用 `channels.mattermost.replyToModeByChatType` 覆盖 `direct`、`group` 或 `channel` 聊天的模式。设置 `direct` 可让私信使用话题：

- `off`（默认）：私信不使用话题，并保留在一个持续滚动的会话中。
- `first`、`all` 或 `batched`：每条顶层私信都会启动一个 Mattermost 话题，并由一个全新且独立的会话提供支持。

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

说明：

- 话题范围的会话使用触发消息的 ID 作为话题根。
- `first` 和 `all` 目前等效，因为 Mattermost 一旦建立话题根，后续消息分块和媒体就会继续发送到同一话题中。
- 按聊天类型的覆盖设置优先于 `replyToMode`。如果没有 `direct` 覆盖设置，现有部署会继续使用扁平的非话题式私信。

## 访问控制（私信）

- 默认值：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会收到配对码）。其他值：`allowlist`、`open`、`disabled`。
- 通过以下命令批准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：设置 `channels.mattermost.dmPolicy="open"`，并设置 `channels.mattermost.allowFrom=["*"]`（配置架构会强制要求通配符）。
- `channels.mattermost.allowFrom` 接受用户 ID（推荐）和 `accessGroup:<name>` 条目。请参阅[访问组](/zh-CN/channels/access-groups)。

## 频道（群组）

- 默认值：`channels.mattermost.groupPolicy = "allowlist"`（需要提及）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入允许列表（推荐使用用户 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 条目。请参阅[访问组](/zh-CN/channels/access-groups)。
- 按频道设置的提及覆盖项位于 `channels.mattermost.groups.<channelId>.requireMention` 下，或使用 `channels.mattermost.groups["*"].requireMention` 设置默认值。
- `@username` 匹配具有可变性，仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放频道：`channels.mattermost.groupPolicy="open"`（需要提及）。
- 解析顺序：`channels.mattermost.groupPolicy`，然后是 `channels.defaults.groupPolicy`，最后是 `"allowlist"`。
- 运行时说明：如果完全缺少 `channels.mattermost` 部分，运行时会在群组检查中以失败关闭方式使用 `groupPolicy="allowlist"`（即使已设置 `channels.defaults.groupPolicy`），并记录一次性警告。

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

将以下目标格式与 `openclaw message send` 或 cron/Webhooks 配合使用：

| 目标                                | 投递位置                                                     |
| ----------------------------------- | ------------------------------------------------------------ |
| `channel:<id>`                      | 按 ID 指定的频道                                             |
| `channel:<name>` 或 `#channel-name` | 按名称指定的频道，会在机器人所属的所有团队中搜索             |
| `user:<id>` 或 `mattermost:<id>`    | 与该用户的私信                                               |
| `@username`                         | 私信（通过 Mattermost API 解析用户名）                       |

每条出站消息最多支持一个附件；请将多个文件拆分为多次发送。

<Warning>
裸露的不透明 ID（例如 `64ifufp...`）在 Mattermost 中具有**歧义**（可能是用户 ID，也可能是频道 ID）。

OpenClaw 会**优先按用户解析**：

- 如果该 ID 对应某个用户（`GET /api/v4/users/<id>` 成功），OpenClaw 会通过 `/api/v4/channels/direct` 解析私信频道并发送**私信**。
- 否则，该 ID 会被视为**频道 ID**。

如果需要确定性行为，请始终使用明确的前缀（`user:<id>` / `channel:<id>`）。
</Warning>

## 私信频道重试

当 OpenClaw 向 Mattermost 私信目标发送消息且需要先解析私信频道时，默认会重试暂时性的私信频道创建失败。

使用 `channels.mattermost.dmChannelRetry` 为 Mattermost 插件全局调整此行为，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 为单个账户进行调整。默认值：

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

注意：

- 此配置仅适用于私信渠道创建（`/api/v4/channels/direct`），而非每次 Mattermost API 调用。
- 重试采用带抖动的指数退避，并适用于速率限制、5xx 响应、网络错误或超时错误等暂时性故障。
- 除 `429` 外的 4xx 客户端错误均视为永久性错误，不会重试。

## 预览流式传输

Mattermost 会将思考内容、工具活动和部分回复文本流式传输到一个**草稿预览帖子**中，并在最终答案可以安全发送时就地完成该帖子。在 `partial` 模式下，预览会更新同一个帖子 ID，而不是用每个分块的消息刷屏。在 `block` 模式下，预览会在已完成文本和工具活动块之间轮换，因此先前的块会作为独立帖子保持可见，而不会被下一个块覆盖。包含媒体或错误的最终结果会取消待处理的预览编辑，并改用正常投递，而不是发送一个无用的预览帖子。

预览流式传输默认以 `partial` 模式**启用**。通过 `channels.mattermost.streaming` 配置（可使用模式字符串、布尔值或 `{ mode: "progress" }` 这样的对象）：

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
  <Accordion title="Streaming modes">
    - `partial`（默认）：使用一个预览帖子，随着回复内容增加而持续编辑，最后以完整答案完成。
    - `block` 会在已完成文本和工具活动块之间轮换预览，因此每个块都会作为独立帖子保持可见，而不会被就地覆盖。并行和连续的工具更新共享当前工具活动帖子。
    - `progress` 在生成过程中显示状态预览，并且仅在完成时发布最终答案。
    - `off` 禁用预览流式传输。使用 `blockStreaming: true` 时，已完成的助手内容块仍会作为普通分块回复（独立帖子）投递，而不是合并成一个最终帖子。

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - 如果无法就地完成流式传输（例如帖子在传输过程中被删除），OpenClaw 会回退为发送一个新的最终帖子，确保回复永不丢失。
    - 仅含思考内容的载荷不会发布到渠道帖子中，包括以 `> Thinking` 引用块形式到达的文本。设置 `/reasoning on` 可在其他界面中查看思考内容；Mattermost 最终帖子仅保留答案。
    - 有关渠道映射矩阵，请参阅[流式传输](/zh-CN/concepts/streaming#preview-streaming-modes)。

  </Accordion>
</AccordionGroup>

## 表情回应（消息工具）

- 使用 `message action=react`，并设置 `channel=mattermost`。
- `messageId` 是 Mattermost 帖子 ID。
- `emoji` 接受 `thumbsup` 或 `:+1:` 这样的名称（冒号可选）。
- 设置 `remove=true`（布尔值）可移除表情回应。
- 添加或移除表情回应的事件会作为系统事件转发到对应路由的智能体会话，并接受与消息相同的私信/群组策略检查。

示例：

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用或禁用表情回应操作（默认为 true）。
- 按账户覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互式按钮（消息工具）

发送带有可点击按钮的消息。当用户点击按钮时，智能体会收到所选内容并可作出响应。

按钮来自语义化 `presentation` 载荷（用于普通智能体回复和 `message action=send`）。OpenClaw 会将值按钮渲染为 Mattermost 交互式按钮，将 URL 按钮以可见形式保留在消息文本中，并将选择菜单降级为可读文本。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

呈现按钮字段：

<ParamField path="label" type="string" required>
  显示标签（别名：`text`）。
</ParamField>
<ParamField path="value" type="string">
  点击时发回的值，用作操作 ID（别名：`callback_data`、`callbackData`）。除非设置了 `url`，否则可点击按钮必须提供此字段。
</ParamField>
<ParamField path="url" type="string">
  链接按钮；在消息正文中渲染为 `label: url` 文本，而非交互式按钮。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  按钮样式。对于不受支持的值，Mattermost 会应用默认样式。
</ParamField>

要在智能体系统提示词中声明支持按钮，请将 `inlineButtons` 添加到渠道能力：

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
  <Step title="Access check">
    点击者必须通过与消息发送者相同的私信/群组策略检查；未经授权的点击会收到临时通知，并被忽略。
  </Step>
  <Step title="Buttons replaced with confirmation">
    所有按钮都会替换为确认行（例如“✓ **Yes** selected by @user”）。
  </Step>
  <Step title="Agent receives the selection">
    智能体会将所选内容作为入站消息（以及一个系统事件）接收并作出响应。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - 按钮回调使用 HMAC-SHA256 验证（自动完成，无需配置）。
    - 点击后会替换整个附件块，因此所有按钮会被一并移除，无法仅移除部分按钮。
    - 包含连字符或下划线的操作 ID 会被自动清理（Mattermost 路由限制）。
    - 如果点击中的 `action_id` 与原始帖子上的任何操作都不匹配，则会以 `403`（“Unknown action”）拒绝。

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`：能力字符串数组。添加 `"inlineButtons"` 可在智能体系统提示词中启用按钮工具说明。
    - `channels.mattermost.interactions.callbackBaseUrl`：可选的按钮回调外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接访问 Gateway 网关的绑定主机时使用此项。
    - 在多账户设置中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置相同字段。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 会根据 `gateway.customBindHost` + `gateway.port`（默认 18789）派生回调 URL，然后回退到 `http://localhost:<port>`。回调路径为 `/mattermost/interactions/<accountId>`。
    - 可达性规则：Mattermost 服务器必须能够访问按钮回调 URL。只有当 Mattermost 和 OpenClaw 运行在同一主机/网络命名空间中时，`localhost` 才有效。
    - `channels.mattermost.interactions.allowedSourceIps`：按钮回调的来源 IP 允许列表。如果未设置，则仅接受环回来源（`127.0.0.1`、`::1`），因此远程 Mattermost 服务器必须在此处加入允许列表，否则其点击会以 `403` 拒绝。若位于反向代理之后，还需设置 `gateway.trustedProxies`，以便从转发标头中获取真实客户端 IP。
    - 如果回调目标属于私有网络、tailnet 或内部网络，请将其主机/域名添加到 Mattermost 的 `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 集成（外部脚本）

外部脚本和 Webhooks 可以通过 Mattermost REST API 直接发布按钮，而无需使用智能体的 `message` 工具。应尽可能使用插件中的 `buildButtonAttachments()`；如果要发布原始 JSON，请遵循以下规则：

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

1. 附件必须放在 `props.attachments` 中，而不是顶层 `attachments`（否则会被静默忽略）。
2. 每个操作都需要 `type: "button"`，否则点击会被静默吞掉。
3. 每个操作都需要 `id` 字段，Mattermost 会忽略没有 ID 的操作。
4. 操作 `id` 必须**仅包含字母和数字**（`[a-zA-Z0-9]`）。连字符和下划线会破坏 Mattermost 的服务器端操作路由（返回 404）。使用前请移除它们。
5. `context.action_id` 必须与按钮的 `id` 匹配；如果点击中的 `action_id` 不存在于帖子中，Gateway 网关会拒绝该点击。
6. `context.action_id` 为必填项，缺少时交互处理程序会返回 400。
7. 回调来源 IP 必须获准访问（请参阅上文的 `interactions.allowedSourceIps`）。

</Warning>

**生成 HMAC 令牌**

Gateway 网关使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 Gateway 网关验证逻辑匹配的令牌：

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`，采用十六进制编码。
  </Step>
  <Step title="Build the context object">
    构建包含所有字段但**不含** `_token` 的上下文对象。
  </Step>
  <Step title="Serialize with sorted keys">
    使用**递归排序的键**进行序列化，并且**不包含空格**（Gateway 网关也会规范化嵌套对象，并生成紧凑 JSON）。
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
    - 始终对**所有**上下文字段（不包括 `_token`）进行签名。Gateway 网关会移除 `_token`，然后对其余所有内容签名。仅对部分字段签名会导致验证静默失败。
    - 使用 `sort_keys=True`，因为 Gateway 网关会在签名前对键排序，并且 Mattermost 在存储载荷时可能会重新排列上下文字段。
    - 从机器人令牌派生密钥（具有确定性），不要使用随机字节。创建按钮的进程和执行验证的 Gateway 网关必须使用相同的密钥。

  </Accordion>
</AccordionGroup>

## 目录适配器

Mattermost 插件包含一个目录适配器，可通过 Mattermost API 解析渠道名称和用户名。这样便可在 `openclaw message send` 以及定时任务/Webhook 投递中使用 `#channel-name` 和 `@username` 目标。

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

账号值会覆盖顶层字段；当未指定账号时，`channels.mattermost.defaultAccount` 用于选择要使用的账号。

## 故障排查

<AccordionGroup>
  <Accordion title="频道中没有回复">
    确保 Bot 已加入该频道并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="身份验证或多账号错误">
    - 检查 Bot 令牌、基础 URL，以及账号是否已启用。
    - 多账号问题：环境变量仅适用于 `default` 账号。
    - 私有网络/LAN 中的 Mattermost 主机需要设置 `network.dangerouslyAllowPrivateNetwork: true`（SSRF 防护默认会阻止私有 IP）。

  </Accordion>
  <Accordion title="原生斜杠命令失败">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回调令牌。常见原因：
      - 启动时斜杠命令注册失败或仅部分完成
      - 回调发送到了错误的 Gateway 网关或账号
      - Mattermost 中仍有旧命令指向之前的回调目标
      - Gateway 网关重启后未重新激活斜杠命令
    - 如果原生斜杠命令停止工作，请在日志中检查 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略了 `callbackUrl`，且日志警告回调被解析为类似 `http://localhost:18789/...` 的回环 URL，那么该 URL 可能仅在 Mattermost 与 OpenClaw 运行于同一主机或网络命名空间时可访问。请改为显式设置可从外部访问的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按钮问题">
    - 按钮显示为白框或完全不显示：按钮数据格式有误。每个呈现按钮都需要 `label` 和 `value`（缺少任一字段的按钮都会被丢弃）。
    - 按钮能够呈现，但点击后没有反应：请确认 Mattermost 服务器能够访问 Gateway 网关、Mattermost 服务器 IP 已包含在 `channels.mattermost.interactions.allowedSourceIps` 中（未配置时仅接受回环地址），并且对于私有目标，`ServiceSettings.AllowedUntrustedInternalConnections` 包含回调主机。
    - 点击按钮后返回 404：按钮 `id` 可能包含连字符或下划线。Mattermost 的操作路由器无法处理非字母数字 ID。请仅使用 `[a-zA-Z0-9]`。
    - Gateway 网关日志显示 `rejected callback source`：点击请求来自 `interactions.allowedSourceIps` 之外的 IP。请将 Mattermost 服务器或你的入口加入允许列表；如果位于反向代理后方，还需设置 `gateway.trustedProxies`。
    - Gateway 网关日志显示 `invalid _token`：HMAC 不匹配。请检查是否签名了所有上下文字段（而不是其中一部分）、是否使用排序后的键，以及是否使用紧凑 JSON（不含空格）。请参阅上方的 HMAC 章节。
    - Gateway 网关日志显示 `missing _token in context`：按钮的上下文中不存在 `_token` 字段。构建集成载荷时，请确保包含该字段。
    - Gateway 网关以 `Unknown action` 拒绝点击：`context.action_id` 与消息中任何操作的 `id` 都不匹配。请将两者设置为相同的净化后值。
    - 智能体不提供按钮：请在 Mattermost 渠道配置中添加 `capabilities: ["inlineButtons"]`。

  </Accordion>
</AccordionGroup>

## 相关内容

- [频道路由](/zh-CN/channels/channel-routing) - 消息的会话路由
- [渠道概览](/zh-CN/channels) - 所有受支持的渠道
- [群组](/zh-CN/channels/groups) - 群聊行为和提及门控
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [安全性](/zh-CN/gateway/security) - 访问模型和安全强化
