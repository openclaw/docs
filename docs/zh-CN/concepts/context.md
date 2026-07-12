---
read_when:
    - 你想了解 OpenClaw 中的“上下文”是什么意思
    - 你正在调试模型为何“知道”某件事（或为何忘记了它）
    - 你想减少上下文开销（/context、/status、/compact）
summary: 上下文：模型看到的内容、其构建方式以及如何检查它
title: 上下文
x-i18n:
    generated_at: "2026-07-12T14:25:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

“上下文”是 **OpenClaw 为一次运行发送给模型的所有内容**。它受模型的**上下文窗口**（词元限制）约束。

初学者心智模型：

- **系统提示词**（由 OpenClaw 构建）：规则、工具、Skills 列表、时间/运行时，以及注入的工作区文件。
- **对话历史记录**：此会话中你的消息 + 助手的消息。
- **工具调用/结果 + 附件**：命令输出、文件读取内容、图像/音频等。

上下文与“记忆”_并不是一回事_：记忆可以存储在磁盘上并在以后重新加载；上下文则是模型当前窗口内的内容。

## 快速开始（检查上下文）

- `/status` → 快速查看“我的窗口已使用多少？”以及会话设置。
- `/context list` → 查看注入的内容及其大致大小（各文件 + 总计）。
- `/context detail` → 查看更深入的明细：各文件、各工具架构、各 Skills 条目和系统提示词的大小，以及可压缩的对话消息数。
- `/context map` → 当前会话中已跟踪上下文来源的 WinDirStat 风格树状图。
- `/usage tokens` → 在正常回复后附加每条回复的用量页脚。
- `/compact` → 将较早的历史记录总结成一个精简条目，以释放窗口空间。

另请参阅：[斜杠命令](/zh-CN/tools/slash-commands)、[词元使用量和成本](/zh-CN/reference/token-use)、[压缩](/zh-CN/concepts/compaction)。

## 输出示例

具体值因模型、提供商、工具策略以及工作区中的内容而异。

### `/context list`

```text
🧠 上下文明细
工作区：<workspaceDir>
引导文件最大字符数/文件：12,000 个字符
沙箱：mode=non-main sandboxed=false
系统提示词（运行）：38,412 个字符（约 9,603 个词元）（项目上下文 23,901 个字符（约 5,976 个词元））

注入的工作区文件：
- AGENTS.md：正常 | 原始 1,742 个字符（约 436 个词元）| 注入 1,742 个字符（约 436 个词元）
- SOUL.md：正常 | 原始 912 个字符（约 228 个词元）| 注入 912 个字符（约 228 个词元）
- TOOLS.md：已截断 | 原始 54,210 个字符（约 13,553 个词元）| 注入 20,962 个字符（约 5,241 个词元）
- IDENTITY.md：正常 | 原始 211 个字符（约 53 个词元）| 注入 211 个字符（约 53 个词元）
- USER.md：正常 | 原始 388 个字符（约 97 个词元）| 注入 388 个字符（约 97 个词元）
- HEARTBEAT.md：缺失 | 原始 0 | 注入 0
- BOOTSTRAP.md：正常 | 原始 0 个字符（约 0 个词元）| 注入 0 个字符（约 0 个词元）

Skills 列表（系统提示词文本）：2,184 个字符（约 546 个词元）（12 个 Skills）
工具：read、edit、write、exec、process、browser、message、sessions_send、……
工具列表（系统提示词文本）：1,032 个字符（约 258 个词元）
工具架构（JSON）：31,988 个字符（约 7,997 个词元）（计入上下文；不显示为文本）
工具：（同上）

会话词元（已缓存）：总计 14,250 / ctx=32,000
```

### `/context detail`

```text
🧠 上下文明细（详细）
……
主要 Skills（提示词条目大小）：
- frontend-design：412 个字符（约 103 个词元）
- oracle：401 个字符（约 101 个词元）
……（另有 10 个 Skills）

主要工具（架构大小）：
- browser：9,812 个字符（约 2,453 个词元）
- exec：6,240 个字符（约 1,560 个词元）
……（另有 N 个工具）
```

### `/context map`

发送根据最新缓存的运行报告和会话对话记录生成的图像。在正常消息于会话中生成运行报告之前，`/context map` 会返回不可用消息，而不会渲染估算图。矩形面积与跟踪的提示词字符数成正比：

- 对话记录（用户消息、助手回复、工具结果、压缩摘要），以及仅发送给模型的每轮运行时上下文和钩子提示词增补内容
- 注入的工作区文件
- 基础系统提示词文本
- Skills 提示词条目
- 工具 JSON 架构

对话组会随会话增长，因此图会逐轮变化；压缩后，它会折叠为一个摘要图块。

