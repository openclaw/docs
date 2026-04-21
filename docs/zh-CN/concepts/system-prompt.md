---
read_when:
    - 编辑系统提示词文本、工具列表或时间/心跳部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么内容，以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-04-21T03:21:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# 系统提示词

OpenClaw 会为每次智能体运行构建一个自定义系统提示词。该提示词**由 OpenClaw 自行管理**，不会使用 `pi-coding-agent` 的默认提示词。

该提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以提供具备缓存感知能力的提示词指引，而无需替换整个由 OpenClaw 管理的提示词。提供商运行时可以：

- 替换一小组具名核心部分（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示词缓存边界上方注入**稳定前缀**
- 在提示词缓存边界下方注入**动态后缀**

对于特定模型家族的调优，请使用由提供商管理的贡献。保留旧版 `before_prompt_build` 提示词变更机制，仅用于兼容性场景或真正的全局提示词变更，而不是常规的提供商行为。

OpenAI GPT-5 系列覆盖层会保持核心执行规则简洁，同时增加模型特定指引，涵盖角色锁定、简洁输出、工具使用纪律、并行查找、交付物覆盖、验证、缺失上下文以及终端工具使用规范。

## 结构

该提示词刻意保持紧凑，并使用固定部分：

- **工具**：结构化工具的权威来源提醒，以及运行时工具使用指引。
- **执行倾向**：简洁的持续执行指引：对可执行请求在当前轮次直接行动，持续直到完成或被阻塞，从较弱的工具结果中恢复，实时检查可变状态，并在最终完成前进行验证。
- **安全**：简短的护栏提醒，避免权力寻求行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 Skill 指令。
- **OpenClaw 自我更新**：如何使用 `config.schema.lookup` 安全检查配置，使用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。仅限所有者使用的 `gateway` 工具也会拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括会规范化到这些受保护执行路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时阅读它们。
- **工作区文件（已注入）**：表示下方包含引导文件。
- **沙箱**（启用时）：表示当前为沙箱隔离运行时、沙箱路径，以及是否可用提权执行。
- **当前日期与时间**：用户本地时间、时区和时间格式。
- **回复标签**：受支持提供商的可选回复标签语法。
- **心跳**：启用默认智能体心跳时的心跳提示与确认行为。
- **运行时**：主机、操作系统、Node、模型、仓库根目录（如检测到）、思考级别（一行）。
- **推理**：当前可见性级别 + `/reasoning` 切换提示。

“工具”部分还包含针对长时间运行任务的运行时指引：

- 对于未来的后续跟进（`check back later`、提醒、周期性工作），使用 `cron`，而不是 `exec` 睡眠循环、`yieldMs` 延迟技巧或重复 `process` 轮询
- 仅对“现在启动并在后台持续运行”的命令使用 `exec` / `process`
- 启用自动完成唤醒时，只启动命令一次，并在其产生输出或失败时依赖基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是基于推送的，并会自动向请求方回报
- 不要为了等待完成而循环轮询 `subagents list` / `sessions_list`

启用实验性 `update_plan` 工具时，“工具”部分还会告诉模型：仅将其用于非简单的多步骤工作，始终保持且仅保持一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示词中的安全护栏属于建议性内容。它们用于引导模型行为，但不强制执行策略。若要进行硬性约束，请使用工具策略、执行审批、沙箱隔离和渠道允许列表；从设计上讲，运营者可以禁用这些机制。

在具有原生审批卡片/按钮的渠道中，运行时提示词现在会告诉智能体优先依赖该原生审批 UI。只有当工具结果表明聊天审批不可用，或者手动审批是唯一途径时，它才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置一个 `promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上述所有部分。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw 自我更新**、**模型别名**、**用户身份**、**回复标签**、**消息传递**、**静默回复** 和 **心跳**。工具、**安全**、工作区、沙箱、当前日期与时间（如已知）、运行时以及注入的上下文仍然可用。
- `none`：只返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为 **子智能体上下文**，而不是 **群聊上下文**。

## 工作区引导注入

引导文件会被裁剪后追加到 **项目上下文** 下，这样模型无需显式读取就能看到身份和配置文件上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区中）
- 存在时使用 `MEMORY.md`，否则回退为小写形式的 `memory.md`

除非存在文件级门控，否则上述所有文件都会在每一轮**注入到上下文窗口中**。在默认智能体禁用心跳，或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false 的普通运行中，`HEARTBEAT.md` 会被省略。请保持注入文件简洁——尤其是 `MEMORY.md`，它会随着时间增长，并可能导致上下文使用量意外升高以及更频繁的压缩。

> **注意：** `memory/*.md` 每日文件**不属于**常规引导“项目上下文”的一部分。在普通轮次中，它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取，否则不会占用上下文窗口。纯 `/new` 和 `/reset` 轮次是例外：运行时可以为第一次轮次预置最近的每日记忆，作为一次性启动上下文块。

大文件会使用标记进行截断。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件注入的引导内容总量上限由 `agents.defaults.bootstrapTotalMaxChars` 控制（默认：60000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，OpenClaw 可以在项目上下文中注入警告块；可通过 `agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；默认：`once`）。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截此步骤，以变更或替换注入的引导文件（例如将 `SOUL.md` 替换为另一种角色设定）。

如果你想让智能体听起来不那么泛化，可以先从 [SOUL.md Personality Guide](/zh-CN/concepts/soul) 开始。

如果你想检查每个注入文件各自贡献了多少内容（原始大小与注入后大小、截断情况，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [上下文](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示词会包含专门的**当前日期与时间**部分。为了保持提示词缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；状态卡片中包含时间戳行。该工具也可以选择设置每个会话的模型覆盖（`model=default` 会清除覆盖）。

可通过以下配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节请参见 [日期与时间](/zh-CN/date-time)。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入一个紧凑的**可用 Skills 列表**（`formatSkillsForPrompt`），其中包含每个 Skill 的**文件路径**。提示词会指示模型使用 `read` 加载列出位置中的 `SKILL.md`（工作区、托管或内置位置）。如果没有符合条件的 Skills，则省略 Skills 部分。

资格条件包括 Skill 元数据门控、运行时环境/配置检查，以及在配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时的有效智能体 Skill 允许列表。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这样可以让基础提示词保持简短，同时仍然支持有针对性的 Skill 使用。

Skills 列表的预算由 Skills 子系统负责：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 每智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用不同的配置面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分让 Skills 大小控制与运行时读取/注入大小控制分离，例如 `memory_get`、实时工具结果，以及压缩后对 `AGENTS.md` 的刷新。

## 文档

可用时，系统提示词会包含一个**文档**部分，指向 OpenClaw 文档目录的本地路径（仓库工作区中的 `docs/` 或 npm 包内置文档），并同时说明公开镜像、源代码仓库、社区 Discord 以及用于发现 Skills 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。提示词会指示模型在处理 OpenClaw 行为、命令、配置或架构时优先查阅本地文档，并在可能时自行运行 `openclaw status`（只有在无法访问时才询问用户）。
