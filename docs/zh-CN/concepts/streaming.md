---
read_when:
    - 说明流式传输或分块在渠道上的工作方式
    - 更改分块流式传输或频道分块行为
    - 调试重复/过早的分块回复或渠道预览流式传输
summary: 流式传输 + 分块行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块
x-i18n:
    generated_at: "2026-07-05T11:14:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18298e3b24137e48cfa7b46e49c467785b49f2d1f0784ac7cb5696452843c948
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有两个相互独立的流式传输层，并且目前对渠道消息**没有真正的 token-delta 流式传输**：

- **分块流式传输（渠道）：**在助手写入时发送已完成的**块**。这些是普通渠道消息，而不是 token delta。
- **预览流式传输（Telegram/Discord/Slack/Matrix/Mattermost/MS Teams）：**
  在生成期间更新临时**预览消息**（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的分块发送。

```text
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

- `text_delta/events`：模型流事件（对于非流式模型可能很稀疏）。
- `chunker`：`EmbeddedBlockChunker`，应用最小/最大边界 + 断点偏好。
- `channel send`：实际出站消息（分块回复）。

**控制项**（除非另有说明，均位于 `agents.defaults` 下）：

| 键                                                           | 值 / 形状                                                               | 默认值     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }`（发送前合并流式块）                 | -          |
| `*.blockStreaming`（渠道覆盖）                               | `true` / `false`，按渠道（以及按账号）强制分块流式传输                  | -          |
| `*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`） | 数字，硬上限                                                            | 4000       |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | 数字，软行数上限，用于拆分过高的回复以避免 UI 裁切                     | 17         |

`chunkMode: "newline"` 会按空行（段落边界）拆分，而不是按每个换行拆分；当文本超过限制后，才回退到按长度分块。

`blockStreamingBreak` 的**边界语义**：

- `text_end`：chunker 一旦发送块就进行流式发送；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成，然后刷新缓冲的输出。如果缓冲文本超过 `maxChars`，仍会使用 chunker，因此可能在末尾发送多个分块。

### 分块流式传输中的媒体递送

流式媒体必须使用结构化 payload 字段，例如 `mediaUrl` 或 `mediaUrls`；流式文本不会被解析为附件命令。当分块流式传输提前发送媒体时，OpenClaw 会为该轮次记住这次递送。如果最终助手 payload 重复相同的媒体 URL，最终递送会移除重复媒体，而不是再次发送附件。

完全重复的最终 payload 会被抑制。如果最终 payload 在已流式发送的媒体周围添加了不同文本，OpenClaw 仍会发送新文本，同时保持媒体只递送一次。这可以防止在 Telegram 等渠道上出现重复的语音消息或文件。

## 分块算法（低/高边界）

分块由 `EmbeddedBlockChunker` 实现：

- **低边界：**在 buffer >= `minChars` 之前不要发送（除非强制）。
- **高边界：**优先在 `maxChars` 之前拆分；如果强制，则在 `maxChars` 处拆分。
- **断点偏好链：**`paragraph` -> `newline` -> `sentence` ->
  空白 -> 硬断点。
- **代码围栏：**绝不在围栏内拆分；当在 `maxChars` 处强制拆分时，关闭并重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制到渠道的 `textChunkLimit`，因此你不能超过每个渠道的上限。

## 合并（合并流式块）

启用分块流式传输时，OpenClaw 可以在发送前**合并连续的分块**，在仍提供渐进式输出的同时减少单行刷屏。

- 合并会等待**空闲间隔**（`idleMs`）后再刷新。
- buffer 受 `maxChars` 限制，超过时会刷新。
- `minChars` 会阻止过小片段在积累足够文本前发送（最终刷新始终发送剩余文本）。
- 连接符来自 `blockStreamingChunk.breakPreference`：`paragraph` ->
  `\n\n`，`newline` -> `\n`，`sentence` -> 空格。
- 可通过 `*.blockStreamingCoalesce` 配置渠道覆盖（包括按账号配置）。
- Discord、Signal 和 Slack 默认合并为 `{ minChars: 1500, idleMs: 1000 }`，除非被覆盖。

## 分块之间的类人节奏

启用分块流式传输时，在第一个块之后，为分块回复之间添加**随机暂停**，让多气泡回复感觉更自然。

| `agents.defaults.humanDelay.mode` | 行为                 |
| --------------------------------- | -------------------- |
| `off`（默认）                     | 不暂停               |
| `natural`                         | 800-2500ms 随机暂停  |
| `custom`                          | `minMs`/`maxMs`      |

通过 `agents.list[].humanDelay` 按智能体覆盖。仅适用于**分块回复**，不适用于最终回复或工具摘要。

## “流式发送分块或全部内容”

- **流式发送分块：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  （边生成边发送）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在末尾流式发送全部内容：**`blockStreamingBreak: "message_end"`（刷新一次，如果很长则可能是多个分块）。
- **无分块流式传输：**`blockStreamingDefault: "off"`（仅最终回复）。

