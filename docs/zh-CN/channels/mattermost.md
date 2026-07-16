---
read_when:
    - 设置 Mattermost
    - 调试 Mattermost 路由
sidebarTitle: Mattermost
summary: Mattermost Bot 设置和 OpenClaw 配置
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T11:24:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

状态：可下载插件（bot token + WebSocket 事件）。支持频道、私密频道、群组私信和私信。Mattermost 是一个可自行托管的团队消息平台（[mattermost.com](https://mattermost.com)）。

## 安装

<Tabs>
  <Tab title="npm registry">
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
    使用上述命令安装 `@openclaw/mattermost`，如果 Gateway 网关已在运行，请将其重启。
  </Step>
  <Step title="创建 Mattermost bot">
    创建 Mattermost bot 账户，复制 **bot token**，并将 bot 添加到它应读取的团队和频道。
  </Step>
  <Step title="复制基础 URL">
    复制 Mattermost **基础 URL**（例如 `https://chat.example.com`）。末尾的 `/api/v4` 会被自动移除。
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
位于私有/LAN/tailnet 地址上的自托管 Mattermost：出站 Mattermost API 请求会通过 SSRF 防护，默认阻止私有和内部 IP。通过 `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` 选择启用（按账户：`channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`）。
</Note>

## 原生斜杠命令

原生斜杠命令需要选择启用。启用后，OpenClaw 会在 bot 所属的每个团队中注册 `oc_*` 斜杠命令，并在 Gateway 网关 HTTP 服务器上接收回调 POST 请求。

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

注册的命令：`/oc_status`、`/oc_model`、`/oc_models`、`/oc_new`、`/oc_help`、`/oc_think`、`/oc_reasoning`、`/oc_verbose`、`/oc_queue`。启用 `nativeSkills: true` 后，技能命令也会注册为 `/oc_<skill>`。

<AccordionGroup>
  <Accordion title="行为说明">
    - `native` 和 `nativeSkills` 默认为 `"auto"`，该值对 Mattermost 会解析为禁用。请将它们显式设置为 `true`。
    - `callbackPath` 默认为 `/api/channels/mattermost/command`。
    - 如果省略 `callbackUrl`，OpenClaw 会推导出 `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`。通配符绑定主机（`0.0.0.0`、`::`）会回退到 `localhost`。
    - 对于多账户设置，可以在顶层或 `channels.mattermost.accounts.<id>.commands` 下设置 `commands`（账户值会覆盖顶层字段）。
    - 由其他集成创建且触发词相同的现有斜杠命令不会被修改（注册时会跳过）；当回调 URL 发生变化时，bot 创建的命令会被更新或重新创建。
    - 命令回调使用 Mattermost 在 OpenClaw 注册 `oc_*` 命令时返回的逐命令 token 进行验证。
    - OpenClaw 在接受每次回调前都会刷新当前的 Mattermost 命令注册，因此来自已删除或重新生成的斜杠命令的过期 token 无需重启 Gateway 网关即可停止被接受。
    - 如果 Mattermost API 无法确认命令仍为当前命令，回调验证将以拒绝方式失败；验证失败结果会被短暂缓存，并发查询会被合并，并且每个命令的新查询启动都会受到速率限制，以限制重放压力。
    - 当注册失败、启动不完整，或回调 token 与已解析命令的已注册 token 不匹配时，斜杠命令回调将以拒绝方式失败（对某个命令有效的 token 无法进入另一个命令的上游验证）。
    - 已接受的回调会通过一条仅对用户可见的“正在处理...”回复进行确认；实际答案会以普通消息形式送达。

  </Accordion>
  <Accordion title="可达性要求">
    回调端点必须能够从 Mattermost 服务器访问。

    - 除非 Mattermost 与 OpenClaw 运行在同一主机/网络命名空间中，否则不要将 `callbackUrl` 设置为 `localhost`。
    - 不要将 `callbackUrl` 设置为 Mattermost 基础 URL，除非该 URL 将 `/api/channels/mattermost/command` 反向代理到 OpenClaw。
    - 可以使用 `curl https://<gateway-host>/api/channels/mattermost/command` 快速检查；GET 请求应返回 OpenClaw 的 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 出站允许列表">
    如果回调目标是私有/tailnet/内部地址，请设置 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`，使其包含回调主机/域名。

    请使用主机/域名条目，而不是完整 URL。

    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 环境变量（默认账户）

如果你更倾向于使用环境变量，请在 Gateway 网关主机上设置以下变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
环境变量仅适用于**默认**账户（`default`）。其他账户必须使用配置值。

无法通过工作区 `.env` 设置 `MATTERMOST_URL`；请参阅[工作区 .env 文件](/zh-CN/gateway/security)。
</Note>

## 聊天模式

Mattermost 会自动回复私信。频道行为由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（默认）">
    仅在频道中被 @提及时回复。
  </Tab>
  <Tab title="onmessage">
    回复每条频道消息。
  </Tab>
  <Tab title="onchar">
    当消息以触发前缀开头时回复。
  </Tab>
</Tabs>

配置示例：

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // 默认值
    },
  },
}
```

说明：

- `onchar` 仍会响应显式 @提及。
- 仍支持 `channels.mattermost.requireMention`，但优先使用 `chatmode`。逐频道的 `groups.<channelId>.requireMention` 设置优先于这两者。
- bot 在频道帖子串中发送可见回复后，该帖子串中的后续消息无需新的 @提及或 `onchar` 前缀即可获得回复，从而保持多轮帖子串对话连续进行。参与状态会在 bot 最后一次回复该帖子串后的 7 天内保留，并在 Gateway 网关重启后继续存在。bot 仅观察过的帖子串不受影响；若要再次要求显式提及，请新建一条顶层消息。

## 帖子串与会话

使用 `channels.mattermost.replyToMode` 控制频道和群组回复是留在主频道中，还是在触发消息下开启帖子串。

- `off`（默认）：仅当入站消息已位于帖子串中时，才在帖子串中回复。
- `first`：对于顶层频道/群组消息，在其下开启帖子串，并将对话路由至帖子串范围的会话。
- `all` 和 `batched`：目前在 Mattermost 中与 `first` 的行为相同，因为一旦 Mattermost 有了帖子串根，后续分块和媒体就会继续发送到同一帖子串中。
- 即使设置了 `replyToMode`，私信仍默认为 `off`。

使用 `channels.mattermost.replyToModeByChatType` 覆盖 `direct`、`group` 或 `channel` 聊天的模式。设置 `direct` 可选择让私信使用帖子串：

- `off`（默认）：私信保持非帖子串模式，并使用一个持续滚动的会话。
- `first`、`all` 或 `batched`：每条顶层私信都会开启一个 Mattermost 帖子串，并由一个全新且独立的会话支持。

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

- 帖子串范围的会话使用触发消息 ID 作为帖子串根。
- `first` 和 `all` 目前等效，因为一旦 Mattermost 有了帖子串根，后续分块和媒体就会继续发送到同一帖子串中。
- 逐聊天类型覆盖优先于 `replyToMode`。如果没有 `direct` 覆盖，现有部署会继续使用扁平的非帖子串私信。

## 访问控制（私信）

- 默认值：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会收到配对码）。其他值：`allowlist`、`open`、`disabled`。
- 批准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加 `channels.mattermost.allowFrom=["*"]`（配置架构会强制要求通配符）。
- `channels.mattermost.allowFrom` 接受用户 ID（推荐）和 `accessGroup:<name>` 条目。请参阅[访问组](/zh-CN/channels/access-groups)。

## 频道（群组）

- 默认值：`channels.mattermost.groupPolicy = "allowlist"`（需要提及）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入允许列表（推荐使用用户 ID）。
- `channels.mattermost.groupAllowFrom` 接受 `accessGroup:<name>` 条目。请参阅[访问组](/zh-CN/channels/access-groups)。
- 逐频道提及覆盖位于 `channels.mattermost.groups.<channelId>.requireMention` 下，也可以使用 `channels.mattermost.groups["*"].requireMention` 设置默认值。
- `@username` 匹配是可变的，仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放频道：`channels.mattermost.groupPolicy="open"`（需要提及）。
- 解析顺序：`channels.mattermost.groupPolicy`，然后是 `channels.defaults.groupPolicy`，最后是 `"allowlist"`。
- 运行时说明：如果完全缺少 `channels.mattermost` 部分，运行时会在群组检查中以拒绝方式回退到 `groupPolicy="allowlist"`（即使已设置 `channels.defaults.groupPolicy`），并记录一次性警告。

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

| 目标                              | 投递到                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | 按 ID 指定的频道                                                 |
| `channel:<name>` 或 `#channel-name` | 按名称指定的频道，在 bot 所属的所有团队中搜索 |
| `user:<id>` 或 `mattermost:<id>`    | 与该用户的私信                                             |
| `@username`                         | 私信（通过 Mattermost API 解析用户名）                 |

每条出站消息最多支持一个附件；请将多个文件拆分为多次发送。

<Warning>
裸的不透明 ID（例如 `64ifufp...`）在 Mattermost 中具有**歧义**（用户 ID 或频道 ID）。

OpenClaw 会**优先按用户**解析：

- 如果该 ID 对应用户（`GET /api/v4/users/<id>` 成功），OpenClaw 会通过 `/api/v4/channels/direct` 解析私信频道并发送**私信**。
- 否则，该 ID 会被视为**频道 ID**。

如果需要确定性行为，请始终使用显式前缀（`user:<id>` / `channel:<id>`）。
</Warning>

## 私信频道重试

当 OpenClaw 向 Mattermost 私信目标发送消息，并且需要先解析直接频道时，默认会重试暂时性的直接频道创建失败。

使用 `channels.mattermost.dmChannelRetry` 全局调整 Mattermost 插件的此行为，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 为单个账户进行调整。默认值：

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

- 此设置仅适用于私信频道创建（`/api/v4/channels/direct`），而非所有 Mattermost API 调用。
- 重试使用带抖动的指数退避，并适用于速率限制、5xx 响应以及网络或超时错误等暂时性故障。
- 除 `429` 之外的 4xx 客户端错误会被视为永久性错误，不会重试。

## 预览流式传输

Mattermost 会将思考过程、工具活动和部分回复文本流式传输到一个**草稿预览帖子**中，并在最终答案可安全发送时原地定稿。在 `partial` 模式下，预览会更新同一个帖子 ID，而不是用每个分块一条消息刷屏。在 `block` 模式下，预览会在已完成文本与工具活动块之间轮换，因此较早的块会作为独立帖子保持可见，而不会被下一个块覆盖。媒体或错误形式的最终结果会取消待处理的预览编辑，并改用正常投递，而不是提交一个无用的预览帖子。

预览流式传输在 `partial` 模式下**默认启用**。通过 `channels.mattermost.streaming.mode` 配置（旧版标量/布尔值 `streaming` 会由 `openclaw doctor --fix` 迁移）：

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // 关闭 | 部分 | 分块 | 进度
    },
  },
}
```

<AccordionGroup>
  <Accordion title="流式传输模式">
    - `partial`（默认）：使用一个预览帖子，随着回复内容增加不断编辑，然后以完整答案定稿。
    - `block` 会在已完成文本与工具活动块之间轮换预览，因此每个块都会作为独立帖子保持可见，而不是在原处被覆盖。并行和连续的工具更新共用当前工具活动帖子。
    - `progress` 会在生成过程中显示状态预览，并仅在完成时发布最终答案。
    - `off` 会禁用预览流式传输。启用 `streaming.block.enabled: true` 时，已完成的助手内容块仍会作为普通分块回复（独立帖子）投递，而不是合并为单个最终帖子。

  </Accordion>
  <Accordion title="流式传输行为说明">
    - 如果无法原地完成流式传输（例如帖子在流式传输期间被删除），OpenClaw 会回退为发送新的最终帖子，确保回复绝不丢失。
    - 频道帖子会抑制仅包含思考内容的载荷，包括以 `> Thinking` 引用块形式到达的文本。设置 `/reasoning on` 可在其他界面中查看思考内容；Mattermost 的最终帖子只保留答案。
    - 有关渠道映射矩阵，请参阅[流式传输](/zh-CN/concepts/streaming#preview-streaming-modes)。

  </Accordion>
</AccordionGroup>

## 表情回应（消息工具）

- 将 `message action=react` 与 `channel=mattermost` 配合使用。
- `messageId` 是 Mattermost 帖子 ID。
- `emoji` 接受 `thumbsup` 或 `:+1:` 等名称（冒号可选）。
- 设置 `remove=true`（布尔值）可移除表情回应。
- 添加/移除表情回应事件会作为系统事件转发到路由到的智能体会话，并遵循与消息相同的私信/群组策略检查。

示例：

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用表情回应操作（默认为 true）。
- 按账户覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互式按钮（消息工具）

发送带有可点击按钮的消息。当用户点击按钮时，智能体会收到所选内容并可作出响应。

按钮来自语义化的 `presentation` 载荷（用于普通智能体回复和 `message action=send`）。OpenClaw 将值按钮呈现为 Mattermost 交互式按钮，使 URL 按钮在消息文本中保持可见，并将选择菜单降级为可读文本。

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"是","value":"yes"},{"label":"否","value":"no"}]}]}
```

