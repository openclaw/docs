---
read_when:
    - 说明渠道上的流式传输或分块如何工作
    - 更改分块流式传输或渠道分块行为
    - 调试重复/过早的分块回复或渠道预览流式传输
summary: 流式传输和分块行为（分块回复、渠道预览流式传输、模式映射）
title: 流式传输和分块
x-i18n:
    generated_at: "2026-07-16T11:34:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw 有两个相互独立的流式传输层，目前向渠道消息进行的**并不是真正的
Token 增量流式传输**：

- **分块流式传输（渠道）：**在助手写作过程中发送已完成的**文本块**。
  这些是普通渠道消息，并非 Token 增量。
- **预览流式传输（Telegram/Discord/Slack/Matrix/Mattermost/MS Teams）：**
  在生成期间更新一条临时**预览消息**（发送 + 编辑/追加）。

## 分块流式传输（渠道消息）

分块流式传输会在助手输出可用时，将其按较粗粒度的分块发送。

```text
模型输出
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ 缓冲区增长时，分块器发送文本块
       └─ (blockStreamingBreak=message_end)
            └─ 分块器在 message_end 时清空缓冲区
                   └─ 渠道发送（分块回复）
```

- `text_delta/events`：模型流事件（对于非流式模型可能较为稀疏）。
- `chunker`：`EmbeddedBlockChunker` 应用最小/最大边界和断点偏好。
- `channel send`：实际出站消息（分块回复）。

**控制项**（除非另有说明，否则均位于 `agents.defaults` 下）：

| 键                                                           | 值 / 结构                                                                | 默认值     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }`（发送前合并流式文本块） | -          |
| `*.streaming.block.enabled`（渠道覆盖项）               | `true` / `false`，按渠道（以及按账户）强制启用分块流式传输  | -          |
| `*.textChunkLimit`（例如 `channels.whatsapp.textChunkLimit`） | 数字，硬上限                                                        | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | 数字，用于拆分过长回复以避免 UI 裁切的软行数上限     | 17         |

`streaming.chunkMode: "newline"` 会按空行（段落边界）拆分，而不是按每个换行符拆分；
当文本超过限制后，才回退到按长度分块。

内置渠道将这些覆盖项写作
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`。扁平形式的
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` 写法
在每个内置渠道中均属于旧版写法：`openclaw doctor --fix` 会将它们迁移到
嵌套结构，且渠道架构会拒绝这些写法。仍使用扁平写法的外部 SDK 插件
配置会通过已弃用的回退机制继续工作（并产生运行时警告），直至下一个发布周期。

`blockStreamingBreak` 的**边界语义**：

- `text_end`：分块器一发送文本块，就立即对其进行流式传输；在每个 `text_end` 时清空缓冲区。
- `message_end`：等待助手消息完成，然后清空已缓冲的
  输出。如果缓冲文本超过 `maxChars`，仍会使用分块器，因此可能在结束时
  发送多个分块。

### 分块流式传输中的媒体交付

流式媒体必须使用 `mediaUrl` 或
`mediaUrls` 等结构化有效负载字段；流式文本不会被解析为附件命令。当分块
流式传输提前发送媒体时，OpenClaw 会记住本轮次中的此次交付。如果
最终助手有效负载重复了相同的媒体 URL，最终交付会移除
重复媒体，而不是再次发送附件。

完全重复的最终有效负载会被抑制。如果最终有效负载在已经通过流式传输发送的媒体
周围添加了不同文本，OpenClaw 仍会发送新文本，同时确保媒体只交付一次。
这可以防止在 Telegram 等渠道上出现重复的语音消息或文件。

## 分块算法（低/高边界）

分块由 `EmbeddedBlockChunker` 实现：

- **低边界：**缓冲区达到 `minChars` 之前不发送（强制发送除外）。
- **高边界：**优先在 `maxChars` 之前拆分；如果强制拆分，则在 `maxChars` 处拆分。
- **断点偏好顺序：**`paragraph` -> `newline` -> `sentence` ->
  空白字符 -> 硬拆分。
- **代码围栏：**绝不在围栏内部拆分；在 `maxChars` 处被迫拆分时，关闭
  并重新打开围栏，以保持 Markdown 有效。

`maxChars` 会被限制在渠道的 `textChunkLimit` 以内，因此无法超过
各渠道的上限。

## 合并（合并流式文本块）

启用分块流式传输后，OpenClaw 可以在发送前**合并连续的分块
片段**，既减少单行消息轰炸，又仍能提供渐进式输出。

- 合并会等待出现**空闲间隔**（`idleMs`）后再清空缓冲区。
- 缓冲区以 `maxChars` 为上限，超过后将清空。
- `minChars` 会阻止发送过小的片段，直到积累足够多的文本
  （最终清空始终会发送剩余文本）。
- 连接符根据 `blockStreamingChunk.breakPreference` 得出：`paragraph` ->
  `\n\n`，`newline` -> `\n`，`sentence` -> 空格。
- 可通过 `*.streaming.block.coalesce` 使用渠道覆盖项（包括
  按账户配置）。
- Discord、Signal 和 Slack 默认会合并至 `{ minChars: 1500, idleMs: 1000 }`，
  除非被覆盖。

## 文本块之间模拟人类节奏的停顿

启用分块流式传输后，在第一个文本块之后的各分块回复之间添加**随机停顿**，
让多气泡回复感觉更自然。

| `agents.defaults.humanDelay.mode` | 行为                    |
| --------------------------------- | ----------------------- |
| `off`（默认）                   | 不停顿                  |
| `natural`                         | 随机停顿 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

可通过 `agents.list[].humanDelay` 按智能体覆盖。仅适用于**分块
回复**，不适用于最终回复或工具摘要。

## “流式传输分块或全部内容”

- **流式传输分块：**`blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  （边生成边发送）。非 Telegram 渠道还需要
  `*.streaming.block.enabled: true`。
