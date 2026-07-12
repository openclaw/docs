---
read_when:
    - 说明渠道中的流式传输或分块机制如何工作
    - 更改分块流式传输或渠道分块行为
    - 调试重复/过早的分块回复或渠道预览流式传输
summary: 流式传输和分块行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块
x-i18n:
    generated_at: "2026-07-12T14:26:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7860a83183459ea3dd05c866118e14bc8469c7adcd074a25b6f4a1174cb1664d
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有两个相互独立的流式传输层，而且目前向渠道消息发送时**并没有真正的
令牌增量流式传输**：

- **分块流式传输（渠道）：**随着助手编写内容，发送已完成的**块**。这些是普通的渠道消息，而不是令牌增量。
- **预览流式传输（Telegram/Discord/Slack/Matrix/Mattermost/MS Teams）：**
  在生成期间更新一条临时的**预览消息**（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，以较粗粒度的分块发送。

```text
模型输出
  └─ text_delta/事件
       ├─ (blockStreamingBreak=text_end)
       │    └─ 随着缓冲区增长，分块器发送块
       └─ (blockStreamingBreak=message_end)
            └─ 分块器在 message_end 时刷新
                   └─ 渠道发送（分块回复）
```

- `text_delta/events`：模型流事件（对于非流式模型可能较为稀疏）。
- `chunker`：应用最小/最大边界和断点偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际的出站消息（分块回复）。

**控制项**（除非另有说明，否则均位于 `agents.defaults` 下）：

| 键                                                           | 值 / 结构                                                                | 默认值     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }`（发送前合并流式传输的块）            | -          |
| `*.blockStreaming`（渠道覆盖项）                             | `true` / `false`，强制按渠道（以及按账户）启用分块流式传输               | -          |
| `*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`） | 数字，硬性上限                                                          | 4000       |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | 数字，用于拆分过长回复以避免 UI 裁切的软性行数上限                       | 17         |

`chunkMode: "newline"` 会按空行（段落边界）拆分，而不是按每个换行符拆分；当文本超过
限制后，再回退到按长度分块。

具有嵌套 `streaming` 配置的渠道（Telegram、Discord、Slack、iMessage、
Microsoft Teams）将这些覆盖项写作
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`；扁平形式的
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` 适用于没有嵌套配置的
渠道（例如 Signal、IRC、Google Chat、WhatsApp、
Mattermost）。嵌套流式传输渠道上的过期扁平键会由
`openclaw doctor --fix` 迁移，并且不会在运行时读取。

`blockStreamingBreak` 的**边界语义**：

- `text_end`：分块器一发送块就立即进行流式传输；在每个 `text_end` 时刷新。
- `message_end`：等待助手消息完成，然后刷新缓冲的
  输出。如果缓冲文本超过 `maxChars`，仍会使用分块器，因此最终
  可能发送多个分块。

### 使用分块流式传输发送媒体

流式媒体必须使用 `mediaUrl` 或
`mediaUrls` 等结构化载荷字段；不会将流式文本解析为附件命令。当分块
流式传输提前发送媒体时，OpenClaw 会记录该轮次中的这次发送。如果
最终助手载荷重复了相同的媒体 URL，最终发送会移除
重复媒体，而不是再次发送附件。

完全重复的最终载荷会被抑制。如果最终载荷在已流式发送的媒体周围添加了
不同的文本，OpenClaw 仍会发送新文本，同时确保媒体只发送一次。
这可以防止 Telegram 等渠道中出现重复的语音
消息或文件。

## 分块算法（下限/上限）

分块流式传输由 `EmbeddedBlockChunker` 实现：

- **下限：**在缓冲区 >= `minChars` 之前不发送（强制发送时除外）。
- **上限：**优先在 `maxChars` 之前拆分；强制拆分时，在 `maxChars` 处拆分。
- **断点偏好链：**`paragraph` -> `newline` -> `sentence` ->
  空白字符 -> 硬拆分。
- **代码围栏：**绝不在围栏内部拆分；在 `maxChars` 处强制拆分时，会关闭并
  重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制在渠道的 `textChunkLimit` 以内，因此无法超过
各渠道的上限。

## 合并（合并流式传输的块）

启用分块流式传输后，OpenClaw 可以在发送前**合并连续的分块
片段**，从而减少单行消息刷屏，同时仍提供
渐进式输出。

- 合并会等待出现**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会刷新。
- `minChars` 会阻止过小片段在积累足够文本之前发送
  （最终刷新始终会发送剩余文本）。
- 连接符由 `blockStreamingChunk.breakPreference` 决定：`paragraph` ->
  `\n\n`、`newline` -> `\n`、`sentence` -> 空格。
- 可通过 `*.blockStreamingCoalesce` 配置渠道覆盖项（包括
  按账户配置）。
- 除非被覆盖，否则 Discord、Signal 和 Slack 默认使用 `{ minChars: 1500, idleMs: 1000 }`
  进行合并。

## 分块之间的拟人化节奏

启用分块流式传输后，从第一个块之后开始，在各分块
回复之间添加**随机暂停**，使多消息气泡回复感觉更自然。

| `agents.defaults.humanDelay.mode` | 行为                    |
| --------------------------------- | ----------------------- |
| `off`（默认）                     | 不暂停                  |
| `natural`                         | 随机暂停 800-2500ms     |
| `custom`                          | `minMs`/`maxMs`         |

可通过 `agents.list[].humanDelay` 按智能体覆盖。仅适用于**分块
回复**，不适用于最终回复或工具摘要。

## “流式发送分块或全部内容”

- **流式发送分块：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  （边生成边发送）。非 Telegram 渠道还需要 `*.blockStreaming: true`。
- **在结尾流式发送全部内容：**`blockStreamingBreak: "message_end"`（刷新
  一次；如果内容很长，可能包含多个分块）。
- **不使用分块流式传输：**`blockStreamingDefault: "off"`（仅发送最终回复）。

除非将 `*.blockStreaming` 显式设置为
`true`，否则分块流式传输处于**关闭状态**。渠道可以在不发送分块回复的情况下流式显示实时预览（`channels.<channel>.streaming`）。
`blockStreaming*` 默认值位于
`agents.defaults` 下，而不是配置根节点。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`（嵌套的 `{ mode, ... }`；旧版
顶层布尔值/字符串形式会由 `openclaw doctor --fix` 重写）。

