---
read_when:
    - 说明流式传输或分块在渠道上的工作方式
    - 更改分块流式传输或渠道分块行为
    - 调试重复/过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块行为（块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块
x-i18n:
    generated_at: "2026-05-03T15:33:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4a62b333123d317cad9a8063a68c5c026fb91b23731a6ccdb97d995d9bb8bdba
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：** 在 assistant 写入时发出已完成的 **blocks**。这些是普通渠道消息（不是 token 增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 生成期间更新临时的 **预览消息**。

目前渠道消息没有**真正的 token 增量流式传输**。预览流式传输基于消息（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在 assistant 输出可用时，以较粗粒度的分块发送输出。

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
- `chunker`：`EmbeddedBlockChunker`，应用最小/最大边界 + 断点偏好。
- `channel send`：实际出站消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账户变体）用于按渠道强制 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行（段落边界）拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17）会拆分过高的回复，避免 UI 裁切。

**边界语义：**

- `text_end`：chunker 一发出就流式发送块；在每个 `text_end` 时刷新。
- `message_end`：等到 assistant 消息完成后，再刷新缓冲的输出。

如果缓冲文本超过 `maxChars`，`message_end` 仍会使用 chunker，因此它可以在末尾发出多个分块。

### 使用分块流式传输交付媒体

`MEDIA:` 指令是普通交付元数据。当分块流式传输提前发送媒体块时，OpenClaw 会记住该回合的交付。如果最终 assistant payload 重复同一媒体 URL，最终交付会移除重复媒体，而不是再次发送附件。

完全重复的最终 payload 会被抑制。如果最终 payload 在已流式传输的媒体周围添加不同文本，OpenClaw 仍会发送新文本，同时保持媒体只交付一次。这可防止在 Telegram 等渠道上出现重复语音消息或文件，例如智能体在流式传输期间发出 `MEDIA:`，而提供商也在完成的回复中包含它时。

## 分块算法（低/高边界）

分块由 `EmbeddedBlockChunker` 实现：

- **低边界：** 直到缓冲区 >= `minChars` 才发出（除非强制）。
- **高边界：** 优先在 `maxChars` 前拆分；如果强制，则在 `maxChars` 处拆分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬断点。
- **代码围栏：** 绝不在围栏内拆分；在 `maxChars` 处强制拆分时，会关闭 + 重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此你不能超过每个渠道的上限。

## 合并（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的块分片**。这会减少“单行刷屏”，同时仍然提供渐进式输出。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会刷新。
- `minChars` 会阻止过小片段发送，直到累积足够文本（最终刷新始终发送剩余文本）。
- 连接符源自 `blockStreamingChunk.breakPreference`（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 设置渠道覆盖（包括按账户配置）。
- 除非覆盖，Signal/Slack/Discord 的默认合并 `minChars` 会提升到 1500。

## 分块之间的拟人化节奏

启用分块流式传输时，你可以在分块回复之间（第一个块之后）添加**随机暂停**。这会让多气泡回复感觉更自然。

- 配置：`agents.defaults.humanDelay`（通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式传输分块或全部内容”

这映射到：

- **流式传输分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发出）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在末尾流式传输全部内容：** `blockStreamingBreak: "message_end"`（刷新一次，如果很长可能有多个分块）。
- **无分块流式传输：** `blockStreamingDefault: "off"`（仅最终回复）。

**渠道说明：** 除非显式将 `*.blockStreaming` 设置为 `true`，否则分块流式传输**关闭**。渠道可以流式传输实时预览（`channels.<channel>.streaming`），而不发送分块回复。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单个预览，会被最新文本替换。
- `block`：以分块/追加步骤更新预览。
- `progress`：生成期间显示进度/Status 预览，完成时给出最终答案。

### 渠道映射

| 渠道 | `off` | `partial` | `block` | `progress` |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅ | ✅ | ✅ | 映射到 `partial` |
| Discord | ✅ | ✅ | ✅ | 映射到 `partial` |
| Slack | ✅ | ✅ | ✅ | ✅ |
| Mattermost | ✅ | ✅ | ✅ | ✅ |

