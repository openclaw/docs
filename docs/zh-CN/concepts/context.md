---
read_when:
    - 你想了解 OpenClaw 中“上下文”的含义
    - 你正在调试为什么模型“知道”某些内容（或忘记了它）
    - 你想减少上下文开销（/context、/status、/compact）
summary: 上下文：模型看到的内容、其构建方式以及如何检查它
title: 上下文
x-i18n:
    generated_at: "2026-07-11T20:27:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

“上下文”是 **OpenClaw 在一次运行中发送给模型的所有内容**。它受模型的 **上下文窗口**（令牌限制）约束。

初学者心智模型：

- **系统提示词**（由 OpenClaw 构建）：规则、工具、Skills 列表、时间/运行时，以及注入的工作区文件。
- **对话历史**：本会话中你的消息 + 助手的消息。
- **工具调用/结果 + 附件**：命令输出、文件读取内容、图像/音频等。

上下文与“记忆”_不是一回事_：记忆可以存储在磁盘上并在之后重新加载；上下文则是模型当前窗口中的内容。

## 快速开始（检查上下文）

- `/status` → 快速查看“我的窗口用了多少？”以及会话设置。
- `/context list` → 查看注入了哪些内容及其大致大小（每个文件 + 总计）。
- `/context detail` → 更深入的明细：每个文件、每个工具 schema、每个 Skill 条目的大小、系统提示词大小，以及可压缩的对话记录消息数。
- `/context map` → 当前会话中已跟踪上下文来源的 WinDirStat 风格矩形树图。
- `/usage tokens` → 在普通回复后附加每次回复的用量页脚。
- `/compact` → 将较早的历史记录总结为一个压缩条目，以释放窗口空间。

另请参阅：[斜杠命令](/zh-CN/tools/slash-commands)、[令牌用量和费用](/zh-CN/reference/token-use)、[压缩](/zh-CN/concepts/compaction)。

## 输出示例

具体值因模型、提供商、工具策略及工作区内容而异。

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

发送根据最新缓存的运行报告和会话对话记录生成的图像。在会话中的普通消息生成运行报告之前，`/context map` 会返回不可用消息，而不是渲染估算结果。矩形面积与已跟踪的提示词字符数成正比：

- 对话记录（用户消息、助手回复、工具结果、压缩摘要），以及仅发送给模型的每轮运行时上下文和钩子提示词附加内容
- 注入的工作区文件
- 基础系统提示词文本
- Skill 提示词条目
- 工具 JSON schema

对话分组会随会话增长，因此矩形树图每轮都会变化；压缩后，它会折叠为一个摘要区块。

没有缓存的运行报告时，`/context list`、`/context detail` 和 `/context json` 仍可检查按需生成的估算结果。

## 哪些内容计入上下文窗口

模型接收的所有内容都会计入，包括：

- 系统提示词（所有部分）。
- 对话历史。
- 工具调用 + 工具结果。
- 附件/转录内容（图像/音频/文件）。
- 压缩摘要和裁剪产物。
- 提供商“包装层”或隐藏标头（不可见，但仍会计入）。

## OpenClaw 如何构建系统提示词

系统提示词**归 OpenClaw 所有**，并在每次运行时重新构建。它包括：

- 工具列表 + 简短描述。
- Skills 列表（仅元数据；见下文）。
- 工作区位置。
- 时间（UTC；如已配置，还包括转换后的用户时间）。
- 运行时元数据（主机/操作系统/模型/思考模式）。
- 注入到 **项目上下文** 下的工作区引导文件。

完整明细：[系统提示词](/zh-CN/concepts/system-prompt)。

## 注入的工作区文件（项目上下文）

默认情况下，OpenClaw 会注入一组固定的工作区文件（如果存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅首次运行）

大型文件会根据 `agents.defaults.bootstrapMaxChars`（默认 `20000` 个字符）按文件截断。OpenClaw 还通过 `agents.defaults.bootstrapTotalMaxChars`（默认 `60000` 个字符）对跨文件的引导注入总量设置上限。`/context` 会显示**原始大小与注入大小**，以及是否发生截断。

