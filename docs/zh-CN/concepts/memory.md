---
read_when:
    - 你想了解 memory 是如何工作的
    - 你想知道应该写入哪些 memory 文件
summary: OpenClaw 如何跨会话记住内容
title: Memory 概览
x-i18n:
    generated_at: "2026-04-05T08:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Memory 概览

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来记住内容。模型只会“记住”被保存到磁盘上的内容——不存在隐藏状态。

## 工作原理

你的智能体有两个地方可以存储记忆：

- **`MEMORY.md`**——长期记忆。持久保存的事实、偏好和
  决策。会在每次私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`**——每日笔记。运行中的上下文和观察记录。
  今天和昨天的笔记会被自动加载。

这些文件位于智能体工作区中（默认是 `~/.openclaw/workspace`）。

<Tip>
如果你希望你的智能体记住某件事，只需直接告诉它：“记住我更喜欢 TypeScript。” 它会将内容写入合适的文件。
</Tip>

## Memory 工具

智能体有两个用于处理 memory 的工具：

- **`memory_search`**——使用语义搜索查找相关笔记，即使
  用词与原文不同也可以找到。
- **`memory_get`**——读取某个特定的 memory 文件或行范围。

这两个工具都由当前启用的 memory 插件提供（默认：`memory-core`）。

## Memory 搜索

当配置了嵌入提供商时，`memory_search` 会使用**混合搜索**——结合向量相似度（语义含义）与关键词匹配
（如 ID 和代码符号等精确术语）。只要你为任一受支持的提供商配置了 API key，它就能开箱即用。

<Info>
OpenClaw 会根据可用的 API key 自动检测你的嵌入提供商。如果你已配置 OpenAI、Gemini、Voyage 或 Mistral 的 key，memory 搜索会自动启用。
</Info>

有关搜索工作原理、调优选项和提供商设置的详细信息，请参阅
[Memory Search](/concepts/memory-search)。

## Memory 后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似度和混合搜索。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，以及为工作区之外的目录建立索引。
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
AI 原生的跨会话 memory，支持用户建模、语义搜索和
多智能体感知。通过插件安装。
</Card>
</CardGroup>

## 自动 memory 刷新

在 [Compaction](/concepts/compaction) 总结你的对话之前，OpenClaw
会运行一个静默回合，提醒智能体将重要上下文保存到 memory
文件中。此功能默认开启——你无需进行任何配置。

<Tip>
memory 刷新可防止在 Compaction 期间丢失上下文。如果你的智能体在对话中有重要事实尚未写入文件，它们会在摘要发生前自动保存。
</Tip>

## Dreaming（实验性）

Dreaming 是 memory 的一个可选后台整合流程。它会重新审视来自每日文件（`memory/YYYY-MM-DD.md`）的短期召回内容，对其评分，并只将符合条件的条目提升到长期记忆（`MEMORY.md`）中。

它的设计目标是让长期记忆保持高信噪比：

- **选择加入**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理周期性任务。
- **阈值控制**：提升必须通过分数、召回频率和查询
  多样性门槛。

有关模式行为（`off`、`core`、`rem`、`deep`）、评分信号和调优旋钮，请参阅 [Dreaming（实验性）](/concepts/memory-dreaming)。

## CLI

```bash
openclaw memory status          # 检查索引状态和提供商
openclaw memory search "query"  # 从命令行搜索
openclaw memory index --force   # 重建索引
```

## 延伸阅读

- [Builtin Memory Engine](/concepts/memory-builtin) —— 默认的 SQLite 后端
- [QMD Memory Engine](/concepts/memory-qmd) —— 高级本地优先 sidecar
- [Honcho Memory](/concepts/memory-honcho) —— AI 原生的跨会话 memory
- [Memory Search](/concepts/memory-search) —— 搜索管线、提供商和
  调优
- [Dreaming（实验性）](/concepts/memory-dreaming) —— 从短期召回到长期记忆的后台提升
- [Memory 配置参考](/reference/memory-config) —— 所有配置项
- [Compaction](/concepts/compaction) —— Compaction 如何与 memory 交互
