---
read_when:
    - 说明流式传输或分块处理在渠道中的工作方式
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复或过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输与分块处理
x-i18n:
    generated_at: "2026-04-21T20:41:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e550c13ce180bf8f72fced4071926bfe8d24dfb1a419c19c51a64eb9ff216ff1
    source_path: concepts/streaming.md
    workflow: 15
---

# 流式传输 + 分块处理

OpenClaw 有两个彼此独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写作过程中，随着完整的 **块** 生成而发出。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新一条临时的 **预览消息**。

目前，渠道消息**不支持真正的 token 增量流式传输**。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的分块发送内容。

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

- `text_delta/events`：模型流事件（对于非流式模型，可能较为稀疏）。
- `chunker`：应用最小/最大边界 + 断点偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际发出的出站消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及每账号变体）可为每个渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行即段落边界拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），会拆分过高的回复以避免 UI 裁切。

**边界语义：**

- `text_end`：只要 chunker 发出块就立即流式发送；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

即使使用 `message_end`，如果缓冲文本超过 `maxChars`，仍会使用 chunker，因此它可以在结束时发出多个分块。

## 分块算法（低/高边界）

分块流式传输由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不发出内容（除非被强制）。
- **高边界：** 优先在 `maxChars` 之前拆分；如果必须强制拆分，则在 `maxChars` 处切分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬拆分。
- **代码围栏：** 绝不在围栏内部拆分；如果必须在 `maxChars` 处强制拆分，会关闭并重新打开围栏以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此你不能超过每个渠道的上限。

## 合并发送（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块内容**。
这样既能提供渐进式输出，又能减少“单行刷屏”。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会立即刷新。
- `minChars` 可防止过小碎片被发送，直到累计了足够文本
  （最终刷新时总会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference`
  推导得出（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 提供渠道级覆盖（包括每账号配置）。
- 对于 Signal/Slack/Discord，默认的合并 `minChars` 会提升到 1500，除非另有覆盖。

## 分块之间更像人类的节奏

启用分块流式传输时，你可以在
分块回复之间（首个分块之后）加入**随机暂停**。这会让多气泡回复感觉
更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 为每个智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分块”还是“最后一次性发送”

它映射为：

- **流式发送分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发出）。非 Telegram 渠道还需要设置 `*.blockStreaming: true`。
- **在结尾一次性流式发送全部内容：** `blockStreamingBreak: "message_end"`（只刷新一次；如果内容很长，可能仍会拆成多个分块）。
- **不启用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 除非
显式将 `*.blockStreaming` 设为 `true`，否则分块流式传输**默认关闭**。渠道即使没有分块回复，也可以通过
`channels.<channel>.streaming` 流式显示实时预览。

配置位置提醒：`blockStreaming*` 默认项位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键名：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：使用单个预览，并用最新文本替换它。
- `block`：以分块/追加的方式逐步更新预览。
- `progress`：在生成期间显示进度/状态预览，完成时发送最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 映射为 `partial` |
| Discord    | ✅    | ✅        | ✅      | 映射为 `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅 Slack：

- `channels.slack.streaming.nativeTransport` 在 `channels.slack.streaming.mode="partial"` 时切换 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要一个回复线程目标；顶级私信不会显示这种线程式预览。

旧键迁移：

- Telegram：`streamMode` + 布尔型 `streaming` 会自动迁移到 `streaming` 枚举。
- Discord：`streamMode` + 布尔型 `streaming` 会自动迁移到 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔型 `streaming` 会自动迁移到 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中使用 `sendMessage` + `editMessageText` 更新预览。
- 如果显式启用了 Telegram 分块流式传输，则会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理内容写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 如果显式启用了 Discord 分块流式传输，则会跳过预览流式传输。

Slack：

- `partial` 在可用时可使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后发送最终答案。

Mattermost：

- 将 thinking、工具活动和部分回复文本流式写入单个草稿预览帖子，并在最终答案可安全发送时原地完成。
- 如果在完成时预览帖子已被删除或因其他原因不可用，则回退为发送一条新的最终帖子。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“正在搜索网络”“正在读取文件”或“正在调用工具”之类的简短状态行——这些内容会在工具运行期间显示在同一条预览消息中，先于最终回复出现。这样，多步骤的工具回合在视觉上会保持活跃，而不是在首次 thinking 预览和最终答案之间显得沉默。

支持的界面：

- **Discord**、**Slack** 和 **Telegram** 会将工具进度流式写入实时预览编辑中。
- **Mattermost** 已经将工具活动整合进其单一草稿预览帖子中（见上文）。
- 工具进度编辑遵循当前启用的预览流式传输模式；当预览流式传输为 `off`，或当分块流式传输已接管该消息时，会跳过这些更新。

## 相关内容

- [消息](/zh-CN/concepts/messages) — 消息生命周期与投递
- [重试](/zh-CN/concepts/retry) — 投递失败时的重试行为
- [渠道](/zh-CN/channels) — 每个渠道的流式传输支持
