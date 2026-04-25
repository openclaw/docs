---
read_when:
    - 解释渠道上的流式传输或分块处理如何工作
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复或过早的分块回复，或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块处理
x-i18n:
    generated_at: "2026-04-25T05:54:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62ef14522254bace9af6966c97fdf16d7ac72e84dbb9d26af7d80f120715a650
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写作时，发送已完成的 **块**。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新一条临时的 **预览消息**。

当前**没有真正的 token 增量流式传输**发送到渠道消息。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的块发送内容。

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
- `chunker`：`EmbeddedBlockChunker`，应用最小/最大边界以及断点偏好。
- `channel send`：实际发出的消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖项：`*.blockStreaming`（以及每个账号的变体），用于按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行即段落边界拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），会拆分过高的回复以避免 UI 截断。

**边界语义：**

- `text_end`：只要 chunker 产出块就立即流式发送；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

即使是 `message_end`，如果缓冲文本超过 `maxChars`，仍然会使用 chunker，因此它可能在结尾产出多个块。

### 分块流式传输中的媒体投递

`MEDIA:` 指令是普通的投递元数据。当分块流式传输提前发送了一个媒体块时，OpenClaw 会为该轮次记住这次投递。如果最终的助手负载重复了相同的媒体 URL，最终投递会去掉重复媒体，而不是再次发送附件。

完全重复的最终负载会被抑制。如果最终负载在已经流式发送过的媒体周围新增了不同的文本，OpenClaw 仍会发送这些新文本，同时保持媒体只投递一次。这可以避免在 Telegram 等渠道中，当智能体在流式传输期间输出 `MEDIA:` 且提供商也在完成回复中包含它时，出现重复的语音笔记或文件。

## 分块算法（低/高边界）

分块逻辑由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不发送（除非被强制刷新）。
- **高边界：** 优先在 `maxChars` 之前断开；如果被强制，则在 `maxChars` 处断开。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬断开。
- **代码围栏：** 绝不在围栏内部拆分；如果在 `maxChars` 处被强制拆分，会先关闭再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此你不能超过每个渠道的上限。

## 合并（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的块分片**。这样既能提供渐进式输出，又能减少“单行刷屏”。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会刷新。
- `minChars` 会阻止过小片段被提前发送，直到积累了足够的文本（最终刷新时始终会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference` 推导而来（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 提供渠道覆盖项（包括每账号配置）。
- 除非被覆盖，否则 Signal/Slack/Discord 的默认合并 `minChars` 会提升到 1500。

## 块之间更像人类的节奏

启用分块流式传输时，你可以在各个分块回复之间加入**随机暂停**（首个块之后）。这样多气泡回复会显得更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分块还是最后一次性发送”

这对应为：

- **流式发送分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发送）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在结尾一次性流式发送全部内容：** `blockStreamingBreak: "message_end"`（刷新一次；如果非常长，可能仍会分成多个块）。
- **不使用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 除非显式设置 `*.blockStreaming` 为 `true`，否则分块流式传输**默认关闭**。渠道可以在没有分块回复的情况下流式发送实时预览（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单一预览，用最新文本替换。
- `block`：以分块/追加的方式更新预览。
- `progress`：生成期间显示进度/状态预览，完成时再发送最终答案。

### 渠道映射

| Channel    | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 映射为 `partial` |
| Discord    | ✅    | ✅        | ✅      | 映射为 `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 控制是否使用 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要一个回复线程目标；顶层私信不会显示这种线程式预览。

旧键迁移：

- Telegram：`streamMode` 和布尔值 `streaming` 会自动迁移为 `streaming` 枚举。
- Discord：`streamMode` 和布尔值 `streaming` 会自动迁移为 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移为 `streaming.mode`；布尔值 `streaming` 会自动迁移为 `streaming.mode` 加 `streaming.nativeTransport`；旧的 `nativeStreaming` 会自动迁移为 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中，使用 `sendMessage` + `editMessageText` 更新预览。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将 reasoning 写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复负载会取消待处理的预览而不刷新新的草稿，然后使用正常投递。

Slack：

- `partial` 在可用时可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后再发送最终答案。
- 原生和草稿预览流式传输会抑制该轮次的分块回复，因此一条 Slack 回复只会通过一种投递路径流式发送。
- 最终媒体/错误负载以及 progress 最终结果不会创建一次性草稿消息；只有能够编辑预览的文本/块最终结果才会刷新待处理的草稿文本。

Mattermost：

- 将思考过程、工具活动和部分回复文本流式写入同一条草稿预览帖子，并在最终答案可以安全发送时原地完成。
- 如果预览帖子已被删除或在最终化时不可用，则会回退为发送一条新的最终帖子。
- 最终媒体/错误负载会在正常投递前取消待处理的预览更新，而不是刷新一条临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 仅媒体、错误以及回复目标不匹配的最终结果会在正常投递前取消待处理的预览更新；已经可见的陈旧预览会被撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“正在搜索网络”“正在读取文件”或“正在调用工具”之类的简短状态行——在工具运行期间，这些内容会显示在同一条预览消息中，并先于最终回复出现。这样可以让多步骤工具轮次在视觉上保持活跃，而不是在第一次思考预览和最终答案之间沉默无声。

支持的表面：

- 当预览流式传输处于活动状态时，**Discord**、**Slack** 和 **Telegram** 默认会将工具进度流式写入实时预览编辑中。
- 从 `v2026.4.22` 起，Telegram 已默认启用工具进度预览更新；保持启用可保留这一已发布行为。
- **Mattermost** 已经会将工具活动整合进它的单一草稿预览帖子中（见上文）。
- 工具进度编辑遵循当前激活的预览流式传输模式；当预览流式传输为 `off`，或分块流式传输已经接管该消息时，会跳过这些编辑。
- 若要保留预览流式传输但隐藏工具进度行，请将该渠道的 `streaming.preview.toolProgress` 设为 `false`。若要完全禁用预览编辑，请将 `streaming.mode` 设为 `off`。

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

- [消息](/zh-CN/concepts/messages) — 消息生命周期和投递
- [重试](/zh-CN/concepts/retry) — 投递失败时的重试行为
- [渠道](/zh-CN/channels) — 各渠道的流式传输支持