仅 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 会切换 Slack 原生流式传输 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack assistant 线程 Status 需要回复线程目标。顶层私信不会显示这种线程样式预览，但它们仍可使用 Slack 草稿预览帖子和编辑。

旧键迁移：

- Telegram：旧版 `streamMode` 和标量/布尔 `streaming` 值会被 Doctor/配置兼容路径检测并迁移到 `streaming.mode`。
- Discord：`streamMode` + 布尔 `streaming` 会自动迁移到 `streaming` 枚举。
- Slack：`streamMode` 会自动迁移到 `streaming.mode`；布尔 `streaming` 会自动迁移到 `streaming.mode` 加 `streaming.nativeTransport`；旧版 `nativeStreaming` 会自动迁移到 `streaming.nativeTransport`。

### 运行时行为

Telegram：

- 在私信和群组/话题中使用 `sendMessage` + `editMessageText` 预览更新。
- 当预览已可见约一分钟时，会发送一条新的最终消息，而不是就地编辑，然后清理预览，使 Telegram 的时间戳反映回复完成时间。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输（避免双重流式传输）。
- `/reasoning stream` 可以将推理写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复 payload 会取消待处理预览，而不刷新新的草稿，然后使用正常交付。

Slack：

- 可用时，`partial` 可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加样式的草稿预览。
- `progress` 使用 Status 预览文本，然后给出最终答案。
- 没有回复线程的顶层私信会使用草稿预览帖子和编辑，而不是 Slack 原生流式传输。
- 原生和草稿预览流式传输会抑制该回合的分块回复，因此 Slack 回复只通过一条交付路径流式传输。
- 最终媒体/错误 payload 和进度最终内容不会创建一次性草稿消息；只有能编辑预览的文本/块最终内容才会刷新待处理草稿文本。

Mattermost：

- 将思考、工具活动和部分回复文本流式传输到单个草稿预览帖子中，并在最终答案可安全发送时就地完成。
- 如果预览帖子在完成时已被删除或无法使用，则回退为发送新的最终帖子。
- 最终媒体/错误 payload 会先取消待处理预览更新，再正常交付，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会就地完成。
- 仅媒体、错误和回复目标不匹配的最终内容会先取消待处理预览更新，再正常交付；已可见的过时预览会被撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新，即“正在搜索网络”、“正在读取文件”或“正在调用工具”这类短 Status 行。工具运行时，它们会显示在同一条预览消息中，早于最终回复。这能让多步骤工具回合在第一个思考预览和最终答案之间保持视觉上的进行状态，而不是沉默。

支持的表面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 在预览流式传输处于活动状态时，默认会将工具进度流式传输到实时预览编辑中。
- Telegram 自 `v2026.4.22` 起已发布启用工具进度预览更新的行为；保持启用可保留该已发布行为。
- **Mattermost** 已将工具活动合并到它的单个草稿预览帖子中（见上文）。
- 工具进度编辑遵循活动的预览流式传输模式；当预览流式传输为 `off`，或分块流式传输已接管消息时会跳过。在 Telegram 上，`streaming.mode: "off"` 表示仅最终回复：通用进度闲聊也会被抑制，而不是作为独立的“Working...”消息交付；同时审批提示、媒体 payload 和错误仍会正常路由。
- 要保留预览流式传输但隐藏工具进度行，请为该渠道将 `streaming.preview.toolProgress` 设置为 `false`。要完全禁用预览编辑，请将 `streaming.mode` 设置为 `off`。
- Telegram 所选引用回复是一个例外：当 `replyToMode` 不是 `"off"` 且存在所选引用文本时，OpenClaw 会跳过该回合的答案预览流，因此工具进度预览行无法渲染。没有所选引用文本的当前消息回复仍会保留预览流式传输。详见 [Telegram 渠道文档](/zh-CN/channels/telegram)。

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

- [消息](/zh-CN/concepts/messages) — 消息生命周期和交付
- [重试](/zh-CN/concepts/retry) — 交付失败时的重试行为
- [渠道](/zh-CN/channels) — 各渠道流式传输支持
