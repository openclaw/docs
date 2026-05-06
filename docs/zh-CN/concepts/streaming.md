---
read_when:
    - 解释流式传输或分块在渠道中的工作方式
    - 更改分块流式传输或渠道分块行为
    - 调试重复/过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块
x-i18n:
    generated_at: "2026-05-06T12:48:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有两个独立的流式传输层：

- **分块流式传输（渠道）：** 在 assistant 写入时发出完成的**块**。这些是普通渠道消息（不是令牌增量）。
- **预览流式传输（Telegram/Discord/Slack）：** 在生成时更新临时**预览消息**。

目前没有向渠道消息发送的**真正令牌增量流式传输**。预览流式传输基于消息（发送 + 编辑/追加）。

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
- `channel send`：实际出站消息（块回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- 渠道覆盖：`*.blockStreaming`（以及按账号的变体），用于按渠道强制设为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（发送前合并流式块）。
- 渠道硬上限：`*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`）。
- 渠道分块模式：`*.chunkMode`（默认 `length`，`newline` 会先按空行（段落边界）拆分，再按长度分块）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17），用于拆分过高的回复以避免 UI 裁切。

**边界语义：**

- `text_end`：只要 chunker 发出块就流式发送块；在每个 `text_end` 刷新。
- `message_end`：等到 assistant 消息完成后，再刷新缓冲的输出。

如果缓冲文本超过 `maxChars`，`message_end` 仍会使用 chunker，因此它可以在末尾发出多个分块。

### 分块流式传输中的媒体交付

`MEDIA:` 指令是普通交付元数据。当分块流式传输提前发送媒体块时，OpenClaw 会记住该轮次的这次交付。如果最终 assistant 载荷重复相同的媒体 URL，最终交付会移除重复媒体，而不是再次发送附件。

完全重复的最终载荷会被抑制。如果最终载荷在已经流式传输的媒体周围添加了不同文本，OpenClaw 仍会发送新文本，同时保持媒体只交付一次。这可以防止在 Telegram 等渠道上，当 agent 在流式传输期间发出 `MEDIA:` 且提供商也在完整回复中包含它时，出现重复语音消息或文件。

## 分块算法（低/高边界）

分块由 `EmbeddedBlockChunker` 实现：

- **低边界：** 直到缓冲区 >= `minChars` 才发出（除非强制）。
- **高边界：** 优先在 `maxChars` 之前拆分；如果强制，则在 `maxChars` 处拆分。
- **断点偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬断点。
- **代码围栏：** 绝不在围栏内拆分；当在 `maxChars` 处强制拆分时，会关闭 + 重新打开围栏以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此你不能超过每个渠道的上限。

## 合并（合并流式块）

启用分块流式传输后，OpenClaw 可以在发送前**合并连续的块分块**。这可以减少“单行刷屏”，同时仍提供渐进式输出。

- 合并会等待**空闲间隙**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会刷新。
- `minChars` 会防止过小片段发送，直到累积足够文本（最终刷新始终会发送剩余文本）。
- 连接符派生自 `blockStreamingChunk.breakPreference`（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 可以通过 `*.blockStreamingCoalesce` 使用渠道覆盖（包括按账号配置）。
- 除非覆盖，否则 Signal/Slack/Discord 的默认合并 `minChars` 会提升到 1500。

## 块之间的拟人节奏

启用分块流式传输后，你可以在块回复之间（第一个块之后）添加**随机暂停**。这会让多气泡回复感觉更自然。

- 配置：`agents.defaults.humanDelay`（可通过 `agents.list[].humanDelay` 按 agent 覆盖）。
- 模式：`off`（默认）、`natural`（800-2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于**块回复**，不适用于最终回复或工具摘要。

## “流式输出分块或全部内容”

这对应于：

- **流式输出分块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（边生成边发出）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在末尾流式输出全部内容：** `blockStreamingBreak: "message_end"`（一次刷新；如果很长，可能会有多个分块）。
- **无分块流式传输：** `blockStreamingDefault: "off"`（仅最终回复）。

