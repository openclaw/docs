---
read_when:
    - 你想了解 “上下文” 在 OpenClaw 中是什么意思
    - 你正在调试为什么模型“知道”某些内容（或为什么它忘记了这些内容）
    - 你想降低上下文开销（`/context`、`/status`、`/compact`）
summary: 上下文：模型所见内容、其构建方式，以及如何检查它
title: 上下文
x-i18n:
    generated_at: "2026-04-18T03:31:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 477ccb1d9654968d0e904b6846b32b8c14db6b6c0d3d2ec2b7409639175629f9
    source_path: concepts/context.md
    workflow: 15
---

# 上下文

“上下文” 是 **OpenClaw 在一次运行中发送给模型的全部内容**。它受模型的 **上下文窗口**（token 限制）约束。

适合初学者的理解模型：

- **系统提示词**（由 OpenClaw 构建）：规则、工具、Skills 列表、时间/运行时，以及注入的工作区文件。
- **对话历史**：你在此会话中的消息 + 助手的消息。
- **工具调用/结果 + 附件**：命令输出、文件读取、图片/音频等。

上下文 _不等同于_ “记忆”：记忆可以存储在磁盘上并在之后重新加载；上下文则是模型当前窗口中的内容。

## 快速开始（检查上下文）

- `/status` → 快速查看“我的窗口用了多少？”以及会话设置。
- `/context list` → 查看注入了什么 + 大致大小（每个文件 + 总计）。
- `/context detail` → 更深入的拆分：每个文件、每个工具 schema 的大小、每个 skill 条目的大小，以及系统提示词大小。
- `/usage tokens` → 在普通回复后附加每次回复的用量页脚。
- `/compact` → 将较早的历史总结为一条精简条目，以释放窗口空间。

另请参阅：[Slash commands](/zh-CN/tools/slash-commands)、[Token use & costs](/zh-CN/reference/token-use)、[Compaction](/zh-CN/concepts/compaction)。

## 示例输出

具体数值会因模型、提供商、工具策略以及你的工作区内容而异。

### `/context list`

```
🧠 上下文拆分
工作区：<workspaceDir>
Bootstrap 每文件上限：12,000 个字符
沙箱：mode=non-main sandboxed=false
系统提示词（运行时）：38,412 个字符（约 9,603 tok）（Project Context 23,901 个字符（约 5,976 tok））

注入的工作区文件：
- AGENTS.md：正常 | 原始 1,742 个字符（约 436 tok）| 注入 1,742 个字符（约 436 tok）
- SOUL.md：正常 | 原始 912 个字符（约 228 tok）| 注入 912 个字符（约 228 tok）
- TOOLS.md：已截断 | 原始 54,210 个字符（约 13,553 tok）| 注入 20,962 个字符（约 5,241 tok）
- IDENTITY.md：正常 | 原始 211 个字符（约 53 tok）| 注入 211 个字符（约 53 tok）
- USER.md：正常 | 原始 388 个字符（约 97 tok）| 注入 388 个字符（约 97 tok）
- HEARTBEAT.md：缺失 | 原始 0 | 注入 0
- BOOTSTRAP.md：正常 | 原始 0 个字符（约 0 tok）| 注入 0 个字符（约 0 tok）

Skills 列表（系统提示词文本）：2,184 个字符（约 546 tok）（12 个 skill）
工具：read、edit、write、exec、process、browser、message、sessions_send、…
工具列表（系统提示词文本）：1,032 个字符（约 258 tok）
工具 schemas（JSON）：31,988 个字符（约 7,997 tok）（计入上下文；不显示为文本）
工具：（同上）

会话 tokens（已缓存）：总计 14,250 / ctx=32,000
```

### `/context detail`

```
🧠 上下文拆分（详细）
…
最大的 skills（提示词条目大小）：
- frontend-design：412 个字符（约 103 tok）
- oracle：401 个字符（约 101 tok）
…（另有 10 个）

最大的工具（schema 大小）：
- browser：9,812 个字符（约 2,453 tok）
- exec：6,240 个字符（约 1,560 tok）
…（另有 N 个）
```

## 哪些内容会计入上下文窗口

模型接收到的所有内容都会计入，包括：

- 系统提示词（所有部分）。
- 对话历史。
- 工具调用 + 工具结果。
- 附件/转录内容（图像/音频/文件）。
- 压缩摘要和修剪产物。
- 提供商“包装层”或隐藏头部（你看不到，但仍会计数）。

## OpenClaw 如何构建系统提示词

系统提示词由 **OpenClaw 持有**，并且会在每次运行时重新构建。它包括：

