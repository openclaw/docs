---
read_when:
    - 你想了解自动压缩摘要和 /compact
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何对长对话进行摘要以保持在模型限制范围内
title: 压缩摘要
x-i18n:
    generated_at: "2026-04-27T12:50:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 397bd33b9204a77ec2a9db0d166342ea33ed10f485551dca1fbce66979a3b529
    source_path: concepts/compaction.md
    workflow: 15
---

每个模型都有一个上下文窗口：也就是它能够处理的最大 token 数。当对话接近该限制时，OpenClaw 会将较早的消息**压缩摘要**为一条总结，这样聊天就可以继续进行。

## 工作原理

1. 较早的对话轮次会被总结为一条压缩条目。
2. 该摘要会保存在会话转录中。
3. 最近的消息会保持原样。

当 OpenClaw 将历史拆分为压缩摘要分块时，它会让 assistant 的工具调用与其对应的 `toolResult` 条目保持配对。如果拆分点落在工具块内部，OpenClaw 会移动边界，以确保这对内容保持在一起，并保留当前未摘要的尾部内容。

完整的对话历史仍然保存在磁盘上。压缩摘要只会改变模型在下一轮看到的内容。

## 自动压缩摘要

自动压缩摘要默认开启。当会话接近上下文限制时，或者当模型返回上下文溢出错误时，它就会运行（在后一种情况下，OpenClaw 会先压缩摘要再重试）。

你会看到：

- 在详细模式下显示 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
在执行压缩摘要之前，OpenClaw 会自动提醒智能体将重要备注保存到 [memory](/zh-CN/concepts/memory) 文件中。这可以防止上下文丢失。
</Info>

<AccordionGroup>
  <Accordion title="已识别的溢出特征">
    OpenClaw 会根据以下提供商错误模式检测上下文溢出：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手动压缩摘要

在任意聊天中输入 `/compact` 即可强制执行一次压缩摘要。你也可以附加说明来引导摘要内容：

```
/compact Focus on the API design decisions
```

当设置了 `agents.defaults.compaction.keepRecentTokens` 时，手动压缩摘要会遵循该 Pi 截断点，并在重建后的上下文中保留最近的尾部内容。如果没有显式的保留预算，手动压缩摘要会表现为一个硬检查点，之后仅基于新的摘要继续。

## 配置

在你的 `openclaw.json` 中，通过 `agents.defaults.compaction` 配置压缩摘要。下方列出了最常见的调节项；完整参考请见 [会话管理深入解析](/zh-CN/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩摘要使用智能体的主模型。设置 `agents.defaults.compaction.model` 可以将摘要委托给更强大或更专用的模型。该覆盖项接受任意 `provider/model-id` 字符串：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

这也适用于本地模型，例如专门用于摘要的第二个 Ollama 模型：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

如果未设置，压缩摘要会使用智能体的主模型。

### 标识符保留

压缩摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。你可以使用 `identifierPolicy: "off"` 禁用，或者设置 `identifierPolicy: "custom"` 并配合 `identifierInstructions` 提供自定义指引。

### 活动转录字节保护

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 时，如果活动 JSONL 达到该大小，OpenClaw 会在一次运行前触发正常的本地压缩摘要。这对于长时间运行的会话很有用：即使提供商侧的上下文管理让模型上下文保持健康，本地转录仍可能持续增长。它不会直接拆分原始 JSONL 字节，而是调用正常的压缩摘要管线来生成语义摘要。

<Warning>
字节保护要求 `truncateAfterCompaction: true`。如果没有转录轮转，活动文件大小不会缩小，因此该保护机制不会生效。
</Warning>

### 后继转录

启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 不会原地重写现有转录。它会基于压缩摘要总结、保留状态以及未摘要的尾部内容创建一个新的活动后继转录，同时将之前的 JSONL 保留为归档检查点来源。
后继转录还会丢弃在短暂重试窗口内到达的、完全重复的长用户轮次，因此渠道重试风暴不会在压缩摘要后被带入下一个活动转录。

压缩摘要前的检查点仅会在其大小仍低于 OpenClaw 的检查点大小上限时保留；如果活动转录过大，OpenClaw 仍会执行压缩摘要，但会跳过这个大型调试快照，以避免磁盘占用翻倍。

### 压缩摘要通知

默认情况下，压缩摘要会静默运行。将 `notifyUser` 设置为开启后，可以在压缩摘要开始和完成时显示简短状态消息：

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Memory 刷新

在压缩摘要之前，OpenClaw 可以执行一次**静默的 memory 刷新**轮次，将持久化备注保存到磁盘。详情和配置请参见 [Memory](/zh-CN/concepts/memory)。

## 可插拔的压缩摘要提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩摘要提供商。当某个提供商已注册且已配置时，OpenClaw 会将摘要工作委托给它，而不是使用内置的 LLM 管线。

要使用已注册的提供商，请在配置中设置它的 id：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

设置 `provider` 会自动强制 `mode: "safeguard"`。提供商接收与内置路径相同的压缩摘要说明和标识符保留策略，并且在提供商输出后，OpenClaw 仍会保留最近轮次和拆分轮次的后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要。
</Note>

## 压缩摘要与裁剪

|                  | 压缩摘要 | 裁剪 |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用** | 总结较早的对话 | 裁剪旧的工具结果 |
| **会保存吗？** | 会（保存在会话转录中） | 不会（仅在内存中、按请求处理） |
| **范围** | 整个对话 | 仅工具结果 |

[会话裁剪](/zh-CN/concepts/session-pruning) 是一种更轻量的补充方式，它会在不做摘要的情况下裁剪工具输出。

## 故障排除

**压缩摘要过于频繁？** 模型的上下文窗口可能较小，或者工具输出可能较大。可以尝试启用 [会话裁剪](/zh-CN/concepts/session-pruning)。

**压缩摘要后感觉上下文陈旧？** 使用 `/compact Focus on <topic>` 来引导摘要，或者启用 [memory 刷新](/zh-CN/concepts/memory)，以便备注得以保留。

**需要一个干净的新起点？** `/new` 会启动一个全新的会话，而不会执行压缩摘要。

有关高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩摘要），请参见 [会话管理深入解析](/zh-CN/reference/session-management-compaction)。

## 相关

- [Session](/zh-CN/concepts/session)：会话管理与生命周期。
- [会话裁剪](/zh-CN/concepts/session-pruning)：裁剪工具结果。
- [Context](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [Hooks](/zh-CN/automation/hooks)：压缩摘要生命周期钩子（`before_compaction`、`after_compaction`）。