- **在结束时流式传输全部内容：**`blockStreamingBreak: "message_end"`（清空
  一次；如果内容很长，可能产生多个分块）。
- **不进行分块流式传输：**`blockStreamingDefault: "off"`（仅发送最终回复）。

除非将 `*.streaming.block.enabled` 显式
设置为 `true`，否则分块流式传输处于**关闭状态**
（例外：QQ Bot 没有 `streaming.block` 键，并且会流式发送
分块回复，除非 `channels.qqbot.streaming.mode` 为 `"off"`）。渠道可以
在不发送分块回复的情况下流式传输实时预览（`channels.<channel>.streaming.mode`）。
`blockStreaming*` 默认值位于 `agents.defaults` 下，而不是配置根节点。

## 预览流式传输模式

规范键：`channels.<channel>.streaming`（嵌套的 `{ mode, ... }`；旧版
顶层布尔值/字符串写法会由 `openclaw doctor --fix` 重写）。

| 模式       | 行为                                                                  |
| ---------- | --------------------------------------------------------------------- |
| `off`      | 禁用预览流式传输                                             |
| `partial`  | 用最新文本替换单条预览消息                              |
| `block`    | 以分块/追加步骤更新预览                             |
| `progress` | 生成期间显示进度/状态预览，完成时显示最终答案 |

`streaming.mode: "block"` 是一种适用于 Discord 和 Telegram 等支持编辑的
渠道的预览流式传输模式；它本身不会在这些渠道上启用渠道分块交付。
使用 `streaming.block.enabled` 发送普通分块回复。
Microsoft Teams 是个例外：它没有草稿预览分块传输，因此 `streaming.mode:
"block"`
会完全禁用原生流式传输，回复将作为常规分块交付，而不是原生的
部分/进度流式传输。Mattermost 也有所不同：在 `block` 模式下，
它会在已完成文本和工具活动块之间轮换预览，因此较早的文本块会作为独立帖子
保持可见，而不会在单个可编辑草稿中被覆盖。

### 渠道映射

| 渠道       | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | 是    | 是        | 是      | 可编辑的进度草稿        |
| Discord    | 是    | 是        | 是      | 可编辑的进度草稿        |
| Slack      | 是    | 是        | 是      | 是                      |
| Mattermost | 是    | 是        | 是      | 是                      |
| MS Teams   | 是    | 是        | 是      | 原生进度流              |

预览分块配置（`streaming.preview.chunk.*`，例如位于
`channels.discord.streaming` 或 `channels.telegram.streaming` 下）默认使用
`minChars: 200`、`maxChars: 800`（限制在渠道的 `textChunkLimit` 以内）和
`breakPreference: "paragraph"`。

仅限 Slack：

- 当 `channels.slack.streaming.mode="partial"` 时，`channels.slack.streaming.nativeTransport` 会切换 Slack 原生流式传输 API
  调用（`chat.startStream`/`chat.appendStream`/`chat.stopStream`）
  （默认值：`true`）。
- Slack 原生流式传输和 Slack 助手线程状态需要回复
  线程目标。顶层私信不显示这种线程式预览，但仍可
  使用 Slack 草稿预览帖子和编辑。

### 旧版键迁移

