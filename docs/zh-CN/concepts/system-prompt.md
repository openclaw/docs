---
read_when:
    - 编辑系统提示词文本、工具列表或时间/Heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示包含什么以及如何组装
title: 系统提示
x-i18n:
    generated_at: "2026-06-27T01:55:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次智能体运行构建自定义系统提示词。该提示词由 **OpenClaw 拥有**，不使用运行时默认提示词。

提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提示词组装分为三层：

- `buildAgentSystemPrompt` 根据显式输入渲染提示词。它应当
  保持为纯渲染器，不应直接读取全局配置。
- `resolveAgentSystemPromptConfig` 为特定智能体解析由配置支持的提示词旋钮，例如
  所有者显示、TTS 提示、模型别名、记忆引用模式和子智能体
  委派模式。
- 运行时适配器（嵌入式、CLI、命令/导出预览、压缩）收集
  实时事实，例如工具、沙箱状态、渠道能力、上下文文件
  和提供商提示词贡献，然后调用已配置的提示词 facade。

这能让导出/调试提示词表面与实时运行保持一致，同时避免把
每个运行时特定细节都塞进一个单体构建器。

提供商插件可以贡献具备缓存感知能力的提示词指导，而无需替换
完整的 OpenClaw 拥有的提示词。提供商运行时可以：

- 替换一小组具名核心段落（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示词缓存边界上方注入一个**稳定前缀**
- 在提示词缓存边界下方注入一个**动态后缀**

将提供商拥有的贡献用于特定模型系列的调优。保留旧版
`before_prompt_build` 提示词变更用于兼容性或真正全局的提示词
变更，而不是普通提供商行为。

OpenAI GPT-5 系列叠加层会让核心执行规则保持精简，并添加
针对模型的指导，覆盖人格锁定、简洁输出、工具纪律、
并行查找、交付物覆盖、验证、缺失上下文和
终端工具卫生。

## 结构

提示词刻意保持紧凑，并使用固定段落：

- **工具**：结构化工具可信源提醒，以及运行时工具使用指导。
- **执行倾向**：紧凑的跟进到底指导：对可执行请求在当前轮次中行动，
  持续推进直到完成或受阻，从较弱的工具结果中恢复，
  实时检查可变状态，并在最终答复前验证。
- **安全**：简短的护栏提醒，避免寻求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 Skills 指令。
- **OpenClaw 控制**：告诉模型优先使用 `gateway` 工具进行
  配置/重启工作，并避免编造 CLI 命令。
- **OpenClaw 自更新**：如何使用 `config.schema.lookup` 安全检查配置，
  使用 `config.patch` 修补配置，使用 `config.apply` 替换完整
  配置，并且仅在用户明确请求时运行 `update.run`。面向智能体的
  `gateway` 工具也会拒绝重写 `tools.exec.ask` / `tools.exec.security`，
  包括会规范化到这些受保护 Exec 路径的旧版 `tools.bash.*`
  别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档/源码的本地路径，以及何时读取它们。
- **工作区文件（已注入）**：表示引导文件已包含在下方。
- **沙箱**（启用时）：表示沙箱隔离运行时、沙箱路径，以及是否可用提升权限的 Exec。
- **当前日期和时间**：仅时区（缓存稳定；实时钟来自 `session_status`）。
- **助手输出指令**：紧凑的附件、语音备注和回复标签语法。
- **Heartbeats**：当默认智能体启用 Heartbeats 时的 Heartbeat 提示词和确认行为。
- **运行时**：主机、OS、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + /reasoning 切换提示。

OpenClaw 会把大型稳定内容（包括**项目上下文**）放在内部提示词缓存边界上方。
易变的渠道/会话段落，例如 Control UI 嵌入指导、**消息传递**、**语音**、
**群聊上下文**、**回应**、**Heartbeats** 和**运行时**，会追加到该边界下方，
这样带前缀缓存的本地后端就能在多个渠道轮次之间复用稳定的工作区前缀。
同样，当已接受的 schema 已经携带当前渠道名称这类运行时细节时，
工具描述也应避免嵌入这些名称。

工具段落还包含针对长时间运行工作的运行时指导：

- 对未来跟进（`check back later`、提醒、周期性工作）使用 cron，
  而不是 `exec` 睡眠循环、`yieldMs` 延迟技巧或重复的 `process`
  轮询
- 仅将 `exec` / `process` 用于现在启动并继续在后台运行的命令
- 当启用自动完成唤醒时，只启动一次命令，并在它产生输出或失败时
  依赖基于推送的唤醒路径
- 当需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是
  基于推送的，并会自动向请求者回报
- 不要在循环中轮询 `subagents list` / `sessions_list`，只为了等待完成

`agents.defaults.subagents.delegationMode` 可以强化这类指导。默认的
`suggest` 模式保留基线提示。`prefer` 会添加专门的
**子智能体委派**段落，告诉主智能体作为响应迅速的协调者行动，
并把任何比直接回复更复杂的事项通过 `sessions_spawn` 推出。
这只是提示词层面的；工具策略仍然控制 `sessions_spawn` 是否可用。

