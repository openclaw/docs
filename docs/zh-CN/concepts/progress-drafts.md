---
read_when:
    - 为长时间运行的聊天轮次配置可见的进度更新
    - 在部分流式传输、分块流式传输和进度流式传输模式之间进行选择
    - 说明 OpenClaw 如何在工作进行期间更新同一条渠道消息
    - 故障排查进度草稿、独立进度消息或最终处理回退机制
summary: 进度草稿：一条可见的处理中消息，会在智能体运行期间持续更新
title: 进度草稿
x-i18n:
    generated_at: "2026-07-16T11:30:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

进度草稿会在智能体工作时，将一条渠道消息变成实时状态行，而不是堆积一系列临时的“仍在工作”回复。设置
`channels.<channel>.streaming.mode: "progress"` 后，OpenClaw 会在实际工作开始时创建消息，并在智能体读取、规划、调用工具或等待审批时编辑消息，最后将其变为最终答案。

```text
正在工作...
📖 来自 docs/concepts/progress-drafts.md
🔎 Web 搜索：搜索“discord edit message”
🛠️ Bash：运行测试
```

<Note>
  当 `channels.discord.streaming` 未设置时，Discord 已默认使用
  `streaming.mode: "progress"`，因此无需任何配置即可显示进度草稿。其他所有渠道默认使用 `partial`
  或 `off`；有关各渠道默认值的完整表格，请参阅[流式传输和分块](/zh-CN/concepts/streaming#channel-mapping)。
</Note>

## 快速开始

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

此处的默认设置为：启动延迟 5 秒，在进行有用工作时显示紧凑的进度行，并在该轮次中抑制旧式的独立进度消息。原始工具行草稿使用自动生成的单词标签；除非你明确配置标签，否则状态标题会省略这一重复标题。

本页介绍进度草稿体验及其配置选项。有关完整的流式传输模式矩阵、各渠道的运行时说明以及旧键迁移，请参阅[流式传输和分块](/zh-CN/concepts/streaming)。

## 用户看到的内容

| 部分            | 用途                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| 状态标题 | 在 Discord 和 Telegram 上显示模型前言；Discord 还会添加辅助占位文本。       |
| 标签           | 可选的起始/状态行，例如 `Working`。                                   |
| 进度行  | 使用与 `/verbose` 相同的工具图标和详细信息格式化程序显示紧凑的运行更新。 |

对于原始工具进度，标签会在智能体开始有意义的工作并持续忙碌至初始延迟结束后显示。
它位于滚动进度行列表的顶部，因此在出现足够多的具体工作行后会滚出视野。除非明确配置标签，否则状态标题仅显示智能体的自然语言状态。纯文本回复绝不会显示进度草稿；只有真实工作更新才会产生进度行，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"`
或 `✍️ Write: to /tmp/file`。

如果渠道能够安全地执行此操作，最终答案会原位替换草稿；否则，OpenClaw 会通过正常投递方式发送最终答案，并清理草稿或停止更新草稿（参阅[最终处理](#finalization)）。

## 选择模式

`channels.<channel>.streaming.mode` 控制进行中状态的可见行为：

| 模式       | 最适合                         | 聊天中显示的内容                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安静的渠道                   | 仅显示最终答案。                            |
| `partial`  | 查看答案文本逐步出现      | 编辑一份草稿，使其显示最新的答案文本。     |
| `block`    | 较大的答案预览分块     | 以较大的分块更新或追加一份预览。 |
| `progress` | 大量使用工具或长时间运行的轮次 | 显示一份状态草稿，然后显示最终答案。          |

当用户更关心“正在发生什么”而不是逐 token 查看答案文本流时，选择 `progress`；当答案文本本身就是进度信号时，选择 `partial`；若要使用较大的预览分块，则选择 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍是预览流式传输，而不是普通的分块回复投递——后者请使用 `streaming.block.enabled`。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。默认的原始工具行标签为 `"auto"`，它使用内置的普通 `Working` 标签。状态标题会隐藏这个隐式标签；如果还希望在状态标题上方显示标签，请明确设置
`label: "auto"`：

```text
工作中
```

使用固定标签：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "正在调查",
        },
      },
    },
  },
}
```

使用你自己的标签池（当 `label: "auto"` 时，仍会随机/按种子选择）：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["正在检查", "正在读取", "正在测试", "即将完成"],
        },
      },
    },
  },
}
```

隐藏标签，仅显示进度行：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## 控制进度行

进度行来自真实的运行事件：工具启动、项目更新、任务计划、审批、命令输出、补丁摘要以及类似的智能体活动。它们默认启用（`progress.toolProgress`，默认值为 `true`）。

