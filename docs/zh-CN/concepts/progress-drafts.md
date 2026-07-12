---
read_when:
    - 为长时间运行的聊天轮次配置可见进度更新
    - 在部分流式传输、分块流式传输和进度流式传输模式之间进行选择
    - 说明 OpenClaw 如何在工作进行期间更新同一条渠道消息
    - 进度草稿、独立进度消息或最终处理回退的故障排查
summary: 进度草稿：一条可见的工作中消息，在智能体运行期间持续更新
title: 进度草稿
x-i18n:
    generated_at: "2026-07-12T14:25:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a7d2e60768718922b3d00c72817ff8e342a1e37c6d9a43eef30972412ad9a49
    source_path: concepts/progress-drafts.md
    workflow: 16
---

进度草稿会将一条渠道消息变成实时状态行，在智能体工作时持续更新，而不是堆叠一系列临时的“仍在工作”回复。设置
`channels.<channel>.streaming.mode: "progress"` 后，OpenClaw 会在实际工作开始时创建消息，并在智能体读取、规划、调用工具或等待审批时编辑该消息，最后将其变为最终回答。

```text
正在执行 Shell...
📖 来自 docs/concepts/progress-drafts.md
🔎 Web 搜索：搜索 "discord edit message"
🛠️ Bash：运行测试
```

