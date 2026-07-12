---
read_when:
    - 你想了解记忆的工作原理
    - 你想知道要写入哪些记忆文件
summary: OpenClaw 如何跨会话记住信息
title: 记忆概览
x-i18n:
    generated_at: "2026-07-11T20:27:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw 通过在智能体的工作区（默认路径为 `~/.openclaw/workspace`）中写入纯 Markdown 文件来记住信息。模型只会记住保存到磁盘的内容；不存在隐藏状态。

## 工作原理

你的智能体有三个与记忆相关的文件：

- **`MEMORY.md`** — 长期记忆。持久保存的事实、偏好和决策。在会话开始时加载。
- **`memory/YYYY-MM-DD.md`**（或 `memory/YYYY-MM-DD-<slug>.md`）— 每日笔记。记录持续更新的上下文和观察。在不带其他参数执行 `/new` 或 `/reset` 时，系统会自动加载今天和昨天的日期笔记；带短名称的变体（例如由内置会话记忆钩子写入的文件）也会与仅含日期的文件一起加载。
- **`DREAMS.md`**（可选）— 供人工审核的梦境日记和梦境整理摘要，包括有依据的历史回填条目。

<Tip>
如果你希望智能体记住某件事，只需告诉它：“记住我更喜欢 TypeScript。”它会将这条笔记写入适当的文件。
</Tip>

## 各类内容的存放位置

`MEMORY.md` 是精简、经过整理的一层：包含应在会话开始时可用的持久事实、偏好、长期有效的决策和简短摘要。它不是原始对话记录、每日日志或完整归档。

`memory/YYYY-MM-DD.md` 文件是工作层：包含详细的每日笔记、观察、会话摘要以及以后可能仍有用的原始上下文。这些文件会被编入索引，供 `memory_search` 和 `memory_get` 使用，但不会在每一轮都注入引导提示词。

随着时间推移，智能体会从每日笔记中提炼有用内容并写入 `MEMORY.md`，同时删除过时的长期记忆条目。生成的工作区指令和 Heartbeat 流程会定期完成这项工作；你无需为每个细节手动编辑 `MEMORY.md`。

如果 `MEMORY.md` 超出引导文件预算，OpenClaw 会完整保留磁盘上的文件，但会截断注入上下文的副本。应将此视为一个信号：把详细内容移至 `memory/*.md`，在 `MEMORY.md` 中仅保留持久摘要；如果你愿意消耗更多提示词预算，也可以提高引导限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 可查看原始大小、注入大小和截断状态。

## 对操作有影响的记忆

大多数记忆都是普通 Markdown 笔记。有些记忆会影响智能体以后应执行的操作；对于这些记忆，不仅要记录事实本身，还要记录何时可以安全地依据该笔记采取操作。

当笔记涉及以下内容时，请记录这一操作边界：

- 审批或权限要求，
- 临时限制，
- 移交给其他会话、话题串或人员，
- 失效条件，
- 可安全执行操作的时机，
- 来源或所有者的权威性，
- 避免执行某项看似合理操作的指示。

一条有效的操作敏感型记忆应明确说明：

- 哪些内容会改变未来行为，
- 它在何时或什么条件下适用，
- 它何时失效，或满足什么条件后可以执行操作，
- 智能体应避免执行什么操作，
- 来源或所有者是谁（如果这会影响信任或权威性）。

记忆可以保留审批上下文，但不能强制执行策略。对于严格的操作控制，请使用 OpenClaw 的审批设置、沙箱隔离和定时任务。

示例：

```md
API 迁移正在另一个会话中设计。未来的轮次不应从此话题串编辑 API 实现；在迁移计划落地之前，此处的发现只能作为设计输入。
```

另一个示例：

```md
来自不可信来源的报告需要经过审核才能提升使用。未来的轮次应仅将其视为证据；在可信审核者确认内容之前，不要将其存储为持久记忆。
```

这并非每条记忆都必须遵循的架构；简单事实可以保持简洁。如果丢失时机、权威性、失效条件或可安全执行操作的上下文，可能导致智能体以后执行错误操作，则应使用操作敏感型边界。

对于推断出的短期跟进事项，请使用[跟进承诺](/zh-CN/concepts/commitments)。对于精确提醒、定时检查和重复性工作，请使用[定时任务](/zh-CN/automation/cron-jobs)。记忆仍可概括这两种路径周围的持久上下文。

## 推断式跟进承诺

有些未来的跟进事项并不是持久事实。如果你提到明天有一场面试，有用的记忆可能是“面试后询问情况”，而不是“将此内容永久存储在 `MEMORY.md` 中”。

[跟进承诺](/zh-CN/concepts/commitments)是针对这种情况的可选短期跟进记忆。OpenClaw 会在隐藏的后台处理中推断这些事项，将其范围限定为同一个智能体和渠道，并通过 Heartbeat 发送到期的跟进消息。显式提醒仍使用[定时任务](/zh-CN/automation/cron-jobs)。

## 记忆工具

智能体有两个用于处理记忆的工具：

- **`memory_search`** — 使用语义搜索查找相关笔记，即使措辞与原文不同也可以找到。
- **`memory_get`** — 读取指定的记忆文件或行范围。

这两个工具均由当前启用的记忆插件提供（默认为 `memory-core`）。

## 记忆搜索

配置嵌入提供商后，`memory_search` 会使用混合搜索：将向量相似度（语义含义）与关键词匹配（ID 和代码符号等精确词项）结合使用。只要为任何受支持的提供商配置 API 密钥，即可直接使用此功能。