工具也可以在单次调用仍在运行时发出类型化进度。这样，缓慢的获取或搜索操作就能在工具返回最终结果前更新可见草稿。进度更新是一项工具部分结果，包含空的模型内容和显式的公开渠道元数据：

```json
{
  "content": [],
  "progress": {
    "text": "正在获取页面内容...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw 仅在渠道进度 UI 中呈现 `progress.text`。正常工具结果随后仍会以 `content`/`details` 的形式到达，并且只有这一部分会返回给模型。

向工具添加进度时，应发出简短的通用消息，并等待操作处于待处理状态足够长的时间、显示进度确实有用时再发送。`web_fetch` 正是采用 5 秒延迟来执行此操作：

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "正在获取页面内容...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

快速调用不会显示进度行；长时间调用会在仍处于待处理状态时显示一行；已取消的调用会清除计时器，避免出现过时进度。进度文本是公开的 UI 旁路渠道，因此绝不能包含机密、原始参数、已获取的内容、命令输出或页面文本。

### 详细信息模式

OpenClaw 对进度草稿和 `/verbose` 使用相同的格式化程序：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是默认值，它通过简洁标签保持草稿稳定。`"raw"` 会在可用时追加底层命令，这在调试时很有用，但会让聊天更加嘈杂。例如，`node --check /tmp/app.js` 调用在不同模式下的呈现方式如下：

| 模式      | 进度行                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### 命令/exec 文本

`streaming.progress.commandText`（默认值为 `"raw"`）控制 exec/bash 进度行旁显示多少命令详细信息，并独立于上述详细信息模式。将其设置为 `"status"`，可在保持工具进度行可见的同时完全隐藏命令文本：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### 解说通道

`streaming.progress.commentary`（默认值为 `false`）会将模型在使用工具前的解说/前言叙述（💬，例如“我会先检查……然后……”）与草稿中的工具行交错显示。有关各渠道共用的配置结构，请参阅[流式传输和分块](/zh-CN/concepts/streaming#commentary-progress-lane)。

启用解说通道后，前言仅呈现为这些交错的 💬 行；下方的状态标题不会显示，从而让该通道保持其文档所述的结构。

### 状态标题

在 Discord 和 Telegram 的进度模式下，只要模型提供了类型化的工具前前言，它就会成为草稿的状态标题。其他进度模式渠道则保留现有的状态行为。状态标题默认开启，并且不会绕过短轮次的常规活动门槛；启用 `streaming.progress.commentary` 后，前言会改为交给交错的解说通道。

在 Discord 上，当智能体解析到辅助模型时——显式的 [`utilityModel`](/zh-CN/gateway/config-agents#utilitymodel)，或主要提供商声明的小模型默认值（OpenAI → `gpt-5.6-luna`，Anthropic → `claude-haiku-4-5`）——如果模型没有发出前言或已沉默约 20 秒，它会提供简短的自然语言占位文本（目前 Telegram 的标题仅使用前言）：

```text
正在更新配置中的默认模型，然后重启 Gateway 网关以应用该配置。
一次智能体列表调用失败，正在重试。
```

辅助叙述默认开启（`streaming.progress.narration`，默认值为 `true`），并且绝不会回退到主要模型：它仅在存在显式 `utilityModel`，或智能体的主要提供商为其声明了默认值时运行。将 `utilityModel: ""` 设置为禁用，可彻底关闭辅助路由。工具行会继续在下方累积，并在两个状态来源都停止时重新显示。草稿编辑仍会等待常规活动门槛和实际文本变化，从而避免快速轮次中出现闪烁，并减少繁忙渠道中的编辑频率。将 `narration: false` 设置为禁用，可仅关闭辅助模型占位文本；模型前言标题仍保持启用：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

叙述输入有长度限制且经过脱敏：辅助模型接收传入的请求文本，以及草稿会呈现的相同紧凑脱敏工具摘要——绝不会接收原始命令输出或工具结果。使用 `commandText: "status"` 时，叙述输入也会省略 exec/bash 命令文本，与草稿显示的内容保持一致。

### 行数限制

限制保持可见的行数（默认值为 8）：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

在编辑草稿时，进度行会自动压缩，以减少聊天气泡的重排；OpenClaw 还会截断过长的行，使重复的草稿编辑不会在每次更新时以不同方式换行。默认的单行预算为 120 个字符；普通文本会在单词边界处截断，而路径或原始命令等较长的详细信息则使用中间省略号缩短，以保持后缀可见。

调整单行预算：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

### 富文本呈现（Slack）

Slack 可以将进度行呈现为结构化的 Block Kit 字段，而不是纯文本：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

富文本呈现始终会在 Block Kit 字段之外同时发送相同的纯文本正文，因此无法呈现更丰富结构的客户端仍会显示紧凑的进度文本。

### 隐藏工具/任务行

保留单一进度草稿，但隐藏工具和任务行：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

使用 `toolProgress: false` 时，OpenClaw 仍会抑制该轮次中较旧的独立
工具进度消息——在最终答案出现前，渠道界面会保持安静，
但已配置标签时仍会显示该标签。

## 渠道行为

| 渠道            | 进度传输方式                           | 说明                                                                                                                                                                      |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 发送一条消息，然后编辑。               | 默认使用 `progress` 模式；最终答案附带 `-#` 活动回执，并在答案送达后删除状态草稿。                                                                  |
| Matrix          | 发送一个事件，然后编辑。               | 账号级流式传输配置控制账号级草稿。                                                                                                                                        |
| Microsoft Teams | 在个人聊天中使用原生 Teams 流。        | `streaming.mode: "block"` 会改为映射到 Teams 分块投递。                                                                                                                          |
| Slack           | 原生流或可编辑的草稿帖子。             | 需要回复线程目标；没有目标的顶层私信仍会获得草稿预览帖子及其编辑。                                                                                                        |
| Telegram        | 发送一条消息，然后编辑。               | 如果在进度草稿和答案之间出现新消息，草稿会重新发布到该消息下方（先发新帖，再删除旧帖），而不是让客户端滚动位置突跳。                                                        |
| Mattermost      | 可编辑的草稿帖子。                     | `block` 模式会在已完成文本和工具活动帖子之间轮换；其他模式会将工具活动合并到同一篇草稿样式的帖子中。                                                            |

