---
read_when:
    - 说明入站消息如何变成回复
    - 说明会话、排队模式或流式传输行为
    - 记录推理可见性和用量影响
summary: 消息流、会话、排队和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-04-29T05:40:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5db090a990c48c03f6dc010e211523590d4743aaa0e86fa76bfda0f001e5def
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 通过一条包含会话解析、排队、流式传输、工具执行和推理可见性的流水线处理入站消息。本页说明从入站消息到回复的路径。

## 消息流程（高层）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键开关位于配置中：

- `messages.*` 用于前缀、排队和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖项（`channels.whatsapp.*`、`channels.telegram.*` 等）用于上限和流式传输开关。

完整 schema 见[配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道在重新连接后可能会重新投递同一条消息。OpenClaw 会保留一个短生命周期缓存，以渠道/账号/对端/会话/消息 ID 为键，确保重复投递不会触发另一次智能体运行。

## 入站防抖

来自**同一发送者**的快速连续消息可以通过 `messages.inbound` 批处理成单个智能体轮次。防抖按渠道 + 对话限定范围，并使用最新消息进行回复串联/ID 关联。

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

注意：

- 防抖适用于**仅文本**消息；媒体/附件会立即刷新。
- 控制命令会绕过防抖，以便保持独立；**例外情况**是某个渠道显式选择加入同一发送者私信合并（例如 [BlueBubbles `coalesceSameSenderDms`](/zh-CN/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)），这时私信命令会在防抖窗口内等待，以便拆分发送的载荷可以加入同一个智能体轮次。

## 会话和设备

会话由 Gateway 网关拥有，而不是由客户端拥有。

- 直接聊天会折叠到智能体主会话键中。
- 群组/渠道会获得自己的会话键。
- 会话存储和转录记录位于 Gateway 网关主机上。

多个设备/渠道可以映射到同一个会话，但历史记录不会完整同步回每个客户端。建议：长对话使用一个主设备，以避免上下文分歧。Control UI 和 TUI 始终显示由 Gateway 网关支持的会话转录记录，因此它们是真实来源。

详情：[会话管理](/zh-CN/concepts/session)。

## 工具结果元数据

工具结果 `content` 是模型可见的结果。工具结果 `details` 是用于 UI 渲染、诊断、媒体投递和插件的运行时元数据。

OpenClaw 会明确保持这条边界：

- `toolResult.details` 会在提供商重放和压缩输入之前被剥离。
- 持久化的会话转录记录只保留有界的 `details`；过大的元数据会替换为标记了 `persistedDetailsTruncated: true` 的紧凑摘要。
- 插件和工具应将模型必须读取的文本放在 `content` 中，而不只是放在 `details` 中。

## 入站正文和历史上下文

OpenClaw 会区分**提示正文**和**命令正文**：

- `Body`：发送给智能体的提示文本。这可能包含渠道信封和可选历史包装。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧版别名（为兼容性保留）。

当渠道提供历史记录时，会使用共享包装：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非直接聊天**（群组/渠道/房间），**当前消息正文**会加上发送者标签前缀（与历史条目使用相同样式）。这会让实时消息和已排队/历史消息在智能体提示中保持一致。

历史缓冲区是**仅待处理**的：它们包含未触发运行的群组消息（例如受提及门控的消息），并**排除**已经在会话转录记录中的消息。

指令剥离只适用于**当前消息**部分，因此历史记录保持完整。包装历史记录的渠道应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，并保持 `Body` 为组合后的提示。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认值）以及按渠道覆盖项配置，例如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`（设置为 `0` 可禁用）。

## 排队和跟进

如果已有运行处于活动状态，入站消息可以排队、转向进入当前运行，或收集起来用于跟进轮次。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，以及积压变体。

详情：[排队](/zh-CN/concepts/queue)。

## 渠道运行所有权

渠道插件可以在消息进入会话队列之前保持顺序、对输入进行防抖，并应用传输背压。它们不应围绕智能体轮次本身强加单独的超时。一旦消息被路由到会话，长时间运行的工作就由会话、工具和运行时生命周期管理，这样所有渠道都能一致地报告慢轮次并从中恢复。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复。分块会遵守渠道文本限制，并避免拆分围栏代码。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲的批处理）
- `agents.defaults.humanDelay`（块回复之间的类人暂停）
- 渠道覆盖项：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以公开或隐藏模型推理：

- `/reasoning on|off|stream` 控制可见性。
- 当模型生成推理内容时，它仍会计入 token 用量。
- Telegram 支持将推理流式传输到草稿气泡中。

详情：[思考 + 推理指令](/zh-CN/tools/thinking)和 [Token 使用](/zh-CN/reference/token-use)。

## 前缀、串联和回复

出站消息格式集中在 `messages` 中：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和按渠道默认值实现回复串联

详情：[配置](/zh-CN/gateway/config-agents#messages)和渠道文档。

## 静默回复

精确的静默 token `NO_REPLY` / `no_reply` 表示“不要投递用户可见的回复”。当某个轮次还有待处理的工具媒体（例如生成的 TTS 音频）时，OpenClaw 会剥离静默文本，但仍会投递媒体附件。OpenClaw 按对话类型解析该行为：

- 直接对话默认不允许静默，并会将裸静默回复改写为简短可见的兜底回复。
- 群组/渠道默认允许静默。
- 内部编排默认允许静默。

OpenClaw 还会将静默回复用于非直接聊天中发生在任何助手回复之前的内部运行器失败，这样群组/渠道不会看到 Gateway 网关错误样板。直接聊天默认显示紧凑的失败文案；只有当 `/verbose` 为 `on` 或 `full` 时，才会显示原始运行器详情。

默认值位于 `agents.defaults.silentReply` 和 `agents.defaults.silentReplyRewrite` 下；`surfaces.<id>.silentReply` 和 `surfaces.<id>.silentReplyRewrite` 可以按 surface 覆盖它们。

当父会话有一个或多个待处理的已生成子智能体运行时，所有 surface 上的裸静默回复都会被丢弃，而不是被改写，因此父会话会保持安静，直到子完成事件投递真实回复。

## 相关

- [流式传输](/zh-CN/concepts/streaming) — 实时消息投递
- [重试](/zh-CN/concepts/retry) — 消息投递重试行为
- [队列](/zh-CN/concepts/queue) — 消息处理队列
- [渠道](/zh-CN/channels) — 消息平台集成