发生截断时，运行时可以在项目上下文下的提示词中注入警告块。使用 `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；默认 `always`）进行配置。

## Skills：注入与按需加载

系统提示词包含紧凑的 **Skills 列表**（名称 + 描述 + 位置）。该列表会产生实际开销。

默认不包含 Skill 指令。模型应当**仅在需要时** `read` 该 Skill 的 `SKILL.md`。

## 工具：存在两类开销

工具通过两种方式影响上下文：

1. 系统提示词中的**工具列表文本**（即你看到的“工具”部分）。
2. **工具 schema**（JSON）。它们会发送给模型，以便模型调用工具。即使你无法以纯文本形式看到它们，它们仍会计入上下文。

`/context detail` 会列出最大的工具 schema，便于查看哪些内容占用最多空间。

## 命令、指令和“内联快捷方式”

斜杠命令由 Gateway 网关处理。它们有几种不同的行为：

- **独立命令**：仅包含 `/...` 的消息会作为命令运行。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue` 会在模型看到消息前被移除。
  - 仅包含指令的消息会持久保存会话设置。
  - 普通消息中的内联指令会作为针对该消息的提示。
- **内联快捷方式**（仅限允许列表中的发送者）：普通消息中的某些 `/...` 令牌可以立即运行（例如：“你好 /status”），并会在模型看到剩余文本前被移除。

详情：[斜杠命令](/zh-CN/tools/slash-commands)。

## 会话、压缩和裁剪（哪些内容会保留）

消息之间保留哪些内容取决于所用机制：

- **普通历史记录**会保留在会话对话记录中，直到按策略压缩或裁剪。
- **压缩**会将摘要持久保存到对话记录中，并完整保留近期消息。
- **裁剪**会从_内存中_的提示词中移除旧工具结果，以释放上下文窗口空间，但不会重写会话对话记录——仍可在磁盘上检查完整历史记录。

文档：[会话](/zh-CN/concepts/session)、[压缩](/zh-CN/concepts/compaction)、[会话裁剪](/zh-CN/concepts/session-pruning)。

默认情况下，OpenClaw 使用内置的 `legacy` 上下文引擎进行组装和压缩。如果你安装了提供 `kind: "context-engine"` 的插件，并通过 `plugins.slots.contextEngine` 选择它，OpenClaw 会将上下文组装、`/compact` 以及相关的子智能体上下文生命周期钩子委托给该引擎。`ownsCompaction: false` 不会自动回退到 `legacy` 引擎；当前启用的引擎仍必须正确实现 `compact()`。有关完整的可插拔接口、生命周期钩子和配置，请参阅[上下文引擎](/zh-CN/concepts/context-engine)。

## `/context` 实际报告的内容

如果存在最新的**运行时构建**系统提示词报告，`/context` 会优先使用它：

- `System prompt (run)` = 从上一次嵌入式（支持工具）运行中捕获，并持久保存到会话存储中。
- `System prompt (estimate)` = 不存在运行报告时（或通过不会生成该报告的 CLI 后端运行时）即时计算。

无论哪种情况，它都会报告大小和主要占用来源；它**不会**转储完整的系统提示词或工具 schema。在详细模式下，它还会使用与压缩相同的真实对话消息判定规则来对照会话对话记录，从而更容易区分较高的提示词/缓存用量与可压缩的对话历史。

## 相关内容

<CardGroup cols={2}>
  <Card title="上下文引擎" href="/zh-CN/concepts/context-engine" icon="puzzle-piece">
    通过插件自定义上下文注入。
  </Card>
  <Card title="压缩" href="/zh-CN/concepts/compaction" icon="compress">
    总结长对话，使其保持在模型窗口范围内。
  </Card>
  <Card title="系统提示词" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    系统提示词的构建方式，以及它在每轮中注入的内容。
  </Card>
  <Card title="Agent loop" href="/zh-CN/concepts/agent-loop" icon="arrows-rotate">
    从入站消息到最终回复的完整智能体执行周期。
  </Card>
</CardGroup>
