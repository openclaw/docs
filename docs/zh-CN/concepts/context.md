---
read_when:
    - 你想了解 OpenClaw 中的“上下文”是什么意思
    - 你正在调试为什么模型“知道”某些内容（或忘记了它）
    - 你想减少上下文开销（/context、/status、/compact）
summary: 上下文：模型看到的内容、它如何构建，以及如何检查它
title: 上下文
x-i18n:
    generated_at: "2026-07-05T11:11:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b94bf7dd87318107840faced4e899e0a4acae5fe8ae55cfcb91ae72259c79aa
    source_path: concepts/context.md
    workflow: 16
---

“上下文”是 **OpenClaw 为一次运行发送给模型的全部内容**。它受模型的 **上下文窗口**（token 限制）约束。

初学者心智模型：

- **系统提示词**（由 OpenClaw 构建）：规则、工具、Skills 列表、时间/运行时，以及注入的工作区文件。
- **对话历史**：你在此会话中的消息 + 助手的消息。
- **工具调用/结果 + 附件**：命令输出、文件读取、图像/音频等。

上下文与“记忆”_不是同一回事_：记忆可以存储在磁盘上并在之后重新加载；上下文是当前模型窗口中的内容。

## 快速开始（检查上下文）

- `/status` → 快速查看“我的窗口还有多少空间？”以及会话设置。
- `/context list` → 已注入的内容 + 粗略大小（按文件 + 总计）。
- `/context detail` → 更深入的拆分：按文件、按工具 schema 大小、按 Skills 条目大小、系统提示词大小，以及可压缩的转录消息数量。
- `/context map` → 当前会话已跟踪上下文贡献项的 WinDirStat 风格矩形树图。
- `/usage tokens` → 在普通回复后附加每条回复的用量页脚。
- `/compact` → 将较早历史总结成一个紧凑条目，以释放窗口空间。

另请参阅：[Slash commands](/zh-CN/tools/slash-commands)、[Token 使用量与成本](/zh-CN/reference/token-use)、[压缩](/zh-CN/concepts/compaction)。

## 示例输出

值会因模型、提供商、工具策略以及你的工作区内容而异。

### `/context list`

```text
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

```text
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

### `/context map`

发送一张由最新缓存运行报告生成的图像。在会话中普通消息产生运行报告之前，`/context map` 会返回不可用消息，而不是渲染估算图。矩形面积与已跟踪的提示字符数成正比：

- 注入的工作区文件
- 基础系统提示词文本
- Skills 提示条目
- 工具 JSON schema

当没有缓存运行报告时，`/context list`、`/context detail` 和 `/context json` 仍可检查按需估算。

## 哪些内容计入上下文窗口

模型接收到的一切都会计入，包括：

- 系统提示词（所有部分）。
- 对话历史。
- 工具调用 + 工具结果。
- 附件/转录（图像/音频/文件）。
- 压缩摘要和裁剪产物。
- 提供商“包装器”或隐藏标头（不可见，但仍会计入）。

## OpenClaw 如何构建系统提示词

系统提示词归 **OpenClaw 所有**，并在每次运行时重建。它包括：

- 工具列表 + 简短描述。
- Skills 列表（仅元数据；见下文）。
- 工作区位置。
- 时间（UTC + 如果已配置则转换为用户时间）。
- 运行时元数据（主机/操作系统/模型/思考）。
- 注入到 **Project Context** 下的工作区引导文件。

完整拆分：[系统提示词](/zh-CN/concepts/system-prompt)。

## 注入的工作区文件（Project Context）

默认情况下，OpenClaw 会注入一组固定的工作区文件（如果存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅首次运行）

大文件会按文件使用 `agents.defaults.bootstrapMaxChars`（默认 `20000` 个字符）截断。OpenClaw 还会通过 `agents.defaults.bootstrapTotalMaxChars`（默认 `60000` 个字符）对所有文件的引导注入总量设置上限。`/context` 会显示 **原始大小 vs 注入大小**，以及是否发生截断。

