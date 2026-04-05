---
read_when:
    - 解释渠道上的流式传输或分块如何工作
    - 修改分块流式传输或渠道分块行为
    - 调试重复 / 过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块
x-i18n:
    generated_at: "2026-04-05T08:22:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# 流式传输 + 分块

OpenClaw 有两个彼此独立的流式传输层：

- **分块流式传输（渠道）：** 当助手写出完整**块**时立即发送。这些是普通渠道消息（不是 token 增量）。
- **预览流式传输（Telegram / Discord / Slack）：** 在生成过程中更新一个临时的**预览消息**。

目前还**没有真正的 token 增量流式传输**到渠道消息。预览流式传输是基于消息的（发送 + 编辑 / 追加）。

## 分块流式传输（渠道消息）

分块流式传输会在内容可用时，以较粗粒度的块发送助手输出。

```
模型输出
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ 随着缓冲区增长，chunker 发出块
       └─ (blockStreamingBreak=message_end)
            └─ chunker 在 message_end 时刷新
                   └─ 渠道发送（分块回复）
```

图例：

- `text_delta/events`：模型流事件（对于非流式模型，可能较稀疏）。
- `chunker`：应用最小 / 最大边界和断点偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际的出站消息（分块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"` / `"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账户变体），用于为每个渠道强制设为 `"on"` / `"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行即段落边界分块，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），会拆分过高的回复以避免 UI 裁切。

**边界语义：**

- `text_end`：只要 chunker 发出块就立即流式发送；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成后，再刷新缓冲输出。

如果缓冲文本超过 `maxChars`，`message_end` 仍会使用 chunker，因此它可能在结尾发出多个块。

## 分块算法（低 / 高边界）

分块实现由 `EmbeddedBlockChunker` 完成：

- **低边界：** 在缓冲区达到 `minChars` 之前不发送（除非被强制发送）。
- **高边界：** 优先在 `maxChars` 之前断开；如被强制，则在 `maxChars` 处断开。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬断开。
- **代码围栏：** 绝不会在围栏内断开；如果被迫在 `maxChars` 处断开，则会先关闭再重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此不会超过每个渠道的上限。

## 合并（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块内容**。这样可以减少“单行刷屏”，同时仍然提供渐进式输出。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超出时会立即刷新。
- `minChars` 会阻止过小片段在文本积累到足够长度前发送
  （最终刷新总会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference`
  决定（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可通过 `*.blockStreamingCoalesce` 进行渠道级覆盖（包括按账户配置）。
- 除非显式覆盖，否则 Signal / Slack / Discord 的默认合并 `minChars` 会提高到 1500。

## 分块之间更像人类的节奏

启用分块流式传输时，你可以在分块回复之间添加**随机暂停**（首个块之后）。这样会让多气泡回复显得更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500 毫秒）、`custom`（`minMs` / `maxMs`）。
- 仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分块还是最后一次性发送”

其映射关系如下：

- **流式发送分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发送）。非 Telegram 渠道还需要将 `*.blockStreaming` 设置为 `true`。
- **最后一次性发送全部内容：** `blockStreamingBreak: "message_end"`（一次刷新，如果很长，可能仍分成多个块）。
- **不使用分块流式传输：** `blockStreamingDefault: "off"`（只发送最终回复）。

**渠道说明：** 除非
显式将 `*.blockStreaming` 设为 `true`，否则分块流式传输**处于关闭状态**。渠道可以在没有分块回复的情况下使用实时预览流式传输（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认值位于
`agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键名：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单个预览，始终替换为最新文本。
- `block`：以分块 / 追加方式更新预览。
- `progress`：在生成过程中显示进度 / 状态预览，完成时再发送最终答案。

### 渠道映射

| 渠道      | `off` | `partial` | `block` | `progress`        |
| --------- | ----- | --------- | ------- | ----------------- |
| Telegram  | ✅    | ✅        | ✅      | 映射为 `partial`  |
| Discord   | ✅    | ✅        | ✅      | 映射为 `partial`  |
| Slack     | ✅    | ✅        | ✅      | ✅                |

仅适用于 Slack：

- `channels.slack.nativeStreaming` 会在 `streaming=partial` 时切换 Slack 原生流式 API 调用（默认：`true`）。

旧版键迁移：

- Telegram：`streamMode` + 布尔值 `streaming` 会自动迁移到枚举 `streaming`。
- Discord：`streamMode` + 布尔值 `streaming` 会自动迁移到枚举 `streaming`。
- Slack：`streamMode` 会自动迁移到枚举 `streaming`；布尔值 `streaming` 会自动迁移到 `nativeStreaming`。

### 运行时行为

Telegram：

- 在私信和群组 / 主题中使用 `sendMessage` + `editMessageText` 更新预览。
- 当 Telegram 的分块流式传输被显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将 reasoning 写入预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 的分块流式传输被显式启用时，会跳过预览流式传输。

Slack：

- `partial` 在可用时可使用 Slack 原生流式传输（`chat.startStream` / `append` / `stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，完成后再发送最终答案。

## 相关内容

- [消息](/concepts/messages) —— 消息生命周期和传递
- [重试](/concepts/retry) —— 传递失败时的重试行为
- [渠道](/channels) —— 每个渠道的流式传输支持
