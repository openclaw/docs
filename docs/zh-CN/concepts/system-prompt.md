---
read_when:
    - 编辑系统提示文本、工具列表或时间/Heartbeat 章节
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含的内容及其组装方式
title: 系统提示词
x-i18n:
    generated_at: "2026-07-05T11:16:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次 agent 运行构建自己的系统提示；没有运行时默认提示。

组装分为三层：

- `buildAgentSystemPrompt` 根据显式输入渲染提示。它保持为纯渲染器，不直接读取全局配置。
- `resolveAgentSystemPromptConfig` 为特定 agent 解析由配置支持的提示旋钮（所有者显示、TTS 提示、模型别名、记忆引用模式、子智能体委派模式）。
- 运行时适配器（嵌入式、CLI、命令/导出预览、压缩）收集实时事实（工具、沙箱状态、渠道能力、上下文文件、提供商提示贡献），并调用已配置的提示 facade。

这样可以让导出/调试提示表面与实时运行保持一致，而不会把每个运行时细节都变成一个单体构建器。

提供商插件可以贡献可感知缓存的指导，而不替换 OpenClaw 拥有的提示。提供商运行时可以：

- 替换三个具名核心 section 之一：`interaction_style`、`tool_call_style`、`execution_bias`
- 在提示缓存边界上方注入一个**稳定前缀**
- 在提示缓存边界下方注入一个**动态后缀**

将提供商拥有的贡献用于模型系列特定调优。将旧版 `before_prompt_build` 钩子保留给兼容性或真正全局的提示变更。

内置 OpenAI/Codex GPT-5 系列 overlay（`resolveGpt5SystemPromptContribution`）使用此机制：一个 `stablePrefix` 行为契约（执行策略、工具纪律、输出契约、完成契约），加上可选的 `interaction_style` override 来提供更友好的语气。它适用于通过 OpenAI 或 Codex 插件路由的任何 `gpt-5*` 模型 id，由 `agents.defaults.promptOverlays.gpt5.personality`（`"friendly"`/`"on"` 或 `"off"`）控制。

## 结构

提示很紧凑，包含固定 section：

- **工具**：结构化工具事实来源提醒，以及运行时工具使用指导。当实验性 `update_plan` 工具启用（`tools.experimental.planTool`）时，它自己的工具描述会补充：仅用于非平凡的多步骤工作，最多保持一个步骤为 `in_progress`，并在简单的一步工作中跳过。
- **执行偏向**：对可操作请求在当前轮次内行动，持续直到完成或受阻，从弱工具结果中恢复，实时检查可变状态，并在最终回复前验证。
- **安全**：简短的护栏提醒，避免追求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载技能说明。
- **OpenClaw Control**：配置/重启工作优先使用 `gateway` 工具；不要编造 CLI 命令。
- **OpenClaw 自更新**：使用 `config.schema.lookup` 安全检查配置，使用 `config.patch` 打补丁，使用 `config.apply` 替换完整配置，并且只在用户明确请求时运行 `update.run`。面向 agent 的 `gateway` 工具拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括会规范化为这些受保护路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：本地文档/源路径，以及何时读取它们。
- **工作区文件（已注入）**：说明 bootstrap 文件已包含在下方。
- **沙箱**（启用时）：沙箱隔离的运行时、沙箱路径、提升权限 exec 可用性。
- **当前日期和时间**：仅时区（缓存稳定；实时钟表来自 `session_status`）。
- **Assistant 输出指令**：紧凑的附件、语音备注和回复标签语法。
- **Heartbeats**：当默认 agent 启用心跳时，提供心跳提示和确认行为。
- **运行时**：主机、OS、node、模型、仓库根目录（检测到时）、thinking 级别（一行）。
- **推理**：当前可见性级别，以及 `/reasoning` 切换提示。

大型稳定内容（包括**项目上下文**）保持在内部提示缓存边界上方。易变的逐轮 section（Control UI 嵌入指导、**消息**、**语音**、**群聊上下文**、**表情回应**、**Heartbeats**、**运行时**）会追加到该边界下方，这样带有前缀缓存的本地后端就能跨渠道轮次复用稳定的工作区前缀。当已接受的 schema 已经携带当前渠道名称这类运行时细节时，工具描述应避免嵌入这些名称。

工具还携带长时间运行工作指导：

- 对未来跟进（`check back later`、提醒、重复性工作）使用 cron，而不是 `exec` sleep 循环、`yieldMs` 延迟技巧或重复的 `process` 轮询
- 只对现在启动并在后台继续运行的命令使用 `exec` / `process`
- 启用自动完成唤醒时，只启动一次命令，并依赖基于推送的唤醒路径
- 对正在运行的命令，使用 `process` 查看日志、状态、输入或干预
- 对更大的任务，优先使用 `sessions_spawn`；子智能体完成是基于推送的，并会自动向请求者公告
- 不要在循环中轮询 `subagents list` / `sessions_list`，只是为了等待完成

