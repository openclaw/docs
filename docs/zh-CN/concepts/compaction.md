---
read_when:
    - 你想了解自动压缩和 /compact
    - 你正在调试达到上下文限制的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制内
title: 压缩
x-i18n:
    generated_at: "2026-04-28T11:49:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

每个模型都有一个上下文窗口：它可以处理的最大 token 数。当对话接近该限制时，OpenClaw 会将较旧的消息**压缩**成摘要，让聊天可以继续。

## 工作原理

1. 较早的对话轮次会被汇总为一个紧凑条目。
2. 摘要会保存在会话转录中。
3. 最近的消息会保持完整。

当 OpenClaw 将历史记录拆分为压缩分块时，它会保持 assistant 工具调用与匹配的 `toolResult` 条目成对。如果拆分点落在工具块内部，OpenClaw 会移动边界，使这一对保持在一起，并保留当前未汇总的尾部内容。

完整对话历史会保留在磁盘上。压缩只会改变模型在下一轮看到的内容。

## 自动压缩

自动压缩默认开启。它会在会话接近上下文限制时运行，或者在模型返回上下文溢出错误时运行（此时 OpenClaw 会压缩并重试）。

你会看到：

- 详细模式中的 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
压缩之前，OpenClaw 会自动提醒智能体将重要笔记保存到 [记忆](/zh-CN/concepts/memory) 文件中。这可以防止上下文丢失。
</Info>

<AccordionGroup>
  <Accordion title="识别到的溢出签名">
    OpenClaw 会从这些提供商错误模式中检测上下文溢出：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手动压缩

在任意聊天中输入 `/compact` 即可强制压缩。添加说明可以引导摘要：

```
/compact Focus on the API design decisions
```

设置 `agents.defaults.compaction.keepRecentTokens` 后，手动压缩会遵循该 Pi 截断点，并在重建的上下文中保留最近的尾部内容。如果没有显式保留预算，手动压缩会表现为硬检查点，并仅从新摘要继续。

## 配置

在你的 `openclaw.json` 中的 `agents.defaults.compaction` 下配置压缩。下面列出了最常用的旋钮；完整参考请参见[会话管理深度解析](/zh-CN/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩使用智能体的主模型。设置 `agents.defaults.compaction.model` 可将摘要委托给能力更强或更专门的模型。该覆盖接受任意 `provider/model-id` 字符串：

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

这也适用于本地模型，例如专用于摘要的第二个 Ollama 模型：

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

未设置时，压缩使用智能体的主模型。

### 标识符保留

压缩摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。可使用 `identifierPolicy: "off"` 禁用，或使用 `identifierPolicy: "custom"` 加 `identifierInstructions` 提供自定义指导。

### 活跃转录字节保护

设置 `agents.defaults.compaction.maxActiveTranscriptBytes` 后，如果活跃 JSONL 达到该大小，OpenClaw 会在运行前触发正常本地压缩。这适用于长时间运行的会话：提供商侧的上下文管理可能让模型上下文保持健康，但本地转录仍在持续增长。它不会拆分原始 JSONL 字节；它会请求正常压缩流水线创建语义摘要。

<Warning>
字节保护需要 `truncateAfterCompaction: true`。如果没有转录轮换，活跃文件不会缩小，保护机制会保持不活动。
</Warning>

### 后继转录

启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 不会就地重写现有转录。它会根据压缩摘要、保留状态和未汇总尾部内容创建新的活跃后继转录，然后将之前的 JSONL 保留为已归档的检查点来源。
后继转录还会丢弃在短重试窗口内到达的完全重复的长用户轮次，因此渠道重试风暴不会在压缩后被带入下一个活跃转录。

预压缩检查点只会在低于 OpenClaw 的检查点大小上限时保留；超大的活跃转录仍会压缩，但 OpenClaw 会跳过大型调试快照，避免磁盘占用翻倍。

### 压缩通知

默认情况下，压缩会静默运行。设置 `notifyUser` 可在压缩开始和完成时显示简短 Status 消息：

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

### 记忆刷新

压缩之前，OpenClaw 可以运行一个**静默记忆刷新**轮次，将持久笔记存储到磁盘。当这个内务轮次应使用本地模型而不是活跃对话模型时，设置 `agents.defaults.compaction.memoryFlush.model`：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

记忆刷新模型覆盖是精确的，不会继承活跃会话的回退链。详情和配置请参见[记忆](/zh-CN/concepts/memory)。

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩提供商。当一个提供商已注册并配置后，OpenClaw 会将摘要委托给它，而不是使用内置 LLM 流水线。

要使用已注册的提供商，请在你的配置中设置其 id：

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

设置 `provider` 会自动强制 `mode: "safeguard"`。提供商会收到与内置路径相同的压缩说明和标识符保留策略，并且 OpenClaw 仍会在提供商输出后保留最近轮次和拆分轮次的后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要。
</Note>

## 压缩与剪枝

|                  | 压缩                    | 剪枝                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用** | 汇总较旧的对话 | 修剪旧工具结果           |
| **已保存？**       | 是（在会话转录中）   | 否（仅在内存中，按请求生效） |
| **范围**        | 整个对话           | 仅工具结果                |

[会话剪枝](/zh-CN/concepts/session-pruning)是一种更轻量的补充，可在不汇总的情况下修剪工具输出。

## 故障排除

**压缩太频繁？** 模型的上下文窗口可能较小，或者工具输出可能较大。尝试启用[会话剪枝](/zh-CN/concepts/session-pruning)。

**压缩后感觉上下文陈旧？** 使用 `/compact Focus on <topic>` 来引导摘要，或启用[记忆刷新](/zh-CN/concepts/memory)，让笔记得以保留。

**需要一个干净的起点？** `/new` 会启动一个新的会话而不进行压缩。

如需高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务器端压缩），请参见[会话管理深度解析](/zh-CN/reference/session-management-compaction)。

## 相关

- [会话](/zh-CN/concepts/session)：会话管理和生命周期。
- [会话剪枝](/zh-CN/concepts/session-pruning)：修剪工具结果。
- [上下文](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [钩子](/zh-CN/automation/hooks)：压缩生命周期钩子（`before_compaction`、`after_compaction`）。
