---
read_when:
    - 你想了解自动压缩和 /compact
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制内
title: 压缩
x-i18n:
    generated_at: "2026-05-01T19:19:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

每个模型都有一个上下文窗口：也就是它可以处理的最大 token 数。当对话接近该限制时，OpenClaw 会将较早的消息**压缩**成摘要，以便聊天可以继续。

## 工作原理

1. 较早的对话轮次会被摘要为一个压缩条目。
2. 摘要会保存在会话记录中。
3. 最近的消息会保持原样。

当 OpenClaw 将历史拆分为压缩分块时，它会让助手工具调用与其匹配的 `toolResult` 条目保持配对。如果拆分点落在工具块内部，OpenClaw 会移动边界，使这对内容保持在一起，并保留当前未摘要的尾部内容。

完整对话历史仍保存在磁盘上。压缩只会改变模型在下一轮中看到的内容。

## 自动压缩

自动压缩默认开启。当会话接近上下文限制时，或当模型返回上下文溢出错误时，它会运行（在这种情况下，OpenClaw 会压缩并重试）。

你会看到：

- 详细模式中的 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
压缩前，OpenClaw 会自动提醒智能体将重要备注保存到 [memory](/zh-CN/concepts/memory) 文件中。这可以防止上下文丢失。
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

## 手动压缩

在任意聊天中输入 `/compact` 可强制执行压缩。添加指令来引导摘要：

```
/compact Focus on the API design decisions
```

设置 `agents.defaults.compaction.keepRecentTokens` 后，手动压缩会遵守该 Pi 切点，并在重建的上下文中保留最近尾部。没有显式保留预算时，手动压缩会作为硬检查点，并仅从新摘要继续。

## 配置

在你的 `openclaw.json` 中的 `agents.defaults.compaction` 下配置压缩。下面列出了最常用的旋钮；完整参考请参阅 [会话管理深度解析](/zh-CN/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩会使用智能体的主模型。设置 `agents.defaults.compaction.model` 可将摘要委托给能力更强或更专用的模型。该覆盖项接受任何 `provider/model-id` 字符串：

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

未设置时，压缩会从活跃会话模型开始。如果摘要因符合模型回退条件的提供商错误而失败，OpenClaw 会通过该会话现有的模型回退链重试该压缩尝试。回退选择是临时的，不会写回会话状态。显式的 `agents.defaults.compaction.model` 覆盖项会保持精确指定，并且不会继承会话回退链。

### 标识符保留

压缩摘要默认会保留不透明标识符（`identifierPolicy: "strict"`）。可用 `identifierPolicy: "off"` 覆盖以禁用，或使用 `identifierPolicy: "custom"` 加 `identifierInstructions` 提供自定义指引。

### 活跃记录字节保护

设置 `agents.defaults.compaction.maxActiveTranscriptBytes` 后，如果活跃 JSONL 达到该大小，OpenClaw 会在运行前触发普通本地压缩。这对长时间运行的会话很有用，因为提供商侧的上下文管理可能会让模型上下文保持健康，而本地记录仍在持续增长。它不会拆分原始 JSONL 字节；它会要求普通压缩管线创建语义摘要。

<Warning>
字节保护需要 `truncateAfterCompaction: true`。如果没有记录轮转，活跃文件不会缩小，保护机制会保持不活跃。
</Warning>

### 后继记录

启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 不会就地重写现有记录。它会根据压缩摘要、保留状态和未摘要尾部创建新的活跃后继记录，然后将之前的 JSONL 保留为归档检查点来源。
后继记录还会丢弃在短重试窗口内到达的完全重复长用户轮次，因此渠道重试风暴不会在压缩后被带入下一个活跃记录。

预压缩检查点只会在低于 OpenClaw 的检查点大小上限时保留；过大的活跃记录仍会压缩，但 OpenClaw 会跳过大型调试快照，而不是让磁盘用量翻倍。

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

压缩前，OpenClaw 可以运行一次**静默记忆刷新**轮次，将持久备注存储到磁盘。当这个内务轮次应使用本地模型而不是活跃对话模型时，设置 `agents.defaults.compaction.memoryFlush.model`：

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

记忆刷新模型覆盖项是精确指定的，并且不会继承活跃会话回退链。详情和配置请参阅 [记忆](/zh-CN/concepts/memory)。

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩提供商。注册并配置提供商后，OpenClaw 会将摘要委托给它，而不是使用内置 LLM 管线。

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

设置 `provider` 会自动强制使用 `mode: "safeguard"`。提供商会收到与内置路径相同的压缩指令和标识符保留策略，并且 OpenClaw 仍会在提供商输出后保留最近轮次和拆分轮次的后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要。
</Note>

## 压缩与剪枝

|                  | 压缩                    | 剪枝                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用** | 摘要较早的对话 | 裁剪旧工具结果           |
| **会保存吗？**       | 是（在会话记录中）   | 否（仅内存中，按请求生效） |
| **范围**        | 整个对话           | 仅工具结果                |

[会话剪枝](/zh-CN/concepts/session-pruning) 是一种更轻量的补充方式，可以裁剪工具输出而无需摘要。

## 故障排除

**压缩太频繁？** 模型的上下文窗口可能较小，或工具输出可能很大。尝试启用 [会话剪枝](/zh-CN/concepts/session-pruning)。

**压缩后感觉上下文过旧？** 使用 `/compact Focus on <topic>` 引导摘要，或启用 [记忆刷新](/zh-CN/concepts/memory)，让备注得以保留。

**需要清空重新开始？** `/new` 会启动一个全新会话而不压缩。

对于高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩），请参阅 [会话管理深度解析](/zh-CN/reference/session-management-compaction)。

## 相关内容

- [会话](/zh-CN/concepts/session)：会话管理和生命周期。
- [会话剪枝](/zh-CN/concepts/session-pruning)：裁剪工具结果。
- [上下文](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [钩子](/zh-CN/automation/hooks)：压缩生命周期钩子（`before_compaction`、`after_compaction`）。
