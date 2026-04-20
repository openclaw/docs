---
read_when:
    - 你想了解自动压缩和 `/compact`
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制范围内
title: 压缩
x-i18n:
    generated_at: "2026-04-20T18:56:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# 压缩

每个模型都有一个上下文窗口——也就是它最多能够处理的 token 数量。
当对话接近这个限制时，OpenClaw 会将较早的消息**压缩**为一段摘要，
这样聊天就可以继续进行。

## 工作原理

1. 较早的对话轮次会被总结成一条压缩条目。
2. 该摘要会保存在会话转录中。
3. 最近的消息会保持原样。

当 OpenClaw 将历史记录拆分为压缩块时，它会让智能体工具调用
与其对应的 `toolResult` 条目保持配对。如果拆分点落在某个工具块内部，
OpenClaw 会移动边界，以确保这对内容保持在一起，并保留当前未总结的尾部内容。

完整的对话历史仍会保存在磁盘上。压缩只会改变模型在下一轮看到的内容。

## 自动压缩

自动压缩默认开启。它会在会话接近上下文限制时运行，或者在模型返回上下文溢出错误时运行（此时
OpenClaw 会先压缩，再重试）。常见的溢出特征包括
`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`，以及 `ollama error: context length
exceeded`。

<Info>
在压缩之前，OpenClaw 会自动提醒智能体将重要笔记保存到 [memory](/zh-CN/concepts/memory) 文件中。这样可以防止上下文丢失。
</Info>

使用你的 `openclaw.json` 中的 `agents.defaults.compaction` 设置来配置压缩行为（模式、目标 token 数等）。
压缩摘要默认会保留不透明标识符（`identifierPolicy: "strict"`）。你可以将其覆盖为 `identifierPolicy: "off"`，或者通过 `identifierPolicy: "custom"` 和 `identifierInstructions` 提供自定义文本。

你也可以通过 `agents.defaults.compaction.model` 为压缩摘要指定一个不同的模型。当你的主模型是本地模型或小模型，而你希望由能力更强的模型生成压缩摘要时，这会很有帮助。该覆盖项接受任意 `provider/model-id` 字符串：

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

这同样适用于本地模型，例如专门用于摘要的第二个 Ollama 模型，或经过微调的压缩专用模型：

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

未设置时，压缩会使用智能体的主模型。

## 可插拔的压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩提供商。当某个提供商已注册并已配置时，OpenClaw 会将摘要生成委托给它，而不是使用内置的 LLM 流程。

要使用已注册的提供商，请在你的配置中设置提供商 id：

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

设置 `provider` 会自动强制使用 `mode: "safeguard"`。提供商会接收与内置路径相同的压缩指令和标识符保留策略，并且在提供商输出之后，OpenClaw 仍会保留最近轮次和拆分轮次的后缀上下文。如果提供商失败或返回空结果，OpenClaw 会回退到内置的 LLM 摘要生成。

## 自动压缩（默认开启）

当某个会话接近或超过模型的上下文窗口时，OpenClaw 会触发自动压缩，并可能使用压缩后的上下文重试原始请求。

你会看到：

- 在详细模式下显示 `🧹 Auto-compaction complete`
- `/status` 显示 `🧹 Compactions: <count>`

在压缩之前，OpenClaw 可以运行一次**静默 memory 刷新**轮次，将持久笔记存储到磁盘。详见 [Memory](/zh-CN/concepts/memory) 了解细节和配置。

## 手动压缩

在任意聊天中输入 `/compact` 即可强制执行一次压缩。你还可以添加说明来引导摘要内容：

```
/compact Focus on the API design decisions
```

## 使用不同的模型

默认情况下，压缩会使用你的智能体主模型。你可以使用能力更强的模型来获得更好的摘要：

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## 压缩通知

默认情况下，压缩会静默运行。若要在压缩开始和完成时显示简短通知，请启用 `notifyUser`：

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

启用后，用户会在每次压缩运行前后看到简短的状态消息
（例如，“正在压缩上下文...” 和 “压缩完成”）。

## 压缩与裁剪

|                  | 压缩                         | 裁剪                             |
| ---------------- | ---------------------------- | -------------------------------- |
| **它的作用**     | 总结较早的对话               | 修剪旧的工具结果                 |
| **会保存吗？**   | 会（保存在会话转录中）       | 不会（仅保存在内存中，按请求）   |
| **范围**         | 整个对话                     | 仅工具结果                       |

[会话裁剪](/zh-CN/concepts/session-pruning) 是一种更轻量的补充方式，它会修剪工具输出，而不进行总结。

## 故障排除

**压缩过于频繁？** 模型的上下文窗口可能较小，或者工具输出可能较大。尝试启用
[会话裁剪](/zh-CN/concepts/session-pruning)。

**压缩后感觉上下文不够新鲜？** 使用 `/compact Focus on <topic>` 来引导摘要内容，或者启用 [memory 刷新](/zh-CN/concepts/memory)，这样笔记就能保留下来。

**需要一个全新的开始？** `/new` 会启动一个新的会话，而不会执行压缩。

关于高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩），请参阅
[会话管理深入解析](/zh-CN/reference/session-management-compaction)。

## 相关内容

- [会话](/zh-CN/concepts/session) —— 会话管理与生命周期
- [会话裁剪](/zh-CN/concepts/session-pruning) —— 修剪工具结果
- [上下文](/zh-CN/concepts/context) —— 如何为智能体轮次构建上下文
- [Hooks](/zh-CN/automation/hooks) —— 压缩生命周期 hooks（before_compaction、after_compaction）
