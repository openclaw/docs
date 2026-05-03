---
read_when:
    - 为长时间运行的聊天轮次配置可见进度更新
    - 在部分流式传输、分块流式传输和进度流式传输模式之间选择
    - 说明 OpenClaw 如何在工作进行期间更新一条渠道消息
    - 故障排除：进度草稿、独立进度消息或最终化后备机制
summary: 进度草稿：一条可见的进行中工作消息，会在智能体运行时更新
title: 进度草稿
x-i18n:
    generated_at: "2026-05-03T23:09:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbeb70418808033bf82590841171e89896018dcc713fae7d814f80cf1cc64bf7
    source_path: concepts/progress-drafts.md
    workflow: 16
---

进度草稿让长时间运行的智能体轮次在聊天中显得有动态，而不会把对话变成一堆临时状态回复。

启用进度草稿后，OpenClaw 会创建一条可见的进行中消息，在智能体读取、规划、调用工具或等待批准时更新它，然后在渠道可以安全执行时，将该草稿转为最终回答。

```text
Shelling...
- reading recent channel context
- checking matching issues
- preparing reply
```

当你希望在工具密集型工作期间显示一条整洁的状态消息，并在该轮次完成后显示最终回答时，请使用进度草稿。

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

这通常就足够了。OpenClaw 会选择一个自动的单词标签，在有用工作发生时添加紧凑的进度行，并在该轮次中抑制重复的独立进度闲聊。

## 用户看到的内容

进度草稿包含两部分：

| 部分 | 用途 |
| -------------- | ----------------------------------------------------------------- |
| 标签 | 简短标题，例如 `Thinking...` 或 `Shelling...`。 |
| 进度行 | 紧凑的运行更新，例如工具调用、任务步骤或批准。 |

当智能体开始回复时，标签会立即显示。只有在智能体发出有用的工作更新时，才会添加进度行。最终回答会尽可能替换草稿；否则，OpenClaw 会正常发送最终回答，并根据渠道的传输协议清理草稿或停止更新草稿。

## 选择模式

`channels.<channel>.streaming.mode` 控制可见的进行中行为：

| 模式 | 最适合 | 聊天中显示的内容 |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | 安静的渠道 | 仅最终回答。 |
| `partial` | 观看回答文本逐步显示 | 一个使用最新回答文本编辑的草稿。 |
| `block` | 较大的回答预览分块 | 一个以较大分块更新或追加的预览。 |
| `progress` | 工具密集型或长时间运行的轮次 | 一个状态草稿，然后是最终回答。 |

当用户更关心“正在发生什么”，而不是逐个 token 观看回答文本流式输出时，请选择 `progress`。

当回答本身就是进度信号时，请选择 `partial`。

当你想要以较大的文本块更新草稿预览时，请选择 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍然是预览流式传输，而不是普通的分块交付。当你想要普通分块回复时，请使用 `streaming.block.enabled` 或旧版 `blockStreaming`。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。

默认标签是 `auto`，它会从 OpenClaw 内置的“单词加省略号”标签池中选择：

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

在进度模式下，进度行默认启用。它们来自真实的运行事件：工具启动、项目更新、任务计划、批准、命令输出、补丁摘要以及类似的智能体活动。

限制可见行数：

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

保留单个进度草稿，但隐藏工具和任务行：

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

使用 `toolProgress: false` 时，OpenClaw 仍会抑制该轮次中较旧的独立工具进度消息。除了已配置的标签外，渠道会保持视觉上的安静，直到最终回答出现。

## 渠道行为

每个渠道都会使用其支持的最简洁传输方式：

| 渠道 | 进度传输 | 备注 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord | 发送一条消息，然后编辑它。 | 当最终文本适合一条安全预览消息时，会原地编辑。 |
| Matrix | 发送一个事件，然后编辑它。 | 账户级流式传输配置控制账户级草稿。 |
| Microsoft Teams | 个人聊天中的原生 Teams 流。 | `streaming.mode: "block"` 映射到 Teams 分块交付。 |
| Slack | 原生流或可编辑草稿帖子。 | 线程可用性会影响是否可以使用原生流式传输。 |
| Telegram | 发送一条消息，然后编辑它。 | 较旧的可见草稿可能会被替换，以便最终时间戳保持有用。 |
| Mattermost | 可编辑草稿帖子。 | 工具活动会合并到同一个草稿式帖子中。 |

没有安全编辑支持的渠道通常会回退到输入指示器或仅最终回答交付。

## 最终化

最终回答准备就绪后，OpenClaw 会尝试保持聊天整洁：

- 如果草稿可以安全地变成最终回答，OpenClaw 会原地编辑它。
- 如果渠道使用原生进度流式传输，OpenClaw 会在原生传输接受最终文本时最终化该流。
- 如果最终回答包含媒体、批准提示、显式回复目标、过多分块，或编辑/发送失败，OpenClaw 会通过正常渠道交付路径发送最终回答。

回退路径是有意设计的。发送一条新的最终回答，比丢失文本、错误串接回复线程，或用渠道无法安全表示的负载覆盖草稿更好。

## 故障排除

**我只看到最终回答。**

检查处理消息的账户或渠道是否已将 `channels.<channel>.streaming.mode` 设置为 `progress`。当渠道无法安全编辑正确的消息时，某些群组或引用回复路径可能会在一个轮次中禁用草稿预览。

**我看到了标签，但没有工具行。**

检查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 会保留单草稿行为，但隐藏工具和任务进度行。

**我看到的是新的最终消息，而不是编辑后的草稿。**

这是安全回退。它可能发生在媒体回复、长回答、显式回复目标、旧 Telegram 草稿、缺失 Slack 线程目标、已删除的预览消息，或原生流最终化失败时。

**我仍然看到独立进度消息。**

当草稿处于活动状态时，进度模式会抑制默认的独立工具进度消息。如果仍然出现独立消息，请确认该轮次确实在使用进度模式，而不是 `streaming.mode: "off"`，也不是无法为该消息创建草稿的渠道路径。

**Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的发送后编辑预览传输。Teams 还会将 `streaming.mode: "block"` 视为 Teams 分块交付，因为它没有 Discord 和 Telegram 所用的同一种草稿预览分块模式。

## 相关

- [流式传输和分块](/zh-CN/concepts/streaming)
- [消息](/zh-CN/concepts/messages)
- [频道配置](/zh-CN/gateway/config-channels)
- [Discord](/zh-CN/channels/discord)
- [Matrix](/zh-CN/channels/matrix)
- [Microsoft Teams](/zh-CN/channels/msteams)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
