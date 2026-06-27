---
read_when:
    - 配置长时间运行聊天轮次的可见进度更新
    - 在 partial、分块和进度流式传输模式之间选择
    - 说明 OpenClaw 如何在工作进行中更新一条渠道消息
    - 故障排除进度草稿、独立进度消息或终结回退
summary: 进度草稿：一条可见的进行中消息，会在智能体运行时更新
title: 进度草稿
x-i18n:
    generated_at: "2026-06-27T01:52:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

进度草稿让长时间运行的智能体轮次在聊天中显得仍在活动，同时不会把对话变成一堆临时状态回复。

启用进度草稿后，OpenClaw 只会在轮次证明自己正在执行实际工作后创建一条可见的进行中消息，在智能体读取、规划、调用工具或等待审批时更新它，然后在渠道可以安全执行时，将该草稿变成最终回答。

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

当你希望在工具密集型工作期间显示一条整洁的状态消息，并在轮次完成后显示最终回答时，请使用进度草稿。

## 快速开始

使用 `streaming.mode: "progress"` 按渠道启用进度草稿：

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

这通常就足够了。OpenClaw 会选择一个自动的单词标签，等待工作至少持续五秒或发出第二个工作事件，在发生有用工作时添加紧凑的进度行，并抑制该轮次中重复的独立进度闲聊。

## 用户会看到什么

进度草稿包含两部分：

| 部分           | 用途                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| 标签          | 简短的起始/状态行，例如 `Working` 或 `Shelling`。                          |
| 进度行 | 使用与详细输出相同工具图标和细节格式化器的紧凑运行更新。 |

标签会在智能体开始有意义的工作，并且保持忙碌五秒或发出第二个工作事件后出现。它是滚动进度行列表的一部分，因此一旦出现足够的具体工作，起始状态就会滚出视野。纯文本回复不会显示进度草稿。只有在智能体发出有用的工作更新时才会添加进度行，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"` 或 `✍️ Write: to /tmp/file`。默认情况下，它们使用与 `/verbose` 相同的紧凑说明模式；调试时如果还希望追加原始命令/细节，请设置 `agents.defaults.toolProgressDetail: "raw"`。最终回答会在可能时替换草稿；否则 OpenClaw 会正常发送最终回答，并根据渠道的传输方式清理或停止更新草稿。

## 选择模式

`channels.<channel>.streaming.mode` 控制可见的进行中行为：

| 模式       | 最适合                         | 聊天中会出现什么                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安静渠道                   | 只有最终回答。                            |
| `partial`  | 观看回答文本逐步出现      | 一条用最新回答文本编辑的草稿。     |
| `block`    | 较大的回答预览分块     | 一个以较大分块更新或追加的预览。 |
| `progress` | 工具密集型或长时间运行的轮次 | 一条状态草稿，然后是最终回答。          |

当用户更关心“正在发生什么”，而不是逐个 token 观看回答文本流式输出时，选择 `progress`。

当回答本身就是进度信号时，选择 `partial`。

当你希望以更大的文本分块更新草稿预览时，选择 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍然是预览流式传输，而不是常规分块投递。当你希望使用常规分块回复时，请使用 `streaming.block.enabled` 或旧版 `blockStreaming`。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。

默认标签是 `auto`，它会从 OpenClaw 内置的单词标签池中选择：

