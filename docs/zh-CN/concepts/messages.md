---
read_when:
    - 说明入站消息如何变成回复
    - 说明会话、排队模式或流式传输行为
    - 记录推理可见性和使用影响
summary: 消息流、会话、排队和推理可见性
title: 消息
x-i18n:
    generated_at: "2026-06-27T01:50:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw 通过会话解析、队列、流式传输、工具执行和推理可见性组成的流水线处理入站消息。本页说明从入站消息到回复的路径。

## 消息流（高层级）

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键调节项位于配置中：

- `messages.*` 用于前缀、队列和群组行为。
- `agents.defaults.*` 用于分块流式传输和分块默认值。
- 渠道覆盖项（`channels.whatsapp.*`、`channels.telegram.*` 等）用于上限和流式传输开关。

完整 schema 见 [配置](/zh-CN/gateway/configuration)。

## 入站去重

渠道在重连后可能重新投递同一条消息。OpenClaw 会保留一个短生命周期缓存，按渠道/账号/对端/会话/消息 ID 作为键，确保重复投递不会触发另一次智能体运行。

## 入站防抖

来自**同一发送者**的快速连续消息可以通过 `messages.inbound` 批处理为单个智能体轮次。防抖按渠道 + 对话划定范围，并使用最新消息作为回复线程/ID。

配置（全局默认 + 按渠道覆盖）：

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

- 防抖适用于**仅文本**消息；媒体/附件会立即 flush。
- 控制命令会绕过防抖，因此保持独立。显式选择加入同一发送者私信合并的渠道，可以在防抖窗口内保留私信命令，从而让拆分发送的负载加入同一个智能体轮次。

## 会话和设备

会话由 Gateway 网关拥有，而不是由客户端拥有。

- 直接聊天会折叠到智能体主会话键中。
- 群组/频道会获得自己的会话键。
- 会话存储和转录记录位于 Gateway 网关主机上。

多个设备/渠道可以映射到同一个会话，但历史记录不会完全同步回每个客户端。建议：长对话使用一个主设备，以避免上下文分歧。Control UI 和 TUI 始终显示由 Gateway 网关支持的会话转录记录，因此它们是真实来源。

详情：[会话管理](/zh-CN/concepts/session)。

## 工具结果元数据

工具结果 `content` 是模型可见结果。工具结果 `details` 是用于 UI 渲染、诊断、媒体投递和插件的运行时元数据。

OpenClaw 会明确保持这条边界：

- `toolResult.details` 会在提供商重放和压缩输入前被剥离。
- 持久化的会话转录记录只保留有界的 `details`；过大的元数据会替换为标记了 `persistedDetailsTruncated: true` 的紧凑摘要。
- 插件和工具应将模型必须读取的文本放入 `content`，而不是只放在 `details` 中。

## 入站正文和历史上下文

OpenClaw 将**提示正文**与**命令正文**分开：

- `BodyForAgent`：当前消息面向主模型的文本。渠道插件应保持它聚焦于发送者当前携带提示的文本。
- `Body`：旧版提示 fallback。这可能包含渠道信封和可选历史包装器，但当前渠道在 `BodyForAgent` 可用时，不应依赖它作为主模型输入。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧版别名（为兼容性保留）。

当渠道提供历史记录时，会使用共享包装器：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非直接聊天**（群组/频道/房间），**当前消息正文**会加上发送者标签前缀（与历史条目使用的样式相同）。这让实时消息与队列/历史消息在智能体提示中保持一致。

历史缓冲区是**仅待处理**的：它们包含未触发运行的群组消息（例如受提及门控的消息），并**排除**已经在会话转录记录中的消息。

