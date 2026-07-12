---
read_when:
    - 为长时间运行的聊天轮次配置可见的进度更新
    - 在 partial、分块流式传输和进度流式传输模式之间进行选择
    - 说明 OpenClaw 如何在工作进行期间更新一条渠道消息
    - 进度草稿、独立进度消息或最终确定回退的故障排查
summary: 进度草稿：一条可见的进行中消息，在智能体运行时持续更新
title: 进度草稿
x-i18n:
    generated_at: "2026-07-12T21:23:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f937a61dfa360ac1d6c67e1a05e5ac698af563f2b58624d6de4e69a7f904cdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

进度草稿会在智能体工作时，将一条渠道消息变为实时状态行，而不是堆叠多条临时的“仍在工作”回复。设置
`channels.<channel>.streaming.mode: "progress"` 后，OpenClaw 会在实际工作开始时创建消息，并在智能体读取、规划、调用工具或等待审批时编辑该消息，最后再将其变为最终答案。

```text
执行 Shell...
📖 读取 docs/concepts/progress-drafts.md
🔎 Web 搜索：搜索 "discord edit message"
🛠️ Bash：运行测试
```

<Note>
  当 `channels.discord.streaming` 未设置时，Discord 已默认使用
  `streaming.mode: "progress"`，因此无需任何配置即可在那里显示进度草稿。其他所有渠道均默认为 `partial`
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

此处的默认行为是：启动延迟为 5 秒（如果发生第二个工作事件则立即启动）、在执行有效工作时显示紧凑的进度行，并抑制该轮次中旧版的独立进度消息。原始工具行草稿使用自动生成的单词标签；除非你显式配置标签，否则叙述式状态会省略这个多余的标题。

本页介绍进度草稿体验及其配置选项。有关完整的流式传输模式矩阵、各渠道的运行时说明以及旧版键迁移，请参阅[流式传输和分块](/zh-CN/concepts/streaming)。

## 用户看到的内容

| 部分           | 用途                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| 标签          | 可选的起始/状态行，例如 `Working` 或 `Shelling`。                     |
| 进度行 | 使用与 `/verbose` 相同的工具图标和详细信息格式化程序显示紧凑的运行更新。 |

对于原始工具进度，当智能体开始执行有意义的工作并持续忙碌超过初始延迟，或第二个工作事件立即触发时，标签便会出现。它位于滚动进度行列表顶部，因此当出现足够多的具体工作行后，会随着滚动离开视野。叙述式进度仅显示智能体的自然语言状态，除非显式配置了标签。纯文本回复绝不会显示进度草稿；只有实际工作更新才会显示进度行，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"` 或 `✍️ Write: to /tmp/file`。

