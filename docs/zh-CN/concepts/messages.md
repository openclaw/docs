---
read_when:
    - 解释入站消息如何转化为回复
    - 阐明会话、排队模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、队列和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-07-12T14:26:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 16f0dc387a8825a91568dcd5a44f8bdc54b8d69d78f851760dfc2efa1eb151e7
    source_path: concepts/messages.md
    workflow: 16
---

入站消息会依次经过路由、去重/防抖、智能体运行和出站投递：

```text
入站消息
  -> 路由/绑定 -> 会话键
  -> 去重 + 防抖
  -> 队列（如果已有运行正在进行）
  -> 智能体运行（流式传输 + 工具）
  -> 出站回复（渠道限制 + 分块）
```

主要配置项：

- `messages.*` 用于配置前缀、排队、入站防抖和群组行为。
- `agents.defaults.*` 用于配置分块流式传输、分块和静默回复默认值。
- 渠道覆盖项（`channels.telegram.*`、`channels.whatsapp.*` 等）用于配置各渠道的限制和流式传输开关。

完整 schema 请参阅[配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道可能会在重新连接后重新投递同一条消息。OpenClaw 会维护一个内存缓存，其键由智能体作用域、渠道路由（渠道 + 对端 + 账号 + 线程）和消息 ID 组成，因此重新投递的消息不会触发第二次智能体运行。缓存条目会在 20 分钟后或已跟踪 5000 个条目时过期，以先发生者为准。

## 入站防抖

来自同一发送者的连续快速文本消息可以通过 `messages.inbound` 批量合并为一个智能体轮次。防抖以渠道 + 对话为作用域，并使用最新消息的回复线程/ID。

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

- 防抖仅适用于纯文本消息；媒体/附件会立即触发处理。
- 控制命令（停止/中止/状态等）会绕过防抖，因此会立即分派。
- 默认禁用：`messages.inbound.debounceMs` 没有内置默认值，因此只有在你设置它（全局或按渠道）后，防抖才会启用。
- iMessage 的 `coalesceSameSenderDms` 可选设置是唯一的例外：它会暂存来自同一发送者的所有私信文本（包括命令），等待足够长的时间，以便 Apple 拆分发送的命令 + URL 能够作为一个轮次到达。无论此设置如何，群聊始终会立即分派。

## 会话和设备

会话由 Gateway 网关拥有，而不是由客户端拥有。

- 私聊会归入智能体的主会话键。
- 群组/频道各自使用独立的会话键。
- 会话存储和对话记录位于 Gateway 网关主机上。

多个设备/渠道可以映射到同一会话，但历史记录不会完整同步回每个客户端。长时间对话请使用一个主要设备，以避免上下文出现分歧。Control UI 和 TUI 始终显示由 Gateway 网关支持的会话对话记录，因此它们是事实依据。

详情：[会话管理](/zh-CN/concepts/session)。

## 提示词正文和历史上下文

渠道插件会在入站上下文中填充多个文本字段，按优先级从高到低排列：

| 字段              | 用途                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | 当前轮次面向模型的文本。未设置时回退到 `CommandBody` / `RawBody` / `Body`。                           |
| `BodyForCommands` | 用于解析指令/命令的纯净文本。未设置时回退到 `CommandBody` / `RawBody` / `Body`。                      |
| `CommandBody`     | 旧版中间正文；优先使用 `BodyForCommands`。                                                            |
| `RawBody`         | `CommandBody` 的已弃用别名。                                                                          |
| `Body`            | 旧版提示词正文；可能包含渠道封装和历史记录包装。                                                      |

当渠道提供历史记录时，会使用以下标记将其包裹：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于非私聊（群组/渠道/房间），当前消息正文会以发送者标签作为前缀，与历史记录条目所用的格式一致。指令剥离仅适用于当前消息部分，因此历史记录会保持完整。包裹历史记录的渠道应将 `BodyForCommands`（或旧版的 `CommandBody` / `RawBody`）设置为原始消息文本，并将 `Body` 保留为合并后的提示词。

历史记录缓冲区仅包含待处理消息：其中包括未触发运行的群组消息（例如，受提及门控的消息），但不包括已存在于会话转录中的消息。在组装提示词期间，结构化历史记录、回复、转发和渠道元数据会呈现为不受信任的用户角色上下文块。

使用 `messages.groupChat.historyLimit`（全局默认值）或各渠道的覆盖项（例如 `channels.slack.historyLimit` 和 `channels.telegram.accounts.<id>.historyLimit`）配置历史记录大小（设置为 `0` 可禁用）。

## 工具结果元数据

工具结果的 `content` 是模型可见的结果；`details` 是用于 UI 渲染、诊断、媒体投递和插件的运行时元数据。

- 在提供商重放之前以及作为压缩输入之前，会移除 `toolResult.details`。
- 持久化的会话记录仅保留有大小限制的 `details`；过大的元数据会替换为精简摘要，并标记 `persistedDetailsTruncated: true`。
- 插件和工具应将模型必须读取的文本放入 `content`，而不是仅放入 `details`。

## 排队和后续消息

当某个运行已处于活动状态时，入站消息默认会引导该运行。`messages.queue` 控制其模式：

| 模式              | 行为                                            |
| ----------------- | --------------------------------------------------- |
| `steer`（默认） | 将新提示词注入活动运行。          |
| `followup`        | 在活动运行结束后处理该消息。      |
| `collect`         | 将兼容的消息批量合并到后续一个轮次中。      |
| `interrupt`       | 中止活动运行，然后开始处理最新提示词。 |

默认值：`messages.queue.debounceMs` 为 500ms（同样适用于 steer、followup 和 collect 批处理），`messages.queue.cap` 为 20 条排队消息，`messages.queue.drop` 为 `summarize`（也可使用 `old` 和 `new`）。通过 `messages.queue.byChannel` 和 `messages.queue.debounceMsByChannel` 配置各渠道的覆盖设置。

详情：[命令队列](/zh-CN/concepts/queue)和 [Steering queue](/zh-CN/concepts/queue-steering)。

## 渠道运行所有权

在消息进入会话队列之前，渠道插件可以维持顺序、对输入进行防抖并施加传输背压。它们不应为智能体轮次本身设置单独的超时。一旦消息被路由到会话，长时间运行工作的管理便由会话、工具和运行时生命周期负责，从而确保所有渠道都能以一致的方式报告慢速轮次并从中恢复。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复；分块会遵守渠道文本长度限制，并避免拆分围栏代码块。

- `agents.defaults.blockStreamingDefault`（`on|off`，默认 `off`）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间的批处理）
- `agents.defaults.humanDelay`（分块回复之间模拟人工操作的暂停）
- 渠道覆盖设置：在具有嵌套流式配置的渠道（Telegram、Discord、Slack、iMessage、Microsoft Teams）上使用 `*.streaming.block.enabled` 和 `*.streaming.block.coalesce`；在没有嵌套流式配置的渠道上使用扁平的 `*.blockStreaming` / `*.blockStreamingCoalesce`。除非显式启用，否则所有渠道（包括 Telegram）的分块流式传输均处于关闭状态。

详情：[流式传输和分块](/zh-CN/concepts/streaming)。

## 推理可见性和 token

- `/reasoning on|off|stream` 控制可见性。
- 当模型生成推理内容时，该内容仍会计入 token 使用量。
- Telegram 支持将推理内容流式传输到临时草稿气泡中，该气泡会在最终消息送达后删除；如需持久保留推理输出，请使用 `/reasoning on`。

详情：[思考和推理指令](/zh-CN/tools/thinking)以及 [Token 使用](/zh-CN/reference/token-use)。

## 前缀、线程和回复

- 出站前缀级联：`messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。WhatsApp 还提供用于入站前缀的 `channels.whatsapp.messagePrefix`。
- 通过 `replyToMode` 和各渠道默认值实现回复线程化。

详情：[配置](/zh-CN/gateway/config-agents#messages)和渠道文档。

## 静默回复

静默 token `NO_REPLY`（不区分大小写，因此 `no_reply` 也匹配）表示“不要发送用户可见的回复”。当某个轮次还有待发送的工具媒体（例如生成的 TTS 音频）时，OpenClaw 会移除静默文本，但仍会发送媒体附件。

静默策略按对话类型确定：

- 直接对话绝不会收到 `NO_REPLY` 提示指引。如果直接运行意外返回了单独的静默 token，OpenClaw 会将其抑制，而不是改写或发送。
- 群组/渠道默认允许静默。在 `message_tool` 可见回复模式下，静默意味着模型不会调用 `message(action=send)`。
- 内部编排默认允许静默。

默认值位于 `agents.defaults.silentReply` 下；`surfaces.<id>.silentReply` 可以按表面覆盖群组/内部策略。

OpenClaw 还会在非直接聊天中针对通用内部运行器故障使用静默回复，因此群组/渠道不会看到 Gateway 网关错误样板文本。对于带有面向用户的恢复说明的已分类故障，例如缺少身份验证、速率限制或过载通知，仍可发送。直接聊天默认显示精简的故障说明；仅当启用 `/verbose full` 时才显示原始运行器详情。

所有表面都会丢弃单独的静默回复，因此父会话会保持安静，而不会将哨兵文本改写为兜底闲聊内容。

## 相关内容

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor) - 持久可靠的发送和接收目标设计
- [流式传输](/zh-CN/concepts/streaming) - 实时消息发送
- [重试](/zh-CN/concepts/retry) - 消息发送重试行为
- [队列](/zh-CN/concepts/queue) - 消息处理队列
- [渠道](/zh-CN/channels) - 消息平台集成
