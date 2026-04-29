---
read_when:
    - 你想了解记忆是如何工作的
    - 你想知道要写入哪些记忆文件
summary: OpenClaw 如何跨会话记住内容
title: 记忆概览
x-i18n:
    generated_at: "2026-04-29T21:36:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来记住内容。模型只会“记住”保存到磁盘的内容，没有隐藏状态。

## 工作原理

你的智能体有三个与记忆相关的文件：

- **`MEMORY.md`** — 长期记忆。持久的事实、偏好和决策。会在每个私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`** — 每日笔记。持续记录的上下文和观察。今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（可选）— Dream Diary 和 Dreaming 扫描摘要，供人工审阅，包括有依据的历史回填条目。

这些文件位于智能体工作区中（默认 `~/.openclaw/workspace`）。

<Tip>
如果你希望智能体记住某件事，直接告诉它即可：“记住我偏好 TypeScript。” 它会把内容写入适当的文件。
</Tip>

## 推断式跟进承诺

有些未来跟进并不是持久事实。如果你提到明天有一次面试，有用的记忆可能是“面试后跟进”，而不是“永久存入 `MEMORY.md`”。

[跟进承诺](/zh-CN/concepts/commitments) 是针对此类场景的可选、短期跟进记忆。OpenClaw 会在隐藏的后台步骤中推断它们，将其限定在同一个智能体和渠道内，并通过 Heartbeat 发送到期的跟进。明确的提醒仍然使用[定时任务](/zh-CN/automation/cron-jobs)。

## 记忆工具

智能体有两个用于处理记忆的工具：

- **`memory_search`** — 使用语义搜索查找相关笔记，即使措辞与原文不同也可以找到。
- **`memory_get`** — 读取特定的记忆文件或行范围。

这两个工具由主动记忆插件提供（默认：`memory-core`）。

## Memory Wiki 配套插件

如果你希望持久记忆表现得更像一个维护良好的知识库，而不只是原始笔记，可以使用内置的 `memory-wiki` 插件。

`memory-wiki` 会将持久知识编译成一个 wiki 库，包含：

- 确定性的页面结构
- 结构化声明和证据
- 矛盾与新鲜度跟踪
- 生成的仪表盘
- 面向智能体/运行时消费者的编译摘要
- wiki 原生工具，例如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不会替代主动记忆插件。主动记忆插件仍然负责回忆、提升和 Dreaming。`memory-wiki` 会在旁边添加一个富含来源信息的知识层。

参见 [Memory Wiki](/zh-CN/plugins/memory-wiki)。

## 记忆搜索

配置嵌入提供商后，`memory_search` 会使用**混合搜索**，将向量相似度（语义含义）与关键字匹配（ID 和代码符号等精确术语）结合起来。只要你拥有任意受支持提供商的 API key，它就可以开箱即用。

<Info>
OpenClaw 会根据可用的 API key 自动检测你的嵌入提供商。如果你配置了 OpenAI、Gemini、Voyage 或 Mistral key，记忆搜索会自动启用。
</Info>

有关搜索工作方式、调优选项和提供商设置的详细信息，请参见[记忆搜索](/zh-CN/concepts/memory-search)。

## 记忆后端

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。通过关键字搜索、向量相似度和混合搜索开箱即用。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，以及索引工作区之外目录的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话记忆，支持用户建模、语义搜索和多智能体感知。插件安装。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-CN/plugins/memory-lancedb">
内置的 LanceDB 支持记忆，包含 OpenAI 兼容嵌入、自动回忆、自动捕获和本地 Ollama 嵌入支持。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久记忆编译成富含来源信息的 wiki 库，包含声明、仪表盘、桥接模式和适合 Obsidian 的工作流。
</Card>
</CardGroup>

## 自动记忆刷新

在[压缩](/zh-CN/concepts/compaction)总结你的对话之前，OpenClaw 会运行一个静默回合，提醒智能体把重要上下文保存到记忆文件中。此功能默认开启，你无需配置任何内容。

若要让这个整理回合使用本地模型，请设置一个精确的记忆刷新模型覆盖：

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

该覆盖仅应用于记忆刷新回合，并且不会继承当前会话的回退链。

<Tip>
记忆刷新可防止压缩期间的上下文丢失。如果你的智能体在对话中有尚未写入文件的重要事实，它们会在生成摘要之前自动保存。
</Tip>

## Dreaming

Dreaming 是一个可选的后台记忆整合步骤。它会收集短期信号、为候选项评分，并且只将符合条件的项目提升到长期记忆（`MEMORY.md`）。

它的设计目标是让长期记忆保持高信噪比：

- **可选启用**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的周期性 cron job。
- **设有阈值**：提升必须通过分数、回忆频率和查询多样性门槛。
- **可审阅**：阶段摘要和日记条目会写入 `DREAMS.md`，供人工审阅。

有关阶段行为、评分信号和 Dream Diary 详情，请参见 [Dreaming](/zh-CN/concepts/dreaming)。

## 有依据的回填和实时提升

Dreaming 系统现在有两个密切相关的审阅通道：

- **实时 Dreaming** 使用 `memory/.dreams/` 下的短期 Dreaming 存储，这是普通深度阶段在决定哪些内容可以进入 `MEMORY.md` 时使用的内容。
- **有依据的回填** 将历史 `memory/YYYY-MM-DD.md` 笔记作为独立的每日文件读取，并将结构化审阅输出写入 `DREAMS.md`。

当你想重放较旧的笔记，并在不手动编辑 `MEMORY.md` 的情况下检查系统认为哪些内容是持久的，有依据的回填会很有用。

当你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有依据的持久候选项不会被直接提升。它们会暂存到普通深度阶段已经使用的同一个短期 Dreaming 存储中。这意味着：

- `DREAMS.md` 仍然是人工审阅界面。
- 短期存储仍然是面向机器的排序界面。
- `MEMORY.md` 仍然只由深度提升写入。

如果你认为这次重放没有帮助，可以移除暂存的产物，而不影响普通日记条目或正常回忆状态：

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

## 延伸阅读

- [内置记忆引擎](/zh-CN/concepts/memory-builtin)：默认 SQLite 后端。
- [QMD 记忆引擎](/zh-CN/concepts/memory-qmd)：高级的本地优先 sidecar。
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)：AI 原生的跨会话记忆。
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)：基于 LanceDB 的插件，支持 OpenAI 兼容嵌入。
- [Memory Wiki](/zh-CN/plugins/memory-wiki)：编译后的知识库和 wiki 原生工具。
- [记忆搜索](/zh-CN/concepts/memory-search)：搜索流水线、提供商和调优。
- [Dreaming](/zh-CN/concepts/dreaming)：从短期回忆到长期记忆的后台提升。
- [记忆配置参考](/zh-CN/reference/memory-config)：所有配置开关。
- [压缩](/zh-CN/concepts/compaction)：压缩如何与记忆交互。

## 相关内容

- [主动记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)
- [跟进承诺](/zh-CN/concepts/commitments)
