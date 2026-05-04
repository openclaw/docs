---
read_when:
    - 为长时间运行的聊天轮次配置可见的进度更新
    - 在部分、分块和进度流式传输模式之间选择
    - 说明 OpenClaw 如何在工作进行时更新一条渠道消息
    - 故障排除：进度草稿、独立进度消息或最终化回退
summary: 进度草稿：一条可见的进行中消息，会在智能体运行时更新
title: 进度草稿
x-i18n:
    generated_at: "2026-05-04T00:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ce19262800f1c3c3e505a3cf1d41ed5c3dffcbca168ad7b7afabdce62eee8fe
    source_path: concepts/progress-drafts.md
    workflow: 16
---

进度草稿让长时间运行的智能体轮次在聊天中显得有响应，而不会把
对话变成一堆临时状态回复。

启用进度草稿后，OpenClaw 只会在轮次证明自己正在执行实际工作后创建一条可见的进行中
消息，在智能体读取、规划、调用工具或等待批准时更新它，然后在渠道可以安全执行时，将该草稿
转换为最终回答。

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

当你希望在工具密集型工作期间显示一条整洁的状态消息，并在轮次完成时显示最终回答时，
请使用进度草稿。

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

这通常就足够了。OpenClaw 会选择一个自动的单词标签，等待
工作持续至少五秒或发出第二个工作事件，在有用工作发生时添加紧凑的
进度行，并抑制该轮次中重复的独立进度闲聊。

## 用户会看到什么

进度草稿由两部分组成：

| 部分           | 用途                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| 标签          | 简短标题，例如 `Thinking...` 或 `Shelling...`。                       |
| 进度行 | 使用与详细输出相同的工具标签和图标的紧凑运行更新。 |

标签会在智能体开始有意义的工作，并且保持忙碌五秒或发出第二个工作事件后出现。纯文本回复不会
显示进度草稿。只有当智能体发出有用的
工作更新时，才会添加进度行，例如 `🛠️ Exec`、`🔎 Web Search` 或 `✍️ Write: to /tmp/file`。
默认情况下，它们使用与 `/verbose` 相同的紧凑解释模式；当调试并且你也希望附加原始
命令/详情时，请设置 `agents.defaults.toolProgressDetail: "raw"`。
最终回答会在可能时替换草稿；否则
OpenClaw 会正常发送最终回答，并根据渠道的传输协议清理或停止更新
草稿。

## 选择模式

`channels.<channel>.streaming.mode` 控制可见的进行中行为：

| 模式       | 最适合                         | 聊天中会出现什么                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 安静渠道                   | 只有最终回答。                            |
| `partial`  | 观看回答文本出现      | 一个用最新回答文本编辑的草稿。     |
| `block`    | 更大的回答预览分块     | 一个以更大分块更新或追加的预览。 |
| `progress` | 工具密集型或长时间运行的轮次 | 一条状态草稿，然后是最终回答。          |

当用户更关心“正在发生什么”，而不是逐 token 观看
回答文本流式输出时，请选择 `progress`。

当回答本身就是进度信号时，请选择 `partial`。

当你希望以更大的文本块更新草稿预览时，请选择 `block`。在
Discord 和 Telegram 上，`streaming.mode: "block"` 仍然是预览流式传输，而不是
普通的分块交付。当你希望使用普通分块回复时，请使用 `streaming.block.enabled` 或旧版
`blockStreaming`。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。

默认标签是 `auto`，它会从 OpenClaw 内置的
带省略号的单词标签池中选择：

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
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

进度行在进度模式中默认启用。它们来自真实的运行
事件：工具启动、条目更新、任务计划、批准、命令输出、补丁
摘要，以及类似的智能体活动。

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

`"explain"` 是默认值，会使用类似
`🛠️ Exec: check JS syntax for /tmp/app.js` 的简洁标签来保持草稿稳定。`"raw"` 会在可用时附加底层
命令/详情，这在调试时有用，但在聊天中更嘈杂。

例如，同一条命令会根据详情模式以不同方式显示：

| 模式      | 进度行                                                        |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

使用 `toolProgress: false` 时，OpenClaw 仍会抑制该轮次中较旧的独立
工具进度消息。除了已配置的标签之外，渠道在最终回答出现前会保持视觉上的安静。

## 渠道行为

每个渠道都会使用其支持的最干净传输方式：

| 渠道         | 进度传输方式                     | 说明                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 发送一条消息，然后编辑它。        | 当最终文本适合一条安全预览消息时，会原地编辑。      |
| Matrix          | 发送一个事件，然后编辑它。          | 账号级流式传输配置控制账号级草稿。         |
| Microsoft Teams | 在个人聊天中使用原生 Teams 流。 | `streaming.mode: "block"` 映射到 Teams 分块交付。               |
| Slack           | 原生流或可编辑的草稿帖子。  | 线程可用性会影响是否可以使用原生流式传输。     |
| Telegram        | 发送一条消息，然后编辑它。        | 较旧的可见草稿可能会被替换，以便最终时间戳保持有用。 |
| Mattermost      | 可编辑的草稿帖子。                   | 工具活动会折叠到同一个草稿样式的帖子中。               |

不支持安全编辑的渠道通常会回退到正在输入指示器或仅最终回答交付。

## 完成

当最终回答准备就绪时，OpenClaw 会尝试保持聊天干净：

- 如果草稿可以安全地变成最终回答，OpenClaw 会原地编辑它。
- 如果渠道使用原生进度流式传输，OpenClaw 会在原生传输接受最终文本时
  完成该流。
- 如果最终回答包含媒体、批准提示、显式回复目标、
  过多分块，或编辑/发送失败，OpenClaw 会通过
  正常渠道交付路径发送最终回答。

回退路径是有意设计的。发送一条新的最终回答，比
丢失文本、把回复发到错误线程，或用渠道无法安全表示的载荷覆盖草稿更好。

## 故障排除

**我只看到最终回答。**

检查 `channels.<channel>.streaming.mode` 是否已为处理该消息的
账号或渠道设置为 `progress`。当渠道无法安全编辑正确的
消息时，某些群组或引用回复路径可能会为该轮次禁用草稿预览。

**我看到标签，但没有工具行。**

检查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 会保留
单条草稿行为，但隐藏工具和任务进度行。

**我看到一条新的最终消息，而不是编辑后的草稿。**

这是安全回退。媒体回复、长回答、
显式回复目标、旧的 Telegram 草稿、缺失的 Slack 线程目标、
已删除的预览消息，或原生流完成失败时都可能发生这种情况。

**我仍然看到独立进度消息。**

当草稿处于活动状态时，进度模式会抑制默认的独立工具进度消息。如果独立消息仍然出现，请确认该轮次确实
使用进度模式，而不是 `streaming.mode: "off"`，也不是无法为该消息
创建草稿的渠道路径。

**Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的
发送并编辑预览传输。Teams 还会将 `streaming.mode: "block"` 视为
Teams 分块交付，因为它没有 Discord 和 Telegram 使用的相同草稿预览分块模式。

## 相关

- [流式传输和分块](/zh-CN/concepts/streaming)
- [消息](/zh-CN/concepts/messages)
- [频道配置](/zh-CN/gateway/config-channels)
- [Discord](/zh-CN/channels/discord)
- [Matrix](/zh-CN/channels/matrix)
- [Microsoft Teams](/zh-CN/channels/msteams)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