| 渠道     | 旧版键                                                      | 状态                                                                                                                                                 |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`、标量/布尔值 `streaming`                    | 由 `openclaw doctor --fix` 重写为 `streaming.mode`；运行时不读取                                                                        |
| Discord  | `streamMode`、布尔值 `streaming`                           | 由 `openclaw doctor --fix` 重写为 `streaming.mode`；运行时不读取                                                                        |
| Slack    | `streamMode`；布尔值 `streaming`；旧版 `nativeStreaming` | 由 `openclaw doctor --fix` 重写为 `streaming.mode`（布尔值/旧版形式重写为 `streaming.nativeTransport`）；运行时不读取         |
| Matrix   | 标量/布尔值 `streaming`                                  | 由 `openclaw doctor --fix` 重写为 `streaming.mode`（包括 Matrix 的 `"quiet"` 模式）；运行时不读取                                    |
| Feishu   | 布尔值 `streaming`                                         | 由 `openclaw doctor --fix` 重写为 `streaming.mode`；运行时不读取                                                                        |
| QQ Bot   | 布尔值 `streaming`；`streaming.c2cStreamApi`               | 由 `openclaw doctor --fix` 重写为 `streaming.mode`（布尔值/`c2cStreamApi` 形式重写为 `streaming.nativeTransport`）；运行时不读取 |

## 运行时行为

### Telegram

- 在私信和群组/话题中使用 `sendMessage` + `editMessageText` 预览更新；最终文本会就地编辑当前预览。Telegram
  的 30 秒临时“正在输入”草稿（`sendMessageDraft`）不用于
  回答流式传输。
- 为优化推送通知体验，较短的初始预览仍会进行防抖处理，但会在有界延迟后
  显示，以免运行期间界面长时间没有任何可见内容。
- 对于较长的最终回复，第一块内容会复用预览消息，仅发送
  剩余内容块。
- `block` 模式会在
  `streaming.preview.chunk.maxChars` 时将预览轮换为新消息（默认 800，上限为 Telegram 的 4096
  字符编辑限制）；其他模式会让单条预览增长到最多 4096 个字符。
- `progress` 模式会将工具进度保留在可编辑的状态草稿中；当回答流式传输处于活动状态但
  尚无可用工具行时，会显示状态标签；完成时清除草稿，并通过
  常规投递发送最终回答。
- 如果在确认完整文本前最终编辑失败，OpenClaw 会使用
  常规最终投递并清理过期预览。
- 显式启用 Telegram 分块流式传输时，会跳过预览流式传输，
  以避免重复流式传输。
- `/reasoning stream` 可以将推理内容写入临时预览，
  并在最终投递后将其删除。
- Telegram 选中文字引用回复属于例外情况：当 `replyToMode` 不为
  `"off"` 且存在选中的引用文本时，OpenClaw 会跳过该轮的回答预览
  流式传输（最终回答必须通过原生引用回复
  路径发送），因此无法呈现工具进度预览行。没有选中引用文本的当前消息回复
  仍会保留预览流式传输。详情参阅
  [Telegram 渠道文档](/zh-CN/channels/telegram)。

### Discord

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 显式启用 Discord 分块流式传输时，会跳过预览流式传输。
- `progress` 模式会在最终回答后附加一条简短的 `-#` 活动回执（思考/工具调用
  次数和耗时），并在回答投递后删除状态草稿，
  因此繁忙渠道不会在回复上方留下孤立的工具日志。
  对于错误最终回复，则会保留草稿，作为该失败轮次的记录。
- 最终媒体、错误和显式回复载荷会取消待处理的预览，
  而不会刷新出新草稿，随后使用常规投递。

### Slack

- 可用时，`partial` 可以使用 Slack 原生流式传输（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加式草稿预览。
- `progress` 先使用状态预览文本，然后发送最终回答。
- 没有回复线程的顶层私信使用草稿预览帖子及编辑，
  而不是 Slack 原生流式传输。
- 原生和草稿预览流式传输会抑制该轮的分块回复，因此一条
  Slack 回复仅通过一种投递路径进行流式传输。
- 最终媒体/错误载荷和进度最终回复不会创建用完即弃的草稿
  消息；只有能够编辑预览的文本/块最终回复才会刷新待处理的
  草稿文本。

### Mattermost

- 在 `partial` 模式下，会将思考和部分回复文本流式传输到单个草稿
  预览帖子中，并在最终回答可安全发送时就地完成该帖子。
- 在 `progress` 模式下，会将思考和工具活动流式传输到单个状态
  预览中，并在最终回答可安全发送时就地完成该预览。
- 在 `block` 模式下，会在已完成文本和工具活动帖子之间轮换；
  并行和连续的工具更新会共用当前工具活动帖子。
- 如果预览帖子已被删除或在最终完成时因其他原因不可用，
  则回退为发送新的最终帖子。
- 最终媒体/错误载荷会在常规投递前取消待处理的预览更新，
  而不是刷新出临时预览帖子。

### Matrix