**渠道说明：** 除非显式将 `*.blockStreaming` 设为 `true`，否则分块流式传输为**关闭**。渠道可以在没有块回复的情况下流式传输实时预览（`channels.<channel>.streaming`）。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是根配置。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`

模式：

- `off`：禁用预览流式传输。
- `partial`：单个预览，会被最新文本替换。
- `block`：以分块/追加步骤更新预览。
- `progress`：生成期间的进度/状态预览，完成时给出最终答案。

`streaming.mode: "block"` 是一种预览流式传输模式，适用于 Discord 和 Telegram 等支持编辑的渠道。它不会在这些渠道上启用渠道块交付。想要普通块回复时，请使用 `streaming.block.enabled` 或旧版 `blockStreaming` 渠道键。Microsoft Teams 是例外：它没有草稿预览块传输，因此 `streaming.mode: "block"` 会映射到 Teams 块交付，而不是原生 partial/progress 流式传输。

### 渠道映射

| 渠道       | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | 可编辑进度草稿    |
| Discord    | ✅    | ✅        | ✅      | 可编辑进度草稿    |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |
| MS Teams   | ✅    | ✅        | ✅      | 原生进度流        |

仅限 Slack：

- `channels.slack.streaming.nativeTransport` 会在 `channels.slack.streaming.mode="partial"` 时切换 Slack 原生流式传输 API 调用（默认：`true`）。
- Slack 原生流式传输和 Slack assistant 线程状态需要一个回复线程目标。顶层私信不会显示这种线程样式预览，但它们仍可以使用 Slack 草稿预览帖子和编辑。

旧版键迁移：

- Telegram：旧版 `streamMode` 以及标量/布尔 `streaming` 值会被 doctor/config 兼容路径检测并迁移到 `streaming.mode`。
- Discord：`streamMode` + 布尔 `streaming` 仍是 `streaming` 枚举的运行时别名；运行 `openclaw doctor --fix` 可重写持久化配置。
- Slack：`streamMode` 仍是 `streaming.mode` 的运行时别名；布尔 `streaming` 仍是 `streaming.mode` 加 `streaming.nativeTransport` 的运行时别名；旧版 `nativeStreaming` 仍是 `streaming.nativeTransport` 的运行时别名。运行 `openclaw doctor --fix` 可重写持久化配置。

### 运行时行为

Telegram：

- 使用 `sendMessage` + `editMessageText` 在私信和群组/话题中更新预览。
- 最终文本会原地编辑活动预览；较长的最终文本会复用该消息作为第一个分块，并只发送剩余分块。
- `progress` 模式会在可编辑的状态草稿中保留工具进度，在完成时清除该草稿，并通过普通交付发送最终答案。
- 如果在确认完成文本之前最终编辑失败，OpenClaw 会使用普通最终交付并清理过期预览。
- 当 Telegram 分块流式传输显式启用时，会跳过预览流式传输（以避免双重流式传输）。
- `/reasoning stream` 可以将推理写入临时预览，该预览会在最终交付后删除。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输显式启用时，会跳过预览流式传输。
- 最终媒体、错误和显式回复载荷会取消待处理预览，而不刷新新草稿，然后使用普通交付。

Slack：

- `partial` 可在可用时使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后给出最终答案。
- 没有回复线程的顶层私信会使用草稿预览帖子和编辑，而不是 Slack 原生流式传输。
- 原生和草稿预览流式传输会抑制该轮次的块回复，因此 Slack 回复只会通过一种交付路径流式传输。
- 最终媒体/错误载荷和进度最终内容不会创建一次性草稿消息；只有可以编辑预览的文本/块最终内容会刷新待处理草稿文本。

Mattermost：

- 将思考、工具活动和部分回复文本流式传输到单个草稿预览帖子中，当最终答案可以安全发送时原地完成。
- 如果预览帖子在完成时已被删除或不可用，则回退为发送新的最终帖子。
- 最终媒体/错误载荷会在普通交付之前取消待处理预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览会原地完成。
- 纯媒体、错误和回复目标不匹配的最终内容会在普通交付之前取消待处理预览更新；已经可见的过期预览会被撤回。

### 工具进度预览更新

预览流式传输还可以包含**工具进度**更新，即“正在搜索网络”“正在读取文件”或“正在调用工具”等短状态行，它们会在工具运行时、最终回复之前出现在同一条预览消息中。这样可以让多步骤工具轮次在首次思考预览和最终答案之间保持视觉上的活跃，而不是沉默。

支持的界面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 默认会在启用预览流式传输时，将工具进度流式传输到实时预览编辑中。Microsoft Teams 在个人聊天中使用其原生进度流。
- Telegram 自 `v2026.4.22` 起已默认启用工具进度预览更新；保持启用可保留已发布的行为。
- **Mattermost** 已经将工具活动折叠进其单个草稿预览帖子中（见上文）。
- 工具进度编辑会遵循当前的预览流式传输模式；当预览流式传输为 `off`，或分块流式传输已接管消息时，会跳过这些编辑。在 Telegram 上，`streaming.mode: "off"` 仅发送最终结果：通用进度闲聊也会被抑制，而不是作为独立 Status 消息发送；审批提示、媒体载荷和错误仍会正常路由。
- 如需保留预览流式传输但隐藏工具进度行，请将该渠道的 `streaming.preview.toolProgress` 设为 `false`。如需保持工具进度行可见但隐藏命令/执行文本，请将 `streaming.preview.commandText` 设为 `"status"`，或将 `streaming.progress.commandText` 设为 `"status"`；默认值为 `"raw"`，以保留已发布的行为。此策略由使用 OpenClaw 紧凑进度渲染器的草稿/进度渠道共享，包括 Discord、Matrix、Microsoft Teams、Mattermost、Slack 草稿预览和 Telegram。若要完全禁用预览编辑，请将 `streaming.mode` 设为 `off`。
- Telegram 选中引用回复是一个例外：当 `replyToMode` 不是 `"off"` 且存在选中的引用文本时，OpenClaw 会跳过该轮的答案预览流，因此工具进度预览行无法渲染。没有选中引用文本的当前消息回复仍会保留预览流式传输。详情请参阅 [Telegram 渠道文档](/zh-CN/channels/telegram)。

保持进度行可见，但隐藏原始命令/执行文本：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

在另一个紧凑进度渠道键下使用相同结构，例如 `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost`，或 Slack 草稿预览。对于进度草稿模式，请将相同策略放在 `streaming.progress` 下：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## 相关

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor) - 目标共享预览、编辑、流式传输和最终化设计
- [进度草稿](/zh-CN/concepts/progress-drafts) - 在长轮次期间更新的可见进行中工作消息
- [消息](/zh-CN/concepts/messages) - 消息生命周期和递送
- [Retry](/zh-CN/concepts/retry) - 递送失败时的重试行为
- [渠道](/zh-CN/channels) - 按渠道提供的流式传输支持
