---
read_when:
    - 编辑系统提示词文本、工具列表或时间/心跳章节
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含哪些内容以及如何组装
title: 系统提示词
x-i18n:
    generated_at: "2026-04-28T23:55:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次智能体运行构建自定义系统提示词。该提示词由 **OpenClaw 所有**，不使用 pi-coding-agent 默认提示词。

提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以提供支持缓存感知的提示词指导，而无需替换完整的 OpenClaw 所有提示词。提供商运行时可以：

- 替换一小组已命名的核心小节（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示词缓存边界上方注入一个**稳定前缀**
- 在提示词缓存边界下方注入一个**动态后缀**

使用提供商所有的贡献来进行模型系列专属调优。将旧版 `before_prompt_build` 提示词变更保留给兼容性或真正全局的提示词变更，而不是常规提供商行为。

OpenAI GPT-5 系列覆盖层会保持核心执行规则简短，并添加针对人设锁定、简洁输出、工具纪律、并行查询、交付物覆盖、验证、缺失上下文和终端工具规范的模型专属指导。

## 结构

提示词有意保持紧凑，并使用固定小节：

- **工具使用**：结构化工具真实来源提醒，以及运行时工具使用指导。
- **执行偏向**：紧凑的跟进指导：对可执行请求在当前轮次采取行动，持续推进直到完成或受阻，从较弱的工具结果中恢复，实时检查可变状态，并在最终回复前验证。
- **安全**：简短的护栏提醒，避免追求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 skill 指令。
- **OpenClaw 自我更新**：如何用 `config.schema.lookup` 安全检查配置，用 `config.patch` 修补配置，用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。仅限所有者的 `gateway` 工具也会拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括会规范化到这些受保护 exec 路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包），以及何时阅读它们。
- **工作区文件（已注入）**：表示引导文件已包含在下方。
- **沙箱**（启用时）：表示沙箱隔离运行时、沙箱路径，以及是否可用提权 exec。
- **当前日期和时间**：用户本地时间、时区和时间格式。
- **回复标签**：受支持提供商的可选回复标签语法。
- **心跳**：默认智能体启用心跳时的心跳提示词和确认行为。
- **运行时**：主机、操作系统、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + /reasoning 切换提示。

OpenClaw 会将大型稳定内容（包括**项目上下文**）保留在内部提示词缓存边界上方。易变的渠道/会话小节，例如 Control UI 嵌入指导、**消息**、**语音**、**群聊上下文**、**反应**、**心跳**和**运行时**，会追加到该边界下方，这样带前缀缓存的本地后端就能跨渠道轮次复用稳定的工作区前缀。同样，当接受的 schema 已经携带当前渠道名称这一运行时细节时，工具描述也应避免嵌入这些名称。

工具使用小节还包含长时间运行工作的运行时指导：

- 对未来跟进（`check back later`、提醒、周期性工作）使用 cron，而不是 `exec` sleep 循环、`yieldMs` 延迟技巧或重复的 `process` 轮询
- 仅将 `exec` / `process` 用于现在启动并在后台继续运行的命令
- 启用自动完成唤醒时，只启动一次命令，并在其输出内容或失败时依赖基于推送的唤醒路径
- 当需要检查正在运行的命令时，将 `process` 用于日志、Status、输入或干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是基于推送的，并会自动向请求者宣布
- 不要循环轮询 `subagents list` / `sessions_list` 只是为了等待完成

启用实验性 `update_plan` 工具时，工具使用小节还会告诉模型仅在非平凡的多步骤工作中使用它，保持恰好一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示词中的安全护栏是建议性的。它们指导模型行为，但不强制执行策略。请使用工具策略、exec 批准、沙箱隔离和渠道 allowlist 进行强制执行；运营者可按设计禁用这些机制。