除非 `*.blockStreaming` 显式设置为 `true`，否则分块流式传输为**关闭**。渠道可以在没有分块回复的情况下流式发送实时预览（`channels.<channel>.streaming`）。`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是配置根级别。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`（嵌套 `{ mode, ... }`；顶层布尔值是旧版别名）。

| 模式       | 行为                                                                  |
| ---------- | --------------------------------------------------------------------- |
| `off`      | 禁用预览流式传输                                                      |
| `partial`  | 单个预览替换为最新文本                                                |
| `block`    | 预览以分块/追加步骤更新                                               |
| `progress` | 生成期间显示进度/状态预览，完成时给出最终答案                         |

`streaming.mode: "block"` 是一种面向 Discord 和 Telegram 等支持编辑渠道的预览流式传输模式；它本身不会启用这些渠道上的渠道分块递送。使用 `streaming.block.enabled`（或旧版 `blockStreaming` 渠道键）来启用普通分块回复。Microsoft Teams 是例外：它没有草稿预览分块传输，因此 `streaming.mode:
"block"` 会完全禁用原生流式传输，回复会以常规分块递送落地，而不是原生 partial/progress 流式传输。

### 渠道映射

| 渠道       | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | 是    | 是        | 是      | 可编辑进度草稿    |
| Discord    | 是    | 是        | 是      | 可编辑进度草稿    |
| Slack      | 是    | 是        | 是      | 是                |
| Mattermost | 是    | 是        | 是      | 是                |
| MS Teams   | 是    | 是        | 是      | 原生进度流        |

预览分块配置（`streaming.preview.chunk.*`，例如位于 `channels.discord.streaming` 或 `channels.telegram.streaming` 下）默认值为 `minChars: 200`、`maxChars: 800`（限制到渠道的 `textChunkLimit`），以及 `breakPreference: "paragraph"`。

仅 Slack：

- `channels.slack.streaming.nativeTransport` 会在 `channels.slack.streaming.mode="partial"` 时切换 Slack 原生流式 API 调用（`chat.startStream`/`chat.appendStream`/`chat.stopStream`）（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态需要一个回复线程目标。顶层私信不会显示这种线程式预览，但仍可以使用 Slack 草稿预览帖子和编辑。

### 旧版键迁移

| 渠道     | 旧版键                                                      | 状态                                                                                                                                                         |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Telegram | `streamMode`、标量/布尔值 `streaming`                       | 由 doctor/config 兼容路径检测并迁移到 `streaming.mode`                                                                                                      |
| Discord  | `streamMode`、布尔值 `streaming`                            | `streaming` 枚举的运行时别名；运行 `openclaw doctor --fix` 以重写持久化配置                                                                                  |
| Slack    | `streamMode`；布尔值 `streaming`；旧版 `nativeStreaming`    | `streaming.mode` 的运行时别名（对于布尔值/旧版形式，还包括 `streaming.nativeTransport`）；运行 `openclaw doctor --fix` 以重写持久化配置                      |

## 运行时行为

### Telegram

- 在私信和群组/话题中使用 `sendMessage` + `editMessageText` 预览更新；最终文本会原地编辑活动预览。Telegram 临时 30 秒“typing”草稿（`sendMessageDraft`）不会用于答案流式传输。
- 为了推送通知 UX，较短的初始预览仍会防抖，但会在有界延迟后物化，确保活动运行不会在视觉上一直沉默。
- 较长的最终回复会将预览消息复用于第一个分块，并且只发送剩余分块。
- `block` 模式会在 `streaming.preview.chunk.maxChars` 处将预览轮换到新消息（默认 800，受 Telegram 的 4096 编辑限制约束）；其他模式会让一个预览增长到最多 4096 个字符。
- `progress` 模式会在可编辑状态草稿中保留工具进度；当答案流式传输处于活动状态但尚无工具行可用时，会物化状态标签；完成时清除草稿，并通过正常递送发送最终答案。
- 如果最终编辑在确认完成文本之前失败，OpenClaw 会使用正常最终递送，并清理陈旧预览。
- 当 Telegram 分块流式传输被显式启用时，会跳过预览流式传输，以避免双重流式发送。
- `/reasoning stream` 可以将推理写入临时预览，该预览会在最终递送后删除。
- Telegram 选定引用回复是一个例外：当 `replyToMode` 不是 `"off"` 且存在选定引用文本时，OpenClaw 会跳过该轮次的答案预览流（最终答案必须走原生引用回复路径），因此工具进度预览行无法渲染。没有选定引用文本的当前消息回复仍会保留预览流式传输。详情见 [Telegram 渠道文档](/zh-CN/channels/telegram)。

### Discord

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord 分块流式传输被显式启用时，跳过预览流式传输。
- 最终媒体、错误和显式回复载荷会取消待处理预览，而不会刷新新的草稿，然后使用正常投递。

### Slack