<Info>
OpenClaw 默认使用 OpenAI 嵌入。显式设置 `agents.defaults.memorySearch.provider`，可使用 Gemini、Voyage、Mistral、Bedrock、DeepInfra、本地 GGUF、Ollama、LM Studio、GitHub Copilot 或通用的 OpenAI 兼容端点。
</Info>

有关搜索工作原理、调优选项和提供商设置，请参阅[记忆搜索](/zh-CN/concepts/memory-search)。

## 记忆后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/zh-CN/concepts/memory-builtin">
基于 SQLite。无需额外配置即可使用关键词搜索、向量相似度搜索和混合搜索。无额外依赖。
</Card>
<Card title="QMD" icon="search" href="/zh-CN/concepts/memory-qmd">
本地优先的辅助进程，支持重排序、查询扩展，并可为工作区之外的目录建立索引。
</Card>
<Card title="Honcho" icon="brain" href="/zh-CN/concepts/memory-honcho">
AI 原生的跨会话记忆，支持用户建模、语义搜索和多智能体感知。需要安装插件。
</Card>
<Card title="LanceDB" icon="layers" href="/zh-CN/plugins/memory-lancedb">
由 LanceDB 支持的记忆，提供 OpenAI 兼容嵌入、自动回忆、自动捕获和本地 Ollama 嵌入支持。需要安装插件。
</Card>
</CardGroup>

## 知识 wiki 层

如果你希望持久记忆更像一个持续维护的知识库，而不是原始笔记，请使用内置的 `memory-wiki` 插件。它将持久知识编译到 wiki 知识库中，并提供确定性的页面结构、结构化声明和证据、矛盾与新鲜度跟踪、生成式仪表板、编译摘要以及 wiki 原生工具（`wiki_status`、`wiki_search`、`wiki_get`、`wiki_apply`、`wiki_lint`）。

`memory-wiki` 不会取代当前启用的记忆插件；当前启用的记忆插件仍负责回忆、提升和梦境整理。`memory-wiki` 会在其旁边添加一个包含丰富溯源信息的知识层。

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/zh-CN/plugins/memory-wiki">
将持久记忆编译为包含丰富溯源信息的 wiki 知识库，并提供声明、仪表板、桥接模式和适合 Obsidian 的工作流。
</Card>
</CardGroup>

## 自动记忆刷新

在[压缩](/zh-CN/concepts/compaction)总结你的对话之前，OpenClaw 会静默运行一轮，提醒智能体将重要上下文保存到记忆文件。此功能默认启用；设置 `agents.defaults.compaction.memoryFlush.enabled: false` 可将其关闭。

要让此维护轮次使用本地模型，请设置仅应用于记忆刷新轮次的精确覆盖项（它不会继承当前会话的模型回退链）：

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
记忆刷新可防止压缩过程中丢失上下文。如果对话中包含尚未写入文件的重要事实，系统会在生成摘要之前自动保存这些事实。
</Tip>

## Dreaming

Dreaming 是一个可选的后台记忆整合过程。它会收集短期回忆信号、为候选项评分，并仅将符合条件的内容提升到长期记忆（`MEMORY.md`）：

- **可选启用**：默认禁用。
- **定时运行**：启用后，`memory-core` 会自动管理一个用于完整 Dreaming 整理的重复 cron 任务。
- **阈值控制**：提升内容必须通过评分、回忆频率和查询多样性门槛。
- **可审核**：阶段摘要和日记条目会写入 `DREAMS.md`，供人工审核。

有关阶段行为、评分信号和梦境日记的详细信息，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。

## 基于事实的回填和实时提升

Dreaming 系统有两条相关的审核路径：

- **实时 Dreaming** 使用 `memory/.dreams/` 下的短期 Dreaming 存储；常规深度阶段通过它决定哪些内容可提升到 `MEMORY.md`。
- **基于事实的回填** 将历史 `memory/YYYY-MM-DD.md` 笔记作为独立的每日文件读取，并将结构化审核输出写入 `DREAMS.md`。

基于事实的回填适用于重放旧笔记并检查系统认为哪些内容值得持久保留，无需手动编辑 `MEMORY.md`。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` 标志会将基于事实的持久候选项暂存到常规深度阶段已在使用的同一个短期 Dreaming 存储中；它不会直接提升这些内容。因此：

- `DREAMS.md` 仍是供人工审核的界面。
- 短期存储仍是供机器使用的排序界面。
- `MEMORY.md` 仍然只由深度提升过程写入。

若要撤销一次重放，同时不影响普通日记条目或正常回忆状态：

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

- [记忆搜索](/zh-CN/concepts/memory-search)：搜索流程、提供商和调优。
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)：默认 SQLite 后端。
- [QMD 记忆引擎](/zh-CN/concepts/memory-qmd)：高级本地优先辅助进程。
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)：AI 原生的跨会话记忆。
- [Memory LanceDB](/zh-CN/plugins/memory-lancedb)：由 LanceDB 支持并提供 OpenAI 兼容嵌入的插件。
- [Memory Wiki](/zh-CN/plugins/memory-wiki)：编译后的知识库和 wiki 原生工具。
- [Dreaming](/zh-CN/concepts/dreaming)：将短期回忆在后台提升为长期记忆。
- [记忆配置参考](/zh-CN/reference/memory-config)：所有配置选项。
- [压缩](/zh-CN/concepts/compaction)：压缩如何与记忆交互。
- [主动记忆](/zh-CN/concepts/active-memory)：用于交互式聊天会话的子智能体记忆。
