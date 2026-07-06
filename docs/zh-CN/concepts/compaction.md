---
read_when:
    - 你想了解自动压缩和 /compact
    - 你正在调试触及上下文限制的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制内
title: 压缩
x-i18n:
    generated_at: "2026-07-06T10:48:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cfa0d3aec36ae38c04b76f37a2ddf9d6bf81ac6598296096a4c24b349738aaa
    source_path: concepts/compaction.md
    workflow: 16
---

每个模型都有一个上下文窗口：它能处理的最大 token 数。当对话接近该限制时，OpenClaw 会将较早的消息**压缩**成摘要，以便聊天可以继续。

## 工作原理

1. 较早的对话轮次会被总结为一个压缩条目。
2. 摘要会保存在会话转录记录中。
3. 最近的消息会保持完整。

OpenClaw 在选择压缩分割点时，会让助手工具调用与其匹配的 `toolResult` 条目保持配对。如果分割点落在工具块内部，OpenClaw 会移动边界，让配对保持在一起，并保留当前未总结的尾部内容。

完整对话历史会保留在磁盘上。压缩只会改变模型在下一轮看到的内容。

<Note>
新配置默认将 `agents.defaults.compaction.mode` 设为 `"safeguard"`（更严格的护栏、摘要质量审计）。显式设置 `mode: "default"` 可选择退出。
</Note>

## 自动压缩

自动压缩默认开启。它会在会话接近上下文限制时运行，或在模型返回上下文溢出错误时运行（此时 OpenClaw 会压缩并重试）。

你会看到：

- 普通 Gateway 网关日志中的 `embedded run auto-compaction start` / `complete`。
- 详细模式中的 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
在压缩之前，OpenClaw 会自动提醒智能体将重要笔记保存到 [记忆](/zh-CN/concepts/memory) 文件。这可以防止上下文丢失。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw 可识别的溢出错误模式">
    OpenClaw 会匹配数十种特定提供商的溢出错误字符串（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter 等）。常见示例：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`（Bedrock）
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手动压缩

在任何聊天中输入 `/compact` 可强制执行压缩。添加指令可引导摘要：

```text
/compact Focus on the API design decisions
```

当设置了 `agents.defaults.compaction.keepRecentTokens`（默认值：20,000）时，手动压缩会遵循该截断点，并在重建的上下文中保留最近的尾部内容。如果没有显式保留预算，手动压缩会表现为硬检查点，并仅从新摘要继续。

## 配置

在你的 `openclaw.json` 中通过 `agents.defaults.compaction` 配置压缩。下面列出最常用的旋钮；完整参考请见[会话管理深度解析](/zh-CN/reference/session-management-compaction)。

### 使用不同的模型

默认情况下，压缩使用智能体的主模型。设置 `agents.defaults.compaction.model` 可将摘要委派给更强或更专用的模型。该覆盖项接受 `provider/model-id` 字符串，或在 `agents.defaults.models` 下配置的裸别名：

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

裸配置别名会在压缩开始前解析为其规范提供商和模型。如果裸值同时匹配别名和已配置的字面模型 ID，则字面模型 ID 优先。未匹配的裸值会保留为活动提供商上的模型 ID。

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

未设置时，压缩会从活动会话模型开始。如果摘要因符合模型回退条件的提供商错误而失败，OpenClaw 会通过会话现有的模型回退链重试该次压缩尝试。回退选择是临时的，不会写回会话状态。显式的 `agents.defaults.compaction.model` 覆盖项保持精确，不会继承会话回退链。

### 标识符保留

压缩摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。可用 `identifierPolicy: "off"` 覆盖以禁用，或使用 `identifierPolicy: "custom"` 加 `identifierInstructions` 提供自定义指导。

### 活动转录记录字节护栏

设置 `agents.defaults.compaction.maxActiveTranscriptBytes` 后，如果活动 JSONL 达到该大小，OpenClaw 会在运行前触发普通本地压缩。这对长时间运行的会话很有用，因为提供商侧上下文管理可能让模型上下文保持健康，而本地转录记录仍持续增长。它不会分割原始 JSONL 字节；它会让普通压缩管线创建语义摘要。

<Warning>
字节护栏需要 `truncateAfterCompaction: true`。如果没有转录记录轮换，活动文件不会缩小，护栏会保持不活动。
</Warning>

### 后继转录记录

启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 不会就地重写现有转录记录。它会从压缩摘要、保留状态和未总结尾部创建新的活动后继转录记录，然后记录检查点元数据，将分支/恢复流程指向该压缩后的后继。
后继转录记录还会丢弃在短暂重试窗口内到达的完全重复长用户轮次，因此渠道重试风暴不会在压缩后被带入下一个活动转录记录。

OpenClaw 不再为新的压缩写入单独的 `.checkpoint.*.jsonl` 副本。现有旧版检查点文件在被引用时仍可使用，并会由普通会话清理进行修剪。

### 压缩通知

默认情况下，压缩会静默运行。设置 `notifyUser` 可在压缩开始和完成时显示简短状态消息，并在压缩前记忆刷新耗尽但回复仍继续时显示降级通知：

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

在压缩之前，OpenClaw 可以运行一次**静默记忆刷新**轮次，将持久笔记存储到磁盘。当这个内务处理轮次应使用本地模型而不是活动对话模型时，设置 `agents.defaults.compaction.memoryFlush.model`：

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

记忆刷新模型覆盖项是精确的，不会继承活动会话回退链。详情和配置请见[记忆](/zh-CN/concepts/memory)。

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩提供商。当某个提供商已注册并配置时，OpenClaw 会将摘要委派给它，而不是使用内置 LLM 管线。

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

设置 `provider` 会自动强制 `mode: "safeguard"`。提供商会收到与内置路径相同的压缩指令和标识符保留策略，并且 OpenClaw 仍会在提供商输出后保留最近轮次和分割轮次的后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要。
</Note>

## 压缩与修剪

|                  | 压缩                         | 修剪                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **作用**         | 总结较早的对话                | 裁剪旧工具结果                   |
| **是否保存？**   | 是（在会话转录记录中）        | 否（仅内存中，按请求）           |
| **范围**         | 整个对话                      | 仅工具结果                       |

[会话修剪](/zh-CN/concepts/session-pruning)是一种更轻量的补充方式，可在不总结的情况下裁剪工具输出。

## 故障排查

**压缩太频繁？** 模型的上下文窗口可能较小，或者工具输出可能很大。尝试启用[会话修剪](/zh-CN/concepts/session-pruning)。

**压缩后上下文感觉陈旧？** 使用 `/compact Focus on <topic>` 引导摘要，或启用[记忆刷新](/zh-CN/concepts/memory)，让笔记得以保留。

**需要一个干净起点？** `/new` 会启动一个全新会话，不执行压缩。

高级配置（保留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩）请见[会话管理深度解析](/zh-CN/reference/session-management-compaction)。

## 相关

- [会话](/zh-CN/concepts/session)：会话管理和生命周期。
- [会话修剪](/zh-CN/concepts/session-pruning)：裁剪工具结果。
- [上下文](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [Hooks](/zh-CN/automation/hooks)：压缩生命周期钩子（`before_compaction`、`after_compaction`）。
