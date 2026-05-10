---
read_when:
    - 你想了解记忆的工作原理
    - 你想知道要写入哪些记忆文件
summary: OpenClaw 如何跨会话记住信息
title: 记忆概览
x-i18n:
    generated_at: "2026-05-10T19:30:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来记住内容。模型只会“记住”保存到磁盘的内容，没有隐藏状态。

## 工作原理

你的智能体有三个与记忆相关的文件：

- **`MEMORY.md`** — 长期记忆。持久事实、偏好和决策。会在每个私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`** — 每日笔记。持续上下文和观察记录。今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（可选）— Dream Diary 和 Dreaming 扫描摘要，供人工审阅，包括有依据的历史回填条目。

这些文件位于智能体工作区（默认 `~/.openclaw/workspace`）。

## 内容放在哪里

`MEMORY.md` 是紧凑、经过整理的层。用于存放持久事实、偏好、长期决策，以及应在主私密会话开始时可用的简短摘要。它不是原始记录、每日日志或详尽归档。

`memory/YYYY-MM-DD.md` 文件是工作层。用于存放详细的每日笔记、观察记录、会话摘要，以及以后可能仍有用的原始上下文。这些文件会被索引用于 `memory_search` 和 `memory_get`，但不会在每一轮都注入到常规启动提示中。

随着时间推移，智能体应从每日笔记中提炼有用材料写入 `MEMORY.md`，并移除过时的长期条目。生成的工作区说明和 Heartbeat 流程可以定期完成这件事；你不需要为了每个记住的细节手动编辑 `MEMORY.md`。

如果 `MEMORY.md` 超过启动文件预算，OpenClaw 会保持磁盘上的文件完整，但会截断注入到模型上下文中的副本。把这视为一个信号：将详细材料移回 `memory/*.md`，只在 `MEMORY.md` 中保留持久摘要，或者在你明确想花费更多提示预算时提高启动限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 查看原始大小与注入大小，以及截断状态。

<Tip>
如果你想让智能体记住某件事，直接告诉它即可：“记住我偏好 TypeScript。” 它会把内容写入适当的文件。
</Tip>

## 推断式跟进承诺

有些未来跟进不是持久事实。如果你提到明天有面试，有用的记忆可能是“面试后跟进一下”，而不是“永久存进 `MEMORY.md`”。

[跟进承诺](/zh-CN/concepts/commitments) 是针对这种情况的选择启用、短期跟进记忆。OpenClaw 会在隐藏的后台流程中推断它们，将它们限定到同一个智能体和渠道，并通过 Heartbeat 发送到期的跟进。显式提醒仍使用[定时任务](/zh-CN/automation/cron-jobs)。

## 记忆工具

智能体有两个用于处理记忆的工具：

- **`memory_search`** — 使用语义搜索查找相关笔记，即使用词与原文不同也可以。
- **`memory_get`** — 读取特定记忆文件或行范围。

这两个工具都由主动记忆插件提供（默认：`memory-core`）。

## Memory Wiki 配套插件

如果你希望持久记忆更像一个维护良好的知识库，而不只是原始笔记，请使用内置的 `memory-wiki` 插件。

`memory-wiki` 会将持久知识编译为 wiki 资料库，并提供：

- 确定性的页面结构
- 结构化声明和证据
- 矛盾和新鲜度跟踪
- 生成的仪表盘
- 供智能体/运行时消费者使用的编译摘要
- wiki 原生工具，例如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不会替代主动记忆插件。主动记忆插件仍然负责召回、提升和 Dreaming。`memory-wiki` 会在旁边添加一个富含来源信息的知识层。

参见 [Memory Wiki](/zh-CN/plugins/memory-wiki)。

## 记忆搜索

配置嵌入提供商后，`memory_search` 会使用**混合搜索**，将向量相似度（语义含义）与关键词匹配（ID 和代码符号等精确术语）结合起来。只要你拥有任意受支持提供商的 API key，它就可以开箱即用。

<Info>
OpenClaw 会根据可用 API key 自动检测你的嵌入提供商。如果你配置了 OpenAI、Gemini、Voyage 或 Mistral key，记忆搜索会自动启用。
</Info>

有关搜索工作原理、调优选项和提供商设置的详细信息，请参见[记忆搜索](/zh-CN/concepts/memory-search)。

## 记忆后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似度和混合搜索。不需要额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，以及索引工作区外目录的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话记忆，支持用户建模、语义搜索和多智能体感知。通过插件安装。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-CN/plugins/memory-lancedb">
内置的 LanceDB 支持记忆，包含 OpenAI 兼容嵌入、自动召回、自动捕获和本地 Ollama 嵌入支持。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久记忆编译为富含来源信息的 wiki 资料库，包含声明、仪表盘、桥接模式和对 Obsidian 友好的工作流。
</Card>
</CardGroup>

## 自动记忆刷新

在[压缩](/zh-CN/concepts/compaction)总结你的对话之前，OpenClaw 会运行一个静默轮次，提醒智能体将重要上下文保存到记忆文件。默认启用，你不需要配置任何内容。

要让这个整理轮次使用本地模型，请设置精确的记忆刷新模型覆盖：

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

该覆盖仅应用于记忆刷新轮次，不会继承活动会话的回退链。

<Tip>
记忆刷新会防止压缩期间上下文丢失。如果你的智能体在对话中有尚未写入文件的重要事实，它们会在摘要生成前自动保存。
</Tip>

## Dreaming

Dreaming 是记忆的可选后台整合流程。它会收集短期信号、为候选项评分，并且只将符合条件的项目提升到长期记忆（`MEMORY.md`）。

它旨在让长期记忆保持高信号：

- **选择启用**：默认禁用。
- **定时**：启用后，`memory-core` 会自动管理一个用于完整 Dreaming 扫描的定期 cron 任务。
- **阈值控制**：提升必须通过分数、召回频率和查询多样性门槛。
- **可审阅**：阶段摘要和日记条目会写入 `DREAMS.md`，供人工审阅。

有关阶段行为、评分信号和 Dream Diary 详细信息，请参见 [Dreaming](/zh-CN/concepts/dreaming)。

## 有依据的回填和实时提升

Dreaming 系统现在有两个紧密相关的审阅通道：

- **实时 Dreaming** 使用 `memory/.dreams/` 下的短期 Dreaming 存储，这也是常规深度阶段在决定哪些内容可以晋升到 `MEMORY.md` 时使用的内容。
- **有依据的回填** 会将历史 `memory/YYYY-MM-DD.md` 笔记作为独立日文件读取，并将结构化审阅输出写入 `DREAMS.md`。

当你想重放旧笔记并检查系统认为哪些内容是持久内容，而又不想手动编辑 `MEMORY.md` 时，有依据的回填很有用。

当你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有依据的持久候选项不会被直接提升。它们会被暂存到常规深度阶段已经使用的同一个短期 Dreaming 存储中。这意味着：

- `DREAMS.md` 保持为人工审阅界面。
- 短期存储保持为面向机器的排序界面。
- `MEMORY.md` 仍然只由深度提升写入。

如果你认为这次重放没有用，可以移除暂存的产物，而不触及普通日记条目或常规召回状态：

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
- [QMD 记忆引擎](/zh-CN/concepts/memory-qmd)：高级本地优先 sidecar。
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)：AI 原生的跨会话记忆。
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)：由 LanceDB 支持的插件，包含 OpenAI 兼容嵌入。
- [Memory Wiki](/zh-CN/plugins/memory-wiki)：编译知识资料库和 wiki 原生工具。
- [记忆搜索](/zh-CN/concepts/memory-search)：搜索流水线、提供商和调优。
- [Dreaming](/zh-CN/concepts/dreaming)：从短期召回到长期记忆的后台提升。
- [记忆配置参考](/zh-CN/reference/memory-config)：所有配置开关。
- [压缩](/zh-CN/concepts/compaction)：压缩如何与记忆交互。

## 相关

- [主动记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)
- [跟进承诺](/zh-CN/concepts/commitments)
