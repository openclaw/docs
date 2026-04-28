---
read_when:
    - 说明渠道上的流式传输或分块如何工作
    - 更改分块流式传输或渠道分块行为
    - 调试重复/过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输与分块
x-i18n:
    generated_at: "2026-04-28T19:32:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：**在助手写入时发出已完成的**块**。这些是普通的渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：**在生成时更新一条临时**预览消息**。

目前，渠道消息没有**真正的 token 增量流式传输**。预览流式传输基于消息（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的分片发送输出。

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

- `text_delta/events`：模型流事件（对于非流式模型可能很稀疏）。
- `chunker`：`EmbeddedBlockChunker`，应用最小/最大边界 + 断点偏好。
- `channel send`：实际出站消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账号的变体），用于按渠道强制 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分片模式：`*.chunkMode`（默认 `length`；`newline` 会先按空行（段落边界）拆分，再按长度分片）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），会拆分过高的回复以避免 UI 裁切。

**边界语义：**

- `text_end`：chunker 一发出块就进行流式发送；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息结束，然后刷新已缓冲的输出。

如果缓冲文本超过 `maxChars`，`message_end` 仍会使用 chunker，因此它可以在末尾发出多个分片。

### 使用分块流式传输交付媒体

`MEDIA:` 指令是普通的交付元数据。当分块流式传输提前发送媒体块时，OpenClaw 会记住本轮对话中的这次交付。如果最终助手载荷重复了同一个媒体 URL，最终交付会剥离重复媒体，而不是再次发送附件。

完全重复的最终载荷会被抑制。如果最终载荷在已经流式发送的媒体周围添加了不同文本，OpenClaw 仍会发送新文本，同时保持媒体只交付一次。这可以防止在 Telegram 等渠道上出现重复语音消息或文件，例如智能体在流式传输期间发出 `MEDIA:`，而提供商也在完成的回复中包含了它。

## 分片算法（低/高边界）

分块由 `EmbeddedBlockChunker` 实现：

- **低边界：**缓冲区 >= `minChars` 前不发出（除非强制）。
- **高边界：**优先在 `maxChars` 前拆分；如果强制，则在 `maxChars` 处拆分。
- **断点偏好：**`paragraph` → `newline` → `sentence` → `whitespace` → 硬断点。
- **代码围栏：**绝不在围栏内部拆分；当在 `maxChars` 处强制拆分时，会关闭 + 重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此你不能超过各渠道上限。

## 合并（合并流式块）

启用分块流式传输后，OpenClaw 可以在发出前**合并连续的分块片段**。这会减少“单行刷屏”，同时仍提供渐进式输出。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会刷新。
- `minChars` 会阻止过小片段在积累到足够文本前发送（最终刷新始终会发送剩余文本）。
- 连接符来自 `blockStreamingChunk.breakPreference`（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 设置渠道覆盖（包括按账号配置）。
- 除非覆盖，否则 Signal/Slack/Discord 的默认合并 `minChars` 会提升到 1500。

## 块之间的拟人节奏

启用分块流式传输后，你可以在分块回复之间（第一个块之后）添加**随机暂停**。这会让多气泡响应感觉更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分片或全部内容”

它映射为：

- **流式发送分片：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发出）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在末尾流式发送全部内容：**`blockStreamingBreak: "message_end"`（刷新一次；如果非常长，可能分为多个分片）。
- **不使用分块流式传输：**`blockStreamingDefault: "off"`（仅最终回复）。

**渠道注意事项：**除非明确将 `*.blockStreaming` 设置为 `true`，否则分块流式传输**关闭**。渠道可以流式发送实时预览（`channels.<channel>.streaming`），而不发送分块回复。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单条预览，会被最新文本替换。
- `block`：预览以分片/追加步骤更新。
- `progress`：生成期间显示进度/Status 预览，完成时给出最终答案。

### 渠道映射

| 渠道    | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 映射到 `partial` |
| Discord    | ✅    | ✅        | ✅      | 映射到 `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

仅 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 会切换 Slack 原生流式传输 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程 Status 需要回复线程目标；顶层私信不会显示这种线程式预览。

旧版键迁移：

- Telegram：旧版 `streamMode` 和标量/布尔 `streaming` 值会被 Doctor/配置兼容路径检测并迁移到 `streaming.mode`。
- Discord：`streamMode` + 布尔 `streaming` 会自动迁移到 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔 `streaming` 会自动迁移到 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 使用 `sendMessage` + `editMessageText` 在私信和群组/话题中更新预览。
- 当预览已可见约一分钟时，会发送一条新的最终消息，而不是就地编辑，然后清理预览，使 Telegram 的时间戳反映回复完成时间。
- 当 Telegram 分块流式传输被明确启用时，会跳过预览流式传输（避免双重流式传输）。
- `/reasoning stream` 可以将推理写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分片（`draftChunk`）。
- 当 Discord 分块流式传输被明确启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复载荷会取消待处理预览，而不刷新新的草稿，然后使用普通交付。

Slack：

- 可用时，`partial` 可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用 Status 预览文本，然后给出最终答案。
- 原生和草稿预览流式传输会在该轮中抑制分块回复，因此 Slack 回复只通过一种交付路径进行流式传输。
- 最终媒体/错误载荷和进度最终消息不会创建一次性草稿消息；只有可以编辑预览的文本/分块最终消息会刷新待处理草稿文本。

Mattermost：

- 将思考、工具活动和部分回复文本流式写入单个草稿预览帖子，在最终答案可以安全发送时就地完成。
- 如果预览帖子已被删除，或在完成时不可用，则回退为发送新的最终帖子。
- 最终媒体/错误载荷会在普通交付前取消待处理预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会就地完成。
- 仅媒体、错误和回复目标不匹配的最终消息会在普通交付前取消待处理预览更新；已可见的过期预览会被撤回。

### 工具进度预览更新

预览流式传输也可以包含**工具进度**更新，即“正在搜索网页”“正在读取文件”或“正在调用工具”等简短 Status 行。这些内容会在工具运行时显示在同一条预览消息中，早于最终回复。这样可以让多步骤工具轮次在第一个思考预览和最终答案之间保持可见，而不是静默等待。

支持的界面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 在预览流式传输激活时，默认会将工具进度流式写入实时预览编辑。
- Telegram 自 `v2026.4.22` 起已启用工具进度预览更新；保持启用可保留该已发布行为。
- **Mattermost** 已经将工具活动折叠进它的单个草稿预览帖子中（见上文）。
- 工具进度编辑会遵循活动的预览流式传输模式；当预览流式传输为 `off`，或分块流式传输已接管消息时，会跳过它们。在 Telegram 上，`streaming.mode: "off"` 表示仅最终消息：通用进度闲聊也会被抑制，而不是作为独立的“Working...”消息交付；审批提示、媒体载荷和错误仍会正常路由。
- 要保留预览流式传输但隐藏工具进度行，请为该渠道将 `streaming.preview.toolProgress` 设置为 `false`。要完全禁用预览编辑，请将 `streaming.mode` 设置为 `off`。

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

## 相关

- [消息](/zh-CN/concepts/messages) — 消息生命周期和交付
- [重试](/zh-CN/concepts/retry) — 交付失败时的重试行为
- [渠道](/zh-CN/channels) — 各渠道的流式传输支持