在带有原生批准卡片/按钮的渠道上，运行时提示词现在会告诉智能体优先依赖该原生批准 UI。只有当工具结果表明聊天批准不可用，或手动批准是唯一路径时，才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置一个 `promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上方所有小节。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw 自我更新**、**模型别名**、**用户身份**、**回复标签**、**消息**、**静默回复**和**心跳**。工具使用、**安全**、工作区、沙箱、当前日期和时间（已知时）、运行时以及已注入上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为**子智能体上下文**，而不是**群聊上下文**。

对于渠道自动回复运行，当直接/群聊上下文已经包含解析后的会话专属 `NO_REPLY` 行为时，OpenClaw 可以省略通用的**静默回复**小节。这可以避免在全局系统提示词和渠道上下文中重复 token 机制。

## 工作区引导注入

引导文件会被裁剪并追加到**项目上下文**下方，使模型无需显式读取即可看到身份和档案上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅用于全新的工作区）
- `MEMORY.md`（存在时）

除非适用特定文件的门控，否则每轮都会将所有这些文件**注入到上下文窗口**中。当默认智能体禁用心跳，或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，正常运行会省略 `HEARTBEAT.md`。请保持注入文件简洁，尤其是 `MEMORY.md`，它会随时间增长，并导致上下文使用量意外偏高和更频繁的压缩。

<Note>
`memory/*.md` 每日文件**不**属于常规引导项目上下文。在普通轮次中，它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型明确读取它们，否则不会占用上下文窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以将最近的每日记忆作为一次性启动上下文块前置到该第一轮。
</Note>

大文件会带标记截断。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认值：12000）。跨文件注入的引导内容总量由 `agents.defaults.bootstrapTotalMaxChars` 限制（默认值：60000）。缺失文件会注入简短的缺失文件标记。发生截断时，OpenClaw 可以在项目上下文中注入警告块；通过 `agents.defaults.bootstrapPromptTruncationWarning` 控制它（`off`、`once`、`always`；默认值：`once`）。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截此步骤，以变更或替换注入的引导文件（例如将 `SOUL.md` 替换为备用 persona）。

如果你想让智能体听起来不那么泛泛，可以从 [SOUL.md 人格指南](/zh-CN/concepts/soul)开始。

要检查每个注入文件贡献了多少内容（原始与注入、截断情况，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见[上下文](/zh-CN/concepts/context)。

## 时间处理

当用户时区已知时，系统提示词会包含专用的**当前日期和时间**小节。为了保持提示词缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，使用 `session_status`；Status 卡片包含时间戳行。同一工具也可以选择设置按会话的模型覆盖（`model=default` 会清除它）。

通过以下配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为详情见[日期和时间](/zh-CN/date-time)。

## Skills

当存在符合条件的 skills 时，OpenClaw 会注入一个紧凑的**可用 skills 列表**（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。提示词会指示模型使用 `read` 加载列出位置（工作区、托管或内置）中的 SKILL.md。如果没有符合条件的 skills，则省略 Skills 小节。

资格包括 skill 元数据门控、运行时环境/配置检查，以及配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时的有效智能体 skill allowlist。

插件内置的 skills 只有在其所属插件启用时才符合条件。这允许工具插件暴露更深入的操作指南，而无需将所有指导直接嵌入每个工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这可以保持基础提示词较小，同时仍支持有针对性的 skill 使用。

skills 列表预算由 skills 子系统所有：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 按智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用不同的表面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分会将 skills 大小控制与运行时读取/注入大小控制分开，例如 `memory_get`、实时工具结果和压缩后的 AGENTS.md 刷新。

## 文档

系统提示词包含一个**文档**小节。当本地文档可用时，它会指向本地 OpenClaw 文档目录（Git checkout 中的 `docs/` 或内置 npm 包文档）。如果本地文档不可用，则回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一小节还包含 OpenClaw 源码位置。Git checkout 会暴露本地源码根目录，以便智能体可以直接检查代码。包安装会包含 GitHub 源码 URL，并告诉智能体在文档不完整或过时时到那里查看源码。提示词还会提及公共文档镜像、社区 Discord 和用于发现 skills 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。它会告诉模型，针对 OpenClaw 行为、命令、配置或架构，应优先查阅文档，并在可行时自行运行 `openclaw status`（只有在缺少访问权限时才询问用户）。对于配置，它会特别指向 `gateway` 工具动作 `config.schema.lookup`，用于获取精确的字段级文档和约束，然后再指向 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 获取更广泛的指导。

## 相关

- [智能体运行时](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
