---
read_when:
    - 你想了解自动压缩整理和 /compact
    - 你正在调试因长会话触及上下文限制的问题
summary: OpenClaw 如何总结长对话以保持在模型限制范围内
title: 压缩整理
x-i18n:
    generated_at: "2026-04-27T04:33:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7eb6fe8ed5cc1a9db6db2867a6e1d3259fef3ac5f797e786e914459f9dacc89
    source_path: concepts/compaction.md
    workflow: 15
---

每个模型都有一个上下文窗口：也就是它一次最多能处理的 token 数量。当对话接近这个限制时，OpenClaw 会将较早的消息**压缩整理**为摘要，以便聊天可以继续进行。

## 工作原理

1. 较早的对话轮次会被总结为一条压缩整理条目。
2. 该摘要会保存在会话转录中。
3. 最近的消息会保持完整不变。

当 OpenClaw 将历史拆分为压缩整理分块时，它会让助手的工具调用与其对应的 `toolResult` 条目保持配对。如果分割点落在工具块内部，OpenClaw 会移动边界，以确保这一对内容保持在一起，并保留当前未总结的尾部内容。

完整的对话历史仍会保存在磁盘上。压缩整理只会改变模型在下一轮看到的内容。

## 自动压缩整理

自动压缩整理默认开启。当会话接近上下文限制时，或者当模型返回上下文溢出错误时，它就会运行（后一种情况下，OpenClaw 会先进行压缩整理再重试）。

你会看到：

- 在详细模式下显示 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
在压缩整理之前，OpenClaw 会自动提醒智能体将重要笔记保存到 [memory](/zh-CN/concepts/memory) 文件中。这样可以防止上下文丢失。
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

## 手动压缩整理

在任意聊天中输入 `/compact` 即可强制执行一次压缩整理。你还可以附加说明来引导摘要内容：

```
/compact Focus on the API design decisions
```

当设置了 `agents.defaults.compaction.keepRecentTokens` 时，手动压缩整理会遵循该 Pi 截断点，并在重建后的上下文中保留最近的尾部内容。如果没有显式的保留预算，手动压缩整理会表现为一次硬检查点，并仅基于新的摘要继续。

## 配置

在你的 `openclaw.json` 中，通过 `agents.defaults.compaction` 配置压缩整理。下面列出了最常用的选项；完整参考请参阅 [Session management deep dive](/zh-CN/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩整理使用智能体的主模型。设置 `agents.defaults.compaction.model` 可将摘要生成委托给能力更强或更专门的模型。该覆盖项接受任意 `provider/model-id` 字符串：

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

这同样适用于本地模型，例如专门用于摘要生成的第二个 Ollama 模型：

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

未设置时，压缩整理会使用智能体的主模型。

### 标识符保留

默认情况下，压缩整理摘要会保留不透明标识符（`identifierPolicy: "strict"`）。你可以通过设置 `identifierPolicy: "off"` 来禁用，或者通过设置 `identifierPolicy: "custom"` 并配合 `identifierInstructions` 提供自定义指导。

### 活动转录字节保护

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 时，如果活动 JSONL 达到该大小，OpenClaw 会在运行前触发常规本地压缩整理。这对于长时间运行的会话很有用：即使提供商侧的上下文管理能让模型上下文保持健康，本地转录仍可能持续增长。它不会直接切分原始 JSONL 字节，而是会调用常规压缩整理流程来生成语义摘要。

<Warning>
字节保护要求设置 `truncateAfterCompaction: true`。如果不进行转录轮换，活动文件不会缩小，因此该保护机制将保持不活跃状态。
</Warning>

### 后继转录

启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 不会原地重写现有转录。它会基于压缩整理摘要、保留状态以及未总结的尾部内容创建一个新的活动后继转录，同时将之前的 JSONL 保留为已归档的检查点来源。

### 压缩整理通知

默认情况下，压缩整理会静默运行。将 `notifyUser` 设为显示在压缩整理开始和完成时的简短状态消息：

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

在压缩整理之前，OpenClaw 可以执行一次**静默 Memory 刷新**轮次，将持久笔记保存到磁盘。详情和配置请参见 [Memory](/zh-CN/concepts/memory)。

## 可插拔的压缩整理提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩整理提供商。当某个提供商已注册并完成配置后，OpenClaw 会将摘要生成委托给它，而不是使用内置的 LLM 流程。

要使用已注册的提供商，请在配置中设置其 id：

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

设置 `provider` 会自动强制启用 `mode: "safeguard"`。提供商会接收与内置路径相同的压缩整理说明和标识符保留策略，并且在提供商输出之后，OpenClaw 仍会保留最近轮次和拆分轮次的后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要生成。
</Note>

## 压缩整理与裁剪

|                  | 压缩整理                 | 裁剪                           |
| ---------------- | ------------------------ | ------------------------------ |
| **它的作用**     | 总结较早的对话           | 修剪旧的工具结果               |
| **会保存吗？**   | 会（保存在会话转录中）   | 不会（仅在内存中、按请求进行） |
| **范围**         | 整个对话                 | 仅工具结果                     |

[Session pruning](/zh-CN/concepts/session-pruning) 是一种更轻量的补充方式，它会在不生成摘要的情况下裁剪工具输出。

## 故障排除

**压缩整理得太频繁？** 模型的上下文窗口可能较小，或者工具输出可能较大。你可以尝试启用 [session pruning](/zh-CN/concepts/session-pruning)。

**压缩整理后感觉上下文变旧了？** 使用 `/compact Focus on <topic>` 来引导摘要，或者启用 [memory flush](/zh-CN/concepts/memory)，让笔记得以保留。

**需要一个全新的开始？** `/new` 会启动一个新的会话，而不会进行压缩整理。

有关高级配置（预留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩整理），请参阅 [Session management deep dive](/zh-CN/reference/session-management-compaction)。

## 相关内容

- [Session](/zh-CN/concepts/session)：会话管理与生命周期。
- [Session pruning](/zh-CN/concepts/session-pruning)：裁剪工具结果。
- [Context](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [Hooks](/zh-CN/automation/hooks)：压缩整理生命周期钩子（`before_compaction`、`after_compaction`）。
