---
read_when:
    - 解释流式传输或分块处理在渠道中的工作方式
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复或过早的分块回复，或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块处理
x-i18n:
    generated_at: "2026-04-25T12:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：** 当助手写作时，发出已完成的**块**。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新一条临时的**预览消息**。

目前**没有真正的 token 增量流式传输**直接发送到渠道消息。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的分块发送。

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

- `text_delta/events`：模型流事件（对于非流式模型，事件可能较少）。
- `chunker`：`EmbeddedBlockChunker`，应用最小/最大边界和断点偏好。
- `channel send`：实际发出的消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖项：`*.blockStreaming`（以及每账号变体）可按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并流式分块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`；`newline` 会先按空行〈段落边界〉拆分，再按长度拆分）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），用于拆分过高的回复以避免 UI 截断。

**边界语义：**

- `text_end`：一旦 chunker 发出块就立即流式输出；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

即使在 `message_end` 下，如果缓冲文本超过 `maxChars`，仍然会使用 chunker，因此它可能在末尾发出多个分块。

### 分块流式传输中的媒体投递

`MEDIA:` 指令是普通的投递元数据。当分块流式传输提前发送一个媒体块时，OpenClaw 会为该轮次记住这次投递。如果最终的助手负载重复包含相同的媒体 URL，最终投递会移除重复媒体，而不是再次发送附件。

完全相同的最终负载会被抑制。如果最终负载在已流式发送过的媒体周围添加了不同的文本，OpenClaw 仍会发送新文本，同时保持媒体只投递一次。这样可以避免在 Telegram 等渠道上出现重复的语音消息或文件：例如智能体在流式传输期间发出了 `MEDIA:`，而提供商又在完整回复中再次包含了它。

## 分块算法（低/高边界）

分块处理由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不发出内容（除非被强制刷新）。
- **高边界：** 优先在 `maxChars` 之前分割；如果必须强制分割，则在 `maxChars` 处切分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬切分。
- **代码围栏：** 绝不在围栏内部切分；如果必须在 `maxChars` 处强制切分，会先关闭再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制在渠道的 `textChunkLimit` 以内，因此你不能超过每个渠道的上限。

## 合并（合并流式分块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块**。这样既能提供渐进式输出，又能减少“单行刷屏”。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会立即刷新。
- `minChars` 可防止过小的片段过早发送，直到积累足够文本（最终刷新时始终会发送剩余文本）。
- 连接符取决于 `blockStreamingChunk.breakPreference`
  （`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 提供渠道覆盖项（包括每账号配置）。
- 对于 Signal/Slack/Discord，默认的合并 `minChars` 会提升到 1500，除非被覆盖。

## 块与块之间的人类式节奏

启用分块流式传输时，你可以在分块回复之间加入**随机暂停**（第一块之后）。这会让多气泡回复感觉更自然。

- 配置：`agents.defaults.humanDelay`（也可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500 ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分块”还是“一次性发送全部”

它映射为：

- **流式发送分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发送）。非 Telegram 渠道还需要设置 `*.blockStreaming: true`。
- **在末尾一次性流式发送全部：** `blockStreamingBreak: "message_end"`（刷新一次；如果非常长，可能仍会分成多个块）。
- **无分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 分块流式传输默认**关闭**，除非显式将 `*.blockStreaming` 设为 `true`。渠道可以在没有分块回复的情况下流式显示实时预览（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单个预览，始终替换为最新文本。
- `block`：预览以分块/追加的方式更新。
- `progress`：生成期间显示进度/状态预览，完成时显示最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 映射为 `partial` |
| Discord    | ✅    | ✅        | ✅      | 映射为 `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅限 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 控制是否调用 Slack 原生流式 API（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要回复线程目标；顶层私信不会显示这种线程式预览。

旧键迁移：

- Telegram：旧版 `streamMode` 以及标量/布尔 `streaming` 值，会由 doctor/config 兼容路径检测并迁移到 `streaming.mode`。
- Discord：`streamMode` + 布尔 `streaming` 会自动迁移到 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔 `streaming` 会自动迁移到 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中使用 `sendMessage` + `editMessageText` 更新预览。
- 如果显式启用了 Telegram 分块流式传输，则会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理内容写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 如果显式启用了 Discord 分块流式传输，则会跳过预览流式传输。
- 最终媒体、错误和显式回复负载会取消待处理的预览，而不会刷新新的草稿，然后使用正常投递。

Slack：

- `partial` 在可用时可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后发送最终答案。
- 原生流式传输和草稿预览流式传输会在该轮次抑制分块回复，因此 Slack 回复只会通过一种投递路径流式发送。
- 最终媒体/错误负载和 `progress` 最终结果不会创建一次性草稿消息；只有能够编辑预览的文本/块最终结果才会刷新待处理的草稿文本。

Mattermost：

- 将 thinking、工具活动和部分回复文本流式写入单个草稿预览帖子，并在最终答案可以安全发送时原地完成。
- 如果预览帖子已被删除或在完成时不可用，则回退为发送一个新的最终帖子。
- 最终媒体/错误负载会在正常投递前取消待处理的预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 仅媒体、错误和回复目标不匹配的最终结果会在正常投递前取消待处理的预览更新；已可见的陈旧预览会被撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“正在搜索网络”“正在读取文件”或“正在调用工具”之类的简短状态行——这些内容会在工具运行期间出现在同一条预览消息中，先于最终回复显示。这样，多步骤工具轮次在视觉上会保持“有动静”，而不是在最初的 thinking 预览和最终答案之间一片沉默。

支持的界面：

- 当预览流式传输处于启用状态时，**Discord**、**Slack** 和 **Telegram** 默认都会把工具进度流式写入实时预览编辑中。
- Telegram 自 `v2026.4.22` 起已启用工具进度预览更新；保持启用可保留该已发布行为。
- **Mattermost** 已经将工具活动合并到它的单一草稿预览帖子中（见上文）。
- 工具进度编辑遵循当前启用的预览流式传输模式；当预览流式传输为 `off`，或当消息已由分块流式传输接管时，会跳过这些更新。
- 如果你希望保留预览流式传输，但隐藏工具进度行，请将该渠道的 `streaming.preview.toolProgress` 设为 `false`。若要完全禁用预览编辑，请将 `streaming.mode` 设为 `off`。

示例：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## 相关内容

- [Messages](/zh-CN/concepts/messages) — 消息生命周期和投递
- [Retry](/zh-CN/concepts/retry) — 投递失败时的重试行为
- [Channels](/zh-CN/channels) — 各渠道的流式传输支持