当启用实验性 `update_plan` 工具时，工具段落还会告诉模型
只在非平凡的多步骤工作中使用它，始终只保留一个
`in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示词中的安全护栏是建议性的。它们指导模型行为，但不强制执行策略。
请使用工具策略、Exec 审批、沙箱隔离和渠道 allowlist 进行硬性执行；
操作员可以按设计禁用这些机制。

在具有原生审批卡片/按钮的渠道上，运行时提示词现在会告诉
智能体优先依赖该原生审批 UI。只有当工具结果表示聊天审批不可用，
或手动审批是唯一路径时，它才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置
`promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上方所有段落。
- `minimal`：用于子智能体；省略**记忆召回**、**OpenClaw
  自更新**、**模型别名**、**用户身份**、**助手输出指令**、
  **消息传递**、**静默回复**和 **Heartbeats**。工具、**安全**、
  提供时的 **Skills**、工作区、沙箱、当前日期和时间（已知时）、
  运行时以及注入的上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词标记为**子智能体上下文**，
而不是**群聊上下文**。

对于渠道自动回复运行，当直接、群组或仅消息工具上下文拥有可见回复
合约时，OpenClaw 会省略通用的**静默回复**段落。只有旧的自动
群组/渠道模式应显示 `NO_REPLY`；直接聊天和仅消息工具回复不会收到
静默令牌指导。

## 提示词快照

OpenClaw 会在
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下保留
已提交的 Codex runtime 快乐路径提示词快照。它们会渲染选定的
应用服务器线程/轮次参数，以及为 Telegram 直接消息、Discord 群组
和 Heartbeat 轮次重建的模型绑定提示词层栈。该栈包括一个固定的
Codex `gpt-5.5` 模型提示词 fixture，它由 Codex 的模型目录/缓存形状生成，
还包括 Codex 快乐路径权限开发者文本、OpenClaw 开发者指令、
当 OpenClaw 提供时的轮次范围协作模式指令、用户轮次输入，
以及对动态工具规范的引用。

使用 `pnpm prompt:snapshots:sync-codex-model` 刷新固定的 Codex 模型提示词 fixture。
默认情况下，该脚本会在 `$CODEX_HOME/models_cache.json` 查找 Codex 的运行时缓存，
然后查找 `~/.codex/models_cache.json`，最后才回退到维护者 Codex
检出约定路径 `~/code/codex/codex-rs/models-manager/models.json`。
如果这些来源都不存在，命令会退出且不更改已提交的 fixture。
传入 `--catalog <path>` 可从指定的 `models_cache.json` 或 `models.json`
文件刷新。

这些快照仍然不是逐字节的原始 OpenAI 请求捕获。Codex 可以在 OpenClaw
发送线程和轮次参数之后，在 Codex runtime 内添加运行时拥有的工作区上下文，
例如 `AGENTS.md`、环境上下文、记忆、应用/插件指令，以及内置的 Default
协作模式指令。

使用 `pnpm prompt:snapshots:gen` 重新生成它们，并使用
`pnpm prompt:snapshots:check` 验证漂移。CI 会在额外的边界分片中运行
漂移检查，以便提示词变更和快照更新保持附着在同一个 PR 上。

## 工作区引导注入

引导文件会从活跃工作区解析，然后路由到与其生命周期匹配的提示词表面：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅限全新工作区）
- 存在时的 `MEMORY.md`