| 模式       | 行为                                                          |
| ---------- | ------------------------------------------------------------- |
| `off`      | 禁用预览流式传输                                              |
| `partial`  | 使用最新文本替换单条预览                                      |
| `block`    | 以分块/追加步骤更新预览                                       |
| `progress` | 生成期间显示进度/状态预览，完成时显示最终答案                 |

`streaming.mode: "block"` 是一种预览流式传输模式，适用于 Discord 和 Telegram
等支持编辑的渠道；它本身不会在这些渠道中启用渠道
分块发送。使用 `streaming.block.enabled` 启用普通分块回复
（没有嵌套 `streaming` 配置的渠道仍使用扁平的 `blockStreaming`
键）。Microsoft Teams 是
例外：它没有草稿预览分块传输，因此 `streaming.mode:
"block"` 会完全禁用原生流式传输，回复将作为常规
分块发送，而不是使用原生的部分/进度流式传输。Mattermost 也有所
不同：在 `block` 模式下，它会在已完成文本和
工具活动块之间轮换预览，因此较早的块会作为单独的帖子保持可见，
而不是在同一个可编辑草稿中被覆盖。

### 渠道映射

| 渠道       | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | 是    | 是        | 是      | 可编辑的进度草稿    |
| Discord    | 是    | 是        | 是      | 可编辑的进度草稿    |
| Slack      | 是    | 是        | 是      | 是                  |
| Mattermost | 是    | 是        | 是      | 是                  |
| MS Teams   | 是    | 是        | 是      | 原生进度流          |

预览分块配置（`streaming.preview.chunk.*`，例如位于
`channels.discord.streaming` 或 `channels.telegram.streaming` 下）默认为
`minChars: 200`、`maxChars: 800`（限制在渠道的 `textChunkLimit` 以内），以及
`breakPreference: "paragraph"`。