不支持安全编辑的渠道会回退到输入状态指示器或
仅投递最终答案。有关各渠道完整的运行时行为说明，请参阅
[流式传输和分块](/zh-CN/concepts/streaming)。

## 最终处理

最终答案准备就绪后，OpenClaw 会尽量保持聊天界面整洁：

- 在 Discord 的 `progress` 模式下，最终答案会作为新消息发送，
  并附加一条简短的 `-#` 活动回执（例如
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`）；答案送达后，
  状态草稿会被删除。即使渠道消息频繁，回复上方也不会遗留孤立的工具
  日志；如果最终结果为错误，则会保留草稿，作为该失败轮次的可见记录。
- 如果草稿可以安全地转为最终答案（`partial`/`block` 模式），
  OpenClaw 会直接原地编辑草稿。
- 如果渠道使用原生进度流式传输，原生传输接受最终文本后，
  OpenClaw 会结束该流。
- 在其他情况下（包含媒体、审批提示、明确的回复目标、分块过多，
  或编辑/发送失败），OpenClaw 会通过常规渠道投递路径发送最终答案，
  而不是覆盖草稿。

这种回退是有意设计的：发送一条新的最终答案，要优于丢失文本、
将回复放入错误线程，或使用渠道无法安全表示的负载覆盖草稿。

## 故障排查

**我只能看到最终答案。**

检查处理该消息的账号或渠道是否将 `channels.<channel>.streaming.mode`
设为 `progress`。当渠道无法安全编辑正确的消息时，
某些群组或引用回复路径会在该轮次禁用草稿预览。

**我能看到标签，但看不到工具行。**

检查 `streaming.progress.toolProgress`。如果其值为 `false`，OpenClaw 会保留
单草稿行为，但隐藏工具和任务进度行。

**我看到了一条新的最终消息，而不是经过编辑的草稿。**

这是[最终处理](#finalization)中所述的安全回退。媒体回复、长答案、
明确的回复目标、过期的 Telegram 草稿、缺失的 Slack 线程目标、
已删除的预览消息或原生流最终处理失败，都可能触发这种情况。

**我仍然能看到独立的进度消息。**

只要草稿处于活动状态，进度模式就会抑制默认的独立工具进度消息。
如果仍然出现独立消息，请确认该轮次实际使用的是
`progress` 模式，而不是 `streaming.mode: "off"`，也不是无法为该消息
创建草稿的渠道路径。

**Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的
发送并编辑预览传输方式；此外，它会将 `streaming.mode: "block"` 映射为 Teams
分块投递，因为它不像 Discord 和 Telegram 那样提供草稿预览分块模式。

## 相关内容

- [流式传输和分块](/zh-CN/concepts/streaming)
- [消息](/zh-CN/concepts/messages)
- [频道配置](/zh-CN/gateway/config-channels)
- [Discord](/zh-CN/channels/discord)
- [Matrix](/zh-CN/channels/matrix)
- [Microsoft Teams](/zh-CN/channels/msteams)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
- [Mattermost](/zh-CN/channels/mattermost)
