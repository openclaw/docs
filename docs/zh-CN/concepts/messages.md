---
read_when:
    - 解释入站消息如何转化为回复
    - 阐明会话、排队模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、排队和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-07-16T11:30:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

入站消息依次经过路由、去重/防抖、智能体运行和出站投递：

```text
入站消息
  -> 路由/绑定 -> 会话键
  -> 去重 + 防抖
  -> 队列（如果已有运行处于活动状态）
  -> 智能体运行（流式传输 + 工具）
  -> 出站回复（渠道限制 + 分块）
```

主要配置项：

- `messages.*`：用于前缀、排队、入站防抖和群组行为。
- `agents.defaults.*`：用于分块流式传输、分块和静默回复默认值。
- 渠道覆盖配置（`channels.telegram.*`、`channels.whatsapp.*` 等）：用于设置各渠道的上限和流式传输开关。

完整 schema 请参阅[配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道重新连接后可能会重复投递同一条消息。OpenClaw 会维护一个内存缓存，其键由智能体作用域、渠道路由（渠道 + 对端 + 账户 + 线程）和消息 ID 组成，因此重新投递的消息不会触发第二次智能体运行。缓存条目会在 20 分钟后或跟踪的条目达到 5000 个时过期，以先发生者为准。

## 入站防抖

来自同一发送者的连续快速文本消息可通过 `messages.inbound` 合并到同一个智能体轮次中。防抖范围按渠道 + 对话划分，并使用最新消息的回复线程/ID。

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

- 防抖仅适用于纯文本消息；媒体/附件会立即触发发送。
- 控制命令（停止/中止/状态等）会绕过防抖，以便立即分派。
- 默认禁用：`messages.inbound.debounceMs` 没有内置默认值，因此只有在全局或按渠道设置后才会启用防抖。
- iMessage 的 `coalesceSameSenderDms` 选择启用是唯一例外：它会短暂暂存同一发送者的所有私信文本（包括命令），以便 Apple 拆分发送的命令和 URL 能作为一个轮次到达。无论此设置如何，群聊始终立即分派。

## 会话和设备

会话由 Gateway 网关拥有，而非客户端。

- 直接聊天会归并到智能体的主会话键。
- 群组/渠道各自拥有独立的会话键。
- 会话存储和转录记录位于 Gateway 网关主机上。

多个设备/渠道可映射到同一会话，但历史记录不会完全同步回每个客户端。长对话请使用一个主要设备，以避免上下文出现分歧。Control UI 和 TUI 始终显示由 Gateway 网关支持的会话转录记录，因此它们是权威数据源。

详情：[会话管理](/zh-CN/concepts/session)。

## 提示正文和历史上下文

渠道插件会在入站上下文中填充多个文本字段，以下按优先级从高到低排列：

| 字段             | 用途                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | 当前轮次面向模型的文本。未设置时回退到 `CommandBody` / `RawBody` / `Body`。        |
| `BodyForCommands` | 用于解析指令/命令的干净文本。未设置时回退到 `CommandBody` / `RawBody` / `Body`。 |
| `CommandBody`     | 旧版中间正文；优先使用 `BodyForCommands`。                                                         |
| `RawBody`         | `CommandBody` 的已弃用别名。                                                                         |
| `Body`            | 旧版提示正文；可能包含渠道信封和历史记录包装。                                     |

渠道提供历史记录时，会使用以下内容包装：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于非直接聊天（群组/渠道/房间），当前消息正文会添加发送者标签作为前缀，其样式与历史记录条目一致。指令移除仅适用于当前消息部分，因此历史记录会保持完整。包装历史记录的渠道应将 `BodyForCommands`（或旧版 `CommandBody` / `RawBody`）设为原始消息文本，并将 `Body` 保留为合并后的提示。

历史缓冲区仅包含待处理内容：它们包含未触发运行的群组消息（例如受提及门控的消息），并排除会话转录记录中已有的消息。结构化历史记录、回复、转发和渠道元数据会在提示组装期间渲染为不受信任的用户角色上下文块。

使用 `messages.groupChat.historyLimit`（全局默认值）或 `channels.slack.historyLimit`、`channels.telegram.accounts.<id>.historyLimit` 等按渠道覆盖配置历史记录大小（设置 `0` 可禁用）。

## 工具结果元数据

工具结果的 `content` 是模型可见的结果；`details` 是用于 UI 渲染、诊断、媒体投递和插件的运行时元数据。

- `toolResult.details` 会在提供商重放前以及作为压缩输入前被移除。
- 持久化的会话转录记录仅保留有界的 `details`；过大的元数据会替换为标记为 `persistedDetailsTruncated: true` 的精简摘要。
- 插件和工具应将模型必须读取的文本放入 `content`，而不能只放入 `details`。

## 排队和后续消息

已有运行处于活动状态时，入站消息默认会引导进入该运行。`messages.queue` 控制模式：

| 模式              | 行为                                            |
| ----------------- | --------------------------------------------------- |
| `steer`（默认） | 将新提示注入活动运行。          |
| `followup`        | 在活动运行结束后运行该消息。      |
| `collect`         | 将兼容消息合并到后续的一个轮次中。      |
| `interrupt`       | 中止活动运行，然后启动最新的提示。 |

默认值：`messages.queue.debounceMs` 为 500ms（同样适用于引导、后续消息和收集合并），`messages.queue.cap` 为 20 条排队消息，`messages.queue.drop` 为 `summarize`（也可使用 `old` 和 `new`）。通过 `messages.queue.byChannel` 和 `messages.queue.debounceMsByChannel` 配置按渠道覆盖项。

详情：[命令队列](/zh-CN/concepts/queue)和[Steering queue](/zh-CN/concepts/queue-steering)。

## 渠道运行所有权

在消息进入会话队列之前，渠道插件可以维持顺序、对输入进行防抖并施加传输背压。它们不应在智能体轮次本身外部设置单独的超时。消息路由到会话后，由会话、工具和运行时生命周期管理长时间运行的工作，以便所有渠道都能以一致方式报告缓慢轮次并从中恢复。

## 流式传输、分块和合并

分块流式传输会在模型生成文本块时发送部分回复；分块会遵守渠道文本限制，并避免拆分围栏代码。

- `agents.defaults.blockStreamingDefault`（`on|off`，默认值为 `off`）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲时间合并）
- `agents.defaults.humanDelay`（分块回复之间模拟人工停顿）
- 渠道覆盖配置：内置渠道上的 `*.streaming.block.enabled` 和 `*.streaming.block.coalesce`；`openclaw doctor --fix` 会迁移过时的扁平键。除非明确启用，否则每个渠道（包括 Telegram）的分块流式传输均处于关闭状态。QQ Bot 是例外：它没有 `streaming.block` 键，并且会流式传输分块回复，除非 `channels.qqbot.streaming.mode` 为 `"off"`。

详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和令牌

- `/reasoning on|off|stream` 控制可见性。
- 模型生成的推理内容仍会计入令牌用量。
- Telegram 支持将推理以流式方式传输到临时草稿气泡中，并在最终投递后删除该气泡；如需持久保留推理输出，请使用 `/reasoning on`。

详情：[思考 + 推理指令](/zh-CN/tools/thinking)和[令牌用量](/zh-CN/reference/token-use)。

## 前缀、线程和回复

- 出站前缀级联：`messages.responsePrefix`、`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。WhatsApp 还提供用于入站前缀的 `channels.whatsapp.messagePrefix`。
- 通过 `replyToMode` 和按渠道默认值配置回复线程。

详情：[配置](/zh-CN/gateway/config-agents#messages)和渠道文档。

## 静默回复

静默令牌 `NO_REPLY`（不区分大小写，因此 `no_reply` 也匹配）表示“不投递用户可见的回复”。当某个轮次还有待处理的工具媒体（例如生成的 TTS 音频）时，OpenClaw 会移除静默文本，但仍会投递媒体附件。

静默策略按对话类型解析：

- 直接对话绝不会收到 `NO_REPLY` 提示指导。如果直接运行意外返回单独的静默令牌，OpenClaw 会将其抑制，而不是改写或投递。
- 群组/渠道默认允许静默。在 `message_tool` 可见回复模式下，静默表示模型不调用 `message(action=send)`。
- 内部编排默认允许静默。

默认值位于 `agents.defaults.silentReply` 下；`surfaces.<id>.silentReply` 可按界面覆盖群组/内部策略。

OpenClaw 还会对非直接聊天中的通用内部运行器故障使用静默回复，这样群组/渠道就不会看到 Gateway 网关错误样板文本。带有面向用户的恢复说明的已分类故障（例如缺少身份验证、速率限制或过载通知）仍可投递。直接聊天默认显示精简的故障说明；仅当启用 `/verbose full` 时才显示原始运行器详情。

所有界面都会丢弃单独的静默回复，因此父会话会保持安静，而不会将哨兵文本改写为兜底闲聊。

## 相关内容

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor) - 面向持久化收发的目标设计
- [流式传输](/zh-CN/concepts/streaming) - 实时消息投递
- [重试](/zh-CN/concepts/retry) - 消息投递重试行为
- [队列](/zh-CN/concepts/queue) - 消息处理队列
- [渠道](/zh-CN/channels) - 消息平台集成