`agents.defaults.subagents.delegationMode`（默认 `"suggest"`）可以加强这一点。`"prefer"` 会添加一个专门的**子智能体委派** section，告诉主 agent 作为响应式协调者行动，并将比直接回复更复杂的任何内容通过 `sessions_spawn` 推送出去。这只是提示层面的；工具策略仍控制 `sessions_spawn` 是否可用。

系统提示中的安全护栏是建议性的，不是强制执行。使用工具策略、exec 审批、沙箱隔离和渠道 allowlist 做硬性强制；操作员可以按设计禁用提示护栏。

在带有原生审批卡片/按钮的渠道上，提示会告诉 agent 优先依赖该 UI，并且只有当工具结果说明聊天审批不可用或手动审批是唯一路径时，才包含手动 `/approve` 命令。

## 提示模式

OpenClaw 会为子智能体渲染更小的系统提示。运行时会为每次运行设置 `promptMode`（不是面向用户的配置）：

- `full`（默认）：上面的全部 section。
- `minimal`：用于子智能体；省略记忆提示 section（作为 **Memory Recall** 内置）、**OpenClaw 自更新**、**模型别名**、**用户身份**、**Assistant 输出指令**、**消息**、**静默回复**和 **Heartbeats**。工具、**安全**、**Skills**（提供时）、工作区、沙箱、当前日期和时间（已知时）、运行时以及注入的上下文仍然可用。
- `none`：只返回基础身份行。

在 `promptMode=minimal` 下，额外注入的提示会标记为**子智能体上下文**，而不是**群聊上下文**。

对于渠道自动回复运行，当直接、群组或仅消息工具上下文已经拥有可见回复契约时，OpenClaw 会省略通用的**静默回复** section。只有旧版自动群组/渠道模式会显示 `NO_REPLY`；直接聊天和仅消息工具回复会跳过静默 token 指导。

## 提示快照

