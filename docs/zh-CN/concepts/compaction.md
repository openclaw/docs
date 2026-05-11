---
read_when:
    - 你想了解自动压缩和 /compact
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制内
title: 压缩
x-i18n:
    generated_at: "2026-05-11T20:26:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

每个模型都有一个上下文窗口：它能处理的最大 token 数量。当对话接近该限制时，OpenClaw 会将较早的消息**压缩**成摘要，让聊天可以继续。

## 工作原理

1. 较早的对话轮次会被摘要成一条精简条目。
2. 摘要会保存在会话转录中。
3. 最近的消息会保持完整。

当 OpenClaw 将历史拆分为压缩块时，它会让智能体工具调用与其匹配的 `toolResult` 条目保持配对。如果拆分点落在工具块内部，OpenClaw 会移动边界，让这对条目保持在一起，并保留当前未摘要的尾部。

完整的对话历史仍保留在磁盘上。压缩只会改变模型在下一轮看到的内容。

## 自动压缩

自动压缩默认开启。它会在会话接近上下文限制时运行，或在模型返回上下文溢出错误时运行（此时 OpenClaw 会压缩并重试）。

你会看到：

- 正常 Gateway 网关日志中的 `embedded run auto-compaction start` / `complete`。
- 详细模式中的 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
压缩前，OpenClaw 会自动提醒智能体将重要笔记保存到 [memory](/zh-CN/concepts/memory) 文件。这可以防止上下文丢失。
</Info>

<AccordionGroup>
  <Accordion title="可识别的溢出特征">
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

在任何聊天中输入 `/compact` 可强制压缩。添加指令来引导摘要：

```
/compact Focus on the API design decisions
```

设置 `agents.defaults.compaction.keepRecentTokens` 后，手动压缩会遵循该 Pi 切分点，并在重建的上下文中保留最近尾部。如果没有显式保留预算，手动压缩会表现为硬检查点，并仅从新的摘要继续。

## 配置

在你的 `openclaw.json` 中通过 `agents.defaults.compaction` 配置压缩。下面列出最常用的旋钮；完整参考请见[会话管理深度解析](/zh-CN/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩使用智能体的主模型。设置 `agents.defaults.compaction.model` 可将摘要委托给能力更强或更专门的模型。该覆盖接受任何 `provider/model-id` 字符串：

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

未设置时，压缩会从当前会话模型开始。如果摘要因符合模型回退条件的提供商错误而失败，OpenClaw 会通过会话现有的模型回退链重试该次压缩。回退选择是临时的，不会写回会话状态。显式的 `agents.defaults.compaction.model` 覆盖会保持精确，并且不会继承会话回退链。

### 标识符保留

压缩摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。可用 `identifierPolicy: "off"` 覆盖以禁用，或使用 `identifierPolicy: "custom"` 加 `identifierInstructions` 提供自定义指导。

### 活跃转录字节保护

设置 `agents.defaults.compaction.maxActiveTranscriptBytes` 后，如果活跃 JSONL 达到该大小，OpenClaw 会在运行前触发正常的本地压缩。这适用于长时间运行的会话，其中提供商侧上下文管理可能保持模型上下文健康，但本地转录仍持续增长。它不会拆分原始 JSONL 字节；它会要求正常压缩管线创建语义摘要。

<Warning>
字节保护需要 `truncateAfterCompaction: true`。如果没有转录轮换，活跃文件不会缩小，保护也会保持非活跃。
</Warning>

### 后继转录

启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 不会就地重写现有转录。它会从压缩摘要、保留状态和未摘要尾部创建一个新的活跃后继转录，然后将之前的 JSONL 保留为已归档的检查点来源。
后继转录还会丢弃在短重试窗口内到达的完全重复的长用户轮次，因此频道重试风暴不会在压缩后被带入下一个活跃转录。

压缩前检查点只会在低于 OpenClaw 的检查点大小上限时保留；过大的活跃转录仍会压缩，但 OpenClaw 会跳过大型调试快照，而不是让磁盘用量翻倍。

### 压缩通知

默认情况下，压缩会静默运行。设置 `notifyUser` 可在压缩开始和完成时显示简短状态消息：

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

### 记忆刷写

压缩前，OpenClaw 可以运行一个**静默记忆刷写**轮次，将持久笔记存储到磁盘。当这个整理轮次应使用本地模型而不是当前对话模型时，设置 `agents.defaults.compaction.memoryFlush.model`：

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

记忆刷写模型覆盖是精确的，不会继承当前会话回退链。详情和配置请见[记忆](/zh-CN/concepts/memory)。

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩提供商。当提供商已注册并配置时，OpenClaw 会将摘要委托给它，而不是使用内置 LLM 管线。

要使用已注册的提供商，请在你的配置中设置它的 ID：

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

设置 `provider` 会自动强制 `mode: "safeguard"`。提供商会收到与内置路径相同的压缩指令和标识符保留策略，并且 OpenClaw 在提供商输出后仍会保留最近轮次和拆分轮次的后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要。
</Note>

## 压缩与剪除

|                  | 压缩                    | 剪除                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用** | 摘要较早的对话 | 修剪旧工具结果           |
| **是否保存？**       | 是（在会话转录中）   | 否（仅内存中，按请求） |
| **范围**        | 整个对话           | 仅工具结果                |

[会话剪除](/zh-CN/concepts/session-pruning) 是一种更轻量的补充方式，可以在不摘要的情况下修剪工具输出。

## 故障排除

**压缩过于频繁？** 模型的上下文窗口可能较小，或工具输出可能较大。尝试启用[会话剪除](/zh-CN/concepts/session-pruning)。

**压缩后上下文感觉陈旧？** 使用 `/compact Focus on <topic>` 引导摘要，或启用[记忆刷写](/zh-CN/concepts/memory)，让笔记保留下来。

**需要一块干净的新空间？** `/new` 会启动一个新会话而不进行压缩。

对于高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩），请见[会话管理深度解析](/zh-CN/reference/session-management-compaction)。

## 相关内容

- [会话](/zh-CN/concepts/session)：会话管理和生命周期。
- [会话剪除](/zh-CN/concepts/session-pruning)：修剪工具结果。
- [上下文](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [钩子](/zh-CN/automation/hooks)：压缩生命周期钩子（`before_compaction`、`after_compaction`）。