在原生 Codex harness 上，OpenClaw 会避免在每个用户轮次中重复稳定的工作区文件。
Codex 会通过自己的项目文档发现机制加载 `AGENTS.md`。`SOUL.md`、
`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 会作为 Codex 开发者指令转发。
紧凑的 OpenClaw Skills 列表也会作为轮次范围的协作开发者指令转发。
`HEARTBEAT.md` 内容不会被注入；当该文件存在且非空时，Heartbeat 轮次会获得一条
指向该文件的协作模式说明。来自已配置智能体工作区的 `MEMORY.md` 内容不会粘贴到
每个原生 Codex 轮次中；当该工作区可用记忆工具时，Codex 轮次会在轮次范围的
协作开发者指令中获得一条简短的工作区记忆说明，并应在持久记忆相关时使用
`memory_search` 或 `memory_get`。如果工具被禁用、记忆搜索不可用，或活跃工作区
不同于智能体记忆工作区，`MEMORY.md` 会回退到正常的有界轮次上下文路径。
活跃的 `BOOTSTRAP.md` 内容目前仍保留正常的轮次上下文角色。

在非 Codex harness 上，引导文件继续按现有门控组合进 OpenClaw 提示词。
当默认智能体禁用 Heartbeats，或 `agents.defaults.heartbeat.includeSystemPromptSection`
为 false 时，`HEARTBEAT.md` 会在正常运行中省略。保持注入文件简洁，尤其是
非 Codex 的 `MEMORY.md`。`MEMORY.md` 旨在保持为经过整理的长期摘要；
详细的每日笔记应放在 `memory/*.md` 中，供 `memory_search` 和 `memory_get`
按需检索。过大的非 Codex `MEMORY.md` 文件会增加提示词用量，并可能因下方
引导文件限制而只被部分注入。

<Note>
`memory/*.md` 每日文件**不是**正常引导项目上下文的一部分。在普通轮次中，它们会通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取它们，否则它们不会计入上下文窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以把最近的每日记忆作为一次性启动上下文块前置到该首个轮次。
</Note>

大文件会使用标记截断。每个文件的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（默认值：20000）。跨文件注入的引导内容总量
由 `agents.defaults.bootstrapTotalMaxChars` 限制
（默认值：60000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，
OpenClaw 可以注入一条简洁的系统提示警告通知；可通过
`agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；
默认值：`always`）控制。详细的原始/注入计数会保留在诊断信息中，例如
`/context`、`/status`、Doctor 和日志。

对于记忆文件，截断并不意味着数据丢失：文件在磁盘上保持完整。
在原生 Codex 上，如果可用，`MEMORY.md` 会按需通过记忆工具读取；
当工具无法运行时，会使用有界的提示回退。在其他
harness 上，模型只能看到缩短后的注入副本，直到它直接读取或搜索记忆。
如果那里的 `MEMORY.md` 被反复截断，请将其提炼成更短的持久摘要，并把详细历史移入 `memory/*.md`，
或者有意提高引导限制。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件
会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截此步骤，以修改或替换
注入的引导文件（例如将 `SOUL.md` 替换为另一种人格设定）。

如果你想让智能体听起来不那么通用，请从
[SOUL.md 人格指南](/zh-CN/concepts/soul) 开始。

若要检查每个注入文件贡献了多少内容（原始与注入、截断情况，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见[上下文](/zh-CN/concepts/context)。

## 时间处理

当用户时区已知时，系统提示会包含专用的 **当前日期和时间** 部分。
为保持提示缓存稳定，它现在只包含
**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；状态卡片
包含一行时间戳。同一工具也可以选择性地设置按会话的模型
覆盖（`model=default` 会清除它）。

配置项：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为详情见[日期和时间](/zh-CN/date-time)。

## Skills

当存在符合条件的 Skills 时，OpenClaw 会注入一个紧凑的 **可用 Skills 列表**
（`formatSkillsForPrompt`），其中包含每个 Skill 的 **文件路径** 和从内容派生的
`<version>` 标记。该提示会指示模型使用 `read`
加载列出位置处的 SKILL.md（工作区、托管或内置），
并在某个 Skill 的 `<version>` 与上一轮不同时重新读取它。如果没有
符合条件的 Skills，则省略 Skills 部分。

原生 Codex 轮次会将此列表作为轮次范围内的协作开发者
指令接收，而不是作为每轮用户输入；但会保留精确计划提示的轻量 cron 轮次除外。
其他 harness 会保留常规提示
部分。

位置可以指向嵌套 Skill，例如
`skills/personal/foo/SKILL.md`。嵌套仅用于组织；提示仍然
使用 `SKILL.md` frontmatter 中的扁平 Skill 名称。

资格条件包括 Skill 元数据门控、运行时环境/配置检查，
以及配置了 `agents.defaults.skills` 或
`agents.list[].skills` 时的有效智能体 Skill allowlist。

插件内置的 Skills 只有在其所属插件启用时才符合条件。
这使工具插件可以公开更深入的操作指南，而无需将所有
相关指南直接嵌入每个工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

这样可以保持基础提示较小，同时仍然支持定向使用 Skill。

Skills 列表预算由 Skills 子系统拥有：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 按智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用另一个配置面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分使 Skills 大小与运行时读取/注入大小保持分离，例如
`memory_get`、实时工具结果，以及压缩后的 AGENTS.md 刷新。

## 文档

系统提示包含一个 **文档** 部分。当本地文档可用时，它会
指向本地 OpenClaw 文档目录（Git checkout 中的 `docs/`，或内置 npm
包文档）。如果本地文档不可用，它会回退到
[https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一部分还包含 OpenClaw 源码位置。Git checkouts 会暴露本地
源码根目录，以便智能体可以直接检查代码。包安装会包含 GitHub
源码 URL，并告知智能体在文档不完整或过时时去那里审查源码。
提示还会提到公共文档镜像、社区 Discord 和用于发现 Skills 的 ClawHub
（[https://clawhub.ai](https://clawhub.ai)）。在模型理解 OpenClaw 的工作方式之前，
它会将文档定位为 OpenClaw 自身知识的权威来源，
包括记忆/每日笔记、会话、工具、Gateway 网关、配置、命令或项目
上下文。提示会告诉模型优先使用本地文档（或本地文档
不可用时使用文档镜像），并将 AGENTS.md、项目上下文、工作区/配置文件/记忆
笔记和 `memory_search` 视为指令上下文或用户记忆，而不是 OpenClaw
设计或实现知识。如果文档没有相关内容或已过时，模型应说明这一点
并检查源码。提示还会告诉模型在可能时自行运行 `openclaw status`，
只有在缺少访问权限时才询问用户。
对于配置，提示会专门指向 `gateway` 工具操作
`config.schema.lookup`，以获取精确到字段级别的文档和约束，然后再查看
`docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md`
以获取更广泛的指导。

## 相关

- [智能体运行时](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
