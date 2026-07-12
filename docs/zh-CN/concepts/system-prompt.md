---
read_when:
    - 编辑系统提示词文本、工具列表或时间/Heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含的内容及其组装方式
title: 系统提示词
x-i18n:
    generated_at: "2026-07-11T20:31:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw 会为每次智能体运行构建自己的系统提示词；不存在运行时默认提示词。

组装分为三层：

- `buildAgentSystemPrompt` 根据显式输入渲染提示词。它保持为纯渲染器，不直接读取全局配置。
- `resolveAgentSystemPromptConfig` 为特定智能体解析由配置支持的提示词调节项（所有者显示、TTS 提示、模型别名、记忆引用模式、子智能体委派模式）。
- 运行时适配器（嵌入式、CLI、命令/导出预览、压缩）收集实时信息（工具、沙箱状态、渠道能力、上下文文件、提供商提示词贡献），并调用已配置的提示词门面。

这样可让导出/调试提示词界面与实时运行保持一致，而不必将每项运行时细节都塞进一个单体构建器。

提供商插件可以提供支持缓存的指导，而不必替换由 OpenClaw 所有的提示词。提供商运行时可以：

- 替换三个具名核心区段之一：`interaction_style`、`tool_call_style`、`execution_bias`
- 在提示词缓存边界上方注入**稳定前缀**
- 在提示词缓存边界下方注入**动态后缀**

使用提供商所有的贡献对特定模型系列进行调优。仅为兼容性或真正的全局提示词更改保留旧版 `before_prompt_build` 钩子。

内置的 OpenAI/Codex GPT-5 系列叠加层（`resolveGpt5SystemPromptContribution`）使用此机制：由 `stablePrefix` 行为契约（执行策略、工具纪律、输出契约、完成契约）以及可选的 `interaction_style` 覆盖组成，后者用于提供更友好的语气。它适用于经 OpenAI 或 Codex 插件路由的任何 `gpt-5*` 模型 ID，并由 `agents.defaults.promptOverlays.gpt5.personality`（`"friendly"`/`"on"` 或 `"off"`）控制。

## 结构

提示词结构紧凑，包含以下固定区段：

- **工具使用**：提醒结构化工具是事实来源，并提供运行时工具使用指导。启用实验性 `update_plan` 工具（`tools.experimental.planTool`）后，其自身的工具说明会补充：仅将其用于非简单的多步骤工作、最多只让一个步骤处于 `in_progress` 状态，并对简单的单步骤工作跳过该工具。
- **执行倾向**：在当前轮次中处理可执行的请求，持续执行直至完成或受阻，从效果不佳的工具结果中恢复，实时检查可变状态，并在最终确定前进行验证。
- **安全**：简短提醒安全护栏，防止追求权力的行为或绕过监督。
- **Skills**（可用时）：告知模型如何按需加载 Skills 指令。
- **OpenClaw 控制**：进行配置/重启工作时优先使用 `gateway` 工具；不要虚构 CLI 命令。
- **OpenClaw 自更新**：使用 `config.schema.lookup` 安全检查配置，使用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，并且仅在用户明确要求时运行 `update.run`。面向智能体的 `gateway` 工具会拒绝改写 `tools.exec.ask` / `tools.exec.security`，包括会规范化为这些受保护路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：本地文档/源代码路径以及应在何时读取它们。
- **工作区文件（已注入）**：说明下方已包含引导文件。
- **沙箱**（启用时）：沙箱隔离的运行时、沙箱路径、提升权限 Exec 的可用性。
- **当前日期和时间**：仅包含时区（缓存稳定；实时时钟来自 `session_status`）。
- **助手输出指令**：简洁的附件、语音消息和回复标签语法。
- **Heartbeat**：为默认智能体启用 Heartbeat 时使用的 Heartbeat 提示词和确认行为。
- **运行时**：主机、操作系统、节点、模型、仓库根目录（检测到时）、思考级别（单行）。
- **推理**：当前可见性级别以及 `/reasoning` 切换提示。

