---
read_when:
    - 说明入站消息如何变成回复
    - 说明会话、队列模式或流式传输行为
    - 记录推理可见性和使用影响
summary: 消息流、会话、排队和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-07-05T11:14:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92146d8fe08aedfea3ae01b653a303da626651b33b39d6beb22ef867e13eef2f
    source_path: concepts/messages.md
    workflow: 16
---

入站消息会经过路由、去重/防抖、智能体运行和出站投递：

```text
Inbound message
  -> routing/bindings -> session key
  -> dedupe + debounce
  -> queue (if a run is already active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键配置表面：

- `messages.*` 用于前缀、排队、入站防抖和群组行为。
- `agents.defaults.*` 用于分块流式传输、分块和静默回复默认值。
- 频道覆盖项（`channels.telegram.*`、`channels.whatsapp.*` 等）用于每个频道的上限和流式传输开关。

完整 schema 请参见 [配置](/zh-CN/gateway/configuration)。

## 入站去重

频道可能会在重新连接后重新投递同一条消息。OpenClaw 会保留一个内存缓存，按智能体作用域、频道路由（频道 + 对等端 + 账号 + 线程）和消息 ID 设键，因此重新投递的消息不会触发第二次智能体运行。缓存条目会在 20 分钟后过期，或在已跟踪 5000 个条目后过期，以先到者为准。

## 入站防抖

来自同一发送者的快速连续文本消息可以通过 `messages.inbound` 批处理为一个智能体轮次。防抖按每个频道 + 对话划定作用域，并使用最新消息作为回复线程/ID。

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- 防抖适用于纯文本消息；媒体/附件会立即刷新。
- 控制命令（stop/abort/status 等）会绕过防抖，因此会立即分发。
- 默认禁用：`messages.inbound.debounceMs` 没有内置默认值，因此只有在你设置它后（全局或按频道）才会启用防抖。
- iMessage 的 `coalesceSameSenderDms` 可选启用是唯一例外：它会保留所有同一发送者的私信文本（包括命令），时间足以让 Apple 的命令 + URL 拆分发送合并为一个轮次。无论此设置如何，群聊始终立即分发。

## 会话和设备

会话归 Gateway 网关所有，而不是归客户端所有。

- 直接聊天会折叠到智能体的主会话键中。
- 群组/频道会获得自己的会话键。
- 会话存储和转录记录位于 Gateway 网关主机上。

多个设备/频道可以映射到同一个会话，但历史记录不会完整同步回每个客户端。长对话请使用一个主设备，以避免上下文分歧。Control UI 和 TUI 始终显示由 Gateway 网关支持的会话转录记录，因此它们是事实来源。

详情：[会话管理](/zh-CN/concepts/session)。

## 提示词正文和历史上下文

频道插件会在入站上下文中填充多个文本字段，按优先级从高到低如下：

| 字段              | 用途                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | 当前轮次面向模型的文本。未设置时回退到 `CommandBody` / `RawBody` / `Body`。                                   |
| `BodyForCommands` | 用于指令/命令解析的干净文本。未设置时回退到 `CommandBody` / `RawBody` / `Body`。                              |
| `CommandBody`     | 旧版中间正文；优先使用 `BodyForCommands`。                                                                    |
| `RawBody`         | `CommandBody` 的已弃用别名。                                                                                  |
| `Body`            | 旧版提示词正文；可能包含频道信封和历史包装器。                                                               |

当频道提供历史记录时，它会用以下内容包裹：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于非直接聊天（群组/频道/房间），当前消息正文会加上发送者标签作为前缀，与历史条目使用的样式一致。指令剥离仅适用于当前消息部分，因此历史记录会保持完整。包装历史记录的频道应将 `BodyForCommands`（或旧版 `CommandBody` / `RawBody`）设置为原始消息文本，并将 `Body` 保留为组合后的提示词。

历史缓冲区仅包含待处理内容：它们包含未触发运行的群组消息（例如受提及门控的消息），并排除已在会话转录记录中的消息。结构化历史、回复、转发消息和频道元数据会在提示词组装期间渲染为不受信任的用户角色上下文块。

使用 `messages.groupChat.historyLimit`（全局默认值）或按频道覆盖项（例如 `channels.slack.historyLimit` 和 `channels.telegram.accounts.<id>.historyLimit`）配置历史大小（设置为 `0` 可禁用）。

## 工具结果元数据

工具结果 `content` 是模型可见的结果；`details` 是用于 UI 渲染、诊断、媒体投递和插件的运行时元数据。

- `toolResult.details` 会在提供商重放之前和压缩输入之前被剥离。
- 持久化的会话转录记录只保留有界的 `details`；过大的元数据会替换为带有 `persistedDetailsTruncated: true` 标记的紧凑摘要。
- 插件和工具应将模型必须读取的文本放在 `content` 中，而不是只放在 `details` 中。

## 排队和后续消息

当某个运行已经处于活动状态时，入站消息默认会 Steer 到其中。`messages.queue` 控制模式：

| 模式              | 行为                                                |
| ----------------- | --------------------------------------------------- |
| `steer`（默认）   | 将新提示词注入活动运行。                           |
| `followup`        | 在活动运行结束后运行该消息。                       |
| `collect`         | 将兼容消息批处理为稍后的一个轮次。                 |
| `interrupt`       | 中止活动运行，然后启动最新提示词。                 |

默认值：`messages.queue.debounceMs` 为 500ms（同样适用于 steer、followup 和 collect 批处理），`messages.queue.cap` 为 20 条排队消息，`messages.queue.drop` 为 `summarize`（也可使用 `old` 和 `new`）。通过 `messages.queue.byChannel` 和 `messages.queue.debounceMsByChannel` 配置按频道覆盖项。

详情：[命令队列](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

## 频道运行所有权

频道插件可以在消息进入会话队列之前保留顺序、对输入防抖，并应用传输背压。它们不应围绕智能体轮次本身施加单独的超时。一旦消息被路由到某个会话，会话、工具和运行时生命周期就会管理长时间运行的工作，使所有频道都能一致地报告慢轮次并从中恢复。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复；分块会遵循频道文本限制，并避免拆分围栏代码。

- `agents.defaults.blockStreamingDefault`（`on|off`，默认 `off`）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲的批处理）
- `agents.defaults.humanDelay`（分块回复之间类似人类的暂停）
- 频道覆盖项：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（除非在每个频道上将 `*.blockStreaming` 显式设置为 `true`，否则分块流式传输关闭，包括 Telegram）。

详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和令牌

- `/reasoning on|off|stream` 控制可见性。
- 当模型生成推理内容时，推理内容仍会计入令牌用量。
- Telegram 支持将流式推理写入临时草稿气泡，最终投递后会删除该气泡；使用 `/reasoning on` 可获得持久化推理输出。

详情：[思考 + 推理指令](/zh-CN/tools/thinking) 和 [令牌使用](/zh-CN/reference/token-use)。

## 前缀、线程和回复

- 出站前缀级联：`messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。WhatsApp 还提供 `channels.whatsapp.messagePrefix` 用于入站前缀。
- 通过 `replyToMode` 和按频道默认值进行回复线程处理。

