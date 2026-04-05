---
read_when:
    - 你想了解 OpenClaw 中“上下文”的含义
    - 你正在调试模型为什么“知道”某些内容（或为什么忘记了它）
    - 你想减少上下文开销（`/context`、`/status`、`/compact`）
summary: 上下文：模型能看到什么、它是如何构建的，以及如何检查它
title: 上下文
x-i18n:
    generated_at: "2026-04-05T08:21:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# 上下文

“上下文”是**OpenClaw 在一次运行中发送给模型的全部内容**。它受模型的**上下文窗口**（token 限制）约束。

适合初学者的心智模型：

- **系统提示词**（由 OpenClaw 构建）：规则、工具、Skills 列表、时间 / 运行时信息，以及注入的工作区文件。
- **对话历史**：你在此会话中的消息 + 助手消息。
- **工具调用 / 结果 + 附件**：命令输出、文件读取、图像 / 音频等。

上下文 _并不等同于_ “memory”：memory 可以存储到磁盘并在之后重新加载；上下文则是模型当前窗口中的内容。

## 快速开始（检查上下文）

- `/status` → 快速查看“我的窗口有多满？”以及会话设置。
- `/context list` → 查看注入了哪些内容 + 大致大小（每个文件 + 总计）。
- `/context detail` → 更深入的细分：每个文件、每个工具 schema 的大小、每个 skill 条目的大小，以及系统提示词大小。
- `/usage tokens` → 在普通回复后附加每次回复的用量页脚。
- `/compact` → 将较早的历史总结为一条紧凑条目，以释放窗口空间。

另见：[Slash commands](/tools/slash-commands)、[Token use & costs](/reference/token-use)、[Compaction](/concepts/compaction)。

## 示例输出

具体值会因模型、提供商、工具策略以及你的工作区内容而异。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## 哪些内容会计入上下文窗口

模型接收到的所有内容都会计入，包括：

- 系统提示词（所有部分）。
- 对话历史。
- 工具调用 + 工具结果。
- 附件 / 转录内容（图像 / 音频 / 文件）。
- 压缩摘要和剪枝产物。
- 提供商“包装层”或隐藏头部（虽然不可见，仍会计入）。

## OpenClaw 如何构建系统提示词

系统提示词由 **OpenClaw 拥有**，并会在每次运行时重新构建。它包括：

- 工具列表 + 简短说明。
- Skills 列表（仅元数据；见下文）。
- 工作区位置。
- 时间（UTC + 如果已配置则包含换算后的用户时间）。
- 运行时元数据（主机 / OS / 模型 / thinking）。
- **Project Context** 下已注入的工作区 bootstrap 文件。

完整细分参见：[System Prompt](/concepts/system-prompt)。

## 注入的工作区文件（Project Context）

默认情况下，OpenClaw 会注入一组固定的工作区文件（如果存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅首次运行）

大文件会按文件使用 `agents.defaults.bootstrapMaxChars`（默认 `20000` 个字符）进行截断。OpenClaw 还会对所有文件的 bootstrap 注入总量施加上限 `agents.defaults.bootstrapTotalMaxChars`（默认 `150000` 个字符）。`/context` 会显示**原始大小与注入后大小**，以及是否发生了截断。

发生截断时，运行时可以在 Project Context 下方于提示词内注入一个警告块。可通过 `agents.defaults.bootstrapPromptTruncationWarning` 进行配置（`off`、`once`、`always`；默认 `once`）。

## Skills：注入与按需加载

系统提示词包含一个精简的 **Skills 列表**（名称 + 描述 + 位置）。这个列表会带来真实的开销。

默认情况下不会包含 skill 指令本身。模型应当只在需要时 `read` 该 skill 的 `SKILL.md`。

## Tools：有两类成本

工具会通过两种方式影响上下文：

1. 系统提示词中的**工具列表文本**（你看到的 “Tooling”）。
2. **工具 schema**（JSON）。这些内容会发送给模型，以便它能够调用工具。即使你看不到它们的纯文本形式，它们仍会计入上下文。

`/context detail` 会细分最大的工具 schema，以便你看到主要开销来自哪里。

## 命令、指令和“内联快捷方式”

Slash 命令由 Gateway 网关处理。这里有几种不同的行为：

- **独立命令**：如果一条消息只包含 `/...`，它会作为命令运行。
- **指令**：`/think`、`/verbose`、`/reasoning`、`/elevated`、`/model`、`/queue` 会在模型看到消息前被剥离。
  - 只包含指令的消息会持久化会话设置。
  - 普通消息中的内联指令会作为单条消息级提示生效。
- **内联快捷方式**（仅允许列表中的发件人）：普通消息中的某些 `/...` 标记可以立即执行（例如：“hey /status”），并会在模型看到剩余文本前被剥离。

详情参见：[Slash commands](/tools/slash-commands)。

## 会话、压缩和剪枝（哪些内容会持久化）

跨消息持久化的内容取决于所用机制：

- **普通历史** 会保留在会话转录中，直到按策略被压缩 / 剪枝。
- **压缩** 会将摘要持久化到转录中，并保留最近的消息不变。
- **剪枝** 会从一次运行的**内存中**提示词移除旧的工具结果，但不会重写转录。

文档参见：[会话](/concepts/session)、[压缩](/concepts/compaction)、[会话剪枝](/concepts/session-pruning)。

默认情况下，OpenClaw 使用内置的 `legacy` 上下文引擎进行组装和压缩。如果你安装了提供 `kind: "context-engine"` 的插件，并通过 `plugins.slots.contextEngine` 选择它，OpenClaw 就会将上下文组装、`/compact` 以及相关的子智能体上下文生命周期 hook 委托给该引擎。`ownsCompaction: false` 不会自动回退到 legacy 引擎；活动引擎仍必须正确实现 `compact()`。完整的可插拔接口、生命周期 hooks 和配置参见
[Context Engine](/concepts/context-engine)。

## `/context` 实际报告了什么

`/context` 在可用时会优先使用最新的**按运行构建**系统提示词报告：

- `System prompt (run)` = 从上一次嵌入式（支持工具）运行中捕获，并持久化到会话存储中。
- `System prompt (estimate)` = 当不存在运行报告时按需即时计算（或者当通过不会生成该报告的 CLI 后端运行时计算）。

无论哪种方式，它都会报告大小和主要贡献项；它**不会**转储完整系统提示词或工具 schema。

## 相关内容

- [Context Engine](/concepts/context-engine) — 通过插件进行自定义上下文注入
- [Compaction](/concepts/compaction) — 总结长对话
- [System Prompt](/concepts/system-prompt) — 系统提示词如何构建
- [Agent Loop](/concepts/agent-loop) — 完整的智能体执行循环
