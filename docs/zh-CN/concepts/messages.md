---
read_when:
    - 说明入站消息如何变成回复
    - 说明会话、排队模式或流式传输行为
    - 记录推理可见性及其使用影响
summary: 消息流、会话、队列处理与推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-30T00:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 通过会话解析、排队、流式传输、工具执行和推理可见性组成的管道处理入站消息。本页说明从入站消息到回复的路径。

## 消息流（高层级）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键调节项位于配置中：

- `messages.*` 用于前缀、排队和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖项（`channels.whatsapp.*`、`channels.telegram.*` 等）用于上限和流式传输开关。

完整 schema 见 [配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道可能会在重连后重新投递同一条消息。OpenClaw 会保留一个短期缓存，以渠道/账号/对端/会话/消息 ID 作为键，这样重复投递就不会触发另一次智能体运行。

## 入站防抖

来自**同一发送者**的快速连续消息可以通过 `messages.inbound` 合并到单个智能体轮次中。防抖按渠道 + 对话划分作用域，并使用最新消息进行回复串接/ID 关联。

配置（全局默认值 + 按渠道覆盖）：

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

说明：

- 防抖适用于**纯文本**消息；媒体/附件会立即刷新。
- 控制命令会绕过防抖，因此它们保持独立，**但**当某个渠道明确选择加入同一发送者私信合并时除外（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-CN/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），此时私信命令会在防抖窗口内等待，以便拆分发送的载荷可以加入同一个智能体轮次。

## 会话和设备

会话由 Gateway 网关拥有，而不是由客户端拥有。

- 直接聊天会折叠到智能体主会话键。
- 群组/渠道会获得自己的会话键。
- 会话存储和转录记录位于 Gateway 网关主机上。

多个设备/渠道可以映射到同一个会话，但历史记录不会完整同步回每个客户端。建议：长对话使用一个主设备，以避免上下文分歧。控制 UI 和 TUI 始终显示由 Gateway 网关支持的会话转录记录，因此它们是真实来源。

详情：[会话管理](/zh-CN/concepts/session)。

## 工具结果元数据

工具结果 `content` 是模型可见的结果。工具结果 `details` 是用于 UI 渲染、诊断、媒体投递和插件的运行时元数据。

OpenClaw 会明确保持该边界：

- `toolResult.details` 会在提供商重放和压缩输入之前被剥离。
- 持久化的会话转录记录只保留有界的 `details`；过大的元数据会替换为标记了 `persistedDetailsTruncated: true` 的紧凑摘要。
- 插件和工具应将模型必须读取的文本放入 `content`，而不只是放入 `details`。

## 入站正文和历史上下文

OpenClaw 将**提示词正文**与**命令正文**分开：

- `Body`：发送给智能体的提示文本。这可能包括渠道信封和可选历史包装器。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧版别名（为兼容性保留）。

当某个渠道提供历史记录时，它会使用共享包装器：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非直接聊天**（群组/渠道/房间），**当前消息正文**会加上发送者标签前缀（与历史条目使用的样式相同）。这能让智能体提示词中的实时消息和排队/历史消息保持一致。

历史缓冲区是**仅待处理**的：它们包含没有触发运行的群组消息（例如受提及门控的消息），并且**排除**已经在会话转录记录中的消息。

指令剥离只适用于**当前消息**部分，因此历史记录保持完整。包装历史记录的渠道应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，并将 `Body` 保持为组合后的提示词。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及按渠道覆盖项配置，例如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`（设为 `0` 可禁用）。

## 排队和跟进

如果已有运行处于活动状态，入站消息可以被排队、引导进当前运行，或收集到一个跟进轮次中。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）配置。
- 默认模式是 `steer`，当引导回退到排队跟进投递时，会使用 500ms 的跟进防抖。
- 模式：`steer`、`followup`、`collect`、`steer-backlog`、`interrupt`，以及旧版一次一个的 `queue` 模式。

详情：[命令队列](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

## 渠道运行所有权

渠道插件可以在消息进入会话队列前保留顺序、防抖输入，并应用传输背压。它们不应围绕智能体轮次本身施加单独的超时。一旦消息被路由到某个会话，长时间运行的工作就由会话、工具和运行时生命周期管理，这样所有渠道都能一致地报告并从缓慢轮次中恢复。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复。分块会遵守渠道文本限制，并避免拆分围栏代码。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲的批处理）
- `agents.defaults.humanDelay`（分块回复之间类似人类的停顿）
- 渠道覆盖项：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以显示或隐藏模型推理：

- `/reasoning on|off|stream` 控制可见性。
- 推理内容由模型生成时，仍会计入 token 使用量。
- Telegram 支持将推理流式传输到草稿气泡中。

详情：[思考 + 推理指令](/zh-CN/tools/thinking) 和 [Token 使用](/zh-CN/reference/token-use)。

## 前缀、串接和回复

出站消息格式集中在 `messages` 中：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和按渠道默认值进行回复串接

详情：[配置](/zh-CN/gateway/config-agents#messages) 和渠道文档。

## 静默回复

确切的静默 token `NO_REPLY` / `no_reply` 表示“不要投递用户可见的回复”。当某个轮次还有待处理的工具媒体（例如生成的 TTS 音频）时，OpenClaw 会剥离静默文本，但仍会投递媒体附件。OpenClaw 会按对话类型解析该行为：

- 直接对话默认不允许静默，并会将单独的静默回复重写为简短的可见兜底回复。
- 群组/渠道默认允许静默。
- 内部编排默认允许静默。

OpenClaw 还会对发生在非直接聊天中任何助手回复之前的内部运行器失败使用静默回复，因此群组/渠道不会看到 Gateway 网关错误样板文本。直接聊天默认显示紧凑的失败文案；只有当 `/verbose` 为 `on` 或 `full` 时，才会显示原始运行器详情。

默认值位于 `agents.defaults.silentReply` 和 `agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和 `surfaces.<id>.silentReplyRewrite` 可以按 surface 覆盖它们。

当父会话有一个或多个待处理的已生成子智能体运行时，单独的静默回复会在所有 surface 上被丢弃而不是被重写，因此父会话会保持安静，直到子完成事件投递真正的回复。

## 相关

- [流式传输](/zh-CN/concepts/streaming) — 实时消息投递
- [重试](/zh-CN/concepts/retry) — 消息投递重试行为
- [队列](/zh-CN/concepts/queue) — 消息处理队列
- [渠道](/zh-CN/channels) — 消息平台集成
