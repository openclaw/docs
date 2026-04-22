---
read_when:
    - 解释渠道上的流式传输或分块处理如何工作
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复或过早的分块回复，或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块处理
x-i18n:
    generated_at: "2026-04-22T01:34:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# 流式传输 + 分块处理

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写入时发送已完成的 **块**。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新临时的 **预览消息**。

当前不会将真正的 token 增量流式传输到渠道消息中。预览流式传输基于消息（发送 + 编辑/追加）。

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

- `text_delta/events`：模型流事件（对于非流式模型可能较稀疏）。
- `chunker`：应用最小/最大边界和断点偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际发出的消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账户区分的变体），用于按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（发送前合并已流出的块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行即段落边界拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），用于拆分过高的回复，避免 UI 裁切。

**边界语义：**

- `text_end`：只要 chunker 产出块就立即流出；每次 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

`message_end` 在缓冲文本超过 `maxChars` 时仍会使用 chunker，因此它可以在结束时输出多个块。

## 分块算法（低/高边界）

分块处理由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区长度达到 `minChars` 之前不输出（除非被强制输出）。
- **高边界：** 尽量在 `maxChars` 之前切分；如果必须强制切分，则在 `maxChars` 处切开。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬切分。
- **代码围栏：** 绝不在围栏内部切分；如果必须在 `maxChars` 处强制切分，会先闭合再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此不会超过每个渠道的上限。

## 合并（合并已流出的块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块内容**。这样可以减少“单行刷屏”，同时仍然提供渐进式输出。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超出时会立即刷新。
- `minChars` 会阻止过小的碎片发送，直到累积足够文本（最终刷新总会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference` 推导而来（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 进行渠道级覆盖（包括按账户配置）。
- 对于 Signal/Slack/Discord，默认的合并 `minChars` 会提升到 1500，除非被覆盖。

## 块之间更像人类的节奏

启用分块流式传输时，你可以在分块回复之间加入**随机暂停**（第一块之后）。这样会让多气泡回复感觉更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅应用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分块”还是“最后一次性发送全部内容”

这对应到：

- **流式发送分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边输出）。非 Telegram 渠道还需要设置 `*.blockStreaming: true`。
- **最后一次性流式发送全部内容：** `blockStreamingBreak: "message_end"`（一次刷新，若内容很长则可能分成多个块）。
- **不启用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 分块流式传输默认是**关闭的**，除非显式将 `*.blockStreaming` 设为 `true`。渠道可以在没有分块回复的情况下启用实时预览流式传输（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认项位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键名：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：使用单个预览，并用最新文本替换它。
- `block`：预览以分块/追加的方式逐步更新。
- `progress`：生成期间显示进度/状态预览，完成后再显示最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---- | ----- | --------- | ------- | ---------- |
| Telegram | ✅ | ✅ | ✅ | 映射到 `partial` |
| Discord | ✅ | ✅ | ✅ | 映射到 `partial` |
| Slack | ✅ | ✅ | ✅ | ✅ |
| Mattermost | ✅ | ✅ | ✅ | ✅ |

仅限 Slack：

- `channels.slack.streaming.nativeTransport` 用于在 `channels.slack.streaming.mode="partial"` 时切换 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要一个回复线程目标；顶级私信不会显示这种线程式预览。

旧键迁移：

- Telegram：`streamMode` 和布尔型 `streaming` 会自动迁移到枚举型 `streaming`。
- Discord：`streamMode` 和布尔型 `streaming` 会自动迁移到枚举型 `streaming`。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔型 `streaming` 会自动迁移到 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中，使用 `sendMessage` + `editMessageText` 更新预览。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将 reasoning 写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复负载会取消待处理预览而不刷新新的草稿，然后使用正常投递。

Slack：

- `partial` 在可用时可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后显示最终答案。
- 最终媒体/错误负载和进度最终消息不会创建一次性草稿消息；只有可编辑预览的文本/块最终消息才会刷新待处理草稿文本。

Mattermost：

- 将 thinking、工具活动和部分回复文本流式写入单个草稿预览帖子，并在最终答案可安全发送时原地完成。
- 如果预览帖子在完成时被删除或因其他原因不可用，则回退为发送新的最终帖子。
- 最终媒体/错误负载会在正常投递前取消待处理预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 仅媒体、错误和回复目标不匹配的最终消息会在正常投递前取消待处理预览更新；已显示的陈旧预览会被撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“正在搜索网络”“正在读取文件”或“正在调用工具”这样的简短状态行——在工具运行期间，这些内容会出现在同一条预览消息中，并先于最终回复显示。这样可以让多步骤工具调用在视觉上保持活跃，而不是在最初的 thinking 预览和最终答案之间保持沉默。

支持的界面：

- **Discord**、**Slack** 和 **Telegram** 会将工具进度流式写入实时预览编辑中。
- **Mattermost** 已经将工具活动整合进其单一草稿预览帖子中（见上文）。
- 工具进度编辑遵循当前启用的预览流式传输模式；当预览流式传输为 `off` 或消息已被分块流式传输接管时，会跳过这些更新。

## 相关内容

- [消息](/zh-CN/concepts/messages) —— 消息生命周期与投递
- [重试](/zh-CN/concepts/retry) —— 投递失败时的重试行为
- [渠道](/zh-CN/channels) —— 各渠道的流式传输支持