呈现按钮字段：

<ParamField path="label" type="string" required>
  显示标签（别名：`text`）。
</ParamField>
<ParamField path="value" type="string">
  点击时发回的值，用作操作 ID（别名：`callback_data`、`callbackData`）。除非设置了 `url`，否则可点击按钮必须提供此值。
</ParamField>
<ParamField path="url" type="string">
  链接按钮；在消息正文中呈现为 `label: url` 文本，而不是交互式按钮。
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  按钮样式。对于不支持的值，Mattermost 会应用默认样式。
</ParamField>

要在智能体系统提示词中声明按钮支持，请将 `inlineButtons` 添加到渠道能力中：

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
    点击者必须通过与消息发送者相同的私信/群组策略检查；未授权的点击会收到临时通知并被忽略。
  </Step>
  <Step title="按钮替换为确认信息">
    所有按钮都会替换为一行确认信息（例如，“✓ **是**，由 @user 选择”）。
  </Step>
  <Step title="智能体接收所选内容">
    智能体会将所选内容作为入站消息（以及一个系统事件）接收并作出响应。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="实现说明">
    - 按钮回调使用 HMAC-SHA256 验证（自动进行，无需配置）。
    - 点击时会替换整个附件块，因此所有按钮会一同移除，无法只移除部分按钮。
    - 包含连字符或下划线的操作 ID 会自动清理（Mattermost 路由限制）。
    - 如果点击的 `action_id` 与原始帖子中的任何操作都不匹配，则会以 `403`（“未知操作”）拒绝该点击。

  </Accordion>
  <Accordion title="配置和可达性">
    - `channels.mattermost.capabilities`：能力字符串数组。添加 `"inlineButtons"` 可在智能体系统提示词中启用按钮工具说明。
    - `channels.mattermost.interactions.callbackBaseUrl`：按钮回调的可选外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接通过 Gateway 网关的绑定主机访问它时，请使用此项。
    - 在多账户设置中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置相同字段。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 会根据 `gateway.customBindHost` + `gateway.port`（默认 18789）派生回调 URL，然后回退到 `http://localhost:<port>`。回调路径为 `/mattermost/interactions/<accountId>`。
    - 可达性规则：Mattermost 服务器必须能够访问按钮回调 URL。只有当 Mattermost 和 OpenClaw 运行在同一主机/网络命名空间中时，`localhost` 才有效。
    - `channels.mattermost.interactions.allowedSourceIps`：按钮回调的源 IP 允许列表。如果未设置，则仅接受环回来源（`127.0.0.1`、`::1`），因此必须在此处将远程 Mattermost 服务器加入允许列表，否则其点击会以 `403` 被拒绝。在反向代理后运行时，还应设置 `gateway.trustedProxies`，以便从转发标头中获取真实客户端 IP。
    - 如果回调目标位于私有网络、tailnet 或内部网络中，请将其主机/域名添加到 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

  </Accordion>
