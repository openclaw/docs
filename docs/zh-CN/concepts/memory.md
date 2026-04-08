---
read_when:
    - 你想了解 memory 的工作方式
    - 你想知道应该写入哪些 memory 文件
summary: OpenClaw 如何跨会话记住信息
title: Memory 概览
x-i18n:
    generated_at: "2026-04-08T21:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe47910f5bf1c44be379e971c605f1cb3a29befcf2a7ee11fb3833cbe3b9059
    source_path: concepts/memory.md
    workflow: 15
---

# Memory 概览

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来记住信息。模型只会“记住”保存到磁盘上的内容——不存在隐藏状态。

## 工作原理

你的智能体有三个与 memory 相关的文件：

- **`MEMORY.md`** —— 长期记忆。保存持久事实、偏好和决策。会在每个私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`** —— 每日笔记。保存持续积累的上下文和观察内容。今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（实验性，可选）—— Dream Diary 和 dreaming sweep 摘要，供人工审查，其中包含有依据的历史回填条目。

这些文件位于智能体工作区中（默认是 `~/.openclaw/workspace`）。

<Tip>
如果你希望你的智能体记住某件事，直接告诉它即可：“记住我更喜欢 TypeScript。” 它会将内容写入相应的文件。
</Tip>

## Memory 工具

智能体有两个用于处理 memory 的工具：

- **`memory_search`** —— 使用语义搜索查找相关笔记，即使措辞与原文不同也可以找到。
- **`memory_get`** —— 读取指定的 memory 文件或行范围。

这两个工具都由当前激活的 memory 插件提供（默认：`memory-core`）。

## Memory Wiki 配套插件

如果你希望持久记忆的行为更像是一个持续维护的知识库，而不只是原始笔记，可以使用内置的 `memory-wiki` 插件。

`memory-wiki` 会将持久知识编译到一个 wiki 资料库中，包含：

- 确定性的页面结构
- 结构化的主张与证据
- 矛盾与时效性跟踪
- 自动生成的仪表板
- 面向智能体/运行时消费者的编译摘要
- wiki 原生工具，如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不会替代当前激活的 memory 插件。当前激活的 memory 插件仍然负责回忆、提升和 dreaming。`memory-wiki` 则在其旁边增加了一层带有丰富来源信息的知识层。

参见 [Memory Wiki](/zh-CN/plugins/memory-wiki)。

## Memory 搜索

配置 embedding 提供商后，`memory_search` 会使用**混合搜索**——将向量相似度（语义含义）与关键词匹配（如 ID 和代码符号等精确术语）结合起来。一旦你为任意受支持的提供商配置了 API key，它即可开箱即用。

<Info>
OpenClaw 会根据可用的 API key 自动检测你的 embedding 提供商。如果你已配置 OpenAI、Gemini、Voyage 或 Mistral key，memory 搜索会自动启用。
</Info>

有关搜索工作原理、调优选项和提供商设置的详细信息，请参见
[Memory Search](/zh-CN/concepts/memory-search)。

## Memory 后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似度和混合搜索。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
local-first sidecar，支持重排序、查询扩展，以及为工作区外部目录建立索引的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话 memory，支持用户建模、语义搜索和多智能体感知。需安装插件。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久记忆编译为一个带有丰富来源信息的 wiki 资料库，包含主张、仪表板、桥接模式以及对 Obsidian 友好的工作流。
</Card>
</CardGroup>

## 自动 memory 刷新

在 [compaction](/zh-CN/concepts/compaction) 总结你的对话之前，OpenClaw 会运行一个静默回合，提醒智能体将重要上下文保存到 memory 文件中。此功能默认开启——你无需配置任何内容。

<Tip>
memory 刷新可以防止在 compaction 期间丢失上下文。如果你的智能体在对话中有重要事实尚未写入文件，它们会在摘要发生前自动保存。
</Tip>

## Dreaming（实验性）

Dreaming 是一项可选的 memory 后台整合流程。它会收集短期信号、对候选项进行评分，并仅将符合条件的内容提升到长期记忆（`MEMORY.md`）中。

它的设计目标是让长期记忆保持高信噪比：

- **选择启用**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理一个周期性 cron 任务，用于执行完整的 dreaming sweep。
- **阈值筛选**：提升必须通过分数、回忆频率和查询多样性这几道门槛。
- **可审查**：阶段摘要和 diary 条目会写入 `DREAMS.md`，供人工审查。

有关阶段行为、评分信号和 Dream Diary 详情，请参见
[Dreaming（实验性）](/zh-CN/concepts/dreaming)。

## 有依据的回填与实时提升

dreaming 系统现在有两条紧密相关的审查路径：

- **实时 dreaming** 会基于 `memory/.dreams/` 下的短期 dreaming 存储运行，这也是常规深度阶段在判断哪些内容可以升级到 `MEMORY.md` 时使用的数据来源。
- **有依据的回填** 会将历史 `memory/YYYY-MM-DD.md` 笔记作为独立的每日文件读取，并将结构化审查输出写入 `DREAMS.md`。

当你希望重放较旧的笔记，并检查系统认为哪些内容具有持久价值，而又不想手动编辑 `MEMORY.md` 时，有依据的回填会很有用。

当你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有依据的持久候选项不会被直接提升。它们会被暂存到常规深度阶段已经在使用的同一个短期 dreaming 存储中。这意味着：

- `DREAMS.md` 仍然是人工审查界面。
- 短期存储仍然是面向机器的排序界面。
- `MEMORY.md` 仍然只会由深度提升流程写入。

如果你认为这次重放没有帮助，可以删除这些暂存产物，而不影响普通 diary 条目或正常的 recall 状态：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # 检查索引状态和提供商
openclaw memory search "query"  # 从命令行执行搜索
openclaw memory index --force   # 重建索引
```

## 延伸阅读

- [Builtin Memory Engine](/zh-CN/concepts/memory-builtin) —— 默认 SQLite 后端
- [QMD Memory Engine](/zh-CN/concepts/memory-qmd) —— 高级 local-first sidecar
- [Honcho Memory](/zh-CN/concepts/memory-honcho) —— AI 原生跨会话 memory
- [Memory Wiki](/zh-CN/plugins/memory-wiki) —— 编译后的知识资料库和 wiki 原生工具
- [Memory Search](/zh-CN/concepts/memory-search) —— 搜索流水线、提供商和调优
- [Dreaming（实验性）](/zh-CN/concepts/dreaming) —— 将短期回忆后台提升到长期记忆
- [Memory configuration reference](/zh-CN/reference/memory-config) —— 所有配置项
- [Compaction](/zh-CN/concepts/compaction) —— compaction 如何与 memory 交互
