---
read_when:
    - 你想了解记忆如何工作
    - 你想知道要写入哪些记忆文件
summary: OpenClaw 如何跨会话记住信息
title: 记忆概览
x-i18n:
    generated_at: "2026-07-05T11:12:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 通过在你的智能体工作区（默认 `~/.openclaw/workspace`）中写入纯 Markdown 文件来记住内容。模型只会记住保存到磁盘的内容；没有隐藏状态。

## 工作原理

你的智能体有三个与记忆相关的文件：

- **`MEMORY.md`** — 长期记忆。持久事实、偏好和决策。会在会话开始时加载。
- **`memory/YYYY-MM-DD.md`**（或 `memory/YYYY-MM-DD-<slug>.md`）— 每日笔记。运行中的上下文和观察。仅执行 `/new` 或 `/reset` 时，今天和昨天的日期笔记会自动加载；带 slug 的变体，例如内置 session-memory 钩子写入的那些，会与仅日期文件一起被选取。
- **`DREAMS.md`**（可选）— 供人工审阅的梦境日记和 Dreaming 清扫摘要，包括基于历史资料的回填条目。

<Tip>
如果你想让智能体记住某件事，直接告诉它即可：“记住我更喜欢 TypeScript。”它会把笔记写入合适的文件。
</Tip>

## 内容放在哪里

`MEMORY.md` 是紧凑、经过整理的层：持久事实、偏好、长期决策，以及应在会话开始时可用的简短摘要。它不是原始转录、每日日志或详尽归档。

`memory/YYYY-MM-DD.md` 文件是工作层：详细的每日笔记、观察、会话摘要，以及稍后可能仍然有用的原始上下文。这些文件会被索引用于 `memory_search` 和 `memory_get`，但不会在每一轮都注入到引导提示中。

随着时间推移，智能体会从每日笔记中提炼有用材料写入 `MEMORY.md`，并移除过时的长期条目。生成的工作区指令和 Heartbeat 流程会定期执行此操作；你不需要为了每个细节手动编辑 `MEMORY.md`。

如果 `MEMORY.md` 超过引导文件预算，OpenClaw 会保持磁盘上的文件完整，但会截断注入到上下文中的副本。将其视为一个信号：把详细材料移入 `memory/*.md`，只在 `MEMORY.md` 中保留持久摘要，或者在你愿意消耗更多提示预算时提高引导限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 查看原始大小、注入大小和截断状态。

## 对操作敏感的记忆

大多数记忆都是普通 Markdown 笔记。有些会影响智能体稍后应该做什么；对于这些内容，不仅要记录事实本身，还要记录什么时候可以安全地根据这条笔记行动。

当笔记涉及以下内容时，请捕获该操作边界：

- 审批或权限要求，
- 临时约束，
- 移交给另一个会话、线程或人员，
- 过期条件，
- 可以安全行动的时机，
- 来源或所有者权限，
- 避免某个诱人操作的指令。

一条有用的对操作敏感的记忆应明确：

- 什么会改变未来行为，
- 它在何时或什么条件下适用，
- 它何时过期，或什么会解锁操作，
- 智能体应避免做什么，
- 如果会影响信任或权限，来源或所有者是谁。

记忆可以保留审批上下文，但它不会强制执行策略。请使用 OpenClaw 审批设置、沙箱隔离和定时任务来实现硬性操作控制。

示例：

```md
The API migration is being designed in another session. Future turns should
not edit the API implementation from this thread; use findings here only as
design input until the migration plan lands.
```

另一个示例：

```md
A report from an untrusted source needs review before promotion. Future turns
should treat it as evidence only; do not store it as durable memory until a
trusted reviewer confirms the contents.
```

这不是每条记忆都必须遵循的模式；简单事实可以保持简洁。当丢失时机、权限、过期或可安全行动的上下文可能导致智能体稍后做错事时，请使用对操作敏感的边界。

对推断出的短期跟进使用 [跟进承诺](/zh-CN/concepts/commitments)。对精确提醒、定时检查和周期性工作使用 [定时任务](/zh-CN/automation/cron-jobs)。记忆仍然可以总结任一路径周围的持久上下文。

## 推断式跟进承诺

有些未来跟进并不是持久事实。如果你提到明天有一场面试，有用的记忆可能是“面试后跟进”，而不是“把这件事永远存入 `MEMORY.md`”。

[跟进承诺](/zh-CN/concepts/commitments) 是适用于这种情况的可选短期跟进记忆。OpenClaw 会在隐藏的后台流程中推断它们，将它们限定到同一个智能体和渠道，并通过 Heartbeat 发送到期的检查提醒。显式提醒仍然使用 [定时任务](/zh-CN/automation/cron-jobs)。

## 记忆工具

智能体有两个用于处理记忆的工具：

- **`memory_search`** — 使用语义搜索查找相关笔记，即使用词与原文不同也可以找到。
- **`memory_get`** — 读取特定记忆文件或行范围。

这两个工具由活跃记忆插件提供（默认：`memory-core`）。

## 记忆搜索