指令剥离只适用于**当前消息**部分，因此历史记录保持完整。包装历史记录的渠道应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，并将 `Body` 保持为组合后的提示。结构化历史、回复、转发和渠道元数据会在提示组装期间呈现为用户角色的不可信上下文块。
历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认）以及按渠道覆盖项配置，例如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`（设置为 `0` 可禁用）。

## 队列和后续消息

如果某个运行已经处于活动状态，入站消息默认会被 Steer 到当前运行中。`messages.queue` 选择活动运行期间的消息是 Steer、排队稍后处理、收集到稍后的一个轮次，还是中断活动运行。

- 通过 `messages.queue`（以及 `messages.queue.byChannel`）配置。
- 默认模式是 `steer`，Codex steering 批次和后续/收集队列使用 500ms 防抖。
- 模式：`steer`、`followup`、`collect` 和 `interrupt`。

详情：[命令队列](/zh-CN/concepts/queue) 和 [Steering queue](/zh-CN/concepts/queue-steering)。

## 渠道运行所有权

渠道插件可以在消息进入会话队列前保留顺序、防抖输入，并施加传输背压。它们不应围绕智能体轮次本身施加单独的超时。一旦消息路由到某个会话，长时间运行的工作就由会话、工具和运行时生命周期治理，从而让所有渠道一致地报告并从慢轮次中恢复。

## 流式传输、分块和批处理

分块流式传输会在模型生成文本块时发送部分回复。分块会遵守渠道文本限制，并避免拆分 fenced code。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲的批处理）
- `agents.defaults.humanDelay`（分块回复之间类似人类的停顿）
- 渠道覆盖项：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 渠道需要显式设置 `*.blockStreaming: true`）

详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 推理可见性和 token

OpenClaw 可以展示或隐藏模型推理：

- `/reasoning on|off|stream` 控制可见性。
- 当模型生成推理内容时，它仍会计入 token 使用量。
- Telegram 支持将推理流式传输到一个临时草稿气泡中，该气泡会在最终投递后删除；使用 `/reasoning on` 可获得持久推理输出。

详情：[思考 + 推理指令](/zh-CN/tools/thinking) 和 [Token 使用](/zh-CN/reference/token-use)。

## 前缀、线程和回复

出站消息格式集中在 `messages` 中：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和按渠道默认值进行回复线程处理

详情：[配置](/zh-CN/gateway/config-agents#messages) 和渠道文档。

## 静默回复

精确的静默 token `NO_REPLY` / `no_reply` 表示“不投递用户可见回复”。
当某个轮次还有待处理的工具媒体（例如生成的 TTS 音频）时，OpenClaw 会剥离静默文本，但仍会投递媒体附件。
OpenClaw 按对话类型解析该行为：

- 直接对话永远不会收到 `NO_REPLY` 提示指导。如果直接运行意外返回裸静默 token，OpenClaw 会抑制它，而不是改写或投递它。
- 群组/频道默认只允许自动群组回复保持静默。在 `message_tool` 可见回复模式下，静默表示模型不会调用 `message(action=send)`。
- 内部编排默认允许静默。

OpenClaw 还会在非直接聊天中对通用内部 runner 失败使用静默回复，因此群组/频道不会看到 Gateway 网关错误样板。带有面向用户恢复文案的已分类失败（例如缺少凭证、速率限制或过载通知）仍可投递。直接聊天默认显示紧凑失败文案；只有启用 `/verbose full` 时才会显示原始 runner 详情。

默认值位于 `agents.defaults.silentReply` 下；`surfaces.<id>.silentReply` 可以按 surface 覆盖群组/内部策略。

裸静默回复会在所有 surface 上被丢弃，因此父会话会保持安静，而不是把哨兵文本改写成 fallback 闲聊。

## 相关内容

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor) - 持久发送和接收设计目标
- [流式传输](/zh-CN/concepts/streaming) — 实时消息投递
- [重试](/zh-CN/concepts/retry) — 消息投递重试行为
- [队列](/zh-CN/concepts/queue) — 消息处理队列
- [渠道](/zh-CN/channels) — 消息平台集成
