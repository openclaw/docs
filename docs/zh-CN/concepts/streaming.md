---
read_when:
    - 解释渠道上的流式传输或分块处理如何工作
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复/过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输与分块处理
x-i18n:
    generated_at: "2026-04-21T20:11:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca91815fb44c0d0283dcfbcec44fb016e07a841e538b5cb4baab18d441a86730
    source_path: concepts/streaming.md
    workflow: 15
---

# 流式传输 + 分块处理

OpenClaw 有两个彼此独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写入时，输出已完成的**块**。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新一条临时的**预览消息**。

目前**没有真正的 token 增量流式传输**发送到渠道消息。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的分段发送。

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

图例：

- `text_delta/events`：模型流事件（对于非流式模型，事件可能很稀疏）。
- `chunker`：`EmbeddedBlockChunker`，应用最小/最大边界 + 断点偏好。
- `channel send`：实际发出的消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账户划分的变体），可按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行〔段落边界〕拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），会拆分过高的回复以避免 UI 截断。

**边界语义：**

- `text_end`：一旦 chunker 输出块就立即流式发送；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

即使是 `message_end`，如果缓冲文本超过 `maxChars`，仍然会使用 chunker，因此它可能在结尾输出多个分块。

## 分块算法（低/高边界）

分块处理由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不输出（除非被强制输出）。
- **高边界：** 优先在 `maxChars` 之前拆分；如果必须强制拆分，就在 `maxChars` 处切分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬拆分。
- **代码围栏：** 绝不在围栏内部拆分；如果必须在 `maxChars` 处强制拆分，会先闭合再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制在渠道的 `textChunkLimit` 以内，因此你不能超过各渠道的上限。

## 合并（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块**。
这样既能保留渐进式输出，又能减少“单行刷屏”。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会立即刷新。
- `minChars` 会阻止过小的片段过早发送，直到累积足够文本
  （最终刷新时始终会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference` 推导而来
  （`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 提供渠道级覆盖（包括按账户配置）。
- 除非另有覆盖，对于 Signal/Slack/Discord，默认合并 `minChars` 会提升到 1500。

## 块之间的人类式节奏

启用分块流式传输时，你可以在各个分块回复之间加入**随机暂停**
（首个分块之后）。这会让多气泡回复显得更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式输出分块”还是“最后一次性输出”

这对应到：

- **流式输出分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边输出）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在结尾一次性输出全部：** `blockStreamingBreak: "message_end"`（只在最后刷新一次；如果内容很长，可能仍会拆成多个分块）。
- **不使用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 只有在明确设置
`*.blockStreaming: true` 时，才会启用分块流式传输。渠道可以在没有分块回复的情况下启用实时预览
（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键名：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：使用单个预览，用最新文本替换其内容。
- `block`：以分块/追加的方式更新预览。
- `progress`：生成期间显示进度/状态预览，完成时输出最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 映射为 `partial` |
| Discord    | ✅    | ✅        | ✅      | 映射为 `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅限 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 用于切换 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输以及 Slack 助手线程状态都需要一个回复线程目标；顶层私信不会显示这种线程式预览。

旧键迁移：

- Telegram：`streamMode` + 布尔值 `streaming` 会自动迁移到 `streaming` 枚举。
- Discord：`streamMode` + 布尔值 `streaming` 会自动迁移到 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔值 `streaming` 会自动迁移到 `streaming.mode` + `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中，使用 `sendMessage` + `editMessageText` 更新预览。
- 当明确启用了 Telegram 分块流式传输时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理内容写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当明确启用了 Discord 分块流式传输时，会跳过预览流式传输。

Slack：

- `partial` 在可用时可使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后输出最终答案。

Mattermost：

- 将思考、工具活动和部分回复文本流式写入单条草稿预览帖子，并在最终答案可安全发送时原地完成该帖子。
- 如果预览帖子已被删除或在最终完成时不可用，则回退为发送一条新的最终帖子。

## 相关内容

- [Messages](/zh-CN/concepts/messages) —— 消息生命周期与投递
- [Retry](/zh-CN/concepts/retry) —— 投递失败时的重试行为
- [Channels](/zh-CN/channels) —— 各渠道的流式传输支持