</AccordionGroup>

### 直接 API 集成（外部脚本）

外部脚本和 Webhooks 可以通过 Mattermost REST API 直接发布按钮，无需通过智能体的 `message` 工具。优先使用 OpenClaw 的 `message` 工具。对于直接集成，请从 `@openclaw/mattermost/api.js` 导入 `buildButtonAttachments`；如果发布原始 JSON，请遵循以下规则：

**载荷结构：**

```json5
{
  channel_id: "<channelId>",
  message: "选择一个选项：",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 仅限字母数字，见下文
            type: "button", // 必需，否则点击会被静默忽略
            name: "批准", // 显示标签
            style: "primary", // 可选："default"、"primary"、"danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // 必须与按钮 ID 匹配
                action: "approve",
                // ... 任意自定义字段 ...
                _token: "<hmac>", // 请参阅下方 HMAC 章节
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

1. 附件应放在 `props.attachments` 中，而不是顶层 `attachments` 中（否则会被静默忽略）。
2. 每个操作都需要 `type: "button"`，否则点击会被静默吞掉。
3. 每个操作都需要 `id` 字段，Mattermost 会忽略没有 ID 的操作。
4. 操作 `id` 必须**仅包含字母数字**（`[a-zA-Z0-9]`）。连字符和下划线会破坏 Mattermost 的服务器端操作路由（返回 404）。使用前请移除它们。
5. `context.action_id` 必须与按钮的 `id` 匹配；如果点击的 `action_id` 不存在于帖子中，Gateway 网关会拒绝该点击。
6. `context.action_id` 为必需项，缺少它时交互处理程序会返回 400。
7. 必须允许回调源 IP（请参阅上方的 `interactions.allowedSourceIps`）。

</Warning>

**HMAC 令牌生成**

Gateway 网关使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 Gateway 网关验证逻辑匹配的令牌：

<Steps>
  <Step title="从 Bot 令牌派生密钥">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`，采用十六进制编码。
  </Step>
  <Step title="构建上下文对象">
    使用除 `_token` 之外的所有字段构建上下文对象。
  </Step>
  <Step title="使用排序后的键进行序列化">
    使用**递归排序的键**进行序列化，且**不含空格**（Gateway 网关也会规范化嵌套对象并生成紧凑 JSON）。
  </Step>
  <Step title="签署载荷">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="添加令牌">
    将生成的十六进制摘要作为上下文中的 `_token` 添加。
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
    - 始终对**所有**上下文字段（`_token` 除外）进行签名。Gateway 网关会移除 `_token`，然后对其余所有内容进行签名。仅对部分字段签名会导致验证无提示失败。
    - 使用 `sort_keys=True`——Gateway 网关会在签名前对键进行排序，而 Mattermost 在存储有效载荷时可能会重新排列上下文字段。
    - 应根据 Bot 令牌以确定性方式派生密钥，而不是使用随机字节。创建按钮的进程与执行验证的 Gateway 网关必须使用相同的密钥。

  </Accordion>
