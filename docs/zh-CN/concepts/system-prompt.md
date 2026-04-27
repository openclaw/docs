---
read_when:
    - 编辑系统提示词文本、工具列表或时间/心跳部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么，以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-04-27T22:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28339bd25e79c152448d66e4e0c679ff384913e12890f6f67c9c97ddacd4ddbe
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw 会为每次智能体运行构建一个自定义系统提示词。该提示词由 **OpenClaw 自主维护**，不会使用 pi-coding-agent 的默认提示词。

该提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以贡献具备缓存感知能力的提示词指导，而无需替换完整的 OpenClaw 自有提示词。提供商运行时可以：

- 替换一小组已命名的核心区段（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示词缓存边界之上注入一个**稳定前缀**
- 在提示词缓存边界之下注入一个**动态后缀**

将提供商自有的贡献用于针对特定模型家族的调优。保留传统的
`before_prompt_build` 提示词变更方式，仅用于兼容性或真正的全局提示词变更，而不是常规的提供商行为。

OpenAI GPT-5 系列覆盖层会保持核心执行规则简洁，并添加模型特定的指导，涵盖角色锁定、简洁输出、工具纪律、并行查找、交付物覆盖、验证、缺失上下文以及终端工具使用规范。

## 结构

该提示词有意保持紧凑，并使用固定区段：

- **Tooling**：结构化工具“事实来源”提醒，以及运行时工具使用指导。
- **Execution Bias**：精简的贯彻执行指导：对可执行请求在当前轮次内采取行动，持续执行直到完成或受阻，从较弱的工具结果中恢复，实时检查可变状态，并在最终输出前完成验证。
- **Safety**：简短的护栏提醒，避免追求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载技能说明。
- **OpenClaw Self-Update**：如何使用
  `config.schema.lookup` 安全检查配置，使用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，并且只在用户明确请求时运行 `update.run`。仅限所有者使用的 `gateway` 工具也会拒绝重写
  `tools.exec.ask` / `tools.exec.security`，包括会被规范化到这些受保护执行路径的旧版 `tools.bash.*`
  别名。
- **Workspace**：工作目录（`agents.defaults.workspace`）。
- **Documentation**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时阅读它们。
- **Workspace Files (injected)**：表示引导文件已在下方注入。
- **Sandbox**（启用时）：表示运行时已启用沙箱隔离、沙箱路径以及是否可使用提权执行。
- **Current Date & Time**：用户本地时间、时区和时间格式。
- **Reply Tags**：受支持提供商的可选回复标签语法。
- **Heartbeats**：心跳提示词和确认行为，在默认智能体启用心跳时显示。
- **Runtime**：主机、操作系统、node、模型、仓库根目录（如检测到）、思考级别（一行）。
- **Reasoning**：当前可见性级别 + `/reasoning` 切换提示。

Tooling 区段还包含针对长时间运行工作的运行时指导：

- 对未来的后续操作（`check back later`、提醒、周期性工作）使用 cron，而不是使用 `exec` 的 sleep 循环、`yieldMs` 延迟技巧或反复轮询 `process`
- `exec` / `process` 仅用于那些现在启动并会继续在后台运行的命令
- 启用自动完成唤醒时，只启动命令一次，并在其输出结果或失败时依赖基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是基于推送的，并会自动向请求方回报
- 不要为了等待完成而在循环中轮询 `subagents list` / `sessions_list`

启用实验性 `update_plan` 工具时，Tooling 还会告诉模型：仅将其用于非平凡的多步骤工作，始终保持且仅保持一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示词中的安全护栏仅为建议性内容。它们用于引导模型行为，但不强制执行策略。若要进行硬性约束，应使用工具策略、执行审批、沙箱隔离和渠道允许列表；按设计，运维人员可以禁用这些机制。