```text
Working
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
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

使用你自己的自动标签池：

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

隐藏标签，只显示进度行：

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

在进度模式下，进度行默认启用。它们来自真实的运行事件：工具启动、条目更新、任务计划、审批、命令输出、补丁摘要以及类似的智能体活动。

工具也可以在单个工具调用仍在运行时发出类型化进度。这就是较慢的抓取或搜索能够在工具返回最终结果之前更新可见草稿的方式。进度更新是一个部分工具结果，带有空模型内容和显式的公开渠道元数据：

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

OpenClaw 只会在渠道进度 UI 中渲染 `progress.text`。普通工具结果稍后仍会作为 `content` 和 `details` 到达，并且只有这一部分会返回给模型。

为工具添加进度时，请使用简短、通用的消息，并等到操作挂起时间足够长、确实有用时再显示：

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

这种模式意味着快速调用不会显示进度行，长调用在仍处于挂起状态时会显示一行进度，而被取消的调用会在过期进度出现之前清除计时器。进度文本是一个公开的 UI 旁路渠道，因此不得包含密钥、原始参数、抓取到的内容、命令输出或页面文本。

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

`"explain"` 是默认值，会用类似 `🛠️ check JS syntax for /tmp/app.js` 的简洁标签保持草稿稳定。`"raw"` 会在可用时追加底层命令/细节，这在调试时很有用，但在聊天中更嘈杂。

例如，同一条命令会根据细节模式显示不同内容：

| 模式      | 进度行                                                  |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

限制保持可见的行数：

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

在编辑草稿时，进度行会自动压缩，以减少聊天气泡重排。

OpenClaw 默认会截断较长的进度行，这样重复编辑草稿时就不会在每次更新时以不同方式换行。默认的每行预算是 120 个字符。散文会在单词边界截断，而路径或原始命令等长细节会用中间省略号缩短，以便后缀仍然可见。

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

Slack 可以将进度行渲染为结构化 Block Kit 字段，而不是单个文本正文：

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

富渲染会保留相同的纯文本回退，因此不支持更丰富形态的渠道和客户端仍然可以显示紧凑的进度文本。

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

使用 `toolProgress: false` 时，OpenClaw 仍会抑制该轮次中较旧的独立工具进度消息。除非配置了标签，否则渠道会在最终回答前保持视觉上的安静。

## 渠道行为

每个渠道都会使用其支持的最干净传输方式：

| 渠道         | 进度传输                     | 说明                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 发送一条消息，然后编辑它。        | 当最终文本适合一条安全预览消息时，会就地编辑。      |
| Matrix          | 发送一个事件，然后编辑它。          | 账号级流式配置控制账号级草稿。         |
| Microsoft Teams | 个人聊天中的原生 Teams 流。 | `streaming.mode: "block"` 映射到 Teams 分块投递。               |
| Slack           | 原生流或可编辑草稿帖子。  | 线程可用性会影响是否可以使用原生流式传输。     |
| Telegram        | 发送一条消息，然后编辑它。        | 旧的可见草稿可能会被替换，以保持最终时间戳有用。 |
| Mattermost      | 可编辑草稿帖子。                   | 工具活动会合并进同一个草稿样式帖子。               |

没有安全编辑支持的渠道通常会回退到输入状态指示器或仅最终投递。

## 最终化

最终回答准备好后，OpenClaw 会尝试保持聊天整洁：

- 如果草稿可以安全地变成最终回答，OpenClaw 会就地编辑它。
- 如果渠道使用原生进度流式传输，OpenClaw 会在原生传输接受最终文本时最终化该流。
- 如果最终回答包含媒体、审批提示、显式回复目标、过多分块，或者编辑/发送失败，OpenClaw 会通过正常的渠道投递路径发送最终回答。

回退路径是有意设计的。发送一条新的最终回答，比丢失文本、把回复串错线程，或用渠道无法安全表示的载荷覆盖草稿更好。

## 故障排除

**我只看到最终回答。**

检查 `channels.<channel>.streaming.mode` 是否已为处理该消息的账号或渠道设置为 `progress`。当渠道无法安全编辑正确消息时，某些群组或引用回复路径可能会在一个轮次中禁用草稿预览。

**我看到了标签，但没有工具行。**

检查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 会保留单条草稿行为，但隐藏工具和任务进度行。

**我看到的是一条新的最终消息，而不是编辑后的草稿。**

这是安全回退。媒体回复、长回答、显式回复目标、旧 Telegram 草稿、缺失的 Slack 线程目标、已删除的预览消息，或原生流最终化失败，都可能触发这种情况。

**我仍然看到独立的进度消息。**

当草稿处于活动状态时，进度模式会抑制默认的独立工具进度消息。如果仍然出现独立消息，请确认该轮次确实在使用进度模式，而不是 `streaming.mode: "off"`，也不是无法为该消息创建草稿的渠道路径。

**Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的发送并编辑预览传输。Teams 也会将 `streaming.mode: "block"` 视为 Teams 分块投递，因为它没有 Discord 和 Telegram 所使用的同一种草稿预览分块模式。

## 相关

- [流式传输和分块](/zh-CN/concepts/streaming)
- [消息](/zh-CN/concepts/messages)
- [频道配置](/zh-CN/gateway/config-channels)
- [Discord](/zh-CN/channels/discord)
- [Matrix](/zh-CN/channels/matrix)
- [Microsoft Teams](/zh-CN/channels/msteams)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