大量稳定内容（包括**项目上下文**）保留在内部提示词缓存边界上方。每轮易变的区段（Control UI 嵌入指导、**消息传递**、**语音**、**群聊上下文**、**表情回应**、**Heartbeat**、**运行时**）追加在该边界下方，以便具有前缀缓存的本地后端能够跨渠道轮次复用稳定的工作区前缀。如果已接受的架构已携带当前渠道名称这一运行时细节，工具说明应避免再次嵌入该名称。

工具使用区段还包含长时间运行工作方面的指导：

- 对未来的后续工作（`check back later`、提醒、周期性工作）使用 cron，而不是 `exec` 休眠循环、`yieldMs` 延迟技巧或反复轮询 `process`
- 仅将 `exec` / `process` 用于立即启动并在后台继续运行的命令
- 启用自动完成唤醒后，只启动一次命令，并依靠基于推送的唤醒路径
- 使用 `process` 获取运行中命令的日志、状态、输入，或对其进行干预
- 对于较大型任务，优先使用 `sessions_spawn`；子智能体完成通知基于推送，并会自动向请求者发送通知
- 不要仅为等待任务完成而循环轮询 `subagents list` / `sessions_list`

`agents.defaults.subagents.delegationMode`（默认值为 `"suggest"`）可以强化此行为。`"prefer"` 会添加专门的**子智能体委派**区段，要求主智能体充当响应及时的协调者，并通过 `sessions_spawn` 推送任何比直接回复更复杂的工作。这仅影响提示词；工具策略仍控制 `sessions_spawn` 是否可用。

系统提示词中的安全护栏仅提供建议，不负责强制执行。使用工具策略、Exec 审批、沙箱隔离和渠道允许列表进行强制执行；操作员可以按设计禁用提示词护栏。

对于具有原生审批卡片/按钮的渠道，提示词会要求智能体优先依靠该界面，并且仅在工具结果表明聊天审批不可用或手动审批是唯一途径时，才包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 会为子智能体渲染较小的系统提示词。运行时为每次运行设置一个 `promptMode`（并非面向用户的配置）：

- `full`（默认）：包含上述所有区段。
- `minimal`：用于子智能体；省略记忆提示词区段（以**记忆回想**形式内置）、**OpenClaw 自更新**、**模型别名**、**用户身份**、**助手输出指令**、**消息传递**、**静默回复**和 **Heartbeat**。工具使用、**安全**、**Skills**（提供时）、工作区、沙箱、当前日期和时间（已知时）、运行时以及注入的上下文仍然可用。
- `none`：仅返回基础身份行。

在 `promptMode=minimal` 下，额外注入的提示词标记为**子智能体上下文**，而非**群聊上下文**。

对于渠道自动回复运行，如果直接聊天、群聊或仅消息工具上下文已负责可见回复契约，OpenClaw 会省略通用的**静默回复**区段。只有旧版自动群组/渠道模式会显示 `NO_REPLY`；直接聊天和仅消息工具回复会跳过静默令牌指导。

## 提示词快照

OpenClaw 在 `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/` 下维护 Codex runtime 标准路径的已提交提示词快照。它们会渲染选定的应用服务器线程/轮次参数，以及为 Telegram 直接聊天、Discord 群组和 Heartbeat 轮次重建的模型绑定提示词层堆栈：固定的 Codex `gpt-5.5` 模型提示词夹具、Codex 标准路径权限开发者文本、OpenClaw 开发者指令、由 OpenClaw 提供时的轮次范围协作模式指令、用户轮次输入，以及对动态工具规范的引用。

使用 `pnpm prompt:snapshots:sync-codex-model` 刷新固定的 Codex 模型提示词夹具。默认情况下，它依次查找 `$CODEX_HOME/models_cache.json`、`~/.codex/models_cache.json`，然后查找维护者检出目录约定路径 `~/code/codex/codex-rs/models-manager/models.json`；如果均不存在，则退出且不更改已提交的夹具。传入 `--catalog <path>` 可从指定的 `models_cache.json` 或 `models.json` 文件刷新。