在具有原生审批卡片/按钮的渠道中，运行时提示词现在会告诉智能体优先依赖该原生审批 UI。只有当工具结果表明聊天内审批不可用，或者手动审批是唯一途径时，它才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置一个
`promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上述所有区段。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw
  Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、
  **Messaging**、**Silent Replies** 和 **Heartbeats**。Tooling、**Safety**、
  Workspace、Sandbox、Current Date & Time（已知时）、Runtime 以及注入的
  上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为 **Subagent
Context**，而不是 **Group Chat Context**。

对于渠道自动回复运行，如果直接/群聊上下文已经包含已解析的、特定于会话的
`NO_REPLY` 行为，OpenClaw 可以省略通用的 **Silent Replies** 区段。这样可以避免在全局系统提示词和渠道上下文中重复 token 机制。

## 工作区引导注入

引导文件会被裁剪并附加在 **Project Context** 下，以便模型无需显式读取就能看到身份和配置档案上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区中）
- 存在时注入 `MEMORY.md`

除非某个文件适用特定的门控条件，否则上述所有文件在每一轮中都会**注入到上下文窗口**。在普通运行中，如果默认智能体未启用心跳，或者
`agents.defaults.heartbeat.includeSystemPromptSection` 为 false，则会省略
`HEARTBEAT.md`。请保持注入文件简洁——尤其是 `MEMORY.md`，它可能会随着时间增长，导致上下文使用量意外升高以及更频繁的压缩。

<Note>
`memory/*.md` 每日文件**不**属于常规的引导 Project Context。在普通轮次中，它们会通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取，否则不会占用上下文窗口。纯 `/new` 和 `/reset` 轮次是例外：运行时可以将最近的每日记忆作为一次性的启动上下文块预置到该第一轮中。
</Note>

大文件会以标记形式截断。每个文件的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（默认值：12000）。跨文件注入的引导内容总量上限由 `agents.defaults.bootstrapTotalMaxChars`
控制（默认值：60000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，OpenClaw 可以在 Project Context 中注入一个警告块；可通过
`agents.defaults.bootstrapPromptTruncationWarning` 控制
（`off`、`once`、`always`；默认值：`once`）。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截这一步，以变更或替换注入的引导文件（例如将 `SOUL.md` 替换为其他角色设定）。

如果你想让智能体听起来不那么通用，可以从
[SOUL.md Personality Guide](/zh-CN/concepts/soul) 开始。

如果你想检查每个注入文件各自贡献了多少内容（原始大小 vs 注入大小、截断情况，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示词会包含一个专门的 **Current Date & Time** 区段。为了保持提示词缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；状态卡片包含时间戳行。同一个工具还可以按会话设置模型覆盖（`model=default` 会清除它）。

可通过以下配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节请参见 [Date & Time](/zh-CN/date-time)。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入一个紧凑的**可用技能列表**
（`formatSkillsForPrompt`），其中包含每个技能的**文件路径**。提示词会指导模型使用 `read` 加载列出位置中的 SKILL.md（工作区、托管或内置）。如果没有符合条件的 Skills，则省略 Skills 区段。

资格条件包括技能元数据门控、运行时环境/配置检查，以及在配置了
`agents.defaults.skills` 或 `agents.list[].skills` 时生效的智能体技能允许列表。

插件内置的 Skills 仅在其所属插件启用时才符合条件。这样，工具插件就可以暴露更深入的操作指南，而无需把所有这些指导直接嵌入到每个工具说明中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这样可以让基础提示词保持精简，同时仍能支持有针对性的技能使用。

技能列表的预算由技能子系统负责：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 每个智能体的覆盖配置：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用不同的配置面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分让 Skills 的尺寸控制独立于运行时读取/注入尺寸控制，例如
`memory_get`、实时工具结果以及压缩后重新刷新的 AGENTS.md。

## Documentation

系统提示词包含一个 **Documentation** 区段。当本地文档可用时，它会指向本地 OpenClaw 文档目录（Git 检出中的 `docs/` 或内置的 npm 包文档）。如果本地文档不可用，则会回退到
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一区段还包含 OpenClaw 源码位置。Git 检出会暴露本地源码根目录，以便智能体直接检查代码。包安装则包含 GitHub 源码 URL，并告诉智能体在文档不完整或过时时到那里查看源码。提示词还会注明公开文档镜像、社区 Discord，以及用于发现 Skills 的 ClawHub
（[https://clawhub.ai](https://clawhub.ai)）。它会告诉模型：对于 OpenClaw 的行为、命令、配置或架构，应优先查阅文档；并在可能时自行运行 `openclaw status`（只有在无法访问时才询问用户）。
对于配置，提示词会特别引导智能体先使用 `gateway` 工具动作
`config.schema.lookup` 获取精确到字段级别的文档和约束，然后再查看
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
以获得更广泛的指导。

## 相关内容

- [Agent runtime](/zh-CN/concepts/agent)
- [Agent workspace](/zh-CN/concepts/agent-workspace)
- [Context engine](/zh-CN/concepts/context-engine)