<Note>
  当未设置 `channels.discord.streaming` 时，Discord 已默认使用
  `streaming.mode: "progress"`，因此无需任何配置即可显示进度草稿。
  其他所有渠道默认使用 `partial` 或 `off`；有关各渠道默认值的完整表格，
  请参阅[流式传输和分块](/zh-CN/concepts/streaming#channel-mapping)。
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

以下是此处采用的默认值：自动生成的单词标签、5 秒的启动延迟
（如果发生第二个工作事件则立即启动）、在执行有效工作时显示紧凑的进度行，
并在该轮次中禁止显示旧版独立进度消息。

本页介绍进度草稿体验及其配置选项。有关完整的流式传输模式矩阵、
各渠道运行时说明和旧版键迁移，请参阅
[流式传输和分块](/zh-CN/concepts/streaming)。

## 用户看到的内容

| 部分     | 用途                                                                    |
| -------- | ----------------------------------------------------------------------- |
| 标签     | 简短的起始/状态行，例如 `Working` 或 `Shelling`。                       |
| 进度行   | 使用与 `/verbose` 相同的工具图标和详细信息格式化器显示紧凑的运行更新。 |

当智能体开始执行有意义的工作并持续忙碌至初始延迟结束，或第二个工作事件立即触发时，
标签会出现。它位于滚动进度行列表的顶部，因此在出现足够多的具体工作行后会滚出视野。
纯文本回复绝不会显示进度草稿；只有实际工作更新才会产生进度行，例如
`🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"` 或
`✍️ Write: to /tmp/file`。

如果渠道能够安全地执行此操作，最终回答会原位替换草稿；否则 OpenClaw 会通过
正常交付方式发送最终回答，并清理草稿或停止更新草稿（请参阅
[最终处理](#finalization)）。

## 选择模式

`channels.<channel>.streaming.mode` 控制工作进行期间的可见行为：

| 模式       | 最适合                         | 聊天中显示的内容                           |
| ---------- | ------------------------------ | ------------------------------------------ |
| `off`      | 安静的渠道                     | 仅显示最终回答。                           |
| `partial`  | 观察回答文本逐渐出现           | 一条使用最新回答文本编辑的草稿。           |
| `block`    | 较大的回答预览块               | 一条以较大块更新或追加的预览。             |
| `progress` | 大量使用工具或长时间运行的轮次 | 一条状态草稿，随后显示最终回答。           |

当用户更关心“正在发生什么”而不是逐 token 观察回答文本流式输出时，请选择
`progress`；当回答文本本身就是进度信号时，请选择 `partial`；如果需要较大的
预览块，请选择 `block`。在 Discord 和 Telegram 中，
`streaming.mode: "block"` 仍表示预览流式传输，而不是常规的分块回复交付；
后者应使用 `streaming.block.enabled`。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。默认 `label`
为 `"auto"`，它会从 OpenClaw 内置的单词标签池中选择：

```text
Working, Shelling, Scuttling, Clawing, Pinching, Molting, Bubbling, Tiding,
Reefing, Cracking, Sifting, Brining, Nautiling, Krilling, Barnacling,
Lobstering, Tidepooling, Pearling, Snapping, Surfacing
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

使用你自己的标签池（当 `label: "auto"` 时，仍会随机或按种子选择）：

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

进度行来自实际运行事件：工具启动、项目更新、任务计划、审批、命令输出、
补丁摘要以及类似的智能体活动。默认启用这些进度行
（`progress.toolProgress`，默认值为 `true`）。

工具还可以在单次调用仍在运行时发出类型化进度。这使得较慢的获取或搜索操作可以
在工具返回最终结果前更新可见草稿。进度更新是一条模型内容为空、并包含明确公共
渠道元数据的部分工具结果：

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw 仅在渠道进度 UI 中呈现 `progress.text`。常规工具结果随后仍会作为
`content`/`details` 到达，并且只有这部分会返回给模型。

向工具添加进度时，应发出简短、通用的消息，并将其延迟到操作已等待足够长时间、
显示进度确实有用时再发送。`web_fetch` 正是通过 5 秒延迟实现这一点：

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

快速调用不会显示进度行；长时间调用会在仍处于等待状态时显示一行；
取消的调用会在过期进度出现前清除计时器。进度文本是一条公共 UI 旁路渠道，
因此绝不能包含秘密、原始参数、获取的内容、命令输出或页面文本。

### 详细信息模式

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

`"explain"` 是默认值，它使用简洁标签保持草稿稳定。
`"raw"` 会在底层命令可用时追加该命令，这对调试很有用，但会使聊天更嘈杂。
例如，`node --check /tmp/app.js` 调用在不同模式下的呈现方式如下：

| 模式      | 进度行                                                          |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### 命令/Exec 文本

`streaming.progress.commandText`（默认值为 `"raw"`）控制 Exec/Bash 进度行旁边
显示多少命令详情，且独立于上面的详细信息模式。将其设置为 `"status"`，
可在保留工具进度行的同时完全隐藏命令文本：

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

`streaming.progress.commentary`（默认值为 `false`）会将模型在工具调用前的
解说/前言叙述（💬，例如“我将检查……然后……”）与工具行交错显示在草稿中。
有关跨渠道共享的配置结构，请参阅
[流式传输和分块](/zh-CN/concepts/streaming#commentary-progress-lane)。

### 叙述式状态

当智能体可使用效用模型时——显式配置的
[`utilityModel`](/zh-CN/gateway/config-agents#utilitymodel)，或主要提供商声明的
小模型默认值（OpenAI → `gpt-5.6-luna`、Anthropic →
`claude-haiku-4-5`）——进度草稿会将滚动工具行替换为简短的自然语言叙述，
说明智能体正在做什么。该叙述由成本较低的模型生成，并随工作进展刷新：

```text
正在操作

正在更新配置中的默认模型，然后重启 Gateway 网关以应用该配置。
一次智能体列表调用失败，正在重试。
```

叙述默认启用（`streaming.progress.narration`，默认值为 `true`），且绝不会
回退到主要模型：它仅在显式配置 `utilityModel`，或智能体的主要提供商声明了
默认模型时运行。设置 `utilityModel: ""` 可完全禁用效用路由。工具行会继续在
底层累积，并在叙述停止后恢复显示；只有叙述文本实际发生变化时才会编辑草稿，
这也减少了繁忙渠道中的编辑抖动。禁用该功能可保留原始工具行：

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

叙述输入有边界限制并经过脱敏：效用模型会接收入站请求文本，以及草稿原本会呈现的
相同紧凑、脱敏工具摘要——绝不会接收原始命令输出或工具结果。使用
`commandText: "status"` 时，叙述输入也会省略 Exec/Bash 命令文本，
与草稿显示的内容保持一致。

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

在编辑草稿时，进度行会自动压缩，以减少聊天气泡的重新排版；OpenClaw 还会截断
过长的行，避免重复编辑草稿时每次更新都产生不同的换行。默认的每行预算为
120 个字符；普通文本会在单词边界处截断，而路径或原始命令等较长详情会使用
中间省略号缩短，以保持后缀可见。

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

富文本呈现始终会随 Block Kit 字段一起发送相同的纯文本正文，因此无法呈现这种
更丰富结构的客户端仍会显示紧凑的进度文本。

### 隐藏工具/任务行

保留单条进度草稿，但隐藏工具和任务行：

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

使用 `toolProgress: false` 时，OpenClaw 仍会禁止显示该轮次中旧版的独立
工具进度消息——除非配置了标签，否则渠道会在最终回答出现前保持视觉上的安静。

## 渠道行为

| 渠道            | 进度传输方式                         | 说明                                                                                                                                                             |
| --------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 发送一条消息，然后编辑它。           | 默认为 `progress` 模式；最终回答带有 `-#` 活动回执，回答发送成功后会删除状态草稿。                                                                                |
| Matrix          | 发送一个事件，然后编辑它。           | 账号级流式传输配置控制账号级草稿。                                                                                                                               |
| Microsoft Teams | 在个人聊天中使用原生 Teams 流。      | `streaming.mode: "block"` 会改为映射到 Teams 分块传送。                                                                                                          |
| Slack           | 原生流或可编辑的草稿帖子。           | 需要回复线程目标；没有此目标的顶层私信仍会收到草稿预览帖子及其编辑。                                                                                             |
| Telegram        | 发送一条消息，然后编辑它。           | 如果在进度草稿和回答之间出现一条消息，草稿会重新发布到该消息下方（先发新帖再删除旧帖），而不会导致客户端滚动位置跳动。                                           |
| Mattermost      | 可编辑的草稿帖子。                   | `block` 模式会在已完成文本和工具活动帖子之间轮换；其他模式则将工具活动合并到同一个草稿式帖子中。                                                                 |

不支持安全编辑的渠道会回退到输入状态指示器或
仅发送最终内容。有关每个渠道的完整运行时行为细分，请参阅[流式传输和分块](/zh-CN/concepts/streaming)。

## 完成处理

最终回答准备就绪后，OpenClaw 会尝试保持聊天整洁：

- 在 Discord 的 `progress` 模式下，最终回答会作为一条新消息发送，
  并附带一条简短的 `-#` 活动回执（例如
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`）；回答送达后，状态草稿会被
  删除。繁忙频道不会在回复上方留下孤立的工具
  日志；如果最终结果是错误，则会保留草稿，作为失败轮次的可见记录。
- 如果草稿可以安全地直接转为最终回答（`partial`/`block` 模式），
  OpenClaw 会原地编辑该草稿。
- 如果渠道使用原生进度流式传输，OpenClaw 会在原生传输层接受最终文本后
  结束该流。
- 否则（存在媒体、审批提示、显式回复目标、分块过多，
  或编辑/发送失败），OpenClaw 会通过常规渠道发送路径发送最终回答，
  而不是覆盖草稿。

这种回退是有意设计的：发送一条全新的最终答复，总比丢失文本、将回复发到错误的会话串，或用渠道无法安全呈现的载荷覆盖草稿要好。

## 故障排查

**我只能看到最终答案。**

检查处理该消息的账号或渠道是否已将 `channels.<channel>.streaming.mode` 设置为 `progress`。当渠道无法安全地编辑正确的消息时，某些群组或引用回复路径会在该轮次中禁用草稿预览。

**我看到了标签，但没有工具进度行。**

检查 `streaming.progress.toolProgress`。如果其值为 `false`，OpenClaw 会保留单一草稿行为，但隐藏工具和任务进度行。

**我看到的是一条新的最终消息，而不是编辑后的草稿。**

这是[最终定稿](#finalization)中所述的安全回退机制。媒体回复、长篇回答、显式回复目标、旧 Telegram 草稿、缺失 Slack 线程目标、已删除的预览消息或原生流最终定稿失败时，都可能发生这种情况。

**我仍然看到独立的进度消息。**

只要草稿处于活动状态，进度模式就会抑制默认的独立工具进度消息。如果仍然出现独立消息，请确认该轮次实际使用的是 `progress` 模式，而不是 `streaming.mode: "off"`，也不是无法为该消息创建草稿的渠道路径。

**Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的发送并编辑预览传输方式；同时，它会将 `streaming.mode: "block"` 映射为 Teams 分块投递，因为它不像 Discord 和 Telegram 那样提供草稿预览分块模式。

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
