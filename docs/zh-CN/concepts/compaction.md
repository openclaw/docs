---
read_when:
    - 你想了解自动压缩和 /compact
    - 你正在调试因达到上下文限制而出现问题的长会话
summary: OpenClaw 如何总结长对话以保持在模型限制范围内
title: 压缩
x-i18n:
    generated_at: "2026-07-12T14:23:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

每个模型都有一个上下文窗口：即它能够处理的最大 token 数量。当对话接近该限制时，OpenClaw 会将较早的消息**压缩**为摘要，以便聊天可以继续。

## 工作原理

1. 较早的对话轮次会被总结为一条紧凑记录。
2. 摘要会保存在会话转录中。
3. 最近的消息会保持原样。

OpenClaw 选择压缩分割点时，会将助手工具调用与其对应的 `toolResult` 条目保持配对。如果分割点落在工具块内部，OpenClaw 会移动边界，使两者保持在一起，并保留当前未总结的尾部内容。

完整的对话历史记录仍保存在磁盘上。压缩只会改变模型在下一轮中看到的内容。

<Note>
新配置默认将 `agents.defaults.compaction.mode` 设为 `"safeguard"`（更严格的防护措施和摘要质量审核）。若要退出，请显式设置 `mode: "default"`。
</Note>

## 自动压缩

自动压缩默认启用。它会在会话接近上下文限制时运行，或在模型返回上下文溢出错误时运行（在这种情况下，OpenClaw 会执行压缩并重试）。

你会看到：

- 普通 Gateway 网关日志中的 `embedded run auto-compaction start` / `complete`。
- 详细模式中的 `🧹 Auto-compaction complete`。
- `/status` 显示 `🧹 Compactions: <count>`。

