---
read_when:
    - 配置长时间运行的聊天轮次的可见进度更新
    - 在部分、分块和进度流式传输模式之间选择
    - 说明 OpenClaw 如何在工作进行时更新一条渠道消息
    - 故障排查进度草稿、独立进度消息或最终化回退
summary: 进度草稿：一条可见的工作进行中消息，会在智能体运行时更新
title: 进度草稿
x-i18n:
    generated_at: "2026-07-05T11:15:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e284f9a7895ac9111608899ba8a4b4824a10159bc38b4158928bdf7fd3c45cd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

进度草稿会在智能体工作时，把一条渠道消息变成实时状态行，而不是堆叠一组临时的“仍在工作”回复。设置 `channels.<channel>.streaming.mode: "progress"`，OpenClaw 会在真正的工作开始后创建消息，随着智能体读取、规划、调用工具或等待审批来编辑它，然后把它转换为最终答案。

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

<Note>
  当 `channels.discord.streaming.mode`/`streamMode` 未设置时，Discord 已默认使用 `streaming.mode: "progress"`，因此无需任何配置就会显示进度草稿。其他所有渠道默认使用 `partial` 或 `off`；完整的逐渠道默认值表请参阅[流式传输和分块](/zh-CN/concepts/streaming#channel-mapping)。
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

这里的默认行为包括：自动的单词标签、5 秒启动延迟（或在第二个工作事件发生时立即启动）、在有实际工作发生时显示紧凑的进度行，并抑制该轮次中较旧的独立进度消息。

本页介绍进度草稿体验及其配置开关。完整的流式模式矩阵、逐渠道运行时说明和旧键迁移，请参阅[流式传输和分块](/zh-CN/concepts/streaming)。

## 用户会看到什么

| 部分 | 用途 |
| -------------- | --------------------------------------------------------------------------------- |
| 标签 | 简短的起始/状态行，例如 `Working` 或 `Shelling`。 |
| 进度行 | 使用与 `/verbose` 相同工具图标和详情格式化器的紧凑运行更新。 |

标签会在智能体开始有意义的工作并持续忙碌超过初始延迟后出现，或者在第二个工作事件立即触发时出现。它位于滚动进度行列表的顶部，因此当出现足够多具体工作行后会滚动离开。纯文本回复绝不会显示进度草稿；只有真实工作更新才会显示一行，例如 `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"` 或 `✍️ Write: to /tmp/file`。

当渠道可以安全地这样做时，最终答案会原地替换草稿；否则 OpenClaw 会通过常规投递发送最终答案，并清理草稿或停止更新草稿（请参阅[最终化](#finalization)）。

## 选择模式

`channels.<channel>.streaming.mode` 控制可见的进行中行为：

| 模式 | 最适合 | 聊天中会出现什么 |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off` | 安静的渠道 | 仅最终答案。 |
| `partial` | 观看答案文本出现 | 一个草稿会用最新答案文本编辑。 |
| `block` | 较大的答案预览分块 | 一个预览会以更大分块更新或追加。 |
| `progress` | 工具密集或长时间运行的轮次 | 一个状态草稿，然后是最终答案。 |

当用户更关心“正在发生什么”而不是逐 token 观看答案文本流式输出时，选择 `progress`；当答案文本本身就是进度信号时，选择 `partial`；对于较大的预览分块，选择 `block`。在 Discord 和 Telegram 上，`streaming.mode: "block"` 仍然是预览流式传输，而不是常规分块回复投递；请使用 `streaming.block.enabled`（或旧版 `blockStreaming`）实现后者。

## 配置标签

进度标签位于 `channels.<channel>.streaming.progress` 下。默认 `label` 是 `"auto"`，会从 OpenClaw 内置的单词标签池中选择：

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

使用你自己的标签池（当 `label: "auto"` 时仍会随机/按 seed 选取）：

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

隐藏标签并仅显示进度行：

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

进度行来自真实运行事件：工具启动、条目更新、任务计划、审批、命令输出、补丁摘要以及类似的智能体活动。它们默认启用（`progress.toolProgress`，默认 `true`）。

工具也可以在单次调用仍在运行时发出带类型的进度。这就是慢速获取或搜索在工具返回最终结果之前更新可见草稿的方式。进度更新是一个部分工具结果，带有空模型内容和显式公共渠道元数据：

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

OpenClaw 只在渠道进度 UI 中渲染 `progress.text`。常规工具结果稍后仍会作为 `content`/`details` 到达，并且是唯一返回给模型的部分。

为工具添加进度时，发出一条简短、通用的消息，并延迟到操作已挂起足够久、确实有用时再显示。`web_fetch` 正是以 5 秒延迟这样做的：

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

快速调用不会显示进度行；长调用会在仍挂起时显示一行；已取消的调用会在过期进度出现前清除计时器。进度文本是公共 UI 旁路渠道，因此绝不能包含密钥、原始参数、获取的内容、命令输出或页面文本。

### 详情模式

OpenClaw 对进度草稿和 `/verbose` 使用同一个格式化器：

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` 是默认值，会用简洁标签保持草稿稳定。`"raw"` 会在可用时追加底层命令，这在调试时有用，但在聊天中更嘈杂。例如，`node --check /tmp/app.js` 调用会按模式渲染为不同内容：

| 模式 | 进度行 |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js` |
| `raw` | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### 命令/exec 文本

`streaming.progress.commandText`（默认 `"raw"`）控制 exec/bash 进度行旁边显示多少命令详情，独立于上面的详情模式。将其设置为 `"status"` 可在保持工具进度行可见的同时完全隐藏命令文本：

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

### commentary 通道

`streaming.progress.commentary`（默认 `false`）会将模型的工具前 commentary/前言叙述（💬，例如 “I'll check... then ...”）与工具行一起交错显示在草稿中。跨渠道共享配置形状请参阅[流式传输和分块](/zh-CN/concepts/streaming#commentary-progress-lane)。

### 行数限制

限制保持可见的行数（默认 8）：

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

进度行会自动压缩，以在草稿被编辑时减少聊天气泡重排，并且 OpenClaw 会截断长行，避免反复编辑草稿时每次更新的换行都不同。默认的逐行预算是 120 个字符；散文会在词边界截断，而路径或原始命令等长详情会用中间省略号缩短，以保留后缀可见。

调整逐行预算：

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

### 富渲染（Slack）

Slack 可以将进度行渲染为结构化 Block Kit 字段，而不是纯文本：

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

富渲染始终会随 Block Kit 字段一起发送相同的纯文本正文，因此无法渲染更丰富形状的客户端仍会显示紧凑进度文本。

### 隐藏工具/任务行

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

使用 `toolProgress: false` 时，OpenClaw 仍会抑制该轮次较旧的独立工具进度消息；除非配置了标签，否则渠道会在视觉上保持安静，直到最终答案出现。

## 渠道行为

| 渠道 | 进度传输 | 说明 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord | 发送一条消息，然后编辑它。 | 默认使用 `progress` 模式；当最终文本适合一条安全预览消息时，会原地编辑。 |
| Matrix | 发送一个事件，然后编辑它。 | 账号级流式配置控制账号级草稿。 |
| Microsoft Teams | 个人聊天中的原生 Teams 流。 | `streaming.mode: "block"` 会映射到 Teams 分块投递。 |
| Slack | 原生流或可编辑草稿帖。 | 需要回复线程目标；没有目标的顶层私信仍会获得草稿预览帖和编辑。 |
| Telegram | 发送一条消息，然后编辑它。 | 如果进度草稿和答案之间插入了一条消息，草稿会重新发布到其下方（先发新消息再删旧消息），而不是让客户端滚动跳动。 |
| Mattermost | 可编辑草稿帖。 | 工具活动会折叠到同一个草稿样式帖子中。 |

没有安全编辑支持的渠道会回退到输入指示器或仅最终投递。完整的逐渠道运行时行为拆解，请参阅[流式传输和分块](/zh-CN/concepts/streaming)。

## 最终化

当最终答案准备就绪时，OpenClaw 会尝试保持聊天整洁：

- 如果草稿可以安全地变成最终回答，OpenClaw 会就地编辑它。
- 如果渠道使用原生进度流式传输，OpenClaw 会在原生传输接受最终文本时
  完成该流。
- 否则（媒体、审批提示、明确的回复目标、分块过多，
  或编辑/发送失败），OpenClaw 会通过正常的渠道投递路径发送最终回答，
  而不是覆盖草稿。

这个回退是有意设计的：发送一条新的最终回答，比丢失文本、
把回复发错线程，或用渠道无法安全表示的载荷覆盖草稿更好。

## 故障排查

**我只看到最终回答。**

检查处理该消息的账号或渠道的 `channels.<channel>.streaming.mode`
是否为 `progress`。当渠道无法安全编辑正确的消息时，某些群组或引用回复路径会
在某个轮次中禁用草稿预览。

**我看到标签，但没有工具行。**

检查 `streaming.progress.toolProgress`。如果它是 `false`，OpenClaw 会保留
单一草稿行为，但隐藏工具和任务进度行。

**我看到一条新的最终消息，而不是编辑后的草稿。**

这就是 [最终化](#finalization) 中描述的安全回退。它可能发生在
媒体回复、长回答、明确回复目标、旧 Telegram 草稿、缺失的 Slack 线程目标、
已删除的预览消息，或原生流最终化失败时。

**我仍然看到独立的进度消息。**

当草稿处于活动状态时，进度模式会抑制默认的独立工具进度消息。
如果独立消息仍然出现，请确认该轮次实际使用的是 `progress` 模式，
而不是 `streaming.mode: "off"`，也不是无法为该消息创建草稿的渠道路径。

**Microsoft Teams 的行为与 Discord 或 Telegram 不同。**

Microsoft Teams 在个人聊天中使用原生流，而不是通用的发送并编辑预览传输，
并且会把 `streaming.mode: "block"` 映射为 Teams 分块投递，因为它没有
像 Discord 和 Telegram 那样的草稿预览分块模式。

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