OpenClaw 在 `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下为 Codex 运行时 happy path 保留已提交的提示快照。它们会渲染选定的 app-server 线程/轮次参数，以及为 Telegram 直接聊天、Discord 群组和心跳轮次重建的模型绑定提示层栈：固定的 Codex `gpt-5.5` 模型提示 fixture、Codex happy-path 权限 developer 文本、OpenClaw developer 指令、当 OpenClaw 提供时的轮次作用域协作模式指令、用户轮次输入，以及对动态工具规格的引用。

使用 `pnpm prompt:snapshots:sync-codex-model` 刷新固定的 Codex 模型提示 fixture。默认情况下，它会查找 `$CODEX_HOME/models_cache.json`，然后是 `~/.codex/models_cache.json`，然后是维护者 checkout 约定路径 `~/code/codex/codex-rs/models-manager/models.json`；如果都不存在，它会退出而不更改已提交的 fixture。传入 `--catalog <path>` 可以从特定的 `models_cache.json` 或 `models.json` 文件刷新。

这些快照不是逐字节的原始 OpenAI 请求捕获。Codex 可以在 OpenClaw 发送线程和轮次参数之后，添加运行时拥有的工作区上下文（`AGENTS.md`、环境上下文、记忆、app/插件指令、内置 Default 协作模式指令）。

使用 `pnpm prompt:snapshots:gen` 重新生成；使用 `pnpm prompt:snapshots:check` 验证漂移。CI 会在 additional-boundary shards 旁运行漂移检查，因此提示变更和快照更新会在同一个 PR 中落地。

## 工作区 bootstrap 注入

Bootstrap 文件会从活动工作区解析，并路由到与其生命周期匹配的提示表面：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区中）
- 存在时的 `MEMORY.md`

在原生 Codex harness 上，OpenClaw 避免在每个用户轮次中重复稳定的工作区文件。Codex 会通过自己的项目文档发现加载 `AGENTS.md`。`TOOLS.md` 会作为继承的 Codex developer 指令转发。`SOUL.md`、`IDENTITY.md` 和 `USER.md` 会作为轮次作用域协作 developer 指令转发，因此原生 Codex 子智能体不会继承它们。`HEARTBEAT.md` 内容不会直接注入；当文件存在且非空时，心跳轮次会得到一条指向该文件的协作模式备注。`MEMORY.md` 内容也不会粘贴到每个原生 Codex 轮次中：当工作区可用记忆工具时，Codex 轮次会得到一条简短的工作区记忆备注，引导模型使用 `memory_search` 或 `memory_get`。如果工具已禁用、记忆搜索不可用，或活动工作区不同于 agent 记忆工作区，`MEMORY.md` 会回退到正常的有界轮次上下文路径。`BOOTSTRAP.md` 保持正常轮次上下文角色。

在非 Codex harness 上，bootstrap 文件会根据其现有门控组合进 OpenClaw 提示。当默认 agent 禁用心跳，或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，`HEARTBEAT.md` 会在正常运行中省略。保持注入文件简洁，尤其是非 Codex 的 `MEMORY.md`：它应保持为精选的长期摘要，详细的每日笔记放在 `memory/*.md` 中，并可按需通过 `memory_search` / `memory_get` 检索。过大的非 Codex `MEMORY.md` 文件会增加提示用量，并可能在下面的 bootstrap 文件限制下被部分注入。

<Note>
`memory/*.md` 每日文件**不**属于正常 bootstrap 项目上下文。在普通轮次中，它们通过 `memory_search` / `memory_get` 按需访问，因此除非模型显式读取它们，否则不会占用上下文窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以为第一个轮次前置最近的每日记忆，作为一次性启动上下文块。
</Note>

大文件会带标记截断：

| 限制                                         | 配置键                                           | 默认值   |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| 每文件最大字符数                             | `agents.defaults.bootstrapMaxChars`                | 20000    |
| 所有文件合计                                 | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| 截断警告（`off`\|`once`\|`always`）          | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

缺失文件会注入一个简短的缺失文件标记。详细的原始/注入计数会保留在诊断中，例如 `/context`、`/status`、Doctor 和日志。

对于记忆文件，截断不是数据丢失：文件会在磁盘上保持完整。在原生 Codex 上，`MEMORY.md` 会在可用时通过记忆工具按需读取，否则使用有界提示回退。在其他 harness 上，模型只会看到缩短后的注入副本，直到它直接读取或搜索记忆。如果 `MEMORY.md` 反复被截断，请将其提炼为更短的持久摘要，将详细历史移动到 `memory/*.md`，或有意提高 bootstrap 限制。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他启动文件会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 事件拦截此步骤，以修改或替换注入的启动文件（例如将 `SOUL.md` 换成另一种 persona）。

为了让表达不那么泛泛而谈，请从 [SOUL.md 个性指南](/zh-CN/concepts/soul) 开始。

要检查每个注入文件贡献了多少内容（原始与注入、截断、工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见[上下文](/zh-CN/concepts/context)。

## 时间处理

**当前日期和时间**部分仅在已知用户时区时出现，并且只包含**时区**（没有动态时钟或时间格式），以保持提示缓存稳定。

当智能体需要当前时间时，请使用 `session_status`；它的状态卡包含一行时间戳。同一个工具也可以选择性地设置每会话模型覆盖（`model=default` 会清除它）。

配置项：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为详情请参见[时区](/zh-CN/concepts/timezone)和[日期和时间](/zh-CN/date-time)。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入一个紧凑的 `<available_skills>` 列表（`formatSkillsForPrompt`），其中包含每个技能的**文件路径**以及从内容派生的 `<version>sha256:...</version>` 标记。提示会指示模型使用 `read` 加载所列位置（工作区、托管或内置）的 SKILL.md，并在某个技能的 `<version>` 与上一轮不同时重新读取该技能。如果没有符合条件的 Skills，则省略 Skills 部分。

Native Codex 轮次会将此列表作为轮次范围的协作开发者指令接收，而不是作为每轮用户输入；但保留精确计划提示的轻量 cron 轮次除外。其他 harness 保持正常的提示部分。

位置可以指向嵌套技能，例如 `skills/personal/foo/SKILL.md`。嵌套仅用于组织；提示会使用 `SKILL.md` frontmatter 中的扁平技能名称。

符合条件性包括技能元数据门控、运行时环境/配置检查，以及在配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时生效的智能体技能允许列表。插件内置的技能只有在其所属插件启用时才符合条件，这使工具插件可以暴露更深入的操作指南，而无需把所有这些指导都嵌入每个工具描述中。

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

这样既能保持基础提示较小，又能启用有针对性的技能使用。大小由 Skills 子系统负责，独立于通用运行时读取/注入大小：

| 范围      | Skills 提示预算                                  | 运行时摘录预算                    |
| --------- | ------------------------------------------------- | --------------------------------- |
| 全局      | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*` |
| 每智能体  | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`   |

运行时摘录预算覆盖 `memory_get`、实时工具结果，以及压缩后的 `AGENTS.md` 刷新。

## 文档

**文档**部分会在可用时指向本地文档（Git checkout 中的 `docs/`，或内置的 npm 包文档），否则回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。它还会列出 OpenClaw 源码位置：Git checkout 会暴露本地源码根目录，包安装则会提供 GitHub 源码 URL，并指示在文档不完整或过时时到那里查看源码。

提示会把文档设定为 OpenClaw 自身知识的权威来源，用于模型理解 OpenClaw 的工作方式（记忆/每日笔记、会话、工具、Gateway 网关、配置、命令、项目上下文）之前，并告诉模型将 `AGENTS.md`、项目上下文、工作区/配置文件/记忆笔记以及 `memory_search` 视为指令上下文或用户记忆，而不是 OpenClaw 设计/实现知识。如果文档没有说明或已经过时，模型应说明这一点并检查源码。它还会告诉模型在可能时自行运行 `openclaw status`，只有在缺少访问权限时才询问用户。

对于配置，它会特别指引智能体使用 `gateway` 工具操作 `config.schema.lookup` 获取精确到字段级别的文档和约束，然后再参考 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 获取更广泛的指导。

## 相关

- [Agent runtime](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