- 当最终文本可以复用预览事件时，草稿预览会就地完成。
- 仅媒体、错误和回复目标不匹配的最终回复会在常规投递前取消待处理的预览
  更新；已经可见的过期预览会被撤回。

## 工具进度预览更新

预览流式传输也可包含**工具进度**更新：工具运行期间，
会在同一条预览消息中、最终回复之前显示“正在搜索网页”“正在读取文件”或“正在调用工具”等简短状态
行。在 Codex app-server 模式下，Codex 前导消息/评注消息使用相同的
预览路径，因此简短的“我正在检查……”进度说明可以流式传输到
可编辑草稿中，而不会成为最终回答的一部分。这样可使
多步骤工具轮次持续显示动态，而不会在首次思考预览与最终回答之间
陷入沉默。

长时间运行的工具可能会在返回前发出类型化进度。例如，
`web_fetch` 启动时会设置一个五秒计时器：如果获取仍在
等待中，预览会显示 `Fetching page content...`；如果获取在此之前完成或
被取消，则不会发出进度行。之后的最终工具
结果仍会正常投递给模型。

支持的界面：

- 当预览流式传输处于活动状态时，**Discord**、**Slack**、**Telegram** 和 **Matrix** 默认会将工具进度和
  Codex 前导更新流式传输到实时预览编辑中。Microsoft Teams 在
  个人聊天中使用其原生进度流。
- 自 `v2026.4.22` 起，Telegram 发布版本中已启用工具进度预览更新；
  保持启用可延续这一已发布行为。
- **Mattermost** 在 `partial` 和
  `progress` 模式下将工具活动合并到一条预览帖子中，或在 `block`
  模式下将其合并到文本块之间的一条工具活动帖子中（见上文）。
- 工具进度编辑遵循当前预览流式传输模式；当预览流式传输为
  `off`，或分块流式传输已接管消息时，会跳过这些编辑。在 Telegram 上，
  `streaming.mode: "off"` 仅用于最终回复：通用进度消息也会被抑制，而不是作为独立状态
  消息投递；审批提示、媒体载荷和错误仍会
  正常路由。
- 要保留预览流式传输但隐藏工具进度行，请将该渠道的
  `streaming.preview.toolProgress` 设置为 `false`（默认值为
  `true`）。要在隐藏命令/执行文本的同时保持工具进度行可见，
  请将 `streaming.preview.commandText` 设置为 `"status"`，或将
  `streaming.progress.commandText` 设置为 `"status"`；默认值为 `"raw"`，
  以保留已发布行为。该策略由使用 OpenClaw 紧凑进度渲染器的
  草稿/进度渠道共享，包括 Discord、Matrix、
  Microsoft Teams、Mattermost、Slack 草稿预览和 Telegram。要完全禁用
  预览编辑，请将 `streaming.mode` 设置为 `off`。

## 进度草稿渲染

进度模式草稿（`streaming.progress.*`）具有大小限制，并可按
渠道配置：

| 键                                | 默认值        | 行为                                                           |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | 草稿标签下方保留的紧凑进度行数上限                             |
| `streaming.progress.maxLineChars` | `120`         | 截断前每条紧凑行的最大字符数（按单词边界）                     |
| `streaming.progress.label`        | `"auto"`      | 草稿标题；可使用自定义字符串，或使用 `false` 将其隐藏 |
| `streaming.progress.labels`       | 内置池        | 当 `label: "auto"` 时使用的候选标签                         |

### 评注进度通道

除工具进度外，紧凑进度渲染器还可在草稿中呈现另一个
通道：

- **`streaming.progress.commentary`** - 将模型在使用工具前的
  **评注**（简短的“我会先检查……然后……”叙述）与
  工具行交错呈现在进度草稿中。在进度模式下的 Discord 和 Telegram 上，
  即使关闭了此可选通道，同一前导消息也会用作状态标题；
  其他渠道则保持其现有进度行为。参阅
  [进度草稿](/zh-CN/concepts/progress-drafts#status-headline)。

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

可在其他紧凑进度渠道键下使用相同结构，例如
`channels.discord`、`channels.matrix`、`channels.msteams`、
`channels.mattermost` 或 Slack 草稿预览。对于进度草稿模式，请将
相同策略放在 `streaming.progress` 下：

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

- [消息生命周期重构](/zh-CN/concepts/message-lifecycle-refactor) - 共享预览、编辑、流式传输和最终完成的目标设计
- [进度草稿](/zh-CN/concepts/progress-drafts) - 在长轮次期间更新的可见进行中消息
- [消息](/zh-CN/concepts/messages) - 消息生命周期和投递
- [重试](/zh-CN/concepts/retry) - 投递失败时的重试行为
- [渠道](/zh-CN/channels) - 各渠道的流式传输支持