配置 embedding 提供商后，`memory_search` 会使用混合搜索：向量相似度（语义含义）结合关键词匹配（ID 和代码符号等精确术语）。只要为任何受支持的提供商配置 API key，即可开箱使用。

<Info>
OpenClaw 默认使用 OpenAI embeddings。显式设置 `agents.defaults.memorySearch.provider` 可使用 Gemini、Voyage、Mistral、Bedrock、DeepInfra、本地 GGUF、Ollama、LM Studio、GitHub Copilot，或通用 OpenAI 兼容端点。
</Info>

请参阅 [记忆搜索](/zh-CN/concepts/memory-search) 了解搜索的工作方式、调优选项和提供商设置。

## 记忆后端

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。通过关键词搜索、向量相似度和混合搜索开箱工作。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，以及索引工作区之外目录的能力。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话记忆，支持用户建模、语义搜索和多智能体感知。插件安装。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-CN/plugins/memory-lancedb">
基于 LanceDB 的记忆，支持 OpenAI 兼容 embeddings、自动回忆、自动捕获和本地 Ollama embedding 支持。插件安装。
</Card>
</CardGroup>

## 知识 wiki 层

如果你希望持久记忆表现得更像一个维护中的知识库，而不是原始笔记，请使用内置的 `memory-wiki` 插件。它会把持久知识编译到一个 wiki vault 中，包含确定性的页面结构、结构化主张和证据、矛盾与新鲜度跟踪、生成的仪表盘、编译摘要，以及 wiki 原生工具（`wiki_status`、`wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint`）。

`memory-wiki` 不会替代活跃记忆插件；活跃记忆插件仍然负责回忆、提升和 Dreaming。`memory-wiki` 会在旁边添加一个来源信息丰富的知识层。

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久记忆编译为来源信息丰富的 wiki vault，包含主张、仪表盘、桥接模式和 Obsidian 友好的工作流。
</Card>
</CardGroup>

## 自动记忆刷新

在 [压缩](/zh-CN/concepts/compaction) 总结你的对话之前，OpenClaw 会运行一个静默轮次，提醒智能体将重要上下文保存到记忆文件。默认启用；设置 `agents.defaults.compaction.memoryFlush.enabled: false` 可将其关闭。

为了让该清理轮次使用本地模型，请设置一个仅适用于记忆刷新轮次的精确覆盖（它不会继承当前会话的模型 fallback 链）：

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

<Tip>
记忆刷新可防止压缩期间丢失上下文。如果智能体在对话中有尚未写入文件的重要事实，它们会在摘要发生前自动保存。
</Tip>

## Dreaming

Dreaming 是一个可选的记忆后台整合流程。它会收集短期回忆信号、为候选项评分，并且只将合格项提升到长期记忆（`MEMORY.md`）中：

- **可选启用**：默认禁用。
- **定时执行**：启用后，`memory-core` 会自动管理一个周期性 cron job，用于完整 Dreaming 清扫。
- **设有阈值**：提升必须通过分数、回忆频率和查询多样性门槛。
- **可审阅**：阶段摘要和日记条目会写入 `DREAMS.md`，供人工审阅。

请参阅 [Dreaming](/zh-CN/concepts/dreaming) 了解阶段行为、评分信号和梦境日记详情。

## 基于资料的回填和实时提升

Dreaming 系统有两个相关的审阅通道：

- **实时 Dreaming** 使用 `memory/.dreams/` 下的短期 Dreaming 存储，这是普通深度阶段用来决定哪些内容进入 `MEMORY.md` 的机制。
- **基于资料的回填** 将历史 `memory/YYYY-MM-DD.md` 笔记作为独立的每日文件读取，并将结构化审阅输出写入 `DREAMS.md`。

基于资料的回填适合重放旧笔记，并检查系统认为哪些内容是持久的，而无需手动编辑 `MEMORY.md`。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` 标志会将基于资料的持久候选项暂存到普通深度阶段已经使用的同一个短期 Dreaming 存储中；它不会直接提升它们。因此：

- `DREAMS.md` 仍然是人工审阅界面。
- 短期存储仍然是面向机器的排序界面。
- `MEMORY.md` 仍然只由深度提升写入。

要撤销一次重放，而不触碰普通日记条目或正常回忆状态：

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

- [记忆搜索](/zh-CN/concepts/memory-search)：搜索流水线、提供商和调优。
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)：默认 SQLite 后端。
- [QMD 记忆引擎](/zh-CN/concepts/memory-qmd)：高级本地优先 sidecar。
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)：AI 原生跨会话记忆。
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)：基于 LanceDB 的插件，支持 OpenAI 兼容 embeddings。
- [Memory Wiki](/zh-CN/plugins/memory-wiki)：编译后的知识 vault 和 wiki 原生工具。
- [Dreaming](/zh-CN/concepts/dreaming)：从短期回忆到长期记忆的后台提升。
- [记忆配置参考](/zh-CN/reference/memory-config)：所有配置旋钮。
- [压缩](/zh-CN/concepts/compaction)：压缩如何与记忆交互。
- [主动记忆](/zh-CN/concepts/active-memory)：用于交互式聊天会话的子智能体记忆。