- `partial` 可在可用时使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 使用状态预览文本，然后发送最终答案。
- 没有回复线程的顶层私信使用草稿预览帖子和编辑，而不是 Slack 原生流式传输。
- 原生和草稿预览流式传输会抑制该轮次的块回复，因此 Slack 回复只通过一条投递路径进行流式传输。
- 最终媒体/错误载荷和进度最终消息不会创建一次性草稿消息；只有可编辑预览的文本/块最终消息会刷新待处理草稿文本。

### Mattermost

- 将思考、工具活动和部分回复文本流式传输到单个草稿预览帖子中，并在最终答案可安全发送时就地最终确定。
- 如果预览帖子已被删除或在最终确定时不可用，则回退为发送新的最终帖子。
- 最终媒体/错误载荷会在正常投递前取消待处理预览更新，而不是刷新临时预览帖子。

### Matrix

- 当最终文本可以复用预览事件时，草稿预览会就地最终确定。
- 仅媒体、错误和回复目标不匹配的最终消息会在正常投递前取消待处理预览更新；已可见的过期预览会被撤回。

## 工具进度预览更新

预览流式传输也可以包含**工具进度**更新：诸如“正在搜索 Web”、“正在读取文件”或“正在调用工具”之类的短状态行，会在工具运行期间、最终回复之前显示在同一条预览消息中。在 Codex app-server 模式下，Codex 前言/评论消息使用同一条预览路径，因此“我正在检查...”这样的短进度说明可以流式传输到可编辑草稿中，而不会成为最终答案的一部分。这让多步骤工具轮次在第一条思考预览和最终答案之间保持可见进展，而不是静默等待。

长时间运行的工具可能会在返回前发出类型化进度。例如，`web_fetch` 启动时会设置一个五秒计时器：如果抓取仍在等待，预览会显示 `Fetching page content...`；如果抓取在此之前完成或被取消，则不会发出进度行。后续的最终工具结果仍会正常投递给模型。

支持的界面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 在预览流式传输处于活动状态时，默认将工具进度和 Codex 前言更新流式传输到实时预览编辑中。Microsoft Teams 在个人聊天中使用其原生进度流。
- Telegram 自 `v2026.4.22` 起已发布启用工具进度预览更新；保持启用会保留该已发布行为。
- **Mattermost** 已经将工具活动合并到其单个草稿预览帖子中（见上文）。
- 工具进度编辑遵循活动的预览流式传输模式；当预览流式传输为 `off`，或分块流式传输已接管消息时，会跳过这些编辑。在 Telegram 上，`streaming.mode: "off"` 为仅最终消息：通用进度闲聊也会被抑制，而不是作为独立状态消息投递；审批提示、媒体载荷和错误仍会正常路由。
- 若要保留预览流式传输但隐藏工具进度行，请将该渠道的 `streaming.preview.toolProgress` 设为 `false`（默认 `true`）。若要保持工具进度行可见，同时隐藏命令/exec 文本，请将 `streaming.preview.commandText` 设为 `"status"`，或将 `streaming.progress.commandText` 设为 `"status"`；默认值为 `"raw"`，以保留已发布行为。此策略由使用 OpenClaw 紧凑进度渲染器的草稿/进度渠道共享，包括 Discord、Matrix、Microsoft Teams、Mattermost、Slack 草稿预览和 Telegram。若要完全禁用预览编辑，请将 `streaming.mode` 设为 `off`。

## 进度草稿渲染

进度模式草稿（`streaming.progress.*`）按渠道有界且可配置：

| 键                                | 默认值        | 行为                                                           |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | 草稿标签下保留的最大紧凑进度行数                               |
| `streaming.progress.maxLineChars` | `120`         | 截断前每个紧凑行的最大字符数（感知词边界）                     |
| `streaming.progress.label`        | `"auto"`      | 草稿标题；自定义字符串，或设为 `false` 以隐藏                  |
| `streaming.progress.labels`       | 内置池        | 当 `label: "auto"` 时使用的候选标签                            |

### 评论进度通道

除工具进度外，紧凑进度渲染器还可以在草稿中呈现另一个通道：

- **`streaming.progress.commentary`** - 渲染模型的工具前**评论**（一段简短的“我会先检查...然后...”叙述），并在进度草稿中与工具行交错显示。

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

保持进度行可见但隐藏原始命令/exec 文本：

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

在另一个紧凑进度渠道键下使用相同形状，例如 `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost` 或 Slack 草稿预览。对于进度草稿模式，请将相同策略放在 `streaming.progress` 下：

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

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor) - 目标共享预览、编辑、流式传输和最终确定设计
- [进度草稿](/zh-CN/concepts/progress-drafts) - 在长轮次期间更新的可见进行中工作消息
- [消息](/zh-CN/concepts/messages) - 消息生命周期和投递
- [Retry](/zh-CN/concepts/retry) - 投递失败时的重试行为
- [Channels](/zh-CN/channels) - 按渠道的流式传输支持