仅限 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport`
  用于切换 Slack 原生流式传输 API
  调用（`chat.startStream`/`chat.appendStream`/`chat.stopStream`）（默认：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态需要以回复
  线程为目标。顶层私信不会显示这种线程样式的预览，但仍可
  使用 Slack 草稿预览帖子及其编辑功能。

### 旧版键迁移

| 渠道     | 旧版键                                                      | 状态                                                                                                                                                    |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`、标量/布尔值 `streaming`                       | 由 `openclaw doctor --fix` 重写为 `streaming.mode`；运行时不读取                                                                                         |
| Discord  | `streamMode`、布尔值 `streaming`                            | 由 `openclaw doctor --fix` 重写为 `streaming.mode`；运行时不读取                                                                                         |
| Slack    | `streamMode`；布尔值 `streaming`；旧版 `nativeStreaming`    | 由 `openclaw doctor --fix` 重写为 `streaming.mode`（对于布尔值/旧版形式，还会重写为 `streaming.nativeTransport`）；运行时不读取                           |

## 运行时行为

### Telegram

- 在私信和群组/话题中，使用 `sendMessage` + `editMessageText` 更新预览；最终文本会就地编辑当前预览。Telegram 的 30 秒临时“正在输入”草稿（`sendMessageDraft`）不用于回答流式传输。
- 较短的初始预览仍会进行防抖，以优化推送通知体验，但会在有限延迟后实际显示，因此活跃运行不会一直在视觉上保持静默。
- 较长的最终回复会复用预览消息显示第一个分块，并且仅发送剩余分块。
- `block` 模式会在达到 `streaming.preview.chunk.maxChars` 时将预览轮换为新消息（默认值为 800，上限为 Telegram 的 4096 字符编辑限制）；其他模式则让单个预览增长至最多 4096 个字符。
- `progress` 模式将工具进度保留在可编辑的状态草稿中；回答流式传输已开始但尚无可用工具行时，会显示状态标签；完成时清除草稿，并通过常规投递发送最终回答。
- 如果在确认完整文本之前最终编辑失败，OpenClaw 会使用常规最终投递，并清理过期预览。
- 当明确启用 Telegram 分块流式传输时，会跳过预览流式传输，以避免重复流式传输。
- `/reasoning stream` 可将推理写入临时预览，该预览会在最终投递后删除。
- Telegram 选中文本引用回复属于例外情况：当 `replyToMode` 不为 `"off"` 且存在选中的引用文本时，OpenClaw 会为该轮跳过回答预览流（最终回答必须通过原生引用回复路径发送），因此工具进度预览行无法呈现。不含选中引用文本的当前消息回复仍会保留预览流式传输。详情请参阅 [Telegram 渠道文档](/zh-CN/channels/telegram)。

### Discord

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当明确启用 Discord 分块流式传输时，会跳过预览流式传输。
- `progress` 模式会在最终回答中附加一条小型 `-#` 活动回执（思考/工具调用次数和经过时间），并在该回答投递后删除状态草稿，因此繁忙渠道不会在回复上方留下孤立的工具日志。发生错误的最终回复会保留草稿，作为该失败轮次的记录。
- 最终媒体、错误和显式回复载荷会取消待处理的预览，而不会刷新出新草稿，然后使用常规投递。

### Slack

- 可用时，`partial` 可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 先使用状态预览文本，然后显示最终回答。
- 没有回复线程的顶层私信使用草稿预览帖子和编辑，而不是 Slack 原生流式传输。
- 原生和草稿预览流式传输都会禁止该轮的分块回复，因此 Slack 回复只通过一条投递路径进行流式传输。
- 最终媒体/错误载荷和进度最终回复不会创建用完即弃的草稿消息；只有能够编辑预览的文本/分块最终回复才会刷新待处理的草稿文本。

### Mattermost

- 在 `partial` 模式下，将思考和部分回复文本流式传输到单个草稿预览帖子中，并在最终回答可安全发送时就地完成该帖子。
- 在 `progress` 模式下，将思考和工具活动流式传输到单个状态预览中，并在最终回答可安全发送时就地完成该预览。
- 在 `block` 模式下，在已完成文本帖子和工具活动帖子之间轮换；并行和连续的工具更新共享当前工具活动帖子。
- 如果预览帖子已被删除或在完成时因其他原因不可用，则回退为发送新的最终帖子。
- 最终媒体/错误载荷会在常规投递前取消待处理的预览更新，而不是刷新出临时预览帖子。

### Matrix

