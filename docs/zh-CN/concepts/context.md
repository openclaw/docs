---
read_when:
    - 你想了解 OpenClaw 中的“上下文”是什么意思
    - 你正在调试为什么模型“知道”某些内容（或忘记了它）
    - 你想减少上下文开销（/context、/status、/compact）
summary: 上下文：模型看到的内容、它如何构建，以及如何检查它
title: 上下文
x-i18n:
    generated_at: "2026-05-06T01:42:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

“上下文”是 **OpenClaw 为一次运行发送给模型的全部内容**。它受模型的 **上下文窗口**（token 限制）约束。

初学者心智模型：

- **系统提示**（由 OpenClaw 构建）：规则、工具、Skills 列表、时间/运行时，以及注入的工作区文件。
- **对话历史**：你在此会话中的消息 + 助手的消息。
- **工具调用/结果 + 附件**：命令输出、文件读取、图片/音频等。

上下文 _不同于_ “记忆”：记忆可以存储在磁盘上并在之后重新加载；上下文是模型当前窗口里的内容。

## 快速开始（检查上下文）

- `/status` → 快速查看“我的窗口还剩多少空间？”视图 + 会话设置。
- `/context list` → 已注入的内容 + 粗略大小（按文件 + 总计）。
- `/context detail` → 更深入的拆分：按文件、按工具 schema 大小、按 Skills 条目大小，以及系统提示大小。
- `/usage tokens` → 在普通回复后附加每条回复的用量页脚。
- `/compact` → 将较旧的历史总结成一个紧凑条目，以释放窗口空间。

另请参阅：[斜杠命令](/zh-CN/tools/slash-commands)、[Token 使用与费用](/zh-CN/reference/token-use)、[压缩](/zh-CN/concepts/compaction)。

## 示例输出

值会因模型、提供商、工具策略和你的工作区内容而异。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
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

模型接收的所有内容都会计入，包括：

- 系统提示（所有部分）。
- 对话历史。
- 工具调用 + 工具结果。
- 附件/转录（图片/音频/文件）。
- 压缩摘要和剪枝产物。
- 提供商“包装器”或隐藏标头（不可见，但仍会计入）。

## OpenClaw 如何构建系统提示

系统提示由 **OpenClaw 所有**，并会在每次运行时重新构建。它包括：

- 工具列表 + 简短描述。
- Skills 列表（仅元数据；见下文）。
- 工作区位置。
- 时间（UTC + 配置后的用户时间转换）。
- 运行时元数据（主机/操作系统/模型/thinking）。
- **项目上下文** 下的已注入工作区 bootstrap 文件。

完整拆分：[系统提示](/zh-CN/concepts/system-prompt)。

## 已注入工作区文件（项目上下文）

默认情况下，OpenClaw 会注入一组固定的工作区文件（如果存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅首次运行）

大文件会按文件使用 `agents.defaults.bootstrapMaxChars`（默认 `12000` 字符）截断。OpenClaw 还会使用 `agents.defaults.bootstrapTotalMaxChars`（默认 `60000` 字符）对跨文件的 bootstrap 注入总量施加上限。`/context` 会显示 **原始与已注入** 大小，以及是否发生了截断。

发生截断时，运行时可以在项目上下文下注入一个提示内警告块。使用 `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；默认 `once`）配置此行为。

## Skills：已注入与按需加载

系统提示包含紧凑的 **Skills 列表**（名称 + 描述 + 位置）。此列表有真实开销。

Skills 指令默认 _不会_ 包含。模型应当 **仅在需要时** `read` 该 Skills 的 `SKILL.md`。

## 工具：有两类成本

工具会以两种方式影响上下文：

1. 系统提示中的 **工具列表文本**（你看到的“Tooling”）。
2. **工具 schema**（JSON）。这些会发送给模型，以便模型调用工具。它们会计入上下文，即使你不会看到它们作为纯文本出现。

`/context detail` 会拆分最大的工具 schema，让你看到哪些部分占比最高。

## 命令、指令和“内联快捷方式”

斜杠命令由 Gateway 网关处理。有几种不同行为：

- **独立命令**：仅包含 `/...` 的消息会作为命令运行。
- **指令**：`/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` 会在模型看到消息前被移除。
  - 仅指令消息会持久化会话设置。
  - 普通消息中的内联指令会作为单条消息提示。
- **内联快捷方式**（仅允许列表中的发送者）：普通消息中的某些 `/...` token 可以立即运行（示例：“hey /status”），并会在模型看到剩余文本前被移除。

详情：[斜杠命令](/zh-CN/tools/slash-commands)。

## 会话、压缩和剪枝（哪些内容会持久化）

跨消息持久化的内容取决于机制：

- **普通历史** 会持久化在会话转录中，直到按策略压缩/剪枝。
- **压缩** 会将摘要持久化到转录中，并保留最近消息不变。
- **剪枝** 会从 _内存中的_ 提示里丢弃旧工具结果，以释放上下文窗口空间，但不会重写会话转录 - 完整历史仍可在磁盘上检查。

文档：[会话](/zh-CN/concepts/session)、[压缩](/zh-CN/concepts/compaction)、[会话剪枝](/zh-CN/concepts/session-pruning)。

默认情况下，OpenClaw 使用内置的 `legacy` 上下文引擎进行组装和
压缩。如果你安装了一个提供 `kind: "context-engine"` 的插件，并使用
`plugins.slots.contextEngine` 选择它，OpenClaw 就会改为把上下文
组装、`/compact` 以及相关子智能体上下文生命周期钩子委托给该
引擎。`ownsCompaction: false` 不会自动回退到 legacy
引擎；活跃引擎仍必须正确实现 `compact()`。完整的
可插拔接口、生命周期钩子和配置请参阅
[上下文引擎](/zh-CN/concepts/context-engine)。

## `/context` 实际报告的内容

`/context` 会优先使用最新的 **运行构建** 系统提示报告（如果可用）：

- `System prompt (run)` = 从上一次嵌入式（支持工具的）运行中捕获，并持久化到会话存储中。
- `System prompt (estimate)` = 在没有运行报告时即时计算（或通过不会生成该报告的 CLI 后端运行时计算）。

无论哪种方式，它都会报告大小和主要贡献项；它 **不会** 转储完整的系统提示或工具 schema。

## 相关

<CardGroup cols={2}>
  <Card title="Context engine" href="/zh-CN/concepts/context-engine" icon="puzzle-piece">
    通过插件自定义上下文注入。
  </Card>
  <Card title="Compaction" href="/zh-CN/concepts/compaction" icon="compress">
    总结长对话，使其保持在模型窗口内。
  </Card>
  <Card title="System prompt" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    系统提示如何构建，以及它在每一轮注入什么内容。
  </Card>
  <Card title="Agent loop" href="/zh-CN/concepts/agent-loop" icon="arrows-rotate">
    从入站消息到最终回复的完整智能体执行周期。
  </Card>
</CardGroup>
