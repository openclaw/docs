---
read_when:
    - 你想了解记忆的工作原理
    - 你想知道要写入哪些记忆文件
summary: OpenClaw 如何跨会话记住信息
title: 记忆概览
x-i18n:
    generated_at: "2026-04-28T11:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5495270d96c72de525ff3d285b122eb2b86137c741e3042f067b7adc55eb51f0
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来记住内容。模型只会“记住”保存到磁盘的内容，没有隐藏状态。

## 工作原理

你的智能体有三个与记忆相关的文件：

- **`MEMORY.md`** — 长期记忆。持久化事实、偏好和决策。会在每个私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`** — 每日笔记。持续记录的上下文和观察。今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（可选）— Dream Diary 和 Dreaming 扫描摘要，供人工审阅，包括有依据的历史回填条目。

这些文件位于智能体工作区中（默认 `~/.openclaw/workspace`）。

<Tip>
如果你希望智能体记住某件事，直接告诉它：“记住我偏好 TypeScript。”它会把内容写入合适的文件。
</Tip>

## 记忆工具

智能体有两个用于处理记忆的工具：

- **`memory_search`** — 使用语义搜索查找相关笔记，即使用词与原文不同也可以找到。
- **`memory_get`** — 读取指定的记忆文件或行范围。

这两个工具都由当前启用的记忆插件提供（默认：`memory-core`）。

## Memory Wiki 配套插件

如果你希望持久记忆更像一个维护良好的知识库，而不只是原始笔记，请使用内置的 `memory-wiki` 插件。

`memory-wiki` 会把持久知识编译成一个 wiki 知识库，具备：

- 确定性的页面结构
- 结构化声明和证据
- 矛盾和新鲜度跟踪
- 生成的仪表板
- 面向智能体/运行时消费者的编译摘要
- wiki 原生工具，例如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不会替代当前启用的记忆插件。当前启用的记忆插件仍然负责回忆、提升和 Dreaming。`memory-wiki` 会在旁边添加一个富含出处信息的知识层。

参见 [Memory Wiki](/zh-CN/plugins/memory-wiki)。

## 记忆搜索

配置嵌入提供商后，`memory_search` 会使用**混合搜索**：将向量相似度（语义含义）与关键词匹配（ID 和代码符号等精确术语）结合起来。只要你拥有任一受支持提供商的 API 密钥，它就可以开箱即用。

<Info>
OpenClaw 会根据可用的 API 密钥自动检测你的嵌入提供商。如果你已经配置 OpenAI、Gemini、Voyage 或 Mistral 密钥，记忆搜索会自动启用。
</Info>

有关搜索的工作方式、调优选项和提供商设置的详细信息，请参见 [Memory Search](/zh-CN/concepts/memory-search)。

## 记忆后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。支持关键词搜索、向量相似度和混合搜索，开箱即用。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，以及索引工作区之外的目录。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话记忆，具备用户建模、语义搜索和多智能体感知能力。通过插件安装。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-CN/plugins/memory-lancedb">
内置的 LanceDB 后端记忆，支持 OpenAI 兼容嵌入、自动回忆、自动捕获和本地 Ollama 嵌入。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久记忆编译成富含出处信息的 wiki 知识库，包含声明、仪表板、桥接模式，以及对 Obsidian 友好的工作流。
</Card>
</CardGroup>

## 自动记忆刷新

在 [compaction](/zh-CN/concepts/compaction) 汇总你的对话之前，OpenClaw 会运行一个静默回合，提醒智能体把重要上下文保存到记忆文件中。该功能默认开启，你无需配置任何内容。

要让这个维护回合使用本地模型，请设置一个精确的记忆刷新模型覆盖：

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

该覆盖仅适用于记忆刷新回合，不会继承当前会话的 fallback 链。

<Tip>
记忆刷新可防止 compaction 期间上下文丢失。如果你的智能体在对话中有尚未写入文件的重要事实，它们会在生成摘要前自动保存。
</Tip>

## Dreaming

Dreaming 是可选的后台记忆整合过程。它会收集短期信号、为候选项评分，并且只将符合条件的条目提升到长期记忆（`MEMORY.md`）。

它旨在让长期记忆保持高信号密度：

- **选择启用**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理一个周期性 cron 任务，用于完整的 Dreaming 扫描。
- **阈值控制**：提升必须通过评分、回忆频率和查询多样性门槛。
- **可审阅**：阶段摘要和日记条目会写入 `DREAMS.md`，供人工审阅。

有关阶段行为、评分信号和 Dream Diary 详细信息，请参见 [Dreaming](/zh-CN/concepts/dreaming)。

## 有依据的回填和实时提升

Dreaming 系统现在有两个密切相关的审阅通道：

- **实时 Dreaming** 使用 `memory/.dreams/` 下的短期 Dreaming 存储；普通深度阶段在判断哪些内容可以进入 `MEMORY.md` 时使用的就是它。
- **有依据的回填** 将历史 `memory/YYYY-MM-DD.md` 笔记作为独立的每日文件读取，并将结构化审阅输出写入 `DREAMS.md`。

当你想重放较早的笔记，并检查系统认为哪些内容具有持久价值，而无需手动编辑 `MEMORY.md` 时，有依据的回填很有用。

当你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有依据的持久候选项不会被直接提升。它们会暂存到普通深度阶段已经使用的同一个短期 Dreaming 存储中。这意味着：

- `DREAMS.md` 仍然是人工审阅界面。
- 短期存储仍然是面向机器的排序界面。
- `MEMORY.md` 仍然只由深度提升写入。

如果你认为这次重放没有用，可以移除暂存的产物，而不影响普通日记条目或正常回忆状态：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## 相关阅读

- [内置记忆引擎](/zh-CN/concepts/memory-builtin)：默认 SQLite 后端。
- [QMD 记忆引擎](/zh-CN/concepts/memory-qmd)：高级本地优先 sidecar。
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)：AI 原生跨会话记忆。
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)：基于 LanceDB 的插件，支持 OpenAI 兼容嵌入。
- [Memory Wiki](/zh-CN/plugins/memory-wiki)：编译后的知识库和 wiki 原生工具。
- [记忆搜索](/zh-CN/concepts/memory-search)：搜索流水线、提供商和调优。
- [Dreaming](/zh-CN/concepts/dreaming)：从短期回忆到长期记忆的后台提升。
- [记忆配置参考](/zh-CN/reference/memory-config)：所有配置开关。
- [Compaction](/zh-CN/concepts/compaction)：compaction 如何与记忆交互。

## 相关内容

- [主动记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)