- 当最终文本可复用预览事件时，草稿预览会就地完成。
- 仅媒体、错误以及回复目标不匹配的最终回复会在常规投递前取消待处理的预览更新；已显示的过期预览会被撤回。

## 工具进度预览更新

预览流式传输还可以包含**工具进度**更新：工具运行时，会在同一条预览消息中、最终回复之前显示“正在搜索网页”“正在读取文件”或“正在调用工具”等简短状态行。在 Codex app-server 模式下，Codex 前导/评论消息使用同一条预览路径，因此简短的“我正在检查……”进度说明可以流式传输到可编辑草稿中，而不会成为最终回答的一部分。这让多步骤工具轮次在第一次思考预览与最终回答之间保持可见活动，而不是一片静默。

长时间运行的工具可能会在返回前发出类型化进度。例如，`web_fetch` 启动时会设置一个五秒计时器：如果抓取仍在等待，预览会显示 `Fetching page content...`；如果抓取在此之前完成或被取消，则不会发出进度行。之后的最终工具结果仍会正常投递给模型。

支持的界面：

- 当预览流式传输处于活动状态时，**Discord**、**Slack**、**Telegram** 和 **Matrix** 默认会将工具进度和 Codex 前导更新流式传输到实时预览编辑中。Microsoft Teams 在个人聊天中使用其原生进度流。
- 从 `v2026.4.22` 开始，Telegram 已随工具进度预览更新启用状态发布；保持启用可延续这一已发布行为。
- **Mattermost** 在 `partial` 和 `progress` 模式下将工具活动合并到一个预览帖子中，或在 `block` 模式下将其合并到文本块之间的一个工具活动帖子中（见上文）。
- 工具进度编辑遵循当前预览流式传输模式；当预览流式传输为 `off`，或分块流式传输已接管消息时，会跳过这些编辑。在 Telegram 上，`streaming.mode: "off"` 仅进行最终投递：通用进度提示也会被禁止，而不是作为独立状态消息投递；审批提示、媒体载荷和错误仍会正常路由。
- 若要保留预览流式传输但隐藏工具进度行，请将该渠道的 `streaming.preview.toolProgress` 设置为 `false`（默认值为 `true`）。若要保持工具进度行可见但隐藏命令/执行文本，请将 `streaming.preview.commandText` 设置为 `"status"`，或将 `streaming.progress.commandText` 设置为 `"status"`；默认值为 `"raw"`，以保留已发布行为。该策略由使用 OpenClaw 紧凑进度渲染器的草稿/进度渠道共享，包括 Discord、Matrix、Microsoft Teams、Mattermost、Slack 草稿预览和 Telegram。若要完全禁用预览编辑，请将 `streaming.mode` 设置为 `off`。

## 进度草稿渲染

进度模式草稿（`streaming.progress.*`）具有大小限制，并可按渠道配置：

| 键                                | 默认值         | 行为                                                     |
| --------------------------------- | -------------- | -------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`            | 草稿标签下保留的紧凑进度行最大数量                       |
| `streaming.progress.maxLineChars` | `120`          | 每个紧凑行截断前的最大字符数（感知单词边界）             |
| `streaming.progress.label`        | `"auto"`       | 草稿标题；可以是自定义字符串，也可以设为 `false` 以隐藏  |
| `streaming.progress.labels`       | 内置池         | 当 `label: "auto"` 时使用的候选标签                      |

### 评论进度通道

除工具进度外，紧凑进度渲染器还可以在草稿中呈现另一个通道：

- **`streaming.progress.commentary`** - 将模型在使用工具前的**评论**（简短的“我会先检查……然后……”叙述）与工具行交错渲染到进度草稿中。

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

在其他紧凑进度渠道键下使用相同结构，例如 `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost` 或 Slack 草稿预览。对于进度草稿模式，请将相同策略放在 `streaming.progress` 下：

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

## 相关内容

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor) - 共享预览、编辑、流式传输和最终完成设计的目标方案
- [进度草稿](/zh-CN/concepts/progress-drafts) - 在长轮次期间持续更新的可见处理中消息
- [消息](/zh-CN/concepts/messages) - 消息生命周期和投递
- [重试](/zh-CN/concepts/retry) - 投递失败时的重试行为
- [渠道](/zh-CN/channels) - 各渠道的流式传输支持
