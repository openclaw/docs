---
read_when:
    - 你想了解自动压缩和 /compact
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制内
title: 压缩
x-i18n:
    generated_at: "2026-06-27T01:46:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

每个模型都有一个上下文窗口：它能处理的最大 token 数。当对话接近该限制时，OpenClaw 会将较早的消息**压缩**成摘要，让聊天可以继续。

## 工作原理

1. 较早的对话轮次会被总结为一个紧凑条目。
2. 摘要会保存在会话 transcript 中。
3. 最近的消息会保持完整。

当 OpenClaw 将历史记录拆分为压缩块时，它会让助手工具调用与其匹配的 `toolResult` 条目保持配对。如果拆分点落在工具块内部，OpenClaw 会移动边界，使这一对保持在一起，并保留当前未总结的尾部内容。

完整对话历史会保留在磁盘上。压缩只会改变模型在下一轮看到的内容。

## 自动压缩

自动压缩默认开启。它会在会话接近上下文限制时运行，或在模型返回上下文溢出错误时运行（在这种情况下，OpenClaw 会先压缩再重试）。

你会看到：

- 普通 Gateway 网关日志中的 `embedded run auto-compaction start` / `complete`。
- 详细模式中的 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
压缩前，OpenClaw 会自动提醒智能体将重要笔记保存到 [memory](/zh-CN/concepts/memory) 文件。这可以防止上下文丢失。
</Info>

<AccordionGroup>
  <Accordion title="已识别的溢出特征">
    OpenClaw 会通过这些提供商错误模式检测上下文溢出：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手动压缩

在任意聊天中输入 `/compact` 以强制压缩。添加指令来引导摘要：

```
/compact Focus on the API design decisions
```

设置 `agents.defaults.compaction.keepRecentTokens` 后，手动压缩会遵循该 OpenClaw 切分点，并在重建的上下文中保留最近的尾部内容。如果没有明确的保留预算，手动压缩会表现为硬检查点，并仅从新的摘要继续。

## 配置

在你的 `openclaw.json` 中通过 `agents.defaults.compaction` 配置压缩。下面列出最常用的旋钮；完整参考见 [会话管理深度解析](/zh-CN/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩使用智能体的主模型。设置 `agents.defaults.compaction.model` 可将摘要委派给能力更强或更专用的模型。该覆盖接受 `provider/model-id` 字符串，或在 `agents.defaults.models` 下配置的裸别名：

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

裸配置别名会在压缩开始前解析为其规范提供商和模型。如果一个裸值同时匹配别名和配置的字面模型 ID，则字面模型 ID 优先。未匹配的裸值会保留为活动提供商上的模型 ID。

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

未设置时，压缩会从活动会话模型开始。如果摘要因符合模型回退条件的提供商错误而失败，OpenClaw 会通过会话现有的模型回退链重试该压缩尝试。回退选择是临时的，不会写回会话状态。显式的 `agents.defaults.compaction.model` 覆盖保持精确，不会继承会话回退链。

### 标识符保留

压缩摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。可用 `identifierPolicy: "off"` 禁用，或使用 `identifierPolicy: "custom"` 加 `identifierInstructions` 提供自定义指引。

### 活动 transcript 字节保护

设置 `agents.defaults.compaction.maxActiveTranscriptBytes` 后，如果活动 JSONL 达到该大小，OpenClaw 会在运行前触发普通本地压缩。这对长时间运行的会话很有用，因为提供商侧上下文管理可能让模型上下文保持健康，而本地 transcript 仍在增长。它不会拆分原始 JSONL 字节；它会请求普通压缩流水线创建语义摘要。

<Warning>
字节保护需要 `truncateAfterCompaction: true`。如果没有 transcript 轮转，活动文件不会缩小，保护也会保持不活动。
</Warning>

### 后续 transcript

启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 不会就地重写现有 transcript。它会从压缩摘要、保留状态和未总结尾部内容创建一个新的活动后续 transcript，然后记录检查点元数据，将分支/恢复流程指向该压缩后的后续 transcript。
后续 transcript 还会删除在短重试窗口内到达的完全重复的长用户轮次，因此频道重试风暴不会在压缩后被带入下一个活动 transcript。

OpenClaw 不再为新的压缩写入单独的 `.checkpoint.*.jsonl` 副本。现有旧版检查点文件在被引用时仍可使用，并会由普通会话清理进行修剪。

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

### 记忆刷新

压缩前，OpenClaw 可以运行一次**静默记忆刷新**轮次，将持久笔记存储到磁盘。当这个清理轮次应使用本地模型而不是活动对话模型时，设置 `agents.defaults.compaction.memoryFlush.model`：

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

记忆刷新模型覆盖是精确的，不会继承活动会话回退链。详情和配置见 [Memory](/zh-CN/concepts/memory)。

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩提供商。当提供商已注册并配置后，OpenClaw 会将摘要委派给它，而不是使用内置 LLM 流水线。

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

设置 `provider` 会自动强制 `mode: "safeguard"`。提供商会接收与内置路径相同的压缩指令和标识符保留策略，并且 OpenClaw 仍会在提供商输出后保留最近轮次和拆分轮次后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要。
</Note>

## 压缩与修剪

|                  | 压缩                          | 修剪                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用**         | 总结较早的对话                | 裁剪旧工具结果                   |
| **是否保存？**   | 是（在会话 transcript 中）    | 否（仅在内存中，按请求生效）     |
| **范围**         | 整个对话                      | 仅工具结果                       |

[会话修剪](/zh-CN/concepts/session-pruning) 是更轻量的补充，可以在不总结的情况下裁剪工具输出。

## 故障排除

**压缩太频繁？** 模型的上下文窗口可能较小，或者工具输出可能很大。尝试启用[会话修剪](/zh-CN/concepts/session-pruning)。

**压缩后感觉上下文陈旧？** 使用 `/compact Focus on <topic>` 引导摘要，或启用 [memory flush](/zh-CN/concepts/memory)，让笔记得以保留。

**需要干净的新开始？** `/new` 会启动一个新会话，不进行压缩。

高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务器端压缩）见[会话管理深度解析](/zh-CN/reference/session-management-compaction)。

## 相关

- [会话](/zh-CN/concepts/session)：会话管理和生命周期。
- [会话修剪](/zh-CN/concepts/session-pruning)：裁剪工具结果。
- [上下文](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [钩子](/zh-CN/automation/hooks)：压缩生命周期钩子（`before_compaction`、`after_compaction`）。