这些快照并非逐字节的原始 OpenAI 请求捕获。OpenClaw 发送线程和轮次参数后，Codex 还可能添加由运行时所有的工作区上下文（`AGENTS.md`、环境上下文、记忆、应用/插件指令、内置的 Default 协作模式指令）。

使用 `pnpm prompt:snapshots:gen` 重新生成；使用 `pnpm prompt:snapshots:check` 验证漂移。CI 会将漂移检查与附加边界分片一起运行，因此提示词更改和快照更新会在同一个 PR 中合入。

## 工作区引导注入

引导文件从活动工作区解析，并根据其生命周期路由到相应的提示词界面：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅用于全新工作区）
- 存在时的 `MEMORY.md`

在原生 Codex harness 上，OpenClaw 会避免在每个用户轮次中重复稳定的工作区文件。Codex 通过自身的项目文档发现机制加载 `AGENTS.md`。`TOOLS.md` 作为继承的 Codex 开发者指令转发。`SOUL.md`、`IDENTITY.md` 和 `USER.md` 作为轮次范围的协作开发者指令转发，因此原生 Codex 子智能体不会继承它们。不会直接注入 `HEARTBEAT.md` 的内容；当该文件存在且非空时，Heartbeat 轮次会获得一条指向该文件的协作模式说明。也不会将 `MEMORY.md` 的内容粘贴到每个原生 Codex 轮次中：当工作区可使用记忆工具时，Codex 轮次会获得一条简短的工作区记忆说明，引导模型使用 `memory_search` 或 `memory_get`。如果工具被禁用、记忆搜索不可用，或活动工作区与智能体记忆工作区不同，则 `MEMORY.md` 会回退到常规的有界轮次上下文路径。`BOOTSTRAP.md` 保持常规的轮次上下文角色。

在非 Codex harness 上，引导文件会按照现有门控条件组合到 OpenClaw 提示词中。如果默认智能体禁用了 Heartbeat，或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false，则正常运行时会省略 `HEARTBEAT.md`。保持注入文件简洁，尤其是非 Codex 环境中的 `MEMORY.md`：它应当保持为经过整理的长期摘要，详细的每日笔记应存放在 `memory/*.md` 中，并可通过 `memory_search` / `memory_get` 按需检索。过大的非 Codex `MEMORY.md` 文件会增加提示词用量，并且可能因下述引导文件限制而仅得到部分注入。

<Note>
`memory/*.md` 每日文件**不属于**常规引导项目上下文。在普通轮次中，它们通过 `memory_search` / `memory_get` 按需访问，因此除非模型明确读取，否则不会占用上下文窗口。单独的 `/new` 和 `/reset` 轮次是例外：运行时可以为其第一个轮次预置近期每日记忆，作为一次性的启动上下文块。
</Note>

大文件会截断并附加标记：

| 限制                                         | 配置键                                             | 默认值   |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| 每个文件的最大字符数                         | `agents.defaults.bootstrapMaxChars`                | 20000    |
| 所有文件的总字符数                           | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| 截断警告（`off`\|`once`\|`always`）          | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

缺失的文件会注入一个简短的文件缺失标记。详细的原始/注入计数保留在 `/context`、`/status`、Doctor 和日志等诊断信息中。

对于记忆文件，截断并不意味着数据丢失：磁盘上的文件保持完整。在原生 Codex 上，当记忆工具可用时，`MEMORY.md` 会通过记忆工具按需读取，否则使用有界提示词回退路径。在其他 harness 上，在模型直接读取或搜索记忆之前，它只能看到缩短后的注入副本。如果 `MEMORY.md` 反复被截断，请将其提炼为更短的持久摘要、将详细历史移至 `memory/*.md`，或有意提高引导限制。

子智能体会话仅注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持较小的子智能体上下文）。

