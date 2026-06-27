---
read_when:
    - 你想了解记忆如何工作
    - 你想知道要写入哪些记忆文件
summary: OpenClaw 如何跨会话记住信息
title: 记忆概览
x-i18n:
    generated_at: "2026-06-27T01:49:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 通过在你的智能体工作区中写入**纯 Markdown 文件**来记住事情。模型只会“记住”保存到磁盘的内容，没有隐藏状态。

## 工作原理

你的智能体有三个与记忆相关的文件：

- **`MEMORY.md`** — 长期记忆。持久事实、偏好和决策。会在每个私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`**（或 **`memory/YYYY-MM-DD-<slug>.md`**）— 每日笔记。运行中的上下文和观察记录。今天和昨天的笔记会自动加载，并且现在也会一并拾取带 slug 的变体，例如内置 session-memory 钩子在 `/new` 或 `/reset` 时写入的文件，而不只限于纯日期文件。
- **`DREAMS.md`**（可选）— Dream Diary 和 Dreaming 扫描摘要，供人工审核，包括有依据的历史回填条目。

这些文件位于智能体工作区中（默认 `~/.openclaw/workspace`）。

## 内容放在哪里

`MEMORY.md` 是紧凑、经过整理的层。用它保存持久事实、偏好、长期决策，以及应在主私有会话开始时可用的简短摘要。它不是原始转录、每日日志或完整档案。

`memory/YYYY-MM-DD.md` 文件是工作层。用它们保存详细的每日笔记、观察记录、会话摘要，以及之后可能仍有用的原始上下文。这些文件会被索引用于 `memory_search` 和 `memory_get`，但不会在每一轮的普通引导提示中注入。

随着时间推移，智能体应将每日笔记中的有用材料提炼到 `MEMORY.md` 中，并移除陈旧的长期条目。生成的工作区说明和 Heartbeat 流程可以定期执行此操作；你不需要为每个被记住的细节手动编辑 `MEMORY.md`。

如果 `MEMORY.md` 超过引导文件预算，OpenClaw 会保持磁盘上的文件完整，但会截断注入模型上下文的副本。把这视为一个信号：将详细材料移回 `memory/*.md`，在 `MEMORY.md` 中只保留持久摘要，或者如果你明确愿意花费更多提示预算，则提高引导限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 查看原始大小与注入大小，以及截断状态。

<Tip>
如果你希望智能体记住某件事，直接告诉它：“记住我偏好 TypeScript。”它会把这写入合适的文件。
</Tip>

## 对操作敏感的记忆

大多数记忆可以作为普通 Markdown 笔记写入。但有些记忆会影响智能体之后应该做什么。对于这些内容，要记录什么时候可以安全地按这条笔记行动，而不仅仅是事实本身。

当笔记涉及以下内容时，请记录这个操作边界：

- 审批或许可要求，
- 临时约束，
- 交接给另一个会话、线程或人员，
- 过期条件，
- 可安全行动的时机，
- 来源或负责人权限，
- 避免执行某个诱人操作的指令。

一条有用的对操作敏感的记忆会明确：

- 什么会改变未来行为，
- 它在何时或什么条件下适用，
- 它何时过期，或什么会解锁行动，
- 智能体应避免做什么，
- 如果来源或负责人会影响信任或权限，则说明是谁。

记忆可以保留审批上下文，但不会强制执行策略。请使用 OpenClaw 审批设置、沙箱隔离和定时任务来实现严格的操作控制。

示例：

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

另一个示例：

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

使用 [跟进承诺](/zh-CN/concepts/commitments) 处理推断出来的短期跟进事项。使用 [定时任务](/zh-CN/automation/cron-jobs) 处理精确提醒、定时检查和周期性工作。记忆仍然可以概述任一路径周围的持久上下文。

这不是每条记忆都必须遵循的架构。简单事实可以保持简洁。当丢失时机、权限、过期或可安全行动上下文可能导致智能体之后做错事时，请使用对操作敏感的边界。

## 推断式跟进承诺

有些未来跟进不是持久事实。如果你提到明天有一次面试，有用的记忆可能是“面试后跟进”，而不是“永远存入 `MEMORY.md`”。

[跟进承诺](/zh-CN/concepts/commitments) 是针对这种情况的可选短期跟进记忆。OpenClaw 会在隐藏后台轮次中推断它们，将它们限定在同一个智能体和渠道内，并通过 Heartbeat 发送到期提醒。显式提醒仍使用 [定时任务](/zh-CN/automation/cron-jobs)。

## 记忆工具

智能体有两个用于处理记忆的工具：

- **`memory_search`** — 使用语义搜索查找相关笔记，即使用词与原文不同也可以。
- **`memory_get`** — 读取指定的记忆文件或行范围。

这两个工具由活跃记忆插件提供（默认：`memory-core`）。

## Memory Wiki 配套插件

如果你希望持久记忆的行为更像维护良好的知识库，而不仅是原始笔记，请使用内置 `memory-wiki` 插件。

`memory-wiki` 会将持久知识编译为 wiki 库，包含：

- 确定性的页面结构
- 结构化论断和证据
- 矛盾和新鲜度跟踪
- 生成的仪表板
- 面向智能体/运行时消费者的编译摘要
- wiki 原生工具，例如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不会取代活跃记忆插件。活跃记忆插件仍然负责召回、提升和 Dreaming。`memory-wiki` 在其旁边添加一个富含来源信息的知识层。

参见 [Memory Wiki](/zh-CN/plugins/memory-wiki)。

## 记忆搜索

配置嵌入提供商后，`memory_search` 会使用**混合搜索**，将向量相似度（语义含义）与关键词匹配（ID 和代码符号等精确术语）结合起来。只要你拥有任何受支持提供商的 API key，就可以开箱即用。

<Info>
OpenClaw 默认使用 OpenAI embeddings。显式设置 `agents.defaults.memorySearch.provider` 可使用 Gemini、Voyage、Mistral、local、Ollama、Bedrock、GitHub Copilot 或 OpenAI 兼容 embeddings。
</Info>

有关搜索工作方式、调优选项和提供商设置的详细信息，请参见 [Memory Search](/zh-CN/concepts/memory-search)。

## 记忆后端

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。支持关键词搜索、向量相似度和混合搜索，开箱即用。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，以及索引工作区之外目录的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话记忆，支持用户建模、语义搜索和多智能体感知。插件安装。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-CN/plugins/memory-lancedb">
内置的 LanceDB 后端记忆，支持 OpenAI 兼容 embeddings、自动召回、自动捕获和本地 Ollama embedding 支持。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久记忆编译为富含来源信息的 wiki 库，包含论断、仪表板、桥接模式和对 Obsidian 友好的工作流。
</Card>
</CardGroup>

## 自动记忆刷新

在 [压缩](/zh-CN/concepts/compaction) 总结你的对话之前，OpenClaw 会运行一个静默轮次，提醒智能体将重要上下文保存到记忆文件中。此功能默认开启，你不需要配置任何内容。

若要让这个清理轮次使用本地模型，请设置精确的记忆刷新模型覆盖：

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

该覆盖仅应用于记忆刷新轮次，不会继承活跃会话的回退链。

<Tip>
记忆刷新可防止压缩期间丢失上下文。如果你的智能体在对话中有尚未写入文件的重要事实，它们会在摘要生成前自动保存。
</Tip>

## Dreaming

Dreaming 是一个可选的后台记忆整合过程。它会收集短期信号，为候选项评分，并仅将合格项目提升到长期记忆（`MEMORY.md`）。

它旨在让长期记忆保持高信号密度：

- **可选启用**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理一个周期性 cron 作业，用于完整的 Dreaming 扫描。
- **有阈值**：提升必须通过评分、召回频率和查询多样性门槛。
- **可审核**：阶段摘要和日记条目会写入 `DREAMS.md`，供人工审核。

有关阶段行为、评分信号和 Dream Diary 详细信息，请参见 [Dreaming](/zh-CN/concepts/dreaming)。

## 有依据的回填和实时提升

Dreaming 系统现在有两个密切相关的审核通道：

- **实时 Dreaming** 使用 `memory/.dreams/` 下的短期 Dreaming 存储，也是普通深度阶段在决定哪些内容可以晋升到 `MEMORY.md` 时使用的内容。
- **有依据的回填** 将历史 `memory/YYYY-MM-DD.md` 笔记作为独立日文件读取，并将结构化审核输出写入 `DREAMS.md`。

当你想重放旧笔记，并在不手动编辑 `MEMORY.md` 的情况下检查系统认为哪些内容是持久信息时，有依据的回填很有用。

当你使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

这些有依据的持久候选项不会被直接提升。它们会暂存到普通深度阶段已经使用的同一个短期 Dreaming 存储中。这意味着：

- `DREAMS.md` 仍然是人工审核界面。
- 短期存储仍然是面向机器的排序界面。
- `MEMORY.md` 仍然只由深度提升写入。

如果你认为这次重放没有用，可以移除暂存产物，而不影响普通日记条目或正常召回状态：

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
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)：AI 原生跨会话记忆。
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)：基于 LanceDB 的插件，支持 OpenAI 兼容 embeddings。
- [Memory Wiki](/zh-CN/plugins/memory-wiki)：编译后的知识库和 wiki 原生工具。
- [记忆搜索](/zh-CN/concepts/memory-search)：搜索流水线、提供商和调优。
- [Dreaming](/zh-CN/concepts/dreaming)：从短期召回到长期记忆的后台提升。
- [记忆配置参考](/zh-CN/reference/memory-config)：所有配置旋钮。
- [压缩](/zh-CN/concepts/compaction)：压缩如何与记忆交互。

## 相关内容

- [主动记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)
- [跟进承诺](/zh-CN/concepts/commitments)
