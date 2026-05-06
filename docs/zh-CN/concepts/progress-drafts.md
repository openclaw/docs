---
read_when:
    - 为长时间运行的聊天轮次配置可见的进度更新
    - 在 partial、分块和进度流式传输模式之间选择
    - 说明 OpenClaw 如何在工作进行期间更新一条渠道消息
    - 进度草稿、独立进度消息或最终化回退的故障排除
summary: 进度草稿：一条可见的进行中消息，会在智能体运行时更新
title: 进度草稿
x-i18n:
    generated_at: "2026-05-06T04:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

进度草稿让长时间运行的智能体轮次在聊天中显得有进展，而不会把对话变成一堆临时状态回复。

启用进度草稿后，OpenClaw 只会在该轮次证明正在执行实际工作后创建一条可见的进行中消息，在智能体阅读、计划、调用工具或等待批准时更新它，然后在渠道可以安全处理时，将该草稿转换为最终答案。

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

当你希望在工具密集型工作期间显示一条整洁的状态消息，并在轮次完成后显示最终答案时，请使用进度草稿。

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

这通常就足够了。OpenClaw 会选择一个自动的单词标签，等到工作持续至少五秒或发出第二个工作事件后，添加紧凑的进度行，同时在该轮次中抑制重复的独立进度提示。

## 用户会看到什么

进度草稿包含两部分：

| 部分 | 用途 |
| -------------- | --------------------------------------------------------------------------- |
| 标签 | 简短标题，例如 `Thinking...` 或 `Shelling...`。 |
| 进度行 | 使用与详细输出相同的工具标签和图标的紧凑运行更新。 |

标签会在智能体开始有意义的工作，并且持续忙碌五秒或发出第二个工作事件后出现。纯文本回复不会显示进度草稿。只有当智能体发出有用的工作更新时，才会添加进度行，例如 `🛠️ Exec`、`🔎 Web Search` 或 `✍️ Write: to /tmp/file`。
默认情况下，它们使用与 `/verbose` 相同的紧凑说明模式；调试时如果还希望追加原始命令/详情，请设置 `agents.defaults.toolProgressDetail: "raw"`。
可行时，最终答案会替换草稿；否则 OpenClaw 会正常发送最终答案，并根据渠道的传输方式清理草稿或停止更新草稿。

## 选择模式

`channels.<channel>.streaming.mode` 控制可见的进行中行为：

| 模式 | 最适合 | 聊天中显示什么 |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | 安静的渠道 | 只有最终答案。 |
| `partial` | 观察答案文本出现 | 一条草稿会用最新答案文本编辑更新。 |
| `block` | 较大的答案预览块 | 一个预览会以更大的块更新或追加。 |
| `progress` | 工具密集型或长时间运行的轮次 | 一条状态草稿，然后是最终答案。 |

当用户更关心“正在发生什么”，而不是逐个令牌观看答案文本流式输出时，选择 `progress`。

当答案本身就是进度信号时，选择 `partial`。

当你希望以较大的文本块更新草稿预览时，选择 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍然是预览流式传输，而不是普通的块交付。当你想要普通块回复时，请使用 `streaming.block.enabled` 或旧版 `blockStreaming`。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。

默认标签是 `auto`，它会从 OpenClaw 内置的带省略号单词标签池中选择：

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

进度行在进度模式下默认启用。它们来自真实运行事件：工具启动、项目更新、任务计划、批准、命令输出、补丁摘要以及类似的智能体活动。

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

`"explain"` 是默认值，会用简洁标签保持草稿稳定，例如 `🛠️ Exec: check JS syntax for /tmp/app.js`。`"raw"` 会在可用时追加底层命令/详情，这在调试时很有用，但在聊天中会更嘈杂。

例如，同一命令会根据详情模式显示为不同内容：

| 模式 | 进度行 |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js` |
| `raw` | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

进度行会自动压缩，以减少编辑草稿时聊天气泡的重排。

OpenClaw 默认会截断较长的进度行，避免重复编辑草稿时每次更新都产生不同换行。前缀会保持可读，较长的详情（例如路径或原始命令）会用省略号缩短。

Slack 可以将进度行渲染为结构化的 Block Kit 字段，而不是单个文本正文：

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

使用 `toolProgress: false` 时，OpenClaw 仍会在该轮次中抑制旧的独立工具进度消息。除非配置了标签，否则渠道在最终答案出现前会保持视觉上的安静。

## 渠道行为

每个渠道都会使用其支持的最简洁传输方式：

| 渠道 | 进度传输 | 备注 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord | 发送一条消息，然后编辑它。 | 当最终文本适合一条安全预览消息时，会就地编辑。 |
| Matrix | 发送一个事件，然后编辑它。 | 账号级流式传输配置控制账号级草稿。 |
| Microsoft Teams | 个人聊天中的原生 Teams 流。 | `streaming.mode: "block"` 映射到 Teams 块交付。 |
| Slack | 原生流或可编辑草稿帖子。 | 线程可用性会影响是否可以使用原生流式传输。 |
| Telegram | 发送一条消息，然后编辑它。 | 较旧的可见草稿可能会被替换，以便最终时间戳保持有用。 |
| Mattermost | 可编辑草稿帖子。 | 工具活动会折叠进同一个草稿样式的帖子。 |

没有安全编辑支持的渠道通常会回退到输入指示器或仅最终交付。

## 最终化

最终答案准备好后，OpenClaw 会尽量让聊天保持干净：

- 如果草稿可以安全地变成最终答案，OpenClaw 会就地编辑它。
- 如果渠道使用原生进度流式传输，当原生传输接受最终文本时，OpenClaw 会最终化该流。
- 如果最终答案包含媒体、批准提示、明确的回复目标、过多分块，或者编辑/发送失败，OpenClaw 会通过正常的渠道交付路径发送最终答案。

回退路径是有意设计的。发送一条新的最终答案，比丢失文本、把回复串错线程，或用渠道无法安全表示的负载覆盖草稿更好。

## 故障排除

**我只看到最终答案。**

检查处理该消息的账号或渠道是否将 `channels.<channel>.streaming.mode` 设置为 `progress`。当渠道无法安全编辑正确的消息时，某些群组或引用回复路径可能会在某个轮次中禁用草稿预览。

**我看到了标签，但没有工具行。**

检查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 会保留单条草稿行为，但隐藏工具和任务进度行。

**我看到了一条新的最终消息，而不是被编辑的草稿。**

这是安全回退。媒体回复、长答案、明确的回复目标、旧的 Telegram 草稿、缺失的 Slack 线程目标、已删除的预览消息，或原生流最终化失败，都可能触发这种情况。

**我仍然看到独立进度消息。**

当草稿处于活动状态时，进度模式会抑制默认的独立工具进度消息。如果仍然出现独立消息，请确认该轮次实际使用的是进度模式，而不是 `streaming.mode: "off"`，也不是某个无法为该消息创建草稿的渠道路径。

**Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的发送并编辑预览传输。Teams 还会将 `streaming.mode: "block"` 视为 Teams 块交付，因为它没有 Discord 和 Telegram 使用的同类草稿预览块模式。

## 相关

- [流式传输和分块](/zh-CN/concepts/streaming)
- [消息](/zh-CN/concepts/messages)
- [频道配置](/zh-CN/gateway/config-channels)
- [Discord](/zh-CN/channels/discord)
- [Matrix](/zh-CN/channels/matrix)
- [Microsoft Teams](/zh-CN/channels/msteams)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
