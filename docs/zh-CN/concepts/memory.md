---
read_when:
    - 你想了解内存是如何工作的
    - 你想知道应该写入哪些内存文件
summary: OpenClaw 如何跨会话记住内容
title: 内存概览
x-i18n:
    generated_at: "2026-04-28T00:01:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31e5e76dfb53fa66fcfab1450cb56b5d9f8ed350391d6aecaf3a7e982567f0a2
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来跨会话记住内容。模型只会“记住”被保存到磁盘的内容——不存在隐藏状态。

## 工作原理

你的智能体有三个与内存相关的文件：

- **`MEMORY.md`** —— 长期记忆。持久的事实、偏好和决策。会在每次私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`** —— 每日笔记。持续更新的上下文和观察记录。今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（可选）—— 供人工审阅的梦境日志和 Dreaming 汇总摘要，包括基于事实的历史回填条目。

这些文件位于 Agent 工作区中（默认是 `~/.openclaw/workspace`）。

<Tip>
如果你希望智能体记住某件事，只需告诉它：“记住我更喜欢 TypeScript。” 它会将其写入合适的文件。
</Tip>

## 内存工具

智能体有两个用于处理内存的工具：

- **`memory_search`** —— 使用语义搜索查找相关笔记，即使措辞与原文不同也能找到。
- **`memory_get`** —— 读取特定的内存文件或行范围。

这两个工具都由当前激活的内存插件提供（默认：`memory-core`）。

## Memory Wiki 配套插件

如果你希望持久内存表现得更像一个被维护的知识库，而不只是原始笔记，可以使用内置的 `memory-wiki` 插件。

`memory-wiki` 会将持久知识编译为一个 wiki 资料库，具备以下特性：

- 确定性的页面结构
- 结构化的论断与证据
- 矛盾与新鲜度跟踪
- 生成的仪表板
- 面向智能体/运行时使用者的编译摘要
- wiki 原生工具，如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不会替代当前激活的内存插件。当前激活的内存插件仍然负责回忆、提升和 Dreaming。`memory-wiki` 则在其旁边增加了一层具有丰富来源追踪能力的知识层。

参见 [Memory Wiki](/zh-CN/plugins/memory-wiki)。

## 内存搜索

当配置了嵌入提供商后，`memory_search` 会使用**混合搜索**——将向量相似度（语义含义）与关键词匹配（如 ID 和代码符号等精确术语）结合起来。一旦你为任一受支持的提供商配置了 API 密钥，它就可以开箱即用。

<Info>
OpenClaw 会根据可用的 API 密钥自动检测你的嵌入提供商。如果你已配置 OpenAI、Gemini、Voyage 或 Mistral 的密钥，内存搜索会自动启用。
</Info>

有关搜索工作原理、调优选项和提供商设置的详细信息，请参见
[Memory Search](/zh-CN/concepts/memory-search)。

## 内存后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似度和混合搜索。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的侧车服务，支持重排序、查询扩展，以及为工作区外目录建立索引的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话内存，支持用户建模、语义搜索和多智能体感知。需安装插件。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-CN/plugins/memory-lancedb">
内置的基于 LanceDB 的内存，支持兼容 OpenAI 的嵌入、自动回忆、自动捕获，以及本地 Ollama 嵌入支持。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久内存编译为一个具有丰富来源追踪能力的 wiki 资料库，支持论断、仪表板、桥接模式以及对 Obsidian 友好的工作流。
</Card>
</CardGroup>

## 自动内存刷新

在 [compaction](/zh-CN/concepts/compaction) 总结你的对话之前，OpenClaw 会运行一个静默轮次，提醒智能体将重要上下文保存到内存文件中。此功能默认开启——你无需配置任何内容。

<Tip>
内存刷新可以防止在 compaction 期间丢失上下文。如果对话中存在尚未写入文件的重要事实，它们会在生成摘要之前被自动保存。
</Tip>

## Dreaming

Dreaming 是一项可选的内存后台整合流程。它会收集短期信号、为候选项评分，并仅将符合条件的内容提升到长期记忆（`MEMORY.md`）中。

它的设计目标是让长期记忆保持高信噪比：

- **选择加入**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的周期性 cron 作业。
- **阈值控制**：提升必须通过评分、回忆频率和查询多样性的门槛。
- **可审查**：阶段摘要和日志条目会写入 `DREAMS.md`，供人工审阅。

有关阶段行为、评分信号和梦境日志的详细信息，请参见
[Dreaming](/zh-CN/concepts/dreaming)。

## 基于事实的回填与实时提升

Dreaming 系统现在有两条紧密相关的审查路径：

- **实时 Dreaming** 基于 `memory/.dreams/` 下的短期 Dreaming 存储运行，这也是常规深度阶段在决定哪些内容可以升级到 `MEMORY.md` 时所使用的数据来源。
- **基于事实的回填** 会将历史 `memory/YYYY-MM-DD.md` 笔记作为独立的日文件读取，并将结构化的审查输出写入 `DREAMS.md`。

当你希望重放旧笔记，并检查系统认为哪些内容具有持久价值，而不需要手动编辑 `MEMORY.md` 时，基于事实的回填会很有帮助。

当你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

基于事实的持久候选项不会被直接提升。它们会被暂存到与常规深度阶段相同的短期 Dreaming 存储中。这意味着：

- `DREAMS.md` 仍然是供人工审阅的界面。
- 短期存储仍然是面向机器的排序界面。
- `MEMORY.md` 仍然只会通过深度提升写入。

如果你认为这次重放没有帮助，可以移除这些暂存产物，而不会影响普通日志条目或正常的回忆状态：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # 检查索引状态和提供商
openclaw memory search "query"  # 从命令行搜索
openclaw memory index --force   # 重建索引
```

## 延伸阅读

- [内置内存引擎](/zh-CN/concepts/memory-builtin)：默认的 SQLite 后端。
- [QMD 内存引擎](/zh-CN/concepts/memory-qmd)：高级本地优先侧车服务。
- [Honcho 内存](/zh-CN/concepts/memory-honcho)：AI 原生的跨会话内存。
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)：基于 LanceDB 的插件，支持兼容 OpenAI 的嵌入。
- [Memory Wiki](/zh-CN/plugins/memory-wiki)：编译式知识资料库和 wiki 原生工具。
- [内存搜索](/zh-CN/concepts/memory-search)：搜索流水线、提供商和调优。
- [Dreaming](/zh-CN/concepts/dreaming)：将短期回忆后台提升为长期记忆。
- [内存配置参考](/zh-CN/reference/memory-config)：所有配置项。
- [Compaction](/zh-CN/concepts/compaction)：compaction 如何与内存交互。

## 相关内容

- [主动内存](/zh-CN/concepts/active-memory)
- [内存搜索](/zh-CN/concepts/memory-search)
- [内置内存引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 内存](/zh-CN/concepts/memory-honcho)
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)