</AccordionGroup>

## 目录适配器

Mattermost 插件包含一个目录适配器，可通过 Mattermost API 解析频道名称和用户名。这样即可在 `openclaw message send` 和 cron/webhook 投递中使用 `#channel-name` 和 `@username` 目标。

无需配置——该适配器使用账户配置中的 Bot 令牌。

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

账户值会覆盖顶层字段；未指定账户时，`channels.mattermost.defaultAccount` 决定使用哪个账户。

## 故障排查

<AccordionGroup>
  <Accordion title="频道中没有回复">
    确保 Bot 已加入该频道并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="身份验证或多账户错误">
    - 检查 Bot 令牌、基础 URL 以及账户是否已启用。
    - 多账户问题：环境变量仅适用于 `default` 账户。
    - 私有网络/LAN 中的 Mattermost 主机需要设置 `network.dangerouslyAllowPrivateNetwork: true`（SSRF 防护默认会阻止私有 IP）。

  </Accordion>
  <Accordion title="原生斜杠命令失败">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回调令牌。常见原因：
      - 斜杠命令注册在启动时失败或仅部分完成
      - 回调访问了错误的 Gateway 网关/账户
      - Mattermost 中仍有旧命令指向之前的回调目标
      - Gateway 网关重启后未重新激活斜杠命令
    - 如果原生斜杠命令停止工作，请检查日志中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略了 `callbackUrl`，且日志警告回调被解析为类似 `http://localhost:18789/...` 的回环 URL，则该 URL 可能只有在 Mattermost 与 OpenClaw 运行于同一主机/网络命名空间时才能访问。请改为明确设置一个可从外部访问的 `commands.callbackUrl`。

  </Accordion>
  <Accordion title="按钮问题">
    - 按钮显示为白色方框或完全不显示：按钮数据格式错误。每个呈现按钮都需要 `label` 和 `value`（缺少其中任一项的按钮都会被丢弃）。
    - 按钮正常呈现但点击无效：请确认 Mattermost 服务器可以访问 Gateway 网关、`channels.mattermost.interactions.allowedSourceIps` 中包含 Mattermost 服务器 IP（未设置时仅接受回环地址），并且对于私有目标，`ServiceSettings.AllowedUntrustedInternalConnections` 包含回调主机。
    - 点击按钮时返回 404：按钮的 `id` 可能包含连字符或下划线。Mattermost 的操作路由器无法处理非字母数字 ID。请仅使用 `[a-zA-Z0-9]`。
    - Gateway 网关记录 `rejected callback source`：点击请求来自 `interactions.allowedSourceIps` 范围外的 IP。请将 Mattermost 服务器或你的入口加入允许列表；如果使用反向代理，请设置 `gateway.trustedProxies`。
    - Gateway 网关记录 `invalid _token`：HMAC 不匹配。请检查是否对所有上下文字段（而非部分字段）签名、是否对键进行排序，以及是否使用紧凑 JSON（无空格）。请参阅上方的 HMAC 部分。
    - Gateway 网关记录 `missing _token in context`：按钮上下文中没有 `_token` 字段。构建集成有效载荷时，请确保包含该字段。
    - Gateway 网关以 `Unknown action` 拒绝点击：`context.action_id` 与帖子中的任何操作 `id` 都不匹配。请将两者设置为相同的净化后值。
    - 智能体不提供按钮：将 `capabilities: ["inlineButtons"]` 添加到 Mattermost 频道配置中。

  </Accordion>
</AccordionGroup>

## 相关内容

- [频道路由](/zh-CN/channels/channel-routing)——消息的会话路由
- [渠道概览](/zh-CN/channels)——所有受支持的渠道
- [群组](/zh-CN/channels/groups)——群聊行为和提及门控
- [配对](/zh-CN/channels/pairing)——私信身份验证和配对流程
- [安全性](/zh-CN/gateway/security)——访问模型和安全加固
