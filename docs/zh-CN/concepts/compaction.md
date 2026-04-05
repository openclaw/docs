---
read_when:
    - 你想了解自动压缩和 /compact
    - 你正在调试因长会话触及上下文限制的问题
summary: OpenClaw 如何总结长对话以保持在模型限制之内
title: Compaction
x-i18n:
    generated_at: "2026-04-05T08:20:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

每个模型都有一个上下文窗口——即它最多能处理的 token 数量。
当对话接近这个限制时，OpenClaw 会将较早的消息**压缩**为摘要，
以便聊天可以继续进行。

## 工作原理

1. 较早的对话轮次会被总结为一条压缩条目。
2. 该摘要会保存在会话转录中。
3. 最近的消息会保持原样。

当 OpenClaw 将历史拆分为压缩分块时，它会让 assistant 工具
调用与其匹配的 `toolResult` 条目保持配对。如果拆分点落在工具块
内部，OpenClaw 会移动边界，以便这对条目保持在一起，并保留
当前未总结的尾部内容。

完整的对话历史仍会保存在磁盘上。压缩只会改变模型在下一轮
看到的内容。

## 自动压缩

自动压缩默认开启。当会话接近上下文
限制时，或当模型返回上下文溢出错误时，它就会运行（在这种情况下，
OpenClaw 会执行压缩并重试）。典型的溢出特征包括
`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model` 和 `ollama error: context length
exceeded`。

<Info>
在压缩之前，OpenClaw 会自动提醒智能体将重要
备注保存到 [memory](/concepts/memory) 文件中。这样可以防止上下文丢失。
</Info>

## 手动压缩

在任意聊天中输入 `/compact` 即可强制执行一次压缩。你还可以添加说明来引导
摘要内容：

```
/compact Focus on the API design decisions
```

## 使用其他模型

默认情况下，压缩使用你的智能体主模型。你也可以使用能力更强的模型来获得更好的摘要：

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

## 压缩开始通知

默认情况下，压缩会静默执行。若要在压缩
开始时显示简短通知，请启用 `notifyUser`：

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

启用后，用户会在每次压缩开始时看到一条简短消息（例如，“正在压缩
上下文...”）。

## 压缩与修剪

|                  | 压缩                         | 修剪                             |
| ---------------- | ---------------------------- | -------------------------------- |
| **它的作用**     | 总结较早的对话               | 裁剪旧的工具结果                 |
| **是否保存？**   | 是（保存在会话转录中）       | 否（仅在内存中，每次请求单独处理） |
| **范围**         | 整个对话                     | 仅工具结果                       |

[Session pruning](/concepts/session-pruning) 是一种更轻量的补充方式，
可在不总结的情况下裁剪工具输出。

## 故障排除

**压缩过于频繁？** 模型的上下文窗口可能较小，或者工具
输出可能较大。可以尝试启用
[Session pruning](/concepts/session-pruning)。

**压缩后感觉上下文过时？** 使用 `/compact Focus on <topic>` 来
引导摘要，或启用 [memory flush](/concepts/memory)，以便备注
能够保留下来。

**需要一个全新的开始？** `/new` 会启动一个全新的会话，而不会执行压缩。

有关高级配置（预留 token、标识符保留、自定义
上下文引擎、OpenAI 服务端压缩），请参阅
[Session Management Deep Dive](/reference/session-management-compaction)。

## 相关内容

- [Session](/concepts/session) — 会话管理与生命周期
- [Session Pruning](/concepts/session-pruning) — 裁剪工具结果
- [Context](/concepts/context) — 如何为智能体轮次构建上下文
- [Hooks](/automation/hooks) — 压缩生命周期 hooks（before_compaction、after_compaction）