当没有缓存的运行报告时，`/context list`、`/context detail` 和 `/context json` 仍可检查按需生成的估算结果。

## 哪些内容会计入上下文窗口

模型收到的所有内容都会计入，包括：

- 系统提示词（所有部分）。
- 对话历史记录。
- 工具调用 + 工具结果。
- 附件/文字记录（图像/音频/文件）。
- 压缩摘要和剪枝工件。
- 提供商“包装器”或隐藏标头（不可见，但仍会计入）。

## OpenClaw 如何构建系统提示词

系统提示词**归 OpenClaw 所有**，并会在每次运行时重新构建。它包括：

- 工具列表 + 简短说明。
- Skills 列表（仅元数据；见下文）。
- 工作区位置。
- 时间（UTC + 已配置时转换后的用户时间）。
- 运行时元数据（主机/操作系统/模型/思考）。
- **项目上下文**下已注入的工作区引导文件。

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

对于大型文件，系统会使用 `agents.defaults.bootstrapMaxChars`（默认 `20000` 个字符）逐文件截断。OpenClaw 还会通过 `agents.defaults.bootstrapTotalMaxChars`（默认 `60000` 个字符）限制所有文件的引导注入总量。`/context` 会显示**原始大小与注入大小**，以及是否发生了截断。

发生截断时，运行时可以在 Project Context 下方注入一个提示词内警告块。可使用 `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；默认 `always`）进行配置。

## Skills：注入与按需加载

系统提示词包含一个精简的 **Skills 列表**（名称 + 描述 + 位置）。此列表会产生实际的上下文开销。

默认情况下，Skill 指令_不会_包含在内。模型应当**仅在需要时**`read` 该 Skill 的 `SKILL.md`。

## 工具：有两类开销

工具通过两种方式影响上下文：

1. 系统提示词中的**工具列表文本**（即你看到的 “Tooling”）。
2. **工具模式**（JSON）。这些模式会发送给模型，使其能够调用工具。即使你无法以纯文本形式看到它们，它们仍会计入上下文。

`/context detail` 会细分占用最大的工具模式，以便你了解哪些模式占用最多。

## 命令、指令和“内联快捷方式”

斜杠命令由 Gateway 网关处理。它们有以下几种不同的行为：

- **独立命令**：仅包含 `/...` 的消息会作为命令运行。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue` 会在模型看到消息前被移除。
  - 仅包含指令的消息会持久保存会话设置。
  - 普通消息中的内联指令会作为针对该消息的提示。
- **内联快捷命令**（仅限允许列表中的发送者）：普通消息中的某些 `/...` 标记可以立即运行（示例：“hey /status”），并会在模型看到剩余文本前被移除。

详情：[斜杠命令](/zh-CN/tools/slash-commands)。

## 会话、压缩和修剪（哪些内容会持久保留）

消息间持久保留的内容取决于所用机制：

- **正常历史记录**会持久保留在会话记录中，直到按策略进行压缩或修剪。
- **压缩**会将摘要持久保存到会话记录中，同时完整保留最近的消息。
- **修剪**会从_内存中_的提示词中移除旧的工具结果，以释放上下文窗口空间，但不会重写会话记录——完整历史记录仍可在磁盘上查看。

文档：[会话](/zh-CN/concepts/session)、[压缩](/zh-CN/concepts/compaction)、[会话修剪](/zh-CN/concepts/session-pruning)。

默认情况下，OpenClaw 使用内置的 `legacy` 上下文引擎进行上下文组装和
压缩。如果你安装了提供 `kind: "context-engine"` 的插件，并通过
`plugins.slots.contextEngine` 选择它，OpenClaw 会将上下文
组装、`/compact` 以及相关的子智能体上下文生命周期钩子委托给该
引擎。`ownsCompaction: false` 不会自动回退到旧版
引擎；当前引擎仍必须正确实现 `compact()`。有关完整的
可插拔接口、生命周期钩子和配置，请参阅
[上下文引擎](/zh-CN/concepts/context-engine)。

## `/context` 实际报告的内容

如果可用，`/context` 会优先采用最新的**运行时构建**系统提示词报告：

- `System prompt (run)` = 从上一次嵌入式（支持工具的）运行中捕获，并持久保存到会话存储中。
- `System prompt (estimate)` = 当不存在运行报告时（或通过不会生成该报告的 CLI 后端运行时）即时计算。

无论哪种方式，它都会报告大小和主要占用来源；但**不会**转储完整的系统提示词或工具 schema。在详细模式下，它还会使用与压缩相同的真实对话消息判定条件来比较会话记录，从而更容易区分较高的提示词/缓存用量和可压缩的对话历史记录。

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
    从收到消息到最终回复的完整智能体执行周期。
  </Card>
</CardGroup>