详情：[配置](/zh-CN/gateway/config-agents#messages) 和频道文档。

## 静默回复

静默令牌 `NO_REPLY`（大小写不敏感，因此 `no_reply` 也会匹配）表示“不要投递用户可见的回复”。当某个轮次也有待处理的工具媒体（例如生成的 TTS 音频）时，OpenClaw 会剥离静默文本，但仍会投递媒体附件。

静默策略按对话类型解析：

- 直接对话永远不会收到 `NO_REPLY` 提示词引导。如果直接运行意外返回裸静默令牌，OpenClaw 会抑制它，而不是重写或投递它。
- 群组/频道默认允许静默。在 `message_tool` 可见回复模式中，静默意味着模型不会调用 `message(action=send)`。
- 内部编排默认允许静默。

默认值位于 `agents.defaults.silentReply` 下；`surfaces.<id>.silentReply` 可以按表面覆盖群组/内部策略。

OpenClaw 还会在非直接聊天中针对通用内部运行器故障使用静默回复，因此群组/频道不会看到 Gateway 网关错误样板文本。带有面向用户恢复文案的已分类故障（例如缺少凭证、速率限制或过载通知）仍可投递。直接聊天默认显示紧凑的故障文案；只有启用 `/verbose full` 时才显示原始运行器详情。

裸静默回复会在所有表面上被丢弃，因此父会话会保持安静，而不是把哨兵文本重写为回退闲聊。

## 相关

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor) - 目标持久发送和接收设计
- [流式传输](/zh-CN/concepts/streaming) - 实时消息投递
- [重试](/zh-CN/concepts/retry) - 消息投递重试行为
- [队列](/zh-CN/concepts/queue) - 消息处理队列
- [频道](/zh-CN/channels) - 消息平台集成