- 工具列表 + 简短说明。
- Skills 列表（仅元数据；见下文）。
- 工作区位置。
- 时间（UTC + 如已配置则转换后的用户时间）。
- 运行时元数据（主机/操作系统/模型/思考）。
- **Project Context** 下注入的工作区 bootstrap 文件。

完整拆分参见：[System Prompt](/zh-CN/concepts/system-prompt)。

## 注入的工作区文件（Project Context）

默认情况下，OpenClaw 会注入一组固定的工作区文件（如果存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅首次运行）

大文件会根据 `agents.defaults.bootstrapMaxChars`（默认 `12000` 个字符）按文件截断。OpenClaw 还会通过 `agents.defaults.bootstrapTotalMaxChars`（默认 `60000` 个字符）对所有文件的 bootstrap 注入总量设置上限。`/context` 会显示 **原始大小与注入大小**，以及是否发生了截断。

发生截断时，运行时可以在 Project Context 下方注入一个提示词内警告块。可通过 `agents.defaults.bootstrapPromptTruncationWarning` 配置此行为（`off`、`once`、`always`；默认 `once`）。

## Skills：注入与按需加载

系统提示词中包含一个精简的 **Skills 列表**（名称 + 描述 + 位置）。这个列表本身会带来真实的开销。

默认情况下不会包含 skill 指令本身。模型应当只在需要时 `read` 该 skill 的 `SKILL.md`。

## Tools：有两种成本

工具会以两种方式影响上下文：

1. 系统提示词中的 **工具列表文本**（你看到的 “Tooling”）。
2. **工具 schemas**（JSON）。这些会发送给模型，以便它调用工具。尽管你不会将它们视为普通文本看到，但它们仍计入上下文。

`/context detail` 会拆分最大的工具 schema，让你看到主要开销来自哪里。

## 命令、指令和“内联快捷方式”

Slash 命令由 Gateway 网关处理。这里有几种不同的行为：

- **独立命令**：如果一条消息只有 `/...`，则会作为命令执行。
- **指令**：`/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` 会在模型看到消息前被剥离。
  - 仅含指令的消息会持久化会话设置。
  - 普通消息中的内联指令会作为单条消息级别的提示。
- **内联快捷方式**（仅允许列表中的发送者）：普通消息中的某些 `/...` token 可以立即执行（例如：“hey /status”），并会在模型看到剩余文本前被剥离。

详情参见：[Slash commands](/zh-CN/tools/slash-commands)。

## 会话、压缩与修剪（哪些会持久化）

跨消息持久化的内容取决于具体机制：

- **普通历史** 会保存在会话转录中，直到被策略压缩/修剪。
- **压缩** 会将摘要持久化进转录中，并保留最近的消息不变。
- **修剪** 会从某次运行的 _内存中_ 提示词里移除旧的工具结果，但不会重写转录。

文档参见：[Session](/zh-CN/concepts/session)、[Compaction](/zh-CN/concepts/compaction)、[Session pruning](/zh-CN/concepts/session-pruning)。

默认情况下，OpenClaw 使用内置的 `legacy` 上下文引擎来进行组装和压缩。  
如果你安装了一个提供 `kind: "context-engine"` 的插件，并通过 `plugins.slots.contextEngine` 选中它，OpenClaw 会将上下文组装、`/compact` 以及相关的子智能体上下文生命周期 hook 委托给该引擎。`ownsCompaction: false` 不会自动回退到 legacy 引擎；当前激活的引擎仍必须正确实现 `compact()`。完整的可插拔接口、生命周期 hook 和配置请参见 [Context Engine](/zh-CN/concepts/context-engine)。

## `/context` 实际报告的是什么

在可用时，`/context` 会优先使用最新的 **运行时构建** 系统提示词报告：

- `System prompt (run)` = 从上一次嵌入式（可调用工具）运行中捕获，并持久化到会话存储中的报告。
- `System prompt (estimate)` = 在没有运行时报告时即时计算得出（或通过不生成该报告的 CLI 后端运行时）。

无论哪种方式，它都会报告大小和主要贡献项；它 **不会** 输出完整的系统提示词或工具 schema。

## 相关内容

- [Context Engine](/zh-CN/concepts/context-engine) — 通过插件进行自定义上下文注入
- [Compaction](/zh-CN/concepts/compaction) — 总结长对话
- [System Prompt](/zh-CN/concepts/system-prompt) — 系统提示词如何构建
- [Agent Loop](/zh-CN/concepts/agent-loop) — 完整的智能体执行周期
