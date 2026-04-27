---
read_when:
    - 解释流式传输或分块处理在渠道中的工作方式
    - 更改分块流式传输或渠道分块处理行为
    - 调试重复或过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块处理行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块处理
x-i18n:
    generated_at: "2026-04-27T20:27:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8210204d146f406320b977efe364ded0a19d233a943053fb1a90e6c59fb74a0f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw 有两个彼此独立的流式传输层：

- **分块流式传输（渠道）：** 在助手写作时，按已完成的**块**发出。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成过程中更新一个临时的**预览消息**。

当前**没有真正的 token 增量流式传输**到渠道消息。预览流式传输是基于消息的（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的块发送。

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
- `chunker`：应用最小/最大边界和断点偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际发出的消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及每账户变体），用于按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行即段落边界拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），用于拆分过高的回复，以避免 UI 裁剪。

**边界语义：**

- `text_end`：只要 chunker 发出块就立即流式发送；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

即使是 `message_end`，如果缓冲文本超过 `maxChars`，仍会使用 chunker，因此它可能在结尾发出多个块。

### 分块流式传输中的媒体投递

`MEDIA:` 指令是普通的投递元数据。当分块流式传输提前发送一个媒体块时，OpenClaw 会为该轮次记住这次投递。如果最终助手载荷重复了相同的媒体 URL，最终投递会去掉重复媒体，而不是再次发送附件。

完全重复的最终载荷会被抑制。如果最终载荷在已经流式发送过的媒体前后新增了不同的文本，OpenClaw 仍会发送这些新文本，同时保持媒体只投递一次。这可以防止在 Telegram 等渠道上出现重复的语音消息或文件：例如，当智能体在流式传输期间发出 `MEDIA:`，而提供商也在完整回复中包含它时，就会发生这种情况。

## 分块算法（低/高边界）

分块处理由 `EmbeddedBlockChunker` 实现：

- **低边界：** 在缓冲区达到 `minChars` 之前不发出（除非强制）。
- **高边界：** 优先在 `maxChars` 之前拆分；如果必须强制拆分，则在 `maxChars` 处拆分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬断开。
- **代码围栏：** 绝不在围栏内部拆分；如果必须在 `maxChars` 处强制拆分，会先关闭再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制在渠道的 `textChunkLimit` 以内，因此你不能超过各渠道的上限。

## 合并（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块片段**。这样可以减少“单行刷屏”，同时仍然提供渐进式输出。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会立即刷新。
- `minChars` 会阻止过小的片段被发送，直到累积足够文本（最终刷新总会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference` 决定（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 提供渠道级覆盖（包括每账户配置）。
- 对于 Signal/Slack/Discord，默认的 coalesce `minChars` 会提升到 1500，除非另有覆盖。

## 块之间更像人的节奏

启用分块流式传输时，你可以在各个分块回复之间加入**随机暂停**（首个块之后）。这会让多气泡回复看起来更自然。

- 配置：`agents.defaults.humanDelay`（也可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式输出分块”还是“一次性输出全部”

这对应于：

- **流式输出分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发出）。非 Telegram 渠道还需要设置 `*.blockStreaming: true`。
- **在结尾一次性流式输出全部：** `blockStreamingBreak: "message_end"`（刷新一次；如果内容很长，仍可能分成多个块）。
- **不使用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 除非显式将 `*.blockStreaming` 设为 `true`，否则分块流式传输**默认关闭**。渠道可以启用实时预览流式传输（`channels.<channel>.streaming`），而不发送分块回复。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单个预览，用最新文本替换。
- `block`：以分块/追加的方式更新预览。
- `progress`：在生成过程中显示进度/状态预览，完成时发送最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 映射为 `partial` |
| Discord    | ✅    | ✅        | ✅      | 映射为 `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅限 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 控制是否使用 Slack 原生流式 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态都需要一个回复线程目标；顶层私信不会显示这种线程式预览。

旧键迁移：

- Telegram：旧版 `streamMode` 以及标量/布尔 `streaming` 值，会由 doctor/config 兼容路径检测并迁移到 `streaming.mode`。
- Discord：`streamMode` + 布尔 `streaming` 会自动迁移到 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔 `streaming` 会自动迁移到 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中使用 `sendMessage` + `editMessageText` 进行预览更新。
- 如果预览已显示大约一分钟，则发送一条新的最终消息，而不是原地编辑，然后清理预览，以便 Telegram 的时间戳反映回复完成时间。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理内容写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复载荷会取消待处理预览，而不会刷新新的草稿，然后改用正常投递。

Slack：

- `partial` 在可用时可使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后发送最终答案。
- 原生和草稿预览流式传输会抑制该轮次的分块回复，因此一条 Slack 回复只会通过一种投递路径进行流式传输。
- 最终媒体/错误载荷和 `progress` 的最终结果不会创建一次性的草稿消息；只有可以编辑预览的文本/块最终结果，才会刷新待处理的草稿文本。

Mattermost：

- 将思考、工具活动和部分回复文本流式写入单个草稿预览帖子；当最终答案可以安全发送时，就地完成。
- 如果预览帖子已被删除或在完成时不可用，则回退为发送一个新的最终帖子。
- 最终媒体/错误载荷会在正常投递前取消待处理的预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 仅媒体、错误以及回复目标不匹配的最终结果，会在正常投递前取消待处理的预览更新；如果已经显示了过期预览，则会将其撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新——例如“正在搜索网页”“正在读取文件”或“正在调用工具”之类的简短状态行——这些内容会在工具运行时显示在同一条预览消息中，先于最终回复出现。这样可以让多步骤工具轮次在视觉上保持活跃，而不是在首次思考预览与最终答案之间显得沉默。

支持的界面：

- 当预览流式传输处于活动状态时，**Discord**、**Slack**、**Telegram** 和 **Matrix** 默认会将工具进度流式写入实时预览编辑中。
- Telegram 自 `v2026.4.22` 起已发布并启用了工具进度预览更新；保持启用可保留这一已发布行为。
- **Mattermost** 已经会将工具活动整合进其单一草稿预览帖子中（见上文）。
- 工具进度编辑遵循当前启用的预览流式传输模式；当预览流式传输为 `off`，或消息已切换为分块流式传输时，会跳过这些编辑。
- 如果你想保留预览流式传输，但隐藏工具进度行，请将该渠道的 `streaming.preview.toolProgress` 设为 `false`。如果要完全禁用预览编辑，请将 `streaming.mode` 设为 `off`。

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

- [Messages](/zh-CN/concepts/messages) — 消息生命周期与投递
- [Retry](/zh-CN/concepts/retry) — 投递失败时的重试行为
- [Channels](/zh-CN/channels) — 各渠道的流式传输支持