如果渠道能够安全地执行此操作，最终答案会原地替换草稿；否则，OpenClaw 会通过正常投递流程发送最终答案，并清理草稿或停止更新草稿（请参阅[最终处理](#finalization)）。

## 选择模式

`channels.<channel>.streaming.mode` 控制工作进行期间的可见行为：

| 模式       | 最适合                         | 聊天中显示的内容                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安静的渠道                   | 仅显示最终答案。                            |
| `partial`  | 查看答案文本逐步出现      | 编辑一条草稿，使其显示最新的答案文本。     |
| `block`    | 较大的答案预览分块     | 以较大的分块更新或追加一条预览。 |
| `progress` | 工具密集型或长时间运行的轮次 | 一条状态草稿，随后显示最终答案。          |

当用户更关心“正在发生什么”，而不是逐 token 查看答案文本流时，请选择 `progress`；当答案文本本身就是进度信号时，请选择 `partial`；需要较大的预览分块时，请选择 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍表示预览流式传输，而不是普通的分块回复投递——后者请使用 `streaming.block.enabled`。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。默认的原始工具行标签为 `"auto"`，它会从 OpenClaw 内置的单词标签池中选择。叙述式进度会隐藏这个隐式标签；如果你也希望在叙述内容上方显示标签，请显式设置 `label: "auto"`：

```text
工作中、执行 Shell、快速移动、挥动利爪、钳夹、蜕壳、冒泡、随潮而行、
礁间作业、破壳、筛选、盐渍、鹦鹉螺作业、磷虾作业、藤壶作业、
龙虾作业、潮池作业、采珠、快速夹取、浮出水面
```

使用固定标签：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

使用你自己的标签池（当 `label: "auto"` 时，仍会随机或根据种子选择）：

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
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

进度行来自实际的运行事件：工具启动、项目更新、任务计划、审批、命令输出、补丁摘要以及类似的智能体活动。它们默认启用（`progress.toolProgress`，默认值为 `true`）。

工具还可以在单次调用仍在运行时发出类型化进度。这使耗时较长的获取或搜索操作能够在工具返回最终结果之前更新可见草稿。进度更新是一个部分工具结果，其中模型内容为空，并带有显式的公开渠道元数据：

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

OpenClaw 在渠道进度 UI 中仅渲染 `progress.text`。正常的工具结果稍后仍会以 `content`/`details` 的形式到达，并且只有这部分会返回给模型。

为工具添加进度时，应发出简短、通用的消息，并将其延迟到操作等待时间足够长、显示进度确有帮助时再发送。`web_fetch` 正是采用 5 秒延迟实现这一点：

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

快速调用不显示进度行；长时间调用在仍处于待处理状态时会显示一行进度；
已取消的调用会在过期进度出现之前清除计时器。进度文本是公开的 UI 旁路渠道，因此绝不能包含密钥、原始参数、
获取的内容、命令输出或页面文本。

### 详细模式

OpenClaw 对进度草稿和 `/verbose` 使用相同的格式化器：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是默认模式，它通过简洁的标签保持草稿稳定。
`"raw"` 会在底层命令可用时追加该命令，这在调试时很有用，
但会使聊天内容更嘈杂。例如，调用 `node --check /tmp/app.js` 时，
不同模式下的呈现方式有所不同：

| 模式      | 进度行                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### 命令/exec 文本

`streaming.progress.commandText`（默认值为 `"raw"`）控制 exec/bash 进度行旁显示的命令详细程度，与上述详细信息模式无关。将其设置为 `"status"`，可在保留工具进度行可见的同时完全隐藏命令文本：

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

### Commentary 通道

`streaming.progress.commentary`（默认为 `false`）会在草稿中将模型调用工具前的解说/前导叙述（💬，例如“我会先检查……然后……”）与工具行交错显示。有关各渠道共用的配置结构，请参阅[流式传输和分块](/zh-CN/concepts/streaming#commentary-progress-lane)。

### 叙述式状态

当智能体可以使用实用模型时——即显式配置的 [`utilityModel`](/zh-CN/gateway/config-agents#utilitymodel)，或主要提供商声明的默认小模型（OpenAI → `gpt-5.6-luna`，Anthropic → `claude-haiku-4-5`）——进度草稿会用简短的自然语言叙述替换不断滚动的工具行，说明智能体正在执行的操作。该叙述由成本较低的模型编写，并随工作进展持续刷新：

```text
正在更新配置中的默认模型，然后重启 Gateway 网关以使其生效。一次智能体列表调用失败，正在重试。
```

叙述功能默认开启（`streaming.progress.narration`，默认为 `true`），且绝不会回退到主要模型：它仅在显式配置了 `utilityModel`，或智能体的主要提供商声明了默认模型时运行。将 `utilityModel: ""` 设置为空字符串可完全禁用实用模型路由。工具行会继续在下方累积；如果叙述停止，它们会重新显示。只有在通过正常活动门控且叙述文本确实发生变化后，草稿才会被编辑，从而避免快速轮次中的闪烁，并减少繁忙渠道中的编辑抖动。如需保留原始工具行，请禁用此功能：

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

旁白输入受到限制并经过脱敏：实用模型接收传入的请求文本，以及草稿将呈现的同一组紧凑、脱敏的工具摘要——绝不会接收原始命令输出或工具结果。使用
`commandText: "status"` 时，旁白输入还会省略 exec/bash 命令文本，与草稿显示的内容保持一致。

### 行数限制

限制保持可见的行数（默认为 8）：

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

编辑草稿时，进度行会自动压缩，以减少聊天气泡的重排；OpenClaw 还会截断过长的行，避免反复编辑草稿时每次更新的换行位置都不同。默认的每行预算为 120 个字符；普通文本会在单词边界处截断，而路径或原始命令等较长的详细信息会使用中间省略号缩短，以便保留可见的后缀。

调整每行预算：

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

### 富格式呈现（Slack）

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

富格式呈现始终会在 Block Kit 字段之外同时发送相同的纯文本正文，因此无法呈现这种富格式结构的客户端仍会显示紧凑的进度文本。

### 隐藏工具/任务行

保留单个进度草稿，但隐藏工具行和任务行：

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

使用 `toolProgress: false` 时，OpenClaw 仍会抑制该轮次中旧版的独立工具进度消息——在最终回答之前，该渠道在视觉上保持安静；如果配置了标签，则标签除外。

## 渠道行为

| 渠道            | 进度传输方式                           | 说明                                                                                                                                                         |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord         | 发送一条消息，然后编辑。               | 默认为 `progress` 模式；最终答案带有 `-#` 活动回执，答案发送成功后会删除状态草稿。                                                                            |
| Matrix          | 发送一个事件，然后编辑。               | 账号级流式传输配置控制账号级草稿。                                                                                                                           |
| Microsoft Teams | 在个人聊天中使用原生 Teams 流式传输。  | `streaming.mode: "block"` 会改为映射到 Teams 分块发送。                                                                                                      |
| Slack           | 原生流式传输或可编辑的草稿消息。       | 需要回复线程目标；没有目标的顶层私信仍会收到草稿预览消息及其编辑更新。                                                                                        |
| Telegram        | 发送一条消息，然后编辑。               | 如果进度草稿和答案之间插入了其他消息，草稿会重新发布到该消息下方（先发新消息，再删除旧消息），而不是让客户端滚动位置突然跳动。                                  |
| Mattermost      | 可编辑的草稿消息。                     | `block` 模式会在已完成文本与工具活动消息之间轮换；其他模式则将工具活动并入同一条草稿式消息。                                                                   |

不支持安全编辑的渠道会回退到输入状态指示器或
仅发送最终结果。有关各渠道完整的运行时行为细分，请参阅[流式传输和分块](/zh-CN/concepts/streaming)。

## 最终处理

最终答案准备就绪后，OpenClaw 会尽量保持聊天整洁：

- 在 Discord 的 `progress` 模式下，最终答案会作为一条新消息发送，
  并附加一个简短的 `-#` 活动回执（例如
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`）；答案发送成功后，
  状态草稿会被删除。繁忙的渠道不会在回复上方留下孤立的工具
  日志；若最终结果为错误，则会保留草稿，作为该失败轮次的可见记录。
- 如果草稿能够安全地转为最终答案（`partial`/`block` 模式），
  OpenClaw 会原地编辑该草稿。
- 如果渠道使用原生进度流式传输，原生传输接受最终文本后，
  OpenClaw 会完成该流式传输。
- 否则（存在媒体、审批提示、显式回复目标、分块过多，
  或编辑/发送失败），OpenClaw 会通过常规渠道发送路径发送最终答案，
  而不是覆盖草稿。

这种回退是有意为之：发送一条新的最终答案，总比丢失文本、
将回复发错线程，或使用渠道无法安全呈现的载荷覆盖草稿更好。

## 故障排查

**我只能看到最终答案。**

检查处理该消息的账号或渠道，其 `channels.<channel>.streaming.mode`
是否为 `progress`。当渠道无法安全编辑正确的消息时，某些群组或引用回复路径
会在该轮次中禁用草稿预览。

**我看到了标签，但没有工具行。**

检查 `streaming.progress.toolProgress`。如果该值为 `false`，OpenClaw 会保留
单一草稿行为，但隐藏工具和任务进度行。

**我看到的是一条新的最终消息，而不是编辑后的草稿。**

这是[最终确定](#finalization)中所述的安全回退机制。媒体回复、长回答、显式回复目标、旧的 Telegram
草稿、缺失的 Slack 线程目标、已删除的预览消息，或原生流最终确定失败时，
都可能发生这种情况。

**我仍然看到独立的进度消息。**

只要草稿处于活动状态，进度模式就会抑制默认的独立工具进度消息。如果仍然出现独立消息，请确认该轮次
确实使用了 `progress` 模式，而不是 `streaming.mode: "off"`，也不是所用渠道路径
无法为该消息创建草稿。

**Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的
发送并编辑预览传输方式；同时，它会将 `streaming.mode: "block"` 映射为 Teams
分块传送，因为它不像 Discord 和 Telegram 那样具有草稿预览分块模式。

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