发生截断时，运行时可以在 Project Context 下注入一个提示词内警告块。使用 `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；默认 `always`）配置此行为。

## Skills：注入 vs 按需加载

系统提示词包含一个紧凑的 **Skills 列表**（名称 + 描述 + 位置）。此列表有真实开销。

Skills 指令默认_不会_包含在内。模型应当 **仅在需要时** `read` 该 Skills 的 `SKILL.md`。

## 工具：有两种成本

工具以两种方式影响上下文：

1. 系统提示词中的 **工具列表文本**（你看到的“Tooling”）。
2. **工具 schema**（JSON）。这些会发送给模型，以便模型调用工具。即使你看不到它们的纯文本形式，它们也会计入上下文。

`/context detail` 会拆分最大的工具 schema，让你看到主要占用来自哪里。

## 命令、指令和“内联快捷方式”

斜杠命令由 Gateway 网关处理。有几种不同的行为：

- **独立命令**：仅包含 `/...` 的消息会作为命令运行。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue` 会在模型看到消息前被剥离。
  - 仅包含指令的消息会持久化会话设置。
  - 普通消息中的内联指令会作为按消息生效的提示。
- **内联快捷方式**（仅允许列表中的发送者）：普通消息中的某些 `/...` token 可以立即运行（例如：“hey /status”），并在模型看到剩余文本前被剥离。

详情：[Slash commands](/zh-CN/tools/slash-commands)。

## 会话、压缩和裁剪（哪些内容会持久化）

跨消息持久化的内容取决于机制：

- **普通历史** 会保留在会话转录中，直到按策略压缩/裁剪。
- **压缩** 会将摘要持久化到转录中，并保留最近的消息不变。
- **裁剪** 会从_内存中的_提示词移除旧工具结果，以释放上下文窗口空间，但不会重写会话转录 - 完整历史仍可在磁盘上检查。

文档：[会话](/zh-CN/concepts/session)、[压缩](/zh-CN/concepts/compaction)、[会话裁剪](/zh-CN/concepts/session-pruning)。

默认情况下，OpenClaw 使用内置的 `legacy` 上下文引擎进行组装和压缩。如果你安装了提供 `kind: "context-engine"` 的插件，并使用 `plugins.slots.contextEngine` 选择它，OpenClaw 会改为将上下文组装、`/compact` 以及相关子智能体上下文生命周期钩子委托给该引擎。`ownsCompaction: false` 不会自动回退到 legacy 引擎；活动引擎仍必须正确实现 `compact()`。有关完整的可插拔接口、生命周期钩子和配置，请参阅[上下文引擎](/zh-CN/concepts/context-engine)。

## `/context` 实际报告什么

`/context` 会优先使用最新的**运行时构建**系统提示词报告（如果可用）：

- `System prompt (run)` = 从最后一次嵌入式（可用工具）运行捕获，并持久化到会话存储中。
- `System prompt (estimate)` = 当不存在运行报告时（或通过不会生成报告的 CLI 后端运行时）即时计算。

无论哪种方式，它都会报告大小和主要贡献项；它**不会**转储完整系统提示词或工具 schema。在详细模式下，它还会使用与压缩相同的真实对话消息判定条件来比较会话转录，因此更容易区分高提示词/缓存用量与可压缩的对话历史。

## 相关

<CardGroup cols={2}>
  <Card title="上下文引擎" href="/zh-CN/concepts/context-engine" icon="puzzle-piece">
    通过插件自定义上下文注入。
  </Card>
  <Card title="压缩" href="/zh-CN/concepts/compaction" icon="compress">
    总结长对话，使其保持在模型窗口内。
  </Card>
  <Card title="系统提示词" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    系统提示词如何构建，以及每轮会注入什么。
  </Card>
  <Card title="Agent loop" href="/zh-CN/concepts/agent-loop" icon="arrows-rotate">
    从入站消息到最终回复的完整智能体执行周期。
  </Card>
</CardGroup>
