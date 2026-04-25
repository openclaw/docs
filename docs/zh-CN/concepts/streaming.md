---
read_when:
    - 解释流式传输或分块处理如何在渠道中工作
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复或过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块处理
x-i18n:
    generated_at: "2026-04-25T04:09:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29faf5c6f39f4a9ebf149b94f5945bd1454b4d4112f557f5cb20b4f1c7f72346
    source_path: concepts/streaming.md
    workflow: 15
---

# 流式传输 + 分块处理

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写作时，按已完成的 **块** 发出。这些是正常的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新临时的**预览消息**。

目前**没有真正的 token 增量流式传输**到渠道消息。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，将其以较粗粒度的片段发送出去。

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

- `text_delta/events`：模型流事件（对于非流式模型，可能很稀疏）。
- `chunker`：应用最小/最大边界和断点偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际发出的消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及每账号变体）可按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行即段落边界拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），用于拆分过高的回复以避免 UI 裁切。

**边界语义：**

- `text_end`：只要 chunker 发出块就立即流式发送；每次 `text_end` 时刷新。
- `message_end`：等助手消息完成后，再刷新缓冲的输出。

即使在 `message_end` 下，如果缓冲文本超过 `maxChars`，仍会使用 chunker，因此可以在结束时发出多个分块。

## 分块算法（低/高边界）

分块处理由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区 >= `minChars` 之前不发出（除非强制）。
- **高边界：** 优先在 `maxChars` 之前拆分；如果必须强制拆分，则在 `maxChars` 处切开。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬拆分。
- **代码围栏：** 绝不在围栏内部拆分；如果必须在 `maxChars` 处强制拆分，则会先关闭再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此你不能超过各渠道的上限。

## 合并（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块片段**。这样既能提供渐进式输出，又能减少“单行刷屏”。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超出时会刷新。
- `minChars` 会阻止过小片段发送，直到积累了足够文本（最终刷新总会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference` 推导而来（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 进行渠道级覆盖（包括每账号配置）。
- 对于 Signal/Slack/Discord，除非另有覆盖，默认的合并 `minChars` 会提升到 1500。

## 分块之间的类人节奏延迟

启用分块流式传输时，你可以在分块回复之间加入**随机暂停**（第一个分块之后）。这样多气泡回复会显得更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分块还是一次性发送全部”

这对应为：

- **流式发送分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发出）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在结束时发送全部：** `blockStreamingBreak: "message_end"`（刷新一次；如果很长，可能仍拆成多个分块）。
- **不使用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 分块流式传输默认**关闭**，除非显式将 `*.blockStreaming` 设为 `true`。渠道可以在没有分块回复的情况下，使用 `channels.<channel>.streaming` 流式显示实时预览。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不在根配置中。

## 预览流式传输模式

规范键名：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单个预览，用最新文本替换。
- `block`：预览以分块/追加的方式更新。
- `progress`：生成期间显示进度/状态预览，完成后显示最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅ | ✅ | ✅ | 映射为 `partial` |
| Discord | ✅ | ✅ | ✅ | 映射为 `partial` |
| Slack | ✅ | ✅ | ✅ | ✅ |
| Mattermost | ✅ | ✅ | ✅ | ✅ |

仅 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 控制是否启用 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要一个回复线程目标；顶层私信不会显示这种线程式预览。

旧键迁移：

- Telegram：`streamMode` 和布尔值 `streaming` 会自动迁移到 `streaming` 枚举。
- Discord：`streamMode` 和布尔值 `streaming` 会自动迁移到 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔值 `streaming` 会自动迁移到 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中，使用 `sendMessage` + `editMessageText` 更新预览。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理内容写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复载荷会取消待处理的预览，而不会刷新新的草稿，然后改用正常投递。

Slack：

- `partial` 在可用时可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后显示最终答案。
- 原生预览流式传输和草稿预览流式传输都会抑制该轮的分块回复，因此 Slack 回复只会通过一条投递路径进行流式传输。
- 最终媒体/错误载荷和进度最终结果不会创建一次性草稿消息；只有可以编辑预览的文本/块最终结果才会刷新待处理的草稿文本。

Mattermost：

- 将 thinking、工具活动和部分回复文本流式写入单个草稿预览帖子，在最终答案可安全发送时原地完成。
- 如果预览帖子已被删除或在完成时不可用，则回退为发送一个新的最终帖子。
- 最终媒体/错误载荷会在正常投递前取消待处理的预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 纯媒体、错误和回复目标不匹配的最终结果会在正常投递前取消待处理的预览更新；已经可见的陈旧预览会被撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“正在搜索网页”、“正在读取文件”或“正在调用工具”这样的简短状态行——在工具运行期间，这些状态会出现在同一个预览消息中，先于最终回复显示。这让多步骤工具回合在视觉上保持活跃，而不是在第一次 thinking 预览和最终答案之间一片沉默。

支持的界面：

- 当预览流式传输处于激活状态时，**Discord**、**Slack** 和 **Telegram** 默认会将工具进度流式写入实时预览编辑中。
- 自 `v2026.4.22` 起，Telegram 已发布并默认启用工具进度预览更新；保持启用可维持这一已发布行为。
- **Mattermost** 已经会将工具活动折叠进其单一草稿预览帖子中（见上文）。
- 工具进度编辑遵循当前激活的预览流式传输模式；当预览流式传输为 `off`，或消息已由分块流式传输接管时，会跳过这些更新。
- 若要保留预览流式传输但隐藏工具进度行，请为该渠道将 `streaming.preview.toolProgress` 设为 `false`。若要完全禁用预览编辑，请将 `streaming.mode` 设为 `off`。

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