<Info>
压缩之前，OpenClaw 会自动提醒智能体将重要笔记保存到[记忆](/zh-CN/concepts/memory)文件中，以防止上下文丢失。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw 可识别的溢出错误模式">
    OpenClaw 会匹配数十种提供商特有的溢出错误字符串（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter 等）。常见示例：

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`（Bedrock）
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手动压缩

在任意聊天中输入 `/compact` 可强制执行压缩。可以添加指令来引导摘要：

```text
/compact 重点关注 API 设计决策
```

设置 `agents.defaults.compaction.keepRecentTokens` 后（默认值：20,000），手动压缩会遵循该分割点，并在重建的上下文中保留最近的尾部内容。若没有显式的保留预算，手动压缩会作为硬检查点运行，并仅从新摘要继续。

## 配置

在 `openclaw.json` 的 `agents.defaults.compaction` 下配置压缩。下面列出了最常用的选项；完整参考请参阅[会话管理深入解析](/zh-CN/reference/session-management-compaction)。

### 使用其他模型

默认情况下，压缩使用智能体的主模型。设置 `agents.defaults.compaction.model` 可将摘要任务委托给功能更强或更专业的模型。此覆盖项接受 `provider/model-id` 字符串，或在 `agents.defaults.models` 下配置的裸别名：

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

配置的裸别名会在压缩开始前解析为其规范提供商和模型。如果一个裸值同时匹配别名和已配置的字面模型 ID，则字面模型 ID 优先。未匹配的裸值会保留为当前提供商上的模型 ID。

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

未设置时，压缩会从当前会话模型开始。如果摘要因符合模型回退条件的提供商错误而失败，OpenClaw 会通过会话现有的模型回退链重试该次压缩。回退选择是临时的，不会写回会话状态。显式的 `agents.defaults.compaction.model` 覆盖项保持精确匹配，不会继承会话回退链。

### 标识符保留

压缩摘要默认保留不透明标识符（`identifierPolicy: "strict"`）。可使用 `identifierPolicy: "off"` 禁用，或使用 `identifierPolicy: "custom"` 加上 `identifierInstructions` 提供自定义指导。

### 活动转录字节防护

设置 `agents.defaults.compaction.maxActiveTranscriptBytes` 后，如果转录历史记录达到该大小，OpenClaw
会在运行前触发常规本地压缩。这适用于长时间运行的会话：提供商侧上下文
管理可能会使模型上下文保持健康，但持久化的转录历史记录仍在
持续增长。它不会直接分割原始字节，而是要求常规压缩
管线创建语义摘要。

<Warning>
字节防护适用于活动 SQLite 转录历史记录。旧版 JSONL
检查点工件不是活动压缩目标。
</Warning>

### 后继转录

启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 不会就地重写现有转录。它会根据压缩摘要、保留的状态和未总结的尾部内容创建新的活动后继转录，然后记录检查点元数据，使分支/恢复流程指向该压缩后的后继转录。
后继转录还会丢弃在短暂重试窗口内
收到的完全重复的长用户轮次，因此渠道重试风暴不会在压缩后被带入
下一个活动转录。

OpenClaw 不再为新的压缩写入单独的 `.checkpoint.*.jsonl`
副本。现有旧版检查点文件在仍被引用时可以继续使用，
并由常规会话清理进行修剪。

### 压缩通知

默认情况下，压缩会静默运行。设置 `notifyUser` 可在压缩开始和完成时显示简短的状态消息；如果压缩前的记忆刷新已耗尽但回复仍会继续，还会显示降级通知：

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

压缩之前，OpenClaw 可以运行一轮**静默记忆刷新**，将持久笔记存储到磁盘。若要让此维护轮次使用本地模型，而不是当前对话模型，请设置 `agents.defaults.compaction.memoryFlush.model`：

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

记忆刷新模型覆盖项保持精确匹配，不会继承当前会话回退链。有关详细信息和配置，请参阅[记忆](/zh-CN/concepts/memory)。

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册自定义压缩提供商。注册并配置提供商后，OpenClaw 会将摘要任务委托给它，而不是使用内置 LLM 管线。

要使用已注册的提供商，请在配置中设置其 ID：

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

设置 `provider` 会自动强制使用 `mode: "safeguard"`。提供商会收到与内置路径相同的压缩指令和标识符保留策略，并且 OpenClaw 仍会在提供商输出之后保留最近轮次和分割轮次的后缀上下文。

<Note>
如果提供商失败或返回空结果，OpenClaw 会回退到内置 LLM 摘要。
</Note>

## 压缩与修剪的对比

|                  | 压缩                          | 修剪                               |
| ---------------- | ----------------------------- | ---------------------------------- |
| **作用**         | 总结较早的对话                | 修剪旧工具结果                     |
| **是否保存？**   | 是（保存在会话转录中）        | 否（仅在内存中，按请求执行）       |
| **范围**         | 整个对话                      | 仅工具结果                         |

[会话修剪](/zh-CN/concepts/session-pruning)是一种更轻量的补充方式，它可以在不进行摘要的情况下修剪工具输出。

## 故障排除

**压缩过于频繁？** 模型的上下文窗口可能较小，或工具输出可能过大。请尝试启用[会话修剪](/zh-CN/concepts/session-pruning)。

**压缩后上下文感觉陈旧？** 使用 `/compact Focus on <topic>` 引导摘要，或启用[记忆刷新](/zh-CN/concepts/memory)以保留笔记。

**需要从头开始？** `/new` 会启动一个新会话，而不进行压缩。

有关高级配置（预留 token、标识符保留、自定义上下文引擎、OpenAI 服务端压缩），请参阅[会话管理深入解析](/zh-CN/reference/session-management-compaction)。

## 相关内容

- [会话](/zh-CN/concepts/session)：会话管理和生命周期。
- [会话修剪](/zh-CN/concepts/session-pruning)：修剪工具结果。
- [上下文](/zh-CN/concepts/context)：如何为智能体轮次构建上下文。
- [Hooks](/zh-CN/automation/hooks)：压缩生命周期钩子（`before_compaction`、`after_compaction`）。