内部钩子可以通过 `agent:bootstrap` 事件拦截此步骤，以修改或替换注入的引导文件（例如将 `SOUL.md` 替换为另一种人格设定）。

若要让表达不那么泛化，请从 [SOUL.md 人格指南](/zh-CN/concepts/soul)开始。

若要检查每个注入文件的上下文占用（原始内容与注入内容、截断情况、工具 schema 开销），请使用 `/context list` 或 `/context detail`。请参阅[上下文](/zh-CN/concepts/context)。

## 时间处理

仅当用户时区已知时，才会显示**当前日期和时间**部分；其中仅包含**时区**（不包含动态时钟或时间格式），以保持提示缓存稳定。

当智能体需要当前时间时，请使用 `session_status`；其状态卡中包含时间戳行。该工具还可以选择性地设置按会话生效的模型覆盖（`model=default` 会将其清除）。

使用以下配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

有关完整行为的详细信息，请参阅[时区](/zh-CN/concepts/timezone)和[日期与时间](/zh-CN/date-time)。

## Skills

存在符合条件的 Skills 时，OpenClaw 会注入精简的 `<available_skills>` 列表（`formatSkillsForPrompt`），其中包含每个 Skills 的**文件路径**以及根据内容生成的 `<version>sha256:...</version>` 标记。提示会指示模型使用 `read` 加载所列位置（工作区、托管目录或内置目录）中的 SKILL.md，并在 Skills 的 `<version>` 与上一轮不同时重新读取。如果没有符合条件的 Skills，则省略 Skills 部分。

原生 Codex 轮次会将此列表作为仅对当前轮次生效的协作开发者指令接收，而不是每轮用户输入；但保留精确定时提示的轻量级 cron 轮次除外。其他 harness 仍使用常规提示部分。

该位置可以指向嵌套的 Skills，例如 `skills/personal/foo/SKILL.md`。嵌套仅用于组织；提示使用 `SKILL.md` frontmatter 中的扁平 Skills 名称。

资格判定包括 Skills 元数据门控、运行时环境/配置检查，以及配置 `agents.defaults.skills` 或 `agents.list[].skills` 时生效的智能体 Skills 允许列表。仅当所属插件已启用时，插件内置的 Skills 才符合条件，这使工具插件可以提供更深入的操作指南，而无须将所有相关指导嵌入每个工具描述中。

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

这样既能保持基础提示精简，又能支持有针对性地使用 Skills。大小限制由 Skills 子系统负责，与通用运行时读取/注入大小限制相互独立：

| 范围     | Skills 提示预算                                   | 运行时摘录预算                    |
| --------- | ------------------------------------------------- | --------------------------------- |
| 全局      | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*` |
| 每个智能体 | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`   |

运行时摘录预算涵盖 `memory_get`、实时工具结果，以及压缩后的 `AGENTS.md` 刷新内容。

## 文档

如果本地文档可用（Git 检出中的 `docs/` 或内置 npm 包文档），**文档**部分会指向本地文档；否则回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。其中还会列出 OpenClaw 源代码位置：Git 检出会提供本地源代码根目录，软件包安装则会提供 GitHub 源代码 URL，并指示在文档不完整或过时时到该处查看源代码。

在模型理解 OpenClaw 的工作方式（记忆/每日笔记、会话、工具、Gateway 网关、配置、命令、项目上下文）之前，提示会将文档定位为 OpenClaw 自身知识的权威来源，并指示模型将 `AGENTS.md`、项目上下文、工作区/配置档案/记忆笔记以及 `memory_search` 视为指令上下文或用户记忆，而不是 OpenClaw 的设计/实现知识。如果文档未说明或已过时，模型应明确指出并检查源代码。提示还会指示模型尽可能自行运行 `openclaw status`，仅在没有访问权限时才询问用户。

对于具体配置，提示会先指引智能体使用 `gateway` 工具操作 `config.schema.lookup` 获取准确的字段级文档和约束，再查阅 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 获取更全面的指导。

## 相关内容

- [智能体运行时](/zh-CN/concepts/agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
